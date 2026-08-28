import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface RCARecord {
  id: string; title: string; incidentId: string; date: string;
  team: string[]; status: 'In Progress' | 'Completed' | 'Pending';
  rootCause: string; contributingFactors: string[];
  correctiveActions: { action: string; responsible: string; deadline: string; status: string }[];
  recommendations: string[];
}

const RCA_RECORDS: RCARecord[] = [
  { id: 'RCA-001', title: 'Wrong Patient Surgery', incidentId: 'IR-005', date: '2026-08-20', team: ['Dr. Sarah Johnson', 'Sr. Ama Mensah', 'Eng. Samuel', 'Hospital Admin'], status: 'Completed', rootCause: 'Patient identification system failure — wristband not checked before anaesthesia', contributingFactors: ['Time pressure', 'Incomplete checklist', 'Staff fatigue', 'Poor lighting in holding area'], correctiveActions: [{ action: 'Implement barcode wristband scanning', responsible: 'IT Director', deadline: '2026-09-30', status: 'In Progress' }, { action: 'Mandatory 2-person verification', responsible: 'Surgical Director', deadline: '2026-08-25', status: 'Completed' }, { action: 'Upgrade theatre lighting', responsible: 'Facilities', deadline: '2026-09-15', status: 'Pending' }], recommendations: ['Universal protocol compliance audits', 'Regular team briefings', 'Fatigue management policy'] },
  { id: 'RCA-002', title: 'Medication Error — Insulin Overdose', incidentId: 'IR-008', date: '2026-08-15', team: ['Dr. Kofi Appiah', 'Sr. Efua Owusu', 'Pharmacist Nana'], status: 'Completed', rootCause: 'Look-alike/sound-alike vials — Humalog and Humulin stored together', contributingFactors: ['Similar packaging', 'Distraction during preparation', 'Single nurse verification'], correctiveActions: [{ action: 'Separate storage for insulin types', responsible: 'Pharmacy', deadline: '2026-08-20', status: 'Completed' }, { action: 'Tall-man lettering on labels', responsible: 'Pharmacy', deadline: '2026-08-25', status: 'Completed' }], recommendations: ['Independent double-check for high-risk medications', 'Look-alike/sound-alike alerts in system'] },
  { id: 'RCA-003', title: 'Patient Fall — Hip Fracture', incidentId: 'IR-012', date: '2026-08-10', team: ['Dr. Emmanuel Darko', 'Sr. Abena Darko', 'Physio Osei'], status: 'In Progress', rootCause: 'Contributing factors under investigation', contributingFactors: ['Sedation effects', 'Unfamiliar environment', 'Inadequate call bell access'], correctiveActions: [{ action: 'Review call bell system', responsible: 'Nursing Director', deadline: '2026-08-30', status: 'In Progress' }], recommendations: [] },
];

const STATUS_COLORS: Record<string, string> = { 'In Progress': 'bg-yellow-100 text-yellow-800', Completed: 'bg-green-100 text-green-800', Pending: 'bg-blue-100 text-blue-800' };

export default function RootCauseAnalysis() {
  const [selected, setSelected] = useState<RCARecord | null>(RCA_RECORDS[0] ?? null);

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
          title="Add New RCA Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Root Cause Analysis</h1><p className="text-gray-500">Systematic investigation of serious incidents, contributing factors, and corrective action tracking</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Total RCAs', value: RCA_RECORDS.length, color: 'text-blue-600' }, { label: 'Completed', value: RCA_RECORDS.filter(r => r.status === 'Completed').length, color: 'text-green-600' }, { label: 'In Progress', value: RCA_RECORDS.filter(r => r.status === 'In Progress').length, color: 'text-yellow-600' }, { label: 'Actions', value: RCA_RECORDS.reduce((s, r) => s + r.correctiveActions.length, 0), color: 'text-purple-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {RCA_RECORDS.map(r => (
            <div key={r.id} onClick={() => setSelected(r)} className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${selected?.id === r.id ? 'ring-2 ring-blue-500' : ''}`}>
              <div className="flex items-center justify-between mb-1"><span className="font-semibold text-sm">{r.title}</span><Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge></div>
              <div className="text-xs text-gray-500"><div>Incident: {r.incidentId} | Date: {r.date}</div><div>Team: {r.team.length} members</div></div>
            </div>
          ))}
        </div>
        {selected && (
          <div className="lg:col-span-2 bg-white rounded-lg border p-5 space-y-4 h-fit sticky top-4">
            <div className="flex items-center justify-between"><div><h3 className="text-lg font-bold">{selected.title}</h3><p className="text-sm text-gray-500">Incident: {selected.incidentId} | {selected.date}</p></div><Badge className={STATUS_COLORS[selected.status]}>{selected.status}</Badge></div>
            <div className="bg-red-50 border border-red-200 rounded p-3"><div className="text-xs text-red-600 font-semibold mb-1">Root Cause</div><div className="text-sm">{selected.rootCause}</div></div>
            <div><h4 className="font-semibold text-sm mb-2">Contributing Factors</h4><div className="flex flex-wrap gap-1">{selected.contributingFactors.map((f, i) => <span key={i} className="bg-yellow-50 text-yellow-700 text-xs px-2 py-0.5 rounded">{f}</span>)}</div></div>
            <div><h4 className="font-semibold text-sm mb-2">Corrective Actions</h4><div className="space-y-2">{selected.correctiveActions.map((a, i) => (
              <div key={i} className="border rounded p-3"><div className="flex items-center justify-between mb-1"><span className="text-sm font-medium">{a.action}</span><Badge className={a.status === 'Completed' ? 'bg-green-100 text-green-800' : a.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}>{a.status}</Badge></div><div className="text-xs text-gray-500">Responsible: {a.responsible} | Deadline: {a.deadline}</div></div>
            ))}</div></div>
            {selected.recommendations.length > 0 && <div><h4 className="font-semibold text-sm mb-2">Recommendations</h4><div className="space-y-1">{selected.recommendations.map((r, i) => <div key={i} className="text-sm bg-blue-50 border border-blue-200 rounded p-2">• {r}</div>)}</div></div>}
            <div className="text-xs text-gray-500">Investigation Team: {selected.team.join(', ')}</div>
          </div>
        )}
      </div>
    </div>
  );
}
