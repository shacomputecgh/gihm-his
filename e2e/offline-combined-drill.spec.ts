import { test, expect } from '@playwright/test';

/**
 * Combined offline session drill (docs/19 Tests B/C/F, spec §104): a real
 * field session queues MULTIPLE writes while disconnected — a vaccine dose
 * and a new-patient registration — and on reconnect the whole outbox replays
 * together, each landing exactly once. The dose form is prepared online (its
 * patient search needs the API); the network is then cut and both writes are
 * submitted offline; the badge climbs to "Offline 2 pending"; reconnect
 * drains both and the registry proves it.
 */
test('a combined offline session queues a dose and a registration and syncs both on reconnect', async ({ page, request }) => {
  const childName = `PWA Combined Child ${Date.now()} (synthetic)`;
  const regName = `PWA Combined Reg ${Date.now()} (synthetic)`;
  const dob = '2026-02-17'; // six-month-old — past PENTA 1's due age
  const DEVICE_ID = 'offline-combined-drill-device';

  // Enrol the drill's sync device and register the child (the dose's subject).
  const login = await request.post('/api/v1/auth/login', { data: { email: 'hospital@demo.gh', password: 'Demo@123' } });
  const { token } = (await login.json()) as { token: string };
  await request.post('/api/v1/devices/register', {
    headers: { authorization: `Bearer ${token}` },
    data: { deviceId: DEVICE_ID, name: 'Offline combined drill PWA (synthetic)', platform: 'PWA' },
  });
  await request.post(`/api/v1/admin/devices/${DEVICE_ID}/status`, {
    headers: { authorization: `Bearer ${token}` },
    data: { status: 'ACTIVE' },
  });
  const child = await request.post('/api/v1/patients', {
    headers: { authorization: `Bearer ${token}` },
    data: { fullName: childName, dateOfBirth: dob, sex: 'F', phone: `055${String(Math.floor(10000000 + Math.random() * 89999999))}`, force: true },
  });
  expect(child.status()).toBe(200);

  // Prepare the dose form ONLINE (patient search needs the API).
  await page.goto('/app/immunizations');
  await expect(page.getByRole('heading', { name: 'Immunization registry' })).toBeVisible();
  await page.evaluate((id) => localStorage.setItem('gihm_device_id', id), DEVICE_ID);
  await page.getByRole('button', { name: 'Record dose' }).first().click();
  const nameRe = new RegExp(childName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  await page.getByPlaceholder('Search patient…').fill(childName);
  await page.getByRole('button', { name: nameRe }).click();
  await page.getByLabel('Vaccine').selectOption('PENTA');
  await page.getByLabel('Dose').selectOption('1');

  // Cut the network — both writes now happen offline.
  await page.context().setOffline(true);

  // Write 1: the dose.
  await page.getByRole('button', { name: 'Save dose' }).click();
  await expect(page.getByText('Dose saved locally — will sync automatically when connected.')).toBeVisible();
  await expect(page.getByRole('button', { name: /Offline 1 pending/ })).toBeVisible();

  // Write 2: a new-patient registration (client-side navigation — the shell
  // is already loaded).
  await page.getByRole('link', { name: 'Register Patient' }).click();
  await expect(page.getByRole('heading', { name: 'Register Patient' })).toBeVisible();
  await page.getByLabel('Full name *').fill(regName);
  await page.getByRole('textbox', { name: 'Phone', exact: true }).fill(`055${String(Math.floor(10000000 + Math.random() * 89999999))}`);
  await page.getByText('I confirm this patient').click();
  await page.getByRole('button', { name: 'Register patient' }).click();
  await expect(page).toHaveURL(/\/app\/patients/);
  await expect(page.getByText('Patient saved locally — will sync automatically when connected.')).toBeVisible();
  await expect(page.getByRole('button', { name: /Offline 2 pending/ })).toBeVisible();

  // The outbox holds BOTH writes, each with its exact payload.
  const queued = await page.evaluate(
    () =>
      new Promise<{ count: number; types: { entityType?: string; vaccine?: string; dose?: string; fullName?: string }[] }>((resolve, reject) => {
        const req = indexedDB.open('gihm-offline');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const tx = req.result.transaction('outbox', 'readonly');
          const rows: { entityType?: string; payload?: { vaccine?: string; dose?: string; fullName?: string }; status?: string }[] = [];
          const cursor = tx.objectStore('outbox').openCursor();
          cursor.onsuccess = () => {
            const c = cursor.result;
            if (c) {
              rows.push(c.value as { entityType?: string; payload?: { vaccine?: string; dose?: string; fullName?: string }; status?: string });
              c.continue();
            } else {
              resolve({
                count: rows.length,
                types: rows.map((r) => ({ entityType: r.entityType, ...r.payload })),
              });
            }
          };
          cursor.onerror = () => reject(cursor.error);
        };
      }),
  );
  expect(queued.count).toBe(2);
  expect(queued.types.some((t) => t.entityType === 'immunization' && t.vaccine === 'PENTA' && t.dose === '1')).toBe(true);
  expect(queued.types.some((t) => t.entityType === 'patient' && t.fullName === regName)).toBe(true);

  // Reconnect: the whole outbox replays together.
  await page.context().setOffline(false);
  await expect(page.getByRole('button', { name: /Connected/ })).toBeVisible({ timeout: 20_000 });

  // Both writes landed exactly once: the new registration is searchable…
  await page.getByPlaceholder(/Search name/).fill(regName);
  await expect(page.getByRole('link', { name: regName })).toBeVisible({ timeout: 15_000 });

  // …and the child's dose is in the immunization registry.
  await page.getByRole('link', { name: 'Immunizations' }).click();
  await page.getByRole('button', { name: 'Registry' }).click();
  const doseRow = page.getByRole('row', { name: nameRe });
  await expect(doseRow).toBeVisible({ timeout: 15_000 });
  await expect(doseRow).toContainText('Dose 1');
});
