import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface RespRehabPatient {
  id: string; name: string; age: number; gender: string; mrn: string;
  condition: string; fev1: number; fvc: number; fev1fvc: number;
  sixMWT: number; borgScore: number; oxygenUse: string;
  status: 'Assessment' | 'Active Rehab' | 'Maintenance' | 'Completed';
  sessionsCompleted: number; totalSessions: number;
  doctor: string; followUp: string; notes: string;
}

const PATIENTS: RespRehabPatient[] = [
  { id: 'RR-001', name: 'Kwame Mensah', age: 67, gender: 'Male', mrn: 'MRN-2026-1200',
    condition: 'COPD (GOLD Stage III)', fev1: 38, fvc: 72, fev1fvc: 52,
    sixMWT: 280, borgScore: 5, oxygenUse: 'LTOT 2L/min',
    status: 'Active Rehab', sessionsCompleted: 10, totalSessions: 24,
    doctor: 'Dr. Priscilla Wiafe', followUp: '2026-08-28 (session 11)',
    notes: '6MWT improved from 220m to 280m. Breathing technique training. Energy conservation. Inhaler technique corrected. Smoking cessation ongoing.'
  },
  { id: 'RR-002', name: 'Akua Boateng', age: 55, gender: 'Female', mrn: 'MRN-2026-1202',
    condition: 'Post-COVID-19 Pulmonary Fibrosis', fev1: 65, fvc: 68, fev1fvc: 95,
    sixMWT: 350, borgScore: 3, oxygenUse: 'Ambulatory O2 on exertion',
    status: 'Active Rehab', sessionsCompleted: 14, totalSessions: 24,
    doctor: 'Dr. Priscilla Wiafe', followUp: '2026-08-28 (session 15)',
    notes: 'Post-COVID rehab. Functional capacity improving. Walking endurance up 30%. Oxygen weaned from continuous to exertion only. Cognitive fog improving.'
  },
  { id: 'RR-003', name: 'Kofi Asare', age: 72, gender: 'Male', mrn: 'MRN-2026-1204',
    condition: 'Bronchiectasis', fev1: 55, fvc: 80, fev1fvc: 68,
    sixMWT: 320, borgScore: 4, oxygenUse: 'None',
    status: 'Maintenance', sessionsCompleted: 24, totalSessions: 24,
    doctor: 'Dr. Priscilla Wiafe', followUp: '2026-11-24 (3 months)',
    notes: 'Completed rehabilitation programme. Self-management established. Airway clearance techniques mastered. Home exercise programme maintained. Quarterly reviews.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'Assessment': 'bg-blue-100 text-blue-800', 'Active Rehab': 'bg-yellow-100 text-yellow-800',
  'Maintenance': 'bg-green-100 text-green-800', 'Completed': 'bg-gray-100 text-gray-800',
};

export default function RespiratoryRehabilitation() {
  const [selected, setSelected] = useState<RespRehabPatient | null>(PATIENTS[0] ?? null);
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
          title="Add New Respiratory Rehab Record"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","required":true},{"name":"condition","label":"Condition","type":"select","options":["COPD","Post-TB","Pulmonary Fibrosis","Bronchiectasis","Post-COVID"]},{"name":"sessionType","label":"Session Type","type":"select","options":["Exercise","Education","Breathing Technique","Combined"]},{"name":"spo2Pre","label":"SpO2 Pre-Exercise","type":"number"},{"name":"spo2Post","label":"SpO2 Post-Exercise","type":"number"},{"name":"notes","label":"Notes","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Respiratory Rehabilitation</h1><p className="text-gray-500">Pulmonary rehabilitation, exercise tolerance, breathing techniques</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Patients', value: PATIENTS.length, color: 'text-blue-600' },
          { label: 'Active Rehab', value: PATIENTS.filter(p=>p.status==='Active Rehab').length, color: 'text-yellow-600' },
          { label: 'Avg 6MWT', value: `${Math.round(PATIENTS.reduce((s,p)=>s+p.sixMWT,0)/PATIENTS.length)}m`, color: 'text-green-600' },
          { label: 'On Oxygen', value: PATIENTS.filter(p=>p.oxygenUse.includes('O2')).length, color: 'text-red-600' },
        ].map((s,i) => <div key={i} className="bg-white rounded-lg border p-3 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {PATIENTS.map(p => (
            <div key={p.id} onClick={() => setSelected(p)} className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${selected?.id===p.id?'border-blue-500 shadow-md':''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2"><span className="font-bold">{p.name}</span><Badge className={`text-[10px] ${STATUS_STYLES[p.status]}`}>{p.status}</Badge></div>
                  <div className="text-sm text-gray-500">{p.condition}</div>
                  <div className="text-xs text-gray-400 mt-1">FEV1 {p.fev1}% | 6MWT {p.sixMWT}m | Borg {p.borgScore}/10</div>
                </div>
                <div className="text-right"><div className="text-lg font-bold text-blue-600">{p.sessionsCompleted}/{p.totalSessions}</div><div className="text-[10px] text-gray-400">Sessions</div></div>
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-1">
          {selected && (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div><h2 className="font-bold text-lg">{selected.name}</h2><p className="text-sm text-gray-500">{selected.age}y {selected.gender} — {selected.mrn}</p><p className="text-sm text-blue-600">{selected.condition}</p></div>
              <div className="bg-blue-50 rounded-lg p-3 text-center"><div className="text-3xl font-black text-blue-600">{selected.sixMWT}m</div><div className="text-xs text-blue-600">6-Minute Walk Test</div></div>
              <div><div className="text-sm font-medium text-gray-600 mb-1">Pulmonary Function</div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-gray-50 rounded p-2 text-center"><div className={`font-bold ${selected.fev1<50?'text-red-600':'text-green-600'}`}>{selected.fev1}%</div><div className="text-[10px]">FEV1</div></div>
                  <div className="bg-gray-50 rounded p-2 text-center"><div className="font-bold">{selected.fvc}%</div><div className="text-[10px]">FVC</div></div>
                  <div className="bg-gray-50 rounded p-2 text-center"><div className="font-bold">{selected.fev1fvc}%</div><div className="text-[10px]">FEV1/FVC</div></div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1"><div><span className="text-gray-500">Borg Score:</span> {selected.borgScore}/10</div><div><span className="text-gray-500">Oxygen:</span> {selected.oxygenUse}</div><div><span className="text-gray-500">Doctor:</span> {selected.doctor}</div></div>
              <div className="text-xs text-gray-400 italic">{selected.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
