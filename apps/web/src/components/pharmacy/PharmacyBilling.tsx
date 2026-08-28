import { useState } from 'react';
import { Card, Badge, Button, Input, Select, Field, StatCard } from '../ui';

interface PharmacyInvoice {
  id: string;
  patientName: string;
  patientMrn: string;
  items: { drugName: string; qty: number; unitPrice: number; total: number }[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'CASH' | 'NHIS' | 'PRIVATE_INSURANCE' | 'CREDIT' | 'MOBILE_MONEY';
  status: 'PENDING' | 'PAID' | 'PARTIAL' | 'REFUNDED' | 'WAIVED';
  insuranceProvider?: string;
  insuranceCoverage?: number;
  patientPortion?: number;
  paidAmount: number;
  createdAt: string;
  paidAt?: string;
  cashier: string;
}

const SAMPLE_INVOICES: PharmacyInvoice[] = [
  { id: 'INV-2026-001', patientName: 'Ama Mensah', patientMrn: 'GH-000001', items: [{ drugName: 'Amoxicillin 500mg × 21', qty: 21, unitPrice: 0.80, total: 16.80 }, { drugName: 'ORS Salts × 10', qty: 10, unitPrice: 0.30, total: 3.00 }], subtotal: 19.80, discount: 0, total: 19.80, paymentMethod: 'CASH', status: 'PAID', paidAmount: 19.80, createdAt: '2026-08-22', paidAt: '2026-08-22', cashier: 'Cashier Ama' },
  { id: 'INV-2026-002', patientName: 'Kofi Ansah', patientMrn: 'GH-000002', items: [{ drugName: 'Ceftriaxone 1g × 5', qty: 5, unitPrice: 10.00, total: 50.00 }, { drugName: 'Paracetamol 1g × 10', qty: 10, unitPrice: 0.80, total: 8.00 }], subtotal: 58.00, discount: 0, total: 58.00, paymentMethod: 'NHIS', status: 'PAID', insuranceProvider: 'NHIS', insuranceCoverage: 46.40, patientPortion: 11.60, paidAmount: 11.60, createdAt: '2026-08-22', paidAt: '2026-08-22', cashier: 'Cashier Ama' },
  { id: 'INV-2026-003', patientName: 'Esi Darko', patientMrn: 'GH-000003', items: [{ drugName: 'Ferrous Sulfate 200mg × 90', qty: 90, unitPrice: 0.15, total: 13.50 }, { drugName: 'Folic Acid 5mg × 90', qty: 90, unitPrice: 0.05, total: 4.50 }], subtotal: 18.00, discount: 2.00, total: 16.00, paymentMethod: 'PRIVATE_INSURANCE', status: 'PENDING', insuranceProvider: 'Enterprise Insurance', insuranceCoverage: 12.80, patientPortion: 3.20, paidAmount: 0, createdAt: '2026-08-22', cashier: 'Cashier Kofi' },
  { id: 'INV-2026-004', patientName: 'Kwesi Appiah', patientMrn: 'GH-000006', items: [{ drugName: 'Insulin Human 100IU × 3', qty: 3, unitPrice: 25.00, total: 75.00 }, { drugName: 'Blood Glucose Strips × 50', qty: 50, unitPrice: 0.80, total: 40.00 }], subtotal: 115.00, discount: 0, total: 115.00, paymentMethod: 'CREDIT', status: 'PARTIAL', paidAmount: 50.00, createdAt: '2026-08-21', cashier: 'Cashier Ama' },
  { id: 'INV-2026-005', patientName: 'Abena Osei', patientMrn: 'GH-000005', items: [{ drugName: 'Coartem 20/120mg × 24', qty: 24, unitPrice: 5.00, total: 120.00 }], subtotal: 120.00, discount: 120.00, total: 0, paymentMethod: 'NHIS', status: 'WAIVED', insuranceProvider: 'NHIS', insuranceCoverage: 120.00, patientPortion: 0, paidAmount: 0, createdAt: '2026-08-21', cashier: 'Cashier Kofi' },
];

const PAYMENT_COLORS: Record<string, 'green' | 'blue' | 'gold' | 'navy' | 'gray'> = {
  CASH: 'green', NHIS: 'blue', PRIVATE_INSURANCE: 'gold', CREDIT: 'navy', MOBILE_MONEY: 'gray',
};

const STATUS_COLORS: Record<string, 'green' | 'gold' | 'blue' | 'red' | 'gray'> = {
  PAID: 'green', PENDING: 'gold', PARTIAL: 'blue', REFUNDED: 'red', WAIVED: 'gray',
};

export default function PharmacyBilling() {
  const [invoices] = useState(SAMPLE_INVOICES);
  const [filter, setFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const filtered = invoices.filter((inv) => {
    if (filter !== 'ALL' && inv.status !== filter) return false;
    if (search && !inv.patientName.toLowerCase().includes(search.toLowerCase()) && !inv.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    totalRevenue: invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.paidAmount, 0),
    pendingAmount: invoices.filter((i) => i.status === 'PENDING' || i.status === 'PARTIAL').reduce((s, i) => s + (i.total - i.paidAmount), 0),
    nhisCollected: invoices.filter((i) => i.paymentMethod === 'NHIS' && i.status === 'PAID').reduce((s, i) => s + i.paidAmount, 0),
    creditOutstanding: invoices.filter((i) => i.paymentMethod === 'CREDIT' && i.status === 'PARTIAL').reduce((s, i) => s + (i.total - i.paidAmount), 0),
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Revenue" value={`GH₵ ${stats.totalRevenue.toLocaleString()}`} tone="green" icon="pill" />
        <StatCard label="Pending" value={`GH₵ ${stats.pendingAmount.toLocaleString()}`} tone="gold" icon="clock" />
        <StatCard label="NHIS Collected" value={`GH₵ ${stats.nhisCollected.toLocaleString()}`} tone="blue" icon="clipboard" />
        <StatCard label="Credit Outstanding" value={`GH₵ ${stats.creditOutstanding.toLocaleString()}`} tone="red" icon="alert" />
      </div>

      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <Field label="Search">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Patient, Invoice ID…" />
            </Field>
          </div>
          <Field label="Status">
            <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="ALL">All</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
              <option value="REFUNDED">Refunded</option>
              <option value="WAIVED">Waived</option>
            </Select>
          </Field>
        </div>
      </Card>

      <Card pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase text-slate-400 dark:border-slate-700">
                {['Invoice', 'Patient', 'Items', 'Total (GH₵)', 'Payment', 'Status', 'Paid', ''].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-g-green">{inv.id}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-g-ink dark:text-white">{inv.patientName}</p>
                    <p className="text-xs text-slate-400">{inv.patientMrn}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{inv.items.length} item(s)</td>
                  <td className="px-4 py-3 tabular-nums font-bold text-g-ink dark:text-white">GH₵ {inv.total.toFixed(2)}</td>
                  <td className="px-4 py-3"><Badge tone={PAYMENT_COLORS[inv.paymentMethod]}>{inv.paymentMethod.replace(/_/g, ' ')}</Badge></td>
                  <td className="px-4 py-3"><Badge tone={STATUS_COLORS[inv.status]}>{inv.status}</Badge></td>
                  <td className="px-4 py-3 text-xs tabular-nums text-slate-500">GH₵ {inv.paidAmount.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="outline">Receipt</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400 dark:border-slate-700">
          {filtered.length} invoice(s) · Revenue: GH₵ {stats.totalRevenue.toLocaleString()}
        </div>
      </Card>

      {/* Payment Methods Summary */}
      <Card>
        <h3 className="mb-3 text-sm font-bold uppercase text-slate-400">Payment Methods Summary</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {['CASH', 'NHIS', 'PRIVATE_INSURANCE', 'CREDIT', 'MOBILE_MONEY'].map((method) => {
            const methodInvoices = invoices.filter((i) => i.paymentMethod === method);
            const methodTotal = methodInvoices.reduce((s, i) => s + i.paidAmount, 0);
            return (
              <div key={method} className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-800">
                <p className="text-xs font-bold uppercase text-slate-400">{method.replace(/_/g, ' ')}</p>
                <p className="text-lg font-bold text-g-ink dark:text-white">GH₵ {methodTotal.toFixed(0)}</p>
                <p className="text-xs text-slate-400">{methodInvoices.length} invoice(s)</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
