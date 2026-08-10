# 19 — Testing Strategy

## 1. Implemented in this build

| Layer | What | Where |
|---|---|---|
| Unit/Integration (API) | auth flow (login/me/401s), facility directory search, patient registration + **MPI duplicate → 409**, scope denial (403), **sync idempotency** (retried transaction never duplicates), failed-mutation recording, device registration | `apps/api/tests/*.test.ts` (Vitest, isolated SQLite DB, auto schema reset) |
| Typecheck | strict TS both apps | `npm run typecheck` |
| Build | Vite production build | `npm run build` |

## 2. Mandatory offline tests (spec §162 — Test A–J)

| Test | Scenario | Status |
|---|---|---|
| A | Web+Windows+Android+iOS simultaneously | P1 prototype: web only |
| B | Internet failure — Windows + Android + edge continue | outbox works in PWA; native phases pending |
| C | Reconnection — all pending sync automatically | ✅ covered by sync engine + tests |
| D | Offline conflict between two devices | design documented (§15); server logic Phase 6 |
| E | 24-hour outage — essential ops continue | architecture validated by outbox; formal drill pending |
| F | CHPS full day offline then sync | ✅ PWA outbox; field drill pending |
| G | Large hospital concurrency | load tests pending (CHPS→district→region→national scale, spec §161) |
| H | Device crash — transactions survive | outbox + idempotency; crash drill pending |
| I | Stolen phone — revocation blocks access | device block endpoint ✅; mobile KDF pending |
| J | National-system outage while facility runs | integration isolation by design; adapter phases pending |

## 3. Roadmap

Security tests (injection, privilege escalation, data leakage, session security) and E2E tests (registration → OPD → prescription → lab → discharge → billing) via Playwright; load tests with k6 at each scale tier.
