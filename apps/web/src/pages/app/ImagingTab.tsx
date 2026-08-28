import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import type { ImagingOrder } from '../../types';
import { Badge, Button, Card, Field, Input, Select, useToast } from '../../components/ui';
import { fmtDate, fmtDateTime } from '../../lib/format';

const MODALITIES = ['X_RAY', 'ULTRASOUND', 'CT', 'MRI', 'MAMMOGRAPHY', 'FLUOROSCOPY', 'OTHER'];

/**
 * Imaging & radiology (spec §24, docs/13 §10) — the patient's imaging orders
 * with an order form for clinical staff. Reports are entered/verified from
 * the Radiology worklist; this tab shows the record.
 */
export default function ImagingTab({ patientId, encounters }: { patientId: string; encounters: Array<{ id: string; type: string; createdAt: string }> }) {
  const { user } = useAuth();
  const toast = useToast();
  const canOrder = !!user?.permissions.includes('order_imaging');
  const [orders, setOrders] = useState<ImagingOrder[]>([]);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ encounterId: '', modality: 'X_RAY', bodyPart: '', clinicalQuestion: '' });

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const res = await api<{ items: ImagingOrder[] }>(`/patients/${patientId}/imaging-orders`);
      setOrders(res.items);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not load imaging orders', 'error');
    } finally {
      setBusy(false);
    }
  }, [patientId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function order() {
    if (!f.encounterId) {
      toast('Select the encounter this study belongs to', 'error');
      return;
    }
    setSaving(true);
    try {
      await api(`/patients/${patientId}/imaging-orders`, {
        method: 'POST',
        body: {
          encounterId: f.encounterId,
          modality: f.modality,
          bodyPart: f.bodyPart || undefined,
          clinicalQuestion: f.clinicalQuestion || undefined,
        },
      });
      toast('Imaging order placed', 'success');
      setOpen(false);
      setF({ ...f, bodyPart: '', clinicalQuestion: '' });
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Order failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  const tone = (s: string) => (s === 'VERIFIED' ? 'green' : s === 'CANCELLED' ? 'gray' : s === 'REPORTED' ? 'gold' : s === 'IN_PROGRESS' ? 'blue' : 'red');

  return (
    <Card
      title="Imaging orders"
      subtitle={`${orders.length} study request(s)`}
      action={canOrder ? (
        <Button size="sm" variant={open ? 'ghost' : 'green'} onClick={() => setOpen(!open)}>{open ? 'Close' : 'Order imaging'}</Button>
      ) : undefined}
    >
      {open && (
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4 sm:grid-cols-4">
          <Field label="Encounter">
            <Select value={f.encounterId} onChange={(e) => setF({ ...f, encounterId: e.target.value })}>
              <option value="">Select encounter…</option>
              {encounters.map((e) => <option key={e.id} value={e.id}>{e.type} · {fmtDate(e.createdAt)}</option>)}
            </Select>
          </Field>
          <Field label="Modality">
            <Select value={f.modality} onChange={(e) => setF({ ...f, modality: e.target.value })}>
              {MODALITIES.map((m) => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
            </Select>
          </Field>
          <Field label="Body part"><Input value={f.bodyPart} onChange={(e) => setF({ ...f, bodyPart: e.target.value })} placeholder="e.g. Chest" /></Field>
          <Field label="Clinical question"><Input value={f.clinicalQuestion} onChange={(e) => setF({ ...f, clinicalQuestion: e.target.value })} placeholder="e.g. Rule out pneumonia" /></Field>
          <div className="col-span-full"><Button variant="green" loading={saving} onClick={() => void order()}>Place order</Button></div>
        </div>
      )}
      {orders.length === 0 && !busy ? (
        <p className="py-4 text-center text-sm text-slate-400">No imaging orders.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {orders.map((o) => (
            <div key={o.id} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-2.5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <Badge tone="navy">{o.modality.replace(/_/g, ' ')}</Badge>
                {o.bodyPart && <span className="text-slate-600">{o.bodyPart}</span>}
                <Badge tone={tone(o.status)}>{o.status.replace(/_/g, ' ')}</Badge>
                <span className="text-xs text-slate-400">{fmtDateTime(o.createdAt)}</span>
              </div>
              {o.clinicalQuestion && <p className="mt-1 text-xs text-slate-500">{o.clinicalQuestion}</p>}
              {o.report && (
                <div className="mt-2 rounded-md border border-slate-100 bg-white px-3 py-2">
                  <p className="text-xs text-slate-600">{o.report}</p>
                  {o.impression && <p className="mt-1 text-[11px] font-semibold text-slate-500">Impression: {o.impression}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
