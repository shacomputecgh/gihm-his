import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// The Tauri shell bridge (docs/26 §6b/6d): detects the shell via
// window.__TAURI_INTERNALS__, loads shell info once, drives the bundled local
// edge backend lifecycle, and wires tray events. The bridge is tested with a
// stubbed window + Tauri internals; module state is reset per test.
const g = vi.hoisted(() => {
  const invoke = vi.fn();
  const dispatchEvent = vi.fn();
  (globalThis as Record<string, unknown>).window = {
    __TAURI_INTERNALS__: undefined,
    location: { origin: 'http://localhost:5173' },
    dispatchEvent,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  };
  return {
    invoke,
    dispatchEvent,
    listeners: [] as Array<{ event: string; cb: (e: { payload?: unknown }) => void }>,
  };
});

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(async (event: string, cb: (e: { payload?: unknown }) => void) => {
    g.listeners.push({ event, cb });
    return () => undefined;
  }),
}));

type DesktopMod = typeof import('./desktop');
let mod: DesktopMod;

function enterShell() {
  (globalThis.window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = { invoke: g.invoke };
}
function leaveShell() {
  (globalThis.window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = undefined;
}

beforeEach(async () => {
  g.listeners.length = 0;
  g.dispatchEvent.mockClear();
  g.invoke.mockReset().mockResolvedValue({});
  leaveShell();
  vi.resetModules();
  mod = await import('./desktop');
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('shell detection and info', () => {
  it('detects the shell via window.__TAURI_INTERNALS__', () => {
    expect(mod.isDesktopShell()).toBe(false);
    enterShell();
    expect(mod.isDesktopShell()).toBe(true);
  });

  it('resolves null outside the shell and leaves the getters empty', async () => {
    await expect(mod.initDesktopShell()).resolves.toBeNull();
    expect(mod.getShellDeviceId()).toBeNull();
    expect(mod.getShellApiBase()).toBeNull();
    expect(mod.getShellVersion()).toBeNull();
    expect(mod.getShellAppName()).toBeNull();
  });

  it('loads shell info once inside the shell and exposes it via the getters', async () => {
    const info = { device_id: 'os-1', api_base: 'http://localhost:4000/api/v1', platform: 'WINDOWS', version: '2.0.0', app_name: 'GIHM HIS Desktop' };
    g.invoke.mockResolvedValue(info);
    enterShell();
    await expect(mod.initDesktopShell()).resolves.toEqual(info);
    await mod.initDesktopShell(); // cached — no second invoke
    expect(g.invoke).toHaveBeenCalledTimes(1);
    expect(g.invoke).toHaveBeenCalledWith('get_shell_info');
    expect(mod.getShellDeviceId()).toBe('os-1');
    expect(mod.getShellApiBase()).toBe('http://localhost:4000/api/v1');
    expect(mod.getShellVersion()).toBe('2.0.0');
    expect(mod.getShellAppName()).toBe('GIHM HIS Desktop');
  });

  it('degrades to null when get_shell_info fails', async () => {
    g.invoke.mockRejectedValue(new Error('bridge down'));
    enterShell();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await expect(mod.initDesktopShell()).resolves.toBeNull();
    expect(mod.getShellDeviceId()).toBeNull();
    warn.mockRestore();
  });
});

describe('local edge backend lifecycle (docs/26 §6d)', () => {
  it('returns null outside the shell and drives the right commands inside it', async () => {
    const st = { provisioned: true, running: false, pid: null, port: 4000, dir: 'C:\\GIHM-HIS\\local-backend' };
    await expect(mod.getLocalBackendStatus()).resolves.toBeNull(); // outside shell
    g.invoke.mockResolvedValue(st);
    enterShell();
    await expect(mod.getLocalBackendStatus()).resolves.toEqual(st);
    expect(g.invoke).toHaveBeenCalledWith('local_backend_status');
    await mod.startLocalBackend();
    expect(g.invoke).toHaveBeenCalledWith('start_local_backend');
    await mod.stopLocalBackend();
    expect(g.invoke).toHaveBeenCalledWith('stop_local_backend');
  });

  it('returns null when a backend command fails', async () => {
    g.invoke.mockRejectedValue(new Error('boom'));
    enterShell();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await expect(mod.getLocalBackendStatus()).resolves.toBeNull();
    warn.mockRestore();
  });

  it('starts the backend only when it is provisioned and stopped', async () => {
    await mod.ensureLocalBackend(); // outside shell — no-op
    expect(g.invoke).not.toHaveBeenCalled();
    enterShell();
    const status = (partial: object) => g.invoke.mockResolvedValue({ provisioned: false, running: false, pid: null, port: 4000, dir: 'x', ...partial });
    // provisioned + stopped → starts
    status({ provisioned: true, running: false });
    await mod.ensureLocalBackend();
    expect(g.invoke).toHaveBeenCalledWith('start_local_backend');
    // running → no start
    g.invoke.mockClear();
    status({ provisioned: true, running: true, pid: 1 });
    await mod.ensureLocalBackend();
    expect(g.invoke).not.toHaveBeenCalledWith('start_local_backend');
    // unprovisioned → no start
    g.invoke.mockClear();
    status({ provisioned: false });
    await mod.ensureLocalBackend();
    expect(g.invoke).not.toHaveBeenCalledWith('start_local_backend');
  });
});

describe('tray event wiring', () => {
  it('forwards shell events as window events and returns a cleanup', async () => {
    enterShell();
    const cleanup = await mod.setupShellEvents();
    expect(g.listeners.map((l) => l.event)).toEqual(['shell://sync-now', 'shell://updates-result']);
    g.listeners[0]!.cb({});
    expect(g.dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'gihm:sync-now' }));
    g.listeners[1]!.cb({ payload: 'v2.0' });
    expect(g.dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'gihm:updates-result', detail: 'v2.0' }));
    cleanup();
  });

  it('is a no-op outside the shell', async () => {
    const cleanup = await mod.setupShellEvents();
    expect(cleanup()).toBeUndefined();
    expect(g.listeners).toHaveLength(0);
  });
});
