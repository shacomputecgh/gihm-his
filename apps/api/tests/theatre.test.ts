import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser, type TestUser } from './helpers.js';
import type { FastifyInstance } from 'fastify';

// Theatre / surgery (spec §28): booking a case, recording informed consent
// (which gates pre-operative care), and progressing the case through the
// guarded flow BOOKED → SCHEDULED → PRE_OP → IN_PROGRESS → RECOVERY →
// COMPLETED. The happy path lives in clinical3.test.ts — these cover the
// scope boundaries, permission guards, validation and flow conflicts.
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
const bookingIds: string[] = [];

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
  r1 = await createRegion('THR-1', 'Theatre Region One (synthetic)');
  r2 = await createRegion('THR-2', 'Theatre Region Two (synthetic)');
  d1 = await createDistrict('THR-1-01', 'Theatre District One (synthetic)', r1.id);
  d2 = await createDistrict('THR-2-01', 'Theatre District Two (synthetic)', r2.id);
  a1f = await createFacility('THR-1-F', 'Theatre Facility One (synthetic)', r1.id, d1.id);
  a2f = await createFacility('THR-2-F', 'Theatre Facility Two (synthetic)', r2.id, d2.id);

  const p1 = await db.patient.create({
    data: { mrn: 'THR-0001', fullName: 'Theatre Patient One (synthetic)', sex: 'F', facilityId: a1f.id, regionId: r1.id, districtId: d1.id, isSynthetic: true },
  });
  p1Id = p1.id;
  const p2 = await db.patient.create({
    data: { mrn: 'THR-0002', fullName: 'Theatre Patient Two (synthetic)', sex: 'M', facilityId: a2f.id, regionId: r2.id, districtId: d2.id, isSynthetic: true },
  });
  p2Id = p2.id;

  facilityUser = await makeUser({ email: 'theatre-facility@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'FACILITY', facilityId: a1f.id, permissions: ['view_patient', 'write_clinical_note', 'manage_theatre', 'view_dashboard'] });
  otherFacility = await makeUser({ email: 'theatre-other@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'FACILITY', facilityId: a2f.id, permissions: ['view_patient', 'write_clinical_note', 'manage_theatre'] });
  // No view_patient / write_clinical_note / view_dashboard — the bookings list
  // allows view_dashboard, so a bare dashboard user must NOT pass that guard.
  noPerm = await makeUser({ email: 'theatre-noperm@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'NATIONAL', permissions: [] });
  userIds.push(facilityUser.userId, otherFacility.userId, noPerm.userId);

  app = await createTestApp();
});

afterAll(async () => {
  await db.surgicalBooking.deleteMany({ where: { id: { in: bookingIds } } });
  await db.patient.deleteMany({ where: { id: { in: [p1Id, p2Id] } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.facility.deleteMany({ where: { id: { in: [a1f.id, a2f.id] } } });
  await db.district.deleteMany({ where: { id: { in: [d1.id, d2.id] } } });
  await db.region.deleteMany({ where: { id: { in: [r1.id, r2.id] } } });
  await db.$disconnect();
  await app.close();
});

const auth = (t: string) => ({ authorization: `Bearer ${t}` });
const list = (t: string, q = '') => app.inject({ method: 'GET', url: `/api/v1/theatre/bookings${q}`, headers: auth(t) });
const book = (t: string, payload: Record<string, unknown>) =>
  app.inject({ method: 'POST', url: '/api/v1/theatre/bookings', headers: auth(t), payload });
const consent = (t: string, id: string, payload: Record<string, unknown>) =>
  app.inject({ method: 'POST', url: `/api/v1/theatre/bookings/${id}/consent`, headers: auth(t), payload });
const setStatus = (t: string, id: string, status: string) =>
  app.inject({ method: 'POST', url: `/api/v1/theatre/bookings/${id}/status`, headers: auth(t), payload: { status } });

describe('book a surgical case', () => {
  it('creates a BOOKED case at the caller’s facility and audits it', async () => {
    const res = await book(facilityUser.token, { patientId: p1Id, procedure: 'Appendicectomy (test)', theatre: 'Theatre 1', urgency: 'URGENT', scheduledFor: '2030-02-01' });
    expect(res.statusCode).toBe(200);
    const { booking } = res.json();
    expect(booking).toMatchObject({ patientId: p1Id, facilityId: a1f.id, procedure: 'Appendicectomy (test)', urgency: 'URGENT', status: 'BOOKED' });
    bookingIds.push(booking.id);
    const audit = await db.auditLog.findFirst({ where: { action: 'surgicalBooking.create', entityId: booking.id } });
    expect(audit).toBeTruthy();
  });

  it('validates required fields and the patient scope', async () => {
    const noPatient = await book(facilityUser.token, { procedure: 'Hernia repair (test)' });
    expect(noPatient.statusCode).toBe(400);
    const noProcedure = await book(facilityUser.token, { patientId: p1Id });
    expect(noProcedure.statusCode).toBe(400);
    // p2 lives in region two — the a1f facility user must be denied.
    const outOfScope = await book(facilityUser.token, { patientId: p2Id, procedure: 'Cholecystectomy (test)' });
    expect(outOfScope.statusCode).toBe(403);
  });

  it('rejects callers without write_clinical_note / manage_theatre', async () => {
    const res = await book(noPerm.token, { patientId: p1Id, procedure: 'Knee replacement (test)' });
    expect(res.statusCode).toBe(403);
  });
});

describe('informed consent', () => {
  it('records consent, and records a refusal without a date', async () => {
    const created = await book(facilityUser.token, { patientId: p1Id, procedure: 'Cataract surgery (test)' });
    const id = created.json().booking.id;
    bookingIds.push(id);

    const ok = await consent(facilityUser.token, id, { consentObtained: true, consentNote: 'Explained risks' });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().booking.consentObtained).toBe(true);
    expect(ok.json().booking.consentDate).toBeTruthy();

    const refused = await consent(facilityUser.token, id, { consentObtained: false, consentNote: 'Patient declined' });
    expect(refused.statusCode).toBe(200);
    expect(refused.json().booking.consentObtained).toBe(false);
    expect(refused.json().booking.consentDate).toBeNull();
  });

  it('refuses consent on an out-of-scope booking', async () => {
    const other = await book(otherFacility.token, { patientId: p2Id, procedure: 'Caesarean section (test)' });
    const id = other.json().booking.id;
    bookingIds.push(id);
    const res = await consent(facilityUser.token, id, { consentObtained: true });
    expect(res.statusCode).toBe(404);
  });
});

describe('case progression', () => {
  it('walks BOOKED → SCHEDULED → PRE_OP → IN_PROGRESS → RECOVERY → COMPLETED', async () => {
    const created = await book(facilityUser.token, { patientId: p1Id, procedure: 'Hysterectomy (test)' });
    const id = created.json().booking.id;
    bookingIds.push(id);
    await consent(facilityUser.token, id, { consentObtained: true });
    for (const status of ['SCHEDULED', 'PRE_OP', 'IN_PROGRESS', 'RECOVERY', 'COMPLETED']) {
      const res = await setStatus(facilityUser.token, id, status);
      expect(res.statusCode).toBe(200);
      expect(res.json().booking.status).toBe(status);
    }
    // Terminal state — no further transitions.
    const again = await setStatus(facilityUser.token, id, 'IN_PROGRESS');
    expect(again.statusCode).toBe(409);
  });

  it('refuses PRE_OP until consent is recorded', async () => {
    const created = await book(facilityUser.token, { patientId: p1Id, procedure: 'Tonsillectomy (test)' });
    const id = created.json().booking.id;
    bookingIds.push(id);
    const res = await setStatus(facilityUser.token, id, 'PRE_OP');
    expect(res.statusCode).toBe(409);
  });

  it('rejects a jump that skips stages', async () => {
    const created = await book(facilityUser.token, { patientId: p1Id, procedure: 'Mastectomy (test)' });
    const id = created.json().booking.id;
    bookingIds.push(id);
    const res = await setStatus(facilityUser.token, id, 'IN_PROGRESS');
    expect(res.statusCode).toBe(409);
  });

  it('refuses to progress an out-of-scope booking', async () => {
    const other = await book(otherFacility.token, { patientId: p2Id, procedure: 'Prostatectomy (test)' });
    const id = other.json().booking.id;
    bookingIds.push(id);
    const res = await setStatus(facilityUser.token, id, 'SCHEDULED');
    expect(res.statusCode).toBe(404);
  });
});

describe('list bookings', () => {
  it('scopes the list to the caller’s facility', async () => {
    const res = await list(facilityUser.token);
    expect(res.statusCode).toBe(200);
    const ids = res.json().items.map((b: { id: string }) => b.id);
    // All bookings above at a1f are visible; the a2f ones are not.
    expect(ids.length).toBeGreaterThanOrEqual(4);
    const other = await list(otherFacility.token);
    const otherIds = other.json().items.map((b: { id: string }) => b.id);
    expect(otherIds.some((id: string) => ids.includes(id))).toBe(false);
  });

  it('filters by status and urgency and returns a byStatus summary', async () => {
    const completed = await list(facilityUser.token, '?status=COMPLETED');
    expect(completed.json().items.length).toBeGreaterThanOrEqual(1);
    expect(completed.json().items.every((b: { status: string }) => b.status === 'COMPLETED')).toBe(true);
    const urgent = await list(facilityUser.token, '?urgency=URGENT');
    expect(urgent.json().items.every((b: { urgency: string }) => b.urgency === 'URGENT')).toBe(true);
    const byStatus = completed.json().byStatus as Record<string, number>;
    expect(byStatus.COMPLETED).toBeGreaterThanOrEqual(1);
  });

  it('rejects callers without view_patient / write_clinical_note / view_dashboard', async () => {
    const res = await list(noPerm.token);
    expect(res.statusCode).toBe(403);
  });
});
