import { expect, test } from '@playwright/test';

/**
 * Behavioral check for the AI Services page (docs/22 Phase 7, spec §82–83).
 * The pages-smoke spec only asserts the heading; this drives all three
 * deterministic services against the seeded data and verifies the mandatory
 * "AI-generated — requires professional verification" disclosure on every
 * output:
 *
 *   - documentation assist: pick the seeded patient, choose an encounter,
 *     generate a draft note → disclosure + SOAP draft with record-derived
 *     content
 *   - duplicate review: the seeded Ama Serwaa Mensah pair → ranked candidate
 *     with matched-on chips
 *   - forecasting: OPD attendance projection → disclosure + 3 monthly rows
 *
 * All flows are read-only (drafts are never written to the record).
 */
test('ai services render deterministic outputs with the required disclosure', async ({ page }) => {
  await page.goto('/app/ai');

  await expect(page.getByText('AI Services').first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Documentation assist', { exact: true })).toBeVisible();
  await expect(page.getByText('Duplicate review', { exact: true })).toBeVisible();
  await expect(page.getByText('Forecasting', { exact: true })).toBeVisible();

  // -------------------------------------------------- documentation assist
  // Of the seeded Ama Serwaa Mensah pair, GH-000043 carries the encounters
  // (the draft needs one) — pick it explicitly by MRN.
  await page.getByPlaceholder('Find the patient for the note draft').fill('Ama Serwaa Mensah');
  await page.getByRole('button', { name: 'Search' }).first().click();
  await page.getByText('GH-000043').click();
  const encounterSelect = page.getByLabel('Encounter');
  await expect(encounterSelect).toBeVisible({ timeout: 15_000 });
  await encounterSelect.selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Generate draft note' }).click();
  await expect(page.getByText(/AI-generated — requires professional verification/).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('DRAFT CLINICAL NOTE')).toBeVisible();
  await expect(page.getByText('S — Subjective')).toBeVisible();
  await expect(page.getByText('P — Plan')).toBeVisible();

  // ------------------------------------------------------- duplicate review
  // GH-000044 is the twin with no encounters — reviewing it must surface
  // GH-000043 as the top candidate.
  await page.getByPlaceholder('Find the patient to check for duplicates').fill('Ama Serwaa Mensah');
  await page.getByRole('button', { name: 'Search' }).nth(1).click();
  await page.getByText('GH-000044').click();
  await page.getByRole('button', { name: 'Run duplicate review' }).click();
  await expect(page.getByText(/AI-generated — requires professional verification/).nth(1)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('top match')).toBeVisible();
  await expect(page.getByText('GH-000043').first()).toBeVisible();

  // ------------------------------------------------------------ forecasting
  await page.getByRole('button', { name: 'Run forecast' }).click();
  await expect(page.getByText(/AI-generated — requires professional verification/).nth(2)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('table')).toBeVisible();
  // Default indicator is OPD attendance, 3 months ahead → three rows.
  await expect(page.getByRole('row')).toHaveCount(4); // header + 3 months
});
