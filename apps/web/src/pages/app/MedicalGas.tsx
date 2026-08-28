import { useState } from 'react';
import { Card, Badge } from '../../components/ui';

interface GasCylinder {
  id: string;
  gasType: 'Oxygen' | 'Nitrous Oxide' | 'Medical Air' | 'Nitrogen' | 'CO2' | 'Helium';
  location: string;
  pressure: number; // bar
  capacity: number;
  fillLevel: number; // percentage
  lastRefill: string;
  serialNumber: string;
  expiryDate: string;
  status: 'Full' | 'In Use' | 'Low' | 'Empty' | 'Expired';
}

interface GasAlarm {
  id: string;
  zone: string;
  type: 'Low Pressure' | 'High Pressure' | 'Pipeline Failure' | 'Gas Leak' | 'Cylinder Empty';
  timestamp: string;
  severity: 'Critical' | 'Warning' | 'Info';
  acknowledged: boolean;
}

const CYLINDERS: GasCylinder[] = [
  { id: 'GC-001', gasType: 'Oxygen', location: 'ICU Main', pressure: 150, capacity: 10, fillLevel: 85, lastRefill: '2026-08-20', serialNumber: 'O2-2024-001', expiryDate: '2028-08-20', status: 'In Use' },
  { id: 'GC-002', gasType: 'Oxygen', location: 'Theatre 1', pressure: 145, capacity: 10, fillLevel: 92, lastRefill: '2026-08-22', serialNumber: 'O2-2024-002', expiryDate: '2028-08-22', status: 'In Use' },
  { id: 'GC-003', gasType: 'Nitrous Oxide', location: 'Theatre 2', pressure: 42, capacity: 10, fillLevel: 35, lastRefill: '2026-08-18', serialNumber: 'N2O-2024-001', expiryDate: '2028-01-15', status: 'Low' },
  { id: 'GC-004', gasType: 'Medical Air', location: 'NICU', pressure: 160, capacity: 10, fillLevel: 95, lastRefill: '2026-08-25', serialNumber: 'MA-2024-001', expiryDate: '2028-08-25', status: 'Full' },
  { id: 'GC-005', gasType: 'Oxygen', location: 'Emergency', pressure: 5, capacity: 10, fillLevel: 8, lastRefill: '2026-08-10', serialNumber: 'O2-2023-015', expiryDate: '2027-08-10', status: 'Empty' },
  { id: 'GC-006', gasType: 'Oxygen', location: 'Ward A', pressure: 120, capacity: 10, fillLevel: 78, lastRefill: '2026-08-23', serialNumber: 'O2-2024-003', expiryDate: '2028-08-23', status: 'In Use' },
];

const ALARMS: GasAlarm[] = [
  { id: 'GA-001', zone: 'ICU', type: 'Low Pressure', timestamp: '2026-08-25 09:32', severity: 'Warning', acknowledged: true },
  { id: 'GA-002', zone: 'Theatre 1', type: 'Pipeline Failure', timestamp: '2026-08-25 07:15', severity: 'Critical', acknowledged: true },
  { id: 'GA-003', zone: 'NICU', type: 'Cylinder Empty', timestamp: '2026-08-24 22:10', severity: 'Warning', acknowledged: true },
  { id: 'GA-004', zone: 'Emergency', type: 'Gas Leak', timestamp: '2026-08-25 11:45', severity: 'Critical', acknowledged: false },
];

const GAS_COLORS: Record<string, string> = { Oxygen: 'bg-blue-100 text-blue-800', 'Nitrous Oxide': 'bg-purple-100 text-purple-800', 'Medical Air': 'bg-green-100 text-green-800', Nitrogen: 'bg-gray-100 text-gray-800', CO2: 'bg-orange-100 text-orange-800', Helium: 'bg-cyan-100 text-cyan-800' };
const STATUS_COLORS: Record<string, string> = { Full: 'bg-green-100 text-green-800', 'In Use': 'bg-blue-100 text-blue-800', Low: 'bg-yellow-100 text-yellow-800', Empty: 'bg-red-100 text-red-800', Expired: 'bg-gray-100 text-gray-800' };

export default function MedicalGas() {
  const [tab, setTab] = useState<'overview' | 'cylinders' | 'pipeline' | 'alarms'>('overview');
  const unacknowledged = ALARMS.filter(a => !a.acknowledged);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💨 Medical Gas Management</h1>
          <p className="text-gray-600 mt-1">Oxygen pipeline · Cylinder tracking · Alarm monitoring</p>
        </div>
        {unacknowledged.length > 0 && <span className="px-3 py-1 bg-red-600 text-white rounded-full text-sm font-bold animate-pulse">🚨 {unacknowledged.length} Unacknowledged</span>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Cylinders', value: CYLINDERS.length, icon: '💨', color: 'text-blue-600' },
          { label: 'Full', value: CYLINDERS.filter(c => c.status === 'Full').length, icon: '✅', color: 'text-green-600' },
          { label: 'Low/Empty', value: CYLINDERS.filter(c => c.status === 'Low' || c.status === 'Empty').length, icon: '⚠️', color: 'text-yellow-600' },
          { label: 'Active Alarms', value: ALARMS.filter(a => !a.acknowledged).length, icon: '🚨', color: 'text-red-600' },
        ].map((s, i) => (
          <Card key={i} className="p-4"><div className="text-sm text-gray-500">{s.icon} {s.label}</div><div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div></Card>
        ))}
      </div>

      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {(['overview', 'cylinders', 'pipeline', 'alarms'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === t ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'cylinders' ? '💨 Cylinders' : t === 'pipeline' ? '🔧 Pipeline' : '🚨 Alarms'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Gas Fill Levels</h3>
            <div className="space-y-3">
              {CYLINDERS.map(c => (
                <div key={c.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{c.location} <Badge className={GAS_COLORS[c.gasType]}>{c.gasType}</Badge></span>
                    <span className={`font-bold ${c.fillLevel < 20 ? 'text-red-600' : c.fillLevel < 50 ? 'text-yellow-600' : 'text-green-600'}`}>{c.fillLevel}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className={`h-3 rounded-full ${c.fillLevel < 20 ? 'bg-red-500' : c.fillLevel < 50 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${c.fillLevel}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Recent Alarms</h3>
            <div className="space-y-2">
              {ALARMS.map(a => (
                <div key={a.id} className={`p-3 rounded-lg ${a.severity === 'Critical' && !a.acknowledged ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-center">
                    <div><div className="font-medium">{a.zone} — {a.type}</div><div className="text-xs text-gray-500">{a.timestamp}</div></div>
                    <Badge className={a.severity === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>{a.severity}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'cylinders' && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Gas</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Serial</th>
                <th className="px-4 py-3 text-left">Fill Level</th>
                <th className="px-4 py-3 text-left">Pressure</th>
                <th className="px-4 py-3 text-left">Last Refill</th>
                <th className="px-4 py-3 text-left">Expiry</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {CYLINDERS.map(c => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{c.id}</td>
                  <td className="px-4 py-3"><Badge className={GAS_COLORS[c.gasType]}>{c.gasType}</Badge></td>
                  <td className="px-4 py-3">{c.location}</td>
                  <td className="px-4 py-3 font-mono text-xs">{c.serialNumber}</td>
                  <td className="px-4 py-3"><span className={`font-bold ${c.fillLevel < 20 ? 'text-red-600' : ''}`}>{c.fillLevel}%</span></td>
                  <td className="px-4 py-3">{c.pressure} bar</td>
                  <td className="px-4 py-3">{c.lastRefill}</td>
                  <td className="px-4 py-3">{c.expiryDate}</td>
                  <td className="px-4 py-3"><Badge className={STATUS_COLORS[c.status]}>{c.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {['ICU', 'Theatre 1', 'Theatre 2', 'NICU', 'Emergency', 'Ward A', 'Ward B', 'Labour Ward', 'OPD'].map(zone => (
            <Card key={zone} className="p-4">
              <h4 className="font-bold text-gray-900 mb-3">{zone}</h4>
              <div className="space-y-2">
                {['Oxygen', 'Medical Air', 'Vacuum'].map(gas => (
                  <div key={gas} className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="text-sm">{gas}</span><span className="text-green-600 font-bold">● Normal</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'alarms' && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Zone</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Timestamp</th>
                <th className="px-4 py-3 text-left">Severity</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {ALARMS.map(a => (
                <tr key={a.id} className={`border-b hover:bg-gray-50 ${!a.acknowledged ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3 font-mono text-xs">{a.id}</td>
                  <td className="px-4 py-3 font-bold">{a.zone}</td>
                  <td className="px-4 py-3">{a.type}</td>
                  <td className="px-4 py-3">{a.timestamp}</td>
                  <td className="px-4 py-3"><Badge className={a.severity === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>{a.severity}</Badge></td>
                  <td className="px-4 py-3">
                    {a.acknowledged ? <Badge className="bg-green-100 text-green-800">Acknowledged</Badge> : <button onClick={() => {}} className="px-3 py-1 bg-red-600 text-white rounded text-xs">Acknowledge</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
