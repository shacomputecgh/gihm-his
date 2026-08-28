import { useState, useMemo } from 'react';
import { Card, Badge, Button, Input } from '../../components/ui';

interface MedSafety {
  id: string;
  patientName: string;
  mrn: string;
  ward: string;
  medication: string;
  category: string;
  issueType: string;
  severity: string;
  discoveredBy: string;
  dateDiscovered: string;
  description: string;
  cause: string;
  immediateAction: string;
  outcome: string;
  reportedBy: string;
  dateReported: string;
  nhsStatus: string;
}

const ISSUE_TYPES = ['Wrong Drug', 'Wrong Dose', 'Wrong Route', 'Wrong Patient', 'Missed Dose', 'Duplicate Dose', 'Drug Interaction', 'Allergy Alert', 'Prescription Error', 'Dispensing Error', 'Administration Error', 'Omission'];
const SEVERITY_LEVELS = ['Near Miss', 'Minor', 'Moderate', 'Serious', 'Severe', 'Death'];
const CATEGORIES = ['High-Alert Medication', 'Controlled Drug', 'Anticoagulant', 'Insulin', 'Opioid', 'Chemotherapy', 'Antibiotic', 'Sedative', 'Electrolyte', 'Blood Product', 'Standard Medication'];
const WARDS = ['Medical Ward', 'Surgical Ward', 'Paediatric Ward', 'Maternity', 'ICU', 'NICU', 'Emergency', 'Theatre', 'Oncology', 'Psychiatric'];

export default function WardMedicationSafety() {
  const [records, setRecords] = useState<MedSafety[]>([
    { id: 'MS-001', patientName: 'Kofi Mensah', mrn: 'MRN-001', ward: 'Medical Ward', medication: 'Warfarin 5mg', category: 'Anticoagulant', issueType: 'Wrong Dose', severity: 'Moderate', discoveredBy: 'Pharmacist Esi', dateDiscovered: '2026-08-24', description: 'Patient prescribed Warfarin 5mg but was given 10mg', cause: 'Prescription legibility issue', immediateAction: 'Withheld dose, INR checked, doctor notified', outcome: 'Patient stable, dose corrected', reportedBy: 'Nurse Ama', dateReported: '2026-08-24', nhsStatus: 'NHIS' },
    { id: 'MS-002', patientName: 'Ama Darko', mrn: 'MRN-002', ward: 'Surgical Ward', medication: 'Morphine PCA', category: 'Opioid', issueType: 'Near Miss', severity: 'Near Miss', discoveredBy: 'Nurse Kofi', dateDiscovered: '2026-08-24', description: 'Morphine PCA pump was set to incorrect concentration', cause: 'Equipment labelling error', immediateAction: 'Pump re-checked and corrected, staff re-educated', outcome: 'No harm, near miss', reportedBy: 'Nurse Kofi', dateReported: '2026-08-24', nhsStatus: 'Private' },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState<MedSafety>({ id: '', patientName: '', mrn: '', ward: '', medication: '', category: '', issueType: '', severity: '', discoveredBy: '', dateDiscovered: '', description: '', cause: '', immediateAction: '', outcome: '', reportedBy: '', dateReported: '', nhsStatus: 'NHIS' });

  const filtered = useMemo(() => records.filter(r =>
    r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.medication.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.ward.toLowerCase().includes(searchTerm.toLowerCase())
  ), [records, searchTerm]);

  const handleAdd = () => {
    const r: MedSafety = { ...form, id: `MS-${String(records.length + 1).padStart(3, '0')}` };
    setRecords([r, ...records]);
    setShowAdd(false);
    setForm({ id: '', patientName: '', mrn: '', ward: '', medication: '', category: '', issueType: '', severity: '', discoveredBy: '', dateDiscovered: '', description: '', cause: '', immediateAction: '', outcome: '', reportedBy: '', dateReported: '', nhsStatus: 'NHIS' });
  };

  const highRisk = records.filter(r => r.severity === 'Serious' || r.severity === 'Severe').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💊 Ward Medication Safety</h1>
          <p className="text-gray-600">Medication error reporting, near-misses, high-alert medication tracking</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="bg-red-600 hover:bg-red-700 text-white">+ Report Medication Issue</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4"><p className="text-sm text-gray-500">Total Reports</p><p className="text-2xl font-bold">{records.length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Near Misses</p><p className="text-2xl font-bold text-yellow-600">{records.filter(r => r.severity === 'Near Miss').length}</p></Card>
        <Card className="p-4 border-l-4 border-red-500"><p className="text-sm text-gray-500">Serious/Severe</p><p className="text-2xl font-bold text-red-600">{highRisk}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">High-Alert Meds</p><p className="text-2xl font-bold text-orange-600">{records.filter(r => r.category === 'High-Alert Medication').length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">This Month</p><p className="text-2xl font-bold text-blue-600">{records.filter(r => r.dateReported.startsWith('2026-08')).length}</p></Card>
      </div>

      {showAdd && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Report Medication Safety Issue</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Patient Name" value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })} />
            <Input placeholder="MRN" value={form.mrn} onChange={e => setForm({ ...form, mrn: e.target.value })} />
            <select className="border rounded-lg px-3 py-2" value={form.ward} onChange={e => setForm({ ...form, ward: e.target.value })}>
              <option value="">Ward</option>
              {WARDS.map(w => <option key={w}>{w}</option>)}
            </select>
            <Input placeholder="Medication" value={form.medication} onChange={e => setForm({ ...form, medication: e.target.value })} />
            <select className="border rounded-lg px-3 py-2" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              <option value="">Category</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2" value={form.issueType} onChange={e => setForm({ ...form, issueType: e.target.value })}>
              <option value="">Issue Type</option>
              {ISSUE_TYPES.map(i => <option key={i}>{i}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
              <option value="">Severity</option>
              {SEVERITY_LEVELS.map(s => <option key={s}>{s}</option>)}
            </select>
            <Input placeholder="Discovered By" value={form.discoveredBy} onChange={e => setForm({ ...form, discoveredBy: e.target.value })} />
            <Input type="date" placeholder="Date Discovered" value={form.dateDiscovered} onChange={e => setForm({ ...form, dateDiscovered: e.target.value })} />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="border rounded-lg px-3 py-2 col-span-3" rows={2} />
            <textarea placeholder="Root Cause" value={form.cause} onChange={e => setForm({ ...form, cause: e.target.value })} className="border rounded-lg px-3 py-2 col-span-3" rows={2} />
            <textarea placeholder="Immediate Action Taken" value={form.immediateAction} onChange={e => setForm({ ...form, immediateAction: e.target.value })} className="border rounded-lg px-3 py-2 col-span-3" rows={2} />
            <Input placeholder="Outcome" value={form.outcome} onChange={e => setForm({ ...form, outcome: e.target.value })} />
            <Input placeholder="Reported By" value={form.reportedBy} onChange={e => setForm({ ...form, reportedBy: e.target.value })} />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAdd} className="bg-red-600 text-white">Submit Report</Button>
            <Button onClick={() => setShowAdd(false)} className="bg-gray-300">Cancel</Button>
          </div>
        </Card>
      )}

      <div className="mb-4">
        <Input placeholder="🔍 Search by patient, medication, or ward..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Patient</th>
                <th className="p-3 text-left">Ward</th>
                <th className="p-3 text-left">Medication</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Issue</th>
                <th className="p-3 text-left">Severity</th>
                <th className="p-3 text-left">Discovered By</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">{r.id}</td>
                  <td className="p-3 font-medium">{r.patientName}</td>
                  <td className="p-3">{r.ward}</td>
                  <td className="p-3">{r.medication}</td>
                  <td className="p-3"><Badge className={r.category === 'High-Alert Medication' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>{r.category}</Badge></td>
                  <td className="p-3">{r.issueType}</td>
                  <td className="p-3"><Badge className={r.severity === 'Near Miss' ? 'bg-yellow-100 text-yellow-800' : r.severity === 'Serious' || r.severity === 'Severe' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}>{r.severity}</Badge></td>
                  <td className="p-3">{r.discoveredBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
