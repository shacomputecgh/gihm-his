import { useCallback, useEffect, useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import type { ImagingOrder } from '../../types';
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Select, Spinner, Textarea, useToast } from '../../components/ui';
import { fmtDate, fmtDateTime } from '../../lib/format';

/**
 * Radiology worklist (spec §24, docs/13 §10) — pending imaging orders in the
 * caller's scope, with study start/cancel transitions and radiologist report
 * entry + verification. Mirrors the Laboratory worklist.
 */
export default function Radiology() {
  const { user } = useAuth();
  const toast = useToast();
  const canVerify = !!user?.permissions.includes('verify_imaging');
  const [status, setStatus] = useState('ALL');
  const [modality, setModality] = useState('');
  const [orders, setOrders] = useState<ImagingOrder[]>([]);
  const [busy, setBusy] = useState(false);
  const [reporting, setReporting] = useState<ImagingOrder | null>(null);
  const [saving, setSaving] = useState(false);
  const [report, setReport] = useState({ report: '', impression: '' });

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const q = new URLSearchParams({ status });
      if (modality) q.set('modality', modality);
      const res = await api<{ items: ImagingOrder[] }>(`/imaging/orders?${q.toString()}`);
      setOrders(res.items);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not load worklist', 'error');
    } finally {
      setBusy(false);
    }
  }, [status, modality, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function transition(order: ImagingOrder, next: string, ok: string) {
    try {
      await api(`/patients/${order.patientId}/imaging-orders/${order.id}`, { method: 'PATCH', body: { status: next } });
      toast(ok, 'success');
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Transition failed', 'error');
    }
  }

  async function submitReport() {
    if (!reporting) return;
    setSaving(true);
    try {
      await api(`/imaging/orders/${reporting.id}/report`, {
        method: 'POST',
        body: { report: report.report, impression: report.impression || undefined },
      });
      toast('Report verified', 'success');
      setReporting(null);
      setReport({ report: '', impression: '' });
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Report failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  const tone = (s: string) => (s === 'VERIFIED' ? 'green' : s === 'CANCELLED' ? 'gray' : s === 'REPORTED' ? 'gold' : s === 'IN_PROGRESS' ? 'blue' : 'red');

  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition shadow">
          {showAdd ? "\u2715 Cancel" : "+ Add New"}
        </button>
      </div>
      {showAdd && (
        <AddNewForm
          title="Add New Radiology"
          fields={[{"name":"patientName","label":"Patient Name","type":"text","required":true},{"name":"mrn","label":"MRN","type":"text","required":true},{"name":"examType","label":"Examination Type","type":"select","options":["X-Ray","CT Scan","MRI","Ultrasound","Mammography","Fluoroscopy","DEXA Scan"]},{"name":"bodyPart","label":"Body Part / Region","type":"text","required":true},{"name":"clinicalIndication","label":"Clinical Indication","type":"textarea"},{"name":"priority","label":"Priority","type":"select","options":["Routine","Urgent","STAT"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader
        title="Radiology"
        subtitle="Imaging orders in scope — start the study, enter the radiologist report and verify (docs/13 §10). The DICOM/PACS image transport is a future integration; this page carries the order, study status and structured report."
        action={
          <div className="flex items-center gap-2">
            <Select value={modality} onChange={(e) => setModality(e.target.value)} className="w-40">
              <option value="">All modalities</option>
              {['X_RAY', 'ULTRASOUND', 'CT', 'MRI', 'MAMMOGRAPHY', 'FLUOROSCOPY', 'OTHER'].map((m) => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
            </Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
              <option value="ALL">All pending</option>
              <option value="ORDERED">Ordered</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="REPORTED">Reported</option>
            </Select>
          </div>
        }
      />

      <Card pad={false}>
        {busy && orders.length === 0 ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : orders.length === 0 ? (
          <EmptyState title="No imaging orders" message="No orders match the current filter — new requests appear here from the patient record." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
                  {['Patient', 'Study', 'Body part', 'Clinical question', 'Status', 'Ordered', 'Actions'].map((h) => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="px-5 py-3">
                      <Link to={`/app/patients/${o.patientId}`} className="font-semibold text-g-navy hover:underline">{o.patient?.fullName}</Link>
                      <p className="font-mono text-[10px] text-slate-400">{o.patient?.mrn}</p>
                    </td>
                    <td className="px-5 py-3"><Badge tone="navy">{o.modality.replace(/_/g, ' ')}</Badge></td>
                    <td className="px-5 py-3 text-slate-600">{o.bodyPart ?? '—'}</td>
                    <td className="max-w-[220px] truncate px-5 py-3 text-slate-500">{o.clinicalQuestion ?? '—'}</td>
                    <td className="px-5 py-3"><Badge tone={tone(o.status)}>{o.status.replace(/_/g, ' ')}</Badge></td>
                    <td className="px-5 py-3 text-xs text-slate-400">{fmtDate(o.createdAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {canVerify && o.status === 'ORDERED' && (
                          <Button size="sm" variant="outline" onClick={() => void transition(o, 'IN_PROGRESS', 'Study started')}>Start study</Button>
                        )}
                        {canVerify && (o.status === 'ORDERED' || o.status === 'IN_PROGRESS') && (
                          <Button size="sm" variant="outline" onClick={() => void transition(o, 'CANCELLED', 'Order cancelled')}>Cancel</Button>
                        )}
                        {canVerify && (o.status === 'ORDERED' || o.status === 'IN_PROGRESS' || o.status === 'REPORTED') && (
                          <Button size="sm" variant="green" onClick={() => { setReporting(o); setReport({ report: o.report ?? '', impression: o.impression ?? '' }); }}>Report</Button>
                        )}
                        {o.status === 'VERIFIED' && (
                          <button className="text-xs font-semibold text-g-navy hover:underline" onClick={() => { setReporting(o); setReport({ report: o.report ?? '', impression: o.impression ?? '' }); }}>View report</button>
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

      {orders.some((o) => o.report) && (
        <Card title="Verified reports" subtitle="Completed radiologist reports">
          <div className="space-y-3">
            {orders.filter((o) => o.report).map((o) => (
              <div key={o.id} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold text-g-ink">{o.patient?.fullName}</span>
                  <Badge tone="navy">{o.modality.replace(/_/g, ' ')}</Badge>
                  <span className="text-xs text-slate-400">{fmtDateTime(o.updatedAt)}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{o.report}</p>
                {o.impression && <p className="mt-1 text-xs font-semibold text-slate-500">Impression: {o.impression}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {reporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setReporting(null)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-g-ink">{reporting.status === 'VERIFIED' ? 'Radiologist report' : 'Enter radiologist report'}</h3>
                <p className="text-xs text-slate-400">{reporting.patient?.fullName} · {reporting.modality.replace(/_/g, ' ')} {reporting.bodyPart ? `· ${reporting.bodyPart}` : ''}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setReporting(null)}>Close</Button>
            </div>
            <div className="space-y-3">
              <Field label="Findings" hint={reporting.status === 'VERIFIED' ? 'Read-only — report already verified' : undefined}>
                <Textarea rows={5} value={report.report} disabled={reporting.status === 'VERIFIED'} onChange={(e) => setReport((r) => ({ ...r, report: e.target.value }))} placeholder="Describe the findings…" />
              </Field>
              <Field label="Impression">
                <Input value={report.impression} disabled={reporting.status === 'VERIFIED'} onChange={(e) => setReport((r) => ({ ...r, impression: e.target.value }))} placeholder="e.g. Benign findings" />
              </Field>
              {reporting.status !== 'VERIFIED' && (
                <Button variant="green" loading={saving} onClick={() => void submitReport()}>Verify report</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
