/**
 * Service Worker event interceptor.
 *
 * This module registers a message listener on the main thread that
 * receives cache events from the service worker. The service worker
 * posts messages about cache hits, misses, and precache manifest
 * events via `postMessage`.
 *
 * The interceptor feeds this data into the cacheTracker and perfTracker
 * for display on the PerformanceMonitor dashboard.
 *
 * Usage:
 *   import './swEventInterceptor'; // side-effect import at app startup
 *
 * The service worker needs to be configured to post messages. Since
 * vite-plugin-pwa generates the SW automatically, we use a BroadcastChannel
 * in the SW instead. This module listens on that channel.
 */

import { recordCacheAccess } from './cacheTracker';
import { recordPerf } from './perfTracker';

interface SWCacheEvent {
  type: 'cache-hit' | 'cache-miss' | 'precache-install' | 'precache-activate' | 'navigation';
  url: string;
  cacheName?: string;
  durationMs?: number;
  size?: number;
  timestamp: number;
}

const SW_CHANNEL = 'gihm-sw-events';


let interceptorInitialized = false;

/**
 * Initialize the SW event interceptor.
 * Call once at app startup.
 */
export function initSWEventInterceptor(): void {
  if (interceptorInitialized) return;
  interceptorInitialized = true;

  // Listen for messages from the service worker via BroadcastChannel
  if ('BroadcastChannel' in window) {
    try {
      const channel = new BroadcastChannel(SW_CHANNEL);
      channel.onmessage = (event: MessageEvent<SWCacheEvent>) => {
        handleSWEvent(event.data);
      };
    } catch {
      // BroadcastChannel not supported or blocked
    }
  }

  // Also listen for postMessage from the service worker directly
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event: MessageEvent<SWCacheEvent>) => {
      if (event.data?.type?.startsWith('cache-') || event.data?.type?.startsWith('precache-') || event.data?.type === 'navigation') {
        handleSWEvent(event.data);
      }
    });
  }

  // Listen for SW lifecycle events
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(() => {
      // SW is active — we can start communicating
      postMessageToSW({ type: 'subscribe-events' });
    }).catch(() => {
      // SW not available (dev mode or test environment)
    });
  }
}

function handleSWEvent(event: SWCacheEvent): void {
  const isHit = event.type === 'cache-hit';
  const isError = event.type === 'cache-miss';

  // Record in cache tracker
  recordCacheAccess({
    route: event.url,
    hit: isHit,
    cacheName: event.cacheName || (isHit ? 'service-worker' : 'network'),
    size: event.size || 0,
  });

  // Also record in perf tracker for unified view
  if (event.durationMs !== undefined) {
    recordPerf({
      path: event.url,
      method: 'GET',
      status: isHit ? 200 : isError ? 404 : 200,
      durationMs: event.durationMs,
      cached: isHit,
      error: isError,
    });
  }
}

/**
 * Send a message to the service worker.
 */
function postMessageToSW(message: unknown): void {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
  }
}

/**
 * Check if the service worker is registered and active.
 */
export async function isSWActive(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    return !!reg?.active;
  } catch {
    return false;
  }
}

/**
 * Get SW registration info.
 */
export async function getSWInfo(): Promise<{ active: boolean; scope: string; updateViaCache: string } | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return null;
    return {
      active: !!reg.active,
      scope: reg.scope,
      updateViaCache: reg.updateViaCache,
    };
  } catch {
    return null;
  }
}

/**
 * Force an update of the service worker.
 */
export async function forceSWUpdate(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return false;
    await reg.update();
    return true;
  } catch {
    return false;
  }
}
