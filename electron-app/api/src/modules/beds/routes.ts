import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { str, optStr } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import type { Guards } from '../../lib/guards.js';
import { facilityScope } from '../../lib/scope.js';
import { assertPatientAccess } from '../patients/service.js';

const BED_STATUSES = ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'MAINTENANCE', 'ISOLATION'];

/** Inpatient bed board (spec §18) — status and occupancy per ward. */
export function registerBedRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  // ------------------------------------------------------------------ board
  app.get(
    '/beds',
    { preHandler: guards.requirePermission('view_patient', 'write_clinical_note'), schema: { summary: 'Bed board by ward (scoped)', tags: ['beds'] } },
    async (request) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const scope = facilityScope(u);
      const where: Record<string, unknown> = { ...scope };
      if (str(q.ward, 'ward')) where.ward = str(q.ward, 'ward');
      if (str(q.status, 'status')) where.status = str(q.status, 'status').toUpperCase();
      if (str(q.unitId, 'unitId')) where.unitId = str(q.unitId, 'unitId');

      const beds = await db.bed.findMany({
        where,
        orderBy: [{ ward: 'asc' }, { bedNumber: 'asc' }],
        include: {
          patient: { select: { id: true, mrn: true, fullName: true } },
          facility: { select: { id: true, name: true } },
          // Department → Unit → Ward context so the bed board can be grouped
          // by the hospital structure, not just the free-text ward name.
          unit: { select: { id: true, code: true, name: true, department: { select: { id: true, name: true } } } },
          wardRow: { select: { id: true, name: true } },
        },
      });
      const wards = [...new Set(beds.map((b) => b.ward))].sort();
      const summary = wards.map((ward) => ({
        ward,
        unitName: beds.find((b) => b.ward === ward)?.unit?.name ?? null,
        departmentName: beds.find((b) => b.ward === ward)?.unit?.department?.name ?? null,
        total: beds.filter((b) => b.ward === ward).length,
        occupied: beds.filter((b) => b.ward === ward && b.status === 'OCCUPIED').length,
        available: beds.filter((b) => b.ward === ward && (b.status === 'AVAILABLE' || b.status === 'CLEANING')).length,
      }));
      const units = [...new Map(beds.filter((b) => b.unit).map((b) => [b.unit!.id, b.unit!])).values()];
      return { items: beds, wards, units, summary };
    },
  );

  // --------------------------------------------------------------- status
  app.post(
    '/beds/:id/status',
    { preHandler: guards.requirePermission('write_clinical_note', 'manage_queue'), schema: { summary: 'Set a bed status (cleaning/maintenance/isolation)', tags: ['beds'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const status = str(body.status, 'status', { required: true }).toUpperCase();
      if (!BED_STATUSES.includes(status)) throw httpErrors.badRequest('Invalid bed status');
      const bed = await db.bed.findFirst({ where: { id: params.id, ...facilityScope(u) } });
      if (!bed) throw httpErrors.notFound('Bed not found in scope');
      if (status === 'AVAILABLE' || status === 'CLEANING' || status === 'MAINTENANCE' || status === 'ISOLATION') {
        // Clearing the bed of a patient requires intent; keep patientId intact only
        // when the bed remains occupied. Freeing a bed clears occupancy.
        if (bed.patientId && status === 'AVAILABLE') {
          // Only allow freeing if the patient is no longer actively admitted here.
          const active = await db.admission.findFirst({ where: { patientId: bed.patientId, status: 'ADMITTED' } });
          if (active) throw httpErrors.conflict('Patient still has an active admission — discharge before freeing the bed');
        }
      }
      const updated = await db.bed.update({
        where: { id: bed.id },
        data: {
          status,
          patientId: status === 'OCCUPIED' ? bed.patientId : status === 'AVAILABLE' || status === 'CLEANING' || status === 'MAINTENANCE' || status === 'ISOLATION' ? null : bed.patientId,
          notes: optStr(body.notes) ?? bed.notes,
        },
      });
      recordAudit(db, request, { action: 'bed.status', entityType: 'bed', entityId: bed.id, after: { status } });
      return { bed: updated };
    },
  );

  // -------------------------------------------------------------- assign
  app.post(
    '/beds/:id/assign',
    { preHandler: guards.requirePermission('write_clinical_note'), schema: { summary: 'Assign a patient to a bed (creates admission if needed)', tags: ['beds'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const bed = await db.bed.findFirst({ where: { id: params.id, ...facilityScope(u) } });
      if (!bed) throw httpErrors.notFound('Bed not found in scope');
      if (bed.status === 'OCCUPIED') throw httpErrors.conflict('Bed is already occupied');
      const patientId = str(body.patientId, 'patientId', { required: true });
      await assertPatientAccess(db, u, patientId);

      // A patient may only occupy one bed at a time.
      const occupiedElsewhere = await db.bed.findFirst({ where: { patientId, status: 'OCCUPIED', id: { not: bed.id } } });
      if (occupiedElsewhere) throw httpErrors.conflict('Patient already occupies another bed — transfer or discharge first');

      const active = await db.admission.findFirst({ where: { patientId, status: 'ADMITTED' } });
      const admission = active ?? await db.admission.create({
        data: {
          patientId,
          facilityId: u.facilityId ?? undefined,
          unitId: bed.unitId ?? undefined,
          wardId: bed.wardId ?? undefined,
          ward: bed.ward,
          bed: bed.bedNumber,
          reason: optStr(body.reason),
          status: 'ADMITTED',
        },
      });
      const updated = await db.bed.update({
        where: { id: bed.id },
        data: { status: 'OCCUPIED', patientId, admissionId: admission.id },
      });
      recordAudit(db, request, { action: 'bed.assign', entityType: 'bed', entityId: bed.id, after: { patientId, ward: bed.ward } });
      return { bed: { ...updated, patient: { id: patientId } }, admission };
    },
  );
}
