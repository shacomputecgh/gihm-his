import { useState } from 'react';
import { Card, Badge, useToast } from '../../components/ui';

interface CathProcedure {
  id: string;
  patientName: string;
  mrn: string;
  age: number;
  gender: string;
  referringDoctor: string;
  procedureDate: string;
  scheduledTime: string;
  actualTime: string;
  procedureType: 'Diagnostic Angiogram' | 'PCI (Primary)' | 'PCI (Elective)' | 'Right Heart Cath' | 'Valvuloplasty' | 'PFO Closure' | 'TAVR' | 'Rotational Atherectomy' | 'IVUS' | 'FFR Assessment';
  indication: string;
  accessSite: 'Right Femoral' | 'Left Femoral' | 'Right Radial' | 'Left Radial' | 'Brachial';
  accessSiteComplication: 'None' | 'Hematoma' | 'Bleeding' | 'Pseudoaneurysm' | 'AV Fistula' | 'Dissection';
  contrastUsed: number; // mL
  radiationDose: number; // mGy
  fluoroscopyTime: number; // minutes
  operator: string;
  assistant: string;
  findings: string;
  intervention: string;
  stentsUsed: number;
  balloonInflations: number;
  heparinDose: number; // units
  outcome: 'Success' | 'Partial Success' | 'Complication' | 'Aborted';
  complications: string[];
  postProcBP: string;
  postProcHR: number;
  bedRestHours: number;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
}

const SAMPLE_PROCEDURES: CathProcedure[] = [
  { id: 'CATH-001', patientName: 'Kwame Mensah', mrn: 'MRN-12345', age: 62, gender: 'Male', referringDoctor: 'Dr. Appiah', procedureDate: '2026-08-25', scheduledTime: '08:00', actualTime: '08:15', procedureType: 'Diagnostic Angiogram', indication: 'Chest pain with elevated troponins', accessSite: 'Right Radial', accessSiteComplication: 'None', contrastUsed: 120, radiationDose: 3450, fluoroscopyTime: 12, operator: 'Dr. Yaa Asantewaa', assistant: 'Tech. Boateng', findings: 'LAD 70% mid-segment, LCx 40% proximal', intervention: 'Deferred PCI - medical management', stentsUsed: 0, balloonInflations: 0, heparinDose: 5000, outcome: 'Success', complications: [], postProcBP: '130/80', postProcHR: 72, bedRestHours: 4, status: 'Completed' },
  { id: 'CATH-002', patientName: 'Ama Osei', mrn: 'MRN-12350', age: 55, gender: 'Female', referringDoctor: 'Dr. Mensah', procedureDate: '2026-08-25', scheduledTime: '10:30', actualTime: '10:45', procedureType: 'PCI (Primary)', indication: 'STEMI - anterior wall', accessSite: 'Right Radial', accessSiteComplication: 'None', contrastUsed: 180, radiationDose: 5200, fluoroscopyTime: 22, operator: 'Dr. Yaa Asantewaa', assistant: 'Dr. Kumah', findings: 'LAD proximal 99% occlusion', intervention: 'Drug-eluting stent x2 deployed to LAD', stentsUsed: 2, balloonInflations: 4, heparinDose: 10000, outcome: 'Success', complications: [], postProcBP: '125/75', postProcHR: 68, bedRestHours: 6, status: 'Completed' },
  { id: 'CATH-003', patientName: 'Kofi Asante', mrn: 'MRN-12360', age: 70, gender: 'Male', referringDoctor: 'Dr. Darko', procedureDate: '2026-08-25', scheduledTime: '13:00', actualTime: '', procedureType: 'PCI (Elective)', indication: 'Recurrent angina despite optimal medical therapy', accessSite: 'Right Femoral', accessSiteComplication: 'None', contrastUsed: 0, radiationDose: 0, fluoroscopyTime: 0, operator: 'Dr. Yaa Asantewaa', assistant: 'Tech. Boateng', findings: '', intervention: '', stentsUsed: 0, balloonInflations: 0, heparinDose: 0, outcome: 'Success', complications: [], postProcBP: '', postProcHR: 0, bedRestHours: 0, status: 'Scheduled' },
  { id: 'CATH-004', patientName: 'Akua Boateng', mrn: 'MRN-12370', age: 48, gender: 'Female', referringDoctor: 'Dr. Kumah', procedureDate: '2026-08-24', scheduledTime: '09:00', actualTime: '09:20', procedureType: 'Right Heart Cath', indication: 'Pulmonary hypertension evaluation', accessSite: 'Right Femoral', accessSiteComplication: 'Hematoma', contrastUsed: 80, radiationDose: 1200, fluoroscopyTime: 8, operator: 'Dr. Kwadwo Appiah', assistant: 'Nurse Osei', findings: 'PASP 65 mmHg, PCWP 12 mmHg, PVR 5.2 WU', intervention: 'Started on sildenafil 20mg TID', stentsUsed: 0, balloonInflations: 0, heparinDose: 3000, outcome: 'Success', complications: ['Small groin hematoma - managed with compression'], postProcBP: '118/72', postProcHR: 85, bedRestHours: 8, status: 'Completed' },
  { id: 'CATH-005', patientName: 'Yaw Darko', mrn: 'MRN-12380', age: 75, gender: 'Male', referringDoctor: 'Dr. Asantewaa', procedureDate: '2026-08-26', scheduledTime: '08:30', actualTime: '', procedureType: 'TAVR', indication: 'Severe aortic stenosis - high surgical risk', accessSite: 'Left Femoral', accessSiteComplication: 'None', contrastUsed: 0, radiationDose: 0, fluoroscopyTime: 0, operator: 'Dr. Yaa Asantewaa', assistant: 'Dr. Appiah', findings: '', intervention: '', stentsUsed: 0, balloonInflations: 0, heparinDose: 0, outcome: 'Success', complications: [], postProcBP: '', postProcHR: 0, bedRestHours: 0, status: 'Scheduled' },
];

const PROCEDURE_COLORS: Record<string, string> = {
  'Diagnostic Angiogram': 'bg-blue-100 text-blue-800',
  'PCI (Primary)': 'bg-red-100 text-red-800',
  'PCI (Elective)': 'bg-orange-100 text-orange-800',
  'Right Heart Cath': 'bg-purple-100 text-purple-800',
  'Valvuloplasty': 'bg-teal-100 text-teal-800',
  'PFO Closure': 'bg-green-100 text-green-800',
  'TAVR': 'bg-indigo-100 text-indigo-800',
  'Rotational Atherectomy': 'bg-yellow-100 text-yellow-800',
  'IVUS': 'bg-cyan-100 text-cyan-800',
  'FFR Assessment': 'bg-pink-100 text-pink-800',
};

const STATUS_BADGES: Record<string, string> = {
  Scheduled: 'bg-gray-100 text-gray-800',
  'In Progress': 'bg-blue-100 text-blue-800',
  Completed: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
};

export default function CardiacCathLab() {
  const [procedures] = useState<CathProcedure[]>(SAMPLE_PROCEDURES);
  const [tab, setTab] = useState<'overview' | 'schedule' | 'procedures' | 'equipment' | 'quality'>('overview');
  const [showForm, setShowForm] = useState(false);
  const toast = useToast();

  const completed = procedures.filter(p => p.status === 'Completed');
  const scheduled = procedures.filter(p => p.status === 'Scheduled');
  const avgFluoro = completed.length > 0 ? (completed.reduce((s, p) => s + p.fluoroscopyTime, 0) / completed.length).toFixed(1) : '0';
  const avgContrast = completed.length > 0 ? Math.round(completed.reduce((s, p) => s + p.contrastUsed, 0) / completed.length) : 0;
  const totalStents = completed.reduce((s, p) => s + p.stentsUsed, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">❤️ Cardiac Catheterization Lab</h1>
          <p className="text-gray-600 mt-1">Procedures · Scheduling · Equipment · Quality Metrics</p>
        </div>
        <button onClick={() => { setShowForm(true); toast('New procedure form opened', 'success'); }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">+ Book Procedure</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: 'Today Procedures', value: procedures.length, icon: '🏥', color: 'text-blue-600' },
          { label: 'Completed', value: completed.length, icon: '✅', color: 'text-green-600' },
          { label: 'Scheduled', value: scheduled.length, icon: '📅', color: 'text-orange-600' },
          { label: 'Avg Fluoro Time', value: `${avgFluoro} min`, icon: '⏱️', color: 'text-gray-600' },
          { label: 'Avg Contrast', value: `${avgContrast} mL`, icon: '💧', color: 'text-blue-600' },
          { label: 'Stents Deployed', value: totalStents, icon: '🔧', color: 'text-red-600' },
        ].map((stat, i) => (
          <Card key={i} className="p-4">
            <div className="text-sm text-gray-500">{stat.icon} {stat.label}</div>
            <div className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {(['overview', 'schedule', 'procedures', 'equipment', 'quality'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === t ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'schedule' ? '📅 Schedule' : t === 'procedures' ? '🫀 Procedures' : t === 'equipment' ? '🔧 Equipment' : '📈 Quality'}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Today's Procedure Type Mix</h3>
            <div className="space-y-3">
              {Object.entries(procedures.reduce<Record<string, number>>((acc, p) => {
                acc[p.procedureType] = (acc[p.procedureType] || 0) + 1;
                return acc;
              }, {})).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <Badge className={PROCEDURE_COLORS[type] || 'bg-gray-100 text-gray-800'}>{type}</Badge>
                  <span className="font-bold text-gray-700">{count}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Access Site Distribution</h3>
            <div className="space-y-3">
              {Object.entries(procedures.reduce<Record<string, number>>((acc, p) => {
                acc[p.accessSite] = (acc[p.accessSite] || 0) + 1;
                return acc;
              }, {})).map(([site, count]) => (
                <div key={site} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">{site}</span>
                  <span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Today's Procedures</h3>
            <div className="space-y-3">
              {procedures.map(p => (
                <div key={p.id} className="p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{p.patientName} — {p.age}y {p.gender}</div>
                      <div className="text-xs text-gray-500">{p.procedureType} · {p.scheduledTime} · {p.operator}</div>
                    </div>
                    <Badge className={STATUS_BADGES[p.status]}>{p.status}</Badge>
                  </div>
                  {p.findings && <div className="text-xs text-blue-600 mt-1">📋 {p.findings}</div>}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Outcome Summary</h3>
            <div className="space-y-4">
              {completed.map(p => (
                <div key={p.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-sm">{p.patientName}</div>
                      <div className="text-xs text-gray-500">{p.procedureType}</div>
                    </div>
                    <Badge className={p.outcome === 'Success' ? 'bg-green-100 text-green-800' : p.outcome === 'Complication' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>{p.outcome}</Badge>
                  </div>
                  {p.stentsUsed > 0 && <div className="text-xs text-gray-600 mt-1">🔧 {p.stentsUsed} stent(s) · 💧 {p.contrastUsed} mL · ⏱️ {p.fluoroscopyTime} min</div>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Schedule Tab */}
      {tab === 'schedule' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-bold text-gray-900 mb-3">📅 Schedule — {procedures[0]?.procedureDate || 'Today'}</h3>
            <div className="space-y-2">
              {procedures.map(p => (
                <div key={p.id} className={`flex items-center gap-4 p-3 rounded-lg border-l-4 ${p.status === 'Completed' ? 'border-green-500 bg-green-50' : p.status === 'In Progress' ? 'border-blue-500 bg-blue-50' : p.status === 'Scheduled' ? 'border-orange-500 bg-orange-50' : 'border-gray-300 bg-gray-50'}`}>
                  <div className="w-16 text-center">
                    <div className="text-lg font-bold text-gray-900">{p.scheduledTime}</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{p.patientName}</span>
                      <Badge className={PROCEDURE_COLORS[p.procedureType]}>{p.procedureType}</Badge>
                      <Badge className={STATUS_BADGES[p.status]}>{p.status}</Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {p.indication} · {p.accessSite} · Operator: {p.operator}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Procedures Tab */}
      {tab === 'procedures' && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Patient</th>
                <th className="px-4 py-3 text-left">Procedure</th>
                <th className="px-4 py-3 text-left">Access</th>
                <th className="px-4 py-3 text-left">Findings</th>
                <th className="px-4 py-3 text-left">Stents</th>
                <th className="px-4 py-3 text-left">Contrast</th>
                <th className="px-4 py-3 text-left">Fluoro</th>
                <th className="px-4 py-3 text-left">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {procedures.map(p => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3"><div className="font-medium">{p.patientName}</div><div className="text-xs text-gray-500">{p.mrn}</div></td>
                  <td className="px-4 py-3"><Badge className={PROCEDURE_COLORS[p.procedureType]}>{p.procedureType}</Badge></td>
                  <td className="px-4 py-3 text-sm">{p.accessSite}</td>
                  <td className="px-4 py-3 text-sm max-w-[200px] truncate">{p.findings || '—'}</td>
                  <td className="px-4 py-3 text-center font-bold">{p.stentsUsed || '—'}</td>
                  <td className="px-4 py-3 text-center">{p.contrastUsed || '—'} mL</td>
                  <td className="px-4 py-3 text-center">{p.fluoroscopyTime || '—'} min</td>
                  <td className="px-4 py-3"><Badge className={p.outcome === 'Success' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>{p.outcome}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Equipment Tab */}
      {tab === 'equipment' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'Philips Azurion 7', type: 'Primary Cath Lab', status: 'Operational', lastService: '2026-07-15', nextService: '2026-10-15' },
            { name: 'Siemens Artis icono', type: 'Interventional Suite', status: 'Operational', lastService: '2026-06-20', nextService: '2026-09-20' },
            { name: 'IVUS Console', type: 'Intravascular Ultrasound', status: 'Operational', lastService: '2026-05-10', nextService: '2026-11-10' },
            { name: 'Hemodynamic Monitor', type: 'Pressure Monitoring', status: 'Operational', lastService: '2026-08-01', nextService: '2026-11-01' },
            { name: 'Portable Echo Machine', type: 'Bedside Echocardiography', status: 'Operational', lastService: '2026-07-20', nextService: '2026-10-20' },
            { name: 'IABP Console', type: 'Intra-Aortic Balloon Pump', status: 'Standby', lastService: '2026-08-10', nextService: '2026-11-10' },
          ].map((eq, i) => (
            <Card key={i} className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-gray-900">{eq.name}</div>
                  <div className="text-sm text-gray-600">{eq.type}</div>
                </div>
                <Badge className={eq.status === 'Operational' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>{eq.status}</Badge>
              </div>
              <div className="mt-3 space-y-1 text-xs text-gray-500">
                <div>Last Service: {eq.lastService}</div>
                <div>Next Service: {eq.nextService}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Quality Tab */}
      {tab === 'quality' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Procedure Outcomes</h3>
            <div className="space-y-3">
              {['Success', 'Partial Success', 'Complication', 'Aborted'].map(outcome => {
                const count = completed.filter(p => p.outcome === outcome).length;
                const pct = completed.length > 0 ? (count / completed.length * 100) : 0;
                return (
                  <div key={outcome}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{outcome}</span>
                      <span className="font-bold">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full ${outcome === 'Success' ? 'bg-green-500' : outcome === 'Complication' ? 'bg-red-500' : 'bg-yellow-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Complication Registry</h3>
            <div className="space-y-3">
              {completed.filter(p => p.complications.length > 0 || p.accessSiteComplication !== 'None').map(p => (
                <div key={p.id} className="p-3 bg-red-50 rounded-lg">
                  <div className="font-medium text-red-800">{p.patientName} — {p.procedureType}</div>
                  {p.accessSiteComplication !== 'None' && <div className="text-sm text-red-600">⚠️ Access Site: {p.accessSiteComplication}</div>}
                  {p.complications.map((c, i) => <div key={i} className="text-sm text-red-600">⚠️ {c}</div>)}
                </div>
              ))}
              {completed.filter(p => p.complications.length > 0 || p.accessSiteComplication !== 'None').length === 0 && (
                <div className="text-center py-4 text-gray-500">No complications recorded</div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Radiation Dose Metrics</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <div className="text-lg font-bold text-gray-900">{avgFluoro}</div>
                  <div className="text-xs text-gray-500">Avg Fluoroscopy (min)</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <div className="text-lg font-bold text-gray-900">{completed.length > 0 ? Math.round(completed.reduce((s, p) => s + p.radiationDose, 0) / completed.length).toLocaleString() : 0}</div>
                  <div className="text-xs text-gray-500">Avg Dose (mGy)</div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Contrast Usage</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <div className="text-lg font-bold text-gray-900">{avgContrast}</div>
                  <div className="text-xs text-gray-500">Avg Contrast (mL)</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <div className="text-lg font-bold text-gray-900">{completed.reduce((s, p) => s + p.contrastUsed, 0)}</div>
                  <div className="text-xs text-gray-500">Total Contrast (mL)</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Procedure Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Book New Cath Procedure</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {['Patient Name', 'MRN', 'Age', 'Date of Procedure', 'Scheduled Time'].map(f => (
                <div key={f}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f}</label>
                  <input type={f.includes('Date') ? 'date' : f.includes('Time') ? 'time' : f === 'Age' ? 'number' : 'text'} className="w-full border rounded-lg px-3 py-2" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Procedure Type</label>
                <select className="w-full border rounded-lg px-3 py-2">
                  {Object.keys(PROCEDURE_COLORS).map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Access Site</label>
                <select className="w-full border rounded-lg px-3 py-2">
                  <option>Right Radial</option><option>Left Radial</option><option>Right Femoral</option><option>Left Femoral</option><option>Brachial</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Indication</label>
                <textarea className="w-full border rounded-lg px-3 py-2" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Operator</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referring Doctor</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => { setShowForm(false); toast('Procedure booked successfully', 'success'); }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Book Procedure</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
