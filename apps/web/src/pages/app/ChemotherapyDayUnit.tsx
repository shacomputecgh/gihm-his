import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface ChemoPatient {
  id: string; patientName: string; diagnosis: string; regimen: string;
  cycle: number; totalCycles: number; date: string;
  status: 'Scheduled' | 'Pre-chemo Assessment' | 'Receiving Treatment' | 'Post-observation' | 'Completed';
  oncologist: string; toxicity: string; performanceStatus: string;
}

const CHEMO_PATIENTS: ChemoPatient[] = [
  { id: 'CH-001', patientName: 'Kwadwo Mensah', diagnosis: 'Colorectal Cancer (Stage III)', regimen: 'FOLFOX', cycle: 6, totalCycles: 12, date: '2026-08-25', status: 'Receiving Treatment', oncologist: 'Dr. Sarah Johnson', toxicity: 'Grade 1 Neuropathy', performanceStatus: 'ECOG 1' },
  { id: 'CH-002', patientName: 'Akua Asare', diagnosis: 'Breast Cancer (HER2+)', regimen: 'AC-T + Trastuzumab', cycle: 3, totalCycles: 8, date: '2026-08-25', status: 'Pre-chemo Assessment', oncologist: 'Dr. Sarah Johnson', toxicity: 'None', performanceStatus: 'ECOG 0' },
  { id: 'CH-003', patientName: 'Efua Nyarko', diagnosis: 'Non-Hodgkin Lymphoma', regimen: 'R-CHOP', cycle: 4, totalCycles: 6, date: '2026-08-26', status: 'Scheduled', oncologist: 'Dr. Kofi Appiah', toxicity: 'Grade 2 Nausea', performanceStatus: 'ECOG 1' },
  { id: 'CH-004', patientName: 'Yaw Boateng', diagnosis: 'Lung Cancer (Stage IV)', regimen: 'Pembrolizumab + Chemotherapy', cycle: 2, totalCycles: 6, date: '2026-08-24', status: 'Post-observation', oncologist: 'Dr. Sarah Johnson', toxicity: 'Grade 1 Fatigue', performanceStatus: 'ECOG 2' },
];

const STATUS_COLORS: Record<string, string> = { Scheduled: 'bg-blue-100 text-blue-800', 'Pre-chemo Assessment': 'bg-yellow-100 text-yellow-800', 'Receiving Treatment': 'bg-green-100 text-green-800', 'Post-observation': 'bg-purple-100 text-purple-800', Completed: 'bg-gray-100 text-gray-800' };

export default function ChemotherapyDayUnit() {
  const [selected, setSelected] = useState<ChemoPatient | null>(CHEMO_PATIENTS[0] ?? null);

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
          title="Add New Chemo Session"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Chemotherapy Day Unit</h1><p className="text-gray-500">Chemotherapy scheduling, drug preparation, cycle tracking, and toxicity monitoring</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Today\'s Patients', value: CHEMO_PATIENTS.length, color: 'text-blue-600' }, { label: 'Receiving Treatment', value: CHEMO_PATIENTS.filter(p => p.status === 'Receiving Treatment').length, color: 'text-green-600' }, { label: 'Scheduled', value: CHEMO_PATIENTS.filter(p => p.status === 'Scheduled').length, color: 'text-yellow-600' }, { label: 'With Toxicity', value: CHEMO_PATIENTS.filter(p => p.toxicity !== 'None').length, color: 'text-red-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {CHEMO_PATIENTS.map(p => (
            <div key={p.id} onClick={() => setSelected(p)} className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${selected?.id === p.id ? 'ring-2 ring-blue-500' : ''}`}>
              <div className="flex items-center justify-between mb-1"><span className="font-semibold text-sm">{p.patientName}</span><Badge className={STATUS_COLORS[p.status]}>{p.status}</Badge></div>
              <div className="text-xs text-gray-500 space-y-1"><div>{p.diagnosis}</div><div className="font-medium text-blue-600">{p.regimen}</div><div>Cycle {p.cycle}/{p.totalCycles} — {p.date}</div></div>
            </div>
          ))}
        </div>
        {selected && (
          <div className="lg:col-span-2 bg-white rounded-lg border p-5 space-y-4 h-fit sticky top-4">
            <div className="flex items-center justify-between"><div><h3 className="text-lg font-bold">{selected.patientName}</h3><p className="text-sm text-gray-500">{selected.diagnosis}</p></div><Badge className={STATUS_COLORS[selected.status]}>{selected.status}</Badge></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded p-3"><div className="text-xs text-gray-500">Regimen</div><div className="font-bold text-blue-600">{selected.regimen}</div></div>
              <div className="bg-gray-50 rounded p-3"><div className="text-xs text-gray-500">Cycle</div><div className="font-bold">{selected.cycle} of {selected.totalCycles}</div></div>
              <div className="bg-gray-50 rounded p-3"><div className="text-xs text-gray-500">Oncologist</div><div className="font-bold text-sm">{selected.oncologist}</div></div>
              <div className="bg-gray-50 rounded p-3"><div className="text-xs text-gray-500">Performance</div><div className="font-bold">{selected.performanceStatus}</div></div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4"><div className="bg-blue-600 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ width: `${(selected.cycle / selected.totalCycles) * 100}%` }}>{selected.cycle}/{selected.totalCycles}</div></div>
            <div className={`rounded p-3 ${selected.toxicity === 'None' ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}><div className="text-xs font-semibold mb-1">Toxicity</div><div className="text-sm">{selected.toxicity}</div></div>
          </div>
        )}
      </div>
    </div>
  );
}
