import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface CHW {
  id: string; name: string; zone: string; catchment: number;
  activePatients: number; visitsThisMonth: number;
  status: 'Active' | 'On Leave' | 'Training';
  specialities: string[];
}

const CHWS: CHW[] = [
  { id: 'CHW-001', name: 'Ama Serwaa', zone: 'Nima Zone 1', catchment: 500, activePatients: 45, visitsThisMonth: 120, status: 'Active', specialities: ['Malaria', 'Diabetes', 'Hypertension'] },
  { id: 'CHW-002', name: 'Kofi Mensah', zone: 'Osu Zone 3', catchment: 450, activePatients: 38, visitsThisMonth: 95, status: 'Active', specialities: ['TB DOTS', 'HIV', 'Maternal Health'] },
  { id: 'CHW-003', name: 'Efua Darko', zone: 'Madina Zone 2', catchment: 600, activePatients: 52, visitsThisMonth: 140, status: 'Active', specialities: ['Child Health', 'Nutrition', 'Immunization'] },
  { id: 'CHW-004', name: 'Nana Osei', zone: 'Tema Zone 1', catchment: 380, activePatients: 30, visitsThisMonth: 0, status: 'On Leave', specialities: ['Hypertension', 'Diabetes'] },
  { id: 'CHW-005', name: 'Abena Boateng', zone: 'Accra Central', catchment: 550, activePatients: 48, visitsThisMonth: 110, status: 'Active', specialities: ['Mental Health', 'Substance Abuse', 'HIV'] },
];

const STATUS_COLORS: Record<string, string> = { Active: 'bg-green-100 text-green-800', 'On Leave': 'bg-yellow-100 text-yellow-800', Training: 'bg-blue-100 text-blue-800' };

export default function CommunityHealthWorker() {
  const totalCatchment = CHWS.reduce((s, c) => s + c.catchment, 0);
  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);
  const totalPatients = CHWS.reduce((s, c) => s + c.activePatients, 0);
  const totalVisits = CHWS.reduce((s, c) => s + c.visitsThisMonth, 0);
  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">
          {showAdd ? "u2715 Cancel" : "+ Add New"}
        </button>
      </div>
      {showAdd && (
        <AddNewForm
          title="Add New Community Worker"
          fields={[{"name":"fullName","label":"Full Name","type":"text","required":true},{"name":"community","label":"Community","type":"text","required":true},{"name":"phone","label":"Phone","type":"tel"},{"name":"catchment","label":"Catchment Population","type":"number"},{"name":"training","label":"Training Level","type":"select","options":["Basic","Intermediate","Advanced"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Community Health Workers</h1><p className="text-gray-500">CHW tracking, home visit monitoring, and community outreach management</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Total CHWs', value: CHWS.length, color: 'text-blue-600' }, { label: 'Catchment Pop.', value: totalCatchment.toLocaleString(), color: 'text-green-600' }, { label: 'Active Patients', value: totalPatients, color: 'text-purple-600' }, { label: 'Visits (Month)', value: totalVisits, color: 'text-orange-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>
      <div className="space-y-3">
        {CHWS.map(c => (
          <div key={c.id} className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span className="font-mono text-xs text-gray-500">{c.id}</span><span className="font-bold">{c.name}</span><span className="text-sm text-gray-500">{c.zone}</span></div><Badge className={STATUS_COLORS[c.status]}>{c.status}</Badge></div>
            <div className="grid grid-cols-3 gap-2 text-sm mb-2">
              <div className="bg-gray-50 rounded p-2 text-center"><div className="font-bold">{c.catchment}</div><div className="text-xs text-gray-500">Catchment</div></div>
              <div className="bg-gray-50 rounded p-2 text-center"><div className="font-bold">{c.activePatients}</div><div className="text-xs text-gray-500">Patients</div></div>
              <div className="bg-gray-50 rounded p-2 text-center"><div className="font-bold">{c.visitsThisMonth}</div><div className="text-xs text-gray-500">Visits</div></div>
            </div>
            <div className="flex flex-wrap gap-1">{c.specialities.map((s, i) => <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">{s}</span>)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
