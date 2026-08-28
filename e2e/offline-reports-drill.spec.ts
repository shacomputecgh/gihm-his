import { test, expect } from '@playwright/test';

/**
 * Offline reports drill (docs/26 §6c, docs/19 Tests B/E): the Reports page
 * mirrors its latest payloads into a local cache (IndexedDB), and when the
 * platform is unreachable it renders the snapshot — clearly labelled as a
 * cached snapshot, never mistaken for live data. Navigation is client-side
 * (a hard reload couldn't fetch the SPA while offline), which is exactly how
 * a clinician keeps working with no connection.
 */
test('reports fall back to the locally cached snapshot when the platform is unreachable', async ({ page }) => {
  // Load the reports page ONLINE — live indicators render and the latest
  // snapshot is mirrored into the local report cache.
  await page.goto('/app/reports');
  await expect(page.getByRole('heading', { name: 'Reports & analytics' })).toBeVisible();
  await expect(page.getByText('DHIMS-II indicators')).toBeVisible({ timeout: 20_000 });

  // The snapshot is really in IndexedDB (gihm-report-cache).
  const cached = await page.evaluate(
    () =>
      new Promise<number>((resolve, reject) => {
        const req = indexedDB.open('gihm-report-cache');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const tx = req.result.transaction('snapshots', 'readonly');
          const countReq = tx.objectStore('snapshots').count();
          countReq.onsuccess = () => resolve(countReq.result);
          countReq.onerror = () => reject(countReq.error);
        };
      }),
  );
  expect(cached).toBeGreaterThanOrEqual(1);

  // Leave the page, cut the network, come back via client-side navigation —
  // the mount-time load fails and the page renders the cached snapshot with
  // the honest banner.
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await page.context().setOffline(true);
  await page.getByRole('link', { name: 'Reports' }).click();
  await expect(page).toHaveURL(/\/app\/reports/);

  // Cached figures render, clearly marked as a snapshot — not an empty state.
  await expect(page.getByText(/Showing the locally cached snapshot from/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText('DHIMS-II indicators')).toBeVisible();

  // Reconnect: a fresh load gets live data and the banner clears.
  await page.context().setOffline(false);
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Reports' }).click();
  await expect(page.getByText('DHIMS-II indicators')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/Showing the locally cached snapshot from/)).toHaveCount(0);
});
