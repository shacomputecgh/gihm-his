import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface DischargePlan {
  id: string; patientName: string; ward: string; diagnosis: string;
  dischargeDate: string; destination: string;
  status: 'Planning' | 'Ready' | 'Discharged' | 'Delayed';
  checklist: { item: string; done: boolean }[];
  followUp: string;
}

const DISCHARGES: DischargePlan[] = [
  { id: 'DP-001', patientName: 'Kwame Asante', ward: 'Cardiology', diagnosis: 'Acute MI — post-PCI', dischargeDate: '2026-08-26', destination: 'Home', status: 'Planning', checklist: [{ item: 'Prescription ready', done: true }, { item: 'Discharge summary', done: true }, { item: 'Medication counselling', done: false }, { item: 'Follow-up appointment', done: false }, { item: 'Transport arranged', done: true }, { item: 'Wound care instructions', done: true }], followUp: 'Cardiology clinic in 2 weeks' },
  { id: 'DP-002', patientName: 'Akua Mensah', ward: 'Maternity', diagnosis: 'Normal delivery', dischargeDate: '2026-08-25', destination: 'Home', status: 'Ready', checklist: [{ item: 'Prescription ready', done: true }, { item: 'Discharge summary', done: true }, { item: 'Breastfeeding assessment', done: true }, { item: 'Newborn screening', done: true }, { item: 'Follow-up appointment', done: true }], followUp: 'Postnatal clinic in 6 weeks' },
  { id: 'DP-003', patientName: 'Nana Osei', ward: 'Surgery', diagnosis: 'Appendectomy', dischargeDate: '2026-08-25', destination: 'Home', status: 'Discharged', checklist: [{ item: 'Prescription ready', done: true }, { item: 'Wound care instructions', done: true }, { item: 'Activity restrictions', done: true }, { item: 'Follow-up appointment', done: true }], followUp: 'Surgery clinic in 1 week' },
];

const STATUS_COLORS: Record<string, string> = { Planning: 'bg-yellow-100 text-yellow-800', Ready: 'bg-green-100 text-green-800', Discharged: 'bg-blue-100 text-blue-800', Delayed: 'bg-red-100 text-red-800' };

export default function DischargePlanning() {
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
          title="Add New Discharge Plan"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Discharge Planning</h1><p className="text-gray-500">Comprehensive discharge planning, checklist tracking, medication reconciliation, and follow-up coordination</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Planning', value: DISCHARGES.filter(d => d.status === 'Planning').length, color: 'text-yellow-600' }, { label: 'Ready', value: DISCHARGES.filter(d => d.status === 'Ready').length, color: 'text-green-600' }, { label: 'Discharged', value: DISCHARGES.filter(d => d.status === 'Discharged').length, color: 'text-blue-600' }, { label: 'Delayed', value: DISCHARGES.filter(d => d.status === 'Delayed').length, color: 'text-red-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="space-y-4">
        {DISCHARGES.map(d => (
          <div key={d.id} className="bg-white rounded-lg border p-5">
            <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><span className="font-mono text-xs text-gray-500">{d.id}</span><span className="font-bold">{d.patientName}</span><Badge className="bg-gray-100 text-gray-800">{d.ward}</Badge></div><Badge className={STATUS_COLORS[d.status]}>{d.status}</Badge></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3"><div><span className="text-gray-500">Diagnosis:</span> {d.diagnosis}</div><div><span className="text-gray-500">Discharge Date:</span> {d.dischargeDate}</div><div><span className="text-gray-500">Destination:</span> {d.destination}</div><div><span className="text-gray-500">Follow-up:</span> {d.followUp}</div></div>
            <div><h4 className="font-semibold text-sm mb-2">Discharge Checklist</h4><div className="grid grid-cols-2 md:grid-cols-3 gap-2">{d.checklist.map((c, i) => (
              <div key={i} className={`flex items-center gap-2 text-sm ${c.done ? 'text-green-600' : 'text-gray-500'}`}>{c.done ? '✅' : '⬜'} {c.item}</div>
            ))}</div></div>
            <div className="mt-2"><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-600 h-2 rounded-full" style={{ width: `${(d.checklist.filter(c => c.done).length / d.checklist.length) * 100}%` }} /></div><div className="text-xs text-gray-500 text-right mt-1">{d.checklist.filter(c => c.done).length}/{d.checklist.length} completed</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}
