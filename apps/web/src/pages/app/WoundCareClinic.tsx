import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface WoundPatient {
  id: string; name: string; age: number; gender: string; mrn: string;
  woundType: string; woundSite: string; woundSize: string;
  woundAge: string; woundBed: string; infection: string;
  exudate: string; painScore: number;
  status: 'New' | 'Active Treatment' | 'Healing' | 'Healed' | 'Referred';
  dressing: string; frequency: string; therapist: string; followUp: string; notes: string;
}

const PATIENTS: WoundPatient[] = [
  { id: 'WN-001', name: 'Kwame Mensah', age: 67, gender: 'Male', mrn: 'MRN-2026-1100',
    woundType: 'Diabetic Foot Ulcer', woundSite: 'Right plantar surface', woundSize: '4.5 x 3.2 x 0.8 cm',
    woundAge: '8 weeks', woundBed: '60% granulation, 40% slough', infection: 'Low — no signs of clinical infection',
    exudate: 'Moderate serous', painScore: 3,
    status: 'Active Treatment', dressing: 'Hydrofiber with silver', frequency: '3 times per week', therapist: 'Sr. Nana Agyei',
    followUp: '2026-08-28 (4 days)', notes: 'Offloading with total contact cast. HbA1c 9.2% — poor glycaemic control slowing healing. Vascular assessment needed.'
  },
  { id: 'WN-002', name: 'Ama Serwaa', age: 82, gender: 'Female', mrn: 'MRN-2026-1102',
    woundType: 'Pressure Ulcer Grade 3', woundSite: 'Sacrum', woundSize: '8.0 x 6.0 x 2.5 cm',
    woundAge: '3 weeks', woundBed: '40% granulation, 30% slough, 30% necrotic', infection: 'Moderate — malodour, elevated WCC',
    exudate: 'Heavy purulent', painScore: 6,
    status: 'Active Treatment', dressing: 'Medical grade honey + foam', frequency: 'Daily', therapist: 'Sr. Nana Agyei',
    followUp: '2026-08-25 (daily)', notes: 'IV antibiotics for wound infection. Repositioning Q2H. Nutrition review — albumin 28 g/L. Debridement planned.'
  },
  { id: 'WN-003', name: 'Kofi Asare', age: 45, gender: 'Male', mrn: 'MRN-2026-1104',
    woundType: 'Venous Leg Ulcer', woundSite: 'Left medial malleolus', woundSize: '6.0 x 4.5 x 0.3 cm',
    woundAge: '12 weeks', woundBed: '80% granulation', infection: 'Low',
    exudate: 'Moderate serous', painScore: 2,
    status: 'Healing', dressing: 'Foam + compression bandaging', frequency: '2 times per week', therapist: 'Sr. Nana Agyei',
    followUp: '2026-09-07 (2 weeks)', notes: 'Responding well to compression therapy. Granulation tissue healthy. Target compression 40mmHg. Venous duplex done.'
  },
  { id: 'WN-004', name: 'Efua Nyarko', age: 55, gender: 'Female', mrn: 'MRN-2026-1106',
    woundType: 'Surgical Wound Dehiscence', woundSite: 'Abdominal — midline', woundSize: '12.0 x 3.0 x 1.5 cm',
    woundAge: '10 days', woundBed: '90% granulation', infection: 'Low',
    exudate: 'Light serous', painScore: 4,
    status: 'Active Treatment', dressing: 'Negative pressure wound therapy (VAC)', frequency: '3 times per week', therapist: 'Sr. Nana Agyei',
    followUp: '2026-08-28 (4 days)', notes: 'Post-operative wound dehiscence. VAC therapy initiated. Nutritional support. Hernia clinic referral if not closing.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'New': 'bg-blue-100 text-blue-800', 'Active Treatment': 'bg-yellow-100 text-yellow-800',
  'Healing': 'bg-green-100 text-green-800', 'Healed': 'bg-gray-100 text-gray-800',
  'Referred': 'bg-purple-100 text-purple-800',
};

export default function WoundCareClinic() {
  const [selected, setSelected] = useState<WoundPatient | null>(PATIENTS[0] ?? null);
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
          title="Add New Wound Care Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Wound Care Clinic</h1><p className="text-gray-500">Chronic wound management, pressure ulcers, wound bed assessment, and dressing</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Patients', value: PATIENTS.length, color: 'text-blue-600' },
          { label: 'Infected', value: PATIENTS.filter(p=>p.infection.includes('Moderate')||p.infection.includes('High')).length, color: 'text-red-600' },
          { label: 'Healing', value: PATIENTS.filter(p=>p.status==='Healing').length, color: 'text-green-600' },
          { label: 'Avg Pain', value: (PATIENTS.reduce((s,p)=>s+p.painScore,0)/PATIENTS.length).toFixed(1), color: 'text-orange-600' },
        ].map((s,i) => <div key={i} className="bg-white rounded-lg border p-3 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {PATIENTS.map(p => (
            <div key={p.id} onClick={() => setSelected(p)} className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${selected?.id===p.id?'border-blue-500 shadow-md':''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2"><span className="font-bold">{p.name}</span><Badge className={`text-[10px] ${STATUS_STYLES[p.status]}`}>{p.status}</Badge></div>
                  <div className="text-sm text-gray-500">{p.woundType} — {p.woundSite}</div>
                  <div className="text-xs text-gray-400 mt-1">Size: {p.woundSize} | Age: {p.woundAge}</div>
                </div>
                <div className="text-right"><div className={`text-sm font-bold ${p.painScore>=5?'text-red-600':p.painScore>=3?'text-yellow-600':'text-green-600'}`}>Pain {p.painScore}/10</div></div>
              </div>
              <div className="mt-2 text-xs"><span className="text-gray-500">Wound bed:</span> {p.woundBed}</div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-1">
          {selected && (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div><h2 className="font-bold text-lg">{selected.name}</h2><p className="text-sm text-gray-500">{selected.age}y {selected.gender} — {selected.mrn}</p><p className="text-sm text-blue-600">{selected.woundType}</p></div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1"><div><span className="text-gray-500">Site:</span> {selected.woundSite}</div><div><span className="text-gray-500">Size:</span> {selected.woundSize}</div><div><span className="text-gray-500">Age:</span> {selected.woundAge}</div><div><span className="text-gray-500">Dressing:</span> {selected.dressing}</div><div><span className="text-gray-500">Frequency:</span> {selected.frequency}</div></div>
              <div><div className="text-sm font-medium text-gray-600 mb-1">Wound Bed</div><div className="bg-blue-50 rounded p-2 text-xs">{selected.woundBed}</div></div>
              <div><div className="text-sm font-medium text-gray-600 mb-1">Infection Status</div><div className={`text-sm font-medium ${selected.infection.includes('Moderate')||selected.infection.includes('High')?'text-red-600':'text-green-600'}`}>{selected.infection}</div></div>
              <div className="flex gap-4 text-sm"><div><span className="text-gray-500">Exudate:</span> {selected.exudate}</div><div className={`font-bold ${selected.painScore>=5?'text-red-600':'text-gray-600'}`}>Pain: {selected.painScore}/10</div></div>
              <div className="text-xs text-gray-400 italic">{selected.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
