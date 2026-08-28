import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface EthicsReview {
  id: string; title: string; researcher: string; category: string;
  submittedDate: string; status: 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Conditional';
  riskLevel: 'Low' | 'Moderate' | 'High';
}

const REVIEWS: EthicsReview[] = [
  { id: 'ER-001', title: 'Efficacy of Artemether-Lumefantrine in Paediatric Malaria', researcher: 'Dr. Kofi Appiah', category: 'Drug Trial', submittedDate: '2026-07-01', status: 'Approved', riskLevel: 'Low' },
  { id: 'ER-002', title: 'Patient Satisfaction with Telemedicine Services', researcher: 'Dr. Sarah Johnson', category: 'Quality Improvement', submittedDate: '2026-08-01', status: 'Approved', riskLevel: 'Low' },
  { id: 'ER-003', title: 'Gene Therapy for Sickle Cell Disease — Phase I', researcher: 'Prof. Nana Osei', category: 'Gene Therapy', submittedDate: '2026-08-10', status: 'Under Review', riskLevel: 'High' },
  { id: 'ER-004', title: 'Herbal Medicine Usage Among Pregnant Women', researcher: 'Dr. Efua Darko', category: 'Observational', submittedDate: '2026-08-15', status: 'Submitted', riskLevel: 'Moderate' },
  { id: 'ER-005', title: 'COVID-19 Booster Vaccine Immunogenicity', researcher: 'Dr. Ama Mensah', category: 'Vaccine Trial', submittedDate: '2026-06-20', status: 'Conditional', riskLevel: 'Moderate' },
];

const STATUS_COLORS: Record<string, string> = { Submitted: 'bg-gray-100 text-gray-800', 'Under Review': 'bg-yellow-100 text-yellow-800', Approved: 'bg-green-100 text-green-800', Rejected: 'bg-red-100 text-red-800', Conditional: 'bg-blue-100 text-blue-800' };
const RISK_COLORS: Record<string, string> = { Low: 'bg-green-100 text-green-800', Moderate: 'bg-yellow-100 text-yellow-800', High: 'bg-red-100 text-red-800' };

export default function MedicalEthicsCommittee() {
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
          title="Add New Ethics Item"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Medical Ethics Committee</h1><p className="text-gray-500">Ethics review, research approval, informed consent oversight, and ethical governance</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Total Reviews', value: REVIEWS.length, color: 'text-blue-600' }, { label: 'Approved', value: REVIEWS.filter(r => r.status === 'Approved').length, color: 'text-green-600' }, { label: 'Under Review', value: REVIEWS.filter(r => r.status === 'Under Review' || r.status === 'Submitted').length, color: 'text-yellow-600' }, { label: 'High Risk', value: REVIEWS.filter(r => r.riskLevel === 'High').length, color: 'text-red-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm"><thead><tr className="text-left text-gray-500 text-xs bg-gray-50"><th className="p-3">ID</th><th className="p-3">Title</th><th className="p-3">Researcher</th><th className="p-3">Category</th><th className="p-3">Submitted</th><th className="p-3">Risk</th><th className="p-3">Status</th></tr></thead>
          <tbody>{REVIEWS.map(r => (
            <tr key={r.id} className="border-t hover:bg-gray-50"><td className="p-3 font-mono text-xs">{r.id}</td><td className="p-3 font-medium">{r.title}</td><td className="p-3 text-xs">{r.researcher}</td><td className="p-3"><Badge className="bg-gray-100 text-gray-800">{r.category}</Badge></td><td className="p-3 text-xs">{r.submittedDate}</td><td className="p-3"><Badge className={RISK_COLORS[r.riskLevel]}>{r.riskLevel}</Badge></td><td className="p-3"><Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge></td></tr>
          ))}</tbody></table>
      </div>
    </div>
  );
}
