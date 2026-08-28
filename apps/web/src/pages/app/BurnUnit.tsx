import { useState } from 'react';
import { Badge, Button, Card, Input, Select, useToast } from '../../components/ui';

interface BurnPatient {
  id: string; patientName: string; mrn: string; age: number; sex: string;
  mechanism: string; burnDepth: string; bodySurfaceArea: number;
  location: string; inhalationInjury: boolean; timeSinceInjury: string;
  parklandVolume: number; fluidsGiven: number; urineOutput: number;
  painScore: number; status: 'Acute' | 'Stabilised' | 'Surgical' | 'Rehab' | 'Discharged';
  plan: string;
}

const INITIAL: BurnPatient[] = [
  { id: 'BURN-001', patientName: 'Kwaku Asante', mrn: 'MRN-2026-070', age: 32, sex: 'M', mechanism: 'House fire — flame burn', burnDepth: 'Mixed: Deep partial-thick + Full-thick', bodySurfaceArea: 25, location: 'Upper body, arms, face', inhalationInjury: true, timeSinceInjury: '6 hours', parklandVolume: 5600, fluidsGiven: 3200, urineOutput: 45, painScore: 8, status: 'Acute', plan: 'Parkland formula resuscitation. ICU admission. Surgical review for escharotomy.' },
  { id: 'BURN-002', patientName: 'Akosua Mensah', mrn: 'MRN-2026-071', age: 5, sex: 'F', mechanism: 'Scald — hot water', burnDepth: 'Superficial partial-thick', bodySurfaceArea: 8, location: 'Left leg, lower trunk', inhalationInjury: false, timeSinceInjury: '2 hours', parklandVolume: 768, fluidsGiven: 500, urineOutput: 30, painScore: 6, status: 'Stabilised', plan: 'Conservative management. Daily dressing. Pain management. Child life support.' },
];

export default function BurnUnit() {
  const [records] = useState<BurnPatient[]>(INITIAL);
  const [showForm, setShowForm] = useState(false);
  const toast = useToast();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Burn Unit</h1><p className="text-gray-500">Burn patient management, TBSA assessment, Parkland formula, and wound care</p></div>
        <Button onClick={() => setShowForm(true)}>+ Admit Burn Patient</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 text-center"><div className="text-xl font-bold text-red-600">{records.length}</div><div className="text-xs text-gray-500">Total Patients</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-orange-600">{records.filter((r) => r.inhalationInjury).length}</div><div className="text-xs text-gray-500">Inhalation Injury</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-blue-600">{records.filter((r) => r.bodySurfaceArea > 20).length}</div><div className="text-xs text-gray-500">Major Burns (TBSA {'>'}20%)</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-green-600">{records.filter((r) => r.status === 'Rehab' || r.status === 'Discharged').length}</div><div className="text-xs text-gray-500">Rehab/Discharged</div></Card>
      </div>
      <div className="space-y-4">
        {records.map((r) => {
          const depthScore = r.bodySurfaceArea > 20 || r.inhalationInjury ? 'Critical' : r.bodySurfaceArea > 10 ? 'Major' : 'Minor';
          return (
            <Card key={r.id} className={`p-4 ${depthScore === 'Critical' ? 'border-red-300 bg-red-50' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">{r.patientName}</span>
                    <span className="text-sm text-gray-400">{r.mrn} · {r.age}{r.sex}</span>
                    <Badge tone={depthScore === 'Critical' ? 'red' : depthScore === 'Major' ? 'gold' : 'green'}>{depthScore}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{r.mechanism} · {r.burnDepth}</p>
                </div>
                <Badge tone={r.status === 'Acute' ? 'red' : 'green'}>{r.status}</Badge>
              </div>
              <div className="grid grid-cols-4 gap-3 text-sm bg-white p-3 rounded-lg border">
                <div><span className="text-gray-500 text-xs">TBSA</span><div className="font-bold text-lg">{r.bodySurfaceArea}%</div></div>
                <div><span className="text-gray-500 text-xs">Location</span><div className="font-medium text-xs">{r.location}</div></div>
                <div><span className="text-gray-500 text-xs">Inhalation</span><div className="font-medium">{r.inhalationInjury ? '⚠️ Yes' : 'No'}</div></div>
                <div><span className="text-gray-500 text-xs">Pain</span><div className="font-bold">{r.painScore}/10</div></div>
                <div><span className="text-gray-500 text-xs">Parkland Volume</span><div className="font-medium">{r.parklandVolume} mL</div></div>
                <div><span className="text-gray-500 text-xs">Fluids Given</span><div className="font-medium">{r.fluidsGiven} mL</div></div>
                <div><span className="text-gray-500 text-xs">Urine Output</span><div className="font-medium">{r.urineOutput} mL/hr</div></div>
                <div><span className="text-gray-500 text-xs">Time Since Injury</span><div className="font-medium">{r.timeSinceInjury}</div></div>
              </div>
              <div className="mt-2 bg-blue-50 rounded p-2 text-sm"><strong>Plan:</strong> {r.plan}</div>
            </Card>
          );
        })}
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowForm(false)} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-bold">✕</button>
            <h2 className="text-lg font-bold mb-4">Admit Burn Patient</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm mb-1">Patient Name *</label><Input placeholder="Full name" /></div>
                <div><label className="block text-sm mb-1">MRN *</label><Input placeholder="MRN" /></div>
                <div><label className="block text-sm mb-1">Age *</label><Input type="number" /></div>
                <div><label className="block text-sm mb-1">Sex *</label><Select><option>M</option><option>F</option></Select></div>
                <div><label className="block text-sm mb-1">TBSA (%) *</label><Input type="number" min="0" max="100" /></div>
                <div><label className="block text-sm mb-1">Mechanism *</label><Input placeholder="e.g. Flame, Scald, Electric" /></div>
              </div>
              <div><label className="block text-sm mb-1">Burn Depth *</label><Input placeholder="e.g. Superficial, Partial-thick, Full-thick" /></div>
              <div><label className="block text-sm mb-1">Location on Body *</label><Input placeholder="e.g. Upper body, arms" /></div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={() => { setShowForm(false); toast('Burn patient admitted'); }}>Admit</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
