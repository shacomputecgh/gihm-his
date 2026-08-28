import { useState } from 'react';
import { Badge, useToast } from '../../components/ui';

interface CrashCart {
  id: string; location: string; lastChecked: string; checkedBy: string;
  status: 'Ready' | 'Needs Restock' | 'In Use' | 'Maintenance';
  batteries: 'OK' | 'Low' | 'Dead'; seals: 'Intact' | 'Broken';
  items: { name: string; quantity: number; minQty: number; expiry: string }[];
}

const CARTS: CrashCart[] = [
  { id: 'CC-01', location: 'Emergency Department', lastChecked: '2026-08-23 06:00', checkedBy: 'Nurse Akua', status: 'Ready', batteries: 'OK', seals: 'Intact',
    items: [
      { name: 'Adrenaline 1:1000', quantity: 6, minQty: 4, expiry: '2027-06' },
      { name: 'Amiodarone 150mg', quantity: 4, minQty: 2, expiry: '2027-03' },
      { name: 'Atropine 1mg', quantity: 4, minQty: 2, expiry: '2027-09' },
      { name: 'Normal Saline 1L', quantity: 4, minQty: 2, expiry: '2027-12' },
      { name: 'Defibrillator Pads', quantity: 3, minQty: 2, expiry: '2027-01' },
    ] },
  { id: 'CC-02', location: 'ICU', lastChecked: '2026-08-23 06:30', checkedBy: 'Nurse Esi', status: 'Ready', batteries: 'OK', seals: 'Intact',
    items: [
      { name: 'Adrenaline 1:1000', quantity: 5, minQty: 4, expiry: '2027-06' },
      { name: 'Sodium Bicarbonate 8.4%', quantity: 3, minQty: 2, expiry: '2027-08' },
      { name: 'Normal Saline 1L', quantity: 5, minQty: 2, expiry: '2027-12' },
    ] },
  { id: 'CC-03', location: 'Surgical Ward', lastChecked: '2026-08-22 18:00', checkedBy: 'Nurse Kofi', status: 'Needs Restock', batteries: 'Low', seals: 'Intact',
    items: [
      { name: 'Adrenaline 1:1000', quantity: 2, minQty: 4, expiry: '2027-06' },
      { name: 'Normal Saline 1L', quantity: 1, minQty: 2, expiry: '2027-12' },
    ] },
  { id: 'CC-04', location: 'Maternity Ward', lastChecked: '2026-08-23 07:00', checkedBy: 'Nurse Efua', status: 'Ready', batteries: 'OK', seals: 'Intact',
    items: [
      { name: 'Oxytocin 10IU', quantity: 4, minQty: 2, expiry: '2027-04' },
      { name: 'Misoprostol 200mcg', quantity: 6, minQty: 4, expiry: '2027-05' },
      { name: 'Tranexamic Acid 1g', quantity: 3, minQty: 2, expiry: '2027-10' },
    ] },
];

const STATUS_COLORS: Record<string, string> = {
  Ready: 'bg-green-100 text-green-800', 'Needs Restock': 'bg-yellow-100 text-yellow-800',
  'In Use': 'bg-red-100 text-red-800', Maintenance: 'bg-gray-100 text-gray-800',
};

export default function CrashCartTracking() {
  const toast = useToast();
  const [carts] = useState<CrashCart[]>(CARTS);
  const [selected, setSelected] = useState<CrashCart | null>(CARTS[0] ?? null);

  const needsAttention = carts.filter((c) => c.status !== 'Ready' || c.batteries !== 'OK').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Crash Cart Tracking</h1><p className="text-gray-500">Emergency resuscitation equipment status, inventory, and compliance</p></div>
        {needsAttention > 0 && (
          <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-bold">
            ⚠️ {needsAttention} cart{needsAttention > 1 ? 's' : ''} need attention
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {['Ready', 'Needs Restock', 'In Use', 'Maintenance'].map((s) => (
          <div key={s} className="bg-white rounded-lg border p-3 text-center">
            <div className="text-xl font-bold">{carts.filter((c) => c.status === s).length}</div>
            <div className="text-xs text-slate-500">{s}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {carts.map((c) => (
            <div key={c.id} onClick={() => setSelected(c)} className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${selected?.id === c.id ? 'ring-2 ring-green-500' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs text-slate-400">{c.id}</span>
                <Badge className={STATUS_COLORS[c.status]}>{c.status}</Badge>
              </div>
              <div className="font-semibold text-sm">{c.location}</div>
              <div className="flex gap-3 mt-1 text-xs text-slate-500">
                <span className={c.batteries !== 'OK' ? 'text-red-600 font-bold' : ''}>🔋 {c.batteries}</span>
                <span className={c.seals !== 'Intact' ? 'text-red-600 font-bold' : ''}>🔒 {c.seals}</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">Last: {c.lastChecked} by {c.checkedBy}</div>
            </div>
          ))}
        </div>

        {selected && (
          <div className="lg:col-span-2 bg-white rounded-lg border p-5 space-y-4 h-fit sticky top-4">
            <div className="flex items-center justify-between">
              <div><h3 className="text-lg font-bold">{selected.location}</h3><p className="text-sm text-gray-500">{selected.id} · Last checked: {selected.lastChecked}</p></div>
              <Badge className={STATUS_COLORS[selected.status]}>{selected.status}</Badge>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 rounded p-3 text-center"><div className="text-sm font-bold">{selected.batteries}</div><div className="text-[10px] text-slate-400">Batteries</div></div>
              <div className="bg-slate-50 rounded p-3 text-center"><div className="text-sm font-bold">{selected.seals}</div><div className="text-[10px] text-slate-400">Seals</div></div>
              <div className="bg-slate-50 rounded p-3 text-center"><div className="text-sm font-bold">{selected.items.length}</div><div className="text-[10px] text-slate-400">Item Types</div></div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">Inventory</h4>
              <div className="divide-y divide-slate-100">
                {selected.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-xs text-slate-400 ml-2">Exp: {item.expiry}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${item.quantity < item.minQty ? 'text-red-600' : 'text-green-600'}`}>{item.quantity}</span>
                      <span className="text-xs text-slate-400">/ min {item.minQty}</span>
                      {item.quantity < item.minQty && <Badge className="bg-red-100 text-red-800">Low</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => {}} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium">✓ Restock Complete</button>
              <button onClick={() => {}} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">🔄 Replace Battery</button>
              <button onClick={() => {}} className="border px-4 py-2 rounded-lg text-sm font-medium">📋 Print Checklist</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
