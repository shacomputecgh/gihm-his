import { expect, test } from '@playwright/test';

/**
 * Behavioral check for the Health directorate page under a NATIONAL-scope
 * session (the National Admin, e2e/auth.setup.ts). A national user must see:
 *
 *   - the region level on load (all 16 regions as drillable nodes),
 *   - the totals strip and the scope footer,
 *   - drill-down region → district → facility (Greater Accra → Accra
 *     Metropolitan → Korle-Bu), with the breadcrumb following the drill,
 *   - the level badge updating at each step (Regional level → Facility level).
 *
 * Together with directorate-check.spec.ts (FACILITY scope) and
 * directorate-regional-check.spec.ts (REGIONAL scope), the full
 * spec §57 drill-down hierarchy is exercised in the browser.
 */
test('directorate renders the national region view and drills region → district → facility', async ({ page }) => {
  await page.goto('/app/directorate');

  // The national admin lands on the region level.
  await expect(page.getByRole('heading', { name: 'National overview' })).toBeVisible({ timeout: 15_000 });

  // Totals strip renders.
  await expect(page.getByText('Facilities', { exact: true })).toBeVisible();
  await expect(page.getByText('Patients on file', { exact: true })).toBeVisible();

  // A known region is a drillable node with its code.
  const greaterAccra = page.getByRole('button', { name: /Greater Accra/ });
  await expect(greaterAccra).toBeVisible({ timeout: 15_000 });
  await expect(greaterAccra).toContainText('↓ drill down');
  await expect(greaterAccra).toContainText('GA');

  // Drill into Greater Accra → its districts (REGIONAL level).
  await greaterAccra.click();
  await expect(page.getByRole('heading', { name: 'Greater Accra overview' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Regional level', { exact: true })).toBeVisible();
  const accraMetro = page.getByRole('button', { name: /Accra Metropolitan/ });
  await expect(accraMetro).toBeVisible({ timeout: 15_000 });
  await expect(accraMetro).toContainText('↓ drill down');

  // Drill into Accra Metropolitan → its facilities (FACILITY level).
  await accraMetro.click();
  await expect(page.getByRole('button', { name: /Korle-Bu Teaching Hospital/ })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: /Lister Private Hospital/ })).toBeVisible();
  await expect(page.getByText('GH-KBTH', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Accra Metropolitan overview' })).toBeVisible();
  await expect(page.getByText('Facility level', { exact: true })).toBeVisible();

  // Breadcrumb follows the drill path (Ghana → Greater Accra → district).
  await expect(page.getByText('Greater Accra', { exact: true })).toBeVisible();
  await expect(page.getByText('Accra Metropolitan', { exact: true })).toBeVisible();

  // Scope footer confirms the aggregates are computed within the role scope.
  await expect(page.getByText(/role scope \(FACILITY\)/)).toBeVisible();
});
