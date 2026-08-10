import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { str, optStr, num, dateIso } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import type { Guards } from '../../lib/guards.js';
import { facilityScope } from '../../lib/scope.js';

/**
 * Health-commodity inventory (spec §25, §26). Facility users manage their own
 * stock; regional/district/national users get scoped visibility. Every receipt,
 * issue and adjustment writes a StockMovement row (full audit trail).
 */
export function registerInventoryRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  // ------------------------------------------------------------------ list
  app.get(
    '/inventory/stock',
    { preHandler: guards.requirePermission('manage_stock', 'view_financial', 'view_patient'), schema: { summary: 'Stock list with low-stock flags', tags: ['inventory'] } },
    async (request) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const scope = facilityScope(u);
      const where: Record<string, unknown> = { ...scope, status: 'ACTIVE' };
      if (str(q.category, 'category')) where.category = str(q.category, 'category').toUpperCase();
      const lowOnly = q.low === '1' || q.low === 'true';
      const items = await db.stockItem.findMany({ where, orderBy: { name: 'asc' }, take: 200 });
      const rows = items.map((s) => ({
        ...s,
        low: s.quantity <= s.reorderLevel,
        out: s.quantity === 0,
        expirySoon: s.expiryDate ? s.expiryDate.getTime() - Date.now() < 90 * 24 * 3600 * 1000 : false,
      }));
      return { items: lowOnly ? rows.filter((r) => r.low || r.out) : rows, count: rows.length, lowCount: rows.filter((r) => r.low || r.out).length };
    },
  );

  // ---------------------------------------------------------------- create
  app.post(
    '/inventory/stock',
    { preHandler: guards.requirePermission('manage_stock'), schema: { summary: 'Add a stock item', tags: ['inventory'] } },
    async (request) => {
      const u = request.user!;
      if (!u.facilityId) throw httpErrors.forbidden('Facility-scoped stock management requires a facility');
      const body = (request.body ?? {}) as Record<string, unknown>;
      const name = str(body.name, 'name', { required: true, max: 190 });
      const existing = await db.stockItem.findUnique({ where: { facilityId_name: { facilityId: u.facilityId, name } } });
      if (existing) throw httpErrors.conflict('A stock item with this name already exists');
      const item = await db.stockItem.create({
        data: {
          facilityId: u.facilityId,
          name,
          category: (optStr(body.category) ?? 'MEDICINE').toUpperCase(),
          unit: optStr(body.unit) ?? 'unit',
          quantity: num(body.quantity, 'quantity', { min: 0 }) ?? 0,
          minStock: num(body.minStock, 'minStock', { min: 0 }) ?? 10,
          maxStock: num(body.maxStock, 'maxStock', { min: 0 }) ?? 500,
          reorderLevel: num(body.reorderLevel, 'reorderLevel', { min: 0 }) ?? 20,
          batch: optStr(body.batch),
          expiryDate: dateIso(body.expiryDate, 'expiryDate'),
          location: optStr(body.location),
        },
      });
      recordAudit(db, request, { action: 'stock.create', entityType: 'stockItem', entityId: item.id, after: { name, quantity: item.quantity } });
      return { item };
    },
  );

  // ---------------------------------------------------- receive / adjust
  app.post(
    '/inventory/stock/:id/receive',
    { preHandler: guards.requirePermission('manage_stock'), schema: { summary: 'Receive stock (increases quantity)', tags: ['inventory'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const item = await db.stockItem.findFirst({ where: { id: params.id, ...facilityScope(u) } });
      if (!item) throw httpErrors.notFound('Stock item not found in scope');
      const qty = num(body.quantity, 'quantity', { required: true, min: 1 })!;
      const balance = item.quantity + qty;
      await db.$transaction([
        db.stockItem.update({ where: { id: item.id }, data: { quantity: balance } }),
        db.stockMovement.create({
          data: {
            stockItemId: item.id,
            facilityId: item.facilityId,
            type: 'RECEIPT',
            quantity: qty,
            balanceAfter: balance,
            note: optStr(body.note),
            performedById: u.id,
          },
        }),
      ]);
      recordAudit(db, request, { action: 'stock.receive', entityType: 'stockItem', entityId: item.id, after: { qty, balance } });
      return { item: { ...item, quantity: balance } };
    },
  );

  app.post(
    '/inventory/stock/:id/adjust',
    { preHandler: guards.requirePermission('manage_stock'), schema: { summary: 'Adjust stock level (issue/return/wastage)', tags: ['inventory'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const item = await db.stockItem.findFirst({ where: { id: params.id, ...facilityScope(u) } });
      if (!item) throw httpErrors.notFound('Stock item not found in scope');
      const delta = num(body.delta, 'delta', { required: true })!;
      if (delta === 0) throw httpErrors.badRequest('Delta must be non-zero');
      const balance = item.quantity + delta;
      if (balance < 0) throw httpErrors.badRequest('Insufficient stock — balance would be negative');
      const type = (optStr(body.type) ?? (delta < 0 ? 'ISSUE' : 'ADJUSTMENT')).toUpperCase();
      if (!['ISSUE', 'ADJUSTMENT', 'RETURN', 'WASTAGE'].includes(type)) throw httpErrors.badRequest('Invalid movement type');
      await db.$transaction([
        db.stockItem.update({ where: { id: item.id }, data: { quantity: balance } }),
        db.stockMovement.create({
          data: {
            stockItemId: item.id,
            facilityId: item.facilityId,
            type,
            quantity: delta,
            balanceAfter: balance,
            note: optStr(body.note),
            performedById: u.id,
          },
        }),
      ]);
      recordAudit(db, request, { action: 'stock.adjust', entityType: 'stockItem', entityId: item.id, after: { type, delta, balance } });
      return { item: { ...item, quantity: balance } };
    },
  );

  // ---------------------------------------------------------- movements
  app.get(
    '/inventory/stock/:id/movements',
    { preHandler: guards.requirePermission('manage_stock', 'view_financial'), schema: { summary: 'Movement history for a stock item', tags: ['inventory'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const item = await db.stockItem.findFirst({ where: { id: params.id, ...facilityScope(u) } });
      if (!item) throw httpErrors.notFound('Stock item not found in scope');
      const movements = await db.stockMovement.findMany({
        where: { stockItemId: item.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { facility: { select: { name: true } } },
      });
      return { item: { id: item.id, name: item.name }, movements };
    },
  );
}
