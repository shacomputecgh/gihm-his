# 23 — Immunization Registry

Ghana EPI schedule, dose recording with auto-computed next-due dates, defaulter-tracking
worklist, missed-dose follow-up, SMS reminder recalls, coverage analytics and CSV exports.

## 1. Schedule (single source of truth)

`apps/api/src/modules/immunization/schedule.ts` — 27 doses across BCG, OPV, PENTA, PCV, ROTA,
IPV, Measles-Rubella, YF, HPV, TT and COVID-19. Each item carries:

- `ageDays` — due age measured from **date of birth** (child doses, e.g. PENTA-1 at 42 days)
- `intervalDays` — due offset measured from the **previous dose** (repeat/adult doses, e.g. TT-2
  at 28 days after TT-1, HPV-2 at 180 days)

The same module powers the API routes and the seed script, so the schedule can never drift
between what the system computes and what it demonstrates.

## 2. Dose recording

`POST /immunizations` — validates the vaccine/dose against the schedule, checks duplicates
(409), rejects future dates, and **auto-computes the next due date**:

```
child dose  → nextDueAt = dateOfBirth + nextDose.ageDays
repeat dose → nextDueAt = administeredAt + nextDose.intervalDays
```

Every write is audit-logged (`immunization.create`). Recording a dose that was previously
marked missed automatically **resolves** the follow-up.

## 3. Defaulter worklist

`GET /immunizations/due` — the latest given dose per patient+vaccine drives the next due date.
**All** given rows are considered (including completed series whose `nextDueAt` is null), so a
finished vaccine supersedes earlier doses' stale next-due dates instead of re-flagging the child
as overdue. Rows surface the dose that is actually due — the schedule successor — so the worklist
reads "PENTA 2 overdue" and the quick "Record dose" action pre-fills the right dose.

- Buckets: `OVERDUE` (past due) / `DUE_SOON` (within the look-ahead window, default 30 days)
- Whole-scope summary counts are computed **before** bucket/search filters so the stat cards
  stay truthful while the user narrows the list
- Search by name/MRN; patients can call this endpoint too (`self_access`) and see only their
  own record — powers the patient-portal reminder card

## 4. Missed-dose follow-up

- `POST /immunizations/:id/mark-missed` — documents a defaulter (keeps `nextDueAt` as the
  "missed since" date)
- `GET /immunizations/missed` — lists defaulters showing the missed dose; a follow-up
  **drops off automatically** once the child returns and the dose is recorded as given

## 5. Reminder recalls (SMS / WhatsApp)

`POST /immunizations/:id/remind` — validates channel (`SMS` default, `WHATSAPP`), builds a
reminder message naming the dose that is actually due, and dispatches it through
`apps/api/src/lib/sms.ts`. The web worklist carries a **Remind via SMS / Remind via
WhatsApp** selector (Due & overdue and Follow-up tabs) that drives the channel.
`POST /immunizations/reminders/bulk` recalls a **selected set of doses** in one call
(`{ ids, channel }`, bounded to 200, deduped, scoped) — the worklist checkboxes plus
**Remind selected (N)** drive it, and one audit entry (`immunization.remind.bulk`)
summarises the batch (with a visible `skipped` count so callers can reconcile the list,
and an honest 400 when more than 200 ids are sent — never a silent truncation).
`POST /immunizations/reminders/remind-all` is the **one-click "Remind all due"**: it
applies the *current worklist filter* (window, bucket, search) and recalls every
matching dose without a checkbox selection — same channel handling, message, scope and
skip rules as `/bulk` (shared `dispatchReminderBatch` helper), bounded to 200, audited
as `immunization.remind.all`. `GET /immunizations/export/reminders` (CSV) is the
**per-facility reminder run report**: every dispatch in the window joined to patient,
MRN, phone, vaccine, dose, channel, provider and outcome — with optional `channel` and
`facilityId` filters. The worklist's **Reminder report** tab renders the same data
in-app (attempted / dispatched / rejected stat cards + the recent runs table).

**Dry-run preview.** `POST /immunizations/reminders/bulk` and `/reminders/remind-all`
accept a `dryRun: true` flag: they count exactly what WOULD be sent (per channel,
no-phone, opted-out and skipped) **without dispatching anything** — audited as
`immunization.remind.bulk.preview` / `immunization.remind.all.preview`, and every result
row carries an explicit `dryRun: true` marker so a consumer never mistakes a preview
row for a real dispatch. The worklist's **Preview all / Preview selected** buttons drive
it, so a team can size a recall before spending gateway credits.

**Reminder consent at registration.** The registration form captures SMS/WhatsApp reminder
consent (a checkbox, default ON) — unchecking stores `reminderOptOut: true` from day one —
plus a **preferred language** (`Patient.preferredLanguage`: EN/TW/FA/EE/GA/HA/DA/FR) for
future localized outreach. Both persist on `patient.create`; the same preference stays
editable anytime from the patient record — a language selector on the record page drives
`PATCH /patients/:id/preferred-language` (validated against the language codes, audited as
`patient.preferred-language.change`) — alongside the consent badge.

**Patient opt-out.** A per-patient preference (`Patient.reminderOptOut`, toggled from
the patient record via `PATCH /patients/:id/reminder-opt-out`) — opted-out patients are
**never contacted**: the single remind returns a logged non-dispatch, and the bulk,
remind-all, the scheduled sweep **and offline-queued REMIND replays** all skip them and
count them in the summary (`optedOut`) rather than erroring. Opted-out skips are audited
under the dedicated action `immunization.remind.optedOut` — never `immunization.remind`
— so a click before the preference is lifted cannot read as "already reminded" to the
sweep's look-back dedupe. Single remind, bulk and remind-all each **surface and audit
the skipped families per-row** (results carry an `optedOut` marker with a note, and each
row is audit-logged under the dedicated action, so the reminder report rolls opt-outs up
by district/region); the scheduled sweep counts them in its run summary instead (a daily
national job must not spam the trail). Worklist rows show a **No reminders** badge. The **auto-reminder sweep** dispatches over `reminder.autoChannel`
(`REMINDER_AUTO_CHANNEL`): `SMS` (default), `WHATSAPP` or `BOTH` — editable from the
admin Settings page (Reminders group), so recalls scale to WhatsApp without manual clicks:

- **SMSOnlineGH (default)** — `POST https://api.smsonlinegh.com/v5/message/sms/send`
  (**verified live**). Auth is `Authorization: key <SMSONLINEGH_API_KEY>` — note the
  `key ` prefix, not Bearer — with a JSON body `{ text, type: 0, sender, destinations: [...] }`
  (a `destinations` array, not a single recipient). Success is `handshake.id === 0`;
  per-destination status labels are surfaced (`DS_REJECTED_*` = refused, e.g.
  `DS_REJECTED_SENDER_UNREGISTERED`). **`SMSONLINEGH_SENDER_ID` is required for live sends**
  and must be a sender ID registered to the account (else `MV_ERR_SENDER` / destination
  rejection). Setting just `SMSONLINEGH_API_KEY` selects the provider (`SMS_PROVIDER=smsonlinegh`
  also works); `SMSONLINEGH_URL` overrides the endpoint. Phone numbers are normalized to
  international format (`0244…` → `233244…`). Uses the global `fetch` (no SDK dep)
- **Hubtel** — `GET https://smsc.hubtel.com/v1/messages/send` with `clientid`,
  `clientsecret`, `from`, `to`, `content` query params; `SMS_PROVIDER=hubtel` (or set
  `HUBTEL_CLIENT_ID` / `HUBTEL_CLIENT_SECRET` when no key is present and it is inferred).
  `HUBTEL_SENDER_ID` sets the sender name (default `HM`, Hubtel's test sender)
- **WhatsApp** — `channel=WHATSAPP` is provider-aware:
  - `WHATSAPP_PROVIDER=hubtel` (default) — Hubtel WhatsApp Business API, endpoint
    configurable via `HUBTEL_WHATSAPP_URL` (default `https://api.wa.hubtel.com/v1/messages/send`).
    **Verification steps:** confirm the endpoint + sender with Hubtel support (docs change),
    register the WhatsApp sender number (`HUBTEL_WHATSAPP_SENDER_ID`, default `HM`), and set
    `HUBTEL_WHATSAPP_CLIENT_ID` / `HUBTEL_WHATSAPP_CLIENT_SECRET` (falls back to the SMS
    client id/secret)
  - `WHATSAPP_PROVIDER=smsonlinegh` — reuses `SMSONLINEGH_API_KEY` / `SMSONLINEGH_SENDER_ID`;
    endpoint env-configurable (`SMSONLINEGH_WHATSAPP_URL`). **Unverified:** SMSOnlineGH's public
    docs don't document WhatsApp, so confirm your account supports it — an unsupported send
    is handshake-rejected and audit-logged, never dropped
- **Alternative** — `SMS_PROVIDER=twilio` with `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
  `TWILIO_PHONE_NUMBER`
- **Unconfigured or no phone on file** → degraded to a logged, non-dispatched recall — the
  reminder is **never silently dropped** (audit action `immunization.remind` records the
  channel, recipient, message, provider and message id)

### 5b. Delivery-status tracking

SMSOnlineGH has **no per-message polling API** — delivery notifications are pushed. When
`SMSONLINEGH_CALLBACK_URL` is set, every send includes `callback: { url, accept: 'application/json' }`
and the gateway pushes delivery updates to:

- `POST /immunizations/reminders/delivery-callback` — inbound webhook (no auth; guarded by a
  shared secret when `SMSONLINEGH_CALLBACK_TOKEN` is set, via `x-callback-token` or `?token=`).
  Tolerantly records the notification on the audit trail as `immunization.remind.delivery`
  (action, entity = message id/batch id, raw payload preserved)
- `GET /immunizations/reminders/status/:messageId` — delivery status for a sent reminder:
  the original dispatch record plus any delivery notifications for that message id
  (`view_reports` / `view_audit`)
- `GET /immunizations/reminders/report?days=30` — delivery report from the audit trail:
  totals (attempted / dispatched / rejected / no-phone / gateway-off **/ opted-out**),
  breakdowns by channel and provider, a **district + region roll-up** (patients without a
  district roll into "Unspecified"), delivery-status counts from webhook notifications, and
  recent rows (dispatches **and** opt-out skips, each tagged with its district/region).
  The report tab renders the opted-out stat, a reach-by-district chart, and the drill-down
  table; Export CSV mirrors the dispatch journal (`days` + optional `channel` / `facilityId` /
  `district` / `region` filters, `District` / `Region` columns — opted-out skips are counted
  in the report but deliberately excluded from the CSV, which is who was actually sent to)
  (`view_reports` / `view_audit`)

Offline-queued reminders replay through `/sync/mutations` (`immunization.REMIND`) and dispatch
when the device reconnects.

### 5a. Scheduled auto-reminder sweep

`apps/api/src/modules/immunization/reminders.ts` — `runScheduledReminders` scans the defaulter
worklist (national scope) for children due or overdue within the look-ahead window and
dispatches recalls, **deduped by the audit look-back** (a dose already recalled — manually or
by the sweep — within the look-back window is skipped; no schema change needed). Every recall
is audit-logged as `immunization.remind.auto`.

The server runs the sweep shortly after boot and then on an interval:

```
REMINDER_JOB_ENABLED=true          # default true
REMINDER_JOB_INTERVAL_MINUTES=1440 # default 24h
REMINDER_JOB_WINDOW_DAYS=7         # recall children due/overdue within this window
REMINDER_JOB_LOOKBACK_DAYS=7       # don't re-remind within this window
```

Ops can also trigger it on demand: `POST /immunizations/reminders/run` (guarded by
`view_reports` / `view_audit` / `sync_data`). Overlapping runs are skipped so a slow sweep can
never double-send. Without gateway credentials the sweep is a graceful no-op that still logs
the attempt.

## 6. Coverage analytics

`GET /immunizations/coverage` — dose-level coverage within the caller's scope (national sees
national, facility sees its registered cohort). Denominator = children in scope who have
reached each dose's due age; numerator = those with the dose recorded as given.

Indicators: BCG-0, PENTA-1/3, OPV-3, PCV-3, ROTA-2, Measles-Rubella-1, Yellow fever, plus the
**PENTA1→PENTA3 dropout rate** and **fully-immunized coverage** on the 12-month cohort (all key
child doses). Surfaced on the directorate dashboard (compact) and the registry page (full).

## 7. CSV exports

`GET /immunizations/export/due` · `export/missed` · `export/coverage` — scoped, PII-safe-for-
role CSV downloads (`text/csv` + `Content-Disposition` attachment) reusing the same computation
helpers as the JSON endpoints. Guarded by `view_reports` / `view_dashboard` (+
`view_clinical_record` for the patient lists).

## 8. Offline support

`immunization.CREATE` mutations replay through the sync outbox with the same validation as the
online route: schedule check, patient scope, duplicate rejection (surfaces as FAILED, never a
silent double-dose) and auto next-due computation. The record forms (registry page and patient
record page) queue locally on network failure with an offline banner.

## 9. Scope & security

Rows are scoped through the patient geography: regional/district users see their
region/district's children; facility users see doses given at **or** patients registered at
their facility (mirrors the referral OR-scope); patients see only their own record. Missing
scope anchors deny (`__deny__` sentinel) — never national totals. Coverage and exports never
leak patient-identifiable data at aggregate levels (spec §59).
