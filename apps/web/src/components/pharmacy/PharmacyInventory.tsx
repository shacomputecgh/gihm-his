import { useState } from 'react';
import { Card, Badge, Button, EmptyState, Input, Select, Field, StatCard } from '../ui';
import { DRUG_DATABASE, getLowStockDrugs, getExpiringDrugs } from '../../lib/drugDatabase';
import type { Drug } from '../../lib/drugDatabase';

type ViewMode = 'all' | 'lowStock' | 'expiring' | 'controlled' | 'outOfStock';

interface StockMovement {
  id: string;
  drugId: string;
  drugName: string;
  type: 'RECEIVED' | 'DISPENSED' | 'TRANSFERRED' | 'ADJUSTED' | 'RETURNED' | 'EXPIRED' | 'DAMAGED';
  quantity: number;
  batchNumber: string;
  fromTo: string;
  performedBy: string;
  date: string;
  notes: string;
}

const MOVEMENTS: Array<{ id: string; drugId: string; drugName: string; type: StockMovement['type']; quantity: number; batchNumber: string; date: string }> = [
  { id: 'MOV-001', drugId: 'DRG-001', drugName: 'Paracetamol 500mg', type: 'RECEIVED', quantity: 5000, batchNumber: 'BAT-2024-001', date: '2026-08-20' },
  { id: 'MOV-002', drugId: 'DRG-010', drugName: 'Amoxicillin 500mg', type: 'DISPENSED', quantity: 120, batchNumber: 'BAT-2024-010', date: '2026-08-22' },
  { id: 'MOV-003', drugId: 'DRG-005', drugName: 'Morphine 10mg/ml', type: 'DISPENSED', quantity: 5, batchNumber: 'BAT-2024-005', date: '2026-08-22' },
  { id: 'MOV-004', drugId: 'DRG-030', drugName: 'Coartem 20/120mg', type: 'TRANSFERRED', quantity: 200, batchNumber: 'BAT-2024-030', date: '2026-08-21' },
  { id: 'MOV-005', drugId: 'DRG-063', drugName: 'Loperamide 2mg', type: 'EXPIRED', quantity: 50, batchNumber: 'BAT-2024-063', date: '2026-08-19' },
  { id: 'MOV-006', drugId: 'DRG-052', drugName: 'Insulin Human 100IU', type: 'RECEIVED', quantity: 50, batchNumber: 'BAT-2024-052', date: '2026-08-18' },
  { id: 'MOV-007', drugId: 'DRG-015', drugName: 'Ceftriaxone 1g', type: 'DAMAGED', quantity: 10, batchNumber: 'BAT-2024-015', date: '2026-08-17' },
];

const MOVEMENT_COLORS: Record<string, 'green' | 'red' | 'blue' | 'gold' | 'gray' | 'navy'> = {
  RECEIVED: 'green', DISPENSED: 'blue', TRANSFERRED: 'navy', ADJUSTED: 'gold', RETURNED: 'gold', EXPIRED: 'red', DAMAGED: 'red',
};

export default function PharmacyInventory() {
  const [view, setView] = useState<ViewMode>('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showMovements, setShowMovements] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustDrug, setAdjustDrug] = useState<Drug | null>(null);

  let drugs = DRUG_DATABASE;
  if (view === 'lowStock') drugs = getLowStockDrugs();
  else if (view === 'expiring') drugs = getExpiringDrugs(90);
  else if (view === 'controlled') drugs = drugs.filter((d) => d.controlledStatus !== 'None');
  else if (view === 'outOfStock') drugs = drugs.filter((d) => d.availableQuantity === 0);

  if (search) {
    const q = search.toLowerCase();
    drugs = drugs.filter((d) => d.genericName.toLowerCase().includes(q) || d.brandName.toLowerCase().includes(q) || d.id.toLowerCase().includes(q));
  }
  if (categoryFilter) {
    drugs = drugs.filter((d) => d.category === categoryFilter);
  }

  const totalValue = drugs.reduce((sum, d) => sum + d.currentStockValue, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Items" value={DRUG_DATABASE.length} tone="blue" icon="pill" />
        <StatCard label="Total Stock Value" value={`GH₵ ${totalValue.toLocaleString()}`} tone="green" icon="pill" />
        <StatCard label="Low Stock" value={getLowStockDrugs().length} tone="red" icon="alert" />
        <StatCard label="Expiring (90d)" value={getExpiringDrugs(90).length} tone="gold" icon="clock" />
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <Field label="Search drugs">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Drug name, ID…" />
            </Field>
          </div>
          <Field label="Category">
            <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All categories</option>
              {[...new Set(DRUG_DATABASE.map((d) => d.category))].sort().map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <div className="flex gap-1">
            {([
              { v: 'all' as ViewMode, l: 'All' },
              { v: 'lowStock' as ViewMode, l: 'Low Stock' },
              { v: 'expiring' as ViewMode, l: 'Expiring' },
              { v: 'controlled' as ViewMode, l: 'Controlled' },
              { v: 'outOfStock' as ViewMode, l: 'Out of Stock' },
            ]).map(({ v, l }) => (
              <button key={v} onClick={() => setView(v)}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  view === v ? 'bg-g-green text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}>{l}</button>
            ))}
          </div>
          <Button variant="outline" onClick={() => setShowMovements(!showMovements)}>Stock Movements</Button>
        </div>
      </Card>

      {/* Stock Movements */}
      {showMovements && (
        <Card>
          <h3 className="mb-3 text-sm font-bold uppercase text-slate-400">Recent Stock Movements</h3>
          <div className="space-y-2">
            {MOVEMENTS.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5 dark:bg-slate-800">
                <div className="flex items-center gap-3">
                  <Badge tone={MOVEMENT_COLORS[m.type]}>{m.type}</Badge>
                  <div>
                    <p className="text-sm font-medium text-g-ink dark:text-white">{m.drugName}</p>
                    <p className="text-xs text-slate-400">Batch: {m.batchNumber} · {m.date}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${m.type === 'DISPENSED' || m.type === 'EXPIRED' || m.type === 'DAMAGED' ? 'text-red-600' : 'text-green-600'}`}>
                  {m.type === 'DISPENSED' || m.type === 'EXPIRED' || m.type === 'DAMAGED' ? '-' : '+'}{m.quantity}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Inventory Table */}
      {drugs.length === 0 ? (
        <EmptyState icon="pill" title="No drugs found" message="Adjust your search or filters." />
      ) : (
        <Card pad={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase text-slate-400 dark:border-slate-700">
                  {['Drug', 'Category', 'Batch', 'Expiry', 'Stock', 'Reorder', 'Value (GH₵)', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {drugs.slice(0, 100).map((d) => {
                  const isLow = d.availableQuantity <= d.reorderLevel;
                  const isOut = d.availableQuantity === 0;
                  const expDate = new Date(d.expiryDate);
                  const daysToExpiry = Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const isExpiring = daysToExpiry <= 90 && daysToExpiry > 0;
                  const isExpired = daysToExpiry <= 0;

                  return (
                    <tr key={d.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 ${isExpired ? 'bg-red-50 dark:bg-red-900/10' : isLow ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-g-ink dark:text-white">{d.brandName} {d.strength}</p>
                        <p className="text-xs text-slate-400">{d.genericName} · {d.dosageForm}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{d.category}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{d.batchNumber}</td>
                      <td className="px-4 py-3 text-xs">
                        <span className={isExpired ? 'font-bold text-red-600' : isExpiring ? 'font-bold text-amber-600' : 'text-slate-500'}>
                          {d.expiryDate}
                          {isExpired && ' (EXPIRED)'}
                          {isExpiring && ` (${daysToExpiry}d)`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`tabular-nums font-bold ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-green-600'}`}>
                          {d.availableQuantity.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{d.reorderLevel.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs tabular-nums text-slate-500">{d.currentStockValue.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {isOut && <Badge tone="red">OUT</Badge>}
                          {isLow && !isOut && <Badge tone="gold">LOW</Badge>}
                          {isExpired && <Badge tone="red">EXPIRED</Badge>}
                          {isExpiring && !isExpired && <Badge tone="gold">EXPIRING</Badge>}
                          {d.controlledStatus !== 'None' && <Badge tone="navy">{d.controlledStatus}</Badge>}
                          {d.prescriptionOnly && <Badge tone="blue">Rx</Badge>}
                          {!isOut && !isLow && !isExpired && !isExpiring && <Badge tone="green">OK</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="outline" onClick={() => { setAdjustDrug(d); setShowAdjust(true); }}>Adjust</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400 dark:border-slate-700">
            Showing {Math.min(drugs.length, 100)} of {drugs.length} items · Total value: GH₵ {totalValue.toLocaleString()}
          </div>
        </Card>
      )}

      {/* Adjust Stock Modal */}
      {showAdjust && adjustDrug && (
        <AdjustStockModal drug={adjustDrug} onClose={() => { setShowAdjust(false); setAdjustDrug(null); }} />
      )}
    </div>
  );
}

function AdjustStockModal({ drug, onClose }: { drug: Drug; onClose: () => void }) {
  const [type, setType] = useState<string>('ADJUSTED');
  const [qty, setQty] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(true);
    setTimeout(onClose, 1200);
  }

  if (saved) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="rounded-xl bg-white p-8 text-center shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <p className="text-4xl">✅</p>
        <p className="mt-2 text-lg font-bold text-g-ink dark:text-white">Stock Adjusted</p>
        <p className="text-sm text-slate-500">{drug.brandName} {drug.strength} — {type}: {qty}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <h3 className="text-lg font-bold text-g-ink dark:text-white">Adjust Stock</h3>
          <p className="text-sm text-slate-500">{drug.brandName} {drug.strength} · Current: {drug.availableQuantity}</p>
        </div>
        <div className="space-y-4 p-6">
          <Field label="Movement Type">
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="RECEIVED">Received (stock in)</option>
              <option value="DISPENSED">Dispensed (stock out)</option>
              <option value="TRANSFERRED">Transferred</option>
              <option value="ADJUSTED">Adjusted (correction)</option>
              <option value="RETURNED">Returned from ward</option>
              <option value="EXPIRED">Expired (write off)</option>
              <option value="DAMAGED">Damaged (write off)</option>
            </Select>
          </Field>
          <Field label="Quantity">
            <Input type="number" value={String(qty)} onChange={(e) => setQty(Number(e.target.value))} />
          </Field>
          <Field label="Reason / Notes">
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for adjustment" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button variant="green" onClick={save}>Save Adjustment</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
