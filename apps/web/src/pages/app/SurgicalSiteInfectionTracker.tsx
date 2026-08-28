import { useState } from 'react';
import { Badge, Button, Card, Input, useToast } from '../../components/ui';

interface SSICase {
  id: string; patientName: string; mrn: string; age: number;
  procedure: string; surgeon: string; dateOfSurgery: string;
  dateOfInfection: string; classification: string; organism: string;
  depth: string; treatment: string; dayPostOp: number;
  status: 'Surveillance' | 'Superficial' | 'Deep Incisional' | 'Organ/Space' | 'Resolved';
}

const INITIAL: SSICase[] = [
  { id: 'SSI-001', patientName: 'Kwaku Mensah', mrn: 'MRN-2026-120', age: 55, procedure: 'Laparotomy', surgeon: 'Dr. Boateng', dateOfSurgery: '2026-08-18', dateOfInfection: '2026-08-25', classification: 'Deep Incisional', organism: 'E. coli', depth: 'Deep fascial layer', treatment: 'Washout + IV Ceftriaxone + Metronidazole', dayPostOp: 7, status: 'Deep Incisional' },
  { id: 'SSI-002', patientName: 'Ama Asare', mrn: 'MRN-2026-121', age: 42, procedure: 'Caesarean Section', surgeon: 'Dr. Afriyie', dateOfSurgery: '2026-08-22', dateOfInfection: '2026-08-25', classification: 'Superficial', organism: 'Staph aureus', depth: 'Skin and subcutaneous', treatment: 'Wound care + oral Flucloxacillin', dayPostOp: 3, status: 'Superficial' },
];

const STATUS_CONFIG: Record<string, { tone: 'red' | 'gold' | 'blue' | 'green' }> = {
  Surveillance: { tone: 'blue' }, Superficial: { tone: 'gold' },
  'Deep Incisional': { tone: 'red' }, 'Organ/Space': { tone: 'red' }, Resolved: { tone: 'green' },
};

export default function SurgicalSiteInfectionTracker() {
  const [cases] = useState<SSICase[]>(INITIAL);
  const [showForm, setShowForm] = useState(false);
  const toast = useToast();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Surgical Site Infection Tracker</h1><p className="text-gray-500">SSI surveillance, classification, organism identification, and prevention protocols</p></div>
        <Button onClick={() => setShowForm(true)}>+ Report SSI</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 text-center"><div className="text-xl font-bold text-blue-600">{cases.length}</div><div className="text-xs text-gray-500">Total SSIs</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-yellow-600">{cases.filter((c) => c.status === 'Superficial').length}</div><div className="text-xs text-gray-500">Superficial</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-red-600">{cases.filter((c) => c.status === 'Deep Incisional' || c.status === 'Organ/Space').length}</div><div className="text-xs text-gray-500">Deep/Organ</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-green-600">{cases.filter((c) => c.status === 'Resolved').length}</div><div className="text-xs text-gray-500">Resolved</div></Card>
      </div>
      <div className="space-y-4">
        {cases.map((c) => (
          <Card key={c.id} className={`p-4 ${c.status === 'Deep Incisional' || c.status === 'Organ/Space' ? 'border-red-300' : ''}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">{c.patientName}</span>
                  <span className="text-sm text-gray-400">{c.mrn} · Age {c.age}</span>
                  <Badge tone={STATUS_CONFIG[c.status]?.tone}>{c.status}</Badge>
                </div>
                <p className="text-sm text-gray-600">{c.procedure} · Surgeon: {c.surgeon} · Day {c.dayPostOp} post-op</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs bg-gray-50 rounded-lg p-3 mb-2">
              <div><span className="text-gray-500">Surgery:</span><div className="font-medium">{c.dateOfSurgery}</div></div>
              <div><span className="text-gray-500">Infection:</span><div className="font-medium">{c.dateOfInfection}</div></div>
              <div><span className="text-gray-500">Organism:</span><div className="font-medium">{c.organism}</div></div>
              <div><span className="text-gray-500">Depth:</span><div className="font-medium">{c.depth}</div></div>
            </div>
            <div className="text-xs bg-blue-50 rounded p-2"><strong>Treatment:</strong> {c.treatment}</div>
          </Card>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowForm(false)} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-bold">✕</button>
            <h2 className="text-lg font-bold mb-4">Report Surgical Site Infection</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm mb-1">Patient Name *</label><Input placeholder="Full name" /></div>
                <div><label className="block text-sm mb-1">MRN *</label><Input placeholder="MRN" /></div>
                <div><label className="block text-sm mb-1">Procedure *</label><Input placeholder="Original procedure" /></div>
                <div><label className="block text-sm mb-1">Date of Surgery *</label><Input type="date" /></div>
                <div><label className="block text-sm mb-1">Date of Infection *</label><Input type="date" /></div>
                <div><label className="block text-sm mb-1">Organism *</label><Input placeholder="e.g. E. coli, Staph aureus" /></div>
              </div>
              <div><label className="block text-sm mb-1">Classification *</label>
                <select className="w-full border rounded-lg p-2 text-sm"><option>Superficial</option><option>Deep Incisional</option><option>Organ/Space</option></select>
              </div>
              <div><label className="block text-sm mb-1">Treatment *</label><textarea className="w-full border rounded-lg p-2 text-sm" rows={2} /></div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={() => { setShowForm(false); toast('SSI reported'); }}>Report</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
