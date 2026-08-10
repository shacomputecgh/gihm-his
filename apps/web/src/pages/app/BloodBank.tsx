import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api } from '../../lib/api';
import type { BloodDonor, BloodUnit, Patient, TransfusionRecord } from '../../types';
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Select, Segmented, Spinner, useToast } from '../../components/ui';
import { fmtDate, fmtDateTime, titleCase } from '../../lib/format';

type Tab = 'units' | 'donors' | 'transfusions';

const UNIT_TONE: Record<string, 'green' | 'gold' | 'navy' | 'red' | 'gray' | 'blue'> = {
  AVAILABLE: 'green',
  RESERVED: 'gold',
  CROSSMATCHED: 'blue',
  ISSUED: 'navy',
  EXPIRED: 'gray',
  DISCARDED: 'red',
};

const BLOOD_GROUPS = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'];

export default function BloodBank() {
  const [tab, setTab] = useState<Tab>('units');
  const [units, setUnits] = useState<BloodUnit[] | null>(null);
  const [summary, setSummary] = useState<{ bloodGroup: string; available: number; crossmatched: number; reserved: number }[]>([]);
  const [donors, setDonors] = useState<BloodDonor[] | null>(null);
  const [transfusions, setTransfusions] = useState<TransfusionRecord[] | null>(null);
  const [showDonor, setShowDonor] = useState(false);
  const [donorForm, setDonorForm] = useState({ fullName: '', phone: '', bloodGroup: 'O+' });
  const [showDonation, setShowDonation] = useState(false);
  const [donationForm, setDonationForm] = useState({ donorId: '', screeningResult: 'NEGATIVE' });
  const [actionFor, setActionFor] = useState<BloodUnit | null>(null);
  const [patientQ, setPatientQ] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    const [u, d, t] = await Promise.all([
      api<{ items: BloodUnit[]; summary: typeof summary }>('/bloodbank/units'),
      api<{ items: BloodDonor[] }>('/bloodbank/donors'),
      api<{ items: TransfusionRecord[] }>('/bloodbank/transfusions'),
    ]);
    setUnits(u.items);
    setSummary(u.summary);
    setDonors(d.items);
    setTransfusions(t.items);
  }, []);

  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  async function searchPatients(q: string) {
    setPatientQ(q);
    if (!q.trim()) { setPatientResults([]); return; }
    const r = await api<{ items: Patient[] }>(`/patients?q=${encodeURIComponent(q)}&pageSize=8`);
    setPatientResults(r.items);
  }

  async function addDonor(e: FormEvent) {
    e.preventDefault();
    setBusyId('donor');
    try {
      await api('/bloodbank/donors', { method: 'POST', body: donorForm });
      toast('Donor registered', 'success');
      setShowDonor(false);
      setDonorForm({ fullName: '', phone: '', bloodGroup: 'O+' });
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function addDonation(e: FormEvent) {
    e.preventDefault();
    if (!donationForm.donorId) { toast('Select a donor', 'error'); return; }
    setBusyId('donation');
    try {
      const r = await api<{ units: BloodUnit[] }>('/bloodbank/donations', { method: 'POST', body: donationForm });
      toast(`Donation recorded — ${r.units.length} unit(s) added`, 'success');
      setShowDonation(false);
      setDonationForm({ donorId: '', screeningResult: 'NEGATIVE' });
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function runUnitAction(e: FormEvent) {
    e.preventDefault();
    if (!actionFor) return;
    const patient = patientResults.find((p) => p.id === patientQ) ?? null;
    if (!patient) { toast('Select a patient from the results', 'error'); return; }
    setBusyId(actionFor.id);
    try {
      const isCrossmatch = actionFor.status === 'AVAILABLE' || actionFor.status === 'RESERVED';
      await api(`/bloodbank/units/${actionFor.id}/${isCrossmatch ? 'crossmatch' : 'issue'}`, { method: 'POST', body: { patientId: patient.id, crossmatchResult: 'COMPATIBLE' } });
      toast(isCrossmatch ? 'Unit crossmatched' : 'Unit issued', 'success');
      setActionFor(null);
      setPatientQ('');
      setPatientResults([]);
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
        title="Blood bank"
        subtitle="Donor registry, blood inventory, crossmatch and transfusion management."
        action={
          <>
            <Button variant="outline" icon="plus" onClick={() => setShowDonor((v) => !v)}>Register donor</Button>
            <Button icon="plus" onClick={() => setShowDonation((v) => !v)}>Record donation</Button>
          </>
        }
      />

      {showDonor && (
        <Card title="Register donor" className="mb-5">
          <form onSubmit={addDonor} className="grid gap-3 md:grid-cols-4">
            <Field label="Full name"><Input value={donorForm.fullName} onChange={(e) => setDonorForm({ ...donorForm, fullName: e.target.value })} required /></Field>
            <Field label="Phone"><Input value={donorForm.phone} onChange={(e) => setDonorForm({ ...donorForm, phone: e.target.value })} /></Field>
            <Field label="Blood group">
              <Select value={donorForm.bloodGroup} onChange={(e) => setDonorForm({ ...donorForm, bloodGroup: e.target.value })}>
                {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </Select>
            </Field>
            <div className="flex items-end gap-2">
              <Button type="submit" loading={busyId === 'donor'}>Save</Button>
              <Button variant="ghost" onClick={() => setShowDonor(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {showDonation && (
        <Card title="Record donation" className="mb-5">
          <form onSubmit={addDonation} className="grid gap-3 md:grid-cols-3">
            <Field label="Donor">
              <Select value={donationForm.donorId} onChange={(e) => setDonationForm({ ...donationForm, donorId: e.target.value })}>
                <option value="">Select donor…</option>
                {(donors ?? []).map((d) => <option key={d.id} value={d.id}>{d.fullName} ({d.bloodGroup})</option>)}
              </Select>
            </Field>
            <Field label="Screening result">
              <Select value={donationForm.screeningResult} onChange={(e) => setDonationForm({ ...donationForm, screeningResult: e.target.value })}>
                <option value="NEGATIVE">Negative (pass)</option>
                <option value="REACTIVE">Reactive (fail)</option>
                <option value="PENDING">Pending</option>
              </Select>
            </Field>
            <div className="flex items-end gap-2">
              <Button type="submit" loading={busyId === 'donation'}>Record + create units</Button>
              <Button variant="ghost" onClick={() => setShowDonation(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="mb-5">
        <Segmented options={[{ value: 'units', label: 'Inventory' }, { value: 'donors', label: 'Donors' }, { value: 'transfusions', label: 'Transfusions' }]} value={tab} onChange={setTab} />
      </div>

      {tab === 'units' && (
        !units ? <Spinner /> : units.length === 0 ? (
          <EmptyState icon="flask" title="No blood units" message="Record a donation to create inventory units." />
        ) : (
          <>
            <Card title="Inventory by blood group" className="mb-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
                {BLOOD_GROUPS.map((g) => {
                  const s = summary.find((x) => x.bloodGroup === g);
                  return (
                    <div key={g} className="rounded-lg bg-g-mist p-3 text-center">
                      <p className="text-sm font-bold text-g-red">{g}</p>
                      <p className="mt-1 text-lg font-bold text-g-ink tabular-nums">{s?.available ?? 0}</p>
                      <p className="text-[10px] text-slate-400">available</p>
                    </div>
                  );
                })}
              </div>
            </Card>
            <div className="space-y-2">
              {units.map((u) => (
                <Card key={u.id} pad={false}>
                  <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-g-ink">{u.unitCode}</span>
                      <Badge tone="red">{u.bloodGroup}</Badge>
                      <Badge tone="navy">{titleCase(u.component)}</Badge>
                      <Badge tone={UNIT_TONE[u.status] ?? 'gray'}>{titleCase(u.status)}</Badge>
                      {u.issuedPatient && <span className="text-xs text-slate-500">→ {u.issuedPatient.fullName} ({u.issuedPatient.mrn})</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">exp {fmtDate(u.expiryDate)}</span>
                      {u.status === 'AVAILABLE' && (
                        <Button size="sm" variant="navy" onClick={() => setActionFor(u)}>Crossmatch</Button>
                      )}
                      {u.status === 'CROSSMATCHED' && (
                        <Button size="sm" variant="green" onClick={() => setActionFor(u)}>Issue</Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )
      )}

      {tab === 'donors' && (
        !donors ? <Spinner /> : donors.length === 0 ? (
          <EmptyState icon="users" title="No donors" message="Register donors to build the registry." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {donors.map((d) => (
              <Card key={d.id}>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-g-ink">{d.fullName}</p>
                  <Badge tone="red">{d.bloodGroup}</Badge>
                </div>
                <div className="mt-2 space-y-1 text-xs text-slate-500">
                  <p>{d.phone ?? '—'} · {d.sex ?? '—'}</p>
                  <p>{d.totalDonations} donation(s) · last {d.lastDonationAt ? fmtDate(d.lastDonationAt) : '—'}</p>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {tab === 'transfusions' && (
        !transfusions ? <Spinner /> : transfusions.length === 0 ? (
          <EmptyState icon="flask" title="No transfusions yet" message="Crossmatched units issued to patients appear here." />
        ) : (
          <div className="space-y-2">
            {transfusions.map((t) => (
              <Card key={t.id} pad={false}>
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-g-ink">{t.patient?.fullName}</span>
                    <span className="font-mono text-xs text-slate-400">{t.unit?.unitCode} ({t.unit?.bloodGroup})</span>
                    <Badge tone={t.status === 'COMPLETED' ? 'green' : t.status === 'REACTION' ? 'red' : 'blue'}>{titleCase(t.status)}</Badge>
                    {t.crossmatchResult && <Badge tone={t.crossmatchResult === 'COMPATIBLE' ? 'green' : 'red'}>{t.crossmatchResult}</Badge>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{fmtDateTime(t.createdAt)}</span>
                    {t.status === 'IN_PROGRESS' && (
                      <Button size="sm" variant="green" onClick={async () => { try { await api(`/bloodbank/transfusions/${t.id}/complete`, { method: 'POST', body: {} }); toast('Transfusion completed', 'success'); void load(); } catch (err) { toast(err instanceof Error ? err.message : 'Failed', 'error'); } }}>Complete</Button>
                    )}
                    {t.reaction && <p className="max-w-xs text-xs text-g-red">{t.reaction}</p>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {actionFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setActionFor(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-g-ink">
              {actionFor.status === 'AVAILABLE' ? 'Crossmatch' : 'Issue'} {actionFor.unitCode}
            </h3>
            <p className="mt-1 text-xs text-slate-500">{actionFor.bloodGroup} {titleCase(actionFor.component)} — exp {fmtDate(actionFor.expiryDate)}</p>
            <form onSubmit={runUnitAction} className="mt-4 space-y-3">
              <Field label="Patient" hint="Search by name or MRN">
                <Input value={patientQ} onChange={(e) => void searchPatients(e.target.value)} placeholder="Search patient…" autoFocus />
                {patientResults.length > 0 && (
                  <div className="mt-1 max-h-36 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                    {patientResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setPatientQ(p.id); }}
                        className="block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-g-mist"
                      >
                        <span className="font-semibold text-g-ink">{p.fullName}</span>
                        <span className="font-mono text-xs text-slate-400"> {p.mrn}</span>
                      </button>
                    ))}
                  </div>
                )}
                {patientQ && <p className="mt-1 text-[11px] text-slate-400">Selected: {patientResults.find((p) => p.id === patientQ)?.fullName ?? patientQ}</p>}
              </Field>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setActionFor(null)}>Cancel</Button>
                <Button type="submit" loading={busyId === actionFor.id}>{actionFor.status === 'AVAILABLE' ? 'Crossmatch unit' : 'Issue unit'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
