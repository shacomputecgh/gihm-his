/**
 * Tauri v2 desktop-shell bridge (docs/26 §6b).
 *
 * The same SPA runs as a browser PWA and inside the native shell. This module
 * detects the shell (`window.__TAURI_INTERNALS__`) and exposes what only the
 * shell knows: the OS-stored device id, the absolute API base (the SPA is
 * served from `tauri://localhost`, so a relative `/api/v1` cannot reach the
 * facility edge), and the app version. Commands go through the raw internals
 * object so the browser bundle gains no Tauri code; event listening is
 * dynamic-imported and only ever executes inside the shell.
 */

export interface ShellInfo {
  device_id: string;
  api_base: string;
  platform: string;
  version: string;
  app_name: string;
}

let shellInfo: ShellInfo | null = null;
let initPromise: Promise<ShellInfo | null> | null = null;
let eventsReady = false;

export function isDesktopShell(): boolean {
  return typeof window !== 'undefined' && !!(window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
}

function internals(): { invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown> } {
  return (window as unknown as { __TAURI_INTERNALS__: { invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown> } }).__TAURI_INTERNALS__;
}

/** Resolve shell info once; idempotent, safe to await from any caller. */
export function initDesktopShell(): Promise<ShellInfo | null> {
  if (!initPromise) {
    initPromise = (async () => {
      if (!isDesktopShell()) return null;
      try {
        shellInfo = (await internals().invoke('get_shell_info')) as ShellInfo;
      } catch (err) {
        console.warn('[desktop] get_shell_info failed — continuing as PWA', err);
        shellInfo = null;
      }
      return shellInfo;
    })();
  }
  return initPromise;
}

/** OS-stored device id from the shell (survives webview storage clears). */
export function getShellDeviceId(): string | null {
  return shellInfo?.device_id ?? null;
}

/** Absolute API base the SPA should target while inside the shell. */
export function getShellApiBase(): string | null {
  return shellInfo?.api_base ?? null;
}

export function getShellVersion(): string | null {
  return shellInfo?.version ?? null;
}

export function getShellAppName(): string | null {
  return shellInfo?.app_name ?? null;
}

/**
 * Wire native tray events into the SPA as plain window events so nothing
 * else needs a Tauri import:
 *   - `gihm:sync-now`      — tray "Sync now" pressed
 *   - `gihm:updates-result` — updater result message (detail: string)
 * Returns a cleanup function. No-op outside the shell.
 */
export async function setupShellEvents(): Promise<() => void> {
  if (!isDesktopShell() || eventsReady) return () => {};
  const unlisten: Array<() => void> = [];
  try {
    const { listen } = await import('@tauri-apps/api/event');
    unlisten.push(
      await listen('shell://sync-now', () => {
        window.dispatchEvent(new CustomEvent('gihm:sync-now'));
      }),
    );
    unlisten.push(
      await listen('shell://updates-result', (event) => {
        window.dispatchEvent(new CustomEvent('gihm:updates-result', { detail: event.payload }));
      }),
    );
  } catch (err) {
    // Partial wiring: drop whatever registered so a later retry is clean.
    unlisten.forEach((off) => off());
    console.warn('[desktop] shell event wiring failed', err);
    return () => {};
  }
  // Mark ready only after every listen registered — a transient failure above
  // must not permanently block a retry.
  eventsReady = true;
  return () => unlisten.forEach((off) => off());
}

// ---------------------------------------------------------------------------
// Bundled local edge backend (docs/26 §6 6d) — when the LAN has no server the
// desktop becomes the facility edge: the shell spawns the bundled Node API
// (provisioned by `deploy/edge/windows/backend.ps1`) on localhost:4000, which
// is the SPA's default API base. These wrappers expose that lifecycle to the
// Admin → Sync status UI and let the app ask for the backend at boot.
// ---------------------------------------------------------------------------

export interface LocalBackendStatus {
  provisioned: boolean;
  running: boolean;
  pid: number | null;
  port: number;
  dir: string;
}

async function invokeBackend(cmd: string): Promise<LocalBackendStatus | null> {
  if (!isDesktopShell()) return null;
  await initDesktopShell();
  try {
    return (await internals().invoke(cmd)) as LocalBackendStatus;
  } catch (err) {
    console.warn(`[desktop] ${cmd} failed`, err);
    return null;
  }
}

export function getLocalBackendStatus(): Promise<LocalBackendStatus | null> {
  return invokeBackend('local_backend_status');
}

export function startLocalBackend(): Promise<LocalBackendStatus | null> {
  return invokeBackend('start_local_backend');
}

export function stopLocalBackend(): Promise<LocalBackendStatus | null> {
  return invokeBackend('stop_local_backend');
}

/** Best-effort: make sure the bundled edge is up so the SPA finds an API. */
export async function ensureLocalBackend(): Promise<void> {
  if (!isDesktopShell()) return;
  const status = await getLocalBackendStatus();
  if (status?.provisioned && !status.running) {
    void startLocalBackend().catch(() => undefined);
  }
}
