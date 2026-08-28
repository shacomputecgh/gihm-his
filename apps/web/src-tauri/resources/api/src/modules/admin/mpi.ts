import type { FastifyInstance } from 'fastify';
import type { Prisma, PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { str, optStr } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import type { Guards } from '../../lib/guards.js';
import { patientScope } from '../../lib/scope.js';
import { scoreCandidates, type MpiInput } from '../../lib/mpi.js';

// Entity types whose records follow the patient id. Used to move records on
// merge and restore them on unmerge (spec §12 — reversible, never silent).
const CHILD_ENTITIES = [
  'encounter',
  'labOrder',
  'prescription',
  'admission',
  'referral',
  'invoice',
  'immunization',
  'diseaseCase',
  'queueEntry',
  'appointment',
  'patientIdentifier',
  'patientContact',
] as const;

type ChildEntity = (typeof CHILD_ENTITIES)[number];

function modelFor(e: ChildEntity) {
  return {
    encounter: 'encounter',
    labOrder: 'labOrder',
    prescription: 'prescription',
    admission: 'admission',
    referral: 'referral',
    invoice: 'invoice',
    immunization: 'immunization',
    diseaseCase: 'diseaseCase',
    queueEntry: 'queueEntry',
    appointment: 'appointment',
    patientIdentifier: 'patientIdentifier',
    patientContact: 'patientContact',
  }[e] as 'encounter' | 'labOrder' | 'prescription' | 'admission' | 'referral' | 'invoice' | 'immunization' | 'diseaseCase' | 'queueEntry' | 'appointment' | 'patientIdentifier' | 'patientContact';
}

function norm(s: string | null | undefined): string {
  return (s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
}

/** Deterministic pair key so the same pair is only reported once. */
function pairKey(a: string, b: string): string {
  return [a, b].sort().join('|');
}

/**
 * MPI duplicate-review queue (spec §12): scans patients in the caller's scope,
 * finds pairs sharing identity attributes, and scores them like registration
 * does. Manual review + merge/unmerge only — never auto-merges.
 */
export function registerMpiRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  app.get(
    '/admin/mpi/duplicates',
    { preHandler: guards.requirePermission('manage_patient_records', 'view_patient'), schema: { summary: 'Scan for likely duplicate patient records', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const scope = patientScope(u);
      const minScore = Math.max(40, Math.min(100, Number(q.minScore) || 60));

      const patients = await db.patient.findMany({ where: scope, take: 500 });
      const seen = new Set<string>();
      const pairs: unknown[] = [];

      // Group by normalized name / phone / identifiers to avoid O(n²) over the
      // whole registry; candidate groups are small in practice.
      const byName = new Map<string, typeof patients>();
      const byPhone = new Map<string, typeof patients>();
      const byCard = new Map<string, typeof patients>();
      for (const p of patients) {
        const n = norm(p.fullName);
        if (n) {
          const g = byName.get(n) ?? [];
          g.push(p);
          byName.set(n, g);
        }
        const ph = norm(p.phone);
        if (ph) {
          const g = byPhone.get(ph) ?? [];
          g.push(p);
          byPhone.set(ph, g);
        }
        const c = norm(p.ghanaCard);
        if (c) {
          const g = byCard.get(c) ?? [];
          g.push(p);
          byCard.set(c, g);
        }
      }

      // For each patient, compare against the small candidate groups that share
      // a name, phone or national identifier — avoids a full O(n²) scan.
      for (const p of patients) {
        const name = norm(p.fullName);
        const phone = norm(p.phone);
        const card = norm(p.ghanaCard);
        const groups: typeof patients[] = [];
        if (name) groups.push(byName.get(name) ?? []);
        if (phone) groups.push(byPhone.get(phone) ?? []);
        if (card) groups.push(byCard.get(card) ?? []);
        const checked = new Set<string>();
        for (const g of groups) {
          for (const b of g) {
            if (b.id === p.id || checked.has(b.id)) continue;
            checked.add(b.id);
            const key = pairKey(p.id, b.id);
            if (seen.has(key)) continue;
            const input: MpiInput = {
              fullName: p.fullName,
              dateOfBirth: p.dateOfBirth,
              phone: p.phone,
              ghanaCard: p.ghanaCard,
              nhisNumber: p.nhisNumber,
              sex: p.sex,
            };
            const candidates = scoreCandidates([b], input);
            const top = candidates[0];
            if (top && top.score >= minScore) {
              seen.add(key);
              pairs.push({
                a: { patientId: p.id, mrn: p.mrn, fullName: p.fullName, dateOfBirth: p.dateOfBirth, phone: p.phone, status: p.status },
                b: { patientId: b.id, mrn: b.mrn, fullName: b.fullName, dateOfBirth: b.dateOfBirth, phone: b.phone, status: b.status },
                score: top.score,
                matchedOn: top.matchedOn,
              });
            }
          }
        }
      }

      pairs.sort((x, y) => (y as { score: number }).score - (x as { score: number }).score);
      return { items: pairs, count: pairs.length };
    },
  );

  // ------------------------------------------------------------------ merge
  app.post(
    '/admin/mpi/merge/:sourceId/into/:targetId',
    { preHandler: guards.requirePermission('manage_patient_records'), schema: { summary: 'Merge one patient record into another (MPI, reversible)', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { sourceId: string; targetId: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const reason = optStr(body.reason);

      if (params.sourceId === params.targetId) throw httpErrors.badRequest('Cannot merge a patient into itself');
      const [source, target] = await Promise.all([
        db.patient.findUnique({ where: { id: params.sourceId } }),
        db.patient.findUnique({ where: { id: params.targetId } }),
      ]);
      if (!source || !target) throw httpErrors.notFound('Patient record not found');
      if (source.status === 'MERGED') throw httpErrors.conflict('Source record is already merged');
      if (target.status === 'MERGED') throw httpErrors.conflict('Target record is merged — merge into an active record');
      // Scope guard: both records must be reachable from the caller's scope.
      const scope = patientScope(u);
      const inScope = await db.patient.count({ where: { id: { in: [source.id, target.id] }, ...scope } });
      if (inScope !== 2) throw httpErrors.forbidden('No access to one or both patient records');

      // Move every child record, remembering ids so the merge can be undone.
      // The whole move + final writes run in ONE transaction: a failure partway
      // (e.g. an identifier collision on the target) rolls everything back, so
      // a half-merged state with no audit record can never occur.
      const moved = await db.$transaction(async (tx) => {
        const movedInner: Record<string, string[]> = {};
        for (const e of CHILD_ENTITIES) {
          const model = modelFor(e);
          const rows = await (tx[model] as { findMany: (a: unknown) => Promise<{ id: string }[]> }).findMany({
            where: { patientId: source.id },
            select: { id: true },
          });
          if (rows.length === 0) continue;
          const ids = rows.map((r) => r.id);
          await (tx[model] as { updateMany: (a: unknown) => Promise<unknown> }).updateMany({
            where: { id: { in: ids } },
            data: { patientId: target.id },
          });
          movedInner[e] = ids;
        }
        await tx.patient.update({ where: { id: source.id }, data: { status: 'MERGED', mergedIntoId: target.id } });
        await tx.patientMerge.create({
          data: {
            sourcePatientId: source.id,
            targetPatientId: target.id,
            sourceMrn: source.mrn,
            targetMrn: target.mrn,
            reason,
            movedEntities: JSON.stringify(movedInner),
            mergedById: u.id,
          },
        });
        return movedInner;
      });
      recordAudit(db, request, {
        action: 'patient.merge',
        entityType: 'patient',
        entityId: target.id,
        after: { sourceId: source.id, sourceMrn: source.mrn, targetMrn: target.mrn, moved },
        reason,
      });
      return { merged: true, sourceId: source.id, targetId: target.id, moved };
    },
  );

  // ---------------------------------------------------------------- unmerge
  app.post(
    '/admin/mpi/unmerge/:patientId',
    { preHandler: guards.requirePermission('manage_patient_records'), schema: { summary: 'Reverse the most recent merge for a patient (reversible)', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { patientId: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const reason = optStr(body.reason);

      const scope = patientScope(u);
      const patient = await db.patient.findUnique({ where: { id: params.patientId } });
      if (!patient) throw httpErrors.notFound('Patient record not found');
      const inScope = await db.patient.count({ where: { id: patient.id, ...scope } });
      if (inScope !== 1) throw httpErrors.forbidden('No access to this patient record');

      // Latest merge where this record was the merged-away source and not yet unmerged.
      const merge = await db.patientMerge.findFirst({
        where: { sourcePatientId: patient.id, unmergedAt: null },
        orderBy: { mergedAt: 'desc' },
      });
      if (!merge) {
        // Maybe it was the target: reverse merges where this record absorbed another.
        const asTarget = await db.patientMerge.findFirst({
          where: { targetPatientId: patient.id, unmergedAt: null },
          orderBy: { mergedAt: 'desc' },
        });
        if (!asTarget) throw httpErrors.conflict('No reversible merge found for this patient');
        return reverseMerge(db, request, u.id, asTarget, reason);
      }
      return reverseMerge(db, request, u.id, merge, reason);
    },
  );
}

async function reverseMerge(
  db: PrismaClient,
  request: Parameters<typeof recordAudit>[1],
  actorId: string,
  merge: { id: string; sourcePatientId: string; targetPatientId: string; sourceMrn: string; targetMrn: string; movedEntities: string },
  reason?: string,
) {
  const moved = JSON.parse(merge.movedEntities || '{}') as Record<string, string[]>;
  const target = await db.patient.findUnique({ where: { id: merge.targetPatientId } });
  const source = await db.patient.findUnique({ where: { id: merge.sourcePatientId } });
  if (!target || !source) throw httpErrors.notFound('Patient record missing for unmerge');

  // Move the exact records that were merged back to the source.
  for (const e of CHILD_ENTITIES) {
    const ids = moved[e];
    if (!ids || ids.length === 0) continue;
    const model = modelFor(e);
    await (db[model] as { updateMany: (a: unknown) => Promise<unknown> }).updateMany({
      where: { id: { in: ids }, patientId: target.id },
      data: { patientId: source.id },
    });
  }

  await db.$transaction([
    db.patient.update({ where: { id: source.id }, data: { status: 'ACTIVE', mergedIntoId: null } }),
    db.patientMerge.update({ where: { id: merge.id }, data: { unmergedAt: new Date(), unmergedById: actorId, unmergeReason: reason } }),
  ]);
  recordAudit(db, request, {
    action: 'patient.unmerge',
    entityType: 'patient',
    entityId: source.id,
    after: { targetId: target.id, sourceMrn: source.mrn, targetMrn: target.mrn },
    reason,
  });
  return { unmerged: true, sourceId: source.id, targetId: target.id };
}
