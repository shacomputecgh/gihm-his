import { useState } from 'react';
import { Badge, Card } from '../../components/ui';

interface Surgery { id: string; patientName: string; mrn: string; procedure: string; surgeon: string; anaesthetist: string; theatre: string; date: string; scheduledTime: string; actualStart?: string; actualEnd?: string; status: 'Scheduled' | 'In Prep' | 'In Surgery' | 'Recovery' | 'Completed' | 'Cancelled'; anaesthesiaType: 'General' | 'Spinal' | 'Regional' | 'Local'; riskLevel: 'Low' | 'Medium' | 'High' | 'Emergency'; }

const SURGERIES: Surgery[] = [
  { id: 'TH-001', patientName: 'Kwame Asante', mrn: 'MRN-2024-0891', procedure: 'Appendectomy (Laparoscopic)', surgeon: 'Dr. Yaw Boateng', anaesthetist: 'Dr. James Mensah', theatre: 'Theatre 1', date: '2026-08-26', scheduledTime: '08:00', actualStart: '08:15', actualEnd: '09:45', status: 'Recovery', anaesthesiaType: 'General', riskLevel: 'Medium' },
  { id: 'TH-002', patientName: 'Akua Mensah', mrn: 'MRN-2024-1234', procedure: 'Caesarean Section', surgeon: 'Dr. Ama Darko', anaesthetist: 'Dr. James Mensah', theatre: 'Theatre 2', date: '2026-08-26', scheduledTime: '09:00', actualStart: '09:12', status: 'In Surgery', anaesthesiaType: 'Spinal', riskLevel: 'Medium' },
  { id: 'TH-003', patientName: 'Nana Osei', mrn: 'MRN-2024-0567', procedure: 'Emergency Laparotomy', surgeon: 'Dr. Yaw Boateng', anaesthetist: 'Dr. Ama Darko', theatre: 'Theatre 1', date: '2026-08-26', scheduledTime: '10:30', status: 'Scheduled', anaesthesiaType: 'General', riskLevel: 'Emergency' },
  { id: 'TH-004', patientName: 'Efua Nyarko', mrn: 'MRN-2024-0998', procedure: 'Hernia Repair (Open)', surgeon: 'Dr. Kofi Asante', anaesthetist: 'Dr. James Mensah', theatre: 'Theatre 3', date: '2026-08-26', scheduledTime: '11:00', status: 'Scheduled', anaesthesiaType: 'Regional', riskLevel: 'Low' },
  { id: 'TH-005', patientName: 'Kofi Amoako', mrn: 'MRN-2024-0776', procedure: 'Cataract Surgery (Phaco)', surgeon: 'Dr. Nana Agyeman', anaesthetist: '—', theatre: 'Theatre 4', date: '2026-08-26', scheduledTime: '13:00', status: 'Scheduled', anaesthesiaType: 'Local', riskLevel: 'Low' },
  { id: 'TH-006', patientName: 'Ama Boateng', mrn: 'MRN-2024-0112', procedure: 'Incision & Drainage', surgeon: 'Dr. Yaw Boateng', anaesthetist: '—', theatre: 'Theatre 3', date: '2026-08-26', scheduledTime: '07:30', actualStart: '07:35', actualEnd: '08:00', status: 'Completed', anaesthesiaType: 'Local', riskLevel: 'Low' },
];

const RISK_COLORS: Record<string, string> = { Low: 'bg-green-100 text-green-800', Medium: 'bg-yellow-100 text-yellow-800', High: 'bg-orange-100 text-orange-800', Emergency: 'bg-red-100 text-red-800' };
const STATUS_COLORS: Record<string, string> = { Scheduled: 'bg-blue-100 text-blue-800', 'In Prep': 'bg-yellow-100 text-yellow-800', 'In Surgery': 'bg-orange-100 text-orange-800', Recovery: 'bg-purple-100 text-purple-800', Completed: 'bg-green-100 text-green-800', Cancelled: 'bg-red-100 text-red-800' };

export default function TheatreManagementEnhanced() {
  const [selected, setSelected] = useState<Surgery | null>(null);
  const active = SURGERIES.filter(s => s.status === 'In Surgery' || s.status === 'In Prep' || s.status === 'Recovery');
  const completed = SURGERIES.filter(s => s.status === 'Completed').length;
  const scheduled = SURGERIES.filter(s => s.status === 'Scheduled').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Theatre Management</h1>
          <p className="text-slate-500 text-sm">Surgery scheduling, list, and post-op tracking</p>
        </div>
        <button onClick={() => {}} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ Book Surgery</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4"><p className="text-xs text-slate-500">Scheduled</p><p className="text-2xl font-bold text-blue-600">{scheduled}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">In Progress</p><p className="text-2xl font-bold text-orange-600">{active.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Completed</p><p className="text-2xl font-bold text-green-600">{completed}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Emergency</p><p className="text-2xl font-bold text-red-600">{SURGERIES.filter(s => s.riskLevel === 'Emergency').length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Theatres Active</p><p className="text-2xl font-bold">{new Set(active.map(s => s.theatre)).size}/4</p></Card>
      </div>

      {/* Theatre Status */}
      <Card className="p-4">
        <h2 className="font-semibold mb-3">Theatre Status</h2>
        <div className="grid grid-cols-4 gap-3">
          {['Theatre 1', 'Theatre 2', 'Theatre 3', 'Theatre 4'].map(t => {
            const active = SURGERIES.find(s => s.theatre === t && (s.status === 'In Surgery' || s.status === 'In Prep' || s.status === 'Recovery'));
            return (
              <div key={t} className={`p-3 rounded-lg text-center ${active ? 'bg-orange-100 border border-orange-300' : 'bg-green-50 border border-green-200'}`}>
                <p className="font-medium">{t}</p>
                {active ? (
                  <>
                    <p className="text-xs text-slate-600 mt-1">{active.patientName}</p>
                    <p className="text-xs text-slate-500">{active.procedure}</p>
                    <Badge tone="gold">{active.status}</Badge>
                  </>
                ) : <p className="text-xs text-green-600 mt-1">✅ Available</p>}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Surgery List */}
      <div className="space-y-2">
        {SURGERIES.sort((a, b) => { const o: Record<string, number> = { 'In Surgery': 0, 'In Prep': 1, Recovery: 2, Scheduled: 3, Completed: 4, Cancelled: 5 }; return (o[a.status] ?? 6) - (o[b.status] ?? 6); }).map(s => (
          <Card key={s.id} className={`p-4 cursor-pointer hover:shadow transition ${selected?.id === s.id ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setSelected(selected?.id === s.id ? null : s)}>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-sm font-bold">{s.scheduledTime}</p>
                <p className="text-xs text-slate-400">{s.theatre}</p>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{s.patientName}</span>
                  <Badge tone={STATUS_COLORS[s.status]?.includes('green') ? 'green' : STATUS_COLORS[s.status]?.includes('red') ? 'red' : 'blue'}>{s.status}</Badge>
                  <Badge tone={RISK_COLORS[s.riskLevel]?.includes('red') ? 'red' : RISK_COLORS[s.riskLevel]?.includes('orange') ? 'gold' : 'green'}>{s.riskLevel}</Badge>
                  <Badge tone="blue">{s.anaesthesiaType}</Badge>
                </div>
                <p className="text-sm text-slate-500">{s.procedure}</p>
                <p className="text-xs text-slate-400">Surgeon: {s.surgeon} · Anaesthetist: {s.anaesthetist}</p>
                {s.actualStart && <p className="text-xs text-slate-500">Started: {s.actualStart} {s.actualEnd ? `· Ended: ${s.actualEnd}` : '· In progress'}</p>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
