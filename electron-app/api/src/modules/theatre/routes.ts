import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { str, optStr, dateIso } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import type { Guards } from '../../lib/guards.js';
import { facilityScope } from '../../lib/scope.js';
import { assertPatientAccess } from '../patients/service.js';

const SURGERY_FLOW: Record<string, string[]> = {
  BOOKED: ['SCHEDULED', 'CANCELLED'],
  SCHEDULED: ['PRE_OP', 'CANCELLED'],
  PRE_OP: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['RECOVERY'],
  RECOVERY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

/** Theatre / surgery (spec §28) — bookings, consent and case progression. */
export function registerTheatreRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  // ----------------------------------------------------------------- list
  app.get(
    '/theatre/bookings',
    { preHandler: guards.requirePermission('view_patient', 'write_clinical_note', 'view_dashboard'), schema: { summary: 'Surgical bookings (scoped)', tags: ['theatre'] } },
    async (request) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const where: Record<string, unknown> = { ...facilityScope(u) };
      if (str(q.status, 'status')) where.status = str(q.status, 'status').toUpperCase();
      if (str(q.urgency, 'urgency')) where.urgency = str(q.urgency, 'urgency').toUpperCase();
      const items = await db.surgicalBooking.findMany({
        where,
        orderBy: { scheduledFor: 'asc' },
        take: 100,
        include: {
          patient: { select: { id: true, mrn: true, fullName: true } },
          surgeon: { select: { id: true, fullName: true } },
          anaesthetist: { select: { id: true, fullName: true } },
          facility: { select: { name: true } },
        },
      });
      const byStatus: Record<string, number> = {};
      for (const b of items) byStatus[b.status] = (byStatus[b.status] ?? 0) + 1;
      return { items, count: items.length, byStatus };
    },
  );

  // --------------------------------------------------------------- create
  app.post(
    '/theatre/bookings',
    { preHandler: guards.requirePermission('write_clinical_note', 'manage_theatre'), schema: { summary: 'Book a surgical case', tags: ['theatre'] } },
    async (request) => {
      const u = request.user!;
      if (!u.facilityId) throw httpErrors.forbidden('Booking requires a facility');
      const body = (request.body ?? {}) as Record<string, unknown>;
      const patientId = str(body.patientId, 'patientId', { required: true });
      await assertPatientAccess(db, u, patientId);
      const procedure = str(body.procedure, 'procedure', { required: true, max: 190 });
      const booking = await db.surgicalBooking.create({
        data: {
          patientId,
          facilityId: u.facilityId,
          procedure,
          theatre: optStr(body.theatre),
          surgeonId: optStr(body.surgeonId),
          anaesthetistId: optStr(body.anaesthetistId),
          urgency: (optStr(body.urgency) ?? 'ROUTINE').toUpperCase(),
          status: 'BOOKED',
          scheduledFor: dateIso(body.scheduledFor, 'scheduledFor'),
          preOpAssessment: optStr(body.preOpAssessment),
        },
      });
      recordAudit(db, request, { action: 'surgicalBooking.create', entityType: 'surgicalBooking', entityId: booking.id, after: { procedure, urgency: booking.urgency } });
      return { booking };
    },
  );

  // ------------------------------------------------------------- consent
  app.post(
    '/theatre/bookings/:id/consent',
    { preHandler: guards.requirePermission('write_clinical_note', 'manage_theatre'), schema: { summary: 'Record informed consent', tags: ['theatre'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const booking = await db.surgicalBooking.findFirst({ where: { id: params.id, ...facilityScope(u) } });
      if (!booking) throw httpErrors.notFound('Booking not found in scope');
      const updated = await db.surgicalBooking.update({
        where: { id: booking.id },
        data: {
          consentObtained: body.consentObtained !== false,
          consentDate: body.consentObtained === false ? null : new Date(),
          consentNote: optStr(body.consentNote),
        },
      });
      recordAudit(db, request, { action: 'surgicalBooking.consent', entityType: 'surgicalBooking', entityId: booking.id, after: { consentObtained: updated.consentObtained } });
      return { booking: updated };
    },
  );

  // -------------------------------------------------------------- status
  app.post(
    '/theatre/bookings/:id/status',
    { preHandler: guards.requirePermission('write_clinical_note', 'manage_theatre'), schema: { summary: 'Progress a surgical case (schedule → pre-op → theatre → recovery)', tags: ['theatre'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const next = str(body.status, 'status', { required: true }).toUpperCase();
      const booking = await db.surgicalBooking.findFirst({ where: { id: params.id, ...facilityScope(u) } });
      if (!booking) throw httpErrors.notFound('Booking not found in scope');
      const allowed = SURGERY_FLOW[booking.status] ?? [];
      if (!allowed.includes(next)) throw httpErrors.conflict(`Cannot move case from ${booking.status} to ${next} (allowed: ${allowed.join(', ') || 'none'})`);

      const data: Record<string, unknown> = { status: next };
      if (next === 'SCHEDULED' && !booking.scheduledFor) data.scheduledFor = dateIso(body.scheduledFor, 'scheduledFor') ?? new Date();
      if (next === 'PRE_OP' && !booking.consentObtained) {
        throw httpErrors.conflict('Informed consent must be recorded before pre-operative care');
      }
      if (next === 'PRE_OP') data.preOpAssessment = optStr(body.preOpAssessment) ?? booking.preOpAssessment;
      if (next === 'IN_PROGRESS') data.intraOpNotes = optStr(body.intraOpNotes);
      if (next === 'RECOVERY') data.postOpNotes = optStr(body.postOpNotes) ?? booking.postOpNotes;
      if (next === 'COMPLETED') data.postOpNotes = optStr(body.postOpNotes) ?? booking.postOpNotes;

      const updated = await db.surgicalBooking.update({ where: { id: booking.id }, data });
      recordAudit(db, request, { action: 'surgicalBooking.status', entityType: 'surgicalBooking', entityId: booking.id, after: { from: booking.status, to: next } });
      return { booking: updated };
    },
  );
}
