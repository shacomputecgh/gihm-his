import { useState } from 'react';
import { Badge } from '../../components/ui';

interface MedicalRecord { id: string; date: string; type: string; title: string; doctor: string; facility: string; department: string; status: 'Active' | 'Archived' | 'Confidential'; }

const RECORDS: MedicalRecord[] = [
  { id: 'MR-001', date: '2026-08-23', type: 'Consultation', title: 'Cardiology Follow-up', doctor: 'Dr. Sarah Johnson', facility: 'Korle-Bu Teaching Hospital', department: 'Cardiology', status: 'Active' },
  { id: 'MR-002', date: '2026-08-22', type: 'Lab Result', title: 'Full Blood Count Results', doctor: 'Dr. Sarah Johnson', facility: 'Korle-Bu Teaching Hospital', department: 'Laboratory', status: 'Active' },
  { id: 'MR-003', date: '2026-08-20', type: 'Prescription', title: 'Amlodipine 5mg + Enalapril 10mg', doctor: 'Dr. Sarah Johnson', facility: 'Korle-Bu Teaching Hospital', department: 'Pharmacy', status: 'Active' },
  { id: 'MR-004', date: '2026-08-15', type: 'X-Ray Report', title: 'Chest X-Ray — Normal', doctor: 'Dr. Ama Darko', facility: 'Korle-Bu Teaching Hospital', department: 'Radiology', status: 'Active' },
  { id: 'MR-005', date: '2026-08-10', type: 'Discharge Summary', title: 'Post-Pneumonia Discharge', doctor: 'Dr. James Mensah', facility: 'Korle-Bu Teaching Hospital', department: 'Medical', status: 'Active' },
  { id: 'MR-006', date: '2026-07-15', type: 'Surgical Report', title: 'Appendectomy', doctor: 'Dr. James Mensah', facility: 'Korle-Bu Teaching Hospital', department: 'Surgery', status: 'Active' },
  { id: 'MR-007', date: '2026-06-01', type: 'Vaccination', title: 'COVID-19 Booster', doctor: 'Nurse Akua', facility: 'Korle-Bu Teaching Hospital', department: 'Immunization', status: 'Active' },
  { id: 'MR-008', date: '2026-05-01', type: 'Imaging', title: 'MRI Brain — Normal', doctor: 'Dr. Ama Darko', facility: 'Korle-Bu Teaching Hospital', department: 'Radiology', status: 'Active' },
];

const TYPE_COLORS: Record<string, string> = {
  'Consultation': 'bg-blue-100 text-blue-800', 'Lab Result': 'bg-green-100 text-green-800',
  'Prescription': 'bg-purple-100 text-purple-800', 'X-Ray Report': 'bg-orange-100 text-orange-800',
  'Discharge Summary': 'bg-teal-100 text-teal-800', 'Surgical Report': 'bg-red-100 text-red-800',
  'Vaccination': 'bg-emerald-100 text-emerald-800', 'Imaging': 'bg-cyan-100 text-cyan-800',
};

export default function MedicalRecordsEnhanced() {
  const [records] = useState<MedicalRecord[]>(RECORDS);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  const filtered = records.filter((r) => {
    if (typeFilter && r.type !== typeFilter) return false;
    if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !r.doctor.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const types = [...new Set(records.map((r) => r.type))];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Medical Records</h1><p className="text-gray-500">Complete patient medical history, documents, and health records</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-slate-700">{records.length}</div><div className="text-xs text-slate-500">Total Records</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-blue-600">{records.filter((r) => r.type === 'Consultation').length}</div><div className="text-xs text-slate-500">Consultations</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-green-600">{records.filter((r) => r.type === 'Lab Result').length}</div><div className="text-xs text-slate-500">Lab Results</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-purple-600">{records.filter((r) => r.type === 'Prescription').length}</div><div className="text-xs text-slate-500">Prescriptions</div></div>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search records..." className="flex-1 min-w-[200px] max-w-md border rounded-lg px-3 py-2 text-sm" />
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setTypeFilter('')} className={`px-2 py-1 rounded-full text-xs font-medium transition ${!typeFilter ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600'}`}>All</button>
          {types.map((t) => <button key={t} onClick={() => setTypeFilter(t)} className={`px-2 py-1 rounded-full text-xs font-medium transition ${typeFilter === t ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{t}</button>)}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((r) => (
          <div key={r.id} className="bg-white rounded-lg border p-4 flex items-center gap-4 hover:shadow-md transition">
            <div className="min-w-[80px] text-center">
              <div className="text-sm font-bold text-slate-700">{r.date.split('-')[2]}</div>
              <div className="text-[10px] text-slate-400">{new Date(r.date).toLocaleDateString('en', { month: 'short', year: 'numeric' })}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge className={TYPE_COLORS[r.type]}>{r.type}</Badge>
                <span className="font-semibold text-sm truncate">{r.title}</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">{r.doctor} · {r.department} · {r.facility}</div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => {}} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">View</button>
              <button onClick={() => {}} className="text-xs px-2 py-1 bg-slate-50 text-slate-600 rounded hover:bg-slate-100">Print</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
