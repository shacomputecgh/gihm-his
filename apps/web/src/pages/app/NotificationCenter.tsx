import { useState, useEffect, useCallback } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { api } from '../../lib/api';
import { Button, EmptyState, PageHeader, Spinner, useToast } from '../../components/ui';
import { fmtDateTime } from '../../lib/format';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'alert';
  title: string;
  message: string;
  module: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

const NOTIF_ICONS: Record<string, string> = {
  info: 'ℹ️',
  warning: '⚠️',
  error: '🔴',
  success: '✅',
  alert: '🚨',
};

const MODULE_BADGES: Record<string, string> = {
  pharmacy: 'bg-indigo-100 text-indigo-700',
  lab: 'bg-cyan-100 text-cyan-700',
  billing: 'bg-yellow-100 text-yellow-700',
  patients: 'bg-blue-100 text-blue-700',
  immunization: 'bg-green-100 text-green-700',
  stock: 'bg-orange-100 text-orange-700',
  system: 'bg-slate-100 text-slate-700',
  security: 'bg-red-100 text-red-700',
  insurance: 'bg-purple-100 text-purple-700',
};

const DEMO_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'alert', title: 'Low Stock Alert', message: 'Paracetamol 500mg is running low (12 units remaining). Reorder level: 50.', module: 'pharmacy', read: false, createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: '2', type: 'warning', title: 'Expiry Warning', message: 'Amoxicillin 250mg batch #AMX-2024 expires in 14 days.', module: 'pharmacy', read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: '3', type: 'success', title: 'Lab Result Ready', message: 'Blood test results for patient MRN-00142 are ready for review.', module: 'lab', read: false, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: '4', type: 'info', title: 'New Patient Registered', message: 'Ama Mensah (MRN-00143) has been registered in the system.', module: 'patients', read: true, createdAt: new Date(Date.now() - 14400000).toISOString() },
  { id: '5', type: 'success', title: 'Payment Received', message: 'GH₵ 245.00 received from Kofi Asante for outpatient billing.', module: 'billing', read: true, createdAt: new Date(Date.now() - 21600000).toISOString() },
  { id: '6', type: 'warning', title: 'Immunization Due', message: '5 children are due for Measles-Rubella vaccination this week.', module: 'immunization', read: true, createdAt: new Date(Date.now() - 43200000).toISOString() },
  { id: '7', type: 'alert', title: 'Insurance Claim Pending', message: '3 NHIS claims are pending review and submission.', module: 'insurance', read: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: '8', type: 'info', title: 'System Update', message: 'GIHM-HIS v2.1.0 is available. Changelog: improved pharmacy module.', module: 'system', read: true, createdAt: new Date(Date.now() - 172800000).toISOString() },
];

export default function NotificationCenter() {
  const toast = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ notifications: Notification[] }>('/notifications').catch(() => null);
      setNotifications(res?.notifications ?? DEMO_NOTIFICATIONS);
    } catch {
      setNotifications(DEMO_NOTIFICATIONS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast('All notifications marked as read', 'success');
  }

  function clearAll() {
    setNotifications([]);
    toast('All notifications cleared', 'info');
  }

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

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
          title="Add New Notification"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader
        title="Notification Center"
        subtitle={`${notifications.length} notifications${unreadCount > 0 ? ` · ${unreadCount} unread` : ''}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void markAllRead()}>Mark all read</Button>
            <Button variant="outline" onClick={() => void clearAll()}>Clear all</Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { value: 'all', label: `All (${notifications.length})` },
          { value: 'unread', label: `Unread (${unreadCount})` },
          { value: 'alert', label: '🚨 Alerts' },
          { value: 'warning', label: '⚠️ Warnings' },
          { value: 'success', label: '✅ Success' },
          { value: 'info', label: 'ℹ️ Info' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              filter === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner label="Loading notifications..." />
      ) : filtered.length === 0 ? (
        <EmptyState icon="bell" title="No notifications" message="You're all caught up!" />
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => (
            <div
              key={n.id}
              className={`rounded-xl border border-slate-200 bg-white p-4 cursor-pointer transition-all hover:shadow-md ${
                !n.read ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : ''
              }`}
              onClick={() => markRead(n.id)}
              role="button"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-xl">{NOTIF_ICONS[n.type]}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-bold ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>
                      {n.title}
                    </p>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                  </div>
                  <p className="mt-0.5 text-sm text-slate-600">{n.message}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${MODULE_BADGES[n.module] ?? 'bg-slate-100 text-slate-600'}`}>
                      {n.module}
                    </span>
                    <span className="text-[10px] text-slate-400">{fmtDateTime(n.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
