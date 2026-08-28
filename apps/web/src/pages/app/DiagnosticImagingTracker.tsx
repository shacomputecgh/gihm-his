import { useState, useMemo } from 'react';
import { Card, Badge, Button, Input } from '../../components/ui';

interface ImagingStudy {
  id: string;
  patientName: string;
  mrn: string;
  studyType: string;
  bodyPart: string;
  clinicalIndication: string;
  orderedBy: string;
  dateOrdered: string;
  datePerformed: string;
  performedBy: string;
  modality: string;
  contrastUsed: boolean;
  findings: string;
  impression: string;
  reportedBy: string;
  reportDate: string;
  status: string;
  urgent: boolean;
}

const STUDY_TYPES = ['X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'Mammography', 'Fluoroscopy', 'DEXA Scan', 'Interventional', 'Nuclear Medicine', 'PET Scan'];
const BODY_PARTS = ['Chest', 'Abdomen', 'Pelvis', 'Head/Brain', 'Spine (Cervical)', 'Spine (Thoracic)', 'Spine (Lumbar)', 'Upper Limb', 'Lower Limb', 'Skull', 'Neck', 'Heart', 'Kidney/Ureter', 'Full Body', 'Other'];

export default function DiagnosticImagingTracker() {
  const [records, setRecords] = useState<ImagingStudy[]>([
    { id: 'DI-001', patientName: 'Kofi Mensah', mrn: 'MRN-001', studyType: 'X-Ray', bodyPart: 'Chest', clinicalIndication: 'Persistent cough for 3 weeks', orderedBy: 'Dr. Osei', dateOrdered: '2026-08-24', datePerformed: '2026-08-24', performedBy: 'Radiographer Ama', modality: 'Digital Radiography', contrastUsed: false, findings: 'Bilateral lower lobe infiltrates consistent with pneumonia', impression: 'Community-acquired pneumonia, bilateral lower lobes', reportedBy: 'Dr. Kwame (Radiologist)', reportDate: '2026-08-24', status: 'Reported', urgent: false },
    { id: 'DI-002', patientName: 'Ama Darko', mrn: 'MRN-002', studyType: 'CT Scan', bodyPart: 'Head/Brain', clinicalIndication: 'Severe headache, focal neurological deficit', orderedBy: 'Dr. Akosua', dateOrdered: '2026-08-23', datePerformed: '2026-08-24', performedBy: 'CT Technician Kofi', modality: 'CT', contrastUsed: true, findings: '', impression: '', reportedBy: '', reportDate: '', status: 'Performed', urgent: true },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState<ImagingStudy>({ id: '', patientName: '', mrn: '', studyType: '', bodyPart: '', clinicalIndication: '', orderedBy: '', dateOrdered: '', datePerformed: '', performedBy: '', modality: '', contrastUsed: false, findings: '', impression: '', reportedBy: '', reportDate: '', status: 'Ordered', urgent: false });

  const filtered = useMemo(() => records.filter(r =>
    r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.studyType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.bodyPart.toLowerCase().includes(searchTerm.toLowerCase())
  ), [records, searchTerm]);

  const handleAdd = () => {
    const r: ImagingStudy = { ...form, id: `DI-${String(records.length + 1).padStart(3, '0')}` };
    setRecords([r, ...records]);
    setShowAdd(false);
    setForm({ id: '', patientName: '', mrn: '', studyType: '', bodyPart: '', clinicalIndication: '', orderedBy: '', dateOrdered: '', datePerformed: '', performedBy: '', modality: '', contrastUsed: false, findings: '', impression: '', reportedBy: '', reportDate: '', status: 'Ordered', urgent: false });
  };

  const urgent = records.filter(r => r.urgent && r.status !== 'Reported').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📷 Diagnostic Imaging Tracker</h1>
          <p className="text-gray-600">Radiology studies — X-ray, CT, MRI, Ultrasound, reporting workflow</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="bg-green-600 hover:bg-green-700 text-white">+ Order Study</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4"><p className="text-sm text-gray-500">Total Studies</p><p className="text-2xl font-bold">{records.length}</p></Card>
        <Card className="p-4 border-l-4 border-red-500"><p className="text-sm text-gray-500">Urgent Pending</p><p className="text-2xl font-bold text-red-600">{urgent}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Ordered</p><p className="text-2xl font-bold text-yellow-600">{records.filter(r => r.status === 'Ordered').length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Awaiting Report</p><p className="text-2xl font-bold text-blue-600">{records.filter(r => r.status === 'Performed').length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Reported</p><p className="text-2xl font-bold text-green-600">{records.filter(r => r.status === 'Reported').length}</p></Card>
      </div>

      {showAdd && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Order Imaging Study</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Patient Name" value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })} />
            <Input placeholder="MRN" value={form.mrn} onChange={e => setForm({ ...form, mrn: e.target.value })} />
            <select className="border rounded-lg px-3 py-2" value={form.studyType} onChange={e => setForm({ ...form, studyType: e.target.value })}>
              <option value="">Study Type</option>
              {STUDY_TYPES.map(s => <option key={s}>{s}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2" value={form.bodyPart} onChange={e => setForm({ ...form, bodyPart: e.target.value })}>
              <option value="">Body Part</option>
              {BODY_PARTS.map(b => <option key={b}>{b}</option>)}
            </select>
            <Input placeholder="Clinical Indication" value={form.clinicalIndication} onChange={e => setForm({ ...form, clinicalIndication: e.target.value })} />
            <Input placeholder="Ordered By" value={form.orderedBy} onChange={e => setForm({ ...form, orderedBy: e.target.value })} />
            <Input type="date" placeholder="Date Ordered" value={form.dateOrdered} onChange={e => setForm({ ...form, dateOrdered: e.target.value })} />
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.urgent} onChange={e => setForm({ ...form, urgent: e.target.checked })} className="rounded" />
              <span>Urgent</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.contrastUsed} onChange={e => setForm({ ...form, contrastUsed: e.target.checked })} className="rounded" />
              <span>Contrast Required</span>
            </label>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAdd} className="bg-green-600 text-white">Save Order</Button>
            <Button onClick={() => setShowAdd(false)} className="bg-gray-300">Cancel</Button>
          </div>
        </Card>
      )}

      <div className="mb-4">
        <Input placeholder="🔍 Search by patient, study type, or body part..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Patient</th>
                <th className="p-3 text-left">Study</th>
                <th className="p-3 text-left">Body Part</th>
                <th className="p-3 text-left">Indication</th>
                <th className="p-3 text-left">Contrast</th>
                <th className="p-3 text-left">Reported By</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Urgent</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">{r.id}</td>
                  <td className="p-3 font-medium">{r.patientName}</td>
                  <td className="p-3"><Badge className="bg-blue-100 text-blue-800">{r.studyType}</Badge></td>
                  <td className="p-3">{r.bodyPart}</td>
                  <td className="p-3 max-w-[200px] truncate">{r.clinicalIndication}</td>
                  <td className="p-3">{r.contrastUsed ? <Badge className="bg-purple-100 text-purple-800">Yes</Badge> : 'No'}</td>
                  <td className="p-3">{r.reportedBy || <span className="text-gray-400">Pending</span>}</td>
                  <td className="p-3"><Badge className={r.status === 'Reported' ? 'bg-green-100 text-green-800' : r.status === 'Performed' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}>{r.status}</Badge></td>
                  <td className="p-3">{r.urgent && <Badge className="bg-red-100 text-red-800">URGENT</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
