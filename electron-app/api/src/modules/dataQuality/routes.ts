import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import type { Guards } from '../../lib/guards.js';
import { recordAudit } from '../../lib/audit.js';
import { runDataQuality } from './checks.js';

export function registerDataQualityRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  app.get(
    '/data-quality/report',
    { preHandler: guards.requirePermission('view_reports', 'view_dashboard', 'view_patient'), schema: { summary: 'Data quality report — live checks over platform records (spec §81)', tags: ['data-quality'] } },
    async (request) => {
      const u = request.user!;
      const report = await runDataQuality(db, u);
      recordAudit(db, request, { action: 'dataQuality.report', entityType: 'dataQuality', after: { scope: report.scope, summary: report.summary } });
      return report;
    },
  );
}
