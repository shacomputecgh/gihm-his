# GIHM-HIS Desktop Shell (Tauri v2)

Native Windows client for GIHM-HIS — the same React PWA the browser runs,
wrapped in a Tauri v2 shell with a system tray, an OS-stored device identity,
auto-update, and air-gapped installers. See `docs/26` for the technology
evaluation and phased plan (this directory ships milestone **6b**).

## What the shell adds

| Capability | Where |
|---|---|
| Embeds the built React SPA | `src-tauri/tauri.conf.json` → `frontendDist: ../../apps/web/dist` (WebView2 on Windows) |
| System tray (Show / Sync now / Check for updates / Quit) + close-to-tray | `src-tauri/src/lib.rs` |
| **OS-stored device id** (stable across webview storage clears, device registry keys on it) | `get_shell_info` command → `app_config_dir/gihm-device-id` |
| **Absolute API base** for the SPA (served from `tauri://localhost` it cannot use a relative `/api/v1`) | `gihm-shell-config.json` in the config dir, defaults to `http://localhost:4000/api/v1` |
| Auto-update (Tauri updater plugin, native install UI) | `tauri.conf.json` → `plugins.updater` + `check_for_updates` command |
| Air-gapped install: full offline WebView2 runtime bundled | `bundle.windows.webviewInstallMode.type = "offlineInstaller"` |
| Installers | `msi` (WiX) + `nsis` |

The PWA integration is in `apps/web/src/lib/desktop.ts` — it detects the shell,
resolves the device id / API base via the raw internals `invoke`, and wires the
tray's "Sync now" and updater events into plain window events. The browser PWA
bundle is unaffected (the Tauri npm package is only dynamic-imported when the
shell is detected).

## Bundled local backend (6d)

When the LAN has no facility server, the desktop **is** the edge. The shell
manages the bundled API (Node + SQLite — **no Docker**) that
`deploy/edge/windows/backend.ps1 provision` installs into
`%LOCALAPPDATA%\gh.gihm.his.desktop\local-backend` (the Tauri identifier dir,
so the shell and the script always agree on the path):

- `local_backend_status` / `start_local_backend` / `stop_local_backend` commands
  (pid file, headless spawn, liveness + termination, logs in the app log dir),
  auto-started at launch in `setup()`.
- The SPA's default API base is `http://localhost:4000/api/v1` — the same port
  the bundled backend binds, so no configuration is needed.
- **Admin → Sync status** shows a “Local edge backend” card (Running / Stopped /
  Not provisioned) with Start/Stop; `main.tsx` retries `ensureLocalBackend()`
  at boot.

See `deploy/edge/windows/README.md` for the two deployment modes (LAN server =
`deploy/edge/` Docker; workstation = this bundled backend).

## Prerequisites

- **Rust toolchain** (rustup stable) — required to build the shell
- **Node ≥ 20** — for the web build (`beforeBuildCommand` runs it)
- **Windows** — the `msi`/`nsis` targets and WebView2 bundling only build on
  Windows (Tauri can cross-compile but the official path is a Windows runner /
  CI job)

## Build

```bash
npm install                      # installs @tauri-apps/cli
npm run build:msi                # or build:nsis
```

Artifacts land in `src-tauri/target/release/bundle/`.

The web app builds automatically first (`beforeBuildCommand`). To iterate:
`npm run dev` (starts the Vite dev server and the shell pointed at it).

> The `npm --prefix ../apps/web …` commands assume you invoke Tauri from the
> `desktop/` directory (as the npm scripts do). Running `tauri dev` from the
> repo root or `src-tauri/` will not find the web app.

## Auto-update

1. Generate the signing keypair (private key is **never** committed; the
   `.signing/` dir is gitignored):

   ```bash
   npm run signer:generate       # writes .signing/gihm-desktop.key
   ```

   The public key is already baked into `tauri.conf.json` under
   `plugins.updater.pubkey`.

2. Point `plugins.updater.endpoints` at your release server
   (`https://…/{{target}}/{{arch}}/{{current_version}}`).

3. Build with the private key available to CI:

   ```bash
   export TAURI_SIGNING_PRIVATE_KEY="$(cat .signing/gihm-desktop.key)"
   export TAURI_SIGNING_PRIVATE_KEY_PASSWORD='…'   # only if password-protected
   npm run build:msi
   ```

Clients check for updates via the tray menu, or the PWA can call
`invoke('check_for_updates')` (result is emitted as `shell://updates-result`
and surfaced in the SPA as `gihm:updates-result`).

## Edge / API configuration

The SPA inside the shell must reach the facility edge or national API by an
**absolute** URL. Default: `http://localhost:4000/api/v1`. To point the client
at a different edge, write a config file into the app-config directory:

`%APPDATA%\gh.gihm.his.desktop\gihm-shell-config.json`

```json
{ "apiBase": "http://192.168.1.50:4000/api/v1" }
```

**CORS:** the shell SPA runs on the WebView2 `tauri://localhost` origin, so the
target API must allow it. The API's default CORS allow-list already includes
`tauri://localhost` and `http://tauri.localhost` (`apps/api/src/config.ts`
`webOrigin`); if you deploy with a custom `WEB_ORIGIN` or an edited
`app.webOrigin` setting, include the shell origin or `*` or the desktop client
will be blocked. Use `https://` for anything beyond a demo LAN — the SPA sends
its bearer token to whatever `apiBase` the config file points at.

> `get_shell_info` also emits the app version and name so the SPA can label
> itself and register its device as `platform: WINDOWS` (sync payloads set
> `deviceName: "GIHM-HIS Desktop vX.Y.Z"`).

## Repository layout

```
desktop/
  package.json              # tauri CLI wrapper + scripts
  .signing/                 # gitignored updater private key
  src-tauri/
    Cargo.toml              # tauri 2, tray-icon, updater, serde, uuid
    tauri.conf.json         # window, tray, bundle (msi/nsis), updater
    capabilities/default.json
    icons/                  # generated from icons/app-icon.svg
    src/{main,lib}.rs       # tray, close-to-tray, shell_info, updater
```
