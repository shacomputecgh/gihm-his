import { expect, test } from '@playwright/test';

test('public portal: Find Healthcare search, sector and geography filters work', async ({ page }) => {
  // Find Healthcare — the public directory.
  await page.goto('/find-healthcare');
  await expect(page.getByRole('heading', { name: /Find|Healthcare|Facilities/i }).first()).toBeVisible({ timeout: 15_000 });

  // Facility cards appear (the seeded catalog).
  const cards = page.locator('a[href^="/facilities/"]');
  await expect(cards.first()).toBeVisible({ timeout: 15_000 });
  expect(await cards.count()).toBeGreaterThanOrEqual(1);

  // Name search narrows to the seeded Korle-Bu teaching hospital.
  await page.getByLabel('Search').fill('Korle-Bu');
  await expect(page.getByText(/1 facility in view/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('link', { name: /Korle-Bu Teaching Hospital/ })).toBeVisible();

  // Clear the search, then filter by the private sector — every card shows
  // the 💼 Private badge and none show the government badge.
  await page.getByLabel('Search').fill('');
  await expect(page.getByText(/facilities in view/)).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: '💼 Private' }).click();
  await expect(cards.first()).toBeVisible({ timeout: 15_000 });
  await expect(cards.getByText('💼 Private').first()).toBeVisible();
  await expect(cards.getByText('🏛 Government')).toHaveCount(0);

  // Reset the sector, then drill into geography: region enables the district
  // select, and the seeded Korle-Bu district filters the cards further.
  await page.getByRole('button', { name: 'All sectors' }).click();
  await expect(cards.first()).toBeVisible({ timeout: 15_000 });

  await page.getByRole('combobox', { name: 'Region', exact: true }).selectOption({ label: 'Greater Accra' });
  await expect(page.getByText(/in Greater Accra/)).toBeVisible({ timeout: 15_000 });
  const district = page.getByRole('combobox', { name: 'District', exact: true });
  await expect(district).toBeEnabled();
  await district.selectOption({ label: 'Accra Metropolitan' });
  await expect(cards.first()).toBeVisible({ timeout: 15_000 });
  await expect(cards.getByText('Accra Metropolitan').first()).toBeVisible();

  // Open the seeded Korle-Bu profile (still in scope under the filters) and
  // verify its deterministic content: name, services + departments sections.
  await page.getByRole('link', { name: /Korle-Bu Teaching Hospital/ }).click();
  await expect(page).toHaveURL(/\/facilities\/[0-9a-f-]+/, { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'Korle-Bu Teaching Hospital' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'Departments' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Services' })).toBeVisible();
  await expect(page.getByText('Outpatient Department', { exact: true })).toBeVisible();
  await expect(page.getByText('Bed capacity', { exact: true })).toBeVisible();
});
