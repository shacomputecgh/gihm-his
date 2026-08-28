import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { httpErrors } from '../../lib/http.js';
import { str, optStr, num } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import { toCsv } from '../../lib/csv.js';
import { SETTING_DEFS, clearSetting, getSetting, setSetting, settingSource } from '../../lib/settings.js';
import { licenseStatus, assertUserCapacity } from '../../lib/license.js';
import { deliveryStats, deliveryTrend, dispatchSecurityAlert, pruneAlertDeliveries, resolveAlertDeliveryCallback, runAlertRetentionSweep, runAlertRetrySweep, runLicenseExpiryCheck, sendTestAlert, sendTestEscalation, sendTestWhatsApp } from '../../lib/alert.js';
import { passwordMinLength } from './users.js';
import { sessionTtlHours } from '../auth/routes.js';
import { toAuthUser } from '../../types.js';
import type { Guards } from '../../lib/guards.js';

const USER_STATUSES = ['ACTIVE', 'SUSPENDED', 'LOCKED'];
const DEVICE_STATUSES = ['ACTIVE', 'LOST', 'STOLEN', 'SUSPENDED', 'RETIRED', 'BLOCKED'];

export function registerDeveloperRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  // -------------------------------------------------------------- overview
  app.get(
    '/admin/developer/overview',
    { preHandler: guards.requirePermission('developer_mode'), schema: { summary: 'Developer overview — license, counts, security posture', tags: ['developer'] } },
    async (request) => {
      const [license, userCount, facilityCount, deviceCount, auditToday, activeSessions, deliveries, trend] = await Promise.all([
        licenseStatus(db),
        db.user.count(),
        db.facility.count(),
        db.device.count(),
        db.auditLog.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) } } }),
        db.user.count({ where: { lastLoginAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) } } }),
        deliveryStats(db),
        deliveryTrend(db, 14),
      ]);
      recordAudit(db, request, { action: 'developer.overview', entityType: 'system' });
      return {
        license,
        counts: { users: userCount, facilities: facilityCount, devices: deviceCount, auditToday, activeSessions },
        security: {
          passwordMinLength: passwordMinLength(),
          lockoutThreshold: Number(getSetting('security.lockoutThreshold') ?? 5),
          sessionTtlHours: Number(getSetting('security.sessionTtlHours') ?? 12),
        },
        runtime: { node: process.version, platform: process.platform, nodeEnv: process.env.NODE_ENV ?? 'development' },
        settings: {
          alertPhone: getSetting('security.alertPhone') ?? '',
          alertWhatsApp: getSetting('security.alertWhatsApp') ?? '',
          alertEmail: getSetting('security.alertEmail') ?? '',
          escalationEmail: getSetting('security.escalationEmail') ?? '',
          alertWebhook: getSetting('security.alertWebhook') ?? '',
          retentionDays: Number(getSetting('audit.retentionDays') ?? 365),
          alertRetentionDays: Number(getSetting('alerts.retentionDays') ?? 365),
          emailMinSeverity: getSetting('alerts.emailMinSeverity') ?? 'info',
          retryMaxAttempts: Number(getSetting('alerts.retryMaxAttempts') ?? 4),
          alertDaysBefore: Number(getSetting('license.alertDaysBefore') ?? 14),
        },
        deliveryStats: deliveries,
        deliveryTrend: trend,
      };
    },
  );

  // ----------------------------------------------------------------- users
  app.get(
    '/admin/developer/users',
    { preHandler: guards.requirePermission('developer_mode'), schema: { summary: 'All accounts including admins, with raw role data', tags: ['developer'] } },
    async () => {
      const users = await db.user.findMany({
        include: { role: { select: { code: true, name: true, scope: true, permissions: true } }, facility: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
        take: 1000,
      });
      return {
        users: users.map((x) => ({
          id: x.id,
          email: x.email,
          fullName: x.fullName,
          status: x.status,
          roleCode: x.role.code,
          roleName: x.role.name,
          roleScope: x.role.scope,
          permissions: JSON.parse(x.role.permissions) as string[],
          facility: x.facility ? { id: x.facility.id, name: x.facility.name } : null,
          regionId: x.regionId,
          districtId: x.districtId,
          lastLoginAt: x.lastLoginAt,
          createdAt: x.createdAt,
        })),
      };
    },
  );

  app.post(
    '/admin/developer/users',
    { preHandler: guards.requirePermission('developer_mode'), schema: { summary: 'Create any account (including DEVELOPER / admins)', tags: ['developer'] } },
    async (request) => {
      await assertUserCapacity(db);
      const body = (request.body ?? {}) as Record<string, unknown>;
      const email = str(body.email, 'email', { required: true, max: 190 }).toLowerCase();
      const fullName = str(body.fullName, 'fullName', { required: true, max: 190 });
      const roleCode = str(body.roleCode, 'roleCode', { required: true, max: 60 });
      const role = await db.role.findUnique({ where: { code: roleCode } });
      if (!role) throw httpErrors.notFound(`Role ${roleCode} not found`);
      const password = str(body.password, 'password', { required: true, max: 200 });
      const min = passwordMinLength();
      if (password.length < min) throw httpErrors.badRequest(`Password must be at least ${min} characters`);
      if (await db.user.findUnique({ where: { email } })) throw httpErrors.conflict('An account with this email already exists');
      const user = await db.user.create({
        data: {
          email,
          passwordHash: await bcrypt.hash(password, 10),
          fullName,
          roleId: role.id,
          facilityId: optStr(body.facilityId) ?? null,
          regionId: optStr(body.regionId) ?? null,
          districtId: optStr(body.districtId) ?? null,
          status: 'ACTIVE',
          isSynthetic: true,
        },
      });
      recordAudit(db, request, { action: 'developer.user.create', entityType: 'user', entityId: user.id, after: { email, roleCode } });
      return { user: { id: user.id, email: user.email, fullName: user.fullName, roleCode } };
    },
  );

  app.put(
    '/admin/developer/users/:id',
    { preHandler: guards.requirePermission('developer_mode'), schema: { summary: 'Edit any account (status, role, scope bindings)', tags: ['developer'] } },
    async (request) => {
      const { id } = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const user = await db.user.findUnique({ where: { id }, include: { role: true } });
      if (!user) throw httpErrors.notFound('User not found');
      const data: Record<string, unknown> = {};
      const notes: string[] = [];
      const fullName = optStr(body.fullName);
      if (fullName !== undefined) { data.fullName = fullName; notes.push(`name → ${fullName}`); }
      const status = optStr(body.status);
      if (status !== undefined) {
        if (!USER_STATUSES.includes(status)) throw httpErrors.badRequest(`Invalid status: ${status}`);
        data.status = status; notes.push(`status → ${status}`);
      }
      const roleCode = optStr(body.roleCode);
      if (roleCode !== undefined) {
        const role = await db.role.findUnique({ where: { code: roleCode } });
        if (!role) throw httpErrors.notFound(`Role ${roleCode} not found`);
        data.roleId = role.id; notes.push(`role → ${roleCode}`);
      }
      const facilityId = body.facilityId === null || body.facilityId === undefined ? undefined : optStr(body.facilityId);
      if (facilityId !== undefined) { data.facilityId = facilityId === '' ? null : facilityId; notes.push('facility updated'); }
      const regionId = body.regionId === null || body.regionId === undefined ? undefined : optStr(body.regionId);
      if (regionId !== undefined) { data.regionId = regionId === '' ? null : regionId; notes.push('region updated'); }
      const districtId = body.districtId === null || body.districtId === undefined ? undefined : optStr(body.districtId);
      if (districtId !== undefined) { data.districtId = districtId === '' ? null : districtId; notes.push('district updated'); }
      if (Object.keys(data).length === 0) throw httpErrors.badRequest('Nothing to update');
      const updated = await db.user.update({ where: { id }, data });
      recordAudit(db, request, { action: 'developer.user.update', entityType: 'user', entityId: id, after: { email: updated.email, changes: notes } });
      return { user: { id: updated.id, email: updated.email, changes: notes } };
    },
  );

  app.post(
    '/admin/developer/users/:id/password',
    { preHandler: guards.requirePermission('developer_mode'), schema: { summary: 'Set any account password (policy enforced)', tags: ['developer'] } },
    async (request) => {
      const { id } = request.params as { id: string };
      const password = str((request.body as Record<string, unknown> | undefined)?.password ?? '', 'password', { required: true, max: 200 });
      const min = passwordMinLength();
      if (password.length < min) throw httpErrors.badRequest(`Password must be at least ${min} characters`);
      const user = await db.user.update({ where: { id }, data: { passwordHash: await bcrypt.hash(password, 10), status: 'ACTIVE' } });
      recordAudit(db, request, { action: 'developer.user.password', entityType: 'user', entityId: id, after: { email: user.email } });
      return { ok: true, email: user.email };
    },
  );

  // ----------------------------------------------------------- impersonate
  app.post(
    '/admin/developer/users/:id/impersonate',
    { preHandler: guards.requirePermission('developer_mode'), schema: { summary: 'Issue a session token as another user (login as)', tags: ['developer'] } },
    async (request) => {
      const u = request.user!;
      const { id } = request.params as { id: string };
      const user = await db.user.findUnique({ where: { id }, include: { role: true, region: { select: { name: true } }, district: { select: { name: true } }, facility: { select: { name: true } } } });
      if (!user) throw httpErrors.notFound('User not found');
      if (user.status !== 'ACTIVE') throw httpErrors.conflict('Cannot impersonate a non-active account');
      const token = request.server.jwt.sign({ sub: user.id, tv: user.tokenVersion }, { expiresIn: `${sessionTtlHours()}h` });
      recordAudit(db, request, { action: 'developer.impersonate', entityType: 'user', entityId: id, after: { target: user.email, impersonator: u.email } });
      return { token, user: toAuthUser(user) };
    },
  );

  // ------------------------------------------------------------- full audit
  app.get(
    '/admin/developer/audit',
    { preHandler: guards.requirePermission('developer_mode'), schema: { summary: 'Full audit trail with filters and CSV export', tags: ['developer'] } },
    async (request, reply) => {
      const q = request.query as Record<string, unknown>;
      const take = Math.min(1000, Math.max(1, Number(q.take) || 200));
      const where: Record<string, unknown> = {};
      const action = optStr(q.action);
      if (action) where.action = { contains: action };
      const actor = optStr(q.actor);
      if (actor) where.actorEmail = { contains: actor };
      const entityType = optStr(q.entityType);
      if (entityType) where.entityType = entityType;
      const entityId = optStr(q.entityId);
      if (entityId) where.entityId = entityId;
      const from = optStr(q.from);
      const to = optStr(q.to);
      if (from || to) {
        const range: Record<string, Date> = {};
        if (from) range.gte = new Date(from);
        if (to) {
          // Date-only values (YYYY-MM-DD from the date input) mean "the whole
          // day" — pin the bound to 23:59:59.999 so entries later that day are
          // included. Full timestamps pass through unchanged.
          const toDate = new Date(to);
          if (/^\d{4}-\d{2}-\d{2}$/.test(to) && !Number.isNaN(toDate.getTime())) {
            toDate.setUTCHours(23, 59, 59, 999);
          }
          range.lte = toDate;
        }
        where.createdAt = range;
      }
      const entries = await db.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, take });
      recordAudit(db, request, { action: 'developer.audit.view', entityType: 'system', after: { filters: { action, actor }, count: entries.length, csv: optStr(q.format) === 'csv' } });
      if (optStr(q.format) === 'csv') {
        const csv = toCsv(
          ['When', 'Actor', 'Role', 'Action', 'Entity type', 'Entity id', 'Facility id', 'IP'],
          entries.map((e) => [e.createdAt.toISOString(), e.actorEmail ?? '', e.role ?? '', e.action, e.entityType ?? '', e.entityId ?? '', e.facilityId ?? '', e.ip ?? '']),
        );
        reply.header('Content-Type', 'text/csv; charset=utf-8');
        reply.header('Content-Disposition', 'attachment; filename="developer-audit.csv"');
        return reply.send(csv);
      }
      return { entries };
    },
  );

  // --------------------------------------------------------------- lockouts
  app.get(
    '/admin/developer/lockouts',
    { preHandler: guards.requirePermission('developer_mode'), schema: { summary: 'Locked accounts and recent lockout events', tags: ['developer'] } },
    async (request) => {
      const now = new Date();
      const [lockedUsers, recentEvents] = await Promise.all([
        db.user.findMany({
          where: { OR: [{ status: 'LOCKED' }, { lockedUntil: { gt: now } }] },
          include: { role: { select: { code: true, name: true } } },
          orderBy: { updatedAt: 'desc' },
          take: 100,
        }),
        db.auditLog.findMany({ where: { action: 'auth.lockout' }, orderBy: { createdAt: 'desc' }, take: 50 }),
      ]);
      recordAudit(db, request, { action: 'developer.lockouts.view', entityType: 'system', after: { locked: lockedUsers.length } });
      return {
        locked: lockedUsers.map((u) => ({
          id: u.id,
          email: u.email,
          fullName: u.fullName,
          status: u.status,
          roleCode: u.role.code,
          roleName: u.role.name,
          failedLoginAttempts: u.failedLoginAttempts,
          lockedUntil: u.lockedUntil,
          lastLoginAt: u.lastLoginAt,
        })),
        recentEvents: recentEvents.map((e) => {
          let after: Record<string, unknown> = {};
          try {
            after = JSON.parse(e.after ?? '{}') as Record<string, unknown>;
          } catch {
            /* ignore */
          }
          return {
            id: e.id,
            at: e.createdAt,
            email: (after.email as string | undefined) ?? null, // locked account (unauthenticated attempt → no actor)
            actorEmail: e.actorEmail ?? null,
            entityId: e.entityId ?? null,
            ip: e.ip ?? null,
            attempts: (after.attempts as number | undefined) ?? null,
          };
        }),
      };
    },
  );

  app.post(
    '/admin/developer/users/:id/unlock',
    { preHandler: guards.requirePermission('developer_mode'), schema: { summary: 'Unlock a locked account (manual or threshold lock)', tags: ['developer'] } },
    async (request) => {
      const u = request.user!;
      const { id } = request.params as { id: string };
      const user = await db.user.findUnique({ where: { id } });
      if (!user) throw httpErrors.notFound('User not found');
      // Only actual locks — suspensions stay handled by the status editor.
      if (user.status !== 'LOCKED') throw httpErrors.conflict('Account is not locked — use the status editor for suspensions');
      const updated = await db.user.update({ where: { id }, data: { status: 'ACTIVE', lockedUntil: null, failedLoginAttempts: 0 } });
      recordAudit(db, request, { action: 'developer.user.unlock', entityType: 'user', entityId: id, after: { email: updated.email, wasThresholdLock: user.lockedUntil !== null, attempts: user.failedLoginAttempts } });
      return { ok: true, user: { id: updated.id, email: updated.email, status: updated.status } };
    },
  );

  // ---------------------------------------------------------------- devices
  app.get(
    '/admin/developer/devices',
    { preHandler: guards.requirePermission('developer_mode'), schema: { summary: 'All registered devices', tags: ['developer'] } },
    async () => ({ devices: await db.device.findMany({ orderBy: { lastSeenAt: 'desc' }, take: 500 }) }),
  );

  app.post(
    '/admin/developer/devices/:deviceId/status',
    { preHandler: guards.requirePermission('developer_mode'), schema: { summary: 'Block / retire any device', tags: ['developer'] } },
    async (request) => {
      const { deviceId } = request.params as { deviceId: string };
      const status = str((request.body as Record<string, unknown> | undefined)?.status ?? '', 'status', { required: true }).toUpperCase();
      if (!DEVICE_STATUSES.includes(status)) throw httpErrors.badRequest(`Invalid device status: ${status}`);
      const device = await db.device.update({ where: { deviceId }, data: { status } });
      recordAudit(db, request, { action: 'developer.device.status', entityType: 'device', entityId: device.id, after: { deviceId, status } });
      return { device };
    },
  );

  // --------------------------------------------------------------- security
  app.get(
    '/admin/developer/security',
    { preHandler: guards.requirePermission('developer_mode'), schema: { summary: 'Security policy settings', tags: ['developer'] } },
    async () => ({
      security: {
        passwordMinLength: { value: passwordMinLength(), source: settingSource('security.passwordMinLength') },
        lockoutThreshold: { value: Number(getSetting('security.lockoutThreshold') ?? 5), source: settingSource('security.lockoutThreshold') },
        sessionTtlHours: { value: Number(getSetting('security.sessionTtlHours') ?? 12), source: settingSource('security.sessionTtlHours') },
      },
    }),
  );

  app.put(
    '/admin/developer/security',
    { preHandler: guards.requirePermission('developer_mode'), schema: { summary: 'Update security policy (password length, lockout, session TTL)', tags: ['developer'] } },
    async (request) => {
      const u = request.user!;
      const body = (request.body ?? {}) as Record<string, unknown>;
      const changed: string[] = [];
      const clamp = (key: string, min: number, max: number, dflt: number): number => {
        if (body[key] === undefined) return Number(getSetting(`security.${key}`) ?? dflt);
        const v = num(body[key], key, { required: true }) ?? dflt;
        if (v < min || v > max) throw httpErrors.badRequest(`${key} must be between ${min} and ${max}`);
        return v;
      };
      const minLen = Math.round(clamp('passwordMinLength', 4, 64, 8));
      const lockout = Math.round(clamp('lockoutThreshold', 1, 20, 5));
      const ttl = Math.round(clamp('sessionTtlHours', 1, 720, 12));
      await setSetting(db, 'security.passwordMinLength', String(minLen), u.id); changed.push('passwordMinLength');
      await setSetting(db, 'security.lockoutThreshold', String(lockout), u.id); changed.push('lockoutThreshold');
      await setSetting(db, 'security.sessionTtlHours', String(ttl), u.id); changed.push('sessionTtlHours');
      recordAudit(db, request, { action: 'developer.security.update', entityType: 'system', after: { changed } });
      return { ok: true, security: { passwordMinLength: minLen, lockoutThreshold: lockout, sessionTtlHours: ttl } };
    },
  );

  // ----------------------------------------------------------- session revoke
  app.post(
    '/admin/developer/users/:id/revoke-sessions',
    { preHandler: guards.requirePermission('developer_mode'), schema: { summary: 'Revoke all sessions for a user (bump tokenVersion)', tags: ['developer'] } },
    async (request) => {
      const { id } = request.params as { id: string };
      const user = await db.user.findUnique({ where: { id } });
      if (!user) throw httpErrors.notFound('User not found');
      const updated = await db.user.update({ where: { id }, data: { tokenVersion: { increment: 1 } } });
      recordAudit(db, request, { action: 'developer.user.revoke-sessions', entityType: 'user', entityId: id, after: { email: user.email, tokenVersion: updated.tokenVersion } });
      return { ok: true, email: user.email, tokenVersion: updated.tokenVersion };
    },
  );

  app.post(
    '/admin/developer/users/revoke-all',
    { preHandler: guards.requirePermission('developer_mode'), schema: { summary: 'Revoke every session in the system — all users must re-login', tags: ['developer'] } },
    async (request) => {
      const result = await db.user.updateMany({ data: { tokenVersion: { increment: 1 } } });
      recordAudit(db, request, { action: 'developer.user.revoke-all', entityType: 'system', after: { count: result.count } });
      return { ok: true, affected: result.count };
    },
  );

  // ----------------------------------------------------------- audit prune
  app.post(
    '/admin/developer/audit/prune',
    { preHandler: guards.requirePermission('developer_mode'), schema: { summary: 'Delete audit entries older than audit.retentionDays (default 365)', tags: ['developer'] } },
    async (request) => {
      const days = Math.max(7, Number(getSetting('audit.retentionDays') ?? 365));
      const cutoff = new Date(Date.now() - days * 24 * 3600 * 1000);
      const result = await db.auditLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
      // Delivery-retry rows age out with the same retention window (delivered
      // rows by delivery time; exhausted rows by creation).
      const deliveries = await pruneAlertDeliveries(db, cutoff);
      recordAudit(db, request, { action: 'developer.audit.prune', entityType: 'system', after: { deleted: result.count, deliveries, cutoff: cutoff.toISOString(), retentionDays: days } });
      return { ok: true, deleted: result.count, deliveries, cutoff: cutoff.toISOString() };
    },
  );

  // ---------------------------------------------------------------- license
  app.get(
    '/admin/developer/license',
    { preHandler: guards.requirePermission('developer_mode'), schema: { summary: 'License status and limits', tags: ['developer'] } },
    async () => {
      const license = await licenseStatus(db);
      return {
        license,
        settings: {
          edition: getSetting('license.edition') ?? null,
          expiresAt: getSetting('license.expiresAt') ?? null,
          maxFacilities: getSetting('license.maxFacilities') ?? null,
          maxUsers: getSetting('license.maxUsers') ?? null,
          activatedAt: getSetting('license.activatedAt') ?? null,
        },
      };
    },
  );

  app.post(
    '/admin/developer/license/activate',
    { preHandler: guards.requirePermission('developer_mode'), schema: { summary: 'Activate a license (edition, expiry, limits)', tags: ['developer'] } },
    async (request) => {
      const u = request.user!;
      const body = (request.body ?? {}) as Record<string, unknown>;
      const key = str(body.key, 'key', { required: true, max: 200 }).trim();
      const edition = str(body.edition, 'edition', { required: true, max: 30 }).toUpperCase();
      if (!['ENTERPRISE', 'PRO', 'COMMUNITY'].includes(edition)) throw httpErrors.badRequest('Edition must be ENTERPRISE, PRO or COMMUNITY');
      const expiresAt = str(body.expiresAt, 'expiresAt', { required: true, max: 40 });
      const expiry = new Date(expiresAt);
      if (Number.isNaN(expiry.getTime())) throw httpErrors.badRequest('expiresAt must be a valid date');
      const maxFacilities = Math.round(num(body.maxFacilities, 'maxFacilities', { required: true }) ?? 0);
      const maxUsers = Math.round(num(body.maxUsers, 'maxUsers', { required: true }) ?? 0);
      if (maxFacilities < 0 || maxUsers < 0) throw httpErrors.badRequest('Limits must be >= 0');
      await setSetting(db, 'license.key', key, u.id);
      await setSetting(db, 'license.edition', edition, u.id);
      await setSetting(db, 'license.expiresAt', expiry.toISOString(), u.id);
      await setSetting(db, 'license.maxFacilities', String(maxFacilities), u.id);
      await setSetting(db, 'license.maxUsers', String(maxUsers), u.id);
      await setSetting(db, 'license.activatedAt', new Date().toISOString(), u.id);
      // Fresh alert schedule for the new license (expiry sweep dedup markers).
      await clearSetting(db, 'license.expiryAlertedAt');
      await clearSetting(db, 'license.expiredAlertedAt');
      recordAudit(db, request, { action: 'developer.license.activate', entityType: 'system', after: { edition, expiresAt: expiry.toISOString(), maxFacilities, maxUsers, keySuffix: key.slice(-4) } });
      dispatchSecurityAlert(
        {
          event: 'license.activate',
          edition,
          expiresAt: expiry.toISOString(),
          message: `[GIHM-HIS SECURITY] License activated: ${edition} edition, expires ${expiry.toISOString().slice(0, 10)}, ${maxFacilities} facilities, ${maxUsers} users.`,
        },
        db,
      );
      // Run the expiry sweep immediately — if the new license is already within
      // the alert window (or lapsed), the developer sees the alert right away
      // instead of waiting for the next daily run. Advisory: a sweep failure
      // must never fail an otherwise-successful activation.
      await runLicenseExpiryCheck(db).catch(() => undefined);
      return { ok: true, license: await licenseStatus(db) };
    },
  );

  app.post(
    '/admin/developer/license/deactivate',
    { preHandler: guards.requirePermission('developer_mode'), schema: { summary: 'Deactivate the license', tags: ['developer'] } },
    async (request) => {
      await clearSetting(db, 'license.key');
      await clearSetting(db, 'license.activatedAt');
      await clearSetting(db, 'license.expiryAlertedAt'); // fresh window on next activation
      await clearSetting(db, 'license.expiredAlertedAt');
      recordAudit(db, request, { action: 'developer.license.deactivate', entityType: 'system' });
      dispatchSecurityAlert(
        {
          event: 'license.deactivate',
          message: '[GIHM-HIS SECURITY] License deactivated — the system is now running in trial/unlicensed mode.',
        },
        db,
      );
      return { ok: true, license: await licenseStatus(db) };
    },
  );

  // ------------------------------------------------------------ alert inbox
  app.get(
    '/admin/developer/alerts',
    { preHandler: guards.requirePermission('developer_mode'), schema: { summary: 'In-app security alert inbox (unread + history, filterable, CSV export)', tags: ['developer'] } },
    async (request, reply) => {
      // No audit write here on purpose: the header bell polls this endpoint
      // every 60s, so auditing would flood the trail with automated noise.
      const q = request.query as Record<string, unknown>;
      const where: Record<string, unknown> = {};
      const event = optStr(q.event);
      if (event) where.event = event;
      const severity = optStr(q.severity);
      if (severity && ['info', 'warning', 'critical'].includes(severity)) where.severity = severity;
      const take = Math.min(1000, Math.max(1, Number(q.take) || 100));
      const [alerts, unread, deliveries] = await Promise.all([
        db.securityAlert.findMany({ where, orderBy: { createdAt: 'desc' }, take }),
        db.securityAlert.count({ where: { readAt: null } }),
        deliveryStats(db),
      ]);
      const rows = alerts.map((a) => ({
        id: a.id,
        event: a.event,
        severity: a.severity,
        title: a.title,
        message: a.message,
        read: a.readAt !== null,
        createdAt: a.createdAt,
      }));
      if (optStr(q.format) === 'csv') {
        const csv = toCsv(
          ['When', 'Event', 'Severity', 'Title', 'Message', 'Read'],
          rows.map((a) => [a.createdAt.toISOString(), a.event, a.severity, a.title, a.message, a.read ? 'yes' : 'no']),
        );
        reply.header('Content-Type', 'text/csv; charset=utf-8');
        reply.header('Content-Disposition', 'attachment; filename="security-alerts.csv"');
        return reply.send(csv);
      }
      return { unread, alerts: rows, deliveryStats: deliveries };
    },
  );

  app.get(
    '/admin/developer/alerts/:id',
    { preHandler: guards.requirePermission('developer_mode'), schema: { summary: 'One alert with its fan-out detail — per-recipient delivery status and retry history', tags: ['developer'] } },
    async (request) => {
      const { id } = request.params as { id: string };
      const alert = await db.securityAlert.findUnique({ where: { id } });
      if (!alert) throw httpErrors.notFound('Alert not found');
      let payload: Record<string, unknown> = {};
      try {
        payload = JSON.parse(alert.payload ?? '{}') as Record<string, unknown>;
      } catch {
        /* older rows may lack a payload */
      }
      // A row that reached the max attempts without delivery is EXHAUSTED (the
      // gateway callback may also exhaust a row — never re-dispatched).
      const maxAttempts = Math.max(1, Number(getSetting('alerts.retryMaxAttempts') ?? 4) || 4);
      // Fan-out history: retry-queue rows belonging to this alert. Matching is
      // by event + a time window around the alert (deliveries are enqueued the
      // moment the alert fires; retries update the same row in place). This is
      // an approximation for a troubleshooting panel: two same-event alerts
      // within ~15 min (a lockout flood) interleave their queue rows across
      // both detail drawers — acceptable, and far better than no history.
      const from = new Date(alert.createdAt.getTime() - 60_000);
      const to = new Date(alert.createdAt.getTime() + 15 * 60_000);
      const deliveries = await db.alertDelivery.findMany({
        where: { event: alert.event, createdAt: { gte: from, lte: to } },
        orderBy: { createdAt: 'asc' },
      });
      return {
        alert: {
          id: alert.id,
          event: alert.event,
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          payload,
          read: alert.readAt !== null,
          createdAt: alert.createdAt,
        },
        deliveries: deliveries.map((d) => ({
          id: d.id,
          channel: d.channel,
          to: d.to,
          subject: d.subject,
          attempts: d.attempts,
          nextAttemptAt: d.nextAttemptAt,
          lastError: d.lastError,
          deliveredAt: d.deliveredAt,
          createdAt: d.createdAt,
          status: d.deliveredAt ? 'DELIVERED' : d.attempts >= maxAttempts ? 'EXHAUSTED' : d.attempts > 0 ? 'RETRYING' : 'QUEUED',
        })),
      };
    },
  );

  app.post(
    '/admin/developer/alerts/:id/read',
    { preHandler: guards.requirePermission('developer_mode'), schema: { summary: 'Mark an alert as read', tags: ['developer'] } },
    async (request) => {
      const { id } = request.params as { id: string };
      const alert = await db.securityAlert.findUnique({ where: { id } });
      if (!alert) throw httpErrors.notFound('Alert not found');
      await db.securityAlert.update({ where: { id }, data: { readAt: alert.readAt ?? new Date() } });
      return { ok: true };
    },
  );

  app.post(
    '/admin/developer/alerts/read-all',
    { preHandler: guards.requirePermission('developer_mode'), schema: { summary: 'Mark every alert as read', tags: ['developer'] } },
    async (request) => {
      const result = await db.securityAlert.updateMany({ where: { readAt: null }, data: { readAt: new Date() } });
      recordAudit(db, request, { action: 'developer.alerts.read-all', entityType: 'system', after: { count: result.count } });
      return { ok: true, marked: result.count };
    },
  );

  app.post(
    '/admin/developer/alerts/prune',
    { preHandler: guards.requirePermission('developer_mode'), schema: { summary: 'Delete alert inbox rows older than alerts.retentionDays (default 365)', tags: ['developer'] } },
    async (request) => {
      const result = await runAlertRetentionSweep(db);
      recordAudit(db, request, { action: 'developer.alerts.prune', entityType: 'system', after: { deleted: result.deleted, deliveries: result.deliveries, cutoff: result.cutoff } });
      return { ok: true, deleted: result.deleted, deliveries: result.deliveries, cutoff: result.cutoff };
    },
  );

  app.post(
    '/admin/developer/alerts/test',
    {
      preHandler: guards.requirePermission('developer_mode'),
      config: { rateLimit: { max: 5, timeWindow: '1 minute' } }, // tight — fans out to SMS/webhook
      schema: { summary: 'Send a test alert to every configured channel', tags: ['developer'] },
    },
    async (request) => {
      sendTestAlert(db);
      recordAudit(db, request, { action: 'developer.alerts.test', entityType: 'system' });
      return { ok: true, message: 'Test alert dispatched to inbox, SMS and webhook (as configured).' };
    },
  );

  app.post(
    '/admin/developer/alerts/test-whatsapp',
    {
      preHandler: guards.requirePermission('developer_mode'),
      config: { rateLimit: { max: 5, timeWindow: '1 minute' } }, // tight — single-channel probe
      schema: { summary: 'Send a test WhatsApp alert to verify the channel', tags: ['developer'] },
    },
    async (request) => {
      const result = await sendTestWhatsApp(db);
      recordAudit(db, request, { action: 'developer.alerts.test-whatsapp', entityType: 'system', after: { sent: result.sent, note: result.note ?? '' } });
      return result;
    },
  );

  app.post(
    '/admin/developer/alerts/test-escalation',
    {
      preHandler: guards.requirePermission('developer_mode'),
      config: { rateLimit: { max: 5, timeWindow: '1 minute' } }, // tight — fans out to email
      schema: { summary: 'Send a critical test alert to verify the on-call escalation email', tags: ['developer'] },
    },
    async (request) => {
      const escalationEmail = getSetting('security.escalationEmail');
      if (!escalationEmail) {
        return { ok: true, sent: false, message: 'No escalation email configured — set the on-call email on the Security tab first.' };
      }
      sendTestEscalation(db);
      recordAudit(db, request, { action: 'developer.alerts.test-escalation', entityType: 'system', after: { to: escalationEmail } });
      return { ok: true, sent: true, message: `Critical test alert dispatched — the on-call recipient ${escalationEmail} should receive it (requires SMTP).` };
    },
  );

  // Inbound gateway delivery-status webhook for ALERT dispatches (SMSOnlineGH
  // pushes here for both SMS and WhatsApp sends when a callback URL is
  // configured; Hubtel reports can be pointed at this endpoint too). Pending
  // retry-queue rows are resolved to delivered/failed without re-dispatching.
  // Guarded by the same shared secret as the reminder callback (the gateway
  // token is per-deployment, not per-channel). Open when no token is set (dev).
  app.post(
    '/admin/developer/alerts/delivery-callback',
    { schema: { summary: 'Inbound delivery-status webhook — resolves pending alert dispatches (SMS/WhatsApp)', tags: ['developer'] } },
    async (request) => {
      const callbackUrl = getSetting('sms.smsonlinegh.callbackUrl');
      const token = getSetting('sms.smsonlinegh.callbackToken');
      if (callbackUrl && !token) throw httpErrors.unauthorized('A callback token is required when a delivery callback URL is configured');
      if (token) {
        const supplied = (request.headers['x-callback-token'] as string | undefined) ?? (request.query as Record<string, unknown>).token;
        if (typeof supplied !== 'string' || supplied !== token) throw httpErrors.unauthorized('Invalid delivery-callback token');
      }
      const body = (request.body ?? {}) as Record<string, unknown>;
      const pick = (...keys: string[]): string | null => {
        for (const k of keys) {
          const v = body[k];
          if (typeof v === 'string' && v) return v;
          if (typeof v === 'number') return String(v);
        }
        return null;
      };
      const messageId = pick('messageId', 'message_id', 'MessageId', 'batch', 'batchId', 'id', 'messageID');
      const rawStatus = body.status;
      const statusLabel =
        typeof rawStatus === 'string'
          ? rawStatus
          : rawStatus && typeof rawStatus === 'object' && typeof (rawStatus as Record<string, unknown>).label === 'string'
            ? String((rawStatus as Record<string, unknown>).label)
            : pick('statusLabel', 'deliveryStatus', 'Status', 'errorCode', 'Message') ?? 'unknown';
      const outcome = await resolveAlertDeliveryCallback(db, {
        messageId,
        to: pick('to', 'recipient', 'msisdn'),
        channel: pick('channel'),
        statusLabel,
      });
      // Durable receipt: mirror the immunization callback — the developer must
      // see what the gateway said, even when nothing matched.
      await db.auditLog.create({
        data: {
          actorEmail: 'gateway@alerts',
          role: 'GATEWAY',
          action: 'developer.alerts.delivery-callback',
          entityType: 'system',
          ip: request.ip,
          after: JSON.stringify({ messageId, statusLabel, outcome }),
        },
      });
      return { ok: true, messageId, outcome };
    },
  );

  app.post(
    '/admin/developer/alerts/retry-sweep',
    {
      preHandler: guards.requirePermission('developer_mode'),
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } }, // idempotent but cheap to guard
      schema: { summary: 'Run the delivery retry sweep now — retry queued email/SMS/webhook dispatches immediately', tags: ['developer'] },
    },
    async (request) => {
      const result = await runAlertRetrySweep(db);
      recordAudit(db, request, { action: 'developer.alerts.retry-sweep', entityType: 'system', after: result });
      return { ok: true, ...result };
    },
  );

  // ----------------------------------------------------------------- system
  app.get(
    '/admin/developer/system',
    { preHandler: guards.requirePermission('developer_mode'), schema: { summary: 'System info — env names, versions, table sizes', tags: ['developer'] } },
    async () => {
      const counts = (await Promise.all(
        ['user', 'facility', 'patient', 'appointment', 'encounter', 'auditLog', 'device', 'immunization', 'systemSetting'].map(async (m) => {
          const model = db as unknown as Record<string, { count: () => Promise<number> }>;
          return [m, await model[m]?.count().catch(() => 0) ?? 0] as [string, number];
        }),
      )) as [string, number][];
      return {
        runtime: { node: process.version, platform: process.platform, arch: process.arch, nodeEnv: process.env.NODE_ENV ?? 'development', pid: process.pid },
        env: SETTING_DEFS.map((d) => ({ key: d.key, env: d.env, group: d.group, secret: d.secret, source: settingSource(d.key), configured: (getSetting(d.key) ?? '') !== '' })),
        counts: Object.fromEntries(counts),
      };
    },
  );
}

