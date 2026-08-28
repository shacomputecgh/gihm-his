# 26 — Windows Desktop Client Evaluation (Tauri vs .NET)

Phase 6 scope (spec §89, §97, §108–111): a native Windows client for hospital
workstations, offline-first, sharing the sync protocol the web/PWA already
implements (`docs/15`). This document evaluates the technology options and
records the decision.

## 1. What the client must be

| Requirement | Source |
|---|---|
| Runs on Windows workstations in the facility LAN | spec §89 |
| Offline-first: full clinical workflows with no internet, auto-sync on reconnect | spec §90–91, §111 |
| Uses the **shared sync protocol** (`/sync/mutations`, `transactionId`/`idempotencyKey`/`clientTimestamp`, outbox replay) | docs/15 §2–3, §136 |
| Air-gapped install possible (no app-store dependency) | §110, hospital networks |
| Device identity registered on the platform (statuses, revocation) | docs/21 §1–2 |
| Reuses the existing React/PWA UI rather than a parallel rewrite | §93, §96 |
| Cross-platform reach (Windows workstations + Linux + Android) is a strong plus | docs/16 §1 |

## 2. Candidates evaluated

| | Tauri v2 | .NET WinUI 3 | .NET WPF | .NET MAUI | Avalonia |
|---|---|---|---|---|---|
| Current version | 2.9.x (stable) | .NET 10 | .NET 10 | .NET 10 | v11 stable / v12 |
| Embed existing React app | **Native** (WebView2 on Windows, WebKit elsewhere) | WebView2 host control | WebView2 host control | Per-platform webviews | Third-party/native webview |
| Offline SQLite | `tauri-plugin-sql` (sqlx) | EF Core + SQLite | EF Core + SQLite | EF Core + SQLite | EF Core + SQLite |
| Packaging for air-gapped LAN | **Native installers (`.msi`/`.exe`), offline WebView2 runtime bundled** | MSIX/ClickOnce, signing | Single-file `.exe`, xcopy | Multi-target, heavier | Single-file targets |
| Cross-platform | **Windows, Linux, macOS, Android, iOS** | Windows only | Windows only | Win/macOS/Android/iOS (Linux weak) | Win/Linux/macOS/Android/iOS |
| Licensing | MIT/Apache-2.0 | MIT | MIT | MIT | MIT (core) |
| Ecosystem health | High growth, web-to-desktop standard | Mature, heavier tooling | Mature, legacy | Mixed reception | Strong enterprise niche |

## 3. Decision: **Tauri v2**

1. **Zero UI rewrite.** The React PWA is the client — Tauri runs it inside the
   OS webview and adds native capabilities (local SQLite, tray, updates, file
   access) behind a secure IPC bridge. WinUI/WPF/MAUI/Avalonia would each mean
   building a parallel XAML/C# UI, doubling surface area and splitting the
   facility between two products with different behaviours.
2. **Cross-platform is the default.** The same bundle targets Windows
   workstations, Linux servers/terminals and Android tablets (mobile nursing
   carts) — exactly the footprint of docs/16 §1. WinUI/WPF cannot reach Linux
   or Android at all.
3. **Offline-first fits the existing design.** The PWA already owns the outbox
   (`apps/web/src/lib/offline.ts`) and IndexedDB; Tauri keeps that logic and
   can optionally mirror it into `tauri-plugin-sql` for heavier local queries.
   The protocol on the wire is unchanged — the server cannot tell a Tauri
   device from a PWA device except by `platform`.
4. **Air-gapped enterprise installs.** Native `.msi`/`.exe` installers with an
   offline WebView2 runtime bundled are exactly what restricted hospital
   networks need; no store or subscription required.
5. **Licensing is clean** (MIT/Apache-2.0) — no per-seat or runtime cost.

The .NET ecosystem remains the fallback if the project later needs deep native
Windows integration (Active Directory, biometric readers, legacy drivers):
within .NET, **Avalonia** is the recommended path (cross-platform, MIT) rather
than Windows-locked WinUI/WPF.

## 4. Validation already performed

- **Native protocol POC (.NET, `clients/gihm-sync-poc/`)** — a zero-package
  .NET 10 console client proves the shared sync contract works from a fully
  native application: login → stable device id → `patient.CREATE` mutation
  batch (`transactionId`/`idempotencyKey`/`clientTimestamp`) → `PROCESSED`
  result → device registered as `platform: WINDOWS` with `pending=0`. This is
  the transport-agnosticism proof: whatever shell is chosen, the server
  contract is identical.
- **Facility edge relay (`apps/api/src/modules/edge/relay.ts`)** — the edge
  bubbles its local PROCESSED mutation log to the national/regional platform
  through the same `/sync/mutations` protocol, registering itself as an `EDGE`
  device. Tested against a fake national platform (batching, cursor
  persistence, 401 re-login, unreachable-upstream retry).
- **PWA offline half** already shipped: IndexedDB outbox, exponential backoff,
  idempotent replay (`docs/15`, verified by `tests/sync.test.ts` + E2E).

## 5. Tauri risks & mitigations

| Risk | Mitigation |
|---|---|
| Rust toolchain needed for local builds | One-time SDK install; CI builds the installers; contributors can iterate in the PWA |
| WebView2 must be present (Win 10/11 or Edge update) | Bundle the offline WebView2 runtime in the installer (§2) |
| Tauri mobile (Android) still younger than desktop | Desktop first; Android stays on the PWA until needed |
| New supply chain (crates) | Pin versions; vendored crates in air-gapped builds |

## 6. Phased plan

| Phase | Deliverable |
|---|---|
| **6a (this milestone)** | Evaluation (this doc) + native sync-protocol proof + facility edge packaging (`deploy/edge/`) |
| **6b ✅ shipped** | Tauri v2 shell in `desktop/`: `tauri.conf.json` embeds the built React SPA (WebView2); tray (Show / Sync now / Check for updates / Quit) + close-to-tray; OS-stored device id (`get_shell_info` → `gihm-device-id` in the app-config dir); SPA API base resolved via `gihm-shell-config.json` (default `http://localhost:4000/api/v1`); auto-update plugin + signing keypair (public key in config, private key gitignored); offline WebView2 runtime bundled; `msi` + `nsis` targets. PWA integration in `apps/web/src/lib/desktop.ts` (raw-internals invoke, dynamic-import events — browser bundle unaffected); sync reports `platform: WINDOWS` and the OS device id |
| **6c ✅ shipped** | Offline hardening: **offline auth cache with expiry** (`apps/web/src/lib/offlineAuth.ts` — the JWT is cached after login and a previously authorized device resumes within the token lifetime; expiry from the JWT `exp` claim (padding-safe base64url decode); cleared on logout/401 and on impersonation — an offline restart always returns as the real account); **device PIN lock** (spec §97 — `apps/web/src/lib/deviceLock.ts` PBKDF2-SHA-256 (100k iterations, native WebCrypto), never plaintext, escalating brute-force cooldown after 5 wrong attempts (30s → 15min cap, persists across reloads, reset on success/new PIN), `LockScreen` overlay + auto-lock after inactivity, enroll/change/remove + Lock-now from Admin → Sync status, `LockProvider` in `main.tsx`); **local reporting mirror** (`apps/web/src/lib/reportCache.ts` — last report snapshot cached in IndexedDB for the PWA and mirrored into `sqlite:gihm-reports.db` via `tauri-plugin-sql` in the shell; the Reports page falls back to the cached snapshot with a clear banner when the platform is unreachable, and shows a “no cached data for this period” note rather than stale figures). 25 new web unit tests (vitest). Note: the PIN is a *deterrent* on a shared workstation — the JWT session itself lives in plaintext localStorage, so device encryption (BitLocker) is the real protection for a lost device. PINs enrolled by an earlier dev build (iterated SHA-256) will not verify after the PBKDF2 switch — clear `gihm_device_pin` in localStorage and re-enroll. |
| **6d ✅ shipped** | Edge-native packaging: the facility edge as a **bundled backend for the desktop client** when the LAN has no server — `deploy/edge/windows/` (`backend.ps1 build|provision|start|stop|status`): provisions the API bundle (Node + SQLite, **no Docker**) into `%LOCALAPPDATA%\gh.gihm.his.desktop\local-backend` (the Tauri identifier dir — matching the shell's `app_local_data_dir`) with a fresh JWT secret, runs `prisma generate` + `db push` (+ optional demo seed), writes `backend.json` for the shell; Rust commands `local_backend_status` / `start_local_backend` / `stop_local_backend` in `lib.rs` manage the process (pid-file claim that makes the auto-start race atomic, `CREATE_NO_WINDOW` headless tsx spawn, `tasklist`/`taskkill` liveness + termination, logs to the app log dir) and **auto-start at launch** in `setup()`; PWA bridge (`desktop.ts` `ensureLocalBackend` + status/start/stop wrappers) feeds a new **Admin → Sync status “Local edge backend” card** (provisioned/running/stopped states, Start/Stop, port + pid) and boot-time retry in `main.tsx`. The SPA's default API base already points at the same port (`http://localhost:4000/api/v1`), so no config change is needed. 4 new web unit tests |
| 6e | Device management UX: enroll, suspend, remote logout (docs/21 §1–3) |

## 7. Related decisions

- The **facility edge** (docs/16 §2) ships in this milestone as `deploy/edge/`
  (installer, backup, relay) — the natural backend for both the web client and
  the future desktop shell inside the LAN.
- Client **`platform`** values on the Device registry: `WINDOWS` (desktop),
  `EDGE` (facility edge server), `PWA`/`ANDROID`/`IOS` (existing) — all
  registered and manageable through the same `/sync` + `/admin/devices` APIs.
