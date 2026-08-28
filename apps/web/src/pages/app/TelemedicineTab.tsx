import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import type { Teleconsultation } from '../../types';
import { Badge, Button, Card, Field, Input, Select, useToast } from '../../components/ui';
import { fmtDateTime } from '../../lib/format';

/**
 * Telemedicine (spec §82–83, docs/13 §9) — the patient's remote
 * consultations with a booking form. Transitions happen from the Telemedicine
 * worklist; the assigned clinician always owns their consultation.
 */
export default function TelemedicineTab({ patientId }: { patientId: string }) {
  const { user } = useAuth();
  const toast = useToast();
  const canBook = !!user?.permissions.includes('write_clinical_note');
  const [items, setItems] = useState<Teleconsultation[]>([]);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ scheduledFor: '', mode: 'VIDEO', notes: '' });

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const res = await api<{ items: Teleconsultation[] }>(`/patients/${patientId}/teleconsultations`);
      setItems(res.items);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not load consultations', 'error');
    } finally {
      setBusy(false);
    }
  }, [patientId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function book() {
    if (!f.scheduledFor) {
      toast('Pick a scheduled time', 'error');
      return;
    }
    setSaving(true);
    try {
      await api(`/patients/${patientId}/teleconsultations`, {
        method: 'POST',
        body: { scheduledFor: new Date(f.scheduledFor).toISOString(), mode: f.mode, notes: f.notes || undefined },
      });
      toast('Teleconsultation booked', 'success');
      setOpen(false);
      setF({ ...f, notes: '' });
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Booking failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  const tone = (s: string) => (s === 'COMPLETED' ? 'green' : s === 'IN_PROGRESS' ? 'blue' : s === 'CANCELLED' ? 'gray' : s === 'MISSED' ? 'red' : 'gold');

  return (
    <Card
      title="Teleconsultations"
      subtitle={`${items.length} remote consultation(s) — booked here, managed from the Telemedicine worklist`}
      action={canBook ? (
        <Button size="sm" variant={open ? 'ghost' : 'green'} onClick={() => setOpen(!open)}>{open ? 'Close' : 'Book consultation'}</Button>
      ) : undefined}
    >
      {open && (
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4 sm:grid-cols-3">
          <Field label="Scheduled for"><Input type="datetime-local" value={f.scheduledFor} onChange={(e) => setF({ ...f, scheduledFor: e.target.value })} /></Field>
          <Field label="Mode">
            <Select value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value })}>
              <option value="VIDEO">Video</option>
              <option value="PHONE">Phone</option>
              <option value="CHAT">Chat</option>
            </Select>
          </Field>
          <Field label="Notes"><Input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="e.g. Review hypertension medication" /></Field>
          <div className="col-span-full"><Button variant="green" loading={saving} onClick={() => void book()}>Book consultation</Button></div>
        </div>
      )}
      {items.length === 0 && !busy ? (
        <p className="py-4 text-center text-sm text-slate-400">No teleconsultations booked.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {items.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-4 py-2.5">
              <div className="text-sm">
                <span className="font-semibold text-g-ink">{fmtDateTime(t.scheduledFor)}</span>
                <span className="mx-2 text-slate-300">·</span>
                <Badge tone={t.mode === 'VIDEO' ? 'navy' : t.mode === 'PHONE' ? 'green' : 'gray'}>{t.mode}</Badge>
                {t.clinician && <><span className="mx-2 text-slate-300">·</span><span className="text-slate-500">{t.clinician.fullName}</span></>}
              </div>
              <Badge tone={tone(t.status)}>{t.status.replace(/_/g, ' ')}</Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
