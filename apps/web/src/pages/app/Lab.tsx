import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import type { LabOrderWorklistRow } from '../../types';
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Segmented, Spinner, Textarea, useToast } from '../../components/ui';
import { fmtDateTime, ageFromDob, titleCase } from '../../lib/format';
import { useAuth } from '../../lib/auth';

type Filter = 'ORDERED' | 'ALL';

export default function Lab() {
  const [filter, setFilter] = useState<Filter>('ORDERED');
  const [rows, setRows] = useState<LabOrderWorklistRow[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [result, setResult] = useState('');
  const [referenceRange, setReferenceRange] = useState('');
  const [critical, setCritical] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const { user } = useAuth();
  const canVerify = !!user?.permissions.includes('verify_lab');

  const load = useCallback(async () => {
    setRows((await api<{ items: LabOrderWorklistRow[] }>(`/lab/orders?status=${filter}`)).items);
  }, [filter]);

  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  function open(row: LabOrderWorklistRow) {
    setOpenId(row.id);
    setResult(row.result ?? '');
    setReferenceRange(row.referenceRange ?? '');
    setCritical(row.critical);
  }

  async function verify(row: LabOrderWorklistRow) {
    setBusy(true);
    try {
      await api(`/lab/orders/${row.id}/result`, { method: 'POST', body: { result, referenceRange, critical } });
      toast(critical ? 'Critical result flagged & verified' : 'Result verified', 'success');
      setOpenId(null);
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Laboratory" subtitle="Test worklist — enter results, flag criticals, and release verified reports." />
      <div className="mb-5">
        <Segmented options={[{ value: 'ORDERED', label: 'Pending results' }, { value: 'ALL', label: 'All orders' }]} value={filter} onChange={setFilter} />
      </div>

      {!rows ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState icon="flask" title="No pending tests" message="Laboratory orders from clinicians will appear here." />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Card key={row.id} pad={false}>
              <button onClick={() => open(row)} className="flex w-full cursor-pointer items-center justify-between gap-3 px-5 py-3.5 text-left">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-g-ink">{row.test}</span>
                    <Badge tone={row.critical ? 'red' : 'navy'}>{titleCase(row.discipline)}</Badge>
                    {row.critical && <Badge tone="red">CRITICAL</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    <Link to={`/app/patients/${row.patient.id}`} className="font-semibold text-g-ink hover:text-g-red" onClick={(e) => e.stopPropagation()}>
                      {row.patient.fullName}
                    </Link>
                    <span className="text-slate-400"> · {row.patient.mrn} · {ageFromDob(row.patient.dateOfBirth)} · ordered {fmtDateTime(row.createdAt)}</span>
                  </p>
                </div>
                <Badge tone={row.status === 'VERIFIED' ? 'green' : 'gold'}>{row.status}</Badge>
              </button>

              {openId === row.id && (
                <div className="border-t border-slate-100 bg-g-mist/40 p-5">
                  {row.status === 'VERIFIED' && row.result ? (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Verified result</p>
                      <p className="mt-1 text-sm font-semibold text-g-ink">{row.result}</p>
                      {row.referenceRange && <p className="mt-0.5 text-xs text-slate-500">Ref: {row.referenceRange}</p>}
                      <Button size="sm" variant="outline" className="mt-3" onClick={() => open(row)}>Re-enter result</Button>
                    </div>
                  ) : canVerify ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <Field label="Result">
                          <Textarea value={result} onChange={(e) => setResult(e.target.value)} placeholder="e.g. Hb 12.4 g/dL, WBC 6.2 x10^9/L" />
                        </Field>
                      </div>
                      <Field label="Reference range" hint="Optional — shown with the report">
                        <Input value={referenceRange} onChange={(e) => setReferenceRange(e.target.value)} placeholder="e.g. 11.5–15.5 g/dL" />
                      </Field>
                      <div className="flex items-end">
                        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-g-red/20 bg-g-red/5 px-3 py-2 text-sm font-semibold text-g-red">
                          <input type="checkbox" checked={critical} onChange={(e) => setCritical(e.target.checked)} className="h-4 w-4 accent-g-red" />
                          Critical result
                        </label>
                      </div>
                      <div className="flex items-end justify-end gap-2 md:col-span-2">
                        <Button variant="ghost" onClick={() => setOpenId(null)}>Cancel</Button>
                        <Button variant="green" loading={busy} onClick={() => void verify(row)}>Verify & release result</Button>
                      </div>
                    </div>
                  ) : (
                    <p className="px-5 py-3 text-xs text-slate-400">Only users with the <span className="font-semibold">verify_lab</span> permission can enter results.</p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
