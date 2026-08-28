/**
 * Client-side performance tracker.
 *
 * Records every API call's response time, status, and cache hit status.
 * Data lives in memory (resets on page reload) and is consumed by the
 * PerformanceMonitor page.
 */

export interface PerfEntry {
  id: number;
  path: string;
  method: string;
  status: number;
  durationMs: number;
  timestamp: number;
  cached: boolean;
  error: boolean;
}

const MAX_ENTRIES = 200;

let entries: PerfEntry[] = [];
let nextId = 1;

/** Record a completed API call. */
export function recordPerf(entry: Omit<PerfEntry, 'id' | 'timestamp'>): void {
  entries = [
    { ...entry, id: nextId++, timestamp: Date.now() },
    ...entries,
  ].slice(0, MAX_ENTRIES);
}

/** Get all recorded entries (newest first). */
export function getPerfEntries(): PerfEntry[] {
  return entries;
}

/** Clear all entries. */
export function clearPerfEntries(): void {
  entries = [];
  nextId = 1;
}

/** Summary stats for the monitoring dashboard. */
export interface PerfSummary {
  totalRequests: number;
  avgResponseMs: number;
  p95ResponseMs: number;
  errorRate: number;
  cacheHitRate: number;
  totalErrors: number;
  totalCached: number;
  byStatus: Record<number, number>;
  byPath: Array<{ path: string; count: number; avgMs: number; errorCount: number }>;
  recentErrors: PerfEntry[];
  timeline: Array<{ minute: string; count: number; avgMs: number }>;
}

/** Compute summary stats from recorded entries. */
export function getPerfSummary(): PerfSummary {
  const all = entries;
  if (all.length === 0) {
    return {
      totalRequests: 0,
      avgResponseMs: 0,
      p95ResponseMs: 0,
      errorRate: 0,
      cacheHitRate: 0,
      totalErrors: 0,
      totalCached: 0,
      byStatus: {},
      byPath: [],
      recentErrors: [],
      timeline: [],
    };
  }

  const durations = all.map((e) => e.durationMs).sort((a, b) => a - b);
  const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  const p95Index = Math.floor(durations.length * 0.95);
  const p95 = durations[p95Index] ?? durations[durations.length - 1]!;
  const errors = all.filter((e) => e.error);
  const cached = all.filter((e) => e.cached);

  // Group by status
  const byStatus: Record<number, number> = {};
  for (const e of all) {
    byStatus[e.status] = (byStatus[e.status] ?? 0) + 1;
  }

  // Group by path (strip query params)
  const pathMap = new Map<string, { count: number; totalMs: number; errorCount: number }>();
  for (const e of all) {
    const base = e.path.split('?')[0]!;
    const entry = pathMap.get(base) ?? { count: 0, totalMs: 0, errorCount: 0 };
    entry.count++;
    entry.totalMs += e.durationMs;
    if (e.error) entry.errorCount++;
    pathMap.set(base, entry);
  }
  const byPath = Array.from(pathMap.entries())
    .map(([path, v]) => ({
      path,
      count: v.count,
      avgMs: Math.round(v.totalMs / v.count),
      errorCount: v.errorCount,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // Recent errors (last 10)
  const recentErrors = all.filter((e) => e.error).slice(0, 10);

  // Timeline: group by minute
  const timelineMap = new Map<string, { count: number; totalMs: number }>();
  for (const e of all) {
    const d = new Date(e.timestamp);
    const key = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    const entry = timelineMap.get(key) ?? { count: 0, totalMs: 0 };
    entry.count++;
    entry.totalMs += e.durationMs;
    timelineMap.set(key, entry);
  }
  const timeline = Array.from(timelineMap.entries())
    .map(([minute, v]) => ({
      minute,
      count: v.count,
      avgMs: Math.round(v.totalMs / v.count),
    }))
    .slice(-30); // Last 30 minutes

  return {
    totalRequests: all.length,
    avgResponseMs: Math.round(avg),
    p95ResponseMs: Math.round(p95),
    errorRate: Math.round((errors.length / all.length) * 10000) / 100,
    cacheHitRate: Math.round((cached.length / all.length) * 10000) / 100,
    totalErrors: errors.length,
    totalCached: cached.length,
    byStatus,
    byPath,
    recentErrors,
    timeline,
  };
}

/**
 * Instrument the global `fetch` to automatically record performance data.
 * Call `initPerfTracking()` once at app startup.
 */
// ---- Web Vitals ----

export interface VitalEntry {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

let vitals: VitalEntry[] = [];
const MAX_VITALS = 50;

export function recordVital(entry: VitalEntry): void {
  vitals = [{ ...entry, timestamp: Date.now() }, ...vitals].slice(0, MAX_VITALS);
}

export function getVitals(): VitalEntry[] {
  return vitals;
}

export function clearVitals(): void {
  vitals = [];
}

let vitalsInitialized = false;

export function initVitalsTracking(): void {
  if (vitalsInitialized) return;
  vitalsInitialized = true;

  import('web-vitals').then(({ onCLS, onLCP, onFCP, onTTFB }) => {
    onCLS((m: { value: number; rating: 'good' | 'needs-improvement' | 'poor' }) => recordVital({ name: 'CLS', value: m.value, rating: m.rating, timestamp: Date.now() }));
    onLCP((m: { value: number; rating: 'good' | 'needs-improvement' | 'poor' }) => recordVital({ name: 'LCP', value: m.value, rating: m.rating, timestamp: Date.now() }));
    onFCP((m: { value: number; rating: 'good' | 'needs-improvement' | 'poor' }) => recordVital({ name: 'FCP', value: m.value, rating: m.rating, timestamp: Date.now() }));
    onTTFB((m: { value: number; rating: 'good' | 'needs-improvement' | 'poor' }) => recordVital({ name: 'TTFB', value: m.value, rating: m.rating, timestamp: Date.now() }));
  }).catch(() => {
    // web-vitals not available in test/jsdom environment
  });
}

// ---- Fetch instrumentation ----

let trackingInitialized = false;

export function initPerfTracking(): void {
  if (trackingInitialized) return;
  trackingInitialized = true;

  const originalFetch = window.fetch;
  window.fetch = async function instrumentedFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const method = init?.method ?? 'GET';
    const path = url.replace(/^https?:\/\/[^/]+/, '').replace(/^\/api\/v1/, '');

    // Skip non-API paths
    if (!path.startsWith('/') || path.includes('node_modules')) {
      return originalFetch.call(window, input, init);
    }

    const start = performance.now();
    try {
      const res = await originalFetch.call(window, input, init);
      const durationMs = Math.round(performance.now() - start);
      recordPerf({
        path,
        method,
        status: res.status,
        durationMs,
        cached: res.headers.get('x-cache') === 'HIT' || res.headers.get('cf-cache-status') === 'HIT',
        error: !res.ok,
      });
      return res;
    } catch (err) {
      const durationMs = Math.round(performance.now() - start);
      recordPerf({
        path,
        method,
        status: 0,
        durationMs,
        cached: false,
        error: true,
      });
      throw err;
    }
  };
}
