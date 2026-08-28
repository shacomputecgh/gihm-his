import { useState } from 'react';
import { Badge, Button, Card, Input, Select, useToast } from '../../components/ui';
import { printPDF, section, field, table, today, type PDFDocument } from '../../lib/pdfGenerator';

interface VTERiskAssessment {
  id: string; patientName: string; mrn: string; ward: string;
  assessmentDate: string; assessorName: string;
  mobilityScore: number; bmiScore: number; ageScore: number;
  riskFactors: string[]; totalRiskScore: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Very High';
  prophylaxis: string; prophylaxisStatus: 'Planned' | 'Active' | 'Completed' | 'Contraindicated';
  notes: string;
}

const INITIAL: VTERiskAssessment[] = [
  { id: 'VTE-001', patientName: 'Kwame Mensah', mrn: 'MRN-2026-001', ward: 'Surgical Ward', assessmentDate: '2026-08-24', assessorName: 'Dr. Asante', mobilityScore: 3, bmiScore: 2, ageScore: 2, riskFactors: ['Major Surgery', 'Immobility', 'BMI > 30'], totalRiskScore: 7, riskLevel: 'High', prophylaxis: 'Enoxaparin 40mg SC daily', prophylaxisStatus: 'Active', notes: 'Post-op Day 2.' },
  { id: 'VTE-002', patientName: 'Ama Darko', mrn: 'MRN-2026-002', ward: 'Maternity Ward', assessmentDate: '2026-08-23', assessorName: 'Dr. Boateng', mobilityScore: 1, bmiScore: 1, ageScore: 1, riskFactors: ['Pregnancy', 'Caesarean Section'], totalRiskScore: 3, riskLevel: 'Moderate', prophylaxis: 'Compression stockings', prophylaxisStatus: 'Active', notes: 'Mechanical prophylaxis only.' },
  { id: 'VTE-003', patientName: 'Kofi Asare', mrn: 'MRN-2026-003', ward: 'Medical Ward', assessmentDate: '2026-08-25', assessorName: 'Dr. Osei', mobilityScore: 4, bmiScore: 1, ageScore: 3, riskFactors: ['Age > 75', 'Prolonged Bed Rest', 'Active Cancer'], totalRiskScore: 8, riskLevel: 'Very High', prophylaxis: 'Enoxaparin 40mg SC daily + TEDs', prophylaxisStatus: 'Active', notes: 'Oncology patient.' },
];

const RISK_LEVELS: Record<string, { color: string; icon: string }> = {
  Low: { color: 'bg-green-100 text-green-800', icon: '🟢' }, Moderate: { color: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
  High: { color: 'bg-orange-100 text-orange-800', icon: '🟠' }, 'Very High': { color: 'bg-red-100 text-red-800', icon: '🔴' },
};

function calcRisk(mobility: number, bmi: number, age: number) {
  const total = mobility + bmi + age;
  if (total <= 2) return { total, level: 'Low' as const };
  if (total <= 4) return { total, level: 'Moderate' as const };
  if (total <= 6) return { total, level: 'High' as const };
  return { total, level: 'Very High' as const };
}

export default function VTEPrevention() {
  const [records, setRecords] = useState<VTERiskAssessment[]>(INITIAL);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');
  const [mobilityScore, setMobility] = useState(0);
  const [bmiScore, setBmi] = useState(0);
  const [ageScore, setAge] = useState(0);
  const [riskFactors, setRiskFactors] = useState<string[]>([]);
  const [patientName, setPatientName] = useState('');
  const [mrn, setMrn] = useState('');
  const [ward, setWard] = useState('');
  const [assessorName, setAssessor] = useState('');
  const [prophylaxis, setProphylaxis] = useState('');
  const [notes, setNotes] = useState('');
  const toast = useToast();
  const filtered = records.filter((r) => !filter || r.riskLevel === filter);
  const risk = calcRisk(mobilityScore, bmiScore, ageScore);

  const handleAdd = () => {
    const r = { id: `VTE-${String(records.length + 1).padStart(3, '0')}`, patientName, mrn, ward, assessmentDate: new Date().toISOString().split('T')[0], assessorName, mobilityScore, bmiScore, ageScore, riskFactors, totalRiskScore: risk.total, riskLevel: risk.level as 'Low' | 'Moderate' | 'High' | 'Very High', prophylaxis, prophylaxisStatus: 'Planned' as 'Planned' | 'Active' | 'Completed' | 'Contraindicated', notes };
    setRecords([r as VTERiskAssessment, ...records]); setShowForm(false); toast('VTE assessment added');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">VTE Prevention & Prophylaxis</h1><p className="text-gray-500">Venous thromboembolism risk assessment and prophylaxis tracking</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            const doc: PDFDocument = {
              title: 'VTE RISK ASSESSMENT REPORT',
              subtitle: `${filtered.length} patients assessed · Generated ${today()}`,
              content: table(
                ['Patient', 'MRN', 'Ward', 'Score', 'Risk', 'Prophylaxis', 'Status'],
                filtered.map((r) => [r.patientName, r.mrn, r.ward, `${r.totalRiskScore}/10`, r.riskLevel, r.prophylaxis, r.prophylaxisStatus])
              ) + section('Summary', field('Total Assessments', String(records.length)) + field('Very High Risk', String(records.filter((r) => r.riskLevel === 'Very High').length)) + field('High Risk', String(records.filter((r) => r.riskLevel === 'High').length))),
              footer: `Generated on ${today()} · Greater Accra Regional Hospital`
            };
            printPDF(doc);
          }}>🖨 Print Report</Button>
          <Button onClick={() => setShowForm(true)}>+ New Assessment</Button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(['Low', 'Moderate', 'High', 'Very High'] as const).map((level) => (
          <button key={level} onClick={() => setFilter(filter === level ? '' : level)} className={`p-3 rounded-lg border text-center transition ${filter === level ? 'ring-2 ring-green-500 border-green-300' : 'border-slate-200 hover:bg-slate-50'}`}>
            <div className="text-2xl">{RISK_LEVELS[level]?.icon}</div>
            <div className="text-xl font-bold">{records.filter((r) => r.riskLevel === level).length}</div>
            <div className="text-xs text-slate-500">{level} Risk</div>
          </button>
        ))}
      </div>
      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-gray-500"><th className="p-2">Patient</th><th className="p-2">MRN</th><th className="p-2">Ward</th><th className="p-2">Score</th><th className="p-2">Risk</th><th className="p-2">Prophylaxis</th><th className="p-2">Status</th></tr></thead>
            <tbody>{filtered.map((r) => (
              <tr key={r.id} className="border-b hover:bg-gray-50">
                <td className="p-2 font-medium">{r.patientName}</td><td className="p-2">{r.mrn}</td><td className="p-2">{r.ward}</td>
                <td className="p-2 font-bold">{r.totalRiskScore}</td>
                <td className="p-2"><span className={`px-2 py-1 rounded-full text-xs font-medium ${RISK_LEVELS[r.riskLevel]?.color ?? ''}`}>{RISK_LEVELS[r.riskLevel]?.icon} {r.riskLevel}</span></td>
                <td className="p-2">{r.prophylaxis}</td>
                <td className="p-2"><Badge tone={r.prophylaxisStatus === 'Active' ? 'green' : r.prophylaxisStatus === 'Contraindicated' ? 'red' : 'gold'}>{r.prophylaxisStatus}</Badge></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowForm(false)} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-bold">✕</button>
            <h2 className="text-lg font-bold mb-4">New VTE Risk Assessment</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">Patient Name *</label><Input value={patientName} onChange={(e) => setPatientName(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">MRN *</label><Input value={mrn} onChange={(e) => setMrn(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Ward *</label><Input value={ward} onChange={(e) => setWard(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Assessor *</label><Input value={assessorName} onChange={(e) => setAssessor(e.target.value)} /></div>
              </div>
              <div className="border rounded-lg p-3 bg-gray-50">
                <h3 className="font-semibold mb-2">Risk Scoring</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-sm mb-1">Mobility</label>
                    <Select value={mobilityScore} onChange={(e) => setMobility(Number(e.target.value))}>
                      <option value={0}>0 — Fully mobile</option><option value={1}>1 — Mostly mobile</option><option value={2}>2 — Restricted {'<'} 48h</option><option value={3}>3 — Bedrest {'>'} 48h</option><option value={4}>4 — Paraplegia</option><option value={5}>5 — Complete immobility</option>
                    </Select>
                  </div>
                  <div><label className="block text-sm mb-1">BMI</label>
                    <Select value={bmiScore} onChange={(e) => setBmi(Number(e.target.value))}>
                      <option value={0}>0 — 20-24.9</option><option value={1}>1 — 25-29.9</option><option value={2}>2 — 30-39.9</option><option value={3}>3 — ≥ 40</option>
                    </Select>
                  </div>
                  <div><label className="block text-sm mb-1">Age</label>
                    <Select value={ageScore} onChange={(e) => setAge(Number(e.target.value))}>
                      <option value={0}>0 — {'<'} 40</option><option value={1}>1 — 40-60</option><option value={2}>2 — 61-74</option><option value={3}>3 — ≥ 75</option>
                    </Select>
                  </div>
                </div>
                <div className="mt-2 text-center p-2 rounded-lg bg-white border">
                  <span className="text-sm">Score: </span>
                  <span className={`text-2xl font-bold ${risk.total >= 7 ? 'text-red-600' : risk.total >= 5 ? 'text-orange-500' : risk.total >= 3 ? 'text-yellow-600' : 'text-green-600'}`}>{risk.total}</span>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${RISK_LEVELS[risk.level]?.color ?? ''}`}>{risk.level} Risk</span>
                </div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Risk Factors</label><div className="flex flex-wrap gap-2">{['Major Surgery', 'Immobility', 'Active Cancer', 'DVT History', 'Pregnancy', 'BMI > 30', 'Age > 75', 'Central Lines', 'ICU Admission'].map((f) => (
                <button key={f} type="button" onClick={() => setRiskFactors(riskFactors.includes(f) ? riskFactors.filter((x) => x !== f) : [...riskFactors, f])}
                  className={`px-3 py-1 rounded-full text-xs border transition ${riskFactors.includes(f) ? 'bg-red-100 border-red-300 text-red-700' : 'bg-white border-gray-200'}`}>{f}</button>
              ))}</div></div>
              <div><label className="block text-sm font-medium mb-1">Prophylaxis</label>
                <Select value={prophylaxis} onChange={(e) => setProphylaxis(e.target.value)}>
                  <option value="">Select...</option><option>Enoxaparin 40mg SC daily</option><option>Heparin 5000U SC 8-12h</option><option>Fondaparinux 2.5mg SC daily</option><option>Compression stockings (TEDs)</option><option>Early mobilisation</option><option>None — Contraindicated</option>
                </Select>
              </div>
              <div><label className="block text-sm font-medium mb-1">Notes</label><textarea className="w-full border rounded-lg p-2 text-sm" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={handleAdd}>Save</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
