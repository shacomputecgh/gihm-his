import { expect, test } from '@playwright/test';

/**
 * Behavioral check for the Insurance & Claims module: the overview renders the
 * coverage/claim summaries, and a seeded SUBMITTED claim moves through the
 * decision pipeline in the UI — Approve, then Mark paid — with the row's
 * status and available actions updating after each step.
 *
 * Consumes one seeded SUBMITTED claim per run (two are seeded) — re-seed the
 * demo DB to restore the pipeline, same as the lab/pharmacy checks.
 */
test('a submitted claim can be approved and then marked paid', async ({ page }) => {
  await page.goto('/app/insurance');

  // Summary tiles render (coverage + claim pipeline buckets).
  await expect(page.getByText('Active memberships', { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Claims awaiting decision', { exact: true })).toBeVisible();

  // The claim pipeline shows at least one seeded SUBMITTED claim.
  const submitted = page.locator('tbody tr', { hasText: 'Submitted' });
  await expect(submitted.first()).toBeVisible({ timeout: 15_000 });
  const claimNo = await submitted.first().locator('td').first().locator('p').first().textContent();
  expect(claimNo).toMatch(/^CLM-\d{4}-\d{4}$/);

  // Decide the claim: Approve, then Apply.
  const row = submitted.first();
  await row.locator('select').selectOption({ label: 'Approve' });
  await row.getByRole('button', { name: 'Apply' }).click();
  await expect(page.locator('div.fade-in.pointer-events-auto', { hasText: /Claim Approved/i })).toBeVisible({ timeout: 15_000 });

  // The reloaded pipeline shows the claim as APPROVED with a Mark paid action.
  const approvedRow = page.locator('tbody tr', { hasText: claimNo! });
  await expect(approvedRow.getByRole('button', { name: 'Mark paid' })).toBeVisible({ timeout: 15_000 });
  await approvedRow.getByRole('button', { name: 'Mark paid' }).click();
  await expect(page.locator('div.fade-in.pointer-events-auto', { hasText: /Claim Paid/i })).toBeVisible({ timeout: 15_000 });

  // Paid claims drop their decision actions — only the payer note remains.
  await expect(page.locator('tbody tr', { hasText: claimNo! }).getByRole('button')).toHaveCount(0, { timeout: 15_000 });
});
