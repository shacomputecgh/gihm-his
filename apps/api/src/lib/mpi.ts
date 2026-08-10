import type { Patient } from '@prisma/client';

export interface MpiCandidate {
  patientId: string;
  mrn: string;
  fullName: string;
  dateOfBirth: string | null;
  phone: string | null;
  sex: string | null;
  district: string | null;
  score: number;
  matchedOn: string[];
}

function norm(s: string | null | undefined): string {
  return (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface MpiInput {
  fullName: string;
  dateOfBirth?: Date | null;
  phone?: string | null;
  ghanaCard?: string | null;
  nhisNumber?: string | null;
  sex?: string | null;
}

/** Returns candidate duplicates ranked by confidence (never auto-merges). */
export function scoreCandidates(existing: Patient[], input: MpiInput): MpiCandidate[] {
  const name = norm(input.fullName);
  const dobKey = input.dateOfBirth ? input.dateOfBirth.toISOString().slice(0, 10) : null;
  const phone = norm(input.phone);
  const card = norm(input.ghanaCard);
  const nhis = norm(input.nhisNumber);
  const sex = input.sex?.toUpperCase();

  const out: MpiCandidate[] = [];
  for (const p of existing) {
    const pName = norm(p.fullName);
    const pDob = p.dateOfBirth ? p.dateOfBirth.toISOString().slice(0, 10) : null;
    const pPhone = norm(p.phone);
    const pCard = norm(p.ghanaCard);
    const pNhis = norm(p.nhisNumber);
    const matchedOn: string[] = [];
    let score = 0;

    if (name && name === pName) matchedOn.push('name');
    if (dobKey && pDob && dobKey === pDob) matchedOn.push('date_of_birth');
    if (phone && pPhone && phone === pPhone) matchedOn.push('phone');
    if (card && pCard && card === pCard) matchedOn.push('ghana_card');
    if (nhis && pNhis && nhis === pNhis) matchedOn.push('nhis');
    if (sex && p.sex && sex === p.sex.toUpperCase()) matchedOn.push('sex');

    if (matchedOn.includes('ghana_card') || matchedOn.includes('nhis')) score = 100;
    else if (matchedOn.includes('name') && matchedOn.includes('date_of_birth')) score = 95;
    else if (matchedOn.includes('name') && matchedOn.includes('phone')) score = 85;
    else if (matchedOn.includes('name') && matchedOn.includes('date_of_birth')) score = 95;
    else if (matchedOn.includes('name')) score = 50;
    else if (matchedOn.includes('phone') && matchedOn.includes('date_of_birth')) score = 60;

    if (score > 0 && matchedOn.length > 0) {
      out.push({
        patientId: p.id,
        mrn: p.mrn,
        fullName: p.fullName,
        dateOfBirth: pDob,
        phone: p.phone,
        sex: p.sex,
        district: null,
        score,
        matchedOn,
      });
    }
  }
  return out.sort((a, b) => b.score - a.score);
}

export const MPI_CONFLICT_THRESHOLD = 80;
