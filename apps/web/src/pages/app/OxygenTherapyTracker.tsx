import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface OxygenPatient {
  id: string; patientName: string; ward: string; indication: string;
  deliveryMethod: string; flowRate: string; target: string;
  currentSpO2: number; status: 'Stable' | 'Improving' | 'Worsening' | 'Titrating';
}

const OXYGEN_PATIENTS: OxygenPatient[] = [
  { id: 'OT-001', patientName: 'Kwadwo Mensah', ward: 'ICU', indication: 'ARDS', deliveryMethod: 'High Flow Nasal Cannula', flowRate: '40 L/min', target: 'SpO2 92-96%', currentSpO2: 94, status: 'Stable' },
  { id: 'OT-002', patientName: 'Efua Nyarko', ward: 'Medicine', indication: 'COPD Exacerbation', deliveryMethod: 'Venturi Mask', flowRate: '28% FiO2', target: 'SpO2 88-92%', currentSpO2: 90, status: 'Improving' },
  { id: 'OT-003', patientName: 'Nana Agyeman', ward: 'Emergency', indication: 'Pneumonia', deliveryMethod: 'Simple Face Mask', flowRate: '6 L/min', target: 'SpO2 > 94%', currentSpO2: 93, status: 'Titrating' },
  { id: 'OT-004', patientName: 'Akua Asare', ward: 'Surgery', indication: 'Post-operative', deliveryMethod: 'Nasal Cannula', flowRate: '2 L/min', target: 'SpO2 > 95%', currentSpO2: 97, status: 'Stable' },
];

const STATUS_COLORS: Record<string, string> = { Stable: 'bg-green-100 text-green-800', Improving: 'bg-blue-100 text-blue-800', Worsening: 'bg-red-100 text-red-800', Titrating: 'bg-yellow-100 text-yellow-800' };

export default function OxygenTherapyTracker() {
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
          title="Add New Oxygen Therapy Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Oxygen Therapy Tracker</h1><p className="text-gray-500">Oxygen prescription, delivery method monitoring, SpO2 tracking, and titration management</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'On Oxygen', value: OXYGEN_PATIENTS.length, color: 'text-blue-600' }, { label: 'Stable', value: OXYGEN_PATIENTS.filter(p => p.status === 'Stable').length, color: 'text-green-600' }, { label: 'Titrating', value: OXYGEN_PATIENTS.filter(p => p.status === 'Titrating').length, color: 'text-yellow-600' }, { label: 'HFNC', value: OXYGEN_PATIENTS.filter(p => p.deliveryMethod.includes('High Flow')).length, color: 'text-purple-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>
      <div className="space-y-3">
        {OXYGEN_PATIENTS.map(p => (
          <div key={p.id} className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span className="font-mono text-xs text-gray-500">{p.id}</span><span className="font-bold">{p.patientName}</span><Badge className="bg-gray-100 text-gray-800">{p.ward}</Badge></div><Badge className={STATUS_COLORS[p.status]}>{p.status}</Badge></div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
              <div><span className="text-gray-500">Indication:</span> {p.indication}</div>
              <div><span className="text-gray-500">Delivery:</span> <span className="font-medium text-blue-600">{p.deliveryMethod}</span></div>
              <div><span className="text-gray-500">Flow:</span> {p.flowRate}</div>
              <div><span className="text-gray-500">Target:</span> {p.target}</div>
              <div><span className="text-gray-500">Current SpO2:</span> <span className={`font-bold ${p.currentSpO2 >= 94 ? 'text-green-600' : p.currentSpO2 >= 90 ? 'text-yellow-600' : 'text-red-600'}`}>{p.currentSpO2}%</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
