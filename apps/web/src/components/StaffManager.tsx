import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import type { AdminFacility, HospitalUnit, Staff } from '../types';
import { Badge, Button, Card, EmptyState, Field, Input, Select, Spinner, useToast } from './ui';
import { fmtDate } from '../lib/format';
import { cn } from './ui';
import { useAuth } from '../lib/auth';
import { unitEditableFacility as editableFacility } from './UnitsManager';

const ROLES = ['CONSULTANT', 'MEDICAL_OFFICER', 'SURGEON', 'OBSTETRICIAN', 'PAEDIATRICIAN', 'ANESTHETIST', 'NURSE', 'MIDWIFE', 'PHARMACIST', 'LAB_SCIENTIST', 'RADIOGRAPHER', 'RADIOLOGIST', 'PHYSIOTHERAPIST', 'HEALTH_INFO_OFFICER', 'RECORDS_OFFICER', 'HOSPITAL_ADMIN', 'ACCOUNTANT', 'CASHIER', 'STOREKEEPER', 'IT_ADMIN', 'SECURITY', 'PORTER', 'CLEANER', 'CHW', 'OTHER'];
const STATUSES = ['ACTIVE', 'ON_LEAVE', 'RETIRED', 'TERMINATED'];

// Staff role → login role for one-click accounts (mirrors the API map).
const STAFF_ROLE_TO_ROLE_CODE: Record<string, string> = {
  CONSULTANT: 'DOCTOR', MEDICAL_OFFICER: 'DOCTOR', SURGEON: 'DOCTOR', OBSTETRICIAN: 'DOCTOR', PAEDIATRICIAN: 'DOCTOR', ANESTHETIST: 'DOCTOR',
  NURSE: 'NURSE', MIDWIFE: 'MIDWIFE', PHARMACIST: 'PHARMACIST', LAB_SCIENTIST: 'LAB_SCIENTIST', HEALTH_INFO_OFFICER: 'HEALTH_INFO_OFFICER',
  HOSPITAL_ADMIN: 'HOSPITAL_ADMIN', ACCOUNTANT: 'ACCOUNTANT', CASHIER: 'CASHIER', IT_ADMIN: 'IT_ADMIN', CHW: 'COMMUNITY_HEALTH_WORKER',
};

const titleCase = (s: string) => s.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

const ROLE_TONE: Record<string, 'green' | 'blue' | 'gold' | 'red' | 'gray' | 'navy'> = {
  CONSULTANT: 'navy', MEDICAL_OFFICER: 'blue', SURGEON: 'navy', OBSTETRICIAN: 'navy', PAEDIATRICIAN: 'navy', ANESTHETIST: 'blue',
  NURSE: 'green', MIDWIFE: 'green', PHARMACIST: 'gold', LAB_SCIENTIST: 'gold', RADIOGRAPHER: 'gold', RADIOLOGIST: 'blue',
  PHYSIOTHERAPIST: 'green', HEALTH_INFO_OFFICER: 'gray', RECORDS_OFFICER: 'gray', HOSPITAL_ADMIN: 'navy', ACCOUNTANT: 'gray',
  CASHIER: 'gray', STOREKEEPER: 'gray', IT_ADMIN: 'blue', SECURITY: 'gray', PORTER: 'gray', CLEANER: 'gray', CHW: 'green', OTHER: 'gray',
};
const STATUS_TONE: Record<string, 'green' | 'gold' | 'gray' | 'red'> = { ACTIVE: 'green', ON_LEAVE: 'gold', RETIRED: 'gray', TERMINATED: 'red' };

interface Draft {
  fullName: string;
  role: string;
  speciality: string;
  staffNumber: string;
  licenseNumber: string;
  phone: string;
  email: string;
  employmentStatus: string;
  headOfUnit: boolean;
  unitId: string;
  joinedAt: string;
  notes: string;
}
const EMPTY_DRAFT: Draft = { fullName: '', role: 'NURSE', speciality: '', staffNumber: '', licenseNumber: '', phone: '', email: '', employmentStatus: 'ACTIVE', headOfUnit: false, unitId: '', joinedAt: '', notes: '' };

export default function StaffManager() {
  const { user } = useAuth();
  const toast = useToast();
  const [facilities, setFacilities] = useState<AdminFacility[] | null>(null);
  const [facilityId, setFacilityId] = useState('');
  const [staff, setStaff] = useState<Staff[] | null>(null);
  const [summary, setSummary] = useState<{ total: number; assigned: number; heads: number; onLeave: number } | null>(null);
  const [units, setUnits] = useState<HospitalUnit[]>([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [draft, setDraft] = useState<Draft>({ ...EMPTY_DRAFT });
  const [editing, setEditing] = useState<Staff | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  // One-click login accounts (docs/25) — available when the caller can manage users.
  const canManageUsers = Boolean(user?.permissions.includes('manage_users'));
  const [roleCodes, setRoleCodes] = useState<string[]>([]);
  const [linkFor, setLinkFor] = useState<Staff | null>(null);
  const [linkDraft, setLinkDraft] = useState<{ email: string; roleCode: string; password: string }>({ email: '', roleCode: '', password: '' });

  const loadFacilities = useCallback(async () => {
    const res = await api<{ facilities: AdminFacility[] }>('/admin/masterdata/facilities');
    const canEdit = editableFacility(user);
    const mine = res.facilities.filter((f) => canEdit(f));
    setFacilities(mine);
    // Default to the caller's facility (or the first editable one).
    const preferred = mine.find((f) => f.id === user?.facilityId) ?? mine[0];
    setFacilityId((cur) => cur || preferred?.id || '');
  }, [user]);

  const loadUnits = useCallback(async () => {
    if (!facilityId) return;
    const res = await api<{ facilities: { departments: { units: HospitalUnit[] }[] }[] }>(`/admin/masterdata/units?facilityId=${encodeURIComponent(facilityId)}`);
    const flat = res.facilities.flatMap((f) => f.departments.flatMap((d) => d.units)).sort((a, b) => a.name.localeCompare(b.name));
    setUnits(flat);
  }, [facilityId]);

  const loadStaff = useCallback(async () => {
    if (!facilityId) return;
    const q = `facilityId=${encodeURIComponent(facilityId)}${roleFilter ? `&role=${encodeURIComponent(roleFilter)}` : ''}${statusFilter ? `&status=${encodeURIComponent(statusFilter)}` : ''}`;
    const res = await api<{ staff: Staff[]; summary: { total: number; assigned: number; heads: number; onLeave: number } }>(`/admin/masterdata/staff?${q}`);
    setStaff(res.staff);
    setSummary(res.summary);
  }, [facilityId, roleFilter, statusFilter]);

  const loadRoles = useCallback(async () => {
    if (!canManageUsers) return;
    const res = await api<{ roles: { code: string }[] }>('/admin/users');
    setRoleCodes(res.roles.map((r) => r.code).sort());
  }, [canManageUsers]);

  useEffect(() => { void loadFacilities().catch(() => undefined); }, [loadFacilities]);
  useEffect(() => { void loadRoles().catch(() => undefined); }, [loadRoles]);
  useEffect(() => { if (facilityId) void loadStaff().catch(() => undefined); }, [facilityId, loadStaff]);
  useEffect(() => { if (facilityId) void loadUnits().catch(() => undefined); }, [facilityId, loadUnits]);

  const facility = facilities?.find((f) => f.id === facilityId);

  async function createStaff(e: FormEvent) {
    e.preventDefault();
    setBusy('create');
    try {
      await api('/admin/masterdata/staff', {
        method: 'POST',
        body: { facilityId, unitId: draft.unitId || undefined, staffNumber: draft.staffNumber, fullName: draft.fullName, role: draft.role, speciality: draft.speciality || undefined, licenseNumber: draft.licenseNumber || undefined, phone: draft.phone || undefined, email: draft.email || undefined, employmentStatus: draft.employmentStatus, headOfUnit: draft.headOfUnit, joinedAt: draft.joinedAt || undefined, notes: draft.notes || undefined },
      });
      toast(`${draft.fullName} added`, 'success');
      setDraft({ ...EMPTY_DRAFT });
      void loadStaff();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Add failed', 'error');
    } finally {
      setBusy(null);
    }
  }

  function patchEdit(part: Partial<Staff>) {
    setEditing((e) => (e ? { ...e, ...part } : e));
  }

  async function saveEdit() {
    if (!editing) return;
    setBusy(`edit-${editing.id}`);
    try {
      await api(`/admin/masterdata/staff/${editing.id}`, {
        method: 'PUT',
        body: { fullName: editing.fullName, role: editing.role, speciality: editing.speciality ?? '', licenseNumber: editing.licenseNumber ?? '', phone: editing.phone ?? '', email: editing.email ?? '', employmentStatus: editing.employmentStatus, headOfUnit: editing.headOfUnit, unitId: editing.unit?.id ?? '', joinedAt: editing.joinedAt ?? '', notes: editing.notes ?? '' },
      });
      toast(`Saved ${editing.fullName}`, 'success');
      setEditing(null);
      void loadStaff();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setBusy(null);
    }
  }

  async function setHead(s: Staff, headOfUnit: boolean) {
    setBusy(`head-${s.id}`);
    try {
      await api(`/admin/masterdata/staff/${s.id}`, { method: 'PUT', body: { headOfUnit } });
      toast(headOfUnit ? `${s.fullName} is now head of unit` : `Head flag removed`, 'success');
      void loadStaff();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setBusy(null);
    }
  }

  async function removeStaff(s: Staff) {
    const linked = s.user ? `\n\nNote: this record has a linked login account (${s.user.email}) — the account stays active in User management.` : '';
    if (!window.confirm(`Remove ${s.fullName} (${s.staffNumber}) from the staff directory?${linked}`)) return;
    setBusy(`remove-${s.id}`);
    try {
      await api(`/admin/masterdata/staff/${s.id}/remove`, { method: 'POST', body: {} });
      toast(`Removed ${s.fullName}`, 'success');
      void loadStaff();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Remove failed', 'error');
    } finally {
      setBusy(null);
    }
  }

  // ------------------------------------------------- login accounts
  function openLink(s: Staff) {
    setLinkFor(s);
    setLinkDraft({
      email: s.email ?? `${s.staffNumber.toLowerCase()}@${s.facility.code.toLowerCase()}.gh`,
      roleCode: STAFF_ROLE_TO_ROLE_CODE[s.role] ?? '',
      password: '',
    });
  }

  async function createLogin(e: FormEvent) {
    e.preventDefault();
    if (!linkFor) return;
    setBusy(`link-${linkFor.id}`);
    try {
      await api(`/admin/masterdata/staff/${linkFor.id}/link-user`, {
        method: 'POST',
        body: { email: linkDraft.email, roleCode: linkDraft.roleCode || undefined, password: linkDraft.password },
      });
      toast(`Login account created for ${linkFor.fullName}`, 'success');
      setLinkFor(null);
      void loadStaff();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Create failed', 'error');
    } finally {
      setBusy(null);
    }
  }

  async function unlinkUser(s: Staff) {
    if (!window.confirm(`Unlink ${s.user?.email}? The account stays in User management — only the staff link is removed.`)) return;
    setBusy(`unlink-${s.id}`);
    try {
      await api(`/admin/masterdata/staff/${s.id}/unlink-user`, { method: 'POST', body: {} });
      toast('Login account unlinked', 'success');
      void loadStaff();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Unlink failed', 'error');
    } finally {
      setBusy(null);
    }
  }

  if (!facilities) {
    return <div className="py-16"><Spinner label="Loading staff directory…" /></div>;
  }
  if (facilities.length === 0) {
    return <EmptyState icon="users" title="No facilities in scope" message="You don't have any facilities to manage staff for." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="max-w-2xl text-sm text-slate-500">
            Add as many doctors, nurses and support staff as you need — each with a role, licence number, employment status and unit. Every change is audited.{canManageUsers ? ' You can also create login accounts right from a staff record.' : ''}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Field label="Facility">
              <Select value={facilityId} onChange={(e) => { setFacilityId(e.target.value); setEditing(null); }} className="w-72">
                {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </Select>
            </Field>
            <Field label="Role">
              <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-48">
                <option value="">All roles</option>
                {ROLES.map((r) => <option key={r} value={r}>{titleCase(r)}</option>)}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-44">
                <option value="">All statuses</option>
                {STATUSES.map((st) => <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>)}
              </Select>
            </Field>
          </div>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-g-mist/40 p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Total staff</p><p className="text-xl font-bold text-g-ink tabular-nums">{summary.total}</p></div>
          <div className="rounded-lg border border-slate-200 bg-white p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Assigned to units</p><p className="text-xl font-bold text-g-ink tabular-nums">{summary.assigned}</p></div>
          <div className="rounded-lg border border-g-navy/20 bg-g-navy/5 p-3"><p className="text-[10px] font-bold uppercase text-g-navy">Heads of unit</p><p className="text-xl font-bold text-g-navy tabular-nums">{summary.heads}</p></div>
          <div className={cn('rounded-lg border p-3', summary.onLeave > 0 ? 'border-g-gold/40 bg-g-gold/10' : 'border-slate-200 bg-white')}>
            <p className="text-[10px] font-bold uppercase text-yellow-800">On leave</p>
            <p className={cn('text-xl font-bold tabular-nums', summary.onLeave > 0 ? 'text-yellow-800' : 'text-slate-400')}>{summary.onLeave}</p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ directory */}
      {!staff ? (
        <Spinner label="Loading staff…" />
      ) : staff.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 px-4 py-8 text-center text-sm text-slate-400">
          No staff match this filter{roleFilter || statusFilter ? '' : ` at ${facility?.name ?? 'this facility'}`}. Use the form below to add the first one.
        </p>
      ) : (
        <Card pad={false} title={`Staff — ${facility?.name ?? ''}`} subtitle={`${staff.length} shown · click Edit to update a record`}>
          <div className="divide-y divide-slate-50">
            {staff.map((s) => (
              <div key={s.id} className="px-5 py-3.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-g-ink">{s.fullName}</p>
                      <Badge tone={ROLE_TONE[s.role] ?? 'gray'}>{titleCase(s.role)}</Badge>
                      <Badge tone={STATUS_TONE[s.employmentStatus] ?? 'gray'}>{s.employmentStatus.replace(/_/g, ' ')}</Badge>
                      {s.headOfUnit && <Badge tone="navy">★ head of unit</Badge>}
                      {s.user && <Badge tone="green">🔑 {s.user.email} · {s.user.roleCode}</Badge>}
                    </div>
                    <p className="mt-1 font-mono text-[10px] text-slate-400">
                      {s.staffNumber}{s.speciality ? ` · ${s.speciality}` : ''}{s.licenseNumber ? ` · ${s.licenseNumber}` : ''}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {s.unit ? s.unit.name : 'Unassigned'}{s.joinedAt ? ` · joined ${fmtDate(s.joinedAt)}` : ''}{s.phone || s.email ? ` · ${s.phone ?? ''}${s.phone && s.email ? ' / ' : ''}${s.email ?? ''}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    {!s.headOfUnit && s.unit && (
                      <button onClick={() => void setHead(s, true)} disabled={busy === `head-${s.id}`} className="cursor-pointer rounded-md border border-g-navy/30 bg-g-navy/5 px-2 py-1 text-[10px] font-bold text-g-navy transition hover:bg-g-navy hover:text-white">Make head</button>
                    )}
                    {s.headOfUnit && (
                      <button onClick={() => void setHead(s, false)} disabled={busy === `head-${s.id}`} className="cursor-pointer rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-500 transition hover:bg-slate-100">Remove head</button>
                    )}
                    {canManageUsers && !s.user && (
                      <button onClick={() => openLink(s)} disabled={busy === `link-${s.id}`} className="cursor-pointer rounded-md border border-g-green/30 bg-g-green/5 px-2 py-1 text-[10px] font-bold text-g-green transition hover:bg-g-green hover:text-white">+ Create login</button>
                    )}
                    {canManageUsers && s.user && (
                      <button onClick={() => void unlinkUser(s)} disabled={busy === `unlink-${s.id}`} className="cursor-pointer rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-500 transition hover:bg-slate-100">Unlink</button>
                    )}
                    <button onClick={() => setEditing(s)} className="cursor-pointer rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-g-navy transition hover:bg-g-navy hover:text-white">Edit</button>
                    <button onClick={() => void removeStaff(s)} disabled={busy === `remove-${s.id}`} className="cursor-pointer rounded-md border border-g-red/20 bg-g-red/5 px-2 py-1 text-[10px] font-bold text-g-red transition hover:bg-g-red hover:text-white">Remove</button>
                  </div>
                </div>

                {editing?.id === s.id && (
                  <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 md:grid-cols-4">
                    <Field label="Full name" className="md:col-span-2"><Input value={editing.fullName} onChange={(e) => patchEdit({ fullName: e.target.value })} /></Field>
                    <Field label="Role">
                      <Select value={editing.role} onChange={(e) => patchEdit({ role: e.target.value })}>
                        {ROLES.map((r) => <option key={r} value={r}>{titleCase(r)}</option>)}
                      </Select>
                    </Field>
                    <Field label="Speciality"><Input value={editing.speciality ?? ''} onChange={(e) => patchEdit({ speciality: e.target.value })} /></Field>
                    <Field label="Licence number"><Input value={editing.licenseNumber ?? ''} onChange={(e) => patchEdit({ licenseNumber: e.target.value })} /></Field>
                    <Field label="Phone"><Input value={editing.phone ?? ''} onChange={(e) => patchEdit({ phone: e.target.value })} /></Field>
                    <Field label="Email"><Input value={editing.email ?? ''} onChange={(e) => patchEdit({ email: e.target.value })} /></Field>
                    <Field label="Employment status">
                      <Select value={editing.employmentStatus} onChange={(e) => patchEdit({ employmentStatus: e.target.value })}>
                        {STATUSES.map((st) => <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>)}
                      </Select>
                    </Field>
                    <Field label="Unit">
                      <Select value={editing.unit?.id ?? ''} onChange={(e) => patchEdit({ unit: e.target.value ? { id: e.target.value, code: units.find((u) => u.id === e.target.value)?.code ?? '', name: units.find((u) => u.id === e.target.value)?.name ?? '' } : null })}>
                        <option value="">— unassigned —</option>
                        {units.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.code})</option>)}
                      </Select>
                    </Field>
                    <label className={cn('flex items-center gap-2 text-xs font-semibold', !editing.unit ? 'text-slate-400' : 'text-g-ink')}>
                      <input type="checkbox" checked={editing.headOfUnit} disabled={!editing.unit} onChange={(e) => patchEdit({ headOfUnit: e.target.checked })} className="h-4 w-4 rounded accent-g-navy" />
                      Head of unit (exclusive)
                    </label>
                    <div className="flex items-end justify-end gap-2 md:col-span-4">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
                      <Button size="sm" variant="green" onClick={() => void saveEdit()} loading={busy === `edit-${editing.id}`}>Save staff</Button>
                    </div>
                  </div>
                )}

                {linkFor?.id === s.id && (
                  <form onSubmit={(e) => void createLogin(e)} className="mt-3 grid gap-3 border-t border-slate-100 pt-3 md:grid-cols-4">
                    <div className="md:col-span-4">
                      <p className="text-xs font-bold text-g-navy">Create login account — {s.fullName}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">Auto-mapped role: <span className="font-semibold">{STAFF_ROLE_TO_ROLE_CODE[s.role] ? `${STAFF_ROLE_TO_ROLE_CODE[s.role]} (from ${titleCase(s.role)})` : 'none — pick one below'}</span></p>
                    </div>
                    <Field label="Email" className="md:col-span-2">
                      <Input value={linkDraft.email} onChange={(e) => setLinkDraft({ ...linkDraft, email: e.target.value })} required />
                    </Field>
                    <Field label="Login role">
                      <Select value={linkDraft.roleCode} onChange={(e) => setLinkDraft({ ...linkDraft, roleCode: e.target.value })} required>
                        <option value="">— select role —</option>
                        {roleCodes.map((c) => <option key={c} value={c}>{c}</option>)}
                      </Select>
                    </Field>
                    <Field label="Temporary password" hint="Staff can be reset anytime">
                      <Input type="password" value={linkDraft.password} onChange={(e) => setLinkDraft({ ...linkDraft, password: e.target.value })} placeholder="Min 8 chars" required />
                    </Field>
                    <div className="flex items-end justify-end gap-2 md:col-span-4">
                      <Button variant="ghost" size="sm" onClick={() => setLinkFor(null)}>Cancel</Button>
                      <Button size="sm" variant="green" type="submit" loading={busy === `link-${s.id}`} icon="user">Create login</Button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ------------------------------------------------ add */}
      <Card title="Add staff member" subtitle={`New ${facility?.name ?? ''} employee — role, licence and unit optional for support staff.`}>
        <form onSubmit={(e) => void createStaff(e)} className="grid gap-3 md:grid-cols-4">
          <Field label="Full name" className="md:col-span-2"><Input value={draft.fullName} onChange={(e) => setDraft({ ...draft, fullName: e.target.value })} placeholder="e.g. Dr. Ama Owusu" required /></Field>
          <Field label="Staff number" hint="Unique per facility"><Input value={draft.staffNumber} onChange={(e) => setDraft({ ...draft, staffNumber: e.target.value.toUpperCase() })} placeholder="e.g. KBTH-0142" required /></Field>
          <Field label="Role">
            <Select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })}>
              {ROLES.map((r) => <option key={r} value={r}>{titleCase(r)}</option>)}
            </Select>
          </Field>
          <Field label="Speciality"><Input value={draft.speciality} onChange={(e) => setDraft({ ...draft, speciality: e.target.value })} placeholder="e.g. Cardiology" /></Field>
          <Field label="Licence number"><Input value={draft.licenseNumber} onChange={(e) => setDraft({ ...draft, licenseNumber: e.target.value })} placeholder="e.g. GMC-…" /></Field>
          <Field label="Phone"><Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="0244 000 000" /></Field>
          <Field label="Email"><Input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="name@hospital.gh" /></Field>
          <Field label="Employment status">
            <Select value={draft.employmentStatus} onChange={(e) => setDraft({ ...draft, employmentStatus: e.target.value })}>
              {STATUSES.map((st) => <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>)}
            </Select>
          </Field>
          <Field label="Unit">
            <Select value={draft.unitId} onChange={(e) => setDraft({ ...draft, unitId: e.target.value })}>
              <option value="">— unassigned —</option>
              {units.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.code})</option>)}
            </Select>
          </Field>
          <Field label="Joined"><Input type="date" value={draft.joinedAt} onChange={(e) => setDraft({ ...draft, joinedAt: e.target.value })} /></Field>
          <label className={cn('flex items-center gap-2 text-xs font-semibold', !draft.unitId ? 'text-slate-400' : 'text-g-ink')}>
            <input type="checkbox" checked={draft.headOfUnit} disabled={!draft.unitId} onChange={(e) => setDraft({ ...draft, headOfUnit: e.target.checked })} className="h-4 w-4 rounded accent-g-navy" />
            Head of unit
          </label>
          <div className="flex items-end md:col-span-2"><Button type="submit" loading={busy === 'create'} icon="plus">Add staff</Button></div>
        </form>
      </Card>
    </div>
  );
}
