import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createHmac } from 'node:crypto';
import { db, createTestApp, makeUser } from './helpers.js';
import type { FastifyInstance } from 'fastify';
import { deliverDueWebhooks, publishEvent } from '../src/modules/webhooks/engine.js';

// ---------------------------------------------------------------------------
// Platform event webhooks (docs/22 Phase 7 — advanced interoperability):
// subscriptions receive HMAC-signed POSTs with durable retry; live platform
// writes (patient registration, verified lab results, immunization, delivery)
// publish events. Tests drive the routes and the delivery sweep against a
// fake upstream.
// ---------------------------------------------------------------------------

const PERMS = ['manage_integrations', 'create_patient', 'view_patient', 'view_clinical_record', 'write_clinical_note', 'order_lab', 'verify_lab'];
const auth = (t: string) => ({ authorization: `Bearer ${t}` });

let app: FastifyInstance;
let admin: { token: string };

beforeAll(async () => {
  app = await createTestApp();
  admin = await makeUser({ email: 'webhook-admin@demo.gh', roleCode: 'NATIONAL_ADMIN', scope: 'NATIONAL', facilityId: null, permissions: PERMS });
});

// Each test owns its subscriptions/deliveries — wipe between tests so counts
// and fan-out assertions are exact (the shared DB accumulates across files).
beforeEach(async () => {
  await db.webhookDelivery.deleteMany();
  await db.webhookSubscription.deleteMany();
});

afterAll(async () => {
  await db.webhookDelivery.deleteMany();
  await db.webhookSubscription.deleteMany();
  await db.patient.deleteMany({ where: { fullName: { startsWith: 'Webhook ' } } });
  await db.$disconnect();
  await app.close();
});

describe('webhook subscriptions (docs/22 Phase 7)', () => {
  it('creates a subscription and rejects invalid / SSRF targets', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks',
      headers: auth(admin.token),
      payload: { name: 'National tracker', url: 'https://tracker.example/hook', events: 'patient.created,labOrder.verified', active: true },
    });
    expect(res.statusCode).toBe(200);
    const sub = res.json().subscription;
    expect(sub.events).toContain('patient.created');
    expect(sub.secret).toBeTruthy(); // auto-generated shared secret

    const badProto = await app.inject({ method: 'POST', url: '/api/v1/webhooks', headers: auth(admin.token), payload: { name: 'x', url: 'ftp://tracker.example/hook', events: 'patient.created' } });
    expect(badProto.statusCode).toBe(400);
    const badEvent = await app.inject({ method: 'POST', url: '/api/v1/webhooks', headers: auth(admin.token), payload: { name: 'x', url: 'https://tracker.example/hook', events: 'invoice.paid' } });
    expect(badEvent.statusCode).toBe(400);
  });

  it('lists subscriptions with delivery counts and updates / deletes them', async () => {
    await app.inject({ method: 'POST', url: '/api/v1/webhooks', headers: auth(admin.token), payload: { name: 'Extra', url: 'https://extra.example/hook', events: 'delivery.recorded' } });
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks',
      headers: auth(admin.token),
      payload: { name: 'Charts app', url: 'https://charts.example/events', events: '*' },
    });
    const id = created.json().subscription.id;

    const list = await app.inject({ method: 'GET', url: '/api/v1/webhooks', headers: auth(admin.token) });
    expect(list.statusCode).toBe(200);
    expect(list.json().subscriptions.length).toBeGreaterThanOrEqual(2);

    const patch = await app.inject({ method: 'PATCH', url: `/api/v1/webhooks/${id}`, headers: auth(admin.token), payload: { active: false, events: 'delivery.recorded' } });
    expect(patch.statusCode).toBe(200);
    expect(patch.json().subscription.active).toBe(false);
    expect(patch.json().subscription.events).toContain('delivery.recorded');

    const del = await app.inject({ method: 'DELETE', url: `/api/v1/webhooks/${id}`, headers: auth(admin.token) });
    expect(del.statusCode).toBe(200);
    expect(del.json().ok).toBe(true);
  });

  it('publishes a test patient.created event to one subscription and audits it', async () => {
    const created = await app.inject({ method: 'POST', url: '/api/v1/webhooks', headers: auth(admin.token), payload: { name: 'Test target', url: 'https://test.example/hook', events: 'patient.created' } });
    const id = created.json().subscription.id;
    const res = await app.inject({ method: 'POST', url: `/api/v1/webhooks/${id}/test`, headers: auth(admin.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.deliveries).toBe(1);
    expect(body.note).toContain('test patient.created delivery');
    // The test event queued a real delivery for this subscription.
    const queued = await db.webhookDelivery.findFirst({ where: { subscriptionId: id, status: 'PENDING' } });
    expect(queued).toBeTruthy();
    const audit = await db.auditLog.findFirst({ where: { action: 'webhook.test', entityId: id } });
    expect(audit?.after).toContain('"deliveries":1');

    const missing = await app.inject({ method: 'POST', url: '/api/v1/webhooks/nope/test', headers: auth(admin.token) });
    expect(missing.statusCode).toBe(404);
    const limited = await makeUser({ email: 'webhook-limited@demo.gh', roleCode: 'DOCTOR', scope: 'FACILITY', facilityId: null, permissions: ['view_patient'] });
    const denied = await app.inject({ method: 'POST', url: `/api/v1/webhooks/${id}/test`, headers: auth(limited.token) });
    expect(denied.statusCode).toBe(403);
  });
});

describe('event publishing from live writes', () => {
  it('publishes patient.created when a patient is registered', async () => {
    const sub = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks',
      headers: auth(admin.token),
      payload: { name: 'Registry sync', url: 'https://registry.example/hooks', events: 'patient.created' },
    });
    const subId = sub.json().subscription.id;

    const patient = await app.inject({ method: 'POST', url: '/api/v1/patients', headers: auth(admin.token), payload: { fullName: 'Webhook Patient (synthetic)', force: true } });
    expect(patient.statusCode).toBe(200);

    const rows = await db.webhookDelivery.findMany({ where: { subscriptionId: subId, event: 'patient.created' } });
    expect(rows.length).toBe(1);
    const payload = JSON.parse(rows[0]!.payload) as { event: string; payload: { patientId: string; mrn: string } };
    expect(payload.event).toBe('patient.created');
    expect(payload.payload.mrn).toBeTruthy();
  });

  it('publishes labOrder.verified when a result is verified', async () => {
    await app.inject({ method: 'POST', url: '/api/v1/webhooks', headers: auth(admin.token), payload: { name: 'Lab sync', url: 'https://lab.example/hook', events: 'labOrder.verified' } });
    const patient = await app.inject({ method: 'POST', url: '/api/v1/patients', headers: auth(admin.token), payload: { fullName: 'Webhook Lab Patient (synthetic)', force: true } });
    if (patient.statusCode !== 200) throw new Error(`patient create failed: ${patient.statusCode} ${patient.body}`);
    const patientId = (patient.json().patient as { id: string }).id;
    const enc = await app.inject({ method: 'POST', url: `/api/v1/patients/${patientId}/encounters`, headers: auth(admin.token), payload: { type: 'OPD', presentingComplaint: 'x' } });
    const encounterId = (enc.json().encounter as { id: string }).id;
    const order = await app.inject({ method: 'POST', url: `/api/v1/patients/${patientId}/lab-orders`, headers: auth(admin.token), payload: { encounterId, test: 'FBC', discipline: 'HAEMATOLOGY' } });
    const orderId = order.json().order.id;

    const verified = await app.inject({ method: 'POST', url: `/api/v1/patients/${patientId}/lab-orders/${orderId}/result`, headers: auth(admin.token), payload: { result: 'Normal', critical: false } });
    expect(verified.statusCode).toBe(200);

    const rows = await db.webhookDelivery.findMany({ where: { event: 'labOrder.verified' } });
    expect(rows.length).toBeGreaterThanOrEqual(1);
    const payload = JSON.parse(rows.at(-1)!.payload) as { event: string; payload: { orderId: string } };
    expect(payload.event).toBe('labOrder.verified');
    expect(payload.payload.orderId).toBe(orderId);

    await db.labOrder.deleteMany({ where: { id: orderId } });
    await db.encounter.deleteMany({ where: { id: encounterId } });
    await db.patient.deleteMany({ where: { id: patientId } });
  });

  it('publishEvent only matches subscriptions for that event (no fan-out to others)', async () => {
    const sub = await app.inject({ method: 'POST', url: '/api/v1/webhooks', headers: auth(admin.token), payload: { name: 'Delivery only', url: 'https://delivery.example/hook', events: 'delivery.recorded' } });
    const subId = sub.json().subscription.id;
    const result = await publishEvent(db, 'patient.created', { patientId: 'x' });
    expect(result.matched).toBe(0);
    const rows = await db.webhookDelivery.findMany({ where: { subscriptionId: subId } });
    expect(rows.length).toBe(0);
  });
});

describe('signed delivery to an upstream', () => {
  let upstream: ReturnType<typeof createServer>;
  let baseUrl = '';
  let secret = '';
  const received: Array<{ body: unknown; signature: string | null; event: string | null }> = [];

  beforeAll(async () => {
    upstream = createServer((req, res) => {
      let body = '';
      req.on('data', (c) => (body += String(c)));
      req.on('end', () => {
        received.push({
          body: body ? JSON.parse(body) : null,
          signature: (req.headers['x-gihm-signature'] as string) ?? null,
          event: (req.headers['x-gihm-event'] as string) ?? null,
        });
        if ((req.url ?? '').includes('fail')) {
          res.writeHead(500);
          res.end();
          return;
        }
        res.writeHead(200);
        res.end();
      });
    });
    await new Promise<void>((resolve) => upstream.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${(upstream.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => upstream.close(() => resolve()));
  });

  it('delivers a signed POST and the receiver can verify the HMAC', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks',
      headers: auth(admin.token),
      payload: { name: 'Upstream', url: `${baseUrl}/hook`, events: 'patient.created', secret: 'shared-secret' },
    });
    secret = created.json().subscription.secret;
    expect(secret).toBe('shared-secret');

    const result = await publishEvent(db, 'patient.created', { patientId: 'p-1' });
    expect(result.deliveries).toBe(1);
    await db.webhookDelivery.updateMany({ where: { status: 'PENDING' }, data: { nextAttemptAt: new Date(Date.now() - 1000) } });

    const sweep = await deliverDueWebhooks(db, {}, { info: () => {}, warn: () => {}, error: () => {} });
    expect(sweep.delivered).toBeGreaterThanOrEqual(1);

    const last = received.at(-1)!;
    expect(last.event).toBe('patient.created');
    // The signature verifies against the shared secret — receiver-side check.
    const expected = `sha256=${createHmac('sha256', secret).update(JSON.stringify(last.body)).digest('hex')}`;
    expect(last.signature).toBe(expected);
    const rows = await db.webhookDelivery.findMany({ where: { status: 'DELIVERED' } });
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });

  it('retries rejected deliveries with backoff and marks FAILED after max attempts', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/webhooks',
      headers: auth(admin.token),
      payload: { name: 'Flaky upstream', url: `${baseUrl}/fail`, events: 'patient.created', secret: 's2' },
    });
    const subId = created.json().subscription.id;
    const result = await publishEvent(db, 'patient.created', { patientId: 'p-2' });
    expect(result.deliveries).toBe(1);

    await db.webhookDelivery.updateMany({ where: { subscriptionId: subId }, data: { nextAttemptAt: new Date(Date.now() - 1000) } });
    const first = await deliverDueWebhooks(db, { maxAttempts: 2 }, { info: () => {}, warn: () => {}, error: () => {} });
    expect(first.delivered).toBe(0);
    let row = await db.webhookDelivery.findFirstOrThrow({ where: { subscriptionId: subId } });
    expect(row.status).toBe('PENDING');
    expect(row.attempts).toBe(1);
    expect(row.nextAttemptAt.getTime()).toBeGreaterThan(Date.now()); // backoff applied

    await db.webhookDelivery.update({ where: { id: row.id }, data: { nextAttemptAt: new Date(Date.now() - 1000) } });
    const second = await deliverDueWebhooks(db, { maxAttempts: 2 }, { info: () => {}, warn: () => {}, error: () => {} });
    row = await db.webhookDelivery.findFirstOrThrow({ where: { subscriptionId: subId } });
    expect(row.status).toBe('FAILED');
    expect(row.attempts).toBe(2);
    expect(second.failed).toBe(1);
    // Never deleted — the log is the reconciliation record.
    expect(await db.webhookDelivery.count({ where: { subscriptionId: subId } })).toBe(1);
  });

  it('exposes the delivery log and the manual sweep endpoint', async () => {
    await app.inject({ method: 'POST', url: '/api/v1/webhooks', headers: auth(admin.token), payload: { name: 'Log hook', url: 'https://log.example/hook', events: 'patient.created' } });
    await publishEvent(db, 'patient.created', { patientId: 'log-1' });
    const log = await app.inject({ method: 'GET', url: '/api/v1/webhooks/deliveries', headers: auth(admin.token) });
    expect(log.statusCode).toBe(200);
    expect(log.json().rows.length).toBeGreaterThan(0);
    expect(log.json().rows[0].subscription.name).toBeTruthy();

    const sweep = await app.inject({ method: 'POST', url: '/api/v1/webhooks/sweep', headers: auth(admin.token) });
    expect(sweep.statusCode).toBe(200);
    expect(typeof sweep.json().attempted).toBe('number');
  });

  it('requires manage_integrations', async () => {
    const doctor = await makeUser({ email: 'webhook-doctor@demo.gh', roleCode: 'DOCTOR' });
    const res = await app.inject({ method: 'POST', url: '/api/v1/webhooks', headers: auth(doctor.token), payload: { name: 'x', url: 'https://x.example/hook', events: 'patient.created' } });
    expect(res.statusCode).toBe(403);
  });
});
