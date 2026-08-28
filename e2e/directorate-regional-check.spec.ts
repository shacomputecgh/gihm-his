import { expect, test } from '@playwright/test';

/**
 * Behavioral check for the Health directorate page under a REGIONAL-scope
 * session (the Ashanti Regional Director, e2e/auth.setup.ts). A regional
 * director must see:
 *
 *   - the district level on load (the region's districts as drillable nodes),
 *   - the totals strip and the scope footer,
 *   - drill-down into a district → its facilities (with the FACILITY badge),
 *   - the breadcrumb updating to the drilled district.
 *
 * This complements directorate-check.spec.ts, which covers the FACILITY-scope
 * view with the hospital-admin session.
 */
test('directorate renders the regional district view and drills into a district', async ({ page }) => {
  await page.goto('/app/directorate');

  // The regional director lands on the district level, not the facility one,
  // and the heading identifies their own region.
  await expect(page.getByRole('heading', { name: 'Ashanti overview' })).toBeVisible({ timeout: 15_000 });

  // Totals strip renders.
  await expect(page.getByText('Facilities', { exact: true })).toBeVisible();
  await expect(page.getByText('Patients on file', { exact: true })).toBeVisible();

  // The region's districts are drillable nodes (5 in Ashanti; assert the
  // seeded ones we know by name).
  const kumasi = page.getByRole('button', { name: /Kumasi Metropolitan/ });
  await expect(kumasi).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: /Ejisu Municipal/ })).toBeVisible();
  await expect(kumasi).toContainText('↓ drill down');

  // Drill into Kumasi Metropolitan → its facilities.
  await kumasi.click();
  await expect(page.getByRole('button', { name: /Komfo Anokye Teaching Hospital/ })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: /Premier Care Private Hospital/ })).toBeVisible();

  // Facility codes render on the drilled nodes, the heading follows the drill,
  // and the FACILITY badge + breadcrumb update.
  await expect(page.getByText('GH-KATH', { exact: true })).toBeVisible();
  await expect(page.getByText('GH-PREM', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Kumasi Metropolitan overview' })).toBeVisible();
  // The level badge renders titleCased (titleCase('FACILITY') → 'Facility').
  await expect(page.getByText('Facility level', { exact: true })).toBeVisible();
  await expect(page.getByText('Kumasi Metropolitan', { exact: true })).toBeVisible();

  // Scope footer confirms the aggregates are computed within the role scope.
  await expect(page.getByText(/role scope \(FACILITY\)/)).toBeVisible();
});
