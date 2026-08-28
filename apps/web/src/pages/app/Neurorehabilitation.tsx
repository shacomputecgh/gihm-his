import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface NeuroRehabPatient {
  id: string; name: string; age: number; gender: string; mrn: string;
  condition: string; motorScore: number; cognitiveScore: number;
  barthelIndex: number; sessionsCompleted: number; totalSessions: number;
  goals: string[]; status: 'Assessment' | 'Active Rehab' | 'Plateau' | 'Discharged';
  therapist: string; followUp: string; notes: string;
}

const PATIENTS: NeuroRehabPatient[] = [
  { id: 'NR-001', name: 'Kwame Mensah', age: 67, gender: 'Male', mrn: 'MRN-2026-1210',
    condition: 'Post-Stroke Right MCA Infarct', motorScore: 32, cognitiveScore: 18,
    barthelIndex: 35, sessionsCompleted: 15, totalSessions: 40,
    goals: ['Walk independently with frame', 'Dress upper body independently', 'Return home with support'],
    status: 'Active Rehab', therapist: 'Sr. Esi Amoako', followUp: '2026-08-28 (session 16)',
    notes: 'Motor function improving. Right arm 2/5 → 3/5. Right leg 3/5 → 4/5. Sitting balance good. Standing tolerance 5 min. ST for aphasia ongoing.'
  },
  { id: 'NR-002', name: 'Akua Boateng', age: 35, gender: 'Female', mrn: 'MRN-2026-1212',
    condition: 'Traumatic Brain Injury (Moderate-Severe)', motorScore: 42, cognitiveScore: 15,
    barthelIndex: 50, sessionsCompleted: 20, totalSessions: 50,
    goals: ['Improve memory and attention', 'Return to part-time work', 'Independent community mobility'],
    status: 'Active Rehab', therapist: 'Sr. Esi Amoako', followUp: '2026-08-28 (session 21)',
    notes: 'GCS improved from 8 to 15. Memory improving — neuropsych scores rising. Driving assessment pending. Family coping strategies discussed.'
  },
  { id: 'NR-003', name: 'Kofi Asare', age: 52, gender: 'Male', mrn: 'MRN-2026-1214',
    condition: 'Spinal Cord Injury (Incomplete C5-C6)', motorScore: 28, cognitiveScore: 22,
    barthelIndex: 25, sessionsCompleted: 30, totalSessions: 50,
    goals: ['Maximise upper limb function', 'Wheelchair skills', 'Bladder management'],
    status: 'Active Rehab', therapist: 'Sr. Esi Amoako', followUp: '2026-08-28 (session 31)',
    notes: 'Incomplete SCI — some lower limb function returning. Upper limb strength improving. Wheelchair skills progressing. Standing frame programme started.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'Assessment': 'bg-blue-100 text-blue-800', 'Active Rehab': 'bg-yellow-100 text-yellow-800',
  'Plateau': 'bg-orange-100 text-orange-800', 'Discharged': 'bg-green-100 text-green-800',
};

export default function Neurorehabilitation() {
  const [selected, setSelected] = useState<NeuroRehabPatient | null>(PATIENTS[0] ?? null);
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
          title="Add New Neuro Rehab Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Neurorehabilitation</h1><p className="text-gray-500">Post-stroke rehabilitation, brain injury recovery, spinal cord injury management</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Patients', value: PATIENTS.length, color: 'text-blue-600' },
          { label: 'Active Rehab', value: PATIENTS.filter(p=>p.status==='Active Rehab').length, color: 'text-yellow-600' },
          { label: 'Avg Barthel', value: Math.round(PATIENTS.reduce((s,p)=>s+p.barthelIndex,0)/PATIENTS.length).toString(), color: 'text-purple-600' },
          { label: 'Total Sessions', value: PATIENTS.reduce((s,p)=>s+p.sessionsCompleted,0), color: 'text-green-600' },
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
                  <div className="text-xs text-gray-400 mt-1">Motor: {p.motorScore}/50 | Cognition: {p.cognitiveScore}/30 | Barthel: {p.barthelIndex}/100</div>
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
              <div className="bg-blue-50 rounded-lg p-3 text-center"><div className="text-3xl font-black text-blue-600">{selected.sessionsCompleted}/{selected.totalSessions}</div><div className="text-xs text-blue-600">Sessions ({Math.round((selected.sessionsCompleted/selected.totalSessions)*100)}%)</div></div>
              <div><div className="text-sm font-medium text-gray-600 mb-1">Functional Scores</div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-gray-50 rounded p-2 text-center"><div className="font-bold">{selected.motorScore}/50</div><div className="text-[10px]">Motor</div></div>
                  <div className="bg-gray-50 rounded p-2 text-center"><div className="font-bold">{selected.cognitiveScore}/30</div><div className="text-[10px]">Cognitive</div></div>
                  <div className={`bg-gray-50 rounded p-2 text-center ${selected.barthelIndex<50?'text-red-600':'text-green-600'}`}><div className="font-bold">{selected.barthelIndex}/100</div><div className="text-[10px]">Barthel</div></div>
                </div>
              </div>
              <div><div className="text-sm font-medium text-gray-600 mb-1">Rehabilitation Goals</div>{selected.goals.map((g,i)=><div key={i} className="text-xs flex items-center gap-1 mb-1"><span className="text-green-500">🎯</span> {g}</div>)}</div>
              <div className="text-xs text-gray-400 italic">{selected.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
