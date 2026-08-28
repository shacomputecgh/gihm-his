import { useState } from 'react';
import { Badge, Button, Card, Input, Select, useToast } from '../../components/ui';

interface ObstetricEmergency {
  id: string; patientName: string; mrn: string; age: number;
  gravida: number; parity: number; gestationalAge: string;
  emergencyType: string; severity: 'Mild' | 'Moderate' | 'Severe' | 'Critical';
  status: 'Active' | 'Stabilised' | 'Referred' | 'Resolved';
  presentingComplaint: string; vitals: string; treatment: string;
  managingTeam: string; arrivalTime: string;
}

const INITIAL: ObstetricEmergency[] = [
  { id: 'OE-001', patientName: 'Ama Darko', mrn: 'MRN-2026-041', age: 28, gravida: 2, parity: 1, gestationalAge: '36 weeks', emergencyType: 'Pre-eclampsia', severity: 'Severe', status: 'Active', presentingComplaint: 'Severe headache, visual disturbances, BP 180/110', vitals: 'BP 180/110, Pulse 98, SpO2 97%, Protein ++', treatment: 'IV Labetalol, MgSO4 loading dose, seizure prophylaxis', managingTeam: 'Dr. Afriyie + Midwife Abena', arrivalTime: '2026-08-25 10:30' },
  { id: 'OE-002', patientName: 'Efua Ansah', mrn: 'MRN-2026-050', age: 35, gravida: 5, parity: 4, gestationalAge: '38 weeks', emergencyType: 'Postpartum Haemorrhage', severity: 'Critical', status: 'Active', presentingComplaint: 'Heavy vaginal bleeding after normal delivery, >500ml', vitals: 'BP 85/50, Pulse 120, Hb 7.2', treatment: 'IV fluids, Oxytocin, Misoprostol, Blood transfusion 2 units', managingTeam: 'Dr. Afriyie + Dr. Boateng (Obs Theatre)', arrivalTime: '2026-08-25 04:00' },
  { id: 'OE-003', patientName: 'Adwoa Mensah', mrn: 'MRN-2026-051', age: 22, gravida: 1, parity: 0, gestationalAge: '39 weeks', emergencyType: 'Cord Prolapse', severity: 'Critical', status: 'Stabilised', presentingComplaint: 'Umbilical cord prolapse after ROM', vitals: 'BP 110/70, Pulse 88, FHR 140 variable decelerations', treatment: 'Trendelenburg, Elevate presenting part, Emergency C-section', managingTeam: 'Dr. Afriyie + Dr. Boateng', arrivalTime: '2026-08-24 22:15' },
];

const EMERGENCY_TYPES = ['Pre-eclampsia', 'Eclampsia', 'Postpartum Haemorrhage', 'Antepartum Haemorrhage', 'Cord Prolapse', 'Uterine Rupture', 'Amniotic Fluid Embolism', 'Ectopic Pregnancy', 'Hyperemesis Gravidarum', 'HELLP Syndrome', 'Placenta Praevia', 'Abruptio Placentae'];
const SEVERITY_CONFIG: Record<string, { color: string; tone: 'green' | 'gold' | 'red' | 'blue' }> = {
  Mild: { color: 'bg-green-100 text-green-800', tone: 'green' }, Moderate: { color: 'bg-yellow-100 text-yellow-800', tone: 'gold' },
  Severe: { color: 'bg-orange-100 text-orange-800', tone: 'gold' }, Critical: { color: 'bg-red-100 text-red-800', tone: 'red' },
};

export default function ObstetricEmergency() {
  const [records] = useState<ObstetricEmergency[]>(INITIAL);
  const [showForm, setShowForm] = useState(false);
  const toast = useToast();
  const active = records.filter((r) => r.status === 'Active').length;
  const critical = records.filter((r) => r.severity === 'Critical').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Obstetric Emergency Unit</h1><p className="text-gray-500">Manage obstetric emergencies — eclampsia, PPH, cord prolapse, and more</p></div>
        <Button onClick={() => setShowForm(true)}>+ Register Emergency</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 text-center"><div className="text-xl font-bold text-red-600">{active}</div><div className="text-xs text-gray-500">Active Cases</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-red-600">{critical}</div><div className="text-xs text-gray-500">Critical</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-green-600">{records.filter((r) => r.status === 'Stabilised' || r.status === 'Resolved').length}</div><div className="text-xs text-gray-500">Stabilised/Resolved</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-blue-600">{records.length}</div><div className="text-xs text-gray-500">Total Today</div></Card>
      </div>
      {critical > 0 && <div className="bg-red-50 border border-red-300 rounded-lg p-3 text-red-700 font-bold">🚨 CRITICAL OBSTETRIC EMERGENCY — {critical} case(s) requiring immediate attention</div>}
      <div className="space-y-4">
        {records.map((r) => (
          <Card key={r.id} className={`p-4 ${r.severity === 'Critical' ? 'border-red-300 bg-red-50' : r.severity === 'Severe' ? 'border-orange-300' : ''}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">{r.patientName}</span>
                  <span className="text-sm text-gray-400">{r.mrn} · Age {r.age}</span>
                  <Badge tone={SEVERITY_CONFIG[r.severity]?.tone}>{r.severity}</Badge>
                </div>
                <p className="text-sm text-gray-600">G{r.gravida}P{r.parity} · {r.gestationalAge} · {r.emergencyType}</p>
              </div>
              <Badge tone={r.status === 'Active' ? 'red' : r.status === 'Stabilised' ? 'gold' : 'green'}>{r.status}</Badge>
            </div>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div className="bg-white p-3 rounded-lg border">
                <div className="font-medium text-gray-700 mb-1">Presenting Complaint</div>
                <div>{r.presentingComplaint}</div>
                <div className="font-medium text-gray-700 mt-2 mb-1">Vitals</div>
                <div className="text-gray-600">{r.vitals}</div>
              </div>
              <div className="bg-white p-3 rounded-lg border">
                <div className="font-medium text-gray-700 mb-1">Treatment</div>
                <div>{r.treatment}</div>
                <div className="font-medium text-gray-700 mt-2 mb-1">Team</div>
                <div className="text-gray-600">{r.managingTeam}</div>
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-2">Arrival: {r.arrivalTime}</div>
          </Card>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowForm(false)} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-bold">✕</button>
            <h2 className="text-lg font-bold mb-4">Register Obstetric Emergency</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm mb-1">Patient Name *</label><Input placeholder="Full name" /></div>
                <div><label className="block text-sm mb-1">MRN *</label><Input placeholder="MRN" /></div>
                <div><label className="block text-sm mb-1">Age *</label><Input type="number" /></div>
                <div><label className="block text-sm mb-1">Emergency Type *</label><Select>{EMERGENCY_TYPES.map((t) => <option key={t}>{t}</option>)}</Select></div>
                <div><label className="block text-sm mb-1">Gravida</label><Input type="number" /></div>
                <div><label className="block text-sm mb-1">Parity</label><Input type="number" /></div>
                <div><label className="block text-sm mb-1">Gestational Age</label><Input placeholder="e.g. 36 weeks" /></div>
                <div><label className="block text-sm mb-1">Severity *</label><Select>{Object.keys(SEVERITY_CONFIG).map((s) => <option key={s}>{s}</option>)}</Select></div>
              </div>
              <div><label className="block text-sm mb-1">Presenting Complaint *</label><textarea className="w-full border rounded-lg p-2 text-sm" rows={2} /></div>
              <div><label className="block text-sm mb-1">Treatment Initiated *</label><textarea className="w-full border rounded-lg p-2 text-sm" rows={2} /></div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={() => { setShowForm(false); toast('Obstetric emergency registered'); }}>Register</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
