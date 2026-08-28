import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface DietPatient {
  id: string; name: string; age: number; gender: string; mrn: string;
  condition: string; bmi: number; nutritionalRisk: string;
  albumin: number; weight: number; targetWeight: number;
  dietPlan: string; oralSupplements: string; route: string;
  status: 'Assessment' | 'Active Diet' | 'Stable' | 'Discharged';
  dietitian: string; followUp: string; notes: string;
}

const PATIENTS: DietPatient[] = [
  { id: 'DIET-001', name: 'Kwame Mensah', age: 67, gender: 'Male', mrn: 'MRN-2026-1240',
    condition: 'Post-Stroke Dysphagia + Malnutrition', bmi: 19.2, nutritionalRisk: 'High',
    albumin: 28, weight: 58, targetWeight: 65, dietPlan: 'High-calorie, high-protein modified texture (IDDSI Level 5)',
    oralSupplements: 'Ensure Compact x3/day', route: 'Oral (modified)', status: 'Active Diet',
    dietitian: 'Sr. Akua Mensah', followUp: '2026-08-28 (2 weeks)', notes: 'BMI 19.2 — underweight. MNA score 14. High calorie supplement. Fortify foods. Weight target 65kg. Ongoing S&L input.'
  },
  { id: 'DIET-002', name: 'Akua Boateng', age: 55, gender: 'Female', mrn: 'MRN-2026-1242',
    condition: 'Diabetic Diet — Poor Glycaemic Control', bmi: 32.1, nutritionalRisk: 'Moderate',
    albumin: 38, weight: 88, targetWeight: 72, dietPlan: 'Diabetic diet — carbohydrate counting, low GI, portion control',
    oralSupplements: 'None', route: 'Oral', status: 'Active Diet',
    dietitian: 'Sr. Akua Mensah', followUp: '2026-09-07 (2 weeks)', notes: 'BMI 32.1 — obese. HbA1c 9.2%. Carbohydrate counting education done. Meal plan created. Weight loss target 0.5kg/week.'
  },
  { id: 'DIET-003', name: 'Kofi Asare', age: 72, gender: 'Male', mrn: 'MRN-2026-1244',
    condition: 'COPD + Cachexia', bmi: 18.5, nutritionalRisk: 'Very High',
    albumin: 25, weight: 54, targetWeight: 62, dietPlan: 'High-calorie, high-protein, small frequent meals, energy-dense snacks',
    oralSupplements: 'Fresubin Energy x4/day + Fortisip Compact x2/day', route: 'Oral', status: 'Active Diet',
    dietitian: 'Sr. Akua Mensah', followUp: '2026-08-28 (2 weeks)', notes: 'Severe malnutrition. MNA score 8. Cachexia from COPD. Appetite stimulant discussed. Referral to palliative nutrition if no improvement.'
  },
  { id: 'DIET-004', name: 'Efua Nyarko', age: 28, gender: 'Female', mrn: 'MRN-2026-1246',
    condition: 'Antenatal Nutrition — Gestational Diabetes', bmi: 26.5, nutritionalRisk: 'Moderate',
    albumin: 35, weight: 72, targetWeight: 72, dietPlan: 'GDM diet — carbohydrate-controlled, balanced meals, regular monitoring',
    oralSupplements: 'Folic acid 5mg + Iron supplement', route: 'Oral', status: 'Active Diet',
    dietitian: 'Sr. Akua Mensah', followUp: '2026-09-14 (2 weeks)', notes: 'GDM diagnosed at 28 weeks. Diet-controlled — no insulin needed yet. BGL logs maintained. Weight gain tracking appropriate.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'Assessment': 'bg-blue-100 text-blue-800', 'Active Diet': 'bg-yellow-100 text-yellow-800',
  'Stable': 'bg-green-100 text-green-800', 'Discharged': 'bg-gray-100 text-gray-800',
};

export default function ClinicalDietetics() {
  const [selected, setSelected] = useState<DietPatient | null>(PATIENTS[0] ?? null);
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
          title="Add New Diet Plan"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Clinical Dietetics</h1><p className="text-gray-500">Nutrition assessment, BMI monitoring, meal planning, and metabolic support</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Patients', value: PATIENTS.length, color: 'text-blue-600' },
          { label: 'Malnourished', value: PATIENTS.filter(p=>p.bmi<20).length, color: 'text-red-600' },
          { label: 'Obese', value: PATIENTS.filter(p=>p.bmi>30).length, color: 'text-orange-600' },
          { label: 'Low Albumin', value: PATIENTS.filter(p=>p.albumin<30).length, color: 'text-purple-600' },
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
                  <div className="text-xs text-gray-400 mt-1">Route: {p.route} | Albumin: {p.albumin} g/L</div>
                </div>
                <div className="text-right"><div className={`text-lg font-bold ${p.bmi<18.5?'text-red-600':p.bmi>30?'text-orange-600':'text-green-600'}`}>{p.bmi}</div><div className="text-[10px] text-gray-400">BMI</div></div>
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-1">
          {selected && (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div><h2 className="font-bold text-lg">{selected.name}</h2><p className="text-sm text-gray-500">{selected.age}y {selected.gender} — {selected.mrn}</p><p className="text-sm text-blue-600">{selected.condition}</p></div>
              <div className={`rounded-lg p-3 text-center ${selected.bmi<18.5?'bg-red-50 text-red-600':selected.bmi>30?'bg-orange-50 text-orange-600':'bg-green-50 text-green-600'}`}><div className="text-4xl font-black">{selected.bmi}</div><div className="text-xs">BMI (Target: {selected.targetWeight}kg)</div></div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1"><div><span className="text-gray-500">Weight:</span> {selected.weight}kg → Target: {selected.targetWeight}kg</div><div><span className="text-gray-500">Albumin:</span> <span className={`font-bold ${selected.albumin<30?'text-red-600':'text-green-600'}`}>{selected.albumin} g/L</span></div><div><span className="text-gray-500">Risk:</span> <span className={`font-bold ${selected.nutritionalRisk==='Very High'?'text-red-600':selected.nutritionalRisk==='High'?'text-orange-600':'text-yellow-600'}`}>{selected.nutritionalRisk}</span></div><div><span className="text-gray-500">Route:</span> {selected.route}</div></div>
              <div className="bg-blue-50 rounded-lg p-3"><div className="text-sm font-medium text-blue-700 mb-1">Diet Plan</div><div className="text-sm text-blue-600">{selected.dietPlan}</div></div>
              {selected.oralSupplements && <div className="bg-green-50 rounded-lg p-3"><div className="text-sm font-medium text-green-700 mb-1">Oral Supplements</div><div className="text-sm text-green-600">{selected.oralSupplements}</div></div>}
              <div className="text-xs text-gray-400 italic">{selected.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
