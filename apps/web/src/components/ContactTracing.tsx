import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import type { ContactTracingNetwork, ExposureAlert, ExposureAlertSummary } from '../types';
import { Badge, Button, Card, EmptyState, Field, Input, Select, Spinner, useToast } from './ui';
import { fmtDate, titleCase } from '../lib/format';

const NODE_STATUS_TONE: Record<string, 'red' | 'gold' | 'green' | 'gray' | 'navy'> = {
  CONFIRMED: 'red', SUSPECTED: 'gold', CONTACT: 'gray', RECOVERED: 'green', DECEASED: 'red',
};
const EXPOSURE_TONE: Record<string, 'red' | 'gold' | 'navy' | 'gray'> = {
  DIRECT: 'red', HOUSEHOLD: 'red', HEALTHCARE: 'gold', COMMUNITY: 'gray', INDIRECT: 'navy',
};
const RELATIONSHIP_TONE: Record<string, 'red' | 'gold' | 'navy' | 'gray'> = {
  HOUSEHOLD: 'red', WORKPLACE: 'gold', HEALTHCARE: 'navy', COMMUNITY: 'gray', TRANSPORT: 'gold',
};

interface Props {
  caseId?: string;
  disease?: string;
}

export default function ContactTracing({ caseId, disease }: Props) {
  const toast = useToast();
  const [network, setNetwork] = useState<ContactTracingNetwork | null>(null);
  const [alerts, setAlerts] = useState<ExposureAlert[] | null>(null);
  const [alertSummary, setAlertSummary] = useState<ExposureAlertSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState({ status: '', exposure: '' });

  // Add contact form
  const [addForm, setAddForm] = useState({
    patientName: '', phone: '', mrn: '', exposureType: 'DIRECT' as string,
    exposureDate: '', notes: '',
  });

  // Alert form
  const [alertForm, setAlertForm] = useState({ phone: '', message: '', contactName: '' });

  const loadNetwork = useCallback(async () => {
    const q = new URLSearchParams();
    if (caseId) q.set('caseId', caseId);
    if (disease) q.set('disease', disease);
    if (filter.status) q.set('status', filter.status);
    if (filter.exposure) q.set('exposure', filter.exposure);
    const res = await api<ContactTracingNetwork>(`/surveillance/contact-tracing?${q.toString()}`);
    setNetwork(res);
  }, [caseId, disease, filter]);

  const loadAlerts = useCallback(async () => {
    const q = new URLSearchParams();
    if (caseId) q.set('caseId', caseId);
    const [alertList, summary] = await Promise.all([
      api<{ items: ExposureAlert[] }>(`/surveillance/exposure-alerts?${q.toString()}`),
      api<ExposureAlertSummary>(`/surveillance/exposure-alerts/summary?${q.toString()}`),
    ]);
    setAlerts(alertList.items);
    setAlertSummary(summary);
  }, [caseId]);

  useEffect(() => {
    void loadNetwork().catch(() => undefined);
    void loadAlerts().catch(() => undefined);
  }, [loadNetwork, loadAlerts]);

  const refresh = useCallback(() => {
    void loadNetwork().catch(() => undefined);
    void loadAlerts().catch(() => undefined);
  }, [loadNetwork, loadAlerts]);

  async function addContact(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/surveillance/contact-tracing', {
        method: 'POST',
        body: {
          caseId,
          patientName: addForm.patientName,
          phone: addForm.phone || undefined,
          mrn: addForm.mrn || undefined,
          exposureType: addForm.exposureType,
          exposureDate: addForm.exposureDate || undefined,
          notes: addForm.notes || undefined,
        },
      });
      toast('Contact added to tracing network', 'success');
      setAddForm({ patientName: '', phone: '', mrn: '', exposureType: 'DIRECT', exposureDate: '', notes: '' });
      refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to add contact', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function sendAlert(e: FormEvent) {
    e.preventDefault();
    if (!alertForm.phone || !alertForm.message) {
      toast('Phone number and message are required', 'error');
      return;
    }
    setBusy(true);
    try {
      await api('/surveillance/exposure-alerts', {
        method: 'POST',
        body: {
          caseId,
          contactPhone: alertForm.phone,
          contactName: alertForm.contactName || undefined,
          message: alertForm.message,
          alertType: 'SMS',
        },
      });
      toast('Exposure alert sent', 'success');
      setAlertForm({ phone: '', message: '', contactName: '' });
      refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to send alert', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function sendBulkAlerts(diseaseName: string) {
    if (!confirm(`Send SMS exposure alerts to all un-notified contacts for ${diseaseName}?`)) return;
    setBusy(true);
    try {
      const res = await api<{ sent: number; failed: number }>(`/surveillance/exposure-alerts/bulk`, {
        method: 'POST',
        body: { caseId, disease: diseaseName },
      });
      toast(`Bulk alerts: ${res.sent} sent, ${res.failed} failed`, 'success');
      refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Bulk alert failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  const stats = useMemo(() => {
    if (!network) return null;
    const byExposure: Record<string, number> = {};
    for (const n of network.nodes) {
      byExposure[n.exposureType] = (byExposure[n.exposureType] || 0) + 1;
    }
    return { ...network.summary, byExposure };
  }, [network]);

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      {stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="!p-4">
            <p className="text-[10px] font-bold uppercase text-slate-400">Total contacts</p>
            <p className="mt-1 text-xl font-bold text-g-ink">{stats.totalContacts}</p>
          </Card>
          <Card className="!p-4">
            <p className="text-[10px] font-bold uppercase text-g-red">Confirmed</p>
            <p className="mt-1 text-xl font-bold text-g-red">{stats.confirmedCases}</p>
          </Card>
          <Card className="!p-4">
            <p className="text-[10px] font-bold uppercase text-g-gold">Pending</p>
            <p className="mt-1 text-xl font-bold text-g-gold">{stats.pendingContacts}</p>
          </Card>
          <Card className="!p-4">
            <p className="text-[10px] font-bold uppercase text-g-green">Recovered</p>
            <p className="mt-1 text-xl font-bold text-g-green">{stats.recovered}</p>
          </Card>
          <Card className="!p-4">
            <p className="text-[10px] font-bold uppercase text-slate-400">Alerts sent</p>
            <p className="mt-1 text-xl font-bold text-g-ink">{alertSummary?.sent ?? 0}</p>
            <p className="text-[10px] text-slate-400">{alertSummary?.delivered ?? 0} delivered</p>
          </Card>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Contact network */}
        <Card title="Contact network" subtitle="People exposed to the index case(s)" className="lg:col-span-2">
          <div className="mb-3 flex flex-wrap gap-2">
            <Select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} className="w-40">
              <option value="">All statuses</option>
              {['CONFIRMED', 'SUSPECTED', 'CONTACT', 'RECOVERED', 'DECEASED'].map((s) => (
                <option key={s} value={s}>{titleCase(s)}</option>
              ))}
            </Select>
            <Select value={filter.exposure} onChange={(e) => setFilter({ ...filter, exposure: e.target.value })} className="w-40">
              <option value="">All exposure types</option>
              {['DIRECT', 'INDIRECT', 'HOUSEHOLD', 'HEALTHCARE', 'COMMUNITY'].map((e) => (
                <option key={e} value={e}>{titleCase(e)}</option>
              ))}
            </Select>
          </div>

          {!network ? (
            <div className="py-8"><Spinner /></div>
          ) : network.nodes.length === 0 ? (
            <EmptyState icon="users" title="No contacts traced" message="Add contacts to build the exposure network." />
          ) : (
            <div className="space-y-2">
              {network.nodes.map((n) => (
                <div key={n.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 transition hover:shadow-sm">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-g-ink">{n.patientName}</p>
                      <Badge tone={NODE_STATUS_TONE[n.status] ?? 'gray'}>{titleCase(n.status)}</Badge>
                      <Badge tone={EXPOSURE_TONE[n.exposureType] ?? 'gray'}>{titleCase(n.exposureType)}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {n.mrn} · {n.disease} · exposed {fmtDate(n.exposureDate)}
                      {n.phone && ` · ${n.phone}`}
                    </p>
                    {n.notes && <p className="mt-0.5 text-xs text-slate-500">{n.notes}</p>}
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    {n.phone && (
                      <Button
                        size="sm" variant="outline"
                        onClick={() => setAlertForm({ ...alertForm, phone: n.phone!, contactName: n.patientName })}
                      >
                        SMS
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Exposure edges */}
          {network && network.edges.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="mb-2 text-xs font-bold uppercase text-slate-400">Exposure links</p>
              <div className="space-y-1.5">
                {network.edges.map((e) => (
                  <div key={e.id} className="flex items-center gap-2 text-xs text-slate-500">
                    <Badge tone={RELATIONSHIP_TONE[e.relationship] ?? 'gray'}>{titleCase(e.relationship)}</Badge>
                    <span>{fmtDate(e.exposureDate)}</span>
                    {e.durationMinutes && <span>· {e.durationMinutes}min</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Sidebar: Add contact + Send alert */}
        <div className="space-y-5">
          <Card title="Add contact" subtitle="Register a new exposure contact">
            <form onSubmit={addContact} className="space-y-3">
              <Field label="Contact name">
                <Input value={addForm.patientName} onChange={(e) => setAddForm({ ...addForm, patientName: e.target.value })} placeholder="Full name" />
              </Field>
              <Field label="Phone number">
                <Input value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} placeholder="+233 24 000 0000" />
              </Field>
              <Field label="MRN (optional)">
                <Input value={addForm.mrn} onChange={(e) => setAddForm({ ...addForm, mrn: e.target.value })} placeholder="Patient MRN" />
              </Field>
              <Field label="Exposure type">
                <Select value={addForm.exposureType} onChange={(e) => setAddForm({ ...addForm, exposureType: e.target.value })}>
                  {['DIRECT', 'INDIRECT', 'HOUSEHOLD', 'HEALTHCARE', 'COMMUNITY'].map((t) => (
                    <option key={t} value={t}>{titleCase(t)}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Exposure date">
                <Input type="date" value={addForm.exposureDate} onChange={(e) => setAddForm({ ...addForm, exposureDate: e.target.value })} />
              </Field>
              <Field label="Notes">
                <Input value={addForm.notes} onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })} placeholder="Circumstances of exposure" />
              </Field>
              <Button type="submit" loading={busy} icon="plus" className="w-full">Add contact</Button>
            </form>
          </Card>

          <Card title="Send SMS alert" subtitle="Notify a contact of potential exposure">
            <form onSubmit={sendAlert} className="space-y-3">
              <Field label="Phone number">
                <Input value={alertForm.phone} onChange={(e) => setAlertForm({ ...alertForm, phone: e.target.value })} placeholder="+233 24 000 0000" />
              </Field>
              <Field label="Contact name">
                <Input value={alertForm.contactName} onChange={(e) => setAlertForm({ ...alertForm, contactName: e.target.value })} placeholder="Optional" />
              </Field>
              <Field label="Alert message">
                <textarea
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  rows={4}
                  value={alertForm.message}
                  onChange={(e) => setAlertForm({ ...alertForm, message: e.target.value })}
                  placeholder="You have been identified as a close contact of a confirmed case. Please visit your nearest health facility for screening."
                />
              </Field>
              <Button type="submit" loading={busy} className="w-full">Send SMS alert</Button>
            </form>
          </Card>

          {disease && (
            <Card title="Bulk alerts" subtitle={`Send alerts to all un-notified ${disease} contacts`}>
              <Button onClick={() => void sendBulkAlerts(disease)} loading={busy} variant="navy" className="w-full">
                Send bulk SMS alerts
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Alert log */}
      {alerts && alerts.length > 0 && (
        <Card title="Exposure alert log" subtitle="SMS delivery history">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
                  {['Contact', 'Phone', 'Disease', 'Status', 'Sent', ''].map((h) => (
                    <th key={h} className="px-4 py-2 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {alerts.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-2">{a.contactName ?? '—'}</td>
                    <td className="px-4 py-2 font-mono text-xs">{a.contactPhone}</td>
                    <td className="px-4 py-2">{a.disease}</td>
                    <td className="px-4 py-2">
                      <Badge tone={a.status === 'DELIVERED' ? 'green' : a.status === 'FAILED' ? 'red' : 'gold'}>
                        {a.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-400">{a.sentAt ? fmtDate(a.sentAt) : '—'}</td>
                    <td className="px-4 py-2 text-xs text-slate-400">{a.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
