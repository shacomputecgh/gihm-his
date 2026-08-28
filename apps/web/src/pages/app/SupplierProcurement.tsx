import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge, Button, Card, Input, PageHeader } from '../../components/ui';

type SupplierTab = 'suppliers' | 'orders' | 'goods-received' | 'analytics';

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  category: 'pharmaceutical' | 'medical-supplies' | 'equipment' | 'laboratory' | 'food' | 'other';
  rating: number;
  totalOrders: number;
  totalValue: number;
  status: 'active' | 'inactive' | 'preferred';
  lastOrder: string;
  paymentTerms: string;
}

interface PurchaseOrder {
  id: string;
  date: string;
  supplier: string;
  items: POItem[];
  totalAmount: number;
  status: 'draft' | 'pending-approval' | 'approved' | 'ordered' | 'partial' | 'received' | 'cancelled';
  requestedBy: string;
  approvedBy?: string;
  expectedDelivery: string;
  receivedDate?: string;
  notes?: string;
}

interface POItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  receivedQty: number;
  category: string;
}

const MOCK_SUPPLIERS: Supplier[] = [
  { id: 'SUP001', name: 'Ernest Chemists Ltd', contactPerson: 'Mr. Ernest', phone: '030-277-1234', email: 'orders@ernestchemists.com', address: 'Industrial Area, Accra', category: 'pharmaceutical', rating: 4.5, totalOrders: 48, totalValue: 285000, status: 'preferred', lastOrder: '2026-05-15', paymentTerms: 'Net 30' },
  { id: 'SUP002', name: 'Phyto-Riker Ltd', contactPerson: 'Dr. Kweku', phone: '030-283-5678', email: 'sales@phytoriker.com', address: 'Tema Industrial Area', category: 'pharmaceutical', rating: 4.2, totalOrders: 35, totalValue: 192000, status: 'active', lastOrder: '2026-05-10', paymentTerms: 'Net 30' },
  { id: 'SUP003', name: 'Interagu Ghana Ltd', contactPerson: 'Ms. Adjoa', phone: '020-123-4567', email: 'orders@interagu.com', address: 'Airport City, Accra', category: 'medical-supplies', rating: 4.0, totalOrders: 22, totalValue: 89000, status: 'active', lastOrder: '2026-04-28', paymentTerms: 'Net 15' },
  { id: 'SUP004', name: 'Becton Dickinson', contactPerson: 'Mr. Owusu', phone: '030-299-8765', email: 'ghana@bd.com', address: 'Cantonments, Accra', category: 'laboratory', rating: 4.8, totalOrders: 12, totalValue: 156000, status: 'preferred', lastOrder: '2026-05-01', paymentTerms: 'Net 45' },
  { id: 'SUP005', name: 'Ghana Hospital Supplies', contactPerson: 'Nana Agyemang', phone: '024-555-7890', email: 'info@ghs.com', address: 'Kaneshie, Accra', category: 'medical-supplies', rating: 3.8, totalOrders: 18, totalValue: 67000, status: 'active', lastOrder: '2026-05-20', paymentTerms: 'Cash on delivery' },
  { id: 'SUP006', name: 'MediLife Technologies', contactPerson: 'Dr. Fiifi', phone: '020-888-1234', email: 'sales@medilife.com', address: 'East Legon, Accra', category: 'equipment', rating: 4.3, totalOrders: 8, totalValue: 320000, status: 'active', lastOrder: '2026-03-15', paymentTerms: 'Net 60' },
];

const MOCK_ORDERS: PurchaseOrder[] = [
  { id: 'PO-2026-001', date: '2026-05-20', supplier: 'Ernest Chemists Ltd', items: [
    { name: 'Paracetamol 500mg', quantity: 5000, unitPrice: 0.5, total: 2500, receivedQty: 5000, category: 'Analgesics' },
    { name: 'Amoxicillin 500mg', quantity: 2000, unitPrice: 1.2, total: 2400, receivedQty: 2000, category: 'Antibiotics' },
    { name: 'Metformin 500mg', quantity: 3000, unitPrice: 0.8, total: 2400, receivedQty: 3000, category: 'Antidiabetics' },
    { name: 'Amlodipine 5mg', quantity: 2000, unitPrice: 1.5, total: 3000, receivedQty: 2000, category: 'Antihypertensives' },
  ], totalAmount: 10300, status: 'received', requestedBy: 'Pharmacy Manager', approvedBy: 'Hospital Admin', expectedDelivery: '2026-05-25', receivedDate: '2026-05-23' },
  { id: 'PO-2026-002', date: '2026-05-22', supplier: 'Interagu Ghana Ltd', items: [
    { name: 'Surgical Gloves (S)', quantity: 50, unitPrice: 25, total: 1250, receivedQty: 0, category: 'PPE' },
    { name: 'Surgical Gloves (M)', quantity: 100, unitPrice: 25, total: 2500, receivedQty: 0, category: 'PPE' },
    { name: 'Surgical Masks', quantity: 200, unitPrice: 3, total: 600, receivedQty: 0, category: 'PPE' },
    { name: 'IV Giving Sets', quantity: 100, unitPrice: 5, total: 500, receivedQty: 0, category: 'Disposables' },
  ], totalAmount: 4850, status: 'ordered', requestedBy: 'Nursing Manager', expectedDelivery: '2026-05-28' },
  { id: 'PO-2026-003', date: '2026-05-23', supplier: 'Becton Dickinson', items: [
    { name: 'Blood Collection Tubes (EDTA)', quantity: 500, unitPrice: 8, total: 4000, receivedQty: 0, category: 'Lab Supplies' },
    { name: 'Blood Collection Tubes (Plain)', quantity: 300, unitPrice: 7, total: 2100, receivedQty: 0, category: 'Lab Supplies' },
    { name: 'Syringes 5ml', quantity: 1000, unitPrice: 0.5, total: 500, receivedQty: 0, category: 'Disposables' },
  ], totalAmount: 6600, status: 'pending-approval', requestedBy: 'Lab Manager', expectedDelivery: '2026-06-05' },
  { id: 'PO-2026-004', date: '2026-05-18', supplier: 'Ghana Hospital Supplies', items: [
    { name: 'Examination Gloves', quantity: 100, unitPrice: 15, total: 1500, receivedQty: 100, category: 'PPE' },
    { name: 'Bandages (Roll)', quantity: 200, unitPrice: 2, total: 400, receivedQty: 150, category: 'Disposables' },
  ], totalAmount: 1900, status: 'partial', requestedBy: 'Store Manager', expectedDelivery: '2026-05-22' },
  { id: 'PO-2026-005', date: '2026-05-15', supplier: 'MediLife Technologies', items: [
    { name: 'Pulse Oximeter (Fingertip)', quantity: 5, unitPrice: 250, total: 1250, receivedQty: 5, category: 'Equipment' },
    { name: 'Digital Thermometer', quantity: 20, unitPrice: 35, total: 700, receivedQty: 20, category: 'Equipment' },
  ], totalAmount: 1950, status: 'received', requestedBy: 'Nursing Manager', approvedBy: 'Hospital Admin', expectedDelivery: '2026-05-18', receivedDate: '2026-05-17' },
];

export default function SupplierProcurement() {
  const [tab, setTab] = useState<SupplierTab>('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredOrders = MOCK_ORDERS.filter(o => {
    const matchSearch = o.supplier.toLowerCase().includes(searchTerm.toLowerCase()) || o.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    'pending-approval': 'bg-amber-100 text-amber-700',
    approved: 'bg-blue-100 text-blue-700',
    ordered: 'bg-purple-100 text-purple-700',
    partial: 'bg-orange-100 text-orange-700',
    received: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  const totalSpend = MOCK_ORDERS.reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingOrders = MOCK_ORDERS.filter(o => ['draft', 'pending-approval', 'ordered'].includes(o.status)).length;

  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);
  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">
          {showAdd ? "\u2715 Cancel" : "+ Add New"}
        </button>
      </div>
      {showAdd && (
        <AddNewForm
          title="Add New Inventory"
          fields={[{"name": "itemName", "label": "Item Name", "type": "text", "placeholder": "e.g. Paracetamol 500mg", "required": true}, {"name": "category", "label": "Category", "type": "select", "options": ["Medicine", "Equipment", "Supplies", "Reagent"]}, {"name": "quantity", "label": "Quantity", "type": "number", "placeholder": "0", "required": true}, {"name": "unit", "label": "Unit", "type": "select", "options": ["Tablets", "Capsules", "Vials", "Bottles", "Boxes", "Packs"]}, {"name": "expiryDate", "label": "Expiry Date", "type": "date"}, {"name": "location", "label": "Storage Location", "type": "text", "placeholder": "e.g. Pharmacy Store A"}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Supplier & Procurement" subtitle="Vendor management, purchase orders, goods receiving, and supply chain" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-blue-600">{MOCK_SUPPLIERS.length}</div><div className="text-xs text-slate-500">Suppliers</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-purple-600">{MOCK_ORDERS.length}</div><div className="text-xs text-slate-500">Purchase Orders</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-amber-600">{pendingOrders}</div><div className="text-xs text-slate-500">Pending</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">GH₵ {totalSpend.toLocaleString()}</div><div className="text-xs text-slate-500">Total Spend</div></Card>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['suppliers', 'orders', 'goods-received', 'analytics'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${tab === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {t === 'suppliers' ? '🏭 Suppliers' : t === 'orders' ? '📝 Orders' : t === 'goods-received' ? '📦 Received' : '📊 Analytics'}
          </button>
        ))}
      </div>

      {/* Suppliers Tab */}
      {tab === 'suppliers' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {MOCK_SUPPLIERS.map(s => (
            <Card key={s.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800">{s.name}</h3>
                    <Badge tone={s.status === 'preferred' ? 'green' : s.status === 'active' ? 'blue' : 'gray'}>{s.status.toUpperCase()}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">{s.contactPerson} · {s.phone} · {s.email}</div>
                  <div className="text-[10px] text-slate-400">{s.address}</div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span>⭐ {s.rating}/5</span>
                    <span>📦 {s.totalOrders} orders</span>
                    <span className="font-bold text-green-600">GH₵ {s.totalValue.toLocaleString()}</span>
                    <span>💳 {s.paymentTerms}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button className="bg-blue-600 hover:bg-blue-700 text-xs">📝 Create PO</Button>
                <Button className="bg-slate-100 text-slate-700 text-xs">📋 View History</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Orders Tab */}
      {tab === 'orders' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <Input placeholder="Search orders..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-md" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs">
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending-approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="ordered">Ordered</option>
              <option value="partial">Partial</option>
              <option value="received">Received</option>
            </select>
          </div>
          {filteredOrders.map(order => (
            <Card key={order.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800">{order.id}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColors[order.status] ?? ''}`}>{order.status.toUpperCase().replace('-', ' ')}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>🏭 {order.supplier}</span>
                    <span>📅 {order.date}</span>
                    <span>📦 {order.items.length} items</span>
                    <span className="font-bold text-green-600">GH₵ {order.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="mt-1 text-[10px] text-slate-400">
                    Requested by: {order.requestedBy} · Expected: {order.expectedDelivery}
                    {order.receivedDate && <span className="ml-2 text-green-600">· Received: {order.receivedDate}</span>}
                  </div>
                </div>
              </div>
              {/* Items Table */}
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead><tr className="border-b text-left text-slate-500">
                    <th className="p-1">Item</th><th className="p-1">Category</th><th className="p-1">Qty</th><th className="p-1">Price</th><th className="p-1">Total</th><th className="p-1">Received</th>
                  </tr></thead>
                  <tbody>
                    {order.items.map((item, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-1 font-medium">{item.name}</td><td className="p-1">{item.category}</td>
                        <td className="p-1">{item.quantity}</td><td className="p-1">GH₵ {item.unitPrice}</td>
                        <td className="p-1 font-bold">GH₵ {item.total}</td>
                        <td className="p-1"><span className={item.receivedQty === item.quantity ? 'text-green-600 font-bold' : item.receivedQty > 0 ? 'text-orange-600' : 'text-slate-400'}>{item.receivedQty}/{item.quantity}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 flex gap-2">
                {order.status === 'pending-approval' && <Button className="bg-green-600 hover:bg-green-700 text-xs">✅ Approve</Button>}
                {order.status === 'approved' && <Button className="bg-purple-600 hover:bg-purple-700 text-xs">📤 Send to Supplier</Button>}
                {order.status === 'ordered' && <Button className="bg-green-600 hover:bg-green-700 text-xs">📦 Receive Goods</Button>}
                <Button className="bg-slate-100 text-slate-700 text-xs">🖨️ Print PO</Button>
              </div>
            </Card>
          ))}
          <Button className="bg-blue-600 hover:bg-blue-700">➕ New Purchase Order</Button>
        </div>
      )}

      {/* Goods Received Tab */}
      {tab === 'goods-received' && (
        <div className="space-y-3">
          {MOCK_ORDERS.filter(o => o.status === 'received' || o.status === 'partial').map(order => (
            <Card key={order.id} className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-sm text-slate-800">{order.id}</h3>
                <Badge tone={order.status === 'received' ? 'green' : 'gold'}>{order.status.toUpperCase()}</Badge>
                <span className="text-xs text-slate-500">Received: {order.receivedDate}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {order.items.map((item, i) => (
                  <div key={i} className="rounded bg-slate-50 p-2 text-xs">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-slate-500">{item.receivedQty}/{item.quantity}</div>
                    <div className={item.receivedQty === item.quantity ? 'text-green-600 font-bold' : 'text-orange-600'}>
                      {item.receivedQty === item.quantity ? '✅ Complete' : '⚠️ Partial'}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <Button className="bg-blue-600 hover:bg-blue-700 text-xs">📋 Generate GRN</Button>
                <Button className="bg-slate-100 text-slate-700 text-xs">📦 Update Stock</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Analytics Tab */}
      {tab === 'analytics' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">🏭 Supplier Spend</h3>
            {MOCK_SUPPLIERS.sort((a, b) => b.totalValue - a.totalValue).map(s => {
              const pct = totalSpend > 0 ? (s.totalValue / totalSpend) * 100 : 0;
              return (
                <div key={s.id} className="mb-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">{s.name}</span>
                    <span className="font-bold">GH₵ {s.totalValue.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </Card>
          <Card className="p-4">
            <h3 className="font-bold text-sm text-slate-700 mb-3">📦 Order Status</h3>
            {Object.entries(statusColors).map(([status, cls]) => {
              const count = MOCK_ORDERS.filter(o => o.status === status).length;
              if (count === 0) return null;
              return (
                <div key={status} className="flex items-center justify-between py-1 border-b last:border-0">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cls}`}>{status.toUpperCase().replace('-', ' ')}</span>
                  <span className="text-sm font-bold text-slate-600">{count}</span>
                </div>
              );
            })}
          </Card>
        </div>
      )}
    </div>
  );
}
