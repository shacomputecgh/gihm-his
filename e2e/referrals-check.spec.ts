import { expect, test } from '@playwright/test';

/**
 * Behavioral check for the Referral network page: submit a referral through
 * the form (patient search → receiving facility → specialty → summary) and
 * assert it appears in the outgoing list. The specialty is timestamped, so
 * the assertion can't collide with seeded referrals or earlier runs.
 */
test('submitting a referral shows it in the outgoing list', async ({ page }) => {
  const specialty = `E2E Cardiology ${Date.now()}`;

  await page.goto('/app/referrals');

  // Open the new-referral form.
  await page.getByRole('button', { name: 'New referral' }).click();
  const searchInput = page.getByPlaceholder('Search patient…');
  await expect(searchInput).toBeVisible({ timeout: 15_000 });

  // Patient search → pick the first result (any patient works).
  await searchInput.fill('Ama');
  await page.locator('button', { hasText: /Ama/ }).first().click();

  // Receiving facility (seeded facilities are all OPERATIONAL) + specialty.
  await page.getByLabel('Receiving facility').selectOption({ index: 1 });
  await page.getByLabel('Specialty').fill(specialty);
  await page.getByLabel('Clinical summary').fill('E2E referral check — summary text.');
  await page.getByRole('button', { name: 'Submit referral' }).click();

  // The reloaded outgoing list shows the new referral's specialty badge (the
  // form closes on success, so this is the only occurrence).
  await expect(page.getByText(specialty, { exact: true })).toBeVisible({ timeout: 15_000 });
});
