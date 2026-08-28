import { useState } from 'react';
import { Badge } from '../../components/ui';

interface TheatreRecord {
  id: string; theatre: string; procedure: string; surgeon: string;
  patient: string; date: string; startTime: string; endTime?: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled' | 'Emergency';
  anaesthesia: string; asa: string;
}

const THEATRES: TheatreRecord[] = [
  { id: 'TH-001', theatre: 'Theatre 1', procedure: 'Appendectomy', surgeon: 'Dr. James Mensah', patient: 'Kwame Asante', date: '2026-08-23', startTime: '08:00', endTime: '09:45', status: 'Completed', anaesthesia: 'General', asa: 'II' },
  { id: 'TH-002', theatre: 'Theatre 2', procedure: 'Caesarean Section', surgeon: 'Dr. Ama Darko', patient: 'Akua Mensah', date: '2026-08-23', startTime: '09:30', status: 'In Progress', anaesthesia: 'Spinal', asa: 'II' },
  { id: 'TH-003', theatre: 'Theatre 3', procedure: 'Hernia Repair', surgeon: 'Dr. James Mensah', patient: 'Yaw Boateng', date: '2026-08-23', startTime: '11:00', status: 'Scheduled', anaesthesia: 'General', asa: 'I' },
  { id: 'TH-004', theatre: 'Emergency Theatre', procedure: 'Emergency Laparotomy', surgeon: 'Dr. Sarah Johnson', patient: 'Nana Osei', date: '2026-08-23', startTime: '10:30', status: 'Emergency', anaesthesia: 'General', asa: 'III' },
  { id: 'TH-005', theatre: 'Theatre 1', procedure: 'Cholecystectomy', surgeon: 'Dr. James Mensah', patient: 'Efua Nyarko', date: '2026-08-23', startTime: '13:00', status: 'Scheduled', anaesthesia: 'General', asa: 'I' },
  { id: 'TH-006', theatre: 'Theatre 2', procedure: 'Total Knee Replacement', surgeon: 'Dr. Kofi Appiah', patient: 'Ama Serwaa', date: '2026-08-22', startTime: '08:00', endTime: '12:30', status: 'Completed', anaesthesia: 'Spinal', asa: 'II' },
];

const STATUS_COLORS: Record<string, string> = {
  Scheduled: 'bg-blue-100 text-blue-800', 'In Progress': 'bg-green-100 text-green-800',
  Completed: 'bg-gray-100 text-gray-800', Cancelled: 'bg-red-100 text-red-800',
  Emergency: 'bg-red-600 text-white',
};

export default function TheatreUtilization() {
  const [records] = useState<TheatreRecord[]>(THEATRES);
  const [dateFilter, setDateFilter] = useState('2026-08-23');

  const dayRecords = records.filter((r) => r.date === dateFilter);
  const theatres = ['Theatre 1', 'Theatre 2', 'Theatre 3', 'Emergency Theatre'];
  const completed = dayRecords.filter((r) => r.status === 'Completed').length;
  const utilisation = dayRecords.length > 0 ? Math.round((completed / dayRecords.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Theatre Utilisation</h1><p className="text-gray-500">Theatre scheduling, usage tracking, and utilisation analytics</p></div>
        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{dayRecords.length}</div><div className="text-xs text-gray-500">Total Cases</div>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{dayRecords.filter((r) => r.status === 'In Progress').length}</div><div className="text-xs text-gray-500">In Progress</div>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-gray-600">{completed}</div><div className="text-xs text-gray-500">Completed</div>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{utilisation}%</div><div className="text-xs text-gray-500">Utilisation Rate</div>
        </div>
      </div>

      {theatres.map((th) => {
        const thRecords = dayRecords.filter((r) => r.theatre === th);
        return (
          <div key={th} className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">{th}</h3>
              <span className="text-xs text-slate-400">{thRecords.length} cases</span>
            </div>
            {thRecords.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No cases scheduled</p>
            ) : (
              <div className="space-y-2">
                {thRecords.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-center min-w-[60px]">
                      <div className="text-sm font-bold text-slate-700">{r.startTime}</div>
                      {r.endTime && <div className="text-xs text-slate-400">→ {r.endTime}</div>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{r.procedure}</span>
                        <Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge>
                      </div>
                      <div className="text-xs text-slate-500">{r.patient} · {r.surgeon} · {r.anaesthesia} (ASA {r.asa})</div>
                    </div>
                    {r.status === 'In Progress' && (
                      <div className="flex gap-1">
                        <button onClick={() => {}} className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100">Complete</button>
                      </div>
                    )}
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
