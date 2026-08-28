/**
 * Visual regression tests — take baseline screenshots of key pages
 * and compare on subsequent runs to catch unintended UI changes.
 *
 * These tests use Playwright's built-in `toHaveScreenshot()` which
 * compares pixel-by-pixel against stored baselines in e2e/__screenshots__/.
 *
 * To update baselines: npx playwright test --update-snapshots
 */
import { test, expect } from '@playwright/test';

// Ensure the hospital auth setup has run first (depends on setup project)
test.describe('Visual regression — key pages', () => {
  test('dashboard renders correctly', async ({ page }) => {
    await page.goto('/app');
    // Wait for stat cards to render
    await page.waitForSelector('text=Loading', { state: 'hidden', timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(1_000);
    await expect(page).toHaveScreenshot('dashboard.png', {
      maxDiffPixelRatio: 0.01,
      fullPage: true,
    });
  });

  test('surveillance page renders correctly', async ({ page }) => {
    await page.goto('/app/surveillance');
    await page.waitForSelector('text=Loading', { state: 'hidden', timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(1_000);
    await expect(page).toHaveScreenshot('surveillance.png', {
      maxDiffPixelRatio: 0.01,
      fullPage: true,
    });
  });

  test('patients page renders correctly', async ({ page }) => {
    await page.goto('/app/patients');
    await page.waitForSelector('text=Loading', { state: 'hidden', timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(1_000);
    await expect(page).toHaveScreenshot('patients.png', {
      maxDiffPixelRatio: 0.01,
      fullPage: true,
    });
  });

  test('billing page renders correctly', async ({ page }) => {
    await page.goto('/app/billing');
    await page.waitForTimeout(1_000);
    await expect(page).toHaveScreenshot('billing.png', {
      maxDiffPixelRatio: 0.01,
      fullPage: true,
    });
  });

  test('pharmacy page renders correctly', async ({ page }) => {
    await page.goto('/app/pharmacy');
    await page.waitForSelector('text=Loading', { state: 'hidden', timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(1_000);
    await expect(page).toHaveScreenshot('pharmacy.png', {
      maxDiffPixelRatio: 0.01,
      fullPage: true,
    });
  });

  test('lab page renders correctly', async ({ page }) => {
    await page.goto('/app/lab');
    await page.waitForSelector('text=Loading', { state: 'hidden', timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(1_000);
    await expect(page).toHaveScreenshot('lab.png', {
      maxDiffPixelRatio: 0.01,
      fullPage: true,
    });
  });
});

test.describe('Visual regression — portal pages', () => {
  test('public homepage renders correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1_000);
    await expect(page).toHaveScreenshot('portal-home.png', {
      maxDiffPixelRatio: 0.01,
      fullPage: true,
    });
  });

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(1_000);
    await expect(page).toHaveScreenshot('login.png', {
      maxDiffPixelRatio: 0.01,
      fullPage: true,
    });
  });
});
