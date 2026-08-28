import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { httpErrors } from '../../lib/http.js';
import { str } from '../../lib/validate.js';
import { toAuthUser, type AuthUser } from '../../types.js';
import { recordAudit } from '../../lib/audit.js';
import { getSetting } from '../../lib/settings.js';
import { licenseStatus } from '../../lib/license.js';
import { dispatchSecurityAlert } from '../../lib/alert.js';
import type { Guards } from '../../lib/guards.js';

/** How long a threshold-triggered lock lasts (security.lockoutThreshold). */
export const LOCKOUT_MINUTES = 15;

/** Session lifetime in hours — resolved live from the security settings. */
export function sessionTtlHours(): number {
  const n = Number(getSetting('security.sessionTtlHours') ?? 12);
  return Number.isFinite(n) && n >= 1 ? Math.round(n) : 12;
}

/** Failed attempts before the account locks (security.lockoutThreshold). */
export function lockoutThreshold(): number {
  const n = Number(getSetting('security.lockoutThreshold') ?? 5);
  return Number.isFinite(n) && n >= 1 && n <= 20 ? Math.round(n) : 5;
}

export function registerAuthRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  app.post(
    '/auth/login',
    {
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
      schema: { summary: 'Login with email + password', tags: ['auth'] },
    },
    async (request) => {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const email = str(body.email, 'email', { required: true, max: 190 }).toLowerCase();
      const password = str(body.password, 'password', { required: true, max: 200 });

      const user = await db.user.findUnique({ where: { email }, include: { role: true, region: { select: { name: true } }, district: { select: { name: true } }, facility: { select: { name: true } } } });
      if (!user) throw httpErrors.unauthorized('Invalid credentials');

      const now = new Date();
      const lockActive = user.status === 'LOCKED' && (user.lockedUntil === null || user.lockedUntil.getTime() > now.getTime());
      if (lockActive) {
        // Threshold lock (or manual lock) in force — do not verify the password.
        throw httpErrors.forbidden('Account is locked — try again later or contact an administrator');
      }

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        // Count failures only for ACTIVE accounts — an admin-suspended (or
        // manually locked) account must never have its status clobbered by a
        // wrong-password flood, and must never auto-unlock through this path.
        const active = user.status === 'ACTIVE';
        const attempts = active ? user.failedLoginAttempts + 1 : user.failedLoginAttempts;
        const threshold = lockoutThreshold();
        const locked = active && attempts >= threshold;
        await db.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: attempts, status: locked ? 'LOCKED' : user.status, lockedUntil: locked ? new Date(now.getTime() + LOCKOUT_MINUTES * 60_000) : user.lockedUntil },
        });
        if (locked) {
          recordAudit(db, request, { action: 'auth.lockout', entityType: 'user', entityId: user.id, after: { email: user.email, attempts, threshold } });
          // Fire-and-forget SMS + webhook alert (security.alertPhone / .alertWebhook)
          dispatchSecurityAlert(
            {
              event: 'lockout',
              email: user.email,
              attempts,
              threshold,
              lockedUntil: new Date(Date.now() + LOCKOUT_MINUTES * 60_000).toISOString(),
              message: `[GIHM-HIS SECURITY] Account locked: ${user.email} (${attempts} failed attempts). Locked until ${new Date(Date.now() + LOCKOUT_MINUTES * 60_000).toISOString()}.`,
            },
            db,
          );
        }
        throw httpErrors.unauthorized('Invalid credentials');
      }

      // Correct password. A lock whose window has expired is cleared; manual
      // locks (lockedUntil null) are never auto-unlocked — they need an admin
      // or the developer. Successful logins reset the failure counter. All
      // other non-active states (SUSPENDED, manually LOCKED) stay blocked.
      const unlockExpired = user.status === 'LOCKED' && user.lockedUntil !== null && user.lockedUntil.getTime() <= now.getTime();
      if (user.status !== 'ACTIVE' && !unlockExpired) throw httpErrors.forbidden('Account is not active');
      await db.user.update({
        where: { id: user.id },
        data: unlockExpired
          ? { status: 'ACTIVE', lockedUntil: null, failedLoginAttempts: 0, lastLoginAt: now }
          : { failedLoginAttempts: 0, lastLoginAt: now },
      });
      const token = app.jwt.sign({ sub: user.id, tv: user.tokenVersion }, { expiresIn: `${sessionTtlHours()}h` });
      recordAudit(db, request, { action: 'auth.login', entityType: 'user', entityId: user.id });
      return { token, user: toAuthUser(user) };
    },
  );

  app.get(
    '/auth/me',
    { preHandler: guards.requireAuth, schema: { summary: 'Current user', tags: ['auth'] } },
    async (request) => {
      const u = request.user as AuthUser;
      const user = await db.user.findUnique({ where: { id: u.id }, include: { role: true, region: { select: { name: true } }, district: { select: { name: true } }, facility: { select: { name: true } } } });
      if (!user) throw httpErrors.notFound('User not found');
      return { user: toAuthUser(user) };
    },
  );

  app.get(
    '/license/status',
    { preHandler: guards.requireAuth, schema: { summary: 'License status for any authenticated user (header badge)', tags: ['auth'] } },
    async () => ({ license: await licenseStatus(db) }),
  );
}
