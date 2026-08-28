import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import type { SecurityAlertInbox } from '../types';
import { fmtDateTime } from '../lib/format';
import { Icon } from './ui';

/** Severity → dot color (critical red, warning gold, info slate). */
function severityDot(severity: string, read: boolean): string {
  if (read) return 'bg-slate-300';
  if (severity === 'critical') return 'bg-g-red';
  if (severity === 'warning') return 'bg-g-gold';
  return 'bg-slate-400';
}

/** Refetch throttle — avoids a DB round-trip pair on every navigation. */
const REFRESH_MS = 60_000;

/** Header alert bell — visible to the DEVELOPER scope (the security authority). */
export default function AlertBell() {
  const [inbox, setInbox] = useState<SecurityAlertInbox | null>(null);
  const [open, setOpen] = useState(false);
  const [sevFilter, setSevFilter] = useState('');
  const lastFetch = useRef(0);
  const location = useLocation();

  const load = () => {
    if (Date.now() - lastFetch.current < REFRESH_MS && inbox) return;
    lastFetch.current = Date.now();
    void api<SecurityAlertInbox>('/admin/developer/alerts')
      .then(setInbox)
      .catch(() => undefined);
  };

  useEffect(() => {
    load();
    const t = window.setInterval(load, REFRESH_MS);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const unread = inbox?.unread ?? 0;
  const visible = (inbox?.alerts ?? []).filter((a) => !sevFilter || a.severity === sevFilter);
  const SEV_CHIPS = [
    { v: '', label: 'All' },
    { v: 'critical', label: 'Critical' },
    { v: 'warning', label: 'Warning' },
    { v: 'info', label: 'Info' },
  ] as const;

  async function markRead(id: string) {
    await api(`/admin/developer/alerts/${id}/read`, { method: 'POST' }).catch(() => undefined);
    setInbox((i) =>
      i ? { unread: Math.max(0, i.unread - 1), alerts: i.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)), deliveryStats: i.deliveryStats } : i,
    );
  }

  async function markAll() {
    await api('/admin/developer/alerts/read-all', { method: 'POST' }).catch(() => undefined);
    setInbox((i) => (i ? { unread: 0, alerts: i.alerts.map((a) => ({ ...a, read: true })), deliveryStats: i.deliveryStats } : i));
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o);
          load();
        }}
        className="relative cursor-pointer rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-g-ink"
        title="Security alerts"
      >
        <Icon name="bell" className="h-4.5 w-4.5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-g-red px-1 text-[10px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-96 max-w-[90vw] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
              <p className="text-sm font-bold text-g-ink">Security alerts</p>
              {unread > 0 && (
                <button onClick={() => void markAll()} className="cursor-pointer text-xs font-semibold text-g-red hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 border-b border-slate-100 px-4 py-2">
              {SEV_CHIPS.map((c) => (
                <button
                  key={c.v}
                  onClick={() => setSevFilter(c.v)}
                  className={`cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                    sevFilter === c.v ? 'bg-g-navy text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {!inbox ? (
                <p className="px-4 py-6 text-center text-sm text-slate-400">Loading alerts…</p>
              ) : visible.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-slate-400">{inbox.alerts.length === 0 ? 'No security alerts yet.' : 'No alerts at this severity.'}</p>
              ) : (
                visible.map((a) => (
                  <div key={a.id} className={`flex items-start gap-3 border-b border-slate-50 px-4 py-3 ${a.read ? 'opacity-60' : ''}`}>
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${severityDot(a.severity, a.read)}`} title={a.severity} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-wide text-g-ink">{a.title}</p>
                      <p className="mt-0.5 text-sm text-slate-600">{a.message}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{fmtDateTime(a.createdAt)}</p>
                    </div>
                    {!a.read && (
                      <button onClick={() => void markRead(a.id)} className="cursor-pointer text-xs font-semibold text-g-navy hover:underline">
                        Mark read
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}