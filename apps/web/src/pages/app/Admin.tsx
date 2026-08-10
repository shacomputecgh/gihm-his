import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { AuditEntry, Device, FacilityApplication, MpiDuplicatePair } from '../../types';
import { Badge, Button, Card, EmptyState, PageHeader, Segmented, Spinner, useToast } from '../../components/ui';
import { fmtDateTime, titleCase, ageFromDob } from '../../lib/format';
import { useConnection } from '../../lib/connection';
import { Icon } from '../../components/icons';
import { useAuth } from '../../lib/auth';

type Tab = 'devices' | 'audit' | 'sync' | 'mpi' | 'applications';

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('devices');
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [audit, setAudit] = useState<AuditEntry[] | null>(null);
  const [pairs, setPairs] = useState<MpiDuplicatePair[] | null>(null);
  const [apps, setApps] = useState<FacilityApplication[] | null>(null);
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

  useEffect(() => {
    if (tab === 'devices') void loadDevices().catch(() => undefined);
    if (tab === 'audit') void loadAudit().catch(() => undefined);
    if (tab === 'mpi') void loadDuplicates().catch(() => undefined);
    if (tab === 'applications') void loadApplications().catch(() => undefined);
  }, [tab, loadDevices, loadAudit, loadDuplicates, loadApplications]);

  async function deviceStatus(deviceId: string, status: string) {
    try {
      await api(`/admin/devices/${deviceId}/status`, { method: 'POST', body: { status } });
      toast(`Device ${status.toLowerCase()}`, 'success');
      void loadDevices();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  }

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

  return (
    <div>
      <PageHeader title="Administration" subtitle="Device management, audit trail, synchronization health, MPI review and facility applications." />
      <div className="mb-5">
        <Segmented
          options={[
            { value: 'devices', label: 'Devices' },
            { value: 'audit', label: 'Audit log' },
            { value: 'sync', label: 'Sync status' },
            ...(user?.permissions.includes('manage_patient_records') ? [{ value: 'mpi' as Tab, label: 'MPI duplicates' }] : []),
            ...(user?.permissions.includes('review_facility_applications') ? [{ value: 'applications' as Tab, label: 'Facility applications' }] : []),
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'devices' && (
        <Card pad={false}>
          {!devices ? (
            <Spinner />
          ) : devices.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-400">No devices registered yet. The offline sync client registers automatically on first sync.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-slate-100 text-xs uppercase text-slate-400">{['Device', 'Platform', 'Status', 'Last seen', ''].map((h) => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {devices.map((d) => (
                    <tr key={d.id}>
                      <td className="px-5 py-3">
                        <p className="font-semibold text-g-ink">{d.name}</p>
                        <p className="font-mono text-xs text-slate-400">{d.deviceId}</p>
                      </td>
                      <td className="px-5 py-3"><Badge tone={d.platform === 'WINDOWS' ? 'navy' : d.platform === 'ANDROID' ? 'green' : 'gray'}>{d.platform}</Badge></td>
                      <td className="px-5 py-3"><Badge tone={d.status === 'ACTIVE' ? 'green' : d.status === 'BLOCKED' || d.status === 'STOLEN' || d.status === 'LOST' ? 'red' : 'gold'}>{d.status}</Badge></td>
                      <td className="px-5 py-3 text-slate-400">{d.lastSeenAt ? fmtDateTime(d.lastSeenAt) : '—'}</td>
                      <td className="px-5 py-3 text-right">
                        {d.status === 'ACTIVE' ? (
                          <button onClick={() => void deviceStatus(d.deviceId, 'BLOCKED')} className="cursor-pointer text-xs font-bold text-g-red hover:underline">Block</button>
                        ) : (
                          <button onClick={() => void deviceStatus(d.deviceId, 'ACTIVE')} className="cursor-pointer text-xs font-bold text-g-green hover:underline">Reactivate</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
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
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="This device">
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-slate-400">Connection</dt><dd className={online ? 'font-bold text-g-green' : 'font-bold text-g-red'}>{online ? 'ONLINE' : 'OFFLINE — local mode'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Server</dt><dd className="font-bold">{serverHealthy === null ? 'checking…' : serverHealthy ? 'Healthy' : 'Unreachable'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Pending transactions</dt><dd className="font-bold tabular-nums">{pending}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Last sync</dt><dd className="font-bold">{lastSyncAt ? fmtDateTime(lastSyncAt) : '—'}</dd></div>
              {lastSyncResult && <div className="flex justify-between"><dt className="text-slate-400">Last result</dt><dd className="font-bold">{lastSyncResult.processed} ok · {lastSyncResult.failed} failed</dd></div>}
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
