import { useState } from 'react';
import { Card, Badge } from '../../components/ui';

interface SterilisationCycle {
  id: string;
  batchId: string;
  cycleType: 'Autoclave' | 'EtO' | 'Hydrogen Peroxide' | 'Dry Heat' | 'Chemical';
  loadDate: string;
  loadTime: string;
  unloadTime: string;
  operator: string;
  autoclave: string;
  loadSize: number;
  instruments: string;
  theatre: string;
  temperature: number;
  pressure: number;
  exposureTime: number;
  biologicalIndicator: 'Pass' | 'Fail' | 'Pending';
  chemicalIndicator: 'Pass' | 'Fail' | 'Pending';
  status: 'Loading' | 'Sterilising' | 'Drying' | 'Unloading' | 'Completed' | 'Failed';
  expiryDate: string;
}

const SAMPLE: SterilisationCycle[] = [
  { id: 'CSSD-001', batchId: 'BAT-2026-0825-01', cycleType: 'Autoclave', loadDate: '2026-08-25', loadTime: '06:00', unloadTime: '07:30', operator: 'Tech. Mensah', autoclave: 'Autoclave 1 (Getinge)', loadSize: 45, instruments: 'General Surgery Set, Laparoscopic Instruments', theatre: 'Theatre 1', temperature: 134, pressure: 2.1, exposureTime: 18, biologicalIndicator: 'Pass', chemicalIndicator: 'Pass', status: 'Completed', expiryDate: '2026-09-08' },
  { id: 'CSSD-002', batchId: 'BAT-2026-0825-02', cycleType: 'Autoclave', loadDate: '2026-08-25', loadTime: '08:00', unloadTime: '', operator: 'Tech. Appiah', autoclave: 'Autoclave 2 (Steris)', loadSize: 38, instruments: 'Orthopaedic Set, Power Tools', theatre: 'Theatre 2', temperature: 134, pressure: 2.1, exposureTime: 18, biologicalIndicator: 'Pending', chemicalIndicator: 'Pass', status: 'Completed', expiryDate: '2026-09-08' },
  { id: 'CSSD-003', batchId: 'BAT-2026-0825-03', cycleType: 'EtO', loadDate: '2026-08-25', loadTime: '09:00', unloadTime: '', operator: 'Tech. Osei', autoclave: 'EtO Steriliser', loadSize: 20, instruments: 'Endoscopes, Heat-Sensitive Devices', theatre: 'Endoscopy Suite', temperature: 55, pressure: 0, exposureTime: 120, biologicalIndicator: 'Pending', chemicalIndicator: 'Pending', status: 'Sterilising', expiryDate: '' },
  { id: 'CSSD-004', batchId: 'BAT-2026-0825-04', cycleType: 'Autoclave', loadDate: '2026-08-25', loadTime: '10:30', unloadTime: '', operator: 'Tech. Mensah', autoclave: 'Autoclave 3 (Tuttnauer)', loadSize: 30, instruments: 'Caesarean Section Set, Neonatal Kit', theatre: 'Theatre 3', temperature: 134, pressure: 2.1, exposureTime: 18, biologicalIndicator: 'Pending', chemicalIndicator: 'Pending', status: 'Loading', expiryDate: '' },
];

const STATUS_COLORS: Record<string, string> = { Loading: 'bg-gray-100 text-gray-800', Sterilising: 'bg-blue-100 text-blue-800', Drying: 'bg-yellow-100 text-yellow-800', Unloading: 'bg-orange-100 text-orange-800', Completed: 'bg-green-100 text-green-800', Failed: 'bg-red-100 text-red-800' };

export default function Sterilisation() {
  const [tab, setTab] = useState<'overview' | 'cycles' | 'equipment' | 'quality'>('overview');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🧪 CSSD — Sterilisation</h1>
          <p className="text-gray-600 mt-1">Instrument processing · Sterilisation cycles · Quality control</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Loads', value: SAMPLE.length, icon: '📦', color: 'text-blue-600' },
          { label: 'Completed', value: SAMPLE.filter(s => s.status === 'Completed').length, icon: '✅', color: 'text-green-600' },
          { label: 'In Process', value: SAMPLE.filter(s => s.status !== 'Completed' && s.status !== 'Failed').length, icon: '🔄', color: 'text-orange-600' },
          { label: 'Failed', value: SAMPLE.filter(s => s.status === 'Failed').length, icon: '❌', color: 'text-red-600' },
        ].map((s, i) => (
          <Card key={i} className="p-4"><div className="text-sm text-gray-500">{s.icon} {s.label}</div><div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div></Card>
        ))}
      </div>

      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {(['overview', 'cycles', 'equipment', 'quality'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === t ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'cycles' ? '🔄 Cycles' : t === 'equipment' ? '🔧 Equipment' : '✅ Quality'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Today's Processing Pipeline</h3>
            <div className="flex items-center justify-between gap-2">
              {['Loading', 'Sterilising', 'Drying', 'Completed'].map((step, i) => {
                const count = SAMPLE.filter(s => s.status === step).length;
                return (
                  <div key={step} className="flex-1 text-center">
                    <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center text-white font-bold ${i < 3 ? 'bg-blue-500' : 'bg-green-500'}`}>{count}</div>
                    <div className="text-xs text-gray-600 mt-2">{step}</div>
                    {i < 3 && <div className="text-gray-400 text-lg">→</div>}
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Sterilisation Method Distribution</h3>
            <div className="space-y-3">
              {Object.entries(SAMPLE.reduce<Record<string, number>>((a, s) => { a[s.cycleType] = (a[s.cycleType] || 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">{type}</span><span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'cycles' && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Batch</th>
                <th className="px-4 py-3 text-left">Cycle</th>
                <th className="px-4 py-3 text-left">Instruments</th>
                <th className="px-4 py-3 text-left">Theatre</th>
                <th className="px-4 py-3 text-left">Temp/Pressure</th>
                <th className="px-4 py-3 text-left">BI/CI</th>
                <th className="px-4 py-3 text-left">Operator</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE.map(s => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{s.batchId}</td>
                  <td className="px-4 py-3"><Badge className="bg-gray-100 text-gray-800">{s.cycleType}</Badge></td>
                  <td className="px-4 py-3 text-sm max-w-[180px] truncate">{s.instruments}</td>
                  <td className="px-4 py-3">{s.theatre}</td>
                  <td className="px-4 py-3">{s.temperature}°C / {s.pressure} bar</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold ${s.biologicalIndicator === 'Pass' ? 'text-green-600' : s.biologicalIndicator === 'Fail' ? 'text-red-600' : 'text-yellow-600'}`}>BI:{s.biologicalIndicator}</span>
                    {' / '}
                    <span className={`text-xs font-bold ${s.chemicalIndicator === 'Pass' ? 'text-green-600' : s.chemicalIndicator === 'Fail' ? 'text-red-600' : 'text-yellow-600'}`}>CI:{s.chemicalIndicator}</span>
                  </td>
                  <td className="px-4 py-3">{s.operator}</td>
                  <td className="px-4 py-3"><Badge className={STATUS_COLORS[s.status]}>{s.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'equipment' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Autoclave 1', model: 'Getinge GSS75', status: 'Operational', lastService: '2026-07-01', cycles: 1250 },
            { name: 'Autoclave 2', model: 'Steris AMSCO V-117', status: 'Operational', lastService: '2026-06-15', cycles: 980 },
            { name: 'Autoclave 3', model: 'Tuttnauer 60L', status: 'Operational', lastService: '2026-08-01', cycles: 650 },
          ].map((eq, i) => (
            <Card key={i} className="p-5">
              <div className="flex justify-between items-start"><div className="font-bold">{eq.name}</div><Badge className="bg-green-100 text-green-800">{eq.status}</Badge></div>
              <div className="text-sm text-gray-500 mt-1">{eq.model}</div>
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between"><span>Last Service</span><span>{eq.lastService}</span></div>
                <div className="flex justify-between"><span>Total Cycles</span><span className="font-bold">{eq.cycles.toLocaleString()}</span></div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'quality' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Biological Indicator Results</h3>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600">{((SAMPLE.filter(s => s.biologicalIndicator === 'Pass').length / Math.max(SAMPLE.filter(s => s.biologicalIndicator !== 'Pending').length, 1)) * 100).toFixed(0)}%</div>
              <div className="text-sm text-gray-500 mt-2">Pass rate (completed cycles)</div>
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Quality Control Checklist</h3>
            <div className="space-y-2">
              {['Daily vacuum leak test', 'Weekly Bowie-Dick test', 'Monthly spore testing', 'Quarterly calibration', 'Annual full service'].map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                  <span className="text-green-600">✅</span><span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
