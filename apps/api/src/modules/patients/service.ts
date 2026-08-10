import type { Prisma, PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { scoreCandidates, MPI_CONFLICT_THRESHOLD, type MpiInput } from '../../lib/mpi.js';
import type { AuthUser } from '../../types.js';
import { patientScope } from '../../lib/scope.js';

export interface CreatePatientInput {
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
  facilityId?: string;
  force?: boolean;
}

export async function nextMrn(db: Prisma.TransactionClient | PrismaClient): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const count = await db.patient.count();
    const candidate = `GH-${String(count + 1 + Math.floor(Math.random() * 90)).padStart(6, '0')}`;
    const exists = await db.patient.findUnique({ where: { mrn: candidate } });
    if (!exists) return candidate;
  }
  throw httpErrors.internalServerError('Could not allocate a medical record number');
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
    sex: input.sex,
  });
  const top = candidates[0];
  if (top && top.score >= MPI_CONFLICT_THRESHOLD && !input.force) {
    return { patient: null as never, candidates, flagged: true };
  }

  const mrn = await nextMrn(db);
  const patient = await db.patient.create({
    data: {
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
      facilityId: input.facilityId ?? undefined,
      isSynthetic: true,
    },
  });
  if (input.ghanaCard) {
    await db.patientIdentifier.create({ data: { patientId: patient.id, type: 'GHANA_CARD', value: input.ghanaCard, verified: true } });
  }
  if (input.nhisNumber) {
    await db.patientIdentifier.create({ data: { patientId: patient.id, type: 'NHIS', value: input.nhisNumber, verified: true } });
  }
  return { patient, candidates, flagged: false };
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
