/**
 * Client-side cache analytics tracker.
 *
 * Monitors the Workbox service-worker cache and browser Cache API to
 * report cache hit rates per route, cache sizes, and stale entries.
 * Data is consumed by the PerformanceMonitor page.
 */

export interface CacheEntry {
  route: string;
  timestamp: number;
  hit: boolean;
  cacheName: string;
  size: number;
}

const MAX_CACHE_ENTRIES = 300;

let cacheEntries: CacheEntry[] = [];

/** Record a cache access event. */
export function recordCacheAccess(entry: Omit<CacheEntry, 'timestamp'>): void {
  cacheEntries = [
    { ...entry, timestamp: Date.now() },
    ...cacheEntries,
  ].slice(0, MAX_CACHE_ENTRIES);
}

/** Get all recorded cache entries (newest first). */
export function getCacheEntries(): CacheEntry[] {
  return cacheEntries;
}

/** Clear all cache entries. */
export function clearCacheEntries(): void {
  cacheEntries = [];
}

export interface CacheSummary {
  totalAccesses: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  totalSize: number;
  byRoute: Array<{ route: string; hits: number; misses: number; hitRate: number; totalSize: number }>;
  byCacheName: Array<{ name: string; entries: number; totalSize: number }>;
  recentMisses: CacheEntry[];
}

/** Compute cache analytics summary. */
export function getCacheSummary(): CacheSummary {
  const all = cacheEntries;
  if (all.length === 0) {
    return {
      totalAccesses: 0,
      hitRate: 0,
      totalHits: 0,
      totalMisses: 0,
      totalSize: 0,
      byRoute: [],
      byCacheName: [],
      recentMisses: [],
    };
  }

  const hits = all.filter((e) => e.hit);
  const misses = all.filter((e) => !e.hit);
  const totalSize = all.reduce((a, b) => a + b.size, 0);

  // Group by route (strip query params)
  const routeMap = new Map<string, { hits: number; misses: number; totalSize: number }>();
  for (const e of all) {
    const route = e.route.split('?')[0]!;
    const entry = routeMap.get(route) ?? { hits: 0, misses: 0, totalSize: 0 };
    if (e.hit) entry.hits++;
    else entry.misses++;
    entry.totalSize += e.size;
    routeMap.set(route, entry);
  }
  const byRoute = Array.from(routeMap.entries())
    .map(([route, v]) => ({
      route,
      hits: v.hits,
      misses: v.misses,
      hitRate: v.hits + v.misses > 0 ? Math.round((v.hits / (v.hits + v.misses)) * 100) : 0,
      totalSize: v.totalSize,
    }))
    .sort((a, b) => (b.hits + b.misses) - (a.hits + a.misses))
    .slice(0, 20);

  // Group by cache name
  const cacheMap = new Map<string, { entries: number; totalSize: number }>();
  for (const e of all) {
    const entry = cacheMap.get(e.cacheName) ?? { entries: 0, totalSize: 0 };
    entry.entries++;
    entry.totalSize += e.size;
    cacheMap.set(e.cacheName, entry);
  }
  const byCacheName = Array.from(cacheMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.entries - a.entries);

  const recentMisses = misses.slice(0, 10);

  return {
    totalAccesses: all.length,
    hitRate: Math.round((hits.length / all.length) * 10000) / 100,
    totalHits: hits.length,
    totalMisses: misses.length,
    totalSize,
    byRoute,
    byCacheName,
    recentMisses,
  };
}

/**
 * Instrument fetch to automatically track cache hits/misses.
 * Intercepts responses and checks Cache-Control headers and response status.
 */
let cacheTrackingInitialized = false;

export function initCacheTracking(): void {
  if (cacheTrackingInitialized) return;
  cacheTrackingInitialized = true;

  const originalFetch = window.fetch;
  window.fetch = async function cacheTrackedFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const path = url.replace(/^https?:\/\/[^/]+/, '').replace(/^\/api\/v1/, '');

    // Only track API and static asset requests
    if (!path.startsWith('/') || path.includes('node_modules')) {
      return originalFetch.call(window, input, init);
    }

    const res = await originalFetch.call(window, input, init);

    // Detect cache hit from headers
    const isCacheHit =
      res.headers.get('x-cache') === 'HIT' ||
      res.headers.get('cf-cache-status') === 'HIT' ||
      res.headers.get('sw-cache') === 'HIT' ||
      res.type === 'opaque' ||
      (res.status === 304);

    // Estimate response size from content-length
    const size = Number(res.headers.get('content-length')) || 0;

    // Determine cache name from headers
    const cacheName =
      res.headers.get('x-cache-name') ||
      (isCacheHit ? 'workbox-precache' : 'network');

    recordCacheAccess({
      route: path,
      hit: isCacheHit,
      cacheName,
      size,
    });

    return res;
  };
}
