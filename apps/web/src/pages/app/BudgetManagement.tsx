import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Card, PageHeader } from '../../components/ui';

type BudgetTab = 'overview' | 'departments' | 'projections';

interface BudgetItem {
  department: string; category: string; budgeted: number; spent: number; committed: number;
}

const MOCK_BUDGET: BudgetItem[] = [
  { department: 'Administration', category: 'Salaries & Wages', budgeted: 500000, spent: 245000, committed: 125000 },
  { department: 'Administration', category: 'Utilities', budgeted: 80000, spent: 38000, committed: 15000 },
  { department: 'Administration', category: 'Office Supplies', budgeted: 30000, spent: 12000, committed: 5000 },
  { department: 'Clinical', category: 'Medical Supplies', budgeted: 350000, spent: 180000, committed: 75000 },
  { department: 'Clinical', category: 'Medications', budgeted: 600000, spent: 320000, committed: 85000 },
  { department: 'Clinical', category: 'Equipment Maintenance', budgeted: 150000, spent: 65000, committed: 40000 },
  { department: 'Laboratory', category: 'Reagents & Consumables', budgeted: 200000, spent: 95000, committed: 50000 },
  { department: 'Laboratory', category: 'Equipment', budgeted: 250000, spent: 250000, committed: 0 },
  { department: 'Pharmacy', category: 'Drug Procurement', budgeted: 800000, spent: 420000, committed: 120000 },
  { department: 'Radiology', category: 'Contrast Media', budgeted: 100000, spent: 45000, committed: 20000 },
  { department: 'Radiology', category: 'Equipment Lease', budgeted: 300000, spent: 150000, committed: 75000 },
  { department: 'Surgery', category: 'Surgical Supplies', budgeted: 400000, spent: 210000, committed: 60000 },
  { department: 'Surgery', category: 'Implants', budgeted: 500000, spent: 180000, committed: 120000 },
  { department: 'IT', category: 'Software & Licenses', budgeted: 120000, spent: 60000, committed: 30000 },
  { department: 'IT', category: 'Hardware', budgeted: 80000, spent: 35000, committed: 20000 },
];

export default function BudgetManagement() {
  const [tab, setTab] = useState<BudgetTab>('overview');

  const totalBudgeted = MOCK_BUDGET.reduce((s, b) => s + b.budgeted, 0);
  const totalSpent = MOCK_BUDGET.reduce((s, b) => s + b.spent, 0);
  const totalCommitted = MOCK_BUDGET.reduce((s, b) => s + b.committed, 0);
  const totalRemaining = totalBudgeted - totalSpent - totalCommitted;
  const utilizationPct = totalBudgeted > 0 ? ((totalSpent / totalBudgeted) * 100).toFixed(1) : '0';

  const departments = [...new Set(MOCK_BUDGET.map(b => b.department))];

  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);
  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">
          {showAdd ? "\u2715 Cancel" : "+ Add New"}
        </button>
      </div>
      {showAdd && (
        <AddNewForm
          title="Add New Lab"
          fields={[{"name": "patientName", "label": "Patient Name", "type": "text", "placeholder": "Patient name", "required": true}, {"name": "testType", "label": "Test Type", "type": "select", "options": ["Blood Test", "Urine Test", "Stool Test", "X-Ray", "Ultrasound", "ECG", "Biopsy"]}, {"name": "priority", "label": "Priority", "type": "select", "options": ["Routine", "Urgent", "STAT"]}, {"name": "clinicalHistory", "label": "Clinical History", "type": "textarea", "placeholder": "Relevant clinical information"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Budget & Financial Planning" subtitle="Budget tracking, expenditure monitoring, and financial projections" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-blue-600">GH₵ {(totalBudgeted / 1000).toFixed(0)}K</div><div className="text-xs text-slate-500">Total Budget</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-red-600">GH₵ {(totalSpent / 1000).toFixed(0)}K</div><div className="text-xs text-slate-500">Spent ({utilizationPct}%)</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-amber-600">GH₵ {(totalCommitted / 1000).toFixed(0)}K</div><div className="text-xs text-slate-500">Committed</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">GH₵ {(totalRemaining / 1000).toFixed(0)}K</div><div className="text-xs text-slate-500">Remaining</div></Card>
      </div>

      {/* Budget Utilization Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2"><span className="font-bold text-xs text-slate-600">📊 Budget Utilization</span><span className="text-sm font-bold text-blue-600">{utilizationPct}%</span></div>
        <div className="h-6 bg-slate-100 rounded-full overflow-hidden flex">
          <div className="h-full bg-red-500 transition-all" style={{ width: `${(totalSpent / totalBudgeted) * 100}%` }} title="Spent" />
          <div className="h-full bg-amber-400 transition-all" style={{ width: `${(totalCommitted / totalBudgeted) * 100}%` }} title="Committed" />
        </div>
        <div className="flex gap-4 mt-1 text-[10px]">
          <span className="text-red-600">■ Spent</span><span className="text-amber-600">■ Committed</span><span className="text-green-600">■ Available</span>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        {(['overview', 'departments', 'projections'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-xs font-semibold transition ${tab === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {t === 'overview' ? '📋 Overview' : t === 'departments' ? '🏥 Departments' : '📈 Projections'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b text-left text-slate-500">
              <th className="p-2">Department</th><th className="p-2">Category</th><th className="p-2 text-right">Budget</th><th className="p-2 text-right">Spent</th><th className="p-2 text-right">Committed</th><th className="p-2 text-right">Remaining</th><th className="p-2">Utilization</th>
            </tr></thead>
            <tbody>
              {MOCK_BUDGET.map((b, i) => {
                const remaining = b.budgeted - b.spent - b.committed;
                const pct = b.budgeted > 0 ? (b.spent / b.budgeted) * 100 : 0;
                return (
                  <tr key={i} className="border-b hover:bg-slate-50">
                    <td className="p-2 font-medium">{b.department}</td><td className="p-2">{b.category}</td>
                    <td className="p-2 text-right">GH₵ {b.budgeted.toLocaleString()}</td>
                    <td className="p-2 text-right text-red-600 font-bold">GH₵ {b.spent.toLocaleString()}</td>
                    <td className="p-2 text-right text-amber-600">GH₵ {b.committed.toLocaleString()}</td>
                    <td className={`p-2 text-right font-bold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>GH₵ {remaining.toLocaleString()}</td>
                    <td className="p-2"><div className="h-2 bg-slate-100 rounded-full overflow-hidden w-20"><div className={`h-full rounded-full ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} /></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'departments' && (
        <div className="space-y-3">
          {departments.map(dept => {
            const items = MOCK_BUDGET.filter(b => b.department === dept);
            const deptBudget = items.reduce((s, b) => s + b.budgeted, 0);
            const deptSpent = items.reduce((s, b) => s + b.spent, 0);
            const deptPct = deptBudget > 0 ? (deptSpent / deptBudget) * 100 : 0;
            return (
              <Card key={dept} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-sm text-slate-800">🏥 {dept}</h3>
                  <span className="text-xs font-bold text-blue-600">GH₵ {(deptSpent / 1000).toFixed(0)}K / GH₵ {(deptBudget / 1000).toFixed(0)}K ({deptPct.toFixed(0)}%)</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div className={`h-full rounded-full ${deptPct > 90 ? 'bg-red-500' : deptPct > 70 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${Math.min(deptPct, 100)}%` }} />
                </div>
                {items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1 text-xs border-b last:border-0">
                    <span className="text-slate-600">{item.category}</span>
                    <span className="text-red-600">GH₵ {item.spent.toLocaleString()}</span>
                  </div>
                ))}
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'projections' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">📈 Monthly Projection</h3>
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => {
              const monthBudget = totalBudgeted / 12;
              const monthSpent = i < 5 ? (totalSpent / 5) * (1 + Math.random() * 0.2) : monthBudget * (1 + (i - 5) * 0.05);
              const pct = (monthSpent / monthBudget) * 100;
              return (
                <div key={m} className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-slate-500 w-8">{m}</span>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${i < 5 ? (pct > 100 ? 'bg-red-500' : 'bg-blue-500') : 'bg-slate-300'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-400 w-16 text-right">GH₵ {(monthSpent / 1000).toFixed(0)}K</span>
                </div>
              );
            })}
          </Card>
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">📊 Year-End Projection</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs"><span className="text-slate-600">Projected Total Spend</span><span className="font-bold text-red-600">GH₵ {((totalSpent / 5) * 12 / 1000).toFixed(0)}K</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-600">Annual Budget</span><span className="font-bold text-blue-600">GH₵ {(totalBudgeted / 1000).toFixed(0)}K</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-600">Projected Variance</span><span className={`font-bold ${((totalSpent / 5) * 12) > totalBudgeted ? 'text-red-600' : 'text-green-600'}`}>GH₵ {(((totalSpent / 5) * 12 - totalBudgeted) / 1000).toFixed(0)}K</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-600">Burn Rate (Monthly)</span><span className="font-bold">GH₵ {(totalSpent / 5 / 1000).toFixed(0)}K</span></div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
