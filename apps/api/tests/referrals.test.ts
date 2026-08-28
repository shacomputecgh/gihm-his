import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser, type TestUser } from './helpers.js';
import type { FastifyInstance } from 'fastify';

// Referral network (spec §31-§32): creating referrals, the outgoing/incoming
// lists, and the side-aware workflow SUBMITTED → RECEIVED → ACCEPTED →
// AWAITING_TRANSPORT → IN_TRANSIT → ARRIVED → COMPLETED (with reject/return/
// cancel branches), including ambulance assignment and release. The happy path
// lives in clinical2.test.ts — these cover the actor-side rules, scope
// boundaries, permission guards and flow conflicts.
let app: FastifyInstance;
let sender: TestUser;
let receiver: TestUser;
let thirdFacility: TestUser;
let noPerm: TestUser;

let r1: { id: string };
let r2: { id: string };
let d1: { id: string };
let d2: { id: string };
let a1f: { id: string };
let a2f: { id: string };
let a3f: { id: string };
let p1Id = '';
let p2Id = '';
const userIds: string[] = [];
const referralIds: string[] = [];
const ambulanceIds: string[] = [];

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
  r1 = await createRegion('REF-1', 'Referral Region One (synthetic)');
  r2 = await createRegion('REF-2', 'Referral Region Two (synthetic)');
  d1 = await createDistrict('REF-1-01', 'Referral District One (synthetic)', r1.id);
  d2 = await createDistrict('REF-2-01', 'Referral District Two (synthetic)', r2.id);
  a1f = await createFacility('REF-1-F', 'Referral Facility One (synthetic)', r1.id, d1.id);
  a2f = await createFacility('REF-2-F', 'Referral Facility Two (synthetic)', r2.id, d2.id);
  a3f = await createFacility('REF-3-F', 'Referral Facility Three (synthetic)', r2.id, d2.id);

  const p1 = await db.patient.create({
    data: { mrn: 'REF-0001', fullName: 'Referral Patient One (synthetic)', sex: 'F', facilityId: a1f.id, regionId: r1.id, districtId: d1.id, isSynthetic: true },
  });
  p1Id = p1.id;
  const p2 = await db.patient.create({
    data: { mrn: 'REF-0002', fullName: 'Referral Patient Two (synthetic)', sex: 'M', facilityId: a2f.id, regionId: r2.id, districtId: d2.id, isSynthetic: true },
  });
  p2Id = p2.id;

  const perms = ['view_patient', 'view_clinical_record', 'write_clinical_note'];
  sender = await makeUser({ email: 'ref-sender@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'FACILITY', facilityId: a1f.id, permissions: perms });
  receiver = await makeUser({ email: 'ref-receiver@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'FACILITY', facilityId: a2f.id, permissions: perms });
  thirdFacility = await makeUser({ email: 'ref-third@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'FACILITY', facilityId: a3f.id, permissions: perms });
  noPerm = await makeUser({ email: 'ref-noperm@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'NATIONAL', permissions: ['view_dashboard'] });
  userIds.push(sender.userId, receiver.userId, thirdFacility.userId, noPerm.userId);

  app = await createTestApp();
});

afterAll(async () => {
  await db.referral.deleteMany({ where: { id: { in: referralIds } } });
  await db.ambulance.deleteMany({ where: { id: { in: ambulanceIds } } });
  await db.patient.deleteMany({ where: { id: { in: [p1Id, p2Id] } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.facility.deleteMany({ where: { id: { in: [a1f.id, a2f.id, a3f.id] } } });
  await db.district.deleteMany({ where: { id: { in: [d1.id, d2.id] } } });
  await db.region.deleteMany({ where: { id: { in: [r1.id, r2.id] } } });
  await db.$disconnect();
  await app.close();
});

const auth = (t: string) => ({ authorization: `Bearer ${t}` });
const create = (t: string, payload: Record<string, unknown>) =>
  app.inject({ method: 'POST', url: '/api/v1/referrals', headers: auth(t), payload });
const list = (t: string, q = '') => app.inject({ method: 'GET', url: `/api/v1/referrals${q}`, headers: auth(t) });
const setStatus = (t: string, id: string, payload: Record<string, unknown>) =>
  app.inject({ method: 'POST', url: `/api/v1/referrals/${id}/status`, headers: auth(t), payload });

async function makeAmbulance(facilityId: string, registration: string, status = 'AVAILABLE') {
  const ambulance = await db.ambulance.create({ data: { facilityId, registration, status } });
  ambulanceIds.push(ambulance.id);
  return ambulance;
}

async function makeReferral(by: TestUser = sender, overrides: Record<string, unknown> = {}) {
  const res = await create(by.token, { patientId: p1Id, toFacilityId: a2f.id, urgency: 'ROUTINE', summary: 'Needs specialist review', ...overrides });
  expect(res.statusCode).toBe(200);
  const referral = res.json().referral;
  referralIds.push(referral.id);
  return referral;
}

describe('create a referral', () => {
  it('creates a SUBMITTED referral to a facility or a free-text facility name', async () => {
    const byId = await makeReferral();
    expect(byId).toMatchObject({ fromFacilityId: a1f.id, toFacilityId: a2f.id, status: 'SUBMITTED' });

    const byName = await create(sender.token, { patientId: p1Id, toFacilityName: 'Korle-Bu Teaching Hospital', summary: 'Direct admit' });
    expect(byName.statusCode).toBe(200);
    expect(byName.json().referral.toFacilityId).toBeNull();
    expect(byName.json().referral.toFacilityName).toBe('Korle-Bu Teaching Hospital');
    referralIds.push(byName.json().referral.id);
  });

  it('validates the receiving facility, the patient scope and required fields', async () => {
    const noTarget = await create(sender.token, { patientId: p1Id });
    expect(noTarget.statusCode).toBe(400);
    const unknownTarget = await create(sender.token, { patientId: p1Id, toFacilityId: 'no-such-facility' });
    expect(unknownTarget.statusCode).toBe(400);
    // p2 lives in region two — outside the a1f sender’s scope.
    const outPatient = await create(sender.token, { patientId: p2Id, toFacilityId: a2f.id });
    expect(outPatient.statusCode).toBe(403);
  });

  it('rejects callers without write_clinical_note / view_patient', async () => {
    const res = await create(noPerm.token, { patientId: p1Id, toFacilityId: a2f.id });
    expect(res.statusCode).toBe(403);
  });
});

describe('list referrals', () => {
  it('shows outgoing to the sender, incoming to the receiver, nothing to a bystander', async () => {
    const referral = await makeReferral();
    const outgoing = await list(sender.token, '?direction=outgoing');
    expect(outgoing.json().items.some((r: { id: string }) => r.id === referral.id)).toBe(true);
    expect(outgoing.json().items[0].toFacilityName).toBe('Referral Facility Two (synthetic)');

    const incoming = await list(receiver.token, '?direction=incoming');
    expect(incoming.json().items.some((r: { id: string }) => r.id === referral.id)).toBe(true);

    const bystander = await list(thirdFacility.token, '?direction=outgoing');
    expect(bystander.json().items.some((r: { id: string }) => r.id === referral.id)).toBe(false);
  });

  it('filters by status and urgency', async () => {
    const referral = await makeReferral(sender, { urgency: 'URGENT' });
    const urgent = await list(sender.token, '?urgency=URGENT');
    expect(urgent.json().items.some((r: { id: string }) => r.id === referral.id)).toBe(true);
    const submitted = await list(sender.token, '?status=SUBMITTED');
    expect(submitted.json().items.some((r: { id: string }) => r.id === referral.id)).toBe(true);
    const completed = await list(sender.token, '?status=COMPLETED');
    expect(completed.json().items.some((r: { id: string }) => r.id === referral.id)).toBe(false);
  });

  it('rejects callers without view_patient / view_clinical_record', async () => {
    const res = await list(noPerm.token);
    expect(res.statusCode).toBe(403);
  });
});

describe('referral workflow', () => {
  it('walks the full journey with side-aware steps and releases the ambulance', async () => {
    const referral = await makeReferral();
    const ambulance = await makeAmbulance(a1f.id, 'GV-REF-01');

    // Only the receiving side may mark it received.
    const wrongSide = await setStatus(sender.token, referral.id, { status: 'RECEIVED' });
    expect(wrongSide.statusCode).toBe(403);

    const received = await setStatus(receiver.token, referral.id, { status: 'RECEIVED', note: 'Patient received in casualty' });
    expect(received.statusCode).toBe(200);
    expect(received.json().referral.status).toBe('RECEIVED');

    const accepted = await setStatus(receiver.token, referral.id, { status: 'ACCEPTED' });
    expect(accepted.statusCode).toBe(200);

    const awaiting = await setStatus(sender.token, referral.id, { status: 'AWAITING_TRANSPORT', ambulanceId: ambulance.id });
    expect(awaiting.statusCode).toBe(200);
    expect((await db.ambulance.findUnique({ where: { id: ambulance.id } }))?.status).toBe('ASSIGNED');

    const inTransit = await setStatus(sender.token, referral.id, { status: 'IN_TRANSIT' });
    expect(inTransit.statusCode).toBe(200);
    expect((await db.ambulance.findUnique({ where: { id: ambulance.id } }))?.status).toBe('TRANSPORTING');

    const arrived = await setStatus(receiver.token, referral.id, { status: 'ARRIVED' });
    expect(arrived.statusCode).toBe(200);
    expect((await db.ambulance.findUnique({ where: { id: ambulance.id } }))?.status).toBe('AVAILABLE');

    const done = await setStatus(receiver.token, referral.id, { status: 'COMPLETED' });
    expect(done.statusCode).toBe(200);
    expect(done.json().referral.status).toBe('COMPLETED');
    // Terminal state — no further transitions.
    const again = await setStatus(receiver.token, referral.id, { status: 'RETURNED' });
    expect(again.statusCode).toBe(409);
  });

  it('rejects actor-side violations, invalid jumps and out-of-scope actors', async () => {
    const referral = await makeReferral();
    // Sender cannot reject their own referral — that is the receiver’s call.
    const selfReject = await setStatus(sender.token, referral.id, { status: 'REJECTED' });
    expect(selfReject.statusCode).toBe(403);
    // Jumps that skip stages are refused.
    const skip = await setStatus(receiver.token, referral.id, { status: 'COMPLETED' });
    expect(skip.statusCode).toBe(409);
    // A facility with no part in the referral cannot touch it.
    const bystander = await setStatus(thirdFacility.token, referral.id, { status: 'RECEIVED' });
    expect(bystander.statusCode).toBe(403);
  });

  it('guards ambulance assignment: busy fleet, wrong step, out-of-scope vehicle', async () => {
    const referral = await makeReferral();
    await setStatus(receiver.token, referral.id, { status: 'RECEIVED' });
    await setStatus(receiver.token, referral.id, { status: 'ACCEPTED' });

    const busy = await makeAmbulance(a1f.id, 'GV-REF-02', 'MAINTENANCE');
    const busyRes = await setStatus(sender.token, referral.id, { status: 'AWAITING_TRANSPORT', ambulanceId: busy.id });
    expect(busyRes.statusCode).toBe(409);

    // An ambulance may only be attached when arranging or starting transport.
    const wrongStep = await setStatus(sender.token, referral.id, { status: 'COMPLETED', ambulanceId: busy.id });
    expect(wrongStep.statusCode).toBe(400);

    const outOfScope = await makeAmbulance(a2f.id, 'GV-REF-03');
    const outRes = await setStatus(sender.token, referral.id, { status: 'AWAITING_TRANSPORT', ambulanceId: outOfScope.id });
    expect(outRes.statusCode).toBe(404);
  });

  it('supports the reject → return branch', async () => {
    const referral = await makeReferral();
    await setStatus(receiver.token, referral.id, { status: 'RECEIVED' });
    const rejected = await setStatus(receiver.token, referral.id, { status: 'REJECTED', note: 'No capacity' });
    expect(rejected.statusCode).toBe(200);
    expect(rejected.json().referral.status).toBe('REJECTED');
    const returned = await setStatus(receiver.token, referral.id, { status: 'RETURNED' });
    expect(returned.statusCode).toBe(200);
    expect(returned.json().referral.status).toBe('RETURNED');
  });
});
