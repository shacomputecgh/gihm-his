import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { str, optStr, num, parseJsonArr } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import { initEpiSchedule, getSchedule } from '../../lib/epiSchedule.js';
import { GHANA_EPI_SCHEDULE } from '../immunization/schedule.js';
import { PERMISSIONS, PERMISSION_CODES, ROLE_SCOPES } from '../../lib/permissions.js';
import type { Guards } from '../../lib/guards.js';

/** Effective EPI schedule with edit provenance for the admin editor. */
async function epiScheduleResponse(db: PrismaClient) {
  const rows = await db.epiScheduleItem.findMany();
  const rowByKey = new Map(rows.map((r) => [`${r.vaccine}|${r.dose}`, r]));
  const defaultByKey = new Map(GHANA_EPI_SCHEDULE.map((s) => [`${s.vaccine}|${s.dose}`, s]));
  // A row that exactly matches the built-in default is reported as 'default'
  // (so seeded rows — which mirror the defaults — are not shown as custom).
  const sourceOf = (row: { vaccine: string; dose: string; label: string; description: string; ageDays: number | null; intervalDays: number | null; active: boolean }): 'default' | 'custom' => {
    const d = defaultByKey.get(`${row.vaccine}|${row.dose}`);
    if (!d || !row.active) return 'custom';
    return d.label === row.label && d.description === row.description && d.ageDays === row.ageDays && d.intervalDays === row.intervalDays ? 'default' : 'custom';
  };
  const items = getSchedule().map((s) => {
    const row = rowByKey.get(`${s.vaccine}|${s.dose}`);
    return { ...s, source: row ? sourceOf(row) : 'default', active: row ? row.active : true };
  });
  // Rows that deactivate an entry are invisible in the effective schedule —
  // surface them so admins can re-enable (set active back to true).
  for (const r of rows) {
    if (!r.active && !items.some((i) => i.vaccine === r.vaccine && i.dose === r.dose)) {
      items.push({ vaccine: r.vaccine, dose: r.dose, label: r.label, description: r.description, ageDays: r.ageDays, intervalDays: r.intervalDays, source: 'custom', active: false });
    }
  }
  return items;
}

function parseEpiItem(raw: unknown) {
  const item = (raw ?? {}) as Record<string, unknown>;
  const vaccine = str(item.vaccine, 'vaccine', { required: true, max: 40 }).toUpperCase();
  const dose = str(item.dose, 'dose', { required: true, max: 20 });
  const label = str(item.label, 'label', { required: true, max: 120 });
  const description = str(item.description, 'description', { required: true, max: 240 });
  const ageDays = item.ageDays === null || item.ageDays === undefined || item.ageDays === '' ? null : (num(item.ageDays, 'ageDays', { required: true }) ?? null);
  const intervalDays = item.intervalDays === null || item.intervalDays === undefined || item.intervalDays === '' ? null : (num(item.intervalDays, 'intervalDays', { required: true }) ?? null);
  if (ageDays !== null && ageDays < 0) throw httpErrors.badRequest('ageDays must be >= 0');
  if (intervalDays !== null && intervalDays < 0) throw httpErrors.badRequest('intervalDays must be >= 0');
  // Both null is legal (e.g. TT dose 1 — due at the first ANC visit).
  const active = item.active !== false;
  return { vaccine, dose, label, description, ageDays, intervalDays, active };
}

export function registerAdminMasterdataRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  // ============================================================ EPI schedule
  app.get(
    '/admin/masterdata/epi-schedule',
    { preHandler: guards.requirePermission('manage_epi_schedule'), schema: { summary: 'Effective EPI schedule with edit provenance', tags: ['admin'] } },
    async () => ({ items: await epiScheduleResponse(db) }),
  );

  app.put(
    '/admin/masterdata/epi-schedule',
    { preHandler: guards.requirePermission('manage_epi_schedule'), schema: { summary: 'Override EPI schedule entries (bulk)', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const body = (request.body ?? {}) as Record<string, unknown>;
      const list = body.items;
      if (!Array.isArray(list) || list.length === 0) throw httpErrors.badRequest('items must be a non-empty array');
      if (list.length > 200) throw httpErrors.badRequest('Too many items (max 200)');
      const parsed = list.map(parseEpiItem);
      for (const it of parsed) {
        await db.epiScheduleItem.upsert({
          where: { vaccine_dose: { vaccine: it.vaccine, dose: it.dose } },
          create: { ...it, updatedById: u.id },
          update: { label: it.label, description: it.description, ageDays: it.ageDays, intervalDays: it.intervalDays, active: it.active, updatedById: u.id },
        });
      }
      await initEpiSchedule(db); // refresh the runtime overlay immediately
      const changed = parsed.map((p) => `${p.vaccine}|${p.dose}`);
      recordAudit(db, request, { action: 'masterdata.epi_schedule.update', entityType: 'epiSchedule', after: { items: changed, count: changed.length } });
      return { updated: changed, items: await epiScheduleResponse(db) };
    },
  );

  app.post(
    '/admin/masterdata/epi-schedule/reset',
    { preHandler: guards.requirePermission('manage_epi_schedule'), schema: { summary: 'Reset the EPI schedule to the built-in defaults', tags: ['admin'] } },
    async (request) => {
      const deleted = await db.epiScheduleItem.deleteMany();
      await initEpiSchedule(db);
      recordAudit(db, request, { action: 'masterdata.epi_schedule.reset', entityType: 'epiSchedule', after: { deleted: deleted.count } });
      return { reset: deleted.count, items: await epiScheduleResponse(db) };
    },
  );

  // ===================================================== roles & permissions
  app.get(
    '/admin/masterdata/roles',
    { preHandler: guards.requirePermission('manage_roles_permissions'), schema: { summary: 'Roles with permissions + the permission catalog', tags: ['admin'] } },
    async () => {
      const roles = await db.role.findMany({
        include: { _count: { select: { users: true } } },
        orderBy: { code: 'asc' },
      });
      return {
        roles: roles.map((r) => ({
          id: r.id,
          code: r.code,
          name: r.name,
          scope: r.scope,
          permissions: JSON.parse(r.permissions) as string[],
          userCount: r._count.users,
        })),
        catalog: PERMISSIONS,
      };
    },
  );

  app.put(
    '/admin/masterdata/roles/:code',
    { preHandler: guards.requirePermission('manage_roles_permissions'), schema: { summary: 'Edit a role (name, scope, permissions)', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const { code } = request.params as { code: string };
      const role = await db.role.findUnique({ where: { code } });
      if (!role) throw httpErrors.notFound(`Role ${code} not found`);
      // The DEVELOPER role is structural (docs/25): it bypasses every guard
      // and is controlled only by the developer — never editable via the roles
      // editor, even by NATIONAL_ADMIN.
      if (code === 'DEVELOPER') throw httpErrors.forbidden('The DEVELOPER role is controlled by the platform developer (docs/25)');
      const body = (request.body ?? {}) as Record<string, unknown>;
      const data: { name?: string; scope?: string; permissions?: string } = {};
      const notes: string[] = [];
      const name = optStr(body.name);
      if (name !== undefined) {
        if (name.trim().length < 2) throw httpErrors.badRequest('Role name is too short');
        data.name = name.trim();
        notes.push(`name → ${data.name}`);
      }
      const scope = optStr(body.scope);
      if (scope !== undefined) {
        // DEVELOPER scope is not in ROLE_SCOPES — only the developer can grant it.
        if (scope === 'DEVELOPER') throw httpErrors.forbidden('Only the platform developer can grant the DEVELOPER scope (docs/25)');
        if (!ROLE_SCOPES.includes(scope)) throw httpErrors.badRequest(`Invalid scope: ${scope}`);
        if (code === 'PATIENT' && scope !== 'PATIENT') throw httpErrors.badRequest('The PATIENT role must keep the PATIENT scope');
        data.scope = scope;
        notes.push(`scope → ${scope}`);
      }
      if (body.permissions !== undefined) {
        const perms = body.permissions;
        if (!Array.isArray(perms)) throw httpErrors.badRequest('permissions must be an array of codes');
        const codes = [...new Set(perms.map((p) => String(p)))];
        const unknown = codes.filter((c) => !PERMISSION_CODES.has(c));
        if (unknown.length > 0) throw httpErrors.badRequest(`Unknown permission(s): ${unknown.join(', ')}`);
        if (code === 'PATIENT' && !codes.includes('self_access')) throw httpErrors.badRequest('The PATIENT role must keep self_access');
        data.permissions = JSON.stringify(codes);
        notes.push(`${codes.length} permission(s)`);
      }
      if (Object.keys(data).length === 0) throw httpErrors.badRequest('Nothing to update');
      const updated = await db.role.update({ where: { id: role.id }, data });
      recordAudit(db, request, { action: 'masterdata.role.update', entityType: 'role', entityId: role.id, after: { code, changes: notes } });
      return { role: { id: updated.id, code: updated.code, name: updated.name, scope: updated.scope, permissions: JSON.parse(updated.permissions) } };
    },
  );

  // ============================================================ role: create
  // Ad-hoc roles for the facility (docs/06): NATIONAL_ADMIN and IT_ADMIN may
  // define new roles with a unique code, name, scope and permission set — the
  // same validation as editing, plus code-uniqueness and the structural
  // guards (DEVELOPER reserved, PATIENT scope locked).
  app.post(
    '/admin/masterdata/roles',
    { preHandler: guards.requirePermission('manage_roles_permissions'), schema: { summary: 'Create a new role', tags: ['admin'] } },
    async (request) => {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const code = str(body.code, 'code', { required: true, max: 60 }).trim().toUpperCase().replace(/\s+/g, '_');
      if (!/^[A-Z][A-Z0-9_]{1,59}$/.test(code)) throw httpErrors.badRequest('Role code must be uppercase letters, digits or underscores (2–60 chars)');
      if (code === 'DEVELOPER' || code === 'PATIENT') throw httpErrors.badRequest(`The ${code} role is structural and cannot be recreated`);
      if (await db.role.findUnique({ where: { code } })) throw httpErrors.conflict(`Role ${code} already exists`);
      const name = str(body.name, 'name', { required: true, max: 190 }).trim();
      if (name.length < 2) throw httpErrors.badRequest('Role name is too short');
      const scope = str(body.scope, 'scope', { required: true }).toUpperCase();
      if (!ROLE_SCOPES.includes(scope)) throw httpErrors.badRequest(`Invalid scope: ${scope}`);
      const perms = Array.isArray(body.permissions) ? [...new Set((body.permissions as unknown[]).map((p) => String(p)))] : [];
      const unknown = perms.filter((c) => !PERMISSION_CODES.has(c));
      if (unknown.length > 0) throw httpErrors.badRequest(`Unknown permission(s): ${unknown.join(', ')}`);
      const role = await db.role.create({ data: { code, name, scope, permissions: JSON.stringify(perms) } });
      recordAudit(db, request, { action: 'masterdata.role.create', entityType: 'role', entityId: role.id, after: { code, scope, permissions: perms.length } });
      return { role: { id: role.id, code: role.code, name: role.name, scope: role.scope, permissions: perms } };
    },
  );

  // ============================================================ role: delete
  app.delete(
    '/admin/masterdata/roles/:code',
    { preHandler: guards.requirePermission('manage_roles_permissions'), schema: { summary: 'Delete an unused role', tags: ['admin'] } },
    async (request) => {
      const { code } = request.params as { code: string };
      const role = await db.role.findUnique({ where: { code } });
      if (!role) throw httpErrors.notFound(`Role ${code} not found`);
      if (role.code === 'DEVELOPER') throw httpErrors.forbidden('The DEVELOPER role is controlled by the platform developer (docs/25)');
      const userCount = await db.user.count({ where: { roleId: role.id } });
      if (userCount > 0) throw httpErrors.conflict(`Role ${code} is assigned to ${userCount} user(s) — reassign them first`);
      await db.role.delete({ where: { id: role.id } });
      recordAudit(db, request, { action: 'masterdata.role.delete', entityType: 'role', entityId: role.id, after: { code } });
      return { removed: true };
    },
  );

  // =========================================================== facilities
  app.get(
    '/admin/masterdata/facilities',
    { preHandler: guards.requirePermission('manage_facility'), schema: { summary: 'Facility registry for editing (national scope)', tags: ['admin'] } },
    async () => {
      const facilities = await db.facility.findMany({
        include: { region: { select: { id: true, name: true } }, district: { select: { id: true, name: true } }, departments: { select: { id: true, name: true } } },
        orderBy: { name: 'asc' },
        take: 500,
      });
      return {
        facilities: facilities.map((f) => ({
          id: f.id,
          code: f.code,
          name: f.name,
          type: f.type,
          level: f.level,
          ownership: f.ownership,
          operationalStatus: f.operationalStatus,
          accreditation: f.accreditation,
          bedCapacity: f.bedCapacity,
          telephone: f.telephone,
          email: f.email,
          address: f.address,
          website: f.website,
          emergencyContact: f.emergencyContact,
          services: parseJsonArr<string>(f.services),
          departmentsJson: parseJsonArr<string>(f.departmentsJson),
          region: f.region,
          district: f.district,
          departments: f.departments,
        })),
      };
    },
  );

  app.put(
    '/admin/masterdata/facilities/:id',
    { preHandler: guards.requirePermission('manage_facility'), schema: { summary: 'Edit a facility profile (incl. departments)', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const { id } = request.params as { id: string };
      const facility = await db.facility.findUnique({ where: { id } });
      if (!facility) throw httpErrors.notFound('Facility not found');
      // Scope discipline (docs/06): national admins edit any facility; regional/
      // district directors only their own geography; facility staff only their own.
      if (u.scope === 'FACILITY' && u.facilityId !== id) throw httpErrors.forbidden('You can only edit your own facility');
      if (u.scope === 'REGIONAL' && u.regionId !== facility.regionId) throw httpErrors.forbidden('You can only edit facilities in your region');
      if (u.scope === 'DISTRICT' && u.districtId !== facility.districtId) throw httpErrors.forbidden('You can only edit facilities in your district');
      const body = (request.body ?? {}) as Record<string, unknown>;
      const data: Record<string, unknown> = {};
      const notes: string[] = [];
      // Required fields reject empty; nullable fields treat an explicit '' as clear-to-null.
      const strField = (key: string, label: string, max: number, opts: { nullable?: boolean } = {}) => {
        if (body[key] === undefined) return;
        const v = optStr(body[key]);
        if (v === undefined) {
          if (opts.nullable) {
            data[key] = null;
            notes.push(`${key} → (cleared)`);
          }
          return;
        }
        if (v.length > max) throw httpErrors.badRequest(`${label} is too long`);
        data[key] = v;
        notes.push(`${key} → ${data[key]}`);
      };
      strField('name', 'Facility name', 200);
      strField('type', 'Facility type', 60);
      strField('level', 'Facility level', 30, { nullable: true });
      strField('ownership', 'Ownership', 40);
      strField('operationalStatus', 'Operational status', 30);
      strField('accreditation', 'Accreditation', 30, { nullable: true });
      strField('telephone', 'Telephone', 40, { nullable: true });
      strField('email', 'Email', 120, { nullable: true });
      strField('address', 'Address', 300, { nullable: true });
      strField('website', 'Website', 200, { nullable: true });
      strField('emergencyContact', 'Emergency contact', 40, { nullable: true });
      if (body.bedCapacity !== undefined && body.bedCapacity !== null && body.bedCapacity !== '') {
        const beds = num(body.bedCapacity, 'bedCapacity', { required: true }) ?? 0;
        if (beds < 0 || beds > 100000) throw httpErrors.badRequest('bedCapacity out of range');
        data.bedCapacity = beds;
        notes.push(`bedCapacity → ${beds}`);
      }
      if (body.services !== undefined) {
        if (!Array.isArray(body.services)) throw httpErrors.badRequest('services must be an array');
        data.services = JSON.stringify(body.services.map((s) => String(s)));
        notes.push(`services → ${(body.services as unknown[]).length}`);
      }
      // Reconcile Department rows: create missing, reactivate returned, and
      // mark removed ones INACTIVE (queue rows reference them, so never delete).
      if (body.departments !== undefined) {
        if (!Array.isArray(body.departments)) throw httpErrors.badRequest('departments must be an array of names');
        const names = [...new Set(body.departments.map((d) => String(d).trim()).filter(Boolean))] as string[];
        data.departmentsJson = JSON.stringify(names);
        const existing = await db.department.findMany({ where: { facilityId: id } });
        const byName = new Map(existing.map((d) => [d.name, d]));
        for (const n of names) {
          const row = byName.get(n);
          if (!row) await db.department.create({ data: { name: n, facilityId: id, queueEnabled: true } });
          else if (row.status !== 'ACTIVE') await db.department.update({ where: { id: row.id }, data: { status: 'ACTIVE' } });
        }
        for (const row of existing) {
          if (!names.includes(row.name) && row.status === 'ACTIVE') {
            await db.department.update({ where: { id: row.id }, data: { status: 'INACTIVE' } });
          }
        }
        notes.push(`departments → ${names.length}`);
      }
      if (Object.keys(data).length === 0) throw httpErrors.badRequest('Nothing to update');
      const updated = await db.facility.update({ where: { id }, data });
      recordAudit(db, request, { action: 'masterdata.facility.update', entityType: 'facility', entityId: id, after: { code: facility.code, changes: notes } });
      return { facility: { id: updated.id, code: updated.code, name: updated.name } };
    },
  );

  // ============================================================ geography
  app.get(
    '/admin/masterdata/geography',
    { preHandler: guards.requirePermission('manage_region', 'manage_district', 'manage_facility'), schema: { summary: 'Regions & districts for editing', tags: ['admin'] } },
    async () => {
      const regions = await db.region.findMany({
        include: { districts: { select: { id: true, code: true, name: true, type: true, capital: true, status: true } } },
        orderBy: { name: 'asc' },
      });
      return {
        regions: regions.map((r) => ({ id: r.id, code: r.code, name: r.name, capital: r.capital, status: r.status, districts: r.districts })),
      };
    },
  );

  app.put(
    '/admin/masterdata/regions/:id',
    { preHandler: guards.requirePermission('manage_region'), schema: { summary: 'Edit a region (name, capital, status)', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const { id } = request.params as { id: string };
      const region = await db.region.findUnique({ where: { id } });
      if (!region) throw httpErrors.notFound('Region not found');
      if (u.scope === 'REGIONAL' && u.regionId !== id) throw httpErrors.forbidden('You can only edit your own region');
      if (u.scope === 'FACILITY' || u.scope === 'DISTRICT' || u.scope === 'PATIENT') throw httpErrors.forbidden('Region edits require national or regional scope');
      const body = (request.body ?? {}) as Record<string, unknown>;
      const data: { name?: string; capital?: string | null; status?: string } = {};
      const notes: string[] = [];
      const name = optStr(body.name);
      if (name !== undefined) {
        if (name.trim().length < 2) throw httpErrors.badRequest('Region name is too short');
        data.name = name.trim();
        notes.push(`name → ${data.name}`);
      }
      if (body.capital !== undefined) {
        const capital = body.capital === null ? null : optStr(body.capital) ?? '';
        data.capital = capital === '' ? null : capital;
        notes.push(`capital → ${data.capital ?? '(none)'}`);
      }
      const status = optStr(body.status);
      if (status !== undefined) {
        if (!['ACTIVE', 'INACTIVE'].includes(status)) throw httpErrors.badRequest('Region status must be ACTIVE or INACTIVE');
        data.status = status;
        notes.push(`status → ${status}`);
      }
      if (Object.keys(data).length === 0) throw httpErrors.badRequest('Nothing to update');
      const updated = await db.region.update({ where: { id }, data });
      recordAudit(db, request, { action: 'masterdata.region.update', entityType: 'region', entityId: id, after: { code: region.code, changes: notes } });
      return { region: { id: updated.id, code: updated.code, name: updated.name, capital: updated.capital, status: updated.status } };
    },
  );

  app.put(
    '/admin/masterdata/districts/:id',
    { preHandler: guards.requirePermission('manage_district'), schema: { summary: 'Edit a district (name, capital, type, status)', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const { id } = request.params as { id: string };
      const district = await db.district.findUnique({ where: { id } });
      if (!district) throw httpErrors.notFound('District not found');
      if (u.scope === 'REGIONAL' && district.regionId !== u.regionId) throw httpErrors.forbidden('You can only edit districts in your region');
      if (u.scope === 'DISTRICT' && u.districtId !== id) throw httpErrors.forbidden('You can only edit your own district');
      if (u.scope === 'FACILITY' || u.scope === 'PATIENT') throw httpErrors.forbidden('District edits require national, regional or district scope');
      const body = (request.body ?? {}) as Record<string, unknown>;
      const data: { name?: string; capital?: string | null; type?: string; status?: string } = {};
      const notes: string[] = [];
      const name = optStr(body.name);
      if (name !== undefined) {
        if (name.trim().length < 2) throw httpErrors.badRequest('District name is too short');
        data.name = name.trim();
        notes.push(`name → ${data.name}`);
      }
      if (body.capital !== undefined) {
        const capital = body.capital === null ? null : optStr(body.capital) ?? '';
        data.capital = capital === '' ? null : capital;
        notes.push(`capital → ${data.capital ?? '(none)'}`);
      }
      const type = optStr(body.type);
      if (type !== undefined) {
        if (!['METROPOLITAN', 'MUNICIPAL', 'DISTRICT'].includes(type)) throw httpErrors.badRequest('District type must be METROPOLITAN, MUNICIPAL or DISTRICT');
        data.type = type;
        notes.push(`type → ${type}`);
      }
      const status = optStr(body.status);
      if (status !== undefined) {
        if (!['ACTIVE', 'INACTIVE'].includes(status)) throw httpErrors.badRequest('District status must be ACTIVE or INACTIVE');
        data.status = status;
        notes.push(`status → ${status}`);
      }
      if (Object.keys(data).length === 0) throw httpErrors.badRequest('Nothing to update');
      const updated = await db.district.update({ where: { id }, data });
      recordAudit(db, request, { action: 'masterdata.district.update', entityType: 'district', entityId: id, after: { code: district.code, changes: notes } });
      return { district: { id: updated.id, code: updated.code, name: updated.name, type: updated.type, capital: updated.capital, status: updated.status } };
    },
  );
}


