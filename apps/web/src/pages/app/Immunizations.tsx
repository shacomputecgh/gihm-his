import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { api, ApiRequestError, downloadFile } from '../../lib/api';
import { enqueueMutation } from '../../lib/offline';
import { useConnection } from '../../lib/connection';
import ImmunizationCoverage from '../../components/ImmunizationCoverage';
import type { Immunization, ImmunizationDueRow, ImmunizationMissedRow, ImmunizationScheduleItem, Patient, ReminderResult } from '../../types';
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Segmented, Select, Spinner, StatCard, useToast } from '../../components/ui';
import { ageFromDob, fmtDate, titleCase, todayIso, VACCINE_LABELS } from '../../lib/format';

type Tab = 'due' | 'missed' | 'registry' | 'schedule' | 'coverage' | 'report';
type Bucket = 'ALL' | 'OVERDUE' | 'DUE_SOON';

interface ReminderReport {
  windowDays: number;
  since: string;
  totals: { attempted: number; dispatched: number; rejected: number; noPhone: number; notConnected: number; optedOut: number };
  byChannel: Record<string, number>;
  byProvider: Record<string, number>;
  deliveryStatuses: Record<string, number>;
  byDistrict: Record<string, number>;
  byRegion: Record<string, number>;
  recent: Array<{ at: string; action: string; entityId: string | null; channel: string; provider: string; dispatched: boolean; messageId: string | null; district: string | null; region: string | null; note: string | null }>;
}

const BUCKET_OPTIONS: { value: Bucket; label: string }[] = [
  { value: 'ALL', label: 'All due' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'DUE_SOON', label: 'Due soon' },
];

interface DueResponse {
  items: ImmunizationDueRow[];
  count: number;
  summary: { overdue: number; dueSoon: number };
  windowDays: number;
}

export default function Immunizations() {
  const [tab, setTab] = useState<Tab>('due');
  const [bucket, setBucket] = useState<Bucket>('ALL');
  const [search, setSearch] = useState('');
  const [due, setDue] = useState<ImmunizationDueRow[] | null>(null);
  const [summary, setSummary] = useState({ overdue: 0, dueSoon: 0 });
  const [registry, setRegistry] = useState<Immunization[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [regStatus, setRegStatus] = useState('ALL');
  const [schedule, setSchedule] = useState<ImmunizationScheduleItem[] | null>(null);
  const [missed, setMissed] = useState<ImmunizationMissedRow[] | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [remindChannel, setRemindChannel] = useState<'SMS' | 'WHATSAPP'>('SMS');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulking, setBulking] = useState(false);
  const [report, setReport] = useState<ReminderReport | null>(null);
  const [reportDays, setReportDays] = useState('30');
  const toast = useToast();
  const { online } = useConnection();

  const loadTotal = useCallback(() => {
    void api<{ total: number }>('/immunizations?pageSize=1').then((r) => setTotal(r.total)).catch(() => undefined);
  }, []);

  useEffect(() => { loadTotal(); }, [loadTotal]);

  // ------------------------------------------------------- record form
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [form, setForm] = useState({ patientId: '', patientQ: '', vaccine: '', dose: '', administeredAt: todayIso(), batch: '' });

  const loadDue = useCallback(async () => {
    const r = await api<DueResponse>('/immunizations/due', { query: { bucket, q: search || undefined } });
    setDue(r.items);
    setSummary(r.summary);
  }, [bucket, search]);

  useEffect(() => {
    void loadDue().catch(() => setDue(null));
  }, [loadDue]);

  const loadRegistry = useCallback(() => {
    void api<{ items: Immunization[] }>('/immunizations', { query: { status: regStatus === 'ALL' ? undefined : regStatus } })
      .then((r) => setRegistry(r.items)).catch(() => setRegistry(null));
  }, [regStatus]);

  const loadMissed = useCallback(() => {
    void api<{ items: ImmunizationMissedRow[] }>('/immunizations/missed').then((r) => setMissed(r.items)).catch(() => setMissed(null));
  }, []);

  useEffect(() => {
    if (tab === 'registry') loadRegistry();
  }, [tab, loadRegistry]);

  useEffect(() => {
    if (tab === 'missed') loadMissed();
  }, [tab, loadMissed]);

  useEffect(() => {
    void api<{ schedule: ImmunizationScheduleItem[] }>('/immunizations/schedule').then((r) => setSchedule(r.schedule)).catch(() => undefined);
  }, []);

  const vaccines = useMemo(() => {
    if (!schedule) return [];
    const seen = new Set<string>();
    return schedule.filter((s) => (seen.has(s.vaccine) ? false : (seen.add(s.vaccine), true)));
  }, [schedule]);

  const dosesFor = useMemo(() => {
    if (!schedule || !form.vaccine) return [];
    return schedule.filter((s) => s.vaccine === form.vaccine);
  }, [schedule, form.vaccine]);

  async function searchPatients(q: string) {
    setForm((f) => ({ ...f, patientQ: q }));
    if (!q.trim()) { setPatientResults([]); return; }
    const r = await api<{ items: Patient[] }>(`/patients?q=${encodeURIComponent(q)}&pageSize=8`);
    setPatientResults(r.items);
  }

  function openRecord(prefill?: { patient?: ImmunizationDueRow['patient']; vaccine?: string; dose?: string }) {
    setForm((f) => ({
      ...f,
      patientId: prefill?.patient?.id ?? '',
      patientQ: prefill?.patient ? `${prefill.patient.fullName} (${prefill.patient.mrn})` : '',
      vaccine: prefill?.vaccine ?? '',
      dose: prefill?.dose ?? '',
      administeredAt: todayIso(),
    }));
    setPatientResults([]);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function recordDose(e: FormEvent) {
    e.preventDefault();
    if (!form.patientId) { toast('Select a patient first', 'error'); return; }
    if (!form.vaccine || !form.dose) { toast('Select vaccine and dose', 'error'); return; }
    setBusy('new');
    try {
      const res = await api<{ immunization: Immunization; next: { dose: string; dueAt: string | null; label: string } | null }>('/immunizations', {
        method: 'POST',
        body: {
          patientId: form.patientId,
          vaccine: form.vaccine,
          dose: form.dose,
          administeredAt: form.administeredAt || undefined,
          batch: form.batch || undefined,
        },
      });
      const v = `${VACCINE_LABELS[form.vaccine] ?? form.vaccine} ${form.dose}`;
      toast(res.next ? `${v} recorded — next dose (${res.next.dose}) due ${res.next.dueAt ? fmtDate(res.next.dueAt) : res.next.label}` : `${v} recorded`, 'success');
      setShowForm(false);
      setForm({ patientId: '', patientQ: '', vaccine: '', dose: '', administeredAt: todayIso(), batch: '' });
      setPatientResults([]);
      void loadDue();
      loadTotal();
      if (tab === 'registry') loadRegistry();
      if (tab === 'missed') loadMissed(); // recording the missed dose resolves the follow-up
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 0) {
        // Offline: queue locally (spec §104) — doses must be recordable in the field.
        await enqueueMutation({
          entityType: 'immunization',
          operation: 'CREATE',
          payload: {
            patientId: form.patientId,
            vaccine: form.vaccine,
            dose: form.dose,
            administeredAt: form.administeredAt || undefined,
            batch: form.batch || undefined,
          },
        });
        window.dispatchEvent(new CustomEvent('gihm:offline-saved', { detail: 'Dose saved locally — will sync automatically when connected.' }));
        toast('Saved offline — will sync when connected', 'success');
        setShowForm(false);
        setForm({ patientId: '', patientQ: '', vaccine: '', dose: '', administeredAt: todayIso(), batch: '' });
        setPatientResults([]);
        return;
      }
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setBusy(null);
    }
  }

  async function markMissed(id: string) {
    setBusy(id);
    try {
      await api(`/immunizations/${id}/mark-missed`, { method: 'POST' });
      toast('Marked as missed — patient moved to follow-up', 'success');
      void loadDue();
      if (tab === 'missed') loadMissed();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setBusy(null);
    }
  }

  async function remind(id: string) {
    setBusy(`remind-${id}`);
    const label = remindChannel === 'WHATSAPP' ? 'WhatsApp' : 'SMS';
    try {
      const res = await api<ReminderResult>(`/immunizations/${id}/remind`, { method: 'POST', body: { channel: remindChannel } });
      if (res.dispatched) {
        toast(`${label} reminder sent to ${res.to} (${res.provider})`, 'success');
      } else if (res.note) {
        // Gateway rejection / not connected — surface it as an error, the
        // reminder is still audit-logged so nothing is silently dropped.
        toast(`${label} reminder: ${res.note}`, 'error');
      } else {
        toast(`${label} reminder logged — no phone on file`, 'success');
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setBusy(null);
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  /** Counts what a bulk remind WOULD send without dispatching anything. */
  async function previewBulk() {
    if (selected.size === 0) return;
    setBulking(true);
    try {
      const res = await api<{ summary: { dispatched: number; failed: number; noPhone: number; optedOut: number; skipped: number } }>('/immunizations/reminders/bulk', {
        method: 'POST',
        body: { ids: [...selected], channel: remindChannel, dryRun: true },
      });
      const s = res.summary;
      toast(`Preview: ${s.dispatched} would be sent · ${s.noPhone} no phone · ${s.optedOut} opted out · ${s.skipped} skipped (${remindChannel})`, 'info');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Preview failed', 'error');
    } finally {
      setBulking(false);
    }
  }

  async function bulkRemind() {
    if (selected.size === 0) return;
    setBulking(true);
    try {
      const res = await api<{ summary: { dispatched: number; failed: number; noPhone: number; optedOut: number } }>('/immunizations/reminders/bulk', {
        method: 'POST',
        body: { ids: [...selected], channel: remindChannel },
      });
      toast(`${res.summary.dispatched} sent · ${res.summary.failed} failed · ${res.summary.noPhone} no phone · ${res.summary.optedOut} opted out (${remindChannel})`, 'success');
      setSelected(new Set());
      void loadDue();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Bulk remind failed', 'error');
    } finally {
      setBulking(false);
    }
  }

  /** Counts what a remind-all WOULD send without dispatching anything. */
  async function previewRemindAll() {
    setBulking(true);
    try {
      const res = await api<{ summary: { dispatched: number; failed: number; noPhone: number; optedOut: number; skipped: number } }>('/immunizations/reminders/remind-all', {
        method: 'POST',
        body: { channel: remindChannel, bucket, q: search || undefined, dryRun: true },
      });
      const s = res.summary;
      toast(`Preview: ${s.dispatched} would be sent · ${s.noPhone} no phone · ${s.optedOut} opted out · ${s.skipped} skipped (${remindChannel})`, 'info');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Preview failed', 'error');
    } finally {
      setBulking(false);
    }
  }

  /** One-click recall of every due child in the current filter (bucket + search). */
  async function remindAllDue() {
    setBulking(true);
    try {
      const res = await api<{ summary: { dispatched: number; failed: number; noPhone: number; optedOut: number; skipped: number } }>('/immunizations/reminders/remind-all', {
        method: 'POST',
        body: { channel: remindChannel, bucket, q: search || undefined },
      });
      toast(`${res.summary.dispatched} sent · ${res.summary.failed} failed · ${res.summary.noPhone} no phone · ${res.summary.optedOut} opted out (${remindChannel})`, 'success');
      setSelected(new Set());
      void loadDue();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Remind all failed', 'error');
    } finally {
      setBulking(false);
    }
  }

  /** Reminder run report — who was reminded, on which channel, and the outcome. */
  const loadReport = useCallback(() => {
    const days = Math.max(1, Number(reportDays) || 30);
    void api<ReminderReport>('/immunizations/reminders/report', { query: { days } }).then(setReport).catch(() => setReport(null));
  }, [reportDays]);

  useEffect(() => {
    if (tab === 'report') loadReport();
  }, [tab, loadReport]);

  /** Per-facility reminder run report (dispatch outcomes, drill-down to patient). */
  async function exportReminderReport() {
    setExporting('report');
    try {
      const days = Math.max(1, Number(reportDays) || 30);
      await downloadFile(`/immunizations/export/reminders?days=${days}`, `reminder-runs-${days}d.csv`);
      toast('Reminder run report downloaded', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Report export failed', 'error');
    } finally {
      setExporting(null);
    }
  }

  async function exportCsv(kind: 'due' | 'missed' | 'coverage') {
    setExporting(kind);
    try {
      await downloadFile(`/immunizations/export/${kind}`, `immunizations-${kind}.csv`);
      toast('CSV export downloaded', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Export failed', 'error');
    } finally {
      setExporting(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Immunization registry"
        subtitle="Ghana EPI schedule — record doses, track children due or overdue, and follow up defaulters."
        action={<Button icon="plus" onClick={() => { if (showForm) setShowForm(false); else openRecord(); }}>Record dose</Button>}
      />

      {/* Summary stats */}
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard label="Overdue" value={summary.overdue} icon="alert" tone="red" hint="Past their next-due date" />
        <StatCard label="Due within 30 days" value={summary.dueSoon} icon="clock" tone="gold" hint="Next dose coming up" />
        <StatCard label="Recorded doses" value={total ?? '—'} icon="syringe" tone="navy" hint="In this registry" />
      </div>

      {/* Record form */}
      {showForm && (
        <Card title="Record vaccine dose" className="mb-5">
          <form onSubmit={recordDose} className="grid gap-3 md:grid-cols-4">
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
                      <span className="ml-2 text-xs text-slate-400">{ageFromDob(p.dateOfBirth)}</span>
                    </button>
                  ))}
                </div>
              )}
            </Field>
            <Field label="Vaccine">
              <Select value={form.vaccine} onChange={(e) => setForm({ ...form, vaccine: e.target.value, dose: '' })}>
                <option value="">Select vaccine…</option>
                {vaccines.map((s) => <option key={s.vaccine} value={s.vaccine}>{VACCINE_LABELS[s.vaccine] ?? titleCase(s.vaccine)}</option>)}
              </Select>
            </Field>
            <Field label="Dose">
              <Select value={form.dose} onChange={(e) => setForm({ ...form, dose: e.target.value })} disabled={!form.vaccine}>
                <option value="">Select dose…</option>
                {dosesFor.map((s) => <option key={`${s.vaccine}-${s.dose}`} value={s.dose}>Dose {s.dose} — {s.label}</option>)}
              </Select>
            </Field>
            <Field label="Date given">
              <Input type="date" value={form.administeredAt} onChange={(e) => setForm({ ...form, administeredAt: e.target.value })} />
            </Field>
            <Field label="Batch / lot (optional)">
              <Input value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} placeholder="e.g. B2026-01" />
            </Field>
            {!online && (
              <div className="rounded-lg border border-g-gold/50 bg-g-gold/15 px-3 py-2 text-xs font-semibold text-yellow-900 md:col-span-4">
                Offline mode — the dose will be saved locally and synchronized when you reconnect.
              </div>
            )}
            <div className="flex items-end gap-2 md:col-span-3">
              <Button type="submit" loading={busy === 'new'} icon="check">Save dose</Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Segmented
          options={[
            { value: 'due', label: 'Due & overdue' },
            { value: 'missed', label: 'Follow-up' },
            { value: 'registry', label: 'Registry' },
            { value: 'coverage', label: 'Coverage' },
            { value: 'schedule', label: 'Schedule' },
            { value: 'report', label: 'Reminder report' },
          ]}
          value={tab}
          onChange={setTab}
        />
        {(tab === 'due' || tab === 'missed') && (
          <Segmented
            options={[{ value: 'SMS', label: 'Remind via SMS' }, { value: 'WHATSAPP', label: 'Remind via WhatsApp' }]}
            value={remindChannel}
            onChange={(v) => setRemindChannel(v as 'SMS' | 'WHATSAPP')}
          />
        )}
        {tab === 'due' && (
          <div className="flex flex-wrap items-center gap-2">
            <Segmented options={BUCKET_OPTIONS} value={bucket} onChange={setBucket} />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or MRN…" className="w-52" />
            <Button size="sm" variant="outline" loading={exporting === 'due'} onClick={() => void exportCsv('due')}>Export CSV</Button>
            <Button size="sm" variant="ghost" loading={bulking} disabled={due === null || due.length === 0} onClick={() => void previewRemindAll()}>Preview all</Button>
            <Button size="sm" variant="green" disabled={due === null || due.length === 0} loading={bulking} onClick={() => void remindAllDue()}>
              Remind all due
            </Button>
            <Button size="sm" variant="ghost" loading={bulking} disabled={selected.size === 0} onClick={() => void previewBulk()}>Preview selected</Button>
            <Button size="sm" variant="navy" disabled={selected.size === 0} loading={bulking} onClick={() => void bulkRemind()}>
              Remind selected ({selected.size})
            </Button>
          </div>
        )}
        {tab === 'missed' && (
          <Button size="sm" variant="outline" loading={exporting === 'missed'} onClick={() => void exportCsv('missed')}>Export CSV</Button>
        )}
        {tab === 'registry' && (
          <Select value={regStatus} onChange={(e) => setRegStatus(e.target.value)} className="w-40">
            <option value="ALL">All statuses</option>
            <option value="GIVEN">Given</option>
            <option value="MISSED">Missed</option>
          </Select>
        )}
      </div>

      {/* ------------------------------------------------ due worklist */}
      {tab === 'due' && (
        !due ? <Spinner label="Loading due worklist…" />
        : due.length === 0 ? (
          <EmptyState icon="check" title="No doses due" message={search || bucket !== 'ALL' ? 'Nothing matches the current filter.' : 'Children up to date on this schedule — new doses will appear here as they become due.'} />
        ) : (
          <div className="space-y-3">
            {due.map((r) => (
              <Card key={r.id} pad={false}>
                <div className="flex items-start gap-3 px-5 py-4">
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggleSelect(r.id)}
                    className="mt-1 h-4 w-4 shrink-0 accent-g-navy"
                    title="Select for bulk remind"
                  />
                  <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-g-ink">{r.patient.fullName}</span>
                        <Badge tone={r.bucket === 'OVERDUE' ? 'red' : 'gold'}>
                          {r.bucket === 'OVERDUE' ? `${r.daysOverdue} day${r.daysOverdue === 1 ? '' : 's'} overdue` : r.daysUntil === 0 ? 'Due today' : `Due in ${r.daysUntil} day${r.daysUntil === 1 ? '' : 's'}`}
                        </Badge>
                        {r.patient.reminderOptOut && <Badge tone="gray">No reminders</Badge>}
                        <Badge tone="navy">{VACCINE_LABELS[r.vaccine] ?? titleCase(r.vaccine)} · Dose {r.dose}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        <span className="font-mono text-xs text-slate-400">{r.patient.mrn}</span>
                        <span className="text-slate-400"> · {ageFromDob(r.patient.dateOfBirth)}</span>
                        {r.patient.districtName && <span className="text-slate-400"> · {r.patient.districtName}</span>}
                        {r.patient.phone && <span className="text-slate-400"> · 📞 {r.patient.phone}</span>}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {r.description} — next due <span className="font-semibold text-g-ink">{fmtDate(r.nextDueAt)}</span>
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-1.5">
                      <Button size="sm" variant="navy" loading={busy === r.id} onClick={() => openRecord({ patient: r.patient, vaccine: r.vaccine, dose: r.dose })}>
                        Record dose
                      </Button>
                      <Button size="sm" variant="outline" loading={busy === `remind-${r.id}`} onClick={() => void remind(r.id)}>Remind</Button>
                      {r.bucket === 'OVERDUE' && (
                        <Button size="sm" variant="outline" loading={busy === r.id} onClick={() => void markMissed(r.id)}>Mark missed</Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {/* ---------------------------------------------- missed follow-up */}
      {tab === 'missed' && (
        !missed ? <Spinner label="Loading follow-up list…" />
        : missed.length === 0 ? (
          <EmptyState icon="check" title="No defaulters to follow up" message="Children whose doses were marked missed will appear here for re-invitation." />
        ) : (
          <div className="space-y-3">
            {missed.map((r) => (
              <Card key={r.id} pad={false}>
                <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-g-ink">{r.patient.fullName}</span>
                      <Badge tone={r.daysOverdue !== null && r.daysOverdue > 0 ? 'red' : 'gray'}>
                        {r.daysOverdue !== null && r.daysOverdue > 0 ? `${r.daysOverdue} day${r.daysOverdue === 1 ? '' : 's'} since missed` : 'Missed'}
                      </Badge>
                      {r.patient.reminderOptOut && <Badge tone="gray">No reminders</Badge>}
                      <Badge tone="navy">{VACCINE_LABELS[r.vaccine] ?? titleCase(r.vaccine)} · Dose {r.dose}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      <span className="font-mono text-xs text-slate-400">{r.patient.mrn}</span>
                      <span className="text-slate-400"> · {ageFromDob(r.patient.dateOfBirth)}</span>
                      {r.patient.districtName && <span className="text-slate-400"> · {r.patient.districtName}</span>}
                      {r.patient.phone && <span className="text-slate-400"> · 📞 {r.patient.phone}</span>}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {r.description} — was due <span className="font-semibold text-g-ink">{fmtDate(r.missedSince)}</span> (last dose {fmtDate(r.lastGivenAt)})
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    <Button size="sm" variant="navy" loading={busy === r.id} onClick={() => openRecord({ patient: r.patient, vaccine: r.vaccine, dose: r.dose })}>
                      Record dose
                    </Button>
                    <Button size="sm" variant="outline" loading={busy === `remind-${r.id}`} onClick={() => void remind(r.id)}>Remind</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {/* -------------------------------------------------- registry */}
      {tab === 'registry' && (
        !registry ? <Spinner label="Loading registry…" />
        : registry.length === 0 ? (
          <EmptyState icon="syringe" title="No doses recorded" message="Doses you record will appear here." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 font-semibold">Patient</th>
                  <th className="px-4 py-3 font-semibold">Vaccine</th>
                  <th className="px-4 py-3 font-semibold">Dose</th>
                  <th className="px-4 py-3 font-semibold">Given</th>
                  <th className="px-4 py-3 font-semibold">Next due</th>
                  <th className="px-4 py-3 font-semibold">Batch</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {registry.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-g-mist/40">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-g-ink">{r.patient?.fullName ?? '—'}</span>
                      <span className="block font-mono text-xs text-slate-400">{r.patient?.mrn}</span>
                    </td>
                    <td className="px-4 py-3">{VACCINE_LABELS[r.vaccine] ?? titleCase(r.vaccine)}</td>
                    <td className="px-4 py-3"><Badge tone="navy">Dose {r.dose}</Badge></td>
                    <td className="px-4 py-3 text-slate-600">{fmtDate(r.administeredAt)}</td>
                    <td className="px-4 py-3 text-slate-600">{fmtDate(r.nextDueAt)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.batch ?? '—'}</td>
                    <td className="px-4 py-3"><Badge tone={r.status === 'GIVEN' ? 'green' : 'red'}>{titleCase(r.status)}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* --------------------------------------------------- coverage */}
      {tab === 'coverage' && (
        <Card title="Coverage by dose" subtitle="Dose-level coverage within your scope — denominators are children old enough for each dose." pad={false}>
          <div className="p-5">
            <ImmunizationCoverage />
          </div>
        </Card>
      )}

      {/* --------------------------------------------------- schedule */}
      {tab === 'schedule' && (
        !schedule ? <Spinner label="Loading schedule…" />
        : (
          <Card title="Ghana EPI schedule" subtitle="Due ages for each vaccine dose — child doses are measured from date of birth." pad={false}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 font-semibold">Vaccine</th>
                  <th className="px-4 py-3 font-semibold">Dose</th>
                  <th className="px-4 py-3 font-semibold">Due</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((s, i) => {
                  const isFirst = i === 0 || schedule[i - 1]!.vaccine !== s.vaccine;
                  return (
                    <tr key={`${s.vaccine}-${s.dose}`} className={`border-b border-slate-100 last:border-0 hover:bg-g-mist/40 ${isFirst ? 'bg-g-mist/30' : ''}`}>
                      <td className="px-4 py-2.5 font-semibold text-g-ink">
                        {isFirst ? VACCINE_LABELS[s.vaccine] ?? titleCase(s.vaccine) : ''}
                      </td>
                      <td className="px-4 py-2.5"><Badge tone="navy">Dose {s.dose}</Badge></td>
                      <td className="px-4 py-2.5 text-slate-600">{s.label}</td>
                      <td className="px-4 py-2.5 text-slate-600">{s.description}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )
      )}

      {/* --------------------------------------------- reminder report */}
      {tab === 'report' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={reportDays} onChange={(e) => setReportDays(e.target.value)} className="w-32">
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </Select>
            <Button size="sm" variant="outline" loading={exporting === 'report'} onClick={() => void exportReminderReport()}>Export CSV</Button>
          </div>
          {!report ? <Spinner label="Loading reminder report…" /> : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Attempted" value={report.totals.attempted} icon="send" tone="navy" hint="recall dispatches in window" />
              <StatCard label="Dispatched" value={report.totals.dispatched} icon="check" tone="green" hint="accepted by the gateway" />
              <StatCard label="Rejected / no phone" value={report.totals.rejected + report.totals.noPhone + report.totals.notConnected} icon="alert" tone="red" hint="could not be sent" />
              <StatCard label="Opted out" value={report.totals.optedOut} icon="bell" tone="gold" hint="families who declined recalls — never contacted" />
            </div>
          )}
          {report && (
            <Card title="Reminder reach by district" subtitle={`Where recalls (and opt-outs) happened in the last ${report.windowDays} days — region roll-up in the header chips.`} pad={false}>
              {Object.keys(report.byDistrict).length === 0 ? (
                <EmptyState icon="map" title="No activity in this window" message="Dispatch reminders or record opt-outs to see the geographic breakdown." />
              ) : (
                <div className="p-4">
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {Object.entries(report.byRegion).sort((a, b) => b[1] - a[1]).map(([r, n]) => (
                      <Badge key={r} tone="navy">{r} · {n}</Badge>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {Object.entries(report.byDistrict).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([d, n], _idx, arr) => {
                      const max = Math.max(1, ...arr.map(([, x]) => x));
                      return (
                        <div key={d} className="flex items-center gap-3 text-sm">
                          <span className="w-40 shrink-0 truncate text-slate-600">{d}</span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-g-navy transition-all" style={{ width: `${Math.round((n / max) * 100)}%` }} />
                          </div>
                          <span className="w-8 text-right font-semibold text-g-ink">{n}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          )}
          {report && (
            <Card title="Recent reminder runs" subtitle={`Who was reminded, on which channel, and the outcome — drill-downable by district.`} pad={false}>
              {report.recent.length === 0 ? (
                <EmptyState icon="clock" title="No reminder runs in this window" message="Dispatch reminders from the Due & overdue worklist to populate this report." />
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-4 py-3 font-semibold">When</th>
                      <th className="px-4 py-3 font-semibold">District</th>
                      <th className="px-4 py-3 font-semibold">Channel</th>
                      <th className="px-4 py-3 font-semibold">Provider</th>
                      <th className="px-4 py-3 font-semibold">Outcome</th>
                      <th className="px-4 py-3 font-semibold">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.recent.map((r, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-g-mist/40">
                        <td className="px-4 py-2.5 text-slate-600">{fmtDate(r.at)}</td>
                        <td className="px-4 py-2.5 text-slate-500">{r.district ?? '—'}</td>
                        <td className="px-4 py-2.5"><Badge tone={r.channel === 'WHATSAPP' ? 'green' : 'navy'}>{r.channel}</Badge></td>
                        <td className="px-4 py-2.5 text-slate-600">{r.provider}</td>
                        <td className="px-4 py-2.5">
                          {r.action === 'immunization.remind.optedOut'
                            ? <Badge tone="gold">opted out</Badge>
                            : <Badge tone={r.dispatched ? 'green' : 'red'}>{r.dispatched ? 'dispatched' : 'not dispatched'}</Badge>}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">{r.note ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
