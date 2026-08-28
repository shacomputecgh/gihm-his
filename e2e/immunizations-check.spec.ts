import { expect, test } from '@playwright/test';

/**
 * Behavioral check for the immunization module (spec §22, Ghana EPI). The
 * pages-smoke spec only asserts the heading; this verifies the clinical
 * workflow actually functions:
 *
 *   - the summary tiles (Overdue / Due within 30 days / Recorded doses) render
 *   - the seeded due worklist shows at least one child
 *   - the row's "Record dose" opens the form pre-filled with the exact
 *     child/vaccine/dose they are due for, and saving completes the dose
 *     (success toast) — deterministic, because the child is due *for* that
 *     dose, so no duplicate-dose conflict can fire.
 */
test('immunization due worklist renders and a pre-filled dose records', async ({ page }) => {
  await page.goto('/app/immunizations');

  // Summary tiles (`.first()` — the bucket Segmented reuses the word Overdue).
  await expect(page.getByText('Overdue', { exact: true }).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Due within 30 days', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Recorded doses', { exact: true }).first()).toBeVisible();

  // The seeded due worklist renders at least one child: the PageHeader action
  // is the first "Record dose" button in the DOM; a due row adds its own.
  const recordButtons = page.getByRole('button', { name: 'Record dose' });
  await expect(recordButtons.nth(1)).toBeVisible({ timeout: 15_000 });

  // Pre-filled record flow — the row button prefills patient, vaccine and dose.
  await recordButtons.nth(1).click();
  await page.getByRole('button', { name: 'Save dose' }).click();

  // Success toast (auto-dismisses after 5s): "<vaccine> recorded — next dose …".
  const toast = page.locator('div.fade-in.pointer-events-auto', { hasText: /recorded/i });
  await expect(toast).toBeVisible({ timeout: 15_000 });
});
