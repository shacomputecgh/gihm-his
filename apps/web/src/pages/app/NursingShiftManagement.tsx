import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface Shift {
  id: string; shift: string; time: string; nurse: string;
  ward: string; patients: number; handoverStatus: string;
}

interface HandoverNote {
  ward: string; criticalPatients: number; pendingTasks: string[];
}

const SHIFTS: Shift[] = [
  { id: 'SH-001', shift: 'Morning', time: '07:00 - 15:00', nurse: 'Sr. Ama Mensah', ward: 'ICU', patients: 6, handoverStatus: 'Completed' },
  { id: 'SH-002', shift: 'Morning', time: '07:00 - 15:00', nurse: 'Sr. Kofi Appiah', ward: 'Surgery', patients: 18, handoverStatus: 'Completed' },
  { id: 'SH-003', shift: 'Afternoon', time: '15:00 - 23:00', nurse: 'Sr. Efua Owusu', ward: 'ICU', patients: 6, handoverStatus: 'Pending' },
  { id: 'SH-004', shift: 'Afternoon', time: '15:00 - 23:00', nurse: 'Sr. Abena Darko', ward: 'Medicine', patients: 22, handoverStatus: 'Pending' },
  { id: 'SH-005', shift: 'Night', time: '23:00 - 07:00', nurse: 'Sr. Nana Osei', ward: 'Maternity', patients: 15, handoverStatus: 'Scheduled' },
  { id: 'SH-006', shift: 'Night', time: '23:00 - 07:00', nurse: 'Sr. Grace Amoah', ward: 'Paediatrics', patients: 12, handoverStatus: 'Scheduled' },
];

const HANDOVERS: HandoverNote[] = [
  { ward: 'ICU', criticalPatients: 2, pendingTasks: ['Ventilator weaning review', 'Blood culture results pending', 'Family update needed'] },
  { ward: 'Surgery', criticalPatients: 1, pendingTasks: ['Post-op pain assessment', 'Drain output monitoring', 'DVT prophylaxis due'] },
  { ward: 'Medicine', criticalPatients: 3, pendingTasks: ['IV antibiotic timing', 'Blood transfusion due', 'Diabetic patient BG monitoring'] },
];

const SHIFT_COLORS: Record<string, string> = { Morning: 'bg-yellow-100 text-yellow-800', Afternoon: 'bg-blue-100 text-blue-800', Night: 'bg-purple-100 text-purple-800' };
const STATUS_COLORS: Record<string, string> = { Completed: 'bg-green-100 text-green-800', Pending: 'bg-yellow-100 text-yellow-800', Scheduled: 'bg-blue-100 text-blue-800' };

export default function NursingShiftManagement() {
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
          title="Add New Shift Entry"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Nursing Shift Management</h1><p className="text-gray-500">Nurse scheduling, shift handover, staffing levels, and SBAR documentation</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Total Shifts Today', value: SHIFTS.length, color: 'text-blue-600' }, { label: 'Total Patients', value: SHIFTS.reduce((s, sh) => s + sh.patients, 0), color: 'text-green-600' }, { label: 'Handovers Done', value: SHIFTS.filter(s => s.handoverStatus === 'Completed').length, color: 'text-purple-600' }, { label: 'Critical Patients', value: HANDOVERS.reduce((s, h) => s + h.criticalPatients, 0), color: 'text-red-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="p-4 border-b"><h3 className="font-semibold">Today's Shifts</h3></div>
        <table className="w-full text-sm"><thead><tr className="text-left text-gray-500 text-xs bg-gray-50"><th className="p-3">Shift</th><th className="p-3">Time</th><th className="p-3">Nurse</th><th className="p-3">Ward</th><th className="p-3">Patients</th><th className="p-3">Handover</th></tr></thead>
          <tbody>{SHIFTS.map(s => (
            <tr key={s.id} className="border-t hover:bg-gray-50"><td className="p-3"><Badge className={SHIFT_COLORS[s.shift]}>{s.shift}</Badge></td><td className="p-3 text-xs">{s.time}</td><td className="p-3 font-medium">{s.nurse}</td><td className="p-3">{s.ward}</td><td className="p-3 text-center font-bold">{s.patients}</td><td className="p-3"><Badge className={STATUS_COLORS[s.handoverStatus]}>{s.handoverStatus}</Badge></td></tr>
          ))}</tbody></table>
      </div>

      <div className="bg-white rounded-lg border p-5">
        <h3 className="font-semibold mb-4">Handover Notes (SBAR)</h3>
        <div className="space-y-4">
          {HANDOVERS.map(h => (
            <div key={h.ward} className="border rounded p-4">
              <div className="flex items-center justify-between mb-2"><span className="font-bold">{h.ward}</span><span className="text-sm text-red-600">{h.criticalPatients} critical patient(s)</span></div>
              <div><span className="text-sm font-semibold">Pending Tasks:</span><ul className="list-disc list-inside mt-1 space-y-1">{h.pendingTasks.map((t, i) => <li key={i} className="text-sm text-gray-600">{t}</li>)}</ul></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
