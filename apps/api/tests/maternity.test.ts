import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser, makeFacility } from './helpers.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;
let staff: { token: string };
let facilityId: string;

const PERMS = ['view_patient', 'create_patient', 'write_clinical_note', 'view_clinical_record'];

beforeAll(async () => {
  app = await createTestApp();
  const facility = await makeFacility('Maternity Test Facility (synthetic)');
  facilityId = facility.id;
  staff = await makeUser({ email: 'maternity-staff@demo.gh', roleCode: 'HOSPITAL_ADMIN', facilityId, permissions: PERMS });
});

afterAll(async () => {
  await db.$disconnect();
  await app.close();
});

const auth = (t: string) => ({ authorization: `Bearer ${t}` });

async function makePatient(name = 'Maternity Patient (synthetic)') {
  const res = await app.inject({ method: 'POST', url: '/api/v1/patients', headers: auth(staff.token), payload: { fullName: name, force: true } });
  expect(res.statusCode).toBe(200);
  return (res.json().patient as { id: string }).id;
}

describe('maternity (spec §20 — ANC, delivery, postnatal)', () => {
  it('records antenatal visits with auto visit numbers and enum normalization', async () => {
    const patientId = await makePatient();
    const first = await app.inject({
      method: 'POST',
      url: `/api/v1/patients/${patientId}/antenatal`,
      headers: auth(staff.token),
      payload: { gaWeeks: 12, weightKg: 58, systolicBp: 110, diastolicBp: 70, fetalHeartRate: 140, riskAssessment: 'low' },
    });
    expect(first.statusCode).toBe(200);
    const v1 = first.json().visit;
    expect(v1.visitNumber).toBe(1);
    expect(v1.riskAssessment).toBe('LOW');
    expect(v1.facilityId).toBe(facilityId);

    const second = await app.inject({
      method: 'POST',
      url: `/api/v1/patients/${patientId}/antenatal`,
      headers: auth(staff.token),
      payload: { gaWeeks: 20, riskAssessment: 'HIGH', supplements: 'Iron + folic acid' },
    });
    expect(second.statusCode).toBe(200);
    expect(second.json().visit.visitNumber).toBe(2);

    const list = await app.inject({ method: 'GET', url: `/api/v1/patients/${patientId}/antenatal`, headers: auth(staff.token) });
    expect(list.statusCode).toBe(200);
    expect(list.json().items).toHaveLength(2);
  });

  it('rejects invalid risk levels and statuses', async () => {
    const patientId = await makePatient('Maternity Enum Patient (synthetic)');
    const badRisk = await app.inject({ method: 'POST', url: `/api/v1/patients/${patientId}/antenatal`, headers: auth(staff.token), payload: { riskAssessment: 'EXTREME' } });
    expect(badRisk.statusCode).toBe(400);
    const badStatus = await app.inject({ method: 'POST', url: `/api/v1/patients/${patientId}/antenatal`, headers: auth(staff.token), payload: { status: 'PAUSED' } });
    expect(badStatus.statusCode).toBe(400);
  });

  it('updates an antenatal visit (risk, status, next visit)', async () => {
    const patientId = await makePatient('Maternity Update Patient (synthetic)');
    const created = await app.inject({ method: 'POST', url: `/api/v1/patients/${patientId}/antenatal`, headers: auth(staff.token), payload: { gaWeeks: 8 } });
    const visitId = created.json().visit.id;
    const patch = await app.inject({ method: 'PATCH', url: `/api/v1/patients/${patientId}/antenatal/${visitId}`, headers: auth(staff.token), payload: { status: 'LOST' } });
    expect(patch.statusCode).toBe(200);
    expect(patch.json().visit.status).toBe('LOST');
    // A visit from another patient is not patchable.
    const other = await makePatient('Maternity Update Other (synthetic)');
    const notFound = await app.inject({ method: 'PATCH', url: `/api/v1/patients/${other}/antenatal/${visitId}`, headers: auth(staff.token), payload: { status: 'LOST' } });
    expect(notFound.statusCode).toBe(404);
  });

  it('records a delivery with APGAR and closes the active ANC', async () => {
    const patientId = await makePatient('Maternity Delivery Patient (synthetic)');
    await app.inject({ method: 'POST', url: `/api/v1/patients/${patientId}/antenatal`, headers: auth(staff.token), payload: { gaWeeks: 38 } });
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/patients/${patientId}/deliveries`,
      headers: auth(staff.token),
      payload: { deliveryType: 'normal', mode: 'VAGINAL', outcome: 'LIVE_BIRTH', birthWeightKg: 3.2, apgar1: 8, apgar5: 9, attendedByName: 'Midwife Efua Acquah' },
    });
    expect(res.statusCode).toBe(200);
    const delivery = res.json().delivery;
    expect(delivery.deliveryType).toBe('NORMAL');
    expect(delivery.mode).toBe('VAGINAL');
    expect(delivery.outcome).toBe('LIVE_BIRTH');
    expect(delivery.apgar1).toBe(8);
    expect(delivery.apgar5).toBe(9);

    // The pregnancy is over: the active ANC visits are closed as DELIVERED.
    const anc = await db.antenatalVisit.findMany({ where: { patientId } });
    expect(anc.length).toBeGreaterThanOrEqual(1);
    expect(anc.every((v) => v.status === 'DELIVERED')).toBe(true);

    const list = await app.inject({ method: 'GET', url: `/api/v1/patients/${patientId}/deliveries`, headers: auth(staff.token) });
    expect(list.json().count).toBe(1);
  });

  it('rejects invalid delivery enums and out-of-range APGAR', async () => {
    const patientId = await makePatient('Maternity Delivery Enum Patient (synthetic)');
    const badType = await app.inject({ method: 'POST', url: `/api/v1/patients/${patientId}/deliveries`, headers: auth(staff.token), payload: { deliveryType: 'HOME' } });
    expect(badType.statusCode).toBe(400);
    const badApgar = await app.inject({ method: 'POST', url: `/api/v1/patients/${patientId}/deliveries`, headers: auth(staff.token), payload: { apgar1: 11 } });
    expect(badApgar.statusCode).toBe(400);
  });

  it('records postnatal visits with auto visit numbers', async () => {
    const patientId = await makePatient('Maternity Postnatal Patient (synthetic)');
    const first = await app.inject({ method: 'POST', url: `/api/v1/patients/${patientId}/postnatal`, headers: auth(staff.token), payload: { breastfeeding: 'exclusive', maternalReview: 'Recovering well' } });
    expect(first.statusCode).toBe(200);
    expect(first.json().visit.visitNumber).toBe(1);
    expect(first.json().visit.breastfeeding).toBe('EXCLUSIVE');

    const second = await app.inject({ method: 'POST', url: `/api/v1/patients/${patientId}/postnatal`, headers: auth(staff.token), payload: { immunization: 'BCG + OPV0' } });
    expect(second.statusCode).toBe(200);
    expect(second.json().visit.visitNumber).toBe(2);

    const list = await app.inject({ method: 'GET', url: `/api/v1/patients/${patientId}/postnatal`, headers: auth(staff.token) });
    expect(list.json().count).toBe(2);
  });

  it('denies a staff user from another facility', async () => {
    const otherFacility = await makeFacility('Maternity Other Facility (synthetic)');
    const other = await makeUser({ email: 'maternity-other@demo.gh', roleCode: 'HOSPITAL_ADMIN', facilityId: otherFacility.id, permissions: PERMS });
    const patientId = await makePatient('Maternity Scoped Patient (synthetic)');
    const res = await app.inject({ method: 'POST', url: `/api/v1/patients/${patientId}/antenatal`, headers: auth(other.token), payload: { gaWeeks: 10 } });
    expect(res.statusCode).toBe(403);
  });
});

describe('partograph (docs/13 §7 — labour charting)', () => {
  it('starts a partograph and records observations with alert/action line status', async () => {
    const patientId = await makePatient('Partograph Patient (synthetic)');
    const started = await app.inject({ method: 'POST', url: `/api/v1/patients/${patientId}/partographs`, headers: auth(staff.token), payload: { labourStartedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString() } });
    expect(started.statusCode).toBe(200);
    const partographId = started.json().partograph.id;

    // 2h into labour, expected dilation is 6cm: 5cm is on/below the alert line.
    const obs = await app.inject({
      method: 'POST',
      url: `/api/v1/patients/${patientId}/partographs/${partographId}/observations`,
      headers: auth(staff.token),
      payload: { cervicalDilationCm: 5, fetalHeartRateBpm: 148, contractionsPer10Min: 3, observedAt: new Date().toISOString() },
    });
    expect(obs.statusCode).toBe(200);
    const body = obs.json();
    expect(body.observation.cervicalDilationCm).toBe(5);
    expect(body.hoursSinceStart).toBeCloseTo(2, 1);
    expect(body.expectedDilationCm).toBeCloseTo(6, 1);
    expect(body.beyondAlertLine).toBe(true);
    expect(body.beyondActionLine).toBe(false);

    const list = await app.inject({ method: 'GET', url: `/api/v1/patients/${patientId}/partographs/${partographId}/observations`, headers: auth(staff.token) });
    expect(list.statusCode).toBe(200);
    expect(list.json().count).toBe(1);
    expect(list.json().items[0]).toMatchObject({ beyondAlertLine: true, beyondActionLine: false });

    const partographs = await app.inject({ method: 'GET', url: `/api/v1/patients/${patientId}/partographs`, headers: auth(staff.token) });
    expect(partographs.json().count).toBe(1);
    expect(partographs.json().items[0]._count.observations).toBe(1);
  });

  it('flags prolonged labour against the action line', async () => {
    const patientId = await makePatient('Partograph Prolonged (synthetic)');
    const started = await app.inject({ method: 'POST', url: `/api/v1/patients/${patientId}/partographs`, headers: auth(staff.token), payload: { labourStartedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString() } });
    const partographId = started.json().partograph.id;
    // 6h in, expected dilation is 10cm and the action line sits at 6cm: a
    // 5cm dilation has crossed it.
    const obs = await app.inject({
      method: 'POST',
      url: `/api/v1/patients/${patientId}/partographs/${partographId}/observations`,
      headers: auth(staff.token),
      payload: { cervicalDilationCm: 5, observedAt: new Date().toISOString() },
    });
    expect(obs.json().beyondActionLine).toBe(true);
    expect(obs.json().beyondAlertLine).toBe(true);
  });

  it('rejects out-of-range labour observations', async () => {
    const patientId = await makePatient('Partograph Invalid (synthetic)');
    const started = await app.inject({ method: 'POST', url: `/api/v1/patients/${patientId}/partographs`, headers: auth(staff.token), payload: {} });
    const partographId = started.json().partograph.id;
    const badDilation = await app.inject({ method: 'POST', url: `/api/v1/patients/${patientId}/partographs/${partographId}/observations`, headers: auth(staff.token), payload: { cervicalDilationCm: 12 } });
    expect(badDilation.statusCode).toBe(400);
    const badFhr = await app.inject({ method: 'POST', url: `/api/v1/patients/${patientId}/partographs/${partographId}/observations`, headers: auth(staff.token), payload: { fetalHeartRateBpm: 250 } });
    expect(badFhr.statusCode).toBe(400);
  });

  it('closes the active partograph on delivery and on explicit PATCH', async () => {
    const patientId = await makePatient('Partograph Delivery (synthetic)');
    const started = await app.inject({ method: 'POST', url: `/api/v1/patients/${patientId}/partographs`, headers: auth(staff.token), payload: {} });
    const partographId = started.json().partograph.id;

    // A recorded delivery completes the open partograph.
    await app.inject({ method: 'POST', url: `/api/v1/patients/${patientId}/deliveries`, headers: auth(staff.token), payload: { deliveryType: 'NORMAL' } });
    const afterDelivery = await db.partograph.findUnique({ where: { id: partographId } });
    expect(afterDelivery?.status).toBe('COMPLETE');

    // A second partograph can be closed explicitly.
    const second = await app.inject({ method: 'POST', url: `/api/v1/patients/${patientId}/partographs`, headers: auth(staff.token), payload: {} });
    const secondId = second.json().partograph.id;
    const patch = await app.inject({ method: 'PATCH', url: `/api/v1/patients/${patientId}/partographs/${secondId}`, headers: auth(staff.token), payload: { status: 'COMPLETE', notes: 'Transferred to regional hospital' } });
    expect(patch.statusCode).toBe(200);
    expect(patch.json().partograph.status).toBe('COMPLETE');
    expect(patch.json().partograph.notes).toBe('Transferred to regional hospital');
  });
});
