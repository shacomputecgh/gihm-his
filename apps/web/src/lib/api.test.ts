import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// The api() client is DOM-adjacent (window/localStorage) but testable under
// node with stubbed globals. Globals are installed BEFORE the module import so
// the module-scope `localStorage.getItem('gihm_token')` sees the stub.
const g = vi.hoisted(() => {
  const store = new Map<string, string>();
  const events: string[] = [];
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
  (globalThis as Record<string, unknown>).window = {
    location: { origin: 'http://localhost:5173' },
    dispatchEvent: (e: Event) => void events.push(e.type),
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  };
  return { store, events };
});

vi.mock('./desktop', () => ({
  initDesktopShell: vi.fn().mockResolvedValue(null),
  getShellApiBase: vi.fn().mockReturnValue(null),
}));
vi.mock('./deviceStatus', () => ({
  isDeviceLogoutCode: vi.fn((code: string) => code.startsWith('DEVICE_')),
  notifyDeviceRevoked: vi.fn(),
}));

import { api, setToken, getToken, ApiRequestError, fetchBlob, downloadFile } from './api';
import { notifyDeviceRevoked } from './deviceStatus';

function jsonResponse(status: number, body: unknown): Response {
  return { status, ok: status >= 200 && status < 300, json: async () => body } as Response;
}

beforeEach(() => {
  g.store.clear();
  g.events.length = 0;
  setToken(null);
  vi.stubGlobal('fetch', vi.fn());
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('api()', () => {
  it('sends an authenticated GET with no body and no Content-Type', async () => {
    setToken('tok-123');
    const fetchMock = vi.mocked(globalThis.fetch).mockResolvedValue(jsonResponse(200, { ok: true }));
    const res = await api<{ ok: boolean }>('/patients');
    expect(res).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe('http://localhost:5173/api/v1/patients');
    expect(init!.method).toBe('GET');
    expect(init!.headers).toEqual({ Authorization: 'Bearer tok-123' });
    expect(init!.body).toBeUndefined();
  });

  it('skips the auth header and sends a JSON body for public POSTs', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(jsonResponse(200, { token: 't' }));
    await api('/auth/login', { public: true, method: 'POST', body: { email: 'a@b.gh', password: 'x' } });
    const [url, init] = vi.mocked(globalThis.fetch).mock.calls[0]!;
    expect(String(url)).toBe('http://localhost:5173/api/v1/auth/login');
    expect(init!.headers).toEqual({ 'Content-Type': 'application/json' }); // no Authorization
    expect(init!.body).toBe(JSON.stringify({ email: 'a@b.gh', password: 'x' }));
  });

  it('builds the query string, dropping undefined and empty values', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(jsonResponse(200, []));
    await api('/facilities', { query: { region: 'GA', q: undefined, empty: '', page: '2' } });
    const [url] = vi.mocked(globalThis.fetch).mock.calls[0]!;
    expect(String(url)).toBe('http://localhost:5173/api/v1/facilities?region=GA&page=2');
  });

  it('throws a NETWORK ApiRequestError when fetch itself fails (offline)', async () => {
    vi.mocked(globalThis.fetch).mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(api('/patients')).rejects.toMatchObject({ status: 0, code: 'NETWORK' });
  });

  it('maps non-OK bodies to ApiRequestError with code, message and candidates', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(jsonResponse(422, { error: { code: 'VALIDATION', message: 'MRN taken', candidates: ['x'] } }));
    await expect(api('/patients', { method: 'POST', body: {} })).rejects.toMatchObject({
      status: 422,
      code: 'VALIDATION',
      message: 'MRN taken',
      candidates: ['x'],
    });
  });

  it('on 401 clears the token and dispatches the unauthorized event', async () => {
    setToken('tok-123');
    vi.mocked(globalThis.fetch).mockResolvedValue(jsonResponse(401, { error: { code: 'UNAUTHORIZED', message: 'Session expired' } }));
    await expect(api('/patients')).rejects.toBeInstanceOf(ApiRequestError);
    expect(getToken()).toBeNull();
    expect(g.events).toContain('gihm:unauthorized');
  });

  it('on a device-logout 403 notifies the device-status layer (docs/21)', async () => {
    setToken('tok-123');
    vi.mocked(globalThis.fetch).mockResolvedValue(jsonResponse(403, { error: { code: 'DEVICE_SUSPENDED', message: 'This device was suspended.' } }));
    await expect(api('/sync/mutations')).rejects.toMatchObject({ status: 403, code: 'DEVICE_SUSPENDED' });
    expect(vi.mocked(notifyDeviceRevoked)).toHaveBeenCalledWith('This device was suspended.');
    // A non-device 403 must NOT trigger the revocation path.
    vi.mocked(notifyDeviceRevoked).mockClear();
    vi.mocked(globalThis.fetch).mockResolvedValue(jsonResponse(403, { error: { code: 'FORBIDDEN', message: 'nope' } }));
    await expect(api('/admin')).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(vi.mocked(notifyDeviceRevoked)).not.toHaveBeenCalled();
  });
});

describe('fetchBlob()', () => {
  it('fetches with the session token and returns the blob', async () => {
    setToken('tok-123');
    const blob = new Blob(['pdf-bytes']);
    const fetchMock = vi.mocked(globalThis.fetch).mockResolvedValue({ status: 200, ok: true, blob: async () => blob } as Response);
    const out = await fetchBlob('/documents/1/file');
    expect(out).toBe(blob);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe('http://localhost:5173/api/v1/documents/1/file');
    expect(init!.headers).toEqual({ Authorization: 'Bearer tok-123' });
  });

  it('on 401 clears the token and dispatches the unauthorized event', async () => {
    setToken('tok-123');
    vi.mocked(globalThis.fetch).mockResolvedValue({ status: 401, ok: false, blob: async () => new Blob() } as Response);
    await expect(fetchBlob('/documents/1/file')).rejects.toBeInstanceOf(ApiRequestError);
    expect(getToken()).toBeNull();
    expect(g.events).toContain('gihm:unauthorized');
  });
});

describe('downloadFile()', () => {
  // The object-URL methods are browser-only; attach them to the real URL
  // constructor (which apiUrl() still needs for new URL(...)).
  const createUrl = vi.fn(() => 'blob:url-1');
  const revokeUrl = vi.fn();

  beforeEach(() => {
    const anchor = { click: vi.fn(), remove: vi.fn(), href: '', download: '' };
    (URL as unknown as Record<string, unknown>).createObjectURL = createUrl;
    (URL as unknown as Record<string, unknown>).revokeObjectURL = revokeUrl;
    createUrl.mockClear();
    revokeUrl.mockClear();
    vi.stubGlobal('document', {
      createElement: () => anchor,
      body: { appendChild: vi.fn() },
    });
  });

  it('saves the blob through a temporary anchor and revokes the URL', async () => {
    setToken('tok-123');
    const blob = new Blob(['csv-bytes']);
    const fetchMock = vi.mocked(globalThis.fetch).mockResolvedValue({ status: 200, ok: true, blob: async () => blob } as Response);
    await downloadFile('/reports/export', 'report.csv');
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe('http://localhost:5173/api/v1/reports/export');
    expect(init!.headers).toEqual({ Authorization: 'Bearer tok-123' });
    expect(createUrl).toHaveBeenCalledWith(blob);
    const anchor = (globalThis.document as unknown as { createElement: () => { download: string; click: ReturnType<typeof vi.fn>; href: string } }).createElement();
    expect(anchor.download).toBe('report.csv');
    expect(anchor.href).toBe('blob:url-1');
    expect(anchor.click).toHaveBeenCalled();
    expect(revokeUrl).toHaveBeenCalledWith('blob:url-1');
  });

  it('on 401 clears the token and dispatches the unauthorized event', async () => {
    setToken('tok-123');
    vi.mocked(globalThis.fetch).mockResolvedValue({ status: 401, ok: false, blob: async () => new Blob() } as Response);
    await expect(downloadFile('/reports/export', 'report.csv')).rejects.toThrow('Export failed (401)');
    expect(getToken()).toBeNull();
    expect(g.events).toContain('gihm:unauthorized');
  });

  it('throws on a non-OK response', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({ status: 500, ok: false, blob: async () => new Blob() } as Response);
    await expect(downloadFile('/reports/export', 'report.csv')).rejects.toThrow('Export failed (500)');
  });
});
