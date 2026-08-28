import { useState } from 'react';
import { Badge, Button, Card, Field, Input, PageHeader, useToast } from '../../components/ui';

type AlertType = 'code_blue' | 'code_red' | 'code_black' | 'code_gray' | 'code_orange' | 'code_yellow';

interface EmergencyAlert {
  id: string;
  type: AlertType;
  location: string;
  reportedBy: string;
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
}

const ALERT_TYPES: Record<AlertType, { name: string; color: string; bgColor: string; icon: string; desc: string }> = {
  code_blue: { name: 'Code Blue', color: 'text-blue-700', bgColor: 'bg-blue-500', icon: '💙', desc: 'Cardiac/Respiratory Arrest' },
  code_red: { name: 'Code Red', color: 'text-red-700', bgColor: 'bg-red-500', icon: '🔥', desc: 'Fire Emergency' },
  code_black: { name: 'Code Black', color: 'text-slate-700', bgColor: 'bg-slate-700', icon: '💣', desc: 'Bomb Threat' },
  code_gray: { name: 'Code Gray', color: 'text-gray-700', bgColor: 'bg-gray-500', icon: '⚖️', desc: 'Combative/Aggressive Person' },
  code_orange: { name: 'Code Orange', color: 'text-orange-700', bgColor: 'bg-orange-500', icon: '☣️', desc: 'Hazardous Material Spill' },
  code_yellow: { name: 'Code Yellow', color: 'text-yellow-700', bgColor: 'bg-yellow-500', icon: '⚠️', desc: 'Bomb Threat / Security' },
};

const DEMO_ALERTS: EmergencyAlert[] = [
  { id: '1', type: 'code_blue', location: 'Emergency Dept - Bay 3', reportedBy: 'Dr. Kwame Asante', status: 'active', createdAt: new Date(Date.now() - 300000).toISOString() },
  { id: '2', type: 'code_red', location: 'Kitchen - 2nd Floor', reportedBy: 'Nurse Ama Darko', status: 'acknowledged', createdAt: new Date(Date.now() - 3600000).toISOString(), acknowledgedBy: 'Fire Chief' },
  { id: '3', type: 'code_yellow', location: 'Main Entrance', reportedBy: 'Security Team', status: 'resolved', createdAt: new Date(Date.now() - 86400000).toISOString(), acknowledgedBy: 'Admin', resolvedAt: new Date(Date.now() - 82800000).toISOString() },
];

export default function EmergencyAlerts() {
  const toast = useToast();
  const [alerts, setAlerts] = useState<EmergencyAlert[]>(DEMO_ALERTS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'code_blue' as AlertType, location: '', reportedBy: '' });

  function triggerAlert() {
    if (!form.location || !form.reportedBy) {
      toast('Location and reporter name are required', 'error');
      return;
    }
    const newAlert: EmergencyAlert = {
      id: String(Date.now()),
      type: form.type,
      location: form.location,
      reportedBy: form.reportedBy,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    setAlerts([newAlert, ...alerts]);
    setForm({ type: 'code_blue', location: '', reportedBy: '' });
    setShowForm(false);
    toast(`🚨 ${ALERT_TYPES[form.type].name} triggered at ${form.location}`, 'error');
  }

  function acknowledgeAlert(id: string) {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, status: 'acknowledged', acknowledgedBy: 'You' } : a));
    toast('Alert acknowledged', 'success');
  }

  function resolveAlert(id: string) {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, status: 'resolved', resolvedAt: new Date().toISOString() } : a));
    toast('Alert resolved', 'success');
  }

  const activeAlerts = alerts.filter((a) => a.status === 'active');
  const statusBadge: Record<string, string> = {
    active: 'bg-red-100 text-red-700',
    acknowledged: 'bg-amber-100 text-amber-700',
    resolved: 'bg-green-100 text-green-700',
  };

  return (
    <div>
      <PageHeader
        title="🚨 Emergency Alert System"
        subtitle={`${activeAlerts.length} active emergency alerts`}
        action={
          <Button variant="danger" onClick={() => setShowForm(!showForm)}>
            🚨 Trigger Emergency Alert
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-5 border-red-200 bg-red-50">
          <h3 className="mb-3 text-sm font-bold text-red-700">🚨 TRIGGER EMERGENCY ALERT</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Alert Type">
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AlertType })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                {Object.entries(ALERT_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.name} — {v.desc}</option>
                ))}
              </select>
            </Field>
            <Field label="Location">
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. ER Bay 3, ICU Room 5" />
            </Field>
            <Field label="Reported By">
              <Input value={form.reportedBy} onChange={(e) => setForm({ ...form, reportedBy: e.target.value })} placeholder="Your name" />
            </Field>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => void triggerAlert()}>🚨 TRIGGER ALERT NOW</Button>
          </div>
        </Card>
      )}

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="mb-5 space-y-3">
          <h3 className="text-sm font-bold text-red-600">🔴 ACTIVE EMERGENCIES</h3>
          {alerts.filter((a) => a.status === 'active').map((alert) => {
            const cfg = ALERT_TYPES[alert.type];
            return (
              <div key={alert.id} className={`rounded-xl border-2 border-red-300 bg-red-50 p-5 ${cfg.bgColor}/10 animate-pulse`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{cfg.icon}</span>
                      <div>
                        <p className="text-lg font-extrabold text-red-700">{cfg.name}</p>
                        <p className="text-sm text-red-600">{cfg.desc}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-700">📍 {alert.location}</p>
                    <p className="text-xs text-slate-500">Reported by {alert.reportedBy} · {new Date(alert.createdAt).toLocaleTimeString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => acknowledgeAlert(alert.id)}>✓ Acknowledge</Button>
                    <Button variant="green" onClick={() => resolveAlert(alert.id)}>✓ Resolve</Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* All Alerts */}
      <Card title="Alert History">
        <div className="space-y-2">
          {alerts.map((alert) => {
            const cfg = ALERT_TYPES[alert.type];
            return (
              <div key={alert.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{cfg.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{cfg.name}</p>
                    <p className="text-xs text-slate-500">📍 {alert.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={statusBadge[alert.status]}>{alert.status}</Badge>
                  <p className="mt-1 text-xs text-slate-400">{new Date(alert.createdAt).toLocaleString()}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
