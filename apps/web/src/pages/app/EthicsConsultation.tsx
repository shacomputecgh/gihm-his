import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface EthicsConsult {
  id: string; patientName: string; issue: string; requestedBy: string;
  date: string; committee: string[];
  status: 'Submitted' | 'Under Review' | 'Decided' | 'Implemented';
  decision: string; rationale: string;
}

const CONSULTS: EthicsConsult[] = [
  { id: 'EC-001', patientName: 'Kwadwo Mensah', issue: 'Withdrawal of ventilation — end-of-life decision', requestedBy: 'Dr. Sarah Johnson', date: '2026-08-22', committee: ['Dr. Sarah Johnson', 'Dr. Kofi Appiah', 'Rev. Dr. Mensah', 'Sr. Ama Mensah', 'Hospital Admin'], status: 'Decided', decision: 'Proceed with withdrawal of ventilation — patient wishes documented, family informed and consented', rationale: 'Patient had clear advance directive. Family supports decision. Medical team confirms no further benefit from ventilation.' },
  { id: 'EC-002', patientName: 'Akua Mensah', issue: 'Blood transfusion refusal — Jehovah\'s Witness', requestedBy: 'Dr. Kofi Appiah', date: '2026-08-24', committee: ['Dr. Kofi Appiah', 'Dr. Emmanuel Darko', 'Sr. Kofi Appiah', 'Legal Counsel'], status: 'Under Review', decision: '', rationale: '' },
  { id: 'EC-003', patientName: 'Nana Osei', issue: 'Capacity assessment — consent for treatment', requestedBy: 'Dr. Ama Mensah', date: '2026-08-20', committee: ['Dr. Ama Mensah', 'Dr. Sarah Johnson', 'Social Worker'], status: 'Implemented', decision: 'Patient lacks capacity for major decisions but retains capacity for daily care decisions', rationale: 'Mental Capacity Assessment performed. Patient understands treatment benefits but cannot weigh risks.' },
];

const STATUS_COLORS: Record<string, string> = { Submitted: 'bg-gray-100 text-gray-800', 'Under Review': 'bg-yellow-100 text-yellow-800', Decided: 'bg-blue-100 text-blue-800', Implemented: 'bg-green-100 text-green-800' };

export default function EthicsConsultation() {
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
          title="Add New Ethics Consultation"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Ethics Consultation</h1><p className="text-gray-500">Ethics committee consultation requests, clinical ethics decisions, and moral distress support</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Total Consults', value: CONSULTS.length, color: 'text-blue-600' }, { label: 'Under Review', value: CONSULTS.filter(c => c.status === 'Under Review').length, color: 'text-yellow-600' }, { label: 'Decided', value: CONSULTS.filter(c => c.status === 'Decided' || c.status === 'Implemented').length, color: 'text-green-600' }, { label: 'Committee Members', value: [...new Set(CONSULTS.flatMap(c => c.committee))].length, color: 'text-purple-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>
      <div className="space-y-4">
        {CONSULTS.map(c => (
          <div key={c.id} className="bg-white rounded-lg border p-5">
            <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><span className="font-mono text-xs text-gray-500">{c.id}</span><span className="font-bold">{c.patientName}</span></div><Badge className={STATUS_COLORS[c.status]}>{c.status}</Badge></div>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3"><div className="text-xs text-yellow-600 font-semibold mb-1">Ethical Issue</div><div className="text-sm">{c.issue}</div></div>
            <div className="text-sm text-gray-600 mb-2">Requested by: {c.requestedBy} | Date: {c.date}</div>
            {c.decision && <div className="bg-green-50 border border-green-200 rounded p-3 mb-2"><div className="text-xs text-green-600 font-semibold mb-1">Decision</div><div className="text-sm">{c.decision}</div></div>}
            {c.rationale && <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-2"><div className="text-xs text-blue-600 font-semibold mb-1">Rationale</div><div className="text-sm">{c.rationale}</div></div>}
            <div className="text-xs text-gray-500">Committee: {c.committee.join(', ')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
