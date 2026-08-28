import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { str, optStr, dateIso } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import type { Guards } from '../../lib/guards.js';
import type { AuthUser } from '../../types.js';
import { assertPatientAccess } from '../patients/service.js';
import { patientScope } from '../../lib/scope.js';
import { dispatchSms, dispatchWhatsApp } from '../../lib/sms.js';
import { getSetting } from '../../lib/settings.js';
import { DAY_MS, type ScheduleItem } from './schedule.js';
import { getSchedule, scheduleItem, nextScheduleItem } from '../../lib/epiSchedule.js';
import { daysUntil, immunizationScope, PATIENT_SELECT } from './scope.js';
import { buildReminderMessage, computeDueRows, dispatchReminderBatch, runScheduledReminders } from './reminders.js';
import { publishEvent } from '../webhooks/engine.js';

// ---------------------------------------------------------------------------
// Shared computation helpers (used by the JSON endpoints and the CSV exports)
// ---------------------------------------------------------------------------

function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? '' : String(v);
  // Neutralize spreadsheet formula injection in free-text fields (names that
  // start with =, +, -, @ would otherwise be evaluated as formulas by Excel).
  if (typeof v === 'string' && /^[=+\-@]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  return [headers.map(csvCell).join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\n');
}

/**
 * Audit opted-out skips per-row under the dedicated action (bulk / remind-all,
 * same contract as the single remind) so the reminder report's opted-out stat
 * and district/region roll-up stay truthful for batch runs. Dry-runs stay
 * silent — the preview audit row already counts them.
 */
function auditOptedOutSkips(
  db: PrismaClient,
  request: Parameters<typeof recordAudit>[1],
  results: Array<{ id: string; optedOut?: boolean; vaccine?: string; dose?: string; note?: string | null }>,
  channel: string,
): void {
  for (const r of results) {
    if (!r.optedOut) continue;
    recordAudit(db, request, {
      action: 'immunization.remind.optedOut',
      entityType: 'immunization',
      entityId: r.id,
      after: { channel, to: null, vaccine: r.vaccine ?? null, dose: r.dose ?? null, dispatched: false, provider: 'none', note: r.note ?? 'Patient opted out of reminders — not contacted.' },
    });
  }
}

/**
 * Missed-dose defaulters requiring follow-up. The MISSED row is the
 * previously-given dose; the dose that was actually missed is its successor in
 * the schedule. A follow-up is RESOLVED once that successor has since been
 * recorded as given — the defaulter came back — so it drops off the list.
 */
async function computeMissedRows(db: PrismaClient, u: AuthUser): Promise<
  Array<{
    id: string;
    patient: { id: string; mrn: string; fullName: string; dateOfBirth: Date | null; phone: string | null; districtName: string | null; reminderOptOut: boolean };
    vaccine: string;
    dose: string;
    description: string;
    missedSince: Date | null;
    lastGivenAt: Date;
    daysOverdue: number | null;
  }>
> {
  const rows = await db.immunization.findMany({
    where: { ...immunizationScope(u), status: 'MISSED' },
    orderBy: { createdAt: 'desc' },
    take: 2000,
    include: { patient: PATIENT_SELECT },
  });

  const withNext = rows.filter((r) => nextScheduleItem(r.vaccine, r.dose));
  const successors = withNext.map((r) => {
    const n = nextScheduleItem(r.vaccine, r.dose)!;
    return { patientId: r.patientId, vaccine: n.vaccine, dose: n.dose };
  });
  const given = successors.length
    ? await db.immunization.findMany({
        where: { status: 'GIVEN', OR: successors.map((s) => ({ patientId: s.patientId, vaccine: s.vaccine, dose: s.dose })) },
        select: { patientId: true, vaccine: true, dose: true },
      })
    : [];
  const resolvedKeys = new Set(given.map((g) => `${g.patientId}|${g.vaccine}|${g.dose}`));

  return withNext
    .filter((r) => {
      const n = nextScheduleItem(r.vaccine, r.dose)!;
      return !resolvedKeys.has(`${r.patientId}|${n.vaccine}|${n.dose}`);
    })
    .map((r) => {
      const missed = nextScheduleItem(r.vaccine, r.dose)!;
      const days = r.nextDueAt ? daysUntil(r.nextDueAt) : null;
      return {
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
        vaccine: missed.vaccine,
        dose: missed.dose,
        description: missed.description,
        missedSince: r.nextDueAt,
        lastGivenAt: r.administeredAt,
        daysOverdue: days !== null ? Math.max(0, -days) : null,
      };
    });
}

interface CoverageIndicator {
  key: string;
  vaccine: string;
  dose: string;
  label: string;
  ageDays: number;
  eligible: number;
  vaccinated: number;
  coveragePct: number;
}

/**
 * Dose-level coverage within the caller's scope (national sees national,
 * facility sees its registered cohort). Denominator = children in scope who
 * have reached the due age for each dose; numerator = those with the dose
 * recorded as given. Also computes the PENTA1→PENTA3 dropout rate and the
 * fully-immunized coverage on the 12-month cohort (all key child doses).
 */
async function computeCoverage(
  db: PrismaClient,
  u: AuthUser,
  opts: { previewItems?: Array<{ vaccine: string; dose: string; ageDays: number | null; active?: boolean }> } = {},
): Promise<{
  scope: string;
  indicators: Omit<CoverageIndicator, 'ageDays'>[];
  dropoutRate: number;
  fullyImmunized: { eligible: number; vaccinated: number; coveragePct: number };
  preview: boolean;
}> {
  // Demo-scale cohort guard: national scopes are small in the seeded data. For
  // production, the cohort query would be paginated (coverage is a reporting
  // aggregate, spec §59) rather than capped here.
  const patients = await db.patient.findMany({
    where: { ...patientScope(u), dateOfBirth: { not: null } },
    select: { id: true, dateOfBirth: true },
    take: 5000,
  });
  const patientIds = patients.map((p) => p.id);
  const doses = await db.immunization.findMany({
    where: { status: 'GIVEN', patientId: { in: patientIds.length ? patientIds : ['__none__'] } },
    select: { patientId: true, vaccine: true, dose: true },
  });
  const given = new Set(doses.map((d) => `${d.patientId}|${d.vaccine}|${d.dose}`));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ageDays = (dob: Date): number => Math.floor((today.getTime() - new Date(dob).getTime()) / DAY_MS);

  // Curated key-dose indicators. Denominators come from the CURRENT effective
  // schedule (lib/epiSchedule): an admin edit to a dose's age changes the
  // eligible cohort immediately, so the coverage view reflects schedule changes.
  // When a dose is not present in the editable schedule (e.g. deactivated), the
  // built-in default age keeps the legacy indicator visible.
  const INDICATORS: { key: string; vaccine: string; dose: string; label: string; ageDays: number }[] = [
    { key: 'BCG_0', vaccine: 'BCG', dose: '0', label: 'BCG at birth', ageDays: 0 },
    { key: 'PENTA_1', vaccine: 'PENTA', dose: '1', label: 'Pentavalent 1', ageDays: 42 },
    { key: 'PENTA_3', vaccine: 'PENTA', dose: '3', label: 'Pentavalent 3', ageDays: 98 },
    { key: 'OPV_3', vaccine: 'OPV', dose: '3', label: 'Polio (OPV) 3', ageDays: 98 },
    { key: 'PCV_3', vaccine: 'PCV', dose: '3', label: 'Pneumococcal (PCV) 3', ageDays: 98 },
    { key: 'ROTA_2', vaccine: 'ROTA', dose: '2', label: 'Rotavirus 2', ageDays: 70 },
    { key: 'MR_1', vaccine: 'MEASLES_RUBELLA', dose: '1', label: 'Measles-Rubella 1', ageDays: 273 },
    { key: 'YF_1', vaccine: 'YF', dose: '1', label: 'Yellow fever', ageDays: 273 },
  ];

  // A dose that was deactivated in the editable schedule (scheduleItem returns
  // undefined) is dropped from coverage entirely — a dose that is no longer
  // scheduled should not keep a stale indicator. The built-in default age only
  // fills in when the schedule has no entry at all (should not happen for the
  // curated set, kept as a safety net).
  // `previewItems` (developer/EPI editor preview) overlays an *unsaved* schedule
  // draft: matching vaccine+dose entries override the due age, and an entry with
  // active:false deactivates the dose for the preview.
  const preview = new Map((opts.previewItems ?? []).map((p) => [`${p.vaccine}|${p.dose}`, p]));
  const dropped = (ind: { vaccine: string; dose: string }): boolean => {
    const p = preview.get(`${ind.vaccine}|${ind.dose}`);
    if (p) return p.active === false;
    return scheduleItem(ind.vaccine, ind.dose) === undefined;
  };
  const resolveAge = (ind: { vaccine: string; dose: string; ageDays: number }): number => {
    const p = preview.get(`${ind.vaccine}|${ind.dose}`);
    if (p && p.ageDays !== null) return p.ageDays;
    return scheduleItem(ind.vaccine, ind.dose)?.ageDays ?? ind.ageDays;
  };
  const indicators = INDICATORS.filter((ind) => !dropped(ind)).map((ind) => {
    const effectiveAge = resolveAge(ind);
    const eligible = patients.filter((p) => p.dateOfBirth && ageDays(p.dateOfBirth) >= effectiveAge).length;
    const vaccinated = patients.filter(
      (p) => p.dateOfBirth && ageDays(p.dateOfBirth) >= effectiveAge && given.has(`${p.id}|${ind.vaccine}|${ind.dose}`),
    ).length;
    return {
      key: ind.key,
      vaccine: ind.vaccine,
      dose: ind.dose,
      label: ind.label,
      eligible,
      vaccinated,
      coveragePct: eligible > 0 ? Math.round((vaccinated / eligible) * 100) : 0,
    };
  });

  const penta1 = indicators.find((i) => i.key === 'PENTA_1')!;
  const penta3 = indicators.find((i) => i.key === 'PENTA_3')!;
  const dropoutRate = penta1.vaccinated > 0 ? Math.round(((penta1.vaccinated - penta3.vaccinated) / penta1.vaccinated) * 100) : 0;

  // Fully immunized: every surviving key dose received by the 12-month cohort
  // (derived from the indicators so a deactivated dose is not silently required).
  const FULL_SET = indicators.map((i) => `${i.vaccine}|${i.dose}`);
  const cohort = patients.filter((p) => p.dateOfBirth && ageDays(p.dateOfBirth) >= 365);
  const fullyVaccinated = cohort.filter((p) => FULL_SET.every((k) => given.has(`${p.id}|${k}`))).length;
  const fullyImmunized = {
    eligible: cohort.length,
    vaccinated: fullyVaccinated,
    coveragePct: cohort.length > 0 ? Math.round((fullyVaccinated / cohort.length) * 100) : 0,
  };

  return { scope: u.scope, indicators, dropoutRate, fullyImmunized, preview: (opts.previewItems ?? []).length > 0 };
}

/**
 * Immunization registry (spec §22) — Ghana EPI schedule, dose recording with
 * auto-computed next-due dates, and a defaulter-tracking worklist of children
 * due or overdue for their next dose.
 */
export function registerImmunizationRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  // ------------------------------------------------------------- schedule
  app.get(
    '/immunizations/schedule',
    { preHandler: guards.requirePermission('view_clinical_record', 'view_patient'), schema: { summary: 'Ghana EPI immunization schedule', tags: ['immunization'] } },
    async () => ({ schedule: getSchedule() }),
  );

  // ------------------------------------------------------------ registry
  app.get(
    '/immunizations',
    { preHandler: guards.requirePermission('view_clinical_record', 'view_patient'), schema: { summary: 'List recorded immunizations (scoped)', tags: ['immunization'] } },
    async (request) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const where: Record<string, unknown> = { ...immunizationScope(u) };
      if (q.patientId) where.patientId = str(q.patientId, 'patientId');
      if (q.vaccine) where.vaccine = str(q.vaccine, 'vaccine').toUpperCase();
      if (q.status) where.status = str(q.status, 'status').toUpperCase();
      const pageSize = Math.max(1, Math.min(500, Number(q.pageSize ?? 200) || 200));

      // Note: Immunization.facilityId is a plain column (no Prisma relation), so
      // facility names are resolved via a separate lookup if ever needed.
      const [items, total] = await Promise.all([
        db.immunization.findMany({ where, orderBy: { administeredAt: 'desc' }, take: pageSize, include: { patient: PATIENT_SELECT } }),
        db.immunization.count({ where }),
      ]);
      return { items, count: items.length, total };
    },
  );

  // ------------------------------------------------------- due / overdue
  // Patients may call this too (via self_access): immunizationScope restricts
  // the result to their own record, so the patient portal can show reminders.
  app.get(
    '/immunizations/due',
    { preHandler: guards.requirePermission('view_clinical_record', 'view_patient', 'self_access'), schema: { summary: 'Defaulter-tracking worklist — doses due or overdue', tags: ['immunization'] } },
    async (request) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const windowDays = Math.max(0, Math.min(365, Number(q.window ?? 30) || 30));
      const bucket = optStr(q.bucket)?.toUpperCase() ?? 'ALL';
      const query = optStr(q.q)?.toLowerCase();

      const due = await computeDueRows(db, u, windowDays);
      // Whole-scope summary counts — bucket/search filters are applied
      // afterwards so the stat cards stay truthful while the user filters.
      const summary = { overdue: due.filter((d) => d.bucket === 'OVERDUE').length, dueSoon: due.filter((d) => d.bucket === 'DUE_SOON').length };

      let filtered = due;
      if (bucket !== 'ALL') filtered = filtered.filter((d) => d.bucket === bucket);
      if (query) {
        filtered = filtered.filter((d) => {
          const name = d.patient.fullName.toLowerCase();
          const mrn = d.patient.mrn.toLowerCase();
          return name.includes(query) || mrn.includes(query);
        });
      }

      return { items: filtered.slice(0, 100), count: filtered.length, summary, windowDays, today: new Date().toISOString() };
    },
  );

  // ---------------------------------------------------------- record dose
  app.post(
    '/immunizations',
    { preHandler: guards.requirePermission('write_clinical_note', 'view_patient'), schema: { summary: 'Record an administered vaccine dose', tags: ['immunization'] } },
    async (request) => {
      const u = request.user!;
      const body = (request.body ?? {}) as Record<string, unknown>;
      const patientId = str(body.patientId, 'patientId', { required: true });
      const vaccine = str(body.vaccine, 'vaccine', { required: true }).toUpperCase();
      const dose = str(body.dose, 'dose', { required: true });
      const administeredAt = dateIso(body.administeredAt, 'administeredAt') ?? new Date();
      if (administeredAt.getTime() > Date.now() + DAY_MS) throw httpErrors.badRequest('administeredAt cannot be in the future');

      const item = scheduleItem(vaccine, dose);
      if (!item) throw httpErrors.badRequest(`Unknown vaccine/dose: ${vaccine} ${dose} (see /immunizations/schedule)`);

      const patient = await assertPatientAccess(db, u, patientId);

      const existing = await db.immunization.findFirst({ where: { patientId, vaccine, dose, status: 'GIVEN' } });
      if (existing) throw httpErrors.conflict(`Dose ${vaccine} ${dose} already recorded for this patient on ${existing.administeredAt.toISOString().slice(0, 10)}`);

      // Auto-compute the next due date from the schedule:
      //  - child doses: next due when the child reaches the next dose's age (DOB-based)
      //  - repeat/adult doses: next due a fixed interval after this dose
      let nextDueAt: Date | undefined;
      let next: ScheduleItem | undefined;
      const nxt = nextScheduleItem(vaccine, dose);
      if (nxt) {
        next = nxt;
        if (nxt.ageDays !== null && patient.dateOfBirth) {
          nextDueAt = new Date(patient.dateOfBirth.getTime() + nxt.ageDays * DAY_MS);
        } else if (nxt.intervalDays !== null) {
          nextDueAt = new Date(administeredAt.getTime() + nxt.intervalDays * DAY_MS);
        }
      }

      const immunization = await db.immunization.create({
        data: {
          patientId,
          facilityId: u.facilityId ?? undefined,
          vaccine,
          dose,
          administeredAt,
          nextDueAt,
          batch: optStr(body.batch),
          vaccinatorId: u.id,
          status: 'GIVEN',
        },
      });

      recordAudit(db, request, {
        action: 'immunization.create',
        entityType: 'immunization',
        entityId: immunization.id,
        after: { patientId, vaccine, dose, nextDueAt: nextDueAt?.toISOString() ?? null },
      });
      // Platform event webhook (docs/22 Phase 7) — durable delivery row; a
      // subscriber outage never fails the clinical write.
      await publishEvent(db, 'immunization.administered', { immunizationId: immunization.id, patientId, vaccine, dose }).catch(() => undefined);

      return {
        immunization,
        next: next
          ? { vaccine: next.vaccine, dose: next.dose, description: next.description, dueAt: nextDueAt?.toISOString() ?? null, label: next.label }
          : null,
      };
    },
  );

  // ---------------------------------------------------- document a miss
  app.post(
    '/immunizations/:id/mark-missed',
    { preHandler: guards.requirePermission('write_clinical_note', 'view_patient'), schema: { summary: 'Mark a due dose as missed (defaulter follow-up)', tags: ['immunization'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const immunization = await db.immunization.findFirst({
        where: { id: params.id, ...immunizationScope(u) },
        include: { patient: { select: { id: true } } },
      });
      if (!immunization) throw httpErrors.notFound('Immunization record not found in scope');
      if (immunization.status !== 'GIVEN') throw httpErrors.conflict('Only a given dose can be marked missed');
      if (!immunization.nextDueAt || daysUntil(immunization.nextDueAt) >= 0) {
        throw httpErrors.conflict('Dose is not overdue yet');
      }
      // Keep nextDueAt: it becomes the "missed since" date for the follow-up list.
      const updated = await db.immunization.update({
        where: { id: immunization.id },
        data: { status: 'MISSED' },
      });
      recordAudit(db, request, { action: 'immunization.markMissed', entityType: 'immunization', entityId: immunization.id, after: { vaccine: immunization.vaccine, dose: immunization.dose } });
      return { immunization: updated };
    },
  );

  // ----------------------------------------------------- missed follow-up
  app.get(
    '/immunizations/missed',
    { preHandler: guards.requirePermission('view_clinical_record', 'view_patient'), schema: { summary: 'Missed-dose defaulters requiring follow-up (scoped)', tags: ['immunization'] } },
    async (request) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const pageSize = Math.max(1, Math.min(500, Number(q.pageSize ?? 200) || 200));
      const items = await computeMissedRows(db, u);
      const filtered = q.patientId ? items.filter((r) => r.patient.id === str(q.patientId, 'patientId')) : items;
      return { items: filtered.slice(0, pageSize), count: filtered.length, total: filtered.length };
    },
  );

  // ------------------------------------------------------- remind (SMS)
  app.post(
    '/immunizations/:id/remind',
    { preHandler: guards.requirePermission('write_clinical_note', 'view_patient'), schema: { summary: 'Send an SMS reminder recall for a due/missed dose', tags: ['immunization'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const channel = (optStr(body.channel) ?? 'SMS').toUpperCase();
      if (!['SMS', 'WHATSAPP'].includes(channel)) throw httpErrors.badRequest('Channel must be SMS or WHATSAPP');

      const immunization = await db.immunization.findFirst({
        where: { id: params.id, ...immunizationScope(u) },
        include: { patient: { select: { id: true, fullName: true, phone: true, reminderOptOut: true } } },
      });
      if (!immunization) throw httpErrors.notFound('Immunization record not found in scope');
      if (immunization.status !== 'GIVEN' && immunization.status !== 'MISSED') {
        throw httpErrors.conflict('Only a due or missed dose can be reminded');
      }
      if (!immunization.nextDueAt) throw httpErrors.conflict('No next dose is scheduled for this record');
      // Patient preference: never recalled (docs/23). A logged, non-dispatched
      // reminder keeps the audit trail honest without contacting the family.
      // The dedicated action (not immunization.remind) also keeps the reminder
      // sweep's look-back dedupe honest — an opted-out click must not read as
      // "already reminded" once the preference is lifted.
      if (immunization.patient.reminderOptOut) {
        recordAudit(db, request, {
          action: 'immunization.remind.optedOut',
          entityType: 'immunization',
          entityId: immunization.id,
          after: { channel, to: null, vaccine: immunization.vaccine, dose: immunization.dose, dispatched: false, provider: 'none', note: 'Patient opted out of reminders — not contacted.' },
        });
        return { reminded: false, channel, to: null, dispatched: false, provider: 'none', note: 'Patient opted out of reminders — not contacted.' };
      }

      // The reminder names the dose that is actually due (the successor in the
      // schedule) — e.g. PENTA 1 was given, so the recall invites for PENTA 2.
      const next = nextScheduleItem(immunization.vaccine, immunization.dose);
      const dueDose = next ?? { vaccine: immunization.vaccine, dose: immunization.dose, description: immunization.vaccine };
      const message = buildReminderMessage({
        patientName: immunization.patient.fullName,
        description: dueDose.description,
        dose: dueDose.dose,
        nextDueAt: immunization.nextDueAt,
      });

      // Dispatch over the requested channel (SMS default, WhatsApp via Hubtel)
      // — degrades to a logged, non-dispatched recall when the gateway is not
      // connected so it is never silently dropped (spec §22).
      let result: Awaited<ReturnType<typeof dispatchSms>>;
      if (immunization.patient.phone) {
        result =
          channel === 'WHATSAPP'
            ? await dispatchWhatsApp({ to: immunization.patient.phone, message })
            : await dispatchSms({ to: immunization.patient.phone, message });
      } else {
        result = { dispatched: false, provider: 'none', note: 'No phone number on file — reminder logged to audit trail only.' };
      }

      recordAudit(db, request, {
        action: 'immunization.remind',
        entityType: 'immunization',
        entityId: immunization.id,
        after: {
          channel,
          to: immunization.patient.phone ?? null,
          vaccine: immunization.vaccine,
          dose: immunization.dose,
          message,
          dispatched: result.dispatched,
          provider: result.provider,
          messageId: result.messageId ?? null,
        },
      });
      return {
        reminded: true,
        channel,
        to: immunization.patient.phone ?? null,
        dispatched: result.dispatched,
        provider: result.provider,
        messageId: result.messageId ?? null,
        note: result.note ?? 'Reminder logged to audit trail.',
      };
    },
  );

  // ------------------------------------------------------- remind: bulk
  // One-click recall for a set of due/missed doses (web worklist checkboxes).
  // Same channel handling, message and scope as the single /remind — deduped,
  // bounded (200), and a single audit entry summarising the batch.
  app.post(
    '/immunizations/reminders/bulk',
    { preHandler: guards.requirePermission('write_clinical_note', 'view_patient'), schema: { summary: 'Send reminder recalls to many due/missed doses at once', tags: ['immunization'] } },
    async (request) => {
      const u = request.user!;
      const body = (request.body ?? {}) as Record<string, unknown>;
      const channel = (optStr(body.channel) ?? 'SMS').toUpperCase();
      if (!['SMS', 'WHATSAPP'].includes(channel)) throw httpErrors.badRequest('Channel must be SMS or WHATSAPP');
      const dryRun = body.dryRun === true;
      const rawIds = Array.isArray(body.ids) ? body.ids.map((x) => String(x)).filter(Boolean) : [];
      const ids = [...new Set(rawIds)];
      if (ids.length === 0) throw httpErrors.badRequest('Select at least one dose to remind');
      if (ids.length > 200) throw httpErrors.badRequest(`Bulk remind is capped at 200 doses per call — you sent ${ids.length}.`);

      const immunizations = await db.immunization.findMany({
        where: { id: { in: ids }, ...immunizationScope(u) },
        // reminderOptOut is required by the shared dispatch helper — without it
        // opted-out families would be treated as ordinary (non-)dispatches.
        include: { patient: { select: { id: true, fullName: true, phone: true, reminderOptOut: true } } },
      });
      const byId = new Map(immunizations.map((i) => [i.id, i]));
      // Out-of-scope / unknown ids are skipped, never an error — and they stay
      // visible in the summary so callers can reconcile the list.
      const missing = ids.filter((id) => !byId.has(id)).length;
      const { results, summary } = await dispatchReminderBatch(
        ids.map((id) => byId.get(id)).filter((x): x is NonNullable<typeof x> => Boolean(x)),
        channel as 'SMS' | 'WHATSAPP',
        dryRun,
      );
      summary.skipped += missing;
      if (!dryRun) auditOptedOutSkips(db, request, results, channel);

      recordAudit(db, request, {
        action: dryRun ? 'immunization.remind.bulk.preview' : 'immunization.remind.bulk',
        entityType: 'immunization',
        entityId: ids.length === 1 ? ids[0] : undefined,
        after: { channel, requested: ids.length, ...summary, dryRun },
      });
      return { channel, requested: ids.length, dryRun, results, summary };
    },
  );

  // ---------------------------------------------------- remind: all due
  // One-click "Remind all due" — dispatches to every child in the CURRENT
  // worklist filter (bucket + search) rather than a checkbox selection. Same
  // channel handling, message, scope and skip rules as /bulk — shares the
  // dispatchReminderBatch helper so the two behave identically. Honest cap:
  // the worklist itself caps at 100 rows, but a wider window may match more,
  // so the endpoint enforces the same 200 ceiling with a clear error.
  app.post(
    '/immunizations/reminders/remind-all',
    { preHandler: guards.requirePermission('write_clinical_note', 'view_patient'), schema: { summary: 'Send reminder recalls to every due/missed dose in the current worklist filter', tags: ['immunization'] } },
    async (request) => {
      const u = request.user!;
      const body = (request.body ?? {}) as Record<string, unknown>;
      const channel = (optStr(body.channel) ?? 'SMS').toUpperCase();
      if (!['SMS', 'WHATSAPP'].includes(channel)) throw httpErrors.badRequest('Channel must be SMS or WHATSAPP');
      const dryRun = body.dryRun === true;
      const windowDays = Math.max(0, Math.min(365, Number(body.windowDays ?? 30) || 30));
      const bucket = optStr(body.bucket)?.toUpperCase() ?? 'ALL';
      const query = optStr(body.q)?.toLowerCase();

      const due = await computeDueRows(db, u, windowDays);
      let matched = due;
      if (bucket !== 'ALL') matched = matched.filter((d) => d.bucket === bucket);
      if (query) {
        matched = matched.filter((d) => {
          const name = d.patient.fullName.toLowerCase();
          const mrn = d.patient.mrn.toLowerCase();
          return name.includes(query) || mrn.includes(query);
        });
      }
      if (matched.length === 0) throw httpErrors.badRequest('No doses match the current filter — nothing to remind.');
      if (matched.length > 200) throw httpErrors.badRequest(`Remind all is capped at 200 doses per run — ${matched.length} match the filter. Narrow the window or bucket.`);

      const { results, summary } = await dispatchReminderBatch(
        matched.map((d) => ({ id: d.id, vaccine: d.vaccine, dose: d.dose, status: 'GIVEN', nextDueAt: d.nextDueAt, patient: d.patient })),
        channel as 'SMS' | 'WHATSAPP',
        dryRun,
      );
      if (!dryRun) auditOptedOutSkips(db, request, results, channel);

      recordAudit(db, request, {
        action: dryRun ? 'immunization.remind.all.preview' : 'immunization.remind.all',
        entityType: 'immunization',
        after: { channel, windowDays, bucket, q: query ?? null, matched: matched.length, ...summary, dryRun },
      });
      return { channel, matched: matched.length, dryRun, results, summary };
    },
  );

  // --------------------------------------------------- reminders: run
  // Manual trigger for the auto-reminder sweep (also run on a schedule by the
  // server — see server.ts). Ops action: dispatches paid recalls, so it is
  // guarded beyond clinical write permissions AND scoped to the caller — a
  // facility user only recalls their own catchment, never the whole country.
  app.post(
    '/immunizations/reminders/run',
    { preHandler: guards.requirePermission('view_reports', 'view_audit', 'sync_data'), schema: { summary: 'Run the auto-reminder sweep (dispatch due recalls, scoped)', tags: ['immunization'] } },
    async (request) => {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const summary = await runScheduledReminders(db, {
        windowDays: body.windowDays === undefined ? undefined : Number(body.windowDays),
        lookbackDays: body.lookbackDays === undefined ? undefined : Number(body.lookbackDays),
      }, request.user!);
      if (summary.skipped) throw httpErrors.conflict('A reminder sweep is already running — try again shortly.');
      recordAudit(db, request, { action: 'immunization.reminders.run', entityType: 'immunization', after: summary });
      return summary;
    },
  );

  // ------------------------------------------ reminders: delivery status
  // SMSOnlineGH pushes delivery notifications to the webhook below (see
  // dispatchSmsOnlineGh's callback); statuses are recorded on the audit trail
  // and surfaced here. The gateway has no per-message polling API, so the
  // recorded notifications are the source of truth.
  app.get(
    '/immunizations/reminders/status/:messageId',
    { preHandler: guards.requirePermission('view_reports', 'view_audit'), schema: { summary: 'Delivery status for a sent reminder (from delivery notifications)', tags: ['immunization'] } },
    async (request) => {
      const { messageId } = request.params as { messageId: string };
      const rows = await db.auditLog.findMany({
        where: {
          // Bound the LIKE scan: delivery lookups only care about recent history.
          createdAt: { gte: new Date(Date.now() - 90 * DAY_MS) },
          OR: [
            { action: { in: ['immunization.remind', 'immunization.remind.auto'] }, after: { contains: messageId } },
            { action: 'immunization.remind.delivery', entityId: messageId },
          ],
        },
        orderBy: { createdAt: 'asc' },
        take: 200,
      });
      const parse = (s: string | null): Record<string, unknown> => {
        try { return JSON.parse(s ?? '{}') as Record<string, unknown>; } catch { return {}; }
      };
      // Dispatch rows only — delivery-callback rows must never be mistaken for
      // the dispatch record (they share the message id via entityId).
      const dispatchRows = rows.filter((r) => r.action === 'immunization.remind' || r.action === 'immunization.remind.auto');
      const lastDispatch = dispatchRows[dispatchRows.length - 1];
      return {
        messageId,
        found: rows.length > 0,
        dispatch: lastDispatch ? { at: lastDispatch.createdAt.toISOString(), actorEmail: lastDispatch.actorEmail ?? null, ...parse(lastDispatch.after) } : null,
        deliveries: rows.filter((r) => r.action === 'immunization.remind.delivery').map((d) => ({ at: d.createdAt.toISOString(), ...parse(d.after) })),
      };
    },
  );

  // Reminder delivery report: aggregates dispatch outcomes (dispatched vs
  // rejected vs no-phone vs gateway-off) and any delivery notifications, all
  // from the audit trail — no gateway call needed.
  app.get(
    '/immunizations/reminders/report',
    { preHandler: guards.requirePermission('view_reports', 'view_audit'), schema: { summary: 'Reminder delivery report (dispatch outcomes + delivery statuses)', tags: ['immunization'] } },
    async (request) => {
      const q = request.query as Record<string, unknown>;
      const days = Math.max(1, Math.min(365, Number(q.days ?? 30) || 30));
      const since = new Date(Date.now() - days * DAY_MS);
      const logs = await db.auditLog.findMany({
        where: { action: { in: ['immunization.remind', 'immunization.remind.auto', 'immunization.remind.optedOut', 'immunization.remind.delivery'] }, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 5000,
      });
      // Dispatch + opted-out rows carry the immunization id (delivery rows carry
      // the gateway messageId) — resolve patient district/region for the roll-up.
      const entityIds = [...new Set(logs.filter((l) => l.action !== 'immunization.remind.delivery').map((l) => l.entityId).filter((x): x is string => Boolean(x)))];
      const immunizations = entityIds.length
        ? await db.immunization.findMany({
            where: { id: { in: entityIds } },
            include: { patient: { select: { district: { select: { name: true, region: { select: { name: true } } } } } } },
          })
        : [];
      const locationByImm = new Map(immunizations.map((i) => [i.id, { district: i.patient.district?.name ?? null, region: i.patient.district?.region.name ?? null }]));
      const totals = { attempted: 0, dispatched: 0, rejected: 0, noPhone: 0, notConnected: 0, optedOut: 0 };
      const byChannel: Record<string, number> = {};
      const byProvider: Record<string, number> = {};
      const deliveryStatuses: Record<string, number> = {};
      const byDistrict: Record<string, number> = {};
      const byRegion: Record<string, number> = {};
      const recent: Array<Record<string, unknown>> = [];
      for (const log of logs) {
        let after: Record<string, unknown> = {};
        try { after = JSON.parse(log.after ?? '{}') as Record<string, unknown>; } catch { continue; }
        if (log.action === 'immunization.remind.delivery') {
          const label = typeof after.statusLabel === 'string' ? after.statusLabel : String(after.status ?? 'unknown');
          deliveryStatuses[label] = (deliveryStatuses[label] ?? 0) + 1;
          continue;
        }
        const loc = log.entityId ? locationByImm.get(log.entityId) : undefined;
        const district = loc?.district ?? 'Unspecified';
        const region = loc?.region ?? 'Unspecified';
        byDistrict[district] = (byDistrict[district] ?? 0) + 1;
        byRegion[region] = (byRegion[region] ?? 0) + 1;
        // Opted-out skips are not dispatch attempts — surfaced separately so a
        // team sees how many families declined recalls in the window.
        if (log.action === 'immunization.remind.optedOut') {
          totals.optedOut++;
          recent.push({
            at: log.createdAt.toISOString(),
            action: log.action,
            entityId: log.entityId ?? null,
            channel: String(after.channel ?? 'SMS'),
            provider: 'none',
            dispatched: false,
            messageId: null,
            district,
            region,
            note: typeof after.note === 'string' ? after.note : 'Patient opted out of reminders.',
          });
          continue;
        }
        totals.attempted++;
        const note = typeof after.note === 'string' ? after.note : '';
        if (after.dispatched === true) totals.dispatched++;
        else if (note.includes('No phone number')) totals.noPhone++;
        else if (note.includes('not connected')) totals.notConnected++;
        else totals.rejected++;
        const channel = String(after.channel ?? 'SMS');
        const provider = String(after.provider ?? 'none');
        byChannel[channel] = (byChannel[channel] ?? 0) + 1;
        byProvider[provider] = (byProvider[provider] ?? 0) + 1;
        recent.push({
          at: log.createdAt.toISOString(),
          action: log.action,
          entityId: log.entityId ?? null,
          channel,
          provider,
          dispatched: after.dispatched === true,
          messageId: after.messageId ?? null,
          district,
          region,
          note: note || null,
        });
      }
      return { windowDays: days, since: since.toISOString(), totals, byChannel, byProvider, deliveryStatuses, byDistrict, byRegion, recent: recent.slice(0, 100) };
    },
  );

  // Per-facility reminder run report: every dispatch attempt in the window
  // (who was reminded, on which channel, the outcome) joined to patient + dose
  // and resolved to the recording facility — exportable as CSV. Audit rows for
  // immunization.remind / remind.auto carry the immunization id (entityId); the
  // join back to patient/facility happens here so the report is drill-downable.
  app.get(
    '/immunizations/export/reminders',
    { preHandler: guards.requirePermission('view_reports', 'view_audit'), schema: { summary: 'Export the reminder run report (per-facility) as CSV', tags: ['immunization'] } },
    async (request, reply) => {
      const q = request.query as Record<string, unknown>;
      const days = Math.max(1, Math.min(365, Number(q.days ?? 30) || 30));
      const channelFilter = optStr(q.channel)?.toUpperCase();
      const facilityId = optStr(q.facilityId);
      const districtFilter = optStr(q.district)?.toLowerCase();
      const regionFilter = optStr(q.region)?.toLowerCase();
      const since = new Date(Date.now() - days * DAY_MS);
      const logs = await db.auditLog.findMany({
        where: { action: { in: ['immunization.remind', 'immunization.remind.auto'] }, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 5000,
      });
      // Resolve doses + patients + facilities (with district/region) for the
      // dispatch rows' entityIds — so the export is drill-downable by location.
      const entityIds = [...new Set(logs.map((l) => l.entityId).filter((x): x is string => Boolean(x)))];
      const immunizations = entityIds.length
        ? await db.immunization.findMany({
            where: { id: { in: entityIds } },
            include: { patient: { select: { fullName: true, mrn: true, phone: true, district: { select: { name: true, region: { select: { name: true } } } } } } },
          })
        : [];
      const byId = new Map(immunizations.map((i) => [i.id, i]));
      const rows: (string | number | null | undefined)[][] = [];
      for (const log of logs) {
        let after: Record<string, unknown> = {};
        try { after = JSON.parse(log.after ?? '{}') as Record<string, unknown>; } catch { continue; }
        const channel = String(after.channel ?? 'SMS').toUpperCase();
        if (channelFilter && channel !== channelFilter) continue;
        const imm = log.entityId ? byId.get(log.entityId) : undefined;
        if (facilityId && imm?.facilityId !== facilityId) continue;
        const district = imm?.patient.district?.name ?? null;
        const region = imm?.patient.district?.region.name ?? null;
        if (districtFilter && !(district?.toLowerCase().includes(districtFilter) ?? false)) continue;
        if (regionFilter && !(region?.toLowerCase().includes(regionFilter) ?? false)) continue;
        rows.push([
          log.createdAt.toISOString(),
          imm?.patient.fullName ?? null,
          imm?.patient.mrn ?? null,
          imm?.patient.phone ?? null,
          imm?.vaccine ?? null,
          imm?.dose ?? null,
          channel,
          String(after.provider ?? 'none'),
          after.dispatched === true ? 'dispatched' : 'not dispatched',
          district,
          region,
          typeof after.messageId === 'string' ? after.messageId : null,
          typeof after.note === 'string' ? after.note : null,
        ]);
      }
      const csv = toCsv(['When', 'Patient', 'MRN', 'Phone', 'Vaccine', 'Dose', 'Channel', 'Provider', 'Outcome', 'District', 'Region', 'Message id', 'Note'], rows);
      reply.header('Content-Type', 'text/csv; charset=utf-8');
      reply.header('Content-Disposition', `attachment; filename="reminder-runs-${days}d.csv"`);
      return reply.send(csv);
    },
  );

  // Inbound delivery-status webhook from the SMS gateway. SMSOnlineGH pushes
  // notifications here when SMSONLINEGH_CALLBACK_URL is configured on sends.
  // Guarded by a shared-secret token when SMSONLINEGH_CALLBACK_TOKEN is set
  // (header x-callback-token or ?token=); open otherwise for easy dev setup.
  app.post(
    '/immunizations/reminders/delivery-callback',
    { schema: { summary: 'Inbound delivery-status webhook from the SMS gateway', tags: ['immunization'] } },
    async (request) => {
      // Fail-closed exactly when the webhook is actually enabled: a deployment
      // that configures SMSONLINEGH_CALLBACK_URL must also set the shared-secret
      // token, or the endpoint stays open (dev default) and delivery records
      // could be spoofed.
      // Resolve through the settings store so admin Settings edits apply live.
      const callbackUrl = getSetting('sms.smsonlinegh.callbackUrl');
      const token = getSetting('sms.smsonlinegh.callbackToken');
      if (callbackUrl && !token) throw httpErrors.unauthorized('A callback token is required when a delivery callback URL is configured');
      if (token) {
        const supplied = (request.headers['x-callback-token'] as string | undefined) ?? (request.query as Record<string, unknown>).token;
        if (typeof supplied !== 'string' || supplied !== token) throw httpErrors.unauthorized('Invalid delivery-callback token');
      }
      const body = (request.body ?? {}) as Record<string, unknown>;
      const pick = (...keys: string[]): string | null => {
        for (const k of keys) {
          const v = body[k];
          if (typeof v === 'string' && v) return v;
          if (typeof v === 'number') return String(v);
        }
        return null;
      };
      // Case-sensitive key access below is intentional but the pick lists are
      // tolerant: SMSOnlineGH sends { status: {label} }, Hubtel sends
      // { MessageId, Status, Message: 'Success' } — both resolve.
      const messageId = pick('messageId', 'message_id', 'MessageId', 'batch', 'id', 'messageID');
      const rawStatus = body.status;
      const statusLabel =
        typeof rawStatus === 'string'
          ? rawStatus
          : rawStatus && typeof rawStatus === 'object' && typeof (rawStatus as Record<string, unknown>).label === 'string'
            ? String((rawStatus as Record<string, unknown>).label)
            : pick('statusLabel', 'deliveryStatus', 'Status', 'errorCode', 'Message') ?? 'unknown';
      // A webhook receipt must be durable before we answer: await the audit
      // write (recordAudit is fire-and-forget — an immediate status lookup
      // could otherwise miss the record). Low volume, so the await is fine.
      await db.auditLog.create({
        data: {
          actorEmail: 'gateway@smsonlinegh',
          role: 'GATEWAY',
          action: 'immunization.remind.delivery',
          entityType: 'immunization',
          entityId: messageId ?? undefined,
          ip: request.ip,
          after: JSON.stringify({ provider: 'smsonlinegh', messageId, statusLabel, raw: body }),
        },
      });
      return { ok: true, messageId };
    },
  );

  // ------------------------------------------------------------ coverage
  app.get(
    '/immunizations/coverage',
    { preHandler: guards.requirePermission('view_reports', 'view_dashboard'), schema: { summary: 'Dose-level immunization coverage within scope (optional unsaved-schedule preview)', tags: ['immunization'] } },
    async (request) => {
      const q = request.query as Record<string, unknown>;
      let previewItems: Array<{ vaccine: string; dose: string; ageDays: number | null; active?: boolean }> | undefined;
      if (typeof q.previewItems === 'string' && q.previewItems) {
        try {
          const parsed = JSON.parse(q.previewItems) as unknown;
          if (Array.isArray(parsed)) {
            previewItems = parsed
              .filter((x): x is { vaccine: string; dose: string; ageDays: number | null; active?: boolean } => {
                const r = x as { vaccine?: unknown; dose?: unknown; ageDays?: unknown; active?: unknown };
                const activeOk = r.active === undefined || typeof r.active === 'boolean';
                return typeof r.vaccine === 'string' && typeof r.dose === 'string' && (typeof r.ageDays === 'number' || r.ageDays === null) && activeOk;
              })
              .slice(0, 200);
          }
        } catch {
          throw httpErrors.badRequest('previewItems must be a JSON array of { vaccine, dose, ageDays }');
        }
      }
      const coverage = await computeCoverage(db, request.user!, { previewItems });
      return { ...coverage, generatedAt: new Date().toISOString() };
    },
  );

  // ------------------------------------------------------- CSV exports
  app.get(
    '/immunizations/export/due',
    { preHandler: guards.requirePermission('view_reports', 'view_dashboard', 'view_clinical_record'), schema: { summary: 'Export the due/overdue worklist as CSV', tags: ['immunization'] } },
    async (request, reply) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const windowDays = Math.max(0, Math.min(365, Number(q.window ?? 90) || 90));
      const due = await computeDueRows(db, u, windowDays);
      const csv = toCsv(
        ['Patient name', 'MRN', 'Date of birth', 'Phone', 'District', 'Vaccine', 'Dose', 'Description', 'Last dose given', 'Next due', 'Days until', 'Days overdue', 'Status'],
        due.map((d) => [
          d.patient.fullName,
          d.patient.mrn,
          d.patient.dateOfBirth ? d.patient.dateOfBirth.toISOString().slice(0, 10) : '',
          d.patient.phone ?? '',
          d.patient.districtName ?? '',
          d.vaccine,
          d.dose,
          d.description,
          d.lastDoseAt.toISOString().slice(0, 10),
          d.nextDueAt.toISOString().slice(0, 10),
          d.daysUntil,
          d.daysOverdue,
          d.bucket,
        ]),
      );
      reply.header('Content-Type', 'text/csv; charset=utf-8');
      reply.header('Content-Disposition', 'attachment; filename="immunizations-due.csv"');
      return reply.send(csv);
    },
  );

  app.get(
    '/immunizations/export/missed',
    { preHandler: guards.requirePermission('view_reports', 'view_dashboard', 'view_clinical_record'), schema: { summary: 'Export the missed-dose follow-up list as CSV', tags: ['immunization'] } },
    async (request, reply) => {
      const items = await computeMissedRows(db, request.user!);
      const csv = toCsv(
        ['Patient name', 'MRN', 'Date of birth', 'Phone', 'District', 'Vaccine', 'Dose', 'Description', 'Missed since', 'Last dose given', 'Days overdue'],
        items.map((r) => [
          r.patient.fullName,
          r.patient.mrn,
          r.patient.dateOfBirth ? r.patient.dateOfBirth.toISOString().slice(0, 10) : '',
          r.patient.phone ?? '',
          r.patient.districtName ?? '',
          r.vaccine,
          r.dose,
          r.description,
          r.missedSince ? r.missedSince.toISOString().slice(0, 10) : '',
          r.lastGivenAt.toISOString().slice(0, 10),
          r.daysOverdue ?? '',
        ]),
      );
      reply.header('Content-Type', 'text/csv; charset=utf-8');
      reply.header('Content-Disposition', 'attachment; filename="immunizations-missed.csv"');
      return reply.send(csv);
    },
  );

  app.get(
    '/immunizations/export/coverage',
    { preHandler: guards.requirePermission('view_reports', 'view_dashboard'), schema: { summary: 'Export immunization coverage indicators as CSV', tags: ['immunization'] } },
    async (request, reply) => {
      const coverage = await computeCoverage(db, request.user!);
      const rows = coverage.indicators.map((i) => [i.label, i.vaccine, i.dose, i.eligible, i.vaccinated, `${i.coveragePct}%`]);
      rows.push(['PENTA1 to PENTA3 dropout rate', 'PENTA', '1-3', '', '', `${coverage.dropoutRate}%`]);
      rows.push(['Fully immunized (12-month cohort)', '', '', coverage.fullyImmunized.eligible, coverage.fullyImmunized.vaccinated, `${coverage.fullyImmunized.coveragePct}%`]);
      const csv = toCsv(['Indicator', 'Vaccine', 'Dose', 'Eligible', 'Vaccinated', 'Coverage'], rows);
      reply.header('Content-Type', 'text/csv; charset=utf-8');
      reply.header('Content-Disposition', 'attachment; filename="immunization-coverage.csv"');
      return reply.send(csv);
    },
  );
}
