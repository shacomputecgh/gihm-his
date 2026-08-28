import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { str, optStr, num, dateIso } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import type { Guards } from '../../lib/guards.js';
import { facilityScope } from '../../lib/scope.js';

const COMPONENTS = ['WHOLE_BLOOD', 'RED_CELLS', 'PLASMA', 'PLATELETS', 'CRYOPRECIPITATE'];
const BLOOD_GROUPS = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'];

/** Blood bank (spec §27) — donors, donations, inventory, crossmatch & issue. */
export function registerBloodBankRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  // --------------------------------------------------------------- donors
  app.get(
    '/bloodbank/donors',
    { preHandler: guards.requirePermission('view_patient', 'manage_blood_bank', 'view_financial'), schema: { summary: 'Blood donor registry (scoped)', tags: ['bloodbank'] } },
    async (request) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const where: Record<string, unknown> = { ...facilityScope(u) };
      if (str(q.bloodGroup, 'bloodGroup')) where.bloodGroup = str(q.bloodGroup, 'bloodGroup').toUpperCase();
      if (str(q.status, 'status')) where.status = str(q.status, 'status').toUpperCase();
      const items = await db.bloodDonor.findMany({ where, orderBy: { fullName: 'asc' }, take: 100 });
      return { items, count: items.length };
    },
  );

  app.post(
    '/bloodbank/donors',
    { preHandler: guards.requirePermission('manage_blood_bank'), schema: { summary: 'Register a blood donor', tags: ['bloodbank'] } },
    async (request) => {
      const u = request.user!;
      if (!u.facilityId) throw httpErrors.forbidden('Donor registration requires a facility');
      const body = (request.body ?? {}) as Record<string, unknown>;
      const bloodGroup = str(body.bloodGroup, 'bloodGroup', { required: true }).toUpperCase();
      if (!BLOOD_GROUPS.includes(bloodGroup)) throw httpErrors.badRequest('Invalid blood group');
      const donor = await db.bloodDonor.create({
        data: {
          facilityId: u.facilityId,
          patientId: optStr(body.patientId),
          fullName: str(body.fullName, 'fullName', { required: true, max: 190 }),
          sex: optStr(body.sex),
          dateOfBirth: dateIso(body.dateOfBirth, 'dateOfBirth'),
          phone: optStr(body.phone),
          bloodGroup,
          genotype: optStr(body.genotype),
          status: (optStr(body.status) ?? 'ACTIVE').toUpperCase(),
        },
      });
      recordAudit(db, request, { action: 'bloodDonor.create', entityType: 'bloodDonor', entityId: donor.id, after: { fullName: donor.fullName, bloodGroup } });
      return { donor };
    },
  );

  // ------------------------------------------------------------- donations
  app.get(
    '/bloodbank/donations',
    { preHandler: guards.requirePermission('view_patient', 'manage_blood_bank'), schema: { summary: 'Donation history', tags: ['bloodbank'] } },
    async (request) => {
      const u = request.user!;
      const items = await db.bloodDonation.findMany({
        where: { ...facilityScope(u) },
        orderBy: { donatedAt: 'desc' },
        take: 100,
        include: { donor: { select: { id: true, fullName: true, bloodGroup: true } }, facility: { select: { name: true } } },
      });
      return { items, count: items.length };
    },
  );

  app.post(
    '/bloodbank/donations',
    { preHandler: guards.requirePermission('manage_blood_bank'), schema: { summary: 'Record a donation and create blood units', tags: ['bloodbank'] } },
    async (request) => {
      const u = request.user!;
      if (!u.facilityId) throw httpErrors.forbidden('Donation recording requires a facility');
      const body = (request.body ?? {}) as Record<string, unknown>;
      const donorId = str(body.donorId, 'donorId', { required: true });
      const donor = await db.bloodDonor.findUnique({ where: { id: donorId } });
      if (!donor) throw httpErrors.notFound('Donor not found');
      const bloodGroup = (optStr(body.bloodGroup) ?? donor.bloodGroup).toUpperCase();
      if (!BLOOD_GROUPS.includes(bloodGroup)) throw httpErrors.badRequest('Invalid blood group');
      const volumeMl = num(body.volumeMl, 'volumeMl', { min: 100 }) ?? 450;
      const unitsCreated = num(body.unitsCreated, 'unitsCreated', { min: 1 }) ?? 1;
      const expiryDays = num(body.expiryDays, 'expiryDays', { min: 1 }) ?? 35;
      const screeningResult = (optStr(body.screeningResult) ?? 'PENDING').toUpperCase();
      const reactive = screeningResult === 'REACTIVE';
      // Reactive (failed screening) donations must not enter usable inventory (spec §27).
      const unitStatus = reactive ? 'DISCARDED' : 'AVAILABLE';

      const result = await db.$transaction(async (tx) => {
        const donation = await tx.bloodDonation.create({
          data: {
            donorId,
            facilityId: u.facilityId!,
            bloodGroup,
            volumeMl,
            screeningResult,
            unitsCreated,
            donatedAt: dateIso(body.donatedAt, 'donatedAt') ?? new Date(),
          },
        });
        // Sequential yearly counter shared across ALL facilities — the unitCode
        // column is globally unique, so the sequence cannot restart per facility
        // (two facilities would mint the same code and collide).
        const units = [];
        for (let i = 0; i < unitsCreated; i++) {
          const year = new Date().getFullYear();
          const last = await tx.bloodUnit.findFirst({ where: { unitCode: { startsWith: `BL-${year}-` } }, orderBy: { unitCode: 'desc' }, select: { unitCode: true } });
          const nextSeq = last ? Number(last.unitCode.split('-').pop() ?? '0') + 1 : 1;
          const unit = await tx.bloodUnit.create({
            data: {
              donationId: donation.id,
              facilityId: u.facilityId!,
              unitCode: `BL-${year}-${String(nextSeq).padStart(4, '0')}`,
              bloodGroup,
              component: (optStr(body.component) ?? 'WHOLE_BLOOD').toUpperCase(),
              status: unitStatus,
              expiryDate: new Date(Date.now() + expiryDays * 24 * 3600 * 1000),
              collectedAt: new Date(),
            },
          });
          units.push(unit);
        }
        await tx.bloodDonor.update({ where: { id: donorId }, data: { totalDonations: { increment: 1 }, lastDonationAt: new Date() } });
        return { donation, units };
      });
      recordAudit(db, request, { action: 'bloodDonation.create', entityType: 'bloodDonation', entityId: result.donation.id, after: { donorId, bloodGroup, units: result.units.length } });
      return result;
    },
  );

  // ----------------------------------------------------------- inventory
  app.get(
    '/bloodbank/units',
    { preHandler: guards.requirePermission('view_patient', 'manage_blood_bank', 'order_lab'), schema: { summary: 'Blood unit inventory (scoped)', tags: ['bloodbank'] } },
    async (request) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const where: Record<string, unknown> = { ...facilityScope(u) };
      if (str(q.bloodGroup, 'bloodGroup')) where.bloodGroup = str(q.bloodGroup, 'bloodGroup').toUpperCase();
      if (str(q.status, 'status')) where.status = str(q.status, 'status').toUpperCase();
      // Usable inventory: discarded/expired units are never listed unless the
      // caller explicitly filters for them (spec §27 — reactive donations never
      // enter usable inventory).
      else where.status = { notIn: ['DISCARDED', 'EXPIRED'] };
      const items = await db.bloodUnit.findMany({
        where,
        orderBy: { expiryDate: 'asc' },
        take: 200,
        include: { facility: { select: { name: true } }, issuedPatient: { select: { id: true, fullName: true, mrn: true } } },
      });
      // Inventory summary by group + component
      const summary = BLOOD_GROUPS.map((g) => ({
        bloodGroup: g,
        available: items.filter((u2) => u2.bloodGroup === g && u2.status === 'AVAILABLE').length,
        crossmatched: items.filter((u2) => u2.bloodGroup === g && u2.status === 'CROSSMATCHED').length,
        reserved: items.filter((u2) => u2.bloodGroup === g && u2.status === 'RESERVED').length,
      }));
      return { items, summary, count: items.length };
    },
  );

  app.post(
    '/bloodbank/units/:id/crossmatch',
    { preHandler: guards.requirePermission('manage_blood_bank', 'order_lab', 'verify_lab'), schema: { summary: 'Crossmatch a unit against a patient', tags: ['bloodbank'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const unit = await db.bloodUnit.findFirst({ where: { id: params.id, ...facilityScope(u) } });
      if (!unit) throw httpErrors.notFound('Unit not found in scope');
      if (unit.status === 'ISSUED' || unit.status === 'EXPIRED' || unit.status === 'DISCARDED') {
        throw httpErrors.conflict(`Unit is ${unit.status}`);
      }
      const patientId = str(body.patientId, 'patientId', { required: true });
      const patient = await db.patient.findUnique({ where: { id: patientId } });
      if (!patient) throw httpErrors.notFound('Patient not found');
      const crossmatchResult = (optStr(body.crossmatchResult) ?? 'COMPATIBLE').toUpperCase();
      const updated = await db.$transaction(async (tx) => {
        const up = await tx.bloodUnit.update({
          where: { id: unit.id },
          data: { status: 'CROSSMATCHED', crossmatchPatientId: patientId },
        });
        await tx.transfusionRecord.create({
          data: {
            unitId: unit.id,
            patientId,
            facilityId: unit.facilityId,
            crossmatchResult,
            performedById: u.id,
            status: 'CROSSMATCHED',
          },
        });
        return up;
      });
      recordAudit(db, request, { action: 'bloodUnit.crossmatch', entityType: 'bloodUnit', entityId: unit.id, after: { patientId, crossmatchResult } });
      return { unit: updated };
    },
  );

  app.post(
    '/bloodbank/units/:id/issue',
    { preHandler: guards.requirePermission('manage_blood_bank', 'dispense'), schema: { summary: 'Issue a unit to a patient (transfusion)', tags: ['bloodbank'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const unit = await db.bloodUnit.findFirst({ where: { id: params.id, ...facilityScope(u) } });
      if (!unit) throw httpErrors.notFound('Unit not found in scope');
      // Blood safety: only a crossmatched unit may be issued to a patient (spec §27).
      if (unit.status !== 'CROSSMATCHED') {
        throw httpErrors.conflict(`Unit is ${unit.status} — crossmatch against the patient before issue`);
      }
      const patientId = str(body.patientId, 'patientId', { required: true });
      const patient = await db.patient.findUnique({ where: { id: patientId } });
      if (!patient) throw httpErrors.notFound('Patient not found');
      const updated = await db.$transaction(async (tx) => {
        const up = await tx.bloodUnit.update({
          where: { id: unit.id },
          data: { status: 'ISSUED', issuedToPatientId: patientId, issuedAt: new Date() },
        });
        await tx.transfusionRecord.create({
          data: {
            unitId: unit.id,
            patientId,
            facilityId: unit.facilityId,
            crossmatchResult: 'COMPATIBLE',
            startedAt: new Date(),
            performedById: u.id,
            status: 'IN_PROGRESS',
          },
        });
        return up;
      });
      recordAudit(db, request, { action: 'bloodUnit.issue', entityType: 'bloodUnit', entityId: unit.id, after: { patientId } });
      return { unit: updated };
    },
  );

  // --------------------------------------------------------- transfusions
  app.get(
    '/bloodbank/transfusions',
    { preHandler: guards.requirePermission('view_patient', 'manage_blood_bank'), schema: { summary: 'Transfusion records', tags: ['bloodbank'] } },
    async (request) => {
      const u = request.user!;
      const items = await db.transfusionRecord.findMany({
        where: { ...facilityScope(u) },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { patient: { select: { id: true, mrn: true, fullName: true } }, unit: { select: { unitCode: true, bloodGroup: true, component: true } } },
      });
      return { items, count: items.length };
    },
  );

  app.post(
    '/bloodbank/transfusions/:id/complete',
    { preHandler: guards.requirePermission('manage_blood_bank', 'write_clinical_note'), schema: { summary: 'Complete a transfusion (with optional reaction notes)', tags: ['bloodbank'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const record = await db.transfusionRecord.findUnique({ where: { id: params.id }, include: { facility: true } });
      if (!record) throw httpErrors.notFound('Transfusion record not found');
      const inScope =
        u.scope === 'NATIONAL'
        || (u.scope === 'REGIONAL' && !!u.regionId && record.facility.regionId === u.regionId)
        || (u.scope === 'DISTRICT' && !!u.districtId && record.facility.districtId === u.districtId)
        || (u.scope === 'FACILITY' && !!u.facilityId && record.facilityId === u.facilityId);
      if (!inScope) throw httpErrors.forbidden('No access to this record');
      const reaction = optStr(body.reaction);
      const status = reaction ? 'REACTION' : 'COMPLETED';
      const updated = await db.transfusionRecord.update({
        where: { id: record.id },
        data: { status, reaction, completedAt: new Date() },
      });
      if (reaction) {
        await db.bloodUnit.update({ where: { id: record.unitId }, data: { status: 'DISCARDED' } });
      }
      recordAudit(db, request, { action: 'transfusion.complete', entityType: 'transfusionRecord', entityId: record.id, after: { status, reaction } });
      return { record: updated };
    },
  );
}
