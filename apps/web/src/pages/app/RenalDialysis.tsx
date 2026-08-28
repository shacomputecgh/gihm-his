import { useState } from 'react';
import { Badge, Button, Card, Input, Select, useToast } from '../../components/ui';

interface DialysisSession {
  id: string; patientName: string; mrn: string; age: number; sex: string;
  diagnosis: string; accessType: string; accessSite: string;
  dialysisType: 'Haemodialysis' | 'Peritoneal Dialysis' | 'CRRT';
  frequency: string; sessionNumber: number;
  lastSession: string; nextSession: string;
  dryWeight: number; preWeight: number; postWeight: number; ultrafiltration: number;
  bloodFlow: number; dialysateFlow: number; timeOnDialysis: string;
  status: 'Active' | 'Completed' | 'Missed' | 'Cancelled';
  complications: string[];
}

const INITIAL: DialysisSession[] = [
  { id: 'DD-001', patientName: 'Kofi Mensah', mrn: 'MRN-2026-060', age: 58, sex: 'M', diagnosis: 'End-Stage Renal Disease (DM)', accessType: 'AV Fistula', accessSite: 'Left Forearm', dialysisType: 'Haemodialysis', frequency: '3x/week', sessionNumber: 156, lastSession: '2026-08-23', nextSession: '2026-08-25', dryWeight: 72, preWeight: 74.5, postWeight: 72.2, ultrafiltration: 2300, bloodFlow: 300, dialysateFlow: 500, timeOnDialysis: '4 hours', status: 'Completed', complications: [] },
  { id: 'DD-002', patientName: 'Ama Osei', mrn: 'MRN-2026-061', age: 45, sex: 'F', diagnosis: 'End-Stage Renal Disease (HTN)', accessType: 'Peritoneal Catheter', accessSite: 'Abdomen', dialysisType: 'Peritoneal Dialysis', frequency: 'Daily', sessionNumber: 892, lastSession: '2026-08-24', nextSession: '2026-08-25', dryWeight: 62, preWeight: 64.2, postWeight: 62.5, ultrafiltration: 1700, bloodFlow: 0, dialysateFlow: 0, timeOnDialysis: '8 hours (overnight)', status: 'Completed', complications: ['Peritonitis episode 2 weeks ago — resolved'] },
  { id: 'DD-003', patientName: 'Yaw Asare', mrn: 'MRN-2026-062', age: 65, sex: 'M', diagnosis: 'End-Stage Renal Disease (PKD)', accessType: 'AV Graft', accessSite: 'Right Arm', dialysisType: 'Haemodialysis', frequency: '3x/week', sessionNumber: 78, lastSession: '2026-08-22', nextSession: '2026-08-25', dryWeight: 80, preWeight: 83.1, postWeight: 80.4, ultrafiltration: 2700, bloodFlow: 280, dialysateFlow: 500, timeOnDialysis: '4.5 hours', status: 'Active', complications: ['Access stenosis — under investigation'] },
];

const DIALYSIS_TYPES = ['Haemodialysis', 'Peritoneal Dialysis', 'CRRT'];
const ACCESS_TYPES = ['AV Fistula', 'AV Graft', 'Temporary Catheter', 'Peritoneal Catheter', 'Tunnelled Catheter'];

export default function RenalDialysis() {
  const [records] = useState<DialysisSession[]>(INITIAL);
  const [showForm, setShowForm] = useState(false);
  const toast = useToast();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Renal Dialysis Unit</h1><p className="text-gray-500">Dialysis sessions, prescriptions, vascular access, and patient management</p></div>
        <Button onClick={() => setShowForm(true)}>+ New Session</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 text-center"><div className="text-xl font-bold text-blue-600">{records.length}</div><div className="text-xs text-gray-500">Active Patients</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-green-600">{records.filter((r) => r.dialysisType === 'Haemodialysis').length}</div><div className="text-xs text-gray-500">Haemodialysis</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-purple-600">{records.filter((r) => r.dialysisType === 'Peritoneal Dialysis').length}</div><div className="text-xs text-gray-500">Peritoneal</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-orange-600">{records.filter((r) => r.complications.length > 0).length}</div><div className="text-xs text-gray-500">With Complications</div></Card>
      </div>
      <div className="space-y-4">
        {records.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">{r.patientName}</span>
                  <span className="text-sm text-gray-400">{r.mrn} · {r.age}{r.sex}</span>
                  <Badge tone="blue">{r.dialysisType}</Badge>
                </div>
                <p className="text-sm text-gray-600">{r.diagnosis} · {r.accessType} ({r.accessSite}) · Session #{r.sessionNumber}</p>
              </div>
              <Badge tone={r.status === 'Active' ? 'green' : 'gray'}>{r.status}</Badge>
            </div>
            <div className="grid grid-cols-4 gap-3 text-sm bg-gray-50 rounded-lg p-3">
              <div><span className="text-gray-500 text-xs">Dry Weight</span><div className="font-medium">{r.dryWeight} kg</div></div>
              <div><span className="text-gray-500 text-xs">Pre-Weight</span><div className="font-medium">{r.preWeight} kg</div></div>
              <div><span className="text-gray-500 text-xs">Post-Weight</span><div className="font-medium">{r.postWeight} kg</div></div>
              <div><span className="text-gray-500 text-xs">Ultrafiltration</span><div className="font-medium">{r.ultrafiltration} mL</div></div>
              {r.bloodFlow > 0 && <>
                <div><span className="text-gray-500 text-xs">Blood Flow</span><div className="font-medium">{r.bloodFlow} mL/min</div></div>
                <div><span className="text-gray-500 text-xs">Dialysate Flow</span><div className="font-medium">{r.dialysateFlow} mL/min</div></div>
              </>}
              <div><span className="text-gray-500 text-xs">Time</span><div className="font-medium">{r.timeOnDialysis}</div></div>
              <div><span className="text-gray-500 text-xs">Frequency</span><div className="font-medium">{r.frequency}</div></div>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span>Last: {r.lastSession}</span><span>Next: {r.nextSession}</span>
            </div>
            {r.complications.length > 0 && (
              <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded p-2 text-sm">
                ⚠️ {r.complications.join(' · ')}
              </div>
            )}
          </Card>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowForm(false)} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-bold">✕</button>
            <h2 className="text-lg font-bold mb-4">Register Dialysis Session</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm mb-1">Patient Name *</label><Input placeholder="Full name" /></div>
                <div><label className="block text-sm mb-1">MRN *</label><Input placeholder="MRN" /></div>
                <div><label className="block text-sm mb-1">Dialysis Type *</label><Select>{DIALYSIS_TYPES.map((t) => <option key={t}>{t}</option>)}</Select></div>
                <div><label className="block text-sm mb-1">Access Type *</label><Select>{ACCESS_TYPES.map((a) => <option key={a}>{a}</option>)}</Select></div>
                <div><label className="block text-sm mb-1">Pre-Weight (kg)</label><Input type="number" step="0.1" /></div>
                <div><label className="block text-sm mb-1">Dry Weight (kg)</label><Input type="number" step="0.1" /></div>
                <div><label className="block text-sm mb-1">Blood Flow (mL/min)</label><Input type="number" /></div>
                <div><label className="block text-sm mb-1">Duration</label><Input placeholder="e.g. 4 hours" /></div>
              </div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={() => { setShowForm(false); toast('Dialysis session recorded'); }}>Record Session</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
