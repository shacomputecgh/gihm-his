import { useState } from 'react';
import { Badge, Button, Card, Input, Select, useToast } from '../../components/ui';

interface MedReconciliation {
  id: string; patientName: string; mrn: string; ward: string;
  reconciliationType: 'Admission' | 'Transfer' | 'Discharge' | 'Post-Order';
  date: string; pharmacist: string;
  admissionMeds: { name: string; dose: string; frequency: string; route: string }[];
  currentOrders: { name: string; dose: string; frequency: string; route: string }[];
  discrepancies: string[];
  status: 'Pending' | 'In Progress' | 'Complete' | 'Discrepancies Found';
}

const INITIAL: MedReconciliation[] = [
  { id: 'MR-001', patientName: 'Kwame Asante', mrn: 'MRN-2026-030', ward: 'Medical Ward', reconciliationType: 'Admission', date: '2026-08-24', pharmacist: 'Pharm. Osei',
    admissionMeds: [{ name: 'Metformin', dose: '500mg', frequency: 'Twice daily', route: 'Oral' }, { name: 'Amlodipine', dose: '5mg', frequency: 'Once daily', route: 'Oral' }],
    currentOrders: [{ name: 'Metformin', dose: '500mg', frequency: 'Twice daily', route: 'Oral' }, { name: 'Amlodipine', dose: '5mg', frequency: 'Once daily', route: 'Oral' }, { name: 'Paracetamol', dose: '1g', frequency: '6-hourly', route: 'Oral' }],
    discrepancies: ['New medication added: Paracetamol for pain'], status: 'Complete' },
  { id: 'MR-002', patientName: 'Ama Darko', mrn: 'MRN-2026-031', ward: 'ICU', reconciliationType: 'Transfer', date: '2026-08-25', pharmacist: 'Pharm. Abena',
    admissionMeds: [{ name: 'Omeprazole', dose: '20mg', frequency: 'Once daily', route: 'Oral' }],
    currentOrders: [{ name: 'Omeprazole', dose: '40mg', frequency: 'Once daily', route: 'IV' }, { name: 'Morphine', dose: '2.5mg', frequency: '4-hourly PRN', route: 'IV' }],
    discrepancies: ['Omeprazole route change (oral→IV) and dose increased', 'New controlled substance: Morphine'], status: 'Discrepancies Found' },
  { id: 'MR-003', patientName: 'Kofi Mensah', mrn: 'MRN-2026-032', ward: 'Surgical Ward', reconciliationType: 'Discharge', date: '2026-08-25', pharmacist: 'Pharm. Kofi',
    admissionMeds: [{ name: 'Atenolol', dose: '50mg', frequency: 'Once daily', route: 'Oral' }],
    currentOrders: [{ name: 'Atenolol', dose: '50mg', frequency: 'Once daily', route: 'Oral' }, { name: 'Amoxicillin', dose: '500mg', frequency: '8-hourly', route: 'Oral' }],
    discrepancies: ['New discharge med: Amoxicillin (5-day course)'], status: 'In Progress' },
];

const STATUS_CONFIG: Record<MedReconciliation['status'], { tone: 'green' | 'gold' | 'red' | 'gray' }> = {
  Pending: { tone: 'gray' }, 'In Progress': { tone: 'gold' },
  Complete: { tone: 'green' }, 'Discrepancies Found': { tone: 'red' },
};

export default function MedicationReconciliation() {
  const [records, setRecords] = useState<MedReconciliation[]>(INITIAL);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ patientName: '', mrn: '', ward: '', reconciliationType: 'Admission' as MedReconciliation['reconciliationType'], pharmacist: '' });
  const toast = useToast();
  const filtered = records.filter((r) => !filter || r.status === filter);

  const handleAdd = () => {
    const r = { id: `MR-${String(records.length + 1).padStart(3, '0')}`, patientName: form.patientName, mrn: form.mrn, ward: form.ward, reconciliationType: form.reconciliationType as MedReconciliation['reconciliationType'], pharmacist: form.pharmacist, date: new Date().toISOString().split('T')[0], admissionMeds: [] as MedReconciliation['admissionMeds'], currentOrders: [] as MedReconciliation['currentOrders'], discrepancies: [] as string[], status: 'Pending' as MedReconciliation['status'] };
    setRecords([r as MedReconciliation, ...records]); setShowForm(false);
    setForm({ patientName: '', mrn: '', ward: '', reconciliationType: 'Admission', pharmacist: '' });
    toast('Medication reconciliation started');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Medication Reconciliation</h1><p className="text-gray-500">Admission, transfer, and discharge medication reconciliation</p></div>
        <Button onClick={() => setShowForm(true)}>+ New Reconciliation</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(STATUS_CONFIG).map(([status]) => (
          <button key={status} onClick={() => setFilter(filter === status ? '' : status)} className={`p-3 rounded-lg border text-center transition ${filter === status ? 'ring-2 ring-green-500 border-green-300' : 'border-slate-200 hover:bg-slate-50'}`}>
            <div className="text-xl font-bold">{records.filter((r) => r.status === status).length}</div>
            <div className="text-xs text-slate-500">{status}</div>
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {filtered.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">{r.patientName} <span className="text-gray-400 text-sm">({r.mrn})</span></h3>
                <p className="text-sm text-gray-500">{r.ward} · {r.reconciliationType} · {r.date} · {r.pharmacist}</p>
              </div>
              <Badge tone={STATUS_CONFIG[r.status]?.tone}>{r.status}</Badge>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-1">Home/Admission Medications</h4>
                {r.admissionMeds.length === 0 ? <p className="text-xs text-gray-400">None recorded</p> : (
                  <div className="space-y-1">{r.admissionMeds.map((m, i) => (
                    <div key={i} className="text-sm bg-blue-50 p-2 rounded">{m.name} {m.dose} {m.frequency} ({m.route})</div>
                  ))}</div>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-1">Current Orders</h4>
                {r.currentOrders.length === 0 ? <p className="text-xs text-gray-400">None ordered</p> : (
                  <div className="space-y-1">{r.currentOrders.map((m, i) => (
                    <div key={i} className="text-sm bg-green-50 p-2 rounded">{m.name} {m.dose} {m.frequency} ({m.route})</div>
                  ))}</div>
                )}
              </div>
            </div>
            {r.discrepancies.length > 0 && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-red-700 mb-1">⚠️ Discrepancies ({r.discrepancies.length})</h4>
                <ul className="list-disc list-inside text-sm text-red-600">{r.discrepancies.map((d, i) => <li key={i}>{d}</li>)}</ul>
              </div>
            )}
          </Card>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowForm(false)} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-bold">✕</button>
            <h2 className="text-lg font-bold mb-4">New Medication Reconciliation</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">Patient Name *</label><Input value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} /></div>
                <div><label className="block text-sm font-medium mb-1">MRN *</label><Input value={form.mrn} onChange={(e) => setForm({ ...form, mrn: e.target.value })} /></div>
                <div><label className="block text-sm font-medium mb-1">Ward *</label><Input value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })} /></div>
                <div><label className="block text-sm font-medium mb-1">Type *</label>
                  <Select value={form.reconciliationType} onChange={(e) => setForm({ ...form, reconciliationType: e.target.value as MedReconciliation['reconciliationType'] })}>
                    <option>Admission</option><option>Transfer</option><option>Discharge</option><option>Post-Order</option>
                  </Select>
                </div>
                <div className="col-span-2"><label className="block text-sm font-medium mb-1">Pharmacist *</label><Input value={form.pharmacist} onChange={(e) => setForm({ ...form, pharmacist: e.target.value })} /></div>
              </div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={handleAdd}>Start Reconciliation</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
