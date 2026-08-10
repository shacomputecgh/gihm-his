# 21 — Device Management Strategy

## 1. Device lifecycle (spec §109)

Every device: `device_id · device_type · platform · facility · department · assigned_user · status · last_sync · last_seen · security_status · software_version`.

Statuses: **Active · Lost · Stolen · Suspended · Retired · Blocked** — administrators can revoke/block devices at any time (implemented: `POST /admin/devices/:deviceId/status`).

## 2. Implemented

- Clients register a stable `deviceId` at first sync (`POST /devices/register`, or implicit via `/sync/mutations`).
- Admin page lists devices with platform + status + last-seen; one-click block/reactivate.
- The sync API records `lastSeenAt`/`lastSyncAt` on every mutation batch.

## 3. Mobile security (spec §97, future phases)

Encrypted device storage · app PIN · biometric unlock · auto-timeout · remote logout · session revocation · secure key storage · minimal local data (selective caching). **The national patient database is never stored on a mobile device.**

## 4. Offline authentication (spec §108, future)

Previously authorized devices may authenticate offline via device-bound credentials + cached authorization with expiration policies and device trust — never plaintext passwords, and offline authorization expires per policy.

## 5. Application updates (spec §110)

Update flow preserves offline data: check pending sync → synchronize → backup local DB → update → validate → restart; rollback supported; schema migrations follow **expand → migrate → backfill → update clients → contract**, with controlled backward compatibility across client versions.
