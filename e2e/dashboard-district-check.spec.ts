import { expect, test } from '@playwright/test';

/**
 * Behavioral check for the Dashboard home page under a DISTRICT-scope session
 * (the Kumasi Metropolitan District Director, e2e/auth.setup.ts). The Data
 * scope card must name the caller's own district — not a bare scope label or
 * another facility's name (docs/22 Phase 5). Read-only, safe to repeat.
 */
test('dashboard names the district director’s own scope', async ({ page }) => {
  await page.goto('/app');

  // Stat cards render (scoped to the district's data).
  await expect(page.getByText('Patients today', { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('OPD encounters', { exact: true })).toBeVisible();

  // The Data scope card names the caller's district.
  const scopeCard = page.getByText(/You are viewing data scoped to DISTRICT level/);
  await expect(scopeCard).toBeVisible({ timeout: 15_000 });
  await expect(scopeCard).toContainText('Kumasi Metropolitan');

  // The national master-data box still renders its counts.
  await expect(page.getByRole('heading', { name: /National master data/i })).toBeVisible();
  await expect(page.getByText('districts', { exact: true })).toBeVisible();
});
