import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface SocialWorkCase {
  id: string; patientName: string; age: number; diagnosis: string;
  issue: string; referralDate: string; socialWorker: string;
  status: 'Active' | 'Closed' | 'Pending';
  interventions: string[];
}

const CASES: SocialWorkCase[] = [
  { id: 'SW-001', patientName: 'Kwame Asante', age: 78, diagnosis: 'Stroke — Hemiplegia', issue: 'Discharge planning — home modifications needed, caregiver support', referralDate: '2026-08-20', socialWorker: 'Esi Darko', status: 'Active', interventions: ['Home assessment arranged', 'Wheelchair application submitted', 'Carer support group referral', 'Meals on wheels application'] },
  { id: 'SW-002', patientName: 'Akua Mensah', age: 35, diagnosis: 'Domestic Violence — Assault', issue: 'Safety planning, shelter referral, legal support', referralDate: '2026-08-22', socialWorker: 'Nana Osei', status: 'Active', interventions: ['Safety plan developed', 'DOVVSU referral made', 'Shelter placement arranged', 'Legal aid application'] },
  { id: 'SW-003', patientName: 'Nana Osei', age: 65, diagnosis: 'Advanced Cancer', issue: 'End-of-life planning, family support, financial assistance', referralDate: '2026-08-15', socialWorker: 'Esi Darko', status: 'Active', interventions: ['Advance directive completed', 'Pension benefits arranged', 'Family counselling sessions', 'Bereavement support prepared'] },
];

export default function SocialWorkServices() {
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
          title="Add New Social Work Record"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","required":true},{"name":"issueType","label":"Issue Type","type":"select","options":["Financial","Housing","Family","Legal","Bereavement","Discharge Planning","Other"]},{"name":"riskLevel","label":"Risk Level","type":"select","options":["Low","Medium","High"]},{"name":"intervention","label":"Intervention","type":"textarea"},{"name":"notes","label":"Notes","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Social Work Services</h1><p className="text-gray-500">Social work referrals, discharge support, financial assistance, and psychosocial support</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Active Cases', value: CASES.filter(c => c.status === 'Active').length, color: 'text-blue-600' }, { label: 'Total Cases', value: CASES.length, color: 'text-green-600' }, { label: 'Social Workers', value: [...new Set(CASES.map(c => c.socialWorker))].length, color: 'text-purple-600' }, { label: 'Interventions', value: CASES.reduce((s, c) => s + c.interventions.length, 0), color: 'text-orange-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>
      <div className="space-y-4">
        {CASES.map(c => (
          <div key={c.id} className="bg-white rounded-lg border p-5">
            <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><span className="font-mono text-xs text-gray-500">{c.id}</span><span className="font-bold">{c.patientName}</span><span className="text-sm text-gray-500">{c.age} years</span></div><Badge className="bg-blue-100 text-blue-800">{c.status}</Badge></div>
            <div className="grid grid-cols-2 gap-2 text-sm mb-2"><div><span className="text-gray-500">Diagnosis:</span> {c.diagnosis}</div><div><span className="text-gray-500">Social Worker:</span> {c.socialWorker}</div></div>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-2"><div className="text-xs text-yellow-600 font-semibold mb-1">Issue</div><div className="text-sm">{c.issue}</div></div>
            <div><h4 className="font-semibold text-sm mb-2">Interventions</h4><div className="flex flex-wrap gap-1">{c.interventions.map((int, i) => <span key={i} className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded">{int}</span>)}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}
