import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api } from '../../lib/api';
import type { Facility, Patient, Referral } from '../../types';
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Segmented, Select, Spinner, Textarea, useToast } from '../../components/ui';
import { fmtDateTime, titleCase } from '../../lib/format';

type Direction = 'outgoing' | 'incoming';

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

// Actions a user can take from this screen, mapped to allowed transitions.
const ACTIONS: Record<string, { label: string; next: string; tone: 'green' | 'danger' | 'navy' | 'outline' }[]> = {
  SUBMITTED: [
    { label: 'Mark received', next: 'RECEIVED', tone: 'navy' },
    { label: 'Reject', next: 'REJECTED', tone: 'danger' },
  ],
  RECEIVED: [
    { label: 'Accept', next: 'ACCEPTED', tone: 'green' },
    { label: 'Reject', next: 'REJECTED', tone: 'danger' },
  ],
  ACCEPTED: [
    { label: 'Awaiting transport', next: 'AWAITING_TRANSPORT', tone: 'navy' },
    { label: 'Complete', next: 'COMPLETED', tone: 'green' },
  ],
  AWAITING_TRANSPORT: [
    { label: 'In transit', next: 'IN_TRANSIT', tone: 'navy' },
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
  ],
};

export default function Referrals() {
  const [direction, setDirection] = useState<Direction>('outgoing');
  const [referrals, setReferrals] = useState<Referral[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patientId: '', patientQ: '', toFacilityId: '', specialty: '', urgency: 'ROUTINE', summary: '' });
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const toast = useToast();

  const load = useCallback(async () => {
    setReferrals((await api<{ items: Referral[] }>(`/referrals?direction=${direction}`)).items);
  }, [direction]);

  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  useEffect(() => {
    void api<{ items: Facility[] }>('/facilities?pageSize=100', { public: true }).then((r) => setFacilities(r.items)).catch(() => undefined);
  }, []);

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

  async function transition(id: string, status: string) {
    setBusyId(id);
    try {
      await api(`/referrals/${id}/status`, { method: 'POST', body: { status } });
      toast(`Referral → ${titleCase(status)}`, 'success');
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Referral network"
        subtitle="Track patients across facilities — submit, receive, accept and complete referrals."
        action={<Button icon="plus" onClick={() => setShowForm((v) => !v)}>New referral</Button>}
      />
      <div className="mb-5">
        <Segmented options={[{ value: 'outgoing', label: 'Outgoing' }, { value: 'incoming', label: 'Incoming' }]} value={direction} onChange={setDirection} />
      </div>

      {showForm && (
        <Card title="New referral" className="mb-5">
          <form onSubmit={createReferral} className="grid gap-3 md:grid-cols-3">
            <Field label="Patient" className="md:col-span-1" hint="Search by name or MRN">
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

      {!referrals ? (
        <Spinner />
      ) : referrals.length === 0 ? (
        <EmptyState icon="globe" title={`No ${direction} referrals`} message={direction === 'outgoing' ? 'Referrals you create will appear here.' : 'Referrals sent to your facility will appear here.'} />
      ) : (
        <div className="space-y-3">
          {referrals.map((r) => (
            <Card key={r.id} pad={false}>
              <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
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
                </div>
                {(ACTIONS[r.status] ?? []).length > 0 && (
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    {ACTIONS[r.status]!.map((a) => (
                      <Button key={a.next} size="sm" variant={a.tone} loading={busyId === r.id} onClick={() => void transition(r.id, a.next)}>
                        {a.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
