import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiRequestError } from '../../lib/api';
import { enqueueMutation } from '../../lib/offline';
import type { District, MpiCandidate, Region } from '../../types';
import { Badge, Button, Card, DemoBanner, Field, Input, PageHeader, Select } from '../../components/ui';
import { useConnection } from '../../lib/connection';
import { useToast } from '../../components/ui';

const ALLERGIES = ['Penicillin', 'Sulphonamides', 'Aspirin', 'Ibuprofen', 'Codeine', 'Peanuts', 'Latex'];
const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export default function Register() {
  const navigate = useNavigate();
  const toast = useToast();
  const { online, pending } = useConnection();

  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [candidates, setCandidates] = useState<MpiCandidate[]>([]);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    fullName: '', dateOfBirth: '', sex: 'F', phone: '', ghanaCard: '', nhisNumber: '',
    bloodGroup: '', regionId: '', districtId: '', community: '', address: '',
    nextOfKinName: '', nextOfKinPhone: '', allergies: [] as string[], consentAccepted: false,
  });

  useEffect(() => {
    void api<{ regions: Region[] }>('/geography/regions', { public: true }).then((r) => setRegions(r.regions)).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!form.regionId) { setDistricts([]); return; }
    void api<{ districts: District[] }>('/geography/districts', { public: true, query: { regionId: form.regionId } }).then((r) => setDistricts(r.districts)).catch(() => undefined);
  }, [form.regionId]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggleAllergy = (a: string) => set('allergies', form.allergies.includes(a) ? form.allergies.filter((x) => x !== a) : [...form.allergies, a]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setCandidates([]);
    const payload = {
      fullName: form.fullName.trim(),
      dateOfBirth: form.dateOfBirth || undefined,
      sex: form.sex,
      phone: form.phone || undefined,
      ghanaCard: form.ghanaCard || undefined,
      nhisNumber: form.nhisNumber || undefined,
      bloodGroup: form.bloodGroup || undefined,
      regionId: form.regionId || undefined,
      districtId: form.districtId || undefined,
      community: form.community || undefined,
      address: form.address || undefined,
      nextOfKinName: form.nextOfKinName || undefined,
      nextOfKinPhone: form.nextOfKinPhone || undefined,
      allergies: form.allergies,
      consentAccepted: form.consentAccepted,
    };

    try {
      const res = await api<{ patient: { id: string; mrn: string } }>('/patients', { method: 'POST', body: payload });
      toast(`Patient ${res.patient.mrn} registered`, 'success');
      navigate(`/app/patients/${res.patient.id}`);
    } catch (err) {
      if (err instanceof ApiRequestError && err.code === 'MPI_DUPLICATE') {
        setCandidates((err.candidates as MpiCandidate[]) ?? []);
        toast('Possible duplicate found — review candidates below', 'info');
        setBusy(false);
        return;
      }
      if (err instanceof ApiRequestError && err.status === 0) {
        // Offline: queue locally (spec §90, §104). Clinical work must continue offline.
        await enqueueMutation({ entityType: 'patient', operation: 'CREATE', payload });
        window.dispatchEvent(new CustomEvent('gihm:offline-saved', { detail: 'Patient saved locally — will sync automatically when connected.' }));
        navigate('/app/patients');
        return;
      }
      toast(err instanceof Error ? err.message : 'Registration failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function forceCreate() {
    setBusy(true);
    try {
      const res = await api<{ patient: { id: string; mrn: string } }>('/patients', {
        method: 'POST',
        body: {
          fullName: form.fullName, dateOfBirth: form.dateOfBirth || undefined, sex: form.sex, phone: form.phone || undefined,
          ghanaCard: form.ghanaCard || undefined, nhisNumber: form.nhisNumber || undefined, bloodGroup: form.bloodGroup || undefined,
          regionId: form.regionId || undefined, districtId: form.districtId || undefined, community: form.community || undefined,
          address: form.address || undefined, allergies: form.allergies, consentAccepted: form.consentAccepted, force: true,
        },
      });
      toast(`Created ${res.patient.mrn} as a distinct record`, 'success');
      navigate(`/app/patients/${res.patient.id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Register Patient" subtitle="New patient registration with automatic Master Patient Index checking." />

      {!online && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-g-gold/50 bg-g-gold/15 px-4 py-3 text-sm font-semibold text-yellow-900">
          Offline mode — the form will save locally and synchronize when you reconnect ({pending} pending).
        </div>
      )}

      {candidates.length > 0 && (
        <div className="mb-4 rounded-xl border border-g-red/30 bg-g-red/5 p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-bold text-g-red"><Badge tone="red">MPI warning</Badge> Possible existing record(s):</p>
          <ul className="space-y-1.5">
            {candidates.map((c) => (
              <li key={c.patientId} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm">
                <div>
                  <span className="font-semibold text-g-ink">{c.fullName}</span>
                  <span className="ml-2 font-mono text-xs text-slate-400">{c.mrn}</span>
                  <span className="ml-2 text-xs text-slate-400">matched: {c.matchedOn.join(', ')}</span>
                </div>
                <Badge tone={c.score >= 90 ? 'red' : 'gold'}>confidence {c.score}</Badge>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-500">Medical records are never merged silently. Open the candidate to review, or create as a distinct record.</p>
          <div className="mt-3 flex gap-2">
            <Button variant="danger" size="sm" loading={busy} onClick={() => void forceCreate()}>Create as distinct record</Button>
            <Button variant="outline" size="sm" onClick={() => setCandidates([])}>Continue editing</Button>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="space-y-5">
        <Card title="Patient details">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full name *" className="md:col-span-2">
              <Input required value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="e.g. Abena Osei" />
            </Field>
            <Field label="Date of birth">
              <Input type="date" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
            </Field>
            <Field label="Sex">
              <Select value={form.sex} onChange={(e) => set('sex', e.target.value)}>
                <option value="F">Female</option>
                <option value="M">Male</option>
              </Select>
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="0244 000 000" />
            </Field>
            <Field label="Blood group">
              <Select value={form.bloodGroup} onChange={(e) => set('bloodGroup', e.target.value)}>
                <option value="">Unknown</option>
                {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
              </Select>
            </Field>
          </div>
        </Card>

        <Card title="Identifiers">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Ghana Card number">
              <Input value={form.ghanaCard} onChange={(e) => set('ghanaCard', e.target.value)} placeholder="GHA-000000000-0" />
            </Field>
            <Field label="NHIS number">
              <Input value={form.nhisNumber} onChange={(e) => set('nhisNumber', e.target.value)} placeholder="NHIS-00000000" />
            </Field>
          </div>
        </Card>

        <Card title="Location">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Region">
              <Select value={form.regionId} onChange={(e) => set('regionId', e.target.value)}>
                <option value="">Select region</option>
                {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </Select>
            </Field>
            <Field label="District">
              <Select value={form.districtId} onChange={(e) => set('districtId', e.target.value)} disabled={!form.regionId}>
                <option value="">{form.regionId ? 'Select district' : 'Select region first'}</option>
                {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </Field>
            <Field label="Community" className="md:col-span-2">
              <Input value={form.community} onChange={(e) => set('community', e.target.value)} placeholder="e.g. Nima, Zongo…" />
            </Field>
            <Field label="Address" className="md:col-span-2">
              <Input value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="House / street description" />
            </Field>
          </div>
        </Card>

        <Card title="Allergies & consent">
          <div className="flex flex-wrap gap-2">
            {ALLERGIES.map((a) => (
              <button
                type="button"
                key={a}
                onClick={() => toggleAllergy(a)}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition ${form.allergies.includes(a) ? 'border-g-red bg-g-red text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-g-red'}`}
              >
                {a}
              </button>
            ))}
          </div>
          <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm text-slate-600">
            <input type="checkbox" checked={form.consentAccepted} onChange={(e) => set('consentAccepted', e.target.checked)} className="mt-0.5 h-4 w-4 accent-g-red" />
            <span>I confirm this patient (or their guardian) has given informed consent for treatment and authorized health-information processing (Data Protection Act, 2012 — Act 843).</span>
          </label>
        </Card>

        <div className="flex items-center justify-between gap-3">
          <DemoBanner compact />
          <Button type="submit" size="lg" icon="plus" loading={busy}>Register patient</Button>
        </div>
      </form>
    </div>
  );
}
