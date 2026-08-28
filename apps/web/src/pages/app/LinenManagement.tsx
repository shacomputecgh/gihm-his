import { useState } from 'react';
import { Card, Badge } from '../../components/ui';

interface LinenItem {
  id: string;
  type: string;
  category: 'Bed Linen' | 'Patient Wear' | 'Surgical' | 'Towels' | 'Curtains' | 'Staff Uniform';
  currentStock: number;
  inLaundry: number;
  damaged: number;
  minRequired: number;
  location: string;
  unitCost: number;
}

const INVENTORY: LinenItem[] = [
  { id: 'LN-001', type: 'Bed Sheets (White)', category: 'Bed Linen', currentStock: 250, inLaundry: 80, damaged: 15, minRequired: 200, location: 'Central Store', unitCost: 15 },
  { id: 'LN-002', type: 'Pillow Cases', category: 'Bed Linen', currentStock: 300, inLaundry: 100, damaged: 20, minRequired: 250, location: 'Central Store', unitCost: 8 },
  { id: 'LN-003', type: 'Blankets', category: 'Bed Linen', currentStock: 180, inLaundry: 40, damaged: 10, minRequired: 150, location: 'Central Store', unitCost: 35 },
  { id: 'LN-004', type: 'Patient Gowns', category: 'Patient Wear', currentStock: 120, inLaundry: 60, damaged: 25, minRequired: 150, location: 'Central Store', unitCost: 12 },
  { id: 'LN-005', type: 'Surgical Drapes', category: 'Surgical', currentStock: 40, inLaundry: 15, damaged: 5, minRequired: 30, location: 'Theatre Store', unitCost: 50 },
  { id: 'LN-006', type: 'Bath Towels', category: 'Towels', currentStock: 200, inLaundry: 80, damaged: 12, minRequired: 180, location: 'Central Store', unitCost: 10 },
  { id: 'LN-007', type: 'Privacy Curtains', category: 'Curtains', currentStock: 30, inLaundry: 5, damaged: 3, minRequired: 25, location: 'Central Store', unitCost: 25 },
  { id: 'LN-008', type: 'Surgical Gowns (Disposable)', category: 'Surgical', currentStock: 500, inLaundry: 0, damaged: 0, minRequired: 300, location: 'Theatre Store', unitCost: 5 },
];

const LAUNDRY_BATCHES = [
  { id: 'LB-001', date: '2026-08-25', items: 350, status: 'In Process', vendor: 'Hospital Laundry', estimatedReturn: '2026-08-26' },
  { id: 'LB-002', date: '2026-08-24', items: 280, status: 'Completed', vendor: 'Hospital Laundry', estimatedReturn: '2026-08-25' },
  { id: 'LB-003', date: '2026-08-23', items: 320, status: 'Completed', vendor: 'Hospital Laundry', estimatedReturn: '2026-08-24' },
];

export default function LinenManagement() {
  const [tab, setTab] = useState<'overview' | 'inventory' | 'laundry' | 'distribution'>('overview');

  const totalStock = INVENTORY.reduce((s, i) => s + i.currentStock, 0);
  const totalLaundry = INVENTORY.reduce((s, i) => s + i.inLaundry, 0);
  const totalDamaged = INVENTORY.reduce((s, i) => s + i.damaged, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🛏️ Linen Management</h1>
          <p className="text-gray-600 mt-1">Inventory · Laundry tracking · Distribution · Damage control</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Stock', value: totalStock, icon: '📦', color: 'text-blue-600' },
          { label: 'In Laundry', value: totalLaundry, icon: '🧺', color: 'text-orange-600' },
          { label: 'Damaged', value: totalDamaged, icon: '⚠️', color: 'text-red-600' },
          { label: 'Total Value', value: `GH₵${INVENTORY.reduce((s, i) => s + i.currentStock * i.unitCost, 0).toLocaleString()}`, icon: '💰', color: 'text-green-600' },
        ].map((s, i) => (
          <Card key={i} className="p-4">
            <div className="text-sm text-gray-500">{s.icon} {s.label}</div>
            <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {(['overview', 'inventory', 'laundry', 'distribution'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === t ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'inventory' ? '📦 Inventory' : t === 'laundry' ? '🧺 Laundry' : '🚚 Distribution'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Stock by Category</h3>
            <div className="space-y-3">
              {Object.entries(INVENTORY.reduce<Record<string, { stock: number; min: number }>>((a, i) => {
                if (!a[i.category]) a[i.category] = { stock: 0, min: 0 };
                a[i.category].stock += i.currentStock;
                a[i.category].min += i.minRequired;
                return a;
              }, {})).map(([cat, data]) => {
                const isLow = data.stock < data.min;
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-sm mb-1"><span>{cat}</span><span className={isLow ? 'text-red-600 font-bold' : ''}>{data.stock}/{data.min}</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${isLow ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min((data.stock / data.min) * 100, 100)}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Low Stock Alerts</h3>
            <div className="space-y-2">
              {INVENTORY.filter(i => i.currentStock < i.minRequired).map(i => (
                <div key={i.id} className="p-3 bg-red-50 rounded-lg">
                  <div className="flex justify-between"><span className="font-medium text-red-800">{i.type}</span><span className="text-red-600 font-bold">{i.currentStock}/{i.minRequired}</span></div>
                </div>
              ))}
              {INVENTORY.filter(i => i.currentStock < i.minRequired).length === 0 && <div className="text-center py-4 text-gray-500">All items above minimum stock</div>}
            </div>
          </Card>
        </div>
      )}

      {tab === 'inventory' && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Item</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Stock</th>
                <th className="px-4 py-3 text-left">In Laundry</th>
                <th className="px-4 py-3 text-left">Damaged</th>
                <th className="px-4 py-3 text-left">Min Required</th>
                <th className="px-4 py-3 text-left">Unit Cost</th>
                <th className="px-4 py-3 text-left">Value</th>
              </tr>
            </thead>
            <tbody>
              {INVENTORY.map(i => (
                <tr key={i.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{i.type}</td>
                  <td className="px-4 py-3"><Badge className="bg-gray-100 text-gray-800">{i.category}</Badge></td>
                  <td className="px-4 py-3"><span className={i.currentStock < i.minRequired ? 'text-red-600 font-bold' : ''}>{i.currentStock}</span></td>
                  <td className="px-4 py-3 text-orange-600">{i.inLaundry}</td>
                  <td className="px-4 py-3 text-red-600">{i.damaged}</td>
                  <td className="px-4 py-3">{i.minRequired}</td>
                  <td className="px-4 py-3">GH₵{i.unitCost}</td>
                  <td className="px-4 py-3 font-bold">GH₵{(i.currentStock * i.unitCost).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'laundry' && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Batch</th>
                <th className="px-4 py-3 text-left">Date Sent</th>
                <th className="px-4 py-3 text-left">Items</th>
                <th className="px-4 py-3 text-left">Vendor</th>
                <th className="px-4 py-3 text-left">Est. Return</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {LAUNDRY_BATCHES.map(b => (
                <tr key={b.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono">{b.id}</td>
                  <td className="px-4 py-3">{b.date}</td>
                  <td className="px-4 py-3 font-bold">{b.items}</td>
                  <td className="px-4 py-3">{b.vendor}</td>
                  <td className="px-4 py-3">{b.estimatedReturn}</td>
                  <td className="px-4 py-3"><Badge className={b.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>{b.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'distribution' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['ICU', 'Theatre', 'Maternity', 'Emergency', 'OPD', 'Paediatrics'].map(ward => (
            <Card key={ward} className="p-5">
              <h4 className="font-bold text-gray-900">{ward}</h4>
              <div className="mt-3 space-y-2">
                {['Bed Sheets', 'Pillow Cases', 'Patient Gowns', 'Towels'].map(item => (
                  <div key={item} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                    <span>{item}</span><span className="font-bold">{Math.floor(Math.random() * 30) + 10}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
