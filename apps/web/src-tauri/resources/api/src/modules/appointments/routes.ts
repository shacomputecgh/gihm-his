import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { str, optStr, dateIso, parseJsonArr } from '../../lib/validate.js';
import { parsePage, pageEnvelope } from '../../lib/pagination.js';
import { recordAudit } from '../../lib/audit.js';
import type { Guards } from '../../lib/guards.js';
import { assertPatientAccess } from '../patients/service.js';
import { clinicalScope } from '../../lib/scope.js';

export function registerAppointmentRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  // ------------------------------------------------------------ appointments
  // self_access lets the patient portal see their own appointments only
  // (clinicalScope → { patient: { user: { id } } }); staff need staff perms.
  app.get(
    '/appointments',
    { preHandler: guards.requirePermission('view_appointments', 'view_dashboard', 'self_access'), schema: { summary: 'List appointments (filter by date/status)', tags: ['appointments'] } },
    async (request) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const page = parsePage(q);
      const where: Record<string, unknown> = { ...clinicalScope(u) };
      const date = dateIso(q.date, 'date');
      if (date) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
        where.scheduledFor = { gte: start, lt: end };
      }
      if (optStr(q.status)) where.status = optStr(q.status);

      const [items, total] = await Promise.all([
        db.appointment.findMany({
          where,
          orderBy: { scheduledFor: 'asc' },
          skip: page.skip,
          take: page.take,
          include: { patient: { select: { id: true, mrn: true, fullName: true, phone: true } } },
        }),
        db.appointment.count({ where }),
      ]);
      return pageEnvelope(items, total, page);
    },
  );

  app.post(
    '/appointments',
    { preHandler: guards.requirePermission('book_appointment', 'view_appointments'), schema: { summary: 'Book an appointment (idempotent)', tags: ['appointments'] } },
    async (request) => {
      const u = request.user!;
      const body = (request.body ?? {}) as Record<string, unknown>;
      const patientId = str(body.patientId, 'patientId', { required: true });
      await assertPatientAccess(db, u, patientId);
      const scheduledFor = dateIso(body.scheduledFor, 'scheduledFor', { required: true })!;
      const idempotencyKey = optStr(body.idempotencyKey);

      if (idempotencyKey) {
        const existing = await db.appointment.findUnique({ where: { idempotencyKey } });
        if (existing) return { appointment: existing, duplicated: true };
      }

      const appointment = await db.appointment.create({
        data: {
          patientId,
          facilityId: u.facilityId ?? undefined,
          service: optStr(body.service),
          reason: optStr(body.reason),
          scheduledFor,
          status: 'BOOKED',
          idempotencyKey,
          clientTimestamp: dateIso(body.clientTimestamp, 'clientTimestamp'),
        },
      });
      recordAudit(db, request, { action: 'appointment.book', entityType: 'appointment', entityId: appointment.id });
      return { appointment, duplicated: false };
    },
  );

  app.post(
    '/appointments/:id/status',
    { preHandler: guards.requirePermission('view_appointments', 'manage_queue'), schema: { summary: 'Update appointment status', tags: ['appointments'] } },
    async (request) => {
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const status = str(body.status, 'status', { required: true }).toUpperCase();
      const allowed = ['CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'MISSED'];
      if (!allowed.includes(status)) throw httpErrors.badRequest(`Invalid status "${status}"`);
      const appointment = await db.appointment.update({ where: { id: params.id }, data: { status } });
      recordAudit(db, request, { action: 'appointment.status', entityType: 'appointment', entityId: params.id, after: { status } });
      return { appointment };
    },
  );

  // ------------------------------------------------------------------ queue
  app.get(
    '/queue',
    { preHandler: guards.requirePermission('view_queue', 'manage_queue'), schema: { summary: 'Queue board', tags: ['queue'] } },
    async (request) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const departmentId = optStr(q.departmentId);
      const where: Record<string, unknown> = { facilityId: u.facilityId ?? undefined };
      if (departmentId) where.departmentId = departmentId;
      const entries = await db.queueEntry.findMany({
        where,
        orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
        include: { patient: { select: { id: true, mrn: true, fullName: true } } },
        take: 100,
      });
      return { entries };
    },
  );

  app.post(
    '/queue',
    { preHandler: guards.requirePermission('manage_queue', 'view_queue'), schema: { summary: 'Add patient to queue (auto ticket)', tags: ['queue'] } },
    async (request) => {
      const u = request.user!;
      const body = (request.body ?? {}) as Record<string, unknown>;
      const departmentId = str(body.departmentId, 'departmentId', { required: true });
      const department = await db.department.findFirst({ where: { id: departmentId } });
      if (!department) throw httpErrors.notFound('Department not found');
      const facilityId = department.facilityId;
      // Monotonic across days: the unique constraint (facilityId, departmentId,
      // ticket) spans all time, so a per-day counter would collide with
      // yesterday's tickets (e.g. OUT-001 seeded yesterday + OUT-001 today).
      // The number comes from an atomic per-department sequence — a load test
      // caught the old count+1 allocator racing under parallel check-ins
      // (P2002 on the unique tuple), so two check-ins can never observe the
      // same number.
      const seq = await nextQueueTicket(db, departmentId);
      const prefix = department.name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'Q';
      const entry = await db.queueEntry.create({
        data: {
          facilityId,
          departmentId,
          patientId: optStr(body.patientId),
          ticket: `${prefix}-${String(seq).padStart(3, '0')}`,
          status: 'WAITING',
        },
      });
      recordAudit(db, request, { action: 'queue.add', entityType: 'queueEntry', entityId: entry.id, after: { ticket: entry.ticket } });
      return { entry };
    },
  );

  app.post(
    '/queue/:departmentId/call-next',
    { preHandler: guards.requirePermission('manage_queue'), schema: { summary: 'Call next patient in department queue', tags: ['queue'] } },
    async (request) => {
      const params = request.params as { departmentId: string };
      const department = await db.department.findFirst({ where: { id: params.departmentId } });
      if (!department) throw httpErrors.notFound('Department not found');
      const next = await db.queueEntry.findFirst({
        where: { departmentId: params.departmentId, status: 'WAITING' },
        orderBy: { createdAt: 'asc' },
        include: { patient: { select: { id: true, mrn: true, fullName: true } } },
      });
      if (!next) throw httpErrors.notFound('No patients waiting');
      const updated = await db.queueEntry.update({ where: { id: next.id }, data: { status: 'CALLED', calledAt: new Date() } });
      recordAudit(db, request, { action: 'queue.call', entityType: 'queueEntry', entityId: next.id, after: { ticket: next.ticket } });
      return { entry: { ...updated, patient: next.patient } };
    },
  );

  app.post(
    '/queue/:id/status',
    { preHandler: guards.requirePermission('manage_queue'), schema: { summary: 'Complete/skip queue entry', tags: ['queue'] } },
    async (request) => {
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const status = str(body.status, 'status', { required: true }).toUpperCase();
      if (!['COMPLETED', 'SKIPPED', 'IN_SERVICE'].includes(status)) throw httpErrors.badRequest('Invalid queue status');
      const entry = await db.queueEntry.update({
        where: { id: params.id },
        data: { status, servedAt: status === 'COMPLETED' ? new Date() : undefined },
      });
      return { entry };
    },
  );
}

/**
 * Allocates the next queue ticket number for a department atomically. The
 * counter row is created on first use baselined past the highest ticket that
 * department already has (seeded queues own OUT-001…); every take increments
 * it, so concurrent check-ins can never produce the same ticket (SQLite's
 * write lock serialises takers; on Postgres the single-row UPDATE does). A
 * stale counter row for a department that no longer exists is harmless — it
 * simply skips unused numbers.
 */
async function nextQueueTicket(db: PrismaClient, departmentId: string): Promise<number> {
  // The seed baselines a counter per seeded department (past OUT-001…), so the
  // hot path is a single atomic increment — the SQLite write lock (or the
  // single-row UPDATE on Postgres) serialises concurrent check-ins, so two can
  // never observe the same number. Departments created after seeding lazily
  // get a counter baselined past their existing tickets on first use.
  for (let attempt = 0; attempt < 4; attempt++) {
    const row = await db.queueSequence.findUnique({ where: { departmentId } });
    if (row) {
      const next = await db.queueSequence.update({
        where: { id: row.id },
        data: { value: { increment: 1 } },
        select: { value: true },
      });
      return next.value;
    }
    const max = await db.queueEntry.findFirst({
      where: { departmentId },
      orderBy: { ticket: 'desc' },
      select: { ticket: true },
    });
    // Baseline at the HIGHEST ticket already issued (not max+1): the first
    // increment below hands out max+1, keeping the sequence gapless.
    const high = max ? parseInt(max.ticket.replace(/^[A-Z]+-0*/, ''), 10) || 0 : 0;
    try {
      const created = await db.queueSequence.create({ data: { departmentId, value: Math.max(high, 0) } });
      const next = await db.queueSequence.update({
        where: { id: created.id },
        data: { value: { increment: 1 } },
        select: { value: true },
      });
      return next.value;
    } catch (err) {
      const raced = err instanceof Error && 'code' in err && (err as { code?: string }).code === 'P2002';
      if (!raced) throw err;
      // A concurrent first-caller won the create — retry and take from its row.
    }
  }
  throw httpErrors.internalServerError('Could not allocate a queue ticket');
}

// keep parseJsonArr referenced for future queue analytics
void parseJsonArr;
