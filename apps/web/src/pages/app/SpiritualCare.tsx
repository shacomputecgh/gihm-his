import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface ChaplaincyVisit {
  id: string; patientName: string; ward: string; religion: string;
  requestType: string; date: string;
  status: 'Completed' | 'Scheduled' | 'Ongoing';
  chaplain: string; notes: string;
}

const VISITS: ChaplaincyVisit[] = [
  { id: 'SC-001', patientName: 'Kwame Asante', ward: 'ICU', religion: 'Christianity', requestType: 'End-of-life support', date: '2026-08-24', status: 'Completed', chaplain: 'Rev. Dr. Mensah', notes: 'Family present. Prayers offered. Sacrament administered.' },
  { id: 'SC-002', patientName: 'Mohammed Alhassan', ward: 'Surgery', religion: 'Islam', requestType: 'Pre-surgery prayer', date: '2026-08-25', status: 'Scheduled', chaplain: 'Imam Abdul-Razak', notes: 'Patient requests prayer before tomorrow\'s surgery.' },
  { id: 'SC-003', patientName: 'Akua Asare', ward: 'Maternity', religion: 'Traditional', requestType: 'Naming ceremony blessing', date: '2026-08-24', status: 'Ongoing', chaplain: 'Elder Nana Adu', notes: 'Traditional naming ceremony. Family and elders present.' },
  { id: 'SC-004', patientName: 'Nana Osei', ward: 'Oncology', religion: 'Christianity', requestType: 'Ongoing spiritual support', date: '2026-08-23', status: 'Completed', chaplain: 'Rev. Dr. Mensah', notes: 'Palliative care patient. Weekly visits arranged. Comfort measures.' },
];

const RELIGIONS = ['Christianity', 'Islam', 'Traditional', 'Buddhism', 'Hinduism', 'Judaism', 'No Preference'];

export default function SpiritualCare() {
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
          title="Add New Spiritual Care Record"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","required":true},{"name":"religion","label":"Religion","type":"select","options":["Christianity","Islam","Traditional","None","Other"]},{"name":"denomination","label":"Denomination/Group","type":"text"},{"name":"requestType","label":"Request Type","type":"select","options":["Prayer","Visit","Sacrament","Counseling","Funeral","Other"]},{"name":"notes","label":"Notes","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Spiritual Care & Chaplaincy</h1><p className="text-gray-500">Chaplaincy services, spiritual support, religious accommodation, and cultural sensitivity</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Visits This Week', value: VISITS.length, color: 'text-blue-600' }, { label: 'Completed', value: VISITS.filter(v => v.status === 'Completed').length, color: 'text-green-600' }, { label: 'Religions Served', value: [...new Set(VISITS.map(v => v.religion))].length, color: 'text-purple-600' }, { label: 'Chaplains', value: [...new Set(VISITS.map(v => v.chaplain))].length, color: 'text-orange-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="bg-white rounded-lg border p-5 mb-4">
        <h3 className="font-semibold mb-3">Supported Faiths & Traditions</h3>
        <div className="flex flex-wrap gap-2">{RELIGIONS.map(r => <span key={r} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">{r}</span>)}</div>
      </div>

      <div className="space-y-3">
        {VISITS.map(v => (
          <div key={v.id} className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span className="font-mono text-xs text-gray-500">{v.id}</span><span className="font-bold">{v.patientName}</span><Badge className="bg-gray-100 text-gray-800">{v.religion}</Badge></div><Badge className={v.status === 'Completed' ? 'bg-green-100 text-green-800' : v.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}>{v.status}</Badge></div>
            <div className="grid grid-cols-2 gap-2 text-sm"><div><span className="text-gray-500">Request:</span> {v.requestType}</div><div><span className="text-gray-500">Chaplain:</span> {v.chaplain}</div><div><span className="text-gray-500">Ward:</span> {v.ward}</div><div><span className="text-gray-500">Date:</span> {v.date}</div></div>
            <div className="text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded p-2 mt-2">{v.notes}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
