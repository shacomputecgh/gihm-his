import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface PainPatient {
  id: string; name: string; age: number; gender: string; mrn: string;
  condition: string; painScore: number; painType: string; painSite: string;
  medications: string[]; procedures: string[];
  status: 'New' | 'Follow-up' | 'Post-Procedure' | 'Stable' | 'Weaning' | 'On Biologics';
  doctor: string; followUp: string; notes: string;
}

const PATIENTS: PainPatient[] = [
  { id: 'PAIN-001', name: 'Kwame Mensah', age: 67, gender: 'Male', mrn: 'MRN-2026-1040',
    condition: 'Chronic Low Back Pain (Post-surgical)', painScore: 7, painType: 'Nociceptive + Neuropathic',
    painSite: 'L4-L5 lumbar spine, radiating left leg',
    medications: ['Pregabalin 150mg BD', 'Duloxetine 60mg OD', 'Paracetamol 1g QDS', 'Tramadol 50mg TDS PRN'],
    procedures: ['L4-L5 epidural steroid injection (planned)', 'Facet joint block L4-L5'],
    status: 'Follow-up', doctor: 'Dr. Efua Darko', followUp: '2026-09-07 (2 weeks)',
    notes: 'Pain score 7/10. Failed conservative management. Nerve block scheduled. Opioid-sparing approach. Pain diary maintained.'
  },
  { id: 'PAIN-002', name: 'Akua Boateng', age: 55, gender: 'Female', mrn: 'MRN-2026-1042',
    condition: 'Diabetic Neuropathic Pain', painScore: 8, painType: 'Neuropathic',
    painSite: 'Bilateral feet — burning, tingling',
    medications: ['Pregabalin 300mg BD', 'Amitriptyline 25mg ON', 'Capsaicin cream 0.075%'],
    procedures: ['Peripheral nerve stimulation trial'],
    status: 'Stable', doctor: 'Dr. Efua Darko', followUp: '2026-11-24 (3 months)',
    notes: 'Severe neuropathic pain despite maximum pregabalin. Nerve stimulation considered. Glycaemic control essential.'
  },
  { id: 'PAIN-003', name: 'Kofi Asare', age: 45, gender: 'Male', mrn: 'MRN-2026-1044',
    condition: 'Trigeminal Neuralgia', painScore: 9, painType: 'Neuropathic',
    painSite: 'Right V2/V3 distribution — electric shock pain',
    medications: ['Carbamazepine 200mg BD', 'Oxcarbazepine 300mg BD', 'Pregabalin 75mg BD'],
    procedures: ['Right V3 radiofrequency thermocoagulation (planned)'],
    status: 'Follow-up', doctor: 'Dr. Efua Darko', followUp: '2026-09-07 (2 weeks)',
    notes: 'Classic TN — pain 9/10. MRI brain shows neurovascular conflict. Gamma knife deferred — microvascular decompression discussion.'
  },
  { id: 'PAIN-004', name: 'Efua Nyarko', age: 72, gender: 'Female', mrn: 'MRN-2026-1046',
    condition: 'Cancer Pain (Metastatic Breast Cancer)', painScore: 8, painType: 'Mixed',
    painSite: 'Multiple bone metastases — pelvis, spine',
    medications: ['Morphine MR 30mg BD', 'Morphine IR 10mg Q4H PRN', 'Dexamethasone 4mg OD', 'Zoledronic acid'],
    procedures: ['Bilateral sacroplasty', 'Spinal cord stimulator assessment'],
    status: 'On Biologics', doctor: 'Dr. Efua Darko', followUp: '2026-09-14 (2 weeks)',
    notes: 'WHO Step 3 opioids. Pain well-controlled on morphine. Neuropatch assessment for breakthrough. Palliative care liaison.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'New': 'bg-blue-100 text-blue-800', 'Follow-up': 'bg-yellow-100 text-yellow-800',
  'Post-Procedure': 'bg-green-100 text-green-800', 'Stable': 'bg-teal-100 text-teal-800',
  'Weaning': 'bg-purple-100 text-purple-800',
};

function getPainColor(score: number) {
  if (score >= 7) return 'text-red-600 bg-red-50';
  if (score >= 4) return 'text-yellow-600 bg-yellow-50';
  return 'text-green-600 bg-green-50';
}

export default function PainManagement() {
  const [selected, setSelected] = useState<PainPatient | null>(PATIENTS[0] ?? null);
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
          title="Add New Pain Record"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","required":true},{"name":"painSite","label":"Pain Site","type":"text","required":true},{"name":"painScale","label":"Pain Scale (0-10)","type":"number"},{"name":"painType","label":"Pain Type","type":"select","options":["Acute","Chronic","Neuropathic","Visceral","Musculoskeletal","Other"]},{"name":"treatment","label":"Treatment","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Pain Management Clinic</h1><p className="text-gray-500">Chronic pain assessment, nerve blocks, multimodal therapy, opioid monitoring</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Patients', value: PATIENTS.length, color: 'text-blue-600' },
          { label: 'High Pain (≥7)', value: PATIENTS.filter(p=>p.painScore>=7).length, color: 'text-red-600' },
          { label: 'Procedures Planned', value: PATIENTS.reduce((s,p)=>s+p.procedures.length,0), color: 'text-purple-600' },
          { label: 'Avg Pain Score', value: (PATIENTS.reduce((s,p)=>s+p.painScore,0)/PATIENTS.length).toFixed(1), color: 'text-orange-600' },
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
                  <div className="text-xs text-gray-400 mt-1">{p.painType} — {p.painSite}</div>
                </div>
                <div className={`text-right rounded-lg px-3 py-2 ${getPainColor(p.painScore)}`}><div className="text-2xl font-black">{p.painScore}/10</div><div className="text-[10px]">Pain Score</div></div>
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-1">
          {selected && (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div><h2 className="font-bold text-lg">{selected.name}</h2><p className="text-sm text-gray-500">{selected.age}y {selected.gender} — {selected.mrn}</p><p className="text-sm text-blue-600">{selected.condition}</p></div>
              <div className={`rounded-lg p-4 text-center ${getPainColor(selected.painScore)}`}><div className="text-5xl font-black">{selected.painScore}/10</div><div className="text-sm mt-1">Pain Score</div></div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1"><div><span className="text-gray-500">Type:</span> {selected.painType}</div><div><span className="text-gray-500">Site:</span> {selected.painSite}</div><div><span className="text-gray-500">Doctor:</span> {selected.doctor}</div><div><span className="text-gray-500">Follow-up:</span> {selected.followUp}</div></div>
              <div><div className="text-sm font-medium text-gray-600 mb-1">Medications</div>{selected.medications.map((m,i)=><div key={i} className="text-xs bg-green-50 rounded px-2 py-1 mb-1">💊 {m}</div>)}</div>
              <div><div className="text-sm font-medium text-gray-600 mb-1">Procedures</div>{selected.procedures.map((pr,i)=><div key={i} className="text-xs bg-purple-50 rounded px-2 py-1 mb-1">🔪 {pr}</div>)}</div>
              <div className="text-xs text-gray-400 italic">{selected.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
