import { useState } from 'react';
import { Card, Badge, useToast } from '../../components/ui';

interface RadiationRecord {
  id: string;
  staffName: string;
  staffId: string;
  department: string;
  role: string;
  dosimeterId: string;
  reading: number; // mSv
  limit: number; // mSv annual limit
  period: string;
  periodStart: string;
  periodEnd: string;
  exposureType: 'Diagnostic' | 'Therapeutic' | 'Interventional' | 'Nuclear Medicine';
  area: string;
  leadApronUsed: boolean;
  thyroidShieldUsed: boolean;
  dosimeterWorn: boolean;
  incidentReported: boolean;
  status: 'Normal' | 'Elevated' | 'Warning' | 'Critical';
}

interface RadiationIncident {
  id: string;
  date: string;
  staffName: string;
  description: string;
  doseEstimated: number;
  severity: 'Low' | 'Moderate' | 'High' | 'Critical';
  investigated: boolean;
  correctiveAction: string;
}

const SAMPLE_RADIATION: RadiationRecord[] = [
  { id: 'RAD-001', staffName: 'Dr. Kofi Mensah', staffId: 'STF-001', department: 'Radiology', role: 'Radiologist', dosimeterId: 'DOS-001', reading: 12.5, limit: 20, period: '2026 Q3', periodStart: '2026-07-01', periodEnd: '2026-09-30', exposureType: 'Diagnostic', area: 'X-Ray Room 1', leadApronUsed: true, thyroidShieldUsed: true, dosimeterWorn: true, incidentReported: false, status: 'Elevated' },
  { id: 'RAD-002', staffName: 'Nurse Ama Osei', staffId: 'STF-045', department: 'Radiology', role: 'Radiology Nurse', dosimeterId: 'DOS-002', reading: 4.2, limit: 20, period: '2026 Q3', periodStart: '2026-07-01', periodEnd: '2026-09-30', exposureType: 'Diagnostic', area: 'CT Suite', leadApronUsed: true, thyroidShieldUsed: true, dosimeterWorn: true, incidentReported: false, status: 'Normal' },
  { id: 'RAD-003', staffName: 'Dr. Yaa Asantewaa', staffId: 'STF-012', department: 'Cardiology', role: 'Interventional Cardiologist', dosimeterId: 'DOS-003', reading: 18.7, limit: 20, period: '2026 Q3', periodStart: '2026-07-01', periodEnd: '2026-09-30', exposureType: 'Interventional', area: 'Cath Lab', leadApronUsed: true, thyroidShieldUsed: false, dosimeterWorn: true, incidentReported: true, status: 'Warning' },
  { id: 'RAD-004', staffName: 'Dr. Kwadwo Appiah', staffId: 'STF-008', department: 'Nuclear Medicine', role: 'Nuclear Medicine Physician', dosimeterId: 'DOS-004', reading: 8.3, limit: 20, period: '2026 Q3', periodStart: '2026-07-01', periodEnd: '2026-09-30', exposureType: 'Nuclear Medicine', area: 'Nuclear Med Lab', leadApronUsed: false, thyroidShieldUsed: true, dosimeterWorn: true, incidentReported: false, status: 'Normal' },
  { id: 'RAD-005', staffName: 'Tech. Akua Boateng', staffId: 'STF-022', department: 'Radiology', role: 'Radiographer', dosimeterId: 'DOS-005', reading: 22.1, limit: 20, period: '2026 Q3', periodStart: '2026-07-01', periodEnd: '2026-09-30', exposureType: 'Diagnostic', area: 'Fluoroscopy', leadApronUsed: true, thyroidShieldUsed: false, dosimeterWorn: true, incidentReported: true, status: 'Critical' },
  { id: 'RAD-006', staffName: 'Dr. Esi Kumah', staffId: 'STF-033', department: 'Oncology', role: 'Radiation Oncologist', dosimeterId: 'DOS-006', reading: 15.0, limit: 20, period: '2026 Q3', periodStart: '2026-07-01', periodEnd: '2026-09-30', exposureType: 'Therapeutic', area: 'Radiotherapy Suite', leadApronUsed: true, thyroidShieldUsed: true, dosimeterWorn: true, incidentReported: false, status: 'Elevated' },
];

const INCIDENTS: RadiationIncident[] = [
  { id: 'RI-001', date: '2026-08-15', staffName: 'Dr. Yaa Asantewaa', description: 'Thyroid shield not worn during prolonged catheterization procedure (>60 min)', doseEstimated: 2.3, severity: 'Moderate', investigated: true, correctiveAction: 'Mandatory thyroid shield policy enforced in Cath Lab' },
  { id: 'RI-002', date: '2026-08-20', staffName: 'Tech. Akua Boateng', description: 'Dosimeter read above annual limit (22.1 mSv vs 20 mSv limit). Overexposure during fluoroscopy-guided procedure.', doseEstimated: 5.8, severity: 'High', investigated: true, correctiveAction: 'Staff reassigned from fluoroscopy, ALARA training scheduled' },
];

const EQUIPMENT = [
  { name: 'X-Ray Room 1 (Digital)', model: 'Siemens Ysio Max', lastCalibration: '2026-06-15', nextCalibration: '2026-12-15', status: 'Calibrated', radiationType: 'X-Ray' },
  { name: 'CT Scanner', model: 'GE Revolution CT', lastCalibration: '2026-05-20', nextCalibration: '2026-11-20', status: 'Calibrated', radiationType: 'CT' },
  { name: 'Cath Lab', model: 'Philips Azurion 7', lastCalibration: '2026-07-01', nextCalibration: '2027-01-01', status: 'Calibrated', radiationType: 'Fluoroscopy' },
  { name: 'Linear Accelerator', model: 'Varian TrueBeam', lastCalibration: '2026-04-10', nextCalibration: '2026-10-10', status: 'Calibrated', radiationType: 'Radiotherapy' },
  { name: 'Mammography Unit', model: 'Hologic Selenia Dimensions', lastCalibration: '2026-08-01', nextCalibration: '2027-02-01', status: 'Calibrated', radiationType: 'Mammography' },
  { name: 'Nuclear Med Camera', model: 'Siemens Symbia T', lastCalibration: '2026-03-15', nextCalibration: '2026-09-15', status: 'Due Soon', radiationType: 'Gamma' },
];

const STATUS_COLORS: Record<string, string> = {
  Normal: 'bg-green-100 text-green-800',
  Elevated: 'bg-yellow-100 text-yellow-800',
  Warning: 'bg-orange-100 text-orange-800',
  Critical: 'bg-red-100 text-red-800',
};

export default function RadiationSafety() {
  const [records] = useState<RadiationRecord[]>(SAMPLE_RADIATION);
  const [tab, setTab] = useState<'overview' | 'staff' | 'equipment' | 'incidents' | 'policies'>('overview');
  const toast = useToast();

  const totalExposed = records.length;
  const warningStaff = records.filter(r => r.status === 'Warning' || r.status === 'Critical');
  const normalStaff = records.filter(r => r.status === 'Normal');
  const avgReading = records.length > 0 ? (records.reduce((s, r) => s + r.reading, 0) / records.length).toFixed(1) : '0';
  const equipmentDueSoon = EQUIPMENT.filter(e => e.status === 'Due Soon');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">☢️ Radiation Safety</h1>
          <p className="text-gray-600 mt-1">Staff monitoring · Equipment calibration · Incident management · ALARA compliance</p>
        </div>
        <button onClick={() => toast('New incident report form opened', 'success')} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">+ Report Incident</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: 'Monitored Staff', value: totalExposed, icon: '👥', color: 'text-blue-600' },
          { label: 'Avg Dose (Q3)', value: `${avgReading} mSv`, icon: '☢️', color: 'text-gray-600' },
          { label: 'Warning/Critical', value: warningStaff.length, icon: '⚠️', color: 'text-red-600' },
          { label: 'Normal Range', value: normalStaff.length, icon: '✅', color: 'text-green-600' },
          { label: 'Active Incidents', value: INCIDENTS.filter(i => !i.investigated).length, icon: '🚨', color: 'text-orange-600' },
          { label: 'Equipment Due', value: equipmentDueSoon.length, icon: '🔧', color: 'text-yellow-600' },
        ].map((stat, i) => (
          <Card key={i} className="p-4">
            <div className="text-sm text-gray-500">{stat.icon} {stat.label}</div>
            <div className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {(['overview', 'staff', 'equipment', 'incidents', 'policies'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === t ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'staff' ? '👥 Staff Monitoring' : t === 'equipment' ? '🔧 Equipment' : t === 'incidents' ? '🚨 Incidents' : '📋 Policies'}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Staff Dose Distribution (Q3 2026)</h3>
            <div className="space-y-3">
              {records.sort((a, b) => b.reading - a.reading).map(r => (
                <div key={r.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{r.staffName} <span className="text-gray-400">({r.department})</span></span>
                    <span className={`font-bold ${r.reading > r.limit ? 'text-red-600' : r.reading > r.limit * 0.75 ? 'text-orange-600' : 'text-green-600'}`}>
                      {r.reading} / {r.limit} mSv
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 relative">
                    <div className={`h-2 rounded-full ${r.reading > r.limit ? 'bg-red-500' : r.reading > r.limit * 0.75 ? 'bg-orange-500' : 'bg-green-500'}`} style={{ width: `${Math.min((r.reading / r.limit) * 100, 100)}%` }} />
                    <div className="absolute right-0 top-0 h-full border-l-2 border-dashed border-red-400" style={{ left: '100%', transform: 'translateX(-2px)' }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-gray-500">Dashed line = Annual limit (20 mSv)</div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">PPE Compliance</h3>
            <div className="space-y-4">
              {[
                { label: 'Lead Apron Worn', compliant: records.filter(r => r.leadApronUsed).length, total: records.length },
                { label: 'Thyroid Shield Worn', compliant: records.filter(r => r.thyroidShieldUsed).length, total: records.length },
                { label: 'Dosimeter Worn', compliant: records.filter(r => r.dosimeterWorn).length, total: records.length },
              ].map(p => (
                <div key={p.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{p.label}</span>
                    <span className="font-bold">{p.compliant}/{p.total} ({(p.compliant / p.total * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className={`h-3 rounded-full ${(p.compliant / p.total * 100) >= 90 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${(p.compliant / p.total * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Equipment Calibration Status</h3>
            <div className="space-y-2">
              {EQUIPMENT.map(e => (
                <div key={e.name} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium">{e.name}</div>
                    <div className="text-xs text-gray-500">{e.model}</div>
                  </div>
                  <Badge className={e.status === 'Calibrated' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>{e.status}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Exposure by Area</h3>
            <div className="space-y-3">
              {Object.entries(records.reduce<Record<string, { count: number; avg: number }>>((acc, r) => {
                if (!acc[r.area]) acc[r.area] = { count: 0, avg: 0 };
                acc[r.area].count++;
                acc[r.area].avg += r.reading;
                return acc;
              }, {})).map(([area, data]) => (
                <div key={area} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium">{area}</div>
                    <div className="text-xs text-gray-500">{data.count} staff</div>
                  </div>
                  <div className="text-sm font-bold text-gray-700">{(data.avg / data.count).toFixed(1)} mSv avg</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Staff Tab */}
      {tab === 'staff' && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Staff</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Dosimeter</th>
                <th className="px-4 py-3 text-left">Reading</th>
                <th className="px-4 py-3 text-left">Exposure Type</th>
                <th className="px-4 py-3 text-left">PPE</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3"><div className="font-medium">{r.staffName}</div><div className="text-xs text-gray-500">{r.staffId}</div></td>
                  <td className="px-4 py-3">{r.department}</td>
                  <td className="px-4 py-3">{r.role}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.dosimeterId}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${r.reading > r.limit ? 'text-red-600' : r.reading > r.limit * 0.75 ? 'text-orange-600' : 'text-green-600'}`}>
                      {r.reading} mSv
                    </span>
                    <span className="text-gray-400"> / {r.limit}</span>
                  </td>
                  <td className="px-4 py-3"><Badge className="bg-gray-100 text-gray-800">{r.exposureType}</Badge></td>
                  <td className="px-4 py-3 text-sm">
                    {r.leadApronUsed ? '🦺' : '❌'} Lead
                    {r.thyroidShieldUsed ? ' ✅' : ' ❌'} Thyroid
                    {r.dosimeterWorn ? ' ✅' : ' ❌'} Dosimeter
                  </td>
                  <td className="px-4 py-3"><Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Equipment Tab */}
      {tab === 'equipment' && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Equipment</th>
                <th className="px-4 py-3 text-left">Model</th>
                <th className="px-4 py-3 text-left">Radiation Type</th>
                <th className="px-4 py-3 text-left">Last Calibration</th>
                <th className="px-4 py-3 text-left">Next Calibration</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {EQUIPMENT.map((e, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{e.name}</td>
                  <td className="px-4 py-3 text-gray-600">{e.model}</td>
                  <td className="px-4 py-3"><Badge className="bg-gray-100 text-gray-800">{e.radiationType}</Badge></td>
                  <td className="px-4 py-3">{e.lastCalibration}</td>
                  <td className="px-4 py-3">{e.nextCalibration}</td>
                  <td className="px-4 py-3"><Badge className={e.status === 'Calibrated' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>{e.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Incidents Tab */}
      {tab === 'incidents' && (
        <div className="space-y-4">
          {INCIDENTS.map(inc => (
            <Card key={inc.id} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-gray-900">{inc.id} — {inc.description}</h4>
                  <div className="text-sm text-gray-600 mt-1">Staff: {inc.staffName} · Date: {inc.date}</div>
                </div>
                <Badge className={inc.severity === 'High' || inc.severity === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>{inc.severity}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Estimated Dose:</span> <span className="font-bold text-red-600">{inc.doseEstimated} mSv</span></div>
                <div><span className="text-gray-500">Investigated:</span> {inc.investigated ? '✅ Yes' : '⏳ Pending'}</div>
              </div>
              <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
                <span className="font-medium text-blue-800">Corrective Action: </span>
                <span className="text-blue-700">{inc.correctiveAction}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Policies Tab */}
      {tab === 'policies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { title: 'ALARA Principle', items: ['Minimize time near radiation source', 'Maximize distance from source', 'Use proper shielding at all times', 'Regular equipment calibration'] },
            { title: 'Dosimetry Requirements', items: ['Wear TLD dosimeter at chest level', 'Second dosimeter for high-dose procedures', 'Monthly dosimeter reading verification', 'Annual cumulative dose tracking'] },
            { title: 'PPE Requirements', items: ['Lead apron (0.5mm Pb equivalent) minimum', 'Thyroid shield mandatory in fluoroscopy', 'Lead glasses for eye protection (optional)', 'Radiation badges must be worn correctly'] },
            { title: 'Incident Reporting', items: ['Report any unplanned exposure immediately', 'Fill Radiation Incident Report form', 'Incident investigation within 48 hours', 'Corrective actions documented and tracked'] },
            { title: 'Pregnancy Protection', items: ['Declaration of pregnancy required', 'Dose limit: 1 mSv to embryo/fetus', 'Remove from high-dose areas', 'Monthly dose monitoring'] },
            { title: 'Emergency Procedures', items: ['Evacuate area if source stuck', 'Do not re-enter until cleared', 'Contact Radiation Safety Officer', 'Document all exposure'] },
          ].map(p => (
            <Card key={p.title} className="p-6">
              <h4 className="font-bold text-gray-900 mb-3">📋 {p.title}</h4>
              <ul className="space-y-2">
                {p.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-blue-600 mt-0.5">•</span>{item}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
