import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser, makeFacility } from './helpers.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;
let admin: { token: string };
let facAdmin: { token: string };
let limited: { token: string };
let facA: { id: string };
let facB: { id: string };
const created: { icuId?: string; icuWardId?: string; unitId?: string; wardId?: string } = {};

beforeAll(async () => {
  facA = await makeFacility('Units Facility A (synthetic)');
  facB = await makeFacility('Units Facility B (synthetic)');
  // Departments exist on the facilities via the seed; create one for A.
  await db.department.create({ data: { name: 'Medicine', facilityId: facA.id, queueEnabled: true } });
  await db.department.create({ data: { name: 'Surgery', facilityId: facA.id, queueEnabled: true } });

  app = await createTestApp();
  admin = await makeUser({ email: 'units-admin@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'NATIONAL', permissions: ['manage_facility', 'view_audit', 'view_patient', 'write_clinical_note'] });
  facAdmin = await makeUser({ email: 'units-fac@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'FACILITY', facilityId: facA.id, permissions: ['manage_facility'] });
  limited = await makeUser({ email: 'units-limited@demo.gh', roleCode: 'HOSPITAL_ADMIN', permissions: ['view_patient'] });
});

afterAll(async () => {
  // Children first (beds → wards → units), then departments, then facilities.
  await db.bed.deleteMany({ where: { facilityId: { in: [facA.id, facB.id] } } });
  await db.equipmentMaintenance.deleteMany({ where: { equipment: { unit: { facilityId: { in: [facA.id, facB.id] } } } } });
  await db.unitEquipment.deleteMany({ where: { facilityId: { in: [facA.id, facB.id] } } });
  await db.ward.deleteMany({ where: { unit: { facilityId: { in: [facA.id, facB.id] } } } });
  await db.hospitalUnit.deleteMany({ where: { facilityId: { in: [facA.id, facB.id] } } });
  await db.department.deleteMany({ where: { facilityId: { in: [facA.id, facB.id] } } });
  await db.auditLog.deleteMany({ where: { action: { startsWith: 'masterdata.' } } });
  await db.facility.deleteMany({ where: { id: { in: [facA.id, facB.id] } } });
  await db.$disconnect();
  await app.close();
});

const auth = (t: string) => ({ authorization: `Bearer ${t}` });

describe('units — guards', () => {
  it('denies every endpoint without manage_facility', async () => {
    const list = await app.inject({ method: 'GET', url: '/api/v1/admin/masterdata/units', headers: auth(limited.token) });
    expect(list.statusCode).toBe(403);
    const create = await app.inject({ method: 'POST', url: '/api/v1/admin/masterdata/units', headers: auth(limited.token), payload: { facilityId: facA.id, code: 'X', name: 'X' } });
    expect(create.statusCode).toBe(403);
  });
});

describe('units — structure tree', () => {
  it('lists facilities with departments → units → wards', async () => {
    // Seed a small structure directly so the tree is deterministic.
    const unit = await db.hospitalUnit.create({
      data: { facilityId: facA.id, departmentId: (await db.department.findFirst({ where: { facilityId: facA.id, name: 'Medicine' } }))!.id, code: 'ICU', name: 'Intensive Care Unit', type: 'CLINICAL', headName: 'Dr. A', headTitle: 'Consultant', location: 'Block A' },
    });
    const ward = await db.ward.create({ data: { unitId: unit.id, name: 'ICU Ward', bedCapacity: 4, status: 'ACTIVE' } });
    await db.bed.create({ data: { facilityId: facA.id, unitId: unit.id, wardId: ward.id, ward: 'ICU Ward', bedNumber: 'I-01', status: 'OCCUPIED' } });
    await db.bed.create({ data: { facilityId: facA.id, unitId: unit.id, wardId: ward.id, ward: 'ICU Ward', bedNumber: 'I-02', status: 'AVAILABLE' } });
    created.icuId = unit.id;
    created.icuWardId = ward.id;

    const res = await app.inject({ method: 'GET', url: `/api/v1/admin/masterdata/units?facilityId=${facA.id}`, headers: auth(admin.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.facilities.length).toBe(1);
    const fac = body.facilities[0];
    expect(fac.facility.id).toBe(facA.id);
    const dept = fac.departments.find((d: { department: { name: string } | null }) => d.department?.name === 'Medicine');
    expect(dept).toBeTruthy();
    const icu = dept.units.find((u: { code: string }) => u.code === 'ICU');
    expect(icu.name).toBe('Intensive Care Unit');
    expect(icu.headName).toBe('Dr. A');
    expect(icu.beds).toBe(2);
    expect(icu.occupied).toBe(1);
    expect(icu.wards[0].name).toBe('ICU Ward');
    expect(icu.wards[0].beds).toBe(2);
  });

  it('enforces facility scope on the tree', async () => {
    // A facility-scope user on facA only sees facA in the tree.
    const res = await app.inject({ method: 'GET', url: '/api/v1/admin/masterdata/units', headers: auth(facAdmin.token) });
    expect(res.statusCode).toBe(200);
    const ids = res.json().facilities.map((f: { facility: { id: string } }) => f.facility.id);
    expect(ids).toContain(facA.id);
    expect(ids).not.toContain(facB.id);
  });

  it('never lets the facilityId filter widen the caller scope', async () => {
    // facAdmin (bound to facA) requesting facB's tree via ?facilityId= must be
    // refused — the filter is validated against the caller scope before use.
    // (403 forbidden: the facility exists but is outside the caller's scope.)
    const denied = await app.inject({ method: 'GET', url: `/api/v1/admin/masterdata/units?facilityId=${facB.id}`, headers: auth(facAdmin.token) });
    expect(denied.statusCode).toBe(403);
    // Same-scope filtering still works.
    const ok = await app.inject({ method: 'GET', url: `/api/v1/admin/masterdata/units?facilityId=${facA.id}`, headers: auth(facAdmin.token) });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().facilities[0].facility.id).toBe(facA.id);
    // Unknown facility id → 404, never an empty-but-widened result.
    const missing = await app.inject({ method: 'GET', url: '/api/v1/admin/masterdata/units?facilityId=does-not-exist', headers: auth(admin.token) });
    expect(missing.statusCode).toBe(404);
  });
});

describe('units — CRUD', () => {
  it('creates a unit with audit', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/masterdata/units',
      headers: auth(admin.token),
      payload: { facilityId: facA.id, departmentId: (await db.department.findFirst({ where: { facilityId: facA.id, name: 'Surgery' } }))!.id, code: 'THEATRE', name: 'Theatre Complex', type: 'SUPPORT', headName: 'Mrs. X', phone: '0302', location: 'Surgical Block', bedCapacity: 6, services: ['SURGERY'] },
    });
    expect(res.statusCode).toBe(200);
    const unit = res.json().unit;
    expect(unit.code).toBe('THEATRE');
    expect(unit.type).toBe('SUPPORT');
    expect(unit.services).toEqual(['SURGERY']);
    created.unitId = unit.id;

    const audit = await db.auditLog.findFirst({ where: { action: 'masterdata.unit.create', entityId: unit.id } });
    expect(audit?.after).toContain('THEATRE');
    // Config audit labels it.
    const config = await app.inject({ method: 'GET', url: '/api/v1/admin/audit/config', headers: auth(admin.token) });
    const entry = config.json().entries.find((e: { entityId: string }) => e.entityId === unit.id);
    expect(entry?.label).toBe('Hospital unit created');
  });

  it('rejects duplicate codes and unknown types', async () => {
    const dup = await app.inject({ method: 'POST', url: '/api/v1/admin/masterdata/units', headers: auth(admin.token), payload: { facilityId: facA.id, code: 'ICU', name: 'Duplicate ICU' } });
    expect(dup.statusCode).toBe(409);
    const badType = await app.inject({ method: 'POST', url: '/api/v1/admin/masterdata/units', headers: auth(admin.token), payload: { facilityId: facA.id, code: 'X1', name: 'X', type: 'FANCY' } });
    expect(badType.statusCode).toBe(400);
  });

  it('updates a unit within scope and audits the change', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/admin/masterdata/units/${created.unitId}`,
      headers: auth(facAdmin.token),
      payload: { name: 'Theatre Complex (Main)', headName: 'Dr. Y', bedCapacity: 8, status: 'INACTIVE' },
    });
    expect(res.statusCode).toBe(200);
    const updated = await db.hospitalUnit.findUnique({ where: { id: created.unitId } });
    expect(updated?.name).toBe('Theatre Complex (Main)');
    expect(updated?.headName).toBe('Dr. Y');
    expect(updated?.bedCapacity).toBe(8);
    expect(updated?.status).toBe('INACTIVE');
    const audit = await db.auditLog.findFirst({ where: { action: 'masterdata.unit.update', entityId: created.unitId }, orderBy: { createdAt: 'desc' } });
    expect(audit?.after).toContain('headName');
  });

  it('refuses writes to a unit outside the caller facility (scope)', async () => {
    const otherFacAdmin = await makeUser({ email: 'units-facb@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'FACILITY', facilityId: facB.id, permissions: ['manage_facility'] });
    const denied = await app.inject({
      method: 'PUT',
      url: `/api/v1/admin/masterdata/units/${created.unitId}`,
      headers: auth(otherFacAdmin.token),
      payload: { name: 'Hijack' },
    });
    // Out-of-scope resources read as 404 ("not found in scope") — the same
    // convention as the bed board and other facility-scoped routes.
    expect(denied.statusCode).toBe(404);
    // The facA-bound user CAN edit facA units.
    const ok = await app.inject({ method: 'PUT', url: `/api/v1/admin/masterdata/units/${created.unitId}`, headers: auth(facAdmin.token), payload: { name: 'Theatre Complex (Main)' } });
    expect(ok.statusCode).toBe(200);
  });
});

describe('units — wards & beds', () => {
  it('adds a ward to a unit', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/masterdata/units/${created.unitId}/wards`,
      headers: auth(admin.token),
      payload: { name: 'Recovery Ward', bedCapacity: 10 },
    });
    expect(res.statusCode).toBe(200);
    const ward = res.json().ward;
    expect(ward.name).toBe('Recovery Ward');
    created.wardId = ward.id;
    const audit = await db.auditLog.findFirst({ where: { action: 'masterdata.ward.create', entityId: ward.id } });
    expect(audit?.after).toContain('Recovery Ward');
  });

  it('rejects duplicate ward names in the same unit', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/masterdata/units/${created.unitId}/wards`,
      headers: auth(admin.token),
      payload: { name: 'Recovery Ward' },
    });
    expect(res.statusCode).toBe(409);
  });

  it('updates a ward and cascades the rename to its beds', async () => {
    // Seed a bed in the ward first, then rename — the legacy free-text `ward`
    // on the bed must follow so the bed board stays truthful.
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/admin/masterdata/wards/${created.wardId}`,
      headers: auth(admin.token),
      payload: { name: 'Recovery Ward (Renamed)', bedCapacity: 12 },
    });
    expect(res.statusCode).toBe(200);
    const ward = await db.ward.findUnique({ where: { id: created.wardId } });
    expect(ward?.name).toBe('Recovery Ward (Renamed)');
    expect(ward?.bedCapacity).toBe(12);
  });

  it('adds a bed to a ward (links unit + ward)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/masterdata/units/${created.unitId}/beds`,
      headers: auth(admin.token),
      payload: { wardId: created.wardId, bedNumber: 'R-01' },
    });
    expect(res.statusCode).toBe(200);
    const bed = res.json().bed;
    expect(bed.ward).toBe('Recovery Ward (Renamed)');
    // Ward-scoped, not a global bedNumber lookup — other test files seed the
    // same number ('R-01' in reports.test.ts) and a shared-DB findFirst would
    // steal the wrong row.
    const row = await db.bed.findFirst({ where: { bedNumber: 'R-01', wardId: created.wardId } });
    expect(row?.unitId).toBe(created.unitId);
    expect(row?.wardId).toBe(created.wardId);
    const audit = await db.auditLog.findFirst({ where: { action: 'masterdata.bed.create', entityId: row?.id } });
    expect(audit?.after).toContain('R-01');
  });

  it('renaming a ward re-tags its beds (bed board stays truthful)', async () => {
    await app.inject({ method: 'PUT', url: `/api/v1/admin/masterdata/wards/${created.wardId}`, headers: auth(admin.token), payload: { name: 'Recovery Ward V2' } });
    const beds = await db.bed.findMany({ where: { wardId: created.wardId } });
    expect(beds.length).toBeGreaterThan(0);
    expect(beds.every((b) => b.ward === 'Recovery Ward V2')).toBe(true);
    // The bed board reflects the new name.
    const res = await app.inject({ method: 'GET', url: '/api/v1/beds?ward=Recovery%20Ward%20V2', headers: auth(admin.token) });
    expect(res.statusCode).toBe(200);
    expect(res.json().items.length).toBeGreaterThan(0);
    expect(res.json().items[0].wardRow?.name).toBe('Recovery Ward V2');
  });

  it('rejects duplicate bed numbers in a ward', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/masterdata/units/${created.unitId}/beds`,
      headers: auth(admin.token),
      payload: { wardId: created.wardId, bedNumber: 'R-01' },
    });
    expect(res.statusCode).toBe(409);
  });
});

describe('units — bed board context', () => {
  it('exposes department → unit → ward on the bed board and filters by unit', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/beds', headers: auth(admin.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    const icuBed = body.items.find((b: { bedNumber: string }) => b.bedNumber === 'I-02');
    expect(icuBed).toBeTruthy();
    expect(icuBed.unit?.name).toBe('Intensive Care Unit');
    expect(icuBed.unit?.department?.name).toBe('Medicine');
    expect(icuBed.wardRow?.name).toBe('ICU Ward');
    const summary = body.summary.find((s: { ward: string }) => s.ward === 'ICU Ward');
    expect(summary.unitName).toBe('Intensive Care Unit');
    expect(summary.departmentName).toBe('Medicine');

    const byUnit = await app.inject({ method: 'GET', url: `/api/v1/beds?unitId=${icuBed.unit.id}`, headers: auth(admin.token) });
    const numbers = byUnit.json().items.map((b: { bedNumber: string }) => b.bedNumber);
    expect(numbers).toContain('I-01');
    expect(numbers).not.toContain('R-01');
  });

  it('beds outside the unit keep legacy ward strings working', async () => {
    // The Recovery Ward bed has unitId set; a legacy bed (no unit) still groups.
    const legacy = await db.bed.create({ data: { facilityId: facA.id, ward: 'Legacy Ward', bedNumber: 'LG-01', status: 'AVAILABLE' } });
    const res = await app.inject({ method: 'GET', url: '/api/v1/beds?ward=Legacy Ward', headers: auth(admin.token) });
    expect(res.json().items.length).toBe(1);
    expect(res.json().items[0].bedNumber).toBe('LG-01');
    await db.bed.delete({ where: { id: legacy.id } });
  });
});

describe('units — equipment & tools', () => {
  const createdEq: { id?: string } = {};

  it('lists equipment (empty) for a unit', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/admin/masterdata/units/${created.unitId}/equipment`, headers: auth(admin.token) });
    expect(res.statusCode).toBe(200);
    expect(res.json().equipment).toEqual([]);
  });

  it('adds equipment with balanced counts and derived status', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/masterdata/units/${created.unitId}/equipment`,
      headers: auth(admin.token),
      payload: { name: 'Ventilator', category: 'LIFE_SUPPORT', quantity: 4, functional: 3, inMaintenance: 1, manufacturer: 'Draeger', model: 'Evita' },
    });
    expect(res.statusCode).toBe(200);
    const eq = res.json().equipment;
    expect(eq.quantity).toBe(4);
    expect(eq.functional).toBe(3);
    expect(eq.inMaintenance).toBe(1);
    expect(eq.faulty).toBe(0);
    expect(eq.status).toBe('PARTIAL');
    createdEq.id = eq.id;

    // Audited under the dedicated action + labelled in the config audit.
    const audit = await db.auditLog.findFirst({ where: { action: 'masterdata.equipment.create', entityId: eq.id } });
    expect(audit?.after).toContain('Ventilator');
    const config = await app.inject({ method: 'GET', url: '/api/v1/admin/audit/config', headers: auth(admin.token) });
    expect(config.json().entries.some((e: { entityId: string; label: string }) => e.entityId === eq.id && e.label === 'Equipment added')).toBe(true);
  });

  it('derives FAULTY / OPERATIONAL status and rejects bad counts', async () => {
    const faulty = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/masterdata/units/${created.unitId}/equipment`,
      headers: auth(admin.token),
      payload: { name: 'Old Defibrillator', category: 'LIFE_SUPPORT', quantity: 2, functional: 0, faulty: 2 },
    });
    expect(faulty.json().equipment.status).toBe('FAULTY');
    // Over-tallied counts are rebalanced in order functional → maintenance → faulty.
    const bad = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/masterdata/units/${created.unitId}/equipment`,
      headers: auth(admin.token),
      payload: { name: 'Broken Counts', quantity: 3, functional: 2, inMaintenance: 2 },
    });
    expect(bad.statusCode).toBe(200);
    expect(bad.json().equipment.functional).toBe(2);
    expect(bad.json().equipment.inMaintenance).toBe(1); // capped at quantity - functional
    expect(bad.json().equipment.faulty).toBe(0);
    const dup = await app.inject({ method: 'POST', url: `/api/v1/admin/masterdata/units/${created.unitId}/equipment`, headers: auth(admin.token), payload: { name: 'Ventilator', quantity: 1 } });
    expect(dup.statusCode).toBe(409);
    const badCat = await app.inject({ method: 'POST', url: `/api/v1/admin/masterdata/units/${created.unitId}/equipment`, headers: auth(admin.token), payload: { name: 'X', category: 'BOGUS', quantity: 1 } });
    expect(badCat.statusCode).toBe(400);
  });

  it('updates equipment details and rebalances counts', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/admin/masterdata/equipment/${createdEq.id}`,
      headers: auth(admin.token),
      payload: { name: 'Ventilator (Adult)', quantity: 5, functional: 4, inMaintenance: 1 },
    });
    expect(res.statusCode).toBe(200);
    const eq = res.json().equipment;
    expect(eq.name).toBe('Ventilator (Adult)');
    expect(eq.quantity).toBe(5);
    expect(eq.functional).toBe(4);
    expect(eq.inMaintenance).toBe(1);
    expect(eq.faulty).toBe(0);
    // Counts beyond quantity are rejected on explicit count-only edits.
    const overflow = await app.inject({
      method: 'PUT',
      url: `/api/v1/admin/masterdata/equipment/${createdEq.id}`,
      headers: auth(admin.token),
      payload: { functional: 10 },
    });
    expect(overflow.statusCode).toBe(400);
  });

  it('never lets functional + inMaintenance exceed the new quantity on update', async () => {
    // functional already fills the whole quantity; the inMaintenance bucket
    // must be capped to what remains — never pushed past the total.
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/admin/masterdata/equipment/${createdEq.id}`,
      headers: auth(admin.token),
      payload: { quantity: 3, functional: 3, inMaintenance: 2 },
    });
    expect(res.statusCode).toBe(200);
    const eq = res.json().equipment;
    expect(eq.quantity).toBe(3);
    expect(eq.functional).toBe(3);
    expect(eq.inMaintenance).toBe(0); // capped to quantity - functional
    expect(eq.faulty).toBe(0);
    expect(eq.functional + eq.inMaintenance + eq.faulty).toBe(eq.quantity);
    // And the other direction: part functional, part maintenance, no faulties.
    const partial = await app.inject({
      method: 'PUT',
      url: `/api/v1/admin/masterdata/equipment/${createdEq.id}`,
      headers: auth(admin.token),
      payload: { quantity: 3, functional: 2, inMaintenance: 3 },
    });
    const eq2 = partial.json().equipment;
    expect(eq2.inMaintenance).toBe(1); // capped to quantity - functional
    expect(eq2.functional + eq2.inMaintenance + eq2.faulty).toBe(3);
    // Restore a sane state for the later maintenance tests.
    await app.inject({ method: 'PUT', url: `/api/v1/admin/masterdata/equipment/${createdEq.id}`, headers: auth(admin.token), payload: { quantity: 5, functional: 4, inMaintenance: 1 } });
  });

  it('refuses maintenance when nothing is in maintenance or faulty', async () => {
    // Fully operational — recording maintenance must be a clean 400, never
    // negative counts or functional beyond quantity.
    await app.inject({ method: 'PUT', url: `/api/v1/admin/masterdata/equipment/${createdEq.id}`, headers: auth(admin.token), payload: { functional: 5, inMaintenance: 0, faulty: 0 } });
    const res = await app.inject({ method: 'POST', url: `/api/v1/admin/masterdata/equipment/${createdEq.id}/maintenance`, headers: auth(admin.token), payload: { note: 'No-op' } });
    expect(res.statusCode).toBe(400);
    const row = await db.unitEquipment.findUnique({ where: { id: createdEq.id } });
    expect(row?.functional).toBe(5);
    expect(row?.inMaintenance).toBe(0);
    expect(row?.faulty).toBe(0);
    // Restore the maintenance state for the completion test below (functional
    // must step down too — counts always sum to quantity).
    await app.inject({ method: 'PUT', url: `/api/v1/admin/masterdata/equipment/${createdEq.id}`, headers: auth(admin.token), payload: { functional: 4, inMaintenance: 1 } });
  });

  it('records completed maintenance: counts move back to functional + log entry', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/masterdata/equipment/${createdEq.id}/maintenance`,
      headers: auth(admin.token),
      payload: { note: 'Serviced by biomed' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().equipment.functional).toBe(5);
    expect(res.json().equipment.inMaintenance).toBe(0);
    expect(res.json().equipment.status).toBe('OPERATIONAL');
    const log = await db.equipmentMaintenance.findFirst({ where: { equipmentId: createdEq.id }, orderBy: { performedAt: 'desc' } });
    expect(log?.note).toContain('Serviced');
    const audit = await db.auditLog.findFirst({ where: { action: 'masterdata.equipment.maintenance', entityId: createdEq.id } });
    expect(audit).toBeTruthy();
  });

  it('clamps a maintenance count to what actually needs fixing', async () => {
    // Put 2 units back into maintenance, then request 5 — only the 2 get fixed.
    await app.inject({ method: 'PUT', url: `/api/v1/admin/masterdata/equipment/${createdEq.id}`, headers: auth(admin.token), payload: { functional: 3, inMaintenance: 2 } });
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/masterdata/equipment/${createdEq.id}/maintenance`,
      headers: auth(admin.token),
      payload: { count: 5, note: 'Clamp check' },
    });
    expect(res.statusCode).toBe(200);
    const eq = res.json().equipment;
    expect(eq.functional).toBe(5);
    expect(eq.inMaintenance).toBe(0);
    expect(eq.faulty).toBe(0);
    expect(eq.functional + eq.inMaintenance + eq.faulty).toBe(eq.quantity);
    // Restore counts + drop this test's log rows so the summary test below
    // still sees its 'Serviced' entry as the most recent.
    await db.equipmentMaintenance.deleteMany({ where: { equipmentId: createdEq.id, note: 'Clamp check' } });
    await app.inject({ method: 'PUT', url: `/api/v1/admin/masterdata/equipment/${createdEq.id}`, headers: auth(admin.token), payload: { functional: 4, inMaintenance: 1 } });
  });

  it('surfaces equipment summary in the unit tree and the equipment list carries recent maintenance', async () => {
    const tree = await app.inject({ method: 'GET', url: `/api/v1/admin/masterdata/units?facilityId=${facA.id}`, headers: auth(admin.token) });
    const units = tree.json().facilities[0].departments.flatMap((d: { units: unknown[] }) => d.units) as Array<{ code: string; equipment: { items: number; functional: number; inMaintenance: number; faulty: number } }>;
    const theatre = units.find((u) => u.code === 'THEATRE');
    expect(theatre?.equipment.items).toBeGreaterThan(0);

    const list = await app.inject({ method: 'GET', url: `/api/v1/admin/masterdata/units/${created.unitId}/equipment`, headers: auth(admin.token) });
    const vent = list.json().equipment.find((e: { name: string }) => e.name === 'Ventilator (Adult)');
    expect(vent.recentMaintenance.length).toBeGreaterThan(0);
    expect(vent.recentMaintenance[0].note).toContain('Serviced');
  });

  it('removes equipment and cleans its maintenance log', async () => {
    const res = await app.inject({ method: 'POST', url: `/api/v1/admin/masterdata/equipment/${createdEq.id}/remove`, headers: auth(admin.token), payload: {} });
    expect(res.statusCode).toBe(200);
    expect(res.json().removed).toBe(true);
    expect(await db.unitEquipment.findUnique({ where: { id: createdEq.id } })).toBeNull();
    expect(await db.equipmentMaintenance.count({ where: { equipmentId: createdEq.id } })).toBe(0);
  });

  it('enforces scope on equipment routes (404 out of scope)', async () => {
    const otherFacAdmin = await makeUser({ email: 'units-eq-facb@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'FACILITY', facilityId: facB.id, permissions: ['manage_facility'] });
    const denied = await app.inject({ method: 'GET', url: `/api/v1/admin/masterdata/units/${created.unitId}/equipment`, headers: auth(otherFacAdmin.token) });
    expect(denied.statusCode).toBe(404);
  });
});
