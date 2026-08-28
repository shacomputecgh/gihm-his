import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface AdvanceDirective {
  id: string; patientName: string; type: string;
  dateCreated: string; status: 'Active' | 'Revoked' | 'Expired';
  proxy?: string; proxyContact?: string;
  wishes: string[];
}

const DIRECTIVES: AdvanceDirective[] = [
  { id: 'AD-001', patientName: 'Kwadwo Mensah', type: 'Living Will + DNR', dateCreated: '2026-01-15', status: 'Active', proxy: 'Abena Mensah (Daughter)', proxyContact: '+233241234567', wishes: ['No CPR', 'No mechanical ventilation', 'Palliative care preferred', 'Comfort measures only'] },
  { id: 'AD-002', patientName: 'Akua Boateng', type: 'Healthcare Proxy', dateCreated: '2025-06-20', status: 'Active', proxy: 'Yaw Boateng (Husband)', proxyContact: '+233209876543', wishes: ['Full resuscitation', 'Organ donation consent', 'Blood transfusion consent'] },
  { id: 'AD-003', patientName: 'Nana Osei', type: 'DNR Order', dateCreated: '2026-08-10', status: 'Active', proxy: 'Kofi Osei (Son)', proxyContact: '+233261234567', wishes: ['No CPR', 'Comfort care only'] },
  { id: 'AD-004', patientName: 'Efua Nyarko', type: 'Living Will', dateCreated: '2024-03-01', status: 'Expired', proxy: 'Ama Nyarko (Daughter)', proxyContact: '+233249876543', wishes: ['No life support', 'Palliative care'] },
];

const TYPE_COLORS: Record<string, string> = { 'Living Will': 'bg-blue-100 text-blue-800', 'DNR Order': 'bg-red-100 text-red-800', 'Living Will + DNR': 'bg-purple-100 text-purple-800', 'Healthcare Proxy': 'bg-green-100 text-green-800' };
const STATUS_COLORS: Record<string, string> = { Active: 'bg-green-100 text-green-800', Revoked: 'bg-yellow-100 text-yellow-800', Expired: 'bg-gray-100 text-gray-800' };

export default function AdvanceDirectives() {
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
          title="Add New Advance Directive"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Advance Directives & Living Wills</h1><p className="text-gray-500">Advance directive management, healthcare proxy, DNR orders, and end-of-life care preferences</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Active', value: DIRECTIVES.filter(d => d.status === 'Active').length, color: 'text-green-600' }, { label: 'DNR Orders', value: DIRECTIVES.filter(d => d.type.includes('DNR')).length, color: 'text-red-600' }, { label: 'Healthcare Proxies', value: DIRECTIVES.filter(d => d.proxy).length, color: 'text-blue-600' }, { label: 'Total', value: DIRECTIVES.length, color: 'text-purple-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="space-y-4">
        {DIRECTIVES.map(d => (
          <div key={d.id} className="bg-white rounded-lg border p-5">
            <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><span className="font-mono text-xs text-gray-500">{d.id}</span><span className="font-bold">{d.patientName}</span><Badge className={TYPE_COLORS[d.type]}>{d.type}</Badge></div><Badge className={STATUS_COLORS[d.status]}>{d.status}</Badge></div>
            {d.proxy && <div className="grid grid-cols-2 gap-3 text-sm mb-3"><div className="bg-gray-50 rounded p-2"><span className="text-gray-500">Healthcare Proxy:</span> <span className="font-medium">{d.proxy}</span></div><div className="bg-gray-50 rounded p-2"><span className="text-gray-500">Contact:</span> {d.proxyContact}</div></div>}
            <div><h4 className="font-semibold text-sm mb-2">Patient Wishes</h4><div className="flex flex-wrap gap-2">{d.wishes.map((w, i) => <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">{w}</span>)}</div></div>
            <div className="text-xs text-gray-500 mt-2">Created: {d.dateCreated}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
