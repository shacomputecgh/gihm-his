import { useState } from 'react';
import { Badge } from '../../components/ui';

interface SurgerySlot { id: string; theatre: string; date: string; time: string; patient: string; procedure: string; surgeon: string; anaesthetist: string; duration: number; status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled' | 'Emergency'; equipment: string[]; }

const SLOTS: SurgerySlot[] = [
  { id: 'TH-001', theatre: 'Theatre 1', date: '2026-08-23', time: '08:00', patient: 'Kwame Asante', procedure: 'Appendectomy', surgeon: 'Dr. James Mensah', anaesthetist: 'Dr. Sarah Johnson', duration: 90, status: 'Completed', equipment: ['Laparoscope', 'Diathermy'] },
  { id: 'TH-002', theatre: 'Theatre 2', date: '2026-08-23', time: '09:00', patient: 'Akua Mensah', procedure: 'Caesarean Section', surgeon: 'Dr. Ama Darko', anaesthetist: 'Dr. Kofi Appiah', duration: 60, status: 'In Progress', equipment: ['Caesarean kit', 'Suction'] },
  { id: 'TH-003', theatre: 'Theatre 3', date: '2026-08-23', time: '10:00', patient: 'Nana Osei', procedure: 'Hernia Repair', surgeon: 'Dr. James Mensah', anaesthetist: 'Dr. Sarah Johnson', duration: 75, status: 'Scheduled', equipment: ['Mesh', 'Laparoscope'] },
  { id: 'TH-004', theatre: 'Theatre 1', date: '2026-08-23', time: '13:00', patient: 'Efua Nyarko', procedure: 'Cholecystectomy', surgeon: 'Dr. James Mensah', anaesthetist: 'Dr. Kofi Appiah', duration: 120, status: 'Scheduled', equipment: ['Laparoscope', 'Cholangiogram'] },
  { id: 'TH-005', theatre: 'Theatre 2', date: '2026-08-23', time: '14:00', patient: 'Yaw Boateng', procedure: 'Knee Arthroscopy', surgeon: 'Dr. Sarah Johnson', anaesthetist: 'Dr. Ama Darko', duration: 90, status: 'Scheduled', equipment: ['Arthroscope', 'Shaver'] },
];

const STATUS_COLORS: Record<string, string> = { Scheduled: 'bg-blue-100 text-blue-800', 'In Progress': 'bg-green-100 text-green-800', Completed: 'bg-gray-100 text-gray-800', Cancelled: 'bg-red-100 text-red-800', Emergency: 'bg-red-600 text-white' };

export default function TheatreSchedulingEnhanced() {
  const [slots] = useState<SurgerySlot[]>(SLOTS);
  const [showForm, setShowForm] = useState(false);
  const [dateFilter, setDateFilter] = useState('2026-08-23');

  const daySlots = slots.filter((s) => s.date === dateFilter);
  const theatres = ['Theatre 1', 'Theatre 2', 'Theatre 3', 'Emergency Theatre'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Theatre Scheduling</h1><p className="text-gray-500">Surgery scheduling, resource allocation, and theatre utilisation tracking</p></div>
        <div className="flex gap-2">
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">{showForm ? '✕ Cancel' : '+ Schedule Surgery'}</button>
        </div>
      </div>
      {showForm && (
        <div className="bg-white rounded-lg border-2 border-green-200 p-5 space-y-3 shadow-lg">
          <h3 className="font-bold text-green-800 text-lg">Schedule New Surgery</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Patient Name *</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Procedure *</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Surgeon *</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Anaesthetist</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Theatre *</label><select className="w-full border rounded-lg px-3 py-2 text-sm">{theatres.map((t) => <option key={t}>{t}</option>)}</select></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Date *</label><input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Time *</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="09:00" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Duration (mins) *</label><input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="90" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Priority</label><select className="w-full border rounded-lg px-3 py-2 text-sm"><option>Elective</option><option>Urgent</option><option>Emergency</option></select></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Required Equipment</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Laparoscope, Diathermy (comma separated)" /></div>
          <div className="flex gap-2"><button className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 shadow">Schedule Surgery</button><button onClick={() => setShowForm(false)} className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">Cancel</button></div>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {['Scheduled', 'In Progress', 'Completed', 'Emergency'].map((s) => <div key={s} className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold">{daySlots.filter((sl) => sl.status === s).length}</div><div className="text-xs text-slate-500">{s}</div></div>)}
      </div>
      {theatres.map((th) => {
        const thSlots = daySlots.filter((s) => s.theatre === th);
        return (
          <div key={th} className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-sm">{th}</h3><span className="text-xs text-slate-400">{thSlots.length} cases</span></div>
            {thSlots.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">No cases scheduled</p> : (
              <div className="space-y-2">
                {thSlots.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-center min-w-[60px]"><div className="text-sm font-bold text-slate-700">{s.time}</div><div className="text-[10px] text-slate-400">{s.duration}min</div></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2"><span className="font-semibold text-sm">{s.procedure}</span><Badge className={STATUS_COLORS[s.status]}>{s.status}</Badge></div>
                      <div className="text-xs text-slate-500">{s.patient} · {s.surgeon} · Anaesthesia: {s.anaesthetist}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Equipment: {s.equipment.join(', ')}</div>
                    </div>
                    {s.status === 'In Progress' && <button onClick={() => {}} className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded font-medium">Complete</button>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
