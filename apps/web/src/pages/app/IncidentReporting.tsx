import { useState } from 'react';
import { Badge, Card, useToast } from '../../components/ui';

interface Incident {
  id: string;
  title: string;
  category: 'Patient Safety' | 'Medication Error' | 'Fall' | 'Equipment' | 'Infection' | 'Workplace Violence' | 'Near Miss' | 'Other';
  severity: 'Minor' | 'Moderate' | 'Major' | 'Sentinel';
  date: string;
  reportedBy: string;
  ward: string;
  description: string;
  rootCause: string;
  correctiveActions: string[];
  status: 'Reported' | 'Investigating' | 'Corrective Action' | 'Closed';
  dueDate: string;
  assignedTo: string;
}

const SAMPLE: Incident[] = [
  { id: 'IR-001', title: 'Wrong medication administered', category: 'Medication Error', severity: 'Major', date: '2026-08-24', reportedBy: 'Sr. Mensah', ward: 'Medical', description: 'Patient received Warfarin instead of Metformin. Caught during nurse double-check. No harm to patient.', rootCause: 'Look-alike packaging, similar drug names on shelf', correctiveActions: ['Tall-man lettering on labels', 'Separate storage for Warfarin', 'Staff re-education on 5 rights'], status: 'Corrective Action', dueDate: '2026-09-15', assignedTo: 'Pharmacy Manager' },
  { id: 'IR-002', title: 'Patient fall from bed', category: 'Fall', severity: 'Moderate', date: '2026-08-23', reportedBy: 'Nurse Osei', ward: 'Geriatrics', description: '82-year-old patient found on floor beside bed at 03:45. No apparent injury. Bed rails were down.', rootCause: 'Inadequate fall risk assessment, bed rails not raised', correctiveActions: ['Mandatory fall risk assessment every shift', 'Bed rails protocol audit', 'Hourly rounding for high-risk patients'], status: 'Investigating', dueDate: '2026-09-01', assignedTo: 'Nursing Manager' },
  { id: 'IR-003', title: 'Needlestick injury', category: 'Workplace Violence', severity: 'Moderate', date: '2026-08-22', reportedBy: 'Lab Tech Appiah', ward: 'Laboratory', description: 'Lab technician stuck with used needle during specimen processing. PEP initiated within 2 hours.', rootCause: 'Recapping needle, overcrowded workspace', correctiveActions: ['No-recapping policy reinforcement', 'Workspace reorganization', 'Sharps container placement review'], status: 'Closed', dueDate: '2026-08-29', assignedTo: 'Infection Control' },
  { id: 'IR-004', title: 'Power outage during surgery', category: 'Equipment', severity: 'Sentinel', date: '2026-08-21', reportedBy: 'Dr. Asantewaa', ward: 'Theatre', description: 'Main power failed during laparoscopic cholecystectomy. Generator took 45 seconds to kick in. Surgery completed without complication.', rootCause: 'Generator transfer switch malfunction', correctiveActions: ['Generator transfer switch replaced', 'Monthly generator testing protocol', 'Theatre UPS battery upgrade'], status: 'Corrective Action', dueDate: '2026-09-10', assignedTo: 'Facilities Manager' },
  { id: 'IR-005', title: 'Near-miss wrong-site surgery', category: 'Patient Safety', severity: 'Sentinel', date: '2026-08-20', reportedBy: 'Dr. Kumah', ward: 'Theatre', description: 'Surgeon began positioning for left knee arthroscopy but consent was for right knee. Caught during WHO checklist.', rootCause: 'Surgical site mark faded, timeout not followed properly', correctiveActions: ['Reinforced WHO checklist compliance', 'Surgical site marking protocol update', 'Pre-op verification audit'], status: 'Closed', dueDate: '2026-09-05', assignedTo: 'Quality Manager' },
];

const SEVERITY_COLORS: Record<string, string> = { Minor: 'bg-green-100 text-green-800', Moderate: 'bg-yellow-100 text-yellow-800', Major: 'bg-orange-100 text-orange-800', Sentinel: 'bg-red-100 text-red-800' };
const STATUS_COLORS: Record<string, string> = { Reported: 'bg-gray-100 text-gray-800', Investigating: 'bg-blue-100 text-blue-800', 'Corrective Action': 'bg-yellow-100 text-yellow-800', Closed: 'bg-green-100 text-green-800' };
const CATEGORY_COLORS: Record<string, string> = { 'Patient Safety': 'bg-red-100 text-red-800', 'Medication Error': 'bg-orange-100 text-orange-800', Fall: 'bg-yellow-100 text-yellow-800', Equipment: 'bg-blue-100 text-blue-800', Infection: 'bg-purple-100 text-purple-800', 'Workplace Violence': 'bg-pink-100 text-pink-800', 'Near Miss': 'bg-teal-100 text-teal-800', Other: 'bg-gray-100 text-gray-800' };

export default function IncidentReporting() {
  const [tab, setTab] = useState<'overview' | 'incidents' | 'actions' | 'analytics'>('overview');
  const toast = useToast();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🚨 Incident Reporting</h1>
          <p className="text-gray-600 mt-1">Root cause analysis · Corrective actions · Near-miss tracking</p>
        </div>
        <button onClick={() => toast('Incident report form opened', 'success')} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">+ Report Incident</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Incidents', value: SAMPLE.length, icon: '🚨', color: 'text-blue-600' },
          { label: 'Sentinel', value: SAMPLE.filter(i => i.severity === 'Sentinel').length, icon: '🔴', color: 'text-red-600' },
          { label: 'Open Actions', value: SAMPLE.filter(i => i.status !== 'Closed').length, icon: '📋', color: 'text-yellow-600' },
          { label: 'Closed', value: SAMPLE.filter(i => i.status === 'Closed').length, icon: '✅', color: 'text-green-600' },
        ].map((s, i) => (
          <Card key={i} className="p-4"><div className="text-sm text-gray-500">{s.icon} {s.label}</div><div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div></Card>
        ))}
      </div>

      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {(['overview', 'incidents', 'actions', 'analytics'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === t ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'incidents' ? '🚨 Incidents' : t === 'actions' ? '📋 Actions' : '📈 Analytics'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">By Category</h3>
            <div className="space-y-2">
              {Object.entries(SAMPLE.reduce<Record<string, number>>((a, i) => { a[i.category] = (a[i.category] || 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                <div key={cat} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <Badge className={CATEGORY_COLORS[cat]}>{cat}</Badge><span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">By Severity</h3>
            <div className="space-y-2">
              {['Sentinel', 'Major', 'Moderate', 'Minor'].map(sev => {
                const count = SAMPLE.filter(i => i.severity === sev).length;
                return (
                  <div key={sev} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <Badge className={SEVERITY_COLORS[sev]}>{sev}</Badge><span className="font-bold">{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {tab === 'incidents' && (
        <div className="space-y-4">
          {SAMPLE.sort((a, b) => { const ord = { Sentinel: 0, Major: 1, Moderate: 2, Minor: 3 }; return (ord[a.severity as keyof typeof ord] ?? 4) - (ord[b.severity as keyof typeof ord] ?? 4); }).map(inc => (
            <Card key={inc.id} className={`p-5 ${inc.severity === 'Sentinel' ? 'ring-2 ring-red-500' : ''}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{inc.id}</span>
                    <span className="font-bold text-gray-900">{inc.title}</span>
                    <Badge className={SEVERITY_COLORS[inc.severity]}>{inc.severity}</Badge>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{inc.ward} · {inc.date} · Reported by {inc.reportedBy}</div>
                </div>
                <Badge className={STATUS_COLORS[inc.status]}>{inc.status}</Badge>
              </div>
              <div className="mt-3 text-sm text-gray-700">{inc.description}</div>
              <div className="mt-2 p-3 bg-yellow-50 rounded-lg text-sm">
                <span className="font-medium text-yellow-800">Root Cause: </span><span className="text-yellow-700">{inc.rootCause}</span>
              </div>
              <div className="mt-2 space-y-1">
                {inc.correctiveActions.map((action, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm p-2 bg-blue-50 rounded">
                    <span className="text-blue-600">✅</span><span>{action}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs text-gray-500">Due: {inc.dueDate} · Assigned to: {inc.assignedTo}</div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'actions' && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Incident</th>
                <th className="px-4 py-3 text-left">Actions</th>
                <th className="px-4 py-3 text-left">Due Date</th>
                <th className="px-4 py-3 text-left">Assigned To</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE.map(inc => (
                <tr key={inc.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3"><div className="font-medium">{inc.title}</div><div className="text-xs text-gray-500">{inc.id}</div></td>
                  <td className="px-4 py-3 text-sm">{inc.correctiveActions.length} actions</td>
                  <td className="px-4 py-3">{inc.dueDate}</td>
                  <td className="px-4 py-3">{inc.assignedTo}</td>
                  <td className="px-4 py-3"><Badge className={STATUS_COLORS[inc.status]}>{inc.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Monthly Trend</h3>
            <div className="flex items-end gap-2 h-40">
              {[3, 5, 2, 4, 6, 3, 5, SAMPLE.length].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="text-xs font-bold text-red-600">{val}</div>
                  <div className="w-full bg-red-500 rounded-t" style={{ height: `${(val / 8) * 100}%` }} />
                  <div className="text-xs text-gray-500 mt-1">{'Jan Feb Mar Apr May Jun Jul Aug'.split(' ')[i]}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Closure Rate</h3>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600">{((SAMPLE.filter(i => i.status === 'Closed').length / SAMPLE.length) * 100).toFixed(0)}%</div>
              <div className="text-sm text-gray-500 mt-2">Incidents closed on time</div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}