import { expect, test } from '@playwright/test';

// Uses the shared hospital-admin session (auth.setup) — facility scope still
// renders Korle-Bu's marker, which is all this smoke check needs.
test('GIS page renders the Leaflet map with facility markers', async ({ page }) => {
  await page.goto('/app/gis');
  await expect(page.getByRole('heading', { name: /Facility map|GIS/i })).toBeVisible({ timeout: 15_000 });
  // Leaflet mounts its map container with marker panes. The page draws
  // circleMarkers as SVG paths in the overlay pane (not icon images).
  await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('.leaflet-overlay-pane path').first()).toBeVisible({ timeout: 15_000 });
  const markers = await page.locator('.leaflet-overlay-pane path').count();
  console.log('GIS markers rendered:', markers);
  expect(markers).toBeGreaterThanOrEqual(1);
});

test('GIS choropleth overlay shades areas by indicator', async ({ page }) => {
  await page.goto('/app/gis');
  await expect(page.getByRole('heading', { name: /Facility map|GIS/i })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 15_000 });

  // Switch the layer from facility markers to the choropleth overlay.
  await page.getByText('Choropleth', { exact: true }).click();
  // The overlay legend renders with the quantile shading note and bucket rows.
  await expect(page.getByText(/Shaded by/i)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Granularity/i)).toBeVisible();
  // Overlay bubbles replace the markers in the SVG pane.
  await expect(page.locator('.leaflet-overlay-pane path').first()).toBeVisible({ timeout: 15_000 });
  const bubbles = await page.locator('.leaflet-overlay-pane path').count();
  console.log('GIS overlay bubbles rendered:', bubbles);
  expect(bubbles).toBeGreaterThanOrEqual(1);

  // Drill to district granularity — the legend tracks the new area view.
  await page.getByText('District', { exact: true }).click();
  await expect(page.getByText(/across \d+ district/i)).toBeVisible({ timeout: 15_000 });
});
