import { useState } from 'react';
import { Badge, useToast } from '../../components/ui';

interface AntibioticRecord {
  id: string; patientName: string; antibiotic: string; indication: string;
  startDate: string; duration: string; prescriber: string; ward: string;
  status: 'Active' | 'Review Due' | 'Completed' | 'Switched';
  cultureResult?: string; daysOnTherapy: number;
}

const RECORDS: AntibioticRecord[] = [
  { id: 'AB-001', patientName: 'Kwame Asante', antibiotic: 'Ceftriaxone 2g IV OD', indication: 'Community-acquired pneumonia', startDate: '2026-08-20', duration: '7 days', prescriber: 'Dr. Sarah Johnson', ward: 'Medical Ward A', status: 'Review Due', cultureResult: 'Sensitive to Ceftriaxone', daysOnTherapy: 3 },
  { id: 'AB-002', patientName: 'Akua Mensah', antibiotic: 'Metronidazole 400mg TDS', indication: 'Surgical site infection', startDate: '2026-08-22', duration: '5 days', prescriber: 'Dr. James Mensah', ward: 'Surgical Ward', status: 'Active', daysOnTherapy: 1 },
  { id: 'AB-003', patientName: 'Nana Osei', antibiotic: 'Meropenem 1g TDS', indication: 'Hospital-acquired pneumonia', startDate: '2026-08-18', duration: '10 days', prescriber: 'Dr. Ama Darko', ward: 'ICU', status: 'Review Due', cultureResult: 'ESBL E. coli — sensitive to Meropenem', daysOnTherapy: 5 },
  { id: 'AB-004', patientName: 'Efua Nyarko', antibiotic: 'Amoxicillin 500mg TDS', indication: 'UTI', startDate: '2026-08-21', duration: '3 days', prescriber: 'Dr. Kofi Appiah', ward: 'Medical Ward B', status: 'Completed', daysOnTherapy: 3 },
  { id: 'AB-005', patientName: 'Yaw Boateng', antibiotic: 'Vancomycin 1g BD', indication: 'MRSA bacteraemia', startDate: '2026-08-19', duration: '14 days', prescriber: 'Dr. Sarah Johnson', ward: 'ICU', status: 'Active', cultureResult: 'MRSA — sensitive to Vancomycin', daysOnTherapy: 4 },
];

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-blue-100 text-blue-800', 'Review Due': 'bg-yellow-100 text-yellow-800',
  Completed: 'bg-green-100 text-green-800', Switched: 'bg-purple-100 text-purple-800',
};

export default function AntibioticStewardship() {
  const toast = useToast();
  const [records] = useState<AntibioticRecord[]>(RECORDS);
  const [filter, setFilter] = useState('');

  const filtered = records.filter((r) => !filter || r.status === filter);
  const totalDDD = records.reduce((s, r) => s + r.daysOnTherapy, 0);
  const reviewDue = records.filter((r) => r.status === 'Review Due').length;
  const ivCount = records.filter((r) => r.antibiotic.includes('IV') || r.antibiotic.includes('g ')).length;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Antibiotic Stewardship</h1><p className="text-gray-500">Monitor antibiotic usage, DDD rates, and antimicrobial resistance patterns</p></div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-blue-600">{records.filter((r) => r.status === 'Active').length}</div><div className="text-xs text-slate-500">Active Courses</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-yellow-600">{reviewDue}</div><div className="text-xs text-slate-500">Review Due</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-slate-700">{totalDDD}</div><div className="text-xs text-slate-500">Total DDD</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-purple-600">{ivCount}</div><div className="text-xs text-slate-500">IV Antibiotics</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-green-600">{records.filter((r) => r.status === 'Completed').length}</div><div className="text-xs text-slate-500">Completed</div></div>
      </div>

      <div className="flex gap-2">
        {['', 'Active', 'Review Due', 'Completed', 'Switched'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full text-xs font-medium transition ${filter === f ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {f || 'All'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Patient</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Antibiotic</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Indication</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Days</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Culture</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-xs font-mono text-slate-500">{r.id}</td>
                <td className="px-4 py-3"><div className="text-sm font-medium">{r.patientName}</div><div className="text-xs text-slate-400">{r.ward}</div></td>
                <td className="px-4 py-3 text-sm">{r.antibiotic}</td>
                <td className="px-4 py-3 text-sm text-slate-600 max-w-xs">{r.indication}</td>
                <td className="px-4 py-3 text-sm font-bold">{r.daysOnTherapy}/{r.duration.split(' ')[0]}</td>
                <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px] truncate">{r.cultureResult || '—'}</td>
                <td className="px-4 py-3"><Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {r.status === 'Review Due' && <button onClick={() => {}} className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100">Review</button>}
                    {r.status === 'Active' && <button onClick={() => {}} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">Stop</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
