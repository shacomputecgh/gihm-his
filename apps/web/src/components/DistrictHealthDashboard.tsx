import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import type { SurveillanceSummary } from '../types';
import { Badge, Button, Card, EmptyState, Spinner } from './ui';
import { exportCsv } from '../lib/constants';
import { fmtDate } from '../lib/format';

import { getOutbreakThreshold } from '../lib/constants';

/**
 * DistrictHealthDashboard — a regional-level surveillance overview with
 * drill-down from region → district → facility.  Shows outbreak alerts,
 * disease breakdown, contact-tracing metrics, and a trend sparkline.
 */

interface FacilityRow {
  id: string;
  name: string;
  district: string;
  open: number;
  confirmed: number;
  total: number;
  followUpRate: number;
  lastReportedAt: string | null;
}

interface DistrictOverview {
  regionName: string;
  districtName: string | null;
  facilities: FacilityRow[];
  summary: SurveillanceSummary;
}

interface Props {
  /** When set, the view is scoped to this district. */
  districtId?: string;
}

export default function DistrictHealthDashboard({ districtId }: Props) {
  const [data, setData] = useState<DistrictOverview | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<string | null>(null);

  const load = useCallback(async () => {
    const q = districtId ? `?districtId=${encodeURIComponent(districtId)}` : '';
    const res = await api<DistrictOverview>(`/surveillance/district-overview${q}`);
    setData(res);
  }, [districtId]);

  useEffect(() => {
    void load().catch(() => undefined);
    const t = window.setInterval(() => void load().catch(() => undefined), 60_000);
    return () => window.clearInterval(t);
  }, [load]);

  const outbreaks = useMemo(() => {
    const threshold = getOutbreakThreshold();
    return data?.summary.byDisease.filter((d) => d.open >= threshold) ?? [];
  }, [data]);

  const totalStats = useMemo(() => {
    if (!data) return null;
    const s = data.summary.totals;
    const totalFacilities = data.facilities.length;
    const reportingFacilities = data.facilities.filter((f) => f.total > 0).length;
    return { ...s, totalFacilities, reportingFacilities };
  }, [data]);

  if (!data) return <Spinner label="Loading district health overview…" />;

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="font-semibold text-g-ink">{data.regionName}</span>
        {data.districtName && (
          <>
            <span>→</span>
            <span className="font-semibold text-g-ink">{data.districtName}</span>
          </>
        )}
        {selectedFacility && (
          <>
            <span>→</span>
            <span className="font-semibold text-g-ink">
              {data.facilities.find((f) => f.id === selectedFacility)?.name}
            </span>
          </>
        )}
      </div>

      {/* Outbreak alerts */}
      {outbreaks.length > 0 && (
        <Card className="border-g-red/30 bg-g-red/5">
          <div className="flex items-start gap-3">
            <span className="text-xl">🚨</span>
            <div className="flex-1">
              <p className="font-bold text-g-red">Active outbreak alerts</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {outbreaks.map((o) => (
                  <Badge key={o.disease} tone="red">
                    {o.disease} — {o.open} open case{o.open !== 1 ? 's' : ''}
                  </Badge>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Diseases with 3 or more open cases are flagged as possible outbreaks.
                Escalate to the district health management team per the outbreak protocol.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Summary stat cards */}
      {totalStats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="!p-4">
            <p className="text-[10px] font-bold uppercase text-slate-400">Total cases</p>
            <p className="mt-1 text-xl font-bold text-g-ink">{totalStats.cases}</p>
            <p className="text-[10px] text-slate-400">{totalStats.totalFacilities} facilities in scope</p>
          </Card>
          <Card className="!p-4">
            <p className="text-[10px] font-bold uppercase text-g-red">Open</p>
            <p className="mt-1 text-xl font-bold text-g-red">{totalStats.open}</p>
          </Card>
          <Card className="!p-4">
            <p className="text-[10px] font-bold uppercase text-g-green">Recovered</p>
            <p className="mt-1 text-xl font-bold text-g-green">{totalStats.closed}</p>
          </Card>
          <Card className="!p-4">
            <p className="text-[10px] font-bold uppercase text-g-navy">Follow-up rate</p>
            <p className="mt-1 text-xl font-bold text-g-ink">{totalStats.followUpRate}%</p>
          </Card>
          <Card className="!p-4">
            <p className="text-[10px] font-bold uppercase text-g-gold">Contacts traced</p>
            <p className="mt-1 text-xl font-bold text-g-ink">{totalStats.contactsTraced}</p>
          </Card>
        </div>
      )}

      {/* 30-day trend chart */}
      {data.summary.trend.length > 0 && (
        <Card title="30-day trend" subtitle="Cases reported per day">
          <div className="flex h-24 items-end gap-1">
            {data.summary.trend.map((t) => (
              <div key={t.date} className="group relative flex-1" title={`${t.date}: ${t.count}`}>
                <div
                  className={`w-full rounded-t ${t.count >= getOutbreakThreshold() ? 'bg-g-red' : t.count > 0 ? 'bg-g-navy' : 'bg-slate-100'}`}
                  style={{ height: `${Math.max(4, (t.count / Math.max(1, ...data.summary.trend.map((p) => p.count))) * 100)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-400">
            <span>{fmtDate(data.summary.trend[0]?.date ?? '')}</span>
            <span>today</span>
          </div>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Facility table */}
        <Card title="Facility breakdown" subtitle="Case counts per reporting facility" className="lg:col-span-2" action={
          <Button size="sm" variant="outline" icon="download" onClick={() => exportCsv(data.facilities.map((f) => ({ Facility: f.name, District: f.district, Total: f.total, Open: f.open, Confirmed: f.confirmed, 'Follow-up rate': f.followUpRate + '%', 'Last reported': f.lastReportedAt ?? '' })), `facility-cases-${data.districtName ?? data.regionName}`)}>Export CSV</Button>
        }>
          {data.facilities.length === 0 ? (
            <EmptyState icon="building" title="No facilities" message="No facilities are registered in this district." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
                    {['Facility', 'District', 'Total', 'Open', 'Confirmed', 'Follow-up rate', 'Last reported'].map((h) => (
                      <th key={h} className="px-4 py-2 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.facilities.map((f) => (
                    <tr
                      key={f.id}
                      className={`cursor-pointer transition hover:bg-g-mist/40 ${selectedFacility === f.id ? 'bg-g-mist/60' : ''}`}
                      onClick={() => setSelectedFacility(selectedFacility === f.id ? null : f.id)}
                    >
                      <td className="px-4 py-2">
                        <p className="font-semibold text-g-ink">{f.name}</p>
                      </td>
                      <td className="px-4 py-2 text-slate-500">{f.district}</td>
                      <td className="px-4 py-2 font-bold tabular-nums">{f.total}</td>
                      <td className="px-4 py-2">
                        {f.open > 0 ? <Badge tone="red">{f.open}</Badge> : <span className="text-slate-300">0</span>}
                      </td>
                      <td className="px-4 py-2">{f.confirmed}</td>
                      <td className="px-4 py-2 tabular-nums">{f.followUpRate}%</td>
                      <td className="px-4 py-2 text-xs text-slate-400">{f.lastReportedAt ? fmtDate(f.lastReportedAt) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Disease breakdown */}
          <Card title="By disease" subtitle="Open cases across all facilities">
            {data.summary.byDisease.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">No cases reported.</p>
            ) : (
              <div className="space-y-2">
                {data.summary.byDisease.map((d) => (
                  <div key={d.disease} className="group" title={`${d.confirmed} confirmed · ${d.open} open`}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-g-ink">{d.disease}</span>
                      <span className="tabular-nums text-slate-500">{d.count}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${d.open >= getOutbreakThreshold() ? 'bg-g-red' : 'bg-g-navy'}`} style={{ width: `${Math.max(4, (d.count / Math.max(1, data.summary.byDisease[0]?.count ?? 1)) * 100)}%` }} />
                    </div>
                    <div className="flex gap-2 text-[10px] text-slate-400">
                      <span>{d.open} open</span>
                      <span>{d.confirmed} confirmed</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Coverage info */}
          <Card>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-slate-500">Reporting facilities</span><span className="font-bold">{totalStats?.reportingFacilities}/{totalStats?.totalFacilities}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Suspected cases</span><span className="font-bold">{totalStats?.suspected}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Deaths</span><span className="font-bold">{totalStats?.deaths}</span></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
