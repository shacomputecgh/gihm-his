import { useState, useMemo } from 'react';
import { Card, Badge, Button, Input } from '../../components/ui';

interface CompoundingJob {
  id: string;
  productName: string;
  category: string;
  requestedBy: string;
  patientName: string;
  formula: string;
  quantity: string;
  requestedDate: string;
  completedDate: string;
  compoundingBy: string;
  verifiedBy: string;
  batchNo: string;
  expiryDate: string;
  status: string;
  notes: string;
}

const CATEGORIES = ['Oral Solution', 'Cream/Ointment', 'Suspension', 'Suppository', 'Powder Mix', 'Capsule Fill', 'Eye Drops', 'Ear Drops', 'Nasal Drops', 'Gargle/Mouthwash', 'Enema', 'Other'];

export default function PharmacyCompoundingEnhanced() {
  const [records, setRecords] = useState<CompoundingJob[]>([
    { id: 'CMP-001', productName: 'Oral Rehydration Salts (ORS)', category: 'Oral Solution', requestedBy: 'Dr. Osei', patientName: 'Kofi Mensah', formula: 'Sodium chloride 2.6g, Potassium chloride 1.5g, Sodium citrate 2.9g, Dextrose 13.5g per litre', quantity: '5 Litres', requestedDate: '2026-08-24', completedDate: '2026-08-24', compoundingBy: 'Pharmacist Esi', verifiedBy: 'Chief Pharmacist', batchNo: 'CMP-2026-042', expiryDate: '2026-09-24', status: 'Dispensed', notes: 'For paeds ward - ORS station' },
    { id: 'CMP-002', productName: 'Zinc Sulphate Suspension', category: 'Suspension', requestedBy: 'Dr. Akosua', patientName: '', formula: 'Zinc sulphate 20mg/5ml suspension', quantity: '2 Litres', requestedDate: '2026-08-23', completedDate: '2026-08-24', compoundingBy: 'Pharmacist Kofi', verifiedBy: 'Chief Pharmacist', batchNo: 'CMP-2026-041', expiryDate: '2026-10-23', status: 'Dispensed', notes: 'Paediatric diarrhoea management' },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState<CompoundingJob>({ id: '', productName: '', category: '', requestedBy: '', patientName: '', formula: '', quantity: '', requestedDate: '', completedDate: '', compoundingBy: '', verifiedBy: '', batchNo: '', expiryDate: '', status: 'Requested', notes: '' });

  const filtered = useMemo(() => records.filter(r =>
    r.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.patientName.toLowerCase().includes(searchTerm.toLowerCase())
  ), [records, searchTerm]);

  const handleAdd = () => {
    const r: CompoundingJob = { ...form, id: `CMP-${String(records.length + 1).padStart(3, '0')}` };
    setRecords([r, ...records]);
    setShowAdd(false);
    setForm({ id: '', productName: '', category: '', requestedBy: '', patientName: '', formula: '', quantity: '', requestedDate: '', completedDate: '', compoundingBy: '', verifiedBy: '', batchNo: '', expiryDate: '', status: 'Requested', notes: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">⚗️ Pharmacy Compounding</h1>
          <p className="text-gray-600">Custom pharmaceutical preparations — formulas, batch tracking, quality verification</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="bg-green-600 hover:bg-green-700 text-white">+ New Compounding Job</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-sm text-gray-500">Total Jobs</p><p className="text-2xl font-bold">{records.length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Requested</p><p className="text-2xl font-bold text-yellow-600">{records.filter(r => r.status === 'Requested').length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">In Progress</p><p className="text-2xl font-bold text-blue-600">{records.filter(r => r.status === 'In Progress').length}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Completed</p><p className="text-2xl font-bold text-green-600">{records.filter(r => r.status === 'Completed' || r.status === 'Dispensed').length}</p></Card>
      </div>

      {showAdd && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">New Compounding Job</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Product Name" value={form.productName} onChange={e => setForm({ ...form, productName: e.target.value })} />
            <select className="border rounded-lg px-3 py-2" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              <option value="">Category</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <Input placeholder="Requested By" value={form.requestedBy} onChange={e => setForm({ ...form, requestedBy: e.target.value })} />
            <Input placeholder="Patient Name (or blank for stock)" value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })} />
            <Input placeholder="Quantity" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
            <Input type="date" placeholder="Requested Date" value={form.requestedDate} onChange={e => setForm({ ...form, requestedDate: e.target.value })} />
            <textarea placeholder="Formula / Ingredients" value={form.formula} onChange={e => setForm({ ...form, formula: e.target.value })} className="border rounded-lg px-3 py-2 col-span-3" rows={3} />
            <Input placeholder="Compounded By" value={form.compoundingBy} onChange={e => setForm({ ...form, compoundingBy: e.target.value })} />
            <Input placeholder="Batch Number" value={form.batchNo} onChange={e => setForm({ ...form, batchNo: e.target.value })} />
            <Input type="date" placeholder="Expiry Date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} />
            <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="border rounded-lg px-3 py-2 col-span-3" rows={2} />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAdd} className="bg-green-600 text-white">Save</Button>
            <Button onClick={() => setShowAdd(false)} className="bg-gray-300">Cancel</Button>
          </div>
        </Card>
      )}

      <div className="mb-4">
        <Input placeholder="🔍 Search by product name or patient..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Product</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Patient</th>
                <th className="p-3 text-left">Quantity</th>
                <th className="p-3 text-left">Batch No</th>
                <th className="p-3 text-left">Expiry</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">{r.id}</td>
                  <td className="p-3 font-medium">{r.productName}</td>
                  <td className="p-3"><Badge className="bg-blue-100 text-blue-800">{r.category}</Badge></td>
                  <td className="p-3">{r.patientName || <span className="text-gray-400">Stock</span>}</td>
                  <td className="p-3">{r.quantity}</td>
                  <td className="p-3 font-mono text-xs">{r.batchNo}</td>
                  <td className="p-3">{r.expiryDate}</td>
                  <td className="p-3"><Badge className={r.status === 'Dispensed' || r.status === 'Completed' ? 'bg-green-100 text-green-800' : r.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}>{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
