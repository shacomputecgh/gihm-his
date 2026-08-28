import { useState, useMemo } from 'react';
import { Card, Badge, Button, Input } from '../../components/ui';

interface PsychPatient {
  id: string;
  patientName: string;
  mrn: string;
  age: number;
  gender: string;
  diagnosis: string;
  admissionDate: string;
  legalStatus: string;
  riskLevel: string;
  observationLevel: string;
  room: string;
  assignedNurse: string;
  treatingPsychiatrist: string;
  medication: string;
  nextReview: string;
  leaveStatus: string;
  dischargePlan: string;
}

const DIAGNOSES = ['Schizophrenia', 'Bipolar Disorder', 'Major Depression', 'Generalised Anxiety', 'PTSD', 'Personality Disorder', 'Substance Use Disorder', 'Acute Psychosis', 'Delirium', 'Other'];
const LEGAL_STATUS = ['Voluntary', 'Involuntary (Mental Health Act)', 'Court-Ordered', 'Section 2 (Assessment)', 'Section 3 (Treatment)'];
const OBS_LEVELS = ['General', 'Escalated', 'Intensive (1:1)', 'Sensory Room', 'Seclusion'];
const RISK_LEVELS = ['Low', 'Medium', 'High', 'Very High'];

export default function PsychiatricWardManagement() {
  const [patients, setPatients] = useState<PsychPatient[]>([
    { id: 'PW-001', patientName: 'Kwame Boateng', mrn: 'MRN-P001', age: 32, gender: 'Male', diagnosis: 'Schizophrenia', admissionDate: '2026-08-20', legalStatus: 'Voluntary', riskLevel: 'High', observationLevel: 'Escalated', room: 'Room 3A', assignedNurse: 'Nurse Esi', treatingPsychiatrist: 'Dr. Mensah', medication: 'Risperidone 4mg, Procyclidine 5mg', nextReview: '2026-08-26', leaveStatus: 'Not Approved', dischargePlan: '' },
    { id: 'PW-002', patientName: 'Ama Darko', mrn: 'MRN-P002', age: 28, gender: 'Female', diagnosis: 'Major Depression', admissionDate: '2026-08-23', legalStatus: 'Involuntary (Mental Health Act)', riskLevel: 'Very High', observationLevel: 'Intensive (1:1)', room: 'Room 1B', assignedNurse: 'Nurse Kofi', treatingPsychiatrist: 'Dr. Akosua', medication: 'Sertraline 100mg', nextReview: '2026-08-25', leaveStatus: 'Not Approved', dischargePlan: '' },
    { id: 'PW-003', patientName: 'Yaw Frimpong', mrn: 'MRN-P003', age: 45, gender: 'Male', diagnosis: 'Bipolar Disorder', admissionDate: '2026-08-15', legalStatus: 'Voluntary', riskLevel: 'Low', observationLevel: 'General', room: 'Room 5C', assignedNurse: 'Nurse Akua', treatingPsychiatrist: 'Dr. Mensah', medication: 'Lithium 900mg, Quetiapine 200mg', nextReview: '2026-08-27', leaveStatus: 'Day Leave Approved', dischargePlan: 'Target discharge: 2026-08-30' },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState<PsychPatient>({ id: '', patientName: '', mrn: '', age: 0, gender: '', diagnosis: '', admissionDate: '', legalStatus: 'Voluntary', riskLevel: 'Low', observationLevel: 'General', room: '', assignedNurse: '', treatingPsychiatrist: '', medication: '', nextReview: '', leaveStatus: 'Not Approved', dischargePlan: '' });

  const filtered = useMemo(() => patients.filter(p =>
    p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
  ), [patients, searchTerm]);

  const handleAdd = () => {
    const p: PsychPatient = { ...form, id: `PW-${String(patients.length + 1).padStart(3, '0')}` };
    setPatients([p, ...patients]);
    setShowAdd(false);
    setForm({ id: '', patientName: '', mrn: '', age: 0, gender: '', diagnosis: '', admissionDate: '', legalStatus: 'Voluntary', riskLevel: 'Low', observationLevel: 'General', room: '', assignedNurse: '', treatingPsychiatrist: '', medication: '', nextReview: '', leaveStatus: 'Not Approved', dischargePlan: '' });
  };

  const highRisk = patients.filter(p => p.riskLevel === 'High' || p.riskLevel === 'Very High').length;
  const involuntary = patients.filter(p => p.legalStatus !== 'Voluntary').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏥 Psychiatric Ward Management</h1>
          <p className="text-gray-600">Inpatient psychiatric care — risk assessment, observation levels, legal status</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="bg-purple-600 hover:bg-purple-700 text-white">+ Admit Patient</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4"><p className="text-sm text-gray-500">Total Admitted</p><p className="text-2xl font-bold">{patients.length}</p></Card>
        <Card className="p-4 border-l-4 border-red-500"><p className="text-sm text-gray-500">High/Very High Risk</p><p className="text-2xl font-bold text-red-600">{highRisk}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Involuntary Patients</p><p className="text-2xl font-bold text-orange-600">{involuntary}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">1:1 Observations</p><p className="text-2xl font-bold text-blue-600">{patients.filter(p => p.observationLevel.includes('1:1')).length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">On Leave</p><p className="text-2xl font-bold text-green-600">{patients.filter(p => p.leaveStatus.includes('Approved')).length}</p></Card>
      </div>

      {showAdd && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Admit Patient to Psychiatric Ward</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Patient Name" value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })} />
            <Input placeholder="MRN" value={form.mrn} onChange={e => setForm({ ...form, mrn: e.target.value })} />
            <Input type="number" placeholder="Age" value={String(form.age)} onChange={e => setForm({ ...form, age: Number(e.target.value) })} />
            <select className="border rounded-lg px-3 py-2" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
              <option value="">Gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
            <select className="border rounded-lg px-3 py-2" value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })}>
              <option value="">Diagnosis</option>
              {DIAGNOSES.map(d => <option key={d}>{d}</option>)}
            </select>
            <Input type="date" placeholder="Admission Date" value={form.admissionDate} onChange={e => setForm({ ...form, admissionDate: e.target.value })} />
            <select className="border rounded-lg px-3 py-2" value={form.legalStatus} onChange={e => setForm({ ...form, legalStatus: e.target.value })}>
              {LEGAL_STATUS.map(l => <option key={l}>{l}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2" value={form.riskLevel} onChange={e => setForm({ ...form, riskLevel: e.target.value })}>
              {RISK_LEVELS.map(r => <option key={r}>{r}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2" value={form.observationLevel} onChange={e => setForm({ ...form, observationLevel: e.target.value })}>
              {OBS_LEVELS.map(o => <option key={o}>{o}</option>)}
            </select>
            <Input placeholder="Room" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} />
            <Input placeholder="Assigned Nurse" value={form.assignedNurse} onChange={e => setForm({ ...form, assignedNurse: e.target.value })} />
            <Input placeholder="Treating Psychiatrist" value={form.treatingPsychiatrist} onChange={e => setForm({ ...form, treatingPsychiatrist: e.target.value })} />
            <Input placeholder="Current Medication" value={form.medication} onChange={e => setForm({ ...form, medication: e.target.value })} />
            <Input type="date" placeholder="Next Review Date" value={form.nextReview} onChange={e => setForm({ ...form, nextReview: e.target.value })} />
            <textarea placeholder="Discharge Plan" value={form.dischargePlan} onChange={e => setForm({ ...form, dischargePlan: e.target.value })} className="border rounded-lg px-3 py-2 col-span-3" rows={2} />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAdd} className="bg-purple-600 text-white">Save Admission</Button>
            <Button onClick={() => setShowAdd(false)} className="bg-gray-300">Cancel</Button>
          </div>
        </Card>
      )}

      <div className="mb-4">
        <Input placeholder="🔍 Search by name, MRN, or diagnosis..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Patient</th>
                <th className="p-3 text-left">Diagnosis</th>
                <th className="p-3 text-left">Legal Status</th>
                <th className="p-3 text-left">Risk</th>
                <th className="p-3 text-left">Observation</th>
                <th className="p-3 text-left">Room</th>
                <th className="p-3 text-left">Next Review</th>
                <th className="p-3 text-left">Leave</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">{p.id}</td>
                  <td className="p-3">
                    <div className="font-medium">{p.patientName}</div>
                    <div className="text-xs text-gray-500">{p.age}y {p.gender}</div>
                  </td>
                  <td className="p-3">{p.diagnosis}</td>
                  <td className="p-3"><Badge className={p.legalStatus !== 'Voluntary' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>{p.legalStatus}</Badge></td>
                  <td className="p-3"><Badge className={p.riskLevel === 'Very High' || p.riskLevel === 'High' ? 'bg-red-100 text-red-800' : p.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>{p.riskLevel}</Badge></td>
                  <td className="p-3"><Badge className={p.observationLevel.includes('1:1') ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>{p.observationLevel}</Badge></td>
                  <td className="p-3">{p.room}</td>
                  <td className="p-3">{p.nextReview}</td>
                  <td className="p-3"><Badge className={p.leaveStatus.includes('Approved') ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>{p.leaveStatus}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
