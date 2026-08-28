import { useState } from 'react';
import { Button, Card, useToast } from '../../components/ui';

interface ClinicalPathway {
  id: string; name: string; condition: string; department: string;
  version: string; lastUpdated: string; status: 'Active' | 'Draft' | 'Under Review' | 'Retired';
  adherenceRate: number; totalPatients: number;
  steps: { step: string; duration: string; responsible: string }[];
}

const INITIAL: ClinicalPathway[] = [
  { id: 'CP-001', name: 'Acute Myocardial Infarction', condition: 'STEMI', department: 'Emergency/Cardiology', version: '3.2', lastUpdated: '2026-07-15', status: 'Active', adherenceRate: 87, totalPatients: 45,
    steps: [{ step: 'ECG within 10 minutes', duration: '0-10 min', responsible: 'ED Nurse' }, { step: 'Aspirin 300mg + Clopidogrel 300mg', duration: '0-15 min', responsible: 'ED Doctor' }, { step: 'Activate cath lab', duration: '10-20 min', responsible: 'Cardiology' }, { step: 'Primary PCI or Thrombolysis', duration: '<90 min door-to-balloon', responsible: 'Interventional Cardiology' }] },
  { id: 'CP-002', name: 'Diabetic Ketoacidosis', condition: 'DKA', department: 'Emergency/Medical', version: '2.1', lastUpdated: '2026-06-20', status: 'Active', adherenceRate: 92, totalPatients: 28,
    steps: [{ step: 'IV access + Bloods (glucose, ketones, gas, electrolytes)', duration: '0-15 min', responsible: 'ED Team' }, { step: 'Insulin infusion 0.1 U/kg/hr', duration: '0-30 min', responsible: 'Medical Team' }, { step: 'Fluid resuscitation 0.9% NaCl', duration: '0-60 min', responsible: 'Nursing' }, { step: 'Potassium replacement if K+ < 5.5', duration: 'Ongoing', responsible: 'Medical Team' }] },
  { id: 'CP-003', name: 'Stroke Protocol', condition: 'Acute Ischaemic Stroke', department: 'Emergency/Neurology', version: '4.0', lastUpdated: '2026-08-01', status: 'Active', adherenceRate: 78, totalPatients: 35,
    steps: [{ step: 'FAST assessment + CT Head', duration: '<25 min', responsible: 'ED Team' }, { step: 'NIHSS scoring', duration: '<30 min', responsible: 'Neurology' }, { step: 'Thrombolysis decision (tPA within 4.5h)', duration: '<45 min', responsible: 'Stroke Team' }, { step: 'Admit to Stroke Unit', duration: '<60 min', responsible: 'Nursing' }] },
  { id: 'CP-004', name: 'Sepsis Bundle', condition: 'Sepsis / Septic Shock', department: 'Emergency/ICU', version: '2.0', lastUpdated: '2026-05-10', status: 'Under Review', adherenceRate: 65, totalPatients: 62,
    steps: [{ step: 'Lactate level + Blood cultures', duration: '0-30 min', responsible: 'ED Team' }, { step: 'Broad-spectrum antibiotics', duration: '<60 min', responsible: 'ED/ICU' }, { step: '30 mL/kg crystalloid if hypotensive', duration: '0-60 min', responsible: 'Nursing' }, { step: 'Vasopressors if MAP < 65 after fluids', duration: '1-3 hours', responsible: 'ICU' }] },
];

const STATUS_COLORS: Record<string, string> = { Active: 'bg-green-100 text-green-800', Draft: 'bg-gray-100 text-gray-800', 'Under Review': 'bg-yellow-100 text-yellow-800', Retired: 'bg-red-100 text-red-800' };

export default function ClinicalPathways() {
  const [pathways] = useState<ClinicalPathway[]>(INITIAL);
  const [selected, setSelected] = useState<ClinicalPathway | null>(INITIAL[0] ?? null);
  const [filter] = useState('');
  const toast = useToast();
  const filtered = pathways.filter((p) => !filter || p.status === filter);
  const avgAdherence = Math.round(pathways.reduce((s, p) => s + p.adherenceRate, 0) / pathways.length);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Clinical Pathways</h1><p className="text-gray-500">Standardised care protocols, adherence tracking, and deviation reporting</p></div>
        <Button onClick={() => toast('New pathway form coming soon')}>+ New Pathway</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 text-center"><div className="text-xl font-bold text-blue-600">{pathways.length}</div><div className="text-xs text-gray-500">Total Pathways</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-green-600">{pathways.filter((p) => p.status === 'Active').length}</div><div className="text-xs text-gray-500">Active</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-orange-600">{avgAdherence}%</div><div className="text-xs text-gray-500">Avg Adherence</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-red-600">{pathways.filter((p) => p.adherenceRate < 80).length}</div><div className="text-xs text-gray-500">Below Target</div></Card>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-700">Pathways</h3>
          {filtered.map((p) => (
            <button key={p.id} onClick={() => setSelected(p)} className={`w-full text-left p-3 rounded-lg border transition ${selected?.id === p.id ? 'ring-2 ring-blue-500 border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
              <div className="font-medium text-sm">{p.name}</div>
              <div className="text-xs text-gray-500">{p.condition} · {p.department}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                <span className={`text-xs font-bold ${p.adherenceRate >= 80 ? 'text-green-600' : p.adherenceRate >= 60 ? 'text-orange-600' : 'text-red-600'}`}>{p.adherenceRate}%</span>
              </div>
            </button>
          ))}
        </div>
        {selected && (
          <div className="md:col-span-2">
            <Card className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div><h3 className="font-bold text-lg">{selected.name}</h3><p className="text-sm text-gray-500">{selected.condition} · {selected.department} · v{selected.version} · Updated {selected.lastUpdated}</p></div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${selected.adherenceRate >= 80 ? 'text-green-600' : 'text-red-600'}`}>{selected.adherenceRate}%</div>
                  <div className="text-xs text-gray-500">{selected.totalPatients} patients</div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-1 mb-4">
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden"><div className={`h-3 rounded-full ${selected.adherenceRate >= 80 ? 'bg-green-500' : selected.adherenceRate >= 60 ? 'bg-orange-500' : 'bg-red-500'}`} style={{ width: `${selected.adherenceRate}%` }} /></div>
              </div>
              <h4 className="font-semibold mb-3">Protocol Steps</h4>
              <div className="space-y-2">
                {selected.steps.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-lg border">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold flex-shrink-0">{i + 1}</div>
                    <div><div className="font-medium text-sm">{s.step}</div><div className="text-xs text-gray-500">⏱ {s.duration} · 👤 {s.responsible}</div></div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
