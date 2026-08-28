import { useState } from 'react';
import { Badge } from '../../components/ui';

interface MedSafety { id: string; type: 'ADR' | 'Medication Error' | 'Near Miss'; patientName: string; drug: string; description: string; severity: 'Mild' | 'Moderate' | 'Severe' | 'Life-threatening'; status: 'Reported' | 'Investigating' | 'Resolved' | 'Closed'; reportedBy: string; date: string; }

const EVENTS: MedSafety[] = [
  { id: 'MS-001', type: 'ADR', patientName: 'Kwame Asante', drug: 'Amoxicillin', description: 'Anaphylactic reaction — urticaria, bronchospasm within 30 mins of first dose', severity: 'Life-threatening', status: 'Investigating', reportedBy: 'Dr. Sarah Johnson', date: '2026-08-23 09:00' },
  { id: 'MS-002', type: 'Medication Error', patientName: 'Akua Mensah', drug: 'Metformin 850mg', description: 'Wrong dose dispensed — 850mg given instead of 500mg. Error at pharmacy dispensing.', severity: 'Moderate', status: 'Reported', reportedBy: 'Pharmacist Esi Darko', date: '2026-08-22 14:30' },
  { id: 'MS-003', type: 'Near Miss', patientName: 'Nana Osei', drug: 'Potassium Chloride', description: 'IV KCl prepared without dilution — caught during double-check before administration', severity: 'Severe', status: 'Resolved', reportedBy: 'Nurse Kofi Mensah', date: '2026-08-22 11:00' },
  { id: 'MS-004', type: 'ADR', patientName: 'Efua Nyarko', drug: 'Omeprazole', description: 'Mild nausea and headache — dose adjustment made', severity: 'Mild', status: 'Closed', reportedBy: 'Dr. Kofi Appiah', date: '2026-08-21 16:00' },
];

const SEVERITY_COLORS: Record<string, string> = { Mild: 'bg-green-100 text-green-800', Moderate: 'bg-yellow-100 text-yellow-800', Severe: 'bg-orange-100 text-orange-800', 'Life-threatening': 'bg-red-100 text-red-800' };
const TYPE_COLORS: Record<string, string> = { ADR: 'bg-purple-100 text-purple-800', 'Medication Error': 'bg-red-100 text-red-800', 'Near Miss': 'bg-blue-100 text-blue-800' };

export default function MedicationSafety() {
  const [events] = useState<MedSafety[]>(EVENTS);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Medication Safety</h1><p className="text-gray-500">Adverse drug reactions, medication errors, and near-miss reporting</p></div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">{showForm ? '✕ Cancel' : '+ Report Event'}</button>
      </div>
      {showForm && (
        <div className="bg-white rounded-lg border-2 border-green-200 p-5 space-y-3 shadow-lg">
          <h3 className="font-bold text-green-800 text-lg">Report Medication Safety Event</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Event Type *</label><select className="w-full border rounded-lg px-3 py-2 text-sm"><option>Adverse Drug Reaction (ADR)</option><option>Medication Error</option><option>Near Miss</option></select></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Patient Name *</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Drug Involved *</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Severity *</label><select className="w-full border rounded-lg px-3 py-2 text-sm"><option>Mild</option><option>Moderate</option><option>Severe</option><option>Life-threatening</option></select></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Reported By *</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Your name" /></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Description *</label><textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} placeholder="Describe the event in detail..." /></div>
          <div className="flex gap-2"><button className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 shadow">Submit Report</button><button onClick={() => setShowForm(false)} className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">Cancel</button></div>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {['ADR', 'Medication Error', 'Near Miss'].map((t) => <div key={t} className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold">{events.filter((e) => e.type === t).length}</div><div className="text-xs text-slate-500">{t}</div></div>)}
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-red-600">{events.filter((e) => e.severity === 'Life-threatening' || e.severity === 'Severe').length}</div><div className="text-xs text-slate-500">Severe+</div></div>
      </div>
      <div className="space-y-3">
        {events.map((e) => (
          <div key={e.id} className={`bg-white rounded-lg border p-4 hover:shadow-md transition ${e.severity === 'Life-threatening' ? 'border-l-4 border-l-red-500' : ''}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-slate-400">{e.id}</span>
                <Badge className={TYPE_COLORS[e.type]}>{e.type}</Badge>
                <Badge className={SEVERITY_COLORS[e.severity]}>{e.severity}</Badge>
              </div>
              <Badge className={e.status === 'Resolved' || e.status === 'Closed' ? 'bg-green-100 text-green-800' : e.status === 'Investigating' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}>{e.status}</Badge>
            </div>
            <div className="text-sm"><strong>{e.drug}</strong> — {e.patientName}</div>
            <p className="text-xs text-slate-600 mt-1">{e.description}</p>
            <div className="text-[10px] text-slate-400 mt-2">Reported by {e.reportedBy} · {e.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
