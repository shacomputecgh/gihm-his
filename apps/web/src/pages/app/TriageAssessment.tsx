import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface TriagePatient {
  id: string; name: string; age: number; gender: string;
  chiefComplaint: string; esiLevel: 1|2|3|4|5; arrivalTime: string;
  vitalSigns: { bp: string; hr: number; temp: number; rr: number; spo2: number; pain: number };
  waitTime: string; status: 'Waiting' | 'In Triage' | 'In Treatment' | 'Discharged' | 'Admitted' | 'Transferred';
  assignedNurse: string; notes: string;
}

const TRIAGE_PATIENTS: TriagePatient[] = [
  { id: 'TRI-001', name: 'Kwame Asante', age: 58, gender: 'M', chiefComplaint: 'Chest pain, diaphoresis, radiating to left arm', esiLevel: 1, arrivalTime: '08:15', vitalSigns: { bp: '90/60', hr: 110, temp: 36.8, rr: 24, spo2: 91, pain: 9 }, waitTime: '0 min', status: 'In Treatment', assignedNurse: 'Sr. Ama Mensah', notes: 'Acute coronary syndrome suspected. ECG done — ST elevation in V1-V4. Activated cath lab.' },
  { id: 'TRI-002', name: 'Akosua Boateng', age: 34, gender: 'F', chiefComplaint: 'Severe headache, visual changes, BP 200/120', esiLevel: 2, arrivalTime: '08:32', vitalSigns: { bp: '200/120', hr: 95, temp: 37.0, rr: 18, spo2: 98, pain: 8 }, waitTime: '5 min', status: 'In Triage', assignedNurse: 'Sr. Kofi Appiah', notes: 'Hypertensive emergency. Possible eclampsia — check urine for protein. IV labetalol started.' },
  { id: 'TRI-003', name: 'Yaw Darko', age: 8, gender: 'M', chiefComplaint: 'Febrile seizure, high fever 40°C', esiLevel: 2, arrivalTime: '09:05', vitalSigns: { bp: '100/65', hr: 130, temp: 40.1, rr: 28, spo2: 97, pain: 3 }, waitTime: '2 min', status: 'In Treatment', assignedNurse: 'Sr. Efua Owusu', notes: 'Febrile seizure resolved. IV paracetamol + cooling. Blood culture taken. Rule out meningitis.' },
  { id: 'TRI-004', name: 'Abena Serwaa', age: 67, gender: 'F', chiefComplaint: 'Fall at home, hip pain, unable to bear weight', esiLevel: 3, arrivalTime: '09:20', vitalSigns: { bp: '135/85', hr: 82, temp: 36.6, rr: 16, spo2: 96, pain: 7 }, waitTime: '15 min', status: 'Waiting', assignedNurse: '', notes: 'X-ray ordered — suspected fractured neck of femur. Pain management initiated.' },
  { id: 'TRI-005', name: 'Kojo Mensah', age: 22, gender: 'M', chiefComplaint: 'Road traffic accident, laceration to forehead', esiLevel: 3, arrivalTime: '09:45', vitalSigns: { bp: '125/80', hr: 88, temp: 37.0, rr: 16, spo2: 99, pain: 5 }, waitTime: '20 min', status: 'Waiting', assignedNurse: '', notes: 'GCS 15. No loss of consciousness. Laceration needs cleaning and suturing. CT head if any deterioration.' },
  { id: 'TRI-006', name: 'Ama Adjei', age: 45, gender: 'F', chiefComplaint: 'Cough for 2 weeks, night sweats, weight loss', esiLevel: 4, arrivalTime: '10:10', vitalSigns: { bp: '118/75', hr: 78, temp: 37.4, rr: 18, spo2: 95, pain: 2 }, waitTime: '35 min', status: 'Waiting', assignedNurse: '', notes: 'Suspected pulmonary TB. Sputum AFB sent. Chest X-ray ordered. Contact tracing to be done.' },
  { id: 'TRI-007', name: 'Kofi Annan', age: 12, gender: 'M', chiefComplaint: 'Sore throat, mild fever, runny nose', esiLevel: 5, arrivalTime: '10:30', vitalSigns: { bp: '105/65', hr: 72, temp: 37.8, rr: 16, spo2: 99, pain: 2 }, waitTime: '45 min', status: 'In Triage', assignedNurse: '', notes: 'Viral upper respiratory infection. Saline gargle, paracetamol. No antibiotics needed.' },
  { id: 'TRI-008', name: 'Efua Nyarko', age: 78, gender: 'F', chiefComplaint: 'Confusion, falls, not eating for 3 days', esiLevel: 2, arrivalTime: '10:45', vitalSigns: { bp: '95/55', hr: 105, temp: 38.5, rr: 22, spo2: 93, pain: 1 }, waitTime: '3 min', status: 'In Treatment', assignedNurse: 'Sr. Ama Mensah', notes: 'UTI with sepsis suspected. IV fluids + antibiotics started. Blood cultures sent. U&Cs pending.' },
];

const ESI_COLORS: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: 'bg-red-100', text: 'text-red-800', label: 'Resuscitation' },
  2: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Emergent' },
  3: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Urgent' },
  4: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Less Urgent' },
  5: { bg: 'bg-green-100', text: 'text-green-800', label: 'Non-Urgent' },
};

const STATUS_COLORS: Record<string, string> = {
  'Waiting': 'bg-yellow-100 text-yellow-800', 'In Triage': 'bg-blue-100 text-blue-800',
  'In Treatment': 'bg-green-100 text-green-800', 'Discharged': 'bg-gray-100 text-gray-800',
  'Admitted': 'bg-purple-100 text-purple-800', 'Transferred': 'bg-orange-100 text-orange-800',
};

const TRIAGE_GUIDELINES = [
  { level: 1, label: 'Resuscitation', color: 'bg-red-500', criteria: 'Immediate life-threatening conditions: cardiac arrest, respiratory failure, major trauma, shock' },
  { level: 2, label: 'Emergent', color: 'bg-orange-500', criteria: 'High risk situations, confused/lethargic/disoriented, severe pain/distress, vital sign abnormalities' },
  { level: 3, label: 'Urgent', color: 'bg-yellow-500', criteria: 'Multiple resources needed, acute illness with potential for rapid deterioration, moderate pain' },
  { level: 4, label: 'Less Urgent', color: 'bg-blue-500', criteria: 'One resource needed, non-urgent conditions, stable vital signs, minor injuries' },
  { level: 5, label: 'Non-Urgent', color: 'bg-green-500', criteria: 'No resources expected, prescription refills, minor complaints, health maintenance' },
];

function getPainColor(pain: number) {
  if (pain >= 8) return 'text-red-600';
  if (pain >= 5) return 'text-orange-600';
  if (pain >= 3) return 'text-yellow-600';
  return 'text-green-600';
}

export default function TriageAssessment() {
  const [selected, setSelected] = useState<TriagePatient | null>(TRIAGE_PATIENTS[0] ?? null);
  const [filterESI, setFilterESI] = useState<number | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [tab, setTab] = useState<'patients' | 'guidelines' | 'stats'>('patients');
  const filtered = TRIAGE_PATIENTS.filter(p => (filterESI === 'all' || p.esiLevel === filterESI) && (filterStatus === 'all' || p.status === filterStatus));
  const counts = { 1: TRIAGE_PATIENTS.filter(p => p.esiLevel === 1).length, 2: TRIAGE_PATIENTS.filter(p => p.esiLevel === 2).length, 3: TRIAGE_PATIENTS.filter(p => p.esiLevel === 3).length, 4: TRIAGE_PATIENTS.filter(p => p.esiLevel === 4).length, 5: TRIAGE_PATIENTS.filter(p => p.esiLevel === 5).length };

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
          title="Add New TriageAssessment"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Triage & Emergency Assessment</h1><p className="text-gray-500">Emergency Severity Index (ESI) triage scoring, patient prioritisation, and emergency assessment tracking</p></div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(counts).map(([level, count]) => {
          const esi = ESI_COLORS[Number(level)] ?? { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Unknown' };
          return (
            <button key={level} onClick={() => setFilterESI(filterESI === Number(level) ? 'all' : Number(level))} className={`${esi.bg} ${filterESI === Number(level) ? 'ring-2 ring-offset-2 ring-blue-500' : ''} rounded-lg p-3 text-center transition-all hover:scale-105`}>
              <div className={`text-2xl font-bold ${esi.text}`}>{count}</div>
              <div className={`text-xs font-medium ${esi.text}`}>ESI {level}</div>
              <div className="text-[10px] text-gray-500">{esi.label}</div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        {(['patients', 'guidelines', 'stats'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>{t === 'patients' ? 'Patients' : t === 'guidelines' ? 'ESI Guidelines' : 'Statistics'}</button>
        ))}
      </div>

      {tab === 'patients' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex gap-2">
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
                <option value="all">All Status</option>
                {['Waiting', 'In Triage', 'In Treatment', 'Discharged', 'Admitted', 'Transferred'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {filtered.map(p => {
              return (
                <div key={p.id} onClick={() => setSelected(p)} className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${selected?.id === p.id ? 'ring-2 ring-blue-500 border-blue-300' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${ESI_COLORS[p.esiLevel]?.bg ?? 'bg-gray-100'} ${ESI_COLORS[p.esiLevel]?.text ?? 'text-gray-800'}`}>ESI {p.esiLevel}</span>
                        <span className="font-semibold">{p.name}</span>
                        <span className="text-xs text-gray-500">{p.age}/{p.gender}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{p.chiefComplaint}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>Arrived: {p.arrivalTime}</span>
                        <span>Wait: {p.waitTime}</span>
                        <span>Pain: <span className={`font-bold ${getPainColor(p.vitalSigns.pain)}`}>{p.vitalSigns.pain}/10</span></span>
                      </div>
                    </div>
                    <Badge className={STATUS_COLORS[p.status]}>{p.status}</Badge>
                  </div>
                </div>
              );
            })}
          </div>

          {selected && (
            <div className="bg-white rounded-lg border p-5 space-y-4 h-fit sticky top-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${ESI_COLORS[selected.esiLevel]?.bg ?? 'bg-gray-100'} ${ESI_COLORS[selected.esiLevel]?.text ?? 'text-gray-800'}`}>ESI {selected.esiLevel} — {ESI_COLORS[selected.esiLevel]?.label ?? 'Unknown'}</span>
                </div>
                <h3 className="text-lg font-bold">{selected.name}</h3>
                <p className="text-sm text-gray-500">{selected.age} years, {selected.gender === 'M' ? 'Male' : 'Female'} | ID: {selected.id}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Chief Complaint</h4>
                <p className="text-sm bg-red-50 border border-red-200 rounded p-2">{selected.chiefComplaint}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2">Vital Signs</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-gray-50 rounded p-2 text-center"><div className="font-bold">{selected.vitalSigns.bp}</div><div className="text-xs text-gray-500">BP (mmHg)</div></div>
                  <div className="bg-gray-50 rounded p-2 text-center"><div className="font-bold">{selected.vitalSigns.hr}</div><div className="text-xs text-gray-500">HR (bpm)</div></div>
                  <div className="bg-gray-50 rounded p-2 text-center"><div className="font-bold">{selected.vitalSigns.temp}°C</div><div className="text-xs text-gray-500">Temp</div></div>
                  <div className="bg-gray-50 rounded p-2 text-center"><div className="font-bold">{selected.vitalSigns.rr}</div><div className="text-xs text-gray-500">RR (/min)</div></div>
                  <div className="bg-gray-50 rounded p-2 text-center"><div className="font-bold">{selected.vitalSigns.spo2}%</div><div className="text-xs text-gray-500">SpO2</div></div>
                  <div className="bg-gray-50 rounded p-2 text-center"><div className={`font-bold ${getPainColor(selected.vitalSigns.pain)}`}>{selected.vitalSigns.pain}/10</div><div className="text-xs text-gray-500">Pain</div></div>
                </div>
              </div>
              {selected.assignedNurse && <div><h4 className="font-semibold text-sm mb-1">Assigned Nurse</h4><p className="text-sm">{selected.assignedNurse}</p></div>}
              <div><h4 className="font-semibold text-sm mb-1">Clinical Notes</h4><p className="text-sm bg-blue-50 border border-blue-200 rounded p-2">{selected.notes}</p></div>
            </div>
          )}
        </div>
      )}

      {tab === 'guidelines' && (
        <div className="space-y-3">
          {TRIAGE_GUIDELINES.map(g => (
            <div key={g.level} className="bg-white rounded-lg border p-4 flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full ${g.color} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>{g.level}</div>
              <div>
                <h3 className="font-bold text-sm">ESI Level {g.level}: {g.label}</h3>
                <p className="text-sm text-gray-600 mt-1">{g.criteria}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3">Average Wait by ESI Level</h3>
            {[1, 2, 3, 4, 5].map(l => {
              return (
                <div key={l} className="flex items-center justify-between py-1 text-sm">
                  <span className={ESI_COLORS[l]?.text ?? 'text-gray-800'}>ESI {l}</span>
                  <span className="font-mono">{l <= 2 ? '< 5 min' : l === 3 ? '~15 min' : '~35 min'}</span>
                </div>
              );
            })}
          </div>
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3">Status Distribution</h3>
            {['Waiting', 'In Triage', 'In Treatment', 'Discharged'].map(s => (
              <div key={s} className="flex items-center justify-between py-1 text-sm">
                <span>{s}</span>
                <span className="font-mono">{TRIAGE_PATIENTS.filter(p => p.status === s).length}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3">Performance Metrics</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>ESI 1 Response Time</span><span className="font-bold text-green-600">&lt; 1 min</span></div>
              <div className="flex justify-between"><span>ESI 2 Response Time</span><span className="font-bold text-green-600">&lt; 5 min</span></div>
              <div className="flex justify-between"><span>ESI 3 Response Time</span><span className="font-bold text-yellow-600">&lt; 30 min</span></div>
              <div className="flex justify-between"><span>Overall Throughput</span><span className="font-bold">{TRIAGE_PATIENTS.length} patients</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
