# 25 — Developer Mode (Platform Control)

The platform developer sits **above** every role in the system — including
`NATIONAL_ADMIN` (and any future super-admin). Developer Mode is the single
place where the developer can control accounts, security policy, licensing and
the full audit trail.

- **Demo account:** `developer@demo.gh` / `Demo@123` (seed)
- **UI:** the Developer page (nav: **Developer**, shown only to the DEVELOPER
  scope) with tabs: Overview · Users · Security · Licensing · Audit · Alerts · System
- **Guard:** every `/admin/developer/*` route requires the `developer_mode`
  permission — which only the seeded `DEVELOPER` role holds — **and** the
  DEVELOPER scope bypasses every permission guard in the system
  (`lib/guards.ts`).

> **Why a scope, not a permission?** `requirePermission` checks permissions for
> staff scopes. The DEVELOPER scope short-circuits *before* the permission
> check, so no admin — however privileged — can ever grant themselves
> developer power, and no developer account can be accidentally demoted to a
> permission set that locks them out. The scope is structural.

## 1. Scope bypass (`lib/guards.ts`)

```ts
if (u.scope === 'DEVELOPER') return; // every guard passes
```

- The DEVELOPER scope alone unlocks every protected endpoint, with zero
  permissions required.
- `manage_roles_permissions` grants the ability to *edit roles*; it does **not**
  grant the ability to edit the DEVELOPER role or to grant the DEVELOPER scope
  (the roles editor rejects a scope change to DEVELOPER, and unknown codes are
  rejected — see docs/24).

## 2. Account control (Users tab)

- `GET/POST /admin/developer/users` — list every account (with raw role
  permissions) and create **any** account, including DEVELOPER and
  NATIONAL_ADMIN.
- `PUT /admin/developer/users/:id` — change status (`ACTIVE | SUSPENDED |
  LOCKED`), role or scope bindings of any account.
- `POST /admin/developer/users/:id/password` — set any password (the global
  security policy minimum is enforced).
- `POST /admin/developer/users/:id/impersonate` — issue a session token **as
  that user**. The UI switches the session ("Log in as") and the audit trail
  records both the impersonator and the target. Log out to end the
  impersonated session, then sign back in as the developer.
- Every action is audit-logged (`developer.user.create`,
  `developer.user.update`, `developer.user.password`, `developer.impersonate`).

### Admin user management (docs/24 complement)

`GET/POST /admin/users`, `PUT /admin/users/:id/status`,
`PUT /admin/users/:id/role`, `POST /admin/users/:id/password` — the
`manage_users` path used by facility/national admins. Two hard rails:

- The `DEVELOPER` role is **never** assignable via this path (creation, role
  change) — only the developer can create developer accounts.
- Licensed capacity limits are enforced at the same boundary (below).

## 3. Security policy (Security tab)

`GET/PUT /admin/developer/security` manages three global controls, applied
immediately (no restart) and **all enforced at runtime**:

| Setting | Env default | Range | Enforcement |
|---|---|---|---|
| `security.passwordMinLength` | `PASSWORD_MIN_LENGTH` (8) | 4–64 | Every password set/reset for every role |
| `security.lockoutThreshold` | `LOGIN_LOCKOUT_THRESHOLD` (5) | 1–20 | Failed logins lock the account for 15 minutes |
| `security.sessionTtlHours` | `SESSION_TTL_HOURS` (12) | 1–720 | New tokens expire after the configured hours |

Lockout details: after `threshold` consecutive failed logins the account is
set `LOCKED` with a 15-minute window; the correct password inside the window
is rejected, and after the window expires a correct password clears the lock
and resets the counter. A manual lock (set by an admin/developer with no
window) is never auto-unlocked. Session TTL applies to tokens issued after the
change (existing tokens keep their original expiry).

**Security alerts.** When an account crosses the threshold, an alert is
fired-and-forgotten to whichever channels are configured (both optional):

- `security.alertPhone` (`SECURITY_ALERT_PHONE`) — an SMS via the configured
  gateway (`lib/sms.ts`).
- `security.alertWhatsApp` (`SECURITY_ALERT_WHATSAPP`) — a WhatsApp message via
  `dispatchWhatsApp` (the `wa.*` settings under Settings → SMS: provider hubtel
  or smsonlinegh). Same retry-queue semantics as SMS.
- `security.alertEmail` (`SECURITY_ALERT_EMAIL`) — an email to the recipient
  via the settings-driven SMTP channel (`lib/mail.ts`, nodemailer): the
  `mail.*` settings (`MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USER`,
  `MAIL_PASS`, `MAIL_FROM`) are editable from the admin Settings page (Email
  group) and apply live. The subject carries a severity tag
  (`[CRITICAL]`/`[WARNING]`/`[INFO]`) plus the event title. The Settings page
  **Test email** button (`POST /admin/settings/test-mail`) sends a probe to the
  `MAIL_FROM` address (the account owner), verifying the SMTP handshake/auth
  end to end, and degrades gracefully when unconfigured.
- `security.alertWebhook` (`SECURITY_ALERT_WEBHOOK`) — a `POST` of JSON
  `{ event, severity, email, attempts, threshold, lockedUntil, message, timestamp }`
  to an HTTPS endpoint. The URL must be `http(s)` and loopback/private targets
  are refused in production (SSRF guard — `SECURITY_ALERT_ALLOW_PRIVATE=1`
  overrides for air-gapped installs; dev/test allow loopback).

License activation/deactivation also alert (`license.activate` /
`license.deactivate`). Alerts never block the request and failures are silent
(`lib/alert.ts`).

**Alert inbox.** Every alert also persists a `SecurityAlert` row with a
**severity** (`info | warning | critical`, color-coded in the UI: slate / gold
/ red) — the header bell (visible only to the DEVELOPER scope) shows an unread
count and a history, with per-alert and bulk mark-read. The bell polls every
60s; the list endpoint deliberately writes no audit entry so polling never
floods the trail. `POST /admin/developer/alerts/test` (rate-limited to 5/min)
sends a test alert through every configured channel (inbox, SMS, email,
webhook). Default severities:
lockout and `license.expired` are **critical**, `license.deactivate` and
`license.expiring` are **warning**, activation and test are **info**.

**Alerts tab.** `GET /admin/developer/alerts?event=&severity=&take=` backs a
dedicated Alerts tab: filter by event **and severity** (the header bell adds
the same severity chips over its last-100 rows), refresh, mark read/all, and
**Export CSV** (with a Severity column; formula-injection neutralized — the
filter applies to the export too). The header bell and the tab share the same
endpoint.

**Retention.** `alerts.retentionDays` (`ALERTS_RETENTION_DAYS`, default 365)
ages inbox rows out: the daily security sweep runs `runAlertRetentionSweep`
and the Alerts tab exposes **Prune old alerts**
(`POST /admin/developer/alerts/prune`, audit-logged as
`developer.alerts.prune`). Rows older than the window are deleted; unread
counts self-correct from the surviving rows.

**Email severity gate.** `alerts.emailMinSeverity` (`ALERTS_EMAIL_MIN_SEVERITY`,
default `info` = email everything) silences lower-priority emails entirely:
with `warning`, info alerts stop emailing; with `critical`, only critical do.
The gate applies to per-event emails **and** the digest email. Editable from
the Security tab (and the settings API).

**Delivery retry queue.** A failed email/SMS/**webhook** alert dispatch is never
silently lost: `dispatchSecurityAlert` queues it into the `AlertDelivery` table
and the retry sweep (`runAlertRetrySweep`, boot + every 30 minutes) retries
with exponential backoff (30 min, 1h, 2h, … capped at 24h) until success or
`alerts.retryMaxAttempts` (`ALERTS_RETRY_MAX_ATTEMPTS`, default 4). Permanent
failures (unrecognised number, gateway never configured) are not queued — only
transient dispatch errors, so a recovered gateway delivers the queued alert.
Webhook rows re-apply the SSRF guard at retry time (a URL edited to a private
target after enqueueing is refused), and a queued webhook payload is
re-stamped with a fresh `timestamp` on each attempt. Dedup keeps one
undelivered row per (channel, to, message); an exhausted row never blocks a
fresh publish.

**Gateway delivery callbacks.** SMSOnlineGH pushes delivery notifications for
both SMS and WhatsApp sends (the callback is now attached to WhatsApp sends
too) and Hubtel reports can point at the same endpoints. A shared secret
(`sms.smsonlinegh.callbackToken`) guards both; without a configured URL the
endpoints stay open (dev default). `POST /admin/developer/alerts/delivery-callback`
resolves **pending alert rows** by the gateway's `messageId` (or `to` fallback)
without re-dispatching: a delivered-looking status marks the row delivered,
a permanent rejection (`REJECTED`/`EXPIRED`/`UNDELIVERED`) exhausts it so the
sweep never re-dispatches a lost message, and any other status is recorded as
`lastError` while the row stays pending. Every receipt is mirrored to the
audit trail (`developer.alerts.delivery-callback`) so the developer can see
exactly what the gateway said. The immunization side keeps its own callback
at `POST /immunizations/reminders/delivery-callback`. Both endpoints accept
**Hubtel-format reports** too — Hubtel pushes `{ Message, MessageId, Status }`
to its configured report URL (point it at the callback endpoint), and the
parser picks up `MessageId` / `Status` alongside the SMSOnlineGH keys, so a
Hubtel-only deployment gets the same delivered/failed/exhausted resolution.

**Delivery stats.** `deliveryStats()` buckets every `AlertDelivery` row per
channel (email / sms / whatsapp / webhook) into **delivered**, **pending**
(queued and still retryable) and **exhausted** (gave up at the max attempts).
Both the Overview tab (delivery channels card) and the Alerts tab (per-channel
strip) surface it, via `GET /admin/developer/overview` and
`GET /admin/developer/alerts`. The Overview card carries an overall **delivery
health gauge**: green when every channel is clean, gold when anything is being
retried, and a red **DEGRADED** banner when any channel has exhausted
deliveries (with the affected channels and count) — so a silently dying
gateway is visible at a glance. A **14-day trend chart** (`deliveryTrend(db)`,
per-channel delivered / pending / exhausted lines bucketed by the day the
dispatch was attempted, zero days filled) sits under the channel cards on the
Overview — a channel dropdown filters to one series (or All, summed).

**Run retry sweep.** The Alerts tab's **Run retry sweep** button calls
`POST /admin/developer/alerts/retry-sweep` (rate-limited to 10/min,
audit-logged as `developer.alerts.retry-sweep`), which force-runs
`runAlertRetrySweep` immediately instead of waiting for the next 30-minute
scheduled pass — useful right after a gateway or receiver comes back.

**Alert detail drawer.** Clicking any row in the Alerts inbox expands a fan-out
detail panel (`GET /admin/developer/alerts/:id`): the raw alert payload and a
per-recipient delivery table (channel, recipient, status, attempts, delivered
at, last error — filterable by channel/recipient/status/error) with **Copy
payload** and **Download JSON** actions for the record. Delivery rows carry the
alert's `event` (new `AlertDelivery.event` column) so the drawer maps each
queue row back to the alert that spawned it, matched by event + a time window
around the alert row.

**Escalation (on-call) email.** `security.escalationEmail`
(`SECURITY_ESCALATION_EMAIL`) is a **second recipient emailed only on
critical alerts** — lockouts, lapsed licenses — and critical digests, for
on-call coverage outside office hours. It is **independent of the
minimum-severity gate** (a raised gate mutes info/warning noise but never the
on-call path) and shares the same retry queue. Editable from the Security tab.
The Alerts tab's **Test escalation** button calls
`POST /admin/developer/alerts/test-escalation` (rate-limited to 5/min,
audit-logged), dispatching a CRITICAL test alert so the on-call recipient can
confirm they are reachable — it degrades gracefully with a clear message when
no escalation email is configured. The Security tab's **Test WhatsApp alert**
button calls `POST /admin/developer/alerts/test-whatsapp` (rate-limited to
5/min, audit-logged), a single-channel probe via `dispatchWhatsApp` — it
degrades gracefully when no `security.alertWhatsApp` number is set, and reports
the gateway's rejection reason when the send is refused.

**Daily digest.** At boot and daily, `runDailyDigest` publishes a single
`digest` alert summarizing the last 24h — lockout incidents, audit actions,
unread alerts and the license posture — at most once per calendar day
(deduped via `alerts.lastDigestDate`; `alerts.digestEnabled` toggles it). Its
severity is computed from the content: any lockout or a lapsed license is
**critical**, a license inside the expiry window is **warning**, otherwise
**info**. When `security.alertEmail` is set, the digest also emails a
structured summary — plain text **and** a rich HTML table with the same
counts + license line + period + **per-channel delivery health** (delivered /
retrying / exhausted, so a silently degrading channel is visible before
alerts pile up) + a **14-day channel-health trend**: per-channel sparklines
in the text twin and a monospace sparkline table in the HTML twin, so a
dying gateway reads as a flat line days before it exhausts — a dedicated
send that is **separate from per-event emails**:
`dispatchSecurityAlert` skips the `digest` event on the email channel so a
digest day emails exactly once. The digest email respects the severity gate
and the retry queue above, and a **critical** digest also goes to the
escalation recipient.

**License-expiry sweep.** At boot and daily, `runLicenseExpiryCheck` watches
an *activated* license: within `license.alertDaysBefore` days of expiry it
sends `license.expiring` (at most once per 24h), and on the day of expiry a
one-shot `license.expired`. Both dedupe on `license.expiryAlertedAt`, which
deactivation resets. A deactivated (or never-activated) license never alerts,
even if a stale `expiresAt` row remains.

Admins cannot change these (403) — the developer is the only authority above
the security system. Every change is audit-logged
(`developer.security.update`).

## 4. Licensing (Licensing tab)

`lib/license.ts` + the `license.*` settings group:

- `POST /admin/developer/license/activate` — `{ key, edition
  (ENTERPRISE|PRO|COMMUNITY), expiresAt, maxFacilities, maxUsers }`.
- `POST /admin/developer/license/deactivate` — clears the key.
- `GET /admin/developer/license` — current status: activated, edition,
  key suffix (masked), expiry, days left, used vs max for facilities/users,
  compliance and a list of exceeded limits.

**Enforcement** happens at the write boundaries that consume capacity:

- New **user** accounts (`POST /admin/users` and
  `POST /admin/developer/users`) call `assertUserCapacity`.
- Approved **facility applications** call `assertFacilityCapacity`.
- When an active license is over a limit, creation is refused with a 403 and a
  clear message; the Developer Overview shows the breach.

`licenseStatus` computes: activated (key present), expired, limits exceeded,
`compliant` (activated && !expired && within limits). With no license, the
system runs unlicensed (trial) with no capacity enforcement.

## 5. Full audit (Audit tab)

`GET /admin/developer/audit?action=&actor=&entityType=&entityId=&from=&to=&take=`
— every audit entry in the system, filterable, up to 1000 rows. The Audit tab
adds date-range pickers (From / To); a date-only `to` value means the whole
selected day (the bound is pinned to 23:59:59.999 so later entries count). The
configuration audit (`GET /admin/audit/config`, view_audit) remains the
readable settings/masterdata timeline for admins; the developer trail is the
raw, complete view. CSV export: `GET /admin/audit/config?format=csv`.

## 6. System tab

- `GET /admin/developer/overview` — license, counts (users, facilities,
  devices, audit events in 24h, active sessions), security posture, runtime.
- `GET /admin/developer/system` — Node/platform/env, and for every managed
  setting the env var name, group, secret flag, effective source and
  configured state.
- `GET /admin/developer/devices` + `POST /admin/developer/devices/:deviceId/status`
  — block or retire **any** device, including admin workstations.

## Security notes

- The DEVELOPER scope cannot be granted from the roles editor — it is not in
  the editable scope list, the roles API rejects it with 403, and editing the
  DEVELOPER role itself is refused (`PUT /admin/masterdata/roles/DEVELOPER`).
  Only the seed (or the developer user-management path) can create DEVELOPER
  accounts.
- Secrets are masked everywhere (`••••`), never returned in full, and never
  written to the audit trail.
- Impersonation is fully audited; non-active accounts cannot be impersonated.
- A non-developer national admin receives 403 on every `/admin/developer/*`
  route regardless of their other permissions.
