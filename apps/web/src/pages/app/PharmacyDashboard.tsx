import { useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { PageHeader, Card, Badge, StatCard } from '../../components/ui';
import PharmacyPrescriptions from '../../components/pharmacy/PharmacyPrescriptions';
import PharmacyInventory from '../../components/pharmacy/PharmacyInventory';
import PharmacyProcurement from '../../components/pharmacy/PharmacyProcurement';
import PharmacyControlled from '../../components/pharmacy/PharmacyControlled';
import PharmacyBilling from '../../components/pharmacy/PharmacyBilling';
import PharmacyReports from '../../components/pharmacy/PharmacyReports';

type Tab = 'overview' | 'prescriptions' | 'inventory' | 'procurement' | 'controlled' | 'billing' | 'reports';

const TABS: { value: Tab; label: string; icon: string }[] = [
  { value: 'overview', label: 'Overview', icon: '📊' },
  { value: 'prescriptions', label: 'Prescriptions', icon: '📋' },
  { value: 'inventory', label: 'Inventory', icon: '📦' },
  { value: 'procurement', label: 'Procurement', icon: '🛒' },
  { value: 'controlled', label: 'Controlled', icon: '🔒' },
  { value: 'billing', label: 'Billing', icon: '💰' },
  { value: 'reports', label: 'Reports', icon: '📈' },
];

export default function PharmacyDashboard() {
  const [tab, setTab] = useState<Tab>('overview');

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
        title="Pharmacy Management"
        subtitle="Complete pharmaceutical management — prescriptions, inventory, procurement, dispensing, billing, and clinical pharmacy."
      />

      {/* Tab Bar */}
      <div className="mb-6 flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              tab === t.value
                ? 'bg-white text-g-green shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && <PharmacyOverview onNavigate={setTab} />}
      {tab === 'prescriptions' && <PharmacyPrescriptions />}
      {tab === 'inventory' && <PharmacyInventory />}
      {tab === 'procurement' && <PharmacyProcurement />}
      {tab === 'controlled' && <PharmacyControlled />}
      {tab === 'billing' && <PharmacyBilling />}
      {tab === 'reports' && <PharmacyReports />}
    </div>
  );
}

function PharmacyOverview({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  // Summary stats would normally come from API — using representative data
  const stats = {
    totalDrugs: 252,
    activePrescriptions: 14,
    lowStock: 8,
    expiringSoon: 12,
    controlledDrugs: 18,
    todayDispensed: 47,
    todayRevenue: 12450,
    pendingOrders: 5,
  };

  const alerts = [
    { type: 'warning' as const, msg: '8 drugs below reorder level — create purchase orders', tab: 'inventory' as Tab },
    { type: 'error' as const, msg: '3 controlled drugs need reconciliation', tab: 'controlled' as Tab },
    { type: 'warning' as const, msg: '12 drugs expiring within 90 days', tab: 'inventory' as Tab },
    { type: 'info' as const, msg: '5 purchase orders pending supplier delivery', tab: 'procurement' as Tab },
  ];

  const wards = [
    { name: 'Medical Ward', dispensed: 12, pending: 3 },
    { name: 'Surgical Ward', dispensed: 8, pending: 2 },
    { name: 'Paediatric Ward', dispensed: 15, pending: 1 },
    { name: 'Maternity Ward', dispensed: 6, pending: 0 },
    { name: 'ICU', dispensed: 4, pending: 2 },
    { name: 'Emergency', dispensed: 9, pending: 1 },
    { name: 'OPD', dispensed: 23, pending: 5 },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Drugs" value={stats.totalDrugs} tone="blue" icon="pill" />
        <StatCard label="Active Prescriptions" value={stats.activePrescriptions} tone="gold" icon="clipboard" />
        <StatCard label="Today Dispensed" value={stats.todayDispensed} tone="green" icon="check" />
        <StatCard label="Today Revenue" value={`GH₵ ${stats.todayRevenue.toLocaleString()}`} tone="navy" icon="activity" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Low Stock" value={stats.lowStock} tone="red" icon="alert" />
        <StatCard label="Expiring Soon" value={stats.expiringSoon} tone="gold" icon="clock" />
        <StatCard label="Controlled Drugs" value={stats.controlledDrugs} tone="navy" icon="shield" />
        <StatCard label="Pending Orders" value={stats.pendingOrders} tone="blue" icon="clipboard" />
      </div>

      {/* Alerts */}
      <Card>
        <h3 className="mb-3 text-sm font-bold uppercase text-slate-400">Alerts & Notifications</h3>
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <button
              key={i}
              onClick={() => onNavigate(a.tab)}
              className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${
                a.type === 'error' ? 'bg-red-50 hover:bg-red-100 dark:bg-red-900/20' :
                a.type === 'warning' ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20' :
                'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20'
              }`}
            >
              <Badge tone={a.type === 'error' ? 'red' : a.type === 'warning' ? 'gold' : 'blue'}>
                {a.type.toUpperCase()}
              </Badge>
              <span className="text-sm text-slate-700 dark:text-slate-200">{a.msg}</span>
              <span className="ml-auto text-xs text-slate-400">→</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Ward Activity */}
      <Card>
        <h3 className="mb-3 text-sm font-bold uppercase text-slate-400">Ward Dispensing Activity Today</h3>
        <div className="space-y-2">
          {wards.map((w) => (
            <div key={w.name} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5 dark:bg-slate-800">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{w.name}</span>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-green-600 dark:text-green-400">✅ {w.dispensed} dispensed</span>
                {w.pending > 0 && <span className="text-amber-600 dark:text-amber-400">⏳ {w.pending} pending</span>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card>
        <h3 className="mb-3 text-sm font-bold uppercase text-slate-400">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { label: '📋 New Prescription', tab: 'prescriptions' as Tab },
            { label: '📦 Check Stock', tab: 'inventory' as Tab },
            { label: '🛒 Create PO', tab: 'procurement' as Tab },
            { label: '🔒 Controlled Log', tab: 'controlled' as Tab },
            { label: '💰 Process Payment', tab: 'billing' as Tab },
            { label: '📈 View Reports', tab: 'reports' as Tab },
          ].map((a) => (
            <button
              key={a.label}
              onClick={() => onNavigate(a.tab)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {a.label}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
