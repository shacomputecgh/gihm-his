# 16 — Edge Deployment Architecture

## 1. National + edge hybrid (spec §88)

```
National platform ⇄ Integration layer (DHIMS/LHIMS/SORMAS/GhiLMIS/HRIMS…)
        ↕
Regional/District services (optional regional edge)
        ↕
Facility edge server (multi-user hospitals)
        ↕  hospital LAN
Web · Windows workstations · tablets · phones
        ↕
Local encrypted database → outbox → secure sync
```

## 2. Facility edge server (spec §94, future phase)

Functions: encrypted local database, local API, local auth cache, sync engine, transaction queue, local reporting, device management, backup service. The hospital LAN keeps working with no internet (spec §111).

## 3. CHPS offline mode (spec §95)

CHPS needs **no physical server**: Android phone/tablet, laptop or PWA with encrypted local storage. A CHPS worker does a full day of community work offline, then auto-syncs (Test F in `docs/19`).

## 4. Regional/district edges (spec §126)

Optional; transactions should not unnecessarily traverse every layer. Aggregated reporting follows Facility → District → Region → National.

## 5. Shipped: facility edge packaging + native sync proof

- **Facility edge package** (`deploy/edge/`): single-node `docker-compose`
  (web + api + SQLite volume), idempotent `install.sh` (docker check, fresh
  `JWT_SECRET`, health-gated bring-up), WAL-safe `backup.sh` with rotation +
  optional `age` encryption, and an operations README (LAN deployment,
  restore, security, upgrades, troubleshooting).
- **Edge → national relay** (`apps/api/src/modules/edge/relay.ts`): when
  `EDGE_RELAY_URL` is set, the edge registers itself as an `EDGE` device on
  the upstream and bubbles its local PROCESSED mutation log up through the
  **same shared `/sync/mutations` protocol** the PWA uses — cursor persisted to
  disk, upstream idempotent (crash-safe), 401-aware re-login. Tested against a
  fake national platform (`tests/edge.test.ts`).
- **Entity-level change capture** (`apps/api/src/modules/edge/capture.ts`):
  direct online writes at the edge (a LAN workstation posting to the edge's
  own API) are captured into the local mutation log as `direct:` transactions
  via a Prisma client extension, so the relay bubbles them up too — same
  protocol, entity ids carried in the payload so references survive every
  hop. Gated on `EDGE_RELAY_URL` like the relay itself; the offline apply path
  (`applyMutation`) runs exempt so a synced batch is never double-captured.
  Covered by the capture tests in `tests/edge.test.ts` (direct write at the
  edge → real district tier → national, exactly once).
- **Windows client evaluation** (`docs/26`): Tauri v2 recommended (embeds the
  existing React PWA, cross-platform Win/Linux/Android, air-gapped installers).
  A zero-package **.NET sync-protocol POC** (`clients/gihm-sync-poc/`) proves
  the shared protocol works from a fully native client (device registered as
  `platform: WINDOWS`).

## 6. Shipped: Tauri desktop shell (docs/26 §6 6b)

`desktop/` is a Tauri v2 shell embedding the same React PWA: system tray
(Show / Sync now / Check for updates / Quit) + close-to-tray, an OS-stored
device id (`get_shell_info` → `gihm-device-id` in the app-config dir), a
per-client API base config (`gihm-shell-config.json`, default
`http://localhost:4000/api/v1`) so the SPA (served from `tauri://localhost`)
can reach the facility edge, auto-update with a generated signing keypair,
and `msi`/`nsis` installers with the offline WebView2 runtime bundled. The
PWA bridge (`apps/web/src/lib/desktop.ts`) keeps the browser bundle free of
Tauri code; inside the shell, sync reports `platform: WINDOWS` with the
OS-stored device id.

Phase 6 scope status: offline hardening 6c, bundled edge backend 6d, device
management UX 6e and conflict detection/resolution 6f are shipped (see
`docs/22`); the relay chain Facility → District → Region → National is proven
by integration tests, and entity-level change capture for direct online
writes at the edge is shipped (§5 above). Like the offline protocol, capture
carries CREATE / lab-result operations only — updates await a future UPDATE
operation in the shared protocol. Remaining: regional/district edges as a
deployed multi-facility tier (the shared protocol is proven; a district
hosting several facilities needs a facility filter on the relay's log query,
noted in `relay.ts`).
