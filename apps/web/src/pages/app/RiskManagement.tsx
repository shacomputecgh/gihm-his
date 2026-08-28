import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface Incident {
  id: string; title: string; category: string; severity: string;
  department: string; reportedBy: string; reportDate: string;
  description: string; rootCause: string; correctiveActions: string[];
  status: 'Reported' | 'Investigation' | 'Corrective Action' | 'Closed' | 'Serious Incident';
}

const INCIDENTS: Incident[] = [
  { id: 'INC-2026-001', title: 'Wrong-site medication administration', category: 'Medication Error',
    severity: 'High', department: 'Ward 3', reportedBy: 'Sr. Abena Osei', reportDate: '2026-08-24',
    description: 'Patient received Warfarin instead of Aspirin. Medication stored in incorrect location. Nurse did not check patient wristband.',
    rootCause: 'Look-alike packaging. Stock rotation error. Staff did not follow 5 Rights protocol.',
    correctiveActions: ['Relocate look-alike medications apart', 'Implement tall-man lettering on labels', 'Mandatory 5 Rights training for all nursing staff', 'Medication reconciliation at shift change'],
    status: 'Investigation'
  },
  { id: 'INC-2026-002', title: 'Patient fall — ward environment', category: 'Patient Fall',
    severity: 'Medium', department: 'Medical Ward', reportedBy: 'Sr. Esi Amoako', reportDate: '2026-08-23',
    description: 'Elderly patient fell while walking to bathroom at night. Bed alarm not activated. Lighting inadequate in corridor.',
    rootCause: 'Inadequate fall risk assessment. Bed alarm not activated despite high fall risk documented.',
    correctiveActions: ['Mandatory bed alarm activation for high-risk patients', 'Improve corridor lighting', 'Hourly rounding for high-risk patients', 'Reassess fall risk tool compliance'],
    status: 'Corrective Action'
  },
  { id: 'INC-2026-003', title: 'Equipment malfunction — ventilator alarm failure', category: 'Equipment',
    severity: 'Critical', department: 'ICU', reportedBy: 'Sr. Nana Agyei', reportDate: '2026-08-22',
    description: 'Ventilator high-pressure alarm failed to sound during mucus plugging event. Patient desaturated before detection.',
    rootCause: 'Scheduled preventive maintenance overdue by 2 weeks. Alarm system not tested at shift start.',
    correctiveActions: ['Immediate ventilator service by vendor', 'Daily alarm check at shift start', 'Preventive maintenance schedule compliance audit', 'Backup ventilator protocol for equipment failure'],
    status: 'Serious Incident'
  },
  { id: 'INC-2026-004', title: 'Near-miss — wrong blood transfusion', category: 'Blood Transfusion',
    severity: 'Critical', department: 'Blood Bank', reportedBy: 'Lab. Nana Agyeman', reportDate: '2026-08-21',
    description: 'Blood bag for patient A was brought to patient B. Caught at bedside during final check by nurse.',
    rootCause: 'Blood bank courier delivered to wrong bed. Similar patient names on same ward.',
    correctiveActions: ['Colour-coded patient wristbands for transfusion', 'Double-check blood transfusion protocol', 'Blood bank courier retraining', 'Unique patient identifier verification at bedside'],
    status: 'Investigation'
  },
  { id: 'INC-2026-005', title: 'Hand hygiene compliance below target', category: 'Infection Control',
    severity: 'Low', department: 'OPD', reportedBy: 'Sr. Priscilla Aidoo', reportDate: '2026-08-20',
    description: 'Hand hygiene compliance at 78% — below 85% target. Observed 22 breaches in 100 opportunities.',
    rootCause: 'Busy clinic hours. Insufficient alcohol gel dispensers. Staff knowledge gaps.',
    correctiveActions: ['Install additional gel dispensers', 'Hand hygiene champion programme', 'Monthly compliance reports to departments', 'Refresher training for non-compliant staff'],
    status: 'Corrective Action'
  }
];

const STATUS_STYLES: Record<string, string> = {
  'Reported': 'bg-blue-100 text-blue-800', 'Investigation': 'bg-yellow-100 text-yellow-800',
  'Corrective Action': 'bg-orange-100 text-orange-800', 'Closed': 'bg-gray-100 text-gray-800',
  'Serious Incident': 'bg-red-100 text-red-800',
};
const SEVERITY_STYLES: Record<string, string> = {
  'Critical': 'bg-red-100 text-red-800', 'High': 'bg-orange-100 text-orange-800',
  'Medium': 'bg-yellow-100 text-yellow-800', 'Low': 'bg-blue-100 text-blue-800',
};

export default function RiskManagement() {
  const [selected, setSelected] = useState<Incident | null>(INCIDENTS[0] ?? null);
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
          title="Add New Risk Record"
          fields={[{"name":"riskTitle","label":"Risk Title","type":"text","required":true},{"name":"riskCategory","label":"Category","type":"select","options":["Clinical","Operational","Financial","Legal","Reputational","Safety"]},{"name":"likelihood","label":"Likelihood","type":"select","options":["Rare","Unlikely","Possible","Likely","Almost Certain"]},{"name":"impact","label":"Impact","type":"select","options":["Negligible","Minor","Moderate","Major","Catastrophic"]},{"name":"mitigation","label":"Mitigation Measures","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div><h1 className="text-2xl font-bold">Risk Management</h1><p className="text-gray-500">Incident reporting, patient safety, root cause analysis, and risk mitigation</p></div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[{ label: 'Total Incidents', value: INCIDENTS.length, color: 'text-blue-600' },
          { label: 'Critical', value: INCIDENTS.filter(i=>i.severity==='Critical').length, color: 'text-red-600' },
          { label: 'Open', value: INCIDENTS.filter(i=>i.status!=='Closed').length, color: 'text-yellow-600' },
          { label: 'Investigations', value: INCIDENTS.filter(i=>i.status==='Investigation').length, color: 'text-orange-600' },
          { label: 'Categories', value: new Set(INCIDENTS.map(i=>i.category)).size, color: 'text-purple-600' },
        ].map((s,i) => <div key={i} className="bg-white rounded-lg border p-3 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {INCIDENTS.map(inc => (
            <div key={inc.id} onClick={() => setSelected(inc)} className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${selected?.id===inc.id?'border-blue-500 shadow-md':''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2"><span className="font-bold">{inc.id}</span><Badge className={`text-[10px] ${STATUS_STYLES[inc.status]}`}>{inc.status}</Badge><Badge className={`text-[10px] ${SEVERITY_STYLES[inc.severity]}`}>{inc.severity}</Badge></div>
                  <div className="text-sm text-gray-500">{inc.title}</div>
                  <div className="text-xs text-gray-400 mt-1">{inc.department} — {inc.category}</div>
                </div>
                <div className="text-right text-xs text-gray-400"><div>{inc.reportDate}</div><div>{inc.reportedBy}</div></div>
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-1">
          {selected && (
            <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
              <div><h2 className="font-bold text-lg">{selected.id}</h2><p className="text-sm text-blue-600">{selected.title}</p></div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1"><div><span className="text-gray-500">Category:</span> {selected.category}</div><div><span className="text-gray-500">Department:</span> {selected.department}</div><div><span className="text-gray-500">Reported by:</span> {selected.reportedBy}</div></div>
              <div><div className="text-sm font-medium text-gray-600 mb-1">Description</div><div className="text-sm">{selected.description}</div></div>
              <div className="bg-red-50 rounded-lg p-3"><div className="text-sm font-medium text-red-700 mb-1">Root Cause</div><div className="text-sm text-red-600">{selected.rootCause}</div></div>
              <div><div className="text-sm font-medium text-gray-600 mb-1">Corrective Actions ({selected.correctiveActions.length})</div>{selected.correctiveActions.map((a,i)=><div key={i} className="text-xs flex items-center gap-1 mb-1"><span className="text-green-500">🎯</span> {a}</div>)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
