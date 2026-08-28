import { useState } from 'react';
import { Badge, Card } from '../../components/ui';

interface BudgetLine {
  id: string;
  department: string;
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  period: string;
  status: 'Under Budget' | 'On Budget' | 'Over Budget';
  notes: string;
}

const SAMPLE: BudgetLine[] = [
  { id: 'B-001', department: 'Pharmacy', category: 'Drug Procurement', budgeted: 250000, actual: 235000, variance: -15000, period: 'Aug 2026', status: 'Under Budget', notes: 'Generic substitution savings' },
  { id: 'B-002', department: 'Laboratory', category: 'Reagents & Consumables', budgeted: 120000, actual: 128000, variance: 8000, period: 'Aug 2026', status: 'Over Budget', notes: 'Increased TB testing volume' },
  { id: 'B-003', department: 'Theatre', category: 'Surgical Supplies', budgeted: 180000, actual: 165000, variance: -15000, period: 'Aug 2026', status: 'Under Budget', notes: '' },
  { id: 'B-004', department: 'Radiology', category: 'Film & Contrast', budgeted: 95000, actual: 92000, variance: -3000, period: 'Aug 2026', status: 'Under Budget', notes: 'Digital transition reducing film costs' },
  { id: 'B-005', department: 'Nursing', category: 'PPE & Uniforms', budgeted: 45000, actual: 52000, variance: 7000, period: 'Aug 2026', status: 'Over Budget', notes: 'COVID surge PPE requirements' },
  { id: 'B-006', department: 'Admin', category: 'Office Supplies', budgeted: 25000, actual: 22000, variance: -3000, period: 'Aug 2026', status: 'Under Budget', notes: '' },
  { id: 'B-007', department: 'Facilities', category: 'Maintenance & Utilities', budgeted: 80000, actual: 85000, variance: 5000, period: 'Aug 2026', status: 'Over Budget', notes: 'Generator fuel price increase' },
  { id: 'B-008', department: 'Emergency', category: 'Emergency Supplies', budgeted: 60000, actual: 48000, variance: -12000, period: 'Aug 2026', status: 'Under Budget', notes: '' },
];

const STATUS_COLORS: Record<string, string> = { 'Under Budget': 'bg-green-100 text-green-800', 'On Budget': 'bg-blue-100 text-blue-800', 'Over Budget': 'bg-red-100 text-red-800' };

export default function BudgetTracking() {
  const [tab, setTab] = useState<'overview' | 'departments' | 'variance' | 'trends'>('overview');
  const totalBudgeted = SAMPLE.reduce((s, b) => s + b.budgeted, 0);
  const totalActual = SAMPLE.reduce((s, b) => s + b.actual, 0);
  const totalVariance = totalActual - totalBudgeted;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">💰 Budget Tracking</h1>
        <p className="text-gray-600 mt-1">Department budgets · Variance analysis · Financial trends</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Budget', value: `GH₵${(totalBudgeted / 1000).toFixed(0)}k`, icon: '💰', color: 'text-blue-600' },
          { label: 'Total Actual', value: `GH₵${(totalActual / 1000).toFixed(0)}k`, icon: '📊', color: 'text-purple-600' },
          { label: 'Variance', value: `GH₵${Math.abs(totalVariance / 1000).toFixed(0)}k ${totalVariance > 0 ? '↑' : '↓'}`, icon: totalVariance > 0 ? '📈' : '📉', color: totalVariance > 0 ? 'text-red-600' : 'text-green-600' },
          { label: 'Utilization', value: `${((totalActual / totalBudgeted) * 100).toFixed(0)}%`, icon: '📊', color: 'text-gray-600' },
        ].map((s, i) => (
          <Card key={i} className="p-4"><div className="text-sm text-gray-500">{s.icon} {s.label}</div><div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div></Card>
        ))}
      </div>

      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {(['overview', 'departments', 'variance', 'trends'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === t ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'departments' ? '🏥 Departments' : t === 'variance' ? '📈 Variance' : '📉 Trends'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Budget vs Actual by Department</h3>
            <div className="space-y-3">
              {Object.entries(SAMPLE.reduce<Record<string, { budgeted: number; actual: number }>>((a, b) => {
                if (!a[b.department]) a[b.department] = { budgeted: 0, actual: 0 };
                a[b.department].budgeted += b.budgeted;
                a[b.department].actual += b.actual;
                return a;
              }, {})).sort((a, b) => b[1].budgeted - a[1].budgeted).map(([dept, data]) => {
                const pct = data.budgeted > 0 ? (data.actual / data.budgeted * 100) : 0;
                return (
                  <div key={dept}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{dept}</span>
                      <span className={`font-bold ${pct > 100 ? 'text-red-600' : 'text-green-600'}`}>GH₵{(data.actual / 1000).toFixed(0)}k / {(data.budgeted / 1000).toFixed(0)}k ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 relative">
                      <div className={`h-3 rounded-full ${pct > 100 ? 'bg-red-500' : pct > 90 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      {pct > 100 && <div className="absolute top-0 h-3 bg-red-300 rounded-r" style={{ left: '100%', width: `${Math.min(pct - 100, 20)}%` }} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Budget Status Summary</h3>
            <div className="space-y-3">
              {['Under Budget', 'On Budget', 'Over Budget'].map(status => {
                const count = SAMPLE.filter(b => b.status === status).length;
                const total = SAMPLE.filter(b => b.status === status).reduce((s, b) => s + Math.abs(b.variance), 0);
                return (
                  <div key={status} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <Badge className={STATUS_COLORS[status]}>{status}</Badge>
                      <span className="font-bold">{count} line items</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">GH₵{total.toLocaleString()} {status === 'Over Budget' ? 'over' : 'under'} budget</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {tab === 'departments' && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Budgeted</th>
                <th className="px-4 py-3 text-left">Actual</th>
                <th className="px-4 py-3 text-left">Variance</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE.map(b => (
                <tr key={b.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{b.department}</td>
                  <td className="px-4 py-3 text-sm">{b.category}</td>
                  <td className="px-4 py-3">GH₵{b.budgeted.toLocaleString()}</td>
                  <td className="px-4 py-3 font-bold">GH₵{b.actual.toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`font-bold ${b.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>{b.variance > 0 ? '+' : ''}GH₵{b.variance.toLocaleString()}</span></td>
                  <td className="px-4 py-3"><Badge className={STATUS_COLORS[b.status]}>{b.status}</Badge></td>
                  <td className="px-4 py-3 text-xs max-w-[150px] truncate text-gray-500">{b.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'variance' && (
        <div className="space-y-3">
          {SAMPLE.filter(b => b.variance > 0).sort((a, b) => b.variance - a.variance).map(b => (
            <Card key={b.id} className="p-4 ring-2 ring-red-200">
              <div className="flex justify-between items-center">
                <div><div className="font-bold text-red-800">⚠️ {b.department} — {b.category}</div><div className="text-sm text-gray-600">Budget: GH₵{b.budgeted.toLocaleString()} | Actual: GH₵{b.actual.toLocaleString()}</div></div>
                <span className="text-lg font-bold text-red-600">+GH₵{b.variance.toLocaleString()}</span>
              </div>
              {b.notes && <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded p-2">📝 {b.notes}</div>}
            </Card>
          ))}
        </div>
      )}

      {tab === 'trends' && (
        <Card className="p-6">
          <h3 className="font-bold text-gray-900 mb-4">Monthly Budget Trend</h3>
          <div className="flex items-end gap-2 h-40">
            {[380000, 410000, 395000, 420000, 400000, 415000, 390000, totalActual].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="text-xs font-bold text-blue-600">{(val / 1000).toFixed(0)}k</div>
                <div className="w-full bg-blue-500 rounded-t" style={{ height: `${(val / 450000) * 100}%` }} />
                <div className="text-xs text-gray-500 mt-1">{'Jan Feb Mar Apr May Jun Jul Aug'.split(' ')[i]}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}