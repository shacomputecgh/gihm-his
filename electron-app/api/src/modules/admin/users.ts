import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { httpErrors } from '../../lib/http.js';
import { str, optStr } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import { getSetting } from '../../lib/settings.js';
import { assertUserCapacity } from '../../lib/license.js';
import type { Guards } from '../../lib/guards.js';

const USER_STATUSES = ['ACTIVE', 'SUSPENDED', 'LOCKED'];

export function passwordMinLength(): number {
  const n = Number(getSetting('security.passwordMinLength') ?? 8);
  return Number.isFinite(n) && n >= 4 && n <= 64 ? n : 8;
}

export function registerAdminUserRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  // ------------------------------------------------------------ list users
  app.get(
    '/admin/users',
    { preHandler: guards.requirePermission('manage_users'), schema: { summary: 'List users (scoped) with roles', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const where = u.scope === 'FACILITY' ? { facilityId: u.facilityId ?? '__none__' } : {};
      const users = await db.user.findMany({
        where,
        include: { role: { select: { code: true, name: true, scope: true } }, facility: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 500,
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
          facility: x.facility ? { id: x.facility.id, name: x.facility.name } : null,
          lastLoginAt: x.lastLoginAt,
          createdAt: x.createdAt,
        })),
        roles: await db.role.findMany({ where: { code: { not: 'DEVELOPER' } }, select: { code: true, name: true, scope: true }, orderBy: { code: 'asc' } }),
        passwordMinLength: passwordMinLength(),
      };
    },
  );

  // ---------------------------------------------------------- create user
  app.post(
    '/admin/users',
    { preHandler: guards.requirePermission('manage_users'), schema: { summary: 'Create a user account (role must not be DEVELOPER)', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const body = (request.body ?? {}) as Record<string, unknown>;
      await assertUserCapacity(db); // licensing (docs/25)
      const email = str(body.email, 'email', { required: true, max: 190 }).toLowerCase();
      const fullName = str(body.fullName, 'fullName', { required: true, max: 190 });
      const roleCode = str(body.roleCode, 'roleCode', { required: true, max: 60 });
      if (roleCode === 'DEVELOPER') throw httpErrors.forbidden('Developer accounts can only be created by the developer');
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
          facilityId: optStr(body.facilityId) ?? u.facilityId ?? null,
          regionId: optStr(body.regionId) ?? null,
          districtId: optStr(body.districtId) ?? null,
          status: 'ACTIVE',
          isSynthetic: true,
        },
      });
      recordAudit(db, request, { action: 'user.create', entityType: 'user', entityId: user.id, after: { email, roleCode, facilityId: user.facilityId } });
      return { user: { id: user.id, email: user.email, fullName: user.fullName, roleCode } };
    },
  );

  // ------------------------------------------------------- user status
  app.put(
    '/admin/users/:id/status',
    { preHandler: guards.requirePermission('manage_users'), schema: { summary: 'Activate / suspend / lock a user', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const { id } = request.params as { id: string };
      if (id === u.id) throw httpErrors.badRequest('You cannot change your own status');
      const status = str((request.body as Record<string, unknown> | undefined)?.status ?? '', 'status', { required: true }).toUpperCase();
      if (!USER_STATUSES.includes(status)) throw httpErrors.badRequest(`Invalid status: ${status}`);
      const user = await db.user.update({ where: { id }, data: { status } });
      recordAudit(db, request, { action: 'user.status', entityType: 'user', entityId: id, after: { email: user.email, status } });
      return { user: { id: user.id, email: user.email, status: user.status } };
    },
  );

  // --------------------------------------------------------- user role
  app.put(
    '/admin/users/:id/role',
    { preHandler: guards.requirePermission('manage_users'), schema: { summary: 'Change a user role (never DEVELOPER)', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const { id } = request.params as { id: string };
      const roleCode = str((request.body as Record<string, unknown> | undefined)?.roleCode ?? '', 'roleCode', { required: true });
      if (roleCode === 'DEVELOPER') throw httpErrors.forbidden('Developer accounts can only be created by the developer');
      const role = await db.role.findUnique({ where: { code: roleCode } });
      if (!role) throw httpErrors.notFound(`Role ${roleCode} not found`);
      if (id === u.id && role.scope === 'PATIENT') throw httpErrors.badRequest('You cannot demote yourself to patient access');
      const user = await db.user.update({ where: { id }, data: { roleId: role.id } });
      recordAudit(db, request, { action: 'user.role', entityType: 'user', entityId: id, after: { email: user.email, roleCode } });
      return { user: { id: user.id, email: user.email, roleCode } };
    },
  );

  // ------------------------------------------------------ reset password
  app.post(
    '/admin/users/:id/password',
    { preHandler: guards.requirePermission('manage_users'), schema: { summary: 'Reset a user password (enforces the policy minimum length)', tags: ['admin'] } },
    async (request) => {
      const { id } = request.params as { id: string };
      const password = str((request.body as Record<string, unknown> | undefined)?.password ?? '', 'password', { required: true, max: 200 });
      const min = passwordMinLength();
      if (password.length < min) throw httpErrors.badRequest(`Password must be at least ${min} characters`);
      const user = await db.user.update({ where: { id }, data: { passwordHash: await bcrypt.hash(password, 10), status: 'ACTIVE' } });
      recordAudit(db, request, { action: 'user.passwordReset', entityType: 'user', entityId: id, after: { email: user.email } });
      return { ok: true, email: user.email };
    },
  );
}
