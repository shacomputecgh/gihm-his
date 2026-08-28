import { useState } from 'react';
import { Card, Badge } from '../../components/ui';

interface CalibRecord {
  id: string;
  equipmentName: string;
  department: string;
  model: string;
  serialNumber: string;
  category: 'Diagnostic' | 'Therapeutic' | 'Life Support' | 'Laboratory' | 'Surgical' | 'Monitoring';
  lastCalibration: string;
  nextCalibration: string;
  calibInterval: string;
  calibratedBy: string;
  certificateNumber: string;
  status: 'Current' | 'Due Soon' | 'Overdue' | 'Out of Service';
  location: string;
  accuracy?: number;
  drift?: number;
}

const SAMPLE: CalibRecord[] = [
  { id: 'CAL-001', equipmentName: 'Ventilator - ICU 1', department: 'ICU', model: 'Hamilton C6', serialNumber: 'SN-2023-001', category: 'Life Support', lastCalibration: '2026-05-15', nextCalibration: '2026-11-15', calibInterval: '6 months', calibratedBy: 'Biomed Engineering', certificateNumber: 'CERT-2026-001', status: 'Current', location: 'ICU Bed 1', accuracy: 99.2, drift: 0.3 },
  { id: 'CAL-002', equipmentName: 'Defibrillator - ED', department: 'Emergency', model: 'LIFEPAK 15', serialNumber: 'SN-2022-045', category: 'Life Support', lastCalibration: '2026-07-01', nextCalibration: '2027-01-01', calibInterval: '6 months', calibratedBy: 'Biomed Engineering', certificateNumber: 'CERT-2026-002', status: 'Current', location: 'ER Resuscitation Bay', accuracy: 98.8, drift: 0.5 },
  { id: 'CAL-003', equipmentName: 'Infant Incubator 1', department: 'NICU', model: 'Dräger Babyleo TN500', serialNumber: 'SN-2023-010', category: 'Life Support', lastCalibration: '2026-06-20', nextCalibration: '2026-09-20', calibInterval: '3 months', calibratedBy: 'Biomed Engineering', certificateNumber: 'CERT-2026-003', status: 'Due Soon', location: 'NICU Bed 3', accuracy: 97.5, drift: 1.2 },
  { id: 'CAL-004', equipmentName: 'Blood Gas Analyzer', department: 'Laboratory', model: 'ABL90 FLEX', serialNumber: 'SN-2021-022', category: 'Laboratory', lastCalibration: '2026-08-01', nextCalibration: '2026-09-01', calibInterval: 'Monthly', calibratedBy: 'Lab Supervisor', certificateNumber: 'CERT-2026-004', status: 'Current', location: 'Clinical Chemistry Lab', accuracy: 99.5, drift: 0.2 },
  { id: 'CAL-005', equipmentName: 'Surgical Diathermy', department: 'Theatre 1', model: 'ERBE VIO 300', serialNumber: 'SN-2020-033', category: 'Surgical', lastCalibration: '2026-03-10', nextCalibration: '2026-09-10', calibInterval: '6 months', calibratedBy: 'Biomed Engineering', certificateNumber: 'CERT-2026-005', status: 'Due Soon', location: 'Theatre 1', accuracy: 98.0, drift: 1.8 },
  { id: 'CAL-006', equipmentName: 'X-Ray Machine 2', department: 'Radiology', model: 'Siemens Ysio', serialNumber: 'SN-2019-008', category: 'Diagnostic', lastCalibration: '2026-01-15', nextCalibration: '2026-07-15', calibInterval: '6 months', calibratedBy: 'External Vendor', certificateNumber: 'CERT-2026-006', status: 'Overdue', location: 'X-Ray Room 2', accuracy: 96.0, drift: 3.2 },
  { id: 'CAL-007', equipmentName: 'ECG Monitor 3', department: 'Cardiology', model: 'Philips PageWriter TC70', serialNumber: 'SN-2022-015', category: 'Monitoring', lastCalibration: '2026-07-20', nextCalibration: '2027-01-20', calibInterval: '6 months', calibratedBy: 'Biomed Engineering', certificateNumber: 'CERT-2026-007', status: 'Current', location: 'Cardiology Ward', accuracy: 99.0, drift: 0.4 },
  { id: 'CAL-008', equipmentName: 'MRI Scanner', department: 'Radiology', model: 'Siemens MAGNETOM Aera', serialNumber: 'SN-2018-003', category: 'Diagnostic', lastCalibration: '2026-06-01', nextCalibration: '2026-12-01', calibInterval: '6 months', calibratedBy: 'Siemens Service', certificateNumber: 'CERT-2026-008', status: 'Current', location: 'MRI Suite', accuracy: 99.8, drift: 0.1 },
];

const STATUS_COLORS: Record<string, string> = { Current: 'bg-green-100 text-green-800', 'Due Soon': 'bg-yellow-100 text-yellow-800', Overdue: 'bg-red-100 text-red-800', 'Out of Service': 'bg-gray-100 text-gray-800' };
const CATEGORY_COLORS: Record<string, string> = { Diagnostic: 'bg-blue-100 text-blue-800', Therapeutic: 'bg-purple-100 text-purple-800', 'Life Support': 'bg-red-100 text-red-800', Laboratory: 'bg-green-100 text-green-800', Surgical: 'bg-orange-100 text-orange-800', Monitoring: 'bg-teal-100 text-teal-800' };

export default function EquipmentCalibration() {
  const [records] = useState<CalibRecord[]>(SAMPLE);
  const [tab, setTab] = useState<'overview' | 'schedule' | 'inventory' | 'compliance'>('overview');

  const overdue = records.filter(r => r.status === 'Overdue');
  const dueSoon = records.filter(r => r.status === 'Due Soon');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🔧 Equipment Calibration</h1>
          <p className="text-gray-600 mt-1">Calibration schedules · Compliance tracking · Certificates</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Equipment', value: records.length, icon: '🔧', color: 'text-blue-600' },
          { label: 'Current', value: records.filter(r => r.status === 'Current').length, icon: '✅', color: 'text-green-600' },
          { label: 'Due Soon', value: dueSoon.length, icon: '⏰', color: 'text-yellow-600' },
          { label: 'Overdue', value: overdue.length, icon: '🚨', color: 'text-red-600' },
        ].map((s, i) => (
          <Card key={i} className="p-4">
            <div className="text-sm text-gray-500">{s.icon} {s.label}</div>
            <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {(['overview', 'schedule', 'inventory', 'compliance'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === t ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'schedule' ? '📅 Schedule' : t === 'inventory' ? '📦 Inventory' : '✅ Compliance'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">By Category</h3>
            <div className="space-y-2">
              {Object.entries(records.reduce<Record<string, number>>((a, r) => { a[r.category] = (a[r.category] || 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                <div key={cat} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <Badge className={CATEGORY_COLORS[cat]}>{cat}</Badge>
                  <span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Accuracy Trends</h3>
            <div className="space-y-3">
              {records.map(r => (
                <div key={r.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{r.equipmentName}</span>
                    <span className={`font-bold ${(r.accuracy ?? 0) >= 98 ? 'text-green-600' : (r.accuracy ?? 0) >= 96 ? 'text-yellow-600' : 'text-red-600'}`}>{r.accuracy}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${r.accuracy}%` }} /></div>
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
                <th className="px-4 py-3 text-left">Equipment</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">Last Calibrated</th>
                <th className="px-4 py-3 text-left">Next Due</th>
                <th className="px-4 py-3 text-left">Interval</th>
                <th className="px-4 py-3 text-left">Certificate</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.sort((a, b) => new Date(a.nextCalibration).getTime() - new Date(b.nextCalibration).getTime()).map(r => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3"><div className="font-medium">{r.equipmentName}</div><div className="text-xs text-gray-500">{r.model}</div></td>
                  <td className="px-4 py-3">{r.department}</td>
                  <td className="px-4 py-3">{r.lastCalibration}</td>
                  <td className="px-4 py-3">{r.nextCalibration}</td>
                  <td className="px-4 py-3">{r.calibInterval}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.certificateNumber}</td>
                  <td className="px-4 py-3"><Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'inventory' && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Equipment</th>
                <th className="px-4 py-3 text-left">Model</th>
                <th className="px-4 py-3 text-left">Serial No</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Accuracy</th>
                <th className="px-4 py-3 text-left">Drift</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{r.equipmentName}</td>
                  <td className="px-4 py-3 text-gray-600">{r.model}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.serialNumber}</td>
                  <td className="px-4 py-3"><Badge className={CATEGORY_COLORS[r.category]}>{r.category}</Badge></td>
                  <td className="px-4 py-3">{r.location}</td>
                  <td className="px-4 py-3 font-bold">{r.accuracy}%</td>
                  <td className="px-4 py-3"><span className={(r.drift ?? 0) > 2 ? 'text-red-600 font-bold' : 'text-gray-600'}>{r.drift}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'compliance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Compliance Rate</h3>
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600">{((records.filter(r => r.status === 'Current').length / records.length) * 100).toFixed(0)}%</div>
              <div className="text-sm text-gray-500 mt-2">Equipment calibrated on time</div>
            </div>
            <div className="mt-4 space-y-2">
              {['Current', 'Due Soon', 'Overdue', 'Out of Service'].map(s => (
                <div key={s} className="flex justify-between text-sm"><span>{s}</span><span className="font-bold">{records.filter(r => r.status === s).length}</span></div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Regulatory Requirements</h3>
            <div className="space-y-2">
              {['FDA 21 CFR Part 820 — Medical Device Quality System', 'ISO 13485 — Medical Devices Quality Management', 'IEC 62304 — Medical Device Software Lifecycle', 'WHO Medical Device Technical Series', 'Ghana FDA Medical Device Registration'].map((r, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                  <span className="text-blue-600">📋</span><span className="text-sm text-gray-700">{r}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
