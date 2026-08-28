# GIHM-HIS Bundled Edge — Windows (native, no Docker)

Part of milestone **6d** (docs/26 §6): the facility edge as a **bundled backend
for the desktop client** when the LAN has no server yet.

```
Workstations (browser/PWA)
        │  LAN (optional)
        ▼
  [This PC]  ── desktop shell (Tauri)
        │        └─ spawns the bundled API (Node + SQLite, no Docker)
        ▼
  localhost:4000  (apps/api, db at local-backend\data\edge.db)
        ▲
  %LOCALAPPDATA%\gh.gihm.his.desktop\local-backend  (matches the Tauri identifier)
```

The API is plain Node + Fastify + SQLite — it runs natively on a Windows
workstation with **no Docker Engine required**. The Tauri shell manages the
process lifecycle (status / start / stop commands) and auto-starts it at
launch, so the desktop *is* the facility server when none exists on the LAN.

## Two deployment modes

| Mode | Where | How |
|---|---|---|
| **A. LAN server** | A hospital server | `deploy/edge/` (Docker) — `install.sh`, one server serves all workstations |
| **B. Workstation (this dir)** | A single PC running the desktop client | `backend.ps1` — no Docker; the shell starts the API locally |

Both run the same `apps/api` + SQLite database and speak the same protocols
(offline sync outbox, edge relay, scheduled reports). **B** is the "bundled
backend" for the desktop client; workstations on the LAN can still reach it
through the PWA if the host shares port 4000/8080 (the API binds all
interfaces, same as the Docker edge).

## Quickstart (on the workstation)

```powershell
# 1. From the repo checkout on the build machine: install/refresh deps + prisma client
powershell -ExecutionPolicy Bypass -File backend.ps1 build

# 2. Package + install the backend into %LOCALAPPDATA%\gh.gihm.his.desktop\local-backend,
#    generate a fresh JWT secret, create the schema. -Seed loads the demo data.
powershell -ExecutionPolicy Bypass -File backend.ps1 provision
powershell -ExecutionPolicy Bypass -File backend.ps1 provision -Seed   # demo only

# 3. Lifecycle (the desktop shell also manages this from Admin → Sync status)
powershell -ExecutionPolicy Bypass -File backend.ps1 start
powershell -ExecutionPolicy Bypass -File backend.ps1 status
powershell -ExecutionPolicy Bypass -File backend.ps1 stop
```

After `provision`, the desktop shell finds the backend at
`%LOCALAPPDATA%\gh.gihm.his.desktop\local-backend` (`backend.json`) — the
same directory the Tauri shell resolves from its bundle `identifier`
(`tauri.conf.json`) — and its default API base (`http://localhost:4000/api/v1`)
already points at it.

## What `provision` produces

```
%LOCALAPPDATA%\gh.gihm.his.desktop\local-backend\
  apps\api\        # API source (tsx runs src/server.ts)
  node_modules\    # hoisted workspace deps (incl. tsx)
  backend.json     # { node, port, env: { JWT_SECRET, DATABASE_URL, … } }
  backend.pid      # pid of the running process (written by the shell/start)
  data\edge.db     # SQLite database (created by prisma db push)
```

Notes:

- `backend.json` deliberately does **not** set `WEB_ORIGIN` — the API's boot
  default already allow-lists the Tauri webview origins
  (`tauri://localhost`, `http://tauri.localhost`) plus the browser PWA.
- The DB is a plain SQLite file — back it up by copying `data\edge.db`
  (or use `deploy/edge/backup.sh` on a Linux server for mode A).
- The installer for the desktop client can run `provision` silently during
  setup, so an air-gapped facility PC becomes self-sufficient on first launch.
