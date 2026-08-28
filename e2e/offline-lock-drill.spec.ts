import { test, expect } from '@playwright/test';

/**
 * Offline device-lock drill (docs/26 §6c, spec §97, docs/19 Tests I/B): the
 * PIN lock is protection that lives ON the device — it must work with no
 * connection at all. The PIN is enrolled online (Admin → Sync status), then
 * the network is cut and the device is locked: the LockScreen appears, a
 * wrong PIN is refused, the correct PIN unlocks locally (PBKDF2 on the
 * device, zero network), and the session survives — the app keeps navigating
 * offline with no login redirect.
 */
test('device lock protects the session with no connection', async ({ page }) => {
  const PIN = '1234';

  // Tap the on-screen keypad (each tap is its own action, so React state is
  // always current — the sr-only input's window-keydown path is for humans).
  const enterPin = async (pin: string) => {
    for (const d of pin) await page.getByRole('button', { name: d, exact: true }).click();
  };

  // Enroll a device PIN (Admin → Sync status).
  await page.goto('/app/admin');
  await page.getByRole('button', { name: 'Sync status' }).click();
  await expect(page.getByText('Device lock & offline session')).toBeVisible();
  await page.getByRole('button', { name: 'Set PIN' }).click();
  await page.getByLabel('New PIN (4–8 digits)').fill(PIN);
  await page.getByLabel('Confirm PIN').fill(PIN);
  await page.getByRole('button', { name: 'Save PIN' }).click();
  await expect(page.getByText('PIN enabled')).toBeVisible();

  // Cut the network, then lock the device — locking is purely local.
  await page.context().setOffline(true);
  await page.getByRole('button', { name: /Lock now/ }).click();
  await expect(page.getByRole('heading', { name: 'Device locked' })).toBeVisible();

  // Wrong PIN: refused, the device stays locked.
  await enterPin('0000');
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page.getByText('Incorrect PIN — try again')).toBeVisible();

  // Correct PIN: unlocks locally — no network involved.
  await enterPin(PIN);
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page.getByRole('heading', { name: 'Device locked' })).not.toBeVisible({ timeout: 10_000 });

  // The session survived the lock: still signed in, still navigating, still
  // offline — no login redirect, the app shell is intact.
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Offline/ })).toBeVisible();
});
