import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser, type TestUser } from './helpers.js';
import type { FastifyInstance } from 'fastify';

// The appointments module (spec §13-§14): scope-aware booking (assertPatientAccess
// on the patient), idempotent creates, and guarded status transitions
// BOOKED → CONFIRMED → CHECKED_IN → COMPLETED/CANCELLED/MISSED. The queue
// routes in the same file are covered by queue.test.ts — these cover the
// appointment-specific endpoints.
let app: FastifyInstance;
let facilityUser: TestUser;
let regional: TestUser;
let national: TestUser;
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
const bookedIds: string[] = [];

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
  r1 = await createRegion('APT-1', 'Appointments Region One (synthetic)');
  r2 = await createRegion('APT-2', 'Appointments Region Two (synthetic)');
  d1 = await createDistrict('APT-1-01', 'Appointments District One (synthetic)', r1.id);
  d2 = await createDistrict('APT-2-01', 'Appointments District Two (synthetic)', r2.id);
  a1f = await createFacility('APT-1-F', 'Appointments Facility One (synthetic)', r1.id, d1.id);
  a2f = await createFacility('APT-2-F', 'Appointments Facility Two (synthetic)', r2.id, d2.id);

  const p1 = await db.patient.create({
    data: { mrn: 'APT-0001', fullName: 'Appointments Patient One (synthetic)', sex: 'F', facilityId: a1f.id, regionId: r1.id, districtId: d1.id, isSynthetic: true },
  });
  p1Id = p1.id;
  const p2 = await db.patient.create({
    data: { mrn: 'APT-0002', fullName: 'Appointments Patient Two (synthetic)', sex: 'M', facilityId: a2f.id, regionId: r2.id, districtId: d2.id, isSynthetic: true },
  });
  p2Id = p2.id;

  facilityUser = await makeUser({ email: 'apt-facility@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'FACILITY', facilityId: a1f.id, permissions: ['view_appointments', 'book_appointment', 'view_dashboard'] });
  regional = await makeUser({ email: 'apt-regional@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'REGIONAL', regionId: r1.id, permissions: ['view_appointments', 'book_appointment', 'view_dashboard'] });
  national = await makeUser({ email: 'apt-national@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'NATIONAL', permissions: ['view_appointments', 'book_appointment', 'view_dashboard'] });
  noPerm = await makeUser({ email: 'apt-noperm@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'NATIONAL', permissions: ['view_patient'] });
  userIds.push(facilityUser.userId, regional.userId, national.userId, noPerm.userId);

  app = await createTestApp();
});

afterAll(async () => {
  await db.appointment.deleteMany({ where: { id: { in: bookedIds } } });
  await db.patient.deleteMany({ where: { id: { in: [p1Id, p2Id] } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.facility.deleteMany({ where: { id: { in: [a1f.id, a2f.id] } } });
  await db.district.deleteMany({ where: { id: { in: [d1.id, d2.id] } } });
  await db.region.deleteMany({ where: { id: { in: [r1.id, r2.id] } } });
  await db.$disconnect();
  await app.close();
});

const auth = (t: string) => ({ authorization: `Bearer ${t}` });
const book = (t: string, payload: Record<string, unknown>) =>
  app.inject({ method: 'POST', url: '/api/v1/appointments', headers: auth(t), payload });
const list = (t: string, q = '') => app.inject({ method: 'GET', url: `/api/v1/appointments${q}`, headers: auth(t) });
const setStatus = (t: string, id: string, status: string) =>
  app.inject({ method: 'POST', url: `/api/v1/appointments/${id}/status`, headers: auth(t), payload: { status } });

describe('book an appointment', () => {
  it('creates a BOOKED appointment at the caller’s facility and audits it', async () => {
    const res = await book(facilityUser.token, { patientId: p1Id, scheduledFor: '2030-01-15', service: 'OPD', reason: 'Follow-up' });
    expect(res.statusCode).toBe(200);
    const { appointment, duplicated } = res.json();
    expect(duplicated).toBe(false);
    expect(appointment).toMatchObject({ patientId: p1Id, facilityId: a1f.id, service: 'OPD', reason: 'Follow-up', status: 'BOOKED' });
    bookedIds.push(appointment.id);
    const audit = await db.auditLog.findFirst({ where: { action: 'appointment.book', entityId: appointment.id } });
    expect(audit).toBeTruthy();
  });

  it('is idempotent under a repeated idempotencyKey', async () => {
    const first = await book(facilityUser.token, { patientId: p1Id, scheduledFor: '2030-01-16', service: 'OPD', idempotencyKey: 'apt-key-1' });
    expect(first.json().duplicated).toBe(false);
    bookedIds.push(first.json().appointment.id);
    const second = await book(facilityUser.token, { patientId: p1Id, scheduledFor: '2030-01-16', service: 'OPD', idempotencyKey: 'apt-key-1' });
    expect(second.statusCode).toBe(200);
    expect(second.json().duplicated).toBe(true);
    const count = await db.appointment.count({ where: { idempotencyKey: 'apt-key-1' } });
    expect(count).toBe(1);
  });

  it('refuses booking for a patient outside the caller’s scope', async () => {
    // p2 lives in region two; the facility user and the r1 regional user must 403.
    const fac = await book(facilityUser.token, { patientId: p2Id, scheduledFor: '2030-01-17', service: 'OPD' });
    expect(fac.statusCode).toBe(403);
    const reg = await book(regional.token, { patientId: p2Id, scheduledFor: '2030-01-17', service: 'OPD' });
    expect(reg.statusCode).toBe(403);
    // The national user may book for anyone.
    const nat = await book(national.token, { patientId: p2Id, scheduledFor: '2030-01-17', service: 'OPD' });
    expect(nat.statusCode).toBe(200);
    bookedIds.push(nat.json().appointment.id);
  });

  it('rejects callers without book_appointment', async () => {
    const res = await book(noPerm.token, { patientId: p1Id, scheduledFor: '2030-01-18', service: 'OPD' });
    expect(res.statusCode).toBe(403);
  });
});

describe('appointment status transitions', () => {
  it('walks BOOKED → CONFIRMED → CHECKED_IN → COMPLETED and audits each step', async () => {
    const created = await book(facilityUser.token, { patientId: p1Id, scheduledFor: '2030-01-20', service: 'OPD' });
    const id = created.json().appointment.id;
    bookedIds.push(id);
    for (const status of ['CONFIRMED', 'CHECKED_IN', 'COMPLETED']) {
      const res = await setStatus(facilityUser.token, id, status);
      expect(res.statusCode).toBe(200);
      expect(res.json().appointment.status).toBe(status);
      const audit = await db.auditLog.findFirst({ where: { action: 'appointment.status', entityId: id }, orderBy: { createdAt: 'desc' } });
      expect(audit?.after).toContain(`"status":"${status}"`);
    }
  });

  it('accepts CANCELLED and MISSED, rejects anything else', async () => {
    const created = await book(facilityUser.token, { patientId: p1Id, scheduledFor: '2030-01-21', service: 'OPD' });
    const id = created.json().appointment.id;
    bookedIds.push(id);
    for (const status of ['CANCELLED', 'MISSED']) {
      const res = await setStatus(facilityUser.token, id, status);
      expect(res.statusCode).toBe(200);
      expect(res.json().appointment.status).toBe(status);
    }
    const bad = await setStatus(facilityUser.token, id, 'NONSENSE');
    expect(bad.statusCode).toBe(400);
  });
});

describe('list appointments', () => {
  it('scopes the list to the caller (facility sees only its own)', async () => {
    const fac = await list(facilityUser.token);
    expect(fac.statusCode).toBe(200);
    const facIds = fac.json().items.map((a: { id: string }) => a.id);
    // All appointments at a1f (booked above) are visible; the a2f one is not.
    const own = bookedIds.filter((id) => facIds.includes(id));
    expect(own.length).toBeGreaterThanOrEqual(4);
    const nat = await list(national.token);
    const natIds = nat.json().items.map((a: { id: string }) => a.id);
    expect(natIds.length).toBeGreaterThan(facIds.length);
  });

  it('filters by date and status', async () => {
    const byDate = await list(facilityUser.token, '?date=2030-01-15');
    expect(byDate.json().items).toHaveLength(1);
    expect(byDate.json().items[0].status).toBe('BOOKED');
    const byStatus = await list(national.token, '?status=COMPLETED');
    expect(byStatus.json().items.length).toBeGreaterThanOrEqual(1);
    expect(byStatus.json().items.every((a: { status: string }) => a.status === 'COMPLETED')).toBe(true);
  });

  it('rejects callers without view_appointments', async () => {
    const res = await list(noPerm.token);
    expect(res.statusCode).toBe(403);
  });
});
