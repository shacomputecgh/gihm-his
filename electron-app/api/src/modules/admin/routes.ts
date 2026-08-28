import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { str, optStr } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import { toCsv } from '../../lib/csv.js';
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
        return { device: existing, registered: false, pendingApproval: existing.status === 'PENDING' };
      }
      // New devices self-register as PENDING — an administrator must approve
      // (enroll) them before they can sync (docs/21 §1, spec §109).
      const device = await db.device.create({
        data: {
          deviceId,
          name: optStr(body.name) ?? 'Unnamed device',
          platform: (optStr(body.platform) ?? 'WEB').toUpperCase(),
          softwareVersion: optStr(body.softwareVersion),
          facilityId: u.facilityId ?? undefined,
          assignedUserId: u.id,
          status: 'PENDING',
          lastSeenAt: new Date(),
        },
      });
      recordAudit(db, request, { action: 'device.register', entityType: 'device', entityId: device.id, after: { status: 'PENDING' } });
      return { device, registered: true, pendingApproval: true };
    },
  );

  app.get(
    '/devices',
    { preHandler: guards.requirePermission('manage_devices', 'sync_data'), schema: { summary: 'List devices', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const devices = await db.device.findMany({
        where: u.scope === 'FACILITY' ? { facilityId: u.facilityId ?? undefined } : {},
        orderBy: [{ status: 'asc' }, { lastSeenAt: 'desc' }],
        take: 100,
      });
      return { devices };
    },
  );

  app.post(
    '/admin/devices/:deviceId/status',
    { preHandler: guards.requirePermission('manage_devices'), schema: { summary: 'Enroll / suspend / block / retire a device', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { deviceId: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const status = str(body.status, 'status', { required: true }).toUpperCase();
      if (!['PENDING', 'ACTIVE', 'LOST', 'STOLEN', 'SUSPENDED', 'RETIRED', 'BLOCKED'].includes(status)) {
        throw httpErrors.badRequest('Invalid device status');
      }
      const existing = await db.device.findUnique({ where: { deviceId: params.deviceId } });
      if (!existing) throw httpErrors.notFound('Device not found');
      const reason = optStr(body.reason);
      const data: Record<string, unknown> = { status };
      if (status === 'ACTIVE') {
        // Approving (PENDING → ACTIVE) records who enrolled the device; the
        // block reason is cleared so the table doesn't show stale reasons.
        if (existing.status === 'PENDING' || !existing.enrolledAt) {
          data.enrolledAt = new Date();
          data.enrolledById = u.id;
        }
        data.blockReason = null;
      } else {
        // Any non-ACTIVE transition records the admin's reason (optional).
        if (reason !== undefined) data.blockReason = reason;
      }
      const device = await db.device.update({
        where: { id: existing.id },
        data: data as never,
      });
      recordAudit(db, request, {
        action: 'device.status',
        entityType: 'device',
        entityId: device.id,
        before: { status: existing.status },
        after: { status, reason },
      });
      // A device moved away from ACTIVE has its current session revoked — the
      // flag the client uses to force-log out.
      return { device, revoked: existing.status === 'ACTIVE' && status !== 'ACTIVE' };
    },
  );

  // Remote logout (docs/21 §3, spec §97): void the device's current session
  // without de-enrolling it. The device stays ACTIVE (it can be used again
  // after a fresh login) but any cached offline session older than
  // remoteLogoutAt is invalid the moment the device contacts the server.
  app.post(
    '/admin/devices/:deviceId/remote-logout',
    { preHandler: guards.requirePermission('manage_devices'), schema: { summary: 'Remote logout — void a device\'s current session', tags: ['admin'] } },
    async (request) => {
      const params = request.params as { deviceId: string };
      const existing = await db.device.findUnique({ where: { deviceId: params.deviceId } });
      if (!existing) throw httpErrors.notFound('Device not found');
      const remoteLogoutAt = new Date();
      const device = await db.device.update({
        where: { id: existing.id },
        data: { remoteLogoutAt },
      });
      recordAudit(db, request, { action: 'device.remote_logout', entityType: 'device', entityId: device.id, after: { remoteLogoutAt: remoteLogoutAt.toISOString() } });
      return { device, remoteLogoutAt: remoteLogoutAt.toISOString() };
    },
  );

  // ---------------------------------------------------- sync conflicts
  // Conflicts (docs/15 §4, spec §101–103, §166): a targeted offline update
  // arrived with a stale base version. Both versions are preserved; an
  // administrator reviews and resolves — keep server, apply client, or mark
  // reviewed. Clinical information is never silently discarded.
  app.get(
    '/admin/sync/conflicts',
    { preHandler: guards.requirePermission('manage_sync_conflicts'), schema: { summary: 'List sync conflicts awaiting review', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const includeResolved = q.all === 'true';
      const conflicts = await db.syncConflict.findMany({
        where: {
          ...(includeResolved ? {} : { status: 'OPEN' }),
          ...(u.scope === 'FACILITY' ? { facilityId: u.facilityId ?? undefined } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      // Hydrate actor/device names for the review console.
      const userIds = [...new Set(conflicts.map((c) => c.clientUserId).filter((v): v is string => !!v))];
      const deviceIds = [...new Set(conflicts.map((c) => c.deviceId).filter((v): v is string => !!v))];
      const [users, devices] = await Promise.all([
        db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, fullName: true, email: true } }),
        db.device.findMany({ where: { deviceId: { in: deviceIds } }, select: { deviceId: true, name: true } }),
      ]);
      const userById = new Map(users.map((x) => [x.id, x]));
      const deviceByName = new Map(devices.map((x) => [x.deviceId, x]));
      return {
        conflicts: conflicts.map((c) => ({
          id: c.id,
          transactionId: c.transactionId,
          entityType: c.entityType,
          entityId: c.entityId,
          operation: c.operation,
          status: c.status,
          deviceName: c.deviceId ? (deviceByName.get(c.deviceId)?.name ?? c.deviceId) : null,
          clientUser: c.clientUserId ? (userById.get(c.clientUserId)?.fullName ?? null) : null,
          clientEmail: c.clientUserId ? (userById.get(c.clientUserId)?.email ?? null) : null,
          serverVersion: c.serverVersion,
          clientVersion: c.clientVersion,
          resolutionNote: c.resolutionNote,
          resolvedAt: c.resolvedAt,
          createdAt: c.createdAt,
        })),
        open: conflicts.filter((c) => c.status === 'OPEN').length,
      };
    },
  );

  app.post(
    '/admin/sync/conflicts/:id/resolve',
    { preHandler: guards.requirePermission('manage_sync_conflicts'), schema: { summary: 'Resolve a sync conflict (keep server / apply client / mark reviewed)', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const action = str(body.action, 'action', { required: true });
      if (!['keep_server', 'keep_client', 'manual'].includes(action)) throw httpErrors.badRequest('Invalid resolution action');
      const note = optStr(body.note);
      // The audit trail needs a reason for a manual review — the UI enforces
      // this, and so does the API (a note with no write is otherwise empty).
      if (action === 'manual' && !note) throw httpErrors.badRequest('A review note is required for manual resolution');
      const conflict = await db.syncConflict.findUnique({ where: { id: params.id } });
      if (!conflict) throw httpErrors.notFound('Conflict not found');
      if (conflict.status !== 'OPEN') throw httpErrors.conflict('Conflict already resolved');
      if (u.scope === 'FACILITY' && u.facilityId && conflict.facilityId !== u.facilityId) throw httpErrors.forbidden('Conflict is outside your facility');
      // Applying the client version is only meaningful when the server knows
      // how to re-apply it — otherwise the status would claim an apply that
      // never happened. Anything else must go through manual review.
      if (action === 'keep_client' && !(conflict.entityType === 'labOrder' && conflict.operation === 'RESULT')) {
        throw httpErrors.badRequest('Applying the client version is not supported for this entity type — use manual review instead.');
      }
      const resolvedStatus = action === 'keep_server' ? 'RESOLVED_KEEP_SERVER' : action === 'keep_client' ? 'RESOLVED_KEEP_CLIENT' : 'RESOLVED_MANUAL';

      await db.$transaction(async (tx) => {
        if (action === 'keep_client') {
          // Re-apply the preserved client payload to the entity (spec §166 — the
          // change is never lost). If the record vanished, the conflict stays
          // OPEN and the administrator decides manually.
          const p = JSON.parse(conflict.clientVersion) as Record<string, unknown>;
          try {
            await tx.labOrder.update({
              where: { id: conflict.entityId },
              data: {
                result: String(p.result ?? ''),
                critical: Boolean(p.critical),
                referenceRange: typeof p.referenceRange === 'string' ? p.referenceRange : undefined,
                verifiedById: conflict.clientUserId ?? undefined,
                status: 'VERIFIED',
              },
            });
          } catch (err) {
            if (err instanceof Error && (err as { code?: string }).code === 'P2025') {
              throw httpErrors.conflict('The target record no longer exists — resolve manually instead.');
            }
            throw err;
          }
          // The tier adopted the client version: flip the mutation log row from
          // CONFLICT to PROCESSED so a facility/district edge relay (docs/16 §4)
          // propagates the corrected outcome upstream. The losing edit was never
          // pushed, so without this the tiers diverge permanently — the edge
          // shows the reviewed result while every tier above keeps the old one.
          // keep_server / manual leave the row CONFLICT: the edge's own version
          // already won (nothing to propagate) or review decided (no write).
          await tx.mutationLog.updateMany({
            where: { transactionId: conflict.transactionId },
            data: { status: 'PROCESSED', error: null },
          });
        }
        // Atomic claim: only one resolver wins even under concurrency — a plain
        // read-then-update would let two admins resolve with different actions.
        const flipped = await tx.syncConflict.updateMany({
          where: { id: conflict.id, status: 'OPEN' },
          data: {
            status: resolvedStatus,
            resolutionNote: note ?? null,
            resolvedById: u.id,
            resolvedAt: new Date(),
          },
        });
        if (flipped.count !== 1) throw httpErrors.conflict('Conflict already resolved');
      });
      recordAudit(db, request, {
        action: 'sync.conflict.resolve',
        entityType: 'syncConflict',
        entityId: conflict.id,
        before: { status: conflict.status },
        after: { action, status: resolvedStatus, note },
      });
      return { id: conflict.id, status: resolvedStatus };
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

  // ----------------------------------------------- configuration audit
  // Everything that changed system configuration — runtime settings and
  // masterdata (EPI schedule, roles, facilities, geography) — as a readable
  // timeline, with the parsed before/after payloads. Settings secrets are
  // never stored in the trail in the first place (keys/groups only).
  const CONFIG_LABELS: Record<string, string> = {
    'system.settings.update': 'Settings updated',
    'system.settings.test': 'SMS gateway tested',
    'masterdata.epi_schedule.update': 'EPI schedule edited',
    'masterdata.epi_schedule.reset': 'EPI schedule reset to defaults',
    'masterdata.role.update': 'Role edited',
    'masterdata.facility.update': 'Facility edited',
    'masterdata.region.update': 'Region edited',
    'masterdata.district.update': 'District edited',
    'masterdata.unit.create': 'Hospital unit created',
    'masterdata.unit.update': 'Hospital unit edited',
    'masterdata.ward.create': 'Ward created',
    'masterdata.ward.update': 'Ward edited',
    'masterdata.bed.create': 'Bed added',
    'masterdata.equipment.create': 'Equipment added',
    'masterdata.equipment.update': 'Equipment edited',
    'masterdata.equipment.maintenance': 'Maintenance completed',
    'masterdata.equipment.remove': 'Equipment removed',
    'masterdata.staff.create': 'Staff added',
    'masterdata.staff.update': 'Staff edited',
    'masterdata.staff.remove': 'Staff removed',
    'masterdata.staff.link-user': 'Staff login account created',
    'masterdata.staff.unlink-user': 'Staff login account unlinked',
    'masterdata.nss.create': 'National service person posted',
    'masterdata.nss.update': 'National service person edited',
    'masterdata.nss.remove': 'National service person removed',
    'masterdata.role.create': 'Role created',
    'masterdata.role.delete': 'Role deleted',
    'insurance.scheme.create': 'Insurance scheme registered',
    'insurance.scheme.update': 'Insurance scheme edited',
    'insurance.scheme.deactivate': 'Insurance scheme deactivated',
    'surveillance.case.report': 'Disease case reported',
    'surveillance.case.update': 'Disease case updated',
    'surveillance.case.followUp': 'Case follow-up recorded',
  };
  app.get(
    '/admin/audit/config',
    { preHandler: guards.requirePermission('view_audit'), schema: { summary: 'Configuration audit — settings & masterdata changes (filterable, CSV export)', tags: ['admin'] } },
    async (request, reply) => {
      const q = request.query as Record<string, unknown>;
      const take = Math.min(200, Math.max(1, Number(q.take) || 100));
      const where: Record<string, unknown> = {
        OR: [{ action: { startsWith: 'system.settings.' } }, { action: { startsWith: 'masterdata.' } }],
      };
      const entityId = optStr(q.entityId);
      if (entityId) where.entityId = entityId;
      const action = optStr(q.action);
      if (action) where.action = { startsWith: action };
      const actor = optStr(q.actor);
      if (actor) where.actorEmail = { contains: actor };
      const rows = await db.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, take });
      const parse = (s: string | null): Record<string, unknown> => {
        try {
          return JSON.parse(s ?? '{}') as Record<string, unknown>;
        } catch {
          return {};
        }
      };
      const entries = rows.map((r) => {
        const after = parse(r.after);
        const summary =
          typeof after.changes === 'string'
            ? after.changes
            : Array.isArray(after.changes)
              ? (after.changes as unknown[]).join(' · ')
              : Array.isArray(after.keys)
                ? (after.keys as unknown[]).join(', ')
                : Array.isArray(after.items)
                  ? `${(after.items as unknown[]).length} item(s)`
                  : typeof after.note === 'string'
                    ? after.note
                    : (CONFIG_LABELS[r.action] ?? r.action);
        return {
          id: r.id,
          at: r.createdAt.toISOString(),
          actorEmail: r.actorEmail ?? null,
          role: r.role ?? null,
          action: r.action,
          label: CONFIG_LABELS[r.action] ?? r.action,
          entityType: r.entityType ?? null,
          entityId: r.entityId ?? null,
          ip: r.ip ?? null,
          summary,
          after,
        };
      });
      if (optStr(q.format) === 'csv') {
        const csv = toCsv(
          ['When', 'Actor', 'Role', 'Change', 'Summary', 'Entity type', 'Entity id', 'IP'],
          entries.map((e) => [e.at, e.actorEmail ?? '', e.role ?? '', e.label, e.summary, e.entityType ?? '', e.entityId ?? '', e.ip ?? '']),
        );
        reply.header('Content-Type', 'text/csv; charset=utf-8');
        reply.header('Content-Disposition', 'attachment; filename="config-audit.csv"');
        return reply.send(csv);
      }
      return { entries };
    },
  );
}
