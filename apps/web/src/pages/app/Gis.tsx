import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../../lib/api';
import type { GeographyMap, Region } from '../../types';
import { Badge, Card, EmptyState, PageHeader, Segmented, Spinner } from '../../components/ui';
import { fmtDate, scopeLabel } from '../../lib/format';
import { useAuth } from '../../lib/auth';
import {
  CHOROPLETH_COLORS,
  aggregateAreas,
  bucketCounts,
  bucketOf,
  bucketRanges,
  indicatorValue,
  quantileBreaks,
  radiusForArea,
  type OverlayIndicator,
  type OverlayKind,
} from '../../lib/geoOverlay';

// ---------------------------------------------------------------------------
// GIS layer (docs/14 §6): the national facility map. Markers are coloured by
// ownership and sized by 30-day activity (encounters + admissions + labs +
// cases), aggregate-only, scope-filtered exactly like the reports.
// ---------------------------------------------------------------------------

const GHANA_CENTER: [number, number] = [7.9, -1.0];
const GHANA_ZOOM = 6;

type ColorKey = 'GHS' | 'GOVERNMENT' | 'PRIVATE' | 'TEACHING_HOSPITAL' | 'MISSION' | 'OTHER';

const OWNER_COLORS: Record<ColorKey, string> = {
  GHS: '#d92d20',
  GOVERNMENT: '#1d4ed8',
  PRIVATE: '#047857',
  TEACHING_HOSPITAL: '#7c3aed',
  MISSION: '#b45309',
  OTHER: '#64748b',
};

function ownerKey(o: string): ColorKey {
  const u = o.toUpperCase();
  if (u.includes('TEACHING')) return 'TEACHING_HOSPITAL';
  if (u.includes('MISSION')) return 'MISSION';
  if (u.includes('PRIVATE')) return 'PRIVATE';
  if (u.includes('GHS')) return 'GHS';
  if (u.includes('GOVERNMENT') || u.includes('PUBLIC')) return 'GOVERNMENT';
  return 'OTHER';
}

const FACILITY_TYPE_LABELS: Record<string, string> = {
  TEACHING_HOSPITAL: 'Teaching hospital',
  REGIONAL_HOSPITAL: 'Regional hospital',
  MUNICIPAL_HOSPITAL: 'Municipal hospital',
  DISTRICT_HOSPITAL: 'District hospital',
  POLYCLINIC: 'Polyclinic',
  HEALTH_CENTRE: 'Health centre',
  CHPS_COMPOUND: 'CHPS compound',
  PRIVATE_HOSPITAL: 'Private hospital',
  MISSION_HOSPITAL: 'Mission hospital',
  DIAGNOSTIC_CENTRE: 'Diagnostic centre',
  PHARMACY: 'Pharmacy',
};

const TYPES = Object.keys(FACILITY_TYPE_LABELS);

function radiusFor(activity: number): number {
  if (activity <= 0) return 6;
  return Math.min(20, 6 + Math.sqrt(activity) * 1.6);
}

const INDICATOR_LABELS: Record<OverlayIndicator, string> = {
  activity30d: 'Activity (30d)',
  bedCapacity: 'Bed capacity',
  facilities: 'Facilities in scope',
};

const INDICATOR_UNITS: Record<OverlayIndicator, string> = {
  activity30d: 'activities',
  bedCapacity: 'beds',
  facilities: 'facilities',
};

const fmtVal = (n: number): string => n.toLocaleString('en-GB');

const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`;

function fmtRange(r: { lo: number; hi: number }): string {
  return r.lo === r.hi ? fmtVal(r.hi) : `${fmtVal(r.lo)} – ${fmtVal(r.hi)}`;
}

export default function Gis() {
  const { user } = useAuth();
  const [mapData, setMapData] = useState<GeographyMap | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regionId, setRegionId] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [sector, setSector] = useState<'all' | 'public' | 'private'>('all');
  const [onlyActive, setOnlyActive] = useState(false);
  const [view, setView] = useState<'markers' | 'choropleth'>('markers');
  const [overlayKind, setOverlayKind] = useState<OverlayKind>('region');
  const [indicator, setIndicator] = useState<OverlayIndicator>('activity30d');

  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  const load = async () => {
    setBusy(true);
    try {
      const [m, r] = await Promise.all([
        api<GeographyMap>('/geography/map'),
        api<{ regions: Region[] }>('/geography/regions'),
      ]);
      setMapData(m);
      setRegions(r.regions);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the national map');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  // Init Leaflet once the container has actually mounted. The map div only
  // renders after the data fetch completes (the page shows a Spinner while
  // busy), so an empty-deps effect would bail with a null ref and the map
  // would never appear — re-run when the fetch settles instead.
  const mapReady = !busy;
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { center: GHANA_CENTER, zoom: GHANA_ZOOM });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [mapReady]);

  const filtered = useMemo(() => {
    const points = mapData?.points ?? [];
    return points.filter((p) => {
      if (regionId && p.regionId !== regionId) return false;
      if (type && p.type !== type) return false;
      if (sector === 'public' && !['GHS', 'GOVERNMENT', 'TEACHING_HOSPITAL', 'MISSION'].includes(ownerKey(p.ownership))) return false;
      if (sector === 'private' && ownerKey(p.ownership) !== 'PRIVATE') return false;
      if (onlyActive && p.activity30d <= 0) return false;
      return true;
    });
  }, [mapData, regionId, type, sector, onlyActive, regions]);

  // Choropleth overlay — the same scope-filtered points the markers render,
  // aggregated per region/district at the facility centroid (lib/geoOverlay).
  const areas = useMemo(() => aggregateAreas(filtered, overlayKind), [filtered, overlayKind]);
  const values = useMemo(() => areas.map((a) => indicatorValue(a, indicator)), [areas, indicator]);
  const breaks = useMemo(() => quantileBreaks(values), [values]);
  const counts = useMemo(() => bucketCounts(values, breaks), [values, breaks]);
  const ranges = useMemo(() => bucketRanges(breaks), [breaks]);
  const maxValue = useMemo(() => (values.length > 0 ? Math.max(...values) : 0), [values]);

  // Redraw the layer (facility markers or the choropleth overlay) whenever the
  // filters, layer mode, or overlay settings change.
  useEffect(() => {
    const layer = layerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;
    layer.clearLayers();

    if (view === 'choropleth') {
      for (const a of areas) {
        const value = indicatorValue(a, indicator);
        const color = CHOROPLETH_COLORS[bucketOf(value, breaks)];
        const bubble = L.circleMarker([a.lat, a.lng], {
          radius: radiusForArea(value, maxValue),
          color: '#fff',
          weight: 1.5,
          fillColor: color,
          fillOpacity: 0.75,
        });
        const where = a.parentName ? `${escapeHtml(a.name)}, ${escapeHtml(a.parentName)}` : escapeHtml(a.name);
        bubble.bindPopup(
          `<div style="font-family:system-ui,sans-serif;min-width:210px">
            <p style="margin:0 0 2px;font-weight:700;color:#111827">${where}</p>
            <p style="margin:0 0 8px;font-size:12px;color:#6b7280">${a.kind} · ${escapeHtml(INDICATOR_LABELS[indicator])}: <strong>${fmtVal(value)}</strong> ${INDICATOR_UNITS[indicator]}</p>
            <p style="margin:0 0 2px;font-size:12px;color:#374151">${a.facilities} facilities in scope</p>
            <p style="margin:0 0 2px;font-size:12px;color:#374151">${a.activity30d.toLocaleString('en-GB')} activities (30d)</p>
            <p style="margin:0 0 2px;font-size:12px;color:#374151">${a.bedCapacity.toLocaleString('en-GB')} beds</p>
          </div>`,
        );
        bubble.on('click', () => {
          map.panTo([a.lat, a.lng], { animate: true });
        });
        bubble.addTo(layer);
      }
      if (areas.length > 0) {
        map.fitBounds(L.latLngBounds(areas.map((a) => [a.lat, a.lng] as [number, number])), { padding: [30, 30] });
      }
      return;
    }

    for (const p of filtered) {
      const color = OWNER_COLORS[ownerKey(p.ownership)];
      const radius = radiusFor(p.activity30d);
      const marker = L.circleMarker([p.lat, p.lng], {
        radius,
        color: '#fff',
        weight: 1.5,
        fillColor: color,
        fillOpacity: 0.85,
      });
      const activity = p.activity30d > 0 ? `${p.activity30d.toLocaleString('en-GB')} activities (30d)` : 'No activity in last 30 days';
      marker.bindPopup(
        `<div style="font-family:system-ui,sans-serif;min-width:210px">
          <p style="margin:0 0 2px;font-weight:700;color:#111827">${escapeHtml(p.name)}</p>
          <p style="margin:0 0 8px;font-size:12px;color:#6b7280;font-family:ui-monospace,monospace">${escapeHtml(p.code)} · ${FACILITY_TYPE_LABELS[p.type] ?? p.type}</p>
          <p style="margin:0 0 2px;font-size:12px;color:#374151">${escapeHtml(p.ownership)}${p.bedCapacity ? ` · ${p.bedCapacity} beds` : ''}</p>
          <p style="margin:0 0 8px;font-size:12px;color:#374151">${escapeHtml(p.district ?? '—')}, ${escapeHtml(p.region ?? '—')}</p>
          <p style="margin:0 0 10px;font-size:12px;color:#047857;font-weight:600">${activity}</p>
          <a href="/facilities/${p.id}" style="font-size:12px;color:#1d4ed8">View facility profile →</a>
        </div>`,
      );
      marker.on('click', () => {
        map.panTo([p.lat, p.lng], { animate: true });
      });
      marker.addTo(layer);
    }
    if (filtered.length > 0) {
      map.fitBounds(L.latLngBounds(filtered.map((p) => [p.lat, p.lng] as [number, number])), { padding: [30, 30] });
    }
  }, [filtered, view, areas, indicator, breaks, maxValue]);

  const byOwnership = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of filtered) counts.set(ownerKey(p.ownership), (counts.get(ownerKey(p.ownership)) ?? 0) + 1);
    return counts;
  }, [filtered]);

  return (
    <div>
      <PageHeader
        title="National facility map"
        subtitle="GIS layer — every in-scope facility with GPS coordinates; marker colour = ownership, size = 30-day activity, plus a region/district choropleth overlay (docs/14 §6)."
      />

      <Card className="mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-56">
            <label className="mb-1 block text-xs font-semibold text-slate-500">Region</label>
            <select value={regionId} onChange={(e) => setRegionId(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="">All regions</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div className="w-56">
            <label className="mb-1 block text-xs font-semibold text-slate-500">Facility type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="">All types</option>
              {TYPES.map((t) => (
                <option key={t} value={t}>{FACILITY_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div className="pb-0.5">
            <label className="mb-1 block text-xs font-semibold text-slate-500">Sector</label>
            <Segmented
              options={[
                { value: 'all', label: 'All' },
                { value: 'public', label: 'Public' },
                { value: 'private', label: 'Private' },
              ]}
              value={sector}
              onChange={(v) => setSector(v as 'all' | 'public' | 'private')}
            />
          </div>
          <div className="pb-0.5">
            <label className="mb-1 block text-xs font-semibold text-slate-500">Layer</label>
            <Segmented
              options={[
                { value: 'markers', label: 'Markers' },
                { value: 'choropleth', label: 'Choropleth' },
              ]}
              value={view}
              onChange={(v) => setView(v as 'markers' | 'choropleth')}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm text-slate-600">
            <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-g-red focus:ring-g-red" />
            Active only (30d)
          </label>
          <div className="ml-auto pb-0.5 text-right">
            <p className="text-sm font-semibold text-g-ink">{filtered.length} of {mapData?.total ?? 0} facilities</p>
            <p className="text-xs text-slate-400">Scope {scopeLabel(mapData?.scope, user ?? {})} · {mapData ? fmtDate(mapData.generatedAt) : '…'}</p>
            {mapData?.truncated && (
              <p className="text-xs font-semibold text-amber-600">Showing the first 1,000 — narrow the scope for the full set.</p>
            )}
          </div>
        </div>
      </Card>

      {busy && !mapData ? (
        <Spinner />
      ) : error ? (
        <EmptyState icon="globe" title="Map unavailable" message={error} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          {/* Legend + summary */}
          <div className="space-y-4">
            {view === 'choropleth' ? (
              <Card className="px-5 py-4">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-g-navy">Choropleth overlay</h3>
                <div className="mb-3">
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Granularity</label>
                  <Segmented
                    options={[
                      { value: 'region', label: 'Region' },
                      { value: 'district', label: 'District' },
                    ]}
                    value={overlayKind}
                    onChange={(v) => setOverlayKind(v as OverlayKind)}
                  />
                </div>
                <div className="mb-3">
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Indicator</label>
                  <select
                    value={indicator}
                    onChange={(e) => setIndicator(e.target.value as OverlayIndicator)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="activity30d">Activity (30d)</option>
                    <option value="bedCapacity">Bed capacity</option>
                    <option value="facilities">Facilities in scope</option>
                  </select>
                </div>
                {areas.length === 0 ? (
                  <p className="text-sm text-slate-400">No in-scope facilities with {overlayKind} data to shade.</p>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      {CHOROPLETH_COLORS.map((c, i) => (
                        <div key={c} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-slate-600">
                            <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: c }} />
                            {fmtRange(ranges[i]!)}
                          </span>
                          <span className="font-mono text-xs text-slate-400">{plural(counts[i]!, overlayKind)}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-slate-400">
                      Shaded by {INDICATOR_LABELS[indicator].toLowerCase()} across {plural(areas.length, overlayKind)} in scope — quantile buckets, aggregate-only, computed live from the same scope-filtered map data.
                    </p>
                  </>
                )}
              </Card>
            ) : (
              <>
                <Card className="px-5 py-4">
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-g-navy">Legend — ownership</h3>
                  <div className="space-y-1.5">
                    {(['GHS', 'GOVERNMENT', 'PRIVATE', 'TEACHING_HOSPITAL', 'MISSION', 'OTHER'] as ColorKey[]).map((k) => (
                      <div key={k} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-slate-600">
                          <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: OWNER_COLORS[k] }} />
                          {k.replace(/_/g, ' ').toLowerCase()}
                        </span>
                        <span className="font-mono text-xs text-slate-400">{byOwnership.get(k) ?? 0}</span>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card className="px-5 py-4">
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-g-navy">Marker size</h3>
                  <p className="text-sm text-slate-500">Radius scales with 30-day activity (encounters + admissions + lab tests + disease cases).</p>
                  <div className="mt-3 flex items-end gap-3">
                    <div className="text-center">
                      <div className="mx-auto h-3 w-3 rounded-full border border-white bg-g-red/60" />
                      <p className="mt-1 text-[10px] text-slate-400">Inactive</p>
                    </div>
                    <div className="text-center">
                      <div className="mx-auto h-5 w-5 rounded-full border border-white bg-g-red/70" />
                      <p className="mt-1 text-[10px] text-slate-400">Moderate</p>
                    </div>
                    <div className="text-center">
                      <div className="mx-auto h-8 w-8 rounded-full border border-white bg-g-red" />
                      <p className="mt-1 text-[10px] text-slate-400">Busy</p>
                    </div>
                  </div>
                </Card>
              </>
            )}
            <Card className="px-5 py-4">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-g-navy">Status</h3>
              <div className="space-y-1 text-sm text-slate-500">
                <p><Badge tone="green">Operational</Badge></p>
                <p className="text-xs text-slate-400">Click a marker for facility details; links open the public profile.</p>
              </div>
            </Card>
          </div>

          {/* Map */}
          <Card pad={false} className="overflow-hidden">
            <div ref={containerRef} className="h-[560px] w-full" />
          </Card>
        </div>
      )}
    </div>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}
