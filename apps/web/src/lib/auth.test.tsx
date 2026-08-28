// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, cleanup } from '@testing-library/react';
import { AuthProvider, useAuth } from './auth';
import type { AuthUser } from '../types';

const mocks = vi.hoisted(() => {
  class ApiRequestError extends Error {
    status: number;
    constructor(status: number, message = 'request failed') {
      super(message);
      this.name = 'ApiRequestError';
      this.status = status;
    }
  }
  return {
    ApiRequestError,
    api: vi.fn(),
    setToken: vi.fn(),
    cacheSession: vi.fn(),
    clearCachedSession: vi.fn(),
    readValidCachedSession: vi.fn(),
    clearDeviceRevocationNotice: vi.fn(),
    readDeviceRevocationNotice: vi.fn(),
  };
});

vi.mock('./api', () => ({ api: mocks.api, setToken: mocks.setToken, ApiRequestError: mocks.ApiRequestError }));
vi.mock('./offlineAuth', () => ({
  cacheSession: mocks.cacheSession,
  clearCachedSession: mocks.clearCachedSession,
  readValidCachedSession: mocks.readValidCachedSession,
}));
vi.mock('./deviceStatus', () => ({
  clearDeviceRevocationNotice: mocks.clearDeviceRevocationNotice,
  readDeviceRevocationNotice: mocks.readDeviceRevocationNotice,
}));

const user = (email: string): AuthUser => ({ id: email, email, fullName: 'T', roleCode: 'NURSE', roleName: 'Nurse', scope: 'FACILITY', permissions: [], organizationId: null, facilityId: null, regionId: null, districtId: null, regionName: null, districtName: null, facilityName: null });

function Probe() {
  const a = useAuth();
  return (
    <div>
      <span data-testid="user">{a.user?.email ?? 'none'}</span>
      <span data-testid="loading">{String(a.loading)}</span>
      <span data-testid="notice">{a.revocationNotice ?? 'none'}</span>
      <button onClick={() => void a.login('login@demo.gh', 'pw')}>login</button>
      <button onClick={() => a.logout()}>logout</button>
      <button onClick={() => a.impersonate('imp-token', user('imp@demo.gh'))}>impersonate</button>
    </div>
  );
}

const renderProbe = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );

beforeEach(() => {
  mocks.api.mockReset();
  mocks.setToken.mockClear();
  mocks.cacheSession.mockClear();
  mocks.clearCachedSession.mockClear();
  mocks.readValidCachedSession.mockClear().mockReturnValue(null);
  mocks.clearDeviceRevocationNotice.mockClear();
  mocks.readDeviceRevocationNotice.mockClear().mockReturnValue(null);
});

afterEach(() => cleanup());

describe('AuthProvider', () => {
  it('restores the session from /auth/me on mount', async () => {
    mocks.api.mockResolvedValue({ user: user('me@demo.gh') });
    renderProbe();
    expect(screen.getByTestId('loading').textContent).toBe('true');
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('me@demo.gh'));
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  it('resumes the cached session when offline (network failure, not a 401)', async () => {
    mocks.api.mockRejectedValue(new mocks.ApiRequestError(0));
    mocks.readValidCachedSession.mockReturnValue({ token: 'cached-token', user: user('cached@demo.gh') });
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('cached@demo.gh'));
    expect(mocks.setToken).toHaveBeenCalledWith('cached-token');
  });

  it('drops the session on a 401 and keeps it dropped without a cached session', async () => {
    mocks.api.mockRejectedValue(new mocks.ApiRequestError(401));
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('user').textContent).toBe('none');
    expect(mocks.setToken).toHaveBeenCalledWith(null);
  });

  it('login stores the token, sets the user and caches the session for offline resume', async () => {
    mocks.api.mockResolvedValue({ token: 'tok-1', user: user('login@demo.gh') });
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    act(() => screen.getByRole('button', { name: 'login' }).click());
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('login@demo.gh'));
    expect(mocks.setToken).toHaveBeenCalledWith('tok-1');
    expect(mocks.cacheSession).toHaveBeenCalledWith('tok-1', expect.objectContaining({ email: 'login@demo.gh' }));
  });

  it('logout clears the token, the user and the cached session', async () => {
    mocks.api.mockResolvedValue({ user: user('me@demo.gh') });
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('me@demo.gh'));
    act(() => screen.getByRole('button', { name: 'logout' }).click());
    expect(screen.getByTestId('user').textContent).toBe('none');
    expect(mocks.setToken).toHaveBeenCalledWith(null);
    expect(mocks.clearCachedSession).toHaveBeenCalled();
  });

  it('drops the session and shows the notice when the device is revoked', async () => {
    mocks.api.mockResolvedValue({ user: user('me@demo.gh') });
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('me@demo.gh'));
    act(() => window.dispatchEvent(new CustomEvent('gihm:device-revoked', { detail: { message: 'Suspended by admin' } })));
    expect(screen.getByTestId('user').textContent).toBe('none');
    expect(screen.getByTestId('notice').textContent).toBe('Suspended by admin');
    expect(mocks.setToken).toHaveBeenCalledWith(null);
  });

  it('impersonate sets the token and user without caching the session', async () => {
    mocks.api.mockResolvedValue({ user: user('real@demo.gh') });
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('real@demo.gh'));
    act(() => screen.getByRole('button', { name: 'impersonate' }).click());
    expect(screen.getByTestId('user').textContent).toBe('imp@demo.gh');
    expect(mocks.setToken).toHaveBeenCalledWith('imp-token');
    expect(mocks.clearCachedSession).toHaveBeenCalled();
    // The cacheSession must NOT have been called for impersonation.
    expect(mocks.cacheSession).not.toHaveBeenCalled();
  });

  it('drops the token on a network failure with no cached session', async () => {
    mocks.api.mockRejectedValue(new mocks.ApiRequestError(0));
    mocks.readValidCachedSession.mockReturnValue(null);
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('user').textContent).toBe('none');
    expect(mocks.setToken).toHaveBeenCalledWith(null);
  });

  it('surfaces a stored revocation notice from a previous session', () => {
    mocks.readDeviceRevocationNotice.mockReturnValue({ message: 'Device was blocked' });
    renderProbe();
    expect(screen.getByTestId('notice').textContent).toBe('Device was blocked');
  });
});
