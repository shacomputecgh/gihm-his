import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
const MONTHLY_DATA = [
  { month: 'Jan', admissions: 420, discharges: 395, deaths: 8, surgeries: 120, emergency: 850, revenue: 1800000 },
  { month: 'Feb', admissions: 380, discharges: 370, deaths: 6, surgeries: 110, emergency: 780, revenue: 1650000 },
  { month: 'Mar', admissions: 450, discharges: 430, deaths: 10, surgeries: 135, emergency: 920, revenue: 2100000 },
  { month: 'Apr', admissions: 410, discharges: 400, deaths: 7, surgeries: 125, emergency: 880, revenue: 1900000 },
  { month: 'May', admissions: 470, discharges: 455, deaths: 9, surgeries: 140, emergency: 950, revenue: 2200000 },
  { month: 'Jun', admissions: 440, discharges: 430, deaths: 8, surgeries: 130, emergency: 900, revenue: 2050000 },
  { month: 'Jul', admissions: 480, discharges: 465, deaths: 11, surgeries: 145, emergency: 980, revenue: 2350000 },
  { month: 'Aug', admissions: 390, discharges: 280, deaths: 5, surgeries: 95, emergency: 820, revenue: 1750000 },
];

const DEPT_PERFORMANCE = [
  { dept: 'Medicine', patients: 320, revenue: 850000, satisfaction: 4.2, occupancy: 78 },
  { dept: 'Surgery', patients: 180, revenue: 1200000, satisfaction: 4.5, occupancy: 82 },
  { dept: 'Paediatrics', patients: 150, revenue: 420000, satisfaction: 4.6, occupancy: 65 },
  { dept: 'Maternity', patients: 120, revenue: 380000, satisfaction: 4.7, occupancy: 70 },
  { dept: 'Emergency', patients: 820, revenue: 650000, satisfaction: 3.8, occupancy: 90 },
  { dept: 'ICU', patients: 45, revenue: 950000, satisfaction: 4.3, occupancy: 85 },
];

const QUALITY_METRICS = [
  { metric: 'Patient Satisfaction', value: '4.3/5.0', trend: '↑', status: 'good' },
  { metric: 'Readmission Rate', value: '8.5%', trend: '↓', status: 'good' },
  { metric: 'Mortality Rate', value: '1.8%', trend: '→', status: 'good' },
  { metric: 'HAI Rate', value: '5.2%', trend: '↑', status: 'warning' },
  { metric: 'Avg LOS', value: '4.8 days', trend: '↓', status: 'good' },
  { metric: 'Bed Occupancy', value: '76%', trend: '→', status: 'good' },
];

export default function DataAnalyticsDashboard() {
  const totalAdmissions = MONTHLY_DATA.reduce((s, m) => s + m.admissions, 0);
  const totalRevenue = MONTHLY_DATA.reduce((s, m) => s + m.revenue, 0);
  const avgSatisfaction = (DEPT_PERFORMANCE.reduce((s, d) => s + d.satisfaction, 0) / DEPT_PERFORMANCE.length).toFixed(1);

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
          title="Add New Analytics Widget"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Data Analytics Dashboard</h1><p className="text-gray-500">Advanced analytics, operational trends, department performance, and quality metrics</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Total Admissions', value: totalAdmissions, color: 'text-blue-600' }, { label: 'Total Revenue', value: `GH₵ ${(totalRevenue/1000000).toFixed(1)}M`, color: 'text-green-600' }, { label: 'Avg Satisfaction', value: `${avgSatisfaction}/5.0`, color: 'text-purple-600' }, { label: 'Departments', value: DEPT_PERFORMANCE.length, color: 'text-orange-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="bg-white rounded-lg border p-5">
        <h3 className="font-semibold mb-4">Monthly Trends</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm"><thead><tr className="text-left text-gray-500 text-xs border-b"><th className="pb-2">Month</th><th className="pb-2">Admissions</th><th className="pb-2">Discharges</th><th className="pb-2">Deaths</th><th className="pb-2">Surgeries</th><th className="pb-2">Emergency</th><th className="pb-2">Revenue</th></tr></thead>
            <tbody>{MONTHLY_DATA.map(m => (
              <tr key={m.month} className="border-b hover:bg-gray-50"><td className="py-2 font-medium">{m.month}</td><td className="py-2 text-blue-600 font-bold">{m.admissions}</td><td className="py-2">{m.discharges}</td><td className="py-2 text-red-600">{m.deaths}</td><td className="py-2">{m.surgeries}</td><td className="py-2">{m.emergency}</td><td className="py-2 text-green-600 font-bold">GH₵ {(m.revenue/1000000).toFixed(2)}M</td></tr>
            ))}</tbody></table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border p-5">
          <h3 className="font-semibold mb-4">Department Performance</h3>
          <div className="space-y-3">
            {DEPT_PERFORMANCE.sort((a, b) => b.revenue - a.revenue).map(d => (
              <div key={d.dept} className="border-b pb-3 last:border-0">
                <div className="flex justify-between text-sm mb-1"><span className="font-medium">{d.dept}</span><span className="text-green-600 font-bold">GH₵ {(d.revenue/1000).toFixed(0)}K</span></div>
                <div className="flex gap-4 text-xs text-gray-500"><span>{d.patients} patients</span><span>Occupancy: {d.occupancy}%</span><span>Satisfaction: {d.satisfaction}/5.0</span></div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg border p-5">
          <h3 className="font-semibold mb-4">Quality Metrics</h3>
          <div className="space-y-3">
            {QUALITY_METRICS.map(q => (
              <div key={q.metric} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm font-medium">{q.metric}</span>
                <div className="flex items-center gap-2"><span className="font-bold">{q.value}</span><span className={q.status === 'good' ? 'text-green-600' : 'text-yellow-600'}>{q.trend}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
