import { expect, test } from '@playwright/test';

/**
 * Behavioral check for the Laboratory page: the seeded worklist of pending
 * orders renders, and entering a result on one — flagged critical — verifies
 * and releases it. The verified order drops out of the pending list and shows
 * as VERIFIED under "All orders".
 *
 * Consumes one seeded ORDERED order per run (the pages-smoke spec only checks
 * the heading) — re-seed the demo DB to restore the worklist, same as the
 * immunization dose check.
 */
test('a pending lab order verifies with a critical result', async ({ page }) => {
  await page.goto('/app/lab');

  // The seeded pending worklist renders at least one order (each row carries
  // a gold ORDERED status badge).
  const rows = page.locator('div.space-y-3 > div.rounded-xl');
  await expect(rows.first()).toBeVisible({ timeout: 15_000 });
  const orderCount = await page.getByText('ORDERED', { exact: true }).count();
  expect(orderCount).toBeGreaterThan(0);

  // Open the first pending order's result panel.
  await rows.first().locator('button').click();

  // Enter the result, reference range, and flag it critical. Role selectors
  // are used because getByLabel('Result') also substring-matches the
  // "Critical result" checkbox (and exact label matching misses the textarea).
  await page.getByRole('textbox', { name: 'Result', exact: true }).fill('Hb 10.1 g/dL, WBC 7.2 x10^9/L');
  await page.getByRole('textbox', { name: /Reference range/ }).fill('12.0–16.0 g/dL');
  await page.getByRole('checkbox', { name: 'Critical result' }).check();
  await page.getByRole('button', { name: 'Verify & release result' }).click();

  // Success toast confirms the critical flag surfaced in the UI copy.
  const toast = page.locator('div.fade-in.pointer-events-auto', { hasText: /Critical result flagged & verified/i });
  await expect(toast).toBeVisible({ timeout: 15_000 });

  // The worklist reloads — the verified order is no longer pending.
  await expect(page.getByText('ORDERED', { exact: true })).toHaveCount(orderCount - 1, { timeout: 15_000 });

  // Under "All orders" the released result is visible as VERIFIED.
  await page.getByRole('button', { name: 'All orders' }).click();
  await expect(page.getByText('VERIFIED', { exact: true }).first()).toBeVisible({ timeout: 15_000 });
});
