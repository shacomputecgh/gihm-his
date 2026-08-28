import { expect, test } from '@playwright/test';

/**
 * Behavioral check for the Stock & Inventory page: add a stock item through
 * the form and assert it appears in the registry table. The item name is
 * timestamped so the row is unique and the assertion can't collide with the
 * seeded inventory or earlier runs.
 */
test('adding a stock item shows it in the inventory registry', async ({ page }) => {
  const name = `E2E Paracetamol ${Date.now()}`;

  await page.goto('/app/stock');

  // The add-item form renders (hospital admin has manage_stock).
  const nameInput = page.getByPlaceholder('Paracetamol 500mg');
  await expect(nameInput).toBeVisible({ timeout: 15_000 });

  await nameInput.fill(name);
  await page.getByLabel('Unit').fill('tablet');
  await page.getByLabel('Qty').fill('100');
  await page.getByLabel('Reorder level').fill('20');
  await page.getByRole('button', { name: 'Add item' }).click();

  // The reloaded registry contains the new item (the form is reset on
  // success, so the only occurrence of the name is the table row).
  await expect(page.getByText(name, { exact: true })).toBeVisible({ timeout: 15_000 });
});
