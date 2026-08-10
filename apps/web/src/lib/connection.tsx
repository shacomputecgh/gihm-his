import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { pendingCount, syncNow } from './offline';

interface ConnectionState {
  online: boolean; // network reachability (navigator.onLine + health probe)
  serverHealthy: boolean | null;
  pending: number;
  syncing: boolean;
  lastSyncAt: string | null;
  lastSyncResult: { processed: number; failed: number } | null;
  refresh: () => Promise<void>;
  sync: () => Promise<void>;
}

const ConnectionContext = createContext<ConnectionState | null>(null);

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(navigator.onLine);
  const [serverHealthy, setServerHealthy] = useState<boolean | null>(null);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [lastSyncResult, setLastSyncResult] = useState<{ processed: number; failed: number } | null>(null);
  const syncingRef = useRef(false);

  const refresh = useCallback(async () => {
    let healthy: boolean;
    try {
      const res = await fetch('/api/v1/health', { cache: 'no-store' });
      healthy = res.ok;
    } catch {
      healthy = false;
    }
    setServerHealthy(healthy);
    setOnline(navigator.onLine && healthy);
    setPending(await pendingCount());
  }, []);

  const sync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      const result = await syncNow();
      setLastSyncResult(result);
      setLastSyncAt(new Date().toISOString());
      setPending(await pendingCount());
      await refresh();
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [refresh]);

  useEffect(() => {
    void refresh();
    const onOnline = () => {
      setOnline(true);
      void sync();
    };
    const onOffline = () => setOnline(false);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void sync();
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    document.addEventListener('visibilitychange', onVisibility);
    const poll = window.setInterval(() => void refresh(), 30_000);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(poll);
    };
  }, [refresh, sync]);

  const value = useMemo(
    () => ({ online, serverHealthy, pending, syncing, lastSyncAt, lastSyncResult, refresh, sync }),
    [online, serverHealthy, pending, syncing, lastSyncAt, lastSyncResult, refresh, sync],
  );
  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
}

export function useConnection(): ConnectionState {
  const ctx = useContext(ConnectionContext);
  if (!ctx) throw new Error('useConnection must be used within ConnectionProvider');
  return ctx;
}
