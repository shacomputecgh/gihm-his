import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface SportsPatient {
  id: string; name: string; age: number; gender: string; mrn: string;
  sport: string; injury: string; mechanism: string; grade: string;
  treatmentPlan: string; returnToPlay: string;
  status: 'Acute Injury' | 'Rehabilitation' | 'Cleared' | 'Concussion Protocol';
  concussionStep?: number; totalConcussionSteps?: number;
  doctor: string; followUp: string; notes: string;
}

const PATIENTS: SportsPatient[] = [
  { id: 'SP-001', name: 'Kwame Mensah', age: 22, gender: 'Male', mrn: 'MRN-2026-1170',
    sport: 'Football', injury: 'ACL Rupture — Left Knee', mechanism: 'Non-contact pivoting injury during match',
    grade: 'Grade III', treatmentPlan: 'ACL reconstruction (hamstring autograft) — scheduled in 3 weeks after swelling reduction',
    returnToPlay: '9-12 months post-surgery', status: 'Rehabilitation',
    doctor: 'Dr. Akua Mensah', followUp: '2026-09-07 (2 weeks)',
    notes: 'MRI confirmed complete ACL rupture. Pre-hab strengthening programme. MENS score 62%. Surgery scheduled. Pre-operative education completed.'
  },
  { id: 'SP-002', name: 'Akua Boateng', age: 19, gender: 'Female', mrn: 'MRN-2026-1172',
    sport: 'Basketball', injury: 'Concussion (Grade 2)', mechanism: 'Head collision with opponent during game',
    grade: 'Grade 2', treatmentPlan: 'Graduated return-to-play protocol per SCAT6 guidelines',
    returnToPlay: '14-21 days (if symptom-free)', status: 'Concussion Protocol',
    concussionStep: 2, totalConcussionSteps: 6,
    doctor: 'Dr. Akua Mensah', followUp: '2026-08-26 (step 3 assessment)',
    notes: 'SCAT6 completed — baseline comparison. Currently on Step 2 (light aerobic exercise). No headache, dizziness. Next: sport-specific exercise.'
  },
  { id: 'SP-003', name: 'Kofi Asare', age: 28, gender: 'Male', mrn: 'MRN-2026-1174',
    sport: 'Running', injury: 'Plantar Fasciitis — Bilateral', mechanism: 'Overuse — sudden increase in training volume',
    grade: 'Chronic', treatmentPlan: 'Rest, stretching programme, orthotics, shockwave therapy, gradual return to running',
    returnToPlay: '6-8 weeks', status: 'Rehabilitation',
    doctor: 'Dr. Akua Mensah', followUp: '2026-09-07 (2 weeks)',
    notes: 'Training volume increased 40% in 2 weeks — classic overuse. Shockwave therapy session 1/3 completed. Running gait analysis done.'
  },
  { id: 'SP-004', name: 'Efua Nyarko', age: 16, gender: 'Female', mrn: 'MRN-2026-1176',
    sport: 'Swimming', injury: 'Shoulder Impingement (Swimmer\'s Shoulder)', mechanism: 'Overuse — high training volume, poor technique',
    grade: 'Grade 2', treatmentPlan: 'Rest, physiotherapy, rotator cuff strengthening, stroke technique correction',
    returnToPlay: '4-6 weeks', status: 'Acute Injury',
    doctor: 'Dr. Akua Mensah', followUp: '2026-09-14 (3 weeks)',
    notes: 'Supraspinatus tendinopathy with subacromial bursitis. Training load reduced. Swim coach referral for technique correction. Ice and NSAIDs.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'Acute Injury': 'bg-red-100 text-red-800', 'Rehabilitation': 'bg-yellow-100 text-yellow-800',
  'Cleared': 'bg-green-100 text-green-800', 'Concussion Protocol': 'bg-purple-100 text-purple-800',
};

const CONCUSSION_STEPS = ['Complete rest', 'Light aerobic exercise', 'Sport-specific exercise', 'Non-contact training drills', 'Full contact practice (medical clearance)', 'Return to competition'];

export default function SportsMedicine() {
  const [selected, setSelected] = useState<SportsPatient | null>(PATIENTS[0] ?? null);
  const concussionCount = PATIENTS.filter(p => p.status === 'Concussion Protocol').length;
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
          title="Add New Sports Medicine Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Sports Medicine</h1><p className="text-gray-500">Athletic injuries, rehabilitation, return-to-play, and concussion protocol</p></div>
      {concussionCount>0 && <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center gap-2"><span className="text-purple-600 text-xl">🧠</span><div><div className="font-semibold text-purple-800">{concussionCount} Active Concussion Protocol</div><div className="text-sm text-purple-600">Following graduated return-to-play per SCAT6 guidelines</div></div></div>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Athletes', value: PATIENTS.length, color: 'text-blue-600' },
          { label: 'Rehabilitating', value: PATIENTS.filter(p=>p.status==='Rehabilitation').length, color: 'text-yellow-600' },
          { label: 'Concussion', value: concussionCount, color: 'text-purple-600' },
          { label: 'Sports', value: new Set(PATIENTS.map(p=>p.sport)).size, color: 'text-green-600' },
        ].map((s,i) => <div key={i} className="bg-white rounded-lg border p-3 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {PATIENTS.map(p => (
            <div key={p.id} onClick={() => setSelected(p)} className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${selected?.id===p.id?'border-blue-500 shadow-md':''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2"><span className="font-bold">{p.name}</span><Badge className={`text-[10px] ${STATUS_STYLES[p.status]}`}>{p.status}</Badge><Badge className="text-[10px] bg-sky-100 text-sky-700">{p.sport}</Badge></div>
                  <div className="text-sm text-gray-500">{p.injury}</div>
                  <div className="text-xs text-gray-400 mt-1">{p.mechanism}</div>
                </div>
                <div className="text-right"><div className="text-xs text-gray-400">Grade</div><div className="text-sm font-bold">{p.grade}</div></div>
              </div>
              {p.status==='Concussion Protocol' && p.concussionStep && <div className="mt-3"><div className="flex items-center justify-between text-xs text-gray-500 mb-1"><span>Concussion Step {p.concussionStep}/{p.totalConcussionSteps}</span><span>{CONCUSSION_STEPS[p.concussionStep-1]}</span></div><div className="flex gap-1">{Array.from({length:p.totalConcussionSteps!}).map((_,i)=><div key={i} className={`flex-1 h-2 rounded ${i<p.concussionStep!?'bg-purple-500':'bg-gray-200'}`}/>)}</div></div>}
            </div>
          ))}
        </div>
        <div className="lg:col-span-1">
          {selected && (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div><h2 className="font-bold text-lg">{selected.name}</h2><p className="text-sm text-gray-500">{selected.age}y {selected.gender} — {selected.mrn}</p><p className="text-sm text-blue-600">{selected.sport} — {selected.injury}</p></div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1"><div><span className="text-gray-500">Mechanism:</span> {selected.mechanism}</div><div><span className="text-gray-500">Grade:</span> {selected.grade}</div><div><span className="text-gray-500">Doctor:</span> {selected.doctor}</div><div><span className="text-gray-500">Follow-up:</span> {selected.followUp}</div></div>
              {selected.status==='Concussion Protocol' && selected.concussionStep && <div><div className="text-sm font-medium text-gray-600 mb-2">SCAT6 Concussion Protocol — Step {selected.concussionStep}</div>{CONCUSSION_STEPS.map((step,i)=>(<div key={i} className={`flex items-center gap-2 text-sm p-2 rounded mb-1 ${i<selected.concussionStep!-1?'bg-green-50 line-through':i===selected.concussionStep!-1?'bg-purple-50 font-bold':'bg-gray-50'}`}><span>{i<selected.concussionStep!-1?'✅':i===selected.concussionStep!-1?'▶️':'○'}</span> {step}</div>))}</div>}
              <div><div className="text-sm font-medium text-gray-600 mb-1">Treatment Plan</div><div className="bg-blue-50 rounded p-2 text-sm">{selected.treatmentPlan}</div></div>
              <div className="bg-yellow-50 rounded-lg p-3"><div className="text-sm font-medium text-yellow-700">🗓️ Expected Return to Play</div><div className="text-sm text-yellow-600">{selected.returnToPlay}</div></div>
              <div className="text-xs text-gray-400 italic">{selected.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
