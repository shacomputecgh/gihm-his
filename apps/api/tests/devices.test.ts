import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser, makeFacility } from './helpers.js';
import type { FastifyInstance } from 'fastify';

// Device lifecycle (docs/21, spec §109): new devices self-register as PENDING
// and cannot sync until an administrator approves them; suspending/blocking a
// device revokes its session; remote logout voids the session without
// de-enrolling the device.
let app: FastifyInstance;
let admin: { token: string };
let facilityId: string;

const PERMS = ['sync_data', 'manage_devices', 'view_patient', 'create_patient', 'view_dashboard'];

beforeAll(async () => {
  app = await createTestApp();
  const facility = await makeFacility('Devices Test Facility (synthetic)');
  facilityId = facility.id;
  admin = await makeUser({ email: 'devices-admin@demo.gh', roleCode: 'HOSPITAL_ADMIN', facilityId: facility.id, permissions: PERMS });
});
afterAll(async () => {
  await db.$disconnect();
  await app.close();
});

const auth = (t: string) => ({ authorization: `Bearer ${t}` });

function patientMutation() {
  return {
    transactionId: `txn-dev-${Math.random().toString(36).slice(2)}`,
    entityType: 'patient',
    operation: 'CREATE',
    clientTimestamp: new Date().toISOString(),
    payload: { fullName: `Gate Patient (synthetic) ${Math.random().toString(36).slice(2)}`, dateOfBirth: '1990-05-05', phone: '0555002222' },
  };
}

describe('device enrollment gate (docs/21 §1)', () => {
  it('registers a new device as PENDING awaiting approval', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/devices/register',
      headers: auth(admin.token),
      payload: { deviceId: 'devices-test-reg-01', name: 'Registration Test Device', platform: 'PWA' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.registered).toBe(true);
    expect(body.pendingApproval).toBe(true);
    expect(body.device.status).toBe('PENDING');
    expect(body.device.enrolledAt).toBeNull();
  });

  it('refuses sync from an unregistered device — creates it as PENDING and applies nothing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sync/mutations',
      headers: auth(admin.token),
      payload: { deviceId: 'devices-test-new-02', mutations: [patientMutation()] },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe('DEVICE_PENDING_APPROVAL');
    const d = await db.device.findUnique({ where: { deviceId: 'devices-test-new-02' } });
    expect(d?.status).toBe('PENDING');
    // No mutation was applied — the gate refuses before anything is processed.
    const patient = await db.patient.findFirst({ where: { fullName: { contains: 'Gate Patient' } } });
    expect(patient).toBeNull();
  });

  it('keeps refusing sync from a PENDING device until approved', async () => {
    await db.device.upsert({
      where: { deviceId: 'devices-test-pending-03' },
      create: { deviceId: 'devices-test-pending-03', name: 'Pending Device (synthetic)', platform: 'PWA', facilityId, status: 'PENDING' },
      update: {},
    });
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sync/mutations',
      headers: auth(admin.token),
      payload: { deviceId: 'devices-test-pending-03', mutations: [patientMutation()] },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe('DEVICE_PENDING_APPROVAL');
  });

  it('approving a device stamps the enrollment and unlocks sync', async () => {
    const approve = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/devices/devices-test-reg-01/status',
      headers: auth(admin.token),
      payload: { status: 'ACTIVE' },
    });
    expect(approve.statusCode).toBe(200);
    const approved = approve.json().device;
    expect(approved.status).toBe('ACTIVE');
    expect(approved.enrolledAt).toBeTruthy();
    expect(approved.enrolledById).toBeTruthy();

    const sync = await app.inject({
      method: 'POST',
      url: '/api/v1/sync/mutations',
      headers: auth(admin.token),
      payload: { deviceId: 'devices-test-reg-01', mutations: [patientMutation()] },
    });
    expect(sync.statusCode).toBe(200);
    expect(sync.json().processed).toBe(1);
    expect(sync.json().failed).toBe(0);
  });

  it('rejects with a recorded reason (BLOCKED)', async () => {
    const reject = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/devices/devices-test-reg-01/status',
      headers: auth(admin.token),
      payload: { status: 'BLOCKED', reason: 'Unknown device on ward network' },
    });
    expect(reject.statusCode).toBe(200);
    expect(reject.json().revoked).toBe(true);
    const d = await db.device.findUnique({ where: { deviceId: 'devices-test-reg-01' } });
    expect(d?.blockReason).toBe('Unknown device on ward network');
  });
});

describe('device status enforcement (docs/21 §1)', () => {
  it('refuses sync from a SUSPENDED device with DEVICE_SUSPENDED and stores the reason', async () => {
    const suspend = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/devices/devices-test-pending-03/status',
      headers: auth(admin.token),
      payload: { status: 'SUSPENDED', reason: 'Stolen while in transit' },
    });
    expect(suspend.statusCode).toBe(200);
    const d = await db.device.findUnique({ where: { deviceId: 'devices-test-pending-03' } });
    expect(d?.blockReason).toBe('Stolen while in transit');

    const sync = await app.inject({
      method: 'POST',
      url: '/api/v1/sync/mutations',
      headers: auth(admin.token),
      payload: { deviceId: 'devices-test-pending-03', mutations: [patientMutation()] },
    });
    expect(sync.statusCode).toBe(403);
    expect(sync.json().error.code).toBe('DEVICE_SUSPENDED');
  });

  it('reactivating clears the block reason and re-enables sync', async () => {
    const reactivate = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/devices/devices-test-pending-03/status',
      headers: auth(admin.token),
      payload: { status: 'ACTIVE' },
    });
    expect(reactivate.statusCode).toBe(200);
    expect(reactivate.json().device.blockReason).toBeNull();
    const sync = await app.inject({
      method: 'POST',
      url: '/api/v1/sync/mutations',
      headers: auth(admin.token),
      payload: { deviceId: 'devices-test-pending-03', mutations: [patientMutation()] },
    });
    expect(sync.statusCode).toBe(200);
  });

  it('stolen-phone drill: a revoked device refuses its next batch (DEVICE_REVOKED) and pushed data stays intact (docs/19 Test I)', async () => {
    // The phone pushed a batch while ACTIVE — applied normally.
    const deviceId = 'devices-test-stolen-01';
    await db.device.upsert({
      where: { deviceId },
      create: { deviceId, name: 'Stolen phone (synthetic)', platform: 'ANDROID', facilityId, status: 'ACTIVE', enrolledAt: new Date() },
      update: { status: 'ACTIVE', platform: 'ANDROID' },
    });
    try {
      const first = await app.inject({
        method: 'POST',
        url: '/api/v1/sync/mutations',
        headers: auth(admin.token),
        payload: {
          deviceId,
          mutations: [{
            transactionId: 'txn-stolen-1', entityType: 'patient', operation: 'CREATE', clientTimestamp: new Date().toISOString(),
            payload: { fullName: 'Stolen Phone Patient (synthetic)', dateOfBirth: '1988-04-04', phone: '0555004444' },
          }],
        },
      });
      expect(first.statusCode).toBe(200);
      expect(first.json().processed).toBe(1);

      // Reported stolen → the admin revokes the device (reason recorded).
      const block = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/devices/${deviceId}/status`,
        headers: auth(admin.token),
        payload: { status: 'STOLEN', reason: 'Reported stolen by CHPS worker' },
      });
      expect(block.statusCode).toBe(200);
      expect(block.json().revoked).toBe(true);

      // Even with a still-valid session token the device is refused BEFORE
      // anything is applied — the gate is per-device, not per-session.
      const second = await app.inject({
        method: 'POST',
        url: '/api/v1/sync/mutations',
        headers: auth(admin.token),
        payload: {
          deviceId,
          mutations: [{
            transactionId: 'txn-stolen-2', entityType: 'patient', operation: 'CREATE', clientTimestamp: new Date().toISOString(),
            payload: { fullName: 'Stolen Phone Second Batch (synthetic)', phone: '0555005555' },
          }],
        },
      });
      expect(second.statusCode).toBe(403);
      expect(second.json().error.code).toBe('DEVICE_REVOKED');

      // The refused batch was never applied; the already-pushed data survives.
      expect(await db.patient.count({ where: { fullName: 'Stolen Phone Patient (synthetic)' } })).toBe(1);
      expect(await db.patient.count({ where: { fullName: 'Stolen Phone Second Batch (synthetic)' } })).toBe(0);
      expect(await db.mutationLog.findUnique({ where: { transactionId: 'txn-stolen-2' } })).toBeNull();
    } finally {
      await db.patient.deleteMany({ where: { fullName: { in: ['Stolen Phone Patient (synthetic)', 'Stolen Phone Second Batch (synthetic)'] } } });
      await db.device.deleteMany({ where: { deviceId } });
    }
  });
});

describe('remote logout (docs/21 §3, spec §97)', () => {
  it('voids the session without de-enrolling the device', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/devices/devices-test-pending-03/remote-logout',
      headers: auth(admin.token),
      payload: {},
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.remoteLogoutAt).toBeTruthy();
    expect(body.device.status).toBe('ACTIVE'); // stays enrolled

    // The sync response carries the flag so the client can compare it against
    // its cached session and force-log out (client behaviour, not enforced here).
    const sync = await app.inject({
      method: 'POST',
      url: '/api/v1/sync/mutations',
      headers: auth(admin.token),
      payload: { deviceId: 'devices-test-pending-03', mutations: [patientMutation()] },
    });
    expect(sync.statusCode).toBe(200);
    expect(sync.json().device.remoteLogoutAt).toBe(body.remoteLogoutAt);
  });

  it('rejects status changes from callers without manage_devices', async () => {
    const nurse = await makeUser({ email: 'devices-nurse@demo.gh', roleCode: 'NURSE', facilityId, permissions: ['sync_data', 'view_patient'] });
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/devices/devices-test-pending-03/status',
      headers: auth(nurse.token),
      payload: { status: 'BLOCKED' },
    });
    expect(res.statusCode).toBe(403);
  });
});
