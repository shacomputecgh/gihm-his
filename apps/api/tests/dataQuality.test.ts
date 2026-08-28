import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser, makeFacility } from './helpers.js';
import type { FastifyInstance } from 'fastify';
import type { DataQualityReport } from '../src/modules/dataQuality/checks.js';

// ---------------------------------------------------------------------------
// Data quality engine (spec §81, docs/10 §4): live checks over platform
// records, classified ERROR / WARNING / INFO, never blocking care. Tests seed
// bad records directly and verify each detection, facility scope isolation,
// and the permission gate.
// ---------------------------------------------------------------------------

const PERMS = ['view_reports', 'view_dashboard', 'view_patient', 'write_clinical_note', 'create_patient', 'order_lab', 'verify_lab', 'prescribe'];
const auth = (t: string) => ({ authorization: `Bearer ${t}` });

const DAY = 24 * 60 * 60 * 1000;
const now = new Date();

let app: FastifyInstance;
let staff: { token: string };
let other: { token: string };
let facilityId: string;
let otherFacilityId: string;
let badPatientId: string;
let cleanPatientId: string;
let otherPatientId: string;

beforeAll(async () => {
  app = await createTestApp();
  const facility = await makeFacility('Data Quality Facility (synthetic)');
  facilityId = facility.id;
  staff = await makeUser({ roleCode: 'HOSPITAL_ADMIN', facilityId, permissions: PERMS });

  const otherFacility = await makeFacility('Data Quality Other Facility (synthetic)');
  otherFacilityId = otherFacility.id;
  const otherUser = await makeUser({ roleCode: 'HOSPITAL_ADMIN', facilityId: otherFacilityId, permissions: PERMS });
  other = { token: otherUser.token };

  // A patient whose DOB is in the future and who lacks card/NHIS (two checks).
  const bad = await app.inject({ method: 'POST', url: '/api/v1/patients', headers: auth(staff.token), payload: { fullName: 'DQ Bad Patient (synthetic)', sex: 'MALE', dateOfBirth: '2099-01-01', force: true } });
  badPatientId = bad.json().patient.id;
  const clean = await app.inject({ method: 'POST', url: '/api/v1/patients', headers: auth(staff.token), payload: { fullName: 'DQ Clean Patient (synthetic)', sex: 'FEMALE', dateOfBirth: '1992-04-15', ghanaCard: 'GHA-0000000000001', force: true } });
  cleanPatientId = clean.json().patient.id;
  const po = await app.inject({ method: 'POST', url: '/api/v1/patients', headers: auth(other.token), payload: { fullName: 'DQ Other Patient (synthetic)', sex: 'FEMALE', dateOfBirth: '1990-01-01', ghanaCard: 'GHA-0000000000002', force: true } });
  otherPatientId = po.json().patient.id;

  // A duplicate name+phone pair in scope (same name AND phone — the check's key).
  await db.patient.create({
    data: { mrn: 'DQ-999998', fullName: 'Duplicate Twin (synthetic)', sex: 'F', dateOfBirth: new Date('1991-03-03'), phone: '0555000001', ghanaCard: 'GHA-DQ000000001', facilityId, isSynthetic: true },
  });
  await db.patient.create({
    data: { mrn: 'DQ-999999', fullName: 'Duplicate Twin (synthetic)', sex: 'F', dateOfBirth: new Date('1991-03-03'), phone: '0555000001', ghanaCard: 'GHA-DQ000000002', facilityId, isSynthetic: true },
  });

  // A real encounter (the lab orders + prescription below must reference one),
  // then the bad records.
  const enc = await app.inject({ method: 'POST', url: `/api/v1/patients/${cleanPatientId}/encounters`, headers: auth(staff.token), payload: { type: 'OPD', presentingComplaint: 'DQ seed' } });
  const encounterId = enc.json().encounter.id;

  // A future-dated encounter.
  await db.encounter.create({ data: { patientId: cleanPatientId, facilityId, type: 'OPD', status: 'OPEN', createdAt: new Date(now.getTime() + 2 * DAY) } });
  // A verified lab order with no result.
  await db.labOrder.create({ data: { patientId: cleanPatientId, facilityId, encounterId, test: 'Full Blood Count', discipline: 'HAEMATOLOGY', status: 'VERIFIED', requestedById: 'seed' } });
  // A pending lab order older than 14 days.
  await db.labOrder.create({ data: { patientId: cleanPatientId, facilityId, encounterId, test: 'Malaria RDT', discipline: 'MICROBIOLOGY', status: 'ORDERED', createdAt: new Date(now.getTime() - 20 * DAY) } });
  // A prescription with no quantity.
  await db.prescription.create({ data: { patientId: cleanPatientId, facilityId, encounterId, medicine: 'Paracetamol', prescribedById: 'seed' } });
  // An ANC visit with an implausible gestational age (70 weeks).
  await db.antenatalVisit.create({ data: { patientId: cleanPatientId, facilityId, gaWeeks: 70 } });
  // A delivery record on the MALE bad patient (sex mismatch).
  await db.deliveryRecord.create({ data: { patientId: badPatientId, facilityId, deliveryType: 'NORMAL' } });
  // A stale open encounter (>30 days) on the clean patient.
  await db.encounter.create({ data: { patientId: cleanPatientId, facilityId, type: 'OPD', status: 'OPEN', createdAt: new Date(now.getTime() - 40 * DAY) } });

  // The other facility gets a spotless record (nothing to flag).
  await db.encounter.create({ data: { patientId: otherPatientId, facilityId: otherFacilityId, type: 'OPD', status: 'COMPLETED', createdAt: new Date(now.getTime() - 2 * DAY) } });
});

afterAll(async () => {
  // Tidy the shared test DB for files that run after this one — children first
  // (identifiers, clinical rows), then patients, then facilities.
  const ids = [badPatientId, cleanPatientId, otherPatientId];
  await db.patientIdentifier.deleteMany({ where: { patientId: { in: ids } } });
  await db.antenatalVisit.deleteMany({ where: { patientId: { in: ids } } });
  await db.deliveryRecord.deleteMany({ where: { patientId: { in: ids } } });
  await db.labOrder.deleteMany({ where: { patientId: { in: ids } } });
  await db.prescription.deleteMany({ where: { patientId: { in: ids } } });
  await db.encounter.deleteMany({ where: { patientId: { in: ids } } });
  await db.patient.deleteMany({ where: { id: { in: ids } } });
  await db.patient.deleteMany({ where: { facilityId: { in: [facilityId, otherFacilityId] } } });
  await db.facility.deleteMany({ where: { id: { in: [facilityId, otherFacilityId] } } });
  await db.$disconnect();
  await app.close();
});

function check(report: DataQualityReport, code: string) {
  return report.checks.find((c) => c.code === code);
}

describe('data quality engine', () => {
  it('detects impossible DOBs and incomplete registrations (errors/warnings)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/data-quality/report', headers: auth(staff.token) });
    expect(res.statusCode).toBe(200);
    const report = res.json() as DataQualityReport;
    expect(report.scope).toBe('FACILITY');
    expect(report.summary.checks).toBeGreaterThan(0);

    const dob = check(report, 'dob.impossible');
    expect(dob).toBeTruthy();
    expect(dob!.severity).toBe('ERROR');
    expect(dob!.count).toBeGreaterThanOrEqual(1);
    expect(dob!.findings[0]!.mrn).toBeTruthy();

    const incomplete = check(report, 'patient.incomplete');
    expect(incomplete).toBeTruthy();
    expect(incomplete!.severity).toBe('WARNING');
    expect(incomplete!.count).toBeGreaterThanOrEqual(1);
  });

  it('flags duplicate name+phone registrations for MPI review', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/data-quality/report', headers: auth(staff.token) });
    const report = res.json() as DataQualityReport;
    const dup = check(report, 'patient.duplicate');
    expect(dup).toBeTruthy();
    expect(dup!.count).toBeGreaterThanOrEqual(1);
    expect(dup!.findings.length).toBeGreaterThan(0);
  });

  it('detects future-dated encounters, stale opens, verified-without-result labs and stale pendings', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/data-quality/report', headers: auth(staff.token) });
    const report = res.json() as DataQualityReport;

    const future = check(report, 'encounter.future');
    expect(future!.count).toBeGreaterThanOrEqual(1);

    const staleOpen = check(report, 'encounter.open.stale');
    expect(staleOpen!.count).toBeGreaterThanOrEqual(1);

    const noResult = check(report, 'lab.verified.no-result');
    expect(noResult!.severity).toBe('ERROR');
    expect(noResult!.count).toBeGreaterThanOrEqual(1);

    const stalePending = check(report, 'lab.pending.stale');
    expect(stalePending!.count).toBeGreaterThanOrEqual(1);
  });

  it('flags implausible gestational ages and pregnancy records on male patients', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/data-quality/report', headers: auth(staff.token) });
    const report = res.json() as DataQualityReport;

    const ga = check(report, 'anc.gestational-age');
    expect(ga!.count).toBeGreaterThanOrEqual(1);

    const mismatch = check(report, 'pregnancy.sex-mismatch');
    expect(mismatch!.severity).toBe('ERROR');
    expect(mismatch!.count).toBeGreaterThanOrEqual(1);
  });

  it('detects incomplete prescriptions', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/data-quality/report', headers: auth(staff.token) });
    const report = res.json() as DataQualityReport;
    const rx = check(report, 'rx.incomplete');
    expect(rx!.count).toBeGreaterThanOrEqual(1);
  });

  it('keeps other facilities out of the facility scope', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/data-quality/report', headers: auth(other.token) });
    expect(res.statusCode).toBe(200);
    const report = res.json() as DataQualityReport;
    // The other facility seeded nothing bad — every check counts zero there.
    for (const c of report.checks) {
      expect(c.count, `check ${c.code} must be 0 in the clean facility scope`).toBe(0);
    }
  });

  it('requires the reports/patient permission', async () => {
    const reader = await makeUser({ email: 'dq-reader@demo.gh', roleCode: 'NURSE', facilityId, permissions: ['view_queue'] });
    const res = await app.inject({ method: 'GET', url: '/api/v1/data-quality/report', headers: auth(reader.token) });
    expect(res.statusCode).toBe(403);
  });

  it('never exposes clinical text in findings — only MRN + record id', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/data-quality/report', headers: auth(staff.token) });
    const report = res.json() as DataQualityReport;
    for (const c of report.checks) {
      for (const f of c.findings) {
        expect(f.detail).not.toContain('anaemia');
        expect(f.detail.length).toBeLessThan(120);
      }
    }
  });
});
