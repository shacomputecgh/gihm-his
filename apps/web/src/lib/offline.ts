import Dexie, { type Table } from 'dexie';
import { api, ApiRequestError } from './api';
import { getShellAppName, getShellDeviceId, getShellVersion, initDesktopShell } from './desktop';
import { applyDeviceFromSync } from './deviceStatus';
import { isConflictResult, type SyncResultItem } from './syncConflicts';

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

/**
 * Tell the app shell that the outbox changed (a write was queued or drained)
 * so the sync badge's pending count refreshes immediately — a clinician who
 * just saved offline work must see the queued count, not after the 30s poll.
 */
export function notifyOutboxChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gihm:outbox-changed'));
  }
}

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

/**
 * Device identity for sync. Inside the Tauri shell the OS-stored device id
 * (stable across webview storage clears) wins; the browser PWA keeps its
 * localStorage id.
 */
export async function resolveDeviceId(): Promise<string> {
  await initDesktopShell();
  return getShellDeviceId() ?? getDeviceId();
}

/** Platform reported to /sync/mutations — WINDOWS inside the desktop shell. */
export async function resolvePlatform(): Promise<'WINDOWS' | 'PWA'> {
  await initDesktopShell();
  return getShellDeviceId() ? 'WINDOWS' : 'PWA';
}

/** Human-readable device name for the device registry. */
export async function resolveDeviceName(): Promise<string> {
  await initDesktopShell();
  const app = getShellAppName();
  const version = getShellVersion();
  if (app) return version ? `${app} v${version}` : app;
  return navigator.userAgent.slice(0, 80);
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
  notifyOutboxChanged();
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
export async function syncNow(): Promise<{ processed: number; failed: number; conflicts: number; notice?: string }> {
  const pending = await offlineDb.outbox.where('status').equals('PENDING').sortBy('createdAt');
  let processed = 0;
  let failed = 0;
  let conflicts = 0;
  if (pending.length === 0) return { processed, failed, conflicts };

  try {
    const res = await api<{
      results: SyncResultItem[];
      device?: { status: string; remoteLogoutAt: string | null } | null;
    }>('/sync/mutations', {
      method: 'POST',
      body: {
        deviceId: await resolveDeviceId(),
        deviceName: await resolveDeviceName(),
        platform: await resolvePlatform(),
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
    // Remote logout (docs/21 §3): an admin voided this device's session — drop
    // the offline cache and return to login on this very sync.
    applyDeviceFromSync(res.device);
    const byTxn = new Map(res.results.map((r) => [r.transactionId, r]));
    for (const p of pending) {
      const outcome = byTxn.get(p.transactionId);
      if (isConflictResult(outcome)) {
        // The server preserved both versions for review (spec §166). Terminal
        // for this device — a retry would only re-conflict, so surface it and
        // stop; an administrator resolves it in Admin → Sync conflicts.
        conflicts++;
        failed++;
        await offlineDb.outbox.update(p.id!, {
          status: 'FAILED',
          attempts: p.attempts + 1,
          error: 'Sync conflict — pending administrator review',
          createdAt: new Date().toISOString(),
        });
      } else if (outcome && outcome.status !== 'FAILED') {
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
    // A brand-new device awaits admin approval: keep the outbox queued and
    // tell the user why sync is blocked (no logout — the session is valid).
    if (err instanceof ApiRequestError && err.code === 'DEVICE_PENDING_APPROVAL') {
      notifyOutboxChanged();
      return { processed: 0, failed: pending.length, conflicts: 0, notice: err.message };
    }
    // Offline or server unreachable: leave everything pending for next attempt.
    failed = pending.length;
    console.warn('[sync] network failure, keeping outbox queued', err);
  }
  notifyOutboxChanged();
  return { processed, failed, conflicts };
}
