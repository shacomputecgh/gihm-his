import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser, makeFacility } from './helpers.js';
import type { FastifyInstance } from 'fastify';
import type { AnomalyResult } from '../src/modules/reports/anomalies.js';

// ---------------------------------------------------------------------------
// Anomaly detection (spec §50, docs/14 §4): weekly z-score flags on the
// live-computed indicator series. Tests seed a controlled weekly OPD series
// (steady baseline + one spike week) and verify the flag, honest handling of
// constant series and short windows, scope isolation, and the permission gate.
// ---------------------------------------------------------------------------

const PERMS = ['view_reports', 'view_dashboard', 'view_patient', 'write_clinical_note', 'create_patient'];
const auth = (t: string) => ({ authorization: `Bearer ${t}` });

const DAY = 24 * 60 * 60 * 1000;
const FROM = new Date(Date.now() - 70 * DAY); // 10 weekly buckets
const TO = new Date(Date.now() + DAY);
// Bucket 9 (the spike week) starts at FROM + 63 days.
const SPIKE_WEEK = new Date(FROM.getTime() + 63 * DAY).toISOString().slice(0, 10);

let app: FastifyInstance;
let staff: { token: string };
let other: { token: string };
let facilityId: string;
let otherFacilityId: string;
let patientId: string;
let otherPatientId: string;

beforeAll(async () => {
  app = await createTestApp();
  const facility = await makeFacility('Anomaly Test Facility (synthetic)');
  facilityId = facility.id;
  staff = await makeUser({ roleCode: 'HOSPITAL_ADMIN', facilityId, permissions: PERMS });

  const otherFacility = await makeFacility('Anomaly Other Facility (synthetic)');
  otherFacilityId = otherFacility.id;
  const otherUser = await makeUser({ roleCode: 'HOSPITAL_ADMIN', facilityId: otherFacilityId, permissions: PERMS });
  other = { token: otherUser.token };

  const p = await app.inject({ method: 'POST', url: '/api/v1/patients', headers: auth(staff.token), payload: { fullName: 'Anomaly Patient (synthetic)', force: true } });
  patientId = p.json().patient.id;
  const po = await app.inject({ method: 'POST', url: '/api/v1/patients', headers: auth(other.token), payload: { fullName: 'Anomaly Other Patient (synthetic)', force: true } });
  otherPatientId = po.json().patient.id;

  // Steady baseline: 2 OPD encounters per week for weeks 0-8.
  for (let w = 0; w < 9; w++) {
    for (let i = 0; i < 2; i++) {
      await db.encounter.create({
        data: { patientId, facilityId, type: 'OPD', status: 'COMPLETED', createdAt: new Date(FROM.getTime() + (w * 7 + 1 + i) * DAY) },
      });
    }
  }
  // Spike week (bucket 9): 50 encounters.
  for (let i = 0; i < 50; i++) {
    await db.encounter.create({
      data: { patientId, facilityId, type: 'OPD', status: 'COMPLETED', createdAt: new Date(FROM.getTime() + (63 + 1 + i * 0.1) * DAY) },
    });
  }
  // One encounter at the OTHER facility (must stay invisible to facility F's scope).
  await db.encounter.create({ data: { patientId: otherPatientId, facilityId: otherFacilityId, type: 'OPD', status: 'COMPLETED', createdAt: new Date(Date.now() - 2 * DAY) } });
});

afterAll(async () => {
  // Tidy the shared test DB for files that run after this one.
  await db.encounter.deleteMany({ where: { patientId: { in: [patientId, otherPatientId] } } });
  await db.patient.deleteMany({ where: { id: { in: [patientId, otherPatientId] } } });
  await db.facility.deleteMany({ where: { id: { in: [facilityId, otherFacilityId] } } });
  await db.$disconnect();
  await app.close();
});

function series(result: AnomalyResult, code: string) {
  return result.indicators.find((i) => i.code === code);
}

describe('anomaly detection', () => {
  it('flags the spike week in the OPD attendance series', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/reports/anomalies?from=${FROM.toISOString().slice(0, 10)}&to=${TO.toISOString().slice(0, 10)}`, headers: auth(staff.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json() as AnomalyResult;
    expect(body.bucket).toBe('week');
    expect(body.summary.analyzed).toBeGreaterThan(0);

    const opd = series(body, 'OPD_ATTENDANCE');
    expect(opd).toBeTruthy();
    expect(opd!.analyzed).toBe(true);
    // 10 baseline weeks × 2 + 50 spike = 68 (the window opens an 11th empty bucket).
    expect(opd!.values.reduce((a, v) => a + (v.value ?? 0), 0)).toBe(68);

    const spike = opd!.flags.find((f) => f.weekStart === SPIKE_WEEK);
    expect(spike).toBeTruthy();
    expect(spike!.value).toBe(50);
    expect(spike!.z).toBeGreaterThan(2);
    expect(['high', 'medium']).toContain(spike!.severity);
  });

  it('never flags a constant series (zero variance)', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/reports/anomalies?from=${FROM.toISOString().slice(0, 10)}&to=${TO.toISOString().slice(0, 10)}`, headers: auth(staff.token) });
    const body = res.json() as AnomalyResult;
    // No blood donations were seeded — the series is all zeros → no variance → no flags.
    const donations = series(body, 'BLOOD_DONATIONS');
    expect(donations!.analyzed).toBe(true);
    expect(donations!.flags).toHaveLength(0);
  });

  it('stays silent for windows with too few weeks to score (honest insufficiency)', async () => {
    // 30 days → ~5 weekly buckets < MIN_POINTS (6): every indicator is analyzed=false.
    const shortFrom = new Date(Date.now() - 30 * DAY).toISOString().slice(0, 10);
    const res = await app.inject({ method: 'GET', url: `/api/v1/reports/anomalies?from=${shortFrom}&to=${TO.toISOString().slice(0, 10)}`, headers: auth(staff.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json() as AnomalyResult;
    expect(body.summary.analyzed).toBe(0);
    expect(body.summary.anomalies).toBe(0);
    const opd = series(body, 'OPD_ATTENDANCE');
    expect(opd!.analyzed).toBe(false);
    expect(opd!.flags).toHaveLength(0);
  });

  it('keeps other facilities out of the facility scope', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/reports/anomalies?from=${FROM.toISOString().slice(0, 10)}&to=${TO.toISOString().slice(0, 10)}`, headers: auth(other.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json() as AnomalyResult;
    const opd = series(body, 'OPD_ATTENDANCE');
    // Only its own single encounter is visible — the 50-encounter spike at the
    // other facility never leaks into this scope (max value anywhere is 1).
    const max = Math.max(...opd!.values.map((v) => v.value ?? 0));
    expect(max).toBe(1);
    expect(opd!.flags.every((f) => f.value <= 1)).toBe(true);
  });

  it('requires the reports permission', async () => {
    const reader = await makeUser({ email: 'anomaly-reader@demo.gh', roleCode: 'NURSE', facilityId, permissions: ['view_patient'] });
    const res = await app.inject({ method: 'GET', url: `/api/v1/reports/anomalies?from=${FROM.toISOString().slice(0, 10)}&to=${TO.toISOString().slice(0, 10)}`, headers: auth(reader.token) });
    expect(res.statusCode).toBe(403);
  });

  it('rejects an over-long window', async () => {
    // >366 days: rejected by the shared report-period cap.
    const res = await app.inject({ method: 'GET', url: `/api/v1/reports/anomalies?from=${FROM.toISOString().slice(0, 10)}&to=${new Date(Date.now() + 400 * DAY).toISOString().slice(0, 10)}`, headers: auth(staff.token) });
    expect(res.statusCode).toBe(400);
    // 120–366 days: silently truncating the weekly analysis would miss spikes,
    // so the anomaly route rejects windows past its 120-day analysis depth.
    const res2 = await app.inject({ method: 'GET', url: `/api/v1/reports/anomalies?from=${FROM.toISOString().slice(0, 10)}&to=${new Date(Date.now() + 130 * DAY).toISOString().slice(0, 10)}`, headers: auth(staff.token) });
    expect(res2.statusCode).toBe(400);
  });
});
