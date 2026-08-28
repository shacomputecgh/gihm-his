import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser, type TestUser } from './helpers.js';
import type { FastifyInstance } from 'fastify';

// Inpatient bed board (spec §18): the beds module was created directly in
// units.test.ts but its API routes were never exercised. These cover the
// scoped bed board, status transitions (with the freeing guard that refuses to
// clear a bed whose patient is still admitted), and patient assignment (auto
// admission creation/reuse, occupancy conflicts, patient access).
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
let p3Id = '';
let unitId = '';
let bedIds: string[] = [];
let otherBedId = '';
const userIds: string[] = [];
const admissionIds: string[] = [];

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
  r1 = await createRegion('BED-1', 'Beds Region One (synthetic)');
  r2 = await createRegion('BED-2', 'Beds Region Two (synthetic)');
  d1 = await createDistrict('BED-1-01', 'Beds District One (synthetic)', r1.id);
  d2 = await createDistrict('BED-2-01', 'Beds District Two (synthetic)', r2.id);
  a1f = await createFacility('BED-1-F', 'Beds Facility One (synthetic)', r1.id, d1.id);
  a2f = await createFacility('BED-2-F', 'Beds Facility Two (synthetic)', r2.id, d2.id);

  const dept = await db.department.create({ data: { facilityId: a1f.id, name: 'Medicine' } });
  const unit = await db.hospitalUnit.create({
    data: { facilityId: a1f.id, departmentId: dept.id, code: 'ICU', name: 'Intensive Care Unit', type: 'CLINICAL', headName: 'Dr. A', headTitle: 'Consultant', location: 'Block A' },
  });
  unitId = unit.id;
  const ward = await db.ward.create({ data: { unitId: unit.id, name: 'ICU Ward', bedCapacity: 6, status: 'ACTIVE' } });
  for (const n of ['I-01', 'I-02', 'I-03', 'I-04']) {
    const bed = await db.bed.create({ data: { facilityId: a1f.id, unitId: unit.id, wardId: ward.id, ward: 'ICU Ward', bedNumber: n, status: 'AVAILABLE' } });
    bedIds.push(bed.id);
  }
  otherBedId = (await db.bed.create({ data: { facilityId: a2f.id, ward: 'Ward B', bedNumber: 'B-01', status: 'AVAILABLE' } })).id;

  const p1 = await db.patient.create({
    data: { mrn: 'BED-0001', fullName: 'Beds Patient One (synthetic)', sex: 'F', facilityId: a1f.id, regionId: r1.id, districtId: d1.id, isSynthetic: true },
  });
  p1Id = p1.id;
  const p2 = await db.patient.create({
    data: { mrn: 'BED-0002', fullName: 'Beds Patient Two (synthetic)', sex: 'M', facilityId: a2f.id, regionId: r2.id, districtId: d2.id, isSynthetic: true },
  });
  p2Id = p2.id;
  const p3 = await db.patient.create({
    data: { mrn: 'BED-0003', fullName: 'Beds Patient Three (synthetic)', sex: 'M', facilityId: a1f.id, regionId: r1.id, districtId: d1.id, isSynthetic: true },
  });
  p3Id = p3.id;

  facilityUser = await makeUser({ email: 'bed-facility@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'FACILITY', facilityId: a1f.id, permissions: ['view_patient', 'write_clinical_note', 'view_dashboard'] });
  otherFacility = await makeUser({ email: 'bed-other@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'FACILITY', facilityId: a2f.id, permissions: ['view_patient', 'write_clinical_note'] });
  noPerm = await makeUser({ email: 'bed-noperm@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'NATIONAL', permissions: ['view_dashboard'] });
  userIds.push(facilityUser.userId, otherFacility.userId, noPerm.userId);

  app = await createTestApp();
});

afterAll(async () => {
  await db.admission.deleteMany({ where: { id: { in: admissionIds } } });
  await db.bed.deleteMany({ where: { id: { in: [...bedIds, otherBedId] } } });
  await db.ward.deleteMany({ where: { unitId } });
  await db.hospitalUnit.deleteMany({ where: { id: unitId } });
  await db.department.deleteMany({ where: { facilityId: a1f.id } });
  await db.patient.deleteMany({ where: { id: { in: [p1Id, p2Id, p3Id] } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.facility.deleteMany({ where: { id: { in: [a1f.id, a2f.id] } } });
  await db.district.deleteMany({ where: { id: { in: [d1.id, d2.id] } } });
  await db.region.deleteMany({ where: { id: { in: [r1.id, r2.id] } } });
  await db.$disconnect();
  await app.close();
});

const auth = (t: string) => ({ authorization: `Bearer ${t}` });
const board = (t: string, q = '') => app.inject({ method: 'GET', url: `/api/v1/beds${q}`, headers: auth(t) });
const setStatus = (t: string, id: string, status: string) =>
  app.inject({ method: 'POST', url: `/api/v1/beds/${id}/status`, headers: auth(t), payload: { status } });
const assign = (t: string, id: string, patientId: string, reason = 'Admission') =>
  app.inject({ method: 'POST', url: `/api/v1/beds/${id}/assign`, headers: auth(t), payload: { patientId, reason } });

describe('bed board', () => {
  it('lists only the caller’s facility beds with a ward summary', async () => {
    const res = await board(facilityUser.token);
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items).toHaveLength(4);
    const ward = body.summary.find((s: { ward: string }) => s.ward === 'ICU Ward');
    expect(ward).toMatchObject({ total: 4, occupied: 0, available: 4 });
    // The other facility's bed is invisible.
    const other = await board(otherFacility.token);
    expect(other.json().items).toHaveLength(1);
    expect(other.json().items[0].bedNumber).toBe('B-01');
  });

  it('filters by status and ward', async () => {
    const avail = await board(facilityUser.token, '?status=AVAILABLE');
    expect(avail.json().items).toHaveLength(4);
    const byWard = await board(facilityUser.token, '?ward=ICU%20Ward');
    expect(byWard.json().items).toHaveLength(4);
    const none = await board(facilityUser.token, '?ward=Nope');
    expect(none.json().items).toHaveLength(0);
  });
});

describe('bed status', () => {
  it('walks AVAILABLE → CLEANING → MAINTENANCE → ISOLATION and back, clearing occupancy', async () => {
    const [bed] = bedIds;
    for (const status of ['CLEANING', 'MAINTENANCE', 'ISOLATION', 'AVAILABLE']) {
      const res = await setStatus(facilityUser.token, bed!, status);
      expect(res.statusCode).toBe(200);
      expect(res.json().bed.status).toBe(status);
      expect(res.json().bed.patientId).toBeNull();
    }
  });

  it('rejects an invalid status and an out-of-scope bed', async () => {
    const bad = await setStatus(facilityUser.token, bedIds[0]!, 'NONSENSE');
    expect(bad.statusCode).toBe(400);
    const outOfScope = await setStatus(facilityUser.token, otherBedId, 'CLEANING');
    expect(outOfScope.statusCode).toBe(404);
  });

  it('refuses to free a bed whose patient still has an active admission', async () => {
    const [bed] = bedIds;
    const assignment = await assign(facilityUser.token, bed!, p1Id);
    expect(assignment.statusCode).toBe(200);
    admissionIds.push(assignment.json().admission.id);
    const freeing = await setStatus(facilityUser.token, bed!, 'AVAILABLE');
    expect(freeing.statusCode).toBe(409);
    // Restore the state so later tests start clean: discharge + free the bed.
    await db.admission.update({ where: { id: assignment.json().admission.id }, data: { status: 'DISCHARGED' } });
    await db.bed.update({ where: { id: bed }, data: { status: 'AVAILABLE', patientId: null } });
  });

  it('frees the bed when the patient has no active admission', async () => {
    // p3 gets an admission that is then discharged, then occupies a bed.
    const [bed] = bedIds.slice(1);
    const assignment = await assign(facilityUser.token, bed!, p3Id);
    const admId = assignment.json().admission.id;
    admissionIds.push(admId);
    await db.admission.update({ where: { id: admId }, data: { status: 'DISCHARGED' } });
    const freeing = await setStatus(facilityUser.token, bed!, 'AVAILABLE');
    expect(freeing.statusCode).toBe(200);
    expect(freeing.json().bed.patientId).toBeNull();
    expect(freeing.json().bed.status).toBe('AVAILABLE');
  });
});

describe('bed assignment', () => {
  it('assigns a patient, creating an admission, and refuses a second assignment', async () => {
    const [bed] = bedIds.slice(2);
    const res = await assign(facilityUser.token, bed!, p1Id);
    expect(res.statusCode).toBe(200);
    expect(res.json().bed.status).toBe('OCCUPIED');
    expect(res.json().bed.patientId).toBe(p1Id);
    admissionIds.push(res.json().admission.id);
    expect(res.json().admission.status).toBe('ADMITTED');
    expect(res.json().admission.bed).toBe('I-03');

    // Already occupied → conflict; and the same patient in another bed → conflict.
    const again = await assign(facilityUser.token, bed!, p1Id);
    expect(again.statusCode).toBe(409);
  });

  it('reuses the existing active admission instead of creating a second one', async () => {
    const existing = await db.admission.create({
      data: { patientId: p3Id, facilityId: a1f.id, reason: 'Observation', status: 'ADMITTED' },
    });
    admissionIds.push(existing.id);
    const [bed] = bedIds.slice(3);
    const res = await assign(facilityUser.token, bed!, p3Id);
    expect(res.statusCode).toBe(200);
    expect(res.json().admission.id).toBe(existing.id);
    expect(res.json().bed.patientId).toBe(p3Id);
  });

  it('refuses a patient who already occupies another bed', async () => {
    // p1 is already in I-03 (assigned above); assigning to a free bed conflicts.
    const [bed] = bedIds; // I-01 is AVAILABLE again after the freeing tests
    const res = await assign(facilityUser.token, bed!, p1Id);
    expect(res.statusCode).toBe(409);
  });

  it('refuses out-of-scope patients and beds', async () => {
    // I-02 is AVAILABLE at this point (freed in the status tests) — the
    // out-of-scope patient must fail on access, not on occupancy.
    const outPatient = await assign(facilityUser.token, bedIds[1]!, p2Id);
    expect(outPatient.statusCode).toBe(403);
    const outBed = await assign(facilityUser.token, otherBedId, p1Id);
    expect(outBed.statusCode).toBe(404);
  });
});

describe('beds guards', () => {
  it('requires write_clinical_note / view_patient on every endpoint', async () => {
    expect((await board(noPerm.token)).statusCode).toBe(403);
    expect((await setStatus(noPerm.token, bedIds[0]!, 'CLEANING')).statusCode).toBe(403);
    expect((await assign(noPerm.token, bedIds[0]!, p1Id)).statusCode).toBe(403);
  });
});
