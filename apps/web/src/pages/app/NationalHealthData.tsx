import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface DHIMSReport {
  id: string; facility: string; period: string; submitted: string;
  status: 'Submitted' | 'Pending' | 'Accepted' | 'Rejected';
  indicators: { name: string; value: number }[];
}

const REPORTS: DHIMSReport[] = [
  { id: 'DH-001', facility: 'Korle Bu Teaching Hospital', period: 'August 2026', submitted: '2026-08-24', status: 'Accepted', indicators: [{ name: 'OPD Attendance', value: 12500 }, { name: 'Admissions', value: 850 }, { name: 'Discharges', value: 780 }, { name: 'Deaths', value: 15 }, { name: 'Births', value: 95 }, { name: 'Surgical Operations', value: 420 }] },
  { id: 'DH-002', facility: 'Korle Bu Teaching Hospital', period: 'July 2026', submitted: '2026-08-02', status: 'Accepted', indicators: [{ name: 'OPD Attendance', value: 11800 }, { name: 'Admissions', value: 820 }, { name: 'Discharges', value: 790 }, { name: 'Deaths', value: 18 }, { name: 'Births', value: 88 }, { name: 'Surgical Operations', value: 405 }] },
  { id: 'DH-003', facility: 'Korle Bu Teaching Hospital', period: 'June 2026', submitted: '2026-07-02', status: 'Accepted', indicators: [{ name: 'OPD Attendance', value: 11200 }, { name: 'Admissions', value: 790 }, { name: 'Discharges', value: 760 }, { name: 'Deaths', value: 12 }, { name: 'Births', value: 92 }, { name: 'Surgical Operations', value: 390 }] },
];

const STATUS_COLORS: Record<string, string> = { Submitted: 'bg-blue-100 text-blue-800', Pending: 'bg-yellow-100 text-yellow-800', Accepted: 'bg-green-100 text-green-800', Rejected: 'bg-red-100 text-red-800' };

export default function NationalHealthData() {
  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);
  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">
          {showAdd ? "\u2715 Cancel" : "+ Add New"}
        </button>
      </div>
      {showAdd && (
        <AddNewForm
          title="Add New National Health Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">National Health Data (DHIMS2)</h1><p className="text-gray-500">DHIMS2 reporting, national surveillance data, and health indicators submission</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Reports Submitted', value: REPORTS.length, color: 'text-blue-600' }, { label: 'Accepted', value: REPORTS.filter(r => r.status === 'Accepted').length, color: 'text-green-600' }, { label: 'Pending', value: REPORTS.filter(r => r.status === 'Pending').length, color: 'text-yellow-600' }, { label: 'Periods Covered', value: REPORTS.length, color: 'text-purple-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>
      <div className="space-y-4">
        {REPORTS.map(r => (
          <div key={r.id} className="bg-white rounded-lg border p-5">
            <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><span className="font-mono text-xs text-gray-500">{r.id}</span><span className="font-bold">{r.facility}</span><span className="text-sm text-gray-500">{r.period}</span></div><Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge></div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">{r.indicators.map(ind => (
              <div key={ind.name} className="bg-gray-50 rounded p-2 text-center"><div className="font-bold text-blue-600">{ind.value.toLocaleString()}</div><div className="text-[10px] text-gray-500">{ind.name}</div></div>
            ))}</div>
            <div className="text-xs text-gray-500 mt-2">Submitted: {r.submitted}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
