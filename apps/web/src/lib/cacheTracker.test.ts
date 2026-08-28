// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordCacheAccess,
  getCacheEntries,
  clearCacheEntries,
  getCacheSummary,
  initCacheTracking,
} from './cacheTracker';

describe('cacheTracker', () => {
  beforeEach(() => {
    clearCacheEntries();
  });

  it('records cache access events', () => {
    recordCacheAccess({ route: '/patients', hit: true, cacheName: 'workbox-precache', size: 1024 });
    const entries = getCacheEntries();
    expect(entries.length).toBe(1);
    expect(entries[0]!.route).toBe('/patients');
    expect(entries[0]!.hit).toBe(true);
    expect(entries[0]!.cacheName).toBe('workbox-precache');
    expect(entries[0]!.size).toBe(1024);
    expect(entries[0]!.timestamp).toBeGreaterThan(0);
  });

  it('returns newest entries first', () => {
    recordCacheAccess({ route: '/a', hit: true, cacheName: 'cache', size: 100 });
    recordCacheAccess({ route: '/b', hit: false, cacheName: 'network', size: 200 });
    const entries = getCacheEntries();
    expect(entries[0]!.route).toBe('/b');
    expect(entries[1]!.route).toBe('/a');
  });

  it('clears all entries', () => {
    recordCacheAccess({ route: '/a', hit: true, cacheName: 'cache', size: 100 });
    clearCacheEntries();
    expect(getCacheEntries().length).toBe(0);
  });

  it('limits entries to 300', () => {
    for (let i = 0; i < 350; i++) {
      recordCacheAccess({ route: `/${i}`, hit: true, cacheName: 'cache', size: 10 });
    }
    expect(getCacheEntries().length).toBe(300);
    expect(getCacheEntries()[0]!.route).toBe('/349');
  });
});

describe('getCacheSummary', () => {
  it('returns empty summary for no data', () => {
    clearCacheEntries();
    const s = getCacheSummary();
    expect(s.totalAccesses).toBe(0);
    expect(s.hitRate).toBe(0);
    expect(s.totalHits).toBe(0);
    expect(s.totalMisses).toBe(0);
    expect(s.byRoute.length).toBe(0);
    expect(s.byCacheName.length).toBe(0);
    expect(s.recentMisses.length).toBe(0);
  });

  it('computes correct stats', () => {
    clearCacheEntries();
    recordCacheAccess({ route: '/patients', hit: true, cacheName: 'workbox', size: 500 });
    recordCacheAccess({ route: '/patients', hit: false, cacheName: 'network', size: 0 });
    recordCacheAccess({ route: '/appointments', hit: true, cacheName: 'workbox', size: 300 });
    recordCacheAccess({ route: '/appointments', hit: true, cacheName: 'workbox', size: 300 });

    const s = getCacheSummary();
    expect(s.totalAccesses).toBe(4);
    expect(s.totalHits).toBe(3);
    expect(s.totalMisses).toBe(1);
    expect(s.hitRate).toBe(75);
    expect(s.totalSize).toBe(1100);
    expect(s.byRoute.length).toBe(2);
    expect(s.recentMisses.length).toBe(1);
    expect(s.recentMisses[0]!.route).toBe('/patients');
  });

  it('sorts byRoute by total access count descending', () => {
    clearCacheEntries();
    for (let i = 0; i < 5; i++) {
      recordCacheAccess({ route: '/a', hit: true, cacheName: 'cache', size: 10 });
    }
    recordCacheAccess({ route: '/b', hit: false, cacheName: 'network', size: 0 });

    const s = getCacheSummary();
    expect(s.byRoute[0]!.route).toBe('/a');
    expect(s.byRoute[0]!.hits).toBe(5);
    expect(s.byRoute[1]!.route).toBe('/b');
  });

  it('strips query params from route grouping', () => {
    clearCacheEntries();
    recordCacheAccess({ route: '/patients?q=foo', hit: true, cacheName: 'cache', size: 100 });
    recordCacheAccess({ route: '/patients?q=bar', hit: false, cacheName: 'network', size: 0 });

    const s = getCacheSummary();
    expect(s.byRoute.length).toBe(1);
    expect(s.byRoute[0]!.route).toBe('/patients');
    expect(s.byRoute[0]!.hits).toBe(1);
    expect(s.byRoute[0]!.misses).toBe(1);
  });

  it('groups by cache name', () => {
    clearCacheEntries();
    recordCacheAccess({ route: '/a', hit: true, cacheName: 'workbox-precache', size: 100 });
    recordCacheAccess({ route: '/b', hit: true, cacheName: 'workbox-precache', size: 200 });
    recordCacheAccess({ route: '/c', hit: false, cacheName: 'network', size: 0 });

    const s = getCacheSummary();
    expect(s.byCacheName.length).toBe(2);
    expect(s.byCacheName[0]!.name).toBe('workbox-precache');
    expect(s.byCacheName[0]!.entries).toBe(2);
    expect(s.byCacheName[0]!.totalSize).toBe(300);
    expect(s.byCacheName[1]!.name).toBe('network');
  });

  it('limits byRoute to 20 entries', () => {
    clearCacheEntries();
    for (let i = 0; i < 25; i++) {
      recordCacheAccess({ route: `/route-${i}`, hit: true, cacheName: 'cache', size: 10 });
    }
    const s = getCacheSummary();
    expect(s.byRoute.length).toBe(20);
  });
});

describe('initCacheTracking', () => {
  it('instruments fetch only once', () => {
    const originalFetch = window.fetch;
    initCacheTracking();
    const afterFirst = window.fetch;
    initCacheTracking();
    expect(window.fetch).toBe(afterFirst);
    window.fetch = originalFetch;
  });
});
