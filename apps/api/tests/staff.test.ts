import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser, makeFacility } from './helpers.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;
let admin: { token: string };
let facAdmin: { token: string };
let userAdmin: { token: string };
let facUserAdmin: { token: string };
let limited: { token: string };
let facA: { id: string };
let facB: { id: string };
const created: { unitId?: string; wardId?: string; headId?: string; memberId?: string; loginUserIds: string[] } = { loginUserIds: [] };

beforeAll(async () => {
  facA = await makeFacility('Staff Facility A (synthetic)');
  facB = await makeFacility('Staff Facility B (synthetic)');
  await db.department.create({ data: { name: 'Medicine', facilityId: facA.id, queueEnabled: true } });
  await db.department.create({ data: { name: 'Surgery', facilityId: facA.id, queueEnabled: true } });
  await db.department.create({ data: { name: 'Medicine', facilityId: facB.id, queueEnabled: true } });

  // The test DB is force-reset (global-setup) — seed the standard login roles
  // the link-user endpoints map onto.
  for (const code of ['DOCTOR', 'NURSE', 'LAB_SCIENTIST']) {
    await db.role.upsert({ where: { code }, create: { code, name: code.replace(/_/g, ' '), scope: 'FACILITY', permissions: '[]' }, update: {} });
  }

  app = await createTestApp();
  admin = await makeUser({ email: 'staff-admin@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'NATIONAL', permissions: ['manage_facility', 'view_audit'] });
  facAdmin = await makeUser({ email: 'staff-fac@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'FACILITY', facilityId: facA.id, permissions: ['manage_facility'] });
  // manage_users + manage_facility — the profile that can create staff logins.
  userAdmin = await makeUser({ email: 'staff-useradmin@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'NATIONAL', permissions: ['manage_facility', 'manage_users'] });
  // Same permissions but facility-scoped to facA — the out-of-scope probe.
  facUserAdmin = await makeUser({ email: 'staff-facuseradmin@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'FACILITY', facilityId: facA.id, permissions: ['manage_facility', 'manage_users'] });
  limited = await makeUser({ email: 'staff-limited@demo.gh', roleCode: 'HOSPITAL_ADMIN', permissions: ['view_patient'] });
});

afterAll(async () => {
  await db.staff.deleteMany({ where: { facilityId: { in: [facA.id, facB.id] } } });
  await db.user.deleteMany({ where: { id: { in: created.loginUserIds } } });
  await db.bed.deleteMany({ where: { facilityId: { in: [facA.id, facB.id] } } });
  await db.equipmentMaintenance.deleteMany({ where: { equipment: { unit: { facilityId: { in: [facA.id, facB.id] } } } } });
  await db.unitEquipment.deleteMany({ where: { facilityId: { in: [facA.id, facB.id] } } });
  await db.ward.deleteMany({ where: { unit: { facilityId: { in: [facA.id, facB.id] } } } });
  await db.hospitalUnit.deleteMany({ where: { facilityId: { in: [facA.id, facB.id] } } });
  await db.department.deleteMany({ where: { facilityId: { in: [facA.id, facB.id] } } });
  await db.auditLog.deleteMany({ where: { action: { startsWith: 'masterdata.' } } });
  await db.facility.deleteMany({ where: { id: { in: [facA.id, facB.id] } } });
  await db.$disconnect();
  await app.close();
});

const auth = (t: string) => ({ authorization: `Bearer ${t}` });

async function seedUnit(facilityId: string, code: string, name: string, departmentName: string) {
  const department = await db.department.findFirst({ where: { facilityId, name: departmentName } });
  return db.hospitalUnit.create({
    data: { facilityId, departmentId: department?.id ?? null, code, name, type: 'CLINICAL', status: 'ACTIVE' },
  });
}

describe('staff — guards', () => {
  it('denies every endpoint without manage_facility', async () => {
    const list = await app.inject({ method: 'GET', url: '/api/v1/admin/masterdata/staff', headers: auth(limited.token) });
    expect(list.statusCode).toBe(403);
    const create = await app.inject({ method: 'POST', url: '/api/v1/admin/masterdata/staff', headers: auth(limited.token), payload: { facilityId: facA.id, staffNumber: 'X-1', fullName: 'X', role: 'NURSE' } });
    expect(create.statusCode).toBe(403);
  });
});

describe('staff — create & audit', () => {
  it('creates a staff member under a unit with audit + config label', async () => {
    const unit = await seedUnit(facA.id, 'ICU', 'Intensive Care Unit', 'Medicine');
    created.unitId = unit.id;
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/masterdata/staff',
      headers: auth(admin.token),
      payload: { facilityId: facA.id, unitId: unit.id, staffNumber: 'A-0001', fullName: 'Dr. Abena Owusu (test)', role: 'CONSULTANT', speciality: 'Intensive Care', licenseNumber: 'GMC-T1', phone: '0244000001', email: 'abena@test.gh', headOfUnit: true },
    });
    expect(res.statusCode).toBe(200);
    const s = res.json().staff;
    expect(s.staffNumber).toBe('A-0001');
    expect(s.role).toBe('CONSULTANT');
    expect(s.headOfUnit).toBe(true);
    expect(s.unit.code).toBe('ICU');
    created.headId = s.id;

    const audit = await db.auditLog.findFirst({ where: { action: 'masterdata.staff.create', entityId: s.id } });
    expect(audit?.after).toContain('A-0001');
    const config = await app.inject({ method: 'GET', url: '/api/v1/admin/audit/config', headers: auth(admin.token) });
    expect(config.json().entries.some((e: { entityId: string; label: string }) => e.entityId === s.id && e.label === 'Staff added')).toBe(true);
  });

  it('rejects duplicate staff numbers, unknown roles and units from another facility', async () => {
    const dup = await app.inject({ method: 'POST', url: '/api/v1/admin/masterdata/staff', headers: auth(admin.token), payload: { facilityId: facA.id, staffNumber: 'A-0001', fullName: 'Another', role: 'NURSE' } });
    expect(dup.statusCode).toBe(409);
    const badRole = await app.inject({ method: 'POST', url: '/api/v1/admin/masterdata/staff', headers: auth(admin.token), payload: { facilityId: facA.id, staffNumber: 'A-0002', fullName: 'Bad', role: 'SORCERER' } });
    expect(badRole.statusCode).toBe(400);
    const badStatus = await app.inject({ method: 'POST', url: '/api/v1/admin/masterdata/staff', headers: auth(admin.token), payload: { facilityId: facA.id, staffNumber: 'A-0003', fullName: 'Bad', role: 'NURSE', employmentStatus: 'VAPED' } });
    expect(badStatus.statusCode).toBe(400);
    const otherFacilityUnit = await seedUnit(facB.id, 'ICU-B', 'ICU B', 'Medicine');
    const badUnit = await app.inject({ method: 'POST', url: '/api/v1/admin/masterdata/staff', headers: auth(admin.token), payload: { facilityId: facA.id, unitId: otherFacilityUnit.id, staffNumber: 'A-0004', fullName: 'Wrong unit', role: 'NURSE' } });
    expect(badUnit.statusCode).toBe(400);
    // A head of unit must lead a unit — an orphan head flag is rejected.
    const orphanHead = await app.inject({ method: 'POST', url: '/api/v1/admin/masterdata/staff', headers: auth(admin.token), payload: { facilityId: facA.id, staffNumber: 'A-0006', fullName: 'Orphan head', role: 'NURSE', headOfUnit: true } });
    expect(orphanHead.statusCode).toBe(400);
  });

  it('keeps head-of-unit exclusive on create (promotion clears the previous head)', async () => {
    const promoted = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/masterdata/staff',
      headers: auth(admin.token),
      payload: { facilityId: facA.id, unitId: created.unitId, staffNumber: 'A-0005', fullName: 'Dr. New Head (test)', role: 'MEDICAL_OFFICER', headOfUnit: true },
    });
    expect(promoted.statusCode).toBe(200);
    const oldHead = await db.staff.findUnique({ where: { id: created.headId } });
    expect(oldHead?.headOfUnit).toBe(false);
    const newHead = await db.staff.findUnique({ where: { id: promoted.json().staff.id } });
    expect(newHead?.headOfUnit).toBe(true);
    created.headId = newHead!.id;
    created.memberId = oldHead!.id;
  });
});

describe('staff — update & head transitions', () => {
  it('updates details and employment status with audit', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/admin/masterdata/staff/${created.memberId}`,
      headers: auth(facAdmin.token),
      payload: { fullName: 'Dr. Abena Owusu (renamed)', speciality: 'Critical Care', employmentStatus: 'ON_LEAVE', phone: '0244000002' },
    });
    expect(res.statusCode).toBe(200);
    const s = res.json().staff;
    expect(s.fullName).toBe('Dr. Abena Owusu (renamed)');
    expect(s.employmentStatus).toBe('ON_LEAVE');
    expect(s.speciality).toBe('Critical Care');
    const audit = await db.auditLog.findFirst({ where: { action: 'masterdata.staff.update', entityId: created.memberId }, orderBy: { createdAt: 'desc' } });
    expect(audit?.after).toContain('ON_LEAVE');
  });

  it('promotes a new head on update and demotes the old one', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/admin/masterdata/staff/${created.memberId}`,
      headers: auth(admin.token),
      payload: { headOfUnit: true },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().staff.headOfUnit).toBe(true);
    const oldHead = await db.staff.findUnique({ where: { id: created.headId } });
    expect(oldHead?.headOfUnit).toBe(false);
  });

  it('refuses to promote an unassigned staff member to head of unit', async () => {
    const unassigned = await app.inject({ method: 'POST', url: '/api/v1/admin/masterdata/staff', headers: auth(admin.token), payload: { facilityId: facA.id, staffNumber: 'A-0010', fullName: 'Unassigned Nurse (test)', role: 'NURSE' } });
    expect(unassigned.statusCode).toBe(200);
    const sid = unassigned.json().staff.id;
    const promoted = await app.inject({ method: 'PUT', url: `/api/v1/admin/masterdata/staff/${sid}`, headers: auth(admin.token), payload: { headOfUnit: true } });
    expect(promoted.statusCode).toBe(400);
    // Assigning a unit first makes the promotion legal.
    const withUnit = await app.inject({ method: 'PUT', url: `/api/v1/admin/masterdata/staff/${sid}`, headers: auth(admin.token), payload: { unitId: created.unitId, headOfUnit: true } });
    expect(withUnit.statusCode).toBe(200);
    expect(withUnit.json().staff.headOfUnit).toBe(true);
  });

  it('moving a head to another unit clears the old unit head flag', async () => {
    const surgery = await seedUnit(facA.id, 'GEN-SURG', 'General Surgery', 'Surgery');
    // Move the current head to Surgery.
    const moved = await app.inject({
      method: 'PUT',
      url: `/api/v1/admin/masterdata/staff/${created.memberId}`,
      headers: auth(admin.token),
      payload: { unitId: surgery.id, headOfUnit: true },
    });
    expect(moved.statusCode).toBe(200);
    expect(moved.json().staff.unit.code).toBe('GEN-SURG');
    expect(moved.json().staff.headOfUnit).toBe(true);
    // The ICU has no head now — the flag followed the person.
    const icuHeads = await db.staff.count({ where: { unitId: created.unitId, headOfUnit: true } });
    expect(icuHeads).toBe(0);
    const surgHeads = await db.staff.count({ where: { unitId: surgery.id, headOfUnit: true } });
    expect(surgHeads).toBe(1);
    // Move back so later tests have a stable fixture.
    await app.inject({ method: 'PUT', url: `/api/v1/admin/masterdata/staff/${created.memberId}`, headers: auth(admin.token), payload: { unitId: created.unitId, headOfUnit: true } });
    await db.hospitalUnit.delete({ where: { id: surgery.id } });
  });
});

describe('staff — directory, unit team & tree summary', () => {
  it('lists the directory scoped to a facility with summary', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/admin/masterdata/staff?facilityId=${facA.id}`, headers: auth(admin.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.staff.length).toBeGreaterThanOrEqual(2);
    expect(body.summary.total).toBe(body.staff.length);
    expect(body.summary.heads).toBeGreaterThanOrEqual(1);
    // Unassigned staff are part of the facility directory too.
    const created = await app.inject({ method: 'POST', url: '/api/v1/admin/masterdata/staff', headers: auth(admin.token), payload: { facilityId: facA.id, staffNumber: 'A-0099', fullName: 'Records Officer (test)', role: 'RECORDS_OFFICER' } });
    expect(created.statusCode).toBe(200);
    expect(created.json().staff.unit).toBeNull();
  });

  it('filters by unit and role', async () => {
    const byUnit = await app.inject({ method: 'GET', url: `/api/v1/admin/masterdata/staff?facilityId=${facA.id}&unitId=${created.unitId}`, headers: auth(admin.token) });
    expect(byUnit.json().staff.every((s: { unit: { id: string } | null }) => s.unit?.id === created.unitId)).toBe(true);
    const byRole = await app.inject({ method: 'GET', url: `/api/v1/admin/masterdata/staff?facilityId=${facA.id}&role=NURSE`, headers: auth(admin.token) });
    expect(byRole.json().staff.every((s: { role: string }) => s.role === 'NURSE')).toBe(true);
    const badRole = await app.inject({ method: 'GET', url: `/api/v1/admin/masterdata/staff?facilityId=${facA.id}&role=WIZARD`, headers: auth(admin.token) });
    expect(badRole.statusCode).toBe(400);
  });

  it('lists a unit team via the unit endpoint', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/admin/masterdata/units/${created.unitId}/staff`, headers: auth(admin.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.unit.code).toBe('ICU');
    expect(body.team.length).toBeGreaterThanOrEqual(2);
    // The head sorts first.
    expect(body.team[0].headOfUnit).toBe(true);
  });

  it('surfaces team + facility staff summary in the units tree', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/admin/masterdata/units?facilityId=${facA.id}`, headers: auth(admin.token) });
    const fac = res.json().facilities[0];
    // 2 ICU staff (head + member) + the unassigned records officer from above.
    expect(fac.facility.staff.total).toBeGreaterThanOrEqual(3);
    expect(fac.facility.staff.assigned).toBeGreaterThanOrEqual(2);
    expect(fac.facility.staff.heads).toBeGreaterThanOrEqual(1);
    const units = fac.departments.flatMap((d: { units: unknown[] }) => d.units) as Array<{ code: string; team: { count: number; heads: number; onLeave: number } }>;
    const icu = units.find((u) => u.code === 'ICU');
    expect(icu?.team.count).toBeGreaterThanOrEqual(2);
    expect(icu?.team.heads).toBeGreaterThanOrEqual(1);
    // The ON_LEAVE member shows up in the roll-up.
    expect(icu?.team.onLeave).toBeGreaterThanOrEqual(1);
  });
});

describe('staff — scope discipline', () => {
  it('refuses out-of-scope directory reads via facilityId', async () => {
    // facAdmin (bound to facA) must not read facB's staff.
    const denied = await app.inject({ method: 'GET', url: `/api/v1/admin/masterdata/staff?facilityId=${facB.id}`, headers: auth(facAdmin.token) });
    expect(denied.statusCode).toBe(403);
    const ok = await app.inject({ method: 'GET', url: `/api/v1/admin/masterdata/staff?facilityId=${facA.id}`, headers: auth(facAdmin.token) });
    expect(ok.statusCode).toBe(200);
    const missing = await app.inject({ method: 'GET', url: '/api/v1/admin/masterdata/staff?facilityId=does-not-exist', headers: auth(admin.token) });
    expect(missing.statusCode).toBe(404);
  });

  it('treats out-of-scope staff as 404 on update/remove', async () => {
    const otherFacAdmin = await makeUser({ email: 'staff-facb@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'FACILITY', facilityId: facB.id, permissions: ['manage_facility'] });
    const denied = await app.inject({ method: 'PUT', url: `/api/v1/admin/masterdata/staff/${created.memberId}`, headers: auth(otherFacAdmin.token), payload: { fullName: 'Hijack' } });
    expect(denied.statusCode).toBe(404);
    const deniedRemove = await app.inject({ method: 'POST', url: `/api/v1/admin/masterdata/staff/${created.memberId}/remove`, headers: auth(otherFacAdmin.token), payload: {} });
    expect(deniedRemove.statusCode).toBe(404);
  });
});

describe('staff — removal', () => {
  it('removes a staff member and audits it', async () => {
    const res = await app.inject({ method: 'POST', url: `/api/v1/admin/masterdata/staff/${created.memberId}/remove`, headers: auth(admin.token), payload: {} });
    expect(res.statusCode).toBe(200);
    expect(res.json().removed).toBe(true);
    expect(await db.staff.findUnique({ where: { id: created.memberId } })).toBeNull();
    const audit = await db.auditLog.findFirst({ where: { action: 'masterdata.staff.remove', entityId: created.memberId } });
    expect(audit).toBeTruthy();
  });
});

describe('staff — login accounts (link-user)', () => {
  it('creates a login account from a staff record with the role auto-mapped', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/masterdata/staff',
      headers: auth(userAdmin.token),
      payload: { facilityId: facA.id, staffNumber: 'A-0301', fullName: 'Dr. Login Med (synthetic)', role: 'MEDICAL_OFFICER', email: 'loginmed@test.gh' },
    });
    const s = res.json().staff as { id: string };
    const link = await app.inject({ method: 'POST', url: `/api/v1/admin/masterdata/staff/${s.id}/link-user`, headers: auth(userAdmin.token), payload: { password: 'Password@123' } });
    expect(link.statusCode).toBe(200);
    const user = link.json().user as { id: string; email: string; roleCode: string };
    expect(user.roleCode).toBe('DOCTOR'); // auto-mapped from MEDICAL_OFFICER
    expect(user.email).toBe('loginmed@test.gh'); // the record's own email wins
    created.loginUserIds.push(user.id);

    // The directory row now carries the linked account.
    const dir = await app.inject({ method: 'GET', url: `/api/v1/admin/masterdata/staff?facilityId=${facA.id}`, headers: auth(userAdmin.token) });
    const row = (dir.json().staff as Array<{ id: string; user: { email: string; roleCode: string } | null }>).find((x) => x.id === s.id);
    expect(row?.user).toMatchObject({ email: 'loginmed@test.gh', roleCode: 'DOCTOR' });

    // The account can actually log in with the temporary password.
    const login = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email: 'loginmed@test.gh', password: 'Password@123' } });
    expect(login.statusCode).toBe(200);

    const audit = await db.auditLog.findFirst({ where: { action: 'masterdata.staff.link-user', entityId: s.id } });
    expect(audit?.after).toContain('DOCTOR');
  });

  it('derives a deterministic email from the staff number when none exists', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/admin/masterdata/staff', headers: auth(userAdmin.token), payload: { facilityId: facA.id, staffNumber: 'A-0302', fullName: 'Nurse Nomail (synthetic)', role: 'NURSE' } });
    const s = res.json().staff as { id: string; facility: { code: string } };
    const link = await app.inject({ method: 'POST', url: `/api/v1/admin/masterdata/staff/${s.id}/link-user`, headers: auth(userAdmin.token), payload: { password: 'Password@123' } });
    expect(link.statusCode).toBe(200);
    expect(link.json().user.email).toBe(`a-0302@${s.facility.code.toLowerCase()}.gh`);
    created.loginUserIds.push((link.json().user as { id: string }).id);
  });

  it('requires an explicit role for unmapped cadres and enforces the password policy', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/admin/masterdata/staff', headers: auth(userAdmin.token), payload: { facilityId: facA.id, staffNumber: 'A-0303', fullName: 'Radiographer X (synthetic)', role: 'RADIOGRAPHER' } });
    const s = res.json().staff as { id: string };
    // No auto-map for RADIOGRAPHER → explicit roleCode required.
    const noRole = await app.inject({ method: 'POST', url: `/api/v1/admin/masterdata/staff/${s.id}/link-user`, headers: auth(userAdmin.token), payload: { password: 'Password@123' } });
    expect(noRole.statusCode).toBe(400);
    const weak = await app.inject({ method: 'POST', url: `/api/v1/admin/masterdata/staff/${s.id}/link-user`, headers: auth(userAdmin.token), payload: { roleCode: 'LAB_SCIENTIST', password: 'short' } });
    expect(weak.statusCode).toBe(400);
    const explicit = await app.inject({ method: 'POST', url: `/api/v1/admin/masterdata/staff/${s.id}/link-user`, headers: auth(userAdmin.token), payload: { roleCode: 'LAB_SCIENTIST', password: 'Password@123' } });
    expect(explicit.statusCode).toBe(200);
    expect(explicit.json().user.roleCode).toBe('LAB_SCIENTIST');
    created.loginUserIds.push((explicit.json().user as { id: string }).id);

    // Already linked → 409; duplicate email elsewhere → 409.
    const dup = await app.inject({ method: 'POST', url: `/api/v1/admin/masterdata/staff/${s.id}/link-user`, headers: auth(userAdmin.token), payload: { roleCode: 'LAB_SCIENTIST', password: 'Password@123' } });
    expect(dup.statusCode).toBe(409);
    const other = await app.inject({ method: 'POST', url: '/api/v1/admin/masterdata/staff', headers: auth(userAdmin.token), payload: { facilityId: facA.id, staffNumber: 'A-0304', fullName: 'Dup Email (synthetic)', role: 'NURSE', email: 'loginmed@test.gh' } });
    const o = other.json().staff as { id: string };
    const dupEmail = await app.inject({ method: 'POST', url: `/api/v1/admin/masterdata/staff/${o.id}/link-user`, headers: auth(userAdmin.token), payload: { roleCode: 'NURSE', password: 'Password@123' } });
    expect(dupEmail.statusCode).toBe(409);
  });

  it('unlinks the account without deleting it', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/admin/masterdata/staff', headers: auth(userAdmin.token), payload: { facilityId: facA.id, staffNumber: 'A-0305', fullName: 'Nurse Unlink (synthetic)', role: 'NURSE', email: 'unlink@test.gh' } });
    const s = res.json().staff as { id: string };
    const link = await app.inject({ method: 'POST', url: `/api/v1/admin/masterdata/staff/${s.id}/link-user`, headers: auth(userAdmin.token), payload: { roleCode: 'NURSE', password: 'Password@123' } });
    expect(link.statusCode).toBe(200);
    const userId = (link.json().user as { id: string }).id;
    created.loginUserIds.push(userId);

    const unlink = await app.inject({ method: 'POST', url: `/api/v1/admin/masterdata/staff/${s.id}/unlink-user`, headers: auth(userAdmin.token), payload: {} });
    expect(unlink.statusCode).toBe(200);
    expect(unlink.json().unlinked).toBe(true);
    expect(await db.user.findUnique({ where: { id: userId } })).not.toBeNull();
    const dir = await app.inject({ method: 'GET', url: `/api/v1/admin/masterdata/staff?facilityId=${facA.id}`, headers: auth(userAdmin.token) });
    const row = (dir.json().staff as Array<{ id: string; user: unknown }>).find((x) => x.id === s.id);
    expect(row?.user).toBeNull();
    const audit = await db.auditLog.findFirst({ where: { action: 'masterdata.staff.unlink-user', entityId: s.id } });
    expect(audit).toBeTruthy();
  });

  it('requires manage_users and refuses out-of-scope links', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/admin/masterdata/staff', headers: auth(admin.token), payload: { facilityId: facA.id, staffNumber: 'A-0306', fullName: 'Guard Test (synthetic)', role: 'NURSE', email: 'guard@test.gh' } });
    const s = res.json().staff as { id: string };
    // facAdmin holds manage_facility only — creating logins is off-limits.
    const denied = await app.inject({ method: 'POST', url: `/api/v1/admin/masterdata/staff/${s.id}/link-user`, headers: auth(facAdmin.token), payload: { roleCode: 'NURSE', password: 'Password@123' } });
    expect(denied.statusCode).toBe(403);
    // facB staff are out of facUserAdmin's scope → 404 even with valid permissions.
    const b = await app.inject({ method: 'POST', url: '/api/v1/admin/masterdata/staff', headers: auth(admin.token), payload: { facilityId: facB.id, staffNumber: 'B-0301', fullName: 'Fac B Nurse (synthetic)', role: 'NURSE', email: 'facb@test.gh' } });
    const bs = b.json().staff as { id: string };
    const scope = await app.inject({ method: 'POST', url: `/api/v1/admin/masterdata/staff/${bs.id}/link-user`, headers: auth(facUserAdmin.token), payload: { roleCode: 'NURSE', password: 'Password@123' } });
    expect(scope.statusCode).toBe(404);
  });
});
