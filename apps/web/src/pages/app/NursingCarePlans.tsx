import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface NursingPlan {
  id: string; patientName: string; ward: string; diagnosis: string;
  nursingDiagnosis: string; goal: string; interventions: string[];
  status: 'Active' | 'Completed' | 'On Hold' | 'Revised';
  assignedNurse: string; lastUpdated: string;
}

const CARE_PLANS: NursingPlan[] = [
  { id: 'CP-001', patientName: 'Kwame Asante', ward: 'Cardiology', diagnosis: 'Acute MI', nursingDiagnosis: 'Risk for decreased cardiac output related to myocardial damage', goal: 'Patient will maintain haemodynamic stability with HR 60-100, BP within normal limits', interventions: ['Continuous cardiac monitoring', 'Assess vital signs q2h', 'Administer prescribed medications', 'Monitor for arrhythmias', 'Maintain IV access'], status: 'Active', assignedNurse: 'Sr. Ama Mensah', lastUpdated: '2026-08-24' },
  { id: 'CP-002', patientName: 'Akua Boateng', ward: 'Surgery', diagnosis: 'Post-appendectomy', nursingDiagnosis: 'Acute pain related to surgical incision', goal: 'Patient will report pain ≤ 3/10 within 24 hours', interventions: ['Assess pain using numeric scale q4h', 'Administer analgesics as ordered', 'Position for comfort', 'Encourage deep breathing', 'Monitor wound site'], status: 'Active', assignedNurse: 'Sr. Kofi Appiah', lastUpdated: '2026-08-24' },
  { id: 'CP-003', patientName: 'Nana Osei', ward: 'ICU', diagnosis: 'Sepsis', nursingDiagnosis: 'Ineffective tissue perfusion related to altered cardiac output', goal: 'Patient will demonstrate adequate perfusion (capillary refill < 3s, urine output > 30ml/hr)', interventions: ['Monitor MAP target > 65mmHg', 'Fluid resuscitation as ordered', 'Hourly urine output monitoring', 'Lactate levels q6h', 'Assess extremities for perfusion'], status: 'Active', assignedNurse: 'Sr. Efua Owusu', lastUpdated: '2026-08-24' },
  { id: 'CP-004', patientName: 'Efua Nyarko', ward: 'Paediatrics', diagnosis: 'Severe malaria', nursingDiagnosis: 'Hyperthermia related to infectious process', goal: 'Body temperature will return to 36.5-37.5°C', interventions: ['Monitor temperature q2h', 'Administer antipyretics', 'Tepid sponging if temp > 39°C', 'Ensure adequate fluid intake', 'Monitor for convulsions'], status: 'Completed', assignedNurse: 'Sr. Ama Mensah', lastUpdated: '2026-08-23' },
];

const STATUS_COLORS: Record<string, string> = { Active: 'bg-green-100 text-green-800', Completed: 'bg-gray-100 text-gray-800', 'On Hold': 'bg-yellow-100 text-yellow-800', Revised: 'bg-blue-100 text-blue-800' };

export default function NursingCarePlans() {
  const [selected, setSelected] = useState<NursingPlan | null>(CARE_PLANS[0] ?? null);

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
          title="Add New Nursing Care Plan"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Nursing Care Plans</h1><p className="text-gray-500">Nursing documentation, care planning, intervention tracking, and patient outcomes</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Active Plans', value: CARE_PLANS.filter(p => p.status === 'Active').length, color: 'text-green-600' }, { label: 'Total Plans', value: CARE_PLANS.length, color: 'text-blue-600' }, { label: 'Completed', value: CARE_PLANS.filter(p => p.status === 'Completed').length, color: 'text-gray-600' }, { label: 'Nurses Assigned', value: [...new Set(CARE_PLANS.map(p => p.assignedNurse))].length, color: 'text-purple-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {CARE_PLANS.map(p => (
            <div key={p.id} onClick={() => setSelected(p)} className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${selected?.id === p.id ? 'ring-2 ring-blue-500' : ''}`}>
              <div className="flex items-center justify-between mb-1"><span className="font-semibold text-sm">{p.patientName}</span><Badge className={STATUS_COLORS[p.status]}>{p.status}</Badge></div>
              <div className="text-xs text-gray-500 space-y-1"><div>{p.ward} — {p.diagnosis}</div><div className="text-blue-600">{p.nursingDiagnosis.substring(0, 60)}...</div><div>Nurse: {p.assignedNurse}</div></div>
            </div>
          ))}
        </div>
        {selected && (
          <div className="lg:col-span-2 bg-white rounded-lg border p-5 space-y-4 h-fit sticky top-4">
            <div className="flex items-center justify-between"><div><h3 className="text-lg font-bold">{selected.patientName}</h3><p className="text-sm text-gray-500">{selected.ward} — {selected.diagnosis}</p></div><Badge className={STATUS_COLORS[selected.status]}>{selected.status}</Badge></div>
            <div className="bg-red-50 border border-red-200 rounded p-3"><div className="text-xs text-red-600 font-semibold mb-1">Nursing Diagnosis</div><div className="text-sm">{selected.nursingDiagnosis}</div></div>
            <div className="bg-green-50 border border-green-200 rounded p-3"><div className="text-xs text-green-600 font-semibold mb-1">Goal</div><div className="text-sm">{selected.goal}</div></div>
            <div><h4 className="font-semibold text-sm mb-2">Nursing Interventions</h4><ol className="list-decimal list-inside space-y-1">{selected.interventions.map((int, i) => <li key={i} className="text-sm bg-blue-50 border border-blue-200 rounded p-2">{int}</li>)}</ol></div>
            <div className="flex gap-4 text-sm"><div><span className="text-gray-500">Assigned Nurse:</span> <span className="font-medium">{selected.assignedNurse}</span></div><div><span className="text-gray-500">Last Updated:</span> {selected.lastUpdated}</div></div>
          </div>
        )}
      </div>
    </div>
  );
}
