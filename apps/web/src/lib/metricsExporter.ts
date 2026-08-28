/**
 * Prometheus-compatible metrics exporter.
 *
 * Formats client-side performance and cache data into Prometheus text
 * exposition format, which can be scraped by Prometheus, Grafana Agent,
 * or any OpenMetrics-compatible collector.
 *
 * Usage:
 *   import { exportPrometheusMetrics } from './metricsExporter';
 *   const text = exportPrometheusMetrics(); // returns Prometheus text format
 *
 * Endpoint pattern: GET /app/performance?format=prometheus
 */

import { getPerfSummary } from './perfTracker';
import { getCacheSummary } from './cacheTracker';

function formatLabel(name: string, value: string): string {
  return `${name}="${value.replace(/"/g, '\\"')}"`;
}

/**
 * Export all metrics in Prometheus text exposition format.
 */
export function exportPrometheusMetrics(): string {
  const perf = getPerfSummary();
  const cache = getCacheSummary();
  const lines: string[] = [];

  // ---- API Performance Metrics ----

  lines.push('# HELP gihm_api_requests_total Total number of API requests');
  lines.push('# TYPE gihm_api_requests_total counter');
  lines.push(`gihm_api_requests_total ${perf.totalRequests}`);
  lines.push('');

  lines.push('# HELP gihm_api_errors_total Total number of API errors');
  lines.push('# TYPE gihm_api_errors_total counter');
  lines.push(`gihm_api_errors_total ${perf.totalErrors}`);
  lines.push('');

  lines.push('# HELP gihm_api_response_duration_ms Average API response duration in milliseconds');
  lines.push('# TYPE gihm_api_response_duration_ms gauge');
  lines.push(`gihm_api_response_duration_ms ${perf.avgResponseMs}`);
  lines.push('');

  lines.push('# HELP gihm_api_response_p95_ms 95th percentile API response duration');
  lines.push('# TYPE gihm_api_response_p95_ms gauge');
  lines.push(`gihm_api_response_p95_ms ${perf.p95ResponseMs}`);
  lines.push('');

  lines.push('# HELP gihm_api_error_rate Error rate as a percentage');
  lines.push('# TYPE gihm_api_error_rate gauge');
  lines.push(`gihm_api_error_rate ${perf.errorRate}`);
  lines.push('');

  // Per-endpoint metrics
  lines.push('# HELP gihm_api_endpoint_requests_total Requests per endpoint');
  lines.push('# TYPE gihm_api_endpoint_requests_total counter');
  for (const ep of perf.byPath) {
    lines.push(`gihm_api_endpoint_requests_total{${formatLabel('path', ep.path)}} ${ep.count}`);
  }
  lines.push('');

  lines.push('# HELP gihm_api_endpoint_duration_ms Average duration per endpoint');
  lines.push('# TYPE gihm_api_endpoint_duration_ms gauge');
  for (const ep of perf.byPath) {
    lines.push(`gihm_api_endpoint_duration_ms{${formatLabel('path', ep.path)}} ${ep.avgMs}`);
  }
  lines.push('');

  lines.push('# HELP gihm_api_endpoint_errors_total Errors per endpoint');
  lines.push('# TYPE gihm_api_endpoint_errors_total counter');
  for (const ep of perf.byPath) {
    if (ep.errorCount > 0) {
      lines.push(`gihm_api_endpoint_errors_total{${formatLabel('path', ep.path)}} ${ep.errorCount}`);
    }
  }
  lines.push('');

  // Status code metrics
  lines.push('# HELP gihm_api_status_code_total Requests by status code');
  lines.push('# TYPE gihm_api_status_code_total counter');
  for (const [status, count] of Object.entries(perf.byStatus)) {
    lines.push(`gihm_api_status_code_total{${formatLabel('status', status)}} ${count}`);
  }
  lines.push('');

  // ---- Cache Metrics ----

  lines.push('# HELP gihm_cache_accesses_total Total cache access events');
  lines.push('# TYPE gihm_cache_accesses_total counter');
  lines.push(`gihm_cache_accesses_total ${cache.totalAccesses}`);
  lines.push('');

  lines.push('# HELP gihm_cache_hits_total Total cache hits');
  lines.push('# TYPE gihm_cache_hits_total counter');
  lines.push(`gihm_cache_hits_total ${cache.totalHits}`);
  lines.push('');

  lines.push('# HELP gihm_cache_misses_total Total cache misses');
  lines.push('# TYPE gihm_cache_misses_total counter');
  lines.push(`gihm_cache_misses_total ${cache.totalMisses}`);
  lines.push('');

  lines.push('# HELP gihm_cache_hit_rate Cache hit rate percentage');
  lines.push('# TYPE gihm_cache_hit_rate gauge');
  lines.push(`gihm_cache_hit_rate ${cache.hitRate}`);
  lines.push('');

  // Per-route cache metrics
  lines.push('# HELP gihm_cache_route_hits_total Cache hits per route');
  lines.push('# TYPE gihm_cache_route_hits_total counter');
  for (const r of cache.byRoute) {
    lines.push(`gihm_cache_route_hits_total{${formatLabel('route', r.route)}} ${r.hits}`);
  }
  lines.push('');

  lines.push('# HELP gihm_cache_route_misses_total Cache misses per route');
  lines.push('# TYPE gihm_cache_route_misses_total counter');
  for (const r of cache.byRoute) {
    if (r.misses > 0) {
      lines.push(`gihm_cache_route_misses_total{${formatLabel('route', r.route)}} ${r.misses}`);
    }
  }
  lines.push('');

  // ---- Metadata ----

  lines.push('# HELP gihm_client_info Client information');
  lines.push('# TYPE gihm_client_info gauge');
  lines.push(`gihm_client_info{${formatLabel('user_agent', navigator.userAgent.slice(0, 100))}} 1`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Export metrics as JSON (for Grafana Agent or custom collectors).
 */
export function exportMetricsJson(): Record<string, unknown> {
  const perf = getPerfSummary();
  const cache = getCacheSummary();

  return {
    timestamp: new Date().toISOString(),
    api: {
      totalRequests: perf.totalRequests,
      avgResponseMs: perf.avgResponseMs,
      p95ResponseMs: perf.p95ResponseMs,
      errorRate: perf.errorRate,
      totalErrors: perf.totalErrors,
      byStatus: perf.byStatus,
      byPath: perf.byPath,
    },
    cache: {
      totalAccesses: cache.totalAccesses,
      hitRate: cache.hitRate,
      totalHits: cache.totalHits,
      totalMisses: cache.totalMisses,
      byRoute: cache.byRoute,
      byCacheName: cache.byCacheName,
    },
    client: {
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    },
  };
}
