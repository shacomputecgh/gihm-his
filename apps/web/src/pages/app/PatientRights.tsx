import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';

interface PatientRight {
  id: string; right: string; description: string; status: string;
}

const RIGHTS: PatientRight[] = [
  { id: 'PR-001', right: 'Right to Dignity', description: 'Every patient shall be treated with dignity and respect regardless of age, gender, race, religion, or socio-economic status.', status: 'Active' },
  { id: 'PR-002', right: 'Right to Information', description: 'Patients have the right to receive complete and current information about their diagnosis, treatment, and prognosis.', status: 'Active' },
  { id: 'PR-003', right: 'Right to Informed Consent', description: 'Patients must give informed consent before any treatment, procedure, or research participation.', status: 'Active' },
  { id: 'PR-004', right: 'Right to Privacy', description: 'Patients have the right to privacy during examination, treatment, and discussions about their care.', status: 'Active' },
  { id: 'PR-005', right: 'Right to Confidentiality', description: 'All patient information must be kept confidential and shared only with authorised personnel.', status: 'Active' },
  { id: 'PR-006', right: 'Right to Refuse Treatment', description: 'Patients may refuse treatment after being fully informed of the consequences.', status: 'Active' },
  { id: 'PR-007', right: 'Right to Second Opinion', description: 'Patients have the right to seek a second medical opinion.', status: 'Active' },
  { id: 'PR-008', right: 'Right to Complain', description: 'Patients have the right to lodge complaints without fear of reprisal.', status: 'Active' },
];

export default function PatientRights() {
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
          title="Add New Rights Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Patient Rights & Advocacy</h1><p className="text-gray-500">Patient rights education, advocacy services, and complaint resolution</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Patient Rights', value: RIGHTS.length, color: 'text-blue-600' }, { label: 'Active Rights', value: RIGHTS.filter(r => r.status === 'Active').length, color: 'text-green-600' }, { label: 'Complaints (Month)', value: 8, color: 'text-yellow-600' }, { label: 'Resolved', value: 6, color: 'text-purple-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="space-y-3">
        {RIGHTS.map(r => (
          <div key={r.id} className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2"><span className="font-mono text-xs text-gray-500">{r.id}</span><span className="font-bold">{r.right}</span></div>
            <p className="text-sm text-gray-600">{r.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
