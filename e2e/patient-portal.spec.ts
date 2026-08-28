import { expect, test } from '@playwright/test';

/**
 * Patient portal check — the patient-facing surface of the hybrid platform
 * (spec §self-access). Runs under the patient session from e2e/auth.setup.ts
 * (patient@demo.gh, linked to the seeded record "Ama Serwaa Mensah"):
 *
 *   - the portal loads the patient's own record (name, MRN, My records tiles)
 *   - a PATIENT-scope session is bounced off staff routes: /app redirects
 *     to /patient, and the /app shell never renders
 *
 * The record sections that can legitimately be empty (appointments,
 * medications, documents) assert their empty states instead of data, so the
 * spec holds on any seed shape.
 */
test('patient portal shows the own record and blocks staff areas', async ({ page }) => {
  await page.goto('/patient');

  // Portal chrome + the patient's own record.
  await expect(page.getByText('My Health Portal')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Ama Serwaa Mensah', { exact: false }).first()).toBeVisible({ timeout: 15_000 });

  // The "My records" summary card always renders with its four tiles.
  await expect(page.getByText('My records', { exact: true })).toBeVisible();
  await expect(page.getByText('Visits', { exact: true })).toBeVisible();

  // Self-access: the patient is bounced off the staff app entirely.
  await page.goto('/app');
  await expect(page).toHaveURL(/\/patient/);
  await expect(page.getByText('My Health Portal')).toBeVisible();
});
