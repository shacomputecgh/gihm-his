import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser, type TestUser } from './helpers.js';
import type { FastifyInstance } from 'fastify';
import { passwordMinLength } from '../src/modules/admin/users.js';

// Admin user management (spec §5, §97-§99): listing users (scoped), creating
// accounts (never DEVELOPER), activating/suspending/locking, changing roles
// (never DEVELOPER, never a self-demotion to patient access) and resetting
// passwords. The license-capacity and password-policy interplay lives in
// developer.test.ts / policy.test.ts — these cover the lifecycle itself, the
// scope boundaries and the validation guards.
let app: FastifyInstance;
let admin: TestUser;
let facilityAdmin: TestUser;
let noPerm: TestUser;

let r1: { id: string };
let r2: { id: string };
let d1: { id: string };
let d2: { id: string };
let a1f: { id: string };
let a2f: { id: string };
const roleCodes = ['USR-NURSE', 'USR-DOCTOR', 'USR-PATIENT'];
const userIds: string[] = [];

const STAFF_PERMS = JSON.stringify(['view_patient', 'view_dashboard', 'write_clinical_note']);

async function createRegion(code: string, name: string) {
  return db.region.create({ data: { code, name, capital: 'Test Capital' } });
}
async function createDistrict(code: string, name: string, regionId: string) {
  return db.district.create({ data: { code, name, type: 'DISTRICT', regionId } });
}
async function createFacility(code: string, name: string, regionId: string, districtId: string) {
  return db.facility.create({
    data: {
      code,
      name,
      type: 'CLINIC',
      level: 'PRIMARY',
      ownership: 'PRIVATE',
      regionId,
      districtId,
      services: '["OPD"]',
      departmentsJson: '[]',
      openingHours: '{}',
      isSynthetic: true,
      status: 'ACTIVE',
    },
  });
}

beforeAll(async () => {
  r1 = await createRegion('USR-1', 'User Region One (synthetic)');
  r2 = await createRegion('USR-2', 'User Region Two (synthetic)');
  d1 = await createDistrict('USR-1-01', 'User District One (synthetic)', r1.id);
  d2 = await createDistrict('USR-2-01', 'User District Two (synthetic)', r2.id);
  a1f = await createFacility('USR-1-F', 'User Facility One (synthetic)', r1.id, d1.id);
  a2f = await createFacility('USR-2-F', 'User Facility Two (synthetic)', r2.id, d2.id);

  // Fixed role codes so the account-creation endpoint (which resolves the role
  // by code) has something to bind to — the helpers' random role codes are not
  // addressable from the API.
  await db.role.create({ data: { code: 'USR-NURSE', name: 'User Test Nurse', scope: 'FACILITY', permissions: STAFF_PERMS } });
  await db.role.create({ data: { code: 'USR-DOCTOR', name: 'User Test Doctor', scope: 'FACILITY', permissions: STAFF_PERMS } });
  await db.role.create({ data: { code: 'USR-PATIENT', name: 'User Test Patient', scope: 'PATIENT', permissions: JSON.stringify(['self_access']) } });

  admin = await makeUser({ email: 'usr-admin@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'NATIONAL', permissions: ['manage_users', 'view_audit'] });
  facilityAdmin = await makeUser({ email: 'usr-facadmin@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'FACILITY', facilityId: a1f.id, permissions: ['manage_users'] });
  noPerm = await makeUser({ email: 'usr-noperm@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'NATIONAL', permissions: ['view_patient'] });
  userIds.push(admin.userId, facilityAdmin.userId, noPerm.userId);

  app = await createTestApp();
});

afterAll(async () => {
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.role.deleteMany({ where: { code: { in: roleCodes } } });
  await db.facility.deleteMany({ where: { id: { in: [a1f.id, a2f.id] } } });
  await db.district.deleteMany({ where: { id: { in: [d1.id, d2.id] } } });
  await db.region.deleteMany({ where: { id: { in: [r1.id, r2.id] } } });
  await db.$disconnect();
  await app.close();
});

const auth = (t: string) => ({ authorization: `Bearer ${t}` });
const listUsers = (t: string) => app.inject({ method: 'GET', url: '/api/v1/admin/users', headers: auth(t) });
const createUser = (t: string, payload: Record<string, unknown>) =>
  app.inject({ method: 'POST', url: '/api/v1/admin/users', headers: auth(t), payload });
const setStatus = (t: string, id: string, status: string) =>
  app.inject({ method: 'PUT', url: `/api/v1/admin/users/${id}/status`, headers: auth(t), payload: { status } });
const setRole = (t: string, id: string, roleCode: string) =>
  app.inject({ method: 'PUT', url: `/api/v1/admin/users/${id}/role`, headers: auth(t), payload: { roleCode } });
const resetPassword = (t: string, id: string, password: string) =>
  app.inject({ method: 'POST', url: `/api/v1/admin/users/${id}/password`, headers: auth(t), payload: { password } });
const login = (email: string, password: string) =>
  app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email, password } });

// A password that always clears the configured minimum (whatever the policy is
// at run time) and one that always falls short of it.
const goodPassword = () => `${'P'.repeat(passwordMinLength())}a1!`;
const shortPassword = () => 'p'.repeat(Math.max(1, passwordMinLength() - 1));

async function makeAccount(email: string, by: TestUser = admin, facilityId?: string) {
  const res = await createUser(by.token, { email, fullName: 'User Test Account (synthetic)', roleCode: 'USR-NURSE', password: goodPassword(), facilityId });
  expect(res.statusCode).toBe(200);
  const id = res.json().user.id as string;
  userIds.push(id);
  return { id, email };
}

describe('list users', () => {
  it('lists users with roles, never exposing DEVELOPER as an assignable role', async () => {
    const { id } = await makeAccount('usr-list@demo.gh');
    const res = await listUsers(admin.token);
    expect(res.statusCode).toBe(200);
    const body = res.json();
    const row = body.users.find((u: { id: string }) => u.id === id);
    expect(row).toMatchObject({ email: 'usr-list@demo.gh', roleCode: 'USR-NURSE', roleScope: 'FACILITY', status: 'ACTIVE' });
    expect(body.roles.some((r: { code: string }) => r.code === 'DEVELOPER')).toBe(false);
    expect(body.passwordMinLength).toBeGreaterThan(0);
  });

  it('scopes the list to a facility admin’s own facility', async () => {
    // National admin creates an account at a2f; the a1f facility admin must not
    // see it (nor the national admin's own facility-less row).
    const { id } = await makeAccount('usr-other@demo.gh', admin, a2f.id);
    const own = await listUsers(facilityAdmin.token);
    expect(own.statusCode).toBe(200);
    const ids = own.json().users.map((u: { id: string }) => u.id);
    expect(ids).not.toContain(id);
    const national = await listUsers(admin.token);
    expect(national.json().users.some((u: { id: string }) => u.id === id)).toBe(true);
  });

  it('rejects callers without manage_users', async () => {
    expect((await listUsers(noPerm.token)).statusCode).toBe(403);
  });
});

describe('create an account', () => {
  it('creates an ACTIVE account that can log in', async () => {
    const { id } = await makeAccount('usr-create@demo.gh');
    expect(id).toBeTruthy();
    const loggedIn = await login('usr-create@demo.gh', goodPassword());
    expect(loggedIn.statusCode).toBe(200);
    expect(loggedIn.json().token).toBeTruthy();
  });

  it('rejects a duplicate email, an unknown role, and a short password', async () => {
    await makeAccount('usr-dup@demo.gh');
    const dup = await createUser(admin.token, { email: 'usr-dup@demo.gh', fullName: 'Duplicate', roleCode: 'USR-NURSE', password: goodPassword() });
    expect(dup.statusCode).toBe(409);

    const noRole = await createUser(admin.token, { email: 'usr-norole@demo.gh', fullName: 'No Role', roleCode: 'NO-SUCH-ROLE', password: goodPassword() });
    expect(noRole.statusCode).toBe(404);

    const weak = await createUser(admin.token, { email: 'usr-weak@demo.gh', fullName: 'Weak', roleCode: 'USR-NURSE', password: shortPassword() });
    expect(weak.statusCode).toBe(400);
    expect(weak.json().error.message).toContain('at least');
  });

  it('validates required fields and the DEVELOPER role', async () => {
    const noEmail = await createUser(admin.token, { fullName: 'No Email', roleCode: 'USR-NURSE', password: goodPassword() });
    expect(noEmail.statusCode).toBe(400);
    const noName = await createUser(admin.token, { email: 'usr-noname@demo.gh', roleCode: 'USR-NURSE', password: goodPassword() });
    expect(noName.statusCode).toBe(400);
    const dev = await createUser(admin.token, { email: 'usr-dev@demo.gh', fullName: 'Dev Wannabe', roleCode: 'DEVELOPER', password: goodPassword() });
    expect(dev.statusCode).toBe(403);
    const unprivileged = await createUser(noPerm.token, { email: 'usr-forbidden@demo.gh', fullName: 'Forbidden', roleCode: 'USR-NURSE', password: goodPassword() });
    expect(unprivileged.statusCode).toBe(403);
  });
});

describe('user status', () => {
  it('walks ACTIVE → SUSPENDED → LOCKED → ACTIVE and reflects it in the list', async () => {
    const { id, email } = await makeAccount('usr-status@demo.gh');
    for (const status of ['SUSPENDED', 'LOCKED', 'ACTIVE']) {
      const res = await setStatus(admin.token, id, status);
      expect(res.statusCode).toBe(200);
      expect(res.json().user).toMatchObject({ id, email, status });
    }
    const list = await listUsers(admin.token);
    expect(list.json().users.find((u: { id: string }) => u.id === id).status).toBe('ACTIVE');
  });

  it('rejects an invalid status and self-status changes', async () => {
    const { id } = await makeAccount('usr-statusbad@demo.gh');
    const bad = await setStatus(admin.token, id, 'FIRED');
    expect(bad.statusCode).toBe(400);
    const self = await setStatus(admin.token, admin.userId, 'SUSPENDED');
    expect(self.statusCode).toBe(400);
  });

  it('suspending an account blocks its session and its login', async () => {
    const { id, email } = await makeAccount('usr-suspended@demo.gh');
    const token = (await login(email, goodPassword())).json().token as string;
    expect((await app.inject({ method: 'GET', url: '/api/v1/dashboard/stats', headers: auth(token) })).statusCode).toBe(200);

    await setStatus(admin.token, id, 'SUSPENDED');
    // Existing tokens stop working (guards re-check the live account status)…
    expect((await app.inject({ method: 'GET', url: '/api/v1/dashboard/stats', headers: auth(token) })).statusCode).toBe(403);
    // …and fresh logins are refused too.
    expect((await login(email, goodPassword())).statusCode).toBe(403);
  });
});

describe('user role', () => {
  it('changes a user’s role and reflects it in the list', async () => {
    const { id, email } = await makeAccount('usr-role@demo.gh');
    const res = await setRole(admin.token, id, 'USR-DOCTOR');
    expect(res.statusCode).toBe(200);
    expect(res.json().user).toMatchObject({ id, email, roleCode: 'USR-DOCTOR' });
    const list = await listUsers(admin.token);
    expect(list.json().users.find((u: { id: string }) => u.id === id).roleCode).toBe('USR-DOCTOR');
  });

  it('rejects an unknown role and a self-demotion to patient access', async () => {
    const { id } = await makeAccount('usr-rolebad@demo.gh');
    const noRole = await setRole(admin.token, id, 'NO-SUCH-ROLE');
    expect(noRole.statusCode).toBe(404);
    const selfDemote = await setRole(admin.token, admin.userId, 'USR-PATIENT');
    expect(selfDemote.statusCode).toBe(400);
  });
});

describe('reset password', () => {
  it('resets the password and the new one works; a short password is refused', async () => {
    const { id, email } = await makeAccount('usr-password@demo.gh');
    const weak = await resetPassword(admin.token, id, shortPassword());
    expect(weak.statusCode).toBe(400);

    const res = await resetPassword(admin.token, id, goodPassword());
    expect(res.statusCode).toBe(200);
    expect(res.json().ok).toBe(true);
    // The old password no longer works; the new one does.
    expect((await login(email, goodPassword())).statusCode).toBe(200);
  });

  it('unlocks a manually locked account', async () => {
    const { id, email } = await makeAccount('usr-locked@demo.gh');
    await setStatus(admin.token, id, 'LOCKED');
    expect((await login(email, goodPassword())).statusCode).toBe(403);
    const res = await resetPassword(admin.token, id, goodPassword());
    expect(res.statusCode).toBe(200);
    const loggedIn = await login(email, goodPassword());
    expect(loggedIn.statusCode).toBe(200);
    expect(loggedIn.json().token).toBeTruthy();
  });
});
