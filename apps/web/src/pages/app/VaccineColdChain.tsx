import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface ColdChainUnit {
  id: string; location: string; type: string;
  temperature: number; targetTemp: string;
  status: 'Normal' | 'Warning' | 'Critical' | 'Offline';
  lastChecked: string; vaccine: string; stock: number;
}

const UNITS: ColdChainUnit[] = [
  { id: 'CC-001', location: 'Main Store', type: 'Walk-in Cold Room', temperature: 4.2, targetTemp: '2-8°C', status: 'Normal', lastChecked: '2026-08-24 14:00', vaccine: 'Multiple', stock: 5000 },
  { id: 'CC-002', location: 'OPD Fridge', type: 'Solar Refrigerator', temperature: 5.8, targetTemp: '2-8°C', status: 'Normal', lastChecked: '2026-08-24 14:00', vaccine: 'BCG, OPV, Pentavalent', stock: 1200 },
  { id: 'CC-003', location: 'Maternity Fridge', type: 'Ice-Lined Refrigerator', temperature: 3.1, targetTemp: '2-8°C', status: 'Normal', lastChecked: '2026-08-24 14:00', vaccine: 'Hepatitis B, TT', stock: 800 },
  { id: 'CC-004', location: 'Paediatric Ward', type: 'Vaccine Carrier', temperature: 2.5, targetTemp: '2-8°C', status: 'Warning', lastChecked: '2026-08-24 13:45', vaccine: 'MMR, Yellow Fever', stock: 400 },
  { id: 'CC-005', location: 'Outreach Store', type: 'Cold Box', temperature: 6.5, targetTemp: '2-8°C', status: 'Normal', lastChecked: '2026-08-24 12:00', vaccine: 'Pentavalent, PCV', stock: 600 },
];

const STATUS_COLORS: Record<string, string> = { Normal: 'bg-green-100 text-green-800', Warning: 'bg-yellow-100 text-yellow-800', Critical: 'bg-red-100 text-red-800', Offline: 'bg-gray-100 text-gray-800' };

export default function VaccineColdChain() {
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
          title="Add New Inventory"
          fields={[{"name": "itemName", "label": "Item Name", "type": "text", "placeholder": "e.g. Paracetamol 500mg", "required": true}, {"name": "category", "label": "Category", "type": "select", "options": ["Medicine", "Equipment", "Supplies", "Reagent"]}, {"name": "quantity", "label": "Quantity", "type": "number", "placeholder": "0", "required": true}, {"name": "unit", "label": "Unit", "type": "select", "options": ["Tablets", "Capsules", "Vials", "Bottles", "Boxes", "Packs"]}, {"name": "expiryDate", "label": "Expiry Date", "type": "date"}, {"name": "location", "label": "Storage Location", "type": "text", "placeholder": "e.g. Pharmacy Store A"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Vaccine Cold Chain Monitoring</h1><p className="text-gray-500">Cold chain equipment monitoring, temperature tracking, and vaccine storage management</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Total Units', value: UNITS.length, color: 'text-blue-600' }, { label: 'Normal', value: UNITS.filter(u => u.status === 'Normal').length, color: 'text-green-600' }, { label: 'Warning', value: UNITS.filter(u => u.status === 'Warning').length, color: 'text-yellow-600' }, { label: 'Total Stock', value: UNITS.reduce((s, u) => s + u.stock, 0).toLocaleString(), color: 'text-purple-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>
      <div className="space-y-3">
        {UNITS.map(u => (
          <div key={u.id} className={`bg-white rounded-lg border p-4 ${u.status === 'Warning' ? 'border-yellow-300' : u.status === 'Critical' ? 'border-red-300' : ''}`}>
            <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span className="font-mono text-xs text-gray-500">{u.id}</span><span className="font-bold">{u.location}</span><span className="text-sm text-gray-500">{u.type}</span></div><Badge className={STATUS_COLORS[u.status]}>{u.status}</Badge></div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
              <div className="bg-gray-50 rounded p-2 text-center"><div className={`text-lg font-bold ${u.temperature >= 2 && u.temperature <= 8 ? 'text-green-600' : u.temperature < 2 ? 'text-blue-600' : 'text-red-600'}`}>{u.temperature}°C</div><div className="text-xs text-gray-500">Temperature</div></div>
              <div><span className="text-gray-500">Target:</span> {u.targetTemp}</div>
              <div><span className="text-gray-500">Vaccines:</span> {u.vaccine}</div>
              <div><span className="text-gray-500">Stock:</span> <span className="font-bold">{u.stock.toLocaleString()}</span> doses</div>
              <div><span className="text-gray-500">Last Check:</span> {u.lastChecked}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
