import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface CardiacRehabPatient {
  id: string; name: string; age: number; gender: string; mrn: string;
  indication: string; phase: string; riskStratification: string;
  vo2Peak: number; targetHR: number; currentHR: number;
  exerciseCapacity: string; bpResponse: string;
  sessionsCompleted: number; totalSessions: number;
  status: 'Assessment' | 'Phase I' | 'Phase II' | 'Phase III' | 'Completed';
  doctor: string; followUp: string; notes: string;
}

const PATIENTS: CardiacRehabPatient[] = [
  { id: 'CR-001', name: 'Kwame Mensah', age: 67, gender: 'Male', mrn: 'MRN-2026-1190',
    indication: 'Post-PCI (LAD stent) — 4 weeks ago', phase: 'Phase II (Outpatient)', riskStratification: 'Moderate Risk',
    vo2Peak: 18, targetHR: 115, currentHR: 95, exerciseCapacity: 'Good — Borg 12 at peak',
    bpResponse: 'Normal — no hypotension', sessionsCompleted: 8, totalSessions: 36,
    status: 'Phase II', doctor: 'Dr. Efua Darko', followUp: '2026-08-28 (session 9)',
    notes: 'Progressing well. Cycle ergometry 20 min at 70% target HR. Treadmill walking 15 min. Weight management ongoing.'
  },
  { id: 'CR-002', name: 'Akua Boateng', age: 55, gender: 'Female', mrn: 'MRN-2026-1192',
    indication: 'CABG (Triple Bypass) — 6 weeks ago', phase: 'Phase II (Outpatient)', riskStratification: 'Moderate Risk',
    vo2Peak: 16, targetHR: 120, currentHR: 100, exerciseCapacity: 'Fair — Borg 14 at peak',
    bpResponse: 'Mild exercise-induced hypertension — monitored', sessionsCompleted: 12, totalSessions: 36,
    status: 'Phase II', doctor: 'Dr. Efua Darko', followUp: '2026-08-28 (session 13)',
    notes: 'Post-sternotomy — sternal precautions. Walking programme 30 min daily. Resistance training in 4 weeks. Psychosocial support for anxiety.'
  },
  { id: 'CR-003', name: 'Kofi Asare', age: 72, gender: 'Male', mrn: 'MRN-2026-1194',
    indication: 'Heart Failure (HFrEF) — Stable', phase: 'Phase II (Outpatient)', riskStratification: 'High Risk',
    vo2Peak: 14, targetHR: 105, currentHR: 88, exerciseCapacity: 'Limited — Borg 15 at lower intensity',
    bpResponse: 'Mild hypotension — stop if SBP <90', sessionsCompleted: 6, totalSessions: 36,
    status: 'Phase II', doctor: 'Dr. Efua Darko', followUp: '2026-08-28 (session 7)',
    notes: 'HF with reduced EF. Close monitoring during sessions. Lower intensity — 50-60% target HR. Fluid balance monitoring. Weight daily.'
  },
  { id: 'CR-004', name: 'Efua Nyarko', age: 42, gender: 'Female', mrn: 'MRN-2026-1196',
    indication: 'MI (Anterior STEMI) — 8 weeks ago', phase: 'Phase III (Maintenance)', riskStratification: 'Low Risk',
    vo2Peak: 22, targetHR: 140, currentHR: 118, exerciseCapacity: 'Excellent — Borg 11 at peak',
    bpResponse: 'Normal', sessionsCompleted: 30, totalSessions: 36,
    status: 'Phase III', doctor: 'Dr. Efua Darko', followUp: '2026-09-07 (graduation)',
    notes: 'Excellent progress. Returning to regular exercise. Gym programme established. Self-management skills developed. Phase III community programme referral.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'Assessment': 'bg-blue-100 text-blue-800', 'Phase I': 'bg-red-100 text-red-800',
  'Phase II': 'bg-yellow-100 text-yellow-800', 'Phase III': 'bg-green-100 text-green-800',
  'Completed': 'bg-gray-100 text-gray-800',
};

export default function CardiacRehabilitation() {
  const [selected, setSelected] = useState<CardiacRehabPatient | null>(PATIENTS[0] ?? null);
  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);
  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">
          {showAdd ? "\u2715 Cancel" : "+ Add New"}
        </button>
      </div>
      {showAdd && (
        <AddNewForm
          title="Add New Cardiac Rehab Session"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","required":true},{"name":"condition","label":"Condition","type":"select","options":["Post-MI","Post-CABG","Post-Valve Surgery","Heart Failure","Angina"]},{"name":"phase","label":"Phase","type":"select","options":["Phase I (Inpatient)","Phase II (Outpatient)","Phase III (Maintenance)"]},{"name":"hrPre","label":"Heart Rate Pre","type":"number"},{"name":"bpPre","label":"BP Pre","type":"text"},{"name":"notes","label":"Notes","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Cardiac Rehabilitation</h1><p className="text-gray-500">Exercise programmes, fitness testing, and cardiac risk stratification</p></div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[{ label: 'Patients', value: PATIENTS.length, color: 'text-blue-600' },
          { label: 'Phase II', value: PATIENTS.filter(p=>p.status==='Phase II').length, color: 'text-yellow-600' },
          { label: 'Phase III', value: PATIENTS.filter(p=>p.status==='Phase III').length, color: 'text-green-600' },
          { label: 'Avg VO2 Peak', value: `${Math.round(PATIENTS.reduce((s,p)=>s+p.vo2Peak,0)/PATIENTS.length)} ml/kg/min`, color: 'text-purple-600' },
          { label: 'High Risk', value: PATIENTS.filter(p=>p.riskStratification==='High Risk').length, color: 'text-red-600' },
        ].map((s,i) => <div key={i} className="bg-white rounded-lg border p-3 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {PATIENTS.map(p => (
            <div key={p.id} onClick={() => setSelected(p)} className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${selected?.id===p.id?'border-blue-500 shadow-md':''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2"><span className="font-bold">{p.name}</span><Badge className={`text-[10px] ${STATUS_STYLES[p.status]}`}>{p.status}</Badge></div>
                  <div className="text-sm text-gray-500">{p.indication}</div>
                </div>
                <div className="text-right"><div className="text-lg font-bold text-blue-600">{p.sessionsCompleted}/{p.totalSessions}</div><div className="text-[10px] text-gray-400">Sessions</div></div>
              </div>
              <div className="mt-2"><div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-blue-600 h-full rounded-full" style={{width:`${(p.sessionsCompleted/p.totalSessions)*100}%`}}/></div></div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-1">
          {selected && (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div><h2 className="font-bold text-lg">{selected.name}</h2><p className="text-sm text-gray-500">{selected.age}y {selected.gender} — {selected.mrn}</p><p className="text-sm text-blue-600">{selected.indication}</p></div>
              <div className="bg-blue-50 rounded-lg p-3 text-center"><div className="text-3xl font-black text-blue-600">{selected.sessionsCompleted}/{selected.totalSessions}</div><div className="text-xs text-blue-600">Sessions ({Math.round((selected.sessionsCompleted/selected.totalSessions)*100)}%)</div></div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1"><div><span className="text-gray-500">Phase:</span> {selected.phase}</div><div><span className="text-gray-500">Risk:</span> <span className={`font-semibold ${selected.riskStratification==='High Risk'?'text-red-600':selected.riskStratification==='Moderate Risk'?'text-yellow-600':'text-green-600'}`}>{selected.riskStratification}</span></div></div>
              <div><div className="text-sm font-medium text-gray-600 mb-1">Fitness Metrics</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-blue-50 rounded p-2 text-center"><div className="font-bold">{selected.vo2Peak}</div><div className="text-[10px]">VO2 Peak (ml/kg/min)</div></div>
                  <div className="bg-green-50 rounded p-2 text-center"><div className="font-bold">{selected.targetHR}</div><div className="text-[10px]">Target HR (bpm)</div></div>
                  <div className="bg-purple-50 rounded p-2 text-center"><div className="font-bold">{selected.currentHR}</div><div className="text-[10px]">Current HR (bpm)</div></div>
                  <div className="bg-orange-50 rounded p-2 text-center"><div className="font-bold text-xs">{selected.exerciseCapacity.split('—')[0]}</div><div className="text-[10px]">Exercise Capacity</div></div>
                </div>
              </div>
              <div><div className="text-sm font-medium text-gray-600 mb-1">BP Response</div><div className="text-sm">{selected.bpResponse}</div></div>
              <div className="text-xs text-gray-400 italic">{selected.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
