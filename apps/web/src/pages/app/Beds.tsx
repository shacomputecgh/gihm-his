import { useCallback, useEffect, useState, type FormEvent } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { api } from '../../lib/api';
import type { Bed, Patient } from '../../types';
import { Badge, Button, EmptyState, Input, PageHeader, Select, Spinner, useToast } from '../../components/ui';
import { titleCase } from '../../lib/format';
import { cn } from '../../components/ui';

const BED_TONE: Record<string, string> = {
  AVAILABLE: 'border-g-green/40 bg-g-green/10 text-g-green',
  OCCUPIED: 'border-g-navy/40 bg-g-navy/10 text-g-navy',
  RESERVED: 'border-g-gold/50 bg-g-gold/20 text-yellow-800',
  CLEANING: 'border-sky-300 bg-sky-50 text-sky-700',
  MAINTENANCE: 'border-slate-300 bg-slate-100 text-slate-500',
  ISOLATION: 'border-g-red/40 bg-g-red/10 text-g-red',
};

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  RESERVED: 'Reserved',
  CLEANING: 'Cleaning',
  MAINTENANCE: 'Maintenance',
  ISOLATION: 'Isolation',
};

export default function Beds() {
  const [ward, setWard] = useState<string>('ALL');
  const [unitId, setUnitId] = useState<string>('ALL');
  const [beds, setBeds] = useState<Bed[] | null>(null);
  const [wards, setWards] = useState<string[]>([]);
  const [units, setUnits] = useState<Bed['unit'][]>([]);
  const [assignFor, setAssignFor] = useState<Bed | null>(null);
  const [patientQ, setPatientQ] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (ward !== 'ALL') params.set('ward', ward);
    if (unitId !== 'ALL') params.set('unitId', unitId);
    const q = params.toString();
    const res = await api<{ items: Bed[]; wards: string[]; units: Bed['unit'][] }>(`/beds${q ? `?${q}` : ''}`);
    setBeds(res.items);
    setWards(res.wards);
    setUnits(res.units ?? []);
  }, [ward, unitId]);

  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  async function searchPatients(q: string) {
    setPatientQ(q);
    if (!q.trim()) { setPatientResults([]); return; }
    const r = await api<{ items: Patient[] }>(`/patients?q=${encodeURIComponent(q)}&pageSize=8`);
    setPatientResults(r.items);
  }

  async function setStatus(bed: Bed, status: string) {
    setBusyId(bed.id);
    try {
      await api(`/beds/${bed.id}/status`, { method: 'POST', body: { status } });
      toast(`Bed ${bed.bedNumber} → ${titleCase(status)}`, 'success');
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function assign(e: FormEvent) {
    e.preventDefault();
    if (!assignFor) return;
    const patient = patientResults.find((p) => p.id === patientQ) ?? null;
    if (!patient) { toast('Select a patient from the results', 'error'); return; }
    setBusyId(assignFor.id);
    try {
      await api(`/beds/${assignFor.id}/assign`, { method: 'POST', body: { patientId: patient.id, reason: 'Bed assignment' } });
      toast(`Assigned to ${patient.fullName}`, 'success');
      setAssignFor(null);
      setPatientQ('');
      setPatientResults([]);
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setBusyId(null);
    }
  }

  const visible = beds ?? [];
  const summary = wards.map((w) => ({
    ward: w,
    unitName: visible.find((b) => b.ward === w)?.unit?.name ?? null,
    departmentName: visible.find((b) => b.ward === w)?.unit?.department?.name ?? null,
    total: visible.filter((b) => b.ward === w).length,
    occupied: visible.filter((b) => b.ward === w && b.status === 'OCCUPIED').length,
    available: visible.filter((b) => b.ward === w && (b.status === 'AVAILABLE' || b.status === 'CLEANING')).length,
  }));

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
          title="Add New Bed"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Bed management" subtitle="Ward bed board — occupancy, cleaning, maintenance and isolation." />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Select value={unitId} onChange={(e) => { setUnitId(e.target.value); setWard('ALL'); }} className="w-64">
          <option value="ALL">All units</option>
          {units.map((u) => <option key={u!.id} value={u!.id}>{u!.name}</option>)}
        </Select>
        <Select value={ward} onChange={(e) => { setWard(e.target.value); setUnitId('ALL'); }} className="w-64">
          <option value="ALL">All wards</option>
          {wards.map((w) => <option key={w} value={w}>{w}</option>)}
        </Select>
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
          {Object.entries(STATUS_LABEL).map(([k, v]) => <span key={k} className="inline-flex items-center gap-1"><span className={cn('h-2.5 w-2.5 rounded-full border', BED_TONE[k]?.split(' ')[0])} />{v}</span>)}
        </div>
      </div>

      {!beds ? (
        <Spinner />
      ) : visible.length === 0 ? (
        <EmptyState icon="bed" title="No beds in this ward" message="Select another ward or view all wards." />
      ) : (
        <div className="space-y-6">
          {summary.map((s) => (
            <div key={s.ward}>
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-g-ink">{s.ward}</h3>
                  {(s.unitName || s.departmentName) && (
                    <p className="text-[11px] text-slate-400">
                      {s.departmentName ?? ''}{s.departmentName && s.unitName ? ' · ' : ''}{s.unitName ?? ''}
                    </p>
                  )}
                </div>
                <span className="text-xs text-slate-400">{s.occupied}/{s.total} occupied · {s.available} available</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {visible.filter((b) => b.ward === s.ward).map((b) => (
                  <div key={b.id} className={cn('rounded-xl border p-3 transition hover:shadow-md', BED_TONE[b.status] ?? 'border-slate-200')}>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold">{b.bedNumber}</span>
                      <Badge tone={b.status === 'AVAILABLE' ? 'green' : b.status === 'OCCUPIED' ? 'navy' : b.status === 'CLEANING' ? 'blue' : b.status === 'MAINTENANCE' ? 'gray' : 'red'}>{STATUS_LABEL[b.status] ?? b.status}</Badge>
                    </div>
                    {b.patient ? (
                      <div className="mt-2">
                        <p className="truncate text-xs font-semibold text-g-ink">{b.patient.fullName}</p>
                        <p className="font-mono text-[10px] text-slate-400">{b.patient.mrn}</p>
                      </div>
                    ) : (
                      <p className="mt-2 text-[11px] text-slate-400">{b.status === 'OCCUPIED' ? 'Unassigned' : '—'}</p>
                    )}
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {b.status !== 'OCCUPIED' && (
                        <button onClick={() => setAssignFor(b)} disabled={busyId === b.id} className="cursor-pointer rounded-md bg-g-navy px-2 py-1 text-[10px] font-bold text-white transition hover:bg-g-navy-2">
                          Assign
                        </button>
                      )}
                      {b.status === 'OCCUPIED' && (
                        <button onClick={() => void setStatus(b, 'AVAILABLE')} disabled={busyId === b.id} className="cursor-pointer rounded-md bg-g-red/10 px-2 py-1 text-[10px] font-bold text-g-red transition hover:bg-g-red hover:text-white">
                          Free
                        </button>
                      )}
                      {b.status === 'AVAILABLE' && (
                        <button onClick={() => void setStatus(b, 'CLEANING')} disabled={busyId === b.id} className="cursor-pointer rounded-md bg-sky-100 px-2 py-1 text-[10px] font-bold text-sky-700 transition hover:bg-sky-200">
                          Clean
                        </button>
                      )}
                      {(b.status === 'AVAILABLE' || b.status === 'CLEANING') && (
                        <button onClick={() => void setStatus(b, 'MAINTENANCE')} disabled={busyId === b.id} className="cursor-pointer rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 transition hover:bg-slate-200">
                          Maint
                        </button>
                      )}
                      {(b.status === 'AVAILABLE' || b.status === 'CLEANING') && (
                        <button onClick={() => void setStatus(b, 'ISOLATION')} disabled={busyId === b.id} className="cursor-pointer rounded-md bg-g-red/10 px-2 py-1 text-[10px] font-bold text-g-red transition hover:bg-g-red hover:text-white">
                          Isolate
                        </button>
                      )}
                      {b.status !== 'AVAILABLE' && b.status !== 'OCCUPIED' && (
                        <button onClick={() => void setStatus(b, 'AVAILABLE')} disabled={busyId === b.id} className="cursor-pointer rounded-md bg-g-green/10 px-2 py-1 text-[10px] font-bold text-g-green transition hover:bg-g-green hover:text-white">
                          Ready
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {assignFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setAssignFor(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-g-ink">Assign patient to bed {assignFor.bedNumber} ({assignFor.ward})</h3>
            <form onSubmit={assign} className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-g-ink">Search patient</label>
                <Input value={patientQ} onChange={(e) => void searchPatients(e.target.value)} placeholder="Name or MRN…" autoFocus />
                {patientResults.length > 0 && (
                  <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                    {patientResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setPatientQ(p.id); }}
                        className={cn('block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-g-mist', patientQ === p.id && 'bg-g-mist')}
                      >
                        <span className="font-semibold text-g-ink">{p.fullName}</span>
                        <span className="font-mono text-xs text-slate-400"> {p.mrn}</span>
                      </button>
                    ))}
                  </div>
                )}
                {patientQ && <p className="mt-1 text-[11px] text-slate-400">Selected: {patientResults.find((p) => p.id === patientQ)?.fullName ?? patientQ}</p>}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setAssignFor(null)}>Cancel</Button>
                <Button type="submit" loading={busyId === assignFor.id}>Assign bed</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
