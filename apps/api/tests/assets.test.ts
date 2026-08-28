import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { db, createTestApp, makeUser, makeFacility, type TestUser } from './helpers.js';
import type { FastifyInstance } from 'fastify';

const DAY_MS = 24 * 3600 * 1000;

let app: FastifyInstance;
let admin: TestUser;
let outsider: TestUser;
let nurse: TestUser;
let facilityA: Awaited<ReturnType<typeof makeFacility>>;
let facilityB: Awaited<ReturnType<typeof makeFacility>>;
let createdIds: string[] = [];

const auth = (u: TestUser) => ({ authorization: `Bearer ${u.token}` });

async function makeAsset(payload: Record<string, unknown>, as: TestUser = admin) {
  const res = await app.inject({ method: 'POST', url: '/api/v1/assets', headers: auth(as), payload });
  return res;
}

beforeAll(async () => {
  app = await createTestApp();
  facilityA = await makeFacility('Assets Facility A (synthetic)');
  facilityB = await makeFacility('Assets Facility B (synthetic)');
  admin = await makeUser({ email: 'assets-admin@demo.gh', roleCode: 'HOSPITAL_ADMIN', facilityId: facilityA.id, permissions: ['manage_facility', 'view_financial', 'view_patient', 'create_patient'] });
  outsider = await makeUser({ email: 'assets-outsider@demo.gh', roleCode: 'HOSPITAL_ADMIN', facilityId: facilityB.id, permissions: ['manage_facility', 'view_financial'] });
  nurse = await makeUser({ email: 'assets-nurse@demo.gh', roleCode: 'NURSE', facilityId: facilityA.id, permissions: ['view_patient'] });
});

afterAll(async () => {
  const userIds = [admin.userId, outsider.userId, nurse.userId];
  const roleIds = (await db.user.findMany({ where: { id: { in: userIds } }, select: { roleId: true } })).map((u) => u.roleId);
  await db.asset.deleteMany({ where: { id: { in: createdIds } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.role.deleteMany({ where: { id: { in: roleIds } } });
  await db.facility.deleteMany({ where: { id: { in: [facilityA.id, facilityB.id] } } });
  await app.close();
});

describe('asset register + depreciation', () => {
  it('requires finance/facility permission (403 for a nurse)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/assets', headers: auth(nurse) });
    expect(res.statusCode).toBe(403);
    const create = await makeAsset({ facilityId: facilityA.id, assetNumber: 'NURSE-01', name: 'Nope', purchaseCost: 100 }, nurse);
    expect(create.statusCode).toBe(403);
  });

  it('creates an asset and derives straight-line depreciation', async () => {
    // 2.5 years into a 5-year life of a 100,000 cost, 0 salvage → 50% written down.
    const res = await makeAsset({
      facilityId: facilityA.id,
      assetNumber: 'TST-0001',
      name: 'Test Van (synthetic)',
      category: 'VEHICLE',
      purchaseCost: 100000,
      salvageValue: 0,
      usefulLifeYears: 5,
      acquisitionDate: new Date(Date.now() - 2.5 * 365.25 * DAY_MS).toISOString().slice(0, 10),
      location: 'Transport yard',
      custodianName: 'Transport',
    });
    expect(res.statusCode).toBe(200);
    const asset = res.json().asset;
    createdIds.push(asset.id);
    expect(asset.assetNumber).toBe('TST-0001');
    expect(asset.status).toBe('ACTIVE');
    expect(asset.depreciationPct).toBe(50);
    // Acquisition is day-precision, so the age includes the time-of-day
    // offset — assert within a day of depreciation (≈ 55/day on 100k/5yrs).
    expect(asset.accumulatedDepreciation).toBeGreaterThan(49500);
    expect(asset.accumulatedDepreciation).toBeLessThan(50500);
    expect(asset.currentValue).toBeGreaterThan(49500);
    expect(asset.currentValue).toBeLessThan(50500);
    expect(asset.annualDepreciation).toBe(20000); // 100,000 / 5 years
  });

  it('validates registration (duplicate number, salvage > cost, bad category)', async () => {
    const dup = await makeAsset({ facilityId: facilityA.id, assetNumber: 'TST-0001', name: 'Duplicate', purchaseCost: 10 });
    expect(dup.statusCode).toBe(409);

    const badSalvage = await makeAsset({ facilityId: facilityA.id, assetNumber: 'TST-0002', name: 'Bad Salvage', purchaseCost: 100, salvageValue: 150 });
    expect(badSalvage.statusCode).toBe(400);

    const badCat = await makeAsset({ facilityId: facilityA.id, assetNumber: 'TST-0003', name: 'Bad Category', category: 'GOLD', purchaseCost: 100 });
    expect(badCat.statusCode).toBe(400);
  });

  it('recomputes book value when purchase facts change', async () => {
    const res = await makeAsset({
      facilityId: facilityA.id,
      assetNumber: 'TST-0004',
      name: 'Test Server (synthetic)',
      category: 'IT',
      purchaseCost: 60000,
      salvageValue: 0,
      usefulLifeYears: 3,
      acquisitionDate: new Date(Date.now() - 1 * 365.25 * DAY_MS).toISOString().slice(0, 10),
    });
    const asset = res.json().asset;
    createdIds.push(asset.id);
    expect(asset.depreciationPct).toBe(33);
    expect(asset.currentValue).toBeGreaterThan(39500);
    expect(asset.currentValue).toBeLessThan(40500);

    // Extend the life to 6 years → only ~1/6 depreciated now.
    const edit = await app.inject({ method: 'PUT', url: `/api/v1/assets/${asset.id}`, headers: auth(admin), payload: { usefulLifeYears: 6 } });
    expect(edit.statusCode).toBe(200);
    expect(edit.json().asset.depreciationPct).toBe(17);
    expect(edit.json().asset.currentValue).toBeGreaterThan(49500);
    expect(edit.json().asset.currentValue).toBeLessThan(50500);
  });

  it('handles depreciation edge cases (future date, salvage = cost, disposal guard)', async () => {
    // Future acquisition → no depreciation yet, book value = cost.
    const future = await makeAsset({
      facilityId: facilityA.id, assetNumber: 'TST-0006', name: 'Future Asset (synthetic)', category: 'OTHER',
      purchaseCost: 50000, salvageValue: 0, usefulLifeYears: 5,
      acquisitionDate: new Date(Date.now() + 30 * DAY_MS).toISOString().slice(0, 10),
    });
    expect(future.statusCode).toBe(200);
    expect(future.json().asset.accumulatedDepreciation).toBe(0);
    expect(future.json().asset.currentValue).toBe(50000);
    expect(future.json().asset.depreciationPct).toBe(0);
    createdIds.push(future.json().asset.id);

    // Salvage = cost → nothing depreciable.
    const noBase = await makeAsset({
      facilityId: facilityA.id, assetNumber: 'TST-0007', name: 'Resale Asset (synthetic)', category: 'OTHER',
      purchaseCost: 20000, salvageValue: 20000, usefulLifeYears: 5,
      acquisitionDate: new Date(Date.now() - 2 * 365.25 * DAY_MS).toISOString().slice(0, 10),
    });
    expect(noBase.statusCode).toBe(200);
    expect(noBase.json().asset.annualDepreciation).toBe(0);
    expect(noBase.json().asset.accumulatedDepreciation).toBe(0);
    expect(noBase.json().asset.currentValue).toBe(20000);
    createdIds.push(noBase.json().asset.id);

    // The status field cannot bypass the audited dispose action.
    const direct = await app.inject({ method: 'PUT', url: `/api/v1/assets/${future.json().asset.id}`, headers: auth(admin), payload: { status: 'DISPOSED' } });
    expect(direct.statusCode).toBe(400);

    // IN_STORAGE assets can still be written off.
    const storage = await app.inject({ method: 'PUT', url: `/api/v1/assets/${future.json().asset.id}`, headers: auth(admin), payload: { status: 'IN_STORAGE' } });
    expect(storage.statusCode).toBe(200);
    const storeDispose = await app.inject({ method: 'POST', url: `/api/v1/assets/${future.json().asset.id}/dispose`, headers: auth(admin) });
    expect(storeDispose.statusCode).toBe(200);
    expect(storeDispose.json().asset.status).toBe('DISPOSED');
  });

  it('disposes an asset (book value → 0) and rejects re-disposal', async () => {
    const res = await makeAsset({ facilityId: facilityA.id, assetNumber: 'TST-0005', name: 'Test Lift (synthetic)', category: 'PLANT', purchaseCost: 80000, salvageValue: 8000, usefulLifeYears: 20, acquisitionDate: new Date(Date.now() - 10 * 365.25 * DAY_MS).toISOString().slice(0, 10) });
    const asset = res.json().asset;
    createdIds.push(asset.id);

    const dispose = await app.inject({ method: 'POST', url: `/api/v1/assets/${asset.id}/dispose`, headers: auth(admin), payload: { note: 'End of life' } });
    expect(dispose.statusCode).toBe(200);
    expect(dispose.json().asset.status).toBe('DISPOSED');
    expect(dispose.json().asset.currentValue).toBe(0);
    expect(dispose.json().asset.depreciationPct).toBe(100);

    const again = await app.inject({ method: 'POST', url: `/api/v1/assets/${asset.id}/dispose`, headers: auth(admin) });
    expect(again.statusCode).toBe(400);
  });

  it('scopes the register to the caller facility', async () => {
    const list = await app.inject({ method: 'GET', url: '/api/v1/assets', headers: auth(outsider) });
    expect(list.statusCode).toBe(200);
    const assets = list.json().assets as Array<{ facility: { id: string } | null }>;
    expect(assets.every((a) => a.facility?.id === facilityB.id)).toBe(true);

    // The facilityId filter cannot widen scope.
    const widen = await app.inject({ method: 'GET', url: `/api/v1/assets?facilityId=${facilityA.id}`, headers: auth(outsider) });
    expect(widen.statusCode).toBe(403);
  });

  it('summarises book value by category (disposed excluded from category cards)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/assets/summary', headers: auth(admin) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.totals.assets).toBeGreaterThanOrEqual(3);
    expect(body.totals.bookValue).toBeGreaterThan(0);
    expect(body.totals.disposed).toBeGreaterThanOrEqual(1);
    const cat = body.byCategory as Array<{ category: string; count: number }>;
    expect(cat.some((c) => c.category === 'VEHICLE' && c.count >= 1)).toBe(true);
    expect(cat.some((c) => c.category === 'IT')).toBe(true);
    // Disposed assets never appear in a category card's count.
    const disposedCatCount = cat.reduce((acc, c) => acc + c.count, 0);
    expect(disposedCatCount).toBeLessThanOrEqual(body.totals.assets - body.totals.disposed);
  });
});
