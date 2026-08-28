import { useCallback, useEffect, useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { api } from '../../lib/api';
import type { AuditEntry, Device, FacilityApplication, MpiDuplicatePair, SyncConflictList, SyncConflictRow } from '../../types';
import { CONFLICT_STATUS_LABELS, conflictSummary, parseVersion } from '../../lib/syncConflicts';
import { Badge, Button, Card, EmptyState, PageHeader, Segmented, Spinner, useToast } from '../../components/ui';
import { fmtDateTime, titleCase, ageFromDob } from '../../lib/format';
import { useConnection } from '../../lib/connection';
import { Icon } from '../../components/icons';
import { useAuth } from '../../lib/auth';
import SystemSettings from '../../components/SystemSettings';
import ConfigAudit from '../../components/ConfigAudit';
import DeviceLockSettings from '../../components/DeviceLockSettings';
import LocalBackendCard from '../../components/LocalBackendCard';
import UsersManager from '../../components/UsersManager';
import { EpiScheduleEditor, FacilitiesEditor, RolesEditor } from '../../components/MasterdataEditors';
import UnitsManager from '../../components/UnitsManager';
import StaffManager from '../../components/StaffManager';
import NationalServiceManager from '../../components/NationalServiceManager';

type Tab = 'devices' | 'audit' | 'sync' | 'conflicts' | 'mpi' | 'applications' | 'settings' | 'users' | 'epi' | 'roles' | 'facilities' | 'units' | 'staff' | 'nss' | 'configaudit';

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('devices');
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [audit, setAudit] = useState<AuditEntry[] | null>(null);
  const [pairs, setPairs] = useState<MpiDuplicatePair[] | null>(null);
  const [apps, setApps] = useState<FacilityApplication[] | null>(null);
  const [conflicts, setConflicts] = useState<SyncConflictRow[] | null>(null);
  const [conflictAll, setConflictAll] = useState(false);
  const { pending, lastSyncAt, lastSyncResult, online, serverHealthy, sync } = useConnection();
  const toast = useToast();

  const loadDevices = useCallback(async () => {
    setDevices((await api<{ devices: Device[] }>('/devices')).devices);
  }, []);
  const loadAudit = useCallback(async () => {
    setAudit((await api<{ entries: AuditEntry[] }>('/admin/audit')).entries);
  }, []);
  const loadDuplicates = useCallback(async () => {
    setPairs((await api<{ items: MpiDuplicatePair[] }>('/admin/mpi/duplicates')).items);
  }, []);
  const loadApplications = useCallback(async () => {
    setApps((await api<{ items: FacilityApplication[] }>('/admin/facility-applications?status=ALL')).items);
  }, []);
  const loadConflicts = useCallback(async (all = conflictAll) => {
    setConflicts((await api<SyncConflictList>(`/admin/sync/conflicts${all ? '?all=true' : ''}`)).conflicts);
  }, [conflictAll]);

  useEffect(() => {
    if (tab === 'devices') void loadDevices().catch(() => undefined);
    if (tab === 'audit') void loadAudit().catch(() => undefined);
    if (tab === 'mpi') void loadDuplicates().catch(() => undefined);
    if (tab === 'applications') void loadApplications().catch(() => undefined);
    if (tab === 'conflicts') void loadConflicts().catch(() => undefined);
  }, [tab, loadDevices, loadAudit, loadDuplicates, loadApplications, loadConflicts]);

  async function deviceStatus(deviceId: string, status: string, reason?: string) {
    try {
      await api(`/admin/devices/${deviceId}/status`, { method: 'POST', body: { status, reason } });
      toast(`Device ${status.toLowerCase()}`, 'success');
      void loadDevices();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  }

  async function remoteLogout(deviceId: string) {
    if (!window.confirm('Remotely log this device out? Its current session is voided immediately — the device drops to the login screen on its next contact. It stays enrolled and can be used again after a fresh login.')) return;
    try {
      await api(`/admin/devices/${deviceId}/remote-logout`, { method: 'POST', body: {} });
      toast('Remote logout issued — the device signs out on next contact', 'success');
      void loadDevices();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Remote logout failed', 'error');
    }
  }

  const statusTone = (s: string) =>
    s === 'ACTIVE' ? 'green' as const : s === 'PENDING' ? 'gold' as const : s === 'SUSPENDED' ? 'blue' as const : s === 'RETIRED' ? 'gray' as const : 'red' as const;

  async function merge(sourceId: string, targetId: string) {
    if (!window.confirm('Merge the second record into the first? All clinical records will move to the target. This is reversible via unmerge.')) return;
    try {
      await api(`/admin/mpi/merge/${sourceId}/into/${targetId}`, { method: 'POST', body: { reason: 'Reviewed duplicate — merged by administrator' } });
      toast('Records merged', 'success');
      void loadDuplicates();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Merge failed', 'error');
    }
  }

  async function unmerge(patientId: string) {
    if (!window.confirm('Reverse the most recent merge for this record?')) return;
    try {
      await api(`/admin/mpi/unmerge/${patientId}`, { method: 'POST', body: { reason: 'Administrative reversal' } });
      toast('Records unmerged', 'success');
      void loadDuplicates();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Unmerge failed', 'error');
    }
  }

  async function resolveConflict(id: string, action: 'keep_server' | 'keep_client' | 'manual') {
    let note: string | undefined;
    if (action === 'manual') {
      note = window.prompt('Review note — recorded in the audit trail:') ?? '';
      if (!note) { toast('A note is required for manual review', 'error'); return; }
    }
    const label = action === 'keep_server' ? 'Keep server version' : action === 'keep_client' ? 'Apply client version' : 'Mark reviewed (manual)';
    if (!window.confirm(`${label}? The conflict is closed and your choice is audit-logged.`)) return;
    try {
      await api(`/admin/sync/conflicts/${id}/resolve`, { method: 'POST', body: { action, note } });
      toast(`${label} — conflict resolved`, 'success');
      void loadConflicts().catch(() => undefined);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Resolve failed', 'error');
    }
  }

  async function reviewApplication(id: string, action: 'approve' | 'reject') {
    const note = action === 'reject' ? (window.prompt('Reason for rejection (shown to applicant):') ?? '') : undefined;
    if (action === 'reject' && !note) return;
    try {
      await api(`/admin/facility-applications/${id}/${action}`, { method: 'POST', body: note !== undefined ? { note } : {} });
      toast(action === 'approve' ? 'Application approved — facility created' : 'Application rejected', 'success');
      void loadApplications();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Review failed', 'error');
    }
  }

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
          title="Add New Admin User"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader title="Administration" subtitle="Device management, audit trail, synchronization health, MPI review and facility applications." />
      <div className="mb-5">
        <Segmented
          options={[
            { value: 'devices', label: 'Devices' },
            { value: 'audit', label: 'Audit log' },
            { value: 'sync', label: 'Sync status' },
            ...(user?.permissions.includes('manage_sync_conflicts') ? [{ value: 'conflicts' as Tab, label: 'Sync conflicts' }] : []),
            ...(user?.permissions.includes('manage_patient_records') ? [{ value: 'mpi' as Tab, label: 'MPI duplicates' }] : []),
            ...(user?.permissions.includes('review_facility_applications') ? [{ value: 'applications' as Tab, label: 'Facility applications' }] : []),
            ...(user?.permissions.includes('manage_system_settings') ? [{ value: 'settings' as Tab, label: 'Settings' }] : []),
            ...(user?.permissions.includes('manage_users') ? [{ value: 'users' as Tab, label: 'Users' }] : []),
            ...(user?.permissions.includes('manage_epi_schedule') ? [{ value: 'epi' as Tab, label: 'EPI schedule' }] : []),
            ...(user?.permissions.includes('manage_roles_permissions') ? [{ value: 'roles' as Tab, label: 'Roles & permissions' }] : []),
            ...(user?.permissions.some((p) => ['manage_facility', 'manage_region', 'manage_district'].includes(p)) ? [{ value: 'facilities' as Tab, label: 'Facilities & geography' }] : []),
            ...(user?.permissions.includes('manage_facility') ? [{ value: 'units' as Tab, label: 'Units & wards' }] : []),
            ...(user?.permissions.includes('manage_facility') ? [{ value: 'staff' as Tab, label: 'Staff directory' }] : []),
            ...(user?.permissions.includes('manage_facility') ? [{ value: 'nss' as Tab, label: 'National service' }] : []),
            ...(user?.permissions.includes('view_audit') ? [{ value: 'configaudit' as Tab, label: 'Config audit' }] : []),
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'devices' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-lg border border-g-gold/30 bg-g-gold/10 px-4 py-2.5 text-xs text-yellow-900">
            <Icon name="info" className="h-4 w-4 shrink-0" />
            New devices self-register as <b className="mx-1">PENDING</b> and cannot sync until approved. Suspending or blocking a device revokes its session immediately — it is signed out on its next server contact (docs/21).
          </div>
          <Card pad={false}>
            {!devices ? (
              <Spinner />
            ) : devices.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-400">No devices registered yet. The offline sync client registers automatically on first sync.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead><tr className="border-b border-slate-100 text-xs uppercase text-slate-400">{['Device', 'Platform', 'Status', 'Enrolled', 'Last seen', 'Actions'].map((h) => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {[...devices]
                      .sort((a, b) => {
                        const rank = (s: string) => (s === 'PENDING' ? 0 : s === 'ACTIVE' ? 1 : 2);
                        return rank(a.status) - rank(b.status) || (a.lastSeenAt ?? '').localeCompare(b.lastSeenAt ?? '');
                      })
                      .map((d) => (
                        <tr key={d.id} className={d.status === 'PENDING' ? 'bg-g-gold/5' : 'hover:bg-g-mist/40'}>
                          <td className="px-5 py-3">
                            <p className="font-semibold text-g-ink">{d.name}</p>
                            <p className="font-mono text-xs text-slate-400">{d.deviceId}</p>
                            {d.blockReason && (
                              <p className="mt-0.5 text-xs italic text-slate-500">{d.blockReason}</p>
                            )}
                            {d.status === 'ACTIVE' && d.remoteLogoutAt && (
                              <p className="mt-0.5 text-xs text-sky-700">Remote logout issued {fmtDateTime(d.remoteLogoutAt)} — signs out on next contact</p>
                            )}
                          </td>
                          <td className="px-5 py-3"><Badge tone={d.platform === 'WINDOWS' ? 'navy' : d.platform === 'ANDROID' ? 'green' : 'gray'}>{d.platform}</Badge></td>
                          <td className="px-5 py-3"><Badge tone={statusTone(d.status)}>{d.status}</Badge></td>
                          <td className="px-5 py-3 text-slate-400">{d.enrolledAt ? fmtDateTime(d.enrolledAt) : '—'}</td>
                          <td className="px-5 py-3 text-slate-400">{d.lastSeenAt ? fmtDateTime(d.lastSeenAt) : '—'}</td>
                          <td className="px-5 py-3">
                            <div className="flex flex-wrap justify-end gap-2">
                              {d.status === 'PENDING' && (
                                <>
                                  <Button size="sm" variant="green" onClick={() => void deviceStatus(d.deviceId, 'ACTIVE')}>Approve</Button>
                                  <Button size="sm" variant="danger" onClick={() => {
                                    const reason = window.prompt('Reason for rejection (shown in the device list):');
                                    if (reason === null) return;
                                    if (!reason) { toast('A reason is required to reject a device', 'error'); return; }
                                    void deviceStatus(d.deviceId, 'BLOCKED', reason);
                                  }}>Reject</Button>
                                </>
                              )}
                              {d.status === 'ACTIVE' && (
                                <>
                                  <button onClick={() => {
                                    const reason = window.prompt('Reason for suspending (optional):') ?? undefined;
                                    if (reason === null) return;
                                    void deviceStatus(d.deviceId, 'SUSPENDED', reason);
                                  }} className="cursor-pointer text-xs font-bold text-g-navy hover:underline">Suspend</button>
                                  <button onClick={() => void remoteLogout(d.deviceId)} className="cursor-pointer text-xs font-bold text-g-navy hover:underline">Remote logout</button>
                                  <button onClick={() => {
                                    const reason = window.prompt('Reason for blocking (optional):') ?? undefined;
                                    if (reason === null) return;
                                    void deviceStatus(d.deviceId, 'BLOCKED', reason);
                                  }} className="cursor-pointer text-xs font-bold text-g-red hover:underline">Block</button>
                                </>
                              )}
                              {d.status !== 'PENDING' && d.status !== 'ACTIVE' && (
                                <button onClick={() => void deviceStatus(d.deviceId, 'ACTIVE')} className="cursor-pointer text-xs font-bold text-g-green hover:underline">Reactivate</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === 'audit' && (
        <Card pad={false}>
          {!audit ? (
            <Spinner />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-slate-100 text-xs uppercase text-slate-400">{['When', 'Actor', 'Action', 'Entity', 'Device/IP'].map((h) => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {audit.map((a) => (
                    <tr key={a.id} className="hover:bg-g-mist/40">
                      <td className="px-5 py-2.5 whitespace-nowrap text-slate-400">{fmtDateTime(a.createdAt)}</td>
                      <td className="px-5 py-2.5">
                        <p className="font-semibold text-g-ink">{a.actorEmail ?? 'system'}</p>
                        <p className="text-xs text-slate-400">{a.role ?? ''}</p>
                      </td>
                      <td className="px-5 py-2.5"><Badge tone="navy">{a.action}</Badge></td>
                      <td className="px-5 py-2.5 text-slate-500">{a.entityType ?? '—'}<span className="font-mono text-xs text-slate-300"> {a.entityId?.slice(0, 8) ?? ''}</span></td>
                      <td className="px-5 py-2.5 font-mono text-xs text-slate-400">{a.ip ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === 'sync' && (
        <div className="grid gap-4">
          <DeviceLockSettings />
          <LocalBackendCard />
          <div className="grid gap-4 md:grid-cols-2">
          <Card title="This device">
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-slate-400">Connection</dt><dd className={online ? 'font-bold text-g-green' : 'font-bold text-g-red'}>{online ? 'ONLINE' : 'OFFLINE — local mode'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Server</dt><dd className="font-bold">{serverHealthy === null ? 'checking…' : serverHealthy ? 'Healthy' : 'Unreachable'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Pending transactions</dt><dd className="font-bold tabular-nums">{pending}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Last sync</dt><dd className="font-bold">{lastSyncAt ? fmtDateTime(lastSyncAt) : '—'}</dd></div>
              {lastSyncResult && <div className="flex justify-between"><dt className="text-slate-400">Last result</dt><dd className="font-bold">{lastSyncResult.processed} ok · {lastSyncResult.failed} failed{lastSyncResult.conflicts > 0 ? ` · ${lastSyncResult.conflicts} conflict${lastSyncResult.conflicts > 1 ? 's' : ''}` : ''}</dd></div>}
              {lastSyncResult?.notice && (
                <p className="rounded-lg border border-g-gold/30 bg-g-gold/10 px-3 py-2 text-xs text-yellow-900">
                  {lastSyncResult.notice} — an administrator must approve this device in the Devices tab.
                </p>
              )}
            </dl>
            <button onClick={() => void sync()} className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-g-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-g-navy-2">
              <Icon name="refresh" className="h-4 w-4" /> Sync now
            </button>
          </Card>
          <Card title="Offline-first behaviour">
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li className="flex gap-2"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-g-green" /> Writes made offline are queued in an encrypted-style local outbox (IndexedDB).</li>
              <li className="flex gap-2"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-g-green" /> Each transaction carries a unique id + idempotency key — retries never duplicate records.</li>
              <li className="flex gap-2"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-g-green" /> Failed transactions stay queued with exponential backoff — never silently discarded.</li>
              <li className="flex gap-2"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-g-green" /> The connection badge (top-right) always tells the truth about sync state.</li>
            </ul>
          </Card>
          </div>
        </div>
      )}

      {tab === 'conflicts' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-lg border border-g-gold/30 bg-g-gold/10 px-4 py-2.5 text-xs text-yellow-900">
            <Icon name="info" className="h-4 w-4 shrink-0" />
            An offline device sent an update based on an outdated version of the record. Both versions are preserved here — nothing was silently discarded (spec §166). Resolve deliberately: keep the server version, apply the client version, or mark it reviewed.
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-g-ink">
              {conflicts === null ? 'Loading…' : conflicts.filter((c) => c.status === 'OPEN').length === 0 ? 'No open conflicts' : `${conflicts.filter((c) => c.status === 'OPEN').length} open conflict${conflicts.filter((c) => c.status === 'OPEN').length > 1 ? 's' : ''} awaiting review`}
            </p>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-500">
              <input type="checkbox" checked={conflictAll} onChange={(e) => { setConflictAll(e.target.checked); setConflicts(null); void loadConflicts(e.target.checked).catch(() => undefined); }} />
              Show resolved
            </label>
          </div>
          {conflicts === null ? (
            <Spinner />
          ) : conflicts.length === 0 ? (
            <EmptyState icon="shield" title="No sync conflicts" message="Offline updates that arrive on a stale base version appear here for review." />
          ) : (
            conflicts.map((c) => (
              <Card key={c.id} pad={false}>
                <details className="group">
                  <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 px-5 py-3.5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-g-ink">{conflictSummary(c)}</p>
                        <Badge tone={c.status === 'OPEN' ? 'gold' : c.status === 'RESOLVED_KEEP_CLIENT' ? 'green' : c.status === 'RESOLVED_KEEP_SERVER' ? 'navy' : 'gray'}>{CONFLICT_STATUS_LABELS[c.status] ?? c.status}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">Transaction {c.transactionId.slice(0, 12)}… · {fmtDateTime(c.createdAt)}{c.resolutionNote ? ` · Note: ${c.resolutionNote}` : ''}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {c.status === 'OPEN' && (
                        <>
                          <Button size="sm" variant="outline" onClick={(e) => { e.preventDefault(); void resolveConflict(c.id, 'manual'); }}>Mark reviewed</Button>
                          <Button size="sm" variant="green" onClick={(e) => { e.preventDefault(); void resolveConflict(c.id, 'keep_client'); }}>Apply client version</Button>
                          <Button size="sm" variant="navy" onClick={(e) => { e.preventDefault(); void resolveConflict(c.id, 'keep_server'); }}>Keep server version</Button>
                        </>
                      )}
                      <span className="text-xs text-slate-400">Review ▾</span>
                    </div>
                  </summary>
                  <div className="grid gap-3 border-t border-slate-100 bg-g-mist/40 px-5 py-4 md:grid-cols-2">
                    <div>
                      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Server state (the version that won)</p>
                      <pre className="max-h-64 overflow-auto rounded-lg border border-slate-200 bg-white p-3 font-mono text-[11px] leading-relaxed text-slate-600">{JSON.stringify(parseVersion(c.serverVersion), null, 2)}</pre>
                    </div>
                    <div>
                      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Client version (preserved, never discarded)</p>
                      <pre className="max-h-64 overflow-auto rounded-lg border border-g-gold/30 bg-g-gold/5 p-3 font-mono text-[11px] leading-relaxed text-slate-600">{JSON.stringify(parseVersion(c.clientVersion), null, 2)}</pre>
                    </div>
                  </div>
                </details>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === 'mpi' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-g-gold/30 bg-g-gold/10 px-4 py-2.5 text-xs text-yellow-900">
            <Icon name="info" className="h-4 w-4 shrink-0" />
            Merge moves all clinical records from the second record into the first. Nothing is ever silently merged — every merge and unmerge is audited and reversible.
          </div>
          {!pairs ? (
            <Spinner />
          ) : pairs.length === 0 ? (
            <EmptyState icon="users" title="No likely duplicates found" message="The scan compares names, dates of birth, phones and national identifiers within your scope." />
          ) : (
            pairs.map((pair, i) => (
              <Card key={i} pad={false}>
                <div className="grid gap-4 border-b border-slate-100 bg-g-mist/40 px-5 py-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
                  <div>
                    <p className="font-bold text-g-ink">{pair.a.fullName}</p>
                    <p className="font-mono text-xs text-slate-400">{pair.a.mrn} · {ageFromDob(pair.a.dateOfBirth)} · {pair.a.phone ?? '—'}</p>
                    {pair.a.status === 'MERGED' && <Badge tone="gray" className="mt-1">merged</Badge>}
                  </div>
                  <div className="text-center">
                    <Badge tone={pair.score >= 90 ? 'red' : 'gold'} className="text-xs">score {pair.score}</Badge>
                    <p className="mt-1 text-[10px] text-slate-400">{pair.matchedOn.join(' · ')}</p>
                  </div>
                  <div>
                    <p className="font-bold text-g-ink">{pair.b.fullName}</p>
                    <p className="font-mono text-xs text-slate-400">{pair.b.mrn} · {ageFromDob(pair.b.dateOfBirth)} · {pair.b.phone ?? '—'}</p>
                    {pair.b.status === 'MERGED' && <Badge tone="gray" className="mt-1">merged</Badge>}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 px-5 py-3">
                  <Button size="sm" variant="outline" onClick={() => void unmerge(pair.a.patientId)} disabled={pair.a.status !== 'MERGED' && pair.b.status !== 'MERGED'}>
                    Unmerge
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => void merge(pair.b.patientId, pair.a.patientId)} disabled={pair.a.status === 'MERGED' || pair.b.status === 'MERGED'}>
                    Merge {pair.b.mrn.slice(-3)} → {pair.a.mrn.slice(-3)}
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === 'settings' && <SystemSettings />}

      {tab === 'users' && <UsersManager />}

      {tab === 'epi' && <EpiScheduleEditor />}

      {tab === 'roles' && <RolesEditor />}

      {tab === 'facilities' && <FacilitiesEditor />}

      {tab === 'units' && <UnitsManager />}

      {tab === 'staff' && <StaffManager />}

      {tab === 'nss' && <NationalServiceManager />}

      {tab === 'configaudit' && <ConfigAudit />}

      {tab === 'applications' && (
        <div className="space-y-3">
          {!apps ? (
            <Spinner />
          ) : apps.length === 0 ? (
            <EmptyState icon="building" title="No facility applications" message="Public facility self-registrations appear here for national review." />
          ) : (
            apps.map((a) => (
              <Card key={a.id} pad={false}>
                <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-g-ink">{a.name}</p>
                      <Badge tone={a.status === 'PENDING' ? 'gold' : a.status === 'APPROVED' ? 'green' : 'red'}>{a.status}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {titleCase(a.type)} · {titleCase(a.ownership)} · {a.region?.name} / {a.district?.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {a.contactName ?? '—'} · {a.telephone ?? '—'} · {a.email ?? '—'}
                      {a.address ? ` · ${a.address}` : ''}
                    </p>
                    {a.services.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">{a.services.map((s) => <Badge key={s} tone="navy">{titleCase(s)}</Badge>)}</div>
                    )}
                    {a.reason && <p className="mt-2 max-w-2xl text-xs italic text-slate-500">“{a.reason}”</p>}
                    {a.reviewNote && <p className="mt-1 text-xs text-slate-400">Review note: {a.reviewNote}</p>}
                    <p className="mt-1 text-[11px] text-slate-300">Submitted {fmtDateTime(a.createdAt)}</p>
                  </div>
                  {a.status === 'PENDING' && (
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" variant="danger" onClick={() => void reviewApplication(a.id, 'reject')}>Reject</Button>
                      <Button size="sm" variant="green" onClick={() => void reviewApplication(a.id, 'approve')}>Approve</Button>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
