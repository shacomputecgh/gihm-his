import { useState } from 'react';
import { Badge } from '../../components/ui';

interface NICUPatient {
  id: string; babyName: string; motherName: string; gestationalAge: string;
  birthWeight: string; currentWeight: string; admissionDate: string;
  diagnosis: string; status: 'Critical' | 'Stable' | 'Improving' | 'Ready for Discharge';
  temperature: number; heartRate: number; spo2: number;
  feeding: 'Breast milk' | 'Formula' | 'Mixed' | 'NPO';
  phototherapy: boolean; ventilator: boolean;
}

const NICU_PATIENTS: NICUPatient[] = [
  { id: 'NICU-001', babyName: 'Baby Asante', motherName: 'Akua Mensah', gestationalAge: '28 weeks', birthWeight: '1.1 kg', currentWeight: '1.4 kg', admissionDate: '2026-08-10', diagnosis: 'Prematurity, RDS', status: 'Improving', temperature: 36.8, heartRate: 142, spo2: 94, feeding: 'Breast milk', phototherapy: true, ventilator: false },
  { id: 'NICU-002', babyName: 'Baby Osei', motherName: 'Efua Nyarko', gestationalAge: '32 weeks', birthWeight: '1.6 kg', currentWeight: '1.8 kg', admissionDate: '2026-08-15', diagnosis: 'Low birth weight, Jaundice', status: 'Stable', temperature: 36.7, heartRate: 138, spo2: 96, feeding: 'Mixed', phototherapy: true, ventilator: false },
  { id: 'NICU-003', babyName: 'Baby Darko', motherName: 'Nana Agyeman', gestationalAge: '26 weeks', birthWeight: '0.9 kg', currentWeight: '1.0 kg', admissionDate: '2026-08-18', diagnosis: 'Extreme prematurity, NEC risk', status: 'Critical', temperature: 36.5, heartRate: 155, spo2: 88, feeding: 'NPO', phototherapy: false, ventilator: true },
  { id: 'NICU-004', babyName: 'Baby Mensah', motherName: 'Ama Darko', gestationalAge: '36 weeks', birthWeight: '2.3 kg', currentWeight: '2.5 kg', admissionDate: '2026-08-20', diagnosis: 'Transient tachypnoea', status: 'Ready for Discharge', temperature: 36.9, heartRate: 130, spo2: 98, feeding: 'Breast milk', phototherapy: false, ventilator: false },
];

const STATUS_COLORS: Record<string, string> = {
  Critical: 'bg-red-100 text-red-800', Stable: 'bg-blue-100 text-blue-800',
  Improving: 'bg-green-100 text-green-800', 'Ready for Discharge': 'bg-emerald-100 text-emerald-800',
};

export default function NICUTracking() {
  const [patients] = useState<NICUPatient[]>(NICU_PATIENTS);
  const [selected, setSelected] = useState<NICUPatient | null>(NICU_PATIENTS[0] ?? null);

  const stats = {
    critical: patients.filter((p) => p.status === 'Critical').length,
    stable: patients.filter((p) => p.status === 'Stable').length,
    improving: patients.filter((p) => p.status === 'Improving').length,
    ready: patients.filter((p) => p.status === 'Ready for Discharge').length,
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">NICU Tracking</h1><p className="text-gray-500">Neonatal intensive care unit monitoring, feeding, and discharge tracking</p></div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-slate-700">{patients.length}</div><div className="text-xs text-gray-500">Total Patients</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-red-600">{stats.critical}</div><div className="text-xs text-gray-500">Critical</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-blue-600">{stats.stable}</div><div className="text-xs text-gray-500">Stable</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-green-600">{stats.improving}</div><div className="text-xs text-gray-500">Improving</div></div>
        <div className="bg-white rounded-lg border p-3 text-center"><div className="text-xl font-bold text-emerald-600">{stats.ready}</div><div className="text-xs text-gray-500">Ready to Discharge</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {patients.map((p) => (
            <div key={p.id} onClick={() => setSelected(p)} className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${selected?.id === p.id ? 'ring-2 ring-blue-500' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm">{p.babyName}</span>
                <Badge className={STATUS_COLORS[p.status]}>{p.status}</Badge>
              </div>
              <div className="text-xs text-gray-500">
                <div>Mother: {p.motherName}</div>
                <div>GA: {p.gestationalAge} · Weight: {p.currentWeight}</div>
                <div className="flex gap-2 mt-1">
                  {p.ventilator && <span className="text-red-500">🫁 Ventilator</span>}
                  {p.phototherapy && <span className="text-yellow-500">☀️ Phototherapy</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <div className="lg:col-span-2 bg-white rounded-lg border p-5 space-y-4 h-fit sticky top-4">
            <div className="flex items-center justify-between">
              <div><h3 className="text-lg font-bold">{selected.babyName}</h3><p className="text-sm text-gray-500">Mother: {selected.motherName} · ID: {selected.id}</p></div>
              <Badge className={STATUS_COLORS[selected.status]}>{selected.status}</Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-slate-700">{selected.temperature}°C</div><div className="text-[10px] text-slate-400">Temperature</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-slate-700">{selected.heartRate}</div><div className="text-[10px] text-slate-400">Heart Rate</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <div className={`text-lg font-bold ${selected.spo2 < 90 ? 'text-red-600' : selected.spo2 < 95 ? 'text-yellow-600' : 'text-green-600'}`}>{selected.spo2}%</div><div className="text-[10px] text-slate-400">SpO2</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-slate-700">{selected.currentWeight}</div><div className="text-[10px] text-slate-400">Current Weight</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <div className="text-xs text-blue-600 font-semibold mb-1">Admission</div>
                <div>GA: {selected.gestationalAge}</div>
                <div>Birth weight: {selected.birthWeight}</div>
                <div>Admitted: {selected.admissionDate}</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <div className="text-xs text-green-600 font-semibold mb-1">Current Status</div>
                <div>Diagnosis: {selected.diagnosis}</div>
                <div>Feeding: {selected.feeding}</div>
                <div>Ventilator: {selected.ventilator ? 'Yes' : 'No'}</div>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => {}} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Update Vitals</button>
              <button onClick={() => {}} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Record Feeding</button>
              <button onClick={() => {}} className="border px-4 py-2 rounded-lg text-sm font-medium">Discharge Summary</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
