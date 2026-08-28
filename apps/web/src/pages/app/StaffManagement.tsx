import { useState } from 'react';
import { Button, Card, Field, Input, PageHeader, Select, useToast } from '../../components/ui';

interface Staff {
  id: string;
  fullName: string;
  email: string;
  role: string;
  department: string;
  phone: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
  shift: 'Morning' | 'Afternoon' | 'Night' | 'Off';
  licenseNo?: string;
  joinedAt: string;
}

const DEMO_STAFF: Staff[] = [
  { id: '1', fullName: 'Dr. Kwame Asante', email: 'kwame@hospital.gov.gh', role: 'Doctor', department: 'Internal Medicine', phone: '+233240000001', status: 'ACTIVE', shift: 'Morning', licenseNo: 'GMC-2024-001', joinedAt: '2022-03-15' },
  { id: '2', fullName: 'Nurse Ama Darko', email: 'ama@hospital.gov.gh', role: 'Nurse', department: 'Emergency', phone: '+233240000002', status: 'ACTIVE', shift: 'Morning', joinedAt: '2021-07-20' },
  { id: '3', fullName: 'Pharmacist Kofi Mensah', email: 'kofi@hospital.gov.gh', role: 'Pharmacist', department: 'Pharmacy', phone: '+233240000003', status: 'ACTIVE', shift: 'Afternoon', licenseNo: 'PCG-2024-015', joinedAt: '2023-01-10' },
  { id: '4', fullName: 'Dr. Akosua Boateng', email: 'akosua@hospital.gov.gh', role: 'Doctor', department: 'Pediatrics', phone: '+233240000004', status: 'ON_LEAVE', shift: 'Off', licenseNo: 'GMC-2024-008', joinedAt: '2020-09-01' },
  { id: '5', fullName: 'Lab Tech. Abena Osei', email: 'abena@hospital.gov.gh', role: 'Lab Scientist', department: 'Laboratory', phone: '+233240000005', status: 'ACTIVE', shift: 'Morning', joinedAt: '2022-11-05' },
  { id: '6', fullName: 'Nurse Efua Adjei', email: 'efua@hospital.gov.gh', role: 'Nurse', department: 'Maternity', phone: '+233240000006', status: 'ACTIVE', shift: 'Night', joinedAt: '2023-04-18' },
  { id: '7', fullName: 'Dr. Yaw Frimpong', email: 'yaw@hospital.gov.gh', role: 'Doctor', department: 'Surgery', phone: '+233240000007', status: 'ACTIVE', shift: 'Morning', licenseNo: 'GMC-2024-022', joinedAt: '2019-06-12' },
  { id: '8', fullName: 'Cashier Akua Sarkodie', email: 'akua@hospital.gov.gh', role: 'Cashier', department: 'Billing', phone: '+233240000008', status: 'ACTIVE', shift: 'Afternoon', joinedAt: '2024-01-02' },
  { id: '9', fullName: 'Dr. Nana Agyeman', email: 'nana@hospital.gov.gh', role: 'Doctor', department: 'Radiology', phone: '+233240000009', status: 'INACTIVE', shift: 'Off', licenseNo: 'GMC-2023-045', joinedAt: '2021-02-28' },
  { id: '10', fullName: 'Nurse Akoto Basoah', email: 'akoto@hospital.gov.gh', role: 'Nurse', department: 'ICU', phone: '+233240000010', status: 'ACTIVE', shift: 'Night', joinedAt: '2023-08-15' },
];

const DEPARTMENTS = ['All', 'Internal Medicine', 'Emergency', 'Pharmacy', 'Pediatrics', 'Laboratory', 'Maternity', 'Surgery', 'Billing', 'Radiology', 'ICU'];
const ROLES = ['Doctor', 'Nurse', 'Pharmacist', 'Lab Scientist', 'Cashier', 'Radiographer', 'Administrator'];
const SHIFTS = ['Morning', 'Afternoon', 'Night', 'Off'];

export default function StaffManagement() {
  const toast = useToast();
  const [staff, setStaff] = useState<Staff[]>(DEMO_STAFF);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', role: 'Nurse', department: 'Emergency', phone: '', licenseNo: '' });
  const [viewMode, setViewMode] = useState<'list' | 'schedule'>('list');

  const filtered = staff.filter((s) => {
    if (deptFilter !== 'All' && s.department !== deptFilter) return false;
    if (search && !s.fullName.toLowerCase().includes(search.toLowerCase()) && !s.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function addStaff() {
    if (!form.fullName || !form.email) {
      toast('Name and email are required', 'error');
      return;
    }
    const newStaff: Staff = {
      id: String(Date.now()),
      ...form,
      status: 'ACTIVE',
      shift: 'Morning',
      joinedAt: new Date().toISOString().slice(0, 10),
    };
    setStaff([newStaff, ...staff]);
    setForm({ fullName: '', email: '', role: 'Nurse', department: 'Emergency', phone: '', licenseNo: '' });
    setShowAdd(false);
    toast(`${form.fullName} added to staff`, 'success');
  }

  function updateShift(id: string, shift: Staff['shift']) {
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, shift } : s)));
    toast('Shift updated', 'success');
  }

  function updateStatus(id: string, status: Staff['status']) {
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    toast('Status updated', 'success');
  }

  const shiftBadge: Record<string, string> = {
    Morning: 'bg-blue-100 text-blue-700',
    Afternoon: 'bg-orange-100 text-orange-700',
    Night: 'bg-purple-100 text-purple-700',
    Off: 'bg-slate-100 text-slate-500',
  };

  const stats = {
    total: staff.length,
    active: staff.filter((s) => s.status === 'ACTIVE').length,
    onLeave: staff.filter((s) => s.status === 'ON_LEAVE').length,
    inactive: staff.filter((s) => s.status === 'INACTIVE').length,
    doctors: staff.filter((s) => s.role === 'Doctor').length,
    nurses: staff.filter((s) => s.role === 'Nurse').length,
  };

  return (
    <div>
      <PageHeader
        title="Staff Management"
        subtitle={`${stats.active} active staff across ${DEPARTMENTS.length - 1} departments`}
        action={
          <div className="flex gap-2">
            <Button variant={viewMode === 'list' ? 'navy' : 'outline'} onClick={() => setViewMode('list')}>📋 List</Button>
            <Button variant={viewMode === 'schedule' ? 'navy' : 'outline'} onClick={() => setViewMode('schedule')}>📅 Schedule</Button>
            <Button variant="green" onClick={() => setShowAdd(!showAdd)}>+ Add Staff</Button>
          </div>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card><p className="text-xs font-bold text-slate-400">Total Staff</p><p className="text-2xl font-bold text-slate-800">{stats.total}</p></Card>
        <Card><p className="text-xs font-bold text-slate-400">Active</p><p className="text-2xl font-bold text-green-600">{stats.active}</p></Card>
        <Card><p className="text-xs font-bold text-slate-400">On Leave</p><p className="text-2xl font-bold text-amber-600">{stats.onLeave}</p></Card>
        <Card><p className="text-xs font-bold text-slate-400">Doctors</p><p className="text-2xl font-bold text-blue-600">{stats.doctors}</p></Card>
        <Card><p className="text-xs font-bold text-slate-400">Nurses</p><p className="text-2xl font-bold text-pink-600">{stats.nurses}</p></Card>
      </div>

      {showAdd && (
        <Card title="Add New Staff" className="mb-5 border-green-200 bg-green-50">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full Name"><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Dr. John Mensah" /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@hospital.gov.gh" /></Field>
            <Field label="Role">
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </Select>
            </Field>
            <Field label="Department">
              <Select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                {DEPARTMENTS.filter((d) => d !== 'All').map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
            </Field>
            <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+233..." /></Field>
            <Field label="License No. (optional)"><Input value={form.licenseNo} onChange={(e) => setForm({ ...form, licenseNo: e.target.value })} placeholder="GMC-2024-XXX" /></Field>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button variant="green" onClick={() => void addStaff()}>Add Staff Member</Button>
          </div>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
        <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="w-48">
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </Select>
      </div>

      {viewMode === 'list' ? (
        <Card pad={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Staff Member</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">Shift</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-800">{s.fullName}</p>
                      <p className="text-xs text-slate-400">{s.email}</p>
                      {s.licenseNo && <p className="text-[10px] text-slate-300">{s.licenseNo}</p>}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">{s.role}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{s.department}</td>
                    <td className="px-5 py-3">
                      <Select value={s.shift} onChange={(e) => updateShift(s.id, e.target.value as Staff['shift'])} className="py-1 text-xs">
                        {SHIFTS.map((sh) => <option key={sh} value={sh}>{sh}</option>)}
                      </Select>
                    </td>
                    <td className="px-5 py-3">
                      <Select value={s.status} onChange={(e) => updateStatus(s.id, e.target.value as Staff['status'])} className="py-1 text-xs">
                        <option value="ACTIVE">Active</option>
                        <option value="ON_LEAVE">On Leave</option>
                        <option value="INACTIVE">Inactive</option>
                      </Select>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">{s.phone}</td>
                    <td className="px-5 py-3 text-xs text-slate-400">{s.joinedAt}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => {}} className="text-xs font-bold text-blue-600 hover:underline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card title="Weekly Shift Schedule">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
                  <th className="px-3 py-2">Staff</th>
                  <th className="px-3 py-2 text-center">Mon</th>
                  <th className="px-3 py-2 text-center">Tue</th>
                  <th className="px-3 py-2 text-center">Wed</th>
                  <th className="px-3 py-2 text-center">Thu</th>
                  <th className="px-3 py-2 text-center">Fri</th>
                  <th className="px-3 py-2 text-center">Sat</th>
                  <th className="px-3 py-2 text-center">Sun</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.filter((s) => s.status === 'ACTIVE').map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <p className="font-semibold text-slate-800 text-xs">{s.fullName}</p>
                      <p className="text-[10px] text-slate-400">{s.role}</p>
                    </td>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                      <td key={day} className="px-3 py-2 text-center">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${shiftBadge[s.shift]}`}>
                          {s.shift === 'Off' ? '—' : s.shift.slice(0, 3)}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
