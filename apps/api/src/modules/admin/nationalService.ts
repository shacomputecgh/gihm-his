// =====================================================================
// National Service personnel (Ghana National Service Scheme) — CRUD.
// ---------------------------------------------------------------------
// Young graduates posted to the facility for their service year, tracked
// separately from salaried staff. Same scope discipline as the units/staff
// module (docs/06): facility staff manage their own facility, regional and
// district directors their own geography, national admins all facilities.
// =====================================================================
import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { str, optStr, dateIso } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import type { Guards } from '../../lib/guards.js';

const NSS_STATUSES = ['ACTIVE', 'COMPLETED', 'TERMINATED'];

/** Facility scope discipline shared with units/staff (docs/06). */
function nssScope(u: { scope: string; regionId?: string | null; districtId?: string | null; facilityId?: string | null }): Record<string, unknown> {
  if (u.scope === 'FACILITY') return { facilityId: u.facilityId ?? '__none__' };
  if (u.scope === 'DISTRICT') return { facility: { districtId: u.districtId ?? '__none__' } };
  if (u.scope === 'REGIONAL') return { facility: { regionId: u.regionId ?? '__none__' } };
  return {};
}

/** A requested facility must be inside the caller's scope (never widened). */
function assertNssFacilityAccess(
  u: { scope: string; regionId?: string | null; districtId?: string | null; facilityId?: string | null },
  facility: { id: string; regionId: string; districtId: string },
): void {
  if (u.scope === 'FACILITY' && u.facilityId !== facility.id) throw httpErrors.forbidden('You can only manage personnel at your own facility');
  if (u.scope === 'REGIONAL' && u.regionId !== facility.regionId) throw httpErrors.forbidden('You can only manage personnel in your region');
  if (u.scope === 'DISTRICT' && u.districtId !== facility.districtId) throw httpErrors.forbidden('You can only manage personnel in your district');
}

interface NssRow {
  id: string;
  nssNumber: string;
  fullName: string;
  institution: string | null;
  programme: string | null;
  placement: string | null;
  supervisor: string | null;
  phone: string | null;
  email: string | null;
  startDate: Date;
  endDate: Date | null;
  status: string;
  notes: string | null;
  unit: { id: string; code: string; name: string } | null;
  facility: { id: string; code: string; name: string };
}

function toPayload(r: NssRow) {
  return {
    id: r.id,
    nssNumber: r.nssNumber,
    fullName: r.fullName,
    institution: r.institution,
    programme: r.programme,
    placement: r.placement,
    supervisor: r.supervisor,
    phone: r.phone,
    email: r.email,
    startDate: r.startDate,
    endDate: r.endDate,
    status: r.status,
    notes: r.notes,
    unit: r.unit,
    facility: r.facility,
  };
}

export function registerNationalServiceRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  // ------------------------------------------------------------------ list
  app.get(
    '/admin/masterdata/national-service',
    { preHandler: guards.requirePermission('manage_facility'), schema: { summary: 'National service personnel (scoped, filterable)', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const where = nssScope(u);
      const facilityId = optStr(q.facilityId);
      if (facilityId) {
        const requested = await db.facility.findUnique({ where: { id: facilityId } });
        if (!requested) throw httpErrors.notFound('Facility not found');
        assertNssFacilityAccess(u, requested);
        where.facilityId = facilityId;
      }
      const unitId = optStr(q.unitId);
      if (unitId) where.unitId = unitId;
      const status = optStr(q.status)?.toUpperCase();
      if (status) {
        if (!NSS_STATUSES.includes(status)) throw httpErrors.badRequest(`Status must be one of: ${NSS_STATUSES.join(', ')}`);
        where.status = status;
      }
      const search = optStr(q.q);
      if (search) where.fullName = { contains: search };
      const rows = await db.nationalServiceStaff.findMany({
        where,
        include: { unit: { select: { id: true, code: true, name: true } }, facility: { select: { id: true, code: true, name: true } } },
        orderBy: [{ status: 'asc' }, { fullName: 'asc' }],
        take: 1000,
      });
      const active = rows.filter((r) => r.status === 'ACTIVE').length;
      return { personnel: rows.map(toPayload), summary: { total: rows.length, active } };
    },
  );

  // ----------------------------------------------------------------- create
  app.post(
    '/admin/masterdata/national-service',
    { preHandler: guards.requirePermission('manage_facility'), schema: { summary: 'Post a national service person to a facility', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const body = (request.body ?? {}) as Record<string, unknown>;
      const facilityId = str(body.facilityId, 'facilityId', { required: true });
      const facility = await db.facility.findUnique({ where: { id: facilityId } });
      if (!facility) throw httpErrors.notFound('Facility not found');
      assertNssFacilityAccess(u, facility);
      const fullName = str(body.fullName, 'fullName', { required: true, max: 160 }).trim();
      if (fullName.length < 2) throw httpErrors.badRequest('Full name is too short');
      // An NSS number is optional on create — the system generates the next
      // sequential number for the facility (NSS-<year>-NNNN) when omitted.
      const year = new Date().getFullYear();
      const requestedNumber = optStr(body.nssNumber)?.trim().toUpperCase();
      let nssNumber = requestedNumber ?? '';
      if (!nssNumber) {
        const count = await db.nationalServiceStaff.count({ where: { facilityId } });
        nssNumber = `NSS-${year}-${String(count + 1).padStart(4, '0')}`;
      }
      const dup = await db.nationalServiceStaff.findFirst({ where: { facilityId, nssNumber } });
      if (dup) throw httpErrors.conflict(`A person with number ${nssNumber} already exists at this facility`);
      const unitId = optStr(body.unitId);
      if (unitId) {
        const unit = await db.hospitalUnit.findFirst({ where: { id: unitId, facilityId } });
        if (!unit) throw httpErrors.badRequest('Unit does not belong to this facility');
      }
      const status = (optStr(body.status) ?? 'ACTIVE').toUpperCase();
      if (!NSS_STATUSES.includes(status)) throw httpErrors.badRequest(`Status must be one of: ${NSS_STATUSES.join(', ')}`);
      const startDate = (body.startDate ? dateIso(body.startDate, 'startDate') : undefined) ?? new Date();
      const endDate = body.endDate ? (dateIso(body.endDate, 'endDate') ?? null) : null;
      if (endDate && endDate < startDate) throw httpErrors.badRequest('End date cannot be before the start date');
      const created = await db.nationalServiceStaff.create({
        data: {
          facilityId,
          unitId: unitId ?? null,
          nssNumber,
          fullName,
          institution: optStr(body.institution),
          programme: optStr(body.programme),
          placement: optStr(body.placement),
          supervisor: optStr(body.supervisor),
          phone: optStr(body.phone),
          email: optStr(body.email),
          startDate,
          endDate,
          status,
          notes: optStr(body.notes),
        },
        include: { unit: { select: { id: true, code: true, name: true } }, facility: { select: { id: true, code: true, name: true } } },
      });
      recordAudit(db, request, {
        action: 'masterdata.nss.create',
        entityType: 'nationalServiceStaff',
        entityId: created.id,
        after: { facilityCode: created.facility.code, unitCode: created.unit?.code ?? null, nssNumber, status },
      });
      return { personnel: toPayload(created) };
    },
  );

  // ----------------------------------------------------------------- update
  app.put(
    '/admin/masterdata/national-service/:id',
    { preHandler: guards.requirePermission('manage_facility'), schema: { summary: 'Edit national service personnel', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const { id } = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const row = await loadScopedNss(db, u, id);
      assertNssFacilityAccess(u, row.facility);
      const data: Record<string, unknown> = {};
      const notes: string[] = [];
      const fullName = optStr(body.fullName);
      if (fullName !== undefined) {
        if (fullName.trim().length < 2) throw httpErrors.badRequest('Full name is too short');
        data.fullName = fullName.trim();
        notes.push(`name → ${data.fullName}`);
      }
      const strField = (key: string, label: string, max: number) => {
        if (body[key] === undefined) return;
        const v = optStr(body[key]);
        if (v === undefined) {
          data[key] = null;
          notes.push(`${key} → (cleared)`);
          return;
        }
        if (v.length > max) throw httpErrors.badRequest(`${label} is too long`);
        data[key] = v;
        notes.push(`${key} → ${data[key]}`);
      };
      strField('institution', 'Institution', 160);
      strField('programme', 'Programme', 160);
      strField('placement', 'Placement', 160);
      strField('supervisor', 'Supervisor', 120);
      strField('phone', 'Phone', 40);
      strField('email', 'Email', 120);
      strField('notes', 'Notes', 500);
      const status = optStr(body.status)?.toUpperCase();
      if (status !== undefined) {
        if (!NSS_STATUSES.includes(status)) throw httpErrors.badRequest(`Status must be one of: ${NSS_STATUSES.join(', ')}`);
        data.status = status;
        notes.push(`status → ${status}`);
      }
      const unitId = optStr(body.unitId);
      if (unitId !== undefined) {
        if (unitId) {
          const unit = await db.hospitalUnit.findFirst({ where: { id: unitId, facilityId: row.facilityId } });
          if (!unit) throw httpErrors.badRequest('Unit does not belong to this facility');
          data.unitId = unitId;
        } else {
          data.unitId = null;
        }
        notes.push(`unit → ${unitId || '(unassigned)'}`);
      }
      if (body.startDate !== undefined) data.startDate = body.startDate === '' || body.startDate === null ? row.startDate : (dateIso(body.startDate, 'startDate') ?? row.startDate);
      if (body.endDate !== undefined) data.endDate = body.endDate === '' || body.endDate === null ? null : (dateIso(body.endDate, 'endDate') ?? null);
      // A service year should never end before it begins — even after an edit.
      const effectiveStart = (data.startDate as Date | undefined) ?? row.startDate;
      const effectiveEnd = (data.endDate as Date | undefined) ?? row.endDate;
      if (effectiveEnd && effectiveEnd < effectiveStart) throw httpErrors.badRequest('End date cannot be before the start date');
      if (Object.keys(data).length === 0) throw httpErrors.badRequest('Nothing to update');
      const updated = await db.nationalServiceStaff.update({
        where: { id },
        data,
        include: { unit: { select: { id: true, code: true, name: true } }, facility: { select: { id: true, code: true, name: true } } },
      });
      recordAudit(db, request, {
        action: 'masterdata.nss.update',
        entityType: 'nationalServiceStaff',
        entityId: id,
        after: { nssNumber: row.nssNumber, unitCode: row.unit?.code ?? null, changes: notes },
      });
      return { personnel: toPayload(updated) };
    },
  );

  // ----------------------------------------------------------------- remove
  app.post(
    '/admin/masterdata/national-service/:id/remove',
    { preHandler: guards.requirePermission('manage_facility'), schema: { summary: 'Remove a national service person', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const { id } = request.params as { id: string };
      const row = await loadScopedNss(db, u, id);
      assertNssFacilityAccess(u, row.facility);
      await db.nationalServiceStaff.delete({ where: { id } });
      recordAudit(db, request, {
        action: 'masterdata.nss.remove',
        entityType: 'nationalServiceStaff',
        entityId: id,
        after: { nssNumber: row.nssNumber, fullName: row.fullName, unitCode: row.unit?.code ?? null },
      });
      return { removed: true };
    },
  );
}

/** Loads a national service row + facility within the caller's scope, or 404. */
async function loadScopedNss(
  db: PrismaClient,
  u: { scope: string; regionId?: string | null; districtId?: string | null; facilityId?: string | null },
  id: string,
) {
  const row = await db.nationalServiceStaff.findFirst({
    where: { id, ...nssScope(u) },
    include: { unit: { select: { id: true, code: true, name: true } }, facility: { select: { id: true, regionId: true, districtId: true, code: true, name: true } } },
  });
  if (!row) throw httpErrors.notFound('National service personnel not found in scope');
  return row;
}
