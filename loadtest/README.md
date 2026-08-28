# Load tests (k6)

Large-hospital concurrency coverage for docs/19 test G (spec §161). Each
scenario drives the **live API** over HTTP as real concurrent staff sessions
would — no test doubles, no unit mocks. They are meant to run against a
seeded dev/CI stack (`npm run db:push && npm run db:seed`), and each tier is
scaled with plain k6 flags so the same script covers CHPS → district →
region → national.

## Prerequisites

k6 is **not** installed by `npm install` (the `k6` npm package is only a
typing stub). Get the binary for your platform:

- **Debian/Ubuntu**: `sudo gpg -k https://dl.k6.io/key.gpg && echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list && sudo apt-get update && sudo apt-get install k6`
- **macOS**: `brew install k6`
- **Windows**: `choco install k6`
- **Any platform** — download the release tarball from
  https://github.com/grafana/k6/releases/latest and put the `k6` binary on
  your `PATH`.

Then verify: `k6 version`.

## Running

Start the stack first (fresh seed recommended so patient counts stay small):

```bash
npm run dev          # API on :4000, web on :5173
```

**The API's global rate limit (300 req/min/IP, `RATE_LIMIT_MAX`) is a real
operational guard — a load run legitimately exceeds it.** Point the load run
at a server started with the limit raised:

```bash
RATE_LIMIT_MAX=10000 npm run dev
```

Then run a scenario:

```bash
# Clinical mixed workload (registration → queue → encounter → lab → pharmacy)
k6 run loadtest/clinical.js

# Read-heavy (dashboards, searches, worklists)
k6 run loadtest/reads.js

# Sync + concurrency (offline outbox batches, idempotent replays)
k6 run loadtest/sync.js
```

### Scale tiers (spec §161)

The same scripts scale via k6 flags — pick the tier you are sizing:

| Tier | Example |
|---|---|
| CHPS | `k6 run --vus 5 --duration 30s loadtest/clinical.js` |
| District hospital | `k6 run --vus 20 --duration 1m loadtest/clinical.js` |
| Regional | `k6 run --vus 50 --duration 2m loadtest/clinical.js` |
| National | `k6 run --vus 100 --duration 3m loadtest/clinical.js` |

`sync.js` defaults to 5 VUs (one facility's offline devices bursting on
reconnection); scale with the same flags. Note that SQLite serialises writes:
the dev stack is the correctness floor, and national-tier write runs should
target the Postgres deployment via `API_BASE`.

Environment overrides: `API_BASE` (default `http://localhost:4000/api/v1`),
`LOGIN_EMAIL` / `LOGIN_PASSWORD` (default `doctor@demo.gh` / `Demo@123`).

## What is asserted

Each script ends with `checks` (functional: the right status code / the right
shape — e.g. a queue ticket is issued, an idempotent sync replay is marked
`duplicated`) and **thresholds** (load: `< 2%` request failure, `p95 < 1s`
on every endpoint group). A regression that breaks the workflow or blows the
latency budget fails the run with a non-zero exit code — wire it into CI the
same way the vitest/Playwright suites are.

## Notes

- Runs against a **real dev database** and creates real rows (patients,
  encounters, lab orders, queue tickets, mutation-log entries). Re-seed
  between runs for reproducible patient counts and ticket baselines.
- SQLite-backed dev is the floor, not the ceiling: the same scripts point at
  the Postgres/MySQL deployment via `API_BASE` for national-tier sizing.
- Auth is per-VU (each virtual user logs in once, like a real staff member),
  so login is part of the measured workload — a lockout-setting regression
  will show up here.
