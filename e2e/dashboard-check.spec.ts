import { expect, test } from '@playwright/test';

/**
 * Behavioral check for the Dashboard home page: the live stats endpoint drives
 * the six stat cards, the 7-day activity chart card renders, quick actions
 * link to the main modules, and the scope/system cards describe the session.
 * Read-only — safe to repeat.
 */
test('the dashboard renders live stats, activity and quick actions', async ({ page }) => {
  await page.goto('/app');

  // Stat cards (scoped: the nav bar also has an 'Admissions' link).
  await expect(page.getByText('Patients today', { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('OPD encounters', { exact: true })).toBeVisible();
  await expect(page.getByText('Queue waiting', { exact: true })).toBeVisible();
  await expect(page.locator('div.grid.xl\\:grid-cols-6').getByText('Admissions', { exact: true })).toBeVisible();
  await expect(page.getByText('Lab results pending', { exact: true })).toBeVisible();
  await expect(page.getByText('Revenue today', { exact: true })).toBeVisible();

  // The 7-day activity chart and the quick-action links render.
  await expect(page.getByRole('heading', { name: /7-day patient activity/i })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Register patient', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Find patient', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Book appointment', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Manage queue', exact: true })).toBeVisible();
  await expect(page.getByText('Appointments today', { exact: true })).toBeVisible();

  // National master data, data scope and system status cards. The data scope
  // card names the caller's own facility (its real name, not a hardcoded one).
  await expect(page.getByRole('heading', { name: /National master data/i })).toBeVisible();
  await expect(page.getByText('districts', { exact: true })).toBeVisible();
  await expect(page.getByText(/Data scope/)).toBeVisible();
  await expect(page.getByText('Korle-Bu Teaching Hospital (DEMO)').first()).toBeVisible();
  await expect(page.getByText('API operational', { exact: true })).toBeVisible();
});
