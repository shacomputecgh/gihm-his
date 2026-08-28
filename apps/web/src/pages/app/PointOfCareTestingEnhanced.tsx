import { useState } from 'react';
import { Badge, Card } from '../../components/ui';

interface POCTest { id: string; patientName: string; mrn: string; testType: string; device: string; ward: string; result: string; unit: string; referenceRange: string; status: 'Normal' | 'Abnormal' | 'Critical' | 'Pending'; performedBy: string; performedAt: string; verified: boolean; }
interface POCDevice { id: string; name: string; model: string; location: string; lastCalibrated: string; nextCalibration: string; qcStatus: 'Passed' | 'Failed' | 'Due'; status: 'Active' | 'Maintenance' | 'Offline'; batteryLevel: number; totalTests: number; }

const TESTS: POCTest[] = [
  { id: 'POC-001', patientName: 'Kwame Asante', mrn: 'MRN-2024-0891', testType: 'Blood Glucose', device: 'Accu-Chek Inform II', ward: 'Surgical Ward', result: '5.8', unit: 'mmol/L', referenceRange: '3.9-6.1', status: 'Normal', performedBy: 'Nurse Akua', performedAt: '2026-08-26 08:00', verified: true },
  { id: 'POC-002', patientName: 'Nana Osei', mrn: 'MRN-2024-0567', testType: 'Blood Glucose', device: 'Accu-Chek Inform II', ward: 'ICU', result: '14.2', unit: 'mmol/L', referenceRange: '3.9-6.1', status: 'Critical', performedBy: 'ICU Nurse', performedAt: '2026-08-26 09:00', verified: true },
  { id: 'POC-003', patientName: 'Efua Nyarko', mrn: 'MRN-2024-0998', testType: 'Blood Glucose', device: 'Accu-Chek Inform II', ward: 'Medical Ward B', result: '8.5', unit: 'mmol/L', referenceRange: '3.9-6.1', status: 'Abnormal', performedBy: 'Nurse Esi', performedAt: '2026-08-26 08:30', verified: true },
  { id: 'POC-004', patientName: 'Kofi Amoako Jr.', mrn: 'MRN-2024-0777', testType: 'Rapid Malaria Test', device: 'SD Bioline Malaria Ag Pf', ward: 'Paediatric', result: 'Positive', unit: '', referenceRange: 'Negative', status: 'Abnormal', performedBy: 'Nurse Yaa', performedAt: '2026-08-26 07:30', verified: true },
  { id: 'POC-005', patientName: 'Ama Boateng', mrn: 'MRN-2024-0112', testType: 'Urine Pregnancy', device: 'QuickVue hCG', ward: 'Maternity', result: 'Positive', unit: '', referenceRange: 'Negative', status: 'Normal', performedBy: 'Midwife Abena', performedAt: '2026-08-26 08:15', verified: false },
  { id: 'POC-006', patientName: 'Kwaku Mensah', mrn: 'MRN-2024-0334', testType: 'Blood Glucose', device: 'Accu-Chek Inform II', ward: 'ICU', result: '18.5', unit: 'mmol/L', referenceRange: '3.9-6.1', status: 'Critical', performedBy: 'ICU Nurse', performedAt: '2026-08-26 09:15', verified: true },
  { id: 'POC-007', patientName: 'Kwame Asante', mrn: 'MRN-2024-0891', testType: 'INR', device: 'CoaguChek XS', ward: 'Surgical Ward', result: '1.8', unit: '', referenceRange: '0.8-1.2', status: 'Abnormal', performedBy: 'Nurse Akua', performedAt: '2026-08-26 08:00', verified: true },
];

const DEVICES: POCDevice[] = [
  { id: 'DEV-001', name: 'Accu-Chek Inform II', model: 'Roche', location: 'ICU', lastCalibrated: '2026-08-25', nextCalibration: '2026-09-25', qcStatus: 'Passed', status: 'Active', batteryLevel: 85, totalTests: 1250 },
  { id: 'DEV-002', name: 'Accu-Chek Inform II', model: 'Roche', location: 'Emergency', lastCalibrated: '2026-08-20', nextCalibration: '2026-09-20', qcStatus: 'Passed', status: 'Active', batteryLevel: 72, totalTests: 980 },
  { id: 'DEV-003', name: 'CoaguChek XS', model: 'Roche', location: 'Surgical Ward', lastCalibrated: '2026-08-24', nextCalibration: '2026-09-24', qcStatus: 'Passed', status: 'Active', batteryLevel: 60, totalTests: 450 },
  { id: 'DEV-004', name: 'i-STAT', model: 'Abbott', location: 'ICU', lastCalibrated: '2026-08-26', nextCalibration: '2026-09-26', qcStatus: 'Due', status: 'Active', batteryLevel: 45, totalTests: 320 },
  { id: 'DEV-005', name: 'HemoCue', model: 'HemoCue', location: 'Maternity', lastCalibrated: '2026-08-15', nextCalibration: '2026-09-15', qcStatus: 'Failed', status: 'Maintenance', batteryLevel: 30, totalTests: 780 },
];

export default function PointOfCareTestingEnhanced() {
  const [tab, setTab] = useState<'tests' | 'devices'>('tests');
  const [filter, setFilter] = useState('All');
  const filtered = filter === 'All' ? TESTS : TESTS.filter(t => t.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Point of Care Testing</h1>
          <p className="text-slate-500 text-sm">Bedside testing, device management, and QC tracking</p>
        </div>
        <button onClick={() => {}} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ New Test</button>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('tests')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'tests' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>Tests ({TESTS.length})</button>
        <button onClick={() => setTab('devices')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'devices' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>Devices ({DEVICES.length})</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-xs text-slate-500">Tests Today</p><p className="text-2xl font-bold">{TESTS.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Critical Results</p><p className="text-2xl font-bold text-red-600">{TESTS.filter(t => t.status === 'Critical').length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Devices Active</p><p className="text-2xl font-bold text-green-600">{DEVICES.filter(d => d.status === 'Active').length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">QC Issues</p><p className="text-2xl font-bold text-orange-600">{DEVICES.filter(d => d.qcStatus !== 'Passed').length}</p></Card>
      </div>

      {tab === 'tests' ? (
        <>
          <div className="flex gap-2">
            {['All', 'Normal', 'Abnormal', 'Critical'].map(s => (
              <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 rounded-lg text-xs font-medium ${filter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{s}</button>
            ))}
          </div>
          <div className="space-y-2">
            {filtered.map(t => (
              <Card key={t.id} className={`p-4 ${t.status === 'Critical' ? 'border-red-300 bg-red-50' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${t.status === 'Critical' ? 'text-red-600' : t.status === 'Abnormal' ? 'text-orange-600' : 'text-green-600'}`}>{t.result}</p>
                    <p className="text-xs text-slate-500">{t.unit}</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{t.patientName}</span>
                      <Badge tone={t.status === 'Critical' ? 'red' : t.status === 'Abnormal' ? 'gold' : 'green'}>{t.status}</Badge>
                    </div>
                    <p className="text-sm text-slate-500">{t.testType} · {t.mrn} · {t.ward}</p>
                    <p className="text-xs text-slate-400">{t.device} · {t.performedBy} · {t.performedAt}</p>
                    <p className="text-xs text-slate-500">Reference: {t.referenceRange}</p>
                  </div>
                  <div className="text-right">
                    {t.verified ? <Badge tone="green">Verified</Badge> : <Badge tone="gold">Pending Verification</Badge>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {DEVICES.map(d => (
            <Card key={d.id} className="p-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${d.status === 'Active' ? 'bg-green-100' : 'bg-orange-100'}`}>🔬</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{d.name}</span>
                    <span className="text-xs text-slate-400">{d.model}</span>
                    <Badge tone={d.status === 'Active' ? 'green' : 'gold'}>{d.status}</Badge>
                    <Badge tone={d.qcStatus === 'Passed' ? 'green' : d.qcStatus === 'Failed' ? 'red' : 'gold'}>QC: {d.qcStatus}</Badge>
                  </div>
                  <p className="text-sm text-slate-500">Location: {d.location} · Total tests: {d.totalTests}</p>
                  <div className="flex gap-4 text-xs text-slate-500 mt-1">
                    <span>Calibrated: {d.lastCalibrated}</span>
                    <span>Next: {d.nextCalibration}</span>
                    <span>Battery: {d.batteryLevel}%</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => {}} className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">QC Test</button>
                  <button onClick={() => {}} className="px-3 py-1 bg-slate-100 rounded text-xs hover:bg-slate-200">Calibrate</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
