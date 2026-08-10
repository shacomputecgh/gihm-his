# 07 — API Specification

Interactive docs: run the API and open **http://localhost:4000/docs** (Swagger UI).

**Base path:** `/api/v1` · **Auth:** `Authorization: Bearer <JWT>` · **Envelope:** success returns data directly; errors return `{ "error": { "code", "message", "candidates? } }`.

## 1. Public endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Service health + DB probe |
| POST | `/auth/login` | Login (rate-limited 10/min) → `{ token, user }` |
| GET | `/geography/regions` | 16 regions with district/facility counts |
| GET | `/geography/districts?regionId=` | Districts (optionally filtered) |
| GET | `/facilities?q&regionId&districtId&type&ownership&page&pageSize` | Directory search (paged) |
| GET | `/facilities/:id` | Facility public profile |

## 2. Authenticated (staff) endpoints

| Method | Path | Permission |
|---|---|---|
| GET | `/auth/me` | auth |
| POST | `/patients` | `create_patient` — MPI check; **409** `MPI_DUPLICATE` with candidates unless `force:true` |
| GET | `/patients?q&page` | `view_patient` (scoped) |
| GET | `/patients/:id` | `view_patient` — longitudinal record |
| POST | `/patients/:id/encounters` | `write_clinical_note` — triage + vitals |
| POST | `/patients/:id/notes` | `write_clinical_note` |
| POST | `/patients/:id/lab-orders` | `order_lab` |
| POST | `/patients/:id/lab-orders/:orderId/result` | `verify_lab` (critical flag) |
| POST | `/patients/:id/prescriptions` | `prescribe` |
| POST | `/patients/:id/prescriptions/:rxId/dispense` | `dispense` |
| POST | `/patients/:id/admissions` · `/:admId/discharge` | `write_clinical_note` |
| GET | `/appointments?date&status` · POST `/appointments` (idempotent) · `/appointments/:id/status` | `view_appointments` |
| GET | `/queue` · POST `/queue/:id/status` | `view_queue`/`manage_queue` |
| GET | `/dashboard/stats` | `view_dashboard` |
| POST | `/devices/register` · GET `/devices` · `/admin/devices/:deviceId/status` | auth / `manage_devices` |
| GET | `/admin/audit?take=` | `view_audit` |
| POST | `/sync/mutations` | `sync_data` — see `docs/15` |
| GET | `/sync/status?deviceId=` | auth |

## 3. Offline sync payload (spec §100, §129)

```jsonc
POST /api/v1/sync/mutations
{
  "deviceId": "uuid-or-slug",
  "mutations": [{
    "transactionId": "client-uuid",       // idempotent per transaction
    "entityType": "patient|encounter|labOrder|prescription|appointment|admission|invoice|immunization",
    "operation": "CREATE|UPDATE",
    "idempotencyKey": "client-uuid",      // idempotent per logical action
    "clientTimestamp": "2026-08-09T10:00:00Z",
    "payload": { ... }
  }]
}
// → { processed, failed, results: [{ transactionId, status, entityId?, duplicated? }] }
```

Idempotency rules: a repeated `transactionId` returns the original result without re-applying; a repeated `idempotencyKey` for the same entity type returns the existing record. Failed items are recorded in `MutationLog` — never silently dropped (spec §166).
