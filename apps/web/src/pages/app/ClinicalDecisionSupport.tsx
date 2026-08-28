import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface Alert {
  id: string; patientName: string; type: string; severity: 'Critical' | 'Warning' | 'Info';
  message: string; evidence: string; timestamp: string;
}

interface Protocol {
  id: string; name: string; category: string; version: string;
  lastUpdated: string; compliance: number;
}

const ALERTS: Alert[] = [
  { id: 'CDS-001', patientName: 'Kwame Asante', type: 'Drug Interaction', severity: 'Critical', message: 'Warfarin + Amoxicillin interaction detected — increased bleeding risk', evidence: 'Evidence Level A: Cochrane Review 2023. Monitor INR within 3-5 days.', timestamp: '08:30' },
  { id: 'CDS-002', patientName: 'Akua Mensah', type: 'Allergy Alert', severity: 'Critical', message: 'Patient allergic to Penicillin — Amoxicillin prescribed', evidence: 'Cross-reactivity risk 1-10%. Consider azithromycin or doxycycline.', timestamp: '09:15' },
  { id: 'CDS-003', patientName: 'Nana Osei', type: 'Dose Adjustment', severity: 'Warning', message: 'Renal impairment (eGFR 25) — Metformin dose reduction required', evidence: 'eGFR < 30: contraindicated. Switch to insulin or adjust dose.', timestamp: '10:00' },
  { id: 'CDS-004', patientName: 'Efua Nyarko', type: 'Protocol Reminder', severity: 'Info', message: 'VTE prophylaxis due — patient post-surgery Day 2', evidence: 'NICE Guidelines: LMWH within 12h post-op for all surgical patients.', timestamp: '10:30' },
  { id: 'CDS-005', patientName: 'Yaw Boateng', type: 'Lab Alert', severity: 'Warning', message: 'Critical potassium level (6.2 mmol/L) — requires immediate action', evidence: 'K+ > 6.0: risk of cardiac arrhythmia. ECG + calcium gluconate.', timestamp: '11:00' },
];

const PROTOCOLS: Protocol[] = [
  { id: 'PR-001', name: 'Sepsis Bundle (Hour-1)', category: 'Emergency', version: '3.2', lastUpdated: '2026-07-01', compliance: 82 },
  { id: 'PR-002', name: 'Stroke Thrombolysis Protocol', category: 'Neurology', version: '2.1', lastUpdated: '2026-06-15', compliance: 90 },
  { id: 'PR-003', name: 'Maternal Haemorrhage Protocol', category: 'Obstetrics', version: '4.0', lastUpdated: '2026-08-01', compliance: 78 },
  { id: 'PR-004', name: 'Diabetic Ketoacidosis Protocol', category: 'Endocrinology', version: '2.5', lastUpdated: '2026-05-20', compliance: 88 },
  { id: 'PR-005', name: 'Antibiotic Stewardship Guidelines', category: 'Infection Control', version: '3.1', lastUpdated: '2026-07-15', compliance: 75 },
];

const SEV_COLORS: Record<string, string> = { Critical: 'bg-red-100 text-red-800', Warning: 'bg-yellow-100 text-yellow-800', Info: 'bg-blue-100 text-blue-800' };

export default function ClinicalDecisionSupport() {
  const [tab, setTab] = useState<'alerts' | 'protocols'>('alerts');

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
          title="Add New Clinical Rule"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Clinical Decision Support</h1><p className="text-gray-500">Drug alerts, allergy checking, protocol reminders, and evidence-based recommendations</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Critical Alerts', value: ALERTS.filter(a => a.severity === 'Critical').length, color: 'text-red-600' }, { label: 'Warnings', value: ALERTS.filter(a => a.severity === 'Warning').length, color: 'text-yellow-600' }, { label: 'Active Protocols', value: PROTOCOLS.length, color: 'text-blue-600' }, { label: 'Avg Compliance', value: `${Math.round(PROTOCOLS.reduce((s, p) => s + p.compliance, 0) / PROTOCOLS.length)}%`, color: 'text-green-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('alerts')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'alerts' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600'}`}>Active Alerts ({ALERTS.length})</button>
        <button onClick={() => setTab('protocols')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'protocols' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600'}`}>Clinical Protocols</button>
      </div>

      {tab === 'alerts' && (
        <div className="space-y-3">
          {ALERTS.sort((a, b) => { const order = { Critical: 0, Warning: 1, Info: 2 }; return order[a.severity] - order[b.severity]; }).map(a => (
            <div key={a.id} className={`bg-white rounded-lg border p-4 ${a.severity === 'Critical' ? 'border-red-300 bg-red-50' : a.severity === 'Warning' ? 'border-yellow-300' : ''}`}>
              <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span className={`text-lg ${a.severity === 'Critical' ? '🚨' : a.severity === 'Warning' ? '⚠️' : 'ℹ️'}`} /><span className="font-semibold">{a.patientName}</span><Badge className={SEV_COLORS[a.severity]}>{a.severity}</Badge><span className="text-xs text-gray-500">{a.type}</span></div><span className="text-xs text-gray-500">{a.timestamp}</span></div>
              <p className="text-sm font-medium mb-1">{a.message}</p>
              <p className="text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded p-2">{a.evidence}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'protocols' && (
        <div className="space-y-3">
          {PROTOCOLS.map(p => (
            <div key={p.id} className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span className="font-bold">{p.name}</span><Badge className="bg-gray-100 text-gray-800">{p.category}</Badge><span className="text-xs text-gray-500">v{p.version}</span></div></div>
              <div className="flex items-center justify-between"><div className="flex-1 mr-4"><div className="w-full bg-gray-200 rounded-full h-3"><div className={`h-3 rounded-full ${p.compliance >= 80 ? 'bg-green-500' : p.compliance >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${p.compliance}%` }} /></div></div><span className={`text-sm font-bold ${p.compliance >= 80 ? 'text-green-600' : p.compliance >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{p.compliance}%</span></div>
              <div className="text-xs text-gray-500 mt-1">Last Updated: {p.lastUpdated}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
