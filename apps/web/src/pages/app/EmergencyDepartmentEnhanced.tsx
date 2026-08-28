import { useState } from 'react';
import { Badge, Card } from '../../components/ui';

interface EDPatient { id: string; name: string; age: number; sex: string; triageLevel: 1 | 2 | 3 | 4 | 5; chiefComplaint: string; arrivalTime: string; waitTime: number; status: 'Waiting Triage' | 'In Triage' | 'Treatment' | 'Observation' | 'Admitted' | 'Discharged' | 'Transferred'; assignedBed?: string; doctor?: string; vitals?: { bp: string; hr: number; temp: number; spO2: number; pain: number; gcs?: number; }; }

const TRIAGE: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'Resuscitation', color: 'text-white', bg: 'bg-red-600' },
  2: { label: 'Emergency', color: 'text-white', bg: 'bg-red-400' },
  3: { label: 'Urgent', color: 'text-white', bg: 'bg-orange-500' },
  4: { label: 'Semi-Urgent', color: 'text-white', bg: 'bg-yellow-500' },
  5: { label: 'Non-Urgent', color: 'text-white', bg: 'bg-green-500' },
};

const PATIENTS: EDPatient[] = [
  { id: 'ED-001', name: 'Kwame Asante', age: 45, sex: 'M', triageLevel: 2, chiefComplaint: 'Severe chest pain, radiating to left arm, sweating', arrivalTime: '08:15', waitTime: 45, status: 'Treatment', assignedBed: 'ED-03', doctor: 'Dr. Yaw Boateng', vitals: { bp: '165/95', hr: 105, temp: 36.8, spO2: 94, pain: 8 } },
  { id: 'ED-002', name: 'Akua Mensah', age: 28, sex: 'F', triageLevel: 4, chiefComplaint: 'Lower back pain for 2 weeks', arrivalTime: '09:00', waitTime: 30, status: 'Waiting Triage', vitals: { bp: '120/78', hr: 72, temp: 36.5, spO2: 99, pain: 4 } },
  { id: 'ED-003', name: 'Nana Osei', age: 62, sex: 'M', triageLevel: 1, chiefComplaint: 'Unconscious — found by family. No pulse on arrival.', arrivalTime: '09:10', waitTime: 2, status: 'Treatment', assignedBed: 'ED-01 (Resus)', doctor: 'Dr. Ama Darko', vitals: { bp: '85/50', hr: 130, temp: 35.8, spO2: 88, pain: 0, gcs: 6 } },
  { id: 'ED-004', name: 'Efua Nyarko', age: 35, sex: 'F', triageLevel: 3, chiefComplaint: 'Persistent cough and fever for 5 days', arrivalTime: '08:30', waitTime: 60, status: 'Observation', vitals: { bp: '128/82', hr: 95, temp: 38.7, spO2: 95, pain: 3 } },
  { id: 'ED-005', name: 'Kofi Amoako Jr.', age: 8, sex: 'M', triageLevel: 3, chiefComplaint: 'High fever and headache, stiff neck', arrivalTime: '09:00', waitTime: 35, status: 'Treatment', assignedBed: 'ED-05', doctor: 'Dr. Nana Agyeman', vitals: { bp: '95/60', hr: 110, temp: 39.5, spO2: 96, pain: 6 } },
  { id: 'ED-006', name: 'Ama Boateng', age: 55, sex: 'F', triageLevel: 5, chiefComplaint: 'Routine prescription refill', arrivalTime: '08:00', waitTime: 90, status: 'Discharged', vitals: { bp: '130/80', hr: 75, temp: 36.6, spO2: 98, pain: 0 } },
  { id: 'ED-007', name: 'Yaw Frimpong', age: 40, sex: 'M', triageLevel: 2, chiefComplaint: 'Severe allergic reaction — facial swelling, difficulty breathing', arrivalTime: '09:05', waitTime: 15, status: 'Treatment', assignedBed: 'ED-02', doctor: 'Dr. Yaw Boateng', vitals: { bp: '110/70', hr: 115, temp: 37.0, spO2: 96, pain: 5 } },
  { id: 'ED-008', name: 'Kwaku Mensah', age: 70, sex: 'M', triageLevel: 3, chiefComplaint: 'Difficulty breathing — chronic COPD exacerbation', arrivalTime: '09:00', waitTime: 40, status: 'Treatment', assignedBed: 'ED-04', doctor: 'Dr. Kofi Asante', vitals: { bp: '135/85', hr: 88, temp: 37.2, spO2: 91, pain: 2 } },
];

const _STATUS_COLORS: Record<string, string> = { 'Waiting Triage': 'bg-yellow-100 text-yellow-800', 'In Triage': 'bg-blue-100 text-blue-800', Treatment: 'bg-green-100 text-green-800', Observation: 'bg-purple-100 text-purple-800', Admitted: 'bg-indigo-100 text-indigo-800', Discharged: 'bg-gray-100 text-gray-600', Transferred: 'bg-orange-100 text-orange-800' };

export default function EmergencyDepartmentEnhanced() {
  const [selected, setSelected] = useState<EDPatient | null>(null);
  const active = PATIENTS.filter(p => p.status !== 'Discharged');
  const criticalCount = PATIENTS.filter(p => p.triageLevel <= 2 && p.status !== 'Discharged').length;
  const avgWait = active.length ? Math.round(active.reduce((s, p) => s + p.waitTime, 0) / active.length) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Emergency Department</h1>
          <p className="text-slate-500 text-sm">Triage, tracking, and emergency resource management</p>
        </div>
      </div>

      <div className="flex gap-2">
        {Object.entries(TRIAGE).map(([level, t]) => (
          <div key={level} className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${t.bg} ${t.color}`}>
            <span>T{level}</span><span className="opacity-80">{t.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4"><p className="text-xs text-slate-500">In Department</p><p className="text-2xl font-bold">{active.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Critical (T1-T2)</p><p className="text-2xl font-bold text-red-600">{criticalCount}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Avg Wait</p><p className={`text-2xl font-bold ${avgWait > 60 ? 'text-red-600' : avgWait > 30 ? 'text-orange-600' : 'text-green-600'}`}>{avgWait}m</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Beds Used</p><p className="text-2xl font-bold text-blue-600">{PATIENTS.filter(p => p.assignedBed).length}/8</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Discharged Today</p><p className="text-2xl font-bold text-green-600">{PATIENTS.filter(p => p.status === 'Discharged').length}</p></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bed Map */}
        <Card className="p-4 lg:col-span-2">
          <h2 className="font-semibold mb-3">ED Bed Map</h2>
          <div className="grid grid-cols-4 gap-2">
            {['ED-01 (Resus)', 'ED-02', 'ED-03', 'ED-04', 'ED-05', 'ED-06', 'ED-07', 'ED-08'].map(bed => {
              const patient = PATIENTS.find(p => p.assignedBed === bed);
              return (
                <div key={bed} className={`p-2 rounded-lg text-center text-xs ${patient ? (patient.triageLevel <= 2 ? 'bg-red-100 border border-red-300' : 'bg-blue-100 border border-blue-300') : 'bg-green-50 border border-green-200'}`}>
                  <p className="font-medium">{bed}</p>
                  {patient ? <><p className="text-slate-600 truncate">{patient.name}</p><p className="text-slate-400">T{patient.triageLevel}</p></> : <p className="text-green-600">Available</p>}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Patient List */}
        <Card className="p-4">
          <h2 className="font-semibold mb-3">Patient List</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {PATIENTS.sort((a, b) => a.triageLevel - b.triageLevel || b.waitTime - a.waitTime).map(p => {
              const t = TRIAGE[p.triageLevel];
              return (
                <div key={p.id} className={`p-2 rounded cursor-pointer hover:bg-slate-50 ${selected?.id === p.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`} onClick={() => setSelected(selected?.id === p.id ? null : p)}>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${t.bg} ${t.color}`}>T{p.triageLevel}</span>
                    <span className="font-medium text-sm">{p.name}</span>
                    <span className="text-xs text-slate-400">{p.age}{p.sex}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 truncate">{p.chiefComplaint}</p>
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <Badge tone={p.status === 'Treatment' ? 'green' : p.status === 'Discharged' ? 'blue' : 'gold'}>{p.status}</Badge>
                    <span>{p.waitTime}m</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Selected Patient Detail */}
      {selected && (
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${TRIAGE[selected.triageLevel].bg}`}>
              T{selected.triageLevel}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{selected.name}</h2>
                <span className="text-slate-500">{selected.age}y {selected.sex}</span>
                <Badge tone={selected.status === 'Treatment' ? 'green' : 'gold'}>{selected.status}</Badge>
              </div>
              <p className="text-sm text-slate-600 mt-1">{selected.chiefComplaint}</p>
              {selected.vitals && (
                <div className="grid grid-cols-6 gap-2 mt-3">
                  <div className="text-center p-2 bg-slate-50 rounded"><p className="text-xs text-slate-400">BP</p><p className={`font-bold ${parseInt(selected.vitals.bp.split('/')[0] ?? '0') > 140 ? 'text-red-600' : ''}`}>{selected.vitals.bp}</p></div>
                  <div className="text-center p-2 bg-slate-50 rounded"><p className="text-xs text-slate-400">HR</p><p className={`font-bold ${selected.vitals.hr > 100 ? 'text-red-600' : ''}`}>{selected.vitals.hr}</p></div>
                  <div className="text-center p-2 bg-slate-50 rounded"><p className="text-xs text-slate-400">Temp</p><p className={`font-bold ${selected.vitals.temp > 37.5 ? 'text-orange-600' : ''}`}>{selected.vitals.temp}°</p></div>
                  <div className="text-center p-2 bg-slate-50 rounded"><p className="text-xs text-slate-400">SpO₂</p><p className={`font-bold ${selected.vitals.spO2 < 94 ? 'text-red-600' : ''}`}>{selected.vitals.spO2}%</p></div>
                  <div className="text-center p-2 bg-slate-50 rounded"><p className="text-xs text-slate-400">Pain</p><p className={`font-bold ${selected.vitals.pain >= 7 ? 'text-red-600' : ''}`}>{selected.vitals.pain}/10</p></div>
                  {selected.vitals.gcs && <div className="text-center p-2 bg-slate-50 rounded"><p className="text-xs text-slate-400">GCS</p><p className={`font-bold ${selected.vitals.gcs < 9 ? 'text-red-600' : ''}`}>{selected.vitals.gcs}/15</p></div>}
                </div>
              )}
              <div className="flex gap-2 mt-3">
                <button onClick={() => {}} className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Order Lab</button>
                <button onClick={() => {}} className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">Admit</button>
                <button onClick={() => {}} className="px-3 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700">Transfer</button>
                <button onClick={() => {}} className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700">Discharge</button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
