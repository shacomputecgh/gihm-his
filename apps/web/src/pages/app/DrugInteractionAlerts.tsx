import { useState, useMemo } from 'react';
import { Card, Badge, Button, Input } from '../../components/ui';

interface InteractionAlert {
  id: string;
  patientName: string;
  mrn: string;
  drug1: string;
  drug2: string;
  severity: string;
  interactionType: string;
  clinicalEffect: string;
  recommendation: string;
  discoveredBy: string;
  dateDiscovered: string;
  actionTaken: string;
  outcome: string;
  status: string;
}

const INTERACTION_TYPES = ['Major', 'Moderate', 'Minor', 'Contraindicated'];
const OUTCOMES = ['Drug Changed', 'Dose Adjusted', 'Monitoring Added', 'No Change (Accepted Risk)', 'Prescription Cancelled', 'Referred to Pharmacist'];

export default function DrugInteractionAlerts() {
  const [records, setRecords] = useState<InteractionAlert[]>([
    { id: 'DI-001', patientName: 'Kofi Mensah', mrn: 'MRN-001', drug1: 'Warfarin 5mg', drug2: 'Amoxicillin 500mg', severity: 'Moderate - Use with Caution', interactionType: 'Moderate', clinicalEffect: 'Amoxicillin may increase anticoagulant effect of warfarin, raising INR', recommendation: 'Monitor INR closely, watch for signs of bleeding', discoveredBy: 'Clinical Pharmacist', dateDiscovered: '2026-08-24', actionTaken: 'INR scheduled for 3 days, patient counselled on bleeding signs', outcome: 'Monitoring Added', status: 'Active' },
    { id: 'DI-002', patientName: 'Ama Darko', mrn: 'MRN-002', drug1: 'Metformin 500mg', drug2: 'IV Contrast (CT scan)', severity: 'Major - Monitor Closely', interactionType: 'Major', clinicalEffect: 'IV contrast with metformin increases risk of lactic acidosis in renal impairment', recommendation: 'Withhold metformin 48 hours before and after contrast if eGFR < 30', discoveredBy: 'Radiology Pharmacist', dateDiscovered: '2026-08-24', actionTaken: 'Metformin withheld, renal function checked, will restart 48h post-contrast', outcome: 'Drug Changed', status: 'Active' },
    { id: 'DI-003', patientName: 'Yaw Frimpong', mrn: 'MRN-003', drug1: 'Lithium 900mg', drug2: 'Ibuprofen 400mg', severity: 'Major - Monitor Closely', interactionType: 'Major', clinicalEffect: 'NSAIDs reduce lithium clearance, risk of lithium toxicity', recommendation: 'Avoid NSAIDs with lithium, use paracetamol for pain', discoveredBy: 'Ward Pharmacist', dateDiscovered: '2026-08-23', actionTaken: 'Ibuprofen stopped, changed to paracetamol, lithium level checked', outcome: 'Drug Changed', status: 'Resolved' },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState<InteractionAlert>({ id: '', patientName: '', mrn: '', drug1: '', drug2: '', severity: '', interactionType: '', clinicalEffect: '', recommendation: '', discoveredBy: '', dateDiscovered: '', actionTaken: '', outcome: '', status: 'Active' });

  const filtered = useMemo(() => records.filter(r =>
    r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.drug1.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.drug2.toLowerCase().includes(searchTerm.toLowerCase())
  ), [records, searchTerm]);

  const handleAdd = () => {
    const r: InteractionAlert = { ...form, id: `DI-${String(records.length + 1).padStart(3, '0')}` };
    setRecords([r, ...records]);
    setShowAdd(false);
    setForm({ id: '', patientName: '', mrn: '', drug1: '', drug2: '', severity: '', interactionType: '', clinicalEffect: '', recommendation: '', discoveredBy: '', dateDiscovered: '', actionTaken: '', outcome: '', status: 'Active' });
  };

  const major = records.filter(r => r.interactionType === 'Major' || r.interactionType === 'Contraindicated').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">⚠️ Drug Interaction Alerts</h1>
          <p className="text-gray-600">Drug-drug interaction checking, clinical effects, recommendations</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="bg-green-600 hover:bg-green-700 text-white">+ Record Interaction</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-sm text-gray-500">Total Alerts</p><p className="text-2xl font-bold">{records.length}</p></Card>
        <Card className="p-4 border-l-4 border-red-500"><p className="text-sm text-gray-500">Major/Contraindicated</p><p className="text-2xl font-bold text-red-600">{major}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Active</p><p className="text-2xl font-bold text-orange-600">{records.filter(r => r.status === 'Active').length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Resolved</p><p className="text-2xl font-bold text-green-600">{records.filter(r => r.status === 'Resolved').length}</p></Card>
      </div>

      {showAdd && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Record Drug Interaction</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Patient Name" value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })} />
            <Input placeholder="MRN" value={form.mrn} onChange={e => setForm({ ...form, mrn: e.target.value })} />
            <Input placeholder="Drug 1" value={form.drug1} onChange={e => setForm({ ...form, drug1: e.target.value })} />
            <Input placeholder="Drug 2" value={form.drug2} onChange={e => setForm({ ...form, drug2: e.target.value })} />
            <select className="border rounded-lg px-3 py-2" value={form.interactionType} onChange={e => setForm({ ...form, interactionType: e.target.value })}>
              <option value="">Interaction Type</option>
              {INTERACTION_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <Input placeholder="Discovered By" value={form.discoveredBy} onChange={e => setForm({ ...form, discoveredBy: e.target.value })} />
            <textarea placeholder="Clinical Effect" value={form.clinicalEffect} onChange={e => setForm({ ...form, clinicalEffect: e.target.value })} className="border rounded-lg px-3 py-2 col-span-3" rows={2} />
            <textarea placeholder="Recommendation" value={form.recommendation} onChange={e => setForm({ ...form, recommendation: e.target.value })} className="border rounded-lg px-3 py-2 col-span-3" rows={2} />
            <textarea placeholder="Action Taken" value={form.actionTaken} onChange={e => setForm({ ...form, actionTaken: e.target.value })} className="border rounded-lg px-3 py-2 col-span-3" rows={2} />
            <select className="border rounded-lg px-3 py-2" value={form.outcome} onChange={e => setForm({ ...form, outcome: e.target.value })}>
              <option value="">Outcome</option>
              {OUTCOMES.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAdd} className="bg-green-600 text-white">Save</Button>
            <Button onClick={() => setShowAdd(false)} className="bg-gray-300">Cancel</Button>
          </div>
        </Card>
      )}

      <div className="mb-4">
        <Input placeholder="🔍 Search by patient, drug name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Patient</th>
                <th className="p-3 text-left">Drug 1</th>
                <th className="p-3 text-left">Drug 2</th>
                <th className="p-3 text-left">Severity</th>
                <th className="p-3 text-left">Outcome</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">{r.id}</td>
                  <td className="p-3 font-medium">{r.patientName}</td>
                  <td className="p-3">{r.drug1}</td>
                  <td className="p-3">{r.drug2}</td>
                  <td className="p-3"><Badge className={r.interactionType === 'Major' || r.interactionType === 'Contraindicated' ? 'bg-red-100 text-red-800' : r.interactionType === 'Moderate' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}>{r.interactionType}</Badge></td>
                  <td className="p-3">{r.outcome}</td>
                  <td className="p-3"><Badge className={r.status === 'Resolved' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
