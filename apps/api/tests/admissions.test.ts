import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { db, createTestApp, makeUser, makeFacility, type TestUser } from './helpers.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;
let doctor: TestUser; // can admit at facility A
let outsider: TestUser; // can admit but at facility B
let viewer: TestUser; // read-only (no write_clinical_note)
let facilityA: Awaited<ReturnType<typeof makeFacility>>;
let facilityB: Awaited<ReturnType<typeof makeFacility>>;
let patientA: { id: string; mrn: string };
let patientB: { id: string; mrn: string };
const createdPatientIds: string[] = [];

const auth = (u: TestUser) => ({ authorization: `Bearer ${u.token}` });

async function makePatient(name: string, as: TestUser) {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/patients',
    headers: auth(as),
    payload: { fullName: name, dateOfBirth: '1990-05-10', phone: `0244${String(Math.floor(Math.random() * 9000000) + 1000000)}`, force: true },
  });
  expect(res.statusCode).toBe(200);
  const patient = res.json().patient as { id: string; mrn: string };
  createdPatientIds.push(patient.id);
  return patient;
}

const admitPayload = (over: Record<string, unknown> = {}) => ({
  facilityId: facilityA.id,
  admission: { type: 'MEDICAL', source: 'HOME', chiefComplaint: 'Abdominal pain', provisionalDiagnosis: 'Gastritis', ward: 'Male Medical Ward', bed: 'M-01' },
  vitals: { temperature: 37.2, pulse: 82, respiratoryRate: 18, systolicBp: 120, diastolicBp: 78, spo2: 98, weightKg: 70, heightCm: 172 },
  consentSigned: true,
  ...over,
});

beforeAll(async () => {
  app = await createTestApp();
  facilityA = await makeFacility('Admissions Facility A (synthetic)');
  facilityB = await makeFacility('Admissions Facility B (synthetic)');
  doctor = await makeUser({ email: 'adm-doctor@demo.gh', roleCode: 'DOCTOR', facilityId: facilityA.id, permissions: ['write_clinical_note', 'view_clinical_record', 'view_patient', 'create_patient'] });
  outsider = await makeUser({ email: 'adm-outsider@demo.gh', roleCode: 'DOCTOR', facilityId: facilityB.id, permissions: ['write_clinical_note', 'view_clinical_record', 'view_patient', 'create_patient'] });
  viewer = await makeUser({ email: 'adm-viewer@demo.gh', roleCode: 'HEALTH_INFO_OFFICER', facilityId: facilityA.id, permissions: ['view_clinical_record', 'view_patient'] });
  patientA = await makePatient('Admissions Patient A (synthetic)', doctor);
  patientB = await makePatient('Admissions Patient B (synthetic)', outsider);
});

afterAll(async () => {
  const userIds = [doctor.userId, outsider.userId, viewer.userId];
  const roleIds = (await db.user.findMany({ where: { id: { in: userIds } }, select: { roleId: true } })).map((u) => u.roleId);
  await db.admission.deleteMany({ where: { facilityId: { in: [facilityA.id, facilityB.id] } } });
  const allPatientIds = [patientA.id, patientB.id, ...createdPatientIds];
  await db.patientIdentifier.deleteMany({ where: { patientId: { in: allPatientIds } } });
  await db.patientContact.deleteMany({ where: { patientId: { in: allPatientIds } } });
  await db.patient.deleteMany({ where: { id: { in: allPatientIds } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.role.deleteMany({ where: { id: { in: roleIds } } });
  await db.facility.deleteMany({ where: { id: { in: [facilityA.id, facilityB.id] } } });
  await app.close();
});

describe('admission permissions', () => {
  it('denies admitting without write_clinical_note (403 for a read-only viewer)', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/admissions', headers: auth(viewer), payload: admitPayload({ patientId: patientA.id }) });
    expect(res.statusCode).toBe(403);
  });

  it('lets a viewer read the register', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/admissions', headers: auth(viewer) });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().items)).toBe(true);
  });
});

describe('admitting patients', () => {
  let admissionId: string;

  it('admits an existing patient with the full form (number, vitals, consent)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admissions',
      headers: auth(doctor),
      payload: admitPayload({
        patientId: patientA.id,
        admission: { type: 'EMERGENCY', source: 'AMBULANCE', chiefComplaint: 'Chest pain', provisionalDiagnosis: 'ACS — rule out', ward: 'Male Medical Ward', bed: 'M-01', nurseReceiving: 'Nurse Ama', consultantId: doctor.userId },
      }),
    });
    expect(res.statusCode).toBe(200);
    const a = res.json().admission;
    expect(a.admissionNumber).toMatch(/^ADM-\d{4}-\d{4}$/);
    expect(a.status).toBe('ADMITTED');
    expect(a.admissionType).toBe('EMERGENCY');
    expect(a.consultant?.id).toBe(doctor.userId);
    expect(a.vitals.temperature).toBe(37.2);
    expect(a.vitals.spo2).toBe(98);
    expect(a.consentSigned).toBe(true);
    expect(a.patient?.id).toBe(patientA.id);
    admissionId = a.id as string;

    const audit = await db.auditLog.findFirst({ where: { action: 'admission.create', entityId: admissionId } });
    expect(audit?.after).toContain('"admissionNumber"');
  });

  it('validates facility scope, types and vitals', async () => {
    // A facility-A doctor cannot admit at facility B.
    const wrongFacility = await app.inject({ method: 'POST', url: '/api/v1/admissions', headers: auth(doctor), payload: admitPayload({ facilityId: facilityB.id, patientId: patientA.id }) });
    expect(wrongFacility.statusCode).toBe(403);

    // Unknown patient id is a 404.
    const ghost = await app.inject({ method: 'POST', url: '/api/v1/admissions', headers: auth(doctor), payload: admitPayload({ patientId: 'no-such-patient' }) });
    expect(ghost.statusCode).toBe(404);

    // Invalid admission type / payment method / vitals are loud 400s.
    const badType = await app.inject({ method: 'POST', url: '/api/v1/admissions', headers: auth(doctor), payload: admitPayload({ patientId: patientA.id, admission: { type: 'WALKIN' } }) });
    expect(badType.statusCode).toBe(400);
    const badVitals = await app.inject({ method: 'POST', url: '/api/v1/admissions', headers: auth(doctor), payload: admitPayload({ patientId: patientA.id, vitals: { temperature: 52 } }) });
    expect(badVitals.statusCode).toBe(400);
    const noFacility = await app.inject({ method: 'POST', url: '/api/v1/admissions', headers: auth(doctor), payload: admitPayload({ facilityId: undefined }) });
    expect(noFacility.statusCode).toBe(400);
  });

  it('registers a new patient inline with MPI duplicate detection', async () => {
    const payload = (force: boolean) =>
      admitPayload({
        patient: { fullName: 'Inline Admission Patient (synthetic)', dateOfBirth: '1985-03-12', sex: 'F', phone: '0244777666', ghanaCard: 'GHA-INLINE-1', nhisNumber: 'NHIS-INLINE-1', patientType: 'GHANAIAN', bloodGroup: 'O+', allergies: ['Penicillin'], previousConditions: ['Hypertension'], force },
      });

    const first = await app.inject({ method: 'POST', url: '/api/v1/admissions', headers: auth(doctor), payload: payload(false) });
    expect(first.statusCode).toBe(200);
    const firstAdmission = first.json().admission;
    createdPatientIds.push(firstAdmission.patient.id as string);
    expect(firstAdmission.patient.fullName).toBe('Inline Admission Patient (synthetic)');
    expect(firstAdmission.patient.mrn).toMatch(/^GH-/);

    // A repeat registration is flagged as a duplicate for review (409 + candidates).
    const dup = await app.inject({ method: 'POST', url: '/api/v1/admissions', headers: auth(doctor), payload: payload(false) });
    expect(dup.statusCode).toBe(409);
    expect(dup.json().error.code).toBe('MPI_DUPLICATE');
    expect(dup.json().error.candidates.length).toBeGreaterThanOrEqual(1);

    // Force admits anyway after review.
    const forced = await app.inject({ method: 'POST', url: '/api/v1/admissions', headers: auth(doctor), payload: payload(true) });
    expect(forced.statusCode).toBe(200);
    createdPatientIds.push(forced.json().admission.patient.id as string);
  });

  it('admits in emergency mode with identification pending', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admissions',
      headers: auth(doctor),
      payload: admitPayload({ emergency: true, patient: { phone: '+233244123456', sex: 'M' }, admission: { type: 'EMERGENCY', source: 'EMERGENCY_DEPT', ward: 'Emergency Ward', bed: 'E-01' } }),
    });
    expect(res.statusCode).toBe(200);
    const a = res.json().admission;
    expect(a.identificationPending).toBe(true);
    expect(a.patient.fullName).toContain('Identification Pending');
    createdPatientIds.push(a.patient.id as string);
  });

  it('never blocks a second unknown-identity emergency admission on MPI', async () => {
    // Two unidentified patients with the same phone — the default pending-ID
    // name would match, but emergency care must not wait for identification.
    const first = await app.inject({
      method: 'POST',
      url: '/api/v1/admissions',
      headers: auth(doctor),
      payload: admitPayload({ emergency: true, patient: { phone: '+233244111222', sex: 'F' }, admission: { type: 'EMERGENCY', source: 'AMBULANCE', ward: 'Emergency Ward', bed: 'E-02' } }),
    });
    expect(first.statusCode).toBe(200);
    createdPatientIds.push(first.json().admission.patient.id as string);
    const second = await app.inject({
      method: 'POST',
      url: '/api/v1/admissions',
      headers: auth(doctor),
      payload: admitPayload({ emergency: true, patient: { phone: '+233244111222', sex: 'F' }, admission: { type: 'EMERGENCY', source: 'AMBULANCE', ward: 'Emergency Ward', bed: 'E-03' } }),
    });
    expect(second.statusCode).toBe(200);
    createdPatientIds.push(second.json().admission.patient.id as string);
  });

  it('refuses to admit a patient registered at another facility (403)', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/admissions', headers: auth(doctor), payload: admitPayload({ patientId: patientB.id }) });
    expect(res.statusCode).toBe(403);
  });

  it('scopes the register, filters and detail to the caller geography', async () => {
    const list = await app.inject({ method: 'GET', url: '/api/v1/admissions', headers: auth(outsider) });
    expect(list.statusCode).toBe(200);
    const ids = list.json().items as Array<{ id: string }>;
    expect(ids.some((a) => a.id === admissionId)).toBe(false);

    // The facilityId filter cannot widen scope.
    const widen = await app.inject({ method: 'GET', url: `/api/v1/admissions?facilityId=${facilityA.id}`, headers: auth(outsider) });
    expect(widen.statusCode).toBe(403);

    // Out-of-scope detail is a 404, not a leak.
    const detail = await app.inject({ method: 'GET', url: `/api/v1/admissions/${admissionId}`, headers: auth(outsider) });
    expect(detail.statusCode).toBe(404);

    // Invalid filters fail loudly.
    const badStatus = await app.inject({ method: 'GET', url: '/api/v1/admissions?status=GHOSTED', headers: auth(doctor) });
    expect(badStatus.statusCode).toBe(400);
    const badDate = await app.inject({ method: 'GET', url: '/api/v1/admissions?from=not-a-date', headers: auth(doctor) });
    expect(badDate.statusCode).toBe(400);
  });
});

describe('discharge and transfer lifecycle', () => {
  let admissionId: string;

  beforeAll(async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/admissions', headers: auth(doctor), payload: admitPayload({ patientId: patientA.id }) });
    admissionId = res.json().admission.id as string;
  });

  it('transfers an admitted patient and records history', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admissions/${admissionId}/transfer`,
      headers: auth(doctor),
      payload: { ward: 'Surgical Ward', bed: 'S-05', note: 'Bed availability' },
    });
    expect(res.statusCode).toBe(200);
    const a = res.json().admission;
    expect(a.ward).toBe('Surgical Ward');
    expect(a.transferHistory).toHaveLength(1);
    expect(a.transferHistory[0].fromWard).toBe('Male Medical Ward');
    expect(a.transferHistory[0].toBed).toBe('S-05');

    const audit = await db.auditLog.findFirst({ where: { action: 'admission.transfer', entityId: admissionId } });
    expect(audit?.after).toContain('"toWard":"Surgical Ward"');
  });

  it('requires a destination for transfer and a summary for discharge', async () => {
    const noDest = await app.inject({ method: 'POST', url: `/api/v1/admissions/${admissionId}/transfer`, headers: auth(doctor), payload: { note: 'no destination' } });
    expect(noDest.statusCode).toBe(400);

    const noSummary = await app.inject({ method: 'POST', url: `/api/v1/admissions/${admissionId}/discharge`, headers: auth(doctor), payload: { summary: 'short' } });
    expect(noSummary.statusCode).toBe(400);

    const discharged = await app.inject({
      method: 'POST',
      url: `/api/v1/admissions/${admissionId}/discharge`,
      headers: auth(doctor),
      payload: { summary: 'Condition improved; discharged on follow-up plan with review in 2 weeks.', note: 'Home discharge' },
    });
    expect(discharged.statusCode).toBe(200);
    expect(discharged.json().admission.status).toBe('DISCHARGED');
    expect(discharged.json().admission.dischargedAt).toBeTruthy();

    // Terminal: no double discharge, no transfer of a discharged patient.
    const again = await app.inject({ method: 'POST', url: `/api/v1/admissions/${admissionId}/discharge`, headers: auth(doctor), payload: { summary: 'x'.repeat(20) } });
    expect(again.statusCode).toBe(409);
    const transferDischarged = await app.inject({ method: 'POST', url: `/api/v1/admissions/${admissionId}/transfer`, headers: auth(doctor), payload: { ward: 'X Ward' } });
    expect(transferDischarged.statusCode).toBe(400);
  });
});
