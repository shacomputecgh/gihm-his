// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, cleanup } from '@testing-library/react';
import { ConnectionProvider, useConnection } from './connection';

const mocks = vi.hoisted(() => ({
  pendingCount: vi.fn(async () => 0),
  syncNow: vi.fn(async () => ({ processed: 0, failed: 0, conflicts: 0 })),
  apiUrl: vi.fn(async () => '/health'),
}));

vi.mock('./offline', () => ({ pendingCount: mocks.pendingCount, syncNow: mocks.syncNow }));
vi.mock('./api', () => ({ apiUrl: mocks.apiUrl }));

function Probe() {
  const c = useConnection();
  return (
    <div>
      <span data-testid="online">{String(c.online)}</span>
      <span data-testid="healthy">{String(c.serverHealthy)}</span>
      <span data-testid="pending">{c.pending}</span>
      <span data-testid="syncing">{String(c.syncing)}</span>
      <span data-testid="result">{c.lastSyncResult ? c.lastSyncResult.processed : 'none'}</span>
      <button onClick={() => void c.sync()}>sync</button>
    </div>
  );
}

const renderProbe = () =>
  render(
    <ConnectionProvider>
      <Probe />
    </ConnectionProvider>,
  );

beforeEach(() => {
  mocks.pendingCount.mockClear().mockResolvedValue(0);
  mocks.syncNow.mockClear().mockResolvedValue({ processed: 0, failed: 0, conflicts: 0 });
  mocks.apiUrl.mockClear().mockResolvedValue('/health');
  globalThis.fetch = vi.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;
});

afterEach(() => cleanup());

describe('ConnectionProvider', () => {
  it('probes /health on mount and reports reachability + pending count', async () => {
    mocks.pendingCount.mockResolvedValue(3);
    renderProbe();
    // Initial state before the probe resolves.
    expect(screen.getByTestId('online').textContent).toBe('true'); // navigator.onLine in jsdom
    expect(screen.getByTestId('healthy').textContent).toBe('null');
    await waitFor(() => expect(screen.getByTestId('healthy').textContent).toBe('true'));
    expect(screen.getByTestId('online').textContent).toBe('true');
    await waitFor(() => expect(screen.getByTestId('pending').textContent).toBe('3'));
  });

  it('marks the server unhealthy when the probe fails or fetch throws', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network down')) as unknown as typeof fetch;
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('healthy').textContent).toBe('false'));
    expect(screen.getByTestId('online').textContent).toBe('false');
  });

  it('runs a sync on demand and publishes the result', async () => {
    mocks.syncNow.mockResolvedValue({ processed: 4, failed: 1, conflicts: 2 });
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('healthy').textContent).toBe('true'));
    act(() => screen.getByRole('button', { name: 'sync' }).click());
    await waitFor(() => expect(screen.getByTestId('result').textContent).toBe('4'));
    expect(mocks.syncNow).toHaveBeenCalled();
  });

  it('flips offline on the window offline event and re-syncs on online', async () => {
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('healthy').textContent).toBe('true'));
    act(() => window.dispatchEvent(new Event('offline')));
    expect(screen.getByTestId('online').textContent).toBe('false');
    act(() => window.dispatchEvent(new Event('online')));
    // The online handler triggers a sync and a fresh probe.
    await waitFor(() => expect(mocks.syncNow).toHaveBeenCalled());
  });

  it('syncs when the document becomes visible', async () => {
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('healthy').textContent).toBe('true'));
    // Simulate the document becoming visible.
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    await waitFor(() => expect(mocks.syncNow).toHaveBeenCalled());
  });

  it('does not sync when the document becomes hidden', async () => {
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('healthy').textContent).toBe('true'));
    mocks.syncNow.mockClear();
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    // Give time for any async handler to fire.
    await new Promise((r) => setTimeout(r, 50));
    expect(mocks.syncNow).not.toHaveBeenCalled();
  });

  it('refreshes pending count on outbox-changed event', async () => {
    mocks.pendingCount.mockResolvedValue(5);
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('healthy').textContent).toBe('true'));
    act(() => window.dispatchEvent(new Event('gihm:outbox-changed')));
    await waitFor(() => expect(screen.getByTestId('pending').textContent).toBe('5'));
  });

  it('syncs when the shell asks for it (gihm:sync-now)', async () => {
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('healthy').textContent).toBe('true'));
    act(() => window.dispatchEvent(new Event('gihm:sync-now')));
    await waitFor(() => expect(mocks.syncNow).toHaveBeenCalled());
  });
});
