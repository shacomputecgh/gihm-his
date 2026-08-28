import { useState } from 'react';
import { Card, Badge, Button, Select } from '../ui';
import { DRUG_DATABASE, getLowStockDrugs, getExpiringDrugs, getControlledDrugs } from '../../lib/drugDatabase';

type ReportType = 'stock' | 'expiry' | 'consumption' | 'procurement' | 'financial' | 'controlled' | 'audit';

const REPORT_TYPES: { value: ReportType; label: string; icon: string; description: string }[] = [
  { value: 'stock', label: 'Stock Report', icon: '📦', description: 'Current stock levels, valuations, reorder alerts' },
  { value: 'expiry', label: 'Expiry Report', icon: '⏰', description: 'Drugs expiring within 30/60/90 days' },
  { value: 'consumption', label: 'Consumption Report', icon: '📊', description: 'Drug usage by category, ward, prescriber' },
  { value: 'procurement', label: 'Procurement Report', icon: '🛒', description: 'Purchase orders, supplier performance' },
  { value: 'financial', label: 'Financial Report', icon: '💰', description: 'Revenue, costs, margins, payment methods' },
  { value: 'controlled', label: 'Controlled Drug Report', icon: '🔒', description: 'Schedule I–IV reconciliation and audit' },
  { value: 'audit', label: 'Audit Trail', icon: '📝', description: 'Complete activity log with timestamps' },
];

export default function PharmacyReports() {
  const [report, setReport] = useState<ReportType>('stock');
  const [period, setPeriod] = useState('month');

  const lowStock = getLowStockDrugs();
  const expiring30 = getExpiringDrugs(30);
  const expiring90 = getExpiringDrugs(90);
  const controlled = getControlledDrugs();
  const totalStockValue = DRUG_DATABASE.reduce((s, d) => s + d.currentStockValue, 0);
  const totalStockQty = DRUG_DATABASE.reduce((s, d) => s + d.availableQuantity, 0);
  const categoryMap = (() => {
    const m: Record<string, { count: number; value: number }> = {};
    for (const d of DRUG_DATABASE) {
      if (!m[d.category]) m[d.category] = { count: 0, value: 0 };
      const entry = m[d.category]!;
      entry.count++;
      entry.value += d.currentStockValue;
    }
    return Object.entries(m).sort((a, b) => b[1].value - a[1].value);
  })();

  return (
    <div className="space-y-6">
      {/* Report Selector */}
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-wrap gap-2 flex-1">
            {REPORT_TYPES.map((r) => (
              <button key={r.value} onClick={() => setReport(r.value)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  report === r.value ? 'bg-g-green text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}>{r.icon} {r.label}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </Select>
            <Button variant="green">📥 Export PDF</Button>
          </div>
        </div>
      </Card>

      {/* Stock Report */}
      {report === 'stock' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card><p className="text-xs font-bold uppercase text-slate-400">Total Items</p><p className="text-2xl font-bold text-g-ink dark:text-white">{DRUG_DATABASE.length}</p></Card>
            <Card><p className="text-xs font-bold uppercase text-slate-400">Total Quantity</p><p className="text-2xl font-bold text-g-ink dark:text-white">{totalStockQty.toLocaleString()}</p></Card>
            <Card><p className="text-xs font-bold uppercase text-slate-400">Total Value</p><p className="text-2xl font-bold text-green-600">GH₵ {totalStockValue.toLocaleString()}</p></Card>
            <Card><p className="text-xs font-bold uppercase text-slate-400">Low Stock Items</p><p className="text-2xl font-bold text-red-600">{lowStock.length}</p></Card>
          </div>
          <Card>
            <h3 className="mb-3 text-sm font-bold uppercase text-slate-400">Stock by Category</h3>
            <div className="space-y-2">
              {categoryMap.map(([cat, data]) => (
                <div key={cat} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5 dark:bg-slate-800">
                  <span className="text-sm font-medium text-g-ink dark:text-white">{cat}</span>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>{data.count} drugs</span>
                    <span className="font-bold text-green-600">GH₵ {data.value.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          {lowStock.length > 0 && (
            <Card>
              <h3 className="mb-3 text-sm font-bold uppercase text-red-600">⚠️ Low Stock Items — Reorder Required</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead><tr className="border-b border-slate-100 text-xs uppercase text-slate-400 dark:border-slate-700">
                    {['Drug', 'Current Stock', 'Reorder Level', 'Deficit', 'Value'].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {lowStock.map((d) => (
                      <tr key={d.id} className="bg-red-50/50 dark:bg-red-900/10">
                        <td className="px-3 py-2"><p className="font-medium">{d.brandName} {d.strength}</p><p className="text-xs text-slate-400">{d.genericName}</p></td>
                        <td className="px-3 py-2 font-bold text-red-600">{d.availableQuantity.toLocaleString()}</td>
                        <td className="px-3 py-2 text-slate-500">{d.reorderLevel.toLocaleString()}</td>
                        <td className="px-3 py-2 font-bold text-red-600">{(d.reorderLevel - d.availableQuantity).toLocaleString()}</td>
                        <td className="px-3 py-2 text-slate-500">GH₵ {d.currentStockValue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Expiry Report */}
      {report === 'expiry' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Card><p className="text-xs font-bold uppercase text-slate-400">Expiring in 30 days</p><p className="text-2xl font-bold text-red-600">{expiring30.length}</p></Card>
            <Card><p className="text-xs font-bold uppercase text-slate-400">Expiring in 60 days</p><p className="text-2xl font-bold text-amber-600">{getExpiringDrugs(60).length}</p></Card>
            <Card><p className="text-xs font-bold uppercase text-slate-400">Expiring in 90 days</p><p className="text-2xl font-bold text-gold">{expiring90.length}</p></Card>
          </div>
          <Card>
            <h3 className="mb-3 text-sm font-bold uppercase text-red-600">⏰ Expiring Soon — Action Required</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-slate-100 text-xs uppercase text-slate-400 dark:border-slate-700">
                  {['Drug', 'Batch', 'Expiry Date', 'Days Left', 'Stock', 'Value'].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {expiring90.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()).map((d) => {
                    const days = Math.ceil((new Date(d.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    return (
                      <tr key={d.id} className={days <= 30 ? 'bg-red-50 dark:bg-red-900/10' : 'bg-amber-50/50 dark:bg-amber-900/10'}>
                        <td className="px-3 py-2"><p className="font-medium">{d.brandName} {d.strength}</p></td>
                        <td className="px-3 py-2 font-mono text-xs">{d.batchNumber}</td>
                        <td className="px-3 py-2 text-sm">{d.expiryDate}</td>
                        <td className="px-3 py-2"><Badge tone={days <= 30 ? 'red' : 'gold'}>{days} days</Badge></td>
                        <td className="px-3 py-2 tabular-nums">{d.availableQuantity.toLocaleString()}</td>
                        <td className="px-3 py-2 tabular-nums">GH₵ {d.currentStockValue.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Consumption Report */}
      {report === 'consumption' && (
        <Card>
          <h3 className="mb-3 text-sm font-bold uppercase text-slate-400">Drug Consumption Summary — {period}</h3>
          <div className="space-y-2">
            {[
              { name: 'Paracetamol 500mg', consumed: 2400, category: 'Analgesics' },
              { name: 'Amoxicillin 500mg', consumed: 1800, category: 'Antibiotics' },
              { name: 'Coartem 20/120mg', consumed: 1500, category: 'Antimalarials' },
              { name: 'Metformin 500mg', consumed: 1200, category: 'Antidiabetics' },
              { name: 'ORS Salts', consumed: 1100, category: 'Gastrointestinal' },
              { name: 'Omeprazole 20mg', consumed: 900, category: 'Gastrointestinal' },
              { name: 'Amlodipine 5mg', consumed: 850, category: 'Cardiovascular' },
              { name: 'Ciprofloxacin 500mg', consumed: 700, category: 'Antibiotics' },
              { name: 'Cetirizine 10mg', consumed: 650, category: 'Antihistamines' },
              { name: 'Salbutamol Inhaler', consumed: 400, category: 'Respiratory' },
            ].sort((a, b) => b.consumed - a.consumed).map((d, i) => (
              <div key={d.name} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5 dark:bg-slate-800">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center text-xs font-bold text-slate-400">#{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-g-ink dark:text-white">{d.name}</p>
                    <p className="text-xs text-slate-400">{d.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="tabular-nums font-bold text-g-ink dark:text-white">{d.consumed.toLocaleString()} units</p>
                  <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div className="h-full rounded-full bg-g-green" style={{ width: `${(d.consumed / 2400) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Financial Report */}
      {report === 'financial' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card><p className="text-xs font-bold uppercase text-slate-400">Total Sales</p><p className="text-2xl font-bold text-green-600">GH₵ 47,350</p></Card>
            <Card><p className="text-xs font-bold uppercase text-slate-400">Total Cost</p><p className="text-2xl font-bold text-red-600">GH₵ 28,410</p></Card>
            <Card><p className="text-xs font-bold uppercase text-slate-400">Gross Margin</p><p className="text-2xl font-bold text-g-green">GH₵ 18,940</p></Card>
            <Card><p className="text-xs font-bold uppercase text-slate-400">Margin %</p><p className="text-2xl font-bold text-g-ink dark:text-white">40.0%</p></Card>
          </div>
          <Card>
            <h3 className="mb-3 text-sm font-bold uppercase text-slate-400">Revenue by Payment Method</h3>
            <div className="space-y-2">
              {[
                { method: 'Cash', amount: 18500, pct: 39.1 },
                { method: 'NHIS', amount: 12800, pct: 27.0 },
                { method: 'Private Insurance', amount: 8200, pct: 17.3 },
                { method: 'Mobile Money', amount: 4850, pct: 10.2 },
                { method: 'Credit', amount: 3000, pct: 6.3 },
              ].map((m) => (
                <div key={m.method} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5 dark:bg-slate-800">
                  <span className="text-sm font-medium text-g-ink dark:text-white">{m.method}</span>
                  <div className="flex items-center gap-4">
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div className="h-full rounded-full bg-g-green" style={{ width: `${m.pct}%` }} />
                    </div>
                    <span className="w-16 text-right text-sm font-bold text-g-ink dark:text-white">GH₵ {m.amount.toLocaleString()}</span>
                    <span className="w-12 text-right text-xs text-slate-400">{m.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Controlled Drug Report */}
      {report === 'controlled' && (
        <Card>
          <h3 className="mb-3 text-sm font-bold uppercase text-slate-400">Controlled Drug Stock & Reconciliation</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-slate-100 text-xs uppercase text-slate-400 dark:border-slate-700">
                {['Drug', 'Schedule', 'Opening', 'Received', 'Issued', 'Closing', 'Physical Count', 'Variance'].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {controlled.map((d) => {
                  const opening = d.availableQuantity + 20;
                  const received = 30;
                  const issued = 10;
                  const closing = opening + received - issued;
                  const physical = closing;
                  const variance = physical - closing;
                  return (
                    <tr key={d.id}>
                      <td className="px-3 py-2"><p className="font-medium">{d.brandName} {d.strength}</p></td>
                      <td className="px-3 py-2"><Badge tone={d.controlledStatus.includes('I') || d.controlledStatus.includes('II') ? 'red' : 'gold'}>{d.controlledStatus}</Badge></td>
                      <td className="px-3 py-2 tabular-nums">{opening}</td>
                      <td className="px-3 py-2 tabular-nums text-green-600">+{received}</td>
                      <td className="px-3 py-2 tabular-nums text-red-600">-{issued}</td>
                      <td className="px-3 py-2 tabular-nums font-bold">{closing}</td>
                      <td className="px-3 py-2 tabular-nums">{physical}</td>
                      <td className="px-3 py-2">
                        <Badge tone={variance === 0 ? 'green' : 'red'}>{variance === 0 ? 'OK' : `${variance > 0 ? '+' : ''}${variance}`}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Audit Trail */}
      {report === 'audit' && (
        <Card>
          <h3 className="mb-3 text-sm font-bold uppercase text-slate-400">Pharmacy Audit Trail</h3>
          <div className="space-y-2">
            {[
              { time: '2026-08-22 14:30', user: 'Pharm. Osei', action: 'DISPENSED', detail: 'Amoxicillin 500mg × 21 → Patient Ama Mensah (RX-001)', ip: '192.168.1.105' },
              { time: '2026-08-22 14:15', user: 'Pharm. Mensah', action: 'CREATED', detail: 'Purchase Order PO-2026-004 for Pharma Access Ghana', ip: '192.168.1.106' },
              { time: '2026-08-22 13:45', user: 'Pharm. Osei', action: 'ISSUED', detail: 'Morphine 10mg/ml × 5 → Patient Yaw Boateng (Controlled)', ip: '192.168.1.105' },
              { time: '2026-08-22 12:00', user: 'System', action: 'ALERT', detail: 'Low stock alert: Insulin Human below reorder level', ip: 'System' },
              { time: '2026-08-22 11:30', user: 'Cashier Ama', action: 'PAYMENT', detail: 'INV-2026-002 — GH₵ 11.60 NHIS co-payment received', ip: '192.168.1.110' },
              { time: '2026-08-22 10:00', user: 'System', action: 'EXPIRY', detail: '12 drugs flagged for expiry within 90 days', ip: 'System' },
              { time: '2026-08-22 09:15', user: 'Pharm. Mensah', action: 'TRANSFERRED', detail: 'Coartem × 200 transferred from Central Store to OPD', ip: '192.168.1.106' },
              { time: '2026-08-21 17:00', user: 'Pharm. Osei', action: 'RECONCILED', detail: 'Monthly controlled drug reconciliation — all accounted', ip: '192.168.1.105' },
            ].map((entry, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg bg-slate-50 px-4 py-2.5 dark:bg-slate-800">
                <Badge tone={
                  entry.action === 'DISPENSED' ? 'green' :
                  entry.action === 'ISSUED' ? 'navy' :
                  entry.action === 'ALERT' || entry.action === 'EXPIRY' ? 'red' :
                  entry.action === 'PAYMENT' ? 'blue' : 'gold'
                }>{entry.action}</Badge>
                <div className="flex-1">
                  <p className="text-sm text-g-ink dark:text-white">{entry.detail}</p>
                  <p className="text-xs text-slate-400">{entry.time} · {entry.user} · IP: {entry.ip}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
