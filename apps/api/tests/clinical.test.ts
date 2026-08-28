import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser, type TestUser } from './helpers.js';
import type { FastifyInstance } from 'fastify';

// Clinical worklists (spec §25 pharmacy, §23 laboratory): the scoped pharmacy
// and laboratory queues and their guarded actions — dispensing a prescription
// (decrementing stock, partial/full statuses) and entering + verifying a lab
// result (audited, and published as a labOrder.verified webhook event). The
// patient-side ordering endpoints live in patients.test.ts / clinical2.test.ts;
// these cover the worklist module's scope boundaries, permission guards,
// validation and the stock/webhook side effects.
let app: FastifyInstance;
let doctor: TestUser;
let pharmacist: TestUser;
let labTech: TestUser;
let otherPharmacist: TestUser;
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
const encounterIds: string[] = [];
const rxIds: string[] = [];
const orderIds: string[] = [];
const stockIds: string[] = [];
let subscriptionId = '';

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
  r1 = await createRegion('CLN-1', 'Clinical Region One (synthetic)');
  r2 = await createRegion('CLN-2', 'Clinical Region Two (synthetic)');
  d1 = await createDistrict('CLN-1-01', 'Clinical District One (synthetic)', r1.id);
  d2 = await createDistrict('CLN-2-01', 'Clinical District Two (synthetic)', r2.id);
  a1f = await createFacility('CLN-1-F', 'Clinical Facility One (synthetic)', r1.id, d1.id);
  a2f = await createFacility('CLN-2-F', 'Clinical Facility Two (synthetic)', r2.id, d2.id);

  const p1 = await db.patient.create({
    data: { mrn: 'CLN-0001', fullName: 'Clinical Patient One (synthetic)', sex: 'F', facilityId: a1f.id, regionId: r1.id, districtId: d1.id, isSynthetic: true },
  });
  p1Id = p1.id;
  const p2 = await db.patient.create({
    data: { mrn: 'CLN-0002', fullName: 'Clinical Patient Two (synthetic)', sex: 'M', facilityId: a2f.id, regionId: r2.id, districtId: d2.id, isSynthetic: true },
  });
  p2Id = p2.id;

  doctor = await makeUser({ email: 'cln-doctor@demo.gh', roleCode: 'DOCTOR', scope: 'FACILITY', facilityId: a1f.id, permissions: ['write_clinical_note', 'prescribe', 'order_lab', 'view_patient'] });
  pharmacist = await makeUser({ email: 'cln-pharmacist@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'FACILITY', facilityId: a1f.id, permissions: ['dispense', 'view_patient', 'manage_stock'] });
  labTech = await makeUser({ email: 'cln-labtech@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'FACILITY', facilityId: a1f.id, permissions: ['order_lab', 'verify_lab', 'view_patient'] });
  otherPharmacist = await makeUser({ email: 'cln-other@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'FACILITY', facilityId: a2f.id, permissions: ['dispense', 'view_patient', 'order_lab', 'verify_lab', 'write_clinical_note', 'prescribe'] });
  noPerm = await makeUser({ email: 'cln-noperm@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'NATIONAL', permissions: ['view_reports'] });
  userIds.push(doctor.userId, pharmacist.userId, labTech.userId, otherPharmacist.userId, noPerm.userId);

  app = await createTestApp();
});

afterAll(async () => {
  await db.webhookDelivery.deleteMany({ where: { subscriptionId } });
  await db.webhookSubscription.deleteMany({ where: { id: subscriptionId } });
  await db.prescription.deleteMany({ where: { id: { in: rxIds } } });
  await db.labOrder.deleteMany({ where: { id: { in: orderIds } } });
  await db.stockMovement.deleteMany({ where: { stockItemId: { in: stockIds } } });
  await db.stockItem.deleteMany({ where: { id: { in: stockIds } } });
  await db.encounter.deleteMany({ where: { id: { in: encounterIds } } });
  await db.patient.deleteMany({ where: { id: { in: [p1Id, p2Id] } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.facility.deleteMany({ where: { id: { in: [a1f.id, a2f.id] } } });
  await db.district.deleteMany({ where: { id: { in: [d1.id, d2.id] } } });
  await db.region.deleteMany({ where: { id: { in: [r1.id, r2.id] } } });
  await db.$disconnect();
  await app.close();
});

const auth = (t: string) => ({ authorization: `Bearer ${t}` });
const rxWorklist = (t: string, q = '') => app.inject({ method: 'GET', url: `/api/v1/pharmacy/prescriptions${q}`, headers: auth(t) });
const dispense = (t: string, rxId: string, payload: Record<string, unknown> = {}) =>
  app.inject({ method: 'POST', url: `/api/v1/pharmacy/prescriptions/${rxId}/dispense`, headers: auth(t), payload });
const labWorklist = (t: string, q = '') => app.inject({ method: 'GET', url: `/api/v1/lab/orders${q}`, headers: auth(t) });
const verifyResult = (t: string, orderId: string, payload: Record<string, unknown>) =>
  app.inject({ method: 'POST', url: `/api/v1/lab/orders/${orderId}/result`, headers: auth(t), payload });

async function openEncounter(patientId: string, by: TestUser = doctor) {
  const res = await app.inject({ method: 'POST', url: `/api/v1/patients/${patientId}/encounters`, headers: auth(by.token), payload: { type: 'OPD' } });
  expect(res.statusCode).toBe(200);
  const encounter = res.json().encounter;
  encounterIds.push(encounter.id);
  return encounter;
}

async function makeRx(patientId: string, medicine: string, quantity = 5, by: TestUser = doctor) {
  const encounter = await openEncounter(patientId, by);
  const res = await app.inject({
    method: 'POST',
    url: `/api/v1/patients/${patientId}/prescriptions`,
    headers: auth(by.token),
    payload: { encounterId: encounter.id, medicine, quantity },
  });
  expect(res.statusCode).toBe(200);
  const rx = res.json().prescription;
  rxIds.push(rx.id);
  return rx;
}

async function makeLabOrder(patientId: string, test: string, by: TestUser = doctor) {
  const encounter = await openEncounter(patientId, by);
  const res = await app.inject({
    method: 'POST',
    url: `/api/v1/patients/${patientId}/lab-orders`,
    headers: auth(by.token),
    payload: { encounterId: encounter.id, test, discipline: 'HAEMATOLOGY' },
  });
  expect(res.statusCode).toBe(200);
  const order = res.json().order;
  orderIds.push(order.id);
  return order;
}

describe('pharmacy worklist', () => {
  it('lists ACTIVE prescriptions, scoped to the caller’s facility', async () => {
    const rx = await makeRx(p1Id, 'Amoxicillin 250mg (worklist test)');
    const res = await rxWorklist(pharmacist.token);
    expect(res.statusCode).toBe(200);
    const ids = res.json().items.map((p: { id: string }) => p.id);
    expect(ids).toContain(rx.id);
    expect(res.json().items.find((p: { id: string }) => p.id === rx.id).status).toBe('ACTIVE');
    // A pharmacist at a2f must not see a1f prescriptions.
    const other = await rxWorklist(otherPharmacist.token);
    expect(other.json().items.some((p: { id: string }) => p.id === rx.id)).toBe(false);
  });

  it('dispenses fully, decrementing matching stock and writing an ISSUE movement', async () => {
    const item = await db.stockItem.create({ data: { facilityId: a1f.id, name: 'Paracetamol 500mg', category: 'MEDICINE', unit: 'tablet', quantity: 100, reorderLevel: 20, status: 'ACTIVE' } });
    stockIds.push(item.id);
    const rx = await makeRx(p1Id, 'Paracetamol 500mg', 10);
    const res = await dispense(pharmacist.token, rx.id);
    expect(res.statusCode).toBe(200);
    expect(res.json().prescription.status).toBe('DISPENSED');
    expect(res.json().prescription.dispensedQty).toBe(10);
    expect(res.json().stock).toMatchObject({ matched: true, remaining: 90 });
    const after = await db.stockItem.findUnique({ where: { id: item.id } });
    expect(after?.quantity).toBe(90);
    const movement = await db.stockMovement.findFirst({ where: { stockItemId: item.id, type: 'ISSUE' } });
    expect(movement).toMatchObject({ quantity: -10, balanceAfter: 90 });
  });

  it('marks a partial dispense PARTIAL and completes it on a second pass', async () => {
    const rx = await makeRx(p1Id, 'Metformin 500mg (worklist test)', 10);
    const part = await dispense(pharmacist.token, rx.id, { quantity: 4 });
    expect(part.statusCode).toBe(200);
    expect(part.json().prescription.status).toBe('PARTIAL');
    expect(part.json().prescription.dispensedQty).toBe(4);
    const done = await dispense(pharmacist.token, rx.id, { quantity: 6 });
    expect(done.json().prescription.status).toBe('DISPENSED');
  });

  it('honours the status filter: ALL shows dispensed rows, the default hides them', async () => {
    await makeRx(p1Id, 'Ibuprofen 400mg (worklist test)', 5);
    const dispensed = await makeRx(p1Id, 'Diclofenac 50mg (worklist test)', 5);
    await dispense(pharmacist.token, dispensed.id);

    const all = await rxWorklist(pharmacist.token, '?status=ALL');
    expect(all.json().items.some((p: { id: string }) => p.id === dispensed.id)).toBe(true);
    const pending = await rxWorklist(pharmacist.token);
    expect(pending.json().items.some((p: { id: string }) => p.id === dispensed.id)).toBe(false);
  });

  it('refuses a re-dispense, an out-of-scope prescription, and callers without dispense', async () => {
    const rx = await makeRx(p1Id, 'Amlodipine 5mg (worklist test)', 5);
    await dispense(pharmacist.token, rx.id);
    const again = await dispense(pharmacist.token, rx.id);
    expect(again.statusCode).toBe(409);

    const otherRx = await makeRx(p2Id, 'Other Facility Rx (worklist test)', 5, otherPharmacist);
    const outOfScope = await dispense(pharmacist.token, otherRx.id);
    expect(outOfScope.statusCode).toBe(404);

    expect((await dispense(noPerm.token, rx.id)).statusCode).toBe(403);
    expect((await rxWorklist(noPerm.token)).statusCode).toBe(403);
  });
});

describe('laboratory worklist', () => {
  it('lists ORDERED tests, scoped and filterable by discipline', async () => {
    const order = await makeLabOrder(p1Id, 'FBC');
    const res = await labWorklist(labTech.token);
    expect(res.statusCode).toBe(200);
    const ids = res.json().items.map((o: { id: string }) => o.id);
    expect(ids).toContain(order.id);
    expect(res.json().items.find((o: { id: string }) => o.id === order.id).status).toBe('ORDERED');
    // A different discipline is filtered out.
    const chemistry = await labWorklist(labTech.token, '?discipline=CHEMISTRY');
    expect(chemistry.json().items.some((o: { id: string }) => o.id === order.id)).toBe(false);
    const haematology = await labWorklist(labTech.token, '?discipline=HAEMATOLOGY');
    expect(haematology.json().items.some((o: { id: string }) => o.id === order.id)).toBe(true);
    // Scope: the a2f caller must not see a1f orders.
    const other = await labWorklist(otherPharmacist.token);
    expect(other.json().items.some((o: { id: string }) => o.id === order.id)).toBe(false);
  });

  it('enters and verifies a result from the worklist, auditing and publishing the event', async () => {
    const order = await makeLabOrder(p1Id, 'Malaria RDT');
    const sub = await db.webhookSubscription.create({
      data: { name: 'Clinical Test Hook (synthetic)', url: 'https://hooks.example/clinical', events: JSON.stringify(['labOrder.verified']), secret: 'test-secret' },
    });
    subscriptionId = sub.id;

    const res = await verifyResult(labTech.token, order.id, { result: 'Negative', referenceRange: 'No parasites' });
    expect(res.statusCode).toBe(200);
    expect(res.json().order.status).toBe('VERIFIED');
    expect(res.json().order.result).toBe('Negative');
    expect(res.json().order.verifiedById).toBe(labTech.userId);

    const audit = await db.auditLog.findFirst({ where: { action: 'labOrder.verify', entityId: order.id } });
    expect(audit).toBeTruthy();
    // Durable webhook delivery for subscribers (a subscriber outage never fails
    // the clinical write).
    const delivery = await db.webhookDelivery.findFirst({ where: { subscriptionId: sub.id, event: 'labOrder.verified' } });
    expect(delivery).toBeTruthy();
    expect(delivery?.status).toBe('PENDING');
  });

  it('refuses a missing result, an out-of-scope order, and callers without verify_lab', async () => {
    const order = await makeLabOrder(p1Id, 'Urea and Electrolytes');
    const noResult = await verifyResult(labTech.token, order.id, {});
    expect(noResult.statusCode).toBe(400);

    const otherOrder = await makeLabOrder(p2Id, 'Thyroid Function', otherPharmacist);
    const outOfScope = await verifyResult(labTech.token, otherOrder.id, { result: 'Normal' });
    expect(outOfScope.statusCode).toBe(404);

    expect((await verifyResult(noPerm.token, order.id, { result: 'Normal' })).statusCode).toBe(403);
    expect((await labWorklist(noPerm.token)).statusCode).toBe(403);
  });
});
