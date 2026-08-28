# GIHM-HIS native sync-protocol POC (.NET)

A minimal, zero-dependency .NET 10 console client that exercises the **shared
offline-sync protocol** (`docs/15`) from a fully native application — the same
contract the browser PWA and a future desktop shell use:

1. `POST /api/v1/auth/login` — shared authentication
2. Stable `deviceId` persisted on first run (spec §109 device lifecycle)
3. `POST /api/v1/devices/register` + admin approval — the device gate
   (docs/21 §1) blocks sync until a device is ACTIVE; the POC runs as the
   national admin and approves its own device on first run
4. `POST /api/v1/sync/mutations` — outbox-style batch with `transactionId`,
   `idempotencyKey` and `clientTimestamp` per mutation (spec §104, §130, §136)
5. `GET /api/v1/sync/status?deviceId=…` — device registration + pending count

This is the *proof* behind the Windows-client evaluation in
`docs/26-windows-client-evaluation.md`: the protocol is transport-agnostic, so
a desktop client can share the exact server contract with the PWA.

## Run it

```bash
# against a running dev API (defaults below)
dotnet run -- --baseUrl http://localhost:4000 --email admin@demo.gh --password 'Demo@123'
```

Expected output (abridged):

```
[1/5] Authenticating…        ✓ token acquired
[2/5] Device id  gihm-poc-…  (persisted at …/gihm-sync-poc-device-id)
[3/5] Registering device…    registered=True pendingApproval=True
      ✓ device approved — now ACTIVE (enrolled by admin session)
[4/5] Pushing patient.CREATE mutation…   processed=1 failed=0
      result: status=PROCESSED duplicated=False entityId=…
[5/5] Checking sync status…  server=healthy pending=0
      device registered: ACTIVE (platform WINDOWS)
```

Run it twice: the second run re-uses the same device id (one device on the
platform) and the new patient carries a fresh transaction id.

## What a production client changes

The POC hand-builds one mutation. A production Tauri shell (`docs/26` §6)
replaces that with the PWA's real outbox (`apps/web/src/lib/offline.ts`):
Dexie-backed local store, `enqueueMutation()` on every offline write,
`syncNow()` with exponential backoff on reconnect. The HTTP contract — and the
server — are identical to what this POC exercises.

## Notes

- Zero NuGet packages: `System.Net.Http` + `System.Text.Json` only, so it
  builds on an air-gapped machine (relevant for hospital networks).
- `platform: "WINDOWS"` registers the device under the platform the
  evaluation (and spec §97) assumes for desktop workstations.
- The POC creates a synthetic patient in the demo database each run — harmless
  for dev/QA, and each run's name is unique so the MPI never flags a duplicate.
