import { useState } from 'react';
import { Badge } from '../../components/ui';

interface InfectionEvent {
  id: string; type: string; ward: string; dateIdentified: string;
  organism?: string; patientCount: number;
  status: 'Active' | 'Contained' | 'Resolved' | 'Investigating';
  source: string; actions: string;
}

const EVENTS: InfectionEvent[] = [
  { id: 'IC-001', type: 'CAUTI', ward: 'ICU', dateIdentified: '2026-08-20', organism: 'E. coli ESBL', patientCount: 2, status: 'Active', source: 'Urinary catheter', actions: 'Catheter review, hand hygiene reinforcement' },
  { id: 'IC-002', type: 'SSI', ward: 'Surgical Ward', dateIdentified: '2026-08-22', organism: 'Staph. aureus MSSA', patientCount: 1, status: 'Investigating', source: 'Post-cholecystectomy', actions: 'Wound swab taken, antibiotic review' },
  { id: 'IC-003', type: 'CDI', ward: 'Medical Ward A', dateIdentified: '2026-08-18', organism: 'C. difficile', patientCount: 3, status: 'Contained', source: 'Antibiotic use', actions: 'Contact precautions, cleaning audit, antibiotic review' },
  { id: 'IC-004', type: 'CLABSI', ward: 'ICU', dateIdentified: '2026-08-15', organism: 'Klebsiella pneumoniae', patientCount: 1, status: 'Resolved', source: 'Central line', actions: 'Line removed, CHG bathing protocol enforced' },
];

const TYPE_LABELS: Record<string, string> = { CAUTI: 'Catheter-Associated UTI', SSI: 'Surgical Site Infection', CDI: 'C. difficile Infection', CLABSI: 'Central Line-Associated BSI', VAP: 'Ventilator-Associated Pneumonia' };
const STATUS_COLORS: Record<string, string> = { Active: 'bg-red-100 text-red-800', Investigating: 'bg-yellow-100 text-yellow-800', Contained: 'bg-blue-100 text-blue-800', Resolved: 'bg-green-100 text-green-800' };

export default function InfectionControlDashboard() {
  const [records] = useState<InfectionEvent[]>(EVENTS);
  const [filter, setFilter] = useState('');
  const filtered = records.filter((r) => !filter || r.status === filter);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Infection Control Dashboard</h1><p className="text-gray-500">HAI surveillance, outbreak tracking, and compliance monitoring</p></div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-red-600">{records.filter((r) => r.status === 'Active').length}</div><div className="text-xs text-slate-500">Active Outbreaks</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-yellow-600">{records.filter((r) => r.status === 'Investigating').length}</div><div className="text-xs text-slate-500">Investigating</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-blue-600">{records.filter((r) => r.status === 'Contained').length}</div><div className="text-xs text-slate-500">Contained</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-green-600">{records.filter((r) => r.status === 'Resolved').length}</div><div className="text-xs text-slate-500">Resolved</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-slate-700">{records.reduce((s, r) => s + r.patientCount, 0)}</div><div className="text-xs text-slate-500">Total Patients</div></div>
      </div>
      <div className="flex gap-2">
        {['', 'Active', 'Investigating', 'Contained', 'Resolved'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full text-xs font-medium transition ${filter === f ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{f || 'All'}</button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map((e) => (
          <div key={e.id} className={`bg-white rounded-lg border p-4 hover:shadow-md transition ${e.status === 'Active' ? 'border-l-4 border-l-red-500' : ''}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2"><span className="font-mono text-xs text-slate-400">{e.id}</span><span className="font-semibold">{TYPE_LABELS[e.type] || e.type}</span><Badge className={STATUS_COLORS[e.status]}>{e.status}</Badge></div>
                <p className="text-sm text-slate-600 mt-1">Ward: {e.ward} · Patients: {e.patientCount} · Organism: {e.organism || 'Pending'}</p>
                <p className="text-xs text-slate-400 mt-1">Source: {e.source} · Identified: {e.dateIdentified}</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded p-2 mt-2 text-xs text-slate-600"><strong>Actions:</strong> {e.actions}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
