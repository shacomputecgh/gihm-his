import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import type { AdminFacility, HospitalUnit, NationalServiceStaff } from '../types';
import { Badge, Button, Card, EmptyState, Field, Input, Select, Spinner, useToast } from './ui';
import { fmtDate } from '../lib/format';
import { useAuth } from '../lib/auth';
import { unitEditableFacility as editableFacility } from './UnitsManager';

const STATUSES = ['ACTIVE', 'COMPLETED', 'TERMINATED'];
const STATUS_TONE: Record<string, 'green' | 'gray' | 'red'> = { ACTIVE: 'green', COMPLETED: 'gray', TERMINATED: 'red' };

interface Draft {
  fullName: string;
  nssNumber: string;
  institution: string;
  programme: string;
  placement: string;
  supervisor: string;
  phone: string;
  email: string;
  unitId: string;
  startDate: string;
  endDate: string;
  status: string;
  notes: string;
}
const EMPTY_DRAFT: Draft = { fullName: '', nssNumber: '', institution: '', programme: '', placement: '', supervisor: '', phone: '', email: '', unitId: '', startDate: '', endDate: '', status: 'ACTIVE', notes: '' };

export default function NationalServiceManager() {
  const { user } = useAuth();
  const toast = useToast();
  const [facilities, setFacilities] = useState<AdminFacility[] | null>(null);
  const [facilityId, setFacilityId] = useState('');
  const [personnel, setPersonnel] = useState<NationalServiceStaff[] | null>(null);
  const [units, setUnits] = useState<HospitalUnit[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<Draft>({ ...EMPTY_DRAFT });
  const [editing, setEditing] = useState<NationalServiceStaff | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const loadFacilities = useCallback(async () => {
    const res = await api<{ facilities: AdminFacility[] }>('/admin/masterdata/facilities');
    const canEdit = editableFacility(user);
    const mine = res.facilities.filter((f) => canEdit(f));
    setFacilities(mine);
    const preferred = mine.find((f) => f.id === user?.facilityId) ?? mine[0];
    setFacilityId((cur) => cur || preferred?.id || '');
  }, [user]);

  const loadUnits = useCallback(async () => {
    if (!facilityId) return;
    const res = await api<{ facilities: { departments: { units: HospitalUnit[] }[] }[] }>(`/admin/masterdata/units?facilityId=${encodeURIComponent(facilityId)}`);
    setUnits(res.facilities.flatMap((f) => f.departments.flatMap((d) => d.units)).sort((a, b) => a.name.localeCompare(b.name)));
  }, [facilityId]);

  const loadPersonnel = useCallback(async () => {
    if (!facilityId) return;
    const q = `facilityId=${encodeURIComponent(facilityId)}${statusFilter ? `&status=${encodeURIComponent(statusFilter)}` : ''}${search ? `&q=${encodeURIComponent(search)}` : ''}`;
    const res = await api<{ personnel: NationalServiceStaff[]; summary: { total: number; active: number } }>(`/admin/masterdata/national-service?${q}`);
    setPersonnel(res.personnel);
  }, [facilityId, statusFilter, search]);

  useEffect(() => { void loadFacilities().catch(() => undefined); }, [loadFacilities]);
  useEffect(() => { if (facilityId) void loadPersonnel().catch(() => undefined); }, [facilityId, loadPersonnel]);
  useEffect(() => { if (facilityId) void loadUnits().catch(() => undefined); }, [facilityId, loadUnits]);

  const facility = facilities?.find((f) => f.id === facilityId);

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy('create');
    try {
      await api('/admin/masterdata/national-service', {
        method: 'POST',
        body: { facilityId, nssNumber: draft.nssNumber || undefined, fullName: draft.fullName, institution: draft.institution || undefined, programme: draft.programme || undefined, placement: draft.placement || undefined, supervisor: draft.supervisor || undefined, phone: draft.phone || undefined, email: draft.email || undefined, unitId: draft.unitId || undefined, startDate: draft.startDate || undefined, endDate: draft.endDate || undefined, status: draft.status, notes: draft.notes || undefined },
      });
      toast(`${draft.fullName} posted`, 'success');
      setDraft({ ...EMPTY_DRAFT });
      void loadPersonnel();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Post failed', 'error');
    } finally {
      setBusy(null);
    }
  }

  function patchEdit(part: Partial<NationalServiceStaff>) {
    setEditing((e) => (e ? { ...e, ...part } : e));
  }

  async function saveEdit() {
    if (!editing) return;
    setBusy(`edit-${editing.id}`);
    try {
      await api(`/admin/masterdata/national-service/${editing.id}`, {
        method: 'PUT',
        body: { fullName: editing.fullName, institution: editing.institution ?? '', programme: editing.programme ?? '', placement: editing.placement ?? '', supervisor: editing.supervisor ?? '', phone: editing.phone ?? '', email: editing.email ?? '', unitId: editing.unit?.id ?? '', startDate: editing.startDate ?? '', endDate: editing.endDate ?? '', status: editing.status, notes: editing.notes ?? '' },
      });
      toast(`Saved ${editing.fullName}`, 'success');
      setEditing(null);
      void loadPersonnel();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setBusy(null);
    }
  }

  async function setStatus(p: NationalServiceStaff, status: string) {
    setBusy(`status-${p.id}`);
    try {
      await api(`/admin/masterdata/national-service/${p.id}`, { method: 'PUT', body: { status } });
      toast(`${p.fullName} → ${status.toLowerCase()}`, 'success');
      void loadPersonnel();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setBusy(null);
    }
  }

  async function remove(p: NationalServiceStaff) {
    if (!window.confirm(`Remove ${p.fullName} (${p.nssNumber}) from the national service register?`)) return;
    setBusy(`remove-${p.id}`);
    try {
      await api(`/admin/masterdata/national-service/${p.id}/remove`, { method: 'POST', body: {} });
      toast(`Removed ${p.fullName}`, 'success');
      void loadPersonnel();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Remove failed', 'error');
    } finally {
      setBusy(null);
    }
  }

  const activeCount = useMemo(() => personnel?.filter((p) => p.status === 'ACTIVE').length ?? 0, [personnel]);

  if (!facilities) {
    return <div className="py-16"><Spinner label="Loading national service register…" /></div>;
  }
  if (facilities.length === 0) {
    return <EmptyState icon="users" title="No facilities in scope" message="You don't have any facilities to post national service personnel to." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="max-w-2xl text-sm text-slate-500">
            Post graduates on their National Service year to any facility — institution, programme, placement, supervisor and service dates. All changes are audited.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Field label="Facility">
              <Select value={facilityId} onChange={(e) => { setFacilityId(e.target.value); setEditing(null); }} className="w-72">
                {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
                <option value="">All</option>
                {STATUSES.map((st) => <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>)}
              </Select>
            </Field>
            <Field label="Search">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name…" className="w-48" />
            </Field>
          </div>
        </div>
      </div>

      {personnel && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-g-mist/40 p-3"><p className="text-[10px] font-bold uppercase text-slate-400">On the register</p><p className="text-xl font-bold text-g-ink tabular-nums">{personnel.length}</p></div>
          <div className="rounded-lg border border-g-green/20 bg-g-green/5 p-3"><p className="text-[10px] font-bold uppercase text-g-green">Active postings</p><p className="text-xl font-bold text-g-green tabular-nums">{activeCount}</p></div>
          <div className="rounded-lg border border-slate-200 bg-white p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Facility</p><p className="truncate text-sm font-bold text-g-ink">{facility?.name ?? '—'}</p></div>
        </div>
      )}

      {!personnel ? (
        <Spinner label="Loading personnel…" />
      ) : personnel.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 px-4 py-8 text-center text-sm text-slate-400">
          No national service personnel match this view. Post the first graduate below.
        </p>
      ) : (
        <Card pad={false} title="National service personnel" subtitle={`${personnel.length} on the register`}>
          <div className="divide-y divide-slate-50">
            {personnel.map((p) => (
              <div key={p.id} className="px-5 py-3.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-g-ink">{p.fullName}</p>
                      <Badge tone={STATUS_TONE[p.status] ?? 'gray'}>{p.status.replace(/_/g, ' ')}</Badge>
                      {p.unit && <Badge tone="navy">{p.unit.name}</Badge>}
                    </div>
                    <p className="mt-1 font-mono text-[10px] text-slate-400">
                      {p.nssNumber}{p.institution ? ` · ${p.institution}` : ''}{p.programme ? ` · ${p.programme}` : ''}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {p.placement ? `${p.placement} · ` : ''}{fmtDate(p.startDate)}{p.endDate ? ` → ${fmtDate(p.endDate)}` : ''}{p.supervisor ? ` · supervised by ${p.supervisor}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    {p.status === 'ACTIVE' && (
                      <button onClick={() => void setStatus(p, 'COMPLETED')} disabled={busy === `status-${p.id}`} className="cursor-pointer rounded-md border border-g-green/30 bg-g-green/5 px-2 py-1 text-[10px] font-bold text-g-green transition hover:bg-g-green hover:text-white">Mark completed</button>
                    )}
                    {p.status === 'ACTIVE' && (
                      <button onClick={() => void setStatus(p, 'TERMINATED')} disabled={busy === `status-${p.id}`} className="cursor-pointer rounded-md border border-g-red/20 bg-g-red/5 px-2 py-1 text-[10px] font-bold text-g-red transition hover:bg-g-red hover:text-white">Terminate</button>
                    )}
                    {p.status !== 'ACTIVE' && (
                      <button onClick={() => void setStatus(p, 'ACTIVE')} disabled={busy === `status-${p.id}`} className="cursor-pointer rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-500 transition hover:bg-slate-100">Reactivate</button>
                    )}
                    <button onClick={() => setEditing(p)} className="cursor-pointer rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-g-navy transition hover:bg-g-navy hover:text-white">Edit</button>
                    <button onClick={() => void remove(p)} disabled={busy === `remove-${p.id}`} className="cursor-pointer rounded-md border border-g-red/20 bg-g-red/5 px-2 py-1 text-[10px] font-bold text-g-red transition hover:bg-g-red hover:text-white">Remove</button>
                  </div>
                </div>

                {editing?.id === p.id && (
                  <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 md:grid-cols-4">
                    <Field label="Full name" className="md:col-span-2"><Input value={editing.fullName} onChange={(e) => patchEdit({ fullName: e.target.value })} /></Field>
                    <Field label="Institution"><Input value={editing.institution ?? ''} onChange={(e) => patchEdit({ institution: e.target.value })} /></Field>
                    <Field label="Programme"><Input value={editing.programme ?? ''} onChange={(e) => patchEdit({ programme: e.target.value })} /></Field>
                    <Field label="Placement"><Input value={editing.placement ?? ''} onChange={(e) => patchEdit({ placement: e.target.value })} /></Field>
                    <Field label="Supervisor"><Input value={editing.supervisor ?? ''} onChange={(e) => patchEdit({ supervisor: e.target.value })} /></Field>
                    <Field label="Phone"><Input value={editing.phone ?? ''} onChange={(e) => patchEdit({ phone: e.target.value })} /></Field>
                    <Field label="Email"><Input value={editing.email ?? ''} onChange={(e) => patchEdit({ email: e.target.value })} /></Field>
                    <Field label="Unit">
                      <Select value={editing.unit?.id ?? ''} onChange={(e) => patchEdit({ unit: e.target.value ? { id: e.target.value, code: units.find((u) => u.id === e.target.value)?.code ?? '', name: units.find((u) => u.id === e.target.value)?.name ?? '' } : null })}>
                        <option value="">— unassigned —</option>
                        {units.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.code})</option>)}
                      </Select>
                    </Field>
                    <Field label="Start date"><Input type="date" value={editing.startDate ? editing.startDate.slice(0, 10) : ''} onChange={(e) => patchEdit({ startDate: e.target.value })} /></Field>
                    <Field label="End date"><Input type="date" value={editing.endDate ? editing.endDate.slice(0, 10) : ''} onChange={(e) => patchEdit({ endDate: e.target.value })} /></Field>
                    <Field label="Status">
                      <Select value={editing.status} onChange={(e) => patchEdit({ status: e.target.value })}>
                        {STATUSES.map((st) => <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>)}
                      </Select>
                    </Field>
                    <div className="flex items-end justify-end gap-2 md:col-span-4">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
                      <Button size="sm" variant="green" onClick={() => void saveEdit()} loading={busy === `edit-${editing.id}`}>Save</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="Post national service personnel" subtitle="Leave the NSS number blank to auto-generate the next one for this facility.">
        <form onSubmit={(e) => void create(e)} className="grid gap-3 md:grid-cols-4">
          <Field label="Full name" className="md:col-span-2"><Input value={draft.fullName} onChange={(e) => setDraft({ ...draft, fullName: e.target.value })} placeholder="e.g. Abena Owusu-Ansah" required /></Field>
          <Field label="NSS number" hint="Auto if blank"><Input value={draft.nssNumber} onChange={(e) => setDraft({ ...draft, nssNumber: e.target.value.toUpperCase() })} placeholder="e.g. NSS-2026-0042" /></Field>
          <Field label="Institution"><Input value={draft.institution} onChange={(e) => setDraft({ ...draft, institution: e.target.value })} placeholder="e.g. University of Ghana" /></Field>
          <Field label="Programme"><Input value={draft.programme} onChange={(e) => setDraft({ ...draft, programme: e.target.value })} placeholder="e.g. BSc Nursing" /></Field>
          <Field label="Placement"><Input value={draft.placement} onChange={(e) => setDraft({ ...draft, placement: e.target.value })} placeholder="e.g. Ward nurse support" /></Field>
          <Field label="Supervisor"><Input value={draft.supervisor} onChange={(e) => setDraft({ ...draft, supervisor: e.target.value })} placeholder="e.g. Nurse Ama Serwaa" /></Field>
          <Field label="Phone"><Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="0244 000 000" /></Field>
          <Field label="Email"><Input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="name@uni.edu.gh" /></Field>
          <Field label="Unit">
            <Select value={draft.unitId} onChange={(e) => setDraft({ ...draft, unitId: e.target.value })}>
              <option value="">— unassigned —</option>
              {units.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.code})</option>)}
            </Select>
          </Field>
          <Field label="Start date"><Input type="date" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} /></Field>
          <Field label="End date"><Input type="date" value={draft.endDate} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} /></Field>
          <Field label="Status">
            <Select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
              {STATUSES.map((st) => <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>)}
            </Select>
          </Field>
          <div className="flex items-end md:col-span-2"><Button type="submit" loading={busy === 'create'} icon="plus">Post person</Button></div>
        </form>
      </Card>
    </div>
  );
}
