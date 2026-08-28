import { useCallback, useEffect, useState } from 'react';
import { api, downloadFile } from '../lib/api';
import type { ConfigAuditEntry } from '../types';
import { Badge, Button, Card, EmptyState, Field, Input, Spinner } from './ui';
import { fmtDateTime } from '../lib/format';

function toneFor(action: string): 'navy' | 'green' | 'gold' | 'red' {
  if (action.startsWith('masterdata.epi_schedule')) return 'navy';
  if (action.startsWith('masterdata.role')) return 'gold';
  if (action.startsWith('masterdata.facility') || action.startsWith('masterdata.region') || action.startsWith('masterdata.district')) return 'green';
  if (action === 'system.settings.test') return 'green';
  return 'navy'; // system.settings.update
}

/**
 * Configuration audit — a readable timeline of every runtime settings and
 * masterdata change. Values are never shown (secrets are excluded from the
 * audit trail at write time); each entry shows the actor and a summary of what
 * changed. Supports drill-down filters and CSV export.
 */
export default function ConfigAudit() {
  const [entries, setEntries] = useState<ConfigAuditEntry[] | null>(null);
  const [filters, setFilters] = useState({ action: '', actor: '', entityId: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (f: typeof filters) => {
    setBusy(true);
    try {
      const qs = new URLSearchParams(Object.fromEntries(Object.entries(f).filter(([, v]) => v)));
      const res = await api<{ entries: ConfigAuditEntry[] }>(`/admin/audit/config${qs.toString() ? `?${qs}` : ''}`);
      setEntries(res.entries);
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    void load(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function apply() {
    void load(filters);
  }

  async function exportCsv() {
    try {
      const qs = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)));
      qs.set('format', 'csv');
      const q = qs.toString();
      await downloadFile(`/admin/audit/config${q ? `?${q}` : ''}`, 'config-audit.csv');
    } catch (err) {
      console.error('[config-audit] export failed', err);
    }
  }

  if (!entries) {
    return (
      <div className="py-16">
        <Spinner label="Loading configuration audit…" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Card title="Configuration audit" subtitle="Every settings and masterdata change, with the actor and a summary of what changed. Values are never stored in the trail.">
        <div className="grid gap-3 md:grid-cols-4">
          <Field label="Action"><Input placeholder="masterdata, system.settings…" value={filters.action} onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))} /></Field>
          <Field label="Actor"><Input placeholder="email contains…" value={filters.actor} onChange={(e) => setFilters((f) => ({ ...f, actor: e.target.value }))} /></Field>
          <Field label="Entity id"><Input placeholder="exact id…" value={filters.entityId} onChange={(e) => setFilters((f) => ({ ...f, entityId: e.target.value }))} /></Field>
          <div className="flex items-end gap-2">
            <Button variant="navy" loading={busy} onClick={() => void apply()}>Apply</Button>
            <Button variant="outline" onClick={() => void exportCsv()}>Export CSV</Button>
          </div>
        </div>
      </Card>

      {entries.length === 0 ? (
        <EmptyState icon="clock" title="No matching changes" message="Settings and masterdata edits will appear here with the actor and a summary of what changed." />
      ) : (
        <Card pad={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
                  {['When', 'Actor', 'Change', 'Summary', 'Entity'].map((h) => (
                    <th key={h} className="px-5 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {entries.map((e) => (
                  <tr key={e.id} className="hover:bg-g-mist/40">
                    <td className="whitespace-nowrap px-5 py-2.5 text-slate-400">{fmtDateTime(e.at)}</td>
                    <td className="px-5 py-2.5">
                      <p className="font-semibold text-g-ink">{e.actorEmail ?? 'system'}</p>
                      <p className="text-xs text-slate-400">{e.role ?? ''}</p>
                    </td>
                    <td className="px-5 py-2.5"><Badge tone={toneFor(e.action)}>{e.label}</Badge></td>
                    <td className="max-w-md px-5 py-2.5">
                      <p className="font-mono text-xs leading-relaxed text-g-ink">{e.summary}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-slate-300">{e.action}</p>
                    </td>
                    <td className="px-5 py-2.5 text-slate-500">
                      {e.entityType ?? '—'}
                      {e.entityId && <span className="font-mono text-xs text-slate-300"> · {e.entityId.slice(0, 8)}</span>}
                    </td>
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
