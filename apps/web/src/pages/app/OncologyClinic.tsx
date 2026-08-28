import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface OncologyPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  mrn: string;
  diagnosis: string;
  tumourSite: string;
  stage: string;
  histology: string;
  grade: string;
  chemotherapyRegimen?: string;
  cycleNumber?: number;
  totalCycles?: number;
  performanceStatus: string;
  ecogScore: number;
  treatmentStatus: 'Diagnosed' | 'On Treatment' | 'Complete Response' | 'Palliative' | 'Survivorship';
  medications: string[];
  doctor: string;
  followUp: string;
  notes: string;
}

const ONCO_PATIENTS: OncologyPatient[] = [
  {
    id: 'ONCO-001', name: 'Kwame Mensah', age: 67, gender: 'Male', mrn: 'MRN-2026-0990',
    diagnosis: 'Colorectal Cancer (Adenocarcinoma)', tumourSite: 'Sigmoid Colon',
    stage: 'Stage IIIB (T4a N1 M0)', histology: 'Moderately differentiated adenocarcinoma', grade: 'G2',
    chemotherapyRegimen: 'FOLFOX-6', cycleNumber: 6, totalCycles: 12,
    performanceStatus: 'ECOG 1 — Restricted', ecogScore: 1,
    treatmentStatus: 'On Treatment', medications: ['5-FU infusion', 'Oxaliplatin 85mg/m²', 'Leucovorin', 'Ondansetron 8mg PRN', 'Dexamethasone 8mg pre-chemo'],
    doctor: 'Dr. Priscilla Wiafe', followUp: '2026-09-14 (next cycle)',
    notes: 'Cycle 6/12 FOLFOX. Neutropenia Grade 2 last cycle — dose reduced oxaliplatin. CEA trending down (24→12→8).'
  },
  {
    id: 'ONCO-002', name: 'Akua Boateng', age: 55, gender: 'Female', mrn: 'MRN-2026-0992',
    diagnosis: 'Breast Cancer (Invasive Ductal Carcinoma)', tumourSite: 'Left Breast, Upper Outer Quadrant',
    stage: 'Stage IIA (T2 N0 M0)', histology: 'Infiltrating ductal carcinoma, ER+/PR+/HER2−', grade: 'G2',
    chemotherapyRegimen: 'AC-T (Adriamycin/Cyclophosphamide → Taxol)', cycleNumber: 4, totalCycles: 8,
    performanceStatus: 'ECOG 0 — Fully active', ecogScore: 0,
    treatmentStatus: 'On Treatment', medications: ['Doxorubicin 60mg/m²', 'Cyclophosphamide 600mg/m²', 'Tamoxifen 20mg OD (post-chemo)', 'G-CSF support'],
    doctor: 'Dr. Priscilla Wiafe', followUp: '2026-09-07 (next cycle)',
    notes: 'AC phase complete. Starting Taxol next. Oncotype DX score 18 — chemotherapy beneficial. Mastectomy planned post-chemo.'
  },
  {
    id: 'ONCO-003', name: 'Kofi Asare', age: 72, gender: 'Male', mrn: 'MRN-2026-0994',
    diagnosis: 'Prostate Cancer', tumourSite: 'Prostate',
    stage: 'Stage IV (T3b N1 M1b — bone metastases)', histology: 'Adenocarcinoma, Gleason 4+3=7', grade: 'Intermediate-High',
    performanceStatus: 'ECOG 2 — Ambulatory >50%', ecogScore: 2,
    treatmentStatus: 'Palliative', medications: ['Leuprolide 11.25mg IM q3months', 'Bicalutamide 50mg OD', 'Zoledronic acid 4mg IV q4weeks', 'Abiraterone 1000mg OD + Prednisolone 5mg'],
    doctor: 'Dr. Priscilla Wiafe', followUp: '2026-11-24 (3 months)',
    notes: 'Metastatic castration-resistant prostate cancer. PSA 180 → 45 on ADT. Now on abiraterone. Bone pain managed with palliative radiotherapy.'
  },
  {
    id: 'ONCO-004', name: 'Efua Nyarko', age: 42, gender: 'Female', mrn: 'MRN-2026-0996',
    diagnosis: 'Cervical Cancer (Squamous Cell Carcinoma)', tumourSite: 'Cervix',
    stage: 'Stage IB2 (T2a1 N0 M0)', histology: 'Well-differentiated SCC', grade: 'G1',
    performanceStatus: 'ECOG 0 — Fully active', ecogScore: 0,
    treatmentStatus: 'Diagnosed', medications: ['Pending chemoradiation protocol'],
    doctor: 'Dr. Priscilla Wiafe', followUp: '2026-08-28 (tumour board)',
    notes: 'Newly diagnosed. MRI staging complete. Tumour board discussion planned. Primary chemoradiation (Cisplatin + RT) recommended.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'Diagnosed': 'bg-blue-100 text-blue-800', 'On Treatment': 'bg-purple-100 text-purple-800',
  'Complete Response': 'bg-green-100 text-green-800', 'Palliative': 'bg-orange-100 text-orange-800',
  'Survivorship': 'bg-teal-100 text-teal-800',
};

export default function OncologyClinic() {
  const [selected, setSelected] = useState<OncologyPatient | null>(ONCO_PATIENTS[0] ?? null);

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
          title="Add New Oncology Record"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","required":true},{"name":"cancerType","label":"Cancer Type","type":"select","options":["Breast","Lung","Colon","Prostate","Cervical","Liver","Stomach","Leukaemia","Lymphoma","Other"]},{"name":"stage","label":"Stage","type":"select","options":["Stage I","Stage II","Stage III","Stage IV"]},{"name":"treatmentPlan","label":"Treatment Plan","type":"select","options":["Chemotherapy","Radiotherapy","Surgery","Combined","Palliative"]},{"name":"notes","label":"Clinical Notes","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div>
        <h1 className="text-2xl font-bold">Oncology Clinic</h1>
        <p className="text-gray-500">Cancer treatment, chemotherapy tracking, tumour staging, and tumour board</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Patients', value: ONCO_PATIENTS.length, color: 'text-blue-600' },
          { label: 'On Treatment', value: ONCO_PATIENTS.filter(p => p.treatmentStatus === 'On Treatment').length, color: 'text-purple-600' },
          { label: 'Palliative', value: ONCO_PATIENTS.filter(p => p.treatmentStatus === 'Palliative').length, color: 'text-orange-600' },
          { label: 'ECOG ≤1', value: ONCO_PATIENTS.filter(p => p.ecogScore <= 1).length, color: 'text-green-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {ONCO_PATIENTS.map(p => (
            <div key={p.id} onClick={() => setSelected(p)}
              className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${
                selected?.id === p.id ? 'border-blue-500 shadow-md' : ''
              }`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{p.name}</span>
                    <Badge className={`text-[10px] ${STATUS_STYLES[p.treatmentStatus]}`}>{p.treatmentStatus}</Badge>
                  </div>
                  <div className="text-sm text-gray-500">{p.diagnosis}</div>
                  <div className="text-xs text-gray-400 mt-1">{p.stage} | {p.tumourSite}</div>
                </div>
                <div className="text-right">
                  {p.chemotherapyRegimen && (
                    <div className="text-sm font-medium text-purple-600">{p.chemotherapyRegimen}</div>
                  )}
                  {p.cycleNumber && (
                    <div className="text-xs text-gray-400">Cycle {p.cycleNumber}/{p.totalCycles}</div>
                  )}
                  <div className="text-xs text-gray-400">ECOG {p.ecogScore}</div>
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
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <div><span className="text-gray-500">Tumour:</span> {selected.tumourSite}</div>
                <div><span className="text-gray-500">Stage:</span> <span className="font-semibold text-red-600">{selected.stage}</span></div>
                <div><span className="text-gray-500">Histology:</span> {selected.histology}</div>
                <div><span className="text-gray-500">Grade:</span> {selected.grade}</div>
                <div><span className="text-gray-500">ECOG:</span> {selected.ecogScore} — {selected.performanceStatus}</div>
              </div>

              {selected.chemotherapyRegimen && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-purple-700">💊 Chemotherapy</div>
                  <div className="text-sm text-purple-600">{selected.chemotherapyRegimen}</div>
                  {selected.cycleNumber && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-purple-600 mb-1">
                        <span>Cycle {selected.cycleNumber}/{selected.totalCycles}</span>
                        <span>{Math.round((selected.cycleNumber / (selected.totalCycles ?? 1)) * 100)}%</span>
                      </div>
                      <div className="w-full bg-purple-200 rounded-full h-2">
                        <div className="bg-purple-600 h-full rounded-full" style={{ width: `${(selected.cycleNumber / (selected.totalCycles ?? 1)) * 100}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

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
