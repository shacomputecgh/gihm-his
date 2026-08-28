import { useCallback, useEffect, useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { api } from '../../lib/api';
import type { DirectorateNode, DirectorateOverview } from '../../types';
import { Badge, Card, EmptyState, PageHeader, Spinner } from '../../components/ui';
import ImmunizationCoverage from '../../components/ImmunizationCoverage';
import { cedis, titleCase } from '../../lib/format';
import { cn } from '../../components/ui';

const NODE_TONE: Record<string, 'red' | 'navy' | 'gold' | 'green' | 'gray' | 'blue'> = {
  REGION: 'navy',
  DISTRICT: 'gold',
  FACILITY: 'green',
};

// Facility nodes carry their real facility type (CLINIC, TEACHING_HOSPITAL, …)
// rather than 'FACILITY', so the drillable set must be explicit: only REGION
// and DISTRICT nodes drill deeper.
const drillable = (n: DirectorateNode) => n.type === 'REGION' || n.type === 'DISTRICT';

function MetricCell({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="min-w-0 rounded-lg bg-g-mist px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-g-ink tabular-nums">{value}</p>
    </div>
  );
}

export default function Directorate() {
  const [data, setData] = useState<DirectorateOverview | null>(null);
  const [regionId, setRegionId] = useState<string | undefined>(undefined);
  const [districtId, setDistrictId] = useState<string | undefined>(undefined);
  // Breadcrumb/heading context. On the default (non-drilled) view these are
  // adopted from the API's scope names so a district user sees "Kumasi
  // Metropolitan" rather than a bare "Ghana" crumb + "Facility overview";
  // drilling sets them from the clicked node instead.
  const [regionName, setRegionName] = useState<string | undefined>(undefined);
  const [districtName, setDistrictName] = useState<string | undefined>(undefined);
  const [facilityName, setFacilityName] = useState<string | undefined>(undefined);

  const load = useCallback(async () => {
    const q = new URLSearchParams();
    if (regionId) q.set('regionId', regionId);
    if (districtId) q.set('districtId', districtId);
    const r = await api<DirectorateOverview>(`/directorate${q.toString() ? `?${q}` : ''}`);
    setData(r);
    // Only the undrilled default view adopts the caller's scope context — a
    // drilled view keeps the names set from the clicked node.
    if (!regionId && !districtId) {
      setRegionName(r.regionName ?? undefined);
      setDistrictName(r.districtName ?? undefined);
      setFacilityName(r.facilityName ?? undefined);
    }
  }, [regionId, districtId]);

  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  function drill(node: DirectorateNode) {
    if (node.type === 'REGION') {
      setRegionId(node.id);
      setRegionName(node.name);
      setDistrictId(undefined);
      setDistrictName(undefined);
      setFacilityName(undefined);
    } else if (node.type === 'DISTRICT') {
      setDistrictId(node.id);
      setDistrictName(node.name);
      setFacilityName(undefined);
    }
    // FACILITY nodes are leaves — no drill.
  }

  function reset() {
    setRegionId(undefined);
    setRegionName(undefined);
    setDistrictId(undefined);
    setDistrictName(undefined);
    setFacilityName(undefined);
  }

  const totalFacilities = data?.nodes.reduce((a, n) => a + n.metrics.facilities, 0) ?? 0;
  const totalPatients = data?.nodes.reduce((a, n) => a + n.metrics.patients, 0) ?? 0;
  const totalEncounters = data?.nodes.reduce((a, n) => a + n.metrics.encounters, 0) ?? 0;
  const totalAdmissions = data?.nodes.reduce((a, n) => a + n.metrics.admissions, 0) ?? 0;
  const totalRevenue = data?.nodes.reduce((a, n) => a + n.metrics.revenue, 0) ?? 0;

  const breadcrumb = ['Ghana'];
  if (regionName) breadcrumb.push(regionName);
  if (districtName) breadcrumb.push(districtName);
  if (facilityName && !districtName && !regionName) breadcrumb.push(facilityName);

  const heading = data?.level === 'NATIONAL' ? 'National overview' : data?.level === 'REGIONAL' ? `${regionName ?? 'Region'} overview` : data?.level === 'DISTRICT' ? `${districtName ?? regionName ?? 'District'} overview` : `${districtName ?? facilityName ?? 'Facility'} overview`;

  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);
  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">
          {showAdd ? "\u2715 Cancel" : "+ Add New"}
        </button>
      </div>
      {showAdd && (
        <AddNewForm
          title="Add New Directorate"
          fields={[{"name":"name","label":"Directorate Name","type":"text","required":true},{"name":"head","label":"Head of Directorate","type":"text"},{"name":"departments","label":"Departments","type":"textarea","placeholder":"List departments separated by commas"},{"name":"budget","label":"Annual Budget (GH₵)","type":"number"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader
        title="Health directorate"
        subtitle="Aggregated service-delivery indicators — drill down from region to district to facility. No patient-identifiable data at aggregate levels."
      />

      {!data ? (
        <Spinner label="Loading directorate aggregates…" />
      ) : (
        <>
          {/* Breadcrumb / drill nav */}
          <div className="mb-4 flex flex-wrap items-center gap-1.5 text-sm">
            {breadcrumb.map((crumb, i) => (
              <span key={crumb} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-slate-300">→</span>}
                {i < breadcrumb.length - 1 ? (
                  <button onClick={reset} className="cursor-pointer rounded-md px-1.5 py-0.5 font-semibold text-g-red transition hover:bg-g-red/10">
                    {crumb}
                  </button>
                ) : (
                  <span className="font-bold text-g-ink">{crumb}</span>
                )}
              </span>
            ))}
            {(regionId || districtId) && (
              <Badge tone="gray" className="ml-2">{titleCase(data.level)} level</Badge>
            )}
          </div>

          {/* Totals strip */}
          <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-5">
            <Card pad={false} className="p-4"><p className="text-xs text-slate-500">Facilities</p><p className="mt-1 text-2xl font-bold text-g-ink">{totalFacilities}</p></Card>
            <Card pad={false} className="p-4"><p className="text-xs text-slate-500">Patients on file</p><p className="mt-1 text-2xl font-bold text-g-ink">{totalPatients}</p></Card>
            <Card pad={false} className="p-4"><p className="text-xs text-slate-500">Encounters</p><p className="mt-1 text-2xl font-bold text-g-ink">{totalEncounters}</p></Card>
            <Card pad={false} className="p-4"><p className="text-xs text-slate-500">Active admissions</p><p className="mt-1 text-2xl font-bold text-g-red">{totalAdmissions}</p></Card>
            <Card pad={false} className="p-4"><p className="text-xs text-slate-500">Revenue collected</p><p className="mt-1 text-2xl font-bold text-g-green">{cedis(totalRevenue)}</p></Card>
          </div>

          {/* Immunization coverage (scoped to the current drill level) */}
          <Card title="Immunization coverage" subtitle="Dose coverage in scope — PENTA1→PENTA3 dropout and fully-immunized rate. No patient-identifiable data." className="mb-5">
            <ImmunizationCoverage compact />
          </Card>

          <h3 className="mb-3 text-sm font-bold text-g-ink">{heading}</h3>

          {data.nodes.length === 0 ? (
            <EmptyState icon="globe" title="No nodes in scope" message="There are no regions, districts or facilities within your authorized scope yet." />
          ) : (
            <div className="space-y-3">
              {data.nodes.map((n) => (
                <Card key={n.id} pad={false}>
                  <button
                    onClick={() => drill(n)}
                    disabled={!drillable(n)}
                    className={cn(
                      'flex w-full flex-wrap items-center justify-between gap-4 px-5 py-4 text-left transition',
                      drillable(n) && 'cursor-pointer hover:bg-g-mist/60',
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-g-ink">{n.name}</span>
                          {n.code && <span className="font-mono text-xs text-slate-400">{n.code}</span>}
                          <Badge tone={NODE_TONE[n.type] ?? 'gray'}>{titleCase(n.type)}</Badge>
                          {drillable(n) && <Badge tone="blue">↓ drill down</Badge>}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {n.metrics.facilities} facilities · {n.metrics.patients} patients · {n.recentEncounters} encounters in last 30 days
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                      <MetricCell label="Encounters" value={n.metrics.encounters} />
                      <MetricCell label="Admissions" value={n.metrics.admissions} />
                      <MetricCell label="Lab pending" value={n.metrics.labPending} />
                      <MetricCell label="Rx active" value={n.metrics.prescriptionsActive} />
                      <MetricCell label="Immunizations" value={n.metrics.immunizations} />
                      <MetricCell label="Revenue" value={cedis(n.metrics.revenue)} />
                    </div>
                  </button>
                </Card>
              ))}
            </div>
          )}

          <p className="mt-6 text-xs text-slate-400">
            Aggregates are computed from authorized records within your role scope ({data.level}). Drill-down respects organizational boundaries (spec §7, §59).
          </p>
        </>
      )}
    </div>
  );
}
