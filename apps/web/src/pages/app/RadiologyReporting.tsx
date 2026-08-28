import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface RadiologyReport {
  id: string; patientName: string; age: number; gender: string; mrn: string;
  study: string; bodyPart: string; modality: string;
  clinicalIndication: string; findings: string; impression: string;
  status: 'Ordered' | 'Scheduled' | 'In Progress' | 'Preliminary' | 'Final';
  priority: 'Routine' | 'Urgent' | 'STAT';
  radiologist: string; reportDate: string; notes: string;
}

const REPORTS: RadiologyReport[] = [
  { id: 'RAD-001', patientName: 'Kwame Mensah', age: 67, gender: 'Male', mrn: 'MRN-2026-1130',
    study: 'CT Brain without Contrast', bodyPart: 'Head', modality: 'CT',
    clinicalIndication: 'Acute stroke — left MCA territory, rule out haemorrhage',
    findings: 'No acute intracranial haemorrhage. No mass lesion. Early signs of left MCA infarct with loss of grey-white differentiation in the left insular ribbon and putamen. No midline shift. Ventricles normal. No hydrocephalus.',
    impression: '1. Early left MCA territory ischaemic stroke — no haemorrhage.\n2. No contraindication to thrombolysis.',
    status: 'Final', priority: 'STAT', radiologist: 'Dr. Nana Oforiwaa', reportDate: '2026-08-24 09:00',
    notes: 'Urgent read for thrombolysis decision. Critical findings communicated to referring clinician.'
  },
  { id: 'RAD-002', patientName: 'Akua Boateng', age: 55, gender: 'Female', mrn: 'MRN-2026-1132',
    study: 'Mammography Bilateral', bodyPart: 'Breasts', modality: 'Mammography',
    clinicalIndication: 'Screening mammogram. Previous history of right breast fibroadenoma.',
    findings: 'BREAST DENSITY: Category C — Heterogeneously dense.\nRIGHT: No suspicious mass or microcalcification. Stable calcified fibroadenoma in upper outer quadrant.\nLEFT: No suspicious mass or microcalcification. No architectural distortion.\nAxillae: No suspicious lymphadenopathy.',
    impression: 'BI-RADS 2 — Benign. Stable calcified fibroadenoma right breast. No suspicious findings. Routine screening.',
    status: 'Final', priority: 'Routine', radiologist: 'Dr. Nana Oforiwaa', reportDate: '2026-08-24 10:30',
    notes: 'BI-RADS 2. Return to routine screening in 12 months.'
  },
  { id: 'RAD-003', patientName: 'Kofi Asare', age: 72, gender: 'Male', mrn: 'MRN-2026-1134',
    study: 'CT Chest with Contrast', bodyPart: 'Chest', modality: 'CT',
    clinicalIndication: 'Staging — known lung carcinoma. Assess extent of disease.',
    findings: 'MASS: 4.5 cm spiculated mass in the right upper lobe with mediastinal invasion.\nLYMPH NODES: Multiple enlarged mediastinal and hilar lymph nodes (short axis >1cm). Right paratracheal node 2.8 cm.\nPLEURAL: Small right pleural effusion.\nBONES: Lytic lesion right 5th rib — likely metastatic.\nADRENALS: Right adrenal nodule 2.2 cm — likely metastatic.',
    impression: '1. Right upper lobe lung carcinoma T4N2M1c — Stage IV.\n2. Right rib and adrenal metastases.\n3. Small right pleural effusion.\n4. Recommend PET-CT for further staging. Tissue diagnosis recommended.',
    status: 'Final', priority: 'Urgent', radiologist: 'Dr. Nana Oforiwaa', reportDate: '2026-08-24 11:00',
    notes: 'Staging CT for lung cancer. Critical findings communicated. Recommend PET-CT and biopsy.'
  },
  { id: 'RAD-004', patientName: 'Efua Nyarko', age: 35, gender: 'Female', mrn: 'MRN-2026-1136',
    study: 'MRI Right Knee', bodyPart: 'Knee', modality: 'MRI',
    clinicalIndication: 'Knee pain after sports injury. Suspected meniscal tear.',
    findings: 'Menisci: Complex tear of the posterior horn medial meniscus. Lateral meniscus intact.\nLigaments: ACL intact. PCL intact. MCL intact. LCL intact.\nCartilage: Grade II chondromalacia medial femoral condyle.\nBones: No fracture or bone marrow oedema.\nJoint: Small joint effusion.',
    impression: '1. Complex tear posterior horn medial meniscus.\n2. Grade II chondromalacia medial femoral condyle.\n3. Intact knee ligaments.\n4. Small joint effusion.\nRecommend orthopaedic review for surgical options.',
    status: 'Final', priority: 'Routine', radiologist: 'Dr. Nana Oforiwaa', reportDate: '2026-08-24 14:00',
    notes: 'MRI knee — meniscal tear confirmed. Recommend orthopaedic consultation.'
  },
  { id: 'RAD-005', patientName: 'Nana Kuffour', age: 8, gender: 'Male', mrn: 'MRN-2026-1138',
    study: 'X-Ray Chest PA', bodyPart: 'Chest', modality: 'X-Ray',
    clinicalIndication: 'Cough and fever — 3 days. Rule out pneumonia.',
    findings: 'Heart size normal. Mediastinal contours normal. Trachea central.\nLungs: Patchy consolidation in the right middle lobe with air bronchograms. No pleural effusion. No pneumothorax.\nBones: No fracture.\nSoft tissues: Normal.',
    impression: '1. Right middle lobe pneumonia — clinical correlation recommended.\n2. No pleural effusion or pneumothorax.\nRecommend follow-up chest X-ray in 6 weeks if symptoms persist.',
    status: 'Final', priority: 'Urgent', radiologist: 'Dr. Nana Oforiwaa', reportDate: '2026-08-24 15:00',
    notes: 'Paediatric chest X-ray. Right middle lobe pneumonia. Clinical correlation.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'Ordered': 'bg-blue-100 text-blue-800', 'Scheduled': 'bg-gray-100 text-gray-800',
  'In Progress': 'bg-yellow-100 text-yellow-800', 'Preliminary': 'bg-orange-100 text-orange-800',
  'Final': 'bg-green-100 text-green-800',
};
const PRIORITY_STYLES: Record<string, string> = {
  'Routine': 'bg-gray-100 text-gray-800', 'Urgent': 'bg-orange-100 text-orange-800',
  'STAT': 'bg-red-100 text-red-800',
};

export default function RadiologyReporting() {
  const [selected, setSelected] = useState<RadiologyReport | null>(REPORTS[0] ?? null);
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
          title="Add New Radiology Report"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Radiology Reporting</h1><p className="text-gray-500">Structured imaging reports, PACS integration, and radiologist workflow</p></div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[{ label: 'Reports Today', value: REPORTS.length, color: 'text-blue-600' },
          { label: 'Final', value: REPORTS.filter(r=>r.status==='Final').length, color: 'text-green-600' },
          { label: 'STAT', value: REPORTS.filter(r=>r.priority==='STAT').length, color: 'text-red-600' },
          { label: 'Urgent', value: REPORTS.filter(r=>r.priority==='Urgent').length, color: 'text-orange-600' },
          { label: 'Modalities', value: new Set(REPORTS.map(r=>r.modality)).size, color: 'text-purple-600' },
        ].map((s,i) => <div key={i} className="bg-white rounded-lg border p-3 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {REPORTS.map(r => (
            <div key={r.id} onClick={() => setSelected(r)} className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${selected?.id===r.id?'border-blue-500 shadow-md':''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2"><span className="font-bold">{r.patientName}</span><Badge className={`text-[10px] ${STATUS_STYLES[r.status]}`}>{r.status}</Badge><Badge className={`text-[10px] ${PRIORITY_STYLES[r.priority]}`}>{r.priority}</Badge></div>
                  <div className="text-sm text-gray-500">{r.study}</div>
                  <div className="text-xs text-gray-400 mt-1">{r.clinicalIndication.substring(0, 80)}...</div>
                </div>
                <div className="text-right text-xs text-gray-400"><div>{r.reportDate}</div><div>{r.radiologist}</div></div>
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-1">
          {selected && (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div><h2 className="font-bold text-lg">{selected.patientName}</h2><p className="text-sm text-gray-500">{selected.age}y {selected.gender} — {selected.mrn}</p><p className="text-sm text-blue-600">{selected.study}</p></div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1"><div><span className="text-gray-500">Modality:</span> {selected.modality}</div><div><span className="text-gray-500">Body Part:</span> {selected.bodyPart}</div><div><span className="text-gray-500">Radiologist:</span> {selected.radiologist}</div></div>
              <div className="bg-yellow-50 rounded-lg p-3"><div className="text-sm font-medium text-yellow-700 mb-1">Clinical Indication</div><div className="text-sm text-yellow-600">{selected.clinicalIndication}</div></div>
              <div><div className="text-sm font-medium text-gray-600 mb-1">Findings</div><div className="bg-blue-50 rounded p-2 text-xs whitespace-pre-wrap">{selected.findings}</div></div>
              <div><div className="text-sm font-medium text-gray-600 mb-1">Impression</div><div className="bg-red-50 rounded p-2 text-xs whitespace-pre-wrap font-medium">{selected.impression}</div></div>
              <div className="text-xs text-gray-400 italic">{selected.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
