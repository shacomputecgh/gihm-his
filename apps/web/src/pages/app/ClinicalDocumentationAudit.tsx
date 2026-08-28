import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface DocAudit {
  id: string; department: string; auditor: string; date: string;
  recordsAudited: number; compliant: number;
  score: number; status: 'Completed' | 'In Progress' | 'Scheduled';
  findings: string[];
}

const AUDITS: DocAudit[] = [
  { id: 'DA-001', department: 'Medicine', auditor: 'Dr. Sarah Johnson', date: '2026-08-20', recordsAudited: 50, compliant: 42, score: 84, status: 'Completed', findings: ['Missing consent forms', 'Incomplete vital signs', 'Poor documentation timeliness'] },
  { id: 'DA-002', department: 'Surgery', auditor: 'Dr. Kofi Appiah', date: '2026-08-18', recordsAudited: 30, compliant: 27, score: 90, status: 'Completed', findings: ['Good surgical notes', 'Slightly late documentation'] },
  { id: 'DA-003', department: 'Emergency', auditor: 'Dr. Emmanuel Darko', date: '2026-08-22', recordsAudited: 40, compliant: 28, score: 70, status: 'Completed', findings: ['Missing triage documentation', 'Incomplete discharge summaries', 'Medication errors in notes'] },
  { id: 'DA-004', department: 'Paediatrics', auditor: 'Dr. Ama Mensah', date: '2026-08-25', recordsAudited: 25, compliant: 0, score: 0, status: 'Scheduled', findings: [] },
];

export default function ClinicalDocumentationAudit() {
  const totalAudited = AUDITS.reduce((s, a) => s + a.recordsAudited, 0);
  const totalCompliant = AUDITS.reduce((s, a) => s + a.compliant, 0);
  const avgScore = Math.round(AUDITS.filter(a => a.score > 0).reduce((s, a) => s + a.score, 0) / AUDITS.filter(a => a.score > 0).length);

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
      <div><h1 className="text-2xl font-bold">Clinical Documentation Audit</h1><p className="text-gray-500">Documentation quality assessment, compliance tracking, and improvement initiatives</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Total Audited', value: totalAudited, color: 'text-blue-600' }, { label: 'Compliant', value: totalCompliant, color: 'text-green-600' }, { label: 'Avg Score', value: `${avgScore}%`, color: avgScore >= 80 ? 'text-green-600' : 'text-yellow-600' }, { label: 'Audits', value: AUDITS.length, color: 'text-purple-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="space-y-4">
        {AUDITS.map(a => (
          <div key={a.id} className="bg-white rounded-lg border p-5">
            <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><span className="font-mono text-xs text-gray-500">{a.id}</span><span className="font-bold">{a.department}</span><Badge className={a.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>{a.status}</Badge></div>{a.score > 0 && <span className={`text-2xl font-bold ${a.score >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>{a.score}%</span>}</div>
            {a.score > 0 && <div className="w-full bg-gray-200 rounded-full h-3 mb-3"><div className={`h-3 rounded-full ${a.score >= 80 ? 'bg-green-500' : a.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${a.score}%` }} /></div>}
            <div className="flex gap-4 text-sm text-gray-500 mb-2"><span>Records: {a.compliant}/{a.recordsAudited}</span><span>Auditor: {a.auditor}</span><span>Date: {a.date}</span></div>
            {a.findings.length > 0 && <div className="space-y-1">{a.findings.map((f, i) => <div key={i} className="text-xs bg-red-50 border border-red-200 rounded p-1.5">⚠️ {f}</div>)}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
