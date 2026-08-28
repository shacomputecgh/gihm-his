# GIHM-HIS — Ghana Integrated Health Management & Hospital Information System

**Foundation prototype** — a secure, offline-first, interoperable national healthcare digital-infrastructure platform for Ghana: public healthcare portal, national facility directory, hospital information system, patient portal and a Master Patient Index — one shared architecture for Web + PWA today, with Windows/Android/iOS and facility-edge planned on the same sync protocol.

> ⚠️ **DEMO / SYNTHETIC DATA ONLY.** All patients, facilities, contacts and clinical records in this repo are fictional. Not affiliated with or endorsed by the Ministry of Health or the Ghana Health Service. No official facility statistics are fabricated.

## What's inside

```
apps/api     Fastify + Prisma API (auth/RBAC, geography, facilities, patients+MPI,
             appointments+queue, clinical orders, sync, audit, edge relay, DHIMS2/
             SORMAS national adapters) — docs at /docs
apps/web     React + Vite + Tailwind v4 + PWA — public portal, /app hospital admin,
             /patient portal, offline outbox sync
deploy/edge  facility edge package (install.sh, backup.sh, compose, ops README)
clients/     native sync-protocol POC (.NET) proving the shared protocol off-browser
desktop/     Tauri v2 Windows desktop shell (tray, OS-stored device id, auto-update)
docs/        26 pre-production documents (PRD, ERD, security, offline sync, edge, …)
docker-compose.yml · Dockerfiles   foundation deployment
```

## Quick start

```bash
npm install            # installs both workspaces
npm run db:push        # create the SQLite database + Prisma client
npm run db:seed        # seed 16 regions / 261 districts, synthetic facilities, patients
npm run dev            # API on :4000 (docs at http://localhost:4000/docs) + Web on :5173
```

Then open **http://localhost:5173**.

### Demo logins (password: `Demo@123`)

| Email | Role |
|---|---|
| `admin@demo.gh` | National Administrator |
| `regional@demo.gh` | Ashanti Regional Director |
| `district@demo.gh` | Kumasi Metropolitan District Director |
| `hospital@demo.gh` | Korle-Bu Hospital Admin |
| `doctor@demo.gh` | Doctor (OPD, prescriptions, lab orders) |
| `nurse@demo.gh` / `pharmacist@demo.gh` / `lab@demo.gh` / `cashier@demo.gh` | ward / pharmacy / lab / billing |
| `chw@demo.gh` | Community Health Worker |
| `patient@demo.gh` | Patient portal (own record only) |

## Verify

```bash
npm test               # API tests (auth, facilities, MPI, scope, sync idempotency)
npm test -w apps/web   # web unit tests (offline auth expiry, device PIN lock)
npm run typecheck      # strict TS across both apps + e2e specs
npm run build          # production web build
npm run test:e2e       # Playwright E2E in Chrome (boots the dev stack itself —
                       # full clinical journey: register → OPD → prescription →
                       # lab → discharge → billing, plus the queue lifecycle)

# Note: don't leave a manual `npm run dev` running before test:e2e — Playwright
# reuses an already-listening server, and one started without RATE_LIMIT_MAX can
# trip the API rate limiter under the suite's request load (see playwright.config.ts).
```

### Test coverage (web)

```
npm test -w apps/web -- --coverage
```

| Metric     | Coverage | Threshold |
|------------|----------|-----------|
| Statements | 99.63%   | 95%       |
| Branches   | 87.19%   | 80%       |
| Functions  | 90.60%   | 72%       |
| Lines      | 99.63%   | 95%       |

**593 unit tests** across **50 test files** covering:
- Components: ContactTracing, PatientLocationTracker, Dashboard, Surveillance, DistrictHealthDashboard, UnitsManager, StaffManager, UnitStaffManager, UnitEquipmentManager, MasterdataEditors, PortalLayout, SystemSettings, and more
- Pages: Patients, Admissions, Billing, Pharmacy, Lab, Dashboard integration
- Lib: api, auth, constants, deviceLock, deviceStatus, offlineAuth, geoOverlay, format, syncConflicts
- Accessibility: form labels, heading hierarchy, semantic HTML, ARIA patterns
- E2E: Playwright tests for surveillance, contact tracing, location tracking, dashboard

## Key design decisions (see docs/)

- **Offline-first, not afterthought**: every client write carries `clientTimestamp` + `idempotencyKey`; the web client queues writes in an IndexedDB outbox and replays them idempotently via `/api/v1/sync/mutations` (§100–104).
- **Master Patient Index**: duplicates are scored and surfaced for review (HTTP 409 `MPI_DUPLICATE`); records are never silently merged (§12).
- **Scope enforcement**: NATIONAL / REGIONAL / DISTRICT / FACILITY / PATIENT data boundaries on every query (§62).
- **SQLite for dev, PostgreSQL for prod**: the Prisma schema is portable (no SQLite-only types) — production switches `provider` to `postgresql` (see docs/17).
- **Audit everywhere**: every write records actor, entity, before/after JSON, device and IP (§67).

## Repository map

| Path | Purpose |
|---|---|
| `apps/api/prisma/schema.prisma` | data model (65 entities) |
| `apps/api/prisma/data/geography.ts` | GSS 16 regions / 261 districts |
| `apps/api/prisma/data/facilities.ts` | synthetic facility registry |
| `apps/api/prisma/seed.ts` | full synthetic demo dataset |
| `apps/api/src/modules/*` | auth, geography, facilities, patients, appointments, dashboard, admin, sync, edge relay, integrations (DHIMS2/SORMAS) |
| `apps/web/src/pages/portal|app|patient` | portal, hospital admin, patient portal |
| `apps/web/src/lib/offline.ts` | outbox + idempotent sync engine |
| `deploy/edge/` | facility edge: install.sh, backup.sh (WAL-safe, age-encrypted), docker-compose, README |
| `clients/gihm-sync-poc/` | .NET 10 native client proving the shared sync protocol (docs/26) |
| `desktop/` | Tauri v2 shell: embeds the React SPA, tray, OS-stored device id, auto-update (docs/26 §6b) |
| `docs/` | the 26 pre-production documents (incl. docs/26 Windows client evaluation) |

## Facility edge & desktop (Phase 6)

A facility edge is the full stack on one LAN server — no internet required. See `deploy/edge/README.md`:

```bash
cd deploy/edge && ./install.sh          # one-command facility edge
./backup.sh                             # WAL-safe backup + rotation
```

With `EDGE_RELAY_URL` set, the edge bubbles its local offline mutation log to
the national/regional platform through the same `/sync/mutations` protocol the
PWA uses (`apps/api/src/modules/edge/relay.ts`). The Windows client decision
(Tauri v2) and the native sync-protocol proof live in `docs/26` + `clients/gihm-sync-poc/`.

The **Tauri desktop shell** (`desktop/`, docs/26 §6b) embeds the same React SPA
with a system tray (Show / Sync now / Check for updates / Quit), close-to-tray,
an **OS-stored device id** (stable across webview storage clears), a per-client
API-base config (`gihm-shell-config.json` → defaults to the local edge),
auto-update with a generated signing keypair, and `msi`/`nsis` installers that
bundle the offline WebView2 runtime. The PWA bridge (`apps/web/src/lib/desktop.ts`)
keeps the browser bundle Tauri-free; inside the shell, sync reports
`platform: WINDOWS` with the OS device id. Build with `cd desktop && npm install && npm run build:msi` (needs Rust + Windows).

Offline hardening (docs/26 §6c): a **device PIN lock** (salted-hash storage,
auto-lock after inactivity, lock screen — Admin → Sync status), an **offline
auth cache** (a signed-in device resumes offline within the JWT lifetime,
cleared on logout), and a **local reporting mirror** (report snapshots in
IndexedDB + shell SQLite via `tauri-plugin-sql`, with the Reports page falling
back to the cached copy when the platform is unreachable).

## National integrations (docs/08)

DHIMS2 + SORMAS adapters push live-computed monthly indicator datasets and
disease-case events to the national systems through independent idempotent
queues (`/app/integrations`, dry-run + CSV/JSON export, backoff + ack capture).
Configure via env — `INTEGRATION_DHIMS2_URL/USERNAME/PASSWORD`,
`INTEGRATION_SORMAS_URL/USERNAME/PASSWORD` — or leave unset: submissions queue
and the status page reports the adapter as not configured.

## National facility map / GIS (docs/14 §6)

`GET /geography/map` returns every in-scope facility with GPS coordinates plus
a 30-day activity aggregate; the **Facility map** page (`/app/gis`) renders
markers on a Leaflet map (OpenStreetMap tiles — no API key), coloured by
ownership and sized by activity, with region/type/sector filters.

## Reports, anomaly detection & scheduled reports (docs/14)

The report builder computes DHIMS-II-mapped indicators live from platform
records (no manual re-entry), with facility/district/region group-by, reporting
completeness, and CSV export. `GET /reports/anomalies` flags unusual weeks on
the indicator trends (weekly z-score, ≥2σ medium / ≥3σ high, aggregate-only,
scope-isolated). Scheduled reports (spec §149) email an authorised recipient
list on a daily/weekly/monthly/quarterly/annual cadence — computed live at run
time, with a delivery log and run-now. The Reports page (`/app/reports`)
surfaces all three.
