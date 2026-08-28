import { useState } from 'react';
import { Badge } from '../../components/ui';

interface Compound {
  id: string; prescription: string; patient: string; pharmacist: string;
  formula: string; quantity: string; status: 'Pending' | 'In Progress' | 'Completed' | 'Rejected';
  dateRequested: string; dateCompleted?: string; notes: string;
}

const COMPOUNDS: Compound[] = [
  { id: 'CMP-001', prescription: 'Paediatric Paracetamol Suspension', patient: 'Kofi Mensah (Age 4)', pharmacist: 'Dr. Ama Serwaa', formula: 'Paracetamol 120mg/5ml + Banana flavour + suspending agent', quantity: '100ml', status: 'Completed', dateRequested: '2026-08-20', dateCompleted: '2026-08-21', notes: 'Mixed and bottled. Batch CMP-B001.' },
  { id: 'CMP-002', prescription: 'Zinc Sulphate Oral Solution', patient: 'Akua Nyarko (Age 2)', pharmacist: 'Dr. Ama Serwaa', formula: 'Zinc Sulphate 20mg per 5ml + Orange flavour', quantity: '60ml', status: 'In Progress', dateRequested: '2026-08-22', notes: 'Weighing and mixing in progress.' },
  { id: 'CMP-003', prescription: 'Custom Wound Dressing', patient: 'Yaw Boateng', pharmacist: 'Dr. Kofi Mensah', formula: 'Hydrocolloid base + Silver sulphadiazine 1% + Carrier', quantity: '5 dressings', status: 'Pending', dateRequested: '2026-08-23', notes: 'Awaiting raw materials.' },
  { id: 'CMP-004', prescription: 'Oral Rehydration Salts', patient: 'Esi Darko (Age 6)', pharmacist: 'Dr. Ama Serwaa', formula: 'NaCl 2.6g + KCl 1.5g + NaHCO3 2.9g + Glucose 13.5g per litre', quantity: '1L', status: 'Completed', dateRequested: '2026-08-19', dateCompleted: '2026-08-19', notes: 'ORS prepared and labelled.' },
];

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-800', 'In Progress': 'bg-blue-100 text-blue-800',
  Completed: 'bg-green-100 text-green-800', Rejected: 'bg-red-100 text-red-800',
};

export default function PharmacyCompounding() {
  const [records] = useState<Compound[]>(COMPOUNDS);
  const [filter, setFilter] = useState('');

  const filtered = records.filter((r) =>
    !filter || r.status === filter || r.patient.toLowerCase().includes(filter.toLowerCase()) || r.prescription.toLowerCase().includes(filter.toLowerCase())
  );

  const stats = {
    pending: records.filter((r) => r.status === 'Pending').length,
    inProgress: records.filter((r) => r.status === 'In Progress').length,
    completed: records.filter((r) => r.status === 'Completed').length,
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Pharmacy Compounding</h1><p className="text-gray-500">Custom medication preparation, formula management, and batch tracking</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pending', value: stats.pending, color: 'text-yellow-600' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-blue-600' },
          { label: 'Completed Today', value: stats.completed, color: 'text-green-600' },
          { label: 'Total Requests', value: records.length, color: 'text-slate-700' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {['', 'Pending', 'In Progress', 'Completed', 'Rejected'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full text-xs font-medium transition ${filter === f ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {f || 'All'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((c) => (
          <div key={c.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-400">{c.id}</span>
                  <span className="font-semibold text-sm">{c.prescription}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Patient: {c.patient} · Pharmacist: {c.pharmacist}</p>
              </div>
              <Badge className={STATUS_COLORS[c.status]}>{c.status}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs bg-slate-50 rounded p-2 mt-2">
              <div><span className="text-slate-400">Formula:</span> <span className="text-slate-700">{c.formula}</span></div>
              <div><span className="text-slate-400">Quantity:</span> <span className="text-slate-700">{c.quantity}</span></div>
              <div><span className="text-slate-400">Requested:</span> <span className="text-slate-700">{c.dateRequested}</span></div>
            </div>
            {c.notes && <p className="text-xs text-slate-500 mt-2 italic">{c.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
