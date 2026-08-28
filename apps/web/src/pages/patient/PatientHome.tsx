import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, downloadFile } from '../../lib/api';
import type { Appointment, ImmunizationDueRow, Patient, PatientDocument } from '../../types';
import { Badge, Card, DemoBanner, EmptyState, FlagStripe, Icon, Spinner } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { ageFromDob, fmtDate, fmtDateTime, fmtBytes, titleCase, VACCINE_LABELS } from '../../lib/format';

/** Folder categories shown to patients (mirrors the staff allowlist). */
const DOC_LABELS: Record<string, string> = {
  GHANA_CARD: 'Ghana Card',
  NHIS_CARD: 'NHIS Card',
  PASSPORT: 'Passport',
  VISA_PERMIT: 'Visa / Permit',
  IDENTITY: 'ID / Voter card',
  REFERRAL_LETTER: 'Referral letter',
  LAB_RESULT: 'Lab result',
  IMAGING: 'Imaging / scan',
  PRESCRIPTION: 'Prescription',
  DISCHARGE_SUMMARY: 'Discharge summary',
  CONSENT: 'Consent form',
  INSURANCE: 'Insurance',
  MEDICAL_RECORD: 'Previous medical record',
  OTHER: 'Other',
};

export default function PatientHome() {
  const { user, logout } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [dueImms, setDueImms] = useState<ImmunizationDueRow[]>([]);
  const [documents, setDocuments] = useState<PatientDocument[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (user?.scope !== 'PATIENT') return;
    // The core record load is critical; appointments and immunization reminders
    // are supplementary — their failures must never blank the whole portal.
    void api<Page>(`/patients`, { query: { pageSize: '1' } })
      .then(async (r) => {
        const mine = (r as { items: Patient[] }).items[0];
        if (!mine) { setFailed(true); return; }
        setPatient(await api<Patient>(`/patients/${mine.id}`));
        void api<{ items: Appointment[] }>('/appointments', { query: { pageSize: '10' } })
          .then((a) => setAppointments(a.items)).catch(() => undefined);
        void api<{ items: ImmunizationDueRow[] }>('/immunizations/due')
          .then((d) => setDueImms(d.items)).catch(() => undefined);
        // The digital folder is read-only for patients — they can only ever see
        // (and download) their own uploaded documents.
        void api<{ documents: PatientDocument[] }>(`/patients/${mine.id}/documents`)
          .then((r) => setDocuments(r.documents)).catch(() => setDocuments([]));
      })
      .catch(() => setFailed(true));
  }, [user]);

  return (
    <div className="min-h-screen bg-g-paper">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-g-navy text-white"><Icon name="pulse" className="h-5 w-5" /></span>
            <div>
              <p className="text-sm font-bold text-g-ink">My Health Portal</p>
              <p className="text-[10px] text-slate-400">GIHM-HIS · Patient access</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs font-semibold text-slate-500 hover:text-g-red">Public site</Link>
            <button onClick={logout} className="cursor-pointer text-xs font-semibold text-g-red hover:underline">Log out</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <DemoBanner />
        {failed ? (
          <EmptyState icon="alert" title="Unable to load your record" message="Please log in with the patient demo account (patient@demo.gh)." />
        ) : !patient ? (
          <Spinner label="Loading your health record…" />
        ) : (
          <div className="mt-5 space-y-5">
            <Card>
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-g-red/10 text-lg font-bold text-g-red">
                  {patient.fullName.split(' ').slice(0, 2).map((s) => s[0]).join('')}
                </span>
                <div>
                  <h1 className="text-xl font-bold text-g-ink">{patient.fullName}</h1>
                  <p className="text-sm text-slate-500">
                    <span className="font-mono font-semibold text-g-navy">{patient.mrn}</span> · {patient.sex ?? '—'} · {ageFromDob(patient.dateOfBirth)}
                  </p>
                  {patient.ghanaCard && <Badge tone="navy" className="mt-1">Ghana Card verified</Badge>}
                </div>
              </div>
            </Card>

            {dueImms.length > 0 && (
              <Card
                title="Immunization reminder"
                className={dueImms.some((d) => d.bucket === 'OVERDUE') ? '!border-g-red/40' : ''}
                action={<Icon name="syringe" className="h-5 w-5 text-g-red" />}
              >
                <div className="space-y-2">
                  {dueImms.map((d) => (
                    <div
                      key={d.id}
                      className={`flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm ${d.bucket === 'OVERDUE' ? 'bg-g-red/5' : 'bg-g-mist/60'}`}
                    >
                      <div>
                        <p className="font-semibold text-g-ink">
                          {VACCINE_LABELS[d.vaccine] ?? d.vaccine} · Dose {d.dose}
                        </p>
                        <p className="text-xs text-slate-400">{d.description}</p>
                      </div>
                      <Badge tone={d.bucket === 'OVERDUE' ? 'red' : 'gold'}>
                        {d.bucket === 'OVERDUE'
                          ? `${d.daysOverdue} day${d.daysOverdue === 1 ? '' : 's'} overdue — due ${fmtDate(d.nextDueAt)}`
                          : d.daysUntil === 0 ? `Due today — ${fmtDate(d.nextDueAt)}` : `Due ${fmtDate(d.nextDueAt)} (${d.daysUntil} days)`}
                      </Badge>
                    </div>
                  ))}
                  <p className="pt-1 text-xs text-slate-400">
                    Please visit your nearest health facility or CHPS compound to complete these doses.
                  </p>
                </div>
              </Card>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Card title="Upcoming appointments">
                {appointments.filter((a) => a.status === 'BOOKED' || a.status === 'CONFIRMED').length === 0 ? (
                  <p className="py-4 text-center text-sm text-slate-400">No upcoming appointments</p>
                ) : (
                  <ul className="space-y-2.5">
                    {appointments.filter((a) => a.status === 'BOOKED' || a.status === 'CONFIRMED').slice(0, 5).map((a) => (
                      <li key={a.id} className="flex items-center justify-between rounded-lg bg-g-mist/60 px-3 py-2.5 text-sm">
                        <div>
                          <p className="font-semibold text-g-ink">{a.service ?? 'Appointment'}</p>
                          <p className="text-xs text-slate-400">{fmtDateTime(a.scheduledFor)}</p>
                        </div>
                        <Badge tone="blue">{a.status}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
              <Card title="Recent care">
                {(patient.encounters ?? []).length === 0 ? (
                  <p className="py-4 text-center text-sm text-slate-400">No recent visits</p>
                ) : (
                  <ul className="space-y-2.5">
                    {(patient.encounters ?? []).slice(0, 5).map((e) => (
                      <li key={e.id} className="rounded-lg bg-g-mist/60 px-3 py-2.5 text-sm">
                        <p className="font-semibold text-g-ink">{e.presentingComplaint ?? e.type} visit</p>
                        <p className="text-xs text-slate-400">{fmtDate(e.createdAt)} · {e.diagnosisSummary ?? 'No diagnosis recorded'}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>

            <Card
              title="My documents"
              subtitle="Files your care team has placed in your digital folder — available to download anytime."
              action={<Icon name="folder" className="h-5 w-5 text-g-navy" />}
            >
              {!documents ? (
                <div className="py-4"><Spinner /></div>
              ) : documents.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">Your digital folder is empty — documents added by your care team will appear here.</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {documents.map((d) => (
                    <div key={d.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${d.mimeType.startsWith('image/') ? 'bg-g-gold/15 text-g-gold' : 'bg-g-navy/10 text-g-navy'}`}>
                          <Icon name="fileText" className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-g-ink" title={d.originalName}>{d.originalName}</p>
                          <p className="text-xs text-slate-400">{DOC_LABELS[d.category] ?? titleCase(d.category)} · {fmtBytes(d.sizeBytes)} · {fmtDate(d.createdAt)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void downloadFile(`/patients/${d.patientId}/documents/${d.id}/content`, d.originalName)}
                        className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-g-navy/10 px-3 py-1.5 text-xs font-bold text-g-navy transition hover:bg-g-navy/20"
                      >
                        <Icon name="download" className="h-3.5 w-3.5" /> Download
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="My records">
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div className="rounded-lg bg-g-mist/60 p-3 text-center"><p className="text-xl font-bold text-g-ink">{patient.encounters?.length ?? 0}</p><p className="text-xs text-slate-400">Visits</p></div>
                <div className="rounded-lg bg-g-mist/60 p-3 text-center"><p className="text-xl font-bold text-g-ink">{patient.labOrders?.length ?? 0}</p><p className="text-xs text-slate-400">Lab results</p></div>
                <div className="rounded-lg bg-g-mist/60 p-3 text-center"><p className="text-xl font-bold text-g-ink">{patient.prescriptions?.length ?? 0}</p><p className="text-xs text-slate-400">Medications</p></div>
                <div className="rounded-lg bg-g-mist/60 p-3 text-center"><p className="text-xl font-bold text-g-ink">{patient.immunizations?.length ?? 0}</p><p className="text-xs text-slate-400">Immunizations</p></div>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                You can only ever see your own authorized record. Clinical staff see records only within their facility/district/regional scope.
              </p>
            </Card>

            <Card title="Recent laboratory results">
              {(patient.labOrders ?? []).slice(0, 6).map((o) => (
                <div key={o.id} className="flex items-center justify-between border-b border-slate-50 py-2.5 text-sm last:border-0">
                  <div>
                    <p className="font-semibold text-g-ink">{o.test}</p>
                    <p className="text-xs text-slate-400">{fmtDate(o.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    {o.result ? <p className="font-medium text-g-ink">{o.result}</p> : <Badge tone="gray">{o.status}</Badge>}
                  </div>
                </div>
              ))}
            </Card>

            <Card title="My medications">
              {(patient.prescriptions ?? []).length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">No medications on record</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {(patient.prescriptions ?? []).slice(0, 8).map((r) => (
                    <div key={r.id} className="flex items-center justify-between py-2.5 text-sm">
                      <div>
                        <p className="font-semibold text-g-ink">{r.medicine}</p>
                        <p className="text-xs text-slate-400">{r.dosage ?? ''} {r.frequency ?? ''} · {r.duration ?? ''} · {fmtDate(r.createdAt)}</p>
                      </div>
                      <Badge tone={r.status === 'DISPENSED' ? 'green' : r.status === 'ACTIVE' ? 'gold' : 'gray'}>{r.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Immunization record">
              {(patient.immunizations ?? []).length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">No immunizations on record</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {(patient.immunizations ?? []).map((v) => (
                    <div key={v.id} className="flex items-center justify-between py-2.5 text-sm">
                      <div>
                        <p className="font-semibold text-g-ink">{v.vaccine.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-slate-400">Dose {v.dose} · {fmtDate(v.administeredAt)}</p>
                      </div>
                      {v.nextDueAt && <Badge tone="blue">Next: {fmtDate(v.nextDueAt)}</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Referrals">
              {(patient.referrals ?? []).length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">No referrals on record</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {(patient.referrals ?? []).slice(0, 6).map((r) => (
                    <div key={r.id} className="flex items-center justify-between py-2.5 text-sm">
                      <div>
                        <p className="font-semibold text-g-ink">{r.toFacilityName ?? 'Referral'}</p>
                        <p className="text-xs text-slate-400">{r.specialty ?? 'General'} · {fmtDate(r.createdAt)}</p>
                      </div>
                      <Badge tone={r.status === 'COMPLETED' ? 'green' : r.status === 'ACCEPTED' ? 'navy' : r.status === 'REJECTED' ? 'red' : 'gold'}>{r.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {(patient.invoices ?? []).length > 0 && (
              <Card title="Bills">
                <div className="divide-y divide-slate-50">
                  {(patient.invoices ?? []).slice(0, 6).map((i) => (
                    <div key={i.id} className="flex items-center justify-between py-2.5 text-sm">
                      <div>
                        <p className="font-semibold text-g-ink">GH₵ {(i.amount ?? 0).toLocaleString('en-GH', { minimumFractionDigits: 2 })}</p>
                        <p className="text-xs text-slate-400">{fmtDate(i.issuedAt)} · {i.paymentMethod ?? '—'}</p>
                      </div>
                      <Badge tone={i.status === 'PAID' ? 'green' : i.status === 'PARTIAL' ? 'gold' : 'gray'}>{i.status}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </main>
      <FlagStripe className="fixed bottom-0" />
    </div>
  );
}

interface Page {
  items: unknown[];
}
