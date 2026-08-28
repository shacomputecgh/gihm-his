import { useState } from 'react';
import { Badge, Card } from '../../components/ui';

interface LabRequest { id: string; patientName: string; mrn: string; ward: string; doctor: string; tests: { name: string; result?: string; unit?: string; referenceRange?: string; flag?: 'Normal' | 'High' | 'Low' | 'Critical'; }[]; status: 'Ordered' | 'Sample Collected' | 'Processing' | 'Verified' | 'Reported'; dateOrdered: string; dateCollected?: string; dateReported?: string; priority: 'Routine' | 'Urgent' | 'STAT'; sampleType: string; comments?: string; }

const REQUESTS: LabRequest[] = [
  { id: 'LAB-001', patientName: 'Kwame Asante', mrn: 'MRN-2024-0891', ward: 'Surgical Ward', doctor: 'Dr. Yaw Boateng', tests: [{ name: 'FBC', result: 'Hb 11.2 g/dL', unit: 'g/dL', referenceRange: '12-16', flag: 'Low' }, { name: 'WBC', result: '12.5', unit: 'x10⁹/L', referenceRange: '4-11', flag: 'High' }, { name: 'CRP', result: '45', unit: 'mg/L', referenceRange: '<10', flag: 'High' }], status: 'Reported', dateOrdered: '2026-08-25', dateCollected: '2026-08-25 06:00', dateReported: '2026-08-25 14:00', priority: 'Routine', sampleType: 'Blood' },
  { id: 'LAB-002', patientName: 'Nana Osei', mrn: 'MRN-2024-0567', ward: 'ICU', doctor: 'Dr. Ama Darko', tests: [{ name: 'Blood Culture', result: 'E. coli', referenceRange: 'No growth', flag: 'Critical' }, { name: 'Lactate', result: '4.8', unit: 'mmol/L', referenceRange: '<2', flag: 'High' }, { name: 'Procalcitonin', result: '8.5', unit: 'ng/mL', referenceRange: '<0.5', flag: 'Critical' }], status: 'Verified', dateOrdered: '2026-08-26', dateCollected: '2026-08-26 06:30', priority: 'STAT', sampleType: 'Blood', comments: 'Blood culture positive — sensitive to Meropenem' },
  { id: 'LAB-003', patientName: 'Efua Nyarko', mrn: 'MRN-2024-0998', ward: 'Medical Ward B', doctor: 'Dr. Kofi Asante', tests: [{ name: 'HbA1c', result: '9.2', unit: '%', referenceRange: '<6.5', flag: 'High' }, { name: 'Fasting Glucose', result: '14.2', unit: 'mmol/L', referenceRange: '3.9-6.1', flag: 'High' }, { name: 'Lipid Profile', result: 'TC 6.8', unit: 'mmol/L', referenceRange: '<5.2', flag: 'High' }], status: 'Reported', dateOrdered: '2026-08-24', dateCollected: '2026-08-24 06:00', dateReported: '2026-08-24 16:00', priority: 'Routine', sampleType: 'Blood' },
  { id: 'LAB-004', patientName: 'Kofi Amoako Jr.', mrn: 'MRN-2024-0777', ward: 'Paediatric', doctor: 'Dr. Nana Agyeman', tests: [{ name: 'Malaria RDT', result: 'Positive', flag: 'High' }, { name: 'FBC', result: 'Hb 7.8 g/dL', unit: 'g/dL', referenceRange: '11-14', flag: 'Low' }, { name: 'Parasite Count', result: '250,000/μL', referenceRange: '<100,000', flag: 'Critical' }], status: 'Processing', dateOrdered: '2026-08-26', dateCollected: '2026-08-26 07:30', priority: 'Urgent', sampleType: 'Blood' },
  { id: 'LAB-005', patientName: 'Ama Boateng', mrn: 'MRN-2024-0112', ward: 'Oncology', doctor: 'Dr. Yaw Boateng', tests: [{ name: 'FBC', result: 'WBC 1.2', unit: 'x10⁹/L', referenceRange: '4-11', flag: 'Critical' }, { name: 'Neutrophils', result: '0.3', unit: 'x10⁹/L', referenceRange: '1.5-8', flag: 'Critical' }, { name: 'Platelets', result: '85', unit: 'x10⁹/L', referenceRange: '150-400', flag: 'Low' }], status: 'Verified', dateOrdered: '2026-08-26', dateCollected: '2026-08-26 08:00', priority: 'Urgent', sampleType: 'Blood', comments: 'Neutropenic — consider G-CSF' },
];

const _STATUS_COLORS: Record<string, string> = { Ordered: 'bg-slate-100 text-slate-800', 'Sample Collected': 'bg-blue-100 text-blue-800', Processing: 'bg-orange-100 text-orange-800', Verified: 'bg-green-100 text-green-800', Reported: 'bg-emerald-100 text-emerald-800' };

export default function LabEnhanced() {
  const [selected, setSelected] = useState<LabRequest | null>(null);
  const [filter, setFilter] = useState('All');
  const filtered = filter === 'All' ? REQUESTS : REQUESTS.filter(r => r.status === filter);
  const criticalResults = REQUESTS.filter(r => r.tests.some(t => t.flag === 'Critical'));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Laboratory Information System</h1>
          <p className="text-slate-500 text-sm">Test requests, results, and turnaround tracking</p>
        </div>
        <button onClick={() => {}} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ New Request</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4"><p className="text-xs text-slate-500">Total Requests</p><p className="text-2xl font-bold">{REQUESTS.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Critical Results</p><p className="text-2xl font-bold text-red-600">{criticalResults.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Processing</p><p className="text-2xl font-bold text-orange-600">{REQUESTS.filter(r => r.status === 'Processing').length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Verified</p><p className="text-2xl font-bold text-green-600">{REQUESTS.filter(r => r.status === 'Verified' || r.status === 'Reported').length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">STAT Requests</p><p className="text-2xl font-bold text-purple-600">{REQUESTS.filter(r => r.priority === 'STAT').length}</p></Card>
      </div>

      <div className="flex gap-2">
        {['All', 'Ordered', 'Processing', 'Verified', 'Reported'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 rounded-lg text-xs font-medium ${filter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{s}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          {filtered.sort((a, b) => { const o: Record<string, number> = { STAT: 0, Urgent: 1, Routine: 2 }; return (o[a.priority] ?? 3) - (o[b.priority] ?? 3); }).map(r => (
            <Card key={r.id} className={`p-3 cursor-pointer hover:shadow transition ${selected?.id === r.id ? 'ring-2 ring-blue-500' : ''} ${r.tests.some(t => t.flag === 'Critical') ? 'border-red-300' : ''}`} onClick={() => setSelected(selected?.id === r.id ? null : r)}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{r.patientName}</span>
                    <Badge tone={r.priority === 'STAT' ? 'red' : r.priority === 'Urgent' ? 'gold' : 'blue'}>{r.priority}</Badge>
                    <Badge tone={r.status === 'Reported' ? 'green' : 'blue'}>{r.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">{r.mrn} · {r.ward} · {r.sampleType}</p>
                  <p className="text-xs text-slate-400">{r.tests.map(t => t.name).join(', ')}</p>
                </div>
                {r.tests.some(t => t.flag === 'Critical') && <span className="text-red-600 font-bold">⚠️</span>}
              </div>
            </Card>
          ))}
        </div>

        {selected && (
          <Card className="p-6 h-fit sticky top-4">
            <h2 className="text-lg font-bold mb-2">{selected.patientName} — Lab Results</h2>
            <p className="text-xs text-slate-500 mb-4">{selected.mrn} · {selected.ward} · {selected.doctor} · {selected.sampleType}</p>

            <div className="space-y-3">
              {selected.tests.map((t, i) => (
                <div key={i} className={`p-3 rounded-lg ${t.flag === 'Critical' ? 'bg-red-50 border border-red-200' : t.flag === 'High' || t.flag === 'Low' ? 'bg-yellow-50' : 'bg-green-50'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{t.name}</span>
                    {t.flag && <Badge tone={t.flag === 'Critical' ? 'red' : t.flag === 'High' || t.flag === 'Low' ? 'gold' : 'green'}>{t.flag}</Badge>}
                  </div>
                  <p className="text-xl font-bold mt-1">{t.result}</p>
                  {t.referenceRange && <p className="text-xs text-slate-500">Reference: {t.referenceRange} {t.unit}</p>}
                </div>
              ))}
            </div>

            {selected.comments && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800">📝 Comments</p>
                <p className="text-sm text-blue-700 mt-1">{selected.comments}</p>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button onClick={() => {}} className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">✅ Verify</button>
              <button onClick={() => {}} className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">📄 PDF Report</button>
              <button onClick={() => {}} className="px-3 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700">🔔 Alert Doctor</button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
