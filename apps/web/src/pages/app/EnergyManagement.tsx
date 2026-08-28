import { useState } from 'react';
import { Card, Badge } from '../../components/ui';

interface PowerSource {
  id: string;
  name: string;
  type: 'Grid' | 'Generator' | 'Solar' | 'UPS' | 'Battery';
  capacity: string;
  currentLoad: number; // percentage
  fuelLevel?: number; // percentage for generators
  status: 'Online' | 'Standby' | 'Offline' | 'Maintenance';
  lastStarted?: string;
  runtime?: string; // hours
  fuelConsumption?: number; // litres/hour
  monthlyKWh: number;
  costPerKWh: number;
}

const POWER_SOURCES: PowerSource[] = [
  { id: 'PS-001', name: 'Grid (ECG)', type: 'Grid', capacity: '500 kVA', currentLoad: 65, status: 'Online', monthlyKWh: 45000, costPerKWh: 1.85 },
  { id: 'PS-002', name: 'Caterpillar C15', type: 'Generator', capacity: '500 kVA', currentLoad: 0, fuelLevel: 72, status: 'Standby', lastStarted: '2026-08-20', fuelConsumption: 35, monthlyKWh: 8000, costPerKWh: 3.20 },
  { id: 'PS-003', name: 'Perkins 1106A', type: 'Generator', capacity: '250 kVA', currentLoad: 0, fuelLevel: 85, status: 'Standby', lastStarted: '2026-08-18', fuelConsumption: 18, monthlyKWh: 3500, costPerKWh: 3.15 },
  { id: 'PS-004', name: 'Solar Array (Rooftop)', type: 'Solar', capacity: '100 kWp', currentLoad: 45, status: 'Online', monthlyKWh: 12000, costPerKWh: 0 },
  { id: 'PS-005', name: 'UPS Main', type: 'UPS', capacity: '200 kVA', currentLoad: 40, status: 'Online', monthlyKWh: 0, costPerKWh: 0 },
  { id: 'PS-006', name: 'UPS Critical', type: 'Battery', capacity: '100 kVA', currentLoad: 25, status: 'Online', monthlyKWh: 0, costPerKWh: 0 },
];

const ZONES = [
  { name: 'ICU', consumption: 8500, critical: true },
  { name: 'Theatre', consumption: 6200, critical: true },
  { name: 'Laboratory', consumption: 5800, critical: true },
  { name: 'Radiology', consumption: 7500, critical: true },
  { name: 'Wards', consumption: 4200, critical: false },
  { name: 'OPD', consumption: 3100, critical: false },
  { name: 'Pharmacy', consumption: 2800, critical: false },
  { name: 'Kitchen', consumption: 2500, critical: false },
  { name: 'Admin', consumption: 1200, critical: false },
  { name: 'Lighting (General)', consumption: 3500, critical: false },
];

const TYPE_COLORS: Record<string, string> = { Grid: 'bg-blue-100 text-blue-800', Generator: 'bg-orange-100 text-orange-800', Solar: 'bg-green-100 text-green-800', UPS: 'bg-purple-100 text-purple-800', Battery: 'bg-teal-100 text-teal-800' };

export default function EnergyManagement() {
  const [tab, setTab] = useState<'overview' | 'sources' | 'zones' | 'analytics'>('overview');
  const totalMonthly = POWER_SOURCES.reduce((s, p) => s + p.monthlyKWh, 0);
  const totalCost = POWER_SOURCES.reduce((s, p) => s + p.monthlyKWh * p.costPerKWh, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">⚡ Energy Management</h1>
          <p className="text-gray-600 mt-1">Power monitoring · Generator tracking · Solar · Consumption analytics</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Consumption', value: `${(totalMonthly / 1000).toFixed(0)}k kWh`, icon: '⚡', color: 'text-blue-600' },
          { label: 'Monthly Cost', value: `GH₵${totalCost.toLocaleString()}`, icon: '💰', color: 'text-purple-600' },
          { label: 'Grid Status', value: POWER_SOURCES[0].status, icon: '🔌', color: POWER_SOURCES[0].status === 'Online' ? 'text-green-600' : 'text-red-600' },
          { label: 'Generator Fuel', value: `${POWER_SOURCES[1].fuelLevel}%`, icon: '⛽', color: (POWER_SOURCES[1].fuelLevel ?? 0) < 30 ? 'text-red-600' : 'text-green-600' },
        ].map((s, i) => (
          <Card key={i} className="p-4"><div className="text-sm text-gray-500">{s.icon} {s.label}</div><div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div></Card>
        ))}
      </div>

      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {(['overview', 'sources', 'zones', 'analytics'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === t ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'sources' ? '⚡ Power Sources' : t === 'zones' ? '🏗️ Zones' : '📈 Analytics'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Power Source Status</h3>
            <div className="space-y-3">
              {POWER_SOURCES.map(p => (
                <div key={p.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2"><Badge className={TYPE_COLORS[p.type]}>{p.type}</Badge><span className="font-medium">{p.name}</span></div>
                    <Badge className={p.status === 'Online' ? 'bg-green-100 text-green-800' : p.status === 'Standby' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>{p.status}</Badge>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">{p.capacity}</div>
                  {p.currentLoad > 0 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1"><span>Load</span><span>{p.currentLoad}%</span></div>
                      <div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${p.currentLoad > 80 ? 'bg-red-500' : p.currentLoad > 50 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${p.currentLoad}%` }} /></div>
                    </div>
                  )}
                  {p.fuelLevel !== undefined && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1"><span>Fuel</span><span className={p.fuelLevel < 30 ? 'text-red-600' : ''}>{p.fuelLevel}%</span></div>
                      <div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${p.fuelLevel < 30 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${p.fuelLevel}%` }} /></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Energy Mix</h3>
            <div className="space-y-3">
              {POWER_SOURCES.filter(p => p.monthlyKWh > 0).sort((a, b) => b.monthlyKWh - a.monthlyKWh).map(p => {
                const pct = totalMonthly > 0 ? (p.monthlyKWh / totalMonthly * 100) : 0;
                return (
                  <div key={p.id}>
                    <div className="flex justify-between text-sm mb-1"><Badge className={TYPE_COLORS[p.type]}>{p.name}</Badge><span className="font-bold">{(p.monthlyKWh / 1000).toFixed(0)}k kWh ({pct.toFixed(0)}%)</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${p.type === 'Solar' ? 'bg-green-500' : p.type === 'Grid' ? 'bg-blue-500' : 'bg-orange-500'}`} style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {tab === 'sources' && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Source</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Capacity</th>
                <th className="px-4 py-3 text-left">Load</th>
                <th className="px-4 py-3 text-left">Monthly kWh</th>
                <th className="px-4 py-3 text-left">Cost/kWh</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {POWER_SOURCES.map(p => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3"><Badge className={TYPE_COLORS[p.type]}>{p.type}</Badge></td>
                  <td className="px-4 py-3">{p.capacity}</td>
                  <td className="px-4 py-3">{p.currentLoad > 0 ? `${p.currentLoad}%` : '—'}</td>
                  <td className="px-4 py-3 font-bold">{p.monthlyKWh.toLocaleString()}</td>
                  <td className="px-4 py-3">{p.costPerKWh > 0 ? `GH₵${p.costPerKWh.toFixed(2)}` : 'Free'}</td>
                  <td className="px-4 py-3"><Badge className={p.status === 'Online' ? 'bg-green-100 text-green-800' : p.status === 'Standby' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>{p.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'zones' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ZONES.sort((a, b) => b.consumption - a.consumption).map(z => {
            const pct = Math.max(...ZONES.map(x => x.consumption));
            return (
              <Card key={z.name} className={`p-4 ${z.critical ? 'ring-2 ring-red-200' : ''}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{z.name}</span>
                    {z.critical && <Badge className="bg-red-100 text-red-800 text-xs">Critical</Badge>}
                  </div>
                  <span className="font-bold text-blue-600">{z.consumption.toLocaleString()} kWh</span>
                </div>
                <div className="mt-2"><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(z.consumption / pct) * 100}%` }} /></div></div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Monthly Consumption Trend</h3>
            <div className="flex items-end gap-2 h-40">
              {[42000, 45000, 43000, 48000, 44000, 46000].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="text-xs font-bold text-blue-600">{(val / 1000).toFixed(0)}k</div>
                  <div className="w-full bg-blue-500 rounded-t" style={{ height: `${(val / 50000) * 100}%` }} />
                  <div className="text-xs text-gray-500 mt-1">{'Feb Mar Apr May Jun Jul'.split(' ')[i]}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Cost Breakdown</h3>
            <div className="space-y-3">
              {POWER_SOURCES.filter(p => p.monthlyKWh > 0).sort((a, b) => (b.monthlyKWh * b.costPerKWh) - (a.monthlyKWh * a.costPerKWh)).map(p => {
                const cost = p.monthlyKWh * p.costPerKWh;
                return (
                  <div key={p.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">{p.name}</span>
                    <span className="font-bold">GH₵{cost.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
