import { useState, type FormEvent } from 'react';
import AddNewForm from '../../components/AddNewForm';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import type { Invoice, Patient, PaymentAttempt, PaymentProviderInfo } from '../../types';
import { Badge, Button, Card, EmptyState, Icon, Input, PageHeader, Spinner, useToast } from '../../components/ui';
import { cedis, fmtDateTime } from '../../lib/format';

/**
 * Billing (spec §37) — find a patient, see their invoices and collect payment
 * through the provider abstraction: initiate an attempt (defaults to the
 * remaining balance, idempotent) and confirm it when the payment clears. The
 * SIMULATED provider is clearly labeled test-only.
 */
export default function Billing() {
  const { user } = useAuth();
  const toast = useToast();
  const canProcess = !!user?.permissions.includes('process_payment');

  const [q, setQ] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [attempts, setAttempts] = useState<Record<string, PaymentAttempt[]>>({});
  const [busy, setBusy] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  async function search(e: FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setSearching(true);
    try {
      const page = await api<{ items: Patient[] }>('/patients', { query: { q, pageSize: '8' } });
      setResults(page.items);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Search failed', 'error');
    } finally {
      setSearching(false);
    }
  }

  async function pick(p: Patient) {
    setPatient(p);
    setResults([]);
    setBusy(true);
    try {
      const detail = await api<Patient>(`/patients/${p.id}`);
      setInvoices(detail.invoices ?? []);
      const withAttempts = await Promise.all(
        (detail.invoices ?? []).map(async (inv) => {
          try {
            const res = await api<{ items: PaymentAttempt[] }>(`/invoices/${inv.id}/payments`);
            return [inv.id, res.items] as const;
          } catch {
            return [inv.id, []] as const;
          }
        }),
      );
      setAttempts(Object.fromEntries(withAttempts));
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not load invoices', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function initiate(inv: Invoice) {
    setActing(inv.id);
    try {
      const res = await api<{ attempt: PaymentAttempt; instructions: string | null; provider: PaymentProviderInfo }>(
        `/invoices/${inv.id}/payments`,
        { method: 'POST', body: { provider: 'SIMULATED' } },
      );
      toast(res.provider.note, 'info');
      if (res.instructions) toast(res.instructions, 'info');
      await refreshAttempts(inv.id);
      await refreshInvoice(inv.id);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Initiate failed', 'error');
    } finally {
      setActing(null);
    }
  }

  async function confirm(inv: Invoice, attempt: PaymentAttempt) {
    setActing(attempt.id);
    try {
      const res = await api<{ attempt: PaymentAttempt }>(`/payments/webhook/SIMULATED`, {
        method: 'POST',
        body: { providerRef: attempt.providerRef },
      });
      toast(res.attempt.status === 'SUCCESS' ? 'Payment confirmed — invoice updated' : `Payment ${res.attempt.status.toLowerCase()}`, res.attempt.status === 'SUCCESS' ? 'success' : 'error');
      await refreshAttempts(inv.id);
      await refreshInvoice(inv.id);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Confirm failed', 'error');
    } finally {
      setActing(null);
    }
  }

  async function refreshInvoice(invoiceId: string) {
    const detail = await api<Patient>(`/patients/${patient!.id}`);
    setInvoices(detail.invoices ?? []);
    void invoiceId;
  }

  async function refreshAttempts(invoiceId: string) {
    try {
      const res = await api<{ items: PaymentAttempt[] }>(`/invoices/${invoiceId}/payments`);
      setAttempts((a) => ({ ...a, [invoiceId]: res.items }));
    } catch {
      /* keep previous */
    }
  }

  const tone = (s: string) => (s === 'PAID' ? 'green' : s === 'PARTIAL' ? 'gold' : 'gray');
  const attemptTone = (s: string) => (s === 'SUCCESS' ? 'green' : s === 'FAILED' ? 'red' : 'gold');

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
          title="Add New Bill"
          fields={[{"name": "fullName", "label": "Full Name", "type": "text", "placeholder": "e.g. Abena Osei", "required": true}, {"name": "dateOfBirth", "label": "Date of Birth", "type": "date", "required": true}, {"name": "sex", "label": "Sex", "type": "select", "options": ["Female", "Male", "Other"]}, {"name": "phone", "label": "Phone", "type": "tel", "placeholder": "0244 000 000"}, {"name": "nationality", "label": "Nationality", "type": "select", "options": ["Ghanaian", "Nigerian", "British", "Indian", "Other"]}, {"name": "bloodGroup", "label": "Blood Group", "type": "select", "options": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]}]}
          onSave={(data) => { console.log("Saving:", data); setShowAdd(false); }}
          initialData={editingItem}
          onCancel={() => { setShowAdd(false); setEditingItem(null); }}
        />
      )}
      <PageHeader
        title="Billing"
        subtitle="Find a patient, view their invoices and collect payments through the provider abstraction (spec §37)."
      />

      <Card title="Find patient" subtitle="Search the Master Patient Index by name, MRN, Ghana Card or NHIS">
        <form onSubmit={(e) => void search(e)} className="flex gap-2">
          <div className="relative flex-1">
            <Icon name="search" className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, MRN, Ghana Card, NHIS, phone…" className="pl-10" />
          </div>
          <Button variant="outline" loading={searching}>Search</Button>
        </form>
        {results.length > 0 && !patient && (
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
            {results.map((p) => (
              <button key={p.id} type="button" onClick={() => void pick(p)} className="flex w-full items-center justify-between border-b border-slate-100 px-3 py-2.5 text-left last:border-0 hover:bg-slate-50">
                <div>
                  <p className="text-sm font-semibold text-g-ink">{p.fullName}</p>
                  <p className="font-mono text-[10px] text-slate-400">{p.mrn}</p>
                </div>
                <Badge tone="navy">Open billing</Badge>
              </button>
            ))}
          </div>
        )}
      </Card>

      {patient && (
        <Card
          title={`Invoices — ${patient.fullName}`}
          subtitle={`${patient.mrn} · ${invoices.length} invoice(s)`}
          action={<Button size="sm" variant="ghost" onClick={() => { setPatient(null); setInvoices([]); setAttempts({}); }}>Change patient</Button>}
          pad={false}
        >
          {busy ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : invoices.length === 0 ? (
            <EmptyState title="No invoices" message="This patient has no invoices yet." />
          ) : (
            <div className="divide-y divide-slate-50">
              {invoices.map((inv) => {
                const remaining = Math.max(0, inv.amount - inv.paidAmount);
                const invAttempts = attempts[inv.id] ?? [];
                const pending = invAttempts.find((a) => a.status === 'PENDING');
                return (
                  <div key={inv.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-g-ink">{cedis(inv.amount)}</span>
                          <span className="text-xs text-slate-400">issued {fmtDateTime(inv.issuedAt)}</span>
                          <Badge tone={tone(inv.status)}>{inv.status}</Badge>
                          {inv.paymentMethod && <Badge tone="gray">{inv.paymentMethod}</Badge>}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">Paid {cedis(inv.paidAmount)} · remaining {cedis(remaining)}</p>
                      </div>
                      {canProcess && remaining > 0 && !pending && (
                        <Button size="sm" variant="green" loading={acting === inv.id} onClick={() => void initiate(inv)}>
                          Collect payment
                        </Button>
                      )}
                    </div>
                    {invAttempts.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {invAttempts.map((a) => (
                          <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
                            <div className="flex items-center gap-2 text-xs">
                              <Badge tone={attemptTone(a.status)}>{a.status}</Badge>
                              <span className="font-mono text-[10px] text-slate-500">{a.provider} · {a.providerRef}</span>
                              <span className="text-slate-500">{cedis(a.amount)}</span>
                              {a.error && <span className="text-g-red">{a.error}</span>}
                            </div>
                            {canProcess && a.status === 'PENDING' && (
                              <Button size="sm" variant="outline" loading={acting === a.id} onClick={() => void confirm(inv, a)}>
                                Confirm payment received
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      <p className="text-[11px] text-slate-400">
        Payments go through the provider abstraction (spec §37). The SIMULATED provider is test/demo only and never processes real money — real MOMO/card providers plug in behind the same endpoints.
        Invoices are settled only by a confirmed payment; nothing is assumed.
      </p>
    </div>
  );
}
