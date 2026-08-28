import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { db, createTestApp, makeUser, makeFacility } from './helpers.js';
import type { FastifyInstance } from 'fastify';
import { enqueue, deliverPending, integrationStatus, type IntegrationConfig, type Transport } from '../src/modules/integrations/engine.js';
import { dhims2Transport } from '../src/modules/integrations/dhims2.js';
import { sormasTransport } from '../src/modules/integrations/sormas.js';
import { ghilmisTransport } from '../src/modules/integrations/ghilmis.js';
import { hrimsTransport } from '../src/modules/integrations/hrims.js';
import { nhisTransport } from '../src/modules/integrations/nhis.js';
import { etrackerTransport } from '../src/modules/integrations/etracker.js';
import { lhimsTransport } from '../src/modules/integrations/lhim.js';

// ---------------------------------------------------------------------------
// National integration adapters (docs/08 §3): DHIMS2 monthly datasets built
// live from platform records, SORMAS disease case events, GhiLMIS logistics
// stock-level snapshots, HRIMS workforce register — all delivered through
// independent idempotent queues with backoff. Tests drive the routes
// (queue/export/status) and the engine (delivery, retry, isolation) against
// fake upstreams.
// ---------------------------------------------------------------------------

const PERMS = ['manage_integrations', 'view_reports', 'view_dashboard', 'manage_surveillance', 'create_patient', 'view_patient', 'export_data', 'write_clinical_note'];
const auth = (t: string) => ({ authorization: `Bearer ${t}` });

let app: FastifyInstance;
let admin: { token: string };
let facilityId: string;
let patientId: string;

const month = new Date();
const PERIOD = `${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, '0')}`;
const DHIMS_PERIOD = PERIOD.replace('-', '');

function testConfig(maxAttempts = 3, batchSize = 10): IntegrationConfig {
  return {
    dhims2: { url: 'http://127.0.0.1:1', username: 'u', password: 'p' }, // unreachable by default
    sormas: { url: 'http://127.0.0.1:1', username: 'u', password: 'p' },
    ghilmis: { url: 'http://127.0.0.1:1', username: 'u', password: 'p' },
    hrims: { url: 'http://127.0.0.1:1', username: 'u', password: 'p' },
    nhis: { url: 'http://127.0.0.1:1', username: 'u', password: 'p' },
    etracker: { url: 'http://127.0.0.1:1', username: 'u', password: 'p' },
    lhims: { url: 'http://127.0.0.1:1', username: 'u', password: 'p' },
    sweepIntervalMs: 60_000,
    maxAttempts,
    batchSize,
  };
}

const silent = { info: () => {}, warn: () => {}, error: () => {} };

beforeAll(async () => {
  app = await createTestApp();
  admin = await makeUser({ email: 'integration-admin@demo.gh', roleCode: 'NATIONAL_ADMIN', scope: 'NATIONAL', facilityId: null, permissions: PERMS });
  const facility = await makeFacility('Integration Test Facility (synthetic)');
  facilityId = facility.id;
  // A facility-scoped user for scope tests.
  const facilityUser = await makeUser({ email: 'integration-facility@demo.gh', roleCode: 'HOSPITAL_ADMIN', facilityId: facility.id, permissions: PERMS });
  void facilityUser;

  // Seed a patient + encounter in the current month so OPD indicators are live.
  const patient = await app.inject({
    method: 'POST', url: '/api/v1/patients', headers: auth(admin.token),
    payload: { fullName: 'Integration Patient (synthetic)', dateOfBirth: '1990-05-05', phone: '0555000888', sex: 'M', force: true },
  });
  patientId = (patient.json().patient as { id: string }).id;
  // Place the patient at the test facility so facility-scoped adapters
  // (eTracker client cohort, LHIMS encounter scope) resolve them.
  await db.patient.update({ where: { id: patientId }, data: { facilityId } });
  const enc = await app.inject({
    method: 'POST', url: `/api/v1/patients/${patientId}/encounters`, headers: auth(admin.token),
    payload: { type: 'OPD', presentingComplaint: 'Integration test encounter' },
  });
  expect(enc.statusCode).toBe(200);
  await db.encounter.update({ where: { id: (enc.json().encounter as { id: string }).id }, data: { facilityId } });

  // A stock item on the test facility so the GhiLMIS snapshot has live data.
  await db.stockItem.create({
    data: { facilityId, name: 'Paracetamol 500mg', category: 'MEDICINE', unit: 'tablet', quantity: 12, minStock: 50, reorderLevel: 80, batch: 'TST-1', status: 'ACTIVE' },
  });
  // A staff member so the HRIMS register snapshot has live data.
  await db.staff.create({
    data: { facilityId, staffNumber: 'TST-0001', fullName: 'Integration Staff (synthetic)', role: 'NURSE', licenseNumber: 'NMC-001', employmentStatus: 'ACTIVE', headOfUnit: false },
  });
  // A maternal client so the eTracker cohort has live data: one ANC visit
  // (HIGH risk) and one delivery this period.
  await db.antenatalVisit.create({
    data: { patientId, facilityId, visitNumber: 1, gaWeeks: 20, riskAssessment: 'HIGH', status: 'ACTIVE', visitedAt: new Date() },
  });
  await db.deliveryRecord.create({
    data: { patientId, facilityId, deliveryType: 'NORMAL', outcome: 'LIVE_BIRTH', maternalOutcome: 'WELL', newbornOutcome: 'WELL', deliveredAt: new Date() },
  });
  // A VERIFIED lab result so the LHIMS FHIR bundle has a DiagnosticReport.
  const encRow = await db.encounter.findFirst({ where: { patientId } });
  if (encRow) {
    await db.labOrder.create({
      data: { encounterId: encRow.id, patientId, facilityId, test: 'Malaria RDT', discipline: 'MICROBIOLOGY', status: 'VERIFIED', result: 'Positive', referenceRange: 'Negative', critical: false },
    });
  }
});

afterAll(async () => {
  // Tidy the shared test DB for files that run after this one (the suite's
  // test files share one SQLite file and run sequentially).
  await db.integrationDelivery.deleteMany();
  await db.stockItem.deleteMany({ where: { name: 'Paracetamol 500mg' } });
  await db.staff.deleteMany({ where: { staffNumber: 'TST-0001' } });
  if (patientId) {
    await db.labOrder.deleteMany({ where: { patientId } });
    await db.antenatalVisit.deleteMany({ where: { patientId } });
    await db.deliveryRecord.deleteMany({ where: { patientId } });
    await db.diseaseCase.deleteMany({ where: { patientId } });
    await db.encounter.deleteMany({ where: { patientId } });
    await db.patient.deleteMany({ where: { id: patientId } });
  }
  await db.$disconnect();
  await app.close();
});

describe('DHIMS2 adapter', () => {
  it('builds a monthly dataset submission from live indicators (dry run)', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/v1/integrations/dhims2/queue', headers: auth(admin.token),
      payload: { period: PERIOD, dryRun: true },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.dryRun).toBe(true);
    expect(body.configured).toBe(false);
    expect(body.submission.dataSet).toBe('GIHM-HIS');
    expect(body.submission.period).toBe(DHIMS_PERIOD);
    expect(body.submission.orgUnit).toBe('NATIONAL');
    // The seeded encounter makes OPD_ATTENDANCE (1A) live and >= 1.
    const opd = body.submission.dataValues.find((dv: { dataElement: string }) => dv.dataElement === '1A');
    expect(opd).toBeTruthy();
    expect(opd.value).toBeGreaterThanOrEqual(1);
    // Not-collected indicators (e.g. 2A ANC) never appear.
    expect(body.submission.dataValues.some((dv: { dataElement: string }) => dv.dataElement === '2A')).toBe(false);
  });

  it('uses the facility code as the org unit for a facility-scoped caller', async () => {
    const facilityUser = await makeUser({ email: 'integration-facility-2@demo.gh', roleCode: 'HOSPITAL_ADMIN', facilityId, permissions: PERMS });
    const res = await app.inject({
      method: 'POST', url: '/api/v1/integrations/dhims2/queue', headers: auth(facilityUser.token),
      payload: { period: PERIOD, dryRun: true },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    const facility = await db.facility.findUnique({ where: { id: facilityId } });
    expect(body.submission.orgUnit).toBe(facility?.code);
  });

  it('rejects an invalid period', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/v1/integrations/dhims2/queue', headers: auth(admin.token),
      payload: { period: '2026-13', dryRun: true },
    });
    expect(res.statusCode).toBe(400);
  });

  it('exports the dataset as DHIMS2 import CSV', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/integrations/dhims2/export?period=${PERIOD}&format=csv`, headers: auth(admin.token) });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.body).toContain('"dataSet","period","orgUnit","dataElement"');
    expect(res.body).toContain('"1A"');
  });
});

describe('GhiLMIS adapter', () => {
  it('builds a monthly stock-level snapshot from live inventory (dry run)', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/v1/integrations/ghilmis/queue', headers: auth(admin.token),
      payload: { period: PERIOD, dryRun: true },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.dryRun).toBe(true);
    expect(body.configured).toBe(false);
    expect(body.submission.dataSet).toBe('GIHM-STOCK');
    expect(body.submission.period).toBe(PERIOD);
    expect(body.submission.orgUnit).toBe('NATIONAL');
    // The seeded test stock item is in scope (national = all facilities).
    const item = body.submission.items.find((i: { commodity: string }) => i.commodity === 'Paracetamol 500mg');
    expect(item).toBeTruthy();
    expect(item.quantity).toBe(12);
    // Derived status: quantity 12 <= reorderLevel 80 → LOW.
    expect(item.status).toBe('LOW');
  });

  it('uses the facility code as the org unit for a facility-scoped caller', async () => {
    const facilityUser = await makeUser({ email: 'integration-facility-ghilmis@demo.gh', roleCode: 'HOSPITAL_ADMIN', facilityId, permissions: PERMS });
    const res = await app.inject({
      method: 'POST', url: '/api/v1/integrations/ghilmis/queue', headers: auth(facilityUser.token),
      payload: { period: PERIOD, dryRun: true },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    const facility = await db.facility.findUnique({ where: { id: facilityId } });
    expect(body.submission.orgUnit).toBe(facility?.code);
    // Facility scope sees only its own items.
    expect(body.submission.items).toHaveLength(1);
    expect(body.submission.items[0].commodity).toBe('Paracetamol 500mg');
  });

  it('rejects an invalid period', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/v1/integrations/ghilmis/queue', headers: auth(admin.token),
      payload: { period: '2026-13', dryRun: true },
    });
    expect(res.statusCode).toBe(400);
  });

  it('exports the snapshot as GhiLMIS stock CSV', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/integrations/ghilmis/export?period=${PERIOD}&format=csv`, headers: auth(admin.token) });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.body).toContain('"orgUnit","period","commodity","category"');
    expect(res.body).toContain('"Paracetamol 500mg"');
    expect(res.body).toContain('"LOW"');
  });
});

describe('HRIMS adapter', () => {
  it('builds a monthly workforce register snapshot from live staff (dry run)', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/v1/integrations/hrims/queue', headers: auth(admin.token),
      payload: { period: PERIOD, dryRun: true },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.dryRun).toBe(true);
    expect(body.configured).toBe(false);
    expect(body.submission.dataSet).toBe('GIHM-STAFF');
    expect(body.submission.period).toBe(PERIOD);
    expect(body.submission.orgUnit).toBe('NATIONAL');
    // The seeded test staff member is in scope (national = all facilities).
    const row = body.submission.staff.find((s: { staffNumber: string }) => s.staffNumber === 'TST-0001');
    expect(row).toBeTruthy();
    expect(row.fullName).toBe('Integration Staff (synthetic)');
    expect(row.role).toBe('NURSE');
    expect(row.licenseNumber).toBe('NMC-001');
    expect(body.submission.summary.active).toBeGreaterThanOrEqual(1);
  });

  it('uses the facility code as the org unit for a facility-scoped caller', async () => {
    const facilityUser = await makeUser({ email: 'integration-facility-hrims@demo.gh', roleCode: 'HOSPITAL_ADMIN', facilityId, permissions: PERMS });
    const res = await app.inject({
      method: 'POST', url: '/api/v1/integrations/hrims/queue', headers: auth(facilityUser.token),
      payload: { period: PERIOD, dryRun: true },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    const facility = await db.facility.findUnique({ where: { id: facilityId } });
    expect(body.submission.orgUnit).toBe(facility?.code);
    // Facility scope sees only its own staff.
    expect(body.submission.staff).toHaveLength(1);
    expect(body.submission.staff[0].staffNumber).toBe('TST-0001');
    expect(body.submission.staff[0].facilityCode).toBe(facility?.code);
  });

  it('rejects an invalid period', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/v1/integrations/hrims/queue', headers: auth(admin.token),
      payload: { period: '2026-13', dryRun: true },
    });
    expect(res.statusCode).toBe(400);
  });

  it('exports the register as HRIMS staff CSV', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/integrations/hrims/export?period=${PERIOD}&format=csv`, headers: auth(admin.token) });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.body).toContain('"orgUnit","period","staffNumber","fullName"');
    expect(res.body).toContain('"TST-0001"');
  });
});

describe('NHIS adapter', () => {
  let schemeId = '';
  let claimId = '';
  let claimNumber = '';

  beforeAll(async () => {
    const scheme = await db.insuranceScheme.create({
      data: { code: `TST-NHIS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, name: 'NHIS Test Scheme (synthetic)', type: 'NHIS', isSynthetic: true },
    });
    schemeId = scheme.id;
    const claim = await db.insuranceClaim.create({
      data: {
        claimNumber: `CLM-NHIS-${Math.floor(Math.random() * 9000) + 1000}`,
        patientId,
        schemeId: scheme.id,
        facilityId,
        serviceDate: new Date(),
        items: JSON.stringify([{ description: 'OPD consultation', amount: 50 }, { description: 'Blood test', amount: 30 }]),
        amount: 80,
        status: 'SUBMITTED',
        isSynthetic: true,
      },
    });
    claimId = claim.id;
    claimNumber = claim.claimNumber;
  });

  afterAll(async () => {
    await db.insuranceClaim.deleteMany({ where: { id: claimId } });
    await db.insuranceScheme.deleteMany({ where: { id: schemeId } });
  });

  it('builds a claims submission from SUBMITTED claims (dry run)', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/integrations/nhis/queue', headers: auth(admin.token), payload: { period: PERIOD, dryRun: true } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.dryRun).toBe(true);
    expect(body.configured).toBe(false);
    expect(body.submission.dataSet).toBe('NHIS-CLAIMS');
    expect(body.submission.period).toBe(PERIOD);
    expect(body.submission.orgUnit).toBe('NATIONAL');
    const row = body.submission.claims.find((c: { claimNumber: string }) => c.claimNumber === claimNumber);
    expect(row).toBeTruthy();
    expect(row.patientName).toBe('Integration Patient (synthetic)');
    expect(row.amount).toBe(80);
    expect(row.items).toHaveLength(2);
  });

  it('uses the facility code as the org unit for a facility-scoped caller', async () => {
    const facilityUser = await makeUser({ email: 'integration-facility-nhis@demo.gh', roleCode: 'HOSPITAL_ADMIN', facilityId, permissions: PERMS });
    const res = await app.inject({ method: 'POST', url: '/api/v1/integrations/nhis/queue', headers: auth(facilityUser.token), payload: { period: PERIOD, dryRun: true } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    const facility = await db.facility.findUnique({ where: { id: facilityId } });
    expect(body.submission.orgUnit).toBe(facility?.code);
    expect(body.submission.claims).toHaveLength(1);
    expect(body.submission.claims[0].claimNumber).toBe(claimNumber);
  });

  it('queues the submission idempotently (adapter nhis)', async () => {
    const first = await app.inject({ method: 'POST', url: '/api/v1/integrations/nhis/queue', headers: auth(admin.token), payload: { period: PERIOD } });
    expect(first.statusCode).toBe(200);
    const firstBody = first.json();
    expect(firstBody.delivery.status).toBe('PENDING');
    const row = await db.integrationDelivery.findUnique({ where: { id: firstBody.delivery.id } });
    expect(row?.adapter).toBe('nhis');
    expect(row?.idempotencyKey).toContain('nhis:');
    const dup = await app.inject({ method: 'POST', url: '/api/v1/integrations/nhis/queue', headers: auth(admin.token), payload: { period: PERIOD } });
    expect(dup.json().delivery.duplicated).toBe(true);
    expect(dup.json().delivery.id).toBe(firstBody.delivery.id);
  });

  it('rejects an invalid period', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/integrations/nhis/queue', headers: auth(admin.token), payload: { period: '2026-13', dryRun: true } });
    expect(res.statusCode).toBe(400);
  });

  it('exports the submission as NHIS claims CSV', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/integrations/nhis/export?period=${PERIOD}&format=csv`, headers: auth(admin.token) });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.body).toContain('"orgUnit","period","claimNumber"');
    expect(res.body).toContain(claimNumber);
  });
});

describe('eTracker adapter', () => {
  it('builds a client cohort from live maternal records (dry run)', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/integrations/etracker/queue', headers: auth(admin.token), payload: { period: PERIOD, dryRun: true } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.dryRun).toBe(true);
    expect(body.configured).toBe(false);
    expect(body.submission.dataSet).toBe('ETRACKER-CLIENTS');
    expect(body.submission.period).toBe(PERIOD);
    expect(body.submission.orgUnit).toBe('NATIONAL');
    const row = body.submission.clients.find((c: { clientId: string }) => c.clientId === patientId);
    expect(row).toBeTruthy();
    expect(row.fullName).toBe('Integration Patient (synthetic)');
    // ANC visit + delivery this period → MULTIPLE program with summaries.
    expect(row.program).toBe('MULTIPLE');
    expect(row.ancVisitsInPeriod).toBe(1);
    expect(row.latestRiskAssessment).toBe('HIGH');
    expect(row.deliveriesInPeriod).toBe(1);
    expect(row.latestDeliveryOutcome).toBe('LIVE_BIRTH');
    // Identity resolution keys are carried for national matching.
    expect(row.mrn).toBeTruthy();
    expect(row.phone).toBe('0555000888');
  });

  it('uses the facility code as the org unit for a facility-scoped caller', async () => {
    const facilityUser = await makeUser({ email: 'integration-facility-etracker@demo.gh', roleCode: 'HOSPITAL_ADMIN', facilityId, permissions: PERMS });
    const res = await app.inject({ method: 'POST', url: '/api/v1/integrations/etracker/queue', headers: auth(facilityUser.token), payload: { period: PERIOD, dryRun: true } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    const facility = await db.facility.findUnique({ where: { id: facilityId } });
    expect(body.submission.orgUnit).toBe(facility?.code);
    expect(body.submission.clients).toHaveLength(1);
    expect(body.submission.clients[0].clientId).toBe(patientId);
  });

  it('queues the cohort submission idempotently (adapter etracker)', async () => {
    const first = await app.inject({ method: 'POST', url: '/api/v1/integrations/etracker/queue', headers: auth(admin.token), payload: { period: PERIOD } });
    expect(first.statusCode).toBe(200);
    const row = await db.integrationDelivery.findUnique({ where: { id: first.json().delivery.id } });
    expect(row?.adapter).toBe('etracker');
    expect(row?.idempotencyKey).toContain('etracker:');
    const dup = await app.inject({ method: 'POST', url: '/api/v1/integrations/etracker/queue', headers: auth(admin.token), payload: { period: PERIOD } });
    expect(dup.json().delivery.duplicated).toBe(true);
  });

  it('rejects an invalid period and exports the cohort as CSV', async () => {
    const bad = await app.inject({ method: 'POST', url: '/api/v1/integrations/etracker/queue', headers: auth(admin.token), payload: { period: '2026-13', dryRun: true } });
    expect(bad.statusCode).toBe(400);
    const res = await app.inject({ method: 'GET', url: `/api/v1/integrations/etracker/export?period=${PERIOD}&format=csv`, headers: auth(admin.token) });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.body).toContain('"orgUnit","period","clientId","mrn"');
    expect(res.body).toContain(patientId);
    expect(res.body).toContain('"HIGH"');
  });
});

describe('LHIMS adapter', () => {
  it('builds a FHIR R4 bundle from live patients, encounters and lab results (dry run)', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/integrations/lhims/queue', headers: auth(admin.token), payload: { period: PERIOD, dryRun: true } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.dryRun).toBe(true);
    expect(body.configured).toBe(false);
    expect(body.submission.dataSet).toBe('LHIMS-FHIR');
    expect(body.submission.period).toBe(PERIOD);
    expect(body.submission.orgUnit).toBe('NATIONAL');
    const bundle = body.submission.bundle;
    expect(bundle.resourceType).toBe('Bundle');
    expect(bundle.type).toBe('transaction');

    const patient = bundle.entry.find((en: { resource: { resourceType: string } }) => en.resource.resourceType === 'Patient');
    expect(patient).toBeTruthy();
    expect(patient.resource.name[0].text).toBe('Integration Patient (synthetic)');
    expect(patient.resource.gender).toBe('male');
    // MPI identity resolution: MRN identifier is always present.
    expect(patient.resource.identifier.some((i: { system: string }) => i.system === 'urn:gihm:mrn')).toBe(true);

    const encounter = bundle.entry.find((en: { resource: { resourceType: string } }) => en.resource.resourceType === 'Encounter');
    expect(encounter).toBeTruthy();
    expect(encounter.resource.status).toBe('planned'); // OPEN → planned
    expect(encounter.resource.class.code).toBe('AMB'); // OPD → AMB
    expect(encounter.resource.subject.reference).toBe(`Patient/${patientId}`);

    const report = bundle.entry.find((en: { resource: { resourceType: string } }) => en.resource.resourceType === 'DiagnosticReport');
    expect(report).toBeTruthy();
    expect(report.resource.status).toBe('final'); // VERIFIED → final
    expect(report.resource.code.text).toBe('Malaria RDT');
    expect(report.resource.conclusion).toBe('Positive');
  });

  it('uses the facility code as the org unit for a facility-scoped caller', async () => {
    const facilityUser = await makeUser({ email: 'integration-facility-lhims@demo.gh', roleCode: 'HOSPITAL_ADMIN', facilityId, permissions: PERMS });
    const res = await app.inject({ method: 'POST', url: '/api/v1/integrations/lhims/queue', headers: auth(facilityUser.token), payload: { period: PERIOD, dryRun: true } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    const facility = await db.facility.findUnique({ where: { id: facilityId } });
    expect(body.submission.orgUnit).toBe(facility?.code);
    expect(body.submission.bundle.entry.length).toBeGreaterThanOrEqual(3); // Patient + Encounter + DiagnosticReport
  });

  it('queues the bundle idempotently (adapter lhims) and exports CSV', async () => {
    const first = await app.inject({ method: 'POST', url: '/api/v1/integrations/lhims/queue', headers: auth(admin.token), payload: { period: PERIOD } });
    expect(first.statusCode).toBe(200);
    const row = await db.integrationDelivery.findUnique({ where: { id: first.json().delivery.id } });
    expect(row?.adapter).toBe('lhims');
    expect(row?.idempotencyKey).toContain('lhims:');
    const dup = await app.inject({ method: 'POST', url: '/api/v1/integrations/lhims/queue', headers: auth(admin.token), payload: { period: PERIOD } });
    expect(dup.json().delivery.duplicated).toBe(true);

    const bad = await app.inject({ method: 'POST', url: '/api/v1/integrations/lhims/queue', headers: auth(admin.token), payload: { period: '2026-13', dryRun: true } });
    expect(bad.statusCode).toBe(400);

    const res = await app.inject({ method: 'GET', url: `/api/v1/integrations/lhims/export?period=${PERIOD}&format=csv`, headers: auth(admin.token) });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.body).toContain('"orgUnit","period","resourceType"');
    expect(res.body).toContain('DiagnosticReport');
  });
});

describe('SORMAS adapter', () => {
  it('exports disease cases in SORMAS import shape', async () => {
    const reported = await app.inject({
      method: 'POST', url: '/api/v1/surveillance/cases', headers: auth(admin.token),
      payload: { facilityId, disease: 'Cholera', caseType: 'CONFIRMED', severity: 'SEVERE', patientId, notes: 'Integration test case' },
    });
    expect(reported.statusCode).toBe(200);
    const caseId = (reported.json().case as { id: string }).id;

    const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const to = new Date().toISOString().slice(0, 10);
    const res = await app.inject({ method: 'GET', url: `/api/v1/integrations/sormas/export?from=${from}&to=${to}`, headers: auth(admin.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    const found = body.cases.find((c: { externalId: string }) => c.externalId === caseId);
    expect(found).toBeTruthy();
    expect(found.disease).toBe('CHOLERA');
    expect(found.caseClassification).toBe('CONFIRMED');
    expect(found.facilityName).toBe('Integration Test Facility (synthetic)');
    expect(found.person.firstName).toBeTruthy();
  });

  it('exports cases as CSV', async () => {
    const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const to = new Date().toISOString().slice(0, 10);
    const res = await app.inject({ method: 'GET', url: `/api/v1/integrations/sormas/export?from=${from}&to=${to}&format=csv`, headers: auth(admin.token) });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.body).toContain('"externalId","disease","caseClassification"');
  });
});

describe('integration delivery engine', () => {
  it('queues idempotently — the same logical submission never duplicates', async () => {
    const submission = { dataSet: 'GIHM-HIS', period: '209901', orgUnit: 'GH-TEST', completeDate: '2099-01-31', dataValues: [{ dataElement: '1A', value: 1, categoryOptionCombo: 'default' }] };
    const first = await enqueue(db, 'dhims2', `dhims2:209901:GH-TEST`, submission);
    const second = await enqueue(db, 'dhims2', `dhims2:209901:GH-TEST`, submission);
    expect(second.id).toBe(first.id);
    expect(second.duplicated).toBe(true);
    const rows = await db.integrationDelivery.findMany({ where: { idempotencyKey: 'dhims2:209901:GH-TEST' } });
    expect(rows).toHaveLength(1);
  });

  it('delivers through the transport and records the remote acknowledgement', async () => {
    const okTransport: Transport = async () => ({ ok: true, remoteId: 'ack-123' });
    await enqueue(db, 'dhims2', 'dhims2:209902:GH-TEST', { period: '209902' });
    const result = await deliverPending(db, testConfig(), { dhims2: okTransport }, silent);
    // The sweep delivers every due row for the adapter (the idempotency-test
    // row is still pending too) — assert the specific submission, not the total.
    expect(result.delivered).toBeGreaterThanOrEqual(1);
    const row = await db.integrationDelivery.findUnique({ where: { idempotencyKey: 'dhims2:209902:GH-TEST' } });
    expect(row?.status).toBe('DELIVERED');
    expect(row?.remoteId).toBe('ack-123');
    expect(row?.deliveredAt).toBeTruthy();
  });

  it('retries rejected submissions with backoff and delivers on the next sweep', async () => {
    let fail = true;
    const flakyTransport: Transport = async () => {
      if (fail) { fail = false; return { ok: false, error: 'HTTP 503 — upstream busy' }; }
      return { ok: true };
    };
    await enqueue(db, 'dhims2', 'dhims2:209903:GH-TEST', { period: '209903' });
    const first = await deliverPending(db, testConfig(), { dhims2: flakyTransport }, silent);
    expect(first.delivered).toBe(0);
    const row = await db.integrationDelivery.findUnique({ where: { idempotencyKey: 'dhims2:209903:GH-TEST' } });
    expect(row?.status).toBe('PENDING');
    expect(row?.attempts).toBe(1);
    expect(row?.nextAttemptAt.getTime()).toBeGreaterThan(Date.now()); // backoff applied
    expect(row?.lastError).toContain('503');

    // Force the retry window open and re-sweep.
    await db.integrationDelivery.update({ where: { id: row!.id }, data: { nextAttemptAt: new Date(Date.now() - 1000) } });
    const second = await deliverPending(db, testConfig(), { dhims2: flakyTransport }, silent);
    expect(second.delivered).toBe(1);
  });

  it('marks submissions FAILED after max attempts but never deletes them', async () => {
    const alwaysFail: Transport = async () => ({ ok: false, error: 'HTTP 500' });
    await enqueue(db, 'sormas', 'sormas:fail-case', { cases: [] });
    const cfg = testConfig(2, 10);
    await deliverPending(db, cfg, { sormas: alwaysFail }, silent);
    await db.integrationDelivery.update({ where: { idempotencyKey: 'sormas:fail-case' }, data: { nextAttemptAt: new Date(Date.now() - 1000) } });
    const result = await deliverPending(db, cfg, { sormas: alwaysFail }, silent);
    const row = await db.integrationDelivery.findUnique({ where: { idempotencyKey: 'sormas:fail-case' } });
    expect(row?.status).toBe('FAILED');
    expect(row?.attempts).toBe(2);
    expect(row?.lastError).toContain('500');
    expect(result.failed).toBe(1);
    // Still present for reconciliation — never silently discarded (spec §166).
    expect(await db.integrationDelivery.count({ where: { idempotencyKey: 'sormas:fail-case' } })).toBe(1);
  });

  it('keeps adapter queues independent — one upstream down never blocks the other', async () => {
    await enqueue(db, 'dhims2', 'dhims2:209904:GH-TEST', { period: '209904' });
    await enqueue(db, 'sormas', 'sormas:iso-case', { cases: [] });
    const onlyDhims: Transport = async () => ({ ok: true, remoteId: 'ack' });
    const result = await deliverPending(db, testConfig(), { dhims2: onlyDhims }, silent);
    expect(result.delivered).toBeGreaterThanOrEqual(1);
    const dhims = await db.integrationDelivery.findUnique({ where: { idempotencyKey: 'dhims2:209904:GH-TEST' } });
    expect(dhims?.status).toBe('DELIVERED');
    const sormas = await db.integrationDelivery.findUnique({ where: { idempotencyKey: 'sormas:iso-case' } });
    expect(sormas?.status).toBe('PENDING');
  });

  it('re-arms a previously FAILED submission when re-queued', async () => {
    await db.integrationDelivery.create({ data: { adapter: 'sormas', idempotencyKey: 'sormas:rear-arm', status: 'FAILED', payload: '{}', nextAttemptAt: new Date() } });
    const res = await enqueue(db, 'sormas', 'sormas:rear-arm', { cases: [{ externalId: 'x' }] });
    expect(res.status).toBe('PENDING');
    const row = await db.integrationDelivery.findUnique({ where: { idempotencyKey: 'sormas:rear-arm' } });
    expect(row?.status).toBe('PENDING');
    expect(row?.attempts).toBe(0);
    expect(row?.payload).toContain('externalId');
  });
});

describe('real transports against fake upstreams', () => {
  let upstream: ReturnType<typeof createServer>;
  let baseUrl = '';
  const received: Array<{ url: string; body: unknown; auth: string | null }> = [];

  beforeAll(async () => {
    upstream = createServer((req, res) => {
      let body = '';
      req.on('data', (c) => (body += String(c)));
      req.on('end', () => {
        received.push({ url: req.url ?? '', body: body ? JSON.parse(body) : null, auth: (req.headers.authorization ?? null) });
        if ((req.url ?? '').includes('dataValueSets')) {
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ response: { importSummaries: [{ uid: 'dhis-ack-1' }] } }));
          return;
        }
        if ((req.url ?? '').includes('cases')) {
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end('{}');
          return;
        }
        if ((req.url ?? '').includes('stock-levels')) {
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ submissionId: 'ghilmis-ack-1' }));
          return;
        }
        if ((req.url ?? '').includes('staff')) {
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ submissionId: 'hrims-ack-1' }));
          return;
        }
        if ((req.url ?? '').includes('claims')) {
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ submissionId: 'nhis-ack-1' }));
          return;
        }
        if ((req.url ?? '').includes('clients')) {
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ importId: 'etracker-ack-1' }));
          return;
        }
        if ((req.url ?? '').includes('fhir')) {
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ bundleId: 'lhims-ack-1' }));
          return;
        }
        res.writeHead(404);
        res.end();
      });
    });
    await new Promise<void>((resolve) => upstream.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${(upstream.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => upstream.close(() => resolve()));
  });

  it('DHIMS2 transport posts a dataValueSet with basic auth and reads the ack id', async () => {
    const result = await dhims2Transport({ url: baseUrl, username: 'dhis', password: 'secret' }, { dataSet: 'GIHM-HIS', period: '209901', dataValues: [] });
    expect(result.ok).toBe(true);
    expect(result.remoteId).toBe('dhis-ack-1');
    expect(received.at(-1)?.url).toContain('/api/dataValueSets');
    expect(received.at(-1)?.auth).toBe(`Basic ${Buffer.from('dhis:secret').toString('base64')}`);
  });

  it('SORMAS transport posts cases with basic auth', async () => {
    const result = await sormasTransport({ url: baseUrl, username: 'sormas', password: 'secret' }, [{ externalId: 'c-1', disease: 'CHOLERA' }]);
    expect(result.ok).toBe(true);
    expect(received.at(-1)?.url).toContain('/api/cases');
    expect(received.at(-1)?.auth).toBe(`Basic ${Buffer.from('sormas:secret').toString('base64')}`);
  });

  it('GhiLMIS transport posts the stock snapshot with basic auth and reads the ack id', async () => {
    const result = await ghilmisTransport({ url: baseUrl, username: 'ghilmis', password: 'secret' }, { dataSet: 'GIHM-STOCK', period: '2026-08', items: [{ commodity: 'Paracetamol 500mg', quantity: 12 }] });
    expect(result.ok).toBe(true);
    expect(result.remoteId).toBe('ghilmis-ack-1');
    expect(received.at(-1)?.url).toContain('/api/stock-levels');
    expect(received.at(-1)?.auth).toBe(`Basic ${Buffer.from('ghilmis:secret').toString('base64')}`);
  });

  it('NHIS transport posts the claims batch with basic auth and reads the ack id', async () => {
    const result = await nhisTransport({ url: baseUrl, username: 'nhis', password: 'secret' }, { dataSet: 'NHIS-CLAIMS', period: '2026-08', claims: [{ claimNumber: 'CLM-1', amount: 80 }] });
    expect(result.ok).toBe(true);
    expect(result.remoteId).toBe('nhis-ack-1');
    expect(received.at(-1)?.url).toContain('/api/claims');
    expect(received.at(-1)?.auth).toBe(`Basic ${Buffer.from('nhis:secret').toString('base64')}`);
  });

  it('LHIMS transport posts the FHIR bundle with basic auth and reads the ack id', async () => {
    const result = await lhimsTransport({ url: baseUrl, username: 'lhims', password: 'secret' }, { dataSet: 'LHIMS-FHIR', period: '2026-08', bundle: { resourceType: 'Bundle', type: 'transaction', entry: [] } });
    expect(result.ok).toBe(true);
    expect(result.remoteId).toBe('lhims-ack-1');
    expect(received.at(-1)?.url).toContain('/api/fhir');
    expect(received.at(-1)?.auth).toBe(`Basic ${Buffer.from('lhims:secret').toString('base64')}`);
  });

  it('eTracker transport posts the client cohort with basic auth and reads the ack id', async () => {
    const result = await etrackerTransport({ url: baseUrl, username: 'etracker', password: 'secret' }, { dataSet: 'ETRACKER-CLIENTS', period: '2026-08', clients: [{ clientId: 'c-1', mrn: 'GH-0001' }] });
    expect(result.ok).toBe(true);
    expect(result.remoteId).toBe('etracker-ack-1');
    expect(received.at(-1)?.url).toContain('/api/clients');
    expect(received.at(-1)?.auth).toBe(`Basic ${Buffer.from('etracker:secret').toString('base64')}`);
  });

  it('HRIMS transport posts the workforce register with basic auth and reads the ack id', async () => {
    const result = await hrimsTransport({ url: baseUrl, username: 'hrims', password: 'secret' }, { dataSet: 'GIHM-STAFF', period: '2026-08', staff: [{ staffNumber: 'TST-0001' }] });
    expect(result.ok).toBe(true);
    expect(result.remoteId).toBe('hrims-ack-1');
    expect(received.at(-1)?.url).toContain('/api/staff');
    expect(received.at(-1)?.auth).toBe(`Basic ${Buffer.from('hrims:secret').toString('base64')}`);
  });

  it('transports surface upstream rejections as failed deliveries', async () => {
    const result = await dhims2Transport({ url: 'http://127.0.0.1:59999', username: 'u', password: 'p' }, {});
    expect(result.ok).toBe(false);
    expect(result.error).toContain('unreachable');
  });
});

describe('status + permissions', () => {
  it('reports truthful per-adapter status', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/integrations/status', headers: auth(admin.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.adapters.map((a: { adapter: string }) => a.adapter)).toEqual(['dhims2', 'sormas', 'ghilmis', 'hrims', 'nhis', 'etracker', 'lhims']);
    const dhims = body.adapters.find((a: { adapter: string }) => a.adapter === 'dhims2');
    expect(typeof dhims.pending).toBe('number');
    expect(dhims.delivered).toBeGreaterThan(0); // engine tests delivered rows
    expect(dhims.configured).toBe(false); // no INTEGRATION_DHIMS2_URL in tests
  });

  it('requires manage_integrations to queue', async () => {
    const doctor = await makeUser({ email: 'integration-doctor@demo.gh', roleCode: 'DOCTOR' });
    const res = await app.inject({
      method: 'POST', url: '/api/v1/integrations/dhims2/queue', headers: auth(doctor.token),
      payload: { period: PERIOD, dryRun: true },
    });
    expect(res.statusCode).toBe(403);
  });

  it('runs the delivery sweep (a no-op with unconfigured upstreams) and audits it', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/integrations/sweep', headers: auth(admin.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    // No INTEGRATION_*_URL in the test env — every adapter is skipped, so the
    // sweep completes with nothing attempted and nothing lost.
    expect(body).toMatchObject({ delivered: 0, failed: 0, attempted: 0 });
    expect(typeof body.now).toBe('string');
    const audit = await db.auditLog.findFirst({ where: { action: 'integration.sweep' }, orderBy: { createdAt: 'desc' } });
    expect(audit).toBeTruthy();
  });

  it('leaves pending submissions untouched while their upstream is unconfigured', async () => {
    const row = await db.integrationDelivery.create({
      data: { adapter: 'nhis', idempotencyKey: `sweep-test-${Math.random().toString(36).slice(2, 8)}`, payload: '{"x":1}', status: 'PENDING', nextAttemptAt: new Date() },
    });
    const res = await app.inject({ method: 'POST', url: '/api/v1/integrations/sweep', headers: auth(admin.token) });
    expect(res.statusCode).toBe(200);
    expect(res.json().attempted).toBe(0);
    const after = await db.integrationDelivery.findUnique({ where: { id: row.id } });
    expect(after?.status).toBe('PENDING'); // never silently dropped while waiting
  });

  it('requires manage_integrations to sweep', async () => {
    const doctor = await makeUser({ email: 'integration-sweep-doctor@demo.gh', roleCode: 'DOCTOR' });
    const res = await app.inject({ method: 'POST', url: '/api/v1/integrations/sweep', headers: auth(doctor.token) });
    expect(res.statusCode).toBe(403);
  });

  it('lists the delivery log without payloads (detail endpoint has them)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/integrations/deliveries', headers: auth(admin.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.rows)).toBe(true);
    expect(body.rows.length).toBeGreaterThan(0);
    expect(body.rows[0]).not.toHaveProperty('payload');
    const detail = await app.inject({ method: 'GET', url: `/api/v1/integrations/deliveries/${body.rows[0].id}`, headers: auth(admin.token) });
    expect(detail.statusCode).toBe(200);
    expect(detail.json().payloadJson).toBeTruthy();
  });
});
