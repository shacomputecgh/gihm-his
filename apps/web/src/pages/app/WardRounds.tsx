import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Button, Card, PageHeader } from '../../components/ui';

type RoundTab = 'today' | 'patients' | 'completed';

interface WardRound {
  id: string;
  date: string;
  ward: string;
  doctor: string;
  patientName: string;
  mrn: string;
  bed: string;
  admissionDate: string;
  diagnosis: string[];
  clinicalNotes: string;
  vitals: { bp: string; pulse: number; temp: number; rr: number; spo2: number };
  overnightEvents: string;
  plan: string[];
  dischargeReady: boolean;
  estimatedDischarge?: string;
  pendingResults: string[];
  tasks: Task[];
  status: 'pending' | 'in-progress' | 'completed';
  completedAt?: string;
  signedBy?: string;
}

interface Task {
  id: string;
  description: string;
  assignee: string;
  status: 'pending' | 'done';
  priority: 'normal' | 'urgent';
}

const MOCK_ROUNDS: WardRound[] = [
  {
    id: 'WR001', date: '2026-05-23', ward: 'Medical', doctor: 'Dr. Mensah',
    patientName: 'Kwame Asante', mrn: 'MRN-001', bed: 'M-12', admissionDate: '2026-05-20',
    diagnosis: ['Essential Hypertension', 'Hypertensive Urgency', 'Papilloedema'],
    clinicalNotes: 'Patient reports improvement in headache. BP now 142/88 — improving from 158/95 on admission. Fundoscopy review pending. No neurological deterioration. Tolerating oral medication. Diet acceptable.',
    vitals: { bp: '142/88', pulse: 82, temp: 36.7, rr: 16, spo2: 98 },
    overnightEvents: 'No events. BP at 02:00 was 138/85. Patient slept well.',
    plan: ['Continue Amlodipine 5mg + Enalapril 10mg', 'Urgent fundoscopy today', 'Review blood results when available', 'Target BP < 140/90 before discharge', 'Consider discharge tomorrow if stable'],
    dischargeReady: false, estimatedDischarge: '2026-05-24',
    pendingResults: ['Lipid Profile', 'Echocardiography'],
    tasks: [
      { id: 'T1', description: 'Arrange fundoscopy', assignee: 'Nurse Ama', status: 'done', priority: 'urgent' },
      { id: 'T2', description: 'BP check at 14:00', assignee: 'Nurse Ama', status: 'pending', priority: 'normal' },
      { id: 'T3', description: 'Chase lipid results', assignee: 'Dr. Mensah', status: 'pending', priority: 'normal' },
    ],
    status: 'pending',
  },
  {
    id: 'WR002', date: '2026-05-23', ward: 'Surgical', doctor: 'Dr. Boateng',
    patientName: 'Ama Darko', mrn: 'MRN-002', bed: 'S-05', admissionDate: '2026-05-23',
    diagnosis: ['Acute Appendicitis', 'Post-Appendectomy (Laparoscopic)'],
    clinicalNotes: 'Patient day 0 post laparoscopic appendectomy. Procedure uncomplicated. Tolerating sips of water. Pain controlled on IV Paracetamol. Wound site clean and dry. Flatus passed.',
    vitals: { bp: '118/75', pulse: 80, temp: 36.9, rr: 16, spo2: 99 },
    overnightEvents: 'Procedure completed at 22:00. Recovery uneventful. Transferred to ward at 23:30.',
    plan: ['Advance diet as tolerated', 'Mobilize with assistance', 'IV Cefuroxime + Metronidazole continue 24hrs then switch to oral', 'Wound check daily', 'Target discharge tomorrow if eating and passing flatus'],
    dischargeReady: false, estimatedDischarge: '2026-05-24',
    pendingResults: ['Histology of appendix'],
    tasks: [
      { id: 'T4', description: 'Mobilize patient', assignee: 'Nurse Kofi', status: 'pending', priority: 'urgent' },
      { id: 'T5', description: 'Wound dressing check', assignee: 'Nurse Kofi', status: 'done', priority: 'normal' },
    ],
    status: 'pending',
  },
  {
    id: 'WR003', date: '2026-05-23', ward: 'Paediatrics', doctor: 'Dr. Osei',
    patientName: 'Kofi Asante', mrn: 'MRN-003', bed: 'P-03', admissionDate: '2026-05-23',
    diagnosis: ['Community-acquired Pneumonia', 'Respiratory Distress'],
    clinicalNotes: '3-year-old boy. Day 1 admission. On oxygen via nasal prongs 2L/min. SpO2 maintained at 95-97%. Still febrile (38.5°C). Feeding poorly. No respiratory deterioration.',
    vitals: { bp: '92/58', pulse: 125, temp: 38.5, rr: 40, spo2: 96 },
    overnightEvents: 'Admitted at 14:45. Started on IV antibiotics. Oxygen initiated. Fever spiked to 39.2°C at 22:00 — Paracetamol given. SpO2 dipped to 89% briefly — responded to oxygen increase to 3L/min.',
    plan: ['Continue IV antibiotics', 'Maintain oxygen therapy', 'Monitor SpO2 hourly', 'Chest X-ray first thing tomorrow', 'IV fluids to maintain hydration', 'Encourage oral feeding', 'Review in morning round'],
    dischargeReady: false,
    pendingResults: ['Chest X-ray', 'Blood culture', 'CRP'],
    tasks: [
      { id: 'T6', description: 'SpO2 monitoring hourly', assignee: 'Nurse Abena', status: 'pending', priority: 'urgent' },
      { id: 'T7', description: 'Chest X-ray AM', assignee: 'Radiographer', status: 'pending', priority: 'urgent' },
      { id: 'T8', description: 'Encourage feeding', assignee: 'Nurse Abena', status: 'pending', priority: 'normal' },
    ],
    status: 'pending',
  },
  {
    id: 'WR004', date: '2026-05-23', ward: 'Maternity', doctor: 'Dr. Agyeman',
    patientName: 'Adwoa Boateng', mrn: 'MRN-004', bed: 'MT-02', admissionDate: '2026-05-22',
    diagnosis: ['Normal Vaginal Delivery', 'Postnatal Day 1'],
    clinicalNotes: 'Day 1 post normal vaginal delivery. Mother and baby doing well. Breastfeeding established. Baby passed meconium and urine. Cord dry. Mother ambulating well. No complaints.',
    vitals: { bp: '115/72', pulse: 78, temp: 37.0, rr: 16, spo2: 99 },
    overnightEvents: 'Uneventful night. Baby breastfed at 22:00, 02:00, and 06:00. Mother sleeping well.',
    plan: ['Continue breastfeeding support', 'Discharge today if all checks normal', 'Ensure immunizations completed (BCG, OPV0, HepB0)', 'Provide discharge medications', '6-week follow-up appointment', 'Danger signs counselling'],
    dischargeReady: true,
    pendingResults: [],
    tasks: [
      { id: 'T9', description: 'Discharge checklist', assignee: 'Nurse Ama', status: 'pending', priority: 'urgent' },
      { id: 'T10', description: 'Immunizations check', assignee: 'Nurse Ama', status: 'done', priority: 'urgent' },
    ],
    status: 'pending',
  },
  {
    id: 'WR005', date: '2026-05-23', ward: 'Medical', doctor: 'Dr. Mensah',
    patientName: 'Akua Mensah', mrn: 'MRN-005', bed: 'M-08', admissionDate: '2026-05-18',
    diagnosis: ['Gestational Hypertension', 'Pregnancy 28 weeks'],
    clinicalNotes: '28 weeks pregnant with gestational hypertension. BP controlled on Labetalol. No proteinuria today. Fetal movements normal. No headache, visual disturbance, or epigastric pain. Plan for close monitoring.',
    vitals: { bp: '128/82', pulse: 88, temp: 36.8, rr: 16, spo2: 99 },
    overnightEvents: 'BP at midnight: 130/84. No symptoms.',
    plan: ['Continue Labetalol 200mg BD', 'BP monitoring q4h', 'Urine protein check daily', 'CTG monitoring twice daily', 'Steroid injection for fetal lung maturity if < 34 weeks', 'OB-GYN review'],
    dischargeReady: false,
    pendingResults: ['24hr urine protein', 'CTG trace'],
    tasks: [
      { id: 'T11', description: 'CTG monitoring 10:00', assignee: 'Midwife', status: 'pending', priority: 'urgent' },
      { id: 'T12', description: 'Urine protein collection', assignee: 'Nurse Kofi', status: 'pending', priority: 'normal' },
    ],
    status: 'pending',
  },
];

export default function WardRounds() {
  
  const [tab, setTab] = useState<RoundTab>('today');
  const [selectedRound, setSelectedRound] = useState<string | null>(null);
  const [wardFilter, setWardFilter] = useState('all');

  const wards = [...new Set(MOCK_ROUNDS.map(r => r.ward))];
  const filteredRounds = MOCK_ROUNDS.filter(r => wardFilter === 'all' || r.ward === wardFilter);

  const urgentTasks = MOCK_ROUNDS.flatMap(r => r.tasks.filter(t => t.status === 'pending' && t.priority === 'urgent')).length;

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
          title="Add New Ward Round"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","required":true},{"name":"ward","label":"Ward","type":"select","options":["Medical","Surgical","Paediatric","Maternity","ICU","NICU"]},{"name":"doctor","label":"Doctor","type":"text","required":true},{"name":"findings","label":"Findings","type":"textarea"},{"name":"plan","label":"Treatment Plan","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Ward Rounds" subtitle="Daily ward round documentation and progress tracking" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-blue-600">{MOCK_ROUNDS.length}</div><div className="text-xs text-slate-500">Total Patients</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-amber-600">{MOCK_ROUNDS.filter(r => r.status === 'pending').length}</div><div className="text-xs text-slate-500">Pending</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">{MOCK_ROUNDS.filter(r => r.status === 'completed').length}</div><div className="text-xs text-slate-500">Completed</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-purple-600">{MOCK_ROUNDS.filter(r => r.dischargeReady).length}</div><div className="text-xs text-slate-500">Ready for DC</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-red-600">{urgentTasks}</div><div className="text-xs text-slate-500">Urgent Tasks</div></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-2">
          {(['today', 'patients', 'completed'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${tab === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {t === 'today' ? '📋 Today\'s Rounds' : t === 'patients' ? '👥 All Patients' : '✅ Completed'}
            </button>
          ))}
        </div>
        <select value={wardFilter} onChange={(e) => setWardFilter(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs">
          <option value="all">All Wards</option>
          {wards.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
      </div>

      {/* Rounds List */}
      <div className="space-y-3">
        {filteredRounds.filter(r => tab === 'completed' ? r.status === 'completed' : true).map(round => {
          const isExpanded = selectedRound === round.id;
          return (
            <Card key={round.id} className={`p-4 transition-all ${isExpanded ? 'ring-2 ring-blue-200' : ''} ${round.dischargeReady ? 'border-l-4 border-green-500' : ''}`}>
              <div className="flex items-start justify-between cursor-pointer" onClick={() => setSelectedRound(isExpanded ? null : round.id)}>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800">{round.patientName}</h3>
                    <Badge tone="blue">{round.ward} {round.bed}</Badge>
                    <Badge tone={round.status === 'completed' ? 'green' : round.status === 'in-progress' ? 'blue' : 'gold'}>
                      {round.status === 'completed' ? '✅ COMPLETED' : round.status === 'in-progress' ? '🔄 IN PROGRESS' : '⏳ PENDING'}
                    </Badge>
                    {round.dischargeReady && <Badge tone="green">✅ DISCHARGE READY</Badge>}
                  </div>
                  <div className="mt-1 text-xs text-slate-600">{round.diagnosis.join(' · ')}</div>
                  <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-slate-400">
                    <span>👨‍⚕️ {round.doctor}</span>
                    <span>📅 Admitted: {round.admissionDate}</span>
                    <span>📊 Tasks: {round.tasks.filter(t => t.status === 'pending').length} pending</span>
                  </div>
                </div>
                <span className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
              </div>

              {isExpanded && (
                <div className="mt-4 border-t pt-4 space-y-4">
                  {/* Vitals */}
                  <div>
                    <h4 className="font-bold text-xs text-slate-600 mb-1">📊 Today's Vitals</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded bg-red-50 px-2 py-1 text-xs">BP: {round.vitals.bp}</span>
                      <span className="rounded bg-pink-50 px-2 py-1 text-xs">Pulse: {round.vitals.pulse}</span>
                      <span className="rounded bg-orange-50 px-2 py-1 text-xs">Temp: {round.vitals.temp}°C</span>
                      <span className="rounded bg-blue-50 px-2 py-1 text-xs">RR: {round.vitals.rr}</span>
                      <span className="rounded bg-cyan-50 px-2 py-1 text-xs">SpO2: {round.vitals.spo2}%</span>
                    </div>
                  </div>

                  {/* Clinical Notes */}
                  <div className="rounded-lg bg-blue-50 p-3">
                    <h4 className="font-bold text-xs text-blue-700 mb-1">📝 Clinical Notes</h4>
                    <p className="text-xs text-slate-700 leading-relaxed">{round.clinicalNotes}</p>
                  </div>

                  {/* Overnight Events */}
                  <div className="rounded-lg bg-amber-50 p-3">
                    <h4 className="font-bold text-xs text-amber-700 mb-1">🌙 Overnight Events</h4>
                    <p className="text-xs text-slate-700">{round.overnightEvents}</p>
                  </div>

                  {/* Plan */}
                  <div>
                    <h4 className="font-bold text-xs text-slate-600 mb-1">📋 Plan</h4>
                    <ol className="list-decimal list-inside text-xs text-slate-700 space-y-1 bg-slate-50 rounded p-2">
                      {round.plan.map((p, i) => <li key={i}>{p}</li>)}
                    </ol>
                  </div>

                  {/* Pending Results */}
                  {round.pendingResults.length > 0 && (
                    <div className="rounded-lg bg-purple-50 p-2">
                      <h4 className="font-bold text-xs text-purple-700">⏳ Pending Results</h4>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {round.pendingResults.map(r => <span key={r} className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">{r}</span>)}
                      </div>
                    </div>
                  )}

                  {/* Tasks */}
                  <div>
                    <h4 className="font-bold text-xs text-slate-600 mb-1">✅ Tasks</h4>
                    <div className="space-y-1">
                      {round.tasks.map(task => (
                        <div key={task.id} className={`flex items-center gap-2 rounded p-2 text-xs ${task.status === 'done' ? 'bg-green-50' : task.priority === 'urgent' ? 'bg-red-50' : 'bg-slate-50'}`}>
                          <input type="checkbox" checked={task.status === 'done'} readOnly className="h-3 w-3" />
                          <span className={task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-700'}>{task.description}</span>
                          <span className="text-[10px] text-slate-400">→ {task.assignee}</span>
                          {task.priority === 'urgent' && <Badge tone="red">URGENT</Badge>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {round.estimatedDischarge && (
                    <div className="text-xs text-slate-500">📅 Estimated discharge: <span className="font-bold text-green-600">{round.estimatedDischarge}</span></div>
                  )}

                  <div className="flex gap-2">
                    <Button className="bg-green-600 hover:bg-green-700 text-xs">✅ Complete Round</Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-xs">🖨️ Print Notes</Button>
                    {round.dischargeReady && <Button className="bg-purple-600 hover:bg-purple-700 text-xs">📤 Process Discharge</Button>}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
