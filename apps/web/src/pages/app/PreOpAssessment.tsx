import { useState, useMemo } from 'react';
import { Card, Badge, Button, Input } from '../../components/ui';

interface PreOp {
  id: string;
  patientName: string;
  mrn: string;
  procedure: string;
  surgeon: string;
  date: string;
  height: string;
  weight: string;
  bmi: string;
  bloodPressure: string;
  heartRate: string;
  rr: string;
  spo2: string;
  temperature: string;
  airwayAssessment: string;
  mallampati: string;
  recentUcP: string;
  comorbidities: string;
  allergies: string;
  medications: string;
  nhsStatus: string;
  fcStatus: string;
  consentObtained: boolean;
  anaesthesiaPlan: string;
  fitnessStatus: string;
  comments: string;
  assessedBy: string;
  status: string;
}

const MALLAMPATI = ['Class I', 'Class II', 'Class III', 'Class IV'];
const AIRWAYS = ['Normal', 'Difficult - Limited Mouth Opening', 'Difficult - Short Neck', 'Difficult - Obesity', 'Difficult - Previous Difficult Intubation', 'Other'];
const FITNESS = ['Fit', 'Fit with Conditions', 'Unfit - Postpone', 'Referred for Review'];

export default function PreOpAssessment() {
  const [records, setRecords] = useState<PreOp[]>([
    { id: 'PO-001', patientName: 'Kofi Mensah', mrn: 'MRN-001', procedure: 'Appendicectomy', surgeon: 'Dr. Osei', date: '2026-08-24', height: '170 cm', weight: '75 kg', bmi: '25.9', bloodPressure: '128/82', heartRate: '78', rr: '16', spo2: '98%', temperature: '36.8', airwayAssessment: 'Normal', mallampati: 'Class I', recentUcP: 'No', comorbidities: 'None', allergies: 'Penicillin', medications: 'None', nhsStatus: 'NHIS', fcStatus: 'Done - Hb 13.2', consentObtained: true, anaesthesiaPlan: 'General Anaesthesia', fitnessStatus: 'Fit', comments: 'All investigations within normal limits', assessedBy: 'Dr. Anane (Anaesthetist)', status: 'Approved' },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState<PreOp>({ id: '', patientName: '', mrn: '', procedure: '', surgeon: '', date: '', height: '', weight: '', bmi: '', bloodPressure: '', heartRate: '', rr: '', spo2: '', temperature: '', airwayAssessment: 'Normal', mallampati: 'Class I', recentUcP: 'No', comorbidities: '', allergies: '', medications: '', nhsStatus: 'NHIS', fcStatus: '', consentObtained: false, anaesthesiaPlan: '', fitnessStatus: '', comments: '', assessedBy: '', status: 'Pending' });

  const filtered = useMemo(() => records.filter(r =>
    r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.procedure.toLowerCase().includes(searchTerm.toLowerCase())
  ), [records, searchTerm]);

  const handleAdd = () => {
    const r: PreOp = { ...form, id: `PO-${String(records.length + 1).padStart(3, '0')}` };
    setRecords([r, ...records]);
    setShowAdd(false);
    setForm({ id: '', patientName: '', mrn: '', procedure: '', surgeon: '', date: '', height: '', weight: '', bmi: '', bloodPressure: '', heartRate: '', rr: '', spo2: '', temperature: '', airwayAssessment: 'Normal', mallampati: 'Class I', recentUcP: 'No', comorbidities: '', allergies: '', medications: '', nhsStatus: 'NHIS', fcStatus: '', consentObtained: false, anaesthesiaPlan: '', fitnessStatus: '', comments: '', assessedBy: '', status: 'Pending' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🩺 Pre-Operative Assessment</h1>
          <p className="text-gray-600">Pre-anaesthesia assessment — airway, fitness, investigations, consent</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="bg-green-600 hover:bg-green-700 text-white">+ New Assessment</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-sm text-gray-500">Total Assessments</p><p className="text-2xl font-bold">{records.length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Fit</p><p className="text-2xl font-bold text-green-600">{records.filter(r => r.fitnessStatus === 'Fit').length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Fit with Conditions</p><p className="text-2xl font-bold text-yellow-600">{records.filter(r => r.fitnessStatus === 'Fit with Conditions').length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Unfit - Postpone</p><p className="text-2xl font-bold text-red-600">{records.filter(r => r.fitnessStatus === 'Unfit - Postpone').length}</p></Card>
      </div>

      {showAdd && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">New Pre-Operative Assessment</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Patient Name" value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })} />
            <Input placeholder="MRN" value={form.mrn} onChange={e => setForm({ ...form, mrn: e.target.value })} />
            <Input placeholder="Planned Procedure" value={form.procedure} onChange={e => setForm({ ...form, procedure: e.target.value })} />
            <Input placeholder="Surgeon" value={form.surgeon} onChange={e => setForm({ ...form, surgeon: e.target.value })} />
            <Input type="date" placeholder="Assessment Date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            <Input placeholder="Assessed By" value={form.assessedBy} onChange={e => setForm({ ...form, assessedBy: e.target.value })} />
            <hr className="col-span-3" />
            <p className="col-span-3 font-semibold text-gray-700">Vital Signs</p>
            <Input placeholder="Height" value={form.height} onChange={e => setForm({ ...form, height: e.target.value })} />
            <Input placeholder="Weight" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} />
            <Input placeholder="BMI" value={form.bmi} onChange={e => setForm({ ...form, bmi: e.target.value })} />
            <Input placeholder="BP" value={form.bloodPressure} onChange={e => setForm({ ...form, bloodPressure: e.target.value })} />
            <Input placeholder="Heart Rate" value={form.heartRate} onChange={e => setForm({ ...form, heartRate: e.target.value })} />
            <Input placeholder="SpO2" value={form.spo2} onChange={e => setForm({ ...form, spo2: e.target.value })} />
            <hr className="col-span-3" />
            <p className="col-span-3 font-semibold text-gray-700">Airway Assessment</p>
            <select className="border rounded-lg px-3 py-2" value={form.airwayAssessment} onChange={e => setForm({ ...form, airwayAssessment: e.target.value })}>
              {AIRWAYS.map(a => <option key={a}>{a}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2" value={form.mallampati} onChange={e => setForm({ ...form, mallampati: e.target.value })}>
              {MALLAMPATI.map(m => <option key={m}>{m}</option>)}
            </select>
            <Input placeholder="Recent UCG/CXR" value={form.recentUcP} onChange={e => setForm({ ...form, recentUcP: e.target.value })} />
            <textarea placeholder="Comorbidities" value={form.comorbidities} onChange={e => setForm({ ...form, comorbidities: e.target.value })} className="border rounded-lg px-3 py-2" rows={2} />
            <textarea placeholder="Allergies" value={form.allergies} onChange={e => setForm({ ...form, allergies: e.target.value })} className="border rounded-lg px-3 py-2" rows={2} />
            <textarea placeholder="Current Medications" value={form.medications} onChange={e => setForm({ ...form, medications: e.target.value })} className="border rounded-lg px-3 py-2" rows={2} />
            <Input placeholder="Fitness Consent Status" value={form.fcStatus} onChange={e => setForm({ ...form, fcStatus: e.target.value })} />
            <Input placeholder="Anaesthesia Plan" value={form.anaesthesiaPlan} onChange={e => setForm({ ...form, anaesthesiaPlan: e.target.value })} />
            <select className="border rounded-lg px-3 py-2" value={form.fitnessStatus} onChange={e => setForm({ ...form, fitnessStatus: e.target.value })}>
              <option value="">Fitness Status</option>
              {FITNESS.map(f => <option key={f}>{f}</option>)}
            </select>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.consentObtained} onChange={e => setForm({ ...form, consentObtained: e.target.checked })} className="rounded" />
              <span>Consent Obtained</span>
            </label>
            <textarea placeholder="Comments" value={form.comments} onChange={e => setForm({ ...form, comments: e.target.value })} className="border rounded-lg px-3 py-2 col-span-3" rows={2} />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAdd} className="bg-green-600 text-white">Save Assessment</Button>
            <Button onClick={() => setShowAdd(false)} className="bg-gray-300">Cancel</Button>
          </div>
        </Card>
      )}

      <div className="mb-4">
        <Input placeholder="🔍 Search by patient or procedure..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Patient</th>
                <th className="p-3 text-left">Procedure</th>
                <th className="p-3 text-left">Airway</th>
                <th className="p-3 text-left">Mallampati</th>
                <th className="p-3 text-left">Consent</th>
                <th className="p-3 text-left">Fitness</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">{r.id}</td>
                  <td className="p-3 font-medium">{r.patientName}</td>
                  <td className="p-3">{r.procedure}</td>
                  <td className="p-3"><Badge className={r.airwayAssessment === 'Normal' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{r.airwayAssessment}</Badge></td>
                  <td className="p-3"><Badge className={r.mallampati === 'Class I' || r.mallampati === 'Class II' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{r.mallampati}</Badge></td>
                  <td className="p-3">{r.consentObtained ? <Badge className="bg-green-100 text-green-800">Yes</Badge> : <Badge className="bg-red-100 text-red-800">No</Badge>}</td>
                  <td className="p-3"><Badge className={r.fitnessStatus === 'Fit' ? 'bg-green-100 text-green-800' : r.fitnessStatus === 'Unfit - Postpone' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>{r.fitnessStatus}</Badge></td>
                  <td className="p-3"><Badge className={r.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
