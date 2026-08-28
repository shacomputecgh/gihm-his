# GIHM-HIS Facility Edge

Single-node deployment of the full GIHM-HIS stack for a hospital LAN
(`docs/16-edge-deployment-architecture.md` §2, spec §94). The facility keeps
working with **no internet**: the local encrypted-at-rest SQLite database, the
local API, and the offline-first web/PWA client all run on one server inside
the hospital. When connectivity returns, an optional relay bubbles the
facility's offline mutation log up to the national/regional platform through
the **same shared `/sync/mutations` protocol** the PWA uses (`docs/15` §2–3).

```
Workstations (browser/PWA, offline-first outbox)
        │  LAN
        ▼
  nginx :8080  ── /api ──►  api :4000 (localhost only)
        └─────────────►  SQLite edge.db (volume edge-data)
                              ▲
                    edge relay (optional) ──https──► national platform
                              (EDGE_RELAY_* in .env)
```

## Quickstart

Requirements: a Linux server (or Windows with WSL2/Docker Desktop), Docker
Engine + the compose plugin.

```bash
cd deploy/edge
./install.sh        # creates .env, builds images, starts, waits for health
```

Then point every workstation at `http://<server-lan-ip>:8080`. The API is
bound to localhost only — the web UI (and the nginx proxy) is the LAN entry
point.

## Configuration (`.env`)

Generated on first install; edit and run `docker compose up -d` to apply.

| Variable | Default | Meaning |
|---|---|---|
| `JWT_SECRET` | generated | Signing secret — treat as a password, keep `chmod 600` |
| `WEB_ORIGIN` | `http://<lan-ip>:8080` | Origin for CORS/link generation |
| `WEB_PORT` / `API_PORT` | `8080` / `4000` | Host ports |
| `EDGE_RELAY_URL` | *(unset = relay off)* | Upstream national/regional base URL |
| `EDGE_RELAY_USERNAME` / `EDGE_RELAY_PASSWORD` | — | Service account on the upstream (needs `sync_data`) |
| `EDGE_RELAY_DEVICE_ID` | `edge-<hostname>` | Stable edge identity; registered as a Device upstream |
| `EDGE_RELAY_INTERVAL_MINUTES` | `1` | Poll interval for the relay |
| `EDGE_RELAY_BATCH` | `100` | Mutations per push (upstream caps 200) |
| `EDGE_RELAY_STATE_FILE` | `edge-relay-state.json` | Relay cursor (relative to the api working dir) |

## Upstream relay

The facility edge relays **its local PROCESSED mutation log** (the offline work
captured from facility outboxes) to the upstream platform. It logs in with the
service account, pushes a batch carrying `transactionId` /
`idempotencyKey` / `clientTimestamp`, and persists a cursor so restarts resume
cleanly. The upstream is idempotent, so a crash mid-batch can never duplicate a
record — retries return the original result (`docs/15` §3, §136).

```bash
# in deploy/edge/.env
EDGE_RELAY_URL=https://national.example.gh
EDGE_RELAY_USERNAME=edge-service@national.gh
EDGE_RELAY_PASSWORD=change-me
docker compose up -d        # api picks up the config on boot
```

Watch it relay:

```bash
docker compose logs -f api | grep edge-relay
```

Direct online writes at the edge (non-sync API calls) are captured by the
production relay via entity-level change capture — Phase 6 refinement,
`docs/16` §5. The protocol is identical either way.

## Backup & restore

`./backup.sh` checkpoints the WAL inside the container (consistent snapshot
even mid-write), copies `edge.db` to `./backups/`, optionally encrypts with
`age` (`AGE_RECIPIENT=…`), and retains the last `KEEP` (default 14).

```bash
./backup.sh                 # daily cron: 0 2 * * * /path/to/deploy/edge/backup.sh
KEEP=30 AGE_RECIPIENT=age1… ./backup.sh
```

Restore (the API container is stopped first, so the copy uses a one-off
container — `docker compose exec` only works on a *running* container):

```bash
docker compose stop api
docker compose run --rm api sh -c "cp /backups/edge-<timestamp>.db /app/data/edge.db"
docker compose start api
```

Test restores regularly — a backup that has never been restored is a hope, not
a backup.

## Security notes

- The API port is bound to `127.0.0.1` — never expose it to the LAN. All
  workstation traffic goes through nginx.
- Put the edge behind a TLS reverse proxy if it is reachable beyond the LAN,
  and rotate `JWT_SECRET` on initial provisioning (install.sh already generates
  a fresh one).
- At-rest encryption of the database file is recommended for portable media;
  the `backup.sh` `age` path encrypts backups. The WAL/journal should live on
  the same (preferably encrypted) volume as the database.
- `JWT_SECRET`, relay credentials: keep `.env` private (`chmod 600` is applied).

## Upgrades

The update flow preserves offline data (`docs/21` §5): check pending sync →
synchronize → backup → update → validate → restart. The API image applies
schema changes on boot (SQLite only — `prisma db push` in the entrypoint), so
an upgraded image self-migrates; no manual migration step is needed.

```bash
./backup.sh
git pull                      # or copy the new release
docker compose up -d --build
```

Rollback: restore the pre-upgrade backup, then start the previous images.

## Troubleshooting

| Symptom | Check |
|---|---|
| Web UI loads but API calls fail | `docker compose logs api`; health: `curl http://127.0.0.1:4000/api/v1/health` |
| Workstations can't reach the UI | Firewall port 8080; `hostname -I` LAN IP; switch/VLAN isolation |
| Relay shows `edge relay pass failed` | Upstream reachability + service account credentials; `EDGE_RELAY_URL` must be the base URL |
| Relay shows `… push failed: HTTP 403` | The edge's device is not yet approved on the upstream — an admin must enroll `EDGE_RELAY_DEVICE_ID` (upstream Admin → Sync status) before it can push (device gate, docs/21 §1) |
| Relay sends nothing | Only `PROCESSED` local mutations are relayed; the edge must have processed sync traffic |
| WAL grows large | The checkpoint in `backup.sh` truncates it; `PRAGMA wal_autocheckpoint` defaults apply otherwise |
