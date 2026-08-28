import { expect, test, type Page, type APIRequestContext } from '@playwright/test';

/**
 * OPD queue lifecycle — WAITING → IN_SERVICE → COMPLETED.
 *
 * Registration feeds the department queue via the check-in API (there is no
 * separate check-in screen; the Queue page "How it works" panel says exactly
 * this). We register a fresh patient in the UI, check them in through the
 * same API the client uses, then drive the ticket lifecycle on the queue
 * board: Start → Complete, and confirm the served ticket is retained.
 */

const BASE = 'http://localhost:4000';

// Unique identity per register call — timestamp + random suffix guards against
// same-ms collisions, repeat runs, AND a second test in this file reusing the
// same name/phone (which would trip the MPI duplicate 409 on the demo DB).
function uniquePatient() {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  return { name: `E2E Queue ${stamp}`, phone: `056${String(stamp).replace(/\D/g, '').slice(-7)}` };
}

async function registerPatient(page: Page, identity = uniquePatient()): Promise<string> {
  await page.goto('/app/register');
  await page.getByLabel('Full name *').fill(identity.name);
  await page.getByLabel('Date of birth').fill('1998-11-02');
  await page.getByLabel('Sex').selectOption({ label: 'Male' });
  await page.getByPlaceholder('0244 000 000').fill(identity.phone);
  await page.getByText(/informed consent for treatment/i).click();
  await page.getByRole('button', { name: 'Register patient' }).click();
  await expect(page).toHaveURL(/\/app\/patients\/[0-9a-f-]+/, { timeout: 20_000 });
  return page.url().split('/').pop()!;
}

/** Check the patient into a department queue via the API the client uses. */
async function checkInToQueue(page: Page, request: APIRequestContext, patientId: string, ticketPrefix: string): Promise<{ ticket: string; departmentId: string }> {
  const token = await page.evaluate(() => localStorage.getItem('gihm_token'));
  const auth = { authorization: `Bearer ${token}` };

  // Reuse the department from an existing seeded queue entry. The seed
  // (apps/api/prisma/seed.ts) always creates OUT-/PHA-/LAB- tickets for
  // Korle-Bu's departments — that is the only seed data this spec depends on.
  const queueRes = await request.get(`${BASE}/api/v1/queue`, { headers: auth });
  expect(queueRes.ok()).toBeTruthy();
  const { entries } = (await queueRes.json()) as { entries: { departmentId: string; ticket: string }[] };
  const seeded = entries.find((e) => e.ticket.startsWith(ticketPrefix));
  expect(seeded, `no seeded ${ticketPrefix} queue entry — reseed the demo DB before running e2e`).toBeTruthy();

  const res = await request.post(`${BASE}/api/v1/queue`, {
    headers: auth,
    data: { departmentId: seeded!.departmentId, patientId },
  });
  expect(res.ok()).toBeTruthy();
  const { entry } = (await res.json()) as { entry: { ticket: string } };
  return { ticket: entry.ticket, departmentId: seeded!.departmentId };
}

/** Switch the board to a department tab and assert the ticket is listed there. */
async function expectTicketOnBoard(page: Page, tab: string, ticket: string) {
  await page.goto('/app/queue');
  await expect(page.getByRole('heading', { name: 'Queue Management' })).toBeVisible();
  await page.getByRole('button', { name: tab }).click();
  await expect(page.getByText(ticket).first()).toBeVisible({ timeout: 15_000 });
}

async function startAndCompleteTicket(page: Page, ticket: string, patientName: string) {
  await page.goto('/app/queue');
  await expect(page.getByRole('heading', { name: 'Queue Management' })).toBeVisible();

  const waitingRow = page.locator('li', { hasText: patientName }).filter({ hasText: ticket });
  await expect(waitingRow).toBeVisible({ timeout: 15_000 });
  await waitingRow.getByRole('button', { name: 'Start' }).click();

  // Moves to "In service" — complete it there.
  const inService = page.locator('li, tr', { hasText: patientName }).filter({ hasText: ticket });
  await expect(inService.getByRole('button', { name: 'Complete' })).toBeVisible({ timeout: 15_000 });
  await inService.getByRole('button', { name: 'Complete' }).click();

  // Served today retains the struck-through ticket chip.
  await expect(page.getByText(ticket).first()).toBeVisible({ timeout: 15_000 });
}

test('OPD queue lifecycle: register → check in → start → complete', async ({ page, request }) => {
  const identity = uniquePatient();
  const patientId = await registerPatient(page, identity);
  const { ticket } = await checkInToQueue(page, request, patientId, 'OUT-');
  await startAndCompleteTicket(page, ticket, identity.name);
});

test('department tabs isolate the board — a Pharmacy check-in appears only under Pharmacy', async ({ page, request }) => {
  const identity = uniquePatient();
  const patientId = await registerPatient(page, identity);
  const { ticket } = await checkInToQueue(page, request, patientId, 'PHA-');

  // Pharmacy tab shows the ticket.
  await expectTicketOnBoard(page, 'Pharmacy', ticket);

  // The OPD board must NOT show a Pharmacy ticket.
  await page.getByRole('button', { name: 'Outpatient' }).click();
  await expect(page.getByText(ticket)).not.toBeVisible();
});

test('skip removes a waiting ticket from the board', async ({ page, request }) => {
  const identity = uniquePatient();
  const patientId = await registerPatient(page, identity);
  const { ticket } = await checkInToQueue(page, request, patientId, 'LAB-');

  await page.goto('/app/queue');
  await expect(page.getByRole('heading', { name: 'Queue Management' })).toBeVisible();
  await page.getByRole('button', { name: 'Laboratory' }).click();

  // The ticket is waiting; Skip removes it from the waiting list.
  const waitingRow = page.locator('li', { hasText: identity.name }).filter({ hasText: ticket });
  await expect(waitingRow).toBeVisible({ timeout: 15_000 });
  await waitingRow.getByRole('button', { name: 'Skip' }).click();
  await expect(waitingRow).not.toBeVisible({ timeout: 15_000 });

  // Skipped tickets are not served — absent from the served chip row too.
  await expect(page.getByText(ticket)).not.toBeVisible();
});

test('call-next moves the oldest waiting ticket into service on the board', async ({ page, request }) => {
  const identity = uniquePatient();
  const patientId = await registerPatient(page, identity);
  const { departmentId } = await checkInToQueue(page, request, patientId, 'OUT-');

  // Call next through the API the board relies on — it promotes the oldest
  // WAITING ticket to CALLED (which the board renders as "In service").
  const token = await page.evaluate(() => localStorage.getItem('gihm_token'));
  const auth = { authorization: `Bearer ${token}` };
  const callRes = await request.post(`${BASE}/api/v1/queue/${departmentId}/call-next`, { headers: auth });
  expect(callRes.ok()).toBeTruthy();
  const { entry: called } = (await callRes.json()) as { entry: { ticket: string; status: string } };
  expect(called.status).toBe('CALLED');

  await page.goto('/app/queue');
  await expect(page.getByRole('heading', { name: 'Queue Management' })).toBeVisible();

  // The called ticket sits in the "In service" card with a Complete button.
  const inService = page.locator('li', { hasText: called.ticket });
  await expect(inService).toBeVisible({ timeout: 15_000 });
  await expect(inService.getByRole('button', { name: 'Complete' })).toBeVisible();
});
