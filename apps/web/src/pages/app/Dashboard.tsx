import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import type { DashboardStats } from '../../types';
import { Card, Icon, PageHeader, Spinner, StatCard, Badge } from '../../components/ui';
import { cedis, fmtDate } from '../../lib/format';
import { useAuth } from '../../lib/auth';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardStats | null>(null);

  useEffect(() => {
    void api<DashboardStats>('/dashboard/stats').then(setData).catch(() => undefined);
    const t = window.setInterval(() => void api<DashboardStats>('/dashboard/stats').then(setData).catch(() => undefined), 30_000);
    return () => window.clearInterval(t);
  }, []);

  if (!data) return <Spinner label="Loading dashboard…" />;
  const s = data.stats;
  const max = Math.max(1, ...data.trend.map((t) => t.count));

  return (
    <div>
      <PageHeader
        title={`Medawɔ wo, ${user?.fullName.split(' ')[0] ?? 'there'} 👋`}
        subtitle="Facility operations overview — real-time counts from today's activity (synthetic data)."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Patients today" value={s.patientsToday} icon="users" tone="navy" />
        <StatCard label="OPD encounters" value={s.encountersToday} icon="activity" tone="blue" />
        <StatCard label="Queue waiting" value={s.queueWaiting} icon="list" tone="gold" hint="across departments" />
        <StatCard label="Admissions" value={s.activeAdmissions} icon="bed" tone="green" />
        <StatCard label="Lab results pending" value={s.labPending} icon="flask" tone="gray" />
        <StatCard label="Revenue today" value={cedis(s.revenueToday)} icon="card" tone="green" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="7-day patient activity" subtitle="Encounters per day" className="lg:col-span-2">
          <div className="flex h-48 items-end gap-2">
            {data.trend.map((t) => (
              <div key={t.date} className="group flex flex-1 flex-col items-center gap-1.5">
                <span className="text-xs font-bold text-g-ink">{t.count}</span>
                <div className="w-full rounded-t-md bg-gradient-to-t from-g-red/80 to-g-red transition group-hover:from-g-red" style={{ height: `${Math.max(4, (t.count / max) * 120)}px` }} />
                <span className="text-[10px] text-slate-400">{fmtDate(t.date).split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Quick actions">
          <div className="grid grid-cols-2 gap-2">
            {[
              { to: '/app/register', label: 'Register patient', icon: 'plus' as const },
              { to: '/app/patients', label: 'Find patient', icon: 'search' as const },
              { to: '/app/appointments', label: 'Book appointment', icon: 'calendar' as const },
              { to: '/app/queue', label: 'Manage queue', icon: 'list' as const },
            ].map((a) => (
              <Link key={a.to} to={a.to} className="card-hover flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <Icon name={a.icon} className="h-5 w-5 text-g-red" />
                <span className="text-xs font-semibold text-g-ink">{a.label}</span>
              </Link>
            ))}
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between rounded-lg bg-g-mist px-3 py-2"><span className="text-slate-500">Appointments today</span><span className="font-bold">{s.appointmentsToday}</span></div>
            <div className="flex justify-between rounded-lg bg-g-mist px-3 py-2"><span className="text-slate-500">Active prescriptions</span><span className="font-bold">{s.prescriptionsActive}</span></div>
            <div className="flex justify-between rounded-lg bg-g-mist px-3 py-2"><span className="text-slate-500">Critical lab alerts</span>
              <span>{s.criticalLabs > 0 ? <Badge tone="red">{s.criticalLabs}</Badge> : <Badge tone="green">0</Badge>}</span>
            </div>
            <div className="flex justify-between rounded-lg bg-g-mist px-3 py-2"><span className="text-slate-500">Total patients on file</span><span className="font-bold tabular-nums">{s.patientCount}</span></div>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card title="National master data">
          <div className="flex gap-6 text-sm">
            <div><p className="text-2xl font-bold text-g-ink">{data.national.districts}</p><p className="text-xs text-slate-400">districts</p></div>
            <div><p className="text-2xl font-bold text-g-ink">{data.national.facilities}</p><p className="text-xs text-slate-400">facilities</p></div>
          </div>
        </Card>
        <Card title="Data scope">
          <p className="text-sm text-slate-600">
            You are viewing data scoped to <strong className="text-g-ink">{user?.scope}</strong> level
            {user?.facilityId ? ' (Korle-Bu Teaching Hospital DEMO)' : ''}. Regional and national dashboards aggregate upward with authorization.
          </p>
        </Card>
        <Card title="System status">
          <div className="flex items-center gap-2 text-sm">
            <Icon name="shield" className="h-4 w-4 text-g-green" />
            <span className="font-semibold text-g-green">API operational</span>
            <Badge tone="gold">offline-first active</Badge>
          </div>
          <p className="mt-2 text-xs text-slate-400">See the top-right sync badge for device status and pending transactions.</p>
        </Card>
      </div>
    </div>
  );
}
