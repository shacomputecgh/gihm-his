import { useState } from 'react';
import { Badge } from '../../components/ui';

interface Protocol { id: string; name: string; category: string; description: string; steps: string[]; lastUpdated: string; version: string; status: 'Active' | 'Under Review' | 'Expired'; }

const PROTOCOLS: Protocol[] = [
  { id: 'PR-001', name: 'Code Blue (Cardiac Arrest)', category: 'Emergency', description: 'Immediate response protocol for cardiac arrest', steps: ['Call Code Blue — announce location', 'Begin CPR immediately (30:2)', 'Retrieve crash cart and defibrillator', 'Attach AED — shock ifVF/pVT', 'Establish IV access', 'Administer Adrenaline 1mg IV every 3-5 min', 'Consider Amiodarone 300mg for refractory VF', 'Document time of arrest and interventions', 'Continuous monitoring until ROSC or termination', 'Debrief team after event'], lastUpdated: '2026-07-01', version: '3.2', status: 'Active' },
  { id: 'PR-002', name: 'Mass Casualty Incident (MCI)', category: 'Disaster', description: 'Hospital response to mass casualty events', steps: ['Activate Hospital Incident Command System (HICS)', 'Open additional triage areas', 'Recall off-duty staff', 'Cancel elective surgeries', 'Activate surge capacity protocols', 'Coordinate with EMS and national authority', 'Establish patient tracking system', 'Begin triage using START protocol'], lastUpdated: '2026-06-15', version: '2.1', status: 'Active' },
  { id: 'PR-003', name: 'Severe Trauma (Golden Hour)', category: 'Emergency', description: 'Critical trauma management within the first hour', steps: ['Primary survey (ABCDE)', 'Secure airway — intubate if GCS < 8', 'Control major haemorrhage', 'Two large-bore IVs + blood grouping', 'FAST scan for internal bleeding', 'Activate trauma team', 'CT scan if stable', 'Notify surgeon and anaesthetist', 'Transfer to theatre if surgical emergency'], lastUpdated: '2026-07-15', version: '2.0', status: 'Active' },
  { id: 'PR-004', name: 'Anaphylaxis Management', category: 'Emergency', description: 'Immediate management of severe allergic reactions', steps: ['Remove trigger if identifiable', 'Call for help', 'Adrenaline 0.5mg IM (1:1000) — lateral thigh', 'Position: supine with legs elevated (unless respiratory distress)', 'High-flow oxygen 15L/min via non-rebreather', 'IV fluid bolus 500ml Normal Saline', 'Chlorphenamine 10mg IV + Hydrocortisone 200mg IV', 'If no improvement: Adrenaline IV infusion', 'Observe minimum 6 hours'], lastUpdated: '2026-08-01', version: '1.5', status: 'Active' },
  { id: 'PR-005', name: 'Paediatric Emergency (Child)', category: 'Paediatric', description: 'Modified emergency protocols for children', steps: ['Assess using paediatric assessment triangle', 'Use Broselow tape for drug dosing', 'Start with 5 rescue breaths for cardiac arrest', 'CPR: 15:2 (single rescuer), 30:2 (two rescuers)', 'IO access if IV access fails in 90 seconds', 'Defibrillate: 2 J/kg first shock, 4 J/kg subsequent', 'Adrenaline: 10 mcg/kg IV/IO every 3-5 min'], lastUpdated: '2026-07-20', version: '2.0', status: 'Active' },
];

const CATEGORY_COLORS: Record<string, string> = { Emergency: 'bg-red-100 text-red-800', Disaster: 'bg-orange-100 text-orange-800', Paediatric: 'bg-blue-100 text-blue-800' };

export default function EmergencyProtocolManager() {
  const [protocols] = useState<Protocol[]>(PROTOCOLS);
  const [selected, setSelected] = useState<Protocol | null>(PROTOCOLS[0] ?? null);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Emergency Protocol Manager</h1><p className="text-gray-500">Code Blue, trauma, mass casualty, and emergency response protocols</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-red-600">{protocols.filter((p) => p.category === 'Emergency').length}</div><div className="text-xs text-slate-500">Emergency</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-orange-600">{protocols.filter((p) => p.category === 'Disaster').length}</div><div className="text-xs text-slate-500">Disaster</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-blue-600">{protocols.filter((p) => p.category === 'Paediatric').length}</div><div className="text-xs text-slate-500">Paediatric</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-green-600">{protocols.filter((p) => p.status === 'Active').length}</div><div className="text-xs text-slate-500">Active</div></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {protocols.map((p) => (
            <div key={p.id} onClick={() => setSelected(p)} className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${selected?.id === p.id ? 'ring-2 ring-red-500' : ''}`}>
              <div className="flex items-center justify-between mb-1"><Badge className={CATEGORY_COLORS[p.category]}>{p.category}</Badge><span className="text-[10px] text-slate-400">v{p.version}</span></div>
              <div className="font-semibold text-sm">{p.name}</div>
              <div className="text-xs text-slate-500 mt-1">{p.steps.length} steps · Updated {p.lastUpdated}</div>
            </div>
          ))}
        </div>
        {selected && (
          <div className="lg:col-span-2 bg-white rounded-lg border p-5 space-y-4 h-fit sticky top-4">
            <div className="flex items-center justify-between">
              <div><h3 className="text-lg font-bold">{selected.name}</h3><p className="text-sm text-gray-500">v{selected.version} · Last updated: {selected.lastUpdated}</p></div>
              <Badge className={selected.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>{selected.status}</Badge>
            </div>
            <p className="text-sm text-slate-600">{selected.description}</p>
            <div><h4 className="text-sm font-semibold mb-2">Protocol Steps ({selected.steps.length})</h4><ol className="space-y-2">{selected.steps.map((step, i) => <li key={i} className="flex gap-3 text-sm"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold">{i + 1}</span><span>{step}</span></li>)}</ol></div>
            <div className="flex gap-2"><button onClick={() => {}} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700">🚨 Activate Protocol</button><button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">🖨️ Print Protocol</button><button className="border px-4 py-2 rounded-lg text-sm font-medium">📧 Send to Team</button></div>
          </div>
        )}
      </div>
    </div>
  );
}
