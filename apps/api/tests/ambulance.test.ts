import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser, type TestUser } from './helpers.js';
import type { FastifyInstance } from 'fastify';

// Ambulance fleet + dispatch (spec §33): registering vehicles, setting fleet
// status, dispatching trips and advancing them through the guarded flow
// ASSIGNED → EN_ROUTE → AT_SCENE → TRANSPORTING → AT_FACILITY → COMPLETED.
// The happy path lives in clinical3.test.ts — these cover scope boundaries,
// permission guards, validation and the dispatch/flow conflicts.
let app: FastifyInstance;
let facilityUser: TestUser;
let otherFacility: TestUser;
let noPerm: TestUser;

let r1: { id: string };
let r2: { id: string };
let d1: { id: string };
let d2: { id: string };
let a1f: { id: string };
let a2f: { id: string };
let p1Id = '';
let p2Id = '';
const userIds: string[] = [];
const ambulanceIds: string[] = [];
const tripIds: string[] = [];

async function createRegion(code: string, name: string) {
  return db.region.create({ data: { code, name, capital: 'Test Capital' } });
}
async function createDistrict(code: string, name: string, regionId: string) {
  return db.district.create({ data: { code, name, type: 'DISTRICT', regionId } });
}
async function createFacility(code: string, name: string, regionId: string, districtId: string) {
  return db.facility.create({
    data: {
      code,
      name,
      type: 'CLINIC',
      level: 'PRIMARY',
      ownership: 'PRIVATE',
      regionId,
      districtId,
      services: '["OPD"]',
      departmentsJson: '[]',
      openingHours: '{}',
      isSynthetic: true,
      status: 'ACTIVE',
    },
  });
}

beforeAll(async () => {
  r1 = await createRegion('AMB-1', 'Ambulance Region One (synthetic)');
  r2 = await createRegion('AMB-2', 'Ambulance Region Two (synthetic)');
  d1 = await createDistrict('AMB-1-01', 'Ambulance District One (synthetic)', r1.id);
  d2 = await createDistrict('AMB-2-01', 'Ambulance District Two (synthetic)', r2.id);
  a1f = await createFacility('AMB-1-F', 'Ambulance Facility One (synthetic)', r1.id, d1.id);
  a2f = await createFacility('AMB-2-F', 'Ambulance Facility Two (synthetic)', r2.id, d2.id);

  const p1 = await db.patient.create({
    data: { mrn: 'AMB-0001', fullName: 'Ambulance Patient One (synthetic)', sex: 'F', facilityId: a1f.id, regionId: r1.id, districtId: d1.id, isSynthetic: true },
  });
  p1Id = p1.id;
  const p2 = await db.patient.create({
    data: { mrn: 'AMB-0002', fullName: 'Ambulance Patient Two (synthetic)', sex: 'M', facilityId: a2f.id, regionId: r2.id, districtId: d2.id, isSynthetic: true },
  });
  p2Id = p2.id;

  facilityUser = await makeUser({ email: 'amb-facility@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'FACILITY', facilityId: a1f.id, permissions: ['view_patient', 'write_clinical_note', 'manage_ambulance', 'view_dashboard'] });
  otherFacility = await makeUser({ email: 'amb-other@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'FACILITY', facilityId: a2f.id, permissions: ['view_patient', 'write_clinical_note', 'manage_ambulance'] });
  // No view_patient / write_clinical_note / view_dashboard — the fleet and trip
  // log allow view_dashboard, so a bare dashboard user must NOT pass those guards.
  noPerm = await makeUser({ email: 'amb-noperm@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'NATIONAL', permissions: [] });
  userIds.push(facilityUser.userId, otherFacility.userId, noPerm.userId);

  app = await createTestApp();
});

afterAll(async () => {
  await db.ambulanceTrip.deleteMany({ where: { id: { in: tripIds } } });
  await db.ambulance.deleteMany({ where: { id: { in: ambulanceIds } } });
  await db.patient.deleteMany({ where: { id: { in: [p1Id, p2Id] } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.facility.deleteMany({ where: { id: { in: [a1f.id, a2f.id] } } });
  await db.district.deleteMany({ where: { id: { in: [d1.id, d2.id] } } });
  await db.region.deleteMany({ where: { id: { in: [r1.id, r2.id] } } });
  await db.$disconnect();
  await app.close();
});

const auth = (t: string) => ({ authorization: `Bearer ${t}` });
const fleet = (t: string, q = '') => app.inject({ method: 'GET', url: `/api/v1/ambulances${q}`, headers: auth(t) });
const register = (t: string, payload: Record<string, unknown>) =>
  app.inject({ method: 'POST', url: '/api/v1/ambulances', headers: auth(t), payload });
const setStatus = (t: string, id: string, status: string) =>
  app.inject({ method: 'POST', url: `/api/v1/ambulances/${id}/status`, headers: auth(t), payload: { status } });
const trips = (t: string, q = '') => app.inject({ method: 'GET', url: `/api/v1/ambulance/trips${q}`, headers: auth(t) });
const dispatch = (t: string, payload: Record<string, unknown>) =>
  app.inject({ method: 'POST', url: '/api/v1/ambulance/trips', headers: auth(t), payload });
const tripStatus = (t: string, id: string, status: string) =>
  app.inject({ method: 'POST', url: `/api/v1/ambulance/trips/${id}/status`, headers: auth(t), payload: { status } });

async function registerAmbulance(registration: string) {
  const res = await register(facilityUser.token, { registration, model: 'Test Van', driverName: 'Driver Test', fuelLevel: 90 });
  expect(res.statusCode).toBe(200);
  const ambulance = res.json().ambulance;
  ambulanceIds.push(ambulance.id);
  return ambulance;
}

describe('fleet registration', () => {
  it('registers an ambulance as AVAILABLE and rejects a duplicate registration', async () => {
    const amb = await registerAmbulance('GV-AMB-01');
    expect(amb.status).toBe('AVAILABLE');
    expect(amb.facilityId).toBe(a1f.id);
    const dup = await register(facilityUser.token, { registration: 'GV-AMB-01' });
    expect(dup.statusCode).toBe(409);
    const badFuel = await register(facilityUser.token, { registration: 'GV-AMB-BAD', fuelLevel: 120 });
    expect(badFuel.statusCode).toBe(400);
  });

  it('rejects callers without manage_ambulance', async () => {
    const res = await register(noPerm.token, { registration: 'GV-AMB-NOPE' });
    expect(res.statusCode).toBe(403);
  });
});

describe('fleet status', () => {
  it('walks AVAILABLE → MAINTENANCE → OFFLINE → AVAILABLE, updating fuel', async () => {
    const amb = await registerAmbulance('GV-AMB-02');
    for (const status of ['MAINTENANCE', 'OFFLINE', 'AVAILABLE']) {
      const res = await setStatus(facilityUser.token, amb.id, status);
      expect(res.statusCode).toBe(200);
      expect(res.json().ambulance.status).toBe(status);
    }
    const refuelled = await setStatus(facilityUser.token, amb.id, 'AVAILABLE');
    expect(refuelled.json().ambulance.fuelLevel).toBe(90);
  });

  it('rejects an invalid status and an out-of-scope ambulance', async () => {
    const amb = await registerAmbulance('GV-AMB-03');
    const bad = await setStatus(facilityUser.token, amb.id, 'NONSENSE');
    expect(bad.statusCode).toBe(400);
    const other = await db.ambulance.create({ data: { facilityId: a2f.id, registration: 'GV-AMB-OTH', status: 'AVAILABLE' } });
    ambulanceIds.push(other.id);
    const outOfScope = await setStatus(facilityUser.token, other.id, 'MAINTENANCE');
    expect(outOfScope.statusCode).toBe(404);
  });
});

describe('dispatch', () => {
  it('dispatches an ambulance (trip ASSIGNED, fleet ASSIGNED) and refuses a second dispatch', async () => {
    const amb = await registerAmbulance('GV-AMB-04');
    const res = await dispatch(facilityUser.token, { ambulanceId: amb.id, patientId: p1Id, emergencyType: 'TRAUMA', pickupLocation: 'Testville' });
    expect(res.statusCode).toBe(200);
    const trip = res.json().trip;
    tripIds.push(trip.id);
    expect(trip.status).toBe('ASSIGNED');
    expect((await fleet(facilityUser.token)).json().items.find((a: { id: string }) => a.id === amb.id).status).toBe('ASSIGNED');
    const again = await dispatch(facilityUser.token, { ambulanceId: amb.id, patientId: p1Id });
    expect(again.statusCode).toBe(409);
  });

  it('refuses to dispatch a non-available ambulance and out-of-scope patients', async () => {
    const amb = await registerAmbulance('GV-AMB-05');
    await setStatus(facilityUser.token, amb.id, 'MAINTENANCE');
    const busy = await dispatch(facilityUser.token, { ambulanceId: amb.id, patientId: p1Id });
    expect(busy.statusCode).toBe(409);
    await setStatus(facilityUser.token, amb.id, 'AVAILABLE');
    // p2 lives in region two — out of the a1f caller’s scope.
    const outPatient = await dispatch(facilityUser.token, { ambulanceId: amb.id, patientId: p2Id });
    expect(outPatient.statusCode).toBe(403);
    const other = await db.ambulance.create({ data: { facilityId: a2f.id, registration: 'GV-AMB-OTH2', status: 'AVAILABLE' } });
    ambulanceIds.push(other.id);
    const outAmbulance = await dispatch(facilityUser.token, { ambulanceId: other.id, patientId: p1Id });
    expect(outAmbulance.statusCode).toBe(404);
  });
});

describe('trip lifecycle', () => {
  it('advances ASSIGNED → EN_ROUTE → AT_SCENE → TRANSPORTING → AT_FACILITY → COMPLETED and frees the fleet', async () => {
    const amb = await registerAmbulance('GV-AMB-06');
    const created = await dispatch(facilityUser.token, { ambulanceId: amb.id, patientId: p1Id });
    const id = created.json().trip.id;
    tripIds.push(id);
    for (const status of ['EN_ROUTE', 'AT_SCENE', 'TRANSPORTING', 'AT_FACILITY', 'COMPLETED']) {
      const res = await tripStatus(facilityUser.token, id, status);
      expect(res.statusCode).toBe(200);
    }
    const row = (await fleet(facilityUser.token)).json().items.find((a: { id: string }) => a.id === amb.id);
    expect(row.status).toBe('AVAILABLE');
  });

  it('CANCELLED also frees the ambulance, and terminal states reject further moves', async () => {
    const amb = await registerAmbulance('GV-AMB-07');
    const created = await dispatch(facilityUser.token, { ambulanceId: amb.id, patientId: p1Id });
    const id = created.json().trip.id;
    tripIds.push(id);
    expect((await tripStatus(facilityUser.token, id, 'CANCELLED')).statusCode).toBe(200);
    expect((await fleet(facilityUser.token)).json().items.find((a: { id: string }) => a.id === amb.id).status).toBe('AVAILABLE');
    const again = await tripStatus(facilityUser.token, id, 'EN_ROUTE');
    expect(again.statusCode).toBe(409);
  });

  it('rejects an invalid transition and an out-of-scope trip', async () => {
    const amb = await registerAmbulance('GV-AMB-08');
    const created = await dispatch(facilityUser.token, { ambulanceId: amb.id, patientId: p1Id });
    const id = created.json().trip.id;
    tripIds.push(id);
    const skip = await tripStatus(facilityUser.token, id, 'COMPLETED');
    expect(skip.statusCode).toBe(409);
    // The a2f user has no access to the a1f trip — 403, not 404 (explicit scope guard).
    const outOfScope = await tripStatus(otherFacility.token, id, 'EN_ROUTE');
    expect(outOfScope.statusCode).toBe(403);
  });
});

describe('trip log', () => {
  it('scopes the log to the caller’s fleet and filters by status', async () => {
    const res = await trips(facilityUser.token);
    expect(res.statusCode).toBe(200);
    const ids = res.json().items.map((t: { id: string }) => t.id);
    expect(ids.length).toBeGreaterThanOrEqual(4);
    const completed = await trips(facilityUser.token, '?status=COMPLETED');
    expect(completed.json().items.length).toBeGreaterThanOrEqual(1);
    expect(completed.json().items.every((t: { status: string }) => t.status === 'COMPLETED')).toBe(true);
    const other = await trips(otherFacility.token);
    const otherIds = other.json().items.map((t: { id: string }) => t.id);
    expect(otherIds.some((id: string) => ids.includes(id))).toBe(false);
  });

  it('rejects callers without view_patient / write_clinical_note', async () => {
    expect((await trips(noPerm.token)).statusCode).toBe(403);
    expect((await fleet(noPerm.token)).statusCode).toBe(403);
  });
});
