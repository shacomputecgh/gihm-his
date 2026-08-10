import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { httpErrors } from '../../lib/http.js';
import { str } from '../../lib/validate.js';
import { toAuthUser, type AuthUser } from '../../types.js';
import { recordAudit } from '../../lib/audit.js';
import type { Guards } from '../../lib/guards.js';

export function registerAuthRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  app.post(
    '/auth/login',
    {
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
      schema: { summary: 'Login with email + password', tags: ['auth'] },
    },
    async (request, reply) => {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const email = str(body.email, 'email', { required: true, max: 190 }).toLowerCase();
      const password = str(body.password, 'password', { required: true, max: 200 });

      const user = await db.user.findUnique({ where: { email }, include: { role: true } });
      if (!user) throw httpErrors.unauthorized('Invalid credentials');
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) throw httpErrors.unauthorized('Invalid credentials');
      if (user.status !== 'ACTIVE') throw httpErrors.forbidden('Account is not active');

      await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
      const token = app.jwt.sign({ sub: user.id });
      recordAudit(db, request, { action: 'auth.login', entityType: 'user', entityId: user.id });
      return { token, user: toAuthUser(user) };
    },
  );

  app.get(
    '/auth/me',
    { preHandler: guards.requireAuth, schema: { summary: 'Current user', tags: ['auth'] } },
    async (request) => {
      const u = request.user as AuthUser;
      const user = await db.user.findUnique({ where: { id: u.id }, include: { role: true } });
      if (!user) throw httpErrors.notFound('User not found');
      return { user: toAuthUser(user) };
    },
  );
}
