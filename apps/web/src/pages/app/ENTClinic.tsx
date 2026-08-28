import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface ENTPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  mrn: string;
  visitDate: string;
  chiefComplaint: string;
  examination: { ears: string; nose: string; throat: string; neck: string };
  hearingTest: { right: string; left: string };
  diagnosis: string[];
  status: 'New' | 'Follow-up' | 'Post-Op' | 'Under Treatment';
  treatmentPlan: string;
  doctor: string;
  followUp: string;
  notes: string;
}

const ENT_PATIENTS: ENTPatient[] = [
  {
    id: 'ENT-001', name: 'Kwame Asante', age: 45, gender: 'Male', mrn: 'MRN-2026-0910', visitDate: '2026-08-24',
    chiefComplaint: 'Right ear hearing loss — 3 months',
    examination: { ears: 'R: Wax impaction, dull TM. L: Normal TM, light reflex present', nose: 'Mild septal deviation left', throat: 'Oropharynx normal, tonsils 1+', neck: 'No lymphadenopathy' },
    hearingTest: { right: 'Moderate conductive loss (40dB)', left: 'Normal (15dB)' },
    diagnosis: ['Cerumen Impaction — Right Ear', 'Mild Sensorineural Hearing Loss — Right'],
    status: 'New', treatmentPlan: 'Cerumen removal, audiogram referral, hearing aid assessment',
    doctor: 'Dr. Yaw Boateng', followUp: '2026-09-07 (2 weeks)', notes: 'Patient works in noisy factory. Noises exposure history needed.'
  },
  {
    id: 'ENT-002', name: 'Akua Mensah', age: 32, gender: 'Female', mrn: 'MRN-2026-0912', visitDate: '2026-08-24',
    chiefComplaint: 'Recurrent sore throat — 6 months, 4 episodes',
    examination: { ears: 'Bilateral TMs normal', nose: 'Normal anterior rhinoscopy', throat: 'Tonsils 3+ bilateral, cobblestoning posterior pharynx', neck: '2cm anterior cervical lymph node right' },
    hearingTest: { right: 'Normal (15dB)', left: 'Normal (12dB)' },
    diagnosis: ['Chronic Tonsillitis', 'Post-Nasal Drip Syndrome'],
    status: 'New', treatmentPlan: 'Tonsillectomy referral, nasal steroid spray, allergy testing',
    doctor: 'Dr. Yaw Boateng', followUp: '2026-09-14 (3 weeks)', notes: 'Centor score 3. Refer ENT surgeon for tonsillectomy assessment.'
  },
  {
    id: 'ENT-003', name: 'Kofi Boateng', age: 58, gender: 'Male', mrn: 'MRN-2026-0915', visitDate: '2026-08-24',
    chiefComplaint: 'Nasal obstruction — right, 2 months, blood-tinged discharge',
    examination: { ears: 'Normal bilaterally', nose: 'R: Mass filling anterior nares, friable, bleeding on touch. L: Clear.', throat: 'Oropharynx normal', neck: 'Hard 2cm lymph node right submandibular' },
    hearingTest: { right: 'Normal (18dB)', left: 'Normal (16dB)' },
    diagnosis: ['Nasal Polyp — Right (biopsy pending)', 'Suspected Sinonasal Malignancy — Differential'],
    status: 'New', treatmentPlan: 'Urgent biopsy, CT scan paranasal sinuses, oncology referral if malignant',
    doctor: 'Dr. Yaw Boateng', followUp: '2026-08-28 (4 days)', notes: 'URGENT — suspicious mass. Fast-track biopsy and imaging.'
  },
  {
    id: 'ENT-004', name: 'Efua Nyarko', age: 28, gender: 'Female', mrn: 'MRN-2026-0918', visitDate: '2026-08-24',
    chiefComplaint: 'Nasal congestion — seasonal, 5 years',
    examination: { ears: 'Normal', nose: 'Bilateral inferior turbinate hypertrophy, pale mucosa, polypoid changes', throat: 'Normal, cobblestoning', neck: 'No lymphadenopathy' },
    hearingTest: { right: 'Normal (10dB)', left: 'Normal (12dB)' },
    diagnosis: ['Allergic Rhinitis — Moderate Persistent', 'Nasal Polyps — Bilateral'],
    status: 'Follow-up', treatmentPlan: 'Continued intranasal corticosteroids, antihistamines, consider biologics',
    doctor: 'Dr. Yaw Boateng', followUp: '2026-11-24 (3 months)', notes: 'On Fexofenadine 180mg + Fluticasone nasal spray. Improving.'
  },
  {
    id: 'ENT-005', name: 'Nana Kuffour', age: 65, gender: 'Male', mrn: 'MRN-2026-0920', visitDate: '2026-08-24',
    chiefComplaint: 'Hoarseness — 4 weeks, non-smoker',
    examination: { ears: 'Normal', nose: 'Normal', throat: 'Vocal cord — right cord paralysis, left cord compensatory', neck: 'Fullness right thyroid lobe' },
    hearingTest: { right: 'Mild high-freq loss (25dB)', left: 'Normal (18dB)' },
    diagnosis: ['Right Vocal Cord Paralysis', 'Thyroid Nodule — Right (possible recurrence)', 'Recurrent Laryngeal Nerve Palsy'],
    status: 'New', treatmentPlan: 'CT neck/chest, thyroid function, ENT voice therapy, possible surgical intervention',
    doctor: 'Dr. Yaw Boateng', followUp: '2026-09-07 (2 weeks)', notes: 'History of thyroidectomy 5 years ago. Rule out recurrence or metastasis.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'New': 'bg-blue-100 text-blue-800', 'Follow-up': 'bg-yellow-100 text-yellow-800',
  'Post-Op': 'bg-green-100 text-green-800', 'Under Treatment': 'bg-purple-100 text-purple-800',
};

export default function ENTClinic() {
  const [selected, setSelected] = useState<ENTPatient | null>(ENT_PATIENTS[0] ?? null);
  const [filterStatus, setFilterStatus] = useState('All');

  const filtered = ENT_PATIENTS.filter(p => filterStatus === 'All' || p.status === filterStatus);
  const urgentCount = ENT_PATIENTS.filter(p => p.notes.includes('URGENT') || p.notes.includes('Urgent')).length;

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
          title="Add New ENT Record"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","placeholder":"e.g. Akua Mensah","required":true},{"name":"complaint","label":"Chief Complaint","type":"select","options":["Ear Pain","Hearing Loss","Nasal Congestion","Sore Throat","Tinnitus","Vertigo","Other"]},{"name":"examination","label":"Examination Findings","type":"textarea"},{"name":"treatment","label":"Treatment","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div>
        <h1 className="text-2xl font-bold">ENT Clinic</h1>
        <p className="text-gray-500">Ear, Nose, Throat examinations, audiometry, and sinus management</p>
      </div>

      {urgentCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <span className="text-red-600 text-xl">🚨</span>
          <div>
            <div className="font-semibold text-red-800">{urgentCount > 1 ? `${urgentCount} Urgent Cases` : `${urgentCount} Urgent Case`}</div>
            <div className="text-sm text-red-600">Requires urgent biopsy/investigation</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Patients Today', value: ENT_PATIENTS.length, color: 'text-blue-600' },
          { label: 'New Cases', value: ENT_PATIENTS.filter(p => p.status === 'New').length, color: 'text-green-600' },
          { label: 'Follow-ups', value: ENT_PATIENTS.filter(p => p.status === 'Follow-up').length, color: 'text-yellow-600' },
          { label: 'Urgent', value: urgentCount, color: 'text-red-600' },
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
                  </div>
                  <div className="text-sm text-gray-500">{p.chiefComplaint}</div>
                  <div className="text-xs text-gray-400 mt-1">{p.diagnosis.join(' | ')}</div>
                </div>
                <div className="text-right text-xs text-gray-400">
                  <div>Hearing</div>
                  <div>R: {p.hearingTest.right}</div>
                  <div>L: {p.hearingTest.left}</div>
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
                <div><span className="text-gray-500">Complaint:</span> {selected.chiefComplaint}</div>
                <div><span className="text-gray-500">Doctor:</span> {selected.doctor}</div>
                <div><span className="text-gray-500">Follow-up:</span> {selected.followUp}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-2">ENT Examination</div>
                {[
                  { label: '👂 Ears', value: selected.examination.ears },
                  { label: '👃 Nose', value: selected.examination.nose },
                  { label: '🗣️ Throat', value: selected.examination.throat },
                  { label: '📍 Neck', value: selected.examination.neck },
                ].map((item, i) => (
                  <div key={i} className="text-sm mb-1">
                    <span className="font-medium">{item.label}:</span> {item.value}
                  </div>
                ))}
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Audiometry</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center bg-blue-50 rounded p-2">
                    <div className="text-xs text-gray-500">Right Ear</div>
                    <div className="font-bold text-sm">{selected.hearingTest.right}</div>
                  </div>
                  <div className="text-center bg-blue-50 rounded p-2">
                    <div className="text-xs text-gray-500">Left Ear</div>
                    <div className="font-bold text-sm">{selected.hearingTest.left}</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Diagnosis</div>
                {selected.diagnosis.map((d, i) => (
                  <Badge key={i} className="text-xs bg-orange-100 text-orange-800 mr-1 mb-1">{d}</Badge>
                ))}
              </div>

              <div className="bg-purple-50 rounded-lg p-3">
                <div className="text-sm font-medium text-purple-700">Treatment Plan</div>
                <div className="text-sm text-purple-600 mt-1">{selected.treatmentPlan}</div>
              </div>

              <div className="text-xs text-gray-400 italic">{selected.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
