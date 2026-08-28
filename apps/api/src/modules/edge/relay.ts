// -----------------------------------------------------------------------------
// Facility edge relay (docs/16 §2, docs/26).
//
// A facility edge is the full GIHM-HIS stack running inside the hospital LAN.
// When the edge is configured with a national/regional upstream it becomes a
// *device* on that platform and bubbles its local mutation log up through the
// very same shared protocol the PWA uses (docs/15 §2–3): batched mutations
// carrying transactionId / idempotencyKey / clientTimestamp against
// POST /api/v1/sync/mutations. The upstream platform is idempotent, so a
// crashed relay, a lost cursor file, or a duplicated batch can never create a
// duplicate clinical record — retries return the original result.
//
// What is relayed: every mutation the edge has PROCESSED through its own sync
// API (i.e. offline work captured from facility PWA outboxes). Direct online
// writes at the edge are covered by the production relay via entity-level
// change capture (Phase 6 refinement, docs/16 §5) — the shared protocol here
// is identical either way.
//
// Scoping: a single-facility edge pushes the WHOLE local PROCESSED log — for
// it that is the point. A regional/district edge hosting MULTIPLE facilities
// can run per-facility relay instances via the optional facilityId filter
// (docs/16 §1): each instance pushes only the rows stamped with its facility,
// and the upstream's transactionId dedupe keeps concurrent instances safe.
// -----------------------------------------------------------------------------

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { PrismaClient } from '@prisma/client';

export interface EdgeRelayConfig {
  /** Base URL of the national/regional platform, e.g. https://national.example.gh */
  url: string;
  /** Service account credentials on the upstream platform (must hold sync_data). */
  username: string;
  password: string;
  /** Stable identity for this edge — registered as a Device on the upstream. */
  deviceId: string;
  /** How often to poll the local mutation log. */
  intervalMs: number;
  /** Where the relay cursor is persisted (survives restarts). */
  stateFile: string;
  /** Max mutations per push batch (upstream caps batches at 200). */
  batchSize: number;
  /**
   * Optional facility scope: when set, only mutations stamped with this
   * facility id are relayed. A multi-facility district edge runs one relay
   * instance per facility; unset relays the whole log (single-facility edge).
   */
  facilityId?: string;
}

interface RelayState {
  deviceId: string;
  /** Rolling window of transactionIds already relayed (terminal outcomes). */
  pushedTransactionIds: string[];
}

/** Window size: safely exceeds any plausible batch backlog between passes. */
const PUSHED_WINDOW = 2000;

type Logger = Pick<typeof console, 'info' | 'warn' | 'error'>;

function readState(cfg: EdgeRelayConfig): RelayState {
  try {
    const parsed = JSON.parse(readFileSync(cfg.stateFile, 'utf8')) as Partial<RelayState>;
    return { deviceId: parsed.deviceId ?? cfg.deviceId, pushedTransactionIds: parsed.pushedTransactionIds ?? [] };
  } catch {
    return { deviceId: cfg.deviceId, pushedTransactionIds: [] };
  }
}

function writeState(cfg: EdgeRelayConfig, state: RelayState): void {
  try {
    const dir = dirname(cfg.stateFile);
    if (dir && dir !== '.') mkdirSync(dir, { recursive: true });
    writeFileSync(cfg.stateFile, JSON.stringify(state, null, 2));
  } catch (err) {
    // Non-fatal: a stale cursor only causes a harmless re-push (the upstream
    // dedupes by transactionId — docs/15 §3).
    console.warn('[edge-relay] could not persist cursor', err);
  }
}

async function login(cfg: EdgeRelayConfig): Promise<string> {
  const res = await fetch(`${cfg.url.replace(/\/$/, '')}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: cfg.username, password: cfg.password }),
  });
  if (!res.ok) throw new Error(`edge relay login failed: HTTP ${res.status}`);
  const body = (await res.json()) as { token?: string };
  if (!body.token) throw new Error('edge relay login returned no token');
  return body.token;
}

function safeParsePayload(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/**
 * One relay pass: fetch the local PROCESSED mutation log after the persisted
 * cursor and push it to the upstream platform. Returns how many mutations were
 * pushed and how many the upstream rejected as FAILED (still advanced — the
 * upstream recorded them for reconciliation).
 */
export async function relayOnce(
  db: PrismaClient,
  cfg: EdgeRelayConfig,
  log: Logger = console,
): Promise<{ pushed: number; failed: number }> {
  const state = readState(cfg);
  // The cursor is a transactionId window, NOT a timestamp: MutationLog.createdAt
  // has millisecond precision and concurrent batches can share a millisecond,
  // so a time cursor could skip rows forever (data loss). Rows outside the
  // window (e.g. after a crash or a lost state file) are simply re-pushed — the
  // upstream dedupes by transactionId and answers duplicated: true (docs/15 §3).
  const rows = await db.mutationLog.findMany({
    where: {
      status: 'PROCESSED',
      ...(cfg.facilityId ? { facilityId: cfg.facilityId } : {}),
      ...(state.pushedTransactionIds.length ? { transactionId: { notIn: state.pushedTransactionIds } } : {}),
    },
    orderBy: { createdAt: 'asc' },
    take: Math.max(1, cfg.batchSize),
  });
  if (rows.length === 0) return { pushed: 0, failed: 0 };

  const mutations = rows.map((r) => ({
    transactionId: r.transactionId,
    entityType: r.entityType,
    operation: r.operation,
    ...(r.idempotencyKey ? { idempotencyKey: r.idempotencyKey } : {}),
    clientTimestamp: r.clientTimestamp.toISOString(),
    payload: safeParsePayload(r.payload),
  }));

  const url = `${cfg.url.replace(/\/$/, '')}/api/v1/sync/mutations`;
  // Token is fetched lazily and only re-fetched on a 401 (upstream sessions).
  let token: string | null = null;

  const push = async (): Promise<{ statuses: string[]; ok: boolean }> => {
    if (!token) token = await login(cfg);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({
        deviceId: state.deviceId,
        deviceName: `Facility edge ${state.deviceId}`,
        platform: 'EDGE',
        mutations,
      }),
    });
    if (res.status === 401) {
      // Stale/expired session — refresh once and retry.
      token = null;
      token = await login(cfg);
      const retry = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({
          deviceId: state.deviceId,
          deviceName: `Facility edge ${state.deviceId}`,
          platform: 'EDGE',
          mutations,
        }),
      });
      if (!retry.ok) throw new Error(`edge relay push failed: HTTP ${retry.status}`);
      const retryBody = (await retry.json()) as { results?: { status?: string }[] };
      return {
        statuses: (retryBody.results ?? []).map((r) => r.status ?? 'UNKNOWN'),
        ok: true,
      };
    }
    if (!res.ok) throw new Error(`edge relay push failed: HTTP ${res.status}`);
    const body = (await res.json()) as { results?: { status?: string }[] };
    return { statuses: (body.results ?? []).map((r) => r.status ?? 'UNKNOWN'), ok: true };
  };

  const { statuses } = await push();
  // Advance the window past every row with a terminal upstream result (PROCESSED
  // or FAILED — a permanently rejected mutation must not block the edge). Rows
  // with a non-terminal outcome (or a thrown push) stay eligible for retry.
  const terminalRows = rows.filter((_, i) => statuses[i] === 'PROCESSED' || statuses[i] === 'FAILED');
  if (terminalRows.length > 0) {
    const next = [...new Set([...state.pushedTransactionIds, ...terminalRows.map((r) => r.transactionId)])].slice(-PUSHED_WINDOW);
    writeState(cfg, { ...state, pushedTransactionIds: next });
  }

  const pushed = statuses.filter((s) => s === 'PROCESSED').length;
  const failed = statuses.filter((s) => s === 'FAILED').length;
  // Idle passes stay silent — the server.ts caller already logs activity.
  if (pushed > 0 || failed > 0) {
    log.info({ pushed, failed, deviceId: state.deviceId }, 'edge relay pass complete');
  }
  return { pushed, failed };
}
