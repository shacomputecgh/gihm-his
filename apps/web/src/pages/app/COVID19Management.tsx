import { useState } from 'react';
import { Card, Badge, useToast } from '../../components/ui';

interface COVIDRecord {
  id: string;
  patientName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  screeningDate: string;
  temperature: number;
  symptoms: string[];
  exposureHistory: string;
  rapidTestResult: 'Pending' | 'Positive' | 'Negative';
  pcrResult: 'Pending' | 'Positive' | 'Negative' | 'Not Done';
  vaccinationStatus: 'Not Vaccinated' | 'Partial' | 'Fully Vaccinated' | 'Boosted';
  isolationStatus: 'Home Isolation' | 'Facility Isolation' | 'Discharged' | 'Deceased';
  isolationStartDate: string;
  isolationEndDate: string;
  severity: 'Asymptomatic' | 'Mild' | 'Moderate' | 'Severe' | 'Critical';
  oxygenSaturation?: number;
  comorbidities: string[];
  contactTracingDone: boolean;
  closeContacts: number;
  isolationDay: number;
  ward?: string;
}

const SAMPLE_COVID: COVIDRecord[] = [
  { id: 'COVID-001', patientName: 'Kwame Mensah', dateOfBirth: '1975-03-12', gender: 'Male', phone: '+233201234567', screeningDate: '2026-08-20', temperature: 38.5, symptoms: ['Cough', 'Fever', 'Body Aches', 'Loss of Taste'], exposureHistory: 'Contact with confirmed case', rapidTestResult: 'Positive', pcrResult: 'Positive', vaccinationStatus: 'Fully Vaccinated', isolationStatus: 'Home Isolation', isolationStartDate: '2026-08-20', isolationEndDate: '', severity: 'Moderate', oxygenSaturation: 94, comorbidities: ['Hypertension'], contactTracingDone: true, closeContacts: 3, isolationDay: 7, ward: 'COVID Ward A' },
  { id: 'COVID-002', patientName: 'Ama Osei', dateOfBirth: '1990-07-22', gender: 'Female', phone: '+233245678901', screeningDate: '2026-08-21', temperature: 37.2, symptoms: ['Mild Cough'], exposureHistory: 'Community transmission', rapidTestResult: 'Positive', pcrResult: 'Pending', vaccinationStatus: 'Boosted', isolationStatus: 'Facility Isolation', isolationStartDate: '2026-08-21', isolationEndDate: '', severity: 'Mild', oxygenSaturation: 97, comorbidities: [], contactTracingDone: true, closeContacts: 1, isolationDay: 6, ward: 'COVID Ward B' },
  { id: 'COVID-003', patientName: 'Kofi Asante', dateOfBirth: '1958-11-05', gender: 'Male', phone: '+233267890123', screeningDate: '2026-08-18', temperature: 39.8, symptoms: ['High Fever', 'Difficulty Breathing', 'Chest Pain', 'Fatigue', 'Loss of Appetite'], exposureHistory: 'Healthcare worker exposure', rapidTestResult: 'Positive', pcrResult: 'Positive', vaccinationStatus: 'Partial', isolationStatus: 'Facility Isolation', isolationStartDate: '2026-08-18', isolationEndDate: '', severity: 'Severe', oxygenSaturation: 88, comorbidities: ['Diabetes Type 2', 'Chronic Kidney Disease'], contactTracingDone: true, closeContacts: 8, isolationDay: 9, ward: 'ICU' },
  { id: 'COVID-004', patientName: 'Akosua Boateng', dateOfBirth: '2001-01-15', gender: 'Female', phone: '+233501234567', screeningDate: '2026-08-22', temperature: 37.0, symptoms: ['None'], exposureHistory: 'Travel history from Lagos', rapidTestResult: 'Negative', pcrResult: 'Negative', vaccinationStatus: 'Fully Vaccinated', isolationStatus: 'Discharged', isolationStartDate: '2026-08-22', isolationEndDate: '2026-08-22', severity: 'Asymptomatic', oxygenSaturation: 99, comorbidities: [], contactTracingDone: false, closeContacts: 0, isolationDay: 0 },
  { id: 'COVID-005', patientName: 'Yaw Darko', dateOfBirth: '1965-09-30', gender: 'Male', phone: '+233278901234', screeningDate: '2026-08-15', temperature: 40.1, symptoms: ['Severe Fever', 'Respiratory Distress', 'Confusion', 'Low Oxygen'], exposureHistory: 'Unknown origin', rapidTestResult: 'Positive', pcrResult: 'Positive', vaccinationStatus: 'Not Vaccinated', isolationStatus: 'Facility Isolation', isolationStartDate: '2026-08-15', isolationEndDate: '', severity: 'Critical', oxygenSaturation: 82, comorbidities: ['Asthma', 'Obesity', 'Hypertension'], contactTracingDone: true, closeContacts: 5, isolationDay: 12, ward: 'ICU' },
];

const SEVERITY_COLORS: Record<string, { bg: string; text: string }> = {
  Asymptomatic: { bg: 'bg-green-100', text: 'text-green-800' },
  Mild: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  Moderate: { bg: 'bg-orange-100', text: 'text-orange-800' },
  Severe: { bg: 'bg-red-100', text: 'text-red-800' },
  Critical: { bg: 'bg-red-200', text: 'text-red-900' },
};

const VACCINATION_BADGES: Record<string, string> = {
  'Not Vaccinated': 'bg-red-100 text-red-800',
  'Partial': 'bg-yellow-100 text-yellow-800',
  'Fully Vaccinated': 'bg-green-100 text-green-800',
  'Boosted': 'bg-blue-100 text-blue-800',
};

const VACCINATION_STATS = [
  { label: 'Not Vaccinated', count: 142, color: 'bg-red-500', pct: 28 },
  { label: 'Partial', count: 89, color: 'bg-yellow-500', pct: 18 },
  { label: 'Fully Vaccinated', count: 198, color: 'bg-green-500', pct: 40 },
  { label: 'Boosted', count: 67, color: 'bg-blue-500', pct: 14 },
];

const VACCINATION_CAMPAIGNS = [
  { id: 'VC-001', name: 'COVID-19 Booster Campaign Q3', startDate: '2026-07-01', endDate: '2026-09-30', targetGroup: 'Healthcare Workers', dosesAdministered: 156, targetDoses: 200, status: 'Active' },
  { id: 'VC-002', name: 'Community Vaccination Drive - Ashanti', startDate: '2026-08-01', endDate: '2026-08-31', targetGroup: 'General Public 60+', dosesAdministered: 342, targetDoses: 500, status: 'Active' },
  { id: 'VC-003', name: 'School Vaccination Program', startDate: '2026-09-15', endDate: '2026-10-15', targetGroup: 'Students 12-17', dosesAdministered: 0, targetDoses: 800, status: 'Planned' },
];

const ISOLATION_ZONES = [
  { zone: 'COVID Ward A', capacity: 20, occupied: 14, isolationType: 'Standard', ventilation: 'Negative Pressure' },
  { zone: 'COVID Ward B', capacity: 15, occupied: 11, isolationType: 'Standard', ventilation: 'Natural + HEPA' },
  { zone: 'ICU Isolation', capacity: 6, occupied: 2, isolationType: 'Enhanced', ventilation: 'Negative Pressure' },
  { zone: 'Triage Isolation Bay', capacity: 8, occupied: 3, isolationType: 'Temporary', ventilation: 'Natural' },
];

export default function COVID19Management() {
  const [records] = useState<COVIDRecord[]>(SAMPLE_COVID);
  const [tab, setTab] = useState<'overview' | 'cases' | 'isolation' | 'vaccination' | 'tracing' | 'surveillance'>('overview');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [showScreenForm, setShowScreenForm] = useState(false);
  const [showVaccForm, setShowVaccForm] = useState(false);
  const toast = useToast();

  const filtered = severityFilter === 'all' ? records : records.filter(r => r.severity === severityFilter);
  const activeCases = records.filter(r => r.isolationStatus !== 'Discharged' && r.isolationStatus !== 'Deceased');
  const severeCritical = records.filter(r => r.severity === 'Severe' || r.severity === 'Critical');
  const avgIsolationDay = activeCases.length > 0 ? Math.round(activeCases.reduce((s, r) => s + r.isolationDay, 0) / activeCases.length) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🦠 COVID-19 Management</h1>
          <p className="text-gray-600 mt-1">Screening · Isolation · Vaccination · Contact Tracing · Surveillance</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowScreenForm(true); toast('Screening form opened', 'success'); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ New Screening</button>
          <button onClick={() => { setShowVaccForm(true); toast('Vaccination form opened', 'success'); }} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">+ Record Vaccination</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Screened', value: records.length, icon: '🔍', color: 'text-blue-600' },
          { label: 'Active Cases', value: activeCases.length, icon: '🦠', color: 'text-orange-600' },
          { label: 'Severe/Critical', value: severeCritical.length, icon: '⚠️', color: 'text-red-600' },
          { label: 'Isolated (Facility)', value: records.filter(r => r.isolationStatus === 'Facility Isolation').length, icon: '🏥', color: 'text-purple-600' },
          { label: 'Avg Isolation Day', value: avgIsolationDay, icon: '📅', color: 'text-gray-600' },
          { label: 'Contacts Traced', value: records.reduce((s, r) => s + r.closeContacts, 0), icon: '🔗', color: 'text-teal-600' },
        ].map((stat, i) => (
          <Card key={i} className="p-4">
            <div className="text-sm text-gray-500">{stat.icon} {stat.label}</div>
            <div className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {(['overview', 'cases', 'isolation', 'vaccination', 'tracing', 'surveillance'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === t ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'cases' ? '🦠 Cases' : t === 'isolation' ? '🏥 Isolation' : t === 'vaccination' ? '💉 Vaccination' : t === 'tracing' ? '🔗 Contact Tracing' : '📈 Surveillance'}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Severity Distribution</h3>
            <div className="space-y-3">
              {Object.entries(SEVERITY_COLORS).map(([severity, colors]) => {
                const count = records.filter(r => r.severity === severity).length;
                const pct = records.length > 0 ? (count / records.length * 100) : 0;
                return (
                  <div key={severity}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>{severity}</span>
                      <span className="text-gray-600">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full ${severity === 'Asymptomatic' ? 'bg-green-500' : severity === 'Mild' ? 'bg-yellow-500' : severity === 'Moderate' ? 'bg-orange-500' : severity === 'Severe' ? 'bg-red-500' : 'bg-red-700'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Vaccination Coverage</h3>
            <div className="space-y-3">
              {VACCINATION_STATS.map(v => (
                <div key={v.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{v.label}</span>
                    <span className="text-gray-600">{v.count} ({v.pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${v.color}`} style={{ width: `${v.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Isolation Zones</h3>
            <div className="space-y-3">
              {ISOLATION_ZONES.map(z => (
                <div key={z.zone} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-900">{z.zone}</div>
                      <div className="text-xs text-gray-500">{z.isolationType} · {z.ventilation}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{z.occupied}/{z.capacity}</div>
                      <div className={`text-xs ${z.occupied / z.capacity > 0.8 ? 'text-red-600' : 'text-green-600'}`}>
                        {z.occupied / z.capacity > 0.8 ? '⚠️ Near Full' : '✅ Available'}
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div className={`h-1.5 rounded-full ${z.occupied / z.capacity > 0.8 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${(z.occupied / z.capacity * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Active Vaccination Campaigns</h3>
            <div className="space-y-3">
              {VACCINATION_CAMPAIGNS.map(c => (
                <div key={c.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-900">{c.name}</div>
                      <div className="text-xs text-gray-500">{c.targetGroup} · {c.startDate} to {c.endDate}</div>
                    </div>
                    <Badge className={c.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>{c.status}</Badge>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{c.dosesAdministered} / {c.targetDoses} doses</span>
                      <span>{c.targetDoses > 0 ? (c.dosesAdministered / c.targetDoses * 100).toFixed(0) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${c.targetDoses > 0 ? (c.dosesAdministered / c.targetDoses * 100) : 0}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Cases Tab */}
      {tab === 'cases' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {['all', 'Asymptomatic', 'Mild', 'Moderate', 'Severe', 'Critical'].map(s => (
              <button key={s} onClick={() => setSeverityFilter(s)} className={`px-3 py-1 rounded-full text-sm ${severityFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                {s === 'all' ? 'All' : s} ({s === 'all' ? records.length : records.filter(r => r.severity === s).length})
              </button>
            ))}
          </div>
          <div className="bg-white rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">Patient</th>
                  <th className="px-4 py-3 text-left">Age/Gender</th>
                  <th className="px-4 py-3 text-left">Temp</th>
                  <th className="px-4 py-3 text-left">Symptoms</th>
                  <th className="px-4 py-3 text-left">Rapid</th>
                  <th className="px-4 py-3 text-left">PCR</th>
                  <th className="px-4 py-3 text-left">Severity</th>
                  <th className="px-4 py-3 text-left">SpO2</th>
                  <th className="px-4 py-3 text-left">Vaccination</th>
                  <th className="px-4 py-3 text-left">Isolation</th>
                  <th className="px-4 py-3 text-left">Day</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const age = new Date().getFullYear() - new Date(r.dateOfBirth).getFullYear();
                  const sev = SEVERITY_COLORS[r.severity] || SEVERITY_COLORS.Mild;
                  return (
                    <tr key={r.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3"><div className="font-medium">{r.patientName}</div><div className="text-xs text-gray-500">{r.id}</div></td>
                      <td className="px-4 py-3">{age}y / {r.gender}</td>
                      <td className="px-4 py-3"><span className={r.temperature >= 38 ? 'text-red-600 font-bold' : ''}>{r.temperature}°C</span></td>
                      <td className="px-4 py-3 max-w-[200px] truncate">{r.symptoms.join(', ')}</td>
                      <td className="px-4 py-3"><Badge className={r.rapidTestResult === 'Positive' ? 'bg-red-100 text-red-800' : r.rapidTestResult === 'Negative' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>{r.rapidTestResult}</Badge></td>
                      <td className="px-4 py-3"><Badge className={r.pcrResult === 'Positive' ? 'bg-red-100 text-red-800' : r.pcrResult === 'Negative' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>{r.pcrResult}</Badge></td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${sev.bg} ${sev.text}`}>{r.severity}</span></td>
                      <td className="px-4 py-3"><span className={r.oxygenSaturation && r.oxygenSaturation < 94 ? 'text-red-600 font-bold' : ''}>{r.oxygenSaturation ?? '-'}%</span></td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${VACCINATION_BADGES[r.vaccinationStatus]}`}>{r.vaccinationStatus}</span></td>
                      <td className="px-4 py-3"><Badge className={r.isolationStatus === 'Facility Isolation' ? 'bg-purple-100 text-purple-800' : r.isolationStatus === 'Home Isolation' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>{r.isolationStatus}</Badge></td>
                      <td className="px-4 py-3 font-bold">{r.isolationDay}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Isolation Tab */}
      {tab === 'isolation' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ISOLATION_ZONES.map(z => (
              <Card key={z.zone} className="p-5">
                <h4 className="font-bold text-gray-900">{z.zone}</h4>
                <div className="text-xs text-gray-500 mt-1">{z.isolationType} · {z.ventilation}</div>
                <div className="mt-3">
                  <div className="flex justify-between text-sm"><span>Occupied</span><span className="font-bold">{z.occupied}/{z.capacity}</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mt-1">
                    <div className={`h-3 rounded-full ${z.occupied / z.capacity > 0.8 ? 'bg-red-500' : z.occupied / z.capacity > 0.5 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${(z.occupied / z.capacity * 100)}%` }} />
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  {records.filter(r => r.ward === z.zone || (z.zone === 'ICU Isolation' && r.ward === 'ICU')).map(r => (
                    <div key={r.id} className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded">
                      <span className="font-medium">{r.patientName}</span>
                      <span className="text-gray-500">Day {r.isolationDay}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Isolation Protocol Checklist</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['PPE Stock (N95, Gloves, Gowns)', 'Hand Sanitizer Stations', 'Disinfection Schedule', 'Waste Disposal Protocol', 'Patient Monitoring Equipment', 'Oxygen Supply'].map(item => (
                <div key={item} className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <span className="text-green-600">✅</span>
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Vaccination Tab */}
      {tab === 'vaccination' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-bold text-gray-900 mb-4">Vaccination Coverage Overview</h3>
              <div className="space-y-4">
                {VACCINATION_STATS.map(v => (
                  <div key={v.label} className="flex items-center gap-4">
                    <div className="w-32 text-sm">{v.label}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                      <div className={`h-4 rounded-full ${v.color} flex items-center justify-center text-white text-xs font-bold`} style={{ width: `${v.pct}%` }}>{v.pct}%</div>
                    </div>
                    <div className="w-16 text-right text-sm font-bold">{v.count}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold text-gray-900 mb-4">Vaccination Campaigns</h3>
              <div className="space-y-3">
                {VACCINATION_CAMPAIGNS.map(c => (
                  <div key={c.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{c.targetGroup}</div>
                        <div className="text-xs text-gray-500">{c.startDate} → {c.endDate}</div>
                      </div>
                      <Badge className={c.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>{c.status}</Badge>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{c.dosesAdministered} / {c.targetDoses} doses</span>
                        <span>{c.targetDoses > 0 ? (c.dosesAdministered / c.targetDoses * 100).toFixed(0) : 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${c.targetDoses > 0 ? (c.dosesAdministered / c.targetDoses * 100) : 0}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Contact Tracing Tab */}
      {tab === 'tracing' && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Contact Tracing Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{records.reduce((s, r) => s + r.closeContacts, 0)}</div>
                <div className="text-sm text-blue-800">Total Contacts</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{records.filter(r => r.contactTracingDone).length}</div>
                <div className="text-sm text-green-800">Traced</div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">{records.filter(r => !r.contactTracingDone && r.closeContacts > 0).length}</div>
                <div className="text-sm text-yellow-800">Pending</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{records.filter(r => r.contactTracingDone && r.closeContacts > 5).length}</div>
                <div className="text-sm text-red-800">High Risk</div>
              </div>
            </div>
            <div className="bg-white rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">Index Case</th>
                    <th className="px-4 py-3 text-left">Close Contacts</th>
                    <th className="px-4 py-3 text-left">Traced</th>
                    <th className="px-4 py-3 text-left">Exposure</th>
                    <th className="px-4 py-3 text-left">Comorbidities</th>
                  </tr>
                </thead>
                <tbody>
                  {records.filter(r => r.closeContacts > 0).map(r => (
                    <tr key={r.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3"><div className="font-medium">{r.patientName}</div><div className="text-xs text-gray-500">{r.id}</div></td>
                      <td className="px-4 py-3 font-bold">{r.closeContacts}</td>
                      <td className="px-4 py-3">
                        <span className={r.contactTracingDone ? 'text-green-600 font-bold' : 'text-yellow-600'}>
                          {r.contactTracingDone ? '✅ Complete' : '⏳ Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{r.exposureHistory}</td>
                      <td className="px-4 py-3 text-sm">{r.comorbidities.length > 0 ? r.comorbidities.join(', ') : 'None'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Surveillance Tab */}
      {tab === 'surveillance' && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">7-Day Epidemiological Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Daily New Cases (Last 7 Days)</div>
                <div className="flex items-end gap-2 h-32">
                  {[12, 8, 15, 6, 9, 4, 3].map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div className="text-xs font-bold text-blue-600">{val}</div>
                      <div className="w-full bg-blue-500 rounded-t" style={{ height: `${(val / 15) * 100}%` }} />
                      <div className="text-xs text-gray-500 mt-1">{'Mon Tue Wed Thu Fri Sat Sun'.split(' ')[i]}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Positivity Rate</div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Test Positivity Rate', value: '12.5%', status: 'warning' },
                    { label: 'Reproduction Rate (Rt)', value: '0.85', status: 'good' },
                    { label: 'Case Fatality Rate', value: '1.8%', status: 'warning' },
                    { label: 'Recovery Rate', value: '96.2%', status: 'good' },
                  ].map(m => (
                    <div key={m.label} className={`p-3 rounded-lg ${m.status === 'good' ? 'bg-green-50' : 'bg-yellow-50'}`}>
                      <div className="text-xs text-gray-500">{m.label}</div>
                      <div className={`text-xl font-bold ${m.status === 'good' ? 'text-green-600' : 'text-yellow-600'}`}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Variant Surveillance</h3>
            <div className="space-y-3">
              {[
                { variant: 'Omicron BA.5', pct: 62, trend: '↓ Decreasing', color: 'bg-blue-500' },
                { variant: 'Omicron XBB.1.5', pct: 28, trend: '↑ Increasing', color: 'bg-orange-500' },
                { variant: 'Other Omicron', pct: 8, trend: '→ Stable', color: 'bg-gray-500' },
                { variant: 'Delta', pct: 2, trend: '↓ Decreasing', color: 'bg-green-500' },
              ].map(v => (
                <div key={v.variant}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{v.variant}</span>
                    <span className="text-gray-600">{v.pct}% — {v.trend}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className={`h-3 rounded-full ${v.color}`} style={{ width: `${v.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Screening Form Modal */}
      {showScreenForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">COVID-19 Screening Form</h3>
              <button onClick={() => setShowScreenForm(false)} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {['Full Name', 'Date of Birth', 'Gender', 'Phone Number', 'Temperature (°C)', 'Screening Date', 'Exposure History'].map(f => (
                <div key={f} className={f === 'Exposure History' ? 'col-span-2' : ''}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f}</label>
                  <input type={f.includes('Date') ? 'date' : f.includes('Temperature') ? 'number' : 'text'} className="w-full border rounded-lg px-3 py-2" />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms</label>
                <div className="flex flex-wrap gap-2">
                  {['Fever', 'Cough', 'Shortness of Breath', 'Body Aches', 'Loss of Taste/Smell', 'Fatigue', 'Sore Throat', 'Headache', 'Diarrhea'].map(s => (
                    <label key={s} className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm cursor-pointer">
                      <input type="checkbox" className="rounded" />{s}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rapid Test Result</label>
                <select className="w-full border rounded-lg px-3 py-2">
                  <option>Pending</option><option>Positive</option><option>Negative</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <select className="w-full border rounded-lg px-3 py-2">
                  <option>Asymptomatic</option><option>Mild</option><option>Moderate</option><option>Severe</option><option>Critical</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowScreenForm(false)} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => { setShowScreenForm(false); toast('Screening recorded successfully', 'success'); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Screening</button>
            </div>
          </div>
        </div>
      )}

      {/* Vaccination Form Modal */}
      {showVaccForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Record Vaccination</h3>
              <button onClick={() => setShowVaccForm(false)} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vaccine Type</label>
                <select className="w-full border rounded-lg px-3 py-2">
                  <option>Pfizer-BioNTech</option><option>Moderna</option><option>AstraZeneca</option><option>Johnson & Johnson</option><option>Sputnik V</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dose Number</label>
                  <select className="w-full border rounded-lg px-3 py-2">
                    <option>Dose 1</option><option>Dose 2</option><option>Booster 1</option><option>Booster 2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Administered</label>
                  <input type="date" className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Administered By</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowVaccForm(false)} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => { setShowVaccForm(false); toast('Vaccination recorded successfully', 'success'); }} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Save Vaccination</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
