import { useState } from 'react';
import { Card, Badge, Button, Icon } from '../../components/ui';

interface HandoverNote {
  id: string;
  ward: string;
  shift: 'Morning' | 'Evening' | 'Night';
  date: string;
  nurseFrom: string;
  nurseTo: string;
  doctorOnCall: string;
  totalPatients: number;
  criticalPatients: number;
  newAdmissions: number;
  discharges: number;
  pendingResults: number;
  pendingTasks: string[];
  criticalAlerts: string[];
  patients: PatientHandover[];
  completed: boolean;
}

interface PatientHandover {
  mrn: string;
  name: string;
  bed: string;
  diagnosis: string;
  status: 'Critical' | 'Stable' | 'Improving' | 'Deteriorating';
  keyUpdates: string;
  pendingTasks: string;
  nextReview: string;
  isolation: string;
}

const SAMPLE_HANDOVERS: HandoverNote[] = [
  {
    id: 'HO-2024-001', ward: 'Medical Ward A', shift: 'Morning', date: '2024-01-16', nurseFrom: 'Sr. Boateng', nurseTo: 'Sr. Osei', doctorOnCall: 'Dr. Mensah', totalPatients: 24, criticalPatients: 3, newAdmissions: 2, discharges: 1, pendingResults: 4, pendingTasks: ['Repeat bloods for Room 4 (patient hypoglycemic)', 'PT/INR result pending for Room 8', 'ECG ordered for Room 12', 'Consultant review needed Room 16'], criticalAlerts: ['Room 3: BP 180/110 - antihypertensive given, recheck in 1hr', 'Room 7: New AF detected - cardiology notified', 'Room 11: Sepsis protocol activated - IV antibiotics running'],
    patients: [
      { mrn: 'MRN-001', name: 'Kwame Asante', bed: 'Room 3', diagnosis: 'Hypertensive Crisis', status: 'Critical', keyUpdates: 'BP dropped to 160/95 after medication. Recheck at 14:00.', pendingTasks: 'Recheck BP, monitor fluid balance', nextReview: '14:00', isolation: 'Standard' },
      { mrn: 'MRN-002', name: 'Ama Darko', bed: 'Room 7', diagnosis: 'New Atrial Fibrillation', status: 'Critical', keyUpdates: 'HR 140 irregular. Amiodarone started. Cardiology consulted.', pendingTasks: 'Cardiology review, repeat ECG 4hrs', nextReview: '16:00', isolation: 'Standard' },
      { mrn: 'MRN-003', name: 'Kofi Tetteh', bed: 'Room 11', diagnosis: 'Urosepsis', status: 'Critical', keyUpdates: 'Temp 39.2, WBC 18. Started sepsis bundle. Blood cultures taken.', pendingTasks: 'Blood culture results, lactate recheck', nextReview: '15:00', isolation: 'Contact' },
      { mrn: 'MRN-004', name: 'Abena Mensah', bed: 'Room 1', diagnosis: 'Pneumonia', status: 'Improving', keyUpdates: 'Afebrile. Appetite improving. O2 saturations 97% on room air.', pendingTasks: 'Chest X-ray review', nextReview: 'Next shift', isolation: 'Droplet' },
    ],
    completed: false,
  },
  {
    id: 'HO-2024-002', ward: 'Surgical Ward B', shift: 'Morning', date: '2024-01-16', nurseFrom: 'Sr. Adjei', nurseTo: 'Sr. Koomson', doctorOnCall: 'Dr. Ansah', totalPatients: 18, criticalPatients: 1, newAdmissions: 3, discharges: 2, pendingResults: 2, pendingTasks: ['Post-op review Room 2', 'Ward round at 10:00'], criticalAlerts: ['Room 4: Post-op haemoglobin 7.2 - transfusion discussed with family'],
    patients: [
      { mrn: 'MRN-005', name: 'Nana Kweku', bed: 'Room 4', diagnosis: 'Post-op haemorrhage', status: 'Critical', keyUpdates: 'Hb dropped from 11 to 7.2 post-appendicectomy. 2 units crossmatched.', pendingTasks: 'Blood transfusion, repeat Hb', nextReview: '13:00', isolation: 'Standard' },
      { mrn: 'MRN-006', name: 'Efua Osei', bed: 'Room 2', diagnosis: 'Post-laparoscopy', status: 'Improving', keyUpdates: 'Tolerating fluids. Pain well controlled. Ambulated to bathroom.', pendingTasks: 'Surgical review', nextReview: 'Next shift', isolation: 'Standard' },
    ],
    completed: false,
  },
];

const STATUS_COLORS: Record<string, string> = {
  Critical: 'bg-red-100 text-red-800',
  Deteriorating: 'bg-orange-100 text-orange-800',
  Stable: 'bg-green-100 text-green-800',
  Improving: 'bg-blue-100 text-blue-800',
};

const SHIFT_COLORS: Record<string, string> = {
  Morning: 'bg-yellow-100 text-yellow-800',
  Evening: 'bg-orange-100 text-orange-800',
  Night: 'bg-blue-100 text-blue-800',
};

export default function HandoverNotesEnhanced() {
  const [handovers, setHandovers] = useState<HandoverNote[]>(SAMPLE_HANDOVERS);
  const [selectedHandover, setSelectedHandover] = useState<HandoverNote | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const completed = handovers.filter(h => h.completed);
  const pending = handovers.filter(h => !h.completed);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Handover Notes</h1>
          <p className="text-slate-500">Structured nursing shift handover with SBAR format and task tracking</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Icon name="plus" className="h-4 w-4" /> New Handover</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-slate-500">Pending Handovers</p>
          <p className="text-2xl font-bold text-orange-600">{pending.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Completed Today</p>
          <p className="text-2xl font-bold text-green-600">{completed.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Total Patients</p>
          <p className="text-2xl font-bold">{handovers.reduce((s, h) => s + h.totalPatients, 0)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Critical Patients</p>
          <p className="text-2xl font-bold text-red-600">{handovers.reduce((s, h) => s + h.criticalPatients, 0)}</p>
        </Card>
      </div>

      {/* Pending Handovers */}
      <h2 className="text-lg font-semibold">Pending Handovers</h2>
      <div className="space-y-4">
        {pending.map(h => (
          <Card key={h.id} className="p-4 cursor-pointer hover:shadow-md" onClick={() => setSelectedHandover(h)}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">{h.ward}</h3>
                <p className="text-sm text-slate-500">{h.date} • {h.shift} Shift • {h.id}</p>
              </div>
              <div className="flex gap-2">
                <Badge className={SHIFT_COLORS[h.shift]}>{h.shift}</Badge>
                <Badge className="bg-red-100 text-red-700">{h.criticalAlerts.length} Alerts</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <div className="bg-slate-50 rounded p-2"><span className="text-xs text-slate-500">From</span><p className="font-medium">{h.nurseFrom}</p></div>
              <div className="bg-slate-50 rounded p-2"><span className="text-xs text-slate-500">To</span><p className="font-medium">{h.nurseTo}</p></div>
              <div className="bg-slate-50 rounded p-2"><span className="text-xs text-slate-500">Doctor On-call</span><p className="font-medium">{h.doctorOnCall}</p></div>
              <div className="bg-slate-50 rounded p-2"><span className="text-xs text-slate-500">Total / Critical</span><p className="font-medium">{h.totalPatients} / <span className="text-red-600">{h.criticalPatients}</span></p></div>
              <div className="bg-slate-50 rounded p-2"><span className="text-xs text-slate-500">New Admit / DC</span><p className="font-medium">{h.newAdmissions} / {h.discharges}</p></div>
            </div>
            {h.criticalAlerts.length > 0 && (
              <div className="mt-3 space-y-1">
                {h.criticalAlerts.map((alert, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs bg-red-50 rounded p-2">
                    <Icon name="alert-triangle" className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-red-700">{alert}</span>
                  </div>
                ))}
              </div>
            )}
            {h.pendingTasks.length > 0 && (
              <div className="mt-3 space-y-1">
                {h.pendingTasks.slice(0, 3).map((task, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs bg-yellow-50 rounded p-2">
                    <Icon name="clock" className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span className="text-yellow-700">{task}</span>
                  </div>
                ))}
                {h.pendingTasks.length > 3 && <p className="text-xs text-slate-500">+{h.pendingTasks.length - 3} more tasks</p>}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedHandover && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{selectedHandover.ward} — {selectedHandover.shift} Handover</h2>
              <button onClick={() => setSelectedHandover(null)} className="text-slate-400 hover:text-slate-600"><Icon name="x" className="h-5 w-5" /></button>
            </div>

            {/* Critical Alerts */}
            {selectedHandover.criticalAlerts.length > 0 && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <h3 className="font-semibold text-red-700 text-sm mb-2">⚠️ Critical Alerts</h3>
                <ul className="space-y-1">
                  {selectedHandover.criticalAlerts.map((a, i) => <li key={i} className="text-sm text-red-600">• {a}</li>)}
                </ul>
              </div>
            )}

            {/* Patient Details */}
            <h3 className="font-semibold mb-3">Patient Handover</h3>
            <div className="space-y-3">
              {selectedHandover.patients.map(p => (
                <div key={p.mrn} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{p.name} — {p.bed}</h4>
                      <p className="text-xs text-slate-500">{p.mrn} • {p.diagnosis}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={`${STATUS_COLORS[p.status]} text-xs`}>{p.status}</Badge>
                      {p.isolation !== 'Standard' && <Badge className="bg-orange-100 text-orange-700 text-xs">{p.isolation}</Badge>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                    <div><span className="text-slate-500">Key Updates:</span><p>{p.keyUpdates}</p></div>
                    <div><span className="text-slate-500">Pending Tasks:</span><p>{p.pendingTasks}</p></div>
                    <div><span className="text-slate-500">Next Review:</span><p className="font-medium">{p.nextReview}</p></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setSelectedHandover(null)} className="px-4 py-2 bg-slate-100 rounded-lg text-sm">Close</button>
              <button onClick={() => { setHandovers(hs => hs.map(h => h.id === selectedHandover.id ? { ...h, completed: true } : h)); setSelectedHandover(null); }} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm">Complete Handover</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">New Handover Note</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600"><Icon name="x" className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><label className="block text-slate-600 mb-1">Ward</label><select className="w-full border rounded-lg px-3 py-2"><option>Medical Ward A</option><option>Medical Ward B</option><option>Surgical Ward A</option><option>Surgical Ward B</option><option>Paediatric Ward</option><option>Maternity Ward</option><option>ICU</option><option>Emergency</option></select></div>
              <div><label className="block text-slate-600 mb-1">Shift</label><select className="w-full border rounded-lg px-3 py-2"><option>Morning</option><option>Evening</option><option>Night</option></select></div>
              <div><label className="block text-slate-600 mb-1">Handing Over (Nurse)</label><input className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">Receiving (Nurse)</label><input className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">Doctor On-call</label><input className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">Total Patients</label><input type="number" className="w-full border rounded-lg px-3 py-2" /></div>
              <div className="col-span-2"><label className="block text-slate-600 mb-1">Critical Alerts (one per line)</label><textarea className="w-full border rounded-lg px-3 py-2" rows={3} placeholder="Room 3: BP 180/110 - recheck in 1hr" /></div>
              <div className="col-span-2"><label className="block text-slate-600 mb-1">Pending Tasks (one per line)</label><textarea className="w-full border rounded-lg px-3 py-2" rows={3} placeholder="Repeat bloods for Room 4" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-slate-100 rounded-lg text-sm">Cancel</button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Submit Handover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
