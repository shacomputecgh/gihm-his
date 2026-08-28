// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportPrometheusMetrics, exportMetricsJson } from './metricsExporter';
import { recordPerf, clearPerfEntries } from './perfTracker';
import { recordCacheAccess, clearCacheEntries } from './cacheTracker';

vi.mock('../lib/auth', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}));

describe('metricsExporter', () => {
  beforeEach(() => {
    clearPerfEntries();
    clearCacheEntries();
  });

  describe('exportPrometheusMetrics', () => {
    it('returns empty metrics when no data', () => {
      const text = exportPrometheusMetrics();
      expect(text).toContain('gihm_api_requests_total 0');
      expect(text).toContain('gihm_api_errors_total 0');
      expect(text).toContain('gihm_cache_accesses_total 0');
    });

    it('exports API metrics correctly', () => {
      recordPerf({ path: '/patients', method: 'GET', status: 200, durationMs: 150, cached: false, error: false });
      recordPerf({ path: '/patients', method: 'GET', status: 200, durationMs: 200, cached: false, error: false });
      recordPerf({ path: '/appointments', method: 'POST', status: 400, durationMs: 50, cached: false, error: true });

      const text = exportPrometheusMetrics();
      expect(text).toContain('gihm_api_requests_total 3');
      expect(text).toContain('gihm_api_errors_total 1');
      expect(text).toContain('gihm_api_endpoint_requests_total{path="/patients"} 2');
      expect(text).toContain('gihm_api_status_code_total{status="200"} 2');
      expect(text).toContain('gihm_api_status_code_total{status="400"} 1');
    });

    it('exports cache metrics correctly', () => {
      recordCacheAccess({ route: '/patients', hit: true, cacheName: 'workbox', size: 500 });
      recordCacheAccess({ route: '/patients', hit: false, cacheName: 'network', size: 0 });

      const text = exportPrometheusMetrics();
      expect(text).toContain('gihm_cache_accesses_total 2');
      expect(text).toContain('gihm_cache_hits_total 1');
      expect(text).toContain('gihm_cache_misses_total 1');
      expect(text).toContain('gihm_cache_hit_rate 50');
    });

    it('includes HELP and TYPE metadata', () => {
      const text = exportPrometheusMetrics();
      expect(text).toContain('# HELP gihm_api_requests_total');
      expect(text).toContain('# TYPE gihm_api_requests_total counter');
      expect(text).toContain('# HELP gihm_api_response_duration_ms');
      expect(text).toContain('# TYPE gihm_api_response_duration_ms gauge');
    });
  });

  describe('exportMetricsJson', () => {
    it('returns valid JSON structure', () => {
      recordPerf({ path: '/a', method: 'GET', status: 200, durationMs: 100, cached: false, error: false });
      const json = exportMetricsJson();
      expect(json.timestamp).toBeTruthy();
      expect(json.api).toBeDefined();
      expect(json.cache).toBeDefined();
      expect(json.client).toBeDefined();
      expect((json.api as Record<string, unknown>).totalRequests).toBe(1);
    });

    it('includes user agent', () => {
      const json = exportMetricsJson();
      expect((json.client as Record<string, unknown>).userAgent).toBeTruthy();
    });
  });
});
