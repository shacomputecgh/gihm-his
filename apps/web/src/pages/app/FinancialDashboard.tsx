import { useState } from 'react';
import { Badge, Card } from '../../components/ui';

interface DeptFinance { dept: string; revenue: number; expenses: number; margin: number; patients: number; avgBill: number; }
interface MonthlyRevenue { month: string; revenue: number; expenses: number; }

const DEPT_FINANCES: DeptFinance[] = [
  { dept: 'Pharmacy', revenue: 125000, expenses: 98000, margin: 21.6, patients: 450, avgBill: 277.78 },
  { dept: 'Laboratory', revenue: 89000, expenses: 52000, margin: 41.6, patients: 380, avgBill: 234.21 },
  { dept: 'Radiology', revenue: 67000, expenses: 41000, margin: 38.8, patients: 120, avgBill: 558.33 },
  { dept: 'Theatre', revenue: 210000, expenses: 145000, margin: 31.0, patients: 45, avgBill: 4666.67 },
  { dept: 'Maternity', revenue: 156000, expenses: 112000, margin: 28.2, patients: 95, avgBill: 1642.11 },
  { dept: 'OPD', revenue: 78000, expenses: 35000, margin: 55.1, patients: 890, avgBill: 87.64 },
  { dept: 'ICU', revenue: 340000, expenses: 280000, margin: 17.6, patients: 22, avgBill: 15454.55 },
  { dept: 'Dental', revenue: 45000, expenses: 28000, margin: 37.8, patients: 180, avgBill: 250.00 },
];

const MONTHLY: MonthlyRevenue[] = [
  { month: 'Mar', revenue: 680000, expenses: 490000 },
  { month: 'Apr', revenue: 720000, expenses: 510000 },
  { month: 'May', revenue: 790000, expenses: 530000 },
  { month: 'Jun', revenue: 850000, expenses: 560000 },
  { month: 'Jul', revenue: 920000, expenses: 580000 },
  { month: 'Aug', revenue: 890000, expenses: 550000 },
];

export default function FinancialDashboard() {
  const [period, setPeriod] = useState('month');
  const totalRevenue = DEPT_FINANCES.reduce((s, d) => s + d.revenue, 0);
  const totalExpenses = DEPT_FINANCES.reduce((s, d) => s + d.expenses, 0);
  const _totalPatients = DEPT_FINANCES.reduce((s, d) => s + d.patients, 0);
  const overallMargin = ((totalRevenue - totalExpenses) / totalRevenue * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financial Dashboard</h1>
          <p className="text-slate-500 text-sm">Revenue, expenses and profit analysis by department</p>
        </div>
        <div className="flex gap-2">
          {['week', 'month', 'quarter', 'year'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 rounded-lg text-sm font-medium ${period === p ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{p.charAt(0).toUpperCase() + p.slice(1)}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-slate-500">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">GH₵ {totalRevenue.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Total Expenses</p>
          <p className="text-2xl font-bold text-red-600">GH₵ {totalExpenses.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Net Profit</p>
          <p className="text-2xl font-bold text-blue-600">GH₵ {(totalRevenue - totalExpenses).toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500">Profit Margin</p>
          <p className="text-2xl font-bold text-emerald-600">{overallMargin}%</p>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Revenue vs Expenses by Department</h2>
        <div className="space-y-3">
          {DEPT_FINANCES.sort((a, b) => b.revenue - a.revenue).map(d => (
            <div key={d.dept} className="flex items-center gap-4">
              <span className="w-24 text-sm font-medium text-slate-700">{d.dept}</span>
              <div className="flex-1">
                <div className="flex gap-1 h-6">
                  <div className="bg-green-400 rounded-l" style={{ width: `${(d.revenue / 350000) * 100}%` }} />
                  <div className="bg-red-300 rounded-r" style={{ width: `${(d.expenses / 350000) * 100}%` }} />
                </div>
              </div>
              <span className="w-20 text-right text-sm font-medium text-green-600">GH₵ {(d.revenue / 1000).toFixed(0)}k</span>
              <span className="w-16 text-right text-xs text-slate-500">{d.margin}%</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-400 rounded" /> Revenue</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-300 rounded" /> Expenses</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h2 className="font-semibold mb-3">Department Performance</h2>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-slate-500"><th className="py-2">Dept</th><th className="text-right">Patients</th><th className="text-right">Avg Bill</th><th className="text-right">Revenue</th></tr></thead>
            <tbody>
              {DEPT_FINANCES.sort((a, b) => b.avgBill - a.avgBill).map(d => (
                <tr key={d.dept} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="py-2 font-medium">{d.dept}</td>
                  <td className="text-right">{d.patients}</td>
                  <td className="text-right">GH₵ {d.avgBill.toFixed(0)}</td>
                  <td className="text-right font-medium">GH₵ {d.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card className="p-4">
          <h2 className="font-semibold mb-3">Monthly Trend</h2>
          <div className="space-y-2">
            {MONTHLY.map(m => (
              <div key={m.month} className="flex items-center gap-3">
                <span className="w-10 text-sm text-slate-500">{m.month}</span>
                <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden flex">
                  <div className="bg-green-400 h-full" style={{ width: `${(m.revenue / 1000000) * 100}%` }} />
                  <div className="bg-red-300 h-full" style={{ width: `${(m.expenses / 1000000) * 100}%` }} />
                </div>
                <span className="w-16 text-right text-xs font-medium">GH₵ {(m.revenue / 1000).toFixed(0)}k</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Insurance vs Cash Collection</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div><p className="text-3xl font-bold text-blue-600">GH₵ 380,000</p><p className="text-xs text-slate-500">NHIS Claims</p><Badge tone="blue">42%</Badge></div>
          <div><p className="text-3xl font-bold text-green-600">GH₵ 350,000</p><p className="text-xs text-slate-500">Cash Payments</p><Badge tone="green">39%</Badge></div>
          <div><p className="text-3xl font-bold text-purple-600">GH₵ 170,000</p><p className="text-xs text-slate-500">Private Insurance</p><Badge tone="purple">19%</Badge></div>
        </div>
      </Card>
    </div>
  );
}
