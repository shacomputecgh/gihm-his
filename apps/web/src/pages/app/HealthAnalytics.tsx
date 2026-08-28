import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface Metric {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

const METRICS: Metric[] = [
  { label: 'Patient Visits', value: '1,245', change: 12, trend: 'up', color: 'bg-blue-500' },
  { label: 'Admissions', value: '186', change: 5, trend: 'up', color: 'bg-purple-500' },
  { label: 'Revenue (GH₵)', value: '45,200', change: 8, trend: 'up', color: 'bg-emerald-500' },
  { label: 'Avg Wait Time', value: '23 min', change: -15, trend: 'down', color: 'bg-amber-500' },
  { label: 'Bed Occupancy', value: '82%', change: 3, trend: 'up', color: 'bg-indigo-500' },
  { label: 'Staff Utilization', value: '91%', change: 2, trend: 'up', color: 'bg-cyan-500' }
];

const TOP_DIAGNOSES = [
  { name: 'Malaria', count: 145, percentage: 18 },
  { name: 'Hypertension', count: 120, percentage: 15 },
  { name: 'Diabetes', count: 95, percentage: 12 },
  { name: 'Upper Respiratory Infection', count: 88, percentage: 11 },
  { name: 'Gastroenteritis', count: 72, percentage: 9 }
];

const DEPARTMENT_PERFORMANCE = [
  { name: 'Emergency', patients: 320, revenue: 12500, satisfaction: 4.2 },
  { name: 'Surgery', patients: 85, revenue: 18000, satisfaction: 4.5 },
  { name: 'Paediatrics', patients: 210, revenue: 8500, satisfaction: 4.3 },
  { name: 'Obstetrics', patients: 120, revenue: 9200, satisfaction: 4.6 },
  { name: 'Internal Medicine', patients: 280, revenue: 10000, satisfaction: 4.1 }
];

const MONTHLY_TRENDS = [
  { month: 'Jul', visits: 1100, admissions: 170, revenue: 42000 },
  { month: 'Aug', visits: 1150, admissions: 175, revenue: 43500 },
  { month: 'Sep', visits: 1080, admissions: 165, revenue: 41000 },
  { month: 'Oct', visits: 1200, admissions: 180, revenue: 44000 },
  { month: 'Nov', visits: 1180, admissions: 178, revenue: 48700 },
  { month: 'Dec', visits: 1220, admissions: 182, revenue: 52300 },
  { month: 'Jan', visits: 1245, admissions: 186, revenue: 45200 }
];

export default function HealthAnalytics() {
  const [activeTab, setActiveTab] = useState<'overview' | 'clinical' | 'financial' | 'operational'>('overview');

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
          title="Add New Analytics Metric"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Health Analytics Dashboard</h1>
          <p className="text-gray-500">Advanced analytics and performance reporting</p>
        </div>
        <div className="flex gap-2">
          <select className="border rounded-lg px-3 py-1.5 text-sm">
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
            <option>This Year</option>
          </select>
          <button onClick={() => {}} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">📊 Export Report</button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-6 gap-4">
        {METRICS.map(metric => (
          <div key={metric.label} className={`${metric.color} text-white p-4 rounded-xl`}>
            <p className="text-xs opacity-90">{metric.label}</p>
            <p className="text-2xl font-bold mt-1">{metric.value}</p>
            <p className={`text-xs mt-1 ${metric.change > 0 ? 'text-emerald-200' : metric.change < 0 ? 'text-red-200' : 'text-gray-200'}`}>
              {metric.change > 0 ? '↑' : metric.change < 0 ? '↓' : '→'} {Math.abs(metric.change)}%
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {(['overview', 'clinical', 'financial', 'operational'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
            }`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Monthly Trend */}
          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Monthly Visits Trend</h4>
            <div className="space-y-2">
              {MONTHLY_TRENDS.map(trend => (
                <div key={trend.month} className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-8">{trend.month}</span>
                  <div className="flex-1 h-4 bg-gray-100 rounded">
                    <div className="h-4 bg-blue-500 rounded" style={{ width: `${(trend.visits / 1300) * 100}%` }} />
                  </div>
                  <span className="text-sm font-bold w-12">{trend.visits}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Diagnoses */}
          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Top Diagnoses</h4>
            <div className="space-y-3">
              {TOP_DIAGNOSES.map((dx, idx) => (
                <div key={dx.name} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-400 w-4">{idx + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{dx.name}</span>
                      <span className="font-bold">{dx.count}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${dx.percentage * 3}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Department Performance */}
          <div className="border rounded-xl p-6 col-span-2">
            <h4 className="font-bold mb-4">Department Performance</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Department</th>
                    <th className="text-right py-2">Patients</th>
                    <th className="text-right py-2">Revenue (GH₵)</th>
                    <th className="text-right py-2">Satisfaction</th>
                    <th className="text-right py-2">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {DEPARTMENT_PERFORMANCE.map(dept => (
                    <tr key={dept.name} className="border-b">
                      <td className="py-2 font-medium">{dept.name}</td>
                      <td className="text-right">{dept.patients}</td>
                      <td className="text-right">{dept.revenue.toLocaleString()}</td>
                      <td className="text-right">⭐ {dept.satisfaction}</td>
                      <td className="text-right">
                        <div className="w-20 h-2 bg-gray-200 rounded-full inline-block">
                          <div className="h-2 bg-emerald-500 rounded-full" style={{ width: `${(dept.satisfaction / 5) * 100}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Clinical Tab */}
      {activeTab === 'clinical' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Clinical Outcomes</h4>
            <div className="space-y-3">
              {[
                { label: 'Mortality Rate', value: '1.2%', status: 'good' },
                { label: 'Readmission Rate', value: '4.8%', status: 'good' },
                { label: 'Infection Rate', value: '2.1%', status: 'good' },
                { label: 'Length of Stay (avg)', value: '4.2 days', status: 'good' },
                { label: 'Patient Satisfaction', value: '4.3/5', status: 'good' }
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-bold text-emerald-600">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Lab Turnaround Time</h4>
            <div className="space-y-3">
              {[
                { test: 'CBC', target: '< 60 min', actual: '45 min', met: true },
                { test: 'Chemistry', target: '< 120 min', actual: '95 min', met: true },
                { test: 'Microbiology', target: '< 24 hrs', actual: '22 hrs', met: true },
                { test: 'Histopathology', target: '< 72 hrs', actual: '78 hrs', met: false }
              ].map(item => (
                <div key={item.test} className="flex items-center justify-between">
                  <span className="text-gray-600">{item.test}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{item.actual}</span>
                    <Badge className={item.met ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}>
                      {item.met ? '✓ Met' : '✗ Missed'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Financial Tab */}
      {activeTab === 'financial' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Revenue by Category</h4>
            <div className="space-y-3">
              {[
                { category: 'Consultation', amount: 15000, percentage: 33 },
                { category: 'Laboratory', amount: 12000, percentage: 27 },
                { category: 'Pharmacy', amount: 8000, percentage: 18 },
                { category: 'Surgery', amount: 6000, percentage: 13 },
                { category: 'Imaging', amount: 4200, percentage: 9 }
              ].map(item => (
                <div key={item.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.category}</span>
                    <span className="font-bold">GH₵ {item.amount.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Collection Efficiency</h4>
            <div className="space-y-3">
              {[
                { label: 'Collection Rate', value: '85.2%', color: 'text-emerald-600' },
                { label: 'Avg Days to Collect', value: '12 days', color: 'text-blue-600' },
                { label: 'Bad Debt', value: '2.1%', color: 'text-amber-600' },
                { label: 'Insurance Turnaround', value: '18 days', color: 'text-purple-600' },
                { label: 'Write-off Rate', value: '0.8%', color: 'text-gray-600' }
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-gray-600">{item.label}</span>
                  <span className={`font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Operational Tab */}
      {activeTab === 'operational' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Bed Occupancy by Ward</h4>
            <div className="space-y-3">
              {[
                { ward: 'Medical', occupancy: 85, beds: 40 },
                { ward: 'Surgical', occupancy: 78, beds: 35 },
                { ward: 'Paediatric', occupancy: 72, beds: 25 },
                { ward: 'Maternity', occupancy: 90, beds: 20 },
                { ward: 'ICU', occupancy: 95, beds: 10 }
              ].map(item => (
                <div key={item.ward}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.ward}</span>
                    <span className="font-bold">{item.occupancy}% ({Math.round(item.beds * item.occupancy / 100)}/{item.beds})</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full">
                    <div className={`h-3 rounded-full ${item.occupancy > 90 ? 'bg-red-500' : item.occupancy > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${item.occupancy}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border rounded-xl p-6">
            <h4 className="font-bold mb-4">Staff Utilization</h4>
            <div className="space-y-3">
              {[
                { role: 'Doctors', utilization: 88, count: 25 },
                { role: 'Nurses', utilization: 92, count: 80 },
                { role: 'Lab Techs', utilization: 85, count: 12 },
                { role: 'Pharmacists', utilization: 78, count: 8 },
                { role: 'Admin Staff', utilization: 70, count: 15 }
              ].map(item => (
                <div key={item.role}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.role} ({item.count})</span>
                    <span className="font-bold">{item.utilization}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-indigo-500 rounded-full" style={{ width: `${item.utilization}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
