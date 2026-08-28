import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface CleaningAudit {
  id: string; ward: string; auditor: string; date: string;
  score: number; totalChecks: number; passed: number;
  status: 'Passed' | 'Failed' | 'Conditional';
  findings: string[];
}

const AUDITS: CleaningAudit[] = [
  { id: 'CA-001', ward: 'ICU', auditor: 'Infection Control Nurse', date: '2026-08-24', score: 92, totalChecks: 25, passed: 23, status: 'Passed', findings: ['Hand hygiene station well-stocked', 'Floor cleanliness excellent'] },
  { id: 'CA-002', ward: 'Surgery', auditor: 'Infection Control Nurse', date: '2026-08-23', score: 85, totalChecks: 25, passed: 21, status: 'Conditional', findings: ['Medical waste bin 80% full', 'Surface disinfection needed in Bay 3'] },
  { id: 'CA-003', ward: 'Maternity', auditor: 'Quality Manager', date: '2026-08-22', score: 96, totalChecks: 25, passed: 24, status: 'Passed', findings: ['Excellent hand hygiene compliance', 'Baby-friendly corner well-maintained'] },
  { id: 'CA-004', ward: 'Emergency', auditor: 'Infection Control Nurse', date: '2026-08-21', score: 75, totalChecks: 25, passed: 18, status: 'Failed', findings: ['Blood spill not cleaned promptly', 'Sharps bin overflowing', 'Hand soap dispenser empty', 'Floor soiled in triage area'] },
  { id: 'CA-005', ward: 'Pharmacy', auditor: 'Quality Manager', date: '2026-08-20', score: 88, totalChecks: 25, passed: 22, status: 'Passed', findings: ['Clean room compliance good', 'Temperature log maintained'] },
];

const STATUS_COLORS: Record<string, string> = { Passed: 'bg-green-100 text-green-800', Failed: 'bg-red-100 text-red-800', Conditional: 'bg-yellow-100 text-yellow-800' };

export default function WardCleaningAudit() {
  const avgScore = Math.round(AUDITS.reduce((s, a) => s + a.score, 0) / AUDITS.length);
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
          title="Add New Appointment"
          fields={[{"name": "patientName", "label": "Patient Name", "type": "text", "placeholder": "Patient name", "required": true}, {"name": "doctor", "label": "Doctor", "type": "text", "placeholder": "Doctor name", "required": true}, {"name": "date", "label": "Date", "type": "date", "required": true}, {"name": "time", "label": "Time", "type": "text", "placeholder": "e.g. 09:00 AM", "required": true}, {"name": "type", "label": "Type", "type": "select", "options": ["Consultation", "Follow-up", "Emergency", "Surgery"]}, {"name": "notes", "label": "Notes", "type": "textarea", "placeholder": "Additional notes"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Ward Cleaning & Hygiene Audit</h1><p className="text-gray-500">Cleaning schedule compliance, hygiene auditing, and infection prevention monitoring</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Total Audits', value: AUDITS.length, color: 'text-blue-600' }, { label: 'Avg Score', value: `${avgScore}%`, color: avgScore >= 85 ? 'text-green-600' : 'text-yellow-600' }, { label: 'Passed', value: AUDITS.filter(a => a.status === 'Passed').length, color: 'text-green-600' }, { label: 'Failed', value: AUDITS.filter(a => a.status === 'Failed').length, color: 'text-red-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>
      <div className="space-y-4">
        {AUDITS.sort((a, b) => a.score - b.score).map(a => (
          <div key={a.id} className={`bg-white rounded-lg border p-4 ${a.status === 'Failed' ? 'border-red-300' : ''}`}>
            <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><span className="font-mono text-xs text-gray-500">{a.id}</span><span className="font-bold">{a.ward}</span></div><Badge className={STATUS_COLORS[a.status]}>{a.status}</Badge></div>
            <div className="flex items-center gap-4 mb-2">
              <div className="flex-1 bg-gray-200 rounded-full h-4"><div className={`h-4 rounded-full ${a.score >= 85 ? 'bg-green-500' : a.score >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${a.score}%` }} /></div>
              <span className={`text-lg font-bold ${a.score >= 85 ? 'text-green-600' : a.score >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>{a.score}%</span>
            </div>
            <div className="text-xs text-gray-500 mb-2">Checks: {a.passed}/{a.totalChecks} passed | Auditor: {a.auditor} | Date: {a.date}</div>
            <div className="space-y-1">{a.findings.map((f, i) => <div key={i} className={`text-xs rounded p-1.5 ${a.status === 'Failed' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>• {f}</div>)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
