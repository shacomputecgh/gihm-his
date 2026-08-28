import type { ApiError } from '../types';
import { getShellApiBase, initDesktopShell } from './desktop';
import { isDeviceLogoutCode, notifyDeviceRevoked } from './deviceStatus';

// Default: same-origin proxy (browser PWA). Inside the Tauri shell the SPA is
// served from tauri://localhost, so the shell's absolute API base wins.
const DEFAULT_BASE = '/api/v1';

let token: string | null = localStorage.getItem('gihm_token');

/**
 * Resolve the URL for an API path. Awaits the shell bridge once so the
 * absolute base is picked up before the first call inside the desktop shell.
 */
export async function apiUrl(path: string): Promise<string> {
  await initDesktopShell();
  const base = getShellApiBase() ?? DEFAULT_BASE;
  return new URL(base + path, window.location.origin).toString();
}

export function setToken(t: string | null) {
  token = t;
  if (t) localStorage.setItem('gihm_token', t);
  else localStorage.removeItem('gihm_token');
}
export function getToken() {
  return token;
}

export class ApiRequestError extends Error {
  status: number;
  code: string;
  candidates?: unknown[];
  constructor(status: number, code: string, message: string, candidates?: unknown[]) {
    super(message);
    this.status = status;
    this.code = code;
    this.candidates = candidates;
  }
}

export interface RequestOpts {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  headers?: Record<string, string>;
  /** Skip auth header (public endpoints). */
  public?: boolean;
  signal?: AbortSignal;
}

export async function api<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const url = new URL(await apiUrl(path));
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
    }
  }
  const headers: Record<string, string> = { ...opts.headers };
  if (!opts.public && token) headers.Authorization = `Bearer ${token}`;
  // Only declare a JSON body when there is one — an empty body with
  // Content-Type: application/json is rejected by some servers (400).
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });
  } catch {
    throw new ApiRequestError(0, 'NETWORK', 'Network error — offline or unreachable');
  }

  // In demo/offline mode tokens are synthetic — a 401 from the (absent) backend
  // is expected and must NOT invalidate the demo session.
  if (res.status === 401 && !opts.public && !token?.startsWith('demo-token')) {
    setToken(null);
    window.dispatchEvent(new Event('gihm:unauthorized'));
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }

  if (!res.ok) {
    const err = data as ApiError | null;
    const code = err?.error?.code ?? 'HTTP_ERROR';
    // A suspended/revoked device must drop its session immediately — the
    // auth provider reacts to the event by logging out (docs/21 §3).
    if (res.status === 403 && isDeviceLogoutCode(code)) {
      notifyDeviceRevoked(err?.error?.message ?? 'This device has been revoked by an administrator.');
    }
    throw new ApiRequestError(res.status, code, err?.error?.message ?? `Request failed (${res.status})`, err?.error?.candidates);
  }
  return data as T;
}

/**
 * Fetch an authenticated binary response (e.g. a patient document) as a Blob —
 * used for in-app previews (object URLs) and downloads. JSON-only `api()` can't
 * carry blobs, so raw fetches go through here with the session token.
 */
export async function fetchBlob(path: string): Promise<Blob> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(await apiUrl(path), { headers });
  if (res.status === 401 && !token?.startsWith('demo-token')) {
    setToken(null);
    window.dispatchEvent(new Event('gihm:unauthorized'));
  }
  if (!res.ok) throw new ApiRequestError(res.status, 'HTTP_ERROR', `Download failed (${res.status})`);
  return res.blob();
}

/**
 * Download a server-generated file (e.g. CSV export) with the session token.
 * The API client is JSON-only, so exports are fetched directly and saved via a
 * temporary object URL.
 */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(await apiUrl(path), { headers });
  if (res.status === 401 && !token?.startsWith('demo-token')) {
    setToken(null);
    window.dispatchEvent(new Event('gihm:unauthorized'));
  }
  if (!res.ok) throw new Error(`Export failed (${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
