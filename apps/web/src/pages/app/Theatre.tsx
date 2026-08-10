import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api } from '../../lib/api';
import type { Patient, SurgicalBooking } from '../../types';
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Select, Spinner, Textarea, useToast } from '../../components/ui';
import { fmtDateTime, titleCase } from '../../lib/format';

const STATUS_TONE: Record<string, 'green' | 'gold' | 'navy' | 'red' | 'gray' | 'blue'> = {
  BOOKED: 'navy',
  SCHEDULED: 'blue',
  PRE_OP: 'gold',
  IN_PROGRESS: 'red',
  RECOVERY: 'blue',
  COMPLETED: 'green',
  CANCELLED: 'gray',
};

const URGENCY_TONE: Record<string, 'red' | 'gold' | 'green' | 'gray'> = {
  EMERGENCY: 'red',
  URGENT: 'gold',
  ROUTINE: 'green',
};

const STATUS_ACTIONS: Record<string, { label: string; next: string; tone: 'green' | 'danger' | 'navy' | 'outline' }[]> = {
  BOOKED: [
    { label: 'Schedule', next: 'SCHEDULED', tone: 'navy' },
    { label: 'Cancel', next: 'CANCELLED', tone: 'danger' },
  ],
  SCHEDULED: [
    { label: 'Pre-op', next: 'PRE_OP', tone: 'navy' },
    { label: 'Cancel', next: 'CANCELLED', tone: 'danger' },
  ],
  PRE_OP: [{ label: 'Start surgery', next: 'IN_PROGRESS', tone: 'danger' }],
  IN_PROGRESS: [{ label: 'To recovery', next: 'RECOVERY', tone: 'navy' }],
  RECOVERY: [{ label: 'Complete case', next: 'COMPLETED', tone: 'green' }],
};

export default function Theatre() {
  const [bookings, setBookings] = useState<SurgicalBooking[] | null>(null);
  const [byStatus, setByStatus] = useState<Record<string, number>>({});
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [patientQ, setPatientQ] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [form, setForm] = useState({ patientId: '', procedure: '', theatre: 'Theatre 1', urgency: 'ROUTINE', scheduledFor: '' });
  const [consentFor, setConsentFor] = useState<SurgicalBooking | null>(null);
  const [consentNote, setConsentNote] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    const q = statusFilter === 'ALL' ? '' : `?status=${statusFilter}`;
    const r = await api<{ items: SurgicalBooking[]; byStatus: Record<string, number> }>(`/theatre/bookings${q}`);
    setBookings(r.items);
    setByStatus(r.byStatus);
  }, [statusFilter]);

  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  async function searchPatients(q: string) {
    setPatientQ(q);
    if (!q.trim()) { setPatientResults([]); return; }
    const r = await api<{ items: Patient[] }>(`/patients?q=${encodeURIComponent(q)}&pageSize=8`);
    setPatientResults(r.items);
  }

  async function bookCase(e: FormEvent) {
    e.preventDefault();
    if (!form.patientId) { toast('Select a patient first', 'error'); return; }
    setBusyId('new');
    try {
      await api('/theatre/bookings', {
        method: 'POST',
        body: { ...form, scheduledFor: form.scheduledFor ? new Date(form.scheduledFor).toISOString() : undefined },
      });
      toast('Surgical case booked', 'success');
      setShowForm(false);
      setForm({ patientId: '', procedure: '', theatre: 'Theatre 1', urgency: 'ROUTINE', scheduledFor: '' });
      setPatientQ('');
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
      await api(`/theatre/bookings/${id}/status`, { method: 'POST', body: { status } });
      toast(`Case → ${titleCase(status)}`, 'success');
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function saveConsent(e: FormEvent) {
    e.preventDefault();
    if (!consentFor) return;
    setBusyId(consentFor.id);
    try {
      await api(`/theatre/bookings/${consentFor.id}/consent`, { method: 'POST', body: { consentObtained: true, consentNote } });
      toast('Consent recorded', 'success');
      setConsentFor(null);
      setConsentNote('');
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setBusyId(null);
    }
  }

  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
  const active = (byStatus.IN_PROGRESS ?? 0) + (byStatus.RECOVERY ?? 0) + (byStatus.PRE_OP ?? 0);

  return (
    <div>
      <PageHeader
        title="Theatre & surgery"
        subtitle="Surgical bookings, consent and case progression."
        action={<Button icon="plus" onClick={() => setShowForm((v) => !v)}>Book case</Button>}
      />

      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card pad={false} className="p-4"><p className="text-xs text-slate-500">Bookings</p><p className="mt-1 text-2xl font-bold text-g-ink">{total}</p></Card>
        <Card pad={false} className="p-4"><p className="text-xs text-slate-500">In theatre / recovery</p><p className="mt-1 text-2xl font-bold text-g-red">{active}</p></Card>
        <Card pad={false} className="p-4"><p className="text-xs text-slate-500">Completed</p><p className="mt-1 text-2xl font-bold text-g-green">{byStatus.COMPLETED ?? 0}</p></Card>
        <Card pad={false} className="p-4"><p className="text-xs text-slate-500">Awaiting consent</p><p className="mt-1 text-2xl font-bold text-slate-600">{total - active - (byStatus.COMPLETED ?? 0) - (byStatus.CANCELLED ?? 0)}</p></Card>
      </div>

      <div className="mb-4">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-64">
          <option value="ALL">All statuses</option>
          {['BOOKED', 'SCHEDULED', 'PRE_OP', 'IN_PROGRESS', 'RECOVERY', 'COMPLETED', 'CANCELLED'].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
        </Select>
      </div>

      {showForm && (
        <Card title="Book surgical case" className="mb-5">
          <form onSubmit={bookCase} className="grid gap-3 md:grid-cols-3">
            <Field label="Patient" hint="Search by name or MRN">
              <Input value={patientQ} onChange={(e) => void searchPatients(e.target.value)} placeholder="Search patient…" />
              {patientResults.length > 0 && (
                <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                  {patientResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setForm((f) => ({ ...f, patientId: p.id })); setPatientQ(`${p.fullName} (${p.mrn})`); setPatientResults([]); }}
                      className="block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-g-mist"
                    >
                      <span className="font-semibold text-g-ink">{p.fullName}</span>
                      <span className="font-mono text-xs text-slate-400"> {p.mrn}</span>
                    </button>
                  ))}
                </div>
              )}
            </Field>
            <Field label="Procedure"><Input value={form.procedure} onChange={(e) => setForm({ ...form, procedure: e.target.value })} placeholder="Emergency appendicectomy" required /></Field>
            <Field label="Theatre">
              <Select value={form.theatre} onChange={(e) => setForm({ ...form, theatre: e.target.value })}>
                {['Theatre 1', 'Theatre 2', 'Theatre 3', 'Obstetric Theatre'].map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Urgency">
              <Select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })}>
                <option value="ROUTINE">Routine</option>
                <option value="URGENT">Urgent</option>
                <option value="EMERGENCY">Emergency</option>
              </Select>
            </Field>
            <Field label="Scheduled for"><Input type="datetime-local" value={form.scheduledFor} onChange={(e) => setForm({ ...form, scheduledFor: e.target.value })} /></Field>
            <div className="flex items-end gap-2">
              <Button type="submit" loading={busyId === 'new'}>Book case</Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {!bookings ? (
        <Spinner />
      ) : bookings.length === 0 ? (
        <EmptyState icon="clipboard" title="No surgical cases" message="Book a case to start the theatre workflow." />
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b.id} pad={false}>
              <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-g-ink">{b.procedure}</span>
                    <Badge tone={URGENCY_TONE[b.urgency] ?? 'gray'}>{titleCase(b.urgency)}</Badge>
                    <Badge tone={STATUS_TONE[b.status] ?? 'gray'}>{titleCase(b.status)}</Badge>
                    {b.theatre && <Badge tone="navy">{b.theatre}</Badge>}
                    {b.consentObtained ? <Badge tone="green">Consented</Badge> : <Badge tone="gold">No consent</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    <span className="font-semibold text-g-ink">{b.patient?.fullName}</span>
                    <span className="text-slate-400"> · {b.patient?.mrn} · {b.scheduledFor ? fmtDateTime(b.scheduledFor) : 'unscheduled'}</span>
                  </p>
                  {(b.surgeon || b.anaesthetist) && (
                    <p className="mt-0.5 text-xs text-slate-400">
                      {b.surgeon && <span>Surgeon: {b.surgeon.fullName}</span>}
                      {b.surgeon && b.anaesthetist && ' · '}
                      {b.anaesthetist && <span>Anaesthetist: {b.anaesthetist.fullName}</span>}
                    </p>
                  )}
                  {(b.preOpAssessment || b.postOpNotes) && (
                    <p className="mt-1.5 max-w-2xl text-xs text-slate-500">{b.preOpAssessment ?? b.postOpNotes}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap gap-1.5">
                  {!b.consentObtained && b.status !== 'COMPLETED' && b.status !== 'CANCELLED' && (
                    <Button size="sm" variant="outline" onClick={() => setConsentFor(b)}>Record consent</Button>
                  )}
                  {(STATUS_ACTIONS[b.status] ?? []).map((a) => (
                    <Button key={a.next} size="sm" variant={a.tone} loading={busyId === b.id} onClick={() => void transition(b.id, a.next)}>
                      {a.label}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {consentFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConsentFor(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-g-ink">Record informed consent</h3>
            <p className="mt-1 text-sm text-slate-500">{consentFor.procedure} — {consentFor.patient?.fullName}</p>
            <form onSubmit={saveConsent} className="mt-4 space-y-3">
              <Field label="Consent note" hint="Document the risks explained and patient agreement.">
                <Textarea value={consentNote} onChange={(e) => setConsentNote(e.target.value)} placeholder="Informed consent signed…" autoFocus />
              </Field>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setConsentFor(null)}>Cancel</Button>
                <Button type="submit" loading={busyId === consentFor.id}>Record consent</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
