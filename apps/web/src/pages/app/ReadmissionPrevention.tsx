import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface ReadmissionRisk {
  id: string; patientName: string; diagnosis: string;
  riskScore: number; riskLevel: 'High' | 'Moderate' | 'Low';
  factors: string[]; dischargeDate: string;
  followUpPlan: string; status: 'Active' | 'Followed Up' | 'Readmitted' | 'Stable';
}

const READMISSIONS: ReadmissionRisk[] = [
  { id: 'RR-001', patientName: 'Kwadwo Mensah', diagnosis: 'Heart Failure (NYHA III)', riskScore: 75, riskLevel: 'High', factors: ['Previous 2 admissions', 'NYHA Class III', 'Low ejection fraction', 'Polypharmacy', 'Poor social support'], dischargeDate: '2026-08-20', followUpPlan: 'Heart failure clinic in 3 days, daily weight monitoring, phone call Day 1 and 3', status: 'Active' },
  { id: 'RR-002', patientName: 'Akua Asare', diagnosis: 'COPD Exacerbation', riskScore: 55, riskLevel: 'Moderate', factors: ['Smoker', 'Frequent exacerbations', 'Low BMI'], dischargeDate: '2026-08-22', followUpPlan: 'Respiratory clinic in 1 week, pulmonary rehab referral, smoking cessation', status: 'Followed Up' },
  { id: 'RR-003', patientName: 'Nana Osei', diagnosis: 'Pneumonia', riskScore: 35, riskLevel: 'Low', factors: ['Elderly', 'Diabetes'], dischargeDate: '2026-08-23', followUpPlan: 'GP follow-up in 2 weeks, complete antibiotics course', status: 'Stable' },
  { id: 'RR-004', patientName: 'Efua Nyarko', diagnosis: 'Diabetic Ketoacidosis', riskScore: 60, riskLevel: 'Moderate', factors: ['Poor glycaemic control', 'Insulin non-compliance', 'Mental health issues'], dischargeDate: '2026-08-21', followUpPlan: 'Diabetes clinic in 3 days, insulin education, social work referral', status: 'Readmitted' },
];

const RISK_COLORS: Record<string, string> = { High: 'bg-red-100 text-red-800', Moderate: 'bg-yellow-100 text-yellow-800', Low: 'bg-green-100 text-green-800' };
const STATUS_COLORS: Record<string, string> = { Active: 'bg-blue-100 text-blue-800', 'Followed Up': 'bg-green-100 text-green-800', Readmitted: 'bg-red-100 text-red-800', Stable: 'bg-gray-100 text-gray-800' };

export default function ReadmissionPrevention() {
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
          title="Add New Readmission Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Readmission Prevention</h1><p className="text-gray-500">30-day readmission risk assessment, follow-up coordination, and transitional care management</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'High Risk', value: READMISSIONS.filter(r => r.riskLevel === 'High').length, color: 'text-red-600' }, { label: 'Readmitted', value: READMISSIONS.filter(r => r.status === 'Readmitted').length, color: 'text-red-600' }, { label: 'Total Patients', value: READMISSIONS.length, color: 'text-blue-600' }, { label: 'Followed Up', value: READMISSIONS.filter(r => r.status === 'Followed Up').length, color: 'text-green-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="space-y-3">
        {READMISSIONS.sort((a, b) => b.riskScore - a.riskScore).map(r => (
          <div key={r.id} className={`bg-white rounded-lg border p-4 ${r.riskLevel === 'High' ? 'border-red-300' : ''}`}>
            <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span className="font-mono text-xs text-gray-500">{r.id}</span><span className="font-bold">{r.patientName}</span><span className="text-sm text-gray-500">{r.diagnosis}</span></div><div className="flex items-center gap-2"><Badge className={RISK_COLORS[r.riskLevel]}>{r.riskLevel} Risk</Badge><Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge></div></div>
            <div className="flex items-center gap-3 mb-2"><div className="flex-1 bg-gray-200 rounded-full h-3"><div className={`h-3 rounded-full ${r.riskScore >= 60 ? 'bg-red-500' : r.riskScore >= 40 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${r.riskScore}%` }} /></div><span className={`text-sm font-bold ${r.riskScore >= 60 ? 'text-red-600' : 'text-yellow-600'}`}>{r.riskScore}%</span></div>
            <div className="flex flex-wrap gap-1 mb-2">{r.factors.map((f, i) => <span key={i} className="bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded">{f}</span>)}</div>
            <div className="text-sm bg-blue-50 border border-blue-200 rounded p-2"><strong>Follow-up Plan:</strong> {r.followUpPlan}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
