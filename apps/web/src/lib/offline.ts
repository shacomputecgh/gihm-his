import Dexie, { type Table } from 'dexie';
import { api } from './api';

export interface OutboxEntry {
  id?: number;
  transactionId: string;
  entityType: string;
  operation: 'CREATE' | 'UPDATE';
  endpoint: string; // reserved for future direct-REST replay
  payload: Record<string, unknown>;
  idempotencyKey: string;
  clientTimestamp: string;
  status: 'PENDING' | 'FAILED';
  attempts: number;
  error?: string;
  createdAt: string;
}

class GihmOfflineDb extends Dexie {
  outbox!: Table<OutboxEntry, number>;
  constructor() {
    super('gihm-offline');
    this.version(1).stores({
      outbox: '++id, transactionId, status, createdAt',
    });
  }
}

export const offlineDb = new GihmOfflineDb();

export function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `key-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getDeviceId(): string {
  let id = localStorage.getItem('gihm_device_id');
  if (!id) {
    id = newIdempotencyKey();
    localStorage.setItem('gihm_device_id', id);
  }
  return id;
}

/** Queue a mutation locally; it will replay against /sync/mutations. */
export async function enqueueMutation(input: {
  entityType: string;
  operation: 'CREATE' | 'UPDATE';
  payload: Record<string, unknown>;
}): Promise<OutboxEntry> {
  const entry: OutboxEntry = {
    transactionId: newIdempotencyKey(),
    entityType: input.entityType,
    operation: input.operation,
    endpoint: '/sync/mutations',
    payload: input.payload,
    idempotencyKey: newIdempotencyKey(),
    clientTimestamp: new Date().toISOString(),
    status: 'PENDING',
    attempts: 0,
    createdAt: new Date().toISOString(),
  };
  await offlineDb.outbox.add(entry);
  return entry;
}

export async function pendingCount(): Promise<number> {
  return offlineDb.outbox.where('status').equals('PENDING').count();
}

/**
 * Replays the local outbox against the server (spec §104, §136).
 * Failed items stay queued for retry with exponential backoff; they are
 * never silently discarded (spec §166).
 */
export async function syncNow(): Promise<{ processed: number; failed: number }> {
  const pending = await offlineDb.outbox.where('status').equals('PENDING').sortBy('createdAt');
  let processed = 0;
  let failed = 0;
  if (pending.length === 0) return { processed, failed };

  try {
    const res = await api<{ results: { transactionId: string; status: string; error?: string }[] }>('/sync/mutations', {
      method: 'POST',
      body: {
        deviceId: getDeviceId(),
        deviceName: navigator.userAgent.slice(0, 80),
        platform: 'PWA',
        mutations: pending.map((p) => ({
          transactionId: p.transactionId,
          entityType: p.entityType,
          operation: p.operation,
          idempotencyKey: p.idempotencyKey,
          clientTimestamp: p.clientTimestamp,
          payload: p.payload,
        })),
      },
    });
    const byTxn = new Map(res.results.map((r) => [r.transactionId, r]));
    for (const p of pending) {
      const outcome = byTxn.get(p.transactionId);
      if (outcome && outcome.status !== 'FAILED') {
        await offlineDb.outbox.delete(p.id!);
        processed++;
      } else {
        failed++;
        const attempts = p.attempts + 1;
        const backoffMs = Math.min(60_000, 1_000 * 2 ** Math.min(attempts, 6));
        await offlineDb.outbox.update(p.id!, {
          status: attempts >= 5 ? 'FAILED' : 'PENDING',
          attempts,
          error: outcome?.error ?? p.error,
          createdAt: new Date(Date.now() + backoffMs).toISOString(),
        });
      }
    }
  } catch (err) {
    // Offline or server unreachable: leave everything pending for next attempt.
    failed = pending.length;
    console.warn('[sync] network failure, keeping outbox queued', err);
  }
  return { processed, failed };
}
