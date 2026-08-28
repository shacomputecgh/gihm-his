import { useState, useMemo } from 'react';
import { Card, Badge, Button, Input } from '../../components/ui';

interface CrisisEvent {
  id: string;
  patientName: string;
  mrn: string;
  dateTime: string;
  type: string;
  severity: string;
  location: string;
  presentingBehavior: string;
  precipitatingFactor: string;
  mentalStateExam: string;
  suicideRisk: string;
  violenceRisk: string;
  restraintUsed: boolean;
  restraintType: string;
  prnMedication: string;
  responseToMeds: string;
  resolvedBy: string;
  outcome: string;
  followUpPlan: string;
  reportedBy: string;
}

const CRISIS_TYPES = ['Suicidal Ideation', 'Self-Harm', 'Homicidal Ideation', 'Psychotic Episode', 'Severe Agitation', 'Acute Anxiety/Panic', 'Delirium', 'Substance-Related', 'Catatonia', 'Elopement Attempt', 'Other'];
const SEVERITY = ['Low', 'Moderate', 'High', 'Critical'];
const SUICIDE_RISK = ['None', 'Low', 'Moderate', 'High', 'Imminent'];
const VIOLENCE_RISK = ['None', 'Low', 'Moderate', 'High'];
const OUTCOMES = ['De-escalated', 'Contained', 'Transferred to Ward', 'Transferred to ED', 'Discharged', 'Referred to Specialist', 'Ongoing Monitoring'];
const LOCATIONS = ['Psychiatric Ward', 'Emergency Department', 'General Ward', 'Outpatient Clinic', 'Community'];

export default function MentalHealthCrisis() {
  const [records, setRecords] = useState<CrisisEvent[]>([
    { id: 'MC-001', patientName: 'Kwame Boateng', mrn: 'MRN-P001', dateTime: '2026-08-24 14:30', type: 'Severe Agitation', severity: 'High', location: 'Psychiatric Ward', presentingBehavior: 'Loud shouting, throwing objects, pacing', precipitatingFactor: 'Medication non-compliance', mentalStateExam: 'Agitated, disoriented, suspicious', suicideRisk: 'Low', violenceRisk: 'High', restraintUsed: true, restraintType: '4-point mechanical', prnMedication: 'Haloperidol 10mg IM + Lorazepam 4mg IM', responseToMeds: 'Settled within 45 minutes', resolvedBy: 'Dr. Mensah', outcome: 'De-escalated', followUpPlan: 'Review medication regimen, increase observation frequency', reportedBy: 'Nurse Esi' },
    { id: 'MC-002', patientName: 'Ama Darko', mrn: 'MRN-P002', dateTime: '2026-08-23 22:15', type: 'Suicidal Ideation', severity: 'Critical', location: 'Emergency Department', presentingBehavior: 'Expressed desire to end life, tearful, withdrawn', precipitatingFactor: 'Relationship breakdown', mentalStateExam: 'Low mood, flat affect, poor eye contact', suicideRisk: 'High', violenceRisk: 'None', restraintUsed: false, restraintType: '', prnMedication: '', responseToMeds: 'Engaged in crisis counselling', resolvedBy: 'Dr. Akosua Mensah', outcome: 'Transferred to Ward', followUpPlan: '1:1 observation, psychiatric review in morning, safety plan', reportedBy: 'ED Nurse' },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState<CrisisEvent>({ id: '', patientName: '', mrn: '', dateTime: '', type: '', severity: 'Moderate', location: 'Psychiatric Ward', presentingBehavior: '', precipitatingFactor: '', mentalStateExam: '', suicideRisk: 'None', violenceRisk: 'None', restraintUsed: false, restraintType: '', prnMedication: '', responseToMeds: '', resolvedBy: '', outcome: '', followUpPlan: '', reportedBy: '' });

  const filtered = useMemo(() => records.filter(r =>
    r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.type.toLowerCase().includes(searchTerm.toLowerCase())
  ), [records, searchTerm]);

  const handleAdd = () => {
    const r: CrisisEvent = { ...form, id: `MC-${String(records.length + 1).padStart(3, '0')}` };
    setRecords([r, ...records]);
    setShowAdd(false);
    setForm({ id: '', patientName: '', mrn: '', dateTime: '', type: '', severity: 'Moderate', location: 'Psychiatric Ward', presentingBehavior: '', precipitatingFactor: '', mentalStateExam: '', suicideRisk: 'None', violenceRisk: 'None', restraintUsed: false, restraintType: '', prnMedication: '', responseToMeds: '', resolvedBy: '', outcome: '', followUpPlan: '', reportedBy: '' });
  };

  const critical = records.filter(r => r.severity === 'Critical' || r.severity === 'High').length;
  const restraints = records.filter(r => r.restraintUsed).length;
  const active = records.filter(r => !['Discharged', 'De-escalated'].includes(r.outcome)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🧠 Mental Health Crisis Management</h1>
          <p className="text-gray-600">Acute psychiatric crisis events — de-escalation, restraint, and follow-up</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="bg-red-600 hover:bg-red-700 text-white">+ Record Crisis Event</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-red-500"><p className="text-sm text-gray-500">Critical/High Severity</p><p className="text-2xl font-bold text-red-600">{critical}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Total Events</p><p className="text-2xl font-bold">{records.length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Restraint Episodes</p><p className="text-2xl font-bold text-orange-600">{restraints}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Active/Ongoing</p><p className="text-2xl font-bold text-blue-600">{active}</p></Card>
      </div>

      {showAdd && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Record Crisis Event</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Patient Name" value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })} />
            <Input placeholder="MRN" value={form.mrn} onChange={e => setForm({ ...form, mrn: e.target.value })} />
            <Input type="datetime-local" placeholder="Date/Time" value={form.dateTime} onChange={e => setForm({ ...form, dateTime: e.target.value })} />
            <select className="border rounded-lg px-3 py-2" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="">Select Crisis Type</option>
              {CRISIS_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
              {SEVERITY.map(s => <option key={s}>{s}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}>
              {LOCATIONS.map(l => <option key={l}>{l}</option>)}
            </select>
            <textarea placeholder="Presenting Behavior" value={form.presentingBehavior} onChange={e => setForm({ ...form, presentingBehavior: e.target.value })} className="border rounded-lg px-3 py-2 col-span-3" rows={2} />
            <textarea placeholder="Precipitating Factor" value={form.precipitatingFactor} onChange={e => setForm({ ...form, precipitatingFactor: e.target.value })} className="border rounded-lg px-3 py-2" rows={2} />
            <textarea placeholder="Mental State Examination" value={form.mentalStateExam} onChange={e => setForm({ ...form, mentalStateExam: e.target.value })} className="border rounded-lg px-3 py-2" rows={2} />
            <div className="space-y-2">
              <select className="border rounded-lg px-3 py-2 w-full" value={form.suicideRisk} onChange={e => setForm({ ...form, suicideRisk: e.target.value })}>
                {SUICIDE_RISK.map(s => <option key={s}>Suicide Risk: {s}</option>)}
              </select>
              <select className="border rounded-lg px-3 py-2 w-full" value={form.violenceRisk} onChange={e => setForm({ ...form, violenceRisk: e.target.value })}>
                {VIOLENCE_RISK.map(v => <option key={v}>Violence Risk: {v}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.restraintUsed} onChange={e => setForm({ ...form, restraintUsed: e.target.checked })} className="rounded" />
              <span>Restraint Used</span>
            </label>
            {form.restraintUsed && <Input placeholder="Restraint Type" value={form.restraintType} onChange={e => setForm({ ...form, restraintType: e.target.value })} />}
            <Input placeholder="PRN Medication Given" value={form.prnMedication} onChange={e => setForm({ ...form, prnMedication: e.target.value })} />
            <Input placeholder="Response to Medication" value={form.responseToMeds} onChange={e => setForm({ ...form, responseToMeds: e.target.value })} />
            <Input placeholder="Resolved By" value={form.resolvedBy} onChange={e => setForm({ ...form, resolvedBy: e.target.value })} />
            <select className="border rounded-lg px-3 py-2" value={form.outcome} onChange={e => setForm({ ...form, outcome: e.target.value })}>
              <option value="">Select Outcome</option>
              {OUTCOMES.map(o => <option key={o}>{o}</option>)}
            </select>
            <Input placeholder="Reported By" value={form.reportedBy} onChange={e => setForm({ ...form, reportedBy: e.target.value })} />
            <textarea placeholder="Follow-up Plan" value={form.followUpPlan} onChange={e => setForm({ ...form, followUpPlan: e.target.value })} className="border rounded-lg px-3 py-2 col-span-3" rows={2} />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAdd} className="bg-red-600 text-white">Save Crisis Event</Button>
            <Button onClick={() => setShowAdd(false)} className="bg-gray-300">Cancel</Button>
          </div>
        </Card>
      )}

      <div className="mb-4">
        <Input placeholder="🔍 Search by patient name or crisis type..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Patient</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Severity</th>
                <th className="p-3 text-left">Suicide Risk</th>
                <th className="p-3 text-left">Violence Risk</th>
                <th className="p-3 text-left">Restraint</th>
                <th className="p-3 text-left">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">{r.id}</td>
                  <td className="p-3 font-medium">{r.patientName}</td>
                  <td className="p-3">{r.type}</td>
                  <td className="p-3"><Badge className={r.severity === 'Critical' ? 'bg-red-100 text-red-800' : r.severity === 'High' ? 'bg-orange-100 text-orange-800' : r.severity === 'Moderate' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>{r.severity}</Badge></td>
                  <td className="p-3"><Badge className={r.suicideRisk === 'High' || r.suicideRisk === 'Imminent' ? 'bg-red-100 text-red-800' : r.suicideRisk === 'Moderate' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>{r.suicideRisk}</Badge></td>
                  <td className="p-3"><Badge className={r.violenceRisk === 'High' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}>{r.violenceRisk}</Badge></td>
                  <td className="p-3">{r.restraintUsed ? <Badge className="bg-red-100 text-red-800">{r.restraintType}</Badge> : <span className="text-gray-400">None</span>}</td>
                  <td className="p-3"><Badge className="bg-blue-100 text-blue-800">{r.outcome}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
