import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface Volunteer {
  id: string; name: string; age: number; department: string;
  role: string; startDate: string; hoursThisMonth: number;
  status: 'Active' | 'On Leave' | 'Inactive' | 'Training';
  skills: string[]; contact: string;
}

const VOLUNTEERS: Volunteer[] = [
  { id: 'VOL-001', name: 'Ama Serwaa', age: 22, department: 'Paediatrics', role: 'Play Therapy Assistant', startDate: '2026-01-15', hoursThisMonth: 32, status: 'Active', skills: ['Child Care', 'First Aid', 'CPR'], contact: '+233241234567' },
  { id: 'VOL-002', name: 'Kofi Mensah', age: 35, department: 'Emergency', role: 'Patient Escort', startDate: '2025-06-01', hoursThisMonth: 28, status: 'Active', skills: ['Communication', 'Patient Handling', 'Languages (Twi, Ewe)'], contact: '+233209876543' },
  { id: 'VOL-003', name: 'Esi Darko', age: 28, department: 'Community Health', role: 'Health Educator', startDate: '2025-09-15', hoursThisMonth: 0, status: 'On Leave', skills: ['Health Education', 'Counselling', 'Public Speaking'], contact: '+233261234567' },
  { id: 'VOL-004', name: 'Nana Osei', age: 19, department: 'Administrative', role: 'Filing Assistant', startDate: '2026-07-01', hoursThisMonth: 15, status: 'Training', skills: ['Computer Skills', 'Data Entry'], contact: '+233249876543' },
];

const STATUS_COLORS: Record<string, string> = { Active: 'bg-green-100 text-green-800', 'On Leave': 'bg-yellow-100 text-yellow-800', Inactive: 'bg-gray-100 text-gray-800', Training: 'bg-blue-100 text-blue-800' };

export default function VolunteerManagement() {
  const activeCount = VOLUNTEERS.filter(v => v.status === 'Active').length;
  const totalHours = VOLUNTEERS.reduce((s, v) => s + v.hoursThisMonth, 0);

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
          title="Add New Volunteer"
          fields={[{"name":"fullName","label":"Full Name","type":"text","required":true},{"name":"phone","label":"Phone","type":"tel"},{"name":"skills","label":"Skills","type":"text"},{"name":"availability","label":"Availability","type":"select","options":["Full-time","Part-time","Weekends","On Call"]},{"name":"department","label":"Department","type":"text"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Volunteer Management</h1><p className="text-gray-500">Volunteer tracking, shift scheduling, training, and community engagement</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Total Volunteers', value: VOLUNTEERS.length, color: 'text-blue-600' }, { label: 'Active', value: activeCount, color: 'text-green-600' }, { label: 'Hours This Month', value: totalHours, color: 'text-purple-600' }, { label: 'Departments', value: [...new Set(VOLUNTEERS.map(v => v.department))].length, color: 'text-orange-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm"><thead><tr className="text-left text-gray-500 text-xs bg-gray-50"><th className="p-3">Name</th><th className="p-3">Department</th><th className="p-3">Role</th><th className="p-3">Since</th><th className="p-3">Hours/Month</th><th className="p-3">Skills</th><th className="p-3">Status</th></tr></thead>
          <tbody>{VOLUNTEERS.map(v => (
            <tr key={v.id} className="border-t hover:bg-gray-50"><td className="p-3 font-medium">{v.name}</td><td className="p-3">{v.department}</td><td className="p-3 text-xs">{v.role}</td><td className="p-3 text-xs">{v.startDate}</td><td className="p-3 text-center font-bold">{v.hoursThisMonth}</td><td className="p-3"><div className="flex flex-wrap gap-1">{v.skills.map(s => <span key={s} className="bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0.5 rounded">{s}</span>)}</div></td><td className="p-3"><Badge className={STATUS_COLORS[v.status]}>{v.status}</Badge></td></tr>
          ))}</tbody></table>
      </div>
    </div>
  );
}
