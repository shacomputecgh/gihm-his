// =============================================================================
// Scheduled reports (spec §149, docs/14 §5) — an authorised recipient list and
// a cadence (daily / weekly / monthly / quarterly / annual) whose runs are
// computed live from platform records and emailed by the report sweep. The
// scope is a snapshot taken at creation, so a schedule keeps working even if
// the creator's role later changes.
//
// Delivery is via the settings-driven SMTP channel (lib/mail.ts) — without an
// SMTP host configured a run is recorded as `skipped`, never a crash.
// -----------------------------------------------------------------------------

import type { PrismaClient, ReportDelivery, ScheduledReport } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { getSetting } from '../../lib/settings.js';
import { sendAlertEmail } from '../../lib/mail.js';
import { toCsv } from '../../lib/csv.js';
import { INDICATORS, computeIndicators, callerScopeOf, facilityListScope, facilityScopeOf } from './compute.js';
import { computeAnomalies } from './anomalies.js';
import type { AuthUser } from '../../types.js';

export const CADENCES = ['daily', 'weekly', 'monthly', 'quarterly', 'annual'] as const;
export type Cadence = (typeof CADENCES)[number];
export const REPORT_TYPES = ['summary', 'completeness', 'anomalies'] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

/** Validate the mutable schedule fields; returns a cleaned cadence config. */
export function validateSchedule(input: {
  name?: unknown;
  reportType?: unknown;
  cadence?: unknown;
  runTime?: unknown;
  dayOfWeek?: unknown;
  dayOfMonth?: unknown;
  recipients?: unknown;
  groupBy?: unknown;
}): {
  name: string;
  reportType: ReportType;
  cadence: Cadence;
  runTime: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  recipients: string[];
  groupBy: 'none' | 'facility' | 'district' | 'region';
} {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name || name.length > 120) throw httpErrors.badRequest('A schedule name (≤120 chars) is required');
  if (!REPORT_TYPES.includes(input.reportType as ReportType)) throw httpErrors.badRequest(`reportType must be one of ${REPORT_TYPES.join(' | ')}`);
  if (!CADENCES.includes(input.cadence as Cadence)) throw httpErrors.badRequest(`cadence must be one of ${CADENCES.join(' | ')}`);
  const cadence = input.cadence as Cadence;

  const runTime = typeof input.runTime === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(input.runTime) ? input.runTime : '';
  if (!runTime) throw httpErrors.badRequest('runTime must be HH:MM in 24-hour format');

  let dayOfWeek: number | null = null;
  if (cadence === 'weekly') {
    const d = Number(input.dayOfWeek);
    if (!Number.isInteger(d) || d < 0 || d > 6) throw httpErrors.badRequest('Weekly schedules need dayOfWeek 0 (Sunday) – 6 (Saturday)');
    dayOfWeek = d;
  }
  let dayOfMonth: number | null = null;
  if (cadence === 'monthly' || cadence === 'quarterly' || cadence === 'annual') {
    const d = Number(input.dayOfMonth);
    if (!Number.isInteger(d) || d < 1 || d > 28) throw httpErrors.badRequest(`${cadence} schedules need dayOfMonth 1–28`);
    dayOfMonth = d;
  }

  const recipients = (typeof input.recipients === 'string' ? input.recipients : Array.isArray(input.recipients) ? input.recipients.join(',') : '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  // No silent dropping: every entry must be a valid address (a typo like
  // "opsdemo.gh" is rejected, not quietly ignored).
  if (recipients.length === 0 || recipients.some((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))) {
    throw httpErrors.badRequest('At least one valid recipient email is required');
  }

  const groupBy = (typeof input.groupBy === 'string' ? input.groupBy : 'none') as 'none' | 'facility' | 'district' | 'region';
  if (!['none', 'facility', 'district', 'region'].includes(groupBy)) throw httpErrors.badRequest('groupBy must be none | facility | district | region');

  return { name, reportType: input.reportType as ReportType, cadence, runTime, dayOfWeek, dayOfMonth, recipients: [...new Set(recipients)], groupBy };
}

/** Scope snapshot for the schedule (copied from the creating user). */
export function snapshotForUser(u: AuthUser): { scope: string; facilityId: string | null; regionId: string | null; districtId: string | null } {
  return { scope: u.scope, facilityId: u.facilityId ?? null, regionId: u.regionId ?? null, districtId: u.districtId ?? null };
}

/** Rebuild an AuthUser from a stored snapshot — the scope helpers only read these fields. */
export function userFromSnapshot(s: { scope: string; facilityId?: string | null; regionId?: string | null; districtId?: string | null }): AuthUser {
  return {
    id: 'scheduled-report',
    email: 'scheduled-report@local',
    fullName: 'Scheduled reports',
    roleCode: 'SYSTEM',
    roleName: 'Scheduled reports',
    scope: s.scope,
    permissions: [],
    organizationId: null,
    facilityId: s.facilityId ?? null,
    regionId: s.regionId ?? null,
    districtId: s.districtId ?? null,
    regionName: null,
    districtName: null,
    facilityName: null,
  };
}

const DAY = 24 * 60 * 60 * 1000;

/** Prisma range shape from an inclusive [from, to) period. */
const asRange = (p: { from: Date; to: Date }): { gte: Date; lt: Date } => ({ gte: p.from, lt: p.to });

/** The [from, to) period a run of the given cadence covers (runAt = midnight of run day). */
export function periodForCadence(cadence: Cadence, runAt: Date): { from: Date; to: Date } {
  const day = (d: Date): Date => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const start = day(runAt);
  switch (cadence) {
    case 'daily':
      return { from: new Date(start.getTime() - DAY), to: start };
    case 'weekly':
      return { from: new Date(start.getTime() - 7 * DAY), to: start };
    case 'monthly': {
      const first = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - 1, 1));
      const next = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
      return { from: first, to: next };
    }
    case 'quarterly': {
      const q = Math.floor(start.getUTCMonth() / 3);
      const first = new Date(Date.UTC(start.getUTCFullYear(), q * 3 - 3, 1));
      const next = new Date(Date.UTC(start.getUTCFullYear(), q * 3, 1));
      return { from: first, to: next };
    }
    case 'annual': {
      const from = new Date(Date.UTC(start.getUTCFullYear() - 1, 0, 1));
      const to = new Date(Date.UTC(start.getUTCFullYear(), 0, 1));
      return { from, to };
    }
  }
}

/** HH:MM on a given UTC day. */
function atTime(date: Date, runTime: string): Date {
  const [h, m] = runTime.split(':').map(Number);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), h, m));
}

/**
 * Next run time after `after` for a cadence config. Pure — unit-testable.
 * Monthly/quarterly/annual use dayOfMonth (1–28, clamped by month length).
 */
export function nextRunAt(
  after: Date,
  cfg: { cadence: Cadence; runTime: string; dayOfWeek: number | null; dayOfMonth: number | null },
): Date {
  const runTime = cfg.runTime || '08:00';
  switch (cfg.cadence) {
    case 'daily': {
      const candidate = atTime(after, runTime);
      return candidate.getTime() > after.getTime() ? candidate : new Date(candidate.getTime() + DAY);
    }
    case 'weekly': {
      const dow = cfg.dayOfWeek ?? 1;
      let candidate = atTime(after, runTime);
      while (candidate.getUTCDay() !== dow || candidate.getTime() <= after.getTime()) candidate = new Date(candidate.getTime() + DAY);
      return candidate;
    }
    case 'monthly': {
      const dom = Math.min(cfg.dayOfMonth ?? 1, 28);
      let candidate = atTime(after, runTime);
      while (candidate.getUTCDate() !== dom || candidate.getTime() <= after.getTime()) candidate = new Date(candidate.getTime() + DAY);
      return candidate;
    }
    case 'quarterly': {
      const dom = Math.min(cfg.dayOfMonth ?? 1, 28);
      let candidate = atTime(after, runTime);
      while (candidate.getUTCMonth() % 3 !== 0 || candidate.getUTCDate() !== dom || candidate.getTime() <= after.getTime()) {
        candidate = new Date(candidate.getTime() + DAY);
      }
      return candidate;
    }
    case 'annual': {
      const dom = Math.min(cfg.dayOfMonth ?? 1, 28);
      let candidate = atTime(after, runTime);
      while (candidate.getUTCMonth() !== 0 || candidate.getUTCDate() !== dom || candidate.getTime() <= after.getTime()) {
        candidate = new Date(candidate.getTime() + DAY);
      }
      return candidate;
    }
  }
}

const fmt = (n: number, unit: string): string => (unit === 'GHS' ? `GHS ${n.toLocaleString('en-GH', { minimumFractionDigits: 2 })}` : `${n.toLocaleString('en-GH')} ${unit}`);

/** Build the email text/html for one report run. */
export function renderReportEmail(
  schedule: Pick<ScheduledReport, 'name' | 'reportType' | 'groupBy'>,
  period: { from: Date; to: Date },
  content: {
    summary?: { scope: string; indicators: Array<{ name: string; dhims2Code: string; unit: string; value: number | null }>; generatedAt: string };
    completeness?: { facilities: { expected: number; reported: number }; completenessPct: number; rows: Array<{ code: string; name: string; reported: boolean }> };
    anomalies?: { summary: { analyzed: number; anomalies: number; high: number }; indicators: Array<{ name: string; flags: Array<{ weekStart: string; value: number; expected: number; z: number; severity: string }> }> };
  },
): { subject: string; text: string; html: string } {
  const from = period.from.toISOString().slice(0, 10);
  const to = new Date(period.to.getTime() - DAY).toISOString().slice(0, 10);
  const title = `${schedule.name} — ${from} to ${to}`;
  const lines: string[] = [`GIHM-HIS scheduled report: ${title}`, '', 'Aggregate indicators computed live from platform records (docs/14).', ''];
  const htmlRows: string[] = [];

  if (schedule.reportType === 'summary' && content.summary) {
    for (const ind of content.summary.indicators) {
      const v = ind.value === null ? 'Not collected' : fmt(ind.value, ind.unit);
      lines.push(`${ind.name} (DHIMS-II ${ind.dhims2Code}): ${v}`);
      htmlRows.push(`<tr><td>${ind.name}</td><td>DHIMS-II ${ind.dhims2Code}</td><td align="right">${v}</td></tr>`);
    }
  } else if (schedule.reportType === 'completeness' && content.completeness) {
    const { facilities, completenessPct, rows } = content.completeness;
    lines.push(`Facilities reporting: ${facilities.reported} of ${facilities.expected} (${completenessPct}%)`);
    for (const r of rows.slice(0, 200)) lines.push(`  ${r.reported ? '✓' : '✗'} ${r.name} (${r.code})`);
    if (rows.length > 200) lines.push(`  … and ${rows.length - 200} more`);
    htmlRows.push(`<tr><td colspan="3">Facilities reporting: ${facilities.reported} of ${facilities.expected} (${completenessPct}%)</td></tr>`);
    for (const r of rows.slice(0, 200)) htmlRows.push(`<tr><td>${r.reported ? '✓' : '✗'}</td><td>${r.name}</td><td>${r.code}</td></tr>`);
  } else if (schedule.reportType === 'anomalies' && content.anomalies) {
    const s = content.anomalies.summary;
    lines.push(`Anomaly scan: ${s.analyzed} indicators analysed, ${s.anomalies} unusual weeks (${s.high} high).`);
    for (const ind of content.anomalies.indicators) {
      for (const f of ind.flags.slice(0, 10)) {
        lines.push(`  ${ind.name}: week of ${f.weekStart} = ${f.value} (expected ${f.expected}, z=${f.z.toFixed(1)}) [${f.severity.toUpperCase()}]`);
      }
    }
    if (s.anomalies === 0) lines.push('  No anomalies flagged — all weekly values within expected variation.');
    htmlRows.push(`<tr><td colspan="3">Anomaly scan: ${s.analyzed} analysed, ${s.anomalies} unusual weeks (${s.high} high)</td></tr>`);
    for (const ind of content.anomalies.indicators) {
      for (const f of ind.flags.slice(0, 10)) htmlRows.push(`<tr><td>${ind.name}</td><td>week of ${f.weekStart}</td><td align="right">${f.value} (expected ${f.expected}, z=${f.z.toFixed(1)}) ${f.severity.toUpperCase()}</td></tr>`);
    }
  }

  const html = `<div style="font-family:system-ui,sans-serif;color:#1e293b"><h2>${schedule.name}</h2><p>Period <strong>${from}</strong> → <strong>${to}</strong> · scope ${content.summary?.scope ?? schedule.reportType}</p><table style="border-collapse:collapse;width:100%">${htmlRows.map((r) => `<tr style="border-bottom:1px solid #e2e8f0">${r}</tr>`).join('')}</table><p style="color:#64748b;font-size:12px">Generated by GIHM-HIS — aggregate data only, no patient-identifiable rows.</p></div>`;
  return { subject: title, text: lines.join('\n'), html };
}

/** Build the period's report content for one schedule (aggregates only). */
export async function buildReportContent(
  db: PrismaClient,
  schedule: Pick<ScheduledReport, 'reportType' | 'scope' | 'facilityId' | 'regionId' | 'districtId'>,
  period: { from: Date; to: Date },
): Promise<Parameters<typeof renderReportEmail>[2]> {
  const u = userFromSnapshot(schedule);
  if (schedule.reportType === 'anomalies') {
    const result = await computeAnomalies(db, u, period.from, period.to);
    return {
      anomalies: {
        summary: result.summary,
        indicators: result.indicators.map((i) => ({ name: i.name, flags: i.flags })),
      },
    };
  }
  if (schedule.reportType === 'completeness') {
    const facilities = await db.facility.findMany({ where: facilityListScope(u), select: { id: true, code: true, name: true }, take: 300 });
    const rows: Array<{ code: string; name: string; reported: boolean }> = [];
    const computed = await Promise.all(
      facilities.map(async (f) => {
        const s = facilityScopeOf(f.id);
        const r = asRange(period);
        const [encounters, admissions, labs, cases, immunizations] = await Promise.all([
          db.encounter.count({ where: { ...(await s('encounter')), createdAt: r } }),
          db.admission.count({ where: { ...(await s('admission')), admittedAt: r } }),
          db.labOrder.count({ where: { ...(await s('labOrder')), createdAt: r } }),
          db.diseaseCase.count({ where: { ...(await s('diseaseCase')), reportedAt: r } }),
          db.immunization.count({ where: { ...(await s('immunization')), administeredAt: r } }),
        ]);
        return { code: f.code, name: f.name, reported: encounters + admissions + labs + cases + immunizations > 0 };
      }),
    );
    for (const c of computed) rows.push(c);
    const reported = rows.filter((r) => r.reported).length;
    return { completeness: { facilities: { expected: rows.length, reported }, completenessPct: rows.length > 0 ? Math.round((reported / rows.length) * 100) : 0, rows } };
  }
  const overall = await computeIndicators(db, u, asRange(period), callerScopeOf(db, u));
  const indicators = INDICATORS.filter((d) => d.collected).map((def) => ({ name: def.name, dhims2Code: def.dhims2Code, unit: def.unit, value: overall[def.code] ?? null }));
  return { summary: { scope: schedule.scope, indicators, generatedAt: new Date().toISOString() } };
}

/**
 * Run one schedule now: compute the report, email the authorised recipients,
 * record the delivery row, and advance nextRunAt. Never throws — failures
 * land in lastError / the delivery row so the sweep keeps moving.
 */
export async function runSchedule(
  db: PrismaClient,
  schedule: ScheduledReport,
  at: Date,
  opts?: { mailToTest?: (to: string, subject: string, text: string, html: string) => Promise<{ dispatched: boolean; note: string; messageId?: string }> },
): Promise<{ status: 'sent' | 'skipped' | 'failed'; note: string; period: { from: Date; to: Date } }> {
  const period = periodForCadence(schedule.cadence as Cadence, at);
  try {
    const content = await buildReportContent(db, schedule, period);
    const { subject, text, html } = renderReportEmail(schedule, period, content);
    const recipientList = schedule.recipients.split(',').map((e) => e.trim()).filter(Boolean);
    // Aggregate the fan-out: a failure on ANY recipient marks the run skipped,
    // and the note lists who got it — a later success never masks an earlier miss.
    const outcomes: string[] = [];
    let allDispatched = recipientList.length > 0;
    let lastMessageId: string | undefined;
    for (const to of recipientList) {
      const result = opts?.mailToTest ? await opts.mailToTest(to, subject, text, html) : await sendAlertEmail({ to, subject, text, html });
      allDispatched = allDispatched && result.dispatched;
      if (result.messageId) lastMessageId = result.messageId;
      outcomes.push(`${to}: ${result.dispatched ? 'sent' : result.note}`);
    }
    const note = outcomes.join('; ') || 'No recipients';
    await db.reportDelivery.create({ data: { scheduleId: schedule.id, reportType: schedule.reportType, periodFrom: period.from, periodTo: period.to, recipients: schedule.recipients, status: allDispatched ? 'sent' : 'skipped', note, messageId: lastMessageId } });
    const status: 'sent' | 'skipped' = allDispatched ? 'sent' : 'skipped';
    const cadenceCfg = { cadence: schedule.cadence as Cadence, runTime: schedule.runTime, dayOfWeek: schedule.dayOfWeek, dayOfMonth: schedule.dayOfMonth };
    await db.scheduledReport.update({ where: { id: schedule.id }, data: { lastRunAt: at, lastStatus: status, lastError: status === 'skipped' ? note : null, nextRunAt: nextRunAt(at, cadenceCfg) } });
    return { status, note, period };
  } catch (err) {
    const note = `Report build failed: ${err instanceof Error ? err.message : 'unknown error'}`;
    await db.reportDelivery.create({ data: { scheduleId: schedule.id, reportType: schedule.reportType, periodFrom: period.from, periodTo: period.to, recipients: schedule.recipients, status: 'failed', note } });
    const cadenceCfg = { cadence: schedule.cadence as Cadence, runTime: schedule.runTime, dayOfWeek: schedule.dayOfWeek, dayOfMonth: schedule.dayOfMonth };
    await db.scheduledReport.update({ where: { id: schedule.id }, data: { lastRunAt: at, lastStatus: 'failed', lastError: note, nextRunAt: nextRunAt(at, cadenceCfg) } });
    return { status: 'failed', note, period };
  }
}

/** reports.retryMaxAttempts — retries before a failed/skipped delivery is dropped. */
export function reportRetryMaxAttempts(): number {
  return Math.max(1, Number(getSetting('reports.retryMaxAttempts') ?? 4) || 4);
}

/** Exponential backoff (30 min base, 24 h cap) after the given failed attempt. */
function nextRetryAt(attempts: number): Date {
  const backoffMin = Math.min(24 * 60, 30 * 2 ** attempts);
  return new Date(Date.now() + backoffMin * 60 * 1000);
}

/**
 * Retry one failed/skipped delivery: rebuild the report for the stored period
 * and re-fan out to the recipients. Shared by the automatic retry sweep and the
 * manual per-delivery retry endpoint so both behave identically. A successful
 * retry flips the row to `sent` (and refreshes the schedule's last status); a
 * repeated failure increments attempts with exponential backoff. Never throws.
 */
export async function retryDelivery(
  db: PrismaClient,
  delivery: ReportDelivery,
  opts?: { mailToTest?: (to: string, subject: string, text: string, html: string) => Promise<{ dispatched: boolean; note: string; messageId?: string }> },
): Promise<{ delivered: boolean; note: string }> {
  const schedule = await db.scheduledReport.findUnique({ where: { id: delivery.scheduleId } });
  if (!schedule) {
    // Cascade deletes remove deliveries with their schedule, so this is a
    // defensive guard only — park the row out of the retry set.
    await db.reportDelivery.update({ where: { id: delivery.id }, data: { status: 'failed', note: 'Schedule no longer exists' } });
    return { delivered: false, note: 'Schedule no longer exists' };
  }
  const period = { from: delivery.periodFrom, to: delivery.periodTo };
  try {
    const content = await buildReportContent(db, schedule, period);
    const { subject, text, html } = renderReportEmail(schedule, period, content);
    const recipientList = delivery.recipients.split(',').map((e) => e.trim()).filter(Boolean);
    // Same fan-out semantics as the live run: a failure on ANY recipient marks
    // the retry skipped, and the note lists who got it.
    const outcomes: string[] = [];
    let allDispatched = recipientList.length > 0;
    let lastMessageId: string | undefined;
    for (const to of recipientList) {
      const result = opts?.mailToTest ? await opts.mailToTest(to, subject, text, html) : await sendAlertEmail({ to, subject, text, html });
      allDispatched = allDispatched && result.dispatched;
      if (result.messageId) lastMessageId = result.messageId;
      outcomes.push(`${to}: ${result.dispatched ? 'sent' : result.note}`);
    }
    const note = outcomes.join('; ') || 'No recipients';
    const status = allDispatched ? 'sent' : 'skipped';
    const attempts = delivery.attempts + 1;
    await db.reportDelivery.update({
      where: { id: delivery.id },
      data: { status, note, messageId: lastMessageId, attempts, nextAttemptAt: status === 'sent' ? null : nextRetryAt(attempts) },
    });
    if (status === 'sent') {
      // Refresh the schedule's last status without disturbing the cadence
      // (lastRunAt / nextRunAt were advanced by the original scheduled run).
      await db.scheduledReport.update({ where: { id: schedule.id }, data: { lastStatus: 'sent', lastError: null } }).catch(() => undefined);
    }
    return { delivered: status === 'sent', note };
  } catch (err) {
    const note = `Report build failed: ${err instanceof Error ? err.message : 'unknown error'}`;
    const attempts = delivery.attempts + 1;
    await db.reportDelivery.update({ where: { id: delivery.id }, data: { status: 'failed', note, attempts, nextAttemptAt: nextRetryAt(attempts) } });
    await db.scheduledReport.update({ where: { id: schedule.id }, data: { lastStatus: 'failed', lastError: note } }).catch(() => undefined);
    return { delivered: false, note };
  }
}

/**
 * Report delivery retry sweep (docs/14 §5) — retries failed/skipped deliveries
 * with exponential backoff (30 min, 1 h, 2 h, … capped at 24 h) until success
 * or reports.retryMaxAttempts (default 4). Runs at boot and every 30 minutes so
 * a transient SMTP outage never silently loses a scheduled report. Returns the
 * outcome for tests.
 */
export async function runReportRetrySweep(
  db: PrismaClient,
  opts?: { now?: Date; mailToTest?: (to: string, subject: string, text: string, html: string) => Promise<{ dispatched: boolean; note: string; messageId?: string }> },
): Promise<{ retried: number; delivered: number; failed: number }> {
  const now = opts?.now ?? new Date();
  const maxAttempts = reportRetryMaxAttempts();
  // A row created by the live sweep has nextAttemptAt = null, meaning due now.
  const due = await db.reportDelivery.findMany({
    where: {
      status: { in: ['failed', 'skipped'] },
      note: { not: 'No recipients' },
      attempts: { lt: maxAttempts },
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
    },
    orderBy: { nextAttemptAt: 'asc' },
    take: 100,
  });
  let delivered = 0;
  let failed = 0;
  for (const row of due) {
    const outcome = await retryDelivery(db, row, opts);
    if (outcome.delivered) delivered += 1;
    else if (row.attempts + 1 >= maxAttempts) failed += 1;
  }
  return { retried: due.length, delivered, failed };
}

/**
 * The report sweep: run every active schedule whose nextRunAt is due.
 * Returns a summary for the server log.
 */
export async function runDueSchedules(db: PrismaClient, opts?: { now?: Date; mailToTest?: (to: string, subject: string, text: string, html: string) => Promise<{ dispatched: boolean; note: string; messageId?: string }> }): Promise<{ ran: number; sent: number; skipped: number; failed: number; due: number }> {
  const now = opts?.now ?? new Date();
  const due = await db.scheduledReport.findMany({ where: { active: true, nextRunAt: { lte: now } } });
  const summary = { ran: due.length, sent: 0, skipped: 0, failed: 0, due: due.length };
  for (const schedule of due) {
    const result = await runSchedule(db, schedule, now, opts);
    if (result.status === 'sent') summary.sent++;
    else if (result.status === 'skipped') summary.skipped++;
    else summary.failed++;
  }
  return summary;
}

/** Shared CSV export for scheduled-report attachments/downloads. */
export function reportCsv(content: Parameters<typeof renderReportEmail>[2]): string {
  if (content.summary) {
    return toCsv(['Indicator', 'DHIMS-II', 'Unit', 'Value'], content.summary.indicators.map((i) => [i.name, i.dhims2Code, i.unit, i.value === null ? '' : String(i.value)]));
  }
  if (content.completeness) {
    return toCsv(['Facility code', 'Facility', 'Reported'], content.completeness.rows.map((r) => [r.code, r.name, r.reported ? 'Yes' : 'No']));
  }
  if (content.anomalies) {
    const rows: string[][] = [];
    for (const ind of content.anomalies.indicators) {
      for (const f of ind.flags) rows.push([ind.name, f.weekStart, String(f.value), String(f.expected), f.z.toFixed(2), f.severity]);
    }
    return toCsv(['Indicator', 'Week starting', 'Value', 'Expected', 'z', 'Severity'], rows);
  }
  return '';
}
