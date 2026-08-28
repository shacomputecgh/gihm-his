import { useState, useMemo } from 'react';
import { Card, Badge, Button, Input } from '../../components/ui';

interface OxygenRecord {
  id: string;
  patientName: string;
  mrn: string;
  ward: string;
  indication: string;
  deliveryDevice: string;
  flowRate: string;
  targetRange: string;
  currentSpO2: string;
  dateStarted: string;
  assessedBy: string;
  nextReviewDate: string;
  ambulatoryStatus: string;
  lifestyleActivity: string;
  complications: string;
  status: string;
  comments: string;
}

const DEVICES = ['Nasal Cannula', 'Simple Mask', 'Venturi Mask', 'Non-Rebreather Mask', 'Face Tent', 'Tracheostomy Collar', 'High-Flow Nasal Cannula (HFNC)', 'CPAP', 'BiPAP', 'Ventilator'];
const INDICATIONS = ['Hypoxaemia (SpO2 < 94%)', 'Pneumonia', 'COPD Exacerbation', 'Asthma Attack', 'Heart Failure', 'Post-Operative', 'Trauma', 'Sepsis', 'Pulmonary Embolism', 'ARDS', 'Carbon Monoxide Poisoning', 'Other'];

export default function OxygenTherapySafety() {
  const [records, setRecords] = useState<OxygenRecord[]>([
    { id: 'OT-001', patientName: 'Kofi Mensah', mrn: 'MRN-001', ward: 'Medical Ward', indication: 'Pneumonia', deliveryDevice: 'Nasal Cannula', flowRate: '2 L/min', targetRange: '92-96%', currentSpO2: '94%', dateStarted: '2026-08-22', assessedBy: 'Dr. Osei', nextReviewDate: '2026-08-25', ambulatoryStatus: 'On room air when mobile', lifestyleActivity: 'Walking with O2 cylinder', complications: 'None', status: 'Active', comments: 'Review if SpO2 drops below 92%' },
    { id: 'OT-002', patientName: 'Ama Darko', mrn: 'MRN-002', ward: 'ICU', indication: 'ARDS', deliveryDevice: 'Ventilator', flowRate: 'FiO2 60%', targetRange: '90-95%', currentSpO2: '93%', dateStarted: '2026-08-20', assessedBy: 'Dr. Akosua', nextReviewDate: '2026-08-24', ambulatoryStatus: 'Bed-bound', lifestyleActivity: 'None', complications: 'Ventilator-associated pneumonia', status: 'Active', comments: 'Weaning protocol initiated' },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState<OxygenRecord>({ id: '', patientName: '', mrn: '', ward: '', indication: '', deliveryDevice: '', flowRate: '', targetRange: '', currentSpO2: '', dateStarted: '', assessedBy: '', nextReviewDate: '', ambulatoryStatus: '', lifestyleActivity: '', complications: '', status: 'Active', comments: '' });

  const filtered = useMemo(() => records.filter(r =>
    r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.ward.toLowerCase().includes(searchTerm.toLowerCase())
  ), [records, searchTerm]);

  const handleAdd = () => {
    const r: OxygenRecord = { ...form, id: `OT-${String(records.length + 1).padStart(3, '0')}` };
    setRecords([r, ...records]);
    setShowAdd(false);
    setForm({ id: '', patientName: '', mrn: '', ward: '', indication: '', deliveryDevice: '', flowRate: '', targetRange: '', currentSpO2: '', dateStarted: '', assessedBy: '', nextReviewDate: '', ambulatoryStatus: '', lifestyleActivity: '', complications: '', status: 'Active', comments: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🫁 Oxygen Therapy Safety</h1>
          <p className="text-gray-600">Oxygen prescriptions, SpO2 monitoring, delivery device tracking</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="bg-green-600 hover:bg-green-700 text-white">+ Start Oxygen Therapy</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-sm text-gray-500">Active on O2</p><p className="text-2xl font-bold text-blue-600">{records.filter(r => r.status === 'Active').length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Complications</p><p className="text-2xl font-bold text-red-600">{records.filter(r => r.complications !== 'None').length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Reviews Due</p><p className="text-2xl font-bold text-orange-600">{records.filter(r => r.nextReviewDate <= '2026-08-25').length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Weaned Off</p><p className="text-2xl font-bold text-green-600">{records.filter(r => r.status === 'Weaned').length}</p></Card>
      </div>

      {showAdd && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Start Oxygen Therapy</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Patient Name" value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })} />
            <Input placeholder="MRN" value={form.mrn} onChange={e => setForm({ ...form, mrn: e.target.value })} />
            <Input placeholder="Ward" value={form.ward} onChange={e => setForm({ ...form, ward: e.target.value })} />
            <select className="border rounded-lg px-3 py-2" value={form.indication} onChange={e => setForm({ ...form, indication: e.target.value })}>
              <option value="">Indication</option>
              {INDICATIONS.map(i => <option key={i}>{i}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2" value={form.deliveryDevice} onChange={e => setForm({ ...form, deliveryDevice: e.target.value })}>
              <option value="">Delivery Device</option>
              {DEVICES.map(d => <option key={d}>{d}</option>)}
            </select>
            <Input placeholder="Flow Rate / FiO2" value={form.flowRate} onChange={e => setForm({ ...form, flowRate: e.target.value })} />
            <Input placeholder="Target SpO2 Range" value={form.targetRange} onChange={e => setForm({ ...form, targetRange: e.target.value })} />
            <Input placeholder="Current SpO2" value={form.currentSpO2} onChange={e => setForm({ ...form, currentSpO2: e.target.value })} />
            <Input type="date" placeholder="Date Started" value={form.dateStarted} onChange={e => setForm({ ...form, dateStarted: e.target.value })} />
            <Input placeholder="Prescribed By" value={form.assessedBy} onChange={e => setForm({ ...form, assessedBy: e.target.value })} />
            <Input type="date" placeholder="Next Review Date" value={form.nextReviewDate} onChange={e => setForm({ ...form, nextReviewDate: e.target.value })} />
            <textarea placeholder="Complications" value={form.complications} onChange={e => setForm({ ...form, complications: e.target.value })} className="border rounded-lg px-3 py-2 col-span-3" rows={2} />
            <textarea placeholder="Comments" value={form.comments} onChange={e => setForm({ ...form, comments: e.target.value })} className="border rounded-lg px-3 py-2 col-span-3" rows={2} />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAdd} className="bg-green-600 text-white">Save</Button>
            <Button onClick={() => setShowAdd(false)} className="bg-gray-300">Cancel</Button>
          </div>
        </Card>
      )}

      <div className="mb-4">
        <Input placeholder="🔍 Search by patient or ward..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Patient</th>
                <th className="p-3 text-left">Ward</th>
                <th className="p-3 text-left">Device</th>
                <th className="p-3 text-left">Flow Rate</th>
                <th className="p-3 text-left">SpO2</th>
                <th className="p-3 text-left">Target</th>
                <th className="p-3 text-left">Complications</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">{r.id}</td>
                  <td className="p-3 font-medium">{r.patientName}</td>
                  <td className="p-3">{r.ward}</td>
                  <td className="p-3"><Badge className="bg-blue-100 text-blue-800">{r.deliveryDevice}</Badge></td>
                  <td className="p-3">{r.flowRate}</td>
                  <td className="p-3 font-semibold">{r.currentSpO2}</td>
                  <td className="p-3">{r.targetRange}</td>
                  <td className="p-3">{r.complications === 'None' ? <span className="text-green-600">None</span> : <span className="text-red-600">{r.complications}</span>}</td>
                  <td className="p-3"><Badge className={r.status === 'Active' ? 'bg-blue-100 text-blue-800' : r.status === 'Weaned' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
