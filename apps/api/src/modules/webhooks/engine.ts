// -----------------------------------------------------------------------------
// Platform event webhooks (docs/22 Phase 7 — advanced interoperability).
//
// External systems subscribe to platform events and receive a signed POST per
// event. The engine mirrors the integration delivery engine: publishEvent
// creates a durable PENDING delivery per matching subscription (never
// fire-and-forget on the wire), the sweep delivers due rows with exponential
// backoff, and every delivery carries an HMAC-SHA256 signature header so the
// receiver can verify it came from this platform (shared secret per
// subscription). Failures surface in the delivery log — nothing is silently
// dropped (spec §166).
// -----------------------------------------------------------------------------

import { createHmac } from 'node:crypto';
import type { Prisma, PrismaClient } from '@prisma/client';
import { webhookTargetAllowed } from '../../lib/alert.js';

/** Both the app client and a transaction client can publish (createPatient
 * runs inside the sync apply transaction). */
type Db = Prisma.TransactionClient | PrismaClient;

/** The event names modules publish (docs/22 Phase 7). */
export type WebhookEvent = 'patient.created' | 'labOrder.verified' | 'immunization.administered' | 'delivery.recorded';

export interface PublishResult {
  matched: number;
  deliveries: number;
}

function matches(subscriptionEvents: string[], event: string): boolean {
  if (subscriptionEvents.includes('*')) return true;
  return subscriptionEvents.includes(event);
}

/** HMAC-SHA256 hex signature of the exact JSON body the receiver will get. */
export function signPayload(secret: string, body: string): string {
  return createHmac('sha256', secret).update(body).digest('hex');
}

/**
 * Publish an event: every active subscription matching the event gets a
 * durable PENDING delivery with its signed payload. Synchronous and durable —
 * the caller awaits the row write (the HTTP POST itself happens in the sweep),
 * so a published event is never lost to a crash between publish and delivery.
 */
export async function publishEvent(db: Db, event: WebhookEvent, payload: unknown): Promise<PublishResult> {
  const subscriptions = await db.webhookSubscription.findMany({ where: { active: true } });
  const matching = subscriptions.filter((s) => matches(JSON.parse(s.events) as string[], event));
  if (matching.length === 0) return { matched: 0, deliveries: 0 };

  const body = JSON.stringify({ event, occurredAt: new Date().toISOString(), payload });
  let deliveries = 0;
  for (const sub of matching) {
    await db.webhookDelivery.create({
      data: {
        subscriptionId: sub.id,
        event,
        payload: body,
        status: 'PENDING',
        nextAttemptAt: new Date(),
      },
    });
    deliveries++;
  }
  return { matched: matching.length, deliveries };
}

function backoffMs(attempts: number): number {
  return Math.min(60_000, 1_000 * 2 ** Math.min(attempts, 6));
}

async function postSigned(url: string, body: string, secret: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-GIHM-Signature': `sha256=${signPayload(secret, body)}`,
        'X-GIHM-Event': (JSON.parse(body) as { event: string }).event,
        'User-Agent': 'GIHM-HIS-Webhooks/1.0',
      },
      body,
      signal: AbortSignal.timeout(5_000),
    });
    if (res.ok) return { ok: true };
    return { ok: false, error: `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'network error' };
  }
}

/**
 * One sweep pass: deliver due PENDING webhook deliveries with the signed
 * payload, applying exponential backoff on failure and FAILED after max
 * attempts (rows are never deleted — the log is the reconciliation record).
 */
export async function deliverDueWebhooks(
  db: Db,
  opts: { maxAttempts?: number; batchSize?: number } = {},
  log: Pick<typeof console, 'info' | 'warn' | 'error'> = console,
): Promise<{ delivered: number; failed: number; attempted: number }> {
  const maxAttempts = opts.maxAttempts ?? 5;
  const batchSize = opts.batchSize ?? 20;
  const due = await db.webhookDelivery.findMany({
    where: { status: 'PENDING', nextAttemptAt: { lte: new Date() } },
    orderBy: { createdAt: 'asc' },
    take: batchSize,
    include: { subscription: true },
  });
  let delivered = 0;
  let failed = 0;
  for (const row of due) {
    const result = await postSigned(row.subscription.url, row.payload, row.subscription.secret);
    if (result.ok) {
      await db.webhookDelivery.update({
        where: { id: row.id },
        data: { status: 'DELIVERED', deliveredAt: new Date(), lastError: null, nextAttemptAt: new Date() },
      });
      delivered++;
    } else {
      const attempts = row.attempts + 1;
      const terminal = attempts >= maxAttempts;
      await db.webhookDelivery.update({
        where: { id: row.id },
        data: {
          attempts,
          status: terminal ? 'FAILED' : 'PENDING',
          lastError: result.error ?? 'Delivery failed',
          nextAttemptAt: new Date(Date.now() + backoffMs(attempts)),
        },
      });
      if (terminal) failed++;
    }
  }
  if (due.length > 0) log.info({ due: due.length }, 'webhook delivery pass complete');
  return { delivered, failed, attempted: due.length };
}

/** SSRF guard shared by subscription create/update (reuses lib/alert). */
export { webhookTargetAllowed };
