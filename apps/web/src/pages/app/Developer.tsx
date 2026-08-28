import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { api, downloadFile } from '../../lib/api';
import type { AuthUser, AuditEntry, DeveloperOverview, DeveloperUserRow, DevSystemInfo, Device, LicenseStatus, LockoutsOverview, RoleBrief, SecurityAlertDetail, SecurityAlertInbox, SecurityAlertRow } from '../../types';
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Segmented, Select, Spinner, StatCard, useToast } from '../../components/ui';
import { fmtDateTime } from '../../lib/format';
import { useAuth } from '../../lib/auth';
import { getAllLicenses, type LicenseRecord } from '../../lib/licenseGenerator';

type Tab = 'overview' | 'users' | 'security' | 'licensing' | 'licenses' | 'audit' | 'alerts' | 'system';

export default function Developer() {
  const { user: me, impersonate } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  return (
    <div>
      <PageHeader
        title="Developer Mode"
        subtitle="Platform-level control: every account (including admins), security policy, licensing and the full audit trail. Restricted to the DEVELOPER scope."
        action={<Badge tone="red">DEVELOPER</Badge>}
      />
      <div className="mb-5">
        <Segmented
          options={[
            { value: 'overview', label: 'Overview' },
            { value: 'users', label: 'Users' },
            { value: 'security', label: 'Security' },
            { value: 'licensing', label: 'Licensing' },
            { value: 'licenses', label: 'Issued Licenses' },
            { value: 'audit', label: 'Audit' },
            { value: 'alerts', label: 'Alerts' },
            { value: 'system', label: 'System' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>
      {tab === 'overview' && <OverviewTab />}
      {tab === 'users' && <UsersTab onImpersonate={(t, u) => impersonate(t, u)} meEmail={me?.email ?? ''} />}
      {tab === 'security' && <SecurityTab />}
      {tab === 'licensing' && <LicensingTab />}
      {tab === 'licenses' && <IssuedLicensesTab />}
      {tab === 'audit' && <AuditTab />}
      {tab === 'alerts' && <AlertsTab />}
      {tab === 'system' && <SystemTab />}
    </div>
  );
}

// ---------------------------------------------------------------- overview
function OverviewTab() {
  const [data, setData] = useState<DeveloperOverview | null>(null);
  const [trendChannel, setTrendChannel] = useState('ALL');
  useEffect(() => {
    void api<DeveloperOverview>('/admin/developer/overview').then(setData).catch(() => undefined);
  }, []);
  if (!data) return <Spinner label="Loading overview…" />;
  const l = data.license;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Users" value={data.counts.users} icon="users" tone="navy" />
        <StatCard label="Facilities" value={data.counts.facilities} icon="building" tone="green" />
        <StatCard label="Devices" value={data.counts.devices} icon="monitor" tone="gold" />
        <StatCard label="Audit (24h)" value={data.counts.auditToday} icon="shield" tone="red" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="License" subtitle={l.activated ? `${l.edition} edition` : 'Not activated'}>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-400">Status</dt><dd><Badge tone={l.activated ? (l.expired ? 'red' : 'green') : 'gold'}>{l.activated ? (l.expired ? 'EXPIRED' : 'ACTIVE') : 'TRIAL / UNLICENSED'}</Badge></dd></div>
            {l.edition && <div className="flex justify-between"><dt className="text-slate-400">Edition</dt><dd className="font-semibold text-g-ink">{l.edition}</dd></div>}
            {l.expiresAt && <div className="flex justify-between"><dt className="text-slate-400">Expires</dt><dd className="tabular-nums">{fmtDateTime(l.expiresAt)} ({l.daysLeft} days left)</dd></div>}
            <div className="flex justify-between"><dt className="text-slate-400">Facilities</dt><dd className="tabular-nums">{l.facilities.used} / {l.facilities.max ?? '∞'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">Users</dt><dd className="tabular-nums">{l.users.used} / {l.users.max ?? '∞'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">Compliant</dt><dd><Badge tone={l.compliant ? 'green' : 'red'}>{l.compliant ? 'YES' : 'NO'}</Badge></dd></div>
            {l.limitsExceeded.length > 0 && (
              <p className="mt-2 text-xs font-semibold text-g-red">Limits exceeded: {l.limitsExceeded.join(', ')}</p>
            )}
          </dl>
        </Card>
        <Card title="Security posture">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-400">Password minimum</dt><dd className="font-semibold tabular-nums">{data.security.passwordMinLength} chars</dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">Lockout threshold</dt><dd className="font-semibold tabular-nums">{data.security.lockoutThreshold} attempts</dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">Session TTL</dt><dd className="font-semibold tabular-nums">{data.security.sessionTtlHours} hours</dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">Active sessions (24h)</dt><dd className="font-semibold tabular-nums">{data.counts.activeSessions}</dd></div>
          </dl>
          <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
            Runtime: Node {data.runtime.node} · {data.runtime.platform} · {data.runtime.nodeEnv}
          </p>
        </Card>
      </div>
      <Card title="Alert delivery channels" subtitle="Per-channel delivery health — how many dispatches succeeded, are queued for retry with backoff, or gave up after the max attempts.">
        {(() => {
          const degrading = data.deliveryStats.filter((c) => c.exhausted > 0);
          const retrying = data.deliveryStats.filter((c) => c.pending > 0 && c.exhausted === 0);
          if (degrading.length > 0) {
            const total = degrading.reduce((n, c) => n + c.exhausted, 0);
            return (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-g-red/30 bg-g-red/10 px-4 py-2.5 text-sm font-semibold text-g-red">
                <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-g-red" />
                DEGRADED — {total} delivery{total === 1 ? '' : 's'} gave up on {degrading.map((c) => c.channel).join(', ')} after the retry attempts. Check the gateway credentials.
              </div>
            );
          }
          if (retrying.length > 0) {
            return (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-g-gold/30 bg-g-gold/10 px-4 py-2.5 text-sm font-semibold text-g-gold">
                <span className="h-2 w-2 shrink-0 rounded-full bg-g-gold" />
                RETRYING — queued dispatches on {retrying.map((c) => c.channel).join(', ')} are being retried with backoff.
              </div>
            );
          }
          return (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-g-green/30 bg-g-green/10 px-4 py-2.5 text-sm font-semibold text-g-green">
              <span className="h-2 w-2 shrink-0 rounded-full bg-g-green" />
              ALL CHANNELS HEALTHY — no queued or exhausted deliveries.
            </div>
          );
        })()}
        <div className="grid gap-3 sm:grid-cols-3">
          {data.deliveryStats.map((c) => (
            <div key={c.channel} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{c.channel}</p>
                <Badge tone={c.exhausted > 0 ? 'red' : c.pending > 0 ? 'gold' : 'green'}>{c.total} total</Badge>
              </div>
              <div className="flex items-end justify-between">
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between gap-6"><dt className="text-slate-400">Delivered</dt><dd className="font-semibold tabular-nums text-g-green">{c.delivered}</dd></div>
                  <div className="flex justify-between gap-6"><dt className="text-slate-400">Pending retry</dt><dd className="font-semibold tabular-nums text-g-gold">{c.pending}</dd></div>
                  <div className="flex justify-between gap-6"><dt className="text-slate-400">Exhausted</dt><dd className="font-semibold tabular-nums text-g-red">{c.exhausted}</dd></div>
                </dl>
              </div>
            </div>
          ))}
        </div>
        {data.deliveryTrend.length > 0 && (() => {
          const series = data.deliveryTrend;
          const first = series[0]?.points ?? [];
          const trend = first.map((_, i) => {
            const date = first[i]!.date;
            if (trendChannel !== 'ALL') {
              const c = series.find((s) => s.channel === trendChannel);
              return c?.points[i] ?? { date, delivered: 0, pending: 0, exhausted: 0 };
            }
            const day = series.map((s) => s.points[i]).filter((p): p is NonNullable<typeof p> => Boolean(p));
            return {
              date,
              delivered: day.reduce((n, p) => n + p.delivered, 0),
              pending: day.reduce((n, p) => n + p.pending, 0),
              exhausted: day.reduce((n, p) => n + p.exhausted, 0),
            };
          });
          const trendMax = Math.max(1, ...trend.flatMap((t) => [t.delivered, t.pending, t.exhausted]));
          const trendLine = (key: 'delivered' | 'pending' | 'exhausted') =>
            trend.map((t, i) => `${(i * 560) / Math.max(1, trend.length - 1)},${86 - (t[key] / trendMax) * 70}`).join(' ');
          const TREND_COLORS: Record<string, string> = { delivered: '#16a34a', pending: '#d97706', exhausted: '#dc2626' };
          return (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">14-day delivery trend</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Select value={trendChannel} onChange={(e) => setTrendChannel(e.target.value)} className="w-32 py-1 text-xs">
                    <option value="ALL">All channels</option>
                    {series.map((s) => (
                      <option key={s.channel} value={s.channel}>{s.channel}</option>
                    ))}
                  </Select>
                  <div className="flex gap-3 text-[10px] text-slate-400">
                    {(['delivered', 'pending', 'exhausted'] as const).map((k) => (
                      <span key={k} className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: TREND_COLORS[k] }} />
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <svg viewBox="0 0 560 90" className="w-full" preserveAspectRatio="none" role="img" aria-label="14-day alert delivery trend">
                {(['delivered', 'pending', 'exhausted'] as const).map((k) => (
                  <polyline key={k} points={trendLine(k)} fill="none" stroke={TREND_COLORS[k]} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                ))}
              </svg>
              <div className="mt-0.5 flex justify-between text-[10px] text-slate-400">
                <span>{trend[0]?.date ?? ''}</span>
                <span>{trend[Math.floor(trend.length / 2)]?.date ?? ''}</span>
                <span>{trend[trend.length - 1]?.date ?? ''}</span>
              </div>
            </div>
          );
        })()}
        <p className="mt-3 text-xs text-slate-400">
          A pending row means a transient gateway or receiver outage is being retried with exponential backoff (30 min → 24h, up to the retry attempts setting on the Security tab).
        </p>
      </Card>
    </div>
  );
}

// ------------------------------------------------------------------ users
function UsersTab({ onImpersonate, meEmail }: { onImpersonate: (token: string, user: AuthUser) => void; meEmail: string }) {
  const toast = useToast();
  const [users, setUsers] = useState<DeveloperUserRow[] | null>(null);
  const [roles, setRoles] = useState<RoleBrief[]>([]);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ email: '', fullName: '', roleCode: 'DEVELOPER', password: '' });

  const load = useCallback(async () => {
    const [u, r] = await Promise.all([
      api<{ users: DeveloperUserRow[] }>('/admin/developer/users'),
      api<{ roles: RoleBrief[] }>('/admin/masterdata/roles'),
    ]);
    setUsers(u.users);
    setRoles(r.roles);
  }, []);
  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  async function create() {
    if (!form.email || !form.fullName || !form.password) {
      toast('Complete all fields', 'error');
      return;
    }
    setBusy(true);
    try {
      await api('/admin/developer/users', { method: 'POST', body: form });
      toast('Account created', 'success');
      setForm({ email: '', fullName: '', roleCode: 'DEVELOPER', password: '' });
      setCreating(false);
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Create failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: string) {
    try {
      await api(`/admin/developer/users/${id}`, { method: 'PUT', body: { status } });
      toast(`User ${status.toLowerCase()}`, 'success');
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  }

  async function setRole(id: string, roleCode: string) {
    try {
      await api(`/admin/developer/users/${id}`, { method: 'PUT', body: { roleCode } });
      toast('Role changed', 'success');
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  }

  async function setPassword(id: string, email: string) {
    const password = window.prompt(`New password for ${email}:`);
    if (!password) return;
    try {
      await api(`/admin/developer/users/${id}/password`, { method: 'POST', body: { password } });
      toast('Password set', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  }

  async function revokeSessions(id: string, email: string) {
    if (!window.confirm(`Revoke all active sessions for ${email}? They will be logged out and must log in again.`)) return;
    try {
      await api(`/admin/developer/users/${id}/revoke-sessions`, { method: 'POST' });
      toast(`${email} sessions revoked`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  }

  async function revokeAll() {
    if (!window.confirm('Revoke EVERY session in the system? All users, including you, will be logged out and must log in again.')) return;
    try {
      const res = await api<{ affected: number }>('/admin/developer/users/revoke-all', { method: 'POST' });
      toast(`All ${res.affected} sessions revoked — log in again`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  }

  async function impersonateUser(u: DeveloperUserRow) {
    if (!window.confirm(`Switch your session to ${u.fullName} (${u.email})? You can log out to return to your developer account.`)) return;
    try {
      const res = await api<{ token: string; user: AuthUser }>(`/admin/developer/users/${u.id}/impersonate`, { method: 'POST' });
      onImpersonate(res.token, res.user);
      toast(`Now acting as ${res.user.fullName}`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Impersonation failed', 'error');
    }
  }

  if (!users) return <Spinner label="Loading accounts…" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-3xl text-sm text-slate-500">
          Every account in the system — including NATIONAL_ADMIN and other DEVELOPER accounts. You can create, edit, suspend, reset passwords and <em>log in as</em> any user. Everything is audit-logged.
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => void revokeAll()}>Revoke all sessions</Button>
          <Button size="sm" variant="navy" onClick={() => setCreating((c) => !c)}>Create account</Button>
        </div>
      </div>

      {creating && (
        <Card title="Create account" subtitle="Any role can be granted here, including DEVELOPER and NATIONAL_ADMIN.">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full name"><Input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></Field>
            <Field label="Role">
              <Select value={form.roleCode} onChange={(e) => setForm((f) => ({ ...f, roleCode: e.target.value }))}>
                {roles.map((r) => <option key={r.code} value={r.code}>{r.name} ({r.scope})</option>)}
              </Select>
            </Field>
            <Field label="Password"><Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} autoComplete="new-password" /></Field>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
            <Button variant="green" loading={busy} onClick={() => void create()}>Create account</Button>
          </div>
        </Card>
      )}

      <Card pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
                {['Account', 'Role', 'Scope', 'Facility', 'Status', 'Last login', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3 font-semibold">{h}</th>
                ))}
                <th className="px-5 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-g-mist/40">
                  <td className="px-5 py-2.5">
                    <p className="font-semibold text-g-ink">{u.fullName}{u.email === meEmail && <span className="ml-1.5 text-xs font-normal text-slate-400">(you)</span>}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </td>
                  <td className="px-5 py-2.5">
                    <Select className="max-w-44 py-1.5" value={u.roleCode} onChange={(e) => void setRole(u.id, e.target.value)}>
                      {roles.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
                    </Select>
                  </td>
                  <td className="px-5 py-2.5"><Badge tone={u.roleScope === 'DEVELOPER' ? 'red' : 'navy'}>{u.roleScope}</Badge></td>
                  <td className="px-5 py-2.5 text-slate-500">{u.facility?.name ?? '—'}</td>
                  <td className="px-5 py-2.5"><Badge tone={u.status === 'ACTIVE' ? 'green' : u.status === 'LOCKED' ? 'red' : 'gold'}>{u.status}</Badge></td>
                  <td className="px-5 py-2.5 text-slate-400">{u.lastLoginAt ? fmtDateTime(u.lastLoginAt) : '—'}</td>
                  <td className="px-5 py-2.5">
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      <button onClick={() => void impersonateUser(u)} disabled={u.email === meEmail} className="cursor-pointer text-xs font-bold text-g-red hover:underline disabled:cursor-not-allowed disabled:text-slate-300">Log in as</button>
                      <button onClick={() => void setPassword(u.id, u.email)} className="cursor-pointer text-xs font-bold text-g-navy hover:underline">Password</button>
                      {u.status === 'ACTIVE' ? (
                        <button onClick={() => void setStatus(u.id, 'SUSPENDED')} className="cursor-pointer text-xs font-bold text-g-gold hover:underline">Suspend</button>
                      ) : (
                        <button onClick={() => void setStatus(u.id, 'ACTIVE')} className="cursor-pointer text-xs font-bold text-g-green hover:underline">Activate</button>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    <button onClick={() => void revokeSessions(u.id, u.email)} className="cursor-pointer text-xs font-bold text-slate-400 hover:text-g-red hover:underline">Revoke sessions</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------- security
function SecurityTab() {
  const toast = useToast();
  const [security, setSecurity] = useState<{ passwordMinLength: number; lockoutThreshold: number; sessionTtlHours: number; alertPhone: string; alertWhatsApp: string; alertEmail: string; escalationEmail: string; alertWebhook: string; retentionDays: number; alertRetentionDays: number; emailMinSeverity: string; retryMaxAttempts: number; alertDaysBefore: number } | null>(null);
  const [lockouts, setLockouts] = useState<LockoutsOverview | null>(null);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testingWa, setTestingWa] = useState(false);
  const [unlocking, setUnlocking] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [sec, loc, overview] = await Promise.all([
      api<{ security: { passwordMinLength: { value: number }; lockoutThreshold: { value: number }; sessionTtlHours: { value: number } } }>('/admin/developer/security'),
      api<LockoutsOverview>('/admin/developer/lockouts'),
      api<DeveloperOverview>('/admin/developer/overview'),
    ]);
    setSecurity({
      passwordMinLength: sec.security.passwordMinLength.value,
      lockoutThreshold: sec.security.lockoutThreshold.value,
      sessionTtlHours: sec.security.sessionTtlHours.value,
      alertPhone: overview.settings.alertPhone,
      alertWhatsApp: overview.settings.alertWhatsApp,
      alertEmail: overview.settings.alertEmail,
      escalationEmail: overview.settings.escalationEmail,
      alertWebhook: overview.settings.alertWebhook,
      retentionDays: overview.settings.retentionDays,
      alertRetentionDays: overview.settings.alertRetentionDays,
      emailMinSeverity: overview.settings.emailMinSeverity,
      retryMaxAttempts: overview.settings.retryMaxAttempts,
      alertDaysBefore: overview.settings.alertDaysBefore,
    });
    setLockouts(loc);
  }, []);
  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  async function save() {
    if (!security) return;
    setBusy(true);
    try {
      await Promise.all([
        api('/admin/developer/security', { method: 'PUT', body: { passwordMinLength: security.passwordMinLength, lockoutThreshold: security.lockoutThreshold, sessionTtlHours: security.sessionTtlHours } }),
        api('/admin/settings', { method: 'PUT', body: { updates: [{ key: 'security.alertPhone', value: security.alertPhone }, { key: 'security.alertWhatsApp', value: security.alertWhatsApp }, { key: 'security.alertEmail', value: security.alertEmail }, { key: 'security.escalationEmail', value: security.escalationEmail }, { key: 'security.alertWebhook', value: security.alertWebhook }, { key: 'alerts.retentionDays', value: String(security.alertRetentionDays) }, { key: 'alerts.emailMinSeverity', value: security.emailMinSeverity }, { key: 'alerts.retryMaxAttempts', value: String(security.retryMaxAttempts) }, { key: 'license.alertDaysBefore', value: String(security.alertDaysBefore) }] } }),
      ]);
      toast('Security policy updated', 'success');
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setTesting(true);
    try {
      await api('/admin/developer/alerts/test', { method: 'POST' });
      toast('Test alert sent — check the bell, SMS and webhook', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Test alert failed', 'error');
    } finally {
      setTesting(false);
    }
  }

  async function sendTestWa() {
    setTestingWa(true);
    try {
      const res = await api<{ sent: boolean; message: string }>('/admin/developer/alerts/test-whatsapp', { method: 'POST' });
      toast(res.message, res.sent ? 'success' : 'error');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Test WhatsApp failed', 'error');
    } finally {
      setTestingWa(false);
    }
  }

  async function unlock(id: string, email: string) {
    if (!window.confirm(`Unlock ${email}? The account returns to ACTIVE with the failure counter reset.`)) return;
    setUnlocking(id);
    try {
      await api(`/admin/developer/users/${id}/unlock`, { method: 'POST' });
      toast(`${email} unlocked`, 'success');
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Unlock failed', 'error');
    } finally {
      setUnlocking(null);
    }
  }

  if (!security) return <Spinner label="Loading security policy…" />;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Account security policy" subtitle="All three are enforced: the password minimum on every set/reset, the lockout threshold at login (locks for 15 minutes), and the session TTL on every new token.">
          <div className="space-y-4">
            <Field label="Minimum password length" hint="4–64 characters. Applied to every password change and account creation.">
              <Input type="number" min={4} max={64} value={security.passwordMinLength} onChange={(e) => setSecurity((s) => s && { ...s, passwordMinLength: Number(e.target.value) })} />
            </Field>
            <Field label="Login lockout threshold" hint="Consecutive failed attempts before an account is locked (1–20).">
              <Input type="number" min={1} max={20} value={security.lockoutThreshold} onChange={(e) => setSecurity((s) => s && { ...s, lockoutThreshold: Number(e.target.value) })} />
            </Field>
            <Field label="Session TTL (hours)" hint="How long a login token stays valid before re-authentication is required (1–720).">
              <Input type="number" min={1} max={720} value={security.sessionTtlHours} onChange={(e) => setSecurity((s) => s && { ...s, sessionTtlHours: Number(e.target.value) })} />
            </Field>
            <Field label="Security alert phone" hint="Ghana mobile number for SMS alerts on lockout incidents and license events. Requires SMS gateway credentials.">
              <Input value={security.alertPhone} onChange={(e) => setSecurity((s) => s && { ...s, alertPhone: e.target.value })} placeholder="+233240000000" />
            </Field>
            <Field label="Security alert WhatsApp" hint="Ghana mobile number for WhatsApp alerts on lockout incidents and license events. Requires the WhatsApp provider under Settings → SMS. Empty = disabled.">
              <Input value={security.alertWhatsApp} onChange={(e) => setSecurity((s) => s && { ...s, alertWhatsApp: e.target.value })} placeholder="+233240000000" />
            </Field>
            <Field label="Security alert email" hint="Recipient address for email alerts (lockouts, license events, the daily digest). Requires SMTP credentials under Settings → Email. Empty = email disabled.">
              <Input type="email" value={security.alertEmail} onChange={(e) => setSecurity((s) => s && { ...s, alertEmail: e.target.value })} placeholder="ops@facility.gov.gh" />
            </Field>
            <Field label="Escalation (on-call) email" hint="Second recipient emailed ONLY on critical alerts (lockouts, lapsed license) and critical digests — for on-call coverage outside office hours. Independent of the minimum-severity gate. Empty = disabled.">
              <Input type="email" value={security.escalationEmail} onChange={(e) => setSecurity((s) => s && { ...s, escalationEmail: e.target.value })} placeholder="oncall@facility.gov.gh" />
            </Field>
            <Field label="Security alert webhook" hint="Optional POST URL that receives lockout / license alerts as JSON. Empty = webhook disabled.">
              <Input value={security.alertWebhook} onChange={(e) => setSecurity((s) => s && { ...s, alertWebhook: e.target.value })} placeholder="https://hooks.example.com/security" />
            </Field>
            <Field label="Alert retention (days)" hint="Inbox rows older than this are pruned by the daily sweep (and the prune button on the Alerts tab). Default 365.">
              <Input type="number" min={1} max={3650} value={security.alertRetentionDays} onChange={(e) => setSecurity((s) => s && { ...s, alertRetentionDays: Number(e.target.value) })} />
            </Field>
            <Field label="Email minimum severity" hint="Only alerts at or above this severity are emailed — mute routine info alerts, keep critical ones. Applies to the daily digest email too.">
              <Select value={security.emailMinSeverity} onChange={(e) => setSecurity((s) => s && { ...s, emailMinSeverity: e.target.value })}>
                <option value="info">Info — email everything</option>
                <option value="warning">Warning — email warnings + critical</option>
                <option value="critical">Critical — email only critical</option>
              </Select>
            </Field>
            <Field label="Delivery retry attempts" hint="Failed email/SMS alert dispatches are queued and retried with backoff (30 min → 24h) up to this many attempts. Default 4.">
              <Input type="number" min={1} max={20} value={security.retryMaxAttempts} onChange={(e) => setSecurity((s) => s && { ...s, retryMaxAttempts: Number(e.target.value) })} />
            </Field>
            <Field label="License expiry alert window (days)" hint="Alert the developer when the license is within this many days of expiring (daily sweep, deduped to once per 24h).">
              <Input type="number" min={1} max={365} value={security.alertDaysBefore} onChange={(e) => setSecurity((s) => s && { ...s, alertDaysBefore: Number(e.target.value) })} />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="outline" loading={testing} onClick={() => void sendTest()}>Send test alert</Button>
              <Button variant="outline" loading={testingWa} onClick={() => void sendTestWa()}>Test WhatsApp alert</Button>
              <Button variant="navy" loading={busy} onClick={() => void save()}>Save security policy</Button>
            </div>
          </div>
        </Card>
        <Card title="What this controls" subtitle="The DEVELOPER scope is the only authority above the security policy — it cannot be edited by any admin.">
          <ul className="space-y-2.5 text-sm text-slate-600">
            <li className="flex gap-2"><span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-g-red" />The DEVELOPER scope bypasses every permission guard (it is not a permission that can be granted or removed — admins are rejected with 403).</li>
            <li className="flex gap-2"><span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-g-red" />Password-policy changes are effective immediately, without a restart, for all roles.</li>
            <li className="flex gap-2"><span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-g-red" />Lockout: repeated failed logins lock the account for 15 minutes (threshold editable here).</li>
            <li className="flex gap-2"><span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-g-red" />Session TTL: tokens issued after a change expire after the configured hours.</li>
            <li className="flex gap-2"><span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-g-red" />Every security change is recorded in the audit trail with the acting developer's identity.</li>
          </ul>
        </Card>
      </div>

      <Card title="Locked accounts" subtitle="Accounts currently locked by the threshold policy (or manually). One click unlocks — suspensions stay in the Users tab." pad={false}>
        {!lockouts ? (
          <div className="px-5 py-8"><Spinner label="Loading lockouts…" /></div>
        ) : lockouts.locked.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-400">No locked accounts right now.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
                  {['Account', 'Role', 'Attempts', 'Locked until', ''].map((h) => (
                    <th key={h} className="px-5 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {lockouts.locked.map((u) => (
                  <tr key={u.id} className="hover:bg-g-mist/40">
                    <td className="px-5 py-2.5">
                      <p className="font-semibold text-g-ink">{u.fullName}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </td>
                    <td className="px-5 py-2.5">
                      <Badge tone={u.roleCode === 'DEVELOPER' ? 'red' : 'navy'}>{u.roleCode}</Badge>
                    </td>
                    <td className="px-5 py-2.5 tabular-nums text-slate-500">{u.failedLoginAttempts}</td>
                    <td className="px-5 py-2.5 text-slate-400">
                      {u.lockedUntil ? (
                        new Date(u.lockedUntil).getTime() <= Date.now() ? (
                          <Badge tone="gold">EXPIRED · clears on next login</Badge>
                        ) : (
                          <span className="tabular-nums">{fmtDateTime(u.lockedUntil)}</span>
                        )
                      ) : (
                        <Badge tone="red">MANUAL</Badge>
                      )}
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <button onClick={() => void unlock(u.id, u.email)} disabled={unlocking === u.id} className="cursor-pointer text-xs font-bold text-g-green hover:underline disabled:text-slate-300">
                        {unlocking === u.id ? 'Unlocking…' : 'Unlock'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {lockouts && lockouts.recentEvents.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Recent lockout events</p>
            <ul className="space-y-1">
              {lockouts.recentEvents.slice(0, 6).map((e) => (
                <li key={e.id} className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-g-red" />
                  <span className="tabular-nums text-slate-400">{fmtDateTime(e.at)}</span>
                  <span className="font-mono">{e.email ?? e.actorEmail ?? 'unknown'}</span>
                  <span>locked at {e.attempts ?? '?'} attempts</span>
                  <span className="ml-auto font-mono text-slate-300">{e.ip ?? ''}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------- licensing
function LicensingTab() {
  const toast = useToast();
  const [license, setLicense] = useState<LicenseStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ key: '', edition: 'ENTERPRISE', expiresAt: '', maxFacilities: '1000', maxUsers: '5000' });

  const load = useCallback(async () => {
    const res = await api<{ license: LicenseStatus }>('/admin/developer/license');
    setLicense(res.license);
  }, []);
  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  async function activate() {
    if (!form.key || !form.expiresAt) {
      toast('License key and expiry date are required', 'error');
      return;
    }
    setBusy(true);
    try {
      await api('/admin/developer/license/activate', { method: 'POST', body: form });
      toast('License activated', 'success');
      setForm({ key: '', edition: 'ENTERPRISE', expiresAt: '', maxFacilities: '1000', maxUsers: '5000' });
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Activation failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function deactivate() {
    if (!window.confirm('Deactivate the license? The system will run in trial/unlicensed mode and enforcement will apply.')) return;
    setBusy(true);
    try {
      await api('/admin/developer/license/deactivate', { method: 'POST' });
      toast('License deactivated', 'success');
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  if (!license) return <Spinner label="Loading license…" />;
  const l = license;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Current license">
        <dl className="space-y-2.5 text-sm">
          <div className="flex justify-between"><dt className="text-slate-400">Status</dt><dd><Badge tone={l.activated ? (l.expired ? 'red' : 'green') : 'gold'}>{l.activated ? (l.expired ? 'EXPIRED' : 'ACTIVE') : 'TRIAL / UNLICENSED'}</Badge></dd></div>
          {l.edition && <div className="flex justify-between"><dt className="text-slate-400">Edition</dt><dd className="font-semibold text-g-ink">{l.edition}</dd></div>}
          {l.keySuffix && <div className="flex justify-between"><dt className="text-slate-400">Key</dt><dd className="font-mono text-xs">••••••••{l.keySuffix}</dd></div>}
          {l.expiresAt && <div className="flex justify-between"><dt className="text-slate-400">Expires</dt><dd className="tabular-nums">{fmtDateTime(l.expiresAt)}{l.daysLeft !== null && <span className="text-slate-400"> · {l.daysLeft}d left</span>}</dd></div>}
          <div className="flex justify-between"><dt className="text-slate-400">Facilities</dt><dd className="tabular-nums">{l.facilities.used} / {l.facilities.max ?? '∞'}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-400">Users</dt><dd className="tabular-nums">{l.users.used} / {l.users.max ?? '∞'}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-400">Compliance</dt><dd><Badge tone={l.compliant ? 'green' : 'red'}>{l.compliant ? 'COMPLIANT' : 'NON-COMPLIANT'}</Badge></dd></div>
        </dl>
        {l.limitsExceeded.length > 0 && (
          <div className="mt-3 rounded-lg border border-g-red/30 bg-g-red/10 px-4 py-2.5 text-xs font-semibold text-g-red">
            Limits exceeded: {l.limitsExceeded.join(', ')} — new {l.limitsExceeded.some((x) => x.includes('facilit')) ? 'facilities' : 'users'} are being blocked.
          </div>
        )}
        {l.activated && (
          <Button variant="danger" className="mt-4" loading={busy} onClick={() => void deactivate()}>Deactivate license</Button>
        )}
      </Card>
      <Card title="Activate a license" subtitle="Set the edition, expiry and capacity limits. Enforcement blocks creation above the limits.">
        <div className="space-y-4">
          <Field label="License key"><Input value={form.key} onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))} placeholder="GIHM-XXXX-XXXX-XXXX" className="font-mono" /></Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Edition">
              <Select value={form.edition} onChange={(e) => setForm((f) => ({ ...f, edition: e.target.value }))}>
                <option value="ENTERPRISE">ENTERPRISE</option>
                <option value="PRO">PRO</option>
                <option value="COMMUNITY">COMMUNITY</option>
              </Select>
            </Field>
            <Field label="Expiry date"><Input type="date" value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} /></Field>
            <Field label="Max facilities (0 = unlimited)"><Input type="number" min={0} value={form.maxFacilities} onChange={(e) => setForm((f) => ({ ...f, maxFacilities: e.target.value }))} /></Field>
            <Field label="Max users (0 = unlimited)"><Input type="number" min={0} value={form.maxUsers} onChange={(e) => setForm((f) => ({ ...f, maxUsers: e.target.value }))} /></Field>
          </div>
          <div className="flex justify-end">
            <Button variant="green" loading={busy} onClick={() => void activate()}>Activate license</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ------------------------------------------------------------------- audit
function AuditTab() {
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [filters, setFilters] = useState({ action: '', actor: '', entityType: '', entityId: '', from: '', to: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (f: typeof filters) => {
    setBusy(true);
    try {
      const qs = new URLSearchParams(Object.fromEntries(Object.entries(f).filter(([, v]) => v)));
      const res = await api<{ entries: AuditEntry[] }>(`/admin/developer/audit?${qs}`.replace(/\?$/, ''));
      setEntries(res.entries);
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    void load(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function apply() {
    void load(filters);
  }

  async function exportCsv() {
    try {
      const qs = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)));
      qs.set('format', 'csv');
      const q = qs.toString();
      await downloadFile(`/admin/developer/audit${q ? `?${q}` : ''}`, 'developer-audit.csv');
    } catch (err) {
      console.error('[developer-audit] export failed', err);
    }
  }

  return (
    <div className="space-y-3">
      <Card title="Full audit trail" subtitle="Every action in the system, including developer operations. Filter by action prefix, actor, entity type, id or a date range.">
        <div className="grid gap-3 md:grid-cols-6">
          <Field label="Action"><Input placeholder="e.g. developer, masterdata" value={filters.action} onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))} /></Field>
          <Field label="Actor email"><Input placeholder="contains…" value={filters.actor} onChange={(e) => setFilters((f) => ({ ...f, actor: e.target.value }))} /></Field>
          <Field label="Entity type"><Input placeholder="user, facility…" value={filters.entityType} onChange={(e) => setFilters((f) => ({ ...f, entityType: e.target.value }))} /></Field>
          <Field label="Entity id"><Input placeholder="exact id…" value={filters.entityId} onChange={(e) => setFilters((f) => ({ ...f, entityId: e.target.value }))} /></Field>
          <Field label="From"><Input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} /></Field>
          <Field label="To"><Input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} /></Field>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="navy" loading={busy} onClick={() => void apply()}>Apply filters</Button>
          <Button variant="outline" onClick={() => void exportCsv()}>Export CSV</Button>
        </div>
      </Card>
      {!entries ? (
        <Spinner label="Loading audit trail…" />
      ) : entries.length === 0 ? (
        <EmptyState icon="shield" title="No matching entries" message="Try widening the filters." />
      ) : (
        <Card pad={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
                  {['When', 'Actor', 'Action', 'Entity', 'IP'].map((h) => (
                    <th key={h} className="px-5 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {entries.map((a) => (
                  <tr key={a.id} className="hover:bg-g-mist/40">
                    <td className="px-5 py-2.5 whitespace-nowrap text-slate-400">{fmtDateTime(a.createdAt)}</td>
                    <td className="px-5 py-2.5">
                      <p className="font-semibold text-g-ink">{a.actorEmail ?? 'system'}</p>
                      <p className="text-xs text-slate-400">{a.role ?? ''}</p>
                    </td>
                    <td className="px-5 py-2.5"><Badge tone="navy">{a.action}</Badge></td>
                    <td className="px-5 py-2.5 text-slate-500">{a.entityType ?? '—'}{a.entityId && <span className="font-mono text-xs text-slate-300"> · {a.entityId.slice(0, 8)}</span>}</td>
                    <td className="px-5 py-2.5 font-mono text-xs text-slate-400">{a.ip ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ alerts
function AlertsTab() {
  const toast = useToast();
  const [inbox, setInbox] = useState<SecurityAlertInbox | null>(null);
  const [eventFilter, setEventFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [busy, setBusy] = useState(false);
  const [pruning, setPruning] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [testingEsc, setTestingEsc] = useState(false);
  const [detail, setDetail] = useState<{ id: string; data: SecurityAlertDetail } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deliveryFilter, setDeliveryFilter] = useState('');
  // Latest-request guard: a slower in-flight fetch must never overwrite a
  // newer one (e.g. the initial load racing a dropdown filter change).
  const latestReq = useRef(0);

  const load = useCallback(async (event = '', severity = '') => {
    const reqId = ++latestReq.current;
    setBusy(true);
    try {
      const params = new URLSearchParams();
      if (event) params.set('event', event);
      if (severity) params.set('severity', severity);
      const qs = params.toString();
      const res = await api<SecurityAlertInbox>(`/admin/developer/alerts${qs ? `?${qs}` : ''}`);
      if (reqId === latestReq.current) setInbox(res);
    } finally {
      if (reqId === latestReq.current) setBusy(false);
    }
  }, []);
  useEffect(() => {
    void load().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function markRead(id: string) {
    await api(`/admin/developer/alerts/${id}/read`, { method: 'POST' }).catch((e) => toast(e instanceof Error ? e.message : 'Failed', 'error'));
    void load(eventFilter, severityFilter);
  }

  async function markAll() {
    if (!inbox || inbox.unread === 0) return;
    await api('/admin/developer/alerts/read-all', { method: 'POST' }).catch((e) => toast(e instanceof Error ? e.message : 'Failed', 'error'));
    void load(eventFilter, severityFilter);
  }

  async function exportCsv() {
    try {
      const params = new URLSearchParams();
      if (eventFilter) params.set('event', eventFilter);
      if (severityFilter) params.set('severity', severityFilter);
      params.set('format', 'csv');
      await downloadFile(`/admin/developer/alerts?${params.toString()}`, 'security-alerts.csv');
    } catch (err) {
      console.error('[developer-alerts] export failed', err);
    }
  }

  async function prune() {
    if (!window.confirm('Delete alert inbox rows older than the retention window (alerts.retentionDays, default 365)? This cannot be undone.')) return;
    setPruning(true);
    try {
      const res = await api<{ deleted: number }>('/admin/developer/alerts/prune', { method: 'POST' });
      toast(`${res.deleted} old alert${res.deleted === 1 ? '' : 's'} pruned`, 'success');
      void load(eventFilter, severityFilter);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Prune failed', 'error');
    } finally {
      setPruning(false);
    }
  }

  async function retryNow() {
    setRetrying(true);
    try {
      const res = await api<{ retried: number; delivered: number; failed: number }>('/admin/developer/alerts/retry-sweep', { method: 'POST' });
      if (res.retried === 0) {
        toast('Retry sweep ran — nothing queued to retry', 'success');
      } else {
        toast(`${res.delivered} delivered, ${res.retried - res.delivered} still failing (${res.failed} exhausted) — ${res.retried} attempted`, 'success');
      }
      void load(eventFilter, severityFilter);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Retry sweep failed', 'error');
    } finally {
      setRetrying(false);
    }
  }

  async function testEscalation() {
    setTestingEsc(true);
    try {
      const res = await api<{ sent: boolean; message: string }>('/admin/developer/alerts/test-escalation', { method: 'POST' });
      toast(res.message, res.sent ? 'success' : 'error');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Test escalation failed', 'error');
    } finally {
      setTestingEsc(false);
    }
  }

  async function copyPayload() {
    if (!detail) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(detail.data.alert.payload, null, 2));
      toast('Payload copied to clipboard', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Copy failed', 'error');
    }
  }

  /** Download the full alert + delivery history as JSON for the record. */
  function downloadJson() {
    if (!detail) return;
    const blob = new Blob([JSON.stringify(detail.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-alert-${detail.data.alert.id}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  /** Click a row to expand its fan-out detail (payload + per-recipient delivery). */
  async function toggleDetail(a: SecurityAlertRow) {
    if (detail?.id === a.id) {
      setDetail(null);
      return;
    }
    setDeliveryFilter(''); // a stale filter must never hide rows of the newly opened alert
    setDetailLoading(true);
    try {
      const d = await api<SecurityAlertDetail>(`/admin/developer/alerts/${a.id}`);
      setDetail({ id: a.id, data: d });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to load alert detail', 'error');
    } finally {
      setDetailLoading(false);
    }
  }

  const EVENTS = ['lockout', 'license.activate', 'license.deactivate', 'license.expiring', 'license.expired', 'digest', 'test'];

  const SEVERITY_TONE: Record<string, 'red' | 'gold' | 'gray'> = {
    critical: 'red',
    warning: 'gold',
    info: 'gray',
  };

  return (
    <div className="space-y-3">
      <Card title="Security alert inbox" subtitle="Every lockout and license event, persisted from the header bell. Filter by event, acknowledge, or export as CSV.">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Event">
              <Select value={eventFilter} onChange={(e) => { setEventFilter(e.target.value); void load(e.target.value, severityFilter); }} className="min-w-48">
                <option value="">All events</option>
                {EVENTS.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
              </Select>
            </Field>
            <Field label="Severity">
              <Select value={severityFilter} onChange={(e) => { setSeverityFilter(e.target.value); void load(eventFilter, e.target.value); }} className="min-w-36">
                <option value="">All severities</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </Select>
            </Field>
            <Button variant="outline" loading={busy} onClick={() => void load(eventFilter, severityFilter)}>Refresh</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" loading={retrying} onClick={() => void retryNow()}>Run retry sweep</Button>
            <Button variant="outline" loading={testingEsc} onClick={() => void testEscalation()}>Test escalation</Button>
            <Button variant="outline" loading={pruning} onClick={() => void prune()}>Prune old alerts</Button>
            <Button variant="outline" onClick={() => void exportCsv()}>Export CSV</Button>
            <Button variant="navy" onClick={() => void markAll()} disabled={!inbox || inbox.unread === 0}>Mark all read ({inbox?.unread ?? 0})</Button>
          </div>
        </div>
      </Card>
      {inbox && inbox.deliveryStats && (
        <div className="grid gap-3 sm:grid-cols-3">
          {inbox.deliveryStats.map((c) => (
            <div key={c.channel} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{c.channel}</p>
                <p className="text-sm text-slate-500">
                  {c.delivered} delivered · {c.pending} retrying
                  {c.exhausted > 0 && <span className="font-semibold text-g-red"> · {c.exhausted} exhausted</span>}
                </p>
              </div>
              <Badge tone={c.exhausted > 0 ? 'red' : c.pending > 0 ? 'gold' : 'green'}>{c.total}</Badge>
            </div>
          ))}
        </div>
      )}
      {!inbox ? (
        <Spinner label="Loading alerts…" />
      ) : inbox.alerts.length === 0 ? (
        <EmptyState icon="bell" title="No alerts" message="Security events will appear here as they happen." />
      ) : (
        <Card pad={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
                  {['When', 'Severity', 'Event', 'Title', 'Message', 'Status', ''].map((h) => (
                    <th key={h} className="px-5 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {inbox.alerts.map((a) => (
                  <Fragment key={a.id}>
                    <tr
                      onClick={() => void toggleDetail(a)}
                      className={`cursor-pointer transition-colors hover:bg-g-mist/40 ${a.read ? 'opacity-60' : ''}`}
                      title="Click for fan-out detail"
                    >
                      <td className="px-5 py-2.5 whitespace-nowrap text-slate-400">{fmtDateTime(a.createdAt)}</td>
                      <td className="px-5 py-2.5"><Badge tone={SEVERITY_TONE[a.severity] ?? 'gray'}>{a.severity.toUpperCase()}</Badge></td>
                      <td className="px-5 py-2.5"><Badge tone={a.event === 'lockout' ? 'red' : a.event === 'digest' ? 'navy' : a.event === 'test' ? 'navy' : 'gold'}>{a.event}</Badge></td>
                      <td className="px-5 py-2.5 font-semibold text-g-ink">{a.title}</td>
                      <td className="px-5 py-2.5 text-slate-500">{a.message}</td>
                      <td className="px-5 py-2.5"><Badge tone={a.read ? 'gray' : 'green'}>{a.read ? 'READ' : 'NEW'}</Badge></td>
                      <td className="px-5 py-2.5 text-right">
                        <span className="mr-3 text-xs text-slate-300">{detail?.id === a.id ? '▲' : '▼'}</span>
                        {!a.read && (
                          <button
                            onClick={(e) => { e.stopPropagation(); void markRead(a.id); }}
                            className="cursor-pointer text-xs font-bold text-g-navy hover:underline"
                          >
                            Mark read
                          </button>
                        )}
                      </td>
                    </tr>
                    {detail?.id === a.id && (
                      <tr className="bg-g-mist/30">
                        <td colSpan={7} className="px-5 py-4">
                          {detailLoading ? (
                            <Spinner label="Loading fan-out detail…" />
                          ) : (
                            <div className="grid gap-4 lg:grid-cols-2">
                              <div>
                                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Payload</p>
                                  <div className="flex gap-1.5">
                                    <Button size="sm" variant="outline" onClick={() => void copyPayload()}>Copy payload</Button>
                                    <Button size="sm" variant="outline" onClick={() => void downloadJson()}>Download JSON</Button>
                                  </div>
                                </div>
                                <pre className="max-h-56 overflow-auto rounded-lg border border-slate-200 bg-white p-3 font-mono text-[11px] leading-relaxed text-slate-600">
                                  {JSON.stringify(detail.data.alert.payload, null, 2)}
                                </pre>
                              </div>
                              <div>
                                <div className="mb-2 flex items-center justify-between gap-2">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Fan-out · per-recipient delivery</p>
                                  <Input
                                    value={deliveryFilter}
                                    onChange={(e) => setDeliveryFilter(e.target.value)}
                                    placeholder="Filter channel, recipient, status…"
                                    className="max-w-48 py-1 text-xs"
                                  />
                                </div>
                                {detail.data.deliveries.length === 0 ? (
                                  <p className="rounded-lg border border-slate-200 bg-white px-3 py-4 text-sm text-slate-400">
                                    No failed outbound dispatches for this alert — every configured channel delivered (or none were configured).
                                  </p>
                                ) : (
                                  <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                                    <table className="w-full text-left text-xs">
                                      <thead>
                                        <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-400">
                                          {['Channel', 'Recipient', 'Status', 'Attempts', 'Delivered', 'Last error'].map((h) => (
                                            <th key={h} className="px-3 py-2 font-semibold">{h}</th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-50">
                                        {(() => {
                                          const q = deliveryFilter.trim().toLowerCase();
                                          const visible = q
                                            ? detail.data.deliveries.filter((d) =>
                                                [d.channel, d.to, d.status, d.lastError ?? ''].some((v) => v.toLowerCase().includes(q)),
                                              )
                                            : detail.data.deliveries;
                                          if (visible.length === 0) {
                                            return (
                                              <tr><td colSpan={6} className="px-3 py-4 text-center text-xs text-slate-400">No deliveries match the filter.</td></tr>
                                            );
                                          }
                                          return visible.map((d) => (
                                            <tr key={d.id}>
                                              <td className="px-3 py-2 font-bold uppercase text-slate-500">{d.channel}</td>
                                              <td className="max-w-40 truncate px-3 py-2 font-mono text-slate-600" title={d.to}>{d.to}</td>
                                              <td className="px-3 py-2"><Badge tone={d.status === 'DELIVERED' ? 'green' : d.status === 'RETRYING' ? 'gold' : 'gray'}>{d.status}</Badge></td>
                                              <td className="px-3 py-2 tabular-nums text-slate-500">{d.attempts}</td>
                                              <td className="px-3 py-2 text-slate-500">{d.deliveredAt ? fmtDateTime(d.deliveredAt) : '—'}</td>
                                              <td className="max-w-48 truncate px-3 py-2 text-slate-400" title={d.lastError ?? ''}>{d.lastError ?? '—'}</td>
                                            </tr>
                                          ));
                                        })()}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- issued licenses
function IssuedLicensesTab() {
  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setLicenses(getAllLicenses());
  }, []);

  function copyKey(key: string, id: string) {
    navigator.clipboard.writeText(key).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  const filtered = licenses.filter((l) => {
    if (filter && !l.facilityName.toLowerCase().includes(filter.toLowerCase()) && !l.contactEmail.toLowerCase().includes(filter.toLowerCase()) && !l.key.toLowerCase().includes(filter.toLowerCase())) return false;
    if (statusFilter && l.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    total: licenses.length,
    active: licenses.filter((l) => l.status === 'ACTIVE').length,
    pending: licenses.filter((l) => l.status === 'PENDING').length,
    expired: licenses.filter((l) => l.status === 'EXPIRED').length,
    revenue: licenses.filter((l) => l.status === 'ACTIVE').reduce((sum, l) => sum + l.amountPaid, 0),
  };

  const editionBadge: Record<string, string> = {
    COMMUNITY: 'bg-emerald-100 text-emerald-700',
    PROFESSIONAL: 'bg-blue-100 text-blue-700',
    ENTERPRISE: 'bg-purple-100 text-purple-700',
  };

  const statusBadge: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    PENDING: 'bg-amber-100 text-amber-700',
    EXPIRED: 'bg-red-100 text-red-700',
    REVOKED: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Licenses" value={stats.total} icon="card" tone="navy" />
        <StatCard label="Active" value={stats.active} icon="shield" tone="green" />
        <StatCard label="Pending" value={stats.pending} icon="clock" tone="gold" />
        <StatCard label="Expired" value={stats.expired} icon="alert" tone="red" />
        <StatCard label="Revenue" value={`GH₵ ${stats.revenue.toLocaleString()}`} icon="card" tone="gold" />
      </div>

      <Card title="Issued Licenses" subtitle="All license keys generated from Paystack payments. These are the only keys that can activate the system.">
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <Field label="Search">
            <Input placeholder="Facility, email, or key..." value={filter} onChange={(e) => setFilter(e.target.value)} className="w-64" />
          </Field>
          <Field label="Status">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
              <option value="">All</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="EXPIRED">Expired</option>
              <option value="REVOKED">Revoked</option>
            </Select>
          </Field>
          <Button variant="outline" onClick={() => setLicenses(getAllLicenses())}>Refresh</Button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="No licenses found" message="Licenses are generated automatically when buyers complete payment via Paystack." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-3">Key</th>
                  <th className="py-2 pr-3">Edition</th>
                  <th className="py-2 pr-3">Facility</th>
                  <th className="py-2 pr-3">Contact</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Amount</th>
                  <th className="py-2 pr-3">Activated</th>
                  <th className="py-2 pr-3">Expires</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-g-mist/40">
                    <td className="py-2.5 pr-3">
                      <span className="font-mono text-xs font-bold text-g-ink">{l.key}</span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${editionBadge[l.edition]}`}>{l.edition}</span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <p className="font-semibold text-g-ink">{l.facilityName}</p>
                      <p className="text-[10px] text-slate-400">{l.region}{l.district ? `, ${l.district}` : ''}</p>
                    </td>
                    <td className="py-2.5 pr-3">
                      <p className="text-slate-600">{l.contactName}</p>
                      <p className="text-[10px] text-slate-400">{l.contactEmail}</p>
                      <p className="text-[10px] text-slate-400">{l.contactPhone}</p>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusBadge[l.status]}`}>{l.status}</span>
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums text-slate-600">GH₵ {l.amountPaid.toLocaleString()}</td>
                    <td className="py-2.5 pr-3 text-xs text-slate-500">{l.activatedAt ? fmtDateTime(l.activatedAt) : '—'}</td>
                    <td className="py-2.5 pr-3 text-xs text-slate-500">{new Date(l.expiresAt).toLocaleDateString()}</td>
                    <td className="py-2.5 text-right">
                      <button onClick={() => copyKey(l.key, l.id)} className="text-xs font-bold text-g-navy hover:underline">
                        {copiedId === l.id ? '✓ Copied' : 'Copy Key'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ------------------------------------------------------------------- system
function SystemTab() {
  const [info, setInfo] = useState<DevSystemInfo | null>(null);
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [settings, setSettings] = useState<{ alertPhone: string; alertWhatsApp: string; alertWebhook: string; retentionDays: number; alertDaysBefore: number } | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    const [i, d, o] = await Promise.all([
      api<DevSystemInfo>('/admin/developer/system'),
      api<{ devices: Device[] }>('/admin/developer/devices'),
      api<DeveloperOverview>('/admin/developer/overview'),
    ]);
    setInfo(i);
    setDevices(d.devices);
    setSettings(o.settings);
  }, []);
  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  async function deviceStatus(deviceId: string, status: string) {
    try {
      await api(`/admin/developer/devices/${deviceId}/status`, { method: 'POST', body: { status } });
      toast(`Device ${status.toLowerCase()}`, 'success');
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  }

  if (!info || !devices) return <Spinner label="Loading system info…" />;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Runtime">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-400">Node</dt><dd className="font-mono text-xs">{info.runtime.node}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">Platform</dt><dd className="font-mono text-xs">{info.runtime.platform} / {info.runtime.arch}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">Environment</dt><dd><Badge tone={info.runtime.nodeEnv === 'production' ? 'red' : 'gold'}>{info.runtime.nodeEnv}</Badge></dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">PID</dt><dd className="font-mono text-xs">{info.runtime.pid}</dd></div>
            {settings && (
              <>
                <div className="flex justify-between"><dt className="text-slate-400">Audit retention</dt><dd className="font-semibold tabular-nums">{settings.retentionDays} days</dd></div>
                <div className="flex justify-between"><dt className="text-slate-400">Alert phone</dt><dd className="font-mono text-xs">{settings.alertPhone || '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-400">Alert WhatsApp</dt><dd className="font-mono text-xs">{settings.alertWhatsApp || '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-400">Alert webhook</dt><dd className="font-mono text-xs">{settings.alertWebhook || '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-400">Expiry alert window</dt><dd className="font-semibold tabular-nums">{settings.alertDaysBefore} days</dd></div>
              </>
            )}
          </dl>
        </Card>
        <Card title="Record counts">
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(info.counts).map(([k, v]) => (
              <div key={k} className="rounded-lg bg-g-mist/50 px-3 py-2">
                <p className="text-lg font-bold text-g-ink tabular-nums">{v}</p>
                <p className="text-[10px] uppercase tracking-wide text-slate-400">{k}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card title="Configuration sources" subtitle="Which env vars are read at boot, and whether the runtime settings store has a live override." pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
                {['Key', 'Env var', 'Group', 'Source', 'Secret', 'Configured'].map((h) => (
                  <th key={h} className="px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {info.env.map((e) => (
                <tr key={e.key} className="hover:bg-g-mist/40">
                  <td className="px-5 py-2 font-mono text-xs text-g-ink">{e.key}</td>
                  <td className="px-5 py-2 font-mono text-xs text-slate-400">{e.env}</td>
                  <td className="px-5 py-2"><Badge tone="navy">{e.group}</Badge></td>
                  <td className="px-5 py-2"><Badge tone={e.source === 'custom' ? 'green' : e.source === 'env' ? 'gold' : 'gray'}>{e.source}</Badge></td>
                  <td className="px-5 py-2">{e.secret ? <Badge tone="red">yes</Badge> : <Badge tone="gray">no</Badge>}</td>
                  <td className="px-5 py-2">{e.configured ? <Badge tone="green">yes</Badge> : <Badge tone="gray">no</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Devices" subtitle="Block or retire any device, including admin workstations." pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
                {['Device', 'Platform', 'Status', 'Last seen', ''].map((h) => (
                  <th key={h} className="px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {devices.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-6 text-center text-sm text-slate-400">No devices registered.</td></tr>
              )}
              {devices.map((d) => (
                <tr key={d.id} className="hover:bg-g-mist/40">
                  <td className="px-5 py-2.5">
                    <p className="font-semibold text-g-ink">{d.name}</p>
                    <p className="font-mono text-xs text-slate-400">{d.deviceId}</p>
                  </td>
                  <td className="px-5 py-2.5"><Badge tone={d.platform === 'WINDOWS' ? 'navy' : d.platform === 'ANDROID' ? 'green' : 'gray'}>{d.platform}</Badge></td>
                  <td className="px-5 py-2.5"><Badge tone={d.status === 'ACTIVE' ? 'green' : 'red'}>{d.status}</Badge></td>
                  <td className="px-5 py-2.5 text-slate-400">{d.lastSeenAt ? fmtDateTime(d.lastSeenAt) : '—'}</td>
                  <td className="px-5 py-2.5 text-right">
                    <div className="flex justify-end gap-2">
                      {d.status === 'ACTIVE' ? (
                        <button onClick={() => void deviceStatus(d.deviceId, 'BLOCKED')} className="cursor-pointer text-xs font-bold text-g-red hover:underline">Block</button>
                      ) : (
                        <button onClick={() => void deviceStatus(d.deviceId, 'ACTIVE')} className="cursor-pointer text-xs font-bold text-g-green hover:underline">Reactivate</button>
                      )}
                      <button onClick={() => void deviceStatus(d.deviceId, 'RETIRED')} className="cursor-pointer text-xs font-bold text-slate-400 hover:underline">Retire</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
