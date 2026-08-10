import type { ApiError } from '../types';

const BASE = '/api/v1';

let token: string | null = localStorage.getItem('gihm_token');

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
  const url = new URL(BASE + path, window.location.origin);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
    }
  }
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...opts.headers };
  if (!opts.public && token) headers.Authorization = `Bearer ${token}`;

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

  if (res.status === 401 && !opts.public) {
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
    throw new ApiRequestError(
      res.status,
      err?.error?.code ?? 'HTTP_ERROR',
      err?.error?.message ?? `Request failed (${res.status})`,
      err?.error?.candidates,
    );
  }
  return data as T;
}
