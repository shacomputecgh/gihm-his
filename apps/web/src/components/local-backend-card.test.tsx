// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import LocalBackendCard from './LocalBackendCard';
import { Toaster } from './ui';
import type { LocalBackendStatus } from '../lib/desktop';

const mocks = vi.hoisted(() => ({
  isDesktopShell: vi.fn(() => true),
  getLocalBackendStatus: vi.fn(),
  startLocalBackend: vi.fn(),
  stopLocalBackend: vi.fn(),
}));

vi.mock('../lib/desktop', () => ({
  isDesktopShell: mocks.isDesktopShell,
  getLocalBackendStatus: mocks.getLocalBackendStatus,
  startLocalBackend: mocks.startLocalBackend,
  stopLocalBackend: mocks.stopLocalBackend,
}));

const status = (over: Partial<LocalBackendStatus> = {}): LocalBackendStatus => ({
  provisioned: false,
  running: false,
  pid: null,
  port: 4000,
  dir: 'C:\\GIHM-HIS\\local-backend',
  ...over,
});

const renderCard = () =>
  render(
    <Toaster>
      <LocalBackendCard />
    </Toaster>,
  );

beforeEach(() => {
  mocks.isDesktopShell.mockReset().mockReturnValue(true);
  mocks.getLocalBackendStatus.mockReset().mockResolvedValue(null);
  mocks.startLocalBackend.mockReset().mockResolvedValue(null);
  mocks.stopLocalBackend.mockReset().mockResolvedValue(null);
});

afterEach(() => cleanup());

describe('LocalBackendCard', () => {
  it('renders nothing outside the desktop shell', async () => {
    mocks.isDesktopShell.mockReturnValue(false);
    renderCard();
    expect(screen.queryByText('Local edge backend')).toBeNull();
  });

  it('shows the running state with the endpoint and pid', async () => {
    mocks.getLocalBackendStatus.mockResolvedValue(status({ provisioned: true, running: true, pid: 4242 }));
    renderCard();
    await waitFor(() => expect(screen.getByText('Running')).toBeTruthy());
    expect(screen.getByText(/http:\/\/localhost:4000\/api\/v1/)).toBeTruthy();
    expect(screen.getByText(/pid 4242/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Start/ })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: /Stop/ })).toHaveProperty('disabled', false);
  });

  it('shows the provisioned-but-stopped state with Start armed', async () => {
    mocks.getLocalBackendStatus.mockResolvedValue(status({ provisioned: true, running: false }));
    renderCard();
    await waitFor(() => expect(screen.getByText('Provisioned · stopped')).toBeTruthy());
    expect(screen.getByRole('button', { name: /Start/ })).toHaveProperty('disabled', false);
    expect(screen.getByRole('button', { name: /Stop/ })).toHaveProperty('disabled', true);
  });

  it('shows the not-provisioned state with both actions disabled', async () => {
    mocks.getLocalBackendStatus.mockResolvedValue(status({ provisioned: false }));
    renderCard();
    await waitFor(() => expect(screen.getByText('Not provisioned')).toBeTruthy());
    expect(screen.getByRole('button', { name: /Start/ })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: /Stop/ })).toHaveProperty('disabled', true);
  });

  it('shows Unavailable when the bridge reports nothing', async () => {
    renderCard();
    await waitFor(() => expect(screen.getByText('Unavailable')).toBeTruthy());
  });

  it('starts the backend and reflects the new status', async () => {
    mocks.getLocalBackendStatus.mockResolvedValue(status({ provisioned: true, running: false }));
    mocks.startLocalBackend.mockResolvedValue(status({ provisioned: true, running: true, pid: 9999 }));
    renderCard();
    await waitFor(() => expect(screen.getByText('Provisioned · stopped')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /Start/ }));
    await waitFor(() => expect(mocks.startLocalBackend).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('Running')).toBeTruthy());
    expect(screen.getByText('Local backend started')).toBeTruthy();
  });

  it('stops a running backend', async () => {
    mocks.getLocalBackendStatus.mockResolvedValue(status({ provisioned: true, running: true, pid: 4242 }));
    mocks.stopLocalBackend.mockResolvedValue(status({ provisioned: true, running: false, pid: null }));
    renderCard();
    await waitFor(() => expect(screen.getByText('Running')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /Stop/ }));
    await waitFor(() => expect(mocks.stopLocalBackend).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('Provisioned · stopped')).toBeTruthy());
    expect(screen.getByText('Local backend stopped')).toBeTruthy();
  });

  it('reports a swallowed shell failure instead of a success toast', async () => {
    mocks.getLocalBackendStatus.mockResolvedValue(status({ provisioned: true, running: false }));
    mocks.startLocalBackend.mockResolvedValue(null); // wrapper swallowed the error
    renderCard();
    await waitFor(() => expect(screen.getByText('Provisioned · stopped')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /Start/ }));
    await waitFor(() =>
      expect(screen.getByText('The shell could not start the local backend')).toBeTruthy(),
    );
    expect(screen.getByText('Could not start the local backend')).toBeTruthy();
  });

  it('shows the error message when the shell call rejects', async () => {
    mocks.getLocalBackendStatus.mockResolvedValue(status({ provisioned: true, running: false }));
    mocks.startLocalBackend.mockRejectedValue(new Error('bridge gone'));
    renderCard();
    await waitFor(() => expect(screen.getByText('Provisioned · stopped')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /Start/ }));
    await waitFor(() => expect(screen.getByText('bridge gone')).toBeTruthy());
  });
});
