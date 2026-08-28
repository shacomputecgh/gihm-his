import { useState } from 'react';
import { Card, Badge, Button, StatCard } from '../ui';

interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  rating: number;
  active: boolean;
}

interface PurchaseOrder {
  id: string;
  supplier: string;
  items: { drugName: string; strength: string; qty: number; unitPrice: number }[];
  totalValue: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'SHIPPED' | 'RECEIVED' | 'CANCELLED';
  createdBy: string;
  createdAt: string;
  expectedDelivery: string;
  receivedDate?: string;
}

const SAMPLE_SUPPLIERS: Supplier[] = [
  { id: 'SUP-001', name: 'Ernest Chemists Ltd', contact: 'Kwadwo Ernest', phone: '+233-302-123456', email: 'orders@ernestchemists.com', address: 'P.O. Box 1455, Accra', rating: 4.5, active: true },
  { id: 'SUP-002', name: 'Kinapharma Ltd', contact: 'Nana Kinap', phone: '+233-302-234567', email: 'sales@kinapharma.com', address: 'Tema Industrial Area', rating: 4.2, active: true },
  { id: 'SUP-003', name: 'Pharma Access Ghana', contact: 'Ama Access', phone: '+233-302-345678', email: 'orders@pharmaaccess.gh', address: 'Osu, Accra', rating: 4.0, active: true },
  { id: 'SUP-004', name: 'Medipharm Ghana Ltd', contact: 'Kofi Medi', phone: '+233-302-456789', email: 'supply@medipharm.com', address: 'Ring Road, Kumasi', rating: 3.8, active: true },
  { id: 'SUP-005', name: 'Transmed (Ghana) Ltd', contact: 'Yaw Trans', phone: '+233-302-567890', email: 'orders@transmed.gh', address: 'Spintex Road, Accra', rating: 4.3, active: true },
  { id: 'SUP-006', name: 'Phyto Riker Ghana Ltd', contact: 'Abena Phyto', phone: '+233-302-678901', email: 'sales@phytoriker.com', address: 'Tema', rating: 3.9, active: false },
];

const SAMPLE_POS: PurchaseOrder[] = [
  { id: 'PO-2026-001', supplier: 'Ernest Chemists Ltd', items: [{ drugName: 'Amoxicillin 500mg Caps', strength: '500mg', qty: 10000, unitPrice: 0.25 }, { drugName: 'Paracetamol 500mg Tab', strength: '500mg', qty: 20000, unitPrice: 0.15 }], totalValue: 5500, status: 'RECEIVED', createdBy: 'Pharm. Osei', createdAt: '2026-08-10', expectedDelivery: '2026-08-15', receivedDate: '2026-08-14' },
  { id: 'PO-2026-002', supplier: 'Kinapharma Ltd', items: [{ drugName: 'Coartem 20/120mg', strength: '20/120mg', qty: 5000, unitPrice: 1.50 }, { drugName: 'ORS Salts', strength: 'Sachet', qty: 10000, unitPrice: 0.10 }], totalValue: 8500, status: 'APPROVED', createdBy: 'Pharm. Mensah', createdAt: '2026-08-18', expectedDelivery: '2026-08-25' },
  { id: 'PO-2026-003', supplier: 'Transmed (Ghana) Ltd', items: [{ drugName: 'Insulin Human 100IU', strength: '100IU/ml', qty: 100, unitPrice: 8.00 }, { drugName: 'Ceftriaxone 1g', strength: '1g', qty: 200, unitPrice: 3.00 }], totalValue: 1400, status: 'SUBMITTED', createdBy: 'Pharm. Osei', createdAt: '2026-08-21', expectedDelivery: '2026-08-28' },
  { id: 'PO-2026-004', supplier: 'Pharma Access Ghana', items: [{ drugName: 'Amlodipine 5mg', strength: '5mg', qty: 5000, unitPrice: 0.40 }], totalValue: 2000, status: 'DRAFT', createdBy: 'Pharm. Mensah', createdAt: '2026-08-22', expectedDelivery: '2026-09-01' },
];

const PO_STATUS_COLORS: Record<string, 'gray' | 'blue' | 'gold' | 'navy' | 'green' | 'red'> = {
  DRAFT: 'gray', SUBMITTED: 'blue', APPROVED: 'gold', SHIPPED: 'navy', RECEIVED: 'green', CANCELLED: 'red',
};

export default function PharmacyProcurement() {
  const [tab, setTab] = useState<'pos' | 'suppliers' | 'goods'>('pos');
  const [suppliers] = useState(SAMPLE_SUPPLIERS);
  const [pos] = useState(SAMPLE_POS);
  const [showNewPO, setShowNewPO] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  const stats = {
    totalPOValue: pos.reduce((s, p) => s + p.totalValue, 0),
    pendingPOs: pos.filter((p) => p.status !== 'RECEIVED' && p.status !== 'CANCELLED').length,
    activeSuppliers: suppliers.filter((s) => s.active).length,
    receivedThisMonth: pos.filter((p) => p.status === 'RECEIVED').length,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total PO Value" value={`GH₵ ${stats.totalPOValue.toLocaleString()}`} tone="green" icon="pill" />
        <StatCard label="Pending Orders" value={stats.pendingPOs} tone="gold" icon="clock" />
        <StatCard label="Active Suppliers" value={stats.activeSuppliers} tone="blue" icon="users" />
        <StatCard label="Received This Month" value={stats.receivedThisMonth} tone="green" icon="check" />
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
        {(['pos', 'suppliers', 'goods'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
              tab === t ? 'bg-white text-g-ink shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700'
            }`}>{t === 'pos' ? 'Purchase Orders' : t === 'suppliers' ? 'Suppliers' : 'Goods Received'}</button>
        ))}
      </div>

      {/* Purchase Orders */}
      {tab === 'pos' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="green" onClick={() => setShowNewPO(!showNewPO)}>{showNewPO ? '✕ Cancel' : '+ New Purchase Order'}</Button>
          </div>
          <Card pad={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase text-slate-400 dark:border-slate-700">
                    {['PO ID', 'Supplier', 'Items', 'Value (GH₵)', 'Status', 'Created', 'Expected', ''].map((h) => (
                      <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {pos.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-g-green">{po.id}</td>
                      <td className="px-4 py-3 text-sm text-g-ink dark:text-white">{po.supplier}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{po.items.length} drug(s)</td>
                      <td className="px-4 py-3 tabular-nums text-sm font-medium text-g-ink dark:text-white">GH₵ {po.totalValue.toLocaleString()}</td>
                      <td className="px-4 py-3"><Badge tone={PO_STATUS_COLORS[po.status]}>{po.status}</Badge></td>
                      <td className="px-4 py-3 text-xs text-slate-500">{po.createdAt}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{po.expectedDelivery}</td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="outline" onClick={() => setSelectedPO(po)}>View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Suppliers */}
      {tab === 'suppliers' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((s) => (
            <Card key={s.id}>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-g-ink dark:text-white">{s.name}</h4>
                  <p className="text-xs text-slate-400">{s.contact}</p>
                </div>
                <Badge tone={s.active ? 'green' : 'gray'}>{s.active ? 'Active' : 'Inactive'}</Badge>
              </div>
              <div className="mt-3 space-y-1 text-xs text-slate-500">
                <p>📞 {s.phone}</p>
                <p>✉️ {s.email}</p>
                <p>📍 {s.address}</p>
              </div>
              <div className="mt-3 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={`text-sm ${i < Math.round(s.rating) ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
                ))}
                <span className="ml-1 text-xs text-slate-400">{s.rating}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Goods Received */}
      {tab === 'goods' && (
        <Card>
          <h3 className="mb-3 text-sm font-bold uppercase text-slate-400">Recent Goods Received Notes</h3>
          <div className="space-y-3">
            {[
              { id: 'GRN-001', poId: 'PO-2026-001', supplier: 'Ernest Chemists Ltd', items: 2, receivedBy: 'Store Keeper', date: '2026-08-14', verified: true },
              { id: 'GRN-002', poId: 'PO-2026-005', supplier: 'Kinapharma Ltd', items: 1, receivedBy: 'Pharm. Mensah', date: '2026-08-18', verified: true },
            ].map((g) => (
              <div key={g.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-800">
                <div>
                  <p className="font-mono text-xs font-bold text-g-green">{g.id}</p>
                  <p className="text-sm font-medium text-g-ink dark:text-white">{g.supplier}</p>
                  <p className="text-xs text-slate-400">PO: {g.poId} · {g.items} item(s) · Received: {g.date}</p>
                </div>
                <Badge tone={g.verified ? 'green' : 'gold'}>{g.verified ? 'Verified' : 'Pending Verification'}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* PO Detail Modal */}
      {selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedPO(null)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
              <h3 className="text-lg font-bold text-g-ink dark:text-white">{selectedPO.id}</h3>
              <button onClick={() => setSelectedPO(null)} className="text-slate-400">✕</button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs font-bold uppercase text-slate-400">Supplier</p><p className="text-g-ink dark:text-white">{selectedPO.supplier}</p></div>
                <div><p className="text-xs font-bold uppercase text-slate-400">Status</p><Badge tone={PO_STATUS_COLORS[selectedPO.status]}>{selectedPO.status}</Badge></div>
                <div><p className="text-xs font-bold uppercase text-slate-400">Created</p><p className="text-g-ink dark:text-white">{selectedPO.createdAt}</p></div>
                <div><p className="text-xs font-bold uppercase text-slate-400">Expected</p><p className="text-g-ink dark:text-white">{selectedPO.expectedDelivery}</p></div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-slate-400 mb-2">Order Items</p>
                <div className="space-y-2">
                  {selectedPO.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                      <div>
                        <p className="font-medium text-g-ink dark:text-white">{item.drugName} {item.strength}</p>
                        <p className="text-xs text-slate-400">Qty: {item.qty.toLocaleString()} × GH₵ {item.unitPrice}</p>
                      </div>
                      <p className="font-bold text-g-ink dark:text-white">GH₵ {(item.qty * item.unitPrice).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-end">
                  <p className="text-sm font-bold text-g-ink dark:text-white">Total: GH₵ {selectedPO.totalValue.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setSelectedPO(null)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
