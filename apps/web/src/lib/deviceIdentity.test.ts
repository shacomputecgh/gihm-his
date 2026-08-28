import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';

// Device identity decides sync enrollment (docs/21): the browser PWA keeps a
// localStorage id; inside the Tauri shell the OS-stored id wins and sync
// reports platform WINDOWS. Globals are installed BEFORE the module import.
const g = vi.hoisted(() => {
  const store = new Map<string, string>();
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'TestAgent/1.0 (test)' }, configurable: true });
  (globalThis as Record<string, unknown>).window = {
    location: { origin: 'http://localhost:5173' },
    dispatchEvent: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  };
  return { store };
});

const shell = vi.hoisted(() => ({
  deviceId: null as string | null,
  appName: null as string | null,
  version: null as string | null,
}));

vi.mock('./desktop', () => ({
  initDesktopShell: vi.fn().mockResolvedValue(null),
  getShellDeviceId: vi.fn(() => shell.deviceId),
  getShellAppName: vi.fn(() => shell.appName),
  getShellVersion: vi.fn(() => shell.version),
}));

import { getDeviceId, resolveDeviceId, resolvePlatform, resolveDeviceName } from './offline';

beforeEach(() => {
  g.store.clear();
  shell.deviceId = null;
  shell.appName = null;
  shell.version = null;
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('device identity (docs/21)', () => {
  it('getDeviceId creates a stable localStorage id on first use and reuses it', () => {
    const id1 = getDeviceId();
    expect(id1).toBeTruthy();
    expect(g.store.get('gihm_device_id')).toBe(id1);
    expect(getDeviceId()).toBe(id1); // stable across calls
  });

  it('resolveDeviceId uses the localStorage id in the PWA', async () => {
    const id = getDeviceId();
    await expect(resolveDeviceId()).resolves.toBe(id);
    await expect(resolvePlatform()).resolves.toBe('PWA');
  });

  it('the OS-stored shell id wins when present', async () => {
    shell.deviceId = 'os-device-42';
    const local = getDeviceId(); // PWA id exists too
    await expect(resolveDeviceId()).resolves.toBe('os-device-42');
    await expect(resolvePlatform()).resolves.toBe('WINDOWS');
    expect(local).toBeTruthy(); // the localStorage id is still there as fallback
  });

  it('resolveDeviceName reports shell app + version, or just the app', async () => {
    shell.appName = 'GIHM HIS Desktop';
    shell.version = '1.2.3';
    await expect(resolveDeviceName()).resolves.toBe('GIHM HIS Desktop v1.2.3');
    shell.version = null;
    await expect(resolveDeviceName()).resolves.toBe('GIHM HIS Desktop');
  });

  it('resolveDeviceName falls back to the user agent outside the shell', async () => {
    await expect(resolveDeviceName()).resolves.toBe('TestAgent/1.0 (test)');
  });
});
