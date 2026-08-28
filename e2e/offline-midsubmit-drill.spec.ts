import { test, expect } from '@playwright/test';

/**
 * Mid-submit network drop drill (docs/19 Tests B/H, spec §104): the worst
 * offline moment — the connection dies WHILE the registration request is in
 * flight. The app must never lose the write: the failed request falls into
 * the same status-0 path as a clean offline submit, the patient is queued in
 * the outbox with its exact payload, and a manual sync (or the next online
 * event) lands it exactly once. The drop is simulated with route.abort() —
 * the browser sees a real network failure mid-request.
 */
test('a registration whose request dies mid-flight is queued, not lost', async ({ page, request }) => {
  const fullName = `PWA MidFlight Drop ${Date.now()} (synthetic)`;
  const phone = `055${String(Math.floor(10000000 + Math.random() * 89999999))}`;
  const DEVICE_ID = 'offline-midsubmit-drill-device';

  // Enrol the drill's sync device (docs/21 gate).
  const login = await request.post('/api/v1/auth/login', { data: { email: 'hospital@demo.gh', password: 'Demo@123' } });
  const { token } = (await login.json()) as { token: string };
  await request.post('/api/v1/devices/register', {
    headers: { authorization: `Bearer ${token}` },
    data: { deviceId: DEVICE_ID, name: 'Offline mid-submit drill PWA (synthetic)', platform: 'PWA' },
  });
  await request.post(`/api/v1/admin/devices/${DEVICE_ID}/status`, {
    headers: { authorization: `Bearer ${token}` },
    data: { status: 'ACTIVE' },
  });

  // Load the register form online and pin the device identity.
  await page.goto('/app/register');
  await expect(page.getByRole('heading', { name: 'Register Patient' })).toBeVisible();
  await page.evaluate((id) => localStorage.setItem('gihm_device_id', id), DEVICE_ID);
  await page.getByLabel('Full name *').fill(fullName);
  await page.getByRole('textbox', { name: 'Phone', exact: true }).fill(phone);
  await page.getByText('I confirm this patient').click();

  // The connection dies the moment the registration is submitted — the
  // request is aborted mid-flight, exactly like a link drop.
  await page.route('**/api/v1/patients', (route) => route.abort());
  await page.getByRole('button', { name: 'Register patient' }).click();

  // The write is queued, not lost: the app confirms the local save, the
  // pending count climbs, and the outbox holds the exact payload.
  await expect(page.getByText('Patient saved locally — will sync automatically when connected.')).toBeVisible();
  await expect(page.getByRole('button', { name: /1 pending/ })).toBeVisible();

  const queued = await page.evaluate(
    () =>
      new Promise<{ count: number; fullName?: string; status?: string }>((resolve, reject) => {
        const req = indexedDB.open('gihm-offline');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const tx = req.result.transaction('outbox', 'readonly');
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

  // The connection is back — sync the outbox manually (the badge's Sync now).
  await page.unroute('**/api/v1/patients');
  await page.getByTitle('Synchronization status').click();
  await page.getByRole('button', { name: 'Sync now' }).click();
  await expect(page.getByRole('button', { name: /Connected/ })).toBeVisible({ timeout: 20_000 });

  // The registration landed exactly once: searchable in the registry.
  await page.getByPlaceholder(/Search name/).fill(fullName);
  await expect(page.getByRole('link', { name: fullName })).toBeVisible({ timeout: 15_000 });
});
