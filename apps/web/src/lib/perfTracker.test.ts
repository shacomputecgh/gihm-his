// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordPerf,
  getPerfEntries,
  clearPerfEntries,
  getPerfSummary,
  initPerfTracking,
} from './perfTracker';

describe('perfTracker', () => {
  beforeEach(() => {
    clearPerfEntries();
  });

  it('records entries and retrieves them', () => {
    recordPerf({ path: '/patients', method: 'GET', status: 200, durationMs: 150, cached: false, error: false });
    const entries = getPerfEntries();
    expect(entries.length).toBe(1);
    expect(entries[0]!.path).toBe('/patients');
    expect(entries[0]!.method).toBe('GET');
    expect(entries[0]!.status).toBe(200);
    expect(entries[0]!.durationMs).toBe(150);
    expect(entries[0]!.cached).toBe(false);
    expect(entries[0]!.error).toBe(false);
    expect(entries[0]!.id).toBe(1);
    expect(entries[0]!.timestamp).toBeGreaterThan(0);
  });

  it('returns newest entries first', () => {
    recordPerf({ path: '/a', method: 'GET', status: 200, durationMs: 10, cached: false, error: false });
    recordPerf({ path: '/b', method: 'POST', status: 201, durationMs: 20, cached: false, error: false });
    const entries = getPerfEntries();
    expect(entries[0]!.path).toBe('/b');
    expect(entries[1]!.path).toBe('/a');
  });

  it('clears all entries', () => {
    recordPerf({ path: '/a', method: 'GET', status: 200, durationMs: 10, cached: false, error: false });
    clearPerfEntries();
    expect(getPerfEntries().length).toBe(0);
  });

  it('limits entries to 200', () => {
    for (let i = 0; i < 250; i++) {
      recordPerf({ path: `/${i}`, method: 'GET', status: 200, durationMs: 10, cached: false, error: false });
    }
    expect(getPerfEntries().length).toBe(200);
    // Most recent entries are kept
    expect(getPerfEntries()[0]!.path).toBe('/249');
  });
});

describe('getPerfSummary', () => {
  it('returns empty summary for no data', () => {
    clearPerfEntries();
    const s = getPerfSummary();
    expect(s.totalRequests).toBe(0);
    expect(s.avgResponseMs).toBe(0);
    expect(s.errorRate).toBe(0);
    expect(s.cacheHitRate).toBe(0);
    expect(s.byPath.length).toBe(0);
    expect(s.recentErrors.length).toBe(0);
    expect(s.timeline.length).toBe(0);
  });

  it('computes correct stats', () => {
    clearPerfEntries();
    recordPerf({ path: '/patients', method: 'GET', status: 200, durationMs: 100, cached: true, error: false });
    recordPerf({ path: '/patients', method: 'GET', status: 200, durationMs: 200, cached: false, error: false });
    recordPerf({ path: '/appointments', method: 'POST', status: 400, durationMs: 50, cached: false, error: true });
    recordPerf({ path: '/appointments', method: 'GET', status: 200, durationMs: 300, cached: false, error: false });

    const s = getPerfSummary();
    expect(s.totalRequests).toBe(4);
    expect(s.avgResponseMs).toBe(163); // (100+200+50+300)/4 = 162.5
    expect(s.totalErrors).toBe(1);
    expect(s.errorRate).toBe(25);
    expect(s.totalCached).toBe(1);
    expect(s.cacheHitRate).toBe(25);
    expect(s.byStatus[200]).toBe(3);
    expect(s.byStatus[400]).toBe(1);
    expect(s.byPath.length).toBe(2);
    expect(s.recentErrors.length).toBe(1);
    expect(s.recentErrors[0]!.path).toBe('/appointments');
  });

  it('sorts byPath by count descending', () => {
    clearPerfEntries();
    for (let i = 0; i < 10; i++) {
      recordPerf({ path: '/a', method: 'GET', status: 200, durationMs: 10, cached: false, error: false });
    }
    recordPerf({ path: '/b', method: 'GET', status: 200, durationMs: 10, cached: false, error: false });
    const s = getPerfSummary();
    expect(s.byPath[0]!.path).toBe('/a');
    expect(s.byPath[0]!.count).toBe(10);
    expect(s.byPath[1]!.path).toBe('/b');
    expect(s.byPath[1]!.count).toBe(1);
  });

  it('strips query params from path grouping', () => {
    clearPerfEntries();
    recordPerf({ path: '/patients?q=foo', method: 'GET', status: 200, durationMs: 10, cached: false, error: false });
    recordPerf({ path: '/patients?q=bar', method: 'GET', status: 200, durationMs: 20, cached: false, error: false });
    const s = getPerfSummary();
    expect(s.byPath.length).toBe(1);
    expect(s.byPath[0]!.path).toBe('/patients');
    expect(s.byPath[0]!.count).toBe(2);
  });

  it('computes timeline', () => {
    clearPerfEntries();
    recordPerf({ path: '/a', method: 'GET', status: 200, durationMs: 100, cached: false, error: false });
    recordPerf({ path: '/b', method: 'GET', status: 200, durationMs: 200, cached: false, error: false });
    const s = getPerfSummary();
    expect(s.timeline.length).toBeGreaterThanOrEqual(1);
    expect(s.timeline[0]!.count).toBe(2);
    expect(s.timeline[0]!.avgMs).toBe(150);
  });

  it('computes P95 correctly', () => {
    clearPerfEntries();
    for (let i = 0; i < 100; i++) {
      recordPerf({ path: '/a', method: 'GET', status: 200, durationMs: i + 1, cached: false, error: false });
    }
    const s = getPerfSummary();
    expect(s.p95ResponseMs).toBeGreaterThanOrEqual(95);
    expect(s.p95ResponseMs).toBeLessThanOrEqual(100);
  });
});

describe('initPerfTracking', () => {
  it('instruments fetch only once', () => {
    const originalFetch = window.fetch;
    initPerfTracking();
    const afterFirst = window.fetch;
    initPerfTracking();
    expect(window.fetch).toBe(afterFirst);
    window.fetch = originalFetch;
  });
});
