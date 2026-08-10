import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser, makeFacility } from './helpers.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;
let staff: { token: string };
let facilityId: string;

const PERMS = ['view_patient', 'create_patient', 'view_clinical_record', 'write_clinical_note'];

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
    expect(daysBetween(body.immunization.nextDueAt, dob)).toBe(70);
    expect(daysBetween(body.immunization.nextDueAt, new Date())).toBe(10);
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

describe('reminder recalls (dispatch stub)', () => {
  it('logs a reminder to the audit trail for a due dose', async () => {
    const patient = await makePatient('Remind Child (synthetic)', 60);
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
    expect(body.note).toContain('not connected');

    const audit = await db.auditLog.findFirst({ where: { action: 'immunization.remind', entityId: id } });
    expect(audit).toBeTruthy();
    expect(audit?.after).toContain('"channel":"SMS"');
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
