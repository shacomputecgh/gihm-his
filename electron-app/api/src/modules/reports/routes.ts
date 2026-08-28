import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import type { Guards } from '../../lib/guards.js';
import { httpErrors } from '../../lib/http.js';
import { optStr } from '../../lib/validate.js';
import { toCsv } from '../../lib/csv.js';
import { recordAudit } from '../../lib/audit.js';
import type { AuthUser } from '../../types.js';
import {
  INDICATORS,
  computeIndicators,
  present,
  groupRows,
  callerScopeOf,
  facilityScopeOf,
  facilityListScope,
  parseRange,
} from './compute.js';
import { computeAnomalies } from './anomalies.js';
import { validateSchedule, snapshotForUser, nextRunAt, runSchedule, buildReportContent, reportCsv, periodForCadence, retryDelivery } from './schedule.js';

/** A schedule is visible when its scope snapshot matches the caller's. */
function scheduleVisibleTo(u: AuthUser, s: { scope: string; facilityId: string | null; regionId: string | null; districtId: string | null }): boolean {
  if (u.scope !== s.scope) return false;
  if (u.scope === 'FACILITY') return u.facilityId === s.facilityId;
  if (u.scope === 'REGIONAL') return u.regionId === s.regionId;
  if (u.scope === 'DISTRICT') return u.districtId === s.districtId;
  return true; // NATIONAL
}

/** Prisma where-clause for the schedules a caller may see (mirrors scheduleVisibleTo). */
function scheduleScopeWhere(u: AuthUser): { scope: string; facilityId?: string | null; regionId?: string | null; districtId?: string | null } {
  switch (u.scope) {
    case 'FACILITY': return { scope: u.scope, facilityId: u.facilityId ?? null };
    case 'REGIONAL': return { scope: u.scope, regionId: u.regionId ?? null };
    case 'DISTRICT': return { scope: u.scope, districtId: u.districtId ?? null };
    default: return { scope: u.scope };
  }
}

/** Report builder + DHIMS-II mapping (spec §50, §80) — live aggregates, never manual re-entry. */
export function registerReportRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  // ------------------------------------------------------------ catalog
  app.get(
    '/reports/indicators',
    { preHandler: guards.requirePermission('view_reports', 'view_dashboard'), schema: { summary: 'DHIMS-II indicator catalog (live-mapped)', tags: ['reports'] } },
    async () => ({ indicators: INDICATORS, note: 'Synthetic DHIMS-II area codes — replace with the national indicator register at deployment (docs/14).' }),
  );

  // ------------------------------------------------------------ summary
  app.get(
    '/reports/summary',
    { preHandler: guards.requirePermission('view_reports', 'view_dashboard'), schema: { summary: 'Indicator summary for a period, optionally grouped by facility/district/region', tags: ['reports'] } },
    async (request) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const r = parseRange(q);
      const groupBy = (optStr(q.groupBy) ?? 'none') as 'none' | 'facility' | 'district' | 'region';
      if (!['none', 'facility', 'district', 'region'].includes(groupBy)) throw httpErrors.badRequest('groupBy must be none | facility | district | region');

      const overall = await computeIndicators(db, u, r, callerScopeOf(db, u));
      recordAudit(db, request, { action: 'report.summary', entityType: 'report', after: { from: r.gte.toISOString(), to: r.lt.toISOString(), groupBy } });

      // ---- group breakdown (capped at 60 groups)
      let groups: Array<{ id: string; name: string; indicators: Record<string, number | null> }> = [];
      let truncated = false;
      if (groupBy !== 'none') {
        const facilities = await db.facility.findMany({
          where: facilityListScope(u),
          select: { id: true, name: true, district: { select: { id: true, name: true } }, region: { select: { id: true, name: true } } },
        });
        if (facilities.length > 60) truncated = true;
        groups = await groupRows(db, u, r, facilities.slice(0, 60), groupBy);
      }

      return { scope: u.scope, from: r.gte.toISOString(), to: r.lt.toISOString(), groupBy, indicators: present(overall), groups, truncated, generatedAt: new Date().toISOString() };
    },
  );

  // ------------------------------------------------------- anomalies
  // Anomaly detection on indicator trends (spec §50, docs/14 §4): weekly
  // z-score flags on the live-computed series — aggregate-only, scoped to the
  // caller exactly like /reports/summary.
  app.get(
    '/reports/anomalies',
    { preHandler: guards.requirePermission('view_reports', 'view_dashboard'), schema: { summary: 'Anomaly detection on indicator trends (weekly z-score)', tags: ['reports'] } },
    async (request) => {
      const u = request.user!;
      const r = parseRange(request.query as Record<string, unknown>);
      // Anomaly analysis buckets weekly (MAX_WEEKS=16 ≈ 112 days) — a longer
      // window would be silently truncated, so reject it loudly instead.
      if (r.lt.getTime() - r.gte.getTime() > 120 * 24 * 60 * 60 * 1000) throw httpErrors.badRequest('Anomaly detection covers at most 120 days');
      const result = await computeAnomalies(db, u, r.gte, r.lt);
      recordAudit(db, request, { action: 'report.anomalies', entityType: 'report', after: { from: r.gte.toISOString(), to: r.lt.toISOString(), anomalies: result.summary.anomalies, high: result.summary.high } });
      return result;
    },
  );

  // ----------------------------------------------------- completeness
  // Reporting completeness (docs/14): how many of the facilities in the
  // caller's scope actually recorded any activity in the period. Aggregates
  // only — no patient-identifiable rows.
  app.get(
    '/reports/completeness',
    { preHandler: guards.requirePermission('view_reports', 'view_dashboard'), schema: { summary: 'Per-facility reporting completeness for a period', tags: ['reports'] } },
    async (request) => {
      const u = request.user!;
      const r = parseRange(request.query as Record<string, unknown>);
      const facilities = await db.facility.findMany({
        where: facilityListScope(u),
        select: { id: true, code: true, name: true, district: { select: { name: true } }, region: { select: { name: true } } },
        take: 300,
      });
      // Concurrent per-facility activity check (read-only) so national scopes stay responsive.
      const rows: Array<{ facilityId: string; code: string; name: string; district: string | null; region: string | null; reported: boolean; activity: string | null }> = [];
      const computed = await Promise.all(
        facilities.map(async (f) => {
          const scopeOf = facilityScopeOf(f.id);
          const [encounters, admissions, labs, cases, immunizations] = await Promise.all([
            db.encounter.count({ where: { ...(await scopeOf('encounter')), createdAt: r } }),
            db.admission.count({ where: { ...(await scopeOf('admission')), admittedAt: r } }),
            db.labOrder.count({ where: { ...(await scopeOf('labOrder')), createdAt: r } }),
            db.diseaseCase.count({ where: { ...(await scopeOf('diseaseCase')), reportedAt: r } }),
            db.immunization.count({ where: { ...(await scopeOf('immunization')), administeredAt: r } }),
          ]);
          const activity: Array<[string, number]> = [];
          if (encounters) activity.push(['OPD encounters', encounters]);
          if (admissions) activity.push(['admissions', admissions]);
          if (labs) activity.push(['lab tests', labs]);
          if (cases) activity.push(['disease cases', cases]);
          if (immunizations) activity.push(['immunizations', immunizations]);
          return { f, reported: activity.length > 0, activity: activity.map(([k, n]) => `${k}: ${n}`).join(', ') || null };
        }),
      );
      for (const { f, reported, activity } of computed) {
        rows.push({ facilityId: f.id, code: f.code, name: f.name, district: f.district?.name ?? null, region: f.region?.name ?? null, reported, activity });
      }
      const reported = rows.filter((row) => row.reported).length;
      recordAudit(db, request, { action: 'report.completeness', entityType: 'report', after: { from: r.gte.toISOString(), to: r.lt.toISOString(), expected: rows.length, reported } });
      return {
        scope: u.scope,
        from: r.gte.toISOString(),
        to: r.lt.toISOString(),
        facilities: { expected: rows.length, reported },
        completenessPct: rows.length > 0 ? Math.round((reported / rows.length) * 100) : 0,
        rows,
        generatedAt: new Date().toISOString(),
      };
    },
  );

  // ---------------------------------------------- scheduled reports (spec §149)
  // Subscriptions that email an authorised recipient list on a cadence — the
  // scope is snapshotted at creation so schedules outlive role changes.
  app.get(
    '/reports/schedules',
    { preHandler: guards.requirePermission('view_reports', 'view_dashboard', 'manage_scheduled_reports'), schema: { summary: 'List scheduled report subscriptions in scope', tags: ['reports'] } },
    async (request) => {
      const u = request.user!;
      const schedules = await db.scheduledReport.findMany({
        // Same scope snapshot check as scheduleVisibleTo — REGIONAL/DISTRICT
        // users must never see another region's/district's recipient lists.
        where: scheduleScopeWhere(u),
        orderBy: [{ active: 'desc' }, { nextRunAt: 'asc' }],
        include: { createdBy: { select: { fullName: true } } },
      });
      return {
        schedules: schedules.map((s) => ({ ...s, createdByName: s.createdBy?.fullName ?? null, createdBy: undefined })),
        cadences: ['daily', 'weekly', 'monthly', 'quarterly', 'annual'],
        reportTypes: ['summary', 'completeness', 'anomalies'],
      };
    },
  );

  app.post(
    '/reports/schedules',
    { preHandler: guards.requirePermission('manage_scheduled_reports'), schema: { summary: 'Create a scheduled report subscription', tags: ['reports'] } },
    async (request) => {
      const u = request.user!;
      const body = request.body as Record<string, unknown>;
      const v = validateSchedule(body);
      const snapshot = snapshotForUser(u);
      const schedule = await db.scheduledReport.create({
        data: {
          name: v.name,
          reportType: v.reportType,
          cadence: v.cadence,
          runTime: v.runTime,
          dayOfWeek: v.dayOfWeek,
          dayOfMonth: v.dayOfMonth,
          recipients: v.recipients.join(','),
          groupBy: v.groupBy,
          scope: snapshot.scope,
          facilityId: snapshot.facilityId,
          regionId: snapshot.regionId,
          districtId: snapshot.districtId,
          createdById: u.id,
          nextRunAt: nextRunAt(new Date(), { cadence: v.cadence, runTime: v.runTime, dayOfWeek: v.dayOfWeek, dayOfMonth: v.dayOfMonth }),
        },
      });
      recordAudit(db, request, { action: 'report.schedule.create', entityType: 'report', after: { name: v.name, cadence: v.cadence, recipients: v.recipients.length, scope: snapshot.scope } });
      return schedule;
    },
  );

  app.patch(
    '/reports/schedules/:id',
    { preHandler: guards.requirePermission('manage_scheduled_reports'), schema: { summary: 'Update a scheduled report subscription', tags: ['reports'] } },
    async (request) => {
      const u = request.user!;
      const id = (request.params as { id: string }).id;
      const existing = await db.scheduledReport.findUnique({ where: { id } });
      if (!existing || !scheduleVisibleTo(u, existing)) throw httpErrors.notFound('Schedule not found');
      const body = request.body as Record<string, unknown>;
      const v = validateSchedule({ ...existing, ...body });
      const updated = await db.scheduledReport.update({
        where: { id },
        data: {
          name: v.name,
          reportType: v.reportType,
          cadence: v.cadence,
          runTime: v.runTime,
          dayOfWeek: v.dayOfWeek,
          dayOfMonth: v.dayOfMonth,
          recipients: v.recipients.join(','),
          groupBy: v.groupBy,
          active: body.active === undefined ? existing.active : Boolean(body.active),
        },
      });
      recordAudit(db, request, { action: 'report.schedule.update', entityType: 'report', after: { id, active: updated.active } });
      return updated;
    },
  );

  app.delete(
    '/reports/schedules/:id',
    { preHandler: guards.requirePermission('manage_scheduled_reports'), schema: { summary: 'Delete a scheduled report subscription', tags: ['reports'] } },
    async (request) => {
      const u = request.user!;
      const id = (request.params as { id: string }).id;
      const existing = await db.scheduledReport.findUnique({ where: { id } });
      if (!existing || !scheduleVisibleTo(u, existing)) throw httpErrors.notFound('Schedule not found');
      await db.scheduledReport.delete({ where: { id } });
      recordAudit(db, request, { action: 'report.schedule.delete', entityType: 'report', after: { id } });
      return { ok: true };
    },
  );

  // Run one schedule immediately (manual trigger / catch-up).
  app.post(
    '/reports/schedules/:id/run',
    { preHandler: guards.requirePermission('manage_scheduled_reports'), schema: { summary: 'Run a scheduled report now', tags: ['reports'] } },
    async (request) => {
      const u = request.user!;
      const id = (request.params as { id: string }).id;
      const schedule = await db.scheduledReport.findUnique({ where: { id } });
      if (!schedule || !scheduleVisibleTo(u, schedule)) throw httpErrors.notFound('Schedule not found');
      const result = await runSchedule(db, schedule, new Date());
      recordAudit(db, request, { action: 'report.schedule.run', entityType: 'report', after: { id, status: result.status } });
      return result;
    },
  );

  // Delivery log for schedules in scope (who got what, when).
  app.get(
    '/reports/schedules/deliveries',
    { preHandler: guards.requirePermission('view_reports', 'view_dashboard', 'manage_scheduled_reports'), schema: { summary: 'Scheduled-report delivery log', tags: ['reports'] } },
    async (request) => {
      const u = request.user!;
      const ids = (await db.scheduledReport.findMany({ where: scheduleScopeWhere(u), select: { id: true } })).map((s) => s.id);
      const deliveries = await db.reportDelivery.findMany({ where: { scheduleId: { in: ids } }, orderBy: { runAt: 'desc' }, take: 100 });
      return { deliveries };
    },
  );

  // Retry one failed/skipped delivery immediately — the same rebuild-and-fan-out
  // the automatic retry sweep performs, out of band (docs/14 §5). Scope-checked
  // against the owning schedule so a caller can only retry their own deliveries.
  app.post(
    '/reports/schedules/deliveries/:id/retry',
    { preHandler: guards.requirePermission('manage_scheduled_reports'), schema: { summary: 'Retry a scheduled-report delivery', tags: ['reports'] } },
    async (request) => {
      const u = request.user!;
      const id = (request.params as { id: string }).id;
      const delivery = await db.reportDelivery.findUnique({ where: { id } });
      if (!delivery) throw httpErrors.notFound('Delivery not found');
      const schedule = await db.scheduledReport.findUnique({ where: { id: delivery.scheduleId } });
      if (!schedule || !scheduleVisibleTo(u, schedule)) throw httpErrors.notFound('Delivery not found');
      const result = await retryDelivery(db, delivery);
      recordAudit(db, request, { action: 'report.delivery.retry', entityType: 'report', after: { id, status: result.delivered ? 'sent' : 'failed' } });
      return { id, delivered: result.delivered, note: result.note };
    },
  );

  // Download the latest run's data as CSV (the email carries the same numbers).
  app.get(
    '/reports/schedules/:id/latest.csv',
    { preHandler: guards.requirePermission('view_reports', 'view_dashboard', 'manage_scheduled_reports'), schema: { summary: 'Latest scheduled-report data as CSV', tags: ['reports'] } },
    async (request, reply) => {
      const u = request.user!;
      const id = (request.params as { id: string }).id;
      const schedule = await db.scheduledReport.findUnique({ where: { id } });
      if (!schedule || !scheduleVisibleTo(u, schedule)) throw httpErrors.notFound('Schedule not found');
      // The period the schedule covers when run now (same cadence math as the sweep).
      const period = periodForCadence(schedule.cadence as Parameters<typeof periodForCadence>[0], new Date());
      const content = await buildReportContent(db, schedule, period);
      const csv = reportCsv(content);
      reply.header('Content-Type', 'text/csv; charset=utf-8');
      reply.header('Content-Disposition', `attachment; filename="scheduled-report-${schedule.id.slice(0, 8)}.csv"`);
      return reply.send(csv);
    },
  );

  // ------------------------------------------------------------ export
  app.get(
    '/reports/export',
    { preHandler: guards.requirePermission('view_reports', 'view_dashboard', 'export_data'), schema: { summary: 'Export the indicator summary (or completeness) as CSV', tags: ['reports'] } },
    async (request, reply) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const format = (optStr(q.format) ?? 'csv').toLowerCase();
      if (format !== 'csv') throw httpErrors.badRequest('Only CSV export is supported');
      const report = (optStr(q.report) ?? 'indicators').toLowerCase();
      if (report !== 'indicators' && report !== 'completeness') throw httpErrors.badRequest('report must be indicators | completeness');

      if (report === 'completeness') {
        const r = parseRange(q);
        const facilities = await db.facility.findMany({ where: facilityListScope(u), select: { id: true, code: true, name: true, district: { select: { name: true } }, region: { select: { name: true } } }, take: 300 });
        const rows: string[][] = await Promise.all(
          facilities.map(async (f) => {
            const s = facilityScopeOf(f.id);
            const [encounters, admissions, labs, cases, immunizations] = await Promise.all([
              db.encounter.count({ where: { ...(await s('encounter')), createdAt: r } }),
              db.admission.count({ where: { ...(await s('admission')), admittedAt: r } }),
              db.labOrder.count({ where: { ...(await s('labOrder')), createdAt: r } }),
              db.diseaseCase.count({ where: { ...(await s('diseaseCase')), reportedAt: r } }),
              db.immunization.count({ where: { ...(await s('immunization')), administeredAt: r } }),
            ]);
            return [
              f.code, f.name, f.district?.name ?? '', f.region?.name ?? '',
              encounters + admissions + labs + cases + immunizations > 0 ? 'Yes' : 'No',
              String(encounters), String(admissions),
            ] as string[];
          }),
        );
        recordAudit(db, request, { action: 'report.export', entityType: 'report', after: { report: 'completeness', from: r.gte.toISOString(), to: r.lt.toISOString() } });
        const csv = toCsv(['Facility code', 'Facility', 'District', 'Region', 'Reported', 'OPD encounters', 'Admissions'], rows);
        reply.header('Content-Type', 'text/csv; charset=utf-8');
        reply.header('Content-Disposition', 'attachment; filename="reporting-completeness.csv"');
        return reply.send(csv);
      }

      const r = parseRange(q);
      const groupBy = (optStr(q.groupBy) ?? 'none') as 'none' | 'facility' | 'district' | 'region';
      if (!['none', 'facility', 'district', 'region'].includes(groupBy)) throw httpErrors.badRequest('groupBy must be none | facility | district | region');

      if (groupBy !== 'none') {
        const facilities = await db.facility.findMany({
          where: facilityListScope(u),
          select: { id: true, name: true, district: { select: { id: true, name: true } }, region: { select: { id: true, name: true } } },
        });
        const groups = await groupRows(db, u, r, facilities.slice(0, 60), groupBy);
        // Matrix: indicator rows × group columns.
        const perCode = INDICATORS.filter((d) => d.collected).map((def) => ({
          def,
          values: groups.map((g) => g.indicators[def.code] ?? null),
        }));
        const csv = toCsv(
          ['Indicator', 'DHIMS-II', 'Unit', ...groups.map((g) => g.name)],
          perCode.map(({ def, values }) => [def.name, def.dhims2Code, def.unit, ...values.map((v) => (v === null ? '' : String(v)))]),
        );
        recordAudit(db, request, { action: 'report.export', entityType: 'report', after: { report: 'indicators', from: r.gte.toISOString(), to: r.lt.toISOString(), groupBy } });
        reply.header('Content-Type', 'text/csv; charset=utf-8');
        reply.header('Content-Disposition', 'attachment; filename="report-indicators.csv"');
        return reply.send(csv);
      }

      const overall = await computeIndicators(db, u, r, callerScopeOf(db, u));
      const rows: string[][] = [];
      for (const def of INDICATORS) {
        if (!def.collected) continue;
        const v = overall[def.code];
        rows.push([def.name, def.group, def.dhims2Code, def.unit, v === null ? '' : String(v)]);
      }
      recordAudit(db, request, { action: 'report.export', entityType: 'report', after: { report: 'indicators', from: r.gte.toISOString(), to: r.lt.toISOString(), groupBy } });
      const csv = toCsv(['Indicator', 'Group', 'DHIMS-II', 'Unit', 'Value'], rows);
      reply.header('Content-Type', 'text/csv; charset=utf-8');
      reply.header('Content-Disposition', 'attachment; filename="report-indicators.csv"');
      return reply.send(csv);
    },
  );
}
