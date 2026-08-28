import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface HandoverNote {
  id: string; ward: string; shift: string; nurse: string;
  criticalPatients: number; pendingActions: string[];
  completedActions: string[];
  escalationNeeded: boolean;
  timestamp: string;
}

const HANDOVERS: HandoverNote[] = [
  { id: 'HN-001', ward: 'ICU', shift: 'Morning → Afternoon', nurse: 'Sr. Ama Mensah → Sr. Efua Owusu', criticalPatients: 3, pendingActions: ['Ventilator weaning assessment at 15:00', 'Blood culture results expected', 'Family meeting at 16:00 for Bed 3', 'Prepare for inter-facility transfer'], completedActions: ['Morning vital signs documented', 'Medications administered', 'Wound dressing changed'], escalationNeeded: true, timestamp: '14:45' },
  { id: 'HN-002', ward: 'Surgery', shift: 'Morning → Afternoon', nurse: 'Sr. Kofi Appiah → Sr. Abena Darko', criticalPatients: 1, pendingActions: ['Post-op pain assessment at 15:00', 'Drain output monitoring q1h', 'DVT prophylaxis due at 16:00'], completedActions: ['Surgical wound inspection done', 'IV fluids running well', 'Pain score 3/10 maintained'], escalationNeeded: false, timestamp: '14:30' },
  { id: 'HN-003', ward: 'Medicine', shift: 'Morning → Afternoon', nurse: 'Sr. Nana Osei → Sr. Grace Amoah', criticalPatients: 2, pendingActions: ['IV antibiotic timing for Bed 12', 'Blood transfusion due at 15:00', 'Diabetic patient BG monitoring q4h'], completedActions: ['All morning medications given', 'Patient education completed', 'Discharge paperwork started'], escalationNeeded: true, timestamp: '14:30' },
];

export default function WardHandoverProtocol() {
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
          title="Add New Handover Protocol"
          fields={[{"name":"ward","label":"Ward","type":"select","options":["Medical","Surgical","Paediatric","Maternity","ICU","NICU"],"required":true},{"name":"shift","label":"Shift","type":"select","options":["Day (7am-3pm)","Evening (3pm-11pm)","Night (11pm-7am)"],"required":true},{"name":"outgoingNurse","label":"Outgoing Nurse","type":"text"},{"name":"incomingNurse","label":"Incoming Nurse","type":"text"},{"name":"notes","label":"Handover Notes","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Ward Handover Protocol</h1><p className="text-gray-500">SBAR standardised handover, shift checklists, and communication tracking</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Wards Handing Over', value: HANDOVERS.length, color: 'text-blue-600' }, { label: 'Critical Patients', value: HANDOVERS.reduce((s, h) => s + h.criticalPatients, 0), color: 'text-red-600' }, { label: 'Escalations', value: HANDOVERS.filter(h => h.escalationNeeded).length, color: 'text-yellow-600' }, { label: 'Pending Actions', value: HANDOVERS.reduce((s, h) => s + h.pendingActions.length, 0), color: 'text-orange-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="bg-white rounded-lg border p-5 mb-4">
        <h3 className="font-semibold mb-3">SBAR Framework</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[{ letter: 'S', title: 'Situation', desc: 'What is happening right now?', color: 'bg-blue-100 text-blue-800' }, { letter: 'B', title: 'Background', desc: 'What is the clinical context?', color: 'bg-green-100 text-green-800' }, { letter: 'A', title: 'Assessment', desc: 'What do I think the problem is?', color: 'bg-yellow-100 text-yellow-800' }, { letter: 'R', title: 'Recommendation', desc: 'What would I recommend?', color: 'bg-red-100 text-red-800' }].map(s => (
            <div key={s.letter} className={`${s.color} rounded-lg p-3 text-center`}><div className="text-2xl font-bold">{s.letter}</div><div className="font-semibold text-sm">{s.title}</div><div className="text-xs">{s.desc}</div></div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {HANDOVERS.map(h => (
          <div key={h.id} className={`bg-white rounded-lg border p-5 ${h.escalationNeeded ? 'border-yellow-300' : ''}`}>
            <div className="flex items-center justify-between mb-3"><div><span className="font-bold">{h.ward}</span><span className="text-sm text-gray-500 ml-2">{h.shift}</span></div><div className="flex items-center gap-2">{h.escalationNeeded && <Badge className="bg-yellow-100 text-yellow-800">⚠️ Escalation Needed</Badge>}<span className="text-xs text-gray-500">{h.timestamp}</span></div></div>
            <div className="text-sm text-gray-600 mb-3">Nurses: {h.nurse}</div>
            <div className="grid grid-cols-2 gap-4">
              <div><h4 className="font-semibold text-sm mb-2 text-red-600">📋 Pending Actions ({h.pendingActions.length})</h4><div className="space-y-1">{h.pendingActions.map((a, i) => <div key={i} className="text-sm bg-yellow-50 border border-yellow-200 rounded p-2">⬜ {a}</div>)}</div></div>
              <div><h4 className="font-semibold text-sm mb-2 text-green-600">✅ Completed ({h.completedActions.length})</h4><div className="space-y-1">{h.completedActions.map((a, i) => <div key={i} className="text-sm bg-green-50 border border-green-200 rounded p-2">✅ {a}</div>)}</div></div>
            </div>
            <div className="mt-2 text-sm"><span className="text-gray-500">Critical Patients:</span> <span className="font-bold text-red-600">{h.criticalPatients}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}
