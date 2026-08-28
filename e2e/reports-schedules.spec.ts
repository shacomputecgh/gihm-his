import { expect, test } from '@playwright/test';

/**
 * Behavioral check for the scheduled-reports surface (docs/14 §5, spec §149):
 * create a subscription through the form, see it appear in the schedules
 * table with its cadence + recipients, pause it (toggle round-trip), and
 * delete it (confirm dialog). Uses a unique name per run and cleans up after
 * itself, so repeated runs never accumulate schedules.
 *
 * The shared session (e2e/auth.setup.ts) is a Korle-Bu hospital admin with
 * manage_scheduled_reports; validation requires a name, a valid recipient
 * email, and defaults (monthly · 08:00 · day 1) cover the rest.
 */
test('scheduled reports CRUD — create, pause, delete', async ({ page }) => {
  const name = `E2E Monthly ${Date.now()}`;

  await page.goto('/app/reports');

  // The create form sits inside the scheduled-reports card, which renders
  // once the summary has loaded — wait for it rather than the page heading.
  const nameInput = page.getByPlaceholder('Monthly OPD summary');
  await expect(nameInput).toBeVisible({ timeout: 15_000 });

  await nameInput.fill(name);
  await page.getByPlaceholder('ops@ghs.gov.gh, medsup@facility.gh').fill('ops@ghs.gov.gh');
  await page.getByRole('button', { name: 'Create schedule' }).click();

  // The new row appears with the default cadence and the recipient list.
  const row = page.locator('tr', { hasText: name });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await expect(row).toContainText('Monthly');
  await expect(row).toContainText('ops@ghs.gov.gh');

  // Toggle to pause — the row flips to a Resume button and a Paused badge.
  await row.getByRole('button', { name: 'Pause' }).click();
  await expect(row.getByRole('button', { name: 'Resume' })).toBeVisible({ timeout: 15_000 });
  await expect(row.getByText('Paused')).toBeVisible();

  // Delete (the trash button is icon-only — last button in the row) and
  // confirm the dialog. The row must leave the table.
  page.on('dialog', (d) => d.accept());
  await row.getByRole('button').last().click();
  await expect(row).toHaveCount(0, { timeout: 15_000 });
});
