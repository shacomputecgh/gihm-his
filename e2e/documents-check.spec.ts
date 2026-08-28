import { expect, test } from '@playwright/test';

/**
 * Behavioral check for the digital folder (patient documents): register a
 * fresh patient, open the Documents tab on their record, and upload a file —
 * asserting the success toast and that the document appears in the folder
 * list (upload POST → prepend render).
 */
test('uploading a document adds it to the patient digital folder', async ({ page }) => {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const name = `E2E Doc Patient ${stamp}`;

  // Register a fresh patient (unique name avoids the MPI duplicate 409) —
  // the register flow lands on the patient detail page.
  await page.goto('/app/register');
  await page.getByLabel('Full name *').fill(name);
  await page.getByLabel('Date of birth').fill('1998-11-02');
  await page.getByLabel('Sex').selectOption({ label: 'Male' });
  await page.getByPlaceholder('0244 000 000').fill(`057${String(stamp).replace(/\D/g, '').slice(-7)}`);
  await page.getByText(/informed consent for treatment/i).click();
  await page.getByRole('button', { name: 'Register patient' }).click();
  await expect(page).toHaveURL(/\/app\/patients\/[0-9a-f-]+/, { timeout: 20_000 });

  // Open the Documents tab (Segmented button) and upload via the hidden input.
  await page.getByRole('button', { name: /Documents \(\d+\)/ }).click();
  const addCard = page.locator('div.rounded-xl', { hasText: 'Add a document' });
  await expect(addCard).toBeVisible({ timeout: 15_000 });
  await page.getByLabel('Notes (optional)').fill('E2E upload check');
  await addCard.locator('input[type="file"]').setInputFiles({
    name: 'e2e-note.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('E2E digital folder note'),
  });

  // Success toast + the document appears in the folder list (exact match —
  // the toast also contains the filename inside its sentence).
  await expect(page.locator('div.fade-in.pointer-events-auto', { hasText: /added to the folder/ })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('e2e-note.txt', { exact: true })).toBeVisible();
});
