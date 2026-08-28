import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface TraumaCase {
  id: string; patientName: string; age: number; gender: string;
  mechanism: string; injuryType: string; regions: string[];
  ISS: number; RTS: string; status: 'Active' | 'Discharged' | 'Deceased';
  outcome: string;
}

const TRAUMA_CASES: TraumaCase[] = [
  { id: 'TR-001', patientName: 'Kwame Mensah', age: 28, gender: 'M', mechanism: 'Road Traffic Accident (Motorcycle)', injuryType: 'Blunt Trauma', regions: ['Head', 'Chest', 'Left Femur'], ISS: 25, RTS: '6.54', status: 'Active', outcome: 'ICU admission' },
  { id: 'TR-002', patientName: 'Akua Osei', age: 45, gender: 'F', mechanism: 'Fall from Height', injuryType: 'Blunt Trauma', regions: ['Spine', 'Pelvis'], ISS: 16, RTS: '7.21', status: 'Active', outcome: 'Surgery planned' },
  { id: 'TR-003', patientName: 'Nana Boateng', age: 18, gender: 'M', mechanism: 'Gunshot Wound', injuryType: 'Penetrating Trauma', regions: ['Abdomen'], ISS: 22, RTS: '5.97', status: 'Active', outcome: 'Exploratory laparotomy' },
  { id: 'TR-004', patientName: 'Efua Darko', age: 35, gender: 'F', mechanism: 'Burn (Scald)', injuryType: 'Burn', regions: ['Upper Limb', 'Trunk'], ISS: 9, RTS: '7.84', status: 'Discharged', outcome: 'Wound healing' },
];

const STATUS_COLORS: Record<string, string> = { Active: 'bg-blue-100 text-blue-800', Discharged: 'bg-green-100 text-green-800', Deceased: 'bg-gray-100 text-gray-800' };

export default function TraumaRegistry() {
  const avgISS = Math.round(TRAUMA_CASES.reduce((s, c) => s + c.ISS, 0) / TRAUMA_CASES.length);
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
          title="Add New Trauma Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Trauma Registry</h1><p className="text-gray-500">Trauma data collection, ISS/RTS scoring, mechanism analysis, and outcome tracking</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Total Cases', value: TRAUMA_CASES.length, color: 'text-blue-600' }, { label: 'Active', value: TRAUMA_CASES.filter(c => c.status === 'Active').length, color: 'text-green-600' }, { label: 'Avg ISS', value: avgISS, color: 'text-red-600' }, { label: 'Penetrating', value: TRAUMA_CASES.filter(c => c.injuryType === 'Penetrating Trauma').length, color: 'text-orange-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>
      <div className="space-y-3">
        {TRAUMA_CASES.sort((a, b) => b.ISS - a.ISS).map(c => (
          <div key={c.id} className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span className="font-mono text-xs text-gray-500">{c.id}</span><span className="font-bold">{c.patientName}</span><span className="text-sm text-gray-500">{c.age}/{c.gender}</span></div><Badge className={STATUS_COLORS[c.status]}>{c.status}</Badge></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div><span className="text-gray-500">Mechanism:</span> <span className="font-medium">{c.mechanism}</span></div>
              <div><span className="text-gray-500">Type:</span> {c.injuryType}</div>
              <div><span className="text-gray-500">ISS:</span> <span className={`font-bold ${c.ISS >= 25 ? 'text-red-600' : c.ISS >= 16 ? 'text-yellow-600' : 'text-green-600'}`}>{c.ISS}</span></div>
              <div><span className="text-gray-500">RTS:</span> {c.RTS}</div>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">{c.regions.map((r, i) => <span key={i} className="bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded">{r}</span>)}</div>
            <div className="text-sm mt-2"><span className="text-gray-500">Outcome:</span> {c.outcome}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
