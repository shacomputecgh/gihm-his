/**
 * CI-integrated load test using Playwright.
 *
 * Fires parallel requests against the API through the Vite proxy
 * and asserts that P95 response time stays under 500ms and error
 * rate stays under 10%.
 *
 * This runs as part of the Playwright suite, leveraging the same
 * auth setup and dev server boot.
 */
import { test, expect } from '@playwright/test';

const CONCURRENT_REQUESTS = 20;
const ENDPOINTS = [
  '/api/v1/geography/regions',
  '/api/v1/geography/districts?regionId=r1',
  '/api/v1/facilities?pageSize=5',
  '/api/v1/health',
];

interface RequestResult {
  status: number;
  durationMs: number;
  error: boolean;
}

async function fireRequest(
  page: import('@playwright/test').Page,
  path: string,
): Promise<RequestResult> {
  const start = Date.now();
  try {
    const res = await page.request.get(path, { timeout: 10_000 });
    const durationMs = Date.now() - start;
    return {
      status: res.status(),
      durationMs,
      error: !res.ok(),
    };
  } catch {
    return { status: 0, durationMs: Date.now() - start, error: true };
  }
}

test.describe('API load test', () => {
  test('P95 latency stays under 500ms under concurrent load', async ({ page }) => {
    // First do a warm-up request
    await page.request.get('/api/v1/health', { timeout: 10_000 }).catch(() => {});

    const results: RequestResult[] = [];

    // Fire concurrent requests across endpoints
    const batches = Math.ceil(CONCURRENT_REQUESTS / ENDPOINTS.length);
    for (let batch = 0; batch < batches; batch++) {
      const promises = ENDPOINTS.map((ep) => fireRequest(page, ep));
      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
    }

    // Analyze results
    const durations = results.map((r) => r.durationMs).sort((a, b) => a - b);
    const errors = results.filter((r) => r.error);
    const errorRate = (errors.length / results.length) * 100;
    const p95Index = Math.floor(durations.length * 0.95);
    const p95 = durations[p95Index] ?? durations[durations.length - 1] ?? 0;
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;

    console.log(`\n📊 Load Test Results:`);
    console.log(`   Requests:   ${results.length}`);
    console.log(`   Avg:        ${avg.toFixed(0)}ms`);
    console.log(`   P95:        ${p95}ms`);
    console.log(`   Max:        ${durations[durations.length - 1]}ms`);
    console.log(`   Errors:     ${errors.length} (${errorRate.toFixed(1)}%)`);

    // Assertions
    expect(p95, `P95 latency (${p95}ms) should be under 500ms`).toBeLessThan(500);
    expect(errorRate, `Error rate (${errorRate}%) should be under 10%`).toBeLessThan(10);
    expect(results.length, 'Should have fired all requests').toBeGreaterThanOrEqual(CONCURRENT_REQUESTS);
  });

  test('API responds to concurrent health checks within 200ms', async ({ page }) => {
    const promises = Array.from({ length: 10 }, () => fireRequest(page, '/api/v1/health'));
    const results = await Promise.all(promises);

    const avgDuration = results.reduce((a, b) => a + b.durationMs, 0) / results.length;
    const errors = results.filter((r) => r.error);

    console.log(`\n📊 Health Check Load:`);
    console.log(`   Requests:   ${results.length}`);
    console.log(`   Avg:        ${avgDuration.toFixed(0)}ms`);
    console.log(`   Errors:     ${errors.length}`);

    expect(avgDuration, 'Health check avg should be under 200ms').toBeLessThan(200);
    expect(errors.length, 'No errors on health check').toBe(0);
  });

  test('API handles burst of patient search queries', async ({ page }) => {
    const queries = ['Kwame', 'Ama', 'Kofi', 'Akosua', 'Yaw'];
    const promises = queries.map((q) =>
      fireRequest(page, `/api/v1/patients?q=${q}&pageSize=5`),
    );
    const results = await Promise.all(promises);

    const durations = results.map((r) => r.durationMs);
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;

    console.log(`\n📊 Patient Search Burst:`);
    console.log(`   Requests:   ${results.length}`);
    console.log(`   Avg:        ${avg.toFixed(0)}ms`);

    expect(avg, 'Patient search avg should be under 500ms').toBeLessThan(500);
  });
});
