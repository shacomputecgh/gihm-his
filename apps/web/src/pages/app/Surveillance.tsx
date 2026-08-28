import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { api } from '../../lib/api';
import type { CaseFollowUp, SurveillanceCase, SurveillanceSummary } from '../../types';
import { Badge, Button, Card, Drawer, EmptyState, Field, Input, PageHeader, Select, Spinner, useToast } from '../../components/ui';
import { exportCsv } from '../../lib/constants';
import { fmtDate, titleCase } from '../../lib/format';
import { useAuth } from '../../lib/auth';
import { getOutbreakThreshold } from '../../lib/constants';
import ContactTracing from '../../components/ContactTracing';
import PatientLocationTracker from '../../components/PatientLocationTracker';

type Tab = 'register' | 'contact-tracing' | 'location';

const STATUS_TONE: Record<string, 'red' | 'gold' | 'green' | 'gray'> = { OPEN: 'red', INVESTIGATED: 'gold', CLOSED: 'green' };
const CASE_TYPE_TONE: Record<string, 'navy' | 'gold' | 'gray'> = { CONFIRMED: 'navy', SUSPECTED: 'gold' };
const SEVERITY_TONE: Record<string, 'red' | 'gold' | 'green' | 'gray'> = { CRITICAL: 'red', SEVERE: 'red', MODERATE: 'gold', MILD: 'green' };
const FOLLOWUP_TONE: Record<string, 'green' | 'gold' | 'red' | 'navy' | 'gray'> = { RECOVERED: 'green', IMPROVING: 'green', STABLE: 'navy', WORSENING: 'gold', DECEASED: 'red' };
const OUTCOMES = ['RECOVERED', 'DECEASED', 'STABLE', 'REFERRED'];
const FOLLOW_UP_STATUSES = ['STABLE', 'IMPROVING', 'WORSENING', 'RECOVERED', 'DECEASED'];
const SEVERITIES = ['', 'MILD', 'MODERATE', 'SEVERE', 'CRITICAL'];

interface PatientHit {
  id: string;
  fullName: string;
  mrn: string;
  sex: string | null;
  dateOfBirth: string | null;
}

export default function Surveillance() {
  const { user } = useAuth();
  const canManage = !!user?.permissions.includes('manage_surveillance');
  const canView = canManage || !!user?.permissions.includes('view_surveillance');
  const toast = useToast();

  const [cases, setCases] = useState<SurveillanceCase[] | null>(null);
  const [summary, setSummary] = useState<SurveillanceSummary | null>(null);
  const [filters, setFilters] = useState({ q: '', status: '', caseType: '', severity: '' });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('register');

  // Report form
  const [form, setForm] = useState({
    disease: '',
    caseType: 'SUSPECTED',
    severity: 'MILD',
    notes: '',
    reportedAt: '',
  });
  const [facilityId, setFacilityId] = useState(user?.facilityId ?? '');
  // Optional patient linking — search the register by MRN/name and pick a hit.
  const [patientQuery, setPatientQuery] = useState('');
  const [patientHits, setPatientHits] = useState<PatientHit[] | null>(null);
  const [patient, setPatient] = useState<PatientHit | null>(null);

  // Detail drawer
  const [detail, setDetail] = useState<{ case: SurveillanceCase; followUps: CaseFollowUp[] } | null>(null);
  const [closeOutcome, setCloseOutcome] = useState('RECOVERED');
  const [followUp, setFollowUp] = useState({ status: 'STABLE', temperature: '', contactsTraced: '0', notes: '' });

  const load = useCallback(async () => {
    const q = new URLSearchParams();
    if (filters.q) q.set('q', filters.q);
    if (filters.status) q.set('status', filters.status);
    if (filters.caseType) q.set('caseType', filters.caseType);
    if (filters.severity) q.set('severity', filters.severity);
    const res = await api<{ items: SurveillanceCase[] }>(`/surveillance/cases?${q.toString()}`);
    setCases(res.items);
  }, [filters]);

  const loadSummary = useCallback(async () => {
    setSummary(await api<SurveillanceSummary>('/surveillance/cases/summary'));
  }, []);

  useEffect(() => {
    if (!canView) return;
    void load().catch(() => undefined);
    void loadSummary().catch(() => undefined);
  }, [load, loadSummary, canView]);

  const refresh = useCallback(() => {
    void load().catch(() => undefined);
    void loadSummary().catch(() => undefined);
  }, [load, loadSummary]);

  async function searchPatients() {
    if (patientQuery.trim().length < 2) return;
    try {
      const res = await api<{ items: PatientHit[] }>(`/patients?q=${encodeURIComponent(patientQuery.trim())}&pageSize=6`);
      setPatientHits(res.items);
      if (res.items.length === 0) toast('No patients match that search', 'error');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Search failed', 'error');
    }
  }

  async function reportCase(e: FormEvent) {
    e.preventDefault();
    setBusyId('new');
    try {
      const body: Record<string, unknown> = {
        facilityId,
        disease: form.disease,
        caseType: form.caseType,
        severity: form.severity || undefined,
        notes: form.notes || undefined,
        reportedAt: form.reportedAt || undefined,
      };
      if (patient) body.patientId = patient.id;
      await api('/surveillance/cases', { method: 'POST', body });
      toast(`Case reported — ${form.disease}`, 'success');
      setForm({ disease: '', caseType: 'SUSPECTED', severity: 'MILD', notes: '', reportedAt: '' });
      setPatient(null);
      setPatientHits(null);
      setPatientQuery('');
      refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Reporting failed', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function openDetail(id: string) {
    setDetail(null);
    try {
      const res = await api<{ case: SurveillanceCase; followUps: CaseFollowUp[] }>(`/surveillance/cases/${id}`);
      setDetail(res);
      setCloseOutcome(res.case.outcome ?? 'RECOVERED');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not load case', 'error');
    }
  }

  async function transition(nextStatus: string, outcome?: string) {
    if (!detail) return;
    setBusyId(`t-${nextStatus}`);
    try {
      await api(`/surveillance/cases/${detail.case.id}`, { method: 'PATCH', body: { status: nextStatus, outcome } });
      toast(nextStatus === 'CLOSED' ? 'Case closed' : `Case moved to ${titleCase(nextStatus)}`, 'success');
      await openDetail(detail.case.id);
      refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function addFollowUp(e: FormEvent) {
    e.preventDefault();
    if (!detail) return;
    setBusyId(`fu-${detail.case.id}`);
    try {
      await api(`/surveillance/cases/${detail.case.id}/follow-ups`, {
        method: 'POST',
        body: {
          status: followUp.status,
          temperature: followUp.temperature ? Number(followUp.temperature) : undefined,
          contactsTraced: Number(followUp.contactsTraced) || 0,
          notes: followUp.notes || undefined,
        },
      });
      toast('Follow-up recorded', 'success');
      setFollowUp({ status: 'STABLE', temperature: '', contactsTraced: '0', notes: '' });
      await openDetail(detail.case.id);
      refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not record follow-up', 'error');
    } finally {
      setBusyId(null);
    }
  }

  const statCards = useMemo(() => {
    const t = summary?.totals;
    return [
      { label: 'Open cases', value: String(t?.open ?? 0), sub: `${t?.closed ?? 0} closed to date`, tone: 'red' as const },
      { label: 'Confirmed', value: String(t?.confirmed ?? 0), sub: `${t?.suspected ?? 0} suspected awaiting lab`, tone: 'navy' as const },
      { label: 'Follow-up rate', value: `${t?.followUpRate ?? 0}%`, sub: `${t?.followUps ?? 0} follow-ups · ${t?.contactsTraced ?? 0} contacts traced`, tone: 'green' as const },
      { label: 'Deaths', value: String(t?.deaths ?? 0), sub: 'reported case outcomes', tone: 'gold' as const },
    ];
  }, [summary]);

  const outbreakThreshold = getOutbreakThreshold();
  const outbreak = useMemo(() => summary?.byDisease.find((d) => d.open >= outbreakThreshold), [summary, outbreakThreshold]);
  const maxTrend = useMemo(() => Math.max(1, ...(summary?.trend.map((p) => p.count) ?? [1])), [summary]);

  if (!canView) return <EmptyState icon="activity" title="No access" message="Disease surveillance requires the View disease surveillance permission." />;

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
          title="Add New Surveillance Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Disease Surveillance" subtitle="Reportable conditions, outbreak indicators and contact-tracing follow-ups — DHIMS-aligned case definitions." action={<div className="flex items-center gap-2">
        {canManage && <Badge tone="navy">{summary?.totals.cases ?? 0} cases in scope</Badge>}
        {cases && cases.length > 0 && (
          <Button size="sm" variant="outline" icon="download" onClick={() => exportCsv(cases.map((c) => ({ Disease: c.disease, Type: c.caseType, Severity: c.severity ?? '', Status: c.status, Outcome: c.outcome ?? '', Patient: c.patient?.fullName ?? 'Community', MRN: c.patient?.mrn ?? '', Facility: c.facility?.name ?? '', Reported: c.reportedAt, 'Follow-ups': c.followUpCount })), 'surveillance-cases')}>Export CSV</Button>
        )}
      </div>} />

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        {([
          { key: 'register' as Tab, label: 'Case Register', icon: '📋' },
          { key: 'contact-tracing' as Tab, label: 'Contact Tracing', icon: '🔗' },
          { key: 'location' as Tab, label: 'Location Tracking', icon: '📍' },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium transition ${activeTab === t.key ? 'bg-white text-g-ink shadow-sm' : 'text-slate-500 hover:text-g-ink'}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'contact-tracing' && (
        <ContactTracing disease={outbreak?.disease} />
      )}

      {activeTab === 'location' && (
        <PatientLocationTracker />
      )}

      {activeTab === 'register' && (
        <>
      {outbreak && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-g-gold/40 bg-g-gold/10 p-4">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-bold text-g-ink">Possible outbreak — {outbreak.disease}</p>
            <p className="text-sm text-slate-600">{outbreak.open} open case(s) on the register. Confirm lab results, intensify contact tracing and escalate to the district health management team per the outbreak protocol.</p>
          </div>
        </div>
      )}

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

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {/* 30-day trend */}
        <Card title="Cases reported — last 30 days" subtitle="Reported case volume by day (all scoped facilities)" className="lg:col-span-2">
          {!summary ? (
            <div className="py-8"><Spinner /></div>
          ) : (
            <div className="flex h-32 items-end gap-1">
              {summary.trend.map((p) => (
                <div key={p.date} className="group relative flex-1" title={`${p.date}: ${p.count}`}>
                  <div
                    className={`w-full rounded-t ${p.count >= 3 ? 'bg-g-red' : p.count > 0 ? 'bg-g-navy' : 'bg-slate-100'}`}
                    style={{ height: `${Math.max(4, (p.count / maxTrend) * 100)}%` }}
                  />
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
            <span>{summary?.trend[0]?.date}</span>
            <span>today</span>
          </div>
        </Card>

        {/* Disease breakdown */}
        <Card title="By disease" subtitle="Count · confirmed · open (hover for detail)">
          {!summary ? (
            <div className="py-8"><Spinner /></div>
          ) : summary.byDisease.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No cases reported.</p>
          ) : (
            <div className="space-y-2.5">
              {summary.byDisease.map((d) => (
                <div key={d.disease} className="group" title={`${d.confirmed} confirmed · ${d.open} open`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-g-ink">{d.disease}</span>
                    <span className="tabular-nums text-slate-500">{d.count}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${d.open >= outbreakThreshold ? 'bg-g-red' : 'bg-g-navy'}`} style={{ width: `${Math.max(4, (d.count / Math.max(1, summary.byDisease[0]?.count ?? 1)) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {summary && summary.byRegion && Object.keys(summary.byRegion).length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">By region</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(summary.byRegion).map(([region, count]) => (
                  <Badge key={region} tone="navy">{region} · {count}</Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Register */}
      <div className="mt-5 mb-4 flex flex-wrap items-center gap-3">
        <Input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} placeholder="Search disease, patient, MRN…" className="w-64" />
        <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="w-40">
          {['', 'OPEN', 'INVESTIGATED', 'CLOSED'].map((s) => <option key={s} value={s}>{s === '' ? 'All statuses' : titleCase(s)}</option>)}
        </Select>
        <Select value={filters.caseType} onChange={(e) => setFilters({ ...filters, caseType: e.target.value })} className="w-40">
          {['', 'SUSPECTED', 'CONFIRMED'].map((s) => <option key={s} value={s}>{s === '' ? 'All case types' : titleCase(s)}</option>)}
        </Select>
        <Select value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: e.target.value })} className="w-40">
          {SEVERITIES.map((s) => <option key={s} value={s}>{s === '' ? 'All severities' : titleCase(s)}</option>)}
        </Select>
      </div>

      <Card pad={false}>
        {!cases ? (
          <div className="p-10"><Spinner /></div>
        ) : cases.length === 0 ? (
          <EmptyState icon="activity" title="No cases" message="No disease cases match this filter — report one to start the register." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
                  {['Patient / report', 'Disease', 'Severity', 'Facility', 'Reported', 'Follow-ups', 'Status', ''].map((h) => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {cases.map((c) => (
                  <tr key={c.id} className="cursor-pointer hover:bg-g-mist/40" onClick={() => void openDetail(c.id)}>
                    <td className="px-5 py-3">
                      {c.patient ? (
                        <>
                          <p className="font-semibold text-g-ink">{c.patient.fullName}</p>
                          <p className="text-xs text-slate-400">MRN {c.patient.mrn}</p>
                        </>
                      ) : (
                        <p className="font-medium text-slate-500">Community report</p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-g-ink">{c.disease}</p>
                      <Badge tone={CASE_TYPE_TONE[c.caseType] ?? 'gray'}>{titleCase(c.caseType)}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      {c.severity ? <Badge tone={SEVERITY_TONE[c.severity] ?? 'gray'}>{titleCase(c.severity)}</Badge> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      <p className="max-w-[180px] truncate">{c.facility?.name ?? '—'}</p>
                      {c.facility?.district && <p className="text-xs text-slate-400">{c.facility.district}</p>}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{fmtDate(c.reportedAt)}</td>
                    <td className="px-5 py-3 text-slate-500">{c.followUpCount}</td>
                    <td className="px-5 py-3">
                      <Badge tone={STATUS_TONE[c.status] ?? 'gray'}>{titleCase(c.status)}</Badge>
                      {c.outcome && <p className="mt-1 text-xs text-slate-400">{titleCase(c.outcome)}</p>}
                    </td>
                    <td className="px-5 py-3 text-slate-300">→</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Report a case */}
      {canManage && (
        <Card title="Report a case" subtitle="Register a suspected or confirmed case of a reportable condition at your facility. District/regional teams report for any facility in their geography." className="mt-5">
          <form onSubmit={reportCase} className="grid gap-3 md:grid-cols-4">
            <Field label="Disease"><Input required value={form.disease} onChange={(e) => setForm({ ...form, disease: e.target.value })} placeholder="e.g. Cholera, Measles, AFP" /></Field>
            <Field label="Case type">
              <Select value={form.caseType} onChange={(e) => setForm({ ...form, caseType: e.target.value })}>
                <option value="SUSPECTED">Suspected</option>
                <option value="CONFIRMED">Confirmed</option>
              </Select>
            </Field>
            <Field label="Severity">
              <Select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                {SEVERITIES.filter(Boolean).map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
              </Select>
            </Field>
            <Field label="Reported on"><Input type="date" value={form.reportedAt} onChange={(e) => setForm({ ...form, reportedAt: e.target.value })} /></Field>
            {!user?.facilityId && (
              <Field label="Facility ID (required)"><Input required value={facilityId} onChange={(e) => setFacilityId(e.target.value)} placeholder="Facility id" /></Field>
            )}
            <Field label="Link patient (optional)" className="md:col-span-2">
              <div className="flex gap-2">
                <Input value={patientQuery} onChange={(e) => setPatientQuery(e.target.value)} placeholder="MRN or name" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void searchPatients(); } }} />
                <Button type="button" variant="outline" onClick={() => void searchPatients()}>Search</Button>
              </div>
              {patient ? (
                <div className="mt-1 flex items-center justify-between rounded-lg border border-g-green/30 bg-g-green/10 px-3 py-1.5">
                  <span className="text-sm text-g-ink">{patient.fullName} · <span className="font-mono text-xs">{patient.mrn}</span></span>
                  <button type="button" className="cursor-pointer text-xs font-bold text-g-red" onClick={() => setPatient(null)}>Remove</button>
                </div>
              ) : patientHits && patientHits.length > 0 ? (
                <div className="mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                  {patientHits.map((p) => (
                    <button key={p.id} type="button" className="block w-full cursor-pointer px-3 py-1.5 text-left text-sm hover:bg-g-mist" onClick={() => { setPatient(p); setPatientHits(null); }}>
                      <span className="font-medium text-g-ink">{p.fullName}</span> <span className="font-mono text-xs text-slate-400">{p.mrn}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </Field>
            <Field label="Notes" className="md:col-span-2"><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Onset, symptoms, exposure history…" /></Field>
            <div className="flex items-end justify-end md:col-span-4"><Button type="submit" loading={busyId === 'new'} icon="plus">Report case</Button></div>
          </form>
        </Card>
      )}

      {/* Detail drawer */}
      {detail && (
        <Drawer onClose={() => setDetail(null)}>
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-white p-5">
              <div>
                <div className="flex items-center gap-2">
                  <Badge tone={STATUS_TONE[detail.case.status] ?? 'gray'}>{titleCase(detail.case.status)}</Badge>
                  <Badge tone={CASE_TYPE_TONE[detail.case.caseType] ?? 'gray'}>{titleCase(detail.case.caseType)}</Badge>
                  {detail.case.severity && <Badge tone={SEVERITY_TONE[detail.case.severity] ?? 'gray'}>{titleCase(detail.case.severity)}</Badge>}
                </div>
                <h3 className="mt-2 text-xl font-bold text-g-ink">{detail.case.disease}</h3>
                <p className="text-sm text-slate-500">
                  {detail.case.patient ? `${detail.case.patient.fullName} · MRN ${detail.case.patient.mrn}` : 'Community report'} — reported {fmtDate(detail.case.reportedAt)}
                </p>
                <p className="text-xs text-slate-400">{detail.case.facility?.name ?? 'Unknown facility'}{detail.case.facility?.region ? ` · ${detail.case.facility.region}` : ''} · by {detail.case.reporter?.fullName ?? 'unknown'}</p>
              </div>
              <button onClick={() => setDetail(null)} className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-g-ink">✕</button>
            </div>

            <div className="space-y-5 p-5">
              {detail.case.notes && (
                <div className="rounded-xl bg-g-mist p-4 text-sm text-slate-600">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Case notes</p>
                  {detail.case.notes}
                </div>
              )}
              {detail.case.outcome && (
                <div className="rounded-xl border border-slate-100 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Outcome</p>
                  <Badge tone={FOLLOWUP_TONE[detail.case.outcome] ?? 'gray'}>{titleCase(detail.case.outcome)}</Badge>
                </div>
              )}

              {/* Workflow actions */}
              {canManage && detail.case.status !== 'CLOSED' && (
                <div className="rounded-xl border border-slate-100 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Case workflow</p>
                  <div className="flex flex-wrap gap-2">
                    {detail.case.status === 'OPEN' && (
                      <Button variant="outline" size="sm" loading={busyId === 't-INVESTIGATED'} onClick={() => void transition('INVESTIGATED')}>Mark investigated</Button>
                    )}
                    {detail.case.status === 'INVESTIGATED' && (
                      <Button variant="outline" size="sm" loading={busyId === 't-OPEN'} onClick={() => void transition('OPEN')}>Reopen</Button>
                    )}
                    <div className="flex items-center gap-2">
                      <Select value={closeOutcome} onChange={(e) => setCloseOutcome(e.target.value)} className="w-40">
                        {OUTCOMES.map((o) => <option key={o} value={o}>{titleCase(o)}</option>)}
                      </Select>
                      <Button size="sm" loading={busyId === 't-CLOSED'} onClick={() => void transition('CLOSED', closeOutcome)}>Close case</Button>
                    </div>
                  </div>
                </div>
              )}
              {canManage && detail.case.status === 'CLOSED' && (
                <div className="rounded-xl border border-slate-100 p-4">
                  <Button variant="outline" size="sm" loading={busyId === 't-OPEN'} onClick={() => void transition('OPEN')}>Reopen case</Button>
                </div>
              )}

              {/* Follow-up timeline */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Contact tracing & follow-ups</p>
                {detail.followUps.length === 0 ? (
                  <p className="py-3 text-sm text-slate-400">No follow-ups recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {detail.followUps.map((f) => (
                      <div key={f.id} className="rounded-xl border border-slate-100 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge tone={FOLLOWUP_TONE[f.status] ?? 'gray'}>{titleCase(f.status)}</Badge>
                            {f.temperature !== null && <span className="text-sm tabular-nums text-slate-500">{f.temperature.toFixed(1)} °C</span>}
                            {f.contactsTraced > 0 && <span className="text-xs text-slate-400">👥 {f.contactsTraced} contacts</span>}
                          </div>
                          <span className="text-xs text-slate-400">{fmtDate(f.followUpAt)}</span>
                        </div>
                        {f.notes && <p className="mt-1.5 text-sm text-slate-600">{f.notes}</p>}
                        {f.by && <p className="mt-1 text-xs text-slate-400">by {f.by.fullName}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Record follow-up */}
              {canManage && (
                <form onSubmit={addFollowUp} className="rounded-xl border border-slate-100 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Record follow-up</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Field label="Condition">
                      <Select value={followUp.status} onChange={(e) => setFollowUp({ ...followUp, status: e.target.value })}>
                        {FOLLOW_UP_STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
                      </Select>
                    </Field>
                    <Field label="Temp (°C)"><Input type="number" step="0.1" min={30} max={45} value={followUp.temperature} onChange={(e) => setFollowUp({ ...followUp, temperature: e.target.value })} placeholder="37.0" /></Field>
                    <Field label="Contacts traced"><Input type="number" min={0} value={followUp.contactsTraced} onChange={(e) => setFollowUp({ ...followUp, contactsTraced: e.target.value })} /></Field>
                  </div>
                  <Field label="Notes" className="mt-2"><Input value={followUp.notes} onChange={(e) => setFollowUp({ ...followUp, notes: e.target.value })} placeholder="Condition since last visit, contacts visited…" /></Field>
                  <div className="mt-3 flex justify-end"><Button type="submit" size="sm" loading={busyId === `fu-${detail.case.id}`} icon="plus">Record</Button></div>
                </form>
              )}
            </div>
        </Drawer>
      )}
      </>
      )}
    </div>
  );
}
