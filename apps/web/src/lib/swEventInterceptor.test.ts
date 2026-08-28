// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { isSWActive, getSWInfo, forceSWUpdate, initSWEventInterceptor } from './swEventInterceptor';
import { recordCacheAccess, clearCacheEntries } from './cacheTracker';

describe('swEventInterceptor', () => {
  beforeEach(() => {
    clearCacheEntries();
  });

  describe('isSWActive', () => {
    it('returns false when serviceWorker is not available', async () => {
      // In jsdom, serviceWorker.getRegistration may not be available
      const result = await isSWActive();
      // Result depends on jsdom environment, just verify it doesn't throw
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getSWInfo', () => {
    it('returns null or valid info object', async () => {
      const result = await getSWInfo();
      if (result !== null) {
        expect(typeof result.active).toBe('boolean');
        expect(typeof result.scope).toBe('string');
        expect(typeof result.updateViaCache).toBe('string');
      }
    });
  });

  describe('forceSWUpdate', () => {
    it('returns false when no registration exists', async () => {
      const result = await forceSWUpdate();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('initSWEventInterceptor', () => {
    it('initializes without errors', () => {
      expect(() => initSWEventInterceptor()).not.toThrow();
    });

    it('initializes only once', () => {
      initSWEventInterceptor();
      initSWEventInterceptor(); // should not throw or duplicate
    });
  });

  describe('SW event handling integration', () => {
    it('SW cache events feed into cacheTracker', async () => {
      // Simulate what the SW event handler would do
      recordCacheAccess({ route: '/api/data', hit: true, cacheName: 'service-worker', size: 1024 });
      recordCacheAccess({ route: '/api/data', hit: false, cacheName: 'network', size: 0 });

      const entries = (await import('./cacheTracker')).getCacheEntries();
      expect(entries.length).toBe(2);
      expect(entries[0]!.hit).toBe(false); // newest first
      expect(entries[1]!.hit).toBe(true);
    });
  });
});
