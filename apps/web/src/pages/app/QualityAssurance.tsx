import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Button, Card, PageHeader } from '../../components/ui';

type QATab = 'incidents' | 'complaints' | 'near-misses' | 'analytics';

interface Incident {
  id: string;
  date: string;
  time: string;
  reportedBy: string;
  department: string;
  category: 'medication' | 'surgical' | 'fall' | 'infection' | 'equipment' | 'documentation' | 'communication' | 'other';
  severity: 'minor' | 'moderate' | 'major' | 'sentinel';
  description: string;
  immediateActions: string;
  rootCause?: string;
  correctiveActions?: string[];
  status: 'reported' | 'investigating' | 'action-planned' | 'resolved' | 'closed';
  patientInvolved: boolean;
  patientName?: string;
  followUpDate?: string;
}

interface Complaint {
  id: string;
  date: string;
  receivedBy: string;
  department: string;
  category: 'service' | 'wait-time' | 'staff-behaviour' | 'facility' | 'billing' | 'privacy' | 'other';
  severity: 'low' | 'medium' | 'high';
  complainant: string;
  contactPhone: string;
  description: string;
  status: 'received' | 'acknowledged' | 'investigating' | 'resolved' | 'closed';
  resolution?: string;
  feedbackToComplainant?: string;
  satisfactionScore?: number;
}

const MOCK_INCIDENTS: Incident[] = [
  { id: 'INC001', date: '2026-05-23', time: '09:15', reportedBy: 'Nurse Ama', department: 'Medical', category: 'medication', severity: 'moderate', description: 'Wrong dose administered — patient received 500mg Paracetamol instead of prescribed 1g. Discovered during nurse handover check.', immediateActions: 'Patient monitored. No adverse effects. Doctor notified. Incident form completed.', rootCause: 'Dose label was partially obscured on unit-dose packaging', correctiveActions: ['Update medication labelling protocol', 'Implement double-check for all IV medications', 'Staff re-education on dose verification'], status: 'investigating', patientInvolved: true, patientName: 'Kwame Asante', followUpDate: '2026-05-25' },
  { id: 'INC002', date: '2026-05-22', time: '14:30', reportedBy: 'Dr. Boateng', department: 'Surgical', category: 'equipment', severity: 'minor', description: 'Electrosurgical unit malfunction during minor procedure. Unit was restarted and procedure completed without complication.', immediateActions: 'Equipment isolated. Backup unit used. Biomedical engineering notified.', status: 'resolved', patientInvolved: true, patientName: 'Test Patient' },
  { id: 'INC003', date: '2026-05-21', time: '03:45', reportedBy: 'Nurse Kofi', department: 'Paediatrics', category: 'fall', severity: 'major', description: '2-year-old patient fell from bed despite side rails being raised. Patient sustained minor bruising to forehead.', immediateActions: 'Patient assessed — no head injury. CT head ordered as precaution. Parents notified. Incident form completed.', rootCause: 'Side rail mechanism was faulty — did not lock properly', correctiveActions: ['Replace faulty side rails', 'Bed check protocol reinforced', 'Hourly rounding for paediatric patients'], status: 'action-planned', patientInvolved: true, patientName: 'Kofi Asante Jr.', followUpDate: '2026-05-24' },
  { id: 'INC004', date: '2026-05-20', time: '11:00', reportedBy: 'Dr. Osei', department: 'Obstetrics', category: 'documentation', severity: 'minor', description: 'Incomplete consent form — missing patient signature on procedure consent for elective C-section.', immediateActions: 'Consent form corrected and re-signed by patient.', status: 'closed', patientInvolved: true, patientName: 'Efua Mensah' },
];

const MOCK_COMPLAINTS: Complaint[] = [
  { id: 'CMP001', date: '2026-05-22', receivedBy: 'Admin Officer', department: 'Emergency', category: 'wait-time', severity: 'medium', complainant: 'Mr. John Mensah', contactPhone: '024-123-4567', description: 'Patient waited over 4 hours in the emergency department before being seen by a doctor. Complainant is the patient\'s son.', status: 'investigating', satisfactionScore: 2 },
  { id: 'CMP002', date: '2026-05-21', receivedBy: 'Nurse Manager', department: 'Medical', category: 'staff-behaviour', severity: 'high', complainant: 'Mrs. Grace Osei', contactPhone: '020-987-6543', description: 'Nurse was rude and dismissive when patient asked for pain medication. Patient felt disrespected.', status: 'resolved', resolution: 'Counselling session with nurse conducted. Apology letter sent to patient.', feedbackToComplainant: 'We sincerely apologize for the experience. Corrective action has been taken.', satisfactionScore: 3 },
  { id: 'CMP003', date: '2026-05-20', receivedBy: 'Billing Officer', department: 'Billing', category: 'billing', severity: 'low', complainant: 'Mr. Samuel Koomson', contactPhone: '055-456-7890', description: 'Overcharged for laboratory tests. Patient was billed for tests that were not performed.', status: 'resolved', resolution: 'Billing corrected. Refund of GH₵ 150 processed.', feedbackToComplainant: 'Refund processed. Please check your account within 3 business days.', satisfactionScore: 4 },
];

const INCIDENT_CATEGORIES: Record<string, { icon: string; color: string }> = {
  medication: { icon: '💊', color: 'text-red-600' },
  surgical: { icon: '🏥', color: 'text-purple-600' },
  fall: { icon: '⚠️', color: 'text-orange-600' },
  infection: { icon: '🦠', color: 'text-pink-600' },
  equipment: { icon: '🔧', color: 'text-blue-600' },
  documentation: { icon: '📋', color: 'text-slate-600' },
  communication: { icon: '💬', color: 'text-cyan-600' },
  other: { icon: '❓', color: 'text-gray-600' },
};

export default function QualityAssurance() {
  
  const [tab, setTab] = useState<QATab>('incidents');
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);

  const severityConfig = { minor: { label: 'Minor', tone: 'gold' as const, color: 'bg-yellow-50 text-yellow-700' }, moderate: { label: 'Moderate', tone: 'blue' as const, color: 'bg-blue-50 text-blue-700' }, major: { label: 'Major', tone: 'red' as const, color: 'bg-red-50 text-red-700' }, sentinel: { label: 'Sentinel', tone: 'red' as const, color: 'bg-red-600 text-white' } };

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
          title="Add New QA Record"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Quality Assurance" subtitle="Incident reporting, complaint management, near-miss tracking, and compliance" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-red-600">{MOCK_INCIDENTS.length}</div><div className="text-xs text-slate-500">Incidents</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-orange-600">{MOCK_INCIDENTS.filter(i => i.status !== 'closed').length}</div><div className="text-xs text-slate-500">Open Cases</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-purple-600">{MOCK_COMPLAINTS.length}</div><div className="text-xs text-slate-500">Complaints</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">{MOCK_INCIDENTS.filter(i => i.status === 'closed').length + MOCK_COMPLAINTS.filter(c => c.status === 'closed').length}</div><div className="text-xs text-slate-500">Closed</div></Card>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['incidents', 'complaints', 'near-misses', 'analytics'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${tab === t ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {t === 'incidents' ? '🚨 Incidents' : t === 'complaints' ? '📝 Complaints' : t === 'near-misses' ? '⚡ Near Misses' : '📊 Analytics'}
          </button>
        ))}
      </div>

      {/* Incidents Tab */}
      {tab === 'incidents' && (
        <div className="space-y-3">
          {MOCK_INCIDENTS.map((inc) => {
            const catCfg = INCIDENT_CATEGORIES[inc.category] ?? INCIDENT_CATEGORIES.other!;
            const sevCfg = severityConfig[inc.severity];
            const isExpanded = selectedIncident === inc.id;
            return (
              <Card key={inc.id} className={`p-4 transition-all ${isExpanded ? 'ring-2 ring-red-200' : ''}`}>
                <div className="flex items-start justify-between cursor-pointer" onClick={() => setSelectedIncident(isExpanded ? null : inc.id)}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{catCfg.icon}</span>
                      <h3 className="font-bold text-slate-800">{inc.id}</h3>
                      <Badge tone={sevCfg.tone}>{sevCfg.label}</Badge>
                      <Badge tone={inc.status === 'closed' ? 'green' : inc.status === 'investigating' ? 'blue' : 'gold'}>{inc.status.toUpperCase()}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-slate-600 max-w-xl">{inc.description.substring(0, 120)}...</div>
                    <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-slate-400">
                      <span>📅 {inc.date} {inc.time}</span>
                      <span>👨‍⚕️ {inc.reportedBy}</span>
                      <span>🏥 {inc.department}</span>
                      {inc.patientInvolved && <span className="text-red-500">👤 Patient: {inc.patientName}</span>}
                    </div>
                  </div>
                  <span className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                </div>

                {isExpanded && (
                  <div className="mt-4 border-t pt-4 space-y-3">
                    <div>
                      <h4 className="font-bold text-xs text-slate-600">📋 Description</h4>
                      <p className="mt-1 text-xs text-slate-700 bg-slate-50 rounded p-2">{inc.description}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-600">🚑 Immediate Actions Taken</h4>
                      <p className="mt-1 text-xs text-slate-700 bg-green-50 rounded p-2">{inc.immediateActions}</p>
                    </div>
                    {inc.rootCause && (
                      <div>
                        <h4 className="font-bold text-xs text-slate-600">🔍 Root Cause Analysis</h4>
                        <p className="mt-1 text-xs text-slate-700 bg-amber-50 rounded p-2">{inc.rootCause}</p>
                      </div>
                    )}
                    {inc.correctiveActions && inc.correctiveActions.length > 0 && (
                      <div>
                        <h4 className="font-bold text-xs text-slate-600">✅ Corrective Actions</h4>
                        <ol className="mt-1 list-decimal list-inside text-xs text-slate-700 bg-blue-50 rounded p-2 space-y-1">
                          {inc.correctiveActions.map((a, i) => <li key={i}>{a}</li>)}
                        </ol>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-xs">✏️ Update Status</Button>
                      <Button className="bg-green-600 hover:bg-green-700 text-xs">✅ Close Incident</Button>
                      <Button className="bg-slate-100 text-slate-700 text-xs">🖨️ Print Report</Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Complaints Tab */}
      {tab === 'complaints' && (
        <div className="space-y-3">
          {MOCK_COMPLAINTS.map((cmp) => (
            <Card key={cmp.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800">{cmp.id}</h3>
                    <Badge tone={cmp.severity === 'high' ? 'red' : cmp.severity === 'medium' ? 'gold' : 'gray'}>{cmp.severity.toUpperCase()}</Badge>
                    <Badge tone={cmp.status === 'resolved' ? 'green' : cmp.status === 'closed' ? 'green' : 'blue'}>{cmp.status.toUpperCase()}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">{cmp.description}</div>
                  <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-slate-400">
                    <span>📅 {cmp.date}</span>
                    <span>👤 {cmp.complainant}</span>
                    <span>📞 {cmp.contactPhone}</span>
                    <span>🏥 {cmp.department}</span>
                  </div>
                </div>
                {cmp.satisfactionScore && (
                  <div className="text-center">
                    <div className="text-xs text-slate-400">Satisfaction</div>
                    <div className={`text-lg font-bold ${cmp.satisfactionScore <= 2 ? 'text-red-600' : cmp.satisfactionScore <= 3 ? 'text-amber-600' : 'text-green-600'}`}>{cmp.satisfactionScore}/5</div>
                  </div>
                )}
              </div>
              {cmp.resolution && (
                <div className="mt-3 rounded-lg bg-green-50 p-2 text-xs">
                  <span className="font-bold text-green-700">Resolution:</span> <span className="text-green-600">{cmp.resolution}</span>
                </div>
              )}
            </Card>
          ))}
          <Button className="bg-red-600 hover:bg-red-700">➕ Record New Complaint</Button>
        </div>
      )}

      {/* Near Misses Tab */}
      {tab === 'near-misses' && (
        <Card className="p-6 text-center">
          <div className="text-4xl mb-3">⚡</div>
          <h3 className="font-bold text-lg text-slate-800">Near-Miss Reporting</h3>
          <p className="mt-2 text-sm text-slate-500">Near-miss events are incidents that could have caused harm but were caught before reaching the patient. Reporting near-misses helps prevent future harm.</p>
          <div className="mt-4 rounded-lg bg-blue-50 p-4 text-left text-xs text-blue-700">
            <h4 className="font-bold mb-2">Why Report Near-Misses?</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>They are early warning signs of system failures</li>
              <li>Reporting is non-punitive — focus is on improvement</li>
              <li>Data helps identify patterns before harm occurs</li>
              <li>Required for hospital accreditation (Ghana Standards Authority)</li>
            </ul>
          </div>
          <Button className="mt-4 bg-blue-600 hover:bg-blue-700">⚡ Report Near-Miss Event</Button>
        </Card>
      )}

      {/* Analytics Tab */}
      {tab === 'analytics' && (
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">📊 Incident Categories</h3>
            <div className="space-y-2">
              {Object.entries(INCIDENT_CATEGORIES).map(([key, cfg]) => {
                const count = MOCK_INCIDENTS.filter(i => i.category === key).length;
                const pct = MOCK_INCIDENTS.length > 0 ? (count / MOCK_INCIDENTS.length) * 100 : 0;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-24 text-xs text-slate-600">{cfg.icon} {key.charAt(0).toUpperCase() + key.slice(1)}</span>
                    <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-xs font-bold text-slate-600 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="p-4">
              <h3 className="font-bold text-sm text-slate-700 mb-3">⚠️ Severity Distribution</h3>
              {Object.entries(severityConfig).map(([key, cfg]) => {
                const count = MOCK_INCIDENTS.filter(i => i.severity === key).length;
                return (
                  <div key={key} className="flex items-center justify-between py-1 border-b last:border-0">
                    <span className="text-xs text-slate-600">{cfg.label}</span>
                    <span className={`text-sm font-bold ${key === 'major' || key === 'sentinel' ? 'text-red-600' : 'text-slate-600'}`}>{count}</span>
                  </div>
                );
              })}
            </Card>
            <Card className="p-4">
              <h3 className="font-bold text-sm text-slate-700 mb-3">🏥 Department Breakdown</h3>
              {[...new Set(MOCK_INCIDENTS.map(i => i.department))].map((dept) => {
                const count = MOCK_INCIDENTS.filter(i => i.department === dept).length;
                return (
                  <div key={dept} className="flex items-center justify-between py-1 border-b last:border-0">
                    <span className="text-xs text-slate-600">{dept}</span>
                    <span className="text-sm font-bold text-slate-600">{count}</span>
                  </div>
                );
              })}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
