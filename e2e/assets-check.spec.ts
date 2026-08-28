import { expect, test } from '@playwright/test';

/**
 * Behavioral check for the Fixed Assets module: register a fresh asset through
 * the register form (unique number + name per run, so repeat runs never hit
 * the per-facility asset-number conflict), then dispose it through the prompt
 * dialog and confirm the register reflects the write-off.
 */
test('a registered asset can be disposed and written off', async ({ page }) => {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const assetNumber = `E2E-${String(stamp).replace(/\D/g, '').slice(-8)}`;
  const name = `E2E Asset ${stamp}`;

  await page.goto('/app/assets');

  // Summary tiles render (replacement cost, book value, depreciation, write-offs).
  await expect(page.getByText('Replacement cost', { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Book value', { exact: true })).toBeVisible();
  await expect(page.getByText('Annual depreciation', { exact: true })).toBeVisible();
  await expect(page.getByText('Written off', { exact: true })).toBeVisible();

  // Register an asset (defaults: IT category, 5-year life, acquired today).
  await page.getByLabel('Asset number').fill(assetNumber);
  await page.getByLabel('Name').fill(name);
  await page.getByLabel('Purchase cost (GH₵)').fill('250000');
  await page.getByLabel('Location').fill('Block A, 2nd Floor');
  await page.getByLabel('Serial number').fill(`SN-${stamp}`);
  await page.getByRole('button', { name: 'Register' }).click();

  const toast = page.locator('div.fade-in.pointer-events-auto', { hasText: /Asset registered/i });
  await expect(toast).toBeVisible({ timeout: 15_000 });

  // The reloaded register shows the new asset as an ACTIVE IT item.
  const row = page.locator('tbody tr', { hasText: name });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await expect(row.getByText(assetNumber)).toBeVisible();
  await expect(row.getByText('It', { exact: true })).toBeVisible(); // titleCase('IT')
  await expect(row.getByText('Active', { exact: true })).toBeVisible();

  // Dispose it — the UI uses a prompt() dialog for the reason, so accept it.
  page.on('dialog', (dialog) => void dialog.accept('End of life'));
  await row.getByRole('button', { name: 'Dispose' }).click();
  await expect(page.locator('div.fade-in.pointer-events-auto', { hasText: /Asset written off/i })).toBeVisible({ timeout: 15_000 });

  // The row now shows the DISPOSED status with the disposal note.
  await expect(row.getByText('Disposed', { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(row.getByText(/End of life/)).toBeVisible();
});
