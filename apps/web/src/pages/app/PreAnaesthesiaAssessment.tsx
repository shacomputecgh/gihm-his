import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface PreOpAssessment {
  id: string;
  patientName: string;
  age: number;
  gender: string;
  mrn: string;
  surgery: string;
  surgeon: string;
  scheduledDate: string;
  anaesthetist: string;
  asaClass: 1 | 2 | 3 | 4 | 5 | 6;
  mallampati: 'I' | 'II' | 'III' | 'IV';
  airway: string;
  bmi: number;
  allergies: string[];
  medications: string[];
  comorbidities: string[];
  npo: boolean;
  npoHours: number;
  hb: number;
  platelets: number;
  creatinine: number;
  ecg: string;
  chestXray: string;
  status: 'Pending' | 'Approved' | 'Conditional' | 'Cancelled';
  riskFactors: string[];
  anaesthesiaPlan: string;
  consentObtained: boolean;
  notes: string;
}

const ASA_CLASSES = {
  1: { label: 'ASA I — Normal', color: 'bg-green-100 text-green-800', desc: 'Normal healthy patient' },
  2: { label: 'ASA II — Mild', color: 'bg-blue-100 text-blue-800', desc: 'Mild systemic disease' },
  3: { label: 'ASA III — Severe', color: 'bg-yellow-100 text-yellow-800', desc: 'Severe systemic disease' },
  4: { label: 'ASA IV — Life-threat', color: 'bg-orange-100 text-orange-800', desc: 'Life-threatening systemic disease' },
  5: { label: 'ASA V — Moribund', color: 'bg-red-100 text-red-800', desc: 'Moribund, not expected to survive' },
  6: { label: 'ASA VI — Brain dead', color: 'bg-red-100 text-red-800', desc: 'Brain-dead organ donor' },
};

const ASSESSMENTS: PreOpAssessment[] = [
  {
    id: 'PA-001', patientName: 'Kwame Mensah', age: 67, gender: 'Male', mrn: 'MRN-2026-0845',
    surgery: 'Laparoscopic Cholecystectomy', surgeon: 'Dr. Kwame Asante', scheduledDate: '2026-08-25',
    anaesthetist: 'Dr. Efua Darko', asaClass: 3, mallampati: 'II', airway: 'Normal — Mallampati II, Mouth opening >3cm, Thyromental distance >6cm',
    bmi: 28.5, allergies: ['Penicillin'], medications: ['Amlodipine 10mg OD', 'Metformin 850mg BD', 'Aspirin 75mg OD'],
    comorbidities: ['Hypertension', 'Type 2 DM', 'Obesity'], npo: true, npoHours: 12,
    hb: 12.8, platelets: 245, creatinine: 1.2, ecg: 'Normal sinus rhythm', chestXray: 'Normal',
    status: 'Approved', riskFactors: ['Age >65', 'BMI >28', 'Metformin — stop 24h pre-op', 'Aspirin — discuss with surgeon'],
    anaesthesiaPlan: 'General Anaesthesia (Total IV Anaesthesia with Propofol/Remifentanil)', consentObtained: true,
    notes: 'Metformin to be stopped 24h before surgery. Blood glucose monitoring intra-op. Aspirin to continue per surgeon.'
  },
  {
    id: 'PA-002', patientName: 'Akua Boateng', age: 45, gender: 'Female', mrn: 'MRN-2026-0890',
    surgery: 'Emergency Caesarean Section', surgeon: 'Dr. Priscilla Wiafe', scheduledDate: '2026-08-24',
    anaesthetist: 'Dr. Yaw Boateng', asaClass: 2, mallampati: 'I', airway: 'Normal — Mallampati I, Good mouth opening',
    bmi: 32.1, allergies: [], medications: ['Iron supplementation', 'Folic acid'],
    comorbidities: ['Pregnancy 38 weeks', 'Obesity'], npo: false, npoHours: 0,
    hb: 10.2, platelets: 198, creatinine: 0.8, ecg: 'Normal sinus rhythm, left axis deviation', chestXray: 'Not indicated',
    status: 'Approved', riskFactors: ['Emergency surgery', 'Obesity', 'Haemoglobin <11', 'Aspiration risk'],
    anaesthesiaPlan: 'Spinal Anaesthesia (Intrathecal Bupivacaine 0.5% Heavy 12.5mg + Fentanyl 15mcg)', consentObtained: true,
    notes: 'Blood cross-match 2 units. Wedge under right hip. Awake baby. IV access 2 large bore cannulae.'
  },
  {
    id: 'PA-003', patientName: 'Kofi Asante', age: 72, gender: 'Male', mrn: 'MRN-2026-0870',
    surgery: 'Open Prostatectomy (TURP)', surgeon: 'Dr. Kwame Asante', scheduledDate: '2026-08-26',
    anaesthetist: 'Dr. Efua Darko', asaClass: 3, mallampati: 'III', airway: 'Potential difficult airway — Mallampati III, limited neck extension',
    bmi: 26.0, allergies: ['Sulfa drugs', 'Iodine'], medications: ['Tamsulosin 0.4mg OD', 'Atorvastatin 20mg ON', 'Omeprazole 20mg OD'],
    comorbidities: ['Benign prostatic hyperplasia', 'Hyperlipidaemia', 'GERD'], npo: true, npoHours: 14,
    hb: 13.5, platelets: 180, creatinine: 1.6, ecg: 'Left ventricular hypertrophy', chestXray: 'Mild cardiomegaly',
    status: 'Conditional', riskFactors: ['Age >70', 'Mallampati III', 'Elevated creatinine', 'TURP syndrome risk', 'Difficult airway'],
    anaesthesiaPlan: 'Spinal Anaesthesia preferred. General anaesthesia if spinal contraindicated.', consentObtained: true,
    notes: 'Stop Tamsulosin 7 days pre-op. Monitor for TURP syndrome. CVP monitoring. Strict fluid balance. TURP irrigation fluid on standby.'
  },
  {
    id: 'PA-004', patientName: 'Ama Dadzie', age: 58, gender: 'Female', mrn: 'MRN-2026-0880',
    surgery: 'Right Total Hip Replacement', surgeon: 'Dr. Akua Mensah', scheduledDate: '2026-08-27',
    anaesthetist: 'Dr. Priscilla Wiafe', asaClass: 2, mallampati: 'I', airway: 'Normal — Mallampati I, Full neck extension',
    bmi: 24.8, allergies: [], medications: ['Ibuprofen 400mg TDS', 'Paracetamol 1g QDS'],
    comorbidities: ['Osteoarthritis — Right hip'], npo: true, npoHours: 10,
    hb: 13.2, platelets: 220, creatinine: 0.9, ecg: 'Normal', chestXray: 'Normal',
    status: 'Pending', riskFactors: ['Post-op DVT risk', 'Blood loss risk', 'Positioning requirements'],
    anaesthesiaPlan: 'Spinal Anaesthesia with subarachnoid block to T10', consentObtained: false,
    notes: 'Thromboprophylaxis plan needed. Positioning for spinal. Cell saver on standby. Check AMH.'
  },
  {
    id: 'PA-005', patientName: 'Efua Nyarko', age: 29, gender: 'Female', mrn: 'MRN-2026-0895',
    surgery: 'Appendicectomy (Laparoscopic)', surgeon: 'Dr. Kwame Asante', scheduledDate: '2026-08-24',
    anaesthetist: 'Dr. Yaw Boateng', asaClass: 1, mallampati: 'I', airway: 'Normal — Mallampati I, Excellent airway',
    bmi: 22.3, allergies: [], medications: [],
    comorbidities: [], npo: true, npoHours: 8,
    hb: 12.5, platelets: 280, creatinine: 0.7, ecg: 'Normal', chestXray: 'Normal',
    status: 'Approved', riskFactors: [],
    anaesthesiaPlan: 'General Anaesthesia — Rapid Sequence Induction (RSI)', consentObtained: true,
    notes: 'Straightforward case. Standard RSI. Post-op pain management: PCA with morphine.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-800', Approved: 'bg-green-100 text-green-800',
  Conditional: 'bg-orange-100 text-orange-800', Cancelled: 'bg-red-100 text-red-800',
};

export default function PreAnaesthesiaAssessment() {
  const [selected, setSelected] = useState<PreOpAssessment | null>(ASSESSMENTS[0] ?? null);
  const [filterStatus, setFilterStatus] = useState('All');

  const filtered = ASSESSMENTS.filter(a => filterStatus === 'All' || a.status === filterStatus);

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
          title="Add New Pre-Anaesthesia Record"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","required":true},{"name":"surgery","label":"Planned Surgery","type":"text"},{"name":"asaGrade","label":"ASA Grade","type":"select","options":["ASA I","ASA II","ASA III","ASA IV","ASA V"]},{"name":"anaesthesiaType","label":"Anaesthesia Type","type":"select","options":["General","Spinal","Epidural","Local","Regional"]},{"name":"airwayAssessment","label":"Airway Assessment","type":"select","options":["Mallampati I","Mallampati II","Mallampati III","Mallampati IV"]},{"name":"allergies","label":"Allergies","type":"text"},{"name":"notes","label":"Notes","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div>
        <h1 className="text-2xl font-bold">Pre-Anaesthesia Assessment</h1>
        <p className="text-gray-500">Pre-operative fitness assessment, ASA classification, and anaesthesia planning</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Assessments', value: ASSESSMENTS.length, color: 'text-blue-600' },
          { label: 'Approved', value: ASSESSMENTS.filter(a => a.status === 'Approved').length, color: 'text-green-600' },
          { label: 'Conditional', value: ASSESSMENTS.filter(a => a.status === 'Conditional').length, color: 'text-orange-600' },
          { label: 'Pending', value: ASSESSMENTS.filter(a => a.status === 'Pending').length, color: 'text-yellow-600' },
          { label: 'Consent Obtained', value: ASSESSMENTS.filter(a => a.consentObtained).length, color: 'text-purple-600' },
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
          {filtered.map(a => (
            <div key={a.id} onClick={() => setSelected(a)}
              className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${
                selected?.id === a.id ? 'border-blue-500 shadow-md' : ''
              }`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{a.patientName}</span>
                    <Badge className={`text-[10px] ${STATUS_STYLES[a.status]}`}>{a.status}</Badge>
                    <Badge className={`text-[10px] ${ASA_CLASSES[a.asaClass].color}`}>ASA {a.asaClass}</Badge>
                  </div>
                  <div className="text-sm text-gray-500">{a.surgery} — {a.surgeon}</div>
                  <div className="text-xs text-gray-400 mt-1">Anaesthetist: {a.anaesthetist} | Date: {a.scheduledDate}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Mallampati</div>
                  <div className="font-bold text-lg">{a.mallampati}</div>
                </div>
              </div>
              <div className="flex gap-1 mt-2 flex-wrap">
                {a.comorbidities.map(c => <Badge key={c} className="text-[10px] bg-orange-100 text-orange-700">{c}</Badge>)}
                {a.allergies.map(al => <Badge key={al} className="text-[10px] bg-red-100 text-red-700">⚠️ {al}</Badge>)}
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          {selected && (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div>
                <h2 className="font-bold text-lg">{selected.patientName}</h2>
                <p className="text-sm text-gray-500">{selected.age}y {selected.gender} — {selected.mrn}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                <div><span className="text-gray-500">Surgery:</span> <span className="font-semibold">{selected.surgery}</span></div>
                <div><span className="text-gray-500">Date:</span> {selected.scheduledDate}</div>
                <div><span className="text-gray-500">Surgeon:</span> {selected.surgeon}</div>
                <div><span className="text-gray-500">Anaesthetist:</span> {selected.anaesthetist}</div>
                <div><span className="text-gray-500">Consent:</span> {selected.consentObtained ? '✅ Obtained' : '❌ Not yet'}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">ASA Classification</div>
                <div className={`rounded-lg p-3 ${ASA_CLASSES[selected.asaClass].color}`}>
                  <div className="font-bold">{ASA_CLASSES[selected.asaClass].label}</div>
                  <div className="text-xs">{ASA_CLASSES[selected.asaClass].desc}</div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Airway Assessment</div>
                <div className="bg-blue-50 rounded-lg p-3 text-sm">{selected.airway}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">BMI:</span> {selected.bmi}</div>
                <div><span className="text-gray-500">NPO:</span> {selected.npoHours}h</div>
                <div><span className="text-gray-500">Hb:</span> {selected.hb} g/dL</div>
                <div><span className="text-gray-500">Platelets:</span> {selected.platelets}</div>
                <div><span className="text-gray-500">Creatinine:</span> {selected.creatinine}</div>
                <div><span className="text-gray-500">ECG:</span> {selected.ecg}</div>
              </div>

              {selected.riskFactors.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-orange-700 mb-1">Risk Factors</div>
                  {selected.riskFactors.map((r, i) => (
                    <div key={i} className="text-xs text-orange-600">⚠️ {r}</div>
                  ))}
                </div>
              )}

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Anaesthesia Plan</div>
                <div className="bg-purple-50 rounded-lg p-3 text-sm text-purple-800">{selected.anaesthesiaPlan}</div>
              </div>

              <div className="text-xs text-gray-400 italic">{selected.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
