import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api } from '../../lib/api';
import type { Ambulance, AmbulanceTrip, Facility, Patient } from '../../types';
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Select, Spinner, Textarea, useToast } from '../../components/ui';
import { fmtDateTime, titleCase } from '../../lib/format';

const STATUS_TONE: Record<string, 'green' | 'gold' | 'navy' | 'red' | 'gray' | 'blue'> = {
  AVAILABLE: 'green',
  ASSIGNED: 'navy',
  EN_ROUTE: 'blue',
  AT_SCENE: 'gold',
  TRANSPORTING: 'red',
  AT_FACILITY: 'blue',
  RETURNING: 'gold',
  MAINTENANCE: 'gray',
  OFFLINE: 'gray',
};

// Trip lifecycle actions (allowed transitions from the API).
const TRIP_ACTIONS: Record<string, { label: string; next: string; tone: 'green' | 'danger' | 'navy' }[]> = {
  ASSIGNED: [{ label: 'En route', next: 'EN_ROUTE', tone: 'navy' }],
  EN_ROUTE: [{ label: 'At scene', next: 'AT_SCENE', tone: 'navy' }],
  AT_SCENE: [{ label: 'Transporting', next: 'TRANSPORTING', tone: 'green' }],
  TRANSPORTING: [{ label: 'At facility', next: 'AT_FACILITY', tone: 'navy' }],
  AT_FACILITY: [{ label: 'Complete', next: 'COMPLETED', tone: 'green' }, { label: 'Returning', next: 'RETURNING', tone: 'navy' }],
  RETURNING: [{ label: 'Complete', next: 'COMPLETED', tone: 'green' }],
};

export default function Ambulances() {
  const [fleet, setFleet] = useState<Ambulance[] | null>(null);
  const [trips, setTrips] = useState<AmbulanceTrip[] | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [dispatchFor, setDispatchFor] = useState<Ambulance | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [form, setForm] = useState({ registration: '', model: '', driverName: '', driverPhone: '', fuelLevel: '' });
  const [tripForm, setTripForm] = useState({ patientId: '', patientQ: '', emergencyType: 'MEDICAL', pickupLocation: '', destinationFacilityId: '', notes: '' });
  const [busyId, setBusyId] = useState<string | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    const [f, t] = await Promise.all([
      api<{ items: Ambulance[] }>('/ambulances'),
      api<{ items: AmbulanceTrip[] }>('/ambulance/trips'),
    ]);
    setFleet(f.items);
    setTrips(t.items);
  }, []);

  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  useEffect(() => {
    void api<{ items: Facility[] }>('/facilities?pageSize=100', { public: true }).then((r) => setFacilities(r.items)).catch(() => undefined);
  }, []);

  async function searchPatients(q: string) {
    setTripForm((f) => ({ ...f, patientQ: q }));
    if (!q.trim()) { setPatientResults([]); return; }
    const r = await api<{ items: Patient[] }>(`/patients?q=${encodeURIComponent(q)}&pageSize=8`);
    setPatientResults(r.items);
  }

  async function registerAmbulance(e: FormEvent) {
    e.preventDefault();
    setBusyId('new');
    try {
      await api('/ambulances', { method: 'POST', body: { ...form, fuelLevel: form.fuelLevel ? Number(form.fuelLevel) : undefined } });
      toast('Ambulance registered', 'success');
      setShowFormReset();
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setBusyId(null);
    }
  }

  function setShowFormReset() {
    setShowRegister(false);
    setForm({ registration: '', model: '', driverName: '', driverPhone: '', fuelLevel: '' });
  }

  async function dispatch(e: FormEvent) {
    e.preventDefault();
    if (!dispatchFor) return;
    const patient = patientResults.find((p) => p.id === tripForm.patientId) ?? null;
    if (!patient) { toast('Select a patient from the results', 'error'); return; }
    setBusyId(dispatchFor.id);
    try {
      await api('/ambulance/trips', {
        method: 'POST',
        body: {
          ambulanceId: dispatchFor.id,
          patientId: patient.id,
          emergencyType: tripForm.emergencyType,
          pickupLocation: tripForm.pickupLocation || undefined,
          destinationFacilityId: tripForm.destinationFacilityId || undefined,
          notes: tripForm.notes || undefined,
        },
      });
      toast(`Dispatched ${dispatchFor.registration}`, 'success');
      setDispatchFor(null);
      setTripForm({ patientId: '', patientQ: '', emergencyType: 'MEDICAL', pickupLocation: '', destinationFacilityId: '', notes: '' });
      setPatientResults([]);
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function advanceTrip(id: string, status: string) {
    setBusyId(id);
    try {
      await api(`/ambulance/trips/${id}/status`, { method: 'POST', body: { status } });
      toast(`Trip → ${titleCase(status)}`, 'success');
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function setFleetStatus(id: string, status: string) {
    setBusyId(id);
    try {
      await api(`/ambulances/${id}/status`, { method: 'POST', body: { status } });
      toast(`Fleet → ${titleCase(status)}`, 'success');
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setBusyId(null);
    }
  }

  const available = fleet?.filter((a) => a.status === 'AVAILABLE' || a.status === 'RETURNING').length ?? 0;

  return (
    <div>
      <PageHeader
        title="Ambulance fleet"
        subtitle="Dispatch and track emergency transport across the network."
        action={<Button icon="plus" onClick={() => setShowRegister((v) => !v)}>Register ambulance</Button>}
      />

      {showRegister && (
        <Card title="Register ambulance" className="mb-5">
          <form onSubmit={registerAmbulance} className="grid gap-3 md:grid-cols-4">
            <Field label="Registration number"><Input value={form.registration} onChange={(e) => setForm({ ...form, registration: e.target.value })} placeholder="GV-1234-25" required /></Field>
            <Field label="Model"><Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Mercedes Sprinter" /></Field>
            <Field label="Driver name"><Input value={form.driverName} onChange={(e) => setForm({ ...form, driverName: e.target.value })} /></Field>
            <Field label="Driver phone"><Input value={form.driverPhone} onChange={(e) => setForm({ ...form, driverPhone: e.target.value })} /></Field>
            <Field label="Fuel level (%)"><Input type="number" min={0} max={100} value={form.fuelLevel} onChange={(e) => setForm({ ...form, fuelLevel: e.target.value })} /></Field>
            <div className="flex items-end gap-2">
              <Button type="submit" loading={busyId === 'new'}>Register</Button>
              <Button variant="ghost" onClick={() => setShowFormReset()}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {!fleet ? (
        <Spinner />
      ) : fleet.length === 0 ? (
        <EmptyState icon="ambulance" title="No ambulances registered" message="Register your fleet to start dispatching." />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card pad={false} className="p-4"><p className="text-xs text-slate-500">Fleet total</p><p className="mt-1 text-2xl font-bold text-g-ink">{fleet.length}</p></Card>
            <Card pad={false} className="p-4"><p className="text-xs text-slate-500">Ready to dispatch</p><p className="mt-1 text-2xl font-bold text-g-green">{available}</p></Card>
            <Card pad={false} className="p-4"><p className="text-xs text-slate-500">On active duty</p><p className="mt-1 text-2xl font-bold text-g-red">{fleet.length - available}</p></Card>
            <Card pad={false} className="p-4"><p className="text-xs text-slate-500">In maintenance</p><p className="mt-1 text-2xl font-bold text-slate-600">{fleet.filter((a) => a.status === 'MAINTENANCE' || a.status === 'OFFLINE').length}</p></Card>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {fleet.map((a) => (
              <Card key={a.id} pad={false}>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-g-ink">{a.registration}</span>
                      <Badge tone={STATUS_TONE[a.status] ?? 'gray'}>{titleCase(a.status)}</Badge>
                    </div>
                    {a.model && <span className="text-[11px] text-slate-400">{a.model}</span>}
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-slate-600">
                    <p><span className="text-slate-400">Driver:</span> <span className="font-semibold">{a.driverName ?? '—'}</span></p>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Fuel:</span>
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
                        <div className={a.fuelLevel != null && a.fuelLevel < 25 ? 'h-full bg-g-red' : 'h-full bg-g-green'} style={{ width: `${a.fuelLevel ?? 0}%` }} />
                      </div>
                      <span className="text-xs">{a.fuelLevel ?? '—'}%</span>
                    </div>
                    {a.trips?.[0] && a.trips[0].status !== 'COMPLETED' && (
                      <p className="text-xs text-g-red"><span className="text-slate-400">Active:</span> {a.trips[0].patient?.fullName ?? 'trip in progress'}</p>
                    )}
                  </div>
                  {(a.status === 'AVAILABLE' || a.status === 'RETURNING') && (
                    <Button size="sm" variant="navy" icon="ambulance" className="mt-3 w-full" onClick={() => setDispatchFor(a)}>Dispatch</Button>
                  )}
                  {(a.status === 'MAINTENANCE' || a.status === 'OFFLINE') && (
                    <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => void setFleetStatus(a.id, 'AVAILABLE')}>Mark available</Button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <h2 className="mb-3 mt-8 text-sm font-bold text-g-ink">Trip log</h2>
          {!trips || trips.length === 0 ? (
            <EmptyState icon="ambulance" title="No trips yet" message="Dispatches will appear here with live status." />
          ) : (
            <div className="space-y-3">
              {trips.map((t) => (
                <Card key={t.id} pad={false}>
                  <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold text-g-ink">{t.ambulance?.registration ?? '—'}</span>
                        <Badge tone={STATUS_TONE[t.status] ?? 'gray'}>{titleCase(t.status)}</Badge>
                        {t.emergencyType && <Badge tone="red">{titleCase(t.emergencyType)}</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        <span className="font-semibold text-g-ink">{t.patient?.fullName ?? 'Patient'}</span>
                        <span className="text-slate-400"> · {t.patient?.mrn ?? '—'} · dispatched {fmtDateTime(t.dispatchedAt)}</span>
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {t.pickupLocation ?? 'Pickup TBD'} → {t.destination?.name ?? 'Facility'}
                      </p>
                      {t.notes && <p className="mt-1.5 text-xs text-slate-500">{t.notes}</p>}
                    </div>
                    {(TRIP_ACTIONS[t.status] ?? []).length > 0 && (
                      <div className="flex shrink-0 flex-wrap gap-1.5">
                        {TRIP_ACTIONS[t.status]!.map((act) => (
                          <Button key={act.next} size="sm" variant={act.tone} loading={busyId === t.id} onClick={() => void advanceTrip(t.id, act.next)}>{act.label}</Button>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {dispatchFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDispatchFor(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-g-ink">Dispatch {dispatchFor.registration}</h3>
            <form onSubmit={dispatch} className="mt-4 space-y-3">
              <Field label="Patient" hint="Search by name or MRN">
                <Input value={tripForm.patientQ} onChange={(e) => void searchPatients(e.target.value)} placeholder="Search patient…" autoFocus />
                {patientResults.length > 0 && (
                  <div className="mt-1 max-h-36 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                    {patientResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setTripForm((f) => ({ ...f, patientId: p.id, patientQ: `${p.fullName} (${p.mrn})` })); setPatientResults([]); }}
                        className="block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-g-mist"
                      >
                        <span className="font-semibold text-g-ink">{p.fullName}</span>
                        <span className="font-mono text-xs text-slate-400"> {p.mrn}</span>
                      </button>
                    ))}
                  </div>
                )}
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Emergency type">
                  <Select value={tripForm.emergencyType} onChange={(e) => setTripForm({ ...tripForm, emergencyType: e.target.value })}>
                    <option value="MEDICAL">Medical</option>
                    <option value="TRAUMA">Trauma</option>
                    <option value="OBSTETRIC">Obstetric</option>
                    <option value="CARDIAC">Cardiac</option>
                    <option value="OTHER">Other</option>
                  </Select>
                </Field>
                <Field label="Destination facility">
                  <Select value={tripForm.destinationFacilityId} onChange={(e) => setTripForm({ ...tripForm, destinationFacilityId: e.target.value })}>
                    <option value="">Select…</option>
                    {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </Select>
                </Field>
              </div>
              <Field label="Pickup location"><Input value={tripForm.pickupLocation} onChange={(e) => setTripForm({ ...tripForm, pickupLocation: e.target.value })} placeholder="Community, landmark…" /></Field>
              <Field label="Notes"><Textarea value={tripForm.notes} onChange={(e) => setTripForm({ ...tripForm, notes: e.target.value })} /></Field>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setDispatchFor(null)}>Cancel</Button>
                <Button type="submit" loading={busyId === dispatchFor.id} icon="ambulance">Dispatch now</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
