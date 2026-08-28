import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Card, useToast } from './ui';
import { Icon } from './icons';
import {
  getLocalBackendStatus,
  isDesktopShell,
  startLocalBackend,
  stopLocalBackend,
  type LocalBackendStatus,
} from '../lib/desktop';
import { backendStatusKind, type BackendStatusKind } from '../lib/localBackend';

/**
 * Bundled local edge backend (docs/26 §6 6d). When the LAN has no server the
 * desktop client IS the facility edge — the shell spawns the bundled Node API
 * (deploy/edge/windows/backend.ps1) on localhost:4000. This card surfaces the
 * lifecycle from Admin → Sync status. Only meaningful inside the shell.
 */

const BADGE: Record<BackendStatusKind, { tone: 'green' | 'gold' | 'gray'; label: string }> = {
  running: { tone: 'green', label: 'Running' },
  stopped: { tone: 'gold', label: 'Provisioned · stopped' },
  'not-provisioned': { tone: 'gray', label: 'Not provisioned' },
  unavailable: { tone: 'gray', label: 'Unavailable' },
};

const COPY: Record<BackendStatusKind, string> = {
  running:
    'The bundled facility edge is serving this device — the desktop is the local server when the LAN has none. The shell started it automatically at launch.',
  stopped:
    'The bundled backend is installed but not running. Start it to make this workstation the facility edge for the local network.',
  'not-provisioned':
    'No bundled backend is installed. Run `deploy/edge/windows/backend.ps1 provision` (or the installer) once, then this workstation becomes the facility edge when the LAN has no server.',
  unavailable:
    'The shell bridge is unavailable — this control only applies inside the Windows desktop client.',
};

export default function LocalBackendCard() {
  const [status, setStatus] = useState<LocalBackendStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const refresh = useCallback(async () => {
    const s = await getLocalBackendStatus();
    setStatus(s);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!isDesktopShell()) return null;

  const kind = backendStatusKind(status);
  const meta = BADGE[kind];
  const running = kind === 'running';

  async function act(fn: () => Promise<LocalBackendStatus | null>, verb: string, done: string) {
    setBusy(true);
    setError(null);
    try {
      const next = await fn();
      if (!next) {
        // The invoke wrapper swallowed a shell error — never toast success.
        setError(`The shell could not ${verb} the local backend`);
        toast(`Could not ${verb} the local backend`, 'error');
      } else {
        setStatus(next);
        toast(`Local backend ${done}`, 'success');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not ${verb} the local backend`);
      toast(`Could not ${verb} the local backend`, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      title="Local edge backend"
      subtitle="Bundled facility edge for this device (docs/26 §6 6d) — the desktop becomes the server when the LAN has none"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={meta.tone}>{meta.label}</Badge>
        {status?.provisioned && (
          <span className="font-mono text-xs text-slate-400">
            http://localhost:{status.port}/api/v1
            {status.pid ? ` · pid ${status.pid}` : ''}
          </span>
        )}
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" loading={busy} disabled={running || kind === 'not-provisioned' || kind === 'unavailable'} onClick={() => void act(startLocalBackend, 'start', 'started')}>
            <Icon name="monitor" className="h-3.5 w-3.5" /> Start
          </Button>
          <Button size="sm" variant="outline" loading={busy} disabled={!running} onClick={() => void act(stopLocalBackend, 'stop', 'stopped')}>
            Stop
          </Button>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">{COPY[kind]}</p>
      {error && <p className="mt-2 text-xs font-semibold text-g-red">{error}</p>}
    </Card>
  );
}
