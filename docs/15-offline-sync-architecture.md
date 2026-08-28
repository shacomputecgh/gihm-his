# 15 — Offline Synchronization Architecture

**Offline is a foundational requirement, not a feature** (spec §91). It is reflected in the database design, API design, client architecture and testing.

## 1. Connectivity states (spec §90)

| State | Behaviour |
|---|---|
| Full online | direct to API |
| Intermittent | local operation; auto-sync on reconnect |
| Fully offline | clinical workflows continue on encrypted-style local storage (IndexedDB outbox) |
| Reconnected | outbox replay → validation → conflict detection → server confirmation |

## 2. Outbox / inbox pattern (spec §104)

```
Client write → local DB (IndexedDB) → Outbox → /sync/mutations → server
Server → MutationLog (PROCESSED/FAILED) → confirmation → client removes entry
```

## 3. Idempotency (spec §136)

Every mutation carries:
- `transactionId` (unique per transaction — retries return the original result),
- `idempotencyKey` (unique per logical action — repeat actions never duplicate),
- `clientTimestamp` (the original clinical event time is never altered because sync happened later — spec §130).

## 4. Conflict handling (spec §101–103)

Append-oriented clinical data (encounters, notes, orders, prescriptions) minimizes destructive conflicts by design. Where an update conflict occurs: both versions are preserved, users/timestamps compared, safe field-level merges only, human review otherwise — **clinical information is never silently discarded** (§166).

**Shipped (6f)** — server-side conflict comparison. Targeted updates (e.g. a lab result) carry an optional `baseVersion` (the entity's `updatedAt` the client edited from). When the update arrives stale (`baseVersion` older than the server state): the mutation is **not applied**, a `SyncConflict` row preserves **both versions** (`serverVersion` + `clientVersion`), and the mutation log records `CONFLICT`. Re-syncing the same transaction returns the same conflict (no duplicates). An administrator reviews in **Admin → Sync conflicts** (`GET/POST /admin/sync/conflicts…`, permission `manage_sync_conflicts`) and resolves deliberately: **keep server version** (discard the stale edit), **apply client version** (the preserved payload is re-applied — the change is never lost), or **mark reviewed** with a note. Every resolution is audit-logged. CREATEs remain protected by idempotency keys + MPI duplicate review.

## 5. Failure handling

- Failed transactions stay queued with **exponential backoff** (1s → 60s cap, 5 attempts then marked FAILED and surfaced).
- Large files (scans/photos) sync separately from critical clinical transactions (spec §107) — planned.
- Duplicate protection covers prescriptions, payments, admissions, lab orders, referrals, registrations, inventory (spec §136).

## 6. Sync status truthfulness (spec §135)

The UI badge shows ONLINE/OFFLINE + pending count + last sync + per-batch results. It **never claims synchronization that hasn't happened**.
