import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import type { PatientLocationEntry, LocationTrackingSummary } from '../types';
import { Badge, Button, Card, EmptyState, Field, Input, Select, Spinner, useToast } from './ui';
import { fmtDate, titleCase } from '../lib/format';

const STATUS_TONE: Record<string, 'green' | 'gold' | 'red' | 'navy' | 'gray'> = {
  ADMITTED: 'green', TRANSFERRED: 'gold', DISCHARGED: 'gray', ISOLATED: 'red',
};

export default function PatientLocationTracker() {
  const toast = useToast();
  const [locations, setLocations] = useState<PatientLocationEntry[] | null>(null);
  const [summary, setSummary] = useState<LocationTrackingSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState({ ward: '', status: '', isolation: '' });

  // Transfer form
  const [transferForm, setTransferForm] = useState({
    patientId: '', fromWard: '', toWard: '', toBed: '', reason: '', isolationRequired: false,
  });

  const load = useCallback(async () => {
    const q = new URLSearchParams();
    if (filter.ward) q.set('ward', filter.ward);
    if (filter.status) q.set('status', filter.status);
    if (filter.isolation) q.set('isolation', filter.isolation);
    const [locRes, sumRes] = await Promise.all([
      api<{ items: PatientLocationEntry[] }>(`/surveillance/locations?${q.toString()}`),
      api<LocationTrackingSummary>('/surveillance/locations/summary'),
    ]);
    setLocations(locRes.items);
    setSummary(sumRes);
  }, [filter]);

  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  const refresh = useCallback(() => {
    void load().catch(() => undefined);
  }, [load]);

  async function transferPatient(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/surveillance/locations/transfer', {
        method: 'POST',
        body: {
          patientId: transferForm.patientId,
          fromWard: transferForm.fromWard,
          toWard: transferForm.toWard,
          toBed: transferForm.toBed || undefined,
          reason: transferForm.reason || undefined,
          isolationRequired: transferForm.isolationRequired,
        },
      });
      toast('Patient transferred', 'success');
      setTransferForm({ patientId: '', fromWard: '', toWard: '', toBed: '', reason: '', isolationRequired: false });
      refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Transfer failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  const isolatedPatients = useMemo(() => locations?.filter((l) => l.isolationRequired) ?? [], [locations]);

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      {summary && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="!p-4">
            <p className="text-[10px] font-bold uppercase text-slate-400">Currently in hospital</p>
            <p className="mt-1 text-xl font-bold text-g-ink">{summary.currentInHospital}</p>
          </Card>
          <Card className="!p-4">
            <p className="text-[10px] font-bold uppercase text-g-red">In isolation</p>
            <p className="mt-1 text-xl font-bold text-g-red">{summary.isolated}</p>
          </Card>
          <Card className="!p-4">
            <p className="text-[10px] font-bold uppercase text-g-gold">Transferred</p>
            <p className="mt-1 text-xl font-bold text-g-gold">{summary.transferred}</p>
          </Card>
          <Card className="!p-4">
            <p className="text-[10px] font-bold uppercase text-g-green">Discharged</p>
            <p className="mt-1 text-xl font-bold text-g-green">{summary.discharged}</p>
          </Card>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Location list */}
        <Card title="Patient locations" subtitle="Current ward assignments and isolation status" className="lg:col-span-2">
          <div className="mb-3 flex flex-wrap gap-2">
            <Input
              value={filter.ward}
              onChange={(e) => setFilter({ ...filter, ward: e.target.value })}
              placeholder="Filter by ward…"
              className="w-48"
            />
            <Select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} className="w-40">
              <option value="">All statuses</option>
              {['ADMITTED', 'TRANSFERRED', 'DISCHARGED', 'ISOLATED'].map((s) => (
                <option key={s} value={s}>{titleCase(s)}</option>
              ))}
            </Select>
            <Select value={filter.isolation} onChange={(e) => setFilter({ ...filter, isolation: e.target.value })} className="w-40">
              <option value="">All</option>
              <option value="true">Isolation required</option>
              <option value="false">No isolation</option>
            </Select>
          </div>

          {!locations ? (
            <div className="py-8"><Spinner /></div>
          ) : locations.length === 0 ? (
            <EmptyState icon="building" title="No patients tracked" message="Patient locations will appear here when admissions are linked to surveillance cases." />
          ) : (
            <div className="space-y-2">
              {locations.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 transition hover:shadow-sm">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-g-ink">{l.patientName}</p>
                      <Badge tone={STATUS_TONE[l.status] ?? 'gray'}>{titleCase(l.status)}</Badge>
                      {l.isolationRequired && <Badge tone="red">⚠️ ISOLATION</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {l.mrn} · Ward: {l.ward}{l.bed ? ` · Bed: ${l.bed}` : ''}
                      {l.department && ` · ${l.department}`}
                      {l.unit && ` · ${l.unit.name}`}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Admitted {fmtDate(l.admittedAt)}
                      {l.dischargedAt && ` · Discharged ${fmtDate(l.dischargedAt)}`}
                      {l.phone && ` · ${l.phone}`}
                    </p>
                  </div>
                  {l.isolationRequired && (
                    <Button
                      size="sm" variant="outline"
                      onClick={() => setTransferForm({ ...transferForm, patientId: l.patientId, fromWard: l.ward })}
                    >
                      Transfer
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Sidebar: Transfer + Ward summary */}
        <div className="space-y-5">
          <Card title="Transfer patient" subtitle="Move a patient between wards">
            <form onSubmit={transferPatient} className="space-y-3">
              <Field label="Patient ID">
                <Input value={transferForm.patientId} onChange={(e) => setTransferForm({ ...transferForm, patientId: e.target.value })} placeholder="Patient ID" />
              </Field>
              <Field label="From ward">
                <Input value={transferForm.fromWard} onChange={(e) => setTransferForm({ ...transferForm, fromWard: e.target.value })} placeholder="Current ward" />
              </Field>
              <Field label="To ward">
                <Input value={transferForm.toWard} onChange={(e) => setTransferForm({ ...transferForm, toWard: e.target.value })} placeholder="Destination ward" />
              </Field>
              <Field label="Bed (optional)">
                <Input value={transferForm.toBed} onChange={(e) => setTransferForm({ ...transferForm, toBed: e.target.value })} placeholder="Bed number" />
              </Field>
              <Field label="Reason">
                <Input value={transferForm.reason} onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })} placeholder="Transfer reason" />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={transferForm.isolationRequired}
                  onChange={(e) => setTransferForm({ ...transferForm, isolationRequired: e.target.checked })}
                  className="h-4 w-4 rounded accent-g-red"
                />
                Mark as isolation transfer
              </label>
              <Button type="submit" loading={busy} className="w-full">Transfer patient</Button>
            </form>
          </Card>

          {/* Ward breakdown */}
          {summary && summary.byWard.length > 0 && (
            <Card title="By ward" subtitle="Patients and isolation counts">
              <div className="space-y-2">
                {summary.byWard.map((w) => (
                  <div key={w.ward} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-g-ink">{w.ward}</span>
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums text-slate-500">{w.count}</span>
                      {w.isolated > 0 && <Badge tone="red">{w.isolated} iso</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recent moves */}
          {summary && summary.recentMoves.length > 0 && (
            <Card title="Recent moves" subtitle="Latest ward transfers">
              <div className="space-y-2">
                {summary.recentMoves.map((m, i) => (
                  <div key={i} className="text-xs text-slate-500">
                    <p className="font-medium text-g-ink">{m.patientName}</p>
                    <p>{m.from} → {m.to} · {fmtDate(m.at)}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Isolation alert */}
          {isolatedPatients.length > 0 && (
            <Card className="border-g-red/30 bg-g-red/5">
              <p className="text-sm font-bold text-g-red">⚠️ {isolatedPatients.length} patient(s) in isolation</p>
              <p className="mt-1 text-xs text-slate-500">
                {isolatedPatients.map((p) => p.patientName).join(', ')}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
