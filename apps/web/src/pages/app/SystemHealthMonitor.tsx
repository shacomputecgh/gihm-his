import { useState, useEffect } from 'react';
import { Badge, Card } from '../../components/ui';

interface SystemMetric {
  name: string; value: string; status: 'healthy' | 'warning' | 'critical';
  icon: string; detail: string; trend?: string;
}

export default function SystemHealthMonitor() {
  const [uptime, setUptime] = useState(99.97);
  const [lastCheck] = useState(new Date().toLocaleString());

  useEffect(() => {
    const interval = setInterval(() => {
      setUptime((u) => Math.max(99.90, Math.min(100, u + (Math.random() - 0.5) * 0.02)));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const metrics: SystemMetric[] = [
    { name: 'System Uptime', value: `${uptime.toFixed(2)}%`, status: uptime >= 99.9 ? 'healthy' : uptime >= 99 ? 'warning' : 'critical', icon: '🟢', detail: 'Last 30 days', trend: '↑ Stable' },
    { name: 'API Response Time', value: '124ms', status: 'healthy', icon: '⚡', detail: 'Average response', trend: '↓ 12ms improvement' },
    { name: 'Database', value: 'Connected', status: 'healthy', icon: '💾', detail: 'PostgreSQL 15.4', trend: 'Latency: 3ms' },
    { name: 'Storage Used', value: '67%', status: 'warning', icon: '💿', detail: '67GB / 100GB', trend: '↑ 2.3GB this month' },
    { name: 'Active Users', value: '42', status: 'healthy', icon: '👥', detail: 'Currently online', trend: 'Peak: 128 today' },
    { name: 'SMS Gateway', value: 'Connected', status: 'healthy', icon: '📱', detail: 'Hellio Messaging', trend: '45 messages today' },
    { name: 'Email Service', value: 'Connected', status: 'healthy', icon: '📧', detail: 'SMTP Active', trend: '128 emails today' },
    { name: 'Payment Gateway', value: 'Connected', status: 'healthy', icon: '💳', detail: 'Paystack Live', trend: 'GH₵ 12,450 today' },
    { name: 'CPU Usage', value: '34%', status: 'healthy', icon: '🖥️', detail: '4-core server', trend: 'Peak: 67%' },
    { name: 'Memory Usage', value: '58%', status: 'healthy', icon: '🧠', detail: '9.3GB / 16GB', trend: 'Peak: 72%' },
    { name: 'SSL Certificate', value: 'Valid', status: 'healthy', icon: '🔐', detail: 'Expires: 2027-03-15', trend: '290 days remaining' },
    { name: 'Backup Status', value: 'Success', status: 'healthy', icon: '☁️', detail: 'Last: 2026-08-25 03:00', trend: 'Daily at 03:00' },
  ];

  const statusCounts = {
    healthy: metrics.filter((m) => m.status === 'healthy').length,
    warning: metrics.filter((m) => m.status === 'warning').length,
    critical: metrics.filter((m) => m.status === 'critical').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">System Health Monitor</h1><p className="text-gray-500">Real-time system performance, uptime, and service status</p></div>
        <Badge tone={statusCounts.critical > 0 ? 'red' : statusCounts.warning > 0 ? 'gold' : 'green'}>
          {statusCounts.critical > 0 ? '🔴 Issues Detected' : statusCounts.warning > 0 ? '🟡 Warnings' : '🟢 All Systems Operational'}
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center bg-green-50 border-green-200">
          <div className="text-3xl font-bold text-green-600">{statusCounts.healthy}</div>
          <div className="text-sm text-green-700">Healthy</div>
        </Card>
        <Card className="p-4 text-center bg-yellow-50 border-yellow-200">
          <div className="text-3xl font-bold text-yellow-600">{statusCounts.warning}</div>
          <div className="text-sm text-yellow-700">Warnings</div>
        </Card>
        <Card className="p-4 text-center bg-red-50 border-red-200">
          <div className="text-3xl font-bold text-red-600">{statusCounts.critical}</div>
          <div className="text-sm text-red-700">Critical</div>
        </Card>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {metrics.map((m) => (
          <Card key={m.name} className={`p-4 ${m.status === 'warning' ? 'border-yellow-300 bg-yellow-50' : m.status === 'critical' ? 'border-red-300 bg-red-50' : ''}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{m.icon}</span>
                <span className="font-semibold text-sm">{m.name}</span>
              </div>
              <Badge tone={m.status === 'healthy' ? 'green' : m.status === 'warning' ? 'gold' : 'red'}>
                {m.status === 'healthy' ? 'OK' : m.status === 'warning' ? 'Warn' : 'Crit'}
              </Badge>
            </div>
            <div className="text-2xl font-bold mb-1">{m.value}</div>
            <div className="text-xs text-gray-500">{m.detail}</div>
            {m.trend && <div className="text-xs text-gray-400 mt-1">{m.trend}</div>}
          </Card>
        ))}
      </div>
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Service Status Timeline</h3>
          <span className="text-xs text-gray-400">Last checked: {lastCheck}</span>
        </div>
        <div className="mt-3 flex gap-0.5">
          {Array.from({ length: 72 }, (_, i) => {
            const hour = i % 24;
            const isIssue = Math.random() < 0.05;
            return <div key={i} className={`flex-1 h-6 rounded-sm ${isIssue ? 'bg-yellow-400' : 'bg-green-400'}`} title={`${Math.floor(i / 24) === 0 ? 'Mon' : Math.floor(i / 24) === 1 ? 'Tue' : 'Wed'} ${hour}:00 — ${isIssue ? 'Degraded' : 'Operational'}`} />;
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1"><span>72 hours ago</span><span>Now</span></div>
      </Card>
    </div>
  );
}
