import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import type { Patient } from '../../types';
import { Badge, Button, Card, Field, Input, Segmented, Select, Spinner, Textarea, useToast } from '../../components/ui';
import { ageFromDob, fmtDateTime, fmtDate, titleCase, cedis } from '../../lib/format';

type Tab = 'overview' | 'encounters' | 'labs' | 'prescriptions' | 'admissions' | 'referrals' | 'billing';

export default function PatientDetail() {
  const { id } = useParams();
  const toast = useToast();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setPatient(await api<Patient>(`/patients/${id}`));
  }, [id]);

  useEffect(() => {
    void load().catch(() => setPatient(null));
  }, [load]);

  // ---------------- action form state
  const [enc, setEnc] = useState({ type: 'OPD', presentingComplaint: '', temperature: '', pulse: '', systolicBp: '', diastolicBp: '', spo2: '', triageCategory: '' });
  const [lab, setLab] = useState({ encounterId: '', test: '', discipline: 'CHEMISTRY' });
  const [rx, setRx] = useState({ encounterId: '', medicine: '', dosage: '', frequency: '', duration: '', quantity: '' });
  const [note, setNote] = useState({ encounterId: '', note: '' });
  const [referral, setReferral] = useState({ toFacilityName: '', specialty: '', urgency: 'ROUTINE', summary: '' });

  if (!patient) return <Spinner label="Loading patient record…" />;

  async function createEncounter(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setBusy(true);
    try {
      const res = await api<{ encounter: { id: string } }>(`/patients/${id}/encounters`, {
        method: 'POST',
        body: {
          type: enc.type, presentingComplaint: enc.presentingComplaint || undefined,
          temperature: enc.temperature || undefined, pulse: enc.pulse || undefined,
          systolicBp: enc.systolicBp || undefined, diastolicBp: enc.diastolicBp || undefined,
          spo2: enc.spo2 || undefined, triageCategory: enc.triageCategory || undefined,
        },
      });
      toast('Encounter opened', 'success');
      await load();
      setEnc({ type: 'OPD', presentingComplaint: '', temperature: '', pulse: '', systolicBp: '', diastolicBp: '', spo2: '', triageCategory: '' });
      void res;
    } catch (err) { toast(err instanceof Error ? err.message : 'Failed', 'error'); } finally { setBusy(false); }
  }

  async function createLab(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setBusy(true);
    try {
      await api(`/patients/${id}/lab-orders`, { method: 'POST', body: { encounterId: lab.encounterId, test: lab.test, discipline: lab.discipline } });
      toast('Lab test ordered', 'success');
      setLab({ encounterId: '', test: '', discipline: 'CHEMISTRY' });
      await load();
    } catch (err) { toast(err instanceof Error ? err.message : 'Failed', 'error'); } finally { setBusy(false); }
  }

  async function createRx(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setBusy(true);
    try {
      await api(`/patients/${id}/prescriptions`, { method: 'POST', body: { ...rx, quantity: rx.quantity ? Number(rx.quantity) : undefined } });
      toast('Prescription written', 'success');
      setRx({ encounterId: '', medicine: '', dosage: '', frequency: '', duration: '', quantity: '' });
      await load();
    } catch (err) { toast(err instanceof Error ? err.message : 'Failed', 'error'); } finally { setBusy(false); }
  }

  async function addNote(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setBusy(true);
    try {
      await api(`/patients/${id}/notes`, { method: 'POST', body: { encounterId: note.encounterId, note: note.note, noteType: 'DOCTOR' } });
      toast('Note added', 'success');
      setNote({ encounterId: '', note: '' });
      await load();
    } catch (err) { toast(err instanceof Error ? err.message : 'Failed', 'error'); } finally { setBusy(false); }
  }

  const TABS: { value: Tab; label: string }[] = [
    { value: 'overview', label: 'Overview' },
    { value: 'encounters', label: `Encounters (${patient.encounters?.length ?? 0})` },
    { value: 'labs', label: `Laboratory (${patient.labOrders?.length ?? 0})` },
    { value: 'prescriptions', label: `Medications (${patient.prescriptions?.length ?? 0})` },
    { value: 'admissions', label: `Admissions (${patient.admissions?.length ?? 0})` },
    { value: 'referrals', label: `Referrals (${patient.referrals?.length ?? 0})` },
    { value: 'billing', label: `Bills (${patient.invoices?.length ?? 0})` },
  ];

  async function createReferral(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setBusy(true);
    try {
      await api(`/referrals`, { method: 'POST', body: { patientId: id, toFacilityName: referral.toFacilityName, specialty: referral.specialty || undefined, urgency: referral.urgency, summary: referral.summary || undefined } });
      toast('Referral submitted', 'success');
      setReferral({ toFacilityName: '', specialty: '', urgency: 'ROUTINE', summary: '' });
      await load();
    } catch (err) { toast(err instanceof Error ? err.message : 'Failed', 'error'); } finally { setBusy(false); }
  }

  return (
    <div>
      <Link to="/app/patients" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-g-red">
        <IconArrowBack /> Patient registry
      </Link>

      {/* Header */}
      <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-g-navy px-6 py-6 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-lg font-bold">
                {patient.fullName.split(' ').slice(0, 2).map((s) => s[0]).join('')}
              </span>
              <div>
                <h1 className="text-2xl font-bold">{patient.fullName}</h1>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-300">
                  <span className="font-mono font-semibold text-g-gold">{patient.mrn}</span>
                  <span>· {patient.sex ?? '—'} · {ageFromDob(patient.dateOfBirth)}</span>
                  <span>· {patient.district?.name ?? '—'}</span>
                  {patient.bloodGroup && <Badge tone="gold" className="bg-white/10 text-g-gold">Blood {patient.bloodGroup}</Badge>}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {patient.ghanaCard && <Badge tone="gold" className="bg-white/10 text-g-gold">Ghana Card ✓</Badge>}
              {patient.nhisNumber && <Badge tone="green" className="bg-white/10 text-green-300">NHIS {patient.nhisNumber}</Badge>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-slate-100 px-6 py-3 text-sm">
          <span className="flex items-center gap-1.5 text-slate-500"><span className="text-slate-300">Phone:</span> {patient.phone ?? '—'}</span>
          <span className="flex items-center gap-1.5 text-slate-500"><span className="text-slate-300">Community:</span> {patient.community ?? '—'}</span>
          <span className="flex items-center gap-1.5 text-slate-500"><span className="text-slate-300">Registered:</span> {fmtDate(patient.createdAt)}</span>
          {patient.allergies.length > 0 && (
            <span className="flex items-center gap-1.5">
              <Badge tone="red">Allergies: {patient.allergies.join(', ')}</Badge>
            </span>
          )}
        </div>
      </div>

      <div className="mb-5"><Segmented options={TABS} value={tab} onChange={setTab} /></div>

      {/* Overview: vitals + actions */}
      {tab === 'overview' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="New encounter (triage + vitals)">
            <form onSubmit={createEncounter} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Type">
                  <Select value={enc.type} onChange={(e) => setEnc({ ...enc, type: e.target.value })}>
                    <option value="OPD">OPD</option>
                    <option value="EMERGENCY">Emergency</option>
                    <option value="ANTENATAL">Antenatal</option>
                    <option value="IMMUNIZATION">Immunization</option>
                  </Select>
                </Field>
                <Field label="Triage category">
                  <Select value={enc.triageCategory} onChange={(e) => setEnc({ ...enc, triageCategory: e.target.value })}>
                    <option value="">—</option>
                    <option value="NON_URGENT">Non-urgent</option>
                    <option value="URGENT">Urgent</option>
                    <option value="EMERGENT">Emergent</option>
                  </Select>
                </Field>
              </div>
              <Field label="Presenting complaint">
                <Input value={enc.presentingComplaint} onChange={(e) => setEnc({ ...enc, presentingComplaint: e.target.value })} placeholder="Fever, headache…" />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Temp (°C)"><Input type="number" step="0.1" value={enc.temperature} onChange={(e) => setEnc({ ...enc, temperature: e.target.value })} /></Field>
                <Field label="Pulse"><Input type="number" value={enc.pulse} onChange={(e) => setEnc({ ...enc, pulse: e.target.value })} /></Field>
                <Field label="SpO₂ (%)"><Input type="number" value={enc.spo2} onChange={(e) => setEnc({ ...enc, spo2: e.target.value })} /></Field>
                <Field label="BP sys"><Input type="number" value={enc.systolicBp} onChange={(e) => setEnc({ ...enc, systolicBp: e.target.value })} /></Field>
                <Field label="BP dia"><Input type="number" value={enc.diastolicBp} onChange={(e) => setEnc({ ...enc, diastolicBp: e.target.value })} /></Field>
              </div>
              <Button type="submit" loading={busy} icon="plus">Open encounter</Button>
            </form>
          </Card>

          <Card title="Add note to encounter">
            <form onSubmit={addNote} className="space-y-3">
              <Field label="Encounter">
                <Select value={note.encounterId} onChange={(e) => setNote({ ...note, encounterId: e.target.value })}>
                  <option value="">Select encounter…</option>
                  {(patient.encounters ?? []).map((e) => (
                    <option key={e.id} value={e.id}>{fmtDateTime(e.createdAt)} — {e.presentingComplaint ?? e.type}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Clinical note">
                <Textarea value={note.note} onChange={(e) => setNote({ ...note, note: e.target.value })} placeholder="Examination findings, assessment…" />
              </Field>
              <Button type="submit" loading={busy} disabled={!note.encounterId} variant="navy">Save note</Button>
            </form>
          </Card>

          <Card title="Order laboratory test" className="lg:col-span-2">
            <form onSubmit={createLab} className="grid gap-3 md:grid-cols-4">
              <Field label="Encounter"><Select value={lab.encounterId} onChange={(e) => setLab({ ...lab, encounterId: e.target.value })}><option value="">Select…</option>{(patient.encounters ?? []).map((e) => <option key={e.id} value={e.id}>{fmtDate(e.createdAt)}</option>)}</Select></Field>
              <Field label="Test"><Input value={lab.test} onChange={(e) => setLab({ ...lab, test: e.target.value })} placeholder="Full Blood Count" /></Field>
              <Field label="Discipline"><Select value={lab.discipline} onChange={(e) => setLab({ ...lab, discipline: e.target.value })}>{['CHEMISTRY', 'HAEMATOLOGY', 'MICROBIOLOGY', 'SEROLOGY', 'PATHOLOGY', 'BLOOD_BANK'].map((d) => <option key={d}>{d}</option>)}</Select></Field>
              <div className="flex items-end"><Button type="submit" loading={busy} disabled={!lab.encounterId || !lab.test} icon="flask">Order test</Button></div>
            </form>
          </Card>

          <Card title="Write prescription" className="lg:col-span-2">
            <form onSubmit={createRx} className="grid gap-3 md:grid-cols-6">
              <Field label="Encounter" className="md:col-span-2"><Select value={rx.encounterId} onChange={(e) => setRx({ ...rx, encounterId: e.target.value })}><option value="">Select…</option>{(patient.encounters ?? []).map((e) => <option key={e.id} value={e.id}>{fmtDate(e.createdAt)}</option>)}</Select></Field>
              <Field label="Medicine"><Input value={rx.medicine} onChange={(e) => setRx({ ...rx, medicine: e.target.value })} placeholder="Paracetamol 500mg" /></Field>
              <Field label="Dosage"><Input value={rx.dosage} onChange={(e) => setRx({ ...rx, dosage: e.target.value })} placeholder="1 tablet" /></Field>
              <Field label="Frequency"><Input value={rx.frequency} onChange={(e) => setRx({ ...rx, frequency: e.target.value })} placeholder="TDS" /></Field>
              <Field label="Qty"><Input type="number" value={rx.quantity} onChange={(e) => setRx({ ...rx, quantity: e.target.value })} /></Field>
              <div className="flex items-end"><Button type="submit" loading={busy} disabled={!rx.encounterId || !rx.medicine} icon="pill">Prescribe</Button></div>
            </form>
          </Card>
        </div>
      )}

      {tab === 'encounters' && (
        <div className="space-y-4">
          {(patient.encounters ?? []).length === 0 ? (
            <Card><p className="py-6 text-center text-sm text-slate-400">No encounters yet — open one from the Overview tab.</p></Card>
          ) : (
            (patient.encounters ?? []).map((e) => (
              <Card key={e.id} title={`${titleCase(e.type)} encounter · ${fmtDateTime(e.createdAt)}`} subtitle={`Status: ${titleCase(e.status)}`} action={<Badge tone={e.triageCategory === 'EMERGENT' ? 'red' : e.triageCategory === 'URGENT' ? 'gold' : 'gray'}>{e.triageCategory ?? 'Not triaged'}</Badge>}>
                <div className="mb-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  {e.presentingComplaint && <span><span className="text-slate-400">Complaint:</span> <strong>{e.presentingComplaint}</strong></span>}
                  {e.temperature && <span><span className="text-slate-400">Temp:</span> <strong>{e.temperature}°C</strong></span>}
                  {e.pulse && <span><span className="text-slate-400">Pulse:</span> <strong>{e.pulse}</strong></span>}
                  {e.systolicBp && <span><span className="text-slate-400">BP:</span> <strong>{e.systolicBp}/{e.diastolicBp}</strong></span>}
                  {e.spo2 && <span><span className="text-slate-400">SpO₂:</span> <strong>{e.spo2}%</strong></span>}
                  {e.weightKg && <span><span className="text-slate-400">Wt:</span> <strong>{e.weightKg}kg</strong></span>}
                </div>
                {(e.diagnoses ?? []).map((d) => (
                  <span key={d.id} className="mr-2 inline-block rounded-md bg-g-mist px-2 py-0.5 text-xs font-semibold text-slate-600">{d.code} — {d.description}</span>
                ))}
                {(e.notes ?? []).map((n) => (
                  <div key={n.id} className="mt-3 rounded-lg border-l-4 border-g-red bg-g-mist/50 px-4 py-3">
                    <p className="text-xs font-bold text-slate-400">{titleCase(n.noteType)} note · {fmtDateTime(n.createdAt)}</p>
                    <p className="mt-1 text-sm text-g-ink">{n.note}</p>
                  </div>
                ))}
              </Card>
            ))
          )}
        </div>
      )}

      {tab === 'labs' && (
        <Card pad={false}>
          {(patient.labOrders ?? []).length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-400">No laboratory orders.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-slate-100 text-xs uppercase text-slate-400">{['Test', 'Discipline', 'Status', 'Result', 'Ordered'].map((h) => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {(patient.labOrders ?? []).map((o) => (
                    <tr key={o.id}>
                      <td className="px-5 py-3 font-semibold text-g-ink">{o.test}</td>
                      <td className="px-5 py-3 text-slate-500">{titleCase(o.discipline)}</td>
                      <td className="px-5 py-3">{o.critical ? <Badge tone="red">Critical</Badge> : <Badge tone={o.status === 'VERIFIED' ? 'green' : o.status === 'ORDERED' ? 'gray' : 'gold'}>{o.status}</Badge>}</td>
                      <td className="px-5 py-3 text-slate-600">{o.result ?? '—'}</td>
                      <td className="px-5 py-3 text-slate-400">{fmtDate(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === 'prescriptions' && (
        <Card pad={false}>
          {(patient.prescriptions ?? []).length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-400">No prescriptions.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-slate-100 text-xs uppercase text-slate-400">{['Medicine', 'Dosage', 'Frequency', 'Duration', 'Qty', 'Status', 'Written'].map((h) => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {(patient.prescriptions ?? []).map((r) => (
                    <tr key={r.id}>
                      <td className="px-5 py-3 font-semibold text-g-ink">{r.medicine}</td>
                      <td className="px-5 py-3 text-slate-500">{r.dosage ?? '—'}</td>
                      <td className="px-5 py-3 text-slate-500">{r.frequency ?? '—'}</td>
                      <td className="px-5 py-3 text-slate-500">{r.duration ?? '—'}</td>
                      <td className="px-5 py-3 text-slate-500">{r.quantity ?? '—'}</td>
                      <td className="px-5 py-3"><Badge tone={r.status === 'DISPENSED' ? 'green' : r.status === 'ACTIVE' ? 'gold' : 'gray'}>{r.status}</Badge></td>
                      <td className="px-5 py-3 text-slate-400">{fmtDate(r.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === 'admissions' && (
        <div className="space-y-3">
          {(patient.admissions ?? []).length === 0 ? (
            <Card><p className="py-6 text-center text-sm text-slate-400">No admissions.</p></Card>
          ) : (
            (patient.admissions ?? []).map((a) => (
              <Card key={a.id} title={`${a.ward ?? 'Ward'} · bed ${a.bed ?? '—'}`} action={<Badge tone={a.status === 'ADMITTED' ? 'green' : 'gray'}>{a.status}</Badge>}>
                <p className="text-sm text-slate-500"><span className="text-slate-400">Reason:</span> {a.reason ?? '—'}</p>
                <p className="mt-1 text-xs text-slate-400">Admitted {fmtDateTime(a.admittedAt)}{a.dischargedAt ? ` · Discharged ${fmtDateTime(a.dischargedAt)}` : ''}</p>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === 'referrals' && (
        <div className="space-y-4">
          <Card title="Refer this patient">
            <form onSubmit={createReferral} className="grid gap-3 md:grid-cols-2">
              <Field label="Receiving facility"><Input required value={referral.toFacilityName} onChange={(e) => setReferral({ ...referral, toFacilityName: e.target.value })} placeholder="e.g. Komfo Anokye Teaching Hospital" /></Field>
              <Field label="Specialty"><Input value={referral.specialty} onChange={(e) => setReferral({ ...referral, specialty: e.target.value })} placeholder="Cardiology" /></Field>
              <Field label="Urgency">
                <Select value={referral.urgency} onChange={(e) => setReferral({ ...referral, urgency: e.target.value })}>
                  <option value="ROUTINE">Routine</option>
                  <option value="URGENT">Urgent</option>
                  <option value="EMERGENCY">Emergency</option>
                </Select>
              </Field>
              <div className="md:col-span-2">
                <Field label="Clinical summary"><Textarea value={referral.summary} onChange={(e) => setReferral({ ...referral, summary: e.target.value })} placeholder="Reason for referral, key findings…" /></Field>
              </div>
              <div className="md:col-span-2"><Button type="submit" loading={busy} icon="arrowRight">Submit referral</Button></div>
            </form>
          </Card>
          {(patient.referrals ?? []).length === 0 ? (
            <Card><p className="py-6 text-center text-sm text-slate-400">No referrals.</p></Card>
          ) : (
            (patient.referrals ?? []).map((r) => (
              <Card key={r.id} pad={false}>
                <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-g-ink">{r.toFacilityName ?? 'Referral'}</span>
                      <Badge tone={r.urgency === 'EMERGENCY' ? 'red' : r.urgency === 'URGENT' ? 'gold' : 'green'}>{titleCase(r.urgency)}</Badge>
                      <Badge tone={r.status === 'COMPLETED' ? 'green' : r.status === 'ACCEPTED' ? 'navy' : r.status === 'REJECTED' ? 'red' : 'gold'}>{titleCase(r.status)}</Badge>
                      {r.specialty && <Badge tone="navy">{r.specialty}</Badge>}
                    </div>
                    {r.summary && <p className="mt-2 max-w-2xl text-sm text-slate-600">{r.summary}</p>}
                    <p className="mt-1 text-xs text-slate-400">{fmtDateTime(r.createdAt)}</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === 'billing' && (
        <Card pad={false}>
          {(patient.invoices ?? []).length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-400">No invoices.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-slate-100 text-xs uppercase text-slate-400">{['Issued', 'Amount', 'Paid', 'Method', 'Status'].map((h) => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {(patient.invoices ?? []).map((i) => (
                    <tr key={i.id}>
                      <td className="px-5 py-3 text-slate-500">{fmtDate(i.issuedAt)}</td>
                      <td className="px-5 py-3 font-semibold text-g-ink">{cedis(i.amount)}</td>
                      <td className="px-5 py-3 text-g-green">{cedis(i.paidAmount)}</td>
                      <td className="px-5 py-3 text-slate-500">{i.paymentMethod ?? '—'}</td>
                      <td className="px-5 py-3"><Badge tone={i.status === 'PAID' ? 'green' : i.status === 'PARTIAL' ? 'gold' : 'gray'}>{i.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function IconArrowBack() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 rotate-180">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
