import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { str, optStr, num } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import type { Guards } from '../../lib/guards.js';
import { dashboardScope } from '../../lib/scope.js';

const PATIENT_SELECT = {
  select: { id: true, mrn: true, fullName: true, phone: true, dateOfBirth: true },
} as const;

/**
 * Clinical worklists (spec §25 pharmacy, §23 laboratory). Each list is scoped
 * to the caller's role: facility users see their facility only, regional users
 * their region, district users their district, national users everything.
 */
export function registerClinicalRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  // ---------------------------------------------------------------- pharmacy
  app.get(
    '/pharmacy/prescriptions',
    { preHandler: guards.requirePermission('dispense', 'view_patient'), schema: { summary: 'Pharmacy worklist — pending prescriptions', tags: ['pharmacy'] } },
    async (request) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const status = optStr(q.status) ?? 'ACTIVE';
      const scope = dashboardScope(u);
      const where: Record<string, unknown> = {
        ...scope,
        status: { in: status === 'ALL' ? ['ACTIVE', 'PARTIAL', 'DISPENSED'] : ['ACTIVE', 'PARTIAL'] },
      };
      const items = await db.prescription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { patient: PATIENT_SELECT },
      });
      return { items, count: items.length };
    },
  );

  app.post(
    '/pharmacy/prescriptions/:rxId/dispense',
    { preHandler: guards.requirePermission('dispense'), schema: { summary: 'Dispense a prescription from the pharmacy worklist', tags: ['pharmacy'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { rxId: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const rx = await db.prescription.findFirst({
        where: { id: params.rxId, ...dashboardScope(u) },
        include: { patient: { select: { id: true } } },
      });
      if (!rx) throw httpErrors.notFound('Prescription not found in scope');
      if (rx.status === 'DISPENSED') throw httpErrors.conflict('Prescription already fully dispensed');
      const qty = num(body.quantity, 'quantity', { min: 1 }) ?? rx.quantity ?? 1;
      const dispensedQty = (rx.dispensedQty ?? 0) + qty;
      const status = dispensedQty >= (rx.quantity ?? 0) ? 'DISPENSED' : 'PARTIAL';
      // Decrement stock if a matching stock item exists (spec §25).
      const stockNote = await decrementStock(db, u.facilityId, rx.medicine, qty, u.id, `Dispense ${rx.id.slice(0, 8)}`);
      const updated = await db.prescription.update({
        where: { id: rx.id },
        data: { dispensedQty, status, dispensedById: u.id },
      });
      recordAudit(db, request, { action: 'prescription.dispense', entityType: 'prescription', entityId: rx.id, after: { dispensedQty, status, stock: stockNote } });
      return { prescription: updated, stock: stockNote };
    },
  );

  // -------------------------------------------------------------- laboratory
  app.get(
    '/lab/orders',
    { preHandler: guards.requirePermission('order_lab', 'verify_lab'), schema: { summary: 'Laboratory worklist — pending test orders', tags: ['laboratory'] } },
    async (request) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const status = optStr(q.status) ?? 'ORDERED';
      const discipline = optStr(q.discipline);
      const scope = dashboardScope(u);
      const where: Record<string, unknown> = {
        ...scope,
        status: { in: status === 'ALL' ? ['ORDERED', 'COLLECTED', 'RESULTED', 'VERIFIED'] : ['ORDERED', 'COLLECTED'] },
      };
      if (discipline) where.discipline = discipline;
      const items = await db.labOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { patient: PATIENT_SELECT },
      });
      return { items, count: items.length };
    },
  );

  app.post(
    '/lab/orders/:orderId/result',
    { preHandler: guards.requirePermission('verify_lab'), schema: { summary: 'Enter + verify a lab result from the worklist', tags: ['laboratory'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { orderId: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const order = await db.labOrder.findFirst({
        where: { id: params.orderId, ...dashboardScope(u) },
        include: { patient: { select: { id: true } } },
      });
      if (!order) throw httpErrors.notFound('Lab order not found in scope');
      const result = str(body.result, 'result', { required: true, max: 2000 });
      const critical = Boolean(body.critical);
      const updated = await db.labOrder.update({
        where: { id: order.id },
        data: {
          result,
          critical,
          referenceRange: optStr(body.referenceRange),
          resultNote: optStr(body.resultNote),
          verifiedById: u.id,
          status: 'VERIFIED',
        },
      });
      recordAudit(db, request, { action: 'labOrder.verify', entityType: 'labOrder', entityId: order.id, after: { result, critical } });
      return { order: updated };
    },
  );
}

/**
 * Decrements stock for a dispensed medicine when a matching stock item exists
 * (fuzzy name match). Records an ISSUE movement. Never blocks dispensing when
 * stock is missing or insufficient — pharmacy can still dispense; the flag
 * surfaces the imbalance. Returns a summary for the audit trail.
 */
async function decrementStock(
  db: PrismaClient,
  facilityId: string | null | undefined,
  medicine: string,
  qty: number,
  userId: string,
  note: string,
): Promise<{ matched: boolean; low: boolean; remaining: number | null; name: string | null }> {
  if (!facilityId) return { matched: false, low: false, remaining: null, name: null };
  const needle = medicine.trim().toLowerCase().split(' ')[0] ?? '';
  if (!needle) return { matched: false, low: false, remaining: null, name: null };

  // SQLite has no case-insensitive contains in Prisma, so match in JS.
  const candidates = await db.stockItem.findMany({ where: { facilityId, status: 'ACTIVE' }, take: 200 });
  const item = candidates.find((s) => s.name.toLowerCase().includes(needle))
    ?? candidates.find((s) => needle.includes(s.name.toLowerCase().split(' ')[0] ?? ''));
  if (!item) return { matched: false, low: false, remaining: null, name: null };

  const decrement = Math.min(qty, item.quantity);
  // Atomic conditional decrement — guards against concurrent dispenses racing
  // on the same stock item (lost update / oversell). If the stock changed under
  // us, count is 0 and we skip the movement without blocking dispensing.
  const res = await db.stockItem.updateMany({ where: { id: item.id, quantity: { gte: decrement } }, data: { quantity: { decrement } } });
  if (res.count === 0) return { matched: true, low: true, remaining: item.quantity, name: item.name };
  const balance = item.quantity - decrement;
  await db.stockMovement.create({
    data: {
      stockItemId: item.id,
      facilityId: item.facilityId,
      type: 'ISSUE',
      quantity: -decrement,
      balanceAfter: balance,
      note,
      performedById: userId,
    },
  });
  return { matched: true, low: balance <= item.reorderLevel, remaining: balance, name: item.name };
}
