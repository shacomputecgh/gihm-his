import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface HousekeepingTask {
  id: string; ward: string; area: string; taskType: string;
  assignedTo: string; scheduledTime: string; status: 'Pending' | 'In Progress' | 'Completed' | 'Inspected';
  priority: 'High' | 'Medium' | 'Low'; lastCompleted: string;
}

interface LaundryOrder {
  id: string; ward: string; type: string; quantity: number;
  status: 'Received' | 'Washing' | 'Ironing' | 'Ready' | 'Dispatched';
  requestedAt: string; readyAt?: string;
}

const TASKS: HousekeepingTask[] = [
  { id: 'HK-001', ward: 'ICU', area: 'ICU Bed 1-6', taskType: 'Deep Clean', assignedTo: 'Team A — Grace', scheduledTime: '06:00', status: 'Completed', priority: 'High', lastCompleted: '2026-08-24 06:45' },
  { id: 'HK-002', ward: 'Surgery', area: 'Theatre 1', taskType: 'Terminal Clean', assignedTo: 'Team B — Esi', scheduledTime: '07:00', status: 'In Progress', priority: 'High', lastCompleted: '2026-08-24 07:15' },
  { id: 'HK-003', ward: 'Maternity', area: 'Labour Ward', taskType: 'Routine Clean', assignedTo: 'Team A — Grace', scheduledTime: '08:00', status: 'Pending', priority: 'Medium', lastCompleted: '2026-08-23 16:00' },
  { id: 'HK-004', ward: 'Paediatrics', area: 'Children Ward', taskType: 'Routine Clean', assignedTo: 'Team C — Ama', scheduledTime: '08:30', status: 'Pending', priority: 'Medium', lastCompleted: '2026-08-23 15:30' },
  { id: 'HK-005', ward: 'Emergency', area: 'Trauma Bay', taskType: 'Biohazard Clean', assignedTo: 'Team B — Esi', scheduledTime: '09:00', status: 'Pending', priority: 'High', lastCompleted: '2026-08-24 03:00' },
  { id: 'HK-006', ward: 'Laboratory', area: 'Sample Reception', taskType: 'Chemical Clean', assignedTo: 'Team D — Nana', scheduledTime: '07:30', status: 'Inspected', priority: 'High', lastCompleted: '2026-08-24 08:00' },
];

const LAUNDRY: LaundryOrder[] = [
  { id: 'LN-001', ward: 'ICU', type: 'Bed Sheets & Pillowcases', quantity: 48, status: 'Ready', requestedAt: '06:00', readyAt: '10:00' },
  { id: 'LN-002', ward: 'Surgery', type: 'Surgical Gowns', quantity: 30, status: 'Washing', requestedAt: '07:00' },
  { id: 'LN-003', ward: 'Maternity', type: 'Patient Gowns', quantity: 25, status: 'Ironing', requestedAt: '06:30' },
  { id: 'LN-004', ward: 'Emergency', type: 'Towels & Blankets', quantity: 40, status: 'Dispatched', requestedAt: '05:00', readyAt: '09:00' },
  { id: 'LN-005', ward: 'Paediatrics', type: 'Children Pyjamas', quantity: 20, status: 'Received', requestedAt: '08:00' },
];

const HK_STATUS: Record<string, string> = { Pending: 'bg-yellow-100 text-yellow-800', 'In Progress': 'bg-blue-100 text-blue-800', Completed: 'bg-green-100 text-green-800', Inspected: 'bg-purple-100 text-purple-800' };
const LN_STATUS: Record<string, string> = { Received: 'bg-gray-100 text-gray-800', Washing: 'bg-blue-100 text-blue-800', Ironing: 'bg-yellow-100 text-yellow-800', Ready: 'bg-green-100 text-green-800', Dispatched: 'bg-purple-100 text-purple-800' };
const PRIORITY_COLORS: Record<string, string> = { High: 'bg-red-100 text-red-800', Medium: 'bg-yellow-100 text-yellow-800', Low: 'bg-green-100 text-green-800' };

export default function LaundryHousekeeping() {
  const [tab, setTab] = useState<'tasks' | 'laundry' | 'stats'>('tasks');

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
          title="Add New Laundry Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Laundry & Housekeeping</h1><p className="text-gray-500">Ward cleaning schedules, linen management, housekeeping task tracking, and quality inspection</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Tasks Today', value: TASKS.length, color: 'text-blue-600' }, { label: 'Completed', value: TASKS.filter(t => t.status === 'Completed' || t.status === 'Inspected').length, color: 'text-green-600' }, { label: 'Pending Tasks', value: TASKS.filter(t => t.status === 'Pending').length, color: 'text-yellow-600' }, { label: 'Laundry Orders', value: LAUNDRY.length, color: 'text-purple-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="flex gap-2">
        {(['tasks', 'laundry', 'stats'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>{t === 'tasks' ? 'Housekeeping Tasks' : t === 'laundry' ? 'Laundry Orders' : 'Statistics'}</button>
        ))}
      </div>

      {tab === 'tasks' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="text-left text-gray-500 text-xs bg-gray-50"><th className="p-3">ID</th><th className="p-3">Ward/Area</th><th className="p-3">Task</th><th className="p-3">Assigned To</th><th className="p-3">Time</th><th className="p-3">Priority</th><th className="p-3">Status</th></tr></thead>
            <tbody>{TASKS.map(t => (
              <tr key={t.id} className="border-t hover:bg-gray-50"><td className="p-3 font-mono text-xs">{t.id}</td><td className="p-3"><div className="font-medium">{t.ward}</div><div className="text-xs text-gray-500">{t.area}</div></td><td className="p-3">{t.taskType}</td><td className="p-3 text-xs">{t.assignedTo}</td><td className="p-3">{t.scheduledTime}</td><td className="p-3"><Badge className={PRIORITY_COLORS[t.priority]}>{t.priority}</Badge></td><td className="p-3"><Badge className={HK_STATUS[t.status]}>{t.status}</Badge></td></tr>
            ))}</tbody></table>
        </div>
      )}

      {tab === 'laundry' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="text-left text-gray-500 text-xs bg-gray-50"><th className="p-3">ID</th><th className="p-3">Ward</th><th className="p-3">Type</th><th className="p-3">Qty</th><th className="p-3">Requested</th><th className="p-3">Ready</th><th className="p-3">Status</th></tr></thead>
            <tbody>{LAUNDRY.map(l => (
              <tr key={l.id} className="border-t hover:bg-gray-50"><td className="p-3 font-mono text-xs">{l.id}</td><td className="p-3 font-medium">{l.ward}</td><td className="p-3">{l.type}</td><td className="p-3 text-center">{l.quantity}</td><td className="p-3 text-xs">{l.requestedAt}</td><td className="p-3 text-xs">{l.readyAt || '—'}</td><td className="p-3"><Badge className={LN_STATUS[l.status]}>{l.status}</Badge></td></tr>
            ))}</tbody></table>
        </div>
      )}

      {tab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3">Task Status</h3>
            {Object.keys(HK_STATUS).map(s => <div key={s} className="flex items-center justify-between py-2 border-b last:border-0"><Badge className={HK_STATUS[s]}>{s}</Badge><span className="font-bold">{TASKS.filter(t => t.status === s).length}</span></div>)}
          </div>
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3">Laundry Workflow</h3>
            {Object.keys(LN_STATUS).map(s => <div key={s} className="flex items-center justify-between py-2 border-b last:border-0"><Badge className={LN_STATUS[s]}>{s}</Badge><span className="font-bold">{LAUNDRY.filter(l => l.status === s).length}</span></div>)}
          </div>
        </div>
      )}
    </div>
  );
}
