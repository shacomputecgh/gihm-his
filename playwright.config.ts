import { defineConfig, devices } from '@playwright/test';

/**
 * GIHM-HIS end-to-end tests.
 *
 * The journey spec (e2e/patient-journey.spec.ts) drives the full clinical
 * path the testing strategy commits to (docs/19-testing-strategy.md):
 *   registration → OPD encounter → prescription → lab → discharge → billing.
 *
 * The dev stack is two servers: the Vite web app (5173) proxying /api to the
 * Fastify API (4000). `npm run dev` starts both via concurrently — Playwright
 * boots it when nothing is listening, and reuses an already-running stack
 * (reuseExistingServer) so local iteration stays fast.
 *
 * Uses the system Chrome install (channel: 'chrome') — no separate browser
 * download needed on machines with Chrome/Chromium present. On CI without
 * Chrome, run `npx playwright install chromium` and drop the channel line.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1, // one journey at a time — the API runs on a shared demo DB
  retries: process.env.CI ? 1 : 0,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [['list']] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    channel: 'chrome',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Three logins per run (the login route is rate-limited to 10/min/IP), saved
    // to storage state and reused by every spec below.
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    { name: 'chromium', use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/hospital.json' }, dependencies: ['setup'], testIgnore: /patient-portal\.spec\.ts|developer-check\.spec\.ts|directorate-regional-check\.spec\.ts|directorate-national-check\.spec\.ts|directorate-district-check\.spec\.ts|dashboard-district-check\.spec\.ts|reports-gis-scope-check\.spec\.ts/ },
    // The patient portal spec runs under its own session — a staff session
    // would be bounced off /patient, and a patient session must not see /app.
    { name: 'patient', use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/patient.json' }, dependencies: ['setup'], testMatch: /patient-portal\.spec\.ts/ },
    // The developer-mode spec runs under the DEVELOPER role — its endpoints
    // 403 for every other role, so a dedicated session is required.
    { name: 'developer', use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/developer.json' }, dependencies: ['setup'], testMatch: /developer-check\.spec\.ts/ },
    // The directorate regional spec runs under the Ashanti Regional Director —
    // only a REGIONAL-scope session sees the district-level view with drill-down.
    { name: 'regional', use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/regional.json' }, dependencies: ['setup'], testMatch: /directorate-regional-check\.spec\.ts/ },
    // The directorate national spec runs under the National Admin — only a
    // NATIONAL-scope session sees the region-level view and drills region →
    // district → facility.
    { name: 'national', use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/national.json' }, dependencies: ['setup'], testMatch: /directorate-national-check\.spec\.ts/ },
    // The directorate + dashboard district specs run under the Kumasi
    // Metropolitan District Director — only a DISTRICT-scope session sees the
    // facility level for their district (no drill-down) and the named scope.
    { name: 'district', use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/district.json' }, dependencies: ['setup'], testMatch: /directorate-district-check\.spec\.ts|dashboard-district-check\.spec\.ts|reports-gis-scope-check\.spec\.ts/ },
  ],
  webServer: {
    // The suite + the queue page's 15s polling bursts past the API's default
    // 300 req/min ceiling (a 429 on /auth/me would drop the session mid-test).
    command: 'RATE_LIMIT_MAX=2000 npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
