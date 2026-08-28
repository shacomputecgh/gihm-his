import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';

interface SurveyResult {
  id: string; department: string; respondents: number;
  overallScore: number; dimensions: { name: string; score: number }[];
  period: string;
}

const SURVEYS: SurveyResult[] = [
  { id: 'SC-001', department: 'ICU', respondents: 18, overallScore: 3.8, dimensions: [{ name: 'Reporting Culture', score: 4.0 }, { name: 'Learning Culture', score: 3.5 }, { name: 'Flexibility', score: 3.8 }, { name: 'Teamwork', score: 4.2 }], period: 'Q2 2026' },
  { id: 'SC-002', department: 'Emergency', respondents: 25, overallScore: 3.5, dimensions: [{ name: 'Reporting Culture', score: 3.2 }, { name: 'Learning Culture', score: 3.3 }, { name: 'Flexibility', score: 3.8 }, { name: 'Teamwork', score: 3.7 }], period: 'Q2 2026' },
  { id: 'SC-003', department: 'Surgery', respondents: 30, overallScore: 4.1, dimensions: [{ name: 'Reporting Culture', score: 4.2 }, { name: 'Learning Culture', score: 4.0 }, { name: 'Flexibility', score: 4.1 }, { name: 'Teamwork', score: 4.3 }], period: 'Q2 2026' },
  { id: 'SC-004', department: 'Maternity', respondents: 22, overallScore: 4.3, dimensions: [{ name: 'Reporting Culture', score: 4.4 }, { name: 'Learning Culture', score: 4.2 }, { name: 'Flexibility', score: 4.3 }, { name: 'Teamwork', score: 4.5 }], period: 'Q2 2026' },
  { id: 'SC-005', department: 'Pharmacy', respondents: 12, overallScore: 4.0, dimensions: [{ name: 'Reporting Culture', score: 4.1 }, { name: 'Learning Culture', score: 3.8 }, { name: 'Flexibility', score: 4.0 }, { name: 'Teamwork', score: 4.2 }], period: 'Q2 2026' },
];

const SCORE_COLOR = (s: number) => s >= 4 ? 'text-green-600' : s >= 3 ? 'text-yellow-600' : 'text-red-600';

export default function PatientSafetyCulture() {
  const avgScore = (SURVEYS.reduce((s, sv) => s + sv.overallScore, 0) / SURVEYS.length).toFixed(1);
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
          title="Add New Safety Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Patient Safety Culture Survey</h1><p className="text-gray-500">Safety culture assessment, staff perception analysis, and improvement tracking (AHRQ SOPS)</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Departments Surveyed', value: SURVEYS.length, color: 'text-blue-600' }, { label: 'Total Respondents', value: SURVEYS.reduce((s, sv) => s + sv.respondents, 0), color: 'text-green-600' }, { label: 'Overall Average', value: `${avgScore}/5.0`, color: 'text-purple-600' }, { label: 'Period', value: 'Q2 2026', color: 'text-orange-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>
      <div className="space-y-4">
        {SURVEYS.sort((a, b) => b.overallScore - a.overallScore).map(sv => (
          <div key={sv.id} className="bg-white rounded-lg border p-5">
            <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><span className="font-bold">{sv.department}</span><span className="text-sm text-gray-500">{sv.respondents} respondents</span></div><span className={`text-2xl font-bold ${SCORE_COLOR(sv.overallScore)}`}>{sv.overallScore}/5.0</span></div>
            <div className="grid grid-cols-4 gap-3">{sv.dimensions.map(d => (
              <div key={d.name} className="text-center"><div className={`text-lg font-bold ${SCORE_COLOR(d.score)}`}>{d.score}</div><div className="text-[10px] text-gray-500">{d.name}</div><div className="w-full bg-gray-200 rounded-full h-1.5 mt-1"><div className={`h-1.5 rounded-full ${d.score >= 4 ? 'bg-green-500' : d.score >= 3 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${(d.score / 5) * 100}%` }} /></div></div>
            ))}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
