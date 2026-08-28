// -----------------------------------------------------------------------------
// Imaging & radiology (spec §24, docs/13 §10) — radiology orders with the
// same discipline as laboratory: a request (ORDERED) flows through the study
// (IN_PROGRESS) to the radiologist's report (REPORTED → VERIFIED), or is
// cancelled. Patient-scoped ordering follows the lab pattern
// (assertPatientAccess); the radiology worklist is scope-aware like the lab
// worklist (facility / region / district / national). The DICOM/PACS image
// transport itself remains a future integration — this module carries the
// order, study status and the structured report.
// -----------------------------------------------------------------------------

import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { str, optStr } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import type { Guards } from '../../lib/guards.js';
import { dashboardScope } from '../../lib/scope.js';
import { assertPatientAccess } from '../patients/service.js';

const MODALITIES = ['X_RAY', 'ULTRASOUND', 'CT', 'MRI', 'MAMMOGRAPHY', 'FLUOROSCOPY', 'OTHER'];
const STATUSES = ['ORDERED', 'IN_PROGRESS', 'REPORTED', 'VERIFIED', 'CANCELLED'];
// Legal status transitions (mirrors the teleconsultation lifecycle discipline).
const TRANSITIONS: Record<string, string[]> = {
  ORDERED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['REPORTED', 'CANCELLED'],
  REPORTED: ['VERIFIED', 'CANCELLED'],
  VERIFIED: [],
  CANCELLED: [],
};

const PATIENT_SELECT = {
  select: { id: true, mrn: true, fullName: true, phone: true, dateOfBirth: true },
} as const;

export function registerImagingRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  // ------------------------------------------------------------ ordering
  app.post(
    '/patients/:id/imaging-orders',
    { preHandler: guards.requirePermission('order_imaging'), schema: { summary: 'Order an imaging study (radiology request)', tags: ['imaging'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      await assertPatientAccess(db, u, params.id);
      const body = (request.body ?? {}) as Record<string, unknown>;
      const encounterId = str(body.encounterId, 'encounterId', { required: true });
      const encounter = await db.encounter.findFirst({ where: { id: encounterId, patientId: params.id } });
      if (!encounter) throw httpErrors.notFound('Encounter not found for this patient');
      const modality = (optStr(body.modality) ?? 'X_RAY').toUpperCase();
      if (!MODALITIES.includes(modality)) throw httpErrors.badRequest(`modality must be one of: ${MODALITIES.join(', ')}`);
      const order = await db.imagingOrder.create({
        data: {
          encounterId,
          patientId: params.id,
          facilityId: u.facilityId ?? undefined,
          modality,
          bodyPart: optStr(body.bodyPart),
          clinicalQuestion: optStr(body.clinicalQuestion),
          requestedById: u.id,
          idempotencyKey: optStr(body.idempotencyKey),
          clientTimestamp: body.clientTimestamp ? new Date(String(body.clientTimestamp)) : undefined,
        },
      });
      recordAudit(db, request, { action: 'imagingOrder.create', entityType: 'imagingOrder', entityId: order.id, after: { patientId: params.id, modality } });
      return { order };
    },
  );

  app.get(
    '/patients/:id/imaging-orders',
    { preHandler: guards.requirePermission('view_clinical_record', 'view_patient'), schema: { summary: "List a patient's imaging orders", tags: ['imaging'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      await assertPatientAccess(db, u, params.id);
      const items = await db.imagingOrder.findMany({
        where: { patientId: params.id },
        orderBy: { createdAt: 'desc' },
        include: { encounter: { select: { id: true, type: true } } },
      });
      return { items, count: items.length };
    },
  );

  app.patch(
    '/patients/:id/imaging-orders/:orderId',
    { preHandler: guards.requirePermission('order_imaging', 'verify_imaging'), schema: { summary: 'Transition an imaging order (start study / cancel)', tags: ['imaging'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string; orderId: string };
      await assertPatientAccess(db, u, params.id);
      const body = (request.body ?? {}) as Record<string, unknown>;
      const existing = await db.imagingOrder.findFirst({ where: { id: params.orderId, patientId: params.id } });
      if (!existing) throw httpErrors.notFound('Imaging order not found');
      const status = optStr(body.status);
      if (!status) throw httpErrors.badRequest('status is required');
      const s = status.toUpperCase();
      if (!STATUSES.includes(s)) throw httpErrors.badRequest(`status must be one of: ${STATUSES.join(', ')}`);
      if (!TRANSITIONS[existing.status]?.includes(s)) {
        throw httpErrors.conflict(`Cannot transition imaging order from ${existing.status} to ${s}`);
      }
      const order = await db.imagingOrder.update({ where: { id: existing.id }, data: { status: s } });
      recordAudit(db, request, { action: 'imagingOrder.update', entityType: 'imagingOrder', entityId: order.id, after: { patientId: params.id, from: existing.status, to: s } });
      return { order };
    },
  );

  app.post(
    '/patients/:id/imaging-orders/:orderId/report',
    { preHandler: guards.requirePermission('verify_imaging'), schema: { summary: 'Enter + verify the radiologist report', tags: ['imaging'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string; orderId: string };
      await assertPatientAccess(db, u, params.id);
      const body = (request.body ?? {}) as Record<string, unknown>;
      const order = await db.imagingOrder.findFirst({ where: { id: params.orderId, patientId: params.id } });
      if (!order) throw httpErrors.notFound('Imaging order not found');
      if (order.status === 'CANCELLED') throw httpErrors.conflict('A cancelled imaging order cannot be reported');
      const report = str(body.report, 'report', { required: true, max: 4000 });
      const updated = await db.imagingOrder.update({
        where: { id: order.id },
        data: { report, impression: optStr(body.impression), reportedById: u.id, status: 'VERIFIED' },
      });
      recordAudit(db, request, { action: 'imagingOrder.verify', entityType: 'imagingOrder', entityId: order.id, after: { patientId: params.id } });
      return { order: updated };
    },
  );

  // ------------------------------------------------------------ worklist
  app.get(
    '/imaging/orders',
    { preHandler: guards.requirePermission('order_imaging', 'verify_imaging'), schema: { summary: 'Radiology worklist — pending imaging orders', tags: ['imaging'] } },
    async (request) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const status = optStr(q.status) ?? 'ALL';
      const modality = optStr(q.modality);
      const scope = dashboardScope(u);
      const where: Record<string, unknown> = {
        ...scope,
        status: status === 'ALL' ? { in: ['ORDERED', 'IN_PROGRESS', 'REPORTED'] } : status,
      };
      if (modality) where.modality = modality.toUpperCase();
      const items = await db.imagingOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { patient: PATIENT_SELECT },
      });
      return { items, count: items.length };
    },
  );

  app.post(
    '/imaging/orders/:orderId/report',
    { preHandler: guards.requirePermission('verify_imaging'), schema: { summary: 'Enter + verify a radiologist report from the worklist', tags: ['imaging'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { orderId: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const order = await db.imagingOrder.findFirst({
        where: { id: params.orderId, ...dashboardScope(u) },
        include: { patient: { select: { id: true } } },
      });
      if (!order) throw httpErrors.notFound('Imaging order not found in scope');
      if (order.status === 'CANCELLED') throw httpErrors.conflict('A cancelled imaging order cannot be reported');
      const report = str(body.report, 'report', { required: true, max: 4000 });
      const updated = await db.imagingOrder.update({
        where: { id: order.id },
        data: { report, impression: optStr(body.impression), reportedById: u.id, status: 'VERIFIED' },
      });
      recordAudit(db, request, { action: 'imagingOrder.verify', entityType: 'imagingOrder', entityId: order.id, after: { patientId: order.patient.id } });
      return { order: updated };
    },
  );
}
