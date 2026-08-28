import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface ScreeningResult {
  id: string; patientName: string; ward: string; age: number;
  mnaScore: number; riskLevel: 'Well-Nourished' | 'At Risk' | 'Malnourished';
  bmi: number; albumin: number;
  interventions: string[];
  screenedBy: string; date: string;
}

const SCREENINGS: ScreeningResult[] = [
  { id: 'NS-001', patientName: 'Efua Nyarko', ward: 'Geriatrics', age: 82, mnaScore: 18, riskLevel: 'At Risk', bmi: 19.2, albumin: 28, interventions: ['Dietitian referral', 'Oral supplements TDS', 'Weekly weight monitoring', 'Fortified meals'], screenedBy: 'Sr. Ama Mensah', date: '2026-08-24' },
  { id: 'NS-002', patientName: 'Kwadwo Mensah', ward: 'Oncology', age: 58, mnaScore: 12, riskLevel: 'Malnourished', bmi: 17.5, albumin: 24, interventions: ['NG tube feeding', 'Dietitian review', 'Daily weight', 'Nutritional support team'], screenedBy: 'Sr. Kofi Appiah', date: '2026-08-24' },
  { id: 'NS-003', patientName: 'Akua Asare', ward: 'Medicine', age: 45, mnaScore: 26, riskLevel: 'Well-Nourished', bmi: 24.5, albumin: 38, interventions: ['Standard diet', 'Encourage balanced meals'], screenedBy: 'Sr. Efua Owusu', date: '2026-08-23' },
  { id: 'NS-004', patientName: 'Nana Agyeman', ward: 'ICU', age: 72, mnaScore: 8, riskLevel: 'Malnourished', bmi: 16.8, albumin: 22, interventions: ['Enteral feeding', 'Nutritional support team', 'Daily calories target', 'Micronutrient supplementation'], screenedBy: 'Sr. Ama Mensah', date: '2026-08-24' },
];

const RISK_COLORS: Record<string, string> = { 'Well-Nourished': 'bg-green-100 text-green-800', 'At Risk': 'bg-yellow-100 text-yellow-800', Malnourished: 'bg-red-100 text-red-800' };

export default function NutritionalScreening() {
  const malnourished = SCREENINGS.filter(s => s.riskLevel === 'Malnourished').length;

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
          title="Add New Nutritional Screening"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Nutritional Screening & Assessment</h1><p className="text-gray-500">Malnutrition screening (MNA), BMI assessment, albumin monitoring, and nutritional interventions</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Total Screened', value: SCREENINGS.length, color: 'text-blue-600' }, { label: 'Well-Nourished', value: SCREENINGS.filter(s => s.riskLevel === 'Well-Nourished').length, color: 'text-green-600' }, { label: 'At Risk', value: SCREENINGS.filter(s => s.riskLevel === 'At Risk').length, color: 'text-yellow-600' }, { label: 'Malnourished', value: malnourished, color: 'text-red-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="space-y-3">
        {SCREENINGS.map(s => (
          <div key={s.id} className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span className="font-mono text-xs text-gray-500">{s.id}</span><span className="font-bold">{s.patientName}</span><span className="text-sm text-gray-500">{s.age} years | {s.ward}</span></div><Badge className={RISK_COLORS[s.riskLevel]}>{s.riskLevel}</Badge></div>
            <div className="grid grid-cols-4 gap-3 text-sm mb-2">
              <div className="bg-gray-50 rounded p-2 text-center"><div className="font-bold">{s.mnaScore}/30</div><div className="text-xs text-gray-500">MNA Score</div></div>
              <div className="bg-gray-50 rounded p-2 text-center"><div className="font-bold">{s.bmi}</div><div className="text-xs text-gray-500">BMI</div></div>
              <div className="bg-gray-50 rounded p-2 text-center"><div className="font-bold">{s.albumin} g/L</div><div className="text-xs text-gray-500">Albumin</div></div>
              <div className="bg-gray-50 rounded p-2 text-center"><div className="font-bold text-xs">{s.date}</div><div className="text-xs text-gray-500">Screened</div></div>
            </div>
            <div className="flex flex-wrap gap-1">{s.interventions.map((int, i) => <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">{int}</span>)}</div>
            <div className="text-xs text-gray-500 mt-1">Screened by: {s.screenedBy}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
