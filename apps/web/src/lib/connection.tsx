import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api, apiUrl } from './api';
import { pendingCount, syncNow } from './offline';
import { useSseEvents, type SseEvent } from './sse';
import { isOfflineMode, getAppMode, type AppMode } from './appMode';

export interface ConnectionState {
  /** Whether the device can currently reach the server */
  online: boolean;
  /** Server health probe result */
  serverHealthy: boolean | null;
  /** Number of mutations waiting to sync */
  pending: number;
  /** Whether a sync is in progress */
  syncing: boolean;
  /** Timestamp of last successful sync */
  lastSyncAt: string | null;
  /** Result of last sync attempt */
  lastSyncResult: { processed: number; failed: number; conflicts: number; notice?: string } | null;
  /** Active app mode */
  appMode: AppMode;
  /** Re-check server health */
  refresh: () => Promise<void>;
  /** Force-sync pending mutations now */
  sync: () => Promise<void>;
  /** Pull latest data from server (for real-time updates) */
  pull: () => Promise<void>;
}

const ConnectionContext = createContext<ConnectionState | null>(null);

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const appMode = getAppMode();
  const forcedOffline = appMode === 'offline';

  const [online, setOnline] = useState(forcedOffline ? false : navigator.onLine);
  const [serverHealthy, setServerHealthy] = useState<boolean | null>(forcedOffline ? false : null);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [lastSyncResult, setLastSyncResult] = useState<{ processed: number; failed: number; conflicts: number; notice?: string } | null>(null);
  const syncingRef = useRef(false);

  /**
   * Check if the server is reachable.
   * In offline mode this always returns false — the user chose to work offline.
   * In online/mobile mode it probes the health endpoint.
   */
  const refresh = useCallback(async () => {
    if (forcedOffline) {
      setServerHealthy(false);
      setOnline(false);
      setPending(await pendingCount());
      return;
    }

    let healthy: boolean;
    try {
      const res = await fetch(await apiUrl('/health'), { cache: 'no-store', signal: AbortSignal.timeout(5000) });
      healthy = res.ok;
    } catch {
      healthy = false;
    }

    setServerHealthy(healthy);
    setOnline(navigator.onLine && healthy);
    setPending(await pendingCount());

    // Auto-sync: if server just became reachable and we have pending mutations, sync immediately
    if (healthy && !syncingRef.current) {
      const count = await pendingCount();
      if (count > 0) {
        void sync();
      }
    }
  }, [forcedOffline]);

  /**
   * Push all pending local mutations to the server.
   * Safe to call repeatedly — idempotent (each mutation has an idempotencyKey).
   */
  const sync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      const result = await syncNow();
      setLastSyncResult(result);
      if (result.processed > 0) {
        setLastSyncAt(new Date().toISOString());
      }
      setPending(await pendingCount());
      await refresh();
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [refresh]);

  /**
   * Pull: refresh data from server after receiving an SSE event from another device.
   * This dispatches a DOM event so all listening components re-fetch their data.
   */
  const pull = useCallback(async () => {
    // Refresh pending count
    setPending(await pendingCount());
    // Notify all components that data changed (they should re-fetch)
    window.dispatchEvent(new CustomEvent('gihm:entity-changed', {
      detail: { entity: '*', operation: 'PULL', source: 'sse' },
    }));
  }, []);

  useEffect(() => {
    void refresh();

    // ── Online / Offline detection ──
    const onOnline = () => {
      setOnline(true);
      // Connection restored: auto-sync all pending mutations
      void sync();
    };
    const onOffline = () => {
      setOnline(false);
      setServerHealthy(false);
    };

    // ── Visibility: sync when tab becomes active ──
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refresh();
      }
    };

    // ── Manual sync trigger ──
    const onShellSync = () => void sync();

    // ── Outbox changed: refresh pending count ──
    const onOutboxChanged = () => void refresh();

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('gihm:sync-now', onShellSync);
    window.addEventListener('gihm:outbox-changed', onOutboxChanged);
    document.addEventListener('visibilitychange', onVisibility);

    // Health check every 30 seconds — also triggers auto-sync if server is back
    const poll = window.setInterval(() => void refresh(), 30_000);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('gihm:sync-now', onShellSync);
      window.removeEventListener('gihm:outbox-changed', onOutboxChanged);
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(poll);
    };
  }, [refresh, sync]);

  // ── SSE: real-time updates from other devices ──
  useSseEvents((event: SseEvent) => {
    if (event.entity === 'connected') return; // handshake

    // Dispatch to components so they can re-fetch their data
    window.dispatchEvent(
      new CustomEvent('gihm:entity-changed', { detail: event }),
    );

    // If we have pending local mutations, try to sync them now
    void refresh();
  });

  const value = useMemo(
    () => ({ online, serverHealthy, pending, syncing, lastSyncAt, lastSyncResult, appMode, refresh, sync, pull }),
    [online, serverHealthy, pending, syncing, lastSyncAt, lastSyncResult, appMode, refresh, sync, pull],
  );
  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
}

export function useConnection(): ConnectionState {
  const ctx = useContext(ConnectionContext);
  if (!ctx) throw new Error('useConnection must be used within ConnectionProvider');
  return ctx;
}
