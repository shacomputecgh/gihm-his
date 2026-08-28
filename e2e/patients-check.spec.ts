import { expect, test } from '@playwright/test';

/**
 * Behavioral check for the Patient Registry: the seeded register loads, and
 * the live search narrows it deterministically — by exact MRN (GH-000001) to a
 * single record, and by the intentional near-duplicate name to both MPI
 * candidate records. Read-only, so repeat runs are always safe.
 */
test('the patient registry loads and live search filters by MRN and name', async ({ page }) => {
  await page.goto('/app/patients');

  // The seeded register renders rows (patients, MRNs, identifiers).
  const rows = page.locator('tbody tr');
  await expect(rows.first()).toBeVisible({ timeout: 15_000 });
  const initial = await rows.count();
  expect(initial).toBeGreaterThan(1);

  // Search by a seeded MRN — the list narrows to exactly that record.
  const search = page.getByPlaceholder(/Search name, GH-000001/);
  await search.fill('GH-000001');
  await expect(rows).toHaveCount(1, { timeout: 15_000 });
  await expect(rows.getByText('GH-000001', { exact: true })).toBeVisible();

  // Search by the seeded near-duplicate name — both MPI candidate records.
  await search.fill('Ama Serwaa Mensah');
  await expect(rows).toHaveCount(2, { timeout: 15_000 });
  await expect(rows.getByText('Ama Serwaa Mensah').first()).toBeVisible();
});
