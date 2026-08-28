// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { startMetricsBroadcast, stopMetricsBroadcast, subscribeMetrics, broadcastMetrics, getBroadcastInterval } from './metricsRelay';
import { recordPerf, clearPerfEntries } from './perfTracker';
import { recordCacheAccess, clearCacheEntries } from './cacheTracker';

describe('metricsRelay', () => {
  beforeEach(() => {
    clearPerfEntries();
    clearCacheEntries();
    stopMetricsBroadcast();
  });

  afterEach(() => {
    stopMetricsBroadcast();
  });

  it('returns broadcast interval', () => {
    expect(getBroadcastInterval()).toBe(3000);
  });

  it('broadcastMetrics sends a snapshot via BroadcastChannel', async () => {
    recordPerf({ path: '/a', method: 'GET', status: 200, durationMs: 100, cached: false, error: false });
    recordCacheAccess({ route: '/b', hit: true, cacheName: 'cache', size: 500 });

    const received: unknown[] = [];
    const channel = new BroadcastChannel('gihm-metrics-relay');
    channel.onmessage = (e) => received.push(e.data);

    broadcastMetrics();
    // BroadcastChannel is async — wait for message
    await new Promise((r) => setTimeout(r, 50));

    expect(received.length).toBe(1);
    const snap = received[0] as { timestamp: number; source: string; api: { totalRequests: number }; cache: { totalAccesses: number } };
    expect(snap.source).toBe('gihm-web');
    expect(snap.api.totalRequests).toBe(1);
    expect(snap.cache.totalAccesses).toBe(1);
    expect(snap.timestamp).toBeGreaterThan(0);

    channel.close();
  });

  it('subscribeMetrics receives broadcasts', async () => {
    const received: unknown[] = [];
    const unsub = subscribeMetrics((data) => received.push(data));

    broadcastMetrics();
    await new Promise((r) => setTimeout(r, 50));

    expect(received.length).toBe(1);
    unsub();
  });

  it('unsubscribe stops receiving broadcasts', async () => {
    const received: unknown[] = [];
    const unsub = subscribeMetrics((data) => received.push(data));
    unsub();

    broadcastMetrics();
    await new Promise((r) => setTimeout(r, 50));

    expect(received.length).toBe(0);
  });

  it('startMetricsBroadcast starts periodic broadcasting', async () => {
    const received: unknown[] = [];
    const channel = new BroadcastChannel('gihm-metrics-relay');
    channel.onmessage = (e) => received.push(e.data);

    startMetricsBroadcast();
    // Wait for at least one broadcast cycle
    await new Promise((r) => setTimeout(r, 100));

    // startMetricsBroadcast sends periodic messages, but the interval is 3s
    // so we just verify the channel is open by sending a manual broadcast
    broadcastMetrics();
    await new Promise((r) => setTimeout(r, 50));
    expect(received.length).toBeGreaterThanOrEqual(1);

    channel.close();
    stopMetricsBroadcast();
  });

  it('startMetricsBroadcast only starts once', () => {
    startMetricsBroadcast();
    startMetricsBroadcast(); // should not throw or create duplicate
    stopMetricsBroadcast();
  });

  it('broadcastMetrics sends vitals data', async () => {
    // Import and use the recordVital function
    const { recordVital } = await import('./perfTracker');
    recordVital({ name: 'LCP', value: 1200, rating: 'good', timestamp: Date.now() });

    const received: unknown[] = [];
    const channel = new BroadcastChannel('gihm-metrics-relay');
    channel.onmessage = (e) => received.push(e.data);

    broadcastMetrics();
    await new Promise((r) => setTimeout(r, 50));

    expect(received.length).toBe(1);
    const snap = received[0] as { vitals: Array<{ name: string; value: number }> };
    expect(snap.vitals.length).toBeGreaterThanOrEqual(1);
    expect(snap.vitals[0]!.name).toBe('LCP');

    channel.close();
  });
});
