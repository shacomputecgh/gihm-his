import { useState, useMemo } from 'react';
import { Card, Badge, Button, Input } from '../../components/ui';

interface Equipment {
  id: string;
  name: string;
  category: string;
  location: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  assetTag: string;
  purchaseDate: string;
  warrantyExpiry: string;
  lastServiced: string;
  nextService: string;
  status: string;
  condition: string;
  assignedTo: string;
  calibrationDue: string;
}

const CATEGORIES = ['Ventilator', 'Monitor', 'Infusion Pump', 'Defibrillator', 'ECG Machine', 'Ultrasound', 'X-Ray Machine', 'CT Scanner', 'MRI Machine', 'Anaesthesia Machine', 'Dialysis Machine', 'Suction Unit', 'Oxygen Concentrator', 'Patient Bed', 'Wheelchair', 'Stretcher', 'Other'];
const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'Non-Functional'];
const LOCATIONS = ['ICU', 'Emergency', 'Theatre 1', 'Theatre 2', 'Medical Ward', 'Surgical Ward', 'Paediatric Ward', 'Maternity', 'Radiology', 'Laboratory', 'Biomedical Store', 'Outpatient'];

export default function MedicalEquipmentTracker() {
  const [records, setRecords] = useState<Equipment[]>([
    { id: 'EQ-001', name: 'Hamilton C6 Ventilator', category: 'Ventilator', location: 'ICU', manufacturer: 'Hamilton Medical', model: 'C6', serialNumber: 'HC6-2024-0892', assetTag: 'Vent-ICU-01', purchaseDate: '2024-03-15', warrantyExpiry: '2027-03-15', lastServiced: '2026-06-01', nextService: '2026-09-01', status: 'In Use', condition: 'Good', assignedTo: 'Bed 3', calibrationDue: '2026-12-01' },
    { id: 'EQ-002', name: 'Philips IntelliVue MX800', category: 'Monitor', location: 'ICU', manufacturer: 'Philips', model: 'MX800', serialNumber: 'PMX800-2023-4521', assetTag: 'Mon-ICU-01', purchaseDate: '2023-08-20', warrantyExpiry: '2026-08-20', lastServiced: '2026-07-15', nextService: '2026-10-15', status: 'In Use', condition: 'Good', assignedTo: 'Bed 1', calibrationDue: '2026-11-20' },
    { id: 'EQ-003', name: 'Drager Fabius GS', category: 'Anaesthesia Machine', location: 'Theatre 1', manufacturer: 'Drager', model: 'Fabius GS', serialNumber: 'DFGS-2022-1234', assetTag: 'Anaesth-Th1', purchaseDate: '2022-01-10', warrantyExpiry: '2025-01-10', lastServiced: '2026-04-01', nextService: '2026-07-01', status: 'Under Maintenance', condition: 'Fair', assignedTo: '', calibrationDue: '2026-08-01' },
    { id: 'EQ-004', name: 'GE Logiq E9 Ultrasound', category: 'Ultrasound', location: 'Radiology', manufacturer: 'GE Healthcare', model: 'Logiq E9', serialNumber: 'GELE9-2023-7890', assetTag: 'US-Rad-01', purchaseDate: '2023-05-20', warrantyExpiry: '2026-05-20', lastServiced: '2026-06-10', nextService: '2026-12-10', status: 'Available', condition: 'Excellent', assignedTo: '', calibrationDue: '2026-12-10' },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState<Equipment>({ id: '', name: '', category: '', location: '', manufacturer: '', model: '', serialNumber: '', assetTag: '', purchaseDate: '', warrantyExpiry: '', lastServiced: '', nextService: '', status: 'Available', condition: 'Good', assignedTo: '', calibrationDue: '' });

  const filtered = useMemo(() => records.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.category.toLowerCase().includes(searchTerm.toLowerCase())
  ), [records, searchTerm]);

  const handleAdd = () => {
    const r: Equipment = { ...form, id: `EQ-${String(records.length + 1).padStart(3, '0')}` };
    setRecords([r, ...records]);
    setShowAdd(false);
    setForm({ id: '', name: '', category: '', location: '', manufacturer: '', model: '', serialNumber: '', assetTag: '', purchaseDate: '', warrantyExpiry: '', lastServiced: '', nextService: '', status: 'Available', condition: 'Good', assignedTo: '', calibrationDue: '' });
  };

  const underMaint = records.filter(r => r.status === 'Under Maintenance').length;
  const warrantyExpired = records.filter(r => r.warrantyExpiry < '2026-08-24').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🔧 Medical Equipment Tracker</h1>
          <p className="text-gray-600">Equipment inventory, maintenance schedules, calibration tracking</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="bg-green-600 hover:bg-green-700 text-white">+ Add Equipment</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4"><p className="text-sm text-gray-500">Total Equipment</p><p className="text-2xl font-bold">{records.length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">In Use</p><p className="text-2xl font-bold text-blue-600">{records.filter(r => r.status === 'In Use').length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Under Maintenance</p><p className="text-2xl font-bold text-orange-600">{underMaint}</p></Card>
        <Card className="p-4 border-l-4 border-red-500"><p className="text-sm text-gray-500">Warranty Expired</p><p className="text-2xl font-bold text-red-600">{warrantyExpired}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Available</p><p className="text-2xl font-bold text-green-600">{records.filter(r => r.status === 'Available').length}</p></Card>
      </div>

      {showAdd && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Add Equipment</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Equipment Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <select className="border rounded-lg px-3 py-2" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              <option value="">Category</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}>
              <option value="">Location</option>
              {LOCATIONS.map(l => <option key={l}>{l}</option>)}
            </select>
            <Input placeholder="Manufacturer" value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })} />
            <Input placeholder="Model" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />
            <Input placeholder="Serial Number" value={form.serialNumber} onChange={e => setForm({ ...form, serialNumber: e.target.value })} />
            <Input placeholder="Asset Tag" value={form.assetTag} onChange={e => setForm({ ...form, assetTag: e.target.value })} />
            <Input type="date" placeholder="Purchase Date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} />
            <Input type="date" placeholder="Warranty Expiry" value={form.warrantyExpiry} onChange={e => setForm({ ...form, warrantyExpiry: e.target.value })} />
            <Input type="date" placeholder="Last Serviced" value={form.lastServiced} onChange={e => setForm({ ...form, lastServiced: e.target.value })} />
            <Input type="date" placeholder="Next Service" value={form.nextService} onChange={e => setForm({ ...form, nextService: e.target.value })} />
            <Input type="date" placeholder="Calibration Due" value={form.calibrationDue} onChange={e => setForm({ ...form, calibrationDue: e.target.value })} />
            <select className="border rounded-lg px-3 py-2" value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}>
              {CONDITIONS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAdd} className="bg-green-600 text-white">Save</Button>
            <Button onClick={() => setShowAdd(false)} className="bg-gray-300">Cancel</Button>
          </div>
        </Card>
      )}

      <div className="mb-4">
        <Input placeholder="🔍 Search by name, location, or category..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Asset Tag</th>
                <th className="p-3 text-left">Equipment</th>
                <th className="p-3 text-left">Location</th>
                <th className="p-3 text-left">Condition</th>
                <th className="p-3 text-left">Warranty</th>
                <th className="p-3 text-left">Next Service</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">{r.assetTag}</td>
                  <td className="p-3 font-medium">{r.name}</td>
                  <td className="p-3">{r.location}</td>
                  <td className="p-3"><Badge className={r.condition === 'Excellent' || r.condition === 'Good' ? 'bg-green-100 text-green-800' : r.condition === 'Fair' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>{r.condition}</Badge></td>
                  <td className="p-3">{r.warrantyExpiry} {r.warrantyExpiry < '2026-08-24' ? <Badge className="bg-red-100 text-red-800">Expired</Badge> : ''}</td>
                  <td className="p-3">{r.nextService}</td>
                  <td className="p-3"><Badge className={r.status === 'In Use' ? 'bg-blue-100 text-blue-800' : r.status === 'Available' ? 'bg-green-100 text-green-800' : r.status === 'Under Maintenance' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}>{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
