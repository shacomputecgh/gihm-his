// -----------------------------------------------------------------------------
// Entity-level change capture for direct online writes at the edge (docs/16 §5,
// Phase 6 refinement).
//
// The relay (relay.ts) bubbles up whatever sits in the local PROCESSED
// mutation log. Offline work reaches that log through /sync/mutations; direct
// online writes at the edge — a LAN workstation posting to the edge's own API
// — never pass through the sync endpoint, so without capture they would never
// reach the national/regional platform.
//
// withEntityCapture wraps a Prisma client so every direct entity CREATE at the
// edge (plus lab-result entry) is ALSO recorded as a mutation-log row using
// the very same shared protocol the offline outbox uses (docs/15 §2–3): a
// `direct:` transactionId (deterministic per change, so upstream idempotency
// still holds on replay), the entity id carried IN the payload so references
// survive every hop, and status PROCESSED so the relay picks it up unchanged.
//
// The offline apply path (applyMutation in modules/sync/routes.ts) is exempt:
// it already records its own mutation-log row for every transaction it
// applies, so the writes it performs inside runWithoutCapture are never
// double-captured (a double capture would re-apply the same change upstream
// under a second transactionId).
//
// Updates are deliberately out of scope: the shared protocol only carries
// CREATE / RESULT / REMIND operations, and a captured UPDATE would be
// rejected upstream as unsupported — exactly like an offline UPDATE today.
// -----------------------------------------------------------------------------

import { AsyncLocalStorage } from 'node:async_hooks';
import type { PrismaClient } from '@prisma/client';

const captureStore = new AsyncLocalStorage<{ suppressed: boolean }>();

/**
 * Runs fn with entity capture suppressed. applyMutation uses this so the
 * writes it performs while applying a synced batch are not captured a second
 * time — the batch already recorded its own mutation-log rows.
 */
export function runWithoutCapture<T>(fn: () => Promise<T>): Promise<T> {
  return captureStore.run({ suppressed: true }, fn);
}

function isCaptureSuppressed(): boolean {
  return captureStore.getStore()?.suppressed === true;
}

/** The entity models whose direct online writes bubble up (docs/15 §3). */
type CapturedModel = 'patient' | 'encounter' | 'labOrder' | 'prescription' | 'appointment' | 'admission' | 'invoice' | 'immunization';

/** JSON-string columns the offline protocol expects as arrays. */
function asArray(value: unknown): unknown[] | undefined {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

/**
 * Location-scoping ids are edge-local and never exist on the upstream — the
 * offline protocol already treats the sync account's facility as authoritative
 * (u.facilityId takes precedence over the payload). Stripping them lets the
 * upstream re-derive scoping from its own context instead of failing the FK.
 */
function stripLocation(payload: Record<string, unknown>): Record<string, unknown> {
  const { regionId, districtId, facilityId, ...rest } = payload;
  return rest;
}

/** The captured entity, normalized to the payload shape applyMutation reads. */
function payloadFor(model: CapturedModel, operation: 'CREATE' | 'RESULT', row: Record<string, unknown>): Record<string, unknown> {
  if (model === 'patient') {
    const { allergies, previousConditions, ...rest } = row;
    return stripLocation({ ...rest, allergies: asArray(allergies) ?? [], previousConditions: asArray(previousConditions) ?? [] });
  }
  if (model === 'invoice') {
    const { items, ...rest } = row;
    return stripLocation({ ...rest, items: asArray(items) ?? [] });
  }
  if (model === 'labOrder' && operation === 'RESULT') {
    // The shared protocol's labOrder.RESULT references the order by id and
    // carries the entered result — not the full row.
    return {
      orderId: row.id,
      result: row.result,
      critical: Boolean(row.critical),
      referenceRange: row.referenceRange ?? undefined,
    };
  }
  return stripLocation({ ...row });
}

/**
 * Records a direct online write in the local mutation log. Upserts so a
 * wall-clock collision can never violate the unique transactionId; capture
 * failure is swallowed — it must never fail the direct write it observes.
 */
async function record(
  db: PrismaClient,
  model: CapturedModel,
  operation: 'CREATE' | 'RESULT',
  entity: unknown,
): Promise<void> {
  try {
    const row = (entity ?? {}) as Record<string, unknown>;
    const entityId = typeof row.id === 'string' ? row.id : '';
    const transactionId = `direct:${model}:${operation}:${entityId}:${Date.now()}`;
    const payload = JSON.stringify(payloadFor(model, operation, row));
    // The owning facility (from the entity) is stamped on the ROW — it was
    // stripped from the payload as edge-local — so a multi-facility district
    // edge can run facility-scoped relays (docs/16 §1).
    const facilityId = typeof row.facilityId === 'string' ? row.facilityId : undefined;
    await db.mutationLog.upsert({
      where: { transactionId },
      create: {
        transactionId,
        facilityId,
        entityType: model,
        operation: operation === 'RESULT' ? 'RESULT' : 'CREATE',
        entityId,
        payload,
        clientTimestamp: new Date(),
        status: 'PROCESSED',
      },
      update: { entityId, payload, status: 'PROCESSED', error: null },
    });
  } catch (err) {
    console.warn(`[edge-capture] could not record ${model}.${operation}`, err);
  }
}

function captureCreate(db: PrismaClient, model: CapturedModel) {
  return async (params: { args: unknown; query: (args: unknown) => Promise<unknown> }) => {
    const result = await params.query(params.args);
    if (!isCaptureSuppressed()) await record(db, model, 'CREATE', result);
    return result;
  };
}

/** Lab results are the one direct UPDATE the shared protocol can carry. */
function captureResult(db: PrismaClient) {
  return async (params: { args: { where: { id?: string }; data: Record<string, unknown> }; query: (args: unknown) => Promise<unknown> }) => {
    const result = (await params.query(params.args)) as Record<string, unknown> | null;
    if (result && !isCaptureSuppressed() && result.status === 'VERIFIED' && typeof result.result === 'string' && result.result.length > 0) {
      await record(db, 'labOrder', 'RESULT', result);
    }
    return result;
  };
}

/**
 * Returns a Prisma client that captures direct online entity writes into the
 * local mutation log. Only applied when the deployment is a facility edge with
 * an upstream (EDGE_RELAY_URL set) — the national platform never captures.
 *
 * The capture row is written through the same client the app already uses:
 * no direct write route in this codebase creates a captured entity inside an
 * interactive transaction (applyMutation, the one transactional writer, runs
 * inside runWithoutCapture), so the separate capture write never contends
 * with an open transaction on SQLite's single connection.
 */
export function withEntityCapture(db: PrismaClient): PrismaClient {
  const extended = db.$extends({
    query: {
      patient: { create: captureCreate(db, 'patient') },
      encounter: { create: captureCreate(db, 'encounter') },
      labOrder: { create: captureCreate(db, 'labOrder'), update: captureResult(db) },
      prescription: { create: captureCreate(db, 'prescription') },
      appointment: { create: captureCreate(db, 'appointment') },
      admission: { create: captureCreate(db, 'admission') },
      invoice: { create: captureCreate(db, 'invoice') },
      immunization: { create: captureCreate(db, 'immunization') },
    },
  });
  return extended as unknown as PrismaClient;
}
