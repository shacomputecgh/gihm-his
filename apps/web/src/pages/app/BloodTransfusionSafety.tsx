import { useState } from 'react';
import { Badge, Button, Card, Input, useToast } from '../../components/ui';

interface TransfusionRecord {
  id: string; patientName: string; mrn: string; ward: string;
  bloodType: string; component: string; units: number;
  crossmatchResult: string; preChecks: string[];
  startedBy: string; startTime: string; endTime: string;
  rate: string; vitalsPre: string; vitalsPost: string;
  reaction: string; reactionType: string;
  status: 'Ordered' | 'Crossmatched' | 'Transfusing' | 'Completed' | 'Reaction';
}

const INITIAL: TransfusionRecord[] = [
  { id: 'BT-001', patientName: 'Abena Osei', mrn: 'MRN-2026-010', ward: 'ICU', bloodType: 'O+', component: 'Packed Red Blood Cells', units: 2, crossmatchResult: 'Compatible', preChecks: ['Patient ID verified', 'Blood type verified', 'Consent obtained', 'IV access confirmed'], startedBy: 'Nurse Abena', startTime: '2026-08-25 06:00', endTime: '2026-08-25 09:30', rate: '2 units over 3.5 hours', vitalsPre: 'BP 92/58, Pulse 110, Temp 37.2°C', vitalsPost: 'BP 105/68, Pulse 92, Temp 37.0°C', reaction: 'None', reactionType: '', status: 'Completed' },
  { id: 'BT-002', patientName: 'Kwaku Mensah', mrn: 'MRN-2026-090', ward: 'Surgical Ward', bloodType: 'A+', component: 'Fresh Frozen Plasma', units: 3, crossmatchResult: 'Compatible', preChecks: ['Patient ID verified', 'Blood type verified', 'Consent obtained'], startedBy: 'Nurse Kofi', startTime: '2026-08-25 10:00', endTime: '', rate: '3 units over 2 hours', vitalsPre: 'BP 118/72, Pulse 78, Temp 36.8°C', vitalsPost: '', reaction: '', reactionType: '', status: 'Transfusing' },
  { id: 'BT-003', patientName: 'Ama Darko', mrn: 'MRN-2026-041', ward: 'Maternity', bloodType: 'B-', component: 'Packed Red Blood Cells', units: 1, crossmatchResult: 'Compatible', preChecks: ['Patient ID verified', 'Blood type verified', 'Consent obtained', 'IV access confirmed'], startedBy: 'Nurse Efua', startTime: '2026-08-25 04:30', endTime: '2026-08-25 05:45', rate: '1 unit over 75 minutes', vitalsPre: 'BP 88/52, Pulse 118, Temp 37.5°C', vitalsPost: 'BP 102/64, Pulse 96, Temp 37.3°C', reaction: 'Mild urticaria — responded to antihistamine', reactionType: 'Allergic', status: 'Reaction' },
];

const COMPONENTS = ['Packed Red Blood Cells', 'Fresh Frozen Plasma', 'Platelets', 'Cryoprecipitate', 'Whole Blood'];
const STATUS_CONFIG: Record<string, { tone: 'red' | 'gold' | 'blue' | 'green' }> = {
  Ordered: { tone: 'blue' }, Crossmatched: { tone: 'gold' }, Transfusing: { tone: 'red' }, Completed: { tone: 'green' }, Reaction: { tone: 'red' },
};

export default function BloodTransfusionSafety() {
  const [records] = useState<TransfusionRecord[]>(INITIAL);
  const [showForm, setShowForm] = useState(false);
  const toast = useToast();
  const reactions = records.filter((r) => r.status === 'Reaction').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Blood Transfusion Safety</h1><p className="text-gray-500">Transfusion tracking, pre-check verification, reaction monitoring, and vigilance reporting</p></div>
        <Button onClick={() => setShowForm(true)}>+ New Transfusion</Button>
      </div>
      {reactions > 0 && <div className="bg-red-50 border border-red-300 rounded-lg p-3 text-red-700 font-bold">🚨 {reactions} transfusion reaction(s) reported — requires immediate attention</div>}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(STATUS_CONFIG).map(([status]) => (
          <Card key={status} className="p-3 text-center"><div className="text-xl font-bold">{records.filter((r) => r.status === status).length}</div><div className="text-xs text-gray-500">{status}</div></Card>
        ))}
      </div>
      <div className="space-y-4">
        {records.map((r) => (
          <Card key={r.id} className={`p-4 ${r.status === 'Reaction' ? 'border-red-300 bg-red-50' : r.status === 'Transfusing' ? 'border-orange-300' : ''}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">{r.patientName}</span>
                  <span className="text-sm text-gray-400">{r.mrn} · {r.ward}</span>
                  <Badge tone={STATUS_CONFIG[r.status]?.tone}>{r.status}</Badge>
                </div>
                <p className="text-sm text-gray-600">{r.bloodType} · {r.component} × {r.units} units · Crossmatch: {r.crossmatchResult}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs bg-gray-50 rounded-lg p-3 mb-2">
              <div><span className="text-gray-500">Pre-Check:</span><div>{r.preChecks.join(', ')}</div></div>
              <div><span className="text-gray-500">Vitals Pre:</span><div>{r.vitalsPre}</div></div>
              <div><span className="text-gray-500">Vitals Post:</span><div>{r.vitalsPost || 'Pending'}</div></div>
            </div>
            <div className="text-xs text-gray-500">Started by: {r.startedBy} · {r.startTime} {r.endTime ? `→ ${r.endTime}` : ''} · Rate: {r.rate}</div>
            {r.reaction && (
              <div className="mt-2 bg-red-50 border border-red-200 rounded p-2 text-sm">
                <strong className="text-red-700">⚠️ Reaction ({r.reactionType}):</strong> <span className="text-red-600">{r.reaction}</span>
              </div>
            )}
          </Card>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowForm(false)} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-bold">✕</button>
            <h2 className="text-lg font-bold mb-4">New Blood Transfusion Order</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm mb-1">Patient Name *</label><Input placeholder="Full name" /></div>
                <div><label className="block text-sm mb-1">MRN *</label><Input placeholder="MRN" /></div>
                <div><label className="block text-sm mb-1">Blood Type *</label><Input placeholder="e.g. O+" /></div>
                <div><label className="block text-sm mb-1">Component *</label><select className="w-full border rounded-lg p-2 text-sm">{COMPONENTS.map((c) => <option key={c}>{c}</option>)}</select></div>
                <div><label className="block text-sm mb-1">Units Required *</label><Input type="number" min="1" /></div>
                <div><label className="block text-sm mb-1">Clinical Indication *</label><Input placeholder="e.g. Postpartum haemorrhage" /></div>
              </div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={() => { setShowForm(false); toast('Transfusion order placed'); }}>Place Order</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
