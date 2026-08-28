import { useState } from 'react';
import { Card, Badge } from '../../components/ui';

interface PMTask {
  id: string;
  equipment: string;
  department: string;
  taskType: 'Scheduled Maintenance' | 'Breakdown Repair' | 'Electrical' | 'Plumbing' | 'HVAC' | 'Structural';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  scheduledDate: string;
  completedDate: string;
  assignedTo: string;
  description: string;
  cost: number;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  partsReplaced: string[];
  nextPM: string;
}

const SAMPLE: PMTask[] = [
  { id: 'PM-001', equipment: 'HVAC System - ICU', department: 'ICU', taskType: 'HVAC', priority: 'Critical', scheduledDate: '2026-08-25', completedDate: '', assignedTo: 'Facilities Team', description: 'Filter replacement and coil cleaning for ICU air handling unit', cost: 2500, status: 'In Progress', partsReplaced: [], nextPM: '2026-11-25' },
  { id: 'PM-002', equipment: 'Backup Generator', department: 'Facilities', taskType: 'Electrical', priority: 'High', scheduledDate: '2026-08-20', completedDate: '2026-08-20', assignedTo: 'Electrical Contractor', description: 'Monthly generator load test and oil change', cost: 1200, status: 'Completed', partsReplaced: ['Oil Filter', 'Engine Oil'], nextPM: '2026-09-20' },
  { id: 'PM-003', equipment: 'Oxygen Pipeline', department: 'Theatre', taskType: 'Plumbing', priority: 'Critical', scheduledDate: '2026-08-28', completedDate: '', assignedTo: 'Biomed Engineering', description: 'Annual oxygen pipeline integrity test and valve inspection', cost: 3500, status: 'Pending', partsReplaced: [], nextPM: '2027-08-28' },
  { id: 'PM-004', equipment: 'Water Heater - Kitchen', department: 'Kitchen', taskType: 'Plumbing', priority: 'Medium', scheduledDate: '2026-08-15', completedDate: '', assignedTo: 'Plumbing Contractor', description: 'Descale and replace heating element', cost: 800, status: 'Overdue', partsReplaced: [], nextPM: '2027-02-15' },
  { id: 'PM-005', equipment: 'Elevator 2', department: 'Facilities', taskType: 'Scheduled Maintenance', priority: 'High', scheduledDate: '2026-09-01', completedDate: '', assignedTo: 'Otis Service', description: 'Quarterly elevator inspection and lubrication', cost: 1800, status: 'Pending', partsReplaced: [], nextPM: '2026-12-01' },
  { id: 'PM-006', equipment: 'CCTV System', department: 'Security', taskType: 'Electrical', priority: 'Low', scheduledDate: '2026-08-22', completedDate: '2026-08-22', assignedTo: 'IT Team', description: 'Camera cleaning and DVR firmware update', cost: 200, status: 'Completed', partsReplaced: [], nextPM: '2026-11-22' },
];

const PRIORITY_COLORS: Record<string, string> = { Critical: 'bg-red-100 text-red-800', High: 'bg-orange-100 text-orange-800', Medium: 'bg-yellow-100 text-yellow-800', Low: 'bg-green-100 text-green-800' };
const STATUS_COLORS: Record<string, string> = { Pending: 'bg-gray-100 text-gray-800', 'In Progress': 'bg-blue-100 text-blue-800', Completed: 'bg-green-100 text-green-800', Overdue: 'bg-red-100 text-red-800' };

export default function PreventiveMaintenance() {
  const [tasks] = useState<PMTask[]>(SAMPLE);
  const [tab, setTab] = useState<'overview' | 'tasks' | 'assets' | 'costs'>('overview');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏗️ Preventive Maintenance</h1>
          <p className="text-gray-600 mt-1">Scheduled maintenance · Breakdown tracking · Cost management</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: tasks.length, icon: '📋', color: 'text-blue-600' },
          { label: 'Completed', value: tasks.filter(t => t.status === 'Completed').length, icon: '✅', color: 'text-green-600' },
          { label: 'In Progress', value: tasks.filter(t => t.status === 'In Progress').length, icon: '🔧', color: 'text-blue-600' },
          { label: 'Overdue', value: tasks.filter(t => t.status === 'Overdue').length, icon: '🚨', color: 'text-red-600' },
        ].map((s, i) => (
          <Card key={i} className="p-4">
            <div className="text-sm text-gray-500">{s.icon} {s.label}</div>
            <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {(['overview', 'tasks', 'assets', 'costs'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === t ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'tasks' ? '📋 Tasks' : t === 'assets' ? '🏗️ Assets' : '💰 Costs'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Task Status Distribution</h3>
            <div className="space-y-3">
              {['Pending', 'In Progress', 'Completed', 'Overdue'].map(s => {
                const count = tasks.filter(t => t.status === s).length;
                const pct = tasks.length > 0 ? (count / tasks.length * 100) : 0;
                return (
                  <div key={s}>
                    <div className="flex justify-between text-sm mb-1"><Badge className={STATUS_COLORS[s]}>{s}</Badge><span className="font-bold">{count} ({pct.toFixed(0)}%)</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${s === 'Completed' ? 'bg-green-500' : s === 'Overdue' ? 'bg-red-500' : s === 'In Progress' ? 'bg-blue-500' : 'bg-gray-500'}`} style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Total Maintenance Cost</h3>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">GH₵{tasks.reduce((s, t) => s + t.cost, 0).toLocaleString()}</div>
              <div className="text-sm text-gray-500 mt-2">This period</div>
            </div>
            <div className="mt-4 space-y-2">
              {Object.entries(tasks.reduce<Record<string, number>>((a, t) => { a[t.taskType] = (a[t.taskType] || 0) + t.cost; return a; }, {})).sort((a, b) => b[1] - a[1]).map(([type, cost]) => (
                <div key={type} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-sm">
                  <span>{type}</span><span className="font-bold">GH₵{cost.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'tasks' && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Task</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Priority</th>
                <th className="px-4 py-3 text-left">Scheduled</th>
                <th className="px-4 py-3 text-left">Assigned To</th>
                <th className="px-4 py-3 text-left">Cost</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3"><div className="font-medium">{t.equipment}</div><div className="text-xs text-gray-500 max-w-[200px] truncate">{t.description}</div></td>
                  <td className="px-4 py-3">{t.department}</td>
                  <td className="px-4 py-3"><Badge className="bg-gray-100 text-gray-800">{t.taskType}</Badge></td>
                  <td className="px-4 py-3"><Badge className={PRIORITY_COLORS[t.priority]}>{t.priority}</Badge></td>
                  <td className="px-4 py-3">{t.scheduledDate}</td>
                  <td className="px-4 py-3">{t.assignedTo}</td>
                  <td className="px-4 py-3 font-bold">GH₵{t.cost.toLocaleString()}</td>
                  <td className="px-4 py-3"><Badge className={STATUS_COLORS[t.status]}>{t.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'assets' && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Equipment</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">Last Maintenance</th>
                <th className="px-4 py-3 text-left">Next Maintenance</th>
                <th className="px-4 py-3 text-left">Parts Replaced</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{t.equipment}</td>
                  <td className="px-4 py-3">{t.department}</td>
                  <td className="px-4 py-3">{t.completedDate || '—'}</td>
                  <td className="px-4 py-3">{t.nextPM}</td>
                  <td className="px-4 py-3">{t.partsReplaced.length > 0 ? t.partsReplaced.join(', ') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'costs' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Cost by Department</h3>
            <div className="space-y-3">
              {Object.entries(tasks.reduce<Record<string, number>>((a, t) => { a[t.department] = (a[t.department] || 0) + t.cost; return a; }, {})).sort((a, b) => b[1] - a[1]).map(([dept, cost]) => {
                const total = tasks.reduce((s, t) => s + t.cost, 0);
                const pct = total > 0 ? (cost / total * 100) : 0;
                return (
                  <div key={dept}>
                    <div className="flex justify-between text-sm mb-1"><span>{dept}</span><span className="font-bold">GH₵{cost.toLocaleString()} ({pct.toFixed(0)}%)</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Cost Summary</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg text-center"><div className="text-2xl font-bold text-green-600">GH₵{tasks.filter(t => t.status === 'Completed').reduce((s, t) => s + t.cost, 0).toLocaleString()}</div><div className="text-sm text-green-800">Completed</div></div>
                <div className="p-4 bg-blue-50 rounded-lg text-center"><div className="text-2xl font-bold text-blue-600">GH₵{tasks.filter(t => t.status === 'In Progress' || t.status === 'Pending').reduce((s, t) => s + t.cost, 0).toLocaleString()}</div><div className="text-sm text-blue-800">Pending/Active</div></div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
