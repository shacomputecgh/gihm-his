import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface PorteringRequest {
  id: string; patientName: string; fromLocation: string; toLocation: string;
  transportType: string; wheelchairRequired: boolean; escortRequired: boolean;
  requestedBy: string; requestedAt: string; status: 'Requested' | 'Assigned' | 'In Transit' | 'Completed' | 'Cancelled';
  porter?: string; completedAt?: string; notes: string;
}

const REQUESTS: PorteringRequest[] = [
  { id: 'PR-001', patientName: 'Kwame Asante', fromLocation: 'Ward C12 (Cardiology)', toLocation: 'Radiology (CT Scan)', transportType: 'Wheelchair', wheelchairRequired: true, escortRequired: false, requestedBy: 'Dr. Appiah', requestedAt: '08:30', status: 'In Transit', porter: 'Kofi (Porter Team A)', notes: 'Patient cannot walk unaided. Oxygen not required.' },
  { id: 'PR-002', patientName: 'Akua Mensah', fromLocation: 'Maternity (M05)', toLocation: 'Theatre 2 (Caesarean)', transportType: 'Stretcher', wheelchairRequired: false, escortRequired: true, requestedBy: 'Midwife Grace', requestedAt: '09:00', status: 'Assigned', porter: 'Nana (Porter Team B)', notes: 'Emergency C-section. Time-critical. Midwife escort.' },
  { id: 'PR-003', patientName: 'Yaw Boateng', fromLocation: 'ICU (ICU-03)', toLocation: 'Ward S08 (Surgery)', transportType: 'Stretcher', wheelchairRequired: false, escortRequired: true, requestedBy: 'Dr. Sarah Johnson', requestedAt: '07:45', status: 'Completed', porter: 'Ama (Porter Team A)', completedAt: '08:15', notes: 'Post-op transfer. Nurse escort. Monitoring equipment.' },
  { id: 'PR-004', patientName: 'Efua Nyarko', fromLocation: 'Ward N03 (Nephrology)', toLocation: 'Dialysis Unit', transportType: 'Wheelchair', wheelchairRequired: true, escortRequired: false, requestedBy: 'Nurse Abena', requestedAt: '10:00', status: 'Requested', notes: 'Regular dialysis patient. Can self-transfer with assistance.' },
  { id: 'PR-005', patientName: 'Nana Agyeman', fromLocation: 'Emergency (Trauma Bay)', toLocation: 'Ward P07 (Paediatrics)', transportType: 'Bed', wheelchairRequired: false, escortRequired: true, requestedBy: 'Dr. Kofi Darko', requestedAt: '09:30', status: 'Requested', notes: 'Paediatric patient on IV. Needs nurse escort.' },
];

const TYPE_COLORS: Record<string, string> = { Wheelchair: 'bg-blue-100 text-blue-800', Stretcher: 'bg-yellow-100 text-yellow-800', Bed: 'bg-orange-100 text-orange-800', Walking: 'bg-green-100 text-green-800' };
const STATUS_COLORS: Record<string, string> = { Requested: 'bg-gray-100 text-gray-800', Assigned: 'bg-blue-100 text-blue-800', 'In Transit': 'bg-yellow-100 text-yellow-800', Completed: 'bg-green-100 text-green-800', Cancelled: 'bg-red-100 text-red-800' };

const PORTERS = [
  { name: 'Kofi', team: 'Team A', status: 'Busy', currentTask: 'PR-001', todayCount: 5 },
  { name: 'Nana', team: 'Team B', status: 'Busy', currentTask: 'PR-002', todayCount: 3 },
  { name: 'Ama', team: 'Team A', status: 'Available', currentTask: '', todayCount: 4 },
  { name: 'Yaw', team: 'Team C', status: 'Available', currentTask: '', todayCount: 2 },
  { name: 'Kwaku', team: 'Team B', status: 'On Break', currentTask: '', todayCount: 3 },
];

export default function PorteringTransport() {
  const [tab, setTab] = useState<'requests' | 'porters' | 'stats'>('requests');
  const activeTransports = REQUESTS.filter(r => r.status === 'In Transit' || r.status === 'Assigned').length;

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
          title="Add New Transport Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Portering & Patient Transport</h1><p className="text-gray-500">Internal patient movement, porter dispatch, equipment transport, and bed management</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Total Requests', value: REQUESTS.length, color: 'text-blue-600' }, { label: 'Active Transports', value: activeTransports, color: 'text-yellow-600' }, { label: 'Available Porters', value: PORTERS.filter(p => p.status === 'Available').length, color: 'text-green-600' }, { label: 'Completed Today', value: REQUESTS.filter(r => r.status === 'Completed').length, color: 'text-purple-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="flex gap-2">
        {(['requests', 'porters', 'stats'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>{t === 'requests' ? 'Transport Requests' : t === 'porters' ? 'Porter Roster' : 'Statistics'}</button>
        ))}
      </div>

      {tab === 'requests' && (
        <div className="space-y-3">
          {REQUESTS.map(r => (
            <div key={r.id} className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2"><span className="font-mono text-xs text-gray-500">{r.id}</span><span className="font-semibold">{r.patientName}</span><Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge></div>
                <div className="flex gap-2"><Badge className={TYPE_COLORS[r.transportType]}>{r.transportType}</Badge>{r.wheelchairRequired && <Badge className="bg-blue-100 text-blue-800">♿ Wheelchair</Badge>}{r.escortRequired && <Badge className="bg-red-100 text-red-800">🚑 Escort</Badge>}</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div><span className="text-gray-500">From:</span> <span className="font-medium">{r.fromLocation}</span></div>
                <div><span className="text-gray-500">To:</span> <span className="font-medium">{r.toLocation}</span></div>
                <div><span className="text-gray-500">Requested by:</span> <span>{r.requestedBy}</span></div>
                <div><span className="text-gray-500">Time:</span> <span>{r.requestedAt}</span></div>
              </div>
              {r.porter && <div className="mt-2 text-sm"><span className="text-gray-500">Porter:</span> <span className="font-medium">{r.porter}</span></div>}
              <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded p-2">{r.notes}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'porters' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PORTERS.map(p => (
            <div key={p.name} className={`bg-white rounded-lg border p-4 ${p.status === 'Busy' ? 'border-yellow-300' : p.status === 'Available' ? 'border-green-300' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">{p.name}</span>
                <Badge className={p.status === 'Available' ? 'bg-green-100 text-green-800' : p.status === 'Busy' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}>{p.status}</Badge>
              </div>
              <div className="text-sm space-y-1">
                <div><span className="text-gray-500">Team:</span> {p.team}</div>
                <div><span className="text-gray-500">Today's transports:</span> <span className="font-bold">{p.todayCount}</span></div>
                {p.currentTask && <div><span className="text-gray-500">Current task:</span> <span className="font-mono text-xs">{p.currentTask}</span></div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3">By Status</h3>
            {Object.keys(STATUS_COLORS).map(s => <div key={s} className="flex items-center justify-between py-2 border-b last:border-0"><Badge className={STATUS_COLORS[s]}>{s}</Badge><span className="font-bold">{REQUESTS.filter(r => r.status === s).length}</span></div>)}
          </div>
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3">By Transport Type</h3>
            {Object.keys(TYPE_COLORS).map(t => <div key={t} className="flex items-center justify-between py-2 border-b last:border-0"><Badge className={TYPE_COLORS[t]}>{t}</Badge><span className="font-bold">{REQUESTS.filter(r => r.transportType === t).length}</span></div>)}
          </div>
        </div>
      )}
    </div>
  );
}
