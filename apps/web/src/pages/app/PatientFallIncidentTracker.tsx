import { useState } from 'react';
import { Badge, Button, Card, Input, useToast } from '../../components/ui';

interface FallIncident {
  id: string; patientName: string; mrn: string; age: number; ward: string;
  date: string; time: string; location: string;
  circumstances: string; injury: string; fallRiskAssessment: string;
  contributingFactors: string[]; actionTaken: string;
  status: 'Reported' | 'Investigation' | 'Action Taken' | 'Closed';
  severity: 'Near Miss' | 'Minor' | 'Moderate' | 'Major';
}

const INITIAL: FallIncident[] = [
  { id: 'FI-001', patientName: 'Akua Mensah', mrn: 'MRN-2026-130', age: 78, ward: 'Geriatric Ward', date: '2026-08-25', time: '02:30', location: 'Bedside', circumstances: 'Patient found on floor beside bed. Bed rail was down. Patient attempting to go to toilet unassisted.', injury: 'Bruising to left hip — no fracture', fallRiskAssessment: 'High Risk (score 8)', contributingFactors: ['Bed rail down', 'No call bell use', 'Urgency to toilet', '夜间未巡视'], actionTaken: 'X-ray — no fracture. Bed rails up. Hourly rounding at night. Commode at bedside. Family informed.', status: 'Action Taken', severity: 'Moderate' },
  { id: 'FI-002', patientName: 'Yaw Asare', mrn: 'MRN-2026-131', age: 45, ward: 'Surgical Ward', date: '2026-08-24', time: '14:00', location: 'Bathroom', circumstances: 'Patient slipped on wet floor while walking to bathroom after surgery. Nurse was assisting but lost grip.', injury: 'No injury — caught by nurse', fallRiskAssessment: 'Moderate Risk (score 5)', contributingFactors: ['Wet floor', 'Post-operative weakness', 'Inadequate grip assistance'], actionTaken: 'Non-slip socks provided. Wet floor signs mandatory. Buddy system for post-op patients.', status: 'Closed', severity: 'Near Miss' },
];

const SEVERITY_CONFIG: Record<string, { color: string; tone: 'red' | 'gold' | 'blue' | 'green' }> = {
  'Near Miss': { color: 'bg-blue-100 text-blue-800', tone: 'blue' },
  Minor: { color: 'bg-yellow-100 text-yellow-800', tone: 'gold' },
  Moderate: { color: 'bg-orange-100 text-orange-800', tone: 'gold' },
  Major: { color: 'bg-red-100 text-red-800', tone: 'red' },
};

export default function PatientFallIncidentTracker() {
  const [incidents] = useState<FallIncident[]>(INITIAL);
  const [showForm, setShowForm] = useState(false);
  const toast = useToast();
  const total = incidents.length;
  const injuries = incidents.filter((i) => i.injury !== 'No injury').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Patient Fall Incident Tracker</h1><p className="text-gray-500">Report, investigate, and prevent patient falls — learn from every incident</p></div>
        <Button onClick={() => setShowForm(true)}>+ Report Fall</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 text-center"><div className="text-xl font-bold text-blue-600">{total}</div><div className="text-xs text-gray-500">Total Incidents</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-green-600">{incidents.filter((i) => i.severity === 'Near Miss').length}</div><div className="text-xs text-gray-500">Near Miss</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-yellow-600">{incidents.filter((i) => i.severity === 'Minor' || i.severity === 'Moderate').length}</div><div className="text-xs text-gray-500">Minor/Moderate</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-red-600">{injuries}</div><div className="text-xs text-gray-500">With Injury</div></Card>
      </div>
      <div className="space-y-4">
        {incidents.map((i) => (
          <Card key={i.id} className={`p-4 ${i.severity === 'Major' ? 'border-red-300 bg-red-50' : ''}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{i.patientName}</span>
                  <span className="text-sm text-gray-400">{i.mrn} · Age {i.age} · {i.ward}</span>
                  <Badge tone={SEVERITY_CONFIG[i.severity]?.tone}>{i.severity}</Badge>
                  <Badge tone={i.status === 'Closed' ? 'green' : 'gold'}>{i.status}</Badge>
                </div>
                <p className="text-sm text-gray-600">{i.date} at {i.time} · Location: {i.location}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="bg-red-50 rounded p-2 text-sm"><strong>Circumstances:</strong> {i.circumstances}</div>
              <div className="bg-yellow-50 rounded p-2 text-sm"><strong>Injury:</strong> {i.injury}</div>
            </div>
            <div className="text-xs bg-gray-50 rounded p-2 mb-2"><strong>Contributing Factors:</strong> {i.contributingFactors.join(', ')}</div>
            <div className="text-xs bg-green-50 rounded p-2"><strong>Action Taken:</strong> {i.actionTaken}</div>
          </Card>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowForm(false)} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-bold">✕</button>
            <h2 className="text-lg font-bold mb-4">Report Patient Fall</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm mb-1">Patient Name *</label><Input placeholder="Full name" /></div>
                <div><label className="block text-sm mb-1">MRN *</label><Input placeholder="MRN" /></div>
                <div><label className="block text-sm mb-1">Ward *</label><Input placeholder="Ward" /></div>
                <div><label className="block text-sm mb-1">Location *</label><Input placeholder="e.g. Bedside, Bathroom" /></div>
                <div><label className="block text-sm mb-1">Time *</label><Input type="time" /></div>
                <div><label className="block text-sm mb-1">Severity *</label><select className="w-full border rounded-lg p-2 text-sm"><option>Near Miss</option><option>Minor</option><option>Moderate</option><option>Major</option></select></div>
              </div>
              <div><label className="block text-sm mb-1">Circumstances *</label><textarea className="w-full border rounded-lg p-2 text-sm" rows={2} placeholder="What happened?" /></div>
              <div><label className="block text-sm mb-1">Injury *</label><Input placeholder="Describe any injuries" /></div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={() => { setShowForm(false); toast('Fall incident reported'); }}>Report Fall</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
