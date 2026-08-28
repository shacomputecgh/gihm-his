import type { AuthUser } from '../types';

/**
 * Offline auth cache (docs/26 §6c, spec §108).
 *
 * A previously authorized device may resume the session while offline — the
 * cached credentials are the JWT itself (never a plaintext password), and the
 * cache is only honoured within the token's remaining lifetime, so offline
 * authorization expires per policy (the API signs tokens with
 * `security.sessionTtlHours`, default 12h).
 */

export interface CachedSession {
  token: string;
  user: AuthUser;
  /** Epoch ms when the token's `exp` claim fires. */
  expiresAt: number;
  cachedAt: number;
}

const KEY = 'gihm_offline_session';
const FALLBACK_TTL_MS = 12 * 60 * 60 * 1000; // only if the JWT has no exp

/** Decode the `exp` (epoch seconds) claim from a JWT, or null. */
export function decodeJwtExp(token: string): number | null {
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // JWT payloads are base64url without padding — restore it or atob throws.
    const json = JSON.parse(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))) as { exp?: unknown };
    return typeof json.exp === 'number' && Number.isFinite(json.exp) ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isSessionExpired(session: Pick<CachedSession, 'expiresAt'>, now = Date.now()): boolean {
  return now >= session.expiresAt;
}

/** Persist the session after a successful online login/refresh. */
export function cacheSession(token: string, user: AuthUser): void {
  const session: CachedSession = {
    token,
    user,
    expiresAt: decodeJwtExp(token) ?? Date.now() + FALLBACK_TTL_MS,
    cachedAt: Date.now(),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* storage full / private mode — cache is best-effort */
  }
}

export function readCachedSession(): CachedSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<CachedSession>;
    if (!s.token || !s.user || typeof s.expiresAt !== 'number') return null;
    return { token: s.token, user: s.user, expiresAt: s.expiresAt, cachedAt: s.cachedAt ?? 0 };
  } catch {
    return null;
  }
}

/** Drop the cache on logout / impersonation end / 401. */
export function clearCachedSession(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

/** Convenience: the cached session, only when still valid at `now`. */
export function readValidCachedSession(now = Date.now()): CachedSession | null {
  const s = readCachedSession();
  if (!s || isSessionExpired(s, now)) return null;
  return s;
}
