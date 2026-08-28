import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface Project {
  id: string; name: string; description: string; budget: number;
  spent: number; startDate: string; endDate: string;
  status: 'Planning' | 'In Progress' | 'On Hold' | 'Completed';
  progress: number; manager: string; category: string;
}

const PROJECTS: Project[] = [
  { id: 'PJ-001', name: 'New Emergency Department', description: 'Construction of 20-bed emergency department with trauma bay', budget: 2500000, spent: 1800000, startDate: '2025-06-01', endDate: '2026-12-31', status: 'In Progress', progress: 72, manager: 'Eng. Samuel Osei', category: 'Construction' },
  { id: 'PJ-002', name: 'MRI Scanner Procurement', description: 'Purchase and installation of 1.5T MRI scanner', budget: 800000, spent: 800000, startDate: '2025-09-01', endDate: '2026-06-30', status: 'Completed', progress: 100, manager: 'Dr. Sarah Johnson', category: 'Equipment' },
  { id: 'PJ-003', name: 'IT Infrastructure Upgrade', description: 'Network upgrade, server room, and PABX system', budget: 350000, spent: 120000, startDate: '2026-07-01', endDate: '2026-12-31', status: 'In Progress', progress: 35, manager: 'IT Director', category: 'IT' },
  { id: 'PJ-004', name: 'Solar Power Installation', description: '200kW solar panel system for energy independence', budget: 500000, spent: 0, startDate: '2026-10-01', endDate: '2027-06-30', status: 'Planning', progress: 5, manager: 'Facilities Manager', category: 'Energy' },
  { id: 'PJ-005', name: 'Paediatric Ward Renovation', description: 'Complete renovation of 30-bed paediatric ward', budget: 400000, spent: 280000, startDate: '2026-03-01', endDate: '2026-09-30', status: 'In Progress', progress: 70, manager: 'Eng. Samuel Osei', category: 'Renovation' },
];

const STATUS_COLORS: Record<string, string> = { Planning: 'bg-blue-100 text-blue-800', 'In Progress': 'bg-yellow-100 text-yellow-800', 'On Hold': 'bg-orange-100 text-orange-800', Completed: 'bg-green-100 text-green-800' };

export default function CapitalProjects() {
  const totalBudget = PROJECTS.reduce((s, p) => s + p.budget, 0);
  const totalSpent = PROJECTS.reduce((s, p) => s + p.spent, 0);

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
          title="Add New Ward"
          fields={[{"name": "wardName", "label": "Ward Name", "type": "text", "placeholder": "e.g. Medical Ward 3", "required": true}, {"name": "wardType", "label": "Ward Type", "type": "select", "options": ["Medical", "Surgical", "Paediatric", "Maternity", "ICU", "NICU", "Emergency", "Psychiatric", "Oncology"]}, {"name": "capacity", "label": "Bed Capacity", "type": "number", "placeholder": "0", "required": true}, {"name": "headNurse", "label": "Head Nurse", "type": "text", "placeholder": "Nurse name"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Capital Projects</h1><p className="text-gray-500">Hospital expansion, renovation, equipment procurement, and infrastructure projects</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Total Budget', value: `GH₵ ${(totalBudget/1000000).toFixed(1)}M`, color: 'text-blue-600' }, { label: 'Total Spent', value: `GH₵ ${(totalSpent/1000000).toFixed(1)}M`, color: 'text-orange-600' }, { label: 'Active Projects', value: PROJECTS.filter(p => p.status === 'In Progress').length, color: 'text-yellow-600' }, { label: 'Completed', value: PROJECTS.filter(p => p.status === 'Completed').length, color: 'text-green-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="space-y-4">
        {PROJECTS.map(p => (
          <div key={p.id} className="bg-white rounded-lg border p-5">
            <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><span className="font-mono text-xs text-gray-500">{p.id}</span><span className="font-bold">{p.name}</span><Badge className="bg-gray-100 text-gray-800">{p.category}</Badge></div><Badge className={STATUS_COLORS[p.status]}>{p.status}</Badge></div>
            <p className="text-sm text-gray-600 mb-3">{p.description}</p>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2"><div className="bg-blue-600 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ width: `${p.progress}%` }}>{p.progress}%</div></div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
              <div><span className="text-gray-500">Budget:</span> <span className="font-bold">GH₵ {p.budget.toLocaleString()}</span></div>
              <div><span className="text-gray-500">Spent:</span> <span className="font-bold text-orange-600">GH₵ {p.spent.toLocaleString()}</span></div>
              <div><span className="text-gray-500">Remaining:</span> <span className="font-bold text-green-600">GH₵ {(p.budget - p.spent).toLocaleString()}</span></div>
              <div><span className="text-gray-500">Start:</span> {p.startDate}</div>
              <div><span className="text-gray-500">End:</span> {p.endDate}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
