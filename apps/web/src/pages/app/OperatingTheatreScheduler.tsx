import { useState, useMemo } from 'react';
import { Card, Badge, Button, Input } from '../../components/ui';

interface TheatreCase {
  id: string;
  patientName: string;
  mrn: string;
  procedure: string;
  surgeon: string;
  anaesthetist: string;
  theatre: string;
  date: string;
  startTime: string;
  estimatedDuration: string;
  actualStartTime: string;
  actualEndTime: string;
  priority: string;
  asaGrade: string;
  infectionRisk: string;
  specialEquipment: string;
  status: string;
  complications: string;
  bloodLoss: string;
}

const THEATRES = ['Theatre 1 (Major)', 'Theatre 2 (Major)', 'Theatre 3 (Minor)', 'Theatre 4 (Day Surgery)', 'Theatre 5 (Obstetric)', 'Theatre 6 (Cardiac)'];
const PRIORITIES = ['Elective', 'Urgent', 'Emergency', 'Add-on'];
const ASA_GRADES = ['ASA I', 'ASA II', 'ASA III', 'ASA IV', 'ASA V'];
const INFECTION_RISKS = ['Clean', 'Clean-Contaminated', 'Contaminated', 'Dirty'];

export default function OperatingTheatreScheduler() {
  const [cases, setCases] = useState<TheatreCase[]>([
    { id: 'OT-001', patientName: 'Kofi Mensah', mrn: 'MRN-001', procedure: 'Appendicectomy', surgeon: 'Dr. Osei', anaesthetist: 'Dr. Anane', theatre: 'Theatre 3 (Minor)', date: '2026-08-25', startTime: '08:00', estimatedDuration: '1 hour', actualStartTime: '', actualEndTime: '', priority: 'Urgent', asaGrade: 'ASA II', infectionRisk: 'Clean-Contaminated', specialEquipment: 'Laparoscopic stack', status: 'Scheduled', complications: '', bloodLoss: '' },
    { id: 'OT-002', patientName: 'Ama Darko', mrn: 'MRN-002', procedure: 'Caesarean Section', surgeon: 'Dr. Akosua', anaesthetist: 'Dr. Kwesi', theatre: 'Theatre 5 (Obstetric)', date: '2026-08-25', startTime: '09:00', estimatedDuration: '45 minutes', actualStartTime: '', actualEndTime: '', priority: 'Urgent', asaGrade: 'ASA II', infectionRisk: 'Clean-Contaminated', specialEquipment: '', status: 'Confirmed', complications: '', bloodLoss: '' },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState<TheatreCase>({ id: '', patientName: '', mrn: '', procedure: '', surgeon: '', anaesthetist: '', theatre: '', date: '', startTime: '', estimatedDuration: '', actualStartTime: '', actualEndTime: '', priority: 'Elective', asaGrade: 'ASA I', infectionRisk: 'Clean', specialEquipment: '', status: 'Scheduled', complications: '', bloodLoss: '' });

  const filtered = useMemo(() => cases.filter(c =>
    c.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.procedure.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.surgeon.toLowerCase().includes(searchTerm.toLowerCase())
  ), [cases, searchTerm]);

  const handleAdd = () => {
    const c: TheatreCase = { ...form, id: `OT-${String(cases.length + 1).padStart(3, '0')}` };
    setCases([c, ...cases]);
    setShowAdd(false);
    setForm({ id: '', patientName: '', mrn: '', procedure: '', surgeon: '', anaesthetist: '', theatre: '', date: '', startTime: '', estimatedDuration: '', actualStartTime: '', actualEndTime: '', priority: 'Elective', asaGrade: 'ASA I', infectionRisk: 'Clean', specialEquipment: '', status: 'Scheduled', complications: '', bloodLoss: '' });
  };

  const today = cases.filter(c => c.date === '2026-08-25');
  const inProgress = cases.filter(c => c.status === 'In Progress' || c.status === 'In Theatre').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏥 Operating Theatre Scheduler</h1>
          <p className="text-gray-600">Surgery scheduling, theatre utilisation, anaesthesia records</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="bg-green-600 hover:bg-green-700 text-white">+ Schedule Case</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4"><p className="text-sm text-gray-500">Today's List</p><p className="text-2xl font-bold">{today.length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Total Cases</p><p className="text-2xl font-bold">{cases.length}</p></Card>
        <Card className="p-4 border-l-4 border-blue-500"><p className="text-sm text-gray-500">In Theatre / In Progress</p><p className="text-2xl font-bold text-blue-600">{inProgress}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Emergency Cases</p><p className="text-2xl font-bold text-red-600">{cases.filter(c => c.priority === 'Emergency').length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Completed Today</p><p className="text-2xl font-bold text-green-600">{cases.filter(c => c.status === 'Completed').length}</p></Card>
      </div>

      {showAdd && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Schedule Theatre Case</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Patient Name" value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })} />
            <Input placeholder="MRN" value={form.mrn} onChange={e => setForm({ ...form, mrn: e.target.value })} />
            <Input placeholder="Procedure" value={form.procedure} onChange={e => setForm({ ...form, procedure: e.target.value })} />
            <Input placeholder="Surgeon" value={form.surgeon} onChange={e => setForm({ ...form, surgeon: e.target.value })} />
            <Input placeholder="Anaesthetist" value={form.anaesthetist} onChange={e => setForm({ ...form, anaesthetist: e.target.value })} />
            <select className="border rounded-lg px-3 py-2" value={form.theatre} onChange={e => setForm({ ...form, theatre: e.target.value })}>
              <option value="">Theatre</option>
              {THEATRES.map(t => <option key={t}>{t}</option>)}
            </select>
            <Input type="date" placeholder="Date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            <Input type="time" placeholder="Start Time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
            <Input placeholder="Estimated Duration" value={form.estimatedDuration} onChange={e => setForm({ ...form, estimatedDuration: e.target.value })} />
            <select className="border rounded-lg px-3 py-2" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2" value={form.asaGrade} onChange={e => setForm({ ...form, asaGrade: e.target.value })}>
              {ASA_GRADES.map(a => <option key={a}>{a}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2" value={form.infectionRisk} onChange={e => setForm({ ...form, infectionRisk: e.target.value })}>
              {INFECTION_RISKS.map(i => <option key={i}>{i}</option>)}
            </select>
            <Input placeholder="Special Equipment" value={form.specialEquipment} onChange={e => setForm({ ...form, specialEquipment: e.target.value })} />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAdd} className="bg-green-600 text-white">Save</Button>
            <Button onClick={() => setShowAdd(false)} className="bg-gray-300">Cancel</Button>
          </div>
        </Card>
      )}

      <div className="mb-4">
        <Input placeholder="🔍 Search by patient, procedure, or surgeon..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Patient</th>
                <th className="p-3 text-left">Procedure</th>
                <th className="p-3 text-left">Surgeon</th>
                <th className="p-3 text-left">Theatre</th>
                <th className="p-3 text-left">Date/Time</th>
                <th className="p-3 text-left">ASA</th>
                <th className="p-3 text-left">Priority</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">{c.id}</td>
                  <td className="p-3 font-medium">{c.patientName}</td>
                  <td className="p-3">{c.procedure}</td>
                  <td className="p-3">{c.surgeon}</td>
                  <td className="p-3">{c.theatre}</td>
                  <td className="p-3">{c.date} {c.startTime}</td>
                  <td className="p-3"><Badge className="bg-gray-100 text-gray-800">{c.asaGrade}</Badge></td>
                  <td className="p-3"><Badge className={c.priority === 'Emergency' ? 'bg-red-100 text-red-800' : c.priority === 'Urgent' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}>{c.priority}</Badge></td>
                  <td className="p-3"><Badge className={c.status === 'Completed' ? 'bg-green-100 text-green-800' : c.status === 'In Progress' || c.status === 'In Theatre' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}>{c.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
