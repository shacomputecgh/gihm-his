import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser, makeFacility } from './helpers.js';
import type { FastifyInstance } from 'fastify';

// ---------------------------------------------------------------------------
// AI services (docs/22 Phase 7 — spec §82–83): deterministic documentation
// assist, MPI-based duplicate review and linear-trend forecasting — every
// output carrying the mandatory "AI-generated — requires professional
// verification" disclosure. Tests assert the disclosure, the provenance
// (basedOn), scope isolation and the honest insufficiency handling.
// ---------------------------------------------------------------------------

const auth = (t: string) => ({ authorization: `Bearer ${t}` });
const CLINICAL_PERMS = ['view_patient', 'view_clinical_record', 'write_clinical_note', 'create_patient', 'view_reports', 'order_lab', 'prescribe'];

let app: FastifyInstance;
let clinician: { token: string };
let patientId: string;
let encounterId: string;
let facilityId: string;
let emptyFacilityId: string;
let stockItemId: string;

beforeAll(async () => {
  app = await createTestApp();
  clinician = await makeUser({ email: 'ai-clinician@demo.gh', roleCode: 'DOCTOR', scope: 'NATIONAL', facilityId: null, permissions: CLINICAL_PERMS });
  const facility = await makeFacility('AI Test Facility (synthetic)');
  facilityId = facility.id;
  // A second facility with NO beds — BED_OCCUPANCY_RATE stays null there, so
  // the forecast honestly refuses instead of projecting (see insufficient-history test).
  emptyFacilityId = (await makeFacility('AI Empty Facility (no beds)')).id;

  // A patient with a near-duplicate twin (same name/DOB) to exercise review.
  const base = { dateOfBirth: '1992-04-15', phone: '0244000001', force: true };
  const p1 = await app.inject({ method: 'POST', url: '/api/v1/patients', headers: auth(clinician.token), payload: { fullName: 'Ama Serwaa Mensah', ...base } });
  const p2 = await app.inject({ method: 'POST', url: '/api/v1/patients', headers: auth(clinician.token), payload: { fullName: 'Ama Serwaa Mensah', ...base } });
  patientId = (p1.json().patient as { id: string }).id;
  void p2; // the second record exists so review finds it

  const enc = await app.inject({
    method: 'POST', url: `/api/v1/patients/${patientId}/encounters`, headers: auth(clinician.token),
    payload: { type: 'OPD', presentingComplaint: 'Fever and headache for 2 days', temperature: 38.9, pulse: 96, triageCategory: 'URGENT' },
  });
  encounterId = (enc.json().encounter as { id: string }).id;
  await app.inject({
    method: 'POST', url: `/api/v1/patients/${patientId}/lab-orders`, headers: auth(clinician.token),
    payload: { encounterId, test: 'Malaria RDT', discipline: 'MICROBIOLOGY' },
  });
  await app.inject({
    method: 'POST', url: `/api/v1/patients/${patientId}/prescriptions`, headers: auth(clinician.token),
    payload: { encounterId, medicine: 'Artemether-Lumefantrine', dosage: '1 tablet', frequency: 'BD' },
  });
  // A stock item with steady ISSUE consumption (30/week for 8 weeks) and low
  // current stock — the consumption-forecast series for predictive analytics.
  const stock = await db.stockItem.create({
    data: { facilityId: facility.id, name: 'Artemether 80/480mg (predictive)', category: 'MEDICINE', unit: 'tablet', quantity: 40, minStock: 50, reorderLevel: 80, status: 'ACTIVE' },
  });
  stockItemId = stock.id;
  for (let w = 8; w >= 1; w--) {
    await db.stockMovement.create({
      data: {
        stockItemId: stock.id,
        facilityId: facility.id,
        type: 'ISSUE',
        quantity: 30,
        balanceAfter: 40 + 30 * (w - 1),
        note: 'Predictive test consumption',
        createdAt: new Date(Date.now() - w * 7 * 86_400_000),
      },
    });
  }
  // Zero-quantity item → the OUT outcome is factual, no history needed.
  await db.stockItem.create({
    data: { facilityId: facility.id, name: 'ORS Sachets (predictive out)', category: 'MEDICINE', unit: 'sachet', quantity: 0, status: 'ACTIVE' },
  });
  // A stock item with NO consumption history → honest insufficient-data refusal.
  await db.stockItem.create({
    data: { facilityId: emptyFacilityId, name: 'Amoxicillin (predictive no data)', category: 'MEDICINE', unit: 'capsule', quantity: 100, status: 'ACTIVE' },
  });
});

afterAll(async () => {
  await db.integrationDelivery.deleteMany();
  await db.labOrder.deleteMany({ where: { patientId } });
  await db.prescription.deleteMany({ where: { patientId } });
  await db.clinicalNote.deleteMany();
  await db.diagnosis.deleteMany();
  await db.encounter.deleteMany({ where: { patientId } });
  await db.patient.deleteMany({ where: { fullName: 'Ama Serwaa Mensah' } });
  await db.stockMovement.deleteMany({ where: { note: 'Predictive test consumption' } });
  await db.stockItem.deleteMany({ where: { name: { startsWith: 'Artemether 80/480mg (predictive)' } } });
  await db.stockItem.deleteMany({ where: { name: { startsWith: 'ORS Sachets (predictive' } } });
  await db.stockItem.deleteMany({ where: { name: { startsWith: 'Amoxicillin (predictive' } } });
  await db.$disconnect();
  await app.close();
});

describe('documentation assist', () => {
  it('drafts a SOAP note from the encounter with the mandatory AI disclosure', async () => {
    const res = await app.inject({ method: 'POST', url: `/api/v1/ai/encounters/${encounterId}/draft-note`, headers: auth(clinician.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.disclaimer).toContain('AI-generated — requires professional verification');
    expect(body.method).toContain('deterministic');
    expect(body.basedOn).toEqual(expect.arrayContaining(['presentingComplaint', 'triageCategory', 'vitals', 'labOrders', 'prescriptions']));
    // The draft draws on the record — never fabricated.
    expect(body.draft).toContain('Fever and headache for 2 days');
    expect(body.draft).toContain('Malaria RDT');
    expect(body.draft).toContain('Artemether-Lumefantrine');
    expect(body.draft).toContain('S — Subjective');
    expect(body.draft).toContain('P — Plan');
  });

  it('rejects an unknown encounter', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/ai/encounters/no-such-id/draft-note', headers: auth(clinician.token) });
    expect(res.statusCode).toBe(404);
  });
});

describe('duplicate review', () => {
  it('ranks MPI candidates for the patient with the AI disclosure — never merges', async () => {
    const res = await app.inject({ method: 'POST', url: `/api/v1/ai/patients/${patientId}/duplicates`, headers: auth(clinician.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.disclaimer).toContain('AI-generated — requires professional verification');
    expect(body.patient.mrn).toBeTruthy();
    // The intentional near-duplicate twin scores >= 85 (name + phone + DOB).
    const top = body.candidates[0];
    expect(top).toBeTruthy();
    expect(top.fullName).toBe('Ama Serwaa Mensah');
    expect(top.score).toBeGreaterThanOrEqual(85);
    expect(top.matchedOn).toEqual(expect.arrayContaining(['name', 'date_of_birth', 'phone']));
    // No merge action exists on this endpoint — review only.
    expect(body).not.toHaveProperty('merged');
  });

  it('rejects an unknown patient', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/ai/patients/no-such-id/duplicates', headers: auth(clinician.token) });
    expect(res.statusCode).toBe(404);
  });
});

describe('forecasting', () => {
  it('projects a collected indicator with disclosure + confidence band', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/ai/forecast/OPD_ATTENDANCE?months=3', headers: auth(clinician.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.indicator).toBe('OPD_ATTENDANCE');
    expect(body.name).toBe('OPD attendance');
    expect(body.disclaimer).toContain('AI-generated — requires professional verification');
    expect(body.months).toHaveLength(3);
    for (const m of body.months) {
      expect(m.period).toMatch(/^\d{4}-\d{2}$/);
      expect(typeof m.value).toBe('number');
      expect(m.lower).toBeGreaterThanOrEqual(0);
    }
  });

  it('refuses an unknown / not-collected indicator', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/ai/forecast/ANC_REGISTRATIONS?months=3', headers: auth(clinician.token) });
    expect(res.statusCode).toBe(400);
  });

  it('rejects an out-of-range horizon', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/ai/forecast/OPD_ATTENDANCE?months=99', headers: auth(clinician.token) });
    expect(res.statusCode).toBe(400);
  });

  it('is honest about insufficient history rather than fabricating a projection', async () => {
    // A facility with no beds → BED_OCCUPANCY_RATE is null every week (never a
    // fabricated 0), so the projection is refused rather than invented.
    const emptyUser = await makeUser({ email: 'ai-empty-facility@demo.gh', roleCode: 'HOSPITAL_ADMIN', facilityId: emptyFacilityId, permissions: ['view_reports'] });
    const res = await app.inject({ method: 'GET', url: '/api/v1/ai/forecast/BED_OCCUPANCY_RATE?months=3', headers: auth(emptyUser.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.available).toBe(false);
    expect(body.note).toContain('Insufficient history');
    expect(body.months).toHaveLength(0);
  });
});

describe('predictive analytics — stock consumption forecast', () => {
  it('projects next-month demand from live ISSUE consumption with disclosure + band', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/ai/forecast/stock/${stockItemId}`, headers: auth(clinician.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.disclaimer).toContain('AI-generated — requires professional verification');
    expect(body.method).toContain('deterministic');
    expect(body.available).toBe(true);
    expect(body.stockItem.name).toBe('Artemether 80/480mg (predictive)');
    expect(body.stockItem.quantity).toBe(40);
    // 8 weeks × 30/week → projected monthly demand ≈ 30 × 4.345 ≈ 130.
    expect(body.projectedMonthlyDemand).toBeGreaterThan(100);
    expect(body.projectedMonthlyDemand).toBeLessThan(170);
    expect(body.lower).toBeGreaterThanOrEqual(0);
    expect(body.upper).toBeGreaterThanOrEqual(body.projectedMonthlyDemand);
    // 40 units ÷ ~30/week ≈ 1.3 weeks → LOW with a run-out date.
    expect(body.weeksOfStockRemaining).toBeLessThan(2);
    expect(body.weeksOfStockRemaining).toBeGreaterThan(0.5);
    expect(body.runOutAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(body.status).toBe('LOW');
    expect(body.history).toHaveLength(12);
    expect(body.history.some((h: { issued: number }) => h.issued === 30)).toBe(true);
    expect(body.note).toContain('reorder');
  });

  it('reports a zero-quantity item as OUT (factual, no history required)', async () => {
    const items = await db.stockItem.findMany({ where: { name: 'ORS Sachets (predictive out)' } });
    const res = await app.inject({ method: 'GET', url: `/api/v1/ai/forecast/stock/${items[0]!.id}`, headers: auth(clinician.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('OUT');
    expect(body.weeksOfStockRemaining).toBe(0);
    expect(body.note).toContain('restock');
  });

  it('is honest about insufficient consumption history rather than fabricating', async () => {
    const items = await db.stockItem.findMany({ where: { name: 'Amoxicillin (predictive no data)' } });
    const emptyUser = await makeUser({ email: 'ai-empty-stock@demo.gh', roleCode: 'HOSPITAL_ADMIN', facilityId: emptyFacilityId, permissions: ['view_reports'] });
    const res = await app.inject({ method: 'GET', url: `/api/v1/ai/forecast/stock/${items[0]!.id}`, headers: auth(emptyUser.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.available).toBe(false);
    expect(body.status).toBe('INSUFFICIENT_DATA');
    expect(body.note).toContain('Insufficient consumption history');
    expect(body.projectedMonthlyDemand).toBeNull();
    expect(body.weeksOfStockRemaining).toBeNull();
  });

  it('scopes the stock item to the caller and 404s outside it', async () => {
    const other = await makeUser({ email: 'ai-other-facility-stock@demo.gh', roleCode: 'HOSPITAL_ADMIN', facilityId: emptyFacilityId, permissions: ['view_reports'] });
    const res = await app.inject({ method: 'GET', url: `/api/v1/ai/forecast/stock/${stockItemId}`, headers: auth(other.token) });
    expect(res.statusCode).toBe(404);
  });
});

describe('permissions', () => {
  it('requires view_reports for forecasting', async () => {
    const cashier = await makeUser({ email: 'ai-cashier@demo.gh', roleCode: 'CASHIER' });
    const res = await app.inject({ method: 'GET', url: '/api/v1/ai/forecast/OPD_ATTENDANCE', headers: auth(cashier.token) });
    expect(res.statusCode).toBe(403);
  });

  it('requires clinical record access for the draft note', async () => {
    const cashier = await makeUser({ email: 'ai-cashier-2@demo.gh', roleCode: 'CASHIER' });
    const res = await app.inject({ method: 'POST', url: `/api/v1/ai/encounters/${encounterId}/draft-note`, headers: auth(cashier.token) });
    expect(res.statusCode).toBe(403);
  });

  it('requires view_reports or manage_inventory for the stock forecast', async () => {
    const cashier = await makeUser({ email: 'ai-cashier-3@demo.gh', roleCode: 'CASHIER' });
    const res = await app.inject({ method: 'GET', url: `/api/v1/ai/forecast/stock/${stockItemId}`, headers: auth(cashier.token) });
    expect(res.statusCode).toBe(403);
  });
});
