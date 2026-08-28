import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface TheatreCase {
  id: string; patientName: string; procedure: string; surgeon: string;
  theatre: string; date: string; time: string; duration: string;
  anaesthesiaType: string; status: 'Scheduled' | 'In Theatre' | 'Completed' | 'Cancelled';
  priority: 'Elective' | 'Urgent' | 'Emergency';
}

const CASES: TheatreCase[] = [
  { id: 'OR-001', patientName: 'Kwame Asante', procedure: 'Coronary Angioplasty + Stent', surgeon: 'Dr. Sarah Johnson', theatre: 'Cath Lab 1', date: '2026-08-25', time: '08:00', duration: '2 hours', anaesthesiaType: 'Local + Sedation', status: 'In Theatre', priority: 'Urgent' },
  { id: 'OR-002', patientName: 'Akua Mensah', procedure: 'Caesarean Section', surgeon: 'Dr. Kofi Appiah', theatre: 'Theatre 2', date: '2026-08-25', time: '09:00', duration: '1.5 hours', anaesthesiaType: 'Spinal', status: 'Scheduled', priority: 'Urgent' },
  { id: 'OR-003', patientName: 'Nana Osei', procedure: 'Laparoscopic Cholecystectomy', surgeon: 'Dr. Emmanuel Darko', theatre: 'Theatre 1', date: '2026-08-25', time: '10:00', duration: '2 hours', anaesthesiaType: 'General', status: 'Scheduled', priority: 'Elective' },
  { id: 'OR-004', patientName: 'Efua Nyarko', procedure: 'Right Hip Replacement', surgeon: 'Dr. Nana Osei', theatre: 'Theatre 3', date: '2026-08-25', time: '08:00', duration: '3 hours', anaesthesiaType: 'General', status: 'Completed', priority: 'Elective' },
  { id: 'OR-005', patientName: 'Yaw Boateng', procedure: 'Emergency Laparotomy', surgeon: 'Dr. Emmanuel Darko', theatre: 'Theatre 1', date: '2026-08-25', time: '14:00', duration: '4 hours', anaesthesiaType: 'General', status: 'Scheduled', priority: 'Emergency' },
];

const STATUS_COLORS: Record<string, string> = { Scheduled: 'bg-blue-100 text-blue-800', 'In Theatre': 'bg-green-100 text-green-800', Completed: 'bg-gray-100 text-gray-800', Cancelled: 'bg-red-100 text-red-800' };
const PRIORITY_COLORS: Record<string, string> = { Elective: 'bg-blue-100 text-blue-800', Urgent: 'bg-yellow-100 text-yellow-800', Emergency: 'bg-red-100 text-red-800' };

const UTILISATION = [
  { theatre: 'Theatre 1', totalHours: 8, usedHours: 6, utilisation: 75 },
  { theatre: 'Theatre 2', totalHours: 8, usedHours: 5, utilisation: 63 },
  { theatre: 'Theatre 3', totalHours: 8, usedHours: 7, utilisation: 88 },
  { theatre: 'Cath Lab 1', totalHours: 8, usedHours: 4, utilisation: 50 },
];

export default function TheatreSchedulingOptimisation() {
  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);
  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">
          {showAdd ? "\u2715 Cancel" : "+ Add New"}
        </button>
      </div>
      {showAdd && (
        <AddNewForm
          title="Add New Schedule Entry"
          fields={[{"name":"procedure","label":"Procedure","type":"text","required":true},{"name":"surgeon","label":"Surgeon","type":"text","required":true},{"name":"date","label":"Date","type":"date","required":true},{"name":"time","label":"Time","type":"text","placeholder":"09:00"},{"name":"theatre","label":"Theatre","type":"select","options":["Theatre 1","Theatre 2","Theatre 3"]},{"name":"duration","label":"Duration (mins)","type":"number"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Theatre Scheduling Optimisation</h1><p className="text-gray-500">Operating theatre scheduling, surgeon allocation, utilisation tracking, and case prioritisation</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Today\'s Cases', value: CASES.length, color: 'text-blue-600' }, { label: 'In Theatre', value: CASES.filter(c => c.status === 'In Theatre').length, color: 'text-green-600' }, { label: 'Emergency', value: CASES.filter(c => c.priority === 'Emergency').length, color: 'text-red-600' }, { label: 'Avg Utilisation', value: `${Math.round(UTILISATION.reduce((s, u) => s + u.utilisation, 0) / UTILISATION.length)}%`, color: 'text-purple-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="space-y-3">
        {CASES.map(c => (
          <div key={c.id} className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span className="font-mono text-xs text-gray-500">{c.id}</span><span className="font-bold">{c.patientName}</span><span className="text-sm text-gray-500">{c.procedure}</span></div><div className="flex items-center gap-2"><Badge className={PRIORITY_COLORS[c.priority]}>{c.priority}</Badge><Badge className={STATUS_COLORS[c.status]}>{c.status}</Badge></div></div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm"><div><span className="text-gray-500">Surgeon:</span> {c.surgeon}</div><div><span className="text-gray-500">Theatre:</span> {c.theatre}</div><div><span className="text-gray-500">Time:</span> {c.time}</div><div><span className="text-gray-500">Duration:</span> {c.duration}</div><div><span className="text-gray-500">Anaesthesia:</span> {c.anaesthesiaType}</div></div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border p-5">
        <h3 className="font-semibold mb-4">Theatre Utilisation Today</h3>
        <div className="space-y-3">
          {UTILISATION.map(u => (
            <div key={u.theatre}>
              <div className="flex justify-between text-sm mb-1"><span className="font-medium">{u.theatre}</span><span className={u.utilisation >= 75 ? 'text-green-600 font-bold' : 'text-yellow-600 font-bold'}>{u.utilisation}% ({u.usedHours}/{u.totalHours}h)</span></div>
              <div className="w-full bg-gray-200 rounded-full h-3"><div className={`h-3 rounded-full ${u.utilisation >= 75 ? 'bg-green-500' : u.utilisation >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${u.utilisation}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
