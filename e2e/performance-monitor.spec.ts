/**
 * E2E test for the PerformanceMonitor page.
 *
 * Verifies that the page loads, shows the empty state initially,
 * then after navigating around the app the performance data populates
 * with API metrics and Web Vitals.
 *
 * Uses the hospital auth session (depends on the setup project).
 */
import { test, expect } from '@playwright/test';

test.describe('PerformanceMonitor', () => {
  test('shows empty state on first load', async ({ page }) => {
    await page.goto('/app/performance');
    await page.waitForTimeout(1_000);
    await expect(page.getByText('Performance Monitor')).toBeVisible();
    await expect(page.getByText(/No API requests recorded yet/)).toBeVisible();
  });

  test('populates data after navigating the app', async ({ page }) => {
    // First navigate around to generate some API traffic
    await page.goto('/app');
    await page.waitForTimeout(2_000);

    await page.goto('/app/patients');
    await page.waitForTimeout(2_000);

    await page.goto('/app/pharmacy');
    await page.waitForTimeout(2_000);

    // Now visit the performance monitor
    await page.goto('/app/performance');
    await page.waitForTimeout(2_000);

    // Should have collected data now
    await expect(page.getByText('Performance Monitor')).toBeVisible();
    await expect(page.getByText('Total requests')).toBeVisible();
    await expect(page.getByText('Avg response')).toBeVisible();
    await expect(page.getByText('P95 response')).toBeVisible();
  });

  test('can clear data', async ({ page }) => {
    // Generate some traffic
    await page.goto('/app');
    await page.waitForTimeout(2_000);

    await page.goto('/app/performance');
    await page.waitForTimeout(2_000);

    // Verify data exists
    await expect(page.getByText('Total requests')).toBeVisible();

    // Clear data
    await page.getByRole('button', { name: /Clear data/ }).click();
    await page.waitForTimeout(500);

    // Should show empty state
    await expect(page.getByText(/No API requests recorded yet/)).toBeVisible();
  });

  test('shows status codes and endpoints after traffic', async ({ page }) => {
    await page.goto('/app');
    await page.waitForTimeout(2_000);

    await page.goto('/app/patients');
    await page.waitForTimeout(2_000);

    await page.goto('/app/performance');
    await page.waitForTimeout(2_000);

    // Should show status codes and endpoints
    await expect(page.getByText('Status codes')).toBeVisible();
    await expect(page.getByText('Top endpoints')).toBeVisible();
  });
});
