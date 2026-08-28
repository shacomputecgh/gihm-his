/**
 * Real-time metrics relay using BroadcastChannel.
 *
 * Broadcasts performance data from the main app to any monitoring
 * dashboard tab (or external consumer). Multiple tabs share metrics
 * via the same channel, creating a real-time view without server-side
 * WebSocket infrastructure.
 *
 * Usage:
 *   // In the main app (producer):
 *   import { broadcastMetrics } from './metricsRelay';
 *   broadcastMetrics(); // sends current perf + cache + vitals data
 *
 *   // In the monitoring dashboard (consumer):
 *   import { subscribeMetrics } from './metricsRelay';
 *   const unsub = subscribeMetrics((data) => { updateUI(data); });
 *   // unsub() to stop listening
 */

import { getPerfSummary, getVitals, type PerfSummary, type VitalEntry } from './perfTracker';
import { getCacheSummary, type CacheSummary } from './cacheTracker';

export interface MetricsSnapshot {
  timestamp: number;
  source: string;
  api: PerfSummary;
  cache: CacheSummary;
  vitals: VitalEntry[];
  tab: string;
}

const CHANNEL_NAME = 'gihm-metrics-relay';
const BROADCAST_INTERVAL_MS = 3_000;

let broadcastTimer: ReturnType<typeof setInterval> | null = null;
let listeners: Array<(data: MetricsSnapshot) => void> = [];

/**
 * Start broadcasting metrics every BROADCAST_INTERVAL_MS.
 */
export function startMetricsBroadcast(): void {
  if (broadcastTimer) return;

  const channel = new BroadcastChannel(CHANNEL_NAME);

  broadcastTimer = setInterval(() => {
    const snapshot: MetricsSnapshot = {
      timestamp: Date.now(),
      source: 'gihm-web',
      api: getPerfSummary(),
      cache: getCacheSummary(),
      vitals: getVitals(),
      tab: document.title,
    };
    channel.postMessage(snapshot);
  }, BROADCAST_INTERVAL_MS);

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    if (broadcastTimer) clearInterval(broadcastTimer);
    channel.close();
  });
}

/**
 * Stop broadcasting metrics.
 */
export function stopMetricsBroadcast(): void {
  if (broadcastTimer) {
    clearInterval(broadcastTimer);
    broadcastTimer = null;
  }
}

/**
 * Send a single metrics snapshot immediately.
 */
export function broadcastMetrics(): void {
  const channel = new BroadcastChannel(CHANNEL_NAME);
  const snapshot: MetricsSnapshot = {
    timestamp: Date.now(),
    source: 'gihm-web',
    api: getPerfSummary(),
    cache: getCacheSummary(),
    vitals: getVitals(),
    tab: document.title,
  };
  channel.postMessage(snapshot);
  channel.close();
}

/**
 * Subscribe to metrics broadcasts from any tab.
 * Returns an unsubscribe function.
 */
export function subscribeMetrics(callback: (data: MetricsSnapshot) => void): () => void {
  const channel = new BroadcastChannel(CHANNEL_NAME);
  const handler = (event: MessageEvent<MetricsSnapshot>) => {
    callback(event.data);
  };
  channel.onmessage = handler;
  listeners.push(callback);

  return () => {
    channel.close();
    listeners = listeners.filter((l) => l !== callback);
  };
}

/**
 * Get the broadcast interval in ms (for display purposes).
 */
export function getBroadcastInterval(): number {
  return BROADCAST_INTERVAL_MS;
}
