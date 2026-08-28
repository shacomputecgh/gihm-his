import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Button, Card, PageHeader } from '../../components/ui';

type HandoverTab = 'current' | 'history' | 'templates';

interface HandoverNote {
  id: string;
  ward: string;
  shift: 'morning' | 'afternoon' | 'night';
  date: string;
  startTime: string;
  endTime: string;
  outgoingNurse: string;
  incomingNurse: string;
  patients: HandoverPatient[];
  pendingTasks: string[];
  criticalAlerts: string[];
  equipmentIssues: string[];
  staffingNotes: string;
  status: 'active' | 'completed';
}

interface HandoverPatient {
  name: string;
  bed: string;
  diagnosis: string;
  status: string;
  pendingTasks: string[];
  criticalAlerts: string[];
  notes: string;
}

const MOCK_HANDOVERS: HandoverNote[] = [
  {
    id: 'HO001', ward: 'Medical', shift: 'morning', date: '2026-05-23', startTime: '06:00', endTime: '14:00',
    outgoingNurse: 'Nurse Ama', incomingNurse: 'Nurse Kofi', status: 'active',
    patients: [
      { name: 'Kwame Asante', bed: 'M-12', diagnosis: 'Hypertensive Urgency', status: 'Stable — improving', pendingTasks: ['BP check at 14:00', 'Chase lipid results'], criticalAlerts: [], notes: 'BP 142/88 — improving. Fundoscopy pending.' },
      { name: 'Akua Mensah', bed: 'M-08', diagnosis: 'Gestational Hypertension', status: 'Stable — monitored', pendingTasks: ['CTG at 10:00', 'Urine protein collection'], criticalAlerts: ['BP trending up — monitor closely'], notes: '28 weeks pregnant. On Labetalol. Fetal movements normal.' },
    ],
    pendingTasks: ['Chase lab results for M-12', 'CTG monitoring for M-08', 'Wound dressing check M-15'],
    criticalAlerts: ['M-08: BP trending up — call doctor if >140/90'],
    equipmentIssues: ['BP monitor in Room 3 needs battery replacement'],
    staffingNotes: 'One nurse on break 12:00-12:30. Student nurse assisting.',
  },
  {
    id: 'HO002', ward: 'Surgical', shift: 'morning', date: '2026-05-23', startTime: '06:00', endTime: '14:00',
    outgoingNurse: 'Nurse Kofi', incomingNurse: 'Nurse Abena', status: 'active',
    patients: [
      { name: 'Ama Darko', bed: 'S-05', diagnosis: 'Post-Laparoscopic Appendectomy', status: 'Recovery — day 0', pendingTasks: ['Mobilize with assistance', 'Wound check', 'Advance diet'], criticalAlerts: [], notes: 'Tolerating sips of water. Pain controlled. Flatus passed.' },
    ],
    pendingTasks: ['Mobilize S-05', 'Wound dressing check', 'IV antibiotics review'],
    criticalAlerts: [],
    equipmentIssues: [],
    staffingNotes: 'Full staffing today.',
  },
  {
    id: 'HO003', ward: 'Paediatrics', shift: 'morning', date: '2026-05-23', startTime: '06:00', endTime: '14:00',
    outgoingNurse: 'Nurse Abena', incomingNurse: 'Nurse Dora', status: 'active',
    patients: [
      { name: 'Kofi Asante Jr.', bed: 'P-03', diagnosis: 'Community-acquired Pneumonia', status: 'Febrile — on oxygen', pendingTasks: ['SpO2 monitoring hourly', 'Chest X-ray AM', 'Encourage feeding'], criticalAlerts: ['SpO2 dipped to 89% last night — now 96% on 3L/min'], notes: 'Still febrile (38.5°C). On IV antibiotics. Oxygen via nasal prongs.' },
    ],
    pendingTasks: ['Hourly SpO2 checks', 'Encourage oral feeding', 'Monitor temperature'],
    criticalAlerts: ['P-03: SpO2 history — monitor closely, call doctor if <94%'],
    equipmentIssues: [],
    staffingNotes: 'Paediatric nurse available.',
  },
  {
    id: 'HO004', ward: 'Maternity', shift: 'morning', date: '2026-05-23', startTime: '06:00', endTime: '14:00',
    outgoingNurse: 'Nurse Dora', incomingNurse: 'Nurse Ama', status: 'active',
    patients: [
      { name: 'Adwoa Boateng', bed: 'MT-02', diagnosis: 'Post-NVD Day 1', status: 'Well — discharge today', pendingTasks: ['Discharge checklist', 'Immunizations check', 'Danger signs counselling'], criticalAlerts: [], notes: 'Mother and baby well. Breastfeeding established. Ready for discharge.' },
    ],
    pendingTasks: ['Process discharge for MT-02', 'New admission expected MT-04'],
    criticalAlerts: [],
    equipmentIssues: [],
    staffingNotes: 'Midwife available for deliveries.',
  },
];

export default function HandoverNotes() {
  const [tab, setTab] = useState<HandoverTab>('current');
  const [selectedHandover, setSelectedHandover] = useState<string | null>(null);

  const activeHandovers = MOCK_HANDOVERS.filter(h => h.status === 'active');

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
          title="Add New Handover Note"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Handover Notes" subtitle="Shift-to-shift clinical documentation and patient status transfer" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-blue-600">{activeHandovers.length}</div><div className="text-xs text-slate-500">Active Handovers</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-red-600">{MOCK_HANDOVERS.reduce((s, h) => s + h.criticalAlerts.length, 0)}</div><div className="text-xs text-slate-500">Critical Alerts</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-amber-600">{MOCK_HANDOVERS.reduce((s, h) => s + h.pendingTasks.length, 0)}</div><div className="text-xs text-slate-500">Pending Tasks</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">{MOCK_HANDOVERS.reduce((s, h) => s + h.patients.length, 0)}</div><div className="text-xs text-slate-500">Patients Covered</div></Card>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['current', 'history', 'templates'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${tab === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {t === 'current' ? `📋 Current Shift (${activeHandovers.length})` : t === 'history' ? '📜 History' : '📝 Templates'}
          </button>
        ))}
      </div>

      {/* Current Shift Tab */}
      {tab === 'current' && (
        <div className="space-y-3">
          {MOCK_HANDOVERS.map(h => {
            const isExpanded = selectedHandover === h.id;
            const shiftCfg = { morning: { label: '🌅 Morning', color: 'text-amber-700', bg: 'bg-amber-50' }, afternoon: { label: '☀️ Afternoon', color: 'text-blue-700', bg: 'bg-blue-50' }, night: { label: '🌙 Night', color: 'text-purple-700', bg: 'bg-purple-50' } };
            const cfg = shiftCfg[h.shift];
            return (
              <Card key={h.id} className={`p-4 transition-all ${isExpanded ? 'ring-2 ring-blue-200' : ''}`}>
                <div className="flex items-start justify-between cursor-pointer" onClick={() => setSelectedHandover(isExpanded ? null : h.id)}>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800">{h.ward} Ward</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                      <Badge tone={h.status === 'active' ? 'blue' : 'green'}>{h.status.toUpperCase()}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>📅 {h.date} {h.startTime} - {h.endTime}</span>
                      <span>👩‍⚕️ {h.outgoingNurse} → {h.incomingNurse}</span>
                      <span>👥 {h.patients.length} patients</span>
                    </div>
                    {h.criticalAlerts.length > 0 && (
                      <div className="mt-1 flex gap-1">
                        {h.criticalAlerts.map((a, i) => <span key={i} className="rounded bg-red-50 px-1.5 text-[10px] font-bold text-red-600">🚨 {a}</span>)}
                      </div>
                    )}
                  </div>
                  <span className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                </div>

                {isExpanded && (
                  <div className="mt-4 border-t pt-4 space-y-4">
                    {/* Patients */}
                    <div>
                      <h4 className="font-bold text-xs text-slate-600 mb-2">👥 Patient Handover ({h.patients.length})</h4>
                      <div className="space-y-2">
                        {h.patients.map((p, i) => (
                          <div key={i} className={`rounded-lg p-3 ${p.criticalAlerts.length > 0 ? 'bg-red-50 border border-red-200' : 'bg-slate-50'}`}>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-800">{p.name}</span>
                              <span className="rounded bg-slate-200 px-1.5 text-[10px] font-bold">{p.bed}</span>
                              <Badge tone={p.criticalAlerts.length > 0 ? 'red' : 'green'}>{p.status}</Badge>
                            </div>
                            <div className="text-xs text-slate-600 mt-1">{p.diagnosis}</div>
                            <div className="text-xs text-slate-500 mt-1">📝 {p.notes}</div>
                            {p.pendingTasks.length > 0 && (
                              <div className="mt-2">
                                <span className="text-[10px] font-bold text-slate-400">PENDING:</span>
                                <ul className="list-disc list-inside text-[10px] text-slate-600">{p.pendingTasks.map((t, j) => <li key={j}>{t}</li>)}</ul>
                              </div>
                            )}
                            {p.criticalAlerts.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {p.criticalAlerts.map((a, j) => <span key={j} className="rounded bg-red-100 px-1.5 text-[10px] font-bold text-red-600">🚨 {a}</span>)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <h4 className="font-bold text-xs text-slate-600 mb-1">📋 Pending Tasks</h4>
                        <ul className="list-disc list-inside text-xs text-slate-600 bg-slate-50 rounded p-2">
                          {h.pendingTasks.map((t, i) => <li key={i}>{t}</li>)}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-600 mb-1">🚨 Critical Alerts</h4>
                        {h.criticalAlerts.length > 0 ? (
                          <ul className="list-disc list-inside text-xs text-red-600 bg-red-50 rounded p-2">
                            {h.criticalAlerts.map((a, i) => <li key={i}>{a}</li>)}
                          </ul>
                        ) : <p className="text-xs text-slate-400 bg-slate-50 rounded p-2">No critical alerts</p>}
                      </div>
                    </div>

                    {h.equipmentIssues.length > 0 && (
                      <div>
                        <h4 className="font-bold text-xs text-slate-600 mb-1">🔧 Equipment Issues</h4>
                        <ul className="list-disc list-inside text-xs text-amber-600 bg-amber-50 rounded p-2">
                          {h.equipmentIssues.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                      </div>
                    )}

                    <div className="rounded-lg bg-blue-50 p-2 text-xs text-blue-700">👤 Staffing Notes: {h.staffingNotes}</div>

                    <div className="flex gap-2">
                      <Button className="bg-green-600 hover:bg-green-700 text-xs">✅ Accept Handover</Button>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-xs">🖨️ Print Handover</Button>
                      <Button className="bg-slate-100 text-slate-700 text-xs">📤 Send Report</Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <Card className="p-6 text-center">
          <div className="text-4xl mb-3">📜</div>
          <h3 className="font-bold text-lg text-slate-800">Handover History</h3>
          <p className="mt-2 text-sm text-slate-500">Previous shift handover records are archived here for audit and reference.</p>
          <div className="mt-4 rounded-lg bg-slate-50 p-4 text-left text-xs text-slate-600">
            <p>Historical handovers can be viewed by date range, ward, and shift. All completed handovers are stored for:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Regulatory compliance audits</li>
              <li>Patient safety investigations</li>
              <li>Staff performance reviews</li>
              <li>Quality improvement analysis</li>
            </ul>
          </div>
        </Card>
      )}

      {/* Templates Tab */}
      {tab === 'templates' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {['Nursing Handover', 'Doctor-to-Doctor Handover', 'ICU Critical Care Handover', 'Emergency Department Handover'].map((name, i) => (
            <Card key={i} className="p-4">
              <h3 className="font-bold text-sm text-slate-800">{name}</h3>
              <p className="text-xs text-slate-500 mt-1">Standardized template for {name.toLowerCase()} documentation.</p>
              <div className="mt-3 flex gap-2">
                <Button className="bg-blue-600 hover:bg-blue-700 text-xs">📝 Use Template</Button>
                <Button className="bg-slate-100 text-slate-700 text-xs">✏️ Edit</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
