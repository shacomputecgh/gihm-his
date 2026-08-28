import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface EyePatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  mrn: string;
  visitDate: string;
  chiefComplaint: string;
  visualAcuity: { rightOD: string; leftOS: string };
  refraction: { right: string; left: string };
  intraocularPressure: { right: number; left: number };
  diagnosis: string[];
  diagnosisStatus: 'New' | 'Follow-up' | 'Post-Op' | 'Under Treatment';
  treatmentPlan: string;
  doctor: string;
  followUp: string;
  notes: string;
}

const EYE_PATIENTS: EyePatient[] = [
  {
    id: 'EYE-001', name: 'Kweku Mensah', age: 72, gender: 'Male', mrn: 'MRN-2026-0901', visitDate: '2026-08-24',
    chiefComplaint: 'Gradual vision loss — right eye, 6 months', visualAcuity: { rightOD: '6/36', leftOS: '6/9' },
    refraction: { right: 'Not improved with glasses', left: '+1.00/-0.50x180' },
    intraocularPressure: { right: 22, left: 18 },
    diagnosis: ['Primary Open-Angle Glaucoma — Right Eye', 'Age-Related Cataract — Right Eye'],
    diagnosisStatus: 'New', treatmentPlan: 'Latanoprost 0.005% OD HS, Timolol 0.5% OD BD, Cataract surgery referral',
    doctor: 'Dr. Akua Mensah', followUp: '2026-09-24 (1 month)', notes: 'CUP 0.7 right, 0.3 left. Visual field shows nasal defect right eye.'
  },
  {
    id: 'EYE-002', name: 'Ama Serwaa', age: 55, gender: 'Female', mrn: 'MRN-2026-0898', visitDate: '2026-08-24',
    chiefComplaint: 'Blurred vision both eyes — diabetes check', visualAcuity: { rightOD: '6/12', leftOS: '6/9' },
    refraction: { right: '-2.00/-0.75x90', left: '-1.50/-0.50x100' },
    intraocularPressure: { right: 16, left: 15 },
    diagnosis: ['Diabetic Retinopathy — NPDR Bilateral', 'Diabetic Macular Oedema — Right Eye'],
    diagnosisStatus: 'Follow-up', treatmentPlan: 'Anti-VEGF injection right eye, HbA1c monitoring, 3-month review',
    doctor: 'Dr. Akua Mensah', followUp: '2026-11-24 (3 months)', notes: 'HbA1c 8.2%. Referred to endocrinology. Last HbA1c 3 months ago was 7.8%.'
  },
  {
    id: 'EYE-003', name: 'Kofi Asare', age: 45, gender: 'Male', mrn: 'MRN-2026-0903', visitDate: '2026-08-24',
    chiefComplaint: 'Red painful right eye — acute onset', visualAcuity: { rightOD: '6/18', leftOS: '6/6' },
    refraction: { right: 'Not tested — pain', left: '-0.50 DS' },
    intraocularPressure: { right: 42, left: 16 },
    diagnosis: ['Acute Angle-Closure Glaucoma — Right Eye'],
    diagnosisStatus: 'New', treatmentPlan: 'Emergency: Timolol 0.5%, Pilocarpine 2%, Acetazolamide 500mg IV, Laser iridotomy',
    doctor: 'Dr. Akua Mensah', followUp: '2026-08-25 (next day)', notes: 'EMERGENCY — shallow anterior chamber, fixed dilated pupil. Urgent laser iridotomy required.'
  },
  {
    id: 'EYE-004', name: 'Nana Adoma', age: 8, gender: 'Female', mrn: 'MRN-2026-0905', visitDate: '2026-08-24',
    chiefComplaint: 'Failed school vision screening', visualAcuity: { rightOD: '6/12', leftOS: '6/18' },
    refraction: { right: '+0.50/-1.00x170', left: '+0.75/-1.25x180' },
    intraocularPressure: { right: 14, left: 14 },
    diagnosis: ['Refractive Error — Myopic Astigmatism Bilateral'],
    diagnosisStatus: 'New', treatmentPlan: 'Spectacle prescription, patching for amblyopia prevention',
    doctor: 'Dr. Akua Mensah', followUp: '2026-10-24 (2 months)', notes: 'No strabismus. Red reflex normal. First pair of glasses.'
  },
  {
    id: 'EYE-005', name: 'Akua Boateng', age: 62, gender: 'Female', mrn: 'MRN-2026-0907', visitDate: '2026-08-24',
    chiefComplaint: 'Post-cataract surgery review — left eye', visualAcuity: { rightOD: '6/24', leftOS: '6/6' },
    refraction: { right: '+2.00/-0.75x100', left: 'Post-IOL: Plano' },
    intraocularPressure: { right: 19, left: 14 },
    diagnosis: ['Post-Op Cataract Surgery (Phaco + IOL) — Left Eye', 'Cataract — Right Eye (scheduled)'],
    diagnosisStatus: 'Post-Op', treatmentPlan: 'Continue post-op drops, schedule right eye cataract surgery',
    doctor: 'Dr. Akua Mensah', followUp: '2026-09-07 (2 weeks)', notes: 'Excellent post-op result. IOL well-positioned. Next week: right eye surgery.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'New': 'bg-blue-100 text-blue-800', 'Follow-up': 'bg-yellow-100 text-yellow-800',
  'Post-Op': 'bg-green-100 text-green-800', 'Under Treatment': 'bg-purple-100 text-purple-800',
};

function getIOPColor(pressure: number): string {
  if (pressure >= 21) return 'text-red-600 bg-red-50';
  if (pressure >= 17) return 'text-yellow-600 bg-yellow-50';
  return 'text-green-600 bg-green-50';
}

export default function OphthalmologyClinic() {
  const [selected, setSelected] = useState<EyePatient | null>(EYE_PATIENTS[0] ?? null);
  const [filterStatus, setFilterStatus] = useState('All');

  const filtered = EYE_PATIENTS.filter(p => filterStatus === 'All' || p.diagnosisStatus === filterStatus);
  const emergencyCount = EYE_PATIENTS.filter(p => p.intraocularPressure.right >= 30 || p.intraocularPressure.left >= 30).length;

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
          title="Add New Eye Record"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","placeholder":"e.g. Efua Nyarko","required":true},{"name":"complaint","label":"Chief Complaint","type":"select","options":["Blurred Vision","Eye Pain","Red Eye","Cataract","Glaucoma","Retinal Issue","Other"]},{"name":"visualAcuity","label":"Visual Acuity","type":"text","placeholder":"6/6, 6/12, etc."},{"name":"notes","label":"Notes","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div>
        <h1 className="text-2xl font-bold">Ophthalmology Clinic</h1>
        <p className="text-gray-500">Eye examination, vision testing, intraocular pressure, and glaucoma management</p>
      </div>

      {emergencyCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <span className="text-red-600 text-xl">🚨</span>
          <div>
            <div className="font-semibold text-red-800">{emergencyCount > 1 ? `${emergencyCount} Emergency Cases` : `${emergencyCount} Emergency Case`}</div>
            <div className="text-sm text-red-600">Acute glaucoma requiring urgent intervention</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Patients Today', value: EYE_PATIENTS.length, color: 'text-blue-600' },
          { label: 'New Cases', value: EYE_PATIENTS.filter(p => p.diagnosisStatus === 'New').length, color: 'text-green-600' },
          { label: 'Post-Op Reviews', value: EYE_PATIENTS.filter(p => p.diagnosisStatus === 'Post-Op').length, color: 'text-purple-600' },
          { label: 'Emergencies', value: emergencyCount, color: 'text-red-600' },
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
                    <Badge className={`text-[10px] ${STATUS_STYLES[p.diagnosisStatus]}`}>{p.diagnosisStatus}</Badge>
                  </div>
                  <div className="text-sm text-gray-500">{p.chiefComplaint}</div>
                  <div className="text-xs text-gray-400 mt-1">{p.diagnosis.join(' | ')}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">IOP (OD/OS)</div>
                  <div className="flex gap-1">
                    <span className={`text-sm font-bold px-2 rounded ${getIOPColor(p.intraocularPressure.right)}`}>{p.intraocularPressure.right}</span>
                    <span className={`text-sm font-bold px-2 rounded ${getIOPColor(p.intraocularPressure.left)}`}>{p.intraocularPressure.left}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                <div className="bg-blue-50 rounded p-2 text-center">
                  <div className="text-gray-500">Right Eye (OD)</div>
                  <div className="font-bold">{p.visualAcuity.rightOD}</div>
                </div>
                <div className="bg-blue-50 rounded p-2 text-center">
                  <div className="text-gray-500">Left Eye (OS)</div>
                  <div className="font-bold">{p.visualAcuity.leftOS}</div>
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
                <div><span className="text-gray-500">Date:</span> {selected.visitDate}</div>
                <div><span className="text-gray-500">Doctor:</span> {selected.doctor}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Visual Acuity</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center bg-blue-50 rounded p-3">
                    <div className="text-xs text-gray-500">Right (OD)</div>
                    <div className="text-xl font-bold text-blue-600">{selected.visualAcuity.rightOD}</div>
                  </div>
                  <div className="text-center bg-blue-50 rounded p-3">
                    <div className="text-xs text-gray-500">Left (OS)</div>
                    <div className="text-xl font-bold text-blue-600">{selected.visualAcuity.leftOS}</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Intraocular Pressure</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`text-center rounded p-3 ${getIOPColor(selected.intraocularPressure.right)}`}>
                    <div className="text-xs">Right (OD)</div>
                    <div className="text-xl font-bold">{selected.intraocularPressure.right} mmHg</div>
                  </div>
                  <div className={`text-center rounded p-3 ${getIOPColor(selected.intraocularPressure.left)}`}>
                    <div className="text-xs">Left (OS)</div>
                    <div className="text-xl font-bold">{selected.intraocularPressure.left} mmHg</div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-1">Normal: 10-21 mmHg</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Refraction</div>
                <div className="text-sm bg-gray-50 rounded p-2">
                  <div>OD: {selected.refraction.right}</div>
                  <div>OS: {selected.refraction.left}</div>
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

              <div className="text-xs text-gray-400">
                <div>Follow-up: {selected.followUp}</div>
                <div className="mt-1 italic">{selected.notes}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
