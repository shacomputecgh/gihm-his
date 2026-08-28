import { expect, test } from '@playwright/test';

/**
 * Behavioral check for the Ambulance fleet page: register an ambulance and
 * dispatch it. The registration is unique per run — a dispatched ambulance
 * leaves AVAILABLE, so reusing the same vehicle across runs would hit the
 * "not available for dispatch" conflict.
 */
test('registering an ambulance and dispatching it succeeds', async ({ page }) => {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const registration = `GV-E2E-${String(stamp).replace(/\D/g, '').slice(-6)}`;

  await page.goto('/app/ambulances');

  // Register a fresh ambulance.
  await page.getByRole('button', { name: 'Register ambulance' }).click();
  await page.getByLabel('Registration number').fill(registration);
  await page.getByLabel('Model').fill('Mercedes Sprinter');
  await page.getByLabel('Driver name').fill('E2E Driver');
  await page.getByRole('button', { name: 'Register', exact: true }).click();
  await expect(page.locator('div.fade-in.pointer-events-auto', { hasText: /Ambulance registered/i })).toBeVisible({ timeout: 15_000 });

  // Dispatch the new vehicle (scope the button to its card — the fleet may
  // hold earlier runs' ambulances, and the toast must name this registration).
  const dispatchBtn = page.locator('div.rounded-xl', { hasText: registration }).getByRole('button', { name: 'Dispatch', exact: true });
  await expect(dispatchBtn).toBeVisible({ timeout: 15_000 });
  await dispatchBtn.click();

  // Modal: patient search → pick → dispatch.
  const search = page.getByPlaceholder('Search patient…');
  await expect(search).toBeVisible();
  await search.fill('Ama');
  await page.locator('button', { hasText: /Ama/ }).first().click();
  await page.getByRole('button', { name: 'Dispatch now' }).click();

  await expect(page.locator('div.fade-in.pointer-events-auto', { hasText: new RegExp(`Dispatched ${registration}`) })).toBeVisible({ timeout: 15_000 });
});
