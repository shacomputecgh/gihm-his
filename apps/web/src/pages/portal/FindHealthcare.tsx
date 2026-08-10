import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import type { District, Facility, Region } from '../../types';
import { Badge, Card, EmptyState, Field, Icon, Input, Select, Spinner } from '../../components/ui';
import { FACILITY_TYPE_LABELS, SERVICE_LABELS, titleCase } from '../../lib/format';

const FACILITY_TYPES = Object.keys(FACILITY_TYPE_LABELS);
const OWNERSHIPS = ['GOVERNMENT', 'GHS', 'MOH', 'TEACHING_HOSPITAL', 'CHAG_MISSION', 'PRIVATE', 'QUASI_GOVT', 'NGO', 'OTHER'];

export default function FindHealthcare() {
  const [params, setParams] = useSearchParams();
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [data, setData] = useState<{ items: Facility[]; total: number; pages: number; page: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const q = params.get('q') ?? '';
  const regionId = params.get('regionId') ?? '';
  const districtId = params.get('districtId') ?? '';
  const type = params.get('type') ?? '';
  const ownership = params.get('ownership') ?? '';
  const page = Number(params.get('page') ?? '1');

  useEffect(() => {
    void api<{ regions: Region[] }>('/geography/regions', { public: true }).then((r) => setRegions(r.regions)).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!regionId) { setDistricts([]); return; }
    void api<{ districts: District[] }>('/geography/districts', { public: true, query: { regionId } }).then((r) => setDistricts(r.districts)).catch(() => undefined);
  }, [regionId]);

  useEffect(() => {
    setLoading(true);
    void api<{ items: Facility[]; total: number; pages: number; page: number }>('/facilities', {
      public: true,
      query: { q, regionId, districtId, type, ownership, page: String(page), pageSize: '9' },
    })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [q, regionId, districtId, type, ownership, page]);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  const regionName = useMemo(() => regions.find((r) => r.id === regionId)?.name, [regions, regionId]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-bold text-g-ink">Find Healthcare</h1>
      <p className="mt-1 text-sm text-slate-500">Search the national facility directory by name, region, district, type or ownership.</p>

      <Card className="mt-6">
        <div className="grid gap-4 md:grid-cols-6">
          <div className="md:col-span-2">
            <Field label="Search">
              <Input placeholder="Facility name, e.g. Korle-Bu" value={q} onChange={(e) => update('q', e.target.value)} />
            </Field>
          </div>
          <Field label="Region">
            <Select value={regionId} onChange={(e) => update('regionId', e.target.value)}>
              <option value="">All regions</option>
              {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </Field>
          <Field label="District">
            <Select value={districtId} onChange={(e) => update('districtId', e.target.value)} disabled={!regionId}>
              <option value="">{regionId ? 'All districts' : 'Select a region first'}</option>
              {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </Field>
          <Field label="Facility type">
            <Select value={type} onChange={(e) => update('type', e.target.value)}>
              <option value="">All types</option>
              {FACILITY_TYPES.map((t) => <option key={t} value={t}>{FACILITY_TYPE_LABELS[t]}</option>)}
            </Select>
          </Field>
          <Field label="Ownership">
            <Select value={ownership} onChange={(e) => update('ownership', e.target.value)}>
              <option value="">All ownerships</option>
              {OWNERSHIPS.map((o) => <option key={o} value={o}>{titleCase(o)}</option>)}
            </Select>
          </Field>
        </div>
      </Card>

      <p className="mt-6 text-sm text-slate-500">
        <strong className="text-g-ink">{data?.total ?? '—'}</strong> facilities found
        {regionName && <> in <strong className="text-g-ink">{regionName}</strong></>}
      </p>

      <div className="mt-4">
        {loading ? (
          <Spinner label="Searching the facility registry…" />
        ) : data && data.items.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.items.map((f) => (
              <Link key={f.id} to={`/facilities/${f.id}`} className="card-hover flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-g-red/10 text-g-red">
                    <Icon name="building" className="h-5 w-5" />
                  </div>
                  <Badge tone={f.type === 'TEACHING_HOSPITAL' ? 'navy' : f.level === 'TERTIARY' ? 'red' : 'green'}>
                    {FACILITY_TYPE_LABELS[f.type] ?? titleCase(f.type)}
                  </Badge>
                </div>
                <h3 className="mt-3 font-bold text-g-ink">{f.name.replace(' (DEMO)', '')}</h3>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                  <Icon name="pin" className="h-3.5 w-3.5" /> {f.district?.name}, {f.region?.name}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {f.services.slice(0, 4).map((s) => (
                    <span key={s} className="rounded-md bg-g-mist px-2 py-0.5 text-[10px] font-semibold text-slate-600">{SERVICE_LABELS[s] ?? titleCase(s)}</span>
                  ))}
                  {f.services.length > 4 && <span className="text-[10px] font-semibold text-slate-400">+{f.services.length - 4} more</span>}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Icon name="phone" className="h-3.5 w-3.5" />{f.telephone ?? '—'}</span>
                  <span className="font-semibold text-g-red">View profile →</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState icon="search" title="No facilities match your filters" message="Try widening the search or clearing some filters." />
        )}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => update('page', String(page - 1))}
            className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-g-ink transition hover:border-g-red disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="px-3 text-sm text-slate-500">Page {data.page} of {data.pages}</span>
          <button
            disabled={page >= data.pages}
            onClick={() => update('page', String(page + 1))}
            className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-g-ink transition hover:border-g-red disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
