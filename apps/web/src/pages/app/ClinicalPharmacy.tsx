import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface DrugInteraction {
  id: string; drugA: string; drugB: string; severity: 'Major' | 'Moderate' | 'Minor';
  effect: string; recommendation: string;
}

interface TDMRecord {
  id: string; patientName: string; drug: string; level: string; targetRange: string;
  status: 'Therapeutic' | 'Sub-therapeutic' | 'Toxic' | 'Pending';
  lastChecked: string; nextDue: string; route: string;
}

const INTERACTIONS: DrugInteraction[] = [
  { id: 'INT-001', drugA: 'Warfarin', drugB: 'Amoxicillin', severity: 'Moderate', effect: 'Increased anticoagulant effect — risk of bleeding', recommendation: 'Monitor INR closely for 1-2 weeks. Consider dose adjustment.' },
  { id: 'INT-002', drugA: 'Metformin', drugB: 'Iodinated Contrast', severity: 'Major', effect: 'Risk of lactic acidosis', recommendation: 'Withhold metformin 48 hours before and after contrast administration.' },
  { id: 'INT-003', drugA: 'Ciprofloxacin', drugB: 'Omeprazole', severity: 'Moderate', effect: 'Decreased ciprofloxacin absorption', recommendation: 'Separate administration by 2 hours. Consider alternative PPI.' },
  { id: 'INT-004', drugA: 'Digoxin', drugB: 'Amiodarone', severity: 'Major', effect: 'Increased digoxin levels — risk of toxicity', recommendation: 'Reduce digoxin dose by 50%. Monitor levels frequently.' },
  { id: 'INT-005', drugA: 'Lithium', drugB: 'Ibuprofen', severity: 'Major', effect: 'Increased lithium levels — nephrotoxicity risk', recommendation: 'Avoid combination. Use paracetamol instead for pain relief.' },
  { id: 'INT-006', drugA: 'Methotrexate', drugB: 'Trimethoprim', severity: 'Major', effect: 'Increased methotrexate toxicity — bone marrow suppression', recommendation: 'Avoid combination. Monitor FBC if unavoidable.' },
  { id: 'INT-007', drugA: 'Potassium', drugB: 'Spironolactone', severity: 'Moderate', effect: 'Hyperkalaemia risk', recommendation: 'Monitor serum potassium regularly. Avoid potassium supplements.' },
  { id: 'INT-008', drugA: 'Phenytoin', drugB: 'Fluconazole', severity: 'Major', effect: 'Increased phenytoin levels — toxicity risk', recommendation: 'Reduce phenytoin dose. Monitor levels and clinical signs.' },
];

const TDM_RECORDS: TDMRecord[] = [
  { id: 'TDM-001', patientName: 'Kwame Asante', drug: 'Vancomycin', level: '15.2 mg/L', targetRange: '15-20 mg/L', status: 'Therapeutic', lastChecked: '2026-08-23', nextDue: '2026-08-25', route: 'IV' },
  { id: 'TDM-002', patientName: 'Akua Mensah', drug: 'Gentamicin', level: '2.1 mg/L (trough)', targetRange: '< 2 mg/L', status: 'Toxic', lastChecked: '2026-08-24', nextDue: '2026-08-24', route: 'IV' },
  { id: 'TDM-003', patientName: 'Kofi Appiah', drug: 'Phenytoin', level: '8.5 mg/L', targetRange: '10-20 mg/L', status: 'Sub-therapeutic', lastChecked: '2026-08-22', nextDue: '2026-08-29', route: 'Oral' },
  { id: 'TDM-004', patientName: 'Ama Osei', drug: 'Lithium', level: '0.7 mmol/L', targetRange: '0.6-1.2 mmol/L', status: 'Therapeutic', lastChecked: '2026-08-20', nextDue: '2026-09-03', route: 'Oral' },
  { id: 'TDM-005', patientName: 'Yaw Boateng', drug: 'Digoxin', level: '2.8 ng/mL', targetRange: '0.5-2.0 ng/mL', status: 'Toxic', lastChecked: '2026-08-24', nextDue: '2026-08-26', route: 'Oral' },
  { id: 'TDM-006', patientName: 'Efua Nyarko', drug: 'Tacrolimus', level: '8.2 ng/mL', targetRange: '5-15 ng/mL', status: 'Therapeutic', lastChecked: '2026-08-23', nextDue: '2026-08-30', route: 'Oral' },
];

const SEVERITY_COLORS: Record<string, string> = { Major: 'bg-red-100 text-red-800', Moderate: 'bg-yellow-100 text-yellow-800', Minor: 'bg-blue-100 text-blue-800' };
const STATUS_COLORS: Record<string, string> = { Therapeutic: 'bg-green-100 text-green-800', 'Sub-therapeutic': 'bg-yellow-100 text-yellow-800', Toxic: 'bg-red-100 text-red-800', Pending: 'bg-blue-100 text-blue-800' };

export default function ClinicalPharmacy() {
  const [tab, setTab] = useState<'interactions' | 'tdm' | 'antibiotic' | 'stats'>('interactions');
  const majorCount = INTERACTIONS.filter(i => i.severity === 'Major').length;
  const toxicCount = TDM_RECORDS.filter(t => t.status === 'Toxic').length;

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
          title="Add New Clinical Pharmacy Record"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","required":true},{"name":"drugName","label":"Drug Name","type":"text","required":true},{"name":"dose","label":"Dose","type":"text","placeholder":"e.g. 500mg"},{"name":"frequency","label":"Frequency","type":"select","options":["OD","BD","TDS","QDS","PRN","STAT"]},{"name":"duration","label":"Duration","type":"text","placeholder":"e.g. 7 days"},{"name":"notes","label":"Clinical Notes","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Clinical Pharmacy</h1><p className="text-gray-500">Drug interaction checking, therapeutic drug monitoring, antimicrobial stewardship, and medication safety</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Major Interactions', value: majorCount, color: 'text-red-600' }, { label: 'TDM Monitored', value: TDM_RECORDS.length, color: 'text-blue-600' }, { label: 'Toxic Levels', value: toxicCount, color: 'text-orange-600' }, { label: 'Total Interactions', value: INTERACTIONS.length, color: 'text-purple-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['interactions', 'tdm', 'antibiotic', 'stats'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
            {t === 'interactions' ? 'Drug Interactions' : t === 'tdm' ? 'TDM Monitoring' : t === 'antibiotic' ? 'Antimicrobial Stewardship' : 'Statistics'}
          </button>
        ))}
      </div>

      {tab === 'interactions' && (
        <div className="space-y-3">
          {INTERACTIONS.map(i => (
            <div key={i.id} className="bg-white rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-sm">{i.drugA}</span>
                    <span className="text-red-500 font-bold">⚡</span>
                    <span className="font-bold text-sm">{i.drugB}</span>
                    <Badge className={SEVERITY_COLORS[i.severity]}>{i.severity}</Badge>
                  </div>
                  <p className="text-sm text-red-600 mb-1"><strong>Effect:</strong> {i.effect}</p>
                  <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2"><strong>Recommendation:</strong> {i.recommendation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'tdm' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="text-left text-gray-500 text-xs bg-gray-50"><th className="p-3">Patient</th><th className="p-3">Drug</th><th className="p-3">Level</th><th className="p-3">Target Range</th><th className="p-3">Status</th><th className="p-3">Last Checked</th><th className="p-3">Next Due</th></tr></thead>
            <tbody>{TDM_RECORDS.map(t => (
              <tr key={t.id} className="border-t hover:bg-gray-50"><td className="p-3 font-medium">{t.patientName}</td><td className="p-3">{t.drug}</td><td className="p-3 font-mono">{t.level}</td><td className="p-3 text-xs">{t.targetRange}</td><td className="p-3"><Badge className={STATUS_COLORS[t.status]}>{t.status}</Badge></td><td className="p-3 text-xs">{t.lastChecked}</td><td className="p-3 text-xs">{t.nextDue}</td></tr>
            ))}</tbody></table>
        </div>
      )}

      {tab === 'antibiotic' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-5">
            <h3 className="font-semibold mb-3">Antimicrobial Stewardship Programme</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { metric: 'Antibiotic Utilisation', value: '28.5 DDD/100 bed-days', target: '< 25 DDD', status: 'Above Target' },
                { metric: 'IV to Oral Switch Rate', value: '62%', target: '> 70%', status: 'Below Target' },
                { metric: 'Appropriate Empiric Therapy', value: '85%', target: '> 80%', status: 'On Target' },
                { metric: 'C. difficile Rate', value: '2.1/10,000 bed-days', target: '< 3.0', status: 'On Target' },
                { metric: 'MDR Organism Rate', value: '8.5%', target: '< 10%', status: 'On Target' },
                { metric: 'Antibiogram Compliance', value: '78%', target: '> 85%', status: 'Below Target' },
              ].map((m, i) => (
                <div key={i} className="bg-gray-50 rounded p-3">
                  <div className="text-xs text-gray-500">{m.metric}</div>
                  <div className="font-bold text-sm mt-1">{m.value}</div>
                  <div className="text-xs text-gray-500">Target: {m.target}</div>
                  <Badge className={m.status === 'On Target' ? 'bg-green-100 text-green-800' : m.status === 'Below Target' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>{m.status}</Badge>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-lg border p-5">
            <h3 className="font-semibold mb-3">Restricted Antibiotics (Require Approval)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['Meropenem', 'Vancomycin', 'Linezolid', 'Colistin', 'Daptomycin', 'Ceftaroline', 'Tigecycline', 'Posaconazole'].map(a => (
                <div key={a} className="bg-red-50 border border-red-200 rounded p-2 text-center text-sm font-medium text-red-800">🔒 {a}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3">Interactions by Severity</h3>
            {['Major', 'Moderate', 'Minor'].map(s => (
              <div key={s} className="flex items-center justify-between py-2 border-b last:border-0">
                <Badge className={SEVERITY_COLORS[s]}>{s}</Badge>
                <span className="font-bold">{INTERACTIONS.filter(i => i.severity === s).length}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3">TDM by Status</h3>
            {['Therapeutic', 'Sub-therapeutic', 'Toxic', 'Pending'].map(s => (
              <div key={s} className="flex items-center justify-between py-2 border-b last:border-0">
                <Badge className={STATUS_COLORS[s]}>{s}</Badge>
                <span className="font-bold">{TDM_RECORDS.filter(t => t.status === s).length}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
