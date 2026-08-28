import Dexie, { type Table } from 'dexie';
import { isDesktopShell } from './desktop';

/**
 * Offline reporting mirror (docs/26 §6c).
 *
 * The last successful report payloads are kept locally so the Reports page can
 * render from a snapshot when the network is unavailable:
 *  - PWA: IndexedDB (Dexie), same as the sync outbox.
 *  - Tauri shell: additionally mirrored into `sqlite:gihm-reports.db` via
 *    @tauri-apps/plugin-sql (dynamic-imported only inside the shell, so the
 *    browser bundle stays free of Tauri code).
 */

export interface ReportSnapshot {
  /** e.g. 'summary:7', 'summary:month', 'completeness:30', 'anomalies' */
  kind: string;
  payload: unknown;
  savedAt: string;
}

class GihmReportCacheDb extends Dexie {
  snapshots!: Table<ReportSnapshot, string>;
  constructor() {
    super('gihm-report-cache');
    this.version(1).stores({ snapshots: 'kind, savedAt' });
  }
}

export const reportCacheDb = new GihmReportCacheDb();

async function mirrorToSqlite(kind: string, payload: unknown): Promise<void> {
  if (!isDesktopShell()) return;
  try {
    const { default: Database } = await import('@tauri-apps/plugin-sql');
    const db = await Database.load('sqlite:gihm-reports.db');
    await db.execute(
      'CREATE TABLE IF NOT EXISTS report_snapshots (kind TEXT PRIMARY KEY, payload TEXT NOT NULL, saved_at TEXT NOT NULL)',
    );
    await db.execute('INSERT OR REPLACE INTO report_snapshots (kind, payload, saved_at) VALUES ($1, $2, $3)', [
      kind,
      JSON.stringify(payload),
      new Date().toISOString(),
    ]);
  } catch (err) {
    console.warn('[report-cache] SQLite mirror failed', err);
  }
}

export async function saveReportSnapshot(kind: string, payload: unknown): Promise<void> {
  const snap: ReportSnapshot = { kind, payload, savedAt: new Date().toISOString() };
  await reportCacheDb.snapshots.put(snap);
  await mirrorToSqlite(kind, payload);
}

export async function loadReportSnapshot(kind: string): Promise<ReportSnapshot | null> {
  return (await reportCacheDb.snapshots.get(kind)) ?? null;
}
