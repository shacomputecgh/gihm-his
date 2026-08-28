import { useState } from 'react';
import { Badge, useToast } from '../../components/ui';

interface BloodUnit { id: string; bloodType: string; component: string; units: number; expiryDate: string; donorId: string; status: 'Available' | 'Reserved' | 'Issued' | 'Expired'; }

const UNITS: BloodUnit[] = [
  { id: 'BU-001', bloodType: 'O+', component: 'Whole Blood', units: 15, expiryDate: '2026-09-15', donorId: 'DN-001', status: 'Available' },
  { id: 'BU-002', bloodType: 'O-', component: 'Whole Blood', units: 5, expiryDate: '2026-09-10', donorId: 'DN-002', status: 'Available' },
  { id: 'BU-003', bloodType: 'A+', component: 'Packed RBC', units: 12, expiryDate: '2026-09-20', donorId: 'DN-003', status: 'Available' },
  { id: 'BU-004', bloodType: 'A-', component: 'Packed RBC', units: 3, expiryDate: '2026-09-05', donorId: 'DN-004', status: 'Reserved' },
  { id: 'BU-005', bloodType: 'B+', component: 'Platelets', units: 8, expiryDate: '2026-08-25', donorId: 'DN-005', status: 'Available' },
  { id: 'BU-006', bloodType: 'AB+', component: 'FFP', units: 4, expiryDate: '2026-09-12', donorId: 'DN-006', status: 'Available' },
  { id: 'BU-007', bloodType: 'O+', component: 'Whole Blood', units: 2, expiryDate: '2026-08-24', donorId: 'DN-007', status: 'Expired' },
];

const STATUS_COLORS: Record<string, string> = { Available: 'bg-green-100 text-green-800', Reserved: 'bg-yellow-100 text-yellow-800', Issued: 'bg-blue-100 text-blue-800', Expired: 'bg-gray-100 text-gray-800' };

export default function BloodBankEnhanced() {
  const toast = useToast();
  const [units] = useState<BloodUnit[]>(UNITS);
  const [showForm, setShowForm] = useState(false);

  const bloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
  const typeCounts = bloodTypes.map((t) => ({
    type: t,
    available: units.filter((u) => u.bloodType === t && u.status === 'Available').reduce((s, u) => s + u.units, 0),
    reserved: units.filter((u) => u.bloodType === t && u.status === 'Reserved').reduce((s, u) => s + u.units, 0),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Blood Bank</h1><p className="text-gray-500">Blood inventory, crossmatching, transfusion tracking, and donor management</p></div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">{showForm ? '✕ Cancel' : '+ Add Blood Unit'}</button>
      </div>
      {showForm && (
        <div className="bg-white rounded-lg border-2 border-green-200 p-5 space-y-3 shadow-lg">
          <h3 className="font-bold text-green-800 text-lg">Add Blood Unit</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Blood Type *</label><select className="w-full border rounded-lg px-3 py-2 text-sm">{bloodTypes.map((t) => <option key={t}>{t}</option>)}</select></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Component *</label><select className="w-full border rounded-lg px-3 py-2 text-sm"><option>Whole Blood</option><option>Packed RBC</option><option>Platelets</option><option>FFP</option><option>Cryoprecipitate</option></select></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Units *</label><input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Donor ID *</label><input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Expiry Date *</label><input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Screening Status</label><select className="w-full border rounded-lg px-3 py-2 text-sm"><option>Pass — All Negative</option><option>Pending</option><option>Failed</option></select></div>
          </div>
          <div className="flex gap-2"><button className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 shadow">Add Unit</button><button onClick={() => setShowForm(false)} className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">Cancel</button></div>
        </div>
      )}
      <h3 className="font-semibold text-sm">Blood Inventory by Type</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {typeCounts.map((t) => (
          <div key={t.type} className="bg-white rounded-lg border p-3 text-center">
            <div className="text-lg font-bold text-red-600">{t.type}</div>
            <div className={`text-2xl font-bold ${t.available < 5 ? 'text-red-600' : 'text-green-600'}`}>{t.available}</div>
            <div className="text-[10px] text-slate-500">available</div>
            {t.reserved > 0 && <div className="text-[10px] text-yellow-600">{t.reserved} reserved</div>}
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50"><tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">ID</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Blood Type</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Component</th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600">Units</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Expiry</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Status</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {units.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 text-xs font-mono text-slate-500">{u.id}</td>
                <td className="px-4 py-2 text-sm font-bold text-red-600">{u.bloodType}</td>
                <td className="px-4 py-2 text-sm">{u.component}</td>
                <td className="px-4 py-2 text-sm text-right font-bold">{u.units}</td>
                <td className="px-4 py-2 text-xs">{u.expiryDate}</td>
                <td className="px-4 py-2"><Badge className={STATUS_COLORS[u.status]}>{u.status}</Badge></td>
                <td className="px-4 py-2"><div className="flex gap-1">
                  {u.status === 'Available' && <button onClick={() => {}} className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded">Issue</button>}
                  {u.status === 'Available' && <button onClick={() => {}} className="text-xs px-2 py-1 bg-yellow-50 text-yellow-600 rounded">Reserve</button>}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
