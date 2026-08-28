// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import LicenseBadge from './LicenseBadge';
import type { LicenseStatus } from '../types';

const mocks = vi.hoisted(() => ({
  api: vi.fn(),
}));

vi.mock('../lib/api', () => ({ api: mocks.api }));
let currentPath = '/';
vi.mock('react-router-dom', () => ({ useLocation: () => ({ pathname: currentPath }) }));

const license = (over: Partial<LicenseStatus> = {}): LicenseStatus => ({
  activated: true,
  edition: 'STANDARD',
  keySuffix: 'ABCD',
  expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
  expired: false,
  daysLeft: 30,
  facilities: { used: 2, max: 5 },
  users: { used: 10, max: 50 },
  compliant: true,
  limitsExceeded: [],
  ...over,
});

const renderBadge = () => render(<LicenseBadge />);

beforeEach(() => {
  mocks.api.mockReset().mockResolvedValue({ license: license() });
});

afterEach(() => cleanup());

describe('LicenseBadge', () => {
  it('renders nothing until the status fetch resolves', () => {
    renderBadge();
    expect(screen.queryByText(/LICENSED|UNLICENSED|EXPIRED/)).toBeNull();
  });

  it('shows UNLICENSED when no license is activated', async () => {
    mocks.api.mockResolvedValue({ license: license({ activated: false }) });
    renderBadge();
    await waitFor(() => expect(screen.getByText('UNLICENSED')).toBeTruthy());
  });

  it('shows EXPIRED in red when the license has lapsed', async () => {
    mocks.api.mockResolvedValue({ license: license({ expired: true, daysLeft: 0 }) });
    renderBadge();
    await waitFor(() => expect(screen.getByText(/EXPIRED/)).toBeTruthy());
  });

  it('shows OVER LIMIT when a limit is exceeded', async () => {
    mocks.api.mockResolvedValue({ license: license({ limitsExceeded: ['facilities'] }) });
    renderBadge();
    await waitFor(() => expect(screen.getByText('OVER LIMIT')).toBeTruthy());
  });

  it('shows the edition and days remaining for a healthy license', async () => {
    renderBadge();
    await waitFor(() => expect(screen.getByText(/STANDARD · 30d left/)).toBeTruthy());
  });

  it('stays hidden when the status fetch fails', async () => {
    mocks.api.mockRejectedValue(new Error('network down'));
    renderBadge();
    // Give the rejected promise a chance to resolve through the catch path.
    await new Promise((r) => setTimeout(r, 10));
    expect(screen.queryByText(/LICENSED|UNLICENSED|EXPIRED/)).toBeNull();
  });

  it('shows no days when daysLeft is null (perpetual license)', async () => {
    mocks.api.mockResolvedValue({ license: license({ daysLeft: null, expiresAt: null }) });
    renderBadge();
    await waitFor(() => expect(screen.getByText('STANDARD').textContent).toBe('STANDARD'));
    // No 'Xd left' suffix when daysLeft is null.
    expect(screen.queryByText(/\d+d left/)).toBeNull();
  });

  it('falls back to LICENSED when edition is null', async () => {
    mocks.api.mockResolvedValue({ license: license({ edition: null, daysLeft: null, expiresAt: null }) });
    renderBadge();
    await waitFor(() => expect(screen.getByText('LICENSED')).toBeTruthy());
  });

  it('skips re-fetch when the cache is still fresh', async () => {
    mocks.api.mockResolvedValue({ license: license() });
    const { rerender } = renderBadge();
    await waitFor(() => expect(screen.getByText(/STANDARD/)).toBeTruthy());
    const callCount = mocks.api.mock.calls.length;
    // Navigate to a new path within REFRESH_MS — the throttle should skip the API call
    // because the cached value is still fresh.
    currentPath = '/other';
    rerender(<LicenseBadge />);
    // The effect re-runs because location.pathname changed, but the throttle check
    // (Date.now() - lastFetch < REFRESH_MS && license) returns early.
    await new Promise((r) => setTimeout(r, 10));
    expect(mocks.api.mock.calls.length).toBe(callCount);
    currentPath = '/';
  });
});
