import { useCallback, useEffect, useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { DEMO_PRESCRIPTIONS } from '../../lib/demoData';
import type { PrescriptionWorklistRow } from '../../types';
import { Badge, Button, Card, EmptyState, PageHeader, Segmented, Spinner, useToast } from '../../components/ui';
import { fmtDateTime, ageFromDob } from '../../lib/format';
import DrugInteractionChecker from '../../components/DrugInteractionChecker';

type Filter = 'ACTIVE' | 'ALL';

const STATUS_TONE: Record<string, 'green' | 'gold' | 'navy' | 'red' | 'gray' | 'blue'> = {
  ACTIVE: 'gold',
  PARTIAL: 'blue',
  DISPENSED: 'green',
  CANCELLED: 'red',
};

export default function Pharmacy() {
  const [filter, setFilter] = useState<Filter>('ACTIVE');
  const [rows, setRows] = useState<PrescriptionWorklistRow[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      setRows((await api<{ items: PrescriptionWorklistRow[] }>(`/pharmacy/prescriptions?status=${filter}`)).items);
    } catch {
      // Demo fallback
      const filtered = DEMO_PRESCRIPTIONS.filter((r) => filter === 'ALL' || r.status === filter || r.status === 'ACTIVE' || r.status === 'PARTIAL');
      setRows(filtered as unknown as PrescriptionWorklistRow[]);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function dispense(rx: PrescriptionWorklistRow) {
    setBusyId(rx.id);
    try {
      const remaining = (rx.quantity ?? 1) - (rx.dispensedQty ?? 0);
      await api(`/pharmacy/prescriptions/${rx.id}/dispense`, { method: 'POST', body: { quantity: remaining } });
      toast(`Dispensed ${rx.medicine}`, 'success');
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Dispense failed', 'error');
    } finally {
      setBusyId(null);
    }
  }

  const active = rows?.filter((r) => r.status === 'ACTIVE' || r.status === 'PARTIAL') ?? [];

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
          title="Add New Pharmacy"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Pharmacy" subtitle="Prescription worklist — dispense, track partials and flag stock issues." />
      <div className="mb-5">
        <Segmented options={[{ value: 'ACTIVE', label: 'To dispense' }, { value: 'ALL', label: 'All prescriptions' }]} value={filter} onChange={setFilter} />
      </div>

      {!rows ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState icon="pill" title="Nothing to dispense" message="Active prescriptions will appear here as clinicians prescribe." />
      ) : (
        <Card pad={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
                  {['Patient', 'Medicine', 'Dose', 'Qty', 'Status', 'Prescribed', ''].map((h) => (
                    <th key={h} className="px-5 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-g-mist/40">
                    <td className="px-5 py-3">
                      <Link to={`/app/patients/${r.patient.id}`} className="font-semibold text-g-ink hover:text-g-red">
                        {r.patient.fullName}
                      </Link>
                      <p className="font-mono text-xs text-slate-400">{r.patient.mrn} · {ageFromDob(r.patient.dateOfBirth)}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-g-ink">{r.medicine}</p>
                      <p className="text-xs text-slate-400">{r.dosage ?? '—'} · {r.frequency ?? ''} · {r.duration ?? ''}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{r.route ?? '—'}</td>
                    <td className="px-5 py-3 tabular-nums text-slate-500">
                      {r.dispensedQty ?? 0} / {r.quantity ?? '—'}
                    </td>
                    <td className="px-5 py-3"><Badge tone={STATUS_TONE[r.status] ?? 'gray'}>{r.status}</Badge></td>
                    <td className="px-5 py-3 text-xs text-slate-400">{fmtDateTime(r.createdAt)}</td>
                    <td className="px-5 py-3 text-right">
                      {r.status === 'ACTIVE' || r.status === 'PARTIAL' ? (
                        <Button size="sm" variant="green" loading={busyId === r.id} onClick={() => void dispense(r)}>
                          Dispense
                        </Button>
                      ) : (
                        <Badge tone="green">Done</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {filter === 'ACTIVE' && active.length > 0 && (
        <p className="mt-3 text-xs text-slate-400">{active.length} prescription(s) awaiting dispensing.</p>
      )}

      <div className="mt-8">
        <DrugInteractionChecker />
      </div>
    </div>
  );
}
