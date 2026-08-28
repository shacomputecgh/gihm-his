// -----------------------------------------------------------------------------
// LHIMS adapter (docs/08 §2) — patient/demographics/encounters/results
// exchange with FHIR mapping + MPI identity resolution.
//
// Builds a FHIR R4 Bundle (Patient + Encounter + DiagnosticReport resources)
// computed live from platform records for a monthly period — never manual
// re-entry — and delivers it to the configured LHIMS/FHIR endpoint through the
// shared integration engine (idempotent queue + backoff + audit). Each Patient
// resource carries the platform identifiers (MRN, Ghana Card, NHIS number,
// passport) so the national MPI can resolve the person across facilities.
// -----------------------------------------------------------------------------

import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { toCsv } from '../../lib/csv.js';
import type { AuthUser } from '../../types.js';
import { patientScope } from '../../lib/scope.js';
import { periodRange, resolveOrgUnit } from './dhims2.js';
import type { AdapterAuthConfig, TransportResult } from './engine.js';

// Encounter.status → FHIR Encounter.status
const ENCOUNTER_STATUS: Record<string, string> = {
  OPEN: 'planned',
  TRIAGED: 'triaged',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'finished',
};
// Encounter.type → FHIR Encounter.class code
const ENCOUNTER_CLASS: Record<string, string> = {
  OPD: 'AMB',
  EMERGENCY: 'EMER',
  INPATIENT: 'IMP',
  ANTENATAL: 'AMB',
  IMMUNIZATION: 'AMB',
  OTHER: 'UNK',
};

export interface FhirBundle {
  resourceType: 'Bundle';
  type: 'transaction';
  entry: Array<{ fullUrl: string; resource: Record<string, unknown> }>;
}

export interface LhimsSubmission {
  dataSet: 'LHIMS-FHIR';
  period: string; // 'YYYY-MM'
  orgUnit: string; // facility code (or scope label)
  generatedAt: string;
  bundle: FhirBundle;
}

function fhirSex(sex: string | null | undefined): string {
  if (sex === 'M') return 'male';
  if (sex === 'F') return 'female';
  return 'unknown';
}

function fhirIdentifiers(p: {
  mrn: string;
  ghanaCard: string | null;
  nhisNumber: string | null;
  passport: string | null;
}): Array<{ system: string; value: string }> {
  const out: Array<{ system: string; value: string }> = [{ system: 'urn:gihm:mrn', value: p.mrn }];
  if (p.ghanaCard) out.push({ system: 'urn:gihm:ghana-card', value: p.ghanaCard });
  if (p.nhisNumber) out.push({ system: 'urn:gihm:nhis', value: p.nhisNumber });
  if (p.passport) out.push({ system: 'urn:gihm:passport', value: p.passport });
  return out;
}

/**
 * Build the FHIR exchange bundle for a monthly period in the caller's scope:
 * every Patient with activity in the period, their Encounters, and their
 * resulted lab orders as DiagnosticReport resources. orgUnit defaults to the
 * facility code (facility scope) or the scope label, matching the other
 * adapters.
 */
export async function buildFhirBundle(
  db: PrismaClient,
  u: AuthUser,
  period: string,
  orgUnit?: string,
): Promise<LhimsSubmission> {
  const { range } = periodRange(period);
  const unit = await resolveOrgUnit(db, u, orgUnit);
  const patientWhere = patientScope(u);
  const clinicalWhere = {
    ...(u.scope === 'REGIONAL' ? { patient: { regionId: u.regionId ?? '__deny__' } }
      : u.scope === 'DISTRICT' ? { patient: { districtId: u.districtId ?? '__deny__' } }
      : u.scope === 'FACILITY' ? { facilityId: u.facilityId ?? '__deny__' }
      : {}),
  };

  const [encounters, labs] = await Promise.all([
    db.encounter.findMany({
      where: { ...clinicalWhere, createdAt: { gte: range.gte, lt: range.lt } },
      include: { patient: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    db.labOrder.findMany({
      where: { ...clinicalWhere, status: { in: ['RESULTED', 'VERIFIED'] }, updatedAt: { gte: range.gte, lt: range.lt } },
      include: { patient: { select: { id: true, fullName: true } } },
      orderBy: { updatedAt: 'asc' },
    }),
  ]);

  const patientIds = [...new Set([...encounters.map((e) => e.patientId), ...labs.map((l) => l.patientId)])];
  const patients = patientIds.length
    ? await db.patient.findMany({ where: { id: { in: patientIds }, ...patientWhere } })
    : [];

  const entry: Array<{ fullUrl: string; resource: Record<string, unknown> }> = [];

  for (const p of patients) {
    entry.push({
      fullUrl: `Patient/${p.id}`,
      resource: {
        resourceType: 'Patient',
        id: p.id,
        identifier: fhirIdentifiers(p),
        name: [{ text: p.fullName }],
        ...(p.phone ? { telecom: [{ system: 'phone', value: p.phone }] } : {}),
        gender: fhirSex(p.sex),
        ...(p.dateOfBirth ? { birthDate: p.dateOfBirth.toISOString().slice(0, 10) } : {}),
      },
    });
  }

  for (const e of encounters) {
    entry.push({
      fullUrl: `Encounter/${e.id}`,
      resource: {
        resourceType: 'Encounter',
        id: e.id,
        status: ENCOUNTER_STATUS[e.status] ?? 'unknown',
        class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: ENCOUNTER_CLASS[e.type] ?? 'UNK' },
        subject: { reference: `Patient/${e.patientId}` },
        period: { start: e.createdAt.toISOString() },
        ...(e.presentingComplaint ? { reasonCode: [{ text: e.presentingComplaint }] } : {}),
        ...(e.diagnosisSummary ? { diagnosis: [{ condition: { text: e.diagnosisSummary } }] } : {}),
      },
    });
  }

  for (const l of labs) {
    entry.push({
      fullUrl: `DiagnosticReport/${l.id}`,
      resource: {
        resourceType: 'DiagnosticReport',
        id: l.id,
        status: l.status === 'VERIFIED' ? 'final' : 'preliminary',
        code: { text: l.test },
        subject: { reference: `Patient/${l.patientId}` },
        encounter: { reference: `Encounter/${l.encounterId}` },
        effectiveDateTime: l.updatedAt.toISOString(),
        ...(l.result ? { conclusion: l.result } : {}),
        ...(l.referenceRange ? { conclusionCode: [{ text: l.referenceRange }] } : {}),
        ...(l.critical ? { note: [{ text: 'CRITICAL result' }] } : {}),
      },
    });
  }

  return {
    dataSet: 'LHIMS-FHIR',
    period,
    orgUnit: unit,
    generatedAt: new Date().toISOString(),
    bundle: { resourceType: 'Bundle', type: 'transaction', entry },
  };
}

/** LHIMS exchange CSV — flattened one row per resource (for human review). */
export function fhirToCsv(sub: LhimsSubmission): string {
  const rows: string[][] = [];
  for (const { resource } of sub.bundle.entry) {
    const r = resource as Record<string, any>;
    const patientId = typeof r.subject?.reference === 'string' ? r.subject.reference.replace('Patient/', '') : '';
    if (r.resourceType === 'Patient') {
      rows.push([sub.orgUnit, sub.period, 'Patient', r.id, '', '', r.name?.[0]?.text ?? '', r.gender ?? '', r.birthDate ?? '', '']);
    } else if (r.resourceType === 'Encounter') {
      rows.push([sub.orgUnit, sub.period, 'Encounter', r.id, patientId, r.status ?? '', '', '', '', r.reasonCode?.[0]?.text ?? '']);
    } else if (r.resourceType === 'DiagnosticReport') {
      rows.push([sub.orgUnit, sub.period, 'DiagnosticReport', r.id, patientId, r.status ?? '', '', '', '', `${r.code?.text ?? ''} — ${r.conclusion ?? ''}`]);
    }
  }
  return toCsv(['orgUnit', 'period', 'resourceType', 'id', 'patientId', 'status', 'patientName', 'gender', 'birthDate', 'detail'], rows);
}

function basicAuth(cfg: AdapterAuthConfig): string {
  return `Basic ${Buffer.from(`${cfg.username}:${cfg.password}`).toString('base64')}`;
}

/** LHIMS transport — POST the FHIR bundle to /api/fhir (basic auth). */
export async function lhimsTransport(cfg: AdapterAuthConfig, payload: unknown): Promise<TransportResult> {
  let res: Response;
  try {
    res = await fetch(`${cfg.url.replace(/\/$/, '')}/api/fhir`, {
      method: 'POST',
      headers: { 'content-type': 'application/fhir+json', authorization: basicAuth(cfg) },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Network failure (upstream unreachable) — the engine keeps the row queued
    // with backoff rather than losing it (docs/08 §3).
    return { ok: false, error: `LHIMS unreachable: ${err instanceof Error ? err.message : 'network error'}` };
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return { ok: false, error: `LHIMS rejected bundle: HTTP ${res.status}${body ? ` — ${body.slice(0, 200)}` : ''}` };
  }
  let remoteId: string | undefined;
  try {
    const parsed = (await res.json()) as { bundleId?: string; importId?: string; id?: string };
    remoteId = parsed.bundleId ?? parsed.importId ?? parsed.id;
  } catch {
    /* no acknowledgement id — delivery still succeeded */
  }
  return { ok: true, remoteId };
}
