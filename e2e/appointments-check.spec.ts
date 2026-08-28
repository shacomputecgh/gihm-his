import { expect, test } from '@playwright/test';

/**
 * Behavioral check for the Appointments page (core clinical). The smoke spec
 * only asserts the heading; this books an appointment for today through the
 * form and asserts the reloaded schedule gains a BOOKED row:
 *
 *   - the patient select loads the registry (≥1 seeded patient)
 *   - booking with the default service posts and the count of BOOKED rows
 *     on today's schedule increases by exactly one
 *
 * Deterministic: the date filter defaults to today, the book form defaults to
 * the current day/time, and the API creates bookings as BOOKED.
 */

/** Local "YYYY-MM-DDTHH:mm" (datetime-local format) for right now. */
function localNow(): string {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

test('booking an appointment adds a BOOKED row to today\'s schedule', async ({ page }) => {
  await page.goto('/app/appointments');

  // The book form loads with at least one real patient (option elements are
  // hidden inside a closed select, so poll the option count rather than
  // asserting visibility).
  const patientSelect = page.getByLabel('Patient');
  await expect(patientSelect).toBeVisible({ timeout: 15_000 });
  await expect.poll(() => patientSelect.locator('option').count()).toBeGreaterThan(1);

  // Book for now (today) with the default General OPD service.
  const bookedBefore = await page.getByText('BOOKED', { exact: true }).count();
  await patientSelect.selectOption({ index: 1 });
  await page.getByLabel('Date & time').fill(localNow());
  await page.getByRole('button', { name: 'Book' }).click();

  // The reloaded schedule shows exactly one more BOOKED row.
  await expect(page.getByText('BOOKED', { exact: true })).toHaveCount(bookedBefore + 1, { timeout: 15_000 });
});
