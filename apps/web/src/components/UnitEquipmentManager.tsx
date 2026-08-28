import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import type { HospitalUnit, UnitEquipment } from '../types';
import { Badge, Button, Field, Input, Select, Spinner, useToast } from './ui';
import { fmtDate } from '../lib/format';
import { cn } from './ui';

const CATEGORIES = ['LIFE_SUPPORT', 'MONITORING', 'DIAGNOSTIC', 'SURGICAL', 'THERAPY', 'SUPPORT', 'OTHER'];

const CATEGORY_TONE: Record<string, 'green' | 'blue' | 'gold' | 'red' | 'gray' | 'navy'> = {
  LIFE_SUPPORT: 'red',
  MONITORING: 'blue',
  DIAGNOSTIC: 'navy',
  SURGICAL: 'gold',
  THERAPY: 'green',
  SUPPORT: 'gray',
  OTHER: 'gray',
};

const STATUS_TONE: Record<string, 'green' | 'gold' | 'blue' | 'red' | 'gray'> = {
  OPERATIONAL: 'green',
  PARTIAL: 'gold',
  IN_MAINTENANCE: 'blue',
  FAULTY: 'red',
  OUT_OF_SERVICE: 'gray',
};

interface EquipmentDraft {
  name: string;
  category: string;
  quantity: string;
  functional: string;
  inMaintenance: string;
  faulty: string;
  serialNumber: string;
  manufacturer: string;
  model: string;
  nextMaintenanceAt: string;
  notes: string;
}

const EMPTY_DRAFT: EquipmentDraft = {
  name: '', category: 'SUPPORT', quantity: '1', functional: '1', inMaintenance: '0', faulty: '0',
  serialNumber: '', manufacturer: '', model: '', nextMaintenanceAt: '', notes: '',
};

interface Props {
  unit: HospitalUnit;
  onClose: () => void;
  onChanged: () => void;
}

export default function UnitEquipmentManager({ unit, onClose, onChanged }: Props) {
  const toast = useToast();
  const [equipment, setEquipment] = useState<UnitEquipment[] | null>(null);
  const [draft, setDraft] = useState<EquipmentDraft>(EMPTY_DRAFT);
  const [editing, setEditing] = useState<UnitEquipment | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await api<{ equipment: UnitEquipment[] }>(`/admin/masterdata/units/${unit.id}/equipment`);
    setEquipment(res.equipment);
  }, [unit.id]);

  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  async function createEquipment(e: FormEvent) {
    e.preventDefault();
    setBusy('create');
    try {
      await api(`/admin/masterdata/units/${unit.id}/equipment`, {
        method: 'POST',
        body: {
          name: draft.name,
          category: draft.category,
          quantity: Number(draft.quantity) || 1,
          functional: draft.functional === '' ? undefined : Number(draft.functional),
          inMaintenance: draft.inMaintenance === '' ? undefined : Number(draft.inMaintenance),
          faulty: draft.faulty === '' ? undefined : Number(draft.faulty),
          serialNumber: draft.serialNumber || undefined,
          manufacturer: draft.manufacturer || undefined,
          model: draft.model || undefined,
          nextMaintenanceAt: draft.nextMaintenanceAt || undefined,
          notes: draft.notes || undefined,
        },
      });
      toast(`${draft.name} added`, 'success');
      setDraft(EMPTY_DRAFT);
      void load();
      onChanged();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Add failed', 'error');
    } finally {
      setBusy(null);
    }
  }

  function patchEdit(part: Partial<UnitEquipment>) {
    setEditing((e) => (e ? { ...e, ...part } : e));
  }

  async function saveEdit() {
    if (!editing) return;
    setBusy(`edit-${editing.id}`);
    try {
      await api(`/admin/masterdata/equipment/${editing.id}`, {
        method: 'PUT',
        body: {
          name: editing.name,
          category: editing.category,
          quantity: editing.quantity,
          functional: editing.functional,
          inMaintenance: editing.inMaintenance,
          faulty: editing.faulty,
          serialNumber: editing.serialNumber ?? '',
          manufacturer: editing.manufacturer ?? '',
          model: editing.model ?? '',
          nextMaintenanceAt: editing.nextMaintenanceAt ?? '',
          notes: editing.notes ?? '',
        },
      });
      toast(`Saved ${editing.name}`, 'success');
      setEditing(null);
      void load();
      onChanged();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setBusy(null);
    }
  }

  async function completeMaintenance(eq: UnitEquipment) {
    setBusy(`maint-${eq.id}`);
    try {
      await api(`/admin/masterdata/equipment/${eq.id}/maintenance`, { method: 'POST', body: { note: 'Maintenance completed (manual)' } });
      toast(`${eq.name} back to service`, 'success');
      void load();
      onChanged();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setBusy(null);
    }
  }

  async function removeEquipment(eq: UnitEquipment) {
    if (!window.confirm(`Remove “${eq.name}” from ${unit.name}? Its maintenance history is deleted with it.`)) return;
    setBusy(`remove-${eq.id}`);
    try {
      await api(`/admin/masterdata/equipment/${eq.id}/remove`, { method: 'POST', body: {} });
      toast(`Removed ${eq.name}`, 'success');
      void load();
      onChanged();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Remove failed', 'error');
    } finally {
      setBusy(null);
    }
  }

  const summary = equipment
    ? {
        items: equipment.reduce((a, e) => a + e.quantity, 0),
        functional: equipment.reduce((a, e) => a + e.functional, 0),
        inMaintenance: equipment.reduce((a, e) => a + e.inMaintenance, 0),
        faulty: equipment.reduce((a, e) => a + e.faulty, 0),
        maintenanceDue: equipment.filter((e) => e.maintenanceDue).length,
      }
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-g-ink">Equipment & tools — {unit.name}</h3>
            <p className="text-xs text-slate-400">{unit.code} · life-support, monitoring, diagnostic and surgical assets assigned to this unit.</p>
          </div>
          <button onClick={onClose} className="cursor-pointer rounded-lg p-2 text-slate-400 transition hover:bg-g-mist"><span className="text-lg leading-none">×</span></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!equipment ? (
            <Spinner label="Loading equipment…" />
          ) : (
            <div className="space-y-5">
              {summary && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <div className="rounded-lg border border-slate-200 bg-g-mist/40 p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Total items</p><p className="text-xl font-bold text-g-ink tabular-nums">{summary.items}</p></div>
                  <div className="rounded-lg border border-g-green/20 bg-g-green/5 p-3"><p className="text-[10px] font-bold uppercase text-g-green">Functional</p><p className="text-xl font-bold text-g-green tabular-nums">{summary.functional}</p></div>
                  <div className="rounded-lg border border-sky-200 bg-sky-50 p-3"><p className="text-[10px] font-bold uppercase text-sky-700">In maintenance</p><p className="text-xl font-bold text-sky-700 tabular-nums">{summary.inMaintenance}</p></div>
                  <div className="rounded-lg border border-g-red/20 bg-g-red/5 p-3"><p className="text-[10px] font-bold uppercase text-g-red">Faulty</p><p className="text-xl font-bold text-g-red tabular-nums">{summary.faulty}</p></div>
                  <div className={cn('rounded-lg border p-3', summary.maintenanceDue > 0 ? 'border-g-gold/40 bg-g-gold/10' : 'border-slate-200 bg-white')}>
                    <p className="text-[10px] font-bold uppercase text-yellow-800">Due maintenance</p>
                    <p className={cn('text-xl font-bold tabular-nums', summary.maintenanceDue > 0 ? 'text-yellow-800' : 'text-slate-400')}>{summary.maintenanceDue}</p>
                  </div>
                </div>
              )}

              {equipment.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 px-4 py-8 text-center text-sm text-slate-400">
                  No equipment recorded for this unit yet. Add the first item below.
                </p>
              ) : (
                <div className="space-y-2">
                  {equipment.map((eq) => (
                    <div key={eq.id} className="rounded-xl border border-slate-200 p-4 transition hover:shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-g-ink">{eq.name}</p>
                            <Badge tone={CATEGORY_TONE[eq.category] ?? 'gray'}>{eq.category.replace(/_/g, ' ')}</Badge>
                            <Badge tone={STATUS_TONE[eq.status] ?? 'gray'}>{eq.status.replace(/_/g, ' ')}</Badge>
                            {eq.maintenanceDue && <Badge tone="gold">maintenance due</Badge>}
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {eq.quantity} unit(s) · <span className="text-g-green">{eq.functional} functional</span>
                            {eq.inMaintenance > 0 && <> · <span className="text-sky-700">{eq.inMaintenance} in maintenance</span></>}
                            {eq.faulty > 0 && <> · <span className="text-g-red">{eq.faulty} faulty</span></>}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                            {eq.serialNumber ?? '—'}{eq.manufacturer ? ` · ${eq.manufacturer}` : ''}{eq.model ? ` · ${eq.model}` : ''}
                          </p>
                          {(eq.lastMaintenanceAt || eq.nextMaintenanceAt) && (
                            <p className="mt-0.5 text-[11px] text-slate-400">
                              {eq.lastMaintenanceAt ? `Last maintenance ${fmtDate(eq.lastMaintenanceAt)}` : ''}
                              {eq.lastMaintenanceAt && eq.nextMaintenanceAt ? ' · ' : ''}
                              {eq.nextMaintenanceAt ? `next due ${fmtDate(eq.nextMaintenanceAt)}` : ''}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-1.5">
                          {(eq.inMaintenance > 0 || eq.faulty > 0) && (
                            <button onClick={() => void completeMaintenance(eq)} disabled={busy === `maint-${eq.id}`} className="cursor-pointer rounded-md border border-g-green/30 bg-g-green/10 px-2 py-1 text-[10px] font-bold text-g-green transition hover:bg-g-green hover:text-white">
                              Back to service
                            </button>
                          )}
                          <button onClick={() => setEditing(eq)} className="cursor-pointer rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-g-navy transition hover:bg-g-navy hover:text-white">Edit</button>
                          <button onClick={() => void removeEquipment(eq)} disabled={busy === `remove-${eq.id}`} className="cursor-pointer rounded-md border border-g-red/20 bg-g-red/5 px-2 py-1 text-[10px] font-bold text-g-red transition hover:bg-g-red hover:text-white">Remove</button>
                        </div>
                      </div>

                      {editing?.id === eq.id && (
                        <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 md:grid-cols-4">
                          <Field label="Name" className="md:col-span-2"><Input value={editing.name} onChange={(e) => patchEdit({ name: e.target.value })} /></Field>
                          <Field label="Category">
                            <Select value={editing.category} onChange={(e) => patchEdit({ category: e.target.value })}>
                              {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                            </Select>
                          </Field>
                          <Field label="Quantity"><Input type="number" min={1} value={editing.quantity} onChange={(e) => patchEdit({ quantity: Number(e.target.value) || 1 })} /></Field>
                          <Field label="Functional"><Input type="number" min={0} value={editing.functional} onChange={(e) => patchEdit({ functional: Math.max(0, Number(e.target.value) || 0) })} /></Field>
                          <Field label="In maintenance"><Input type="number" min={0} value={editing.inMaintenance} onChange={(e) => patchEdit({ inMaintenance: Math.max(0, Number(e.target.value) || 0) })} /></Field>
                          <Field label="Faulty"><Input type="number" min={0} value={editing.faulty} onChange={(e) => patchEdit({ faulty: Math.max(0, Number(e.target.value) || 0) })} /></Field>
                          <Field label="Serial number"><Input value={editing.serialNumber ?? ''} onChange={(e) => patchEdit({ serialNumber: e.target.value })} /></Field>
                          <Field label="Manufacturer"><Input value={editing.manufacturer ?? ''} onChange={(e) => patchEdit({ manufacturer: e.target.value })} /></Field>
                          <Field label="Model"><Input value={editing.model ?? ''} onChange={(e) => patchEdit({ model: e.target.value })} /></Field>
                          <Field label="Next maintenance"><Input type="date" value={editing.nextMaintenanceAt ? editing.nextMaintenanceAt.slice(0, 10) : ''} onChange={(e) => patchEdit({ nextMaintenanceAt: e.target.value ? new Date(e.target.value).toISOString() : null })} /></Field>
                          <div className="flex items-end justify-end gap-2 md:col-span-4">
                            <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
                            <Button size="sm" variant="green" onClick={() => void saveEdit()} loading={busy === `edit-${editing.id}`}>Save equipment</Button>
                          </div>
                        </div>
                      )}

                      {eq.recentMaintenance && eq.recentMaintenance.length > 0 && editing?.id !== eq.id && (
                        <div className="mt-2 space-y-1 border-t border-slate-50 pt-2">
                          {eq.recentMaintenance.map((m) => (
                            <p key={m.id} className="text-[11px] text-slate-400">
                              <Badge tone="blue" className="mr-1.5">maintenance</Badge>
                              {m.note ?? 'Maintenance completed'} · {fmtDate(m.performedAt)}{m.performedBy ? ` · ${m.performedBy}` : ''}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ------------------------------------------------ add */}
              <div className="rounded-xl border border-dashed border-slate-300 p-4">
                <p className="mb-3 text-sm font-bold text-g-ink">Add equipment or tool</p>
                <form onSubmit={(e) => void createEquipment(e)} className="grid gap-3 md:grid-cols-4">
                  <Field label="Name" className="md:col-span-2"><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Ventilator" required /></Field>
                  <Field label="Category">
                    <Select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                    </Select>
                  </Field>
                  <Field label="Quantity"><Input type="number" min={1} value={draft.quantity} onChange={(e) => setDraft({ ...draft, quantity: e.target.value })} /></Field>
                  <Field label="Functional"><Input type="number" min={0} value={draft.functional} onChange={(e) => setDraft({ ...draft, functional: e.target.value })} /></Field>
                  <Field label="In maintenance"><Input type="number" min={0} value={draft.inMaintenance} onChange={(e) => setDraft({ ...draft, inMaintenance: e.target.value })} /></Field>
                  <Field label="Faulty"><Input type="number" min={0} value={draft.faulty} onChange={(e) => setDraft({ ...draft, faulty: e.target.value })} /></Field>
                  <Field label="Serial number"><Input value={draft.serialNumber} onChange={(e) => setDraft({ ...draft, serialNumber: e.target.value })} placeholder="Optional" /></Field>
                  <Field label="Manufacturer"><Input value={draft.manufacturer} onChange={(e) => setDraft({ ...draft, manufacturer: e.target.value })} placeholder="Optional" /></Field>
                  <Field label="Model"><Input value={draft.model} onChange={(e) => setDraft({ ...draft, model: e.target.value })} placeholder="Optional" /></Field>
                  <Field label="Next maintenance"><Input type="date" value={draft.nextMaintenanceAt} onChange={(e) => setDraft({ ...draft, nextMaintenanceAt: e.target.value })} /></Field>
                  <div className="flex items-end md:col-span-4"><Button type="submit" loading={busy === 'create'} icon="plus">Add equipment</Button></div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
