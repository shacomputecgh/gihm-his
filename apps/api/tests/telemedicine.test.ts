import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser, makeFacility } from './helpers.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;
let staff: { token: string };
let facilityId: string;

const PERMS = ['view_patient', 'create_patient', 'write_clinical_note', 'view_clinical_record'];

beforeAll(async () => {
  app = await createTestApp();
  const facility = await makeFacility('Telemedicine Test Facility (synthetic)');
  facilityId = facility.id;
  staff = await makeUser({ email: 'telemedicine-staff@demo.gh', roleCode: 'HOSPITAL_ADMIN', facilityId, permissions: PERMS });
});

afterAll(async () => {
  await db.$disconnect();
  await app.close();
});

const auth = (t: string) => ({ authorization: `Bearer ${t}` });

async function makePatient(name = 'Telemedicine Patient (synthetic)') {
  const res = await app.inject({ method: 'POST', url: '/api/v1/patients', headers: auth(staff.token), payload: { fullName: name, force: true } });
  expect(res.statusCode).toBe(200);
  return (res.json().patient as { id: string }).id;
}

async function bookTeleconsultation(patientId: string, payload: Record<string, unknown> = {}) {
  const res = await app.inject({
    method: 'POST',
    url: `/api/v1/patients/${patientId}/teleconsultations`,
    headers: auth(staff.token),
    payload: { scheduledFor: new Date(Date.now() + 24 * 3600 * 1000).toISOString(), ...payload },
  });
  return res;
}

describe('telemedicine (spec §82–83, docs/13 §9 — consultation lifecycle)', () => {
  it('books a teleconsultation with mode normalization and facility stamping', async () => {
    const patientId = await makePatient();
    const res = await bookTeleconsultation(patientId, { mode: 'phone', notes: 'Review of hypertension medication' });
    expect(res.statusCode).toBe(200);
    const consultation = res.json().consultation;
    expect(consultation.status).toBe('SCHEDULED');
    expect(consultation.mode).toBe('PHONE');
    expect(consultation.facilityId).toBe(facilityId);
    expect(consultation.patientId).toBe(patientId);
    expect(consultation.notes).toBe('Review of hypertension medication');

    const list = await app.inject({ method: 'GET', url: `/api/v1/patients/${patientId}/teleconsultations`, headers: auth(staff.token) });
    expect(list.statusCode).toBe(200);
    expect(list.json().count).toBe(1);
  });

  it('rejects invalid modes, missing schedule, and unknown clinician ids', async () => {
    const patientId = await makePatient('Telemedicine Invalid (synthetic)');
    const badMode = await bookTeleconsultation(patientId, { mode: 'HOLOGRAM' });
    expect(badMode.statusCode).toBe(400);
    const noSchedule = await app.inject({ method: 'POST', url: `/api/v1/patients/${patientId}/teleconsultations`, headers: auth(staff.token), payload: {} });
    expect(noSchedule.statusCode).toBe(400);
    const badClinician = await bookTeleconsultation(patientId, { clinicianId: 'no-such-user' });
    expect(badClinician.statusCode).toBe(400);
  });

  it('walks the lifecycle SCHEDULED → IN_PROGRESS → COMPLETED with timestamps', async () => {
    const patientId = await makePatient('Telemedicine Lifecycle (synthetic)');
    const booked = await bookTeleconsultation(patientId);
    const id = booked.json().consultation.id;

    const start = await app.inject({ method: 'PATCH', url: `/api/v1/teleconsultations/${id}`, headers: auth(staff.token), payload: { status: 'IN_PROGRESS', joinUrl: 'https://meet.example/abc' } });
    expect(start.statusCode).toBe(200);
    expect(start.json().consultation.status).toBe('IN_PROGRESS');
    expect(start.json().consultation.startedAt).toBeTruthy();
    expect(start.json().consultation.joinUrl).toBe('https://meet.example/abc');

    const complete = await app.inject({ method: 'PATCH', url: `/api/v1/teleconsultations/${id}`, headers: auth(staff.token), payload: { status: 'COMPLETED', outcome: 'Reviewed lab results; escalated to regional specialist' } });
    expect(complete.statusCode).toBe(200);
    const done = complete.json().consultation;
    expect(done.status).toBe('COMPLETED');
    expect(done.endedAt).toBeTruthy();
    expect(done.outcome).toBe('Reviewed lab results; escalated to regional specialist');
  });

  it('rejects illegal transitions (e.g. SCHEDULED → COMPLETED)', async () => {
    const patientId = await makePatient('Telemedicine Transition (synthetic)');
    const booked = await bookTeleconsultation(patientId);
    const id = booked.json().consultation.id;
    const res = await app.inject({ method: 'PATCH', url: `/api/v1/teleconsultations/${id}`, headers: auth(staff.token), payload: { status: 'COMPLETED' } });
    expect(res.statusCode).toBe(409);

    const cancel = await app.inject({ method: 'PATCH', url: `/api/v1/teleconsultations/${id}`, headers: auth(staff.token), payload: { status: 'CANCELLED' } });
    expect(cancel.statusCode).toBe(200);
    // A cancelled consultation cannot be started.
    const after = await app.inject({ method: 'PATCH', url: `/api/v1/teleconsultations/${id}`, headers: auth(staff.token), payload: { status: 'IN_PROGRESS' } });
    expect(after.statusCode).toBe(409);
  });

  it('surfaces a scope-aware clinician worklist', async () => {
    const patientId = await makePatient('Telemedicine Worklist (synthetic)');
    await bookTeleconsultation(patientId);

    const clinician = await makeUser({ email: 'telemedicine-clinician@demo.gh', roleCode: 'DOCTOR', facilityId, permissions: PERMS });
    const list = await app.inject({ method: 'GET', url: '/api/v1/teleconsultations', headers: auth(clinician.token) });
    expect(list.statusCode).toBe(200);
    expect(list.json().count).toBeGreaterThanOrEqual(1);
    expect(list.json().items.some((c: { patientId: string }) => c.patientId === patientId)).toBe(true);

    const filtered = await app.inject({ method: 'GET', url: '/api/v1/teleconsultations?status=IN_PROGRESS', headers: auth(clinician.token) });
    expect(filtered.json().items.every((c: { status: string }) => c.status === 'IN_PROGRESS')).toBe(true);
  });

  it('lets the assigned clinician transition their own consultation and denies other facilities', async () => {
    const patientId = await makePatient('Telemedicine Assignee (synthetic)');
    const clinician = await makeUser({ email: 'telemedicine-assignee@demo.gh', roleCode: 'DOCTOR', facilityId, permissions: PERMS });
    const booked = await bookTeleconsultation(patientId, { clinicianId: clinician.userId });
    const id = booked.json().consultation.id;

    const start = await app.inject({ method: 'PATCH', url: `/api/v1/teleconsultations/${id}`, headers: auth(clinician.token), payload: { status: 'IN_PROGRESS' } });
    expect(start.statusCode).toBe(200);

    // A staff user from another facility cannot touch this patient's consultation.
    const otherFacility = await makeFacility('Telemedicine Other Facility (synthetic)');
    const other = await makeUser({ email: 'telemedicine-other@demo.gh', roleCode: 'HOSPITAL_ADMIN', facilityId: otherFacility.id, permissions: PERMS });
    const denied = await app.inject({ method: 'PATCH', url: `/api/v1/teleconsultations/${id}`, headers: auth(other.token), payload: { status: 'COMPLETED' } });
    expect(denied.statusCode).toBe(403);
  });
});
