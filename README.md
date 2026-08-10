# GIHM-HIS — Ghana Integrated Health Management & Hospital Information System

**Foundation prototype** — a secure, offline-first, interoperable national healthcare digital-infrastructure platform for Ghana: public healthcare portal, national facility directory, hospital information system, patient portal and a Master Patient Index — one shared architecture for Web + PWA today, with Windows/Android/iOS and facility-edge planned on the same sync protocol.

> ⚠️ **DEMO / SYNTHETIC DATA ONLY.** All patients, facilities, contacts and clinical records in this repo are fictional. Not affiliated with or endorsed by the Ministry of Health or the Ghana Health Service. No official facility statistics are fabricated.

## What's inside

```
apps/api     Fastify + Prisma API (auth/RBAC, geography, facilities, patients+MPI,
             appointments+queue, clinical orders, sync, audit) — docs at /docs
apps/web     React + Vite + Tailwind v4 + PWA — public portal, /app hospital admin,
             /patient portal, offline outbox sync
docs/        22 pre-production documents (PRD, ERD, security, offline sync, …)
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
| `hospital@demo.gh` | Korle-Bu Hospital Admin |
| `doctor@demo.gh` | Doctor (OPD, prescriptions, lab orders) |
| `nurse@demo.gh` / `pharmacist@demo.gh` / `lab@demo.gh` / `cashier@demo.gh` | ward / pharmacy / lab / billing |
| `chw@demo.gh` | Community Health Worker |
| `patient@demo.gh` | Patient portal (own record only) |

## Verify

```bash
npm test               # API tests (auth, facilities, MPI, scope, sync idempotency)
npm run typecheck      # strict TS across both apps
npm run build          # production web build
```

## Key design decisions (see docs/)

- **Offline-first, not afterthought**: every client write carries `clientTimestamp` + `idempotencyKey`; the web client queues writes in an IndexedDB outbox and replays them idempotently via `/api/v1/sync/mutations` (§100–104).
- **Master Patient Index**: duplicates are scored and surfaced for review (HTTP 409 `MPI_DUPLICATE`); records are never silently merged (§12).
- **Scope enforcement**: NATIONAL / REGIONAL / DISTRICT / FACILITY / PATIENT data boundaries on every query (§62).
- **SQLite for dev, PostgreSQL for prod**: the Prisma schema is portable (no SQLite-only types) — production switches `provider` to `postgresql` (see docs/17).
- **Audit everywhere**: every write records actor, entity, before/after JSON, device and IP (§67).

## Repository map

| Path | Purpose |
|---|---|
| `apps/api/prisma/schema.prisma` | data model (24 entities) |
| `apps/api/prisma/data/geography.ts` | GSS 16 regions / 261 districts |
| `apps/api/prisma/data/facilities.ts` | synthetic facility registry |
| `apps/api/prisma/seed.ts` | full synthetic demo dataset |
| `apps/api/src/modules/*` | auth, geography, facilities, patients, appointments, dashboard, admin, sync |
| `apps/web/src/pages/portal|app|patient` | portal, hospital admin, patient portal |
| `apps/web/src/lib/offline.ts` | outbox + idempotent sync engine |
| `docs/` | the 22 pre-production documents |
