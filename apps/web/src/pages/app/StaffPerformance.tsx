import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface StaffAppraisal {
  id: string; staffName: string; department: string; role: string;
  period: string; overallScore: number;
  categories: { name: string; score: number }[];
  status: 'Completed' | 'Pending' | 'Overdue';
  reviewer: string;
}

const APPRAISALS: StaffAppraisal[] = [
  { id: 'AP-001', staffName: 'Ama Mensah', department: 'Nursing', role: 'Senior Nurse', period: 'Q2 2026', overallScore: 4.2, categories: [{ name: 'Clinical Skills', score: 4.5 }, { name: 'Communication', score: 4.0 }, { name: 'Teamwork', score: 4.3 }, { name: 'Leadership', score: 3.8 }, { name: 'Initiative', score: 4.2 }], status: 'Completed', reviewer: 'Nurse Director' },
  { id: 'AP-002', staffName: 'Kofi Appiah', department: 'Surgery', role: 'Consultant', period: 'Q2 2026', overallScore: 4.5, categories: [{ name: 'Clinical Skills', score: 4.8 }, { name: 'Teaching', score: 4.5 }, { name: 'Research', score: 4.2 }, { name: 'Leadership', score: 4.6 }, { name: 'Patient Care', score: 4.4 }], status: 'Completed', reviewer: 'Medical Director' },
  { id: 'AP-003', staffName: 'Efua Owusu', department: 'Pharmacy', role: 'Pharmacist', period: 'Q2 2026', overallScore: 3.8, categories: [{ name: 'Technical Skills', score: 4.0 }, { name: 'Accuracy', score: 4.2 }, { name: 'Communication', score: 3.5 }, { name: 'Initiative', score: 3.5 }], status: 'Pending', reviewer: 'Head of Pharmacy' },
  { id: 'AP-004', staffName: 'Nana Osei', department: 'Laboratory', role: 'Lab Scientist', period: 'Q2 2026', overallScore: 0, categories: [], status: 'Overdue', reviewer: 'Lab Director' },
];

const SCORE_COLOR = (score: number) => score >= 4 ? 'text-green-600' : score >= 3 ? 'text-yellow-600' : 'text-red-600';
const STATUS_COLORS: Record<string, string> = { Completed: 'bg-green-100 text-green-800', Pending: 'bg-yellow-100 text-yellow-800', Overdue: 'bg-red-100 text-red-800' };

export default function StaffPerformance() {
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
          title="Add New Performance Review"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Staff Performance & Appraisal</h1><p className="text-gray-500">KPI tracking, performance appraisals, competency assessment, and career development</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Completed', value: APPRAISALS.filter(a => a.status === 'Completed').length, color: 'text-green-600' }, { label: 'Pending', value: APPRAISALS.filter(a => a.status === 'Pending').length, color: 'text-yellow-600' }, { label: 'Overdue', value: APPRAISALS.filter(a => a.status === 'Overdue').length, color: 'text-red-600' }, { label: 'Avg Score', value: (APPRAISALS.filter(a => a.overallScore > 0).reduce((s, a) => s + a.overallScore, 0) / APPRAISALS.filter(a => a.overallScore > 0).length).toFixed(1), color: 'text-blue-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="space-y-4">
        {APPRAISALS.map(a => (
          <div key={a.id} className="bg-white rounded-lg border p-5">
            <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><span className="font-mono text-xs text-gray-500">{a.id}</span><span className="font-bold">{a.staffName}</span><span className="text-sm text-gray-500">{a.department} — {a.role}</span><Badge className={STATUS_COLORS[a.status]}>{a.status}</Badge></div>{a.overallScore > 0 && <span className={`text-2xl font-bold ${SCORE_COLOR(a.overallScore)}`}>{a.overallScore}/5.0</span>}</div>
            {a.categories.length > 0 && (
              <div className="space-y-2">
                {a.categories.map(c => (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="text-sm w-32">{c.name}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(c.score / 5) * 100}%` }} /></div>
                    <span className={`text-sm font-bold ${SCORE_COLOR(c.score)}`}>{c.score}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-4 text-xs text-gray-500 mt-3"><span>Period: {a.period}</span><span>Reviewer: {a.reviewer}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}
