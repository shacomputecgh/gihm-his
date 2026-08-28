import { useState } from 'react';
import { Badge, Button, Card, Input, useToast } from '../../components/ui';

interface TBCase {
  id: string; patientName: string; mrn: string; age: number; sex: string;
  dateRegistered: string; category: string; site: string;
  hivStatus: string; sputumResults: string[]; xpertResult: string;
  treatmentPhase: string; startDate: string; monthsOnTreatment: number;
  adherence: string; nextAppointment: string;
  status: 'Initiation' | 'Intensive Phase' | 'Continuation Phase' | 'Completed' | 'Defaulted' | 'Died' | 'Failed';
}

const INITIAL: TBCase[] = [
  { id: 'TB-001', patientName: 'Kwaku Mensah', mrn: 'MRN-2026-100', age: 35, sex: 'M', dateRegistered: '2026-05-15', category: 'New', site: 'Pulmonary', hivStatus: 'Negative', sputumResults: ['Smear +', 'Culture +'], xpertResult: 'MTB Detected, RIF Sensitive', treatmentPhase: 'Continuation Phase', startDate: '2026-05-15', monthsOnTreatment: 3, adherence: 'Good (>95%)', nextAppointment: '2026-09-15', status: 'Continuation Phase' },
  { id: 'TB-002', patientName: 'Abena Osei', mrn: 'MRN-2026-101', age: 28, sex: 'F', dateRegistered: '2026-08-01', category: 'New', site: 'Pulmonary', hivStatus: 'Positive — on ART', sputumResults: ['Smear ++'], xpertResult: 'MTB Detected, RIF Sensitive', treatmentPhase: 'Intensive Phase', startDate: '2026-08-01', monthsOnTreatment: 1, adherence: 'Good', nextAppointment: '2026-09-01', status: 'Intensive Phase' },
  { id: 'TB-003', patientName: 'Yaw Asare', mrn: 'MRN-2026-102', age: 55, sex: 'M', dateRegistered: '2026-01-10', category: 'Retreatment', site: 'Pulmonary', hivStatus: 'Negative', sputumResults: ['Smear +'], xpertResult: 'MTB Detected, RIF Resistant', treatmentPhase: 'Phase 2 (MDR)', startDate: '2026-01-10', monthsOnTreatment: 7, adherence: 'Fair (80-94%)', nextAppointment: '2026-09-10', status: 'Intensive Phase' },
];

const STATUS_CONFIG: Record<string, { color: string; tone: 'green' | 'gold' | 'blue' | 'red' }> = {
  Initiation: { color: 'bg-blue-100 text-blue-800', tone: 'blue' },
  'Intensive Phase': { color: 'bg-orange-100 text-orange-800', tone: 'gold' },
  'Continuation Phase': { color: 'bg-yellow-100 text-yellow-800', tone: 'gold' },
  Completed: { color: 'bg-green-100 text-green-800', tone: 'green' },
  Defaulted: { color: 'bg-red-100 text-red-800', tone: 'red' },
  Died: { color: 'bg-gray-100 text-gray-800', tone: 'red' },
  Failed: { color: 'bg-red-200 text-red-900', tone: 'red' },
};

export default function TuberculosisTracker() {
  const [cases] = useState<TBCase[]>(INITIAL);
  const [showForm, setShowForm] = useState(false);
  const toast = useToast();
  const defaulted = cases.filter((c) => c.status === 'Defaulted').length;
  const mdr = cases.filter((c) => c.xpertResult.includes('Resistant')).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Tuberculosis Tracker</h1><p className="text-gray-500">TB case management, DOTS, Xpert results, contact tracing, and treatment outcomes</p></div>
        <Button onClick={() => setShowForm(true)}>+ Register TB Case</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-3 text-center"><div className="text-xl font-bold text-blue-600">{cases.length}</div><div className="text-xs text-gray-500">Total Cases</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-orange-600">{cases.filter((c) => c.status === 'Intensive Phase').length}</div><div className="text-xs text-gray-500">Intensive</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-yellow-600">{cases.filter((c) => c.status === 'Continuation Phase').length}</div><div className="text-xs text-gray-500">Continuation</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-red-600">{defaulted}</div><div className="text-xs text-gray-500">Defaulted</div></Card>
        <Card className="p-3 text-center"><div className="text-xl font-bold text-purple-600">{mdr}</div><div className="text-xs text-gray-500">MDR-TB</div></Card>
      </div>
      <div className="space-y-4">
        {cases.map((c) => (
          <Card key={c.id} className={`p-4 ${c.status === 'Defaulted' ? 'border-red-300 bg-red-50' : ''}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">{c.patientName}</span>
                  <span className="text-sm text-gray-400">{c.mrn} · {c.age}{c.sex}</span>
                  <Badge tone={STATUS_CONFIG[c.status]?.tone}>{c.status}</Badge>
                  {c.hivStatus.includes('Positive') && <Badge tone="red">HIV+</Badge>}
                  {c.xpertResult.includes('Resistant') && <Badge tone="red">MDR</Badge>}
                </div>
                <p className="text-sm text-gray-600">Category: {c.category} · Site: {c.site} · Registered: {c.dateRegistered}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs bg-gray-50 rounded-lg p-3 mb-2">
              <div><span className="text-gray-500">Xpert:</span><div className="font-medium">{c.xpertResult}</div></div>
              <div><span className="text-gray-500">Phase:</span><div className="font-medium">{c.treatmentPhase}</div></div>
              <div><span className="text-gray-500">Months:</span><div className="font-medium">{c.monthsOnTreatment}/6</div></div>
              <div><span className="text-gray-500">Adherence:</span><div className="font-medium">{c.adherence}</div></div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Sputum: {c.sputumResults.join(', ')}</span>
              <span>Next: {c.nextAppointment}</span>
            </div>
          </Card>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowForm(false)} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-bold">✕</button>
            <h2 className="text-lg font-bold mb-4">Register TB Case</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm mb-1">Patient Name *</label><Input placeholder="Full name" /></div>
                <div><label className="block text-sm mb-1">MRN *</label><Input placeholder="MRN" /></div>
                <div><label className="block text-sm mb-1">Age *</label><Input type="number" /></div>
                <div><label className="block text-sm mb-1">Sex *</label><select className="w-full border rounded-lg p-2 text-sm"><option>M</option><option>F</option></select></div>
                <div><label className="block text-sm mb-1">Category *</label><select className="w-full border rounded-lg p-2 text-sm"><option>New</option><option>Retreatment</option><option>Relapse</option><option>Failure</option></select></div>
                <div><label className="block text-sm mb-1">HIV Status *</label><select className="w-full border rounded-lg p-2 text-sm"><option>Negative</option><option>Positive</option><option>Unknown</option></select></div>
              </div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={() => { setShowForm(false); toast('TB case registered'); }}>Register</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
