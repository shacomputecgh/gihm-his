import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface LeaveRequest {
  id: string; staffName: string; department: string; role: string;
  leaveType: string; startDate: string; endDate: string; days: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  approvedBy?: string; reason: string;
}

const LEAVE_REQUESTS: LeaveRequest[] = [
  { id: 'LV-001', staffName: 'Ama Mensah', department: 'Nursing', role: 'Senior Nurse', leaveType: 'Annual Leave', startDate: '2026-09-01', endDate: '2026-09-14', days: 14, status: 'Approved', approvedBy: 'Nurse Director', reason: 'Family vacation' },
  { id: 'LV-002', staffName: 'Kofi Appiah', department: 'Surgery', role: 'Consultant', leaveType: 'Study Leave', startDate: '2026-09-15', endDate: '2026-10-15', days: 30, status: 'Pending', reason: 'MSc programme in UK' },
  { id: 'LV-003', staffName: 'Efua Owusu', department: 'Pharmacy', role: 'Pharmacist', leaveType: 'Sick Leave', startDate: '2026-08-22', endDate: '2026-08-24', days: 3, status: 'Approved', approvedBy: 'Head of Pharmacy', reason: 'Malaria' },
  { id: 'LV-004', staffName: 'Nana Osei', department: 'Laboratory', role: 'Lab Scientist', leaveType: 'Annual Leave', startDate: '2026-10-01', endDate: '2026-10-07', days: 7, status: 'Rejected', reason: 'Personal' },
  { id: 'LV-005', staffName: 'Abena Darko', department: 'Maternity', role: 'Midwife', leaveType: 'Maternity Leave', startDate: '2026-09-01', endDate: '2027-01-31', days: 150, status: 'Approved', approvedBy: 'Hospital Administrator', reason: 'Maternity' },
];

const LEAVE_TYPES = [
  { type: 'Annual Leave', daysAllowed: 21, color: 'bg-blue-100 text-blue-800' },
  { type: 'Sick Leave', daysAllowed: 14, color: 'bg-yellow-100 text-yellow-800' },
  { type: 'Maternity Leave', daysAllowed: 90, color: 'bg-pink-100 text-pink-800' },
  { type: 'Paternity Leave', daysAllowed: 7, color: 'bg-green-100 text-green-800' },
  { type: 'Study Leave', daysAllowed: 60, color: 'bg-purple-100 text-purple-800' },
  { type: 'Compassionate Leave', daysAllowed: 5, color: 'bg-orange-100 text-orange-800' },
];

const STATUS_COLORS: Record<string, string> = { Pending: 'bg-yellow-100 text-yellow-800', Approved: 'bg-green-100 text-green-800', Rejected: 'bg-red-100 text-red-800', Cancelled: 'bg-gray-100 text-gray-800' };

export default function StaffLeaveManagement() {
  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);
  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">
          {showAdd ? "\u2715 Cancel" : "+ Add New"}
        </button>
      </div>
      {showAdd && (
        <AddNewForm
          title="Add New Lab"
          fields={[{"name": "patientName", "label": "Patient Name", "type": "text", "placeholder": "Patient name", "required": true}, {"name": "testType", "label": "Test Type", "type": "select", "options": ["Blood Test", "Urine Test", "Stool Test", "X-Ray", "Ultrasound", "ECG", "Biopsy"]}, {"name": "priority", "label": "Priority", "type": "select", "options": ["Routine", "Urgent", "STAT"]}, {"name": "clinicalHistory", "label": "Clinical History", "type": "textarea", "placeholder": "Relevant clinical information"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Staff Leave Management</h1><p className="text-gray-500">Leave applications, approvals, balance tracking, and staff scheduling</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Pending', value: LEAVE_REQUESTS.filter(l => l.status === 'Pending').length, color: 'text-yellow-600' }, { label: 'Approved', value: LEAVE_REQUESTS.filter(l => l.status === 'Approved').length, color: 'text-green-600' }, { label: 'Rejected', value: LEAVE_REQUESTS.filter(l => l.status === 'Rejected').length, color: 'text-red-600' }, { label: 'Total Requests', value: LEAVE_REQUESTS.length, color: 'text-blue-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="bg-white rounded-lg border p-5 mb-4">
        <h3 className="font-semibold mb-3">Leave Types & Entitlements</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {LEAVE_TYPES.map(l => <div key={l.type} className="bg-gray-50 rounded p-3"><Badge className={l.color}>{l.type}</Badge><div className="mt-1 text-sm font-bold">{l.daysAllowed} days/year</div></div>)}
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm"><thead><tr className="text-left text-gray-500 text-xs bg-gray-50"><th className="p-3">ID</th><th className="p-3">Staff</th><th className="p-3">Department</th><th className="p-3">Type</th><th className="p-3">Dates</th><th className="p-3">Days</th><th className="p-3">Reason</th><th className="p-3">Status</th></tr></thead>
          <tbody>{LEAVE_REQUESTS.map(l => (
            <tr key={l.id} className="border-t hover:bg-gray-50"><td className="p-3 font-mono text-xs">{l.id}</td><td className="p-3 font-medium">{l.staffName}</td><td className="p-3 text-xs">{l.department}</td><td className="p-3"><Badge className={LEAVE_TYPES.find(t => t.type === l.leaveType)?.color ?? 'bg-gray-100 text-gray-800'}>{l.leaveType}</Badge></td><td className="p-3 text-xs">{l.startDate} to {l.endDate}</td><td className="p-3 text-center font-bold">{l.days}</td><td className="p-3 text-xs">{l.reason}</td><td className="p-3"><Badge className={STATUS_COLORS[l.status]}>{l.status}</Badge></td></tr>
          ))}</tbody></table>
      </div>
    </div>
  );
}
