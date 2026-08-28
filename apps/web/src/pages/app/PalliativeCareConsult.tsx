import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface PalliativeReferral {
  id: string; patientName: string; age: number; diagnosis: string;
  referralDate: string; referredBy: string;
  symptomBurden: number; status: 'Active' | 'Completed' | 'Pending';
  symptoms: string[]; goals: string;
}

const REFERRALS: PalliativeReferral[] = [
  { id: 'PC-001', patientName: 'Efua Nyarko', age: 78, diagnosis: 'End-stage COPD', referralDate: '2026-08-20', referredBy: 'Dr. Sarah Johnson', symptomBurden: 8, status: 'Active', symptoms: ['Dyspnoea', 'Cough', 'Anxiety', 'Fatigue'], goals: 'Comfort-focused care, symptom relief, family support' },
  { id: 'PC-002', patientName: 'Nana Osei', age: 65, diagnosis: 'Metastatic Pancreatic Cancer', referralDate: '2026-08-15', referredBy: 'Dr. Kofi Appiah', symptomBurden: 9, status: 'Active', symptoms: ['Pain', 'Nausea', 'Anorexia', 'Jaundice', 'Fatigue'], goals: 'Pain management, dignity in dying, family preparedness' },
  { id: 'PC-003', patientName: 'Kwadwo Mensah', age: 82, diagnosis: 'Advanced Heart Failure', referralDate: '2026-08-10', referredBy: 'Dr. Sarah Johnson', symptomBurden: 7, status: 'Active', symptoms: ['Dyspnoea', 'Oedema', 'Fatigue'], goals: 'Quality of life, reduce hospital admissions' },
];

export default function PalliativeCareConsult() {
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
          title="Add New Palliative Consult"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Palliative Care Consultation</h1><p className="text-gray-500">Palliative care referrals, symptom management, advance care planning, and end-of-life support</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Active Referrals', value: REFERRALS.filter(r => r.status === 'Active').length, color: 'text-blue-600' }, { label: 'Total Patients', value: REFERRALS.length, color: 'text-green-600' }, { label: 'Avg Symptom Burden', value: (REFERRALS.reduce((s, r) => s + r.symptomBurden, 0) / REFERRALS.length).toFixed(0) + '/10', color: 'text-red-600' }, { label: 'Total Symptoms', value: [...new Set(REFERRALS.flatMap(r => r.symptoms))].length, color: 'text-purple-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>
      <div className="space-y-4">
        {REFERRALS.map(r => (
          <div key={r.id} className="bg-white rounded-lg border p-5">
            <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><span className="font-mono text-xs text-gray-500">{r.id}</span><span className="font-bold">{r.patientName}</span><span className="text-sm text-gray-500">{r.age} years</span></div><Badge className="bg-blue-100 text-blue-800">{r.status}</Badge></div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-2"><div><span className="text-gray-500">Diagnosis:</span> <span className="font-medium">{r.diagnosis}</span></div><div><span className="text-gray-500">Referred by:</span> {r.referredBy}</div></div>
            <div className="flex items-center gap-3 mb-2"><span className="text-sm">Symptom Burden:</span><div className="flex-1 bg-gray-200 rounded-full h-3"><div className={`h-3 rounded-full ${r.symptomBurden >= 7 ? 'bg-red-500' : r.symptomBurden >= 4 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${r.symptomBurden * 10}%` }} /></div><span className="text-sm font-bold">{r.symptomBurden}/10</span></div>
            <div className="flex flex-wrap gap-1 mb-2">{r.symptoms.map((s, i) => <span key={i} className="bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded">{s}</span>)}</div>
            <div className="text-sm bg-blue-50 border border-blue-200 rounded p-2"><strong>Goals:</strong> {r.goals}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
