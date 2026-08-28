import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { offlineDb, enqueueMutation, syncNow, pendingCount, notifyOutboxChanged } from './offline';
import { ApiRequestError } from './api';

// The outbox (docs/19 Tests B/C/F, spec §104, §166): writes made offline queue
// in IndexedDB and replay against /sync/mutations. Every change must announce
// itself so the app shell's pending badge refreshes immediately (the badge
// used to only update on the 30s poll or a sync — a clinician who just saved
// offline work saw no queued count).
const { api } = vi.hoisted(() => ({ api: vi.fn() }));
vi.mock('./api', () => {
  class ApiRequestError extends Error {
    status: number;
    code: string;
    candidates?: unknown[];
    constructor(status: number, code: string, message: string, candidates?: unknown[]) {
      super(message);
      this.status = status;
      this.code = code;
      this.candidates = candidates;
    }
  }
  return { api, ApiRequestError };
});
// The shell bridge is inert under node — resolveDeviceId falls back to the
// localStorage device id.
vi.mock('./desktop', () => ({
  initDesktopShell: vi.fn().mockResolvedValue(undefined),
  getShellDeviceId: vi.fn().mockReturnValue(null),
  getShellAppName: vi.fn().mockReturnValue(null),
  getShellVersion: vi.fn().mockReturnValue(null),
}));

beforeEach(async () => {
  await offlineDb.outbox.clear();
  vi.mocked(api).mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('enqueueMutation', () => {
  it('queues a PENDING entry carrying the exact payload and announces the outbox change', async () => {
    // Minimal window so the 'gihm:outbox-changed' dispatch is exercised.
    const target = new EventTarget();
    vi.stubGlobal('window', target);
    const listener = vi.fn();
    target.addEventListener('gihm:outbox-changed', listener as EventListener);

    const entry = await enqueueMutation({ entityType: 'patient', operation: 'CREATE', payload: { fullName: 'Offline Unit Patient (synthetic)', phone: '0555111222' } });

    expect(entry.status).toBe('PENDING');
    expect(entry.attempts).toBe(0);
    expect(await pendingCount()).toBe(1);
    const stored = await offlineDb.outbox.get(entry.id!);
    expect(stored?.payload).toEqual({ fullName: 'Offline Unit Patient (synthetic)', phone: '0555111222' });
    // The badge must hear about the queued write immediately.
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('survives without a window (node) — the announcement is a best-effort no-op', async () => {
    const entry = await enqueueMutation({ entityType: 'patient', operation: 'CREATE', payload: { fullName: 'Headless Offline Patient (synthetic)' } });
    expect(entry.status).toBe('PENDING');
    expect(await pendingCount()).toBe(1);
  });
});

describe('syncNow', () => {
  it('announces nothing when the outbox is empty', async () => {
    const target = new EventTarget();
    vi.stubGlobal('window', target);
    const listener = vi.fn();
    target.addEventListener('gihm:outbox-changed', listener as EventListener);

    const result = await syncNow();
    expect(result).toEqual({ processed: 0, failed: 0, conflicts: 0 });
    expect(api).not.toHaveBeenCalled();
    expect(listener).not.toHaveBeenCalled();
  });

  it('replays queued mutations, deletes the processed entries and announces the drain', async () => {
    const target = new EventTarget();
    vi.stubGlobal('window', target);
    const listener = vi.fn();
    target.addEventListener('gihm:outbox-changed', listener as EventListener);

    const entry = await enqueueMutation({ entityType: 'patient', operation: 'CREATE', payload: { fullName: 'Replay Patient (synthetic)' } });
    vi.mocked(api).mockResolvedValue({
      results: [{ transactionId: entry.transactionId, status: 'PROCESSED', entityId: 'p-1' }],
      device: null,
    });

    const result = await syncNow();
    expect(result.processed).toBe(1);
    expect(result.failed).toBe(0);
    expect(await pendingCount()).toBe(0); // the entry was consumed, not orphaned
    expect(listener).toHaveBeenCalled(); // badge refreshes after the drain
    expect(api).toHaveBeenCalledTimes(1);
    expect(vi.mocked(api).mock.calls[0]![0]).toBe('/sync/mutations');
  });

  it('keeps failed mutations queued for retry (spec §166 — never silently dropped)', async () => {
    const entry = await enqueueMutation({ entityType: 'patient', operation: 'CREATE', payload: { fullName: 'Fail Patient (synthetic)' } });
    vi.mocked(api).mockResolvedValue({
      results: [{ transactionId: entry.transactionId, status: 'FAILED', error: 'MPI duplicate' }],
      device: null,
    });

    const result = await syncNow();
    expect(result.failed).toBe(1);
    expect(await pendingCount()).toBe(1); // still queued for the next attempt
    const stored = await offlineDb.outbox.get(entry.id!);
    expect(stored?.attempts).toBe(1);
    // The next retry is scheduled with the backoff (exponential, capped).
    expect(new Date(stored!.createdAt!).getTime()).toBeGreaterThan(Date.now() + 999);
  });

  it('marks a mutation FAILED after the retry cap is reached', async () => {
    const entry = await enqueueMutation({ entityType: 'patient', operation: 'CREATE', payload: { fullName: 'Exhausted (synthetic)' } });
    // Simulate four prior attempts: the fifth FAILED outcome hits the cap.
    await offlineDb.outbox.update(entry.id!, { attempts: 4 });
    vi.mocked(api).mockResolvedValue({
      results: [{ transactionId: entry.transactionId, status: 'FAILED', error: 'MPI duplicate' }],
      device: null,
    });

    const result = await syncNow();
    expect(result.failed).toBe(1);
    const stored = await offlineDb.outbox.get(entry.id!);
    expect(stored?.status).toBe('FAILED');
    expect(stored?.attempts).toBe(5);
    expect(stored?.error).toBe('MPI duplicate');
  });

  it('flags a server-side conflict and stops retrying that mutation (spec §166)', async () => {
    const entry = await enqueueMutation({ entityType: 'labOrder', operation: 'UPDATE', payload: { id: 'lo-1', status: 'RESULTED' } });
    vi.mocked(api).mockResolvedValue({
      results: [{ transactionId: entry.transactionId, status: 'CONFLICT', conflictId: 'c-77', error: 'conflict' }],
      device: null,
    });

    const result = await syncNow();
    expect(result.conflicts).toBe(1);
    expect(result.failed).toBe(1);
    const stored = await offlineDb.outbox.get(entry.id!);
    expect(stored?.status).toBe('FAILED');
    expect(stored?.error).toBe('Sync conflict — pending administrator review');
  });

  it('keeps the outbox queued and reports the notice when the device awaits approval', async () => {
    await enqueueMutation({ entityType: 'patient', operation: 'CREATE', payload: { fullName: 'Pending Device (synthetic)' } });
    vi.mocked(api).mockRejectedValue(new ApiRequestError(403, 'DEVICE_PENDING_APPROVAL', 'This device awaits admin approval.'));

    const result = await syncNow();
    expect(result.notice).toBe('This device awaits admin approval.');
    expect(result.failed).toBe(1);
    expect(await pendingCount()).toBe(1); // untouched — retried on the next sync
  });

  it('leaves everything pending when the server is unreachable', async () => {
    const entry = await enqueueMutation({ entityType: 'patient', operation: 'CREATE', payload: { fullName: 'Offline Again (synthetic)' } });
    vi.mocked(api).mockRejectedValue(new TypeError('Failed to fetch'));

    const result = await syncNow();
    expect(result.failed).toBe(1);
    const stored = await offlineDb.outbox.get(entry.id!);
    expect(stored?.status).toBe('PENDING');
    expect(await pendingCount()).toBe(1);
  });
});

describe('notifyOutboxChanged', () => {
  it('dispatches the event when a window exists', () => {
    const target = new EventTarget();
    vi.stubGlobal('window', target);
    const listener = vi.fn();
    target.addEventListener('gihm:outbox-changed', listener as EventListener);
    notifyOutboxChanged();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('is a no-op without a window', () => {
    vi.stubGlobal('window', undefined);
    expect(() => notifyOutboxChanged()).not.toThrow();
  });
});
