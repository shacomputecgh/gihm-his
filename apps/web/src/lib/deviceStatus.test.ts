import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  applyDeviceFromSync,
  clearDeviceRevocationNotice,
  deviceRevokedByRemoteLogout,
  isDeviceGateCode,
  isDeviceLogoutCode,
  notifyDeviceRevoked,
  readDeviceRevocationNotice,
} from './deviceStatus';
import { cacheSession, clearCachedSession, readCachedSession } from './offlineAuth';
import type { AuthUser } from '../types';

const user: AuthUser = {
  id: 'u1',
  email: 'a@b.gh',
  fullName: 'A User',
  roleCode: 'DOCTOR',
  roleName: 'Doctor',
  scope: 'FACILITY',
  permissions: [],
  organizationId: null,
  facilityId: 'f1',
  regionId: null,
  districtId: null,
  regionName: null,
  districtName: null,
  facilityName: null,
};

beforeEach(() => {
  localStorage.clear();
  clearCachedSession();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('gate code classification', () => {
  it('recognises all device gate codes', () => {
    expect(isDeviceGateCode('DEVICE_PENDING_APPROVAL')).toBe(true);
    expect(isDeviceGateCode('DEVICE_SUSPENDED')).toBe(true);
    expect(isDeviceGateCode('DEVICE_REVOKED')).toBe(true);
    expect(isDeviceGateCode('FORBIDDEN')).toBe(false);
  });

  it('distinguishes logout codes from the pending-approval notice', () => {
    expect(isDeviceLogoutCode('DEVICE_SUSPENDED')).toBe(true);
    expect(isDeviceLogoutCode('DEVICE_REVOKED')).toBe(true);
    // Pending approval must NOT log the user out — sync is just blocked.
    expect(isDeviceLogoutCode('DEVICE_PENDING_APPROVAL')).toBe(false);
  });
});

describe('deviceRevokedByRemoteLogout', () => {
  it('is true when the remote logout happened after the cached session', () => {
    const remoteLogoutAt = new Date(Date.now() + 60_000).toISOString();
    expect(deviceRevokedByRemoteLogout(remoteLogoutAt, Date.now() - 60_000)).toBe(true);
  });

  it('is false when the cached session is newer than the remote logout', () => {
    const remoteLogoutAt = new Date(Date.now() - 60_000).toISOString();
    expect(deviceRevokedByRemoteLogout(remoteLogoutAt, Date.now())).toBe(false);
  });

  it('is false without a remoteLogoutAt or a cached session marker', () => {
    expect(deviceRevokedByRemoteLogout(null, Date.now())).toBe(false);
    expect(deviceRevokedByRemoteLogout(new Date().toISOString(), undefined)).toBe(false);
  });
});

describe('notifyDeviceRevoked', () => {
  it('clears the cached offline session', () => {
    cacheSession('tkn', user);
    expect(readCachedSession()).not.toBeNull();
    notifyDeviceRevoked('Device suspended');
    expect(readCachedSession()).toBeNull();
  });

  it('stores a notice for the login screen and dispatches the event', () => {
    // The vitest environment is node — give the module a minimal window so the
    // 'gihm:device-revoked' dispatch is exercised.
    const target = new EventTarget();
    vi.stubGlobal('window', target);
    const listener = vi.fn();
    target.addEventListener('gihm:device-revoked', listener as EventListener);
    notifyDeviceRevoked('This device has been suspended.');
    expect(listener).toHaveBeenCalledTimes(1);
    const detail = listener.mock.calls[0]![0] as CustomEvent<{ message: string }>;
    expect(detail.detail.message).toBe('This device has been suspended.');
    expect(readDeviceRevocationNotice()?.message).toBe('This device has been suspended.');
  });

  it('clears the notice on request', () => {
    notifyDeviceRevoked('Device suspended');
    expect(readDeviceRevocationNotice()).not.toBeNull();
    clearDeviceRevocationNotice();
    expect(readDeviceRevocationNotice()).toBeNull();
  });

  it('handles localStorage.setItem throwing in notifyDeviceRevoked', () => {
    const orig = localStorage.setItem;
    localStorage.setItem = vi.fn(() => { throw new Error('quota exceeded'); });
    notifyDeviceRevoked('This device has been suspended.');
    // Should not throw — best effort catch
    localStorage.setItem = orig;
  });

  it('handles localStorage.getItem throwing in readDeviceRevocationNotice', () => {
    const orig = localStorage.getItem;
    localStorage.getItem = vi.fn(() => { throw new Error('storage error'); });
    const result = readDeviceRevocationNotice();
    expect(result).toBeNull();
    localStorage.getItem = orig;
  });

  it('returns null when localStorage returns non-object JSON', () => {
    const orig = localStorage.getItem;
    localStorage.getItem = vi.fn(() => 'not-an-object');
    const result = readDeviceRevocationNotice();
    expect(result).toBeNull();
    localStorage.getItem = orig;
  });

  it('returns null when localStorage returns JSON without a message field', () => {
    const orig = localStorage.getItem;
    localStorage.getItem = vi.fn(() => JSON.stringify({ at: Date.now() }));
    const result = readDeviceRevocationNotice();
    expect(result).toBeNull();
    localStorage.getItem = orig;
  });
});

describe('applyDeviceFromSync', () => {
  it('does nothing when the sync response has no device', () => {
    cacheSession('tkn', user);
    applyDeviceFromSync(null);
    applyDeviceFromSync(undefined);
    expect(readCachedSession()).not.toBeNull();
  });

  it('force-logs out when remoteLogoutAt is newer than the cached session', () => {
    cacheSession('tkn', user);
    const remoteLogoutAt = new Date(Date.now() + 5_000).toISOString();
    applyDeviceFromSync({ status: 'ACTIVE', remoteLogoutAt });
    expect(readCachedSession()).toBeNull();
    expect(readDeviceRevocationNotice()).not.toBeNull();
  });

  it('keeps the session when the device was not remotely logged out', () => {
    cacheSession('tkn', user);
    applyDeviceFromSync({ status: 'ACTIVE', remoteLogoutAt: new Date(Date.now() - 5_000).toISOString() });
    expect(readCachedSession()).not.toBeNull();
  });
});
