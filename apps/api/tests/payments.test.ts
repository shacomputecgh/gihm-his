import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser, makeFacility } from './helpers.js';
import type { FastifyInstance } from 'fastify';

// ---------------------------------------------------------------------------
// Payments (spec §37 — provider abstraction, never hard-code one provider):
// invoices are paid through an idempotent provider attempt and only a
// confirmed SUCCESS moves the invoice. The SIMULATED provider exercises the
// whole flow with clearly-labeled test money.
// ---------------------------------------------------------------------------

const PERMS = ['process_payment', 'view_financial', 'view_patient', 'create_patient', 'manage_integrations'];
const auth = (t: string) => ({ authorization: `Bearer ${t}` });

let app: FastifyInstance;
let cashier: { token: string };
let patientId: string;
let invoiceId: string;
let secondInvoiceId: string;
let invoiceAmount: number;

beforeAll(async () => {
  app = await createTestApp();
  const facility = await makeFacility('Payments Test Facility (synthetic)');
  cashier = await makeUser({ email: 'payments-cashier@demo.gh', roleCode: 'CASHIER', facilityId: facility.id, permissions: PERMS });

  const patient = await app.inject({ method: 'POST', url: '/api/v1/patients', headers: auth(cashier.token), payload: { fullName: 'Payments Patient (synthetic)', force: true } });
  patientId = (patient.json().patient as { id: string }).id;
  await db.patient.update({ where: { id: patientId }, data: { facilityId: facility.id } });

  const invoice = await db.invoice.create({
    data: { patientId, facilityId: facility.id, items: JSON.stringify([{ description: 'Consultation', amount: 80 }]), amount: 120, paidAmount: 40, status: 'PARTIAL' },
  });
  invoiceId = invoice.id;
  invoiceAmount = invoice.amount;
  // A second, fully unpaid invoice for the FAILED-outcome test (the first is
  // settled by the SUCCESS test that runs before it).
  const second = await db.invoice.create({
    data: { patientId, facilityId: facility.id, items: JSON.stringify([{ description: 'Imaging', amount: 240 }]), amount: 240, paidAmount: 0, status: 'UNPAID' },
  });
  secondInvoiceId = second.id;
});

afterAll(async () => {
  await db.paymentAttempt.deleteMany({ where: { invoiceId: { in: [invoiceId, secondInvoiceId] } } });
  await db.invoice.deleteMany({ where: { patientId } });
  await db.patient.deleteMany({ where: { id: patientId } });
  await db.$disconnect();
  await app.close();
});

describe('payments (spec §37 — provider abstraction)', () => {
  it('lists providers truthfully — SIMULATED is always configured and labeled test-only', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/payments/providers', headers: auth(cashier.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    const sim = body.providers.find((p: { id: string }) => p.id === 'SIMULATED');
    expect(sim).toBeTruthy();
    expect(sim.configured).toBe(true);
    expect(sim.kind).toBe('TEST');
    expect(sim.note).toContain('SIMULATED');
  });

  it('initiates a payment idempotently — re-initiating never duplicates', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/invoices/${invoiceId}/payments`,
      headers: auth(cashier.token),
      payload: { provider: 'SIMULATED', idempotencyKey: 'pay-test-1' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.duplicated).toBe(false);
    expect(body.attempt.status).toBe('PENDING');
    expect(body.attempt.amount).toBe(80); // remaining balance (120 - 40)
    expect(body.attempt.providerRef).toMatch(/^SIM-/);
    expect(body.instructions).toContain('test only');

    const dup = await app.inject({
      method: 'POST',
      url: `/api/v1/invoices/${invoiceId}/payments`,
      headers: auth(cashier.token),
      payload: { provider: 'SIMULATED', idempotencyKey: 'pay-test-1' },
    });
    expect(dup.json().duplicated).toBe(true);
    expect(dup.json().attempt.id).toBe(body.attempt.id);
    const rows = await db.paymentAttempt.count({ where: { idempotencyKey: 'pay-test-1' } });
    expect(rows).toBe(1);
  });

  it('confirms via the provider webhook — SUCCESS moves the invoice to PAID', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/invoices/${invoiceId}/payments`,
      headers: auth(cashier.token),
      payload: { provider: 'SIMULATED' },
    });
    const providerRef = res.json().attempt.providerRef;

    const webhook = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/webhook/SIMULATED',
      headers: auth(cashier.token),
      payload: { providerRef },
    });
    expect(webhook.statusCode).toBe(200);
    expect(webhook.json().attempt.status).toBe('SUCCESS');

    const invoice = await db.invoice.findUnique({ where: { id: invoiceId } });
    expect(invoice?.paidAmount).toBe(120);
    expect(invoice?.status).toBe('PAID');

    // The same webhook again is a no-op (already processed).
    const again = await app.inject({ method: 'POST', url: '/api/v1/payments/webhook/SIMULATED', headers: auth(cashier.token), payload: { providerRef } });
    expect(again.json().alreadyProcessed).toBe(true);
  });

  it('marks FAILED attempts without touching the invoice', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/invoices/${secondInvoiceId}/payments`,
      headers: auth(cashier.token),
      payload: { provider: 'SIMULATED' },
    });
    expect(res.statusCode).toBe(200);
    const attempt = res.json().attempt;

    // A FAILED outcome (simulated provider rejects refs containing FAIL).
    const failedRef = `SIM-FAIL-${Math.random().toString(36).slice(2, 8)}`;
    await db.paymentAttempt.update({ where: { id: attempt.id }, data: { providerRef: failedRef } });
    const webhook = await app.inject({ method: 'POST', url: '/api/v1/payments/webhook/SIMULATED', headers: auth(cashier.token), payload: { providerRef: failedRef } });
    expect(webhook.statusCode).toBe(200);
    expect(webhook.json().attempt.status).toBe('FAILED');
    expect(webhook.json().attempt.error).toContain('test');

    const invoice = await db.invoice.findUnique({ where: { id: secondInvoiceId } });
    expect(invoice?.paidAmount).toBe(0); // unchanged — never assumed paid
    expect(invoice?.status).toBe('UNPAID');
  });

  it('rejects paying a fully-settled invoice and unknown providers', async () => {
    const tooMuch = await app.inject({ method: 'POST', url: `/api/v1/invoices/${invoiceId}/payments`, headers: auth(cashier.token), payload: { provider: 'SIMULATED' } });
    expect(tooMuch.statusCode).toBe(409); // remaining balance is 0
    const unknown = await app.inject({ method: 'POST', url: `/api/v1/invoices/${invoiceId}/payments`, headers: auth(cashier.token), payload: { provider: 'BITCOIN' } });
    expect(unknown.statusCode).toBe(400);
  });

  it('scopes invoices to the caller and lists attempts', async () => {
    const otherFacility = await makeFacility('Payments Other Facility (synthetic)');
    const other = await makeUser({ email: 'payments-other@demo.gh', roleCode: 'HOSPITAL_ADMIN', facilityId: otherFacility.id, permissions: PERMS });
    const denied = await app.inject({ method: 'GET', url: `/api/v1/invoices/${invoiceId}/payments`, headers: auth(other.token) });
    expect(denied.statusCode).toBe(403);

    const list = await app.inject({ method: 'GET', url: `/api/v1/invoices/${invoiceId}/payments`, headers: auth(cashier.token) });
    expect(list.statusCode).toBe(200);
    expect(list.json().count).toBeGreaterThanOrEqual(2); // the idempotent + the paid attempt
    expect(list.json().remaining).toBe(0);

    const secondList = await app.inject({ method: 'GET', url: `/api/v1/invoices/${secondInvoiceId}/payments`, headers: auth(cashier.token) });
    expect(secondList.json().count).toBe(1); // the FAILED attempt
    expect(secondList.json().remaining).toBe(240);
  });

  it('requires process_payment', async () => {
    const nurse = await makeUser({ email: 'payments-nurse@demo.gh', roleCode: 'NURSE' });
    const res = await app.inject({ method: 'POST', url: `/api/v1/invoices/${invoiceId}/payments`, headers: auth(nurse.token), payload: { provider: 'SIMULATED' } });
    expect(res.statusCode).toBe(403);
  });
});
