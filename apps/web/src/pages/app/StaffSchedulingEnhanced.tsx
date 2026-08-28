import { useState } from 'react';
import { Badge, Card } from '../../components/ui';

interface Shift { id: string; staffName: string; role: string; ward: string; shiftType: 'Morning' | 'Evening' | 'Night'; date: string; status: 'Scheduled' | 'On Duty' | 'Completed' | 'Absent' | 'Leave'; hoursWorked: number; overtime: number; }

const SHIFTS: Shift[] = [
  { id: 'SH-001', staffName: 'Nurse Akua Mensah', role: 'Senior Nurse', ward: 'ICU', shiftType: 'Morning', date: '2026-08-26', status: 'On Duty', hoursWorked: 4, overtime: 0 },
  { id: 'SH-002', staffName: 'Nurse Kofi Osei', role: 'Staff Nurse', ward: 'Medical Ward A', shiftType: 'Morning', date: '2026-08-26', status: 'On Duty', hoursWorked: 3, overtime: 0 },
  { id: 'SH-003', staffName: 'Nurse Esi Darko', role: 'Staff Nurse', ward: 'Surgical Ward', shiftType: 'Evening', date: '2026-08-26', status: 'Scheduled', hoursWorked: 0, overtime: 0 },
  { id: 'SH-004', staffName: 'Dr. Yaw Boateng', role: 'Medical Officer', ward: 'Emergency', shiftType: 'Night', date: '2026-08-26', status: 'Scheduled', hoursWorked: 0, overtime: 0 },
  { id: 'SH-005', staffName: 'Nurse Abena Nyarko', role: 'Midwife', ward: 'Maternity', shiftType: 'Morning', date: '2026-08-26', status: 'On Duty', hoursWorked: 5, overtime: 1 },
  { id: 'SH-006', staffName: 'Nurse Kwaku Mensah', role: 'Staff Nurse', ward: 'Paediatric', shiftType: 'Night', date: '2026-08-25', status: 'Completed', hoursWorked: 8, overtime: 0 },
  { id: 'SH-007', staffName: 'Dr. Ama Darko', role: 'Consultant', ward: 'ICU', shiftType: 'Morning', date: '2026-08-26', status: 'On Duty', hoursWorked: 4, overtime: 0 },
  { id: 'SH-008', staffName: 'Nurse Yaa Asantewaa', role: 'Staff Nurse', ward: 'Oncology', shiftType: 'Morning', date: '2026-08-26', status: 'Absent', hoursWorked: 0, overtime: 0 },
  { id: 'SH-009', staffName: 'Nurse Agyapong K.', role: 'Nurse Manager', ward: 'Surgical Ward', shiftType: 'Morning', date: '2026-08-26', status: 'On Duty', hoursWorked: 6, overtime: 2 },
  { id: 'SH-010', staffName: 'Dr. Kwame Nkrumah', role: 'Surgeon', ward: 'Theatre', shiftType: 'Morning', date: '2026-08-26', status: 'On Duty', hoursWorked: 5, overtime: 0 },
  { id: 'SH-011', staffName: 'Nurse Esi Mensah', role: 'Staff Nurse', ward: 'NICU', shiftType: 'Evening', date: '2026-08-26', status: 'Scheduled', hoursWorked: 0, overtime: 0 },
  { id: 'SH-012', staffName: 'Dr. Kofi Asante', role: 'Medical Officer', ward: 'OPD', shiftType: 'Morning', date: '2026-08-27', status: 'Scheduled', hoursWorked: 0, overtime: 0 },
  { id: 'SH-013', staffName: 'Nurse Adwoa Serwaa', role: 'Senior Nurse', ward: 'Maternity', shiftType: 'Night', date: '2026-08-26', status: 'Scheduled', hoursWorked: 0, overtime: 0 },
  { id: 'SH-014', staffName: 'Dr. Nana Agyeman', role: 'Paediatrician', ward: 'Paediatric', shiftType: 'Morning', date: '2026-08-26', status: 'Leave', hoursWorked: 0, overtime: 0 },
];

const _SHIFT_COLORS: Record<string, string> = { Morning: 'bg-yellow-100 text-yellow-800', Evening: 'bg-orange-100 text-orange-800', Night: 'bg-indigo-100 text-indigo-800' };
const _STATUS_COLORS: Record<string, string> = { Scheduled: 'bg-blue-100 text-blue-800', 'On Duty': 'bg-green-100 text-green-800', Completed: 'bg-gray-100 text-gray-800', Absent: 'bg-red-100 text-red-800', Leave: 'bg-purple-100 text-purple-800' };
const SHIFT_ICONS: Record<string, string> = { Morning: '🌅', Evening: '🌇', Night: '🌙' };

export default function StaffSchedulingEnhanced() {
  const [shifts] = useState<Shift[]>(SHIFTS);
  const [filterShift, setFilterShift] = useState<string>('All');
  const [filterWard, setFilterWard] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'list' | 'roster'>('list');
  const wards = [...new Set(shifts.map(s => s.ward))];
  const filtered = shifts.filter(s => (filterShift === 'All' || s.shiftType === filterShift) && (filterWard === 'All' || s.ward === filterWard));
  const onDuty = shifts.filter(s => s.status === 'On Duty');
  const absent = shifts.filter(s => s.status === 'Absent');
  const totalOvertime = shifts.reduce((s, sh) => s + sh.overtime, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff Scheduling</h1>
          <p className="text-slate-500 text-sm">Shift rotation, duty roster, and coverage tracking</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-lg text-sm ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>List View</button>
          <button onClick={() => setViewMode('roster')} className={`px-3 py-1 rounded-lg text-sm ${viewMode === 'roster' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>Roster View</button>
          <button onClick={() => {}} className="px-4 py-1 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">+ Add Shift</button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4"><p className="text-xs text-slate-500">On Duty Now</p><p className="text-2xl font-bold text-green-600">{onDuty.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">🌅 Morning</p><p className="text-2xl font-bold">{shifts.filter(s => s.shiftType === 'Morning' && s.status === 'On Duty').length} active</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">🌇 Evening</p><p className="text-2xl font-bold">{shifts.filter(s => s.shiftType === 'Evening' && s.status !== 'Completed').length} scheduled</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">🌙 Night</p><p className="text-2xl font-bold">{shifts.filter(s => s.shiftType === 'Night' && s.status !== 'Completed').length} scheduled</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Absent / Leave</p><p className="text-2xl font-bold text-red-600">{absent.length + shifts.filter(s => s.status === 'Leave').length}</p></Card>
      </div>

      {/* Coverage by Ward */}
      {viewMode === 'roster' && (
        <Card className="p-4">
          <h2 className="font-semibold mb-3">Ward Coverage Roster — Today</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b">
                <th className="p-2 text-left">Ward</th>
                <th className="p-2 text-center">🌅 Morning</th>
                <th className="p-2 text-center">🌇 Evening</th>
                <th className="p-2 text-center">🌙 Night</th>
                <th className="p-2 text-center">Total Staff</th>
              </tr></thead>
              <tbody>
                {wards.map(ward => {
                  const wardShifts = shifts.filter(s => s.ward === ward && s.date === '2026-08-26');
                  const morning = wardShifts.filter(s => s.shiftType === 'Morning' && s.status === 'On Duty').length;
                  const evening = wardShifts.filter(s => s.shiftType === 'Evening').length;
                  const night = wardShifts.filter(s => s.shiftType === 'Night').length;
                  return (
                    <tr key={ward} className="border-b hover:bg-slate-50">
                      <td className="p-2 font-medium">{ward}</td>
                      <td className="p-2 text-center">{morning > 0 ? <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">{morning} on duty</span> : <span className="text-slate-300">—</span>}</td>
                      <td className="p-2 text-center">{evening > 0 ? <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">{evening} scheduled</span> : <span className="text-slate-300">—</span>}</td>
                      <td className="p-2 text-center">{night > 0 ? <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs">{night} scheduled</span> : <span className="text-slate-300">—</span>}</td>
                      <td className="p-2 text-center font-medium">{wardShifts.filter(s => s.status === 'On Duty').length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['All', 'Morning', 'Evening', 'Night'].map(s => (
          <button key={s} onClick={() => setFilterShift(s)} className={`px-3 py-1 rounded-lg text-xs font-medium ${filterShift === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{s !== 'All' ? `${SHIFT_ICONS[s]} ` : ''}{s}</button>
        ))}
        <select value={filterWard} onChange={e => setFilterWard(e.target.value)} className="px-3 py-1 rounded-lg text-xs border bg-white">
          <option value="All">All Wards</option>
          {wards.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
      </div>

      {/* Shift List */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {filtered.map(s => (
            <Card key={s.id} className="p-3 flex items-center gap-4">
              <span className="text-2xl">{SHIFT_ICONS[s.shiftType]}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{s.staffName}</span>
                  <Badge tone={s.status === 'On Duty' ? 'green' : s.status === 'Absent' ? 'red' : s.status === 'Leave' ? 'purple' : 'blue'}>{s.status}</Badge>
                </div>
                <p className="text-xs text-slate-500">{s.role} · {s.ward} · {s.shiftType} · {s.date}</p>
              </div>
              <div className="text-right text-xs text-slate-500">
                {s.hoursWorked > 0 && <p>{s.hoursWorked}h worked</p>}
                {s.overtime > 0 && <p className="text-orange-600 font-medium">+{s.overtime}h OT</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => {}} className="px-2 py-1 bg-slate-100 rounded text-xs hover:bg-slate-200">Edit</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {totalOvertime > 0 && (
        <Card className="p-4 bg-orange-50 border-orange-200">
          <p className="text-sm font-medium text-orange-800">⚠️ Total Overtime This Period: {totalOvertime} hours across {shifts.filter(s => s.overtime > 0).length} staff members</p>
        </Card>
      )}
    </div>
  );
}
