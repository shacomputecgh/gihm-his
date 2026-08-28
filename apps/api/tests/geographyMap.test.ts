import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser, makeFacility } from './helpers.js';
import type { FastifyInstance } from 'fastify';

// ---------------------------------------------------------------------------
// GIS / national map (docs/14 §6): /geography/map returns in-scope facilities
// with GPS coordinates and 30-day activity aggregates — aggregate-only, scoped
// exactly like the reports.
// ---------------------------------------------------------------------------

const auth = (t: string) => ({ authorization: `Bearer ${t}` });

let app: FastifyInstance;
let national: { token: string };
let facilityUser: { token: string };
let facilityId: string;
let gpsFacilityId: string;
let noGpsFacilityId: string;

beforeAll(async () => {
  app = await createTestApp();
  national = await makeUser({ roleCode: 'NATIONAL_ADMIN', scope: 'NATIONAL', permissions: ['view_reports', 'view_dashboard'] });

  // Facility WITH GPS.
  const withGps = await makeFacility('Map GPS Facility (synthetic)');
  await db.facility.update({ where: { id: withGps.id }, data: { gpsLat: 5.6037, gpsLng: -0.187 } });
  gpsFacilityId = withGps.id;

  // Facility WITHOUT GPS — must never appear on the map.
  const noGps = await makeFacility('Map NoGPS Facility (synthetic)');
  await db.facility.update({ where: { id: noGps.id }, data: { gpsLat: null, gpsLng: null } });
  noGpsFacilityId = noGps.id;

  // A facility user in the GPS facility's scope.
  facilityId = withGps.id;
  facilityUser = await makeUser({ roleCode: 'HOSPITAL_ADMIN', facilityId, scope: 'FACILITY', permissions: ['view_reports', 'view_dashboard'] });
});

afterAll(async () => {
  await db.encounter.deleteMany({ where: { facilityId: { in: [gpsFacilityId, facilityId] } } });
  await db.facility.deleteMany({ where: { id: { in: [gpsFacilityId, facilityId] } } });
  await db.$disconnect();
  await app.close();
});

describe('geography map', () => {
  it('returns only facilities with GPS coordinates', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/geography/map', headers: auth(national.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.scope).toBe('NATIONAL');
    expect(body.total).toBeGreaterThanOrEqual(1);
    for (const p of body.points) {
      expect(typeof p.lat).toBe('number');
      expect(typeof p.lng).toBe('number');
      expect(p.lat).not.toBeNull();
    }
    // The no-GPS facility is excluded (assert by id — codes are random).
    expect(body.points.some((p: { id: string }) => p.id === noGpsFacilityId)).toBe(false);
  });

  it('carries 30-day activity aggregates and region/district names', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/geography/map', headers: auth(national.token) });
    const body = res.json();
    const gps = body.points.find((p: { id: string }) => p.id === gpsFacilityId);
    expect(gps).toBeTruthy();
    expect(typeof gps.activity30d).toBe('number');
    expect(gps.activity30d).toBeGreaterThanOrEqual(0);
    expect(gps.region).toBeTruthy();
    expect(gps.district).toBeTruthy();
    expect(gps.code).toBeTruthy();
    expect(gps.ownership).toBeTruthy();
  });

  it('reflects recorded activity in activity30d', async () => {
    const patient = await db.patient.create({
      data: { mrn: `TST-${Math.random().toString(36).slice(2, 10)}`, fullName: 'Map Activity Patient (synthetic)', facilityId: gpsFacilityId, status: 'ACTIVE' },
    });
    await db.encounter.create({ data: { patientId: patient.id, facilityId: gpsFacilityId, type: 'OPD', status: 'COMPLETED', createdAt: new Date() } });
    const res = await app.inject({ method: 'GET', url: '/api/v1/geography/map', headers: auth(national.token) });
    const gps = res.json().points.find((p: { id: string }) => p.id === gpsFacilityId);
    expect(gps.activity30d).toBeGreaterThanOrEqual(1);
    await db.encounter.deleteMany({ where: { patientId: patient.id } });
    await db.patient.delete({ where: { id: patient.id } });
  });

  it('scopes a facility user to their own facility', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/geography/map', headers: auth(facilityUser.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.scope).toBe('FACILITY');
    expect(body.total).toBe(1);
    expect(body.points[0].id).toBe(facilityId);
  });

  it('requires the reports permission', async () => {
    const nurse = await makeUser({ roleCode: 'NURSE', facilityId, permissions: ['view_patient'] });
    const res = await app.inject({ method: 'GET', url: '/api/v1/geography/map', headers: auth(nurse.token) });
    expect(res.statusCode).toBe(403);
  });
});
