import { useState } from 'react';
import { Badge } from '../../components/ui';

interface TradMed { id: string; patientName: string; herbalMedicine: string; condition: string; practitioner: string; dateStarted: string; status: 'Active' | 'Completed' | 'Discontinued'; interactions: string[]; notes: string; }

const MEDICINES: TradMed[] = [
  { id: 'TM-001', patientName: 'Kwame Asante', herbalMedicine: 'Sutherlandia (Cancer Bush)', condition: 'Immune support', practitioner: 'Traditional Healer Nana Kofi', dateStarted: '2026-08-01', status: 'Active', interactions: ['Warfarin — may increase bleeding risk'], notes: 'Patient using alongside conventional HIV treatment. Monitoring drug interactions.' },
  { id: 'TM-002', patientName: 'Akua Mensah', herbalMedicine: 'Moringa Leaf Extract', condition: 'Nutritional supplement', practitioner: 'Community Health Worker', dateStarted: '2026-08-10', status: 'Active', interactions: [], notes: 'Safe to use. Patient reports improved energy levels.' },
  { id: 'TM-003', patientName: 'Nana Osei', herbalMedicine: 'Bitter Leaf (Vernonia)', condition: 'Malaria prevention', practitioner: 'Traditional Healer Nana Ama', dateStarted: '2026-07-15', status: 'Completed', interactions: ['Antimalarials — reduced absorption'], notes: 'Completed 2-week course. Advised to complete conventional treatment.' },
  { id: 'TM-004', patientName: 'Efua Nyarko', herbalMedicine: 'Baobab Fruit Pulp', condition: 'Digestive health', practitioner: 'Self-administered', dateStarted: '2026-08-20', status: 'Active', interactions: [], notes: 'Safe. Rich in vitamin C and prebiotic fibre.' },
];

const STATUS_COLORS: Record<string, string> = { Active: 'bg-green-100 text-green-800', Completed: 'bg-blue-100 text-blue-800', Discontinued: 'bg-red-100 text-red-800' };

export default function TraditionalMedicineIntegration() {
  const [medicines] = useState<TradMed[]>(MEDICINES);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Traditional Medicine Integration</h1><p className="text-gray-500">Track traditional/herbal medicine use, drug interactions, and integration with conventional care</p></div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">{showForm ? '✕ Cancel' : '+ Record Usage'}</button>
      </div>
      {showForm && (
        <div className="bg-white rounded-lg border-2 border-green-200 p-5 space-y-3 shadow-lg">
          <h3 className="font-bold text-green-800 text-lg">Record Traditional Medicine Usage</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Patient Name *</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Herbal Medicine *</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Moringa, Sutherlandia" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Condition Being Treated *</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Practitioner</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Traditional healer name" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Date Started</label><input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Known Interactions with Conventional Medicines</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Warfarin — may increase bleeding risk" /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Clinical Notes</label><textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} /></div>
          <div className="flex gap-2"><button className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 shadow">Save Record</button><button onClick={() => setShowForm(false)} className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">Cancel</button></div>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-slate-700">{medicines.length}</div><div className="text-xs text-slate-500">Total Records</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-green-600">{medicines.filter((m) => m.status === 'Active').length}</div><div className="text-xs text-slate-500">Active Use</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-red-600">{medicines.filter((m) => m.interactions.length > 0).length}</div><div className="text-xs text-slate-500">With Interactions</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-blue-600">{medicines.filter((m) => m.status === 'Completed').length}</div><div className="text-xs text-slate-500">Completed</div></div>
      </div>
      <div className="space-y-3">
        {medicines.map((m) => (
          <div key={m.id} className={`bg-white rounded-lg border p-4 hover:shadow-md transition ${m.interactions.length > 0 ? 'border-l-4 border-l-red-500' : ''}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2"><span className="font-mono text-xs text-slate-400">{m.id}</span><span className="font-semibold">{m.herbalMedicine}</span></div>
              <Badge className={STATUS_COLORS[m.status]}>{m.status}</Badge>
            </div>
            <div className="text-sm text-slate-600">Patient: {m.patientName} · Condition: {m.condition}</div>
            <div className="text-xs text-slate-400 mt-1">Practitioner: {m.practitioner} · Started: {m.dateStarted}</div>
            {m.interactions.length > 0 && (
              <div className="mt-2 bg-red-50 border border-red-200 rounded p-2">
                <div className="text-xs text-red-600 font-semibold">⚠️ Drug Interactions</div>
                {m.interactions.map((i, idx) => <div key={idx} className="text-xs text-red-700 mt-0.5">• {i}</div>)}
              </div>
            )}
            {m.notes && <div className="text-xs text-slate-500 mt-2 italic">{m.notes}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
