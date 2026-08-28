import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import type { Ambulance, Facility, Patient, Referral } from '../../types';
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Segmented, Select, Spinner, Textarea, useToast } from '../../components/ui';
import { fmtDateTime, titleCase } from '../../lib/format';

type Direction = 'outgoing' | 'incoming';
type Side = 'sender' | 'receiver' | 'oversight';

const URGENCY_TONE: Record<string, 'red' | 'gold' | 'green' | 'gray'> = {
  EMERGENCY: 'red',
  URGENT: 'gold',
  ROUTINE: 'green',
};

const STATUS_TONE: Record<string, 'green' | 'gold' | 'navy' | 'red' | 'gray' | 'blue'> = {
  COMPLETED: 'green',
  ACCEPTED: 'green',
  ARRIVED: 'blue',
  SUBMITTED: 'navy',
  RECEIVED: 'gold',
  AWAITING_TRANSPORT: 'gold',
  IN_TRANSIT: 'blue',
  RETURNED: 'gray',
  REJECTED: 'red',
  CANCELLED: 'red',
  DRAFT: 'gray',
};

interface Action {
  label: string;
  next: string;
  tone: 'green' | 'danger' | 'navy' | 'outline';
  transport?: boolean;
}

// Actions available at each status when the user is on neither side
// (national / regional / district oversight) — the union of both sides.
const OVERSIGHT_ACTIONS: Record<string, Action[]> = {
  SUBMITTED: [
    { label: 'Mark received', next: 'RECEIVED', tone: 'navy' },
    { label: 'Reject', next: 'REJECTED', tone: 'danger' },
    { label: 'Cancel', next: 'CANCELLED', tone: 'outline' },
  ],
  RECEIVED: [
    { label: 'Accept', next: 'ACCEPTED', tone: 'green' },
    { label: 'Reject', next: 'REJECTED', tone: 'danger' },
  ],
  ACCEPTED: [
    { label: 'Awaiting transport', next: 'AWAITING_TRANSPORT', tone: 'navy', transport: true },
    { label: 'Complete', next: 'COMPLETED', tone: 'green' },
  ],
  AWAITING_TRANSPORT: [
    { label: 'In transit', next: 'IN_TRANSIT', tone: 'navy', transport: true },
    { label: 'Complete', next: 'COMPLETED', tone: 'green' },
  ],
  IN_TRANSIT: [
    { label: 'Arrived', next: 'ARRIVED', tone: 'green' },
    { label: 'Complete', next: 'COMPLETED', tone: 'green' },
  ],
  ARRIVED: [
    { label: 'Complete', next: 'COMPLETED', tone: 'green' },
    { label: 'Return', next: 'RETURNED', tone: 'outline' },
  ],
  REJECTED: [
    { label: 'Returned to sender', next: 'RETURNED', tone: 'outline' },
    { label: 'Resubmit', next: 'SUBMITTED', tone: 'navy' },
  ],
  RETURNED: [{ label: 'Complete', next: 'COMPLETED', tone: 'green' }],
};

// What the sending facility may do.
const SENDER_ACTIONS: Record<string, Action[]> = {
  SUBMITTED: [{ label: 'Cancel', next: 'CANCELLED', tone: 'outline' }],
  ACCEPTED: [{ label: 'Complete', next: 'COMPLETED', tone: 'green' }],
  AWAITING_TRANSPORT: [{ label: 'Complete', next: 'COMPLETED', tone: 'green' }],
  IN_TRANSIT: [{ label: 'Complete', next: 'COMPLETED', tone: 'green' }],
  REJECTED: [{ label: 'Resubmit', next: 'SUBMITTED', tone: 'navy' }],
  RETURNED: [{ label: 'Complete', next: 'COMPLETED', tone: 'green' }],
};

// What the receiving facility may do.
const RECEIVER_ACTIONS: Record<string, Action[]> = {
  SUBMITTED: [
    { label: 'Mark received', next: 'RECEIVED', tone: 'navy' },
    { label: 'Reject', next: 'REJECTED', tone: 'danger' },
  ],
  RECEIVED: [
    { label: 'Accept', next: 'ACCEPTED', tone: 'green' },
    { label: 'Reject', next: 'REJECTED', tone: 'danger' },
  ],
  ACCEPTED: [{ label: 'Awaiting transport', next: 'AWAITING_TRANSPORT', tone: 'navy', transport: true }],
  AWAITING_TRANSPORT: [{ label: 'In transit', next: 'IN_TRANSIT', tone: 'navy', transport: true }],
  IN_TRANSIT: [{ label: 'Arrived', next: 'ARRIVED', tone: 'green' }],
  ARRIVED: [
    { label: 'Complete', next: 'COMPLETED', tone: 'green' },
    { label: 'Return', next: 'RETURNED', tone: 'outline' },
  ],
  REJECTED: [{ label: 'Returned to sender', next: 'RETURNED', tone: 'outline' }],
};

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'IN_TRANSIT', label: 'In transit' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const DONE = new Set(['COMPLETED', 'CANCELLED']);

export default function Referrals() {
  const { user } = useAuth();
  const [direction, setDirection] = useState<Direction>('outgoing');
  const [filter, setFilter] = useState('');
  const [referrals, setReferrals] = useState<Referral[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patientId: '', patientQ: '', toFacilityId: '', specialty: '', urgency: 'ROUTINE', summary: '' });
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [noteFor, setNoteFor] = useState<Record<string, string>>({});
  const [ambulanceFor, setAmbulanceFor] = useState<Record<string, string>>({});
  const toast = useToast();

  const load = useCallback(async () => {
    const statusParam = filter && filter !== 'ACTIVE' ? `&status=${filter}` : '';
    setReferrals((await api<{ items: Referral[] }>(`/referrals?direction=${direction}${statusParam}`)).items);
  }, [direction, filter]);

  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  useEffect(() => {
    void api<{ items: Facility[] }>('/facilities?pageSize=100', { public: true }).then((r) => setFacilities(r.items)).catch(() => undefined);
    void api<{ items: Ambulance[] }>('/ambulances').then((r) => setAmbulances(r.items)).catch(() => undefined);
  }, []);

  const rows = useMemo(() => {
    if (!referrals) return null;
    if (filter !== 'ACTIVE') return referrals;
    return referrals.filter((r) => !DONE.has(r.status));
  }, [referrals, filter]);

  async function searchPatients(q: string) {
    setForm((f) => ({ ...f, patientQ: q }));
    if (!q.trim()) { setPatientResults([]); return; }
    const r = await api<{ items: Patient[] }>(`/patients?q=${encodeURIComponent(q)}&pageSize=8`);
    setPatientResults(r.items);
  }

  async function createReferral(e: FormEvent) {
    e.preventDefault();
    if (!form.patientId) { toast('Select a patient first', 'error'); return; }
    setBusyId('new');
    try {
      await api('/referrals', {
        method: 'POST',
        body: {
          patientId: form.patientId,
          toFacilityId: form.toFacilityId || undefined,
          specialty: form.specialty || undefined,
          urgency: form.urgency,
          summary: form.summary || undefined,
        },
      });
      toast('Referral submitted', 'success');
      setShowForm(false);
      setForm({ patientId: '', patientQ: '', toFacilityId: '', specialty: '', urgency: 'ROUTINE', summary: '' });
      setPatientResults([]);
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setBusyId(null);
    }
  }

  /** Which side of the referral the signed-in user is on. */
  function sideOf(r: Referral): Side {
    if (!user?.facilityId) return 'oversight';
    if (r.fromFacilityId === user.facilityId) return 'sender';
    if (r.toFacilityId === user.facilityId) return 'receiver';
    return 'oversight';
  }

  function actionsFor(r: Referral): Action[] {
    const side = sideOf(r);
    const map = side === 'sender' ? SENDER_ACTIONS : side === 'receiver' ? RECEIVER_ACTIONS : OVERSIGHT_ACTIONS;
    return map[r.status] ?? [];
  }

  async function transition(r: Referral, a: Action) {
    setBusyId(r.id);
    try {
      const body: Record<string, unknown> = { status: a.next };
      const note = noteFor[r.id]?.trim();
      if (note) body.note = note;
      if (a.transport) {
        const ambulanceId = ambulanceFor[r.id];
        if (ambulanceId) body.ambulanceId = ambulanceId;
      }
      await api(`/referrals/${r.id}/status`, { method: 'POST', body });
      toast(`Referral → ${titleCase(a.next)}`, 'success');
      setNoteFor((n) => ({ ...n, [r.id]: '' }));
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setBusyId(null);
    }
  }

  function timeline(r: Referral) {
    const points: { at: string; label: string }[] = [];
    if (r.createdAt) points.push({ at: r.createdAt, label: 'Submitted' });
    if (r.receivedAt) points.push({ at: r.receivedAt, label: 'Received' });
    if (r.acceptedAt) points.push({ at: r.acceptedAt, label: 'Accepted' });
    if (r.rejectedAt) points.push({ at: r.rejectedAt, label: 'Rejected' });
    if (r.arrivedAt) points.push({ at: r.arrivedAt, label: 'Arrived' });
    if (r.completedAt) points.push({ at: r.completedAt, label: 'Completed' });
    if (r.cancelledAt) points.push({ at: r.cancelledAt, label: 'Cancelled' });
    return points;
  }

  const showTransport = (r: Referral) => ['AWAITING_TRANSPORT', 'IN_TRANSIT'].includes(r.status) && actionsFor(r).some((a) => a.transport);

  return (
    <div>
      <PageHeader
        title="Referral network"
        subtitle="Track patients across facilities — submit, receive, accept, transport and complete referrals."
        action={<Button icon="plus" onClick={() => setShowForm((v) => !v)}>New referral</Button>}
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented options={[{ value: 'outgoing', label: 'Outgoing' }, { value: 'incoming', label: 'Incoming' }]} value={direction} onChange={setDirection} />
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition ${
                filter === f.value ? 'border-g-red bg-g-red text-white' : 'border-slate-200 bg-white text-slate-500 hover:border-g-red/40 hover:text-g-red'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {showForm && (
        <Card title="New referral" className="mb-5">
          <form onSubmit={createReferral} className="grid gap-3 md:grid-cols-3">
            <Field label="Patient" hint="Search by name or MRN">
              <Input value={form.patientQ} onChange={(e) => void searchPatients(e.target.value)} placeholder="Search patient…" />
              {patientResults.length > 0 && (
                <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                  {patientResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setForm((f) => ({ ...f, patientId: p.id, patientQ: `${p.fullName} (${p.mrn})` })); setPatientResults([]); }}
                      className={`block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-g-mist ${form.patientId === p.id ? 'bg-g-mist' : ''}`}
                    >
                      <span className="font-semibold text-g-ink">{p.fullName}</span>
                      <span className="font-mono text-xs text-slate-400"> {p.mrn}</span>
                    </button>
                  ))}
                </div>
              )}
            </Field>
            <Field label="Receiving facility">
              <Select value={form.toFacilityId} onChange={(e) => setForm({ ...form, toFacilityId: e.target.value })}>
                <option value="">Select facility…</option>
                {facilities.filter((f) => f.operationalStatus === 'OPERATIONAL').map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </Select>
            </Field>
            <Field label="Specialty">
              <Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder="Cardiology" />
            </Field>
            <Field label="Urgency">
              <Select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })}>
                <option value="ROUTINE">Routine</option>
                <option value="URGENT">Urgent</option>
                <option value="EMERGENCY">Emergency</option>
              </Select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Clinical summary">
                <Textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="Reason for referral, key findings, requested review…" />
              </Field>
            </div>
            <div className="flex items-end gap-2 md:col-span-3">
              <Button type="submit" loading={busyId === 'new'} icon="arrowRight">Submit referral</Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {!rows ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState icon="globe" title={`No ${direction} referrals`} message={direction === 'outgoing' ? 'Referrals you create will appear here.' : 'Referrals sent to your facility will appear here.'} />
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card key={r.id} pad={false}>
              <div className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-g-ink">{r.patient?.fullName ?? 'Patient'}</span>
                      <Badge tone={URGENCY_TONE[r.urgency] ?? 'gray'}>{titleCase(r.urgency)}</Badge>
                      <Badge tone={STATUS_TONE[r.status] ?? 'gray'}>{titleCase(r.status)}</Badge>
                      {r.specialty && <Badge tone="navy">{r.specialty}</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {direction === 'outgoing' ? 'To: ' : 'From: '}
                      <span className="font-semibold text-g-ink">{direction === 'outgoing' ? (r.toFacilityName ?? '—') : (r.fromFacilityName ?? '—')}</span>
                      <span className="text-slate-400"> · {r.patient?.mrn} · {fmtDateTime(r.createdAt)}</span>
                    </p>
                    {r.summary && <p className="mt-2 max-w-2xl text-sm text-slate-600">{r.summary}</p>}
                    {r.ambulance && (
                      <p className="mt-1.5 text-xs font-semibold text-g-teal">
                        🚑 {r.ambulance.registration}{r.ambulance.driverName ? ` · ${r.ambulance.driverName}` : ''}
                      </p>
                    )}
                    {timeline(r).length > 1 && (
                      <p className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-400">
                        {timeline(r).map((t) => (
                          <span key={t.label}><span className="font-semibold text-slate-500">{t.label}</span> {fmtDateTime(t.at)}</span>
                        ))}
                      </p>
                    )}
                  </div>
                  {actionsFor(r).length > 0 && (
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        {actionsFor(r).map((a) => (
                          <Button key={a.next} size="sm" variant={a.tone} loading={busyId === r.id} onClick={() => void transition(r, a)}>
                            {a.label}
                          </Button>
                        ))}
                      </div>
                      {showTransport(r) && (
                        <Select
                          value={ambulanceFor[r.id] ?? ''}
                          onChange={(e) => setAmbulanceFor((m) => ({ ...m, [r.id]: e.target.value }))}
                          className="max-w-56 text-xs"
                        >
                          <option value="">Ambulance (optional)…</option>
                          {ambulances.filter((a) => a.status === 'AVAILABLE' || a.status === 'RETURNING' || a.id === ambulanceFor[r.id]).map((a) => (
                            <option key={a.id} value={a.id}>{a.registration}{a.driverName ? ` — ${a.driverName}` : ''}</option>
                          ))}
                        </Select>
                      )}
                      <Input
                        value={noteFor[r.id] ?? ''}
                        onChange={(e) => setNoteFor((n) => ({ ...n, [r.id]: e.target.value }))}
                        placeholder="Note (optional)…"
                        className="max-w-64 text-xs"
                      />
                    </div>
                  )}
                </div>
                {r.note && (
                  <p className="mt-2 rounded-lg bg-g-mist px-3 py-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-600">Latest note:</span> {r.note}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
