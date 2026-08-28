import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Badge } from '../../components/ui';

interface Tender {
  id: string; title: string; category: string; estimatedValue: number;
  publishDate: string; closingDate: string;
  status: 'Open' | 'Under Evaluation' | 'Awarded' | 'Cancelled';
  bidsReceived: number; evaluationScore?: number;
}

const TENDERS: Tender[] = [
  { id: 'TN-001', title: 'Medical Oxygen Plant Supply & Installation', category: 'Equipment', estimatedValue: 1200000, publishDate: '2026-08-01', closingDate: '2026-08-31', status: 'Open', bidsReceived: 8 },
  { id: 'TN-002', title: 'Pharmaceutical Supplies — 2026/27', category: 'Pharmacy', estimatedValue: 3500000, publishDate: '2026-07-15', closingDate: '2026-08-15', status: 'Under Evaluation', bidsReceived: 12 },
  { id: 'TN-003', title: 'CT Scanner Procurement', category: 'Equipment', estimatedValue: 800000, publishDate: '2026-06-01', closingDate: '2026-07-01', status: 'Awarded', bidsReceived: 6, evaluationScore: 92 },
  { id: 'TN-004', title: 'Hospital Laundry Services', category: 'Services', estimatedValue: 150000, publishDate: '2026-08-10', closingDate: '2026-09-10', status: 'Open', bidsReceived: 4 },
  { id: 'TN-005', title: 'IT Network Infrastructure Upgrade', category: 'IT', estimatedValue: 350000, publishDate: '2026-07-20', closingDate: '2026-08-20', status: 'Under Evaluation', bidsReceived: 5 },
];

const STATUS_COLORS: Record<string, string> = { Open: 'bg-green-100 text-green-800', 'Under Evaluation': 'bg-yellow-100 text-yellow-800', Awarded: 'bg-blue-100 text-blue-800', Cancelled: 'bg-red-100 text-red-800' };

export default function ProcurementTendering() {
  const totalValue = TENDERS.reduce((s, t) => s + t.estimatedValue, 0);

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
      <div><h1 className="text-2xl font-bold">Procurement & Tendering</h1><p className="text-gray-500">Bid management, tender evaluation, vendor scoring, and contract management</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Active Tenders', value: TENDERS.filter(t => t.status === 'Open' || t.status === 'Under Evaluation').length, color: 'text-blue-600' }, { label: 'Total Value', value: `GH₵ ${(totalValue/1000000).toFixed(1)}M`, color: 'text-green-600' }, { label: 'Total Bids', value: TENDERS.reduce((s, t) => s + t.bidsReceived, 0), color: 'text-purple-600' }, { label: 'Awarded', value: TENDERS.filter(t => t.status === 'Awarded').length, color: 'text-orange-600' }].map((s, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
        ))}
      </div>

      <div className="space-y-3">
        {TENDERS.map(t => (
          <div key={t.id} className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span className="font-mono text-xs text-gray-500">{t.id}</span><span className="font-bold">{t.title}</span><Badge className="bg-gray-100 text-gray-800">{t.category}</Badge></div><Badge className={STATUS_COLORS[t.status]}>{t.status}</Badge></div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
              <div><span className="text-gray-500">Value:</span> <span className="font-bold text-green-600">GH₵ {t.estimatedValue.toLocaleString()}</span></div>
              <div><span className="text-gray-500">Published:</span> {t.publishDate}</div>
              <div><span className="text-gray-500">Closing:</span> {t.closingDate}</div>
              <div><span className="text-gray-500">Bids:</span> <span className="font-bold">{t.bidsReceived}</span></div>
              {t.evaluationScore && <div><span className="text-gray-500">Score:</span> <span className="font-bold text-blue-600">{t.evaluationScore}/100</span></div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
