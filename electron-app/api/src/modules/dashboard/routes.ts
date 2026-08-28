import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import type { Guards } from '../../lib/guards.js';
import { dashboardScope, facilityScopeId, patientScope } from '../../lib/scope.js';

export function registerDashboardRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  app.get(
    '/dashboard/stats',
    { preHandler: guards.requirePermission('view_dashboard'), schema: { summary: 'Operational dashboard aggregates', tags: ['dashboard'] } },
    async (request) => {
      const u = request.user!;
      const facilityId = facilityScopeId(u);
      const now = new Date();
      const dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      // Scoped by the caller's role: regional users see regional aggregates,
      // district users district aggregates, facility users their facility only.
      // Missing anchors yield a deny filter (never national totals).
      const fWhere = dashboardScope(u);
      const patientWhere = patientScope(u);

      const [patientsToday, appointmentsToday, queueWaiting, activeAdmissions, encountersToday, labPending, prescriptionsActive, invoicesToday, revenueToday, criticalLabs, districts, facilities, patientCount] =
        await Promise.all([
          db.patient.count({ where: { ...patientWhere, createdAt: { gte: dayStart, lt: dayEnd } } }),
          db.appointment.count({ where: { ...fWhere, scheduledFor: { gte: dayStart, lt: dayEnd } } }),
          db.queueEntry.count({ where: { ...fWhere, status: 'WAITING' } }),
          db.admission.count({ where: { ...fWhere, status: 'ADMITTED' } }),
          db.encounter.count({ where: { ...fWhere, createdAt: { gte: dayStart, lt: dayEnd } } }),
          db.labOrder.count({ where: { ...fWhere, status: { in: ['ORDERED', 'COLLECTED'] } } }),
          db.prescription.count({ where: { ...fWhere, status: 'ACTIVE' } }),
          db.invoice.count({ where: { ...fWhere, issuedAt: { gte: dayStart, lt: dayEnd } } }),
          db.invoice.aggregate({ where: { ...fWhere, paidAmount: { gt: 0 } }, _sum: { paidAmount: true } }),
          db.labOrder.count({ where: { ...fWhere, critical: true, status: 'VERIFIED' } }),
          db.district.count(),
          db.facility.count(),
          db.patient.count({ where: patientWhere }),
        ]);

      // last-7-day encounter trend (per day)
      const trend: { date: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const s = new Date(dayStart.getTime() - i * 24 * 60 * 60 * 1000);
        const e = new Date(s.getTime() + 24 * 60 * 60 * 1000);
        const count = await db.encounter.count({ where: { ...fWhere, createdAt: { gte: s, lt: e } } });
        trend.push({ date: s.toISOString().slice(0, 10), count });
      }

      return {
        scope: u.scope,
        facilityId,
        stats: {
          patientsToday,
          appointmentsToday,
          queueWaiting,
          activeAdmissions,
          encountersToday,
          labPending,
          prescriptionsActive,
          invoicesToday,
          revenueToday: revenueToday._sum.paidAmount ?? 0,
          criticalLabs,
          patientCount,
        },
        national: { districts, facilities },
        trend,
        generatedAt: now.toISOString(),
      };
    },
  );
}
