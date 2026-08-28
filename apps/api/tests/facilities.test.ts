import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeFacility, makeUser } from './helpers.js';
import { DEMO_FACILITIES, SERVICES_BY_TYPE, DEPARTMENTS_BY_TYPE } from '../prisma/data/facilities.js';
import { FACILITY_UNITS } from '../prisma/data/units.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;
let reviewUser: { token: string; userId: string };

beforeAll(async () => {
  app = await createTestApp();
  await makeFacility('Directory Search Hospital (synthetic)');
  await makeFacility('Another Clinic (synthetic)');
  reviewUser = await makeUser({ email: 'facility-reviewer@demo.gh', roleCode: 'REGIONAL_DIRECTOR', scope: 'REGIONAL', permissions: ['review_facility_applications'] });
});
afterAll(async () => {
  await db.$disconnect();
  await app.close();
});

describe('facility directory (public)', () => {
  it('lists facilities with pagination envelope', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/facilities?page=1&pageSize=5' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items[0]).toHaveProperty('region');
    expect(body.total).toBeGreaterThan(0);
  });

  it('supports text search on facility name', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/facilities?q=Directory' });
    const body = res.json();
    expect(body.total).toBe(1);
    expect(body.items[0].name).toContain('Directory Search Hospital');
  });

  it('filters by sector via ownershipIn (hybrid platform)', async () => {
    // makeFacility creates PRIVATE-owned clinics — assert the multi-ownership
    // filter returns only facilities with a matching ownership code.
    const priv = await app.inject({ method: 'GET', url: '/api/v1/facilities?ownershipIn=PRIVATE&pageSize=25' });
    const gov = await app.inject({ method: 'GET', url: '/api/v1/facilities?ownershipIn=GOVERNMENT,GHS,TEACHING_HOSPITAL&pageSize=25' });
    expect(priv.statusCode).toBe(200);
    expect(priv.json().total).toBeGreaterThan(0);
    expect(priv.json().items.every((f: { ownership: string }) => f.ownership === 'PRIVATE')).toBe(true);
    expect(gov.statusCode).toBe(200);
    expect(gov.json().items.every((f: { ownership: string }) => ['GOVERNMENT', 'GHS', 'TEACHING_HOSPITAL'].includes(f.ownership))).toBe(true);
  });
});

describe('facility self-registration', () => {
  it('accepts a public application and creates a PENDING record', async () => {
    const region = await db.region.findFirst();
    const district = await db.district.findFirst({ where: { regionId: region?.id } });
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/facilities/apply',
      payload: {
        name: 'Public Applicant Clinic (synthetic)',
        type: 'CLINIC',
        ownership: 'PRIVATE',
        regionId: region?.id,
        districtId: district?.id,
        services: ['OPD', 'PHARMACY'],
        contactName: 'Test Applicant',
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.application.status).toBe('PENDING');
    const row = await db.facilityApplication.findUnique({ where: { id: body.application.id } });
    expect(row?.status).toBe('PENDING');
    expect(row?.name).toBe('Public Applicant Clinic (synthetic)');
  });

  it('rejects an application whose district is not in the selected region', async () => {
    const region = await db.region.findFirst();
    const otherRegion = await db.region.create({ data: { code: 'TST-2', name: 'Second Test Region (synthetic)', capital: 'X' } });
    const district = await db.district.create({ data: { code: 'TST-2-01', name: 'Second Region District (synthetic)', type: 'DISTRICT', regionId: otherRegion.id } });
    try {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/facilities/apply',
        payload: { name: 'Bad District Clinic (synthetic)', type: 'CLINIC', ownership: 'PRIVATE', regionId: region?.id, districtId: district?.id },
      });
      expect(res.statusCode).toBe(400);
    } finally {
      // Never leak geography rows into the shared test DB (other files, e.g.
      // the directorate national view, assert on the live region table).
      await db.district.deleteMany({ where: { id: district.id } });
      await db.region.deleteMany({ where: { id: otherRegion.id } });
    }
  });

  it('approves an application and creates a real Facility record', async () => {
    const region = await db.region.findFirst();
    const district = await db.district.findFirst({ where: { regionId: region?.id } });
    const created = await db.facilityApplication.create({
      data: {
        name: 'Approve Me Clinic (synthetic)',
        type: 'CLINIC',
        ownership: 'PRIVATE',
        regionId: region?.id ?? '',
        districtId: district?.id ?? '',
        services: '["OPD"]',
        status: 'PENDING',
      },
    });
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/facility-applications/${created.id}/approve`,
      headers: { authorization: `Bearer ${reviewUser.token}` },
      payload: { note: 'Approved in test' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('APPROVED');
    const facility = await db.facility.findUnique({ where: { code: body.facility.code } });
    expect(facility?.name).toBe('Approve Me Clinic (synthetic)');
    expect(facility?.isSynthetic).toBe(false);
    const row = await db.facilityApplication.findUnique({ where: { id: created.id } });
    expect(row?.status).toBe('APPROVED');
  });

  it('rejects an application with a review note, and refuses a double review', async () => {
    const region = await db.region.findFirst();
    const district = await db.district.findFirst({ where: { regionId: region?.id } });
    const created = await db.facilityApplication.create({
      data: {
        name: 'Reject Me Clinic (synthetic)',
        type: 'CLINIC',
        ownership: 'PRIVATE',
        regionId: region?.id ?? '',
        districtId: district?.id ?? '',
        services: '["OPD"]',
        status: 'PENDING',
      },
    });
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/facility-applications/${created.id}/reject`,
      headers: { authorization: `Bearer ${reviewUser.token}` },
      payload: { note: 'Does not meet licensing requirements' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('REJECTED');
    const row = await db.facilityApplication.findUnique({ where: { id: created.id } });
    expect(row?.status).toBe('REJECTED');
    expect(row?.reviewNote).toBe('Does not meet licensing requirements');
    expect(row?.reviewedById).toBe(reviewUser.userId);
    const audit = await db.auditLog.findFirst({ where: { action: 'facilityApplication.reject', entityId: created.id } });
    expect(audit).toBeTruthy();
    // An already-reviewed application cannot be rejected again.
    const again = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/facility-applications/${created.id}/reject`,
      headers: { authorization: `Bearer ${reviewUser.token}` },
      payload: { note: 'Second thoughts' },
    });
    expect(again.statusCode).toBe(409);
    await db.facilityApplication.deleteMany({ where: { id: created.id } });
  });

  it('denies facility-scoped users the review endpoints', async () => {
    const facilityUser = await makeUser({ email: 'facility-admin-scope@demo.gh', roleCode: 'HOSPITAL_ADMIN', permissions: ['review_facility_applications'] });
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/facility-applications?status=ALL',
      headers: { authorization: `Bearer ${facilityUser.token}` },
    });
    expect(res.statusCode).toBe(403);
    const region = await db.region.findFirst();
    const district = await db.district.findFirst({ where: { regionId: region?.id } });
    const pending = await db.facilityApplication.create({
      data: {
        name: 'Scope Denied Clinic (synthetic)',
        type: 'CLINIC',
        ownership: 'PRIVATE',
        regionId: region?.id ?? '',
        districtId: district?.id ?? '',
        services: '["OPD"]',
        status: 'PENDING',
      },
    });
    const reject = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/facility-applications/${pending.id}/reject`,
      headers: { authorization: `Bearer ${facilityUser.token}` },
      payload: { note: 'Denied by facility user' },
    });
    expect(reject.statusCode).toBe(403);
    await db.facilityApplication.deleteMany({ where: { id: pending.id } });
  });
});

describe('facility catalog invariants (hybrid registry seed)', () => {
  // All 16 Ghana regions are represented with at least one government and one
  // private-sector facility so the hybrid platform directory has real depth.
  it('covers all 16 regions with both government and private facilities', () => {
    const GOV = new Set(['GOVERNMENT', 'GHS', 'MOH', 'TEACHING_HOSPITAL', 'QUASI_GOVT']);
    const byRegion: Record<string, { gov: boolean; priv: boolean }> = {};
    for (const f of DEMO_FACILITIES) {
      byRegion[f.regionCode] ??= { gov: false, priv: false };
      if (GOV.has(f.ownership)) byRegion[f.regionCode]!.gov = true;
      if (f.ownership === 'PRIVATE') byRegion[f.regionCode]!.priv = true;
    }
    expect(Object.keys(byRegion)).toHaveLength(16);
    for (const [code, cov] of Object.entries(byRegion)) {
      expect(cov.gov, `${code} has no government facility`).toBe(true);
      expect(cov.priv, `${code} has no private facility`).toBe(true);
    }
  });

  // Every facility offers the FULL per-class baseline for its type (the
  // catalog builder layers per-facility extras on top, never replacing). A
  // future catalog edit must not silently drop a required service/department.
  it('includes the full per-class baseline services and departments for its type', () => {
    for (const f of DEMO_FACILITIES) {
      expect(f.services.length, `${f.code} (${f.type}) has fewer services than expected`).toBeGreaterThanOrEqual(SERVICES_BY_TYPE[f.type]?.length ?? 0);
      expect(f.departments.length, `${f.code} (${f.type}) has fewer departments than expected`).toBeGreaterThanOrEqual(DEPARTMENTS_BY_TYPE[f.type]?.length ?? 0);
      for (const s of SERVICES_BY_TYPE[f.type] ?? []) {
        expect(f.services, `${f.code} is missing baseline service ${s}`).toContain(s);
      }
      for (const d of DEPARTMENTS_BY_TYPE[f.type] ?? []) {
        expect(f.departments, `${f.code} is missing baseline department ${d}`).toContain(d);
      }
    }
  });

  it('has unique facility codes and complete service/department lists', () => {
    const codes = DEMO_FACILITIES.map((f) => f.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const f of DEMO_FACILITIES) {
      expect(f.services.length, `${f.code} has no services`).toBeGreaterThan(0);
      expect(f.departments.length, `${f.code} has no departments`).toBeGreaterThan(0);
      // No duplicates within a facility (the catalog builder dedupes).
      expect(new Set(f.services).size).toBe(f.services.length);
      expect(new Set(f.departments).size).toBe(f.departments.length);
    }
  });

  // Units are matched against facility departments by exact name in seed.ts —
  // if a catalog rename breaks that, units silently become standalone.
  it('keeps unit department names present in their facility departments', () => {
    for (const group of FACILITY_UNITS) {
      const fac = DEMO_FACILITIES.find((f) => f.code === group.facilityCode);
      expect(fac, `units reference unknown facility ${group.facilityCode}`).toBeTruthy();
      for (const u of group.units) {
        if (!u.department) continue;
        expect(fac!.departments, `${group.facilityCode} unit '${u.name}' needs department '${u.department}'`).toContain(u.department);
      }
    }
  });
});
