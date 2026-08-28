import { expect, test } from '@playwright/test';

/**
 * Behavioral check for the Disease Surveillance module: drive the full case
 * lifecycle through the UI — report a case (unique disease name per run, so
 * repeat runs never collide), open its detail drawer, record a contact-tracing
 * follow-up, then move the case investigated → closed.
 *
 * The pages-smoke spec only asserts the heading; this verifies the register,
 * the detail drawer workflow and the status transitions actually function.
 */
test('a reported surveillance case can be followed up, investigated and closed', async ({ page }) => {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const disease = `E2E Syndrome ${stamp}`;

  await page.goto('/app/surveillance');

  // Summary tiles render and the seeded register shows the cholera cluster.
  await expect(page.getByText('Open cases', { exact: true })).toBeVisible({ timeout: 15_000 });
  // Scoped to the stat-card grid — 'Confirmed' also titles case-type badges.
  await expect(page.locator('div.grid.gap-4').getByText('Confirmed', { exact: true })).toBeVisible();
  await expect(page.getByText('Follow-up rate', { exact: true })).toBeVisible();
  await expect(page.locator('tbody tr', { hasText: 'Cholera' }).first()).toBeVisible({ timeout: 15_000 });

  // Report a new case (unique disease name → no MPI/duplicate concerns).
  await page.getByLabel('Disease').fill(disease);
  await page.getByRole('button', { name: 'Report case' }).click();
  const toast = page.locator('div.fade-in.pointer-events-auto', { hasText: /Case reported/i });
  await expect(toast).toBeVisible({ timeout: 15_000 });

  // The reloaded register now shows the new case — open its detail drawer.
  const row = page.locator('tbody tr', { hasText: disease });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await row.click();

  const drawer = page.locator('div.fixed.inset-0.z-40');
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole('heading', { name: disease })).toBeVisible();
  await expect(drawer.getByText('Community report')).toBeVisible();
  await expect(drawer.getByText('Open', { exact: true }).first()).toBeVisible();

  // Record a contact-tracing follow-up on the open case (the report form's
  // Notes field is also on the page, so scope the fields to the drawer).
  await drawer.getByLabel('Temp (°C)').fill('38.1');
  await drawer.getByLabel('Contacts traced').fill('3');
  await drawer.getByLabel('Notes').fill('Household visited; 3 contacts listed for monitoring.');
  await page.getByRole('button', { name: 'Record', exact: true }).click();
  await expect(page.locator('div.fade-in.pointer-events-auto', { hasText: /Follow-up recorded/i })).toBeVisible({ timeout: 15_000 });
  await expect(drawer.getByText(/3 contacts/i).first()).toBeVisible();

  // Investigate the case (OPEN → INVESTIGATED), then close it with the
  // default RECOVERED outcome.
  await page.getByRole('button', { name: 'Mark investigated' }).click();
  await expect(page.locator('div.fade-in.pointer-events-auto', { hasText: /Case moved to Investigated/i })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: 'Reopen' })).toBeVisible();

  await page.getByRole('button', { name: 'Close case' }).click();
  await expect(page.locator('div.fade-in.pointer-events-auto', { hasText: /Case closed/i })).toBeVisible({ timeout: 15_000 });
  // A closed case can only be reopened — proves the transition landed.
  await expect(page.getByRole('button', { name: 'Reopen case' })).toBeVisible();
});
