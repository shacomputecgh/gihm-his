import { useState } from 'react';
import { Badge } from '../../components/ui';

interface ContactCase {
  id: string; indexPatient: string; disease: string; dateIdentified: string;
  contacts: { name: string; relationship: string; status: string; lastContact: string; phone: string }[];
  status: 'Active' | 'Completed' | 'Ongoing';
  totalContacts: number; traced: number;
}

const CONTACT_CASES: ContactCase[] = [
  { id: 'CT-001', indexPatient: 'Kwame Asante', disease: 'COVID-19', dateIdentified: '2026-08-20', status: 'Active', totalContacts: 12, traced: 8, contacts: [{ name: 'Akua Mensah', relationship: 'Spouse', status: 'Quarantined', lastContact: '2026-08-19', phone: '+233241234567' }, { name: 'Kofi Osei', relationship: 'Colleague', status: 'Tested - Negative', lastContact: '2026-08-18', phone: '+233209876543' }, { name: 'Esi Darko', relationship: 'Neighbour', status: 'Pending Test', lastContact: '2026-08-17', phone: '+233261234567' }] },
  { id: 'CT-002', indexPatient: 'Nana Agyeman', disease: 'Tuberculosis', dateIdentified: '2026-08-15', status: 'Ongoing', totalContacts: 8, traced: 6, contacts: [{ name: 'Abena Nyarko', relationship: 'Household', status: 'Screened - Latent TB', lastContact: '2026-08-10', phone: '+233249876543' }, { name: 'Yaw Boateng', relationship: 'Co-worker', status: 'Screened - Clear', lastContact: '2026-08-12', phone: '+233201234567' }] },
  { id: 'CT-003', indexPatient: 'Efua Mensah', disease: 'Measles', dateIdentified: '2026-08-22', status: 'Active', totalContacts: 15, traced: 5, contacts: [{ name: 'Kwaku Osei', relationship: 'Classmate', status: 'Vaccinated', lastContact: '2026-08-21', phone: '+233245678901' }, { name: 'Ama Serwaa', relationship: 'Sibling', status: 'Pending Vaccination', lastContact: '2026-08-20', phone: '+233208765432' }] },
];

const STATUS_COLORS: Record<string, string> = { Active: 'bg-red-100 text-red-800', Ongoing: 'bg-yellow-100 text-yellow-800', Completed: 'bg-green-100 text-green-800' };
const CONTACT_STATUS: Record<string, string> = { 'Quarantined': 'bg-orange-100 text-orange-800', 'Tested - Negative': 'bg-green-100 text-green-800', 'Pending Test': 'bg-yellow-100 text-yellow-800', 'Screened - Latent TB': 'bg-orange-100 text-orange-800', 'Screened - Clear': 'bg-green-100 text-green-800', 'Vaccinated': 'bg-blue-100 text-blue-800', 'Pending Vaccination': 'bg-yellow-100 text-yellow-800' };

export default function ContactTracing() {
  const [selected, setSelected] = useState<ContactCase | null>(CONTACT_CASES[0] ?? null);

  const [records, setRecords] = useState<ContactCase[]>(CONTACT_CASES);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ indexPatient: '', disease: '', dateIdentified: '', phone: '', status: 'Active' as ContactCase['status'] });

  const handleAdd = () => {
    const newRecord: ContactCase = {
      id: 'CT-' + String(records.length + 1).padStart(3, '0'),
      indexPatient: addForm.indexPatient,
      disease: addForm.disease,
      dateIdentified: addForm.dateIdentified || new Date().toISOString().slice(0, 10),
      status: addForm.status,
      totalContacts: 0,
      traced: 0,
      contacts: [],
    };
    setRecords([newRecord, ...records]);
    setShowAdd(false);
    setAddForm({ indexPatient: '', disease: '', dateIdentified: '', phone: '', status: 'Active' });
  };  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Contact Tracing</h1><p className="text-gray-500">Infectious disease contact tracing, exposure mapping, and quarantine monitoring</p></div>
      <div className="flex justify-end">
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">
          {showAdd ? '✕ Cancel' : '+ Add New Case'}
        </button>
      </div>
      {showAdd && (
        <div className="bg-white rounded-lg border-2 border-green-200 p-5 space-y-4 shadow-lg">
          <h3 className="font-bold text-green-800 text-lg">Add New Contact Tracing Case</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Index Patient *</label>
              <input type="text" value={addForm.indexPatient} onChange={e => setAddForm({...addForm, indexPatient: e.target.value})} required className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Kwame Asante" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Disease *</label>
              <select value={addForm.disease} onChange={e => setAddForm({...addForm, disease: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value=''>Select disease</option>
                <option>COVID-19</option><option>Tuberculosis</option><option>Measles</option><option>Cholera</option><option>Meningitis</option><option>Hepatitis</option><option>Malaria</option><option>Other</option>
              </select></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={addForm.status} onChange={e => setAddForm({...addForm, status: e.target.value as ContactCase['status']})} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option>Active</option><option>Ongoing</option><option>Completed</option>
              </select></div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleAdd} className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 shadow">Save Case</button>
            <button onClick={() => setShowAdd(false)} className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">Cancel</button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Active Cases', value: records.filter(c => c.status === 'Active').length, color: 'text-red-600' }, { label: 'Total Contacts', value: records.reduce((s, c) => s + c.totalContacts, 0), color: 'text-blue-600' }, { label: 'Traced', value: records.reduce((s, c) => s + c.traced, 0), color: 'text-green-600' }, { label: 'Pending', value: records.reduce((s, c) => s + (c.totalContacts - c.traced), 0), color: 'text-yellow-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {records.map(c => (
            <div key={c.id} onClick={() => setSelected(c)} className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${selected?.id === c.id ? 'ring-2 ring-blue-500' : ''}`}>
              <div className="flex items-center justify-between mb-1"><span className="font-semibold text-sm">{c.indexPatient}</span><Badge className={STATUS_COLORS[c.status]}>{c.status}</Badge></div>
              <div className="text-xs text-gray-500"><div>Disease: <span className="font-medium">{c.disease}</span></div><div>Contacts: {c.traced}/{c.totalContacts} traced</div></div>
            </div>
          ))}
        </div>
        {selected && (
          <div className="lg:col-span-2 bg-white rounded-lg border p-5 space-y-4 h-fit sticky top-4">
            <div className="flex items-center justify-between"><div><h3 className="text-lg font-bold">Index: {selected.indexPatient}</h3><p className="text-sm text-gray-500">{selected.disease} — Identified: {selected.dateIdentified}</p></div><Badge className={STATUS_COLORS[selected.status]}>{selected.status}</Badge></div>
            <div className="w-full bg-gray-200 rounded-full h-3"><div className="bg-green-600 h-3 rounded-full" style={{ width: `${(selected.traced / selected.totalContacts) * 100}%` }} /><span className="text-xs">{selected.traced}/{selected.totalContacts}</span></div>
            <div className="space-y-3">{selected.contacts.map((c, i) => (
              <div key={i} className="border rounded p-3"><div className="flex items-center justify-between mb-1"><span className="font-medium text-sm">{c.name}</span><Badge className={CONTACT_STATUS[c.status] || 'bg-gray-100 text-gray-800'}>{c.status}</Badge></div><div className="text-xs text-gray-500">Relationship: {c.relationship} | Last Contact: {c.lastContact} | {c.phone}</div></div>
            ))}</div>
          </div>
        )}
      </div>
    </div>
  );
}
