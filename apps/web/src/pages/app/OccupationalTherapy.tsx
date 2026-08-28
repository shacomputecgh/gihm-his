import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface OTPatient {
  id: string; name: string; age: number; gender: string; mrn: string;
  condition: string; functionalGoal: string; barthelIndex: number;
  adlScores: { dressing: number; bathing: number; feeding: number; transfers: number; mobility: number };
  status: 'Assessment' | 'Active Therapy' | 'Discharged' | 'Review';
  sessions: number; totalPlanned: number; therapist: string; followUp: string; notes: string;
}

const PATIENTS: OTPatient[] = [
  { id: 'OT-001', name: 'Kwame Mensah', age: 67, gender: 'Male', mrn: 'MRN-2026-1090',
    condition: 'Post-Stroke Right Hemiplegia', functionalGoal: 'Independence in ADLs. Return home.',
    barthelIndex: 35, adlScores: { dressing: 2, bathing: 1, feeding: 4, transfers: 2, mobility: 2 },
    status: 'Active Therapy', sessions: 15, totalPlanned: 30, therapist: 'Sr. Esi Amoako',
    followUp: '2026-09-07 (2 weeks)', notes: 'Progressing well. Using one-handed techniques. Home assessment arranged. Wheelchair → walking frame progression.'
  },
  { id: 'OT-002', name: 'Akua Boateng', age: 55, gender: 'Female', mrn: 'MRN-2026-1092',
    condition: 'Bilateral Upper Limb Fracture — Post ORIF', functionalGoal: 'Full upper limb function. Return to work.',
    barthelIndex: 75, adlScores: { dressing: 4, bathing: 3, feeding: 5, transfers: 5, mobility: 4 },
    status: 'Active Therapy', sessions: 8, totalPlanned: 16, therapist: 'Sr. Esi Amoako',
    followUp: '2026-09-14 (3 weeks)', notes: 'Grip strength improving. Splint weaning. Work simulation exercises. Driving assessment pending.'
  },
  { id: 'OT-003', name: 'Kofi Asare', age: 72, gender: 'Male', mrn: 'MRN-2026-1094',
    condition: 'Parkinsons Disease — Functional Decline', functionalGoal: 'Maintain independence. Prevent falls.',
    barthelIndex: 60, adlScores: { dressing: 3, bathing: 3, feeding: 4, transfers: 3, mobility: 3 },
    status: 'Review', sessions: 10, totalPlanned: 20, therapist: 'Sr. Esi Amoako',
    followUp: '2026-11-24 (3 months)', notes: 'Home modifications done. Assistive devices provided. Caregiver training ongoing. Energy conservation techniques taught.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'Assessment': 'bg-blue-100 text-blue-800', 'Active Therapy': 'bg-green-100 text-green-800',
  'Discharged': 'bg-gray-100 text-gray-800', 'Review': 'bg-yellow-100 text-yellow-800',
};

function getBarthelColor(score: number) {
  if (score >= 80) return 'text-green-600 bg-green-50';
  if (score >= 50) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
}

export default function OccupationalTherapy() {
  const [selected, setSelected] = useState<OTPatient | null>(PATIENTS[0] ?? null);
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
          title="Add New OT Session"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","required":true},{"name":"condition","label":"Condition","type":"select","options":["Stroke","TBI","Spinal Cord Injury","Amputation","Fracture","Paediatric","Geriatric","Other"]},{"name":"goal","label":"Treatment Goal","type":"text"},{"name":"notes","label":"Session Notes","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Occupational Therapy</h1><p className="text-gray-500">Functional rehabilitation, ADL training, splinting, and assistive devices</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Patients', value: PATIENTS.length, color: 'text-blue-600' },
          { label: 'Active Therapy', value: PATIENTS.filter(p=>p.status==='Active Therapy').length, color: 'text-green-600' },
          { label: 'Low Barthel (<50)', value: PATIENTS.filter(p=>p.barthelIndex<50).length, color: 'text-red-600' },
          { label: 'Avg Barthel', value: Math.round(PATIENTS.reduce((s,p)=>s+p.barthelIndex,0)/PATIENTS.length).toString(), color: 'text-purple-600' },
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
                  <div className="text-xs text-gray-400 mt-1">Goal: {p.functionalGoal}</div>
                </div>
                <div className={`text-right rounded-lg px-3 py-2 ${getBarthelColor(p.barthelIndex)}`}><div className="text-2xl font-black">{p.barthelIndex}</div><div className="text-[10px]">Barthel Index</div></div>
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-1">
          {selected && (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div><h2 className="font-bold text-lg">{selected.name}</h2><p className="text-sm text-gray-500">{selected.age}y {selected.gender} — {selected.mrn}</p><p className="text-sm text-blue-600">{selected.condition}</p></div>
              <div className={`rounded-lg p-3 text-center ${getBarthelColor(selected.barthelIndex)}`}><div className="text-4xl font-black">{selected.barthelIndex}/100</div><div className="text-xs">Barthel Index</div></div>
              <div><div className="text-sm font-medium text-gray-600 mb-1">ADL Breakdown</div>
                {Object.entries(selected.adlScores).map(([k,v])=>(
                  <div key={k} className="flex items-center justify-between text-sm py-1 border-b"><span className="capitalize">{k}</span><div className="flex gap-1">{Array.from({length:5}).map((_,i)=><div key={i} className={`w-3 h-3 rounded ${i<v?'bg-green-500':'bg-gray-200'}`}/>)}</div></div>
                ))}
              </div>
              <div><div className="text-sm font-medium text-gray-600 mb-1">Goal</div><div className="text-sm bg-purple-50 rounded p-2">{selected.functionalGoal}</div></div>
              <div className="text-xs text-gray-400 italic">{selected.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
