# 24 — System Settings Administration

All system configuration — including SMS/WhatsApp gateway API keys — can be viewed and
edited at runtime from **Administration → Settings**, with no `.env` edit and no restart.
The core reference data (EPI schedule, roles & permissions, facilities, geography) is
editable from **Administration → EPI schedule / Roles & permissions / Facilities & geography**
(see "Editable master data" below).

## How it works

- **`SystemSetting` table** (`apps/api/prisma/schema.prisma`) stores key/value rows.
  A row with a **non-empty value wins over the environment variable**; a row with an
  **empty value** counts as unset; **deleting the row** restores the env default.
- **`apps/api/src/lib/settings.ts`** is the single resolver. `getSetting(key)` returns the
  DB value if one exists, otherwise the mapped env var (boot default). The cache is loaded
  at app boot (`initSettings` in `buildApp`) and refreshed on every admin save.
- **`lib/sms.ts`** reads every credential through the settings store, so a key changed in
  the UI is used by the next dispatch — reminders, the delivery webhook guard and the
  reminder sweep all resolve the same way.
- The **reminder sweep config** is re-read on every run (`getReminderJobConfig`), so
  interval/window edits apply without a restart.

## Admin API

All three endpoints require the `manage_system_settings` permission (granted to
`NATIONAL_ADMIN`, `HOSPITAL_ADMIN` and `IT_ADMIN` in the seed).

| Endpoint | Purpose |
| --- | --- |
| `GET  /api/v1/admin/settings` | List every definition with its effective value. **Secrets are masked** (`••••••••` + last 4) and never returned in full. |
| `PUT  /api/v1/admin/settings` | Body `{ updates: [{ key, value }] }`. Empty value = clear to env default; unknown keys are rejected (400). Audit-logged as `system.settings.update` — **keys/groups only, never values**. |
| `POST /api/v1/admin/settings/test-sms` | Connectivity test for the active SMS provider. For SMSOnlineGH it queries the v5 account balance (proves the API key works); other providers report configured-state. Audit-logged as `system.settings.test`. |

## Managed settings

- **SMS gateway** (`sms.*`): provider, SMSOnlineGH endpoint/API key/sender ID/delivery
  callback URL + token, Hubtel client id/secret/sender, Twilio SID/token/phone.
- **WhatsApp** (`wa.*`): provider, Hubtel endpoint/client id/secret/sender, SMSOnlineGH
  endpoint.
- **Reminder sweep** (`reminder.*`): enabled, interval, window, look-back, and the
  **due/overdue message templates** (placeholders `{patientName} {description} {dose} {dueDate}`).
- **Application** (`app.*`): web origin (CORS — applied live), timezone (applied live),
  port and JWT secret (both marked `restart` — they take effect on the next restart and are
  hidden from the admin UI, but remain editable via the same API for operators).

## Editable master data

Beyond runtime configuration, the core *reference data* of the system is editable from
**Administration** — no code change and no re-seed needed. All endpoints live under
`/api/v1/admin/masterdata/*`, require their matching permission and are fully audit-logged.

### EPI immunization schedule (`manage_epi_schedule`)

| Endpoint | Purpose |
| --- | --- |
| `GET  /api/v1/admin/masterdata/epi-schedule` | Effective schedule with provenance (`default` vs `custom`) and `active` flags. |
| `PUT  /api/v1/admin/masterdata/epi-schedule` | Bulk override — body `{ items: [{ vaccine, dose, label, description, ageDays, intervalDays, active }] }`. Upserts a `EpiScheduleItem` row per item; the runtime overlay (`lib/epiSchedule.ts`) refreshes immediately, so every due-date calculation, the due/overdue worklists and the patient portal use the new schedule at once. `active:false` deactivates an entry (removed from the schedule, still listed for re-enabling). |
| `POST /api/v1/admin/masterdata/epi-schedule/reset` | Deletes all rows — back to the built-in Ghana defaults. |

Validation: age/interval must be ≥ 0; both may be null (e.g. TT dose 1, due at first ANC visit).
The dev seed writes the default schedule as rows so the editor starts populated; rows that
still match the built-in default are reported as `default` in the UI.

**Coverage follows the schedule.** The coverage analytics endpoint
(`GET /immunizations/coverage`) resolves each dose's due age through the same overlay, so an
edited due age changes the eligible cohort (denominator) immediately. The EPI schedule editor
embeds a live **Coverage with this schedule** panel that recomputes after every save — admins
can see the effect of a schedule change before/after, and the reset restores the original
numbers.

### Configuration audit (`view_audit`)

`GET /admin/audit/config` returns every settings and masterdata change as a readable timeline
(actor, label, parsed summary — never values). The **Administration → Config audit** tab
renders it. Settings secrets never reach the audit trail at write time, so the config audit
surface is inherently secret-free.

### Roles & permissions (`manage_roles_permissions`)

| Endpoint | Purpose |
| --- | --- |
| `GET /api/v1/admin/masterdata/roles` | All roles with their permission arrays + the full permission catalog (`apps/api/src/lib/permissions.ts`). |
| `PUT /api/v1/admin/masterdata/roles/:code` | Edit `name`, `scope` and/or `permissions` (array of catalog codes). Unknown codes are rejected; the `PATIENT` role must keep `self_access` and the `PATIENT` scope. |

Permission changes apply on the role's **next login** (permissions are resolved into the JWT
at login). The catalog is the single source of truth also used by the seed.

### Facilities & departments (`manage_facility`)

| Endpoint | Purpose |
| --- | --- |
| `GET /api/v1/admin/masterdata/facilities` | National facility registry (name/code/type/status/contact/services/departments). |
| `PUT /api/v1/admin/masterdata/facilities/:id` | Edit profile fields; `services` and `departments` arrays are JSON columns, and department rows are reconciled (missing ones created for the queue — nothing is silently deleted). |

### Regions & districts (`manage_region` / `manage_district`)

| Endpoint | Purpose |
| --- | --- |
| `GET  /api/v1/admin/masterdata/geography` | Regions with their districts (name/code/type/capital/status). |
| `PUT  /api/v1/admin/masterdata/regions/:id` | Rename, change capital, toggle `ACTIVE`/`INACTIVE`. |
| `PUT  /api/v1/admin/masterdata/districts/:id` | Rename, change capital/type (`METROPOLITAN`/`MUNICIPAL`/`DISTRICT`), toggle status. |

## Security notes

- Secrets are stored in the DB **in plaintext** (required for runtime editing — there is no
  server-side key to encrypt with that isn't itself an env var). For production, encrypt the
  `value` column with an env-provided key (e.g. `SETTINGS_ENC_KEY`) or move secrets to a
  dedicated secrets store; the masked API surface and audit discipline stay the same.
- To **disable** a gateway that is configured in env (clearing falls back to the env
  default), set the provider to `off` — e.g. `sms.provider = off` stops all SMS dispatch
  without touching `.env`.
- Secrets are **masked** in every API response and **never written to the audit trail**.
- The delivery-callback webhook stays fail-closed: when a callback URL is configured, a
  callback token is mandatory (`SMSONLINEGH_CALLBACK_TOKEN` → `sms.smsonlinegh.callbackToken`).
- Env vars remain the boot defaults — `.env.example` documents every key.
- The JWT secret and port are restart-scoped: they can be edited through the API (marked
  `restart` in the definition) but take effect on the next restart and are hidden from the
  admin UI to avoid surprising live changes. Web origin and timezone apply live.
- Masterdata edits are guarded per-area (see the permission table above) and every change is
  audit-logged (`masterdata.*`) with the changed keys — never the surrounding data.
- EPI schedule overrides are single-node like settings: the in-process overlay refreshes on
  edit; a cross-node refresh would need a pub/sub push (out of scope).
- Settings are single-node: with multiple API instances each writes to the same DB, and the
  cache refreshes on boot/save — a cross-node push would need a pub/sub refresh (out of scope).
