import { expect, test } from '@playwright/test';

/**
 * Smoke test for the pages added in the Phase-6 batch. The GIS bug (map never
 * initializing because an empty-deps effect read a ref before its container
 * rendered) proved these pages need real browser coverage — a page can render
 * its chrome while a whole section silently fails to mount. Each route is
 * visited and asserted to show its page heading.
 *
 * Uses the shared pre-authenticated session from auth.setup (the login route
 * is rate-limited to 10/min/IP).
 */

const PAGES: { route: string; heading: RegExp }[] = [
  { route: '/app', heading: /7-day patient activity/i },
  // Core clinical
  { route: '/app/patients', heading: /Patient Registry/i },
  { route: '/app/appointments', heading: /Appointments/i },
  { route: '/app/referrals', heading: /Referral network/i },
  { route: '/app/immunizations', heading: /Immunization registry/i },
  { route: '/app/stock', heading: /Stock & Inventory/i },
  // Facility operations
  { route: '/app/beds', heading: /Bed management/i },
  { route: '/app/ambulances', heading: /Ambulance fleet/i },
  { route: '/app/bloodbank', heading: /Blood bank/i },
  { route: '/app/theatre', heading: /Theatre & surgery/i },
  { route: '/app/directorate', heading: /Health directorate/i },
  // Phase-6 batch
  { route: '/app/admissions', heading: /Admissions|Admission/i },
  { route: '/app/assets', heading: /Assets|Fixed assets/i },
  { route: '/app/insurance', heading: /Insurance|Claims/i },
  { route: '/app/surveillance', heading: /Surveillance|Disease/i },
  { route: '/app/reports', heading: /Reports|Indicators/i },
  { route: '/app/integrations', heading: /Integrations|Adapters|DHIMS/i },
  { route: '/app/admin', heading: /Administration/i },
];

test('new batch pages render their headings', async ({ page }) => {
  // No error boundary in the app — a mount crash would blank the whole tree,
  // so the heading appearing is a real signal the page mounted.
  for (const p of PAGES) {
    await page.goto(p.route);
    await expect(page.getByRole('heading', { name: p.heading }).first()).toBeVisible({ timeout: 15_000 });
  }
});
