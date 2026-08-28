// -----------------------------------------------------------------------------
// DHIMS2 adapter (docs/08 §2, docs/14 §3) — the national reporting system.
//
// Builds a DHIMS2 dataValueSet submission for a monthly period, computed live
// from platform records (never manual re-entry, spec §50), and delivers it to
// the configured DHIMS2 instance through the shared integration engine
// (idempotent queue + backoff + audit — docs/08 §3).
// -----------------------------------------------------------------------------

import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { toCsv } from '../../lib/csv.js';
import type { AuthUser } from '../../types.js';
import { INDICATORS, computeIndicators, callerScopeOf, facilityScopeOf } from '../reports/compute.js';
import type { AdapterAuthConfig, TransportResult } from './engine.js';

export interface Dhims2DataValue {
  dataElement: string; // DHIMS-II area code, e.g. '1A'
  value: number;
  categoryOptionCombo: string;
}

export interface Dhims2Submission {
  dataSet: string;
  period: string; // DHIMS2 period code, e.g. '202607'
  orgUnit: string; // DHIMS2 org unit code (facility code or scope label)
  completeDate: string;
  dataValues: Dhims2DataValue[];
  generatedAt: string;
}

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** 'YYYY-MM' → { range, dhimsPeriod 'YYYYMM', completeDate 'YYYY-MM-<last day>' } */
export function periodRange(period: string): { range: { gte: Date; lt: Date }; dhimsPeriod: string; completeDate: string } {
  if (!MONTH_RE.test(period)) throw httpErrors.badRequest('period must be YYYY-MM');
  const [year, month] = period.split('-').map(Number) as [number, number];
  const gte = new Date(Date.UTC(year, month - 1, 1));
  const lt = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { range: { gte, lt }, dhimsPeriod: period.replace('-', ''), completeDate: `${period}-${String(lastDay).padStart(2, '0')}` };
}

/** Resolve the DHIMS2 org unit for a caller (facility code when facility-scoped). */
export async function resolveOrgUnit(db: PrismaClient, u: AuthUser, explicit?: string): Promise<string> {
  if (explicit) return explicit;
  if (u.scope === 'FACILITY' && u.facilityId) {
    const facility = await db.facility.findUnique({ where: { id: u.facilityId }, select: { code: true } });
    if (facility) return facility.code;
  }
  return u.scope;
}

/**
 * Build a DHIMS2 dataValueSet for a monthly period in the caller's scope.
 * orgUnit defaults to the facility code (facility scope) or the scope label.
 */
export async function buildDataset(
  db: PrismaClient,
  u: AuthUser,
  period: string,
  orgUnit?: string,
): Promise<Dhims2Submission> {
  const { range, dhimsPeriod, completeDate } = periodRange(period);
  const unit = await resolveOrgUnit(db, u, orgUnit);
  const values = await computeIndicators(db, u, range, callerScopeOf(db, u));
  const dataValues: Dhims2DataValue[] = [];
  for (const def of INDICATORS) {
    if (!def.collected) continue;
    const v = values[def.code];
    if (typeof v === 'number') dataValues.push({ dataElement: def.dhims2Code, value: v, categoryOptionCombo: 'default' });
  }
  return {
    dataSet: 'GIHM-HIS',
    period: dhimsPeriod,
    orgUnit: unit,
    completeDate,
    dataValues,
    generatedAt: new Date().toISOString(),
  };
}

/** DHIMS2 dataValueSet import CSV (same shape DHIMS2 accepts for bulk upload). */
export function datasetToCsv(sub: Dhims2Submission): string {
  const rows: string[][] = sub.dataValues.map((dv) => [sub.dataSet, sub.period, sub.orgUnit, dv.dataElement, dv.categoryOptionCombo, String(dv.value)]);
  return toCsv(['dataSet', 'period', 'orgUnit', 'dataElement', 'categoryOptionCombo', 'value'], rows);
}

/**
 * Per-facility datasets for a grouped submission (used by /reports/export
 * style exports and by a national-level queue with orgUnit selection). Each
 * facility row is computed with the facility's own scope.
 */
export async function buildFacilityDatasets(
  db: PrismaClient,
  u: AuthUser,
  period: string,
  facilities: Array<{ id: string; code: string }>,
): Promise<Dhims2Submission[]> {
  const { range, dhimsPeriod, completeDate } = periodRange(period);
  const subs = await Promise.all(
    facilities.map(async (f) => {
      const values = await computeIndicators(db, u, range, facilityScopeOf(f.id));
      const dataValues: Dhims2DataValue[] = [];
      for (const def of INDICATORS) {
        if (!def.collected) continue;
        const v = values[def.code];
        if (typeof v === 'number') dataValues.push({ dataElement: def.dhims2Code, value: v, categoryOptionCombo: 'default' });
      }
      return { dataSet: 'GIHM-HIS', period: dhimsPeriod, orgUnit: f.code, completeDate, dataValues, generatedAt: new Date().toISOString() };
    }),
  );
  return subs;
}

function basicAuth(cfg: AdapterAuthConfig): string {
  return `Basic ${Buffer.from(`${cfg.username}:${cfg.password}`).toString('base64')}`;
}

/** DHIMS2 dataValueSet import transport — POST to /api/dataValueSets (basic auth). */
export async function dhims2Transport(cfg: AdapterAuthConfig, payload: unknown): Promise<TransportResult> {
  let res: Response;
  try {
    res = await fetch(`${cfg.url.replace(/\/$/, '')}/api/dataValueSets`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: basicAuth(cfg) },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Network failure (upstream unreachable) — the engine keeps the row queued
    // with backoff rather than losing it (docs/08 §3).
    return { ok: false, error: `DHIMS2 unreachable: ${err instanceof Error ? err.message : 'network error'}` };
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return { ok: false, error: `DHIMS2 rejected submission: HTTP ${res.status}${body ? ` — ${body.slice(0, 200)}` : ''}` };
  }
  let remoteId: string | undefined;
  try {
    const parsed = (await res.json()) as { response?: { importSummaries?: Array<{ uid?: string }> } };
    remoteId = parsed.response?.importSummaries?.[0]?.uid;
  } catch {
    /* no acknowledgement id — delivery still succeeded */
  }
  return { ok: true, remoteId };
}
