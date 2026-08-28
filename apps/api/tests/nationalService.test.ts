import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser, makeFacility } from './helpers.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;
let admin: { token: string };
let facAdmin: { token: string };
let limited: { token: string };
let facA: { id: string };
let facB: { id: string };
let unitA: { id: string };

beforeAll(async () => {
  facA = await makeFacility('NSS Facility A (synthetic)');
  facB = await makeFacility('NSS Facility B (synthetic)');
  await db.department.create({ data: { name: 'Medicine', facilityId: facA.id, queueEnabled: true } });
  const unit = await db.hospitalUnit.create({
    data: { facilityId: facA.id, code: 'GEN-MED', name: 'General Medicine', type: 'CLINICAL', location: 'Block A' },
  });
  unitA = { id: unit.id };

  app = await createTestApp();
  admin = await makeUser({ email: 'nss-admin@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'NATIONAL', permissions: ['manage_facility', 'manage_roles_permissions', 'view_audit'] });
  facAdmin = await makeUser({ email: 'nss-fac@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'FACILITY', facilityId: facA.id, permissions: ['manage_facility'] });
  limited = await makeUser({ email: 'nss-limited@demo.gh', roleCode: 'HOSPITAL_ADMIN', permissions: ['view_patient'] });
});

afterAll(async () => {
  await db.nationalServiceStaff.deleteMany({ where: { facilityId: { in: [facA.id, facB.id] } } });
  await db.auditLog.deleteMany({ where: { action: { startsWith: 'masterdata.nss' } } });
  await db.hospitalUnit.deleteMany({ where: { facilityId: facA.id } });
  await db.department.deleteMany({ where: { facilityId: facA.id } });
  await db.facility.deleteMany({ where: { id: { in: [facA.id, facB.id] } } });
  await db.user.deleteMany({ where: { email: 'nss-holder@demo.gh' } });
  await db.auditLog.deleteMany({ where: { action: { startsWith: 'masterdata.role' } } });
  await db.role.deleteMany({ where: { code: { startsWith: 'TESTROLE' } } });
  await db.$disconnect();
  await app.close();
});

const auth = (t: string) => ({ authorization: `Bearer ${t}` });

describe('national service — guards', () => {
  it('denies without manage_facility', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/admin/masterdata/national-service', headers: auth(limited.token) });
    expect(res.statusCode).toBe(403);
  });
});

describe('national service — CRUD', () => {
  it('creates a posting with an auto-generated NSS number', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/masterdata/national-service',
      headers: auth(admin.token),
      payload: { facilityId: facA.id, unitId: unitA.id, fullName: 'Test Graduate (synthetic)', institution: 'University of Ghana', programme: 'BSc Nursing', placement: 'Ward support', startDate: '2026-01-15' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.personnel.fullName).toBe('Test Graduate (synthetic)');
    expect(body.personnel.nssNumber).toMatch(/^NSS-\d{4}-\d{4}$/);
    expect(body.personnel.status).toBe('ACTIVE');
    expect(body.personnel.unit?.id).toBe(unitA.id);
  });

  it('rejects an end date before the start date', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/masterdata/national-service',
      headers: auth(admin.token),
      payload: { facilityId: facA.id, fullName: 'Backwards Dates (synthetic)', startDate: '2026-06-01', endDate: '2026-01-01' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects duplicate NSS numbers per facility', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/masterdata/national-service',
      headers: auth(admin.token),
      payload: { facilityId: facA.id, nssNumber: 'NSS-2026-0001', fullName: 'Duplicate Grad (synthetic)' },
    });
    expect(res.statusCode).toBe(409);
  });

  it('lists, filters and summarizes postings', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/admin/masterdata/national-service?facilityId=${facA.id}`, headers: auth(admin.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.personnel.length).toBeGreaterThan(0);
    expect(body.summary.total).toBe(body.personnel.length);
    expect(body.summary.active).toBeGreaterThan(0);
    const search = await app.inject({ method: 'GET', url: `/api/v1/admin/masterdata/national-service?q=Graduate&facilityId=${facA.id}`, headers: auth(admin.token) });
    expect(search.json().personnel.every((p: { fullName: string }) => p.fullName.includes('Graduate'))).toBe(true);
  });

  it('updates a posting (status + supervisor) with audit', async () => {
    const list = await app.inject({ method: 'GET', url: `/api/v1/admin/masterdata/national-service?facilityId=${facA.id}`, headers: auth(admin.token) });
    const p = list.json().personnel[0] as { id: string };
    const upd = await app.inject({
      method: 'PUT',
      url: `/api/v1/admin/masterdata/national-service/${p.id}`,
      headers: auth(admin.token),
      payload: { status: 'COMPLETED', supervisor: 'Nurse In-Charge', endDate: '2026-12-31' },
    });
    expect(upd.statusCode).toBe(200);
    expect(upd.json().personnel.status).toBe('COMPLETED');
    expect(upd.json().personnel.supervisor).toBe('Nurse In-Charge');
    const audit = await db.auditLog.findFirst({ where: { action: 'masterdata.nss.update', entityId: p.id } });
    expect(audit).toBeTruthy();
  });

  it('enforces facility scope — never touches another facility', async () => {
    const other = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/masterdata/national-service',
      headers: auth(facAdmin.token),
      payload: { facilityId: facB.id, fullName: 'Cross Facility Grad (synthetic)' },
    });
    expect(other.statusCode).toBe(403);
    const list = await app.inject({ method: 'GET', url: '/api/v1/admin/masterdata/national-service', headers: auth(facAdmin.token) });
    const ids = list.json().personnel.map((p: { facility: { id: string } }) => p.facility.id);
    expect(ids.every((id: string) => id === facA.id)).toBe(true);
  });

  it('removes a posting', async () => {
    const list = await app.inject({ method: 'GET', url: `/api/v1/admin/masterdata/national-service?facilityId=${facA.id}`, headers: auth(admin.token) });
    const p = list.json().personnel[0] as { id: string };
    const del = await app.inject({ method: 'POST', url: `/api/v1/admin/masterdata/national-service/${p.id}/remove`, headers: auth(admin.token), payload: {} });
    expect(del.statusCode).toBe(200);
    expect(del.json().removed).toBe(true);
  });
});

describe('roles — create and delete', () => {
  it('creates a new role with a permission set', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/masterdata/roles',
      headers: auth(admin.token),
      payload: { code: 'TESTROLE_LAB_TECH', name: 'Laboratory Technician', scope: 'FACILITY', permissions: ['view_patient', 'order_lab'] },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().role.code).toBe('TESTROLE_LAB_TECH');
    const audit = await db.auditLog.findFirst({ where: { action: 'masterdata.role.create' } });
    expect(audit).toBeTruthy();
  });

  it('rejects duplicate and structural codes', async () => {
    const dup = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/masterdata/roles',
      headers: auth(admin.token),
      payload: { code: 'TESTROLE_LAB_TECH', name: 'Again', scope: 'FACILITY', permissions: [] },
    });
    expect(dup.statusCode).toBe(409);
    const dev = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/masterdata/roles',
      headers: auth(admin.token),
      payload: { code: 'DEVELOPER', name: 'Dev', scope: 'DEVELOPER', permissions: [] },
    });
    expect(dev.statusCode).toBe(400);
    const badPerm = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/masterdata/roles',
      headers: auth(admin.token),
      payload: { code: 'TESTROLE_BADPERM', name: 'Bad Perm', scope: 'FACILITY', permissions: ['not_a_real_permission'] },
    });
    expect(badPerm.statusCode).toBe(400);
  });

  it('deletes an unused role and refuses deleting an assigned one', async () => {
    const role = await db.role.findUnique({ where: { code: 'TESTROLE_LAB_TECH' } });
    expect(role).toBeTruthy();
    const del = await app.inject({ method: 'DELETE', url: '/api/v1/admin/masterdata/roles/TESTROLE_LAB_TECH', headers: auth(admin.token) });
    expect(del.statusCode).toBe(200);
    expect(del.json().removed).toBe(true);

    // Assigned roles cannot be deleted — create one, assign a user, refuse.
    const assigned = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/masterdata/roles',
      headers: auth(admin.token),
      payload: { code: 'TESTROLE_ASSIGNED', name: 'Assigned Role', scope: 'FACILITY', permissions: [] },
    });
    expect(assigned.statusCode).toBe(200);
    const roleRow = await db.role.findUnique({ where: { code: 'TESTROLE_ASSIGNED' } });
    const holder = await makeUser({ email: 'nss-holder@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'FACILITY', facilityId: facA.id, permissions: [] });
    await db.user.update({ where: { id: holder.userId }, data: { roleId: roleRow!.id } });
    const refused = await app.inject({ method: 'DELETE', url: '/api/v1/admin/masterdata/roles/TESTROLE_ASSIGNED', headers: auth(admin.token) });
    expect(refused.statusCode).toBe(409);
  });

  it('requires manage_roles_permissions for role changes', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/masterdata/roles',
      headers: auth(facAdmin.token),
      payload: { code: 'TESTROLE_NOPERM', name: 'No Perm', scope: 'FACILITY', permissions: [] },
    });
    expect(res.statusCode).toBe(403);
  });
});
