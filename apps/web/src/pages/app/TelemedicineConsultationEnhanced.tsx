import { useState } from 'react';
import { Badge } from '../../components/ui';

interface Teleconsult {
  id: string; patientName: string; doctor: string; specialty: string;
  scheduledTime: string; duration: string;
  status: 'Scheduled' | 'Waiting' | 'In Progress' | 'Completed' | 'Cancelled';
  reason: string; type: string;
  prescription?: string; followUp?: string;
}

const TELECONSULTS: Teleconsult[] = [
  { id: 'TC-001', patientName: 'Kwame Asante', doctor: 'Dr. Sarah Johnson', specialty: 'Cardiology', scheduledTime: '09:00', duration: '30 min', status: 'In Progress', reason: 'Post-MI follow-up — medication review', type: 'Follow-up', prescription: 'Aspirin 75mg OD, Atorvastatin 40mg ON, Bisoprolol 5mg OD', followUp: 'Review in 2 weeks' },
  { id: 'TC-002', patientName: 'Akua Mensah', doctor: 'Dr. Kofi Appiah', specialty: 'Dermatology', scheduledTime: '09:30', duration: '15 min', status: 'Waiting', reason: 'Psoriasis treatment response assessment', type: 'Follow-up' },
  { id: 'TC-003', patientName: 'Nana Osei', doctor: 'Dr. Sarah Johnson', specialty: 'Endocrinology', scheduledTime: '10:00', duration: '20 min', status: 'Scheduled', reason: 'Diabetes management — HbA1c review', type: 'Consultation' },
  { id: 'TC-004', patientName: 'Efua Nyarko', doctor: 'Dr. Ama Darko', specialty: 'Psychiatry', scheduledTime: '10:30', duration: '45 min', status: 'Completed', reason: 'Depression — medication adjustment', type: 'Follow-up', prescription: 'Sertraline 100mg OD, continue therapy', followUp: 'Review in 4 weeks' },
  { id: 'TC-005', patientName: 'Yaw Boateng', doctor: 'Dr. Kofi Appiah', specialty: 'General Practice', scheduledTime: '11:00', duration: '15 min', status: 'Completed', reason: 'Hypertension review', type: 'Follow-up', prescription: 'Amlodipine 5mg OD, lifestyle advice', followUp: 'BP check in 1 month' },
];

const STATUS_COLORS: Record<string, string> = { Scheduled: 'bg-blue-100 text-blue-800', Waiting: 'bg-yellow-100 text-yellow-800', 'In Progress': 'bg-green-100 text-green-800', Completed: 'bg-gray-100 text-gray-800', Cancelled: 'bg-red-100 text-red-800' };

export default function TelemedicineConsultationEnhanced() {
  const [selected, setSelected] = useState<Teleconsult | null>(TELECONSULTS[0] ?? null);

  const [showAdd, setShowAdd] = useState(false);
  const [records, setRecords] = useState<Teleconsult[]>(TELECONSULTS);
  const [addForm, setAddForm] = useState<Partial<Record<string, any>>>({patientName: '',
    doctor: '',
    specialty: '',
    scheduledTime: '',
    duration: '',
    status: 'Scheduled',
    reason: '',
    type: ''});
  const handleAdd = () => {
    const newRecord = { ...addForm, id: 'TE-' + String(records.length + 1).padStart(3, '0') } as Teleconsult;
    setRecords([newRecord, ...records]);
    setShowAdd(false);
    setAddForm({});
  };  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Telemedicine Consultation</h1><p className="text-gray-500">Video consultations, e-prescriptions, follow-up scheduling, and remote patient monitoring</p></div>
      <div className="flex justify-end">
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">
          {showAdd ? '\u2715 Cancel' : '+ Add New'}
        </button>
      </div>
      {showAdd && (
        <div className="bg-white rounded-lg border-2 border-green-200 p-5 space-y-4 shadow-lg">
          <h3 className="font-bold text-green-800 text-lg">Add New Record</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Patient Name</label>
              <input type="text" value={addForm.patientName as string} onChange={e => setAddForm({...addForm, patientName: e.target.value} as any)} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Doctor</label>
              <input type="text" value={addForm.doctor as string} onChange={e => setAddForm({...addForm, doctor: e.target.value} as any)} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Specialty</label>
              <input type="text" value={addForm.specialty as string} onChange={e => setAddForm({...addForm, specialty: e.target.value} as any)} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Scheduled Time</label>
              <input type="text" value={addForm.scheduledTime as string} onChange={e => setAddForm({...addForm, scheduledTime: e.target.value} as any)} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Duration</label>
              <input type="text" value={addForm.duration as string} onChange={e => setAddForm({...addForm, duration: e.target.value} as any)} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={addForm.status as string} onChange={e => setAddForm({...addForm, status: e.target.value} as any)} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="Scheduled">Scheduled</option>
                <option value="Waiting">Waiting</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Reason</label>
              <input type="text" value={addForm.reason as string} onChange={e => setAddForm({...addForm, reason: e.target.value} as any)} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <input type="text" value={addForm.type as string} onChange={e => setAddForm({...addForm, type: e.target.value} as any)} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleAdd} className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 shadow">Save Record</button>
            <button onClick={() => setShowAdd(false)} className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">Cancel</button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Today\'s Consults', value: records.length, color: 'text-blue-600' }, { label: 'In Progress', value: records.filter(c => c.status === 'In Progress').length, color: 'text-green-600' }, { label: 'Waiting', value: records.filter(c => c.status === 'Waiting').length, color: 'text-yellow-600' }, { label: 'Completed', value: records.filter(c => c.status === 'Completed').length, color: 'text-gray-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {records.map(c => (
            <div key={c.id} onClick={() => setSelected(c)} className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${selected?.id === c.id ? 'ring-2 ring-blue-500' : ''}`}>
              <div className="flex items-center justify-between mb-1"><span className="font-semibold text-sm">{c.patientName}</span><Badge className={STATUS_COLORS[c.status]}>{c.status}</Badge></div>
              <div className="text-xs text-gray-500"><div>{c.specialty} — {c.doctor}</div><div>{c.scheduledTime} • {c.duration}</div></div>
            </div>
          ))}
        </div>
        {selected && (
          <div className="lg:col-span-2 bg-white rounded-lg border p-5 space-y-4 h-fit sticky top-4">
            <div className="flex items-center justify-between"><div><h3 className="text-lg font-bold">{selected.patientName}</h3><p className="text-sm text-gray-500">{selected.specialty} — {selected.doctor}</p></div><Badge className={STATUS_COLORS[selected.status]}>{selected.status}</Badge></div>
            <div className="bg-blue-50 border border-blue-200 rounded p-3"><div className="text-xs text-blue-600 font-semibold mb-1">Reason</div><div className="text-sm">{selected.reason}</div></div>
            {selected.prescription && <div className="bg-green-50 border border-green-200 rounded p-3"><div className="text-xs text-green-600 font-semibold mb-1">💊 E-Prescription</div><div className="text-sm">{selected.prescription}</div></div>}
            {selected.followUp && <div className="bg-yellow-50 border border-yellow-200 rounded p-3"><div className="text-xs text-yellow-600 font-semibold mb-1">📅 Follow-up</div><div className="text-sm">{selected.followUp}</div></div>}
            <div className="flex gap-2">
              <button onClick={() => {}} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Start Video Call</button>
              <button onClick={() => {}} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Send E-Prescription</button>
              <button onClick={() => {}} className="border px-4 py-2 rounded-lg text-sm font-medium">Schedule Follow-up</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
