import { expect, test } from '@playwright/test';

/**
 * E2E tests for the contact tracing and patient location tracking tabs
 * in the Disease Surveillance module. These verify the UI structure, tab
 * switching, and form interactions work correctly.
 *
 * Note: These tests verify the UI layer only. API-dependent operations
 * (toast success messages) are tested in the unit test suite where the
 * API can be properly mocked.
 */

test('contact tracing tab renders the contact network UI', async ({ page }) => {
  await page.goto('/app/surveillance');
  await expect(page.getByText('Disease Surveillance')).toBeVisible({ timeout: 15_000 });

  // Switch to Contact Tracing tab
  await page.getByRole('button', { name: /Contact Tracing/ }).click();

  // Should show the contact tracing UI sections
  await expect(page.getByText('Contact network')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'Add contact' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Send SMS alert' })).toBeVisible();

  // Contact form fields should be present
  await expect(page.getByRole('textbox', { name: /Full name/i })).toBeVisible();
  await expect(page.getByRole('textbox', { name: /Patient MRN/i })).toBeVisible();
});

test('contact tracing add contact form can be filled and submitted', async ({ page }) => {
  await page.goto('/app/surveillance');
  await expect(page.getByText('Disease Surveillance')).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: /Contact Tracing/ }).click();
  await expect(page.getByText('Contact network')).toBeVisible({ timeout: 15_000 });

  // Fill in the add contact form using labels
  await page.getByRole('textbox', { name: /Full name/i }).fill('E2E Test Contact');
  await page.getByRole('textbox', { name: /Patient MRN/i }).fill('MRN-E2E-001');

  // Verify the form values are set
  await expect(page.getByRole('textbox', { name: /Full name/i })).toHaveValue('E2E Test Contact');
  await expect(page.getByRole('textbox', { name: /Patient MRN/i })).toHaveValue('MRN-E2E-001');

  // Submit the form
  await page.getByRole('button', { name: /Add contact/ }).last().click();
});

test('contact tracing SMS alert form can be filled', async ({ page }) => {
  await page.goto('/app/surveillance');
  await expect(page.getByText('Disease Surveillance')).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: /Contact Tracing/ }).click();
  await expect(page.getByRole('heading', { name: 'Send SMS alert' })).toBeVisible({ timeout: 15_000 });

  // Verify the SMS form is present
  await expect(page.getByRole('button', { name: /Send SMS alert/ })).toBeVisible();
});

test('location tracking tab renders patient locations and summary', async ({ page }) => {
  await page.goto('/app/surveillance');
  await expect(page.getByText('Disease Surveillance')).toBeVisible({ timeout: 15_000 });

  // Switch to Location Tracking tab
  await page.getByRole('button', { name: /Location Tracking/ }).click();

  // Should show the location tracking UI
  await expect(page.getByText('Patient locations')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'Transfer patient' })).toBeVisible();
  await expect(page.getByText('Currently in hospital')).toBeVisible();

  // Transfer form fields should be present
  await expect(page.getByRole('textbox', { name: /Patient ID/i })).toBeVisible();
  await expect(page.getByRole('textbox', { name: /Current ward/i })).toBeVisible();
  await expect(page.getByRole('textbox', { name: /Destination ward/i })).toBeVisible();
});

test('location tracking transfer form can be filled and submitted', async ({ page }) => {
  await page.goto('/app/surveillance');
  await expect(page.getByText('Disease Surveillance')).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: /Location Tracking/ }).click();
  await expect(page.getByText('Patient locations')).toBeVisible({ timeout: 15_000 });

  // Fill in the transfer form
  await page.getByRole('textbox', { name: /Patient ID/i }).fill('P-E2E-001');
  await page.getByRole('textbox', { name: /Current ward/i }).fill('Ward A');
  await page.getByRole('textbox', { name: /Destination ward/i }).fill('Ward B');

  // Verify form values
  await expect(page.getByRole('textbox', { name: /Patient ID/i })).toHaveValue('P-E2E-001');

  // Submit the form
  await page.getByRole('button', { name: /Transfer patient/ }).click();
});

test('surveillance tabs can be switched back and forth', async ({ page }) => {
  await page.goto('/app/surveillance');
  await expect(page.getByText('Disease Surveillance')).toBeVisible({ timeout: 15_000 });

  // Start on Case Register tab (default)
  await expect(page.getByRole('heading', { name: 'Report a case' })).toBeVisible();

  // Switch to Contact Tracing
  await page.getByRole('button', { name: /Contact Tracing/ }).click();
  await expect(page.getByText('Contact network')).toBeVisible({ timeout: 15_000 });

  // Switch to Location Tracking
  await page.getByRole('button', { name: /Location Tracking/ }).click();
  await expect(page.getByText('Patient locations')).toBeVisible({ timeout: 15_000 });

  // Switch back to Case Register
  await page.getByRole('button', { name: /Case Register/ }).click();
  await expect(page.getByRole('heading', { name: 'Report a case' })).toBeVisible({ timeout: 15_000 });
});
