import { expect, test } from '@playwright/test';

/**
 * Behavioral check for the Administration → Users tab: the seeded staff table
 * renders, a new account can be created from the form, and the row actions
 * suspend → reactivate and reset the password. The created account is the only
 * mutation — re-seed the demo DB to remove it (same as the other
 * seed-consuming checks).
 */
test('admin creates a user and walks the suspend / activate / reset-password lifecycle', async ({ page }) => {
  const suffix = Date.now();
  const email = `e2e-users-${suffix}@demo.gh`;
  const fullName = `E2E User ${suffix}`;

  await page.goto('/app/admin');
  await page.getByRole('button', { name: 'Users' }).click();

  // The seeded staff table renders with the hospital admin's own row.
  await expect(page.getByRole('table').getByText('Korle-Bu Hospital Admin (Demo)')).toBeVisible({ timeout: 15_000 });

  // Create a new account from the form.
  await page.getByRole('button', { name: 'Create user' }).click();
  await page.getByLabel('Full name').fill(fullName);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Role').selectOption('NURSE');
  await page.getByLabel('Password').fill('E2eUserPass123!');
  await page.getByRole('button', { name: 'Create account' }).click();

  const toast = page.locator('div.fade-in.pointer-events-auto', { hasText: /User created/i });
  await expect(toast).toBeVisible({ timeout: 15_000 });

  // The new row appears, ACTIVE, with a Suspend action.
  const row = page.locator('tbody tr', { hasText: email });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await expect(row.getByText('ACTIVE', { exact: true })).toBeVisible();
  await expect(row.getByRole('button', { name: 'Suspend' })).toBeVisible();

  // Suspend → badge flips, action becomes Activate.
  await row.getByRole('button', { name: 'Suspend' }).click();
  await expect(page.locator('div.fade-in.pointer-events-auto', { hasText: /User suspended/i })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('tbody tr', { hasText: email }).getByText('SUSPENDED', { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('tbody tr', { hasText: email }).getByRole('button', { name: 'Activate' })).toBeVisible();

  // Activate again.
  await page.locator('tbody tr', { hasText: email }).getByRole('button', { name: 'Activate' }).click();
  await expect(page.locator('div.fade-in.pointer-events-auto', { hasText: /User active/i })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('tbody tr', { hasText: email }).getByText('ACTIVE', { exact: true })).toBeVisible({ timeout: 15_000 });

  // Reset password — accept the browser prompt with a new value.
  page.once('dialog', (dialog) => void dialog.accept('E2eResetPass123!'));
  await page.locator('tbody tr', { hasText: email }).getByRole('button', { name: 'Reset password' }).click();
  await expect(page.locator('div.fade-in.pointer-events-auto', { hasText: /Password reset/i })).toBeVisible({ timeout: 15_000 });
});
