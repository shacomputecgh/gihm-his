import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiRequestError, downloadFile, fetchBlob } from '../../lib/api';
import { enqueueMutation } from '../../lib/offline';
import { useConnection } from '../../lib/connection';
import type { Immunization, ImmunizationScheduleItem, InsuranceScheme, Patient, PatientDocument, PatientInsurance } from '../../types';
import { Badge, Button, Card, Field, Input, Segmented, Select, Spinner, Textarea, useToast } from '../../components/ui';
import { Icon } from '../../components/icons';
import { ageFromDob, fmtDateTime, fmtDate, fmtBytes, titleCase, cedis, todayIso, VACCINE_LABELS, LANGUAGE_OPTIONS } from '../../lib/format';
import { useAuth } from '../../lib/auth';
import { qrPngDataUrl, qrSvgDataUrl } from '../../lib/qr';
import MaternityTab from './MaternityTab';
import ImagingTab from './ImagingTab';
import TelemedicineTab from './TelemedicineTab';

type Tab = 'overview' | 'encounters' | 'labs' | 'prescriptions' | 'admissions' | 'referrals' | 'billing' | 'immunizations' | 'insurance' | 'documents' | 'maternity' | 'imaging' | 'telemedicine';

/** Folder categories — mirror the API allowlist (Ghana admission-form checklist). */
const DOC_CATEGORIES: { value: string; label: string }[] = [
  { value: 'GHANA_CARD', label: 'Ghana Card' },
  { value: 'NHIS_CARD', label: 'NHIS Card' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'VISA_PERMIT', label: 'Visa / Permit' },
  { value: 'IDENTITY', label: 'ID / Voter card' },
  { value: 'REFERRAL_LETTER', label: 'Referral letter' },
  { value: 'LAB_RESULT', label: 'Lab result' },
  { value: 'IMAGING', label: 'Imaging / scan' },
  { value: 'PRESCRIPTION', label: 'Prescription' },
  { value: 'DISCHARGE_SUMMARY', label: 'Discharge summary' },
  { value: 'CONSENT', label: 'Consent form' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'MEDICAL_RECORD', label: 'Previous medical record' },
  { value: 'OTHER', label: 'Other' },
];

const DOC_ALLOWED_EXT = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'tiff', 'bmp', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'];
const DOC_MAX_BYTES = 10 * 1024 * 1024;

export default function PatientDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  // Insurance actions (enroll / verify) are patient-record edits.
  const canManageInsurance = !!user?.permissions.includes('edit_patient') || !!user?.permissions.includes('process_payment');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [busy, setBusy] = useState(false);
  const [langBusy, setLangBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setPatient(await api<Patient>(`/patients/${id}`));
  }, [id]);

  useEffect(() => {
    void load().catch(() => setPatient(null));
  }, [load]);

  /** Flip the patient's reminder opt-out preference (never sent to opted-out patients). */
  async function toggleReminderOptOut() {
    if (!patient) return;
    try {
      const res = await api<{ reminderOptOut: boolean }>(`/patients/${patient.id}/reminder-opt-out`, {
        method: 'PATCH',
        body: { reminderOptOut: !patient.reminderOptOut },
      });
      setPatient({ ...patient, reminderOptOut: res.reminderOptOut });
      toast(res.reminderOptOut ? 'Reminder recalls disabled for this patient' : 'Reminder recalls enabled for this patient', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not update reminder preference', 'error');
    }
  }

  /** Update the outreach language (captured at registration, editable anytime). */
  async function savePreferredLanguage(lang: string) {
    if (!patient || lang === (patient.preferredLanguage ?? 'EN')) return;
    const prev = patient.preferredLanguage ?? 'EN';
    setPatient({ ...patient, preferredLanguage: lang }); // optimistic — revert on failure
    setLangBusy(true);
    try {
      const res = await api<{ preferredLanguage: string }>(`/patients/${patient.id}/preferred-language`, {
        method: 'PATCH',
        body: { preferredLanguage: lang },
      });
      setPatient((p) => (p ? { ...p, preferredLanguage: res.preferredLanguage } : p));
      toast(`Preferred language set to ${res.preferredLanguage}`, 'success');
    } catch (err) {
      setPatient((p) => (p ? { ...p, preferredLanguage: prev } : p));
      toast(err instanceof Error ? err.message : 'Could not update language', 'error');
    } finally {
      setLangBusy(false);
    }
  }

  useEffect(() => {
    void api<{ schedule: ImmunizationScheduleItem[] }>('/immunizations/schedule')
      .then((r) => setSchedule(r.schedule)).catch(() => undefined);
  }, []);

  // ---------------- action form state
  const [enc, setEnc] = useState({ type: 'OPD', presentingComplaint: '', temperature: '', pulse: '', systolicBp: '', diastolicBp: '', spo2: '', triageCategory: '' });
  const [lab, setLab] = useState({ encounterId: '', test: '', discipline: 'CHEMISTRY' });
  const [rx, setRx] = useState({ encounterId: '', medicine: '', dosage: '', frequency: '', duration: '', quantity: '' });
  const [note, setNote] = useState({ encounterId: '', note: '' });
  const [referral, setReferral] = useState({ toFacilityName: '', specialty: '', urgency: 'ROUTINE', summary: '' });
  const [schedule, setSchedule] = useState<ImmunizationScheduleItem[]>([]);
  const [immForm, setImmForm] = useState({ vaccine: '', dose: '', administeredAt: todayIso(), batch: '' });
  const [immBusy, setImmBusy] = useState(false);
  // Insurance tab: memberships + enrollment against the national registry.
  const [insurance, setInsurance] = useState<PatientInsurance[] | null>(null);
  const [schemes, setSchemes] = useState<InsuranceScheme[]>([]);
  const [insForm, setInsForm] = useState({ schemeId: '', membershipNumber: '', relationship: 'SELF', holderName: '', validTo: '' });
  const [insBusy, setInsBusy] = useState(false);
  // Documents (digital folder): uploads with category + notes, view/download, delete.
  const [documents, setDocuments] = useState<PatientDocument[] | null>(null);
  const [docForm, setDocForm] = useState({ category: 'LAB_RESULT', notes: '' });
  const [docBusy, setDocBusy] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ category: 'OTHER', notes: '' });
  const [preview, setPreview] = useState<{ doc: PatientDocument; url: string; text?: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const { online } = useConnection();
  // Photograph (admission-form checklist): served as an authenticated object
  // URL; the QR badge modal renders the MRN for the paper folder / wristband.
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  // Bumped after upload/delete so a same-extension replacement (png→png) still
  // re-fetches the blob — photoStoredName alone is unchanged in that case.
  const [photoVersion, setPhotoVersion] = useState(0);
  // Adding/editing/deleting folder files is a record edit — write_clinical_note
  // only (matching the API guard); viewing/downloading stays view-level.
  const canManageDocs = !!user?.permissions.includes('write_clinical_note');

  const immVaccines = schedule.filter((s, i, arr) => arr.findIndex((x) => x.vaccine === s.vaccine) === i);
  const immDoses = schedule.filter((s) => s.vaccine === immForm.vaccine);

  // All hooks (including the tab-loading effects below) must run on every
  // render — the loading guard goes after them so hook order never changes.
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
    { value: 'encounters', label: `Encounters (${patient?.encounters?.length ?? 0})` },
    { value: 'labs', label: `Laboratory (${patient?.labOrders?.length ?? 0})` },
    { value: 'prescriptions', label: `Medications (${patient?.prescriptions?.length ?? 0})` },
    { value: 'admissions', label: `Admissions (${patient?.admissions?.length ?? 0})` },
    { value: 'referrals', label: `Referrals (${patient?.referrals?.length ?? 0})` },
    { value: 'billing', label: `Bills (${patient?.invoices?.length ?? 0})` },
    { value: 'immunizations', label: `Immunizations (${patient?.immunizations?.length ?? 0})` },
    { value: 'insurance', label: `Insurance (${insurance?.length ?? 0})` },
    { value: 'documents', label: `Documents (${documents?.length ?? 0})` },
    { value: 'maternity', label: 'Maternity' },
    { value: 'imaging', label: 'Imaging' },
    { value: 'telemedicine', label: 'Telemedicine' },
  ];

  // Load the digital folder when the tab opens (mirrors the insurance pattern).
  useEffect(() => {
    if (tab !== 'documents' || !id) return;
    void api<{ documents: PatientDocument[] }>(`/patients/${id}/documents`).then((r) => setDocuments(r.documents)).catch(() => setDocuments([]));
  }, [tab, id]);

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!DOC_ALLOWED_EXT.includes(ext)) {
      toast(`Unsupported file type ".${ext}" — allowed: ${DOC_ALLOWED_EXT.join(', ')}`, 'error');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    if (file.size > DOC_MAX_BYTES) {
      toast(`File exceeds the ${fmtBytes(DOC_MAX_BYTES)} limit`, 'error');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    void uploadDocument(file);
  }

  async function uploadDocument(file: File) {
    if (!id) return;
    setDocBusy(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Could not read file'));
        reader.readAsDataURL(file);
      });
      const base64 = dataUrl.split(',')[1] ?? '';
      const res = await api<{ document: PatientDocument }>(`/patients/${id}/documents`, {
        method: 'POST',
        body: {
          originalName: file.name,
          category: docForm.category,
          notes: docForm.notes || undefined,
          data: base64,
        },
      });
      toast(`“${res.document.originalName}” added to the folder`, 'success');
      setDocForm({ category: 'LAB_RESULT', notes: '' });
      if (fileRef.current) fileRef.current.value = '';
      setDocuments((prev) => [res.document, ...(prev ?? [])]);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload failed', 'error');
      if (fileRef.current) fileRef.current.value = '';
    } finally {
      setDocBusy(false);
    }
  }

  async function downloadDocument(d: PatientDocument) {
    try {
      await downloadFile(`/patients/${d.patientId}/documents/${d.id}/content`, d.originalName);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Download failed', 'error');
    }
  }

  /** Fetch the document bytes and open them in the in-app preview modal. */
  async function openPreview(d: PatientDocument) {
    try {
      const blob = await fetchBlob(`/patients/${d.patientId}/documents/${d.id}/content`);
      setPreview({ doc: d, url: URL.createObjectURL(blob), text: blob.type.startsWith('text/') ? await blob.text() : undefined });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not load document', 'error');
    }
  }

  function closePreview() {
    setPreview((p) => {
      if (p) URL.revokeObjectURL(p.url);
      return null;
    });
  }

  // Close the preview with Escape, and lock page scroll while it is open.
  useEffect(() => {
    if (!preview) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closePreview(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [preview]);

  async function saveDocEdit(d: PatientDocument) {
    try {
      const res = await api<{ document: PatientDocument }>(`/patients/${d.patientId}/documents/${d.id}`, {
        method: 'PATCH',
        body: { category: editForm.category, notes: editForm.notes || undefined },
      });
      setDocuments((prev) => (prev ?? []).map((x) => (x.id === d.id ? res.document : x)));
      setEditId(null);
      toast('Document updated', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  }

  async function deleteDocument(d: PatientDocument) {
    if (!window.confirm(`Delete “${d.originalName}” from the folder? This removes the stored file too.`)) return;
    try {
      await api(`/patients/${d.patientId}/documents/${d.id}`, { method: 'DELETE' });
      setDocuments((prev) => (prev ?? []).filter((x) => x.id !== d.id));
      toast('Document deleted', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
  }

  // ------------------------------------------------------ photograph + QR
  // Load the stored photo as an authenticated object URL whenever the record
  // (or its stored-photo reference) changes; revoke the previous URL on swap.
  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;
    if (!patient?.photoStoredName) {
      setPhotoUrl(null);
      return;
    }
    void fetchBlob(`/patients/${patient.id}/photo`)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setPhotoUrl(url);
      })
      .catch(() => { if (!cancelled) setPhotoUrl(null); });
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [patient?.id, patient?.photoStoredName, photoVersion]);

  async function uploadPhoto(file: File) {
    if (!patient) return;
    if (!file.type.startsWith('image/')) { toast('Please choose an image file', 'error'); return; }
    if (file.size > 8 * 1024 * 1024) { toast('Photo exceeds the 8 MB limit', 'error'); return; }
    setPhotoBusy(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Could not read photo'));
        reader.readAsDataURL(file);
      });
      await api(`/patients/${patient.id}/photo`, { method: 'PUT', body: { data: dataUrl.split(',')[1] ?? '' } });
      toast('Photograph saved', 'success');
      await load();
      setPhotoVersion((v) => v + 1);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Photo upload failed', 'error');
    } finally {
      setPhotoBusy(false);
      if (photoRef.current) photoRef.current.value = '';
    }
  }

  async function removePhoto() {
    if (!patient) return;
    if (!window.confirm('Remove the photograph from this record?')) return;
    try {
      await api(`/patients/${patient.id}/photo`, { method: 'DELETE' });
      setPhotoUrl(null);
      setPatient({ ...patient, photoStoredName: null });
      setPhotoVersion((v) => v + 1);
      toast('Photograph removed', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not remove photo', 'error');
    }
  }

  /** Render the patient's MRN as a QR PNG and download it. */
  async function downloadQr() {
    if (!patient) return;
    const png = await qrPngDataUrl(patient.mrn, 10);
    if (!png) { toast('Could not render the QR code', 'error'); return; }
    const a = document.createElement('a');
    a.href = png;
    a.download = `${patient.mrn}-qr.png`;
    a.click();
  }

  useEffect(() => {
    void api<{ schemes: InsuranceScheme[] }>('/insurance/schemes').then((r) => setSchemes(r.schemes)).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (tab !== 'insurance' || !id) return;
    void api<{ memberships: PatientInsurance[] }>(`/patients/${id}/insurance`).then((r) => setInsurance(r.memberships)).catch(() => setInsurance([]));
  }, [tab, id]);

  async function enrollInsurance(e: FormEvent) {
    e.preventDefault();
    if (!id || !insForm.schemeId || !insForm.membershipNumber.trim()) { toast('Select a scheme and enter the membership number', 'error'); return; }
    setInsBusy(true);
    try {
      await api(`/patients/${id}/insurance`, {
        method: 'POST',
        body: { schemeId: insForm.schemeId, membershipNumber: insForm.membershipNumber, relationship: insForm.relationship, holderName: insForm.holderName || undefined, validTo: insForm.validTo || undefined },
      });
      toast('Patient enrolled in scheme', 'success');
      setInsForm({ schemeId: '', membershipNumber: '', relationship: 'SELF', holderName: '', validTo: '' });
      const res = await api<{ memberships: PatientInsurance[] }>(`/patients/${id}/insurance`);
      setInsurance(res.memberships);
    } catch (err) { toast(err instanceof Error ? err.message : 'Enrollment failed', 'error'); } finally { setInsBusy(false); }
  }

  async function verifyMembership(m: PatientInsurance) {
    try {
      await api(`/insurance/memberships/${m.id}/verify`, { method: 'POST' });
      toast('Membership verified', 'success');
      if (id) setInsurance((await api<{ memberships: PatientInsurance[] }>(`/patients/${id}/insurance`)).memberships);
    } catch (err) { toast(err instanceof Error ? err.message : 'Verification failed', 'error'); }
  }

  async function recordDose(e: FormEvent) {
    e.preventDefault();
    if (!id || !immForm.vaccine || !immForm.dose) { toast('Select vaccine and dose', 'error'); return; }
    setImmBusy(true);
    try {
      const res = await api<{ immunization: Immunization; next: { dose: string; dueAt: string | null; label: string } | null }>('/immunizations', {
        method: 'POST',
        body: {
          patientId: id,
          vaccine: immForm.vaccine,
          dose: immForm.dose,
          administeredAt: immForm.administeredAt || undefined,
          batch: immForm.batch || undefined,
        },
      });
      const v = `${VACCINE_LABELS[immForm.vaccine] ?? titleCase(immForm.vaccine)} Dose ${immForm.dose}`;
      toast(res.next ? `${v} recorded — next due ${res.next.dueAt ? fmtDate(res.next.dueAt) : res.next.label}` : `${v} recorded`, 'success');
      setImmForm({ vaccine: '', dose: '', administeredAt: todayIso(), batch: '' });
      await load();
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 0) {
        await enqueueMutation({
          entityType: 'immunization',
          operation: 'CREATE',
          payload: {
            patientId: id,
            vaccine: immForm.vaccine,
            dose: immForm.dose,
            administeredAt: immForm.administeredAt || undefined,
            batch: immForm.batch || undefined,
          },
        });
        window.dispatchEvent(new CustomEvent('gihm:offline-saved', { detail: 'Dose saved locally — will sync automatically when connected.' }));
        toast('Saved offline — will sync when connected', 'success');
        setImmForm({ vaccine: '', dose: '', administeredAt: todayIso(), batch: '' });
        return;
      }
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setImmBusy(false);
    }
  }

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

  // Loading guard — placed after every hook so the hook order is stable across
  // the null→loaded transition (Rules of Hooks).
  if (!patient) return <Spinner label="Loading patient record…" />;

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
              <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 text-lg font-bold">
                {photoUrl ? (
                  <img src={photoUrl} alt={`${patient.fullName} photograph`} className="h-full w-full object-cover" onError={() => setPhotoUrl(null)} />
                ) : (
                  patient.fullName.split(' ').slice(0, 2).map((s) => s[0]).join('')
                )}
                {canManageDocs && (
                  <>
                    <button
                      type="button"
                      onClick={() => photoRef.current?.click()}
                      title="Upload / replace photo"
                      disabled={photoBusy}
                      className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-white text-g-navy shadow ring-2 ring-g-navy/40 transition-colors hover:bg-g-gold"
                    >
                      <Icon name="camera" className="h-3 w-3" />
                    </button>
                    {photoUrl && (
                      <button
                        type="button"
                        onClick={() => void removePhoto()}
                        title="Remove photo"
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-g-red text-white shadow ring-2 ring-white/40 transition-colors hover:bg-red-700"
                      >
                        <Icon name="x" className="h-3 w-3" />
                      </button>
                    )}
                  </>
                )}
              </span>
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadPhoto(f); }} />
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
              {patient.patientType && patient.patientType !== 'GHANAIAN' && (
                <Badge tone="blue" className="bg-white/10 text-blue-300">
                  {patient.patientType === 'FOREIGN' ? '🌍 Foreign national' : patient.patientType === 'REFUGEE' ? '🛡️ Refugee' : 'Other'}
                </Badge>
              )}
              {patient.passport && <Badge tone="gold" className="bg-white/10 text-g-gold">Passport {patient.passport}</Badge>}
              {patient.visaPermitType && <Badge tone="blue" className="bg-white/10 text-blue-300">Visa {patient.visaPermitType.toLowerCase()}</Badge>}
              {patient.nationality && patient.nationality !== 'Ghanaian' && (
                <Badge tone="gray" className="bg-white/10 text-slate-300">{patient.nationality}</Badge>
              )}
              <button
                type="button"
                onClick={() => setQrOpen(true)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-white/20"
                title="Patient QR badge — scan to open the record"
              >
                <Icon name="qrcode" className="h-4 w-4" /> QR badge
              </button>
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
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-6 py-3">
          <button
            type="button"
            onClick={() => void toggleReminderOptOut()}
            className="inline-flex items-center gap-2 text-sm"
            title="Patient preference — reminders are never sent to opted-out patients"
          >
            <span
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${patient.reminderOptOut ? 'bg-g-red' : 'bg-slate-300'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${patient.reminderOptOut ? 'translate-x-4' : 'translate-x-0.5'}`}
              />
            </span>
            <span className="text-slate-600">
              {patient.reminderOptOut ? 'No reminder recalls (opted out)' : 'Receive reminder recalls'}
            </span>
          </button>
          <label className="flex items-center gap-2 text-sm text-slate-600" title="Preferred language for SMS / WhatsApp reminders & outreach">
            <span>Language:</span>
            <Select value={patient.preferredLanguage ?? 'EN'} disabled={langBusy} onChange={(e) => void savePreferredLanguage(e.target.value)} className="w-44">
              {LANGUAGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </label>
          {patient.consentAccepted && <Badge tone="green">Consent on file</Badge>}
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

      {tab === 'immunizations' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Record vaccine dose">
            <form onSubmit={recordDose} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Vaccine">
                  <Select value={immForm.vaccine} onChange={(e) => setImmForm({ ...immForm, vaccine: e.target.value, dose: '' })}>
                    <option value="">Select…</option>
                    {immVaccines.map((s) => <option key={s.vaccine} value={s.vaccine}>{VACCINE_LABELS[s.vaccine] ?? titleCase(s.vaccine)}</option>)}
                  </Select>
                </Field>
                <Field label="Dose">
                  <Select value={immForm.dose} onChange={(e) => setImmForm({ ...immForm, dose: e.target.value })} disabled={!immForm.vaccine}>
                    <option value="">Select…</option>
                    {immDoses.map((s) => <option key={`${s.vaccine}-${s.dose}`} value={s.dose}>Dose {s.dose} — {s.label}</option>)}
                  </Select>
                </Field>
                <Field label="Date given">
                  <Input type="date" value={immForm.administeredAt} onChange={(e) => setImmForm({ ...immForm, administeredAt: e.target.value })} />
                </Field>
                <Field label="Batch (optional)">
                  <Input value={immForm.batch} onChange={(e) => setImmForm({ ...immForm, batch: e.target.value })} placeholder="e.g. B2026-01" />
                </Field>
              </div>
              {!online && (
                <p className="rounded-lg border border-g-gold/50 bg-g-gold/15 px-3 py-2 text-xs font-semibold text-yellow-900">
                  Offline mode — the dose will be saved locally and synchronized when you reconnect.
                </p>
              )}
              <Button type="submit" loading={immBusy} icon="syringe">Save dose</Button>
            </form>
          </Card>

          <Card title="Immunization history" subtitle="Doses recorded across facilities — next-due dates auto-computed from the Ghana EPI schedule." pad={false}>
            {(patient.immunizations ?? []).length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-400">No doses recorded for this patient yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">{['Vaccine', 'Dose', 'Given', 'Next due', 'Batch', 'Status'].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(patient.immunizations ?? []).map((r) => (
                      <tr key={r.id}>
                        <td className="px-4 py-3 font-semibold text-g-ink">{VACCINE_LABELS[r.vaccine] ?? titleCase(r.vaccine)}</td>
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
            )}
          </Card>
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

      {tab === 'documents' && (
        <div className="grid gap-4 lg:grid-cols-3">
          {canManageDocs && (
            <Card title="Add a document" subtitle={`Scans, PDFs and photos up to ${fmtBytes(DOC_MAX_BYTES)} — stored securely on the patient folder.`}>
              <form onSubmit={(e) => { e.preventDefault(); fileRef.current?.click(); }} className="space-y-3">
                <Field label="Category">
                  <Select value={docForm.category} onChange={(e) => setDocForm({ ...docForm, category: e.target.value })}>
                    {DOC_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </Select>
                </Field>
                <Field label="Notes (optional)">
                  <Textarea value={docForm.notes} onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })} placeholder="e.g. NHIS card — renewed Jan 2026" />
                </Field>
                {!online && (
                  <p className="rounded-lg border border-g-gold/50 bg-g-gold/15 px-3 py-2 text-xs font-semibold text-yellow-900">
                    Offline mode — document uploads are disabled until you reconnect.
                  </p>
                )}
                <input ref={fileRef} type="file" className="hidden" onChange={pickFile} />
                <label
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-g-mist/40 px-4 py-8 text-center transition-colors hover:border-g-navy/40 hover:bg-g-mist"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files?.[0];
                    if (f) pickFile({ target: { files: e.dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>);
                  }}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-g-navy/10 text-g-navy"><Icon name="plus" className="h-5 w-5" /></span>
                  <span className="text-sm font-semibold text-g-ink">Choose a file or drop it here</span>
                  <span className="text-xs text-slate-400">pdf · jpg · png · doc · xls · txt · csv</span>
                </label>
                <Button type="submit" loading={docBusy} icon="fileText" disabled={!online} className="w-full">Upload document</Button>
              </form>
            </Card>
          )}

          <div className={canManageDocs ? 'lg:col-span-2' : 'lg:col-span-3'}>
            {!documents ? (
              <Card><div className="p-8"><Spinner /></div></Card>
            ) : documents.length === 0 ? (
              <Card>
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-g-mist text-slate-400"><Icon name="folder" className="h-6 w-6" /></span>
                  <p className="text-sm font-semibold text-g-ink">Digital folder is empty</p>
                  <p className="max-w-sm text-xs text-slate-400">Ghana Card, NHIS, passports, referrals, lab results and discharge summaries all live here with the patient's record.</p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {documents.map((d) => {
                  const cat = DOC_CATEGORIES.find((c) => c.value === d.category)?.label ?? titleCase(d.category);
                  const isImage = d.mimeType.startsWith('image/');
                  const editing = editId === d.id;
                  return (
                    <div key={d.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                      <div className="mb-2 flex items-start gap-3">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isImage ? 'bg-g-gold/15 text-g-gold' : 'bg-g-navy/10 text-g-navy'}`}>
                          <Icon name="fileText" className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-g-ink" title={d.originalName}>{d.originalName}</p>
                          <p className="mt-0.5 text-xs text-slate-400">{fmtBytes(d.sizeBytes)} · {fmtDate(d.createdAt)}</p>
                        </div>
                        <Badge tone="navy" className="shrink-0">{cat}</Badge>
                      </div>

                      {editing ? (
                        <div className="mt-1 space-y-2">
                          <Select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
                            {DOC_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                          </Select>
                          <Input value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Notes" />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => void saveDocEdit(d)}>Save</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {d.notes && <p className="mb-1 line-clamp-2 text-xs text-slate-500">{d.notes}</p>}
                          <p className="mb-3 text-xs text-slate-400">Uploaded by {d.uploadedBy?.fullName ?? '—'}</p>
                        </>
                      )}

                      {!editing && (
                        <div className="mt-auto flex gap-2 border-t border-slate-100 pt-3">
                          <Button size="sm" variant="navy" icon="search" onClick={() => void openPreview(d)} className="flex-1">Preview</Button>
                          <Button size="sm" variant="outline" icon="download" onClick={() => void downloadDocument(d)} title="Download file">Save</Button>
                          {canManageDocs && (
                            <>
                              <Button size="sm" variant="ghost" icon="edit" onClick={() => { setEditId(d.id); setEditForm({ category: d.category, notes: d.notes ?? '' }); }} title="Edit category / notes">Edit</Button>
                              <Button size="sm" variant="danger" icon="trash" onClick={() => void deleteDocument(d)} title="Delete document">Delete</Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'insurance' && (
        <div className="grid gap-4 lg:grid-cols-2">
          {canManageInsurance && (
          <Card title="Enroll in a scheme" subtitle="NHIS / private / corporate coverage — NHIS membership numbers can be verified here.">
            <form onSubmit={enrollInsurance} className="space-y-3">
              <Field label="Scheme">
                <Select value={insForm.schemeId} onChange={(e) => setInsForm({ ...insForm, schemeId: e.target.value })}>
                  <option value="">Select scheme…</option>
                  {schemes.filter((s) => s.status === 'ACTIVE').map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Membership number"><Input required value={insForm.membershipNumber} onChange={(e) => setInsForm({ ...insForm, membershipNumber: e.target.value })} placeholder="e.g. NHIS-10000010" /></Field>
                <Field label="Relationship">
                  <Select value={insForm.relationship} onChange={(e) => setInsForm({ ...insForm, relationship: e.target.value })}>
                    <option value="SELF">Self</option>
                    <option value="SPOUSE">Spouse</option>
                    <option value="CHILD">Child</option>
                    <option value="DEPENDENT">Dependant</option>
                  </Select>
                </Field>
                <Field label="Holder name (dependants)"><Input value={insForm.holderName} onChange={(e) => setInsForm({ ...insForm, holderName: e.target.value })} placeholder="Optional" /></Field>
                <Field label="Valid until"><Input type="date" value={insForm.validTo} onChange={(e) => setInsForm({ ...insForm, validTo: e.target.value })} /></Field>
              </div>
              <Button type="submit" loading={insBusy} icon="plus">Enroll patient</Button>
            </form>
          </Card>
          )}

          <Card title="Insurance memberships" pad={false}>
            {!insurance ? (
              <div className="p-8"><Spinner /></div>
            ) : insurance.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-400">No memberships yet — enroll this patient in a scheme.</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {insurance.map((m) => {
                  const expiring = m.status === 'ACTIVE' && m.validTo && new Date(m.validTo).getTime() - Date.now() < 30 * 24 * 3600 * 1000;
                  return (
                    <div key={m.id} className="px-5 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-bold text-g-ink">{m.scheme?.name ?? 'Scheme'}</p>
                          <p className="font-mono text-xs text-slate-500">{m.membershipNumber} · {titleCase(m.relationship)}{m.holderName ? ` · ${m.holderName}` : ''}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {m.verified ? <Badge tone="green">Verified</Badge> : <Badge tone="gray">Unverified</Badge>}
                          <Badge tone={m.status === 'ACTIVE' ? 'green' : m.status === 'SUSPENDED' ? 'gold' : 'gray'}>{m.status}</Badge>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {fmtDate(m.validFrom)} → {fmtDate(m.validTo)}{expiring ? ' · expires soon' : ''}
                        {!m.verified && canManageInsurance && <button onClick={() => void verifyMembership(m)} className="ml-3 cursor-pointer font-bold text-g-navy hover:underline">Verify</button>}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === 'maternity' && <MaternityTab patientId={patient.id} />}

      {tab === 'imaging' && <ImagingTab patientId={patient.id} encounters={patient.encounters ?? []} />}

      {tab === 'telemedicine' && <TelemedicineTab patientId={patient.id} />}

      {/* Patient QR badge modal — scan / download for the paper folder or wristband */}
      {qrOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setQrOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-bold text-g-ink">Patient QR badge</h3>
              <Button size="sm" variant="ghost" icon="x" onClick={() => setQrOpen(false)}>Close</Button>
            </div>
            <div className="flex justify-center rounded-xl bg-white p-4 ring-1 ring-slate-100">
              <img src={qrSvgDataUrl(patient.mrn) ?? undefined} alt={`QR code for ${patient.mrn}`} className="h-48 w-48" />
            </div>
            <p className="mt-4 text-center font-mono text-sm font-bold text-g-navy">{patient.mrn}</p>
            <p className="text-center text-sm text-slate-500">{patient.fullName}</p>
            <p className="mt-1 text-center text-xs text-slate-400">Scan to open this record — print it for the paper folder or wristband.</p>
            <Button className="mt-4 w-full" variant="navy" icon="download" onClick={() => void downloadQr()}>Download PNG</Button>
          </div>
        </div>
      )}

      {/* In-app document preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closePreview} />
          <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-g-navy/10 text-g-navy"><Icon name="fileText" className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-g-ink">{preview.doc.originalName}</p>
                  <p className="text-xs text-slate-400">
                    {DOC_CATEGORIES.find((c) => c.value === preview.doc.category)?.label ?? titleCase(preview.doc.category)} · {fmtBytes(preview.doc.sizeBytes)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button size="sm" variant="outline" icon="download" onClick={() => void downloadDocument(preview.doc)}>Download</Button>
                <Button size="sm" variant="ghost" icon="x" onClick={closePreview} title="Close preview">Close</Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-slate-100">
              {preview.doc.mimeType.startsWith('image/') ? (
                <img src={preview.url} alt={preview.doc.originalName} className="mx-auto max-h-[70vh] w-auto object-contain" />
              ) : preview.doc.mimeType === 'application/pdf' ? (
                <iframe src={preview.url} title={preview.doc.originalName} className="h-[70vh] w-full" />
              ) : preview.doc.mimeType.startsWith('text/') ? (
                <pre className="whitespace-pre-wrap p-6 text-sm text-g-ink">{preview.text ?? ''}</pre>
              ) : (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-g-mist text-slate-400"><Icon name="fileText" className="h-6 w-6" /></span>
                  <p className="text-sm font-semibold text-g-ink">This file type can't be previewed in the browser</p>
                  <p className="text-xs text-slate-400">{preview.doc.mimeType} — download it to view the contents.</p>
                  <Button size="sm" variant="navy" icon="download" onClick={() => void downloadDocument(preview.doc)}>Download file</Button>
                </div>
              )}
            </div>
          </div>
        </div>
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
