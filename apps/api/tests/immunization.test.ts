import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { db, createTestApp, makeUser, makeFacility } from './helpers.js';
import { runScheduledReminders } from '../src/modules/immunization/reminders.js';
import { clearSetting, setSetting } from '../src/lib/settings.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;
let staff: { token: string };
let facilityId: string;

const PERMS = ['view_patient', 'create_patient', 'view_clinical_record', 'write_clinical_note', 'view_reports', 'view_dashboard'];

beforeAll(async () => {
  app = await createTestApp();
  const facility = await makeFacility('Immunization Test Facility (synthetic)');
  facilityId = facility.id;
  staff = await makeUser({ email: 'immunization-staff@demo.gh', roleCode: 'HOSPITAL_ADMIN', facilityId, permissions: PERMS });
});

afterAll(async () => {
  await db.$disconnect();
  await app.close();
});

const auth = (t: string) => ({ authorization: `Bearer ${t}` });

async function makePatient(name: string, dobDaysAgo: number) {
  const dob = new Date(Date.now() - dobDaysAgo * 24 * 3600 * 1000);
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/patients',
    headers: auth(staff.token),
    payload: { fullName: name, dateOfBirth: dob.toISOString().slice(0, 10), force: true },
  });
  expect(res.statusCode).toBe(200);
  return res.json().patient as { id: string; mrn: string; dateOfBirth: string };
}

async function makePatientWithPhone(name: string, dobDaysAgo: number, phone: string) {
  const dob = new Date(Date.now() - dobDaysAgo * 24 * 3600 * 1000);
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/patients',
    headers: auth(staff.token),
    payload: { fullName: name, dateOfBirth: dob.toISOString().slice(0, 10), phone, force: true },
  });
  expect(res.statusCode).toBe(200);
  return res.json().patient as { id: string; mrn: string; dateOfBirth: string; phone: string };
}

/** Poll until a fire-and-forget audit write lands (recordAudit is not awaited). */
async function waitForAudit(action: string, entityId?: string): Promise<{ after: string | null } | null> {
  const deadline = Date.now() + 2000;
  while (Date.now() < deadline) {
    const row = await db.auditLog.findFirst({ where: { action, ...(entityId ? { entityId } : {}) }, orderBy: { createdAt: 'desc' } });
    if (row) return row;
    await new Promise((r) => setTimeout(r, 50));
  }
  return null;
}

function daysBetween(a: string | Date, b: Date): number {
  const da = new Date(a).getTime();
  return Math.round((da - b.getTime()) / (24 * 3600 * 1000));
}

describe('immunization schedule', () => {
  it('serves the Ghana EPI schedule with BCG at birth', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/immunizations/schedule', headers: auth(staff.token) });
    expect(res.statusCode).toBe(200);
    const items = res.json().schedule;
    expect(items.length).toBeGreaterThan(20);
    const bcg = items.find((s: { vaccine: string }) => s.vaccine === 'BCG');
    expect(bcg).toBeTruthy();
    expect(bcg.dose).toBe('0');
    expect(bcg.ageDays).toBe(0);
  });
});

describe('recording doses', () => {
  it('records a dose and auto-computes the next due date from the child DOB', async () => {
    // Child born 60 days ago: PENTA 1 due at 6 weeks → next dose PENTA 2 at 10 weeks.
    const patient = await makePatient('Immunization Infant A (synthetic)', 60);
    const dob = new Date(patient.dateOfBirth);
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1', administeredAt: new Date().toISOString().slice(0, 10) },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.immunization.status).toBe('GIVEN');
    expect(body.next.dose).toBe('2');
    // PENTA 2 due ~10 days from now (DOB + 70 days, DOB was 60 days ago).
    // The DOB is stored date-only (midnight), so the "days from now" figure is
    // time-of-day dependent — assert a range, exactly like the worklist test.
    expect(daysBetween(body.immunization.nextDueAt, dob)).toBe(70);
    const fromNow = daysBetween(body.immunization.nextDueAt, new Date());
    expect(fromNow).toBeGreaterThanOrEqual(9);
    expect(fromNow).toBeLessThanOrEqual(10);
  });

  it('rejects an unknown vaccine/dose combination', async () => {
    const patient = await makePatient('Immunization Infant B (synthetic)', 30);
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'PENTA', dose: '9' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects a duplicate dose for the same patient', async () => {
    const patient = await makePatient('Immunization Infant C (synthetic)', 30);
    const first = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'OPV', dose: '0' },
    });
    expect(first.statusCode).toBe(200);
    const second = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'OPV', dose: '0' },
    });
    expect(second.statusCode).toBe(409);
  });

  it('lists the registry filtered by patient', async () => {
    const patient = await makePatient('Immunization Registry (synthetic)', 45);
    await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'BCG', dose: '0' },
    });
    const res = await app.inject({ method: 'GET', url: `/api/v1/immunizations?patientId=${patient.id}`, headers: auth(staff.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items.length).toBe(1);
    expect(body.items[0].vaccine).toBe('BCG');
    expect(body.items[0].patient.mrn).toBe(patient.mrn);
  });
});

describe('defaulter-tracking worklist', () => {
  it('surfaces children due soon and overdue with bucket + days', async () => {
    // Due soon: PENTA 1 given, PENTA 2 due in ~10 days.
    const dueSoonPatient = await makePatient('Due Soon Child (synthetic)', 60);
    await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: dueSoonPatient.id, vaccine: 'PENTA', dose: '1' },
    });
    // Overdue: PENTA 1 given, PENTA 2 due ~30 days ago.
    const overduePatient = await makePatient('Overdue Child (synthetic)', 100);
    await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: overduePatient.id, vaccine: 'PENTA', dose: '1' },
    });

    const res = await app.inject({ method: 'GET', url: '/api/v1/immunizations/due', headers: auth(staff.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    const dueSoon = body.items.find((r: { patient: { fullName: string } }) => r.patient.fullName === 'Due Soon Child (synthetic)');
    const overdue = body.items.find((r: { patient: { fullName: string } }) => r.patient.fullName === 'Overdue Child (synthetic)');
    expect(dueSoon).toBeTruthy();
    expect(dueSoon.bucket).toBe('DUE_SOON');
    expect(dueSoon.daysUntil).toBeGreaterThanOrEqual(9);
    expect(dueSoon.daysUntil).toBeLessThanOrEqual(11);
    expect(overdue).toBeTruthy();
    expect(overdue.bucket).toBe('OVERDUE');
    expect(overdue.daysOverdue).toBeGreaterThanOrEqual(28);
    expect(overdue.daysOverdue).toBeLessThanOrEqual(32);
    expect(body.summary.overdue).toBeGreaterThanOrEqual(1);
    expect(body.summary.dueSoon).toBeGreaterThanOrEqual(1);
  });

  it('filters by bucket and search query', async () => {
    const onlyOverdue = await app.inject({ method: 'GET', url: '/api/v1/immunizations/due?bucket=OVERDUE', headers: auth(staff.token) });
    expect(onlyOverdue.statusCode).toBe(200);
    expect(onlyOverdue.json().items.every((r: { bucket: string }) => r.bucket === 'OVERDUE')).toBe(true);

    const searched = await app.inject({ method: 'GET', url: '/api/v1/immunizations/due?q=Overdue%20Child', headers: auth(staff.token) });
    const rows = searched.json().items;
    expect(rows.length).toBe(1);
    expect(rows[0].patient.fullName).toBe('Overdue Child (synthetic)');
  });

  it('does not re-flag a child whose vaccine series is complete', async () => {
    const patient = await makePatient('Complete Series Child (synthetic)', 100);
    for (const dose of ['1', '2']) {
      await app.inject({
        method: 'POST',
        url: '/api/v1/immunizations',
        headers: auth(staff.token),
        payload: { patientId: patient.id, vaccine: 'ROTA', dose },
      });
    }
    // ROTA 1's nextDueAt (DOB + 70d) is 30 days in the past, but ROTA 2 (the final
    // dose, nextDueAt null) supersedes it — the child must not appear as overdue.
    const res = await app.inject({ method: 'GET', url: '/api/v1/immunizations/due?q=Complete%20Series', headers: auth(staff.token) });
    expect(res.json().items.length).toBe(0);
  });

  it('documents a missed dose and removes it from the worklist', async () => {
    const patient = await makePatient('Missed Dose Child (synthetic)', 100);
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1' },
    });
    const id = created.json().immunization.id as string;

    const notDueYet = await app.inject({ method: 'GET', url: '/api/v1/immunizations/due?q=Missed%20Dose', headers: auth(staff.token) });
    expect(notDueYet.json().items.length).toBe(1);

    const missed = await app.inject({ method: 'POST', url: `/api/v1/immunizations/${id}/mark-missed`, headers: auth(staff.token) });
    expect(missed.statusCode).toBe(200);
    expect(missed.json().immunization.status).toBe('MISSED');

    const after = await app.inject({ method: 'GET', url: '/api/v1/immunizations/due?q=Missed%20Dose', headers: auth(staff.token) });
    expect(after.json().items.length).toBe(0);
  });
});

describe('reminder recalls (SMS)', () => {
  it('logs a reminder to the audit trail when no gateway is connected', async () => {
    const patient = await makePatientWithPhone('Remind Child (synthetic)', 60, '+233244000000');
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1' },
    });
    const id = created.json().immunization.id as string;

    const res = await app.inject({ method: 'POST', url: `/api/v1/immunizations/${id}/remind`, headers: auth(staff.token), payload: { channel: 'SMS' } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.reminded).toBe(true);
    expect(body.dispatched).toBe(false);
    expect(body.provider).toBe('none');
    expect(body.note).toContain('not connected');
    expect(body.to).toBe('+233244000000');

    const audit = await db.auditLog.findFirst({ where: { action: 'immunization.remind', entityId: id } });
    expect(audit).toBeTruthy();
    expect(audit?.after).toContain('"channel":"SMS"');
    expect(audit?.after).toContain('"dispatched":false');
  });

  it('logs a reminder without a phone number instead of dispatching', async () => {
    const patient = await makePatient('Remind No Phone (synthetic)', 60);
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1' },
    });
    const id = created.json().immunization.id as string;
    const res = await app.inject({ method: 'POST', url: `/api/v1/immunizations/${id}/remind`, headers: auth(staff.token), payload: { channel: 'SMS' } });
    expect(res.json().dispatched).toBe(false);
    expect(res.json().note).toContain('No phone number on file');
  });

  it('rejects an unknown reminder channel', async () => {
    const patient = await makePatient('Remind Child 2 (synthetic)', 60);
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1' },
    });
    const id = created.json().immunization.id as string;
    const res = await app.inject({ method: 'POST', url: `/api/v1/immunizations/${id}/remind`, headers: auth(staff.token), payload: { channel: 'CARRIER_PIGEON' } });
    expect(res.statusCode).toBe(400);
  });
});

describe('SMS reminder dispatch (Twilio)', () => {
  const saved = {
    provider: process.env.SMS_PROVIDER,
    sid: process.env.TWILIO_ACCOUNT_SID,
    token: process.env.TWILIO_AUTH_TOKEN,
    from: process.env.TWILIO_PHONE_NUMBER,
    fetch: globalThis.fetch,
  };

  afterEach(() => {
    for (const [k, v] of Object.entries({ SMS_PROVIDER: saved.provider, TWILIO_ACCOUNT_SID: saved.sid, TWILIO_AUTH_TOKEN: saved.token, TWILIO_PHONE_NUMBER: saved.from })) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v as string;
    }
    globalThis.fetch = saved.fetch;
  });

  it('dispatches via Twilio when configured and returns the message id', async () => {
    process.env.SMS_PROVIDER = 'twilio';
    process.env.TWILIO_ACCOUNT_SID = 'AC-test';
    process.env.TWILIO_AUTH_TOKEN = 'test-token';
    process.env.TWILIO_PHONE_NUMBER = '+12025550123';
    let captured: { url: string; body: string } | undefined;
    globalThis.fetch = (async (input: unknown, init?: { body?: unknown }) => {
      captured = { url: String(input), body: String(init?.body ?? '') };
      return new Response(JSON.stringify({ sid: 'SM12345', status: 'queued' }), { status: 201, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;

    const patient = await makePatientWithPhone('SMS Child (synthetic)', 60, '+233244000000');
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1' },
    });
    const id = created.json().immunization.id as string;

    const res = await app.inject({ method: 'POST', url: `/api/v1/immunizations/${id}/remind`, headers: auth(staff.token), payload: { channel: 'SMS' } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.dispatched).toBe(true);
    expect(body.provider).toBe('twilio');
    expect(body.messageId).toBe('SM12345');
    expect(captured?.url).toContain('/Accounts/AC-test/Messages.json');
    const form = new URLSearchParams(captured?.body ?? '');
    expect(form.get('To')).toBe('+233244000000');
    expect(form.get('From')).toBe('+12025550123');
    expect(form.get('Body')).toContain('Pentavalent');
    expect(form.get('Body')).toContain('Dose 2');

    const audit = await db.auditLog.findFirst({ where: { action: 'immunization.remind', entityId: id } });
    expect(audit?.after).toContain('"dispatched":true');
    expect(audit?.after).toContain('"messageId":"SM12345"');
  });

  it('reports a non-200 gateway response without throwing', async () => {
    process.env.SMS_PROVIDER = 'twilio';
    process.env.TWILIO_ACCOUNT_SID = 'AC-test';
    process.env.TWILIO_AUTH_TOKEN = 'test-token';
    process.env.TWILIO_PHONE_NUMBER = '+12025550123';
    globalThis.fetch = (async () => new Response(JSON.stringify({ error_message: 'unverified destination' }), { status: 400, headers: { 'content-type': 'application/json' } })) as unknown as typeof fetch;

    const patient = await makePatientWithPhone('SMS Reject Child (synthetic)', 60, '+233244000000');
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1' },
    });
    const id = created.json().immunization.id as string;
    const res = await app.inject({ method: 'POST', url: `/api/v1/immunizations/${id}/remind`, headers: auth(staff.token), payload: { channel: 'SMS' } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.dispatched).toBe(false);
    expect(body.note).toContain('unverified destination');
  });

  it('normalizes a local-format Ghana number to E.164 before dispatch', async () => {
    process.env.SMS_PROVIDER = 'twilio';
    process.env.TWILIO_ACCOUNT_SID = 'AC-test';
    process.env.TWILIO_AUTH_TOKEN = 'test-token';
    process.env.TWILIO_PHONE_NUMBER = '+12025550123';
    let capturedTo: string | undefined;
    globalThis.fetch = (async (input: unknown, init?: { body?: unknown }) => {
      capturedTo = new URLSearchParams(String(init?.body ?? '')).get('To') ?? undefined;
      return new Response(JSON.stringify({ sid: 'SM999', status: 'queued' }), { status: 201, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;

    const patient = await makePatientWithPhone('SMS Local Number Child (synthetic)', 60, '0244000000');
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1' },
    });
    const id = created.json().immunization.id as string;
    const res = await app.inject({ method: 'POST', url: `/api/v1/immunizations/${id}/remind`, headers: auth(staff.token), payload: { channel: 'SMS' } });
    expect(res.json().dispatched).toBe(true);
    expect(capturedTo).toBe('+233244000000');
  });
});

describe('WhatsApp reminder dispatch (Hubtel)', () => {
  const saved = {
    provider: process.env.WHATSAPP_PROVIDER,
    clientId: process.env.HUBTEL_WHATSAPP_CLIENT_ID,
    clientSecret: process.env.HUBTEL_WHATSAPP_CLIENT_SECRET,
    url: process.env.HUBTEL_WHATSAPP_URL,
    fetch: globalThis.fetch,
  };

  afterEach(() => {
    for (const [k, v] of Object.entries({ WHATSAPP_PROVIDER: saved.provider, HUBTEL_WHATSAPP_CLIENT_ID: saved.clientId, HUBTEL_WHATSAPP_CLIENT_SECRET: saved.clientSecret, HUBTEL_WHATSAPP_URL: saved.url })) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v as string;
    }
    globalThis.fetch = saved.fetch;
  });

  it('dispatches a recall over WhatsApp when the channel is requested and configured', async () => {
    process.env.WHATSAPP_PROVIDER = 'hubtel';
    process.env.HUBTEL_WHATSAPP_CLIENT_ID = 'wa-client';
    process.env.HUBTEL_WHATSAPP_CLIENT_SECRET = 'wa-secret';
    process.env.HUBTEL_WHATSAPP_URL = 'https://wa.example.test/v1/messages/send';
    let captured: { url: string; body: string; auth: string } | undefined;
    globalThis.fetch = (async (input: unknown, init?: { headers?: Record<string, string>; body?: unknown }) => {
      captured = { url: String(input), body: String(init?.body ?? ''), auth: String(init?.headers?.Authorization ?? '') };
      return new Response(JSON.stringify({ MessageId: 'WA12345', Success: true }), { status: 200, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;

    const patient = await makePatientWithPhone('WA Child (synthetic)', 60, '+233244000000');
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1' },
    });
    const id = created.json().immunization.id as string;

    const res = await app.inject({ method: 'POST', url: `/api/v1/immunizations/${id}/remind`, headers: auth(staff.token), payload: { channel: 'WHATSAPP' } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.channel).toBe('WHATSAPP');
    expect(body.dispatched).toBe(true);
    expect(body.provider).toBe('hubtel');
    expect(body.messageId).toBe('WA12345');
    expect(captured?.url).toContain('wa.example.test');
    expect(captured?.auth).toContain('Basic ');
    const payload = JSON.parse(captured?.body ?? '{}') as { recipient?: string; message?: string };
    expect(payload.recipient).toBe('233244000000');
    expect(payload.message).toContain('Pentavalent');
    expect(payload.message).toContain('Dose 2');

    const audit = await db.auditLog.findFirst({ where: { action: 'immunization.remind', entityId: id } });
    expect(audit?.after).toContain('"channel":"WHATSAPP"');
    expect(audit?.after).toContain('"dispatched":true');
    expect(audit?.after).toContain('"messageId":"WA12345"');
  });

  it('reports a gateway rejection without throwing (WhatsApp)', async () => {
    process.env.WHATSAPP_PROVIDER = 'hubtel';
    process.env.HUBTEL_WHATSAPP_CLIENT_ID = 'wa-client';
    process.env.HUBTEL_WHATSAPP_CLIENT_SECRET = 'wa-secret';
    process.env.HUBTEL_WHATSAPP_URL = 'https://wa.example.test/v1/messages/send';
    globalThis.fetch = (async () => new Response(JSON.stringify({ Message: 'sender not approved', Success: false }), { status: 200, headers: { 'content-type': 'application/json' } })) as unknown as typeof fetch;

    const patient = await makePatientWithPhone('WA Reject Child (synthetic)', 60, '+233244000000');
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1' },
    });
    const id = created.json().immunization.id as string;
    const res = await app.inject({ method: 'POST', url: `/api/v1/immunizations/${id}/remind`, headers: auth(staff.token), payload: { channel: 'WHATSAPP' } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.dispatched).toBe(false);
    expect(body.note).toContain('sender not approved');
  });
});

describe('bulk reminder recalls', () => {
  it('dispatches to multiple selected doses in one call with a per-recipient summary', async () => {
    const saved = { provider: process.env.SMS_PROVIDER, key: process.env.SMSONLINEGH_API_KEY, sender: process.env.SMSONLINEGH_SENDER_ID, fetch: globalThis.fetch };
    process.env.SMS_PROVIDER = 'smsonlinegh';
    process.env.SMSONLINEGH_API_KEY = 'bulk-key';
    process.env.SMSONLINEGH_SENDER_ID = 'GIHM';
    globalThis.fetch = (async (input: unknown) => {
      const url = String(input);
      if (url.includes('smsonlinegh.com')) {
        return new Response(JSON.stringify({ handshake: { id: 0 }, data: { batch: 'bulk-batch', destinations: [{ id: 'd1', to: '233244111111', status: { id: 0 } }] } }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;
    try {
      const p1 = await makePatientWithPhone('Bulk One (synthetic)', 66, '+233244111111');
      const p2 = await makePatientWithPhone('Bulk Two (synthetic)', 66, '+233244222222');
      // A child with no phone — skipped with a noPhone count, never an error.
      const dob = new Date(Date.now() - 66 * 24 * 3600 * 1000);
      const p3res = await app.inject({ method: 'POST', url: '/api/v1/patients', headers: auth(staff.token), payload: { fullName: 'Bulk NoPhone (synthetic)', dateOfBirth: dob.toISOString().slice(0, 10), force: true } });
      const p3 = p3res.json().patient as { id: string };
      const mkDose = async (patientId: string) => {
        const r = await app.inject({ method: 'POST', url: '/api/v1/immunizations', headers: auth(staff.token), payload: { patientId, vaccine: 'PENTA', dose: '1' } });
        return r.json().immunization.id as string;
      };
      const id1 = await mkDose(p1.id);
      const id2 = await mkDose(p2.id);
      const id3 = await mkDose(p3.id);
      // A bogus (out-of-scope) id — skipped and counted, never an error.
      const bogusId = '00000000-0000-4000-8000-00000000abcd';

      const res = await app.inject({ method: 'POST', url: '/api/v1/immunizations/reminders/bulk', headers: auth(staff.token), payload: { ids: [id1, id2, id3, bogusId], channel: 'SMS' } });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.summary).toEqual({ dispatched: 2, failed: 0, noPhone: 1, skipped: 1, optedOut: 0 });
      expect(body.results.length).toBe(3);
      expect(body.results.find((r: { id: string }) => r.id === id3).dispatched).toBe(false);
      expect(body.results.find((r: { id: string }) => r.id === id3).note).toContain('No phone number');
      const audit = await waitForAudit('immunization.remind.bulk');
      expect(audit?.after).toContain('"requested":4');
      expect(audit?.after).toContain('"dispatched":2');
      expect(audit?.after).toContain('"skipped":1');

      // Invalid channel → 400; over the 200 cap → 400 (honest, not truncated);
      // an account with no clinical/send permission → 403.
      const bad = await app.inject({ method: 'POST', url: '/api/v1/immunizations/reminders/bulk', headers: auth(staff.token), payload: { ids: [id1], channel: 'TELEX' } });
      expect(bad.statusCode).toBe(400);
      const tooMany = Array.from({ length: 201 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`);
      const capped = await app.inject({ method: 'POST', url: '/api/v1/immunizations/reminders/bulk', headers: auth(staff.token), payload: { ids: tooMany, channel: 'SMS' } });
      expect(capped.statusCode).toBe(400);
      expect(capped.json().error.message).toContain('capped at 200');
      const viewOnly = await makeUser({ email: 'bulk-view@demo.gh', roleCode: 'NURSE', scope: 'FACILITY', permissions: ['view_dashboard'] });
      const denied = await app.inject({ method: 'POST', url: '/api/v1/immunizations/reminders/bulk', headers: auth(viewOnly.token), payload: { ids: [id1], channel: 'SMS' } });
      expect(denied.statusCode).toBe(403);
    } finally {
      for (const [k, v] of Object.entries({ SMS_PROVIDER: saved.provider, SMSONLINEGH_API_KEY: saved.key, SMSONLINEGH_SENDER_ID: saved.sender })) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v as string;
      }
      globalThis.fetch = saved.fetch;
    }
  });

  it('surfaces opted-out families per-row and audits them under the dedicated action', async () => {
    const p = await makePatientWithPhone('Bulk OptOut Child (synthetic)', 66, '+233244777777');
    await app.inject({ method: 'PATCH', url: `/api/v1/patients/${p.id}/reminder-opt-out`, headers: auth(staff.token), payload: { reminderOptOut: true } });
    const created = await app.inject({ method: 'POST', url: '/api/v1/immunizations', headers: auth(staff.token), payload: { patientId: p.id, vaccine: 'PENTA', dose: '1' } });
    const doseId = created.json().immunization.id as string;

    // Bulk: no gateway needed — the family is skipped before any dispatch.
    const res = await app.inject({ method: 'POST', url: '/api/v1/immunizations/reminders/bulk', headers: auth(staff.token), payload: { ids: [doseId], channel: 'SMS' } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.summary.optedOut).toBe(1);
    const row = body.results.find((r: { id: string }) => r.id === doseId);
    expect(row.optedOut).toBe(true);
    expect(row.dispatched).toBe(false);
    expect(row.note).toContain('opted out');

    // The dedicated action is audited per-row — never a real remind — so the
    // reminder report counts this family under the right bucket.
    const opted = await waitForAudit('immunization.remind.optedOut', doseId);
    expect(opted).toBeTruthy();
    expect(opted?.after).toContain('"dispatched":false');
    const reminded = await db.auditLog.findFirst({ where: { action: 'immunization.remind', entityId: doseId } });
    expect(reminded).toBeNull();
    const rep = await app.inject({ method: 'GET', url: '/api/v1/immunizations/reminders/report?days=30', headers: auth(staff.token) });
    expect(rep.json().totals.optedOut).toBeGreaterThanOrEqual(1);

    // Leave no opted-out patient behind — later sweep tests assert zero opt-outs.
    await app.inject({ method: 'PATCH', url: `/api/v1/patients/${p.id}/reminder-opt-out`, headers: auth(staff.token), payload: { reminderOptOut: false } });
  });
});

describe('remind all due — filter-driven bulk recall', () => {
  const saved = { provider: process.env.SMS_PROVIDER, key: process.env.SMSONLINEGH_API_KEY, sender: process.env.SMSONLINEGH_SENDER_ID, fetch: globalThis.fetch };
  beforeEach(() => {
    process.env.SMS_PROVIDER = 'smsonlinegh';
    process.env.SMSONLINEGH_API_KEY = 'all-key';
    process.env.SMSONLINEGH_SENDER_ID = 'GIHM';
    globalThis.fetch = (async (input: unknown) => {
      const url = String(input);
      if (url.includes('smsonlinegh.com')) {
        return new Response(JSON.stringify({ handshake: { id: 0 }, data: { batch: 'all-batch', destinations: [{ id: 'd1', to: '233244111111', status: { id: 0 } }] } }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;
  });
  afterEach(() => {
    for (const [k, v] of Object.entries({ SMS_PROVIDER: saved.provider, SMSONLINEGH_API_KEY: saved.key, SMSONLINEGH_SENDER_ID: saved.sender })) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v as string;
    }
    globalThis.fetch = saved.fetch;
  });

  it('recalls every due child in the current filter (no checkbox selection needed)', async () => {
    const p1 = await makePatientWithPhone('All Due One (synthetic)', 66, '+233244111111');
    const p2 = await makePatientWithPhone('All Due Two (synthetic)', 66, '+233244222222');
    const mkDose = async (patientId: string) => {
      const r = await app.inject({ method: 'POST', url: '/api/v1/immunizations', headers: auth(staff.token), payload: { patientId, vaccine: 'PENTA', dose: '1' } });
      return r.json().immunization.id as string;
    };
    await mkDose(p1.id);
    await mkDose(p2.id);

    // Scope the run to THIS file's two children via the search filter — other
    // files' due rows must never affect the assertions.
    const res = await app.inject({ method: 'POST', url: '/api/v1/immunizations/reminders/remind-all', headers: auth(staff.token), payload: { channel: 'SMS', q: 'All Due' } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.matched).toBe(2);
    expect(body.summary.dispatched).toBe(2);
    expect(body.results.length).toBe(2);
    const audit = await waitForAudit('immunization.remind.all');
    expect(audit?.after).toContain('"matched":2');
    expect(audit?.after).toContain('"dispatched":2');

    // A search that matches nothing is a clear 400.
    const none = await app.inject({ method: 'POST', url: '/api/v1/immunizations/reminders/remind-all', headers: auth(staff.token), payload: { channel: 'SMS', q: 'zzz-no-such-name' } });
    expect(none.statusCode).toBe(400);
    expect(none.json().error.message).toContain('No doses match');
  });
});

describe('reminder run report — per-facility CSV', () => {
  const saved = { provider: process.env.SMS_PROVIDER, key: process.env.SMSONLINEGH_API_KEY, sender: process.env.SMSONLINEGH_SENDER_ID, fetch: globalThis.fetch };
  afterEach(() => {
    for (const [k, v] of Object.entries({ SMS_PROVIDER: saved.provider, SMSONLINEGH_API_KEY: saved.key, SMSONLINEGH_SENDER_ID: saved.sender })) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v as string;
    }
    globalThis.fetch = saved.fetch;
  });

  it('exports who was reminded, on which channel, with the outcome and patient detail', async () => {
    const p = await makePatientWithPhone('Report Child (synthetic)', 66, '+233244333333');
    const created = await app.inject({ method: 'POST', url: '/api/v1/immunizations', headers: auth(staff.token), payload: { patientId: p.id, vaccine: 'PENTA', dose: '1' } });
    const id = created.json().immunization.id as string;
    // Dispatch a reminder so a remind row exists (mock fetch → dispatched).
    process.env.SMS_PROVIDER = 'smsonlinegh';
    process.env.SMSONLINEGH_API_KEY = 'rep-key';
    process.env.SMSONLINEGH_SENDER_ID = 'GIHM';
    globalThis.fetch = (async () => new Response(JSON.stringify({ handshake: { id: 0 }, data: { batch: 'REP-1', destinations: [{ id: 'd1', to: '233244333333', status: { id: 0 } }] } }), { status: 200, headers: { 'content-type': 'application/json' } })) as unknown as typeof fetch;
    await app.inject({ method: 'POST', url: `/api/v1/immunizations/${id}/remind`, headers: auth(staff.token) });
    const res = await app.inject({ method: 'GET', url: '/api/v1/immunizations/export/reminders?days=30', headers: auth(staff.token) });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    const csv = res.body as string;
    expect(csv).toContain('Patient,MRN,Phone,Vaccine,Dose,Channel,Provider,Outcome');
    expect(csv).toContain('Outcome,District,Region');
    expect(csv).toContain('Report Child (synthetic)');
    expect(csv).toContain('PENTA');
    expect(csv).toContain('dispatched');
    expect(csv).toContain('SMS');
    // Channel filter narrows the report.
    const waOnly = await app.inject({ method: 'GET', url: '/api/v1/immunizations/export/reminders?days=30&channel=WHATSAPP', headers: auth(staff.token) });
    expect(waOnly.body as string).not.toContain('Report Child (synthetic)');
    // District/region filters narrow it too (this child has no district).
    const regOnly = await app.inject({ method: 'GET', url: '/api/v1/immunizations/export/reminders?days=30&region=North', headers: auth(staff.token) });
    expect(regOnly.body as string).not.toContain('Report Child (synthetic)');
  });

  it('breaks the report down by district/region and counts opted-out families', async () => {
    const region = await db.region.create({ data: { code: 'RPT-REG', name: 'Report Region (synthetic)', status: 'ACTIVE' } });
    const district = await db.district.create({ data: { code: 'RPT-DIS', name: 'Report District (synthetic)', regionId: region.id, type: 'DISTRICT', status: 'ACTIVE' } });
    const p = await makePatientWithPhone('Opted Report Child (synthetic)', 66, '+233244555555');
    await db.patient.update({ where: { id: p.id }, data: { districtId: district.id } });
    const created = await app.inject({ method: 'POST', url: '/api/v1/immunizations', headers: auth(staff.token), payload: { patientId: p.id, vaccine: 'PENTA', dose: '1' } });
    const id = created.json().immunization.id as string;
    // Opt the family out, then attempt a single remind — logged as an opt-out.
    await app.inject({ method: 'PATCH', url: `/api/v1/patients/${p.id}/reminder-opt-out`, headers: auth(staff.token), payload: { reminderOptOut: true } });
    await app.inject({ method: 'POST', url: `/api/v1/immunizations/${id}/remind`, headers: auth(staff.token) });

    const rep = await app.inject({ method: 'GET', url: '/api/v1/immunizations/reminders/report?days=30', headers: auth(staff.token) });
    expect(rep.statusCode).toBe(200);
    const body = rep.json();
    expect(body.totals.optedOut).toBeGreaterThanOrEqual(1);
    expect(body.byDistrict['Report District (synthetic)']).toBeGreaterThanOrEqual(1);
    expect(body.byRegion['Report Region (synthetic)']).toBeGreaterThanOrEqual(1);
    const optedRow = body.recent.find((r: { action: string; entityId: string | null }) => r.action === 'immunization.remind.optedOut' && r.entityId === id);
    expect(optedRow).toBeTruthy();
    expect(optedRow.district).toBe('Report District (synthetic)');
    expect(optedRow.region).toBe('Report Region (synthetic)');
    // Leave no opted-out patient behind — later sweep tests assert zero opt-outs.
    await app.inject({ method: 'PATCH', url: `/api/v1/patients/${p.id}/reminder-opt-out`, headers: auth(staff.token), payload: { reminderOptOut: false } });
    // Clean up the synthetic geography rows so no geography test sees them.
    await db.district.deleteMany({ where: { code: 'RPT-DIS' } });
    await db.region.deleteMany({ where: { code: 'RPT-REG' } });
  });
});

describe('missed-dose follow-up list', () => {
  it('drops a follow-up once the missed dose is later recorded', async () => {
    const patient = await makePatient('Resolved Defaulter (synthetic)', 100);
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1' },
    });
    const id = created.json().immunization.id as string;
    await app.inject({ method: 'POST', url: `/api/v1/immunizations/${id}/mark-missed`, headers: auth(staff.token) });

    const before = await app.inject({ method: 'GET', url: `/api/v1/immunizations/missed?patientId=${patient.id}`, headers: auth(staff.token) });
    expect(before.json().items.length).toBe(1);

    // The defaulter returns and receives the missed dose (PENTA 2).
    await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'PENTA', dose: '2' },
    });

    const after = await app.inject({ method: 'GET', url: `/api/v1/immunizations/missed?patientId=${patient.id}`, headers: auth(staff.token) });
    expect(after.statusCode).toBe(200);
    expect(after.json().items.length).toBe(0);
  });

  it('lists marked-missed doses with the successor dose info and missed-since date', async () => {
    const patient = await makePatient('Missed Follow-up Child (synthetic)', 100);
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1' },
    });
    const id = created.json().immunization.id as string;
    await app.inject({ method: 'POST', url: `/api/v1/immunizations/${id}/mark-missed`, headers: auth(staff.token) });

    const res = await app.inject({ method: 'GET', url: `/api/v1/immunizations/missed?patientId=${patient.id}`, headers: auth(staff.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(1);
    const row = body.items[0]!;
    // PENTA 1 was given; the missed dose is its successor PENTA 2.
    expect(row.vaccine).toBe('PENTA');
    expect(row.dose).toBe('2');
    expect(row.missedSince).toBeTruthy();
    expect(row.daysOverdue).toBeGreaterThan(0);
    expect(row.patient.mrn).toBe(patient.mrn);
  });
});

describe('patient portal access (self_access)', () => {
  it('lets a patient see only their own record, appointments and due immunizations', async () => {
    const mine = await makePatient('Portal Me (synthetic)', 60);
    const other = await makePatient('Portal Other (synthetic)', 60);
    for (const p of [mine, other]) {
      await app.inject({
        method: 'POST',
        url: '/api/v1/immunizations',
        headers: auth(staff.token),
        payload: { patientId: p.id, vaccine: 'PENTA', dose: '1' },
      });
    }
    const me = await makeUser({ email: 'portal-me@demo.gh', roleCode: 'PATIENT', scope: 'PATIENT', permissions: ['self_access'], linkPatientId: mine.id });

    // Due worklist is restricted to the caller's own record.
    const due = await app.inject({ method: 'GET', url: '/api/v1/immunizations/due', headers: auth(me.token) });
    expect(due.statusCode).toBe(200);
    expect(due.json().items.length).toBe(1);
    expect(due.json().items[0]!.patient.id).toBe(mine.id);

    // Patient list returns only their own record.
    const patients = await app.inject({ method: 'GET', url: '/api/v1/patients?pageSize=20', headers: auth(me.token) });
    expect(patients.statusCode).toBe(200);
    const items = patients.json().items as { id: string }[];
    expect(items.length).toBe(1);
    expect(items[0]!.id).toBe(mine.id);

    // Appointments endpoint is reachable (previously 403 for patients).
    const appts = await app.inject({ method: 'GET', url: '/api/v1/appointments', headers: auth(me.token) });
    expect(appts.statusCode).toBe(200);

    // Staff endpoints remain off-limits.
    const denied = await app.inject({ method: 'GET', url: '/api/v1/immunizations/missed', headers: auth(me.token) });
    expect(denied.statusCode).toBe(403);
  });
});

describe('coverage analytics', () => {
  it('computes dose coverage, PENTA dropout and fully-immunized rates within scope', async () => {
    const fac = await makeFacility('Coverage Test Facility (synthetic)');
    const covUser = await makeUser({
      email: 'coverage@demo.gh',
      roleCode: 'HOSPITAL_ADMIN',
      facilityId: fac.id,
      permissions: ['view_patient', 'create_patient', 'write_clinical_note', 'view_reports', 'view_dashboard'],
    });
    const make = async (name: string, dobDaysAgo: number) => {
      const dob = new Date(Date.now() - dobDaysAgo * 24 * 3600 * 1000);
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/patients',
        headers: auth(covUser.token),
        payload: { fullName: name, dateOfBirth: dob.toISOString().slice(0, 10), force: true },
      });
      expect(res.statusCode).toBe(200);
      return res.json().patient as { id: string };
    };
    // Isolated facility → deterministic coverage numbers.
    const childA = await make('Coverage Child A (synthetic)', 200); // PENTA 1 only
    const childB = await make('Coverage Child B (synthetic)', 400); // PENTA 1 + 3
    for (const p of [childA, childB]) {
      await app.inject({ method: 'POST', url: '/api/v1/immunizations', headers: auth(covUser.token), payload: { patientId: p.id, vaccine: 'PENTA', dose: '1' } });
    }
    await app.inject({ method: 'POST', url: '/api/v1/immunizations', headers: auth(covUser.token), payload: { patientId: childB.id, vaccine: 'PENTA', dose: '3' } });

    const res = await app.inject({ method: 'GET', url: '/api/v1/immunizations/coverage', headers: auth(covUser.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    const penta1 = body.indicators.find((i: { key: string }) => i.key === 'PENTA_1');
    const penta3 = body.indicators.find((i: { key: string }) => i.key === 'PENTA_3');
    const mr1 = body.indicators.find((i: { key: string }) => i.key === 'MR_1');
    expect(penta1.vaccinated).toBe(2);
    expect(penta1.eligible).toBe(2);
    expect(penta3.vaccinated).toBe(1);
    expect(body.dropoutRate).toBe(50);
    expect(mr1.eligible).toBe(1);
    expect(mr1.vaccinated).toBe(0);
    // Only child B is in the 12-month cohort, and is not fully immunized.
    expect(body.fullyImmunized.eligible).toBe(1);
    expect(body.fullyImmunized.vaccinated).toBe(0);
    expect(body.fullyImmunized.coveragePct).toBe(0);
  });
});

describe('CSV exports', () => {
  it('exports the due worklist as CSV with attachment headers', async () => {
    const patient = await makePatient('Export Due Child (synthetic)', 100);
    await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1' },
    });
    const res = await app.inject({ method: 'GET', url: '/api/v1/immunizations/export/due', headers: auth(staff.token) });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('immunizations-due.csv');
    expect(res.body).toContain('Patient name');
    expect(res.body).toContain(patient.mrn);
    expect(res.body).toContain('OVERDUE');
  });

  it('exports the missed-dose follow-up list as CSV', async () => {
    const patient = await makePatient('Export Missed Child (synthetic)', 100);
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1' },
    });
    const id = created.json().immunization.id as string;
    await app.inject({ method: 'POST', url: `/api/v1/immunizations/${id}/mark-missed`, headers: auth(staff.token) });
    const res = await app.inject({ method: 'GET', url: '/api/v1/immunizations/export/missed', headers: auth(staff.token) });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('Patient name');
    expect(res.body).toContain(patient.mrn);
  });

  it('exports coverage indicators as CSV', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/immunizations/export/coverage', headers: auth(staff.token) });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('Indicator');
    expect(res.body).toContain('dropout rate');
  });
});

describe('offline sync of immunization mutations', () => {
  it('applies immunization.CREATE with auto next-due and rejects duplicates as FAILED', async () => {
    const patient = await makePatient('Sync Child (synthetic)', 60);
    const syncUser = await makeUser({
      email: 'imm-sync@demo.gh',
      roleCode: 'HOSPITAL_ADMIN',
      facilityId,
      permissions: ['view_patient', 'write_clinical_note', 'view_clinical_record', 'sync_data'],
    });
    // Pre-approve this device — new devices self-register as PENDING and must
    // be enrolled before they can sync (docs/21; covered in devices.test.ts).
    await db.device.upsert({
      where: { deviceId: 'dev-imm-sync-test' },
      create: { deviceId: 'dev-imm-sync-test', name: 'Immunization sync test device (synthetic)', platform: 'PWA', facilityId, status: 'ACTIVE', enrolledAt: new Date() },
      update: {},
    });
    const txn = `txn-imm-${Math.random().toString(36).slice(2)}`;
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sync/mutations',
      headers: auth(syncUser.token),
      payload: {
        deviceId: 'dev-imm-sync-test',
        mutations: [{
          transactionId: txn,
          entityType: 'immunization',
          operation: 'CREATE',
          idempotencyKey: `key-${txn}`,
          clientTimestamp: new Date().toISOString(),
          payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1', administeredAt: new Date().toISOString().slice(0, 10) },
        }],
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().processed).toBe(1);
    const created = await db.immunization.findFirst({ where: { patientId: patient.id, vaccine: 'PENTA', dose: '1', status: 'GIVEN' } });
    expect(created?.nextDueAt).toBeTruthy();

    // A duplicate surfaces as FAILED — never a silent double-dose.
    const dup = await app.inject({
      method: 'POST',
      url: '/api/v1/sync/mutations',
      headers: auth(syncUser.token),
      payload: {
        mutations: [{
          transactionId: `txn-imm-dup-${Math.random().toString(36).slice(2)}`,
          entityType: 'immunization',
          operation: 'CREATE',
          payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1' },
        }],
      },
    });
    expect(dup.json().failed).toBe(1);
    expect(dup.json().results[0].status).toBe('FAILED');
  });

  it('does not let a sync_data-only user record doses through the outbox', async () => {
    const patient = await makePatient('Sync Perm Child (synthetic)', 60);
    const limited = await makeUser({ email: 'imm-sync-limited@demo.gh', roleCode: 'HOSPITAL_ADMIN', facilityId, permissions: ['sync_data'] });
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sync/mutations',
      headers: auth(limited.token),
      payload: {
        mutations: [{
          transactionId: `txn-imm-perm-${Math.random().toString(36).slice(2)}`,
          entityType: 'immunization',
          operation: 'CREATE',
          payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1' },
        }],
      },
    });
    expect(res.json().failed).toBe(1);
    expect(res.json().results[0].status).toBe('FAILED');
    expect(res.json().results[0].error).toContain('Insufficient permissions');
  });

  it('replays an offline-queued reminder (immunization.REMIND) and audit-logs it', async () => {
    const patient = await makePatientWithPhone('Sync Remind Child (synthetic)', 60, '+233244111222');
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1' },
    });
    const id = created.json().immunization.id as string;
    const syncUser = await makeUser({
      email: 'imm-sync-remind@demo.gh',
      roleCode: 'HOSPITAL_ADMIN',
      facilityId,
      permissions: ['view_patient', 'write_clinical_note', 'view_clinical_record', 'sync_data'],
    });
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sync/mutations',
      headers: auth(syncUser.token),
      payload: {
        mutations: [{
          transactionId: `txn-remind-${Math.random().toString(36).slice(2)}`,
          entityType: 'immunization',
          operation: 'REMIND',
          payload: { id, channel: 'SMS' },
        }],
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().processed).toBe(1);
    const audit = await db.auditLog.findFirst({ where: { action: 'immunization.remind', entityId: id } });
    expect(audit?.after).toContain('"dispatched":false');
  });
});

describe('SMS reminder dispatch (Hubtel)', () => {
  const saved = {
    provider: process.env.SMS_PROVIDER,
    id: process.env.HUBTEL_CLIENT_ID,
    secret: process.env.HUBTEL_CLIENT_SECRET,
    sender: process.env.HUBTEL_SENDER_ID,
    fetch: globalThis.fetch,
  };

  afterEach(() => {
    for (const [k, v] of Object.entries({ SMS_PROVIDER: saved.provider, HUBTEL_CLIENT_ID: saved.id, HUBTEL_CLIENT_SECRET: saved.secret, HUBTEL_SENDER_ID: saved.sender })) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v as string;
    }
    globalThis.fetch = saved.fetch;
  });

  it('dispatches via Hubtel with query params and the normalized international recipient', async () => {
    process.env.SMS_PROVIDER = 'hubtel';
    process.env.HUBTEL_CLIENT_ID = 'gihm-client';
    process.env.HUBTEL_CLIENT_SECRET = 'secret';
    process.env.HUBTEL_SENDER_ID = 'GIHM-HIS';
    let capturedUrl: string | undefined;
    globalThis.fetch = (async (input: unknown) => {
      capturedUrl = String(input);
      return new Response(JSON.stringify({ Message: 'Success', MessageId: 'HUB0001', Rate: 0.016, Balance: 9.5 }), { status: 200, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;

    const patient = await makePatientWithPhone('Hubtel Child (synthetic)', 60, '0244000000'); // local format
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1' },
    });
    const id = created.json().immunization.id as string;
    const res = await app.inject({ method: 'POST', url: `/api/v1/immunizations/${id}/remind`, headers: auth(staff.token), payload: { channel: 'SMS' } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.dispatched).toBe(true);
    expect(body.provider).toBe('hubtel');
    expect(body.messageId).toBe('HUB0001');

    const url = new URL(capturedUrl ?? '');
    expect(url.origin + url.pathname).toBe('https://smsc.hubtel.com/v1/messages/send');
    expect(url.searchParams.get('clientid')).toBe('gihm-client');
    expect(url.searchParams.get('clientsecret')).toBe('secret');
    expect(url.searchParams.get('from')).toBe('GIHM-HIS');
    expect(url.searchParams.get('to')).toBe('233244000000'); // 0244… normalized to international, '+' stripped
    expect(url.searchParams.get('content')).toContain('Pentavalent');

    const audit = await db.auditLog.findFirst({ where: { action: 'immunization.remind', entityId: id } });
    expect(audit?.after).toContain('"provider":"hubtel"');
  });

  it('defaults the sender to HM and surfaces Hubtel rejection messages', async () => {
    process.env.SMS_PROVIDER = 'hubtel';
    process.env.HUBTEL_CLIENT_ID = 'gihm-client';
    process.env.HUBTEL_CLIENT_SECRET = 'secret';
    let capturedUrl: string | undefined;
    globalThis.fetch = (async (input: unknown) => {
      capturedUrl = String(input);
      return new Response(JSON.stringify({ Message: 'Invalid clientid or clientsecret' }), { status: 401, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;

    const patient = await makePatientWithPhone('Hubtel Reject Child (synthetic)', 60, '+233244000000');
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1' },
    });
    const id = created.json().immunization.id as string;
    const res = await app.inject({ method: 'POST', url: `/api/v1/immunizations/${id}/remind`, headers: auth(staff.token), payload: { channel: 'SMS' } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.dispatched).toBe(false);
    expect(body.note).toContain('Invalid clientid or clientsecret');
    expect(new URL(capturedUrl ?? '').searchParams.get('from')).toBe('HM');
  });

  it('infers the hubtel provider from credentials alone (no SMS_PROVIDER needed)', async () => {
    delete process.env.SMS_PROVIDER;
    process.env.HUBTEL_CLIENT_ID = 'gihm-client';
    process.env.HUBTEL_CLIENT_SECRET = 'secret';
    globalThis.fetch = (async () => new Response(JSON.stringify({ Message: 'Success', MessageId: 'HUB0002' }), { status: 200, headers: { 'content-type': 'application/json' } })) as unknown as typeof fetch;
    const patient = await makePatientWithPhone('Hubtel Infer Child (synthetic)', 60, '0244000000');
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1' },
    });
    const id = created.json().immunization.id as string;
    const res = await app.inject({ method: 'POST', url: `/api/v1/immunizations/${id}/remind`, headers: auth(staff.token), payload: { channel: 'SMS' } });
    expect(res.statusCode).toBe(200);
    expect(res.json().dispatched).toBe(true);
    expect(res.json().provider).toBe('hubtel');
  });
});

describe('WhatsApp reminder dispatch (Hubtel WhatsApp API)', () => {
  const saved = {
    provider: process.env.WHATSAPP_PROVIDER,
    id: process.env.HUBTEL_WHATSAPP_CLIENT_ID,
    secret: process.env.HUBTEL_WHATSAPP_CLIENT_SECRET,
    url: process.env.HUBTEL_WHATSAPP_URL,
    sender: process.env.HUBTEL_WHATSAPP_SENDER_ID,
    fetch: globalThis.fetch,
  };

  afterEach(() => {
    for (const [k, v] of Object.entries({ WHATSAPP_PROVIDER: saved.provider, HUBTEL_WHATSAPP_CLIENT_ID: saved.id, HUBTEL_WHATSAPP_CLIENT_SECRET: saved.secret, HUBTEL_WHATSAPP_URL: saved.url, HUBTEL_WHATSAPP_SENDER_ID: saved.sender })) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v as string;
    }
    globalThis.fetch = saved.fetch;
  });

  it('dispatches over WhatsApp when configured', async () => {
    process.env.WHATSAPP_PROVIDER = 'hubtel';
    process.env.HUBTEL_WHATSAPP_CLIENT_ID = 'wa-client';
    process.env.HUBTEL_WHATSAPP_CLIENT_SECRET = 'wa-secret';
    process.env.HUBTEL_WHATSAPP_SENDER_ID = 'GIHM-WA';
    let captured: { url: string; body: string } | undefined;
    globalThis.fetch = (async (input: unknown, init?: { body?: unknown }) => {
      captured = { url: String(input), body: String(init?.body ?? '') };
      return new Response(JSON.stringify({ Message: 'Success', MessageId: 'WA0001' }), { status: 200, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;

    const patient = await makePatientWithPhone('WhatsApp Child (synthetic)', 60, '0244000000');
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1' },
    });
    const id = created.json().immunization.id as string;
    const res = await app.inject({ method: 'POST', url: `/api/v1/immunizations/${id}/remind`, headers: auth(staff.token), payload: { channel: 'WHATSAPP' } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.channel).toBe('WHATSAPP');
    expect(body.dispatched).toBe(true);
    expect(body.provider).toBe('hubtel');
    expect(body.messageId).toBe('WA0001');
    expect(captured?.url).toBe('https://api.wa.hubtel.com/v1/messages/send');
    const payload = JSON.parse(captured?.body ?? '{}') as { recipient: string; sender: string; message: string };
    expect(payload.recipient).toBe('233244000000');
    expect(payload.sender).toBe('GIHM-WA');
    expect(payload.message).toContain('Pentavalent');
  });

  it('falls back to audit-only when the WhatsApp gateway is not configured', async () => {
    const patient = await makePatientWithPhone('WhatsApp Off Child (synthetic)', 60, '+233244000000');
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1' },
    });
    const id = created.json().immunization.id as string;
    const res = await app.inject({ method: 'POST', url: `/api/v1/immunizations/${id}/remind`, headers: auth(staff.token), payload: { channel: 'WHATSAPP' } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.dispatched).toBe(false);
    expect(body.provider).toBe('none');
    expect(body.note).toContain('not connected');
  });
});

describe('auto reminder sweep', () => {
  const saved = {
    provider: process.env.SMS_PROVIDER,
    id: process.env.HUBTEL_CLIENT_ID,
    secret: process.env.HUBTEL_CLIENT_SECRET,
    sender: process.env.HUBTEL_SENDER_ID,
    fetch: globalThis.fetch,
  };

  afterEach(() => {
    for (const [k, v] of Object.entries({ SMS_PROVIDER: saved.provider, HUBTEL_CLIENT_ID: saved.id, HUBTEL_CLIENT_SECRET: saved.secret, HUBTEL_SENDER_ID: saved.sender })) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v as string;
    }
    globalThis.fetch = saved.fetch;
  });

  it('dispatches recalls for children due within the window and dedupes on re-run', async () => {
    process.env.SMS_PROVIDER = 'hubtel';
    process.env.HUBTEL_CLIENT_ID = 'gihm-client';
    process.env.HUBTEL_CLIENT_SECRET = 'secret';
    const sent: string[] = [];
    globalThis.fetch = (async (input: unknown) => {
      sent.push(String(input));
      return new Response(JSON.stringify({ Message: 'Success', MessageId: 'HUB-JOB' }), { status: 200, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;

    // Born 66 days ago → PENTA 2 due ~4 days from now (inside the 7-day window).
    const patient = await makePatientWithPhone('Job Child (synthetic)', 66, '0244000000');
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1' },
    });
    const doseId = created.json().immunization.id as string;

    const first = await runScheduledReminders(db, {});
    expect(first.dispatched).toBeGreaterThanOrEqual(1);
    expect(first.failed).toBe(0);
    expect(sent.some((u) => u.includes('to=233244000000'))).toBe(true);
    expect(await db.auditLog.count({ where: { action: 'immunization.remind.auto', entityId: doseId } })).toBe(1);

    // Second run: the audit look-back dedupes the same dose.
    const second = await runScheduledReminders(db, {});
    expect(second.alreadyReminded).toBeGreaterThanOrEqual(1);
    expect(second.dispatched).toBe(0);
    expect(await db.auditLog.count({ where: { action: 'immunization.remind.auto', entityId: doseId } })).toBe(1);
  });

  it('dispatches over reminder.autoChannel=BOTH — SMS and WhatsApp per child', async () => {
    const savedWa = {
      provider: process.env.WHATSAPP_PROVIDER,
      clientId: process.env.HUBTEL_WHATSAPP_CLIENT_ID,
      clientSecret: process.env.HUBTEL_WHATSAPP_CLIENT_SECRET,
      url: process.env.HUBTEL_WHATSAPP_URL,
    };
    process.env.SMS_PROVIDER = 'hubtel';
    process.env.HUBTEL_CLIENT_ID = 'gihm-client';
    process.env.HUBTEL_CLIENT_SECRET = 'secret';
    process.env.WHATSAPP_PROVIDER = 'hubtel';
    process.env.HUBTEL_WHATSAPP_CLIENT_ID = 'wa-client';
    process.env.HUBTEL_WHATSAPP_CLIENT_SECRET = 'wa-secret';
    process.env.HUBTEL_WHATSAPP_URL = 'https://wa.example.test/send';
    const calls: string[] = [];
    globalThis.fetch = (async (input: unknown) => {
      const url = String(input);
      calls.push(url);
      if (url.includes('wa.example.test')) {
        return new Response(JSON.stringify({ MessageId: 'WA-BOTH', Success: true }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      return new Response(JSON.stringify({ Message: 'Success', MessageId: 'SMS-BOTH' }), { status: 200, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;
    await setSetting(db, 'reminder.autoChannel', 'BOTH');
    try {
      const patient = await makePatientWithPhone('Both Child (synthetic)', 66, '0244000000');
      const created = await app.inject({ method: 'POST', url: '/api/v1/immunizations', headers: auth(staff.token), payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1' } });
      const doseId = created.json().immunization.id as string;

      const res = await runScheduledReminders(db, {});
      // One child × two channels = at least two successful dispatches.
      expect(res.dispatched).toBeGreaterThanOrEqual(2);
      expect(calls.some((u) => u.includes('smsc.hubtel.com'))).toBe(true);
      expect(calls.some((u) => u.includes('wa.example.test'))).toBe(true);
      // Both channels audit-logged against the same dose.
      const audits = await db.auditLog.findMany({ where: { action: 'immunization.remind.auto', entityId: doseId } });
      const channels = audits.map((a) => (JSON.parse(a.after ?? '{}') as { channel?: string }).channel).sort();
      expect(channels).toContain('SMS');
      expect(channels).toContain('WHATSAPP');
    } finally {
      await clearSetting(db, 'reminder.autoChannel');
      for (const [k, v] of Object.entries(savedWa)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v as string;
      }
    }
  });

  it('exposes the sweep via POST /immunizations/reminders/run and clamps bad window values', async () => {
    process.env.SMS_PROVIDER = 'hubtel';
    process.env.HUBTEL_CLIENT_ID = 'gihm-client';
    process.env.HUBTEL_CLIENT_SECRET = 'secret';
    globalThis.fetch = (async () => new Response(JSON.stringify({ Message: 'Success', MessageId: 'HUB-OP' }), { status: 200, headers: { 'content-type': 'application/json' } })) as unknown as typeof fetch;

    const res = await app.inject({ method: 'POST', url: '/api/v1/immunizations/reminders/run', headers: auth(staff.token), payload: { windowDays: 'not-a-number' } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.windowDays).toBe(7); // NaN clamps to the default, never an unbounded window
    expect(typeof body.dispatched).toBe('number');
    expect(typeof body.alreadyReminded).toBe('number');
    expect(typeof body.ranAt).toBe('string');
    const audit = await waitForAudit('immunization.reminders.run');
    expect(audit).toBeTruthy();
  });

  it('scopes a manual sweep to the caller — another facility recalls nothing here', async () => {
    process.env.SMS_PROVIDER = 'hubtel';
    process.env.HUBTEL_CLIENT_ID = 'gihm-client';
    process.env.HUBTEL_CLIENT_SECRET = 'secret';
    globalThis.fetch = (async () => new Response(JSON.stringify({ Message: 'Success', MessageId: 'HUB-OP' }), { status: 200, headers: { 'content-type': 'application/json' } })) as unknown as typeof fetch;

    const other = await makeFacility('Sweep Scope Facility (synthetic)');
    const otherUser = await makeUser({ email: 'sweep-other@demo.gh', roleCode: 'HOSPITAL_ADMIN', facilityId: other.id, permissions: ['view_patient', 'sync_data', 'view_reports'] });
    const res = await app.inject({ method: 'POST', url: '/api/v1/immunizations/reminders/run', headers: auth(otherUser.token), payload: { windowDays: 30 } });
    expect(res.statusCode).toBe(200);
    // The other facility has no immunization data — the sweep must not reach ours.
    expect(res.json().scanned).toBe(0);
  });

  it('never recalls opted-out children — counted, not contacted', async () => {
    process.env.SMS_PROVIDER = 'hubtel';
    process.env.HUBTEL_CLIENT_ID = 'gihm-client';
    process.env.HUBTEL_CLIENT_SECRET = 'secret';
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      return new Response(JSON.stringify({ Message: 'Success', MessageId: 'HUB-OPT' }), { status: 200, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;

    const patient = await makePatientWithPhone('OptOut Child (synthetic)', 66, '0244000000');
    const created = await app.inject({ method: 'POST', url: '/api/v1/immunizations', headers: auth(staff.token), payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1' } });
    const doseId = created.json().immunization.id as string;
    // Set the patient's preference via the new PATCH endpoint.
    const patch = await app.inject({ method: 'PATCH', url: `/api/v1/patients/${patient.id}/reminder-opt-out`, headers: auth(staff.token), payload: { reminderOptOut: true } });
    expect(patch.statusCode).toBe(200);
    expect(patch.json().reminderOptOut).toBe(true);

    // Single remind → logged, never dispatched.
    const single = await app.inject({ method: 'POST', url: `/api/v1/immunizations/${doseId}/remind`, headers: auth(staff.token) });
    expect(single.statusCode).toBe(200);
    expect(single.json().dispatched).toBe(false);
    expect(single.json().note).toContain('opted out');
    // The dedicated action must be used — never immunization.remind, which
    // would pollute the sweep's look-back dedupe and suppress later sweeps.
    const opted = await db.auditLog.findFirst({ where: { entityType: 'immunization', entityId: doseId, action: 'immunization.remind.optedOut' } });
    expect(opted).toBeTruthy();
    const notReminded = await db.auditLog.findFirst({ where: { entityType: 'immunization', entityId: doseId, action: 'immunization.remind' } });
    expect(notReminded).toBeNull();

    // Sweep → counted as optedOut, zero dispatches for this child.
    const res = await runScheduledReminders(db, {});
    expect(res.optedOut).toBeGreaterThanOrEqual(1);
    expect(res.dispatched).toBe(0);
    expect(calls).toBe(0); // the gateway was never hit
    const audit = await waitForAudit('patient.reminder-opt-out.on');
    expect(audit).toBeTruthy();

    // Re-enable — the child is reminded again. The opted-out click above did
    // NOT feed the sweep dedupe, so no audit cleanup is needed here.
    await app.inject({ method: 'PATCH', url: `/api/v1/patients/${patient.id}/reminder-opt-out`, headers: auth(staff.token), payload: { reminderOptOut: false } });
    const again = await runScheduledReminders(db, {});
    expect(again.optedOut).toBe(0);
    expect(again.dispatched).toBeGreaterThanOrEqual(1);
  });

  it('dry-run preview counts what WOULD be sent without dispatching anything', async () => {
    process.env.SMS_PROVIDER = 'hubtel';
    process.env.HUBTEL_CLIENT_ID = 'gihm-client';
    process.env.HUBTEL_CLIENT_SECRET = 'secret';
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      return new Response(JSON.stringify({ Message: 'Success', MessageId: 'HUB-DRY' }), { status: 200, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;

    const patient = await makePatientWithPhone('DryRun Child (synthetic)', 66, '0244000000');
    const created = await app.inject({ method: 'POST', url: '/api/v1/immunizations', headers: auth(staff.token), payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1' } });
    const doseId = created.json().immunization.id as string;

    // Bulk dry-run.
    const bulk = await app.inject({ method: 'POST', url: '/api/v1/immunizations/reminders/bulk', headers: auth(staff.token), payload: { ids: [doseId], channel: 'SMS', dryRun: true } });
    expect(bulk.statusCode).toBe(200);
    expect(bulk.json().dryRun).toBe(true);
    expect(bulk.json().summary.dispatched).toBe(1);
    expect(bulk.json().results[0].provider).toBe('dry-run');
    expect(bulk.json().results[0].dryRun).toBe(true); // explicit per-result marker
    expect(calls).toBe(0);

    // Remind-all dry-run.
    const all = await app.inject({ method: 'POST', url: '/api/v1/immunizations/reminders/remind-all', headers: auth(staff.token), payload: { channel: 'SMS', q: 'DryRun', dryRun: true } });
    expect(all.statusCode).toBe(200);
    expect(all.json().dryRun).toBe(true);
    expect(all.json().summary.dispatched).toBeGreaterThanOrEqual(1);
    expect(calls).toBe(0);

    // A real bulk send afterwards actually dispatches.
    const real = await app.inject({ method: 'POST', url: '/api/v1/immunizations/reminders/bulk', headers: auth(staff.token), payload: { ids: [doseId], channel: 'SMS' } });
    expect(real.json().summary.dispatched).toBe(1);
    expect(calls).toBe(1);
  });
});

describe('SMS reminder dispatch (SMSOnlineGH v5)', () => {
  const saved = {
    provider: process.env.SMS_PROVIDER,
    key: process.env.SMSONLINEGH_API_KEY,
    sender: process.env.SMSONLINEGH_SENDER_ID,
    url: process.env.SMSONLINEGH_URL,
    callback: process.env.SMSONLINEGH_CALLBACK_URL,
    fetch: globalThis.fetch,
  };

  afterEach(() => {
    for (const [k, v] of Object.entries({ SMS_PROVIDER: saved.provider, SMSONLINEGH_API_KEY: saved.key, SMSONLINEGH_SENDER_ID: saved.sender, SMSONLINEGH_URL: saved.url, SMSONLINEGH_CALLBACK_URL: saved.callback })) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v as string;
    }
    globalThis.fetch = saved.fetch;
  });

  const v5Ok = (batch: string, destId: string) =>
    new Response(
      JSON.stringify({ handshake: { id: 0, label: 'HSHK_OK' }, data: { batch, delivery: true, destinations: [{ to: '233244000000', id: destId, status: { id: 0, label: 'DS_ACCEPTED' } }] } }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );

  it('dispatches via SMSOnlineGH v5 with key auth and a destinations payload', async () => {
    process.env.SMS_PROVIDER = 'smsonlinegh';
    process.env.SMSONLINEGH_API_KEY = 'test-key';
    process.env.SMSONLINEGH_SENDER_ID = 'GIHM-HIS';
    process.env.SMSONLINEGH_CALLBACK_URL = 'https://example.test/cb';
    let captured: { url: string; init?: { headers?: Record<string, string>; body?: string } } | undefined;
    globalThis.fetch = (async (input: unknown, init?: { headers?: Record<string, string>; body?: string }) => {
      captured = { url: String(input), init };
      return v5Ok('SOGH-B1', 'SOGH0001');
    }) as unknown as typeof fetch;

    const patient = await makePatientWithPhone('SOGH Child (synthetic)', 60, '0244000000');
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1' },
    });
    const id = created.json().immunization.id as string;
    const res = await app.inject({ method: 'POST', url: `/api/v1/immunizations/${id}/remind`, headers: auth(staff.token), payload: { channel: 'SMS' } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.dispatched).toBe(true);
    expect(body.provider).toBe('smsonlinegh');
    expect(body.messageId).toBe('SOGH-B1'); // batch id is the correlation key

    expect(captured?.url).toBe('https://api.smsonlinegh.com/v5/message/sms/send');
    expect(captured?.init?.headers?.Authorization).toBe('key test-key');
    const payload = JSON.parse(captured?.init?.body ?? '{}') as { text: string; type: number; sender: string; destinations: string[]; callback?: { url: string; accept: string } };
    expect(payload.text).toContain('Pentavalent');
    expect(payload.type).toBe(0);
    expect(payload.sender).toBe('GIHM-HIS');
    expect(payload.destinations).toEqual(['233244000000']);
    expect(payload.callback).toEqual({ url: 'https://example.test/cb', accept: 'application/json' });

    const audit = await db.auditLog.findFirst({ where: { action: 'immunization.remind', entityId: id } });
    expect(audit?.after).toContain('"provider":"smsonlinegh"');
    expect(audit?.after).toContain('"messageId":"SOGH-B1"');
  });

  it('surfaces handshake rejections (e.g. MV_ERR_SENDER for a missing sender)', async () => {
    process.env.SMS_PROVIDER = 'smsonlinegh';
    process.env.SMSONLINEGH_API_KEY = 'test-key';
    globalThis.fetch = (async () => new Response(JSON.stringify({ handshake: { id: 1307, label: 'MV_ERR_SENDER' }, data: null }), { status: 200, headers: { 'content-type': 'application/json' } })) as unknown as typeof fetch;

    const patient = await makePatientWithPhone('SOGH Reject Child (synthetic)', 60, '+233244000000');
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1' },
    });
    const id = created.json().immunization.id as string;
    const res = await app.inject({ method: 'POST', url: `/api/v1/immunizations/${id}/remind`, headers: auth(staff.token), payload: { channel: 'SMS' } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.dispatched).toBe(false);
    expect(body.note).toContain('MV_ERR_SENDER');
  });

  it('reports destination-level rejections like an unregistered sender', async () => {
    process.env.SMS_PROVIDER = 'smsonlinegh';
    process.env.SMSONLINEGH_API_KEY = 'test-key';
    process.env.SMSONLINEGH_SENDER_ID = 'GIHM-HIS';
    globalThis.fetch = (async () => new Response(JSON.stringify({ handshake: { id: 0, label: 'HSHK_OK' }, data: { batch: 'SOGH-B2', delivery: false, destinations: [{ to: '233244000000', id: 'SOGH0002', status: { id: 2128, label: 'DS_REJECTED_SENDER_UNREGISTERED' } }] } }), { status: 200, headers: { 'content-type': 'application/json' } })) as unknown as typeof fetch;

    const patient = await makePatientWithPhone('SOGH Dest Reject Child (synthetic)', 60, '0244000000');
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1' },
    });
    const id = created.json().immunization.id as string;
    const res = await app.inject({ method: 'POST', url: `/api/v1/immunizations/${id}/remind`, headers: auth(staff.token), payload: { channel: 'SMS' } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.dispatched).toBe(false);
    expect(body.note).toContain('DS_REJECTED_SENDER_UNREGISTERED');
    expect(body.messageId).toBe('SOGH-B2'); // batch still captured for tracing
  });

  it('treats a string handshake id as success (defensive parsing)', async () => {
    process.env.SMS_PROVIDER = 'smsonlinegh';
    process.env.SMSONLINEGH_API_KEY = 'test-key';
    globalThis.fetch = (async () => new Response(JSON.stringify({ handshake: { id: '0', label: 'HSHK_OK' }, data: { batch: 'SOGH-Q1' } }), { status: 200, headers: { 'content-type': 'application/json' } })) as unknown as typeof fetch;

    const patient = await makePatientWithPhone('SOGH Str Status Child (synthetic)', 60, '0244000000');
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1' },
    });
    const id = created.json().immunization.id as string;
    const res = await app.inject({ method: 'POST', url: `/api/v1/immunizations/${id}/remind`, headers: auth(staff.token), payload: { channel: 'SMS' } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.dispatched).toBe(true);
    expect(body.provider).toBe('smsonlinegh');
    expect(body.messageId).toBe('SOGH-Q1');
  });

  it('infers the provider from the API key alone (no SMS_PROVIDER needed)', async () => {
    delete process.env.SMS_PROVIDER;
    process.env.SMSONLINEGH_API_KEY = 'test-key';
    let capturedAuth: string | undefined;
    globalThis.fetch = (async (input: unknown, init?: { headers?: Record<string, string> }) => {
      capturedAuth = init?.headers?.Authorization;
      return v5Ok('SOGH-B3', 'SOGH0003');
    }) as unknown as typeof fetch;

    const patient = await makePatientWithPhone('SOGH Infer Child (synthetic)', 60, '0244000000');
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1' },
    });
    const id = created.json().immunization.id as string;
    const res = await app.inject({ method: 'POST', url: `/api/v1/immunizations/${id}/remind`, headers: auth(staff.token), payload: { channel: 'SMS' } });
    expect(res.json().dispatched).toBe(true);
    expect(res.json().provider).toBe('smsonlinegh');
    expect(capturedAuth).toBe('key test-key');
  });
});

describe('delivery status tracking (SMSOnlineGH webhook + report)', () => {
  const saved = {
    token: process.env.SMSONLINEGH_CALLBACK_TOKEN,
    url: process.env.SMSONLINEGH_CALLBACK_URL,
    provider: process.env.SMS_PROVIDER,
    key: process.env.SMSONLINEGH_API_KEY,
    sender: process.env.SMSONLINEGH_SENDER_ID,
    fetch: globalThis.fetch,
  };

  afterEach(() => {
    for (const [k, v] of Object.entries({ SMSONLINEGH_CALLBACK_TOKEN: saved.token, SMSONLINEGH_CALLBACK_URL: saved.url, SMS_PROVIDER: saved.provider, SMSONLINEGH_API_KEY: saved.key, SMSONLINEGH_SENDER_ID: saved.sender })) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v as string;
    }
    globalThis.fetch = saved.fetch;
  });

  it('rejects the webhook when a callback URL is configured but no token is set (fail-closed)', async () => {
    process.env.SMSONLINEGH_CALLBACK_URL = 'https://example.test/cb';
    delete process.env.SMSONLINEGH_CALLBACK_TOKEN;
    const res = await app.inject({ method: 'POST', url: '/api/v1/immunizations/reminders/delivery-callback', payload: { messageId: 'B0', status: { id: 0, label: 'DS_DELIVERED' } } });
    expect(res.statusCode).toBe(401);
  });

  it('records a delivery callback and enforces the shared-secret token', async () => {
    process.env.SMSONLINEGH_CALLBACK_TOKEN = 'cb-secret';
    const noToken = await app.inject({ method: 'POST', url: '/api/v1/immunizations/reminders/delivery-callback', payload: { messageId: 'B1', status: { id: 0, label: 'DS_DELIVERED' } } });
    expect(noToken.statusCode).toBe(401);

    const ok = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations/reminders/delivery-callback',
      headers: { 'x-callback-token': 'cb-secret' },
      payload: { messageId: 'B1', status: { id: 0, label: 'DS_DELIVERED' } },
    });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().ok).toBe(true);
    const audit = await db.auditLog.findFirst({ where: { action: 'immunization.remind.delivery', entityId: 'B1' } });
    expect(audit).toBeTruthy();
    expect(audit?.after).toContain('DS_DELIVERED');
  });

  it('accepts Hubtel-shaped delivery reports ({ MessageId, Status, Message })', async () => {
    process.env.SMSONLINEGH_CALLBACK_TOKEN = 'cb-hubtel';
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations/reminders/delivery-callback',
      headers: { 'x-callback-token': 'cb-hubtel' },
      payload: { MessageId: 'HUBTEL-7', Status: 'Success', Message: 'Success' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().messageId).toBe('HUBTEL-7');
    const audit = await db.auditLog.findFirst({ where: { action: 'immunization.remind.delivery', entityId: 'HUBTEL-7' } });
    expect(audit).toBeTruthy();
    // Hubtel's capitalised Status (and Message: 'Success') must be picked.
    expect(audit?.after).toContain('"statusLabel":"Success"');
  });

  it('looks up recorded delivery status by message id', async () => {
    process.env.SMS_PROVIDER = 'smsonlinegh';
    process.env.SMSONLINEGH_API_KEY = 'test-key';
    process.env.SMSONLINEGH_SENDER_ID = 'GIHM-HIS';
    globalThis.fetch = (async () => new Response(JSON.stringify({ handshake: { id: 0, label: 'HSHK_OK' }, data: { batch: 'LOOKUP-1', delivery: true, destinations: [{ to: '233244000000', id: 'dest-1', status: { id: 0, label: 'DS_ACCEPTED' } }] } }), { status: 200, headers: { 'content-type': 'application/json' } })) as unknown as typeof fetch;

    const patient = await makePatientWithPhone('Status Child (synthetic)', 60, '0244000000');
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1' },
    });
    const id = created.json().immunization.id as string;
    const sent = await app.inject({ method: 'POST', url: `/api/v1/immunizations/${id}/remind`, headers: auth(staff.token), payload: { channel: 'SMS' } });
    expect(sent.json().messageId).toBe('LOOKUP-1');

    await app.inject({ method: 'POST', url: '/api/v1/immunizations/reminders/delivery-callback', payload: { messageId: 'LOOKUP-1', status: { id: 0, label: 'DS_DELIVERED' } } });

    const res = await app.inject({ method: 'GET', url: '/api/v1/immunizations/reminders/status/LOOKUP-1', headers: auth(staff.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.found).toBe(true);
    // The dispatch record must not be confused with a delivery-callback record
    // (which shares the message id) — dispatch has channel/to/note fields.
    expect(body.dispatch.messageId).toBe('LOOKUP-1');
    expect(body.dispatch.channel).toBe('SMS');
    expect(body.deliveries.length).toBeGreaterThanOrEqual(1);
    expect(body.deliveries[0].statusLabel).toBe('DS_DELIVERED');
  });

  it('requires report/audit permission for the status and report endpoints', async () => {
    const limited = await makeUser({ email: 'status-limited@demo.gh', roleCode: 'HOSPITAL_ADMIN', facilityId, permissions: ['view_patient'] });
    const report = await app.inject({ method: 'GET', url: '/api/v1/immunizations/reminders/report', headers: auth(limited.token) });
    expect(report.statusCode).toBe(403);
    const status = await app.inject({ method: 'GET', url: '/api/v1/immunizations/reminders/status/LOOKUP-1', headers: auth(limited.token) });
    expect(status.statusCode).toBe(403);
  });

  it('reports dispatch outcomes and delivery statuses from the audit trail', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/immunizations/reminders/report?days=90', headers: auth(staff.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.totals.attempted).toBeGreaterThan(0);
    expect(typeof body.totals.dispatched).toBe('number');
    expect(body.byProvider.smsonlinegh).toBeGreaterThan(0);
    expect(body.recent.length).toBeGreaterThan(0);
  });
});

describe('WhatsApp reminder dispatch (SMSOnlineGH)', () => {
  const saved = {
    provider: process.env.WHATSAPP_PROVIDER,
    key: process.env.SMSONLINEGH_API_KEY,
    sender: process.env.SMSONLINEGH_SENDER_ID,
    fetch: globalThis.fetch,
  };

  afterEach(() => {
    for (const [k, v] of Object.entries({ WHATSAPP_PROVIDER: saved.provider, SMSONLINEGH_API_KEY: saved.key, SMSONLINEGH_SENDER_ID: saved.sender })) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v as string;
    }
    globalThis.fetch = saved.fetch;
  });

  it('dispatches over WhatsApp via SMSOnlineGH when configured', async () => {
    process.env.WHATSAPP_PROVIDER = 'smsonlinegh';
    process.env.SMSONLINEGH_API_KEY = 'test-key';
    process.env.SMSONLINEGH_SENDER_ID = 'GIHM-HIS';
    let captured: { url: string; init?: { headers?: Record<string, string>; body?: string } } | undefined;
    globalThis.fetch = (async (input: unknown, init?: { headers?: Record<string, string>; body?: string }) => {
      captured = { url: String(input), init };
      return new Response(JSON.stringify({ handshake: { id: 0, label: 'HSHK_OK' }, data: { batch: 'WA-SOGH-1', delivery: false, destinations: [{ to: '233244000000', id: 'wa-dest-1', status: { id: 0, label: 'DS_ACCEPTED' } }] } }), { status: 200, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;

    const patient = await makePatientWithPhone('SOGH WA Child (synthetic)', 60, '0244000000');
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1' },
    });
    const id = created.json().immunization.id as string;
    const res = await app.inject({ method: 'POST', url: `/api/v1/immunizations/${id}/remind`, headers: auth(staff.token), payload: { channel: 'WHATSAPP' } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.channel).toBe('WHATSAPP');
    expect(body.dispatched).toBe(true);
    expect(body.provider).toBe('smsonlinegh');
    expect(body.messageId).toBe('WA-SOGH-1');
    expect(captured?.url).toContain('/v5/message/whatsapp/send');
    expect(captured?.init?.headers?.Authorization).toBe('key test-key');
  });

  it('falls back to audit-only when smsonlinegh WhatsApp is not configured', async () => {
    process.env.WHATSAPP_PROVIDER = 'smsonlinegh';
    delete process.env.SMSONLINEGH_API_KEY;
    const patient = await makePatientWithPhone('SOGH WA Off Child (synthetic)', 60, '0244000000');
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'PENTA', dose: '1' },
    });
    const id = created.json().immunization.id as string;
    const res = await app.inject({ method: 'POST', url: `/api/v1/immunizations/${id}/remind`, headers: auth(staff.token), payload: { channel: 'WHATSAPP' } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.dispatched).toBe(false);
    expect(body.provider).toBe('none');
    expect(body.note).toContain('not connected');
  });
});

describe('immunization scope enforcement', () => {
  it('hides another facility\'s immunizations from a facility user', async () => {
    const other = await makeFacility('Other Immunization Facility (synthetic)');
    const otherUser = await makeUser({ email: 'immunization-other@demo.gh', roleCode: 'HOSPITAL_ADMIN', facilityId: other.id, permissions: PERMS });
    const patient = await makePatient('Cross Facility Child (synthetic)', 60);
    await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(staff.token),
      payload: { patientId: patient.id, vaccine: 'BCG', dose: '0' },
    });

    const due = await app.inject({ method: 'GET', url: '/api/v1/immunizations/due?q=Cross%20Facility', headers: auth(otherUser.token) });
    expect(due.statusCode).toBe(200);
    expect(due.json().items.length).toBe(0);

    const registry = await app.inject({ method: 'GET', url: `/api/v1/immunizations?patientId=${patient.id}`, headers: auth(otherUser.token) });
    expect(registry.statusCode).toBe(200);
    expect(registry.json().items.length).toBe(0);

    // Writing to an out-of-scope patient is denied.
    const write = await app.inject({
      method: 'POST',
      url: '/api/v1/immunizations',
      headers: auth(otherUser.token),
      payload: { patientId: patient.id, vaccine: 'OPV', dose: '0' },
    });
    expect(write.statusCode).toBe(403);
  });
});
