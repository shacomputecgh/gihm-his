import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface FallRiskPatient {
  id: string; patientName: string; ward: string; age: number;
  fallRiskScore: number; riskLevel: 'High' | 'Moderate' | 'Low';
  interventions: string[]; lastAssessed: string;
  history: boolean; assistiveDevice: boolean; confused: boolean;
}

const FALL_PATIENTS: FallRiskPatient[] = [
  { id: 'FR-001', patientName: 'Abena Koomson', ward: 'Geriatrics', age: 82, fallRiskScore: 18, riskLevel: 'High', interventions: ['Bed alarm activated', 'Non-slip footwear', '1:1 supervision', 'Call bell within reach', 'Environment assessment'], lastAssessed: '2026-08-24', history: true, assistiveDevice: true, confused: true },
  { id: 'FR-002', patientName: 'Kwadwo Mensah', ward: 'Medicine', age: 68, fallRiskScore: 12, riskLevel: 'Moderate', interventions: ['Bed at lowest position', 'Non-slip footwear', 'Regular rounding', 'Medication review'], lastAssessed: '2026-08-24', history: true, assistiveDevice: false, confused: false },
  { id: 'FR-003', patientName: 'Efua Nyarko', ward: 'Surgery', age: 45, fallRiskScore: 6, riskLevel: 'Low', interventions: ['Standard fall precautions', 'Orientation to environment'], lastAssessed: '2026-08-24', history: false, assistiveDevice: false, confused: false },
  { id: 'FR-004', patientName: 'Nana Agyeman', ward: 'ICU', age: 72, fallRiskScore: 20, riskLevel: 'High', interventions: ['Bed alarm', '1:1 nursing', 'Sedation review', 'Mobilisation protocol', 'Toilet assistance'], lastAssessed: '2026-08-24', history: false, assistiveDevice: false, confused: true },
];

const RISK_COLORS: Record<string, string> = { High: 'bg-red-100 text-red-800', Moderate: 'bg-yellow-100 text-yellow-800', Low: 'bg-green-100 text-green-800' };

export default function FallPreventionProgramme() {
  const [selected, setSelected] = useState<FallRiskPatient | null>(FALL_PATIENTS[0] ?? null);

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
          title="Add New Fall Prevention Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Fall Prevention Programme</h1><p className="text-gray-500">Fall risk assessment (Morse Fall Scale), prevention protocols, and incident tracking</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'High Risk', value: FALL_PATIENTS.filter(p => p.riskLevel === 'High').length, color: 'text-red-600' }, { label: 'Moderate Risk', value: FALL_PATIENTS.filter(p => p.riskLevel === 'Moderate').length, color: 'text-yellow-600' }, { label: 'Low Risk', value: FALL_PATIENTS.filter(p => p.riskLevel === 'Low').length, color: 'text-green-600' }, { label: 'Total Assessed', value: FALL_PATIENTS.length, color: 'text-blue-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {FALL_PATIENTS.map(p => (
            <div key={p.id} onClick={() => setSelected(p)} className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${selected?.id === p.id ? 'ring-2 ring-blue-500' : ''}`}>
              <div className="flex items-center justify-between mb-1"><span className="font-semibold text-sm">{p.patientName}</span><Badge className={RISK_COLORS[p.riskLevel]}>{p.riskLevel}</Badge></div>
              <div className="text-xs text-gray-500 space-y-1"><div>Age: {p.age} | Ward: {p.ward}</div><div className="font-bold">Score: {p.fallRiskScore}/45</div></div>
            </div>
          ))}
        </div>
        {selected && (
          <div className="lg:col-span-2 bg-white rounded-lg border p-5 space-y-4 h-fit sticky top-4">
            <div className="flex items-center justify-between"><div><h3 className="text-lg font-bold">{selected.patientName}</h3><p className="text-sm text-gray-500">Age: {selected.age} | Ward: {selected.ward}</p></div><Badge className={RISK_COLORS[selected.riskLevel]}>{selected.riskLevel} Risk</Badge></div>
            <div className="bg-red-50 border border-red-200 rounded p-4 text-center"><div className="text-3xl font-bold text-red-600">{selected.fallRiskScore}/45</div><div className="text-sm text-red-600">Morse Fall Scale Score</div></div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className={`rounded p-2 text-center ${selected.history ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>{selected.history ? '✅' : '❌'} History of Falls</div>
              <div className={`rounded p-2 text-center ${selected.assistiveDevice ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>{selected.assistiveDevice ? '✅' : '❌'} Uses Assistive Device</div>
              <div className={`rounded p-2 text-center ${selected.confused ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>{selected.confused ? '✅' : '❌'} Confused/Disoriented</div>
            </div>
            <div><h4 className="font-semibold text-sm mb-2">Active Interventions</h4><div className="space-y-1">{selected.interventions.map((int, i) => <div key={i} className="text-sm bg-blue-50 border border-blue-200 rounded p-2">• {int}</div>)}</div></div>
            <div className="text-xs text-gray-500">Last Assessed: {selected.lastAssessed}</div>
          </div>
        )}
      </div>
    </div>
  );
}
