import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface HAICase {
  id: string; patientName: string; type: string; organism: string;
  site: string; dateIdentified: string; ward: string;
  status: 'Active' | 'Under Treatment' | 'Resolved' | 'Deceased';
}

interface HandHygieneAudit {
  department: string; observed: number; compliant: number;
}

const HAI_CASES: HAICase[] = [
  { id: 'HAI-001', patientName: 'Kwame Asante', type: 'Central Line-Associated BSI (CLABSI)', organism: 'MRSA', site: 'Central venous catheter', dateIdentified: '2026-08-22', ward: 'ICU', status: 'Active' },
  { id: 'HAI-002', patientName: 'Akua Mensah', type: 'Catheter-Associated UTI (CAUTI)', organism: 'E. coli (ESBL)', site: 'Urinary catheter', dateIdentified: '2026-08-23', ward: 'Surgery', status: 'Under Treatment' },
  { id: 'HAI-003', patientName: 'Yaw Boateng', type: 'Surgical Site Infection (SSI)', organism: 'Klebsiella pneumoniae', site: 'Abdominal wound', dateIdentified: '2026-08-21', ward: 'Surgery', status: 'Resolved' },
  { id: 'HAI-004', patientName: 'Efua Nyarko', type: 'Ventilator-Associated Pneumonia (VAP)', organism: 'Pseudomonas aeruginosa', site: 'Lungs', dateIdentified: '2026-08-24', ward: 'ICU', status: 'Active' },
  { id: 'HAI-005', patientName: 'Nana Agyeman', type: 'Clostridioides difficile Infection', organism: 'C. difficile', site: 'Gastrointestinal', dateIdentified: '2026-08-20', ward: 'Medicine', status: 'Under Treatment' },
];

const HAND_HYGIENE: HandHygieneAudit[] = [
  { department: 'ICU', observed: 120, compliant: 108 }, { department: 'Emergency', observed: 150, compliant: 125 },
  { department: 'Surgery', observed: 100, compliant: 92 }, { department: 'Maternity', observed: 80, compliant: 74 },
  { department: 'Paediatrics', observed: 90, compliant: 78 }, { department: 'Pharmacy', observed: 60, compliant: 57 },
];

const OUTBREAK_ALERS = [
  { pathogen: 'MRSA', cases: 3, wards: ['ICU', 'Surgery'], trend: 'Increasing', riskLevel: 'High' },
  { pathogen: 'ESBL E. coli', cases: 2, wards: ['Surgery', 'Medicine'], trend: 'Stable', riskLevel: 'Moderate' },
  { pathogen: 'C. difficile', cases: 2, wards: ['Medicine'], trend: 'Stable', riskLevel: 'Moderate' },
];

const STATUS_COLORS: Record<string, string> = { Active: 'bg-red-100 text-red-800', 'Under Treatment': 'bg-yellow-100 text-yellow-800', Resolved: 'bg-green-100 text-green-800', Deceased: 'bg-gray-100 text-gray-800' };
const RISK_COLORS: Record<string, string> = { High: 'bg-red-100 text-red-800', Moderate: 'bg-yellow-100 text-yellow-800', Low: 'bg-green-100 text-green-800' };

export default function InfectionControlSurveillance() {
  const [tab, setTab] = useState<'hai' | 'hygiene' | 'outbreak' | 'stats'>('hai');
  const avgCompliance = Math.round(HAND_HYGIENE.reduce((s, h) => s + (h.compliant / h.observed) * 100, 0) / HAND_HYGIENE.length);

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
          title="Add New Surveillance Record"
          fields={[{"name":"indicator","label":"Indicator","type":"select","options":["Hand Hygiene Compliance","Surgical Site Infection Rate","CAUTI Rate","CLABSI Rate","VAP Rate","C. difficile Rate"]},{"name":"value","label":"Value (%)","type":"number","required":true},{"name":"period","label":"Reporting Period","type":"text"},{"name":"department","label":"Department","type":"text"},{"name":"notes","label":"Notes","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Infection Control & Surveillance</h1><p className="text-gray-500">Healthcare-associated infection tracking, hand hygiene audits, outbreak management, and antimicrobial resistance</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Active HAI', value: HAI_CASES.filter(h => h.status === 'Active').length, color: 'text-red-600' }, { label: 'Total HAI', value: HAI_CASES.length, color: 'text-orange-600' }, { label: 'Hand Hygiene', value: `${avgCompliance}%`, color: avgCompliance >= 80 ? 'text-green-600' : 'text-red-600' }, { label: 'Outbreak Alerts', value: OUTBREAK_ALERS.length, color: 'text-yellow-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['hai', 'hygiene', 'outbreak', 'stats'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>{t === 'hai' ? 'HAI Cases' : t === 'hygiene' ? 'Hand Hygiene' : t === 'outbreak' ? 'Outbreak Alerts' : 'Statistics'}</button>
        ))}
      </div>

      {tab === 'hai' && (
        <div className="space-y-3">
          {HAI_CASES.map(h => (
            <div key={h.id} className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span className="font-mono text-xs">{h.id}</span><span className="font-semibold">{h.patientName}</span><Badge className={STATUS_COLORS[h.status]}>{h.status}</Badge></div><span className="text-xs text-gray-500">{h.ward}</span></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm"><div><span className="text-gray-500">Type:</span> {h.type}</div><div><span className="text-gray-500">Organism:</span> <span className="text-red-600 font-medium">{h.organism}</span></div><div><span className="text-gray-500">Site:</span> {h.site}</div><div><span className="text-gray-500">Identified:</span> {h.dateIdentified}</div></div>
            </div>
          ))}
        </div>
      )}

      {tab === 'hygiene' && (
        <div className="bg-white rounded-lg border p-5">
          <h3 className="font-semibold mb-4">Hand Hygiene Compliance by Department</h3>
          <div className="space-y-4">
            {HAND_HYGIENE.sort((a, b) => (b.compliant/b.observed) - (a.compliant/a.observed)).map(h => {
              const pct = Math.round((h.compliant / h.observed) * 100);
              return (
                <div key={h.department}>
                  <div className="flex justify-between text-sm mb-1"><span className="font-medium">{h.department}</span><span className={pct >= 80 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{pct}% ({h.compliant}/{h.observed})</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-3"><div className={`h-3 rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'outbreak' && (
        <div className="space-y-3">
          {OUTBREAK_ALERS.map((o, i) => (
            <div key={i} className={`bg-white rounded-lg border p-4 ${o.riskLevel === 'High' ? 'border-red-300' : 'border-yellow-300'}`}>
              <div className="flex items-center justify-between mb-2"><span className="font-bold text-lg">{o.pathogen}</span><Badge className={RISK_COLORS[o.riskLevel]}>{o.riskLevel} Risk</Badge></div>
              <div className="grid grid-cols-3 gap-2 text-sm"><div><span className="text-gray-500">Cases:</span> <span className="font-bold text-red-600">{o.cases}</span></div><div><span className="text-gray-500">Wards:</span> {o.wards.join(', ')}</div><div><span className="text-gray-500">Trend:</span> {o.trend}</div></div>
            </div>
          ))}
        </div>
      )}

      {tab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border p-4"><h3 className="font-semibold text-sm mb-3">HAI by Type</h3>{[...new Set(HAI_CASES.map(h => h.type))].map(t => <div key={t} className="flex items-center justify-between py-2 border-b last:border-0"><span className="text-sm">{t}</span><span className="font-bold">{HAI_CASES.filter(h => h.type === t).length}</span></div>)}</div>
          <div className="bg-white rounded-lg border p-4"><h3 className="font-semibold text-sm mb-3">HAI by Status</h3>{Object.keys(STATUS_COLORS).map(s => <div key={s} className="flex items-center justify-between py-2 border-b last:border-0"><Badge className={STATUS_COLORS[s]}>{s}</Badge><span className="font-bold">{HAI_CASES.filter(h => h.status === s).length}</span></div>)}</div>
        </div>
      )}
    </div>
  );
}
