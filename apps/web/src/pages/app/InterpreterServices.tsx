import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface InterpreterRequest {
  id: string; patientName: string; language: string; department: string;
  requestedBy: string; date: string; duration: string;
  status: 'Completed' | 'In Progress' | 'Pending' | 'Cancelled';
  interpreter?: string; type: string;
}

const REQUESTS: InterpreterRequest[] = [
  { id: 'IS-001', patientName: 'Mohammed Alhassan', language: 'Hausa', department: 'Emergency', requestedBy: 'Dr. Sarah Johnson', date: '2026-08-24', duration: '30 min', status: 'Completed', interpreter: 'Ibrahim Mohammed', type: 'In-Person' },
  { id: 'IS-002', patientName: 'Kofi Mensah', language: 'Ewe', department: 'Surgery', requestedBy: 'Nurse Abena', date: '2026-08-24', duration: '45 min', status: 'In Progress', interpreter: 'Korsi Dzidzenu', type: 'Phone' },
  { id: 'IS-003', patientName: 'Adwoa Boateng', language: 'Dagbani', department: 'Maternity', requestedBy: 'Midwife Grace', date: '2026-08-25', duration: '20 min', status: 'Pending', type: 'In-Person' },
  { id: 'IS-004', patientName: 'Aliyu Ibrahim', language: 'Fante', department: 'Paediatrics', requestedBy: 'Dr. Ama Mensah', date: '2026-08-24', duration: '15 min', status: 'Completed', interpreter: 'Ama Fante', type: 'Video' },
];

const LANGUAGES = ['Twi', 'Fante', 'Ewe', 'Ga', 'Hausa', 'Dagbani', 'Grunni', 'English', 'French'];
const STATUS_COLORS: Record<string, string> = { Completed: 'bg-green-100 text-green-800', 'In Progress': 'bg-blue-100 text-blue-800', Pending: 'bg-yellow-100 text-yellow-800', Cancelled: 'bg-gray-100 text-gray-800' };

export default function InterpreterServices() {
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
          title="Add New Interpreter Request"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","required":true},{"name":"language","label":"Language","type":"select","options":["Twi","Ga","Ewe","Hausa","Dagbani","Fante"," Nzema","Mampruli","Other"]},{"name":"department","label":"Department","type":"text"},{"name":"requestor","label":"Requesting Staff","type":"text"},{"name":"reason","label":"Reason","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Interpreter & Language Services</h1><p className="text-gray-500">Language interpreter tracking, multilingual support, and communication assistance</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Total Requests', value: REQUESTS.length, color: 'text-blue-600' }, { label: 'Completed', value: REQUESTS.filter(r => r.status === 'Completed').length, color: 'text-green-600' }, { label: 'Pending', value: REQUESTS.filter(r => r.status === 'Pending').length, color: 'text-yellow-600' }, { label: 'Languages', value: LANGUAGES.length, color: 'text-purple-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="bg-white rounded-lg border p-5 mb-4">
        <h3 className="font-semibold mb-3">Supported Languages</h3>
        <div className="flex flex-wrap gap-2">{LANGUAGES.map(l => <span key={l} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">{l}</span>)}</div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm"><thead><tr className="text-left text-gray-500 text-xs bg-gray-50"><th className="p-3">ID</th><th className="p-3">Patient</th><th className="p-3">Language</th><th className="p-3">Department</th><th className="p-3">Type</th><th className="p-3">Interpreter</th><th className="p-3">Duration</th><th className="p-3">Status</th></tr></thead>
          <tbody>{REQUESTS.map(r => (
            <tr key={r.id} className="border-t hover:bg-gray-50"><td className="p-3 font-mono text-xs">{r.id}</td><td className="p-3 font-medium">{r.patientName}</td><td className="p-3"><Badge className="bg-blue-100 text-blue-800">{r.language}</Badge></td><td className="p-3">{r.department}</td><td className="p-3"><Badge className="bg-gray-100 text-gray-800">{r.type}</Badge></td><td className="p-3 text-xs">{r.interpreter || '—'}</td><td className="p-3">{r.duration}</td><td className="p-3"><Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge></td></tr>
          ))}</tbody></table>
      </div>
    </div>
  );
}
