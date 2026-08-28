import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import type { HospitalUnit, Staff } from '../types';
import { Badge, Button, Field, Input, Select, Spinner, useToast } from './ui';
import { fmtDate } from '../lib/format';
import { cn } from './ui';

const ROLES = ['CONSULTANT', 'MEDICAL_OFFICER', 'SURGEON', 'OBSTETRICIAN', 'PAEDIATRICIAN', 'ANESTHETIST', 'NURSE', 'MIDWIFE', 'PHARMACIST', 'LAB_SCIENTIST', 'RADIOGRAPHER', 'RADIOLOGIST', 'PHYSIOTHERAPIST', 'HEALTH_INFO_OFFICER', 'RECORDS_OFFICER', 'HOSPITAL_ADMIN', 'ACCOUNTANT', 'CASHIER', 'STOREKEEPER', 'IT_ADMIN', 'SECURITY', 'PORTER', 'CLEANER', 'CHW', 'OTHER'];
const STATUSES = ['ACTIVE', 'ON_LEAVE', 'RETIRED', 'TERMINATED'];

const ROLE_TONE: Record<string, 'green' | 'blue' | 'gold' | 'red' | 'gray' | 'navy'> = {
  CONSULTANT: 'navy',
  MEDICAL_OFFICER: 'blue',
  SURGEON: 'navy',
  OBSTETRICIAN: 'navy',
  PAEDIATRICIAN: 'navy',
  ANESTHETIST: 'blue',
  NURSE: 'green',
  MIDWIFE: 'green',
  PHARMACIST: 'gold',
  LAB_SCIENTIST: 'gold',
  RADIOGRAPHER: 'gold',
  RADIOLOGIST: 'blue',
  PHYSIOTHERAPIST: 'green',
  HEALTH_INFO_OFFICER: 'gray',
  RECORDS_OFFICER: 'gray',
  HOSPITAL_ADMIN: 'navy',
  ACCOUNTANT: 'gray',
  CASHIER: 'gray',
  STOREKEEPER: 'gray',
  IT_ADMIN: 'blue',
  SECURITY: 'gray',
  PORTER: 'gray',
  CLEANER: 'gray',
  CHW: 'green',
  OTHER: 'gray',
};

const STATUS_TONE: Record<string, 'green' | 'gold' | 'gray' | 'red'> = {
  ACTIVE: 'green',
  ON_LEAVE: 'gold',
  RETIRED: 'gray',
  TERMINATED: 'red',
};

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

const EMPTY_DRAFT: Draft = {
  fullName: '', role: 'NURSE', speciality: '', staffNumber: '', licenseNumber: '', phone: '', email: '',
  employmentStatus: 'ACTIVE', headOfUnit: false, unitId: '', joinedAt: '', notes: '',
};

interface Props {
  facilityId: string;
  /** When set, the modal is scoped to one unit's team; otherwise it is the facility-wide directory. */
  unitId?: string | null;
  label: string; // facility or unit name for the header
  onClose: () => void;
  onChanged: () => void;
}

export default function UnitStaffManager({ facilityId, unitId = null, label, onClose, onChanged }: Props) {
  const toast = useToast();
  const [staff, setStaff] = useState<Staff[] | null>(null);
  const [units, setUnits] = useState<HospitalUnit[]>([]);
  const [summary, setSummary] = useState<{ total: number; assigned: number; heads: number; onLeave: number } | null>(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [draft, setDraft] = useState<Draft>({ ...EMPTY_DRAFT, unitId: unitId ?? '' });
  const [editing, setEditing] = useState<Staff | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const q = `facilityId=${encodeURIComponent(facilityId)}${unitId ? `&unitId=${encodeURIComponent(unitId)}` : ''}`;
    const res = await api<{ staff: Staff[]; summary: { total: number; assigned: number; heads: number; onLeave: number } }>(`/admin/masterdata/staff?${q}`);
    setStaff(res.staff);
    setSummary(res.summary);
  }, [facilityId, unitId]);

  const loadUnits = useCallback(async () => {
    const res = await api<{ facilities: { departments: { units: HospitalUnit[] }[] }[] }>(`/admin/masterdata/units?facilityId=${encodeURIComponent(facilityId)}`);
    const flat = res.facilities.flatMap((f) => f.departments.flatMap((d) => d.units)).sort((a, b) => a.name.localeCompare(b.name));
    setUnits(flat);
  }, [facilityId]);

  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);
  useEffect(() => {
    if (!unitId) void loadUnits().catch(() => undefined);
  }, [unitId, loadUnits]);

  const filtered = useMemo(() => (roleFilter ? (staff ?? []).filter((s) => s.role === roleFilter) : staff ?? []), [staff, roleFilter]);

  async function createStaff(e: FormEvent) {
    e.preventDefault();
    setBusy('create');
    try {
      await api('/admin/masterdata/staff', {
        method: 'POST',
        body: {
          facilityId,
          unitId: draft.unitId || undefined,
          staffNumber: draft.staffNumber,
          fullName: draft.fullName,
          role: draft.role,
          speciality: draft.speciality || undefined,
          licenseNumber: draft.licenseNumber || undefined,
          phone: draft.phone || undefined,
          email: draft.email || undefined,
          employmentStatus: draft.employmentStatus,
          headOfUnit: draft.headOfUnit,
          joinedAt: draft.joinedAt || undefined,
          notes: draft.notes || undefined,
        },
      });
      toast(`${draft.fullName} added`, 'success');
      setDraft({ ...EMPTY_DRAFT, unitId: unitId ?? '' });
      void load();
      onChanged();
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
        body: {
          fullName: editing.fullName,
          role: editing.role,
          speciality: editing.speciality ?? '',
          licenseNumber: editing.licenseNumber ?? '',
          phone: editing.phone ?? '',
          email: editing.email ?? '',
          employmentStatus: editing.employmentStatus,
          headOfUnit: editing.headOfUnit,
          unitId: editing.unit?.id ?? '',
          joinedAt: editing.joinedAt ?? '',
          notes: editing.notes ?? '',
        },
      });
      toast(`Saved ${editing.fullName}`, 'success');
      setEditing(null);
      void load();
      onChanged();
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
      toast(headOfUnit ? `${s.fullName} is now head of unit` : `Head flag removed from ${s.fullName}`, 'success');
      void load();
      onChanged();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setBusy(null);
    }
  }

  async function removeStaff(s: Staff) {
    if (!window.confirm(`Remove ${s.fullName} (${s.staffNumber}) from the staff directory?`)) return;
    setBusy(`remove-${s.id}`);
    try {
      await api(`/admin/masterdata/staff/${s.id}/remove`, { method: 'POST', body: {} });
      toast(`Removed ${s.fullName}`, 'success');
      void load();
      onChanged();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Remove failed', 'error');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-g-ink">{unitId ? `Team — ${label}` : `Staff directory — ${label}`}</h3>
            <p className="text-xs text-slate-400">Clinical cadres and support roles{unitId ? ' assigned to this unit' : ''} — with licence numbers, employment status and the head of unit.</p>
          </div>
          <button onClick={onClose} className="cursor-pointer rounded-lg p-2 text-slate-400 transition hover:bg-g-mist"><span className="text-lg leading-none">×</span></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!staff ? (
            <Spinner label="Loading staff…" />
          ) : (
            <div className="space-y-5">
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

              <div className="flex flex-wrap items-center gap-2">
                <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-52">
                  <option value="">All roles</option>
                  {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}</option>)}
                </Select>
                <span className="text-xs text-slate-400">{filtered.length} shown</span>
              </div>

              {filtered.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 px-4 py-8 text-center text-sm text-slate-400">
                  {staff.length === 0 ? 'No staff recorded here yet. Add the first member below.' : 'No staff match this role filter.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {filtered.map((s) => (
                    <div key={s.id} className="rounded-xl border border-slate-200 p-4 transition hover:shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-g-ink">{s.fullName}</p>
                            <Badge tone={ROLE_TONE[s.role] ?? 'gray'}>{s.role.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}</Badge>
                            <Badge tone={STATUS_TONE[s.employmentStatus] ?? 'gray'}>{s.employmentStatus.replace(/_/g, ' ')}</Badge>
                            {s.headOfUnit && <Badge tone="navy">★ head of unit</Badge>}
                          </div>
                          <p className="mt-1 font-mono text-[10px] text-slate-400">
                            {s.staffNumber}{s.speciality ? ` · ${s.speciality}` : ''}{s.licenseNumber ? ` · ${s.licenseNumber}` : ''}
                          </p>
                          {(s.phone || s.email) && (
                            <p className="mt-0.5 text-xs text-slate-500">{s.phone}{s.phone && s.email ? ' · ' : ''}{s.email}</p>
                          )}
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            {s.unit ? `${s.unit.name}` : 'Unassigned'}{s.joinedAt ? ` · joined ${fmtDate(s.joinedAt)}` : ''}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-1.5">
                          {!s.headOfUnit && s.unit && (
                            <button onClick={() => void setHead(s, true)} disabled={busy === `head-${s.id}`} className="cursor-pointer rounded-md border border-g-navy/30 bg-g-navy/5 px-2 py-1 text-[10px] font-bold text-g-navy transition hover:bg-g-navy hover:text-white" title="Make head of unit">
                              Make head
                            </button>
                          )}
                          {s.headOfUnit && (
                            <button onClick={() => void setHead(s, false)} disabled={busy === `head-${s.id}`} className="cursor-pointer rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-500 transition hover:bg-slate-100" title="Remove head flag">
                              Remove head
                            </button>
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
                              {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}</option>)}
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
                          {!unitId && (
                            <Field label="Unit">
                              <Select value={editing.unit?.id ?? ''} onChange={(e) => patchEdit({ unit: e.target.value ? { id: e.target.value, code: units.find((u) => u.id === e.target.value)?.code ?? '', name: units.find((u) => u.id === e.target.value)?.name ?? '' } : null })}>
                                <option value="">— unassigned —</option>
                                {units.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.code})</option>)}
                              </Select>
                            </Field>
                          )}
                          <label className={cn('flex items-center gap-2 text-xs font-semibold md:col-span-2', !unitId && !editing.unit ? 'text-slate-400' : 'text-g-ink')}>
                            <input type="checkbox" checked={editing.headOfUnit} disabled={!unitId && !editing.unit} onChange={(e) => patchEdit({ headOfUnit: e.target.checked })} className="h-4 w-4 rounded accent-g-navy" />
                            Head of unit (exclusive — promoting clears the previous head)
                          </label>
                          <div className="flex items-end justify-end gap-2 md:col-span-4">
                            <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
                            <Button size="sm" variant="green" onClick={() => void saveEdit()} loading={busy === `edit-${editing.id}`}>Save staff</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ------------------------------------------------ add */}
              <div className="rounded-xl border border-dashed border-slate-300 p-4">
                <p className="mb-3 text-sm font-bold text-g-ink">Add staff member</p>
                <form onSubmit={(e) => void createStaff(e)} className="grid gap-3 md:grid-cols-4">
                  <Field label="Full name" className="md:col-span-2"><Input value={draft.fullName} onChange={(e) => setDraft({ ...draft, fullName: e.target.value })} placeholder="e.g. Dr. Ama Owusu" required /></Field>
                  <Field label="Staff number" hint="Unique per facility"><Input value={draft.staffNumber} onChange={(e) => setDraft({ ...draft, staffNumber: e.target.value.toUpperCase() })} placeholder="e.g. KBTH-0142" required /></Field>
                  <Field label="Role">
                    <Select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })}>
                      {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}</option>)}
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
                  {!unitId && (
                    <Field label="Unit">
                      <Select value={draft.unitId} onChange={(e) => setDraft({ ...draft, unitId: e.target.value })}>
                        <option value="">— unassigned —</option>
                        {units.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.code})</option>)}
                      </Select>
                    </Field>
                  )}
                  <Field label="Joined"><Input type="date" value={draft.joinedAt} onChange={(e) => setDraft({ ...draft, joinedAt: e.target.value })} /></Field>
                  <label className={cn('flex items-center gap-2 text-xs font-semibold', !unitId && !draft.unitId ? 'text-slate-400' : 'text-g-ink')}>
                    <input type="checkbox" checked={draft.headOfUnit} disabled={!unitId && !draft.unitId} onChange={(e) => setDraft({ ...draft, headOfUnit: e.target.checked })} className="h-4 w-4 rounded accent-g-navy" />
                    Head of unit
                  </label>
                  <div className="flex items-end md:col-span-2"><Button type="submit" loading={busy === 'create'} icon="plus">Add staff</Button></div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
