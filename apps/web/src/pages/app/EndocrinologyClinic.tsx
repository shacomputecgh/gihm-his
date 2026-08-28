import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface EndoPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  mrn: string;
  visitDate: string;
  chiefComplaint: string;
  condition: string;
  hba1c?: number;
  fastingGlucose?: number;
  tsh?: number;
  t3?: number;
  t4?: number;
  bmi: number;
  complications: string[];
  medications: string[];
  status: 'New' | 'Follow-up' | 'Under Treatment' | 'Stable';
  doctor: string;
  followUp: string;
  notes: string;
}

const ENDO_PATIENTS: EndoPatient[] = [
  {
    id: 'ENDO-001', name: 'Kwame Mensah', age: 67, gender: 'Male', mrn: 'MRN-2026-0960', visitDate: '2026-08-24',
    chiefComplaint: 'Diabetes review — poor control, HbA1c rising',
    condition: 'Type 2 Diabetes Mellitus', hba1c: 9.2, fastingGlucose: 12.8, bmi: 31.5,
    complications: ['Diabetic Retinopathy', 'Diabetic Nephropathy (eGFR 45)', 'Peripheral Neuropathy'],
    medications: ['Metformin 1g BD', 'Gliclazide 80mg BD', 'Insulin Glargine 24u ON', 'Atorvastatin 40mg', 'Ramipril 10mg'],
    status: 'Follow-up', doctor: 'Dr. Priscilla Wiafe', followUp: '2026-11-24 (3 months)',
    notes: 'Poor control — HbA1c 9.2%. Increase basal insulin. Refer ophthalmology for retinopathy screening. Check urine albumin.'
  },
  {
    id: 'ENDO-002', name: 'Akua Boateng', age: 35, gender: 'Female', mrn: 'MRN-2026-0962', visitDate: '2026-08-24',
    chiefComplaint: 'Type 1 Diabetes — insulin pump review',
    condition: 'Type 1 Diabetes Mellitus', hba1c: 6.8, fastingGlucose: 5.2, bmi: 23.5,
    complications: ['No microvascular complications'],
    medications: ['Insulin Pump (Insulin Aspart)', 'Insulin Detemir 8u (basal)', 'Continuous Glucose Monitor (Dexcom G7)'],
    status: 'Stable', doctor: 'Dr. Priscilla Wiafe', followUp: '2026-11-24 (3 months)',
    notes: 'Excellent control. HbA1c 6.8% — target achieved. TIR 78%. Continue current regimen. Annual screening due.'
  },
  {
    id: 'ENDO-003', name: 'Kofi Asare', age: 52, gender: 'Male', mrn: 'MRN-2026-0964', visitDate: '2026-08-24',
    chiefComplaint: 'Weight gain, fatigue, cold intolerance — 6 months',
    condition: 'Hypothyroidism (Hashimoto\'s)', tsh: 28.5, t3: 2.8, t4: 4.2, bmi: 29.0,
    complications: ['Hypercholesterolaemia', 'Obesity'],
    medications: ['Levothyroxine 100mcg OD (escalating)', 'Atorvastatin 20mg'],
    status: 'New', doctor: 'Dr. Priscilla Wiafe', followUp: '2026-11-24 (3 months)',
    notes: 'Newly diagnosed hypothyroidism. Start Levothyroxine 50mcg, recheck TSH in 6 weeks. Anti-TPO elevated.'
  },
  {
    id: 'ENDO-004', name: 'Efua Nyarko', age: 42, gender: 'Female', mrn: 'MRN-2026-0966', visitDate: '2026-08-24',
    chiefComplaint: 'Palpitations, weight loss, tremor — 3 months',
    condition: 'Graves\' Disease (Hyperthyroidism)', tsh: 0.01, t3: 12.5, t4: 28.0, bmi: 21.0,
    complications: ['Atrial fibrillation', 'Osteoporosis risk'],
    medications: ['Carbimazole 20mg TDS', 'Propranolol 40mg TDS', 'Calcium + Vitamin D'],
    status: 'Under Treatment', doctor: 'Dr. Priscilla Wiafe', followUp: '2026-11-24 (3 months)',
    notes: 'Active Graves\' disease with AF. Block and replace strategy. Monitor TFTs monthly. DEXA scan for osteoporosis.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'New': 'bg-blue-100 text-blue-800', 'Follow-up': 'bg-yellow-100 text-yellow-800',
  'Under Treatment': 'bg-purple-100 text-purple-800', 'Stable': 'bg-green-100 text-green-800',
};

function getHba1cColor(a1c: number): string {
  if (a1c <= 7.0) return 'text-green-600 bg-green-50';
  if (a1c <= 8.0) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
}

export default function EndocrinologyClinic() {
  const [selected, setSelected] = useState<EndoPatient | null>(ENDO_PATIENTS[0] ?? null);

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
          title="Add New Endocrinology Record"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","placeholder":"e.g. Yaw Boateng","required":true},{"name":"condition","label":"Condition","type":"select","options":["Diabetes Type 1","Diabetes Type 2","Thyroid Disease","PCOS","Adrenal Disorder","Other"]},{"name":"hba1c","label":"HbA1c (%)","type":"number"},{"name":"fastingGlucose","label":"Fasting Glucose (mg/dL)","type":"number"},{"name":"medication","label":"Current Medication","type":"text"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div>
        <h1 className="text-2xl font-bold">Endocrinology Clinic</h1>
        <p className="text-gray-500">Diabetes management, thyroid disorders, HbA1c monitoring, and endocrine diseases</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Patients Today', value: ENDO_PATIENTS.length, color: 'text-blue-600' },
          { label: 'Diabetes', value: ENDO_PATIENTS.filter(p => p.condition.includes('Diabetes')).length, color: 'text-orange-600' },
          { label: 'Thyroid', value: ENDO_PATIENTS.filter(p => p.condition.includes('Thyroid') || p.condition.includes('Graves')).length, color: 'text-purple-600' },
          { label: 'Poor Control', value: ENDO_PATIENTS.filter(p => (p.hba1c ?? 0) > 8.0).length, color: 'text-red-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {ENDO_PATIENTS.map(p => (
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
                  {p.hba1c && (
                    <div className={`text-lg font-bold px-2 py-1 rounded ${getHba1cColor(p.hba1c)}`}>
                      HbA1c {p.hba1c}%
                    </div>
                  )}
                  {p.tsh !== undefined && (
                    <div className="text-sm text-gray-600">TSH {p.tsh}</div>
                  )}
                </div>
              </div>
              <div className="flex gap-1 mt-2 flex-wrap">
                {p.complications.map(c => <Badge key={c} className="text-[10px] bg-orange-100 text-orange-700">{c}</Badge>)}
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
                <div><span className="text-gray-500">BMI:</span> {selected.bmi}</div>
                <div><span className="text-gray-500">Doctor:</span> {selected.doctor}</div>
                <div><span className="text-gray-500">Follow-up:</span> {selected.followUp}</div>
              </div>

              {selected.hba1c && (
                <div className={`rounded-lg p-3 text-center ${getHba1cColor(selected.hba1c)}`}>
                  <div className="text-3xl font-black">{selected.hba1c}%</div>
                  <div className="text-xs">HbA1c (target {'<'}7.0%)</div>
                </div>
              )}

              {selected.tsh !== undefined && (
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">Thyroid Function</div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="bg-gray-50 rounded p-2 text-center">
                      <div className="font-bold">{selected.tsh}</div>
                      <div className="text-[10px] text-gray-500">TSH</div>
                    </div>
                    <div className="bg-gray-50 rounded p-2 text-center">
                      <div className="font-bold">{selected.t3}</div>
                      <div className="text-[10px] text-gray-500">T3</div>
                    </div>
                    <div className="bg-gray-50 rounded p-2 text-center">
                      <div className="font-bold">{selected.t4}</div>
                      <div className="text-[10px] text-gray-500">T4</div>
                    </div>
                  </div>
                </div>
              )}

              {selected.complications.length > 0 && (
                <div className="bg-orange-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-orange-700 mb-1">Complications</div>
                  {selected.complications.map((c, i) => (
                    <div key={i} className="text-xs text-orange-600">⚠️ {c}</div>
                  ))}
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
