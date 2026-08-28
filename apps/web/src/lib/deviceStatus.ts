/**
 * Device revocation handling (docs/21 §3, spec §97).
 *
 * The server enforces device lifecycle at sync time: a device that is not
 * ACTIVE (or that an admin remotely logged out) cannot push mutations. This
 * module turns that server signal into client behaviour:
 *
 *  * A SUSPENDED / revoked device must drop its cached offline session
 *    immediately — the user returns to the login screen (forced logout).
 *  * A PENDING device (new, awaiting admin approval) does NOT log the user
 *    out — sync is simply blocked until an administrator approves it.
 *  * Remote logout (`remoteLogoutAt` on the device) voids the cached session
 *    the next time the device talks to the server, without de-enrolling it.
 */
import { clearCachedSession, readCachedSession } from './offlineAuth';

/** Any structured device-lifecycle gate code the server can return. */
export const DEVICE_GATE_CODES = new Set(['DEVICE_PENDING_APPROVAL', 'DEVICE_SUSPENDED', 'DEVICE_REVOKED']);

/** Codes that mean the session itself is void → the user must log out. */
export const DEVICE_LOGOUT_CODES = new Set(['DEVICE_SUSPENDED', 'DEVICE_REVOKED']);

const NOTICE_KEY = 'gihm_device_revoked_notice';

export function isDeviceGateCode(code: string): boolean {
  return DEVICE_GATE_CODES.has(code);
}

export function isDeviceLogoutCode(code: string): boolean {
  return DEVICE_LOGOUT_CODES.has(code);
}

/**
 * True when the server's remoteLogoutAt is newer than the cached offline
 * session — the device was remotely logged out after this session began.
 */
export function deviceRevokedByRemoteLogout(
  remoteLogoutAt: string | null | undefined,
  cachedAt: number | null | undefined,
): boolean {
  if (!remoteLogoutAt || cachedAt === null || cachedAt === undefined) return false;
  return Date.parse(remoteLogoutAt) > cachedAt;
}

/**
 * Drop the session and tell the rest of the app: clears the offline session
 * cache, stores a notice for the login screen, and dispatches
 * `gihm:device-revoked` (the auth provider reacts by logging out).
 */
export function notifyDeviceRevoked(message: string): void {
  clearCachedSession();
  try {
    localStorage.setItem(NOTICE_KEY, JSON.stringify({ message, at: Date.now() }));
  } catch {
    /* best effort */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gihm:device-revoked', { detail: { message } }));
  }
}

export interface RevocationNotice {
  message: string;
  at: number;
}

export function readDeviceRevocationNotice(): RevocationNotice | null {
  try {
    const raw = localStorage.getItem(NOTICE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RevocationNotice;
    return typeof parsed.message === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

export function clearDeviceRevocationNotice(): void {
  localStorage.removeItem(NOTICE_KEY);
}

/**
 * Apply the sync-response device field: if the server's remoteLogoutAt is
 * newer than the cached session, force the logout now (the user is otherwise
 * happily using a session the admin just revoked).
 */
export function applyDeviceFromSync(device: { status: string; remoteLogoutAt: string | null } | null | undefined): void {
  if (!device) return;
  if (deviceRevokedByRemoteLogout(device.remoteLogoutAt, readCachedSession()?.cachedAt)) {
    notifyDeviceRevoked('This device was remotely logged out by an administrator. Please sign in again.');
  }
}
