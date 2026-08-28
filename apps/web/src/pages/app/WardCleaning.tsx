import { useState } from 'react';
import { Card, Badge } from '../../components/ui';

interface CleaningTask {
  id: string;
  ward: string;
  area: string;
  type: 'Terminal Clean' | 'Routine Clean' | 'Discharge Clean' | 'Isolation Clean' | 'Theatre Clean';
  scheduledTime: string;
  completedTime: string;
  cleaner: string;
  inspector: string;
  score: number; // out of 100
  checklist: { item: string; pass: boolean }[];
  status: 'Pending' | 'In Progress' | 'Completed' | 'Failed';
  auditDate: string;
}

const SAMPLE: CleaningTask[] = [
  { id: 'CL-001', ward: 'ICU', area: 'ICU Bed 1', type: 'Discharge Clean', scheduledTime: '08:00', completedTime: '08:45', cleaner: 'Mrs. Akoto', inspector: 'Infection Control', score: 95, checklist: [{ item: 'Surfaces wiped', pass: true }, { item: 'Floor mopped', pass: true }, { item: 'Equipment cleaned', pass: true }, { item: 'Bed linen changed', pass: true }, { item: 'Waste disposed', pass: true }, { item: 'Hand hygiene station stocked', pass: true }], status: 'Completed', auditDate: '2026-08-25' },
  { id: 'CL-002', ward: 'Theatre 1', area: 'Main Theatre', type: 'Theatre Clean', scheduledTime: '06:00', completedTime: '07:30', cleaner: 'Mr. Mensah', inspector: 'Theatre Manager', score: 98, checklist: [{ item: 'Surgical surfaces sterilised', pass: true }, { item: 'Floor disinfected', pass: true }, { item: 'Equipment calibrated', pass: true }, { item: 'Air handling verified', pass: true }, { item: 'PPE stations stocked', pass: true }], status: 'Completed', auditDate: '2026-08-25' },
  { id: 'CL-003', ward: 'Ward A', area: 'Corridor', type: 'Routine Clean', scheduledTime: '10:00', completedTime: '', cleaner: 'Mrs. Boateng', inspector: '', score: 0, checklist: [], status: 'In Progress', auditDate: '' },
  { id: 'CL-004', ward: 'Emergency', area: 'Resuscitation Bay', type: 'Terminal Clean', scheduledTime: '14:00', completedTime: '', cleaner: '', inspector: '', score: 0, checklist: [], status: 'Pending', auditDate: '' },
  { id: 'CL-005', ward: 'NICU', area: 'Isolation Room 2', type: 'Isolation Clean', scheduledTime: '09:00', completedTime: '10:00', cleaner: 'Sister Osei', inspector: 'Infection Control', score: 100, checklist: [{ item: 'Terminal disinfection completed', pass: true }, { item: 'HEPA filter checked', pass: true }, { item: 'Negative pressure verified', pass: true }, { item: 'All surfaces disinfected', pass: true }, { item: 'Waste double-bagged', pass: true }], status: 'Completed', auditDate: '2026-08-25' },
];

const STATUS_COLORS: Record<string, string> = { Pending: 'bg-gray-100 text-gray-800', 'In Progress': 'bg-blue-100 text-blue-800', Completed: 'bg-green-100 text-green-800', Failed: 'bg-red-100 text-red-800' };
const TYPE_COLORS: Record<string, string> = { 'Terminal Clean': 'bg-red-100 text-red-800', 'Routine Clean': 'bg-green-100 text-green-800', 'Discharge Clean': 'bg-blue-100 text-blue-800', 'Isolation Clean': 'bg-orange-100 text-orange-800', 'Theatre Clean': 'bg-purple-100 text-purple-800' };

export default function WardCleaning() {
  const [tab, setTab] = useState<'overview' | 'schedule' | 'audit' | 'checklist'>('overview');
  const completed = SAMPLE.filter(s => s.status === 'Completed');
  const avgScore = completed.length > 0 ? Math.round(completed.reduce((s, c) => s + c.score, 0) / completed.length) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🧹 Ward Cleaning</h1>
          <p className="text-gray-600 mt-1">Cleaning schedules · Audit tracking · Infection control compliance</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Today Tasks', value: SAMPLE.length, icon: '🧹', color: 'text-blue-600' },
          { label: 'Completed', value: completed.length, icon: '✅', color: 'text-green-600' },
          { label: 'Avg Audit Score', value: `${avgScore}%`, icon: '📊', color: 'text-purple-600' },
          { label: 'Pending', value: SAMPLE.filter(s => s.status === 'Pending').length, icon: '⏳', color: 'text-yellow-600' },
        ].map((s, i) => (
          <Card key={i} className="p-4"><div className="text-sm text-gray-500">{s.icon} {s.label}</div><div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div></Card>
        ))}
      </div>

      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {(['overview', 'schedule', 'audit', 'checklist'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === t ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'schedule' ? '📅 Schedule' : t === 'audit' ? '✅ Audit' : '📋 Checklist'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Audit Scores</h3>
            <div className="space-y-3">
              {completed.sort((a, b) => b.score - a.score).map(c => (
                <div key={c.id}>
                  <div className="flex justify-between text-sm mb-1"><span>{c.ward} — {c.area}</span><span className={`font-bold ${c.score >= 95 ? 'text-green-600' : c.score >= 85 ? 'text-yellow-600' : 'text-red-600'}`}>{c.score}%</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${c.score >= 95 ? 'bg-green-500' : c.score >= 85 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${c.score}%` }} /></div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Tasks by Type</h3>
            <div className="space-y-2">
              {Object.entries(SAMPLE.reduce<Record<string, number>>((a, s) => { a[s.type] = (a[s.type] || 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <Badge className={TYPE_COLORS[type]}>{type}</Badge><span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'schedule' && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Ward/Area</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Scheduled</th>
                <th className="px-4 py-3 text-left">Completed</th>
                <th className="px-4 py-3 text-left">Cleaner</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE.map(s => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3"><div className="font-medium">{s.ward}</div><div className="text-xs text-gray-500">{s.area}</div></td>
                  <td className="px-4 py-3"><Badge className={TYPE_COLORS[s.type]}>{s.type}</Badge></td>
                  <td className="px-4 py-3">{s.scheduledTime}</td>
                  <td className="px-4 py-3">{s.completedTime || '—'}</td>
                  <td className="px-4 py-3">{s.cleaner || '—'}</td>
                  <td className="px-4 py-3"><Badge className={STATUS_COLORS[s.status]}>{s.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'audit' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {completed.map(c => (
            <Card key={c.id} className="p-5">
              <div className="flex justify-between items-start">
                <div><div className="font-bold">{c.ward} — {c.area}</div><div className="text-xs text-gray-500">{c.type} · {c.auditDate}</div></div>
                <div className={`text-2xl font-bold ${c.score >= 95 ? 'text-green-600' : c.score >= 85 ? 'text-yellow-600' : 'text-red-600'}`}>{c.score}%</div>
              </div>
              <div className="mt-3 space-y-1">
                {c.checklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className={item.pass ? 'text-green-600' : 'text-red-600'}>{item.pass ? '✅' : '❌'}</span>
                    <span>{item.item}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'checklist' && (
        <Card className="p-6">
          <h3 className="font-bold text-gray-900 mb-4">Standard Cleaning Checklist (WHO)</h3>
          <div className="space-y-2">
            {['Pre-clean area — remove visible soil', 'Clean surfaces top-to-bottom, left-to-right', 'Disinfect high-touch surfaces (bed rails, light switches, door handles)', 'Clean and disinfect bathroom/toilet', 'Mop floor with disinfectant solution', 'Restock hand hygiene supplies', 'Dispose of waste in appropriate colour-coded bins', 'Final inspection and sign-off'].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-blue-600 font-bold">{i + 1}.</span>
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
