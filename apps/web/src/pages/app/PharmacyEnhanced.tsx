import { useState } from 'react';
import { Badge, Card } from '../../components/ui';

interface Prescription { id: string; patientName: string; mrn: string; ward: string; doctor: string; medications: { name: string; dose: string; frequency: string; duration: string; quantity: number; dispensed: number; }[]; status: 'Pending' | 'Partially Dispensed' | 'Fully Dispensed' | 'On Hold' | 'Cancelled'; dateIssued: string; dateDispensed?: string; dispenser?: string; totalCost: number; insuranceCovered: number; }
interface StockAlert { drug: string; currentStock: number; minStock: number; unit: string; category: string; supplier: string; lastOrder: string; expiryDate: string; }

const PRESCRIPTIONS: Prescription[] = [
  { id: 'RX-001', patientName: 'Kwame Asante', mrn: 'MRN-2024-0891', ward: 'Surgical Ward', doctor: 'Dr. Yaw Boateng', medications: [{ name: 'Amoxicillin 500mg', dose: '500mg', frequency: 'TDS', duration: '5 days', quantity: 15, dispensed: 15 }, { name: 'Paracetamol 1g', dose: '1g', frequency: 'QDS', duration: '5 days', quantity: 20, dispensed: 20 }, { name: 'Ibuprofen 400mg', dose: '400mg', frequency: 'TDS', duration: '5 days', quantity: 15, dispensed: 0 }], status: 'Partially Dispensed', dateIssued: '2026-08-26', dispenser: 'Pharm Kofi', totalCost: 45.00, insuranceCovered: 30.00 },
  { id: 'RX-002', patientName: 'Akua Mensah', mrn: 'MRN-2024-1234', ward: 'Maternity', doctor: 'Dr. Ama Darko', medications: [{ name: 'Paracetamol 1g', dose: '1g', frequency: 'QDS', duration: '7 days', quantity: 28, dispensed: 28 }, { name: 'Ferrous Sulphate 200mg', dose: '200mg', frequency: 'BD', duration: '6 weeks', quantity: 84, dispensed: 84 }], status: 'Fully Dispensed', dateIssued: '2026-08-26', dateDispensed: '2026-08-26 10:30', dispenser: 'Pharm Akua', totalCost: 28.50, insuranceCovered: 28.50 },
  { id: 'RX-003', patientName: 'Nana Osei', mrn: 'MRN-2024-0567', ward: 'ICU', doctor: 'Dr. Ama Darko', medications: [{ name: 'Meropenem 1g', dose: '1g', frequency: 'TDS', duration: '7 days', quantity: 21, dispensed: 0 }, { name: 'Vancomycin 1g', dose: '1g', frequency: 'BD', duration: '7 days', quantity: 14, dispensed: 0 }], status: 'Pending', dateIssued: '2026-08-26', totalCost: 890.00, insuranceCovered: 650.00 },
  { id: 'RX-004', patientName: 'Efua Nyarko', mrn: 'MRN-2024-0998', ward: 'Medical Ward B', doctor: 'Dr. Kofi Asante', medications: [{ name: 'Metformin 500mg', dose: '500mg', frequency: 'BD', duration: '30 days', quantity: 60, dispensed: 60 }, { name: 'Gliclazide 80mg', dose: '80mg', frequency: 'BD', duration: '30 days', quantity: 60, dispensed: 60 }, { name: 'Insulin Glargine', dose: '18u', frequency: 'OD', duration: '30 days', quantity: 1, dispensed: 1 }], status: 'Fully Dispensed', dateIssued: '2026-08-26', dateDispensed: '2026-08-26 11:00', dispenser: 'Pharm Kofi', totalCost: 125.00, insuranceCovered: 100.00 },
];

const STOCK_ALERTS: StockAlert[] = [
  { drug: 'Amoxicillin 500mg', currentStock: 150, minStock: 200, unit: 'capsules', category: 'Antibiotic', supplier: 'Ernest Chemists', lastOrder: '2026-08-15', expiryDate: '2027-12-31' },
  { drug: 'Paracetamol 1g', currentStock: 80, minStock: 500, unit: 'tablets', category: 'Analgesic', supplier: 'Danadams', lastOrder: '2026-08-10', expiryDate: '2028-06-30' },
  { drug: 'Insulin Glargine', currentStock: 5, minStock: 10, unit: 'vials', category: 'Endocrine', supplier: 'Sanofi', lastOrder: '2026-08-01', expiryDate: '2027-03-31' },
  { drug: 'Omeprazole 20mg', currentStock: 120, minStock: 300, unit: 'capsules', category: 'Gastro', supplier: 'Phyto-Riker', lastOrder: '2026-08-12', expiryDate: '2027-09-30' },
];

export default function PharmacyEnhanced() {
  const [tab, setTab] = useState<'prescriptions' | 'stock'>('prescriptions');
  const [filter, setFilter] = useState('All');
  const filtered = filter === 'All' ? PRESCRIPTIONS : PRESCRIPTIONS.filter(p => p.status === filter);
  const pendingCount = PRESCRIPTIONS.filter(p => p.status === 'Pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pharmacy Management</h1>
          <p className="text-slate-500 text-sm">Prescription dispensing, stock management, and drug safety</p>
        </div>
        <button onClick={() => {}} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ New Prescription</button>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('prescriptions')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'prescriptions' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>Prescriptions ({PRESCRIPTIONS.length})</button>
        <button onClick={() => setTab('stock')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'stock' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>Stock Alerts ({STOCK_ALERTS.length})</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4"><p className="text-xs text-slate-500">Pending</p><p className="text-2xl font-bold text-yellow-600">{pendingCount}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Partially Filled</p><p className="text-2xl font-bold text-orange-600">{PRESCRIPTIONS.filter(p => p.status === 'Partially Dispensed').length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Dispensed Today</p><p className="text-2xl font-bold text-green-600">{PRESCRIPTIONS.filter(p => p.status === 'Fully Dispensed').length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Revenue</p><p className="text-2xl font-bold">GH₵ {PRESCRIPTIONS.reduce((s, p) => s + p.totalCost, 0).toFixed(2)}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Stock Low</p><p className="text-2xl font-bold text-red-600">{STOCK_ALERTS.length}</p></Card>
      </div>

      {tab === 'prescriptions' ? (
        <>
          <div className="flex gap-2">
            {['All', 'Pending', 'Partially Dispensed', 'Fully Dispensed', 'On Hold'].map(s => (
              <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 rounded-lg text-xs font-medium ${filter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{s}</button>
            ))}
          </div>
          <div className="space-y-3">
            {filtered.map(p => (
              <Card key={p.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{p.patientName}</span>
                      <Badge tone={p.status === 'Fully Dispensed' ? 'green' : p.status === 'Pending' ? 'gold' : 'blue'}>{p.status}</Badge>
                    </div>
                    <p className="text-sm text-slate-500">{p.mrn} · {p.ward} · {p.doctor} · {p.dateIssued}</p>
                    <div className="mt-2 space-y-1">
                      {p.medications.map((m, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className={m.dispensed === m.quantity ? 'text-green-600' : 'text-orange-600'}>{m.dispensed === m.quantity ? '✅' : '⏳'}</span>
                          <span className="font-medium">{m.name}</span>
                          <span className="text-slate-500">{m.dose} {m.frequency} × {m.duration}</span>
                          <span className="text-slate-400">({m.dispensed}/{m.quantity})</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Total: GH₵ {p.totalCost.toFixed(2)} · Insurance: GH₵ {p.insuranceCovered.toFixed(2)}</p>
                  </div>
                  <div className="flex gap-2">
                    {p.status !== 'Fully Dispensed' && <button onClick={() => {}} className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">Dispense</button>}
                    <button onClick={() => {}} className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Print</button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {STOCK_ALERTS.map(s => (
            <Card key={s.drug} className="p-4 border-l-4 border-red-400">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{s.drug}</span>
                    <Badge tone="red">Low Stock</Badge>
                  </div>
                  <p className="text-sm text-slate-500">{s.category} · {s.supplier}</p>
                  <p className="text-xs text-slate-500">Current: {s.currentStock} {s.unit} · Minimum: {s.minStock} · Last Order: {s.lastOrder}</p>
                </div>
                <button onClick={() => {}} className="px-3 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700">Reorder</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
