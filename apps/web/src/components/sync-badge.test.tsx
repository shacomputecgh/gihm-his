// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SyncBadge } from './SyncBadge';
import type { ConnectionState } from '../lib/connection';

const mocks = vi.hoisted(() => ({
  useConnection: vi.fn(),
}));

vi.mock('../lib/connection', () => ({ useConnection: mocks.useConnection }));

const state = (over: Partial<ConnectionState> = {}): ConnectionState => ({
  online: true,
  serverHealthy: true,
  pending: 0,
  syncing: false,
  lastSyncAt: '2026-08-18T10:00:00.000Z',
  lastSyncResult: null,
  refresh: vi.fn(async () => {}),
  sync: vi.fn(async () => {}),
  ...over,
});

const renderBadge = () => render(<SyncBadge />);

beforeEach(() => {
  mocks.useConnection.mockReset().mockReturnValue(state());
});

afterEach(() => cleanup());

describe('SyncBadge', () => {
  it('shows Connected when the server is reachable', () => {
    renderBadge();
    expect(screen.getByText('Connected')).toBeTruthy();
    expect(screen.queryByText(/pending/)).toBeNull();
  });

  it('shows Offline when the network or server is down', () => {
    mocks.useConnection.mockReturnValue(state({ online: false }));
    renderBadge();
    expect(screen.getByText('Offline')).toBeTruthy();
  });

  it('treats an unreachable server as offline', () => {
    mocks.useConnection.mockReturnValue(state({ serverHealthy: false }));
    renderBadge();
    expect(screen.getByText('Offline')).toBeTruthy();
  });

  it('shows Syncing while a sync is in flight', () => {
    mocks.useConnection.mockReturnValue(state({ syncing: true }));
    renderBadge();
    expect(screen.getByText('Syncing…')).toBeTruthy();
  });

  it('shows the pending transaction count as a badge', () => {
    mocks.useConnection.mockReturnValue(state({ pending: 3 }));
    renderBadge();
    expect(screen.getByText('3 pending')).toBeTruthy();
  });

  it('opens the details panel with the last result and triggers a sync', () => {
    const sync = vi.fn(async () => {});
    mocks.useConnection.mockReturnValue(
      state({ lastSyncResult: { processed: 4, failed: 1, conflicts: 0 }, sync }),
    );
    renderBadge();
    fireEvent.click(screen.getByTitle('Synchronization status'));
    expect(screen.getByText('Sync status')).toBeTruthy();
    expect(screen.getByText('4 synced · 1 failed')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Sync now' }));
    expect(sync).toHaveBeenCalled();
  });

  it('disables the sync button while offline', () => {
    mocks.useConnection.mockReturnValue(state({ online: false }));
    renderBadge();
    fireEvent.click(screen.getByTitle('Synchronization status'));
    expect(screen.getByRole('button', { name: 'Sync now' })).toHaveProperty('disabled', true);
  });
});
