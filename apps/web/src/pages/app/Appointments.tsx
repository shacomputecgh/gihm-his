import { useCallback, useEffect, useState, type FormEvent } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { api } from '../../lib/api';
import { DEMO_APPOINTMENTS, DEMO_PATIENTS } from '../../lib/demoData';
import type { Appointment, Page, Patient } from '../../types';
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Select, Spinner, useToast } from '../../components/ui';
import { fmtTime, todayIso } from '../../lib/format';

const STATUS_TONE: Record<string, 'green' | 'gold' | 'gray' | 'blue' | 'red'> = {
  BOOKED: 'blue', CONFIRMED: 'green', CHECKED_IN: 'gold', COMPLETED: 'gray', CANCELLED: 'red', MISSED: 'red',
};

export default function Appointments() {
  const toast = useToast();
  const [date, setDate] = useState(todayIso());
  const [data, setData] = useState<Page<Appointment> | null>(null);
  const [busy, setBusy] = useState(false);
  const [book, setBook] = useState({ patientId: '', service: '', scheduledFor: '', reason: '' });
  const [patients, setPatients] = useState<Patient[]>([]);

  const load = useCallback(async () => {
    try {
      setData(await api<Page<Appointment>>('/appointments', { query: { date, pageSize: '50' } }));
    } catch {
      setData({ items: DEMO_APPOINTMENTS as unknown as Appointment[], total: DEMO_APPOINTMENTS.length, page: 1, pageSize: 50 });
    }
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void api<Page<Patient>>('/patients', { query: { pageSize: '100' } }).then((r) => setPatients(r.items)).catch(() => {
      setPatients(DEMO_PATIENTS as unknown as Patient[]);
    });
  }, []);

  async function bookAppointment(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/appointments', { method: 'POST', body: { ...book, patientId: book.patientId, scheduledFor: new Date(book.scheduledFor).toISOString() } });
      toast('Appointment booked', 'success');
      setBook({ patientId: '', service: '', scheduledFor: '', reason: '' });
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Booking failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: string) {
    try {
      await api(`/appointments/${id}/status`, { method: 'POST', body: { status } });
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  }

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
          title="Add New Appointment"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Appointments" subtitle="Today's schedule and new bookings." action={<Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {!data ? (
            <Spinner />
          ) : data.items.length === 0 ? (
            <EmptyState icon="calendar" title="No appointments for this date" message="Book an appointment using the form, or pick a different date." />
          ) : (
            <Card pad={false}>
              <div className="divide-y divide-slate-50">
                {data.items.map((a) => (
                  <div key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                    <span className="flex h-11 w-14 flex-col items-center justify-center rounded-lg bg-g-mist">
                      <span className="text-xs font-bold text-g-ink">{fmtTime(a.scheduledFor)}</span>
                      <span className="text-[10px] text-slate-400">{new Date(a.scheduledFor).toLocaleDateString('en-GB', { weekday: 'short' })}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-g-ink">{a.patient?.fullName ?? '—'}</p>
                      <p className="text-xs text-slate-400">{a.service ?? 'General OPD'} · {a.patient?.mrn}</p>
                    </div>
                    <Badge tone={STATUS_TONE[a.status] ?? 'gray'}>{a.status}</Badge>
                    {a.status === 'BOOKED' && <Button size="sm" variant="outline" onClick={() => void setStatus(a.id, 'CONFIRMED')}>Confirm</Button>}
                    {a.status !== 'COMPLETED' && a.status !== 'CANCELLED' && (
                      <Button size="sm" variant="ghost" onClick={() => void setStatus(a.id, 'CANCELLED')}>Cancel</Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <Card title="Book appointment">
          <form onSubmit={bookAppointment} className="space-y-3">
            <Field label="Patient">
              <Select required value={book.patientId} onChange={(e) => setBook({ ...book, patientId: e.target.value })}>
                <option value="">Select patient…</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.mrn} — {p.fullName}</option>)}
              </Select>
            </Field>
            <Field label="Service">
              <Select value={book.service} onChange={(e) => setBook({ ...book, service: e.target.value })}>
                <option value="">General OPD</option>
                {['General OPD', 'Antenatal', 'Paediatrics', 'Dental', 'Cardiology review', 'Diabetes review', 'Physiotherapy'].map((s) => <option key={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="Date & time">
              <Input type="datetime-local" required value={book.scheduledFor} onChange={(e) => setBook({ ...book, scheduledFor: e.target.value })} />
            </Field>
            <Field label="Reason">
              <Input value={book.reason} onChange={(e) => setBook({ ...book, reason: e.target.value })} placeholder="Brief reason" />
            </Field>
            <Button type="submit" className="w-full" loading={busy} icon="calendar">Book</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
