import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { str, optStr, num } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import type { Guards } from '../../lib/guards.js';
import { facilityScope } from '../../lib/scope.js';
import { assertPatientAccess } from '../patients/service.js';

const AMBULANCE_STATUSES = ['AVAILABLE', 'ASSIGNED', 'EN_ROUTE', 'AT_SCENE', 'TRANSPORTING', 'AT_FACILITY', 'RETURNING', 'MAINTENANCE', 'OFFLINE'];
const TRIP_FLOW: Record<string, string[]> = {
  ASSIGNED: ['EN_ROUTE', 'CANCELLED'],
  EN_ROUTE: ['AT_SCENE', 'CANCELLED'],
  AT_SCENE: ['TRANSPORTING', 'COMPLETED', 'CANCELLED'],
  TRANSPORTING: ['AT_FACILITY', 'COMPLETED', 'CANCELLED'],
  AT_FACILITY: ['COMPLETED', 'RETURNING'],
  RETURNING: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

/** Ambulance fleet + dispatch (spec §33) — scoped per facility/region/district. */
export function registerAmbulanceRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  // ------------------------------------------------------------ fleet list
  app.get(
    '/ambulances',
    { preHandler: guards.requirePermission('view_patient', 'write_clinical_note', 'view_dashboard'), schema: { summary: 'Ambulance fleet (scoped)', tags: ['ambulance'] } },
    async (request) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const where: Record<string, unknown> = { ...facilityScope(u) };
      if (str(q.status, 'status')) where.status = str(q.status, 'status').toUpperCase();
      const items = await db.ambulance.findMany({
        where,
        orderBy: { registration: 'asc' },
        take: 100,
        include: {
          facility: { select: { id: true, name: true } },
          trips: { orderBy: { dispatchedAt: 'desc' }, take: 1, select: { id: true, status: true, patient: { select: { fullName: true, mrn: true } } } },
        },
      });
      const summary = AMBULANCE_STATUSES.map((s) => ({
        status: s,
        count: items.filter((a) => a.status === s).length,
      })).filter((s) => s.count > 0);
      return { items, summary };
    },
  );

  // -------------------------------------------------------------- register
  app.post(
    '/ambulances',
    { preHandler: guards.requirePermission('manage_ambulance'), schema: { summary: 'Register an ambulance', tags: ['ambulance'] } },
    async (request) => {
      const u = request.user!;
      if (!u.facilityId) throw httpErrors.forbidden('Ambulance registration requires a facility');
      const body = (request.body ?? {}) as Record<string, unknown>;
      const registration = str(body.registration, 'registration', { required: true, max: 40 });
      const existing = await db.ambulance.findFirst({ where: { facilityId: u.facilityId, registration } });
      if (existing) throw httpErrors.conflict('An ambulance with this registration already exists');
      const ambulance = await db.ambulance.create({
        data: {
          facilityId: u.facilityId,
          registration,
          model: optStr(body.model),
          type: (optStr(body.type) ?? 'AMBULANCE').toUpperCase(),
          status: (optStr(body.status) ?? 'AVAILABLE').toUpperCase(),
          driverName: optStr(body.driverName),
          driverPhone: optStr(body.driverPhone),
          crewNames: body.crewNames ? JSON.stringify(body.crewNames) : '[]',
          fuelLevel: num(body.fuelLevel, 'fuelLevel', { min: 0, max: 100 }),
          odometerKm: num(body.odometerKm, 'odometerKm', { min: 0 }),
        },
      });
      recordAudit(db, request, { action: 'ambulance.create', entityType: 'ambulance', entityId: ambulance.id, after: { registration } });
      return { ambulance };
    },
  );

  // -------------------------------------------------------------- status
  app.post(
    '/ambulances/:id/status',
    { preHandler: guards.requirePermission('manage_ambulance'), schema: { summary: 'Set fleet status (maintenance/offline/available…)', tags: ['ambulance'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const status = str(body.status, 'status', { required: true }).toUpperCase();
      if (!AMBULANCE_STATUSES.includes(status)) throw httpErrors.badRequest('Invalid ambulance status');
      const ambulance = await db.ambulance.findFirst({ where: { id: params.id, ...facilityScope(u) } });
      if (!ambulance) throw httpErrors.notFound('Ambulance not found in scope');
      const updated = await db.ambulance.update({
        where: { id: ambulance.id },
        data: { status, fuelLevel: num(body.fuelLevel, 'fuelLevel', { min: 0, max: 100 }) ?? ambulance.fuelLevel },
      });
      recordAudit(db, request, { action: 'ambulance.status', entityType: 'ambulance', entityId: ambulance.id, after: { status } });
      return { ambulance: updated };
    },
  );

  // ---------------------------------------------------------------- trips
  app.get(
    '/ambulance/trips',
    { preHandler: guards.requirePermission('view_patient', 'write_clinical_note'), schema: { summary: 'Trip log (scoped)', tags: ['ambulance'] } },
    async (request) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const status = optStr(q.status);
      const where: Record<string, unknown> = { ambulance: { ...facilityScope(u) } };
      if (status) where.status = str(status, 'status').toUpperCase();
      const items = await db.ambulanceTrip.findMany({
        where,
        orderBy: { dispatchedAt: 'desc' },
        take: 100,
        include: {
          ambulance: { select: { id: true, registration: true } },
          patient: { select: { id: true, mrn: true, fullName: true } },
          destination: { select: { id: true, name: true } },
        },
      });
      return { items, count: items.length };
    },
  );

  app.post(
    '/ambulance/trips',
    { preHandler: guards.requirePermission('manage_ambulance'), schema: { summary: 'Dispatch an ambulance (starts a trip)', tags: ['ambulance'] } },
    async (request) => {
      const u = request.user!;
      if (!u.facilityId) throw httpErrors.forbidden('Dispatch requires a facility');
      const body = (request.body ?? {}) as Record<string, unknown>;
      const ambulanceId = str(body.ambulanceId, 'ambulanceId', { required: true });
      const ambulance = await db.ambulance.findFirst({ where: { id: ambulanceId, ...facilityScope(u) } });
      if (!ambulance) throw httpErrors.notFound('Ambulance not found in scope');
      if (ambulance.status !== 'AVAILABLE' && ambulance.status !== 'RETURNING') {
        throw httpErrors.conflict(`Ambulance is ${ambulance.status} — not available for dispatch`);
      }
      const patientId = optStr(body.patientId);
      if (patientId) await assertPatientAccess(db, u, patientId);
      const trip = await db.$transaction(async (tx) => {
        const created = await tx.ambulanceTrip.create({
          data: {
            ambulanceId,
            patientId,
            dispatchedById: u.id,
            emergencyType: optStr(body.emergencyType),
            pickupLocation: optStr(body.pickupLocation),
            destinationFacilityId: optStr(body.destinationFacilityId),
            notes: optStr(body.notes),
            status: 'ASSIGNED',
          },
        });
        await tx.ambulance.update({ where: { id: ambulanceId }, data: { status: 'ASSIGNED' } });
        return created;
      });
      recordAudit(db, request, { action: 'ambulance.dispatch', entityType: 'ambulanceTrip', entityId: trip.id, after: { ambulanceId, emergencyType: trip.emergencyType } });
      return { trip };
    },
  );

  app.post(
    '/ambulance/trips/:id/status',
    { preHandler: guards.requirePermission('manage_ambulance'), schema: { summary: 'Advance a trip through its lifecycle', tags: ['ambulance'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const next = str(body.status, 'status', { required: true }).toUpperCase();
      const trip = await db.ambulanceTrip.findUnique({ where: { id: params.id }, include: { ambulance: { include: { facility: true } } } });
      if (!trip) throw httpErrors.notFound('Trip not found');
      // Scope guard for every role: facility users only their fleet, regional users
      // their region, district users their district, national users everything.
      const inScope =
        u.scope === 'NATIONAL'
        || (u.scope === 'REGIONAL' && !!u.regionId && trip.ambulance.facility.regionId === u.regionId)
        || (u.scope === 'DISTRICT' && !!u.districtId && trip.ambulance.facility.districtId === u.districtId)
        || (u.scope === 'FACILITY' && !!u.facilityId && trip.ambulance.facilityId === u.facilityId);
      if (!inScope) throw httpErrors.forbidden('No access to this trip');
      const allowed = TRIP_FLOW[trip.status] ?? [];
      if (!allowed.includes(next)) throw httpErrors.conflict(`Cannot move trip from ${trip.status} to ${next} (allowed: ${allowed.join(', ') || 'none'})`);

      const now = new Date();
      const data: Record<string, unknown> = { status: next };
      if (next === 'AT_SCENE') data.arrivedAtScene = now;
      if (next === 'TRANSPORTING') data.departedSceneAt = now;
      if (next === 'AT_FACILITY') data.arrivedAtFacility = now;
      if (next === 'COMPLETED') data.completedAt = now;
      if (next === 'CANCELLED') data.completedAt = now;

      await db.$transaction([
        db.ambulanceTrip.update({ where: { id: trip.id }, data }),
        db.ambulance.update({
          where: { id: trip.ambulanceId },
          data: { status: next === 'COMPLETED' || next === 'CANCELLED' ? 'AVAILABLE' : next },
        }),
      ]);
      recordAudit(db, request, { action: 'ambulanceTrip.status', entityType: 'ambulanceTrip', entityId: trip.id, after: { from: trip.status, to: next } });
      return { trip: { ...trip, ...data } };
    },
  );
}
