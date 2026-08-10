import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { str, optStr, dateIso } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import type { Guards } from '../../lib/guards.js';
import type { AuthUser } from '../../types.js';
import { assertPatientAccess } from '../patients/service.js';
import { GHANA_EPI_SCHEDULE, DAY_MS, scheduleItem, nextScheduleItem, type ScheduleItem } from './schedule.js';

/** Whole-day offset from today (positive = future, negative = past). */
function daysUntil(d: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / DAY_MS);
}

/**
 * Data scope for immunization rows: national sees all; regional/district scope
 * through the patient's geography; facility users see doses given at their
 * facility OR registered at their facility (mirrors the referral OR-scope).
 */
function immunizationScope(u: AuthUser): Record<string, unknown> {
  switch (u.scope) {
    case 'REGIONAL':
      return u.regionId ? { patient: { regionId: u.regionId } } : { patient: { regionId: '__deny__' } };
    case 'DISTRICT':
      return u.districtId ? { patient: { districtId: u.districtId } } : { patient: { districtId: '__deny__' } };
    case 'FACILITY':
      return u.facilityId ? { OR: [{ facilityId: u.facilityId }, { patient: { facilityId: u.facilityId } }] } : { facilityId: '__deny__' };
    case 'PATIENT':
      return { patient: { user: { id: u.id } } };
    default:
      return {};
  }
}

const PATIENT_SELECT = {
  select: { id: true, mrn: true, fullName: true, dateOfBirth: true, phone: true, district: { select: { name: true } } },
} as const;

/**
 * Immunization registry (spec §22) — Ghana EPI schedule, dose recording with
 * auto-computed next-due dates, and a defaulter-tracking worklist of children
 * due or overdue for their next dose.
 */
export function registerImmunizationRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  // ------------------------------------------------------------- schedule
  app.get(
    '/immunizations/schedule',
    { preHandler: guards.requirePermission('view_clinical_record', 'view_patient'), schema: { summary: 'Ghana EPI immunization schedule', tags: ['immunization'] } },
    async () => ({ schedule: GHANA_EPI_SCHEDULE }),
  );

  // ------------------------------------------------------------ registry
  app.get(
    '/immunizations',
    { preHandler: guards.requirePermission('view_clinical_record', 'view_patient'), schema: { summary: 'List recorded immunizations (scoped)', tags: ['immunization'] } },
    async (request) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const where: Record<string, unknown> = { ...immunizationScope(u) };
      if (q.patientId) where.patientId = str(q.patientId, 'patientId');
      if (q.vaccine) where.vaccine = str(q.vaccine, 'vaccine').toUpperCase();
      if (q.status) where.status = str(q.status, 'status').toUpperCase();
      const pageSize = Math.max(1, Math.min(500, Number(q.pageSize ?? 200) || 200));

      // Note: Immunization.facilityId is a plain column (no Prisma relation), so
      // facility names are resolved via a separate lookup if ever needed.
      const [items, total] = await Promise.all([
        db.immunization.findMany({ where, orderBy: { administeredAt: 'desc' }, take: pageSize, include: { patient: PATIENT_SELECT } }),
        db.immunization.count({ where }),
      ]);
      return { items, count: items.length, total };
    },
  );

  // ------------------------------------------------------- due / overdue
  // Patients may call this too (via self_access): immunizationScope restricts
  // the result to their own record, so the patient portal can show reminders.
  app.get(
    '/immunizations/due',
    { preHandler: guards.requirePermission('view_clinical_record', 'view_patient', 'self_access'), schema: { summary: 'Defaulter-tracking worklist — doses due or overdue', tags: ['immunization'] } },
    async (request) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const windowDays = Math.max(0, Math.min(365, Number(q.window ?? 30) || 30));
      const bucket = optStr(q.bucket)?.toUpperCase() ?? 'ALL';
      const query = optStr(q.q)?.toLowerCase();

      // The latest given dose per patient+vaccine drives the next-due date.
      // ALL given rows are fetched (including completed series whose nextDueAt is
      // null) so a finished vaccine supersedes earlier doses' stale next-due dates
      // instead of re-flagging the child as overdue.
      const rows = await db.immunization.findMany({
        where: { ...immunizationScope(u), status: 'GIVEN' },
        select: {
          id: true, vaccine: true, dose: true, nextDueAt: true, administeredAt: true, batch: true,
          patient: PATIENT_SELECT,
        },
        orderBy: { administeredAt: 'asc' },
        take: 2000,
      });

      const latest = new Map<string, (typeof rows)[number]>();
      for (const r of rows) {
        const key = `${r.patient.id}|${r.vaccine}`;
        const prev = latest.get(key);
        if (!prev || r.administeredAt > prev.administeredAt) latest.set(key, r);
      }

      // Whole-scope worklist within the look-ahead window — bucket/search filters
      // are applied afterwards so the summary stays truthful.
      const due: Array<{
        id: string;
        patient: { id: string; mrn: string; fullName: string; dateOfBirth: Date | null; phone: string | null; districtName: string | null };
        vaccine: string;
        dose: string;
        description: string;
        lastDoseAt: Date;
        nextDueAt: Date;
        daysUntil: number;
        daysOverdue: number;
        bucket: 'OVERDUE' | 'DUE_SOON';
      }> = [];

      for (const r of latest.values()) {
        if (!r.nextDueAt) continue;
        const days = daysUntil(r.nextDueAt);
        if (days > windowDays) continue; // beyond the look-ahead window
        // Surface the dose that is actually due (the successor in the schedule),
        // so the worklist reads "PENTA 2 overdue" — not "PENTA 1 overdue" — and
        // the quick "Record dose" action pre-fills the right dose.
        const next = nextScheduleItem(r.vaccine, r.dose);
        const dueDose = next ?? { vaccine: r.vaccine, dose: r.dose, description: r.vaccine, label: '—', ageDays: null, intervalDays: null };
        due.push({
          id: r.id,
          patient: {
            id: r.patient.id,
            mrn: r.patient.mrn,
            fullName: r.patient.fullName,
            dateOfBirth: r.patient.dateOfBirth,
            phone: r.patient.phone,
            districtName: r.patient.district?.name ?? null,
          },
          vaccine: dueDose.vaccine,
          dose: dueDose.dose,
          description: dueDose.description,
          lastDoseAt: r.administeredAt,
          nextDueAt: r.nextDueAt,
          daysUntil: days,
          daysOverdue: Math.max(0, -days),
          bucket: days < 0 ? 'OVERDUE' : 'DUE_SOON',
        });
      }

      const summary = { overdue: due.filter((d) => d.bucket === 'OVERDUE').length, dueSoon: due.filter((d) => d.bucket === 'DUE_SOON').length };

      let filtered = due;
      if (bucket !== 'ALL') filtered = filtered.filter((d) => d.bucket === bucket);
      if (query) {
        filtered = filtered.filter((d) => {
          const name = d.patient.fullName.toLowerCase();
          const mrn = d.patient.mrn.toLowerCase();
          return name.includes(query) || mrn.includes(query);
        });
      }

      // Overdue first (most overdue first), then soonest-due.
      filtered.sort((a, b) => (a.bucket !== b.bucket ? (a.bucket === 'OVERDUE' ? -1 : 1) : a.nextDueAt.getTime() - b.nextDueAt.getTime()));
      return { items: filtered.slice(0, 100), count: filtered.length, summary, windowDays, today: new Date().toISOString() };
    },
  );

  // ---------------------------------------------------------- record dose
  app.post(
    '/immunizations',
    { preHandler: guards.requirePermission('write_clinical_note', 'view_patient'), schema: { summary: 'Record an administered vaccine dose', tags: ['immunization'] } },
    async (request) => {
      const u = request.user!;
      const body = (request.body ?? {}) as Record<string, unknown>;
      const patientId = str(body.patientId, 'patientId', { required: true });
      const vaccine = str(body.vaccine, 'vaccine', { required: true }).toUpperCase();
      const dose = str(body.dose, 'dose', { required: true });
      const administeredAt = dateIso(body.administeredAt, 'administeredAt') ?? new Date();
      if (administeredAt.getTime() > Date.now() + DAY_MS) throw httpErrors.badRequest('administeredAt cannot be in the future');

      const item = scheduleItem(vaccine, dose);
      if (!item) throw httpErrors.badRequest(`Unknown vaccine/dose: ${vaccine} ${dose} (see /immunizations/schedule)`);

      const patient = await assertPatientAccess(db, u, patientId);

      const existing = await db.immunization.findFirst({ where: { patientId, vaccine, dose, status: 'GIVEN' } });
      if (existing) throw httpErrors.conflict(`Dose ${vaccine} ${dose} already recorded for this patient on ${existing.administeredAt.toISOString().slice(0, 10)}`);

      // Auto-compute the next due date from the schedule:
      //  - child doses: next due when the child reaches the next dose's age (DOB-based)
      //  - repeat/adult doses: next due a fixed interval after this dose
      let nextDueAt: Date | undefined;
      let next: ScheduleItem | undefined;
      const nxt = nextScheduleItem(vaccine, dose);
      if (nxt) {
        next = nxt;
        if (nxt.ageDays !== null && patient.dateOfBirth) {
          nextDueAt = new Date(patient.dateOfBirth.getTime() + nxt.ageDays * DAY_MS);
        } else if (nxt.intervalDays !== null) {
          nextDueAt = new Date(administeredAt.getTime() + nxt.intervalDays * DAY_MS);
        }
      }

      const immunization = await db.immunization.create({
        data: {
          patientId,
          facilityId: u.facilityId ?? undefined,
          vaccine,
          dose,
          administeredAt,
          nextDueAt,
          batch: optStr(body.batch),
          vaccinatorId: u.id,
          status: 'GIVEN',
        },
      });

      recordAudit(db, request, {
        action: 'immunization.create',
        entityType: 'immunization',
        entityId: immunization.id,
        after: { patientId, vaccine, dose, nextDueAt: nextDueAt?.toISOString() ?? null },
      });

      return {
        immunization,
        next: next
          ? { vaccine: next.vaccine, dose: next.dose, description: next.description, dueAt: nextDueAt?.toISOString() ?? null, label: next.label }
          : null,
      };
    },
  );

  // ---------------------------------------------------- document a miss
  app.post(
    '/immunizations/:id/mark-missed',
    { preHandler: guards.requirePermission('write_clinical_note', 'view_patient'), schema: { summary: 'Mark a due dose as missed (defaulter follow-up)', tags: ['immunization'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const immunization = await db.immunization.findFirst({
        where: { id: params.id, ...immunizationScope(u) },
        include: { patient: { select: { id: true } } },
      });
      if (!immunization) throw httpErrors.notFound('Immunization record not found in scope');
      if (immunization.status !== 'GIVEN') throw httpErrors.conflict('Only a given dose can be marked missed');
      if (!immunization.nextDueAt || daysUntil(immunization.nextDueAt) >= 0) {
        throw httpErrors.conflict('Dose is not overdue yet');
      }
      // Keep nextDueAt: it becomes the "missed since" date for the follow-up list.
      const updated = await db.immunization.update({
        where: { id: immunization.id },
        data: { status: 'MISSED' },
      });
      recordAudit(db, request, { action: 'immunization.markMissed', entityType: 'immunization', entityId: immunization.id, after: { vaccine: immunization.vaccine, dose: immunization.dose } });
      return { immunization: updated };
    },
  );

  // ----------------------------------------------------- missed follow-up
  app.get(
    '/immunizations/missed',
    { preHandler: guards.requirePermission('view_clinical_record', 'view_patient'), schema: { summary: 'Missed-dose defaulters requiring follow-up (scoped)', tags: ['immunization'] } },
    async (request) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const where: Record<string, unknown> = { ...immunizationScope(u), status: 'MISSED' };
      if (q.patientId) where.patientId = str(q.patientId, 'patientId');
      const pageSize = Math.max(1, Math.min(500, Number(q.pageSize ?? 200) || 200));

      const rows = await db.immunization.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        include: { patient: PATIENT_SELECT },
      });

      // The MISSED row is the previously-given dose; the dose that was actually
      // missed is its successor in the schedule (e.g. PENTA 1 given, PENTA 2 missed).
      // A follow-up is RESOLVED once that successor dose has since been recorded
      // as given — the defaulter came back — so it drops off the list.
      const withNext = rows.filter((r) => nextScheduleItem(r.vaccine, r.dose));
      const successors = withNext.map((r) => {
        const n = nextScheduleItem(r.vaccine, r.dose)!;
        return { patientId: r.patientId, vaccine: n.vaccine, dose: n.dose };
      });
      const given = successors.length
        ? await db.immunization.findMany({
            where: { status: 'GIVEN', OR: successors.map((s) => ({ patientId: s.patientId, vaccine: s.vaccine, dose: s.dose })) },
            select: { patientId: true, vaccine: true, dose: true },
          })
        : [];
      const resolvedKeys = new Set(given.map((g) => `${g.patientId}|${g.vaccine}|${g.dose}`));

      const items = withNext
        .filter((r) => {
          const n = nextScheduleItem(r.vaccine, r.dose)!;
          return !resolvedKeys.has(`${r.patientId}|${n.vaccine}|${n.dose}`);
        })
        .map((r) => {
          const missed = nextScheduleItem(r.vaccine, r.dose)!;
          const days = r.nextDueAt ? daysUntil(r.nextDueAt) : null;
          return {
            id: r.id,
            patient: {
              id: r.patient.id,
              mrn: r.patient.mrn,
              fullName: r.patient.fullName,
              dateOfBirth: r.patient.dateOfBirth,
              phone: r.patient.phone,
              districtName: r.patient.district?.name ?? null,
            },
            vaccine: missed.vaccine,
            dose: missed.dose,
            description: missed.description,
            missedSince: r.nextDueAt,
            lastGivenAt: r.administeredAt,
            daysOverdue: days !== null ? Math.max(0, -days) : null,
          };
        });
      return { items, count: items.length, total: items.length };
    },
  );

  // ------------------------------------------------------- remind (stub)
  app.post(
    '/immunizations/:id/remind',
    { preHandler: guards.requirePermission('write_clinical_note', 'view_patient'), schema: { summary: 'Send a reminder recall for a due/missed dose (dispatch stub)', tags: ['immunization'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const channel = (optStr(body.channel) ?? 'SMS').toUpperCase();
      if (!['SMS', 'WHATSAPP'].includes(channel)) throw httpErrors.badRequest('Channel must be SMS or WHATSAPP');

      const immunization = await db.immunization.findFirst({
        where: { id: params.id, ...immunizationScope(u) },
        include: { patient: { select: { id: true, fullName: true, phone: true } } },
      });
      if (!immunization) throw httpErrors.notFound('Immunization record not found in scope');
      if (immunization.status !== 'GIVEN' && immunization.status !== 'MISSED') {
        throw httpErrors.conflict('Only a due or missed dose can be reminded');
      }
      if (!immunization.nextDueAt) throw httpErrors.conflict('No next dose is scheduled for this record');

      // Dispatch integration (SMS/WhatsApp gateway) is not connected yet — the
      // recall is logged to the audit trail so it is never silently dropped and
      // the gateway can be plugged in here later (spec §22 reminders).
      recordAudit(db, request, {
        action: 'immunization.remind',
        entityType: 'immunization',
        entityId: immunization.id,
        after: { channel, to: immunization.patient.phone ?? null, vaccine: immunization.vaccine, dose: immunization.dose, dispatched: false },
      });
      return {
        reminded: true,
        channel,
        to: immunization.patient.phone ?? null,
        dispatched: false,
        note: 'Reminder logged to audit trail — SMS/WhatsApp gateway dispatch is not connected yet.',
      };
    },
  );
}
