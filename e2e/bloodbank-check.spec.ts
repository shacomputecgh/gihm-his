import { expect, test } from '@playwright/test';

/**
 * Behavioral check for the Blood bank page: register a donor and record a
 * donation for them. The donor name is unique per run so the donation select
 * can target it deterministically and repeat runs never collide.
 */
test('registering a donor and recording a donation succeeds', async ({ page }) => {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const donorName = `E2E Donor ${stamp}`;
  const phone = `055${String(stamp).replace(/\D/g, '').slice(-7)}`;

  await page.goto('/app/bloodbank');

  // Register a donor.
  await page.getByRole('button', { name: 'Register donor' }).click();
  await page.getByLabel('Full name').fill(donorName);
  await page.getByLabel('Phone').fill(phone);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('div.fade-in.pointer-events-auto', { hasText: /Donor registered/i })).toBeVisible({ timeout: 15_000 });

  // Record a donation for the fresh donor (default blood group O+, screening
  // Negative) — the reload after registration refreshed the donor select.
  await page.getByRole('button', { name: 'Record donation' }).click();
  const donorSelect = page.getByLabel('Donor');
  await expect(donorSelect).toBeVisible();
  await donorSelect.selectOption({ label: `${donorName} (O+)` });
  await page.getByRole('button', { name: 'Record + create units' }).click();
  await expect(page.locator('div.fade-in.pointer-events-auto', { hasText: /Donation recorded/i })).toBeVisible({ timeout: 15_000 });
});
