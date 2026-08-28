import { useState, useEffect } from 'react';
import { Card, Badge, useToast } from '../../components/ui';

interface TimeEntry {
  id: string;
  staffName: string;
  staffId: string;
  department: string;
  role: string;
  date: string;
  clockIn: string;
  clockOut: string;
  hoursWorked: number;
  overtime: number;
  status: 'On Duty' | 'On Break' | 'Clocked Out' | 'Absent' | 'Leave' | 'Late';
  shift: 'Morning' | 'Afternoon' | 'Night';
  notes: string;
  approvedBy: string;
  isLate: boolean;
  lateMinutes: number;
  biometricMethod: 'Fingerprint' | 'Facial' | 'QR Code' | 'Card' | 'Manual';
  biometricVerified: boolean;
  location: string;
  ipAddress: string;
}

interface LeaveRequest {
  id: string;
  staffName: string;
  department: string;
  leaveType: 'Annual' | 'Sick' | 'Maternity' | 'Paternity' | 'Compassionate' | 'Study' | 'Unpaid';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Active';
  approvedBy: string;
  dateApplied: string;
  medicalCert?: boolean;
}

interface BiometricDevice {
  id: string;
  name: string;
  location: string;
  type: 'Fingerprint' | 'Facial' | 'QR Scanner' | 'Card Reader';
  status: 'Online' | 'Offline' | 'Maintenance';
  lastPing: string;
  enrolledUsers: number;
  todayScans: number;
}

const DEVICES: BiometricDevice[] = [
  { id: 'BIO-001', name: 'Main Entrance Scanner', location: 'Hospital Main Gate', type: 'Fingerprint', status: 'Online', lastPing: '2026-08-25 12:30', enrolledUsers: 85, todayScans: 142 },
  { id: 'BIO-002', name: 'Staff Entrance Face ID', location: 'Staff Gate (North)', type: 'Facial', status: 'Online', lastPing: '2026-08-25 12:29', enrolledUsers: 85, todayScans: 98 },
  { id: 'BIO-003', name: 'Emergency Dept QR Pad', location: 'Emergency Entrance', type: 'QR Scanner', status: 'Online', lastPing: '2026-08-25 12:28', enrolledUsers: 85, todayScans: 45 },
  { id: 'BIO-004', name: 'Theatre Card Reader', location: 'Theatre Corridor', type: 'Card Reader', status: 'Online', lastPing: '2026-08-25 12:27', enrolledUsers: 32, todayScans: 28 },
  { id: 'BIO-005', name: 'ICU Fingerprint Pad', location: 'ICU Entrance', type: 'Fingerprint', status: 'Maintenance', lastPing: '2026-08-24 18:00', enrolledUsers: 18, todayScans: 0 },
  { id: 'BIO-006', name: 'Admin Block Face ID', location: 'Admin Building', type: 'Facial', status: 'Online', lastPing: '2026-08-25 12:25', enrolledUsers: 25, todayScans: 32 },
];

const TIME_ENTRIES: TimeEntry[] = [
  { id: 'TE-001', staffName: 'Dr. Efua Prempeh', staffId: 'STF-001', department: 'Clinical', role: 'Doctor', date: '2026-08-25', clockIn: '07:55', clockOut: '', hoursWorked: 4.5, overtime: 0, status: 'On Duty', shift: 'Morning', notes: '', approvedBy: '', isLate: false, lateMinutes: 0, biometricMethod: 'Fingerprint', biometricVerified: true, location: 'Main Gate', ipAddress: '192.168.1.101' },
  { id: 'TE-002', staffName: 'Sr. Abena Osei', staffId: 'STF-002', department: 'Nursing', role: 'Senior Nurse', date: '2026-08-25', clockIn: '06:58', clockOut: '14:05', hoursWorked: 7.1, overtime: 0.1, status: 'Clocked Out', shift: 'Morning', notes: '', approvedBy: 'Matron', isLate: false, lateMinutes: 0, biometricMethod: 'Facial', biometricVerified: true, location: 'Staff Gate', ipAddress: '192.168.1.102' },
  { id: 'TE-003', staffName: 'Nurse Kwadwo Mensah', staffId: 'STF-003', department: 'Nursing', role: 'Staff Nurse', date: '2026-08-25', clockIn: '08:15', clockOut: '', hoursWorked: 4, overtime: 0, status: 'On Break', shift: 'Morning', notes: 'Traffic delay', approvedBy: '', isLate: true, lateMinutes: 15, biometricMethod: 'Fingerprint', biometricVerified: true, location: 'Main Gate', ipAddress: '192.168.1.103' },
  { id: 'TE-004', staffName: 'Pharm. Kofi Asante', staffId: 'STF-004', department: 'Pharmacy', role: 'Pharmacist', date: '2026-08-25', clockIn: '07:50', clockOut: '', hoursWorked: 4.5, overtime: 0, status: 'On Duty', shift: 'Morning', notes: '', approvedBy: '', isLate: false, lateMinutes: 0, biometricMethod: 'QR Code', biometricVerified: true, location: 'Main Gate', ipAddress: '192.168.1.104' },
  { id: 'TE-005', staffName: 'Lab Tech. Akua Boateng', staffId: 'STF-005', department: 'Laboratory', role: 'Lab Technologist', date: '2026-08-25', clockIn: '07:00', clockOut: '15:05', hoursWorked: 8.1, overtime: 0.1, status: 'Clocked Out', shift: 'Morning', notes: '', approvedBy: 'Lab Manager', isLate: false, lateMinutes: 0, biometricMethod: 'Card', biometricVerified: true, location: 'Staff Gate', ipAddress: '192.168.1.105' },
  { id: 'TE-006', staffName: 'Dr. Yaa Asantewaa', staffId: 'STF-006', department: 'Cardiology', role: 'Cardiologist', date: '2026-08-25', clockIn: '', clockOut: '', hoursWorked: 0, overtime: 0, status: 'Absent', shift: 'Morning', notes: 'On call — expected 10:00', approvedBy: '', isLate: false, lateMinutes: 0, biometricMethod: 'Manual', biometricVerified: false, location: '', ipAddress: '' },
  { id: 'TE-007', staffName: 'Nurse Esi Kumah', staffId: 'STF-007', department: 'ICU', role: 'ICU Nurse', date: '2026-08-25', clockIn: '18:55', clockOut: '', hoursWorked: 2, overtime: 0, status: 'On Duty', shift: 'Night', notes: '', approvedBy: '', isLate: false, lateMinutes: 0, biometricMethod: 'Facial', biometricVerified: true, location: 'Staff Gate', ipAddress: '192.168.1.107' },
  { id: 'TE-008', staffName: 'Dr. Kwadwo Darko', staffId: 'STF-008', department: 'Emergency', role: 'ER Doctor', date: '2026-08-25', clockIn: '08:30', clockOut: '', hoursWorked: 3.5, overtime: 0, status: 'On Duty', shift: 'Afternoon', notes: 'Called in for emergency', approvedBy: 'HOD', isLate: true, lateMinutes: 30, biometricMethod: 'Fingerprint', biometricVerified: true, location: 'Emergency Entrance', ipAddress: '192.168.1.108' },
  { id: 'TE-009', staffName: 'Midwife Grace Appiah', staffId: 'STF-009', department: 'Maternity', role: 'Midwife', date: '2026-08-25', clockIn: '07:00', clockOut: '19:10', hoursWorked: 12.2, overtime: 4.2, status: 'Clocked Out', shift: 'Morning', notes: 'Extended for emergency delivery', approvedBy: 'Matron', isLate: false, lateMinutes: 0, biometricMethod: 'Facial', biometricVerified: true, location: 'Main Gate', ipAddress: '192.168.1.109' },
  { id: 'TE-010', staffName: 'Mr. Emmanuel Nti', staffId: 'STF-010', department: 'Facilities', role: 'Maintenance Officer', date: '2026-08-25', clockIn: '06:00', clockOut: '14:00', hoursWorked: 8, overtime: 0, status: 'Clocked Out', shift: 'Morning', notes: '', approvedBy: 'Facilities Manager', isLate: false, lateMinutes: 0, biometricMethod: 'Fingerprint', biometricVerified: true, location: 'Staff Gate', ipAddress: '192.168.1.110' },
];

const LEAVE_REQUESTS: LeaveRequest[] = [
  { id: 'LV-001', staffName: 'Sr. Abena Osei', department: 'Nursing', leaveType: 'Annual', startDate: '2026-09-01', endDate: '2026-09-05', days: 5, reason: 'Family vacation', status: 'Approved', approvedBy: 'Matron', dateApplied: '2026-08-20' },
  { id: 'LV-002', staffName: 'Nurse Kwadwo Mensah', department: 'Nursing', leaveType: 'Sick', startDate: '2026-08-25', endDate: '2026-08-27', days: 3, reason: 'Malaria treatment', status: 'Active', approvedBy: 'HOD', dateApplied: '2026-08-25', medicalCert: true },
  { id: 'LV-003', staffName: 'Dr. Yaa Asantewaa', department: 'Cardiology', leaveType: 'Study', startDate: '2026-10-15', endDate: '2026-10-20', days: 6, reason: 'Cardiology conference in Accra', status: 'Pending', approvedBy: '', dateApplied: '2026-08-22' },
  { id: 'LV-004', staffName: 'Pharm. Kofi Asante', department: 'Pharmacy', leaveType: 'Annual', startDate: '2026-09-15', endDate: '2026-09-19', days: 5, reason: 'Personal', status: 'Approved', approvedBy: 'Pharmacy Manager', dateApplied: '2026-08-18' },
];

const SHIFT_COLORS: Record<string, string> = { Morning: 'bg-yellow-100 text-yellow-800', Afternoon: 'bg-blue-100 text-blue-800', Night: 'bg-purple-100 text-purple-800' };
const STATUS_COLORS: Record<string, string> = { 'On Duty': 'bg-green-100 text-green-800', 'On Break': 'bg-yellow-100 text-yellow-800', 'Clocked Out': 'bg-gray-100 text-gray-800', Absent: 'bg-red-100 text-red-800', Leave: 'bg-blue-100 text-blue-800', Late: 'bg-orange-100 text-orange-800' };
const LEAVE_COLORS: Record<string, string> = { Pending: 'bg-yellow-100 text-yellow-800', Approved: 'bg-green-100 text-green-800', Rejected: 'bg-red-100 text-red-800', Active: 'bg-blue-100 text-blue-800' };
const DEVICE_COLORS: Record<string, string> = { Online: 'bg-green-100 text-green-800', Offline: 'bg-red-100 text-red-800', Maintenance: 'bg-yellow-100 text-yellow-800' };
const BIOMETRIC_COLORS: Record<string, string> = { Fingerprint: 'bg-blue-100 text-blue-800', Facial: 'bg-purple-100 text-purple-800', 'QR Code': 'bg-green-100 text-green-800', Card: 'bg-orange-100 text-orange-800', Manual: 'bg-gray-100 text-gray-800' };

export default function StaffTimeBook() {
  const [tab, setTab] = useState<'overview' | 'timesheet' | 'devices' | 'biometric' | 'leave' | 'reports'>('overview');
  const [showClockIn, setShowClockIn] = useState(false);
  const [clockMethod, setClockMethod] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const toast = useToast();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const totalWorked = TIME_ENTRIES.reduce((s, t) => s + t.hoursWorked, 0);
  const totalOvertime = TIME_ENTRIES.reduce((s, t) => s + t.overtime, 0);
  const onDuty = TIME_ENTRIES.filter(t => t.status === 'On Duty' || t.status === 'On Break').length;
  const lateStaff = TIME_ENTRIES.filter(t => t.isLate);
  const totalScans = DEVICES.reduce((s, d) => s + d.todayScans, 0);

  const simulateScan = (method: string) => {
    setClockMethod(method);
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setShowClockIn(false);
      toast(`✅ ${method} verified — Clocked in at ${currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`, 'success');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">⏰ Staff Time Book</h1>
          <p className="text-gray-600 mt-1">Biometric clock in/out · Electronic verification · Attendance · Leave</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowClockIn(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2">👆 Clock In</button>
          <button onClick={() => toast('Clock-out processed via biometric', 'success')} className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 flex items-center gap-2">👆 Clock Out</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: 'On Duty', value: onDuty, icon: '🟢', color: 'text-green-600' },
          { label: 'Clocked Out', value: TIME_ENTRIES.filter(t => t.status === 'Clocked Out').length, icon: '🔴', color: 'text-gray-600' },
          { label: 'Late Today', value: lateStaff.length, icon: '⏰', color: 'text-orange-600' },
          { label: 'Overtime Hrs', value: totalOvertime.toFixed(1), icon: '⏱️', color: 'text-purple-600' },
          { label: 'Biometric Scans', value: totalScans, icon: '👆', color: 'text-blue-600' },
          { label: 'Devices Online', value: DEVICES.filter(d => d.status === 'Online').length, icon: '📡', color: 'text-green-600' },
        ].map((s, i) => (
          <Card key={i} className="p-3"><div className="text-xs text-gray-500">{s.icon} {s.label}</div><div className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</div></Card>
        ))}
      </div>

      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {(['overview', 'timesheet', 'devices', 'biometric', 'leave', 'reports'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === t ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'timesheet' ? '📋 Timesheet' : t === 'devices' ? '📡 Devices' : t === 'biometric' ? '🔐 Biometric' : t === 'leave' ? '🏖️ Leave' : '📈 Reports'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Today's Attendance</h3>
            <div className="space-y-2">
              {TIME_ENTRIES.map(t => (
                <div key={t.id} className={`flex items-center justify-between p-3 rounded-lg ${t.isLate ? 'bg-orange-50' : t.status === 'Absent' ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${t.status === 'On Duty' ? 'bg-green-500' : t.status === 'On Break' ? 'bg-yellow-500' : t.status === 'Clocked Out' ? 'bg-gray-400' : 'bg-red-500'}`} />
                    <div>
                      <div className="font-medium text-sm">{t.staffName}</div>
                      <div className="text-xs text-gray-500">{t.role} · {t.department}</div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="flex items-center gap-2">
                      <Badge className={BIOMETRIC_COLORS[t.biometricMethod]}>{t.biometricMethod === 'Fingerprint' ? '👆' : t.biometricMethod === 'Facial' ? '📷' : t.biometricMethod === 'QR Code' ? '📱' : t.biometricMethod === 'Card' ? '💳' : '✏️'} {t.biometricMethod}</Badge>
                      {t.biometricVerified ? <span className="text-green-600 text-xs">✓</span> : <span className="text-red-600 text-xs">✗</span>}
                    </div>
                    {t.clockIn && <div className="mt-1"><span className="text-gray-500">In:</span> <span className="font-mono font-bold">{t.clockIn}</span></div>}
                    {t.clockOut && <div><span className="text-gray-500">Out:</span> <span className="font-mono font-bold">{t.clockOut}</span></div>}
                    {t.isLate && <div className="text-orange-600 text-xs font-bold">⏰ +{t.lateMinutes}min late</div>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Hours Summary</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg text-center"><div className="text-2xl font-bold text-blue-600">{totalWorked.toFixed(1)}</div><div className="text-sm text-blue-800">Total Hours</div></div>
                <div className="p-4 bg-purple-50 rounded-lg text-center"><div className="text-2xl font-bold text-purple-600">{totalOvertime.toFixed(1)}</div><div className="text-sm text-purple-800">Overtime</div></div>
              </div>
              <div className="space-y-2">
                {Object.entries(TIME_ENTRIES.reduce<Record<string, { count: number; hours: number }>>((a, t) => { if (!a[t.department]) a[t.department] = { count: 0, hours: 0 }; a[t.department].count++; a[t.department].hours += t.hoursWorked; return a; }, {})).sort((a, b) => b[1].hours - a[1].hours).map(([dept, data]) => (
                  <div key={dept} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-sm"><span className="font-medium">{dept}</span><span className="font-bold">{data.hours.toFixed(1)}h ({data.count} staff)</span></div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === 'timesheet' && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Staff</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">Shift</th>
                <th className="px-4 py-3 text-left">Clock In</th>
                <th className="px-4 py-3 text-left">Clock Out</th>
                <th className="px-4 py-3 text-left">Hours</th>
                <th className="px-4 py-3 text-left">OT</th>
                <th className="px-4 py-3 text-left">Method</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {TIME_ENTRIES.sort((a, b) => a.clockIn.localeCompare(b.clockIn)).map(t => (
                <tr key={t.id} className={`border-b hover:bg-gray-50 ${t.isLate ? 'bg-orange-50' : ''}`}>
                  <td className="px-4 py-3"><div className="font-medium">{t.staffName}</div><div className="text-xs text-gray-500">{t.staffId}</div></td>
                  <td className="px-4 py-3">{t.department}</td>
                  <td className="px-4 py-3"><Badge className={SHIFT_COLORS[t.shift]}>{t.shift}</Badge></td>
                  <td className="px-4 py-3 font-mono font-bold">{t.clockIn || '—'}</td>
                  <td className="px-4 py-3 font-mono">{t.clockOut || '—'}</td>
                  <td className="px-4 py-3 font-bold">{t.hoursWorked > 0 ? `${t.hoursWorked.toFixed(1)}h` : '—'}</td>
                  <td className="px-4 py-3">{t.overtime > 0 ? <span className="text-purple-600 font-bold">+{t.overtime.toFixed(1)}h</span> : '—'}</td>
                  <td className="px-4 py-3"><Badge className={BIOMETRIC_COLORS[t.biometricMethod]}>{t.biometricMethod}</Badge></td>
                  <td className="px-4 py-3 text-xs">{t.location || '—'}</td>
                  <td className="px-4 py-3"><Badge className={STATUS_COLORS[t.status]}>{t.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'devices' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEVICES.map(d => (
            <Card key={d.id} className={`p-5 ${d.status === 'Maintenance' ? 'ring-2 ring-yellow-500' : ''}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-gray-900">{d.name}</div>
                  <div className="text-sm text-gray-500">{d.location}</div>
                </div>
                <Badge className={DEVICE_COLORS[d.status]}>{d.status}</Badge>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Badge className={BIOMETRIC_COLORS[d.type]}>{d.type === 'Fingerprint' ? '👆' : d.type === 'Facial' ? '📷' : d.type === 'QR Scanner' ? '📱' : '💳'} {d.type}</Badge>
              </div>
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Enrolled Users</span><span className="font-bold">{d.enrolledUsers}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Today's Scans</span><span className="font-bold">{d.todayScans}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Last Ping</span><span className="text-xs">{d.lastPing}</span></div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'biometric' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Biometric Method Distribution</h3>
            <div className="space-y-3">
              {Object.entries(TIME_ENTRIES.reduce<Record<string, number>>((a, t) => { a[t.biometricMethod] = (a[t.biometricMethod] || 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]).map(([method, count]) => (
                <div key={method} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <Badge className={BIOMETRIC_COLORS[method]}>{method}</Badge><span className="font-bold">{count} staff</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Verification Status</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg text-center"><div className="text-2xl font-bold text-green-600">{TIME_ENTRIES.filter(t => t.biometricVerified).length}</div><div className="text-sm text-green-800">Verified</div></div>
                <div className="p-4 bg-red-50 rounded-lg text-center"><div className="text-2xl font-bold text-red-600">{TIME_ENTRIES.filter(t => !t.biometricVerified).length}</div><div className="text-sm text-red-800">Not Verified</div></div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === 'leave' && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">ID</th><th className="px-4 py-3 text-left">Staff</th><th className="px-4 py-3 text-left">Type</th><th className="px-4 py-3 text-left">Dates</th><th className="px-4 py-3 text-left">Days</th><th className="px-4 py-3 text-left">Reason</th><th className="px-4 py-3 text-left">Med Cert</th><th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {LEAVE_REQUESTS.map(l => (
                <tr key={l.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{l.id}</td><td className="px-4 py-3 font-medium">{l.staffName}</td><td className="px-4 py-3"><Badge className="bg-gray-100 text-gray-800">{l.leaveType}</Badge></td><td className="px-4 py-3 text-xs">{l.startDate} → {l.endDate}</td><td className="px-4 py-3 font-bold">{l.days}</td><td className="px-4 py-3 text-xs max-w-[150px] truncate">{l.reason}</td><td className="px-4 py-3">{l.medicalCert ? '✅' : '—'}</td><td className="px-4 py-3"><Badge className={LEAVE_COLORS[l.status]}>{l.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Late Arrivals Today</h3>
            <div className="space-y-2">
              {lateStaff.map(t => (
                <div key={t.id} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <div><div className="font-medium text-orange-800">{t.staffName}</div><div className="text-xs text-orange-600">{t.department} · Verified via {t.biometricMethod}</div></div>
                  <span className="text-lg font-bold text-orange-600">+{t.lateMinutes} min</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Overtime Leaders</h3>
            <div className="space-y-2">
              {TIME_ENTRIES.filter(t => t.overtime > 0).sort((a, b) => b.overtime - a.overtime).map(t => (
                <div key={t.id} className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <div><div className="font-medium text-purple-800">{t.staffName}</div><div className="text-xs text-purple-600">{t.department} · {t.notes}</div></div>
                  <span className="text-lg font-bold text-purple-600">+{t.overtime.toFixed(1)}h</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Biometric Clock-In Modal */}
      {showClockIn && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">🔐 Biometric Clock In</h3>
              <button onClick={() => { setShowClockIn(false); setScanning(false); setClockMethod(''); }} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
            </div>

            {!scanning && !clockMethod && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <div className="text-4xl font-mono font-bold text-green-600">{currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                  <div className="text-sm text-green-800 mt-1">{currentTime.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                <div className="text-center text-sm text-gray-500 mb-2">Select verification method:</div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => simulateScan('Fingerprint')} className="p-4 border-2 border-blue-200 rounded-xl hover:bg-blue-50 hover:border-blue-500 transition text-center">
                    <div className="text-3xl mb-2">👆</div>
                    <div className="font-bold text-blue-800">Fingerprint</div>
                    <div className="text-xs text-blue-600">Place finger on scanner</div>
                  </button>
                  <button onClick={() => simulateScan('Facial')} className="p-4 border-2 border-purple-200 rounded-xl hover:bg-purple-50 hover:border-purple-500 transition text-center">
                    <div className="text-3xl mb-2">📷</div>
                    <div className="font-bold text-purple-800">Facial Recognition</div>
                    <div className="text-xs text-purple-600">Look at camera</div>
                  </button>
                  <button onClick={() => simulateScan('QR Code')} className="p-4 border-2 border-green-200 rounded-xl hover:bg-green-50 hover:border-green-500 transition text-center">
                    <div className="text-3xl mb-2">📱</div>
                    <div className="font-bold text-green-800">QR Code</div>
                    <div className="text-xs text-green-600">Scan your badge QR</div>
                  </button>
                  <button onClick={() => simulateScan('Card')} className="p-4 border-2 border-orange-200 rounded-xl hover:bg-orange-50 hover:border-orange-500 transition text-center">
                    <div className="text-3xl mb-2">💳</div>
                    <div className="font-bold text-orange-800">ID Card</div>
                    <div className="text-xs text-orange-600">Tap your ID card</div>
                  </button>
                </div>
              </div>
            )}

            {scanning && (
              <div className="space-y-4 text-center">
                <div className="p-8">
                  <div className="text-6xl mb-4 animate-pulse">{clockMethod === 'Fingerprint' ? '👆' : clockMethod === 'Facial' ? '📷' : clockMethod === 'QR Code' ? '📱' : '💳'}</div>
                  <div className="text-xl font-bold text-blue-600">Scanning {clockMethod}...</div>
                  <div className="text-sm text-gray-500 mt-2">Please hold still</div>
                  <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}