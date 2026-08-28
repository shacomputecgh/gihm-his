import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Button, Card, PageHeader } from '../../components/ui';

type PhysioTab = 'patients' | 'sessions' | 'analytics';

interface PhysioPatient {
  id: string; name: string; age: number; mrn: string; condition: string; diagnosis: string[];
  sessionsCompleted: number; totalSessions: number; nextSession: string; therapist: string;
  status: 'active' | 'discharged' | 'on-hold';
  painScale: number; rangeOfMotion: string; functionalGoals: string[];
  treatmentPlan: string; notes: string;
}

const MOCK_PATIENTS: PhysioPatient[] = [
  { id: 'PH001', name: 'Nana Akua', age: 78, mrn: 'MRN-008', condition: 'Post Total Hip Replacement', diagnosis: ['Severe Osteoarthritis — Left Hip', 'Post THR (2026-05-15)'], sessionsCompleted: 3, totalSessions: 12, nextSession: '2026-05-24', therapist: 'Dr. Physio Kwaku', status: 'active', painScale: 5, rangeOfMotion: 'Flexion 70° (limited)', functionalGoals: ['Walk independently without aid', 'Climb stairs', 'Resume daily activities'], treatmentPlan: 'Progressive mobilization. Gait training. Strengthening exercises. Hydrotherapy when wound healed.', notes: 'Patient motivated. Wound healing well. Using walking frame.' },
  { id: 'PH002', name: 'Kwaku Mensah', age: 45, mrn: 'MRN-006', condition: 'Lower Back Pain', diagnosis: ['Lumbar Disc Herniation L4-L5', 'Sciatica'], sessionsCompleted: 6, totalSessions: 10, nextSession: '2026-05-25', therapist: 'Dr. Physio Kwaku', status: 'active', painScale: 4, rangeOfMotion: 'Flexion 60° (improved)', functionalGoals: ['Return to work', 'Pain-free sitting for 1 hour', 'Resume light exercise'], treatmentPlan: 'McKenzie method. Core stabilization. Nerve mobilization. Ergonomic advice.', notes: 'Good progress. Pain reduced from 7 to 4. Walking better.' },
  { id: 'PH003', name: 'Abena Boateng', age: 32, mrn: 'MRN-102', condition: 'Stroke Recovery', diagnosis: ['Ischaemic Stroke — Right MCA', 'Left hemiplegia'], sessionsCompleted: 15, totalSessions: 30, nextSession: '2026-05-24', therapist: 'Dr. Physio Kwaku', status: 'active', painScale: 2, rangeOfMotion: 'Left shoulder: abduction 90°; Left hip: flexion 80°', functionalGoals: ['Independent transfers', 'Walking with stick', 'Use left hand for feeding'], treatmentPlan: 'Neurodevelopmental therapy. Constraint-induced movement therapy. Electrical stimulation. Balance training.', notes: 'Making good progress. Can now stand with assistance for 5 minutes.' },
  { id: 'PH004', name: 'Samuel Koomson', age: 25, mrn: 'MRN-103', condition: 'ACL Reconstruction Recovery', diagnosis: ['ACL Tear — Right Knee (Post-op)'], sessionsCompleted: 8, totalSessions: 16, nextSession: '2026-05-26', therapist: 'Dr. Physio Kwaku', status: 'active', painScale: 3, rangeOfMotion: 'Flexion 110° (good)', functionalGoals: ['Full range of motion', 'Return to football', 'Quad strengthening'], treatmentPlan: 'Progressive loading. Closed kinetic chain exercises. Proprioception training. Sport-specific drills (later).', notes: 'Ahead of schedule. Quad activation improving.' },
];

export default function Physiotherapy() {
  const [tab, setTab] = useState<PhysioTab>('patients');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

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
          title="Add New Physio Session"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","required":true},{"name":"condition","label":"Condition","type":"select","options":["Post-Surgical","Stroke","Fracture","Back Pain","Sports Injury","Neurological","Paediatric","Other"]},{"name":"sessionType","label":"Session Type","type":"select","options":["Assessment","Treatment","Exercise","Electrotherapy","Hydrotherapy"]},{"name":"notes","label":"Session Notes","type":"textarea"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Physiotherapy" subtitle="Rehabilitation tracking, exercise programs, and functional assessments" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-teal-600">{MOCK_PATIENTS.length}</div><div className="text-xs text-slate-500">Active Patients</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">{MOCK_PATIENTS.reduce((s, p) => s + p.sessionsCompleted, 0)}</div><div className="text-xs text-slate-500">Sessions Done</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-amber-600">{MOCK_PATIENTS.reduce((s, p) => s + p.totalSessions - p.sessionsCompleted, 0)}</div><div className="text-xs text-slate-500">Remaining</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-blue-600">{(MOCK_PATIENTS.reduce((s, p) => s + p.painScale, 0) / MOCK_PATIENTS.length).toFixed(1)}</div><div className="text-xs text-slate-500">Avg Pain</div></Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['patients', 'sessions', 'analytics'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-xs font-semibold transition ${tab === t ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {t === 'patients' ? '👥 Patients' : t === 'sessions' ? '📅 Sessions' : '📊 Analytics'}
          </button>
        ))}
      </div>

      {tab === 'patients' && (
        <div className="space-y-3">
          {MOCK_PATIENTS.map(p => {
            const isExpanded = selectedPatient === p.id;
            const progress = (p.sessionsCompleted / p.totalSessions) * 100;
            return (
              <Card key={p.id} className={`p-4 transition-all ${isExpanded ? 'ring-2 ring-teal-200' : ''}`}>
                <div className="flex items-start justify-between cursor-pointer" onClick={() => setSelectedPatient(isExpanded ? null : p.id)}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🦿</span>
                      <h3 className="font-bold text-slate-800">{p.name}</h3>
                      <Badge tone="blue">{p.condition}</Badge>
                      <Badge tone={p.painScale >= 7 ? 'red' : p.painScale >= 4 ? 'gold' : 'green'}>Pain: {p.painScale}/10</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>Age: {p.age}</span><span>Therapist: {p.therapist}</span><span>Next: {p.nextSession}</span>
                    </div>
                    <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden w-64">
                      <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Progress: {p.sessionsCompleted}/{p.totalSessions} sessions ({progress.toFixed(0)}%)</div>
                  </div>
                  <span className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                </div>
                {isExpanded && (
                  <div className="mt-4 border-t pt-4 space-y-3">
                    <div className="rounded-lg bg-slate-50 p-3"><h4 className="font-bold text-xs text-slate-600 mb-1">📋 Treatment Plan</h4><p className="text-xs text-slate-700">{p.treatmentPlan}</p></div>
                    <div><h4 className="font-bold text-xs text-slate-600 mb-1">🎯 Functional Goals</h4><ul className="list-disc list-inside text-xs text-slate-600">{p.functionalGoals.map((g, i) => <li key={i}>{g}</li>)}</ul></div>
                    <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700">📐 Range of Motion: {p.rangeOfMotion}</div>
                    <p className="text-xs text-slate-500">📝 {p.notes}</p>
                    <div className="flex gap-2">
                      <Button className="bg-teal-600 hover:bg-teal-700 text-xs">📝 Record Session</Button>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-xs">📊 Progress Report</Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'sessions' && (
        <div className="space-y-3">
          {MOCK_PATIENTS.map(p => (
            <Card key={p.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🦿</span>
                  <div><div className="font-bold text-sm">{p.name}</div><div className="text-xs text-slate-500">{p.condition} · Next: {p.nextSession}</div></div>
                </div>
                <Button className="bg-teal-600 hover:bg-teal-700 text-xs">▶️ Start Session</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'analytics' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">📊 Condition Breakdown</h3>
            {MOCK_PATIENTS.map(p => (
              <div key={p.id} className="flex items-center justify-between py-1 border-b last:border-0 text-xs">
                <span className="text-slate-600">{p.condition}</span>
                <span className="font-bold">{p.sessionsCompleted}/{p.totalSessions}</span>
              </div>
            ))}
          </Card>
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">📊 Pain Scale Distribution</h3>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(pain => {
              const count = MOCK_PATIENTS.filter(p => p.painScale === pain).length;
              if (count === 0) return null;
              return (<div key={pain} className="flex items-center gap-2 mb-1"><span className="text-xs w-16">{pain}/10</span><div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${pain >= 7 ? 'bg-red-500' : pain >= 4 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${count * 25}%` }} /></div><span className="text-xs font-bold w-4">{count}</span></div>);
            })}
          </Card>
        </div>
      )}
    </div>
  );
}
