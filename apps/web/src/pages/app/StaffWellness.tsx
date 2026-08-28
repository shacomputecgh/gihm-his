import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface WellnessMetric {
  department: string; staffCount: number; burnoutRisk: string;
  satisfaction: number; absenteeism: number; turnover: number;
  eapAccess: number; wellbeingScore: number;
}

const DEPARTMENTS: WellnessMetric[] = [
  { department: 'Emergency', staffCount: 35, burnoutRisk: 'High', satisfaction: 3.2, absenteeism: 4.8, turnover: 12, eapAccess: 8, wellbeingScore: 62 },
  { department: 'ICU', staffCount: 20, burnoutRisk: 'High', satisfaction: 3.0, absenteeism: 5.2, turnover: 15, eapAccess: 6, wellbeingScore: 58 },
  { department: 'Surgery', staffCount: 42, burnoutRisk: 'Moderate', satisfaction: 3.8, absenteeism: 2.5, turnover: 8, eapAccess: 4, wellbeingScore: 72 },
  { department: 'Paediatrics', staffCount: 25, burnoutRisk: 'Low', satisfaction: 4.2, absenteeism: 1.8, turnover: 5, eapAccess: 3, wellbeingScore: 82 },
  { department: 'Pharmacy', staffCount: 15, burnoutRisk: 'Moderate', satisfaction: 3.5, absenteeism: 3.0, turnover: 7, eapAccess: 2, wellbeingScore: 70 },
  { department: 'Laboratory', staffCount: 12, burnoutRisk: 'Low', satisfaction: 4.0, absenteeism: 2.0, turnover: 4, eapAccess: 1, wellbeingScore: 78 },
  { department: 'Nursing', staffCount: 80, burnoutRisk: 'Moderate', satisfaction: 3.6, absenteeism: 3.5, turnover: 10, eapAccess: 15, wellbeingScore: 72 },
  { department: 'Administration', staffCount: 30, burnoutRisk: 'Low', satisfaction: 4.1, absenteeism: 2.2, turnover: 5, eapAccess: 3, wellbeingScore: 80 },
];

const RISK_STYLES: Record<string, string> = {
  'High': 'bg-red-100 text-red-800', 'Moderate': 'bg-yellow-100 text-yellow-800',
  'Low': 'bg-green-100 text-green-800',
};

export default function StaffWellness() {
  const [selected, setSelected] = useState<WellnessMetric | null>(DEPARTMENTS[0] ?? null);
  const totalStaff = DEPARTMENTS.reduce((s,d) => s+d.staffCount, 0);
  const avgWellbeing = Math.round(DEPARTMENTS.reduce((s,d) => s+d.wellbeingScore, 0) / DEPARTMENTS.length);
  const highRiskDepts = DEPARTMENTS.filter(d => d.burnoutRisk === 'High');
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
          title="Add New Lab"
          fields={[{"name": "patientName", "label": "Patient Name", "type": "text", "placeholder": "Patient name", "required": true}, {"name": "testType", "label": "Test Type", "type": "select", "options": ["Blood Test", "Urine Test", "Stool Test", "X-Ray", "Ultrasound", "ECG", "Biopsy"]}, {"name": "priority", "label": "Priority", "type": "select", "options": ["Routine", "Urgent", "STAT"]}, {"name": "clinicalHistory", "label": "Clinical History", "type": "textarea", "placeholder": "Relevant clinical information"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Staff Wellness Programme</h1><p className="text-gray-500">Burnout prevention, employee assistance, wellbeing tracking, and staff support</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Total Staff', value: totalStaff, color: 'text-blue-600' },
          { label: 'Avg Wellbeing', value: avgWellbeing, color: avgWellbeing>=75?'text-green-600':'text-yellow-600' },
          { label: 'High Burnout Risk', value: highRiskDepts.length, color: 'text-red-600' },
          { label: 'EAP Access', value: DEPARTMENTS.reduce((s,d) => s+d.eapAccess, 0), color: 'text-purple-600' },
        ].map((s,i) => <div key={i} className="bg-white rounded-lg border p-3 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>)}
      </div>
      {highRiskDepts.length>0 && <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2"><span className="text-red-600 text-xl">⚠️</span><div><div className="font-semibold text-red-800">High Burnout Risk Departments</div><div className="text-sm text-red-600">{highRiskDepts.map(d=>d.department).join(', ')} — intervention recommended</div></div></div>}
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>
            <th className="text-left p-3 font-medium text-gray-600">Department</th>
            <th className="text-right p-3 font-medium text-gray-600">Staff</th>
            <th className="text-right p-3 font-medium text-gray-600">Burnout Risk</th>
            <th className="text-right p-3 font-medium text-gray-600">Satisfaction</th>
            <th className="text-right p-3 font-medium text-gray-600">Absenteeism</th>
            <th className="text-right p-3 font-medium text-gray-600">Turnover</th>
            <th className="text-right p-3 font-medium text-gray-600">Wellbeing</th>
          </tr></thead>
          <tbody>
            {DEPARTMENTS.map(d => (
              <tr key={d.department} onClick={() => setSelected(d)} className={`border-t cursor-pointer hover:bg-gray-50 ${selected?.department===d.department?'bg-blue-50':''}`}>
                <td className="p-3 font-medium">{d.department}</td>
                <td className="p-3 text-right">{d.staffCount}</td>
                <td className="p-3 text-right"><Badge className={`text-[10px] ${RISK_STYLES[d.burnoutRisk]}`}>{d.burnoutRisk}</Badge></td>
                <td className="p-3 text-right"><span className={`font-bold ${d.satisfaction>=4?'text-green-600':d.satisfaction>=3.5?'text-yellow-600':'text-red-600'}`}>{d.satisfaction}/5</span></td>
                <td className="p-3 text-right"><span className={d.absenteeism>4?'text-red-600':'text-gray-600'}>{d.absenteeism}%</span></td>
                <td className="p-3 text-right"><span className={d.turnover>10?'text-red-600':'text-gray-600'}>{d.turnover}%</span></td>
                <td className="p-3 text-right"><div className="flex items-center justify-end gap-2"><div className="w-16 bg-gray-100 rounded-full h-2"><div className={`h-full rounded-full ${d.wellbeingScore>=75?'bg-green-500':d.wellbeingScore>=60?'bg-yellow-500':'bg-red-500'}`} style={{width:`${d.wellbeingScore}%`}}/></div><span className="text-xs font-medium">{d.wellbeingScore}</span></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
