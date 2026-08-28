// -----------------------------------------------------------------------------
// Telemedicine (spec §82–83, docs/13 §9) — remote consultations. The API
// models the full consultation lifecycle — SCHEDULED → IN_PROGRESS →
// COMPLETED | CANCELLED | MISSED — with a join-link placeholder for the
// future video/phone transport, which plugs in behind these same endpoints.
//
// Patient-scoped booking follows the maternity pattern (assertPatientAccess);
// the clinician worklist is scope-aware (a facility clinician sees their own
// facility's consultations plus any assigned to them personally, regional and
// district users their administrative scope).
// -----------------------------------------------------------------------------

import type { FastifyInstance } from 'fastify';
import type { Prisma, PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { optStr, dateIso } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import type { Guards } from '../../lib/guards.js';
import { assertPatientAccess } from '../patients/service.js';
import type { AuthUser } from '../../types.js';

const MODES = ['VIDEO', 'PHONE', 'CHAT'];
const STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'MISSED'];

// Legal transitions of the consultation lifecycle.
const TRANSITIONS: Record<string, string[]> = {
  SCHEDULED: ['IN_PROGRESS', 'CANCELLED', 'MISSED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  MISSED: [],
};

function teleconsultationScope(u: AuthUser): Prisma.TeleconsultationWhereInput {
  if (u.scope === 'NATIONAL') return {};
  if (u.scope === 'REGIONAL' && u.regionId) return { facility: { regionId: u.regionId } };
  if (u.scope === 'DISTRICT' && u.districtId) return { facility: { districtId: u.districtId } };
  if (u.scope === 'FACILITY' && u.facilityId) return { OR: [{ facilityId: u.facilityId }, { clinicianId: u.id }] };
  // PATIENT scope (or a scope-less user) only sees consultations assigned to
  // them; patient-portal access to a booking goes through the patient routes.
  return { clinicianId: u.id };
}

export function registerTelemedicineRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  // --------------------------------------------------------------- booking
  app.post(
    '/patients/:id/teleconsultations',
    { preHandler: guards.requirePermission('write_clinical_note'), schema: { summary: 'Book a teleconsultation', tags: ['telemedicine'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      await assertPatientAccess(db, u, params.id);
      const body = (request.body ?? {}) as Record<string, unknown>;
      const mode = (optStr(body.mode) ?? 'VIDEO').toUpperCase();
      if (!MODES.includes(mode)) throw httpErrors.badRequest(`mode must be one of: ${MODES.join(', ')}`);
      const scheduledFor = dateIso(body.scheduledFor, 'scheduledFor', { required: true }) ?? new Date();
      const clinicianId = optStr(body.clinicianId);
      if (clinicianId) {
        const clinician = await db.user.findUnique({ where: { id: clinicianId } });
        if (!clinician) throw httpErrors.badRequest('clinicianId does not match any user');
      }
      const consultation = await db.teleconsultation.create({
        data: {
          patientId: params.id,
          clinicianId,
          facilityId: u.facilityId ?? undefined,
          mode,
          status: 'SCHEDULED',
          scheduledFor,
          notes: optStr(body.notes),
        },
      });
      recordAudit(db, request, {
        action: 'teleconsultation.book',
        entityType: 'teleconsultation',
        entityId: consultation.id,
        after: { patientId: params.id, mode, scheduledFor: scheduledFor.toISOString(), clinicianId: clinicianId ?? null },
      });
      return { consultation };
    },
  );

  app.get(
    '/patients/:id/teleconsultations',
    { preHandler: guards.requirePermission('view_clinical_record', 'view_patient'), schema: { summary: "List a patient's teleconsultations", tags: ['telemedicine'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      await assertPatientAccess(db, u, params.id);
      const items = await db.teleconsultation.findMany({
        where: { patientId: params.id },
        orderBy: { scheduledFor: 'desc' },
        include: { clinician: { select: { id: true, fullName: true } } },
      });
      return { items, count: items.length };
    },
  );

  // -------------------------------------------------------------- worklist
  app.get(
    '/teleconsultations',
    { preHandler: guards.requirePermission('view_clinical_record', 'view_patient'), schema: { summary: 'Scoped clinician worklist of teleconsultations', tags: ['telemedicine'] } },
    async (request) => {
      const u = request.user!;
      const query = request.query as Record<string, unknown>;
      const where: Prisma.TeleconsultationWhereInput = teleconsultationScope(u);
      const status = optStr(query.status);
      if (status) {
        const s = status.toUpperCase();
        if (!STATUSES.includes(s)) throw httpErrors.badRequest(`status must be one of: ${STATUSES.join(', ')}`);
        where.status = s;
      }
      const items = await db.teleconsultation.findMany({
        where,
        orderBy: [{ status: 'asc' }, { scheduledFor: 'asc' }],
        include: { patient: { select: { id: true, fullName: true, mrn: true, phone: true } }, clinician: { select: { id: true, fullName: true } } },
      });
      return { items, count: items.length };
    },
  );

  // ---------------------------------------------------------- transitions
  app.patch(
    '/teleconsultations/:id',
    { preHandler: guards.requirePermission('write_clinical_note'), schema: { summary: 'Transition a teleconsultation (start / complete / cancel / miss)', tags: ['telemedicine'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const existing = await db.teleconsultation.findUnique({ where: { id: params.id } });
      if (!existing) throw httpErrors.notFound('Teleconsultation not found');

      // The assigned clinician always owns their consultation; anyone else
      // must have record-level access to the patient (facility/region/district).
      if (existing.clinicianId !== u.id) {
        await assertPatientAccess(db, u, existing.patientId);
      }

      const body = (request.body ?? {}) as Record<string, unknown>;
      const status = optStr(body.status);
      if (!status) throw httpErrors.badRequest('status is required');
      const s = status.toUpperCase();
      if (!STATUSES.includes(s)) throw httpErrors.badRequest(`status must be one of: ${STATUSES.join(', ')}`);
      if (!TRANSITIONS[existing.status]?.includes(s)) {
        throw httpErrors.conflict(`Cannot transition teleconsultation from ${existing.status} to ${s}`);
      }

      const data: Record<string, unknown> = { status: s };
      if (s === 'IN_PROGRESS') data.startedAt = new Date();
      if (s === 'COMPLETED') {
        data.endedAt = new Date();
        if (body.outcome !== undefined) data.outcome = optStr(body.outcome) ?? undefined;
      }
      if (body.notes !== undefined) data.notes = optStr(body.notes) ?? undefined;
      if (body.joinUrl !== undefined && s === 'IN_PROGRESS') data.joinUrl = optStr(body.joinUrl) ?? undefined;

      const consultation = await db.teleconsultation.update({ where: { id: existing.id }, data });
      recordAudit(db, request, {
        action: `teleconsultation.${s.toLowerCase()}`,
        entityType: 'teleconsultation',
        entityId: consultation.id,
        after: { patientId: existing.patientId, from: existing.status, to: s },
      });
      return { consultation };
    },
  );
}
