import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { str, optStr } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import type { Guards } from '../../lib/guards.js';
import { assertPatientAccess } from '../patients/service.js';
import { facilityScope } from '../../lib/scope.js';

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

/**
 * Which side of the referral may perform each transition. Facility users act
 * for their own facility only: the sending facility cancels/resubmits/closes,
 * the receiving facility receives/accepts/rejects/returns. National, regional
 * and district scopes (oversight) may perform every transition.
 */
const TRANSITION_VERB: Record<string, string> = {
  SUBMITTED: 'resubmit',
  RECEIVED: 'mark this referral received',
  ACCEPTED: 'accept',
  REJECTED: 'reject',
  AWAITING_TRANSPORT: 'start transport for',
  IN_TRANSIT: 'mark in transit',
  ARRIVED: 'mark arrived',
  RETURNED: 'return',
  COMPLETED: 'complete',
  CANCELLED: 'cancel',
};

const ACTOR_FOR: Record<string, 'sender' | 'receiver' | 'either'> = {
  'SUBMITTED>CANCELLED': 'sender',
  'SUBMITTED>RECEIVED': 'receiver',
  'SUBMITTED>REJECTED': 'receiver',
  'RECEIVED>ACCEPTED': 'receiver',
  'RECEIVED>REJECTED': 'receiver',
  'ACCEPTED>AWAITING_TRANSPORT': 'either',
  'ACCEPTED>COMPLETED': 'sender',
  'AWAITING_TRANSPORT>IN_TRANSIT': 'either',
  'AWAITING_TRANSPORT>COMPLETED': 'sender',
  'IN_TRANSIT>ARRIVED': 'receiver',
  'IN_TRANSIT>COMPLETED': 'sender',
  'ARRIVED>COMPLETED': 'either',
  'ARRIVED>RETURNED': 'receiver',
  'REJECTED>SUBMITTED': 'sender',
  'REJECTED>RETURNED': 'receiver',
  'RETURNED>COMPLETED': 'sender',
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
      const urgency = optStr(q.urgency);
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
      if (urgency) where.urgency = str(urgency, 'urgency').toUpperCase();

      const items = await db.referral.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          patient: { select: { id: true, mrn: true, fullName: true } },
          facility: { select: { id: true, name: true } },
          ambulance: { select: { id: true, registration: true, driverName: true } },
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
      const note = optStr(body.note);
      const ambulanceId = optStr(body.ambulanceId);
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

      // Role-aware step: facility users only act on their own side of the flow.
      if (u.scope === 'FACILITY') {
        const side: 'sender' | 'receiver' = referral.fromFacilityId === u.facilityId ? 'sender' : 'receiver';
        const required = ACTOR_FOR[`${referral.status}>${next}`] ?? 'either';
        if (required !== 'either' && required !== side) {
          const who = required === 'sender' ? 'sending facility' : 'receiving facility';
          const verb = TRANSITION_VERB[next] ?? 'perform this action on';
          throw httpErrors.forbidden(`Only the ${who} may ${verb} a referral`);
        }
      }

      // Transport handoff: pick an ambulance when transport starts, release it
      // when the journey ends. Only the facility owning the fleet may assign it.
      let ambulance = ambulanceId ? await db.ambulance.findFirst({ where: { id: ambulanceId, ...facilityScope(u) } }) : null;
      if (ambulanceId && !ambulance) throw httpErrors.notFound('Ambulance not found in scope');
      // Moving in-transit continues on the ambulance already linked to this
      // referral — no need to re-select it.
      if (!ambulance && next === 'IN_TRANSIT' && referral.ambulanceId) {
        ambulance = await db.ambulance.findUnique({ where: { id: referral.ambulanceId } });
      }

      const now = new Date();
      const data: Record<string, unknown> = { status: next };
      if (note) data.note = note;
      if (next === 'RECEIVED') data.receivedAt = now;
      if (next === 'ACCEPTED') data.acceptedAt = now;
      if (next === 'REJECTED') data.rejectedAt = now;
      if (next === 'ARRIVED') data.arrivedAt = now;
      if (next === 'COMPLETED') data.completedAt = now;
      if (next === 'CANCELLED') data.cancelledAt = now;
      if (ambulance) {
        if (next !== 'AWAITING_TRANSPORT' && next !== 'IN_TRANSIT') {
          throw httpErrors.badRequest('An ambulance can only be assigned when arranging or starting transport');
        }
        const alreadyAssigned = referral.ambulanceId === ambulance.id;
        const idle = ambulance.status === 'AVAILABLE' || ambulance.status === 'RETURNING';
        if (next === 'AWAITING_TRANSPORT' && !idle) {
          throw httpErrors.conflict(`Ambulance ${ambulance.registration} is ${ambulance.status} — not available`);
        }
        if (next === 'IN_TRANSIT' && !alreadyAssigned && !idle) {
          throw httpErrors.conflict(`Ambulance ${ambulance.registration} is ${ambulance.status} — not available`);
        }
        // Persist the link for both transport steps so the release logic always
        // knows which ambulance this referral assigned.
        data.ambulanceId = ambulance.id;
      }

      const updated = await db.$transaction(async (tx) => {
        const row = await tx.referral.update({ where: { id: referral.id }, data });
        if (ambulance) {
          if (next === 'AWAITING_TRANSPORT') {
            await tx.ambulance.update({ where: { id: ambulance.id }, data: { status: 'ASSIGNED' } });
          } else if (next === 'IN_TRANSIT') {
            await tx.ambulance.update({ where: { id: ambulance.id }, data: { status: 'TRANSPORTING' } });
          }
        }
        return row;
      });

      // Journey finished → release the assigned ambulance back to the fleet.
      if (['ARRIVED', 'COMPLETED', 'RETURNED'].includes(next) && referral.ambulanceId) {
        const active = await db.ambulance.findUnique({ where: { id: referral.ambulanceId } });
        if (active && ['ASSIGNED', 'TRANSPORTING', 'EN_ROUTE', 'AT_SCENE', 'AT_FACILITY', 'RETURNING'].includes(active.status)) {
          await db.ambulance.update({ where: { id: active.id }, data: { status: 'AVAILABLE' } });
        }
      }

      recordAudit(db, request, {
        action: 'referral.status',
        entityType: 'referral',
        entityId: referral.id,
        after: { from: referral.status, to: next, note: note ?? null, ambulanceId: ambulanceId ?? null },
      });
      return { referral: updated };
    },
  );
}
