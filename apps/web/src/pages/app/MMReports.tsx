import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Card, PageHeader } from '../../components/ui';

interface MMRecord {
  id: string; patientName: string; age: number; gender: string; date: string;
  type: 'morbidity' | 'mortality' | 'near-miss';
  diagnosis: string; causeOfDeath?: string;
  contributingFactors: string[]; lessonsLearned: string[];
  department: string; presenter: string;
  rootCause?: string; actionItems: string[];
  status: 'presented' | 'pending' | 'action-completed';
}

const MOCK_MM: MMRecord[] = [
  { id: 'MM001', patientName: 'Nana Akua', age: 78, gender: 'Female', date: '2026-05-22', type: 'mortality', diagnosis: 'Severe Pneumonia', causeOfDeath: 'Cardiorespiratory arrest secondary to severe pneumonia with multi-organ failure', contributingFactors: ['Delayed presentation (3 days at home)', 'Poor medication adherence', 'Multiple comorbidities (DM, CKD, HTN)', 'Late initiation of antibiotics'], lessonsLearned: ['Early presentation awareness needed', 'Chronic disease patients need clearer sick-day rules', 'Antibiotic initiation should not be delayed for investigations'], department: 'Internal Medicine', presenter: 'Dr. Mensah', rootCause: 'Delayed presentation and late antibiotic initiation', actionItems: ['Community education on danger signs', 'Sick-day rules card for chronic disease patients', 'Emergency antibiotic protocol review'], status: 'presented' },
  { id: 'MM002', patientName: 'Baby Boy Tetteh', age: 0, gender: 'Male', date: '2026-05-18', type: 'morbidity', diagnosis: 'Extreme Prematurity (26 weeks) — IVH, NEC', causeOfDeath: 'Severe RDS with IVH Grade IV and NEC', contributingFactors: ['Extreme prematurity', 'No antenatal care in first trimester', 'Limited NICU ventilator capacity'], lessonsLearned: ['Antenatal steroid administration for threatened preterm labour', 'Early neonatal transport arrangement', 'NICU capacity expansion needed'], department: 'Paediatrics', presenter: 'Dr. Osei', rootCause: 'Extreme prematurity with limited NICU resources', actionItems: ['Promote antenatal care attendance', 'Establish neonatal transport agreement', 'Budget for NICU equipment'], status: 'presented' },
  { id: 'MM003', patientName: 'Kofi Mensah', age: 45, gender: 'Male', date: '2026-05-20', type: 'near-miss', diagnosis: 'Post-surgical PE', contributingFactors: ['Immobility post-fracture surgery', 'Delayed VTE prophylaxis', 'Obesity'], lessonsLearned: ['VTE risk assessment within 24 hours of admission', 'Pharmacological prophylaxis for high-risk patients', 'Early mobilization protocol'], department: 'Surgery', presenter: 'Dr. Boateng', actionItems: ['VTE risk assessment protocol', 'Pharmacy VTE prophylaxis checklist', 'Post-surgical early mobilization pathway'], status: 'action-completed' },
  { id: 'MM004', patientName: 'Abena Osei', age: 32, gender: 'Female', date: '2026-05-15', type: 'near-miss', diagnosis: 'Wrong-site injection (near-miss)', contributingFactors: ['Patient identification not verified', 'No site marking before procedure', 'Time pressure during busy shift'], lessonsLearned: ['Always verify patient identity with 2 identifiers', 'Site marking for all procedures', 'Never rush — speak up about safety concerns'], department: 'Emergency', presenter: 'Dr. Agyeman', actionItems: ['2-identifier verification training', 'Site marking protocol enforcement', 'Safety culture workshops'], status: 'presented' },
];

export default function MMReports() {
  const [tab, setTab] = useState<'all' | 'analytics'>('all');
  const typeConfig = { mortality: { label: 'Mortality', tone: 'red' as const, icon: '🕊️' }, morbidity: { label: 'Morbidity', tone: 'gold' as const, icon: '⚠️' }, 'near-miss': { label: 'Near Miss', tone: 'blue' as const, icon: '🔵' } };

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
          title="Add New Report"
          fields={[{"name":"reportTitle","label":"Report Title","type":"text","required":true},{"name":"reportType","label":"Report Type","type":"select","options":["Daily","Weekly","Monthly","Quarterly","Annual","Ad-hoc"]},{"name":"department","label":"Department","type":"select","options":["All","Medical","Nursing","Pharmacy","Laboratory","Radiology","Finance","HR"]},{"name":"dateFrom","label":"Date From","type":"date"},{"name":"dateTo","label":"Date To","type":"date"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Morbidity & Mortality Reports" subtitle="M&M conference tracking, root cause analysis, and lessons learned" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-blue-600">{MOCK_MM.length}</div><div className="text-xs text-slate-500">Total Reports</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-red-600">{MOCK_MM.filter(m => m.type === 'mortality').length}</div><div className="text-xs text-slate-500">Mortality</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-amber-600">{MOCK_MM.filter(m => m.type === 'morbidity').length}</div><div className="text-xs text-slate-500">Morbidity</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-blue-600">{MOCK_MM.filter(m => m.type === 'near-miss').length}</div><div className="text-xs text-slate-500">Near Miss</div></Card>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('all')} className={`rounded-full px-4 py-2 text-xs font-semibold transition ${tab === 'all' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}>📋 All Reports</button>
        <button onClick={() => setTab('analytics')} className={`rounded-full px-4 py-2 text-xs font-semibold transition ${tab === 'analytics' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}>📊 Analytics</button>
      </div>

      {tab === 'all' && (
        <div className="space-y-3">
          {MOCK_MM.map(m => {
            const cfg = typeConfig[m.type];
            return (
              <Card key={m.id} className={`p-4 ${m.type === 'mortality' ? 'border-l-4 border-red-400' : ''}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{cfg.icon}</span>
                  <h3 className="font-bold text-sm text-slate-800">{m.patientName}, {m.age} yrs ({m.gender})</h3>
                  <Badge tone={cfg.tone}>{cfg.label}</Badge>
                  <Badge tone={m.status === 'action-completed' ? 'green' : 'blue'}>{m.status.replace('-', ' ').toUpperCase()}</Badge>
                </div>
                <div className="text-xs text-slate-500 mb-2">{m.diagnosis} · {m.department} · {m.date} · Presented by {m.presenter}</div>
                {m.causeOfDeath && <div className="rounded bg-red-50 p-2 text-xs text-red-700 mb-2">🕊️ Cause of Death: {m.causeOfDeath}</div>}
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <div className="rounded bg-slate-50 p-2"><h4 className="text-[10px] font-bold text-slate-600">Contributing Factors:</h4><ul className="list-disc list-inside text-[10px] text-slate-600">{m.contributingFactors.map((f, i) => <li key={i}>{f}</li>)}</ul></div>
                  <div className="rounded bg-blue-50 p-2"><h4 className="text-[10px] font-bold text-blue-700">Lessons Learned:</h4><ul className="list-disc list-inside text-[10px] text-blue-600">{m.lessonsLearned.map((l, i) => <li key={i}>{l}</li>)}</ul></div>
                </div>
                {m.rootCause && <div className="mt-2 rounded bg-amber-50 p-2 text-xs text-amber-700"><strong>Root Cause:</strong> {m.rootCause}</div>}
                <div className="mt-2 rounded bg-green-50 p-2"><h4 className="text-[10px] font-bold text-green-700">Action Items:</h4><ul className="list-disc list-inside text-[10px] text-green-600">{m.actionItems.map((a, i) => <li key={i}>{a}</li>)}</ul></div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'analytics' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">📊 Reports by Type</h3>
            {Object.entries(typeConfig).map(([k, v]) => {
              const count = MOCK_MM.filter(m => m.type === k).length;
              return (<div key={k} className="flex items-center justify-between py-1 border-b last:border-0 text-xs"><span className="text-slate-600">{v.icon} {v.label}</span><span className="font-bold">{count}</span></div>);
            })}
          </Card>
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">📋 Action Item Status</h3>
            {['presented', 'pending', 'action-completed'].map(s => {
              const count = MOCK_MM.filter(m => m.status === s).length;
              return (<div key={s} className="flex items-center justify-between py-1 border-b last:border-0 text-xs"><span className="text-slate-600 capitalize">{s.replace('-', ' ')}</span><span className="font-bold">{count}</span></div>);
            })}
          </Card>
        </div>
      )}
    </div>
  );
}
