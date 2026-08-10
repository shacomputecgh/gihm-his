import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { str, optStr } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import type { Guards } from '../../lib/guards.js';

export function registerAdminRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  // --------------------------------------------------------------- devices
  app.post(
    '/devices/register',
    { preHandler: guards.requireAuth, schema: { summary: 'Register a client device (offline-first)', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const body = (request.body ?? {}) as Record<string, unknown>;
      const deviceId = str(body.deviceId, 'deviceId', { required: true, max: 190 });
      const existing = await db.device.findUnique({ where: { deviceId } });
      if (existing) {
        await db.device.update({
          where: { id: existing.id },
          data: { lastSeenAt: new Date(), softwareVersion: optStr(body.softwareVersion), facilityId: u.facilityId ?? existing.facilityId },
        });
        return { device: existing, registered: false };
      }
      const device = await db.device.create({
        data: {
          deviceId,
          name: optStr(body.name) ?? 'Unnamed device',
          platform: (optStr(body.platform) ?? 'WEB').toUpperCase(),
          softwareVersion: optStr(body.softwareVersion),
          facilityId: u.facilityId ?? undefined,
          assignedUserId: u.id,
          status: 'ACTIVE',
          lastSeenAt: new Date(),
        },
      });
      recordAudit(db, request, { action: 'device.register', entityType: 'device', entityId: device.id });
      return { device, registered: true };
    },
  );

  app.get(
    '/devices',
    { preHandler: guards.requirePermission('manage_devices', 'sync_data'), schema: { summary: 'List devices', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const devices = await db.device.findMany({
        where: u.scope === 'FACILITY' ? { facilityId: u.facilityId ?? undefined } : {},
        orderBy: { lastSeenAt: 'desc' },
        take: 100,
      });
      return { devices };
    },
  );

  app.post(
    '/admin/devices/:deviceId/status',
    { preHandler: guards.requirePermission('manage_devices'), schema: { summary: 'Block/suspend/retire a device', tags: ['admin'] } },
    async (request) => {
      const params = request.params as { deviceId: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const status = str(body.status, 'status', { required: true }).toUpperCase();
      if (!['ACTIVE', 'LOST', 'STOLEN', 'SUSPENDED', 'RETIRED', 'BLOCKED'].includes(status)) {
        throw httpErrors.badRequest('Invalid device status');
      }
      const device = await db.device.update({ where: { deviceId: params.deviceId }, data: { status } });
      recordAudit(db, request, { action: 'device.status', entityType: 'device', entityId: device.id, after: { status } });
      return { device };
    },
  );

  // ------------------------------------------------------------------ audit
  app.get(
    '/admin/audit',
    { preHandler: guards.requirePermission('view_audit'), schema: { summary: 'Recent audit log entries', tags: ['admin'] } },
    async (request) => {
      const q = request.query as Record<string, unknown>;
      const take = Math.min(200, Math.max(1, Number(q.take) || 50));
      const entries = await db.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take });
      return { entries };
    },
  );
}
