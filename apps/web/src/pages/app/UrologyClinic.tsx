import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface UrologyPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  mrn: string;
  visitDate: string;
  chiefComplaint: string;
  condition: string;
  psa?: number;
  postVoidResidual?: number;
  uroflowmetry?: string;
  imaging: string;
  status: 'New' | 'Follow-up' | 'Post-Procedure' | 'Under Treatment';
  medications: string[];
  doctor: string;
  followUp: string;
  notes: string;
}

const UROLOGY_PATIENTS: UrologyPatient[] = [
  {
    id: 'URO-001', name: 'Kwame Mensah', age: 67, gender: 'Male', mrn: 'MRN-2026-1010', visitDate: '2026-08-24',
    chiefComplaint: 'Difficulty urinating — weak stream, hesitancy, nocturia x5',
    condition: 'Benign Prostatic Hyperplasia', psa: 4.2, postVoidResidual: 180,
    uroflowmetry: 'Qmax 8 mL/s (obstructed pattern), voided volume 220mL',
    imaging: 'USS: Prostate volume 65cc, no hydronephrosis, bilateral kidneys normal',
    status: 'New', medications: ['Tamsulosin 0.4mg ON', 'Finasteride 5mg OD'],
    doctor: 'Dr. Yaw Boateng', followUp: '2026-11-24 (3 months)',
    notes: 'IPSS score 22 (severe). PVR 180mL. Trial of medical therapy — Tamsulosin + Finasteride. Consider TURP if not improving in 3 months.'
  },
  {
    id: 'URO-002', name: 'Kofi Asare', age: 52, gender: 'Male', mrn: 'MRN-2026-1012', visitDate: '2026-08-24',
    chiefComplaint: 'Elevated PSA — incidental finding on routine check',
    condition: 'Prostate Cancer Screening', psa: 8.5, postVoidResidual: 30,
    imaging: 'MRI prostate: PI-RADS 4 lesion in right peripheral zone',
    status: 'New', medications: [],
    doctor: 'Dr. Yaw Boateng', followUp: '2026-08-28 (biopsy)',
    notes: 'PSA 8.5 ng/mL, PSA density 0.18. PI-RADS 4 on mpMRI. TRUS-guided biopsy scheduled. Discuss Gleason implications.'
  },
  {
    id: 'URO-003', name: 'Efua Nyarko', age: 35, gender: 'Female', mrn: 'MRN-2026-1014', visitDate: '2026-08-24',
    chiefComplaint: 'Recurrent UTIs — 4 episodes in 12 months',
    condition: 'Recurrent Urinary Tract Infections', postVoidResidual: 20,
    uroflowmetry: 'Normal flow pattern, Qmax 22 mL/s',
    imaging: 'USS: Normal kidneys, no stones, no residual. Micturating cystogram: no reflux.',
    status: 'New', medications: ['Nitrofurantoin 100mg ON prophylaxis x6 months', 'Cranberry extract'],
    doctor: 'Dr. Yaw Boateng', followUp: '2026-11-24 (3 months)',
    notes: 'Recurrent E. coli UTIs. No structural abnormality. Prophylactic antibiotics. Cranberry. Review voiding habits and hygiene.'
  },
  {
    id: 'URO-004', name: 'Nana Kuffour', age: 45, gender: 'Male', mrn: 'MRN-2026-1016', visitDate: '2026-08-24',
    chiefComplaint: 'Renal colic — severe left flank pain, haematuria',
    condition: 'Ureteric Calculus (Left, 6mm)',
    imaging: 'CT KUB: 6mm stone left mid-ureter, mild hydronephrosis left kidney',
    status: 'New', medications: ['Tamsulosin 0.4mg ON (medical expulsive therapy)', 'Paracetamol 1g QDS', 'Diclofenac 75mg BD PRN'],
    doctor: 'Dr. Yaw Boateng', followUp: '2026-08-31 (1 week)',
    notes: '6mm stone — 60% chance of spontaneous passage with MET. If fails in 2 weeks → URS/Lithotripsy. Strain urine for stone analysis.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'New': 'bg-blue-100 text-blue-800', 'Follow-up': 'bg-yellow-100 text-yellow-800',
  'Post-Procedure': 'bg-green-100 text-green-800', 'Under Treatment': 'bg-purple-100 text-purple-800',
};

export default function UrologyClinic() {
  const [selected, setSelected] = useState<UrologyPatient | null>(UROLOGY_PATIENTS[0] ?? null);

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
          title="Add New Urology Record"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","placeholder":"e.g. Kwame Asante","required":true},{"name":"condition","label":"Condition","type":"select","options":["UTI","Kidney Stones","BPH","Kidney Failure","Prostate Cancer","Other"]},{"name":"notes","label":"Clinical Notes","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div>
        <h1 className="text-2xl font-bold">Urology Clinic</h1>
        <p className="text-gray-500">Prostate management, renal stones, cystoscopy, and urinary disorders</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Patients Today', value: UROLOGY_PATIENTS.length, color: 'text-blue-600' },
          { label: 'BPH', value: UROLOGY_PATIENTS.filter(p => p.condition.includes('BPH') || p.condition.includes('Benign')).length, color: 'text-green-600' },
          { label: 'Renal Stones', value: UROLOGY_PATIENTS.filter(p => p.condition.includes('Calculus') || p.condition.includes('Stone')).length, color: 'text-orange-600' },
          { label: 'Prostate Screening', value: UROLOGY_PATIENTS.filter(p => p.psa !== undefined).length, color: 'text-purple-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {UROLOGY_PATIENTS.map(p => (
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
                  {p.psa !== undefined && <div className="text-sm font-bold text-purple-600">PSA {p.psa}</div>}
                  {p.postVoidResidual !== undefined && <div className="text-xs text-gray-500">PVR {p.postVoidResidual}mL</div>}
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

              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <div><span className="text-gray-500">Complaint:</span> {selected.chiefComplaint}</div>
                <div><span className="text-gray-500">Doctor:</span> {selected.doctor}</div>
                <div><span className="text-gray-500">Follow-up:</span> {selected.followUp}</div>
              </div>

              {selected.psa !== undefined && (
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <div className="text-3xl font-black text-purple-600">{selected.psa} ng/mL</div>
                  <div className="text-xs text-purple-600">PSA (normal {'<'}4.0)</div>
                </div>
              )}

              {selected.postVoidResidual !== undefined && (
                <div className="text-sm">
                  <span className="text-gray-500">Post-Void Residual:</span>{' '}
                  <span className={`font-bold ${selected.postVoidResidual > 100 ? 'text-red-600' : 'text-green-600'}`}>
                    {selected.postVoidResidual}mL
                  </span>
                </div>
              )}

              {selected.uroflowmetry && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-blue-700">Uroflowmetry</div>
                  <div className="text-xs text-blue-600 mt-1">{selected.uroflowmetry}</div>
                </div>
              )}

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Imaging</div>
                <div className="bg-gray-50 rounded p-2 text-xs">{selected.imaging}</div>
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
