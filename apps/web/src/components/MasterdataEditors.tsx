import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import type { AdminFacility, AuthUser, EpiScheduleAdminItem, GeoRegion, PermissionInfo, RoleRow } from '../types';
import { Badge, Button, Card, Field, Input, Select, Spinner, useToast } from './ui';
import { useAuth } from '../lib/auth';
import ImmunizationCoverage from './ImmunizationCoverage';

/** Which facilities the current user may EDIT (registry reads stay broad). */
function editableFacility(user: AuthUser | null): (f: { id: string; region?: { id: string }; district?: { id: string } }) => boolean {
  if (!user || user.scope === 'NATIONAL') return () => true;
  if (user.scope === 'REGIONAL') return (f) => f.region?.id === user.regionId;
  if (user.scope === 'DISTRICT') return (f) => f.district?.id === user.districtId;
  return (f) => f.id === user.facilityId; // FACILITY scope
}

const FACILITY_TYPES = ['CHPS_COMPOUND', 'HEALTH_CENTRE', 'CLINIC', 'MATERNITY_HOME', 'POLYCLINIC', 'DISTRICT_HOSPITAL', 'MUNICIPAL_HOSPITAL', 'REGIONAL_HOSPITAL', 'TEACHING_HOSPITAL', 'UNIVERSITY_HOSPITAL', 'PSYCHIATRIC_HOSPITAL', 'SPECIALIST_HOSPITAL', 'PRIVATE_HOSPITAL', 'MISSION_HOSPITAL', 'QUASI_GOVT_HOSPITAL', 'LABORATORY', 'PHARMACY', 'DIAGNOSTIC_CENTRE', 'REHABILITATION_FACILITY', 'OTHER'];
const OWNERSHIPS = ['GOVERNMENT', 'GHS', 'MOH', 'TEACHING_HOSPITAL', 'CHAG_MISSION', 'PRIVATE', 'QUASI_GOVT', 'NGO', 'OTHER'];
const OP_STATUSES = ['OPERATIONAL', 'TEMPORARILY_CLOSED', 'UNDER_CONSTRUCTION', 'INACTIVE', 'SUSPENDED'];
const ACCREDITATIONS = ['ACCREDITED', 'PENDING_ACCREDITATION', ''];
const ROLE_SCOPES = ['NATIONAL', 'REGIONAL', 'DISTRICT', 'FACILITY', 'PATIENT'];

// =================================================================== EPI
export function EpiScheduleEditor() {
  const toast = useToast();
  const { user } = useAuth();
  const [items, setItems] = useState<EpiScheduleAdminItem[] | null>(null);
  const [orig, setOrig] = useState<EpiScheduleAdminItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [coverageKey, setCoverageKey] = useState(0); // remount coverage after saves
  const [showPreview, setShowPreview] = useState(false); // before/after coverage preview
  const canSeeCoverage = (user?.permissions.includes('view_reports') ?? false) || (user?.permissions.includes('view_dashboard') ?? false);

  const load = useCallback(async () => {
    const res = await api<{ items: EpiScheduleAdminItem[] }>('/admin/masterdata/epi-schedule');
    setItems(res.items);
    setOrig(res.items);
  }, []);
  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  function patch(i: number, part: Partial<EpiScheduleAdminItem>) {
    setItems((cur) => (cur ? cur.map((it, idx) => (idx === i ? { ...it, ...part } : it)) : cur));
  }

  async function save() {
    if (!items) return;
    const changed = items.filter((it, i) => {
      const o = orig[i]!;
      return it.label !== o.label || it.description !== o.description || it.ageDays !== o.ageDays || it.intervalDays !== o.intervalDays || it.active !== o.active;
    });
    if (changed.length === 0) {
      toast('No changes to save', 'info');
      return;
    }
    setSaving(true);
    try {
      const res = await api<{ updated: string[] }>('/admin/masterdata/epi-schedule', {
        method: 'PUT',
        body: { items: changed.map(({ vaccine, dose, label, description, ageDays, intervalDays, active }) => ({ vaccine, dose, label, description, ageDays, intervalDays, active })) },
      });
      toast(`Saved ${res.updated.length} schedule change(s) — applies immediately`, 'success');
      setCoverageKey((k) => k + 1); // recompute coverage from the edited schedule
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    if (!window.confirm('Reset the ENTIRE EPI schedule to the built-in Ghana defaults? Custom changes are discarded.')) return;
    setSaving(true);
    try {
      await api('/admin/masterdata/epi-schedule/reset', { method: 'POST', body: {} });
      toast('Schedule reset to defaults', 'success');
      setCoverageKey((k) => k + 1);
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Reset failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (!items) {
    return (
      <div className="py-16">
        <Spinner label="Loading schedule…" />
      </div>
    );
  }

  const draftItems = items.map(({ vaccine, dose, ageDays, active }) => ({ vaccine, dose, ageDays, active }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-slate-500">
          The Ghana EPI schedule drives all due-date calculations. Edits apply immediately. Deactivating an entry removes it from the
          schedule; saving a blank timing field falls back to the <code className="font-mono text-xs">next-dose</code> rule.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => void reset()} disabled={saving}>Reset to defaults</Button>
          <Button size="sm" variant="outline" onClick={() => setShowPreview((p) => !p)} disabled={saving || !canSeeCoverage}>Coverage before / after</Button>
          <Button size="sm" variant="green" onClick={() => void save()} loading={saving}>Save changes</Button>
        </div>
      </div>

      {canSeeCoverage && (
        <Card title="Coverage with this schedule" subtitle="Recomputed live after every save — denominators follow the edited due ages, so you can see the effect of a schedule change.">
          <ImmunizationCoverage key={`live-${coverageKey}`} />
          {showPreview && (
            <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Preview of unsaved changes</p>
              <ImmunizationCoverage key={`preview-${coverageKey}`} previewItems={draftItems} />
            </div>
          )}
        </Card>
      )}

      <Card pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
                {['Vaccine', 'Dose', 'Label', 'Description', 'Age (days)', 'Interval (days)', 'Active', ''].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map((it, i) => (
                <tr key={`${it.vaccine}|${it.dose}`} className={it.active ? '' : 'opacity-50'}>
                  <td className="px-4 py-2 font-mono text-xs font-bold text-g-navy">{it.vaccine}</td>
                  <td className="px-4 py-2 font-mono text-xs">{it.dose}</td>
                  <td className="px-4 py-2"><Input className="min-w-[120px] py-1.5" value={it.label} onChange={(e) => patch(i, { label: e.target.value })} /></td>
                  <td className="px-4 py-2"><Input className="min-w-[220px] py-1.5" value={it.description} onChange={(e) => patch(i, { description: e.target.value })} /></td>
                  <td className="px-4 py-2"><Input className="w-20 py-1.5" type="number" value={it.ageDays === null ? '' : String(it.ageDays)} onChange={(e) => patch(i, { ageDays: e.target.value === '' ? null : Number(e.target.value) })} /></td>
                  <td className="px-4 py-2"><Input className="w-20 py-1.5" type="number" value={it.intervalDays === null ? '' : String(it.intervalDays)} onChange={(e) => patch(i, { intervalDays: e.target.value === '' ? null : Number(e.target.value) })} /></td>
                  <td className="px-4 py-2">
                    <input type="checkbox" checked={it.active} onChange={(e) => patch(i, { active: e.target.checked })} className="h-4 w-4 cursor-pointer accent-g-navy" />
                  </td>
                  <td className="px-4 py-2">
                    {it.source === 'custom' ? <Badge tone="green">custom</Badge> : <Badge tone="gray">default</Badge>}
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

// ================================================================== Roles
export function RolesEditor() {
  const toast = useToast();
  const [roles, setRoles] = useState<RoleRow[] | null>(null);
  const [catalog, setCatalog] = useState<PermissionInfo[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ code: '', name: '', scope: 'FACILITY' });
  const [creatingBusy, setCreatingBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await api<{ roles: RoleRow[]; catalog: PermissionInfo[] }>('/admin/masterdata/roles');
    setRoles(res.roles);
    setCatalog(res.catalog);
  }, []);
  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  async function createRole() {
    if (!draft.code || !draft.name) {
      toast('Enter a code and name for the new role', 'error');
      return;
    }
    setCreatingBusy(true);
    try {
      const res = await api<{ role: { code: string } }>('/admin/masterdata/roles', {
        method: 'POST',
        body: { code: draft.code, name: draft.name, scope: draft.scope, permissions: [] },
      });
      toast(`Role ${res.role.code} created — add permissions next`, 'success');
      setCreating(false);
      setDraft({ code: '', name: '', scope: 'FACILITY' });
      setSelected(res.role.code);
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Create failed', 'error');
    } finally {
      setCreatingBusy(false);
    }
  }

  async function deleteRole(r: RoleRow) {
    if (!window.confirm(`Delete role ${r.code}? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await api(`/admin/masterdata/roles/${r.code}`, { method: 'DELETE' });
      toast(`Role ${r.code} deleted`, 'success');
      if (selected === r.code) setSelected(null);
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  const role = useMemo(() => roles?.find((r) => r.code === selected) ?? null, [roles, selected]);

  function togglePerm(code: string) {
    if (!role) return;
    const has = role.permissions.includes(code);
    setRoles((cur) => (cur ? cur.map((r) => (r.code === role.code ? { ...r, permissions: has ? r.permissions.filter((p) => p !== code) : [...r.permissions, code] } : r)) : cur));
  }

  async function save() {
    if (!role) return;
    setSaving(true);
    try {
      await api(`/admin/masterdata/roles/${role.code}`, {
        method: 'PUT',
        body: { name: role.name, scope: role.scope, permissions: role.permissions },
      });
      toast(`Role ${role.code} saved — applies on next login`, 'success');
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (!roles) {
    return (
      <div className="py-16">
        <Spinner label="Loading roles…" />
      </div>
    );
  }

  const groups = [...new Set(catalog.map((p) => p.group))];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-slate-500">
          Edit built-in roles or create your own — every role grants a scope and a permission set. Changes apply on the role's next login.
        </p>
        <Button size="sm" variant="navy" onClick={() => setCreating((c) => !c)}>Create role</Button>
      </div>

      {creating && (
        <Card title="Create role" subtitle="Start with name + scope, then tick permissions in the editor.">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Role code" hint="Uppercase, e.g. LAB_TECH">
              <Input value={draft.code} onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value.toUpperCase().replace(/\s+/g, '_') }))} placeholder="LAB_TECH" />
            </Field>
            <Field label="Role name">
              <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Laboratory Technician" />
            </Field>
            <Field label="Scope">
              <Select value={draft.scope} onChange={(e) => setDraft((d) => ({ ...d, scope: e.target.value }))}>
                {ROLE_SCOPES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
            <Button variant="green" onClick={() => void createRole()} loading={creatingBusy}>Create role</Button>
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <Card pad={false} title="Roles">
        <div className="max-h-[560px] overflow-y-auto">
          {roles.map((r) => (
            <button
              key={r.code}
              onClick={() => setSelected(r.code)}
              className={`block w-full cursor-pointer border-b border-slate-50 px-4 py-2.5 text-left transition hover:bg-g-mist/50 ${selected === r.code ? 'bg-g-mist/80' : ''}`}
            >
              <p className="text-sm font-bold text-g-ink">{r.name}</p>
              <p className="font-mono text-[10px] text-slate-400">{r.code} · {r.scope} · {r.userCount} user{r.userCount === 1 ? '' : 's'}</p>
            </button>
          ))}
        </div>
      </Card>

      {role ? (
        <div className="space-y-4">
          <Card title={`Edit ${role.code}`} subtitle="Permission changes take effect on the role's next login.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Role name">
                <Input value={role.name} onChange={(e) => setRoles((cur) => (cur ? cur.map((r) => (r.code === role.code ? { ...r, name: e.target.value } : r)) : cur))} />
              </Field>
              <Field label="Scope">
                <Select
                  value={role.scope}
                  onChange={(e) => setRoles((cur) => (cur ? cur.map((r) => (r.code === role.code ? { ...r, scope: e.target.value } : r)) : cur))}
                  disabled={role.code === 'PATIENT'}
                >
                  {ROLE_SCOPES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="mt-4 space-y-4">
              {groups.map((g) => (
                <div key={g}>
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">{g}</p>
                  <div className="grid gap-1.5 md:grid-cols-2">
                    {catalog.filter((p) => p.group === g).map((p) => {
                      const locked = role.code === 'PATIENT' && p.code === 'self_access';
                      const checked = role.permissions.includes(p.code);
                      return (
                        <label key={p.code} className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm transition ${checked ? 'border-g-navy/30 bg-g-navy/5' : 'border-slate-100 hover:border-slate-200'}`}>
                          <input type="checkbox" checked={checked} disabled={locked} onChange={() => togglePerm(p.code)} className="mt-0.5 h-4 w-4 cursor-pointer accent-g-navy" />
                          <span className="text-g-ink">
                            {p.label}
                            {locked && <Badge tone="gray" className="ml-1.5">required</Badge>}
                            <span className="block font-mono text-[10px] text-slate-400">{p.code}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              {role.userCount === 0 && !['DEVELOPER', 'PATIENT'].includes(role.code) && (
                <Button variant="danger" size="sm" onClick={() => void deleteRole(role)} loading={saving}>Delete role</Button>
              )}
              <Button variant="green" onClick={() => void save()} loading={saving}>Save role</Button>
            </div>
          </Card>
        </div>
      ) : (
        <Card>
          <p className="py-10 text-center text-sm text-slate-400">Select a role to edit its name, scope and permissions.</p>
        </Card>
      )}
      </div>
    </div>
  );
}

// ============================================================ Facilities
export function FacilitiesEditor() {
  const toast = useToast();
  const { user } = useAuth();
  const [facilities, setFacilities] = useState<AdminFacility[] | null>(null);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AdminFacility | null>(null);
  const [saving, setSaving] = useState(false);
  const [geo, setGeo] = useState<GeoRegion[] | null>(null);

  const loadFacilities = useCallback(async () => {
    const res = await api<{ facilities: AdminFacility[] }>('/admin/masterdata/facilities');
    setFacilities(res.facilities);
  }, []);
  const loadGeo = useCallback(async () => {
    const res = await api<{ regions: GeoRegion[] }>('/admin/masterdata/geography');
    setGeo(res.regions);
  }, []);
  useEffect(() => {
    void loadFacilities().catch(() => undefined);
    void loadGeo().catch(() => undefined);
  }, [loadFacilities, loadGeo]);

  const canEdit = useMemo(() => editableFacility(user), [user]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = (facilities ?? []).filter((f) => (q ? f.name.toLowerCase().includes(q) || f.code.toLowerCase().includes(q) : true));
    return base.filter((f) => canEdit(f));
  }, [facilities, query, canEdit]);

  const visibleRegions = useMemo(() => {
    if (!user || user.scope === 'NATIONAL') return geo ?? [];
    if (user.scope === 'REGIONAL') return (geo ?? []).filter((r) => r.id === user.regionId);
    if (user.scope === 'DISTRICT') return (geo ?? []).filter((r) => r.districts.some((d) => d.id === user.districtId));
    return []; // facility-scope staff edit facilities only
  }, [geo, user]);

  function select(f: AdminFacility) {
    setSelectedId(f.id);
    setDraft({ ...f, services: [...f.services], departmentsJson: [...f.departmentsJson] });
  }

  function setD(k: keyof AdminFacility, v: unknown) {
    setDraft((d) => (d ? { ...d, [k]: v } : d));
  }

  async function saveFacility() {
    if (!draft) return;
    setSaving(true);
    try {
      await api(`/admin/masterdata/facilities/${draft.id}`, {
        method: 'PUT',
        body: {
          name: draft.name,
          type: draft.type,
          level: draft.level ?? '',
          ownership: draft.ownership,
          operationalStatus: draft.operationalStatus,
          accreditation: draft.accreditation ?? '',
          telephone: draft.telephone ?? '',
          email: draft.email ?? '',
          address: draft.address ?? '',
          website: draft.website ?? '',
          emergencyContact: draft.emergencyContact ?? '',
          bedCapacity: draft.bedCapacity ?? '',
          services: draft.services,
          departments: draft.departmentsJson,
        },
      });
      toast(`Facility ${draft.code} saved`, 'success');
      void loadFacilities();
      setSelectedId(null);
      setDraft(null);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  // ---- geography -------------------------------------------------------
  function patchRegion(id: string, part: Partial<GeoRegion>) {
    setGeo((cur) => (cur ? cur.map((r) => (r.id === id ? { ...r, ...part } : r)) : cur));
  }
  function patchDistrict(regionId: string, districtId: string, part: Partial<GeoRegion['districts'][number]>) {
    setGeo((cur) => (cur ? cur.map((r) => (r.id === regionId ? { ...r, districts: r.districts.map((d) => (d.id === districtId ? { ...d, ...part } : d)) } : r)) : cur));
  }
  async function saveRegion(id: string) {
    const r = geo?.find((g) => g.id === id);
    if (!r) return;
    try {
      await api(`/admin/masterdata/regions/${id}`, { method: 'PUT', body: { name: r.name, capital: r.capital ?? '', status: r.status } });
      toast(`Region ${r.code} saved`, 'success');
      void loadGeo();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  }
  async function saveDistrict(d: GeoRegion['districts'][number]) {
    try {
      await api(`/admin/masterdata/districts/${d.id}`, { method: 'PUT', body: { name: d.name, capital: d.capital ?? '', type: d.type, status: d.status } });
      toast(`District ${d.code} saved`, 'success');
      void loadGeo();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  }

  if (!facilities) {
    return (
      <div className="py-16">
        <Spinner label="Loading facility registry…" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card title="Facility registry" subtitle={`${user?.scope === 'NATIONAL' ? 'National facility list' : 'Facilities within your scope'} — edit profiles, services and departments.`}>
        <div className="mb-3">
          <Input placeholder="Search by name or code…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((f) => (
            <button
              key={f.id}
              onClick={() => select(f)}
              className={`cursor-pointer rounded-xl border p-3.5 text-left transition hover:shadow-md ${selectedId === f.id ? 'border-g-navy bg-g-navy/5' : 'border-slate-100 hover:border-slate-200'}`}
            >
              <p className="font-bold text-g-ink">{f.name}</p>
              <p className="font-mono text-[11px] text-slate-400">{f.code} · {f.region?.name ?? '—'} / {f.district?.name ?? '—'}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge tone="navy">{f.type.replace(/_/g, ' ')}</Badge>
                <Badge tone={f.operationalStatus === 'OPERATIONAL' ? 'green' : 'gold'}>{f.operationalStatus.replace(/_/g, ' ')}</Badge>
              </div>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-sm text-slate-400">No facilities match “{query}”.</p>}
        </div>
      </Card>

      {draft && (
        <Card title={`Edit ${draft.code}`}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Facility name"><Input value={draft.name} onChange={(e) => setD('name', e.target.value)} /></Field>
            <Field label="Type">
              <Select value={draft.type} onChange={(e) => setD('type', e.target.value)}>{FACILITY_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}</Select>
            </Field>
            <Field label="Ownership">
              <Select value={draft.ownership} onChange={(e) => setD('ownership', e.target.value)}>{OWNERSHIPS.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}</Select>
            </Field>
            <Field label="Operational status">
              <Select value={draft.operationalStatus} onChange={(e) => setD('operationalStatus', e.target.value)}>{OP_STATUSES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}</Select>
            </Field>
            <Field label="Accreditation">
              <Select value={draft.accreditation ?? ''} onChange={(e) => setD('accreditation', e.target.value)}>{ACCREDITATIONS.map((t) => <option key={t} value={t}>{t ? t.replace(/_/g, ' ') : 'None'}</option>)}</Select>
            </Field>
            <Field label="Bed capacity"><Input type="number" value={draft.bedCapacity === null ? '' : String(draft.bedCapacity)} onChange={(e) => setD('bedCapacity', e.target.value === '' ? null : Number(e.target.value))} /></Field>
            <Field label="Telephone"><Input value={draft.telephone ?? ''} onChange={(e) => setD('telephone', e.target.value)} /></Field>
            <Field label="Email"><Input value={draft.email ?? ''} onChange={(e) => setD('email', e.target.value)} /></Field>
            <Field label="Address" hint="Physical address"><Input value={draft.address ?? ''} onChange={(e) => setD('address', e.target.value)} /></Field>
            <Field label="Website"><Input value={draft.website ?? ''} onChange={(e) => setD('website', e.target.value)} /></Field>
            <Field label="Services" hint="Comma-separated service codes, e.g. OPD, MATERNITY, PHARMACY">
              <Input value={draft.services.join(', ')} onChange={(e) => setD('services', e.target.value.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean))} />
            </Field>
            <Field label="Departments" hint="Comma-separated department names — drives the queue">
              <Input value={draft.departmentsJson.join(', ')} onChange={(e) => setD('departmentsJson', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} />
            </Field>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setSelectedId(null); setDraft(null); }}>Cancel</Button>
            <Button variant="green" onClick={() => void saveFacility()} loading={saving}>Save facility</Button>
          </div>
        </Card>
      )}

      {visibleRegions.length > 0 && (
        <Card title="Regions & districts" subtitle="Rename, update capitals or toggle ACTIVE/INACTIVE — within your scope." pad={false}>
          <div className="divide-y divide-slate-50">
            {visibleRegions.map((r) => (
              <div key={r.id} className="px-5 py-4">
                <div className="flex flex-wrap items-end gap-3">
                  <Field label="Region name"><Input className="min-w-[180px]" value={r.name} onChange={(e) => patchRegion(r.id, { name: e.target.value })} /></Field>
                  <Field label="Capital"><Input className="min-w-[140px]" value={r.capital ?? ''} onChange={(e) => patchRegion(r.id, { capital: e.target.value })} /></Field>
                  <Field label="Status">
                    <Select value={r.status} onChange={(e) => patchRegion(r.id, { status: e.target.value })}>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </Select>
                  </Field>
                  <Button size="sm" variant="navy" onClick={() => void saveRegion(r.id)}>Save region</Button>
                  <span className="ml-auto font-mono text-[10px] text-slate-300">{r.code} · {r.districts.length} districts</span>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {r.districts.map((d) => (
                    <div key={d.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 px-3 py-2">
                      <span className="w-14 font-mono text-[10px] text-slate-400">{d.code}</span>
                      <Input className="min-w-[130px] flex-1 py-1.5" value={d.name} onChange={(e) => patchDistrict(r.id, d.id, { name: e.target.value })} />
                      <Select className="py-1.5" value={d.type} onChange={(e) => patchDistrict(r.id, d.id, { type: e.target.value })}>
                        <option value="METROPOLITAN">Metropolitan</option>
                        <option value="MUNICIPAL">Municipal</option>
                        <option value="DISTRICT">District</option>
                      </Select>
                      <Select className="py-1.5" value={d.status} onChange={(e) => patchDistrict(r.id, d.id, { status: e.target.value })}>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </Select>
                      <Button size="sm" variant="outline" onClick={() => void saveDistrict(d)}>Save</Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
