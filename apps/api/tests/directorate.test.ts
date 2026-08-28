import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser, type TestUser } from './helpers.js';
import type { FastifyInstance } from 'fastify';

// Health directorate dashboards (spec §57-§59, docs/22 Phase 5): the
// national-platform centerpiece. National users see all regions; regional
// users their districts; district users their facilities; drill-down follows
// region → district → facility. Aggregates only — never patient-identifiable
// data at the national/regional layer (spec §59).
let app: FastifyInstance;
let national: TestUser;
let regional: TestUser;
let district: TestUser;
let facilityUser: TestUser;
let noPerm: TestUser;

let r1: { id: string };
let r2: { id: string };
let d1: { id: string };
let d2: { id: string };
let d3: { id: string };
let a1f: { id: string };
let a2f: { id: string };
let b1f: { id: string };
let patientId = '';
let a1fRoleId = '';
const userIds: string[] = [];

async function createRegion(code: string, name: string) {
  return db.region.create({ data: { code, name, capital: 'Test Capital' } });
}

async function createDistrict(code: string, name: string, regionId: string) {
  return db.district.create({ data: { code, name, type: 'DISTRICT', regionId } });
}

async function createFacility(name: string, regionId: string, districtId: string) {
  return db.facility.create({
    data: {
      code: `DTA-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
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
  app = await createTestApp();
  // Two regions, three districts, three facilities — activity only in A1-F.
  r1 = await createRegion('DTA-R1', 'Directorate Region One (synthetic)');
  r2 = await createRegion('DTA-R2', 'Directorate Region Two (synthetic)');
  d1 = await createDistrict('DTA-R1-D1', 'Directorate District One (synthetic)', r1.id);
  d2 = await createDistrict('DTA-R1-D2', 'Directorate District Two (synthetic)', r1.id);
  d3 = await createDistrict('DTA-R2-D1', 'Directorate District Three (synthetic)', r2.id);
  a1f = await createFacility('Directorate Facility A1 (synthetic)', r1.id, d1.id);
  a2f = await createFacility('Directorate Facility A2 (synthetic)', r1.id, d2.id);
  b1f = await createFacility('Directorate Facility B1 (synthetic)', r2.id, d3.id);

  // Activity in A1-F so the roll-ups have something to aggregate.
  const patient = await db.patient.create({
    data: { mrn: 'DTA-0001', fullName: 'Directorate Patient (synthetic)', sex: 'F', facilityId: a1f.id, regionId: r1.id, districtId: d1.id, isSynthetic: true },
  });
  patientId = patient.id;
  const enc1 = await db.encounter.create({ data: { patientId: patient.id, facilityId: a1f.id, type: 'OPD', status: 'OPEN' } });
  await db.encounter.create({ data: { patientId: patient.id, facilityId: a1f.id, type: 'OPD', status: 'OPEN' } });
  await db.admission.create({ data: { patientId: patient.id, facilityId: a1f.id, reason: 'Observation', status: 'ADMITTED' } });
  await db.labOrder.create({ data: { encounterId: enc1.id, patientId: patient.id, facilityId: a1f.id, test: 'Malaria RDT', discipline: 'MICROBIOLOGY', status: 'ORDERED' } });
  await db.prescription.create({ data: { encounterId: enc1.id, patientId: patient.id, facilityId: a1f.id, medicine: 'Paracetamol', status: 'ACTIVE' } });
  await db.immunization.create({ data: { patientId: patient.id, facilityId: a1f.id, vaccine: 'PENTA', dose: '1', status: 'GIVEN', administeredAt: new Date() } });
  await db.diseaseCase.create({ data: { patientId: patient.id, facilityId: a1f.id, disease: 'Malaria', caseType: 'CONFIRMED', status: 'OPEN', isSynthetic: true } });
  await db.referral.create({ data: { patientId: patient.id, fromFacilityId: a1f.id, toFacilityName: 'Teaching Hospital', status: 'SUBMITTED' } });
  await db.invoice.create({ data: { patientId: patient.id, facilityId: a1f.id, items: JSON.stringify([{ description: 'Consultation', amount: 150 }]), amount: 150, paidAmount: 150, status: 'PAID' } });

  const VIEW = ['view_reports'];
  national = await makeUser({ email: 'dta-national@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'NATIONAL', permissions: VIEW });
  regional = await makeUser({ email: 'dta-regional@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'REGIONAL', regionId: r1.id, permissions: VIEW });
  district = await makeUser({ email: 'dta-district@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'DISTRICT', districtId: d1.id, permissions: VIEW });
  facilityUser = await makeUser({ email: 'dta-facility@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'FACILITY', facilityId: a1f.id, permissions: VIEW });
  noPerm = await makeUser({ email: 'dta-noperm@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'NATIONAL', permissions: ['view_patient'] });
  userIds.push(national.userId, regional.userId, district.userId, facilityUser.userId, noPerm.userId);
  const a1fUser = await db.user.findUnique({ where: { id: facilityUser.userId } });
  a1fRoleId = a1fUser!.roleId;
});

afterAll(async () => {
  // Children of the encounters first (LabOrder/Prescription reference the encounter).
  await db.labOrder.deleteMany({ where: { patientId } });
  await db.prescription.deleteMany({ where: { patientId } });
  await db.encounter.deleteMany({ where: { patientId } });
  await db.admission.deleteMany({ where: { patientId } });
  await db.immunization.deleteMany({ where: { patientId } });
  await db.diseaseCase.deleteMany({ where: { patientId } });
  await db.referral.deleteMany({ where: { patientId } });
  await db.invoice.deleteMany({ where: { patientId } });
  await db.patient.deleteMany({ where: { id: patientId } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.role.deleteMany({ where: { id: a1fRoleId } });
  await db.facility.deleteMany({ where: { id: { in: [a1f.id, a2f.id, b1f.id] } } });
  await db.district.deleteMany({ where: { id: { in: [d1.id, d2.id, d3.id] } } });
  await db.region.deleteMany({ where: { id: { in: [r1.id, r2.id] } } });
  await db.$disconnect();
  await app.close();
});

const auth = (t: string) => ({ authorization: `Bearer ${t}` });
const dir = (t: string, q = '') => app.inject({ method: 'GET', url: `/api/v1/directorate${q}`, headers: auth(t) });

interface Node {
  id: string;
  name: string;
  type: string;
  metrics: Record<string, number>;
  recentEncounters: number;
}
const node = (nodes: Node[], id: string) => nodes.find((n) => n.id === id)!;

describe('directorate — scope-aware roll-ups (spec §57)', () => {
  it('facility scope: a single facility node with its own metrics', async () => {
    const res = await dir(facilityUser.token);
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.level).toBe('FACILITY');
    expect(body.facilityName).toBe('Directorate Facility A1 (synthetic)');
    expect(body.nodes).toHaveLength(1);
    const f = node(body.nodes, a1f.id);
    expect(f.type).toBe('CLINIC');
    expect(f.metrics).toMatchObject({ facilities: 1, patients: 1, encounters: 2, admissions: 1, labPending: 1, prescriptionsActive: 1, immunizations: 1, diseaseCases: 1, referrals: 1, revenue: 150 });
    expect(f.recentEncounters).toBe(2);
  });

  it('district scope: only the district’s facilities, with the district named', async () => {
    const res = await dir(district.token);
    const body = res.json();
    expect(body.level).toBe('FACILITY');
    expect(body.districtName).toBe('Directorate District One (synthetic)');
    const ids = body.nodes.map((n: Node) => n.id);
    expect(ids).toEqual([a1f.id]);
  });

  it('regional scope: the region’s districts as nodes with rolled-up metrics', async () => {
    const res = await dir(regional.token);
    const body = res.json();
    expect(body.level).toBe('DISTRICT');
    expect(body.regionName).toBe('Directorate Region One (synthetic)');
    expect(body.nodes.map((n: Node) => n.id).sort()).toEqual([d1.id, d2.id].sort());
    const d1node = node(body.nodes, d1.id);
    expect(d1node.type).toBe('DISTRICT');
    expect(d1node.metrics).toMatchObject({ facilities: 1, patients: 1, encounters: 2, revenue: 150 });
    // The sibling district has no activity — zeroes, not missing keys.
    expect(node(body.nodes, d2.id).metrics).toMatchObject({ facilities: 1, patients: 0, encounters: 0, revenue: 0 });
  });

  it('regional drill-down into a district → facility level', async () => {
    const res = await dir(regional.token, `?districtId=${d1.id}`);
    const body = res.json();
    expect(body.level).toBe('FACILITY');
    expect(body.nodes.map((n: Node) => n.id)).toEqual([a1f.id]);
    expect(node(body.nodes, a1f.id).metrics.encounters).toBe(2);
  });

  it('national scope: all regions as nodes with rolled-up metrics', async () => {
    // The suite shares one SQLite DB across files, so other test files may have
    // left regions behind. Assert against the live region table — the contract
    // is that the national user sees EVERY region, not that the DB is empty.
    const allRegions = (await db.region.findMany({ select: { id: true } })).map((r) => r.id).sort();
    const res = await dir(national.token);
    const body = res.json();
    expect(body.level).toBe('NATIONAL');
    expect(body.nodes.map((n: Node) => n.id).sort()).toEqual(allRegions);
    const r1node = node(body.nodes, r1.id);
    expect(r1node.type).toBe('REGION');
    expect(r1node.metrics).toMatchObject({ facilities: 2, patients: 1, encounters: 2, revenue: 150 });
    expect(node(body.nodes, r2.id).metrics).toMatchObject({ facilities: 1, patients: 0, encounters: 0 });
  });

  it('national drill-down: region → districts, then district → facilities', async () => {
    const byRegion = await dir(national.token, `?regionId=${r1.id}`);
    const rb = byRegion.json();
    expect(rb.level).toBe('REGIONAL');
    expect(rb.nodes.map((n: Node) => n.id).sort()).toEqual([d1.id, d2.id].sort());
    expect(node(rb.nodes, d1.id).metrics.encounters).toBe(2);

    const byDistrict = await dir(national.token, `?districtId=${d1.id}`);
    const db2 = byDistrict.json();
    expect(db2.level).toBe('FACILITY');
    expect(db2.nodes.map((n: Node) => n.id)).toEqual([a1f.id]);
  });
});

describe('directorate — guards (spec §57-§59)', () => {
  it('refuses a district outside the user’s region (403)', async () => {
    const res = await dir(regional.token, `?districtId=${d3.id}`);
    expect(res.statusCode).toBe(403);
  });

  it('refuses callers without view_reports or view_dashboard', async () => {
    const res = await dir(noPerm.token);
    expect(res.statusCode).toBe(403);
  });

  it('aggregates only — no patient-identifiable data at the national layer (spec §59)', async () => {
    const res = await dir(national.token);
    const raw = JSON.stringify(res.json());
    expect(raw).not.toContain('Directorate Patient (synthetic)');
    expect(raw).not.toContain(patientId);
    // Node shape is strictly id/name/code/type/metrics/recentEncounters.
    for (const n of res.json().nodes) {
      expect(Object.keys(n).sort()).toEqual(['code', 'id', 'metrics', 'name', 'recentEncounters', 'type']);
    }
  });
});
