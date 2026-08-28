# 19 — Testing Strategy

## 1. Implemented in this build

| Layer | What | Where |
|---|---|---|
| Unit/Integration (API) | auth flow (login/me/401s), facility directory search, patient registration + **MPI duplicate → 409**, scope denial (403), **sync idempotency** (retried transaction never duplicates), failed-mutation recording, device registration — plus per-module coverage across every route (clinical pharmacy/lab worklists, blood bank, user-account lifecycle, insurance schemes, geography reference data, audit log, integration sweep, developer console, facility applications) | `apps/api/tests/*.test.ts` (Vitest, isolated SQLite DB, auto schema reset) |
| Unit (web libs + components) | api() fetch client, device identity, device lock, offline mirror/outbox, offline auth cache, sync conflicts, QR encoder, report cache, geo overlay, format helpers — **plus the React contexts** (`AuthProvider`, `ConnectionProvider`, `LockProvider`) and **every component** (LockScreen keypad, SyncBadge, AlertBell, LicenseBadge, DeviceLockSettings, LocalBackendCard, ConfigAudit, ImmunizationCoverage, NationalServiceManager, UnitEquipmentManager, SystemSettings, UsersManager, StaffManager, UnitsManager, UnitStaffManager, MasterdataEditors, AppLayout, PortalLayout) driven with jsdom + Testing Library: session restore/offline resume/revocation, health probing/sync events, the PIN lifecycle, alert inbox filtering, license states, settings save semantics, account/register/equipment/unit CRUD with confirm-gated deletes, permission-gated navigation | `apps/web/src/lib/*.test.ts{,x}` · `apps/web/src/components/*.test.tsx` (Vitest, node env for libs, per-file jsdom for components) |

#### Web unit coverage (356 tests across 37 files)

| Metric | Coverage | Threshold |
|--------|----------|-----------|
| Statements | 98.83% | ≥ 95% |
| Branches | 84.30% | ≥ 80% |
| Functions | 76.83% | ≥ 72% |
| Lines | 98.83% | ≥ 95% |

The remaining branch gap (~16%) is dominated by CSS class conditionals (`cn()` calls) and disabled-button handlers that are unreachable without removing the guard — these are better covered by the Playwright E2E suite.
| Typecheck | strict TS both apps | `npm run typecheck` |
| Build | Vite production build | `npm run build` |
| E2E (Playwright) | full clinical journey (register → OPD → prescription → lab → discharge → billing), OPD queue lifecycle (check-in → start → complete, department isolation, skip, call-next), patient portal + developer-mode sessions, a behavioral check per module, and a **security spec** (`e2e/security.spec.ts`) — injection probes (SQL/operator payloads inert, bounded results), privilege escalation (a doctor is refused device/audit/user-management endpoints), data leakage (a facility user cannot read another facility's records; scoped searches never leak foreign rows), session security (missing/garbage/forged/expired JWTs refused) — system Chrome against the live dev stack | `e2e/*.spec.ts` (`npm run test:e2e`) |

### E2E behavioural coverage

Every module page is exercised beyond the heading smoke test (`e2e/pages-smoke.spec.ts`):

| Spec | Workflow verified |
|---|---|
| `patient-journey.spec.ts` | register → OPD encounter (triage + vitals) → prescription → lab → discharge → billing |
| `queue-checkin.spec.ts` | OPD queue lifecycle: check-in, start, complete, department-tab isolation, skip, call-next |
| `appointments-check` · `referrals-check` · `beds-check` · `ambulances-check` · `bloodbank-check` · `theatre-check` | appointment booking, referral submission, bed assignment, ambulance dispatch, donor/donation, surgical booking + consent |
| `directorate-check` · `directorate-regional-check` · `directorate-national-check` · `directorate-district-check` · `immunizations-check` · `reports-check` · `reports-schedules` · `documents-check` | aggregate dashboard (facility scope), regional district view + drill-down (REGIONAL session), national region view + region → district → facility drill-down (NATIONAL session), district facility view with no drill-down (DISTRICT session), EPI dose recording, live indicators, scheduled-report CRUD, digital-folder upload |
| `admissions-check` · `lab-check` · `pharmacy-check` · `surveillance-check` · `insurance-check` | admission wizard + discharge, critical lab verification, dispensing, case report → follow-up → close, claim approve → pay |
| `dashboard-check` · `dashboard-district-check` · `reports-gis-scope-check` · `assets-check` · `patients-check` · `patient-detail-check` · `admin-check` · `users-check` · `gis-check` · `integrations-check` · `developer-check` · `ai-check` | home stats + quick actions, named district scope on the dashboard (DISTRICT session), named scope on the Reports + GIS pages (DISTRICT session), asset register/dispose, MPI live search, patient record admissions + insurance tabs, device approval + audit + MPI tabs, user-account lifecycle (create → suspend → activate → reset password), map markers + choropleth overlay (layer toggle, quantile legend, district granularity), adapter previews, developer mode, AI services (note draft + duplicate review + forecast, all with the required disclosure) |
| `portal-check` · `facility-application-check` · `patient-portal.spec.ts` | public facility finder (search + sector filters) + profile, facility self-registration application, patient portal own-record + staff-area blocks |

Specs run on a freshly-seeded demo DB (CI: `db:push && db:seed` before the suite); checks that consume seed state (one lab result, one prescription, one claim, one pending device…) document that in their header and are restored by re-seeding.

## 2. Mandatory offline tests (spec §162 — Test A–J)

| Test | Scenario | Status |
|---|---|---|
| A | Web+Windows+Android+iOS simultaneously | P1 prototype: web only |
| B | Internet failure — Windows + Android + edge continue | outbox works in PWA + **UI offline drill** (`e2e/offline-drill.spec.ts` — real browser network cut, registration queues in the IndexedDB outbox, reconnect auto-syncs); **automated backlog drill** (`edge.test.ts`) — a full offline day drains in order, exactly once; native phases pending |
| C | Reconnection — all pending sync automatically | ✅ covered by sync engine + tests **and the UI offline drill** (`e2e/offline-drill.spec.ts` — the browser `online` event triggers the outbox replay, badge returns to Connected, entry consumed, patient searchable) |
| D | Offline conflict between two devices | ✅ two-device conflict drill (`edge.test.ts` — both devices edit the same lab order offline; the edge applies the first and preserves the second as CONFLICT with both versions, the losing edit is never relayed, and a `keep_client` resolution propagates the corrected outcome upstream so every tier converges; resolution console + `manage_sync_conflicts` in place) |
| E | 24-hour outage — essential ops continue | **automated 24h-outage drill** (`edge.test.ts` — 60 transactions, crash mid-backlog, zero loss/duplication); field drill pending |
| F | CHPS full day offline then sync | ✅ PWA outbox + **UI offline drill** (`e2e/offline-drill.spec.ts`) + **automated backlog drill** (`edge.test.ts`); field drill pending |
| G | Large hospital concurrency | ✅ k6 load suite (`loadtest/`) — clinical mixed workload, read-heavy corridor, sync/idempotency bursts; per-tier scaling via flags (CHPS → district → region → national, spec §161). **Caught two real races on the way in** (parallel patient registration collided on MRN allocation; parallel queue check-ins collided on ticket numbers) — both fixed with atomic sequence counters (`PatientSequence`, `QueueSequence`), re-seeded baselines and regression tests |
| H | Device crash — transactions survive | **automated crash drill** (`edge.test.ts` — relay dies after the upstream applied but before the cursor persisted; restart re-sends, upstream dedupes, exactly once) on top of outbox + idempotency |
| I | Stolen phone — revocation blocks access | device block endpoint ✅ + **stolen-phone drill** (`devices.test.ts` — revoked device's next batch refused `DEVICE_REVOKED` even with a valid session; pushed data stays intact); mobile KDF pending |
| J | National-system outage while facility runs | ✅ national-outage drill (`edge.test.ts` — the facility edge keeps registering patients while the national platform is unreachable (relay fails, cursor untouched), then the full backlog drains with the same entity ids, exactly once); adapter phases pending |

### Offline drills — runbook

Every drill above is automated. Run them as the acceptance pass for any change touching sync, the outbox, or the edge relay:

**API layer** (Vitest, isolated SQLite — no dev stack needed):

```bash
cd apps/api
npx vitest run tests/edge.test.ts        # relay: batching, persisted cursor, 401 re-login, FAILED handling, multi-hop chains
npx vitest run tests/devices.test.ts     # device gate + stolen-phone drill (Test I)
npx vitest run tests/sync.test.ts        # outbox idempotency, FAILED recovery, consent/language preservation
npx vitest run tests/conflicts.test.ts   # two-device conflict detection + resolution (Test D)
```

| Drill | Proves |
|---|---|
| 24h-outage backlog (`edge.test.ts`) | a full offline day (60 transactions) drains through a real district in order, exactly once (Tests B/E/F) |
| Crash mid-backlog (`edge.test.ts`) | a relay dying after the upstream applied but before the cursor persisted re-sends and dedupes — zero loss, zero duplication (Test H) |
| Two-device conflict (`edge.test.ts`) | the losing edit is preserved at the edge, never relayed, and a `keep_client` resolution propagates upstream (Test D) |
| National outage (`edge.test.ts`) | the facility keeps working while the platform is unreachable and drains exactly once when it returns (Test J) |
| Stolen phone (`devices.test.ts`) | a revoked device's next batch is refused `DEVICE_REVOKED` even with a valid session; pushed data stays intact (Test I) |

**UI layer** (Playwright against the live dev stack — re-seed first):

```bash
cd apps/api && npm run db:seed
npx playwright test e2e/offline-drill.spec.ts          # registration queues offline, auto-syncs on reconnect
npx playwright test e2e/offline-dose-drill.spec.ts      # immunization dose queues offline, syncs
npx playwright test e2e/offline-combined-drill.spec.ts  # a multi-write session (dose + registration) replays together
npx playwright test e2e/offline-midsubmit-drill.spec.ts # a request that dies mid-flight is queued, not lost
npx playwright test e2e/offline-reports-drill.spec.ts   # cached report snapshot renders when unreachable
npx playwright test e2e/offline-lock-drill.spec.ts      # PIN lock works offline; the session survives
```

Notes:
- The UI drills use real browser network cuts (`context.setOffline(true)`) and route aborts; each pre-enrols its sync device (docs/21) so the replay path — not the enrollment queue — is what gets exercised.
- Re-seed between full-suite runs: several specs consume seed state (one pending device, one lab result, one claim…) and the drills add records; CI re-seeds before the suite.

## 3. Roadmap

**Security tests are implemented** (`e2e/security.spec.ts` — injection, privilege escalation, data leakage, session security, driven at the API layer against the live stack). **Load tests with k6 are implemented** (`loadtest/` — clinical, reads, sync; see `loadtest/README.md` for install, `RATE_LIMIT_MAX` guidance and per-tier scaling). **The PWA offline UI drills are implemented** — six specs in `e2e/` (`offline-drill`, `offline-dose-drill`, `offline-combined-drill`, `offline-midsubmit-drill`, `offline-reports-drill`, `offline-lock-drill`; see the runbook above) — the browser's network is really cut with `context.setOffline(true)`: forms still work, writes queue as PENDING IndexedDB outbox entries with exact payloads (spec §166 — never silently dropped), the badge shows the queued count immediately, the `online` event auto-replays, and the records land server-side exactly once; the drills pre-enrol their devices, since a fresh context would otherwise be refused `DEVICE_PENDING_APPROVAL` by design — docs/21. **Offline field drills are implemented** (Tests B/D/E/F/H/I/J): the 24h-outage backlog drill in `tests/edge.test.ts` pushes a 60-transaction offline day through a real district in order and exactly once, crashing mid-backlog to prove transactions survive; the two-device conflict drill proves the loser is preserved at the edge, never relayed, and a `keep_client` resolution propagates upstream so tiers converge (this surfaced a real gap — resolved conflicts never flipped their mutation log row, so the corrected outcome could not relay; fixed); the national-outage drill proves the facility keeps working while the platform is unreachable and drains exactly once when it returns; the stolen-phone drill in `tests/devices.test.ts` proves a revoked device's next batch is refused `DEVICE_REVOKED` even with a valid session and that pushed data stays intact. The per-module behavioural E2E suite is implemented and green (`npm run test:e2e`).
