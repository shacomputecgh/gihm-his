import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { str, optStr, num, dateIso, parseJsonArr, stringifyJsonArr } from '../../lib/validate.js';
import { parsePage, pageEnvelope } from '../../lib/pagination.js';
import { recordAudit } from '../../lib/audit.js';
import type { Guards } from '../../lib/guards.js';
import { createPatient, assertPatientAccess, patientListScope } from './service.js';

export function registerPatientRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  // ---------------------------------------------------------- registration
  app.post(
    '/patients',
    { preHandler: guards.requirePermission('create_patient'), schema: { summary: 'Register patient (MPI check)', tags: ['patients'] } },
    async (request, reply) => {
      const u = request.user!;
      const body = (request.body ?? {}) as Record<string, unknown>;
      const facilityId = optStr(u.facilityId) ?? optStr(body.facilityId);

      const result = await createPatient(db, {
        fullName: str(body.fullName, 'fullName', { required: true, max: 190 }),
        dateOfBirth: dateIso(body.dateOfBirth, 'dateOfBirth'),
        sex: optStr(body.sex)?.toUpperCase(),
        phone: optStr(body.phone),
        email: optStr(body.email),
        ghanaCard: optStr(body.ghanaCard),
        nhisNumber: optStr(body.nhisNumber),
        passport: optStr(body.passport),
        bloodGroup: optStr(body.bloodGroup),
        genotype: optStr(body.genotype),
        allergies: Array.isArray(body.allergies) ? (body.allergies as unknown[]).map(String) : [],
        regionId: optStr(body.regionId),
        districtId: optStr(body.districtId),
        community: optStr(body.community),
        address: optStr(body.address),
        nextOfKinName: optStr(body.nextOfKinName),
        nextOfKinPhone: optStr(body.nextOfKinPhone),
        emergencyContactPhone: optStr(body.emergencyContactPhone),
        consentAccepted: Boolean(body.consentAccepted),
        facilityId,
        force: Boolean(body.force),
      });

      if (result.flagged) {
        // Never silently merge records — surface candidates for manual review (spec §12).
        return reply.status(409).send({
          error: { code: 'MPI_DUPLICATE', message: 'Possible duplicate patient record(s) found — review before creating.', candidates: result.candidates },
        });
      }
      recordAudit(db, request, { action: 'patient.create', entityType: 'patient', entityId: result.patient.id, after: { mrn: result.patient.mrn, fullName: result.patient.fullName } });
      return { patient: result.patient, candidates: result.candidates, mpi: 'ok' };
    },
  );

  // ------------------------------------------------------------ search/list
  // self_access lets the patient portal list only the caller's own record
  // (patientListScope → { user: { id } }); staff need view_patient as before.
  app.get(
    '/patients',
    { preHandler: guards.requirePermission('view_patient', 'self_access'), schema: { summary: 'Search patients', tags: ['patients'] } },
    async (request) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const page = parsePage(q);
      const scope = patientListScope(u);
      const search = str(q.q, 'q');
      const where: Record<string, unknown> = { ...scope };
      if (search) {
        where.OR = [
          { fullName: { contains: search } },
          { mrn: { contains: search } },
          { ghanaCard: { contains: search } },
          { nhisNumber: { contains: search } },
          { phone: { contains: search } },
        ];
      }
      const [items, total] = await Promise.all([
        db.patient.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: page.skip,
          take: page.take,
          include: {
            region: { select: { name: true } },
            district: { select: { name: true } },
            facility: { select: { name: true } },
          },
        }),
        db.patient.count({ where }),
      ]);
      return pageEnvelope(
        items.map((p) => ({ ...p, allergies: parseJsonArr<string>(p.allergies) })),
        total,
        page,
      );
    },
  );

  // ------------------------------------------------------- longitudinal view
  app.get(
    '/patients/:id',
    { preHandler: guards.requirePermission('view_patient', 'view_clinical_record', 'self_access'), schema: { summary: 'Full patient record', tags: ['patients'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      await assertPatientAccess(db, u, params.id);
      const patient = await db.patient.findUnique({
        where: { id: params.id },
        include: {
          region: { select: { name: true } },
          district: { select: { name: true } },
          facility: { select: { id: true, name: true } },
          identifiers: true,
          contacts: true,
          appointments: { orderBy: { scheduledFor: 'desc' }, take: 10 },
          encounters: {
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: { notes: { orderBy: { createdAt: 'desc' } }, diagnoses: true },
          },
          labOrders: { orderBy: { createdAt: 'desc' }, take: 20 },
          prescriptions: { orderBy: { createdAt: 'desc' }, take: 20 },
          admissions: { orderBy: { admittedAt: 'desc' } },
          referrals: { orderBy: { createdAt: 'desc' }, take: 10 },
          invoices: { orderBy: { issuedAt: 'desc' }, take: 10 },
          immunizations: { orderBy: { administeredAt: 'desc' } },
          diseaseCases: true,
        },
      });
      if (!patient) throw httpErrors.notFound('Patient not found');
      return { ...patient, allergies: parseJsonArr<string>(patient.allergies) };
    },
  );

  // ------------------------------------------------------------- encounters
  app.post(
    '/patients/:id/encounters',
    { preHandler: guards.requirePermission('write_clinical_note'), schema: { summary: 'Open a clinical encounter with triage/vitals', tags: ['patients'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      await assertPatientAccess(db, u, params.id);
      const body = (request.body ?? {}) as Record<string, unknown>;

      const encounter = await db.encounter.create({
        data: {
          patientId: params.id,
          facilityId: u.facilityId ?? undefined,
          type: (optStr(body.type) ?? 'OPD').toUpperCase(),
          status: 'OPEN',
          clinicianId: u.id,
          presentingComplaint: optStr(body.presentingComplaint),
          temperature: num(body.temperature, 'temperature', { min: 25, max: 45 }),
          pulse: num(body.pulse, 'pulse', { min: 20, max: 250 }),
          respiratoryRate: num(body.respiratoryRate, 'respiratoryRate', { min: 4, max: 80 }),
          systolicBp: num(body.systolicBp, 'systolicBp', { min: 40, max: 280 }),
          diastolicBp: num(body.diastolicBp, 'diastolicBp', { min: 20, max: 180 }),
          spo2: num(body.spo2, 'spo2', { min: 40, max: 100 }),
          weightKg: num(body.weightKg, 'weightKg', { min: 0.5, max: 400 }),
          heightCm: num(body.heightCm, 'heightCm', { min: 20, max: 260 }),
          painScore: num(body.painScore, 'painScore', { min: 0, max: 10 }),
          triageCategory: optStr(body.triageCategory)?.toUpperCase(),
          idempotencyKey: optStr(body.idempotencyKey),
          clientTimestamp: dateIso(body.clientTimestamp, 'clientTimestamp'),
        },
      });
      recordAudit(db, request, { action: 'encounter.create', entityType: 'encounter', entityId: encounter.id });
      return { encounter };
    },
  );

  // ------------------------------------------------------------ clinical note
  app.post(
    '/patients/:id/notes',
    { preHandler: guards.requirePermission('write_clinical_note'), schema: { summary: 'Add a clinical note to an encounter', tags: ['patients'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      await assertPatientAccess(db, u, params.id);
      const body = (request.body ?? {}) as Record<string, unknown>;
      const encounterId = str(body.encounterId, 'encounterId', { required: true });
      const encounter = await db.encounter.findFirst({ where: { id: encounterId, patientId: params.id } });
      if (!encounter) throw httpErrors.notFound('Encounter not found for this patient');
      const note = await db.clinicalNote.create({
        data: {
          encounterId,
          authorId: u.id,
          noteType: (optStr(body.noteType) ?? 'DOCTOR').toUpperCase(),
          note: str(body.note, 'note', { required: true, max: 10000 }),
        },
      });
      if (encounter.status === 'OPEN') {
        await db.encounter.update({ where: { id: encounterId }, data: { status: 'IN_PROGRESS' } });
      }
      recordAudit(db, request, { action: 'clinicalNote.create', entityType: 'encounter', entityId: encounterId });
      return { note };
    },
  );

  // --------------------------------------------------------------- lab orders
  app.post(
    '/patients/:id/lab-orders',
    { preHandler: guards.requirePermission('order_lab'), schema: { summary: 'Order a laboratory test', tags: ['patients'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      await assertPatientAccess(db, u, params.id);
      const body = (request.body ?? {}) as Record<string, unknown>;
      const encounterId = str(body.encounterId, 'encounterId', { required: true });
      const encounter = await db.encounter.findFirst({ where: { id: encounterId, patientId: params.id } });
      if (!encounter) throw httpErrors.notFound('Encounter not found for this patient');
      const order = await db.labOrder.create({
        data: {
          encounterId,
          patientId: params.id,
          facilityId: u.facilityId ?? undefined,
          test: str(body.test, 'test', { required: true, max: 190 }),
          discipline: (optStr(body.discipline) ?? 'CHEMISTRY').toUpperCase(),
          sampleType: optStr(body.sampleType),
          requestedById: u.id,
          idempotencyKey: optStr(body.idempotencyKey),
          clientTimestamp: dateIso(body.clientTimestamp, 'clientTimestamp'),
        },
      });
      recordAudit(db, request, { action: 'labOrder.create', entityType: 'labOrder', entityId: order.id });
      return { order };
    },
  );

  app.post(
    '/patients/:id/lab-orders/:orderId/result',
    { preHandler: guards.requirePermission('verify_lab'), schema: { summary: 'Enter + verify a lab result', tags: ['patients'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string; orderId: string };
      await assertPatientAccess(db, u, params.id);
      const body = (request.body ?? {}) as Record<string, unknown>;
      const order = await db.labOrder.findFirst({ where: { id: params.orderId, patientId: params.id } });
      if (!order) throw httpErrors.notFound('Lab order not found');
      const result = str(body.result, 'result', { required: true, max: 2000 });
      const critical = Boolean(body.critical);
      const updated = await db.labOrder.update({
        where: { id: order.id },
        data: { result, critical, referenceRange: optStr(body.referenceRange), resultNote: optStr(body.resultNote), verifiedById: u.id, status: 'VERIFIED' },
      });
      recordAudit(db, request, { action: 'labOrder.verify', entityType: 'labOrder', entityId: order.id, after: { result, critical } });
      return { order: updated };
    },
  );

  // ------------------------------------------------------------- prescriptions
  app.post(
    '/patients/:id/prescriptions',
    { preHandler: guards.requirePermission('prescribe'), schema: { summary: 'Prescribe medication', tags: ['patients'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      await assertPatientAccess(db, u, params.id);
      const body = (request.body ?? {}) as Record<string, unknown>;
      const encounterId = str(body.encounterId, 'encounterId', { required: true });
      const encounter = await db.encounter.findFirst({ where: { id: encounterId, patientId: params.id } });
      if (!encounter) throw httpErrors.notFound('Encounter not found for this patient');
      const rx = await db.prescription.create({
        data: {
          encounterId,
          patientId: params.id,
          facilityId: u.facilityId ?? undefined,
          medicine: str(body.medicine, 'medicine', { required: true, max: 190 }),
          dosage: optStr(body.dosage),
          frequency: optStr(body.frequency),
          duration: optStr(body.duration),
          quantity: num(body.quantity, 'quantity', { min: 1 }),
          route: optStr(body.route),
          prescribedById: u.id,
          idempotencyKey: optStr(body.idempotencyKey),
          clientTimestamp: dateIso(body.clientTimestamp, 'clientTimestamp'),
        },
      });
      recordAudit(db, request, { action: 'prescription.create', entityType: 'prescription', entityId: rx.id });
      return { prescription: rx };
    },
  );

  app.post(
    '/patients/:id/prescriptions/:rxId/dispense',
    { preHandler: guards.requirePermission('dispense'), schema: { summary: 'Dispense a prescription', tags: ['patients'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string; rxId: string };
      await assertPatientAccess(db, u, params.id);
      const body = (request.body ?? {}) as Record<string, unknown>;
      const rx = await db.prescription.findFirst({ where: { id: params.rxId, patientId: params.id } });
      if (!rx) throw httpErrors.notFound('Prescription not found');
      if (rx.status === 'DISPENSED') throw httpErrors.conflict('Prescription already fully dispensed');
      const qty = num(body.quantity, 'quantity', { min: 1 }) ?? rx.quantity ?? 1;
      const dispensedQty = (rx.dispensedQty ?? 0) + qty;
      const status = dispensedQty >= (rx.quantity ?? 0) ? 'DISPENSED' : 'PARTIAL';
      const updated = await db.prescription.update({
        where: { id: rx.id },
        data: { dispensedQty, status, dispensedById: u.id },
      });
      recordAudit(db, request, { action: 'prescription.dispense', entityType: 'prescription', entityId: rx.id, after: { dispensedQty, status } });
      return { prescription: updated };
    },
  );

  // ---------------------------------------------------------------- admissions
  app.post(
    '/patients/:id/admissions',
    { preHandler: guards.requirePermission('write_clinical_note'), schema: { summary: 'Admit patient', tags: ['patients'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      await assertPatientAccess(db, u, params.id);
      const body = (request.body ?? {}) as Record<string, unknown>;
      const admission = await db.admission.create({
        data: {
          patientId: params.id,
          facilityId: u.facilityId ?? undefined,
          ward: optStr(body.ward),
          bed: optStr(body.bed),
          reason: optStr(body.reason),
          status: 'ADMITTED',
        },
      });
      recordAudit(db, request, { action: 'admission.create', entityType: 'admission', entityId: admission.id });
      return { admission };
    },
  );

  app.post(
    '/patients/:id/admissions/:admId/discharge',
    { preHandler: guards.requirePermission('write_clinical_note'), schema: { summary: 'Discharge patient', tags: ['patients'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string; admId: string };
      await assertPatientAccess(db, u, params.id);
      const body = (request.body ?? {}) as Record<string, unknown>;
      const admission = await db.admission.findFirst({ where: { id: params.admId, patientId: params.id } });
      if (!admission) throw httpErrors.notFound('Admission not found');
      if (admission.status === 'DISCHARGED') throw httpErrors.conflict('Already discharged');
      const updated = await db.admission.update({
        where: { id: admission.id },
        data: { status: 'DISCHARGED', dischargedAt: new Date(), dischargeSummary: optStr(body.summary) },
      });
      recordAudit(db, request, { action: 'admission.discharge', entityType: 'admission', entityId: admission.id });
      return { admission: updated };
    },
  );
}
