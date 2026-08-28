import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp } from './helpers.js';
import type { FastifyInstance } from 'fastify';

// Geography reference data (spec §49): the public region/district lookups that
// power the pickers across the UI. Both endpoints are deliberately open — they
// expose nothing but administrative geography. The scoped /geography/map layer
// lives in geographyMap.test.ts; these cover the two dropdown routes.
let app: FastifyInstance;

let r1: { id: string };
let r2: { id: string };
let d1a: { id: string };
let d1b: { id: string };
let d2a: { id: string };

beforeAll(async () => {
  r1 = await db.region.create({ data: { code: 'GEO-1', name: 'Geography Region One (synthetic)', capital: 'Geo City One' } });
  r2 = await db.region.create({ data: { code: 'GEO-2', name: 'Geography Region Two (synthetic)', capital: 'Geo City Two' } });
  d1a = await db.district.create({ data: { code: 'GEO-1-01', name: 'Geography District One-A (synthetic)', type: 'DISTRICT', regionId: r1.id } });
  d1b = await db.district.create({ data: { code: 'GEO-1-02', name: 'Geography District One-B (synthetic)', type: 'MUNICIPAL', regionId: r1.id } });
  d2a = await db.district.create({ data: { code: 'GEO-2-01', name: 'Geography District Two-A (synthetic)', type: 'DISTRICT', regionId: r2.id } });
  await db.facility.create({
    data: {
      code: 'GEO-1-F',
      name: 'Geography Facility One (synthetic)',
      type: 'CLINIC',
      level: 'PRIMARY',
      ownership: 'PRIVATE',
      regionId: r1.id,
      districtId: d1a.id,
      services: '["OPD"]',
      departmentsJson: '[]',
      openingHours: '{}',
      isSynthetic: true,
      status: 'ACTIVE',
    },
  });
  app = await createTestApp();
});

afterAll(async () => {
  await db.facility.deleteMany({ where: { regionId: { in: [r1.id, r2.id] } } });
  await db.district.deleteMany({ where: { id: { in: [d1a.id, d1b.id, d2a.id] } } });
  await db.region.deleteMany({ where: { id: { in: [r1.id, r2.id] } } });
  await db.$disconnect();
  await app.close();
});

describe('geography regions', () => {
  it('lists regions with district and facility counts, ordered by name', async () => {
    // Public endpoint — no auth required.
    const res = await app.inject({ method: 'GET', url: '/api/v1/geography/regions' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.regions)).toBe(true);
    const mine = body.regions.find((r: { id: string }) => r.id === r1.id);
    expect(mine).toMatchObject({ code: 'GEO-1', name: 'Geography Region One (synthetic)' });
    expect(mine._count).toEqual({ districts: 2, facilities: 1 });
    // Name-ordered.
    const names = body.regions.map((r: { name: string }) => r.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});

describe('geography districts', () => {
  it('lists districts with their region linkage', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/geography/districts' });
    expect(res.statusCode).toBe(200);
    const ids = res.json().districts.map((d: { id: string }) => d.id);
    expect(ids).toContain(d1a.id);
    expect(ids).toContain(d1b.id);
    expect(ids).toContain(d2a.id);
    const row = res.json().districts.find((d: { id: string }) => d.id === d1a.id);
    expect(row).toMatchObject({ code: 'GEO-1-01', type: 'DISTRICT', regionId: r1.id });
  });

  it('filters districts by region', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/geography/districts?regionId=${r1.id}` });
    expect(res.statusCode).toBe(200);
    const ids = res.json().districts.map((d: { id: string }) => d.id);
    expect(ids).toContain(d1a.id);
    expect(ids).toContain(d1b.id);
    expect(ids).not.toContain(d2a.id);
    expect(res.json().districts.every((d: { regionId: string }) => d.regionId === r1.id)).toBe(true);
  });

  it('returns all districts for an unknown region filter', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/geography/districts?regionId=no-such-region' });
    expect(res.statusCode).toBe(200);
    expect(res.json().districts).toHaveLength(0);
  });
});
