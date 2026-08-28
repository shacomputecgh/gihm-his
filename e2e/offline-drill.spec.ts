import { test, expect } from '@playwright/test';

/**
 * Offline field drill (docs/19 Tests B/C/F, spec §90, §104): with no
 * connection the PWA must keep clinical work going — a registration is queued
 * in the local IndexedDB outbox (never silently dropped) and replayed
 * automatically when the connection returns, landing on the server exactly
 * once. Driven at the real UI: the browser network is cut with
 * context.setOffline(true), the register form still works, the app confirms
 * the local save, and the SyncBadge + patient registry prove the round trip.
 */
test('offline registration queues locally and syncs automatically on reconnect', async ({ page, request }) => {
  const fullName = `PWA Offline Drill ${Date.now()} (synthetic)`;
  const phone = `055${String(Math.floor(10000000 + Math.random() * 89999999))}`;
  // Device identity for this drill (docs/21): the sync device must exist and
  // be ACTIVE, or the reconnect replay is refused DEVICE_PENDING_APPROVAL.
  const DEVICE_ID = 'offline-drill-device';
  const login = await request.post('/api/v1/auth/login', { data: { email: 'hospital@demo.gh', password: 'Demo@123' } });
  const { token } = (await login.json()) as { token: string };
  await request.post('/api/v1/devices/register', {
    headers: { authorization: `Bearer ${token}` },
    data: { deviceId: DEVICE_ID, name: 'Offline drill PWA (synthetic)', platform: 'PWA' },
  });
  await request.post(`/api/v1/admin/devices/${DEVICE_ID}/status`, {
    headers: { authorization: `Bearer ${token}` },
    data: { status: 'ACTIVE' },
  });

  // Load the register page ONLINE so the SPA shell and reference data load,
  // pin the device identity, then cut the network — the app must switch to
  // local mode.
  await page.goto('/app/register');
  await expect(page.getByRole('heading', { name: 'Register Patient' })).toBeVisible();
  await page.evaluate((id) => localStorage.setItem('gihm_device_id', id), DEVICE_ID);
  await page.context().setOffline(true);

  // The offline banner appears; the form still works.
  await expect(page.getByText(/Offline mode — the form will save locally/)).toBeVisible();

  await page.getByLabel('Full name *').fill(fullName);
  await page.getByLabel('Date of birth').fill('1992-06-15');
  await page.getByRole('textbox', { name: 'Phone', exact: true }).fill(phone);
  await page.getByText('I confirm this patient').click();
  await page.getByRole('button', { name: 'Register patient' }).click();

  // Queued locally: the app confirms the local save and navigates away — no
  // server round trip happened. The sync badge reflects the queued work
  // IMMEDIATELY (gihm:outbox-changed → refresh), not after the 30s poll.
  await expect(page).toHaveURL(/\/app\/patients/);
  await expect(page.getByText('Patient saved locally — will sync automatically when connected.')).toBeVisible();
  await expect(page.getByRole('button', { name: /Offline 1 pending/ })).toBeVisible();

  // The outbox really holds the registration: exactly one PENDING entry in
  // IndexedDB carrying the exact payload (spec §166 — never silently dropped).
  const queued = await page.evaluate(
    () =>
      new Promise<{ count: number; fullName?: string; status?: string }>((resolve, reject) => {
        const req = indexedDB.open('gihm-offline');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction('outbox', 'readonly');
          const rows: { payload?: { fullName?: string }; status?: string }[] = [];
          const cursor = tx.objectStore('outbox').openCursor();
          cursor.onsuccess = () => {
            const c = cursor.result;
            if (c) {
              rows.push(c.value as { payload?: { fullName?: string }; status?: string });
              c.continue();
            } else {
              resolve({ count: rows.length, fullName: rows[0]?.payload?.fullName, status: rows[0]?.status });
            }
          };
          cursor.onerror = () => reject(cursor.error);
        };
      }),
  );
  expect(queued.count).toBe(1);
  expect(queued.status).toBe('PENDING');
  expect(queued.fullName).toBe(fullName);

  // Reconnect: the browser 'online' event triggers the automatic outbox
  // replay (lib/connection.tsx). The badge flips back to Connected.
  await page.context().setOffline(false);
  await expect(page.getByRole('button', { name: /Connected/ })).toBeVisible({ timeout: 20_000 });

  // The registration reached the server: search the registry for the name.
  await page.getByPlaceholder(/Search name/).fill(fullName);
  await expect(page.getByRole('link', { name: fullName })).toBeVisible({ timeout: 15_000 });

  // The outbox entry was consumed by the replay — nothing left pending.
  const remaining = await page.evaluate(
    () =>
      new Promise<number>((resolve, reject) => {
        const req = indexedDB.open('gihm-offline');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const tx = req.result.transaction('outbox', 'readonly');
          const countReq = tx.objectStore('outbox').count();
          countReq.onsuccess = () => resolve(countReq.result);
          countReq.onerror = () => reject(countReq.error);
        };
      }),
  );
  expect(remaining).toBe(0);
});
