import { useState, useMemo } from 'react';
import { Card, Badge, Button, Input } from '../../components/ui';

interface RiskAssessment {
  id: string;
  patientName: string;
  mrn: string;
  ward: string;
  assessmentType: string;
  riskScore: number;
  riskLevel: string;
  factors: string;
  dateAssessed: string;
  assessedBy: string;
  nextReview: string;
  interventions: string;
  status: string;
  comments: string;
}

const ASSESSMENT_TYPES = ['NEWS2 (National Early Warning)', 'MEWS (Modified Early Warning)', 'PHI (Pregnancy Hypertension Index)', 'SOFA (Sepsis)', 'qSOFA (Quick Sepsis)', 'Waterlow (Pressure Injury)', 'Morse (Falls)', 'Caprini (VTE)', 'Wells (PE/DVT)', 'CURB-65 (Pneumonia)', 'Glasgow Coma Scale', 'APACHE II', 'ASA Physical Status'];

const calcRiskLevel = (score: number, type: string): string => {
  if (type.startsWith('NEWS2')) {
    if (score <= 4) return 'Low';
    if (score <= 6) return 'Moderate';
    return 'High';
  }
  if (type.startsWith('qSOFA')) {
    if (score === 0) return 'Low';
    if (score === 1) return 'Moderate';
    return 'High';
  }
  if (type.startsWith('Waterlow')) {
    if (score <= 10) return 'Low';
    if (score <= 14) return 'Moderate';
    if (score <= 19) return 'High';
    return 'Very High';
  }
  if (score <= 4) return 'Low';
  if (score <= 7) return 'Moderate';
  if (score <= 11) return 'High';
  return 'Critical';
};

export default function PatientRiskStratification() {
  const [records, setRecords] = useState<RiskAssessment[]>([
    { id: 'RS-001', patientName: 'Kofi Mensah', mrn: 'MRN-001', ward: 'Medical Ward', assessmentType: 'NEWS2 (National Early Warning)', riskScore: 5, riskLevel: 'Moderate', factors: 'Elevated respiratory rate (22), mild tachycardia (105)', dateAssessed: '2026-08-24 08:00', assessedBy: 'Nurse Ama', nextReview: '2026-08-24 14:00', interventions: 'Increased observation frequency, fluid balance chart, medical review', status: 'Active', comments: 'Monitor closely for deterioration' },
    { id: 'RS-002', patientName: 'Ama Darko', mrn: 'MRN-002', ward: 'Surgical Ward', assessmentType: 'Morse (Falls)', riskScore: 45, riskLevel: 'High', factors: 'History of falls, IV heparin, gait disturbance, mental status variation', dateAssessed: '2026-08-24 09:00', assessedBy: 'Nurse Kofi', nextReview: '2026-08-25 09:00', interventions: 'Yellow socks, bed at lowest position, call bell within reach, hourly rounding', status: 'Active', comments: 'High fall risk, implement fall prevention bundle' },
    { id: 'RS-003', patientName: 'Yaw Frimpong', mrn: 'MRN-003', ward: 'ICU', assessmentType: 'SOFA (Sepsis)', riskScore: 8, riskLevel: 'High', factors: 'Respiratory failure requiring ventilation, acute kidney injury, liver dysfunction', dateAssessed: '2026-08-24 10:00', assessedBy: 'Dr. Akosua', nextReview: '2026-08-24 16:00', interventions: 'Sepsis bundle, broad-spectrum antibiotics, IV fluids, vasopressors, renal replacement therapy discussion', status: 'Active', comments: 'Multi-organ dysfunction, discuss goals of care with family' },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState<RiskAssessment>({ id: '', patientName: '', mrn: '', ward: '', assessmentType: '', riskScore: 0, riskLevel: '', factors: '', dateAssessed: '', assessedBy: '', nextReview: '', interventions: '', status: 'Active', comments: '' });

  const filtered = useMemo(() => records.filter(r =>
    r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.ward.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.assessmentType.toLowerCase().includes(searchTerm.toLowerCase())
  ), [records, searchTerm]);

  const handleAdd = () => {
    const level = calcRiskLevel(form.riskScore, form.assessmentType);
    const r: RiskAssessment = { ...form, id: `RS-${String(records.length + 1).padStart(3, '0')}`, riskLevel: level };
    setRecords([r, ...records]);
    setShowAdd(false);
    setForm({ id: '', patientName: '', mrn: '', ward: '', assessmentType: '', riskScore: 0, riskLevel: '', factors: '', dateAssessed: '', assessedBy: '', nextReview: '', interventions: '', status: 'Active', comments: '' });
  };

  const highRisk = records.filter(r => r.riskLevel === 'High' || r.riskLevel === 'Very High' || r.riskLevel === 'Critical').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">⚠️ Patient Risk Stratification</h1>
          <p className="text-gray-600">Clinical risk scoring — NEWS2, falls, sepsis, pressure injury, VTE</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="bg-green-600 hover:bg-green-700 text-white">+ New Risk Assessment</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-sm text-gray-500">Total Assessments</p><p className="text-2xl font-bold">{records.length}</p></Card>
        <Card className="p-4 border-l-4 border-red-500"><p className="text-sm text-gray-500">High/Very High Risk</p><p className="text-2xl font-bold text-red-600">{highRisk}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Moderate Risk</p><p className="text-2xl font-bold text-yellow-600">{records.filter(r => r.riskLevel === 'Moderate').length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Reviews Due Today</p><p className="text-2xl font-bold text-orange-600">{records.filter(r => r.nextReview.startsWith('2026-08-24')).length}</p></Card>
      </div>

      {showAdd && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">New Risk Assessment</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Patient Name" value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })} />
            <Input placeholder="MRN" value={form.mrn} onChange={e => setForm({ ...form, mrn: e.target.value })} />
            <Input placeholder="Ward" value={form.ward} onChange={e => setForm({ ...form, ward: e.target.value })} />
            <select className="border rounded-lg px-3 py-2" value={form.assessmentType} onChange={e => setForm({ ...form, assessmentType: e.target.value })}>
              <option value="">Assessment Type</option>
              {ASSESSMENT_TYPES.map(a => <option key={a}>{a}</option>)}
            </select>
            <Input type="number" placeholder="Risk Score" value={String(form.riskScore)} onChange={e => setForm({ ...form, riskScore: Number(e.target.value) })} />
            <Input type="datetime-local" placeholder="Date Assessed" value={form.dateAssessed} onChange={e => setForm({ ...form, dateAssessed: e.target.value })} />
            <Input placeholder="Assessed By" value={form.assessedBy} onChange={e => setForm({ ...form, assessedBy: e.target.value })} />
            <Input type="datetime-local" placeholder="Next Review" value={form.nextReview} onChange={e => setForm({ ...form, nextReview: e.target.value })} />
            <textarea placeholder="Risk Factors" value={form.factors} onChange={e => setForm({ ...form, factors: e.target.value })} className="border rounded-lg px-3 py-2 col-span-3" rows={2} />
            <textarea placeholder="Interventions" value={form.interventions} onChange={e => setForm({ ...form, interventions: e.target.value })} className="border rounded-lg px-3 py-2 col-span-3" rows={2} />
            <textarea placeholder="Comments" value={form.comments} onChange={e => setForm({ ...form, comments: e.target.value })} className="border rounded-lg px-3 py-2 col-span-3" rows={2} />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAdd} className="bg-green-600 text-white">Save Assessment</Button>
            <Button onClick={() => setShowAdd(false)} className="bg-gray-300">Cancel</Button>
          </div>
        </Card>
      )}

      <div className="mb-4">
        <Input placeholder="🔍 Search by patient, ward, or assessment type..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Patient</th>
                <th className="p-3 text-left">Ward</th>
                <th className="p-3 text-left">Assessment</th>
                <th className="p-3 text-left">Score</th>
                <th className="p-3 text-left">Risk Level</th>
                <th className="p-3 text-left">Assessed By</th>
                <th className="p-3 text-left">Next Review</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">{r.id}</td>
                  <td className="p-3 font-medium">{r.patientName}</td>
                  <td className="p-3">{r.ward}</td>
                  <td className="p-3 text-xs">{r.assessmentType}</td>
                  <td className="p-3 font-bold">{r.riskScore}</td>
                  <td className="p-3"><Badge className={r.riskLevel === 'Critical' || r.riskLevel === 'Very High' ? 'bg-red-100 text-red-800' : r.riskLevel === 'High' ? 'bg-orange-100 text-orange-800' : r.riskLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>{r.riskLevel}</Badge></td>
                  <td className="p-3">{r.assessedBy}</td>
                  <td className="p-3">{r.nextReview}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
