import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser, makeFacility } from './helpers.js';
import type { FastifyInstance } from 'fastify';
import { initEpiSchedule, scheduleItem, getSchedule } from '../src/lib/epiSchedule.js';

let app: FastifyInstance;
let admin: { token: string };
let geoAdmin: { token: string };
let facAdmin: { token: string };
let facLocal: { token: string };
let limited: { token: string };
let regionOwn: { id: string };
let regionOther: { id: string };
let facA: { id: string };
let facB: { id: string };
let covFac: { id: string };
let covPatients: { id: string }[] = [];

beforeAll(async () => {
  // Never leak rows into the shared test DB across files.
  await db.epiScheduleItem.deleteMany();
  await initEpiSchedule(db); // fresh overlay: built-in defaults only
  // Geography + facilities used by the scope tests (created before the users).
  regionOwn = await db.region.create({ data: { code: `MSTR-O${Math.random().toString(36).slice(2, 5)}`, name: 'Masterdata Own Region', capital: 'Own City' } });
  regionOther = await db.region.create({ data: { code: `MSTR-X${Math.random().toString(36).slice(2, 5)}`, name: 'Masterdata Other Region', capital: 'Other City' } });
  facA = await makeFacility('Masterdata Facility A (synthetic)');
  facB = await makeFacility('Masterdata Facility B (synthetic)');
  covFac = await makeFacility('Coverage Edit Facility (synthetic)');

  app = await createTestApp();
  admin = await makeUser({ email: 'masterdata-admin@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'NATIONAL', permissions: ['manage_epi_schedule', 'manage_roles_permissions', 'manage_facility', 'manage_region', 'manage_district', 'view_audit'] });
  geoAdmin = await makeUser({ email: 'masterdata-geo@demo.gh', roleCode: 'REGIONAL_DIRECTOR', scope: 'REGIONAL', regionId: regionOwn.id, permissions: ['manage_region', 'manage_district'] });
  facAdmin = await makeUser({ email: 'masterdata-fac@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'NATIONAL', permissions: ['manage_facility'] });
  facLocal = await makeUser({ email: 'masterdata-faclocal@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'FACILITY', facilityId: facA.id, permissions: ['manage_facility'] });
  limited = await makeUser({ email: 'masterdata-limited@demo.gh', roleCode: 'HOSPITAL_ADMIN', permissions: ['view_patient'] });
});

afterAll(async () => {
  await db.epiScheduleItem.deleteMany();
  await db.role.deleteMany({ where: { code: { startsWith: 'MSTR-' } } });
  await db.role.deleteMany({ where: { code: 'PATIENT' } });
  await db.auditLog.deleteMany({ where: { action: { startsWith: 'masterdata.' } } });
  await db.department.deleteMany({ where: { facilityId: { in: [facA.id, facB.id, covFac.id] } } });
  await db.patient.deleteMany({ where: { id: { in: covPatients.map((p) => p.id) } } });
  await db.facility.deleteMany({ where: { id: { in: [facA.id, facB.id, covFac.id] } } });
  await db.region.deleteMany({ where: { id: { in: [regionOwn.id, regionOther.id] } } });
  await db.$disconnect();
  await app.close();
});

const auth = (t: string) => ({ authorization: `Bearer ${t}` });

describe('admin masterdata — guards', () => {
  it('denies every endpoint without the matching permission', async () => {
    const g = await app.inject({ method: 'GET', url: '/api/v1/admin/masterdata/epi-schedule', headers: auth(limited.token) });
    expect(g.statusCode).toBe(403);
    const r = await app.inject({ method: 'GET', url: '/api/v1/admin/masterdata/roles', headers: auth(limited.token) });
    expect(r.statusCode).toBe(403);
    const f = await app.inject({ method: 'GET', url: '/api/v1/admin/masterdata/facilities', headers: auth(limited.token) });
    expect(f.statusCode).toBe(403);
    const geo = await app.inject({ method: 'GET', url: '/api/v1/admin/masterdata/geography', headers: auth(limited.token) });
    expect(geo.statusCode).toBe(403);
  });
});

describe('admin masterdata — EPI schedule', () => {
  it('lists the effective schedule with default provenance', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/admin/masterdata/epi-schedule', headers: auth(admin.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items.length).toBeGreaterThanOrEqual(27); // full Ghana EPI
    const penta = body.items.find((i: { vaccine: string; dose: string }) => i.vaccine === 'PENTA' && i.dose === '1');
    expect(penta.ageDays).toBe(42);
    expect(penta.source).toBe('default');
  });

  it('applies an override to live due-date calculations and audits it', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/masterdata/epi-schedule',
      headers: auth(admin.token),
      payload: {
        items: [{ vaccine: 'PENTA', dose: '1', label: '5 weeks', description: 'Pentavalent (DTP-HepB-Hib) — 1st dose (edited)', ageDays: 35, intervalDays: null, active: true }],
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().updated).toContain('PENTA|1');
    // The runtime overlay now resolves the edited value everywhere.
    expect(scheduleItem('PENTA', '1')?.ageDays).toBe(35);
    expect(getSchedule().find((s) => s.vaccine === 'PENTA' && s.dose === '1')?.label).toBe('5 weeks');
    // The public schedule endpoint reflects the edit too (view_patient suffices).
    const pub = await app.inject({ method: 'GET', url: '/api/v1/immunizations/schedule', headers: auth(limited.token) });
    expect(pub.statusCode).toBe(200);
    expect(pub.json().schedule.find((s: { vaccine: string; dose: string }) => s.vaccine === 'PENTA' && s.dose === '1').ageDays).toBe(35);

    const audit = await db.auditLog.findFirst({ where: { action: 'masterdata.epi_schedule.update' }, orderBy: { createdAt: 'desc' } });
    expect(audit?.after).toContain('PENTA|1');

    // Provenance is now custom.
    const list = await app.inject({ method: 'GET', url: '/api/v1/admin/masterdata/epi-schedule', headers: auth(admin.token) });
    const edited = list.json().items.find((i: { vaccine: string; dose: string }) => i.vaccine === 'PENTA' && i.dose === '1');
    expect(edited.source).toBe('custom');
  });

  it('deactivating an entry removes it from the effective schedule', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/masterdata/epi-schedule',
      headers: auth(admin.token),
      payload: { items: [{ vaccine: 'ROTA', dose: '2', label: '10 weeks', description: 'Rotavirus — 2nd dose', ageDays: 70, intervalDays: null, active: false }] },
    });
    expect(res.statusCode).toBe(200);
    expect(scheduleItem('ROTA', '2')).toBeUndefined();
    expect(getSchedule().some((s) => s.vaccine === 'ROTA' && s.dose === '2')).toBe(false);
    // The admin list still surfaces the deactivated row for re-enabling.
    const list = await app.inject({ method: 'GET', url: '/api/v1/admin/masterdata/epi-schedule', headers: auth(admin.token) });
    const row = list.json().items.find((i: { vaccine: string; dose: string }) => i.vaccine === 'ROTA' && i.dose === '2');
    expect(row.active).toBe(false);
  });

  it('resets to the built-in defaults', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/admin/masterdata/epi-schedule/reset', headers: auth(admin.token), payload: {} });
    expect(res.statusCode).toBe(200);
    expect(scheduleItem('PENTA', '1')?.ageDays).toBe(42);
    expect(scheduleItem('ROTA', '2')?.ageDays).toBe(70);
    const rows = await db.epiScheduleItem.count();
    expect(rows).toBe(0);
  });

  it('validates entries', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/masterdata/epi-schedule',
      headers: auth(admin.token),
      payload: { items: [{ vaccine: 'PENTA', dose: '1', label: '', description: 'x', ageDays: -5, intervalDays: null, active: true }] },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('admin masterdata — roles & permissions', () => {
  it('lists roles with the permission catalog', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/admin/masterdata/roles', headers: auth(admin.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.catalog.some((p: { code: string }) => p.code === 'manage_epi_schedule')).toBe(true);
    expect(body.catalog.some((p: { code: string }) => p.code === 'manage_roles_permissions')).toBe(true);
    expect(body.roles.length).toBeGreaterThan(0);
    expect(body.roles[0]).toHaveProperty('permissions');
  });

  it('edits a role and the new permissions are effective on the next login', async () => {
    const role = await db.role.create({
      data: { code: `MSTR-TECH-${Math.random().toString(36).slice(2, 6)}`, name: 'Masterdata Tech', scope: 'FACILITY', permissions: JSON.stringify(['view_patient']) },
    });
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/admin/masterdata/roles/${role.code}`,
      headers: auth(admin.token),
      payload: { name: 'Masterdata Technician', scope: 'DISTRICT', permissions: ['view_patient', 'view_reports', 'export_data'] },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().role.permissions).toEqual(expect.arrayContaining(['view_reports', 'export_data']));
    const updated = await db.role.findUnique({ where: { id: role.id } });
    expect(updated?.name).toBe('Masterdata Technician');
    expect(updated?.scope).toBe('DISTRICT');
    expect(JSON.parse(updated!.permissions)).toEqual(['view_patient', 'view_reports', 'export_data']);
    const audit = await db.auditLog.findFirst({ where: { action: 'masterdata.role.update', entityId: role.id } });
    expect(audit?.after).toContain('3 permission(s)');
    expect(audit?.after).toContain('DISTRICT');

    // The configuration audit surfaces the detailed change summary (array changes).
    const config = await app.inject({ method: 'GET', url: '/api/v1/admin/audit/config', headers: auth(admin.token) });
    const entry = config.json().entries.find((e: { entityId: string }) => e.entityId === role.id);
    expect(entry).toBeTruthy();
    expect(entry.label).toBe('Role edited');
    expect(entry.summary).toContain('3 permission(s)');
    expect(entry.summary).toContain('DISTRICT');
  });

  it('rejects unknown permissions and protects the PATIENT role', async () => {
    // The PATIENT role must exist to be edited — create it for this test.
    await db.role.upsert({
      where: { code: 'PATIENT' },
      create: { code: 'PATIENT', name: 'Patient', scope: 'PATIENT', permissions: JSON.stringify(['self_access']) },
      update: {},
    });
    const bad = await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/masterdata/roles/PATIENT',
      headers: auth(admin.token),
      payload: { permissions: ['view_patient', 'bogus_perm'] },
    });
    expect(bad.statusCode).toBe(400);
    const strip = await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/masterdata/roles/PATIENT',
      headers: auth(admin.token),
      payload: { permissions: ['view_patient'] },
    });
    expect(strip.statusCode).toBe(400); // self_access is mandatory
    await db.role.deleteMany({ where: { code: 'PATIENT' } });
  });
});

describe('admin masterdata — facilities', () => {
  it('lists facilities and edits a profile (national scope)', async () => {
    const list = await app.inject({ method: 'GET', url: '/api/v1/admin/masterdata/facilities', headers: auth(facAdmin.token) });
    expect(list.statusCode).toBe(200);
    expect(list.json().facilities.some((f: { id: string }) => f.id === facA.id)).toBe(true);

    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/admin/masterdata/facilities/${facA.id}`,
      headers: auth(facAdmin.token),
      payload: { name: 'Masterdata Facility A — Renamed', operationalStatus: 'TEMPORARILY_CLOSED', bedCapacity: 120, departments: ['OPD', 'Pharmacy', 'Maternity'], services: ['OPD', 'PHARMACY'] },
    });
    expect(res.statusCode).toBe(200);
    const updated = await db.facility.findUnique({ where: { id: facA.id } });
    expect(updated?.name).toBe('Masterdata Facility A — Renamed');
    expect(updated?.operationalStatus).toBe('TEMPORARILY_CLOSED');
    expect(updated?.bedCapacity).toBe(120);
    expect(JSON.parse(updated!.departmentsJson)).toEqual(['OPD', 'Pharmacy', 'Maternity']);
    const dept = await db.department.findFirst({ where: { facilityId: facA.id, name: 'OPD' } });
    expect(dept?.status).toBe('ACTIVE');
  });

  it('clears nullable fields with an explicit empty string', async () => {
    await app.inject({ method: 'PUT', url: `/api/v1/admin/masterdata/facilities/${facA.id}`, headers: auth(facAdmin.token), payload: { website: 'https://example.org' } });
    const res = await app.inject({ method: 'PUT', url: `/api/v1/admin/masterdata/facilities/${facA.id}`, headers: auth(facAdmin.token), payload: { website: '' } });
    expect(res.statusCode).toBe(200);
    const updated = await db.facility.findUnique({ where: { id: facA.id } });
    expect(updated?.website).toBeNull();
  });

  it('enforces facility scope on writes', async () => {
    // facLocal (FACILITY scope, facilityId=facA) may edit facA but not facB.
    const ok = await app.inject({ method: 'PUT', url: `/api/v1/admin/masterdata/facilities/${facA.id}`, headers: auth(facLocal.token), payload: { name: 'Masterdata Facility A — Local Edit' } });
    expect(ok.statusCode).toBe(200);
    const denied = await app.inject({ method: 'PUT', url: `/api/v1/admin/masterdata/facilities/${facB.id}`, headers: auth(facLocal.token), payload: { name: 'Hijack' } });
    expect(denied.statusCode).toBe(403);
  });
});

describe('admin masterdata — geography', () => {
  it('edits a region and a district within scope', async () => {
    const district = await db.district.create({ data: { code: `MSTR-D${Math.random().toString(36).slice(2, 5)}`, name: 'Masterdata Own District', type: 'DISTRICT', regionId: regionOwn.id } });
    const rRes = await app.inject({
      method: 'PUT',
      url: `/api/v1/admin/masterdata/regions/${regionOwn.id}`,
      headers: auth(geoAdmin.token),
      payload: { name: 'Masterdata Own Region (renamed)', status: 'INACTIVE' },
    });
    expect(rRes.statusCode).toBe(200);
    const r = await db.region.findUnique({ where: { id: regionOwn.id } });
    expect(r?.name).toBe('Masterdata Own Region (renamed)');
    expect(r?.status).toBe('INACTIVE');

    const dRes = await app.inject({
      method: 'PUT',
      url: `/api/v1/admin/masterdata/districts/${district.id}`,
      headers: auth(geoAdmin.token),
      payload: { name: 'Masterdata Own District (renamed)', type: 'MUNICIPAL', capital: 'New Capital' },
    });
    expect(dRes.statusCode).toBe(200);
    const d = await db.district.findUnique({ where: { id: district.id } });
    expect(d?.name).toBe('Masterdata Own District (renamed)');
    expect(d?.type).toBe('MUNICIPAL');
    expect(d?.capital).toBe('New Capital');
    await db.district.delete({ where: { id: district.id } });
  });

  it('refuses region writes outside the caller scope', async () => {
    const denied = await app.inject({
      method: 'PUT',
      url: `/api/v1/admin/masterdata/regions/${regionOther.id}`,
      headers: auth(geoAdmin.token),
      payload: { name: 'Hijack' },
    });
    expect(denied.statusCode).toBe(403);
  });
});

describe('admin masterdata — coverage follows the edited schedule', () => {
  it('changes coverage denominators when a dose age is edited, then restores', async () => {
    const covAdmin = await makeUser({ email: 'coverage-edit@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'FACILITY', facilityId: covFac.id, permissions: ['manage_epi_schedule', 'view_dashboard', 'view_patient'] });
    const dob = new Date(Date.now() - 50 * 24 * 3600 * 1000); // 50 days old
    for (let i = 0; i < 2; i++) {
      const p = await db.patient.create({
        data: {
          mrn: `GH-CV${Math.random().toString(36).slice(2, 9).toUpperCase()}`,
          fullName: `Coverage Edit Child ${String.fromCharCode(65 + i)} (synthetic)`,
          dateOfBirth: dob,
          facilityId: covFac.id,
          status: 'ACTIVE',
          isSynthetic: true,
        },
      });
      covPatients.push(p);
    }

    // Default PENTA 1 due age 42 days → both 50-day-olds are eligible.
    const before = await app.inject({ method: 'GET', url: '/api/v1/immunizations/coverage', headers: auth(covAdmin.token) });
    expect(before.statusCode).toBe(200);
    const penta1Before = before.json().indicators.find((i: { key: string }) => i.key === 'PENTA_1');
    expect(penta1Before.eligible).toBe(2);

    // Edit PENTA 1 to 60 days → nobody in the cohort is old enough anymore.
    const put = await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/masterdata/epi-schedule',
      headers: auth(covAdmin.token),
      payload: { items: [{ vaccine: 'PENTA', dose: '1', label: '6 weeks', description: 'Pentavalent (DTP-HepB-Hib) — 1st dose (edited)', ageDays: 60, intervalDays: null, active: true }] },
    });
    expect(put.statusCode).toBe(200);
    const after = await app.inject({ method: 'GET', url: '/api/v1/immunizations/coverage', headers: auth(covAdmin.token) });
    const penta1After = after.json().indicators.find((i: { key: string }) => i.key === 'PENTA_1');
    expect(penta1After.eligible).toBe(0);
    expect(penta1After.coveragePct).toBe(0);

    // Reset restores the default denominator.
    await app.inject({ method: 'POST', url: '/api/v1/admin/masterdata/epi-schedule/reset', headers: auth(covAdmin.token), payload: {} });
    const restored = await app.inject({ method: 'GET', url: '/api/v1/immunizations/coverage', headers: auth(covAdmin.token) });
    expect(restored.json().indicators.find((i: { key: string }) => i.key === 'PENTA_1').eligible).toBe(2);
  });

  it('previews an unsaved schedule draft via previewItems without mutating anything', async () => {
    const covAdmin = await makeUser({ email: 'coverage-preview@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'FACILITY', facilityId: covFac.id, permissions: ['manage_epi_schedule', 'view_dashboard', 'view_patient'] });
    // 50-day-old cohort exists; PENTA 1 default due age 42 → eligible.
    const live = await app.inject({ method: 'GET', url: '/api/v1/immunizations/coverage', headers: auth(covAdmin.token) });
    expect(live.json().indicators.find((i: { key: string }) => i.key === 'PENTA_1').eligible).toBe(2);

    // Preview with a later due age → nobody eligible, and no schedule mutation.
    const preview = encodeURIComponent(JSON.stringify([{ vaccine: 'PENTA', dose: '1', ageDays: 60, active: true }]));
    const res = await app.inject({ method: 'GET', url: `/api/v1/immunizations/coverage?previewItems=${preview}`, headers: auth(covAdmin.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.preview).toBe(true);
    expect(body.indicators.find((i: { key: string }) => i.key === 'PENTA_1').eligible).toBe(0);
    // Preview deactivation drops the indicator.
    const dropPreview = encodeURIComponent(JSON.stringify([{ vaccine: 'ROTA', dose: '2', ageDays: 70, active: false }]));
    const drop = await app.inject({ method: 'GET', url: `/api/v1/immunizations/coverage?previewItems=${dropPreview}`, headers: auth(covAdmin.token) });
    const keys = drop.json().indicators.map((i: { key: string }) => i.key);
    expect(keys).not.toContain('ROTA_2');
    // Nothing was persisted.
    expect(await db.epiScheduleItem.count()).toBe(0);
    expect(scheduleItem('PENTA', '1')?.ageDays).toBe(42);
  });

  it('drops coverage indicators for deactivated doses and restores them', async () => {
    const covAdmin = await makeUser({ email: 'coverage-drop@demo.gh', roleCode: 'HOSPITAL_ADMIN', scope: 'FACILITY', facilityId: covFac.id, permissions: ['manage_epi_schedule', 'view_dashboard', 'view_patient'] });
    const before = await app.inject({ method: 'GET', url: '/api/v1/immunizations/coverage', headers: auth(covAdmin.token) });
    expect(before.json().indicators.some((i: { key: string }) => i.key === 'ROTA_2')).toBe(true);

    await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/masterdata/epi-schedule',
      headers: auth(covAdmin.token),
      payload: { items: [{ vaccine: 'ROTA', dose: '2', label: '10 weeks', description: 'Rotavirus — 2nd dose', ageDays: 70, intervalDays: null, active: false }] },
    });
    const after = await app.inject({ method: 'GET', url: '/api/v1/immunizations/coverage', headers: auth(covAdmin.token) });
    const keys = after.json().indicators.map((i: { key: string }) => i.key);
    expect(keys).not.toContain('ROTA_2');
    // Deactivation does not orphan the fully-immunized definition (it derives from survivors).
    expect(after.json().fullyImmunized).toBeTruthy();

    await app.inject({ method: 'POST', url: '/api/v1/admin/masterdata/epi-schedule/reset', headers: auth(covAdmin.token), payload: {} });
    const restored = await app.inject({ method: 'GET', url: '/api/v1/immunizations/coverage', headers: auth(covAdmin.token) });
    expect(restored.json().indicators.some((i: { key: string }) => i.key === 'ROTA_2')).toBe(true);
  });
});
