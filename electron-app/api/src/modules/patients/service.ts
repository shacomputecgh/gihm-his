import type { Prisma, PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { scoreCandidates, MPI_CONFLICT_THRESHOLD, type MpiInput } from '../../lib/mpi.js';
import type { AuthUser } from '../../types.js';
import { patientScope } from '../../lib/scope.js';
import { publishEvent } from '../webhooks/engine.js';

export interface CreatePatientInput {
  // A captured edge write (docs/16 §5) carries its entity id so the upstream
  // creates the SAME id — references survive every hop of the relay chain.
  id?: string;
  fullName: string;
  dateOfBirth?: Date;
  sex?: string;
  phone?: string;
  email?: string;
  ghanaCard?: string;
  nhisNumber?: string;
  passport?: string;
  bloodGroup?: string;
  genotype?: string;
  allergies?: string[];
  regionId?: string;
  districtId?: string;
  community?: string;
  address?: string;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  emergencyContactPhone?: string;
  consentAccepted?: boolean;
  reminderOptOut?: boolean;
  preferredLanguage?: string;
  facilityId?: string;
  force?: boolean;
  // Admission-form identification (Ghana hospital admission form):
  patientType?: string;
  nationality?: string;
  preferredName?: string;
  countryOfBirth?: string;
  placeOfBirth?: string;
  passportIssueDate?: Date;
  passportExpiryDate?: Date;
  visaPermitType?: string;
  visaPermitNumber?: string;
  visaPermitExpiry?: Date;
  countryOfResidence?: string;
  permanentAddress?: string;
  internationalInsurer?: string;
  internationalPolicyNumber?: string;
  interpreterRequired?: boolean;
  interpreterLanguage?: string;
  preferredContactMethod?: string;
  rhesus?: string;
  nextOfKinRelationship?: string;
  nextOfKinAlternativePhone?: string;
  nextOfKinAddress?: string;
  emergencyContactSameAsNok?: boolean;
  emergencyContactRelationship?: string;
  parentGuardianName?: string;
  parentGuardianRelationship?: string;
  parentGuardianPhone?: string;
  parentGuardianIdNumber?: string;
  parentGuardianAddress?: string;
  employer?: string;
  employerAddress?: string;
  employerPhone?: string;
  school?: string;
  currentMedications?: string;
  previousConditions?: string[];
  previousSurgeries?: string;
  previousAdmissionsText?: string;
}

/** Preferred languages offered for reminder/outreach messaging (docs/23). */
export const REMINDER_LANGUAGES: string[] = ['EN', 'TW', 'FA', 'EE', 'GA', 'HA', 'DA', 'FR'];

export async function nextMrn(db: Prisma.TransactionClient | PrismaClient): Promise<string> {
  // Atomic counter (schema: PatientSequence). The counter row is pre-seeded
  // (db:seed baselines it past the highest seeded MRN), so the hot path is a
  // single read-modify on one row — the SQLite write lock (or the atomic
  // UPDATE on Postgres) serialises concurrent takers, so two requests can
  // never observe the same number. If the row is missing (a database upgraded
  // without re-seeding), the caller's retry loop backs it out with a max-MRN
  // baseline before retrying.
  const row = await db.patientSequence.findUnique({ where: { key: 'patient' } });
  if (!row) throw httpErrors.internalServerError('MRN counter not initialised — run npm run db:seed');
  const next = await db.patientSequence.update({
    where: { id: row.id },
    data: { value: { increment: 1 } },
    select: { value: true },
  });
  return `GH-${String(next.value).padStart(6, '0')}`;
}

/**
 * Backs out the MRN counter from the highest MRN already in the table (for
 * databases that predate the counter and were not re-seeded).
 */
async function ensureCounterRow(db: Prisma.TransactionClient | PrismaClient): Promise<void> {
  const max = await db.patient.findFirst({ orderBy: { mrn: 'desc' }, select: { mrn: true } });
  const high = max ? parseInt(max.mrn.replace(/^GH-0*/, ''), 10) || 0 : 0;
  await db.patientSequence.upsert({
    where: { key: 'patient' },
    create: { key: 'patient', value: Math.max(high + 1, 1) },
    update: { value: Math.max(high + 1, 1) },
  });
}

/** MPI pre-scan: returns candidates above threshold if a likely duplicate exists. */
export async function findMpiCandidates(db: Prisma.TransactionClient | PrismaClient, input: MpiInput) {
  const name = (input.fullName ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (!name) return [];
  const phone = (input.phone ?? '').replace(/\s+/g, '');
  const or: Prisma.PatientWhereInput[] = [
    { fullName: { contains: name } },
  ];
  if (phone) or.push({ phone: { contains: phone } });
  if (input.ghanaCard) or.push({ ghanaCard: input.ghanaCard });
  if (input.nhisNumber) or.push({ nhisNumber: input.nhisNumber });
  if (input.passport) or.push({ passport: input.passport });

  const existing = await db.patient.findMany({
    where: { OR: or },
    take: 50,
    orderBy: { createdAt: 'asc' },
  });
  return scoreCandidates(existing, input);
}

export async function createPatient(db: Prisma.TransactionClient | PrismaClient, input: CreatePatientInput): Promise<{
  patient: Prisma.PatientGetPayload<Record<string, never>>;
  candidates: ReturnType<typeof scoreCandidates>;
  flagged: boolean;
}> {
  const candidates = await findMpiCandidates(db, {
    fullName: input.fullName,
    dateOfBirth: input.dateOfBirth,
    phone: input.phone,
    ghanaCard: input.ghanaCard,
    nhisNumber: input.nhisNumber,
    passport: input.passport,
    sex: input.sex,
  });
  const top = candidates[0];
  if (top && top.score >= MPI_CONFLICT_THRESHOLD && !input.force) {
    return { patient: null as never, candidates, flagged: true };
  }

  // MRN allocation is read-then-insert, so under concurrent registration two
  // requests can pick the same candidate (load tests caught this: P2002 /
  // "Could not allocate a medical record number" under parallel creates). The
  // alloc + create must retry together — a fresh MRN per attempt — until a
  // free MRN is actually inserted.
  const patient = await createWithRetry(db, input);
  if (input.ghanaCard) {
    await db.patientIdentifier.create({ data: { patientId: patient.id, type: 'GHANA_CARD', value: input.ghanaCard, verified: true } });
  }
  if (input.nhisNumber) {
    await db.patientIdentifier.create({ data: { patientId: patient.id, type: 'NHIS', value: input.nhisNumber, verified: true } });
  }
  // Platform event webhook (docs/22 Phase 7) — a new patient registration is
  // the highest-value subscription event. The delivery row is written with the
  // registration (durable) but a subscriber outage never fails the write.
  await publishEvent(db, 'patient.created', { patientId: patient.id, mrn: patient.mrn, fullName: patient.fullName }).catch(() => undefined);
  return { patient, candidates, flagged: false };
}

/**
 * Allocates an MRN and inserts the patient in one retrying unit. The MRN
 * allocator is read-then-insert, so concurrent registrations can collide on a
 * candidate — each P2002 race re-allocates a fresh MRN (the count has moved
 * on once the winner committed) and retries instead of surfacing a 500. Any
 * non-constraint error (e.g. an input validation failure) propagates as-is.
 */
async function createWithRetry(db: Prisma.TransactionClient | PrismaClient, input: CreatePatientInput): Promise<Prisma.PatientGetPayload<Record<string, never>>> {
  for (let attempt = 0; attempt < 8; attempt++) {
    let mrn: string;
    try {
      mrn = await nextMrn(db);
    } catch (err) {
      // Database predates the counter and was never re-seeded — back the
      // counter out from the highest existing MRN and retry.
      if (err instanceof Error && err.message.includes('not initialised')) {
        await ensureCounterRow(db);
        mrn = await nextMrn(db);
      } else {
        throw err;
      }
    }
    try {
      return await db.patient.create({
        data: {
          id: input.id ?? undefined,
          mrn,
          fullName: input.fullName,
          dateOfBirth: input.dateOfBirth,
          sex: input.sex,
          phone: input.phone,
          email: input.email,
          ghanaCard: input.ghanaCard,
          nhisNumber: input.nhisNumber,
          passport: input.passport,
          bloodGroup: input.bloodGroup,
          genotype: input.genotype,
          allergies: JSON.stringify(input.allergies ?? []),
          regionId: input.regionId ?? undefined,
          districtId: input.districtId ?? undefined,
          community: input.community,
          address: input.address,
          nextOfKinName: input.nextOfKinName,
          nextOfKinPhone: input.nextOfKinPhone,
          emergencyContactPhone: input.emergencyContactPhone,
          consentAccepted: input.consentAccepted ?? false,
          consentRecordedAt: input.consentAccepted ? new Date() : undefined,
          reminderOptOut: input.reminderOptOut ?? false,
          preferredLanguage: (REMINDER_LANGUAGES.includes((input.preferredLanguage ?? 'EN').toUpperCase()) ? (input.preferredLanguage ?? 'EN').toUpperCase() : 'EN'),
          facilityId: input.facilityId ?? undefined,
          isSynthetic: true,
          // Admission-form identification fields (docs: hospital admission form):
          patientType: input.patientType ?? 'GHANAIAN',
          nationality: input.nationality ?? 'Ghanaian',
          preferredName: input.preferredName,
          countryOfBirth: input.countryOfBirth,
          placeOfBirth: input.placeOfBirth,
          passportIssueDate: input.passportIssueDate,
          passportExpiryDate: input.passportExpiryDate,
          visaPermitType: input.visaPermitType,
          visaPermitNumber: input.visaPermitNumber,
          visaPermitExpiry: input.visaPermitExpiry,
          countryOfResidence: input.countryOfResidence,
          permanentAddress: input.permanentAddress,
          internationalInsurer: input.internationalInsurer,
          internationalPolicyNumber: input.internationalPolicyNumber,
          interpreterRequired: input.interpreterRequired ?? false,
          interpreterLanguage: input.interpreterLanguage,
          preferredContactMethod: input.preferredContactMethod,
          rhesus: input.rhesus,
          nextOfKinRelationship: input.nextOfKinRelationship,
          nextOfKinAlternativePhone: input.nextOfKinAlternativePhone,
          nextOfKinAddress: input.nextOfKinAddress,
          emergencyContactSameAsNok: input.emergencyContactSameAsNok ?? true,
          emergencyContactRelationship: input.emergencyContactRelationship,
          parentGuardianName: input.parentGuardianName,
          parentGuardianRelationship: input.parentGuardianRelationship,
          parentGuardianPhone: input.parentGuardianPhone,
          parentGuardianIdNumber: input.parentGuardianIdNumber,
          parentGuardianAddress: input.parentGuardianAddress,
          employer: input.employer,
          employerAddress: input.employerAddress,
          employerPhone: input.employerPhone,
          school: input.school,
          currentMedications: input.currentMedications,
          previousConditions: JSON.stringify(input.previousConditions ?? []),
          previousSurgeries: input.previousSurgeries,
          previousAdmissionsText: input.previousAdmissionsText,
        },
      });
    } catch (err) {
      // A unique-constraint race on the freshly allocated MRN (or on a
      // business identifier another request just inserted) — re-allocate and
      // retry. Any other error propagates.
      const raced = err instanceof Error && 'code' in err && (err as { code?: string }).code === 'P2002';
      if (!raced) throw err;
    }
  }
  throw httpErrors.internalServerError('Could not allocate a medical record number');
}

export async function assertPatientAccess(db: Prisma.TransactionClient | PrismaClient, u: AuthUser, patientId: string) {
  const patient = await db.patient.findUnique({ where: { id: patientId } });
  if (!patient) throw httpErrors.notFound('Patient not found');

  if (u.scope === 'NATIONAL') return patient;
  if (u.scope === 'REGIONAL' && !!u.regionId && patient.regionId === u.regionId) return patient;
  if (u.scope === 'DISTRICT' && !!u.districtId && patient.districtId === u.districtId) return patient;
  if (u.scope === 'FACILITY' && !!u.facilityId && patient.facilityId === u.facilityId) return patient;
  if (u.scope === 'PATIENT') {
    const linked = await db.patient.findFirst({ where: { id: patientId, user: { id: u.id } } });
    if (linked) return patient;
  }
  throw httpErrors.forbidden('No access to this patient record');
}

export function patientListScope(u: AuthUser): Prisma.PatientWhereInput {
  return patientScope(u);
}
