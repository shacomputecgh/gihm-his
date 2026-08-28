import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface GeriPatient {
  id: string; name: string; age: number; gender: string; mrn: string;
  condition: string; frailtyScore: number; cognitiveScore: string;
  fallRisk: string; adlScore: number; medications: number;
  comorbidities: string[]; status: 'New' | 'Follow-up' | 'Post-Fall' | 'Stable' | 'Rehabilitation';
  doctor: string; followUp: string; notes: string;
}

const PATIENTS: GeriPatient[] = [
  { id: 'GERI-001', name: 'Kwame Asante', age: 82, gender: 'Male', mrn: 'MRN-2026-1070',
    condition: 'Dementia (Moderate) + Recurrent Falls', frailtyScore: 6, cognitiveScore: 'MMSE 16/30 (Moderate dementia)',
    fallRisk: 'High', adlScore: 3, medications: 12,
    comorbidities: ['Alzheimers Disease', 'Hypertension', 'Type 2 DM', 'Osteoporosis', 'BPH'],
    status: 'Post-Fall', doctor: 'Dr. Priscilla Wiafe', followUp: '2026-09-07 (2 weeks)',
    notes: 'Fall last week — hip X-ray normal. MCI progressing. Polypharmacy review needed. Carer burnout — social work referral.'
  },
  { id: 'GERI-002', name: 'Ama Serwaa', age: 78, gender: 'Female', mrn: 'MRN-2026-1072',
    condition: 'Frailty Syndrome + Chronic Pain', frailtyScore: 5, cognitiveScore: 'MMSE 25/30 (Mild cognitive impairment)',
    fallRisk: 'Moderate', adlScore: 6, medications: 9,
    comorbidities: ['Osteoarthritis', 'Hypertension', 'CKD Stage 3', 'Depression'],
    status: 'Follow-up', doctor: 'Dr. Priscilla Wiafe', followUp: '2026-11-24 (3 months)',
    notes: 'Frail but independent. Deprescribing review done — removed 2 unnecessary medications. Exercise programme started.'
  },
  { id: 'GERI-003', name: 'Kofi Mensah', age: 85, gender: 'Male', mrn: 'MRN-2026-1074',
    condition: 'Severe Dementia + Aspiration Pneumonia', frailtyScore: 8, cognitiveScore: 'MMSE 5/30 (Severe dementia)',
    fallRisk: 'Very High', adlScore: 1, medications: 15,
    comorbidities: ['Severe Alzheimers', 'Parkinsons Disease', 'Chronic Heart Failure', 'CKD Stage 4', 'Recurrent UTIs'],
    status: 'Stable', doctor: 'Dr. Priscilla Wiafe', followUp: '2026-09-14 (2 weeks)',
    notes: 'Dependent for all ADAs. Aspiration risk — thickened fluids. Tube feeding discussion with family. Comfort-focused care agreed.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'New': 'bg-blue-100 text-blue-800', 'Follow-up': 'bg-yellow-100 text-yellow-800',
  'Post-Fall': 'bg-red-100 text-red-800', 'Stable': 'bg-green-100 text-green-800',
  'Rehabilitation': 'bg-purple-100 text-purple-800',
};

function getFrailtyColor(score: number) {
  if (score <= 3) return 'text-green-600 bg-green-50';
  if (score <= 5) return 'text-yellow-600 bg-yellow-50';
  if (score <= 7) return 'text-orange-600 bg-orange-50';
  return 'text-red-600 bg-red-50';
}

export default function GeriatricMedicine() {
  const [selected, setSelected] = useState<GeriPatient | null>(PATIENTS[0] ?? null);
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
          title="Add New Geriatric Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Geriatric Medicine</h1><p className="text-gray-500">Frailty assessment, falls prevention, dementia management, polypharmacy review</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Patients', value: PATIENTS.length, color: 'text-blue-600' },
          { label: 'High Falls Risk', value: PATIENTS.filter(p=>p.fallRisk==='High'||p.fallRisk==='Very High').length, color: 'text-red-600' },
          { label: 'Polypharmacy (≥10)', value: PATIENTS.filter(p=>p.medications>=10).length, color: 'text-orange-600' },
          { label: 'Avg Frailty Score', value: (PATIENTS.reduce((s,p)=>s+p.frailtyScore,0)/PATIENTS.length).toFixed(1), color: 'text-yellow-600' },
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
                  <div className="text-xs text-gray-400 mt-1">{p.cognitiveScore}</div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold px-2 py-1 rounded ${getFrailtyColor(p.frailtyScore)}`}>Fried {p.frailtyScore}/9</div>
                  <div className={`text-xs font-medium ${p.fallRisk==='High'||p.fallRisk==='Very High'?'text-red-600':'text-yellow-600'}`}>Falls: {p.fallRisk}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-1">
          {selected && (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div><h2 className="font-bold text-lg">{selected.name}</h2><p className="text-sm text-gray-500">{selected.age}y {selected.gender} — {selected.mrn}</p><p className="text-sm text-blue-600">{selected.condition}</p></div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className={`rounded p-2 ${getFrailtyColor(selected.frailtyScore)}`}><div className="text-lg font-bold">{selected.frailtyScore}/9</div><div className="text-[10px]">Frailty Score</div></div>
                <div className={`rounded p-2 ${selected.fallRisk==='High'||selected.fallRisk==='Very High'?'bg-red-50 text-red-600':'bg-yellow-50 text-yellow-600'}`}><div className="text-lg font-bold">{selected.fallRisk}</div><div className="text-[10px]">Falls Risk</div></div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm"><div><span className="text-gray-500">Cognition:</span> {selected.cognitiveScore}</div><div><span className="text-gray-500">ADL Score:</span> {selected.adlScore}/10</div><div><span className="text-gray-500">Medications:</span> <span className={`font-bold ${selected.medications>=10?'text-red-600':'text-green-600'}`}>{selected.medications}</span></div></div>
              <div><div className="text-sm font-medium text-gray-600 mb-1">Comorbidities</div><div className="flex flex-col gap-1">{selected.comorbidities.map((c,i)=><Badge key={i} className="text-xs bg-orange-100 text-orange-800 w-fit">{c}</Badge>)}</div></div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3"><div className="text-sm font-medium text-yellow-700">⚠ Polypharmacy Alert</div><div className="text-xs text-yellow-600 mt-1">{selected.medications} active medications — consider deprescribing review</div></div>
              <div className="text-xs text-gray-400 italic">{selected.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
