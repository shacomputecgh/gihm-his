import { useState } from 'react';
import { Badge, Button, Card, Input, Select, useToast } from '../../components/ui';

interface MedicationRecord {
  id: string; patientName: string; mrn: string; ward: string; bed: string;
  drugName: string; dose: string; route: string; frequency: string;
  scheduledTime: string; administeredTime?: string; administeredBy?: string;
  status: 'Scheduled' | 'Given' | 'Missed' | 'Held' | 'Refused' | 'PRN';
  reason?: string;Notes?: string;
}

const INITIAL: MedicationRecord[] = [
  { id: 'MAR-001', patientName: 'Kwame Mensah', mrn: 'MRN-2026-001', ward: 'Medical Ward', bed: 'MW-12', drugName: 'Metformin', dose: '500mg', route: 'Oral', frequency: 'Twice daily', scheduledTime: '08:00', administeredTime: '08:05', administeredBy: 'Nurse Ama', status: 'Given' },
  { id: 'MAR-002', patientName: 'Kwame Mensah', mrn: 'MRN-2026-001', ward: 'Medical Ward', bed: 'MW-12', drugName: 'Amlodipine', dose: '5mg', route: 'Oral', frequency: 'Once daily', scheduledTime: '08:00', administeredTime: '08:10', administeredBy: 'Nurse Ama', status: 'Given' },
  { id: 'MAR-003', patientName: 'Kwame Mensah', mrn: 'MRN-2026-001', ward: 'Medical Ward', bed: 'MW-12', drugName: 'Paracetamol', dose: '1g', route: 'Oral', frequency: '6-hourly', scheduledTime: '14:00', status: 'Scheduled' },
  { id: 'MAR-004', patientName: 'Abena Osei', mrn: 'MRN-2026-010', ward: 'ICU', bed: 'ICU-03', drugName: 'Omeprazole', dose: '40mg', route: 'IV', frequency: 'Once daily', scheduledTime: '06:00', administeredTime: '06:15', administeredBy: 'Nurse Abena', status: 'Given' },
  { id: 'MAR-005', patientName: 'Abena Osei', mrn: 'MRN-2026-010', ward: 'ICU', bed: 'ICU-03', drugName: 'Morphine', dose: '2.5mg', route: 'IV', frequency: '4-hourly PRN', scheduledTime: '08:00', status: 'Missed', reason: 'Patient sleeping — pain score 2/10' },
  { id: 'MAR-006', patientName: 'Yaw Asare', mrn: 'MRN-2026-042', ward: 'Surgical Ward', bed: 'SW-08', drugName: 'Amoxicillin', dose: '500mg', route: 'Oral', frequency: '8-hourly', scheduledTime: '06:00', administeredTime: '06:02', administeredBy: 'Nurse Kofi', status: 'Given' },
];

const ROUTES = ['Oral', 'IV', 'IM', 'SC', 'PR', 'Topical', 'Inhaled', 'Sublingual', 'Rectal', 'Eye/Ear/Nose'];
const STATUS_CONFIG: Record<string, { color: string; tone: 'green' | 'gold' | 'red' | 'gray' | 'blue' }> = {
  Scheduled: { color: 'bg-blue-100 text-blue-800', tone: 'blue' }, Given: { color: 'bg-green-100 text-green-800', tone: 'green' },
  Missed: { color: 'bg-red-100 text-red-800', tone: 'red' }, Held: { color: 'bg-yellow-100 text-yellow-800', tone: 'gold' },
  Refused: { color: 'bg-orange-100 text-orange-800', tone: 'gold' }, PRN: { color: 'bg-purple-100 text-purple-800', tone: 'blue' },
};

export default function MedicationAdministrationChart() {
  const [records, setRecords] = useState<MedicationRecord[]>(INITIAL);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');
  const toast = useToast();
  const filtered = records.filter((r) => !filter || r.status === filter || r.ward.includes(filter));

  const markGiven = (id: string) => {
    setRecords(records.map((r) => r.id === id ? { ...r, status: 'Given' as const, administeredTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), administeredBy: 'Current User' } : r));
    toast('Medication administered');
  };

  const markMissed = (id: string) => {
    setRecords(records.map((r) => r.id === id ? { ...r, status: 'Missed' as const } : r));
    toast('Medication marked as missed');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Medication Administration Record (MAR)</h1><p className="text-gray-500">Track scheduled medications, record administration, and monitor compliance</p></div>
        <Button onClick={() => setShowForm(true)}>+ Add Medication</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(STATUS_CONFIG).map(([status]) => (
          <button key={status} onClick={() => setFilter(filter === status ? '' : status)} className={`p-3 rounded-lg border text-center transition ${filter === status ? 'ring-2 ring-green-500 border-green-300' : 'border-slate-200 hover:bg-slate-50'}`}>
            <div className="text-xl font-bold">{records.filter((r) => r.status === status).length}</div>
            <div className="text-xs text-slate-500">{status}</div>
          </button>
        ))}
      </div>
      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-gray-500"><th className="p-2">Patient</th><th className="p-2">Drug</th><th className="p-2">Dose</th><th className="p-2">Route</th><th className="p-2">Frequency</th><th className="p-2">Scheduled</th><th className="p-2">Given At</th><th className="p-2">By</th><th className="p-2">Status</th><th className="p-2"></th></tr></thead>
            <tbody>{filtered.map((r) => (
              <tr key={r.id} className={`border-b ${r.status === 'Missed' ? 'bg-red-50' : r.status === 'Given' ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                <td className="p-2 font-medium">{r.patientName}<br /><span className="text-xs text-gray-400">{r.ward} {r.bed}</span></td>
                <td className="p-2">{r.drugName}</td><td className="p-2">{r.dose}</td><td className="p-2">{r.route}</td>
                <td className="p-2 text-xs">{r.frequency}</td><td className="p-2">{r.scheduledTime}</td>
                <td className="p-2">{r.administeredTime || '—'}</td><td className="p-2 text-xs">{r.administeredBy || '—'}</td>
                <td className="p-2"><Badge tone={STATUS_CONFIG[r.status]?.tone}>{r.status}</Badge></td>
                <td className="p-2 flex gap-1">
                  {r.status === 'Scheduled' && <button onClick={() => markGiven(r.id)} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">Give</button>}
                  {r.status === 'Scheduled' && <button onClick={() => markMissed(r.id)} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">Miss</button>}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowForm(false)} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-bold">✕</button>
            <h2 className="text-lg font-bold mb-4">Add Medication to MAR</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm mb-1">Patient Name *</label><Input placeholder="Patient name" /></div>
                <div><label className="block text-sm mb-1">MRN *</label><Input placeholder="MRN" /></div>
                <div><label className="block text-sm mb-1">Drug Name *</label><Input placeholder="e.g. Amoxicillin" /></div>
                <div><label className="block text-sm mb-1">Dose *</label><Input placeholder="e.g. 500mg" /></div>
                <div><label className="block text-sm mb-1">Route *</label><Select>{ROUTES.map((r) => <option key={r}>{r}</option>)}</Select></div>
                <div><label className="block text-sm mb-1">Frequency *</label><Select>{['Once daily', 'Twice daily', '8-hourly', '6-hourly', '4-hourly', '12-hourly', 'PRN'].map((f) => <option key={f}>{f}</option>)}</Select></div>
                <div><label className="block text-sm mb-1">Scheduled Time *</label><Input type="time" /></div>
                <div><label className="block text-sm mb-1">Ward/Bed</label><Input placeholder="e.g. Medical Ward MW-12" /></div>
              </div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={() => { setShowForm(false); toast('Medication added to MAR'); }}>Add Medication</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
