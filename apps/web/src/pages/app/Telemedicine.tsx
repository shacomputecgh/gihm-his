import { useCallback, useEffect, useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import type { Teleconsultation } from '../../types';
import { Badge, Button, Card, EmptyState, Field, PageHeader, Select, Spinner, Textarea, useToast } from '../../components/ui';
import { fmtDateTime } from '../../lib/format';

const STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'MISSED'];

/**
 * Telemedicine (spec §82–83, docs/13 §9) — the clinician worklist of remote
 * consultations in scope, with the guarded lifecycle transitions
 * (SCHEDULED → IN_PROGRESS → COMPLETED | CANCELLED | MISSED). The joinUrl
 * placeholder carries the future video/phone transport link.
 */
export default function Telemedicine() {
  const { user } = useAuth();
  const toast = useToast();
  const canWrite = !!user?.permissions.includes('write_clinical_note');
  const [status, setStatus] = useState('ALL');
  const [items, setItems] = useState<Teleconsultation[]>([]);
  const [busy, setBusy] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [finishing, setFinishing] = useState<Teleconsultation | null>(null);
  const [outcome, setOutcome] = useState('');

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const q = status === 'ALL' ? '' : `?status=${status}`;
      const res = await api<{ items: Teleconsultation[] }>(`/teleconsultations${q}`);
      setItems(res.items);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not load worklist', 'error');
    } finally {
      setBusy(false);
    }
  }, [status, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function transition(t: Teleconsultation, next: string, ok: string) {
    setActing(t.id);
    try {
      await api(`/teleconsultations/${t.id}`, { method: 'PATCH', body: { status: next } });
      toast(ok, 'success');
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Transition failed', 'error');
    } finally {
      setActing(null);
    }
  }

  async function complete() {
    if (!finishing) return;
    setActing(finishing.id);
    try {
      await api(`/teleconsultations/${finishing.id}`, { method: 'PATCH', body: { status: 'COMPLETED', outcome: outcome || undefined } });
      toast('Consultation completed', 'success');
      setFinishing(null);
      setOutcome('');
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setActing(null);
    }
  }

  const tone = (s: string) => (s === 'COMPLETED' ? 'green' : s === 'IN_PROGRESS' ? 'blue' : s === 'CANCELLED' ? 'gray' : s === 'MISSED' ? 'red' : 'gold');
  const modeTone = (m: string) => (m === 'VIDEO' ? 'navy' : m === 'PHONE' ? 'green' : 'gray');

  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">
          {showAdd ? "\u2715 Cancel" : "+ Add New"}
        </button>
      </div>
      {showAdd && (
        <AddNewForm
          title="Add New Telemedicine Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader
        title="Telemedicine"
        subtitle="Remote consultations in scope — the full lifecycle is modeled server-side; the video/phone transport plugs in behind the same endpoints (docs/13 §9)."
        action={
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
            <option value="ALL">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </Select>
        }
      />

      <Card pad={false}>
        {busy && items.length === 0 ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : items.length === 0 ? (
          <EmptyState title="No consultations" message="No teleconsultations match the current filter." />
        ) : (
          <div className="divide-y divide-slate-50">
            {items.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/app/patients/${t.patientId}`} className="font-semibold text-g-navy hover:underline">{t.patient?.fullName}</Link>
                    <span className="font-mono text-[10px] text-slate-400">{t.patient?.mrn}</span>
                    <Badge tone={modeTone(t.mode)}>{t.mode}</Badge>
                    <Badge tone={tone(t.status)}>{t.status.replace(/_/g, ' ')}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Scheduled {fmtDateTime(t.scheduledFor)}
                    {t.clinician ? ` · ${t.clinician.fullName}` : ' · unassigned'}
                    {t.notes ? ` · ${t.notes}` : ''}
                  </p>
                  {t.joinUrl && (
                    <a href={t.joinUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block font-mono text-[11px] text-g-navy underline">{t.joinUrl}</a>
                  )}
                  {t.outcome && <p className="mt-1 text-xs text-slate-500">Outcome: {t.outcome}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {canWrite && t.status === 'SCHEDULED' && (
                    <>
                      <Button size="sm" variant="green" loading={acting === t.id} onClick={() => void transition(t, 'IN_PROGRESS', 'Consultation started')}>Start</Button>
                      <Button size="sm" variant="outline" loading={acting === t.id} onClick={() => void transition(t, 'CANCELLED', 'Consultation cancelled')}>Cancel</Button>
                      <Button size="sm" variant="outline" loading={acting === t.id} onClick={() => void transition(t, 'MISSED', 'Marked missed')}>Missed</Button>
                    </>
                  )}
                  {canWrite && t.status === 'IN_PROGRESS' && (
                    <>
                      <Button size="sm" variant="green" onClick={() => { setFinishing(t); setOutcome(''); }}>Complete</Button>
                      <Button size="sm" variant="outline" loading={acting === t.id} onClick={() => void transition(t, 'CANCELLED', 'Consultation cancelled')}>Cancel</Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {finishing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setFinishing(null)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-bold text-g-ink">Complete consultation</h3>
            <p className="mb-4 text-xs text-slate-400">{finishing.patient?.fullName} · {finishing.mode} · started {fmtDateTime(finishing.startedAt)}</p>
            <Field label="Outcome / summary">
              <Textarea rows={4} value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="What was reviewed, advised or escalated?" />
            </Field>
            <div className="mt-4 flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setFinishing(null)}>Close</Button>
              <Button size="sm" variant="green" loading={acting === finishing.id} onClick={() => void complete()}>Complete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
