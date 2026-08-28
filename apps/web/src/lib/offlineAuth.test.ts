import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cacheSession, clearCachedSession, decodeJwtExp, isSessionExpired, readCachedSession, readValidCachedSession } from './offlineAuth';
import type { AuthUser } from '../types';

/** Build a real JWT-shaped token with a chosen `exp` (epoch seconds).
 * Payloads are base64url WITHOUT padding, exactly like real JWTs — so the
 * decode path is exercised against the real-world format. */
function tokenWithExp(expSec: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=+$/, '');
  const payload = btoa(JSON.stringify({ sub: 'u1', exp: expSec })).replace(/=+$/, '');
  return `${header}.${payload}.sig`;
}

const user: AuthUser = {
  id: 'u1',
  email: 'doc@demo.gh',
  fullName: 'Test Doctor',
  roleCode: 'DOCTOR',
  roleName: 'Doctor',
  scope: 'FACILITY',
  permissions: ['view_patient'],
  organizationId: null,
  facilityId: null,
  regionId: null,
  districtId: null,
  regionName: null,
  districtName: null,
  facilityName: null,
};

describe('decodeJwtExp', () => {
  it('decodes the exp claim from a JWT payload', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    expect(decodeJwtExp(tokenWithExp(exp))).toBe(exp * 1000);
  });

  it('returns null for malformed tokens', () => {
    expect(decodeJwtExp('not-a-jwt')).toBeNull();
    expect(decodeJwtExp('a.b.c')).toBeNull();
    expect(decodeJwtExp('')).toBeNull();
  });

  it('returns null when exp is missing or non-numeric', () => {
    const header = btoa(JSON.stringify({ alg: 'HS256' }));
    const payload = btoa(JSON.stringify({ sub: 'u1', exp: 'soon' }));
    expect(decodeJwtExp(`${header}.${payload}.sig`)).toBeNull();
  });

  it('decodes unpadded base64url payloads whose length is 2 mod 4', () => {
    // {'sub':'u1','exp':123456} → 25 chars → base64 length is 34 (2 mod 4) once
    // the JWT's padding is stripped — atob would throw without the restore.
    const payload = btoa(JSON.stringify({ sub: 'u1', exp: 123456 })).replace(/=+$/, '');
    expect(payload.length % 4).toBe(2);
    expect(decodeJwtExp(`header.${payload}.sig`)).toBe(123456 * 1000);
  });
});

describe('isSessionExpired', () => {
  it('expires at exactly the exp boundary (>=)', () => {
    const expiresAt = Date.now() + 60_000;
    expect(isSessionExpired({ expiresAt }, expiresAt - 1)).toBe(false);
    expect(isSessionExpired({ expiresAt }, expiresAt)).toBe(true);
    expect(isSessionExpired({ expiresAt }, expiresAt + 1)).toBe(true);
  });
});

describe('cache round-trip', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('stores and reads back the session', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    cacheSession(tokenWithExp(exp), user);
    const cached = readCachedSession();
    expect(cached?.user.email).toBe('doc@demo.gh');
    expect(cached?.expiresAt).toBe(exp * 1000);
  });

  it('clears the cache', () => {
    cacheSession(tokenWithExp(Math.floor(Date.now() / 1000) + 3600), user);
    clearCachedSession();
    expect(readCachedSession()).toBeNull();
  });

  it('readValidCachedSession returns null once expired', () => {
    const expired = Math.floor(Date.now() / 1000) - 10;
    cacheSession(tokenWithExp(expired), user);
    expect(readValidCachedSession()).toBeNull();

    const valid = Math.floor(Date.now() / 1000) + 3600;
    cacheSession(tokenWithExp(valid), user);
    expect(readValidCachedSession()?.user.email).toBe('doc@demo.gh');
  });

  it('ignores corrupted cache entries', () => {
    localStorage.setItem('gihm_offline_session', '{not json');
    expect(readCachedSession()).toBeNull();
    localStorage.setItem('gihm_offline_session', JSON.stringify({ token: 'x' }));
    expect(readCachedSession()).toBeNull();
  });

  it('cacheSession is best-effort when localStorage.setItem throws', () => {
    const orig = localStorage.setItem;
    localStorage.setItem = vi.fn(() => { throw new Error('quota exceeded'); });
    cacheSession('tok', { id: 'u1', fullName: 'Test', roleCode: 'R', roleName: 'R', scope: 'N', permissions: [], facilityId: null, regionId: null, districtId: null, organizationId: null, regionName: null, districtName: null, facilityName: null, email: 'a@b.com' });
    // Should not throw
    localStorage.setItem = orig;
  });

  it('readCachedSession returns null when localStorage.getItem throws', () => {
    const orig = localStorage.getItem;
    localStorage.getItem = vi.fn(() => { throw new Error('storage error'); });
    expect(readCachedSession()).toBeNull();
    localStorage.getItem = orig;
  });

  it('clearCachedSession does not throw when localStorage.removeItem throws', () => {
    const orig = localStorage.removeItem;
    localStorage.removeItem = vi.fn(() => { throw new Error('storage error'); });
    clearCachedSession();
    localStorage.removeItem = orig;
  });
});
