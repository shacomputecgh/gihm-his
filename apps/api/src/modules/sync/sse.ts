import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import type { Guards } from '../../lib/guards.js';
import type { AuthUser } from '../../types.js';
import { toAuthUser } from '../../types.js';

// ── In-memory SSE subscriber registry ─────────────────────────

interface Subscriber {
  id: string;
  facilityId: string | null;
  send: (event: string, data: Record<string, unknown>) => void;
  close: () => void;
}

const subscribers = new Map<string, Subscriber>();
let nextId = 1;

/** Broadcast a mutation event to all matching subscribers. */
export function broadcastEntity(
  entity: string,
  operation: string,
  entityId: string,
  facilityId: string | null,
  payload?: Record<string, unknown>,
): void {
  const event = `${entity}.${operation}`;
  const data = { entity, operation, entityId, facilityId, payload, ts: new Date().toISOString() };
  const subs = Array.from(subscribers.values());
  for (const sub of subs) {
    if (sub.facilityId && facilityId && sub.facilityId !== facilityId) continue;
    try {
      sub.send(event, data);
    } catch { /* dead subscriber */ }
  }
}

const HEARTBEAT_MS = 15_000;

/** Resolve the auth user from either Bearer header or ?token= query param. */
async function resolveUser(
  request: FastifyRequest,
  db: PrismaClient,
  app: FastifyInstance,
): Promise<AuthUser | null> {
  // Try Bearer header first
  const header = request.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = await request.jwtVerify<{ sub: string; tv?: number }>();
      if (payload.sub) {
        const user = await db.user.findUnique({ where: { id: payload.sub }, include: { role: true } });
        if (user && user.status === 'ACTIVE') return toAuthUser(user);
      }
    } catch { /* fall through */ }
  }

  // Fallback: ?token= query param (EventSource cannot send headers)
  const q = request.query as Record<string, string>;
  if (q.token) {
    try {
      // Use Fastify's jwt.verify with the raw token string
      const payload = app.jwt.verify<{ sub: string; tv?: number }>(q.token);
      if (payload.sub) {
        const user = await db.user.findUnique({ where: { id: payload.sub }, include: { role: true } });
        if (user && user.status === 'ACTIVE') return toAuthUser(user);
      }
    } catch { /* invalid token */ }
  }

  return null;
}

// ── Route registration ────────────────────────────────────────

export function registerSseRoutes(app: FastifyInstance, db: PrismaClient, _guards: Guards): void {
  // GET /api/v1/sse/events — authenticated SSE stream
  app.get(
    '/sse/events',
    async (request, reply) => {
      const user = await resolveUser(request, db, app);
      if (!user) {
        reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
        return reply;
      }

      const id = `sse-${nextId++}`;

      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      });

      const send = (event: string, data: Record<string, unknown>) => {
        try {
          reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        } catch { /* connection closed */ }
      };

      const sub: Subscriber = {
        id,
        facilityId: user.facilityId ?? null,
        send,
        close: () => subscribers.delete(id),
      };

      subscribers.set(id, sub);
      send('connected', { subscriberId: id, facilityId: user.facilityId, ts: new Date().toISOString() });

      const heartbeat = setInterval(() => {
        try { reply.raw.write(': heartbeat\n\n'); }
        catch { clearInterval(heartbeat); sub.close(); }
      }, HEARTBEAT_MS);

      request.raw.on('close', () => {
        clearInterval(heartbeat);
        sub.close();
      });

      return reply;
    },
  );

  // GET /api/v1/sse/stats — subscriber count (admin/debug)
  app.get(
    '/sse/stats',
    { preHandler: _guards.requireAuth },
    async () => ({ activeSubscribers: subscribers.size, ids: Array.from(subscribers.keys()) }),
  );
}
