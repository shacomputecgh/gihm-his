import type { PrismaClient } from '@prisma/client';
import type { FastifyRequest } from 'fastify';
import { httpErrors } from './http.js';
import { toAuthUser } from '../types.js';

export interface Guards {
  requireAuth: (req: FastifyRequest) => Promise<void>;
  requirePermission: (...codes: string[]) => (req: FastifyRequest) => Promise<void>;
}

export function makeGuards(db: PrismaClient): Guards {
  async function requireAuth(req: FastifyRequest): Promise<void> {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw httpErrors.unauthorized('Authentication required');
    let payload: { sub?: string };
    try {
      payload = await req.jwtVerify<{ sub?: string }>();
    } catch {
      throw httpErrors.unauthorized('Invalid or expired token');
    }
    if (!payload.sub) throw httpErrors.unauthorized('Invalid token payload');
    const user = await db.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });
    if (!user) throw httpErrors.unauthorized('Account not found');
    if (user.status !== 'ACTIVE') throw httpErrors.forbidden('Account is not active');
    req.user = toAuthUser(user);
  }

  function requirePermission(...codes: string[]) {
    return async (req: FastifyRequest): Promise<void> => {
      await requireAuth(req);
      const u = req.user!;
      if (u.scope === 'PATIENT') {
        // Patients may only reach their own portal endpoints; deny general staff APIs.
        if (!codes.some((c) => c === 'self_access' || u.permissions.includes(c))) {
          throw httpErrors.forbidden('Patients cannot access staff endpoints');
        }
        return;
      }
      if (!codes.some((c) => u.permissions.includes(c))) {
        throw httpErrors.forbidden(`Missing permission (requires one of: ${codes.join(', ')})`);
      }
    };
  }

  return { requireAuth, requirePermission };
}
