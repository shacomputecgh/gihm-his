import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Card, PageHeader } from '../../components/ui';

interface AuditRecord {
  id: string; title: string; department: string; date: string; auditor: string;
  category: 'clinical' | 'surgical' | 'pharmacy' | 'laboratory' | 'infection-control' | 'documentation';
  standard: string; compliance: number; findings: string[]; recommendations: string[];
  status: 'active' | 'completed' | 'follow-up';
}

const MOCK_AUDITS: AuditRecord[] = [
  { id: 'AUD001', title: 'Hand Hygiene Compliance Audit', department: 'All Departments', date: '2026-05-20', auditor: 'Infection Control', category: 'infection-control', standard: 'WHO 5 Moments', compliance: 87, findings: ['ICU compliance 92%', 'Emergency compliance 85%', 'Medical Ward compliance 82%', 'Opportunities missed during patient transfer'], recommendations: ['Reinforce training in Medical Ward', 'Place hand sanitizer at bed entry points', 'Weekly spot checks'], status: 'active' },
  { id: 'AUD002', title: 'Antibiotic Prescribing Audit', department: 'Clinical', date: '2026-05-15', auditor: 'Pharmacy', category: 'pharmacy', standard: 'GHS Antibiotic Guidelines', compliance: 78, findings: ['62% empirical prescriptions appropriate', '38% missing culture before antibiotics', 'Ceftriaxone overused', 'Duration often longer than recommended'], recommendations: ['Mandatory culture before broad-spectrum antibiotics', 'Antibiotic stewardship committee meetings', 'Clinical pharmacist review of all IV antibiotics'], status: 'active' },
  { id: 'AUD003', title: 'Surgical Safety Checklist Audit', department: 'Theatre', date: '2026-05-10', auditor: 'Quality Assurance', category: 'surgical', standard: 'WHO Surgical Safety Checklist', compliance: 95, findings: ['Sign In: 98% complete', 'Time Out: 95% complete', 'Sign Out: 88% complete', 'Team introduction occasionally skipped'], recommendations: ['Emphasize Sign Out completion', 'Theatre induction for new staff', 'Monthly audit'], status: 'completed' },
  { id: 'AUD004', title: 'Medication Administration Audit', department: 'Nursing', date: '2026-05-05', auditor: 'Clinical Nurse Specialist', category: 'clinical', standard: 'Hospital Medication Policy', compliance: 91, findings: ['5 rights check in 91% of observations', 'PRN medications documented in 85%', 'Double-check for high-alert meds in 94%', 'Barcode scanning compliance 78%'], recommendations: ['Improve barcode scanning compliance', 'PRN documentation training', 'High-alert medication double-check protocol reinforcement'], status: 'completed' },
  { id: 'AUD005', title: 'Discharge Documentation Audit', department: 'Clinical', date: '2026-04-30', auditor: 'Medical Records', category: 'documentation', standard: 'GHS Discharge Summary Policy', compliance: 72, findings: ['Discharge summary completed within 24h: 72%', 'Medication reconciliation documented: 68%', 'Follow-up appointments specified: 85%', 'Patient instructions provided: 90%'], recommendations: ['Mandate discharge summary template', 'Medical officer education on timely completion', 'Discharge coordinator role', 'Electronic discharge system'], status: 'follow-up' },
];

export default function ClinicalAudit() {
  const [tab, setTab] = useState<'all' | 'analytics'>('all');
  const avgCompliance = MOCK_AUDITS.reduce((s, a) => s + a.compliance, 0) / MOCK_AUDITS.length;

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
          title="Add New Clinical Audit"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Clinical Audit" subtitle="Quality metrics, clinical audits, and performance tracking" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-blue-600">{MOCK_AUDITS.length}</div><div className="text-xs text-slate-500">Total Audits</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">{avgCompliance.toFixed(0)}%</div><div className="text-xs text-slate-500">Avg Compliance</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-amber-600">{MOCK_AUDITS.filter(a => a.status === 'active').length}</div><div className="text-xs text-slate-500">Active</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-purple-600">{MOCK_AUDITS.reduce((s, a) => s + a.recommendations.length, 0)}</div><div className="text-xs text-slate-500">Recommendations</div></Card>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('all')} className={`rounded-full px-4 py-2 text-xs font-semibold transition ${tab === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>📋 All Audits</button>
        <button onClick={() => setTab('analytics')} className={`rounded-full px-4 py-2 text-xs font-semibold transition ${tab === 'analytics' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>📊 Analytics</button>
      </div>

      {tab === 'all' && (
        <div className="space-y-3">
          {MOCK_AUDITS.map(a => (
            <Card key={a.id} className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-sm text-slate-800">{a.title}</h3>
                <Badge tone={a.status === 'active' ? 'blue' : a.status === 'completed' ? 'green' : 'gold'}>{a.status.toUpperCase()}</Badge>
              </div>
              <div className="text-xs text-slate-500 mb-2">{a.department} · {a.date} · {a.auditor}</div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-slate-600">Compliance:</span>
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${a.compliance >= 90 ? 'bg-green-500' : a.compliance >= 80 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${a.compliance}%` }} />
                </div>
                <span className={`text-xs font-bold ${a.compliance >= 90 ? 'text-green-600' : a.compliance >= 80 ? 'text-amber-600' : 'text-red-600'}`}>{a.compliance}%</span>
              </div>
              <div className="text-[10px] text-slate-400 mb-1">Standard: {a.standard}</div>
              <div className="rounded bg-slate-50 p-2 mb-2"><h4 className="text-[10px] font-bold text-slate-600">Findings:</h4><ul className="list-disc list-inside text-[10px] text-slate-600">{a.findings.map((f, i) => <li key={i}>{f}</li>)}</ul></div>
              <div className="rounded bg-blue-50 p-2"><h4 className="text-[10px] font-bold text-blue-700">Recommendations:</h4><ul className="list-disc list-inside text-[10px] text-blue-600">{a.recommendations.map((r, i) => <li key={i}>{r}</li>)}</ul></div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'analytics' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">📊 Compliance by Category</h3>
            {['infection-control', 'pharmacy', 'surgical', 'clinical', 'documentation'].map(cat => {
              const audits = MOCK_AUDITS.filter(a => a.category === cat);
              if (audits.length === 0) return null;
              const avg = audits.reduce((s, a) => s + a.compliance, 0) / audits.length;
              return (<div key={cat} className="mb-2"><div className="flex justify-between text-xs"><span className="text-slate-600 capitalize">{cat.replace('-', ' ')}</span><span className="font-bold">{avg.toFixed(0)}%</span></div><div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${avg >= 90 ? 'bg-green-500' : avg >= 80 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${avg}%` }} /></div></div>);
            })}
          </Card>
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">📋 Audit Status</h3>
            {['active', 'completed', 'follow-up'].map(s => {
              const count = MOCK_AUDITS.filter(a => a.status === s).length;
              return (<div key={s} className="flex items-center justify-between py-1 border-b last:border-0 text-xs"><span className="text-slate-600 capitalize">{s}</span><span className="font-bold">{count}</span></div>);
            })}
          </Card>
        </div>
      )}
    </div>
  );
}
