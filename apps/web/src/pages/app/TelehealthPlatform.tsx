import { useState } from 'react';
import { Badge } from '../../components/ui';

interface TelehealthSession { id: string; patientName: string; doctor: string; type: 'Video Call' | 'Audio Call' | 'Chat' | 'Remote Monitoring'; date: string; time: string; duration: string; status: 'Scheduled' | 'Connecting' | 'Active' | 'Completed' | 'Cancelled'; vitals?: { bp: string; hr: number; temp: number; spo2: number }; }

const SESSIONS: TelehealthSession[] = [
  { id: 'TH-001', patientName: 'Kwame Asante', doctor: 'Dr. Sarah Johnson', type: 'Video Call', date: '2026-08-23', time: '09:00', duration: '30 min', status: 'Active', vitals: { bp: '130/85', hr: 78, temp: 36.8, spo2: 97 } },
  { id: 'TH-002', patientName: 'Akua Mensah', doctor: 'Dr. Kofi Appiah', type: 'Remote Monitoring', date: '2026-08-23', time: '10:00', duration: '15 min', status: 'Scheduled', vitals: { bp: '120/80', hr: 72, temp: 36.6, spo2: 98 } },
  { id: 'TH-003', patientName: 'Nana Osei', doctor: 'Dr. Ama Darko', type: 'Audio Call', date: '2026-08-23', time: '11:00', duration: '20 min', status: 'Completed' },
  { id: 'TH-004', patientName: 'Efua Nyarko', doctor: 'Dr. Sarah Johnson', type: 'Video Call', date: '2026-08-23', time: '14:00', duration: '45 min', status: 'Scheduled' },
];

const STATUS_COLORS: Record<string, string> = { Scheduled: 'bg-blue-100 text-blue-800', Connecting: 'bg-yellow-100 text-yellow-800', Active: 'bg-green-100 text-green-800', Completed: 'bg-gray-100 text-gray-800', Cancelled: 'bg-red-100 text-red-800' };
const TYPE_ICONS: Record<string, string> = { 'Video Call': '📹', 'Audio Call': '📞', 'Chat': '💬', 'Remote Monitoring': '📡' };

export default function TelehealthPlatform() {
  const [sessions] = useState<TelehealthSession[]>(SESSIONS);
  const [selected, setSelected] = useState<TelehealthSession | null>(SESSIONS[0] ?? null);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Telehealth Platform</h1><p className="text-gray-500">Virtual consultations, remote patient monitoring, and digital health services</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {['Video Call', 'Audio Call', 'Chat', 'Remote Monitoring'].map((t) => <div key={t} className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold">{sessions.filter((s) => s.type === t).length}</div><div className="text-xs text-slate-500">{TYPE_ICONS[t]} {t}</div></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} onClick={() => setSelected(s)} className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${selected?.id === s.id ? 'ring-2 ring-green-500' : ''}`}>
              <div className="flex items-center justify-between mb-1"><span className="text-lg">{TYPE_ICONS[s.type]}</span><Badge className={STATUS_COLORS[s.status]}>{s.status}</Badge></div>
              <div className="font-semibold text-sm">{s.patientName}</div>
              <div className="text-xs text-slate-500">{s.doctor} · {s.date} {s.time}</div>
            </div>
          ))}
        </div>
        {selected && (
          <div className="lg:col-span-2 bg-white rounded-lg border p-5 space-y-4 h-fit sticky top-4">
            <div className="flex items-center justify-between"><div><h3 className="text-lg font-bold">{selected.patientName}</h3><p className="text-sm text-gray-500">{TYPE_ICONS[selected.type]} {selected.type} — {selected.doctor}</p></div><Badge className={STATUS_COLORS[selected.status]}>{selected.status}</Badge></div>
            <div className="bg-slate-50 rounded p-3 text-sm"><strong>Date:</strong> {selected.date} at {selected.time} · Duration: {selected.duration}</div>
            {selected.vitals && (
              <div><h4 className="text-sm font-semibold mb-2">Remote Vitals</h4>
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-slate-50 rounded p-2 text-center"><div className="text-sm font-bold">{selected.vitals.bp}</div><div className="text-[10px] text-slate-400">BP</div></div>
                  <div className="bg-slate-50 rounded p-2 text-center"><div className="text-sm font-bold">{selected.vitals.hr}</div><div className="text-[10px] text-slate-400">HR</div></div>
                  <div className="bg-slate-50 rounded p-2 text-center"><div className="text-sm font-bold">{selected.vitals.temp}°C</div><div className="text-[10px] text-slate-400">Temp</div></div>
                  <div className="bg-slate-50 rounded p-2 text-center"><div className="text-sm font-bold text-green-600">{selected.vitals.spo2}%</div><div className="text-[10px] text-slate-400">SpO2</div></div>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              {selected.status === 'Scheduled' && <button onClick={() => {}} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Start Session</button>}
              {selected.status === 'Active' && <button onClick={() => {}} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium">End Session</button>}
              <button onClick={() => {}} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Send Prescription</button>
              <button onClick={() => {}} className="border px-4 py-2 rounded-lg text-sm font-medium">Schedule Follow-up</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
