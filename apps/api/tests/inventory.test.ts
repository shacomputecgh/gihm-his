import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser, type TestUser } from './helpers.js';
import type { FastifyInstance } from 'fastify';

// Health-commodity inventory (spec §25-§26): scoped stock lists with low-stock
// flags, item creation, receipts and adjustments, and the StockMovement audit
// trail. The happy path lives in clinical2.test.ts — these cover the scope
// boundaries, permission guards, validation and the stock-balance rules.
let app: FastifyInstance;
let facilityUser: TestUser;
let otherFacility: TestUser;
let noPerm: TestUser;

let r1: { id: string };
let r2: { id: string };
let d1: { id: string };
let d2: { id: string };
let a1f: { id: string };
let a2f: { id: string };
const userIds: string[] = [];
const stockIds: string[] = [];
const movementIds: string[] = [];

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
  r1 = await createRegion('INV-1', 'Inventory Region One (synthetic)');
  r2 = await createRegion('INV-2', 'Inventory Region Two (synthetic)');
  d1 = await createDistrict('INV-1-01', 'Inventory District One (synthetic)', r1.id);
  d2 = await createDistrict('INV-2-01', 'Inventory District Two (synthetic)', r2.id);
  a1f = await createFacility('INV-1-F', 'Inventory Facility One (synthetic)', r1.id, d1.id);
  a2f = await createFacility('INV-2-F', 'Inventory Facility Two (synthetic)', r2.id, d2.id);

  facilityUser = await makeUser({ email: 'inv-facility@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'FACILITY', facilityId: a1f.id, permissions: ['manage_stock', 'view_financial', 'view_patient'] });
  otherFacility = await makeUser({ email: 'inv-other@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'FACILITY', facilityId: a2f.id, permissions: ['manage_stock', 'view_patient'] });
  noPerm = await makeUser({ email: 'inv-noperm@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'NATIONAL', permissions: ['view_dashboard'] });
  userIds.push(facilityUser.userId, otherFacility.userId, noPerm.userId);

  app = await createTestApp();
});

afterAll(async () => {
  // Facility-scoped cleanup: every item/movement in this file belongs to the two
  // facilities created in beforeAll. Deleting by facility also catches RECEIPT
  // movements the tests never tracked (only the checked-out movement ids were).
  await db.stockMovement.deleteMany({ where: { facilityId: { in: [a1f.id, a2f.id] } } });
  await db.stockItem.deleteMany({ where: { facilityId: { in: [a1f.id, a2f.id] } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.facility.deleteMany({ where: { id: { in: [a1f.id, a2f.id] } } });
  await db.district.deleteMany({ where: { id: { in: [d1.id, d2.id] } } });
  await db.region.deleteMany({ where: { id: { in: [r1.id, r2.id] } } });
  await db.$disconnect();
  await app.close();
});

const auth = (t: string) => ({ authorization: `Bearer ${t}` });
const list = (t: string, q = '') => app.inject({ method: 'GET', url: `/api/v1/inventory/stock${q}`, headers: auth(t) });
const create = (t: string, payload: Record<string, unknown>) =>
  app.inject({ method: 'POST', url: '/api/v1/inventory/stock', headers: auth(t), payload });
const receive = (t: string, id: string, payload: Record<string, unknown>) =>
  app.inject({ method: 'POST', url: `/api/v1/inventory/stock/${id}/receive`, headers: auth(t), payload });
const adjust = (t: string, id: string, payload: Record<string, unknown>) =>
  app.inject({ method: 'POST', url: `/api/v1/inventory/stock/${id}/adjust`, headers: auth(t), payload });
const movements = (t: string, id: string) =>
  app.inject({ method: 'GET', url: `/api/v1/inventory/stock/${id}/movements`, headers: auth(t) });

async function makeItem(name: string, overrides: Record<string, unknown> = {}) {
  const res = await create(facilityUser.token, { name, category: 'MEDICINE', unit: 'tablet', ...overrides });
  expect(res.statusCode).toBe(200);
  const item = res.json().item;
  stockIds.push(item.id);
  return item;
}

describe('stock items', () => {
  it('creates an item with a zero balance and rejects duplicates and bad input', async () => {
    const item = await makeItem('Paracetamol 500mg (inventory test)');
    expect(item.quantity).toBe(0);
    expect(item.status).toBe('ACTIVE');
    const dup = await create(facilityUser.token, { name: 'Paracetamol 500mg (inventory test)' });
    expect(dup.statusCode).toBe(409);
    const noName = await create(facilityUser.token, {});
    expect(noName.statusCode).toBe(400);
    const negQty = await create(facilityUser.token, { name: 'Bad Qty (inventory test)', quantity: -3 });
    expect(negQty.statusCode).toBe(400);
  });

  it('rejects callers without manage_stock', async () => {
    const res = await create(noPerm.token, { name: 'No Perm Item (inventory test)' });
    expect(res.statusCode).toBe(403);
  });
});

describe('receipts', () => {
  it('increases the balance and writes a RECEIPT movement with the running balance', async () => {
    const item = await makeItem('ORS Sachets (inventory test)');
    const res = await receive(facilityUser.token, item.id, { quantity: 30, note: 'Monthly order' });
    expect(res.statusCode).toBe(200);
    expect(res.json().item.quantity).toBe(30);
    const rows = (await movements(facilityUser.token, item.id)).json().movements;
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ type: 'RECEIPT', quantity: 30, balanceAfter: 30, note: 'Monthly order' });
    movementIds.push(rows[0].id);
  });

  it('validates the quantity and the item scope', async () => {
    const item = await makeItem('Amoxicillin 250mg (inventory test)');
    const zero = await receive(facilityUser.token, item.id, { quantity: 0 });
    expect(zero.statusCode).toBe(400);
    const other = await create(otherFacility.token, { name: 'Other Facility Item (inventory test)' });
    stockIds.push(other.json().item.id);
    const outOfScope = await receive(facilityUser.token, other.json().item.id, { quantity: 5 });
    expect(outOfScope.statusCode).toBe(404);
    const missing = await receive(facilityUser.token, 'no-such-item', { quantity: 5 });
    expect(missing.statusCode).toBe(404);
  });
});

describe('adjustments', () => {
  it('issues stock with a negative delta and writes the movement', async () => {
    const item = await makeItem('IV Fluids (inventory test)');
    await receive(facilityUser.token, item.id, { quantity: 100 });
    const res = await adjust(facilityUser.token, item.id, { delta: -25, type: 'ISSUE', note: 'Ward issue' });
    expect(res.statusCode).toBe(200);
    expect(res.json().item.quantity).toBe(75);
    const rows = (await movements(facilityUser.token, item.id)).json().movements;
    expect(rows[0]).toMatchObject({ type: 'ISSUE', quantity: -25, balanceAfter: 75 });
    movementIds.push(rows[0].id);
  });

  it('refuses a zero delta, a negative balance, an invalid type, and out-of-scope items', async () => {
    const item = await makeItem('Gloves (inventory test)');
    const zero = await adjust(facilityUser.token, item.id, { delta: 0 });
    expect(zero.statusCode).toBe(400);
    const negative = await adjust(facilityUser.token, item.id, { delta: -5 });
    expect(negative.statusCode).toBe(400);
    await receive(facilityUser.token, item.id, { quantity: 10 });
    const badType = await adjust(facilityUser.token, item.id, { delta: -1, type: 'SHRINKAGE' });
    expect(badType.statusCode).toBe(400);
    const other = await create(otherFacility.token, { name: 'Other Facility Item 2 (inventory test)' });
    stockIds.push(other.json().item.id);
    const outOfScope = await adjust(facilityUser.token, other.json().item.id, { delta: -1 });
    expect(outOfScope.statusCode).toBe(404);
  });
});

describe('stock list', () => {
  it('flags low and out-of-stock rows and honours the low filter', async () => {
    // qty 0 (out), reorderLevel 20 → low + out.
    await makeItem('Low Item (inventory test)', { quantity: 0, reorderLevel: 20 });
    // qty 50, reorderLevel 100 → low (but not out).
    await makeItem('Mid Item (inventory test)', { quantity: 50, reorderLevel: 100 });
    // qty 500, reorderLevel 100 → healthy.
    await makeItem('Healthy Item (inventory test)', { quantity: 500, reorderLevel: 100 });

    const all = await list(facilityUser.token);
    const lowItem = all.json().items.find((s: { name: string }) => s.name === 'Low Item (inventory test)');
    const midItem = all.json().items.find((s: { name: string }) => s.name === 'Mid Item (inventory test)');
    const healthy = all.json().items.find((s: { name: string }) => s.name === 'Healthy Item (inventory test)');
    expect(lowItem).toMatchObject({ low: true, out: true });
    expect(midItem).toMatchObject({ low: true, out: false });
    expect(healthy).toMatchObject({ low: false, out: false });

    const filtered = await list(facilityUser.token, '?low=1');
    expect(filtered.json().items.every((s: { low: boolean }) => s.low)).toBe(true);
  });

  it('scopes the list to the caller’s facility and filters by category', async () => {
    await makeItem('Vaccine Stock (inventory test)', { category: 'VACCINE' });
    const vaccine = await list(facilityUser.token, '?category=VACCINE');
    expect(vaccine.json().items.length).toBeGreaterThanOrEqual(1);
    expect(vaccine.json().items.every((s: { category: string }) => s.category === 'VACCINE')).toBe(true);

    const other = await create(otherFacility.token, { name: 'Invisible Item (inventory test)', category: 'VACCINE' });
    stockIds.push(other.json().item.id);
    const own = await list(facilityUser.token);
    expect(own.json().items.some((s: { id: string }) => s.id === other.json().item.id)).toBe(false);
  });

  it('rejects callers without manage_stock / view_financial / view_patient', async () => {
    expect((await list(noPerm.token)).statusCode).toBe(403);
    expect((await movements(noPerm.token, 'anything')).statusCode).toBe(403);
  });
});
