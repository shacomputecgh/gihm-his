// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import CacheStrategy from './CacheStrategy';
import { Toaster } from '../../components/ui';

const mocks = vi.hoisted(() => ({
  enumerateCaches: vi.fn(),
  getStorageUsage: vi.fn(),
  isSWActive: vi.fn(),
  getSWInfo: vi.fn(),
  forceSWUpdate: vi.fn(),
  clearAllCaches: vi.fn(),
  clearCacheByName: vi.fn(),
}));

vi.mock('../../lib/swCacheInspector', () => ({
  enumerateCaches: mocks.enumerateCaches,
  getStorageUsage: mocks.getStorageUsage,
  clearAllCaches: mocks.clearAllCaches,
  clearCacheByName: mocks.clearCacheByName,
}));

vi.mock('../../lib/swEventInterceptor', () => ({
  isSWActive: mocks.isSWActive,
  getSWInfo: mocks.getSWInfo,
  forceSWUpdate: mocks.forceSWUpdate,
}));

vi.mock('../../lib/auth', () => ({
  useAuth: () => ({ user: { id: 'u1', permissions: ['view_reports'] } }),
}));

const renderPage = () => render(<Toaster><CacheStrategy /></Toaster>);

describe('CacheStrategy', () => {
  beforeEach(() => {
    mocks.enumerateCaches.mockResolvedValue([]);
    mocks.getStorageUsage.mockResolvedValue(null);
    mocks.isSWActive.mockResolvedValue(false);
    mocks.getSWInfo.mockResolvedValue(null);
    mocks.forceSWUpdate.mockResolvedValue(true);
    mocks.clearAllCaches.mockResolvedValue(undefined);
    mocks.clearCacheByName.mockResolvedValue(true);
  });

  afterEach(() => cleanup());

  it('renders the page header', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Cache Strategy')).toBeTruthy();
    });
    expect(screen.getByText(/Service Worker caching policies/)).toBeTruthy();
  });

  it('shows SW status cards', async () => {
    mocks.isSWActive.mockResolvedValue(true);
    mocks.getSWInfo.mockResolvedValue({ active: true, scope: 'http://localhost:5173/', updateViaCache: 'imports' });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Active')).toBeTruthy();
    });
    expect(screen.getByText('SW Status')).toBeTruthy();
    expect(screen.getByText('SW Scope')).toBeTruthy();
  });

  it('shows inactive SW status', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Inactive')).toBeTruthy();
    });
  });

  it('displays caching policies', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Caching policies')).toBeTruthy();
    });
    expect(screen.getByText('/api/v1/patients/*')).toBeTruthy();
    expect(screen.getAllByText('NetworkOnly').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('NetworkFirst').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('CacheFirst').length).toBeGreaterThanOrEqual(1);
  });

  it('shows cache storage details', async () => {
    mocks.enumerateCaches.mockResolvedValue([
      {
        name: 'workbox-precache',
        totalSize: 50000,
        entries: [
          { url: '/index.html', size: 20000, lastModified: new Date().toISOString(), etag: null, age: 0 },
          { url: '/app.js', size: 30000, lastModified: new Date().toISOString(), etag: null, age: 0 },
        ],
      },
    ]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('workbox-precache')).toBeTruthy();
    });
    expect(screen.getByText(/2 entries/)).toBeTruthy();
    expect(screen.getByText('/index.html')).toBeTruthy();
    expect(screen.getByText('/app.js')).toBeTruthy();
  });

  it('shows storage usage', async () => {
    mocks.getStorageUsage.mockResolvedValue({ used: 5 * 1024 * 1024, quota: 100 * 1024 * 1024 });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Storage usage')).toBeTruthy();
    });
    expect(screen.getByText(/5 MB/)).toBeTruthy();
    expect(screen.getByText(/100 MB/)).toBeTruthy();
  });

  it('shows total cached size', async () => {
    mocks.enumerateCaches.mockResolvedValue([
      { name: 'cache-a', totalSize: 10000, entries: [] },
      { name: 'cache-b', totalSize: 5000, entries: [] },
    ]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Total cached')).toBeTruthy();
    });
    expect(screen.getByText(/2 cache/)).toBeTruthy();
  });

  it('clear button calls clearAllCaches', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Caching policies')).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('button', { name: /Clear all caches/ }));
    expect(mocks.clearAllCaches).toHaveBeenCalled();
  });

  it('update SW button calls forceSWUpdate', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Caching policies')).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('button', { name: /Update SW/ }));
    expect(mocks.forceSWUpdate).toHaveBeenCalled();
  });
});
