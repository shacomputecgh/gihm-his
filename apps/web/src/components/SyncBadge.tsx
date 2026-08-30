import { useState } from 'react';
import { useConnection } from '../lib/connection';
import { Badge, Button } from './ui';
import { Icon } from './icons';
import { fmtDateTime } from '../lib/format';
import { getAppMode } from '../lib/appMode';

const MODE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  online:  { label: '🌐 Online',  color: 'text-g-green',  icon: 'wifi' },
  offline: { label: '📴 Offline',  color: 'text-g-gold',   icon: 'wifiOff' },
  mobile:  { label: '📱 Mobile Sync', color: 'text-blue-500', icon: 'wifi' },
};

export function SyncBadge() {
  const { online, serverHealthy, pending, syncing, lastSyncAt, sync, lastSyncResult } = useConnection();
  const [open, setOpen] = useState(false);
  const appMode = getAppMode();
  const modeInfo = MODE_LABELS[appMode] ?? MODE_LABELS.online;

  const offline = !online || serverHealthy === false;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold transition hover:border-slate-300"
        title="Synchronization status"
      >
        {syncing ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-g-gold border-t-transparent" />
        ) : offline ? (
          <Icon name="wifiOff" className="h-4 w-4 text-g-red" />
        ) : (
          <Icon name="wifi" className="h-4 w-4 text-g-green" />
        )}
        <span className={offline ? 'text-g-red' : 'text-g-green'}>
          {syncing ? 'Syncing…' : offline ? 'Offline' : 'Connected'}
        </span>
        <span className={`ml-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${modeInfo.color} bg-slate-100`}>
          {modeInfo.label}
        </span>
        {pending > 0 && <Badge tone="gold">{pending} pending</Badge>}
      </button>

      {open && (
        <div className="fade-in absolute right-0 top-10 z-40 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Sync status</p>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Connection</dt><dd className={offline ? 'font-semibold text-g-red' : 'font-semibold text-g-green'}>{offline ? 'OFFLINE — local mode active' : 'Connected'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Server</dt><dd className="font-semibold">{serverHealthy === null ? 'Checking…' : serverHealthy ? 'Healthy' : 'Unreachable'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Pending transactions</dt><dd className="font-semibold tabular-nums">{pending}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Last successful sync</dt><dd className="font-semibold">{lastSyncAt ? fmtDateTime(lastSyncAt) : '—'}</dd></div>
            {lastSyncResult && (
              <div className="flex justify-between"><dt className="text-slate-500">Last result</dt><dd className="font-semibold">{lastSyncResult.processed} synced · {lastSyncResult.failed} failed</dd></div>
            )}
          </dl>
          <p className="mt-2 text-[11px] text-slate-400">
            {offline ? 'Working safely — data will sync automatically when connection returns.' : 'All local data synchronized.'}
          </p>
          <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => void sync()} icon="refresh" disabled={syncing || offline}>
            {syncing ? 'Syncing…' : 'Sync now'}
          </Button>
        </div>
      )}
    </div>
  );
}
