import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Button, Card, PageHeader } from '../../components/ui';

type ICTab = 'surveillance' | 'hand-hygiene' | 'outbreaks' | 'analytics';

interface HAIRecord {
  id: string; date: string; patientName: string; mrn: string; department: string;
  infectionType: 'surgical-site' | 'cauti' | 'clabsi' | 'pneumonia' | 'c-difficile' | 'other';
  organism?: string; status: 'active' | 'resolved' | 'monitoring'; severity: 'mild' | 'moderate' | 'severe';
  reportedBy: string; isolationRequired: boolean; antibiotics: string[];
}

const MOCK_HAI: HAIRecord[] = [
  { id: 'HAI001', date: '2026-05-22', patientName: 'Test Patient A', mrn: 'MRN-301', department: 'Surgical Ward', infectionType: 'surgical-site', organism: 'MRSA', status: 'active', severity: 'moderate', reportedBy: 'Dr. Infection', isolationRequired: true, antibiotics: ['Vancomycin', 'Gentamicin'] },
  { id: 'HAI002', date: '2026-05-20', patientName: 'Test Patient B', mrn: 'MRN-302', department: 'ICU', infectionType: 'clabsi', organism: 'E. coli', status: 'monitoring', severity: 'severe', reportedBy: 'Dr. Infection', isolationRequired: false, antibiotics: ['Ceftriaxone'] },
  { id: 'HAI003', date: '2026-05-18', patientName: 'Test Patient C', mrn: 'MRN-303', department: 'Medical Ward', infectionType: 'pneumonia', organism: 'Klebsiella', status: 'resolved', severity: 'moderate', reportedBy: 'Dr. Infection', isolationRequired: false, antibiotics: ['Piperacillin-Tazobactam'] },
  { id: 'HAI004', date: '2026-05-23', patientName: 'Test Patient D', mrn: 'MRN-304', department: 'ICU', infectionType: 'cauti', organism: 'Enterococcus', status: 'active', severity: 'mild', reportedBy: 'Nurse Manager', isolationRequired: false, antibiotics: ['Ampicillin'] },
];

const HAND_HYGIENE_DATA = { compliance: 87, totalOpportunities: 450, totalCompliant: 391, byDepartment: [
  { dept: 'ICU', rate: 92 }, { dept: 'Theatre', rate: 95 }, { dept: 'Emergency', rate: 85 },
  { dept: 'Medical Ward', rate: 82 }, { dept: 'Surgical Ward', rate: 88 }, { dept: 'Paediatrics', rate: 90 },
]};

export default function InfectionControl() {
  const [tab, setTab] = useState<ICTab>('surveillance');

  const typeConfig: Record<string, { label: string; icon: string }> = { 'surgical-site': { label: 'Surgical Site', icon: '🔪' }, cauti: { label: 'CAUTI', icon: '💉' }, clabsi: { label: 'CLABSI', icon: '🩸' }, pneumonia: { label: 'Pneumonia', icon: '🫁' }, 'c-difficile': { label: 'C. Difficile', icon: '🦠' }, other: { label: 'Other', icon: '❓' } };

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
          title="Add New Infection Control Record"
          fields={[{"name":"incidentType","label":"Incident Type","type":"select","options":["HAI","Surgical Site","Catheter-Related","Ventilator-Associated","Bloodstream","Other"]},{"name":"patientName","label":"Patient Name","type":"text"},{"name":"ward","label":"Ward","type":"text"},{"name":"organism","label":"Organism","type":"text"},{"name":"dateIdentified","label":"Date Identified","type":"date"},{"name":"actions","label":"Actions Taken","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Infection Control" subtitle="Healthcare-associated infection surveillance, hand hygiene, and outbreak management" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-red-600">{MOCK_HAI.filter(h => h.status === 'active').length}</div><div className="text-xs text-slate-500">Active Infections</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-amber-600">{MOCK_HAI.filter(h => h.isolationRequired).length}</div><div className="text-xs text-slate-500">Isolation Required</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">{HAND_HYGIENE_DATA.compliance}%</div><div className="text-xs text-slate-500">Hand Hygiene</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-blue-600">{MOCK_HAI.length}</div><div className="text-xs text-slate-500">Total HAI</div></Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['surveillance', 'hand-hygiene', 'outbreaks', 'analytics'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-xs font-semibold transition ${tab === t ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {t === 'surveillance' ? '🦠 Surveillance' : t === 'hand-hygiene' ? '🧴 Hand Hygiene' : t === 'outbreaks' ? '🚨 Outbreaks' : '📊 Analytics'}
          </button>
        ))}
      </div>

      {tab === 'surveillance' && (
        <div className="space-y-3">
          {MOCK_HAI.map(h => {
            const cfg = typeConfig[h.infectionType]!;
            return (
              <Card key={h.id} className={`p-4 ${h.severity === 'severe' ? 'border-l-4 border-red-500' : h.isolationRequired ? 'border-l-4 border-amber-500' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cfg.icon}</span>
                  <h3 className="font-bold text-sm text-slate-800">{h.patientName}</h3>
                  <Badge tone={h.status === 'active' ? 'red' : h.status === 'monitoring' ? 'gold' : 'green'}>{h.status.toUpperCase()}</Badge>
                  <Badge tone={h.severity === 'severe' ? 'red' : h.severity === 'moderate' ? 'gold' : 'green'}>{h.severity}</Badge>
                  {h.isolationRequired && <Badge tone="red">🔒 Isolation</Badge>}
                </div>
                <div className="mt-1 text-xs text-slate-500">{cfg.label} · {h.department} · {h.organism ?? 'Unknown organism'}</div>
                <div className="mt-1 text-[10px] text-slate-400">Date: {h.date} · Reported by: {h.reportedBy}</div>
                <div className="mt-1 text-[10px] text-blue-600">Antibiotics: {h.antibiotics.join(', ')}</div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'hand-hygiene' && (
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">🧴 Hand Hygiene Compliance</h3>
            <div className="text-center mb-4">
              <div className="text-5xl font-bold text-green-600">{HAND_HYGIENE_DATA.compliance}%</div>
              <div className="text-xs text-slate-500">Overall Compliance ({HAND_HYGIENE_DATA.totalCompliant}/{HAND_HYGIENE_DATA.totalOpportunities} opportunities)</div>
            </div>
            <div className="space-y-2">
              {HAND_HYGIENE_DATA.byDepartment.map(d => (
                <div key={d.dept}>
                  <div className="flex justify-between text-xs"><span className="text-slate-600">{d.dept}</span><span className={`font-bold ${d.rate >= 90 ? 'text-green-600' : d.rate >= 80 ? 'text-amber-600' : 'text-red-600'}`}>{d.rate}%</span></div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${d.rate >= 90 ? 'bg-green-500' : d.rate >= 80 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${d.rate}%` }} /></div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-2">📋 WHO 5 Moments for Hand Hygiene</h3>
            <div className="space-y-1 text-xs text-slate-600">
              <p>1️⃣ Before touching a patient</p><p>2️⃣ Before clean/aseptic procedure</p><p>3️⃣ After body fluid exposure</p><p>4️⃣ After touching a patient</p><p>5️⃣ After touching patient surroundings</p>
            </div>
          </Card>
        </div>
      )}

      {tab === 'outbreaks' && (
        <Card className="p-6 text-center">
          <div className="text-4xl mb-3">🚨</div>
          <h3 className="font-bold text-lg text-slate-800">Outbreak Management</h3>
          <p className="mt-2 text-sm text-slate-500">Monitor and manage disease outbreaks within the facility.</p>
          <div className="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">✅ No active outbreaks</div>
          <Button className="mt-4 bg-red-600 hover:bg-red-700">🚨 Report Outbreak</Button>
        </Card>
      )}

      {tab === 'analytics' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">🦠 Infection Types</h3>
            {Object.entries(typeConfig).map(([k, v]) => {
              const count = MOCK_HAI.filter(h => h.infectionType === k).length;
              if (count === 0) return null;
              return (<div key={k} className="flex items-center justify-between py-1 border-b last:border-0 text-xs"><span className="text-slate-600">{v.icon} {v.label}</span><span className="font-bold">{count}</span></div>);
            })}
          </Card>
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">🏥 By Department</h3>
            {[...new Set(MOCK_HAI.map(h => h.department))].map(dept => {
              const count = MOCK_HAI.filter(h => h.department === dept).length;
              return (<div key={dept} className="flex items-center justify-between py-1 border-b last:border-0 text-xs"><span className="text-slate-600">{dept}</span><span className="font-bold">{count}</span></div>);
            })}
          </Card>
        </div>
      )}
    </div>
  );
}
