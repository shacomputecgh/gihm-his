import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface PalliativePatient {
  id: string; name: string; age: number; gender: string; mrn: string;
  condition: string; prognosis: string; symptomBurden: string;
  painScore: number; symptoms: string[];
  advanceDirectives: string; familyContact: string;
  careGoals: string[]; status: 'Active' | 'Comfort Care' | 'Pre-Bereavement' | 'Discharged';
  medications: string[]; doctor: string; followUp: string; notes: string;
}

const PATIENTS: PalliativePatient[] = [
  { id: 'PAL-001', name: 'Kwame Mensah', age: 67, gender: 'Male', mrn: 'MRN-2026-1050',
    condition: 'Metastatic Lung Cancer — End Stage', prognosis: 'Weeks to months', symptomBurden: 'Severe',
    painScore: 6, symptoms: ['Dyspnoea', 'Cough', 'Anorexia', 'Fatigue', 'Anxiety'],
    advanceDirectives: 'DNR/DNAR agreed. No ICU admission. No intubation. Comfort measures only.',
    familyContact: 'Mrs. Akua Mensah (Wife) — 0241234567',
    careGoals: ['Pain and symptom control', 'Dignity in dying', 'Family support', 'Spiritual peace'],
    status: 'Comfort Care', medications: ['Morphine 20mg MR BD', 'Morphine 5mg SC PRN', 'Haloperidol 5mg OD', 'Dexamethasone 4mg OD', 'Midazolam 2.5mg PRN'],
    doctor: 'Dr. Priscilla Wiafe', followUp: '2026-08-25 (daily review)',
    notes: 'Transitioned to comfort care. Family counselled. Spiritual care chaplain visit. Home care package arranged.'
  },
  { id: 'PAL-002', name: 'Akua Boateng', age: 55, gender: 'Female', mrn: 'MRN-2026-1052',
    condition: 'Metastatic Breast Cancer — Liver', prognosis: 'Months', symptomBurden: 'Moderate',
    painScore: 4, symptoms: ['Nausea', 'Fatigue', 'Insomnia', 'Low mood'],
    advanceDirectives: 'No resuscitation. Palliative chemotherapy continued. Ward admission only if needed.',
    familyContact: 'Mr. Kofi Boateng (Husband) — 0262345678',
    careGoals: ['Maintain quality of life', 'Manage symptoms', 'Emotional support', 'Family meetings'],
    status: 'Active', medications: ['Ondansetton 8mg TDS', 'Mirtazapine 15mg ON', 'Paracetamol 1g QDS', 'Lorazepam 0.5mg PRN'],
    doctor: 'Dr. Priscilla Wiafe', followUp: '2026-09-07 (2 weeks)',
    notes: 'Still on active palliative chemo. Home palliative nursing support twice weekly. Psychology referral for anxiety.'
  },
  { id: 'PAL-003', name: 'Kofi Asare', age: 72, gender: 'Male', mrn: 'MRN-2026-1054',
    condition: 'End-Stage Heart Failure', prognosis: 'Days to weeks', symptomBurden: 'Severe',
    painScore: 3, symptoms: ['Dyspnoea', 'Oedema', 'Confusion', 'Nocturia', 'Fatigue'],
    advanceDirectives: 'DNR. No transfer to hospital. Palliative care at home preferred.',
    familyContact: 'Mrs. Ama Asare (Daughter) — 0203456789',
    careGoals: ['Comfort', 'Symptom control', 'Family presence', 'Cultural/spiritual wishes'],
    status: 'Pre-Bereavement', medications: ['Morphine 5mg SC Q4H PRN', 'Midazolam 5mg SC PRN', 'Furosemide 40mg OD', 'Glyceryl trinitrate patch'],
    doctor: 'Dr. Priscilla Wiafe', followUp: '2026-08-25 (daily)',
    notes: 'Actively dying. Family at bedside. District nursing Q4H. Church pastor visit arranged. Death expected within days.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'Active': 'bg-blue-100 text-blue-800', 'Comfort Care': 'bg-purple-100 text-purple-800',
  'Pre-Bereavement': 'bg-red-100 text-red-800', 'Discharged': 'bg-green-100 text-green-800',
};

export default function PalliativeCare() {
  const [selected, setSelected] = useState<PalliativePatient | null>(PATIENTS[0] ?? null);
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
          title="Add New Palliative Care Record"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","required":true},{"name":"diagnosis","label":"Primary Diagnosis","type":"text"},{"name":"symptomBurdens","label":"Symptom Burden","type":"select","options":["Mild","Moderate","Severe"]},{"name":"goalsOfCare","label":"Goals of Care","type":"select","options":["Curative","Symptom Control","Comfort","End of Life"]},{"name":"notes","label":"Care Plan","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Palliative Care</h1><p className="text-gray-500">Symptom management, comfort care, advance directives, and spiritual care</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Patients', value: PATIENTS.length, color: 'text-blue-600' },
          { label: 'Severe Symptoms', value: PATIENTS.filter(p=>p.symptomBurden==='Severe').length, color: 'text-red-600' },
          { label: 'Comfort Care', value: PATIENTS.filter(p=>p.status==='Comfort Care').length, color: 'text-purple-600' },
          { label: 'Pre-Bereavement', value: PATIENTS.filter(p=>p.status==='Pre-Bereavement').length, color: 'text-red-700' },
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
                  <div className="text-xs text-gray-400 mt-1">Prognosis: {p.prognosis}</div>
                </div>
                <div className="text-right"><div className="text-xs text-gray-400">Symptom Burden</div><Badge className={`text-xs ${p.symptomBurden==='Severe'?'bg-red-100 text-red-800':'bg-yellow-100 text-yellow-800'}`}>{p.symptomBurden}</Badge></div>
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-1">
          {selected && (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div><h2 className="font-bold text-lg">{selected.name}</h2><p className="text-sm text-gray-500">{selected.age}y {selected.gender} — {selected.mrn}</p><p className="text-sm text-blue-600">{selected.condition}</p></div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1"><div><span className="text-gray-500">Prognosis:</span> <span className="font-semibold text-red-600">{selected.prognosis}</span></div><div><span className="text-gray-500">Doctor:</span> {selected.doctor}</div><div><span className="text-gray-500">Follow-up:</span> {selected.followUp}</div></div>
              <div className="bg-blue-50 rounded-lg p-3"><div className="text-sm font-medium text-blue-700 mb-1">Advance Directives</div><div className="text-sm text-blue-600">{selected.advanceDirectives}</div></div>
              <div><div className="text-sm font-medium text-gray-600 mb-1">Symptoms</div><div className="flex gap-1 flex-wrap">{selected.symptoms.map(s=><Badge key={s} className="text-[10px] bg-red-100 text-red-700">{s}</Badge>)}</div></div>
              <div><div className="text-sm font-medium text-gray-600 mb-1">Care Goals</div>{selected.careGoals.map((g,i)=><div key={i} className="text-xs flex items-center gap-1 mb-1"><span className="text-purple-500">♥</span> {g}</div>)}</div>
              <div><div className="text-sm font-medium text-gray-600 mb-1">Medications</div>{selected.medications.map((m,i)=><div key={i} className="text-xs bg-green-50 rounded px-2 py-1 mb-1">💊 {m}</div>)}</div>
              <div className="bg-gray-50 rounded-lg p-3"><div className="text-sm font-medium text-gray-600 mb-1">Family Contact</div><div className="text-sm">{selected.familyContact}</div></div>
              <div className="text-xs text-gray-400 italic">{selected.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
