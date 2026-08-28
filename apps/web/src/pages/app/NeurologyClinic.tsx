import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface NeuroPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  mrn: string;
  visitDate: string;
  chiefComplaint: string;
  condition: string;
  gcs: number;
  nihss?: number;
  motorPower: string;
  reflexes: string;
  sensation: string;
  coordination: string;
  mrs: number;
  status: 'New' | 'Follow-up' | 'Acute Stroke' | 'Rehabilitation' | 'Under Treatment' | 'Chronic';
  medications: string[];
  doctor: string;
  followUp: string;
  notes: string;
}

const NEURO_PATIENTS: NeuroPatient[] = [
  {
    id: 'NEURO-001', name: 'Kwame Mensah', age: 67, gender: 'Male', mrn: 'MRN-2026-1000', visitDate: '2026-08-24',
    chiefComplaint: 'Sudden right-sided weakness — 4 hours',
    condition: 'Acute Ischaemic Stroke (Left MCA territory)', gcs: 13, nihss: 14,
    motorPower: 'Right upper limb 2/5, Right lower limb 3/5, Left 5/5',
    reflexes: 'Right upper limb hyperreflexia (3+), Babinski right positive',
    sensation: 'Decreased sensation right face and upper limb',
    coordination: 'Cannot perform — weakness',
    mrs: 4, status: 'Acute Stroke',
    medications: ['Alteplase 0.9mg/kg (given)', 'Aspirin 300mg OD (post-24h)', 'Atorvastatin 80mg ON', 'Ramipril 5mg OD (start 24h post)'],
    doctor: 'Dr. Priscilla Wiafe', followUp: '2026-08-25 (next day)',
    notes: 'NIHSS 14 — moderate stroke. Alteplase given within window. BP managed. CT no haemorrhage. Assess for thrombectomy if not improving.'
  },
  {
    id: 'NEURO-002', name: 'Akua Boateng', age: 45, gender: 'Female', mrn: 'MRN-2026-1002', visitDate: '2026-08-24',
    chiefComplaint: 'Recurrent seizures — 6 months, 2-3 per month',
    condition: 'Epilepsy (Focal with impaired awareness)', gcs: 15,
    motorPower: '5/5 all limbs', reflexes: 'Normal (1+)', sensation: 'Normal', coordination: 'Normal',
    mrs: 1, status: 'Under Treatment',
    medications: ['Levetiracetam 1000mg BD', 'Lamotrigine 200mg BD', 'Folic acid 5mg OD'],
    doctor: 'Dr. Priscilla Wiafe', followUp: '2026-11-24 (3 months)',
    notes: 'Focal seizures with impaired awareness. MRI: mesial temporal sclerosis left. Video-EEG shows left temporal onset. Drug-resistant — consider surgery assessment.'
  },
  {
    id: 'NEURO-003', name: 'Kofi Asare', age: 52, gender: 'Male', mrn: 'MRN-2026-1004', visitDate: '2026-08-24',
    chiefComplaint: 'Progressive tremor — right hand, 2 years',
    condition: "Parkinson's Disease (Hoehn & Yahr Stage 2)", gcs: 15,
    motorPower: '5/5 but rigidity right arm', reflexes: 'Normal', sensation: 'Normal',
    coordination: 'Intention tremor right, finger tapping reduced',
    mrs: 2, status: 'Follow-up',
    medications: ['Levodopa/Carbidopa 250/25mg TDS', 'Pramipexole 0.5mg TDS', 'Entacapone 200mg TDS'],
    doctor: 'Dr. Priscilla Wiafe', followUp: '2026-11-24 (3 months)',
    notes: "Early Parkinson's — predominantly right-sided. ON/OFF fluctuations starting. Consider DBS assessment if progression continues."
  },
  {
    id: 'NEURO-004', name: 'Efua Nyarko', age: 38, gender: 'Female', mrn: 'MRN-2026-1006', visitDate: '2026-08-24',
    chiefComplaint: 'Transient vision loss left eye — 30 minutes, resolved',
    condition: 'Transient Ischaemic Attack (TIA)', gcs: 15, nihss: 0,
    motorPower: '5/5 all limbs', reflexes: 'Normal', sensation: 'Normal', coordination: 'Normal',
    mrs: 0, status: 'New',
    medications: ['Aspirin 300mg OD', 'Clopidogrel 300mg loading → 75mg OD', 'Atorvastatin 80mg ON', 'Amlodipine 5mg OD'],
    doctor: 'Dr. Priscilla Wiafe', followUp: '2026-08-28 (4 days)',
    notes: 'ABCD2 score 5 — high risk. MRI brain + MR angiography urgent. Carotid duplex. Start dual antiplatelet for 21 days then single.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'New': 'bg-blue-100 text-blue-800', 'Follow-up': 'bg-yellow-100 text-yellow-800',
  'Acute Stroke': 'bg-red-100 text-red-800', 'Rehabilitation': 'bg-purple-100 text-purple-800',
  'Chronic': 'bg-gray-100 text-gray-800',
};

export default function NeurologyClinic() {
  const [selected, setSelected] = useState<NeuroPatient | null>(NEURO_PATIENTS[0] ?? null);

  const acuteCount = NEURO_PATIENTS.filter(p => p.status === 'Acute Stroke').length;

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
          title="Add New Neurology Record"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","placeholder":"e.g. Kofi Mensah","required":true},{"name":"condition","label":"Condition","type":"select","options":["Epilepsy","Stroke","Migraine","Parkinson","Neuropathy","MS","Other"]},{"name":"gcs","label":"GCS Score","type":"number"},{"name":"notes","label":"Clinical Notes","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div>
        <h1 className="text-2xl font-bold">Neurology Clinic</h1>
        <p className="text-gray-500">Stroke assessment, seizure management, movement disorders, and neurological examination</p>
      </div>

      {acuteCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <span className="text-red-600 text-xl">🧠</span>
          <div>
            <div className="font-semibold text-red-800">{acuteCount > 1 ? `${acuteCount} Acute Strokes` : '1 Acute Stroke'}</div>
            <div className="text-sm text-red-600">Requires urgent neurological intervention</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Patients Today', value: NEURO_PATIENTS.length, color: 'text-blue-600' },
          { label: 'Acute Stroke', value: acuteCount, color: 'text-red-600' },
          { label: 'Epilepsy', value: NEURO_PATIENTS.filter(p => p.condition.includes('Epilepsy')).length, color: 'text-purple-600' },
          { label: 'Movement Disorders', value: NEURO_PATIENTS.filter(p => p.condition.includes("Parkinson")).length, color: 'text-green-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {NEURO_PATIENTS.map(p => (
            <div key={p.id} onClick={() => setSelected(p)}
              className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${
                selected?.id === p.id ? 'border-blue-500 shadow-md' : ''
              }`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{p.name}</span>
                    <Badge className={`text-[10px] ${STATUS_STYLES[p.status]}`}>{p.status}</Badge>
                  </div>
                  <div className="text-sm text-gray-500">{p.condition}</div>
                  <div className="text-xs text-gray-400 mt-1">{p.chiefComplaint}</div>
                </div>
                <div className="text-right">
                  {p.nihss !== undefined && <div className="text-sm font-bold text-red-600">NIHSS {p.nihss}</div>}
                  <div className="text-sm font-medium text-blue-600">GCS {p.gcs}</div>
                  <div className="text-xs text-gray-400">mRS {p.mrs}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          {selected && (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div>
                <h2 className="font-bold text-lg">{selected.name}</h2>
                <p className="text-sm text-gray-500">{selected.age}y {selected.gender} — {selected.mrn}</p>
                <p className="text-sm text-blue-600">{selected.condition}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className={`rounded p-2 ${selected.gcs < 15 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  <div className="text-lg font-bold">{selected.gcs}</div>
                  <div className="text-[10px]">GCS</div>
                </div>
                {selected.nihss !== undefined && (
                  <div className="bg-red-50 rounded p-2">
                    <div className="text-lg font-bold text-red-600">{selected.nihss}</div>
                    <div className="text-[10px]">NIHSS</div>
                  </div>
                )}
                <div className="bg-purple-50 rounded p-2">
                  <div className="text-lg font-bold text-purple-600">{selected.mrs}</div>
                  <div className="text-[10px]">mRS</div>
                </div>
              </div>

              <div className="text-sm space-y-2">
                <div><span className="text-gray-500 font-medium">Motor Power:</span> {selected.motorPower}</div>
                <div><span className="text-gray-500 font-medium">Reflexes:</span> {selected.reflexes}</div>
                <div><span className="text-gray-500 font-medium">Sensation:</span> {selected.sensation}</div>
                <div><span className="text-gray-500 font-medium">Coordination:</span> {selected.coordination}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Medications</div>
                {selected.medications.map((m, i) => (
                  <div key={i} className="text-xs bg-green-50 rounded px-2 py-1 mb-1">💊 {m}</div>
                ))}
              </div>

              <div className="text-xs text-gray-400 italic">{selected.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
