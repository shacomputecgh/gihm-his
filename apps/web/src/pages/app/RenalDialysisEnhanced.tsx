import { useState } from 'react';
import { Card, Badge, Button, Icon } from '../../components/ui';

interface DialysisPatient {
  id: string;
  patientName: string;
  mrn: string;
  age: number;
  sex: string;
  diagnosis: string;
  dialysisType: 'Haemodialysis' | 'Peritoneal' | 'CRRT';
  accessType: 'AVF' | 'AVG' | 'Catheter' | 'PD Catheter';
  accessSite: string;
  machine: string;
  sessionDate: string;
  sessionTime: string;
  duration: number;
  bloodFlowRate: number;
  dialysateFlow: number;
  ultrafiltration: number;
  preWeight: number;
  postWeight: number;
  weightLoss: number;
  preBP: string;
  postBP: string;
  heparinDose: string;
  complications: string;
  ktv: number;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  nextSession: string;
  lastKTV: number;
  dryWeight: number;
  assignedNurse: string;
  nephrologist: string;
}

const SAMPLE_PATIENTS: DialysisPatient[] = [
  { id: 'HD-001', patientName: 'Kwame Asante', mrn: 'MRN-2024-0156', age: 67, sex: 'M', diagnosis: 'CKD Stage 5 (DM)', dialysisType: 'Haemodialysis', accessType: 'AVF', accessSite: 'Left Forearm', machine: 'Fresenius 5008', sessionDate: '2024-01-16', sessionTime: '06:00', duration: 240, bloodFlowRate: 300, dialysateFlow: 500, ultrafiltration: 2200, preWeight: 78.5, postWeight: 76.3, weightLoss: 2.2, preBP: '148/88', postBP: '128/78', heparinDose: '5000 IU', complications: 'None', ktv: 1.4, status: 'Completed', nextSession: '2024-01-18', lastKTV: 1.4, dryWeight: 76.0, assignedNurse: 'Sr. Dialysis Mensah', nephrologist: 'Dr. Owusu' },
  { id: 'HD-002', patientName: 'Ama Darko', mrn: 'MRN-2024-0178', age: 45, sex: 'F', diagnosis: 'CKD Stage 5 (HTN)', dialysisType: 'Haemodialysis', accessType: 'Catheter', accessSite: 'Right Internal Jugular', machine: 'NxStage', sessionDate: '2024-01-16', sessionTime: '06:30', duration: 180, bloodFlowRate: 250, dialysateFlow: 500, ultrafiltration: 1800, preWeight: 62.0, postWeight: 60.2, weightLoss: 1.8, preBP: '162/92', postBP: '132/82', heparinDose: '3000 IU', complications: 'Hypotension at 2hrs', ktv: 1.2, status: 'In Progress', nextSession: '2024-01-18', lastKTV: 1.2, dryWeight: 60.0, assignedNurse: 'Sr. Dialysis Boateng', nephrologist: 'Dr. Owusu' },
  { id: 'HD-003', patientName: 'Kofi Tetteh', mrn: 'MRN-2024-0190', age: 58, sex: 'M', diagnosis: 'CKD Stage 5 (GN)', dialysisType: 'Haemodialysis', accessType: 'AVF', accessSite: 'Right Forearm', machine: 'Fresenius 5008', sessionDate: '2024-01-16', sessionTime: '11:00', duration: 240, bloodFlowRate: 320, dialysateFlow: 500, ultrafiltration: 2500, preWeight: 85.0, postWeight: 82.5, weightLoss: 2.5, preBP: '155/90', postBP: '125/75', heparinDose: '5000 IU', complications: 'None', ktv: 1.5, status: 'Scheduled', nextSession: '2024-01-18', lastKTV: 1.5, dryWeight: 82.0, assignedNurse: 'Sr. Dialysis Osei', nephrologist: 'Dr. Owusu' },
];

const STATUS_COLORS: Record<string, string> = {
  Scheduled: 'bg-blue-100 text-blue-800',
  'In Progress': 'bg-yellow-100 text-yellow-800',
  Completed: 'bg-green-100 text-green-800',
  Cancelled: 'bg-gray-100 text-gray-600',
};

const ACCESS_COLORS: Record<string, string> = {
  AVF: 'bg-green-100 text-green-700',
  AVG: 'bg-blue-100 text-blue-700',
  Catheter: 'bg-orange-100 text-orange-700',
  'PD Catheter': 'bg-purple-100 text-purple-700',
};

export default function RenalDialysisEnhanced() {
  const [patients] = useState<DialysisPatient[]>(SAMPLE_PATIENTS);
  const [selected, setSelected] = useState<DialysisPatient | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const completed = patients.filter(p => p.status === 'Completed');
  const inProgress = patients.filter(p => p.status === 'In Progress');
  const avgKTV = completed.length > 0 ? (completed.reduce((s, p) => s + p.ktv, 0) / completed.length).toFixed(2) : '0';
  const avgUF = completed.length > 0 ? Math.round(completed.reduce((s, p) => s + p.ultrafiltration, 0) / completed.length) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Renal Dialysis Unit</h1>
          <p className="text-slate-500">Dialysis scheduling, treatment tracking, and vascular access monitoring</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Icon name="plus" className="h-4 w-4" /> New Session</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4"><p className="text-sm text-slate-500">Today's Sessions</p><p className="text-2xl font-bold">{patients.length}</p></Card>
        <Card className="p-4"><p className="text-sm text-slate-500">Completed</p><p className="text-2xl font-bold text-green-600">{completed.length}</p></Card>
        <Card className="p-4"><p className="text-sm text-slate-500">In Progress</p><p className="text-2xl font-bold text-yellow-600">{inProgress.length}</p></Card>
        <Card className="p-4"><p className="text-sm text-slate-500">Avg Kt/V</p><p className={`text-2xl font-bold ${parseFloat(avgKTV) < 1.2 ? 'text-red-600' : 'text-green-600'}`}>{avgKTV}</p></Card>
        <Card className="p-4"><p className="text-sm text-slate-500">Avg UF Volume</p><p className="text-2xl font-bold">{avgUF} ml</p></Card>
      </div>

      <div className="space-y-4">
        {patients.map(p => (
          <Card key={p.id} className="p-4 cursor-pointer hover:shadow-md" onClick={() => setSelected(p)}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">{p.patientName}</h3>
                <p className="text-sm text-slate-500">{p.mrn} • {p.age}y/{p.sex} • {p.diagnosis}</p>
              </div>
              <Badge className={STATUS_COLORS[p.status]}>{p.status}</Badge>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-sm">
              <div className="bg-slate-50 rounded p-2"><p className="text-xs text-slate-500">Type</p><p className="font-medium">{p.dialysisType}</p></div>
              <div className="bg-slate-50 rounded p-2"><p className="text-xs text-slate-500">Machine</p><p className="font-medium">{p.machine}</p></div>
              <div className="bg-slate-50 rounded p-2"><p className="text-xs text-slate-500">Pre Weight</p><p className="font-medium">{p.preWeight} kg</p></div>
              <div className="bg-slate-50 rounded p-2"><p className="text-xs text-slate-500">UF Volume</p><p className="font-medium">{p.ultrafiltration} ml</p></div>
              <div className="bg-slate-50 rounded p-2"><p className="text-xs text-slate-500">Pre BP</p><p className="font-medium">{p.preBP}</p></div>
              <div className="bg-slate-50 rounded p-2"><p className="text-xs text-slate-500">Kt/V</p><p className={`font-medium ${p.ktv < 1.2 ? 'text-red-600' : 'text-green-600'}`}>{p.ktv}</p></div>
            </div>
            <div className="mt-3 flex gap-2 text-xs flex-wrap">
              <Badge className={ACCESS_COLORS[p.accessType]}>{p.accessType} - {p.accessSite}</Badge>
              {p.complications !== 'None' && <Badge className="bg-orange-100 text-orange-700">⚠️ {p.complications}</Badge>}
              <Badge className="bg-slate-100 text-slate-600">Next: {p.nextSession}</Badge>
              <Badge className="bg-slate-100 text-slate-600">Neph: {p.nephrologist}</Badge>
            </div>
          </Card>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Dialysis Session — {selected.patientName}</h2>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600"><Icon name="x" className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">Access:</span> <strong>{selected.accessType} ({selected.accessSite})</strong></div>
              <div><span className="text-slate-500">Machine:</span> <strong>{selected.machine}</strong></div>
              <div><span className="text-slate-500">Duration:</span> <strong>{selected.duration} min</strong></div>
              <div><span className="text-slate-500">Blood Flow:</span> <strong>{selected.bloodFlowRate} ml/min</strong></div>
              <div><span className="text-slate-500">Dialysate Flow:</span> <strong>{selected.dialysateFlow} ml/min</strong></div>
              <div><span className="text-slate-500">Heparin:</span> <strong>{selected.heparinDose}</strong></div>
              <div><span className="text-slate-500">Weight Loss:</span> <strong>{selected.weightLoss} kg ({selected.preWeight} → {selected.postWeight})</strong></div>
              <div><span className="text-slate-500">BP Change:</span> <strong>{selected.preBP} → {selected.postBP}</strong></div>
              <div><span className="text-slate-500">Kt/V:</span> <strong className={selected.ktv < 1.2 ? 'text-red-600' : 'text-green-600'}>{selected.ktv}</strong></div>
              <div><span className="text-slate-500">Dry Weight:</span> <strong>{selected.dryWeight} kg</strong></div>
            </div>
            {selected.complications !== 'None' && (
              <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm font-medium text-orange-700">⚠️ Complications: {selected.complications}</p>
              </div>
            )}
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
              <h2 className="text-xl font-bold">New Dialysis Session</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600"><Icon name="x" className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><label className="block text-slate-600 mb-1">Patient Name</label><input className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">MRN</label><input className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">Dialysis Type</label><select className="w-full border rounded-lg px-3 py-2"><option>Haemodialysis</option><option>Peritoneal</option><option>CRRT</option></select></div>
              <div><label className="block text-slate-600 mb-1">Access Type</label><select className="w-full border rounded-lg px-3 py-2"><option>AVF</option><option>AVG</option><option>Catheter</option><option>PD Catheter</option></select></div>
              <div><label className="block text-slate-600 mb-1">Access Site</label><input className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">Machine</label><select className="w-full border rounded-lg px-3 py-2"><option>Fresenius 5008</option><option>NxStage</option><option>Gambro</option></select></div>
              <div><label className="block text-slate-600 mb-1">Scheduled Time</label><input type="time" className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">Duration (min)</label><input type="number" defaultValue={240} className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">Pre Weight (kg)</label><input type="number" step="0.1" className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">Blood Flow Rate</label><input type="number" defaultValue={300} className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">Heparin Dose</label><input defaultValue="5000 IU" className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-slate-600 mb-1">Nephrologist</label><input className="w-full border rounded-lg px-3 py-2" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-slate-100 rounded-lg text-sm">Cancel</button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Start Session</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
