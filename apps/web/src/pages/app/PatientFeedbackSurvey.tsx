import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface Survey {
  id: string; patientName: string; department: string; date: string;
  overallScore: number; recommendScore: number;
  categories: { name: string; score: number }[];
  comments: string;
}

const SURVEYS: Survey[] = [
  { id: 'SV-001', patientName: 'Kwame Asante', department: 'Cardiology', date: '2026-08-20', overallScore: 4.5, recommendScore: 5, categories: [{ name: 'Staff Friendliness', score: 5 }, { name: 'Communication', score: 4 }, { name: 'Cleanliness', score: 4 }, { name: 'Food Quality', score: 4 }, { name: 'Pain Management', score: 5 }], comments: 'Excellent care from the nursing team. Doctor explained everything clearly.' },
  { id: 'SV-002', patientName: 'Akua Mensah', department: 'Maternity', date: '2026-08-18', overallScore: 4.8, recommendScore: 5, categories: [{ name: 'Staff Friendliness', score: 5 }, { name: 'Communication', score: 5 }, { name: 'Cleanliness', score: 5 }, { name: 'Food Quality', score: 4 }, { name: 'Pain Management', score: 5 }], comments: 'Midwives were amazing! Best experience.' },
  { id: 'SV-003', patientName: 'Yaw Boateng', department: 'Emergency', date: '2026-08-15', overallScore: 3.2, recommendScore: 3, categories: [{ name: 'Staff Friendliness', score: 3 }, { name: 'Communication', score: 3 }, { name: 'Cleanliness', score: 4 }, { name: 'Food Quality', score: 3 }, { name: 'Pain Management', score: 3 }], comments: 'Waited too long. Staff seemed busy and rushed.' },
];

export default function PatientFeedbackSurvey() {
  const avgOverall = (SURVEYS.reduce((s, sv) => s + sv.overallScore, 0) / SURVEYS.length).toFixed(1);
  const nps = Math.round(((SURVEYS.filter(s => s.recommendScore >= 4).length / SURVEYS.length) * 100) - ((SURVEYS.filter(s => s.recommendScore <= 2).length / SURVEYS.length) * 100));

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
          title="Add New Survey"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Patient Feedback & Surveys</h1><p className="text-gray-500">Post-discharge surveys, satisfaction tracking, NPS score, and feedback analysis</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Avg Overall', value: `${avgOverall}/5.0`, color: 'text-blue-600' }, { label: 'NPS Score', value: nps, color: nps >= 50 ? 'text-green-600' : 'text-yellow-600' }, { label: 'Surveys', value: SURVEYS.length, color: 'text-purple-600' }, { label: 'Would Recommend', value: `${Math.round((SURVEYS.filter(s => s.recommendScore >= 4).length / SURVEYS.length) * 100)}%`, color: 'text-green-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="space-y-4">
        {SURVEYS.map(sv => (
          <div key={sv.id} className="bg-white rounded-lg border p-5">
            <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><span className="font-bold">{sv.patientName}</span><Badge className="bg-gray-100 text-gray-800">{sv.department}</Badge></div><div className="text-right"><div className="text-2xl font-bold text-blue-600">{sv.overallScore}/5.0</div><div className="text-xs text-gray-500">Recommend: {sv.recommendScore}/5</div></div></div>
            <div className="grid grid-cols-5 gap-2 mb-3">{sv.categories.map(c => (
              <div key={c.name} className="text-center"><div className="text-lg font-bold text-blue-600">{c.score}</div><div className="text-[10px] text-gray-500">{c.name}</div></div>
            ))}</div>
            <div className="bg-blue-50 border border-blue-200 rounded p-2 text-sm italic">"{sv.comments}"</div>
            <div className="text-xs text-gray-500 mt-2">{sv.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
