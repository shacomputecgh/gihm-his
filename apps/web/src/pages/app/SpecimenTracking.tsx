import { useState } from 'react';
import { Badge, Button, Card, Input, useToast } from '../../components/ui';

interface Specimen {
  id: string; patientName: string; mrn: string; specimenType: string;
  collectedAt: string; collectedBy: string; ward: string;
  testRequested: string; status: 'Collected' | 'In Transit' | 'Received' | 'Processing' | 'Completed' | 'Rejected';
  barcode: string; destination: string;
}

const INITIAL: Specimen[] = [
  { id: 'SP-001', patientName: 'Kwame Mensah', mrn: 'MRN-2026-001', specimenType: 'Blood', collectedAt: '2026-08-25 06:30', collectedBy: 'Nurse Ama', ward: 'Medical Ward', testRequested: 'FBC, Fasting Glucose, U&E', status: 'Completed', barcode: 'SP250825001', destination: 'Haematology' },
  { id: 'SP-002', patientName: 'Abena Osei', mrn: 'MRN-2026-010', specimenType: 'Blood Culture', collectedAt: '2026-08-25 07:00', collectedBy: 'Nurse Abena', ward: 'ICU', testRequested: 'Blood Culture x2 sets', status: 'Processing', barcode: 'SP250825002', destination: 'Microbiology' },
  { id: 'SP-003', patientName: 'Yaw Asare', mrn: 'MRN-2026-042', specimenType: 'Urine', collectedAt: '2026-08-25 08:00', collectedBy: 'Nurse Kofi', ward: 'Surgical Ward', testRequested: 'Urinalysis, Urine Culture', status: 'In Transit', barcode: 'SP250825003', destination: 'Clinical Chemistry' },
  { id: 'SP-004', patientName: 'Ama Darko', mrn: 'MRN-2026-041', specimenType: 'Swab', collectedAt: '2026-08-25 09:00', collectedBy: 'Dr. Boateng', ward: 'Maternity Ward', testRequested: 'High Vaginal Swab, C&S', status: 'Collected', barcode: 'SP250825004', destination: 'Microbiology' },
];

const SPECIMEN_TYPES = ['Blood', 'Urine', 'Stool', 'Sputum', 'Swab', 'CSF', 'Blood Culture', 'Tissue', 'Synovial Fluid', 'Pleural Fluid', 'Ascitic Fluid', 'Bone Marrow'];
const DESTINATIONS = ['Haematology', 'Clinical Chemistry', 'Microbiology', 'Parasitology', 'Serology', 'Histopathology', 'Blood Bank', 'Molecular Diagnostics'];
const STATUS_COLORS: Record<string, string> = { Collected: 'bg-blue-100 text-blue-800', 'In Transit': 'bg-yellow-100 text-yellow-800', Received: 'bg-purple-100 text-purple-800', Processing: 'bg-orange-100 text-orange-800', Completed: 'bg-green-100 text-green-800', Rejected: 'bg-red-100 text-red-800' };
const STATUSES = ['Collected', 'In Transit', 'Received', 'Processing', 'Completed', 'Rejected'];

export default function SpecimenTracking() {
  const [records, setRecords] = useState<Specimen[]>(INITIAL);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');
  const toast = useToast();
  const filtered = records.filter((r) => !filter || r.status === filter);

  const handleAdd = () => {
    const barcode = `SP${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(records.length + 1).padStart(3, '0')}`;
    toast(`Specimen ${barcode} created — scan to track`);
    setShowForm(false);
  };

  const advanceStatus = (id: string) => {
    setRecords(records.map((r) => {
      if (r.id !== id) return r;
      const idx = STATUSES.indexOf(r.status);
      if (idx < STATUSES.length - 1) return { ...r, status: STATUSES[idx + 1] as Specimen['status'] };
      return r;
    }));
    toast('Status updated');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Specimen Tracking</h1><p className="text-gray-500">Barcode-based specimen tracking from collection to result</p></div>
        <Button onClick={() => setShowForm(true)}>+ Register Specimen</Button>
      </div>
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setFilter(filter === s ? '' : s)} className={`px-3 py-1 rounded-full text-xs font-medium border transition ${filter === s ? 'ring-2 ring-blue-500 border-blue-300' : 'border-gray-200 hover:bg-gray-50'}`}>
            {s} ({records.filter((r) => r.status === s).length})
          </button>
        ))}
      </div>
      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-gray-500"><th className="p-2">Barcode</th><th className="p-2">Patient</th><th className="p-2">Type</th><th className="p-2">Test</th><th className="p-2">Destination</th><th className="p-2">Time</th><th className="p-2">Status</th><th className="p-2"></th></tr></thead>
            <tbody>{filtered.map((r) => (
              <tr key={r.id} className="border-b hover:bg-gray-50">
                <td className="p-2 font-mono text-xs font-bold">{r.barcode}</td>
                <td className="p-2">{r.patientName}<br /><span className="text-xs text-gray-400">{r.mrn}</span></td>
                <td className="p-2">{r.specimenType}</td><td className="p-2 text-xs">{r.testRequested}</td>
                <td className="p-2"><Badge tone="blue">{r.destination}</Badge></td>
                <td className="p-2 text-xs">{r.collectedAt}<br />{r.collectedBy}</td>
                <td className="p-2"><span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[r.status]}`}>{r.status}</span></td>
                <td className="p-2">{r.status !== 'Completed' && r.status !== 'Rejected' && <button onClick={() => advanceStatus(r.id)} className="text-xs text-blue-600 hover:underline">Advance →</button>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowForm(false)} className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-sm font-bold">✕</button>
            <h2 className="text-lg font-bold mb-4">Register New Specimen</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">Patient *</label><Input placeholder="Patient name" /></div>
                <div><label className="block text-sm font-medium mb-1">MRN *</label><Input placeholder="MRN" /></div>
                <div><label className="block text-sm font-medium mb-1">Specimen Type *</label><select className="w-full border rounded-lg p-2 text-sm">{SPECIMEN_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-1">Destination *</label><select className="w-full border rounded-lg p-2 text-sm">{DESTINATIONS.map((d) => <option key={d}>{d}</option>)}</select></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Tests Requested *</label><Input placeholder="e.g. FBC, Glucose, U&E" /></div>
              <div><label className="block text-sm font-medium mb-1">Collected By *</label><Input placeholder="Name and role" /></div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={handleAdd}>Register Specimen</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
