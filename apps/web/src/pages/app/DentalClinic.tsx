import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Button, Card, PageHeader } from '../../components/ui';

type DentalTab = 'patients' | 'chart' | 'treatments' | 'analytics';

interface DentalPatient {
  id: string;
  name: string;
  age: number;
  mrn: string;
  lastVisit: string;
  nextAppointment: string;
  dentalChart: ToothStatus[];
  treatmentHistory: DentalVisit[];
  oralHygiene: 'excellent' | 'good' | 'fair' | 'poor';
  riskFactors: string[];
  notes: string;
}

interface ToothStatus {
  tooth: number;
  status: 'healthy' | 'filled' | 'crown' | 'bridge' | 'implant' | 'extraction' | 'missing' | 'root-canal' | 'cavity';
  notes?: string;
}

interface DentalVisit {
  id: string;
  date: string;
  procedures: string[];
  dentist: string;
  findings: string;
  treatment: string;
  nextVisit: string;
  cost: number;
}

const MOCK_DENTAL: DentalPatient[] = [
  { id: 'DT001', name: 'Kwame Asante', age: 36, mrn: 'MRN-001', lastVisit: '2026-04-15', nextAppointment: '2026-07-15', oralHygiene: 'fair', riskFactors: ['Diabetes', 'Smoker'], notes: 'Regular checkup. Scale and polish done.',
    dentalChart: [{ tooth: 16, status: 'filled' }, { tooth: 26, status: 'crown' }, { tooth: 36, status: 'cavity' }, { tooth: 46, status: 'filled' }, { tooth: 11, status: 'healthy' }, { tooth: 21, status: 'healthy' }, { tooth: 31, status: 'healthy' }, { tooth: 41, status: 'healthy' }],
    treatmentHistory: [{ id: 'DV001', date: '2026-04-15', procedures: ['Scale & Polish', 'Fluoride Application'], dentist: 'Dr. Dental', findings: 'Calculus deposits. Mild gingivitis. Cavity on 36.', treatment: 'Scaling completed. Fluoride applied. Cavity on 36 — advise filling at next visit.', nextVisit: '2026-07-15', cost: 150 }, { id: 'DV002', date: '2026-01-10', procedures: ['Comprehensive Exam', 'X-Ray'], dentist: 'Dr. Dental', findings: 'Crown on 26 intact. Previous fillings stable.', treatment: 'No active treatment needed.', nextVisit: '2026-04-15', cost: 80 }] },
  { id: 'DT002', name: 'Abena Osei', age: 28, mrn: 'MRN-101', lastVisit: '2026-05-20', nextAppointment: '2026-06-20', oralHygiene: 'good', riskFactors: ['Pregnancy'], notes: 'Pregnant — elective dental treatment deferred.',
    dentalChart: [{ tooth: 16, status: 'healthy' }, { tooth: 26, status: 'filled' }, { tooth: 36, status: 'healthy' }, { tooth: 46, status: 'healthy' }],
    treatmentHistory: [{ id: 'DV003', date: '2026-05-20', procedures: ['Emergency Exam', 'Pain Relief'], dentist: 'Dr. Dental', findings: 'Toothache on 26. Caries under existing filling.', treatment: 'Pain managed with Paracetamol. Definitive treatment deferred post-partum.', nextVisit: '2026-06-20', cost: 50 }] },
  { id: 'DT003', name: 'Nana Ama', age: 55, mrn: 'MRN-204', lastVisit: '2026-03-10', nextAppointment: '2026-06-10', oralHygiene: 'poor', riskFactors: ['Dementia', 'Dry mouth (medication)'], notes: 'Difficulty maintaining oral hygiene. Caregiver assistance needed.',
    dentalChart: [{ tooth: 16, status: 'missing' }, { tooth: 26, status: 'extraction' }, { tooth: 36, status: 'root-canal' }, { tooth: 46, status: 'filled' }, { tooth: 11, status: 'crown' }, { tooth: 21, status: 'missing' }, { tooth: 31, status: 'healthy' }, { tooth: 41, status: 'cavity' }],
    treatmentHistory: [{ id: 'DV004', date: '2026-03-10', procedures: ['Exam', 'Extraction (26)', 'Root Canal (36)'], dentist: 'Dr. Dental', findings: 'Extensive caries. Non-restorable tooth 26.', treatment: 'Extracted 26. Root canal on 36 started. Fluoride prescription for caregiver.', nextVisit: '2026-06-10', cost: 450 }] },
];

const TOOTH_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  healthy: { label: 'Healthy', color: 'text-green-700', bg: 'bg-green-400' },
  filled: { label: 'Filled', color: 'text-blue-700', bg: 'bg-blue-400' },
  crown: { label: 'Crown', color: 'text-purple-700', bg: 'bg-purple-400' },
  bridge: { label: 'Bridge', color: 'text-indigo-700', bg: 'bg-indigo-400' },
  implant: { label: 'Implant', color: 'text-cyan-700', bg: 'bg-cyan-400' },
  extraction: { label: 'Extracted', color: 'text-red-700', bg: 'bg-red-400' },
  missing: { label: 'Missing', color: 'text-slate-700', bg: 'bg-slate-300' },
  'root-canal': { label: 'Root Canal', color: 'text-amber-700', bg: 'bg-amber-400' },
  cavity: { label: 'Cavity', color: 'text-red-700', bg: 'bg-red-300' },
};

export default function DentalClinic() {
  const [tab, setTab] = useState<DentalTab>('patients');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

  const hygieneConfig = { excellent: { label: 'Excellent', tone: 'green' as const }, good: { label: 'Good', tone: 'green' as const }, fair: { label: 'Fair', tone: 'gold' as const }, poor: { label: 'Poor', tone: 'red' as const } };

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
          title="Add New Dental Record"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","placeholder":"e.g. Abena Mensah","required":true},{"name":"procedure","label":"Procedure","type":"select","options":["Extraction","Filling","Scaling","Root Canal","Crown","Bridge","Consultation"]},{"name":"toothNumber","label":"Tooth Number","type":"text"},{"name":"diagnosis","label":"Diagnosis","type":"text"},{"name":"notes","label":"Notes","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Dental Clinic" subtitle="Dental records, charting, treatments, and oral health tracking" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-cyan-600">{MOCK_DENTAL.length}</div><div className="text-xs text-slate-500">Patients</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">{MOCK_DENTAL.filter(p => p.oralHygiene === 'excellent' || p.oralHygiene === 'good').length}</div><div className="text-xs text-slate-500">Good Hygiene</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-red-600">{MOCK_DENTAL.reduce((s, p) => s + p.dentalChart.filter(t => t.status === 'cavity').length, 0)}</div><div className="text-xs text-slate-500">Active Cavities</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-amber-600">{MOCK_DENTAL.reduce((s, p) => s + p.dentalChart.filter(t => ['extraction', 'missing'].includes(t.status)).length, 0)}</div><div className="text-xs text-slate-500">Missing Teeth</div></Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['patients', 'chart', 'treatments', 'analytics'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-xs font-semibold transition ${tab === t ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {t === 'patients' ? '👥 Patients' : t === 'chart' ? '🦷 Dental Chart' : t === 'treatments' ? '📋 Treatments' : '📊 Analytics'}
          </button>
        ))}
      </div>

      {tab === 'patients' && (
        <div className="space-y-3">
          {MOCK_DENTAL.map(p => {
            const isExpanded = selectedPatient === p.id;
            return (
              <Card key={p.id} className={`p-4 transition-all ${isExpanded ? 'ring-2 ring-cyan-200' : ''}`}>
                <div className="flex items-start justify-between cursor-pointer" onClick={() => setSelectedPatient(isExpanded ? null : p.id)}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🦷</span>
                      <h3 className="font-bold text-slate-800">{p.name}</h3>
                      <Badge tone={hygieneConfig[p.oralHygiene].tone}>Hygiene: {hygieneConfig[p.oralHygiene].label}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>Age: {p.age}</span><span>Last: {p.lastVisit}</span><span>Next: {p.nextAppointment}</span>
                      <span>Teeth: {p.dentalChart.length} charted</span>
                    </div>
                    {p.riskFactors.length > 0 && <div className="mt-1 flex gap-1">{p.riskFactors.map(r => <span key={r} className="rounded bg-amber-50 px-1.5 text-[10px] font-medium text-amber-600">⚠️ {r}</span>)}</div>}
                  </div>
                  <span className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                </div>
                {isExpanded && (
                  <div className="mt-4 border-t pt-4 space-y-3">
                    <h4 className="font-bold text-xs text-slate-600">🦷 Dental Chart</h4>
                    <div className="flex flex-wrap gap-1">
                      {p.dentalChart.map(t => {
                        const cfg = TOOTH_STATUS_CONFIG[t.status]!;
                        return (<div key={t.tooth} className={`h-8 w-8 rounded ${cfg.bg} flex items-center justify-center text-[10px] font-bold text-white`} title={`Tooth ${t.tooth}: ${cfg.label}`}>{t.tooth}</div>);
                      })}
                    </div>
                    <div className="flex flex-wrap gap-2">{Object.entries(TOOTH_STATUS_CONFIG).map(([k, v]) => <span key={k} className="flex items-center gap-1 text-[10px]"><span className={`h-3 w-3 rounded ${v.bg}`}></span>{v.label}</span>)}</div>
                    <h4 className="font-bold text-xs text-slate-600 mt-2">📋 Visit History</h4>
                    {p.treatmentHistory.map(v => (
                      <div key={v.id} className="rounded-lg bg-slate-50 p-2">
                        <div className="flex items-center gap-2"><span className="font-bold text-xs">{v.date}</span><span className="text-[10px] text-slate-400">{v.dentist}</span><span className="text-[10px] text-green-600 font-bold">GH₵ {v.cost}</span></div>
                        <div className="text-[10px] text-slate-600 mt-1">Procedures: {v.procedures.join(', ')}</div>
                        <div className="text-[10px] text-slate-500 mt-1">📝 {v.treatment}</div>
                      </div>
                    ))}
                    <p className="text-xs text-slate-500">📝 {p.notes}</p>
                  </div>
                )}
              </Card>
            );
          })}
          <Button className="bg-cyan-600 hover:bg-cyan-700">➕ New Patient</Button>
        </div>
      )}

      {tab === 'chart' && (
        <Card className="p-6">
          <h3 className="font-bold text-lg text-slate-800 mb-4">🦷 Universal Dental Chart</h3>
          <p className="text-sm text-slate-500 mb-4">FDI Notation — 32 adult teeth</p>
          <div className="space-y-4">
            {['Upper Right (1)', 'Upper Left (2)', 'Lower Left (3)', 'Lower Right (4)'].map((quad, qi) => (
              <div key={qi}>
                <h4 className="font-bold text-xs text-slate-600 mb-2">{quad}</h4>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(t => {
                    const toothNum = qi * 8 + t;
                    return (<div key={toothNum} className="h-10 w-10 rounded-lg border-2 border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 hover:border-cyan-400 cursor-pointer transition">{toothNum}</div>);
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">{Object.entries(TOOTH_STATUS_CONFIG).map(([k, v]) => <span key={k} className="flex items-center gap-1 text-xs"><span className={`h-4 w-4 rounded ${v.bg}`}></span>{v.label}</span>)}</div>
        </Card>
      )}

      {tab === 'treatments' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {MOCK_DENTAL.flatMap(p => p.treatmentHistory.map(v => ({ ...v, patientName: p.name }))).sort((a, b) => b.date.localeCompare(a.date)).map(v => (
            <Card key={v.id} className="p-4">
              <div className="flex items-center gap-2 mb-1"><h3 className="font-bold text-sm text-slate-800">{v.patientName}</h3><span className="text-xs text-slate-400">{v.date}</span></div>
              <div className="flex flex-wrap gap-1 mb-1">{v.procedures.map(pr => <span key={pr} className="rounded bg-cyan-50 px-1.5 text-[10px] font-medium text-cyan-700">{pr}</span>)}</div>
              <div className="text-xs text-slate-600">{v.treatment}</div>
              <div className="text-xs text-green-600 font-bold mt-1">GH₵ {v.cost}</div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'analytics' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">🦷 Tooth Status Summary</h3>
            {Object.entries(TOOTH_STATUS_CONFIG).map(([k, v]) => {
              const count = MOCK_DENTAL.reduce((s, p) => s + p.dentalChart.filter(t => t.status === k).length, 0);
              if (count === 0) return null;
              return (<div key={k} className="flex items-center justify-between py-1 border-b last:border-0 text-xs"><span className="flex items-center gap-2"><span className={`h-3 w-3 rounded ${v.bg}`}></span>{v.label}</span><span className="font-bold">{count}</span></div>);
            })}
          </Card>
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">🦷 Oral Hygiene</h3>
            {(['excellent', 'good', 'fair', 'poor'] as const).map(h => {
              const count = MOCK_DENTAL.filter(p => p.oralHygiene === h).length;
              return (<div key={h} className="flex items-center justify-between py-1 border-b last:border-0 text-xs"><span className="text-slate-600 capitalize">{h}</span><span className="font-bold">{count}</span></div>);
            })}
          </Card>
        </div>
      )}
    </div>
  );
}
