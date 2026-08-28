import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { db, createTestApp, makeUser, makeFacility, type TestUser } from './helpers.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;
let national: TestUser;
let cashier: TestUser;
let outsider: TestUser;
let nurse: TestUser;
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

async function makeScheme(code: string, type = 'PRIVATE') {
  const res = await app.inject({ method: 'POST', url: '/api/v1/insurance/schemes', headers: auth(national), payload: { code, name: `${code} Scheme (synthetic)`, type } });
  expect(res.statusCode).toBe(200);
  return res.json().scheme as { id: string; code: string; name: string; type: string; status: string };
}

beforeAll(async () => {
  app = await createTestApp();
  facilityA = await makeFacility('Insurance Facility A (synthetic)');
  facilityB = await makeFacility('Insurance Facility B (synthetic)');
  national = await makeUser({ email: 'ins-national@demo.gh', roleCode: 'NATIONAL_ADMIN', scope: 'NATIONAL', permissions: ['manage_facility', 'view_financial', 'view_patient', 'edit_patient', 'process_payment', 'create_patient'] });
  cashier = await makeUser({ email: 'ins-cashier@demo.gh', roleCode: 'CASHIER', facilityId: facilityA.id, permissions: ['view_financial', 'process_payment', 'view_patient', 'edit_patient', 'create_patient'] });
  outsider = await makeUser({ email: 'ins-outsider@demo.gh', roleCode: 'CASHIER', facilityId: facilityB.id, permissions: ['view_financial', 'process_payment', 'view_patient', 'edit_patient', 'create_patient'] });
  nurse = await makeUser({ email: 'ins-nurse@demo.gh', roleCode: 'NURSE', facilityId: facilityA.id, permissions: ['view_patient', 'create_patient'] });
  patientA = await makePatient('Insured Patient A (synthetic)', cashier);
  patientB = await makePatient('Insured Patient B (synthetic)', outsider);
});

afterAll(async () => {
  // Remove rows created by these tests — never leak synthetic state into
  // other test files (shared DB). Roles are removed by the exact ids this
  // file's makeUser calls created (never "any orphaned role": other files
  // create roles concurrently in the same DB).
  const userIds = [national.userId, cashier.userId, outsider.userId, nurse.userId];
  const roleIds = (await db.user.findMany({ where: { id: { in: userIds } }, select: { roleId: true } })).map((u) => u.roleId);
  await db.patientInsurance.deleteMany({ where: { patient: { facilityId: { in: [facilityA.id, facilityB.id] } } } });
  await db.insuranceClaim.deleteMany({ where: { facilityId: { in: [facilityA.id, facilityB.id] } } });
  await db.insuranceScheme.deleteMany({ where: { isSynthetic: true } });
  await db.patient.deleteMany({ where: { id: { in: [patientA.id, patientB.id] } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.role.deleteMany({ where: { id: { in: roleIds } } });
  await db.facility.deleteMany({ where: { id: { in: [facilityA.id, facilityB.id] } } });
  await app.close();
});

describe('insurance scheme registry', () => {
  it('lists schemes for staff with finance/patient access', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/insurance/schemes', headers: auth(cashier) });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().schemes)).toBe(true);
  });

  it('denies scheme registration to non-national staff (403)', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/insurance/schemes', headers: auth(cashier), payload: { code: 'HACK', name: 'Not Allowed' } });
    expect(res.statusCode).toBe(403);
  });

  it('registers schemes with validation (national only)', async () => {
    const created = await makeScheme('TST-NW', 'PRIVATE');
    expect(created.status).toBe('ACTIVE');

    const dup = await app.inject({ method: 'POST', url: '/api/v1/insurance/schemes', headers: auth(national), payload: { code: 'TST-NW', name: 'Duplicate' } });
    expect(dup.statusCode).toBe(409);

    const badType = await app.inject({ method: 'POST', url: '/api/v1/insurance/schemes', headers: auth(national), payload: { code: 'TST-BAD', name: 'Bad', type: 'LOAN' } });
    expect(badType.statusCode).toBe(400);
  });

  it('deactivates schemes; deactivated schemes reject new memberships', async () => {
    const s = await makeScheme('TST-OFF');
    const deact = await app.inject({ method: 'POST', url: `/api/v1/insurance/schemes/${s.id}/deactivate`, headers: auth(national) });
    expect(deact.json().scheme.status).toBe('INACTIVE');

    const enroll = await app.inject({
      method: 'POST',
      url: `/api/v1/patients/${patientA.id}/insurance`,
      headers: auth(cashier),
      payload: { schemeId: s.id, membershipNumber: 'TST-OFF-1' },
    });
    expect(enroll.statusCode).toBe(400);
  });
});

describe('insurance scheme editing', () => {
  it('edits a scheme (name/type/contact) and audits the change', async () => {
    const s = await makeScheme('TST-EDIT');
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/insurance/schemes/${s.id}`,
      headers: auth(national),
      payload: { name: 'Edited Scheme (synthetic)', type: 'CORPORATE', phone: '0244555666', email: 'edit@scheme.gh' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().scheme).toMatchObject({ id: s.id, code: 'TST-EDIT', name: 'Edited Scheme (synthetic)', type: 'CORPORATE', phone: '0244555666', email: 'edit@scheme.gh' });

    // Reflected in the registry list and audited with the field-level changes.
    const list = await app.inject({ method: 'GET', url: '/api/v1/insurance/schemes', headers: auth(cashier) });
    expect(list.json().schemes.find((x: { id: string }) => x.id === s.id)?.name).toBe('Edited Scheme (synthetic)');
    const audit = await db.auditLog.findFirst({ where: { action: 'insurance.scheme.update', entityId: s.id } });
    expect(audit).toBeTruthy();
    expect(JSON.parse(audit?.after ?? '{}').changes.join(' | ')).toContain('type → CORPORATE');
  });

  it('clears an optional contact field with null', async () => {
    const s = await makeScheme('TST-CLEAR', 'NHIS');
    await app.inject({ method: 'PUT', url: `/api/v1/insurance/schemes/${s.id}`, headers: auth(national), payload: { phone: '0200111222' } });
    const cleared = await app.inject({ method: 'PUT', url: `/api/v1/insurance/schemes/${s.id}`, headers: auth(national), payload: { phone: null } });
    expect(cleared.statusCode).toBe(200);
    expect(cleared.json().scheme.phone).toBeNull();
  });

  it('validates the payload and the caller', async () => {
    const s = await makeScheme('TST-VALID');
    const shortName = await app.inject({ method: 'PUT', url: `/api/v1/insurance/schemes/${s.id}`, headers: auth(national), payload: { name: 'X' } });
    expect(shortName.statusCode).toBe(400);
    const badType = await app.inject({ method: 'PUT', url: `/api/v1/insurance/schemes/${s.id}`, headers: auth(national), payload: { type: 'LOAN' } });
    expect(badType.statusCode).toBe(400);
    const nothing = await app.inject({ method: 'PUT', url: `/api/v1/insurance/schemes/${s.id}`, headers: auth(national), payload: {} });
    expect(nothing.statusCode).toBe(400);
    const longNotes = await app.inject({ method: 'PUT', url: `/api/v1/insurance/schemes/${s.id}`, headers: auth(national), payload: { notes: 'x'.repeat(501) } });
    expect(longNotes.statusCode).toBe(400);
    const missing = await app.inject({ method: 'PUT', url: '/api/v1/insurance/schemes/no-such-scheme', headers: auth(national), payload: { name: 'Renamed' } });
    expect(missing.statusCode).toBe(404);
    // Only national admins may edit scheme master data.
    const denied = await app.inject({ method: 'PUT', url: `/api/v1/insurance/schemes/${s.id}`, headers: auth(cashier), payload: { name: 'Hijack' } });
    expect(denied.statusCode).toBe(403);
  });
});

describe('patient memberships', () => {
  let schemeId: string;

  beforeAll(async () => {
    schemeId = (await makeScheme('TST-MEM')).id;
  });

  it('enrolls a patient, rejects duplicates, verifies and suspends', async () => {
    const enroll = await app.inject({
      method: 'POST',
      url: `/api/v1/patients/${patientA.id}/insurance`,
      headers: auth(cashier),
      payload: { schemeId, membershipNumber: 'MEM-0001', relationship: 'SELF', validTo: '2027-12-31' },
    });
    expect(enroll.statusCode).toBe(200);
    expect(enroll.json().membership.status).toBe('ACTIVE');
    expect(enroll.json().membership.verified).toBe(false);
    const membershipId = enroll.json().membership.id as string;

    const dup = await app.inject({
      method: 'POST',
      url: `/api/v1/patients/${patientA.id}/insurance`,
      headers: auth(cashier),
      payload: { schemeId, membershipNumber: 'MEM-9999' },
    });
    expect(dup.statusCode).toBe(409);

    // Verify — audited under the dedicated action, recorded against the user.
    const verify = await app.inject({ method: 'POST', url: `/api/v1/insurance/memberships/${membershipId}/verify`, headers: auth(cashier) });
    expect(verify.statusCode).toBe(200);
    expect(verify.json().membership.verified).toBe(true);
    const audit = await db.auditLog.findFirst({ where: { action: 'insurance.membership.verify', entityId: membershipId } });
    expect(audit?.actorId).toBe(cashier.userId);

    const suspend = await app.inject({ method: 'PUT', url: `/api/v1/insurance/memberships/${membershipId}`, headers: auth(cashier), payload: { status: 'SUSPENDED' } });
    expect(suspend.json().membership.status).toBe('SUSPENDED');

    // The patient's insurance view reflects the lifecycle.
    const list = await app.inject({ method: 'GET', url: `/api/v1/patients/${patientA.id}/insurance`, headers: auth(cashier) });
    expect(list.json().memberships.some((m: { id: string }) => m.id === membershipId)).toBe(true);
  });

  it('requires a valid membership number and relationship', async () => {
    const short = await app.inject({
      method: 'POST',
      url: `/api/v1/patients/${patientA.id}/insurance`,
      headers: auth(cashier),
      payload: { schemeId, membershipNumber: 'ab' },
    });
    expect(short.statusCode).toBe(400);
    // A fresh scheme with no prior enrollment — the relationship is validated
    // before any duplicate conflict can fire.
    const relScheme = (await makeScheme('TST-REL')).id;
    const badRel = await app.inject({
      method: 'POST',
      url: `/api/v1/patients/${patientA.id}/insurance`,
      headers: auth(cashier),
      payload: { schemeId: relScheme, membershipNumber: 'MEM-7777', relationship: 'UNCLE' },
    });
    expect(badRel.statusCode).toBe(400);
  });

  it('scopes membership access to the patient geography', async () => {
    // patientB lives at facility B — a facility-A user is denied (403, the
    // assertPatientAccess convention for out-of-scope records).
    const res = await app.inject({ method: 'GET', url: `/api/v1/patients/${patientB.id}/insurance`, headers: auth(cashier) });
    expect(res.statusCode).toBe(403);

    // The register endpoint is scoped the same way: no facility-B rows leak.
    const reg = await app.inject({ method: 'GET', url: '/api/v1/insurance/memberships', headers: auth(cashier) });
    expect(reg.statusCode).toBe(200);
    const ids = reg.json().memberships as Array<{ patientId: string }>;
    expect(ids.some((m) => m.patientId === patientB.id)).toBe(false);
  });

  it('allows view with view_patient but requires edit_patient to enroll (403 for a nurse)', async () => {
    // Viewing memberships needs only view_patient — a nurse may read coverage.
    const view = await app.inject({ method: 'GET', url: `/api/v1/patients/${patientA.id}/insurance`, headers: auth(nurse) });
    expect(view.statusCode).toBe(200);
    // Enrolling is a patient-record edit — the nurse lacks edit_patient.
    const enroll = await app.inject({
      method: 'POST',
      url: `/api/v1/patients/${patientA.id}/insurance`,
      headers: auth(nurse),
      payload: { schemeId, membershipNumber: 'NURSE-NO', relationship: 'SELF' },
    });
    expect(enroll.statusCode).toBe(403);
  });
});

describe('insurance claims', () => {
  let schemeId: string;
  let membershipId: string;

  beforeAll(async () => {
    const s = await makeScheme('TST-CLM');
    schemeId = s.id;
    const enroll = await app.inject({
      method: 'POST',
      url: `/api/v1/patients/${patientA.id}/insurance`,
      headers: auth(cashier),
      payload: { schemeId, membershipNumber: 'CLM-0001', relationship: 'SELF', validTo: '2027-12-31' },
    });
    membershipId = enroll.json().membership.id as string;
  });

  it('rejects claims without an active membership (400)', async () => {
    // A scheme the patient has never joined — no membership, no claim.
    const noMemScheme = (await makeScheme('TST-NOMEM')).id;
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/insurance/claims',
      headers: auth(cashier),
      payload: { patientId: patientA.id, schemeId: noMemScheme, facilityId: facilityA.id, items: [{ description: 'Consultation', amount: 100 }], amount: 100 },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.message).toContain('no active membership');
  });

  it('submits a claim and enforces amount = sum of items', async () => {
    await db.patientInsurance.update({ where: { id: membershipId }, data: { status: 'ACTIVE' } });
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/insurance/claims',
      headers: auth(cashier),
      payload: { patientId: patientA.id, schemeId, facilityId: facilityA.id, serviceDate: '2026-08-01', items: [{ description: 'Consultation', amount: 80 }, { description: 'Laboratory', amount: 45 }], amount: 125 },
    });
    expect(res.statusCode).toBe(200);
    const claim = res.json().claim;
    expect(claim.claimNumber).toMatch(/^CLM-\d{4}-\d{4}$/);
    expect(claim.status).toBe('SUBMITTED');
    expect(claim.items).toHaveLength(2);

    const mismatch = await app.inject({
      method: 'POST',
      url: '/api/v1/insurance/claims',
      headers: auth(cashier),
      payload: { patientId: patientA.id, schemeId, facilityId: facilityA.id, items: [{ description: 'Consultation', amount: 80 }], amount: 999 },
    });
    expect(mismatch.statusCode).toBe(400);

    // An invoice belonging to another patient is rejected up front.
    const foreignInvoice = await db.invoice.create({ data: { patientId: patientB.id, facilityId: facilityA.id, items: '[]', amount: 50, issuedAt: new Date() } });
    const badInv = await app.inject({
      method: 'POST',
      url: '/api/v1/insurance/claims',
      headers: auth(cashier),
      payload: { patientId: patientA.id, schemeId, facilityId: facilityA.id, invoiceId: foreignInvoice.id, items: [{ description: 'X', amount: 50 }], amount: 50 },
    });
    expect(badInv.statusCode).toBe(400);
    await db.invoice.delete({ where: { id: foreignInvoice.id } });
  });

  it('walks the decision pipeline with strict transitions', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/insurance/claims',
      headers: auth(cashier),
      payload: { patientId: patientA.id, schemeId, facilityId: facilityA.id, items: [{ description: 'Consultation', amount: 100 }], amount: 100 },
    });
    const claim = created.json().claim;

    // Can't pay a claim that was never approved.
    const earlyPay = await app.inject({ method: 'PUT', url: `/api/v1/insurance/claims/${claim.id}/decision`, headers: auth(cashier), payload: { status: 'PAID' } });
    expect(earlyPay.statusCode).toBe(400);

    const partial = await app.inject({ method: 'PUT', url: `/api/v1/insurance/claims/${claim.id}/decision`, headers: auth(cashier), payload: { status: 'PARTIALLY_APPROVED', approvedAmount: 60, note: 'Line-item review' } });
    expect(partial.statusCode).toBe(200);
    expect(partial.json().claim.approvedAmount).toBe(60);

    // No backwards jumps from PARTIALLY_APPROVED.
    const reject = await app.inject({ method: 'PUT', url: `/api/v1/insurance/claims/${claim.id}/decision`, headers: auth(cashier), payload: { status: 'REJECTED' } });
    expect(reject.statusCode).toBe(400);

    const pay = await app.inject({ method: 'PUT', url: `/api/v1/insurance/claims/${claim.id}/decision`, headers: auth(cashier), payload: { status: 'PAID' } });
    expect(pay.statusCode).toBe(200);
    expect(pay.json().claim.status).toBe('PAID');

    // Terminal state: no further decisions.
    const again = await app.inject({ method: 'PUT', url: `/api/v1/insurance/claims/${claim.id}/decision`, headers: auth(cashier), payload: { status: 'APPROVED' } });
    expect(again.statusCode).toBe(400);
  });

  it('cannot file a claim for a patient registered at another facility', async () => {
    return app.inject({
      method: 'POST',
      url: '/api/v1/insurance/claims',
      headers: auth(cashier),
      payload: { patientId: patientB.id, schemeId, facilityId: facilityA.id, items: [{ description: 'Consultation', amount: 50 }], amount: 50 },
    }).then((res) => expect(res.statusCode).toBe(403));
  });

  it('refuses to verify a non-active membership (400)', async () => {
    await db.patientInsurance.update({ where: { id: membershipId }, data: { status: 'SUSPENDED' } });
    const res = await app.inject({ method: 'POST', url: `/api/v1/insurance/memberships/${membershipId}/verify`, headers: auth(cashier) });
    expect(res.statusCode).toBe(400);
    // Restore for the remaining tests.
    await db.patientInsurance.update({ where: { id: membershipId }, data: { status: 'ACTIVE' } });
  });

  it('scopes the claim list to the caller facility', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/insurance/claims', headers: auth(outsider) });
    expect(res.statusCode).toBe(200);
    const claims = res.json().claims as Array<{ facility: { id: string } | null }>;
    expect(claims.every((c) => c.facility?.id === facilityB.id)).toBe(true);

    // The facilityId filter cannot widen scope — requesting facility A as a B user is forbidden.
    const widen = await app.inject({ method: 'GET', url: `/api/v1/insurance/claims?facilityId=${facilityA.id}`, headers: auth(outsider) });
    expect(widen.statusCode).toBe(403);
  });

  it('summarises coverage and the claim pipeline', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/insurance/summary', headers: auth(cashier) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.coverage.totalMemberships).toBeGreaterThanOrEqual(1);
    expect(body.coverage.activeMemberships).toBeGreaterThanOrEqual(1);
    expect(body.claims.pending).toBeDefined();
    expect(body.claims.paidThisMonth.count).toBeGreaterThanOrEqual(1);
    expect(body.claims.byStatus.PAID.count).toBeGreaterThanOrEqual(1);
    expect(body.byScheme.length).toBeGreaterThanOrEqual(1);
  });

  it('requires the finance permission (403 for a nurse)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/insurance/claims', headers: auth(nurse) });
    expect(res.statusCode).toBe(403);
  });
});
