import type { PrismaClient } from '@prisma/client';
import type { AuthUser } from '../../types.js';
import { dispatchSms, dispatchWhatsApp } from '../../lib/sms.js';
import { getSetting } from '../../lib/settings.js';
import { daysUntil, immunizationScope, PATIENT_SELECT } from './scope.js';
import { DAY_MS } from './schedule.js';
import { nextScheduleItem } from '../../lib/epiSchedule.js';

/** Guards against overlapping sweeps (scheduled + manual) so a slow run can
 *  never double-send before the audit-lookback dedupe lands. */
let sweepInFlight = false;

export interface DueRow {
  id: string;
  patient: { id: string; mrn: string; fullName: string; dateOfBirth: Date | null; phone: string | null; districtName: string | null; reminderOptOut: boolean };
  vaccine: string;
  dose: string;
  description: string;
  lastDoseAt: Date;
  nextDueAt: Date;
  daysUntil: number;
  daysOverdue: number;
  bucket: 'OVERDUE' | 'DUE_SOON';
}

/**
 * Defaulter worklist: the latest given dose per patient+vaccine drives the next
 * due date. ALL given rows are fetched (including completed series whose
 * nextDueAt is null) so a finished vaccine supersedes earlier doses' stale
 * next-due dates instead of re-flagging the child as overdue. The row surfaces
 * the dose that is actually due (the successor in the schedule).
 */
export async function computeDueRows(db: PrismaClient, u: AuthUser, windowDays: number): Promise<DueRow[]> {
  const rows = await db.immunization.findMany({
    where: { ...immunizationScope(u), status: 'GIVEN' },
    select: {
      id: true, vaccine: true, dose: true, nextDueAt: true, administeredAt: true, batch: true,
      patient: PATIENT_SELECT,
    },
    orderBy: { administeredAt: 'asc' },
    take: 2000,
  });

  const latest = new Map<string, (typeof rows)[number]>();
  for (const r of rows) {
    const key = `${r.patient.id}|${r.vaccine}`;
    const prev = latest.get(key);
    if (!prev || r.administeredAt > prev.administeredAt) latest.set(key, r);
  }

  const due: DueRow[] = [];
  for (const r of latest.values()) {
    if (!r.nextDueAt) continue;
    const days = daysUntil(r.nextDueAt);
    if (days > windowDays) continue; // beyond the look-ahead window
    const next = nextScheduleItem(r.vaccine, r.dose);
    const dueDose = next ?? { vaccine: r.vaccine, dose: r.dose, description: r.vaccine, label: '—', ageDays: null, intervalDays: null };
    due.push({
      id: r.id,
      patient: {
        id: r.patient.id,
        mrn: r.patient.mrn,
        fullName: r.patient.fullName,
        dateOfBirth: r.patient.dateOfBirth,
        phone: r.patient.phone,
        districtName: r.patient.district?.name ?? null,
        reminderOptOut: r.patient.reminderOptOut,
      },
      vaccine: dueDose.vaccine,
      dose: dueDose.dose,
      description: dueDose.description,
      lastDoseAt: r.administeredAt,
      nextDueAt: r.nextDueAt,
      daysUntil: days,
      daysOverdue: Math.max(0, -days),
      bucket: days < 0 ? 'OVERDUE' : 'DUE_SOON',
    });
  }

  // Overdue first (most overdue first), then soonest-due.
  due.sort((a, b) => (a.bucket !== b.bucket ? (a.bucket === 'OVERDUE' ? -1 : 1) : a.nextDueAt.getTime() - b.nextDueAt.getTime()));
  return due;
}

/**
 * Patient-facing reminder text naming the dose that is actually due. Shared by
 * the manual remind endpoint, the offline REMIND mutation and the scheduled job
 * so every channel sends the same message. "Overdue" uses day granularity
 * (consistent with the worklist), so a dose due later today reads "due", not
 * "OVERDUE".
 */
/** Default reminder texts — overridable at runtime (Settings → reminders). */
export const DEFAULT_DUE_TEMPLATE = 'GIHM-HIS: {patientName} is due for {description} (Dose {dose}) on {dueDate}. Please visit your health facility. Reply STOP to opt out.';
export const DEFAULT_OVERDUE_TEMPLATE = 'GIHM-HIS: {patientName} is OVERDUE for {description} (Dose {dose}). Please visit your health facility. Reply STOP to opt out.';

/**
 * Patient-facing reminder text naming the dose that is actually due, built from
 * the editable templates (reminder.msgDue / reminder.msgOverdue settings).
 * Placeholders: {patientName} {description} {dose} {dueDate}. "Overdue" uses day
 * granularity (consistent with the worklist), so a dose due later today reads
 * "due", not "OVERDUE".
 */
export function buildReminderMessage(opts: { patientName: string; description: string; dose: string; nextDueAt: Date }): string {
  const overdue = daysUntil(opts.nextDueAt) < 0;
  const dueDate = opts.nextDueAt.toISOString().slice(0, 10);
  const template = overdue ? (getSetting('reminder.msgOverdue') ?? DEFAULT_OVERDUE_TEMPLATE) : (getSetting('reminder.msgDue') ?? DEFAULT_DUE_TEMPLATE);
  return template
    .replaceAll('{patientName}', opts.patientName)
    .replaceAll('{description}', opts.description)
    .replaceAll('{dose}', opts.dose)
    .replaceAll('{dueDate}', dueDate);
}

/** Synthetic national-scope actor for the system job (default scope = all rows). */
const SYSTEM_USER = { id: 'reminder-job', scope: 'NATIONAL' } as unknown as AuthUser;

/** One row of a multi-dose reminder dispatch (bulk / remind-all). */
export interface ReminderBatchResultRow {
  id: string;
  patientName: string;
  to: string | null;
  dispatched: boolean;
  /** True when this row is a dry-run preview — nothing was actually sent. */
  dryRun?: boolean;
  /** True when the family declined reminders — never contacted (summary.optedOut). */
  optedOut?: boolean;
  /** Vaccine/dose of the skipped dose — lets the caller audit opt-out skips per-row. */
  vaccine?: string;
  dose?: string;
  provider: string;
  messageId: string | null;
  note: string | null;
}

export interface ReminderBatchSummary {
  dispatched: number;
  failed: number;
  noPhone: number;
  skipped: number;
  /** Patients who asked not to be reminded — never contacted, never an error. */
  optedOut: number;
}

export interface ReminderBatchResult {
  results: ReminderBatchResultRow[];
  summary: ReminderBatchSummary;
}

/**
 * Dispatch reminders to a set of dose rows over one channel (SMS | WHATSAPP),
 * returning per-id results and a reconcile-able summary. Shared by the
 * checkbox-driven bulk endpoint and the filter-driven "remind all due"
 * endpoint so both behave identically (same message, same skip rules). Rows
 * that are out of scope / already given / have no next dose are counted as
 * skipped, never an error.
 */
export async function dispatchReminderBatch(
  rows: Array<{
    id: string;
    vaccine: string;
    dose: string;
    status?: string | null;
    nextDueAt: Date | null;
    patient: { fullName: string; phone: string | null; reminderOptOut?: boolean };
  }>,
  channel: 'SMS' | 'WHATSAPP',
  dryRun = false,
): Promise<ReminderBatchResult> {
  const results: ReminderBatchResultRow[] = [];
  const summary: ReminderBatchSummary = { dispatched: 0, failed: 0, noPhone: 0, skipped: 0, optedOut: 0 };
  for (const row of rows) {
    // Opted-out patients are never contacted — counted, surfaced per-row so the
    // caller can show which families were skipped (and audit each under
    // immunization.remind.optedOut so the reminder report rolls them up by
    // district/region), never an error.
    if (row.patient.reminderOptOut) {
      summary.optedOut += 1;
      results.push({
        id: row.id,
        patientName: row.patient.fullName,
        to: null,
        dispatched: false,
        optedOut: true,
        // Preview marker so a consumer never mistakes a dry-run row for a real
        // dispatch (docs/23: every preview result row carries dryRun: true).
        dryRun: dryRun || undefined,
        vaccine: row.vaccine,
        dose: row.dose,
        provider: 'none',
        messageId: null,
        note: 'Patient opted out of reminders — not contacted.',
      });
      continue;
    }
    if ((row.status !== 'GIVEN' && row.status !== 'MISSED') || !row.nextDueAt) {
      summary.skipped += 1;
      continue;
    }
    // Dry-run preview (web "Preview" buttons): count what WOULD be dispatched
    // without sending anything — the caller audits it as a preview.
    if (dryRun) {
      if (row.patient.phone) summary.dispatched += 1;
      else summary.noPhone += 1;
      results.push({
        id: row.id,
        patientName: row.patient.fullName,
        to: row.patient.phone,
        dispatched: true,
        dryRun: true,
        provider: 'dry-run',
        messageId: null,
        note: 'Dry-run — nothing was sent.',
      });
      continue;
    }
    const next = nextScheduleItem(row.vaccine, row.dose);
    const dueDose = next ?? { vaccine: row.vaccine, dose: row.dose, description: row.vaccine };
    const message = buildReminderMessage({
      patientName: row.patient.fullName,
      description: dueDose.description,
      dose: dueDose.dose,
      nextDueAt: row.nextDueAt,
    });
    let result: Awaited<ReturnType<typeof dispatchSms>>;
    if (row.patient.phone) {
      result =
        channel === 'WHATSAPP'
          ? await dispatchWhatsApp({ to: row.patient.phone, message })
          : await dispatchSms({ to: row.patient.phone, message });
      if (result.dispatched) summary.dispatched += 1;
      else summary.failed += 1;
    } else {
      summary.noPhone += 1;
      result = { dispatched: false, provider: 'none', note: 'No phone number on file.' };
    }
    results.push({
      id: row.id,
      patientName: row.patient.fullName,
      to: row.patient.phone,
      dispatched: result.dispatched,
      provider: result.provider,
      messageId: result.messageId ?? null,
      note: result.note ?? null,
    });
  }
  return { results, summary };
}

export interface ReminderJobSummary {
  scanned: number;
  attempted: number;
  dispatched: number;
  alreadyReminded: number;
  noPhone: number;
  failed: number;
  /** Opted-out patients — never contacted (patient preference, docs/23). */
  optedOut: number;
  windowDays: number;
  lookbackDays: number;
  ranAt: string;
  skipped?: boolean;
}

/**
 * Auto-dispatch reminder recalls for children due within the look-ahead window
 * (including overdue defaulters). Each dose is only re-reminded after the
 * look-back window has elapsed — the audit trail is the dedupe record, so no
 * schema change is needed and the per-recall history is preserved.
 *
 * Scope: when a user is supplied (manual trigger) the sweep is restricted to
 * their scope — a facility user only recalls their own catchment, never the
 * whole country. The server's scheduled run passes no user → national scope.
 */
export async function runScheduledReminders(
  db: PrismaClient,
  opts: { windowDays?: number; lookbackDays?: number } = {},
  scopeUser?: AuthUser,
): Promise<ReminderJobSummary> {
  // NaN-safe clamps (endpoint/env input may be non-numeric).
  const windowDays = Math.max(1, Math.min(90, Number(opts.windowDays) || 7));
  const lookbackDays = Math.max(1, Math.min(90, Number(opts.lookbackDays) || 7));
  const summary: ReminderJobSummary = {
    scanned: 0, attempted: 0, dispatched: 0, alreadyReminded: 0, noPhone: 0, failed: 0, optedOut: 0, windowDays, lookbackDays, ranAt: new Date().toISOString(),
  };
  if (sweepInFlight) {
    summary.skipped = true;
    return summary;
  }
  sweepInFlight = true;
  try {
    return await runSweep(db, scopeUser, windowDays, lookbackDays, summary);
  } finally {
    sweepInFlight = false;
  }
}

async function runSweep(
  db: PrismaClient,
  scopeUser: AuthUser | undefined,
  windowDays: number,
  lookbackDays: number,
  summary: ReminderJobSummary,
): Promise<ReminderJobSummary> {
  const due = await computeDueRows(db, scopeUser ?? SYSTEM_USER, windowDays);
  const lookbackFrom = new Date(Date.now() - lookbackDays * DAY_MS);
  if (due.length === 0) return summary;

  // Dedupe: skip any dose already recalled (manual or scheduled) within the look-back window.
  const recent = await db.auditLog.findMany({
    where: {
      entityType: 'immunization',
      entityId: { in: due.map((d) => d.id) },
      action: { in: ['immunization.remind', 'immunization.remind.auto'] },
      createdAt: { gte: lookbackFrom },
    },
    select: { entityId: true },
  });
  const remindedIds = new Set(recent.map((r) => r.entityId));

  for (const row of due) {
    summary.scanned++;
    // Patient preference: opted-out children are never recalled.
    if (row.patient.reminderOptOut) {
      summary.optedOut++;
      continue;
    }
    if (remindedIds.has(row.id)) {
      summary.alreadyReminded++;
      continue;
    }
    if (!row.patient.phone) {
      summary.noPhone++;
      continue;
    }
    const message = buildReminderMessage({
      patientName: row.patient.fullName,
      description: row.description,
      dose: row.dose,
      nextDueAt: row.nextDueAt,
    });
    // reminder.autoChannel: SMS | WHATSAPP | BOTH (default SMS) — the sweep
    // dispatches over every selected channel, each counted and audit-logged.
    // attempted/dispatched/failed are all per-DISPATCH counts, so the invariant
    // attempted = dispatched + failed holds even on BOTH days.
    const auto = (getSetting('reminder.autoChannel') ?? 'SMS').toUpperCase();
    const channels: Array<'SMS' | 'WHATSAPP'> = auto === 'BOTH' ? ['SMS', 'WHATSAPP'] : auto === 'WHATSAPP' ? ['WHATSAPP'] : ['SMS'];
    for (const channel of channels) {
      summary.attempted++;
      const result =
        channel === 'WHATSAPP'
          ? await dispatchWhatsApp({ to: row.patient.phone, message })
          : await dispatchSms({ to: row.patient.phone, message });
      if (result.dispatched) summary.dispatched++;
      else summary.failed++;
      await db.auditLog.create({
        data: {
          actorEmail: scopeUser?.email ?? 'system@reminders',
          role: scopeUser?.roleCode ?? 'SYSTEM',
          action: 'immunization.remind.auto',
          entityType: 'immunization',
          entityId: row.id,
          after: JSON.stringify({
            source: 'scheduled',
            channel,
            to: row.patient.phone,
            vaccine: row.vaccine,
            dose: row.dose,
            message,
            dispatched: result.dispatched,
            provider: result.provider,
            messageId: result.messageId ?? null,
          }),
        },
      });
    }
  }
  return summary;
}
