import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { reportCacheDb, saveReportSnapshot, loadReportSnapshot } from './reportCache';

// The offline reporting mirror (docs/26 §6c): the last successful report
// payloads are kept in IndexedDB (Dexie) so the Reports page can render from a
// snapshot when the platform is unreachable (e2e/offline-reports-drill.spec.ts
// covers the UI; these cover the store itself).

const mocks = vi.hoisted(() => ({
  isDesktopShell: vi.fn(() => false),
  execute: vi.fn(async () => {}),
}));

vi.mock('../lib/desktop', () => ({ isDesktopShell: mocks.isDesktopShell }));
// The Tauri SQL plugin is dynamic-imported only inside the shell — the mock
// lets us exercise the mirror without a native runtime.
vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn(async () => ({ execute: mocks.execute })),
  },
}));

import { default as SqlDatabase } from '@tauri-apps/plugin-sql';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
type SqlDbMock = { load: ReturnType<typeof vi.fn> };
const sqlDb = SqlDatabase as unknown as SqlDbMock;

describe('reportCache', () => {
  beforeEach(async () => {
    await reportCacheDb.snapshots.clear();
    mocks.isDesktopShell.mockReset().mockReturnValue(false);
    mocks.execute.mockReset().mockResolvedValue(undefined);
    sqlDb.load.mockClear();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('round-trips a snapshot with its payload and a savedAt timestamp', async () => {
    const payload = { total: 7, facilities: 3, generatedAt: '2026-08-17T10:00:00.000Z' };
    await saveReportSnapshot('summary:7', payload);
    const loaded = await loadReportSnapshot('summary:7');
    expect(loaded).not.toBeNull();
    expect(loaded!.kind).toBe('summary:7');
    expect(loaded!.payload).toEqual(payload);
    expect(new Date(loaded!.savedAt).getTime()).not.toBeNaN();
  });

  it('keeps different kinds independently', async () => {
    await saveReportSnapshot('summary:7', { total: 7 });
    await saveReportSnapshot('completeness:30', { reported: 2, expected: 3 });
    expect((await loadReportSnapshot('summary:7'))!.payload).toEqual({ total: 7 });
    expect((await loadReportSnapshot('completeness:30'))!.payload).toEqual({ reported: 2, expected: 3 });
  });

  it('overwrites the previous snapshot of the same kind', async () => {
    await saveReportSnapshot('anomalies', { flags: 1 });
    await saveReportSnapshot('anomalies', { flags: 5, notes: ['x'] });
    const loaded = await loadReportSnapshot('anomalies');
    expect(loaded!.payload).toEqual({ flags: 5, notes: ['x'] });
    const count = await reportCacheDb.snapshots.where('kind').equals('anomalies').count();
    expect(count).toBe(1);
  });

  it('returns null for a kind that was never saved', async () => {
    expect(await loadReportSnapshot('summary:month')).toBeNull();
  });

  it('stores complex payloads losslessly (arrays, nested objects, nulls)', async () => {
    const payload = { rows: [{ facility: 'Korle-Bu', counts: [1, 2, null] }], meta: null, ok: true };
    await saveReportSnapshot('breakdown:facility', payload);
    expect((await loadReportSnapshot('breakdown:facility'))!.payload).toEqual(payload);
  });

  it('skips the SQLite mirror entirely outside the desktop shell', async () => {
    mocks.isDesktopShell.mockReturnValue(false);
    await saveReportSnapshot('summary:7', { total: 7 });
    expect(sqlDb.load).not.toHaveBeenCalled();
  });

  it('mirrors the snapshot into the shell SQLite database when inside the shell', async () => {
    mocks.isDesktopShell.mockReturnValue(true);
    const payload = { total: 7, facilities: 3 };
    await saveReportSnapshot('summary:7', payload);
    expect(sqlDb.load).toHaveBeenCalledWith('sqlite:gihm-reports.db');
    expect(mocks.execute).toHaveBeenCalledWith(
      'CREATE TABLE IF NOT EXISTS report_snapshots (kind TEXT PRIMARY KEY, payload TEXT NOT NULL, saved_at TEXT NOT NULL)',
    );
    expect(mocks.execute).toHaveBeenCalledWith(
      'INSERT OR REPLACE INTO report_snapshots (kind, payload, saved_at) VALUES ($1, $2, $3)',
      ['summary:7', JSON.stringify(payload), expect.any(String)],
    );
    // The IndexedDB store is still written first.
    expect((await loadReportSnapshot('summary:7'))!.payload).toEqual(payload);
  });

  it('swallows a failing SQLite mirror without breaking the IndexedDB save', async () => {
    mocks.isDesktopShell.mockReturnValue(true);
    mocks.execute.mockRejectedValue(new Error('sqlite locked'));
    await expect(saveReportSnapshot('anomalies', { flags: 1 })).resolves.toBeUndefined();
    expect(console.warn).toHaveBeenCalled();
    expect((await loadReportSnapshot('anomalies'))!.payload).toEqual({ flags: 1 });
  });
});
