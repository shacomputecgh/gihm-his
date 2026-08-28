import { useState } from 'react';

import AddNewForm from '../../components/AddNewForm';
import { Card, PageHeader, Select } from '../../components/ui';

const MONTHLY_DATA = [
  { month: 'Jan', revenue: 45200, expenses: 32100, patients: 320, insurance: 18000, cash: 27200 },
  { month: 'Feb', revenue: 52300, expenses: 35400, patients: 380, insurance: 22000, cash: 30300 },
  { month: 'Mar', revenue: 48700, expenses: 33200, patients: 350, insurance: 19500, cash: 29200 },
  { month: 'Apr', revenue: 55100, expenses: 38600, patients: 410, insurance: 24000, cash: 31100 },
  { month: 'May', revenue: 61800, expenses: 41200, patients: 450, insurance: 27000, cash: 34800 },
  { month: 'Jun', revenue: 58400, expenses: 39800, patients: 430, insurance: 25500, cash: 32900 },
];

const DEPT_REVENUE = [
  { dept: 'Outpatient', amount: 125000, color: 'bg-blue-500' },
  { dept: 'Pharmacy', amount: 89000, color: 'bg-green-500' },
  { dept: 'Laboratory', amount: 67000, color: 'bg-cyan-500' },
  { dept: 'Radiology', amount: 45000, color: 'bg-purple-500' },
  { dept: 'Surgery', amount: 98000, color: 'bg-red-500' },
  { dept: 'Maternity', amount: 34000, color: 'bg-pink-500' },
];

const TOP_SERVICES = [
  { name: 'General Consultation', count: 450, revenue: 67500 },
  { name: 'CBC Blood Test', count: 320, revenue: 25600 },
  { name: 'Chest X-Ray', count: 180, revenue: 36000 },
  { name: 'Malaria Test', count: 290, revenue: 14500 },
  { name: 'Delivery (Normal)', count: 85, revenue: 85000 },
  { name: 'Appendectomy', count: 22, revenue: 66000 },
];

export default function RevenueDashboard() {

  const [period, setPeriod] = useState('6months');

  const totalRevenue = MONTHLY_DATA.reduce((s, m) => s + m.revenue, 0);
  const totalExpenses = MONTHLY_DATA.reduce((s, m) => s + m.expenses, 0);
  const totalPatients = MONTHLY_DATA.reduce((s, m) => s + m.patients, 0);
  const totalInsurance = MONTHLY_DATA.reduce((s, m) => s + m.insurance, 0);
  const totalCash = MONTHLY_DATA.reduce((s, m) => s + m.cash, 0);
  const profit = totalRevenue - totalExpenses;
  const maxRevenue = Math.max(...MONTHLY_DATA.map((m) => m.revenue));
  const maxDeptRevenue = Math.max(...DEPT_REVENUE.map((d) => d.amount));

  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);
  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">
          {showAdd ? "\u2715 Cancel" : "+ Add New"}
        </button>
      </div>
      {showAdd && (
        <AddNewForm
          title="Add New Revenue Metric"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader
        title="💰 Revenue Dashboard"
        subtitle={`Financial analytics for your facility · ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`}
        action={
          <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-40">
            <option value="1month">This Month</option>
            <option value="3months">3 Months</option>
            <option value="6months">6 Months</option>
            <option value="1year">1 Year</option>
          </Select>
        }
      />

      {/* Summary Cards */}
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><p className="text-xs font-bold text-slate-400">Total Revenue</p><p className="text-2xl font-extrabold text-green-600">GH₵ {totalRevenue.toLocaleString()}</p></Card>
        <Card><p className="text-xs font-bold text-slate-400">Total Expenses</p><p className="text-2xl font-extrabold text-red-600">GH₵ {totalExpenses.toLocaleString()}</p></Card>
        <Card><p className="text-xs font-bold text-slate-400">Net Profit</p><p className={`text-2xl font-extrabold ${profit > 0 ? 'text-green-600' : 'text-red-600'}`}>GH₵ {profit.toLocaleString()}</p></Card>
        <Card><p className="text-xs font-bold text-slate-400">Total Patients</p><p className="text-2xl font-extrabold text-blue-600">{totalPatients.toLocaleString()}</p></Card>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card><p className="text-xs font-bold text-slate-400">Insurance Collections</p><p className="text-xl font-bold text-purple-600">GH₵ {totalInsurance.toLocaleString()}</p><p className="text-xs text-slate-400">{Math.round((totalInsurance / totalRevenue) * 100)}% of revenue</p></Card>
        <Card><p className="text-xs font-bold text-slate-400">Cash Collections</p><p className="text-xl font-bold text-emerald-600">GH₵ {totalCash.toLocaleString()}</p><p className="text-xs text-slate-400">{Math.round((totalCash / totalRevenue) * 100)}% of revenue</p></Card>
        <Card><p className="text-xs font-bold text-slate-400">Revenue Per Patient</p><p className="text-xl font-bold text-amber-600">GH₵ {Math.round(totalRevenue / totalPatients)}</p></Card>
      </div>

      {/* Monthly Revenue Chart */}
      <Card title="Monthly Revenue vs Expenses" subtitle="Bar chart showing financial performance over time">
        <div className="flex items-end gap-3 h-48">
          {MONTHLY_DATA.map((m) => (
            <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full flex flex-col items-center gap-0.5">
                <div className="w-full rounded-t bg-green-500" style={{ height: `${(m.revenue / maxRevenue) * 140}px` }} title={`Revenue: GH₵ ${m.revenue.toLocaleString()}`} />
                <div className="w-full rounded-b bg-red-400" style={{ height: `${(m.expenses / maxRevenue) * 140}px` }} title={`Expenses: GH₵ ${m.expenses.toLocaleString()}`} />
              </div>
              <p className="text-[10px] font-semibold text-slate-500">{m.month}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-green-500" /> Revenue</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-red-400" /> Expenses</span>
        </div>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* Department Revenue */}
        <Card title="Revenue by Department" subtitle="Which departments generate the most revenue">
          <div className="space-y-3">
            {DEPT_REVENUE.map((d) => (
              <div key={d.dept}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">{d.dept}</span>
                  <span className="font-bold text-slate-800">GH₵ {d.amount.toLocaleString()}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${d.color}`} style={{ width: `${(d.amount / maxDeptRevenue) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Services */}
        <Card title="Top Revenue Services" subtitle="Most profitable services">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase text-slate-400">
                  <th className="py-2">Service</th>
                  <th className="py-2 text-right">Count</th>
                  <th className="py-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {TOP_SERVICES.map((s, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2 font-semibold text-slate-700">{s.name}</td>
                    <td className="py-2 text-right text-slate-500">{s.count}</td>
                    <td className="py-2 text-right font-bold text-green-600">GH₵ {s.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Payment Method Split */}
      <Card title="Payment Method Breakdown" subtitle="How patients pay for services">
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { method: 'Cash', amount: totalCash, icon: '💵', color: 'bg-green-100 text-green-700' },
            { method: 'NHIS', amount: totalInsurance * 0.6, icon: '🏥', color: 'bg-blue-100 text-blue-700' },
            { method: 'Private Insurance', amount: totalInsurance * 0.4, icon: '💳', color: 'bg-purple-100 text-purple-700' },
            { method: 'Mobile Money', amount: totalRevenue * 0.15, icon: '📱', color: 'bg-amber-100 text-amber-700' },
          ].map((p) => (
            <div key={p.method} className={`rounded-xl ${p.color} p-4`}>
              <span className="text-2xl">{p.icon}</span>
              <p className="mt-2 text-sm font-bold">{p.method}</p>
              <p className="text-lg font-extrabold">GH₵ {Math.round(p.amount).toLocaleString()}</p>
              <p className="text-[10px] opacity-70">{Math.round((p.amount / totalRevenue) * 100)}% of total</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
