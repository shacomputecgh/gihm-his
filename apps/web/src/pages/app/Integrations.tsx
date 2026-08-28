import { useCallback, useEffect, useState } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { api, downloadFile } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import type { Dhims2Submission, EtrackerSubmission, GhilmisSubmission, HrimsSubmission, IntegrationDeliveryRow, IntegrationStatus, LhimsSubmission, NhisSubmission } from '../../types';
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Spinner, useToast } from '../../components/ui';
import { fmtDateTime } from '../../lib/format';

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function currentMonth(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
}

type AdapterKey = 'dhims2' | 'sormas' | 'ghilmis' | 'hrims' | 'nhis' | 'etracker' | 'lhims';

const ADAPTER_META: Record<AdapterKey, { name: string; system: string; blurb: string }> = {
  dhims2: {
    name: 'DHIMS2',
    system: 'District Health Information Management System',
    blurb: 'Monthly indicator datasets computed live from platform records (never manual re-entry) and pushed to the national reporting instance.',
  },
  sormas: {
    name: 'SORMAS',
    system: 'Outbreak & Surveillance Management',
    blurb: 'Disease case events exported from the surveillance register for national outbreak response.',
  },
  ghilmis: {
    name: 'GhiLMIS',
    system: 'Logistics Management Information System',
    blurb: 'Monthly commodity stock-level snapshots computed live from the inventory register — levels, reorder points and derived OK/LOW/OUT status per item.',
  },
  hrims: {
    name: 'HRIMS',
    system: 'Human Resource Information Management System',
    blurb: 'Monthly workforce register snapshots computed live from the staff directory — role, licence, unit placement and employment status per employee.',
  },
  nhis: {
    name: 'NHIS',
    system: 'National Health Insurance Scheme',
    blurb: 'Monthly claims submissions computed live from SUBMITTED insurance claims — claim number, patient + NHIS number, scheme, service date and itemized amounts.',
  },
  etracker: {
    name: 'eTracker',
    system: 'DHIMS Tracker (longitudinal client tracking)',
    blurb: 'Monthly client-cohort submissions for longitudinal tracking with identity resolution — every maternal client with activity in the period, carrying MRN / Ghana Card / NHIS identifiers plus her program summary.',
  },
  lhims: {
    name: 'LHIMS',
    system: 'Light House / FHIR exchange',
    blurb: 'Monthly FHIR R4 exchange bundles — Patient, Encounter and DiagnosticReport resources with MPI identity identifiers, delivered to the LHIMS/FHIR endpoint.',
  },
};

export default function Integrations() {
  const { user } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [deliveries, setDeliveries] = useState<IntegrationDeliveryRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [sweeping, setSweeping] = useState(false);
  const [queuing, setQueuing] = useState<string | null>(null);

  // Queue forms
  const [month, setMonth] = useState(currentMonth);
  const [orgUnit, setOrgUnit] = useState('');
  const [range, setRange] = useState({ from: iso(new Date(Date.now() - 30 * 86_400_000)), to: iso(new Date()) });
  const [dryRun, setDryRun] = useState(true);

  // Results previews
  const [dhimsPreview, setDhimsPreview] = useState<{ submission: Dhims2Submission; delivery?: { id: string; duplicated: boolean } } | null>(null);
  const [sormasPreview, setSormasPreview] = useState<{ count: number; delivery?: { id: string; duplicated: boolean } } | null>(null);
  const [ghilmisPreview, setGhilmisPreview] = useState<{ submission: GhilmisSubmission; delivery?: { id: string; duplicated: boolean } } | null>(null);
  const [hrimsPreview, setHrimsPreview] = useState<{ submission: HrimsSubmission; delivery?: { id: string; duplicated: boolean } } | null>(null);
  const [nhisPreview, setNhisPreview] = useState<{ submission: NhisSubmission; delivery?: { id: string; duplicated: boolean } } | null>(null);
  const [etrackerPreview, setEtrackerPreview] = useState<{ submission: EtrackerSubmission; delivery?: { id: string; duplicated: boolean } } | null>(null);
  const [lhimsPreview, setLhimsPreview] = useState<{ submission: LhimsSubmission; delivery?: { id: string; duplicated: boolean } } | null>(null);
  const [payloadOpen, setPayloadOpen] = useState<{ id: string; adapter: string; payloadJson: string } | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [s, d] = await Promise.all([
        api<IntegrationStatus>('/integrations/status'),
        api<{ rows: IntegrationDeliveryRow[] }>('/integrations/deliveries?pageSize=25'),
      ]);
      setStatus(s);
      setDeliveries(d.rows);
    } catch {
      /* keep previous data */
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function queueDhims() {
    setQueuing('dhims2');
    try {
      const res = await api<{ submission: Dhims2Submission; delivery?: { id: string; duplicated: boolean }; dryRun: boolean; configured: boolean }>(
        '/integrations/dhims2/queue',
        { method: 'POST', body: { period: month, orgUnit: orgUnit || undefined, dryRun } },
      );
      setDhimsPreview(res);
      if (!res.dryRun && !res.configured) toast('Queued — configure INTEGRATION_DHIMS2_URL to deliver', 'info');
      else if (!res.dryRun) toast(res.delivery?.duplicated ? 'Already queued (idempotent — no duplicate)' : 'Queued for delivery', 'success');
      else toast(`Dry run — ${res.submission.dataValues.length} indicator values`, 'success');
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Queue failed', 'error');
    } finally {
      setQueuing(null);
    }
  }

  async function queueSormas() {
    setQueuing('sormas');
    try {
      const res = await api<{ count: number; delivery?: { id: string; duplicated: boolean }; dryRun: boolean; configured: boolean }>(
        '/integrations/sormas/queue',
        { method: 'POST', body: { from: range.from, to: range.to, dryRun } },
      );
      setSormasPreview(res);
      if (!res.dryRun && !res.configured) toast('Queued — configure INTEGRATION_SORMAS_URL to deliver', 'info');
      else if (!res.dryRun) toast(res.delivery?.duplicated ? 'Already queued (idempotent — no duplicate)' : 'Queued for delivery', 'success');
      else toast(`Dry run — ${res.count} case(s) in range`, 'success');
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Queue failed', 'error');
    } finally {
      setQueuing(null);
    }
  }

  async function queueGhilmis() {
    setQueuing('ghilmis');
    try {
      const res = await api<{ submission: GhilmisSubmission; delivery?: { id: string; duplicated: boolean }; dryRun: boolean; configured: boolean }>(
        '/integrations/ghilmis/queue',
        { method: 'POST', body: { period: month, orgUnit: orgUnit || undefined, dryRun } },
      );
      setGhilmisPreview(res);
      if (!res.dryRun && !res.configured) toast('Queued — configure INTEGRATION_GHILMIS_URL to deliver', 'info');
      else if (!res.dryRun) toast(res.delivery?.duplicated ? 'Already queued (idempotent — no duplicate)' : 'Queued for delivery', 'success');
      else toast(`Dry run — ${res.submission.items.length} stock items`, 'success');
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Queue failed', 'error');
    } finally {
      setQueuing(null);
    }
  }

  async function queueHrims() {
    setQueuing('hrims');
    try {
      const res = await api<{ submission: HrimsSubmission; delivery?: { id: string; duplicated: boolean }; dryRun: boolean; configured: boolean }>(
        '/integrations/hrims/queue',
        { method: 'POST', body: { period: month, orgUnit: orgUnit || undefined, dryRun } },
      );
      setHrimsPreview(res);
      if (!res.dryRun && !res.configured) toast('Queued — configure INTEGRATION_HRIMS_URL to deliver', 'info');
      else if (!res.dryRun) toast(res.delivery?.duplicated ? 'Already queued (idempotent — no duplicate)' : 'Queued for delivery', 'success');
      else toast(`Dry run — ${res.submission.staff.length} staff in register`, 'success');
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Queue failed', 'error');
    } finally {
      setQueuing(null);
    }
  }

  async function queueNhis() {
    setQueuing('nhis');
    try {
      const res = await api<{ submission: NhisSubmission; delivery?: { id: string; duplicated: boolean }; dryRun: boolean; configured: boolean }>(
        '/integrations/nhis/queue',
        { method: 'POST', body: { period: month, orgUnit: orgUnit || undefined, dryRun } },
      );
      setNhisPreview(res);
      if (!res.dryRun && !res.configured) toast('Queued — configure INTEGRATION_NHIS_URL to deliver', 'info');
      else if (!res.dryRun) toast(res.delivery?.duplicated ? 'Already queued (idempotent — no duplicate)' : 'Queued for delivery', 'success');
      else toast(`Dry run — ${res.submission.claims.length} claims`, 'success');
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Queue failed', 'error');
    } finally {
      setQueuing(null);
    }
  }

  async function queueEtracker() {
    setQueuing('etracker');
    try {
      const res = await api<{ submission: EtrackerSubmission; delivery?: { id: string; duplicated: boolean }; dryRun: boolean; configured: boolean }>(
        '/integrations/etracker/queue',
        { method: 'POST', body: { period: month, orgUnit: orgUnit || undefined, dryRun } },
      );
      setEtrackerPreview(res);
      if (!res.dryRun && !res.configured) toast('Queued — configure INTEGRATION_ETRACKER_URL to deliver', 'info');
      else if (!res.dryRun) toast(res.delivery?.duplicated ? 'Already queued (idempotent — no duplicate)' : 'Queued for delivery', 'success');
      else toast(`Dry run — ${res.submission.clients.length} clients`, 'success');
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Queue failed', 'error');
    } finally {
      setQueuing(null);
    }
  }

  async function queueLhims() {
    setQueuing('lhims');
    try {
      const res = await api<{ submission: LhimsSubmission; delivery?: { id: string; duplicated: boolean }; dryRun: boolean; configured: boolean }>(
        '/integrations/lhims/queue',
        { method: 'POST', body: { period: month, orgUnit: orgUnit || undefined, dryRun } },
      );
      setLhimsPreview(res);
      if (!res.dryRun && !res.configured) toast('Queued — configure INTEGRATION_LHIMS_URL to deliver', 'info');
      else if (!res.dryRun) toast(res.delivery?.duplicated ? 'Already queued (idempotent — no duplicate)' : 'Queued for delivery', 'success');
      else toast(`Dry run — ${res.submission.bundle.entry.length} FHIR resources`, 'success');
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Queue failed', 'error');
    } finally {
      setQueuing(null);
    }
  }

  async function runSweep() {
    setSweeping(true);
    try {
      const res = await api<{ delivered: number; failed: number; attempted: number }>('/integrations/sweep', { method: 'POST' });
      toast(`Sweep: ${res.delivered} delivered, ${res.failed} failed, ${res.attempted} attempted`, res.attempted === 0 ? 'info' : 'success');
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Sweep failed', 'error');
    } finally {
      setSweeping(false);
    }
  }

  async function openPayload(row: IntegrationDeliveryRow) {
    try {
      const detail = await api<{ payloadJson: string }>(`/integrations/deliveries/${row.id}`);
      setPayloadOpen({ id: row.id, adapter: row.adapter, payloadJson: detail.payloadJson });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not load payload', 'error');
    }
  }

  const badge = (a: IntegrationStatus['adapters'][number]) =>
    a.configured ? <Badge tone="green">Configured</Badge> : <Badge tone="gold">Not configured</Badge>;

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
          title="Add New Integration"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader
        title="National Integrations"
        subtitle="DHIMS2 + SORMAS + GhiLMIS + HRIMS + NHIS + eTracker + LHIMS adapters on independent, idempotent delivery queues (docs/08 §3) — a national system being offline never blocks the facility."
        action={
          <Button variant="outline" loading={sweeping} onClick={() => void runSweep()}>
            Run delivery sweep
          </Button>
        }
      />

      {busy && !status ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <>
          {/* ----------------------------------------------------- adapter cards */}
          <div className="grid gap-4 lg:grid-cols-2">
            {(['dhims2', 'sormas', 'ghilmis', 'hrims', 'nhis', 'etracker', 'lhims'] as const).map((key) => {
              const meta = ADAPTER_META[key];
              const a = status?.adapters.find((x) => x.adapter === key);
              if (!a) return null;
              return (
                <Card key={key} title={meta.name} subtitle={meta.system} action={badge(a)}>
                  <p className="mb-4 text-sm text-slate-500">{meta.blurb}</p>
                  <div className="mb-4 grid grid-cols-3 gap-3">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Pending</p>
                      <p className="text-xl font-bold tabular-nums text-g-ink">{a.pending}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Delivered</p>
                      <p className="text-xl font-bold tabular-nums text-g-ink">{a.delivered}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Failed</p>
                      <p className="text-xl font-bold tabular-nums text-g-red">{a.failed}</p>
                    </div>
                  </div>
                  <dl className="space-y-1 text-xs text-slate-500">
                    <div className="flex justify-between"><dt>Last delivered</dt><dd className="font-medium text-g-ink">{fmtDateTime(a.lastDeliveredAt)}</dd></div>
                    <div className="flex justify-between"><dt>Next attempt</dt><dd className="font-medium text-g-ink">{fmtDateTime(a.nextAttemptAt)}</dd></div>
                    {a.lastRemoteId && <div className="flex justify-between"><dt>Last ack id</dt><dd className="font-mono text-[10px] text-g-ink">{a.lastRemoteId}</dd></div>}
                    {a.lastError && <div className="rounded-md bg-red-50 px-2 py-1.5 text-[11px] text-g-red">{a.lastError}</div>}
                  </dl>
                </Card>
              );
            })}
          </div>

          {/* ----------------------------------------------------- queue forms */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Queue a DHIMS2 dataset" subtitle="One submission per month × org unit — re-queuing never duplicates (idempotency key)">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Month">
                    <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
                  </Field>
                  <Field label="Org unit (optional)">
                    <Input value={orgUnit} onChange={(e) => setOrgUnit(e.target.value)} placeholder="GH-KBTH" />
                  </Field>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} className="h-4 w-4 accent-g-red" />
                  Dry run — build and preview only, do not queue
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button variant="green" loading={queuing === 'dhims2'} onClick={() => void queueDhims()}>
                    {dryRun ? 'Preview dataset' : 'Queue & deliver'}
                  </Button>
                  <Button variant="outline" onClick={() => void downloadFile(`/integrations/dhims2/export?period=${month}&format=csv`, `dhims2-${month}.csv`)}>
                    Download CSV
                  </Button>
                  <Button variant="ghost" onClick={() => void downloadFile(`/integrations/dhims2/export?period=${month}`, `dhims2-${month}.json`)}>
                    Download JSON
                  </Button>
                </div>
                {dhimsPreview && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Dataset {dhimsPreview.submission.period} · org unit {dhimsPreview.submission.orgUnit} · {dhimsPreview.submission.dataValues.length} values
                      {dhimsPreview.delivery ? ` · queued${dhimsPreview.delivery.duplicated ? ' (already queued)' : ''}` : ''}
                    </p>
                    <div className="max-h-48 overflow-auto rounded-md bg-white p-2 font-mono text-[10px] leading-relaxed text-slate-600">
                      {JSON.stringify(dhimsPreview.submission.dataValues.slice(0, 12), null, 1)}
                      {dhimsPreview.submission.dataValues.length > 12 ? `\n… ${dhimsPreview.submission.dataValues.length - 12} more` : ''}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card title="Queue a HRIMS workforce snapshot" subtitle="Current staff register in scope for the month — re-queuing never duplicates (idempotency key)">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Month">
                    <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
                  </Field>
                  <Field label="Org unit (optional)">
                    <Input value={orgUnit} onChange={(e) => setOrgUnit(e.target.value)} placeholder="GH-KBTH" />
                  </Field>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} className="h-4 w-4 accent-g-red" />
                  Dry run — build and preview only, do not queue
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button variant="green" loading={queuing === 'hrims'} onClick={() => void queueHrims()}>
                    {dryRun ? 'Preview workforce' : 'Queue & deliver'}
                  </Button>
                  <Button variant="outline" onClick={() => void downloadFile(`/integrations/hrims/export?period=${month}&format=csv`, `hrims-${month}.csv`)}>
                    Download CSV
                  </Button>
                  <Button variant="ghost" onClick={() => void downloadFile(`/integrations/hrims/export?period=${month}`, `hrims-${month}.json`)}>
                    Download JSON
                  </Button>
                </div>
                {hrimsPreview && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Register {hrimsPreview.submission.period} · org unit {hrimsPreview.submission.orgUnit} · {hrimsPreview.submission.staff.length} staff · {hrimsPreview.submission.summary.active} active · {hrimsPreview.submission.summary.heads} heads
                      {hrimsPreview.delivery ? ` · queued${hrimsPreview.delivery.duplicated ? ' (already queued)' : ''}` : ''}
                    </p>
                    <div className="max-h-48 overflow-auto rounded-md bg-white p-2 font-mono text-[10px] leading-relaxed text-slate-600">
                      {JSON.stringify(hrimsPreview.submission.staff.slice(0, 12), null, 1)}
                      {hrimsPreview.submission.staff.length > 12 ? `\n… ${hrimsPreview.submission.staff.length - 12} more` : ''}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card title="Queue a GhiLMIS stock snapshot" subtitle="Current commodity levels in scope for the month — re-queuing never duplicates (idempotency key)">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Month">
                    <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
                  </Field>
                  <Field label="Org unit (optional)">
                    <Input value={orgUnit} onChange={(e) => setOrgUnit(e.target.value)} placeholder="GH-KBTH" />
                  </Field>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} className="h-4 w-4 accent-g-red" />
                  Dry run — build and preview only, do not queue
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button variant="green" loading={queuing === 'ghilmis'} onClick={() => void queueGhilmis()}>
                    {dryRun ? 'Preview stock' : 'Queue & deliver'}
                  </Button>
                  <Button variant="outline" onClick={() => void downloadFile(`/integrations/ghilmis/export?period=${month}&format=csv`, `ghilmis-${month}.csv`)}>
                    Download CSV
                  </Button>
                  <Button variant="ghost" onClick={() => void downloadFile(`/integrations/ghilmis/export?period=${month}`, `ghilmis-${month}.json`)}>
                    Download JSON
                  </Button>
                </div>
                {ghilmisPreview && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Snapshot {ghilmisPreview.submission.period} · org unit {ghilmisPreview.submission.orgUnit} · {ghilmisPreview.submission.items.length} items
                      {ghilmisPreview.delivery ? ` · queued${ghilmisPreview.delivery.duplicated ? ' (already queued)' : ''}` : ''}
                    </p>
                    <div className="max-h-48 overflow-auto rounded-md bg-white p-2 font-mono text-[10px] leading-relaxed text-slate-600">
                      {JSON.stringify(ghilmisPreview.submission.items.slice(0, 12), null, 1)}
                      {ghilmisPreview.submission.items.length > 12 ? `\n… ${ghilmisPreview.submission.items.length - 12} more` : ''}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card title="Queue an NHIS claims submission" subtitle="SUBMITTED claims with service dates in the month — re-queuing never duplicates (idempotency key)">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Month">
                    <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
                  </Field>
                  <Field label="Org unit (optional)">
                    <Input value={orgUnit} onChange={(e) => setOrgUnit(e.target.value)} placeholder="GH-KBTH" />
                  </Field>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} className="h-4 w-4 accent-g-red" />
                  Dry run — build and preview only, do not queue
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button variant="green" loading={queuing === 'nhis'} onClick={() => void queueNhis()}>
                    {dryRun ? 'Preview claims' : 'Queue & deliver'}
                  </Button>
                  <Button variant="outline" onClick={() => void downloadFile(`/integrations/nhis/export?period=${month}&format=csv`, `nhis-claims-${month}.csv`)}>
                    Download CSV
                  </Button>
                  <Button variant="ghost" onClick={() => void downloadFile(`/integrations/nhis/export?period=${month}`, `nhis-claims-${month}.json`)}>
                    Download JSON
                  </Button>
                </div>
                {nhisPreview && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Claims {nhisPreview.submission.period} · org unit {nhisPreview.submission.orgUnit} · {nhisPreview.submission.claims.length} claims · total GHS {nhisPreview.submission.claims.reduce((a, c) => a + c.amount, 0).toLocaleString()}
                      {nhisPreview.delivery ? ` · queued${nhisPreview.delivery.duplicated ? ' (already queued)' : ''}` : ''}
                    </p>
                    <div className="max-h-48 overflow-auto rounded-md bg-white p-2 font-mono text-[10px] leading-relaxed text-slate-600">
                      {JSON.stringify(nhisPreview.submission.claims.slice(0, 12), null, 1)}
                      {nhisPreview.submission.claims.length > 12 ? `\n… ${nhisPreview.submission.claims.length - 12} more` : ''}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card title="Queue an eTracker client cohort" subtitle="Maternal clients active in the month, with identity keys for national matching">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Month">
                    <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
                  </Field>
                  <Field label="Org unit (optional)">
                    <Input value={orgUnit} onChange={(e) => setOrgUnit(e.target.value)} placeholder="GH-KBTH" />
                  </Field>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} className="h-4 w-4 accent-g-red" />
                  Dry run — build and preview only, do not queue
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button variant="green" loading={queuing === 'etracker'} onClick={() => void queueEtracker()}>
                    {dryRun ? 'Preview clients' : 'Queue & deliver'}
                  </Button>
                  <Button variant="outline" onClick={() => void downloadFile(`/integrations/etracker/export?period=${month}&format=csv`, `etracker-clients-${month}.csv`)}>
                    Download CSV
                  </Button>
                  <Button variant="ghost" onClick={() => void downloadFile(`/integrations/etracker/export?period=${month}`, `etracker-clients-${month}.json`)}>
                    Download JSON
                  </Button>
                </div>
                {etrackerPreview && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Cohort {etrackerPreview.submission.period} · org unit {etrackerPreview.submission.orgUnit} · {etrackerPreview.submission.clients.length} clients
                      {etrackerPreview.delivery ? ` · queued${etrackerPreview.delivery.duplicated ? ' (already queued)' : ''}` : ''}
                    </p>
                    <div className="max-h-48 overflow-auto rounded-md bg-white p-2 font-mono text-[10px] leading-relaxed text-slate-600">
                      {JSON.stringify(etrackerPreview.submission.clients.slice(0, 12), null, 1)}
                      {etrackerPreview.submission.clients.length > 12 ? `\n… ${etrackerPreview.submission.clients.length - 12} more` : ''}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card title="Queue an LHIMS FHIR bundle" subtitle="Patient + Encounter + DiagnosticReport resources for the month, as a FHIR R4 Bundle">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Month">
                    <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
                  </Field>
                  <Field label="Org unit (optional)">
                    <Input value={orgUnit} onChange={(e) => setOrgUnit(e.target.value)} placeholder="GH-KBTH" />
                  </Field>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} className="h-4 w-4 accent-g-red" />
                  Dry run — build and preview only, do not queue
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button variant="green" loading={queuing === 'lhims'} onClick={() => void queueLhims()}>
                    {dryRun ? 'Preview bundle' : 'Queue & deliver'}
                  </Button>
                  <Button variant="outline" onClick={() => void downloadFile(`/integrations/lhims/export?period=${month}&format=csv`, `lhims-exchange-${month}.csv`)}>
                    Download CSV
                  </Button>
                  <Button variant="ghost" onClick={() => void downloadFile(`/integrations/lhims/export?period=${month}`, `lhims-exchange-${month}.json`)}>
                    Download JSON
                  </Button>
                </div>
                {lhimsPreview && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Bundle {lhimsPreview.submission.period} · org unit {lhimsPreview.submission.orgUnit} · {lhimsPreview.submission.bundle.entry.length} resources
                      {lhimsPreview.delivery ? ` · queued${lhimsPreview.delivery.duplicated ? ' (already queued)' : ''}` : ''}
                    </p>
                    <div className="max-h-48 overflow-auto rounded-md bg-white p-2 font-mono text-[10px] leading-relaxed text-slate-600">
                      {JSON.stringify(lhimsPreview.submission.bundle.entry.slice(0, 8), null, 1)}
                      {lhimsPreview.submission.bundle.entry.length > 8 ? `\n… ${lhimsPreview.submission.bundle.entry.length - 8} more` : ''}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card title="Queue a SORMAS case export" subtitle="Confirmed & suspected cases reported in the range, scoped to your view">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="From">
                    <Input type="date" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} />
                  </Field>
                  <Field label="To">
                    <Input type="date" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} />
                  </Field>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} className="h-4 w-4 accent-g-red" />
                  Dry run — build and preview only, do not queue
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button variant="green" loading={queuing === 'sormas'} onClick={() => void queueSormas()}>
                    {dryRun ? 'Preview cases' : 'Queue & deliver'}
                  </Button>
                  <Button variant="outline" onClick={() => void downloadFile(`/integrations/sormas/export?from=${range.from}&to=${range.to}&format=csv`, `sormas-cases-${range.from}-${range.to}.csv`)}>
                    Download CSV
                  </Button>
                  <Button variant="ghost" onClick={() => void downloadFile(`/integrations/sormas/export?from=${range.from}&to=${range.to}`, `sormas-cases-${range.from}-${range.to}.json`)}>
                    Download JSON
                  </Button>
                </div>
                {sormasPreview && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {sormasPreview.count} case(s) in range{sormasPreview.delivery ? ` · queued${sormasPreview.delivery.duplicated ? ' (already queued)' : ''}` : ''}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">Diseases map to SORMAS enums (e.g. Cholera → CHOLERA); unknown diseases export as OTHER so the queue never blocks.</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* ----------------------------------------------------- delivery log */}
          <Card
            title="Delivery log"
            subtitle="Reconciliation record — one row per submission, payload as sent, retries and upstream acknowledgement"
            action={<span className="text-xs text-slate-400">sweep every {(status?.sweepIntervalMs ?? 60_000) / 60_000} min · max {status?.maxAttempts} attempts</span>}
          >
            {deliveries.length === 0 ? (
              <EmptyState title="No submissions yet" message="Queue a DHIMS2 dataset, SORMAS case export, GhiLMIS stock snapshot, HRIMS workforce snapshot, NHIS claims, eTracker cohort or LHIMS bundle above." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
                      <th className="py-2 pr-3">Adapter</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3">Submission</th>
                      <th className="py-2 pr-3">Attempts</th>
                      <th className="py-2 pr-3">Delivered</th>
                      <th className="py-2 pr-3">Ack</th>
                      <th className="py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map((row) => (
                      <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                        <td className="py-2 pr-3">
                          <span className="font-semibold uppercase text-xs text-g-ink">{row.adapter}</span>
                        </td>
                        <td className="py-2 pr-3">
                          {row.status === 'DELIVERED' ? <Badge tone="green">Delivered</Badge>
                            : row.status === 'FAILED' ? <Badge tone="red">Failed</Badge>
                            : <Badge tone="gold">Pending</Badge>}
                        </td>
                        <td className="max-w-[240px] truncate py-2 pr-3 font-mono text-[11px] text-slate-500">{row.idempotencyKey}</td>
                        <td className="py-2 pr-3 tabular-nums text-slate-500">{row.attempts}</td>
                        <td className="py-2 pr-3 text-xs text-slate-500">{fmtDateTime(row.deliveredAt)}</td>
                        <td className="max-w-[140px] truncate py-2 pr-3 font-mono text-[10px] text-slate-400">{row.remoteId ?? '—'}</td>
                        <td className="py-2 text-right">
                          <button
                            className="text-xs font-semibold text-g-red hover:underline"
                            onClick={() => void openPayload(row)}
                          >
                            Payload
                          </button>
                          {row.lastError && <span className="ml-2 max-w-[160px] truncate align-middle text-[10px] text-g-red" title={row.lastError}>{row.lastError}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {/* ----------------------------------------------------- payload drawer */}
      {payloadOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/30" onClick={() => setPayloadOpen(null)}>
          <div className="h-full w-full max-w-xl overflow-auto bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-g-ink">Payload as sent · {payloadOpen.adapter.toUpperCase()}</p>
                <p className="font-mono text-[10px] text-slate-400">{payloadOpen.id}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setPayloadOpen(null)}>Close</Button>
            </div>
            <pre className="overflow-auto rounded-lg bg-slate-900 p-4 text-[11px] leading-relaxed text-emerald-300">
              {JSON.stringify(JSON.parse(payloadOpen.payloadJson), null, 2)}
            </pre>
            <p className="mt-3 text-[11px] text-slate-400">
              {user?.permissions?.includes('view_audit') ? 'Also recorded in the audit log under integration.* actions.' : 'This submission is fully traceable in the audit log.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
