import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface Equipment {
  id: string; name: string; ward: string; type: string;
  status: 'Operational' | 'Maintenance' | 'Out of Service' | 'Available';
  lastMaintenance: string; nextMaintenance: string;
  serialNumber: string;
}

const EQUIPMENT: Equipment[] = [
  { id: 'EQ-001', name: 'Ventilator (Hamilton G5)', ward: 'ICU', type: 'Life Support', status: 'Operational', lastMaintenance: '2026-07-15', nextMaintenance: '2026-10-15', serialNumber: 'VEN-2024-001' },
  { id: 'EQ-002', name: 'Patient Monitor (Philips MX800)', ward: 'ICU', type: 'Monitoring', status: 'Operational', lastMaintenance: '2026-08-01', nextMaintenance: '2026-11-01', serialNumber: 'MON-2023-015' },
  { id: 'EQ-003', name: 'Infusion Pump (B. Braun)', ward: 'Surgery', type: 'Infusion', status: 'Operational', lastMaintenance: '2026-06-20', nextMaintenance: '2026-09-20', serialNumber: 'INF-2024-008' },
  { id: 'EQ-004', name: 'Defibrillator (Lifepak 15)', ward: 'Emergency', type: 'Emergency', status: 'Operational', lastMaintenance: '2026-08-10', nextMaintenance: '2026-11-10', serialNumber: 'DEF-2023-003' },
  { id: 'EQ-005', name: 'Suction Machine', ward: 'Theatre', type: 'Surgical', status: 'Maintenance', lastMaintenance: '2026-08-20', nextMaintenance: '2026-08-25', serialNumber: 'SUC-2022-012' },
  { id: 'EQ-006', name: 'Pulse Oximeter (Masimo)', ward: 'Paediatrics', type: 'Monitoring', status: 'Available', lastMaintenance: '2026-08-15', nextMaintenance: '2026-11-15', serialNumber: 'PUL-2024-005' },
];

const STATUS_COLORS: Record<string, string> = { Operational: 'bg-green-100 text-green-800', Maintenance: 'bg-yellow-100 text-yellow-800', 'Out of Service': 'bg-red-100 text-red-800', Available: 'bg-blue-100 text-blue-800' };

export default function WardEquipmentTracking() {
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
          title="Add New Equipment Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Ward Equipment Tracking</h1><p className="text-gray-500">Equipment inventory by ward, maintenance scheduling, and asset management</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Total Equipment', value: EQUIPMENT.length, color: 'text-blue-600' }, { label: 'Operational', value: EQUIPMENT.filter(e => e.status === 'Operational').length, color: 'text-green-600' }, { label: 'In Maintenance', value: EQUIPMENT.filter(e => e.status === 'Maintenance').length, color: 'text-yellow-600' }, { label: 'Wards', value: [...new Set(EQUIPMENT.map(e => e.ward))].length, color: 'text-purple-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm"><thead><tr className="text-left text-gray-500 text-xs bg-gray-50"><th className="p-3">Equipment</th><th className="p-3">Ward</th><th className="p-3">Type</th><th className="p-3">Serial</th><th className="p-3">Last Service</th><th className="p-3">Next Service</th><th className="p-3">Status</th></tr></thead>
          <tbody>{EQUIPMENT.map(e => (
            <tr key={e.id} className="border-t hover:bg-gray-50"><td className="p-3 font-medium">{e.name}</td><td className="p-3"><Badge className="bg-gray-100 text-gray-800">{e.ward}</Badge></td><td className="p-3 text-xs">{e.type}</td><td className="p-3 font-mono text-xs">{e.serialNumber}</td><td className="p-3 text-xs">{e.lastMaintenance}</td><td className="p-3 text-xs">{e.nextMaintenance}</td><td className="p-3"><Badge className={STATUS_COLORS[e.status]}>{e.status}</Badge></td></tr>
          ))}</tbody></table>
      </div>
    </div>
  );
}
