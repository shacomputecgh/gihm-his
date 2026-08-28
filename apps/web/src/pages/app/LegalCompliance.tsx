import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface LegalCase {
  id: string; title: string; type: string; filedDate: string;
  status: 'Active' | 'Settled' | 'Pending Review' | 'Closed';
  plaintiff: string; defendant: string; value: number;
}

interface ComplianceItem {
  id: string; regulation: string; category: string;
  lastAudit: string; nextAudit: string; status: 'Compliant' | 'Non-Compliant' | 'Pending';
}

const LEGAL_CASES: LegalCase[] = [
  { id: 'LC-001', title: 'Delayed Diagnosis — Appendicitis', type: 'Medical Negligence', filedDate: '2026-06-15', status: 'Active', plaintiff: 'Kwame Asante', defendant: 'Hospital', value: 500000 },
  { id: 'LC-002', title: 'Consent Not Obtained — Surgery', type: 'Informed Consent', filedDate: '2026-07-01', status: 'Pending Review', plaintiff: 'Akua Mensah', defendant: 'Dr. Appiah', value: 200000 },
  { id: 'LC-003', title: 'Wrong Medication Dispensed', type: 'Pharmacy Error', filedDate: '2025-11-10', status: 'Settled', plaintiff: 'Yaw Boateng', defendant: 'Hospital', value: 150000 },
];

const COMPLIANCE: ComplianceItem[] = [
  { id: 'CP-001', regulation: 'Ghana FDA Drug Registration', category: 'Pharmacy', lastAudit: '2026-03-15', nextAudit: '2026-09-15', status: 'Compliant' },
  { id: 'CP-002', regulation: 'Data Protection Act 2012', category: 'IT/Privacy', lastAudit: '2026-04-01', nextAudit: '2026-10-01', status: 'Compliant' },
  { id: 'CP-003', regulation: 'Occupational Health & Safety', category: 'HSE', lastAudit: '2026-05-20', nextAudit: '2026-11-20', status: 'Pending' },
  { id: 'CP-004', regulation: 'National Health Insurance Act', category: 'Insurance', lastAudit: '2026-02-10', nextAudit: '2026-08-10', status: 'Non-Compliant' },
];

const STATUS_COLORS: Record<string, string> = { Active: 'bg-red-100 text-red-800', Settled: 'bg-green-100 text-green-800', 'Pending Review': 'bg-yellow-100 text-yellow-800', Closed: 'bg-gray-100 text-gray-800', Compliant: 'bg-green-100 text-green-800', 'Non-Compliant': 'bg-red-100 text-red-800', Pending: 'bg-yellow-100 text-yellow-800' };

export default function LegalCompliance() {
  const [tab, setTab] = useState<'legal' | 'compliance' | 'stats'>('legal');

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
          title="Add New Compliance Item"
          fields={[{"name":"itemTitle","label":"Item Title","type":"text","required":true},{"name":"category","label":"Category","type":"select","options":["License","Regulation","Accreditation","Policy","Contract","Other"]},{"name":"status","label":"Status","type":"select","options":["Compliant","Non-Compliant","Under Review","Pending"]},{"name":"dueDate","label":"Due Date","type":"date"},{"name":"notes","label":"Notes","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Legal & Compliance</h1><p className="text-gray-500">Incident legal tracking, regulatory compliance, malpractice cases, and policy management</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Active Cases', value: LEGAL_CASES.filter(l => l.status === 'Active').length, color: 'text-red-600' }, { label: 'Total Claims Value', value: `GH₵ ${(LEGAL_CASES.reduce((s, l) => s + l.value, 0)/1000).toFixed(0)}K`, color: 'text-orange-600' }, { label: 'Compliance Items', value: COMPLIANCE.length, color: 'text-blue-600' }, { label: 'Non-Compliant', value: COMPLIANCE.filter(c => c.status === 'Non-Compliant').length, color: 'text-red-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="flex gap-2">
        {(['legal', 'compliance', 'stats'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>{t === 'legal' ? 'Legal Cases' : t === 'compliance' ? 'Compliance' : 'Statistics'}</button>
        ))}
      </div>

      {tab === 'legal' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="text-left text-gray-500 text-xs bg-gray-50"><th className="p-3">Title</th><th className="p-3">Type</th><th className="p-3">Plaintiff</th><th className="p-3">Defendant</th><th className="p-3">Value</th><th className="p-3">Filed</th><th className="p-3">Status</th></tr></thead>
            <tbody>{LEGAL_CASES.map(l => (
              <tr key={l.id} className="border-t hover:bg-gray-50"><td className="p-3 font-medium">{l.title}</td><td className="p-3 text-xs">{l.type}</td><td className="p-3">{l.plaintiff}</td><td className="p-3">{l.defendant}</td><td className="p-3 font-bold">GH₵ {l.value.toLocaleString()}</td><td className="p-3 text-xs">{l.filedDate}</td><td className="p-3"><Badge className={STATUS_COLORS[l.status]}>{l.status}</Badge></td></tr>
            ))}</tbody></table>
        </div>
      )}

      {tab === 'compliance' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="text-left text-gray-500 text-xs bg-gray-50"><th className="p-3">Regulation</th><th className="p-3">Category</th><th className="p-3">Last Audit</th><th className="p-3">Next Audit</th><th className="p-3">Status</th></tr></thead>
            <tbody>{COMPLIANCE.map(c => (
              <tr key={c.id} className="border-t hover:bg-gray-50"><td className="p-3 font-medium">{c.regulation}</td><td className="p-3"><Badge className="bg-gray-100 text-gray-800">{c.category}</Badge></td><td className="p-3 text-xs">{c.lastAudit}</td><td className="p-3 text-xs">{c.nextAudit}</td><td className="p-3"><Badge className={STATUS_COLORS[c.status]}>{c.status}</Badge></td></tr>
            ))}</tbody></table>
        </div>
      )}

      {tab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border p-4"><h3 className="font-semibold text-sm mb-3">Case Status</h3>{['Active', 'Settled', 'Pending Review', 'Closed'].map(s => <div key={s} className="flex items-center justify-between py-2 border-b last:border-0"><Badge className={STATUS_COLORS[s]}>{s}</Badge><span className="font-bold">{LEGAL_CASES.filter(l => l.status === s).length}</span></div>)}</div>
          <div className="bg-white rounded-lg border p-4"><h3 className="font-semibold text-sm mb-3">Compliance Status</h3>{['Compliant', 'Non-Compliant', 'Pending'].map(s => <div key={s} className="flex items-center justify-between py-2 border-b last:border-0"><Badge className={STATUS_COLORS[s]}>{s}</Badge><span className="font-bold">{COMPLIANCE.filter(c => c.status === s).length}</span></div>)}</div>
        </div>
      )}
    </div>
  );
}
