import { useState } from 'react';
import { Badge } from '../../components/ui';

interface StaffPerf { id: string; name: string; role: string; department: string; kpi: number; attendance: number; patientSatisfaction: number; incidents: number; trainingCompleted: number; reviewStatus: 'Pending' | 'Reviewed' | 'Exemplary'; }

const STAFF: StaffPerf[] = [
  { id: 'SP-001', name: 'Nurse Akua Mensah', role: 'Senior Nurse', department: 'ICU', kpi: 95, attendance: 98, patientSatisfaction: 4.8, incidents: 0, trainingCompleted: 12, reviewStatus: 'Exemplary' },
  { id: 'SP-002', name: 'Dr. Sarah Johnson', role: 'Cardiologist', department: 'Cardiology', kpi: 92, attendance: 96, patientSatisfaction: 4.7, incidents: 0, trainingCompleted: 8, reviewStatus: 'Reviewed' },
  { id: 'SP-003', name: 'Pharmacist Esi Darko', role: 'Chief Pharmacist', department: 'Pharmacy', kpi: 88, attendance: 95, patientSatisfaction: 4.5, incidents: 1, trainingCompleted: 10, reviewStatus: 'Pending' },
  { id: 'SP-004', name: 'Lab Tech Kofi Osei', role: 'Lab Scientist', department: 'Laboratory', kpi: 85, attendance: 92, patientSatisfaction: 4.3, incidents: 0, trainingCompleted: 6, reviewStatus: 'Pending' },
  { id: 'SP-005', name: 'Nurse Abena Nyarko', role: 'Midwife', department: 'Maternity', kpi: 90, attendance: 97, patientSatisfaction: 4.6, incidents: 0, trainingCompleted: 9, reviewStatus: 'Reviewed' },
];

const STATUS_COLORS: Record<string, string> = { Pending: 'bg-yellow-100 text-yellow-800', Reviewed: 'bg-blue-100 text-blue-800', Exemplary: 'bg-green-100 text-green-800' };

export default function StaffPerformanceTracker() {
  const [staff] = useState<StaffPerf[]>(STAFF);
  const [selected, setSelected] = useState<StaffPerf | null>(STAFF[0] ?? null);

  const avgKpi = staff.length ? Math.round(staff.reduce((s, r) => s + r.kpi, 0) / staff.length) : 0;
  const avgAttendance = staff.length ? Math.round(staff.reduce((s, r) => s + r.attendance, 0) / staff.length) : 0;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Staff Performance Tracker</h1><p className="text-gray-500">Employee KPI tracking, attendance monitoring, and performance reviews</p></div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-slate-700">{staff.length}</div><div className="text-xs text-slate-500">Total Staff</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-green-600">{avgKpi}%</div><div className="text-xs text-slate-500">Avg KPI</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-blue-600">{avgAttendance}%</div><div className="text-xs text-slate-500">Avg Attendance</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-yellow-600">{staff.filter((s) => s.reviewStatus === 'Pending').length}</div><div className="text-xs text-slate-500">Pending Reviews</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-green-600">{staff.filter((s) => s.reviewStatus === 'Exemplary').length}</div><div className="text-xs text-slate-500">Exemplary</div></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {staff.map((s) => (
            <div key={s.id} onClick={() => setSelected(s)} className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${selected?.id === s.id ? 'ring-2 ring-green-500' : ''}`}>
              <div className="flex items-center justify-between mb-1"><span className="font-semibold text-sm">{s.name}</span><Badge className={STATUS_COLORS[s.reviewStatus]}>{s.reviewStatus}</Badge></div>
              <div className="text-xs text-slate-500">{s.role} · {s.department}</div>
              <div className="flex gap-3 mt-2 text-xs">
                <span>KPI: <strong className={s.kpi >= 90 ? 'text-green-600' : 'text-yellow-600'}>{s.kpi}%</strong></span>
                <span>Att: <strong>{s.attendance}%</strong></span>
              </div>
            </div>
          ))}
        </div>
        {selected && (
          <div className="lg:col-span-2 bg-white rounded-lg border p-5 space-y-4 h-fit sticky top-4">
            <div className="flex items-center justify-between"><div><h3 className="text-lg font-bold">{selected.name}</h3><p className="text-sm text-gray-500">{selected.role} · {selected.department}</p></div><Badge className={STATUS_COLORS[selected.reviewStatus]}>{selected.reviewStatus}</Badge></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-50 rounded p-3 text-center"><div className={`text-lg font-bold ${selected.kpi >= 90 ? 'text-green-600' : 'text-yellow-600'}`}>{selected.kpi}%</div><div className="text-[10px] text-slate-400">KPI Score</div></div>
              <div className="bg-slate-50 rounded p-3 text-center"><div className="text-lg font-bold text-blue-600">{selected.attendance}%</div><div className="text-[10px] text-slate-400">Attendance</div></div>
              <div className="bg-slate-50 rounded p-3 text-center"><div className="text-lg font-bold text-yellow-600">⭐ {selected.patientSatisfaction}</div><div className="text-[10px] text-slate-400">Patient Rating</div></div>
              <div className="bg-slate-50 rounded p-3 text-center"><div className={`text-lg font-bold ${selected.incidents > 0 ? 'text-red-600' : 'text-green-600'}`}>{selected.incidents}</div><div className="text-[10px] text-slate-400">Incidents</div></div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm"><strong>Training:</strong> {selected.trainingCompleted} courses completed this year</div>
            <div className="flex gap-2"><button onClick={() => {}} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Complete Review</button><button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">View History</button><button className="border px-4 py-2 rounded-lg text-sm font-medium">Set Goals</button></div>
          </div>
        )}
      </div>
    </div>
  );
}
