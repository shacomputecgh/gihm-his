import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import type { Guards } from '../../lib/guards.js';
import { str } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import { facilityListScope } from '../reports/compute.js';

export function registerGeographyRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  app.get(
    '/geography/regions',
    { schema: { summary: 'All 16 regions with district + facility counts', tags: ['geography'] } },
    async () => {
      const regions = await db.region.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { districts: true, facilities: true } } },
      });
      return { regions };
    },
  );

  app.get(
    '/geography/districts',
    { schema: { summary: 'Districts, optionally filtered by region', tags: ['geography'] } },
    async (request) => {
      const q = request.query as Record<string, unknown>;
      const regionId = str(q.regionId, 'regionId');
      const districts = await db.district.findMany({
        where: regionId ? { regionId } : undefined,
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
        select: { id: true, name: true, code: true, type: true, capital: true, regionId: true },
      });
      return { districts };
    },
  );

  // ------------------------------------------------------- national map
  // GIS layer (spec §50, docs/14 §6): every in-scope facility that carries GPS
  // coordinates, plus a light recent-activity count for marker sizing. The map
  // is aggregate-only and scope-filtered exactly like the reports — a facility
  // user sees their own facility; national sees all. No patient-identifiable
  // data leaves the scope.
  app.get(
    '/geography/map',
    { preHandler: guards.requirePermission('view_reports', 'view_dashboard'), schema: { summary: 'In-scope facilities with GPS + recent activity for the national map', tags: ['geography'] } },
    async (request) => {
      const u = request.user!;
      const where = facilityListScope(u);
      // Scale guard: a national scope can hold thousands of facilities — the
      // map payload (one point per row + per-marker rendering) is capped and
      // the client is told when it is truncated.
      const MAP_CAP = 1000;
      const total = await db.facility.count({ where: { ...where, gpsLat: { not: null }, gpsLng: { not: null } } });
      const facilities = await db.facility.findMany({
        where: { ...where, gpsLat: { not: null }, gpsLng: { not: null } },
        orderBy: { name: 'asc' },
        take: MAP_CAP,
        select: {
          id: true, code: true, name: true, type: true, level: true, ownership: true,
          operationalStatus: true, bedCapacity: true, gpsLat: true, gpsLng: true,
          region: { select: { id: true, name: true } },
          district: { select: { id: true, name: true } },
        },
      });
      // Recent activity (30 days) per facility for marker sizing — one query
      // per entity, batched across the whole scope (parallel, read-only).
      const ids = facilities.map((f) => f.id);
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const [encounterRows, admissionRows, labRows, caseRows] = await Promise.all([
        db.encounter.groupBy({ by: ['facilityId'], where: { facilityId: { in: ids }, createdAt: { gte: since } }, _count: { _all: true } }),
        db.admission.groupBy({ by: ['facilityId'], where: { facilityId: { in: ids }, admittedAt: { gte: since } }, _count: { _all: true } }),
        db.labOrder.groupBy({ by: ['facilityId'], where: { facilityId: { in: ids }, createdAt: { gte: since } }, _count: { _all: true } }),
        db.diseaseCase.groupBy({ by: ['facilityId'], where: { facilityId: { in: ids }, reportedAt: { gte: since } }, _count: { _all: true } }),
      ]);
      const activity = new Map<string, number>();
      for (const rows of [encounterRows, admissionRows, labRows, caseRows]) {
        for (const r of rows) {
          if (r.facilityId) activity.set(r.facilityId, (activity.get(r.facilityId) ?? 0) + r._count._all);
        }
      }
      // Prisma does not narrow the select type from the `not: null` filter.
      const geo = facilities.filter((f) => f.gpsLat !== null && f.gpsLng !== null);
      const points = geo.map((f) => ({
        id: f.id, code: f.code, name: f.name, type: f.type, level: f.level, ownership: f.ownership,
        operationalStatus: f.operationalStatus, bedCapacity: f.bedCapacity,
        lat: f.gpsLat as number, lng: f.gpsLng as number,
        regionId: f.region?.id ?? null, region: f.region?.name ?? null,
        districtId: f.district?.id ?? null, district: f.district?.name ?? null,
        activity30d: activity.get(f.id) ?? 0,
      }));
      const truncated = total > MAP_CAP;
      recordAudit(db, request, { action: 'geography.map', entityType: 'report', after: { points: points.length, scope: u.scope, truncated } });
      return { scope: u.scope, generatedAt: new Date().toISOString(), points, total, truncated };
    },
  );
}
