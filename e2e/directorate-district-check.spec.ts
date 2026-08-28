import { expect, test } from '@playwright/test';

/**
 * Behavioral check for the Health directorate page under a DISTRICT-scope
 * session (the Kumasi Metropolitan District Director, e2e/auth.setup.ts). A
 * district director must see:
 *
 *   - the facility level on load (their district's facilities as leaf nodes),
 *   - the totals strip and the scope footer,
 *   - no drill-down affordances (facility nodes are leaves),
 *   - facility codes rendered on the nodes.
 *
 * Together with directorate-check.spec.ts (FACILITY), the regional and
 * national specs, every scope of the spec §57 hierarchy is exercised.
 */
test('directorate renders the district facility view with no drill-down', async ({ page }) => {
  await page.goto('/app/directorate');

  // The district director lands directly on the facility level for their
  // district, and the heading + breadcrumb identify their own district.
  await expect(page.getByRole('heading', { name: 'Kumasi Metropolitan overview' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Kumasi Metropolitan', { exact: true }).first()).toBeVisible();

  // Totals strip renders.
  await expect(page.getByText('Facilities', { exact: true })).toBeVisible();
  await expect(page.getByText('Patients on file', { exact: true })).toBeVisible();

  // Kumasi Metropolitan's facilities render as leaf nodes with their codes.
  const kath = page.getByRole('button', { name: /Komfo Anokye Teaching Hospital/ });
  await expect(kath).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: /Premier Care Private Hospital/ })).toBeVisible();
  await expect(page.getByText('GH-KATH', { exact: true })).toBeVisible();
  await expect(page.getByText('GH-PREM', { exact: true })).toBeVisible();

  // Facility nodes are leaves — no drill-down affordance, and the node is not
  // navigable (disabled), unlike district/region nodes in other scopes.
  await expect(kath).not.toContainText('↓ drill down');
  await expect(kath).toBeDisabled();

  // Scope footer confirms the aggregates are computed within the role scope.
  await expect(page.getByText(/role scope \(FACILITY\)/)).toBeVisible();
});
