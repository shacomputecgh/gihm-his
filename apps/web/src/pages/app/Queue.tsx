import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { DEMO_QUEUE } from '../../lib/demoData';
import type { QueueEntry } from '../../types';
import { Badge, Button, Card, EmptyState, PageHeader, Segmented, Spinner } from '../../components/ui';
import { fmtTime } from '../../lib/format';
import { useToast } from '../../components/ui';

type Dep = 'OPD' | 'PHARMACY' | 'LABORATORY' | 'IMAGING';
// Tickets are prefixed with the first 3 letters of the department name (seed + API).
const DEP_TICKET_PREFIX: Record<Dep, string> = { OPD: 'OUT', PHARMACY: 'PHA', LABORATORY: 'LAB', IMAGING: 'IMA' };
const DEPARTMENTS: { value: Dep; label: string }[] = [
  { value: 'OPD', label: 'Outpatient' },
  { value: 'PHARMACY', label: 'Pharmacy' },
  { value: 'LABORATORY', label: 'Laboratory' },
  { value: 'IMAGING', label: 'Imaging' },
];

export default function Queue() {
  const [dep, setDep] = useState<Dep>('OPD');
  const [entries, setEntries] = useState<QueueEntry[] | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      const res = await api<{ entries: QueueEntry[] }>('/queue');
      setEntries(res.entries);
    } catch {
      setEntries(DEMO_QUEUE as unknown as QueueEntry[]);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 15_000);
    return () => window.clearInterval(t);
  }, [load]);

  const prefix = DEP_TICKET_PREFIX[dep];
  const waiting = (entries ?? []).filter((e) => e.ticket.startsWith(prefix) && e.status === 'WAITING');
  // Start moves a ticket to IN_SERVICE; the board also honours CALLED (the
  // older status name) so started tickets always land in the in-service card.
  const called = (entries ?? []).filter((e) => e.ticket.startsWith(prefix) && (e.status === 'IN_SERVICE' || e.status === 'CALLED'));
  const served = (entries ?? []).filter((e) => e.ticket.startsWith(prefix) && e.status === 'COMPLETED');

  async function setStatus(id: string, status: 'COMPLETED' | 'SKIPPED' | 'IN_SERVICE') {
    try {
      await api(`/queue/${id}/status`, { method: 'POST', body: { status } });
      toast(`Ticket ${status.toLowerCase()}`, 'success');
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  }

  return (
    <div>
      <PageHeader
        title="Queue Management"
        subtitle="Live department queues. Start the next patient when a station is free."
        action={<Button variant="outline" icon="refresh" onClick={() => void load()}>Refresh</Button>}
      />
      <div className="mb-5"><Segmented options={DEPARTMENTS} value={dep} onChange={setDep} /></div>

      {!entries ? (
        <Spinner />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title={`Waiting · ${waiting.length}`} className="lg:col-span-2">
            {waiting.length === 0 ? (
              <EmptyState icon="check" title="No patients waiting" message="The queue is clear for this department." />
            ) : (
              <ol className="divide-y divide-slate-100">
                {waiting.map((e, i) => (
                  <li key={e.id} className="flex items-center gap-4 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-g-navy text-sm font-bold text-white">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-g-ink">{e.ticket}</span>
                        {e.patient ? (
                          <Link to={`/app/patients/${e.patient.id}`} className="text-sm text-slate-600 hover:text-g-red hover:underline">{e.patient.fullName}</Link>
                        ) : (
                          <span className="text-sm text-slate-400">Walk-in</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">Joined {fmtTime(e.createdAt)} · {e.patient?.mrn ?? 'no MRN'}</p>
                    </div>
                    <Button size="sm" variant="green" icon="check" onClick={() => void setStatus(e.id, 'IN_SERVICE')}>Start</Button>
                    <Button size="sm" variant="ghost" onClick={() => void setStatus(e.id, 'SKIPPED')}>Skip</Button>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <div className="space-y-4">
            <Card title={`In service · ${called.length}`}>
              {called.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">None in service</p>
              ) : (
                <ul className="space-y-2">
                  {called.map((e) => (
                    <li key={e.id} className="flex items-center justify-between rounded-lg bg-g-gold/15 px-3 py-2">
                      <div>
                        <p className="text-sm font-bold text-g-ink">{e.ticket}</p>
                        <p className="text-xs text-slate-500">{e.patient?.fullName ?? 'Walk-in'}</p>
                      </div>
                      <Button size="sm" variant="green" onClick={() => void setStatus(e.id, 'COMPLETED')}>Complete</Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card title={`Served today · ${served.length}`}>
              <p className="text-sm text-slate-500">Completed tickets are kept for operational reporting.</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {served.slice(0, 12).map((e) => (
                  <span key={e.id} className="rounded-md bg-g-mist px-2 py-0.5 text-[11px] font-semibold text-slate-600 line-through">{e.ticket}</span>
                ))}
              </div>
            </Card>
            <Card title="How it works">
              <p className="mb-3 text-xs text-slate-500">Registration and check-in add patients to this department queue with an auto ticket number ({prefix}-NNN). Use <strong>Start</strong> to bring the next patient into service and <strong>Complete</strong> when done.</p>
              <Badge tone="gray">Auto ticket numbering · 15s live refresh</Badge>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
