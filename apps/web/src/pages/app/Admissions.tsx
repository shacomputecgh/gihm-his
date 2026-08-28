import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { api, ApiRequestError } from '../../lib/api';
import { DEMO_ADMISSIONS } from '../../lib/demoData';
import { Icon } from '../../components/icons';
import type { AdmissionRecord, MpiCandidate } from '../../types';
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Select, Spinner, Textarea, useToast } from '../../components/ui';
import { fmtDate, titleCase } from '../../lib/format';
import { useAuth } from '../../lib/auth';

const PATIENT_TYPES = [
  { value: 'GHANAIAN', label: '🇬🇭 Ghanaian Citizen', desc: 'Ghana Card · NHIS · Digital Address · Region/District' },
  { value: 'FOREIGN', label: '🌍 Foreign National', desc: 'Passport · Visa/Permit · Country of Residence · International Insurance' },
  { value: 'REFUGEE', label: '🛡️ Refugee / Asylum Seeker', desc: 'Refugee ID · Country of Origin · Local Address' },
  { value: 'OTHER', label: 'Other', desc: 'Any other identification' },
];
const ADMISSION_TYPES = ['EMERGENCY', 'OPD_TO_IPD', 'ELECTIVE', 'REFERRAL', 'MATERNITY', 'SURGICAL', 'MEDICAL', 'OTHER'];
const SOURCES = ['HOME', 'EMERGENCY_DEPT', 'CLINIC', 'HOSPITAL', 'AMBULANCE', 'OTHER'];
const PAYMENT_METHODS = ['NHIS', 'PRIVATE_INSURANCE', 'CORPORATE', 'CASH', 'MOMO', 'BANK_CARD', 'SPONSOR', 'OTHER'];
const VISA_TYPES = ['TOURIST', 'STUDENT', 'WORK', 'RESIDENCE', 'DIPLOMATIC', 'OTHER'];
const ALLERGIES = ['Penicillin', 'Sulphonamides', 'Aspirin', 'Ibuprofen', 'Codeine', 'Latex', 'Peanuts', 'None known'];
const CONDITIONS = ['Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'Kidney Disease', 'Liver Disease', 'Epilepsy', 'Sickle Cell'];
const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const RHESUS = ['POSITIVE', 'NEGATIVE', 'UNKNOWN'];
const STATUS_TONE: Record<string, 'green' | 'gold' | 'gray'> = { ADMITTED: 'green', TRANSFERRED: 'gold', DISCHARGED: 'gray' };
const TYPE_TONE: Record<string, 'red' | 'navy' | 'gold' | 'blue' | 'gray' | 'green'> = { EMERGENCY: 'red', MATERNITY: 'blue', SURGICAL: 'gold', REFERRAL: 'navy', ELECTIVE: 'green', MEDICAL: 'navy', OPD_TO_IPD: 'gray', OTHER: 'gray' };
// Patient-type badges for the register — citizen / foreign / refugee / other.
const PT_TONE: Record<string, 'navy' | 'gold' | 'blue' | 'gray'> = { GHANAIAN: 'navy', FOREIGN: 'gold', REFUGEE: 'blue', OTHER: 'gray' };

const STEPS = ['Patient', 'Admission', 'Medical & Maternity', 'Insurance & Payment', 'Consent & Vitals'];

interface StaffHit { id: string; fullName: string }
interface PatientHit {
  id: string; fullName: string; mrn: string; sex: string | null; dateOfBirth: string | null; phone: string | null;
  ghanaCard: string | null; nhisNumber: string | null; passport: string | null; bloodGroup: string | null;
  allergies: string[]; nextOfKinName: string | null; nextOfKinPhone: string | null; emergencyContactPhone: string | null;
  community: string | null; address: string | null; employer: string | null; occupation: string | null; patientType: string;
}

const EMPTY = {
  patientType: 'GHANAIAN',
  fullName: '', preferredName: '', dateOfBirth: '', sex: 'M', nationality: 'Ghanaian', maritalStatus: 'Single',
  ghanaCard: '', nhisNumber: '', digitalAddress: '', gpsAddress: '', community: '', address: '', phone: '', email: '',
  passport: '', passportIssueDate: '', passportExpiryDate: '', visaType: 'RESIDENCE', visaNumber: '', visaExpiry: '',
  countryOfBirth: 'Ghana', countryOfResidence: '', permanentAddress: '', internationalInsurer: '', internationalPolicyNumber: '',
  interpreterRequired: false, interpreterLanguage: '', preferredContactMethod: 'PHONE', preferredLanguage: 'EN',
  nextOfKinName: '', nextOfKinRelationship: '', nextOfKinPhone: '', nextOfKinAlternativePhone: '', nextOfKinAddress: '',
  emergencySame: true, emergencyContactName: '', emergencyContactRelationship: '', emergencyContactPhone: '',
  guardianName: '', guardianRelationship: '', guardianPhone: '', guardianId: '', guardianAddress: '',
  employer: '', employerAddress: '', employerPhone: '', school: '', occupation: '',
  allergies: [] as string[], allergyDetails: '', currentMedications: '', conditions: [] as string[], otherCondition: '',
  surgeries: '', priorAdmissions: '', bloodGroup: '', rhesus: '',
  admissionType: 'MEDICAL', source: 'HOME', referringFacility: '', referringDoctor: '',
  chiefComplaint: '', provisionalDiagnosis: '', reason: '', ward: '', bed: '', nurseReceiving: '', admittedAt: '',
  consultantId: '', attendingDoctorId: '',
  pregnant: false, edd: '', gravida: '', parity: '', lmp: '',
  paymentMethod: 'CASH', billingAccount: '', insurerName: '', policyNumber: '', authorizationNumber: '',
  temperature: '', pulse: '', respiratoryRate: '', systolicBp: '', diastolicBp: '', spo2: '', weightKg: '', heightCm: '',
  consentSigned: false, notifyPhone: '',
};

export default function Admissions() {
  const { user } = useAuth();
  const canAdmit = !!user?.permissions.includes('write_clinical_note');
  const canView = canAdmit || !!user?.permissions.includes('view_clinical_record') || !!user?.permissions.includes('view_patient');
  const toast = useToast();

  const [admissions, setAdmissions] = useState<AdmissionRecord[] | null>(null);
  const [summary, setSummary] = useState<{ byStatus: Record<string, number>; active: number } | null>(null);
  const [filters, setFilters] = useState({ q: '', status: '', type: '' });
  const [busyId, setBusyId] = useState<string | null>(null);

  // Wizard
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(0);
  const [emergency, setEmergency] = useState(false);
  const [minor, setMinor] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [facilityId, setFacilityId] = useState(user?.facilityId ?? '');
  const [selectedPatient, setSelectedPatient] = useState<PatientHit | null>(null);
  const [patientQuery, setPatientQuery] = useState('');
  const [patientHits, setPatientHits] = useState<PatientHit[] | null>(null);
  const [candidates, setCandidates] = useState<MpiCandidate[]>([]);
  const [staff, setStaff] = useState<StaffHit[]>([]);

  // Detail drawer
  const [detail, setDetail] = useState<AdmissionRecord | null>(null);
  const [discharge, setDischarge] = useState({ summary: '', note: '' });
  const [transfer, setTransfer] = useState({ ward: '', bed: '', note: '' });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (key: 'allergies' | 'conditions', item: string) => {
    const list = form[key];
    set(key, list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  };

  const load = useCallback(async () => {
    try {
      const q = new URLSearchParams();
      if (filters.q) q.set('q', filters.q);
      if (filters.status) q.set('status', filters.status);
      if (filters.type) q.set('type', filters.type);
      const res = await api<{ items: AdmissionRecord[]; summary: { byStatus: Record<string, number>; active: number } }>(`/admissions?${q.toString()}`);
      setAdmissions(res.items);
      setSummary(res.summary);
    } catch {
      setAdmissions(DEMO_ADMISSIONS as unknown as AdmissionRecord[]);
      setSummary({ byStatus: { ADMITTED: DEMO_ADMISSIONS.length }, active: DEMO_ADMISSIONS.length });
    }
  }, [filters]);

  useEffect(() => {
    if (!canView) return;
    void load();
  }, [load, canView]);

  // Consultant/attending pickers — best-effort (only users with manage_users
  // can list staff); the fields stay optional when unavailable.
  useEffect(() => {
    if (!canAdmit) return;
    api<{ users: StaffHit[] }>('/admin/users')
      .then((res) => setStaff(res.users.filter((s) => s.fullName).map((s) => ({ id: s.id, fullName: s.fullName }))))
      .catch(() => setStaff([]));
  }, [canAdmit]);

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

  function pickPatient(p: PatientHit) {
    setSelectedPatient(p);
    setPatientHits(null);
    setPatientQuery('');
    setForm((f) => ({
      ...f,
      fullName: p.fullName, dateOfBirth: p.dateOfBirth?.slice(0, 10) ?? '', sex: p.sex ?? 'M', phone: p.phone ?? '',
      ghanaCard: p.ghanaCard ?? '', nhisNumber: p.nhisNumber ?? '', passport: p.passport ?? '',
      bloodGroup: p.bloodGroup ?? '', allergies: p.allergies ?? [], community: p.community ?? '', address: p.address ?? '',
      nextOfKinName: p.nextOfKinName ?? '', nextOfKinPhone: p.nextOfKinPhone ?? '',
      emergencyContactPhone: p.emergencyContactPhone ?? '', employer: p.employer ?? '', occupation: p.occupation ?? '',
    }));
  }

  function buildPayload() {
    const patient: Record<string, unknown> = {
      fullName: form.fullName.trim(), dateOfBirth: form.dateOfBirth || undefined, sex: form.sex,
      phone: form.phone || undefined, email: form.email || undefined, nationality: form.nationality,
      preferredLanguage: form.preferredLanguage,
      patientType: selectedPatient ? undefined : emergency ? 'OTHER' : form.patientType,
      ghanaCard: form.ghanaCard || undefined, nhisNumber: form.nhisNumber || undefined, passport: form.passport || undefined,
      preferredName: form.preferredName || undefined, countryOfBirth: form.countryOfBirth || undefined,
      passportIssueDate: form.passportIssueDate || undefined, passportExpiryDate: form.passportExpiryDate || undefined,
      visaPermitType: form.visaType || undefined, visaPermitNumber: form.visaNumber || undefined, visaPermitExpiry: form.visaExpiry || undefined,
      countryOfResidence: form.countryOfResidence || undefined, permanentAddress: form.permanentAddress || undefined,
      internationalInsurer: form.internationalInsurer || undefined, internationalPolicyNumber: form.internationalPolicyNumber || undefined,
      interpreterRequired: form.interpreterRequired, interpreterLanguage: form.interpreterLanguage || undefined,
      preferredContactMethod: form.preferredContactMethod || undefined, community: form.community || undefined,
      address: form.address || undefined, maritalStatus: form.maritalStatus || undefined,
      nextOfKinName: form.nextOfKinName || undefined, nextOfKinRelationship: form.nextOfKinRelationship || undefined,
      nextOfKinPhone: form.nextOfKinPhone || undefined, nextOfKinAlternativePhone: form.nextOfKinAlternativePhone || undefined,
      nextOfKinAddress: form.nextOfKinAddress || undefined,
      emergencyContactSameAsNok: form.emergencySame,
      emergencyContactName: form.emergencyContactName || undefined, emergencyContactRelationship: form.emergencyContactRelationship || undefined,
      emergencyContactPhone: form.emergencyContactPhone || undefined,
      parentGuardianName: minor ? (form.guardianName || undefined) : undefined, parentGuardianRelationship: minor ? (form.guardianRelationship || undefined) : undefined,
      parentGuardianPhone: minor ? (form.guardianPhone || undefined) : undefined, parentGuardianIdNumber: minor ? (form.guardianId || undefined) : undefined,
      parentGuardianAddress: minor ? (form.guardianAddress || undefined) : undefined,
      employer: form.employer || undefined, employerAddress: form.employerAddress || undefined, employerPhone: form.employerPhone || undefined,
      school: minor ? (form.school || undefined) : undefined, occupation: form.occupation || undefined,
      currentMedications: form.currentMedications || undefined,
      previousConditions: form.conditions.length ? [...form.conditions, ...(form.otherCondition ? [form.otherCondition] : [])] : undefined,
      previousSurgeries: form.surgeries || undefined, previousAdmissionsText: form.priorAdmissions || undefined,
      rhesus: form.rhesus || undefined, bloodGroup: form.bloodGroup || undefined,
      allergies: form.allergies.includes('None known') ? [] : form.allergies,
      consentAccepted: form.consentSigned,
      force: candidates.length > 0,
    };
    const admission: Record<string, unknown> = {
      type: form.admissionType, source: form.source, referringFacility: form.referringFacility || undefined,
      referringDoctor: form.referringDoctor || undefined, chiefComplaint: form.chiefComplaint || undefined,
      provisionalDiagnosis: form.provisionalDiagnosis || undefined, reason: form.reason || undefined,
      ward: form.ward || undefined, bed: form.bed || undefined,
      consultantId: form.consultantId || undefined, attendingDoctorId: form.attendingDoctorId || undefined,
      nurseReceiving: form.nurseReceiving || undefined, admittedAt: form.admittedAt || undefined,
      paymentMethod: form.paymentMethod, billingAccount: form.billingAccount || undefined,
      insurerName: form.insurerName || undefined, policyNumber: form.policyNumber || undefined,
      authorizationNumber: form.authorizationNumber || undefined,
      pregnant: form.admissionType === 'MATERNITY' ? form.pregnant : undefined,
      edd: form.edd || undefined, gravida: form.gravida || undefined, parity: form.parity || undefined, lmp: form.lmp || undefined,
    };
    return {
      facilityId: user?.facilityId ?? facilityId,
      patientId: selectedPatient?.id,
      emergency,
      patient,
      admission,
      vitals: {
        temperature: form.temperature || undefined, pulse: form.pulse || undefined, respiratoryRate: form.respiratoryRate || undefined,
        systolicBp: form.systolicBp || undefined, diastolicBp: form.diastolicBp || undefined, spo2: form.spo2 || undefined,
        weightKg: form.weightKg || undefined, heightCm: form.heightCm || undefined,
      },
      consentSigned: form.consentSigned,
      notifyPhone: form.notifyPhone || undefined,
    };
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user?.facilityId && !facilityId) {
      toast('A facility is required to admit — enter the facility ID', 'error');
      return;
    }
    // Per-type identification guard: a new citizen admission needs a Ghana
    // Card or NHIS number; a foreign admission needs the passport. Emergency
    // (identification pending) and existing patients are exempt by design.
    if (!emergency && !selectedPatient) {
      const missing: string[] = [];
      if (form.patientType === 'GHANAIAN' && !form.ghanaCard.trim() && !form.nhisNumber.trim()) missing.push('a Ghana Card or NHIS number');
      if (form.patientType === 'FOREIGN' && !form.passport.trim()) missing.push('the passport number');
      if (missing.length) {
        toast(`Identification required for ${patientTypeLabel(form.patientType)} admission — provide ${missing.join(' and ')}`, 'error');
        setStep(0);
        return;
      }
    }
    setBusyId('new');
    try {
      const res = await api<{ admission: AdmissionRecord }>('/admissions', { method: 'POST', body: buildPayload() });
      toast(`Admission ${res.admission.admissionNumber ?? ''} created`, 'success');
      setShowForm(false);
      setForm({ ...EMPTY });
      setSelectedPatient(null);
      setCandidates([]);
      setStep(0);
      setEmergency(false);
      setMinor(false);
      setDetail(res.admission);
      void load();
    } catch (err) {
      if (err instanceof ApiRequestError && err.code === 'MPI_DUPLICATE') {
        setCandidates((err.candidates as MpiCandidate[]) ?? []);
        toast('Possible duplicate patient found — review below', 'info');
        return;
      }
      toast(err instanceof Error ? err.message : 'Admission failed', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function openDetail(id: string) {
    setDetail(null);
    try {
      const res = await api<{ admission: AdmissionRecord }>(`/admissions/${id}`);
      setDetail(res.admission);
      setDischarge({ summary: res.admission.dischargeSummary ?? '', note: res.admission.dischargeNote ?? '' });
      setTransfer({ ward: res.admission.ward ?? '', bed: res.admission.bed ?? '', note: '' });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not load admission', 'error');
    }
  }

  async function doDischarge(e: FormEvent) {
    e.preventDefault();
    if (!detail) return;
    setBusyId(`d-${detail.id}`);
    try {
      const res = await api<{ admission: AdmissionRecord }>(`/admissions/${detail.id}/discharge`, { method: 'POST', body: { summary: discharge.summary, note: discharge.note || undefined } });
      toast('Patient discharged', 'success');
      setDetail(res.admission);
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Discharge failed', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function doTransfer(e: FormEvent) {
    e.preventDefault();
    if (!detail) return;
    setBusyId(`t-${detail.id}`);
    try {
      const res = await api<{ admission: AdmissionRecord }>(`/admissions/${detail.id}/transfer`, { method: 'POST', body: { ward: transfer.ward || undefined, bed: transfer.bed || undefined, note: transfer.note || undefined } });
      toast('Patient transferred', 'success');
      setDetail(res.admission);
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Transfer failed', 'error');
    } finally {
      setBusyId(null);
    }
  }

  const patientTypeLabel = (t: string | undefined) => PATIENT_TYPES.find((p) => p.value === t)?.label.split(' ').slice(1).join(' ') ?? titleCase(t ?? 'Other');

  const statCards = useMemo(
    () => [
      { label: 'Active admissions', value: String(summary?.active ?? 0), sub: `${summary?.byStatus?.TRANSFERRED ?? 0} transferred`, tone: 'green' as const },
      { label: 'Discharged', value: String(summary?.byStatus?.DISCHARGED ?? 0), sub: 'this register view', tone: 'gray' as const },
    ],
    [summary],
  );

  if (!canView) return <EmptyState icon="fileText" title="No access" message="Admissions require the View clinical record or View patient permission." />;

  return (
    <div>
      <PageHeader
        title="Admissions"
        subtitle="Ghana hospital admission form — Ghanaian / foreign / minor intake with emergency identification-pending mode."
        action={canAdmit ? <Button onClick={() => setShowForm((s) => !s)} icon="plus">{showForm ? 'Close form' : 'New Admission'}</Button> : <Badge tone="navy">{summary?.active ?? 0} active</Badge>}
      />

      {/* Stat cards */}
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label} className="!p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{s.label}</p>
            <p className={`mt-2 text-2xl font-bold tabular-nums ${s.tone === 'green' ? 'text-g-green' : 'text-g-ink'}`}>{s.value}</p>
            <p className="mt-1 text-xs text-slate-400">{s.sub}</p>
          </Card>
        ))}
        <Card className="!p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bed status</p>
          <p className="mt-2 text-2xl font-bold text-g-ink">{summary?.active ?? 0} occupied</p>
          <p className="mt-1 text-xs text-slate-400">via the beds register</p>
        </Card>
        <Card className="!p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Identification</p>
          <p className="mt-2 text-2xl font-bold text-g-ink">0 pending</p>
          <p className="mt-1 text-xs text-slate-400">emergency admissions</p>
        </Card>
      </div>

      {/* Filters + register */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} placeholder="Search name, MRN, admission no…" className="w-64" />
        <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="w-40">
          {['', 'ADMITTED', 'TRANSFERRED', 'DISCHARGED'].map((s) => <option key={s} value={s}>{s === '' ? 'All statuses' : titleCase(s)}</option>)}
        </Select>
        <Select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className="w-44">
          {['', ...ADMISSION_TYPES].map((s) => <option key={s} value={s}>{s === '' ? 'All types' : titleCase(s)}</option>)}
        </Select>
      </div>

      <Card pad={false}>
        {!admissions ? (
          <div className="p-10"><Spinner /></div>
        ) : admissions.length === 0 ? (
          <EmptyState icon="fileText" title="No admissions" message="No admissions match this filter — start a new admission to open the register." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
                  {['Admission', 'Patient', 'Type', 'Ward / Bed', 'Consultant', 'Admitted', 'Status', ''].map((h) => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {admissions.map((a) => (
                  <tr key={a.id} className="cursor-pointer hover:bg-g-mist/40" onClick={() => void openDetail(a.id)}>
                    <td className="px-5 py-3">
                      <p className="font-mono text-xs font-bold text-g-navy">{a.admissionNumber ?? '—'}</p>
                      {a.identificationPending && <Badge tone="red">ID pending</Badge>}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-g-ink">{a.patient?.fullName ?? '—'}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                        <span className="font-mono">{a.patient?.mrn ?? ''}</span>
                        <Badge tone={PT_TONE[a.patient?.patientType ?? ''] ?? 'gray'}>{patientTypeLabel(a.patient?.patientType)}</Badge>
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={TYPE_TONE[a.admissionType ?? ''] ?? 'gray'}>{titleCase(a.admissionType ?? '—')}</Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{a.ward ?? '—'}{a.bed ? ` · ${a.bed}` : ''}</td>
                    <td className="px-5 py-3 text-slate-500">{a.consultant?.fullName ?? '—'}</td>
                    <td className="px-5 py-3 text-slate-500">{fmtDate(a.admittedAt)}</td>
                    <td className="px-5 py-3"><Badge tone={STATUS_TONE[a.status] ?? 'gray'}>{titleCase(a.status)}</Badge></td>
                    <td className="px-5 py-3 text-slate-300">→</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ---------------------------------------------------------- wizard */}
      {showForm && canAdmit && (
        <Card className="mt-5">
          {/* Emergency toggle */}
          <div className={`mb-4 flex items-start gap-3 rounded-xl border p-4 ${emergency ? 'border-g-red/40 bg-g-red/10' : 'border-slate-200 bg-slate-50'}`}>
            <span className="text-xl">🚑</span>
            <div className="flex-1">
              <p className="font-bold text-g-ink">Emergency admission — identification pending</p>
              <p className="text-sm text-slate-600">Unconscious or without identification? Admit immediately and complete identification later. The admission is flagged and appears in the register with an “ID pending” badge.</p>
              <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold">
                <input type="checkbox" className="h-4 w-4 accent-g-red" checked={emergency} onChange={(e) => setEmergency(e.target.checked)} />
                Emergency mode
              </label>
            </div>
          </div>

          {/* Step indicator */}
          <div className="mb-5 flex flex-wrap items-center gap-1.5">
            {STEPS.map((s, i) => (
              <button
                key={s}
                onClick={() => setStep(i)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${step === i ? 'bg-g-navy text-white' : i < step ? 'bg-g-green/15 text-g-green' : 'bg-slate-100 text-slate-400'}`}
              >
                {i + 1}. {s}
              </button>
            ))}
          </div>

          <form onSubmit={submit}>
            {/* ---------------- Step 1: Patient ---------------- */}
            {step === 0 && (
              <div className="space-y-4">
                {!user?.facilityId && (
                  <div className="grid gap-3 md:grid-cols-3">
                    <Field label="Facility ID (required for admission)" className="md:col-span-2">
                      <Input required value={facilityId} onChange={(e) => setFacilityId(e.target.value)} placeholder="Facility id" />
                    </Field>
                  </div>
                )}
                {!emergency && (
                  <>
                    {!selectedPatient ? (
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="md:col-span-3">
                          <p className="mb-2 text-sm font-bold text-g-ink">Is this patient already registered?</p>
                          <div className="flex gap-2">
                            <Input value={patientQuery} onChange={(e) => setPatientQuery(e.target.value)} placeholder="Search by name or MRN…" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void searchPatients(); } }} />
                            <Button type="button" variant="outline" onClick={() => void searchPatients()}>Search</Button>
                          </div>
                          {patientHits && patientHits.length > 0 && (
                            <div className="mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                              {patientHits.map((p) => (
                                <button key={p.id} type="button" className="block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-g-mist" onClick={() => pickPatient(p)}>
                                  <span className="font-medium text-g-ink">{p.fullName}</span> <span className="font-mono text-xs text-slate-400">{p.mrn}</span>
                                  {p.phone && <span className="ml-2 text-xs text-slate-400">{p.phone}</span>}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="md:col-span-3">
                          <p className="mb-2 text-sm font-bold text-g-ink">…or register a new patient — choose the admission type:</p>

                          {/* Primary choice: citizen vs foreign admission (+ minor) */}
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {[
                              { value: 'GHANAIAN', flag: '🇬🇭', title: 'Citizen admission', desc: 'Ghanaian national — Ghana Card · NHIS · Digital Address · Region / District' },
                              { value: 'FOREIGN', flag: '🌍', title: 'Foreign admission', desc: 'Non-Ghanaian — Passport · Visa / Permit · Country of Residence · International Insurance' },
                              { value: 'MINOR', flag: '👶', title: 'Minor admission', desc: 'Child patient — parent / guardian details collected below' },
                            ].map((t) => {
                              const active = t.value === 'MINOR' ? minor : !selectedPatient && form.patientType === t.value;
                              const click = () => {
                                if (t.value === 'MINOR') {
                                  setMinor(true);
                                  return;
                                }
                                set('patientType', t.value as 'GHANAIAN' | 'FOREIGN');
                                set('nationality', t.value === 'GHANAIAN' ? 'Ghanaian' : '');
                                // Smart payment default: citizens default to NHIS,
                                // foreign nationals to private insurance.
                                set('paymentMethod', t.value === 'GHANAIAN' ? 'NHIS' : 'PRIVATE_INSURANCE');
                                setSelectedPatient(null);
                              };
                              return (
                                <button
                                  key={t.value}
                                  type="button"
                                  onClick={click}
                                  className={`group cursor-pointer rounded-2xl border-2 p-4 text-left transition-all ${active ? 'border-g-navy bg-g-navy/5 shadow-sm' : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-g-navy/50 hover:shadow-md'}`}
                                >
                                  <span className="flex items-center gap-3">
                                    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl transition-colors ${active ? 'bg-g-navy' : 'bg-g-mist group-hover:bg-g-navy/10'}`}>{t.flag}</span>
                                    <span>
                                      <span className="block text-base font-bold text-g-ink">{t.title}</span>
                                      <span className="mt-0.5 block text-xs text-slate-500">{t.desc}</span>
                                    </span>
                                  </span>
                                  {active && (
                                    <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-g-navy px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                      <Icon name="check" className="h-3 w-3" /> Selected
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Secondary: refugee / other */}
                          <div className="mt-2.5 flex flex-wrap items-center gap-2">
                            <span className="text-xs text-slate-400">Also:</span>
                            {PATIENT_TYPES.filter((t) => t.value !== 'GHANAIAN' && t.value !== 'FOREIGN').map((t) => (
                              <button
                                key={t.value}
                                type="button"
                                onClick={() => { set('patientType', t.value); set('nationality', ''); set('paymentMethod', 'PRIVATE_INSURANCE'); setSelectedPatient(null); }}
                                className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold transition ${!selectedPatient && form.patientType === t.value ? 'border-g-navy bg-g-navy text-white' : 'border-slate-200 bg-white text-slate-500 hover:border-g-navy/50 hover:text-g-navy'}`}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between rounded-xl border border-g-green/30 bg-g-green/10 px-4 py-3">
                        <div>
                          <p className="font-bold text-g-ink">{selectedPatient.fullName} · <span className="font-mono text-xs">{selectedPatient.mrn}</span></p>
                          <p className="text-xs text-slate-500">Existing patient — identification fields below are read-only context.</p>
                        </div>
                        <button type="button" className="cursor-pointer text-xs font-bold text-g-red" onClick={() => { setSelectedPatient(null); setForm({ ...EMPTY }); }}>Change patient</button>
                      </div>
                    )}
                  </>
                )}

                {emergency && (
                  <div className="grid gap-3 rounded-xl border border-g-red/20 bg-g-red/5 p-4 md:grid-cols-3">
                    <p className="text-sm font-bold text-g-ink md:col-span-3">Emergency intake — capture only what is known:</p>
                    <Field label="Name (if known)"><Input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="Unknown" /></Field>
                    <Field label="Phone"><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="For SMS confirmation" /></Field>
                    <Field label="Sex"><Select value={form.sex} onChange={(e) => set('sex', e.target.value)}><option value="M">Male</option><option value="F">Female</option><option value="O">Other</option></Select></Field>
                    <Field label="Date of birth (if known)"><Input type="date" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} /></Field>
                  </div>
                )}

                {!emergency && selectedPatient === null && (
                  <div className="grid gap-3 md:grid-cols-4">
                    <Field label="Surname & first name *" className="md:col-span-2"><Input required value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="Full name" /></Field>
                    <Field label="Preferred name"><Input value={form.preferredName} onChange={(e) => set('preferredName', e.target.value)} /></Field>
                    <Field label="Date of birth"><Input type="date" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} /></Field>
                    <Field label="Sex">
                      <Select value={form.sex} onChange={(e) => set('sex', e.target.value)}>
                        <option value="M">Male</option><option value="F">Female</option><option value="O">Other</option>
                      </Select>
                    </Field>
                    <Field label="Marital status">
                      <Select value={form.maritalStatus} onChange={(e) => set('maritalStatus', e.target.value)}>
                        {['Single', 'Married', 'Divorced', 'Widowed', 'Other'].map((m) => <option key={m} value={m}>{m}</option>)}
                      </Select>
                    </Field>
                    <Field label="Nationality"><Input value={form.nationality} onChange={(e) => set('nationality', e.target.value)} /></Field>
                    <Field label="Country of birth"><Input value={form.countryOfBirth} onChange={(e) => set('countryOfBirth', e.target.value)} /></Field>
                    <Field label="Mobile phone"><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+233…" /></Field>
                    <Field label="Email"><Input value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
                    <Field label="Preferred contact">
                      <Select value={form.preferredContactMethod} onChange={(e) => set('preferredContactMethod', e.target.value)}>
                        {['PHONE', 'SMS', 'WHATSAPP', 'EMAIL'].map((m) => <option key={m} value={m}>{titleCase(m)}</option>)}
                      </Select>
                    </Field>
                    <Field label="Interpreter required" className="flex items-end">
                      <label className="inline-flex cursor-pointer items-center gap-2 pb-2 text-sm font-semibold">
                        <input type="checkbox" className="h-4 w-4 accent-g-navy" checked={form.interpreterRequired} onChange={(e) => set('interpreterRequired', e.target.checked)} />
                        Yes — language: <Input value={form.interpreterLanguage} onChange={(e) => set('interpreterLanguage', e.target.value)} className="!w-28" />
                      </label>
                    </Field>
                  </div>
                )}

                {/* Ghanaian identification */}
                {!emergency && selectedPatient === null && form.patientType === 'GHANAIAN' && (
                  <div className="rounded-xl border border-slate-100 p-4">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">🇬🇭 Ghanaian identification</p>
                    <div className="grid gap-3 md:grid-cols-4">
                      <Field label="Ghana Card number"><Input value={form.ghanaCard} onChange={(e) => set('ghanaCard', e.target.value)} placeholder="GHA-…" /></Field>
                      <Field label="NHIS membership number"><Input value={form.nhisNumber} onChange={(e) => set('nhisNumber', e.target.value)} /></Field>
                      <Field label="GhanaPost GPS address"><Input value={form.gpsAddress} onChange={(e) => set('gpsAddress', e.target.value)} placeholder="e.g. GA-123-4567" /></Field>
                      <Field label="Digital address"><Input value={form.digitalAddress} onChange={(e) => set('digitalAddress', e.target.value)} /></Field>
                      <Field label="Community / town" className="md:col-span-2"><Input value={form.community} onChange={(e) => set('community', e.target.value)} /></Field>
                      <Field label="Residential address" className="md:col-span-2"><Input value={form.address} onChange={(e) => set('address', e.target.value)} /></Field>
                    </div>
                  </div>
                )}

                {/* Foreign / refugee / other identification */}
                {!emergency && selectedPatient === null && form.patientType !== 'GHANAIAN' && (
                  <div className="rounded-xl border border-slate-100 p-4">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">🌍 Foreign national identification</p>
                    <div className="grid gap-3 md:grid-cols-4">
                      <Field label="Passport number"><Input value={form.passport} onChange={(e) => set('passport', e.target.value)} /></Field>
                      <Field label="Passport issue date"><Input type="date" value={form.passportIssueDate} onChange={(e) => set('passportIssueDate', e.target.value)} /></Field>
                      <Field label="Passport expiry date"><Input type="date" value={form.passportExpiryDate} onChange={(e) => set('passportExpiryDate', e.target.value)} /></Field>
                      <Field label="Visa / permit type">
                        <Select value={form.visaType} onChange={(e) => set('visaType', e.target.value)}>
                          {VISA_TYPES.map((v) => <option key={v} value={v}>{titleCase(v)}</option>)}
                        </Select>
                      </Field>
                      <Field label="Visa / permit number"><Input value={form.visaNumber} onChange={(e) => set('visaNumber', e.target.value)} /></Field>
                      <Field label="Visa expiry"><Input type="date" value={form.visaExpiry} onChange={(e) => set('visaExpiry', e.target.value)} /></Field>
                      <Field label="Country of residence"><Input value={form.countryOfResidence} onChange={(e) => set('countryOfResidence', e.target.value)} /></Field>
                      <Field label="Address in Ghana"><Input value={form.address} onChange={(e) => set('address', e.target.value)} /></Field>
                      <Field label="Permanent address abroad"><Input value={form.permanentAddress} onChange={(e) => set('permanentAddress', e.target.value)} /></Field>
                      <Field label="International insurer"><Input value={form.internationalInsurer} onChange={(e) => set('internationalInsurer', e.target.value)} /></Field>
                      <Field label="International policy no."><Input value={form.internationalPolicyNumber} onChange={(e) => set('internationalPolicyNumber', e.target.value)} /></Field>
                    </div>
                  </div>
                )}

                {/* Contact + next of kin */}
                <div className="rounded-xl border border-slate-100 p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Contact · next of kin · emergency contact</p>
                  <div className="grid gap-3 md:grid-cols-4">
                    <Field label="Next of kin name"><Input value={form.nextOfKinName} onChange={(e) => set('nextOfKinName', e.target.value)} /></Field>
                    <Field label="Relationship"><Input value={form.nextOfKinRelationship} onChange={(e) => set('nextOfKinRelationship', e.target.value)} /></Field>
                    <Field label="Telephone"><Input value={form.nextOfKinPhone} onChange={(e) => set('nextOfKinPhone', e.target.value)} /></Field>
                    <Field label="Alternative phone"><Input value={form.nextOfKinAlternativePhone} onChange={(e) => set('nextOfKinAlternativePhone', e.target.value)} /></Field>
                    <Field label="Address" className="md:col-span-4"><Input value={form.nextOfKinAddress} onChange={(e) => set('nextOfKinAddress', e.target.value)} /></Field>
                    <div className="md:col-span-4">
                      <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold">
                        <input type="checkbox" className="h-4 w-4 accent-g-navy" checked={form.emergencySame} onChange={(e) => set('emergencySame', e.target.checked)} />
                        Emergency contact is the same as next of kin
                      </label>
                    </div>
                    {!form.emergencySame && (
                      <>
                        <Field label="Emergency contact name"><Input value={form.emergencyContactName} onChange={(e) => set('emergencyContactName', e.target.value)} /></Field>
                        <Field label="Relationship"><Input value={form.emergencyContactRelationship} onChange={(e) => set('emergencyContactRelationship', e.target.value)} /></Field>
                        <Field label="Phone"><Input value={form.emergencyContactPhone} onChange={(e) => set('emergencyContactPhone', e.target.value)} /></Field>
                      </>
                    )}
                  </div>
                </div>

                {/* Minor / guardian */}
                {!emergency && (
                  <div className="rounded-xl border border-slate-100 p-4">
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold">
                      <input type="checkbox" className="h-4 w-4 accent-g-navy" checked={minor} onChange={(e) => setMinor(e.target.checked)} />
                      👶 Minor — parent / guardian information
                    </label>
                    {minor && (
                      <div className="mt-3 grid gap-3 md:grid-cols-4">
                        <Field label="Parent / guardian name"><Input value={form.guardianName} onChange={(e) => set('guardianName', e.target.value)} /></Field>
                        <Field label="Relationship"><Input value={form.guardianRelationship} onChange={(e) => set('guardianRelationship', e.target.value)} /></Field>
                        <Field label="Phone"><Input value={form.guardianPhone} onChange={(e) => set('guardianPhone', e.target.value)} /></Field>
                        <Field label="National ID / passport no."><Input value={form.guardianId} onChange={(e) => set('guardianId', e.target.value)} /></Field>
                        <Field label="Address" className="md:col-span-4"><Input value={form.guardianAddress} onChange={(e) => set('guardianAddress', e.target.value)} /></Field>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ---------------- Step 2: Admission ---------------- */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <Field label="Type of admission">
                    <Select value={form.admissionType} onChange={(e) => set('admissionType', e.target.value)}>
                      {ADMISSION_TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
                    </Select>
                  </Field>
                  <Field label="Source of admission">
                    <Select value={form.source} onChange={(e) => set('source', e.target.value)}>
                      {SOURCES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
                    </Select>
                  </Field>
                  <Field label="Referring facility"><Input value={form.referringFacility} onChange={(e) => set('referringFacility', e.target.value)} /></Field>
                  <Field label="Referring doctor"><Input value={form.referringDoctor} onChange={(e) => set('referringDoctor', e.target.value)} /></Field>
                  <Field label="Ward"><Input value={form.ward} onChange={(e) => set('ward', e.target.value)} placeholder="e.g. Male Medical Ward" /></Field>
                  <Field label="Bed no."><Input value={form.bed} onChange={(e) => set('bed', e.target.value)} placeholder="e.g. M-12" /></Field>
                  <Field label="Admitted on"><Input type="date" value={form.admittedAt} onChange={(e) => set('admittedAt', e.target.value)} /></Field>
                  {staff.length > 0 ? (
                    <>
                      <Field label="Consultant / doctor">
                        <Select value={form.consultantId} onChange={(e) => set('consultantId', e.target.value)}>
                          <option value="">— none —</option>
                          {staff.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                        </Select>
                      </Field>
                      <Field label="Attending doctor">
                        <Select value={form.attendingDoctorId} onChange={(e) => set('attendingDoctorId', e.target.value)}>
                          <option value="">— none —</option>
                          {staff.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                        </Select>
                      </Field>
                    </>
                  ) : (
                    <Field label="Nurse receiving / admitting clerk"><Input value={form.nurseReceiving} onChange={(e) => set('nurseReceiving', e.target.value)} /></Field>
                  )}
                </div>
                <Field label="Chief complaint / reason for admission" className="md:col-span-4"><Textarea rows={2} value={form.chiefComplaint} onChange={(e) => set('chiefComplaint', e.target.value)} /></Field>
                <Field label="Provisional diagnosis"><Input value={form.provisionalDiagnosis} onChange={(e) => set('provisionalDiagnosis', e.target.value)} /></Field>
                <Field label="Reason / notes"><Textarea rows={2} value={form.reason} onChange={(e) => set('reason', e.target.value)} /></Field>
              </div>
            )}

            {/* ---------------- Step 3: Medical & maternity ---------------- */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-100 p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Known allergies</p>
                  <div className="flex flex-wrap gap-2">
                    {ALLERGIES.map((a) => (
                      <button key={a} type="button" onClick={() => toggle('allergies', a)}
                        className={`cursor-pointer rounded-full px-3 py-1 text-xs font-bold transition ${form.allergies.includes(a) ? 'bg-g-red text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                        {a}
                      </button>
                    ))}
                  </div>
                  <Field label="Allergy details" className="mt-3"><Input value={form.allergyDetails} onChange={(e) => set('allergyDetails', e.target.value)} /></Field>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Current medications"><Textarea rows={2} value={form.currentMedications} onChange={(e) => set('currentMedications', e.target.value)} placeholder="Name, dose, frequency…" /></Field>
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Previous medical conditions</p>
                    <div className="flex flex-wrap gap-2">
                      {CONDITIONS.map((c) => (
                        <button key={c} type="button" onClick={() => toggle('conditions', c)}
                          className={`cursor-pointer rounded-full px-3 py-1 text-xs font-bold transition ${form.conditions.includes(c) ? 'bg-g-navy text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                    <Input value={form.otherCondition} onChange={(e) => set('otherCondition', e.target.value)} placeholder="Other condition…" className="mt-2" />
                  </div>
                  <Field label="Previous operations / surgeries"><Textarea rows={2} value={form.surgeries} onChange={(e) => set('surgeries', e.target.value)} /></Field>
                  <Field label="Previous hospital admissions"><Textarea rows={2} value={form.priorAdmissions} onChange={(e) => set('priorAdmissions', e.target.value)} /></Field>
                  <Field label="Blood group">
                    <Select value={form.bloodGroup} onChange={(e) => set('bloodGroup', e.target.value)}>
                      <option value="">Unknown</option>
                      {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
                    </Select>
                  </Field>
                  <Field label="Rhesus">
                    <Select value={form.rhesus} onChange={(e) => set('rhesus', e.target.value)}>
                      {RHESUS.map((r) => <option key={r} value={r}>{titleCase(r)}</option>)}
                    </Select>
                  </Field>
                </div>

                {(form.sex === 'F' || form.admissionType === 'MATERNITY') && (
                  <div className="rounded-xl border border-g-blue/30 bg-g-blue/5 p-4">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-g-blue">🤰 Maternity information</p>
                    <div className="grid gap-3 md:grid-cols-4">
                      <Field label="Pregnant?">
                        <Select value={String(form.pregnant)} onChange={(e) => set('pregnant', e.target.value === 'true')}>
                          <option value="false">No</option><option value="true">Yes</option>
                        </Select>
                      </Field>
                      <Field label="Expected date of delivery"><Input type="date" value={form.edd} onChange={(e) => set('edd', e.target.value)} /></Field>
                      <Field label="Previous pregnancies"><Input type="number" min={0} value={form.gravida} onChange={(e) => set('gravida', e.target.value)} /></Field>
                      <Field label="Number of children"><Input type="number" min={0} value={form.parity} onChange={(e) => set('parity', e.target.value)} /></Field>
                      <Field label="Last menstrual period"><Input type="date" value={form.lmp} onChange={(e) => set('lmp', e.target.value)} /></Field>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ---------------- Step 4: Insurance & payment ---------------- */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-100 p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Insurance</p>
                  <div className="grid gap-3 md:grid-cols-4">
                    <Field label="NHIS number"><Input value={form.nhisNumber} onChange={(e) => set('nhisNumber', e.target.value)} placeholder={selectedPatient?.nhisNumber ?? ''} /></Field>
                    <Field label="Private / corporate insurer"><Input value={form.insurerName} onChange={(e) => set('insurerName', e.target.value)} /></Field>
                    <Field label="Policy / member number"><Input value={form.policyNumber} onChange={(e) => set('policyNumber', e.target.value)} /></Field>
                    <Field label="Authorization number"><Input value={form.authorizationNumber} onChange={(e) => set('authorizationNumber', e.target.value)} /></Field>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-4">
                  <Field label="Payment method">
                    <Select value={form.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value)}>
                      {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{titleCase(m)}</option>)}
                    </Select>
                  </Field>
                  <Field label="Billing account no."><Input value={form.billingAccount} onChange={(e) => set('billingAccount', e.target.value)} /></Field>
                  <Field label="Occupation"><Input value={form.occupation} onChange={(e) => set('occupation', e.target.value)} /></Field>
                  <Field label="Employer"><Input value={form.employer} onChange={(e) => set('employer', e.target.value)} /></Field>
                  <Field label="Employer address"><Input value={form.employerAddress} onChange={(e) => set('employerAddress', e.target.value)} /></Field>
                  <Field label="Employer phone"><Input value={form.employerPhone} onChange={(e) => set('employerPhone', e.target.value)} /></Field>
                  {minor && <Field label="School / institution"><Input value={form.school} onChange={(e) => set('school', e.target.value)} /></Field>}
                </div>
              </div>
            )}

            {/* ---------------- Step 5: Consent & vitals ---------------- */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-100 p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Vital signs on admission (hospital use)</p>
                  <div className="grid gap-3 md:grid-cols-4">
                    <Field label="Temperature (°C)"><Input type="number" step="0.1" min={30} max={45} value={form.temperature} onChange={(e) => set('temperature', e.target.value)} /></Field>
                    <Field label="Pulse (bpm)"><Input type="number" min={20} max={250} value={form.pulse} onChange={(e) => set('pulse', e.target.value)} /></Field>
                    <Field label="Respiratory rate"><Input type="number" min={4} max={80} value={form.respiratoryRate} onChange={(e) => set('respiratoryRate', e.target.value)} /></Field>
                    <Field label="Blood pressure (sys/dia)"><div className="flex gap-2"><Input type="number" placeholder="Sys" value={form.systolicBp} onChange={(e) => set('systolicBp', e.target.value)} /><Input type="number" placeholder="Dia" value={form.diastolicBp} onChange={(e) => set('diastolicBp', e.target.value)} /></div></Field>
                    <Field label="SpO₂ (%)"><Input type="number" min={50} max={100} value={form.spo2} onChange={(e) => set('spo2', e.target.value)} /></Field>
                    <Field label="Weight (kg)"><Input type="number" min={0} max={400} value={form.weightKg} onChange={(e) => set('weightKg', e.target.value)} /></Field>
                    <Field label="Height (cm)"><Input type="number" min={20} max={250} value={form.heightCm} onChange={(e) => set('heightCm', e.target.value)} /></Field>
                    {staff.length === 0 && <Field label="Nurse receiving"><Input value={form.nurseReceiving} onChange={(e) => set('nurseReceiving', e.target.value)} /></Field>}
                  </div>
                </div>

                {candidates.length > 0 && (
                  <div className="rounded-xl border border-g-gold/40 bg-g-gold/10 p-4">
                    <p className="font-bold text-g-ink">⚠️ Possible duplicate patient record(s)</p>
                    <p className="mb-2 text-sm text-slate-600">Review before continuing — submitting again will force-create this record.</p>
                    <div className="space-y-1">
                      {candidates.map((c) => (
                        <p key={c.patientId} className="text-sm text-slate-600">• {c.fullName} ({c.mrn ?? 'no MRN'}) — {Math.round(c.score)}% match</p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-slate-100 p-4">
                  <label className="inline-flex cursor-pointer items-start gap-3 text-sm">
                    <input type="checkbox" className="mt-0.5 h-4 w-4 accent-g-navy" checked={form.consentSigned} onChange={(e) => set('consentSigned', e.target.checked)} required />
                    <span>
                      <span className="font-bold text-g-ink">Patient consent & declaration</span> — I confirm the information provided on this admission form is true and complete. I agree to provide additional information where required and understand the hospital may use my information for patient care, administration, billing, insurance processing and other lawful healthcare purposes.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Step nav */}
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
              <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>← Back</Button>
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>Next →</Button>
              ) : (
                <Button type="submit" loading={busyId === 'new'} icon="plus">{emergency ? 'Emergency admit' : 'Confirm admission'}</Button>
              )}
            </div>
          </form>
        </Card>
      )}

      {/* ---------------------------------------------------------- detail drawer */}
      {detail && (
        <div className="fixed inset-0 z-40 flex justify-end bg-g-ink/30" onClick={() => setDetail(null)}>
          <div className="flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-white p-5">
              <div>
                <div className="flex items-center gap-2">
                  <Badge tone={STATUS_TONE[detail.status] ?? 'gray'}>{titleCase(detail.status)}</Badge>
                  {detail.admissionType && <Badge tone={TYPE_TONE[detail.admissionType] ?? 'gray'}>{titleCase(detail.admissionType)}</Badge>}
                  {detail.identificationPending && <Badge tone="red">ID pending</Badge>}
                </div>
                <h3 className="mt-2 text-xl font-bold text-g-ink">{detail.patient?.fullName ?? '—'}</h3>
                <p className="text-sm text-slate-500">
                  <span className="font-mono">{detail.admissionNumber ?? '—'}</span> · {detail.patient?.mrn ?? ''} · admitted {fmtDate(detail.admittedAt)}
                </p>
                <p className="text-xs text-slate-400">{detail.facility?.name ?? ''} · ward {detail.ward ?? '—'}{detail.bed ? ` · bed ${detail.bed}` : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => window.print()}>🖨 Print form</Button>
                <button onClick={() => setDetail(null)} className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-g-ink">✕</button>
              </div>
            </div>

            <div className="space-y-5 p-5">
              {/* Print-only paper form */}
              <div className="print-area hidden print:block">
                <div className="mx-auto max-w-3xl p-8 text-sm text-black">
                  <h1 className="text-center text-lg font-bold uppercase">Republic of Ghana — Hospital Admission Form</h1>
                  <p className="text-center text-xs">Patient Registration & Admission</p>
                  <div className="mt-4 grid grid-cols-2 gap-2 border-b-2 border-black pb-3">
                    <p><b>Hospital:</b> {detail.facility?.name ?? '—'}</p>
                    <p><b>Admission No:</b> {detail.admissionNumber ?? '—'}</p>
                    <p><b>Patient:</b> {detail.patient?.fullName ?? '—'}</p>
                    <p><b>MRN:</b> {detail.patient?.mrn ?? '—'}</p>
                    <p><b>Date of admission:</b> {fmtDate(detail.admittedAt)}</p>
                    <p><b>Ward / Bed:</b> {detail.ward ?? '—'} / {detail.bed ?? '—'}</p>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-1">
                    <p><b>Type:</b> {titleCase(detail.admissionType ?? '—')}</p>
                    <p><b>Source:</b> {titleCase(detail.source ?? '—')}</p>
                    <p><b>Patient type:</b> {patientTypeLabel(detail.patient?.patientType)}</p>
                    <p><b>Payment:</b> {titleCase(detail.paymentMethod ?? '—')}</p>
                    {detail.patient?.ghanaCard && <p><b>Ghana Card:</b> {detail.patient.ghanaCard}</p>}
                    {detail.patient?.nhisNumber && <p><b>NHIS:</b> {detail.patient.nhisNumber}</p>}
                    {detail.patient?.passport && <p><b>Passport:</b> {detail.patient.passport}</p>}
                    {detail.insurerName && <p><b>Insurer:</b> {detail.insurerName} {detail.policyNumber ? `(${detail.policyNumber})` : ''}</p>}
                  </div>
                  <p className="mt-3"><b>Chief complaint:</b> {detail.chiefComplaint ?? '—'}</p>
                  <p><b>Provisional diagnosis:</b> {detail.provisionalDiagnosis ?? '—'}</p>
                  <div className="mt-3">
                    <p className="font-bold underline">Vital signs on admission</p>
                    <table className="mt-1 w-full border border-black text-xs">
                      <tbody>
                        {[['Temperature (°C)', detail.vitals.temperature], ['Pulse (bpm)', detail.vitals.pulse], ['Respiratory rate', detail.vitals.respiratoryRate], ['Blood pressure', detail.vitals.systolicBp ? `${detail.vitals.systolicBp}/${detail.vitals.diastolicBp ?? ''}` : null], ['SpO₂ (%)', detail.vitals.spo2], ['Weight (kg)', detail.vitals.weightKg], ['Height (cm)', detail.vitals.heightCm]].map(([label, value]) => (
                          <tr key={String(label)} className="border border-black">
                            <td className="border border-black px-2 py-1">{label}</td>
                            <td className="border border-black px-2 py-1">{value ?? ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {detail.maternity.pregnant === true && (
                    <p className="mt-3"><b>Maternity:</b> Pregnant · EDD {fmtDate(detail.maternity.edd)} · Gravida {detail.maternity.gravida ?? '—'} · Parity {detail.maternity.parity ?? '—'}</p>
                  )}
                  <p className="mt-3"><b>Consultant:</b> {detail.consultant?.fullName ?? '—'} &nbsp; <b>Nurse receiving:</b> {detail.nurseReceiving ?? '—'}</p>
                  <div className="mt-10 grid grid-cols-2 gap-8">
                    <div><p className="border-t border-black pt-1 text-xs">Patient / guardian signature</p></div>
                    <div><p className="border-t border-black pt-1 text-xs">Admitting officer signature</p></div>
                  </div>
                  <p className="mt-6 text-center text-[10px] text-slate-500">GIHM-HIS · generated {fmtDate(detail.createdAt)} · DEMO/SYNTHETIC — not an official document</p>
                </div>
              </div>

              {/* Screen view */}
              {detail.chiefComplaint && (
                <div className="rounded-xl bg-g-mist p-4 text-sm text-slate-600">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Chief complaint</p>
                  {detail.chiefComplaint}
                </div>
              )}
              {detail.provisionalDiagnosis && (
                <div className="rounded-xl border border-slate-100 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Provisional diagnosis</p>
                  <p className="text-sm font-semibold text-g-ink">{detail.provisionalDiagnosis}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[['Temperature', detail.vitals.temperature ? `${detail.vitals.temperature} °C` : null], ['Pulse', detail.vitals.pulse ? `${detail.vitals.pulse} bpm` : null], ['BP', detail.vitals.systolicBp ? `${detail.vitals.systolicBp}/${detail.vitals.diastolicBp ?? '—'}` : null], ['SpO₂', detail.vitals.spo2 ? `${detail.vitals.spo2}%` : null], ['RR', detail.vitals.respiratoryRate ?? null], ['Weight', detail.vitals.weightKg ? `${detail.vitals.weightKg} kg` : null], ['Height', detail.vitals.heightCm ? `${detail.vitals.heightCm} cm` : null], ['Payment', detail.paymentMethod ? titleCase(detail.paymentMethod) : null]].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-slate-100 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                    <p className="text-sm font-bold text-g-ink">{value ?? '—'}</p>
                  </div>
                ))}
              </div>

              {detail.maternity.pregnant === true && (
                <div className="rounded-xl border border-g-blue/30 bg-g-blue/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-g-blue">Maternity</p>
                  <p className="text-sm text-g-ink">Pregnant · EDD {fmtDate(detail.maternity.edd)} · Gravida {detail.maternity.gravida ?? '—'} · Parity {detail.maternity.parity ?? '—'}</p>
                </div>
              )}

              {detail.transferHistory.length > 0 && (
                <div className="rounded-xl border border-slate-100 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Transfer history</p>
                  <div className="space-y-1.5">
                    {detail.transferHistory.map((t, i) => (
                      <p key={i} className="text-sm text-slate-600">🔄 {t.fromWard ?? '—'} / {t.fromBed ?? '—'} → {t.toWard ?? '—'} / {t.toBed ?? '—'}{t.note ? ` — ${t.note}` : ''} <span className="text-xs text-slate-400">({fmtDate(String(t.at))})</span></p>
                    ))}
                  </div>
                </div>
              )}

              {detail.status !== 'DISCHARGED' ? (
                <div className="space-y-4">
                  {canAdmit && (
                    <form onSubmit={doTransfer} className="rounded-xl border border-slate-100 p-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Transfer ward / bed</p>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <Field label="Ward"><Input value={transfer.ward} onChange={(e) => setTransfer({ ...transfer, ward: e.target.value })} /></Field>
                        <Field label="Bed"><Input value={transfer.bed} onChange={(e) => setTransfer({ ...transfer, bed: e.target.value })} /></Field>
                        <Field label="Note"><Input value={transfer.note} onChange={(e) => setTransfer({ ...transfer, note: e.target.value })} /></Field>
                      </div>
                      <div className="mt-3 flex justify-end"><Button type="submit" variant="outline" size="sm" loading={busyId === `t-${detail.id}`}>Transfer</Button></div>
                    </form>
                  )}
                  {canAdmit && (
                    <form onSubmit={doDischarge} className="rounded-xl border border-g-red/20 bg-g-red/5 p-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-g-red">Discharge (summary required)</p>
                      <Field label="Discharge summary *"><Textarea rows={3} required value={discharge.summary} onChange={(e) => setDischarge({ ...discharge, summary: e.target.value })} placeholder="Condition at discharge, treatment given, follow-up plan…" /></Field>
                      <Field label="Discharge note" className="mt-2"><Input value={discharge.note} onChange={(e) => setDischarge({ ...discharge, note: e.target.value })} /></Field>
                      <div className="mt-3 flex justify-end"><Button type="submit" size="sm" variant="danger" loading={busyId === `d-${detail.id}`}>Discharge patient</Button></div>
                    </form>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-slate-100 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Discharged {fmtDate(detail.dischargedAt)}</p>
                  <p className="mt-1 text-sm text-slate-600">{detail.dischargeSummary}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
