import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface DVTPatient {
  id: string; patientName: string; ward: string; riskFactors: string[];
  riskLevel: 'High' | 'Moderate' | 'Low';
  prophylaxis: string; startDate: string;
  compliance: boolean; notes: string;
}

const DVT_PATIENTS: DVTPatient[] = [
  { id: 'DVT-001', patientName: 'Kwadwo Mensah', ward: 'Surgery', riskFactors: ['Post-abdominal surgery', 'Immobile >48h', 'Age >60', 'Obesity'], riskLevel: 'High', prophylaxis: 'Enoxaparin 40mg SC daily + TED stockings', startDate: '2026-08-22', compliance: true, notes: 'Started 12h post-op. Monitoring for bleeding.' },
  { id: 'DVT-002', patientName: 'Efua Nyarko', ward: 'Medicine', riskFactors: ['Prolonged bed rest', 'Heart failure', 'Previous DVT'], riskLevel: 'High', prophylaxis: 'Enoxaparin 40mg SC daily + IPC', startDate: '2026-08-23', compliance: true, notes: 'High recurrence risk. Continuous IPC when in bed.' },
  { id: 'DVT-003', patientName: 'Nana Agyeman', ward: 'Orthopaedics', riskFactors: ['Hip replacement surgery', 'Age >75', 'Reduced mobility'], riskLevel: 'High', prophylaxis: 'Rivaroxaban 10mg OD + TED stockings', startDate: '2026-08-21', compliance: true, notes: 'Extended prophylaxis 35 days post-surgery.' },
  { id: 'DVT-004', patientName: 'Akua Asare', ward: 'Medicine', riskFactors: ['Acute medical illness', 'BMI >30'], riskLevel: 'Moderate', prophylaxis: 'Enoxaparin 20mg SC daily', startDate: '2026-08-24', compliance: true, notes: 'Medical patient. Assess mobility daily.' },
];

const RISK_COLORS: Record<string, string> = { High: 'bg-red-100 text-red-800', Moderate: 'bg-yellow-100 text-yellow-800', Low: 'bg-green-100 text-green-800' };

export default function DVTProphylaxisTracker() {
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
          title="Add New DVT Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">DVT Prophylaxis Tracker</h1><p className="text-gray-500">Venous thromboembolism prevention, risk assessment (Padua/IMPROVE), and prophylaxis monitoring</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'High Risk', value: DVT_PATIENTS.filter(p => p.riskLevel === 'High').length, color: 'text-red-600' }, { label: 'Moderate Risk', value: DVT_PATIENTS.filter(p => p.riskLevel === 'Moderate').length, color: 'text-yellow-600' }, { label: 'Total Patients', value: DVT_PATIENTS.length, color: 'text-blue-600' }, { label: 'Compliant', value: DVT_PATIENTS.filter(p => p.compliance).length, color: 'text-green-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="space-y-3">
        {DVT_PATIENTS.map(p => (
          <div key={p.id} className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span className="font-mono text-xs text-gray-500">{p.id}</span><span className="font-bold">{p.patientName}</span><Badge className="bg-gray-100 text-gray-800">{p.ward}</Badge></div><Badge className={RISK_COLORS[p.riskLevel]}>{p.riskLevel} Risk</Badge></div>
            <div className="flex flex-wrap gap-1 mb-2">{p.riskFactors.map((rf, i) => <span key={i} className="bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded">{rf}</span>)}</div>
            <div className="grid grid-cols-2 gap-2 text-sm"><div><span className="text-gray-500">Prophylaxis:</span> <span className="font-medium text-blue-600">{p.prophylaxis}</span></div><div><span className="text-gray-500">Started:</span> {p.startDate}</div></div>
            <div className="text-sm mt-2"><span className={`font-medium ${p.compliance ? 'text-green-600' : 'text-red-600'}`}>{p.compliance ? '✅ Compliant' : '❌ Non-compliant'}</span></div>
            <div className="text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded p-2 mt-2">{p.notes}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
