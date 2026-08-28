import { useState } from 'react';
import { Badge } from '../../components/ui';

interface Survey { id: string; patientName: string; department: string; date: string; overall: number; communication: number; waitTime: number; cleanliness: number; painManagement: number; comments: string; status: 'Submitted' | 'Reviewed' | 'Actioned'; }

const SURVEYS: Survey[] = [
  { id: 'PS-001', patientName: 'Kwame Asante', department: 'Surgery', date: '2026-08-22', overall: 5, communication: 4, waitTime: 3, cleanliness: 5, painManagement: 4, comments: 'Excellent care from surgical team. Wait time could be better.', status: 'Reviewed' },
  { id: 'PS-002', patientName: 'Akua Mensah', department: 'Maternity', date: '2026-08-22', overall: 5, communication: 5, waitTime: 4, cleanliness: 4, painManagement: 5, comments: 'Midwives were amazing. Very supportive during delivery.', status: 'Submitted' },
  { id: 'PS-003', patientName: 'Nana Osei', department: 'Emergency', date: '2026-08-21', overall: 2, communication: 3, waitTime: 1, cleanliness: 2, painManagement: 3, comments: 'Waited 6 hours. Very crowded and noisy. Pain medication was delayed.', status: 'Actioned' },
  { id: 'PS-004', patientName: 'Efua Nyarko', department: 'ICU', date: '2026-08-20', overall: 4, communication: 4, waitTime: 4, cleanliness: 5, painManagement: 4, comments: 'Family visits could be more flexible. Otherwise excellent care.', status: 'Reviewed' },
];

const StarRating = ({ value, max = 5 }: { value: number; max?: number }) => (
  <div className="flex gap-0.5">{Array.from({ length: max }, (_, i) => <span key={i} className={i < value ? 'text-yellow-500' : 'text-slate-200'}>★</span>)}</div>
);

export default function PatientSatisfactionSurvey() {
  const [surveys] = useState<Survey[]>(SURVEYS);
  const avgOverall = surveys.length ? (surveys.reduce((s, v) => s + v.overall, 0) / surveys.length).toFixed(1) : '0';
  const avgWait = surveys.length ? (surveys.reduce((s, v) => s + v.waitTime, 0) / surveys.length).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Patient Satisfaction Survey</h1><p className="text-gray-500">Collect, analyse, and act on patient feedback</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-yellow-600">⭐ {avgOverall}</div><div className="text-xs text-slate-500">Overall Rating</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-slate-700">{surveys.length}</div><div className="text-xs text-slate-500">Total Surveys</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className={`text-xl font-bold ${parseFloat(avgWait) < 3 ? 'text-green-600' : 'text-red-600'}`}>⭐ {avgWait}</div><div className="text-xs text-slate-500">Wait Time Rating</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-blue-600">{surveys.filter((s) => s.status === 'Actioned').length}</div><div className="text-xs text-slate-500">Issues Actioned</div></div>
      </div>
      <div className="space-y-3">
        {surveys.map((s) => (
          <div key={s.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-2">
              <div><div className="flex items-center gap-2"><span className="font-mono text-xs text-slate-400">{s.id}</span><span className="font-semibold">{s.patientName}</span><Badge className="bg-slate-100 text-slate-600">{s.department}</Badge></div><div className="text-xs text-slate-400 mt-1">{s.date}</div></div>
              <Badge className={s.status === 'Actioned' ? 'bg-green-100 text-green-800' : s.status === 'Reviewed' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}>{s.status}</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs mt-2">
              <div><span className="text-slate-400">Overall</span><StarRating value={s.overall} /></div>
              <div><span className="text-slate-400">Communication</span><StarRating value={s.communication} /></div>
              <div><span className="text-slate-400">Wait Time</span><StarRating value={s.waitTime} /></div>
              <div><span className="text-slate-400">Cleanliness</span><StarRating value={s.cleanliness} /></div>
              <div><span className="text-slate-400">Pain Mgmt</span><StarRating value={s.painManagement} /></div>
            </div>
            <p className="text-sm text-slate-600 mt-2 italic">"{s.comments}"</p>
          </div>
        ))}
      </div>
    </div>
  );
}
