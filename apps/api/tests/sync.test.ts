import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser, makeFacility } from './helpers.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;
let worker: { token: string };
let facilityId: string;

beforeAll(async () => {
  app = await createTestApp();
  const facility = await makeFacility('Sync Test Facility (synthetic)');
  facilityId = facility.id;
  worker = await makeUser({ email: 'sync-worker@demo.gh', roleCode: 'COMMUNITY_HEALTH_WORKER', facilityId: facility.id });
  // The device gate (docs/21): new devices self-register as PENDING and cannot
  // sync until approved. Pre-approve this file's device so the sync tests below
  // exercise the mutation pipeline, not the enrollment queue (see devices.test.ts).
  await db.device.upsert({
    where: { deviceId: 'sync-test-device-01' },
    create: { deviceId: 'sync-test-device-01', name: 'Sync test device (synthetic)', platform: 'PWA', facilityId: facility.id, status: 'ACTIVE', enrolledAt: new Date() },
    update: { status: 'ACTIVE' },
  });
});
afterAll(async () => {
  // These patients live in the SHARED test DB — the opted-out child with a
  // due PENTA dose must not outlive this file. When sync.test.ts runs before
  // immunization.test.ts, the sweep's whole-DB "optedOut === 0" assertion
  // counts that child (cross-file state leak → order-dependent flake).
  const synth = ['OptOut Sync Child (synthetic)', 'Offline Consent Child (synthetic)'];
  const ids = (await db.patient.findMany({ where: { fullName: { in: synth } }, select: { id: true } })).map((p) => p.id);
  await db.immunization.deleteMany({ where: { patientId: { in: ids } } });
  await db.patient.deleteMany({ where: { id: { in: ids } } });
  await db.$disconnect();
  await app.close();
});

const auth = (t: string) => ({ authorization: `Bearer ${t}` });

describe('offline sync (outbox replay)', () => {
  it('applies a patient.create mutation with a client transaction id', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sync/mutations',
      headers: auth(worker.token),
      payload: {
        deviceId: 'sync-test-device-01',
        mutations: [
          {
            transactionId: 'txn-001',
            entityType: 'patient',
            operation: 'CREATE',
            clientTimestamp: new Date().toISOString(),
            payload: { fullName: 'Offline Patient (synthetic)', dateOfBirth: '1985-01-01', phone: '0555001111' },
          },
        ],
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.processed).toBe(1);
    expect(body.failed).toBe(0);
    expect(body.results[0].status).toBe('PROCESSED');
    expect(body.results[0].entityId).toBeTruthy();
    // The row is stamped with the acting user's facility (docs/16 §1) so a
    // multi-facility district edge can relay per-facility.
    const log = await db.mutationLog.findUnique({ where: { transactionId: 'txn-001' } });
    expect(log?.facilityId).toBe(facilityId);
  });

  it('does NOT re-apply the same transaction on retry (idempotency)', async () => {
    const before = await db.patient.count({ where: { fullName: 'Offline Patient (synthetic)' } });
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sync/mutations',
      headers: auth(worker.token),
      payload: {
        deviceId: 'sync-test-device-01',
        mutations: [
          {
            transactionId: 'txn-001',
            entityType: 'patient',
            operation: 'CREATE',
            clientTimestamp: new Date().toISOString(),
            payload: { fullName: 'Offline Patient (synthetic)', dateOfBirth: '1985-01-01', phone: '0555001111' },
          },
        ],
      },
    });
    const body = res.json();
    expect(body.results[0].duplicated).toBe(true);
    const after = await db.patient.count({ where: { fullName: 'Offline Patient (synthetic)' } });
    expect(after).toBe(before);
  });

  it('records failed mutations instead of silently discarding them', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sync/mutations',
      headers: auth(worker.token),
      payload: {
        mutations: [
          {
            transactionId: 'txn-bad-01',
            entityType: 'unknownThing',
            operation: 'CREATE',
            clientTimestamp: new Date().toISOString(),
            payload: {},
          },
        ],
      },
    });
    const body = res.json();
    expect(body.failed).toBe(1);
    expect(body.results[0].status).toBe('FAILED');
    const log = await db.mutationLog.findUnique({ where: { transactionId: 'txn-bad-01' } });
    expect(log?.status).toBe('FAILED');
  });

  it('registers the syncing device and reports sync status', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/sync/status?deviceId=sync-test-device-01', headers: auth(worker.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.device.deviceId).toBe('sync-test-device-01');
    expect(body.server).toBe('healthy');
  });

  it('deduplicates the same logical action via idempotency key (concurrent edits)', async () => {
    // Seed a patient to attach the encounters to.
    const seedPatient = await app.inject({
      method: 'POST',
      url: '/api/v1/sync/mutations',
      headers: auth(worker.token),
      payload: {
        deviceId: 'sync-test-device-01',
        mutations: [{
          transactionId: 'txn-conc-0',
          entityType: 'patient',
          operation: 'CREATE',
          clientTimestamp: new Date().toISOString(),
          payload: { fullName: 'Concurrent Patient (synthetic)', phone: '0500222333' },
        }],
      },
    });
    const patientId = seedPatient.json().results[0].entityId;
    expect(patientId).toBeTruthy();

    // Two separate transactions carrying the SAME idempotency key must result in
    // exactly one entity — the first wins, the second is reported duplicated.
    const first = await app.inject({
      method: 'POST',
      url: '/api/v1/sync/mutations',
      headers: auth(worker.token),
      payload: {
        deviceId: 'sync-test-device-01',
        mutations: [{
          transactionId: 'txn-conc-1',
          entityType: 'encounter',
          operation: 'CREATE',
          idempotencyKey: 'dup-key-enc-1',
          clientTimestamp: new Date().toISOString(),
          payload: { patientId, presentingComplaint: 'First write' },
        }],
      },
    });
    const firstBody = first.json();
    expect(firstBody.results[0].status).toBe('PROCESSED');
    const firstId = firstBody.results[0].entityId;

    const second = await app.inject({
      method: 'POST',
      url: '/api/v1/sync/mutations',
      headers: auth(worker.token),
      payload: {
        deviceId: 'sync-test-device-01',
        mutations: [{
          transactionId: 'txn-conc-2',
          entityType: 'encounter',
          operation: 'CREATE',
          idempotencyKey: 'dup-key-enc-1',
          clientTimestamp: new Date().toISOString(),
          payload: { patientId, presentingComplaint: 'Second write (should be dropped)' },
        }],
      },
    });
    const secondBody = second.json();
    expect(secondBody.results[0].duplicated).toBe(true);
    expect(secondBody.results[0].entityId).toBe(firstId);
    const count = await db.encounter.count({ where: { idempotencyKey: 'dup-key-enc-1' } });
    expect(count).toBe(1);
  });

  it('out-of-order client timestamps still converge without duplicates', async () => {
    // A retry arriving with an OLDER client timestamp must not create a second
    // record — the transaction id governs idempotency, not wall-clock order.
    const older = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sync/mutations',
      headers: auth(worker.token),
      payload: {
        deviceId: 'sync-test-device-01',
        mutations: [{
          transactionId: 'txn-old-1',
          entityType: 'patient',
          operation: 'CREATE',
          clientTimestamp: older,
          payload: { fullName: 'Timestamp Patient (synthetic)', phone: '0500111222' },
        }],
      },
    });
    expect(res.statusCode).toBe(200);
    const retry = await app.inject({
      method: 'POST',
      url: '/api/v1/sync/mutations',
      headers: auth(worker.token),
      payload: {
        deviceId: 'sync-test-device-01',
        mutations: [{
          transactionId: 'txn-old-1',
          entityType: 'patient',
          operation: 'CREATE',
          clientTimestamp: older,
          payload: { fullName: 'Timestamp Patient (synthetic)', phone: '0500111222' },
        }],
      },
    });
    const retryBody = retry.json();
    expect(retryBody.results[0].duplicated).toBe(true);
    const count = await db.patient.count({ where: { fullName: 'Timestamp Patient (synthetic)' } });
    expect(count).toBe(1);
  });

  it('re-applies a previously FAILED mutation on retry (transient failure recovery)', async () => {
    // First attempt references a patient that does not exist yet → the FK fails,
    // and the mutation is recorded FAILED (a realistic offline ordering issue:
    // the patient arrives in a later batch than the encounter).
    const fail = await app.inject({
      method: 'POST',
      url: '/api/v1/sync/mutations',
      headers: auth(worker.token),
      payload: {
        deviceId: 'sync-test-device-01',
        mutations: [{
          transactionId: 'txn-retry-1',
          entityType: 'encounter',
          operation: 'CREATE',
          clientTimestamp: new Date().toISOString(),
          payload: { patientId: '00000000-0000-0000-0000-000000000000', presentingComplaint: 'Pending patient' },
        }],
      },
    });
    expect(fail.json().results[0].status).toBe('FAILED');

    // Now the patient syncs in a later batch (out-of-order arrival).
    const seedPatient = await app.inject({
      method: 'POST',
      url: '/api/v1/sync/mutations',
      headers: auth(worker.token),
      payload: {
        deviceId: 'sync-test-device-01',
        mutations: [{
          transactionId: 'txn-retry-0',
          entityType: 'patient',
          operation: 'CREATE',
          clientTimestamp: new Date().toISOString(),
          payload: { fullName: 'Recovered Patient (synthetic)', phone: '0555111222' },
        }],
      },
    });
    const patientId = seedPatient.json().results[0].entityId;
    expect(patientId).toBeTruthy();

    // Retry with the SAME transaction id must re-apply and succeed.
    const retry = await app.inject({
      method: 'POST',
      url: '/api/v1/sync/mutations',
      headers: auth(worker.token),
      payload: {
        deviceId: 'sync-test-device-01',
        mutations: [{
          transactionId: 'txn-retry-1',
          entityType: 'encounter',
          operation: 'CREATE',
          clientTimestamp: new Date().toISOString(),
          payload: { patientId, presentingComplaint: 'Now the patient exists' },
        }],
      },
    });
    const retryBody = retry.json();
    expect(retryBody.results[0].status).toBe('PROCESSED');
    expect(retryBody.results[0].duplicated).toBe(false);
    const log = await db.mutationLog.findUnique({ where: { transactionId: 'txn-retry-1' } });
    expect(log?.status).toBe('PROCESSED');
    expect(log?.retryCount).toBeGreaterThanOrEqual(1);
    const count = await db.encounter.count({ where: { patientId, presentingComplaint: 'Now the patient exists' } });
    expect(count).toBe(1);
  });

  it('keeps returning a clean envelope when the same mutation keeps failing (no 500)', async () => {
    // A permanently invalid mutation retried repeatedly must never 500 — each
    // attempt updates the FAILED log and returns the results envelope.
    for (let i = 0; i < 2; i++) {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/sync/mutations',
        headers: auth(worker.token),
        payload: {
          deviceId: 'sync-test-device-01',
          mutations: [{
            transactionId: 'txn-permafail',
            entityType: 'unknownEntity',
            operation: 'CREATE',
            clientTimestamp: new Date().toISOString(),
            payload: { fullName: 'Perma Fail (synthetic)' },
          }],
        },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.failed).toBe(1);
      expect(body.results[0].status).toBe('FAILED');
    }
    const log = await db.mutationLog.findUnique({ where: { transactionId: 'txn-permafail' } });
    expect(log?.status).toBe('FAILED');
    expect(log?.retryCount).toBeGreaterThanOrEqual(1);
  });

  it('never contacts an opted-out patient when replaying a REMIND mutation offline', async () => {
    // Patient in the worker's facility who has opted out of reminders.
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/patients',
      headers: auth(worker.token),
      payload: { fullName: 'OptOut Sync Child (synthetic)', dateOfBirth: '2024-01-01', phone: '0244000000', force: true },
    });
    const patientId = created.json().patient.id as string;
    await app.inject({
      method: 'PATCH',
      url: `/api/v1/patients/${patientId}/reminder-opt-out`,
      headers: auth(worker.token),
      payload: { reminderOptOut: true },
    });
    const dose = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(worker.token),
      payload: { patientId, vaccine: 'PENTA', dose: '1' },
    });
    expect(dose.statusCode).toBe(200);
    const immId = dose.json().immunization.id as string;

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sync/mutations',
      headers: auth(worker.token),
      payload: {
        deviceId: 'sync-test-device-01',
        mutations: [{
          transactionId: 'txn-optout-remind',
          entityType: 'immunization',
          operation: 'REMIND',
          clientTimestamp: new Date().toISOString(),
          payload: { id: immId, channel: 'SMS' },
        }],
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().results[0].status).toBe('PROCESSED');

    // The replay must log the dedicated opted-out action — and never a real
    // remind (which would both contact the family and feed the sweep dedupe).
    const optedOut = await db.auditLog.findFirst({ where: { action: 'immunization.remind.optedOut', entityId: immId } });
    expect(optedOut).toBeTruthy();
    expect(optedOut?.after).toContain('opted out');
    const remind = await db.auditLog.findFirst({ where: { action: 'immunization.remind', entityId: immId } });
    expect(remind).toBeNull();
  });

  it('offline registration keeps reminder consent and preferred language on replay', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sync/mutations',
      headers: auth(worker.token),
      payload: {
        deviceId: 'sync-test-device-01',
        mutations: [{
          transactionId: 'txn-consent-lang',
          entityType: 'patient',
          operation: 'CREATE',
          clientTimestamp: new Date().toISOString(),
          payload: { fullName: 'Offline Consent Child (synthetic)', dateOfBirth: '2023-05-05', phone: '0244000333', preferredLanguage: 'GA', reminderOptOut: true },
        }],
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().results[0].status).toBe('PROCESSED');
    const patient = await db.patient.findUnique({ where: { id: res.json().results[0].entityId } });
    expect(patient?.preferredLanguage).toBe('GA');
    expect(patient?.reminderOptOut).toBe(true);
  });
});
