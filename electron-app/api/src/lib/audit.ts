import type { PrismaClient } from '@prisma/client';
import type { FastifyRequest } from 'fastify';

export interface AuditInput {
  action: string;
  entityType?: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
}

/**
 * Records an audit entry. Never blocks the request: failures are logged to
 * stderr only. Clinical records are never silently overwritten — the `before`
 * and `after` snapshots (JSON) support full reconstruction.
 */
export function recordAudit(db: PrismaClient, req: FastifyRequest, input: AuditInput): void {
  const u = req.user;
  const entry = {
    actorId: u?.id,
    actorEmail: u?.email,
    role: u?.roleCode,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    facilityId: u?.facilityId ?? undefined,
    deviceId: (req.headers['x-device-id'] as string | undefined) ?? undefined,
    ip: req.ip,
    before: input.before !== undefined ? safeJson(input.before) : undefined,
    after: input.after !== undefined ? safeJson(input.after) : undefined,
    reason: input.reason,
  };
  void db.auditLog
    .create({ data: entry })
    .catch((e: unknown) => console.error('[audit] failed to write entry', e));
}

function safeJson(v: unknown): string | undefined {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
