// =============================================================================
// AI services (docs/22 Phase 7 — spec §82–83).
//
// Every output carries the mandatory disclosure that it is AI-generated and
// requires professional verification — the platform never presents machine
// output as clinical fact. Because GIHM-HIS is offline-first and truthful
// (never fabricated data), these services are DETERMINISTIC: they compute
// from the platform's own records rather than calling an external model:
//
//   • documentation assist — a structured SOAP-style note draft assembled
//     from the encounter's own complaint, vitals, triage, diagnoses, orders
//   • duplicate detection — the MPI matcher (lib/mpi) ranked as candidates
//   • forecasting — a linear-trend projection of the live weekly indicator
//     series (the same series the anomaly detector uses), honest about
//     insufficient history
//
// An external AI provider can be swapped in behind these same endpoints later;
// the contract (disclaimer + basedOn provenance) stays identical.
// -----------------------------------------------------------------------------

import type { PrismaClient } from '@prisma/client';
import type { AuthUser } from '../../types.js';
import { httpErrors } from '../../lib/http.js';
import { scoreCandidates } from '../../lib/mpi.js';
import { assertPatientAccess } from '../patients/service.js';
import { facilityScope } from '../../lib/scope.js';
import { INDICATORS, computeIndicators, callerScopeOf } from '../reports/compute.js';

/** Mandatory disclosure for every AI output (spec §82–83). */
export const AI_DISCLAIMER = 'AI-generated — requires professional verification. Draft output only; a licensed professional must review and approve before it becomes part of the record.';

/** The deterministic engine's provenance label (no external model involved). */
export const AI_METHOD = 'deterministic — computed live from platform records (no external AI model)';

export interface AiDraftNote {
  draft: string;
  disclaimer: string;
  method: string;
  generatedAt: string;
  basedOn: string[];
}

export interface AiDuplicateReview {
  patient: { id: string; mrn: string; fullName: string };
  candidates: Array<{
    patientId: string;
    mrn: string;
    fullName: string;
    dateOfBirth: string | null;
    phone: string | null;
    score: number;
    matchedOn: string[];
  }>;
  disclaimer: string;
  method: string;
  generatedAt: string;
  basedOn: string[];
}

export interface StockForecastHistoryPoint {
  weekStart: string; // 'YYYY-MM-DD'
  issued: number;
}

export interface StockForecast {
  stockItem: {
    id: string;
    name: string;
    category: string;
    unit: string;
    quantity: number;
    minStock: number;
    reorderLevel: number;
    batch: string | null;
    expiryDate: string | null;
  };
  /** Weekly ISSUE outflows over the analysis window (the consumption series). */
  history: StockForecastHistoryPoint[];
  /** Projected consumption next month (point + 95% band). */
  projectedMonthlyDemand: number | null;
  lower: number | null;
  upper: number | null;
  /** Stock left at the projected consumption rate (null when no consumption). */
  weeksOfStockRemaining: number | null;
  runOutAt: string | null;
  status: 'OK' | 'LOW' | 'OUT' | 'INSUFFICIENT_DATA';
  disclaimer: string;
  method: string;
  generatedAt: string;
  basedOn: string[];
  available: boolean;
  note: string | null;
}

export interface AiForecastPoint {
  period: string; // 'YYYY-MM' for monthly projections
  value: number | null;
  lower: number | null;
  upper: number | null;
}

export interface AiForecast {
  indicator: string;
  name: string;
  unit: string;
  months: AiForecastPoint[];
  disclaimer: string;
  method: string;
  generatedAt: string;
  basedOn: string[];
  /** Honest when the series had too little history to project. */
  available: boolean;
  note: string | null;
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// -----------------------------------------------------------------------------
// 1. Documentation assist — SOAP draft from the encounter's own records.
// -----------------------------------------------------------------------------

const VITAL_LABELS: Array<[keyof EncounterVitals, string, (v: number) => string]> = [
  ['temperature', 'Temp', (v) => `${v.toFixed(1)}°C`],
  ['pulse', 'Pulse', (v) => `${v} bpm`],
  ['respiratoryRate', 'RR', (v) => `${v}/min`],
  ['systolicBp', 'BP', (v) => ''], // handled with diastolic below
  ['spo2', 'SpO₂', (v) => `${v}%`],
  ['weightKg', 'Weight', (v) => `${v} kg`],
];

type EncounterVitals = {
  temperature: number | null;
  pulse: number | null;
  respiratoryRate: number | null;
  systolicBp: number | null;
  diastolicBp: number | null;
  spo2: number | null;
  weightKg: number | null;
  heightCm: number | null;
  painScore: number | null;
};

function vitalsLine(v: EncounterVitals): string {
  const parts: string[] = [];
  for (const [key, label, fmt] of VITAL_LABELS) {
    const val = v[key];
    if (typeof val === 'number') {
      if (key === 'systolicBp') {
        if (typeof v.diastolicBp === 'number') parts.push(`BP ${val}/${v.diastolicBp} mmHg`);
        continue;
      }
      parts.push(`${label} ${fmt(val)}`);
    }
  }
  if (typeof v.painScore === 'number') parts.push(`Pain ${v.painScore}/10`);
  return parts.length ? parts.join(' · ') : 'No vitals recorded';
}

/**
 * Build a SOAP-style draft note from an encounter. Every line is drawn from
 * the encounter's own records — the draft never adds information the platform
 * does not hold (no fabrication). The clinician reviews and edits before
 * saving; the returned draft is not written to the record automatically.
 */
export async function buildDraftNote(db: PrismaClient, u: AuthUser, encounterId: string): Promise<AiDraftNote> {
  const encounter = await db.encounter.findFirst({
    where: { id: encounterId },
    include: {
      patient: { select: { id: true, mrn: true, fullName: true, dateOfBirth: true, sex: true } },
      diagnoses: { orderBy: { createdAt: 'asc' } },
      labOrders: { orderBy: { createdAt: 'asc' } },
      prescriptions: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!encounter) throw httpErrors.notFound('Encounter not found');
  await assertPatientAccess(db, u, encounter.patient.id);

  const vitals = {
    temperature: encounter.temperature,
    pulse: encounter.pulse,
    respiratoryRate: encounter.respiratoryRate,
    systolicBp: encounter.systolicBp,
    diastolicBp: encounter.diastolicBp,
    spo2: encounter.spo2,
    weightKg: encounter.weightKg,
    heightCm: encounter.heightCm,
    painScore: encounter.painScore,
  };

  const basedOn: string[] = [];
  const lines: string[] = [];
  lines.push(`DRAFT CLINICAL NOTE — ${encounter.type} encounter · ${fmtDate(encounter.createdAt)}`);
  lines.push(`Patient: ${encounter.patient.fullName} (${encounter.patient.mrn})`);
  lines.push('');
  lines.push('S — Subjective');
  if (encounter.presentingComplaint) {
    lines.push(`  Chief complaint: ${encounter.presentingComplaint}`);
    basedOn.push('presentingComplaint');
  } else {
    lines.push('  Chief complaint: (not recorded)');
  }
  if (encounter.triageCategory) {
    lines.push(`  Triage: ${encounter.triageCategory}`);
    basedOn.push('triageCategory');
  }
  lines.push('');
  lines.push('O — Objective');
  lines.push(`  ${vitalsLine(vitals)}`);
  basedOn.push('vitals');
  if (encounter.diagnoses.length > 0) {
    lines.push(`  Diagnoses: ${encounter.diagnoses.map((d) => `${d.description} (${d.code})`).join('; ')}`);
    basedOn.push('diagnoses');
  } else if (encounter.diagnosisSummary) {
    lines.push(`  Diagnosis summary: ${encounter.diagnosisSummary}`);
    basedOn.push('diagnosisSummary');
  }
  lines.push('');
  lines.push('A — Assessment');
  if (encounter.diagnoses.length > 0) {
    lines.push(`  Working impression: ${encounter.diagnoses.map((d) => d.description).join('; ')}`);
  } else if (encounter.diagnosisSummary) {
    lines.push(`  Working impression: ${encounter.diagnosisSummary}`);
  } else {
    lines.push('  Working impression: (pending clinician assessment)');
  }
  lines.push('');
  lines.push('P — Plan');
  const labs = encounter.labOrders.filter((o) => o.status !== 'CANCELLED');
  const rxs = encounter.prescriptions.filter((p) => p.status === 'ACTIVE');
  if (labs.length > 0) {
    lines.push(`  Investigations: ${labs.map((o) => o.test).join('; ')}`);
    basedOn.push('labOrders');
  }
  if (rxs.length > 0) {
    lines.push(`  Medications: ${rxs.map((p) => `${p.medicine}${p.dosage ? ` ${p.dosage}` : ''}${p.frequency ? ` ${p.frequency}` : ''}`).join('; ')}`);
    basedOn.push('prescriptions');
  }
  if (labs.length === 0 && rxs.length === 0) {
    lines.push('  (no active orders or prescriptions in this encounter)');
  }

  return {
    draft: lines.join('\n'),
    disclaimer: AI_DISCLAIMER,
    method: AI_METHOD,
    generatedAt: new Date().toISOString(),
    basedOn,
  };
}

// -----------------------------------------------------------------------------
// 2. Duplicate detection — MPI candidates ranked for the patient, AI-flagged.
// -----------------------------------------------------------------------------

/**
 * Score a patient against every other record in the caller's scope using the
 * MPI matcher, returning candidates ranked by confidence. Never merges — the
 * review surfaces matches for a professional to decide (spec §12, §83).
 */
export async function reviewDuplicates(db: PrismaClient, u: AuthUser, patientId: string): Promise<AiDuplicateReview> {
  const patient = await assertPatientAccess(db, u, patientId);
  const others = await db.patient.findMany({
    where: { ...facilityScope(u), id: { not: patientId } },
    take: 200,
  });
  const candidates = scoreCandidates(others, {
    fullName: patient.fullName,
    dateOfBirth: patient.dateOfBirth,
    phone: patient.phone,
    ghanaCard: patient.ghanaCard,
    nhisNumber: patient.nhisNumber,
    passport: patient.passport,
    sex: patient.sex,
  }).slice(0, 10);

  return {
    patient: { id: patient.id, mrn: patient.mrn, fullName: patient.fullName },
    candidates,
    disclaimer: AI_DISCLAIMER,
    method: AI_METHOD,
    generatedAt: new Date().toISOString(),
    basedOn: ['name', 'dateOfBirth', 'phone', 'ghanaCard', 'nhisNumber', 'passport', 'sex'].filter((f) => patient[f as keyof typeof patient] !== null && patient[f as keyof typeof patient] !== undefined),
  };
}

// -----------------------------------------------------------------------------
// 3. Forecasting — linear-trend projection of the live weekly indicator series.
// -----------------------------------------------------------------------------

const MIN_WEEKS = 6; // honest minimum history before projecting (mirrors anomalies)

/**
 * Project a collected indicator forward by `months` using least-squares linear
 * trend over the last 16 ISO weeks of LIVE platform data (same series the
 * anomaly detector analyses). Honest: with fewer than MIN_WEEKS non-null weeks
 * the projection is refused (`available: false`), never fabricated.
 */
export async function forecastIndicator(db: PrismaClient, u: AuthUser, indicatorCode: string, months: number): Promise<AiForecast> {
  const def = INDICATORS.find((d) => d.code === indicatorCode && d.collected);
  if (!def) throw httpErrors.badRequest(`Unknown or not-collected indicator: ${indicatorCode}`);
  if (months < 1 || months > 24) throw httpErrors.badRequest('months must be between 1 and 24');

  const scopeOf = callerScopeOf(db, u);
  // 16 ISO-week buckets ending now (the anomaly detector's analysis depth).
  const weeks: Array<{ start: Date; end: Date }> = [];
  const to = new Date();
  const from = new Date(to.getTime() - 16 * 7 * 86_400_000);
  for (let i = 0; i < 16; i++) {
    const start = new Date(from.getTime() + i * 7 * 86_400_000);
    weeks.push({ start, end: new Date(start.getTime() + 7 * 86_400_000) });
  }

  const perWeek = await Promise.all(
    weeks.map(async (w) => (await computeIndicators(db, u, { gte: w.start, lt: w.end }, scopeOf))[def.code] ?? null),
  );
  const points = perWeek.map((v, i) => ({ x: i, y: v })).filter((p): p is { x: number; y: number } => typeof p.y === 'number');
  const nonNull = points.length;

  if (nonNull < MIN_WEEKS) {
    return {
      indicator: def.code,
      name: def.name,
      unit: def.unit,
      months: [],
      disclaimer: AI_DISCLAIMER,
      method: AI_METHOD,
      generatedAt: new Date().toISOString(),
      basedOn: [`${nonNull}/${weeks.length} weeks with data`],
      available: false,
      note: `Insufficient history — only ${nonNull} of the last ${weeks.length} weeks had data; at least ${MIN_WEEKS} are required for a projection (never fabricated).`,
    };
  }

  // Least-squares linear fit over (weekIndex → value).
  const n = points.length;
  const xMean = points.reduce((a, p) => a + p.x, 0) / n;
  const yMean = points.reduce((a, p) => a + p.y, 0) / n;
  const sxx = points.reduce((a, p) => a + (p.x - xMean) ** 2, 0);
  const sxy = points.reduce((a, p) => a + (p.x - xMean) * (p.y - yMean), 0);
  const slope = sxx > 0 ? sxy / sxx : 0;
  const intercept = yMean - slope * xMean;
  // Residual standard deviation → confidence band.
  const residuals = points.map((p) => p.y - (intercept + slope * p.x));
  const std = Math.sqrt(residuals.reduce((a, r) => a + r ** 2, 0) / Math.max(1, n - 1));

  const lastWeek = Math.max(...points.map((p) => p.x));
  const isRate = def.unit === '%';
  const pointsOut: AiForecastPoint[] = [];
  for (let m = 1; m <= months; m++) {
    // Project to the end of month m: weeks ahead = m * 4.345 (avg month length).
    const weeksAhead = m * 4.345;
    const endX = lastWeek + weeksAhead;
    const projected = intercept + slope * endX;
    // Count indicators aggregate over the month (≈4.345 weeks × weekly rate);
    // rates project as the trend value itself.
    const value = isRate ? projected : projected * 4.345;
    const band = isRate ? std : std * 4.345;
    const period = new Date(to.getTime() + m * 30 * 86_400_000).toISOString().slice(0, 7);
    pointsOut.push({
      period,
      value: Math.round(value * 10) / 10,
      lower: Math.max(0, Math.round((value - 1.96 * band) * 10) / 10),
      upper: Math.round((value + 1.96 * band) * 10) / 10,
    });
  }

  return {
    indicator: def.code,
    name: def.name,
    unit: def.unit,
    months: pointsOut,
    disclaimer: AI_DISCLAIMER,
    method: AI_METHOD,
    generatedAt: new Date().toISOString(),
    basedOn: [`${nonNull} weekly points (last 16 weeks) · linear trend`],
    available: true,
    note: `Linear-trend projection from ${nonNull} weekly points; treat as indicative planning input only.`,
  };
}

// -----------------------------------------------------------------------------
// 4. Predictive analytics — stock consumption forecasting.
//
// Projects next-month demand for a stock item from its LIVE ISSUE outflows
// (the same least-squares linear trend the indicator forecast uses) and
// derives how long the current stock will last (run-out date). Aggregate-only
// — no patient-identifiable data — and honest: with too little consumption
// history the projection is refused rather than fabricated.
// -----------------------------------------------------------------------------

const STOCK_MIN_WEEKS = 6; // honest minimum before projecting consumption
const STOCK_WINDOW_WEEKS = 12; // consumption history window

/**
 * Forecast demand for one stock item in the caller's scope. Consumption is
 * the weekly sum of ISSUE movements over the last 12 weeks; next-month demand
 * is the linear-trend projection (weekly rate × 4.345 weeks) with a 95%
 * band. weeksOfStockRemaining = quantity ÷ weekly rate; a zero-consumption
 * item is honestly reported (no run-out) rather than divided by zero.
 */
export async function forecastStockDemand(db: PrismaClient, u: AuthUser, stockItemId: string): Promise<StockForecast> {
  const item = await db.stockItem.findFirst({
    where: { id: stockItemId, ...facilityScope(u) },
  });
  if (!item) throw httpErrors.notFound('Stock item not found in your scope');

  const to = new Date();
  const from = new Date(to.getTime() - STOCK_WINDOW_WEEKS * 7 * 86_400_000);
  const buckets: Array<{ start: Date; end: Date }> = [];
  for (let i = 0; i < STOCK_WINDOW_WEEKS; i++) {
    const start = new Date(from.getTime() + i * 7 * 86_400_000);
    buckets.push({ start, end: new Date(start.getTime() + 7 * 86_400_000) });
  }

  const movements = await db.stockMovement.findMany({
    where: { stockItemId: item.id, type: 'ISSUE', createdAt: { gte: from, lt: to } },
    select: { quantity: true, createdAt: true },
  });

  const issuedPerWeek = buckets.map((b, i) => ({
    x: i,
    y: movements.filter((m) => m.createdAt >= b.start && m.createdAt < b.end).reduce((a, m) => a + m.quantity, 0),
  }));
  const history: StockForecastHistoryPoint[] = buckets.map((b, i) => ({ weekStart: b.start.toISOString().slice(0, 10), issued: issuedPerWeek[i]!.y }));
  const consumed = issuedPerWeek.filter((p) => p.y > 0);

  // OUT is a fact (quantity is 0), not a forecast — report it regardless of history.
  if (item.quantity <= 0) {
    return {
      stockItem: toStockRef(item),
      history,
      projectedMonthlyDemand: null,
      lower: null,
      upper: null,
      weeksOfStockRemaining: 0,
      runOutAt: new Date().toISOString().slice(0, 10),
      status: 'OUT',
      disclaimer: AI_DISCLAIMER,
      method: AI_METHOD,
      generatedAt: new Date().toISOString(),
      basedOn: [`current stock ${item.quantity}`],
      available: true,
      note: 'Stock is at zero — restock is required immediately (factual, not a projection).',
    };
  }

  if (consumed.length < STOCK_MIN_WEEKS) {
    return {
      stockItem: toStockRef(item),
      history,
      projectedMonthlyDemand: null,
      lower: null,
      upper: null,
      weeksOfStockRemaining: null,
      runOutAt: null,
      status: 'INSUFFICIENT_DATA',
      disclaimer: AI_DISCLAIMER,
      method: AI_METHOD,
      generatedAt: new Date().toISOString(),
      basedOn: [`${consumed.length}/${STOCK_WINDOW_WEEKS} weeks with ISSUE activity`],
      available: false,
      note: `Insufficient consumption history — only ${consumed.length} of the last ${STOCK_WINDOW_WEEKS} weeks had ISSUE activity; at least ${STOCK_MIN_WEEKS} are required for a projection (never fabricated).`,
    };
  }

  // Least-squares linear fit over (weekIndex → issued).
  const n = consumed.length;
  const xMean = consumed.reduce((a, p) => a + p.x, 0) / n;
  const yMean = consumed.reduce((a, p) => a + p.y, 0) / n;
  const sxx = consumed.reduce((a, p) => a + (p.x - xMean) ** 2, 0);
  const sxy = consumed.reduce((a, p) => a + (p.x - xMean) * (p.y - yMean), 0);
  const slope = sxx > 0 ? sxy / sxx : 0;
  const intercept = yMean - slope * xMean;
  const residuals = consumed.map((p) => p.y - (intercept + slope * p.x));
  const std = Math.sqrt(residuals.reduce((a, r) => a + r ** 2, 0) / Math.max(1, n - 1));

  const lastWeek = Math.max(...consumed.map((p) => p.x));
  // Next month ≈ 4.345 weeks at the projected weekly rate.
  const weeklyRate = intercept + slope * (lastWeek + 4.345);
  const monthlyDemand = Math.max(0, weeklyRate * 4.345);
  const band = Math.max(0, std * 4.345);
  const weeksRemaining = weeklyRate > 0 ? item.quantity / weeklyRate : null;
  const runOutAt = weeksRemaining !== null ? new Date(to.getTime() + weeksRemaining * 7 * 86_400_000).toISOString().slice(0, 10) : null;
  const status: StockForecast['status'] = weeksRemaining !== null && weeksRemaining <= 2 ? 'LOW' : 'OK';

  return {
    stockItem: toStockRef(item),
    history,
    projectedMonthlyDemand: Math.round(monthlyDemand * 10) / 10,
    lower: Math.round(Math.max(0, monthlyDemand - 1.96 * band) * 10) / 10,
    upper: Math.round((monthlyDemand + 1.96 * band) * 10) / 10,
    weeksOfStockRemaining: weeksRemaining !== null ? Math.round(weeksRemaining * 10) / 10 : null,
    runOutAt,
    status,
    disclaimer: AI_DISCLAIMER,
    method: AI_METHOD,
    generatedAt: new Date().toISOString(),
    basedOn: [`${consumed.length} weeks with ISSUE activity (last 12) · current stock ${item.quantity} ${item.unit}`],
    available: true,
    note: weeksRemaining !== null && weeksRemaining <= 2
      ? `Projected to run out in ~${Math.round(weeksRemaining)} week(s) — plan a reorder.`
      : 'Linear-trend projection from live consumption; treat as indicative planning input only.',
  };
}

function toStockRef(item: {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minStock: number;
  reorderLevel: number;
  batch: string | null;
  expiryDate: Date | null;
}): StockForecast['stockItem'] {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    unit: item.unit,
    quantity: item.quantity,
    minStock: item.minStock,
    reorderLevel: item.reorderLevel,
    batch: item.batch,
    expiryDate: item.expiryDate ? item.expiryDate.toISOString().slice(0, 10) : null,
  };
}
