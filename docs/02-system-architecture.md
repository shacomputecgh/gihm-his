# 02 — System Architecture

## 1. Topology

```
            PUBLIC WEB (portal + /app + /patient)
                       │  HTTPS / REST
                       ▼
              ┌─────────────────┐
              │  GIHM-HIS API    │  Fastify + Prisma
              │  /api/v1/*       │  auth · RBAC · audit · sync
              └────────┬────────┘
                       │
              ┌────────┴────────┐
              │   Database      │  SQLite (dev) → PostgreSQL (prod)
              └─────────────────┘
```

## 2. Client architecture (omnichannel — spec §89, §99)

All clients share **one business model** exposed through the API. This prototype ships the **web/PWA** client (React + Vite + Tailwind). Windows/Android/iOS clients are designed as thin API consumers in later phases; the offline sync protocol already supports them.

## 3. Server modules

| Module | Responsibility |
|---|---|
| `auth` | login (rate-limited), `/auth/me`, JWT issuance |
| `geography` | regions + districts master data (public) |
| `facilities` | national facility registry + public profiles |
| `patients` | registration + MPI, search (scoped), longitudinal record, encounters, notes, labs, prescriptions, admissions |
| `appointments` | booking (idempotent), status transitions, queue board |
| `dashboard` | operational aggregates + 7-day trend |
| `admin` | device registry/status, audit log |
| `sync` | idempotent batched mutation application (outbox replay) |
| `health` | service health incl. DB probe |

## 4. Data scoping (spec §62, §125)

Every query is scoped by the caller's role scope:

| Scope | Patients visible |
|---|---|
| `NATIONAL` | all (aggregate views only for national users) |
| `REGIONAL` | patients in the user's region |
| `DISTRICT` | patients in the user's district |
| `FACILITY` | patients registered at the user's facility |
| `PATIENT` | the user's own record only |

## 5. Key decisions & trade-offs

- **SQLite for dev** — zero infrastructure; schema deliberately written without SQLite-only types so the PostgreSQL switch is a one-line provider change (see `docs/17`).
- **Manual validation** — compact runtime validators instead of a schema-per-route; Swagger UI still auto-generated at `/docs`.
- **Sync over REST** — the offline client posts batched idempotent mutations; the same endpoints are used by future native clients.
