import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface DermPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  mrn: string;
  visitDate: string;
  chiefComplaint: string;
  lesionCount: number;
  bodyAreas: string[];
  diagnosis: string[];
  status: 'New' | 'Follow-up' | 'Under Treatment' | 'Resolved';
  treatmentPlan: string;
  doctor: string;
  followUp: string;
  notes: string;
}

const DERM_PATIENTS: DermPatient[] = [
  {
    id: 'DERM-001', name: 'Akua Boateng', age: 35, gender: 'Female', mrn: 'MRN-2026-0921', visitDate: '2026-08-24',
    chiefComplaint: 'Recurrent skin rash — both arms, 2 weeks',
    lesionCount: 15, bodyAreas: ['Bilateral forearms', 'Dorsal hands'],
    diagnosis: ['Allergic Contact Dermatitis', 'Nickel Allergy (confirmed by patch test)'],
    status: 'Under Treatment', treatmentPlan: 'Clobetasol propionate 0.05% cream BD x 2 weeks, emollients, avoid nickel-containing jewellery',
    doctor: 'Dr. Akua Mensah', followUp: '2026-09-07 (2 weeks)', notes: 'Patch test positive for nickel. Patient works as caterer — metal utensils suspected trigger.'
  },
  {
    id: 'DERM-002', name: 'Kofi Mensah', age: 58, gender: 'Male', mrn: 'MRN-2026-0923', visitDate: '2026-08-24',
    chiefComplaint: 'Scaly plaque — left shin, 6 months, growing',
    lesionCount: 3, bodyAreas: ['Left shin (primary)', 'Right shin', 'Left forearm'],
    diagnosis: ['Plaque Psoriasis — Moderate', 'Psoriatic Arthritis (r/o — referred to Rheumatology)'],
    status: 'New', treatmentPlan: 'Betamethasone dipropionate cream, Vitamin D analogue, systemic therapy referral if not controlled',
    doctor: 'Dr. Akua Mensah', followUp: '2026-09-21 (4 weeks)', notes: 'PASI score 12.4. Joint pains in hands — refer to rheumatology. Fasting lipids due to metabolic syndrome risk.'
  },
  {
    id: 'DERM-003', name: 'Nana Ama', age: 8, gender: 'Female', mrn: 'MRN-2026-0925', visitDate: '2026-08-24',
    chiefComplaint: 'Itchy bumps on arms and legs — since age 3',
    lesionCount: 50, bodyAreas: ['Bilateral upper arms', 'Both thighs', 'Buttocks'],
    diagnosis: ['Keratosis Pilaris'],
    status: 'Follow-up', treatmentPlan: 'Gentle exfoliation, moisturising (urea cream 10%), avoid harsh soaps',
    doctor: 'Dr. Akua Mensah', followUp: '2026-11-24 (3 months)', notes: 'Typical "chicken skin" appearance. Benign. Improving with consistent moisturising.'
  },
  {
    id: 'DERM-004', name: 'Yaw Asante', age: 42, gender: 'Male', mrn: 'MRN-2026-0927', visitDate: '2026-08-24',
    chiefComplaint: 'New mole on back — changing shape and colour',
    lesionCount: 1, bodyAreas: ['Upper back'],
    diagnosis: ['Suspicious Melanocytic Lesion — biopsy pending', 'Differential: Melanoma vs Atypical Nevus'],
    status: 'New', treatmentPlan: 'Urgent excisional biopsy, dermoscopy documentation, sent for histopathology',
    doctor: 'Dr. Akua Mensah', followUp: '2026-08-31 (1 week)', notes: 'ABCDE criteria positive: Asymmetric, Border irregular, Colour variegation (brown/black/red), Diameter >6mm, Evolving.'
  },
  {
    id: 'DERM-005', name: 'Efua Serwaa', age: 68, gender: 'Female', mrn: 'MRN-2026-0929', visitDate: '2026-08-24',
    chiefComplaint: 'Dry, cracked skin — whole body, worsening in harmattan',
    lesionCount: 0, bodyAreas: ['Generalised'],
    diagnosis: ['Xerosis (Age-related dry skin)', 'Stasis Dermatitis — bilateral lower legs'],
    status: 'Follow-up', treatmentPlan: 'Emollients TDS, reduce soap use, elevate legs, compression stockings',
    doctor: 'Dr. Akua Mensah', followUp: '2026-10-24 (2 months)', notes: 'Chronic condition. Improving with moisturising regimen. No infection.'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'New': 'bg-blue-100 text-blue-800', 'Follow-up': 'bg-yellow-100 text-yellow-800',
  'Under Treatment': 'bg-purple-100 text-purple-800', 'Resolved': 'bg-green-100 text-green-800',
};

export default function DermatologyClinic() {
  const [selected, setSelected] = useState<DermPatient | null>(DERM_PATIENTS[0] ?? null);
  const [filterStatus, setFilterStatus] = useState('All');

  const filtered = DERM_PATIENTS.filter(p => filterStatus === 'All' || p.status === filterStatus);
  const urgentCount = DERM_PATIENTS.filter(p => p.notes.includes('Urgent') || p.notes.includes('ABCDE')).length;

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
          title="Add New Dermatology Record"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","placeholder":"e.g. Kofi Asante","required":true},{"name":"condition","label":"Condition","type":"select","options":["Eczema","Psoriasis","Acne","Fungal Infection","Dermatitis","Skin Lesion","Other"]},{"name":"bodyArea","label":"Body Area","type":"text"},{"name":"treatment","label":"Treatment Plan","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div>
        <h1 className="text-2xl font-bold">Dermatology Clinic</h1>
        <p className="text-gray-500">Skin conditions, lesion assessment, patch testing, and dermatological treatments</p>
      </div>

      {urgentCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <span className="text-red-600 text-xl">🔴</span>
          <div>
            <div className="font-semibold text-red-800">{urgentCount > 1 ? `${urgentCount} Suspicious Lesions` : `${urgentCount} Suspicious Lesion`}</div>
            <div className="text-sm text-red-600">Requires urgent biopsy — possible malignancy</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Patients Today', value: DERM_PATIENTS.length, color: 'text-blue-600' },
          { label: 'Total Lesions', value: DERM_PATIENTS.reduce((sum, p) => sum + p.lesionCount, 0), color: 'text-orange-600' },
          { label: 'Under Treatment', value: DERM_PATIENTS.filter(p => p.status === 'Under Treatment').length, color: 'text-purple-600' },
          { label: 'Urgent Biopsy', value: urgentCount, color: 'text-red-600' },
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
                <div className="text-right">
                  <div className="text-xs text-gray-400">Lesions</div>
                  <div className="text-lg font-bold text-orange-600">{p.lesionCount || '—'}</div>
                </div>
              </div>
              <div className="flex gap-1 mt-2 flex-wrap">
                {p.bodyAreas.map(a => <Badge key={a} className="text-[10px] bg-sky-100 text-sky-700">{a}</Badge>)}
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
                <div className="text-sm font-medium text-gray-600 mb-1">Body Areas Affected</div>
                <div className="flex gap-1 flex-wrap">
                  {selected.bodyAreas.map(a => <Badge key={a} className="text-xs bg-sky-100 text-sky-700">{a}</Badge>)}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">Lesion Count</div>
                <div className="text-3xl font-bold text-orange-600">{selected.lesionCount || 'N/A'}</div>
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
