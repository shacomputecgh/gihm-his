import { test, expect } from '@playwright/test';

/**
 * Offline dose drill (docs/19 Tests B/C/F, spec §104): immunization doses must
 * be recordable in the field with no connection — the dose is queued in the
 * IndexedDB outbox and replayed automatically on reconnect, exactly once.
 * Same round trip as the registration drill (e2e/offline-drill.spec.ts),
 * through the Immunizations record form: a real child is registered online,
 * the network is cut, the dose is saved offline, the outbox holds one PENDING
 * immunization.CREATE, and after reconnect the dose appears in the registry.
 */
test('offline dose recording queues locally and syncs automatically on reconnect', async ({ page, request }) => {
  const fullName = `PWA Offline Dose ${Date.now()} (synthetic)`;
  // A six-month-old — past the PENTA 1 due age (2 months) so the replay's
  // schedule validation accepts the dose.
  const dob = '2026-02-17';
  const DEVICE_ID = 'offline-dose-drill-device';

  // Enrol the drill's sync device (docs/21 gate) and register the child.
  const login = await request.post('/api/v1/auth/login', { data: { email: 'hospital@demo.gh', password: 'Demo@123' } });
  const { token } = (await login.json()) as { token: string };
  await request.post('/api/v1/devices/register', {
    headers: { authorization: `Bearer ${token}` },
    data: { deviceId: DEVICE_ID, name: 'Offline dose drill PWA (synthetic)', platform: 'PWA' },
  });
  await request.post(`/api/v1/admin/devices/${DEVICE_ID}/status`, {
    headers: { authorization: `Bearer ${token}` },
    data: { status: 'ACTIVE' },
  });
  const created = await request.post('/api/v1/patients', {
    headers: { authorization: `Bearer ${token}` },
    data: { fullName, dateOfBirth: dob, sex: 'F', phone: `055${String(Math.floor(10000000 + Math.random() * 89999999))}`, force: true },
  });
  expect(created.status()).toBe(200);

  // Load the immunizations page ONLINE (schedule + patient search need the
  // API), pin the device identity, and open the record form.
  await page.goto('/app/immunizations');
  await expect(page.getByRole('heading', { name: 'Immunization registry' })).toBeVisible();
  await page.evaluate((id) => localStorage.setItem('gihm_device_id', id), DEVICE_ID);
  await page.getByRole('button', { name: 'Record dose' }).first().click();
  await expect(page.getByRole('heading', { name: 'Record vaccine dose' })).toBeVisible();

  // Find the child and pick the dose. (Regex-escape the name — the literal
  // parens in "(synthetic)" would otherwise read as a capture group.)
  const nameRe = new RegExp(fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  await page.getByPlaceholder('Search patient…').fill(fullName);
  await page.getByRole('button', { name: nameRe }).click();
  await page.getByLabel('Vaccine').selectOption('PENTA');
  await page.getByLabel('Dose').selectOption('1');

  // Cut the network — the form switches to local mode and still saves.
  await page.context().setOffline(true);
  await expect(page.getByText(/Offline mode — the dose will be saved locally/)).toBeVisible();
  await page.getByRole('button', { name: 'Save dose' }).click();

  // Saved locally: the app confirms, the badge shows the queued work
  // immediately, and the form closes.
  await expect(page.getByText('Dose saved locally — will sync automatically when connected.')).toBeVisible();
  await expect(page.getByRole('button', { name: /Offline 1 pending/ })).toBeVisible();

  // The outbox holds exactly one PENDING immunization.CREATE with the dose.
  const queued = await page.evaluate(
    () =>
      new Promise<{ count: number; vaccine?: string; dose?: string; status?: string }>((resolve, reject) => {
        const req = indexedDB.open('gihm-offline');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction('outbox', 'readonly');
          const rows: { payload?: { vaccine?: string; dose?: string }; status?: string }[] = [];
          const cursor = tx.objectStore('outbox').openCursor();
          cursor.onsuccess = () => {
            const c = cursor.result;
            if (c) {
              rows.push(c.value as { payload?: { vaccine?: string; dose?: string }; status?: string });
              c.continue();
            } else {
              resolve({ count: rows.length, vaccine: rows[0]?.payload?.vaccine, dose: rows[0]?.payload?.dose, status: rows[0]?.status });
            }
          };
          cursor.onerror = () => reject(cursor.error);
        };
      }),
  );
  expect(queued.count).toBe(1);
  expect(queued.status).toBe('PENDING');
  expect(queued.vaccine).toBe('PENTA');
  expect(queued.dose).toBe('1');

  // Reconnect: the 'online' event auto-replays the outbox.
  await page.context().setOffline(false);
  await expect(page.getByRole('button', { name: /Connected/ })).toBeVisible({ timeout: 20_000 });

  // The dose reached the server: the registry lists the child's PENTA dose 1.
  await page.getByRole('button', { name: 'Registry' }).click();
  const doseRow = page.getByRole('row', { name: nameRe });
  await expect(doseRow).toBeVisible({ timeout: 15_000 });
  await expect(doseRow).toContainText('Dose 1');
});
