import { useState } from 'react';
import { Badge } from '../../components/ui';

interface Equipment { id: string; name: string; department: string; model: string; serialNumber: string; status: 'Operational' | 'Under Maintenance' | 'Out of Service'; lastMaintenance: string; nextMaintenance: string; warrantyExpiry: string; }

const EQUIPMENT: Equipment[] = [
  { id: 'EQ-001', name: 'Automated Hematology Analyzer', department: 'Laboratory', model: 'Sysmex XN-1000', serialNumber: 'SXM-2023-001', status: 'Operational', lastMaintenance: '2026-08-01', nextMaintenance: '2026-09-01', warrantyExpiry: '2028-12-31' },
  { id: 'EQ-002', name: 'Chemistry Analyzer', department: 'Laboratory', model: 'Roche Cobas c311', serialNumber: 'RCH-2023-002', status: 'Operational', lastMaintenance: '2026-08-05', nextMaintenance: '2026-09-05', warrantyExpiry: '2029-06-30' },
  { id: 'EQ-003', name: 'Ventilator', department: 'ICU', model: 'Hamilton G5', serialNumber: 'HMG-2024-001', status: 'Operational', lastMaintenance: '2026-07-15', nextMaintenance: '2026-08-15', warrantyExpiry: '2027-12-31' },
  { id: 'EQ-004', name: 'CT Scanner', department: 'Radiology', model: 'Siemens SOMATOM', serialNumber: 'SMS-2022-001', status: 'Under Maintenance', lastMaintenance: '2026-08-20', nextMaintenance: '2026-08-25', warrantyExpiry: '2027-12-31' },
  { id: 'EQ-005', name: 'Defibrillator', department: 'Emergency', model: 'Philips HeartStart', serialNumber: 'PHS-2024-001', status: 'Operational', lastMaintenance: '2026-08-10', nextMaintenance: '2026-09-10', warrantyExpiry: '2028-06-30' },
  { id: 'EQ-006', name: 'Ultrasound Machine', department: 'Radiology', model: 'GE Voluson E10', serialNumber: 'GEV-2023-001', status: 'Operational', lastMaintenance: '2026-07-20', nextMaintenance: '2026-08-20', warrantyExpiry: '2028-12-31' },
];

const STATUS_COLORS: Record<string, string> = { Operational: 'bg-green-100 text-green-800', 'Under Maintenance': 'bg-yellow-100 text-yellow-800', 'Out of Service': 'bg-red-100 text-red-800' };

export default function EquipmentMaintenanceEnhanced() {
  const [equipment] = useState<Equipment[]>(EQUIPMENT);
  const [showForm, setShowForm] = useState(false);

  const overdue = equipment.filter((e) => new Date(e.nextMaintenance) < new Date()).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Equipment Maintenance</h1><p className="text-gray-500">Preventive maintenance schedules, work orders, and equipment lifecycle management</p></div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">{showForm ? '✕ Cancel' : '+ Add Equipment'}</button>
      </div>
      {showForm && (
        <div className="bg-white rounded-lg border-2 border-green-200 p-5 space-y-3 shadow-lg">
          <h3 className="font-bold text-green-800 text-lg">Add New Equipment</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Equipment Name *</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Department *</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Model *</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Serial Number *</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Warranty Expiry</label><input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Next Maintenance</label><input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          </div>
          <div className="flex gap-2"><button className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 shadow">Add Equipment</button><button onClick={() => setShowForm(false)} className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">Cancel</button></div>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-slate-700">{equipment.length}</div><div className="text-xs text-slate-500">Total Equipment</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-green-600">{equipment.filter((e) => e.status === 'Operational').length}</div><div className="text-xs text-slate-500">Operational</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-yellow-600">{equipment.filter((e) => e.status === 'Under Maintenance').length}</div><div className="text-xs text-slate-500">Under Maintenance</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-red-600">{overdue}</div><div className="text-xs text-slate-500">Maintenance Overdue</div></div>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50"><tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">ID</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Equipment</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Department</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Model</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Next Service</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Status</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {equipment.map((e) => {
              const overdue = new Date(e.nextMaintenance) < new Date();
              return (
                <tr key={e.id} className={`hover:bg-slate-50 ${overdue ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-2 text-xs font-mono text-slate-500">{e.id}</td>
                  <td className="px-4 py-2"><div className="text-sm font-medium">{e.name}</div><div className="text-[10px] text-slate-400">{e.serialNumber}</div></td>
                  <td className="px-4 py-2 text-sm">{e.department}</td>
                  <td className="px-4 py-2 text-xs text-slate-500">{e.model}</td>
                  <td className="px-4 py-2 text-xs"><span className={overdue ? 'text-red-600 font-bold' : ''}>{e.nextMaintenance}</span>{overdue && <span className="ml-1 text-[10px] text-red-500">OVERDUE</span>}</td>
                  <td className="px-4 py-2"><Badge className={STATUS_COLORS[e.status]}>{e.status}</Badge></td>
                  <td className="px-4 py-2"><div className="flex gap-1">
                    <button onClick={() => {}} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded">Schedule</button>
                    <button onClick={() => {}} className="text-xs px-2 py-1 bg-slate-50 text-slate-600 rounded">History</button>
                  </div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
