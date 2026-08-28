import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import type { Guards } from '../../lib/guards.js';

interface NodeMetrics {
  facilities: number;
  patients: number;
  encounters: number;
  admissions: number;
  labPending: number;
  prescriptionsActive: number;
  immunizations: number;
  diseaseCases: number;
  referrals: number;
  revenue: number;
}

const NONE = '__none__';

/**
 * Aggregate metrics for a set of facilities. Clinical/logistics entities carry
 * facilityId (Referral uses fromFacilityId), so we scope by facility id lists
 * rather than region/district columns that don't exist on those models.
 */
async function nodeMetrics(db: PrismaClient, facilityIds: string[], patientWhere: Record<string, unknown>): Promise<NodeMetrics> {
  const fIds = facilityIds.length ? { in: facilityIds } : { in: [NONE] };
  const where: Record<string, unknown> = { facilityId: fIds };
  const [facilities, patients, encounters, admissions, labPending, prescriptionsActive, immunizations, diseaseCases, referrals, rev] = await Promise.all([
    db.facility.count({ where: { id: fIds, status: 'ACTIVE' } }),
    db.patient.count({ where: patientWhere }),
    db.encounter.count({ where }),
    db.admission.count({ where: { ...where, status: 'ADMITTED' } }),
    db.labOrder.count({ where: { ...where, status: { in: ['ORDERED', 'COLLECTED'] } } }),
    db.prescription.count({ where: { ...where, status: 'ACTIVE' } }),
    db.immunization.count({ where }),
    db.diseaseCase.count({ where }),
    db.referral.count({ where: { fromFacilityId: fIds } }),
    db.invoice.aggregate({ where: { ...where, paidAmount: { gt: 0 } }, _sum: { paidAmount: true } }),
  ]);
  return {
    facilities, patients, encounters, admissions, labPending, prescriptionsActive, immunizations, diseaseCases, referrals,
    revenue: rev._sum.paidAmount ?? 0,
  };
}

const M30 = () => new Date(Date.now() - 30 * 24 * 3600 * 1000);

interface DirectorateNode { id: string; name: string; code?: string; type: string; metrics: NodeMetrics; recentEncounters: number }

async function facilityNodes(db: PrismaClient, facilityIds: string[]): Promise<DirectorateNode[]> {
  const facilities = await db.facility.findMany({ where: { id: { in: facilityIds } }, orderBy: { name: 'asc' }, select: { id: true, name: true, code: true, type: true } });
  return Promise.all(
    facilities.map(async (f) => {
      const where = { facilityId: f.id };
      const [metrics, recentEncounters] = await Promise.all([
        nodeMetrics(db, [f.id], where),
        db.encounter.count({ where: { ...where, createdAt: { gte: M30() } } }),
      ]);
      return { id: f.id, name: f.name, code: f.code, type: f.type, metrics, recentEncounters };
    }),
  );
}

/**
 * Health directorate dashboards (spec §57-§59). National users see all 16
 * regions; regional users their districts; district users their facilities.
 * Drill-down follows region → district → facility. Aggregates only — never
 * patient-identifiable data at the national/regional layer (spec §59).
 */
export function registerDirectorateRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  app.get(
    '/directorate',
    { preHandler: guards.requirePermission('view_reports', 'view_dashboard'), schema: { summary: 'Directorate overview with drill-down (scoped)', tags: ['directorate'] } },
    async (request) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const regionId = (q.regionId as string | undefined) ?? u.regionId ?? undefined;
      // District anchor only drives the default view for DISTRICT-scope users;
      // regional directors default to their region's districts and drill via query.
      const districtId = (q.districtId as string | undefined) ?? (u.scope === 'DISTRICT' ? (u.districtId ?? undefined) : undefined);

      let level: 'NATIONAL' | 'REGIONAL' | 'DISTRICT' | 'FACILITY';
      let nodes: DirectorateNode[] = [];

      // ---------------------------------------------------- facility scope
      if (u.scope === 'FACILITY') {
        level = 'FACILITY';
        const f = await db.facility.findUnique({ where: { id: u.facilityId ?? NONE }, select: { id: true, name: true, code: true, type: true } });
        nodes = f ? await facilityNodes(db, [f.id]) : [];
      }
      // ------------------------------------------------ district scope
      else if (u.scope === 'DISTRICT') {
        level = 'FACILITY';
        const dId = districtId ?? u.districtId ?? NONE;
        const facIds = (await db.facility.findMany({ where: { districtId: dId }, select: { id: true } })).map((f) => f.id);
        nodes = await facilityNodes(db, facIds);
      }
      // -------------------------------------------------- regional scope
      else if (u.scope === 'REGIONAL') {
        const dId = districtId;
        if (dId) {
          // Verify the drilled district actually belongs to the user's region.
          const district = await db.district.findUnique({ where: { id: dId } });
          if (!district || district.regionId !== u.regionId) throw httpErrors.forbidden('District is outside your region');
          level = 'FACILITY';
          const facIds = (await db.facility.findMany({ where: { districtId: dId }, select: { id: true } })).map((f) => f.id);
          nodes = await facilityNodes(db, facIds);
        } else {
          level = 'DISTRICT';
          const districts = await db.district.findMany({ where: { regionId: u.regionId ?? NONE }, orderBy: { name: 'asc' }, select: { id: true, name: true, code: true } });
          nodes = await Promise.all(
            districts.map(async (d) => {
              const facIds = (await db.facility.findMany({ where: { districtId: d.id }, select: { id: true } })).map((f) => f.id);
              const [metrics, recentEncounters] = await Promise.all([nodeMetrics(db, facIds, { districtId: d.id }), db.encounter.count({ where: { facilityId: { in: facIds.length ? facIds : [NONE] }, createdAt: { gte: M30() } } })]);
              return { id: d.id, name: d.name, code: d.code, type: 'DISTRICT', metrics, recentEncounters };
            }),
          );
        }
      }
      // -------------------------------------------------- national scope
      else {
        if (districtId) {
          // National drilling into a district → facilities (region → district → facility).
          level = 'FACILITY';
          const facIds = (await db.facility.findMany({ where: { districtId }, select: { id: true } })).map((f) => f.id);
          nodes = await facilityNodes(db, facIds);
        } else if (regionId) {
          level = 'REGIONAL';
          const districts = await db.district.findMany({ where: { regionId }, orderBy: { name: 'asc' }, select: { id: true, name: true, code: true } });
          nodes = await Promise.all(
            districts.map(async (d) => {
              const facIds = (await db.facility.findMany({ where: { districtId: d.id }, select: { id: true } })).map((f) => f.id);
              const [metrics, recentEncounters] = await Promise.all([nodeMetrics(db, facIds, { districtId: d.id }), db.encounter.count({ where: { facilityId: { in: facIds.length ? facIds : [NONE] }, createdAt: { gte: M30() } } })]);
              return { id: d.id, name: d.name, code: d.code, type: 'DISTRICT', metrics, recentEncounters };
            }),
          );
        } else {
          level = 'NATIONAL';
          const regions = await db.region.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, code: true } });
          nodes = await Promise.all(
            regions.map(async (r) => {
              const facIds = (await db.facility.findMany({ where: { regionId: r.id }, select: { id: true } })).map((f) => f.id);
              const [metrics, recentEncounters] = await Promise.all([nodeMetrics(db, facIds, { regionId: r.id }), db.encounter.count({ where: { facilityId: { in: facIds.length ? facIds : [NONE] }, createdAt: { gte: M30() } } })]);
              return { id: r.id, name: r.name, code: r.code, type: 'REGION', metrics, recentEncounters };
            }),
          );
        }
      }

      // Scope context for the caller's own default view (breadcrumb/heading):
      // REGIONAL/DISTRICT users see their region/district names, facility
      // users their facility name. National has none. Null when not drilled.
      let regionName: string | null = null;
      let districtName: string | null = null;
      let facilityName: string | null = null;
      if (u.scope === 'REGIONAL' && u.regionId) {
        regionName = (await db.region.findUnique({ where: { id: u.regionId }, select: { name: true } }))?.name ?? null;
      } else if (u.scope === 'DISTRICT' && u.districtId) {
        const d = await db.district.findUnique({ where: { id: u.districtId }, select: { name: true, regionId: true } });
        districtName = d?.name ?? null;
        if (d?.regionId) regionName = (await db.region.findUnique({ where: { id: d.regionId }, select: { name: true } }))?.name ?? null;
      } else if (u.scope === 'FACILITY' && u.facilityId) {
        facilityName = (await db.facility.findUnique({ where: { id: u.facilityId }, select: { name: true } }))?.name ?? null;
      }

      return { level, nodes, generatedAt: new Date().toISOString(), regionName, districtName, facilityName };
    },
  );
}
