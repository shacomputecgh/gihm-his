import { useState } from 'react';
import { Card, Badge } from '../../components/ui';

interface Device {
  id: string;
  name: string;
  category: 'Diagnostic' | 'Therapeutic' | 'Life Support' | 'Surgical' | 'Monitoring' | 'Laboratory' | 'Imaging';
  model: string;
  manufacturer: string;
  serialNumber: string;
  department: string;
  location: string;
  purchaseDate: string;
  warrantyExpiry: string;
  assetValue: number;
  status: 'Operational' | 'Under Maintenance' | 'Out of Service' | 'Retired';
  lastService: string;
  nextService: string;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

const SAMPLE: Device[] = [
  { id: 'DEV-001', name: 'MRI Scanner', category: 'Imaging', model: 'Siemens MAGNETOM Aera 1.5T', manufacturer: 'Siemens Healthineers', serialNumber: 'SN-MRI-2018-003', department: 'Radiology', location: 'MRI Suite', purchaseDate: '2018-06-15', warrantyExpiry: '2023-06-15', assetValue: 2500000, status: 'Operational', lastService: '2026-06-01', nextService: '2026-12-01', condition: 'Good' },
  { id: 'DEV-002', name: 'CT Scanner', category: 'Imaging', model: 'GE Revolution CT', manufacturer: 'GE Healthcare', serialNumber: 'SN-CT-2020-005', department: 'Radiology', location: 'CT Suite', purchaseDate: '2020-03-20', warrantyExpiry: '2025-03-20', assetValue: 1800000, status: 'Operational', lastService: '2026-05-20', nextService: '2026-11-20', condition: 'Excellent' },
  { id: 'DEV-003', name: 'Ventilator', category: 'Life Support', model: 'Hamilton C6', manufacturer: 'Hamilton Medical', serialNumber: 'SN-VEN-2022-010', department: 'ICU', location: 'ICU Bed 1', purchaseDate: '2022-01-10', warrantyExpiry: '2027-01-10', assetValue: 85000, status: 'Operational', lastService: '2026-05-15', nextService: '2026-11-15', condition: 'Excellent' },
  { id: 'DEV-004', name: 'Ultrasound Machine', category: 'Diagnostic', model: 'Philips EPIQ 5', manufacturer: 'Philips', serialNumber: 'SN-US-2021-008', department: 'Radiology', location: 'Ultrasound Room', purchaseDate: '2021-08-05', warrantyExpiry: '2026-08-05', assetValue: 250000, status: 'Operational', lastService: '2026-07-01', nextService: '2027-01-01', condition: 'Good' },
  { id: 'DEV-005', name: 'Defibrillator', category: 'Life Support', model: 'LIFEPAK 15', manufacturer: 'Stryker', serialNumber: 'SN-DEF-2022-001', department: 'Emergency', location: 'Resus Bay', purchaseDate: '2022-06-01', warrantyExpiry: '2027-06-01', assetValue: 35000, status: 'Operational', lastService: '2026-07-01', nextService: '2027-01-01', condition: 'Good' },
  { id: 'DEV-006', name: 'Blood Gas Analyzer', category: 'Laboratory', model: 'ABL90 FLEX', manufacturer: 'Radiometer', serialNumber: 'SN-BGA-2021-003', department: 'Laboratory', location: 'Clinical Chemistry', purchaseDate: '2021-04-15', warrantyExpiry: '2026-04-15', assetValue: 120000, status: 'Under Maintenance', lastService: '2026-08-01', nextService: '2026-09-01', condition: 'Fair' },
  { id: 'DEV-007', name: 'Anaesthesia Machine', category: 'Surgical', model: 'Dräger Perseus A500', manufacturer: 'Dräger', serialNumber: 'SN-ANES-2020-002', department: 'Theatre', location: 'Theatre 1', purchaseDate: '2020-09-01', warrantyExpiry: '2025-09-01', assetValue: 180000, status: 'Operational', lastService: '2026-06-15', nextService: '2026-12-15', condition: 'Good' },
  { id: 'DEV-008', name: 'Patient Monitor', category: 'Monitoring', model: 'Philips IntelliVue MX800', manufacturer: 'Philips', serialNumber: 'SN-MON-2023-005', department: 'ICU', location: 'ICU Bed 3', purchaseDate: '2023-02-01', warrantyExpiry: '2028-02-01', assetValue: 45000, status: 'Operational', lastService: '2026-04-01', nextService: '2026-10-01', condition: 'Excellent' },
];

const STATUS_COLORS: Record<string, string> = { Operational: 'bg-green-100 text-green-800', 'Under Maintenance': 'bg-yellow-100 text-yellow-800', 'Out of Service': 'bg-red-100 text-red-800', Retired: 'bg-gray-100 text-gray-800' };
const CONDITION_COLORS: Record<string, string> = { Excellent: 'bg-green-100 text-green-800', Good: 'bg-blue-100 text-blue-800', Fair: 'bg-yellow-100 text-yellow-800', Poor: 'bg-red-100 text-red-800' };

export default function MedicalDevice() {
  const [tab, setTab] = useState<'overview' | 'inventory' | 'maintenance' | 'financial'>('overview');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏥 Medical Device Management</h1>
          <p className="text-gray-600 mt-1">Device inventory · Maintenance schedules · Asset management</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Devices', value: SAMPLE.length, icon: '🏥', color: 'text-blue-600' },
          { label: 'Operational', value: SAMPLE.filter(d => d.status === 'Operational').length, icon: '✅', color: 'text-green-600' },
          { label: 'Under Maintenance', value: SAMPLE.filter(d => d.status === 'Under Maintenance').length, icon: '🔧', color: 'text-yellow-600' },
          { label: 'Total Value', value: `GH₵${(SAMPLE.reduce((s, d) => s + d.assetValue, 0) / 1000000).toFixed(1)}M`, icon: '💰', color: 'text-purple-600' },
        ].map((s, i) => (
          <Card key={i} className="p-4"><div className="text-sm text-gray-500">{s.icon} {s.label}</div><div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div></Card>
        ))}
      </div>

      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {(['overview', 'inventory', 'maintenance', 'financial'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === t ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'inventory' ? '📦 Inventory' : t === 'maintenance' ? '🔧 Maintenance' : '💰 Financial'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">By Category</h3>
            <div className="space-y-2">
              {Object.entries(SAMPLE.reduce<Record<string, number>>((a, d) => { a[d.category] = (a[d.category] || 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                <div key={cat} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg"><Badge className="bg-gray-100 text-gray-800">{cat}</Badge><span className="font-bold">{count}</span></div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Condition Distribution</h3>
            <div className="space-y-3">
              {['Excellent', 'Good', 'Fair', 'Poor'].map(c => {
                const count = SAMPLE.filter(d => d.condition === c).length;
                const pct = SAMPLE.length > 0 ? (count / SAMPLE.length * 100) : 0;
                return (
                  <div key={c}>
                    <div className="flex justify-between text-sm mb-1"><Badge className={CONDITION_COLORS[c]}>{c}</Badge><span className="font-bold">{count} ({pct.toFixed(0)}%)</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${c === 'Excellent' ? 'bg-green-500' : c === 'Good' ? 'bg-blue-500' : c === 'Fair' ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {tab === 'inventory' && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Device</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">Serial</th>
                <th className="px-4 py-3 text-left">Value</th>
                <th className="px-4 py-3 text-left">Condition</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE.map(d => (
                <tr key={d.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3"><div className="font-medium">{d.name}</div><div className="text-xs text-gray-500">{d.model}</div></td>
                  <td className="px-4 py-3"><Badge className="bg-gray-100 text-gray-800">{d.category}</Badge></td>
                  <td className="px-4 py-3">{d.department}</td>
                  <td className="px-4 py-3 font-mono text-xs">{d.serialNumber}</td>
                  <td className="px-4 py-3 font-bold">GH₵{d.assetValue.toLocaleString()}</td>
                  <td className="px-4 py-3"><Badge className={CONDITION_COLORS[d.condition]}>{d.condition}</Badge></td>
                  <td className="px-4 py-3"><Badge className={STATUS_COLORS[d.status]}>{d.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'maintenance' && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Device</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">Last Service</th>
                <th className="px-4 py-3 text-left">Next Service</th>
                <th className="px-4 py-3 text-left">Warranty</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE.sort((a, b) => new Date(a.nextService).getTime() - new Date(b.nextService).getTime()).map(d => (
                <tr key={d.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{d.name}</td>
                  <td className="px-4 py-3">{d.department}</td>
                  <td className="px-4 py-3">{d.lastService}</td>
                  <td className="px-4 py-3">{d.nextService}</td>
                  <td className="px-4 py-3"><span className={new Date(d.warrantyExpiry) < new Date() ? 'text-red-600' : 'text-gray-600'}>{d.warrantyExpiry}</span></td>
                  <td className="px-4 py-3"><Badge className={STATUS_COLORS[d.status]}>{d.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'financial' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Asset Value by Category</h3>
            <div className="space-y-3">
              {Object.entries(SAMPLE.reduce<Record<string, number>>((a, d) => { a[d.category] = (a[d.category] || 0) + d.assetValue; return a; }, {})).sort((a, b) => b[1] - a[1]).map(([cat, value]) => {
                const total = SAMPLE.reduce((s, d) => s + d.assetValue, 0);
                const pct = total > 0 ? (value / total * 100) : 0;
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-sm mb-1"><span>{cat}</span><span className="font-bold">GH₵{(value / 1000000).toFixed(1)}M ({pct.toFixed(0)}%)</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Warranty Status</h3>
            <div className="space-y-2">
              {SAMPLE.map(d => (
                <div key={d.id} className={`flex justify-between items-center p-2 rounded ${new Date(d.warrantyExpiry) < new Date() ? 'bg-red-50' : 'bg-green-50'}`}>
                  <span className="text-sm font-medium">{d.name}</span>
                  <Badge className={new Date(d.warrantyExpiry) < new Date() ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                    {new Date(d.warrantyExpiry) < new Date() ? 'EXPIRED' : `Until ${d.warrantyExpiry}`}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
