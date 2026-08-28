import { useState } from 'react';
import { Badge } from '../../components/ui';

interface Teleconsult { id: string; patientName: string; doctor: string; specialty: string; date: string; time: string; duration: string; status: 'Scheduled' | 'Waiting' | 'In Progress' | 'Completed' | 'Cancelled'; reason: string; type: 'Follow-up' | 'Consultation' | 'Urgent' | 'Mental Health'; prescription?: string; followUp?: string; }

const CONSULTS: Teleconsult[] = [
  { id: 'TC-001', patientName: 'Kwame Asante', doctor: 'Dr. Sarah Johnson', specialty: 'Cardiology', date: '2026-08-23', time: '09:00', duration: '30 min', status: 'In Progress', reason: 'Post-MI follow-up — medication review', type: 'Follow-up', prescription: 'Aspirin 75mg OD, Atorvastatin 40mg ON, Bisoprolol 5mg OD', followUp: 'Review in 2 weeks' },
  { id: 'TC-002', patientName: 'Akua Mensah', doctor: 'Dr. Kofi Appiah', specialty: 'Dermatology', date: '2026-08-23', time: '09:30', duration: '15 min', status: 'Waiting', reason: 'Psoriasis treatment response assessment', type: 'Follow-up' },
  { id: 'TC-003', patientName: 'Nana Osei', doctor: 'Dr. Sarah Johnson', specialty: 'Endocrinology', date: '2026-08-23', time: '10:00', duration: '20 min', status: 'Scheduled', reason: 'Diabetes management — HbA1c review', type: 'Consultation' },
  { id: 'TC-004', patientName: 'Efua Nyarko', doctor: 'Dr. Ama Darko', specialty: 'Psychiatry', date: '2026-08-23', time: '10:30', duration: '45 min', status: 'Completed', reason: 'Depression — medication adjustment', type: 'Mental Health', prescription: 'Sertraline 100mg OD, continue therapy', followUp: 'Review in 4 weeks' },
  { id: 'TC-005', patientName: 'Yaw Boateng', doctor: 'Dr. Kofi Appiah', specialty: 'General Practice', date: '2026-08-23', time: '11:00', duration: '15 min', status: 'Completed', reason: 'Hypertension review', type: 'Follow-up', prescription: 'Amlodipine 5mg OD, lifestyle advice', followUp: 'BP check in 1 month' },
];

const STATUS_COLORS: Record<string, string> = { Scheduled: 'bg-blue-100 text-blue-800', Waiting: 'bg-yellow-100 text-yellow-800', 'In Progress': 'bg-green-100 text-green-800', Completed: 'bg-gray-100 text-gray-800', Cancelled: 'bg-red-100 text-red-800' };
const TYPE_COLORS: Record<string, string> = { 'Follow-up': 'bg-blue-100 text-blue-800', Consultation: 'bg-purple-100 text-purple-800', Urgent: 'bg-red-100 text-red-800', 'Mental Health': 'bg-teal-100 text-teal-800' };

export default function TelemedicineEnhanced() {
  const [consults] = useState<Teleconsult[]>(CONSULTS);
  const [selected, setSelected] = useState<Teleconsult | null>(CONSULTS[0] ?? null);
  const [filter, setFilter] = useState('');

  const filtered = consults.filter((c) => !filter || c.status === filter);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Telemedicine Consultations</h1><p className="text-gray-500">Virtual consultations, e-prescriptions, video calls, and remote patient monitoring</p></div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {['Scheduled', 'Waiting', 'In Progress', 'Completed', 'Cancelled'].map((s) => <div key={s} className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold">{consults.filter((c) => c.status === s).length}</div><div className="text-xs text-slate-500">{s}</div></div>)}
      </div>
      <div className="flex gap-2">
        {['', 'Scheduled', 'Waiting', 'In Progress', 'Completed'].map((f) => <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full text-xs font-medium transition ${filter === f ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{f || 'All'}</button>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {filtered.map((c) => (
            <div key={c.id} onClick={() => setSelected(c)} className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${selected?.id === c.id ? 'ring-2 ring-green-500' : ''}`}>
              <div className="flex items-center justify-between mb-1"><span className="font-semibold text-sm">{c.patientName}</span><Badge className={STATUS_COLORS[c.status]}>{c.status}</Badge></div>
              <div className="text-xs text-slate-500"><div>{c.specialty} — {c.doctor}</div><div>{c.date} · {c.time} · {c.duration}</div></div>
              <div className="mt-1"><Badge className={TYPE_COLORS[c.type]}>{c.type}</Badge></div>
            </div>
          ))}
        </div>
        {selected && (
          <div className="lg:col-span-2 bg-white rounded-lg border p-5 space-y-4 h-fit sticky top-4">
            <div className="flex items-center justify-between"><div><h3 className="text-lg font-bold">{selected.patientName}</h3><p className="text-sm text-gray-500">{selected.specialty} — {selected.doctor}</p></div><Badge className={STATUS_COLORS[selected.status]}>{selected.status}</Badge></div>
            <div className="bg-blue-50 border border-blue-200 rounded p-3"><div className="text-xs text-blue-600 font-semibold mb-1">Reason for Consultation</div><div className="text-sm">{selected.reason}</div></div>
            {selected.prescription && <div className="bg-green-50 border border-green-200 rounded p-3"><div className="text-xs text-green-600 font-semibold mb-1">💊 E-Prescription</div><div className="text-sm">{selected.prescription}</div></div>}
            {selected.followUp && <div className="bg-yellow-50 border border-yellow-200 rounded p-3"><div className="text-xs text-yellow-600 font-semibold mb-1">📅 Follow-up</div><div className="text-sm">{selected.followUp}</div></div>}
            <div className="flex gap-2">
              {selected.status === 'In Progress' && <button onClick={() => {}} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium">End Call</button>}
              {selected.status === 'Scheduled' && <button onClick={() => {}} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Start Video Call</button>}
              {selected.status === 'Waiting' && <button onClick={() => {}} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Join Call</button>}
              <button onClick={() => {}} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Send E-Prescription</button>
              <button onClick={() => {}} className="border px-4 py-2 rounded-lg text-sm font-medium">Schedule Follow-up</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
