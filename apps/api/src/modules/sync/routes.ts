import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { optStr, num } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import type { Guards } from '../../lib/guards.js';
import type { AuthUser } from '../../types.js';

interface Mutation {
  transactionId: string;
  entityType: string;
  operation: 'CREATE' | 'UPDATE';
  idempotencyKey?: string;
  clientTimestamp?: string;
  payload: Record<string, unknown>;
}

/**
 * Applies an outbox batch of client mutations with idempotency (spec §104, §136).
 * Every transaction is recorded in MutationLog; duplicates return the original
 * result instead of re-applying. Failed items are recorded as FAILED and never
 * silently discarded (spec §166).
 */
export function registerSyncRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  app.post(
    '/sync/mutations',
    { preHandler: guards.requirePermission('sync_data'), schema: { summary: 'Apply batched offline mutations (idempotent)', tags: ['sync'] } },
    async (request) => {
      const u = request.user!;
      const body = (request.body ?? {}) as Record<string, unknown>;
      const deviceId = optStr(body.deviceId);
      const mutations = Array.isArray(body.mutations) ? (body.mutations as Mutation[]) : [];
      if (mutations.length === 0) throw httpErrors.badRequest('No mutations supplied');
      if (mutations.length > 200) throw httpErrors.badRequest('Batch too large (max 200)');

      if (deviceId) {
        await db.device.upsert({
          where: { deviceId },
          create: { deviceId, name: optStr(body.deviceName) ?? 'Syncing device', platform: (optStr(body.platform) ?? 'WEB').toUpperCase(), facilityId: u.facilityId ?? undefined, assignedUserId: u.id, status: 'ACTIVE', lastSeenAt: new Date(), lastSyncAt: new Date() },
          update: { lastSeenAt: new Date(), lastSyncAt: new Date(), facilityId: u.facilityId ?? undefined },
        });
      }

      const results = [];
      let processed = 0;
      let failed = 0;
      for (const m of mutations) {
        try {
          const applied = await applyMutation(db, u, m, deviceId);
          processed++;
          results.push({ transactionId: m.transactionId, status: applied.status, entityId: applied.entityId, duplicated: applied.duplicated });
        } catch (err) {
          failed++;
          const message = err instanceof Error ? err.message : 'Unknown error';
          // Upsert: a FAILED log may already exist for this transactionId from a
          // prior attempt — never let the unique constraint turn a retry into a 500.
          await db.mutationLog.upsert({
            where: { transactionId: m.transactionId },
            create: {
              transactionId: m.transactionId,
              deviceId,
              entityType: m.entityType,
              operation: m.operation,
              payload: JSON.stringify(m.payload ?? {}),
              idempotencyKey: m.idempotencyKey,
              clientTimestamp: m.clientTimestamp ? new Date(m.clientTimestamp) : new Date(),
              status: 'FAILED',
              error: message,
            },
            update: {
              status: 'FAILED',
              error: message,
              retryCount: { increment: 1 },
            },
          });
          results.push({ transactionId: m.transactionId, status: 'FAILED', error: message });
        }
      }

      recordAudit(db, request, { action: 'sync.mutations', entityType: 'sync', after: { processed, failed } });
      return { processed, failed, results };
    },
  );

  app.get(
    '/sync/status',
    { preHandler: guards.requireAuth, schema: { summary: 'Sync status for a device', tags: ['sync'] } },
    async (request) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const deviceId = optStr(q.deviceId);
      const device = deviceId ? await db.device.findUnique({ where: { deviceId } }) : null;
      const pending = deviceId
        ? await db.mutationLog.count({ where: { deviceId, status: 'PENDING' } })
        : 0;
      return { server: 'healthy', now: new Date().toISOString(), device, pending };
    },
  );
}

async function applyMutation(db: PrismaClient, u: AuthUser, m: Mutation, deviceId?: string | null): Promise<{ status: string; entityId?: string; duplicated: boolean }> {
  // The idempotency check and the entity write must be atomic: a crash between
  // entity-create and MutationLog-insert must never cause a duplicate on retry
  // (spec §104). The whole apply runs inside one transaction.
  return db.$transaction(async (tx) => {
    const clientTs = m.clientTimestamp ? new Date(m.clientTimestamp) : new Date();
    const facilityId = u.facilityId ?? (typeof m.payload.facilityId === 'string' ? m.payload.facilityId : undefined);

    // Idempotency: a transaction may arrive more than once (retries, power loss).
    // A FAILED log is not terminal — retries re-attempt the mutation so a
    // transient failure (e.g. temporary MPI conflict) can recover (spec §166).
    const existing = await tx.mutationLog.findUnique({ where: { transactionId: m.transactionId } });
    if (existing && existing.status !== 'FAILED') {
      return { status: existing.status, entityId: existing.entityId ?? undefined, duplicated: true };
    }
    // Unique idempotency keys (e.g. client-generated uuid per logical action).
    if (m.idempotencyKey) {
      const byKey = await tx.mutationLog.findFirst({ where: { idempotencyKey: m.idempotencyKey, entityType: m.entityType } });
      if (byKey?.entityId) {
        return { status: 'PROCESSED', entityId: byKey.entityId, duplicated: true };
      }
    }

    let entityId: string | undefined;
    const p = m.payload ?? {};

    switch (`${m.entityType}.${m.operation}`) {
    case 'patient.CREATE': {
      const { createPatient } = await import('../patients/service.js');
      const result = await createPatient(tx, {
        fullName: String(p.fullName ?? ''),
        dateOfBirth: p.dateOfBirth ? new Date(String(p.dateOfBirth)) : undefined,
        sex: optStr(p.sex)?.toUpperCase(),
        phone: optStr(p.phone),
        email: optStr(p.email),
        ghanaCard: optStr(p.ghanaCard),
        nhisNumber: optStr(p.nhisNumber),
        bloodGroup: optStr(p.bloodGroup),
        allergies: Array.isArray(p.allergies) ? (p.allergies as unknown[]).map(String) : [],
        regionId: optStr(p.regionId),
        districtId: optStr(p.districtId),
        community: optStr(p.community),
        address: optStr(p.address),
        consentAccepted: Boolean(p.consentAccepted),
        facilityId,
      });
      if (result.flagged) throw httpErrors.conflict('MPI duplicate — patient requires manual review before sync');
      entityId = result.patient.id;
      break;
    }
    case 'encounter.CREATE': {
      const enc = await tx.encounter.create({
        data: {
          patientId: String(p.patientId ?? ''),
          facilityId,
          type: (optStr(p.type) ?? 'OPD').toUpperCase(),
          status: 'OPEN',
          clinicianId: u.id,
          presentingComplaint: optStr(p.presentingComplaint),
          temperature: num(p.temperature, 'temperature'),
          pulse: num(p.pulse, 'pulse'),
          respiratoryRate: num(p.respiratoryRate, 'respiratoryRate'),
          systolicBp: num(p.systolicBp, 'systolicBp'),
          diastolicBp: num(p.diastolicBp, 'diastolicBp'),
          spo2: num(p.spo2, 'spo2'),
          weightKg: num(p.weightKg, 'weightKg'),
          painScore: num(p.painScore, 'painScore'),
          triageCategory: optStr(p.triageCategory)?.toUpperCase(),
          idempotencyKey: m.idempotencyKey,
          clientTimestamp: clientTs,
        },
      });
      entityId = enc.id;
      break;
    }
    case 'labOrder.CREATE': {
      const order = await tx.labOrder.create({
        data: {
          encounterId: String(p.encounterId ?? ''),
          patientId: String(p.patientId ?? ''),
          facilityId,
          test: String(p.test ?? ''),
          discipline: (optStr(p.discipline) ?? 'CHEMISTRY').toUpperCase(),
          sampleType: optStr(p.sampleType),
          requestedById: u.id,
          idempotencyKey: m.idempotencyKey,
          clientTimestamp: clientTs,
        },
      });
      entityId = order.id;
      break;
    }
    case 'labOrder.RESULT': {
      const orderId = String(p.orderId ?? '');
      const updated = await tx.labOrder.update({
        where: { id: orderId },
        data: { result: String(p.result ?? ''), critical: Boolean(p.critical), referenceRange: optStr(p.referenceRange), verifiedById: u.id, status: 'VERIFIED' },
      });
      entityId = updated.id;
      break;
    }
    case 'prescription.CREATE': {
      const rx = await tx.prescription.create({
        data: {
          encounterId: String(p.encounterId ?? ''),
          patientId: String(p.patientId ?? ''),
          facilityId,
          medicine: String(p.medicine ?? ''),
          dosage: optStr(p.dosage),
          frequency: optStr(p.frequency),
          duration: optStr(p.duration),
          quantity: num(p.quantity, 'quantity'),
          route: optStr(p.route),
          prescribedById: u.id,
          idempotencyKey: m.idempotencyKey,
          clientTimestamp: clientTs,
        },
      });
      entityId = rx.id;
      break;
    }
    case 'appointment.CREATE': {
      const appt = await tx.appointment.create({
        data: {
          patientId: String(p.patientId ?? ''),
          facilityId,
          service: optStr(p.service),
          reason: optStr(p.reason),
          scheduledFor: p.scheduledFor ? new Date(String(p.scheduledFor)) : new Date(),
          status: 'BOOKED',
          idempotencyKey: m.idempotencyKey,
          clientTimestamp: clientTs,
        },
      });
      entityId = appt.id;
      break;
    }
    case 'admission.CREATE': {
      const adm = await tx.admission.create({
        data: {
          patientId: String(p.patientId ?? ''),
          facilityId,
          ward: optStr(p.ward),
          bed: optStr(p.bed),
          reason: optStr(p.reason),
          status: 'ADMITTED',
        },
      });
      entityId = adm.id;
      break;
    }
    case 'invoice.CREATE': {
      const inv = await tx.invoice.create({
        data: {
          patientId: String(p.patientId ?? ''),
          facilityId,
          items: JSON.stringify(p.items ?? []),
          amount: num(p.amount, 'amount') ?? 0,
          paidAmount: num(p.paidAmount, 'paidAmount') ?? 0,
          status: (optStr(p.status) ?? 'UNPAID').toUpperCase(),
          paymentMethod: optStr(p.paymentMethod)?.toUpperCase(),
        },
      });
      entityId = inv.id;
      break;
    }
    case 'immunization.CREATE': {
      const imm = await tx.immunization.create({
        data: {
          patientId: String(p.patientId ?? ''),
          facilityId,
          vaccine: String(p.vaccine ?? ''),
          dose: String(p.dose ?? ''),
          administeredAt: p.administeredAt ? new Date(String(p.administeredAt)) : new Date(),
          nextDueAt: p.nextDueAt ? new Date(String(p.nextDueAt)) : undefined,
          batch: optStr(p.batch),
          vaccinatorId: u.id,
        },
      });
      entityId = imm.id;
      break;
    }
    default:
      throw httpErrors.badRequest(`Unsupported mutation type: ${m.entityType}.${m.operation}`);
  }

  await tx.mutationLog.upsert({
    where: { transactionId: m.transactionId },
    create: {
      transactionId: m.transactionId,
      deviceId,
      entityType: m.entityType,
      operation: m.operation,
      entityId,
      payload: JSON.stringify(p),
      idempotencyKey: m.idempotencyKey,
      clientTimestamp: clientTs,
      status: 'PROCESSED',
    },
    update: {
      entityId,
      payload: JSON.stringify(p),
      status: 'PROCESSED',
      error: null,
      retryCount: { increment: existing ? 1 : 0 },
    },
  });
  return { status: 'PROCESSED', entityId, duplicated: false };
  });
}
