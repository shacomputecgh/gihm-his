import { useState } from 'react';
import { Badge, Card } from '../../components/ui';

interface OxygenPatient { id: string; patientName: string; mrn: string; ward: string; bed: string; device: 'Nasal Cannula' | 'Face Mask' | 'Non-Rebreather' | 'HFNC' | 'Ventilator' | 'CPAP'; flowRate: string; targetSpO2: number; currentSpO2: number; fio2: number; onO2Since: string; reassessmentDue: string; status: 'Stable' | 'Improving' | 'Weaning' | 'Critical'; }
interface OxygenCylinder { id: string; location: string; type: 'CD' | 'CE' | 'D' | 'E'; capacity: number; currentLevel: number; lastChecked: string; status: 'Full' | 'In Use' | 'Low' | 'Empty'; }

const PATIENTS: OxygenPatient[] = [
  { id: 'OP-001', patientName: 'Nana Osei', mrn: 'MRN-2024-0567', ward: 'ICU', bed: 'ICU-08', device: 'HFNC', flowRate: '40L/min', targetSpO2: 94, currentSpO2: 96, fio2: 60, onO2Since: '2026-08-24 14:00', reassessmentDue: '2026-08-26 18:00', status: 'Improving' },
  { id: 'OP-002', patientName: 'Efua Nyarko', mrn: 'MRN-2024-0998', ward: 'Medical Ward B', bed: 'B-12', device: 'Nasal Cannula', flowRate: '2L/min', targetSpO2: 92, currentSpO2: 94, fio2: 28, onO2Since: '2026-08-25 20:00', reassessmentDue: '2026-08-26 20:00', status: 'Stable' },
  { id: 'OP-003', patientName: 'Kofi Amoako', mrn: 'MRN-2024-0776', ward: 'Paediatric', bed: 'P-06', device: 'Face Mask', flowRate: '6L/min', targetSpO2: 94, currentSpO2: 91, fio2: 40, onO2Since: '2026-08-26 08:00', reassessmentDue: '2026-08-26 14:00', status: 'Critical' },
  { id: 'OP-004', patientName: 'Ama Boateng', mrn: 'MRN-2024-0112', ward: 'Oncology', bed: 'ONC-05', device: 'Nasal Cannula', flowRate: '1L/min', targetSpO2: 92, currentSpO2: 95, fio2: 24, onO2Since: '2026-08-25 06:00', reassessmentDue: '2026-08-27 06:00', status: 'Weaning' },
  { id: 'OP-005', patientName: 'Kwaku Mensah', mrn: 'MRN-2024-0334', ward: 'ICU', bed: 'ICU-11', device: 'Ventilator', flowRate: 'Assist-Control', targetSpO2: 95, currentSpO2: 93, fio2: 50, onO2Since: '2026-08-23 22:00', reassessmentDue: '2026-08-26 22:00', status: 'Critical' },
];

const CYLINDERS: OxygenCylinder[] = [
  { id: 'CD-01', location: 'ICU Store', type: 'CD', capacity: 425, currentLevel: 85, lastChecked: '2026-08-26 08:00', status: 'Full' },
  { id: 'CD-02', location: 'ICU Store', type: 'CD', capacity: 425, currentLevel: 60, lastChecked: '2026-08-26 08:00', status: 'In Use' },
  { id: 'CE-01', location: 'Emergency', type: 'CE', capacity: 680, currentLevel: 30, lastChecked: '2026-08-26 06:00', status: 'Low' },
  { id: 'E-01', location: 'Ward Store', type: 'E', capacity: 680, currentLevel: 95, lastChecked: '2026-08-26 08:00', status: 'Full' },
  { id: 'E-02', location: 'Maternity', type: 'E', capacity: 680, currentLevel: 15, lastChecked: '2026-08-26 07:00', status: 'Low' },
  { id: 'D-01', location: 'Theatre', type: 'D', capacity: 340, currentLevel: 45, lastChecked: '2026-08-26 08:00', status: 'In Use' },
];

const DEVICE_COLORS: Record<string, string> = { 'Nasal Cannula': 'bg-blue-100 text-blue-800', 'Face Mask': 'bg-purple-100 text-purple-800', 'Non-Rebreather': 'bg-red-100 text-red-800', HFNC: 'bg-orange-100 text-orange-800', Ventilator: 'bg-red-100 text-red-800', CPAP: 'bg-teal-100 text-teal-800' };

export default function OxygenTherapyMonitorEnhanced() {
  const [tab, setTab] = useState<'patients' | 'cylinders'>('patients');
  const criticalPatients = PATIENTS.filter(p => p.status === 'Critical' || p.currentSpO2 < p.targetSpO2);
  const lowCylinders = CYLINDERS.filter(c => c.status === 'Low' || c.currentLevel < 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Oxygen Therapy Monitor</h1>
          <p className="text-slate-500 text-sm">Real-time SpO2 tracking and cylinder management</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('patients')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'patients' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>Patients on O₂</button>
        <button onClick={() => setTab('cylinders')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'cylinders' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>Cylinder Inventory</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-xs text-slate-500">Patients on O₂</p><p className="text-2xl font-bold">{PATIENTS.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Critical</p><p className="text-2xl font-bold text-red-600">{criticalPatients.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Cylinders Low</p><p className="text-2xl font-bold text-orange-600">{lowCylinders.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">On Ventilator</p><p className="text-2xl font-bold text-purple-600">{PATIENTS.filter(p => p.device === 'Ventilator').length}</p></Card>
      </div>

      {tab === 'patients' ? (
        <div className="space-y-3">
          {PATIENTS.sort((a, b) => a.currentSpO2 - b.currentSpO2).map(p => (
            <Card key={p.id} className={`p-4 ${p.status === 'Critical' ? 'border-red-300 bg-red-50' : ''}`}>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className={`text-3xl font-bold ${p.currentSpO2 < p.targetSpO2 ? 'text-red-600' : 'text-green-600'}`}>{p.currentSpO2}%</p>
                  <p className="text-xs text-slate-500">SpO₂</p>
                  <div className="w-16 bg-slate-200 rounded-full h-2 mt-1">
                    <div className={`h-2 rounded-full ${p.currentSpO2 >= p.targetSpO2 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${p.currentSpO2}%` }} />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{p.patientName}</span>
                    <Badge tone={DEVICE_COLORS[p.device]?.includes('red') ? 'red' : 'blue'}>{p.device}</Badge>
                    <Badge tone={p.status === 'Critical' ? 'red' : p.status === 'Weaning' ? 'gold' : 'green'}>{p.status}</Badge>
                  </div>
                  <p className="text-sm text-slate-500">{p.mrn} · {p.ward} Bed {p.bed}</p>
                  <div className="flex gap-4 mt-1 text-xs text-slate-500">
                    <span>Flow: {p.flowRate}</span>
                    <span>FiO₂: {p.fio2}%</span>
                    <span>Target: ≥{p.targetSpO2}%</span>
                    <span>On O₂ since: {p.onO2Since}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => {}} className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Reassess</button>
                  <button onClick={() => {}} className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">Wean</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-4">
          <h2 className="font-semibold mb-3">Oxygen Cylinder Inventory</h2>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-slate-500">
              <th className="p-2">ID</th><th className="p-2">Type</th><th className="p-2">Location</th><th className="p-2 text-right">Level</th><th className="p-2">Status</th><th className="p-2">Last Checked</th>
            </tr></thead>
            <tbody>
              {CYLINDERS.sort((a, b) => a.currentLevel - b.currentLevel).map(c => (
                <tr key={c.id} className={`border-b hover:bg-slate-50 ${c.currentLevel < 20 ? 'bg-red-50' : ''}`}>
                  <td className="p-2 font-medium">{c.id}</td>
                  <td className="p-2">{c.type}</td>
                  <td className="p-2">{c.location}</td>
                  <td className="p-2 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <div className="w-20 bg-slate-200 rounded-full h-3">
                        <div className={`h-3 rounded-full ${c.currentLevel < 20 ? 'bg-red-500' : c.currentLevel < 50 ? 'bg-yellow-400' : 'bg-green-500'}`} style={{ width: `${c.currentLevel}%` }} />
                      </div>
                      <span className="w-10 text-right">{c.currentLevel}%</span>
                    </div>
                  </td>
                  <td className="p-2"><Badge tone={c.status === 'Low' ? 'red' : c.status === 'Full' ? 'green' : 'blue'}>{c.status}</Badge></td>
                  <td className="p-2 text-slate-500">{c.lastChecked}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
