// =============================================================================
// Anomaly detection on indicator trends (spec §50, docs/14 §4).
//
// The indicator series are computed LIVE from platform records (same code as
// the report builder — docs/14 §3), bucketed by ISO week. A value is flagged
// when it deviates from the weekly mean by 2σ (medium) or 3σ (high) — the
// standard z-score heuristic. Detection is honest: indicators with fewer than
// MIN_POINTS non-null weeks, or zero variance, are reported as analyzed but
// unflagged rather than fabricated.
//
// Aggregate-only — no patient-identifiable data leaves the scope.
// -----------------------------------------------------------------------------

import type { PrismaClient } from '@prisma/client';
import type { AuthUser } from '../../types.js';
import { INDICATORS, computeIndicators, callerScopeOf } from './compute.js';

export const MIN_POINTS = 6; // weeks required before a mean/stddev is meaningful
export const MAX_WEEKS = 16; // hard cap on analysis depth (≈112 days)
export const HIGH_Z = 3;
export const MEDIUM_Z = 2;

export interface AnomalyFlag {
  weekStart: string; // ISO date of the bucket's first day
  value: number;
  expected: number; // weekly mean
  stddev: number;
  z: number;
  severity: 'high' | 'medium';
}

export interface AnomalySeries {
  code: string;
  name: string;
  dhims2Code: string;
  unit: string;
  /** True when the series had enough non-null weeks to be scored. */
  analyzed: boolean;
  /** Null where the bucket had no data for the indicator. */
  values: Array<{ weekStart: string; value: number | null }>;
  mean: number | null;
  stddev: number | null;
  flags: AnomalyFlag[];
}

export interface AnomalyResult {
  scope: string;
  from: string;
  to: string;
  bucket: 'week';
  minPoints: number;
  indicators: AnomalySeries[];
  summary: { analyzed: number; anomalies: number; high: number };
  method: string;
}

function weekBuckets(from: Date, to: Date): Array<{ start: Date; end: Date; label: string }> {
  const buckets: Array<{ start: Date; end: Date; label: string }> = [];
  let cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const end = new Date(to.getTime() + 86_400_000);
  while (cursor < end && buckets.length < MAX_WEEKS) {
    const next = new Date(cursor.getTime() + 7 * 86_400_000);
    buckets.push({ start: cursor, end: next, label: cursor.toISOString().slice(0, 10) });
    cursor = next;
  }
  return buckets;
}

function meanStd(values: number[]): { mean: number; stddev: number } {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (values.length < 2) return { mean, stddev: 0 };
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length - 1);
  return { mean, stddev: Math.sqrt(variance) };
}

const round = (n: number, d: number): number => Number(n.toFixed(d));

/**
 * Detect anomalies in the caller's scope for [from, to). Weekly buckets, live
 * indicator computation, z-score flagging. Scoped exactly like /reports/summary.
 */
export async function computeAnomalies(db: PrismaClient, u: AuthUser, from: Date, to: Date): Promise<AnomalyResult> {
  const scopeOf = callerScopeOf(db, u);
  const buckets = weekBuckets(from, to);
  // Every collected indicator, per bucket — parallel over buckets, sequential
  // indicator mapping afterwards (the aggregation is the expensive part).
  const perBucket = await Promise.all(
    buckets.map(async (b) => ({
      label: b.label,
      values: await computeIndicators(db, u, { gte: b.start, lt: b.end }, scopeOf),
    })),
  );

  const indicators: AnomalySeries[] = [];
  let analyzed = 0;
  let anomalies = 0;
  let high = 0;

  for (const def of INDICATORS) {
    if (!def.collected) continue;
    const values = perBucket.map((b) => ({
      weekStart: b.label,
      value: b.values[def.code] ?? null,
    }));
    const nonNull = values.filter((v): v is { weekStart: string; value: number } => typeof v.value === 'number');
    const scored = nonNull.length >= MIN_POINTS;
    const series: AnomalySeries = {
      code: def.code,
      name: def.name,
      dhims2Code: def.dhims2Code,
      unit: def.unit,
      analyzed: scored,
      values,
      mean: null,
      stddev: null,
      flags: [],
    };

    if (scored) {
      analyzed++;
      const { mean, stddev } = meanStd(nonNull.map((v) => v.value));
      series.mean = round(mean, 1);
      series.stddev = round(stddev, 1);
      if (stddev > 0) {
        for (const v of nonNull) {
          const z = (v.value - mean) / stddev;
          const absZ = Math.abs(z);
          if (absZ >= HIGH_Z) {
            series.flags.push({ weekStart: v.weekStart, value: v.value, expected: round(mean, 1), stddev: round(stddev, 1), z: round(z, 2), severity: 'high' });
            anomalies++;
            high++;
          } else if (absZ >= MEDIUM_Z) {
            series.flags.push({ weekStart: v.weekStart, value: v.value, expected: round(mean, 1), stddev: round(stddev, 1), z: round(z, 2), severity: 'medium' });
            anomalies++;
          }
        }
      }
    }
    indicators.push(series);
  }

  return {
    scope: u.scope,
    from: from.toISOString(),
    to: to.toISOString(),
    bucket: 'week',
    minPoints: MIN_POINTS,
    indicators,
    summary: { analyzed, anomalies, high },
    method: `Weekly z-score vs series mean — flagged at ≥${MEDIUM_Z}σ (medium) and ≥${HIGH_Z}σ (high); minimum ${MIN_POINTS} non-null weeks before scoring.`,
  };
}
