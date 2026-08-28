import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { httpErrors } from '../../lib/http.js';
import { str, optStr, num, dateIso, parseJsonArr } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import { assertUserCapacity } from '../../lib/license.js';
import { passwordMinLength } from './users.js';
import type { Guards } from '../../lib/guards.js';

/**
 * Hospital structure masterdata (Department → Unit → Ward → Bed).
 * Units are the operational building blocks of a facility — an Intensive Care
 * Unit, a Dialysis Unit, a Labour Ward's unit — each with an in-charge,
 * contact and location, and its own wards which hold the bed board. Units sit
 * under a Department (the queue anchor) but may exist without one.
 *
 * Scope discipline mirrors the facility editor (docs/06): national admins edit
 * anything; regional/district directors only their geography; facility staff
 * only their own facility.
 */
const UNIT_TYPES = ['CLINICAL', 'DIAGNOSTIC', 'SUPPORT', 'ADMINISTRATIVE'];
const EQUIPMENT_CATEGORIES = ['LIFE_SUPPORT', 'MONITORING', 'DIAGNOSTIC', 'SURGICAL', 'THERAPY', 'SUPPORT', 'OTHER'];
const STAFF_ROLES = ['CONSULTANT', 'MEDICAL_OFFICER', 'SURGEON', 'OBSTETRICIAN', 'PAEDIATRICIAN', 'ANESTHETIST', 'NURSE', 'MIDWIFE', 'PHARMACIST', 'LAB_SCIENTIST', 'RADIOGRAPHER', 'RADIOLOGIST', 'PHYSIOTHERAPIST', 'HEALTH_INFO_OFFICER', 'RECORDS_OFFICER', 'HOSPITAL_ADMIN', 'ACCOUNTANT', 'CASHIER', 'STOREKEEPER', 'IT_ADMIN', 'SECURITY', 'PORTER', 'CLEANER', 'CHW', 'OTHER'];
const EMPLOYMENT_STATUSES = ['ACTIVE', 'ON_LEAVE', 'RETIRED', 'TERMINATED'];
// Workforce roll-ups (unit team badges, facility staff counts) count only
// current staff — retired/terminated employees stay in the directory but are
// not part of the working roster.
const WORKFORCE_STATUSES = ['ACTIVE', 'ON_LEAVE'];
const DENY = '__deny__';

/**
 * Staff role → login Role code for one-click account creation (docs/25). Most
 * cadres map onto an existing role; unmapped ones (radiographers, records
 * officers, porters…) must be given an explicit roleCode at link time so a
 * staff record never silently inherits an arbitrary role.
 */
const STAFF_ROLE_TO_ROLE_CODE: Record<string, string> = {
  CONSULTANT: 'DOCTOR',
  MEDICAL_OFFICER: 'DOCTOR',
  SURGEON: 'DOCTOR',
  OBSTETRICIAN: 'DOCTOR',
  PAEDIATRICIAN: 'DOCTOR',
  ANESTHETIST: 'DOCTOR',
  NURSE: 'NURSE',
  MIDWIFE: 'MIDWIFE',
  PHARMACIST: 'PHARMACIST',
  LAB_SCIENTIST: 'LAB_SCIENTIST',
  HEALTH_INFO_OFFICER: 'HEALTH_INFO_OFFICER',
  HOSPITAL_ADMIN: 'HOSPITAL_ADMIN',
  ACCOUNTANT: 'ACCOUNTANT',
  CASHIER: 'CASHIER',
  IT_ADMIN: 'IT_ADMIN',
  CHW: 'COMMUNITY_HEALTH_WORKER',
};

/** The linked-account fields every staff payload carries (may be null). */
const STAFF_USER_SELECT = { id: true, email: true, status: true, role: { select: { code: true, name: true } } } as const;

/** Derived equipment status from the functional/in-maintenance/faulty counts. */
function equipmentStatus(e: { quantity: number; functional: number; inMaintenance: number; faulty: number }): string {
  if (e.quantity === 0) return 'OUT_OF_SERVICE';
  if (e.functional === e.quantity) return 'OPERATIONAL';
  if (e.inMaintenance === e.quantity) return 'IN_MAINTENANCE';
  if (e.faulty === e.quantity) return 'FAULTY';
  return 'PARTIAL';
}

function toEquipmentPayload(e: {
  id: string;
  name: string;
  category: string;
  quantity: number;
  functional: number;
  inMaintenance: number;
  faulty: number;
  serialNumber: string | null;
  manufacturer: string | null;
  model: string | null;
  purchaseDate: Date | null;
  lastMaintenanceAt: Date | null;
  nextMaintenanceAt: Date | null;
  notes: string | null;
  createdAt: Date;
}) {
  return {
    id: e.id,
    name: e.name,
    category: e.category,
    quantity: e.quantity,
    functional: e.functional,
    inMaintenance: e.inMaintenance,
    faulty: e.faulty,
    status: equipmentStatus(e),
    // Maintenance due when nextMaintenanceAt is in the past (or within 14 days).
    maintenanceDue: e.nextMaintenanceAt ? e.nextMaintenanceAt.getTime() - Date.now() < 14 * 24 * 3600 * 1000 : false,
    serialNumber: e.serialNumber,
    manufacturer: e.manufacturer,
    model: e.model,
    purchaseDate: e.purchaseDate,
    lastMaintenanceAt: e.lastMaintenanceAt,
    nextMaintenanceAt: e.nextMaintenanceAt,
    notes: e.notes,
    createdAt: e.createdAt,
  };
}

function unitScope(u: { scope: string; regionId?: string | null; districtId?: string | null; facilityId?: string | null }): Record<string, unknown> {
  switch (u.scope) {
    case 'REGIONAL':
      return u.regionId ? { facility: { regionId: u.regionId } } : { facility: { regionId: DENY } };
    case 'DISTRICT':
      return u.districtId ? { facility: { districtId: u.districtId } } : { facility: { districtId: DENY } };
    case 'FACILITY':
      return u.facilityId ? { facilityId: u.facilityId } : { facilityId: DENY };
    case 'PATIENT':
      return { facilityId: DENY };
    default:
      return {};
  }
}

/** Throws unless the caller may manage units of the given facility. */
function assertFacilityAccess(u: { scope: string; regionId?: string | null; districtId?: string | null; facilityId?: string | null }, facility: { id: string; regionId: string; districtId: string }): void {
  if (u.scope === 'FACILITY' && u.facilityId !== facility.id) throw httpErrors.forbidden('You can only manage units of your own facility');
  if (u.scope === 'REGIONAL' && u.regionId !== facility.regionId) throw httpErrors.forbidden('You can only manage units of facilities in your region');
  if (u.scope === 'DISTRICT' && u.districtId !== facility.districtId) throw httpErrors.forbidden('You can only manage units of facilities in your district');
  if (u.scope === 'PATIENT') throw httpErrors.forbidden('Patient accounts cannot manage hospital units');
}

/** Loads a unit + its facility within the caller's scope, or 404. */
async function loadScopedUnit(db: PrismaClient, u: { scope: string; regionId?: string | null; districtId?: string | null; facilityId?: string | null }, unitId: string) {
  const unit = await db.hospitalUnit.findFirst({
    where: { id: unitId, ...unitScope(u) },
    include: { facility: { select: { id: true, regionId: true, districtId: true } } },
  });
  if (!unit) throw httpErrors.notFound('Unit not found in scope');
  return unit;
}

function toUnitPayload(u: {
  id: string;
  code: string;
  name: string;
  type: string;
  headName: string | null;
  headTitle: string | null;
  phone: string | null;
  location: string | null;
  bedCapacity: number | null;
  services: string;
  notes: string | null;
  status: string;
  department?: { id: string; name: string } | null;
}) {
  return {
    id: u.id,
    code: u.code,
    name: u.name,
    type: u.type,
    headName: u.headName,
    headTitle: u.headTitle,
    phone: u.phone,
    location: u.location,
    bedCapacity: u.bedCapacity,
    services: parseJsonArr<string>(u.services),
    notes: u.notes,
    status: u.status,
    department: u.department ?? null,
  };
}

function toStaffPayload(s: {
  id: string;
  staffNumber: string;
  fullName: string;
  role: string;
  speciality: string | null;
  licenseNumber: string | null;
  phone: string | null;
  email: string | null;
  employmentStatus: string;
  headOfUnit: boolean;
  joinedAt: Date | null;
  notes: string | null;
  unit?: { id: string; code: string; name: string } | null;
  facility?: { id: string; code: string; name: string };
  user?: { id: string; email: string; status: string; role: { code: string; name: string } } | null;
}) {
  return {
    id: s.id,
    staffNumber: s.staffNumber,
    fullName: s.fullName,
    role: s.role,
    speciality: s.speciality,
    licenseNumber: s.licenseNumber,
    phone: s.phone,
    email: s.email,
    employmentStatus: s.employmentStatus,
    headOfUnit: s.headOfUnit,
    joinedAt: s.joinedAt,
    notes: s.notes,
    unit: s.unit ?? null,
    facility: s.facility,
    user: s.user ? { id: s.user.id, email: s.user.email, status: s.user.status, roleCode: s.user.role.code, roleName: s.user.role.name } : null,
  };
}

export function registerAdminUnitsRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  // ====================================================== structure tree
  app.get(
    '/admin/masterdata/units',
    { preHandler: guards.requirePermission('manage_facility'), schema: { summary: 'Hospital structure tree: departments → units → wards (scoped)', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const where = unitScope(u);
      // The facilityId filter must never widen the caller's scope: resolve the
      // facility and assert access (national/regional/district/facility) before
      // narrowing. An out-of-scope facility reads as not-found, never as data.
      const facilityId = optStr(q.facilityId);
      if (facilityId) {
        const requested = await db.facility.findUnique({ where: { id: facilityId } });
        if (!requested) throw httpErrors.notFound('Facility not found');
        assertFacilityAccess(u, requested);
        where.facilityId = facilityId;
      }

      const units = await db.hospitalUnit.findMany({
        where,
        orderBy: [{ facilityId: 'asc' }, { departmentId: 'asc' }, { name: 'asc' }],
        include: {
          facility: { select: { id: true, code: true, name: true } },
          department: { select: { id: true, name: true } },
          wards: {
            where: { status: 'ACTIVE' },
            include: { beds: { select: { id: true, status: true } } },
            orderBy: { name: 'asc' },
          },
          equipment: { select: { id: true, quantity: true, functional: true, inMaintenance: true, faulty: true, nextMaintenanceAt: true } },
          _count: { select: { beds: true } },
        },
      });

      // Staff roll-up for the tree — the same scope filter applies (staff
      // carry facilityId + a facility relation), so out-of-scope rows never
      // leak into the team counts.
      const staffRows = await db.staff.findMany({
        where,
        select: { id: true, unitId: true, facilityId: true, headOfUnit: true, employmentStatus: true },
      });
      // Retired/terminated staff stay in the directory but are not part of the
      // working roster — team and facility counts reflect current staff only.
      const teamByUnit = new Map<string, { count: number; heads: number; onLeave: number }>();
      for (const s of staffRows) {
        if (!s.unitId || !WORKFORCE_STATUSES.includes(s.employmentStatus)) continue;
        const t = teamByUnit.get(s.unitId) ?? { count: 0, heads: 0, onLeave: 0 };
        t.count++;
        if (s.headOfUnit) t.heads++;
        if (s.employmentStatus === 'ON_LEAVE') t.onLeave++;
        teamByUnit.set(s.unitId, t);
      }

      const tree = units.map((un) => {
        const wards = un.wards.map((w) => ({
          id: w.id,
          name: w.name,
          bedCapacity: w.bedCapacity,
          status: w.status,
          beds: w.beds.length,
          occupied: w.beds.filter((b) => b.status === 'OCCUPIED').length,
        }));
        const equipmentSummary = {
          items: un.equipment.reduce((acc, e) => acc + e.quantity, 0),
          functional: un.equipment.reduce((acc, e) => acc + e.functional, 0),
          inMaintenance: un.equipment.reduce((acc, e) => acc + e.inMaintenance, 0),
          faulty: un.equipment.reduce((acc, e) => acc + e.faulty, 0),
          maintenanceDue: un.equipment.filter((e) => e.nextMaintenanceAt && e.nextMaintenanceAt.getTime() - Date.now() < 14 * 24 * 3600 * 1000).length,
        };
        return {
          ...toUnitPayload(un),
          facility: un.facility,
          wards,
          beds: un._count.beds,
          occupied: wards.reduce((acc, w) => acc + w.occupied, 0),
          equipment: equipmentSummary,
          team: teamByUnit.get(un.id) ?? { count: 0, heads: 0, onLeave: 0 },
        };
      });

      type TreeUnit = (typeof tree)[number];
      type DeptGroup = { department: { id: string; name: string } | null; units: TreeUnit[] };
      type FacilityNode = { facility: { id: string; code: string; name: string; staff: { total: number; assigned: number; heads: number } }; departments: DeptGroup[] };
      // Grouped by facility then department (units without a department sit
      // under a null group so the UI can always render them).
      const byFacility = new Map<string, FacilityNode>();
      for (const unit of tree) {
        const key = unit.facility.id;
        let entry = byFacility.get(key);
        if (!entry) {
          const facStaff = staffRows.filter((s) => s.facilityId === key && WORKFORCE_STATUSES.includes(s.employmentStatus));
          entry = {
            facility: { ...unit.facility, staff: { total: facStaff.length, assigned: facStaff.filter((s) => s.unitId).length, heads: facStaff.filter((s) => s.headOfUnit).length } },
            departments: [],
          };
          byFacility.set(key, entry);
        }
        let dep = entry.departments.find((d) => d.department?.id === unit.department?.id);
        if (!dep) {
          dep = { department: unit.department, units: [] };
          entry.departments.push(dep);
        }
        dep.units.push(unit);
      }
      return { facilities: [...byFacility.values()] };
    },
  );

  // ========================================================== create unit
  app.post(
    '/admin/masterdata/units',
    { preHandler: guards.requirePermission('manage_facility'), schema: { summary: 'Create a hospital unit under a department', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const body = (request.body ?? {}) as Record<string, unknown>;
      const facilityId = str(body.facilityId, 'facilityId', { required: true });
      const facility = await db.facility.findUnique({ where: { id: facilityId } });
      if (!facility) throw httpErrors.notFound('Facility not found');
      assertFacilityAccess(u, facility);
      const code = str(body.code, 'code', { required: true, max: 20 }).toUpperCase();
      const name = str(body.name, 'name', { required: true, max: 160 });
      const type = optStr(body.type)?.toUpperCase() ?? 'CLINICAL';
      if (!UNIT_TYPES.includes(type)) throw httpErrors.badRequest(`Unit type must be one of: ${UNIT_TYPES.join(', ')}`);
      const departmentId = optStr(body.departmentId);
      if (departmentId) {
        const department = await db.department.findFirst({ where: { id: departmentId, facilityId } });
        if (!department) throw httpErrors.badRequest('Department does not belong to this facility');
      }
      if (body.services !== undefined && !Array.isArray(body.services)) throw httpErrors.badRequest('services must be an array');
      const dup = await db.hospitalUnit.findFirst({ where: { facilityId, code } });
      if (dup) throw httpErrors.conflict(`A unit with code ${code} already exists at this facility`);

      const unit = await db.hospitalUnit.create({
        data: {
          facilityId,
          departmentId: departmentId ?? null,
          code,
          name,
          type,
          headName: optStr(body.headName),
          headTitle: optStr(body.headTitle),
          phone: optStr(body.phone),
          location: optStr(body.location),
          bedCapacity: body.bedCapacity === undefined || body.bedCapacity === null || body.bedCapacity === '' ? null : (num(body.bedCapacity, 'bedCapacity', { required: true }) ?? null),
          services: JSON.stringify(Array.isArray(body.services) ? (body.services as unknown[]).map(String) : []),
          notes: optStr(body.notes),
          status: 'ACTIVE',
        },
      });
      recordAudit(db, request, {
        action: 'masterdata.unit.create',
        entityType: 'hospitalUnit',
        entityId: unit.id,
        after: { facilityId, code, name, type, departmentId: departmentId ?? null },
      });
      return { unit: toUnitPayload(unit) };
    },
  );

  // ========================================================== update unit
  app.put(
    '/admin/masterdata/units/:id',
    { preHandler: guards.requirePermission('manage_facility'), schema: { summary: 'Edit a hospital unit (head, contact, location, status…)', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const unit = await loadScopedUnit(db, u, params.id);
      assertFacilityAccess(u, unit.facility);
      const data: Record<string, unknown> = {};
      const notes: string[] = [];

      const name = optStr(body.name);
      if (name !== undefined) {
        if (name.trim().length < 2) throw httpErrors.badRequest('Unit name is too short');
        data.name = name.trim();
        notes.push(`name → ${data.name}`);
      }
      const type = optStr(body.type)?.toUpperCase();
      if (type !== undefined) {
        if (!UNIT_TYPES.includes(type)) throw httpErrors.badRequest(`Unit type must be one of: ${UNIT_TYPES.join(', ')}`);
        data.type = type;
        notes.push(`type → ${type}`);
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
      strField('headName', 'Head of unit', 160);
      strField('headTitle', 'Head title', 120);
      strField('phone', 'Unit phone', 40);
      strField('location', 'Location', 160);
      strField('notes', 'Notes', 500);
      if (body.bedCapacity !== undefined && body.bedCapacity !== null && body.bedCapacity !== '') {
        const beds = num(body.bedCapacity, 'bedCapacity', { required: true }) ?? 0;
        if (beds < 0 || beds > 100000) throw httpErrors.badRequest('bedCapacity out of range');
        data.bedCapacity = beds;
        notes.push(`bedCapacity → ${beds}`);
      }
      const departmentId = optStr(body.departmentId);
      if (departmentId !== undefined) {
        if (departmentId) {
          const department = await db.department.findFirst({ where: { id: departmentId, facilityId: unit.facilityId } });
          if (!department) throw httpErrors.badRequest('Department does not belong to this facility');
          data.departmentId = departmentId;
        } else {
          data.departmentId = null;
        }
        notes.push(`department → ${departmentId || '(none)'}`);
      }
      if (body.services !== undefined) {
        if (!Array.isArray(body.services)) throw httpErrors.badRequest('services must be an array');
        data.services = JSON.stringify(body.services.map((s) => String(s)));
        notes.push(`services → ${(body.services as unknown[]).length}`);
      }
      // An explicit '' clears bedCapacity back to null (same nullable-field
      // convention as the facility editor's strField).
      if (body.bedCapacity === '') {
        data.bedCapacity = null;
        notes.push('bedCapacity → (cleared)');
      }
      const status = optStr(body.status)?.toUpperCase();
      if (status !== undefined) {
        if (!['ACTIVE', 'INACTIVE'].includes(status)) throw httpErrors.badRequest('Unit status must be ACTIVE or INACTIVE');
        data.status = status;
        notes.push(`status → ${status}`);
      }
      if (Object.keys(data).length === 0) throw httpErrors.badRequest('Nothing to update');

      const updated = await db.hospitalUnit.update({ where: { id: unit.id }, data });
      recordAudit(db, request, {
        action: 'masterdata.unit.update',
        entityType: 'hospitalUnit',
        entityId: unit.id,
        after: { code: updated.code, changes: notes },
      });
      return { unit: toUnitPayload(updated) };
    },
  );

  // ============================================================ add ward
  app.post(
    '/admin/masterdata/units/:id/wards',
    { preHandler: guards.requirePermission('manage_facility'), schema: { summary: 'Add a ward to a unit', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const unit = await loadScopedUnit(db, u, params.id);
      assertFacilityAccess(u, unit.facility);
      const name = str(body.name, 'name', { required: true, max: 160 }).trim();
      if (name.length < 2) throw httpErrors.badRequest('Ward name is too short');
      const dup = await db.ward.findFirst({ where: { unitId: unit.id, name } });
      if (dup) throw httpErrors.conflict('A ward with this name already exists in the unit');
      const ward = await db.ward.create({
        data: {
          unitId: unit.id,
          name,
          bedCapacity: body.bedCapacity === undefined || body.bedCapacity === null || body.bedCapacity === '' ? null : (num(body.bedCapacity, 'bedCapacity', { required: true }) ?? null),
          status: 'ACTIVE',
        },
      });
      recordAudit(db, request, {
        action: 'masterdata.ward.create',
        entityType: 'ward',
        entityId: ward.id,
        after: { unitId: unit.id, unitCode: unit.code, name },
      });
      return { ward: { id: ward.id, name: ward.name, bedCapacity: ward.bedCapacity, status: ward.status, beds: 0, occupied: 0 } };
    },
  );

  // ========================================================== update ward
  app.put(
    '/admin/masterdata/wards/:id',
    { preHandler: guards.requirePermission('manage_facility'), schema: { summary: 'Edit a ward (name, capacity, status)', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const ward = await db.ward.findFirst({
        where: { id: params.id, unit: { ...unitScope(u) } },
        include: { unit: { include: { facility: { select: { id: true, regionId: true, districtId: true } } } } },
      });
      if (!ward) throw httpErrors.notFound('Ward not found in scope');
      assertFacilityAccess(u, ward.unit.facility);
      const data: Record<string, unknown> = {};
      const notes: string[] = [];
      const name = optStr(body.name);
      if (name !== undefined) {
        if (name.trim().length < 2) throw httpErrors.badRequest('Ward name is too short');
        const dup = await db.ward.findFirst({ where: { unitId: ward.unitId, name: name.trim(), id: { not: ward.id } } });
        if (dup) throw httpErrors.conflict('A ward with this name already exists in the unit');
        data.name = name.trim();
        notes.push(`name → ${data.name}`);
      }
      if (body.bedCapacity !== undefined && body.bedCapacity !== null && body.bedCapacity !== '') {
        const beds = num(body.bedCapacity, 'bedCapacity', { required: true }) ?? 0;
        if (beds < 0 || beds > 100000) throw httpErrors.badRequest('bedCapacity out of range');
        data.bedCapacity = beds;
        notes.push(`bedCapacity → ${beds}`);
      }
      if (body.bedCapacity === '') {
        data.bedCapacity = null;
        notes.push('bedCapacity → (cleared)');
      }
      const status = optStr(body.status)?.toUpperCase();
      if (status !== undefined) {
        if (!['ACTIVE', 'INACTIVE'].includes(status)) throw httpErrors.badRequest('Ward status must be ACTIVE or INACTIVE');
        data.status = status;
        notes.push(`status → ${status}`);
      }
      if (Object.keys(data).length === 0) throw httpErrors.badRequest('Nothing to update');
      const updated = await db.ward.update({ where: { id: ward.id }, data });
      // Keep the bed board truthful: beds group by the legacy free-text `ward`
      // name, so a rename cascades to every bed in the ward.
      if (typeof data.name === 'string' && data.name !== ward.name) {
        await db.bed.updateMany({ where: { wardId: ward.id }, data: { ward: data.name } });
        notes.push(`beds re-tagged to “${data.name}”`);
      }
      recordAudit(db, request, {
        action: 'masterdata.ward.update',
        entityType: 'ward',
        entityId: ward.id,
        after: { unitCode: ward.unit.code, changes: notes },
      });
      return { ward: { id: updated.id, name: updated.name, bedCapacity: updated.bedCapacity, status: updated.status } };
    },
  );

  // ================================================= equipment: list
  app.get(
    '/admin/masterdata/units/:id/equipment',
    { preHandler: guards.requirePermission('manage_facility'), schema: { summary: 'List a unit\'s equipment & tools with status', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const unit = await loadScopedUnit(db, u, params.id);
      const equipment = await db.unitEquipment.findMany({
        where: { unitId: unit.id },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
        include: { maintenanceLog: { orderBy: { performedAt: 'desc' }, take: 5, include: { performedBy: { select: { fullName: true } } } } },
      });
      return {
        unit: { id: unit.id, code: unit.code, name: unit.name },
        equipment: equipment.map((e) => ({
          ...toEquipmentPayload(e),
          recentMaintenance: e.maintenanceLog.map((m) => ({
            id: m.id,
            performedAt: m.performedAt,
            note: m.note,
            performedBy: m.performedBy?.fullName ?? null,
          })),
        })),
      };
    },
  );

  // ============================================== equipment: create
  app.post(
    '/admin/masterdata/units/:id/equipment',
    { preHandler: guards.requirePermission('manage_facility'), schema: { summary: 'Add equipment/tool to a unit', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const unit = await loadScopedUnit(db, u, params.id);
      assertFacilityAccess(u, unit.facility);
      const name = str(body.name, 'name', { required: true, max: 160 }).trim();
      if (name.length < 2) throw httpErrors.badRequest('Equipment name is too short');
      const category = (optStr(body.category) ?? 'SUPPORT').toUpperCase();
      if (!EQUIPMENT_CATEGORIES.includes(category)) throw httpErrors.badRequest(`Equipment category must be one of: ${EQUIPMENT_CATEGORIES.join(', ')}`);
      const quantity = num(body.quantity, 'quantity', { required: true, min: 1, max: 100000 }) ?? 1;
      const functional = Math.min(quantity, Math.max(0, num(body.functional, 'functional', { min: 0 }) ?? quantity));
      const inMaintenance = Math.min(quantity - functional, Math.max(0, num(body.inMaintenance, 'inMaintenance', { min: 0 }) ?? 0));
      const faulty = Math.max(0, Math.min(quantity - functional - inMaintenance, num(body.faulty, 'faulty', { min: 0 }) ?? 0));
      const dup = await db.unitEquipment.findFirst({ where: { unitId: unit.id, name } });
      if (dup) throw httpErrors.conflict('Equipment with this name already exists in the unit');
      const equipment = await db.unitEquipment.create({
        data: {
          unitId: unit.id,
          facilityId: unit.facilityId,
          name,
          category,
          quantity,
          functional,
          inMaintenance,
          faulty,
          serialNumber: optStr(body.serialNumber),
          manufacturer: optStr(body.manufacturer),
          model: optStr(body.model),
          purchaseDate: body.purchaseDate ? dateIso(body.purchaseDate, 'purchaseDate') : null,
          nextMaintenanceAt: body.nextMaintenanceAt ? dateIso(body.nextMaintenanceAt, 'nextMaintenanceAt') : null,
          notes: optStr(body.notes),
        },
      });
      recordAudit(db, request, {
        action: 'masterdata.equipment.create',
        entityType: 'unitEquipment',
        entityId: equipment.id,
        after: { unitCode: unit.code, name, category, quantity },
      });
      return { equipment: toEquipmentPayload(equipment) };
    },
  );

  // ============================================== equipment: update
  app.put(
    '/admin/masterdata/equipment/:id',
    { preHandler: guards.requirePermission('manage_facility'), schema: { summary: 'Edit equipment details', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const equipment = await db.unitEquipment.findFirst({
        where: { id: params.id, unit: { ...unitScope(u) } },
        include: { unit: { include: { facility: { select: { id: true, regionId: true, districtId: true } } } } },
      });
      if (!equipment) throw httpErrors.notFound('Equipment not found in scope');
      assertFacilityAccess(u, equipment.unit.facility);
      const data: Record<string, unknown> = {};
      const notes: string[] = [];
      const name = optStr(body.name);
      if (name !== undefined) {
        if (name.trim().length < 2) throw httpErrors.badRequest('Equipment name is too short');
        const dup = await db.unitEquipment.findFirst({ where: { unitId: equipment.unitId, name: name.trim(), id: { not: equipment.id } } });
        if (dup) throw httpErrors.conflict('Equipment with this name already exists in the unit');
        data.name = name.trim();
        notes.push(`name → ${data.name}`);
      }
      const category = optStr(body.category)?.toUpperCase();
      if (category !== undefined) {
        if (!EQUIPMENT_CATEGORIES.includes(category)) throw httpErrors.badRequest(`Equipment category must be one of: ${EQUIPMENT_CATEGORIES.join(', ')}`);
        data.category = category;
        notes.push(`category → ${category}`);
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
      strField('serialNumber', 'Serial number', 120);
      strField('manufacturer', 'Manufacturer', 160);
      strField('model', 'Model', 160);
      strField('notes', 'Notes', 500);
      if (body.purchaseDate !== undefined) data.purchaseDate = body.purchaseDate === '' || body.purchaseDate === null ? null : (dateIso(body.purchaseDate, 'purchaseDate') ?? null);
      if (body.nextMaintenanceAt !== undefined) data.nextMaintenanceAt = body.nextMaintenanceAt === '' || body.nextMaintenanceAt === null ? null : (dateIso(body.nextMaintenanceAt, 'nextMaintenanceAt') ?? null);
      // Counts are rebalanced against quantity: functional + inMaintenance + faulty = quantity.
      // Each bucket is capped against what remains AFTER the higher-priority
      // bucket is fixed — otherwise an explicit functional that already fills
      // the quantity would let inMaintenance push the total past quantity.
      if (body.quantity !== undefined && body.quantity !== null && body.quantity !== '') {
        const quantity = num(body.quantity, 'quantity', { required: true, min: 1, max: 100000 }) ?? 1;
        const scale = quantity / Math.max(1, equipment.quantity);
        const functional = Math.round(num(body.functional, 'functional', { min: 0 }) ?? equipment.functional * scale);
        const inMaintenance = Math.round(num(body.inMaintenance, 'inMaintenance', { min: 0 }) ?? equipment.inMaintenance * scale);
        const functionalCapped = Math.max(0, Math.min(quantity, functional));
        const inMaintenanceCapped = Math.max(0, Math.min(quantity - functionalCapped, inMaintenance));
        data.quantity = quantity;
        data.functional = functionalCapped;
        data.inMaintenance = inMaintenanceCapped;
        data.faulty = quantity - functionalCapped - inMaintenanceCapped;
        notes.push(`quantity → ${quantity}`);
      } else if (body.functional !== undefined || body.inMaintenance !== undefined || body.faulty !== undefined) {
        const functional = num(body.functional, 'functional', { min: 0 }) ?? equipment.functional;
        const inMaintenance = num(body.inMaintenance, 'inMaintenance', { min: 0 }) ?? equipment.inMaintenance;
        const requestedFaulty = num(body.faulty, 'faulty', { min: 0 }) ?? equipment.faulty;
        const total = functional + inMaintenance + requestedFaulty;
        if (total > equipment.quantity) throw httpErrors.badRequest('functional + inMaintenance + faulty cannot exceed quantity');
        data.functional = functional;
        data.inMaintenance = inMaintenance;
        data.faulty = requestedFaulty;
        notes.push(`counts → ${functional}/${inMaintenance}/${requestedFaulty}`);
      }
      if (Object.keys(data).length === 0) throw httpErrors.badRequest('Nothing to update');
      const updated = await db.unitEquipment.update({ where: { id: equipment.id }, data });
      recordAudit(db, request, {
        action: 'masterdata.equipment.update',
        entityType: 'unitEquipment',
        entityId: equipment.id,
        after: { unitCode: equipment.unit.code, changes: notes },
      });
      return { equipment: toEquipmentPayload(updated) };
    },
  );

  // ========================================== equipment: maintenance
  // Records a completed maintenance action on equipment: moves the specified
  // number of units from in-maintenance (or faulty) back to functional and
  // appends a log entry. nextMaintenanceAt is advanced when given.
  app.post(
    '/admin/masterdata/equipment/:id/maintenance',
    { preHandler: guards.requirePermission('manage_facility'), schema: { summary: 'Record completed maintenance on equipment', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const equipment = await db.unitEquipment.findFirst({
        where: { id: params.id, unit: { ...unitScope(u) } },
        include: { unit: { include: { facility: { select: { id: true, regionId: true, districtId: true } } } } },
      });
      if (!equipment) throw httpErrors.notFound('Equipment not found in scope');
      assertFacilityAccess(u, equipment.unit.facility);
      const availableForFix = equipment.inMaintenance + equipment.faulty;
      if (availableForFix === 0) throw httpErrors.badRequest('Nothing is in maintenance or faulty — nothing to record');
      const requested = num(body.count, 'count', { min: 1 }) ?? availableForFix;
      const count = Math.min(availableForFix, Math.max(1, requested));
      const fromFaulty = Math.min(equipment.faulty, Math.max(0, count - equipment.inMaintenance));
      const fromMaintenance = count - fromFaulty;
      const nextMaintenanceAt = body.nextMaintenanceAt ? dateIso(body.nextMaintenanceAt, 'nextMaintenanceAt') : null;
      const updated = await db.unitEquipment.update({
        where: { id: equipment.id },
        data: {
          functional: equipment.functional + count,
          inMaintenance: equipment.inMaintenance - fromMaintenance,
          faulty: equipment.faulty - fromFaulty,
          lastMaintenanceAt: new Date(),
          nextMaintenanceAt: nextMaintenanceAt ?? equipment.nextMaintenanceAt,
        },
      });
      await db.equipmentMaintenance.create({
        data: { equipmentId: equipment.id, performedById: u.id, performedAt: new Date(), note: optStr(body.note) ?? 'Routine maintenance completed' },
      });
      recordAudit(db, request, {
        action: 'masterdata.equipment.maintenance',
        entityType: 'unitEquipment',
        entityId: equipment.id,
        after: { unitCode: equipment.unit.code, count, fromMaintenance, fromFaulty },
      });
      return { equipment: toEquipmentPayload(updated) };
    },
  );

  // ============================================== equipment: remove
  app.post(
    '/admin/masterdata/equipment/:id/remove',
    { preHandler: guards.requirePermission('manage_facility'), schema: { summary: 'Remove equipment from a unit (with maintenance log cleanup)', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const equipment = await db.unitEquipment.findFirst({
        where: { id: params.id, unit: { ...unitScope(u) } },
        include: { unit: { include: { facility: { select: { id: true, regionId: true, districtId: true } } } } },
      });
      if (!equipment) throw httpErrors.notFound('Equipment not found in scope');
      assertFacilityAccess(u, equipment.unit.facility);
      await db.$transaction([
        db.equipmentMaintenance.deleteMany({ where: { equipmentId: equipment.id } }),
        db.unitEquipment.delete({ where: { id: equipment.id } }),
      ]);
      recordAudit(db, request, {
        action: 'masterdata.equipment.remove',
        entityType: 'unitEquipment',
        entityId: equipment.id,
        after: { unitCode: equipment.unit.code, name: equipment.name },
      });
      return { removed: true };
    },
  );

  // ============================================================= add bed
  app.post(
    '/admin/masterdata/units/:id/beds',
    { preHandler: guards.requirePermission('manage_facility'), schema: { summary: 'Add bed(s) to a ward of a unit', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const unit = await loadScopedUnit(db, u, params.id);
      assertFacilityAccess(u, unit.facility);
      const wardId = str(body.wardId, 'wardId', { required: true });
      const ward = await db.ward.findFirst({ where: { id: wardId, unitId: unit.id } });
      if (!ward) throw httpErrors.notFound('Ward not found in this unit');
      const bedNumber = str(body.bedNumber, 'bedNumber', { required: true, max: 20 }).trim();
      const dup = await db.bed.findFirst({ where: { facilityId: unit.facilityId, ward: ward.name, bedNumber } });
      if (dup) throw httpErrors.conflict('A bed with this number already exists in the ward');
      const bed = await db.bed.create({
        data: {
          facilityId: unit.facilityId,
          unitId: unit.id,
          wardId: ward.id,
          ward: ward.name,
          bedNumber,
          status: (optStr(body.status)?.toUpperCase() ?? 'AVAILABLE') === 'OCCUPIED' ? 'OCCUPIED' : 'AVAILABLE',
          notes: optStr(body.notes),
        },
      });
      recordAudit(db, request, {
        action: 'masterdata.bed.create',
        entityType: 'bed',
        entityId: bed.id,
        after: { unitCode: unit.code, ward: ward.name, bedNumber },
      });
      return { bed: { id: bed.id, unitCode: unit.code, ward: ward.name, bedNumber: bed.bedNumber, status: bed.status } };
    },
  );

  // ======================================================== staff: list
  // The staff directory — every employee of the scoped facilities, with
  // optional unit / role / status filters. The facilityId filter is
  // validated against the caller's scope (same discipline as the tree).
  app.get(
    '/admin/masterdata/staff',
    { preHandler: guards.requirePermission('manage_facility'), schema: { summary: 'Staff directory (scoped, filterable by unit/role/status)', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const where = unitScope(u);
      const facilityId = optStr(q.facilityId);
      if (facilityId) {
        const requested = await db.facility.findUnique({ where: { id: facilityId } });
        if (!requested) throw httpErrors.notFound('Facility not found');
        assertFacilityAccess(u, requested);
        where.facilityId = facilityId;
      }
      const unitId = optStr(q.unitId);
      if (unitId) where.unitId = unitId;
      const role = optStr(q.role)?.toUpperCase();
      if (role) {
        if (!STAFF_ROLES.includes(role)) throw httpErrors.badRequest(`Role must be one of: ${STAFF_ROLES.join(', ')}`);
        where.role = role;
      }
      const status = optStr(q.status)?.toUpperCase();
      if (status) {
        if (!EMPLOYMENT_STATUSES.includes(status)) throw httpErrors.badRequest(`Employment status must be one of: ${EMPLOYMENT_STATUSES.join(', ')}`);
        where.employmentStatus = status;
      }
      // The directory list is capped for the response, but the summary must
      // reflect the FULL scoped workforce — never the truncated rows.
      const [staff, summaryRows] = await Promise.all([
        db.staff.findMany({
          where,
          include: { unit: { select: { id: true, code: true, name: true } }, facility: { select: { id: true, code: true, name: true } }, user: { select: STAFF_USER_SELECT } },
          orderBy: [{ unitId: 'asc' }, { role: 'asc' }, { fullName: 'asc' }],
          take: 1000,
        }),
        db.staff.findMany({ where, select: { unitId: true, headOfUnit: true, employmentStatus: true } }),
      ]);
      return {
        staff: staff.map(toStaffPayload),
        summary: {
          total: summaryRows.length,
          assigned: summaryRows.filter((s) => s.unitId).length,
          heads: summaryRows.filter((s) => s.headOfUnit).length,
          onLeave: summaryRows.filter((s) => s.employmentStatus === 'ON_LEAVE').length,
        },
      };
    },
  );

  // ==================================================== staff: unit team
  app.get(
    '/admin/masterdata/units/:id/staff',
    { preHandler: guards.requirePermission('manage_facility'), schema: { summary: 'A unit\'s team roster', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const unit = await loadScopedUnit(db, u, params.id);
      const team = await db.staff.findMany({
        where: { unitId: unit.id },
        include: { unit: { select: { id: true, code: true, name: true } }, facility: { select: { id: true, code: true, name: true } }, user: { select: STAFF_USER_SELECT } },
        orderBy: [{ headOfUnit: 'desc' }, { role: 'asc' }, { fullName: 'asc' }],
      });
      return { unit: { id: unit.id, code: unit.code, name: unit.name }, team: team.map(toStaffPayload) };
    },
  );

  // ====================================================== staff: create
  // Head-of-unit is exclusive per unit: promoting someone clears the
  // previous head's flag (in the same transaction), so a unit always has
  // at most one structured head.
  app.post(
    '/admin/masterdata/staff',
    { preHandler: guards.requirePermission('manage_facility'), schema: { summary: 'Add a staff member (optionally to a unit)', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const body = (request.body ?? {}) as Record<string, unknown>;
      const facilityId = str(body.facilityId, 'facilityId', { required: true });
      const facility = await db.facility.findUnique({ where: { id: facilityId } });
      if (!facility) throw httpErrors.notFound('Facility not found');
      assertFacilityAccess(u, facility);
      const staffNumber = str(body.staffNumber, 'staffNumber', { required: true, max: 40 }).trim().toUpperCase();
      const dup = await db.staff.findFirst({ where: { facilityId, staffNumber } });
      if (dup) throw httpErrors.conflict(`A staff member with number ${staffNumber} already exists at this facility`);
      const fullName = str(body.fullName, 'fullName', { required: true, max: 160 }).trim();
      if (fullName.length < 2) throw httpErrors.badRequest('Full name is too short');
      const role = (optStr(body.role) ?? '').toUpperCase();
      if (!STAFF_ROLES.includes(role)) throw httpErrors.badRequest(`Role must be one of: ${STAFF_ROLES.join(', ')}`);
      const unitId = optStr(body.unitId);
      if (unitId) {
        const unit = await db.hospitalUnit.findFirst({ where: { id: unitId, facilityId } });
        if (!unit) throw httpErrors.badRequest('Unit does not belong to this facility');
      }
      const employmentStatus = (optStr(body.employmentStatus) ?? 'ACTIVE').toUpperCase();
      if (!EMPLOYMENT_STATUSES.includes(employmentStatus)) throw httpErrors.badRequest(`Employment status must be one of: ${EMPLOYMENT_STATUSES.join(', ')}`);
      const headOfUnit = Boolean(body.headOfUnit);
      // A head of unit must lead a unit — an orphan head flag (no unit) would
      // inflate the roll-ups and mean nothing on the roster.
      if (headOfUnit && !unitId) throw httpErrors.badRequest('A head of unit must be assigned to a unit');
      const created = await db.$transaction(async (tx) => {
        if (headOfUnit && unitId) {
          await tx.staff.updateMany({ where: { unitId, headOfUnit: true }, data: { headOfUnit: false } });
        }
        return tx.staff.create({
          data: {
            facilityId,
            unitId: unitId ?? null,
            staffNumber,
            fullName,
            role,
            speciality: optStr(body.speciality),
            licenseNumber: optStr(body.licenseNumber),
            phone: optStr(body.phone),
            email: optStr(body.email),
            employmentStatus,
            headOfUnit,
            joinedAt: body.joinedAt ? dateIso(body.joinedAt, 'joinedAt') : null,
            notes: optStr(body.notes),
          },
          include: { unit: { select: { id: true, code: true, name: true } }, facility: { select: { id: true, code: true, name: true } }, user: { select: STAFF_USER_SELECT } },
        });
      });
      recordAudit(db, request, {
        action: 'masterdata.staff.create',
        entityType: 'staff',
        entityId: created.id,
        after: { facilityCode: created.facility.code, unitCode: created.unit?.code ?? null, staffNumber, role, headOfUnit },
      });
      return { staff: toStaffPayload(created) };
    },
  );

  // ====================================================== staff: update
  app.put(
    '/admin/masterdata/staff/:id',
    { preHandler: guards.requirePermission('manage_facility'), schema: { summary: 'Edit a staff member (role, unit, status, head-of-unit…)', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const staff = await loadScopedStaff(db, u, params.id);
      assertFacilityAccess(u, staff.facility);
      const data: Record<string, unknown> = {};
      const notes: string[] = [];
      const fullName = optStr(body.fullName);
      if (fullName !== undefined) {
        if (fullName.trim().length < 2) throw httpErrors.badRequest('Full name is too short');
        data.fullName = fullName.trim();
        notes.push(`name → ${data.fullName}`);
      }
      const role = optStr(body.role)?.toUpperCase();
      if (role !== undefined) {
        if (!STAFF_ROLES.includes(role)) throw httpErrors.badRequest(`Role must be one of: ${STAFF_ROLES.join(', ')}`);
        data.role = role;
        notes.push(`role → ${role}`);
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
      strField('speciality', 'Speciality', 120);
      strField('licenseNumber', 'Licence number', 80);
      strField('phone', 'Phone', 40);
      strField('email', 'Email', 120);
      strField('notes', 'Notes', 500);
      const employmentStatus = optStr(body.employmentStatus)?.toUpperCase();
      if (employmentStatus !== undefined) {
        if (!EMPLOYMENT_STATUSES.includes(employmentStatus)) throw httpErrors.badRequest(`Employment status must be one of: ${EMPLOYMENT_STATUSES.join(', ')}`);
        data.employmentStatus = employmentStatus;
        notes.push(`status → ${employmentStatus}`);
      }
      const unitId = optStr(body.unitId);
      if (unitId !== undefined) {
        if (unitId) {
          const unit = await db.hospitalUnit.findFirst({ where: { id: unitId, facilityId: staff.facilityId } });
          if (!unit) throw httpErrors.badRequest('Unit does not belong to this facility');
          data.unitId = unitId;
        } else {
          data.unitId = null;
        }
        notes.push(`unit → ${unitId || '(unassigned)'}`);
      }
      if (body.headOfUnit !== undefined) {
        data.headOfUnit = Boolean(body.headOfUnit);
        notes.push(`headOfUnit → ${data.headOfUnit}`);
      }
      if (body.joinedAt !== undefined) data.joinedAt = body.joinedAt === '' || body.joinedAt === null ? null : (dateIso(body.joinedAt, 'joinedAt') ?? null);
      if (Object.keys(data).length === 0) throw httpErrors.badRequest('Nothing to update');
      // Same orphan-head guard as create: promoting someone without an
      // effective unit (current or new) is a clean 400.
      const effectiveUnitId = data.unitId !== undefined ? data.unitId : staff.unitId;
      if (data.headOfUnit === true && !effectiveUnitId) throw httpErrors.badRequest('A head of unit must be assigned to a unit');
      const updated = await db.$transaction(async (tx) => {
        // Promoting a head clears any other head in the affected unit(s) —
        // a move between units drops the old unit's head flag too.
        if (data.headOfUnit === true) {
          const targetUnits = new Set<string>([staff.unitId, data.unitId].filter((x): x is string => Boolean(x)));
          for (const uid of targetUnits) {
            await tx.staff.updateMany({ where: { unitId: uid, id: { not: staff.id }, headOfUnit: true }, data: { headOfUnit: false } });
          }
        }
        return tx.staff.update({
          where: { id: staff.id },
          data,
          include: { unit: { select: { id: true, code: true, name: true } }, facility: { select: { id: true, code: true, name: true } }, user: { select: STAFF_USER_SELECT } },
        });
      });
      recordAudit(db, request, {
        action: 'masterdata.staff.update',
        entityType: 'staff',
        entityId: staff.id,
        after: { staffNumber: staff.staffNumber, unitCode: staff.unit?.code ?? null, changes: notes },
      });
      return { staff: toStaffPayload(updated) };
    },
  );

  // ============================================ staff: login accounts
  // One-click account creation from a staff record (docs/25): the login role is
  // auto-mapped from the staff role unless the caller overrides it, and the
  // email falls back to the record's own email, then a deterministic
  // `staffNumber@facilitycode.gh`. Guards mirror the users module: manage_users
  // (creating an account) + the staff scope discipline (only in-scope records).
  app.post(
    '/admin/masterdata/staff/:id/link-user',
    { preHandler: guards.requirePermission('manage_users'), schema: { summary: 'Create a login account from a staff record (role auto-mapped)', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const staff = await loadScopedStaff(db, u, params.id);
      assertFacilityAccess(u, staff.facility);
      if (staff.userId) throw httpErrors.conflict(`${staff.fullName} already has a linked login account`);
      await assertUserCapacity(db); // licensing (docs/25)
      const email = (optStr(body.email) ?? staff.email ?? `${staff.staffNumber.toLowerCase()}@${staff.facility.code.toLowerCase()}.gh`).toLowerCase().trim();
      if (await db.user.findUnique({ where: { email } })) throw httpErrors.conflict('An account with this email already exists');
      // Auto-map from the staff role; require an explicit override when the
      // cadres have no matching login role (radiographers, porters…).
      // The explicit roleCode override is intentionally as powerful as the
      // existing create-user endpoint (guarded by the same manage_users): an
      // admin may decide which role a record's account gets. Only DEVELOPER
      // (system-reserved) and PATIENT (self-service) are off-limits here.
      const roleCode = (optStr(body.roleCode) ?? STAFF_ROLE_TO_ROLE_CODE[staff.role] ?? '').toUpperCase();
      const role = await db.role.findUnique({ where: { code: roleCode } });
      if (!role) throw httpErrors.badRequest(`No login role matches the staff role ${staff.role} — pass an explicit roleCode (e.g. DOCTOR, NURSE)`);
      if (roleCode === 'DEVELOPER' || roleCode === 'PATIENT') throw httpErrors.badRequest('Staff login accounts must use a work role');
      const password = str(body.password, 'password', { required: true, max: 200 });
      const min = passwordMinLength();
      if (password.length < min) throw httpErrors.badRequest(`Password must be at least ${min} characters`);
      const user = await db.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: { email, passwordHash: await bcrypt.hash(password, 10), fullName: staff.fullName, roleId: role.id, facilityId: staff.facilityId, status: 'ACTIVE', isSynthetic: true },
        });
        await tx.staff.update({ where: { id: staff.id }, data: { userId: created.id } });
        return created;
      });
      recordAudit(db, request, {
        action: 'masterdata.staff.link-user',
        entityType: 'staff',
        entityId: staff.id,
        after: { staffNumber: staff.staffNumber, email, roleCode, facilityCode: staff.facility.code, unitCode: staff.unit?.code ?? null },
      });
      return { user: { id: user.id, email: user.email, fullName: user.fullName, roleCode } };
    },
  );

  // Removing the link keeps the account (it stays in Users management) — only
  // the directory↔account binding is dropped.
  app.post(
    '/admin/masterdata/staff/:id/unlink-user',
    { preHandler: guards.requirePermission('manage_users'), schema: { summary: 'Unlink a staff record from its login account (account stays)', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const staff = await loadScopedStaff(db, u, params.id);
      assertFacilityAccess(u, staff.facility);
      if (!staff.userId) throw httpErrors.badRequest('This staff member has no linked login account');
      await db.staff.update({ where: { id: staff.id }, data: { userId: null } });
      recordAudit(db, request, {
        action: 'masterdata.staff.unlink-user',
        entityType: 'staff',
        entityId: staff.id,
        after: { staffNumber: staff.staffNumber, email: staff.user?.email ?? null, facilityCode: staff.facility.code },
      });
      return { unlinked: true };
    },
  );

  // ====================================================== staff: remove
  app.post(
    '/admin/masterdata/staff/:id/remove',
    { preHandler: guards.requirePermission('manage_facility'), schema: { summary: 'Remove a staff member from the directory', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const staff = await loadScopedStaff(db, u, params.id);
      assertFacilityAccess(u, staff.facility);
      // Drop the login link explicitly before deleting: the account lives on in
      // User management (same contract as unlink-user), just no longer bound
      // to a directory record.
      await db.$transaction([db.staff.update({ where: { id: staff.id }, data: { userId: null } }), db.staff.delete({ where: { id: staff.id } })]);
      recordAudit(db, request, {
        action: 'masterdata.staff.remove',
        entityType: 'staff',
        entityId: staff.id,
        after: { staffNumber: staff.staffNumber, fullName: staff.fullName, unitCode: staff.unit?.code ?? null, linkedEmail: staff.user?.email ?? null },
      });
      return { removed: true };
    },
  );
}

/** Loads a staff member + facility within the caller's scope, or 404. */
async function loadScopedStaff(db: PrismaClient, u: { scope: string; regionId?: string | null; districtId?: string | null; facilityId?: string | null }, staffId: string) {
  const staff = await db.staff.findFirst({
    where: { id: staffId, ...unitScope(u) },
    include: { unit: { select: { id: true, code: true, name: true } }, facility: { select: { id: true, regionId: true, districtId: true, code: true, name: true } }, user: { select: STAFF_USER_SELECT } },
  });
  if (!staff) throw httpErrors.notFound('Staff member not found in scope');
  return staff;
}
