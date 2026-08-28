import { useState } from 'react';
import { Card, Badge, Button, Icon } from '../../components/ui';

interface Appointment {
  id: string;
  patientName: string;
  mrn: string;
  phone: string;
  department: string;
  doctor: string;
  date: string;
  time: string;
  type: 'Consultation' | 'Follow-up' | 'Lab Review' | 'Surgery Prep' | 'Vaccination' | 'ANC' | 'Dental' | 'Eye';
  status: 'Scheduled' | 'Confirmed' | 'Checked-in' | 'In Progress' | 'Completed' | 'No-show' | 'Cancelled';
  reason: string;
  notes: string;
  paymentMethod: 'Cash' | 'NHIS' | 'Insurance' | 'Credit';
}

const DEPARTMENTS = ['General OPD', 'Paediatrics', 'Obstetrics', 'Surgery', 'Ophthalmology', 'ENT', 'Dental', 'Dermatology', 'Psychiatry', 'Cardiology', 'Orthopaedics', 'Urology', 'Neurology', 'Endocrinology'];

const SAMPLE_APPOINTMENTS: Appointment[] = [
  { id: 'APT-001', patientName: 'Kwame Asante', mrn: 'MRN-2024-0012', phone: '0244123456', department: 'Cardiology', doctor: 'Dr. Koomson', date: '2024-01-16', time: '09:00', type: 'Follow-up', status: 'Scheduled', reason: 'Post-MI follow-up, medication review', notes: 'ECG needed', paymentMethod: 'NHIS' },
  { id: 'APT-002', patientName: 'Akua Mensah', mrn: 'MRN-2024-0045', phone: '0205678901', department: 'Obstetrics', doctor: 'Dr. Ansah', date: '2024-01-16', time: '09:30', type: 'ANC', status: 'Confirmed', reason: '32-week ANC visit', notes: '', paymentMethod: 'Cash' },
  { id: 'APT-003', patientName: 'Yaw Boateng', mrn: 'MRN-2024-0078', phone: '0267123456', department: 'General OPD', doctor: 'Dr. Mensah', date: '2024-01-16', time: '10:00', type: 'Consultation', status: 'Checked-in', reason: 'Persistent headache for 2 weeks', notes: '', paymentMethod: 'Insurance' },
  { id: 'APT-004', patientName: 'Efua Osei', mrn: 'MRN-2024-0092', phone: '0244987654', department: 'Dental', doctor: 'Dr. Darko', date: '2024-01-16', time: '10:30', type: 'Dental', status: 'Completed', reason: 'Tooth extraction', notes: 'Wisdom tooth removed successfully', paymentMethod: 'Cash' },
  { id: 'APT-005', patientName: 'Kofi Tetteh', mrn: 'MRN-2024-0123', phone: '0205432109', department: 'Ophthalmology', doctor: 'Dr. Owusu', date: '2024-01-16', time: '11:00', type: 'Consultation', status: 'No-show', reason: 'Blurred vision, right eye', notes: 'Patient did not show up', paymentMethod: 'NHIS' },
  { id: 'APT-006', patientName: 'Ama Adjei', mrn: 'MRN-2024-0156', phone: '0267654321', department: 'Paediatrics', doctor: 'Dr. Owusu-Mensah', date: '2024-01-16', time: '11:30', type: 'Vaccination', status: 'Scheduled', reason: '6-month vaccination', notes: '', paymentMethod: 'Cash' },
  { id: 'APT-007', patientName: 'Nana Kweku', mrn: 'MRN-2024-0178', phone: '0244111222', department: 'Surgery', doctor: 'Dr. Ansah', date: '2024-01-16', time: '14:00', type: 'Surgery Prep', status: 'Confirmed', reason: 'Pre-op assessment for hernia repair', notes: 'Fasting required', paymentMethod: 'Insurance' },
  { id: 'APT-008', patientName: 'Aba Frimpong', mrn: 'MRN-2024-0190', phone: '0205333444', department: 'General OPD', doctor: 'Dr. Mensah', date: '2024-01-16', time: '14:30', type: 'Lab Review', status: 'Scheduled', reason: 'Review HbA1c results', notes: 'Diabetic patient', paymentMethod: 'NHIS' },
];

const STATUS_COLORS: Record<string, string> = {
  Scheduled: 'bg-blue-100 text-blue-800',
  Confirmed: 'bg-green-100 text-green-800',
  'Checked-in': 'bg-purple-100 text-purple-800',
  'In Progress': 'bg-yellow-100 text-yellow-800',
  Completed: 'bg-emerald-100 text-emerald-800',
  'No-show': 'bg-red-100 text-red-800',
  Cancelled: 'bg-gray-100 text-gray-600',
};

const TYPE_COLORS: Record<string, string> = {
  Consultation: 'bg-blue-50 text-blue-700',
  'Follow-up': 'bg-green-50 text-green-700',
  'Lab Review': 'bg-orange-50 text-orange-700',
  'Surgery Prep': 'bg-purple-50 text-purple-700',
  Vaccination: 'bg-teal-50 text-teal-700',
  ANC: 'bg-pink-50 text-pink-700',
  Dental: 'bg-amber-50 text-amber-700',
  Eye: 'bg-indigo-50 text-indigo-700',
};

export default function AppointmentSchedulerEnhanced() {
  const [appointments] = useState<Appointment[]>(SAMPLE_APPOINTMENTS);
  const [showAdd, setShowAdd] = useState(false);
  const [filterDept, setFilterDept] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');

  const filtered = appointments.filter(a => {
    if (filterDept !== 'All' && a.department !== filterDept) return false;
    if (filterStatus !== 'All' && a.status !== filterStatus) return false;
    return true;
  });

  const today = '2024-01-16';
  const todayAppts = appointments.filter(a => a.date === today);
  const checkedIn = todayAppts.filter(a => a.status === 'Checked-in' || a.status === 'In Progress');
  const noShows = todayAppts.filter(a => a.status === 'No-show');
  const completed = todayAppts.filter(a => a.status === 'Completed');
  const noShowRate = todayAppts.length > 0 ? ((noShows.length / todayAppts.length) * 100).toFixed(0) : '0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Appointment Scheduler</h1>
          <p className="text-slate-500">Schedule, manage, and track patient appointments across all departments</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Icon name="plus" className="h-4 w-4" /> New Appointment</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-sm text-slate-500">Today's Appointments</p>
          <p className="text-2xl font-bold">{todayAppts.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Checked In</p>
          <p className="text-2xl font-bold text-purple-600">{checkedIn.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Completed</p>
          <p className="text-2xl font-bold text-green-600">{completed.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">No-shows</p>
          <p className="text-2xl font-bold text-red-600">{noShows.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">No-show Rate</p>
          <p className={`text-2xl font-bold ${parseInt(noShowRate) > 10 ? 'text-red-600' : 'text-green-600'}`}>{noShowRate}%</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Department:</span>
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm">
            <option>All</option>
            {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Status:</span>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm">
            <option>All</option>
            {Object.keys(STATUS_COLORS).map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded text-sm ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>List</button>
          <button onClick={() => setViewMode('timeline')} className={`px-3 py-1.5 rounded text-sm ${viewMode === 'timeline' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>Timeline</button>
        </div>
      </div>

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <Card className="p-4">
          <h3 className="font-medium mb-4">Today's Timeline — {today}</h3>
          <div className="space-y-2">
            {filtered.sort((a, b) => a.time.localeCompare(b.time)).map(a => (
              <div key={a.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50">
                <span className="font-mono text-sm font-bold text-blue-600 w-16">{a.time}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{a.patientName}</span>
                    <Badge className={`${STATUS_COLORS[a.status]} text-xs`}>{a.status}</Badge>
                    <Badge className={`${TYPE_COLORS[a.type]} text-xs`}>{a.type}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">{a.department} • {a.doctor} • {a.reason}</p>
                </div>
                <span className="text-xs text-slate-400">{a.paymentMethod}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-2 font-medium">Time</th>
                <th className="pb-2 font-medium">Patient</th>
                <th className="pb-2 font-medium">Department</th>
                <th className="pb-2 font-medium">Doctor</th>
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium">Reason</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Payment</th>
              </tr>
            </thead>
            <tbody>
              {filtered.sort((a, b) => a.time.localeCompare(b.time)).map(a => (
                <tr key={a.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 font-mono font-bold text-blue-600">{a.time}</td>
                  <td className="py-3">
                    <p className="font-medium">{a.patientName}</p>
                    <p className="text-xs text-slate-400">{a.mrn} • {a.phone}</p>
                  </td>
                  <td className="py-3">{a.department}</td>
                  <td className="py-3">{a.doctor}</td>
                  <td className="py-3"><Badge className={`${TYPE_COLORS[a.type]} text-xs`}>{a.type}</Badge></td>
                  <td className="py-3 max-w-[200px] truncate">{a.reason}</td>
                  <td className="py-3"><Badge className={`${STATUS_COLORS[a.status]} text-xs`}>{a.status}</Badge></td>
                  <td className="py-3"><Badge className="bg-slate-100 text-slate-700 text-xs">{a.paymentMethod}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">New Appointment</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600"><Icon name="x" className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><label className="block text-slate-600 mb-1">Patient Name</label><input className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">MRN</label><input className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">Phone</label><input className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">Department</label><select className="w-full border rounded-lg px-3 py-2">{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</select></div>
              <div><label className="block text-slate-600 mb-1">Doctor</label><input className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">Type</label><select className="w-full border rounded-lg px-3 py-2"><option>Consultation</option><option>Follow-up</option><option>Lab Review</option><option>Surgery Prep</option><option>Vaccination</option><option>ANC</option><option>Dental</option><option>Eye</option></select></div>
              <div><label className="block text-slate-600 mb-1">Date</label><input type="date" className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">Time</label><input type="time" className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">Payment Method</label><select className="w-full border rounded-lg px-3 py-2"><option>Cash</option><option>NHIS</option><option>Insurance</option><option>Credit</option></select></div>
              <div><label className="block text-slate-600 mb-1">Status</label><select className="w-full border rounded-lg px-3 py-2"><option>Scheduled</option><option>Confirmed</option></select></div>
              <div className="col-span-2"><label className="block text-slate-600 mb-1">Reason</label><textarea className="w-full border rounded-lg px-3 py-2" rows={2} /></div>
              <div className="col-span-2"><label className="block text-slate-600 mb-1">Notes</label><textarea className="w-full border rounded-lg px-3 py-2" rows={2} /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-slate-100 rounded-lg text-sm">Cancel</button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Schedule Appointment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
