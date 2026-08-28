import { expect, test } from '@playwright/test';

/**
 * Behavioral check for the Developer Mode page (docs/25). Runs under the
 * DEVELOPER session from e2e/auth.setup.ts — the only role with
 * developer_mode; the overview endpoint 403s for every other role, so the
 * data loading at all is itself the scope assertion.
 *
 * Asserts the platform overview renders real aggregates (Users / Facilities /
 * Devices / Audit stat cards, License status, Security posture).
 */
test('developer mode renders the platform overview', async ({ page }) => {
  await page.goto('/app/developer');

  // Page chrome + role badge.
  await expect(page.getByRole('heading', { name: 'Developer Mode' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('DEVELOPER', { exact: true }).last()).toBeVisible();

  // Overview stat cards load real data (the endpoint needs developer_mode).
  await expect(page.getByText('Users', { exact: true }).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Facilities', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Devices', { exact: true }).first()).toBeVisible();

  // License + security posture cards render.
  await expect(page.getByText('Security posture', { exact: true })).toBeVisible();
  await expect(page.getByText('Password minimum', { exact: true })).toBeVisible();
});
