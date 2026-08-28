import { useState } from 'react';
import { Badge, Button, Card, Input, Select, useToast } from '../../components/ui';

interface FallRisk {
  id: string; patientName: string; mrn: string; ward: string;
  assessmentDate: string; assessor: string;
  historyOfFalls: boolean; secondaryDiagnosis: boolean; ambulatoryAid: boolean;
  ivAccess: boolean; gait: number; mentalStatus: number;
  totalScore: number; riskLevel: 'Low' | 'Moderate' | 'High';
  interventions: string[]; status: 'Active' | 'Resolved' | 'Fall Occurred';
}

const INITIAL: FallRisk[] = [
  { id: 'FR-001', patientName: 'Abena Osei', mrn: 'MRN-2026-010', ward: 'Geriatric Ward', assessmentDate: '2026-08-24', assessor: 'Nurse Ama', historyOfFalls: true, secondaryDiagnosis: true, ambulatoryAid: true, ivAccess: false, gait: 2, mentalStatus: 1, totalScore: 9, riskLevel: 'High', interventions: ['Fall risk wristband', 'Bed alarm activated', 'Non-slip footwear', 'Hourly rounding'], status: 'Active' },
  { id: 'FR-002', patientName: 'Kwaku Boateng', mrn: 'MRN-2026-011', ward: 'Medical Ward', assessmentDate: '2026-08-23', assessor: 'Nurse Esi', historyOfFalls: false, secondaryDiagnosis: true, ambulatoryAid: false, ivAccess: true, gait: 1, mentalStatus: 0, totalScore: 4, riskLevel: 'Moderate', interventions: ['Bed at lowest position', 'Call bell within reach'], status: 'Active' },
  { id: 'FR-003', patientName: 'Akua Mensah', mrn: 'MRN-2026-012', ward: 'Surgical Ward', assessmentDate: '2026-08-25', assessor: 'Nurse Kofi', historyOfFalls: false, secondaryDiagnosis: false, ambulatoryAid: false, ivAccess: true, gait: 0, mentalStatus: 0, totalScore: 2, riskLevel: 'Low', interventions: ['Standard fall precautions'], status: 'Active' },
];

const INTERVENTION_OPTIONS = ['Fall risk wristband', 'Bed alarm activated', 'Non-slip footwear', 'Hourly rounding', 'Bed at lowest position', 'Call bell within reach', 'Educate patient', '1:1 observation', 'Sitter', 'Medication review', 'Physical therapy consult', 'Night light'];
const RISK_CONFIG: Record<string, { color: string; icon: string; tone: 'green' | 'gold' | 'red' }> = {
  Low: { color: 'bg-green-100 text-green-800', icon: '🟢', tone: 'green' }, Moderate: { color: 'bg-yellow-100 text-yellow-800', icon: '🟡', tone: 'gold' }, High: { color: 'bg-red-100 text-red-800', icon: '🔴', tone: 'red' },
};

export default function FallsPrevention() {
  const [records, setRecords] = useState<FallRisk[]>(INITIAL);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ patientName: '', mrn: '', ward: '', assessor: '', historyOfFalls: false, secondaryDiagnosis: false, ambulatoryAid: false, ivAccess: false, gait: 0, mentalStatus: 0, interventions: [] as string[] });
  const toast = useToast();
  const filtered = records.filter((r) => !filter || r.riskLevel === filter);

  const calcScore = () => {
    let s = 0;
    if (form.historyOfFalls) s += 1;
    if (form.secondaryDiagnosis) s += 1;
    if (form.ambulatoryAid) s += 1;
    if (form.ivAccess) s += 1;
    s += form.gait + form.mentalStatus;
    return s;
  };
  const score = calcScore();
  const level = score >= 5 ? 'High' : score >= 3 ? 'Moderate' : 'Low' as const;

  const handleAdd = () => {
    const r = { id: `FR-${String(records.length + 1).padStart(3, '0')}`, patientName: form.patientName, mrn: form.mrn, ward: form.ward, assessor: form.assessor, historyOfFalls: form.historyOfFalls, secondaryDiagnosis: form.secondaryDiagnosis, ambulatoryAid: form.ambulatoryAid, ivAccess: form.ivAccess, gait: form.gait, mentalStatus: form.mentalStatus, assessmentDate: new Date().toISOString().split('T')[0], totalScore: score, riskLevel: level as 'Low' | 'Moderate' | 'High', interventions: form.interventions, status: 'Active' as 'Active' | 'Resolved' | 'Fall Occurred' };
    setRecords([r as FallRisk, ...records]); setShowForm(false);
    setForm({ patientName: '', mrn: '', ward: '', assessor: '', historyOfFalls: false, secondaryDiagnosis: false, ambulatoryAid: false, ivAccess: false, gait: 0, mentalStatus: 0, interventions: [] });
    toast('Fall risk assessment added');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Falls Prevention Programme</h1><p className="text-gray-500">Fall risk assessment, prevention interventions, and incident tracking</p></div>
        <Button onClick={() => setShowForm(true)}>+ New Assessment</Button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {(['Low', 'Moderate', 'High'] as const).map((l) => (
          <button key={l} onClick={() => setFilter(filter === l ? '' : l)} className={`p-3 rounded-lg border text-center transition ${filter === l ? 'ring-2 ring-green-500 border-green-300' : 'border-slate-200 hover:bg-slate-50'}`}>
            <div className="text-2xl">{RISK_CONFIG[l]?.icon}</div>
            <div className="text-xl font-bold">{records.filter((r) => r.riskLevel === l).length}</div>
            <div className="text-xs text-slate-500">{l} Risk</div>
          </button>
        ))}
      </div>
      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-gray-500"><th className="p-2">Patient</th><th className="p-2">MRN</th><th className="p-2">Ward</th><th className="p-2">Score</th><th className="p-2">Risk</th><th className="p-2">Interventions</th><th className="p-2">Status</th></tr></thead>
            <tbody>{filtered.map((r) => (
              <tr key={r.id} className="border-b hover:bg-gray-50">
                <td className="p-2 font-medium">{r.patientName}</td><td className="p-2">{r.mrn}</td><td className="p-2">{r.ward}</td>
                <td className="p-2 font-bold">{r.totalScore}</td>
                <td className="p-2"><span className={`px-2 py-1 rounded-full text-xs font-medium ${RISK_CONFIG[r.riskLevel]?.color ?? ''}`}>{r.riskLevel}</span></td>
                <td className="p-2">{r.interventions.slice(0, 2).join(', ')}{r.interventions.length > 2 ? ` +${r.interventions.length - 2}` : ''}</td>
                <td className="p-2"><Badge tone={r.status === 'Active' ? 'green' : r.status === 'Fall Occurred' ? 'red' : 'gray'}>{r.status}</Badge></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowForm(false)} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-bold">✕</button>
            <h2 className="text-lg font-bold mb-4">New Fall Risk Assessment</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">Patient Name *</label><Input value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} /></div>
                <div><label className="block text-sm font-medium mb-1">MRN *</label><Input value={form.mrn} onChange={(e) => setForm({ ...form, mrn: e.target.value })} /></div>
                <div><label className="block text-sm font-medium mb-1">Ward *</label><Input value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })} /></div>
                <div><label className="block text-sm font-medium mb-1">Assessor *</label><Input value={form.assessor} onChange={(e) => setForm({ ...form, assessor: e.target.value })} /></div>
              </div>
              <div className="border rounded-lg p-3 bg-gray-50">
                <h3 className="font-semibold mb-2">Risk Factors</h3>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { key: 'historyOfFalls' as const, label: 'History of Falls' },
                    { key: 'secondaryDiagnosis' as const, label: 'Secondary diagnosis (2+)' },
                    { key: 'ambulatoryAid' as const, label: 'Walking aid required' },
                    { key: 'ivAccess' as const, label: 'IV access / heparin lock' },
                  ]).map((item) => (
                    <label key={item.key} className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer">
                      <input type="checkbox" checked={form[item.key]} onChange={(e) => setForm({ ...form, [item.key]: e.target.checked })} className="rounded" />
                      <span className="text-sm">{item.label}</span>
                    </label>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div><label className="block text-sm mb-1">Gait</label>
                    <Select value={form.gait} onChange={(e) => setForm({ ...form, gait: Number(e.target.value) })}>
                      <option value={0}>0 — Normal</option><option value={1}>1 — Weak</option><option value={2}>2 — Impaired</option><option value={3}>3 — Very Impaired</option>
                    </Select>
                  </div>
                  <div><label className="block text-sm mb-1">Mental Status</label>
                    <Select value={form.mentalStatus} onChange={(e) => setForm({ ...form, mentalStatus: Number(e.target.value) })}>
                      <option value={0}>0 — Oriented</option><option value={1}>1 — Overestimates ability</option><option value={2}>2 — Forgets limitations</option>
                    </Select>
                  </div>
                </div>
                <div className="mt-2 text-center p-2 rounded bg-white border">
                  <span className="text-sm">Score: </span>
                  <span className={`text-2xl font-bold ${score >= 5 ? 'text-red-600' : score >= 3 ? 'text-yellow-600' : 'text-green-600'}`}>{score}</span>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${level === 'High' ? 'bg-red-100 text-red-800' : level === 'Moderate' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{level} Risk</span>
                </div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Prevention Interventions</label><div className="flex flex-wrap gap-2">{INTERVENTION_OPTIONS.map((i) => (
                <button key={i} type="button" onClick={() => setForm({ ...form, interventions: form.interventions.includes(i) ? form.interventions.filter((x) => x !== i) : [...form.interventions, i] })}
                  className={`px-3 py-1 rounded-full text-xs border transition ${form.interventions.includes(i) ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-gray-200'}`}>{i}</button>
              ))}</div></div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={handleAdd}>Save</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
