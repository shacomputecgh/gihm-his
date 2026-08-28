import { expect, test } from '@playwright/test';

/**
 * Behavioral check for the Theatre & surgery page: book a surgical case
 * (patient search → unique procedure) and record informed consent for it.
 * The procedure is unique per run, so the case row can be targeted
 * deterministically and repeat runs never collide.
 */
test('booking a surgical case and recording consent succeeds', async ({ page }) => {
  const procedure = `E2E Appendicectomy ${Date.now()}`;

  await page.goto('/app/theatre');

  // Open the booking form (the header action is the first "Book case").
  await page.getByRole('button', { name: 'Book case' }).first().click();
  const search = page.getByPlaceholder('Search patient…');
  await expect(search).toBeVisible({ timeout: 15_000 });

  // Patient search → pick (defaults: Theatre 1, Routine).
  await search.fill('Ama');
  await page.locator('button', { hasText: /Ama/ }).first().click();
  await page.getByLabel('Procedure').fill(procedure);

  // Submit — the form's submit shares the header's name, so scope to the card.
  await page
    .locator('div.rounded-xl', { hasText: 'Book surgical case' })
    .getByRole('button', { name: 'Book case' })
    .click();

  // The case appears in the list with the unique procedure (form closes).
  await expect(page.getByText(procedure, { exact: true })).toBeVisible({ timeout: 15_000 });

  // Record consent on the new case.
  const consentBtn = page.locator('div.rounded-xl', { hasText: procedure }).getByRole('button', { name: 'Record consent' });
  await expect(consentBtn).toBeVisible();
  await consentBtn.click();
  await page.getByLabel('Consent note').fill('Informed consent signed (E2E)');
  await page
    .locator('div.rounded-2xl', { hasText: 'Record informed consent' })
    .getByRole('button', { name: 'Record consent' })
    .click();

  // The case now carries the Consented badge.
  await expect(
    page.locator('div.rounded-xl', { hasText: procedure }).getByText('Consented', { exact: true }),
  ).toBeVisible({ timeout: 15_000 });
});
