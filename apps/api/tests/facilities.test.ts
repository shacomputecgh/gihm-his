import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeFacility, makeUser } from './helpers.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;
let reviewUser: { token: string };

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
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/facilities/apply',
      payload: { name: 'Bad District Clinic (synthetic)', type: 'CLINIC', ownership: 'PRIVATE', regionId: region?.id, districtId: district?.id },
    });
    expect(res.statusCode).toBe(400);
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

  it('denies facility-scoped users the review endpoints', async () => {
    const facilityUser = await makeUser({ email: 'facility-admin-scope@demo.gh', roleCode: 'HOSPITAL_ADMIN', permissions: ['review_facility_applications'] });
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/facility-applications?status=ALL',
      headers: { authorization: `Bearer ${facilityUser.token}` },
    });
    expect(res.statusCode).toBe(403);
  });
});
