import { expect, test } from '@playwright/test';

/**
 * Behavioral check for the admissions module (Ghana hospital admission form):
 * drive the full 5-step wizard end to end — new citizen intake → admission
 * details → medical history → payment → consent & vitals — and verify the
 * created admission lands in the register with its detail drawer.
 *
 * A fresh patient is admitted per run (unique name + Ghana Card, same trick as
 * the beds/bloodbank specs) so repeat runs never collide with the MPI
 * duplicate check or reuse a discharged record.
 */
test('a new patient admission completes through the wizard and appears in the register', async ({ page }) => {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const name = `E2E Admission ${stamp}`;
  const ghanaCard = `GHA-${String(stamp).replace(/\D/g, '').slice(-9).padStart(9, '0')}-1`;

  await page.goto('/app/admissions');

  // The register renders with the seeded summaries + at least one inpatient row.
  await expect(page.getByText('Active admissions')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Discharged', { exact: true }).first()).toBeVisible();
  await expect(page.locator('tbody tr', { hasText: 'Male Medical Ward' }).first()).toBeVisible({ timeout: 15_000 });

  // ------------------------------------------------ Step 1: patient intake
  await page.getByRole('button', { name: 'New Admission' }).click();
  await page.getByLabel('Surname & first name *').fill(name);
  await page.getByLabel('Date of birth').fill('1995-06-15');
  await page.getByLabel('Sex').selectOption({ label: 'Male' });
  // The citizen branch demands a Ghana Card or NHIS number before submitting.
  await page.getByLabel('Ghana Card number').fill(ghanaCard);
  await page.getByRole('button', { name: 'Next →' }).click();

  // ------------------------------------------------ Step 2: admission
  await page.getByLabel('Ward').fill('Male Medical Ward');
  await page.getByLabel('Bed no.').fill('M-77');
  await page.getByRole('button', { name: 'Next →' }).click();

  // ------------------------------------------------ Step 3: medical history
  await page.getByRole('button', { name: 'Next →' }).click();

  // ------------------------------------------------ Step 4: insurance & payment
  await page.getByRole('button', { name: 'Next →' }).click();

  // ------------------------------------------------ Step 5: consent & submit
  await page.getByText(/Patient consent & declaration/i).click();
  await page.getByRole('button', { name: 'Confirm admission' }).click();

  // Success toast carries the allocated admission number (ADM-YYYY-000N).
  const toast = page.locator('div.fade-in.pointer-events-auto', { hasText: /Admission .* created/i });
  await expect(toast).toBeVisible({ timeout: 20_000 });

  // The detail drawer opens on the created admission with the seeded-in data.
  const drawer = page.locator('div.fixed.inset-0.z-40');
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole('heading', { name })).toBeVisible();
  const admissionNo = await drawer.locator('span.font-mono').first().textContent();
  expect(admissionNo).toMatch(/^ADM-\d{4}-\d{4}$/);
  await expect(drawer.getByText(/Male Medical Ward/).first()).toBeVisible();
  await expect(drawer.getByText('Admitted', { exact: true })).toBeVisible();
  // A live (non-discharged) admission offers the discharge form.
  await expect(drawer.getByText(/Discharge \(summary required\)/i)).toBeVisible();

  // Close the drawer — the reloaded register now shows the new patient row.
  await drawer.getByRole('button', { name: '✕' }).click();
  await expect(drawer).toBeHidden();
  const row = page.locator('tbody tr', { hasText: name });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await expect(row.getByText('Admitted', { exact: true })).toBeVisible();
  await expect(row.getByText(admissionNo!)).toBeVisible();
});
