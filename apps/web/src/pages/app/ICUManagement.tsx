import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Button } from '../../components/ui';

interface ICUPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  diagnosis: string;
  bedNumber: string;
  admissionDate: string;
  ventilator: boolean;
  ventilatorType?: string;
  oxygenSupport: string;
  gcs: { eyes: number; verbal: number; motor: number; total: number };
  vitals: { bp: string; hr: number; temp: number; rr: number; spo2: number; cvp?: number };
  drips: string[];
  nurseAssigned: string;
  acuityLevel: 'Red' | 'Orange' | 'Yellow' | 'Green';
  ageScale: number;
  nursingInterventions: string[];
  labAlerts: string[];
  estimatedLOS: string;
}

const ICU_PATIENTS: ICUPatient[] = [
  {
    id: 'ICU-001', name: 'Kwame Mensah', age: 67, gender: 'Male',
    diagnosis: 'Septic Shock secondary to Pneumonia', bedNumber: 'ICU-A1',
    admissionDate: '2026-08-18', ventilator: true, ventilatorType: 'AC/VC',
    oxygenSupport: 'Mechanical Ventilation',
    gcs: { eyes: 2, verbal: 2, motor: 4, total: 8 },
    vitals: { bp: '85/52', hr: 118, temp: 39.2, rr: 24, spo2: 91, cvp: 14 },
    drips: ['Noradrenaline 0.15 mcg/kg/min', 'Piperacillin-Tazobactam 4.5g', 'Ringer Lactate 250ml/hr'],
    nurseAssigned: 'Sr. Abena Osei', acuityLevel: 'Red', ageScale: 68,
    nursingInterventions: ['Hourly neuro checks', 'Foley care Q8H', 'Ventilator assessment Q2H', 'Skin integrity Q4H'],
    labAlerts: ['WBC 18.2 (High)', 'Lactate 4.8 (Critical)', 'Procalcitonin 12.5'],
    estimatedLOS: '7-10 days'
  },
  {
    id: 'ICU-002', name: 'Akua Boateng', age: 45, gender: 'Female',
    diagnosis: 'Post-Caesarean Sepsis with DIC', bedNumber: 'ICU-A2',
    admissionDate: '2026-08-20', ventilator: false,
    oxygenSupport: 'High Flow Nasal Cannula 50L/min',
    gcs: { eyes: 4, verbal: 4, motor: 6, total: 14 },
    vitals: { bp: '92/58', hr: 105, temp: 38.8, rr: 22, spo2: 94, cvp: 10 },
    drips: ['Meropenem 1g Q8H', 'Fresh Frozen Plasma', 'Oxytocin 10 units/hr'],
    nurseAssigned: 'Sr. Esi Amoako', acuityLevel: 'Red', ageScale: 52,
    nursingInterventions: ['Strict I&O monitoring', 'DIC panel Q6H', 'Wound assessment Q4H', 'Thromboprophylaxis'],
    labAlerts: ['Platelets 45 (Critical)', 'INR 3.2 (Critical)', 'D-dimer >2000'],
    estimatedLOS: '5-7 days'
  },
  {
    id: 'ICU-003', name: 'Kofi Asante', age: 72, gender: 'Male',
    diagnosis: 'Acute MI — Cardiogenic Shock', bedNumber: 'ICU-B1',
    admissionDate: '2026-08-22', ventilator: true, ventilatorType: 'SIMV',
    oxygenSupport: 'Mechanical Ventilation + Inotropes',
    gcs: { eyes: 3, verbal: 3, motor: 5, total: 11 },
    vitals: { bp: '78/45', hr: 95, temp: 36.8, rr: 18, spo2: 88, cvp: 18 },
    drips: ['Dobutamine 5 mcg/kg/min', 'Adrenaline 0.05 mcg/kg/min', 'Aspirin 300mg', 'Clopidogrel 300mg', 'Heparin infusion'],
    nurseAssigned: 'Sr. Yaw Kuffour', acuityLevel: 'Red', ageScale: 72,
    nursingInterventions: ['Continuous cardiac monitoring', 'Troponin Q4H', 'Fluid balance strict', 'Pain management Q2H'],
    labAlerts: ['Troponin I 15.8 (Critical)', 'BNP 2800', 'CK-MB 85 (High)'],
    estimatedLOS: '10-14 days'
  },
  {
    id: 'ICU-004', name: 'Ama Dadzie', age: 58, gender: 'Female',
    diagnosis: 'Diabetic Ketoacidosis', bedNumber: 'ICU-B2',
    admissionDate: '2026-08-23', ventilator: false,
    oxygenSupport: 'Nasal Cannula 4L/min',
    gcs: { eyes: 4, verbal: 5, motor: 6, total: 15 },
    vitals: { bp: '105/65', hr: 88, temp: 37.1, rr: 20, spo2: 96 },
    drips: ['Insulin infusion 0.1 units/kg/hr', 'Normal Saline 500ml/hr', 'Potassium Chloride 20mEq'],
    nurseAssigned: 'Sr. Nana Agyei', acuityLevel: 'Yellow', ageScale: 48,
    nursingInterventions: ['BGL Q1H', 'Anion gap Q2H', 'Neuro checks Q4H', 'DVT prophylaxis'],
    labAlerts: ['pH 7.18 (Critical)', 'K+ 3.1 (Low)', 'BGL 28.5 (Critical)'],
    estimatedLOS: '2-3 days'
  },
  {
    id: 'ICU-005', name: 'Yaw Owusu', age: 34, gender: 'Male',
    diagnosis: 'Severe TBI — Road Traffic Accident', bedNumber: 'ICU-C1',
    admissionDate: '2026-08-21', ventilator: true, ventilatorType: 'BIPAP',
    oxygenSupport: 'Mechanical Ventilation',
    gcs: { eyes: 1, verbal: 1, motor: 3, total: 5 },
    vitals: { bp: '142/88', hr: 72, temp: 37.8, rr: 14, spo2: 95, cvp: 8 },
    drips: ['Mannitol 125ml Q6H', 'Levetiracetam 1g Q12H', 'Propofol TCI', 'Fentanyl 50mcg/hr'],
    nurseAssigned: 'Sr. Akosua Mensah', acuityLevel: 'Red', ageScale: 65,
    nursingInterventions: ['ICP monitoring', 'Pupil reaction Q1H', 'Cushing reflex watch', 'Log roll Q2H'],
    labAlerts: ['ICP 22 (High)', 'CT shows midline shift 5mm', 'Haemoglobin 8.2 (Low)'],
    estimatedLOS: '14-21 days'
  },
  {
    id: 'ICU-006', name: 'Efua Nyarko', age: 29, gender: 'Female',
    diagnosis: 'Eclampsia — Postpartum', bedNumber: 'ICU-C2',
    admissionDate: '2026-08-24', ventilator: false,
    oxygenSupport: 'Face Mask 10L/min',
    gcs: { eyes: 3, verbal: 4, motor: 6, total: 13 },
    vitals: { bp: '168/102', hr: 110, temp: 37.4, rr: 18, spo2: 96 },
    drips: ['Magnesium Sulphate 1g/hr', 'Labetalol 20mg IV PRN', 'Nifedipine 20mg PO BD'],
    nurseAssigned: 'Sr. Priscilla Aidoo', acuityLevel: 'Orange', ageScale: 55,
    nursingInterventions: ['Magnesium toxicity monitoring', 'Reflex checks Q2H', 'Urine output Q1H', 'Seizure precautions'],
    labAlerts: ['Platelets 98 (Low)', 'Creatinine 1.8 (High)', 'Liver enzymes elevated'],
    estimatedLOS: '3-5 days'
  }
];

const ACUITY_COLORS: Record<string, string> = {
  Red: 'bg-red-500', Orange: 'bg-orange-500', Yellow: 'bg-yellow-500', Green: 'bg-green-500'
};
const ACUITY_LABELS: Record<string, string> = {
  Red: 'Critical', Orange: 'High', Yellow: 'Moderate', Green: 'Stable'
};

function getGCSColor(total: number): string {
  if (total <= 8) return 'text-red-600 bg-red-50';
  if (total <= 12) return 'text-orange-600 bg-orange-50';
  return 'text-green-600 bg-green-50';
}

export default function ICUManagement() {
  const [selectedPatient, setSelectedPatient] = useState<ICUPatient | null>(ICU_PATIENTS[0] ?? null);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  const ventilatedPatients = ICU_PATIENTS.filter(p => p.ventilator).length;
  const criticalCount = ICU_PATIENTS.filter(p => p.acuityLevel === 'Red').length;
  const bedsTotal = 12;
  const bedsOccupied = ICU_PATIENTS.length;

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
          title="Add New ICU Record"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","required":true},{"name":"bed","label":"ICU Bed","type":"select","options":["ICU-01","ICU-02","ICU-03","ICU-04","ICU-05","ICU-06","ICU-07","ICU-08"]},{"name":"diagnosis","label":"Primary Diagnosis","type":"text","required":true},{"name":"ventilator","label":"Ventilator","type":"select","options":["None","Invasive","Non-Invasive","Oxygen Therapy"]},{"name":"gcs","label":"GCS Score","type":"number"},{"name":"sofaScore","label":"SOFA Score","type":"number"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ICU Management</h1>
          <p className="text-gray-500">Intensive Care Unit — Real-time monitoring and management</p>
        </div>
        <div className="flex gap-2">
          <Button variant={viewMode === 'board' ? 'primary' : 'outline'} onClick={() => setViewMode('board')}>Bed Board</Button>
          <Button variant={viewMode === 'list' ? 'primary' : 'outline'} onClick={() => setViewMode('list')}>Patient List</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: 'Total Beds', value: `${bedsOccupied}/${bedsTotal}`, color: 'text-blue-600' },
          { label: 'Occupancy', value: `${Math.round(bedsOccupied/bedsTotal*100)}%`, color: bedsOccupied/bedsTotal > 0.8 ? 'text-red-600' : 'text-green-600' },
          { label: 'Critical', value: criticalCount, color: 'text-red-600' },
          { label: 'Ventilated', value: ventilatedPatients, color: 'text-purple-600' },
          { label: 'Nurse Ratio', value: '1:2', color: 'text-blue-600' },
          { label: 'Avg Acuity', value: '1.6', color: 'text-orange-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bed Board */}
        <div className="lg:col-span-2">
          {viewMode === 'board' ? (
            <div className="grid grid-cols-3 gap-3">
              {ICU_PATIENTS.map(p => (
                <div key={p.id} onClick={() => setSelectedPatient(p)}
                  className={`border-2 rounded-lg p-3 cursor-pointer transition-all hover:shadow-lg ${
                    selectedPatient?.id === p.id ? 'border-blue-500 shadow-md' : 'border-gray-200'
                  }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-bold text-gray-600">{p.bedNumber}</span>
                    <span className={`w-3 h-3 rounded-full ${ACUITY_COLORS[p.acuityLevel]}`} title={ACUITY_LABELS[p.acuityLevel]} />
                  </div>
                  <div className="font-semibold text-sm">{p.name}</div>
                  <div className="text-xs text-gray-500 truncate">{p.diagnosis}</div>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {p.ventilator && <Badge className="text-[10px] bg-purple-100 text-purple-700">Vent</Badge>}
                    <Badge className={`text-[10px] ${getGCSColor(p.gcs.total)}`}>GCS {p.gcs.total}</Badge>
                  </div>
                </div>
              ))}
              {Array.from({ length: bedsTotal - bedsOccupied }).map((_, i) => (
                <div key={`empty-${i}`} className="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center text-gray-400">
                  <div className="text-sm">Empty Bed</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {ICU_PATIENTS.map(p => (
                <div key={p.id} onClick={() => setSelectedPatient(p)}
                  className={`border rounded-lg p-3 flex items-center gap-4 cursor-pointer hover:bg-gray-50 ${
                    selectedPatient?.id === p.id ? 'border-blue-500 bg-blue-50' : ''
                  }`}>
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 ${ACUITY_COLORS[p.acuityLevel]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{p.name}</span>
                      <span className="text-sm text-gray-500">({p.bedNumber})</span>
                    </div>
                    <div className="text-sm text-gray-500 truncate">{p.diagnosis}</div>
                  </div>
                  <Badge className={getGCSColor(p.gcs.total)}>GCS {p.gcs.total}</Badge>
                  {p.ventilator && <Badge className="bg-purple-100 text-purple-700">Ventilated</Badge>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Patient Detail Panel */}
        <div className="lg:col-span-1">
          {selectedPatient ? (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-lg">{selectedPatient.name}</h2>
                  <p className="text-sm text-gray-500">{selectedPatient.bedNumber} — {selectedPatient.age}y {selectedPatient.gender}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-white text-xs font-bold ${ACUITY_COLORS[selectedPatient.acuityLevel]}`}>
                  {ACUITY_LABELS[selectedPatient.acuityLevel]}
                </span>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-600">Diagnosis</div>
                <div className="text-sm font-semibold">{selectedPatient.diagnosis}</div>
              </div>

              {/* GCS */}
              <div>
                <div className="text-sm font-medium text-gray-600 mb-2">Glasgow Coma Scale</div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center bg-gray-50 rounded p-2">
                    <div className="text-lg font-bold">{selectedPatient.gcs.eyes}</div>
                    <div className="text-[10px] text-gray-500">Eyes</div>
                  </div>
                  <div className="text-center bg-gray-50 rounded p-2">
                    <div className="text-lg font-bold">{selectedPatient.gcs.verbal}</div>
                    <div className="text-[10px] text-gray-500">Verbal</div>
                  </div>
                  <div className="text-center bg-gray-50 rounded p-2">
                    <div className="text-lg font-bold">{selectedPatient.gcs.motor}</div>
                    <div className="text-[10px] text-gray-500">Motor</div>
                  </div>
                  <div className={`text-center rounded p-2 ${getGCSColor(selectedPatient.gcs.total)}`}>
                    <div className="text-lg font-bold">{selectedPatient.gcs.total}</div>
                    <div className="text-[10px]">Total</div>
                  </div>
                </div>
              </div>

              {/* Vitals */}
              <div>
                <div className="text-sm font-medium text-gray-600 mb-2">Vital Signs</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-red-50 rounded p-2 text-center">
                    <div className="text-sm font-bold text-red-600">{selectedPatient.vitals.bp}</div>
                    <div className="text-[10px] text-gray-500">BP (mmHg)</div>
                  </div>
                  <div className="bg-pink-50 rounded p-2 text-center">
                    <div className="text-sm font-bold text-pink-600">{selectedPatient.vitals.hr}</div>
                    <div className="text-[10px] text-gray-500">HR (bpm)</div>
                  </div>
                  <div className="bg-orange-50 rounded p-2 text-center">
                    <div className="text-sm font-bold text-orange-600">{selectedPatient.vitals.temp}°</div>
                    <div className="text-[10px] text-gray-500">Temp (°C)</div>
                  </div>
                  <div className="bg-blue-50 rounded p-2 text-center">
                    <div className="text-sm font-bold text-blue-600">{selectedPatient.vitals.rr}</div>
                    <div className="text-[10px] text-gray-500">RR (/min)</div>
                  </div>
                  <div className="bg-cyan-50 rounded p-2 text-center">
                    <div className="text-sm font-bold text-cyan-600">{selectedPatient.vitals.spo2}%</div>
                    <div className="text-[10px] text-gray-500">SpO2</div>
                  </div>
                  {selectedPatient.vitals.cvp && (
                    <div className="bg-purple-50 rounded p-2 text-center">
                      <div className="text-sm font-bold text-purple-600">{selectedPatient.vitals.cvp}</div>
                      <div className="text-[10px] text-gray-500">CVP (cmH2O)</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Ventilator */}
              {selectedPatient.ventilator && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-purple-700">🫁 Ventilator: {selectedPatient.ventilatorType}</div>
                  <div className="text-xs text-purple-600 mt-1">Mode: {selectedPatient.ventilatorType} | O2: {selectedPatient.oxygenSupport}</div>
                </div>
              )}

              {/* Drips */}
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Active Infusions</div>
                {selectedPatient.drips.map((drip, i) => (
                  <div key={i} className="text-sm bg-yellow-50 rounded px-2 py-1 mb-1 flex items-center gap-1">
                    <span className="text-yellow-600">💉</span> {drip}
                  </div>
                ))}
              </div>

              {/* Lab Alerts */}
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Lab Alerts</div>
                {selectedPatient.labAlerts.map((alert, i) => (
                  <div key={i} className={`text-sm rounded px-2 py-1 mb-1 ${
                    alert.includes('Critical') ? 'bg-red-50 text-red-700' :
                    alert.includes('High') || alert.includes('Low') ? 'bg-orange-50 text-orange-700' :
                    'bg-blue-50 text-blue-700'
                  }`}>
                    ⚠️ {alert}
                  </div>
                ))}
              </div>

              {/* Nursing */}
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Nursing: {selectedPatient.nurseAssigned}</div>
                {selectedPatient.nursingInterventions.map((intervention, i) => (
                  <div key={i} className="text-xs text-gray-600 flex items-center gap-1">
                    <span className="text-green-500">✓</span> {intervention}
                  </div>
                ))}
              </div>

              <div className="text-xs text-gray-500">
                Est. LOS: {selectedPatient.estimatedLOS}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-12">Select a patient from the bed board</div>
          )}
        </div>
      </div>
    </div>
  );
}
