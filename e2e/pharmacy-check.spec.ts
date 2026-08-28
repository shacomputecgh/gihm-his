import { expect, test } from '@playwright/test';

/**
 * Behavioral check for the Pharmacy page: the "To dispense" worklist renders
 * the seeded active prescriptions, and dispensing one completes it — the
 * success toast names the medicine and the row leaves the worklist (button
 * count drops, "Done" replaces it), with the DISPENSED status visible under
 * "All prescriptions".
 *
 * Consumes one seeded ACTIVE prescription per run — re-seed the demo DB to
 * restore the worklist (same as the lab/immunization checks).
 */
test('dispensing an active prescription completes it on the worklist', async ({ page }) => {
  await page.goto('/app/pharmacy');

  // The seeded worklist renders at least one prescription awaiting dispensing.
  const dispenseButtons = page.getByRole('button', { name: 'Dispense', exact: true });
  await expect(dispenseButtons.first()).toBeVisible({ timeout: 15_000 });
  const count = await dispenseButtons.count();
  expect(count).toBeGreaterThan(0);

  // Remember the first row's medicine so the toast copy can be asserted.
  const medicine = await page.locator('tbody tr').first().locator('td').nth(1).locator('p').first().textContent();
  expect(medicine).toBeTruthy();

  await dispenseButtons.first().click();

  // Success toast names the dispensed medicine.
  const toast = page.locator('div.fade-in.pointer-events-auto', { hasText: /Dispensed/i });
  await expect(toast).toBeVisible({ timeout: 15_000 });
  await expect(toast).toContainText(medicine!);

  // The worklist reloads — the dispensed row leaves the "To dispense" list.
  await expect(page.getByRole('button', { name: 'Dispense', exact: true })).toHaveCount(count - 1, { timeout: 15_000 });

  // Under "All prescriptions" the completed row shows its DISPENSED status.
  await page.getByRole('button', { name: 'All prescriptions' }).click();
  await expect(page.getByText('DISPENSED', { exact: true }).first()).toBeVisible({ timeout: 15_000 });
});
