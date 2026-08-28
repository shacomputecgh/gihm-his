import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import type { AdminFacility, AuthUser, HospitalUnit, UnitFacilityTree, UnitWard } from '../types';
import { Badge, Button, Card, EmptyState, Field, Input, Modal, Select, Spinner, useToast } from './ui';
import { useAuth } from '../lib/auth';
import { cn } from './ui';
import UnitEquipmentManager from './UnitEquipmentManager';
import UnitStaffManager from './UnitStaffManager';

/**
 * Hospital structure manager — Department → Unit → Ward → Bed.
 * Every facility in scope renders as a tree; units carry an in-charge,
 * contact, location and services, and wards carry the live bed board
 * (occupied/available). All changes are audited (masterdata.unit.*).
 */
const UNIT_TYPES = ['CLINICAL', 'DIAGNOSTIC', 'SUPPORT', 'ADMINISTRATIVE'];

/** Which facilities the current user may MANAGE units for. */
export function unitEditableFacility(user: AuthUser | null): (f: { id: string; region?: { id: string }; district?: { id: string } }) => boolean {
  if (!user || user.scope === 'NATIONAL') return () => true;
  if (user.scope === 'REGIONAL') return (f) => f.region?.id === user.regionId;
  if (user.scope === 'DISTRICT') return (f) => f.district?.id === user.districtId;
  return (f) => f.id === user.facilityId; // FACILITY scope
}

interface UnitDraft {
  code: string;
  name: string;
  type: string;
  departmentId: string;
  headName: string;
  headTitle: string;
  phone: string;
  location: string;
  bedCapacity: string;
  services: string;
}

const EMPTY_DRAFT: UnitDraft = { code: '', name: '', type: 'CLINICAL', departmentId: '', headName: '', headTitle: '', phone: '', location: '', bedCapacity: '', services: '' };

export default function UnitsManager() {
  const { user } = useAuth();
  const toast = useToast();
  const [tree, setTree] = useState<UnitFacilityTree[] | null>(null);
  const [facilities, setFacilities] = useState<AdminFacility[] | null>(null);
  const [facilityId, setFacilityId] = useState<string>('');
  const [draft, setDraft] = useState<UnitDraft>(EMPTY_DRAFT);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<HospitalUnit | null>(null);
  const [wardFor, setWardFor] = useState<HospitalUnit | null>(null);
  const [wardName, setWardName] = useState('');
  const [wardCapacity, setWardCapacity] = useState('');
  const [bedFor, setBedFor] = useState<{ unit: HospitalUnit; ward: UnitWard } | null>(null);
  const [bedNumber, setBedNumber] = useState('');
  const [equipmentFor, setEquipmentFor] = useState<HospitalUnit | null>(null);
  const [staffFor, setStaffFor] = useState<{ facilityId: string; unitId: string | null; label: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const loadTree = useCallback(async () => {
    const q = facilityId ? `?facilityId=${encodeURIComponent(facilityId)}` : '';
    setTree((await api<{ facilities: UnitFacilityTree[] }>(`/admin/masterdata/units${q}`)).facilities);
  }, [facilityId]);

  const loadFacilities = useCallback(async () => {
    setFacilities((await api<{ facilities: AdminFacility[] }>('/admin/masterdata/facilities')).facilities);
  }, []);

  useEffect(() => {
    void loadTree().catch(() => undefined);
  }, [loadTree]);
  useEffect(() => {
    void loadFacilities().catch(() => undefined);
  }, [loadFacilities]);

  const canEdit = useMemo(() => unitEditableFacility(user), [user]);
  const scopedFacilities = useMemo(() => (facilities ?? []).filter((f) => canEdit(f)), [facilities, canEdit]);

  function selectFacility(id: string) {
    setFacilityId(id);
    setCreating(false);
    setEditing(null);
    setDraft(EMPTY_DRAFT);
    setWardFor(null);
    setBedFor(null);
    setStaffFor(null);
  }

  // ---- create unit -------------------------------------------------------
  function openCreate() {
    if (!facilityId) {
      toast('Select a facility first', 'info');
      return;
    }
    setCreating(true);
    setEditing(null);
    setDraft(EMPTY_DRAFT);
  }

  async function createUnit(e: FormEvent) {
    e.preventDefault();
    setBusy('create');
    try {
      const body = {
        facilityId,
        code: draft.code,
        name: draft.name,
        type: draft.type,
        departmentId: draft.departmentId || undefined,
        headName: draft.headName || undefined,
        headTitle: draft.headTitle || undefined,
        phone: draft.phone || undefined,
        location: draft.location || undefined,
        bedCapacity: draft.bedCapacity === '' ? null : Number(draft.bedCapacity),
        services: draft.services.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean),
      };
      await api('/admin/masterdata/units', { method: 'POST', body });
      toast(`Unit ${draft.code} created`, 'success');
      setDraft(EMPTY_DRAFT);
      setCreating(false);
      void loadTree();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Create failed', 'error');
    } finally {
      setBusy(null);
    }
  }

  function patchEdit(part: Partial<HospitalUnit>) {
    setEditing((e) => (e ? { ...e, ...part } : e));
  }

  function openEdit(u: HospitalUnit) {
    setCreating(false);
    setEditing(u);
  }

  async function saveEdit() {
    if (!editing) return;
    setBusy(`edit-${editing.id}`);
    try {
      await api(`/admin/masterdata/units/${editing.id}`, {
        method: 'PUT',
        body: {
          name: editing.name,
          type: editing.type,
          departmentId: editing.department?.id ?? '',
          headName: editing.headName ?? '',
          headTitle: editing.headTitle ?? '',
          phone: editing.phone ?? '',
          location: editing.location ?? '',
          bedCapacity: editing.bedCapacity === null ? '' : editing.bedCapacity,
          services: editing.services,
          status: editing.status,
        },
      });
      toast(`Unit ${editing.code} saved`, 'success');
      setEditing(null);
      void loadTree();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setBusy(null);
    }
  }

  // ---- wards -------------------------------------------------------------
  function openWardModal(unit: HospitalUnit) {
    setWardFor(unit);
    setWardName('');
    setWardCapacity('');
  }

  async function addWard(e: FormEvent) {
    e.preventDefault();
    if (!wardFor) return;
    setBusy('ward');
    try {
      await api(`/admin/masterdata/units/${wardFor.id}/wards`, {
        method: 'POST',
        body: { name: wardName, bedCapacity: wardCapacity === '' ? null : Number(wardCapacity) },
      });
      toast(`Ward “${wardName}” added`, 'success');
      setWardFor(null);
      void loadTree();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Add ward failed', 'error');
    } finally {
      setBusy(null);
    }
  }

  // ---- beds --------------------------------------------------------------
  function openBedModal(unit: HospitalUnit, ward: UnitWard) {
    setBedFor({ unit, ward });
    setBedNumber('');
  }

  async function addBed(e: FormEvent) {
    e.preventDefault();
    if (!bedFor) return;
    setBusy('bed');
    try {
      await api(`/admin/masterdata/units/${bedFor.unit.id}/beds`, {
        method: 'POST',
        body: { wardId: bedFor.ward.id, bedNumber },
      });
      toast(`Bed ${bedNumber} added to ${bedFor.ward.name}`, 'success');
      setBedFor(null);
      void loadTree();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Add bed failed', 'error');
    } finally {
      setBusy(null);
    }
  }

  const facility = scopedFacilities.find((f) => f.id === facilityId);
  const departments = facility?.departments ?? [];

  return (
    <div className="space-y-5">
      <Card title="Hospital structure" subtitle="Department → Unit → Ward → Bed. Units carry an in-charge, contact and location; wards hold the live bed board.">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Facility" className="min-w-[280px] flex-1">
            <Select value={facilityId} onChange={(e) => selectFacility(e.target.value)}>
              <option value="">Select a facility…</option>
              {scopedFacilities.map((f) => (
                <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
              ))}
            </Select>
          </Field>
          <Button variant="navy" icon="plus" onClick={openCreate} disabled={!facilityId}>New unit</Button>
        </div>
        {facility && (
          <p className="mt-2 text-xs text-slate-400">
            {departments.length} department(s) · units grouped below. Units without a department are listed under “—”.
          </p>
        )}
      </Card>

      {facilityId && facility && (
        <Card pad={false} title={`${facility.name}`} subtitle="Click any unit to edit its details.">
          {!tree ? (
            <Spinner />
          ) : tree.length === 0 ? (
            <EmptyState icon="building" title="No units yet" message="Create the first unit with “New unit” above." />
          ) : (
            <div className="divide-y divide-slate-50">
              {tree.map((f) => (
                <div key={f.facility.id} className="px-5 py-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{f.facility.code} · {f.facility.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">
                        {f.departments.reduce((acc, d) => acc + d.units.length, 0)} unit(s) · {f.facility.staff?.total ?? 0} staff
                      </span>
                      <Button size="sm" variant="outline" icon="users" onClick={() => setStaffFor({ facilityId: f.facility.id, unitId: null, label: f.facility.name })}>Staff</Button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {f.departments.map((dep) => (
                      <div key={dep.department?.id ?? 'none'}>
                        <p className="mb-2 flex items-center gap-2 text-sm font-bold text-g-ink">
                          {dep.department?.name ?? '— unassigned —'}
                          <Badge tone="gray">{dep.units.length}</Badge>
                        </p>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {dep.units.map((u) => (
                            <div key={u.id} className={cn('rounded-xl border p-4 transition hover:shadow-md', u.status === 'ACTIVE' ? 'border-slate-200' : 'border-slate-200 opacity-60')}>
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-bold text-g-ink">{u.name}</p>
                                  <p className="font-mono text-[10px] text-slate-400">{u.code}</p>
                                </div>
                                <Badge tone={u.type === 'CLINICAL' ? 'green' : u.type === 'DIAGNOSTIC' ? 'blue' : u.type === 'SUPPORT' ? 'gold' : 'gray'}>{u.type}</Badge>
                              </div>
                              {u.headName && <p className="mt-2 text-xs text-slate-600"><span className="text-slate-400">In-charge:</span> {u.headName}{u.headTitle ? ` · ${u.headTitle}` : ''}</p>}
                              {u.location && <p className="text-xs text-slate-500">{u.location}</p>}
                              {u.phone && <p className="text-xs text-slate-500">{u.phone}</p>}
                              <div className="mt-2.5 flex flex-wrap gap-1">
                                <Badge tone="navy">{u.beds} bed{u.beds === 1 ? '' : 's'}</Badge>
                                <Badge tone={u.occupied > 0 ? 'gold' : 'gray'}>{u.occupied} occupied</Badge>
                                <Badge tone={u.equipment?.items ? 'blue' : 'gray'}>{u.equipment?.items ?? 0} equipment</Badge>
                                {u.equipment && (u.equipment.inMaintenance > 0 || u.equipment.faulty > 0) && (
                                  <Badge tone="gold">{u.equipment.inMaintenance} maint · {u.equipment.faulty} faulty</Badge>
                                )}
                                {u.equipment && u.equipment.maintenanceDue > 0 && <Badge tone="gold">{u.equipment.maintenanceDue} due</Badge>}
                                <Badge tone={u.team?.count ? 'navy' : 'gray'}>{u.team?.count ?? 0} staff</Badge>
                                {u.team && u.team.heads > 0 && <Badge tone="navy">★ {u.team.heads} head{u.team.heads === 1 ? '' : 's'}</Badge>}
                                {u.team && u.team.onLeave > 0 && <Badge tone="gold">{u.team.onLeave} on leave</Badge>}
                                {u.services.length > 0 && <Badge tone="gray">{u.services.join(', ')}</Badge>}
                              </div>

                              <div className="mt-3 space-y-1.5">
                                {u.wards.map((w) => (
                                  <div key={w.id} className="flex items-center justify-between rounded-lg bg-g-mist/60 px-2.5 py-1.5">
                                    <div className="min-w-0">
                                      <p className="truncate text-xs font-semibold text-g-ink">{w.name}</p>
                                      <p className="text-[10px] text-slate-400">{w.occupied}/{w.beds} occupied{w.bedCapacity ? ` · capacity ${w.bedCapacity}` : ''}</p>
                                    </div>
                                    <button onClick={() => openBedModal(u, w)} className="cursor-pointer rounded-md bg-white px-2 py-1 text-[10px] font-bold text-g-navy shadow-sm transition hover:bg-g-navy hover:text-white" title={`Add bed to ${w.name}`}>
                                      + Bed
                                    </button>
                                  </div>
                                ))}
                                {u.wards.length === 0 && <p className="text-[11px] text-slate-400">No wards yet.</p>}
                              </div>

                              <div className="mt-3 flex gap-2">
                                <Button size="sm" variant="outline" icon="edit" onClick={() => openEdit(u)}>Edit</Button>
                                <Button size="sm" variant="ghost" icon="plus" onClick={() => openWardModal(u)}>Ward</Button>
                                <Button size="sm" variant="ghost" icon="settings" onClick={() => { setCreating(false); setEditing(null); setEquipmentFor(u); }}>Equipment</Button>
                                <Button size="sm" variant="ghost" icon="users" onClick={() => { setCreating(false); setEditing(null); setStaffFor({ facilityId: f.facility.id, unitId: u.id, label: u.name }); }}>Team</Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {!facilityId && (
        <EmptyState icon="building" title="Select a facility" message="Pick the facility whose departments, units, wards and beds you want to manage." />
      )}

      {/* -------------------------------------------------- create unit */}
      {facilityId && creating && !editing && (
        <Card title={`New unit — ${facility?.name ?? ''}`}>
          <form onSubmit={(e) => void createUnit(e)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Unit code" hint="Short code, e.g. ICU, NICU, MAT-ANTE">
                <Input value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })} placeholder="ICU" required />
              </Field>
              <Field label="Unit name" className="md:col-span-2">
                <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Intensive Care Unit" required />
              </Field>
              <Field label="Type">
                <Select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>
                  {UNIT_TYPES.map((t) => <option key={t} value={t}>{t[0] + t.slice(1).toLowerCase()}</option>)}
                </Select>
              </Field>
              <Field label="Department">
                <Select value={draft.departmentId} onChange={(e) => setDraft({ ...draft, departmentId: e.target.value })}>
                  <option value="">— none —</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>
              </Field>
              <Field label="Bed capacity">
                <Input type="number" min={0} value={draft.bedCapacity} onChange={(e) => setDraft({ ...draft, bedCapacity: e.target.value })} placeholder="Optional" />
              </Field>
              <Field label="Head of unit">
                <Input value={draft.headName} onChange={(e) => setDraft({ ...draft, headName: e.target.value })} placeholder="e.g. Dr. Ama Owusu" />
              </Field>
              <Field label="Head title">
                <Input value={draft.headTitle} onChange={(e) => setDraft({ ...draft, headTitle: e.target.value })} placeholder="e.g. Consultant Physician" />
              </Field>
              <Field label="Phone / extension">
                <Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="e.g. 0302 000 100" />
              </Field>
              <Field label="Location">
                <Input value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} placeholder="e.g. Block A, 2nd Floor" />
              </Field>
              <Field label="Services" hint="Comma-separated, e.g. OPD, ICU, MATERNITY" className="md:col-span-2">
                <Input value={draft.services} onChange={(e) => setDraft({ ...draft, services: e.target.value })} placeholder="OPD, ICU" />
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setCreating(false); setDraft(EMPTY_DRAFT); }}>Cancel</Button>
              <Button type="submit" variant="green" loading={busy === 'create'}>Create unit</Button>
            </div>
          </form>
        </Card>
      )}

      {/* --------------------------------------------------- edit unit */}
      {editing && (
        <Card title={`Edit ${editing.code}`} subtitle="All changes are audited (masterdata.unit.update).">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Unit name" className="md:col-span-2">
              <Input value={editing.name} onChange={(e) => patchEdit({ name: e.target.value })} />
            </Field>
            <Field label="Type">
              <Select value={editing.type} onChange={(e) => patchEdit({ type: e.target.value })}>
                {UNIT_TYPES.map((t) => <option key={t} value={t}>{t[0] + t.slice(1).toLowerCase()}</option>)}
              </Select>
            </Field>
            <Field label="Department">
              <Select value={editing.department?.id ?? ''} onChange={(e) => patchEdit({ department: e.target.value ? { id: e.target.value, name: departments.find((d) => d.id === e.target.value)?.name ?? '' } : null })}>
                <option value="">— none —</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </Field>
            <Field label="Bed capacity">
              <Input type="number" min={0} value={editing.bedCapacity === null ? '' : String(editing.bedCapacity)} onChange={(e) => patchEdit({ bedCapacity: e.target.value === '' ? null : Number(e.target.value) })} />
            </Field>
            <Field label="Status">
              <Select value={editing.status} onChange={(e) => patchEdit({ status: e.target.value })}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </Field>
            <Field label="Head of unit">
              <Input value={editing.headName ?? ''} onChange={(e) => patchEdit({ headName: e.target.value })} />
            </Field>
            <Field label="Head title">
              <Input value={editing.headTitle ?? ''} onChange={(e) => patchEdit({ headTitle: e.target.value })} />
            </Field>
            <Field label="Phone / extension">
              <Input value={editing.phone ?? ''} onChange={(e) => patchEdit({ phone: e.target.value })} />
            </Field>
            <Field label="Location">
              <Input value={editing.location ?? ''} onChange={(e) => patchEdit({ location: e.target.value })} />
            </Field>
            <Field label="Services" hint="Comma-separated service codes" className="md:col-span-2">
              <Input value={editing.services.join(', ')} onChange={(e) => patchEdit({ services: e.target.value.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean) })} />
            </Field>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button variant="green" onClick={() => void saveEdit()} loading={busy === `edit-${editing.id}`}>Save unit</Button>
          </div>
        </Card>
      )}

      {/* ------------------------------------------------- add ward */}
      {wardFor && (
        <Modal onClose={() => setWardFor(null)}>
            <h3 className="text-lg font-bold text-g-ink">Add ward to {wardFor.name}</h3>
            <form onSubmit={(e) => void addWard(e)} className="mt-4 space-y-3">
              <Field label="Ward name">
                <Input value={wardName} onChange={(e) => setWardName(e.target.value)} placeholder="e.g. Male Surgical Ward" autoFocus required />
              </Field>
              <Field label="Bed capacity" hint="Optional — the number of beds this ward can hold">
                <Input type="number" min={0} value={wardCapacity} onChange={(e) => setWardCapacity(e.target.value)} placeholder="Optional" />
              </Field>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setWardFor(null)}>Cancel</Button>
                <Button type="submit" loading={busy === 'ward'}>Add ward</Button>
              </div>
            </form>
        </Modal>
      )}

      {/* ---------------------------------------------- equipment modal */}
      {equipmentFor && (
        <UnitEquipmentManager unit={equipmentFor} onClose={() => setEquipmentFor(null)} onChanged={() => void loadTree()} />
      )}

      {/* ------------------------------------------------ staff modal */}
      {staffFor && (
        <UnitStaffManager
          facilityId={staffFor.facilityId}
          unitId={staffFor.unitId}
          label={staffFor.label}
          onClose={() => setStaffFor(null)}
          onChanged={() => void loadTree()}
        />
      )}

      {/* ------------------------------------------------- add bed */}
      {bedFor && (
        <Modal onClose={() => setBedFor(null)}>
            <h3 className="text-lg font-bold text-g-ink">Add bed</h3>
            <p className="mt-1 text-sm text-slate-500">{bedFor.unit.name} → <strong>{bedFor.ward.name}</strong></p>
            <form onSubmit={(e) => void addBed(e)} className="mt-4 space-y-3">
              <Field label="Bed number" hint="e.g. SW-01, M-12">
                <Input value={bedNumber} onChange={(e) => setBedNumber(e.target.value)} placeholder="SW-01" autoFocus required />
              </Field>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setBedFor(null)}>Cancel</Button>
                <Button type="submit" loading={busy === 'bed'}>Add bed</Button>
              </div>
            </form>
        </Modal>
      )}
    </div>
  );
}
