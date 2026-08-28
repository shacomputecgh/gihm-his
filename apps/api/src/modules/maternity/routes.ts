// -----------------------------------------------------------------------------
// Maternity & obstetrics (spec §20, docs/13 §7) — antenatal care, delivery and
// postnatal follow-up. Patient-scoped append-only clinical records with the
// same access rules as encounters (assertPatientAccess): a facility user only
// sees their own facility's patients, regional/district users their scope.
//
// A recorded delivery closes the pregnancy: active antenatal visits are marked
// DELIVERED so the ANC register reflects the outcome.
// -----------------------------------------------------------------------------

import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { str, optStr, num, dateIso } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import type { Guards } from '../../lib/guards.js';
import { assertPatientAccess } from '../patients/service.js';
import { publishEvent } from '../webhooks/engine.js';

const RISK_LEVELS = ['LOW', 'HIGH'];
const ANC_STATUSES = ['ACTIVE', 'DELIVERED', 'LOST'];
const DELIVERY_TYPES = ['NORMAL', 'ASSISTED', 'CAESAREAN'];
const DELIVERY_MODES = ['VAGINAL', 'INSTRUMENTAL', 'C_SECTION'];
const DELIVERY_OUTCOMES = ['LIVE_BIRTH', 'STILLBIRTH'];
const MATERNAL_OUTCOMES = ['WELL', 'COMPLICATION', 'DEATH'];
const NEWBORN_OUTCOMES = ['WELL', 'NICU', 'DEATH'];
const FEEDING_METHODS = ['EXCLUSIVE', 'MIXED', 'NONE'];

/**
 * WHO partograph alert/action lines: expected dilation = 4cm at labour onset
 * + 1cm/hour; the action line runs 4 hours behind the alert line. Returns the
 * observation's position so the UI can flag prolonged labour; flags are null
 * when no dilation was recorded (nothing to plot).
 */
function labourLines(labourStartedAt: Date, observedAt: Date, dilationCm: number | null): {
  hoursSinceStart: number;
  expectedDilationCm: number;
  beyondAlertLine: boolean | null;
  beyondActionLine: boolean | null;
} {
  const hoursSinceStart = Math.max(0, (observedAt.getTime() - labourStartedAt.getTime()) / 3_600_000);
  const expectedDilationCm = 4 + hoursSinceStart;
  const base = {
    hoursSinceStart: Math.round(hoursSinceStart * 100) / 100,
    expectedDilationCm: Math.round(expectedDilationCm * 100) / 100,
  };
  if (dilationCm === null) return { ...base, beyondAlertLine: null, beyondActionLine: null };
  return {
    ...base,
    beyondAlertLine: dilationCm <= expectedDilationCm,
    beyondActionLine: dilationCm <= expectedDilationCm - 4,
  };
}

export function registerMaternityRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  // ------------------------------------------------------------ antenatal
  app.post(
    '/patients/:id/antenatal',
    { preHandler: guards.requirePermission('write_clinical_note'), schema: { summary: 'Record an antenatal visit (ANC)', tags: ['maternity'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      await assertPatientAccess(db, u, params.id);
      const body = (request.body ?? {}) as Record<string, unknown>;
      const risk = (optStr(body.riskAssessment) ?? 'LOW').toUpperCase();
      if (!RISK_LEVELS.includes(risk)) throw httpErrors.badRequest(`riskAssessment must be one of: ${RISK_LEVELS.join(', ')}`);
      const status = (optStr(body.status) ?? 'ACTIVE').toUpperCase();
      if (!ANC_STATUSES.includes(status)) throw httpErrors.badRequest(`status must be one of: ${ANC_STATUSES.join(', ')}`);
      const gaWeeks = num(body.gaWeeks, 'gaWeeks', { min: 1, max: 45 });
      const visitNumber = (await db.antenatalVisit.count({ where: { patientId: params.id } })) + 1;
      const visit = await db.antenatalVisit.create({
        data: {
          patientId: params.id,
          facilityId: u.facilityId ?? undefined,
          visitNumber,
          gaWeeks,
          edd: dateIso(body.edd, 'edd'),
          weightKg: num(body.weightKg, 'weightKg', { min: 0, max: 400 }),
          systolicBp: num(body.systolicBp, 'systolicBp', { min: 40, max: 280 }),
          diastolicBp: num(body.diastolicBp, 'diastolicBp', { min: 20, max: 180 }),
          fundalHeight: num(body.fundalHeight, 'fundalHeight', { min: 0, max: 60 }),
          fetalHeartRate: num(body.fetalHeartRate, 'fetalHeartRate', { min: 60, max: 220 }),
          riskAssessment: risk,
          supplements: optStr(body.supplements),
          nextVisitAt: dateIso(body.nextVisitAt, 'nextVisitAt'),
          status,
          visitedAt: dateIso(body.visitedAt, 'visitedAt') ?? new Date(),
        },
      });
      recordAudit(db, request, { action: 'antenatal.create', entityType: 'antenatalVisit', entityId: visit.id, after: { patientId: params.id, visitNumber } });
      return { visit };
    },
  );

  app.get(
    '/patients/:id/antenatal',
    { preHandler: guards.requirePermission('view_clinical_record', 'view_patient'), schema: { summary: 'List a patient\'s antenatal visits', tags: ['maternity'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      await assertPatientAccess(db, u, params.id);
      const items = await db.antenatalVisit.findMany({ where: { patientId: params.id }, orderBy: { visitedAt: 'asc' } });
      return { items, count: items.length };
    },
  );

  app.patch(
    '/patients/:id/antenatal/:visitId',
    { preHandler: guards.requirePermission('write_clinical_note'), schema: { summary: 'Update an antenatal visit (risk, status, next visit)', tags: ['maternity'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string; visitId: string };
      await assertPatientAccess(db, u, params.id);
      const existing = await db.antenatalVisit.findFirst({ where: { id: params.visitId, patientId: params.id } });
      if (!existing) throw httpErrors.notFound('Antenatal visit not found');
      const body = (request.body ?? {}) as Record<string, unknown>;
      const data: Record<string, unknown> = {};
      const risk = optStr(body.riskAssessment);
      if (risk) {
        const r = risk.toUpperCase();
        if (!RISK_LEVELS.includes(r)) throw httpErrors.badRequest(`riskAssessment must be one of: ${RISK_LEVELS.join(', ')}`);
        data.riskAssessment = r;
      }
      const status = optStr(body.status);
      if (status) {
        const s = status.toUpperCase();
        if (!ANC_STATUSES.includes(s)) throw httpErrors.badRequest(`status must be one of: ${ANC_STATUSES.join(', ')}`);
        data.status = s;
      }
      if (body.gaWeeks !== undefined) data.gaWeeks = num(body.gaWeeks, 'gaWeeks', { min: 1, max: 45 });
      if (body.weightKg !== undefined) data.weightKg = num(body.weightKg, 'weightKg', { min: 0, max: 400 });
      if (body.systolicBp !== undefined) data.systolicBp = num(body.systolicBp, 'systolicBp', { min: 40, max: 280 });
      if (body.diastolicBp !== undefined) data.diastolicBp = num(body.diastolicBp, 'diastolicBp', { min: 20, max: 180 });
      if (body.fundalHeight !== undefined) data.fundalHeight = num(body.fundalHeight, 'fundalHeight', { min: 0, max: 60 });
      if (body.fetalHeartRate !== undefined) data.fetalHeartRate = num(body.fetalHeartRate, 'fetalHeartRate', { min: 60, max: 220 });
      if (body.supplements !== undefined) data.supplements = optStr(body.supplements) ?? undefined;
      if (body.nextVisitAt !== undefined) data.nextVisitAt = dateIso(body.nextVisitAt, 'nextVisitAt');
      const visit = await db.antenatalVisit.update({ where: { id: existing.id }, data });
      recordAudit(db, request, { action: 'antenatal.update', entityType: 'antenatalVisit', entityId: visit.id, after: { patientId: params.id, ...data } });
      return { visit };
    },
  );

  // ------------------------------------------------------------- delivery
  app.post(
    '/patients/:id/deliveries',
    { preHandler: guards.requirePermission('write_clinical_note'), schema: { summary: 'Record a delivery (APGAR, outcomes)', tags: ['maternity'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      await assertPatientAccess(db, u, params.id);
      const body = (request.body ?? {}) as Record<string, unknown>;
      const deliveryType = (optStr(body.deliveryType) ?? 'NORMAL').toUpperCase();
      if (!DELIVERY_TYPES.includes(deliveryType)) throw httpErrors.badRequest(`deliveryType must be one of: ${DELIVERY_TYPES.join(', ')}`);
      const mode = optStr(body.mode)?.toUpperCase();
      if (mode && !DELIVERY_MODES.includes(mode)) throw httpErrors.badRequest(`mode must be one of: ${DELIVERY_MODES.join(', ')}`);
      const outcome = optStr(body.outcome)?.toUpperCase();
      if (outcome && !DELIVERY_OUTCOMES.includes(outcome)) throw httpErrors.badRequest(`outcome must be one of: ${DELIVERY_OUTCOMES.join(', ')}`);
      const maternalOutcome = (optStr(body.maternalOutcome) ?? 'WELL').toUpperCase();
      if (!MATERNAL_OUTCOMES.includes(maternalOutcome)) throw httpErrors.badRequest(`maternalOutcome must be one of: ${MATERNAL_OUTCOMES.join(', ')}`);
      const newbornOutcome = (optStr(body.newbornOutcome) ?? 'WELL').toUpperCase();
      if (!NEWBORN_OUTCOMES.includes(newbornOutcome)) throw httpErrors.badRequest(`newbornOutcome must be one of: ${NEWBORN_OUTCOMES.join(', ')}`);
      const delivery = await db.deliveryRecord.create({
        data: {
          patientId: params.id,
          facilityId: u.facilityId ?? undefined,
          deliveryType,
          mode,
          outcome,
          birthWeightKg: num(body.birthWeightKg, 'birthWeightKg', { min: 0, max: 10 }),
          apgar1: num(body.apgar1, 'apgar1', { min: 0, max: 10 }),
          apgar5: num(body.apgar5, 'apgar5', { min: 0, max: 10 }),
          complications: optStr(body.complications),
          maternalOutcome,
          newbornOutcome,
          placentaComplete: body.placentaComplete === undefined ? true : Boolean(body.placentaComplete),
          attendedByName: optStr(body.attendedByName),
          deliveredAt: dateIso(body.deliveredAt, 'deliveredAt') ?? new Date(),
        },
      });
      // The pregnancy is over: close the patient's active ANC visits and any
      // open labour partograph.
      await db.antenatalVisit.updateMany({ where: { patientId: params.id, status: 'ACTIVE' }, data: { status: 'DELIVERED' } });
      await db.partograph.updateMany({ where: { patientId: params.id, status: 'ACTIVE' }, data: { status: 'COMPLETE' } });
      recordAudit(db, request, { action: 'delivery.create', entityType: 'deliveryRecord', entityId: delivery.id, after: { patientId: params.id, deliveryType, outcome } });
      // Platform event webhook (docs/22 Phase 7) — durable delivery row; a
      // subscriber outage never fails the clinical write.
      await publishEvent(db, 'delivery.recorded', { deliveryId: delivery.id, patientId: params.id, deliveryType, outcome }).catch(() => undefined);
      return { delivery };
    },
  );

  app.get(
    '/patients/:id/deliveries',
    { preHandler: guards.requirePermission('view_clinical_record', 'view_patient'), schema: { summary: 'List a patient\'s deliveries', tags: ['maternity'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      await assertPatientAccess(db, u, params.id);
      const items = await db.deliveryRecord.findMany({ where: { patientId: params.id }, orderBy: { deliveredAt: 'desc' } });
      return { items, count: items.length };
    },
  );

  // -------------------------------------------------------------- postnatal
  app.post(
    '/patients/:id/postnatal',
    { preHandler: guards.requirePermission('write_clinical_note'), schema: { summary: 'Record a postnatal visit (PNC)', tags: ['maternity'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      await assertPatientAccess(db, u, params.id);
      const body = (request.body ?? {}) as Record<string, unknown>;
      const breastfeeding = optStr(body.breastfeeding)?.toUpperCase();
      if (breastfeeding && !FEEDING_METHODS.includes(breastfeeding)) throw httpErrors.badRequest(`breastfeeding must be one of: ${FEEDING_METHODS.join(', ')}`);
      const visitNumber = (await db.postnatalVisit.count({ where: { patientId: params.id } })) + 1;
      const visit = await db.postnatalVisit.create({
        data: {
          patientId: params.id,
          facilityId: u.facilityId ?? undefined,
          visitNumber,
          maternalReview: optStr(body.maternalReview),
          newbornReview: optStr(body.newbornReview),
          breastfeeding,
          contraception: optStr(body.contraception),
          immunization: optStr(body.immunization),
          followUpAt: dateIso(body.followUpAt, 'followUpAt'),
          visitedAt: dateIso(body.visitedAt, 'visitedAt') ?? new Date(),
        },
      });
      recordAudit(db, request, { action: 'postnatal.create', entityType: 'postnatalVisit', entityId: visit.id, after: { patientId: params.id, visitNumber } });
      return { visit };
    },
  );

  app.get(
    '/patients/:id/postnatal',
    { preHandler: guards.requirePermission('view_clinical_record', 'view_patient'), schema: { summary: 'List a patient\'s postnatal visits', tags: ['maternity'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      await assertPatientAccess(db, u, params.id);
      const items = await db.postnatalVisit.findMany({ where: { patientId: params.id }, orderBy: { visitedAt: 'asc' } });
      return { items, count: items.length };
    },
  );

  // ------------------------------------------------------------ partograph
  // WHO-style labour chart (docs/13 §7): one partograph per labour episode,
  // observations plotted against time since onset. The alert line assumes
  // 4cm at onset + 1cm/hour; the action line sits 4 hours behind it. The
  // server computes each observation's position so the UI can flag
  // prolonged labour without re-implementing the chart math.
  app.post(
    '/patients/:id/partographs',
    { preHandler: guards.requirePermission('write_clinical_note'), schema: { summary: 'Start a labour partograph', tags: ['maternity'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      await assertPatientAccess(db, u, params.id);
      const body = (request.body ?? {}) as Record<string, unknown>;
      const partograph = await db.partograph.create({
        data: {
          patientId: params.id,
          facilityId: u.facilityId ?? undefined,
          labourStartedAt: dateIso(body.labourStartedAt, 'labourStartedAt') ?? new Date(),
          status: 'ACTIVE',
          notes: optStr(body.notes),
        },
      });
      recordAudit(db, request, { action: 'partograph.create', entityType: 'partograph', entityId: partograph.id, after: { patientId: params.id } });
      return { partograph };
    },
  );

  app.get(
    '/patients/:id/partographs',
    { preHandler: guards.requirePermission('view_clinical_record', 'view_patient'), schema: { summary: 'List a patient\'s partographs', tags: ['maternity'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      await assertPatientAccess(db, u, params.id);
      const items = await db.partograph.findMany({
        where: { patientId: params.id },
        orderBy: { labourStartedAt: 'desc' },
        include: { _count: { select: { observations: true } } },
      });
      return { items, count: items.length };
    },
  );

  app.patch(
    '/patients/:id/partographs/:partographId',
    { preHandler: guards.requirePermission('write_clinical_note'), schema: { summary: 'Close a partograph (status / notes)', tags: ['maternity'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string; partographId: string };
      await assertPatientAccess(db, u, params.id);
      const existing = await db.partograph.findFirst({ where: { id: params.partographId, patientId: params.id } });
      if (!existing) throw httpErrors.notFound('Partograph not found');
      const body = (request.body ?? {}) as Record<string, unknown>;
      const data: Record<string, unknown> = {};
      const status = optStr(body.status);
      if (status) {
        const s = status.toUpperCase();
        if (!['ACTIVE', 'COMPLETE'].includes(s)) throw httpErrors.badRequest('status must be one of: ACTIVE, COMPLETE');
        data.status = s;
      }
      if (body.notes !== undefined) data.notes = optStr(body.notes) ?? undefined;
      const partograph = await db.partograph.update({ where: { id: existing.id }, data });
      recordAudit(db, request, { action: 'partograph.update', entityType: 'partograph', entityId: partograph.id, after: { patientId: params.id, ...data } });
      return { partograph };
    },
  );

  app.post(
    '/patients/:id/partographs/:partographId/observations',
    { preHandler: guards.requirePermission('write_clinical_note'), schema: { summary: 'Record a partograph observation', tags: ['maternity'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string; partographId: string };
      await assertPatientAccess(db, u, params.id);
      const partograph = await db.partograph.findFirst({ where: { id: params.partographId, patientId: params.id } });
      if (!partograph) throw httpErrors.notFound('Partograph not found');
      const body = (request.body ?? {}) as Record<string, unknown>;
      const dilation = num(body.cervicalDilationCm, 'cervicalDilationCm', { min: 0, max: 10 });
      const observedAt = dateIso(body.observedAt, 'observedAt') ?? new Date();
      const observation = await db.partographObservation.create({
        data: {
          partographId: partograph.id,
          observedAt,
          cervicalDilationCm: dilation,
          fetalHeartRateBpm: num(body.fetalHeartRateBpm, 'fetalHeartRateBpm', { min: 60, max: 220 }),
          contractionsPer10Min: num(body.contractionsPer10Min, 'contractionsPer10Min', { min: 0, max: 10 }),
          contractionDurationSec: num(body.contractionDurationSec, 'contractionDurationSec', { min: 0, max: 120 }),
          descentFifths: num(body.descentFifths, 'descentFifths', { min: 0, max: 5 }),
          pulseBpm: num(body.pulseBpm, 'pulseBpm', { min: 40, max: 200 }),
          systolicBp: num(body.systolicBp, 'systolicBp', { min: 40, max: 280 }),
          diastolicBp: num(body.diastolicBp, 'diastolicBp', { min: 20, max: 180 }),
          temperatureC: num(body.temperatureC, 'temperatureC', { min: 34, max: 42 }),
          urineOutputMl: num(body.urineOutputMl, 'urineOutputMl', { min: 0, max: 2000 }),
          notes: optStr(body.notes),
        },
      });
      const lines = labourLines(partograph.labourStartedAt, observedAt, dilation ?? null);
      recordAudit(db, request, {
        action: 'partograph.observation',
        entityType: 'partographObservation',
        entityId: observation.id,
        after: { patientId: params.id, partographId: partograph.id, ...lines },
      });
      return { observation, ...lines };
    },
  );

  app.get(
    '/patients/:id/partographs/:partographId/observations',
    { preHandler: guards.requirePermission('view_clinical_record', 'view_patient'), schema: { summary: 'List a partograph\'s observations with alert/action line status', tags: ['maternity'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string; partographId: string };
      await assertPatientAccess(db, u, params.id);
      const partograph = await db.partograph.findFirst({ where: { id: params.partographId, patientId: params.id } });
      if (!partograph) throw httpErrors.notFound('Partograph not found');
      const rows = await db.partographObservation.findMany({ where: { partographId: partograph.id }, orderBy: { observedAt: 'asc' } });
      const items = rows.map((o) => ({ ...o, ...labourLines(partograph.labourStartedAt, o.observedAt, o.cervicalDilationCm ?? null) }));
      return { items, count: items.length, labourStartedAt: partograph.labourStartedAt };
    },
  );
}
