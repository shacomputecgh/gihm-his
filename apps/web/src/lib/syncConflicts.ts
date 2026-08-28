/**
 * Sync conflict helpers (docs/15 §4, spec §101–103, §166).
 *
 * A targeted offline update (e.g. a lab result) that arrives with a stale
 * base version is recorded as a CONFLICT by the server — both versions are
 * preserved and nothing is silently discarded. These pure helpers classify
 * mutation results and shape the versions for the review console.
 */
import type { SyncConflictRow } from '../types';

/** One per-mutation result from /sync/mutations. */
export interface SyncResultItem {
  transactionId: string;
  status: string;
  entityId?: string;
  duplicated?: boolean;
  conflictId?: string;
  error?: string;
}

export function isConflictResult(r: SyncResultItem | undefined | null): r is SyncResultItem & { conflictId: string } {
  return !!r && r.status === 'CONFLICT' && typeof r.conflictId === 'string';
}

export const CONFLICT_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open — awaiting review',
  RESOLVED_KEEP_SERVER: 'Resolved — kept server version',
  RESOLVED_KEEP_CLIENT: 'Resolved — applied client version',
  RESOLVED_MANUAL: 'Resolved — manually reviewed',
};

/** Human summary of a conflict: which entity, from which device/user. */
export function conflictSummary(c: SyncConflictRow): string {
  const actor = c.clientUser ?? c.clientEmail ?? 'unknown user';
  return `${c.entityType}.${c.operation} on ${c.entityId.slice(0, 8)} (${actor}${c.deviceName ? ` · ${c.deviceName}` : ''})`;
}

/** Parse a stored version blob defensively — the console must never crash on bad data. */
export function parseVersion(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
