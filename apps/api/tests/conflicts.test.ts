import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser, makeFacility } from './helpers.js';
import type { FastifyInstance } from 'fastify';

// Sync conflict detection + resolution (docs/15 §4, spec §101–103, §166): a
// targeted offline update (lab result) that arrives with a stale baseVersion
// is recorded as CONFLICT with BOTH versions preserved — nothing is silently
// discarded — and an administrator resolves it (keep server / apply client /
// mark reviewed).
let app: FastifyInstance;
let admin: { token: string; userId: string };
let worker: { token: string };
let facilityId: string;

const ADMIN_PERMS = ['sync_data', 'manage_sync_conflicts', 'view_patient', 'create_patient', 'view_audit'];

beforeAll(async () => {
  app = await createTestApp();
  const facility = await makeFacility('Conflicts Test Facility (synthetic)');
  facilityId = facility.id;
  admin = await makeUser({ email: 'conflicts-admin@demo.gh', roleCode: 'HOSPITAL_ADMIN', facilityId: facility.id, permissions: ADMIN_PERMS });
  worker = await makeUser({ email: 'conflicts-worker@demo.gh', roleCode: 'COMMUNITY_HEALTH_WORKER', facilityId: facility.id });
  // The device gate (docs/21): pre-approve this file's device so the sync tests
  // exercise conflict detection, not the enrollment queue (see devices.test.ts).
  await db.device.upsert({
    where: { deviceId: 'conflicts-test-device' },
    create: { deviceId: 'conflicts-test-device', name: 'Conflicts test device (synthetic)', platform: 'PWA', facilityId: facility.id, status: 'ACTIVE', enrolledAt: new Date() },
    update: { status: 'ACTIVE' },
  });
});
afterAll(async () => {
  await db.$disconnect();
  await app.close();
});

const auth = (t: string) => ({ authorization: `Bearer ${t}` });

async function makeLabOrder() {
  const patient = await db.patient.create({
    data: {
      mrn: `CONF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      fullName: `Conflict Patient (synthetic) ${Math.random().toString(36).slice(2)}`,
      facilityId,
      isSynthetic: true,
    },
  });
  const enc = await db.encounter.create({ data: { patientId: patient.id, facilityId, type: 'OPD', status: 'OPEN' } });
  return db.labOrder.create({
    data: { encounterId: enc.id, patientId: patient.id, facilityId, test: 'Malaria RDT', discipline: 'MICROBIOLOGY', status: 'ORDERED' },
  });
}

function resultMutation(orderId: string, result: string, opts: { baseVersion?: string; txn?: string } = {}) {
  return {
    transactionId: opts.txn ?? `txn-conf-${Math.random().toString(36).slice(2)}`,
    entityType: 'labOrder',
    operation: 'RESULT',
    ...(opts.baseVersion ? { baseVersion: opts.baseVersion } : {}),
    clientTimestamp: new Date().toISOString(),
    payload: { orderId, result, critical: false },
  };
}

async function syncResults(mutations: unknown[]) {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/sync/mutations',
    headers: auth(admin.token),
    payload: { deviceId: 'conflicts-test-device', mutations },
  });
  return res;
}

describe('conflict detection (docs/15 §4)', () => {
  it('applies a result built on the current version (no conflict)', async () => {
    const order = await makeLabOrder();
    const res = await syncResults([resultMutation(order.id, 'NEGATIVE', { baseVersion: order.updatedAt.toISOString() })]);
    expect(res.statusCode).toBe(200);
    expect(res.json().results[0].status).toBe('PROCESSED');
    const updated = await db.labOrder.findUnique({ where: { id: order.id } });
    expect(updated?.result).toBe('NEGATIVE');
    expect(updated?.status).toBe('VERIFIED');
  });

  it('flags a stale result as CONFLICT — both versions preserved, nothing applied', async () => {
    const order = await makeLabOrder();
    const baseVersion = order.updatedAt.toISOString();
    // First (valid) result moves the server version forward.
    await syncResults([resultMutation(order.id, 'NEGATIVE', { baseVersion, txn: 'txn-conf-first' })]);
    // A second device edited from the ORIGINAL base — stale by now.
    const res = await syncResults([resultMutation(order.id, 'POSITIVE', { baseVersion, txn: 'txn-conf-stale' })]);
    expect(res.statusCode).toBe(200);
    const result = res.json().results[0];
    expect(result.status).toBe('CONFLICT');
    expect(result.conflictId).toBeTruthy();
    // The entity kept the FIRST result — the stale update was not applied.
    const updated = await db.labOrder.findUnique({ where: { id: order.id } });
    expect(updated?.result).toBe('NEGATIVE');
    // Both versions are preserved for review.
    const conflict = await db.syncConflict.findUnique({ where: { transactionId: 'txn-conf-stale' } });
    expect(conflict).not.toBeNull();
    expect(JSON.parse(conflict!.serverVersion).result).toBe('NEGATIVE');
    expect(JSON.parse(conflict!.clientVersion).result).toBe('POSITIVE');
    // The mutation log records CONFLICT — not FAILED, not PROCESSED.
    const log = await db.mutationLog.findUnique({ where: { transactionId: 'txn-conf-stale' } });
    expect(log?.status).toBe('CONFLICT');
  });

  it('re-syncing a conflicted transaction returns the same CONFLICT without a duplicate row', async () => {
    const order = await makeLabOrder();
    const baseVersion = order.updatedAt.toISOString();
    await syncResults([resultMutation(order.id, 'NEGATIVE', { baseVersion, txn: 'txn-conf-retry-1' })]);
    const staleTxn = 'txn-conf-retry-2';
    const first = await syncResults([resultMutation(order.id, 'POSITIVE', { baseVersion, txn: staleTxn })]);
    const before = await db.syncConflict.count({ where: { transactionId: staleTxn } });
    const retry = await syncResults([resultMutation(order.id, 'POSITIVE', { baseVersion, txn: staleTxn })]);
    const after = await db.syncConflict.count({ where: { transactionId: staleTxn } });
    expect(first.json().results[0].status).toBe('CONFLICT');
    expect(retry.json().results[0].status).toBe('CONFLICT');
    expect(retry.json().results[0].duplicated).toBe(true);
    expect(retry.json().results[0].conflictId).toBeTruthy();
    expect(after).toBe(before);
    expect(after).toBe(1);
  });

  it('applies results without a baseVersion (legacy clients unchanged)', async () => {
    const order = await makeLabOrder();
    const res = await syncResults([resultMutation(order.id, 'TRACE', { txn: 'txn-conf-legacy' })]);
    expect(res.json().results[0].status).toBe('PROCESSED');
    expect((await db.labOrder.findUnique({ where: { id: order.id } }))?.result).toBe('TRACE');
  });

  it('a retry with a fresh transactionId but the same idempotencyKey stays CONFLICT (spec §166)', async () => {
    const order = await makeLabOrder();
    const baseVersion = order.updatedAt.toISOString();
    const key = `key-conf-${Math.random().toString(36).slice(2)}`;
    await syncResults([resultMutation(order.id, 'NEGATIVE', { baseVersion, txn: 'txn-conf-key-1' })]);
    // First attempt of the stale edit — carries the logical action key.
    await syncResults([
      {
        transactionId: 'txn-conf-key-2',
        entityType: 'labOrder',
        operation: 'RESULT',
        idempotencyKey: key,
        baseVersion,
        clientTimestamp: new Date().toISOString(),
        payload: { orderId: order.id, result: 'POSITIVE', critical: false },
      },
    ]);
    // Retry with a NEW transactionId but the SAME idempotency key — the
    // conflict must be reported again, never a false PROCESSED.
    const retry = await syncResults([
      {
        transactionId: 'txn-conf-key-3',
        entityType: 'labOrder',
        operation: 'RESULT',
        idempotencyKey: key,
        baseVersion,
        clientTimestamp: new Date().toISOString(),
        payload: { orderId: order.id, result: 'POSITIVE', critical: false },
      },
    ]);
    expect(retry.json().results[0].status).toBe('CONFLICT');
    expect(retry.json().results[0].conflictId).toBeTruthy();
    expect(retry.json().results[0].duplicated).toBe(true);
    // The preserved client change is still there — nothing was dropped.
    const conflict = await db.syncConflict.findUnique({ where: { transactionId: 'txn-conf-key-2' } });
    expect(JSON.parse(conflict!.clientVersion).result).toBe('POSITIVE');
  });
});

describe('conflict review & resolution (spec §166)', () => {
  it('lists open conflicts and resolves keep_client by applying the client version', async () => {
    const order = await makeLabOrder();
    const baseVersion = order.updatedAt.toISOString();
    const txn = 'txn-conf-keep-client';
    await syncResults([resultMutation(order.id, 'NEGATIVE', { baseVersion, txn: 'txn-conf-kc-first' })]);
    const res = await syncResults([resultMutation(order.id, 'POSITIVE', { baseVersion, txn })]);
    const conflictId = res.json().results[0].conflictId as string;

    const list = await app.inject({ method: 'GET', url: '/api/v1/admin/sync/conflicts', headers: auth(admin.token) });
    expect(list.statusCode).toBe(200);
    expect(list.json().open).toBeGreaterThanOrEqual(1);
    expect(list.json().conflicts.map((c: { id: string }) => c.id)).toContain(conflictId);

    const resolve = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/sync/conflicts/${conflictId}/resolve`,
      headers: auth(admin.token),
      payload: { action: 'keep_client' },
    });
    expect(resolve.statusCode).toBe(200);
    expect(resolve.json().status).toBe('RESOLVED_KEEP_CLIENT');
    // The preserved client version is now applied to the entity.
    const updated = await db.labOrder.findUnique({ where: { id: order.id } });
    expect(updated?.result).toBe('POSITIVE');
    expect(updated?.status).toBe('VERIFIED');
    const conflict = await db.syncConflict.findUnique({ where: { id: conflictId } });
    expect(conflict?.status).toBe('RESOLVED_KEEP_CLIENT');
    expect(conflict?.resolvedAt).toBeTruthy();
  });

  it('resolving keep_server keeps the server version', async () => {
    const order = await makeLabOrder();
    const baseVersion = order.updatedAt.toISOString();
    const txn = 'txn-conf-keep-server';
    await syncResults([resultMutation(order.id, 'NEGATIVE', { baseVersion, txn: 'txn-conf-ks-first' })]);
    const res = await syncResults([resultMutation(order.id, 'POSITIVE', { baseVersion, txn })]);
    const conflictId = res.json().results[0].conflictId as string;

    await app.inject({
      method: 'POST',
      url: `/api/v1/admin/sync/conflicts/${conflictId}/resolve`,
      headers: auth(admin.token),
      payload: { action: 'keep_server', note: 'First result was correct' },
    });
    expect((await db.labOrder.findUnique({ where: { id: order.id } }))?.result).toBe('NEGATIVE');
    const conflict = await db.syncConflict.findUnique({ where: { id: conflictId } });
    expect(conflict?.status).toBe('RESOLVED_KEEP_SERVER');
    expect(conflict?.resolutionNote).toBe('First result was correct');
  });

  it('rejects resolution of an already-resolved conflict', async () => {
    const order = await makeLabOrder();
    const baseVersion = order.updatedAt.toISOString();
    const txn = 'txn-conf-twice';
    await syncResults([resultMutation(order.id, 'NEGATIVE', { baseVersion, txn: 'txn-conf-twice-first' })]);
    const res = await syncResults([resultMutation(order.id, 'POSITIVE', { baseVersion, txn })]);
    const conflictId = res.json().results[0].conflictId as string;
    await app.inject({
      method: 'POST',
      url: `/api/v1/admin/sync/conflicts/${conflictId}/resolve`,
      headers: auth(admin.token),
      payload: { action: 'keep_server' },
    });
    const again = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/sync/conflicts/${conflictId}/resolve`,
      headers: auth(admin.token),
      payload: { action: 'keep_client' },
    });
    expect(again.statusCode).toBe(409);
  });

  it('rejects keep_client for entity types it cannot re-apply', async () => {
    const conflict = await db.syncConflict.create({
      data: {
        transactionId: 'txn-conf-unsupported',
        entityType: 'patient',
        entityId: 'pat-1',
        operation: 'UPDATE',
        facilityId,
        serverVersion: JSON.stringify({ id: 'pat-1', fullName: 'A' }),
        clientVersion: JSON.stringify({ id: 'pat-1', fullName: 'B' }),
      },
    });
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/sync/conflicts/${conflict.id}/resolve`,
      headers: auth(admin.token),
      payload: { action: 'keep_client' },
    });
    expect(res.statusCode).toBe(400);
    // The conflict is untouched — manual review is still available.
    expect((await db.syncConflict.findUnique({ where: { id: conflict.id } }))?.status).toBe('OPEN');
  });

  it('requires a note for manual resolution', async () => {
    const conflict = await db.syncConflict.create({
      data: {
        transactionId: 'txn-conf-nonote',
        entityType: 'labOrder',
        entityId: 'ord-x',
        operation: 'RESULT',
        facilityId,
        serverVersion: JSON.stringify({ id: 'ord-x' }),
        clientVersion: JSON.stringify({ orderId: 'ord-x' }),
      },
    });
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/sync/conflicts/${conflict.id}/resolve`,
      headers: auth(admin.token),
      payload: { action: 'manual' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('requires manage_sync_conflicts to list or resolve', async () => {
    const denied = await app.inject({ method: 'GET', url: '/api/v1/admin/sync/conflicts', headers: auth(worker.token) });
    expect(denied.statusCode).toBe(403);
    const deniedResolve = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/sync/conflicts/some-id/resolve',
      headers: auth(worker.token),
      payload: { action: 'keep_server' },
    });
    expect(deniedResolve.statusCode).toBe(403);
  });
});
