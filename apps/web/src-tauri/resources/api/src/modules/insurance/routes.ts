import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { str, optStr, num, dateIso, parseJsonArr } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import { facilityScope, patientScope } from '../../lib/scope.js';
import { assertPatientAccess } from '../patients/service.js';
import type { Guards } from '../../lib/guards.js';

/**
 * Insurance & claims (spec §38) — the national insurer registry, patient
 * memberships and the claim lifecycle.
 *
 * Scope discipline:
 *  * Schemes are NATIONAL master data — any staff may read the registry
 *    (they need it to enroll patients), but only national administrators
 *    may register or edit schemes.
 *  * Memberships are patient records — always behind assertPatientAccess,
 *    so a regional/district/facility user can only touch memberships of
 *    patients in their geography.
 *  * Claims are facility-tagged — regional/district users see claims of
 *    their facilities via the facility relation, facility users only their
 *    own, and the facilityId filter can never widen the caller's scope.
 */

const SCHEME_TYPES = ['NHIS', 'PRIVATE', 'CORPORATE'];
const MEMBERSHIP_STATUSES = ['ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED'];
const RELATIONSHIPS = ['SELF', 'SPOUSE', 'CHILD', 'DEPENDENT'];
const CLAIM_STATUSES = ['SUBMITTED', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'PAID'];
// Claims may only advance along the approval pipeline — never jump
// backwards or skip the insurer's decision.
const CLAIM_TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ['APPROVED', 'PARTIALLY_APPROVED', 'REJECTED'],
  APPROVED: ['PAID'],
  PARTIALLY_APPROVED: ['PAID'],
  REJECTED: [],
  PAID: [],
};
const DENY = '__deny__';

function toSchemePayload(s: { id: string; code: string; name: string; type: string; phone: string | null; email: string | null; notes: string | null; status: string; createdAt: Date }) {
  return { id: s.id, code: s.code, name: s.name, type: s.type, phone: s.phone, email: s.email, notes: s.notes, status: s.status, createdAt: s.createdAt };
}

function toMembershipPayload(m: {
  id: string;
  patientId: string;
  membershipNumber: string;
  holderName: string | null;
  relationship: string;
  validFrom: Date;
  validTo: Date | null;
  status: string;
  verified: boolean;
  verifiedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  scheme?: { id: string; code: string; name: string; type: string; status: string } | null;
}) {
  return {
    id: m.id,
    patientId: m.patientId,
    scheme: m.scheme ?? null,
    membershipNumber: m.membershipNumber,
    holderName: m.holderName,
    relationship: m.relationship,
    validFrom: m.validFrom,
    validTo: m.validTo,
    status: m.status,
    verified: m.verified,
    verifiedAt: m.verifiedAt,
    notes: m.notes,
    createdAt: m.createdAt,
  };
}

function toClaimPayload(c: {
  id: string;
  claimNumber: string;
  patientId: string;
  facilityId: string;
  invoiceId: string | null;
  encounterId: string | null;
  serviceDate: Date;
  items: string;
  amount: number;
  approvedAmount: number | null;
  status: string;
  decidedAt: Date | null;
  decisionNote: string | null;
  createdAt: Date;
  patient?: { id: string; fullName: string; mrn: string } | null;
  scheme?: { id: string; code: string; name: string; type: string } | null;
  facility?: { id: string; code: string; name: string } | null;
  submittedBy?: { fullName: string } | null;
  decidedBy?: { fullName: string } | null;
}) {
  return {
    id: c.id,
    claimNumber: c.claimNumber,
    patient: c.patient ?? null,
    scheme: c.scheme ?? null,
    facility: c.facility ?? null,
    invoiceId: c.invoiceId,
    encounterId: c.encounterId,
    serviceDate: c.serviceDate,
    items: parseJsonArr<{ description: string; amount: number }>(c.items),
    amount: c.amount,
    approvedAmount: c.approvedAmount,
    status: c.status,
    submittedBy: c.submittedBy?.fullName ?? null,
    decidedBy: c.decidedBy?.fullName ?? null,
    decidedAt: c.decidedAt,
    decisionNote: c.decisionNote,
    createdAt: c.createdAt,
  };
}

/** Next per-facility claim number for the current year: CLM-2026-0001… */
async function nextClaimNumber(db: PrismaClient, facilityId: string): Promise<string> {
  const prefix = `CLM-${new Date().getFullYear()}-`;
  const count = await db.insuranceClaim.count({ where: { facilityId, claimNumber: { startsWith: prefix } } });
  return `${prefix}${String(count + 1).padStart(4, '0')}`;
}

const CLAIM_INCLUDE = {
  patient: { select: { id: true, fullName: true, mrn: true } },
  scheme: { select: { id: true, code: true, name: true, type: true } },
  facility: { select: { id: true, code: true, name: true } },
  submittedBy: { select: { fullName: true } },
  decidedBy: { select: { fullName: true } },
} as const;

/** Throws unless the caller may file claims for the given facility. */
function assertFacilityScope(u: { scope: string; regionId?: string | null; districtId?: string | null; facilityId?: string | null }, facility: { id: string; regionId: string; districtId: string }): void {
  if (u.scope === 'FACILITY' && u.facilityId !== facility.id) throw httpErrors.forbidden('You can only file claims for your own facility');
  if (u.scope === 'REGIONAL' && u.regionId !== facility.regionId) throw httpErrors.forbidden('You can only file claims for facilities in your region');
  if (u.scope === 'DISTRICT' && u.districtId !== facility.districtId) throw httpErrors.forbidden('You can only file claims for facilities in your district');
}

export function registerInsuranceRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  // ========================================================== schemes
  app.get(
    '/insurance/schemes',
    { preHandler: guards.requirePermission('view_financial', 'process_payment', 'view_patient'), schema: { summary: 'Insurance scheme registry (NHIS + private + corporate)', tags: ['insurance'] } },
    async (request) => {
      const q = request.query as Record<string, unknown>;
      const type = optStr(q.type)?.toUpperCase();
      if (type && !SCHEME_TYPES.includes(type)) throw httpErrors.badRequest(`Scheme type must be one of: ${SCHEME_TYPES.join(', ')}`);
      const schemes = await db.insuranceScheme.findMany({
        where: type ? { type } : {},
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
      });
      return { schemes: schemes.map(toSchemePayload) };
    },
  );

  // Scheme registration is national master data: a facility cannot invent an
  // insurer, and an inactive scheme can never be re-activated by accident.
  app.post(
    '/insurance/schemes',
    { preHandler: guards.requirePermission('manage_facility'), schema: { summary: 'Register an insurance scheme (national admin only)', tags: ['insurance'] } },
    async (request) => {
      const u = request.user!;
      if (u.scope !== 'NATIONAL') throw httpErrors.forbidden('Only national administrators can register insurance schemes');
      const body = (request.body ?? {}) as Record<string, unknown>;
      const code = str(body.code, 'code', { required: true, max: 20 }).toUpperCase();
      const name = str(body.name, 'name', { required: true, max: 160 });
      const type = (optStr(body.type) ?? 'PRIVATE').toUpperCase();
      if (!SCHEME_TYPES.includes(type)) throw httpErrors.badRequest(`Scheme type must be one of: ${SCHEME_TYPES.join(', ')}`);
      const dup = await db.insuranceScheme.findUnique({ where: { code } });
      if (dup) throw httpErrors.conflict(`A scheme with code ${code} already exists`);
      const scheme = await db.insuranceScheme.create({
        data: { code, name, type, phone: optStr(body.phone), email: optStr(body.email), notes: optStr(body.notes), status: 'ACTIVE' },
      });
      recordAudit(db, request, {
        action: 'insurance.scheme.create',
        entityType: 'insuranceScheme',
        entityId: scheme.id,
        after: { code, name, type },
      });
      return { scheme: toSchemePayload(scheme) };
    },
  );

  app.put(
    '/insurance/schemes/:id',
    { preHandler: guards.requirePermission('manage_facility'), schema: { summary: 'Edit an insurance scheme (national admin only)', tags: ['insurance'] } },
    async (request) => {
      const u = request.user!;
      if (u.scope !== 'NATIONAL') throw httpErrors.forbidden('Only national administrators can edit insurance schemes');
      const params = request.params as { id: string };
      const scheme = await db.insuranceScheme.findUnique({ where: { id: params.id } });
      if (!scheme) throw httpErrors.notFound('Scheme not found');
      const body = (request.body ?? {}) as Record<string, unknown>;
      const data: Record<string, unknown> = {};
      const notes: string[] = [];
      const name = optStr(body.name);
      if (name !== undefined) {
        if (name.trim().length < 2) throw httpErrors.badRequest('Scheme name is too short');
        data.name = name.trim();
        notes.push(`name → ${data.name}`);
      }
      const type = optStr(body.type)?.toUpperCase();
      if (type !== undefined) {
        if (!SCHEME_TYPES.includes(type)) throw httpErrors.badRequest(`Scheme type must be one of: ${SCHEME_TYPES.join(', ')}`);
        data.type = type;
        notes.push(`type → ${type}`);
      }
      const strField = (key: string, label: string, max: number) => {
        if (body[key] === undefined) return;
        const v = optStr(body[key]);
        if (v === undefined) {
          data[key] = null;
          notes.push(`${key} → (cleared)`);
          return;
        }
        if (v.length > max) throw httpErrors.badRequest(`${label} is too long`);
        data[key] = v;
        notes.push(`${key} → ${data[key]}`);
      };
      strField('phone', 'Phone', 40);
      strField('email', 'Email', 120);
      strField('notes', 'Notes', 500);
      if (Object.keys(data).length === 0) throw httpErrors.badRequest('Nothing to update');
      const updated = await db.insuranceScheme.update({ where: { id: scheme.id }, data });
      recordAudit(db, request, {
        action: 'insurance.scheme.update',
        entityType: 'insuranceScheme',
        entityId: scheme.id,
        after: { code: scheme.code, changes: notes },
      });
      return { scheme: toSchemePayload(updated) };
    },
  );

  app.post(
    '/insurance/schemes/:id/deactivate',
    { preHandler: guards.requirePermission('manage_facility'), schema: { summary: 'Deactivate an insurance scheme (national admin only)', tags: ['insurance'] } },
    async (request) => {
      const u = request.user!;
      if (u.scope !== 'NATIONAL') throw httpErrors.forbidden('Only national administrators can deactivate insurance schemes');
      const params = request.params as { id: string };
      const scheme = await db.insuranceScheme.findUnique({ where: { id: params.id } });
      if (!scheme) throw httpErrors.notFound('Scheme not found');
      const updated = await db.insuranceScheme.update({ where: { id: scheme.id }, data: { status: 'INACTIVE' } });
      recordAudit(db, request, { action: 'insurance.scheme.deactivate', entityType: 'insuranceScheme', entityId: scheme.id, after: { code: scheme.code } });
      return { scheme: toSchemePayload(updated) };
    },
  );

  // ======================================================== memberships
  app.get(
    '/patients/:id/insurance',
    { preHandler: guards.requirePermission('view_patient'), schema: { summary: "A patient's insurance memberships", tags: ['insurance'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      await assertPatientAccess(db, u, params.id);
      const memberships = await db.patientInsurance.findMany({
        where: { patientId: params.id },
        include: { scheme: { select: { id: true, code: true, name: true, type: true, status: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return { memberships: memberships.map(toMembershipPayload) };
    },
  );

  app.post(
    '/patients/:id/insurance',
    { preHandler: guards.requirePermission('edit_patient', 'process_payment'), schema: { summary: 'Enroll a patient in an insurance scheme', tags: ['insurance'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      await assertPatientAccess(db, u, params.id);
      const schemeId = str(body.schemeId, 'schemeId', { required: true });
      const scheme = await db.insuranceScheme.findFirst({ where: { id: schemeId, status: 'ACTIVE' } });
      if (!scheme) throw httpErrors.badRequest('Unknown or inactive scheme');
      const membershipNumber = str(body.membershipNumber, 'membershipNumber', { required: true, max: 60 }).trim();
      if (membershipNumber.length < 3) throw httpErrors.badRequest('Membership number is too short');
      const dup = await db.patientInsurance.findFirst({ where: { patientId: params.id, schemeId } });
      if (dup) throw httpErrors.conflict('Patient is already enrolled in this scheme');
      const relationship = (optStr(body.relationship) ?? 'SELF').toUpperCase();
      if (!RELATIONSHIPS.includes(relationship)) throw httpErrors.badRequest(`Relationship must be one of: ${RELATIONSHIPS.join(', ')}`);
      const validFrom = body.validFrom ? (dateIso(body.validFrom, 'validFrom') ?? new Date()) : new Date();
      const validTo = body.validTo ? (dateIso(body.validTo, 'validTo') ?? null) : null;
      if (validTo && validTo.getTime() <= validFrom.getTime()) throw httpErrors.badRequest('validTo must be after validFrom');
      const membership = await db.patientInsurance.create({
        data: {
          patientId: params.id,
          schemeId,
          membershipNumber,
          holderName: optStr(body.holderName),
          relationship,
          validFrom,
          validTo,
          status: 'ACTIVE',
          verified: false,
          notes: optStr(body.notes),
        },
        include: { scheme: { select: { id: true, code: true, name: true, type: true, status: true } } },
      });
      recordAudit(db, request, {
        action: 'insurance.membership.enroll',
        entityType: 'patientInsurance',
        entityId: membership.id,
        after: { patientId: params.id, schemeCode: scheme.code, membershipNumber, validTo: validTo?.toISOString() ?? null },
      });
      return { membership: toMembershipPayload(membership) };
    },
  );

  app.put(
    '/insurance/memberships/:id',
    { preHandler: guards.requirePermission('edit_patient', 'process_payment'), schema: { summary: 'Edit a membership (status, validity, details)', tags: ['insurance'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const membership = await db.patientInsurance.findUnique({ where: { id: params.id } });
      if (!membership) throw httpErrors.notFound('Membership not found');
      await assertPatientAccess(db, u, membership.patientId);
      const data: Record<string, unknown> = {};
      const notes: string[] = [];
      const status = optStr(body.status)?.toUpperCase();
      if (status !== undefined) {
        if (!MEMBERSHIP_STATUSES.includes(status)) throw httpErrors.badRequest(`Membership status must be one of: ${MEMBERSHIP_STATUSES.join(', ')}`);
        data.status = status;
        notes.push(`status → ${status}`);
      }
      const relationship = optStr(body.relationship)?.toUpperCase();
      if (relationship !== undefined) {
        if (!RELATIONSHIPS.includes(relationship)) throw httpErrors.badRequest(`Relationship must be one of: ${RELATIONSHIPS.join(', ')}`);
        data.relationship = relationship;
        notes.push(`relationship → ${relationship}`);
      }
      const strField = (key: string, label: string, max: number) => {
        if (body[key] === undefined) return;
        const v = optStr(body[key]);
        if (v === undefined) {
          data[key] = null;
          notes.push(`${key} → (cleared)`);
          return;
        }
        if (v.length > max) throw httpErrors.badRequest(`${label} is too long`);
        data[key] = v;
        notes.push(`${key} → ${data[key]}`);
      };
      strField('membershipNumber', 'Membership number', 60);
      strField('holderName', 'Holder name', 160);
      strField('notes', 'Notes', 500);
      if (body.validFrom !== undefined) data.validFrom = body.validFrom === '' || body.validFrom === null ? new Date() : (dateIso(body.validFrom, 'validFrom') ?? new Date());
      if (body.validTo !== undefined) data.validTo = body.validTo === '' || body.validTo === null ? null : (dateIso(body.validTo, 'validTo') ?? null);
      // Same guard as enrollment: a membership cannot end before it begins.
      const effectiveFrom = (data.validFrom as Date | undefined) ?? membership.validFrom;
      const effectiveTo = (data.validTo as Date | null | undefined) ?? membership.validTo;
      if (effectiveTo && effectiveTo.getTime() <= effectiveFrom.getTime()) throw httpErrors.badRequest('validTo must be after validFrom');
      if (Object.keys(data).length === 0) throw httpErrors.badRequest('Nothing to update');
      const updated = await db.patientInsurance.update({
        where: { id: membership.id },
        data,
        include: { scheme: { select: { id: true, code: true, name: true, type: true, status: true } } },
      });
      recordAudit(db, request, {
        action: 'insurance.membership.update',
        entityType: 'patientInsurance',
        entityId: membership.id,
        after: { patientId: membership.patientId, schemeCode: updated.scheme.code, changes: notes },
      });
      return { membership: toMembershipPayload(updated) };
    },
  );

  // NHIS e-verification / manual confirm — records who verified and when.
  app.post(
    '/insurance/memberships/:id/verify',
    { preHandler: guards.requirePermission('edit_patient', 'process_payment'), schema: { summary: 'Verify a membership (NHIS e-verification)', tags: ['insurance'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const membership = await db.patientInsurance.findUnique({ where: { id: params.id } });
      if (!membership) throw httpErrors.notFound('Membership not found');
      await assertPatientAccess(db, u, membership.patientId);
      // Verification only means something for a live membership — you cannot
      // verify a cancelled or suspended card.
      if (membership.status !== 'ACTIVE') throw httpErrors.badRequest('Only active memberships can be verified');
      const updated = await db.patientInsurance.update({
        where: { id: membership.id },
        data: { verified: true, verifiedAt: new Date(), verifiedById: u.id },
        include: { scheme: { select: { id: true, code: true, name: true, type: true, status: true } } },
      });
      recordAudit(db, request, {
        action: 'insurance.membership.verify',
        entityType: 'patientInsurance',
        entityId: membership.id,
        after: { patientId: membership.patientId, schemeCode: updated.scheme.code, membershipNumber: updated.membershipNumber },
      });
      return { membership: toMembershipPayload(updated) };
    },
  );

  app.get(
    '/insurance/memberships',
    { preHandler: guards.requirePermission('view_financial', 'edit_patient', 'process_payment'), schema: { summary: 'Membership register (scoped, filterable by status/scheme)', tags: ['insurance'] } },
    async (request) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const where: Record<string, unknown> = { patient: patientScope(u) };
      const status = optStr(q.status)?.toUpperCase();
      if (status) {
        if (!MEMBERSHIP_STATUSES.includes(status)) throw httpErrors.badRequest(`Membership status must be one of: ${MEMBERSHIP_STATUSES.join(', ')}`);
        where.status = status;
      }
      const schemeId = optStr(q.schemeId);
      if (schemeId) where.schemeId = schemeId;
      const memberships = await db.patientInsurance.findMany({
        where,
        include: {
          patient: { select: { id: true, fullName: true, mrn: true } },
          scheme: { select: { id: true, code: true, name: true, type: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 500,
      });
      return { memberships: memberships.map((m) => ({ ...toMembershipPayload(m), patient: m.patient })) };
    },
  );

  // ============================================================ claims
  app.get(
    '/insurance/claims',
    { preHandler: guards.requirePermission('view_financial'), schema: { summary: 'List insurance claims (scoped, filterable by status/scheme/facility)', tags: ['insurance'] } },
    async (request) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const where: Record<string, unknown> = { ...facilityScope(u) };
      const status = optStr(q.status)?.toUpperCase();
      if (status) {
        if (!CLAIM_STATUSES.includes(status)) throw httpErrors.badRequest(`Claim status must be one of: ${CLAIM_STATUSES.join(', ')}`);
        where.status = status;
      }
      const schemeId = optStr(q.schemeId);
      if (schemeId) where.schemeId = schemeId;
      // The facilityId filter must never widen the caller's scope (same
      // discipline as the units tree): resolve + assert before narrowing.
      const facilityId = optStr(q.facilityId);
      if (facilityId) {
        const requested = await db.facility.findUnique({ where: { id: facilityId } });
        if (!requested) throw httpErrors.notFound('Facility not found');
        assertFacilityScope(u, requested);
        where.facilityId = facilityId;
      }
      const [claims, summaryRows] = await Promise.all([
        db.insuranceClaim.findMany({
          where,
          include: {
            patient: { select: { id: true, fullName: true, mrn: true } },
            scheme: { select: { id: true, code: true, name: true, type: true } },
            facility: { select: { id: true, code: true, name: true } },
            submittedBy: { select: { fullName: true } },
            decidedBy: { select: { fullName: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 500,
        }),
        db.insuranceClaim.groupBy({ by: ['status'], where, _count: { _all: true }, _sum: { amount: true } }),
      ]);
      const summary = {
        total: summaryRows.reduce((acc, r) => acc + r._count._all, 0),
        byStatus: Object.fromEntries(summaryRows.map((r) => [r.status, { count: r._count._all, amount: r._sum.amount ?? 0 }])),
      };
      return { claims: claims.map(toClaimPayload), summary };
    },
  );

  app.get(
    '/insurance/claims/:id',
    { preHandler: guards.requirePermission('view_financial'), schema: { summary: 'Insurance claim detail', tags: ['insurance'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const claim = await db.insuranceClaim.findFirst({
        where: { id: params.id, ...facilityScope(u) },
        include: {
          patient: { select: { id: true, fullName: true, mrn: true } },
          scheme: { select: { id: true, code: true, name: true, type: true } },
          facility: { select: { id: true, code: true, name: true } },
          submittedBy: { select: { fullName: true } },
          decidedBy: { select: { fullName: true } },
        },
      });
      if (!claim) throw httpErrors.notFound('Claim not found in scope');
      return { claim: toClaimPayload(claim) };
    },
  );

  app.post(
    '/insurance/claims',
    { preHandler: guards.requirePermission('process_payment'), schema: { summary: 'Submit an insurance claim against an invoice', tags: ['insurance'] } },
    async (request) => {
      const u = request.user!;
      const body = (request.body ?? {}) as Record<string, unknown>;
      const patientId = str(body.patientId, 'patientId', { required: true });
      const schemeId = str(body.schemeId, 'schemeId', { required: true });
      const facilityId = str(body.facilityId, 'facilityId', { required: true });
      const facility = await db.facility.findUnique({ where: { id: facilityId } });
      if (!facility) throw httpErrors.notFound('Facility not found');
      assertFacilityScope(u, facility);
      const patient = await db.patient.findUnique({ where: { id: patientId } });
      if (!patient) throw httpErrors.notFound('Patient not found');
      // The claim facility must be the patient's registered facility — a
      // cashier cannot file claims for patients served elsewhere.
      if (patient.facilityId && patient.facilityId !== facilityId) {
        throw httpErrors.forbidden('Patient is not registered at this facility');
      }
      const scheme = await db.insuranceScheme.findFirst({ where: { id: schemeId, status: 'ACTIVE' } });
      if (!scheme) throw httpErrors.badRequest('Unknown or inactive scheme');
      // A claim is only valid against an active membership — the insurer
      // would reject it otherwise, so we refuse up front.
      const membership = await db.patientInsurance.findFirst({ where: { patientId, schemeId, status: 'ACTIVE' } });
      if (!membership) throw httpErrors.badRequest('Patient has no active membership with this scheme — enroll or renew first');
      if (!Array.isArray(body.items)) throw httpErrors.badRequest('items must be an array');
      const items = (body.items as unknown[]).map((it, i) => {
        const row = (it ?? {}) as Record<string, unknown>;
        return { description: str(row.description, `items[${i}].description`, { required: true, max: 200 }), amount: num(row.amount, `items[${i}].amount`, { required: true, min: 0 }) ?? 0 };
      });
      if (items.length === 0) throw httpErrors.badRequest('Claim must have at least one item');
      const amount = num(body.amount, 'amount', { required: true, min: 0 }) ?? items.reduce((acc, it) => acc + it.amount, 0);
      const itemSum = Math.round(items.reduce((acc, it) => acc + it.amount, 0) * 100) / 100;
      if (Math.abs(amount - itemSum) > 0.01) throw httpErrors.badRequest('amount must equal the sum of the items');
      const invoiceId = optStr(body.invoiceId);
      if (invoiceId) {
        const invoice = await db.invoice.findFirst({ where: { id: invoiceId, patientId, facilityId } });
        if (!invoice) throw httpErrors.badRequest('Invoice does not belong to this patient and facility');
      }
      const encounterId = optStr(body.encounterId);
      if (encounterId) {
        const encounter = await db.encounter.findFirst({ where: { id: encounterId, patientId } });
        if (!encounter) throw httpErrors.badRequest('Encounter does not belong to this patient');
      }
      // Concurrent submissions could both read the same sequence number — a
      // small retry loop re-allocates on the unique constraint collision.
      let claim: Awaited<ReturnType<typeof db.insuranceClaim.create>> | null = null;
      for (let attempt = 0; attempt < 3 && !claim; attempt++) {
        try {
          claim = await db.insuranceClaim.create({
            data: {
              claimNumber: await nextClaimNumber(db, facilityId),
              patientId,
              schemeId,
              facilityId,
              invoiceId: invoiceId ?? null,
              encounterId: encounterId ?? null,
              serviceDate: body.serviceDate ? (dateIso(body.serviceDate, 'serviceDate') ?? new Date()) : new Date(),
              items: JSON.stringify(items),
              amount,
              status: 'SUBMITTED',
              submittedById: u.id,
            },
            include: CLAIM_INCLUDE,
          });
        } catch (err) {
          if ((err as { code?: string }).code === 'P2002' && attempt < 2) continue;
          throw err;
        }
      }
      if (!claim) throw httpErrors.conflict('Could not allocate a claim number — please retry');
      recordAudit(db, request, {
        action: 'insurance.claim.submit',
        entityType: 'insuranceClaim',
        entityId: claim.id,
        after: { claimNumber: claim.claimNumber, patientId, schemeCode: scheme.code, facilityCode: facility.code, amount },
      });
      return { claim: toClaimPayload(claim) };
    },
  );

  app.put(
    '/insurance/claims/:id/decision',
    { preHandler: guards.requirePermission('process_payment'), schema: { summary: 'Decide a claim (approve / partially approve / reject / pay)', tags: ['insurance'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const claim = await db.insuranceClaim.findFirst({
        where: { id: params.id, ...facilityScope(u) },
        include: { scheme: { select: { code: true } }, facility: { select: { code: true } } },
      });
      if (!claim) throw httpErrors.notFound('Claim not found in scope');
      const status = (optStr(body.status) ?? '').toUpperCase();
      const allowed = CLAIM_TRANSITIONS[claim.status] ?? [];
      if (!allowed.includes(status)) throw httpErrors.badRequest(`Cannot move a ${claim.status} claim to ${status} (allowed: ${allowed.join(', ') || 'none'})`);
      const data: Record<string, unknown> = { status, decidedById: u.id, decidedAt: new Date() };
      if (status === 'APPROVED') data.approvedAmount = claim.amount;
      if (status === 'PARTIALLY_APPROVED') {
        const approved = num(body.approvedAmount, 'approvedAmount', { required: true, min: 0 }) ?? 0;
        if (approved <= 0 || approved >= claim.amount) throw httpErrors.badRequest('approvedAmount must be between 0 and the claim amount');
        data.approvedAmount = Math.round(approved * 100) / 100;
      }
      if (status === 'REJECTED') data.approvedAmount = null;
      data.decisionNote = optStr(body.note) ?? null;
      const updated = await db.insuranceClaim.update({
        where: { id: claim.id },
        data,
        include: CLAIM_INCLUDE,
      });
      recordAudit(db, request, {
        action: 'insurance.claim.decision',
        entityType: 'insuranceClaim',
        entityId: claim.id,
        after: { claimNumber: claim.claimNumber, status, approvedAmount: data.approvedAmount ?? null, facilityCode: claim.facility.code },
      });
      return { claim: toClaimPayload(updated) };
    },
  );

  // =========================================================== summary
  app.get(
    '/insurance/summary',
    { preHandler: guards.requirePermission('view_financial'), schema: { summary: 'Insurance dashboard: coverage + claim pipeline (scoped)', tags: ['insurance'] } },
    async (request) => {
      const u = request.user!;
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const memberWhere = { patient: patientScope(u) };
      const claimWhere = { ...facilityScope(u) } as Record<string, unknown>;
      const [memberships, claims, submittedThisMonth, paidThisMonth] = await Promise.all([
        db.patientInsurance.findMany({
          where: memberWhere,
          select: { id: true, schemeId: true, status: true, verified: true, validTo: true },
        }),
        db.insuranceClaim.findMany({ where: claimWhere, select: { id: true, schemeId: true, status: true, amount: true, approvedAmount: true } }),
        db.insuranceClaim.findMany({ where: { ...claimWhere, createdAt: { gte: monthStart } }, select: { id: true, amount: true, status: true } }),
        db.insuranceClaim.findMany({ where: { ...claimWhere, status: 'PAID', createdAt: { gte: monthStart } }, select: { amount: true, approvedAmount: true } }),
      ]);
      // Only FUTURE validity dates count as "expiring soon" — an expired but
      // still-ACTIVE membership needs renewal, not an expiry warning.
      const activeMemberships = memberships.filter((m) => m.status === 'ACTIVE');
      const expiringSoon = activeMemberships.filter((m) => m.validTo && m.validTo.getTime() > now.getTime() && m.validTo.getTime() - now.getTime() < 30 * 24 * 3600 * 1000).length;
      const pendingClaims = claims.filter((c) => c.status === 'SUBMITTED');
      const decidedPending = claims.filter((c) => c.status === 'APPROVED' || c.status === 'PARTIALLY_APPROVED');
      const byStatus: Record<string, { count: number; amount: number }> = {};
      for (const c of claims) {
        const bucket = byStatus[c.status] ?? { count: 0, amount: 0 };
        bucket.count++;
        // Approved/partial/paid claims roll up the approved figure — the
        // insurer only owes the approved amount, never the billed one.
        bucket.amount += c.approvedAmount ?? c.amount;
        byStatus[c.status] = bucket;
      }
      const byScheme = new Map<string, { schemeId: string; members: number; activeMembers: number; claims: number; claimValue: number }>();
      for (const m of memberships) {
        const entry = byScheme.get(m.schemeId) ?? { schemeId: m.schemeId, members: 0, activeMembers: 0, claims: 0, claimValue: 0 };
        entry.members++;
        if (m.status === 'ACTIVE') entry.activeMembers++;
        byScheme.set(m.schemeId, entry);
      }
      for (const c of claims) {
        const entry = byScheme.get(c.schemeId);
        if (!entry) continue;
        entry.claims++;
        entry.claimValue += c.approvedAmount ?? c.amount;
      }
      const schemeRows = await db.insuranceScheme.findMany({
        where: { id: { in: [...byScheme.keys()] }, status: 'ACTIVE' },
        select: { id: true, code: true, name: true, type: true },
      });
      const schemeById = new Map(schemeRows.map((s) => [s.id, s]));
      const bySchemeList = [...byScheme.values()]
        .map((e) => ({ scheme: schemeById.get(e.schemeId) ?? { id: e.schemeId, code: '?', name: 'Unknown', type: 'OTHER' }, ...e }))
        .sort((a, b) => b.members - a.members);
      return {
        coverage: {
          totalMemberships: memberships.length,
          activeMemberships: activeMemberships.length,
          verified: memberships.filter((m) => m.verified).length,
          expiringSoon,
        },
        claims: {
          pending: { count: pendingClaims.length, amount: pendingClaims.reduce((acc, c) => acc + c.amount, 0) },
          decidedPending: { count: decidedPending.length, amount: decidedPending.reduce((acc, c) => acc + (c.approvedAmount ?? c.amount), 0) },
          submittedThisMonth: { count: submittedThisMonth.length, amount: submittedThisMonth.reduce((acc, c) => acc + c.amount, 0) },
          paidThisMonth: { count: paidThisMonth.length, amount: paidThisMonth.reduce((acc, c) => acc + (c.approvedAmount ?? c.amount), 0) },
          byStatus,
        },
        byScheme: bySchemeList,
      };
    },
  );
}
