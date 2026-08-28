import { test as setup, expect } from '@playwright/test';

/**
 * Shared login for the whole E2E run. The login route is rate-limited to
 * 10/min/IP, so logging in once per test would be flaky (a full run does
 * several specs). One login here, saved to storage state, and every spec
 * starts already authenticated.
 */
const AUTH_FILE = 'e2e/.auth/hospital.json';
const PATIENT_AUTH_FILE = 'e2e/.auth/patient.json';
const DEVELOPER_AUTH_FILE = 'e2e/.auth/developer.json';
const REGIONAL_AUTH_FILE = 'e2e/.auth/regional.json';
const NATIONAL_AUTH_FILE = 'e2e/.auth/national.json';
const DISTRICT_AUTH_FILE = 'e2e/.auth/district.json';

setup('authenticate as hospital admin', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('hospital@demo.gh');
  await page.getByLabel('Password').fill('Demo@123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/app/, { timeout: 20_000 });
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  await page.context().storageState({ path: AUTH_FILE });
});

// Second session for the patient portal spec (e2e/patient-portal.spec.ts).
// The login page routes a PATIENT-scope user straight to /patient.
setup('authenticate as patient', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('patient@demo.gh');
  await page.getByLabel('Password').fill('Demo@123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/patient/, { timeout: 20_000 });
  await expect(page.getByText('My Health Portal')).toBeVisible();
  await page.context().storageState({ path: PATIENT_AUTH_FILE });
});

// Third session for the developer-mode spec (e2e/developer-check.spec.ts). The
// DEVELOPER role is the only one with developer_mode (docs/25) — the page's
// data endpoints 403 for every other role.
setup('authenticate as platform developer', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('developer@demo.gh');
  await page.getByLabel('Password').fill('Demo@123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/app/, { timeout: 20_000 });
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  await page.context().storageState({ path: DEVELOPER_AUTH_FILE });
});

// Fourth session for the regional-director spec (e2e/directorate-regional-check.spec.ts).
// The Ashanti Regional Director (REGIONAL scope) sees the directorate at the
// district level with drill-down — the FACILITY-scope hospital session cannot
// exercise that view.
setup('authenticate as regional director', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('regional@demo.gh');
  await page.getByLabel('Password').fill('Demo@123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/app/, { timeout: 20_000 });
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  await page.context().storageState({ path: REGIONAL_AUTH_FILE });
});

// Fifth session for the national-scope spec (e2e/directorate-national-check.spec.ts).
// The National Admin (NATIONAL scope) sees the directorate at the region level
// with drill-down region → district → facility — only a NATIONAL-scope session
// can exercise the top of that hierarchy.
setup('authenticate as national admin', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@demo.gh');
  await page.getByLabel('Password').fill('Demo@123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/app/, { timeout: 20_000 });
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  await page.context().storageState({ path: NATIONAL_AUTH_FILE });
});

// Sixth session for the district-scope spec (e2e/directorate-district-check.spec.ts).
// The Kumasi Metropolitan District Director (DISTRICT scope) sees the
// directorate at the facility level — their district's facilities — without
// drill-down. Only a DISTRICT-scope session can exercise that view.
setup('authenticate as district director', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('district@demo.gh');
  await page.getByLabel('Password').fill('Demo@123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/app/, { timeout: 20_000 });
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  await page.context().storageState({ path: DISTRICT_AUTH_FILE });
});
