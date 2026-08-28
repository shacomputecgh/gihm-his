import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { optStr, num } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import { dispatchSms, dispatchWhatsApp } from '../../lib/sms.js';
import type { Guards } from '../../lib/guards.js';
import type { AuthUser } from '../../types.js';
import { immunizationScope } from '../immunization/scope.js';
import { buildReminderMessage } from '../immunization/reminders.js';
import { scheduleItem, nextScheduleItem, DAY_MS } from '../immunization/schedule.js';
import { assertPatientAccess } from '../patients/service.js';
import { runWithoutCapture } from '../edge/capture.js';

interface Mutation {
  transactionId: string;
  entityType: string;
  operation: 'CREATE' | 'UPDATE' | 'RESULT' | 'REMIND';
  idempotencyKey?: string;
  clientTimestamp?: string;
  /** ISO updatedAt of the entity this targeted update was based on (docs/15 §4). */
  baseVersion?: string;
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

      // Device gate (docs/21 §1, spec §109): a device that is not ACTIVE cannot
      // push mutations. New devices self-register as PENDING and must be
      // approved (enrolled) by an administrator before any data flows.
      let device: { id: string; status: string; remoteLogoutAt: Date | null } | null = null;
      if (deviceId) {
        device = await db.device.findUnique({ where: { deviceId } });
        if (!device) {
          await db.device.create({
            data: {
              deviceId,
              name: optStr(body.deviceName) ?? 'Syncing device',
              platform: (optStr(body.platform) ?? 'WEB').toUpperCase(),
              facilityId: u.facilityId ?? undefined,
              assignedUserId: u.id,
              status: 'PENDING',
              lastSeenAt: new Date(),
            },
          });
          throw httpErrors.createError(403, 'This device is new and awaiting administrator approval before it can sync.', { code: 'DEVICE_PENDING_APPROVAL' });
        }
        if (device.status !== 'ACTIVE') {
          const code = device.status === 'PENDING' ? 'DEVICE_PENDING_APPROVAL' : device.status === 'SUSPENDED' ? 'DEVICE_SUSPENDED' : 'DEVICE_REVOKED';
          const message =
            device.status === 'PENDING'
              ? 'This device is awaiting administrator approval before it can sync.'
              : device.status === 'SUSPENDED'
                ? 'This device has been suspended by an administrator. Contact your facility admin.'
                : `This device has been ${device.status.toLowerCase()} and can no longer sync. Contact your facility admin.`;
          throw httpErrors.createError(403, message, { code });
        }
        await db.device.update({
          where: { id: device.id },
          data: { lastSeenAt: new Date(), lastSyncAt: new Date(), facilityId: u.facilityId ?? undefined },
        });
      }

      const results = [];
      let processed = 0;
      let failed = 0;
      for (const m of mutations) {
        try {
          const applied = await applyMutation(db, u, m, deviceId);
          processed++;
          results.push({ transactionId: m.transactionId, status: applied.status, entityId: applied.entityId, duplicated: applied.duplicated, conflictId: applied.conflictId });
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
              facilityId: u.facilityId ?? (typeof m.payload.facilityId === 'string' ? m.payload.facilityId : undefined),
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
      return {
        processed,
        failed,
        results,
        // Lets the client detect a remote logout on its next contact: if
        // remoteLogoutAt is newer than the device's cached offline session the
        // client must drop it and return to the login screen.
        device: device
          ? { status: device.status, remoteLogoutAt: device.remoteLogoutAt ? device.remoteLogoutAt.toISOString() : null }
          : null,
      };
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

async function applyMutation(db: PrismaClient, u: AuthUser, m: Mutation, deviceId?: string | null): Promise<{ status: string; entityId?: string; duplicated: boolean; conflictId?: string }> {
  // The idempotency check and the entity write must be atomic: a crash between
  // entity-create and MutationLog-insert must never cause a duplicate on retry
  // (spec §104). The whole apply runs inside one transaction. The transaction
  // runs without entity capture (docs/16 §5): applying a synced batch ALREADY
  // records its mutation-log rows, so the writes here must never be captured a
  // second time as `direct:` rows (that would re-apply the same change
  // upstream under a second transactionId).
  return runWithoutCapture(() => db.$transaction(async (tx) => {
    const clientTs = m.clientTimestamp ? new Date(m.clientTimestamp) : new Date();
    const facilityId = u.facilityId ?? (typeof m.payload.facilityId === 'string' ? m.payload.facilityId : undefined);

    // Idempotency: a transaction may arrive more than once (retries, power loss).
    // A FAILED log is not terminal — retries re-attempt the mutation so a
    // transient failure (e.g. temporary MPI conflict) can recover (spec §166).
    const existing = await tx.mutationLog.findUnique({ where: { transactionId: m.transactionId } });
    if (existing && existing.status !== 'FAILED') {
      // A retried CONFLICT keeps its conflictId so the client treats it as a
      // conflict (not a processed success) and never re-enqueues it.
      let conflictId: string | undefined;
      if (existing.status === 'CONFLICT') {
        conflictId = (await tx.syncConflict.findUnique({ where: { transactionId: m.transactionId } }))?.id;
      }
      return { status: existing.status, entityId: existing.entityId ?? undefined, duplicated: true, conflictId };
    }
    // Unique idempotency keys (e.g. client-generated uuid per logical action).
    if (m.idempotencyKey) {
      const byKey = await tx.mutationLog.findFirst({ where: { idempotencyKey: m.idempotencyKey, entityType: m.entityType } });
      if (byKey?.entityId) {
        // A retried conflict (fresh transactionId, same idempotency key) must
        // stay a CONFLICT — reporting PROCESSED would make the client drop the
        // outbox entry and silently discard the preserved data (spec §166).
        if (byKey.status === 'CONFLICT') {
          const conflictId = (await tx.syncConflict.findUnique({ where: { transactionId: byKey.transactionId } }))?.id;
          return { status: 'CONFLICT', entityId: byKey.entityId, duplicated: true, conflictId };
        }
        return { status: 'PROCESSED', entityId: byKey.entityId, duplicated: true };
      }
    }

    let entityId: string | undefined;
    const p = m.payload ?? {};

    switch (`${m.entityType}.${m.operation}`) {
    case 'patient.CREATE': {
      const { createPatient } = await import('../patients/service.js');
      // Same enum discipline as the online /patients route — offline mutations
      // must not corrupt the patientType / visaPermitType enums.
      const patientType = (optStr(p.patientType) ?? 'GHANAIAN').toUpperCase();
      if (!['GHANAIAN', 'FOREIGN', 'REFUGEE', 'OTHER'].includes(patientType)) throw httpErrors.badRequest(`patientType must be one of: GHANAIAN, FOREIGN, REFUGEE, OTHER`);
      const visaPermitType = optStr(p.visaPermitType)?.toUpperCase();
      if (visaPermitType && !['TOURIST', 'STUDENT', 'WORK', 'RESIDENCE', 'DIPLOMATIC', 'OTHER'].includes(visaPermitType)) throw httpErrors.badRequest(`visaPermitType must be one of: TOURIST, STUDENT, WORK, RESIDENCE, DIPLOMATIC, OTHER`);
      const result = await createPatient(tx, {
        // A captured edge write carries its entity id so references survive
        // every hop — the upstream creates the SAME id (docs/16 §5).
        id: optStr(p.id),
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
        reminderOptOut: Boolean(p.reminderOptOut),
        preferredLanguage: optStr(p.preferredLanguage)?.toUpperCase() ?? 'EN',
        facilityId,
        // Foreigner / admission-form identification (docs: admission form) —
        // offline-registered foreign nationals keep passport + visa fields.
        patientType,
        nationality: optStr(p.nationality),
        passport: optStr(p.passport),
        passportIssueDate: p.passportIssueDate ? new Date(String(p.passportIssueDate)) : undefined,
        passportExpiryDate: p.passportExpiryDate ? new Date(String(p.passportExpiryDate)) : undefined,
        visaPermitType,
        visaPermitNumber: optStr(p.visaPermitNumber),
        visaPermitExpiry: p.visaPermitExpiry ? new Date(String(p.visaPermitExpiry)) : undefined,
        countryOfResidence: optStr(p.countryOfResidence),
        permanentAddress: optStr(p.permanentAddress),
        internationalInsurer: optStr(p.internationalInsurer),
        internationalPolicyNumber: optStr(p.internationalPolicyNumber),
      });
      if (result.flagged) throw httpErrors.conflict('MPI duplicate — patient requires manual review before sync');
      entityId = result.patient.id;
      break;
    }
    case 'encounter.CREATE': {
      const enc = await tx.encounter.create({
        data: {
          ...(p.id ? { id: String(p.id) } : {}),
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
          ...(p.id ? { id: String(p.id) } : {}),
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
      const order = await tx.labOrder.findUnique({ where: { id: orderId } });
      if (!order) throw httpErrors.notFound('Lab order not found');
      // Optimistic concurrency (docs/15 §4, spec §101–103, §166): a targeted
      // update built on a stale base must never silently overwrite a newer
      // server state. Both versions are preserved in SyncConflict for human
      // review and the mutation is recorded CONFLICT (not applied, not FAILED).
      const baseVersion = optStr(m.baseVersion);
      if (baseVersion) {
        const baseMs = Date.parse(baseVersion);
        if (!Number.isNaN(baseMs) && baseMs < order.updatedAt.getTime()) {
          const conflict = await tx.syncConflict.create({
            data: {
              transactionId: m.transactionId,
              deviceId,
              entityType: 'labOrder',
              entityId: orderId,
              operation: 'RESULT',
              clientUserId: u.id,
              facilityId,
              serverVersion: JSON.stringify(order),
              clientVersion: JSON.stringify(p),
            },
          });
          await tx.mutationLog.upsert({
            where: { transactionId: m.transactionId },
            create: {
              transactionId: m.transactionId,
              deviceId,
              facilityId,
              entityType: m.entityType,
              operation: m.operation,
              entityId: orderId,
              payload: JSON.stringify(p),
              idempotencyKey: m.idempotencyKey,
              clientTimestamp: clientTs,
              status: 'CONFLICT',
              error: 'Conflicting update — base version older than server state (review required)',
            },
            update: {
              status: 'CONFLICT',
              error: 'Conflicting update — base version older than server state (review required)',
              retryCount: { increment: existing ? 1 : 0 },
            },
          });
          return { status: 'CONFLICT', entityId: orderId, conflictId: conflict.id, duplicated: false };
        }
      }
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
          ...(p.id ? { id: String(p.id) } : {}),
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
          ...(p.id ? { id: String(p.id) } : {}),
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
          ...(p.id ? { id: String(p.id) } : {}),
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
          ...(p.id ? { id: String(p.id) } : {}),
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
      // Offline dose recording mirrors the online route (which requires
      // write_clinical_note/view_patient) — sync_data alone must not grant the
      // same clinical write authority through the back door.
      if (!u.permissions.includes('write_clinical_note') && !u.permissions.includes('view_patient')) {
        throw httpErrors.forbidden('Insufficient permissions to record immunizations');
      }
      // Schedule validation, auto-computed next-due, and duplicate rejection
      // (a duplicate surfaces as a FAILED mutation so the client can reconcile,
      // never a silent double-dose).
      const vaccine = String(p.vaccine ?? '').toUpperCase();
      const dose = String(p.dose ?? '');
      const item = scheduleItem(vaccine, dose);
      if (!item) throw httpErrors.badRequest(`Unknown vaccine/dose: ${vaccine} ${dose} (see /immunizations/schedule)`);
      const patientId = String(p.patientId ?? '');
      await assertPatientAccess(tx, u, patientId);
      const patient = await tx.patient.findUnique({ where: { id: patientId }, select: { dateOfBirth: true } });
      if (!patient) throw httpErrors.notFound('Patient not found');
      const administeredAt = p.administeredAt ? new Date(String(p.administeredAt)) : new Date();
      const dup = await tx.immunization.findFirst({ where: { patientId, vaccine, dose, status: 'GIVEN' } });
      if (dup) throw httpErrors.conflict(`Dose ${vaccine} ${dose} already recorded for this patient`);
      let nextDueAt: Date | undefined;
      const next = nextScheduleItem(vaccine, dose);
      if (next) {
        if (next.ageDays !== null && patient.dateOfBirth) nextDueAt = new Date(patient.dateOfBirth.getTime() + next.ageDays * DAY_MS);
        else if (next.intervalDays !== null) nextDueAt = new Date(administeredAt.getTime() + next.intervalDays * DAY_MS);
      }
      const imm = await tx.immunization.create({
        data: {
          ...(p.id ? { id: String(p.id) } : {}),
          patientId,
          facilityId,
          vaccine,
          dose,
          administeredAt,
          nextDueAt,
          batch: optStr(p.batch),
          vaccinatorId: u.id,
        },
      });
      entityId = imm.id;
      break;
    }
    case 'immunization.REMIND': {
      // Mirrors the online /remind permission (write_clinical_note/view_patient)
      // so a sync_data-only account cannot trigger paid SMS dispatches it could
      // not trigger through the API. Always audit-logged (spec §22).
      if (!u.permissions.includes('write_clinical_note') && !u.permissions.includes('view_patient')) {
        throw httpErrors.forbidden('Insufficient permissions to send reminders');
      }
      const id = String(p.id ?? '');
      const channel = (optStr(p.channel) ?? 'SMS').toUpperCase();
      const imm = await tx.immunization.findFirst({
        where: { id, ...immunizationScope(u) },
        include: { patient: { select: { id: true, fullName: true, phone: true, reminderOptOut: true } } },
      });
      if (!imm) throw httpErrors.notFound('Immunization record not found in scope');
      if (imm.status !== 'GIVEN' && imm.status !== 'MISSED') throw httpErrors.conflict('Only a due or missed dose can be reminded');
      if (!imm.nextDueAt) throw httpErrors.conflict('No next dose is scheduled for this record');
      // Patient preference: never contacted, even via offline replay (docs/23).
      // The dedicated audit action keeps the sweep's look-back dedupe honest.
      if (imm.patient.reminderOptOut) {
        await tx.auditLog.create({
          data: {
            actorId: u.id,
            actorEmail: u.email,
            role: u.roleCode,
            action: 'immunization.remind.optedOut',
            entityType: 'immunization',
            entityId: imm.id,
            facilityId: u.facilityId ?? undefined,
            after: JSON.stringify({ channel, to: null, vaccine: imm.vaccine, dose: imm.dose, dispatched: false, provider: 'none', note: 'Patient opted out of reminders — not contacted.' }),
          },
        });
        entityId = imm.id;
        break;
      }
      // Same message and channel handling as the online /remind endpoint.
      const nxt = nextScheduleItem(imm.vaccine, imm.dose);
      const dueDose = nxt ?? { vaccine: imm.vaccine, dose: imm.dose, description: imm.vaccine };
      const message = buildReminderMessage({
        patientName: imm.patient.fullName,
        description: dueDose.description,
        dose: dueDose.dose,
        nextDueAt: imm.nextDueAt,
      });
      const result = imm.patient.phone
        ? channel === 'WHATSAPP'
          ? await dispatchWhatsApp({ to: imm.patient.phone, message })
          : await dispatchSms({ to: imm.patient.phone, message })
        : { dispatched: false, provider: 'none' as const, note: 'No phone number on file — reminder logged to audit trail only.' };
      await tx.auditLog.create({
        data: {
          actorId: u.id,
          actorEmail: u.email,
          role: u.roleCode,
          action: 'immunization.remind',
          entityType: 'immunization',
          entityId: imm.id,
          facilityId: u.facilityId ?? undefined,
          after: JSON.stringify({
            channel,
            to: imm.patient.phone ?? null,
            vaccine: imm.vaccine,
            dose: imm.dose,
            dispatched: result.dispatched,
            provider: result.provider,
            messageId: result.messageId ?? null,
          }),
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
      facilityId,
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
  }));
}
