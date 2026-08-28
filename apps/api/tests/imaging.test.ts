import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser, makeFacility, type TestUser } from './helpers.js';
import type { FastifyInstance } from 'fastify';

// ---------------------------------------------------------------------------
// Imaging & radiology (spec §24, docs/13 §10): order → study → radiologist
// report, with the same discipline as the lab (order_lab/verify_lab family —
// here order_imaging/verify_imaging). Tests assert ordering, the scoped
// worklist, report verification, legal transitions and access control.
// ---------------------------------------------------------------------------

let app: FastifyInstance;
let doctor: TestUser;
let radiologist: TestUser;
let facilityId: string;
let patientId: string;
let encounterId: string;

const DOCTOR_PERMS = ['view_patient', 'create_patient', 'view_clinical_record', 'write_clinical_note', 'order_imaging', 'view_queue', 'view_dashboard'];
const RADIOLOGIST_PERMS = ['view_patient', 'view_clinical_record', 'order_imaging', 'verify_imaging', 'view_queue', 'view_dashboard'];

beforeAll(async () => {
  app = await createTestApp();
  const facility = await makeFacility('Imaging Test Facility (synthetic)');
  facilityId = facility.id;
  doctor = await makeUser({ email: 'imaging-doctor@demo.gh', roleCode: 'DOCTOR', facilityId, permissions: DOCTOR_PERMS });
  radiologist = await makeUser({ email: 'imaging-radiologist@demo.gh', roleCode: 'RADIOLOGIST', facilityId, permissions: RADIOLOGIST_PERMS });

  const patient = await app.inject({ method: 'POST', url: '/api/v1/patients', headers: auth(doctor.token), payload: { fullName: 'Imaging Patient (synthetic)', force: true } });
  patientId = (patient.json().patient as { id: string }).id;
  const enc = await app.inject({ method: 'POST', url: `/api/v1/patients/${patientId}/encounters`, headers: auth(doctor.token), payload: { type: 'OPD', presentingComplaint: 'Chest pain' } });
  encounterId = (enc.json().encounter as { id: string }).id;
});

afterAll(async () => {
  await db.imagingOrder.deleteMany({ where: { patientId } });
  await db.encounter.deleteMany({ where: { patientId } });
  await db.patient.deleteMany({ where: { id: patientId } });
  await db.$disconnect();
  await app.close();
});

const auth = (t: string) => ({ authorization: `Bearer ${t}` });

describe('imaging & radiology (spec §24 — order, study, report)', () => {
  it('orders an imaging study with modality normalization and facility stamping', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/patients/${patientId}/imaging-orders`,
      headers: auth(doctor.token),
      payload: { encounterId, modality: 'x_ray', bodyPart: 'Chest', clinicalQuestion: 'Rule out pneumonia' },
    });
    expect(res.statusCode).toBe(200);
    const order = res.json().order;
    expect(order.status).toBe('ORDERED');
    expect(order.modality).toBe('X_RAY');
    expect(order.bodyPart).toBe('Chest');
    expect(order.facilityId).toBe(facilityId);
    expect(order.patientId).toBe(patientId);
    expect(order.requestedById).toBe(doctor.userId);

    const list = await app.inject({ method: 'GET', url: `/api/v1/patients/${patientId}/imaging-orders`, headers: auth(doctor.token) });
    expect(list.statusCode).toBe(200);
    expect(list.json().count).toBe(1);
  });

  it('rejects an invalid modality and a foreign encounter', async () => {
    const badModality = await app.inject({
      method: 'POST',
      url: `/api/v1/patients/${patientId}/imaging-orders`,
      headers: auth(doctor.token),
      payload: { encounterId, modality: 'PET_SCAN' },
    });
    expect(badModality.statusCode).toBe(400);
    const foreignEncounter = await app.inject({ method: 'POST', url: '/api/v1/patients', headers: auth(doctor.token), payload: { fullName: 'Imaging Foreign (synthetic)', force: true } });
    const foreignPatientId = (foreignEncounter.json().patient as { id: string }).id;
    const foreign = await app.inject({
      method: 'POST',
      url: `/api/v1/patients/${foreignPatientId}/imaging-orders`,
      headers: auth(doctor.token),
      payload: { encounterId, modality: 'X_RAY' },
    });
    expect(foreign.statusCode).toBe(404);
    await db.patient.deleteMany({ where: { id: foreignPatientId } });
  });

  it('walks the lifecycle ORDERED → IN_PROGRESS → REPORTED → VERIFIED with the radiologist report', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/patients/${patientId}/imaging-orders`,
      headers: auth(doctor.token),
      payload: { encounterId, modality: 'ULTRASOUND', bodyPart: 'Abdomen' },
    });
    const orderId = res.json().order.id;

    const start = await app.inject({ method: 'PATCH', url: `/api/v1/patients/${patientId}/imaging-orders/${orderId}`, headers: auth(radiologist.token), payload: { status: 'IN_PROGRESS' } });
    expect(start.statusCode).toBe(200);
    expect(start.json().order.status).toBe('IN_PROGRESS');

    // The radiologist can report directly from the scoped worklist.
    const worklist = await app.inject({ method: 'GET', url: '/api/v1/imaging/orders', headers: auth(radiologist.token) });
    expect(worklist.statusCode).toBe(200);
    expect(worklist.json().items.some((o: { id: string }) => o.id === orderId)).toBe(true);

    const report = await app.inject({
      method: 'POST',
      url: `/api/v1/imaging/orders/${orderId}/report`,
      headers: auth(radiologist.token),
      payload: { report: 'Mild hepatomegaly; no focal lesions.', impression: 'Benign findings' },
    });
    expect(report.statusCode).toBe(200);
    const done = report.json().order;
    expect(done.status).toBe('VERIFIED');
    expect(done.report).toContain('Mild hepatomegaly');
    expect(done.impression).toBe('Benign findings');
    expect(done.reportedById).toBe(radiologist.userId);

    // Illegal transitions after VERIFIED.
    const reopen = await app.inject({ method: 'PATCH', url: `/api/v1/patients/${patientId}/imaging-orders/${orderId}`, headers: auth(radiologist.token), payload: { status: 'IN_PROGRESS' } });
    expect(reopen.statusCode).toBe(409);
  });

  it('allows cancellation before verification but never reports a cancelled order', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/patients/${patientId}/imaging-orders`,
      headers: auth(doctor.token),
      payload: { encounterId, modality: 'CT', bodyPart: 'Head' },
    });
    const orderId = res.json().order.id;
    const cancel = await app.inject({ method: 'PATCH', url: `/api/v1/patients/${patientId}/imaging-orders/${orderId}`, headers: auth(doctor.token), payload: { status: 'CANCELLED' } });
    expect(cancel.statusCode).toBe(200);
    expect(cancel.json().order.status).toBe('CANCELLED');

    const report = await app.inject({
      method: 'POST',
      url: `/api/v1/patients/${patientId}/imaging-orders/${orderId}/report`,
      headers: auth(radiologist.token),
      payload: { report: 'Should never land' },
    });
    expect(report.statusCode).toBe(409);
  });

  it('denies a staff user from another facility and a user without the permission', async () => {
    const otherFacility = await makeFacility('Imaging Other Facility (synthetic)');
    const other = await makeUser({ email: 'imaging-other@demo.gh', roleCode: 'HOSPITAL_ADMIN', facilityId: otherFacility.id, permissions: DOCTOR_PERMS });
    const denied = await app.inject({
      method: 'POST',
      url: `/api/v1/patients/${patientId}/imaging-orders`,
      headers: auth(other.token),
      payload: { encounterId, modality: 'X_RAY' },
    });
    expect(denied.statusCode).toBe(403);

    const nurse = await makeUser({ email: 'imaging-nurse@demo.gh', roleCode: 'NURSE', facilityId, permissions: ['view_patient', 'write_clinical_note'] });
    const forbidden = await app.inject({
      method: 'POST',
      url: `/api/v1/patients/${patientId}/imaging-orders`,
      headers: auth(nurse.token),
      payload: { encounterId, modality: 'X_RAY' },
    });
    expect(forbidden.statusCode).toBe(403);
  });
});
