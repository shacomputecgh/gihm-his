import { expect, test } from '@playwright/test';

/**
 * Behavioral check for the National Integrations page (docs/08 §3). The
 * pages-smoke spec only asserts the heading; this verifies the data surfaces
 * actually populate:
 *
 *   - all seven adapter cards render with the unconfigured badge (no env vars)
 *     and the Pending/Delivered/Failed stat tiles
 *   - the DHIMS2 dry-run preview builds a real dataset (current month,
 *     non-mutating — dry run never queues)
 *   - the GhiLMIS dry-run preview builds a stock-level snapshot from the
 *     seeded Korle-Bu inventory (current month, read-only)
 *   - the HRIMS dry-run preview builds a workforce register snapshot from the
 *     seeded staff directory (current month, read-only)
 *   - the SORMAS dry-run preview counts the seeded cases in the default range
 *
 * Uses the shared session (e2e/auth.setup.ts); the default "Dry run" checkbox
 * keeps every flow read-only so the spec never leaves submissions behind.
 */
test('integrations render adapter status and dry-run previews build real data', async ({ page }) => {
  await page.goto('/app/integrations');

  // All seven adapter cards: unconfigured badge + the three stat tiles.
  await expect(page.getByText('DHIMS2', { exact: true }).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('SORMAS', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('GhiLMIS', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('HRIMS', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('NHIS', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('eTracker', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('LHIMS', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Not configured')).toHaveCount(7);
  await expect(page.getByText('Pending', { exact: true }).first()).toBeVisible();

  // Delivery log renders the seeded pending DHIMS2 submission (dry runs never
  // queue — the preview below must not add a row to this table).
  const seededKey = `dhims2:${new Date().toISOString().slice(0, 7).replace('-', '')}:NATIONAL`;
  await expect(page.getByText(seededKey)).toBeVisible();

  // DHIMS2 dry-run preview — default month (current), default dry-run checked.
  // The API renders the DHIS2 period format (yyyyMM), i.e. 202608 for 2026-08.
  const dhimsPeriod = new Date().toISOString().slice(0, 7).replace('-', '');
  await page.getByRole('button', { name: 'Preview dataset' }).click();
  await expect(page.getByText(new RegExp(`Dataset ${dhimsPeriod} · .* \\d+ values`))).toBeVisible({ timeout: 15_000 });

  // GhiLMIS dry-run preview — the seeded Korle-Bu inventory has stock items.
  const ghilmisPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM (same as the form's Month)
  await page.getByRole('button', { name: 'Preview stock' }).click();
  await expect(page.getByText(new RegExp(`Snapshot ${ghilmisPeriod} · .* \\d+ items`))).toBeVisible({ timeout: 15_000 });

  // HRIMS dry-run preview — the seeded staff directory has employees.
  await page.getByRole('button', { name: 'Preview workforce' }).click();
  await expect(page.getByText(new RegExp(`Register ${ghilmisPeriod} · .* \\d+ staff`))).toBeVisible({ timeout: 15_000 });

  // SORMAS dry-run preview — default 30-day range covers the seeded cases.
  await page.getByRole('button', { name: 'Preview cases' }).click();
  await expect(page.getByText(/\d+ case\(s\) in range/).first()).toBeVisible({ timeout: 15_000 });
});
