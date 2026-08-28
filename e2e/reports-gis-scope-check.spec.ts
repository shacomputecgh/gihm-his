import { expect, test } from '@playwright/test';

/**
 * Behavioral check for the named-scope display on the Reports and GIS pages
 * under a DISTRICT-scope session (the Kumasi Metropolitan District Director,
 * e2e/auth.setup.ts). Both pages used to render a bare scope label ("District")
 * — they must now name the caller's own district ("Kumasi Metropolitan
 * (District)") via scopeLabel (docs/22 Phase 5). Read-only, safe to repeat.
 */
test('reports and GIS name the district director’s own scope', async ({ page }) => {
  // Reports page — the header line renders "scope <name> (<LEVEL>) · generated …".
  await page.goto('/app/reports');
  await expect(page.getByText(/scope Kumasi Metropolitan \(District\)/)).toBeVisible({ timeout: 15_000 });

  // GIS page — the footer line renders "Scope <name> (<LEVEL>) · …".
  await page.goto('/app/gis');
  await expect(page.getByText(/Scope Kumasi Metropolitan \(District\)/)).toBeVisible({ timeout: 15_000 });
});
