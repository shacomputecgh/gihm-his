import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { api } from '../../lib/api';
import type { Asset, AssetSummary } from '../../types';
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Select, Spinner, useToast } from '../../components/ui';
import { cedis, fmtDate, titleCase, todayIso } from '../../lib/format';
import { useAuth } from '../../lib/auth';

const CATEGORY_TONE: Record<string, 'navy' | 'green' | 'gold' | 'blue' | 'gray'> = {
  BUILDING: 'navy',
  VEHICLE: 'blue',
  IT: 'green',
  MEDICAL: 'gold',
  PLANT: 'gray',
  FURNITURE: 'gold',
  OTHER: 'gray',
};

const CATEGORIES = ['ALL', 'BUILDING', 'VEHICLE', 'IT', 'MEDICAL', 'PLANT', 'FURNITURE', 'OTHER'];
const STATUS_TONE: Record<string, 'green' | 'gold' | 'red' | 'gray'> = { ACTIVE: 'green', IN_STORAGE: 'gold', DISPOSED: 'red' };

export default function Assets() {
  const { user } = useAuth();
  const canManage = !!user?.permissions.includes('manage_facility');
  const canView = canManage || !!user?.permissions.includes('view_financial');
  const toast = useToast();

  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [summary, setSummary] = useState<AssetSummary | null>(null);
  const [category, setCategory] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [busyId, setBusyId] = useState<string | null>(null);

  const [form, setForm] = useState({
    assetNumber: '',
    name: '',
    category: 'IT',
    purchaseCost: '',
    salvageValue: '',
    usefulLifeYears: '5',
    acquisitionDate: todayIso(),
    location: '',
    custodianName: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    description: '',
  });

  const load = useCallback(async () => {
    const q = new URLSearchParams();
    if (category !== 'ALL') q.set('category', category);
    if (status !== 'ALL') q.set('status', status);
    const res = await api<{ assets: Asset[]; summary: { bookValue: number; replacementCost: number; annualDepreciation: number; disposed: number; total: number } }>(`/assets?${q.toString()}`);
    setAssets(res.assets);
  }, [category, status]);

  const loadSummary = useCallback(async () => {
    setSummary(await api<AssetSummary>('/assets/summary'));
  }, []);

  useEffect(() => {
    if (!canView) return;
    void load().catch(() => undefined);
    void loadSummary().catch(() => undefined);
  }, [load, loadSummary, canView]);

  async function createAsset(e: FormEvent) {
    e.preventDefault();
    if (!user?.facilityId) {
      toast('Your account is not linked to a facility — asset registration requires one', 'error');
      return;
    }
    setBusyId('new');
    try {
      await api('/assets', {
        method: 'POST',
        body: {
          facilityId: user.facilityId,
          assetNumber: form.assetNumber,
          name: form.name,
          category: form.category,
          purchaseCost: Number(form.purchaseCost),
          salvageValue: form.salvageValue ? Number(form.salvageValue) : 0,
          usefulLifeYears: Number(form.usefulLifeYears) || 5,
          acquisitionDate: form.acquisitionDate || undefined,
          location: form.location || undefined,
          custodianName: form.custodianName || undefined,
          manufacturer: form.manufacturer || undefined,
          model: form.model || undefined,
          serialNumber: form.serialNumber || undefined,
          description: form.description || undefined,
        },
      });
      toast('Asset registered', 'success');
      setForm({ assetNumber: '', name: '', category: 'IT', purchaseCost: '', salvageValue: '', usefulLifeYears: '5', acquisitionDate: todayIso(), location: '', custodianName: '', manufacturer: '', model: '', serialNumber: '', description: '' });
      void load();
      void loadSummary();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Registration failed', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function disposeAsset(a: Asset) {
    const note = window.prompt(`Dispose of “${a.name}”? Enter a reason (optional):`, '');
    if (note === null) return; // cancelled
    setBusyId(a.id);
    try {
      await api(`/assets/${a.id}/dispose`, { method: 'POST', body: { note: note || undefined } });
      toast('Asset written off', 'success');
      void load();
      void loadSummary();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Disposal failed', 'error');
    } finally {
      setBusyId(null);
    }
  }

  const statCards = useMemo(() => {
    const accumulated = summary ? summary.totals.replacementCost - summary.totals.bookValue : 0;
    return [
      { label: 'Replacement cost', value: cedis(summary?.totals.replacementCost), sub: `${summary?.totals.assets ?? 0} assets in register`, tone: 'navy' as const },
      { label: 'Book value', value: cedis(summary?.totals.bookValue), sub: 'after straight-line depreciation', tone: 'green' as const },
      { label: 'Annual depreciation', value: cedis(summary?.totals.annualDepreciation), sub: `${cedis(accumulated)} accumulated to date`, tone: 'gold' as const },
      { label: 'Written off', value: String(summary?.totals.disposed ?? 0), sub: 'assets written off', tone: 'red' as const },
    ];
  }, [summary]);

  if (!canView) return <EmptyState icon="building" title="No access" message="Fixed assets require the View financial records or Manage facility permission." />;

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
          title="Add New Asset"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Fixed Assets" subtitle="Facility register — buildings, vehicles, IT, plant and furniture with straight-line depreciation." action={canManage ? <Badge tone="navy">{assets?.length ?? 0} in view</Badge> : undefined} />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label} className="!p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{s.label}</p>
            <p className={`mt-2 text-2xl font-bold tabular-nums ${s.tone === 'red' ? 'text-g-red' : 'text-g-ink'}`}>{s.value}</p>
            <p className="mt-1 text-xs text-slate-400">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* Book value by category */}
      {summary && summary.byCategory.length > 0 && (
        <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {summary.byCategory.map((c) => (
            <div key={c.category} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="font-bold text-g-ink">{titleCase(c.category)}</p>
                <Badge tone={CATEGORY_TONE[c.category] ?? 'gray'}>{c.count}</Badge>
              </div>
              <p className="mt-2 text-lg font-bold tabular-nums text-g-ink">{cedis(c.bookValue)}</p>
              <p className="text-xs text-slate-400">of {cedis(c.replacementCost)} replacement</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-g-navy" style={{ width: `${c.replacementCost > 0 ? Math.max(4, Math.round((c.bookValue / c.replacementCost) * 100)) : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters + table */}
      <div className="mt-5 mb-4 flex flex-wrap items-center gap-3">
        <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-44">
          {CATEGORIES.map((c) => <option key={c} value={c}>{c === 'ALL' ? 'All categories' : titleCase(c)}</option>)}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
          {['ALL', 'ACTIVE', 'IN_STORAGE', 'DISPOSED'].map((s) => <option key={s} value={s}>{s === 'ALL' ? 'All statuses' : titleCase(s)}</option>)}
        </Select>
      </div>

      <Card pad={false}>
        {!assets ? (
          <div className="p-10"><Spinner /></div>
        ) : assets.length === 0 ? (
          <EmptyState icon="building" title="No assets" message="No fixed assets match this filter — register one to start the register." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
                  {['Asset', 'Acquired', 'Purchase cost', 'Life', 'Current value', 'Depreciation', 'Status', canManage ? '' : null].filter(Boolean).map((h) => <th key={String(h)} className="px-5 py-3 font-semibold">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {assets.map((a) => (
                  <tr key={a.id} className="hover:bg-g-mist/40">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-g-ink">{a.name}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                        <span className="font-mono">{a.assetNumber}</span>
                        <Badge tone={CATEGORY_TONE[a.category] ?? 'gray'}>{titleCase(a.category)}</Badge>
                      </p>
                      {(a.custodianName || a.location) && <p className="mt-0.5 text-xs text-slate-400">{a.custodianName ?? '—'}{a.location ? ` · ${a.location}` : ''}</p>}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{fmtDate(a.acquisitionDate)}</td>
                    <td className="px-5 py-3 font-semibold text-g-ink">{cedis(a.purchaseCost)}</td>
                    <td className="px-5 py-3 text-slate-500">{a.usefulLifeYears} yrs</td>
                    <td className="px-5 py-3">
                      <p className={`font-bold tabular-nums ${a.status === 'DISPOSED' ? 'text-slate-400' : 'text-g-green'}`}>{cedis(a.currentValue)}</p>
                      <p className="text-xs text-slate-400">salvage {cedis(a.salvageValue)}</p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                          <div className={`h-full rounded-full ${a.depreciationPct >= 90 ? 'bg-g-red' : a.depreciationPct >= 60 ? 'bg-g-gold' : 'bg-g-green'}`} style={{ width: `${a.depreciationPct}%` }} />
                        </div>
                        <span className="text-xs tabular-nums text-slate-500">{a.depreciationPct}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={STATUS_TONE[a.status] ?? 'gray'}>{titleCase(a.status)}</Badge>
                      {a.disposalNote && <p className="mt-1 max-w-[180px] text-xs text-slate-400">“{a.disposalNote}”</p>}
                    </td>
                    {canManage && (
                      <td className="px-5 py-3">
                        {a.status !== 'DISPOSED' && (
                          <button onClick={() => void disposeAsset(a)} disabled={busyId === a.id} className="cursor-pointer rounded-md border border-g-red/30 bg-g-red/10 px-2.5 py-1 text-xs font-bold text-g-red transition hover:bg-g-red hover:text-white">
                            Dispose
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Register form */}
      {canManage && user?.facilityId && (
        <Card title="Register an asset" subtitle="Facility fixed asset — book value is computed automatically from purchase cost, life and salvage value." className="mt-5">
          <form onSubmit={createAsset} className="grid gap-3 md:grid-cols-4">
            <Field label="Asset number"><Input required value={form.assetNumber} onChange={(e) => setForm({ ...form, assetNumber: e.target.value })} placeholder="KBTH-0031" /></Field>
            <Field label="Name"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ward Lift 3" /></Field>
            <Field label="Category">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.filter((c) => c !== 'ALL').map((c) => <option key={c} value={c}>{titleCase(c)}</option>)}
              </Select>
            </Field>
            <Field label="Acquired"><Input type="date" value={form.acquisitionDate} onChange={(e) => setForm({ ...form, acquisitionDate: e.target.value })} /></Field>
            <Field label="Purchase cost (GH₵)"><Input required type="number" min={1} step="0.01" value={form.purchaseCost} onChange={(e) => setForm({ ...form, purchaseCost: e.target.value })} placeholder="e.g. 240000" /></Field>
            <Field label="Salvage value (GH₵)"><Input type="number" min={0} step="0.01" value={form.salvageValue} onChange={(e) => setForm({ ...form, salvageValue: e.target.value })} placeholder="0" /></Field>
            <Field label="Useful life (years)"><Input type="number" min={1} max={100} value={form.usefulLifeYears} onChange={(e) => setForm({ ...form, usefulLifeYears: e.target.value })} /></Field>
            <Field label="Location"><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Block A, 2nd Floor" /></Field>
            <Field label="Manufacturer"><Input value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} placeholder="e.g. Toyota" /></Field>
            <Field label="Model"><Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="e.g. Hiace" /></Field>
            <Field label="Serial number"><Input value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} /></Field>
            <Field label="Custodian"><Input value={form.custodianName} onChange={(e) => setForm({ ...form, custodianName: e.target.value })} placeholder="Dept / officer" /></Field>
            <Field label="Description" className="md:col-span-3"><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" /></Field>
            <div className="flex items-end justify-end md:col-span-1"><Button type="submit" loading={busyId === 'new'} icon="plus">Register</Button></div>
          </form>
        </Card>
      )}
    </div>
  );
}
