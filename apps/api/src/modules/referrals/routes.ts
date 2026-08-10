import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { str, optStr } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import type { Guards } from '../../lib/guards.js';
import { assertPatientAccess } from '../patients/service.js';

/** Referral rows carry fromFacilityId (no facilityId column) — scope by patient. */
function referralScope(u: { scope: string; regionId?: string | null; districtId?: string | null; facilityId?: string | null }) {
  if (u.scope === 'REGIONAL') return u.regionId ? { patient: { regionId: u.regionId } } : { patient: { regionId: '__deny__' } };
  if (u.scope === 'DISTRICT') return u.districtId ? { patient: { districtId: u.districtId } } : { patient: { districtId: '__deny__' } };
  if (u.scope === 'FACILITY') return u.facilityId ? { OR: [{ fromFacilityId: u.facilityId }, { toFacilityId: u.facilityId }] } : { fromFacilityId: '__deny__' };
  return {};
}

const REFERRAL_FLOW: Record<string, string[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['RECEIVED', 'REJECTED', 'CANCELLED'],
  RECEIVED: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['AWAITING_TRANSPORT', 'COMPLETED'],
  AWAITING_TRANSPORT: ['IN_TRANSIT', 'COMPLETED'],
  IN_TRANSIT: ['ARRIVED', 'COMPLETED'],
  ARRIVED: ['COMPLETED', 'RETURNED'],
  COMPLETED: [],
  REJECTED: ['RETURNED', 'SUBMITTED'],
  RETURNED: ['COMPLETED'],
  CANCELLED: [],
};

/** Referral network (spec §31, §32) — create, track and respond to referrals. */
export function registerReferralRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  // ----------------------------------------------------------------- create
  app.post(
    '/referrals',
    { preHandler: guards.requirePermission('write_clinical_note', 'view_patient'), schema: { summary: 'Create a referral to a receiving facility', tags: ['referrals'] } },
    async (request) => {
      const u = request.user!;
      const body = (request.body ?? {}) as Record<string, unknown>;
      const patientId = str(body.patientId, 'patientId', { required: true });
      await assertPatientAccess(db, u, patientId);

      const toFacilityId = optStr(body.toFacilityId);
      const toFacilityName = optStr(body.toFacilityName);
      if (!toFacilityId && !toFacilityName) throw httpErrors.badRequest('Provide a receiving facility or facility name');
      const receiving = toFacilityId ? await db.facility.findUnique({ where: { id: toFacilityId } }) : null;
      if (toFacilityId && !receiving) throw httpErrors.badRequest('Receiving facility not found');

      const referral = await db.referral.create({
        data: {
          patientId,
          fromFacilityId: u.facilityId ?? '',
          toFacilityId: toFacilityId ?? undefined,
          toFacilityName: toFacilityName ?? receiving?.name,
          specialty: optStr(body.specialty),
          urgency: (optStr(body.urgency) ?? 'ROUTINE').toUpperCase(),
          summary: optStr(body.summary),
          status: 'SUBMITTED',
        },
      });
      recordAudit(db, request, { action: 'referral.create', entityType: 'referral', entityId: referral.id, after: { toFacilityId, urgency: referral.urgency } });
      return { referral };
    },
  );

  // ------------------------------------------------------------ list both
  app.get(
    '/referrals',
    { preHandler: guards.requirePermission('view_patient', 'view_clinical_record'), schema: { summary: 'List referrals (outgoing/incoming, scoped)', tags: ['referrals'] } },
    async (request) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const direction = optStr(q.direction) ?? 'outgoing'; // outgoing | incoming | all
      const status = optStr(q.status);
      const scope = referralScope(u);

      // Outgoing: referrals this facility sent. Incoming: sent to this facility.
      const where: Record<string, unknown> = { ...scope };
      if (u.scope === 'FACILITY' && u.facilityId) {
        if (direction === 'outgoing') where.fromFacilityId = u.facilityId;
        else if (direction === 'incoming') where.toFacilityId = u.facilityId;
      } else if (direction === 'incoming' && q.toFacilityId) {
        where.toFacilityId = str(q.toFacilityId, 'toFacilityId');
      }
      if (status) where.status = str(status, 'status').toUpperCase();

      const items = await db.referral.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          patient: { select: { id: true, mrn: true, fullName: true } },
          facility: { select: { id: true, name: true } },
        },
      });
      // Resolve receiving-facility name if it's a real facility id.
      const toIds = [...new Set(items.map((r) => r.toFacilityId).filter((x): x is string => !!x))];
      const facilities = toIds.length
        ? await db.facility.findMany({ where: { id: { in: toIds } }, select: { id: true, name: true } })
        : [];
      const nameById = new Map(facilities.map((f) => [f.id, f.name]));
      return {
        items: items.map((r) => ({
          ...r,
          toFacilityName: r.toFacilityName ?? (r.toFacilityId ? nameById.get(r.toFacilityId) ?? null : null),
          fromFacilityName: r.facility?.name ?? null,
        })),
        count: items.length,
      };
    },
  );

  // ---------------------------------------------------------- transitions
  app.post(
    '/referrals/:id/status',
    { preHandler: guards.requirePermission('write_clinical_note', 'view_patient'), schema: { summary: 'Transition a referral (accept/reject/complete…)', tags: ['referrals'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const next = str(body.status, 'status', { required: true }).toUpperCase();
      const referral = await db.referral.findUnique({ where: { id: params.id } });
      if (!referral) throw httpErrors.notFound('Referral not found');

      // Scope: only the sending facility (or national/regional scope) may update.
      const inScope = u.scope === 'NATIONAL'
        || (u.scope === 'REGIONAL' && !!u.regionId)
        || (u.scope === 'DISTRICT' && !!u.districtId)
        || (u.scope === 'FACILITY' && !!u.facilityId && (referral.fromFacilityId === u.facilityId || referral.toFacilityId === u.facilityId));
      if (!inScope) throw httpErrors.forbidden('No access to this referral');

      const allowed = REFERRAL_FLOW[referral.status] ?? [];
      if (!allowed.includes(next)) {
        throw httpErrors.conflict(`Cannot move referral from ${referral.status} to ${next} (allowed: ${allowed.join(', ') || 'none'})`);
      }
      const updated = await db.referral.update({
        where: { id: referral.id },
        data: { status: next },
      });
      recordAudit(db, request, { action: 'referral.status', entityType: 'referral', entityId: referral.id, after: { from: referral.status, to: next } });
      return { referral: updated };
    },
  );
}
