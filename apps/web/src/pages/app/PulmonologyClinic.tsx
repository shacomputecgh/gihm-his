import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface PulmoPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  mrn: string;
  visitDate: string;
  chiefComplaint: string;
  condition: string;
  spirometry: { fev1: number; fvc: number; fev1fvc: number; pef: number };
  oxygenSat: number;
  respiratoryRate: number;
  chestXray: string;
  sputumAFB?: string;
  status: 'New' | 'Follow-up' | 'Under Treatment' | 'On DOTS' | 'Stable';
  medications: string[];
  doctor: string;
  followUp: string;
  notes: string;
}

const PULMO_PATIENTS: PulmoPatient[] = [
  {
    id: 'PULMO-001', name: 'Kwame Mensah', age: 67, gender: 'Male', mrn: 'MRN-2026-0970', visitDate: '2026-08-24',
    chiefComplaint: 'Worsening breathlessness — 6 months, smoker',
    condition: 'COPD (GOLD Stage III)', spirometry: { fev1: 38, fvc: 72, fev1fvc: 52, pef: 280 },
    oxygenSat: 91, respiratoryRate: 24, chestXray: 'Hyperinflation, flattened diaphragms, bullae bilateral upper zones',
    status: 'Under Treatment', medications: ['Tiotropium 18mcg OD', 'Formoterol 12mcg BD', 'Fluticasone/Salmeterol 250/50 BD', 'Salbutamol PRN', 'Prednisolone 40mg x5 days (exacerbation)'],
    doctor: 'Dr. Priscilla Wiafe', followUp: '2026-10-24 (2 months)', notes: 'Exacerbation recovering. Oxygen saturations low — consider LTOT if persistently <88%. Smoking cessation mandatory.'
  },
  {
    id: 'PULMO-002', name: 'Akua Boateng', age: 45, gender: 'Female', mrn: 'MRN-2026-0972', visitDate: '2026-08-24',
    chiefComplaint: 'Chronic cough — 3 months, non-smoker',
    condition: 'Bronchial Asthma (Moderate Persistent)', spirometry: { fev1: 62, fvc: 85, fev1fvc: 73, pef: 320 },
    oxygenSat: 97, respiratoryRate: 16, chestXray: 'Normal',
    status: 'Follow-up', medications: ['Budesonide/Formoterol 200/6 BD', 'Montelukast 10mg ON', 'Salbutamol PRN'],
    doctor: 'Dr. Priscilla Wiafe', followUp: '2026-11-24 (3 months)', notes: 'Improved on ICS/LABA. Peak flow diary good. Trigger avoidance counselling done. Consider step-down if stable.'
  },
  {
    id: 'PULMO-003', name: 'Kofi Asare', age: 35, gender: 'Male', mrn: 'MRN-2026-0974', visitDate: '2026-08-24',
    chiefComplaint: 'Night sweats, weight loss, cough — 2 months',
    condition: 'Pulmonary Tuberculosis (Sputum AFB+)', spirometry: { fev1: 72, fvc: 88, fev1fvc: 82, pef: 380 },
    oxygenSat: 94, respiratoryRate: 20, chestXray: 'Right upper lobe consolidation with cavitation', sputumAFB: 'AFB+++ (Growth: M. tuberculosis — RIF sensitive)',
    status: 'On DOTS', medications: ['Isoniazid 300mg OD', 'Rifampicin 450mg OD', 'Pyrazinamide 1500mg OD', 'Ethambutol 1000mg OD', 'Pyridoxine 25mg OD'],
    doctor: 'Dr. Priscilla Wiafe', followUp: '2026-09-24 (1 month)', notes: 'Phase 1 — Intensive phase. DOTS directly observed. Contact tracing done. Household contacts screened. Weight 62kg.'
  },
  {
    id: 'PULMO-004', name: 'Efua Nyarko', age: 28, gender: 'Female', mrn: 'MRN-2026-0976', visitDate: '2026-08-24',
    chiefComplaint: 'Recurrent wheeze — worse at night',
    condition: 'Bronchial Asthma (Mild Intermittent)', spirometry: { fev1: 88, fvc: 92, fev1fvc: 95, pef: 420 },
    oxygenSat: 98, respiratoryRate: 14, chestXray: 'Normal',
    status: 'Stable', medications: ['Salbutamol 100mcg MDI PRN', 'Beclometasone 200mcg OD (seasonal)'],
    doctor: 'Dr. Priscilla Wiafe', followUp: '2026-11-24 (3 months)', notes: 'Mild intermittent asthma. Good control. Salbutamol <2 times/week. Written asthma action plan provided.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'New': 'bg-blue-100 text-blue-800', 'Follow-up': 'bg-yellow-100 text-yellow-800',
  'Under Treatment': 'bg-purple-100 text-purple-800', 'On DOTS': 'bg-green-100 text-green-800',
};

function getSpirometryGrade(fev1: number): string {
  if (fev1 >= 80) return 'Mild';
  if (fev1 >= 65) return 'Moderate';
  if (fev1 >= 50) return 'Moderately Severe';
  if (fev1 >= 35) return 'Severe';
  return 'Very Severe';
}

export default function PulmonologyClinic() {
  const [selected, setSelected] = useState<PulmoPatient | null>(PULMO_PATIENTS[0] ?? null);

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
          title="Add New Pulmonology Record"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","placeholder":"e.g. Akua Mensah","required":true},{"name":"condition","label":"Condition","type":"select","options":["Asthma","COPD","Pneumonia","TB","Bronchitis","Lung Cancer","Other"]},{"name":"spo2","label":"SpO2 (%)","type":"number"},{"name":"notes","label":"Clinical Notes","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div>
        <h1 className="text-2xl font-bold">Pulmonology Clinic</h1>
        <p className="text-gray-500">Lung function testing, spirometry, TB management, and respiratory diseases</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Patients Today', value: PULMO_PATIENTS.length, color: 'text-blue-600' },
          { label: 'On DOTS (TB)', value: PULMO_PATIENTS.filter(p => p.status === 'On DOTS').length, color: 'text-green-600' },
          { label: 'COPD/Asthma', value: PULMO_PATIENTS.filter(p => p.condition.includes('COPD') || p.condition.includes('Asthma')).length, color: 'text-purple-600' },
          { label: 'Low SpO2', value: PULMO_PATIENTS.filter(p => p.oxygenSat < 94).length, color: 'text-red-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {PULMO_PATIENTS.map(p => (
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
                  <div className={`text-lg font-bold ${p.oxygenSat < 94 ? 'text-red-600' : 'text-green-600'}`}>SpO2 {p.oxygenSat}%</div>
                  <div className="text-xs text-gray-400">FEV1 {p.spirometry.fev1}%</div>
                </div>
              </div>
              {p.sputumAFB && (
                <div className="mt-2 bg-red-50 rounded p-2 text-xs text-red-700">🔬 {p.sputumAFB}</div>
              )}
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

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className={`rounded p-2 ${selected.oxygenSat < 94 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  <div className="text-lg font-bold">{selected.oxygenSat}%</div>
                  <div className="text-[10px]">SpO2</div>
                </div>
                <div className="bg-blue-50 text-blue-600 rounded p-2">
                  <div className="text-lg font-bold">{selected.respiratoryRate}</div>
                  <div className="text-[10px]">RR (/min)</div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Spirometry</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-gray-50 rounded p-2 text-center">
                    <div className="font-bold">{selected.spirometry.fev1}%</div>
                    <div className="text-[10px] text-gray-500">FEV1</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2 text-center">
                    <div className="font-bold">{selected.spirometry.fvc}%</div>
                    <div className="text-[10px] text-gray-500">FVC</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2 text-center">
                    <div className="font-bold">{selected.spirometry.fev1fvc}%</div>
                    <div className="text-[10px] text-gray-500">FEV1/FVC</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2 text-center">
                    <div className="font-bold">{selected.spirometry.pef}</div>
                    <div className="text-[10px] text-gray-500">PEF (L/min)</div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-1">Severity: {getSpirometryGrade(selected.spirometry.fev1)}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Chest X-ray</div>
                <div className="bg-gray-50 rounded p-2 text-xs">{selected.chestXray}</div>
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
