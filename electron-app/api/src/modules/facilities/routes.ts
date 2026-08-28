import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { str, optStr } from '../../lib/validate.js';
import { parsePage, pageEnvelope } from '../../lib/pagination.js';
import { parseJsonArr, stringifyJsonArr } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import { assertFacilityCapacity } from '../../lib/license.js';
import type { Guards } from '../../lib/guards.js';

export function registerFacilityRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  app.get(
    '/facilities',
    { schema: { summary: 'National facility directory search', tags: ['facilities'] } },
    async (request) => {
      const q = request.query as Record<string, unknown>;
      const page = parsePage(q);
      const where: Record<string, unknown> = { status: 'ACTIVE' };
      const search = str(q.q, 'q');
      if (search) where.name = { contains: search };
      if (str(q.regionId, 'regionId')) where.regionId = str(q.regionId, 'regionId');
      if (str(q.districtId, 'districtId')) where.districtId = str(q.districtId, 'districtId');
      if (str(q.type, 'type')) where.type = str(q.type, 'type');
      if (str(q.ownership, 'ownership')) where.ownership = str(q.ownership, 'ownership');
      // Sector filter for the hybrid platform: comma-separated ownership codes
      // (e.g. "GOVERNMENT,GHS,TEACHING_HOSPITAL" = the public sector).
      if (str(q.ownershipIn, 'ownershipIn')) where.ownership = { in: str(q.ownershipIn, 'ownershipIn').split(',').map((s) => s.trim()).filter(Boolean) };

      const [items, total] = await Promise.all([
        db.facility.findMany({
          where,
          orderBy: { name: 'asc' },
          skip: page.skip,
          take: page.take,
          include: { region: { select: { id: true, name: true } }, district: { select: { id: true, name: true } } },
        }),
        db.facility.count({ where }),
      ]);
      const clean = items.map((f) => ({
        ...f,
        services: parseJsonArr<string>(f.services),
        departmentsJson: parseJsonArr<string>(f.departmentsJson),
        openingHours: safeJsonParse(f.openingHours),
      }));
      return pageEnvelope(clean, total, page);
    },
  );

  app.get(
    '/facilities/:id',
    { schema: { summary: 'Facility public profile', tags: ['facilities'] } },
    async (request) => {
      const params = request.params as { id: string };
      const facility = await db.facility.findUnique({
        where: { id: params.id },
        include: {
          region: { select: { id: true, name: true, capital: true } },
          district: { select: { id: true, name: true, type: true, capital: true } },
          departments: { select: { id: true, name: true } },
        },
      });
      if (!facility) throw httpErrors.notFound('Facility not found');
      return {
        ...facility,
        services: parseJsonArr<string>(facility.services),
        departmentsJson: parseJsonArr<string>(facility.departmentsJson),
        openingHours: safeJsonParse(facility.openingHours),
      };
    },
  );

  registerFacilityApplicationRoutes(app, db, guards);
}

function safeJsonParse(raw: string): Record<string, string> {
  try {
    const v = JSON.parse(raw);
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Public facility self-registration (spec §6, §170) — applications wait for
// national/regional review before a Facility record is created.
// ---------------------------------------------------------------------------

const FACILITY_TYPES = ['CHPS_COMPOUND', 'HEALTH_CENTRE', 'CLINIC', 'MATERNITY_HOME', 'POLYCLINIC', 'DISTRICT_HOSPITAL', 'MUNICIPAL_HOSPITAL', 'REGIONAL_HOSPITAL', 'TEACHING_HOSPITAL', 'UNIVERSITY_HOSPITAL', 'PSYCHIATRIC_HOSPITAL', 'SPECIALIST_HOSPITAL', 'PRIVATE_HOSPITAL', 'MISSION_HOSPITAL', 'QUASI_GOVT_HOSPITAL', 'LABORATORY', 'PHARMACY', 'DIAGNOSTIC_CENTRE', 'REHABILITATION_FACILITY', 'OTHER'];
const OWNERSHIPS = ['GOVERNMENT', 'GHS', 'MOH', 'TEACHING_HOSPITAL', 'CHAG_MISSION', 'PRIVATE', 'QUASI_GOVT', 'NGO', 'OTHER'];

function registerFacilityApplicationRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  // Public: a facility proposes itself for the national registry.
  app.post(
    '/facilities/apply',
    { config: { rateLimit: { max: 20, timeWindow: '1 minute' } }, schema: { summary: 'Submit a facility application for national registry review (public)', tags: ['facilities'] } },
    async (request) => {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const name = str(body.name, 'name', { required: true, max: 190 });
      const type = str(body.type, 'type', { required: true, max: 60 }).toUpperCase();
      if (!FACILITY_TYPES.includes(type)) throw httpErrors.badRequest('Unsupported facility type');
      const ownership = str(body.ownership, 'ownership', { required: true, max: 40 }).toUpperCase();
      if (!OWNERSHIPS.includes(ownership)) throw httpErrors.badRequest('Unsupported ownership type');
      const regionId = str(body.regionId, 'regionId', { required: true });
      const districtId = str(body.districtId, 'districtId', { required: true });

      const district = await db.district.findUnique({ where: { id: districtId } });
      if (!district || district.regionId !== regionId) throw httpErrors.badRequest('District does not belong to the selected region');

      const services = Array.isArray(body.services)
        ? (body.services as unknown[]).map(String).slice(0, 20)
        : [];
      const application = await db.facilityApplication.create({
        data: {
          name,
          type,
          ownership,
          regionId,
          districtId,
          address: optStr(body.address),
          telephone: optStr(body.telephone),
          email: optStr(body.email),
          contactName: optStr(body.contactName),
          services: stringifyJsonArr(services),
          reason: optStr(body.reason),
          status: 'PENDING',
        },
      });
      return { application: { id: application.id, name: application.name, status: application.status }, message: 'Application submitted — awaiting national review.' };
    },
  );

  // Review list — national/regional administrators.
  app.get(
    '/admin/facility-applications',
    { preHandler: guards.requirePermission('review_facility_applications', 'manage_facility'), schema: { summary: 'List facility applications for review', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      if (u.scope === 'FACILITY') throw httpErrors.forbidden('Facility administrators cannot review national registry applications');
      const q = request.query as Record<string, unknown>;
      const status = optStr(q.status) ?? 'PENDING';
      const where: Record<string, unknown> = { status: { in: status === 'ALL' ? ['PENDING', 'APPROVED', 'REJECTED'] : ['PENDING'] } };
      if (u.scope === 'REGIONAL' && u.regionId) where.regionId = u.regionId;
      if (u.scope === 'DISTRICT' && u.districtId) where.districtId = u.districtId;
      const items = await db.facilityApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          region: { select: { id: true, name: true } },
          district: { select: { id: true, name: true } },
        },
      });
      return {
        items: items.map((a) => ({ ...a, services: parseJsonArr<string>(a.services) })),
        count: items.length,
      };
    },
  );

  // Approve → creates the real Facility record and marks the application APPROVED.
  app.post(
    '/admin/facility-applications/:id/approve',
    { preHandler: guards.requirePermission('review_facility_applications', 'manage_facility'), schema: { summary: 'Approve a facility application (creates the facility)', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      if (u.scope === 'FACILITY') throw httpErrors.forbidden('Facility administrators cannot review national registry applications');
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const appRow = await db.facilityApplication.findUnique({ where: { id: params.id } });
      if (!appRow) throw httpErrors.notFound('Application not found');
      if (appRow.status !== 'PENDING') throw httpErrors.conflict('Application already reviewed');
      if (u.scope === 'REGIONAL' && u.regionId && appRow.regionId !== u.regionId) throw httpErrors.forbidden('Application is outside your region');

      // Licensing (docs/25): an active license caps how many facilities exist.
      await assertFacilityCapacity(db);

      // Create the facility record (real, non-synthetic).
      const code = `APP-${Date.now().toString(36).toUpperCase().slice(-6)}`;
      const facility = await db.facility.create({
        data: {
          code,
          name: appRow.name,
          type: appRow.type,
          level: null,
          ownership: appRow.ownership,
          regionId: appRow.regionId,
          districtId: appRow.districtId,
          address: appRow.address,
          telephone: appRow.telephone,
          email: appRow.email,
          operationalStatus: 'OPERATIONAL',
          accreditation: 'PENDING_ACCREDITATION',
          services: appRow.services,
          departmentsJson: '[]',
          openingHours: '{}',
          isSynthetic: false,
          status: 'ACTIVE',
        },
      });
      await db.facilityApplication.update({
        where: { id: appRow.id },
        data: { status: 'APPROVED', reviewedById: u.id, reviewedAt: new Date(), reviewNote: optStr(body.note) },
      });
      recordAudit(db, request, { action: 'facilityApplication.approve', entityType: 'facility', entityId: facility.id, after: { applicationId: appRow.id, code } });
      return { facility: { id: facility.id, code: facility.code, name: facility.name }, status: 'APPROVED' };
    },
  );

  // Reject → marks the application REJECTED with a review note.
  app.post(
    '/admin/facility-applications/:id/reject',
    { preHandler: guards.requirePermission('review_facility_applications', 'manage_facility'), schema: { summary: 'Reject a facility application', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      if (u.scope === 'FACILITY') throw httpErrors.forbidden('Facility administrators cannot review national registry applications');
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const appRow = await db.facilityApplication.findUnique({ where: { id: params.id } });
      if (!appRow) throw httpErrors.notFound('Application not found');
      if (appRow.status !== 'PENDING') throw httpErrors.conflict('Application already reviewed');
      if (u.scope === 'REGIONAL' && u.regionId && appRow.regionId !== u.regionId) throw httpErrors.forbidden('Application is outside your region');
      const updated = await db.facilityApplication.update({
        where: { id: appRow.id },
        data: { status: 'REJECTED', reviewedById: u.id, reviewedAt: new Date(), reviewNote: optStr(body.note) },
      });
      recordAudit(db, request, { action: 'facilityApplication.reject', entityType: 'facilityApplication', entityId: appRow.id });
      return { application: { id: updated.id, status: updated.status }, status: 'REJECTED' };
    },
  );
}
