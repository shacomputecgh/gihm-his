import type { FastifyInstance, FastifyReply } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { str, optStr, num, dateIso, parseJsonArr } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import { facilityScope } from '../../lib/scope.js';
import { parsePage, pageEnvelope } from '../../lib/pagination.js';
import { createPatient, assertPatientAccess } from '../patients/service.js';
import { dispatchSms, normalizeE164 } from '../../lib/sms.js';
import type { Guards } from '../../lib/guards.js';

/**
 * Hospital admissions (Ghana hospital admission form) — the digital intake
 * for inpatients covering Ghanaian citizens, foreign nationals, refugees and
 * minors with dynamic identification, plus an emergency mode that admits a
 * patient whose identity is not yet known and completes identification later.
 *
 * A single POST /admissions call either:
 *   * admits an EXISTING patient (patientId) — with patient-scope enforcement,
 *   * registers a NEW patient inline (patient.{...}) — reusing the Master
 *     Patient Index so a repeat registration surfaces as a 409 for review, or
 *   * admits in EMERGENCY mode (emergency: true) — creating a minimal
 *     "identification pending" record so care starts immediately.
 *
 * Every admission carries a per-facility admission number (ADM-2026-0001),
 * the admitting vitals, consent, insurance/payment and a transfer history.
 * An SMS confirmation is dispatched to the patient's phone (best-effort —
 * the gateway provider is only contacted when configured).
 */

const PATIENT_TYPES = ['GHANAIAN', 'FOREIGN', 'REFUGEE', 'OTHER'];
const ADMISSION_TYPES = ['EMERGENCY', 'OPD_TO_IPD', 'ELECTIVE', 'REFERRAL', 'MATERNITY', 'SURGICAL', 'MEDICAL', 'OTHER'];
const SOURCES = ['HOME', 'EMERGENCY_DEPT', 'CLINIC', 'HOSPITAL', 'AMBULANCE', 'OTHER'];
const PAYMENT_METHODS = ['NHIS', 'PRIVATE_INSURANCE', 'CORPORATE', 'CASH', 'MOMO', 'BANK_CARD', 'SPONSOR', 'OTHER'];
const VISA_TYPES = ['TOURIST', 'STUDENT', 'WORK', 'RESIDENCE', 'DIPLOMATIC', 'OTHER'];
const STATUSES = ['ADMITTED', 'TRANSFERRED', 'DISCHARGED'];
const VITALS_KEYS = ['temperature', 'pulse', 'respiratoryRate', 'systolicBp', 'diastolicBp', 'spo2', 'weightKg', 'heightCm'] as const;
// Clinical sanity ranges per vital sign — a value outside these is a data-entry
// error, not a real patient.
const VITALS_RANGE: Record<string, { min: number; max: number }> = {
  temperature: { min: 30, max: 45 },
  pulse: { min: 20, max: 250 },
  respiratoryRate: { min: 4, max: 80 },
  systolicBp: { min: 20, max: 300 },
  diastolicBp: { min: 20, max: 200 },
  spo2: { min: 50, max: 100 },
  weightKg: { min: 0, max: 400 },
  heightCm: { min: 20, max: 250 },
};

const ADMISSION_INCLUDE = {
  patient: { select: { id: true, fullName: true, mrn: true, phone: true, patientType: true, sex: true, dateOfBirth: true, ghanaCard: true, nhisNumber: true, passport: true } },
  facility: { select: { id: true, code: true, name: true } },
  consultant: { select: { id: true, fullName: true } },
  attending: { select: { id: true, fullName: true } },
} as const;

type AdmissionRow = {
  id: string;
  patientId: string;
  facilityId: string | null;
  admissionNumber: string | null;
  admissionType: string | null;
  source: string | null;
  referringFacility: string | null;
  referringDoctor: string | null;
  chiefComplaint: string | null;
  provisionalDiagnosis: string | null;
  reason: string | null;
  identificationPending: boolean;
  ward: string | null;
  bed: string | null;
  nurseReceiving: string | null;
  admissionVitals: string | null;
  paymentMethod: string | null;
  billingAccount: string | null;
  insurerName: string | null;
  policyNumber: string | null;
  authorizationNumber: string | null;
  pregnant: boolean | null;
  edd: Date | null;
  gravida: number | null;
  parity: number | null;
  lmp: Date | null;
  consentSigned: boolean;
  consentSignedAt: Date | null;
  status: string;
  admittedAt: Date;
  dischargedAt: Date | null;
  dischargeSummary: string | null;
  dischargeNote: string | null;
  transferNote: string | null;
  transferredAt: Date | null;
  transferHistory: string;
  createdAt: Date;
  patient?: { id: string; fullName: string; mrn: string; phone: string | null; patientType: string; sex: string | null; dateOfBirth: Date | null; ghanaCard: string | null; nhisNumber: string | null; passport: string | null } | null;
  facility?: { id: string; code: string; name: string } | null;
  consultant?: { id: string; fullName: string } | null;
  attending?: { id: string; fullName: string } | null;
};

function toAdmissionPayload(a: AdmissionRow) {
  // Vitals are stored as a JSON object — parse it directly (parseJsonArr is
  // for array-shaped columns and would return [] here).
  let vitals: Record<string, number | null> = {};
  if (a.admissionVitals) {
    try {
      const v = JSON.parse(a.admissionVitals) as Record<string, number | null>;
      if (v && typeof v === 'object' && !Array.isArray(v)) vitals = v;
    } catch {
      vitals = {};
    }
  }
  return {
    id: a.id,
    admissionNumber: a.admissionNumber,
    patient: a.patient ?? null,
    facility: a.facility ?? null,
    admissionType: a.admissionType,
    source: a.source,
    referringFacility: a.referringFacility,
    referringDoctor: a.referringDoctor,
    chiefComplaint: a.chiefComplaint,
    provisionalDiagnosis: a.provisionalDiagnosis,
    reason: a.reason,
    identificationPending: a.identificationPending,
    ward: a.ward,
    bed: a.bed,
    nurseReceiving: a.nurseReceiving,
    vitals,
    paymentMethod: a.paymentMethod,
    billingAccount: a.billingAccount,
    insurerName: a.insurerName,
    policyNumber: a.policyNumber,
    authorizationNumber: a.authorizationNumber,
    maternity: { pregnant: a.pregnant, edd: a.edd, gravida: a.gravida, parity: a.parity, lmp: a.lmp },
    consentSigned: a.consentSigned,
    consentSignedAt: a.consentSignedAt,
    status: a.status,
    admittedAt: a.admittedAt,
    dischargedAt: a.dischargedAt,
    dischargeSummary: a.dischargeSummary,
    dischargeNote: a.dischargeNote,
    transferNote: a.transferNote,
    transferredAt: a.transferredAt,
    transferHistory: parseJsonArr<Record<string, unknown>>(a.transferHistory),
    consultant: a.consultant ?? null,
    attending: a.attending ?? null,
    createdAt: a.createdAt,
  };
}

/** Next per-facility admission number for the current year: ADM-2026-0001… */
async function nextAdmissionNumber(db: PrismaClient, facilityId: string): Promise<string> {
  const prefix = `ADM-${new Date().getFullYear()}-`;
  const count = await db.admission.count({ where: { facilityId, admissionNumber: { startsWith: prefix } } });
  return `${prefix}${String(count + 1).padStart(4, '0')}`;
}

/** Throws unless the caller may admit at the given facility. */
function assertFacilityScope(u: { scope: string; regionId?: string | null; districtId?: string | null; facilityId?: string | null }, facility: { id: string; regionId: string; districtId: string }): void {
  if (u.scope === 'FACILITY' && u.facilityId !== facility.id) throw httpErrors.forbidden('You can only admit patients at your own facility');
  if (u.scope === 'REGIONAL' && u.regionId !== facility.regionId) throw httpErrors.forbidden('You can only admit patients at facilities in your region');
  if (u.scope === 'DISTRICT' && u.districtId !== facility.districtId) throw httpErrors.forbidden('You can only admit patients at facilities in your district');
}

function loadAdmission(db: PrismaClient, id: string, scope: Record<string, unknown>) {
  return db.admission.findFirst({ where: { id, ...scope }, include: ADMISSION_INCLUDE });
}

export function registerAdmissionRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  // ============================================================ register
  app.get(
    '/admissions',
    { preHandler: guards.requirePermission('view_clinical_record', 'view_patient'), schema: { summary: 'Admission register (scoped, filterable, paginated)', tags: ['admissions'] } },
    async (request) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const where: Record<string, unknown> = { ...facilityScope(u) };
      const status = optStr(q.status)?.toUpperCase();
      if (status) {
        if (!STATUSES.includes(status)) throw httpErrors.badRequest(`Admission status must be one of: ${STATUSES.join(', ')}`);
        where.status = status;
      }
      const type = optStr(q.type)?.toUpperCase();
      if (type) {
        if (!ADMISSION_TYPES.includes(type)) throw httpErrors.badRequest(`Admission type must be one of: ${ADMISSION_TYPES.join(', ')}`);
        where.admissionType = type;
      }
      const ward = optStr(q.ward);
      if (ward) where.ward = { contains: ward };
      // The facilityId filter must never widen the caller's scope.
      const facilityId = optStr(q.facilityId);
      if (facilityId) {
        const requested = await db.facility.findUnique({ where: { id: facilityId } });
        if (!requested) throw httpErrors.notFound('Facility not found');
        assertFacilityScope(u, requested);
        where.facilityId = facilityId;
      }
      const from = optStr(q.from);
      if (from) {
        const parsed = dateIso(from, 'from');
        if (!parsed) throw httpErrors.badRequest('from must be a valid date (YYYY-MM-DD)');
        where.admittedAt = { ...(where.admittedAt as object ?? {}), gte: parsed };
      }
      const to = optStr(q.to);
      if (to) {
        const parsed = dateIso(to, 'to');
        if (!parsed) throw httpErrors.badRequest('to must be a valid date (YYYY-MM-DD)');
        parsed.setHours(23, 59, 59, 999);
        where.admittedAt = { ...(where.admittedAt as object ?? {}), lte: parsed };
      }
      const search = optStr(q.q);
      if (search) {
        where.OR = [
          { admissionNumber: { contains: search } },
          { patient: { is: { fullName: { contains: search } } } },
          { patient: { is: { mrn: { contains: search } } } },
          { chiefComplaint: { contains: search } },
        ];
      }
      const page = parsePage(q);
      const [rows, total, byStatusRows] = await Promise.all([
        db.admission.findMany({ where, include: ADMISSION_INCLUDE, orderBy: { admittedAt: 'desc' }, skip: page.skip, take: page.take }),
        db.admission.count({ where }),
        db.admission.groupBy({ by: ['status'], where, _count: { _all: true } }),
      ]);
      const byStatus = Object.fromEntries(byStatusRows.map((r) => [r.status, r._count._all]));
      return { ...pageEnvelope(rows.map(toAdmissionPayload), total, page), summary: { byStatus, active: byStatus.ADMITTED ?? 0 } };
    },
  );

  // ============================================================== detail
  app.get(
    '/admissions/:id',
    { preHandler: guards.requirePermission('view_clinical_record', 'view_patient'), schema: { summary: 'Admission detail with vitals and transfer history', tags: ['admissions'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const admission = await loadAdmission(db, params.id, facilityScope(u));
      if (!admission) throw httpErrors.notFound('Admission not found in scope');
      return { admission: toAdmissionPayload(admission) };
    },
  );

  // =============================================================== admit
  app.post(
    '/admissions',
    { preHandler: guards.requirePermission('write_clinical_note'), schema: { summary: 'Admit a patient (existing, new registration, or emergency identification-pending)', tags: ['admissions'] } },
    async (request, reply: FastifyReply) => {
      const u = request.user!;
      const body = (request.body ?? {}) as Record<string, unknown>;
      const facilityId = str(body.facilityId, 'facilityId', { required: true });
      const facility = await db.facility.findUnique({ where: { id: facilityId } });
      if (!facility) throw httpErrors.notFound('Facility not found');
      assertFacilityScope(u, facility);

      const emergency = Boolean(body.emergency);
      const patientId = optStr(body.patientId);
      const p = (body.patient ?? {}) as Record<string, unknown>;
      let patient: { id: string; fullName: string; mrn: string; phone: string | null };

      if (patientId) {
        const existing = await db.patient.findUnique({ where: { id: patientId } });
        if (!existing) throw httpErrors.notFound('Patient not found');
        // Patient-scope enforcement: a facility user cannot admit a patient
        // registered at another facility (same discipline as insurance).
        await assertPatientAccess(db, u, patientId);
        patient = { id: existing.id, fullName: existing.fullName, mrn: existing.mrn, phone: existing.phone };
      } else {
        const fullName = emergency
          ? (optStr(p.fullName) ?? 'Emergency Admission — Identification Pending')
          : str(p.fullName, 'patient.fullName', { required: true, max: 190 });
        const patientType = (optStr(p.patientType) ?? (emergency ? 'OTHER' : 'GHANAIAN')).toUpperCase();
        if (!PATIENT_TYPES.includes(patientType)) throw httpErrors.badRequest(`patientType must be one of: ${PATIENT_TYPES.join(', ')}`);
        const dateIsoField = (key: string): Date | undefined => (p[key] === undefined ? undefined : (dateIso(p[key], key) ?? undefined));
        const created = await createPatient(db, {
          fullName,
          dateOfBirth: dateIsoField('dateOfBirth'),
          sex: optStr(p.sex)?.toUpperCase(),
          phone: optStr(p.phone),
          email: optStr(p.email),
          ghanaCard: optStr(p.ghanaCard),
          nhisNumber: optStr(p.nhisNumber),
          passport: optStr(p.passport),
          bloodGroup: optStr(p.bloodGroup),
          allergies: Array.isArray(p.allergies) ? (p.allergies as unknown[]).map(String) : [],
          regionId: optStr(p.regionId),
          districtId: optStr(p.districtId),
          community: optStr(p.community),
          address: optStr(p.address),
          nextOfKinName: optStr(p.nextOfKinName),
          nextOfKinPhone: optStr(p.nextOfKinPhone),
          emergencyContactPhone: optStr(p.emergencyContactPhone),
          consentAccepted: Boolean(p.consentAccepted),
          preferredLanguage: optStr(p.preferredLanguage)?.toUpperCase() ?? 'EN',
          facilityId,
          // Admission-form identification:
          patientType,
          preferredName: optStr(p.preferredName),
          countryOfBirth: optStr(p.countryOfBirth),
          placeOfBirth: optStr(p.placeOfBirth),
          passportIssueDate: dateIsoField('passportIssueDate'),
          passportExpiryDate: dateIsoField('passportExpiryDate'),
          visaPermitType: optStr(p.visaPermitType)?.toUpperCase(),
          visaPermitNumber: optStr(p.visaPermitNumber),
          visaPermitExpiry: dateIsoField('visaPermitExpiry'),
          countryOfResidence: optStr(p.countryOfResidence),
          permanentAddress: optStr(p.permanentAddress),
          internationalInsurer: optStr(p.internationalInsurer),
          internationalPolicyNumber: optStr(p.internationalPolicyNumber),
          interpreterRequired: Boolean(p.interpreterRequired),
          interpreterLanguage: optStr(p.interpreterLanguage),
          preferredContactMethod: optStr(p.preferredContactMethod)?.toUpperCase(),
          rhesus: optStr(p.rhesus)?.toUpperCase(),
          nextOfKinRelationship: optStr(p.nextOfKinRelationship),
          nextOfKinAlternativePhone: optStr(p.nextOfKinAlternativePhone),
          nextOfKinAddress: optStr(p.nextOfKinAddress),
          emergencyContactSameAsNok: p.emergencyContactSameAsNok === undefined ? true : Boolean(p.emergencyContactSameAsNok),
          emergencyContactRelationship: optStr(p.emergencyContactRelationship),
          parentGuardianName: optStr(p.parentGuardianName),
          parentGuardianRelationship: optStr(p.parentGuardianRelationship),
          parentGuardianPhone: optStr(p.parentGuardianPhone),
          parentGuardianIdNumber: optStr(p.parentGuardianIdNumber),
          parentGuardianAddress: optStr(p.parentGuardianAddress),
          employer: optStr(p.employer),
          employerAddress: optStr(p.employerAddress),
          employerPhone: optStr(p.employerPhone),
          school: optStr(p.school),
          currentMedications: optStr(p.currentMedications),
          previousConditions: Array.isArray(p.previousConditions) ? (p.previousConditions as unknown[]).map(String) : [],
          previousSurgeries: optStr(p.previousSurgeries),
          previousAdmissionsText: optStr(p.previousAdmissionsText),
          // Emergency admissions bypass the MPI duplicate check by design — the
          // identity is explicitly unknown, and emergency care must never be
          // blocked waiting for identification (completed later on the record).
          force: emergency || Boolean(p.force),
        });
        // Never silently merge records — surface candidates for review (spec §12).
        if (created.flagged) {
          return reply.status(409).send({
            error: { code: 'MPI_DUPLICATE', message: 'Possible duplicate patient record(s) found — review before admitting.', candidates: created.candidates },
          });
        }
        patient = { id: created.patient.id, fullName: created.patient.fullName, mrn: created.patient.mrn, phone: created.patient.phone };
      }

      const a = (body.admission ?? {}) as Record<string, unknown>;
      const admissionType = optStr(a.type)?.toUpperCase();
      if (admissionType !== undefined && !ADMISSION_TYPES.includes(admissionType)) throw httpErrors.badRequest(`Admission type must be one of: ${ADMISSION_TYPES.join(', ')}`);
      const source = optStr(a.source)?.toUpperCase();
      if (source !== undefined && !SOURCES.includes(source)) throw httpErrors.badRequest(`Source must be one of: ${SOURCES.join(', ')}`);
      const paymentMethod = optStr(a.paymentMethod)?.toUpperCase();
      if (paymentMethod !== undefined && !PAYMENT_METHODS.includes(paymentMethod)) throw httpErrors.badRequest(`Payment method must be one of: ${PAYMENT_METHODS.join(', ')}`);
      const consultantId = optStr(a.consultantId);
      if (consultantId) {
        const consultant = await db.user.findFirst({ where: { id: consultantId, status: 'ACTIVE' } });
        if (!consultant) throw httpErrors.badRequest('Consultant not found or inactive');
      }
      const attendingId = optStr(a.attendingDoctorId);
      if (attendingId) {
        const attending = await db.user.findFirst({ where: { id: attendingId, status: 'ACTIVE' } });
        if (!attending) throw httpErrors.badRequest('Attending doctor not found or inactive');
      }
      // Vitals validated as a JSON blob of numeric readings.
      const v = (body.vitals ?? {}) as Record<string, unknown>;
      const vitals: Record<string, number | null> = {};
      for (const key of VITALS_KEYS) {
        if (v[key] === undefined || v[key] === null || v[key] === '') {
          vitals[key] = null;
          continue;
        }
        const value = num(v[key], `vitals.${key}`);
        if (value === undefined) throw httpErrors.badRequest(`vitals.${key} must be a number`);
        const range = VITALS_RANGE[key] ?? { min: 0, max: 500 };
        if (value < range.min || value > range.max) throw httpErrors.badRequest(`vitals.${key} must be between ${range.min} and ${range.max}`);
        vitals[key] = Math.round(value * 100) / 100;
      }
      const dateField = (key: string): Date | undefined => (a[key] === undefined ? undefined : (dateIso(a[key], key) ?? undefined));
      const intField = (key: string, label: string): number | undefined => {
        if (a[key] === undefined || a[key] === null || a[key] === '') return undefined;
        const value = Math.floor(num(a[key], label) ?? 0);
        if (value < 0) throw httpErrors.badRequest(`${label} must be zero or more`);
        return value;
      };
      const gravida = intField('gravida', 'gravida');
      const parity = intField('parity', 'parity');

      // Concurrent submissions could both read the same sequence number — a
      // small retry loop re-allocates on the unique constraint collision.
      let admission: Awaited<ReturnType<typeof db.admission.create>> | null = null;
      for (let attempt = 0; attempt < 3 && !admission; attempt++) {
        try {
          admission = await db.admission.create({
            data: {
              patientId: patient.id,
              facilityId,
              admissionNumber: await nextAdmissionNumber(db, facilityId),
              admissionType: admissionType ?? null,
              source: source ?? null,
              referringFacility: optStr(a.referringFacility),
              referringDoctor: optStr(a.referringDoctor),
              chiefComplaint: optStr(a.chiefComplaint),
              provisionalDiagnosis: optStr(a.provisionalDiagnosis),
              reason: optStr(a.reason),
              identificationPending: emergency,
              ward: optStr(a.ward),
              bed: optStr(a.bed),
              consultantId: consultantId ?? null,
              attendingDoctorId: attendingId ?? null,
              nurseReceiving: optStr(a.nurseReceiving),
              admissionVitals: JSON.stringify(vitals),
              paymentMethod: paymentMethod ?? null,
              billingAccount: optStr(a.billingAccount),
              insurerName: optStr(a.insurerName),
              policyNumber: optStr(a.policyNumber),
              authorizationNumber: optStr(a.authorizationNumber),
              pregnant: a.pregnant === undefined ? null : Boolean(a.pregnant),
              edd: dateField('edd'),
              gravida,
              parity,
              lmp: dateField('lmp'),
              consentSigned: Boolean(body.consentSigned),
              consentSignedAt: body.consentSigned ? new Date() : null,
              admittedAt: dateField('admittedAt') ?? new Date(),
              status: 'ADMITTED',
            },
            include: ADMISSION_INCLUDE,
          });
        } catch (err) {
          if ((err as { code?: string }).code === 'P2002' && attempt < 2) continue;
          throw err;
        }
      }
      if (!admission) throw httpErrors.conflict('Could not allocate an admission number — please retry');

      recordAudit(db, request, {
        action: 'admission.create',
        entityType: 'admission',
        entityId: admission.id,
        after: { admissionNumber: admission.admissionNumber, patientId: patient.id, patientType: emergency ? 'EMERGENCY_PENDING_ID' : undefined, admissionType: admission.admissionType, facilityCode: facility.code, emergency },
      });

      // SMS confirmation — best-effort, never blocks the admission response.
      // Only fires when an SMS gateway is configured (docs/08); otherwise the
      // result is recorded but the admission still succeeds.
      const smsTo = normalizeE164(optStr(body.notifyPhone) ?? patient.phone ?? '');
      if (smsTo) {
        const message = emergency
          ? `GIHM-HIS: Emergency admission ${admission.admissionNumber ?? ''} opened for ${patient.fullName}. Please visit admissions to complete identification.`
          : `GIHM-HIS: ${patient.fullName}, admission confirmed — ${admission.admissionNumber ?? ''} (${admission.admissionType ?? 'inpatient'}). Ward: ${admission.ward ?? 'TBA'}, Bed: ${admission.bed ?? 'TBA'}.`;
        dispatchSms({ to: smsTo, message })
          .then((result) => {
            recordAudit(db, request, {
              action: 'admission.sms',
              entityType: 'admission',
              entityId: admission!.id,
              after: { to: smsTo, provider: result.provider, dispatched: result.dispatched, messageId: result.messageId, note: result.note },
            });
          })
          .catch(() => undefined);
      }
      return { admission: toAdmissionPayload(admission) };
    },
  );

  // =========================================================== discharge
  app.post(
    '/admissions/:id/discharge',
    { preHandler: guards.requirePermission('write_clinical_note'), schema: { summary: 'Discharge an admitted patient (summary required)', tags: ['admissions'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const admission = await loadAdmission(db, params.id, facilityScope(u));
      if (!admission) throw httpErrors.notFound('Admission not found in scope');
      if (admission.status === 'DISCHARGED') throw httpErrors.conflict('Admission is already discharged');
      const summary = str(body.summary, 'summary', { required: true, max: 4000 }).trim();
      if (summary.length < 10) throw httpErrors.badRequest('Discharge summary is too short');
      const updated = await db.admission.update({
        where: { id: admission.id },
        data: { status: 'DISCHARGED', dischargedAt: new Date(), dischargeSummary: summary, dischargeNote: optStr(body.note) ?? null },
        include: ADMISSION_INCLUDE,
      });
      recordAudit(db, request, { action: 'admission.discharge', entityType: 'admission', entityId: admission.id, after: { admissionNumber: admission.admissionNumber } });
      return { admission: toAdmissionPayload(updated) };
    },
  );

  // ============================================================ transfer
  app.post(
    '/admissions/:id/transfer',
    { preHandler: guards.requirePermission('write_clinical_note'), schema: { summary: 'Transfer an admitted patient to another ward/bed', tags: ['admissions'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const admission = await loadAdmission(db, params.id, facilityScope(u));
      if (!admission) throw httpErrors.notFound('Admission not found in scope');
      if (admission.status !== 'ADMITTED') throw httpErrors.badRequest('Only admitted patients can be transferred');
      const ward = optStr(body.ward);
      const bed = optStr(body.bed);
      if (!ward && !bed) throw httpErrors.badRequest('Provide the destination ward and/or bed');
      const history = parseJsonArr<Record<string, unknown>>(admission.transferHistory);
      history.push({
        fromWard: admission.ward,
        fromBed: admission.bed,
        toWard: ward ?? admission.ward,
        toBed: bed ?? admission.bed,
        note: optStr(body.note) ?? null,
        at: new Date().toISOString(),
        by: u.id,
      });
      const updated = await db.admission.update({
        where: { id: admission.id },
        data: { ward: ward ?? admission.ward, bed: bed ?? admission.bed, transferNote: optStr(body.note) ?? null, transferredAt: new Date(), transferHistory: JSON.stringify(history) },
        include: ADMISSION_INCLUDE,
      });
      recordAudit(db, request, { action: 'admission.transfer', entityType: 'admission', entityId: admission.id, after: { admissionNumber: admission.admissionNumber, fromWard: admission.ward, toWard: ward ?? admission.ward } });
      return { admission: toAdmissionPayload(updated) };
    },
  );
}
