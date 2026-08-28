import { expect, test } from '@playwright/test';

/**
 * Behavioral check for the patient detail record: open the seeded patient
 * GH-000001 from the registry, verify the record header, then the Admissions
 * tab (deterministic seeded ward/bed/reason) and the Insurance tab
 * (deterministic NHIS membership). Read-only — safe to repeat.
 */
test('a patient record shows its admissions and insurance memberships', async ({ page }) => {
  // Find the seeded patient GH-000001 via the registry and open the record.
  await page.goto('/app/patients');
  await page.getByPlaceholder(/Search name, GH-000001/).fill('GH-000001');
  const row = page.locator('tbody tr', { hasText: 'GH-000001' });
  await expect(row).toHaveCount(1, { timeout: 15_000 });
  await row.getByRole('link', { name: 'Open', exact: true }).click();
  await expect(page).toHaveURL(/\/app\/patients\/[0-9a-f-]+/, { timeout: 15_000 });

  // Record header: the MRN renders, and the admissions count shows on its tab
  // (the insurance count only loads once that tab is opened).
  await expect(page.getByText('GH-000001', { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: 'Admissions (1)' })).toBeVisible();
  const insuranceTab = page.getByRole('button', { name: /^Insurance \(\d+\)$/ });
  await expect(insuranceTab).toBeVisible();

  // Admissions tab: the seeded active admission (ward/bed, reason, status).
  await page.getByRole('button', { name: 'Admissions (1)' }).click();
  await expect(page.getByText('Male Medical Ward · bed M-12')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Reason: Severe malaria with dehydration/)).toBeVisible();
  await expect(page.getByText('ADMITTED', { exact: true })).toBeVisible();

  // Insurance tab: the seeded verified NHIS membership (loaded on open). The
  // membership number is unique to the membership card (the scheme name also
  // appears in the enroll-form select).
  await insuranceTab.click();
  await expect(page.getByText('NHIS-10000010')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Verified', { exact: true })).toBeVisible();
  await expect(page.getByText('ACTIVE', { exact: true })).toBeVisible();
});
