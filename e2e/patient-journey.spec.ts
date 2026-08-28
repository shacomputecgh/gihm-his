import { expect, test, type Page, type APIRequestContext } from '@playwright/test';

/**
 * GIHM-HIS end-to-end clinical journey.
 *
 * Drives the exact path committed to in the testing strategy:
 *   registration → OPD encounter → prescription → lab → discharge → billing
 *
 * Uses the seeded Korle-Bu hospital admin (hospital@demo.gh / Demo@123) which
 * carries every permission, so a single session can walk the whole care path
 * the way a real facility administrator would.
 */

const BASE = 'http://localhost:4000';

// Uniqueness per run: timestamp + random suffix guards against same-ms
// collisions and repeat runs tripping the MPI duplicate 409 on the demo DB.
const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
const PATIENT_NAME = `E2E Journey ${stamp}`;
const PHONE = `055${String(stamp).replace(/\D/g, '').slice(-7)}`;
const TEST = 'Full Blood Count';
const MEDICINE = 'Paracetamol 500mg';

let patientId = '';

async function registerPatient(page: Page) {
  await page.goto('/app/register');
  await page.getByLabel('Full name *').fill(PATIENT_NAME);
  await page.getByLabel('Date of birth').fill('1995-06-15');
  await page.getByLabel('Sex').selectOption({ label: 'Female' });
  await page.getByPlaceholder('0244 000 000').fill(PHONE);
  await page.getByLabel('Nationality').fill('Ghanaian');
  await page.getByText(/informed consent for treatment/i).click();
  await page.getByRole('button', { name: 'Register patient' }).click();
  // Registration navigates straight to the new patient record.
  await expect(page).toHaveURL(/\/app\/patients\/[0-9a-f-]+/, { timeout: 20_000 });
  patientId = page.url().split('/').pop()!;
  await expect(page.getByText(PATIENT_NAME).first()).toBeVisible();
}

async function openOpdEncounter(page: Page) {
  await page.getByLabel('Presenting complaint').fill('Fever and headache for 3 days');
  await page.getByLabel('Triage category').selectOption({ label: 'Urgent' });
  await page.getByLabel('Temp (°C)').fill('38.5');
  await page.getByLabel('Pulse').fill('96');
  await page.getByRole('button', { name: 'Open encounter' }).click();
  // Encounter select in the prescription form gains the new encounter.
  const rxForm = page.locator('form').filter({ has: page.getByPlaceholder('Paracetamol 500mg') });
  await expect(rxForm.getByLabel('Encounter').locator('option')).toHaveCount(2, { timeout: 15_000 });
}

async function writePrescription(page: Page) {
  const rxForm = page.locator('form').filter({ has: page.getByPlaceholder('Paracetamol 500mg') });
  await rxForm.getByLabel('Encounter').selectOption({ index: 1 });
  await rxForm.getByLabel('Medicine').fill(MEDICINE);
  await rxForm.getByLabel('Dosage').fill('1 tablet');
  await rxForm.getByLabel('Frequency').fill('TDS');
  await rxForm.getByLabel('Qty').fill('10');
  await rxForm.getByRole('button', { name: 'Prescribe' }).click();
  // Persisted — the Medications tab count increments to 1.
  await expect(page.getByRole('button', { name: /Medications \(1\)/ })).toBeVisible({ timeout: 15_000 });
}

async function orderLabTest(page: Page) {
  const labForm = page.locator('form').filter({ has: page.getByPlaceholder('Full Blood Count') });
  await labForm.getByLabel('Encounter').selectOption({ index: 1 });
  await labForm.getByLabel('Test').fill(TEST);
  await labForm.getByLabel('Discipline').selectOption({ label: 'HAEMATOLOGY' });
  await labForm.getByRole('button', { name: 'Order test' }).click();
  await expect(page.getByRole('button', { name: /Laboratory \(1\)/ })).toBeVisible({ timeout: 15_000 });
}

async function verifyLabResult(page: Page) {
  await page.goto('/app/lab');
  await expect(page.getByRole('heading', { name: 'Laboratory' })).toBeVisible();
  const row = page.locator('button', { hasText: TEST }).filter({ hasText: PATIENT_NAME }).first();
  await row.click();
  await page.getByRole('textbox', { name: 'Result' }).fill('Hb 13.1 g/dL, WBC 6.2 x10^9/L — normal');
  await page.getByRole('button', { name: 'Verify & release result' }).click();
  // Result released — badge flips to VERIFIED.
  await expect(page.getByText('VERIFIED').first()).toBeVisible({ timeout: 15_000 });
}

async function dispenseAtPharmacy(page: Page) {
  await page.goto('/app/pharmacy');
  await expect(page.getByRole('heading', { name: 'Pharmacy' })).toBeVisible();
  const row = page.locator('tr', { hasText: PATIENT_NAME });
  await row.getByRole('button', { name: 'Dispense' }).click();
  // The "To dispense" worklist drops the row once dispensed — switch to
  // "All prescriptions" and confirm the terminal DISPENSED badge.
  await page.getByRole('button', { name: 'All prescriptions' }).click();
  const allRow = page.locator('tr', { hasText: PATIENT_NAME });
  await expect(allRow.getByText('DISPENSED')).toBeVisible({ timeout: 15_000 });
}

async function admitAndDischarge(page: Page) {
  await page.goto('/app/admissions');
  await expect(page.getByRole('heading', { name: 'Admissions' })).toBeVisible();
  await page.getByRole('button', { name: 'New Admission' }).click();

  // Step 1 — search the existing patient instead of re-registering.
  await page.getByPlaceholder('Search by name or MRN…').fill(PATIENT_NAME);
  await page.getByRole('button', { name: 'Search' }).click();
  await page.locator('button', { hasText: PATIENT_NAME }).first().click();
  await expect(page.getByText('Existing patient — identification fields below are read-only context.')).toBeVisible();

  // Advance through Admission / Medical / Insurance / Consent steps
  // (defaults are fine — payment defaults to NHIS for a Ghanaian patient).
  for (let i = 0; i < 4; i++) {
    await page.getByRole('button', { name: 'Next →' }).click();
  }
  // Final step — consent required, then confirm.
  await page.locator('label', { hasText: 'Patient consent & declaration' }).locator('input[type=checkbox]').check();
  await page.getByRole('button', { name: 'Confirm admission' }).click();

  // Drawer opens with the new admission — discharge from there.
  await expect(page.getByLabel('Discharge summary *')).toBeVisible({ timeout: 15_000 });
  await page.getByLabel('Discharge summary *').fill('Fever resolved; discharged on paracetamol with review in one week.');
  await page.getByRole('button', { name: 'Discharge patient' }).click();
  await expect(page.getByText('DISCHARGED').first()).toBeVisible({ timeout: 15_000 });
}

/** Create a PAID invoice for the journey patient via the sync API, then
 *  verify it renders in the patient's Bills tab. */
async function verifyBilling(page: Page, request: APIRequestContext) {
  const token = await page.evaluate(() => localStorage.getItem('gihm_token'));
  const res = await request.post(`${BASE}/api/v1/sync/mutations`, {
    headers: { authorization: `Bearer ${token}` },
    data: {
      deviceId: 'e2e-billing',
      mutations: [
        {
          transactionId: `e2e-inv-${stamp}`,
          entityType: 'invoice',
          operation: 'CREATE',
          payload: {
            patientId,
            items: [{ description: 'Consultation fee', amount: 250 }],
            amount: 250,
            paidAmount: 250,
            status: 'PAID',
            paymentMethod: 'CASH',
          },
          idempotencyKey: `e2e-inv-${stamp}`,
          clientTimestamp: new Date().toISOString(),
        },
      ],
    },
  });
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as { processed?: number; results?: { status: string }[] };
  expect(body.processed).toBe(1);
  expect(body.results?.[0]?.status).toBe('PROCESSED');

  await page.goto(`/app/patients/${patientId}`);
  await page.getByRole('button', { name: /Bills \(1\)/ }).click();
  await expect(page.getByText('GH₵ 250.00').first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('PAID').first()).toBeVisible();

  // The triage category captured at the OPD encounter rides on the record.
  await page.getByRole('button', { name: /Encounters \(1\)/ }).click();
  await expect(page.getByText('URGENT', { exact: true })).toBeVisible({ timeout: 15_000 });
}

test('full clinical journey: register → OPD → prescription → lab → discharge → billing', async ({ page, request }) => {
  await registerPatient(page);
  await openOpdEncounter(page);
  await writePrescription(page);
  await orderLabTest(page);
  await verifyLabResult(page);
  await dispenseAtPharmacy(page);
  await admitAndDischarge(page);
  await verifyBilling(page, request);
});
