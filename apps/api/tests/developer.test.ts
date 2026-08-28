import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser } from './helpers.js';
import type { FastifyInstance } from 'fastify';
import { clearSetting, setSetting, getSetting } from '../src/lib/settings.js';
import { passwordMinLength } from '../src/modules/admin/users.js';
import { assertFacilityCapacity } from '../src/lib/license.js';

const LICENSE_KEYS = ['license.key', 'license.edition', 'license.expiresAt', 'license.maxFacilities', 'license.maxUsers', 'license.activatedAt'];
const SECURITY_KEYS = ['security.passwordMinLength', 'security.lockoutThreshold', 'security.sessionTtlHours'];

let app: FastifyInstance;
let developer: { token: string; userId: string };
let admin: { token: string; userId: string };
let limited: { token: string };
let createdUserIds: string[] = [];

beforeAll(async () => {
  // Hermetic settings: wipe only the keys this file touches (never the whole
  // table — other files may be running concurrently).
  for (const k of [...LICENSE_KEYS, ...SECURITY_KEYS]) await clearSetting(db, k);
  // The test DB is not seeded, so the endpoints that look roles up by exact
  // code (DEVELOPER / NURSE) need the rows to exist.
  await db.role.upsert({ where: { code: 'DEVELOPER' }, create: { code: 'DEVELOPER', name: 'Developer', scope: 'DEVELOPER', permissions: JSON.stringify(['developer_mode']) }, update: {} });
  await db.role.upsert({ where: { code: 'NURSE' }, create: { code: 'NURSE', name: 'Nurse', scope: 'FACILITY', permissions: JSON.stringify(['view_patient']) }, update: {} });
  app = await createTestApp();
  developer = await makeUser({ email: 'dev-master@demo.gh', roleCode: 'DEVELOPER', scope: 'DEVELOPER', permissions: [] });
  admin = await makeUser({ email: 'dev-admin@demo.gh', roleCode: 'NATIONAL_ADMIN', scope: 'NATIONAL', permissions: ['manage_users', 'manage_roles_permissions', 'view_audit', 'manage_system_settings'] });
  limited = await makeUser({ email: 'dev-limited@demo.gh', roleCode: 'HOSPITAL_ADMIN', permissions: ['view_patient'] });
});

afterAll(async () => {
  for (const k of [...LICENSE_KEYS, ...SECURITY_KEYS]) await clearSetting(db, k);
  await db.user.deleteMany({ where: { id: { in: createdUserIds } } });
  await db.auditLog.deleteMany({ where: { action: { startsWith: 'developer.' } } });
  await db.role.deleteMany({ where: { code: { in: ['DEVELOPER', 'NURSE'] } } });
  await db.$disconnect();
  await app.close();
});

const auth = (t: string) => ({ authorization: `Bearer ${t}` });

describe('developer mode — scope bypass', () => {
  it('lets a DEVELOPER-scope account through every guard, even with zero permissions', async () => {
    // No permission list at all — the scope alone bypasses requirePermission.
    const res = await app.inject({ method: 'GET', url: '/api/v1/admin/developer/overview', headers: auth(developer.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.license).toHaveProperty('activated');
    expect(body.counts).toHaveProperty('users');
    expect(body.security).toHaveProperty('passwordMinLength');
    // A masterdata endpoint guarded by a permission the developer lacks.
    const roles = await app.inject({ method: 'GET', url: '/api/v1/admin/masterdata/roles', headers: auth(developer.token) });
    expect(roles.statusCode).toBe(200);
  });

  it('denies developer endpoints to everyone else, including national admins', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/admin/developer/overview', headers: auth(admin.token) });
    expect(res.statusCode).toBe(403);
    const users = await app.inject({ method: 'GET', url: '/api/v1/admin/developer/users', headers: auth(limited.token) });
    expect(users.statusCode).toBe(403);
  });
});

describe('developer mode — account control', () => {
  it('lists every account with raw role data', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/admin/developer/users', headers: auth(developer.token) });
    expect(res.statusCode).toBe(200);
    const users = res.json().users as Array<{ email: string; roleCode: string; permissions: string[] }>;
    expect(users.some((u) => u.email === 'dev-admin@demo.gh')).toBe(true);
    expect(users.some((u) => u.email === 'dev-master@demo.gh' && u.roleCode.includes('DEVELOPER'))).toBe(true);
    expect(users[0]).toHaveProperty('permissions');
  });

  it('creates a DEVELOPER account and edits it (admin cannot)', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/developer/users',
      headers: auth(developer.token),
      payload: { email: 'dev-created@demo.gh', fullName: 'Created By Developer', roleCode: 'DEVELOPER', password: 'StrongPass123!' },
    });
    expect(create.statusCode).toBe(200);
    const id = create.json().user.id as string;
    createdUserIds.push(id);
    // Admin is refused the same power.
    const adminCreate = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/developer/users',
      headers: auth(admin.token),
      payload: { email: 'dev-sneak@demo.gh', fullName: 'Sneak', roleCode: 'NATIONAL_ADMIN', password: 'StrongPass123!' },
    });
    expect(adminCreate.statusCode).toBe(403);
    // The new developer account can log in.
    const login = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email: 'dev-created@demo.gh', password: 'StrongPass123!' } });
    expect(login.statusCode).toBe(200);

    // Suspend + reactivate via the developer endpoint.
    const suspend = await app.inject({ method: 'PUT', url: `/api/v1/admin/developer/users/${id}`, headers: auth(developer.token), payload: { status: 'SUSPENDED' } });
    expect(suspend.statusCode).toBe(200);
    const lockedLogin = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email: 'dev-created@demo.gh', password: 'StrongPass123!' } });
    expect(lockedLogin.statusCode).toBe(403);

    // Reset the password and reactivate.
    const pw = await app.inject({ method: 'POST', url: `/api/v1/admin/developer/users/${id}/password`, headers: auth(developer.token), payload: { password: 'NewPass456!' } });
    expect(pw.statusCode).toBe(200);
    const login2 = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email: 'dev-created@demo.gh', password: 'NewPass456!' } });
    expect(login2.statusCode).toBe(200);
  });

  it('impersonates any account — the issued token acts as that user and it is audited', async () => {
    const res = await app.inject({ method: 'POST', url: `/api/v1/admin/developer/users/${admin.userId}/impersonate`, headers: auth(developer.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.user.email).toBe('dev-admin@demo.gh');
    const me = await app.inject({ method: 'GET', url: '/api/v1/auth/me', headers: auth(body.token) });
    expect(me.statusCode).toBe(200);
    expect(me.json().user.email).toBe('dev-admin@demo.gh');
    const audit = await db.auditLog.findFirst({ where: { action: 'developer.impersonate', entityId: admin.userId } });
    expect(audit?.after).toContain('dev-admin@demo.gh');
    expect(audit?.after).toContain('dev-master@demo.gh');
  });
});

describe('developer mode — security policy', () => {
  it('updates the global password policy, which enforcement then uses', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/developer/security',
      headers: auth(developer.token),
      payload: { passwordMinLength: 14, lockoutThreshold: 7, sessionTtlHours: 24 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().security.passwordMinLength).toBe(14);
    expect(passwordMinLength()).toBe(14);
    // The admin user-management path now enforces the raised minimum.
    const tooShort = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/users',
      headers: auth(admin.token),
      payload: { email: 'dev-short@demo.gh', fullName: 'Short Password', roleCode: 'NURSE', password: 'Short1!' },
    });
    expect(tooShort.statusCode).toBe(400);
    expect(tooShort.json().error.message).toContain('14');
    // Clamping rejects absurd values.
    const bad = await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/developer/security',
      headers: auth(developer.token),
      payload: { passwordMinLength: 100 },
    });
    expect(bad.statusCode).toBe(400);
    // A national admin cannot change security policy.
    const denied = await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/developer/security',
      headers: auth(admin.token),
      payload: { passwordMinLength: 4 },
    });
    expect(denied.statusCode).toBe(403);
  });
});

describe('developer mode — licensing', () => {
  it('activates a license and enforces the user capacity on account creation', async () => {
    const activate = async (maxUsers: number) =>
      app.inject({
        method: 'POST',
        url: '/api/v1/admin/developer/license/activate',
        headers: auth(developer.token),
        payload: { key: 'GIHM-TEST-0001', edition: 'ENTERPRISE', expiresAt: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().slice(0, 10), maxFacilities: 9999, maxUsers },
      });
    const res = await activate(9999);
    expect(res.statusCode).toBe(200);
    expect(res.json().license.activated).toBe(true);
    expect(res.json().license.edition).toBe('ENTERPRISE');
    expect(res.json().license.keySuffix).toBe('0001');
    expect(res.json().license.compliant).toBe(true);
    // Settings are persisted.
    expect(getSetting('license.key')).toBe('GIHM-TEST-0001');

    // maxUsers=1 with an existing ACTIVE user → creation is blocked.
    await activate(1);
    const blocked = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/users',
      headers: auth(admin.token),
      payload: { email: 'dev-overcap@demo.gh', fullName: 'Over Capacity', roleCode: 'NURSE', password: 'StrongPass123!' },
    });
    expect(blocked.statusCode).toBe(403);
    expect(blocked.json().error.message).toContain('License user limit');
    // The developer user path is blocked too.
    const blockedDev = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/developer/users',
      headers: auth(developer.token),
      payload: { email: 'dev-overcap2@demo.gh', fullName: 'Over Capacity Dev', roleCode: 'DEVELOPER', password: 'StrongPass123!' },
    });
    expect(blockedDev.statusCode).toBe(403);

    // Raise the limit → creation succeeds again.
    await activate(9999);
    const ok = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/users',
      headers: auth(admin.token),
      payload: { email: 'dev-under-cap@demo.gh', fullName: 'Under Capacity', roleCode: 'NURSE', password: 'StrongPass123!' },
    });
    expect(ok.statusCode).toBe(200);
    createdUserIds.push(ok.json().user.id as string);
  });

  it('enforces the facility capacity at the approval boundary', async () => {
    // One facility exists → a limit of 1 blocks the next approval (0 means
    // unlimited, so it cannot be used to force non-compliance).
    const region = await db.region.create({ data: { code: `DEVL-R${Math.random().toString(36).slice(2, 5)}`, name: 'Developer Region (synthetic)', capital: 'Dev City' } });
    const district = await db.district.create({ data: { code: `DEVL-D${Math.random().toString(36).slice(2, 5)}`, name: 'Developer District (synthetic)', type: 'DISTRICT', regionId: region.id } });
    const facility = await db.facility.create({ data: { code: `DEVL-F${Math.random().toString(36).slice(2, 6).toUpperCase()}`, name: 'Developer Facility (synthetic)', type: 'CLINIC', level: 'PRIMARY', ownership: 'PRIVATE', regionId: region.id, districtId: district.id, services: '[]', departmentsJson: '[]', openingHours: '{}', isSynthetic: true, status: 'ACTIVE' } });
    try {
      await setSetting(db, 'license.maxFacilities', '1');
      await expect(assertFacilityCapacity(db)).rejects.toThrow(/License facility limit/);
      await setSetting(db, 'license.maxFacilities', '9999');
      await expect(assertFacilityCapacity(db)).resolves.toBeUndefined();
    } finally {
      await db.facility.delete({ where: { id: facility.id } }).catch(() => undefined);
      await db.district.delete({ where: { id: district.id } }).catch(() => undefined);
      await db.region.delete({ where: { id: region.id } }).catch(() => undefined);
    }
  });

  it('reports non-compliance when limits are exceeded and deactivates cleanly', async () => {
    // maxUsers=1 with an existing ACTIVE user → over limit → non-compliant.
    // (0 means unlimited, so it cannot be used to force non-compliance.)
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/developer/license/activate',
      headers: auth(developer.token),
      payload: { key: 'GIHM-TEST-0002', edition: 'PRO', expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10), maxFacilities: 9999, maxUsers: 1 },
    });
    expect(res.statusCode).toBe(200);
    const l = res.json().license;
    expect(l.compliant).toBe(false);
    expect(l.limitsExceeded.join(',')).toContain('users');

    const deact = await app.inject({ method: 'POST', url: '/api/v1/admin/developer/license/deactivate', headers: auth(developer.token) });
    expect(deact.statusCode).toBe(200);
    expect(deact.json().license.activated).toBe(false);
    expect(getSetting('license.key')).toBeUndefined();
  });
});

describe('admin user management (manage_users)', () => {
  it('lists users with roles (never the DEVELOPER role as an assignable choice)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/admin/users', headers: auth(admin.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.users.some((u: { email: string }) => u.email === 'dev-admin@demo.gh')).toBe(true);
    expect(body.roles.some((r: { code: string }) => r.code === 'DEVELOPER')).toBe(false);
    expect(limited && body.passwordMinLength).toBeGreaterThan(0);
  });

  it('creates accounts but never DEVELOPER ones', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/users',
      headers: auth(admin.token),
      payload: { email: 'dev-staff@demo.gh', fullName: 'Staff Account', roleCode: 'NURSE', password: 'StrongPass123!' },
    });
    expect(res.statusCode).toBe(200);
    const id = res.json().user.id as string;
    createdUserIds.push(id);
    const devRole = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/users',
      headers: auth(admin.token),
      payload: { email: 'dev-wannabe@demo.gh', fullName: 'Wannabe', roleCode: 'DEVELOPER', password: 'StrongPass123!' },
    });
    expect(devRole.statusCode).toBe(403);
    // Changing a role to DEVELOPER is refused too.
    const change = await app.inject({ method: 'PUT', url: `/api/v1/admin/users/${id}/role`, headers: auth(admin.token), payload: { roleCode: 'DEVELOPER' } });
    expect(change.statusCode).toBe(403);
  });

  it('requires manage_users', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/admin/users', headers: auth(limited.token) });
    expect(res.statusCode).toBe(403);
  });
});

describe('developer scope cannot be minted by admins', () => {
  it('rejects the DEVELOPER scope and the DEVELOPER role through the roles editor', async () => {
    // A national admin with manage_roles_permissions cannot set scope DEVELOPER.
    const scope = await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/masterdata/roles/NURSE',
      headers: auth(admin.token),
      payload: { scope: 'DEVELOPER' },
    });
    expect(scope.statusCode).toBe(403);
    expect(scope.json().error.message).toContain('developer');
    // And the DEVELOPER role itself is off-limits entirely.
    const edit = await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/masterdata/roles/DEVELOPER',
      headers: auth(admin.token),
      payload: { name: 'Hijacked' },
    });
    expect(edit.statusCode).toBe(403);
    // The developer can still edit other roles.
    const ok = await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/masterdata/roles/NURSE',
      headers: auth(developer.token),
      payload: { name: 'Nurse (Developer-adjusted)' },
    });
    expect(ok.statusCode).toBe(200);
    await db.role.update({ where: { code: 'NURSE' }, data: { name: 'Nurse' } }).catch(() => undefined);
  });
});

describe('config audit — filters and CSV export', () => {
  it('accepts action POSTs with an empty JSON body (impersonate-style calls)', async () => {
    // Browsers/postman send Content-Type: application/json even without a
    // payload — the API must treat that as {} rather than 400.
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/developer/license/deactivate',
      headers: { ...auth(developer.token), 'content-type': 'application/json' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().ok).toBe(true);
  });

  it('filters the config audit by action prefix and entity', async () => {
    // Seed a settings change so there is something to filter.
    await app.inject({ method: 'PUT', url: '/api/v1/admin/settings', headers: auth(admin.token), payload: { updates: [{ key: 'sms.provider', value: 'hubtel' }] } });
    const res = await app.inject({ method: 'GET', url: '/api/v1/admin/audit/config?action=system.settings', headers: auth(admin.token) });
    expect(res.statusCode).toBe(200);
    const entries = res.json().entries as Array<{ action: string }>;
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every((e) => e.action.startsWith('system.settings.'))).toBe(true);
    // The audit row persists, but the settings row must not: a leaked
    // sms.provider value in the shared test DB overrides every env-based SMS
    // dispatch test in later files (settings cache wins over process.env).
    await clearSetting(db, 'sms.provider');
  });

  it('exports the filtered trail as CSV', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/admin/audit/config?action=system.settings&format=csv', headers: auth(admin.token) });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    const body = res.body;
    expect(body.startsWith('"When","Actor"')).toBe(true); // fully quoted header
    expect(body).toContain('"Settings updated"'); // human label, never the raw action
    expect(body).toContain('sms.provider'); // the changed key in the summary
    expect(body).not.toContain('hubtel'); // values never leak into the export
  });

  it('filters the developer full audit by actor/action', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/admin/developer/audit?action=developer', headers: auth(developer.token) });
    expect(res.statusCode).toBe(200);
    const entries = res.json().entries as Array<{ action: string }>;
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every((e) => e.action.startsWith('developer.'))).toBe(true);
    // Non-developers cannot read the full trail.
    const denied = await app.inject({ method: 'GET', url: '/api/v1/admin/developer/audit', headers: auth(admin.token) });
    expect(denied.statusCode).toBe(403);
  });
});

describe('developer mode — devices and system', () => {
  it('lists every registered device (developer only)', async () => {
    const device = await db.device.create({ data: { deviceId: 'dev-master-device-01', name: 'Master Device', platform: 'WEB', status: 'ACTIVE', lastSeenAt: new Date() } });
    const res = await app.inject({ method: 'GET', url: '/api/v1/admin/developer/devices', headers: auth(developer.token) });
    expect(res.statusCode).toBe(200);
    expect(res.json().devices.some((d: { deviceId: string }) => d.deviceId === 'dev-master-device-01')).toBe(true);
    const denied = await app.inject({ method: 'GET', url: '/api/v1/admin/developer/devices', headers: auth(admin.token) });
    expect(denied.statusCode).toBe(403);
    await db.device.deleteMany({ where: { id: device.id } });
  });

  it('blocks or retires any device from the developer console', async () => {
    const device = await db.device.create({ data: { deviceId: 'dev-master-device-02', name: 'Block Me', platform: 'WEB', status: 'ACTIVE', lastSeenAt: new Date() } });
    const blocked = await app.inject({ method: 'POST', url: '/api/v1/admin/developer/devices/dev-master-device-02/status', headers: auth(developer.token), payload: { status: 'BLOCKED' } });
    expect(blocked.statusCode).toBe(200);
    expect(blocked.json().device.status).toBe('BLOCKED');
    const audit = await db.auditLog.findFirst({ where: { action: 'developer.device.status', entityId: device.id } });
    expect(audit).toBeTruthy();
    // Invalid statuses and non-developers are refused.
    const bad = await app.inject({ method: 'POST', url: '/api/v1/admin/developer/devices/dev-master-device-02/status', headers: auth(developer.token), payload: { status: 'NONSENSE' } });
    expect(bad.statusCode).toBe(400);
    const denied = await app.inject({ method: 'POST', url: '/api/v1/admin/developer/devices/dev-master-device-02/status', headers: auth(admin.token), payload: { status: 'RETIRED' } });
    expect(denied.statusCode).toBe(403);
    await db.device.deleteMany({ where: { id: device.id } });
  });

  it('reports system info — runtime, env definitions and table sizes', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/admin/developer/system', headers: auth(developer.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.runtime).toMatchObject({ node: process.version, nodeEnv: process.env.NODE_ENV });
    expect(body.env.length).toBeGreaterThan(0);
    expect(body.env[0]).toHaveProperty('source');
    for (const key of ['user', 'facility', 'patient', 'auditLog']) expect(typeof body.counts[key]).toBe('number');
    const denied = await app.inject({ method: 'GET', url: '/api/v1/admin/developer/system', headers: auth(admin.token) });
    expect(denied.statusCode).toBe(403);
  });
});
