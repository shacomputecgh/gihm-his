import { useEffect, useState, useCallback } from 'react';
import { Badge, Button, Card, Spinner } from '../../components/ui';
import { getPerfSummary, clearPerfEntries, initPerfTracking, initVitalsTracking, getVitals, clearVitals, type PerfSummary, type VitalEntry } from '../../lib/perfTracker';
import { getCacheSummary, clearCacheEntries, initCacheTracking, type CacheSummary } from '../../lib/cacheTracker';
import { getStorageUsage } from '../../lib/swCacheInspector';
import { exportPrometheusMetrics, exportMetricsJson } from '../../lib/metricsExporter';
import { startMetricsBroadcast, stopMetricsBroadcast, subscribeMetrics, type MetricsSnapshot } from '../../lib/metricsRelay';
import { fmtDateTime } from '../../lib/format';

/**
 * PerformanceMonitor — real-time client-side performance dashboard.
 * Shows API response times, error rates, cache hit rates, slow endpoints,
 * and a request timeline. Data is collected automatically by the fetch
 * interceptor (initPerfTracking) and lives in memory until page reload.
 */

const tone = (ms: number) => (ms < 200 ? 'green' : ms < 500 ? 'navy' : ms < 1000 ? 'gold' : 'red');

export default function PerformanceMonitor() {
  const [summary, setSummary] = useState<PerfSummary | null>(null);
  const [cacheSummary, setCacheSummary] = useState<CacheSummary | null>(null);

  const [storageUsage, setStorageUsage] = useState<{ used: number; quota: number } | null>(null);
  const [relayActive, setRelayActive] = useState(false);
  const [remoteSnapshots, setRemoteSnapshots] = useState<MetricsSnapshot[]>([]);

  const refresh = useCallback(() => {
    setSummary(getPerfSummary());
    setCacheSummary(getCacheSummary());
    getStorageUsage().then(setStorageUsage).catch(() => {});
  }, []);

  useEffect(() => {
    initPerfTracking();
    initVitalsTracking();
    initCacheTracking();
    refresh();
    const t = setInterval(refresh, 5_000);

    // Subscribe to remote broadcasts
    const unsub = subscribeMetrics((data) => {
      setRemoteSnapshots((prev) => [data, ...prev].slice(0, 20));
    });

    return () => {
      clearInterval(t);
      unsub();
    };
  }, [refresh]);

  const handleExportPrometheus = useCallback(() => {
    const text = exportPrometheusMetrics();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gihm-metrics.prom';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, []);

  const handleExportJson = useCallback(() => {
    const json = exportMetricsJson();
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gihm-metrics.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, []);

  if (!summary) return <Spinner label="Loading performance data…" />;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-3 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-g-ink sm:text-2xl">Performance Monitor</h1>
          <p className="hidden text-sm text-slate-500 sm:block">Real-time client-side API performance tracking. Data resets on page reload.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={refresh}>Refresh</Button>
          <Button size="sm" variant={relayActive ? 'green' : 'outline'} onClick={() => {
            if (relayActive) {
              stopMetricsBroadcast();
              setRelayActive(false);
            } else {
              startMetricsBroadcast();
              setRelayActive(true);
            }
          }}>{relayActive ? 'Broadcasting…' : 'Start broadcast'}</Button>
          <Button size="sm" variant="outline" onClick={handleExportPrometheus} className="hidden sm:inline-flex">Export Prometheus</Button>
          <Button size="sm" variant="outline" onClick={handleExportJson} className="hidden sm:inline-flex">Export JSON</Button>
          <Button size="sm" variant="ghost" onClick={() => { clearPerfEntries(); clearVitals(); clearCacheEntries(); refresh(); }}>Clear data</Button>
        </div>
      </div>

      {summary.totalRequests === 0 ? (
        <Card>
          <p className="py-8 text-center text-sm text-slate-400">
            No API requests recorded yet. Navigate around the app to collect performance data.
          </p>
        </Card>
      ) : (
        <>
          {/* Summary stat cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Card className="!p-4">
              <p className="text-[10px] font-bold uppercase text-slate-400">Total requests</p>
              <p className="mt-1 text-2xl font-bold text-g-ink">{summary.totalRequests}</p>
            </Card>
            <Card className="!p-4">
              <p className="text-[10px] font-bold uppercase text-slate-400">Avg response</p>
              <p className="mt-1 text-2xl font-bold text-g-ink">{summary.avgResponseMs}ms</p>
              <Badge tone={tone(summary.avgResponseMs)} className="mt-1">{summary.avgResponseMs < 200 ? 'Fast' : summary.avgResponseMs < 500 ? 'OK' : 'Slow'}</Badge>
            </Card>
            <Card className="!p-4">
              <p className="text-[10px] font-bold uppercase text-slate-400">P95 response</p>
              <p className="mt-1 text-2xl font-bold text-g-ink">{summary.p95ResponseMs}ms</p>
              <Badge tone={tone(summary.p95ResponseMs)} className="mt-1">{summary.p95ResponseMs < 500 ? 'Fast' : summary.p95ResponseMs < 1000 ? 'OK' : 'Slow'}</Badge>
            </Card>
            <Card className="!p-4">
              <p className="text-[10px] font-bold uppercase text-g-red">Error rate</p>
              <p className="mt-1 text-2xl font-bold text-g-red">{summary.errorRate}%</p>
              <p className="text-[10px] text-slate-400">{summary.totalErrors} errors</p>
            </Card>
            <Card className="!p-4">
              <p className="text-[10px] font-bold uppercase text-g-green">Cache hit rate</p>
              <p className="mt-1 text-2xl font-bold text-g-green">{summary.cacheHitRate}%</p>
              <p className="text-[10px] text-slate-400">{summary.totalCached} cached</p>
            </Card>
          </div>

          {/* Web Vitals */}
          {(() => {
            const vitalsData = getVitals();
            if (vitalsData.length === 0) return null;
            const latestByName = new Map<string, VitalEntry>();
            for (const v of vitalsData) {
              if (!latestByName.has(v.name)) latestByName.set(v.name, v);
            }
            return (
              <Card title="Web Vitals" subtitle="Core Web Vitals measured in this session">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {Array.from(latestByName.entries()).map(([name, v]) => (
                    <div key={name} className="rounded-lg border border-slate-100 p-3">
                      <p className="text-[10px] font-bold uppercase text-slate-400">{name}</p>
                      <p className="mt-1 text-xl font-bold text-g-ink">{name === 'CLS' ? v.value.toFixed(3) : `${Math.round(v.value)}ms`}</p>
                      <Badge tone={v.rating === 'good' ? 'green' : v.rating === 'needs-improvement' ? 'gold' : 'red'} className="mt-1">{v.rating}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })()}

          {/* Cache analytics */}
          {cacheSummary && cacheSummary.totalAccesses > 0 && (
            <div className="grid gap-5 lg:grid-cols-2">
              <Card title="Cache performance" subtitle="Service worker and browser cache hit rates">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-slate-100 p-3">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Total accesses</p>
                    <p className="mt-1 text-xl font-bold text-g-ink">{cacheSummary.totalAccesses}</p>
                  </div>
                  <div className="rounded-lg border border-slate-100 p-3">
                    <p className="text-[10px] font-bold uppercase text-g-green">Hit rate</p>
                    <p className="mt-1 text-xl font-bold text-g-green">{cacheSummary.hitRate}%</p>
                  </div>
                  <div className="rounded-lg border border-slate-100 p-3">
                    <p className="text-[10px] font-bold uppercase text-g-red">Misses</p>
                    <p className="mt-1 text-xl font-bold text-g-red">{cacheSummary.totalMisses}</p>
                  </div>
                </div>
                {cacheSummary.byCacheName.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-bold uppercase text-slate-400">By cache</p>
                    {cacheSummary.byCacheName.map((c) => (
                      <div key={c.name} className="flex items-center justify-between text-sm">
                        <span className="font-mono text-xs text-g-ink">{c.name}</span>
                        <span className="text-xs text-slate-500">{c.entries} entries</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card title="Cache by route" subtitle="Hit rate per API path">
                <div className="space-y-2">
                  {cacheSummary.byRoute.map((r) => (
                    <div key={r.route} className="flex items-center justify-between text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-xs text-g-ink">{r.route}</p>
                        <p className="text-[10px] text-slate-400">{r.hits} hits · {r.misses} misses</p>
                      </div>
                      <Badge tone={r.hitRate >= 80 ? 'green' : r.hitRate >= 50 ? 'gold' : 'red'}>{r.hitRate}%</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Storage usage */}
          {storageUsage && storageUsage.quota > 0 && (
            <Card title="Storage usage" subtitle="Browser storage consumed by caches">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-g-navy"
                      style={{ width: `${Math.min(100, (storageUsage.used / storageUsage.quota) * 100)}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm text-slate-500">
                  {(storageUsage.used / 1024 / 1024).toFixed(1)} MB / {(storageUsage.quota / 1024 / 1024).toFixed(0)} MB
                  ({((storageUsage.used / storageUsage.quota) * 100).toFixed(1)}%)
                </span>
              </div>
            </Card>
          )}

          {/* Response time timeline */}
          {summary.timeline.length > 0 && (
            <Card title="Response time timeline" subtitle="Average response time per minute">
              <div className="flex h-28 items-end gap-px">
                {summary.timeline.map((t) => (
                  <div key={t.minute} className="group relative flex-1" title={`${t.minute}: ${t.avgMs}ms (${t.count} reqs)`}>
                    <div
                      className={`w-full rounded-t ${tone(t.avgMs) === 'green' ? 'bg-g-green' : tone(t.avgMs) === 'navy' ? 'bg-g-navy' : tone(t.avgMs) === 'gold' ? 'bg-g-gold' : 'bg-g-red'}`}
                      style={{ height: `${Math.max(4, (t.avgMs / Math.max(1, ...summary.timeline.map((p) => p.avgMs))) * 100)}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                <span>{summary.timeline[0]?.minute}</span>
                <span>{summary.timeline[summary.timeline.length - 1]?.minute}</span>
              </div>
            </Card>
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Status code breakdown */}
            <Card title="Status codes">
              <div className="space-y-2">
                {Object.entries(summary.byStatus)
                  .sort(([, a], [, b]) => b - a)
                  .map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge tone={Number(status) < 300 ? 'green' : Number(status) < 400 ? 'navy' : Number(status) < 500 ? 'gold' : 'red'}>
                          {status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-g-navy"
                            style={{ width: `${(count / summary.totalRequests) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>

            {/* Slowest endpoints */}
            <Card title="Top endpoints" subtitle="Most called API paths">
              <div className="space-y-2">
                {summary.byPath.map((p) => (
                  <div key={p.path} className="flex items-center justify-between text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-xs text-g-ink">{p.path}</p>
                      <p className="text-[10px] text-slate-400">{p.count} calls · avg {p.avgMs}ms</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge tone={tone(p.avgMs)}>{p.avgMs}ms</Badge>
                      {p.errorCount > 0 && <Badge tone="red">{p.errorCount} err</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Recent errors */}
          {summary.recentErrors.length > 0 && (
            <Card title="Recent errors" subtitle="Last 10 failed requests">
              <div className="space-y-2">
                {summary.recentErrors.map((e) => (
                  <div key={e.id} className="flex items-center justify-between rounded-lg border border-g-red/20 bg-g-red/5 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-xs text-g-red">{e.method} {e.path}</p>
                      <p className="text-[10px] text-slate-400">{fmtDateTime(new Date(e.timestamp).toISOString())} · {e.durationMs}ms</p>
                    </div>
                    <Badge tone="red">{e.status || 'NET'}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Real-time metrics from other tabs */}
      {remoteSnapshots.length > 0 && (
        <Card title="Real-time relay" subtitle={`Metrics from ${remoteSnapshots.length} broadcast(s) by other tabs`}>          <div className="space-y-3">
            {remoteSnapshots.slice(0, 5).map((snap, i) => (
              <div key={`${snap.timestamp}-${i}`} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                <div className="flex items-center gap-3">
                  <Badge tone="blue">{snap.tab || 'Unknown tab'}</Badge>
                  <span className="text-xs text-slate-500">
                    {snap.api.totalRequests} reqs · {snap.api.avgResponseMs}ms avg · {snap.cache.hitRate}% cache hit
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {new Date(snap.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
