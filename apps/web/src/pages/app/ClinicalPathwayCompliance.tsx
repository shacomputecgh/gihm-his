import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface Pathway {
  id: string; name: string; targetCompliance: number;
  actualCompliance: number; patients: number;
  variations: string[];
}

const PATHWAYS: Pathway[] = [
  { id: 'CP-001', name: 'Sepsis Bundle (Hour-1)', targetCompliance: 90, actualCompliance: 82, patients: 35, variations: ['Lactate not measured in 2 cases', 'Antibiotic delayed >1h in 3 cases'] },
  { id: 'CP-002', name: 'Stroke Thrombolysis Protocol', targetCompliance: 95, actualCompliance: 90, patients: 18, variations: ['Door-to-needle time exceeded in 1 case'] },
  { id: 'CP-003', name: 'ST-Elevation MI Protocol', targetCompliance: 95, actualCompliance: 88, patients: 22, variations: ['ECG delayed in 2 cases', 'Aspirin not given pre-hospital in 1 case'] },
  { id: 'CP-004', name: 'Maternal Haemorrhage Protocol', targetCompliance: 90, actualCompliance: 85, patients: 28, variations: ['Active management of 3rd stage delayed in 2 cases'] },
  { id: 'CP-005', name: 'Diabetic Ketoacidosis Protocol', targetCompliance: 85, actualCompliance: 92, patients: 15, variations: [] },
];

export default function ClinicalPathwayCompliance() {
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
          title="Add New Compliance Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Clinical Pathway Compliance</h1><p className="text-gray-500">Pathway adherence tracking, variation analysis, and protocol compliance monitoring</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Pathways Tracked', value: PATHWAYS.length, color: 'text-blue-600' }, { label: 'On Target', value: PATHWAYS.filter(p => p.actualCompliance >= p.targetCompliance).length, color: 'text-green-600' }, { label: 'Below Target', value: PATHWAYS.filter(p => p.actualCompliance < p.targetCompliance).length, color: 'text-red-600' }, { label: 'Total Patients', value: PATHWAYS.reduce((s, p) => s + p.patients, 0), color: 'text-purple-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>
      <div className="space-y-4">
        {PATHWAYS.map(p => {
          const onTarget = p.actualCompliance >= p.targetCompliance;
          return (
            <div key={p.id} className="bg-white rounded-lg border p-5">
              <div className="flex items-center justify-between mb-3"><span className="font-bold">{p.name}</span><div className="flex items-center gap-2"><Badge className={onTarget ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{onTarget ? 'On Target' : 'Below Target'}</Badge><span className={`text-2xl font-bold ${onTarget ? 'text-green-600' : 'text-red-600'}`}>{p.actualCompliance}%</span></div></div>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-2"><div className={`h-4 rounded-full ${onTarget ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${p.actualCompliance}%` }} /><div className="absolute h-4 border-r-2 border-gray-800" style={{ width: `${p.targetCompliance}%` }} /></div>
              <div className="text-xs text-gray-500 mb-2">Target: {p.targetCompliance}% | Patients: {p.patients}</div>
              {p.variations.length > 0 && <div><h4 className="font-semibold text-xs mb-1">Variations</h4><div className="space-y-1">{p.variations.map((v, i) => <div key={i} className="text-xs bg-yellow-50 border border-yellow-200 rounded p-1.5">⚠️ {v}</div>)}</div></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
