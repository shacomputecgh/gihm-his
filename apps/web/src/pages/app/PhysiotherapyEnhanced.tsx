import { useState } from 'react';
import { Card, Badge, Button, Icon } from '../../components/ui';

interface PhysioSession {
  id: string;
  patientName: string;
  mrn: string;
  age: number;
  sex: string;
  diagnosis: string;
  condition: string;
  therapist: string;
  date: string;
  time: string;
  sessionType: 'Initial Assessment' | 'Treatment' | 'Reassessment' | 'Discharge' | 'Group Therapy';
  treatmentArea: string;
  exercises: string[];
  painBefore: number;
  painAfter: number;
  romBefore: string;
  romAfter: string;
  functionalGoal: string;
  progress: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  totalSessions: number;
  sessionsAttended: number;
  nextSession: string;
  referralDoctor: string;
  notes: string;
}

const SAMPLE_SESSIONS: PhysioSession[] = [
  { id: 'PT-001', patientName: 'Kwame Asante', mrn: 'MRN-2024-0012', age: 67, sex: 'M', diagnosis: 'Left Total Knee Replacement', condition: 'Post-op 2 weeks', therapist: 'Dr. Physio Osei', date: '2024-01-16', time: '09:00', sessionType: 'Treatment', treatmentArea: 'Left Knee', exercises: ['Quad sets', 'Straight leg raise', 'Knee flexion', 'Gait training'], painBefore: 6, painAfter: 4, romBefore: '30-60°', romAfter: '25-75°', functionalGoal: 'Walk without frame in 6 weeks', progress: 'Good - ROM improving', status: 'Completed', totalSessions: 24, sessionsAttended: 8, nextSession: '2024-01-18', referralDoctor: 'Dr. Ansah', notes: 'Patient motivated, home exercise program reinforced' },
  { id: 'PT-002', patientName: 'Akua Mensah', mrn: 'MRN-2024-0045', age: 52, sex: 'F', diagnosis: 'Right Rotator Cuff Tear', condition: 'Post-surgical 4 weeks', therapist: 'Dr. Physio Osei', date: '2024-01-16', time: '10:00', sessionType: 'Treatment', treatmentArea: 'Right Shoulder', exercises: ['Pendulum exercises', 'Wall climbing', 'External rotation', 'Scapular stabilisation'], painBefore: 7, painAfter: 5, romBefore: '60° flexion', romAfter: '80° flexion', functionalGoal: 'Reach overhead in 8 weeks', progress: 'Fair - pain limiting', status: 'Scheduled', totalSessions: 20, sessionsAttended: 4, nextSession: '2024-01-16', referralDoctor: 'Dr. Mensah', notes: '' },
  { id: 'PT-003', patientName: 'Yaw Boateng', mrn: 'MRN-2024-0078', age: 45, sex: 'M', diagnosis: 'Lumbar Disc Herniation L4-L5', condition: 'Conservative management', therapist: 'Dr. Physio Adjei', date: '2024-01-16', time: '11:00', sessionType: 'Treatment', treatmentArea: 'Lower Back', exercises: ['McKenzie extension', 'Core stabilisation', 'Nerve gliding', 'Walking program'], painBefore: 8, painAfter: 5, romBefore: 'Severely restricted', romAfter: 'Mildly restricted', functionalGoal: 'Return to work in 4 weeks', progress: 'Improving - NRS down from 8 to 5', status: 'Scheduled', totalSessions: 12, sessionsAttended: 6, nextSession: '2024-01-16', referralDoctor: 'Dr. Koomson', notes: 'Discussed ergonomic workplace modifications' },
  { id: 'PT-004', patientName: 'Efua Osei', mrn: 'MRN-2024-0092', age: 72, sex: 'F', diagnosis: 'Stroke (Left MCA)', condition: 'Right hemiplegia', therapist: 'Dr. Physio Adjei', date: '2024-01-16', time: '14:00', sessionType: 'Treatment', treatmentArea: 'Right Upper/Lower Limb', exercises: ['Passive ROM', 'Active-assisted exercises', 'Sitting balance', 'Standing frame'], painBefore: 2, painAfter: 2, romBefore: 'Active: 0°', romAfter: 'Active-assisted: 20° flexion', functionalGoal: 'Modified independence in transfers', progress: 'Slow progress - tone increasing', status: 'Scheduled', totalSessions: 40, sessionsAttended: 12, nextSession: '2024-01-16', referralDoctor: 'Dr. Owusu', notes: 'Consider Baclofen review with neurologist' },
];

const STATUS_COLORS: Record<string, string> = {
  Scheduled: 'bg-blue-100 text-blue-800',
  'In Progress': 'bg-yellow-100 text-yellow-800',
  Completed: 'bg-green-100 text-green-800',
  Cancelled: 'bg-gray-100 text-gray-600',
};

const SESSION_TYPE_COLORS: Record<string, string> = {
  'Initial Assessment': 'bg-purple-100 text-purple-700',
  Treatment: 'bg-blue-100 text-blue-700',
  Reassessment: 'bg-orange-100 text-orange-700',
  Discharge: 'bg-green-100 text-green-700',
  'Group Therapy': 'bg-teal-100 text-teal-700',
};

export default function PhysiotherapyEnhanced() {
  const [sessions] = useState<PhysioSession[]>(SAMPLE_SESSIONS);
  const [selected, setSelected] = useState<PhysioSession | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const completed = sessions.filter(s => s.status === 'Completed');
  const avgPainReduction = completed.length > 0 ? (completed.reduce((s, c) => s + (c.painBefore - c.painAfter), 0) / completed.length).toFixed(1) : '0';
  const totalAttended = sessions.reduce((s, c) => s + c.sessionsAttended, 0);
  const totalSessions = sessions.reduce((s, c) => s + c.totalSessions, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Physiotherapy Unit</h1>
          <p className="text-slate-500">Treatment scheduling, exercise programs, progress tracking, and outcome measures</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Icon name="plus" className="h-4 w-4" /> New Session</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-sm text-slate-500">Today's Sessions</p><p className="text-2xl font-bold">{sessions.length}</p></Card>
        <Card className="p-4"><p className="text-sm text-slate-500">Completed</p><p className="text-2xl font-bold text-green-600">{completed.length}</p></Card>
        <Card className="p-4"><p className="text-sm text-slate-500">Avg Pain Reduction</p><p className="text-2xl font-bold text-blue-600">-{avgPainReduction} NRS</p></Card>
        <Card className="p-4"><p className="text-sm text-slate-500">Attendance Rate</p><p className={`text-2xl font-bold ${totalAttended/totalSessions < 0.7 ? 'text-red-600' : 'text-green-600'}`}>{totalSessions > 0 ? ((totalAttended/totalSessions)*100).toFixed(0) : 0}%</p></Card>
      </div>

      <div className="space-y-4">
        {sessions.map(s => (
          <Card key={s.id} className="p-4 cursor-pointer hover:shadow-md" onClick={() => setSelected(s)}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">{s.patientName}</h3>
                <p className="text-sm text-slate-500">{s.mrn} • {s.age}y/{s.sex} • {s.diagnosis}</p>
                <p className="text-xs text-slate-400">{s.condition}</p>
              </div>
              <div className="flex gap-2">
                <Badge className={STATUS_COLORS[s.status]}>{s.status}</Badge>
                <Badge className={SESSION_TYPE_COLORS[s.sessionType]}>{s.sessionType}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-sm">
              <div className="bg-slate-50 rounded p-2"><p className="text-xs text-slate-500">Area</p><p className="font-medium">{s.treatmentArea}</p></div>
              <div className="bg-slate-50 rounded p-2"><p className="text-xs text-slate-500">Pain Before</p><p className="font-bold text-red-600">{s.painBefore}/10</p></div>
              <div className="bg-slate-50 rounded p-2"><p className="text-xs text-slate-500">Pain After</p><p className={`font-bold ${s.painAfter <= 3 ? 'text-green-600' : 'text-orange-600'}`}>{s.painAfter}/10</p></div>
              <div className="bg-slate-50 rounded p-2"><p className="text-xs text-slate-500">ROM Change</p><p className="font-medium text-xs">{s.romBefore} → {s.romAfter}</p></div>
              <div className="bg-slate-50 rounded p-2"><p className="text-xs text-slate-500">Attended</p><p className="font-medium">{s.sessionsAttended}/{s.totalSessions}</p></div>
              <div className="bg-slate-50 rounded p-2"><p className="text-xs text-slate-500">Therapist</p><p className="font-medium text-xs">{s.therapist}</p></div>
            </div>
            <div className="mt-3 flex gap-2 text-xs flex-wrap">
              <Badge className="bg-blue-50 text-blue-700">Goal: {s.functionalGoal}</Badge>
              <Badge className="bg-green-50 text-green-700">{s.progress}</Badge>
              <Badge className="bg-slate-100 text-slate-600">Next: {s.nextSession}</Badge>
            </div>
          </Card>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Physio Session — {selected.patientName}</h2>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600"><Icon name="x" className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">Diagnosis:</span> <strong>{selected.diagnosis}</strong></div>
              <div><span className="text-slate-500">Condition:</span> <strong>{selected.condition}</strong></div>
              <div><span className="text-slate-500">Treatment Area:</span> <strong>{selected.treatmentArea}</strong></div>
              <div><span className="text-slate-500">Referral Doctor:</span> <strong>{selected.referralDoctor}</strong></div>
            </div>
            <div className="mt-4">
              <h3 className="font-medium mb-2">Exercises Performed</h3>
              <div className="flex flex-wrap gap-2">
                {selected.exercises.map((e, i) => <Badge key={i} className="bg-blue-50 text-blue-700">{e}</Badge>)}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-red-50 rounded p-3"><p className="text-xs text-red-500">Pain (Before)</p><p className="text-2xl font-bold text-red-600">{selected.painBefore}/10</p></div>
              <div className="bg-green-50 rounded p-3"><p className="text-xs text-green-500">Pain (After)</p><p className="text-2xl font-bold text-green-600">{selected.painAfter}/10</p></div>
            </div>
            <div className="mt-4 text-sm">
              <p><span className="text-slate-500">Functional Goal:</span> <strong>{selected.functionalGoal}</strong></p>
              <p><span className="text-slate-500">Progress:</span> <strong>{selected.progress}</strong></p>
              {selected.notes && <p><span className="text-slate-500">Notes:</span> <strong>{selected.notes}</strong></p>}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setSelected(null)} className="px-4 py-2 bg-slate-100 rounded-lg text-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">New Physiotherapy Session</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600"><Icon name="x" className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><label className="block text-slate-600 mb-1">Patient Name</label><input className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">MRN</label><input className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">Diagnosis</label><input className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">Session Type</label><select className="w-full border rounded-lg px-3 py-2"><option>Initial Assessment</option><option>Treatment</option><option>Reassessment</option><option>Discharge</option><option>Group Therapy</option></select></div>
              <div><label className="block text-slate-600 mb-1">Treatment Area</label><input className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">Date & Time</label><input type="datetime-local" className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">Pain Score (0-10)</label><input type="number" min={0} max={10} className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">Therapist</label><input className="w-full border rounded-lg px-3 py-2" /></div>
              <div className="col-span-2"><label className="block text-slate-600 mb-1">Exercises (one per line)</label><textarea className="w-full border rounded-lg px-3 py-2" rows={3} placeholder="Quad sets&#10;Straight leg raise&#10;Gait training" /></div>
              <div className="col-span-2"><label className="block text-slate-600 mb-1">Functional Goal</label><input className="w-full border rounded-lg px-3 py-2" /></div>
              <div className="col-span-2"><label className="block text-slate-600 mb-1">Notes</label><textarea className="w-full border rounded-lg px-3 py-2" rows={2} /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-slate-100 rounded-lg text-sm">Cancel</button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Save Session</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
