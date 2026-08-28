import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Button, Card, PageHeader } from '../../components/ui';

type TheatreTab = 'schedule' | 'list' | 'utilization';

interface Surgery {
  id: string;
  patientName: string;
  mrn: string;
  procedure: string;
  procedureType: 'elective' | 'emergency' | 'urgent';
  surgeon: string;
  anaesthetist: string;
  theatre: string;
  date: string;
  time: string;
  estimatedDuration: number;
  actualDuration?: number;
  status: 'scheduled' | 'pre-op' | 'in-progress' | 'completed' | 'cancelled' | 'postponed';
  diagnosis: string;
  anaesthesiaType: 'general' | 'spinal' | 'epidural' | 'local' | 'regional';
  asaGrade: 'I' | 'II' | 'III' | 'IV' | 'V';
  implants?: string[];
  bloodReady?: boolean;
  consentSigned: boolean;
  preOpChecklist: boolean;
  notes?: string;
}

const MOCK_SURGERIES: Surgery[] = [
  { id: 'SRG001', patientName: 'Ama Darko', mrn: 'MRN-002', procedure: 'Laparoscopic Appendectomy', procedureType: 'emergency', surgeon: 'Dr. Boateng', anaesthetist: 'Dr. Agyeman', theatre: 'Theatre 1', date: '2026-05-23', time: '14:00', estimatedDuration: 60, actualDuration: 45, status: 'completed', diagnosis: 'Acute Appendicitis', anaesthesiaType: 'general', asaGrade: 'II', bloodReady: true, consentSigned: true, preOpChecklist: true },
  { id: 'SRG002', patientName: 'Kwaku Mensah', mrn: 'MRN-006', procedure: 'Right Inguinal Hernia Repair', procedureType: 'elective', surgeon: 'Dr. Boateng', anaesthetist: 'Dr. Agyeman', theatre: 'Theatre 1', date: '2026-05-24', time: '08:00', estimatedDuration: 90, status: 'scheduled', diagnosis: 'Right Inguinal Hernia', anaesthesiaType: 'spinal', asaGrade: 'II', consentSigned: true, preOpChecklist: true },
  { id: 'SRG003', patientName: 'Efua Amoah', mrn: 'MRN-007', procedure: 'Caesarean Section', procedureType: 'urgent', surgeon: 'Dr. Agyeman', anaesthetist: 'Dr. Osei', theatre: 'Theatre 2', date: '2026-05-23', time: '16:00', estimatedDuration: 45, status: 'scheduled', diagnosis: 'Fetal Distress — C-Section', anaesthesiaType: 'spinal', asaGrade: 'II', bloodReady: true, consentSigned: true, preOpChecklist: true },
  { id: 'SRG004', patientName: 'Nana Akua', mrn: 'MRN-008', procedure: 'Left Total Hip Replacement', procedureType: 'elective', surgeon: 'Dr. Boateng', anaesthetist: 'Dr. Agyeman', theatre: 'Theatre 1', date: '2026-05-25', time: '08:00', estimatedDuration: 150, status: 'scheduled', diagnosis: 'Severe Osteoarthritis — Left Hip', anaesthesiaType: 'general', asaGrade: 'III', implants: ['Cementless Hip Prosthesis'], bloodReady: true, consentSigned: true, preOpChecklist: false },
  { id: 'SRG005', patientName: 'Samuel Koomson', mrn: 'MRN-009', procedure: 'Open Cholecystectomy', procedureType: 'elective', surgeon: 'Dr. Mensah', anaesthetist: 'Dr. Osei', theatre: 'Theatre 2', date: '2026-05-26', time: '08:00', estimatedDuration: 120, status: 'scheduled', diagnosis: 'Symptomatic Gallstones', anaesthesiaType: 'general', asaGrade: 'II', consentSigned: true, preOpChecklist: true },
  { id: 'SRG006', patientName: 'Adwoa Tetteh', mrn: 'MRN-010', procedure: 'Cataract Surgery (Right Eye)', procedureType: 'elective', surgeon: 'Dr. Osei', anaesthetist: 'Local', theatre: 'Theatre 3', date: '2026-05-24', time: '10:00', estimatedDuration: 30, status: 'scheduled', diagnosis: 'Senile Cataract — Right Eye', anaesthesiaType: 'local', asaGrade: 'I', consentSigned: true, preOpChecklist: true },
];

const STATUS_CONFIG: Record<string, { label: string; tone: 'green' | 'blue' | 'gold' | 'red' | 'gray'; icon: string }> = {
  scheduled: { label: 'Scheduled', tone: 'blue', icon: '📅' },
  'pre-op': { label: 'Pre-Op', tone: 'gold', icon: '⏳' },
  'in-progress': { label: 'In Progress', tone: 'red', icon: '🔴' },
  completed: { label: 'Completed', tone: 'green', icon: '✅' },
  cancelled: { label: 'Cancelled', tone: 'gray', icon: '❌' },
  postponed: { label: 'Postponed', tone: 'gold', icon: '⏸️' },
};

export default function TheatreManagement() {
  const [tab, setTab] = useState<TheatreTab>('schedule');
  const [selectedSurgery, setSelectedSurgery] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState('all');

  const filteredSurgeries = MOCK_SURGERIES.filter(s => dateFilter === 'all' || s.date === dateFilter);

  const completedToday = MOCK_SURGERIES.filter(s => s.status === 'completed').length;
  const scheduledToday = MOCK_SURGERIES.filter(s => s.status === 'scheduled' && s.date === '2026-05-23').length;
  const totalTheatres = 3;

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
          title="Add New Theatre Record"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","required":true},{"name":"procedure","label":"Surgical Procedure","type":"text","required":true},{"name":"surgeon","label":"Surgeon","type":"text"},{"name":"anaesthesia","label":"Anaesthesia Type","type":"select","options":["General","Spinal","Epidural","Local","Regional","None"]},{"name":"theatre","label":"Theatre","type":"select","options":["Theatre 1","Theatre 2","Theatre 3","Emergency Theatre"]},{"name":"date","label":"Surgery Date","type":"date"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Theatre Management" subtitle="Surgery scheduling, theatre allocation, and procedure tracking" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-blue-600">{MOCK_SURGERIES.length}</div><div className="text-xs text-slate-500">Total Surgeries</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">{completedToday}</div><div className="text-xs text-slate-500">Completed</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-amber-600">{scheduledToday}</div><div className="text-xs text-slate-500">Today's Schedule</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-purple-600">{totalTheatres}</div><div className="text-xs text-slate-500">Theatres</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-red-600">{MOCK_SURGERIES.filter(s => s.procedureType === 'emergency').length}</div><div className="text-xs text-slate-500">Emergency</div></Card>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['schedule', 'list', 'utilization'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${tab === t ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {t === 'schedule' ? '📅 Schedule' : t === 'list' ? '📋 All Surgeries' : '📊 Utilization'}
          </button>
        ))}
      </div>

      {/* Schedule Tab */}
      {tab === 'schedule' && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs">
              <option value="all">All Dates</option>
              <option value="2026-05-23">Today (May 23)</option>
              <option value="2026-05-24">Tomorrow (May 24)</option>
              <option value="2026-05-25">May 25</option>
              <option value="2026-05-26">May 26</option>
            </select>
          </div>
          {filteredSurgeries.map(s => {
            const statusCfg = STATUS_CONFIG[s.status]!;
            const isExpanded = selectedSurgery === s.id;
            return (
              <Card key={s.id} className={`p-4 transition-all ${isExpanded ? 'ring-2 ring-purple-200' : ''}`}>
                <div className="flex items-start justify-between cursor-pointer" onClick={() => setSelectedSurgery(isExpanded ? null : s.id)}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{statusCfg.icon}</span>
                      <h3 className="font-bold text-slate-800">{s.patientName}</h3>
                      <Badge tone={statusCfg.tone}>{statusCfg.label}</Badge>
                      <Badge tone={s.procedureType === 'emergency' ? 'red' : s.procedureType === 'urgent' ? 'gold' : 'blue'}>
                        {s.procedureType.toUpperCase()}
                      </Badge>
                      <Badge tone="navy">ASA {s.asaGrade}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-slate-600 font-medium">{s.procedure}</div>
                    <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-slate-400">
                      <span>📅 {s.date} {s.time}</span>
                      <span>🏥 {s.theatre}</span>
                      <span>👨‍⚕️ {s.surgeon}</span>
                      <span>💊 {s.anaesthetist}</span>
                      <span>⏱️ ~{s.estimatedDuration} min</span>
                      <span>💉 {s.anaesthesiaType}</span>
                    </div>
                  </div>
                  <span className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                </div>

                {isExpanded && (
                  <div className="mt-4 border-t pt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                      <div className="rounded bg-slate-50 p-2"><div className="text-[10px] text-slate-400">Diagnosis</div><div className="text-xs font-bold">{s.diagnosis}</div></div>
                      <div className="rounded bg-slate-50 p-2"><div className="text-[10px] text-slate-400">Blood Ready</div><div className={`text-xs font-bold ${s.bloodReady ? 'text-green-600' : 'text-red-600'}`}>{s.bloodReady ? '✅ Yes' : '❌ No'}</div></div>
                      <div className="rounded bg-slate-50 p-2"><div className="text-[10px] text-slate-400">Consent</div><div className={`text-xs font-bold ${s.consentSigned ? 'text-green-600' : 'text-red-600'}`}>{s.consentSigned ? '✅ Signed' : '❌ Pending'}</div></div>
                      <div className="rounded bg-slate-50 p-2"><div className="text-[10px] text-slate-400">Pre-Op Check</div><div className={`text-xs font-bold ${s.preOpChecklist ? 'text-green-600' : 'text-red-600'}`}>{s.preOpChecklist ? '✅ Complete' : '❌ Pending'}</div></div>
                    </div>
                    {s.implants && s.implants.length > 0 && (
                      <div className="rounded-lg bg-blue-50 p-2 text-xs">
                        <span className="font-bold text-blue-700">🔩 Implants:</span> {s.implants.join(', ')}
                      </div>
                    )}
                    {s.actualDuration && (
                      <div className="text-xs text-slate-500">⏱️ Actual duration: <strong>{s.actualDuration} minutes</strong></div>
                    )}
                    <div className="flex gap-2">
                      {s.status === 'scheduled' && <Button className="bg-amber-600 hover:bg-amber-700 text-xs">⏳ Start Pre-Op</Button>}
                      {s.status === 'pre-op' && <Button className="bg-red-600 hover:bg-red-700 text-xs">🔴 Start Surgery</Button>}
                      {s.status === 'in-progress' && <Button className="bg-green-600 hover:bg-green-700 text-xs">✅ Complete</Button>}
                      <Button className="bg-blue-600 hover:bg-blue-700 text-xs">🖨️ Print Schedule</Button>
                      <Button className="bg-slate-100 text-slate-700 text-xs">📝 Edit</Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
          <Button className="bg-purple-600 hover:bg-purple-700">➕ Schedule New Surgery</Button>
        </div>
      )}

      {/* List Tab */}
      {tab === 'list' && (
        <Card className="p-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b text-left text-slate-500">
              <th className="p-2">Patient</th><th className="p-2">Procedure</th><th className="p-2">Surgeon</th><th className="p-2">Theatre</th><th className="p-2">Date</th><th className="p-2">Time</th><th className="p-2">Duration</th><th className="p-2">Status</th>
            </tr></thead>
            <tbody>
              {MOCK_SURGERIES.map(s => {
                const statusCfg = STATUS_CONFIG[s.status]!;
                return (
                  <tr key={s.id} className="border-b hover:bg-slate-50">
                    <td className="p-2 font-medium">{s.patientName}</td><td className="p-2">{s.procedure}</td>
                    <td className="p-2">{s.surgeon}</td><td className="p-2">{s.theatre}</td>
                    <td className="p-2">{s.date}</td><td className="p-2">{s.time}</td>
                    <td className="p-2">{s.actualDuration ?? s.estimatedDuration} min</td>
                    <td className="p-2"><Badge tone={statusCfg.tone}>{statusCfg.label}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Utilization Tab */}
      {tab === 'utilization' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">🏥 Theatre Utilization</h3>
            {[1, 2, 3].map(t => {
              const surgeries = MOCK_SURGERIES.filter(s => s.theatre === `Theatre ${t}`);
              const totalMinutes = surgeries.reduce((sum, s) => sum + (s.actualDuration ?? s.estimatedDuration), 0);
              const hours = (totalMinutes / 60).toFixed(1);
              return (
                <div key={t} className="mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Theatre {t}</span>
                    <span className="font-bold">{surgeries.length} cases · {hours} hrs</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min((totalMinutes / 480) * 100, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </Card>
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">📊 Surgery Types</h3>
            {['elective', 'emergency', 'urgent'].map(type => {
              const count = MOCK_SURGERIES.filter(s => s.procedureType === type).length;
              const pct = (count / MOCK_SURGERIES.length) * 100;
              return (
                <div key={type} className="mb-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 capitalize">{type}</span>
                    <span className="font-bold">{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            <h4 className="font-bold text-xs text-slate-700 mt-4 mb-2">Anaesthesia Types</h4>
            {['general', 'spinal', 'local'].map(type => {
              const count = MOCK_SURGERIES.filter(s => s.anaesthesiaType === type).length;
              return (
                <div key={type} className="flex items-center justify-between py-1 border-b last:border-0 text-xs">
                  <span className="text-slate-600 capitalize">{type}</span>
                  <span className="font-bold">{count}</span>
                </div>
              );
            })}
          </Card>
        </div>
      )}
    </div>
  );
}
