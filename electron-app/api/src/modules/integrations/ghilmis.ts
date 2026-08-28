// -----------------------------------------------------------------------------
// GhiLMIS adapter (docs/08 §2) — the national logistics/stock management system.
//
// Builds a monthly commodity stock-level snapshot from this platform's own
// inventory records (never manual re-entry) and delivers it through the shared
// integration engine (idempotent queue + backoff + audit). The platform stays
// authoritative for day-to-day stock; GhiLMIS receives the month-end levels for
// national logistics planning. The docs' "requisition sync" half of the pattern
// rides the same queue once the requisition workflow lands in the API.
// -----------------------------------------------------------------------------

import type { PrismaClient } from '@prisma/client';
import { toCsv } from '../../lib/csv.js';
import type { AuthUser } from '../../types.js';
import { facilityScope } from '../../lib/scope.js';
import { periodRange, resolveOrgUnit } from './dhims2.js';
import type { AdapterAuthConfig, TransportResult } from './engine.js';

export interface GhilmisStockRow {
  commodity: string;
  category: string;
  unit: string;
  quantity: number;
  reorderLevel: number;
  minStock: number;
  maxStock: number;
  batch: string | null;
  expiryDate: string | null;
  /** Derived level for the national system: OUT (zero) / LOW (at or under reorder). */
  status: 'OK' | 'LOW' | 'OUT';
}

export interface GhilmisSubmission {
  dataSet: string;
  period: string; // 'YYYY-MM'
  orgUnit: string; // facility code (or scope label)
  generatedAt: string;
  items: GhilmisStockRow[];
}

/**
 * Build the current stock-level snapshot for the caller's scope. orgUnit
 * defaults to the facility code (facility scope) or the scope label, matching
 * the DHIMS2 convention. Levels are computed live from StockItem rows.
 */
export async function buildStockSnapshot(
  db: PrismaClient,
  u: AuthUser,
  period: string,
  orgUnit?: string,
): Promise<GhilmisSubmission> {
  // Validates the period (YYYY-MM) and rejects malformed input up front.
  const { range } = periodRange(period);
  void range;
  const unit = await resolveOrgUnit(db, u, orgUnit);
  const items = await db.stockItem.findMany({
    where: { ...facilityScope(u), status: 'ACTIVE' },
    orderBy: { name: 'asc' },
    take: 500,
  });
  return {
    dataSet: 'GIHM-STOCK',
    period,
    orgUnit: unit,
    generatedAt: new Date().toISOString(),
    items: items.map((s) => ({
      commodity: s.name,
      category: s.category,
      unit: s.unit,
      quantity: s.quantity,
      reorderLevel: s.reorderLevel,
      minStock: s.minStock,
      maxStock: s.maxStock,
      batch: s.batch,
      expiryDate: s.expiryDate ? s.expiryDate.toISOString().slice(0, 10) : null,
      status: s.quantity === 0 ? 'OUT' : s.quantity <= s.reorderLevel ? 'LOW' : 'OK',
    })),
  };
}

/** GhiLMIS stock-level CSV — one row per commodity (facility/period columns). */
export function snapshotToCsv(sub: GhilmisSubmission): string {
  const rows: string[][] = sub.items.map((r) => [
    sub.orgUnit,
    sub.period,
    r.commodity,
    r.category,
    r.unit,
    String(r.quantity),
    String(r.reorderLevel),
    String(r.minStock),
    String(r.maxStock),
    r.batch ?? '',
    r.expiryDate ?? '',
    r.status,
  ]);
  return toCsv(['orgUnit', 'period', 'commodity', 'category', 'unit', 'quantity', 'reorderLevel', 'minStock', 'maxStock', 'batch', 'expiryDate', 'status'], rows);
}

function basicAuth(cfg: AdapterAuthConfig): string {
  return `Basic ${Buffer.from(`${cfg.username}:${cfg.password}`).toString('base64')}`;
}

/** GhiLMIS stock-level transport — POST the snapshot to /api/stock-levels (basic auth). */
export async function ghilmisTransport(cfg: AdapterAuthConfig, payload: unknown): Promise<TransportResult> {
  let res: Response;
  try {
    res = await fetch(`${cfg.url.replace(/\/$/, '')}/api/stock-levels`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: basicAuth(cfg) },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Network failure (upstream unreachable) — the engine keeps the row queued
    // with backoff rather than losing it (docs/08 §3).
    return { ok: false, error: `GhiLMIS unreachable: ${err instanceof Error ? err.message : 'network error'}` };
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return { ok: false, error: `GhiLMIS rejected submission: HTTP ${res.status}${body ? ` — ${body.slice(0, 200)}` : ''}` };
  }
  let remoteId: string | undefined;
  try {
    const parsed = (await res.json()) as { submissionId?: string; id?: string };
    remoteId = parsed.submissionId ?? parsed.id;
  } catch {
    /* no acknowledgement id — delivery still succeeded */
  }
  return { ok: true, remoteId };
}
