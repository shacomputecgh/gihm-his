import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface OnCallDoctor {
  id: string; name: string; specialty: string;
  shift: string; date: string; location: string;
  status: 'On Duty' | 'On Call' | 'Off Duty';
  contact: string; pager: string;
}

const ON_CALL: OnCallDoctor[] = [
  { id: 'OC-001', name: 'Dr. Sarah Johnson', specialty: 'Cardiology', shift: 'Day (08:00-17:00)', date: '2026-08-25', location: 'Cardiology Ward', status: 'On Duty', contact: '+233241234567', pager: '1001' },
  { id: 'OC-002', name: 'Dr. Kofi Appiah', specialty: 'Surgery', shift: 'Day (08:00-17:00)', date: '2026-08-25', location: 'Theatre', status: 'On Duty', contact: '+233209876543', pager: '1002' },
  { id: 'OC-003', name: 'Dr. Emmanuel Darko', specialty: 'Emergency Medicine', shift: 'Night (17:00-08:00)', date: '2026-08-25', location: 'Emergency Dept', status: 'On Call', contact: '+233261234567', pager: '1003' },
  { id: 'OC-004', name: 'Dr. Ama Mensah', specialty: 'Paediatrics', shift: 'Night (17:00-08:00)', date: '2026-08-25', location: 'Paediatric Ward', status: 'On Call', contact: '+233249876543', pager: '1004' },
  { id: 'OC-005', name: 'Dr. Nana Osei', specialty: 'Anaesthesia', shift: 'On Call 24h', date: '2026-08-25', location: 'Theatre', status: 'On Call', contact: '+233201234567', pager: '1005' },
  { id: 'OC-006', name: 'Dr. Efua Darko', specialty: 'Internal Medicine', shift: 'Day (08:00-17:00)', date: '2026-08-25', location: 'Medicine Ward', status: 'On Duty', contact: '+233245678901', pager: '1006' },
];

const STATUS_COLORS: Record<string, string> = { 'On Duty': 'bg-green-100 text-green-800', 'On Call': 'bg-yellow-100 text-yellow-800', 'Off Duty': 'bg-gray-100 text-gray-800' };

export default function DoctorOnCallRoster() {
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
          title="Add New Ward"
          fields={[{"name": "wardName", "label": "Ward Name", "type": "text", "placeholder": "e.g. Medical Ward 3", "required": true}, {"name": "wardType", "label": "Ward Type", "type": "select", "options": ["Medical", "Surgical", "Paediatric", "Maternity", "ICU", "NICU", "Emergency", "Psychiatric", "Oncology"]}, {"name": "capacity", "label": "Bed Capacity", "type": "number", "placeholder": "0", "required": true}, {"name": "headNurse", "label": "Head Nurse", "type": "text", "placeholder": "Nurse name"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Doctor On-Call Roster</h1><p className="text-gray-500">Doctor scheduling, on-call management, emergency contact, and pager directory</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'On Duty', value: ON_CALL.filter(d => d.status === 'On Duty').length, color: 'text-green-600' }, { label: 'On Call', value: ON_CALL.filter(d => d.status === 'On Call').length, color: 'text-yellow-600' }, { label: 'Specialties', value: [...new Set(ON_CALL.map(d => d.specialty))].length, color: 'text-blue-600' }, { label: 'Total Doctors', value: ON_CALL.length, color: 'text-purple-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ON_CALL.map(d => (
          <div key={d.id} className={`bg-white rounded-lg border p-4 ${d.status === 'On Duty' ? 'border-green-200' : d.status === 'On Call' ? 'border-yellow-200' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span className="font-bold">{d.name}</span><Badge className="bg-blue-100 text-blue-800">{d.specialty}</Badge></div><Badge className={STATUS_COLORS[d.status]}>{d.status}</Badge></div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">Shift:</span> {d.shift}</div>
              <div><span className="text-gray-500">Location:</span> {d.location}</div>
              <div><span className="text-gray-500">Contact:</span> {d.contact}</div>
              <div><span className="text-gray-500">Pager:</span> <span className="font-bold">{d.pager}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
