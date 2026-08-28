import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface OrthoPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  mrn: string;
  visitDate: string;
  chiefComplaint: string;
  fracture?: string;
  joint?: string;
  imaging: string;
  diagnosis: string[];
  status: 'New' | 'Follow-up' | 'Post-Op' | 'Rehabilitation';
  treatmentPlan: string;
  doctor: string;
  followUp: string;
  prosthesis?: string;
  notes: string;
}

const ORTHO_PATIENTS: OrthoPatient[] = [
  {
    id: 'ORTHO-001', name: 'Kwame Mensah', age: 67, gender: 'Male', mrn: 'MRN-2026-0930', visitDate: '2026-08-24',
    chiefComplaint: 'Right hip pain — 6 months, difficulty walking',
    joint: 'Right Hip', imaging: 'X-ray: Severe OA right hip — joint space narrowing, osteophytes, subchondral sclerosis',
    diagnosis: ['Osteoarthritis — Right Hip (Severe)'],
    status: 'New', treatmentPlan: 'Total Hip Replacement (posterior approach), physiotherapy pre-op, blood cross-match',
    doctor: 'Dr. Kwame Asante', followUp: '2026-08-27 (pre-op assessment)', prosthesis: 'Cementless Titanium stem + Polyethylene cup',
    notes: 'Harris Hip Score: 42/100. X-ray shows bone-on-bone. Failed conservative management. Scheduled for THR.'
  },
  {
    id: 'ORTHO-002', name: 'Ama Dadzie', age: 34, gender: 'Female', mrn: 'MRN-2026-0932', visitDate: '2026-08-24',
    chiefComplaint: 'Road traffic accident — left leg, 3 hours ago',
    fracture: 'Left Tibial Shaft (closed, transverse)', joint: 'Left Ankle/Knee',
    imaging: 'X-ray: Transverse fracture of left tibial shaft at mid-third. No fibular fracture. Ankle/knee joints congruent.',
    diagnosis: ['Closed Tibial Shaft Fracture — Left (AO/OTA 42-A2)'],
    status: 'New', treatmentPlan: 'Intramedullary nailing (IMN), fasciotomy monitoring, DVT prophylaxis',
    doctor: 'Dr. Kwame Asante', followUp: '2026-08-25 (post-op)', notes: 'RTA — motorbike. Open wound 2cm. Neurovascular status intact. swelling moderate.'
  },
  {
    id: 'ORTHO-003', name: 'Kofi Asare', age: 72, gender: 'Male', mrn: 'MRN-2026-0934', visitDate: '2026-08-24',
    chiefComplaint: 'Right knee pain — 2 years, now severe, unable to climb stairs',
    joint: 'Right Knee', imaging: 'X-ray: Grade 4 OA right knee — complete loss of medial joint space, varus deformity 8°',
    diagnosis: ['Osteoarthritis — Right Knee (Grade 4)', 'Varus Malalignment'],
    status: 'New', treatmentPlan: 'Total Knee Replacement (cemented), osteotomy if indicated',
    doctor: 'Dr. Kwame Asante', followUp: '2026-09-03 (pre-op)', prosthesis: 'Cemented Knee System (PFC Sigma)',
    notes: 'KSS Score: 35. Failed physiotherapy, weight loss, and NSAIDs. BMI 31 — counsel on weight loss pre-op.'
  },
  {
    id: 'ORTHO-004', name: 'Efua Nyarko', age: 55, gender: 'Female', mrn: 'MRN-2026-0936', visitDate: '2026-08-24',
    chiefComplaint: 'Left shoulder pain — 4 months, unable to lift arm',
    joint: 'Left Shoulder', imaging: 'MRI: Supraspinatus tendon tear (full thickness), subacromial bursitis',
    diagnosis: ['Full-Thickness Rotator Cuff Tear — Left Supraspinatus', 'Subacromial Bursitis'],
    status: 'New', treatmentPlan: 'Arthroscopic rotator cuff repair, post-op physiotherapy program',
    doctor: 'Dr. Kwame Asante', followUp: '2026-09-07 (2 weeks)', notes: 'Failed conservative management with physiotherapy for 3 months. MRI confirms complete tear.'
  },
  {
    id: 'ORTHO-005', name: 'Nana Kuffour', age: 8, gender: 'Male', mrn: 'MRN-2026-0938', visitDate: '2026-08-24',
    chiefComplaint: 'Fell from tree — right arm, 2 hours ago',
    fracture: 'Right Radius/Ulna (displaced, closed)', joint: 'Right Elbow/Forearm',
    imaging: 'X-ray: Displaced fractures of right radius and ulna mid-shaft. Dislocation of distal radioulnar joint (Galeazzi variant).',
    diagnosis: ['Displaced Forearm Fractures — Right Radius & Ulna', 'Galeazzi-equivalent Fracture-Dislocation'],
    status: 'New', treatmentPlan: 'Closed reduction under GA, casting if aligned; ORIF if not',
    doctor: 'Dr. Kwame Asante', followUp: '2026-08-25 (post-reduction X-ray)', notes: 'Paediatric patient — preserve growth plates. Try closed reduction first. Plaster of Paris slab.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'New': 'bg-blue-100 text-blue-800', 'Follow-up': 'bg-yellow-100 text-yellow-800',
  'Post-Op': 'bg-green-100 text-green-800', 'Rehabilitation': 'bg-purple-100 text-purple-800',
};

export default function OrthopaedicsClinic() {
  const [selected, setSelected] = useState<OrthoPatient | null>(ORTHO_PATIENTS[0] ?? null);
  const [filterStatus, setFilterStatus] = useState('All');

  const filtered = ORTHO_PATIENTS.filter(p => filterStatus === 'All' || p.status === filterStatus);
  const emergencyCount = ORTHO_PATIENTS.filter(p => p.notes.includes('RTA') || p.notes.includes('motorbike')).length;

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
          title="Add New Orthopaedics Record"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","placeholder":"e.g. Nana Osei","required":true},{"name":"injury","label":"Injury/Condition","type":"select","options":["Fracture","Dislocation","Sprain","Back Pain","Joint Pain","Arthritis","Other"]},{"name":"bodyPart","label":"Body Part","type":"text"},{"name":"xray","label":"X-Ray Findings","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div>
        <h1 className="text-2xl font-bold">Orthopaedics Clinic</h1>
        <p className="text-gray-500">Bone & joint management, fracture care, arthroplasty, and rehabilitation</p>
      </div>

      {emergencyCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <span className="text-red-600 text-xl">🚑</span>
          <div>
            <div className="font-semibold text-red-800">{emergencyCount > 1 ? `${emergencyCount} Trauma Cases` : `${emergencyCount} Trauma Case`}</div>
            <div className="text-sm text-red-600">Road traffic accident patients requiring urgent surgical planning</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Patients Today', value: ORTHO_PATIENTS.length, color: 'text-blue-600' },
          { label: 'Fractures', value: ORTHO_PATIENTS.filter(p => p.fracture).length, color: 'text-red-600' },
          { label: 'Joint Replacements', value: ORTHO_PATIENTS.filter(p => p.prosthesis).length, color: 'text-green-600' },
          { label: 'Trauma', value: emergencyCount, color: 'text-orange-600' },
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
                {p.fracture && <Badge className="text-[10px] bg-red-100 text-red-800">🦴 Fracture</Badge>}
                {p.prosthesis && <Badge className="text-[10px] bg-green-100 text-green-800">🦿 {p.prosthesis.split(' ')[0]}</Badge>}
              </div>
              <div className="flex gap-1 mt-2 flex-wrap">
                {p.joint && <Badge className="text-[10px] bg-sky-100 text-sky-700">{p.joint}</Badge>}
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

              {selected.fracture && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-red-700">🦴 Fracture</div>
                  <div className="text-sm text-red-600">{selected.fracture}</div>
                </div>
              )}

              {selected.joint && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-blue-700">Joint Affected</div>
                  <div className="text-sm text-blue-600">{selected.joint}</div>
                </div>
              )}

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Imaging</div>
                <div className="bg-gray-50 rounded p-2 text-xs">{selected.imaging}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Diagnosis</div>
                {selected.diagnosis.map((d, i) => (
                  <Badge key={i} className="text-xs bg-orange-100 text-orange-800 mr-1 mb-1">{d}</Badge>
                ))}
              </div>

              {selected.prosthesis && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-green-700">🦿 Prosthesis</div>
                  <div className="text-sm text-green-600">{selected.prosthesis}</div>
                </div>
              )}

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
