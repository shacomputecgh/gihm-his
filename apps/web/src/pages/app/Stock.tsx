import { useCallback, useEffect, useState, type FormEvent } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { api } from '../../lib/api';
import type { StockItem, StockMovement } from '../../types';
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Select, Spinner, useToast } from '../../components/ui';
import { fmtDate, fmtDateTime, titleCase } from '../../lib/format';
import { useAuth } from '../../lib/auth';

type Category = 'ALL' | 'MEDICINE' | 'SUPPLY' | 'REAGENT' | 'VACCINE' | 'OTHER';

const CATEGORY_TONE: Record<string, 'navy' | 'green' | 'gold' | 'blue' | 'gray'> = {
  MEDICINE: 'navy',
  SUPPLY: 'green',
  REAGENT: 'gold',
  VACCINE: 'blue',
  OTHER: 'gray',
};

export default function Stock() {
  const { user } = useAuth();
  const canManage = !!user?.permissions.includes('manage_stock');
  const [category, setCategory] = useState<Category>('ALL');
  const [lowOnly, setLowOnly] = useState(false);
  const [items, setItems] = useState<StockItem[] | null>(null);
  const [lowCount, setLowCount] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [movementsFor, setMovementsFor] = useState<{ id: string; name: string; movements: StockMovement[] } | null>(null);
  const [newItem, setNewItem] = useState({ name: '', category: 'MEDICINE', unit: 'unit', quantity: '', reorderLevel: '', location: '' });
  const toast = useToast();

  const load = useCallback(async () => {
    const q = new URLSearchParams();
    if (category !== 'ALL') q.set('category', category);
    if (lowOnly) q.set('low', '1');
    const res = await api<{ items: StockItem[]; lowCount: number }>(`/inventory/stock?${q.toString()}`);
    setItems(res.items);
    setLowCount(res.lowCount);
  }, [category, lowOnly]);

  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  async function act(id: string, endpoint: 'receive' | 'adjust', body: Record<string, unknown>) {
    setBusyId(id);
    try {
      await api(`/inventory/stock/${id}/${endpoint}`, { method: 'POST', body });
      toast(endpoint === 'receive' ? 'Stock received' : 'Stock adjusted', 'success');
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function createItem(e: FormEvent) {
    e.preventDefault();
    setBusyId('new');
    try {
      await api('/inventory/stock', {
        method: 'POST',
        body: {
          name: newItem.name,
          category: newItem.category,
          unit: newItem.unit,
          quantity: newItem.quantity ? Number(newItem.quantity) : 0,
          reorderLevel: newItem.reorderLevel ? Number(newItem.reorderLevel) : 20,
          location: newItem.location || undefined,
        },
      });
      toast('Stock item added', 'success');
      setNewItem({ name: '', category: 'MEDICINE', unit: 'unit', quantity: '', reorderLevel: '', location: '' });
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function showMovements(item: StockItem) {
    const res = await api<{ movements: StockMovement[] }>(`/inventory/stock/${item.id}/movements`);
    setMovementsFor({ id: item.id, name: item.name, movements: res.movements });
  }

  const visible = items ?? [];

  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);
  return (
    <div>
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
      <PageHeader
        title="Stock & Inventory"
        subtitle="Health commodities with low-stock alerts and a full movement audit trail."
        action={canManage ? <Badge tone={lowCount > 0 ? 'red' : 'green'}>{lowCount} low/out</Badge> : undefined}
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Select value={category} onChange={(e) => setCategory(e.target.value as Category)} className="w-44">
          {(['ALL', 'MEDICINE', 'SUPPLY', 'REAGENT', 'VACCINE', 'OTHER'] as Category[]).map((c) => <option key={c} value={c}>{c === 'ALL' ? 'All categories' : titleCase(c)}</option>)}
        </Select>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-g-ink">
          <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} className="h-4 w-4 accent-g-red" />
          Low stock only
        </label>
      </div>

      {!items ? (
        <Spinner />
      ) : visible.length === 0 ? (
        <EmptyState icon="truck" title="No stock items" message={lowOnly ? 'Nothing is below its reorder level.' : 'Add stock items to start tracking.'} />
      ) : (
        <Card pad={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
                  {['Item', 'Category', 'On hand', 'Reorder', 'Batch / Expiry', 'Location', canManage ? '' : null].filter(Boolean).map((h) => (
                    <th key={String(h)} className="px-5 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {visible.map((s) => (
                  <tr key={s.id} className="hover:bg-g-mist/40">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-g-ink">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.unit}</p>
                    </td>
                    <td className="px-5 py-3"><Badge tone={CATEGORY_TONE[s.category] ?? 'gray'}>{titleCase(s.category)}</Badge></td>
                    <td className="px-5 py-3">
                      <span className={`text-lg font-bold tabular-nums ${s.out ? 'text-g-red' : s.low ? 'text-yellow-700' : 'text-g-ink'}`}>{s.quantity}</span>
                      {s.out && <Badge tone="red" className="ml-2">OUT</Badge>}
                      {!s.out && s.low && <Badge tone="gold" className="ml-2">LOW</Badge>}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{s.reorderLevel}</td>
                    <td className="px-5 py-3">
                      <p className="font-mono text-xs text-slate-500">{s.batch ?? '—'}</p>
                      {s.expiryDate && <p className={`text-xs ${s.expirySoon ? 'font-bold text-g-red' : 'text-slate-400'}`}>{fmtDate(s.expiryDate)}{s.expirySoon ? ' · expiring' : ''}</p>}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{s.location ?? '—'}</td>
                    {canManage && (
                      <td className="px-5 py-3">
                        <div className="flex gap-1.5">
                          <button onClick={() => showMovements(s)} className="cursor-pointer text-xs font-bold text-g-navy hover:underline">History</button>
                          <button onClick={() => void act(s.id, 'receive', { quantity: 10, note: 'Manual receipt' })} disabled={busyId === s.id} className="cursor-pointer rounded-md border border-g-green/30 bg-g-green/10 px-2 py-1 text-xs font-bold text-g-green transition hover:bg-g-green hover:text-white">
                            +10
                          </button>
                          <button onClick={() => void act(s.id, 'adjust', { delta: -1, type: 'ISSUE', note: 'Manual issue' })} disabled={busyId === s.id || s.quantity === 0} className="cursor-pointer rounded-md border border-g-red/30 bg-g-red/10 px-2 py-1 text-xs font-bold text-g-red transition hover:bg-g-red hover:text-white">
                            −1
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {canManage && (
        <Card title="Add stock item" className="mt-5">
          <form onSubmit={createItem} className="grid gap-3 md:grid-cols-6">
            <Field label="Name" className="md:col-span-2"><Input required value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="Paracetamol 500mg" /></Field>
            <Field label="Category"><Select value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}>{['MEDICINE', 'SUPPLY', 'REAGENT', 'VACCINE', 'OTHER'].map((c) => <option key={c}>{c}</option>)}</Select></Field>
            <Field label="Unit"><Input value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })} /></Field>
            <Field label="Qty"><Input type="number" min={0} value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })} /></Field>
            <Field label="Reorder level"><Input type="number" min={0} value={newItem.reorderLevel} onChange={(e) => setNewItem({ ...newItem, reorderLevel: e.target.value })} /></Field>
            <div className="md:col-span-6 flex items-end justify-end"><Button type="submit" loading={busyId === 'new'} icon="plus">Add item</Button></div>
          </form>
        </Card>
      )}

      {movementsFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setMovementsFor(null)}>
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-g-ink">{movementsFor.name}</h3>
                <p className="text-xs text-slate-400">Movement history</p>
              </div>
              <button onClick={() => setMovementsFor(null)} className="cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-g-mist"><span className="text-lg leading-none">×</span></button>
            </div>
            {movementsFor.movements.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">No movements recorded.</p>
            ) : (
              <ul className="space-y-2">
                {movementsFor.movements.map((m) => (
                  <li key={m.id} className="flex items-center justify-between rounded-lg bg-g-mist/50 px-3 py-2.5 text-sm">
                    <div>
                      <p className="font-semibold text-g-ink">
                        <Badge tone={m.type === 'RECEIPT' ? 'green' : m.type === 'ISSUE' ? 'red' : 'gold'}>{m.type}</Badge>
                        <span className="ml-2">{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</span>
                        <span className="text-slate-400"> → {m.balanceAfter}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">{m.note ?? '—'} · {fmtDateTime(m.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
