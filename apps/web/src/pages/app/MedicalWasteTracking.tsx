import { useState } from 'react';
import { Card, Badge, useToast } from '../../components/ui';

interface WasteRecord {
  id: string;
  date: string;
  department: string;
  ward: string;
  category: 'Red' | 'Yellow' | 'Black' | 'Sharps' | 'Pharmaceutical' | 'Radioactive' | 'Chemical';
  description: string;
  weight: number; // kg
  generator: string;
  pickupTime: string;
  collectedBy: string;
  transporter: string;
  treatmentMethod: 'Incineration' | 'Autoclave' | 'Chemical Treatment' | 'Landfill' | 'Recycling' | 'Special Disposal';
  manifestId: string;
  status: 'Generated' | 'Stored' | 'Collected' | 'In Transit' | 'Treated' | 'Disposed';
  compliant: boolean;
}

const WASTE_CATEGORIES = {
  Red: { label: 'Infectious Waste', icon: '🔴', description: 'Blood, body fluids, cultures, pathological waste', color: 'bg-red-100 text-red-800', barColor: 'bg-red-500' },
  Yellow: { label: 'Clinical Waste', icon: '🟡', description: 'PPE, swabs, dressings, gloves', color: 'bg-yellow-100 text-yellow-800', barColor: 'bg-yellow-500' },
  Black: { label: 'General Waste', icon: '⚫', description: 'Non-hazardous office and domestic waste', color: 'bg-gray-100 text-gray-800', barColor: 'bg-gray-500' },
  Sharps: { label: 'Sharps Waste', icon: '💉', description: 'Needles, blades, broken glass, lancets', color: 'bg-orange-100 text-orange-800', barColor: 'bg-orange-500' },
  Pharmaceutical: { label: 'Pharmaceutical', icon: '💊', description: 'Expired, unused, recalled medications', color: 'bg-purple-100 text-purple-800', barColor: 'bg-purple-500' },
  Radioactive: { label: 'Radioactive', icon: '☢️', description: 'Nuclear medicine and radiotherapy waste', color: 'bg-blue-100 text-blue-800', barColor: 'bg-blue-500' },
  Chemical: { label: 'Chemical', icon: '🧪', description: 'Laboratory chemicals, solvents, reagents', color: 'bg-teal-100 text-teal-800', barColor: 'bg-teal-500' },
};

const SAMPLE_WASTE: WasteRecord[] = [
  { id: 'MW-001', date: '2026-08-25', department: 'Surgery', ward: 'Theatre', category: 'Red', description: 'Blood-soaked dressings, surgical gauze', weight: 12.5, generator: 'Nurse Kumah', pickupTime: '14:00', collectedBy: 'Waste Team A', transporter: 'EcoMed Disposal', treatmentMethod: 'Incineration', manifestId: 'MAN-2026-0825', status: 'Collected', compliant: true },
  { id: 'MW-002', date: '2026-08-25', department: 'ICU', ward: 'ICU', category: 'Sharps', description: 'Used needles, IV cannulas, lancets', weight: 3.2, generator: 'Nurse Osei', pickupTime: '12:00', collectedBy: 'Waste Team A', transporter: 'EcoMed Disposal', treatmentMethod: 'Incineration', manifestId: 'MAN-2026-0825', status: 'Collected', compliant: true },
  { id: 'MW-003', date: '2026-08-25', department: 'Laboratory', ward: 'Microbiology', category: 'Red', description: 'Culture plates, specimen containers, blood tubes', weight: 8.0, generator: 'Lab Tech. Boateng', pickupTime: '16:00', collectedBy: 'Waste Team B', transporter: 'EcoMed Disposal', treatmentMethod: 'Autoclave', manifestId: 'MAN-2026-0826', status: 'Stored', compliant: true },
  { id: 'MW-004', date: '2026-08-25', department: 'Pharmacy', ward: 'Main Pharmacy', category: 'Pharmaceutical', description: 'Expired amoxicillin, metformin, paracetamol batches', weight: 5.0, generator: 'Pharm. Mensah', pickupTime: '10:00', collectedBy: 'Pharm Waste Team', transporter: 'PharmaCycle Ghana', treatmentMethod: 'Special Disposal', manifestId: 'MAN-2026-0827', status: 'In Transit', compliant: true },
  { id: 'MW-005', date: '2026-08-25', department: 'Radiology', ward: 'Nuclear Medicine', category: 'Radioactive', description: 'Tc-99m vials, contaminated syringes', weight: 1.5, generator: 'Dr. Appiah', pickupTime: '18:00', collectedBy: 'Radiation Safety', transporter: 'Atomics Ghana', treatmentMethod: 'Special Disposal', manifestId: 'MAN-2026-0828', status: 'Stored', compliant: true },
  { id: 'MW-006', date: '2026-08-25', department: 'Maternity', ward: 'Labour Ward', category: 'Yellow', description: 'PPE, disposable drapes, placenta bags', weight: 15.0, generator: 'Midwife Asantewaa', pickupTime: '08:00', collectedBy: 'Waste Team A', transporter: 'EcoMed Disposal', treatmentMethod: 'Incineration', manifestId: 'MAN-2026-0829', status: 'Treated', compliant: true },
  { id: 'MW-007', date: '2026-08-25', department: 'Kitchen', ward: 'Cafeteria', category: 'Black', description: 'Food waste, packaging, general refuse', weight: 45.0, generator: 'Kitchen Staff', pickupTime: '20:00', collectedBy: 'General Waste', transporter: 'Accra Waste Mgmt', treatmentMethod: 'Landfill', manifestId: 'MAN-2026-0830', status: 'Disposed', compliant: true },
  { id: 'MW-008', date: '2026-08-25', department: 'Laboratory', ward: 'Chemical Lab', category: 'Chemical', description: 'Formalin waste, ethanol, chemical reagents', weight: 2.0, generator: 'Lab Tech. Darko', pickupTime: '15:00', collectedBy: 'Chemical Waste', transporter: 'ChemSafe Ghana', treatmentMethod: 'Chemical Treatment', manifestId: 'MAN-2026-0831', status: 'Generated', compliant: false },
];

const STATUS_COLORS: Record<string, string> = {
  Generated: 'bg-gray-100 text-gray-800',
  Stored: 'bg-yellow-100 text-yellow-800',
  Collected: 'bg-blue-100 text-blue-800',
  'In Transit': 'bg-orange-100 text-orange-800',
  Treated: 'bg-green-100 text-green-800',
  Disposed: 'bg-green-200 text-green-900',
};

const DEPARTMENTS = ['Surgery', 'ICU', 'Laboratory', 'Pharmacy', 'Radiology', 'Maternity', 'Kitchen', 'Emergency', 'OPD', 'Wards'];

export default function MedicalWasteTracking() {
  const [records] = useState<WasteRecord[]>(SAMPLE_WASTE);
  const [tab, setTab] = useState<'overview' | 'tracking' | 'compliance' | 'reports' | 'settings'>('overview');
  const [showForm, setShowForm] = useState(false);
  const [catFilter, setCatFilter] = useState<string>('all');
  const toast = useToast();

  const filtered = catFilter === 'all' ? records : records.filter(r => r.category === catFilter);
  const totalWeight = records.reduce((s, r) => s + r.weight, 0);
  const nonCompliant = records.filter(r => !r.compliant);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">♻️ Medical Waste Tracking</h1>
          <p className="text-gray-600 mt-1">Waste generation · Segregation · Collection · Treatment · Compliance</p>
        </div>
        <button onClick={() => { setShowForm(true); toast('New waste record form opened', 'success'); }} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">+ Log Waste</button>
      </div>

      {/* Category Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(WASTE_CATEGORIES).map(([key, cat]) => {
          const total = records.filter(r => r.category === key).reduce((s, r) => s + r.weight, 0);
          return (
            <button key={key} onClick={() => setCatFilter(catFilter === key ? 'all' : key)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${catFilter === key ? 'ring-2 ring-blue-500' : ''} ${cat.color}`}>
              <span>{cat.icon}</span>
              <span className="font-medium">{cat.label}</span>
              <span className="font-bold">{total.toFixed(1)} kg</span>
            </button>
          );
        })}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Today', value: `${totalWeight.toFixed(1)} kg`, icon: '📦', color: 'text-blue-600' },
          { label: 'Red (Infectious)', value: `${records.filter(r => r.category === 'Red').reduce((s, r) => s + r.weight, 0).toFixed(1)} kg`, icon: '🔴', color: 'text-red-600' },
          { label: 'Sharps', value: `${records.filter(r => r.category === 'Sharps').reduce((s, r) => s + r.weight, 0).toFixed(1)} kg`, icon: '💉', color: 'text-orange-600' },
          { label: 'Collected', value: records.filter(r => r.status === 'Collected' || r.status === 'Treated' || r.status === 'Disposed').length, icon: '🚚', color: 'text-green-600' },
          { label: 'Pending Pickup', value: records.filter(r => r.status === 'Generated' || r.status === 'Stored').length, icon: '⏳', color: 'text-yellow-600' },
          { label: 'Non-Compliant', value: nonCompliant.length, icon: '⚠️', color: 'text-red-600' },
        ].map((stat, i) => (
          <Card key={i} className="p-4">
            <div className="text-sm text-gray-500">{stat.icon} {stat.label}</div>
            <div className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {(['overview', 'tracking', 'compliance', 'reports', 'settings'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === t ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'tracking' ? '📦 Tracking' : t === 'compliance' ? '✅ Compliance' : t === 'reports' ? '📈 Reports' : '⚙️ Settings'}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Waste by Category</h3>
            <div className="space-y-3">
              {Object.entries(WASTE_CATEGORIES).map(([key, cat]) => {
                const total = records.filter(r => r.category === key).reduce((s, r) => s + r.weight, 0);
                const pct = totalWeight > 0 ? (total / totalWeight * 100) : 0;
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className={`${cat.color} px-2 py-0.5 rounded-full text-xs font-medium`}>{cat.icon} {cat.label}</span>
                      <span className="text-gray-600">{total.toFixed(1)} kg ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full ${cat.barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Waste by Department</h3>
            <div className="space-y-2">
              {Object.entries(records.reduce<Record<string, { count: number; weight: number }>>((acc, r) => {
                if (!acc[r.department]) acc[r.department] = { count: 0, weight: 0 };
                acc[r.department].count++;
                acc[r.department].weight += r.weight;
                return acc;
              }, {})).sort((a, b) => b[1].weight - a[1].weight).map(([dept, data]) => (
                <div key={dept} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium">{dept}</div>
                    <div className="text-xs text-gray-500">{data.count} batches</div>
                  </div>
                  <div className="text-sm font-bold text-gray-700">{data.weight.toFixed(1)} kg</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Disposal Pipeline</h3>
            <div className="flex items-center justify-between gap-2">
              {['Generated', 'Stored', 'Collected', 'In Transit', 'Treated', 'Disposed'].map((step, i) => {
                const count = records.filter(r => r.status === step).length;
                return (
                  <div key={step} className="flex-1 text-center">
                    <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-white font-bold ${i <= 3 ? 'bg-blue-500' : 'bg-green-500'}`}>{count}</div>
                    <div className="text-xs text-gray-600 mt-2">{step}</div>
                    {i < 5 && <div className="text-gray-400 text-lg">→</div>}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Segregation Guide</h3>
            <div className="space-y-2">
              {Object.entries(WASTE_CATEGORIES).map(([key, cat]) => (
                <div key={key} className={`p-2 rounded-lg ${cat.color} bg-opacity-20`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cat.icon}</span>
                    <div>
                      <div className="text-sm font-bold">{cat.label}</div>
                      <div className="text-xs text-gray-600">{cat.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tracking Tab */}
      {tab === 'tracking' && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Weight</th>
                <th className="px-4 py-3 text-left">Treatment</th>
                <th className="px-4 py-3 text-left">Manifest</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{r.id}</td>
                  <td className="px-4 py-3"><div className="font-medium">{r.department}</div><div className="text-xs text-gray-500">{r.ward}</div></td>
                  <td className="px-4 py-3"><Badge className={WASTE_CATEGORIES[r.category].color}>{WASTE_CATEGORIES[r.category].icon} {WASTE_CATEGORIES[r.category].label}</Badge></td>
                  <td className="px-4 py-3 text-sm max-w-[200px] truncate">{r.description}</td>
                  <td className="px-4 py-3 font-bold">{r.weight} kg</td>
                  <td className="px-4 py-3 text-sm">{r.treatmentMethod}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.manifestId}</td>
                  <td className="px-4 py-3"><Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Compliance Tab */}
      {tab === 'compliance' && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Segregation Compliance</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-600">{((records.filter(r => r.compliant).length / records.length) * 100).toFixed(0)}%</div>
                <div className="text-sm text-green-800">Compliant</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg text-center">
                <div className="text-3xl font-bold text-red-600">{nonCompliant.length}</div>
                <div className="text-sm text-red-800">Non-Compliant</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-600">{records.length}</div>
                <div className="text-sm text-blue-800">Total Records</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <div className="text-3xl font-bold text-purple-600">{records.filter(r => r.status === 'Disposed').length}</div>
                <div className="text-sm text-purple-800">Properly Disposed</div>
              </div>
            </div>
          </Card>

          {nonCompliant.length > 0 && (
            <Card className="p-6">
              <h3 className="font-bold text-red-800 mb-4">⚠️ Non-Compliant Records — Action Required</h3>
              <div className="space-y-3">
                {nonCompliant.map(r => (
                  <div key={r.id} className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-red-800">{r.id} — {r.department}/{r.ward}</div>
                        <div className="text-sm text-red-600">{r.description}</div>
                        <div className="text-xs text-gray-500 mt-1">Generated by: {r.generator} · {r.date}</div>
                      </div>
                      <Badge className="bg-red-200 text-red-900">Non-Compliant</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Regulatory Requirements</h3>
            <div className="space-y-2">
              {[
                'EPA Ghana Environmental Assessment Rules, 1999 (LI 1652)',
                'Health Facilities Regulatory Authority (HeFRA) Standards',
                'WHO Guidelines for Safe Management of Waste from Health-Care Activities',
                'Environmental Assessment Regulations 1999 - Hazardous Waste Management',
                'Ghana Food and Drugs Authority — Pharmaceutical Waste Guidelines',
              ].map((rule, i) => (
                <div key={i} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                  <span className="text-blue-600 mt-0.5">📋</span>
                  <span className="text-sm text-gray-700">{rule}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Reports Tab */}
      {tab === 'reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Weekly Waste Generation Trend</h3>
            <div className="flex items-end gap-2 h-40">
              {[120, 95, 135, 110, 88, 142, 98].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="text-xs font-bold text-blue-600">{val}</div>
                  <div className="w-full bg-blue-500 rounded-t" style={{ height: `${(val / 150) * 100}%` }} />
                  <div className="text-xs text-gray-500 mt-1">{'Mon Tue Wed Thu Fri Sat Sun'.split(' ')[i]}</div>
                </div>
              ))}
            </div>
            <div className="text-center text-xs text-gray-500 mt-2">Weight in kg</div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Monthly Comparison</h3>
            <div className="flex items-end gap-2 h-40">
              {[2800, 3100, 2950, 3200, 2700, 3000].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="text-xs font-bold text-green-600">{(val / 1000).toFixed(1)}k</div>
                  <div className="w-full bg-green-500 rounded-t" style={{ height: `${(val / 3500) * 100}%` }} />
                  <div className="text-xs text-gray-500 mt-1">{'Feb Mar Apr May Jun Jul'.split(' ')[i]}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Treatment Method Distribution</h3>
            <div className="space-y-3">
              {Object.entries(records.reduce<Record<string, number>>((acc, r) => {
                acc[r.treatmentMethod] = (acc[r.treatmentMethod] || 0) + r.weight;
                return acc;
              }, {})).sort((a, b) => b[1] - a[1]).map(([method, weight]) => {
                const pct = totalWeight > 0 ? (weight / totalWeight * 100) : 0;
                return (
                  <div key={method}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{method}</span>
                      <span className="font-bold">{weight.toFixed(1)} kg ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Transporter Performance</h3>
            <div className="space-y-3">
              {Object.entries(records.reduce<Record<string, { count: number; weight: number }>>((acc, r) => {
                if (!acc[r.transporter]) acc[r.transporter] = { count: 0, weight: 0 };
                acc[r.transporter].count++;
                acc[r.transporter].weight += r.weight;
                return acc;
              }, {})).map(([transporter, data]) => (
                <div key={transporter} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">{transporter}</div>
                    <span className="text-sm text-gray-600">{data.count} pickups · {data.weight.toFixed(1)} kg</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Settings Tab */}
      {tab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Registered Transporters</h3>
            <div className="space-y-2">
              {['EcoMed Disposal', 'PharmaCycle Ghana', 'Atomics Ghana', 'ChemSafe Ghana', 'Accra Waste Mgmt'].map(t => (
                <div key={t} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">{t}</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Department Waste Bins</h3>
            <div className="space-y-2">
              {DEPARTMENTS.map(d => (
                <div key={d} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">{d}</span>
                  <span className="text-xs text-gray-500">{Object.keys(WASTE_CATEGORIES).length} bins assigned</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Waste Log Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Log Medical Waste</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select className="w-full border rounded-lg px-3 py-2">
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select className="w-full border rounded-lg px-3 py-2">
                    {Object.entries(WASTE_CATEGORIES).map(([key, cat]) => <option key={key}>{cat.icon} {cat.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea className="w-full border rounded-lg px-3 py-2" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <input type="number" step="0.1" className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Generated By</label>
                  <input type="text" className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Method</label>
                <select className="w-full border rounded-lg px-3 py-2">
                  <option>Incineration</option><option>Autoclave</option><option>Chemical Treatment</option><option>Landfill</option><option>Recycling</option><option>Special Disposal</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => { setShowForm(false); toast('Waste record logged successfully', 'success'); }} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Log Waste</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
