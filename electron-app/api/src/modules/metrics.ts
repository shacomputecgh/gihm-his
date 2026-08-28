import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';

/**
 * Server-side metrics collector.
 * Tracks API request counts, response times, and error rates.
 * Serves data in Prometheus text exposition format.
 */

interface MetricEntry {
  path: string;
  method: string;
  status: number;
  durationMs: number;
  timestamp: number;
}

const MAX_METRICS = 5000;
let metrics: MetricEntry[] = [];
let startTime = Date.now();

/** Record an API request metric. */
export function recordApiMetric(entry: MetricEntry): void {
  metrics = [entry, ...metrics].slice(0, MAX_METRICS);
}

/** Get all recorded metrics. */
export function getMetrics(): MetricEntry[] {
  return metrics;
}

/** Reset all metrics. */
export function resetMetrics(): void {
  metrics = [];
  startTime = Date.now();
}

function formatPrometheusMetrics(dbStatus: string, uptime: number): string {
  const lines: string[] = [];

  // ---- Request counts ----
  const totalRequests = metrics.length;
  const errors = metrics.filter((m) => m.status >= 400);
  const durations = metrics.map((m) => m.durationMs).sort((a, b) => a - b);

  lines.push('# HELP gihm_api_server_requests_total Total API requests handled by the server');
  lines.push('# TYPE gihm_api_server_requests_total counter');
  lines.push(`gihm_api_server_requests_total ${totalRequests}`);
  lines.push('');

  lines.push('# HELP gihm_api_server_errors_total Total API errors (4xx + 5xx)');
  lines.push('# TYPE gihm_api_server_errors_total counter');
  lines.push(`gihm_api_server_errors_total ${errors.length}`);
  lines.push('');

  // ---- Response times ----
  if (durations.length > 0) {
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const p50 = durations[Math.floor(durations.length * 0.5)] ?? 0;
    const p95 = durations[Math.floor(durations.length * 0.95)] ?? 0;
    const p99 = durations[Math.floor(durations.length * 0.99)] ?? 0;
    const min = durations[0] ?? 0;
    const max = durations[durations.length - 1] ?? 0;

    lines.push('# HELP gihm_api_server_duration_avg_ms Average response duration');
    lines.push('# TYPE gihm_api_server_duration_avg_ms gauge');
    lines.push(`gihm_api_server_duration_avg_ms ${Math.round(avg)}`);
    lines.push('');

    lines.push('# HELP gihm_api_server_duration_p50_ms Median response duration');
    lines.push('# TYPE gihm_api_server_duration_p50_ms gauge');
    lines.push(`gihm_api_server_duration_p50_ms ${p50}`);
    lines.push('');

    lines.push('# HELP gihm_api_server_duration_p95_ms 95th percentile response duration');
    lines.push('# TYPE gihm_api_server_duration_p95_ms gauge');
    lines.push(`gihm_api_server_duration_p95_ms ${p95}`);
    lines.push('');

    lines.push('# HELP gihm_api_server_duration_p99_ms 99th percentile response duration');
    lines.push('# TYPE gihm_api_server_duration_p99_ms gauge');
    lines.push(`gihm_api_server_duration_p99_ms ${p99}`);
    lines.push('');

    lines.push('# HELP gihm_api_server_duration_min_ms Minimum response duration');
    lines.push('# TYPE gihm_api_server_duration_min_ms gauge');
    lines.push(`gihm_api_server_duration_min_ms ${min}`);
    lines.push('');

    lines.push('# HELP gihm_api_server_duration_max_ms Maximum response duration');
    lines.push('# TYPE gihm_api_server_duration_max_ms gauge');
    lines.push(`gihm_api_server_duration_max_ms ${max}`);
    lines.push('');
  }

  // ---- Error rate ----
  lines.push('# HELP gihm_api_server_error_rate Error rate percentage');
  lines.push('# TYPE gihm_api_server_error_rate gauge');
  lines.push(`gihm_api_server_error_rate ${totalRequests > 0 ? Math.round((errors.length / totalRequests) * 10000) / 100 : 0}`);
  lines.push('');

  // ---- Per-endpoint ----
  const endpointMap = new Map<string, { count: number; totalMs: number; errorCount: number }>();
  for (const m of metrics) {
    const path = m.path.split('?')[0]!;
    const entry = endpointMap.get(path) ?? { count: 0, totalMs: 0, errorCount: 0 };
    entry.count++;
    entry.totalMs += m.durationMs;
    if (m.status >= 400) entry.errorCount++;
    endpointMap.set(path, entry);
  }

  lines.push('# HELP gihm_api_server_endpoint_requests_total Requests per endpoint');
  lines.push('# TYPE gihm_api_server_endpoint_requests_total counter');
  for (const [path, entry] of endpointMap) {
    lines.push(`gihm_api_server_endpoint_requests_total{path="${path.replace(/"/g, '\\"')}"} ${entry.count}`);
  }
  lines.push('');

  lines.push('# HELP gihm_api_server_endpoint_duration_ms Average duration per endpoint');
  lines.push('# TYPE gihm_api_server_endpoint_duration_ms gauge');
  for (const [path, entry] of endpointMap) {
    lines.push(`gihm_api_server_endpoint_duration_ms{path="${path.replace(/"/g, '\\"')}"} ${Math.round(entry.totalMs / entry.count)}`);
  }
  lines.push('');

  // ---- Status codes ----
  const statusMap = new Map<number, number>();
  for (const m of metrics) {
    statusMap.set(m.status, (statusMap.get(m.status) ?? 0) + 1);
  }

  lines.push('# HELP gihm_api_server_status_code_total Requests by status code');
  lines.push('# TYPE gihm_api_server_status_code_total counter');
  for (const [status, count] of statusMap) {
    lines.push(`gihm_api_server_status_code_total{status="${status}"} ${count}`);
  }
  lines.push('');

  // ---- System ----
  lines.push('# HELP gihm_api_server_uptime_seconds Server uptime in seconds');
  lines.push('# TYPE gihm_api_server_uptime_seconds gauge');
  lines.push(`gihm_api_server_uptime_seconds ${Math.round(uptime)}`);
  lines.push('');

  lines.push('# HELP gihm_api_server_database_status Database connection status (1=ok, 0=down)');
  lines.push('# TYPE gihm_api_server_database_status gauge');
  lines.push(`gihm_api_server_database_status ${dbStatus === 'operational' ? 1 : 0}`);
  lines.push('');

  lines.push('# HELP gihm_api_server_info Server information');
  lines.push('# TYPE gihm_api_server_info gauge');
  lines.push('gihm_api_server_info{version="0.1.0",service="gihm-his-api"} 1');
  lines.push('');

  return lines.join('\n');
}

/**
 * Register /metrics and /metrics/json endpoints.
 */
export function registerMetricsRoutes(app: FastifyInstance, db: PrismaClient): void {
  // Prometheus text format
  app.get('/metrics', {
    schema: {
      summary: 'Prometheus metrics endpoint',
      tags: ['system'],
      response: { 200: { type: 'string' } },
    },
  }, async () => {
    let dbStatus = 'operational';
    try {
      await db.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'unavailable';
    }
    const uptime = (Date.now() - startTime) / 1000;

    return formatPrometheusMetrics(dbStatus, uptime);
  });

  // JSON format
  app.get('/metrics/json', {
    schema: {
      summary: 'Metrics in JSON format',
      tags: ['system'],
    },
  }, async () => {
    let dbStatus = 'operational';
    try {
      await db.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'unavailable';
    }

    const durations = metrics.map((m) => m.durationMs).sort((a, b) => a - b);
    const errors = metrics.filter((m) => m.status >= 400);

    // Per-endpoint
    const endpointMap = new Map<string, { count: number; totalMs: number; errorCount: number }>();
    for (const m of metrics) {
      const path = m.path.split('?')[0]!;
      const entry = endpointMap.get(path) ?? { count: 0, totalMs: 0, errorCount: 0 };
      entry.count++;
      entry.totalMs += m.durationMs;
      if (m.status >= 400) entry.errorCount++;
      endpointMap.set(path, entry);
    }

    return {
      timestamp: new Date().toISOString(),
      uptime: Math.round((Date.now() - startTime) / 1000),
      database: dbStatus,
      summary: {
        totalRequests: metrics.length,
        totalErrors: errors.length,
        errorRate: metrics.length > 0 ? Math.round((errors.length / metrics.length) * 10000) / 100 : 0,
        avgResponseMs: durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0,
        p95ResponseMs: durations.length > 0 ? durations[Math.floor(durations.length * 0.95)] ?? 0 : 0,
      },
      endpoints: Array.from(endpointMap.entries()).map(([path, v]) => ({
        path,
        count: v.count,
        avgMs: Math.round(v.totalMs / v.count),
        errorCount: v.errorCount,
      })).sort((a, b) => b.count - a.count),
      statusCodes: Array.from(
        metrics.reduce((map, m) => map.set(m.status, (map.get(m.status) ?? 0) + 1), new Map<number, number>())
      ).map(([status, count]) => ({ status, count })).sort((a, b) => a.status - b.status),
    };
  });

  // Reset endpoint (for testing)
  app.post('/metrics/reset', {
    schema: {
      summary: 'Reset all metrics',
      tags: ['system'],
    },
  }, async () => {
    resetMetrics();
    return { ok: true };
  });
}
