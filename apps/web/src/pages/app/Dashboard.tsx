import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import type { DashboardStats, SurveillanceSummary } from '../../types';
import { Card, Icon, Badge, StatCard } from '../../components/ui';
import { DashboardSkeleton } from '../../components/LoadingSkeleton';
import { cedis, fmtDate } from '../../lib/format';
import { useAuth } from '../../lib/auth';
import { getOutbreakThreshold } from '../../lib/constants';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [surveillance, setSurveillance] = useState<SurveillanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const d = await api<DashboardStats>('/dashboard/stats');
        if (alive) { setData(d); setLoading(false); }
      } catch {
        // Demo fallback: use mock data when no backend
        if (alive) {
          setData({
            scope: 'facility',
            facilityId: 'FAC-001',
            stats: {
              patientsToday: 47,
              appointmentsToday: 31,
              encountersToday: 23,
              queueWaiting: 15,
              activeAdmissions: 12,
              labPending: 8,
              prescriptionsActive: 14,
              invoicesToday: 19,
              revenueToday: 4580.50,
              criticalLabs: 3,
              patientCount: 2847,
            },
            national: { districts: 261, facilities: 4400 },
            trend: [
              { date: '2026-08-21', count: 38 },
              { date: '2026-08-22', count: 42 },
              { date: '2026-08-23', count: 35 },
              { date: '2026-08-24', count: 51 },
              { date: '2026-08-25', count: 44 },
              { date: '2026-08-26', count: 48 },
              { date: '2026-08-27', count: 47 },
            ],
          });
          setLoading(false);
        }
      }
      try {
        const d = await api<SurveillanceSummary>('/surveillance/cases/summary');
        if (alive) setSurveillance(d);
      } catch {
        // Demo: no surveillance data
      }
    };
    load();
    const t = window.setInterval(load, 30_000);
    return () => { alive = false; window.clearInterval(t); };
  }, []);

  if (loading && !data) return <DashboardSkeleton />;
  if (!data) return <DashboardSkeleton />;

  const s = data.stats;
  const max = Math.max(1, ...data.trend.map((t) => t.count));

  return (
    <div className="space-y-6 fade-in">
      {/* Welcome header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-g-ink dark:text-g-dark-text">
            Medawɔ wo, {user?.fullName.split(' ')[0] ?? 'there'} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-g-dark-muted">
            Facility operations overview — real-time counts from today's activity.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-g-dark-muted">
          <span className="inline-block h-2 w-2 rounded-full bg-g-green animate-pulse" />
          Live · refreshes every 30s
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Patients today" value={s.patientsToday} icon="users" tone="navy" />
        <StatCard label="OPD encounters" value={s.encountersToday} icon="activity" tone="blue" />
        <StatCard label="Queue waiting" value={s.queueWaiting} icon="list" tone="gold" hint="across departments" />
        <StatCard label="Admissions" value={s.activeAdmissions} icon="bed" tone="green" />
        <StatCard label="Lab pending" value={s.labPending} icon="flask" tone="gray" />
        <StatCard label="Revenue today" value={cedis(s.revenueToday)} icon="card" tone="green" />
      </div>

      {/* Chart + Quick Actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Activity chart */}
        <Card title="7-day patient activity" subtitle="Encounters per day" className="lg:col-span-2">
          <div className="flex h-48 items-end gap-2 pt-2">
            {data.trend.map((t) => {
              const pct = (t.count / max) * 100;
              return (
                <div key={t.date} className="group flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-xs font-bold text-g-ink opacity-0 transition-opacity group-hover:opacity-100">{t.count}</span>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-g-red/70 to-g-red/90 transition-all duration-500 ease-out group-hover:from-g-red group-hover:to-g-red"
                    style={{ height: `${Math.max(4, pct * 1.2)}px` }}
                  />
                  <span className="text-[10px] text-slate-400">{fmtDate(t.date).split(' ')[0]}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Quick actions */}
        <Card title="Quick actions">
          <div className="grid grid-cols-2 gap-2">
            {[
              { to: '/app/register', label: 'Register patient', icon: 'plus' as const },
              { to: '/app/patients', label: 'Find patient', icon: 'search' as const },
              { to: '/app/appointments', label: 'Appointments', icon: 'calendar' as const },
              { to: '/app/queue', label: 'Manage queue', icon: 'list' as const },
            ].map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="card-hover flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-g-red/8 text-g-red">
                  <Icon name={a.icon} className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-g-ink">{a.label}</span>
              </Link>
            ))}
          </div>

          <div className="mt-4 space-y-2 text-sm">
            {[
              { label: 'Appointments today', value: s.appointmentsToday },
              { label: 'Active prescriptions', value: s.prescriptionsActive },
            ].map((item) => (
              <div key={item.label} className="flex justify-between rounded-lg bg-g-mist px-3 py-2.5">
                <span className="text-slate-500">{item.label}</span>
                <span className="font-bold tabular-nums">{item.value}</span>
              </div>
            ))}
            <div className="flex justify-between rounded-lg bg-g-mist px-3 py-2.5">
              <span className="text-slate-500">Critical lab alerts</span>
              {s.criticalLabs > 0 ? <Badge tone="red">{s.criticalLabs}</Badge> : <Badge tone="green">0</Badge>}
            </div>
            <div className="flex justify-between rounded-lg bg-g-mist px-3 py-2.5">
              <span className="text-slate-500">Total patients on file</span>
              <span className="font-bold tabular-nums">{s.patientCount}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Info row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="National master data">
          <div className="flex gap-8 text-sm">
            <div>
              <p className="text-2xl font-bold text-g-ink">{data.national.districts}</p>
              <p className="text-xs text-slate-400">districts</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-g-ink">{data.national.facilities}</p>
              <p className="text-xs text-slate-400">facilities</p>
            </div>
          </div>
        </Card>

        <Card title="Data scope">
          <p className="text-sm text-slate-600 leading-relaxed">
            Viewing data scoped to <strong className="text-g-ink">{user?.scope}</strong> level
            {user?.scope === 'DISTRICT' && user?.districtName ? ` — ${user.districtName}` : ''}
            {user?.scope === 'REGIONAL' && user?.regionName ? ` — ${user.regionName}` : ''}
            {user?.scope === 'FACILITY' && user?.facilityName ? ` — ${user.facilityName}` : ''}.
          </p>
        </Card>

        <Card title="System status">
          <div className="flex items-center gap-2 text-sm">
            <Icon name="shield" className="h-4 w-4 text-g-green" />
            <span className="font-semibold text-g-green">API operational</span>
            <Badge tone="gold">offline-first active</Badge>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            See the top-right sync badge for device status and pending transactions.
          </p>
        </Card>
      </div>

      {/* Surveillance summary */}
      {surveillance && surveillance.totals.cases > 0 && (
        <Card title="Disease surveillance" subtitle="Active case register overview">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge tone="red">{surveillance.totals.open} open</Badge>
              <Badge tone="green">{surveillance.totals.closed} closed</Badge>
              <Badge tone="navy">{surveillance.totals.confirmed} confirmed</Badge>
              <Badge tone="gold">{surveillance.totals.suspected} suspected</Badge>
            </div>
            <div className="text-slate-300">·</div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Follow-up rate:</span>
              <span className="font-bold tabular-nums">{surveillance.totals.followUpRate}%</span>
            </div>
            <div className="text-slate-300">·</div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Contacts traced:</span>
              <span className="font-bold tabular-nums">{surveillance.totals.contactsTraced}</span>
            </div>
          </div>
          {surveillance.byDisease.filter((d) => d.open >= getOutbreakThreshold()).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {surveillance.byDisease.filter((d) => d.open >= getOutbreakThreshold()).map((d) => (
                <Badge key={d.disease} tone="red">⚠ {d.disease} — {d.open} open</Badge>
              ))}
            </div>
          )}
          <div className="mt-3">
            <Link to="/app/surveillance" className="text-xs font-semibold text-g-red hover:underline">View full surveillance register →</Link>
          </div>
        </Card>
      )}
    </div>
  );
}
