import { expect, test } from '@playwright/test';

/**
 * Behavioral check for the public facility self-registration flow: submit a
 * complete application (unique facility name per run, seeded geography) and
 * verify the PENDING application confirmation with its application id.
 */
test('a facility application submits and confirms its id', async ({ page }) => {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const name = `E2E Clinic ${stamp}`;

  await page.goto('/register-facility');
  await expect(page.getByRole('heading', { name: /Register your facility/i })).toBeVisible({ timeout: 15_000 });

  // Required fields: name, type, ownership, region → district. Role selectors
  // with exact names — getByLabel('Region') substring-matches the facility
  // type's "Regional Hospital" option and the district's placeholder.
  await page.getByRole('textbox', { name: /Facility name/ }).fill(name);
  await page.getByRole('combobox', { name: 'Facility type', exact: true }).selectOption({ label: 'Clinic' });
  await page.getByRole('combobox', { name: 'Ownership', exact: true }).selectOption({ label: 'Private' });
  await page.getByRole('combobox', { name: 'Region', exact: true }).selectOption({ label: 'Greater Accra' });
  const district = page.getByRole('combobox', { name: 'District', exact: true });
  await expect(district).toBeEnabled({ timeout: 15_000 });
  await district.selectOption({ label: 'Accra Metropolitan' });

  // Pick one offered service, then submit. The service chips live inside the
  // "Services offered" label, which inflates their accessible names — match
  // the chip by its own text instead.
  await page.getByText('OPD', { exact: true }).click();
  await page.getByRole('button', { name: 'Submit application' }).click();

  // The confirmation state carries the application id.
  await expect(page.getByText('Application submitted', { exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/application id:/)).toBeVisible();
});
