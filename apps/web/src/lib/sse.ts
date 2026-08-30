/**
 * useSseEvents — subscribes to the API's Server-Sent Events stream
 * for real-time entity updates. Every connected client (desktop, mobile,
 * other web sessions) sees changes within ~1 second of the write.
 *
 * Usage:
 *   useSseEvents((event) => {
 *     if (event.entity === 'patient') refreshPatients();
 *     if (event.entity === 'encounter') refreshEncounters();
 *   });
 */
import { useEffect, useRef, useCallback } from 'react';
import { apiUrl } from './api';

/** Read the current session token from localStorage (module-level var in api.ts). */
function getStoredToken(): string | null {
  return localStorage.getItem('gihm_token');
}

export interface SseEvent {
  entity: string;
  operation: string;
  entityId: string;
  facilityId: string | null;
  payload?: Record<string, unknown>;
  ts: string;
}

type EventHandler = (event: SseEvent) => void;

const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30_000;

export function useSseEvents(handler: EventHandler, deps: unknown[] = []) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const connect = useCallback(() => {
    let es: EventSource | null = null;
    let reconnectMs = RECONNECT_BASE_MS;
    let unmounted = false;

    async function start() {
      if (unmounted) return;
      const token = await getStoredToken();
      if (!token || unmounted) return;

      // EventSource doesn't support custom headers, so pass token as query param
      const url = await apiUrl('/sse/events');
      const sep = url.includes('?') ? '&' : '?';
      es = new EventSource(`${url}${sep}token=${encodeURIComponent(token)}`);

      es.onopen = () => {
        reconnectMs = RECONNECT_BASE_MS; // reset backoff on successful connect
      };

      // The "message" event (default) — used for typed entity events
      // SSE emits named events, so we listen to all common entity types
      const entityTypes = [
        'patient', 'encounter', 'labOrder', 'prescription',
        'appointment', 'admission', 'invoice', 'immunization',
        'connected',
      ];

      for (const entity of entityTypes) {
        es.addEventListener(entity, ((e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data) as SseEvent;
            handlerRef.current(data);
          } catch { /* ignore malformed */ }
        }) as EventListener);
      }

      // Fallback: catch-all "message" events
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data) as SseEvent;
          handlerRef.current(data);
        } catch { /* ignore */ }
      };

      es.onerror = () => {
        es?.close();
        if (!unmounted) {
          setTimeout(() => {
            reconnectMs = Math.min(reconnectMs * 2, RECONNECT_MAX_MS);
            start();
          }, reconnectMs);
        }
      };
    }

    start();

    return () => {
      unmounted = true;
      es?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    return connect();
  }, [connect]);
}
