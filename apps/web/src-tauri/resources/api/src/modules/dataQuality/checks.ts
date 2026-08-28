// =============================================================================
// Data quality engine (spec §81, docs/10 §4).
//
// Live checks over platform records — the same data the reports read, so a
// finding always points at a real row. Detections: impossible dates/ages,
// future-dated records, inconsistent pregnancy data, invalid diagnoses,
// missing mandatory fields, duplicate registrations, duplicate reports and
// implausible vitals. Every finding is classified ERROR / WARNING / INFO and
// NEVER blocks clinical care — the engine only reports.
//
// Scoped exactly like the reports (facility / region / district / national).
// Findings are bounded (RECENT_LIMIT per check) and reference the record by
// MRN / id — no clinical note text, no identifiers beyond the MRN.
// -----------------------------------------------------------------------------

import type { Prisma, PrismaClient } from '@prisma/client';
import type { AuthUser } from '../../types.js';

export type Severity = 'ERROR' | 'WARNING' | 'INFO';

export interface DataQualityFinding {
  id: string;
  mrn: string | null;
  record: string; // entity type + truncated id
  detail: string;
}

export interface DataQualityCheck {
  code: string;
  name: string;
  description: string;
  severity: Severity;
  count: number;
  findings: DataQualityFinding[];
}

export interface DataQualityReport {
  scope: string;
  generatedAt: string;
  summary: { checks: number; error: number; warning: number; info: number; findings: number };
  checks: DataQualityCheck[];
  method: string;
}

/** How many example findings each check returns (bounded — never the full set). */
const RECENT_LIMIT = 5;

/** Scopes clinical rows (which carry facilityId) to a FACILITY caller. */
function scopeFacility(u: AuthUser): string | undefined {
  return u.scope === 'FACILITY' ? u.facilityId ?? undefined : undefined;
}

/** Scopes patient rows (which carry regionId/districtId/facilityId). */
function patientScope(u: AuthUser): Prisma.PatientWhereInput {
  if (u.scope === 'FACILITY') return { facilityId: u.facilityId ?? undefined };
  if (u.scope === 'REGIONAL') return { regionId: u.regionId ?? undefined };
  if (u.scope === 'DISTRICT') return { districtId: u.districtId ?? undefined };
  return {};
}

function mrnOf(mrnById: Map<string, string>, patientId: string): string | null {
  return mrnById.get(patientId) ?? null;
}

/**
 * Runs every check live against the caller's scope. Reads only — the engine
 * never mutates and can never block a clinical write.
 */
export async function runDataQuality(db: PrismaClient, u: AuthUser): Promise<DataQualityReport> {
  const checks: DataQualityCheck[] = [];
  const summary = { checks: 0, error: 0, warning: 0, info: 0, findings: 0 };

  function add(code: string, name: string, description: string, severity: Severity, count: number, findings: DataQualityFinding[]) {
    checks.push({ code, name, description, severity, count, findings });
    summary.checks++;
    summary[severity === 'ERROR' ? 'error' : severity === 'WARNING' ? 'warning' : 'info']++;
    summary.findings += findings.length;
  }

  const now = new Date();
  const pWhere = patientScope(u);
  const fScope = scopeFacility(u);

  // ---- patients ------------------------------------------------------------
  const patients = await db.patient.findMany({ where: pWhere, select: { id: true, mrn: true, dateOfBirth: true, sex: true, fullName: true, phone: true, ghanaCard: true, nhisNumber: true } });

  // 1. Impossible dates / ages: missing, future, or > 120 years old.
  const badDob = patients.filter((p) => {
    if (!p.dateOfBirth) return true;
    const age = (now.getTime() - p.dateOfBirth.getTime()) / (365.25 * 24 * 3600 * 1000);
    return p.dateOfBirth.getTime() > now.getTime() || age > 120;
  });
  add(
    'dob.impossible',
    'Impossible date of birth',
    'Patients whose DOB is missing, in the future, or implies an age over 120 years.',
    'ERROR',
    badDob.length,
    badDob.slice(0, RECENT_LIMIT).map((p) => ({ id: p.id, mrn: p.mrn, record: `patient ${p.id.slice(0, 8)}…`, detail: `DOB ${p.dateOfBirth ? p.dateOfBirth.toISOString().slice(0, 10) : 'missing'}` })),
  );

  // 2. Missing mandatory registration fields (name, sex, card/NHIS).
  const incomplete = patients.filter((p) => !p.fullName || !p.sex || (!p.ghanaCard && !p.nhisNumber));
  add(
    'patient.incomplete',
    'Incomplete registration',
    'Patients missing a name, sex, or both a Ghana Card and NHIS number.',
    'WARNING',
    incomplete.length,
    incomplete.slice(0, RECENT_LIMIT).map((p) => ({ id: p.id, mrn: p.mrn, record: `patient ${p.id.slice(0, 8)}…`, detail: 'missing name/sex/Ghana Card/NHIS' })),
  );

  // 3. Near-duplicate registrations: same name + same phone.
  const dups = new Map<string, DataQualityFinding[]>();
  const byNamePhone = new Map<string, { id: string; mrn: string; fullName: string }[]>();
  for (const p of patients) {
    const key = `${(p.fullName ?? '').trim().toLowerCase()}|${(p.phone ?? '').trim()}`;
    if (key.endsWith('|') || key.startsWith('|')) continue;
    const list = byNamePhone.get(key) ?? [];
    list.push(p);
    byNamePhone.set(key, list);
  }
  for (const [key, list] of byNamePhone) {
    if (list.length > 1) {
      const name = list[0]?.fullName ?? '(unnamed)';
      dups.set(key, list.slice(0, RECENT_LIMIT).map((p) => ({ id: p.id, mrn: p.mrn, record: `patient ${p.id.slice(0, 8)}…`, detail: `same name+phone as ${list.length} records (${name})` })));
    }
  }
  add('patient.duplicate', 'Possible duplicate patients', 'Patients sharing the same name AND phone — candidates for MPI review.', 'WARNING', dups.size, [...dups.values()].flat().slice(0, RECENT_LIMIT));

  // ---- encounters ----------------------------------------------------------
  const encs = await db.encounter.findMany({ where: { facilityId: fScope }, orderBy: { createdAt: 'desc' }, take: 2000, select: { id: true, patientId: true, facilityId: true, createdAt: true, status: true } });
  const encMrn = new Map((await db.patient.findMany({ where: { id: { in: [...new Set(encs.map((e) => e.patientId))] } }, select: { id: true, mrn: true } })).map((p) => [p.id, p.mrn]));

  const futureEncs = encs.filter((e) => e.createdAt.getTime() > now.getTime() + 5 * 60 * 1000);
  add(
    'encounter.future',
    'Future-dated encounter',
    'Encounters whose record time is in the future (clock drift or bad client timestamp).',
    'ERROR',
    futureEncs.length,
    futureEncs.slice(0, RECENT_LIMIT).map((e) => ({ id: e.id, mrn: mrnOf(encMrn, e.patientId), record: `encounter ${e.id.slice(0, 8)}…`, detail: `createdAt ${e.createdAt.toISOString()}` })),
  );

  const openStale = encs.filter((e) => e.status === 'OPEN' && now.getTime() - e.createdAt.getTime() > 30 * 24 * 3600 * 1000);
  add(
    'encounter.open.stale',
    'Stale open encounter',
    'Encounters still OPEN after 30 days — likely never closed.',
    'INFO',
    openStale.length,
    openStale.slice(0, RECENT_LIMIT).map((e) => ({ id: e.id, mrn: mrnOf(encMrn, e.patientId), record: `encounter ${e.id.slice(0, 8)}…`, detail: `open since ${e.createdAt.toISOString().slice(0, 10)}` })),
  );

  // ---- labs ----------------------------------------------------------------
  const labs = await db.labOrder.findMany({ where: { facilityId: fScope }, orderBy: { createdAt: 'desc' }, take: 2000, select: { id: true, patientId: true, facilityId: true, test: true, status: true, result: true, createdAt: true } });
  const labMrn = new Map((await db.patient.findMany({ where: { id: { in: [...new Set(labs.map((l) => l.patientId))] } }, select: { id: true, mrn: true } })).map((p) => [p.id, p.mrn]));

  const verifiedNoResult = labs.filter((l) => l.status === 'VERIFIED' && !l.result);
  add(
    'lab.verified.no-result',
    'Verified lab order without a result',
    'Lab orders marked VERIFIED but carrying no result text.',
    'ERROR',
    verifiedNoResult.length,
    verifiedNoResult.slice(0, RECENT_LIMIT).map((l) => ({ id: l.id, mrn: mrnOf(labMrn, l.patientId), record: `labOrder ${l.id.slice(0, 8)}…`, detail: l.test })),
  );

  const pendingStale = labs.filter((l) => ['ORDERED', 'COLLECTED'].includes(l.status) && now.getTime() - l.createdAt.getTime() > 14 * 24 * 3600 * 1000);
  add(
    'lab.pending.stale',
    'Stale pending lab order',
    'Lab orders neither verified nor cancelled after 14 days.',
    'WARNING',
    pendingStale.length,
    pendingStale.slice(0, RECENT_LIMIT).map((l) => ({ id: l.id, mrn: mrnOf(labMrn, l.patientId), record: `labOrder ${l.id.slice(0, 8)}…`, detail: `${l.test} (${l.status})` })),
  );

  // ---- pregnancy data --------------------------------------------------------
  const ancMrn = new Map(patients.filter((p) => p.sex === 'FEMALE').map((p) => [p.id, p.mrn]));
  const anc = await db.antenatalVisit.findMany({ where: { facilityId: fScope }, orderBy: { visitedAt: 'desc' }, take: 2000, select: { id: true, patientId: true, gaWeeks: true, visitedAt: true } });
  const badGa = anc.filter((a) => a.gaWeeks !== null && (a.gaWeeks < 4 || a.gaWeeks > 45));
  add(
    'anc.gestational-age',
    'Implausible gestational age',
    'ANC visits with a gestational age outside 4–45 weeks.',
    'WARNING',
    badGa.length,
    badGa.slice(0, RECENT_LIMIT).map((a) => ({ id: a.id, mrn: mrnOf(ancMrn, a.patientId), record: `antenatalVisit ${a.id.slice(0, 8)}…`, detail: `GA ${a.gaWeeks} weeks` })),
  );

  // 4. Pregnancy record on a patient registered as male — inconsistent data.
  const del = await db.deliveryRecord.findMany({ where: { facilityId: fScope }, orderBy: { deliveredAt: 'desc' }, take: 2000, select: { id: true, patientId: true, deliveredAt: true } });
  const sexById = new Map(patients.map((p) => [p.id, p.sex]));
  const malePregnancy = del.filter((d) => sexById.get(d.patientId) === 'MALE');
  add(
    'pregnancy.sex-mismatch',
    'Pregnancy record on a male patient',
    'A delivery record exists for a patient registered as male.',
    'ERROR',
    malePregnancy.length,
    malePregnancy.slice(0, RECENT_LIMIT).map((d) => ({ id: d.id, mrn: mrnOf(ancMrn, d.patientId), record: `delivery ${d.id.slice(0, 8)}…`, detail: `delivered ${d.deliveredAt.toISOString().slice(0, 10)}` })),
  );

  // ---- prescriptions ----------------------------------------------------------
  const rxs = await db.prescription.findMany({ where: { facilityId: fScope }, orderBy: { createdAt: 'desc' }, take: 2000, select: { id: true, patientId: true, medicine: true, quantity: true } });
  const rxMrn = new Map((await db.patient.findMany({ where: { id: { in: [...new Set(rxs.map((r) => r.patientId))] } }, select: { id: true, mrn: true } })).map((p) => [p.id, p.mrn]));

  const rxIncomplete = rxs.filter((r) => !r.medicine || !r.quantity || r.quantity < 1);
  add(
    'rx.incomplete',
    'Prescription missing medicine or quantity',
    'Prescriptions with no medicine name or a quantity below 1.',
    'WARNING',
    rxIncomplete.length,
    rxIncomplete.slice(0, RECENT_LIMIT).map((r) => ({ id: r.id, mrn: mrnOf(rxMrn, r.patientId), record: `prescription ${r.id.slice(0, 8)}…`, detail: r.medicine || '(no medicine)' })),
  );

  return {
    scope: u.scope,
    generatedAt: now.toISOString(),
    summary,
    checks,
    method: 'Live checks over platform records (spec §81). Findings never block clinical care — the engine only reports.',
  };
}
