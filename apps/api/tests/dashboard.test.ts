import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser, type TestUser } from './helpers.js';
import type { FastifyInstance } from 'fastify';

// Operational dashboard aggregates (docs/22 Phase 5, spec §57): GET
// /dashboard/stats rolls up today's operational numbers scoped to the caller —
// facility users their facility, regional users their region (through the
// patient record), national users all data. The national master-data box
// (district/facility counts) is deliberately unscoped. Guards: view_dashboard.
let app: FastifyInstance;
let facility: TestUser;
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
let enc1Id = '';
const userIds: string[] = [];

const VIEW = ['view_dashboard', 'view_patient'];

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
  r1 = await createRegion('DSH-1', 'Dashboard Region One (synthetic)');
  r2 = await createRegion('DSH-2', 'Dashboard Region Two (synthetic)');
  d1 = await createDistrict('DSH-1-01', 'Dashboard District One (synthetic)', r1.id);
  d2 = await createDistrict('DSH-2-01', 'Dashboard District Two (synthetic)', r2.id);
  a1f = await createFacility('DSH-1-F', 'Dashboard Facility One (synthetic)', r1.id, d1.id);
  a2f = await createFacility('DSH-2-F', 'Dashboard Facility Two (synthetic)', r2.id, d2.id);

  // P1 lives in region one / facility one with a full day of operational data;
  // P2 lives in region two — it must be invisible to the facility and regional
  // (r1) callers but counted nationally.
  const p1 = await db.patient.create({
    data: { mrn: 'DSH-0001', fullName: 'Dashboard Patient One (synthetic)', sex: 'F', facilityId: a1f.id, regionId: r1.id, districtId: d1.id, isSynthetic: true },
  });
  p1Id = p1.id;
  const p2 = await db.patient.create({
    data: { mrn: 'DSH-0002', fullName: 'Dashboard Patient Two (synthetic)', sex: 'M', facilityId: a2f.id, regionId: r2.id, districtId: d2.id, isSynthetic: true },
  });
  p2Id = p2.id;

  const enc1 = await db.encounter.create({ data: { patientId: p1.id, facilityId: a1f.id, type: 'OPD', status: 'OPEN' } });
  enc1Id = enc1.id;
  await db.admission.create({ data: { patientId: p1.id, facilityId: a1f.id, reason: 'Observation', status: 'ADMITTED' } });
  await db.labOrder.create({ data: { encounterId: enc1.id, patientId: p1.id, facilityId: a1f.id, test: 'Malaria RDT', discipline: 'MICROBIOLOGY', status: 'ORDERED' } });
  await db.labOrder.create({ data: { encounterId: enc1.id, patientId: p1.id, facilityId: a1f.id, test: 'Blood culture', discipline: 'MICROBIOLOGY', status: 'VERIFIED', critical: true } });
  await db.prescription.create({ data: { encounterId: enc1.id, patientId: p1.id, facilityId: a1f.id, medicine: 'Paracetamol', status: 'ACTIVE' } });
  await db.invoice.create({ data: { patientId: p1.id, facilityId: a1f.id, items: JSON.stringify([{ description: 'Consultation', amount: 100 }]), amount: 100, paidAmount: 100, status: 'PAID' } });
  await db.queueEntry.create({ data: { facilityId: a1f.id, departmentId: 'none', ticket: 'OPD-001', patientId: p1.id, status: 'WAITING' } });
  await db.appointment.create({ data: { patientId: p1.id, facilityId: a1f.id, service: 'OPD', scheduledFor: new Date() } });

  facility = await makeUser({ email: 'dsh-facility@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'FACILITY', facilityId: a1f.id, permissions: VIEW });
  regional = await makeUser({ email: 'dsh-regional@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'REGIONAL', regionId: r1.id, permissions: VIEW });
  national = await makeUser({ email: 'dsh-national@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'NATIONAL', permissions: VIEW });
  noPerm = await makeUser({ email: 'dsh-noperm@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'NATIONAL', permissions: ['view_patient'] });
  userIds.push(facility.userId, regional.userId, national.userId, noPerm.userId);

  app = await createTestApp();
});

afterAll(async () => {
  // Children of the encounter first (LabOrder/Prescription reference it).
  await db.labOrder.deleteMany({ where: { encounterId: enc1Id } });
  await db.prescription.deleteMany({ where: { encounterId: enc1Id } });
  await db.encounter.deleteMany({ where: { id: enc1Id } });
  await db.admission.deleteMany({ where: { patientId: p1Id } });
  await db.invoice.deleteMany({ where: { patientId: p1Id } });
  await db.queueEntry.deleteMany({ where: { patientId: p1Id } });
  await db.appointment.deleteMany({ where: { patientId: p1Id } });
  await db.patient.deleteMany({ where: { id: { in: [p1Id, p2Id] } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.facility.deleteMany({ where: { id: { in: [a1f.id, a2f.id] } } });
  await db.district.deleteMany({ where: { id: { in: [d1.id, d2.id] } } });
  await db.region.deleteMany({ where: { id: { in: [r1.id, r2.id] } } });
  await db.$disconnect();
  await app.close();
});

const auth = (t: string) => ({ authorization: `Bearer ${t}` });
const stats = (t: string) => app.inject({ method: 'GET', url: '/api/v1/dashboard/stats', headers: auth(t) });

interface StatsBody {
  scope: string;
  facilityId: string | null;
  stats: {
    patientsToday: number;
    appointmentsToday: number;
    queueWaiting: number;
    activeAdmissions: number;
    encountersToday: number;
    labPending: number;
    prescriptionsActive: number;
    invoicesToday: number;
    revenueToday: number;
    criticalLabs: number;
    patientCount: number;
  };
  national: { districts: number; facilities: number };
  trend: { date: string; count: number }[];
  generatedAt: string;
}

describe('GET /dashboard/stats', () => {
  it('facility scope: today’s numbers for the caller’s facility only', async () => {
    const res = await stats(facility.token);
    expect(res.statusCode).toBe(200);
    const body = res.json() as StatsBody;
    expect(body.scope).toBe('FACILITY');
    expect(body.facilityId).toBe(a1f.id);
    expect(body.stats).toMatchObject({
      patientsToday: 1,
      encountersToday: 1,
      activeAdmissions: 1,
      labPending: 1,
      criticalLabs: 1,
      prescriptionsActive: 1,
      invoicesToday: 1,
      revenueToday: 100,
      queueWaiting: 1,
      appointmentsToday: 1,
      patientCount: 1, // P2 in the other facility is invisible
    });
  });

  it('regional scope: the region’s aggregates through the patient record, facilityId null', async () => {
    const res = await stats(regional.token);
    expect(res.statusCode).toBe(200);
    const body = res.json() as StatsBody;
    expect(body.scope).toBe('REGIONAL');
    expect(body.facilityId).toBeNull();
    // All of P1's activity is in region one, so the regional view equals the
    // facility view — and P2 (region two) stays out.
    expect(body.stats).toMatchObject({ encountersToday: 1, activeAdmissions: 1, labPending: 1, criticalLabs: 1, patientCount: 1 });
  });

  it('national scope: counts every region and reports the master-data totals', async () => {
    const res = await stats(national.token);
    expect(res.statusCode).toBe(200);
    const body = res.json() as StatsBody;
    expect(body.scope).toBe('NATIONAL');
    expect(body.facilityId).toBeNull();
    expect(body.stats.patientCount).toBeGreaterThanOrEqual(2); // P1 + P2
    expect(body.stats.patientsToday).toBeGreaterThanOrEqual(2);
    expect(body.national.districts).toBeGreaterThanOrEqual(2);
    expect(body.national.facilities).toBeGreaterThanOrEqual(2);
  });

  it('a narrower scope never shows a wider region’s patients', async () => {
    const fac = (await stats(facility.token)).json() as StatsBody;
    const reg = (await stats(regional.token)).json() as StatsBody;
    const nat = (await stats(national.token)).json() as StatsBody;
    expect(fac.stats.patientCount).toBe(reg.stats.patientCount);
    expect(nat.stats.patientCount).toBeGreaterThan(fac.stats.patientCount);
  });

  it('returns a 7-day ascending trend ending today', async () => {
    const body = (await stats(facility.token)).json() as StatsBody;
    expect(body.trend).toHaveLength(7);
    const dates = body.trend.map((t) => t.date);
    expect([...dates].sort()).toEqual(dates); // ascending
    expect(dates[6]).toBe(new Date().toISOString().slice(0, 10));
    expect(body.trend[6]!.count).toBe(1); // today's encounter
    expect(body.generatedAt).toBeTruthy();
  });

  it('rejects callers without view_dashboard', async () => {
    const res = await stats(noPerm.token);
    expect(res.statusCode).toBe(403);
  });

  it('rejects anonymous callers', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/dashboard/stats' });
    expect(res.statusCode).toBe(401);
  });
});
