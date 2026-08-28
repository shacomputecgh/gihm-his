# 21 — Device Management Strategy

## 1. Device lifecycle (spec §109)

Every device: `device_id · device_type · platform · facility · department · assigned_user · status · enrolled_at · last_sync · last_seen · block_reason · remote_logout_at · security_status · software_version`.

Statuses: **Pending · Active · Lost · Stolen · Suspended · Retired · Blocked** — administrators can revoke/block devices at any time (`POST /admin/devices/:deviceId/status`).

## 2. Implemented

- **Enrollment gate (6e)**: clients register a stable `deviceId` at first sync (`POST /devices/register`, or implicitly via `/sync/mutations`). New devices self-register as **PENDING** and are refused sync (`403 DEVICE_PENDING_APPROVAL`) until an administrator approves them. The Admin → Devices tab shows the approval queue (Approve / Reject with reason).
- **Server-side enforcement (6e)**: `/sync/mutations` checks device status on every batch. A SUSPENDED/LOST/STOLEN/RETIRED/BLOCKED device gets `403 DEVICE_SUSPENDED` / `DEVICE_REVOKED` and cannot push data — the client drops its session and returns to login.
- **Remote logout (6e)**: `POST /admin/devices/:deviceId/remote-logout` voids the device's current session without de-enrolling it (`remoteLogoutAt`). The device learns on its next server contact — the sync response carries `remoteLogoutAt`, and the PWA drops its cached offline session when it is newer than the session's `cachedAt`. (A truly offline device cannot be reached until it reconnects — inherent to a pull-based client.)
- Admin page lists devices with platform + status + enrolment + last-seen; approve/reject, suspend, block and remote-logout actions; block reasons are recorded and shown.
- The sync API records `lastSeenAt`/`lastSyncAt` on every mutation batch.

## 3. Mobile security (spec §97, future phases)

Encrypted device storage · app PIN ✅ (6c, `lib/deviceLock.ts`) · biometric unlock · auto-timeout ✅ (6c) · remote logout ✅ (6e) · session revocation ✅ (6e, per-device; per-user JWT via `tokenVersion` in docs/25) · secure key storage · minimal local data (selective caching). **The national patient database is never stored on a mobile device.**

## 4. Offline authentication (spec §108, future)

Previously authorized devices may authenticate offline via device-bound credentials + cached authorization with expiration policies and device trust — never plaintext passwords, and offline authorization expires per policy.

## 5. Application updates (spec §110)

Update flow preserves offline data: check pending sync → synchronize → backup local DB → update → validate → restart; rollback supported; schema migrations follow **expand → migrate → backfill → update clients → contract**, with controlled backward compatibility across client versions.
