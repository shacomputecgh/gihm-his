import { expect, test } from '@playwright/test';

/**
 * Behavioral check for the Health directorate page (read-only aggregate
 * dashboard). For the hospital-admin session (FACILITY scope) it must render:
 *
 *   - the totals strip (Facilities / Patients on file / …)
 *   - the in-scope facility node with its aggregate metrics
 *   - the immunization coverage card
 *   - the scope footer ("role scope (FACILITY)")
 *
 * All assertions target seeded aggregate data that is always present.
 */
test('directorate renders the facility-scope aggregate dashboard', async ({ page }) => {
  await page.goto('/app/directorate');

  // Totals strip.
  await expect(page.getByText('Facilities', { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Patients on file', { exact: true })).toBeVisible();
  await expect(page.getByText('Revenue collected', { exact: true })).toBeVisible();

  // The in-scope facility node with its aggregate metrics (the node card's
  // facility code is unique — the facility name also appears in the banner).
  await expect(page.getByRole('button', { name: /Korle-Bu Teaching Hospital/ })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('GH-KBTH', { exact: true })).toBeVisible();

  // Immunization coverage card and the scope footer.
  await expect(page.getByText('Immunization coverage', { exact: true })).toBeVisible();
  await expect(page.getByText(/role scope \(FACILITY\)/)).toBeVisible();
});
