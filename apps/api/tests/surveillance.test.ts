import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { db, createTestApp, makeUser, makeFacility, type TestUser } from './helpers.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;
let hio: TestUser; // health information officer — can read + manage at facility A
let viewer: TestUser; // can read only (no manage_surveillance)
let outsider: TestUser; // full surveillance rights but at facility B
let nurse: TestUser; // no surveillance permissions at all
let facilityA: Awaited<ReturnType<typeof makeFacility>>;
let facilityB: Awaited<ReturnType<typeof makeFacility>>;
let patientA: { id: string; mrn: string };
let patientB: { id: string; mrn: string };

const auth = (u: TestUser) => ({ authorization: `Bearer ${u.token}` });

async function makePatient(name: string, as: TestUser) {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/patients',
    headers: auth(as),
    payload: { fullName: name, dateOfBirth: '1990-05-10', phone: `0244${String(Math.floor(Math.random() * 9000000) + 1000000)}`, force: true },
  });
  expect(res.statusCode).toBe(200);
  return res.json().patient as { id: string; mrn: string };
}

async function reportCase(payload: Record<string, unknown>, as: TestUser) {
  return app.inject({ method: 'POST', url: '/api/v1/surveillance/cases', headers: auth(as), payload });
}

beforeAll(async () => {
  app = await createTestApp();
  facilityA = await makeFacility('Surveillance Facility A (synthetic)');
  facilityB = await makeFacility('Surveillance Facility B (synthetic)');
  hio = await makeUser({ email: 'surv-hio@demo.gh', roleCode: 'HEALTH_INFO_OFFICER', facilityId: facilityA.id, permissions: ['view_surveillance', 'manage_surveillance', 'view_patient', 'create_patient'] });
  viewer = await makeUser({ email: 'surv-viewer@demo.gh', roleCode: 'HEALTH_INFO_OFFICER', facilityId: facilityA.id, permissions: ['view_surveillance', 'view_patient'] });
  outsider = await makeUser({ email: 'surv-outsider@demo.gh', roleCode: 'HEALTH_INFO_OFFICER', facilityId: facilityB.id, permissions: ['view_surveillance', 'manage_surveillance', 'view_patient', 'create_patient'] });
  nurse = await makeUser({ email: 'surv-nurse@demo.gh', roleCode: 'NURSE', facilityId: facilityA.id, permissions: ['view_patient', 'create_patient', 'write_clinical_note'] });
  patientA = await makePatient('Surveillance Patient A (synthetic)', hio);
  patientB = await makePatient('Surveillance Patient B (synthetic)', outsider);
});

afterAll(async () => {
  // Remove rows created by these tests — never leak synthetic state into
  // other test files (shared DB). Roles are removed by the exact ids this
  // file's makeUser calls created.
  const userIds = [hio.userId, viewer.userId, outsider.userId, nurse.userId];
  const roleIds = (await db.user.findMany({ where: { id: { in: userIds } }, select: { roleId: true } })).map((u) => u.roleId);
  await db.caseFollowUp.deleteMany({ where: { case: { facilityId: { in: [facilityA.id, facilityB.id] } } } });
  await db.diseaseCase.deleteMany({ where: { facilityId: { in: [facilityA.id, facilityB.id] } } });
  await db.patient.deleteMany({ where: { id: { in: [patientA.id, patientB.id] } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.role.deleteMany({ where: { id: { in: roleIds } } });
  await db.facility.deleteMany({ where: { id: { in: [facilityA.id, facilityB.id] } } });
  await app.close();
});

describe('surveillance permissions', () => {
  it('denies the register without view_surveillance (403 for a nurse)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/surveillance/cases', headers: auth(nurse) });
    expect(res.statusCode).toBe(403);
  });

  it('lets a viewer read but not manage (403 on report/update/follow-up)', async () => {
    const list = await app.inject({ method: 'GET', url: '/api/v1/surveillance/cases', headers: auth(viewer) });
    expect(list.statusCode).toBe(200);
    expect(Array.isArray(list.json().items)).toBe(true);

    const report = await reportCase({ facilityId: facilityA.id, disease: 'Measles', caseType: 'SUSPECTED' }, viewer);
    expect(report.statusCode).toBe(403);
  });
});

describe('reporting disease cases', () => {
  let caseId: string;

  it('reports a case with patient linkage, severity and notes', async () => {
    const res = await reportCase(
      { facilityId: facilityA.id, patientId: patientA.id, disease: 'Cholera', caseType: 'CONFIRMED', severity: 'SEVERE', notes: 'Isolation bay admission.' },
      hio,
    );
    expect(res.statusCode).toBe(200);
    const created = res.json().case;
    expect(created.disease).toBe('Cholera');
    expect(created.caseType).toBe('CONFIRMED');
    expect(created.severity).toBe('SEVERE');
    expect(created.status).toBe('OPEN');
    expect(created.patient?.id).toBe(patientA.id);
    expect(created.reporter?.id).toBe(hio.userId);
    expect(created.followUpCount).toBe(0);
    caseId = created.id as string;

    // Audited under the dedicated action with the reporter recorded.
    const audit = await db.auditLog.findFirst({ where: { action: 'surveillance.case.report', entityId: caseId } });
    expect(audit?.actorId).toBe(hio.userId);
  });

  it('validates required fields and enums', async () => {
    const noFacility = await reportCase({ disease: 'Cholera', caseType: 'SUSPECTED' }, hio);
    expect(noFacility.statusCode).toBe(400);

    const badType = await reportCase({ facilityId: facilityA.id, disease: 'Cholera', caseType: 'POSSIBLE' }, hio);
    expect(badType.statusCode).toBe(400);

    const badSeverity = await reportCase({ facilityId: facilityA.id, disease: 'Cholera', caseType: 'SUSPECTED', severity: 'EXTREME' }, hio);
    expect(badSeverity.statusCode).toBe(400);

    // A new case cannot be born closed — it must be investigated first.
    const closed = await reportCase({ facilityId: facilityA.id, disease: 'Cholera', caseType: 'SUSPECTED', status: 'CLOSED' }, hio);
    expect(closed.statusCode).toBe(400);

    // Unknown patient id is rejected.
    const ghost = await reportCase({ facilityId: facilityA.id, patientId: 'no-such-patient', disease: 'Measles' }, hio);
    expect(ghost.statusCode).toBe(404);

    // A facility user cannot link a patient registered at ANOTHER facility —
    // linking a foreign patient would leak their name/MRN to case viewers.
    const foreign = await reportCase({ facilityId: facilityA.id, patientId: patientB.id, disease: 'Measles', caseType: 'SUSPECTED' }, hio);
    expect(foreign.statusCode).toBe(403);

    // Invalid date filters fail loudly instead of being silently ignored.
    const badFrom = await app.inject({ method: 'GET', url: '/api/v1/surveillance/cases?from=not-a-date', headers: auth(hio) });
    expect(badFrom.statusCode).toBe(400);
    const badTo = await app.inject({ method: 'GET', url: '/api/v1/surveillance/cases?to=32-13-2026', headers: auth(hio) });
    expect(badTo.statusCode).toBe(400);
  });

  it('denies reporting for a facility outside the caller scope (403)', async () => {
    const res = await reportCase({ facilityId: facilityB.id, disease: 'Measles', caseType: 'SUSPECTED' }, hio);
    expect(res.statusCode).toBe(403);
  });

  it('scopes the register and the facilityId filter', async () => {
    // facility-B officer never sees facility-A rows.
    const list = await app.inject({ method: 'GET', url: '/api/v1/surveillance/cases', headers: auth(outsider) });
    expect(list.statusCode).toBe(200);
    const ids = list.json().items as Array<{ id: string }>;
    expect(ids.some((c) => c.id === caseId)).toBe(false);

    // The facilityId filter cannot widen scope — asking for A as a B user is forbidden.
    const widen = await app.inject({ method: 'GET', url: `/api/v1/surveillance/cases?facilityId=${facilityA.id}`, headers: auth(outsider) });
    expect(widen.statusCode).toBe(403);

    // Detail of an out-of-scope case is a 404, not a leak.
    const detail = await app.inject({ method: 'GET', url: `/api/v1/surveillance/cases/${caseId}`, headers: auth(outsider) });
    expect(detail.statusCode).toBe(404);
  });

  it('filters the register by disease, status, caseType and search', async () => {
    const byDisease = await app.inject({ method: 'GET', url: '/api/v1/surveillance/cases?disease=Cholera', headers: auth(hio) });
    expect((byDisease.json().items as Array<{ disease: string }>).every((c) => c.disease === 'Cholera')).toBe(true);

    const byStatus = await app.inject({ method: 'GET', url: '/api/v1/surveillance/cases?status=OPEN', headers: auth(hio) });
    expect((byStatus.json().items as Array<{ status: string }>).every((c) => c.status === 'OPEN')).toBe(true);

    const badStatus = await app.inject({ method: 'GET', url: '/api/v1/surveillance/cases?status=DELETED', headers: auth(hio) });
    expect(badStatus.statusCode).toBe(400);

    const byQ = await app.inject({ method: 'GET', url: `/api/v1/surveillance/cases?q=${encodeURIComponent('Surveillance Patient A')}`, headers: auth(hio) });
    expect((byQ.json().items as Array<{ id: string }>).some((c) => c.id === caseId)).toBe(true);
  });
});

describe('case lifecycle', () => {
  let caseId: string;

  beforeAll(async () => {
    const res = await reportCase({ facilityId: facilityA.id, patientId: patientA.id, disease: 'Measles', caseType: 'SUSPECTED', severity: 'MODERATE' }, hio);
    caseId = res.json().case.id as string;
  });

  it('moves OPEN → INVESTIGATED → CLOSED (with outcome), blocking illegal jumps', async () => {
    // Closing without an outcome is refused.
    const noOutcome = await app.inject({ method: 'PATCH', url: `/api/v1/surveillance/cases/${caseId}`, headers: auth(hio), payload: { status: 'CLOSED' } });
    expect(noOutcome.statusCode).toBe(400);

    const investigate = await app.inject({ method: 'PATCH', url: `/api/v1/surveillance/cases/${caseId}`, headers: auth(hio), payload: { status: 'INVESTIGATED' } });
    expect(investigate.statusCode).toBe(200);
    expect(investigate.json().case.status).toBe('INVESTIGATED');

    // No backwards jumps from INVESTIGATED.
    const backwards = await app.inject({ method: 'PATCH', url: `/api/v1/surveillance/cases/${caseId}`, headers: auth(hio), payload: { status: 'CLOSED', outcome: 'RECOVERED' } });
    expect(backwards.statusCode).toBe(200);
    expect(backwards.json().case.status).toBe('CLOSED');
    expect(backwards.json().case.outcome).toBe('RECOVERED');

    // Terminal-ish: a closed case can only reopen, not re-investigate.
    const slip = await app.inject({ method: 'PATCH', url: `/api/v1/surveillance/cases/${caseId}`, headers: auth(hio), payload: { status: 'INVESTIGATED' } });
    expect(slip.statusCode).toBe(400);

    // Reopening is allowed when new information surfaces.
    const reopen = await app.inject({ method: 'PATCH', url: `/api/v1/surveillance/cases/${caseId}`, headers: auth(hio), payload: { status: 'OPEN' } });
    expect(reopen.statusCode).toBe(200);
    expect(reopen.json().case.status).toBe('OPEN');
  });

  it('updates caseType, severity, disease and notes', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/surveillance/cases/${caseId}`,
      headers: auth(hio),
      payload: { caseType: 'CONFIRMED', severity: 'MILD', disease: 'Measles (Rubeola)', notes: 'Lab-confirmed via serology.' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().case.caseType).toBe('CONFIRMED');
    expect(res.json().case.severity).toBe('MILD');
    expect(res.json().case.notes).toContain('Lab-confirmed');

    const badType = await app.inject({ method: 'PATCH', url: `/api/v1/surveillance/cases/${caseId}`, headers: auth(hio), payload: { caseType: 'WILD' } });
    expect(badType.statusCode).toBe(400);
  });
});

describe('contact-tracing follow-ups', () => {
  let caseId: string;

  beforeAll(async () => {
    const res = await reportCase({ facilityId: facilityA.id, patientId: patientA.id, disease: 'Acute Flaccid Paralysis', caseType: 'SUSPECTED', severity: 'CRITICAL' }, hio);
    caseId = res.json().case.id as string;
  });

  it('records a follow-up with temperature and traced contacts', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/surveillance/cases/${caseId}/follow-ups`,
      headers: auth(hio),
      payload: { status: 'WORSENING', temperature: 38.9, contactsTraced: 4, notes: 'Stool specimens collected; household contacts listed.' },
    });
    expect(res.statusCode).toBe(200);
    const fu = res.json().followUp;
    expect(fu.status).toBe('WORSENING');
    expect(fu.temperature).toBe(38.9);
    expect(fu.contactsTraced).toBe(4);
    expect(fu.by?.id).toBe(hio.userId);

    const audit = await db.auditLog.findFirst({ where: { action: 'surveillance.case.followUp', entityId: caseId } });
    expect(audit?.after).toContain('"status":"WORSENING"');

    // Detail now carries the follow-up timeline and an incremented count.
    const detail = await app.inject({ method: 'GET', url: `/api/v1/surveillance/cases/${caseId}`, headers: auth(hio) });
    expect(detail.json().followUps).toHaveLength(1);
    expect(detail.json().case.followUpCount).toBe(1);
  });

  it('validates follow-up status, temperature and contacts', async () => {
    const badStatus = await app.inject({ method: 'POST', url: `/api/v1/surveillance/cases/${caseId}/follow-ups`, headers: auth(hio), payload: { status: 'FINE' } });
    expect(badStatus.statusCode).toBe(400);

    const badTemp = await app.inject({ method: 'POST', url: `/api/v1/surveillance/cases/${caseId}/follow-ups`, headers: auth(hio), payload: { status: 'STABLE', temperature: 52 } });
    expect(badTemp.statusCode).toBe(400);

    const badContacts = await app.inject({ method: 'POST', url: `/api/v1/surveillance/cases/${caseId}/follow-ups`, headers: auth(hio), payload: { status: 'STABLE', contactsTraced: -3 } });
    expect(badContacts.statusCode).toBe(200); // clamped to 0
    expect(badContacts.json().followUp.contactsTraced).toBe(0);
  });

  it('refuses follow-ups for an out-of-scope case (404)', async () => {
    const res = await app.inject({ method: 'POST', url: `/api/v1/surveillance/cases/${caseId}/follow-ups`, headers: auth(outsider), payload: { status: 'STABLE' } });
    expect(res.statusCode).toBe(404);
  });
});

describe('surveillance summary', () => {
  it('rolls up totals, diseases, geography and a dense 30-day trend', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/surveillance/cases/summary', headers: auth(hio) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.totals.cases).toBeGreaterThanOrEqual(3);
    expect(body.totals.open).toBeGreaterThanOrEqual(1);
    expect(body.totals.contactsTraced).toBeGreaterThanOrEqual(4);
    expect(body.totals.followUps).toBeGreaterThanOrEqual(1);
    // The reported diseases (Cholera, Measles, AFP) are all present.
    const diseases = body.byDisease as Array<{ disease: string; count: number }>;
    expect(diseases.some((d) => d.disease === 'Cholera')).toBe(true);
    expect(diseases.some((d) => d.disease === 'Measles (Rubeola)')).toBe(true);
    // Geography roll-ups include the facility's district/region.
    expect(Object.keys(body.byRegion).length).toBeGreaterThanOrEqual(1);
    expect(Object.keys(body.byDistrict).length).toBeGreaterThanOrEqual(1);
    // Dense trend: exactly 30 zero-filled days.
    expect(body.trend).toHaveLength(30);
    expect(body.trend.some((p: { count: number }) => p.count > 0)).toBe(true);
  });

  it('scopes the summary to the caller geography', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/surveillance/cases/summary', headers: auth(outsider) });
    expect(res.statusCode).toBe(200);
    // facility-B officer has zero cases of their own.
    expect(res.json().totals.cases).toBe(0);
  });
});
