import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Button } from '../../components/ui';

interface CodeEvent {
  id: string;
  codeType: string;
  location: string;
  triggeredAt: string;
  triggeredBy: string;
  respondedAt?: string;
  firstResponseTime?: string;
  teamLead: string;
  teamMembers: string[];
  outcome: 'ROSC' | 'Nail' | 'Transferred' | 'Ongoing' | 'Family Requested Cessation';
  patientName?: string;
  duration: string;
  aedShocks: number;
  epinephrineDoses: number;
  notes: string;
}

const CODE_EVENTS: CodeEvent[] = [
  {
    id: 'CB-2026-001', codeType: 'Code Blue (Cardiac Arrest)', location: 'Ward 3 — Bed 12',
    triggeredAt: '2026-08-24 08:45', triggeredBy: 'Sr. Akosua Mensah (Nurse)',
    respondedAt: '2026-08-24 08:46', firstResponseTime: '1 min', teamLead: 'Dr. Yaw Boateng',
    teamMembers: ['Sr. Abena Osei (ICU)', 'Sr. Nana Agyei', 'Pharm. Kofi Adjei'],
    outcome: 'ROSC', patientName: 'Mr. Kweku Amoako', duration: '22 min',
    aedShocks: 2, epinephrineDoses: 4,
    notes: 'VF initially, converted after 2 shocks. ROSC achieved. Transferred to ICU.'
  },
  {
    id: 'CB-2026-002', codeType: 'Code Blue (Respiratory Arrest)', location: 'OPD — Waiting Area',
    triggeredAt: '2026-08-23 14:20', triggeredBy: 'Security Guard',
    respondedAt: '2026-08-23 14:21', firstResponseTime: '1 min', teamLead: 'Dr. Akua Mensah',
    teamMembers: ['Sr. Priscilla Aidoo', 'Sr. Esi Amoako'],
    outcome: 'ROSC', patientName: 'Mrs. Adwoa Serwaa', duration: '15 min',
    aedShocks: 0, epinephrineDoses: 1,
    notes: 'Anaphylaxis secondary to penicillin. Airway obstruction relieved. Responded to adrenaline.'
  },
  {
    id: 'CB-2026-003', codeType: 'Code Blue (Paediatric)', location: 'Paediatric Ward — Bed 5',
    triggeredAt: '2026-08-22 03:15', triggeredBy: 'Night Nurse',
    respondedAt: '2026-08-22 03:16', firstResponseTime: '1 min', teamLead: 'Dr. Akua Mensah',
    teamMembers: ['Sr. Abena Osei', 'Sr. Yaw Kuffour'],
    outcome: 'Transferred', patientName: 'Kwabena (Age 3)', duration: '35 min',
    aedShocks: 1, epinephrineDoses: 3,
    notes: 'Severe malaria with cardiac arrest. Transferred to ICU on ventilator.'
  },
  {
    id: 'CB-2026-004', codeType: 'Code Blue (Cardiac Arrest)', location: 'Surgical Ward — Bed 8',
    triggeredAt: '2026-08-20 11:30', triggeredBy: 'Ward Nurse',
    respondedAt: '2026-08-20 11:33', firstResponseTime: '3 min', teamLead: 'Dr. Kwame Asante',
    teamMembers: ['Sr. Nana Agyei', 'Pharm. Kofi Adjei', 'Sr. Akosua Mensah'],
    outcome: 'Nail', patientName: 'Mr. Yaw Frimpong (Post-op)', duration: '45 min',
    aedShocks: 6, epinephrineDoses: 8,
    notes: 'PEA arrest post-abdominal surgery. Massive PE suspected. Despite full ACLS protocol, unable to achieve ROSC. TOD 12:15.'
  },
  {
    id: 'CB-2026-005', codeType: 'Code Pink (Infant Abduction)', location: 'Maternity Ward',
    triggeredAt: '2026-08-19 09:00', triggeredBy: 'Automated Alert',
    respondedAt: '2026-08-19 09:01', firstResponseTime: '1 min', teamLead: 'Security Manager',
    teamMembers: ['All Security', 'Maternity Staff'],
    outcome: 'Family Requested Cessation', duration: '10 min',
    aedShocks: 0, epinephrineDoses: 0,
    notes: 'False alarm — mother took baby for weighing without informing nurse. Protocol review initiated.'
  }
];

interface CodeTeamMember {
  name: string;
  role: string;
  specialization: string;
  contactStatus: 'Available' | 'On-Call' | 'In-Hospital' | 'Unavailable';
  lastDrill: string;
  certifications: string[];
}

const CODE_TEAM: CodeTeamMember[] = [
  { name: 'Dr. Kwame Asante', role: 'Code Team Lead', specialization: 'Emergency Medicine', contactStatus: 'In-Hospital', lastDrill: '2026-08-01', certifications: ['ACLS', 'ATLS', 'BLS'] },
  { name: 'Dr. Akua Mensah', role: 'Team Member', specialization: 'Paediatrics', contactStatus: 'Available', lastDrill: '2026-08-01', certifications: ['ACLS', 'NRP', 'BLS'] },
  { name: 'Dr. Yaw Boateng', role: 'Team Member', specialization: 'Internal Medicine', contactStatus: 'On-Call', lastDrill: '2026-07-15', certifications: ['ACLS', 'BLS'] },
  { name: 'Sr. Abena Osei', role: 'Code Nurse', specialization: 'Critical Care', contactStatus: 'In-Hospital', lastDrill: '2026-08-01', certifications: ['ACLS', 'PALS', 'BLS'] },
  { name: 'Sr. Nana Agyei', role: 'Code Nurse', specialization: 'Emergency', contactStatus: 'In-Hospital', lastDrill: '2026-08-01', certifications: ['ACLS', 'BLS'] },
  { name: 'Pharm. Kofi Adjei', role: 'Code Pharmacist', specialization: 'Emergency Pharmacy', contactStatus: 'Available', lastDrill: '2026-07-20', certifications: ['ACLS', 'BLS'] },
];

const CODE_TYPES = [
  { code: 'Code Blue', description: 'Cardiac/Respiratory Arrest', color: 'bg-blue-600' },
  { code: 'Code Red', description: 'Fire Emergency', color: 'bg-red-600' },
  { code: 'Code Pink', description: 'Infant Abduction', color: 'bg-pink-600' },
  { code: 'Code Grey', description: 'Combative/Violent Person', color: 'bg-gray-600' },
  { code: 'Code Silver', description: 'Active Shooter', color: 'bg-gray-800' },
  { code: 'Code Orange', description: 'Hazmat Spill', color: 'bg-orange-600' },
  { code: 'Code Yellow', description: 'Bomb Threat', color: 'bg-yellow-600' },
  { code: 'Code Black', description: 'Severe Weather', color: 'bg-black' },
];

interface Drill {
  id: string;
  type: string;
  date: string;
  participants: number;
  score: number;
  responseTime: string;
  notes: string;
}

const DRILLS: Drill[] = [
  { id: 'DR-001', type: 'Code Blue', date: '2026-08-01', participants: 8, score: 92, responseTime: '1:15', notes: 'Excellent teamwork, good compression quality' },
  { id: 'DR-002', type: 'Code Red', date: '2026-07-15', participants: 25, score: 88, responseTime: '2:30', notes: 'Evacuation smooth, fire extinguisher access slow' },
  { id: 'DR-003', type: 'Code Blue', date: '2026-07-01', participants: 6, score: 85, responseTime: '1:45', notes: 'Medication delays, improved team communication' },
  { id: 'DR-004', type: 'Code Pink', date: '2026-06-15', participants: 15, score: 78, responseTime: '3:00', notes: 'Door security response slow, staff confusion on roles' },
];

export default function CodeBlueEmergency() {
  const [activeTab, setActiveTab] = useState<'events' | 'team' | 'types' | 'drills'>('events');
  const [selectedEvent, setSelectedEvent] = useState<CodeEvent | null>(CODE_EVENTS[0] ?? null);
  const [isActivating, setIsActivating] = useState(false);

  const avgResponseTime = '1.4 min';
  const roscRate = Math.round((CODE_EVENTS.filter(e => e.outcome === 'ROSC').length / CODE_EVENTS.length) * 100);

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
          title="Add New Code Blue Alert"
          fields={[{"name":"location","label":"Location/Ward","type":"text","required":true},{"name":"patientName","label":"Patient Name","type":"text"},{"name":"codeType","label":"Code Type","type":"select","options":["Code Blue (Cardiac)","Code Red (Fire)","Code Pink (Paediatric)","Code Grey (Combative)","Code Silver (Active Threat)","Code Yellow (Bomb Threat)"]},{"name":"respondersNeeded","label":"Responders Needed","type":"number"},{"name":"notes","label":"Notes","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Code Blue Emergency System</h1>
          <p className="text-gray-500">Code team activation, response tracking, and emergency drill management</p>
        </div>
        <Button onClick={() => setIsActivating(!isActivating)}
          className={`${isActivating ? 'bg-red-700 animate-pulse' : 'bg-blue-600'} text-white font-bold px-6 py-3 text-lg`}>
          {isActivating ? '🚨 CODE ACTIVATED — Click to Deactivate' : '🚨 ACTIVATE CODE BLUE'}
        </Button>
      </div>

      {isActivating && (
        <div className="bg-red-600 text-white rounded-xl p-6 animate-pulse">
          <div className="text-center">
            <div className="text-4xl font-black mb-2">🚨 CODE BLUE ACTIVATED 🚨</div>
            <div className="text-xl">All cardiac arrest teams respond immediately</div>
            <div className="text-sm mt-2">Activated at: {new Date().toLocaleTimeString()} | Location: Select from overhead</div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              {CODE_TEAM.filter(m => m.contactStatus === 'In-Hospital').map((m, i) => (
                <div key={i} className="bg-white/20 rounded-lg p-3 text-center">
                  <div className="font-bold">{m.name}</div>
                  <div className="text-sm">{m.role}</div>
                  <div className="text-xs">📞 Called ✓</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Codes', value: CODE_EVENTS.length, color: 'text-blue-600' },
          { label: 'ROSC Rate', value: `${roscRate}%`, color: 'text-green-600' },
          { label: 'Avg Response', value: avgResponseTime, color: 'text-purple-600' },
          { label: 'Team Members', value: CODE_TEAM.length, color: 'text-orange-600' },
          { label: 'Drills (YTD)', value: DRILLS.length, color: 'text-teal-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {(['events', 'team', 'types', 'drills'] as const).map(tab => (
          <Button key={tab} variant={activeTab === tab ? 'primary' : 'outline'} size="sm"
            onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </div>

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {CODE_EVENTS.map(event => (
              <div key={event.id} onClick={() => setSelectedEvent(event)}
                className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${
                  selectedEvent?.id === event.id ? 'border-blue-500 shadow-md' : ''
                }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-white text-[10px] ${
                        event.codeType.includes('Blue') ? 'bg-blue-600' :
                        event.codeType.includes('Pink') ? 'bg-pink-600' : 'bg-gray-600'
                      }`}>{(event.codeType.split('(')[0] ?? '').trim()}</Badge>
                      <span className="font-bold">{event.id}</span>
                    </div>
                    <div className="text-sm mt-1">📍 {event.location}</div>
                    {event.patientName && <div className="text-sm text-gray-500">👤 {event.patientName}</div>}
                  </div>
                  <div className="text-right">
                    <Badge className={`text-[10px] ${
                      event.outcome === 'ROSC' ? 'bg-green-100 text-green-800' :
                      event.outcome === 'Nail' ? 'bg-red-100 text-red-800' :
                      event.outcome === 'Ongoing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>{event.outcome}</Badge>
                    <div className="text-xs text-gray-400 mt-1">{event.triggeredAt}</div>
                  </div>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span>⏱ Response: {event.firstResponseTime}</span>
                  <span>⏱ Duration: {event.duration}</span>
                  <span>⚡ {event.aedShocks} shocks</span>
                  <span>💉 {event.epinephrineDoses} epi</span>
                </div>
              </div>
            ))}
          </div>

          {/* Event Detail */}
          <div className="lg:col-span-1">
            {selectedEvent && (
              <div className="bg-white border rounded-xl p-4 space-y-4 sticky top-4">
                <div>
                  <h2 className="font-bold">{selectedEvent.id}</h2>
                  <Badge className={`text-white text-xs mt-1 ${
                    selectedEvent.codeType.includes('Blue') ? 'bg-blue-600' : 'bg-pink-600'
                  }`}>{selectedEvent.codeType}</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div><span className="text-gray-500">Location:</span> {selectedEvent.location}</div>
                  <div><span className="text-gray-500">Patient:</span> {selectedEvent.patientName || 'N/A'}</div>
                  <div><span className="text-gray-500">Triggered:</span> {selectedEvent.triggeredAt}</div>
                  <div><span className="text-gray-500">By:</span> {selectedEvent.triggeredBy}</div>
                  <div><span className="text-gray-500">First Response:</span> {selectedEvent.firstResponseTime}</div>
                  <div><span className="text-gray-500">Team Lead:</span> {selectedEvent.teamLead}</div>
                  <div><span className="text-gray-500">Duration:</span> {selectedEvent.duration}</div>
                  <div><span className="text-gray-500">Outcome:</span> <Badge className={`text-xs ${
                    selectedEvent.outcome === 'ROSC' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>{selectedEvent.outcome}</Badge></div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">Team</div>
                  {selectedEvent.teamMembers.map((m, i) => (
                    <div key={i} className="text-xs flex items-center gap-1">
                      <span className="text-blue-500">👤</span> {m}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">Interventions</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-blue-50 rounded p-2 text-center">
                      <div className="text-lg font-bold text-blue-600">{selectedEvent.aedShocks}</div>
                      <div className="text-[10px]">AED Shocks</div>
                    </div>
                    <div className="bg-red-50 rounded p-2 text-center">
                      <div className="text-lg font-bold text-red-600">{selectedEvent.epinephrineDoses}</div>
                      <div className="text-[10px]">Epinephrine</div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-600">Notes</div>
                  <div className="text-sm text-gray-700 mt-1">{selectedEvent.notes}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CODE_TEAM.map((member, i) => (
            <div key={i} className="bg-white border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold">{member.name}</div>
                  <div className="text-sm text-gray-500">{member.role}</div>
                  <div className="text-xs text-gray-400">{member.specialization}</div>
                </div>
                <Badge className={`text-[10px] ${
                  member.contactStatus === 'Available' ? 'bg-green-100 text-green-800' :
                  member.contactStatus === 'In-Hospital' ? 'bg-blue-100 text-blue-800' :
                  member.contactStatus === 'On-Call' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>{member.contactStatus}</Badge>
              </div>
              <div className="flex gap-1 mt-2 flex-wrap">
                {member.certifications.map(c => <Badge key={c} className="text-[10px] bg-purple-100 text-purple-700">{c}</Badge>)}
              </div>
              <div className="text-xs text-gray-400 mt-2">Last Drill: {member.lastDrill}</div>
            </div>
          ))}
        </div>
      )}

      {/* Types Tab */}
      {activeTab === 'types' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {CODE_TYPES.map((code, i) => (
            <div key={i} className={`${code.color} text-white rounded-xl p-6 text-center`}>
              <div className="text-2xl font-black mb-2">{code.code}</div>
              <div className="text-sm opacity-90">{code.description}</div>
              <Button className="mt-4 bg-white/20 hover:bg-white/30 text-white border-white/30">
                Activate {code.code.split(' ')[1]}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Drills Tab */}
      {activeTab === 'drills' && (
        <div className="space-y-3">
          {DRILLS.map(drill => (
            <div key={drill.id} className="bg-white border rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="text-[10px] bg-blue-100 text-blue-800">{drill.type}</Badge>
                  <span className="font-bold">{drill.id}</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">{drill.notes}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">{drill.score}%</div>
                <div className="text-xs text-gray-500">{drill.participants} participants</div>
                <div className="text-xs text-gray-500">Response: {drill.responseTime}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
