// -----------------------------------------------------------------------------
// DHIMS Tracker / eTracker adapter (docs/08 §2) — longitudinal client
// tracking with identity resolution.
//
// Builds a monthly CLIENT-COHORT submission computed live from the platform's
// maternal health records (the eTracker's flagship program): every woman with
// antenatal, delivery or postnatal activity in the period becomes one client
// row carrying her identifiers (MRN, Ghana Card, NHIS number, phone — the
// keys the national registry uses to resolve the person across facilities)
// plus her program summary for the period (ANC visits + latest risk, delivery
// outcomes, PNC visits). Delivered through the shared integration engine
// (idempotent queue + backoff + audit — docs/08 §3).
// -----------------------------------------------------------------------------

import type { PrismaClient } from '@prisma/client';
import { toCsv } from '../../lib/csv.js';
import type { AuthUser } from '../../types.js';
import { patientScope } from '../../lib/scope.js';
import { periodRange, resolveOrgUnit } from './dhims2.js';
import type { AdapterAuthConfig, TransportResult } from './engine.js';

export interface EtrackerClient {
  clientId: string; // platform patient id — the identity resolution key
  mrn: string; // facility medical record number
  fullName: string;
  sex: string | null;
  dateOfBirth: string | null; // YYYY-MM-DD
  phone: string | null;
  ghanaCard: string | null;
  nhisNumber: string | null;
  program: 'ANC' | 'PNC' | 'DELIVERY' | 'MULTIPLE';
  ancVisitsInPeriod: number;
  latestRiskAssessment: string | null;
  deliveriesInPeriod: number;
  latestDeliveryOutcome: string | null;
  pncVisitsInPeriod: number;
}

export interface EtrackerSubmission {
  dataSet: 'ETRACKER-CLIENTS';
  period: string; // 'YYYY-MM'
  orgUnit: string; // facility code (or scope label)
  generatedAt: string;
  clients: EtrackerClient[];
}

/**
 * Build the client cohort for a monthly period in the caller's scope: every
 * woman with any antenatal/delivery/postnatal activity in the period, each
 * carrying identifiers for national identity resolution and her program
 * summary. orgUnit defaults to the facility code (facility scope) or the
 * scope label, matching the other adapters.
 */
export async function buildClientCohort(
  db: PrismaClient,
  u: AuthUser,
  period: string,
  orgUnit?: string,
): Promise<EtrackerSubmission> {
  const { range } = periodRange(period);
  const unit = await resolveOrgUnit(db, u, orgUnit);
  const patientWhere = patientScope(u);

  const [anc, deliveries, pnc] = await Promise.all([
    db.antenatalVisit.findMany({
      where: { visitedAt: { gte: range.gte, lt: range.lt }, patient: patientWhere },
      select: { patientId: true, visitNumber: true, riskAssessment: true, visitedAt: true },
    }),
    db.deliveryRecord.findMany({
      where: { deliveredAt: { gte: range.gte, lt: range.lt }, patient: patientWhere },
      select: { patientId: true, outcome: true, deliveredAt: true },
    }),
    db.postnatalVisit.findMany({
      where: { visitedAt: { gte: range.gte, lt: range.lt }, patient: patientWhere },
      select: { patientId: true, visitNumber: true },
    }),
  ]);

  const ids = [...new Set([...anc.map((r) => r.patientId), ...deliveries.map((r) => r.patientId), ...pnc.map((r) => r.patientId)])];
  if (ids.length === 0) return { dataSet: 'ETRACKER-CLIENTS', period, orgUnit: unit, generatedAt: new Date().toISOString(), clients: [] };

  const patients = await db.patient.findMany({
    where: { id: { in: ids }, ...patientWhere },
    select: { id: true, mrn: true, fullName: true, sex: true, dateOfBirth: true, phone: true, ghanaCard: true, nhisNumber: true },
  });
  const byId = new Map(patients.map((p) => [p.id, p]));

  // Group each patient's activity by program, keeping the latest row per
  // program for the summary fields.
  const ancByPatient = new Map<string, typeof anc>();
  for (const r of anc) {
    const list = ancByPatient.get(r.patientId) ?? [];
    list.push(r);
    ancByPatient.set(r.patientId, list);
  }
  const deliveryByPatient = new Map<string, typeof deliveries>();
  for (const r of deliveries) {
    const list = deliveryByPatient.get(r.patientId) ?? [];
    list.push(r);
    deliveryByPatient.set(r.patientId, list);
  }
  const pncByPatient = new Map<string, typeof pnc>();
  for (const r of pnc) {
    const list = pncByPatient.get(r.patientId) ?? [];
    list.push(r);
    pncByPatient.set(r.patientId, list);
  }

  const clients: EtrackerClient[] = patients
    .filter((p) => byId.has(p.id))
    .map((p) => {
      const ancRows = ancByPatient.get(p.id) ?? [];
      const deliveryRows = deliveryByPatient.get(p.id) ?? [];
      const pncRows = pncByPatient.get(p.id) ?? [];
      const programs: Array<'ANC' | 'PNC' | 'DELIVERY'> = [
        ...(ancRows.length ? ['ANC' as const] : []),
        ...(deliveryRows.length ? ['DELIVERY' as const] : []),
        ...(pncRows.length ? ['PNC' as const] : []),
      ];
      const latestAnc = ancRows.sort((a, b) => b.visitedAt.getTime() - a.visitedAt.getTime())[0];
      const latestDelivery = deliveryRows.sort((a, b) => b.deliveredAt.getTime() - a.deliveredAt.getTime())[0];
      return {
        clientId: p.id,
        mrn: p.mrn,
        fullName: p.fullName,
        sex: p.sex,
        dateOfBirth: p.dateOfBirth ? p.dateOfBirth.toISOString().slice(0, 10) : null,
        phone: p.phone,
        ghanaCard: p.ghanaCard,
        nhisNumber: p.nhisNumber,
        program: programs.length > 1 ? ('MULTIPLE' as const) : (programs[0] ?? 'ANC'),
        ancVisitsInPeriod: ancRows.length,
        latestRiskAssessment: latestAnc?.riskAssessment ?? null,
        deliveriesInPeriod: deliveryRows.length,
        latestDeliveryOutcome: latestDelivery?.outcome ?? null,
        pncVisitsInPeriod: pncRows.length,
      };
    })
    .sort((a, b) => a.mrn.localeCompare(b.mrn));

  return { dataSet: 'ETRACKER-CLIENTS', period, orgUnit: unit, generatedAt: new Date().toISOString(), clients };
}

/** eTracker client cohort CSV — one row per client (facility/period columns). */
export function clientsToCsv(sub: EtrackerSubmission): string {
  const rows: string[][] = sub.clients.map((c) => [
    sub.orgUnit,
    sub.period,
    c.clientId,
    c.mrn,
    c.fullName,
    c.sex ?? '',
    c.dateOfBirth ?? '',
    c.phone ?? '',
    c.ghanaCard ?? '',
    c.nhisNumber ?? '',
    c.program,
    String(c.ancVisitsInPeriod),
    c.latestRiskAssessment ?? '',
    String(c.deliveriesInPeriod),
    c.latestDeliveryOutcome ?? '',
    String(c.pncVisitsInPeriod),
  ]);
  return toCsv(
    ['orgUnit', 'period', 'clientId', 'mrn', 'fullName', 'sex', 'dateOfBirth', 'phone', 'ghanaCard', 'nhisNumber', 'program', 'ancVisitsInPeriod', 'latestRiskAssessment', 'deliveriesInPeriod', 'latestDeliveryOutcome', 'pncVisitsInPeriod'],
    rows,
  );
}

function basicAuth(cfg: AdapterAuthConfig): string {
  return `Basic ${Buffer.from(`${cfg.username}:${cfg.password}`).toString('base64')}`;
}

/** eTracker transport — POST the client cohort to /api/clients (basic auth). */
export async function etrackerTransport(cfg: AdapterAuthConfig, payload: unknown): Promise<TransportResult> {
  let res: Response;
  try {
    res = await fetch(`${cfg.url.replace(/\/$/, '')}/api/clients`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: basicAuth(cfg) },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Network failure (upstream unreachable) — the engine keeps the row queued
    // with backoff rather than losing it (docs/08 §3).
    return { ok: false, error: `eTracker unreachable: ${err instanceof Error ? err.message : 'network error'}` };
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return { ok: false, error: `eTracker rejected submission: HTTP ${res.status}${body ? ` — ${body.slice(0, 200)}` : ''}` };
  }
  let remoteId: string | undefined;
  try {
    const parsed = (await res.json()) as { importId?: string; batchId?: string; id?: string };
    remoteId = parsed.importId ?? parsed.batchId ?? parsed.id;
  } catch {
    /* no acknowledgement id — delivery still succeeded */
  }
  return { ok: true, remoteId };
}
