import { useState } from 'react';
import { Badge, Card } from '../../components/ui';

interface Invoice { id: string; patientName: string; mrn: string; ward: string; date: string; items: { description: string; quantity: number; unitPrice: number; total: number; }[]; subtotal: number; discount: number; total: number; paid: number; balance: number; paymentMethod: 'Cash' | 'NHIS' | 'Insurance' | 'Credit' | 'Mixed'; status: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overpaid' | 'Written Off'; insuranceClaim?: string; }

const INVOICES: Invoice[] = [
  { id: 'INV-001', patientName: 'Kwame Asante', mrn: 'MRN-2024-0891', ward: 'Surgical Ward', date: '2026-08-26', items: [{ description: 'Appendectomy', quantity: 1, unitPrice: 2500, total: 2500 }, { description: 'Anaesthesia', quantity: 1, unitPrice: 800, total: 800 }, { description: 'Theatre charges', quantity: 1, unitPrice: 500, total: 500 }, { description: 'Bed (2 nights)', quantity: 2, unitPrice: 150, total: 300 }, { description: 'Medications', quantity: 1, unitPrice: 250, total: 250 }], subtotal: 4350, discount: 0, total: 4350, paid: 4350, balance: 0, paymentMethod: 'Insurance', status: 'Paid', insuranceClaim: 'NHIS-2024-0891' },
  { id: 'INV-002', patientName: 'Akua Mensah', mrn: 'MRN-2024-1234', ward: 'Maternity', date: '2026-08-26', items: [{ description: 'Caesarean Section', quantity: 1, unitPrice: 3000, total: 3000 }, { description: 'Anaesthesia', quantity: 1, unitPrice: 800, total: 800 }, { description: 'Bed (1 night)', quantity: 1, unitPrice: 200, total: 200 }, { description: 'Medications', quantity: 1, unitPrice: 180, total: 180 }], subtotal: 4180, discount: 0, total: 4180, paid: 2000, balance: 2180, paymentMethod: 'Mixed', status: 'Partially Paid', insuranceClaim: 'NIC-2024-1234' },
  { id: 'INV-003', patientName: 'Nana Osei', mrn: 'MRN-2024-0567', ward: 'ICU', date: '2026-08-26', items: [{ description: 'ICU bed (7 days)', quantity: 7, unitPrice: 500, total: 3500 }, { description: 'Ventilator', quantity: 5, unitPrice: 800, total: 4000 }, { description: 'Medications', quantity: 1, unitPrice: 2500, total: 2500 }, { description: 'Laboratory tests', quantity: 1, unitPrice: 800, total: 800 }], subtotal: 10800, discount: 0, total: 10800, paid: 0, balance: 10800, paymentMethod: 'NHIS', status: 'Unpaid', insuranceClaim: 'NHIS-2024-0567' },
  { id: 'INV-004', patientName: 'Efua Nyarko', mrn: 'MRN-2024-0998', ward: 'Medical Ward B', date: '2026-08-26', items: [{ description: 'Bed (6 nights)', quantity: 6, unitPrice: 150, total: 900 }, { description: 'Medications', quantity: 1, unitPrice: 450, total: 450 }, { description: 'Laboratory tests', quantity: 1, unitPrice: 350, total: 350 }], subtotal: 1700, discount: 200, total: 1500, paid: 1500, balance: 0, paymentMethod: 'Cash', status: 'Paid' },
];

const _STATUS_COLORS: Record<string, string> = { Unpaid: 'bg-red-100 text-red-800', 'Partially Paid': 'bg-yellow-100 text-yellow-800', Paid: 'bg-green-100 text-green-800', Overpaid: 'bg-blue-100 text-blue-800', 'Written Off': 'bg-gray-100 text-gray-600' };

export default function BillingEnhanced() {
  const toast = useToast();
  const [filter, setFilter] = useState('All');
  const filtered = filter === 'All' ? INVOICES : INVOICES.filter(i => i.status === filter);
  const totalRevenue = INVOICES.reduce((s, i) => s + i.paid, 0);
  const totalOutstanding = INVOICES.reduce((s, i) => s + i.balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Billing & Payments</h1>
          <p className="text-slate-500 text-sm">Invoice management, insurance claims, and payment tracking</p>
        </div>
        <button onClick={() => {}} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">+ New Invoice</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4"><p className="text-xs text-slate-500">Total Invoices</p><p className="text-2xl font-bold">{INVOICES.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Revenue Collected</p><p className="text-2xl font-bold text-green-600">GH₵ {totalRevenue.toLocaleString()}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Outstanding</p><p className="text-2xl font-bold text-red-600">GH₵ {totalOutstanding.toLocaleString()}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Unpaid</p><p className="text-2xl font-bold text-orange-600">{INVOICES.filter(i => i.status === 'Unpaid').length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Insurance Claims</p><p className="text-2xl font-bold text-blue-600">{INVOICES.filter(i => i.insuranceClaim).length}</p></Card>
      </div>

      <div className="flex gap-2">
        {['All', 'Unpaid', 'Partially Paid', 'Paid'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 rounded-lg text-xs font-medium ${filter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{s}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(inv => (
          <Card key={inv.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{inv.id}</span>
                  <span className="font-medium">{inv.patientName}</span>
                  <Badge tone={inv.status === 'Paid' ? 'green' : inv.status === 'Unpaid' ? 'red' : 'gold'}>{inv.status}</Badge>
                  <Badge tone="blue">{inv.paymentMethod}</Badge>
                  {inv.insuranceClaim && <Badge tone="purple">{inv.insuranceClaim}</Badge>}
                </div>
                <p className="text-sm text-slate-500">{inv.mrn} · {inv.ward} · {inv.date}</p>
                <div className="mt-2 text-sm">
                  {inv.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-slate-600">
                      <span>{item.description} × {item.quantity}</span>
                      <span>GH₵ {item.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t flex justify-between text-sm font-medium">
                  <span>Total: GH₵ {inv.total.toLocaleString()}</span>
                  <span className="text-green-600">Paid: GH₵ {inv.paid.toLocaleString()}</span>
                  {inv.balance > 0 && <span className="text-red-600">Balance: GH₵ {inv.balance.toLocaleString()}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => {}} className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">📄 PDF</button>
                {inv.balance > 0 && <button onClick={() => {}} className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">💰 Pay</button>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
