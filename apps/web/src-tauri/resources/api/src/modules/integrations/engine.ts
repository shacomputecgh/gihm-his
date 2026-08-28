// -----------------------------------------------------------------------------
// National integration delivery engine (docs/08 §3).
//
// Each national adapter (DHIMS2, SORMAS, GhiLMIS, HRIMS, …) keeps an
// INDEPENDENT queue — a failure on one never blocks another (spec §128).
// Submissions are
// idempotent by idempotencyKey (one logical submission per period/org-unit or
// case range), retried with exponential backoff by the integration sweep, and
// the delivery row is the reconciliation record (payload as sent, remote
// acknowledgement id, attempt history, final status). Permanently failing
// submissions are marked FAILED and surfaced — never silently discarded
// (spec §166).
// -----------------------------------------------------------------------------

import type { PrismaClient } from '@prisma/client';

export type IntegrationAdapter = 'dhims2' | 'sormas' | 'ghilmis' | 'hrims' | 'nhis' | 'etracker' | 'lhims';

export interface AdapterAuthConfig {
  url: string;
  username: string;
  password: string;
}

export interface IntegrationConfig {
  dhims2: AdapterAuthConfig;
  sormas: AdapterAuthConfig;
  ghilmis: AdapterAuthConfig;
  hrims: AdapterAuthConfig;
  nhis: AdapterAuthConfig;
  etracker: AdapterAuthConfig;
  lhims: AdapterAuthConfig;
  sweepIntervalMs: number;
  maxAttempts: number;
  batchSize: number;
}

export interface TransportResult {
  ok: boolean;
  /** Upstream acknowledgement id, when one is returned (reconciliation). */
  remoteId?: string;
  error?: string;
}

export type Transport = (cfg: AdapterAuthConfig, payload: unknown) => Promise<TransportResult>;

export type Transports = Partial<Record<IntegrationAdapter, Transport>>;

type Logger = Pick<typeof console, 'info' | 'warn' | 'error'>;

export const ADAPTERS: IntegrationAdapter[] = ['dhims2', 'sormas', 'ghilmis', 'hrims', 'nhis', 'etracker', 'lhims'];

function backoffMs(attempts: number): number {
  return Math.min(60_000, 1_000 * 2 ** Math.min(attempts, 6));
}

/**
 * Queue a submission for an adapter. Idempotent by idempotencyKey: re-queueing
 * the same logical submission (e.g. the same period for the same org unit)
 * returns the existing delivery instead of duplicating it. A previously FAILED
 * submission is re-armed so a config fix can be retried by the sweep.
 */
export async function enqueue(
  db: PrismaClient,
  adapter: IntegrationAdapter,
  idempotencyKey: string,
  payload: unknown,
): Promise<{ id: string; status: string; duplicated: boolean }> {
  const raw = JSON.stringify(payload);
  const existing = await db.integrationDelivery.findUnique({ where: { idempotencyKey } });
  if (existing && existing.status !== 'FAILED') {
    return { id: existing.id, status: existing.status, duplicated: true };
  }
  if (existing) {
    // Re-arm a failed submission (payload may have changed — keep the latest).
    const updated = await db.integrationDelivery.update({
      where: { id: existing.id },
      data: { status: 'PENDING', payload: raw, attempts: 0, nextAttemptAt: new Date(), lastError: null, deliveredAt: null, remoteId: null },
    });
    return { id: updated.id, status: 'PENDING', duplicated: false };
  }
  const created = await db.integrationDelivery.create({
    data: { adapter, idempotencyKey, payload: raw, status: 'PENDING', nextAttemptAt: new Date() },
  });
  return { id: created.id, status: created.status, duplicated: false };
}

/**
 * One sweep pass: for each configured adapter, deliver its due PENDING rows.
 * Adapters without a configured upstream are left pending (surfaced as
 * unconfigured in /integrations/status) so nothing is lost while waiting.
 */
export async function deliverPending(
  db: PrismaClient,
  cfg: IntegrationConfig,
  transports: Transports,
  log: Logger = console,
): Promise<{ delivered: number; failed: number; attempted: number }> {
  let delivered = 0;
  let failed = 0;
  let attempted = 0;

  for (const adapter of ADAPTERS) {
    const auth = cfg[adapter];
    const transport = transports[adapter];
    if (!auth?.url || !transport) continue; // not configured — leave PENDING

    const due = await db.integrationDelivery.findMany({
      where: { adapter, status: 'PENDING', nextAttemptAt: { lte: new Date() } },
      orderBy: { createdAt: 'asc' },
      take: cfg.batchSize,
    });

    for (const row of due) {
      attempted++;
      let payload: unknown;
      try {
        payload = JSON.parse(row.payload);
      } catch {
        // Unparseable payload can never deliver — fail it visibly.
        await db.integrationDelivery.update({
          where: { id: row.id },
          data: { status: 'FAILED', lastError: 'Payload is not valid JSON', nextAttemptAt: new Date() },
        });
        failed++;
        continue;
      }
      try {
        const result = await transport(auth, payload);
        if (result.ok) {
          await db.integrationDelivery.update({
            where: { id: row.id },
            data: { status: 'DELIVERED', remoteId: result.remoteId ?? null, deliveredAt: new Date(), lastError: null, nextAttemptAt: new Date() },
          });
          delivered++;
        } else {
          const attempts = row.attempts + 1;
          const terminal = attempts >= cfg.maxAttempts;
          await db.integrationDelivery.update({
            where: { id: row.id },
            data: {
              attempts,
              status: terminal ? 'FAILED' : 'PENDING',
              lastError: result.error ?? 'Upstream rejected the submission',
              nextAttemptAt: new Date(Date.now() + backoffMs(attempts)),
            },
          });
          if (terminal) failed++;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Delivery threw';
        const attempts = row.attempts + 1;
        const terminal = attempts >= cfg.maxAttempts;
        await db.integrationDelivery.update({
          where: { id: row.id },
          data: {
            attempts,
            status: terminal ? 'FAILED' : 'PENDING',
            lastError: message,
            nextAttemptAt: new Date(Date.now() + backoffMs(attempts)),
          },
        });
        if (terminal) failed++;
      }
    }
    if (due.length > 0) {
      log.info({ adapter, due: due.length }, 'integration delivery pass complete');
    }
  }
  return { delivered, failed, attempted };
}

/** Per-adapter status for /integrations/status — truthful, never assumed. */
export async function integrationStatus(db: PrismaClient, cfg: IntegrationConfig): Promise<
  Array<{
    adapter: IntegrationAdapter;
    configured: boolean;
    pending: number;
    delivered: number;
    failed: number;
    lastDeliveredAt: string | null;
    lastError: string | null;
    nextAttemptAt: string | null;
    lastRemoteId: string | null;
  }>
> {
  const rows = await db.integrationDelivery.groupBy({
    by: ['adapter', 'status'],
    _count: { _all: true },
  });
  // Each label comes from the row that actually holds that state: lastDeliveredAt
  // from the latest DELIVERED, lastError from the latest FAILED, nextAttemptAt
  // from the next due PENDING — never the newest row regardless of status.
  const latest = await Promise.all(
    ADAPTERS.map(async (adapter) => {
      const [delivered, failed, pending, ack] = await Promise.all([
        db.integrationDelivery.findFirst({ where: { adapter, status: 'DELIVERED' }, orderBy: { deliveredAt: 'desc' }, select: { deliveredAt: true, remoteId: true } }),
        db.integrationDelivery.findFirst({ where: { adapter, status: 'FAILED' }, orderBy: { createdAt: 'desc' }, select: { lastError: true } }),
        db.integrationDelivery.findFirst({ where: { adapter, status: 'PENDING' }, orderBy: { nextAttemptAt: 'asc' }, select: { nextAttemptAt: true } }),
        db.integrationDelivery.findFirst({ where: { adapter, status: 'DELIVERED' }, orderBy: { deliveredAt: 'desc' }, select: { remoteId: true } }),
      ]);
      return { adapter, delivered, failed, pending, remoteId: ack?.remoteId };
    }),
  );
  const byKey = new Map(rows.map((r) => [`${r.adapter}:${r.status}`, r._count._all]));
  return ADAPTERS.map((adapter) => {
    const l = latest.find((x) => x.adapter === adapter);
    return {
      adapter,
      configured: Boolean(cfg[adapter]?.url),
      pending: byKey.get(`${adapter}:PENDING`) ?? 0,
      delivered: byKey.get(`${adapter}:DELIVERED`) ?? 0,
      failed: byKey.get(`${adapter}:FAILED`) ?? 0,
      lastDeliveredAt: l?.delivered?.deliveredAt?.toISOString() ?? null,
      lastError: l?.failed?.lastError ?? null,
      nextAttemptAt: l?.pending?.nextAttemptAt?.toISOString() ?? null,
      lastRemoteId: l?.remoteId ?? null,
    };
  });
}
