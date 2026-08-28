import { useState } from 'react';
import { Badge } from '../../components/ui';

interface Shift { id: string; staffName: string; role: string; ward: string; shiftType: 'Morning' | 'Evening' | 'Night'; date: string; status: 'Scheduled' | 'On Duty' | 'Completed' | 'Absent'; }

const SHIFTS: Shift[] = [
  { id: 'SH-001', staffName: 'Nurse Akua Mensah', role: 'Senior Nurse', ward: 'ICU', shiftType: 'Morning', date: '2026-08-23', status: 'On Duty' },
  { id: 'SH-002', staffName: 'Nurse Kofi Osei', role: 'Staff Nurse', ward: 'Medical Ward A', shiftType: 'Morning', date: '2026-08-23', status: 'On Duty' },
  { id: 'SH-003', staffName: 'Nurse Esi Darko', role: 'Staff Nurse', ward: 'Surgical Ward', shiftType: 'Evening', date: '2026-08-23', status: 'Scheduled' },
  { id: 'SH-004', staffName: 'Dr. Yaw Boateng', role: 'Medical Officer', ward: 'Emergency', shiftType: 'Night', date: '2026-08-23', status: 'Scheduled' },
  { id: 'SH-005', staffName: 'Nurse Abena Nyarko', role: 'Midwife', ward: 'Maternity', shiftType: 'Morning', date: '2026-08-23', status: 'On Duty' },
  { id: 'SH-006', staffName: 'Nurse Kwaku Mensah', role: 'Staff Nurse', ward: 'Paediatric', shiftType: 'Night', date: '2026-08-22', status: 'Completed' },
];

const SHIFT_COLORS: Record<string, string> = { Morning: 'bg-yellow-100 text-yellow-800', Evening: 'bg-orange-100 text-orange-800', Night: 'bg-indigo-100 text-indigo-800' };
const STATUS_COLORS: Record<string, string> = { Scheduled: 'bg-blue-100 text-blue-800', 'On Duty': 'bg-green-100 text-green-800', Completed: 'bg-gray-100 text-gray-800', Absent: 'bg-red-100 text-red-800' };

export default function StaffScheduling() {
  const [shifts] = useState<Shift[]>(SHIFTS);
  const [filter, setFilter] = useState('');
  const filtered = shifts.filter((s) => !filter || s.shiftType === filter);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Staff Scheduling</h1><p className="text-gray-500">Nurse and doctor shift scheduling, roster management, and coverage tracking</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {['Morning', 'Evening', 'Night'].map((s) => (<div key={s} className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold">{shifts.filter((sh) => sh.shiftType === s && sh.status === 'On Duty').length}</div><div className="text-xs text-slate-500">{s} On Duty</div></div>))}
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-red-600">{shifts.filter((s) => s.status === 'Absent').length}</div><div className="text-xs text-slate-500">Absent</div></div>
      </div>
      <div className="flex gap-2">
        {['', 'Morning', 'Evening', 'Night'].map((f) => (<button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full text-xs font-medium transition ${filter === f ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{f || 'All'}</button>))}
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50"><tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Staff</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Role</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Ward</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Shift</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-medium">{s.staffName}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{s.role}</td>
                <td className="px-4 py-3 text-sm">{s.ward}</td>
                <td className="px-4 py-3"><Badge className={SHIFT_COLORS[s.shiftType]}>{s.shiftType}</Badge></td>
                <td className="px-4 py-3"><Badge className={STATUS_COLORS[s.status]}>{s.status}</Badge></td>
                <td className="px-4 py-3"><div className="flex gap-1">{s.status === 'Scheduled' && <><button onClick={() => {}} className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded">Start</button><button className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded">Absent</button></>}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
