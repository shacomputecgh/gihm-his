use serde::Serialize;
use std::fs;
use std::path::PathBuf;
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Emitter, Manager,
};
use uuid::Uuid;

// ---------------------------------------------------------------------------
// Shell info — device identity (OS-stored, survives webview storage clears)
// and the API base URL the PWA should target when running inside the shell.
// ---------------------------------------------------------------------------

#[derive(Serialize)]
struct ShellInfo {
    device_id: String,
    api_base: String,
    platform: String,
    version: String,
    app_name: String,
}

const DEFAULT_API_BASE: &str = "http://localhost:4000/api/v1";

fn app_config_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_config_dir()
        .map_err(|e| format!("config dir unavailable: {e}"))
}

/// Stable per-install device id, persisted in the OS app-config directory so
/// it survives webview storage resets (device registry keys on `deviceId`).
/// `create_new` makes the mint atomic — a concurrent caller wins, the loser
/// re-reads the winner's id instead of generating a second one.
fn load_or_create_device_id(app: &tauri::AppHandle) -> Result<String, String> {
    let dir = app_config_dir(app)?;
    fs::create_dir_all(&dir).map_err(|e| format!("create config dir: {e}"))?;
    let path = dir.join("gihm-device-id");
    if let Ok(id) = fs::read_to_string(&path) {
        let id = id.trim();
        if !id.is_empty() {
            return Ok(id.to_string());
        }
    }
    let id = format!("win-{}", Uuid::new_v4());
    match fs::OpenOptions::new().write(true).create_new(true).open(&path) {
        Ok(mut f) => {
            use std::io::Write;
            f.write_all(id.as_bytes())
                .and_then(|_| f.sync_all())
                .map_err(|e| format!("write device id: {e}"))?;
            Ok(id)
        }
        Err(e) if e.kind() == std::io::ErrorKind::AlreadyExists => {
            // Another call minted it first — adopt theirs.
            let id = fs::read_to_string(&path).map_err(|e| format!("re-read device id: {e}"))?;
            Ok(id.trim().to_string())
        }
        Err(e) => Err(format!("open device id file: {e}")),
    }
}

/// API base from `gihm-shell-config.json` in the config dir, else the local
/// edge default. The PWA serves from `tauri://localhost` so it needs an
/// absolute origin to reach the facility edge / national API.
fn load_api_base(app: &tauri::AppHandle) -> String {
    let Ok(dir) = app_config_dir(app) else {
        return DEFAULT_API_BASE.to_string();
    };
    let path = dir.join("gihm-shell-config.json");
    let Ok(raw) = fs::read_to_string(&path) else {
        return DEFAULT_API_BASE.to_string();
    };
    serde_json::from_str::<serde_json::Value>(&raw)
        .ok()
        .and_then(|v| v.get("apiBase").and_then(|b| b.as_str()).map(String::from))
        .unwrap_or_else(|| DEFAULT_API_BASE.to_string())
}

#[tauri::command]
fn get_shell_info(app: tauri::AppHandle) -> Result<ShellInfo, String> {
    Ok(ShellInfo {
        device_id: load_or_create_device_id(&app)?,
        api_base: load_api_base(&app),
        platform: "WINDOWS".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        app_name: "GIHM-HIS Desktop".to_string(),
    })
}

// ---------------------------------------------------------------------------
// Bundled local edge backend (docs/26 §6 6d) — the desktop becomes the
// facility edge when the LAN has no server yet. The API bundle (Node + SQLite,
// no Docker) is provisioned into the app-local-data dir by the installer or
// `deploy/edge/windows/backend.ps1 provision`; the shell manages the process.
// The SPA's default API base is `http://localhost:4000/api/v1` — the same
// port this backend binds — so no config change is needed for the common case.
// ---------------------------------------------------------------------------

#[derive(Serialize)]
struct LocalBackendStatus {
    provisioned: bool,
    running: bool,
    pid: Option<u32>,
    port: u16,
    dir: String,
}

const BACKEND_PORT: u16 = 4000;

fn backend_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_local_data_dir()
        .map(|d| d.join("local-backend"))
        .map_err(|e| format!("local data dir unavailable: {e}"))
}

fn backend_pid_file(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(backend_dir(app)?.join("backend.pid"))
}

/// `backend.json` (written by backend.ps1 provision): `{ "node": "node",
/// "port": 4000, "env": { "JWT_SECRET": …, "DATABASE_URL": … } }`.
fn read_backend_config(app: &tauri::AppHandle) -> Result<serde_json::Value, String> {
    let path = backend_dir(app)?.join("backend.json");
    let raw = fs::read_to_string(&path).map_err(|e| format!("backend not provisioned ({e})"))?;
    serde_json::from_str(&raw).map_err(|e| format!("backend config invalid: {e}"))
}

fn read_pid(app: &tauri::AppHandle) -> Option<u32> {
    backend_pid_file(app)
        .ok()
        .and_then(|p| fs::read_to_string(p).ok())
        .and_then(|s| s.trim().parse().ok())
}

fn process_alive(pid: u32) -> bool {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("tasklist")
            .args(["/FI", &format!("PID eq {pid}"), "/NH"])
            .output()
            .map(|o| String::from_utf8_lossy(&o.stdout).contains(&pid.to_string()))
            .unwrap_or(false)
    }
    #[cfg(not(target_os = "windows"))]
    {
        std::process::Command::new("sh")
            .args(["-c", &format!("kill -0 {pid} 2>/dev/null")])
            .status()
            .map(|s| s.success())
            .unwrap_or(false)
    }
}

fn terminate_process(pid: u32) {
    #[cfg(target_os = "windows")]
    let _ = std::process::Command::new("taskkill")
        .args(["/PID", &pid.to_string(), "/T", "/F"])
        .status();
    #[cfg(not(target_os = "windows"))]
    let _ = std::process::Command::new("kill").args(["-9", &pid.to_string()]).status();
}

fn running_pid(app: &tauri::AppHandle) -> Option<u32> {
    read_pid(app).filter(|pid| process_alive(*pid))
}

fn backend_status(app: &tauri::AppHandle) -> LocalBackendStatus {
    let dir = backend_dir(app).unwrap_or_default();
    let provisioned = dir.join("backend.json").exists();
    let pid = running_pid(app);
    LocalBackendStatus {
        provisioned,
        running: pid.is_some(),
        pid,
        port: BACKEND_PORT,
        dir: dir.to_string_lossy().into_owned(),
    }
}

/// Spawn the bundled API detached, with output appended to the app log dir.
/// The API runs via tsx (there is no compiled server.js — the Docker image
/// runs `npx tsx src/server.ts`); npm workspaces hoist tsx to the bundle root.
fn spawn_backend(app: &tauri::AppHandle) -> Result<(), String> {
    let cfg = read_backend_config(app)?;
    let dir = backend_dir(app)?;
    let node = cfg.get("node").and_then(|n| n.as_str()).unwrap_or("node").to_string();

    // Claim the pid slot first — the setup() auto-start and the SPA's
    // ensureLocalBackend can race; create_new means exactly one wins.
    let pid_path = backend_pid_file(app)?;
    match fs::OpenOptions::new().write(true).create_new(true).open(&pid_path) {
        Ok(mut f) => {
            use std::io::Write;
            f.write_all(b"starting")
                .map_err(|e| format!("write pid claim: {e}"))?;
        }
        Err(e) if e.kind() == std::io::ErrorKind::AlreadyExists => {
            // Another starter won the claim — adopt their process. (If a crash
            // ever left a stale claim, Stop removes the pid file first.)
            return Ok(());
        }
        Err(e) => return Err(format!("claim backend pid: {e}")),
    }

    // tsx CLI — hoisted to the bundle root; fall back to the per-workspace copy.
    let tsx = [dir.join("node_modules/tsx/dist/cli.mjs"), dir.join("apps/api/node_modules/tsx/dist/cli.mjs")]
        .into_iter()
        .find(|p| p.exists())
        .ok_or_else(|| "backend bundle missing tsx — re-run backend.ps1 build + provision".to_string())?;

    // Log to the app log dir so a failing backend is diagnosable.
    let log_dir = app
        .path()
        .app_log_dir()
        .map_err(|e| format!("log dir unavailable: {e}"))?;
    fs::create_dir_all(&log_dir).map_err(|e| format!("create log dir: {e}"))?;
    let log_path = log_dir.join("local-backend.log");
    let log_file = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)
        .map_err(|e| format!("open backend log: {e}"))?;
    let err_file = log_file.try_clone().map_err(|e| format!("clone backend log: {e}"))?;

    let mut cmd = std::process::Command::new(&node);
    cmd.arg(&tsx)
        .arg("apps/api/src/server.ts")
        .current_dir(&dir)
        .stdout(std::process::Stdio::from(log_file))
        .stderr(std::process::Stdio::from(err_file));
    if let Some(env) = cfg.get("env").and_then(|e| e.as_object()) {
        for (k, v) in env {
            if let Some(v) = v.as_str() {
                cmd.env(k, v);
            }
        }
    }
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        // CREATE_NO_WINDOW — the backend runs headless, no console flash.
        cmd.creation_flags(0x0800_0000);
    }
    let child = cmd.spawn().map_err(|e| format!("start backend: {e}"))?;
    // Persist the pid so status/stop find the process after the shell exits.
    fs::write(&pid_path, child.id().to_string()).map_err(|e| format!("write backend pid: {e}"))?;
    Ok(())
}

#[tauri::command]
fn local_backend_status(app: tauri::AppHandle) -> LocalBackendStatus {
    backend_status(&app)
}

#[tauri::command]
fn start_local_backend(app: tauri::AppHandle) -> Result<LocalBackendStatus, String> {
    if running_pid(&app).is_some() {
        return Ok(backend_status(&app)); // already up
    }
    spawn_backend(&app)?;
    Ok(backend_status(&app))
}

#[tauri::command]
fn stop_local_backend(app: tauri::AppHandle) -> Result<LocalBackendStatus, String> {
    if let Some(pid) = read_pid(&app) {
        terminate_process(pid);
    }
    // Always drop the pid file — this also clears any stale "starting" claim.
    let _ = fs::remove_file(backend_pid_file(&app)?);
    Ok(backend_status(&app))
}

// ---------------------------------------------------------------------------
// Auto-update — registered as a command so the PWA (zero extra Tauri npm
// deps) can trigger a check; the native installer UI drives the rest.
// ---------------------------------------------------------------------------

#[tauri::command]
async fn check_for_updates(app: tauri::AppHandle) -> Result<String, String> {
    use tauri_plugin_updater::UpdaterExt;

    let updater = app.updater().map_err(|e| e.to_string())?;
    match updater.check().await.map_err(|e| e.to_string())? {
        Some(update) => {
            let version = update.version.clone();
            update
                .download_and_install(
                    |_chunk, _total| {},
                    || {},
                )
                .await
                .map_err(|e| format!("install {version}: {e}"))?;
            Ok(format!("installed {version} — restart to apply"))
        }
        None => Ok("up-to-date".to_string()),
    }
}

// ---------------------------------------------------------------------------
// Tray + window behaviour
// ---------------------------------------------------------------------------

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.show();
        let _ = win.set_focus();
    }
}

fn build_tray(app: &tauri::App) -> tauri::Result<()> {
    let show = MenuItem::with_id(app, "show", "Show GIHM-HIS", true, None::<&str>)?;
    let sync = MenuItem::with_id(app, "sync", "Sync now", true, None::<&str>)?;
    let updates = MenuItem::with_id(app, "updates", "Check for updates…", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &sync, &updates, &quit])?;

    let tray = TrayIconBuilder::with_id("gihm-tray")
        .menu(&menu)
        .show_menu_on_left_click(true);
    let tray = match app.default_window_icon().cloned() {
        Some(icon) => tray.icon(icon),
        None => tray, // missing icon set: build without one rather than panic
    };
    tray
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => show_main_window(app),
            "sync" => {
                // Ask the PWA to run its outbox sync; the webview picks this up
                // via @tauri-apps/api/event listen('shell://sync-now').
                let _ = app.emit("shell://sync-now", ());
                show_main_window(app);
            }
            "updates" => {
                let handle = app.clone();
                tauri::async_runtime::spawn(async move {
                    match check_for_updates(handle.clone()).await {
                        Ok(msg) => {
                            let _ = handle.emit("shell://updates-result", msg);
                        }
                        Err(e) => {
                            let _ = handle.emit("shell://updates-result", format!("error: {e}"));
                        }
                    }
                });
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .build(app)?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        // Local SQLite for the offline reporting mirror (docs/26 §6c) — the
        // PWA saves report snapshots into `sqlite:gihm-reports.db` via
        // @tauri-apps/plugin-sql so reports render while the device is offline.
        .plugin(tauri_plugin_sql::Builder::default().build())
        .setup(|app| {
            build_tray(app)?;
            // 6d: bring the bundled facility edge up when the LAN has no server.
            // Spawned so setup returns immediately; the webview's first API call
            // self-heals via the offline auth cache + connection retry if it wins
            // the race by a few hundred ms.
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let _ = start_local_backend(handle.clone());
            });
            Ok(())
        })
        // Close-to-tray: the window hides on X; the tray Quit item exits.
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_shell_info,
            check_for_updates,
            local_backend_status,
            start_local_backend,
            stop_local_backend
        ])
        .run(tauri::generate_context!())
        .expect("error while running GIHM-HIS desktop shell");
}
