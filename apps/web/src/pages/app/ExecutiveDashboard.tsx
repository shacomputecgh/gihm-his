import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Button } from '../../components/ui';

interface MetricCard {
  label: string;
  value: string;
  change: string;
  changeType: 'up' | 'down' | 'neutral';
  icon: string;
  color: string;
}

const METRICS: MetricCard[] = [
  { label: 'Bed Occupancy', value: '78%', change: '+3%', changeType: 'up', icon: '🛏️', color: 'bg-blue-500' },
  { label: 'Total Revenue (MTD)', value: 'GH₵ 2.4M', change: '+12%', changeType: 'up', icon: '💰', color: 'bg-green-500' },
  { label: 'Patient Satisfaction', value: '4.2/5', change: '+0.3', changeType: 'up', icon: '😊', color: 'bg-yellow-500' },
  { label: 'Staff Turnover', value: '4.8%', change: '-1.2%', changeType: 'down', icon: '👥', color: 'bg-purple-500' },
  { label: 'Avg Length of Stay', value: '4.2 days', change: '-0.5', changeType: 'down', icon: '📅', color: 'bg-teal-500' },
  { label: 'Emergency Response', value: '1.4 min', change: '-0.3', changeType: 'down', icon: '🚨', color: 'bg-red-500' },
];

const MONTHLY_REVENUE = [
  { month: 'Mar', revenue: 2100000, target: 2200000 },
  { month: 'Apr', revenue: 2300000, target: 2200000 },
  { month: 'May', revenue: 1950000, target: 2200000 },
  { month: 'Jun', revenue: 2400000, target: 2300000 },
  { month: 'Jul', revenue: 2250000, target: 2300000 },
  { month: 'Aug', revenue: 2400000, target: 2400000 },
];

const DEPT_PERFORMANCE = [
  { dept: 'Emergency', patients: 1245, revenue: 485000, satisfaction: 4.0, staffCount: 35, beds: 15, occupancy: 92 },
  { dept: 'Surgery', patients: 890, revenue: 820000, satisfaction: 4.3, staffCount: 42, beds: 30, occupancy: 78 },
  { dept: 'Paediatrics', patients: 678, revenue: 320000, satisfaction: 4.5, staffCount: 25, beds: 25, occupancy: 65 },
  { dept: 'Obstetrics', patients: 545, revenue: 450000, satisfaction: 4.4, staffCount: 28, beds: 20, occupancy: 82 },
  { dept: 'Internal Medicine', patients: 1100, revenue: 520000, satisfaction: 4.1, staffCount: 30, beds: 35, occupancy: 85 },
  { dept: 'ICU', patients: 320, revenue: 680000, satisfaction: 4.2, staffCount: 20, beds: 12, occupancy: 88 },
  { dept: 'Radiology', patients: 1560, revenue: 380000, satisfaction: 3.9, staffCount: 12, beds: 0, occupancy: 0 },
  { dept: 'Laboratory', patients: 2800, revenue: 290000, satisfaction: 4.0, staffCount: 15, beds: 0, occupancy: 0 },
];

const QUALITY_INDICATORS = [
  { name: 'Surgical Site Infection Rate', value: '1.2%', target: '<2%', status: 'Met', trend: 'down' },
  { name: 'Hospital-Acquired Infection', value: '0.8%', target: '<1%', status: 'Met', trend: 'down' },
  { name: 'Patient Falls Rate', value: '2.1/1000', target: '<3/1000', status: 'Met', trend: 'down' },
  { name: 'Medication Error Rate', value: '0.3%', target: '<0.5%', status: 'Met', trend: 'down' },
  { name: 'Readmission Rate (30-day)', value: '8.5%', target: '<10%', status: 'Met', trend: 'stable' },
  { name: 'Maternal Mortality', value: '0.1%', target: '<0.2%', status: 'Met', trend: 'down' },
  { name: 'Neonatal Mortality', value: '0.5%', target: '<1%', status: 'Met', trend: 'down' },
  { name: 'Patient Complaint Resolution', value: '95%', target: '>90%', status: 'Met', trend: 'up' },
];

const ALERTS = [
  { type: 'Critical', message: 'ICU bed occupancy at 92% — overflow protocol may be needed', time: '10 min ago' },
  { type: 'Warning', message: 'Pharmacy: 3 drugs below reorder level — Amoxicillin, Metformin, Paracetamol', time: '1 hour ago' },
  { type: 'Info', message: 'Monthly mortality review meeting scheduled for Aug 30', time: '3 hours ago' },
  { type: 'Warning', message: 'Emergency Department wait time exceeding 45 min target', time: '5 hours ago' },
  { type: 'Info', message: 'New infection control guidelines published — staff training required', time: '1 day ago' },
];

const ALERT_COLORS: Record<string, string> = {
  Critical: 'bg-red-50 border-l-red-500',
  Warning: 'bg-yellow-50 border-l-yellow-500',
  Info: 'bg-blue-50 border-l-blue-500',
};

export default function ExecutiveDashboard() {
  const [timeRange, setTimeRange] = useState('month');

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
          title="Add New Dashboard Widget"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Executive Dashboard</h1>
          <p className="text-gray-500">Strategic overview for CEO, CNO, and Hospital Administration</p>
        </div>
        <div className="flex gap-2">
          {['week', 'month', 'quarter', 'year'].map(r => (
            <Button key={r} variant={timeRange === r ? 'primary' : 'outline'} size="sm"
              onClick={() => setTimeRange(r)}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </Button>
          ))}
          <Button variant="outline" size="sm">📥 Export Report</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {METRICS.map((m, i) => (
          <div key={i} className="bg-white rounded-xl border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{m.icon}</span>
              <span className={`text-xs font-medium ${
                m.changeType === 'up' && m.label.includes('Turnover') ? 'text-red-600' :
                m.changeType === 'down' && !m.label.includes('Turnover') && !m.label.includes('Stay') && !m.label.includes('Response') ? 'text-red-600' :
                'text-green-600'
              }`}>{m.change}</span>
            </div>
            <div className="text-xl font-bold">{m.value}</div>
            <div className="text-xs text-gray-500">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      <div className="bg-white rounded-xl border p-4">
        <h2 className="font-bold mb-3">🔔 Active Alerts</h2>
        <div className="space-y-2">
          {ALERTS.map((alert, i) => (
            <div key={i} className={`border-l-4 rounded-r-lg p-3 ${ALERT_COLORS[alert.type]}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={`text-[10px] ${
                    alert.type === 'Critical' ? 'bg-red-100 text-red-800' :
                    alert.type === 'Warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>{alert.type}</Badge>
                  <span className="text-sm">{alert.message}</span>
                </div>
                <span className="text-xs text-gray-400">{alert.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl border p-4">
          <h2 className="font-bold mb-4">💰 Revenue Trend</h2>
          <div className="space-y-3">
            {MONTHLY_REVENUE.map((m, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm text-gray-500 w-8">{m.month}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                  <div className="bg-green-500 h-full rounded-full flex items-center px-2"
                    style={{ width: `${(m.revenue / 2500000) * 100}%` }}>
                    <span className="text-[10px] text-white font-medium">GH₵ {(m.revenue / 1000000).toFixed(1)}M</span>
                  </div>
                </div>
                <span className="text-xs text-gray-400 w-16 text-right">Target: {(m.target / 1000000).toFixed(1)}M</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quality Indicators */}
        <div className="bg-white rounded-xl border p-4">
          <h2 className="font-bold mb-4">🛡️ Quality Indicators</h2>
          <div className="space-y-3">
            {QUALITY_INDICATORS.map((qi, i) => (
              <div key={i} className="flex items-center justify-between border-b pb-2">
                <div>
                  <div className="text-sm font-medium">{qi.name}</div>
                  <div className="text-xs text-gray-400">Target: {qi.target}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-green-600">{qi.value}</span>
                  <Badge className="text-[10px] bg-green-100 text-green-800">{qi.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Performance */}
      <div className="bg-white rounded-xl border p-4">
        <h2 className="font-bold mb-4">📊 Department Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 font-medium text-gray-600">Department</th>
                <th className="text-right p-3 font-medium text-gray-600">Patients</th>
                <th className="text-right p-3 font-medium text-gray-600">Revenue</th>
                <th className="text-right p-3 font-medium text-gray-600">Satisfaction</th>
                <th className="text-right p-3 font-medium text-gray-600">Staff</th>
                <th className="text-right p-3 font-medium text-gray-600">Occupancy</th>
                <th className="p-3 font-medium text-gray-600">Performance</th>
              </tr>
            </thead>
            <tbody>
              {DEPT_PERFORMANCE.map((d, i) => {
                const perf = Math.min(100, Math.round((d.satisfaction / 5) * 40 + (d.beds > 0 ? (d.occupancy / 100) * 30 : 25) + (d.revenue / 820000) * 30));
                return (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-medium">{d.dept}</td>
                    <td className="p-3 text-right">{d.patients.toLocaleString()}</td>
                    <td className="p-3 text-right font-medium">GH₵ {(d.revenue / 1000).toFixed(0)}K</td>
                    <td className="p-3 text-right">
                      <span className={`${d.satisfaction >= 4.0 ? 'text-green-600' : 'text-yellow-600'}`}>
                        ⭐ {d.satisfaction}
                      </span>
                    </td>
                    <td className="p-3 text-right">{d.staffCount}</td>
                    <td className="p-3 text-right">{d.beds > 0 ? `${d.occupancy}%` : '—'}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div className={`h-full rounded-full ${
                            perf >= 80 ? 'bg-green-500' : perf >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`} style={{ width: `${perf}%` }} />
                        </div>
                        <span className="text-xs font-medium">{perf}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
