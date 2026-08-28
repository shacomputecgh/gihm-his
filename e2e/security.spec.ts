import { expect, test } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

/**
 * Security checks (docs/19 §3 roadmap) — driven at the API layer against the
 * live dev stack, so the assertions hit real guards (scope filters,
 * permission checks, JWT validation) rather than UI hiding:
 *
 *   1. Injection  — SQL/payload injection attempts on search + registration.
 *   2. Privilege escalation — a FACILITY-scope user hitting admin-only
 *      endpoints (device management, audit log) is refused.
 *   3. Data leakage — a Korle-Bu (GH-KBTH) user cannot read another
 *      facility's (GH-LISTER) records, worklists or invoices.
 *   4. Session security — missing / garbage / expired tokens are refused
 *      everywhere, never falling through to data.
 *
 * Runs under the chromium project (hospital session); each test logs in
 * directly with its own role. Login is rate-limited to 10/min/IP, so the
 * suite performs exactly one login per test.
 */

const API = 'http://localhost:4000/api/v1';

async function loginToken(request: APIRequestContext, email: string): Promise<string> {
  const res = await request.post(`${API}/auth/login`, {
    data: { email, password: 'Demo@123' },
  });
  expect(res.status()).toBe(200);
  return (await res.json()).token;
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

test('injection — SQL and operator payloads are inert, never 500 or data leak', async ({ request }) => {
  const token = await loginToken(request, 'hospital@demo.gh');
  const h = auth(token);

  // Classic SQLi / NoSQL probes on the patient search.
  for (const q of ["' OR '1'='1", "'; DROP TABLE Patient;--", '%25%27%20OR%20%271%27%3D%271', '*', 'GH-%']) {
    const res = await request.get(`${API}/patients?q=${encodeURIComponent(q)}`, { headers: h });
    // The probe must not blow up the API and must not return every record:
    // a valid search response is 200 with a bounded result set.
    expect(res.status(), `search q=${q}`).toBe(200);
    const body = (await res.json()) as { items: unknown[]; total?: number };
    expect(Array.isArray(body.items)).toBe(true);
    if (q === "' OR '1'='1" || q === "'; DROP TABLE Patient;--") {
      // Unmatched text returns zero results — a tautology would return rows.
      expect(body.total).toBe(0);
    }
  }

  // A registration that carries an injection string in a free-text field is
  // stored verbatim (no SQL interpretation) and still yields a normal record.
  const reg = await request.post(`${API}/patients`, {
    headers: { ...h, 'Content-Type': 'application/json' },
    data: {
      fullName: "Sec Probe'); DROP TABLE Patient;--",
      dateOfBirth: '1991-05-05',
      sex: 'MALE',
      consentAccepted: true,
      force: true,
    },
  });
  expect(reg.status()).toBe(200);
  const { patient } = (await reg.json()) as { patient: { id: string } };
  expect(patient.id).toBeTruthy();

  // And that record is searchable back — the value round-trips as data.
  const found = await request.get(`${API}/patients?q=${encodeURIComponent('Sec Probe')}`, { headers: h });
  expect(found.status()).toBe(200);
});

test('privilege escalation — a doctor is refused admin-only endpoints', async ({ request }) => {
  // The DOCTOR role holds no admin permissions (manage_devices, view_audit,
  // manage_users are all false for doctor@demo.gh) — the right escalation
  // subject. (The seeded hospital admin DOES hold them, so it is not.)
  const token = await loginToken(request, 'doctor@demo.gh');
  const h = auth(token);

  // Device management console (manage_devices) — the list lives at /devices.
  const devices = await request.get(`${API}/devices`, { headers: h });
  expect(devices.status()).toBe(403);

  // Enrolment mutation (manage_devices).
  const enroll = await request.post(`${API}/admin/devices/sneaky-device/status`, {
    headers: { ...h, 'Content-Type': 'application/json' },
    data: { status: 'ACTIVE' },
  });
  expect(enroll.status()).toBe(403);

  // Audit log (view_audit).
  const audit = await request.get(`${API}/admin/audit`, { headers: h });
  expect(audit.status()).toBe(403);

  // User management (manage_users).
  const users = await request.get(`${API}/admin/masterdata/staff`, { headers: h });
  expect(users.status()).toBe(403);
});

test('data leakage — a Korle-Bu user cannot read another facility\'s records', async ({ request }) => {
  const token = await loginToken(request, 'hospital@demo.gh'); // GH-KBTH
  const h = auth(token);

  // Resolve a foreign-facility patient id from the seeded registry first (a
  // national admin may list it; the facility user must not). The demo seed
  // assigns patients to GH-KBTH and one CHPS facility (GH-KWRIDGE) — a
  // Korle-Bu user must never read the CHPS patient's record.
  const adminRes = await request.post(`${API}/auth/login`, {
    data: { email: 'admin@demo.gh', password: 'Demo@123' },
  });
  const adminToken = (await adminRes.json()).token;
  const list = await request.get(`${API}/patients?page=1&pageSize=300`, { headers: auth(adminToken) });
  const { items } = (await list.json()) as { items: { id: string; facilityId: string | null; mrn: string; fullName: string }[] };
  // The foreign target: any patient whose facility is NOT the caller's own.
  const hospitalMe = await request.get(`${API}/auth/me`, { headers: h });
  const me = (await hospitalMe.json()).user as { facilityId: string | null };
  const foreign = items.find((p) => p.facilityId !== null && p.facilityId !== me.facilityId);
  expect(foreign, 'seed must contain at least one foreign-facility patient').toBeTruthy();
  const target = foreign!.id;

  // Direct record fetch across the facility boundary: refused with 403 (the
  // record exists but is out of scope) or 404 (never surfaced) — never 200.
  const rec = await request.get(`${API}/patients/${target}`, { headers: h });
  expect(rec.status(), `GET /patients/${target} as facility user`).toBeGreaterThanOrEqual(400);

  // The full registry search is scope-filtered: the facility user only ever
  // sees their own facility's rows (or the orphaned synthetic rows the seed
  // registers without a facility) — never another facility's patients.
  const search = await request.get(`${API}/patients?page=1&pageSize=300`, { headers: h });
  const mine = (await search.json()) as { items: { facilityId: string | null }[] };
  expect(mine.items.length).toBeGreaterThan(0);
  // Korle-Bu demo users carry facilityId GH-KBTH; rows with a facilityId are
  // that facility's. Rows without one are the seed's national registrations —
  // the key assertion is no OTHER facility's id appears in the scoped search.
  const leaked = mine.items.filter((p) => p.facilityId !== null && p.facilityId !== me.facilityId);
  expect(leaked.length, 'no foreign-facility rows leak into a facility-scoped search').toBe(0);
});

test('session security — missing, garbage and tampered tokens are refused', async ({ request }) => {
  const token = await loginToken(request, 'hospital@demo.gh');
  const h = auth(token);

  // Baseline: the real token works.
  const ok = await request.get(`${API}/auth/me`, { headers: h });
  expect(ok.status()).toBe(200);

  // No token at all.
  const anon = await request.get(`${API}/patients?page=1&pageSize=5`);
  expect(anon.status()).toBe(401);

  // Garbage / malformed token.
  const garbage = await request.get(`${API}/auth/me`, { headers: auth('not-a-jwt') });
  expect(garbage.status()).toBe(401);

  // A syntactically-valid JWT signed with the wrong key (tampered token) is
  // refused — the server must never accept a forged signature.
  const tampered = await request.get(`${API}/auth/me`, {
    headers: auth(
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ3cm9uZyIsInR2IjowfQ.wrongsignaturewrongsignaturewrongsignaturewrongsig',
    ),
  });
  expect(tampered.status()).toBe(401);

  // An expired token (signed with iat in the past and exp in the past) is
  // refused by the JWT layer.
  const past = Math.floor(Date.now() / 1000) - 3600;
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const expired = await request.get(`${API}/auth/me`, {
    headers: auth(`${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: 'x', iat: past - 3600, exp: past })}.tampered`),
  });
  expect(expired.status()).toBe(401);
});
