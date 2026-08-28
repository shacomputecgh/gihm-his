import { useState, useMemo } from 'react';
import { Card, Badge, Button, Input } from '../../components/ui';

interface Specimen {
  id: string;
  patientName: string;
  mrn: string;
  specimenType: string;
  collectionDate: string;
  collectedBy: string;
  clinicalIndication: string;
  site: string;
  containerType: string;
  fastingRequired: boolean;
  transportCondition: string;
  receivedInLab: string;
  receivedBy: string;
  processingNotes: string;
  status: string;
  barcode: string;
  priority: string;
}

const SPECIMEN_TYPES = ['Blood (Venous)', 'Blood (Capillary)', 'Urine (Midstream)', 'Urine (24hr)', 'Stool', 'Sputum', 'CSF', 'Swab (Wound)', 'Swab (Throat)', 'Swab (Cervical)', 'Tissue (Biopsy)', 'Bone Marrow', 'Synovial Fluid', 'Pleural Fluid', 'Ascitic Fluid', 'Semen', 'CSF', 'Other Body Fluid'];
const CONTAINERS = ['EDTA (Purple Top)', 'Plain (Red Top)', 'Fluoride/Oxalate (Grey Top)', 'Citrate (Blue Top)', 'Heparin (Green Top)', 'Sterile Container', 'Universal Container', 'Stool Pot', 'Sputum Pot', 'Sterile Swab', 'Formalin Pot', 'Other'];
const PRIORITIES = ['Routine', 'Urgent', 'STAT', 'Review'];

export default function PathologyReporting() {
  const [records, setRecords] = useState<Specimen[]>([
    { id: 'SP-001', patientName: 'Kofi Mensah', mrn: 'MRN-001', specimenType: 'Blood (Venous)', collectionDate: '2026-08-24 07:30', collectedBy: 'Phlebotomist Ama', clinicalIndication: 'Pre-operative assessment', site: 'Left antecubital fossa', containerType: 'EDTA (Purple Top)', fastingRequired: true, transportCondition: 'Ambient', receivedInLab: '2026-08-24 08:00', receivedBy: 'Lab Tech Esi', processingNotes: 'Hemolysed sample rejected, recollected', status: 'Completed', barcode: 'BAR-20260824-001', priority: 'Routine' },
    { id: 'SP-002', patientName: 'Ama Darko', mrn: 'MRN-002', specimenType: 'Urine (Midstream)', collectionDate: '2026-08-24 09:00', collectedBy: 'Self-collected', clinicalIndication: 'UTI symptoms - dysuria, frequency', site: 'N/A', containerType: 'Sterile Container', fastingRequired: false, transportCondition: 'Refrigerated', receivedInLab: '2026-08-24 09:30', receivedBy: 'Lab Tech Kofi', processingNotes: '', status: 'Processing', barcode: 'BAR-20260824-002', priority: 'Urgent' },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState<Specimen>({ id: '', patientName: '', mrn: '', specimenType: '', collectionDate: '', collectedBy: '', clinicalIndication: '', site: '', containerType: '', fastingRequired: false, transportCondition: '', receivedInLab: '', receivedBy: '', processingNotes: '', status: 'Ordered', barcode: '', priority: 'Routine' });

  const filtered = useMemo(() => records.filter(r =>
    r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.specimenType.toLowerCase().includes(searchTerm.toLowerCase())
  ), [records, searchTerm]);

  const handleAdd = () => {
    const r: Specimen = { ...form, id: `SP-${String(records.length + 1).padStart(3, '0')}`, barcode: `BAR-${Date.now()}` };
    setRecords([r, ...records]);
    setShowAdd(false);
    setForm({ id: '', patientName: '', mrn: '', specimenType: '', collectionDate: '', collectedBy: '', clinicalIndication: '', site: '', containerType: '', fastingRequired: false, transportCondition: '', receivedInLab: '', receivedBy: '', processingNotes: '', status: 'Ordered', barcode: '', priority: 'Routine' });
  };

  const urgent = records.filter(r => r.priority === 'Urgent' || r.priority === 'STAT').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🔬 Pathology Reporting & Specimen Tracking</h1>
          <p className="text-gray-600">Specimen collection, tracking, processing, and result reporting</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="bg-green-600 hover:bg-green-700 text-white">+ Register Specimen</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4"><p className="text-sm text-gray-500">Total Specimens</p><p className="text-2xl font-bold">{records.length}</p></Card>
        <Card className="p-4 border-l-4 border-red-500"><p className="text-sm text-gray-500">Urgent/STAT</p><p className="text-2xl font-bold text-red-600">{urgent}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Processing</p><p className="text-2xl font-bold text-blue-600">{records.filter(r => r.status === 'Processing').length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Completed</p><p className="text-2xl font-bold text-green-600">{records.filter(r => r.status === 'Completed').length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Rejected</p><p className="text-2xl font-bold text-orange-600">{records.filter(r => r.status === 'Rejected').length}</p></Card>
      </div>

      {showAdd && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Register New Specimen</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Patient Name" value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })} />
            <Input placeholder="MRN" value={form.mrn} onChange={e => setForm({ ...form, mrn: e.target.value })} />
            <select className="border rounded-lg px-3 py-2" value={form.specimenType} onChange={e => setForm({ ...form, specimenType: e.target.value })}>
              <option value="">Specimen Type</option>
              {SPECIMEN_TYPES.map(s => <option key={s}>{s}</option>)}
            </select>
            <Input type="datetime-local" placeholder="Collection Date/Time" value={form.collectionDate} onChange={e => setForm({ ...form, collectionDate: e.target.value })} />
            <Input placeholder="Collected By" value={form.collectedBy} onChange={e => setForm({ ...form, collectedBy: e.target.value })} />
            <Input placeholder="Clinical Indication" value={form.clinicalIndication} onChange={e => setForm({ ...form, clinicalIndication: e.target.value })} />
            <select className="border rounded-lg px-3 py-2" value={form.containerType} onChange={e => setForm({ ...form, containerType: e.target.value })}>
              <option value="">Container Type</option>
              {CONTAINERS.map(c => <option key={c}>{c}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.fastingRequired} onChange={e => setForm({ ...form, fastingRequired: e.target.checked })} className="rounded" />
              <span>Fasting Required</span>
            </label>
            <Input placeholder="Site" value={form.site} onChange={e => setForm({ ...form, site: e.target.value })} />
            <Input placeholder="Transport Condition" value={form.transportCondition} onChange={e => setForm({ ...form, transportCondition: e.target.value })} />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAdd} className="bg-green-600 text-white">Save Specimen</Button>
            <Button onClick={() => setShowAdd(false)} className="bg-gray-300">Cancel</Button>
          </div>
        </Card>
      )}

      <div className="mb-4">
        <Input placeholder="🔍 Search by patient, specimen type, or barcode..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Barcode</th>
                <th className="p-3 text-left">Patient</th>
                <th className="p-3 text-left">Specimen</th>
                <th className="p-3 text-left">Container</th>
                <th className="p-3 text-left">Collected</th>
                <th className="p-3 text-left">Received</th>
                <th className="p-3 text-left">Priority</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">{r.barcode}</td>
                  <td className="p-3 font-medium">{r.patientName}</td>
                  <td className="p-3"><Badge className="bg-blue-100 text-blue-800">{r.specimenType}</Badge></td>
                  <td className="p-3 text-xs">{r.containerType}</td>
                  <td className="p-3">{r.collectionDate}</td>
                  <td className="p-3">{r.receivedInLab || <span className="text-gray-400">Pending</span>}</td>
                  <td className="p-3"><Badge className={r.priority === 'STAT' ? 'bg-red-100 text-red-800' : r.priority === 'Urgent' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}>{r.priority}</Badge></td>
                  <td className="p-3"><Badge className={r.status === 'Completed' ? 'bg-green-100 text-green-800' : r.status === 'Rejected' ? 'bg-red-100 text-red-800' : r.status === 'Processing' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}>{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
