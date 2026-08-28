import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface RheumPatient {
  id: string; name: string; age: number; gender: string; mrn: string; visitDate: string;
  chiefComplaint: string; condition: string;
  das28?: number; esr: number; crp: number;
  jointsAffected: string[]; antibodies: string[];
  status: 'New' | 'Follow-up' | 'On Biologics' | 'Stable' | 'Flare';
  medications: string[]; doctor: string; followUp: string; notes: string;
}

const PATIENTS: RheumPatient[] = [
  { id: 'RH-001', name: 'Kwame Mensah', age: 52, gender: 'Male', mrn: 'MRN-2026-1030', visitDate: '2026-08-24',
    chiefComplaint: 'Joint pain — hands and wrists, 1 year, morning stiffness 2 hours', condition: 'Rheumatoid Arthritis (Seropositive)',
    das28: 5.8, esr: 65, crp: 42, jointsAffected: ['MCP bilateral', 'PIP bilateral', 'Wrists', 'MTP bilateral'],
    antibodies: ['RF positive (85 IU/mL)', 'Anti-CCP positive (120 U/mL)'],
    status: 'On Biologics', medications: ['Adalimumab 40mg SC fortnight', 'Methotrexate 15mg weekly', 'Folic acid 5mg', 'Prednisolone taper'],
    doctor: 'Dr. Akua Mensah', followUp: '2026-11-24 (3 months)', notes: 'DAS28 5.8 — high disease activity. Started biologics. Monitor for infection. X-ray erosions bilateral MCP.'
  },
  { id: 'RH-002', name: 'Akua Boateng', age: 38, gender: 'Female', mrn: 'MRN-2026-1032', visitDate: '2026-08-24',
    chiefComplaint: 'Joint pain — small joints, butterfly rash on face', condition: 'Systemic Lupus Erythematosus (SLE)',
    esr: 82, crp: 28, jointsAffected: ['MCP bilateral', 'PIP bilateral', 'Knees'],
    antibodies: ['ANA positive (1:640)', 'Anti-dsDNA positive', 'Low C3/C4'],
    status: 'Follow-up', medications: ['Hydroxychloroquine 200mg BD', 'Mycophenolate 1g BD', 'Prednisolone 7.5mg OD', 'Calcium/Vitamin D'],
    doctor: 'Dr. Akua Mensah', followUp: '2026-11-24 (3 months)', notes: 'SLE with renal involvement (Class III LN). Proteinuria improving. Anti-dsDNA rising — monitor for flare.'
  },
  { id: 'RH-003', name: 'Kofi Asare', age: 65, gender: 'Male', mrn: 'MRN-2026-1034', visitDate: '2026-08-24',
    chiefComplaint: 'Sudden severe big toe pain — 12 hours ago', condition: 'Gout (Acute Attack)',
    esr: 45, crp: 68, jointsAffected: ['1st MTP right'],
    antibodies: ['Uric acid 9.2 mg/dL'],
    status: 'Flare', medications: ['Colchicine 0.5mg TDS x 3 days', 'Naproxen 500mg BD', 'Prednisolone 30mg taper'],
    doctor: 'Dr. Akua Mensah', followUp: '2026-08-31 (1 week)', notes: 'Acute gout attack. Starting urate-lowering therapy after resolution. Target uric acid <6 mg/dL.'
  },
  { id: 'RH-004', name: 'Efua Nyarko', age: 45, gender: 'Female', mrn: 'MRN-2026-1036', visitDate: '2026-08-24',
    chiefComplaint: 'Back pain — progressive, worse at night, inflammatory pattern', condition: 'Ankylosing Spondylitis',
    esr: 38, crp: 22, jointsAffected: ['Sacroiliac joints', 'Lumbar spine', 'Thoracic spine'],
    antibodies: ['HLA-B27 positive'],
    status: 'On Biologics', medications: ['Adalimumab 40mg SC fortnight', 'Naproxen 500mg BD PRN', 'Sulphasalazine 1g BD'],
    doctor: 'Dr. Akua Mensah', followUp: '2026-11-24 (3 months)', notes: 'HLA-B27+ AS with active sacroiliitis. On anti-TNF. Improved BASDAI score from 8→3.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'New': 'bg-blue-100 text-blue-800', 'Follow-up': 'bg-yellow-100 text-yellow-800',
  'On Biologics': 'bg-purple-100 text-purple-800', 'Stable': 'bg-green-100 text-green-800',
  'Flare': 'bg-red-100 text-red-800',
};

export default function RheumatologyClinic() {
  const [selected, setSelected] = useState<RheumPatient | null>(PATIENTS[0] ?? null);
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
          title="Add New Rheumatology Record"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","required":true},{"name":"condition","label":"Condition","type":"select","options":["Rheumatoid Arthritis","Lupus","Gout","Osteoarthritis","Psoriatic Arthritis","Sjögrens","Other"]},{"name":"esr","label":"ESR (mm/hr)","type":"number"},{"name":"crp","label":"CRP (mg/L)","type":"number"},{"name":"notes","label":"Clinical Notes","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div>
        <h1 className="text-2xl font-bold">Rheumatology Clinic</h1>
        <p className="text-gray-500">Autoimmune joint diseases, DAS28 scoring, biologics monitoring</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Patients Today', value: PATIENTS.length, color: 'text-blue-600' },
          { label: 'On Biologics', value: PATIENTS.filter(p => p.status === 'On Biologics').length, color: 'text-purple-600' },
          { label: 'Active Flare', value: PATIENTS.filter(p => p.status === 'Flare').length, color: 'text-red-600' },
          { label: 'Avg ESR', value: Math.round(PATIENTS.reduce((s,p)=>s+p.esr,0)/PATIENTS.length).toString(), color: 'text-orange-600' },
        ].map((s,i) => <div key={i} className="bg-white rounded-lg border p-3 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {PATIENTS.map(p => (
            <div key={p.id} onClick={() => setSelected(p)} className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${selected?.id===p.id?'border-blue-500 shadow-md':''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2"><span className="font-bold">{p.name}</span><Badge className={`text-[10px] ${STATUS_STYLES[p.status]}`}>{p.status}</Badge></div>
                  <div className="text-sm text-gray-500">{p.condition}</div>
                  <div className="text-xs text-gray-400 mt-1">{p.jointsAffected.join(', ')}</div>
                </div>
                <div className="text-right">
                  {p.das28 && <div className={`text-lg font-bold ${p.das28>5.1?'text-red-600':p.das28>3.2?'text-yellow-600':'text-green-600'}`}>DAS28 {p.das28}</div>}
                  <div className="text-xs text-gray-400">ESR {p.esr} | CRP {p.crp}</div>
                </div>
              </div>
              <div className="flex gap-1 mt-2 flex-wrap">{p.antibodies.map(a=><Badge key={a} className="text-[10px] bg-orange-100 text-orange-700">{a}</Badge>)}</div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-1">
          {selected && (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div><h2 className="font-bold text-lg">{selected.name}</h2><p className="text-sm text-gray-500">{selected.age}y {selected.gender} — {selected.mrn}</p><p className="text-sm text-blue-600">{selected.condition}</p></div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1"><div><span className="text-gray-500">Complaint:</span> {selected.chiefComplaint}</div><div><span className="text-gray-500">Doctor:</span> {selected.doctor}</div><div><span className="text-gray-500">Follow-up:</span> {selected.followUp}</div></div>
              {selected.das28 && <div className="bg-red-50 rounded-lg p-3 text-center"><div className="text-3xl font-black text-red-600">{selected.das28}</div><div className="text-xs text-red-600">DAS28 Score (target {'<'}3.2)</div></div>}
              <div><div className="text-sm font-medium text-gray-600 mb-1">Joints Affected</div><div className="flex gap-1 flex-wrap">{selected.jointsAffected.map(j=><Badge key={j} className="text-xs bg-blue-100 text-blue-700">{j}</Badge>)}</div></div>
              <div><div className="text-sm font-medium text-gray-600 mb-1">Antibodies</div>{selected.antibodies.map((a,i)=><div key={i} className="text-xs bg-orange-50 rounded px-2 py-1 mb-1">🔬 {a}</div>)}</div>
              <div><div className="text-sm font-medium text-gray-600 mb-1">Medications</div>{selected.medications.map((m,i)=><div key={i} className="text-xs bg-green-50 rounded px-2 py-1 mb-1">💊 {m}</div>)}</div>
              <div className="text-xs text-gray-400 italic">{selected.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
