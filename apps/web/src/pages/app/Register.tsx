import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiRequestError } from '../../lib/api';
import { enqueueMutation } from '../../lib/offline';
import type { District, MpiCandidate, Region } from '../../types';
import { Badge, Button, Card, DemoBanner, Field, Input, PageHeader, Select } from '../../components/ui';
import { Icon } from '../../components/icons';
import { LANGUAGE_OPTIONS } from '../../lib/format';
import { useConnection } from '../../lib/connection';
import { useToast } from '../../components/ui';

const ALLERGIES = ['Penicillin', 'Sulphonamides', 'Aspirin', 'Ibuprofen', 'Codeine', 'Peanuts', 'Latex'];
const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const VISA_TYPES = ['TOURIST', 'STUDENT', 'WORK', 'RESIDENCE', 'DIPLOMATIC', 'OTHER'];

// Patient type — the same contract as the admission form (docs: hospital
// admission form). A foreign national registers with passport / visa / permit
// and international insurance instead of Ghana Card / NHIS.
const PATIENT_TYPES = [
  { value: 'GHANAIAN', flag: '🇬🇭', title: 'Ghanaian Citizen', desc: 'Ghana Card · NHIS · Digital Address · Region/District' },
  { value: 'FOREIGN', flag: '🌍', title: 'Foreign National', desc: 'Passport · Visa/Permit · Country of Residence · International Insurance' },
  { value: 'REFUGEE', flag: '🛡️', title: 'Refugee / Asylum Seeker', desc: 'Refugee ID · Country of Origin · Local Address' },
  { value: 'OTHER', flag: '📄', title: 'Other', desc: 'Any other identification' },
] as const;
type PatientType = (typeof PATIENT_TYPES)[number]['value'];

export default function Register() {
  const navigate = useNavigate();
  const toast = useToast();
  const { online, pending } = useConnection();

  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [candidates, setCandidates] = useState<MpiCandidate[]>([]);
  const [busy, setBusy] = useState(false);
  // Optional ID photograph — uploaded to the record right after registration.
  const photoRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<{ url: string; b64: string } | null>(null);

  const [form, setForm] = useState({
    patientType: 'GHANAIAN' as PatientType,
    fullName: '', dateOfBirth: '', sex: 'F', phone: '', nationality: 'Ghanaian',
    ghanaCard: '', nhisNumber: '', passport: '', passportIssueDate: '', passportExpiryDate: '',
    visaPermitType: 'RESIDENCE', visaPermitNumber: '', visaPermitExpiry: '',
    countryOfResidence: '', permanentAddress: '', internationalInsurer: '', internationalPolicyNumber: '',
    bloodGroup: '', regionId: '', districtId: '', community: '', address: '',
    nextOfKinName: '', nextOfKinPhone: '', allergies: [] as string[], consentAccepted: false,
    preferredLanguage: 'EN', smsConsent: true,
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

  function pickType(t: PatientType) {
    set('patientType', t);
    // Citizens default to Ghanaian nationality; everyone else enters their own.
    if (t === 'GHANAIAN') set('nationality', 'Ghanaian');
  }

  const foreignFields = () => ({
    patientType: form.patientType,
    nationality: form.nationality || undefined,
    passport: form.passport || undefined,
    passportIssueDate: form.passportIssueDate || undefined,
    passportExpiryDate: form.passportExpiryDate || undefined,
    visaPermitType: form.patientType === 'FOREIGN' ? (form.visaPermitType || undefined) : undefined,
    visaPermitNumber: form.patientType === 'FOREIGN' ? (form.visaPermitNumber || undefined) : undefined,
    visaPermitExpiry: form.patientType === 'FOREIGN' ? (form.visaPermitExpiry || undefined) : undefined,
    countryOfResidence: form.countryOfResidence || undefined,
    permanentAddress: form.patientType === 'FOREIGN' ? (form.permanentAddress || undefined) : undefined,
    internationalInsurer: form.patientType === 'FOREIGN' ? (form.internationalInsurer || undefined) : undefined,
    internationalPolicyNumber: form.patientType === 'FOREIGN' ? (form.internationalPolicyNumber || undefined) : undefined,
  });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setCandidates([]);
    const payload = {
      fullName: form.fullName.trim(),
      dateOfBirth: form.dateOfBirth || undefined,
      sex: form.sex,
      phone: form.phone || undefined,
      ghanaCard: form.patientType === 'GHANAIAN' || form.patientType === 'OTHER' ? (form.ghanaCard || undefined) : undefined,
      nhisNumber: form.patientType === 'GHANAIAN' ? (form.nhisNumber || undefined) : undefined,
      bloodGroup: form.bloodGroup || undefined,
      regionId: form.regionId || undefined,
      districtId: form.districtId || undefined,
      community: form.community || undefined,
      address: form.address || undefined,
      nextOfKinName: form.nextOfKinName || undefined,
      nextOfKinPhone: form.nextOfKinPhone || undefined,
      allergies: form.allergies,
      consentAccepted: form.consentAccepted,
      preferredLanguage: form.preferredLanguage,
      // SMS/WhatsApp reminder consent — unchecking opts the patient out (the
      // same patient preference toggled later from the patient record).
      reminderOptOut: !form.smsConsent,
      ...foreignFields(),
    };

    try {
      const res = await api<{ patient: { id: string; mrn: string } }>('/patients', { method: 'POST', body: payload });
      await attachPhoto(res.patient.id);
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
          ghanaCard: form.patientType === 'GHANAIAN' || form.patientType === 'OTHER' ? (form.ghanaCard || undefined) : undefined,
          nhisNumber: form.patientType === 'GHANAIAN' ? (form.nhisNumber || undefined) : undefined,
          bloodGroup: form.bloodGroup || undefined,
          regionId: form.regionId || undefined, districtId: form.districtId || undefined, community: form.community || undefined,
          address: form.address || undefined, allergies: form.allergies, consentAccepted: form.consentAccepted, force: true,
          preferredLanguage: form.preferredLanguage, reminderOptOut: !form.smsConsent,
          ...foreignFields(),
        },
      });
      await attachPhoto(res.patient.id);
      toast(`Created ${res.patient.mrn} as a distinct record`, 'success');
      navigate(`/app/patients/${res.patient.id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  const idLabel = PATIENT_TYPES.find((t) => t.value === form.patientType)?.title ?? 'Patient';

  function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('Please choose an image file (jpg, png…)', 'error'); return; }
    if (file.size > 8 * 1024 * 1024) { toast('Photo exceeds the 8 MB limit', 'error'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      setPhoto({ url, b64: url.split(',')[1] ?? '' });
    };
    reader.onerror = () => toast('Could not read the photo', 'error');
    reader.readAsDataURL(file);
    // Allow re-selecting the same file (a stale value would skip onChange).
    e.target.value = '';
  }

  /** Attach the chosen photo to a freshly created record (best-effort). */
  async function attachPhoto(patientId: string) {
    if (!photo || !online) return;
    try {
      await api(`/patients/${patientId}/photo`, { method: 'PUT', body: { data: photo.b64 } });
    } catch {
      toast('Patient registered — photo upload failed, add it later from the record', 'error');
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Register Patient" subtitle="New patient registration with automatic Master Patient Index checking — citizens and foreign nationals." />

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
        {/* ------------------------------------------------ patient type */}
        <Card title="Patient type" subtitle="Identification changes with the type — the same contract as the admission form.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PATIENT_TYPES.map((t) => {
              const active = form.patientType === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => pickType(t.value)}
                  className={`group cursor-pointer rounded-2xl border-2 p-3.5 text-left transition-all ${active ? 'border-g-navy bg-g-navy/5 shadow-sm' : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-g-navy/50 hover:shadow-md'}`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl transition-colors ${active ? 'bg-g-navy' : 'bg-g-mist group-hover:bg-g-navy/10'}`}>{t.flag}</span>
                    <span>
                      <span className="block text-sm font-bold text-g-ink">{t.title}</span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">{t.desc}</span>
                    </span>
                  </span>
                  {active && (
                    <span className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-g-navy px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                      <Icon name="check" className="h-3 w-3" /> Selected
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        <Card title="Patient details">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field label="Photograph (optional)" hint="ID photo for the record — you can change it later from the patient page.">
                <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
                {photo ? (
                  <div className="flex items-center gap-4">
                    <img src={photo.url} alt="Selected patient photo" className="h-20 w-20 rounded-xl object-cover ring-2 ring-g-navy/20" />
                    <div className="flex flex-col gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => photoRef.current?.click()}>Change photo</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setPhoto(null)}>Remove</Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => photoRef.current?.click()}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-g-mist/40 px-4 py-6 text-sm font-semibold text-slate-500 transition-colors hover:border-g-navy/40 hover:bg-g-mist hover:text-g-navy"
                  >
                    <Icon name="camera" className="h-5 w-5" /> Add a photo
                  </button>
                )}
              </Field>
            </div>
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
                <option value="OTHER">Other</option>
                <option value="UNKNOWN">Prefer not to say</option>
              </Select>
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="0244 000 000" />
            </Field>
            <Field label="Nationality">
              <Select value={['Ghanaian','Nigerian','British','Indian','Chinese','American','Togolese','Ivorian','Burkinabe','South African','Kenyan','Ethiopian','Cameroonian','German','Canadian','Other'].includes(form.nationality) ? form.nationality : '__OTHER__'} onChange={(e) => { if (e.target.value === '__OTHER__') { set('nationality', ''); } else { set('nationality', e.target.value); } }}>
                {['Ghanaian','Nigerian','British','Indian','Chinese','American','Togolese','Ivorian','Burkinabe','South African','Kenyan','Ethiopian','Cameroonian','German','Canadian'].map((n) => <option key={n} value={n}>{n}</option>)}
                <option value="__OTHER__">Other (type below)</option>
              </Select>
              {['Ghanaian','Nigerian','British','Indian','Chinese','American','Togolese','Ivorian','Burkinabe','South African','Kenyan','Ethiopian','Cameroonian','German','Canadian'].includes(form.nationality) ? null : (
                <Input className="mt-1" value={form.nationality} onChange={(e) => set('nationality', e.target.value)} placeholder="Type your nationality" />
              )}
            </Field>
            <Field label="Blood group">
              <Select value={form.bloodGroup} onChange={(e) => set('bloodGroup', e.target.value)}>
                <option value="">Unknown</option>
                {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
              </Select>
            </Field>
          </div>
        </Card>

        {/* --------------------------------------- identification (typed) */}
        <Card title={`Identification — ${idLabel}`}>
          {form.patientType === 'GHANAIAN' && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Ghana Card number">
                <Input value={form.ghanaCard} onChange={(e) => set('ghanaCard', e.target.value)} placeholder="GHA-000000000-0" />
              </Field>
              <Field label="NHIS number">
                <Input value={form.nhisNumber} onChange={(e) => set('nhisNumber', e.target.value)} placeholder="NHIS-00000000" />
              </Field>
            </div>
          )}

          {(form.patientType === 'FOREIGN' || form.patientType === 'REFUGEE' || form.patientType === 'OTHER') && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Passport number" hint={form.patientType === 'FOREIGN' ? 'Required for foreign nationals' : 'Optional'}>
                <Input value={form.passport} onChange={(e) => set('passport', e.target.value)} placeholder="e.g. G12345678" required={form.patientType === 'FOREIGN'} />
              </Field>
              <Field label="Country of residence">
                <Input value={form.countryOfResidence} onChange={(e) => set('countryOfResidence', e.target.value)} placeholder="e.g. Ghana, Nigeria…" />
              </Field>
            </div>
          )}

          {form.patientType === 'FOREIGN' && (
            <>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <Field label="Passport issue date">
                  <Input type="date" value={form.passportIssueDate} onChange={(e) => set('passportIssueDate', e.target.value)} />
                </Field>
                <Field label="Passport expiry date">
                  <Input type="date" value={form.passportExpiryDate} onChange={(e) => set('passportExpiryDate', e.target.value)} />
                </Field>
                <Field label="Visa / permit type">
                  <Select value={form.visaPermitType} onChange={(e) => set('visaPermitType', e.target.value)}>
                    {VISA_TYPES.map((v) => <option key={v} value={v}>{v[0] + v.slice(1).toLowerCase()}</option>)}
                  </Select>
                </Field>
                <Field label="Visa / permit number">
                  <Input value={form.visaPermitNumber} onChange={(e) => set('visaPermitNumber', e.target.value)} placeholder="e.g. V-0000000" />
                </Field>
                <Field label="Visa / permit expiry">
                  <Input type="date" value={form.visaPermitExpiry} onChange={(e) => set('visaPermitExpiry', e.target.value)} />
                </Field>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Permanent address abroad" className="md:col-span-2">
                  <Input value={form.permanentAddress} onChange={(e) => set('permanentAddress', e.target.value)} placeholder="Full address outside Ghana" />
                </Field>
                <Field label="International insurance provider">
                  <Input value={form.internationalInsurer} onChange={(e) => set('internationalInsurer', e.target.value)} placeholder="e.g. AXA, Cigna, Allianz…" />
                </Field>
                <Field label="Policy number">
                  <Input value={form.internationalPolicyNumber} onChange={(e) => set('internationalPolicyNumber', e.target.value)} placeholder="Policy / membership number" />
                </Field>
              </div>
            </>
          )}

          {form.patientType === 'OTHER' && (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Ghana Card number (optional)">
                <Input value={form.ghanaCard} onChange={(e) => set('ghanaCard', e.target.value)} placeholder="GHA-000000000-0" />
              </Field>
            </div>
          )}
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
            <Field label="Address in Ghana" className="md:col-span-2">
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
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label="Preferred language" hint="For SMS / WhatsApp reminders & outreach">
              <Select value={form.preferredLanguage} onChange={(e) => set('preferredLanguage', e.target.value)}>
                {LANGUAGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </Field>
            <label className="flex cursor-pointer items-start gap-2.5 pt-1 text-sm text-slate-600">
              <input type="checkbox" checked={form.smsConsent} onChange={(e) => set('smsConsent', e.target.checked)} className="mt-0.5 h-4 w-4 accent-g-red" />
              <span>Consent to SMS / WhatsApp appointment &amp; immunization reminders to <span className="font-semibold">{form.phone || 'the phone on file'}</span> — can be withdrawn anytime from the patient record.</span>
            </label>
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
