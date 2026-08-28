import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface Donor {
  id: string; name: string; type: 'Individual' | 'Corporate' | 'NGO' | 'Government';
  totalDonated: number; lastDonation: string; campaigns: string[];
  status: 'Active' | 'Inactive' | 'Major';
}

const DONORS: Donor[] = [
  { id: 'DON-001', name: 'Vodafone Ghana Foundation', type: 'Corporate', totalDonated: 500000, lastDonation: '2026-06-15', campaigns: ['Paediatric Ward', 'Telemedicine'], status: 'Major' },
  { id: 'DON-002', name: 'World Health Organisation', type: 'NGO', totalDonated: 2500000, lastDonation: '2026-08-01', campaigns: ['Malaria Programme', 'Maternal Health', 'Vaccination'], status: 'Major' },
  { id: 'DON-003', name: 'Dr. Kwame Nkrumah', type: 'Individual', totalDonated: 25000, lastDonation: '2026-07-20', campaigns: ['Scholarship Fund'], status: 'Active' },
  { id: 'DON-004', name: 'UNICEF Ghana', type: 'NGO', totalDonated: 1800000, lastDonation: '2026-05-10', campaigns: ['Child Health', 'Nutrition', 'Water & Sanitation'], status: 'Major' },
  { id: 'DON-005', name: 'Ghana Health Service', type: 'Government', totalDonated: 3000000, lastDonation: '2026-08-15', campaigns: ['Infrastructure', 'Equipment', 'Training'], status: 'Major' },
];

const TYPE_COLORS: Record<string, string> = { Individual: 'bg-blue-100 text-blue-800', Corporate: 'bg-purple-100 text-purple-800', NGO: 'bg-green-100 text-green-800', Government: 'bg-orange-100 text-orange-800' };
const STATUS_COLORS: Record<string, string> = { Active: 'bg-green-100 text-green-800', Inactive: 'bg-gray-100 text-gray-800', Major: 'bg-yellow-100 text-yellow-800' };

export default function DonorRelations() {
  const totalDonations = DONORS.reduce((s, d) => s + d.totalDonated, 0);
  const majorDonors = DONORS.filter(d => d.status === 'Major').length;

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
      <div><h1 className="text-2xl font-bold">Donor Relations & Fundraising</h1><p className="text-gray-500">Donor tracking, campaign management, grant applications, and fundraising events</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Total Donations', value: `GH₵ ${(totalDonations/1000000).toFixed(1)}M`, color: 'text-green-600' }, { label: 'Active Donors', value: DONORS.length, color: 'text-blue-600' }, { label: 'Major Donors', value: majorDonors, color: 'text-yellow-600' }, { label: 'Campaigns', value: [...new Set(DONORS.flatMap(d => d.campaigns))].length, color: 'text-purple-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm"><thead><tr className="text-left text-gray-500 text-xs bg-gray-50"><th className="p-3">Donor</th><th className="p-3">Type</th><th className="p-3">Total Donated</th><th className="p-3">Last Donation</th><th className="p-3">Campaigns</th><th className="p-3">Status</th></tr></thead>
          <tbody>{DONORS.map(d => (
            <tr key={d.id} className="border-t hover:bg-gray-50"><td className="p-3 font-medium">{d.name}</td><td className="p-3"><Badge className={TYPE_COLORS[d.type]}>{d.type}</Badge></td><td className="p-3 font-bold text-green-600">GH₵ {d.totalDonated.toLocaleString()}</td><td className="p-3 text-xs">{d.lastDonation}</td><td className="p-3"><div className="flex flex-wrap gap-1">{d.campaigns.map(c => <span key={c} className="bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0.5 rounded">{c}</span>)}</div></td><td className="p-3"><Badge className={STATUS_COLORS[d.status]}>{d.status}</Badge></td></tr>
          ))}</tbody></table>
      </div>
    </div>
  );
}
