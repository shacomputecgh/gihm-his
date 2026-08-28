import { useEffect, useState, useCallback } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Button, Card, Spinner } from '../../components/ui';
import { enumerateCaches, clearAllCaches, clearCacheByName, getStorageUsage, type CacheInfo } from '../../lib/swCacheInspector';
import { isSWActive, getSWInfo, forceSWUpdate } from '../../lib/swEventInterceptor';

/**
 * CacheStrategy — shows the current caching configuration, Workbox
 * precache manifest, cache sizes, and provides controls to manage caches.
 */

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatAge(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)}h ago`;
  return `${Math.round(ms / 86_400_000)}d ago`;
}

const CACHE_POLICIES = [
  { pattern: '/api/v1/geography/*', strategy: 'NetworkFirst', description: 'Try network, fall back to cache. Geography data rarely changes.' },
  { pattern: '/api/v1/facilities/*', strategy: 'NetworkFirst', description: 'Facility data: network preferred, cache as fallback.' },
  { pattern: '/api/v1/patients/*', strategy: 'NetworkOnly', description: 'Patient data: always fresh from the API. Never cached.' },
  { pattern: '/api/v1/sync/*', strategy: 'NetworkOnly', description: 'Sync endpoints: never cached. Real-time consistency required.' },
  { pattern: '**/*.js', strategy: 'CacheFirst', description: 'JavaScript bundles: served from cache first for fast loads.' },
  { pattern: '**/*.css', strategy: 'CacheFirst', description: 'Stylesheets: cached for instant rendering.' },
  { pattern: '**/*.svg', strategy: 'CacheFirst', description: 'SVG icons: cached for fast icon rendering.' },
  { pattern: '/app/*', strategy: 'NetworkFirst', description: 'App shell: try network, fall back to cached HTML.' },
  { pattern: '/', strategy: 'NetworkFirst', description: 'Root page: network preferred, cache as offline fallback.' },
];

const strategyColor: Record<string, 'green' | 'navy' | 'gold' | 'blue' | 'red'> = {
  NetworkFirst: 'navy',
  CacheFirst: 'green',
  NetworkOnly: 'red',
  CacheOnly: 'gold',
  StaleWhileRevalidate: 'blue',
};

export default function CacheStrategy() {
  const [caches, setCaches] = useState<CacheInfo[]>([]);
  const [storageUsage, setStorageUsage] = useState<{ used: number; quota: number } | null>(null);
  const [swActive, setSWActive] = useState(false);
  const [swInfo, setSWInfo] = useState<{ active: boolean; scope: string; updateViaCache: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [cacheData, usage, active, info] = await Promise.all([
        enumerateCaches(),
        getStorageUsage(),
        isSWActive(),
        getSWInfo(),
      ]);
      setCaches(cacheData);
      setStorageUsage(usage);
      setSWActive(active);
      setSWInfo(info);
    } catch {
      // Ignore errors in jsdom/test
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading) return <Spinner label="Loading cache information…" />;

  const totalCacheSize = caches.reduce((a, b) => a + b.totalSize, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-3 sm:p-6">
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">
          {showAdd ? "\u2715 Cancel" : "+ Add New"}
        </button>
      </div>
      {showAdd && (
        <AddNewForm
          title="Add New Cache Rule"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-g-ink sm:text-2xl">Cache Strategy</h1>
          <p className="hidden text-sm text-slate-500 sm:block">Service Worker caching policies, precache manifest, and storage management.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={refresh}>Refresh</Button>
          <Button size="sm" variant="outline" onClick={forceSWUpdate}>Update SW</Button>
          <Button size="sm" variant="ghost" onClick={clearAllCaches}>Clear all caches</Button>
        </div>
      </div>

      {/* Service Worker Status */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="!p-4">
          <p className="text-[10px] font-bold uppercase text-slate-400">SW Status</p>
          <div className="mt-1 flex items-center gap-2">
            <Badge tone={swActive ? 'green' : 'red'}>{swActive ? 'Active' : 'Inactive'}</Badge>
          </div>
        </Card>
        <Card className="!p-4">
          <p className="text-[10px] font-bold uppercase text-slate-400">SW Scope</p>
          <p className="mt-1 truncate font-mono text-xs text-g-ink">{swInfo?.scope ?? '—'}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-[10px] font-bold uppercase text-slate-400">Total cached</p>
          <p className="mt-1 text-xl font-bold text-g-ink">{formatBytes(totalCacheSize)}</p>
          <p className="text-[10px] text-slate-400">{caches.length} cache(s)</p>
        </Card>
        <Card className="!p-4">
          <p className="text-[10px] font-bold uppercase text-slate-400">Storage usage</p>
          {storageUsage ? (
            <>
              <p className="mt-1 text-sm font-bold text-g-ink">{formatBytes(storageUsage.used)} / {formatBytes(storageUsage.quota)}</p>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-g-navy" style={{ width: `${Math.min(100, (storageUsage.used / storageUsage.quota) * 100)}%` }} />
              </div>
            </>
          ) : (
            <p className="mt-1 text-sm text-slate-400">Not available</p>
          )}
        </Card>
      </div>

      {/* Caching Policies */}
      <Card title="Caching policies" subtitle="Workbox strategies for different URL patterns">
        <div className="space-y-2">
          {CACHE_POLICIES.map((policy) => (
            <div key={policy.pattern} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-g-ink">{policy.pattern}</code>
                  <Badge tone={strategyColor[policy.strategy] ?? 'gray'}>{policy.strategy}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{policy.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Cache Details */}
      {caches.length > 0 && (
        <Card title="Cache storage" subtitle="Active caches managed by the service worker">
          <div className="space-y-4">
            {caches.map((cache) => (
              <div key={cache.name} className="rounded-lg border border-slate-100 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-g-ink">{cache.name}</h3>
                    <p className="text-xs text-slate-400">{cache.entries.length} entries · {formatBytes(cache.totalSize)}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={async () => {
                    await clearCacheByName(cache.name);
                    refresh();
                  }}>Clear</Button>
                </div>
                {cache.entries.length > 0 && (
                  <div className="mt-3 max-h-48 space-y-1 overflow-y-auto">
                    {cache.entries.slice(0, 20).map((entry) => {
                      let displayName = entry.url;
                      try { displayName = new URL(entry.url).pathname; } catch { /* keep */ }
                      return (
                        <div key={entry.url} className="flex items-center justify-between text-xs">
                          <span className="truncate font-mono text-slate-600">{displayName}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">{formatBytes(entry.size)}</span>
                            {entry.age > 0 && <span className="text-slate-400">{formatAge(entry.age)}</span>}
                          </div>
                        </div>
                      );
                    })}
                    {cache.entries.length > 20 && (
                      <p className="text-[10px] text-slate-400">… and {cache.entries.length - 20} more entries</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
