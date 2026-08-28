import { useState } from 'react';
import { Badge, Button, Card, Input, useToast } from '../../components/ui';

interface MedicationError {
  id: string; patientName: string; mrn: string; ward: string;
  date: string; reportedBy: string;
  errorType: string; category: string;
  description: string; impact: string;
  rootCause: string; actionTaken: string;
  status: 'Reported' | 'Investigation' | 'Action Taken' | 'Closed';
}

const INITIAL: MedicationError[] = [
  { id: 'ME-001', patientName: 'Kwame Mensah', mrn: 'MRN-2026-001', ward: 'Medical Ward', date: '2026-08-25', reportedBy: 'Nurse Ama', errorType: 'Wrong Dose', category: 'Prescribing', description: 'Metformin 500mg prescribed instead of 250mg for renal impairment patient', impact: 'Patient received double dose — blood glucose dropped to 3.2 mmol/L. Glucose monitoring initiated.', rootCause: 'Prescriber fatigue — late shift', actionTaken: 'Dose corrected. Incident review with prescriber. Double-check protocol reinforced.', status: 'Action Taken' },
  { id: 'ME-002', patientName: 'Abena Osei', mrn: 'MRN-2026-010', ward: 'ICU', date: '2026-08-24', reportedBy: 'Dr. Asante', errorType: 'Wrong Route', category: 'Administration', description: 'IV medication administered via oral route — Metoprolol IV given orally', impact: 'Reduced bioavailability. No adverse effect detected. Corrected immediately.', rootCause: 'Labelling confusion — similar packaging', actionTaken: 'Medication re-labelling implemented. Nursing staff retrained.', status: 'Closed' },
];

const ERROR_TYPES = ['Wrong Dose', 'Wrong Drug', 'Wrong Route', 'Wrong Patient', 'Wrong Time', 'Omission', 'Duplicate', 'Interaction', 'Allergy', 'Other'];
const CATEGORIES = ['Prescribing', 'Administration', 'Dispensing', 'Monitoring', 'Documentation', 'Communication'];
const IMPACTS = ['No Harm', 'Mild Harm', 'Moderate Harm', 'Severe Harm', 'Near Miss'];
const STATUS_CONFIG: Record<string, { tone: 'red' | 'gold' | 'blue' | 'green' }> = {
  Reported: { tone: 'blue' }, Investigation: { tone: 'gold' }, 'Action Taken': { tone: 'green' }, Closed: { tone: 'green' },
};

export default function MedicationErrorTracker() {
  const [errors] = useState<MedicationError[]>(INITIAL);
  const [showForm, setShowForm] = useState(false);
  const toast = useToast();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Medication Error Tracker</h1><p className="text-gray-500">Report, investigate, and learn from medication errors — improve patient safety</p></div>
        <Button onClick={() => setShowForm(true)}>+ Report Error</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(STATUS_CONFIG).map(([status]) => (
          <Card key={status} className="p-3 text-center"><div className="text-xl font-bold">{errors.filter((e) => e.status === status).length}</div><div className="text-xs text-gray-500">{status}</div></Card>
        ))}
      </div>
      <div className="space-y-4">
        {errors.map((e) => (
          <Card key={e.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{e.patientName}</span>
                  <span className="text-sm text-gray-400">{e.mrn} · {e.ward}</span>
                  <Badge tone={STATUS_CONFIG[e.status]?.tone}>{e.status}</Badge>
                </div>
                <p className="text-sm text-gray-600">{e.errorType} · {e.category} · Reported by: {e.reportedBy} · {e.date}</p>
              </div>
            </div>
            <div className="bg-red-50 rounded p-2 text-sm mb-2"><strong>Error:</strong> {e.description}</div>
            <div className="bg-yellow-50 rounded p-2 text-sm mb-2"><strong>Impact:</strong> {e.impact}</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded p-2 text-xs"><strong>Root Cause:</strong> {e.rootCause}</div>
              <div className="bg-green-50 rounded p-2 text-xs"><strong>Action Taken:</strong> {e.actionTaken}</div>
            </div>
          </Card>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowForm(false)} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-bold">✕</button>
            <h2 className="text-lg font-bold mb-4">Report Medication Error</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm mb-1">Patient Name *</label><Input placeholder="Full name" /></div>
                <div><label className="block text-sm mb-1">MRN *</label><Input placeholder="MRN" /></div>
                <div><label className="block text-sm mb-1">Ward *</label><Input placeholder="Ward" /></div>
                <div><label className="block text-sm mb-1">Error Type *</label><select className="w-full border rounded-lg p-2 text-sm">{ERROR_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
                <div><label className="block text-sm mb-1">Category *</label><select className="w-full border rounded-lg p-2 text-sm">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
                <div><label className="block text-sm mb-1">Impact Level *</label><select className="w-full border rounded-lg p-2 text-sm">{IMPACTS.map((i) => <option key={i}>{i}</option>)}</select></div>
              </div>
              <div><label className="block text-sm mb-1">Description *</label><textarea className="w-full border rounded-lg p-2 text-sm" rows={2} placeholder="What happened?" /></div>
              <div><label className="block text-sm mb-1">Root Cause *</label><textarea className="w-full border rounded-lg p-2 text-sm" rows={2} placeholder="Why did it happen?" /></div>
              <div><label className="block text-sm mb-1">Action Taken *</label><textarea className="w-full border rounded-lg p-2 text-sm" rows={2} placeholder="What was done about it?" /></div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={() => { setShowForm(false); toast('Error reported — thank you for improving safety'); }}>Report Error</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
