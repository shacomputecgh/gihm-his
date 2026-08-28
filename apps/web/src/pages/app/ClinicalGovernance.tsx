import { useState } from 'react';
import { Badge, Button, Card, Input, Select, useToast } from '../../components/ui';

interface ClinicalGovernanceRecord {
  id: string; title: string; category: string; department: string;
  date: string; responsiblePerson: string; description: string;
  status: 'Open' | 'In Progress' | 'Completed' | 'Overdue' | 'Escalated';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  actionItems: string[]; reviewDate: string;
}

const INITIAL: ClinicalGovernanceRecord[] = [
  { id: 'CG-001', title: 'Hand Hygiene Compliance Below Target', category: 'Infection Control', department: 'Emergency', date: '2026-08-20', responsiblePerson: 'Dr. Asante', description: 'Hand hygiene compliance dropped to 72% in ED. Target is 90%.', status: 'In Progress', priority: 'High', actionItems: ['Additional hand hygiene stations installed', 'Staff re-training scheduled', 'Weekly audit commenced'], reviewDate: '2026-09-01' },
  { id: 'CG-002', title: 'Medication Error Root Cause Analysis', category: 'Patient Safety', department: 'Pharmacy', date: '2026-08-18', responsiblePerson: 'Pharm. Osei', description: 'Three medication errors in surgical ward this month. Root cause analysis required.', status: 'Open', priority: 'Critical', actionItems: ['Conduct root cause analysis', 'Review prescribing workflow', 'Implement barcode scanning'], reviewDate: '2026-08-28' },
  { id: 'CG-003', title: 'Bed Sore Prevention Audit', category: 'Quality', department: 'Geriatric Ward', date: '2026-08-15', responsiblePerson: 'Nurse Ama', description: 'Quarterly audit of pressure ulcer prevention measures completed.', status: 'Completed', priority: 'Medium', actionItems: ['Audit completed', 'Report submitted to quality committee'], reviewDate: '2026-08-30' },
  { id: 'CG-004', title: 'Patient Complaint — Wait Time Exceeding 4 Hours', category: 'Patient Experience', department: 'OPD', date: '2026-08-22', responsiblePerson: 'Dr. Osei', description: 'Multiple complaints about OPD wait times exceeding 4 hours during peak days.', status: 'Open', priority: 'High', actionItems: ['Analyse peak hour data', 'Propose additional consultation rooms', 'Implement queue management system'], reviewDate: '2026-09-05' },
];

const CATEGORIES = ['Infection Control', 'Patient Safety', 'Quality', 'Patient Experience', 'Staff Training', 'Facility Management', 'Compliance', 'Mortality Review', 'Clinical Audit'];
const DEPARTMENTS = ['Emergency', 'Medical Ward', 'Surgical Ward', 'ICU', 'Maternity', 'Pharmacy', 'Laboratory', 'Radiology', 'OPD', 'Theatre', 'Paediatric', 'All'];
const PRIORITY_COLORS: Record<string, string> = { Low: 'bg-blue-100 text-blue-800', Medium: 'bg-yellow-100 text-yellow-800', High: 'bg-orange-100 text-orange-800', Critical: 'bg-red-100 text-red-800' };
const STATUS_CONFIG: Record<string, { color: string; tone: 'green' | 'gold' | 'red' | 'gray' | 'blue' }> = {
  Open: { color: 'bg-blue-100 text-blue-800', tone: 'blue' }, 'In Progress': { color: 'bg-yellow-100 text-yellow-800', tone: 'gold' },
  Completed: { color: 'bg-green-100 text-green-800', tone: 'green' }, Overdue: { color: 'bg-red-100 text-red-800', tone: 'red' },
  Escalated: { color: 'bg-red-200 text-red-900', tone: 'red' },
};

export default function ClinicalGovernance() {
  const [records, setRecords] = useState<ClinicalGovernanceRecord[]>(INITIAL);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');
  const toast = useToast();
  const filtered = records.filter((r) => !filter || r.status === filter || r.priority === filter);
  const overdue = records.filter((r) => r.status === 'Overdue' || (new Date(r.reviewDate) < new Date() && r.status !== 'Completed')).length;

  const handleAdd = (data: { title: string; category: string; department: string; responsiblePerson: string; description: string; priority: string }) => {
    const r = {
      id: `CG-${String(records.length + 1).padStart(3, '0')}`, ...data, date: new Date().toISOString().split('T')[0],
      status: 'Open' as const, actionItems: [] as string[], reviewDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    };
    setRecords([r as ClinicalGovernanceRecord, ...records]); setShowForm(false); toast('Governance issue created');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Clinical Governance</h1><p className="text-gray-500">Incident tracking, clinical audits, quality improvement, and compliance management</p></div>
        <Button onClick={() => setShowForm(true)}>+ New Issue</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(STATUS_CONFIG).map(([status]) => (
          <button key={status} onClick={() => setFilter(filter === status ? '' : status)} className={`p-3 rounded-lg border text-center transition ${filter === status ? 'ring-2 ring-green-500 border-green-300' : 'border-slate-200 hover:bg-slate-50'}`}>
            <div className="text-xl font-bold">{records.filter((r) => r.status === status).length}</div>
            <div className="text-xs text-slate-500">{status}</div>
          </button>
        ))}
      </div>
      {overdue > 0 && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 font-medium">⚠️ {overdue} issue(s) overdue or past review date</div>}
      <div className="space-y-3">
        {filtered.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold">{r.title}</h3>
                <p className="text-sm text-gray-500">{r.category} · {r.department} · {r.responsiblePerson} · {r.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_COLORS[r.priority]}`}>{r.priority}</span>
                <Badge tone={STATUS_CONFIG[r.status]?.tone}>{r.status}</Badge>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">{r.description}</p>
            {r.actionItems.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-2">
                <h4 className="text-xs font-medium text-gray-500 mb-1">Action Items:</h4>
                <ul className="list-disc list-inside text-sm text-gray-600">{r.actionItems.map((a, i) => <li key={i}>{a}</li>)}</ul>
              </div>
            )}
            <div className="text-xs text-gray-400 mt-2">Review by: {r.reviewDate}</div>
          </Card>
        ))}
      </div>
      {showForm && <AddForm onSubmit={handleAdd} onClose={() => setShowForm(false)} />}
    </div>
  );
}

function AddForm({ onSubmit, onClose }: { onSubmit: (data: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({ title: '', category: 'Infection Control', department: 'All', responsiblePerson: '', description: '', priority: 'Medium' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-bold">✕</button>
        <h2 className="text-lg font-bold mb-4">New Clinical Governance Issue</h2>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Title *</label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium mb-1">Category</label><Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select></div>
            <div><label className="block text-sm font-medium mb-1">Department</label><Select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</Select></div>
            <div><label className="block text-sm font-medium mb-1">Priority</label><Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{['Low', 'Medium', 'High', 'Critical'].map((p) => <option key={p}>{p}</option>)}</Select></div>
            <div><label className="block text-sm font-medium mb-1">Responsible *</label><Input value={form.responsiblePerson} onChange={(e) => setForm({ ...form, responsiblePerson: e.target.value })} /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">Description *</label><textarea className="w-full border rounded-lg p-2 text-sm" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => onSubmit(form)}>Create Issue</Button></div>
        </div>
      </div>
    </div>
  );
}
