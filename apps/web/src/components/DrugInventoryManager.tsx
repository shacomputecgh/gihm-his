import { useState, useCallback, useEffect } from 'react';
import { api } from '../lib/api';
import { Badge, Button, Card, EmptyState, Field, Icon, Input, Select, Spinner, useToast } from './ui';

interface StockItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  maxStock: number;
  reorderLevel: number;
  batch?: string;
  expiryDate?: string;
  location?: string;
  unit: string;
  status: string;
}

interface InventoryAlert {
  type: 'EXPIRED' | 'EXPIRING' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  item: StockItem;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}

function getExpiryStatus(expiryDate?: string): { label: string; color: string } | null {
  if (!expiryDate) return null;
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil < 0) return { label: `Expired ${Math.abs(daysUntil)}d ago`, color: 'red' };
  if (daysUntil <= 30) return { label: `Expires in ${daysUntil}d`, color: 'red' };
  if (daysUntil <= 90) return { label: `Expires in ${daysUntil}d`, color: 'gold' };
  return { label: `Expires in ${daysUntil}d`, color: 'green' };
}

function getStockStatus(item: StockItem): { label: string; color: string } {
  if (item.quantity <= 0) return { label: 'Out of Stock', color: 'red' };
  if (item.quantity <= item.reorderLevel) return { label: 'Low Stock', color: 'gold' };
  if (item.quantity >= item.maxStock) return { label: 'Overstock', color: 'blue' };
  return { label: 'In Stock', color: 'green' };
}

export default function DrugInventoryManager() {
  const toast = useToast();
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'LOW' | 'EXPIRING' | 'EXPIRED'>('ALL');
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ items: StockItem[] }>('/inventory/stock');
      setItems(res.items);

      // Generate alerts
      const newAlerts: InventoryAlert[] = [];
      for (const item of res.items) {
        // Expiry alerts
        if (item.expiryDate) {
          const expiry = new Date(item.expiryDate);
          const now = new Date();
          const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysUntil < 0) {
            newAlerts.push({ type: 'EXPIRED', item, message: `${item.name} expired ${Math.abs(daysUntil)} days ago`, severity: 'critical' });
          } else if (daysUntil <= 30) {
            newAlerts.push({ type: 'EXPIRING', item, message: `${item.name} expires in ${daysUntil} days`, severity: 'warning' });
          }
        }
        // Stock alerts
        if (item.quantity <= 0) {
          newAlerts.push({ type: 'OUT_OF_STOCK', item, message: `${item.name} is out of stock`, severity: 'critical' });
        } else if (item.quantity <= item.reorderLevel) {
          newAlerts.push({ type: 'LOW_STOCK', item, message: `${item.name}: ${item.quantity} ${item.unit} remaining (reorder at ${item.reorderLevel})`, severity: 'warning' });
        }
      }
      setAlerts(newAlerts.sort((a) => a.severity === 'critical' ? -1 : 1));
    } catch {
      toast('Failed to load inventory', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = items.filter((item) => {
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'LOW' && item.quantity > item.reorderLevel) return false;
    if (filter === 'EXPIRING' && (!item.expiryDate || new Date(item.expiryDate) <= new Date())) return false;
    if (filter === 'EXPIRED' && (!item.expiryDate || new Date(item.expiryDate) > new Date())) return false;
    return true;
  });

  const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
  const warningAlerts = alerts.filter((a) => a.severity === 'warning');

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      {alerts.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {criticalAlerts.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-xs font-bold uppercase text-red-600">🚨 Critical ({criticalAlerts.length})</p>
              <div className="mt-1 max-h-32 space-y-1 overflow-y-auto">
                {criticalAlerts.map((a, i) => (
                  <p key={i} className="text-xs text-red-800">• {a.message}</p>
                ))}
              </div>
            </div>
          )}
          {warningAlerts.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-bold uppercase text-amber-600">⚠️ Warnings ({warningAlerts.length})</p>
              <div className="mt-1 max-h-32 space-y-1 overflow-y-auto">
                {warningAlerts.map((a, i) => (
                  <p key={i} className="text-xs text-amber-800">• {a.message}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <Field label="Search inventory">
              <div className="relative">
                <Icon name="search" className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name…" className="pl-9" />
              </div>
            </Field>
          </div>
          <Field label="Filter">
            <Select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
              <option value="ALL">All items ({items.length})</option>
              <option value="LOW">Low stock ({items.filter((i) => i.quantity <= i.reorderLevel).length})</option>
              <option value="EXPIRING">Expiring soon ({items.filter((i) => i.expiryDate && new Date(i.expiryDate) > new Date() && new Date(i.expiryDate) <= new Date(Date.now() + 90 * 86400000)).length})</option>
              <option value="EXPIRED">Expired ({items.filter((i) => i.expiryDate && new Date(i.expiryDate) <= new Date()).length})</option>
            </Select>
          </Field>
          <Button variant="green" onClick={() => void load()}>Refresh</Button>
        </div>
      </Card>

      {/* Inventory Table */}
      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState icon="truck" title="No items found" message="Try adjusting your search or filters." />
      ) : (
        <Card pad={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-semibold">Item</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Stock</th>
                  <th className="px-5 py-3 font-semibold">Level</th>
                  <th className="px-5 py-3 font-semibold">Expiry</th>
                  <th className="px-5 py-3 font-semibold">Batch</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((item) => {
                  const stockStatus = getStockStatus(item);
                  const expiryStatus = getExpiryStatus(item.expiryDate);
                  return (
                    <tr key={item.id} className="hover:bg-g-mist/40">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-g-ink">{item.name}</p>
                        {item.location && <p className="text-xs text-slate-400">📍 {item.location}</p>}
                      </td>
                      <td className="px-5 py-3"><Badge tone="blue">{item.category}</Badge></td>
                      <td className="px-5 py-3 tabular-nums text-g-ink">
                        {item.quantity} <span className="text-xs text-slate-400">{item.unit}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${stockStatus.color === 'red' ? 'bg-red-500' : stockStatus.color === 'gold' ? 'bg-amber-500' : stockStatus.color === 'blue' ? 'bg-blue-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(100, (item.quantity / item.maxStock) * 100)}%` }}
                          />
                        </div>
                        <p className="mt-0.5 text-[10px] text-slate-400">Min: {item.minStock} · Max: {item.maxStock}</p>
                      </td>
                      <td className="px-5 py-3">
                        {expiryStatus ? (
                          <Badge tone={expiryStatus.color as any}>{expiryStatus.label}</Badge>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">{item.batch ?? '—'}</td>
                      <td className="px-5 py-3">
                        <Badge tone={stockStatus.color as any}>{stockStatus.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
            {filtered.length} item(s) · {criticalAlerts.length} critical alerts · {warningAlerts.length} warnings
          </div>
        </Card>
      )}
    </div>
  );
}
