import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { api } from '../../lib/api';
import type { InsuranceClaim, InsuranceScheme, InsuranceSummary, PatientInsurance } from '../../types';
import { Badge, Button, Card, EmptyState, Field, Icon, Input, PageHeader, Segmented, Select, Spinner, useToast } from '../../components/ui';
import { cedis, fmtDate, fmtDateTime, titleCase, todayIso } from '../../lib/format';
import { useAuth } from '../../lib/auth';

type Tab = 'overview' | 'memberships' | 'schemes';

const STATUS_TONE: Record<string, 'green' | 'gold' | 'red' | 'navy' | 'gray' | 'blue'> = {
  SUBMITTED: 'gold',
  APPROVED: 'navy',
  PARTIALLY_APPROVED: 'blue',
  REJECTED: 'red',
  PAID: 'green',
  ACTIVE: 'green',
  EXPIRED: 'gray',
  SUSPENDED: 'gold',
  CANCELLED: 'red',
};

interface PatientHit {
  id: string;
  fullName: string;
  mrn: string;
}

export default function Insurance() {
  const { user } = useAuth();
  const toast = useToast();
  const canDecide = !!user?.permissions.includes('process_payment');
  const canEnroll = !!user?.permissions.includes('edit_patient') || canDecide;
  const isNational = user?.scope === 'NATIONAL';
  const canManageSchemes = isNational && !!user?.permissions.includes('manage_facility');
  const [tab, setTab] = useState<Tab>('overview');

  const [summary, setSummary] = useState<InsuranceSummary | null>(null);
  const [claims, setClaims] = useState<InsuranceClaim[] | null>(null);
  const [claimFilter, setClaimFilter] = useState('ALL');
  const [schemes, setSchemes] = useState<InsuranceScheme[]>([]);
  const [memberships, setMemberships] = useState<(PatientInsurance & { patient: PatientHit })[] | null>(null);

  const loadSummary = useCallback(async () => {
    setSummary(await api<InsuranceSummary>('/insurance/summary'));
  }, []);

  const loadClaims = useCallback(async () => {
    const q = claimFilter === 'ALL' ? '' : `?status=${claimFilter}`;
    const res = await api<{ claims: InsuranceClaim[] }>(`/insurance/claims${q}`);
    setClaims(res.claims);
  }, [claimFilter]);

  const loadSchemes = useCallback(async () => {
    const res = await api<{ schemes: InsuranceScheme[] }>('/insurance/schemes');
    setSchemes(res.schemes);
  }, []);

  const loadMemberships = useCallback(async () => {
    const res = await api<{ memberships: (PatientInsurance & { patient: PatientHit })[] }>('/insurance/memberships');
    setMemberships(res.memberships);
  }, []);

  useEffect(() => {
    void loadSummary().catch(() => undefined);
    void loadSchemes().catch(() => undefined);
  }, [loadSummary, loadSchemes]);
  useEffect(() => {
    void loadClaims().catch(() => undefined);
  }, [loadClaims]);
  useEffect(() => {
    if (tab === 'memberships') void loadMemberships().catch(() => undefined);
  }, [tab, loadMemberships]);

  // ------------------------------------------------------- claims actions
  const [decisionBusy, setDecisionBusy] = useState<string | null>(null);
  const [decide, setDecide] = useState<Record<string, { status: string; amount: string }>>({});

  async function decideClaim(claim: InsuranceClaim, status: string) {
    setDecisionBusy(claim.id);
    try {
      const body: Record<string, unknown> = { status };
      if (status === 'PARTIALLY_APPROVED') {
        const amount = Number(decide[claim.id]?.amount);
        if (!amount || amount <= 0 || amount >= claim.amount) {
          toast('Enter an approved amount below the claim total', 'error');
          return;
        }
        body.approvedAmount = amount;
      }
      await api(`/insurance/claims/${claim.id}/decision`, { method: 'PUT', body });
      toast(`Claim ${titleCase(status)}`, 'success');
      void loadClaims();
      void loadSummary();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Decision failed', 'error');
    } finally {
      setDecisionBusy(null);
    }
  }

  // ---------------------------------------------------------- new claim
  const [claimForm, setClaimForm] = useState({ patientId: '', patientLabel: '', schemeId: '', serviceDate: todayIso(), items: [{ description: '', amount: '' }] });
  const [patientQ, setPatientQ] = useState('');
  const [patientHits, setPatientHits] = useState<PatientHit[]>([]);
  const [searching, setSearching] = useState(false);

  async function searchPatients(q: string) {
    setPatientQ(q);
    if (q.trim().length < 2) {
      setPatientHits([]);
      return;
    }
    setSearching(true);
    try {
      const res = await api<{ patients: PatientHit[] }>(`/patients?q=${encodeURIComponent(q)}`);
      setPatientHits(res.patients);
    } catch {
      setPatientHits([]);
    } finally {
      setSearching(false);
    }
  }

  async function submitClaim(e: FormEvent) {
    e.preventDefault();
    const items = claimForm.items
      .map((it) => ({ description: it.description.trim(), amount: Number(it.amount) || 0 }))
      .filter((it) => it.description && it.amount > 0);
    if (!claimForm.patientId || !claimForm.schemeId || items.length === 0 || !user?.facilityId) {
      toast('Patient, scheme and at least one item are required', 'error');
      return;
    }
    try {
      await api('/insurance/claims', {
        method: 'POST',
        body: {
          patientId: claimForm.patientId,
          schemeId: claimForm.schemeId,
          facilityId: user.facilityId,
          serviceDate: claimForm.serviceDate || undefined,
          items,
          amount: items.reduce((acc, it) => acc + it.amount, 0),
        },
      });
      toast('Claim submitted to insurer', 'success');
      setClaimForm({ patientId: '', patientLabel: '', schemeId: '', serviceDate: todayIso(), items: [{ description: '', amount: '' }] });
      setPatientQ('');
      void loadClaims();
      void loadSummary();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Claim submission failed', 'error');
    }
  }

  // -------------------------------------------------------- enrollment
  const [enroll, setEnroll] = useState({ patientId: '', patientLabel: '', schemeId: '', membershipNumber: '', relationship: 'SELF', holderName: '', validTo: '', notes: '' });
  const [enrollPatientQ, setEnrollPatientQ] = useState('');
  const [enrollHits, setEnrollHits] = useState<PatientHit[]>([]);
  const [enrollBusy, setEnrollBusy] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState<string | null>(null);

  async function searchEnrollPatients(q: string) {
    setEnrollPatientQ(q);
    if (q.trim().length < 2) {
      setEnrollHits([]);
      return;
    }
    try {
      const res = await api<{ patients: PatientHit[] }>(`/patients?q=${encodeURIComponent(q)}`);
      setEnrollHits(res.patients);
    } catch {
      setEnrollHits([]);
    }
  }

  async function enrollPatient(e: FormEvent) {
    e.preventDefault();
    if (!enroll.patientId || !enroll.schemeId || !enroll.membershipNumber.trim()) {
      toast('Patient, scheme and membership number are required', 'error');
      return;
    }
    setEnrollBusy(true);
    try {
      await api(`/patients/${enroll.patientId}/insurance`, {
        method: 'POST',
        body: { schemeId: enroll.schemeId, membershipNumber: enroll.membershipNumber, relationship: enroll.relationship, holderName: enroll.holderName || undefined, validTo: enroll.validTo || undefined, notes: enroll.notes || undefined },
      });
      toast('Patient enrolled', 'success');
      setEnroll({ patientId: '', patientLabel: '', schemeId: '', membershipNumber: '', relationship: 'SELF', holderName: '', validTo: '', notes: '' });
      setEnrollPatientQ('');
      void loadMemberships();
      void loadSummary();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Enrollment failed', 'error');
    } finally {
      setEnrollBusy(false);
    }
  }

  async function verifyMembership(m: PatientInsurance) {
    setVerifyBusy(m.id);
    try {
      await api(`/insurance/memberships/${m.id}/verify`, { method: 'POST' });
      toast('Membership verified', 'success');
      void loadMemberships();
      void loadSummary();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Verification failed', 'error');
    } finally {
      setVerifyBusy(null);
    }
  }

  async function setMembershipStatus(m: PatientInsurance, status: string) {
    setVerifyBusy(m.id);
    try {
      await api(`/insurance/memberships/${m.id}`, { method: 'PUT', body: { status } });
      toast(`Membership ${titleCase(status)}`, 'success');
      void loadMemberships();
      void loadSummary();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setVerifyBusy(null);
    }
  }

  // ---------------------------------------------------------- schemes
  const [newScheme, setNewScheme] = useState({ code: '', name: '', type: 'PRIVATE', phone: '', email: '', notes: '' });
  const [schemeBusy, setSchemeBusy] = useState(false);

  async function createScheme(e: FormEvent) {
    e.preventDefault();
    setSchemeBusy(true);
    try {
      await api('/insurance/schemes', { method: 'POST', body: { ...newScheme, code: newScheme.code.trim(), name: newScheme.name.trim(), phone: newScheme.phone || undefined, email: newScheme.email || undefined, notes: newScheme.notes || undefined } });
      toast('Scheme registered', 'success');
      setNewScheme({ code: '', name: '', type: 'PRIVATE', phone: '', email: '', notes: '' });
      void loadSchemes();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setSchemeBusy(false);
    }
  }

  async function deactivateScheme(s: InsuranceScheme) {
    setSchemeBusy(true);
    try {
      await api(`/insurance/schemes/${s.id}/deactivate`, { method: 'POST' });
      toast(`${s.code} deactivated`, 'success');
      void loadSchemes();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setSchemeBusy(false);
    }
  }

  const pendingValue = useMemo(() => (summary?.claims.pending.amount ?? 0) + (summary?.claims.decidedPending.amount ?? 0), [summary]);
  const statCards = [
    { label: 'Active memberships', value: summary ? String(summary.coverage.activeMemberships) : '—', sub: `${summary?.coverage.totalMemberships ?? 0} total · ${summary?.coverage.verified ?? 0} verified`, tone: 'green' as const, icon: 'users' as const },
    { label: 'Expiring in 30 days', value: summary ? String(summary.coverage.expiringSoon) : '—', sub: 'renewals due', tone: 'gold' as const, icon: 'clock' as const },
    { label: 'Claims awaiting decision', value: summary ? String(summary.claims.pending.count + summary.claims.decidedPending.count) : '—', sub: `${cedis(pendingValue)} in the pipeline`, tone: 'navy' as const, icon: 'fileText' as const },
    { label: 'Paid this month', value: summary ? String(summary.claims.paidThisMonth.count) : '—', sub: cedis(summary?.claims.paidThisMonth.amount), tone: 'blue' as const, icon: 'check' as const },
  ];

  const TABS: { value: Tab; label: string }[] = [
    { value: 'overview', label: 'Overview' },
    { value: 'memberships', label: 'Memberships' },
    { value: 'schemes', label: `Schemes (${schemes.length})` },
  ];

  const filterOptions = ['ALL', 'SUBMITTED', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'PAID'];

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
          title="Add New Insurance Policy"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Insurance & Claims" subtitle="NHIS + private coverage, patient memberships and the insurer claim pipeline." action={summary ? <Badge tone={summary.claims.pending.count > 0 ? 'gold' : 'green'}>{summary.claims.pending.count} pending</Badge> : undefined} />

      <div className="mb-5"><Segmented options={TABS} value={tab} onChange={setTab} /></div>

      {tab === 'overview' && (
        <div className="space-y-5">
          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((s) => (
              <Card key={s.label} className="!p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{s.label}</p>
                    <p className="mt-2 text-3xl font-bold tabular-nums text-g-ink">{s.value}</p>
                    <p className="mt-1 text-xs text-slate-400">{s.sub}</p>
                  </div>
                  <span className={`rounded-xl p-2.5 ${s.tone === 'green' ? 'bg-g-green/15 text-g-green' : s.tone === 'gold' ? 'bg-g-gold/15 text-yellow-700' : s.tone === 'navy' ? 'bg-g-navy/10 text-g-navy' : 'bg-g-blue/15 text-g-blue'}`}>
                    <Icon name={s.icon} className="h-5 w-5" />
                  </span>
                </div>
              </Card>
            ))}
          </div>

          {/* Coverage by scheme */}
          {summary && summary.byScheme.length > 0 && (
            <Card title="Coverage by scheme" subtitle="Members and claim value per insurer (scoped to your facilities)">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {summary.byScheme.map((b) => (
                  <div key={b.scheme.id} className="rounded-xl border border-slate-100 bg-g-mist/40 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-g-ink">{b.scheme.name}</p>
                      <Badge tone={b.scheme.type === 'NHIS' ? 'navy' : b.scheme.type === 'CORPORATE' ? 'blue' : 'green'}>{b.scheme.type}</Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-white p-2"><p className="text-lg font-bold text-g-ink">{b.members}</p><p className="text-[10px] font-semibold uppercase text-slate-400">Members</p></div>
                      <div className="rounded-lg bg-white p-2"><p className="text-lg font-bold text-g-ink">{b.activeMembers}</p><p className="text-[10px] font-semibold uppercase text-slate-400">Active</p></div>
                      <div className="rounded-lg bg-white p-2"><p className="text-lg font-bold text-g-ink">{cedis(b.claimValue)}</p><p className="text-[10px] font-semibold uppercase text-slate-400">{b.claims} claims</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Claim pipeline */}
          <Card title="Claim pipeline" subtitle="Submitted to insurers — approve, partially approve, reject or mark paid." pad={false}>
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3">
              <span className="text-xs font-semibold text-slate-400">Status:</span>
              <div className="flex flex-wrap gap-1.5">
                {filterOptions.map((f) => (
                  <button key={f} onClick={() => setClaimFilter(f)} className={`cursor-pointer rounded-full px-3 py-1 text-xs font-bold transition ${claimFilter === f ? 'bg-g-navy text-white' : 'bg-g-mist text-slate-500 hover:bg-slate-200'}`}>
                    {f === 'ALL' ? 'All' : titleCase(f)}
                  </button>
                ))}
              </div>
            </div>
            {!claims ? (
              <div className="p-10"><Spinner /></div>
            ) : claims.length === 0 ? (
              <EmptyState icon="fileText" title="No claims" message="No insurance claims match this filter yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">{['Claim', 'Patient', 'Scheme', 'Service', 'Amount', 'Approved', 'Status', canDecide ? 'Decision' : null].filter(Boolean).map((h) => <th key={String(h)} className="px-5 py-3 font-semibold">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {claims.map((c) => (
                      <tr key={c.id} className="align-top hover:bg-g-mist/40">
                        <td className="px-5 py-3">
                          <p className="font-mono text-xs font-bold text-g-navy">{c.claimNumber}</p>
                          <p className="mt-0.5 text-xs text-slate-400">{fmtDateTime(c.createdAt)}</p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-semibold text-g-ink">{c.patient?.fullName ?? '—'}</p>
                          <p className="font-mono text-xs text-slate-400">{c.patient?.mrn ?? ''}</p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-slate-600">{c.scheme?.name ?? '—'}</p>
                          <p className="text-xs text-slate-400">{c.scheme?.type ?? ''}</p>
                        </td>
                        <td className="px-5 py-3 text-slate-500">{fmtDate(c.serviceDate)}</td>
                        <td className="px-5 py-3 font-semibold text-g-ink">{cedis(c.amount)}</td>
                        <td className="px-5 py-3 text-slate-500">{c.approvedAmount != null ? cedis(c.approvedAmount) : '—'}</td>
                        <td className="px-5 py-3"><Badge tone={STATUS_TONE[c.status] ?? 'gray'}>{titleCase(c.status)}</Badge></td>
                        {canDecide && (
                          <td className="px-5 py-3">
                            {c.status === 'SUBMITTED' && (
                              <div className="flex items-center gap-1.5">
                                <Select value={decide[c.id]?.status ?? ''} onChange={(e) => setDecide({ ...decide, [c.id]: { status: e.target.value, amount: decide[c.id]?.amount ?? '' } })} className="w-40">
                                  <option value="">Action…</option>
                                  <option value="APPROVED">Approve</option>
                                  <option value="PARTIALLY_APPROVED">Partially approve</option>
                                  <option value="REJECTED">Reject</option>
                                </Select>
                                {decide[c.id]?.status === 'PARTIALLY_APPROVED' && (
                                  <Input type="number" min={1} step="0.01" placeholder="Amount" value={decide[c.id]?.amount ?? ''} onChange={(e) => setDecide({ ...decide, [c.id]: { status: 'PARTIALLY_APPROVED', amount: e.target.value } })} className="w-28" />
                                )}
                                <Button size="sm" loading={decisionBusy === c.id} disabled={!decide[c.id]?.status} onClick={() => void decideClaim(c, decide[c.id]?.status ?? '')}>Apply</Button>
                              </div>
                            )}
                            {(c.status === 'APPROVED' || c.status === 'PARTIALLY_APPROVED') && (
                              <Button size="sm" variant="navy" loading={decisionBusy === c.id} onClick={() => void decideClaim(c, 'PAID')}>Mark paid</Button>
                            )}
                            {c.status === 'REJECTED' && c.decisionNote && <p className="max-w-[180px] text-xs text-slate-400">“{c.decisionNote}”</p>}
                            {c.status === 'PAID' && <p className="text-xs text-slate-400">{c.decidedBy ? `Paid by ${c.decidedBy}` : 'Paid'}</p>}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Submit claim */}
          {user?.facilityId && canDecide && (
            <Card title="Submit a claim" subtitle={`Billed to the insurer on behalf of ${schemes.find((s) => s.id === claimForm.schemeId)?.name ?? 'the scheme'} — an active membership is required.`}>
              <form onSubmit={submitClaim} className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <Field label="Patient" className="relative">
                    <Input value={patientQ || claimForm.patientLabel} onChange={(e) => { setClaimForm({ ...claimForm, patientId: '', patientLabel: '' }); void searchPatients(e.target.value); }} placeholder="Search name / MRN / NHIS…" />
                    {patientHits.length > 0 && (
                      <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                        {patientHits.map((p) => (
                          <button key={p.id} type="button" onClick={() => { setClaimForm({ ...claimForm, patientId: p.id, patientLabel: `${p.fullName} · ${p.mrn}` }); setPatientHits([]); }} className="block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-g-mist">
                            <span className="font-semibold text-g-ink">{p.fullName}</span>
                            <span className="ml-2 font-mono text-xs text-slate-400">{p.mrn}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searching && <p className="absolute mt-1 text-xs text-slate-400">Searching…</p>}
                  </Field>
                  <Field label="Scheme">
                    <Select value={claimForm.schemeId} onChange={(e) => setClaimForm({ ...claimForm, schemeId: e.target.value })}>
                      <option value="">Select scheme…</option>
                      {schemes.filter((s) => s.status === 'ACTIVE').map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                  </Field>
                  <Field label="Service date"><Input type="date" value={claimForm.serviceDate} onChange={(e) => setClaimForm({ ...claimForm, serviceDate: e.target.value })} /></Field>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Claim items</p>
                  <div className="space-y-2">
                    {claimForm.items.map((it, i) => (
                      <div key={i} className="flex gap-2">
                        <Input value={it.description} onChange={(e) => setClaimForm({ ...claimForm, items: claimForm.items.map((x, xi) => (xi === i ? { ...x, description: e.target.value } : x)) })} placeholder="e.g. Consultation, Laboratory" />
                        <Input type="number" min={0} step="0.01" value={it.amount} onChange={(e) => setClaimForm({ ...claimForm, items: claimForm.items.map((x, xi) => (xi === i ? { ...x, amount: e.target.value } : x)) })} placeholder="Amount" className="w-36" />
                        {claimForm.items.length > 1 && (
                          <button type="button" onClick={() => setClaimForm({ ...claimForm, items: claimForm.items.filter((_, xi) => xi !== i) })} className="cursor-pointer rounded-lg px-2 text-slate-400 hover:text-g-red" title="Remove item">×</button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => setClaimForm({ ...claimForm, items: [...claimForm.items, { description: '', amount: '' }] })} className="mt-2 cursor-pointer text-xs font-bold text-g-navy hover:underline">+ Add item</button>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">Total: <strong className="text-g-ink">{cedis(claimForm.items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0))}</strong></p>
                  <Button type="submit" icon="arrowRight">Submit claim</Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      )}

      {tab === 'memberships' && (
        <div className="space-y-5">
          {canEnroll && (
            <Card title="Enroll a patient" subtitle="Add an NHIS / private / corporate membership — verification can be recorded once the card is checked.">
              <form onSubmit={enrollPatient} className="grid gap-3 md:grid-cols-3">
                <Field label="Patient" className="relative">
                  <Input value={enrollPatientQ || enroll.patientLabel} onChange={(e) => { setEnroll({ ...enroll, patientId: '', patientLabel: '' }); void searchEnrollPatients(e.target.value); }} placeholder="Search name / MRN / NHIS…" />
                  {enrollHits.length > 0 && (
                    <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                      {enrollHits.map((p) => (
                        <button key={p.id} type="button" onClick={() => { setEnroll({ ...enroll, patientId: p.id, patientLabel: `${p.fullName} · ${p.mrn}` }); setEnrollHits([]); }} className="block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-g-mist">
                          <span className="font-semibold text-g-ink">{p.fullName}</span>
                          <span className="ml-2 font-mono text-xs text-slate-400">{p.mrn}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </Field>
                <Field label="Scheme">
                  <Select value={enroll.schemeId} onChange={(e) => setEnroll({ ...enroll, schemeId: e.target.value })}>
                    <option value="">Select scheme…</option>
                    {schemes.filter((s) => s.status === 'ACTIVE').map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </Select>
                </Field>
                <Field label="Membership number"><Input required value={enroll.membershipNumber} onChange={(e) => setEnroll({ ...enroll, membershipNumber: e.target.value })} placeholder="e.g. NHIS-10000010" /></Field>
                <Field label="Relationship">
                  <Select value={enroll.relationship} onChange={(e) => setEnroll({ ...enroll, relationship: e.target.value })}>
                    <option value="SELF">Self</option>
                    <option value="SPOUSE">Spouse</option>
                    <option value="CHILD">Child</option>
                    <option value="DEPENDENT">Dependant</option>
                  </Select>
                </Field>
                <Field label="Valid until"><Input type="date" value={enroll.validTo} onChange={(e) => setEnroll({ ...enroll, validTo: e.target.value })} /></Field>
                <div className="flex items-end"><Button type="submit" loading={enrollBusy} icon="plus">Enroll patient</Button></div>
              </form>
            </Card>
          )}

          <Card title="Membership register" subtitle="Active and historical coverage across the scoped facilities." pad={false}>
            {!memberships ? (
              <div className="p-10"><Spinner /></div>
            ) : memberships.length === 0 ? (
              <EmptyState icon="users" title="No memberships" message="Enroll a patient above to start tracking insurance coverage." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">{['Patient', 'Scheme', 'Membership no.', 'Holder', 'Valid from', 'Valid to', 'Verified', 'Status', canEnroll ? '' : null].filter(Boolean).map((h) => <th key={String(h)} className="px-5 py-3 font-semibold">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {memberships.map((m) => {
                      const expiring = m.status === 'ACTIVE' && m.validTo && new Date(m.validTo).getTime() - Date.now() < 30 * 24 * 3600 * 1000;
                      return (
                        <tr key={m.id} className="hover:bg-g-mist/40">
                          <td className="px-5 py-3">
                            <p className="font-semibold text-g-ink">{m.patient?.fullName ?? '—'}</p>
                            <p className="font-mono text-xs text-slate-400">{m.patient?.mrn ?? ''}</p>
                          </td>
                          <td className="px-5 py-3">
                            <p className="text-slate-600">{m.scheme?.name ?? '—'}</p>
                            <p className="text-xs text-slate-400">{m.scheme?.type ?? ''}</p>
                          </td>
                          <td className="px-5 py-3 font-mono text-xs font-semibold text-g-navy">{m.membershipNumber}</td>
                          <td className="px-5 py-3 text-slate-500">{m.holderName ?? titleCase(m.relationship)}</td>
                          <td className="px-5 py-3 text-slate-500">{fmtDate(m.validFrom)}</td>
                          <td className="px-5 py-3">
                            <span className={`${expiring ? 'font-bold text-yellow-700' : 'text-slate-500'}`}>{fmtDate(m.validTo)}{expiring ? ' · expires soon' : ''}</span>
                          </td>
                          <td className="px-5 py-3">
                            {m.verified ? (
                              <Badge tone="green">Verified</Badge>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <Badge tone="gray">Unverified</Badge>
                                {canEnroll && <button onClick={() => void verifyMembership(m)} disabled={verifyBusy === m.id} className="cursor-pointer text-xs font-bold text-g-navy hover:underline">Verify</button>}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1.5">
                              <Badge tone={STATUS_TONE[m.status] ?? 'gray'}>{titleCase(m.status)}</Badge>
                              {canEnroll && m.status === 'ACTIVE' && (
                                <Select value="" onChange={(e) => { if (e.target.value) void setMembershipStatus(m, e.target.value); }} className="w-28 text-xs">
                                  <option value="">…</option>
                                  <option value="SUSPENDED">Suspend</option>
                                  <option value="CANCELLED">Cancel</option>
                                </Select>
                              )}
                              {canEnroll && (m.status === 'SUSPENDED' || m.status === 'CANCELLED') && (
                                <button onClick={() => void setMembershipStatus(m, 'ACTIVE')} disabled={verifyBusy === m.id} className="cursor-pointer text-xs font-bold text-g-green hover:underline">Reactivate</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === 'schemes' && (
        <div className="space-y-5">
          <Card title="Insurer registry" subtitle="National insurance schemes every facility can bill against." pad={false}>
            {schemes.length === 0 ? (
              <EmptyState icon="building" title="No schemes" message="National administrators can register insurers." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">{['Code', 'Name', 'Type', 'Contact', 'Status', canManageSchemes ? '' : null].filter(Boolean).map((h) => <th key={String(h)} className="px-5 py-3 font-semibold">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {schemes.map((s) => (
                      <tr key={s.id} className="hover:bg-g-mist/40">
                        <td className="px-5 py-3 font-mono text-xs font-bold text-g-navy">{s.code}</td>
                        <td className="px-5 py-3">
                          <p className="font-semibold text-g-ink">{s.name}</p>
                          {s.notes && <p className="mt-0.5 max-w-md text-xs text-slate-400">{s.notes}</p>}
                        </td>
                        <td className="px-5 py-3"><Badge tone={s.type === 'NHIS' ? 'navy' : s.type === 'CORPORATE' ? 'blue' : 'green'}>{s.type}</Badge></td>
                        <td className="px-5 py-3 text-slate-500">
                          {s.phone && <p>{s.phone}</p>}
                          {s.email && <p className="text-xs text-slate-400">{s.email}</p>}
                          {!s.phone && !s.email && <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-5 py-3"><Badge tone={s.status === 'ACTIVE' ? 'green' : 'gray'}>{titleCase(s.status)}</Badge></td>
                        {canManageSchemes && (
                          <td className="px-5 py-3">
                            {s.status === 'ACTIVE' && (
                              <button onClick={() => void deactivateScheme(s)} disabled={schemeBusy} className="cursor-pointer text-xs font-bold text-g-red hover:underline">Deactivate</button>
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

          {canManageSchemes && (
            <Card title="Register a scheme" subtitle="National registry — NHIS, private insurers or corporate schemes.">
              <form onSubmit={createScheme} className="grid gap-3 md:grid-cols-4">
                <Field label="Code"><Input required value={newScheme.code} onChange={(e) => setNewScheme({ ...newScheme, code: e.target.value })} placeholder="e.g. NHIS" /></Field>
                <Field label="Name"><Input required value={newScheme.name} onChange={(e) => setNewScheme({ ...newScheme, name: e.target.value })} placeholder="Full insurer name" /></Field>
                <Field label="Type">
                  <Select value={newScheme.type} onChange={(e) => setNewScheme({ ...newScheme, type: e.target.value })}>
                    <option value="NHIS">NHIS</option>
                    <option value="PRIVATE">Private</option>
                    <option value="CORPORATE">Corporate</option>
                  </Select>
                </Field>
                <Field label="Phone"><Input value={newScheme.phone} onChange={(e) => setNewScheme({ ...newScheme, phone: e.target.value })} placeholder="0302-…" /></Field>
                <Field label="Email" className="md:col-span-2"><Input type="email" value={newScheme.email} onChange={(e) => setNewScheme({ ...newScheme, email: e.target.value })} placeholder="claims@insurer.gh" /></Field>
                <Field label="Notes" className="md:col-span-2"><Input value={newScheme.notes} onChange={(e) => setNewScheme({ ...newScheme, notes: e.target.value })} placeholder="Optional notes" /></Field>
                <div className="md:col-span-4 flex justify-end"><Button type="submit" loading={schemeBusy} icon="plus">Register scheme</Button></div>
              </form>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
