import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Card, Input, PageHeader } from '../../components/ui';

interface TimelineEvent {
  id: string;
  date: string;
  time: string;
  type: 'registration' | 'visit' | 'admission' | 'discharge' | 'lab' | 'pharmacy' | 'procedure' | 'imaging' | 'referral' | 'vaccination' | 'billing' | 'surgery';
  title: string;
  description: string;
  department: string;
  clinician?: string;
  outcome?: string;
  icon: string;
  color: string;
}

interface PatientRecord {
  id: string;
  name: string;
  mrn: string;
  dob: string;
  age: number;
  gender: string;
  bloodGroup: string;
  genotype: string;
  phone: string;
  email: string;
  address: string;
  insurance: string;
  allergies: string[];
  chronicConditions: string[];
  emergencyContact: string;
  timeline: TimelineEvent[];
}

const MOCK_PATIENTS: PatientRecord[] = [
  {
    id: 'PT001', name: 'Kwame Asante', mrn: 'MRN-001234', dob: '1990-03-15', age: 36, gender: 'Male',
    bloodGroup: 'O+', genotype: 'AS', phone: '024-123-4567', email: 'kwame.asante@email.com',
    address: '123 Independence Ave, Accra', insurance: 'NHIS', allergies: ['Penicillin', 'Sulfa drugs'],
    chronicConditions: ['Essential Hypertension', 'Type 2 Diabetes'], emergencyContact: 'Abena Asante (Wife) - 024-987-6543',
    timeline: [
      { id: 'E001', date: '2024-01-15', time: '09:00', type: 'registration', title: 'Patient Registration', description: 'New patient registered. Demographics and contact information captured.', department: 'Reception', icon: '📋', color: 'bg-blue-500' },
      { id: 'E002', date: '2024-01-15', time: '09:30', type: 'visit', title: 'OPD Consultation', description: 'First consultation — presented with headache and dizziness. BP 160/95.', department: 'OPD', clinician: 'Dr. Mensah', outcome: 'Diagnosed with Essential Hypertension. Started on Amlodipine 5mg.', icon: '🩺', color: 'bg-purple-500' },
      { id: 'E003', date: '2024-01-15', time: '10:00', type: 'lab', title: 'Blood Investigation', description: 'FBC, U&E, Creatinine, Lipid Profile, Fasting Blood Sugar ordered.', department: 'Laboratory', clinician: 'Dr. Mensah', icon: '🧪', color: 'bg-cyan-500' },
      { id: 'E004', date: '2024-01-15', time: '10:30', type: 'pharmacy', title: 'Medication Dispensed', description: 'Amlodipine 5mg (30 tabs), Paracetamol 500mg (20 tabs)', department: 'Pharmacy', icon: '💊', color: 'bg-pink-500' },
      { id: 'E005', date: '2024-02-15', time: '11:00', type: 'visit', title: 'Follow-up Visit', description: 'BP 145/90 — improving. Continue medication. Add lifestyle modifications.', department: 'OPD', clinician: 'Dr. Mensah', icon: '🩺', color: 'bg-purple-500' },
      { id: 'E006', date: '2024-06-20', time: '08:30', type: 'lab', title: 'Annual Blood Work', description: 'FBC, U&E, Lipid Profile, HbA1c. Results: HbA1c 7.2% — Type 2 Diabetes confirmed.', department: 'Laboratory', icon: '🧪', color: 'bg-cyan-500' },
      { id: 'E007', date: '2024-06-20', time: '09:30', type: 'visit', title: 'Diabetes Diagnosis', description: 'Type 2 Diabetes diagnosed. Started on Metformin 500mg BD.', department: 'OPD', clinician: 'Dr. Osei', outcome: 'Metformin added to treatment plan', icon: '🩺', color: 'bg-purple-500' },
      { id: 'E008', date: '2024-09-10', time: '14:00', type: 'procedure', title: 'ECG Done', description: 'Routine ECG — Normal sinus rhythm. Left ventricular hypertrophy noted.', department: 'Cardiology', clinician: 'Dr. Mensah', icon: '💓', color: 'bg-red-500' },
      { id: 'E009', date: '2025-01-15', time: '10:00', type: 'visit', title: 'Annual Review', description: 'BP 138/85 — controlled. HbA1c 6.8% — improved. Continue current medications.', department: 'OPD', clinician: 'Dr. Mensah', icon: '🩺', color: 'bg-purple-500' },
      { id: 'E010', date: '2025-06-20', time: '09:00', type: 'vaccination', title: 'COVID-19 Booster', description: 'COVID-19 booster dose administered. No immediate adverse reactions.', department: 'Immunization', clinician: 'Nurse Ama', icon: '💉', color: 'bg-green-500' },
      { id: 'E011', date: '2025-12-10', time: '11:00', type: 'imaging', title: 'Chest X-Ray', description: 'Routine pre-employment chest X-ray. No abnormalities detected.', department: 'Radiology', icon: '📡', color: 'bg-orange-500' },
      { id: 'E012', date: '2026-05-20', time: '08:00', type: 'admission', title: 'Emergency Admission', description: 'Admitted with severe headache, BP 158/95. Papilloedema on fundoscopy. Hypertensive urgency.', department: 'Emergency', clinician: 'Dr. Mensah', icon: '🏥', color: 'bg-red-600' },
      { id: 'E013', date: '2026-05-20', time: '09:00', type: 'lab', title: 'Urgent Bloods', description: 'FBC, U&E, Creatinine, Lipid Profile. Results: Creatinine elevated.', department: 'Laboratory', icon: '🧪', color: 'bg-cyan-500' },
      { id: 'E014', date: '2026-05-20', time: '10:00', type: 'pharmacy', title: 'IV Medications', description: 'Amlodipine 5mg PO, Enalapril 10mg PO, IV Paracetamol for headache.', department: 'Pharmacy', icon: '💊', color: 'bg-pink-500' },
      { id: 'E015', date: '2026-05-23', time: '09:30', type: 'visit', title: 'Ward Round', description: 'BP 142/88 — improving. Fundoscopy pending. Plan for discharge tomorrow.', department: 'Medical Ward', clinician: 'Dr. Mensah', icon: '🩺', color: 'bg-purple-500' },
      { id: 'E016', date: '2026-05-23', time: '10:00', type: 'billing', title: 'Admission Bill', description: 'Total bill: GH₵ 2,450. NHIS covers GH₵ 1,800. Out-of-pocket: GH₵ 650.', department: 'Billing', icon: '💰', color: 'bg-yellow-500' },
    ],
  },
  {
    id: 'PT002', name: 'Ama Darko', mrn: 'MRN-002345', dob: '1985-07-22', age: 40, gender: 'Female',
    bloodGroup: 'A+', genotype: 'AA', phone: '020-987-6543', email: 'ama.darko@email.com',
    address: '45 Ring Road, Kumasi', insurance: 'Private Insurance', allergies: ['Aspirin'],
    chronicConditions: [], emergencyContact: 'Kofi Darko (Husband) - 020-123-4567',
    timeline: [
      { id: 'E017', date: '2026-05-23', time: '08:15', type: 'admission', title: 'Emergency Admission', description: 'Admitted with right lower abdominal pain. Suspected acute appendicitis.', department: 'Emergency', clinician: 'Dr. Boateng', icon: '🏥', color: 'bg-red-600' },
      { id: 'E018', date: '2026-05-23', time: '09:00', type: 'lab', title: 'Urgent Bloods', description: 'FBC: WBC 14.2. Urine pregnancy test: Negative. Group & Save.', department: 'Laboratory', icon: '🧪', color: 'bg-cyan-500' },
      { id: 'E019', date: '2026-05-23', time: '10:00', type: 'imaging', title: 'CT Abdomen', description: 'CT confirmed acute appendicitis. No perforation.', department: 'Radiology', icon: '📡', color: 'bg-orange-500' },
      { id: 'E020', date: '2026-05-23', time: '14:00', type: 'surgery', title: 'Laparoscopic Appendectomy', description: 'Laparoscopic appendectomy performed under general anaesthesia. Procedure uncomplicated.', department: 'Theatre', clinician: 'Dr. Boateng', outcome: 'Successful', icon: '🏥', color: 'bg-red-600' },
      { id: 'E021', date: '2026-05-23', time: '22:00', type: 'pharmacy', title: 'Post-Op Medications', description: 'IV Cefuroxime, IV Metronidazole, IV Paracetamol, IV fluids.', department: 'Pharmacy', icon: '💊', color: 'bg-pink-500' },
    ],
  },
  {
    id: 'PT003', name: 'Kofi Asante Jr.', mrn: 'MRN-003456', dob: '2023-05-10', age: 3, gender: 'Male',
    bloodGroup: 'B+', genotype: 'AA', phone: '024-555-1234', email: 'N/A',
    address: '123 Independence Ave, Accra', insurance: 'NHIS', allergies: [],
    chronicConditions: [], emergencyContact: 'Kwame Asante (Father) - 024-123-4567',
    timeline: [
      { id: 'E022', date: '2023-05-10', time: '03:15', type: 'registration', title: 'Birth Registration', description: 'Normal vaginal delivery at Korle-Bu. Weight 3.2kg. APGAR 8/9.', department: 'Maternity', icon: '📋', color: 'bg-blue-500' },
      { id: 'E023', date: '2023-05-10', time: '08:00', type: 'vaccination', title: 'BCG & OPV0', description: 'BCG and OPV0 administered at birth.', department: 'Immunization', icon: '💉', color: 'bg-green-500' },
      { id: 'E024', date: '2024-01-10', time: '09:00', type: 'vaccination', title: 'DPT-HepB-Hib 1', description: 'First dose of DPT-HepB-Hib vaccine given.', department: 'Immunization', icon: '💉', color: 'bg-green-500' },
      { id: 'E025', date: '2026-05-23', time: '14:45', type: 'admission', title: 'Emergency Admission', description: 'Admitted with cough (5 days), fever (3 days), difficulty breathing (1 day).', department: 'Emergency', clinician: 'Dr. Osei', icon: '🏥', color: 'bg-red-600' },
      { id: 'E026', date: '2026-05-23', time: '15:00', type: 'lab', title: 'Blood Investigation', description: 'FBC, CRP, Blood Culture. CRP elevated. SpO2 91%.', department: 'Laboratory', icon: '🧪', color: 'bg-cyan-500' },
      { id: 'E027', date: '2026-05-23', time: '15:30', type: 'procedure', title: 'Oxygen Therapy', description: 'Oxygen via nasal prongs 2L/min initiated. SpO2 improved to 96%.', department: 'Paediatrics', clinician: 'Dr. Osei', icon: '💨', color: 'bg-cyan-600' },
      { id: 'E028', date: '2026-05-23', time: '16:00', type: 'pharmacy', title: 'Medications Started', description: 'IV Amoxicillin-Clavulanate, IV Paracetamol, IV fluids.', department: 'Pharmacy', icon: '💊', color: 'bg-pink-500' },
      { id: 'E029', date: '2026-05-23', time: '16:30', type: 'imaging', title: 'Chest X-Ray', description: 'Chest X-ray: Right lower lobe consolidation. Consistent with pneumonia.', department: 'Radiology', icon: '📡', color: 'bg-orange-500' },
    ],
  },
];

const EVENT_TYPES: Record<string, { icon: string; label: string; color: string }> = {
  registration: { icon: '📋', label: 'Registration', color: 'bg-blue-100 text-blue-700' },
  visit: { icon: '🩺', label: 'Visit', color: 'bg-purple-100 text-purple-700' },
  admission: { icon: '🏥', label: 'Admission', color: 'bg-red-100 text-red-700' },
  discharge: { icon: '✅', label: 'Discharge', color: 'bg-green-100 text-green-700' },
  lab: { icon: '🧪', label: 'Laboratory', color: 'bg-cyan-100 text-cyan-700' },
  pharmacy: { icon: '💊', label: 'Pharmacy', color: 'bg-pink-100 text-pink-700' },
  procedure: { icon: '🔬', label: 'Procedure', color: 'bg-amber-100 text-amber-700' },
  imaging: { icon: '📡', label: 'Imaging', color: 'bg-orange-100 text-orange-700' },
  referral: { icon: '🔄', label: 'Referral', color: 'bg-indigo-100 text-indigo-700' },
  vaccination: { icon: '💉', label: 'Vaccination', color: 'bg-green-100 text-green-700' },
  billing: { icon: '💰', label: 'Billing', color: 'bg-yellow-100 text-yellow-700' },
  surgery: { icon: '🏥', label: 'Surgery', color: 'bg-red-100 text-red-700' },
};

export default function PatientTimeline() {
  const [selectedPatient, setSelectedPatient] = useState<string | null>(MOCK_PATIENTS[0]!.id);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const patient = MOCK_PATIENTS.find(p => p.id === selectedPatient);
  const filteredEvents = patient?.timeline.filter(e => filterType === 'all' || e.type === filterType) ?? [];

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
          title="Add New Timeline Event"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Patient Timeline" subtitle="Complete medical history visualization for any patient" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Patient List */}
        <div className="space-y-3">
          <Input placeholder="Search patients..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          {MOCK_PATIENTS.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
            <div key={p.id} className={`cursor-pointer rounded-xl border border-slate-200 p-3 transition-all ${selectedPatient === p.id ? 'ring-2 ring-blue-400 bg-blue-50' : 'hover:bg-slate-50'}`}
              onClick={() => setSelectedPatient(p.id)}>
              <h3 className="font-bold text-sm text-slate-800">{p.name}</h3>
              <div className="text-[10px] text-slate-500">{p.mrn} · {p.gender} · {p.age}yrs · {p.bloodGroup}</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {p.allergies.length > 0 && <span className="rounded bg-red-100 px-1 text-[9px] text-red-600">⚠️ Allergies</span>}
                {p.chronicConditions.length > 0 && <span className="rounded bg-amber-100 px-1 text-[9px] text-amber-600">📋 Chronic</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Patient Info + Timeline */}
        <div className="lg:col-span-3 space-y-4">
          {patient && (
            <>
              {/* Patient Info Card */}
              <Card className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-bold text-lg text-slate-800">{patient.name}</h2>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>MRN: <strong>{patient.mrn}</strong></span>
                      <span>DOB: {patient.dob} ({patient.age} yrs)</span>
                      <span>{patient.gender}</span>
                      <span>Blood: {patient.bloodGroup} ({patient.genotype})</span>
                      <span>Insurance: {patient.insurance}</span>
                    </div>
                  </div>
                </div>
                {patient.allergies.length > 0 && (
                  <div className="mt-2 rounded-lg bg-red-50 p-2 text-xs">
                    <span className="font-bold text-red-700">⚠️ Allergies:</span> {patient.allergies.join(', ')}
                  </div>
                )}
                {patient.chronicConditions.length > 0 && (
                  <div className="mt-2 rounded-lg bg-amber-50 p-2 text-xs">
                    <span className="font-bold text-amber-700">📋 Chronic Conditions:</span> {patient.chronicConditions.join(', ')}
                  </div>
                )}
              </Card>

              {/* Filter */}
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setFilterType('all')} className={`rounded-full px-3 py-1.5 text-[10px] font-semibold ${filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>All ({patient.timeline.length})</button>
                {Object.entries(EVENT_TYPES).map(([key, cfg]) => {
                  const count = patient.timeline.filter(e => e.type === key).length;
                  if (count === 0) return null;
                  return (
                    <button key={key} onClick={() => setFilterType(key)} className={`rounded-full px-3 py-1.5 text-[10px] font-semibold ${filterType === key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {cfg.icon} {cfg.label} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Timeline */}
              <div className="relative ml-4 border-l-2 border-slate-200 pl-6 space-y-4">
                {filteredEvents.map((event) => {
                  const typeCfg = EVENT_TYPES[event.type] ?? EVENT_TYPES.visit!;
                  return (
                    <div key={event.id} className="relative">
                      {/* Dot */}
                      <div className={`absolute -left-[31px] top-1 h-4 w-4 rounded-full ${event.color} border-2 border-white shadow`} />
                      {/* Card */}
                      <Card className="p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${typeCfg.color}`}>{typeCfg.icon} {typeCfg.label}</span>
                              <span className="text-[10px] text-slate-400">{event.date} {event.time}</span>
                            </div>
                            <h4 className="mt-1 font-bold text-sm text-slate-800">{event.title}</h4>
                            <p className="text-xs text-slate-600 mt-0.5">{event.description}</p>
                            <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-slate-400">
                              <span>🏥 {event.department}</span>
                              {event.clinician && <span>👨‍⚕️ {event.clinician}</span>}
                              {event.outcome && <span className="text-green-600">✅ {event.outcome}</span>}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
