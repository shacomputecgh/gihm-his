import { expect, test } from '@playwright/test';

/**
 * Behavioral check for the Bed management page: assign a patient to an
 * available bed through the modal and assert the success toast.
 *
 * A fresh patient is registered per run (unique name, same UI flow as the
 * queue specs) — a patient can only occupy one bed, so reusing the same
 * seeded patient across runs would trip a duplicate-assignment conflict.
 */
test('assigning a fresh patient to an available bed succeeds', async ({ page }) => {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const name = `E2E Bed ${stamp}`;

  // Register a fresh patient (the MPI duplicate 409 would block a reused name).
  await page.goto('/app/register');
  await page.getByLabel('Full name *').fill(name);
  await page.getByLabel('Date of birth').fill('1998-11-02');
  await page.getByLabel('Sex').selectOption({ label: 'Male' });
  await page.getByPlaceholder('0244 000 000').fill(`056${String(stamp).replace(/\D/g, '').slice(-7)}`);
  await page.getByText(/informed consent for treatment/i).click();
  await page.getByRole('button', { name: 'Register patient' }).click();
  await expect(page).toHaveURL(/\/app\/patients\/[0-9a-f-]+/, { timeout: 20_000 });

  // The board renders at least one assignable (non-occupied) bed.
  await page.goto('/app/beds');
  const assignButtons = page.getByRole('button', { name: 'Assign', exact: true });
  await expect(assignButtons.first()).toBeVisible({ timeout: 15_000 });
  await assignButtons.first().click();

  // The assign modal opens with a patient search — find the fresh patient.
  const search = page.getByPlaceholder('Name or MRN…');
  await expect(search).toBeVisible();
  await search.fill(name);
  await page.locator('button', { hasText: name }).first().click();
  await page.getByRole('button', { name: 'Assign bed' }).click();

  // Success toast confirms the assignment (modal closes, board reloads).
  const toast = page.locator('div.fade-in.pointer-events-auto', { hasText: /Assigned to/i });
  await expect(toast).toBeVisible({ timeout: 15_000 });
});
