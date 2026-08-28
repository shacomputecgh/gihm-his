import { expect, test } from '@playwright/test';

/**
 * Behavioral check for the Administration page: the seeded Devices table
 * renders (including a PENDING self-registered device), approving it flips it
 * to ACTIVE, and the Audit log + MPI duplicates tabs mount with their content.
 *
 * Approving the seeded PENDING device is the only mutation — re-seed the demo
 * DB to restore it (same as the other seed-consuming checks).
 */
test('admin approves a pending device and the audit + MPI tabs render', async ({ page }) => {
  await page.goto('/app/admin');

  // Default Devices tab: seeded devices render, one pending approval.
  await expect(page.getByText('Reception PC (Demo)')).toBeVisible({ timeout: 15_000 });
  const pendingRow = page.locator('tbody tr', { hasText: 'Records PC 2 (Demo, pending approval)' });
  await expect(pendingRow).toBeVisible();
  await expect(pendingRow.getByText('PENDING', { exact: true })).toBeVisible();

  // Approve the pending device — no prompt, flips the badge to ACTIVE.
  await pendingRow.getByRole('button', { name: 'Approve' }).click();
  const toast = page.locator('div.fade-in.pointer-events-auto', { hasText: /Device active/i });
  await expect(toast).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('tbody tr', { hasText: 'Records PC 2 (Demo, pending approval)' }).getByText('ACTIVE', { exact: true })).toBeVisible({ timeout: 15_000 });

  // Audit log tab mounts its table.
  await page.getByRole('button', { name: 'Audit log' }).click();
  await expect(page.getByText('When', { exact: true })).toBeVisible({ timeout: 15_000 });

  // MPI duplicates tab shows the seeded near-duplicate pair with a Merge action.
  await page.getByRole('button', { name: 'MPI duplicates' }).click();
  await expect(page.getByText('Ama Serwaa Mensah').first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: /Merge \d+ → \d+/ })).toBeVisible();
});
