import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser, makeFacility } from './helpers.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;
let national: { token: string };
let staff: { token: string };
let facilityId: string;
let otherFacilityId: string;
let patientId: string;
let otherPatientId: string;
let encounterId: string;

const PERMS = ['view_reports', 'view_dashboard', 'view_patient', 'write_clinical_note', 'create_patient', 'export_data'];
const auth = (t: string) => ({ authorization: `Bearer ${t}` });

const DAY = 24 * 60 * 60 * 1000;
const from = new Date(Date.now() - 30 * DAY).toISOString().slice(0, 10);
const to = new Date().toISOString().slice(0, 10);

beforeAll(async () => {
  app = await createTestApp();
  national = await makeUser({ roleCode: 'NATIONAL_ADMIN', scope: 'NATIONAL', permissions: PERMS });

  const facility = await makeFacility('Reports Test Facility (synthetic)');
  facilityId = facility.id;
  staff = await makeUser({ roleCode: 'HOSPITAL_ADMIN', facilityId, permissions: PERMS });

  // Register two patients (one at this facility, one at another) so facility
  // scoping can be asserted: the facility user must never see the other one.
  const p1 = await app.inject({ method: 'POST', url: '/api/v1/patients', headers: auth(staff.token), payload: { fullName: 'Reports Patient A (synthetic)', force: true } });
  patientId = p1.json().patient.id;

  const other = await makeFacility('Reports Other Facility (synthetic)');
  otherFacilityId = other.id;
  const otherUser = await makeUser({ roleCode: 'HOSPITAL_ADMIN', facilityId: otherFacilityId, permissions: PERMS });
  const p2 = await app.inject({ method: 'POST', url: '/api/v1/patients', headers: auth(otherUser.token), payload: { fullName: 'Reports Patient B (synthetic)', force: true } });
  otherPatientId = p2.json().patient.id;

  // Seed activity at the staff facility (all inside the report window).
  const enc = await db.encounter.create({ data: { patientId, facilityId, type: 'OPD', status: 'COMPLETED' } });
  encounterId = enc.id;
  await db.admission.create({ data: { patientId, facilityId, status: 'ADMITTED', admissionType: 'MATERNITY' } });
  await db.labOrder.create({ data: { encounterId, patientId, facilityId, test: 'Malaria RDT (synthetic)', discipline: 'MICROBIOLOGY', status: 'VERIFIED' } });
  await db.immunization.create({ data: { patientId, facilityId, vaccine: 'PENTA', dose: '3', administeredAt: new Date(), status: 'GIVEN' } });
  await db.diseaseCase.create({ data: { facilityId, disease: 'Malaria (synthetic)', caseType: 'CONFIRMED' } });
  await db.bed.create({ data: { facilityId, ward: 'Maternity Ward', bedNumber: 'R-01', status: 'OCCUPIED' } });
  await db.invoice.create({ data: { patientId, facilityId, amount: 120, paidAmount: 120, status: 'PAID' } });
  await db.referral.create({ data: { patientId, fromFacilityId: facilityId, toFacilityName: 'Receiving Hospital (synthetic)', status: 'SUBMITTED' } });

  // Activity at the OTHER facility (must stay invisible to the facility user).
  const enc2 = await db.encounter.create({ data: { patientId: otherPatientId, facilityId: otherFacilityId, type: 'OPD', status: 'COMPLETED' } });
  await db.labOrder.create({ data: { encounterId: enc2.id, patientId: otherPatientId, facilityId: otherFacilityId, test: 'FBC (synthetic)', discipline: 'HAEMATOLOGY' } });
});

afterAll(async () => {
  // Full cleanup — this file seeds real rows (including a bed numbered 'R-01'
  // and two facilities) that would otherwise leak into the shared test DB and
  // break later files' global lookups (e.g. units.test.ts).
  const facs = [facilityId, otherFacilityId];
  await db.bed.deleteMany({ where: { facilityId: { in: facs } } });
  await db.referral.deleteMany({ where: { fromFacilityId: { in: facs } } });
  await db.invoice.deleteMany({ where: { facilityId: { in: facs } } });
  await db.diseaseCase.deleteMany({ where: { facilityId: { in: facs } } });
  await db.immunization.deleteMany({ where: { facilityId: { in: facs } } });
  await db.labOrder.deleteMany({ where: { facilityId: { in: facs } } });
  await db.admission.deleteMany({ where: { facilityId: { in: facs } } });
  await db.encounter.deleteMany({ where: { facilityId: { in: facs } } });
  await db.patient.deleteMany({ where: { id: { in: [patientId, otherPatientId] } } });
  await db.facility.deleteMany({ where: { id: { in: facs } } });
  await db.$disconnect();
  await app.close();
});

describe('report indicators', () => {
  it('exposes the DHIMS-II catalog', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/reports/indicators', headers: auth(staff.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.indicators.length).toBeGreaterThan(20);
    const opd = body.indicators.find((i: { code: string }) => i.code === 'OPD_ATTENDANCE');
    expect(opd.dhims2Code).toBe('1A');
    expect(opd.collected).toBe(true);
    const anc = body.indicators.find((i: { code: string }) => i.code === 'ANC_REGISTRATIONS');
    expect(anc.collected).toBe(false);
  });

  it('computes live values within the facility scope', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/reports/summary?from=${from}&to=${to}`, headers: auth(staff.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    const byCode = new Map(body.indicators.map((i: { code: string; value: number | null }) => [i.code, i.value]));
    expect(byCode.get('OPD_ATTENDANCE')).toBe(1); // only this facility's encounter
    expect(byCode.get('OPD_NEW')).toBe(1);
    expect(byCode.get('ADMISSIONS')).toBe(1);
    expect(byCode.get('MATERNITY_ADMISSIONS')).toBe(1);
    expect(byCode.get('IMM_PENTA3')).toBe(1);
    expect(byCode.get('LAB_TESTS')).toBe(1);
    expect(byCode.get('DISEASE_CASES')).toBe(1);
    expect(byCode.get('CONFIRMED_CASES')).toBe(1);
    expect(byCode.get('REFERRALS_OUT')).toBe(1);
    expect(byCode.get('REVENUE')).toBe(120);
    expect(byCode.get('BED_OCCUPANCY_RATE')).toBe(100); // 1 of 1 occupied
    expect(byCode.get('CAESAREAN_SECTIONS')).toBeNull(); // not collected
  });

  it('keeps out-of-scope facility data out of the facility summary', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/reports/summary?from=${from}&to=${to}`, headers: auth(staff.token) });
    const byCode = new Map(res.json().indicators.map((i: { code: string; value: number | null }) => [i.code, i.value]));
    expect(byCode.get('OPD_ATTENDANCE')).toBe(1); // other facility's encounter excluded
  });

  it('national scope rolls up across facilities', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/reports/summary?from=${from}&to=${to}`, headers: auth(national.token) });
    expect(res.statusCode).toBe(200);
    const byCode = new Map(res.json().indicators.map((i: { code: string; value: number | null }) => [i.code, i.value]));
    expect((byCode.get('OPD_ATTENDANCE') ?? 0)).toBeGreaterThanOrEqual(2);
    expect((byCode.get('LAB_TESTS') ?? 0)).toBeGreaterThanOrEqual(2);
  });

  it('groups the breakdown by facility', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/reports/summary?from=${from}&to=${to}&groupBy=facility`, headers: auth(staff.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.groupBy).toBe('facility');
    expect(body.groups.length).toBe(1);
    expect(body.groups[0].indicators.OPD_ATTENDANCE).toBe(1);
    expect(body.groups[0].indicators.REVENUE).toBe(120);
  });

  it('rejects an over-long period', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/reports/summary?from=${from}&to=${new Date(Date.now() + 400 * DAY).toISOString().slice(0, 10)}`, headers: auth(staff.token) });
    expect(res.statusCode).toBe(400);
  });
});

describe('reporting completeness', () => {
  it('reports the facility as reporting when it has activity', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/reports/completeness?from=${from}&to=${to}`, headers: auth(staff.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.facilities.expected).toBe(1);
    expect(body.facilities.reported).toBe(1);
    expect(body.completenessPct).toBe(100);
    expect(body.rows[0].reported).toBe(true);
    expect(body.rows[0].activity).toContain('OPD encounters');
  });
});

describe('report export', () => {
  it('exports the indicator summary as CSV', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/reports/export?report=indicators&from=${from}&to=${to}`, headers: auth(staff.token) });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    const csv = res.body as string;
    expect(csv).toContain('OPD attendance');
    expect(csv).toContain('1A');
    expect(csv).toContain('Revenue collected');
  });

  it('exports completeness as CSV', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/reports/export?report=completeness&from=${from}&to=${to}`, headers: auth(staff.token) });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.body as string).toContain('Reports Test Facility');
  });
});
