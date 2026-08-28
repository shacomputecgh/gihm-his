import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser, makeFacility } from './helpers.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;
let staff: { token: string };
let facilityId: string;
let regionId: string;

const PERMS = ['view_patient', 'create_patient', 'write_clinical_note', 'manage_stock', 'view_financial', 'view_clinical_record', 'view_dashboard'];

beforeAll(async () => {
  app = await createTestApp();
  const facility = await makeFacility('Clinical2 Test Facility (synthetic)');
  facilityId = facility.id;
  regionId = facility.regionId;
  staff = await makeUser({ email: 'clinical2-staff@demo.gh', roleCode: 'HOSPITAL_ADMIN', facilityId, permissions: PERMS });
});
afterAll(async () => {
  await db.$disconnect();
  await app.close();
});

const auth = (t: string) => ({ authorization: `Bearer ${t}` });

async function makePatient(name = `Clinical2 Patient (synthetic)`) {
  const res = await app.inject({ method: 'POST', url: '/api/v1/patients', headers: auth(staff.token), payload: { fullName: name, force: true } });
  return (res.json().patient as { id: string; mrn: string }).id;
}

describe('inventory', () => {
  it('creates a stock item and lists it with low/out flags', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/inventory/stock', headers: auth(staff.token), payload: { name: 'Paracetamol 500mg (test)', quantity: 5, reorderLevel: 10 } });
    expect(res.statusCode).toBe(200);
    const item = res.json().item;
    const list = await app.inject({ method: 'GET', url: '/api/v1/inventory/stock', headers: auth(staff.token) });
    const body = list.json();
    expect(body.items.length).toBeGreaterThan(0);
    const row = body.items.find((i: { id: string }) => i.id === item.id);
    expect(row.low).toBe(true); // 5 <= reorder 10
  });

  it('receives stock and writes a movement audit trail', async () => {
    const created = await app.inject({ method: 'POST', url: '/api/v1/inventory/stock', headers: auth(staff.token), payload: { name: 'ORS Sachets (test)', quantity: 20, reorderLevel: 5 } });
    const item = created.json().item;
    const res = await app.inject({ method: 'POST', url: `/api/v1/inventory/stock/${item.id}/receive`, headers: auth(staff.token), payload: { quantity: 30, note: 'Test receipt' } });
    expect(res.statusCode).toBe(200);
    expect(res.json().item.quantity).toBe(50);
    const movements = await app.inject({ method: 'GET', url: `/api/v1/inventory/stock/${item.id}/movements`, headers: auth(staff.token) });
    const body = movements.json();
    expect(body.movements.length).toBe(1); // the receipt
    expect(body.movements[0].type).toBe('RECEIPT');
  });

  it('rejects an adjustment that would drive stock negative', async () => {
    const created = await app.inject({ method: 'POST', url: '/api/v1/inventory/stock', headers: auth(staff.token), payload: { name: 'Small Stock (test)', quantity: 2, reorderLevel: 1 } });
    const item = created.json().item;
    const res = await app.inject({ method: 'POST', url: `/api/v1/inventory/stock/${item.id}/adjust`, headers: auth(staff.token), payload: { delta: -5 } });
    expect(res.statusCode).toBe(400);
  });
});

describe('referrals', () => {
  it('creates a referral and lists it as outgoing', async () => {
    const patientId = await makePatient('Referral Patient A (synthetic)');
    const receiving = await makeFacility('Receiving Hospital (synthetic)');
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/referrals',
      headers: auth(staff.token),
      payload: { patientId, toFacilityId: receiving.id, specialty: 'Cardiology', urgency: 'URGENT', summary: 'Test referral' },
    });
    expect(res.statusCode).toBe(200);
    const referral = res.json().referral;
    expect(referral.status).toBe('SUBMITTED');
    expect(referral.toFacilityName).toBe('Receiving Hospital (synthetic)');

    const list = await app.inject({ method: 'GET', url: '/api/v1/referrals?direction=outgoing', headers: auth(staff.token) });
    const body = list.json();
    expect(body.items.some((r: { id: string }) => r.id === referral.id)).toBe(true);
  });

  it('transitions referral status through the allowed flow, role-aware', async () => {
    const patientId = await makePatient('Referral Patient B (synthetic)');
    const receiving = await makeFacility('Transition Hospital (synthetic)');
    // The receiving facility's own staff — only they may receive/accept.
    const receiver = await makeUser({ roleCode: 'HOSPITAL_ADMIN', facilityId: receiving.id, permissions: PERMS });
    const created = await app.inject({ method: 'POST', url: '/api/v1/referrals', headers: auth(staff.token), payload: { patientId, toFacilityId: receiving.id, urgency: 'ROUTINE' } });
    const referral = created.json().referral;

    // SUBMITTED cannot jump to ACCEPTED directly (flow guard).
    const accept = await app.inject({ method: 'POST', url: `/api/v1/referrals/${referral.id}/status`, headers: auth(staff.token), payload: { status: 'ACCEPTED' } });
    expect(accept.statusCode).toBe(409);

    // The SENDING facility may not mark its own referral received (role guard).
    const senderRecv = await app.inject({ method: 'POST', url: `/api/v1/referrals/${referral.id}/status`, headers: auth(staff.token), payload: { status: 'RECEIVED' } });
    expect(senderRecv.statusCode).toBe(403);

    // The receiving facility receives, then accepts — with a note + timestamp.
    const recv = await app.inject({ method: 'POST', url: `/api/v1/referrals/${referral.id}/status`, headers: auth(receiver.token), payload: { status: 'RECEIVED', note: 'Patient received in casualty' } });
    expect(recv.statusCode).toBe(200);
    expect(recv.json().referral.status).toBe('RECEIVED');
    expect(recv.json().referral.receivedAt).toBeTruthy();
    expect(recv.json().referral.note).toBe('Patient received in casualty');

    const accept2 = await app.inject({ method: 'POST', url: `/api/v1/referrals/${referral.id}/status`, headers: auth(receiver.token), payload: { status: 'ACCEPTED' } });
    expect(accept2.statusCode).toBe(200);
    expect(accept2.json().referral.acceptedAt).toBeTruthy();

    // The receiving facility cannot complete the referral — only the sender can.
    const receiverDone = await app.inject({ method: 'POST', url: `/api/v1/referrals/${referral.id}/status`, headers: auth(receiver.token), payload: { status: 'COMPLETED' } });
    expect(receiverDone.statusCode).toBe(403);

    const done = await app.inject({ method: 'POST', url: `/api/v1/referrals/${referral.id}/status`, headers: auth(staff.token), payload: { status: 'COMPLETED' } });
    expect(done.statusCode).toBe(200);
    expect(done.json().referral.status).toBe('COMPLETED');
    expect(done.json().referral.completedAt).toBeTruthy();
  });

  it('assigns an ambulance for transport and releases it on arrival', async () => {
    const patientId = await makePatient('Referral Transport Patient (synthetic)');
    const receiving = await makeFacility('Transport Receiving Hospital (synthetic)');
    const receiver = await makeUser({ roleCode: 'HOSPITAL_ADMIN', facilityId: receiving.id, permissions: PERMS });
    const ambulance = await db.ambulance.create({ data: { facilityId: receiving.id, registration: `GV-${Math.random().toString(36).slice(2, 7).toUpperCase()}-T`, status: 'AVAILABLE' } });
    const created = await app.inject({ method: 'POST', url: '/api/v1/referrals', headers: auth(staff.token), payload: { patientId, toFacilityId: receiving.id, urgency: 'URGENT' } });
    const referral = created.json().referral;

    const recv = await app.inject({ method: 'POST', url: `/api/v1/referrals/${referral.id}/status`, headers: auth(receiver.token), payload: { status: 'RECEIVED' } });
    expect(recv.statusCode).toBe(200);
    const accept = await app.inject({ method: 'POST', url: `/api/v1/referrals/${referral.id}/status`, headers: auth(receiver.token), payload: { status: 'ACCEPTED' } });
    expect(accept.statusCode).toBe(200);

    // Assign the receiving fleet's ambulance when transport starts.
    const awaitT = await app.inject({ method: 'POST', url: `/api/v1/referrals/${referral.id}/status`, headers: auth(receiver.token), payload: { status: 'AWAITING_TRANSPORT', ambulanceId: ambulance.id } });
    expect(awaitT.statusCode).toBe(200);
    expect(awaitT.json().referral.ambulanceId).toBe(ambulance.id);
    expect((await db.ambulance.findUnique({ where: { id: ambulance.id } }))?.status).toBe('ASSIGNED');

    const transit = await app.inject({ method: 'POST', url: `/api/v1/referrals/${referral.id}/status`, headers: auth(receiver.token), payload: { status: 'IN_TRANSIT' } });
    expect(transit.statusCode).toBe(200);
    expect((await db.ambulance.findUnique({ where: { id: ambulance.id } }))?.status).toBe('TRANSPORTING');

    // Arrival releases the ambulance back to the fleet.
    const arrived = await app.inject({ method: 'POST', url: `/api/v1/referrals/${referral.id}/status`, headers: auth(receiver.token), payload: { status: 'ARRIVED' } });
    expect(arrived.statusCode).toBe(200);
    expect((await db.ambulance.findUnique({ where: { id: ambulance.id } }))?.status).toBe('AVAILABLE');

    // A busy ambulance cannot be assigned to a second referral.
    const second = await app.inject({ method: 'POST', url: '/api/v1/referrals', headers: auth(staff.token), payload: { patientId, toFacilityId: receiving.id, urgency: 'ROUTINE' } });
    const secondId = second.json().referral.id;
    await app.inject({ method: 'POST', url: `/api/v1/referrals/${secondId}/status`, headers: auth(receiver.token), payload: { status: 'RECEIVED' } });
    await app.inject({ method: 'POST', url: `/api/v1/referrals/${secondId}/status`, headers: auth(receiver.token), payload: { status: 'ACCEPTED' } });
    await db.ambulance.update({ where: { id: ambulance.id }, data: { status: 'ASSIGNED' } });
    const conflict = await app.inject({ method: 'POST', url: `/api/v1/referrals/${secondId}/status`, headers: auth(receiver.token), payload: { status: 'AWAITING_TRANSPORT', ambulanceId: ambulance.id } });
    expect(conflict.statusCode).toBe(409);
  });
});

describe('regional scope (facility-tagged entities without a patient relation)', () => {
  it('lets a regional director list stock and beds without a Prisma 500', async () => {
    const regional = await makeUser({ email: 'clinical2-regional@demo.gh', roleCode: 'REGIONAL_DIRECTOR', scope: 'REGIONAL', regionId, permissions: ['manage_stock', 'view_patient', 'view_financial'] });
    const stock = await app.inject({ method: 'GET', url: '/api/v1/inventory/stock', headers: auth(regional.token) });
    expect(stock.statusCode).toBe(200);
    expect(Array.isArray(stock.json().items)).toBe(true);
    const beds = await app.inject({ method: 'GET', url: '/api/v1/beds', headers: auth(regional.token) });
    expect(beds.statusCode).toBe(200);
    expect(Array.isArray(beds.json().items)).toBe(true);
    // Out-of-region stock must not be visible.
    const otherRegion = await db.region.create({ data: { code: `TST2-${Math.random().toString(36).slice(2, 8)}`, name: 'Other Test Region (synthetic)', capital: 'X' } });
    const otherDistrict = await db.district.create({ data: { code: `TST2-D-${Math.random().toString(36).slice(2, 8)}`, name: 'Other Test District (synthetic)', type: 'DISTRICT', regionId: otherRegion.id } });
    const other = await db.facility.create({
      data: {
        code: `TST2-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, name: 'Other Region Facility (synthetic)', type: 'CLINIC', level: 'PRIMARY', ownership: 'PRIVATE',
        regionId: otherRegion.id, districtId: otherDistrict.id, services: '["OPD"]', departmentsJson: '[]', openingHours: '{}', isSynthetic: true, status: 'ACTIVE',
      },
    });
    try {
      await db.stockItem.create({ data: { facilityId: other.id, name: 'Out-of-region item (synthetic)', quantity: 5, reorderLevel: 1 } });
      const names = stock.json().items.map((i: { name: string }) => i.name);
      expect(names).not.toContain('Out-of-region item (synthetic)');
    } finally {
      // Never leak geography rows into the shared test DB (other files, e.g.
      // the directorate national view, assert on the live region table).
      await db.stockItem.deleteMany({ where: { facilityId: other.id } });
      await db.facility.deleteMany({ where: { id: other.id } });
      await db.district.deleteMany({ where: { id: otherDistrict.id } });
      await db.region.deleteMany({ where: { id: otherRegion.id } });
    }
  });
});

describe('beds', () => {
  it('lists the bed board with ward summary', async () => {
    await db.bed.create({ data: { facilityId, ward: 'Male Medical Ward', bedNumber: 'M-01', status: 'AVAILABLE' } });
    await db.bed.create({ data: { facilityId, ward: 'Male Medical Ward', bedNumber: 'M-02', status: 'OCCUPIED' } });
    const res = await app.inject({ method: 'GET', url: '/api/v1/beds', headers: auth(staff.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items.length).toBe(2);
    expect(body.wards).toContain('Male Medical Ward');
    const summary = body.summary.find((s: { ward: string }) => s.ward === 'Male Medical Ward');
    expect(summary.occupied).toBe(1);
  });

  it('assigns a patient to a bed and creates an admission', async () => {
    const patientId = await makePatient('Bed Patient (synthetic)');
    const bed = await db.bed.findFirst({ where: { facilityId, bedNumber: 'M-01' } });
    const res = await app.inject({ method: 'POST', url: `/api/v1/beds/${bed!.id}/assign`, headers: auth(staff.token), payload: { patientId } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.bed.status).toBe('OCCUPIED');
    expect(body.admission.status).toBe('ADMITTED');
    const updated = await db.bed.findUnique({ where: { id: bed!.id } });
    expect(updated?.patientId).toBe(patientId);
  });

  it('refuses to free a bed whose patient still has an active admission', async () => {
    const patientId = await makePatient('Bed Patient 2 (synthetic)');
    const bed = await db.bed.create({ data: { facilityId, ward: 'ICU', bedNumber: 'I-01', status: 'OCCUPIED', patientId } });
    await db.admission.create({ data: { patientId, facilityId, ward: 'ICU', bed: 'I-01', status: 'ADMITTED' } });
    const res = await app.inject({ method: 'POST', url: `/api/v1/beds/${bed.id}/status`, headers: auth(staff.token), payload: { status: 'AVAILABLE' } });
    expect(res.statusCode).toBe(409);
  });
});
