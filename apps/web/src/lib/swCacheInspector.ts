/**
 * Deep Service Worker cache inspector.
 *
 * Queries the browser's Cache Storage API directly (no service-worker
 * interception needed) to report precache sizes, route coverage,
 * cache names, and stale entries. This data feeds the PerformanceMonitor.
 */

export interface CacheInfo {
  name: string;
  entries: CacheEntryInfo[];
  totalSize: number;
}

export interface CacheEntryInfo {
  url: string;
  size: number;
  lastModified: string | null;
  etag: string | null;
  age: number; // ms since last modification
}

/**
 * Enumerate all caches managed by the service worker.
 * Returns cache names and their entry counts/sizes.
 */
export async function enumerateCaches(): Promise<CacheInfo[]> {
  if (!('caches' in window)) return [];

  const names = await caches.keys();
  const results: CacheInfo[] = [];

  for (const name of names) {
    const cache = await caches.open(name);
    const requests = await cache.keys();
    const entries: CacheEntryInfo[] = [];
    let totalSize = 0;

    for (const request of requests) {
      const response = await cache.match(request);
      if (!response) continue;

      let size = 0;
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        size = parseInt(contentLength, 10) || 0;
      } else {
        // Estimate from body
        try {
          const blob = await response.blob();
          size = blob.size;
        } catch {
          size = 0;
        }
      }

      const lastModified = response.headers.get('last-modified');
      const etag = response.headers.get('etag');
      const age = lastModified
        ? Date.now() - Date.parse(lastModified)
        : 0;

      entries.push({
        url: request.url,
        size,
        lastModified,
        etag,
        age,
      });
      totalSize += size;
    }

    results.push({ name, entries, totalSize });
  }

  return results;
}

/**
 * Get a summary of what's cached, by route category.
 */
export interface CacheRouteSummary {
  route: string;
  count: number;
  totalSize: number;
  avgAge: number;
}

export async function getCacheRouteSummary(): Promise<CacheRouteSummary[]> {
  const caches = await enumerateCaches();
  const routeMap = new Map<string, { count: number; totalSize: number; totalAge: number }>();

  for (const cache of caches) {
    for (const entry of cache.entries) {
      // Extract route from URL
      let route = entry.url;
      try {
        const url = new URL(entry.url);
        route = url.pathname;
      } catch {
        // keep as-is
      }
      // Normalize: strip /api/v1 prefix for cleaner grouping
      route = route.replace(/^\/api\/v1/, '') || '/';

      const existing = routeMap.get(route) ?? { count: 0, totalSize: 0, totalAge: 0 };
      existing.count++;
      existing.totalSize += entry.size;
      existing.totalAge += entry.age;
      routeMap.set(route, existing);
    }
  }

  return Array.from(routeMap.entries())
    .map(([route, v]) => ({
      route,
      count: v.count,
      totalSize: v.totalSize,
      avgAge: Math.round(v.totalAge / v.count),
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get total cache storage usage (approximate, via navigator.storage API).
 */
export async function getStorageUsage(): Promise<{ used: number; quota: number } | null> {
  if (!navigator.storage || !navigator.storage.estimate) return null;
  try {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage ?? 0,
      quota: estimate.quota ?? 0,
    };
  } catch {
    return null;
  }
}

/**
 * Clear a specific cache by name.
 */
export async function clearCacheByName(name: string): Promise<boolean> {
  if (!('caches' in window)) return false;
  try {
    return await caches.delete(name);
  } catch {
    return false;
  }
}

/**
 * Clear all caches.
 */
export async function clearAllCaches(): Promise<void> {
  if (!('caches' in window)) return;
  const names = await caches.keys();
  await Promise.all(names.map((n) => caches.delete(n)));
}

/**
 * Check if a specific URL is currently cached.
 */
export async function isUrlCached(url: string): Promise<boolean> {
  if (!('caches' in window)) return false;
  const response = await caches.match(url);
  return !!response;
}
