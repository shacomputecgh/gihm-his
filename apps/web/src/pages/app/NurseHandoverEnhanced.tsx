import { useState, useMemo } from 'react';
import { Card, Badge, Button, Input } from '../../components/ui';

interface Handover {
  id: string;
  ward: string;
  date: string;
  shift: string;
  outgoingNurse: string;
  incomingNurse: string;
  totalPatients: number;
  criticalPatients: number;
  pendingTasks: number;
  bedStatus: string;
  patientBreakdown: string;
  keyIssues: string;
  pendingResults: string;
  escalation: string;
  specialInstructions: string;
  equipmentIssues: string;
  safetyConcerns: string;
  status: string;
}

const SHIFTS = ['Day (07:00-15:00)', 'Evening (15:00-23:00)', 'Night (23:00-07:00)'];
const WARDS = ['Medical Ward A', 'Medical Ward B', 'Surgical Ward A', 'Surgical Ward B', 'Paediatric Ward', 'Maternity Ward', 'ICU', 'NICU', 'Emergency', 'Oncology', 'Psychiatric'];

export default function NurseHandoverEnhanced() {
  const [records, setRecords] = useState<Handover[]>([
    { id: 'HO-001', ward: 'Medical Ward A', date: '2026-08-24', shift: 'Day (07:00-15:00)', outgoingNurse: 'Nurse Ama', incomingNurse: 'Nurse Kofi', totalPatients: 25, criticalPatients: 3, pendingTasks: 8, bedStatus: '22/25 occupied', patientBreakdown: '5 post-op, 12 medical, 3 pneumonia, 2 CHF, 1 DKA, 2 other', keyIssues: 'Bed 12: New admission with suspected PE, awaiting CT. Bed 18: Post-op patient with wound ooze, needs dressing change.', pendingResults: 'Bed 8: Blood culture pending. Bed 15: CT result expected by 14:00.', escalation: 'Bed 22: Blood pressure dropping, doctor notified, fluid bolus running', specialInstructions: 'Bed 5: Strict fluid balance, NBM for procedure tomorrow', equipmentIssues: 'One infusion pump in bay 3 malfunctioning, reported to biomedical', safetyConcerns: 'Bed 10: High fall risk, yellow socks in place', status: 'Completed' },
    { id: 'HO-002', ward: 'ICU', date: '2026-08-24', shift: 'Evening (15:00-23:00)', outgoingNurse: 'ICU Nurse Esi', incomingNurse: 'ICU Nurse Akua', totalPatients: 8, criticalPatients: 5, pendingTasks: 12, bedStatus: '8/8 full', patientBreakdown: '3 ventilated, 2 post-op cardiac, 1 sepsis, 1 DKA, 1 neuro obs', keyIssues: 'Bed 3: Weaning from ventilator, spontaneous breathing trial at 20:00. Bed 6: Increasing vasopressor requirement.', pendingResults: 'Bed 7: ABG result at 21:00. Bed 1: Blood gas analysis due.', escalation: 'Bed 6: Consultant review requested for vasopressor increase', specialInstructions: 'Bed 3: If SBT fails, return to full ventilation and call registrar', equipmentIssues: 'Nil', safetyConcerns: 'All beds have pressure-relieving mattresses, 2-hourly repositioning', status: 'Completed' },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState<Handover>({ id: '', ward: '', date: '', shift: '', outgoingNurse: '', incomingNurse: '', totalPatients: 0, criticalPatients: 0, pendingTasks: 0, bedStatus: '', patientBreakdown: '', keyIssues: '', pendingResults: '', escalation: '', specialInstructions: '', equipmentIssues: '', safetyConcerns: '', status: 'Pending' });

  const filtered = useMemo(() => records.filter(r =>
    r.ward.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.outgoingNurse.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.incomingNurse.toLowerCase().includes(searchTerm.toLowerCase())
  ), [records, searchTerm]);

  const handleAdd = () => {
    const r: Handover = { ...form, id: `HO-${String(records.length + 1).padStart(3, '0')}` };
    setRecords([r, ...records]);
    setShowAdd(false);
    setForm({ id: '', ward: '', date: '', shift: '', outgoingNurse: '', incomingNurse: '', totalPatients: 0, criticalPatients: 0, pendingTasks: 0, bedStatus: '', patientBreakdown: '', keyIssues: '', pendingResults: '', escalation: '', specialInstructions: '', equipmentIssues: '', safetyConcerns: '', status: 'Pending' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🔄 Nurse Handover (Enhanced)</h1>
          <p className="text-gray-600">Structured ISBAR handover — critical patients, pending tasks, escalations</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="bg-green-600 hover:bg-green-700 text-white">+ New Handover</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-sm text-gray-500">Total Handovers</p><p className="text-2xl font-bold">{records.length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Total Patients</p><p className="text-2xl font-bold text-blue-600">{records.reduce((s, r) => s + r.totalPatients, 0)}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Critical Patients</p><p className="text-2xl font-bold text-red-600">{records.reduce((s, r) => s + r.criticalPatients, 0)}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Pending Tasks</p><p className="text-2xl font-bold text-orange-600">{records.reduce((s, r) => s + r.pendingTasks, 0)}</p></Card>
      </div>

      {showAdd && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">New Nurse Handover</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select className="border rounded-lg px-3 py-2" value={form.ward} onChange={e => setForm({ ...form, ward: e.target.value })}>
              <option value="">Ward</option>
              {WARDS.map(w => <option key={w}>{w}</option>)}
            </select>
            <Input type="date" placeholder="Date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            <select className="border rounded-lg px-3 py-2" value={form.shift} onChange={e => setForm({ ...form, shift: e.target.value })}>
              <option value="">Shift</option>
              {SHIFTS.map(s => <option key={s}>{s}</option>)}
            </select>
            <Input placeholder="Outgoing Nurse" value={form.outgoingNurse} onChange={e => setForm({ ...form, outgoingNurse: e.target.value })} />
            <Input placeholder="Incoming Nurse" value={form.incomingNurse} onChange={e => setForm({ ...form, incomingNurse: e.target.value })} />
            <Input type="number" placeholder="Total Patients" value={String(form.totalPatients)} onChange={e => setForm({ ...form, totalPatients: Number(e.target.value) })} />
            <Input type="number" placeholder="Critical Patients" value={String(form.criticalPatients)} onChange={e => setForm({ ...form, criticalPatients: Number(e.target.value) })} />
            <Input type="number" placeholder="Pending Tasks" value={String(form.pendingTasks)} onChange={e => setForm({ ...form, pendingTasks: Number(e.target.value) })} />
            <Input placeholder="Bed Status" value={form.bedStatus} onChange={e => setForm({ ...form, bedStatus: e.target.value })} />
            <textarea placeholder="Patient Breakdown" value={form.patientBreakdown} onChange={e => setForm({ ...form, patientBreakdown: e.target.value })} className="border rounded-lg px-3 py-2 col-span-3" rows={2} />
            <textarea placeholder="Key Issues / Concerns" value={form.keyIssues} onChange={e => setForm({ ...form, keyIssues: e.target.value })} className="border rounded-lg px-3 py-2 col-span-3" rows={2} />
            <textarea placeholder="Pending Results" value={form.pendingResults} onChange={e => setForm({ ...form, pendingResults: e.target.value })} className="border rounded-lg px-3 py-2 col-span-3" rows={2} />
            <textarea placeholder="Escalations" value={form.escalation} onChange={e => setForm({ ...form, escalation: e.target.value })} className="border rounded-lg px-3 py-2 col-span-3" rows={2} />
            <textarea placeholder="Special Instructions" value={form.specialInstructions} onChange={e => setForm({ ...form, specialInstructions: e.target.value })} className="border rounded-lg px-3 py-2 col-span-3" rows={2} />
            <textarea placeholder="Safety Concerns" value={form.safetyConcerns} onChange={e => setForm({ ...form, safetyConcerns: e.target.value })} className="border rounded-lg px-3 py-2 col-span-3" rows={2} />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAdd} className="bg-green-600 text-white">Save Handover</Button>
            <Button onClick={() => setShowAdd(false)} className="bg-gray-300">Cancel</Button>
          </div>
        </Card>
      )}

      <div className="mb-4">
        <Input placeholder="🔍 Search by ward or nurse name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <div className="space-y-4">
        {filtered.map(r => (
          <Card key={r.id} className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold">{r.ward}</h3>
                <p className="text-sm text-gray-500">{r.shift} | {r.date}</p>
              </div>
              <Badge className={r.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>{r.status}</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
              <div><span className="text-gray-500">Outgoing:</span> <span className="font-medium">{r.outgoingNurse}</span></div>
              <div><span className="text-gray-500">Incoming:</span> <span className="font-medium">{r.incomingNurse}</span></div>
              <div><span className="text-gray-500">Patients:</span> <span className="font-medium">{r.totalPatients}</span></div>
              <div><span className="text-gray-500">Beds:</span> <span className="font-medium">{r.bedStatus}</span></div>
            </div>
            {r.keyIssues && <p className="text-sm mb-2"><span className="font-semibold text-orange-700">Key Issues:</span> {r.keyIssues}</p>}
            {r.escalation && <p className="text-sm mb-2"><span className="font-semibold text-red-700">Escalation:</span> {r.escalation}</p>}
            {r.pendingResults && <p className="text-sm mb-2"><span className="font-semibold text-blue-700">Pending Results:</span> {r.pendingResults}</p>}
            {r.specialInstructions && <p className="text-sm"><span className="font-semibold text-purple-700">Special Instructions:</span> {r.specialInstructions}</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}
