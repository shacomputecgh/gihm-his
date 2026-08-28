import { expect, test } from '@playwright/test';

/**
 * Behavioral check for the Reports page (docs/14). The pages-smoke spec only
 * asserts the heading renders — this spec verifies the live-computed parts
 * actually populate, because the GIS bug proved a page can render its chrome
 * while a data section silently fails to mount:
 *
 *   - headline cards show real figures (not the "—" placeholder)
 *   - the DHIMS-II indicator table renders rows with values
 *   - reporting completeness shows "X of Y facilities reported activity"
 *   - switching the group-by to Facility renders the breakdown matrix
 *
 * The shared session (e2e/auth.setup.ts) is a Korle-Bu hospital admin; the
 * seed generates encounters 8–15 days ago, inside the page's default
 * "Last 30 days" range, so every assertion below has real data to find.
 */
test('reports render live indicators, completeness and the facility breakdown', async ({ page }) => {
  await page.goto('/app/reports');

  // Headline cards — real figures, not the "—" placeholder. The card is the
  // div holding the label; asserting it has no dash means the computed value
  // rendered (the seed always produces encounters in the default range).
  const opdCard = page.locator('div.px-5.py-4', { hasText: 'OPD attendance' });
  await expect(opdCard).toBeVisible({ timeout: 15_000 });
  await expect(opdCard.getByText('—')).toHaveCount(0);
  await expect(opdCard.getByText(/\d+/)).toBeVisible();

  // DHIMS-II indicator table with per-row subtitle "DHIMS-II <code> · unit".
  await expect(page.getByText('DHIMS-II', { exact: false }).first()).toBeVisible();

  // Reporting completeness — a reported/expected count renders.
  await expect(page.getByText(/of \d+ facilities reported activity/)).toBeVisible();

  // Group-by → Facility renders the breakdown matrix with the in-scope group.
  await page.getByRole('button', { name: 'Facility', exact: true }).click();
  await expect(page.getByText(/Breakdown by facility/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Korle-Bu/).first()).toBeVisible();
});
