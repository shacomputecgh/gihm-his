import { useState, useMemo } from 'react';
import { Card, Badge, Button, Input } from '../../components/ui';

interface BloodUnit {
  id: string;
  bloodType: string;
  component: string;
  unitNumber: string;
  donorId: string;
  collectionDate: string;
  expiryDate: string;
  status: string;
  crossmatchStatus: string;
  assignedTo: string;
  issuedTo: string;
  issuedDate: string;
  issueReason: string;
  volume: string;
  storageLocation: string;
  testedFor: string;
  issuedBy: string;
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const COMPONENTS = ['Whole Blood', 'Packed Red Cells', 'Fresh Frozen Plasma', 'Platelets', 'Cryoprecipitate', 'Albumin'];

export default function BloodBankEnhancedModule() {
  const [units, setUnits] = useState<BloodUnit[]>([
    { id: 'BB-001', bloodType: 'O-', component: 'Packed Red Cells', unitNumber: 'RC-2026-0451', donorId: 'D-0892', collectionDate: '2026-08-10', expiryDate: '2026-09-07', status: 'Available', crossmatchStatus: 'Not Done', assignedTo: '', issuedTo: '', issuedDate: '', issueReason: '', volume: '300ml', storageLocation: 'Fridge 1 - Shelf A', testedFor: 'HIV, HBV, HCV, Syphilis, Malaria - All Negative', issuedBy: '' },
    { id: 'BB-002', bloodType: 'A+', component: 'Packed Red Cells', unitNumber: 'RC-2026-0452', donorId: 'D-0893', collectionDate: '2026-08-12', expiryDate: '2026-09-09', status: 'Reserved', crossmatchStatus: 'Compatible', assignedTo: 'Kofi Mensah (MRN-001)', issuedTo: '', issuedDate: '', issueReason: 'Surgical', volume: '320ml', storageLocation: 'Fridge 1 - Shelf B', testedFor: 'HIV, HBV, HCV, Syphilis, Malaria - All Negative', issuedBy: '' },
    { id: 'BB-003', bloodType: 'B+', component: 'Fresh Frozen Plasma', unitNumber: 'FFP-2026-0198', donorId: 'D-0894', collectionDate: '2026-08-08', expiryDate: '2026-08-25', status: 'Issued', crossmatchStatus: 'Compatible', assignedTo: 'Ama Darko (MRN-002)', issuedTo: 'Ama Darko', issuedDate: '2026-08-24', issueReason: 'Coagulopathy', volume: '250ml', storageLocation: 'Freezer 1', testedFor: 'HIV, HBV, HCV, Syphilis - All Negative', issuedBy: 'Blood Bank Nurse Esi' },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState<BloodUnit>({ id: '', bloodType: 'O+', component: 'Packed Red Cells', unitNumber: '', donorId: '', collectionDate: '', expiryDate: '', status: 'Available', crossmatchStatus: 'Not Done', assignedTo: '', issuedTo: '', issuedDate: '', issueReason: '', volume: '', storageLocation: '', testedFor: '', issuedBy: '' });

  const filtered = useMemo(() => units.filter(u =>
    u.bloodType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())
  ), [units, searchTerm]);

  const handleAdd = () => {
    const u: BloodUnit = { ...form, id: `BB-${String(units.length + 1).padStart(3, '0')}` };
    setUnits([u, ...units]);
    setShowAdd(false);
    setForm({ id: '', bloodType: 'O+', component: 'Packed Red Cells', unitNumber: '', donorId: '', collectionDate: '', expiryDate: '', status: 'Available', crossmatchStatus: 'Not Done', assignedTo: '', issuedTo: '', issuedDate: '', issueReason: '', volume: '', storageLocation: '', testedFor: '', issuedBy: '' });
  };

  const stockByType = BLOOD_TYPES.map(type => ({
    type,
    available: units.filter(u => u.bloodType === type && u.status === 'Available').length,
    reserved: units.filter(u => u.bloodType === type && u.status === 'Reserved').length,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🩸 Blood Bank (Enhanced)</h1>
          <p className="text-gray-600">Blood product management — inventory, crossmatching, issuing, transfusion tracking</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="bg-red-600 hover:bg-red-700 text-white">+ Register Blood Unit</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {stockByType.map(s => (
          <Card key={s.type} className="p-3 text-center">
            <p className="font-bold text-lg">{s.type}</p>
            <p className="text-sm text-green-600">{s.available} avail</p>
            <p className="text-xs text-orange-600">{s.reserved} reserved</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-sm text-gray-500">Total Units</p><p className="text-2xl font-bold">{units.length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Available</p><p className="text-2xl font-bold text-green-600">{units.filter(u => u.status === 'Available').length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Reserved</p><p className="text-2xl font-bold text-orange-600">{units.filter(u => u.status === 'Reserved').length}</p></Card>
        <Card className="p-4 border-l-4 border-red-500"><p className="text-sm text-gray-500">Expiring Soon (&lt;7 days)</p><p className="text-2xl font-bold text-red-600">{units.filter(u => u.status === 'Available' && new Date(u.expiryDate) <= new Date(Date.now() + 7 * 86400000)).length}</p></Card>
      </div>

      {showAdd && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Register Blood Unit</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select className="border rounded-lg px-3 py-2" value={form.bloodType} onChange={e => setForm({ ...form, bloodType: e.target.value })}>
              {BLOOD_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2" value={form.component} onChange={e => setForm({ ...form, component: e.target.value })}>
              {COMPONENTS.map(c => <option key={c}>{c}</option>)}
            </select>
            <Input placeholder="Unit Number" value={form.unitNumber} onChange={e => setForm({ ...form, unitNumber: e.target.value })} />
            <Input placeholder="Donor ID" value={form.donorId} onChange={e => setForm({ ...form, donorId: e.target.value })} />
            <Input type="date" placeholder="Collection Date" value={form.collectionDate} onChange={e => setForm({ ...form, collectionDate: e.target.value })} />
            <Input type="date" placeholder="Expiry Date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} />
            <Input placeholder="Volume" value={form.volume} onChange={e => setForm({ ...form, volume: e.target.value })} />
            <Input placeholder="Storage Location" value={form.storageLocation} onChange={e => setForm({ ...form, storageLocation: e.target.value })} />
            <textarea placeholder="Testing Results" value={form.testedFor} onChange={e => setForm({ ...form, testedFor: e.target.value })} className="border rounded-lg px-3 py-2 col-span-3" rows={2} />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAdd} className="bg-green-600 text-white">Save</Button>
            <Button onClick={() => setShowAdd(false)} className="bg-gray-300">Cancel</Button>
          </div>
        </Card>
      )}

      <div className="mb-4">
        <Input placeholder="🔍 Search by blood type, unit number, or patient..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Unit #</th>
                <th className="p-3 text-left">Blood Type</th>
                <th className="p-3 text-left">Component</th>
                <th className="p-3 text-left">Volume</th>
                <th className="p-3 text-left">Expiry</th>
                <th className="p-3 text-left">Crossmatch</th>
                <th className="p-3 text-left">Assigned To</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">{u.unitNumber}</td>
                  <td className="p-3"><span className="font-bold text-lg">{u.bloodType}</span></td>
                  <td className="p-3">{u.component}</td>
                  <td className="p-3">{u.volume}</td>
                  <td className="p-3">{u.expiryDate} {new Date(u.expiryDate) < new Date() ? <Badge className="bg-red-100 text-red-800">Expired</Badge> : ''}</td>
                  <td className="p-3"><Badge className={u.crossmatchStatus === 'Compatible' ? 'bg-green-100 text-green-800' : u.crossmatchStatus === 'Incompatible' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}>{u.crossmatchStatus}</Badge></td>
                  <td className="p-3">{u.assignedTo || <span className="text-gray-400">-</span>}</td>
                  <td className="p-3"><Badge className={u.status === 'Available' ? 'bg-green-100 text-green-800' : u.status === 'Reserved' ? 'bg-orange-100 text-orange-800' : u.status === 'Issued' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}>{u.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
