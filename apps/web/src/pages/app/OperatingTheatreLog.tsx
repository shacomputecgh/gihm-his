import { useState } from 'react';
import { Badge, Button, Card, Input, Select, useToast } from '../../components/ui';

interface TheatreEntry {
  id: string; patientName: string; mrn: string; age: number; sex: string;
  procedure: string; surgeon: string; anaesthetist: string; theatre: string;
  date: string; startTime: string; endTime: string; anaesthesiaType: string;
  complications: string; bloodLoss: number; specimenSent: boolean;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
}

const INITIAL: TheatreEntry[] = [
  { id: 'TL-001', patientName: 'Kwame Boateng', mrn: 'MRN-2026-040', age: 32, sex: 'M', procedure: 'Laparoscopic Appendectomy', surgeon: 'Dr. Boateng', anaesthetist: 'Dr. Frimpong', theatre: 'Theatre 1', date: '2026-08-25', startTime: '08:00', endTime: '09:30', anaesthesiaType: 'General', complications: 'None', bloodLoss: 50, specimenSent: true, status: 'Completed' },
  { id: 'TL-002', patientName: 'Ama Darko', mrn: 'MRN-2026-041', age: 28, sex: 'F', procedure: 'Caesarean Section (Emergency)', surgeon: 'Dr. Afriyie', anaesthetist: 'Dr. Mensah', theatre: 'Theatre 2', date: '2026-08-25', startTime: '09:30', endTime: '10:15', anaesthesiaType: 'Spinal', complications: 'None', bloodLoss: 350, specimenSent: false, status: 'Completed' },
  { id: 'TL-003', patientName: 'Yaw Asare', mrn: 'MRN-2026-042', age: 45, sex: 'M', procedure: 'Total Knee Replacement', surgeon: 'Dr. Agyemang', anaesthetist: 'Dr. Osei', theatre: 'Theatre 3', date: '2026-08-25', startTime: '10:00', endTime: '', anaesthesiaType: 'Spinal', complications: '', bloodLoss: 0, specimenSent: false, status: 'In Progress' },
];

export default function OperatingTheatreLog() {
  const [entries] = useState<TheatreEntry[]>(INITIAL);
  const [showForm, setShowForm] = useState(false);
  const toast = useToast();
  const completed = entries.filter((e) => e.status === 'Completed').length;
  const totalTime = entries.filter((e) => e.status === 'Completed').reduce((s, e) => {
    const parts = e.startTime.split(':').map(Number);
    const sh = parts[0] ?? 0, sm = parts[1] ?? 0;
    const eParts = e.endTime.split(':').map(Number);
    const eh = eParts[0] ?? 0, em = eParts[1] ?? 0;
    return s + ((eh * 60 + em) - (sh * 60 + sm));
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Operating Theatre Log</h1><p className="text-gray-500">Daily surgical log — procedures, complications, outcomes, and time tracking</p></div>
        <Button onClick={() => setShowForm(true)}>+ Log Surgery</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 text-center"><div className="text-xl font-bold text-blue-600">{entries.length}</div><div className="text-xs text-gray-500">Total Cases</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-green-600">{completed}</div><div className="text-xs text-gray-500">Completed</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-orange-600">{entries.filter((e) => e.status === 'In Progress').length}</div><div className="text-xs text-gray-500">In Progress</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-purple-600">{Math.round(totalTime / 60 * 10) / 10}h</div><div className="text-xs text-gray-500">Total Theatre Time</div></Card>
      </div>
      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-gray-500"><th className="p-2">Time</th><th className="p-2">Patient</th><th className="p-2">Procedure</th><th className="p-2">Surgeon</th><th className="p-2">Anaesthesia</th><th className="p-2">Theatre</th><th className="p-2">Blood Loss</th><th className="p-2">Status</th></tr></thead>
            <tbody>{entries.map((e) => (
              <tr key={e.id} className="border-b hover:bg-gray-50">
                <td className="p-2 text-xs">{e.startTime}{e.endTime ? ` - ${e.endTime}` : ''}</td>
                <td className="p-2 font-medium">{e.patientName}<br /><span className="text-xs text-gray-400">{e.mrn} · {e.age}{e.sex}</span></td>
                <td className="p-2">{e.procedure}</td><td className="p-2">{e.surgeon}</td>
                <td className="p-2">{e.anaesthesiaType}</td><td className="p-2">{e.theatre}</td>
                <td className="p-2"><span className={e.bloodLoss > 500 ? 'text-red-600 font-bold' : ''}>{e.bloodLoss}ml</span></td>
                <td className="p-2"><Badge tone={e.status === 'Completed' ? 'green' : e.status === 'In Progress' ? 'gold' : 'gray'}>{e.status}</Badge></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowForm(false)} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-bold">✕</button>
            <h2 className="text-lg font-bold mb-4">Log Surgery</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm mb-1">Patient Name *</label><Input placeholder="Full name" /></div>
                <div><label className="block text-sm mb-1">MRN *</label><Input placeholder="MRN" /></div>
                <div><label className="block text-sm mb-1">Procedure *</label><Input placeholder="Surgical procedure" /></div>
                <div><label className="block text-sm mb-1">Surgeon *</label><Input placeholder="Dr. name" /></div>
                <div><label className="block text-sm mb-1">Anaesthetist *</label><Input placeholder="Dr. name" /></div>
                <div><label className="block text-sm mb-1">Theatre *</label><Select>{['Theatre 1', 'Theatre 2', 'Theatre 3', 'Theatre 4', 'Labour Theatre', 'Emergency Theatre'].map((t) => <option key={t}>{t}</option>)}</Select></div>
                <div><label className="block text-sm mb-1">Start Time *</label><Input type="time" /></div>
                <div><label className="block text-sm mb-1">Anaesthesia Type *</label><Select>{['General', 'Regional', 'Spinal', 'Epidural', 'Local'].map((a) => <option key={a}>{a}</option>)}</Select></div>
              </div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={() => { setShowForm(false); toast('Surgery logged'); }}>Log Surgery</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
