import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface CardiacPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  mrn: string;
  visitDate: string;
  chiefComplaint: string;
  bp: string;
  heartRate: number;
  rhythm: string;
  ecgFindings: string;
  echoFindings: string;
  cardiacRiskScore: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Very High';
  diagnosis: string[];
  medications: string[];
  status: 'New' | 'Follow-up' | 'Post-Procedure' | 'Under Treatment';
  doctor: string;
  followUp: string;
  notes: string;
}

const CARDIAC_PATIENTS: CardiacPatient[] = [
  {
    id: 'CARD-001', name: 'Kwame Mensah', age: 67, gender: 'Male', mrn: 'MRN-2026-0940', visitDate: '2026-08-24',
    chiefComplaint: 'Chest pain on exertion — 2 weeks, worsens climbing stairs',
    bp: '145/92', heartRate: 78, rhythm: 'Normal Sinus Rhythm',
    ecgFindings: 'Sinus rhythm, ST depression in V4-V6, T-wave inversion lateral leads',
    echoFindings: 'LVEF 45%, anterior wall hypokinesis, mild MR, LVH',
    cardiacRiskScore: 72, riskLevel: 'High',
    diagnosis: ['Unstable Angina', 'Hypertensive Heart Disease', 'Mild LV Systolic Dysfunction'],
    medications: ['Aspirin 75mg OD', 'Atorvastatin 40mg ON', 'Bisoprolol 5mg OD', 'Ramipril 5mg OD', 'GTN PRN'],
    status: 'New', doctor: 'Dr. Efua Darko', followUp: '2026-09-07 (2 weeks)',
    notes: 'CRUSADE score 72 — high risk. Refer for coronary angiography. Troponin negative. Echo shows reduced EF.'
  },
  {
    id: 'CARD-002', name: 'Akua Boateng', age: 55, gender: 'Female', mrn: 'MRN-2026-0942', visitDate: '2026-08-24',
    chiefComplaint: 'Palpitations — 3 months, episodes lasting minutes',
    bp: '128/78', heartRate: 92, rhythm: 'Atrial Fibrillation (paroxysmal)',
    ecgFindings: 'Irregularly irregular rhythm, absent P waves, rapid ventricular response',
    echoFindings: 'LVEF 58%, normal chambers, no valvular disease',
    cardiacRiskScore: 45, riskLevel: 'Moderate',
    diagnosis: ['Paroxysmal Atrial Fibrillation', 'CHADS2-VASc Score 2'],
    medications: ['Apixaban 5mg BD', 'Bisoprolol 5mg OD', 'Atorvastatin 20mg ON'],
    status: 'Follow-up', doctor: 'Dr. Efua Darko', followUp: '2026-10-24 (2 months)',
    notes: 'CHA2DS2-VASc 2 (HTN, female). Rate control strategy. Consider rhythm control if symptomatic.'
  },
  {
    id: 'CARD-003', name: 'Kofi Asare', age: 72, gender: 'Male', mrn: 'MRN-2026-0944', visitDate: '2026-08-24',
    chiefComplaint: 'Heart failure exacerbation — 3 days, increasing breathlessness',
    bp: '110/70', heartRate: 105, rhythm: 'Sinus Tachycardia',
    ecgFindings: 'Sinus tachycardia, left bundle branch block, PVCs',
    echoFindings: 'LVEF 28%, dilated LV (62mm), severe MR, global hypokinesis, RA dilatation',
    cardiacRiskScore: 95, riskLevel: 'Very High',
    diagnosis: ['Chronic Heart Failure (HFrEF — NYHA III)', 'Left Bundle Branch Block', 'Functional MR'],
    medications: ['Furosemide 80mg OD', 'Spironolactone 25mg OD', 'Bisoprolol 1.25mg OD', 'Sacubitril/Valsartan 50mg BD', 'Dapagliflozin 10mg OD'],
    status: 'Under Treatment', doctor: 'Dr. Efua Darko', followUp: '2026-09-07 (1 week)',
    notes: 'Acute decompensation. IV furosemide loading. BNP 1850 pg/mL. Consider CRT-D if QRS >150ms.'
  },
  {
    id: 'CARD-004', name: 'Efua Nyarko', age: 42, gender: 'Female', mrn: 'MRN-2026-0946', visitDate: '2026-08-24',
    chiefComplaint: 'Post-PCI review — stent 6 months ago',
    bp: '122/76', heartRate: 72, rhythm: 'Normal Sinus Rhythm',
    ecgFindings: 'Normal sinus rhythm, no ST changes, no arrhythmia',
    echoFindings: 'LVEF 52%, improved anterior wall motion, mild residual MR',
    cardiacRiskScore: 35, riskLevel: 'Low',
    diagnosis: ['Post-PCI (DES LAD)', 'Stable Coronary Artery Disease'],
    medications: ['Aspirin 75mg OD', 'Clopidogrel 75mg OD (6 months remaining)', 'Atorvastatin 80mg ON', 'Bisoprolol 2.5mg OD'],
    status: 'Post-Procedure', doctor: 'Dr. Efua Darko', followUp: '2027-02-24 (6 months)',
    notes: 'Good recovery post-PCI. Antiplatelet therapy continuing. Lifestyle modifications reinforced.'
  }
];

const RISK_STYLES: Record<string, string> = {
  'Low': 'bg-green-100 text-green-800', 'Moderate': 'bg-yellow-100 text-yellow-800',
  'High': 'bg-orange-100 text-orange-800', 'Very High': 'bg-red-100 text-red-800',
};

const STATUS_STYLES: Record<string, string> = {
  'New': 'bg-blue-100 text-blue-800', 'Follow-up': 'bg-yellow-100 text-yellow-800',
  'Post-Procedure': 'bg-green-100 text-green-800', 'Under Treatment': 'bg-purple-100 text-purple-800',
};

export default function CardiologyClinic() {
  const [selected, setSelected] = useState<CardiacPatient | null>(CARDIAC_PATIENTS[0] ?? null);
  const [filterStatus, setFilterStatus] = useState('All');

  const filtered = CARDIAC_PATIENTS.filter(p => filterStatus === 'All' || p.status === filterStatus);
  const highRiskCount = CARDIAC_PATIENTS.filter(p => p.riskLevel === 'High' || p.riskLevel === 'Very High').length;

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
          title="Add New Cardiology Record"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","placeholder":"e.g. Kwame Asante","required":true},{"name":"diagnosis","label":"Diagnosis","type":"select","options":["Hypertension","Heart Failure","Arrhythmia","Valvular Disease","Chest Pain","Other"]},{"name":"ecgResult","label":"ECG Result","type":"select","options":["Normal","Abnormal","Inconclusive"]},{"name":"bp","label":"Blood Pressure","type":"text","placeholder":"120/80"},{"name":"pulse","label":"Pulse (bpm)","type":"number"},{"name":"notes","label":"Clinical Notes","type":"textarea","placeholder":"Enter clinical notes..."}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div>
        <h1 className="text-2xl font-bold">Cardiology Clinic</h1>
        <p className="text-gray-500">ECG analysis, echocardiography, cardiac risk scoring, and heart failure management</p>
      </div>

      {highRiskCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <span className="text-red-600 text-xl">❤️</span>
          <div>
            <div className="font-semibold text-red-800">{highRiskCount > 1 ? `${highRiskCount} High-Risk Patients` : '1 High-Risk Patient'}</div>
            <div className="text-sm text-red-600">Requires urgent cardiology intervention</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Patients Today', value: CARDIAC_PATIENTS.length, color: 'text-blue-600' },
          { label: 'High Risk', value: highRiskCount, color: 'text-red-600' },
          { label: 'Avg Heart Rate', value: `${Math.round(CARDIAC_PATIENTS.reduce((s, p) => s + p.heartRate, 0) / CARDIAC_PATIENTS.length)}`, color: 'text-pink-600' },
          { label: 'Post-Procedure', value: CARDIAC_PATIENTS.filter(p => p.status === 'Post-Procedure').length, color: 'text-green-600' },
          { label: 'On Anticoagulants', value: CARDIAC_PATIENTS.filter(p => p.medications.some(m => m.includes('Apixaban') || m.includes('Warfarin'))).length, color: 'text-purple-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
        <option value="All">All Status</option>
        {Object.keys(STATUS_STYLES).map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {filtered.map(p => (
            <div key={p.id} onClick={() => setSelected(p)}
              className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${
                selected?.id === p.id ? 'border-blue-500 shadow-md' : ''
              }`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{p.name}</span>
                    <Badge className={`text-[10px] ${STATUS_STYLES[p.status]}`}>{p.status}</Badge>
                    <Badge className={`text-[10px] ${RISK_STYLES[p.riskLevel]}`}>{p.riskLevel} Risk</Badge>
                  </div>
                  <div className="text-sm text-gray-500">{p.chiefComplaint}</div>
                  <div className="text-xs text-gray-400 mt-1">{p.diagnosis.join(' | ')}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-pink-600">{p.heartRate} bpm</div>
                  <div className="text-xs text-gray-400">BP: {p.bp}</div>
                </div>
              </div>
              <div className="flex gap-1 mt-2 flex-wrap">
                <Badge className="text-[10px] bg-gray-100">{p.rhythm}</Badge>
                <Badge className="text-[10px] bg-purple-100 text-purple-700">LVEF {p.echoFindings.match(/LVEF (\d+%)/)?.[1] || 'N/A'}</Badge>
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

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-red-50 rounded p-2">
                  <div className="text-lg font-bold text-red-600">{selected.bp}</div>
                  <div className="text-[10px] text-gray-500">BP (mmHg)</div>
                </div>
                <div className="bg-pink-50 rounded p-2">
                  <div className="text-lg font-bold text-pink-600">{selected.heartRate}</div>
                  <div className="text-[10px] text-gray-500">HR (bpm)</div>
                </div>
                <div className="bg-purple-50 rounded p-2">
                  <div className="text-lg font-bold text-purple-600">{selected.cardiacRiskScore}</div>
                  <div className="text-[10px] text-gray-500">Risk Score</div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-sm font-medium text-blue-700">Rhythm</div>
                <div className="text-sm text-blue-600">{selected.rhythm}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">ECG Findings</div>
                <div className="bg-gray-50 rounded p-2 text-xs">{selected.ecgFindings}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Echocardiography</div>
                <div className="bg-gray-50 rounded p-2 text-xs">{selected.echoFindings}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Diagnosis</div>
                {selected.diagnosis.map((d, i) => (
                  <Badge key={i} className="text-xs bg-orange-100 text-orange-800 mr-1 mb-1">{d}</Badge>
                ))}
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
