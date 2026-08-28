import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface MDSRRecord {
  id: string; patientName: string; age: number; dateOfDeath: string;
  causeOfDeath: string; directObstetric: boolean;
  avoidable: string; delayLevel: string;
  status: 'Reviewed' | 'Pending Review' | 'In Review';
  panel: string[]; recommendations: string[];
}

const MDSR_RECORDS: MDSRRecord[] = [
  { id: 'MDSR-001', patientName: 'Akua Mensah', age: 32, dateOfDeath: '2026-08-20', causeOfDeath: 'Post-partum haemorrhage', directObstetric: true, avoidable: 'Partly avoidable', delayLevel: 'Level 2 (Facility)', status: 'Reviewed', panel: ['Obstetrician', 'Midwife', 'Anaesthetist', 'Hospital Admin'], recommendations: ['Improve blood transfusion availability', 'Upgrade surgical capacity for PPH', 'Regular drills for obstetric emergencies'] },
  { id: 'MDSR-002', patientName: 'Efua Nyarko', age: 28, dateOfDeath: '2026-08-15', causeOfDeath: 'Eclampsia with HELLP syndrome', directObstetric: true, avoidable: 'Avoidable', delayLevel: 'Level 1 (Community)', status: 'Reviewed', panel: ['Obstetrician', 'Midwife', 'Social Worker'], recommendations: ['Community health education on danger signs', 'Improve antenatal coverage', 'Ensure magnesium sulphate availability'] },
  { id: 'MDSR-003', patientName: 'Ama Boateng', age: 40, dateOfDeath: '2026-08-22', causeOfDeath: 'Amniotic fluid embolism', directObstetric: true, avoidable: 'Unavoidable', delayLevel: 'None', status: 'In Review', panel: ['Obstetrician', 'Pathologist', 'Anaesthetist'], recommendations: [] },
];

const STATUS_COLORS: Record<string, string> = { Reviewed: 'bg-green-100 text-green-800', 'Pending Review': 'bg-yellow-100 text-yellow-800', 'In Review': 'bg-blue-100 text-blue-800' };

export default function MaternalDeathSurveillance() {
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
          title="Add New Maternal Death Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Maternal Death Surveillance & Response (MDSR)</h1><p className="text-gray-500">Maternal death review, avoidability assessment, and quality improvement</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Total Deaths', value: MDSR_RECORDS.length, color: 'text-red-600' }, { label: 'Reviewed', value: MDSR_RECORDS.filter(r => r.status === 'Reviewed').length, color: 'text-green-600' }, { label: 'Avoidable', value: MDSR_RECORDS.filter(r => r.avoidable.includes('Avoidable')).length, color: 'text-yellow-600' }, { label: 'Pending', value: MDSR_RECORDS.filter(r => r.status === 'Pending Review' || r.status === 'In Review').length, color: 'text-blue-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>
      <div className="space-y-4">
        {MDSR_RECORDS.map(r => (
          <div key={r.id} className="bg-white rounded-lg border p-5">
            <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><span className="font-mono text-xs text-gray-500">{r.id}</span><span className="font-bold">{r.patientName}</span><span className="text-sm text-gray-500">Age: {r.age}</span></div><Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge></div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div><span className="text-gray-500">Cause:</span> <span className="font-medium text-red-600">{r.causeOfDeath}</span></div>
              <div><span className="text-gray-500">Date:</span> {r.dateOfDeath}</div>
              <div><span className="text-gray-500">Direct Obstetric:</span> {r.directObstetric ? 'Yes' : 'No'}</div>
              <div><span className="text-gray-500">Avoidability:</span> <span className={`font-medium ${r.avoidable.includes('Avoidable') ? 'text-yellow-600' : 'text-gray-600'}`}>{r.avoidable}</span></div>
              <div><span className="text-gray-500">Delay Level:</span> {r.delayLevel}</div>
            </div>
            <div className="text-sm mb-2"><span className="text-gray-500">Review Panel:</span> {r.panel.join(', ')}</div>
            {r.recommendations.length > 0 && <div><h4 className="font-semibold text-sm mb-1">Recommendations</h4><div className="space-y-1">{r.recommendations.map((rec, i) => <div key={i} className="text-sm bg-blue-50 border border-blue-200 rounded p-2">• {rec}</div>)}</div></div>}
          </div>
        ))}
      </div>
    </div>
  );
}
