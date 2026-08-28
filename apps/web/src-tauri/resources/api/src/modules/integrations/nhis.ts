// -----------------------------------------------------------------------------
// NHIS adapter (docs/08 §2) — the national health insurance scheme claims
// gateway.
//
// Builds a claims submission from this platform's OWN SUBMITTED insurance
// claims (never manual re-entry) and delivers it through the shared
// integration engine (idempotent queue + backoff + audit). The platform stays
// authoritative for day-to-day claims; NHIS receives the monthly batch for
// national reimbursement. The delivery row is the pending-verification state —
// a claim's own status is untouched until the national decision lands through
// the platform's existing claim-decision flow.
// -----------------------------------------------------------------------------

import type { PrismaClient } from '@prisma/client';
import { toCsv } from '../../lib/csv.js';
import { parseJsonArr } from '../../lib/validate.js';
import type { AuthUser } from '../../types.js';
import { facilityScope } from '../../lib/scope.js';
import { periodRange, resolveOrgUnit } from './dhims2.js';
import type { AdapterAuthConfig, TransportResult } from './engine.js';

export interface NhisClaimRow {
  claimNumber: string;
  patientName: string;
  nhisNumber: string | null;
  schemeCode: string;
  schemeName: string;
  serviceDate: string;
  items: Array<{ description: string; amount: number }>;
  amount: number;
}

export interface NhisSubmission {
  dataSet: 'NHIS-CLAIMS';
  period: string; // 'YYYY-MM'
  orgUnit: string; // facility code (or scope label)
  generatedAt: string;
  claims: NhisClaimRow[];
}

/**
 * Build the current claims submission for the caller's scope: every SUBMITTED
 * claim whose service date falls in the period. orgUnit defaults to the
 * facility code (facility scope) or the scope label, matching DHIMS2.
 */
export async function buildClaimsSubmission(
  db: PrismaClient,
  u: AuthUser,
  period: string,
  orgUnit?: string,
): Promise<NhisSubmission> {
  const { range } = periodRange(period);
  const unit = await resolveOrgUnit(db, u, orgUnit);
  const claims = await db.insuranceClaim.findMany({
    where: { ...facilityScope(u), status: 'SUBMITTED', serviceDate: { gte: range.gte, lt: range.lt } },
    include: { patient: { select: { fullName: true, nhisNumber: true } }, scheme: { select: { code: true, name: true } } },
    orderBy: { claimNumber: 'asc' },
    take: 500,
  });
  return {
    dataSet: 'NHIS-CLAIMS',
    period,
    orgUnit: unit,
    generatedAt: new Date().toISOString(),
    claims: claims.map((c) => ({
      claimNumber: c.claimNumber,
      patientName: c.patient.fullName,
      nhisNumber: c.patient.nhisNumber,
      schemeCode: c.scheme.code,
      schemeName: c.scheme.name,
      serviceDate: c.serviceDate.toISOString().slice(0, 10),
      items: parseJsonArr<{ description: string; amount: number }>(c.items),
      amount: c.amount,
    })),
  };
}

/** NHIS claims CSV — one row per claim (facility/period columns). */
export function claimsToCsv(sub: NhisSubmission): string {
  const rows: string[][] = sub.claims.map((c) => [
    sub.orgUnit,
    sub.period,
    c.claimNumber,
    c.patientName,
    c.nhisNumber ?? '',
    c.schemeCode,
    c.schemeName,
    c.serviceDate,
    c.items.map((i) => `${i.description}:${i.amount}`).join('; '),
    String(c.amount),
  ]);
  return toCsv(['orgUnit', 'period', 'claimNumber', 'patientName', 'nhisNumber', 'schemeCode', 'schemeName', 'serviceDate', 'items', 'amount'], rows);
}

function basicAuth(cfg: AdapterAuthConfig): string {
  return `Basic ${Buffer.from(`${cfg.username}:${cfg.password}`).toString('base64')}`;
}

/** NHIS claims transport — POST the batch to /api/claims (basic auth). */
export async function nhisTransport(cfg: AdapterAuthConfig, payload: unknown): Promise<TransportResult> {
  let res: Response;
  try {
    res = await fetch(`${cfg.url.replace(/\/$/, '')}/api/claims`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: basicAuth(cfg) },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Network failure (upstream unreachable) — the engine keeps the row queued
    // with backoff rather than losing it (docs/08 §3).
    return { ok: false, error: `NHIS unreachable: ${err instanceof Error ? err.message : 'network error'}` };
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return { ok: false, error: `NHIS rejected submission: HTTP ${res.status}${body ? ` — ${body.slice(0, 200)}` : ''}` };
  }
  let remoteId: string | undefined;
  try {
    const parsed = (await res.json()) as { submissionId?: string; batchId?: string; id?: string };
    remoteId = parsed.submissionId ?? parsed.batchId ?? parsed.id;
  } catch {
    /* no acknowledgement id — delivery still succeeded */
  }
  return { ok: true, remoteId };
}
