import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import type { Guards } from '../../lib/guards.js';
import { httpErrors } from '../../lib/http.js';
import { optStr, num } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import type { IntegrationConfig } from './engine.js';
import { enqueue, deliverPending, integrationStatus } from './engine.js';
import { buildDataset, datasetToCsv, buildFacilityDatasets, dhims2Transport } from './dhims2.js';
import { buildCaseExport, casesToCsv, sormasTransport } from './sormas.js';
import { buildStockSnapshot, snapshotToCsv, ghilmisTransport } from './ghilmis.js';
import { buildWorkforceSnapshot, workforceToCsv, hrimsTransport } from './hrims.js';
import { buildClaimsSubmission, claimsToCsv, nhisTransport } from './nhis.js';
import { buildClientCohort, clientsToCsv, etrackerTransport } from './etracker.js';
import { buildFhirBundle, fhirToCsv, lhimsTransport } from './lhim.js';

/**
 * National integration adapters (docs/08 §3): independent idempotent queues
 * for DHIMS2 (monthly indicator datasets), SORMAS (disease case events),
 * GhiLMIS (logistics stock-level snapshots) and HRIMS (workforce register),
 * delivered to the configured upstreams by the integration sweep. A national
 * system being offline never blocks local clinical operations — submissions
 * stay queued with backoff and the status endpoint reports truthfully.
 */
export function registerIntegrationRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards, config: IntegrationConfig): void {
  const transports = { dhims2: dhims2Transport, sormas: sormasTransport, ghilmis: ghilmisTransport, hrims: hrimsTransport, nhis: nhisTransport, etracker: etrackerTransport, lhims: lhimsTransport };

  // ------------------------------------------------------------- status
  app.get(
    '/integrations/status',
    { preHandler: guards.requirePermission('view_reports', 'view_dashboard', 'manage_integrations'), schema: { summary: 'National adapter status (queues, delivery, configuration)', tags: ['integrations'] } },
    async () => ({
      adapters: await integrationStatus(db, config),
      sweepIntervalMs: config.sweepIntervalMs,
      maxAttempts: config.maxAttempts,
      now: new Date().toISOString(),
    }),
  );

  // ------------------------------------------------------- delivery log
  app.get(
    '/integrations/deliveries',
    { preHandler: guards.requirePermission('manage_integrations'), schema: { summary: 'Integration delivery log (reconciliation record)', tags: ['integrations'] } },
    async (request) => {
      const q = request.query as Record<string, unknown>;
      const adapter = optStr(q.adapter);
      const status = optStr(q.status);
      const page = Math.max(1, num(q.page, 'page') ?? 1);
      const pageSize = Math.min(100, Math.max(1, num(q.pageSize, 'pageSize') ?? 20));
      const where: Record<string, unknown> = {};
      if (adapter) where.adapter = adapter;
      if (status) where.status = status;
      const [rows, total] = await Promise.all([
        db.integrationDelivery.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
        db.integrationDelivery.count({ where }),
      ]);
      // Payloads stay out of the list (they can be large) — the detail endpoint
      // returns the exact JSON as sent.
      const slim = rows.map(({ payload: _payload, ...rest }) => rest);
      return { page, pageSize, total, rows: slim, note: 'payload omitted from list — use GET /integrations/deliveries/:id' };
    },
  );

  // ---------------------------------------------------- delivery detail
  app.get(
    '/integrations/deliveries/:id',
    { preHandler: guards.requirePermission('manage_integrations'), schema: { summary: 'One delivery record including the payload as sent', tags: ['integrations'] } },
    async (request) => {
      const { id } = request.params as { id: string };
      const row = await db.integrationDelivery.findUnique({ where: { id } });
      if (!row) throw httpErrors.notFound('Delivery not found');
      return { ...row, payloadJson: row.payload };
    },
  );

  // ------------------------------------------------ DHIMS2: queue/export
  app.post(
    '/integrations/dhims2/queue',
    { preHandler: guards.requirePermission('manage_integrations'), schema: { summary: 'Build and queue a DHIMS2 monthly dataset submission', tags: ['integrations'] } },
    async (request) => {
      const u = request.user!;
      const body = (request.body ?? {}) as Record<string, unknown>;
      const period = optStr(body.period);
      if (!period) throw httpErrors.badRequest('period (YYYY-MM) is required');
      const orgUnit = optStr(body.orgUnit);
      const dryRun = Boolean(body.dryRun);
      const submission = await buildDataset(db, u, period, orgUnit);
      recordAudit(db, request, { action: 'integration.dhims2.build', entityType: 'integration', after: { period: submission.period, orgUnit: submission.orgUnit, dryRun, dataValues: submission.dataValues.length } });
      if (dryRun) return { dryRun: true, configured: Boolean(config.dhims2.url), submission };
      const delivery = await enqueue(db, 'dhims2', `dhims2:${submission.period}:${submission.orgUnit}`, submission);
      return { dryRun: false, configured: Boolean(config.dhims2.url), submission, delivery };
    },
  );

  // Multi-facility (national/regional) queue: one submission per facility in scope.
  app.post(
    '/integrations/dhims2/queue-all',
    { preHandler: guards.requirePermission('manage_integrations'), schema: { summary: 'Queue one DHIMS2 submission per facility in scope', tags: ['integrations'] } },
    async (request) => {
      const u = request.user!;
      const body = (request.body ?? {}) as Record<string, unknown>;
      const period = optStr(body.period);
      if (!period) throw httpErrors.badRequest('period (YYYY-MM) is required');
      const facilities = await db.facility.findMany({
        where: u.scope === 'FACILITY' ? (u.facilityId ? { id: u.facilityId } : { id: '__deny__' }) : u.scope === 'REGIONAL' ? { regionId: u.regionId ?? '__deny__' } : u.scope === 'DISTRICT' ? { districtId: u.districtId ?? '__deny__' } : {},
        select: { id: true, code: true },
        take: 200,
      });
      const subs = await buildFacilityDatasets(db, u, period, facilities);
      const queued: Array<{ orgUnit: string; id: string; duplicated: boolean }> = [];
      for (const s of subs) {
        const d = await enqueue(db, 'dhims2', `dhims2:${s.period}:${s.orgUnit}`, s);
        queued.push({ orgUnit: s.orgUnit, id: d.id, duplicated: d.duplicated });
      }
      recordAudit(db, request, { action: 'integration.dhims2.queue-all', entityType: 'integration', after: { period, facilities: facilities.length, queued: queued.length } });
      return { period, facilities: facilities.length, queued };
    },
  );

  // ------------------------------------------------ GhiLMIS: queue/export
  app.post(
    '/integrations/ghilmis/queue',
    { preHandler: guards.requirePermission('manage_integrations'), schema: { summary: 'Build and queue a GhiLMIS stock-level snapshot', tags: ['integrations'] } },
    async (request) => {
      const u = request.user!;
      const body = (request.body ?? {}) as Record<string, unknown>;
      const period = optStr(body.period);
      if (!period) throw httpErrors.badRequest('period (YYYY-MM) is required');
      const orgUnit = optStr(body.orgUnit);
      const dryRun = Boolean(body.dryRun);
      const submission = await buildStockSnapshot(db, u, period, orgUnit);
      recordAudit(db, request, { action: 'integration.ghilmis.build', entityType: 'integration', after: { period: submission.period, orgUnit: submission.orgUnit, dryRun, items: submission.items.length } });
      if (dryRun) return { dryRun: true, configured: Boolean(config.ghilmis.url), submission };
      const delivery = await enqueue(db, 'ghilmis', `ghilmis:${submission.period}:${submission.orgUnit}`, submission);
      return { dryRun: false, configured: Boolean(config.ghilmis.url), submission, delivery };
    },
  );

  // ------------------------------------------------ HRIMS: queue/export
  app.post(
    '/integrations/hrims/queue',
    { preHandler: guards.requirePermission('manage_integrations'), schema: { summary: 'Build and queue a HRIMS workforce register snapshot', tags: ['integrations'] } },
    async (request) => {
      const u = request.user!;
      const body = (request.body ?? {}) as Record<string, unknown>;
      const period = optStr(body.period);
      if (!period) throw httpErrors.badRequest('period (YYYY-MM) is required');
      const orgUnit = optStr(body.orgUnit);
      const dryRun = Boolean(body.dryRun);
      const submission = await buildWorkforceSnapshot(db, u, period, orgUnit);
      recordAudit(db, request, { action: 'integration.hrims.build', entityType: 'integration', after: { period: submission.period, orgUnit: submission.orgUnit, dryRun, staff: submission.staff.length } });
      if (dryRun) return { dryRun: true, configured: Boolean(config.hrims.url), submission };
      const delivery = await enqueue(db, 'hrims', `hrims:${submission.period}:${submission.orgUnit}`, submission);
      return { dryRun: false, configured: Boolean(config.hrims.url), submission, delivery };
    },
  );

  // ------------------------------------------------ SORMAS: queue/export
  app.post(
    '/integrations/sormas/queue',
    { preHandler: guards.requirePermission('manage_integrations'), schema: { summary: 'Build and queue the SORMAS disease case export for a range', tags: ['integrations'] } },
    async (request) => {
      const u = request.user!;
      const body = (request.body ?? {}) as Record<string, unknown>;
      const from = optStr(body.from) ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const to = optStr(body.to) ?? new Date().toISOString().slice(0, 10);
      const dryRun = Boolean(body.dryRun);
      const cases = await buildCaseExport(db, u, from, to);
      recordAudit(db, request, { action: 'integration.sormas.build', entityType: 'integration', after: { from, to, dryRun, cases: cases.length } });
      if (dryRun) return { dryRun: true, configured: Boolean(config.sormas.url), count: cases.length, cases };
      const delivery = await enqueue(db, 'sormas', `sormas:${from}:${to}:${u.scope}:${u.facilityId ?? u.regionId ?? u.districtId ?? 'all'}`, { from, to, cases });
      return { dryRun: false, configured: Boolean(config.sormas.url), count: cases.length, delivery };
    },
  );

  // ------------------------------------------------ NHIS: queue/export
  app.post(
    '/integrations/nhis/queue',
    { preHandler: guards.requirePermission('manage_integrations'), schema: { summary: 'Build and queue an NHIS claims submission', tags: ['integrations'] } },
    async (request) => {
      const u = request.user!;
      const body = (request.body ?? {}) as Record<string, unknown>;
      const period = optStr(body.period);
      if (!period) throw httpErrors.badRequest('period (YYYY-MM) is required');
      const orgUnit = optStr(body.orgUnit);
      const dryRun = Boolean(body.dryRun);
      const submission = await buildClaimsSubmission(db, u, period, orgUnit);
      recordAudit(db, request, { action: 'integration.nhis.build', entityType: 'integration', after: { period: submission.period, orgUnit: submission.orgUnit, dryRun, claims: submission.claims.length } });
      if (dryRun) return { dryRun: true, configured: Boolean(config.nhis.url), submission };
      const delivery = await enqueue(db, 'nhis', `nhis:${submission.period}:${submission.orgUnit}`, submission);
      return { dryRun: false, configured: Boolean(config.nhis.url), submission, delivery };
    },
  );

  app.get(
    '/integrations/nhis/export',
    { preHandler: guards.requirePermission('manage_integrations', 'export_data', 'view_reports'), schema: { summary: 'Download an NHIS claims submission (json|csv) without queuing', tags: ['integrations'] } },
    async (request, reply) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const period = optStr(q.period);
      if (!period) throw httpErrors.badRequest('period (YYYY-MM) is required');
      const format = (optStr(q.format) ?? 'json').toLowerCase();
      const submission = await buildClaimsSubmission(db, u, period, optStr(q.orgUnit));
      if (format === 'csv') {
        return reply.header('content-type', 'text/csv; charset=utf-8').header('content-disposition', `attachment; filename="nhis-claims-${submission.orgUnit}-${submission.period}.csv"`).send(claimsToCsv(submission));
      }
      return { ...submission };
    },
  );

  // -------------------------------------------- eTracker: queue/export
  app.post(
    '/integrations/etracker/queue',
    { preHandler: guards.requirePermission('manage_integrations'), schema: { summary: 'Build and queue a DHIMS Tracker client cohort submission', tags: ['integrations'] } },
    async (request) => {
      const u = request.user!;
      const body = (request.body ?? {}) as Record<string, unknown>;
      const period = optStr(body.period);
      if (!period) throw httpErrors.badRequest('period (YYYY-MM) is required');
      const orgUnit = optStr(body.orgUnit);
      const dryRun = Boolean(body.dryRun);
      const submission = await buildClientCohort(db, u, period, orgUnit);
      recordAudit(db, request, { action: 'integration.etracker.build', entityType: 'integration', after: { period: submission.period, orgUnit: submission.orgUnit, dryRun, clients: submission.clients.length } });
      if (dryRun) return { dryRun: true, configured: Boolean(config.etracker.url), submission };
      const delivery = await enqueue(db, 'etracker', `etracker:${submission.period}:${submission.orgUnit}`, submission);
      return { dryRun: false, configured: Boolean(config.etracker.url), submission, delivery };
    },
  );

  app.get(
    '/integrations/etracker/export',
    { preHandler: guards.requirePermission('manage_integrations', 'export_data', 'view_reports'), schema: { summary: 'Download a DHIMS Tracker client cohort submission (json|csv) without queuing', tags: ['integrations'] } },
    async (request, reply) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const period = optStr(q.period);
      if (!period) throw httpErrors.badRequest('period (YYYY-MM) is required');
      const format = (optStr(q.format) ?? 'json').toLowerCase();
      const submission = await buildClientCohort(db, u, period, optStr(q.orgUnit));
      if (format === 'csv') {
        return reply.header('content-type', 'text/csv; charset=utf-8').header('content-disposition', `attachment; filename="etracker-clients-${submission.orgUnit}-${submission.period}.csv"`).send(clientsToCsv(submission));
      }
      return { ...submission };
    },
  );

  // ------------------------------------------------ LHIMS: queue/export
  app.post(
    '/integrations/lhims/queue',
    { preHandler: guards.requirePermission('manage_integrations'), schema: { summary: 'Build and queue a LHIMS FHIR exchange bundle', tags: ['integrations'] } },
    async (request) => {
      const u = request.user!;
      const body = (request.body ?? {}) as Record<string, unknown>;
      const period = optStr(body.period);
      if (!period) throw httpErrors.badRequest('period (YYYY-MM) is required');
      const orgUnit = optStr(body.orgUnit);
      const dryRun = Boolean(body.dryRun);
      const submission = await buildFhirBundle(db, u, period, orgUnit);
      recordAudit(db, request, { action: 'integration.lhims.build', entityType: 'integration', after: { period: submission.period, orgUnit: submission.orgUnit, dryRun, resources: submission.bundle.entry.length } });
      if (dryRun) return { dryRun: true, configured: Boolean(config.lhims.url), submission };
      const delivery = await enqueue(db, 'lhims', `lhims:${submission.period}:${submission.orgUnit}`, submission);
      return { dryRun: false, configured: Boolean(config.lhims.url), submission, delivery };
    },
  );

  app.get(
    '/integrations/lhims/export',
    { preHandler: guards.requirePermission('manage_integrations', 'export_data', 'view_reports'), schema: { summary: 'Download a LHIMS FHIR exchange bundle (json) or flattened CSV without queuing', tags: ['integrations'] } },
    async (request, reply) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const period = optStr(q.period);
      if (!period) throw httpErrors.badRequest('period (YYYY-MM) is required');
      const format = (optStr(q.format) ?? 'json').toLowerCase();
      const submission = await buildFhirBundle(db, u, period, optStr(q.orgUnit));
      if (format === 'csv') {
        return reply.header('content-type', 'text/csv; charset=utf-8').header('content-disposition', `attachment; filename="lhims-exchange-${submission.orgUnit}-${submission.period}.csv"`).send(fhirToCsv(submission));
      }
      return { ...submission };
    },
  );

  // ------------------------------------------------ manual sweep
  app.post(
    '/integrations/sweep',
    { preHandler: guards.requirePermission('manage_integrations'), schema: { summary: 'Run the delivery sweep now (retry due submissions)', tags: ['integrations'] } },
    async (request) => {
      const result = await deliverPending(db, config, transports);
      recordAudit(db, request, { action: 'integration.sweep', entityType: 'integration', after: result });
      return { ...result, now: new Date().toISOString() };
    },
  );

  // ------------------------------------------------ exports (no queue)
  // NOTE: the SORMAS export carries patient-identifiable data (name, sex,
  // birthdate) — it deliberately requires export_data/manage_integrations, NOT
  // plain view_reports, matching the platform's aggregate-only reporting rule.

  app.get(
    '/integrations/dhims2/export',
    { preHandler: guards.requirePermission('manage_integrations', 'export_data', 'view_reports'), schema: { summary: 'Download a DHIMS2 dataset submission (json|csv) without queuing', tags: ['integrations'] } },
    async (request, reply) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const period = optStr(q.period);
      if (!period) throw httpErrors.badRequest('period (YYYY-MM) is required');
      const format = (optStr(q.format) ?? 'json').toLowerCase();
      const submission = await buildDataset(db, u, period, optStr(q.orgUnit));
      if (format === 'csv') {
        reply.header('Content-Type', 'text/csv; charset=utf-8');
        reply.header('Content-Disposition', `attachment; filename="dhims2-${submission.period}-${submission.orgUnit}.csv"`);
        return reply.send(datasetToCsv(submission));
      }
      return submission;
    },
  );

  app.get(
    '/integrations/hrims/export',
    { preHandler: guards.requirePermission('manage_integrations', 'export_data', 'view_reports'), schema: { summary: 'Download a HRIMS workforce register snapshot (json|csv) without queuing', tags: ['integrations'] } },
    async (request, reply) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const period = optStr(q.period);
      if (!period) throw httpErrors.badRequest('period (YYYY-MM) is required');
      const format = (optStr(q.format) ?? 'json').toLowerCase();
      const submission = await buildWorkforceSnapshot(db, u, period, optStr(q.orgUnit));
      if (format === 'csv') {
        reply.header('Content-Type', 'text/csv; charset=utf-8');
        reply.header('Content-Disposition', `attachment; filename="hrims-${submission.period}-${submission.orgUnit}.csv"`);
        return reply.send(workforceToCsv(submission));
      }
      return submission;
    },
  );

  app.get(
    '/integrations/ghilmis/export',
    { preHandler: guards.requirePermission('manage_integrations', 'export_data', 'view_reports'), schema: { summary: 'Download a GhiLMIS stock-level snapshot (json|csv) without queuing', tags: ['integrations'] } },
    async (request, reply) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const period = optStr(q.period);
      if (!period) throw httpErrors.badRequest('period (YYYY-MM) is required');
      const format = (optStr(q.format) ?? 'json').toLowerCase();
      const submission = await buildStockSnapshot(db, u, period, optStr(q.orgUnit));
      if (format === 'csv') {
        reply.header('Content-Type', 'text/csv; charset=utf-8');
        reply.header('Content-Disposition', `attachment; filename="ghilmis-${submission.period}-${submission.orgUnit}.csv"`);
        return reply.send(snapshotToCsv(submission));
      }
      return submission;
    },
  );

  app.get(
    '/integrations/sormas/export',
    { preHandler: guards.requirePermission('manage_integrations', 'export_data'), schema: { summary: 'Download the SORMAS case export (json|csv) without queuing', tags: ['integrations'] } },
    async (request, reply) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const from = optStr(q.from) ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const to = optStr(q.to) ?? new Date().toISOString().slice(0, 10);
      const format = (optStr(q.format) ?? 'json').toLowerCase();
      const cases = await buildCaseExport(db, u, from, to);
      if (format === 'csv') {
        reply.header('Content-Type', 'text/csv; charset=utf-8');
        reply.header('Content-Disposition', `attachment; filename="sormas-cases-${from}-${to}.csv"`);
        return reply.send(casesToCsv(cases));
      }
      return { from, to, count: cases.length, cases };
    },
  );
}
