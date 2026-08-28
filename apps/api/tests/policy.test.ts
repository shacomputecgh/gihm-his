import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import http from 'node:http';
import { db, createTestApp, makeUser } from './helpers.js';
import type { FastifyInstance } from 'fastify';
import { clearSetting, setSetting } from '../src/lib/settings.js';

const SECURITY_KEYS = ['security.passwordMinLength', 'security.lockoutThreshold', 'security.sessionTtlHours'];
const LICENSE_KEYS = ['license.key', 'license.edition', 'license.expiresAt', 'license.maxFacilities', 'license.maxUsers', 'license.activatedAt', 'license.alertDaysBefore', 'license.expiryAlertedAt', 'license.expiredAlertedAt'];
const DIGEST_KEYS = ['alerts.digestEnabled', 'alerts.lastDigestDate'];
const MAIL_KEYS = ['security.alertEmail', 'security.escalationEmail', 'security.alertWhatsApp', 'alerts.retentionDays', 'alerts.emailMinSeverity', 'alerts.retryMaxAttempts', 'mail.host', 'mail.port', 'mail.secure', 'mail.user', 'mail.pass', 'mail.from', 'wa.provider', 'sms.smsonlinegh.apiKey', 'wa.smsonlinegh.url'];
const ALERT_KEYS = [...DIGEST_KEYS, ...MAIL_KEYS];
const ALERT_EVENTS = ['lockout', 'license.activate', 'license.deactivate', 'license.expiring', 'license.expired', 'digest', 'test'];

let app: FastifyInstance;
let developer: { token: string };
let target: { email: string; userId: string };
let admin: { token: string };
let createdUserIds: string[] = [];

const auth = (t: string) => ({ authorization: `Bearer ${t}` });

async function login(email: string, password: string, ip = '127.0.0.1') {
  return app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email, password }, remoteAddress: ip });
}

/** Poll until the fire-and-forget inbox write for an event+message lands (CI-safe). */
async function waitForAlertRow(event: string, contains: string): Promise<{ id: string } | null> {
  const deadline = Date.now() + 2000;
  while (Date.now() < deadline) {
    const row = await db.securityAlert.findFirst({ where: { event, message: { contains } }, select: { id: true } });
    if (row) return row;
    await new Promise((r) => setTimeout(r, 50));
  }
  return null;
}

/** Poll until a fire-and-forget audit write lands (recordAudit is not awaited). */
async function waitForAudit(action: string, entityId?: string): Promise<{ after: string | null } | null> {
  const deadline = Date.now() + 2000;
  while (Date.now() < deadline) {
    const row = await db.auditLog.findFirst({ where: { action, ...(entityId ? { entityId } : {}) }, orderBy: { createdAt: 'desc' } });
    if (row) return row;
    await new Promise((r) => setTimeout(r, 50));
  }
  return null;
}

beforeAll(async () => {
  for (const k of [...LICENSE_KEYS, ...SECURITY_KEYS, ...ALERT_KEYS]) await clearSetting(db, k);
  // The test DB is not seeded — the /admin/users create path looks the NURSE
  // role up by exact code.
  await db.role.upsert({ where: { code: 'NURSE' }, create: { code: 'NURSE', name: 'Nurse', scope: 'FACILITY', permissions: JSON.stringify(['view_patient']) }, update: {} });
  // Threshold 3 keeps the wrong-password loop short while still exercising the
  // lock path (the login route rate-limits 10/min/IP — distinct IPs dodge it).
  await setSetting(db, 'security.lockoutThreshold', '3');
  app = await createTestApp();
  const dev = await makeUser({ email: 'policy-dev@demo.gh', roleCode: 'DEVELOPER', scope: 'DEVELOPER', permissions: [] });
  developer = { token: dev.token };
  const tgt = await makeUser({ email: 'policy-target@demo.gh', roleCode: 'NURSE', scope: 'FACILITY', permissions: ['view_patient'] });
  target = { email: tgt.email, userId: tgt.userId };
  const adm = await makeUser({ email: 'policy-admin@demo.gh', roleCode: 'NATIONAL_ADMIN', scope: 'NATIONAL', permissions: ['manage_users', 'view_patient'] });
  admin = { token: adm.token };
});

afterAll(async () => {
  // Scope the cleanup to this file's own footprint — never another file's rows.
  await db.auditLog.deleteMany({ where: { action: { in: ['policy.test', 'developer.user.unlock'] }, entityId: target.userId } });
  await db.auditLog.deleteMany({ where: { action: { startsWith: 'developer.user.revoke' } } });
  await db.auditLog.deleteMany({ where: { action: 'auth.lockout', entityId: { in: [target.userId, ...createdUserIds] } } });
  await db.auditLog.deleteMany({ where: { action: 'developer.audit.prune' } });
  await db.auditLog.deleteMany({ where: { action: 'developer.alerts.prune' } });
  await db.auditLog.deleteMany({ where: { action: 'developer.license.activate' } });
  await db.securityAlert.deleteMany({ where: { event: { in: ALERT_EVENTS } } });
  await db.alertDelivery.deleteMany({});
  await db.user.deleteMany({ where: { id: { in: createdUserIds } } });
  await db.role.deleteMany({ where: { code: 'NURSE' } });
  for (const k of [...LICENSE_KEYS, ...SECURITY_KEYS, ...ALERT_KEYS]) await clearSetting(db, k);
  await db.$disconnect();
  await app.close();
});

describe('login lockout policy — enforced end to end', () => {
  it('locks an ACTIVE account at the threshold, then unlocks it through the developer endpoint', async () => {
    // Wrong passwords: the 3rd attempt trips the threshold (security.lockoutThreshold=3).
    for (let i = 0; i < 3; i++) {
      const res = await login(target.email, 'wrong-password', `10.3.0.${i + 1}`);
      expect(res.statusCode).toBe(401);
    }
    const locked = await db.user.findUnique({ where: { id: target.userId } });
    expect(locked?.status).toBe('LOCKED');
    expect(locked?.failedLoginAttempts).toBe(3);
    expect(locked?.lockedUntil).not.toBeNull();

    // Correct password inside the lock window is still refused.
    const during = await login(target.email, 'Demo@123', '10.3.0.9');
    expect(during.statusCode).toBe(403);

    // The developer lockouts endpoint surfaces the account.
    const panel = await app.inject({ method: 'GET', url: '/api/v1/admin/developer/lockouts', headers: auth(developer.token) });
    expect(panel.statusCode).toBe(200);
    const body = panel.json();
    const row = body.locked.find((u: { email: string }) => u.email === target.email);
    expect(row).toBeDefined();
    expect(row.failedLoginAttempts).toBe(3);
    expect(body.recentEvents.some((e: { email: string | null }) => e.email === target.email)).toBe(true);
    // Non-developers cannot see the panel.
    const denied = await app.inject({ method: 'GET', url: '/api/v1/admin/developer/lockouts', headers: auth(admin.token) });
    expect(denied.statusCode).toBe(403);

    // One-click unlock restores the account and resets the counter.
    const unlock = await app.inject({ method: 'POST', url: `/api/v1/admin/developer/users/${target.userId}/unlock`, headers: auth(developer.token) });
    expect(unlock.statusCode).toBe(200);
    expect(unlock.json().user.status).toBe('ACTIVE');
    const after = await db.user.findUnique({ where: { id: target.userId } });
    expect(after?.status).toBe('ACTIVE');
    expect(after?.failedLoginAttempts).toBe(0);
    expect(after?.lockedUntil).toBeNull();

    // The account can log in again.
    const ok = await login(target.email, 'Demo@123', '10.3.0.10');
    expect(ok.statusCode).toBe(200);

    // The unlock is audited.
    const audit = await db.auditLog.findFirst({ where: { action: 'developer.user.unlock', entityId: target.userId } });
    expect(audit?.after).toContain('policy-target@demo.gh');

    // The lockout also persisted an inbox row (in-app alert bell) as critical.
    const inboxRow = await db.securityAlert.findFirst({ where: { event: 'lockout', payload: { contains: target.email } } });
    expect(inboxRow).toBeDefined();
    expect(inboxRow?.title).toBe('Account locked');
    expect(inboxRow?.severity).toBe('critical');
    expect(inboxRow?.readAt).toBeNull();
  });

  it('refuses to unlock an account that is not locked', async () => {
    const res = await app.inject({ method: 'POST', url: `/api/v1/admin/developer/users/${target.userId}/unlock`, headers: auth(developer.token) });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.message).toContain('not locked');
  });

  it('a suspended account is not auto-unlocked and wrong passwords do not clobber its status', async () => {
    // Suspend the account (a manual, admin decision — not a lock).
    const suspend = await app.inject({ method: 'PUT', url: `/api/v1/admin/developer/users/${target.userId}`, headers: auth(developer.token), payload: { status: 'SUSPENDED' } });
    expect(suspend.statusCode).toBe(200);
    // Wrong passwords on a SUSPENDED account never change its status or count.
    const res = await login(target.email, 'wrong-password', '10.3.1.1');
    expect(res.statusCode).toBe(401);
    const after = await db.user.findUnique({ where: { id: target.userId } });
    expect(after?.status).toBe('SUSPENDED');
    expect(after?.failedLoginAttempts).toBe(0);
    // The unlock endpoint is not a back-door out of a suspension.
    const unlock = await app.inject({ method: 'POST', url: `/api/v1/admin/developer/users/${target.userId}/unlock`, headers: auth(developer.token) });
    expect(unlock.statusCode).toBe(409);
    // Reactivate for the remaining tests.
    const act = await app.inject({ method: 'PUT', url: `/api/v1/admin/developer/users/${target.userId}`, headers: auth(developer.token), payload: { status: 'ACTIVE' } });
    expect(act.statusCode).toBe(200);
  });
});

describe('lockout alerting — webhook delivery', () => {
  it('POSTs a lockout JSON payload to the configured alert webhook', async () => {
    // A fresh account so this test is independent of the lockout flow above.
    const fresh = await makeUser({ email: 'policy-alert@demo.gh', roleCode: 'NURSE', scope: 'FACILITY', permissions: ['view_patient'] });
    createdUserIds.push(fresh.userId);

    // Local capture server for the webhook alert.
    const received: Array<Record<string, unknown>> = [];
    const server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        try {
          received.push(JSON.parse(body) as Record<string, unknown>);
        } catch {
          /* ignore malformed */
        }
        res.writeHead(200);
        res.end('ok');
      });
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const addr = server.address() as { port: number };
    await setSetting(db, 'security.alertWebhook', `http://127.0.0.1:${addr.port}/hooks/security`);

    try {
      // Trip the lockout threshold (3). Distinct IPs dodge the login rate limiter.
      for (let i = 0; i < 3; i++) {
        const res = await login(fresh.email, 'wrong-password', `10.5.0.${i + 1}`);
        expect(res.statusCode).toBe(401);
      }

      // Poll for the fire-and-forget POST instead of a fixed sleep (CI-safe).
      const deadline = Date.now() + 2000;
      while (received.length === 0 && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 50));
      }
      expect(received.length).toBe(1);
      const payload = received[0] as Record<string, unknown> | undefined;
      expect(payload).toBeDefined();
      expect(payload?.event).toBe('lockout');
      expect(payload?.email).toBe(fresh.email);
      expect(payload?.attempts).toBe(3);
      expect(payload?.threshold).toBe(3);
      expect(typeof payload?.lockedUntil).toBe('string');
      expect(typeof payload?.message).toBe('string');
      expect(typeof payload?.timestamp).toBe('string');
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await clearSetting(db, 'security.alertWebhook');
    }
  });

  it('guards the webhook target against SSRF (loopback/private refused outside dev/test)', async () => {
    const { webhookTargetAllowed } = await import('../src/lib/alert.js');
    const envBefore = process.env.NODE_ENV;
    delete process.env.SECURITY_ALERT_ALLOW_PRIVATE;
    try {
      process.env.NODE_ENV = 'production';
      // Loopback / private targets are refused in production…
      expect(webhookTargetAllowed('http://127.0.0.1:4000/hooks/x')).toBe(false);
      expect(webhookTargetAllowed('http://169.254.169.254/latest/meta-data')).toBe(false);
      expect(webhookTargetAllowed('http://10.0.0.1/x')).toBe(false);
      expect(webhookTargetAllowed('http://[::1]/x')).toBe(false);
      // …a public https target and non-http schemes behave correctly.
      expect(webhookTargetAllowed('https://hooks.example.com/security')).toBe(true);
      expect(webhookTargetAllowed('ftp://hooks.example.com/x')).toBe(false);
      expect(webhookTargetAllowed('not a url')).toBe(false);
      // Dev/test (the integration test's own loopback server) is allowed.
      process.env.NODE_ENV = 'test';
      expect(webhookTargetAllowed('http://127.0.0.1:4000/hooks/x')).toBe(true);
    } finally {
      process.env.NODE_ENV = envBefore;
    }
  });
});

describe('alert email delivery — SMTP channel', () => {
  it('emails the security recipient with the event title + severity when SMTP is configured', async () => {
    const { sendTestAlert } = await import('../src/lib/alert.js');
    const { setMailTransportForTest, resetMailTransportForTest } = await import('../src/lib/mail.js');
    const sent: Array<{ to?: string; subject?: string; text?: string }> = [];
    await setSetting(db, 'security.alertEmail', 'ops@facility.gov.gh');
    await setSetting(db, 'mail.host', 'smtp.example.com');
    setMailTransportForTest(() => ({
      sendMail: async (mail: { to?: string; subject?: string; text?: string }) => {
        sent.push(mail);
        return { messageId: 'msg-test-1' };
      },
    }));
    try {
      sendTestAlert(db);
      // Poll for the fire-and-forget send (CI-safe).
      const deadline = Date.now() + 2000;
      while (sent.length === 0 && Date.now() < deadline) await new Promise((r) => setTimeout(r, 50));
      expect(sent.length).toBe(1);
      const mail = sent[0]!;
      expect(mail.to).toBe('ops@facility.gov.gh');
      expect(mail.subject).toContain('[GIHM-HIS SECURITY]');
      expect(mail.subject).toContain('Test alert');
      expect(mail.text).toContain('inbox, SMS, email and webhook');

      // No email when no recipient is configured — the channel is skipped.
      await clearSetting(db, 'security.alertEmail');
      sent.length = 0;
      sendTestAlert(db);
      await new Promise((r) => setTimeout(r, 100));
      expect(sent.length).toBe(0);
    } finally {
      await clearSetting(db, 'security.alertEmail');
      await clearSetting(db, 'mail.host');
      resetMailTransportForTest();
    }
  });

  it('emails the digest once as a dedicated summary — the generic channel skips digest events', async () => {
    const { runDailyDigest } = await import('../src/lib/alert.js');
    const { setMailTransportForTest, resetMailTransportForTest } = await import('../src/lib/mail.js');
    const sent: Array<{ to?: string; subject?: string; text?: string; html?: string }> = [];
    await setSetting(db, 'security.alertEmail', 'ops@facility.gov.gh');
    await setSetting(db, 'mail.host', 'smtp.example.com');
    setMailTransportForTest(() => ({
      sendMail: async (mail: { to?: string; subject?: string; text?: string; html?: string }) => {
        sent.push(mail);
        return { messageId: 'msg-digest-1' };
      },
    }));
    // Deterministic severity: drop THIS FILE's lockout rows (payloads carry the
    // target emails) so the 24h count is 0 — never another file's rows.
    for (const email of ['policy-target@demo.gh', 'policy-alert@demo.gh']) {
      const deadline = Date.now() + 2000;
      while (Date.now() < deadline) {
        await db.securityAlert.deleteMany({ where: { event: 'lockout', payload: { contains: email } } });
        if ((await db.securityAlert.count({ where: { event: 'lockout', payload: { contains: email } } })) === 0) break;
        await new Promise((r) => setTimeout(r, 50));
      }
    }
    // A license inside the expiry window → a warning digest.
    await clearSetting(db, 'alerts.lastDigestDate');
    await setSetting(db, 'license.key', 'GIHM-DIGESTMAIL-FFFF');
    await setSetting(db, 'license.edition', 'ENTERPRISE');
    await setSetting(db, 'license.alertDaysBefore', '14');
    await setSetting(db, 'license.expiryAlertedAt', '');
    await setSetting(db, 'license.expiresAt', new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString());
    let myDigestRow: { id: string } | null = null;
    try {
      const result = await runDailyDigest(db);
      expect(result.published).toBe(true);
      // Capture our row with the file's polling pattern — the inbox write is
      // fire-and-forget, so a single query could race it and return null,
      // leaking the row into the other digest test's exact-count assertions.
      // Captured before any later assertion so a failure can't skip cleanup.
      myDigestRow = await waitForAlertRow('digest', 'GIHM-HIS DIGEST');
      const deadline = Date.now() + 2000;
      while (sent.length === 0 && Date.now() < deadline) await new Promise((r) => setTimeout(r, 50));
      // Exactly one email — the dedicated digest summary, never a second
      // generic per-event email for the same digest.
      expect(sent.length).toBe(1);
      const mail = sent[0]!;
      expect(mail.to).toBe('ops@facility.gov.gh');
      expect(mail.subject).toContain('Daily security digest');
      expect(mail.subject).toContain('[WARNING]'); // license inside the window
      expect(mail.text).toContain('Lockout incidents: 0');
      // The audit count reflects this file's earlier tests — assert presence only.
      expect(mail.text).toContain('Audit actions:');
      expect(mail.text).toContain('license ENTERPRISE active');
      // The rich HTML twin renders the same summary as a table.
      expect(mail.html).toContain('<table');
      expect(mail.html).toContain('Lockout incidents');
      expect(mail.html).toContain('license ENTERPRISE active');
      // Per-channel delivery health is included in both twins.
      expect(mail.text).toContain('Delivery:');
      expect(mail.text).toContain('retrying');
      expect(mail.html).toContain('>Delivery<');
      // The 14-day channel-health trend rides along (text sparkline + HTML table).
      expect(mail.text).toContain('Channel health (14-day delivered trend)');
      expect(mail.text).toMatch(/email: [·▁▂▃▄▅▆▇█]+ \(\d+ delivered\)/);
      expect(mail.html).toContain('Channel health');
      expect(mail.html).toContain('monospace'); // sparkline cells render in monospace
      expect(mail.html).toContain('>email</td>'); // per-channel row
    } finally {
      // Remove the digest inbox row this test created — the later digest test
      // asserts exact counts/rows and must not see this one.
      if (myDigestRow) await db.securityAlert.deleteMany({ where: { id: myDigestRow.id } });
      await clearSetting(db, 'security.alertEmail');
      await clearSetting(db, 'mail.host');
      await clearSetting(db, 'alerts.lastDigestDate');
      await clearSetting(db, 'license.key');
      await clearSetting(db, 'license.edition');
      await clearSetting(db, 'license.expiresAt');
      await clearSetting(db, 'license.alertDaysBefore');
      await clearSetting(db, 'license.expiryAlertedAt');
      resetMailTransportForTest();
    }
  });

  it('tests the SMTP channel via POST /admin/settings/test-mail (and degrades gracefully unconfigured)', async () => {
    const { setMailTransportForTest, resetMailTransportForTest } = await import('../src/lib/mail.js');
    const sent: Array<{ to?: string; subject?: string }> = [];
    await setSetting(db, 'mail.host', 'smtp.example.com');
    await setSetting(db, 'mail.from', 'ops@facility.gov.gh');
    setMailTransportForTest(() => ({
      sendMail: async (mail: { to?: string; subject?: string }) => {
        sent.push(mail);
        return { messageId: 'msg-probe-1' };
      },
    }));
    try {
      // Configured → a probe email goes to the From address (the account owner).
      const res = await app.inject({ method: 'POST', url: '/api/v1/admin/settings/test-mail', headers: auth(developer.token) });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.dispatched).toBe(true);
      expect(body.to).toBe('ops@facility.gov.gh');
      const deadline = Date.now() + 2000;
      while (sent.length === 0 && Date.now() < deadline) await new Promise((r) => setTimeout(r, 50));
      expect(sent.length).toBe(1);
      expect(sent[0]!.to).toBe('ops@facility.gov.gh');
      expect(sent[0]!.subject).toContain('Test email');
      const audit = await db.auditLog.findFirst({ where: { action: 'system.settings.test', after: { contains: '"channel":"mail"' } } });
      expect(audit).toBeDefined();

      // Unconfigured (no SMTP host) → 200 with a graceful non-dispatched note.
      sent.length = 0;
      await clearSetting(db, 'mail.host');
      const unconfigured = await app.inject({ method: 'POST', url: '/api/v1/admin/settings/test-mail', headers: auth(developer.token) });
      expect(unconfigured.statusCode).toBe(200);
      expect(unconfigured.json().dispatched).toBe(false);
      expect(unconfigured.json().note).toContain('SMTP not connected');
    } finally {
      await clearSetting(db, 'mail.host');
      await clearSetting(db, 'mail.from');
      resetMailTransportForTest();
    }
  });

  it('gates email alerts by severity but lets the diagnostic test alert bypass', async () => {
    const { setMailTransportForTest, resetMailTransportForTest } = await import('../src/lib/mail.js');
    const { dispatchSecurityAlert, sendTestAlert } = await import('../src/lib/alert.js');
    const sent: Array<{ subject?: string }> = [];
    await setSetting(db, 'security.alertEmail', 'ops@facility.gov.gh');
    await setSetting(db, 'mail.host', 'smtp.example.com');
    await setSetting(db, 'alerts.emailMinSeverity', 'critical');
    setMailTransportForTest(() => ({
      sendMail: async (mail: { subject?: string }) => {
        sent.push(mail);
        return { messageId: 'g1' };
      },
    }));
    let lockoutRow: { id: string } | null = null;
    try {
      // The test alert (info) BYPASSES the gate — the channel probe always emails.
      sendTestAlert(db);
      const deadline = Date.now() + 2000;
      while (sent.length === 0 && Date.now() < deadline) await new Promise((r) => setTimeout(r, 50));
      expect(sent.length).toBe(1);
      expect(sent[0]!.subject).toContain('[INFO]');

      // A regular info alert (license.activate) is silenced by the critical gate.
      sent.length = 0;
      dispatchSecurityAlert({ event: 'license.activate', message: 'gated info alert' }, db);
      await new Promise((r) => setTimeout(r, 250));
      expect(sent.length).toBe(0);

      // A lockout is critical — at/above the gate → emailed with the tag.
      dispatchSecurityAlert({ event: 'lockout', email: 'gate@demo.gh', message: 'gate lockout alert' }, db);
      const deadline2 = Date.now() + 2000;
      while (sent.length === 0 && Date.now() < deadline2) await new Promise((r) => setTimeout(r, 50));
      expect(sent.length).toBe(1);
      expect(sent[0]!.subject).toContain('[CRITICAL]');
      lockoutRow = await waitForAlertRow('lockout', 'gate lockout alert');

      // Lowering the gate back to info lets regular info alerts through.
      await setSetting(db, 'alerts.emailMinSeverity', 'info');
      sent.length = 0;
      dispatchSecurityAlert({ event: 'license.activate', message: 'gated info alert 2' }, db);
      const deadline3 = Date.now() + 2000;
      while (sent.length === 0 && Date.now() < deadline3) await new Promise((r) => setTimeout(r, 50));
      expect(sent.length).toBe(1);
      expect(sent[0]!.subject).toContain('[INFO]');
    } finally {
      // Remove this test's lockout row so later digest tests see no lockouts.
      if (lockoutRow) await db.securityAlert.deleteMany({ where: { id: lockoutRow.id } });
      await clearSetting(db, 'security.alertEmail');
      await clearSetting(db, 'mail.host');
      await clearSetting(db, 'alerts.emailMinSeverity');
      resetMailTransportForTest();
    }
  });

  it('queues a failed email dispatch and delivers it on retry with backoff', async () => {
    const { setMailTransportForTest, resetMailTransportForTest } = await import('../src/lib/mail.js');
    const { dispatchSecurityAlert, runAlertRetrySweep } = await import('../src/lib/alert.js');
    await setSetting(db, 'security.alertEmail', 'ops@facility.gov.gh');
    await setSetting(db, 'mail.host', 'smtp.example.com');
    let fail = true;
    const sent: Array<{ to?: string }> = [];
    setMailTransportForTest(() => ({
      sendMail: async (mail: { to?: string }) => {
        if (fail) throw new Error('connection refused');
        sent.push(mail);
        return { messageId: 'r1' };
      },
    }));
    try {
      dispatchSecurityAlert({ event: 'test', message: 'retry queue alert' }, db);
      // Poll for the queue row — the enqueue is fire-and-forget.
      const deadline = Date.now() + 2000;
      let row: { id: string; attempts: number; deliveredAt: Date | null; nextAttemptAt: Date } | null = null;
      while (Date.now() < deadline) {
        row = await db.alertDelivery.findFirst({ where: { channel: 'email', message: { contains: 'retry queue alert' } } });
        if (row) break;
        await new Promise((r) => setTimeout(r, 50));
      }
      expect(row).toBeDefined();
      expect(row!.attempts).toBe(0);
      expect(row!.deliveredAt).toBeNull();
      expect(row!.nextAttemptAt.getTime()).toBeGreaterThan(Date.now()); // first retry ~30 min out

      // A second identical failure is deduped — one queue row per (channel, to, message).
      dispatchSecurityAlert({ event: 'test', message: 'retry queue alert' }, db);
      await new Promise((r) => setTimeout(r, 200));
      expect(await db.alertDelivery.count({ where: { channel: 'email', message: { contains: 'retry queue alert' }, deliveredAt: null } })).toBe(1);

      // The transport recovers; force the row due; the sweep delivers it.
      fail = false;
      await db.alertDelivery.update({ where: { id: row!.id }, data: { nextAttemptAt: new Date(Date.now() - 1000) } });
      const result = await runAlertRetrySweep(db);
      expect(result.retried).toBeGreaterThanOrEqual(1);
      expect(result.delivered).toBe(1);
      const after = await db.alertDelivery.findUnique({ where: { id: row!.id } });
      expect(after?.deliveredAt).not.toBeNull();
      expect(sent.length).toBe(1);
      expect(sent[0]!.to).toBe('ops@facility.gov.gh');
    } finally {
      await clearSetting(db, 'security.alertEmail');
      await clearSetting(db, 'mail.host');
      resetMailTransportForTest();
    }
  });

  it('a fresh publish of an alert whose queue row was exhausted still queues (dedup is not a tombstone)', async () => {
    const { enqueueAlertDelivery, runAlertRetrySweep } = await import('../src/lib/alert.js');
    await setSetting(db, 'alerts.retryMaxAttempts', '2');
    try {
      // Seed an exhausted row (at max attempts, never delivered) for a key.
      const exhausted = await db.alertDelivery.create({
        data: { channel: 'email', to: 'ops@facility.gov.gh', message: 'dedup-not-a-tombstone', attempts: 2, nextAttemptAt: new Date(Date.now() - 1000) },
      });
      // The exhausted row is skipped by the sweep (attempts >= max).
      const sweep = await runAlertRetrySweep(db);
      expect(sweep.retried).toBe(0);
      // A fresh publish of the same message must NOT be swallowed by the
      // exhausted row — the alert would otherwise be silently lost.
      await enqueueAlertDelivery(db, 'email', 'ops@facility.gov.gh', 'dedup-not-a-tombstone', 'Dedup');
      const rows = await db.alertDelivery.findMany({ where: { channel: 'email', message: 'dedup-not-a-tombstone', deliveredAt: null } });
      expect(rows.length).toBe(2);
      expect(rows.some((r) => r.attempts === 2 && r.id === exhausted.id)).toBe(true);
      expect(rows.some((r) => r.attempts === 0)).toBe(true); // fresh retryable row
      // And a second fresh publish still dedups to the new row (not a third).
      await enqueueAlertDelivery(db, 'email', 'ops@facility.gov.gh', 'dedup-not-a-tombstone', 'Dedup');
      expect(await db.alertDelivery.count({ where: { channel: 'email', message: 'dedup-not-a-tombstone', deliveredAt: null } })).toBe(2);
    } finally {
      await clearSetting(db, 'alerts.retryMaxAttempts');
    }
  });

  it('stops retrying once the max attempts are exhausted', async () => {
    const { setMailTransportForTest, resetMailTransportForTest } = await import('../src/lib/mail.js');
    const { runAlertRetrySweep } = await import('../src/lib/alert.js');
    await setSetting(db, 'mail.host', 'smtp.example.com');
    await setSetting(db, 'alerts.retryMaxAttempts', '2');
    setMailTransportForTest(() => ({
      sendMail: async () => {
        throw new Error('still down');
      },
    }));
    try {
      // Seed a row one attempt below max, already due.
      const seeded = await db.alertDelivery.create({
        data: { channel: 'email', to: 'ops@facility.gov.gh', message: 'exhaust retries', subject: 'Exhaust', attempts: 1, nextAttemptAt: new Date(Date.now() - 1000) },
      });
      const result = await runAlertRetrySweep(db);
      expect(result.retried).toBe(1);
      expect(result.failed).toBe(1); // attempt 2 hits max 2
      const after = await db.alertDelivery.findUnique({ where: { id: seeded.id } });
      expect(after?.attempts).toBe(2);
      expect(after?.deliveredAt).toBeNull();
      // At max and backed off into the future — a second sweep skips it.
      const second = await runAlertRetrySweep(db);
      expect(second.retried).toBe(0);
    } finally {
      await clearSetting(db, 'mail.host');
      await clearSetting(db, 'alerts.retryMaxAttempts');
      resetMailTransportForTest();
    }
  });

  it('queues a failed webhook POST and delivers it on retry (webhook retry queue)', async () => {
    const { dispatchSecurityAlert, runAlertRetrySweep } = await import('../src/lib/alert.js');
    // Find a free port, then close it so the first POST fails (connection refused).
    const probe = http.createServer();
    await new Promise<void>((resolve) => probe.listen(0, '127.0.0.1', resolve));
    const { port } = probe.address() as { port: number };
    await new Promise<void>((resolve) => probe.close(() => resolve()));
    await setSetting(db, 'security.alertWebhook', `http://127.0.0.1:${port}/hooks/security`);

    // 1. Dispatch → the POST fails (nothing listening) → a webhook queue row appears.
    dispatchSecurityAlert({ event: 'license.deactivate', message: 'webhook retry alert' }, db);
    const deadline = Date.now() + 2000;
    let row: { id: string; channel: string; message: string; attempts: number; deliveredAt: Date | null; nextAttemptAt: Date } | null = null;
    while (Date.now() < deadline) {
      row = await db.alertDelivery.findFirst({ where: { channel: 'webhook', message: { contains: 'webhook retry alert' } } });
      if (row) break;
      await new Promise((r) => setTimeout(r, 50));
    }
    expect(row).toBeDefined();
    expect(row!.channel).toBe('webhook');
    expect(row!.attempts).toBe(0);
    expect(row!.deliveredAt).toBeNull();
    // The stored payload is JSON (without the per-attempt timestamp).
    expect(() => JSON.parse(row!.message)).not.toThrow();

    // 2. The receiver comes up; force the row due; the sweep delivers it.
    const received: Array<Record<string, unknown>> = [];
    const server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        try {
          received.push(JSON.parse(body) as Record<string, unknown>);
        } catch {
          /* ignore */
        }
        res.writeHead(200);
        res.end('ok');
      });
    });
    await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', resolve));
    try {
      await db.alertDelivery.update({ where: { id: row!.id }, data: { nextAttemptAt: new Date(Date.now() - 1000) } });
      const result = await runAlertRetrySweep(db);
      expect(result.retried).toBeGreaterThanOrEqual(1);
      expect(result.delivered).toBe(1);
      const after = await db.alertDelivery.findUnique({ where: { id: row!.id } });
      expect(after?.deliveredAt).not.toBeNull();
      // The retried POST carries the event and a fresh timestamp.
      const deadline2 = Date.now() + 2000;
      while (received.length === 0 && Date.now() < deadline2) await new Promise((r) => setTimeout(r, 50));
      expect(received.length).toBe(1);
      expect(received[0]?.event).toBe('license.deactivate');
      expect(typeof received[0]?.timestamp).toBe('string');
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await clearSetting(db, 'security.alertWebhook');
    }
  });

  it('emails critical alerts to the escalation (on-call) recipient in addition to the primary — independent of the gate', async () => {
    const { setMailTransportForTest, resetMailTransportForTest } = await import('../src/lib/mail.js');
    const { dispatchSecurityAlert } = await import('../src/lib/alert.js');
    const sent: Array<{ to?: string; subject?: string }> = [];
    await setSetting(db, 'security.alertEmail', 'ops@facility.gov.gh');
    await setSetting(db, 'security.escalationEmail', 'oncall@facility.gov.gh');
    await setSetting(db, 'mail.host', 'smtp.example.com');
    // Raise the gate to critical: info alerts are silenced for the primary too,
    // but the escalation path must be entirely unaffected (critical-only).
    await setSetting(db, 'alerts.emailMinSeverity', 'critical');
    setMailTransportForTest(() => ({
      sendMail: async (mail: { to?: string; subject?: string }) => {
        sent.push(mail);
        return { messageId: 'esc-1' };
      },
    }));
    let lockoutRow: { id: string } | null = null;
    try {
      // Critical lockout → both the primary AND the escalation recipient.
      dispatchSecurityAlert({ event: 'lockout', email: 'esc@demo.gh', message: 'escalation lockout alert' }, db);
      const deadline = Date.now() + 2000;
      while (sent.length < 2 && Date.now() < deadline) await new Promise((r) => setTimeout(r, 50));
      expect(sent.length).toBe(2);
      const tos = sent.map((m) => m.to).sort();
      expect(tos).toEqual(['oncall@facility.gov.gh', 'ops@facility.gov.gh']);
      expect(sent.every((m) => m.subject?.includes('[CRITICAL]'))).toBe(true);
      lockoutRow = await waitForAlertRow('lockout', 'escalation lockout alert');

      // An info alert (gated to silence the primary) is NOT escalated either.
      sent.length = 0;
      dispatchSecurityAlert({ event: 'license.activate', message: 'escalation info alert' }, db);
      await new Promise((r) => setTimeout(r, 250));
      expect(sent.length).toBe(0);
    } finally {
      if (lockoutRow) await db.securityAlert.deleteMany({ where: { id: lockoutRow.id } });
      await clearSetting(db, 'security.alertEmail');
      await clearSetting(db, 'security.escalationEmail');
      await clearSetting(db, 'mail.host');
      await clearSetting(db, 'alerts.emailMinSeverity');
      resetMailTransportForTest();
    }
  });

  it('exposes per-channel delivery stats on the overview and the alert inbox', async () => {
    const { deliveryStats } = await import('../src/lib/alert.js');
    await setSetting(db, 'alerts.retryMaxAttempts', '2');
    try {
      // Seed a deterministic footprint: 2 delivered email, 1 pending sms,
      // 1 exhausted webhook (at max 2, never delivered).
      await db.alertDelivery.create({ data: { channel: 'email', to: 'a@demo.gh', message: 'stats-email-1', attempts: 0, deliveredAt: new Date(), nextAttemptAt: new Date() } });
      await db.alertDelivery.create({ data: { channel: 'email', to: 'a@demo.gh', message: 'stats-email-2', attempts: 0, deliveredAt: new Date(), nextAttemptAt: new Date() } });
      await db.alertDelivery.create({ data: { channel: 'sms', to: '+233240000000', message: 'stats-sms-1', attempts: 0, nextAttemptAt: new Date(Date.now() + 3600 * 1000) } });
      await db.alertDelivery.create({ data: { channel: 'webhook', to: 'http://hooks.example/x', message: '{"event":"lockout"}', attempts: 2, nextAttemptAt: new Date(Date.now() - 1000) } });

      // Helper: assert a channel row from the stats array.
      const byChannel = (stats: { channel: string; total: number; delivered: number; pending: number; exhausted: number }[]) =>
        Object.fromEntries(stats.map((s) => [s.channel, s]));

      // Direct helper call.
      const direct = byChannel(await deliveryStats(db));
      expect(direct.email!.delivered).toBeGreaterThanOrEqual(2);
      expect(direct.sms!.pending).toBeGreaterThanOrEqual(1);
      expect(direct.webhook!.exhausted).toBeGreaterThanOrEqual(1);

      // Overview endpoint surfaces them.
      const overview = await app.inject({ method: 'GET', url: '/api/v1/admin/developer/overview', headers: auth(developer.token) });
      expect(overview.statusCode).toBe(200);
      const ov = byChannel(overview.json().deliveryStats);
      expect(ov.email!.delivered).toBeGreaterThanOrEqual(2);
      expect(ov.sms!.pending).toBeGreaterThanOrEqual(1);
      expect(ov.webhook!.exhausted).toBeGreaterThanOrEqual(1);
      expect(overview.json().settings.escalationEmail).toBeDefined();

      // The alert inbox endpoint surfaces them too (Alerts tab strip).
      const inbox = await app.inject({ method: 'GET', url: '/api/v1/admin/developer/alerts', headers: auth(developer.token) });
      expect(inbox.statusCode).toBe(200);
      const ib = byChannel(inbox.json().deliveryStats);
      expect(ib.email!.delivered).toBeGreaterThanOrEqual(2);
      expect(ib.webhook!.exhausted).toBeGreaterThanOrEqual(1);

      // Non-developers cannot see the overview stats.
      const denied = await app.inject({ method: 'GET', url: '/api/v1/admin/developer/overview', headers: auth(admin.token) });
      expect(denied.statusCode).toBe(403);
    } finally {
      await db.alertDelivery.deleteMany({ where: { message: { contains: 'stats-' } } });
      await db.alertDelivery.deleteMany({ where: { message: '{"event":"lockout"}' } });
      await clearSetting(db, 'alerts.retryMaxAttempts');
    }
  });

  it('buckets delivery health into a continuous 14-day trend', async () => {
    const { deliveryTrend } = await import('../src/lib/alert.js');
    await setSetting(db, 'alerts.retryMaxAttempts', '2');
    const today = new Date();
    const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
    try {
      await db.alertDelivery.create({ data: { channel: 'email', to: 'a@demo.gh', message: 'trend-delivered-today', attempts: 0, deliveredAt: new Date(), nextAttemptAt: new Date() } });
      await db.alertDelivery.create({ data: { channel: 'sms', to: '+233240000000', message: 'trend-pending-today', attempts: 1, nextAttemptAt: new Date(Date.now() + 3600 * 1000) } });
      await db.alertDelivery.create({ data: { channel: 'webhook', to: 'http://x', message: 'trend-exhausted-today', attempts: 2, nextAttemptAt: new Date() } });
      await db.alertDelivery.create({ data: { channel: 'email', to: 'b@demo.gh', message: 'trend-delivered-yesterday', attempts: 0, deliveredAt: yesterday, createdAt: yesterday, nextAttemptAt: yesterday } });

      // Per-channel series, bucketed by the day the dispatch was created.
      const trend = await deliveryTrend(db, 14);
      expect(trend.map((t) => t.channel)).toEqual(['email', 'sms', 'whatsapp', 'webhook']);
      const email = trend.find((t) => t.channel === 'email')!;
      expect(email.points.length).toBe(14);
      expect(email.points[13]!.date).toBe(today.toISOString().slice(0, 10));
      expect(email.points[13]!.delivered).toBeGreaterThanOrEqual(1);
      expect(trend.find((t) => t.channel === 'sms')!.points[13]!.pending).toBeGreaterThanOrEqual(1);
      expect(trend.find((t) => t.channel === 'webhook')!.points[13]!.exhausted).toBeGreaterThanOrEqual(1);
      // The yesterday row lands in yesterday's bucket, not today's.
      const yIdx = email.points.findIndex((p) => p.date === yesterday.toISOString().slice(0, 10));
      expect(email.points[yIdx]!.delivered).toBeGreaterThanOrEqual(1);
      // Zero days are filled — every series is continuous.
      expect(trend.every((t) => t.points.every((p) => p.delivered >= 0 && p.pending >= 0 && p.exhausted >= 0))).toBe(true);

      // The overview endpoint surfaces the per-channel trend for the chart.
      const ov = await app.inject({ method: 'GET', url: '/api/v1/admin/developer/overview', headers: auth(developer.token) });
      expect(ov.statusCode).toBe(200);
      expect(ov.json().deliveryTrend.length).toBe(4);
      expect(ov.json().deliveryTrend[0].points.length).toBe(14);
    } finally {
      await db.alertDelivery.deleteMany({ where: { message: { contains: 'trend-' } } });
      await clearSetting(db, 'alerts.retryMaxAttempts');
    }
  });

  it('force-runs the delivery retry sweep via POST /alerts/retry-sweep (audited)', async () => {
    const { setMailTransportForTest, resetMailTransportForTest } = await import('../src/lib/mail.js');
    const { runAlertRetrySweep } = await import('../src/lib/alert.js');
    await setSetting(db, 'mail.host', 'smtp.example.com');
    // A transport that always fails → the seeded due row is retried, not delivered.
    setMailTransportForTest(() => ({
      sendMail: async () => {
        throw new Error('still down');
      },
    }));
    try {
      await db.alertDelivery.create({
        data: { channel: 'email', to: 'ops@facility.gov.gh', message: 'retry-sweep-now', subject: 'Sweep', attempts: 0, nextAttemptAt: new Date(Date.now() - 1000) },
      });
      // Direct call sanity — our own row is due and gets attempted. Other test
      // files share this DB and run in parallel, so assert on OUR row (message
      // namespaced to this test) rather than the global retried counter, which
      // a concurrent sweep may have drained before we counted it.
      await runAlertRetrySweep(db);
      const afterDirect = await db.alertDelivery.findFirst({ where: { message: 'retry-sweep-now' } });
      expect(afterDirect?.attempts ?? 0).toBeGreaterThanOrEqual(1);
      // Re-seed a due row, then drive it through the HTTP endpoint.
      await db.alertDelivery.create({
        data: { channel: 'email', to: 'ops@facility.gov.gh', message: 'retry-sweep-http', subject: 'Sweep', attempts: 0, nextAttemptAt: new Date(Date.now() - 1000) },
      });
      const res = await app.inject({ method: 'POST', url: '/api/v1/admin/developer/alerts/retry-sweep', headers: auth(developer.token) });
      expect(res.statusCode).toBe(200);
      expect(res.json().ok).toBe(true);
      const afterHttp = await db.alertDelivery.findFirst({ where: { message: 'retry-sweep-http' } });
      expect(afterHttp?.attempts ?? 0).toBeGreaterThanOrEqual(1);
      const audit = await db.auditLog.findFirst({ where: { action: 'developer.alerts.retry-sweep' } });
      expect(audit).toBeDefined();
      expect(audit?.after).toContain('"retried":');
      // Non-developers cannot force the sweep.
      const denied = await app.inject({ method: 'POST', url: '/api/v1/admin/developer/alerts/retry-sweep', headers: auth(admin.token) });
      expect(denied.statusCode).toBe(403);
    } finally {
      await db.alertDelivery.deleteMany({ where: { message: { startsWith: 'retry-sweep-' } } });
      await clearSetting(db, 'mail.host');
      resetMailTransportForTest();
    }
  });

  it('POST /alerts/test-escalation verifies the on-call path (and degrades when unconfigured)', async () => {
    const { setMailTransportForTest, resetMailTransportForTest } = await import('../src/lib/mail.js');
    const sent: Array<{ to?: string; subject?: string }> = [];
    await setSetting(db, 'security.alertEmail', 'ops@facility.gov.gh');
    await setSetting(db, 'security.escalationEmail', 'oncall@facility.gov.gh');
    await setSetting(db, 'mail.host', 'smtp.example.com');
    setMailTransportForTest(() => ({
      sendMail: async (mail: { to?: string; subject?: string }) => {
        sent.push(mail);
        return { messageId: 'esc-test-1' };
      },
    }));
    try {
      // Configured → a CRITICAL test alert reaches both recipients.
      const res = await app.inject({ method: 'POST', url: '/api/v1/admin/developer/alerts/test-escalation', headers: auth(developer.token) });
      expect(res.statusCode).toBe(200);
      expect(res.json().sent).toBe(true);
      expect(res.json().message).toContain('oncall@facility.gov.gh');
      const deadline = Date.now() + 2000;
      while (sent.length < 2 && Date.now() < deadline) await new Promise((r) => setTimeout(r, 50));
      const tos = sent.map((m) => m.to).sort();
      expect(tos).toEqual(['oncall@facility.gov.gh', 'ops@facility.gov.gh']);
      expect(sent.every((m) => m.subject?.includes('[CRITICAL]'))).toBe(true);
      // recordAudit is fire-and-forget — poll (like the other audit tests).
      const audit = await waitForAudit('developer.alerts.test-escalation');
      expect(audit?.after).toContain('oncall@facility.gov.gh');

      // Unconfigured → 200 with a graceful not-sent note.
      sent.length = 0;
      await clearSetting(db, 'security.escalationEmail');
      const unconf = await app.inject({ method: 'POST', url: '/api/v1/admin/developer/alerts/test-escalation', headers: auth(developer.token) });
      expect(unconf.statusCode).toBe(200);
      expect(unconf.json().sent).toBe(false);
      expect(unconf.json().message).toContain('No escalation email configured');
      expect(sent.length).toBe(0);
    } finally {
      // Remove the probe's inbox rows (event=test, critical) — the CSV/filter
      // test later asserts every test-event alert is severity 'info'. The inbox
      // write is fire-and-forget (dispatchSecurityAlert does not await it), so a
      // blanket deleteMany can race the create and leak a critical test row into
      // the shared DB. Poll for the row, then delete by id.
      const probe = await waitForAlertRow('test', 'Test escalation alert');
      if (probe) await db.securityAlert.delete({ where: { id: probe.id } });
      await clearSetting(db, 'security.alertEmail');
      await clearSetting(db, 'security.escalationEmail');
      await clearSetting(db, 'mail.host');
      resetMailTransportForTest();
    }
  });

  it('sends security alerts over WhatsApp — transient failures queue and the retry sweep delivers', async () => {
    const { dispatchSecurityAlert, runAlertRetrySweep, deliveryStats } = await import('../src/lib/alert.js');
    await setSetting(db, 'security.alertWhatsApp', '+233240000000');
    await setSetting(db, 'wa.provider', 'smsonlinegh');
    await setSetting(db, 'sms.smsonlinegh.apiKey', 'wa-test-key');
    await setSetting(db, 'wa.smsonlinegh.url', 'https://wa.example.test/send');
    const realFetch = globalThis.fetch;
    let mode: 'down' | 'up' = 'down';
    globalThis.fetch = (async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
      const url = String(input);
      if (url.includes('wa.example.test')) {
        if (mode === 'down') {
          return new Response(JSON.stringify({ handshake: { id: 1, label: 'account error' }, data: null }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(
          JSON.stringify({ handshake: { id: 0 }, data: { batch: 'wa-batch-1', destinations: [{ id: 'wa-d1', to: '233240000000', status: { id: 0, label: 'DS_DELIVERED' } }] } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      return realFetch(input, init);
    }) as typeof fetch;
    try {
      dispatchSecurityAlert({ event: 'lockout', message: 'whatsapp channel lockout alert' }, db);
      const row = await waitForAlertRow('lockout', 'whatsapp channel lockout alert');
      expect(row).toBeDefined();
      // The rejected WhatsApp send is queued — with the alert's event for the drawer.
      const deadline = Date.now() + 2000;
      let q: { id: string; event: string | null; deliveredAt: Date | null } | null = null;
      while (Date.now() < deadline) {
        q = await db.alertDelivery.findFirst({ where: { channel: 'whatsapp', to: '+233240000000' }, select: { id: true, event: true, deliveredAt: true } });
        if (q) break;
        await new Promise((r) => setTimeout(r, 50));
      }
      expect(q).toBeDefined();
      expect(q?.event).toBe('lockout');
      expect(q?.deliveredAt).toBeNull();
      // The channel is bucketed in the delivery stats (Overview + Alerts strips).
      const stats = await deliveryStats(db);
      expect(stats.map((s) => s.channel)).toEqual(['email', 'sms', 'whatsapp', 'webhook']);
      expect(stats.find((s) => s.channel === 'whatsapp')!.pending).toBeGreaterThanOrEqual(1);
      // Gateway recovers → the sweep delivers the queued row.
      mode = 'up';
      await db.alertDelivery.update({ where: { id: q!.id }, data: { nextAttemptAt: new Date(Date.now() - 1000) } });
      const sweep = await runAlertRetrySweep(db);
      expect(sweep.delivered).toBeGreaterThanOrEqual(1);
      expect((await db.alertDelivery.findUnique({ where: { id: q!.id } }))?.deliveredAt).not.toBeNull();
    } finally {
      globalThis.fetch = realFetch;
      await db.alertDelivery.deleteMany({ where: { channel: 'whatsapp' } });
      await db.securityAlert.deleteMany({ where: { message: { contains: 'whatsapp channel lockout alert' } } });
      await clearSetting(db, 'security.alertWhatsApp');
      await clearSetting(db, 'wa.provider');
      await clearSetting(db, 'sms.smsonlinegh.apiKey');
      await clearSetting(db, 'wa.smsonlinegh.url');
    }
  });

  it('POST /alerts/test-whatsapp probes the channel (and degrades when unconfigured)', async () => {
    const realFetch = globalThis.fetch;
    globalThis.fetch = (async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
      const url = String(input);
      if (url.includes('wa.example.test')) {
        return new Response(
          JSON.stringify({ handshake: { id: 0 }, data: { batch: 'wa-probe-1', destinations: [{ id: 'p1', to: '233259999999', status: { id: 0, label: 'DS_DELIVERED' } }] } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      return realFetch(input, init);
    }) as typeof fetch;
    await setSetting(db, 'security.alertWhatsApp', '+233259999999');
    await setSetting(db, 'wa.provider', 'smsonlinegh');
    await setSetting(db, 'sms.smsonlinegh.apiKey', 'wa-probe-key');
    await setSetting(db, 'wa.smsonlinegh.url', 'https://wa.example.test/send');
    try {
      const res = await app.inject({ method: 'POST', url: '/api/v1/admin/developer/alerts/test-whatsapp', headers: auth(developer.token) });
      expect(res.statusCode).toBe(200);
      expect(res.json().sent).toBe(true);
      expect(res.json().message).toContain('+233259999999');
      const audit = await waitForAudit('developer.alerts.test-whatsapp');
      expect(audit).toBeDefined();
      expect(audit?.after).toContain('"sent":true');

      // Unconfigured → 200 with a graceful not-sent note.
      await clearSetting(db, 'security.alertWhatsApp');
      const unconf = await app.inject({ method: 'POST', url: '/api/v1/admin/developer/alerts/test-whatsapp', headers: auth(developer.token) });
      expect(unconf.statusCode).toBe(200);
      expect(unconf.json().sent).toBe(false);
      expect(unconf.json().message).toContain('No WhatsApp alert number configured');

      // Non-developers cannot probe the channel.
      const denied = await app.inject({ method: 'POST', url: '/api/v1/admin/developer/alerts/test-whatsapp', headers: auth(admin.token) });
      expect(denied.statusCode).toBe(403);
    } finally {
      globalThis.fetch = realFetch;
      await clearSetting(db, 'security.alertWhatsApp');
      await clearSetting(db, 'wa.provider');
      await clearSetting(db, 'sms.smsonlinegh.apiKey');
      await clearSetting(db, 'wa.smsonlinegh.url');
    }
  });

  it('a critical digest also emails the on-call escalation recipient (gate-independent)', async () => {
    const { runDailyDigest } = await import('../src/lib/alert.js');
    const { setMailTransportForTest, resetMailTransportForTest } = await import('../src/lib/mail.js');
    const sent: Array<{ to?: string; subject?: string }> = [];
    let myDigestRow: { id: string } | null = null;
    await setSetting(db, 'security.alertEmail', 'ops@facility.gov.gh');
    await setSetting(db, 'security.escalationEmail', 'oncall@facility.gov.gh');
    await setSetting(db, 'mail.host', 'smtp.example.com');
    // A raised gate must not mute the on-call path on a critical day.
    await setSetting(db, 'alerts.emailMinSeverity', 'critical');
    setMailTransportForTest(() => ({
      sendMail: async (mail: { to?: string; subject?: string }) => {
        sent.push(mail);
        return { messageId: 'digest-oncall-1' };
      },
    }));
    try {
      // Force a critical digest: a lapsed license (lockouts would leak across tests).
      await clearSetting(db, 'alerts.lastDigestDate');
      await setSetting(db, 'license.key', 'GIHM-ONCALL-0001');
      await setSetting(db, 'license.expiresAt', new Date(Date.now() - 1000).toISOString());
      await setSetting(db, 'alerts.digestEnabled', 'true');
      const res = await runDailyDigest(db);
      expect(res.published).toBe(true);
      const deadline = Date.now() + 2000;
      while (sent.length < 2 && Date.now() < deadline) await new Promise((r) => setTimeout(r, 50));
      expect(sent.map((m) => m.to).sort()).toEqual(['oncall@facility.gov.gh', 'ops@facility.gov.gh']);
      expect(sent.every((m) => m.subject?.includes('[CRITICAL]'))).toBe(true);
      // Capture the exact digest row id so cleanup is order-independent.
      myDigestRow = await waitForAlertRow('digest', 'license EXPIRED');
    } finally {
      if (myDigestRow) await db.securityAlert.delete({ where: { id: myDigestRow.id } });
      await clearSetting(db, 'alerts.lastDigestDate');
      await clearSetting(db, 'security.alertEmail');
      await clearSetting(db, 'security.escalationEmail');
      await clearSetting(db, 'license.key');
      await clearSetting(db, 'license.expiresAt');
      await clearSetting(db, 'mail.host');
      await clearSetting(db, 'alerts.emailMinSeverity');
      resetMailTransportForTest();
    }
  });
});

describe('developer audit — CSV export', () => {
  it('exports the filtered trail as fully-quoted CSV with formula-injection neutralized', async () => {
    // Seed a hostile cell (spreadsheet formula) to prove the guard works.
    await db.auditLog.create({
      data: { actorEmail: '=HYPERLINK("http://evil.example")', action: 'policy.test', role: 'NURSE', entityType: 'user', ip: '10.0.0.9' },
    });
    const res = await app.inject({ method: 'GET', url: '/api/v1/admin/developer/audit?action=policy.test&format=csv', headers: auth(developer.token) });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('developer-audit.csv');
    expect(res.body.startsWith('"When","Actor","Role"')).toBe(true);
    expect(res.body).toContain('"policy.test"');
    // The hostile cell is neutralized with a leading apostrophe…
    expect(res.body).toContain("'=HYPERLINK");
    // …and never appears as a live formula.
    expect(res.body).not.toContain(',"=HYPERLINK');
  });
});

describe('developer audit — date-range filtering', () => {
  it('a date-only to bound includes the entire selected day (end-of-day)', async () => {
    // Seed an entry at 15:00 UTC today — a midnight-bound filter would miss it.
    const now = new Date();
    const afternoon = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 15, 0, 0));
    const seeded = await db.auditLog.create({
      data: { action: 'policy.test', actorEmail: 'afternoon@demo.gh', entityType: 'test', createdAt: afternoon },
    });
    const day = now.toISOString().slice(0, 10);
    const res = await app.inject({ method: 'GET', url: `/api/v1/admin/developer/audit?from=${day}&to=${day}&action=policy.test`, headers: auth(developer.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.entries.some((e: { id: string }) => e.id === seeded.id)).toBe(true);
  });
});

describe('token-version session revocation', () => {
  it('revokes a single user sessions and rejects their old token', async () => {
    // The target user already has a valid token from beforeAll (login returned token).
    const tokenBefore = developer.token;
    // The developer token should work.
    const me1 = await app.inject({ method: 'GET', url: '/api/v1/auth/me', headers: auth(tokenBefore) });
    expect(me1.statusCode).toBe(200);

    // Revoke the developer's sessions.
    const revoke = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/developer/users/${devUserId()}/revoke-sessions`,
      headers: auth(developer.token),
    });
    expect(revoke.statusCode).toBe(200);
    expect(revoke.json().tokenVersion).toBeGreaterThanOrEqual(1);

    // The old token is now rejected.
    const me2 = await app.inject({ method: 'GET', url: '/api/v1/auth/me', headers: auth(tokenBefore) });
    expect(me2.statusCode).toBe(401);
    expect(me2.json().error.message).toContain('Session revoked');
  });

  // Helper — the developer user id from the token. We decode the JWT to find it.
  function devUserId(): string {
    const raw = developer.token.split('.')[1] ?? '';
    const payload = JSON.parse(Buffer.from(raw, 'base64url').toString());
    return payload.sub as string;
  }
});

describe('revoke-all sessions', () => {
  it('increments tokenVersion for every user, invalidating all sessions', async () => {
    // Admin has a valid session.
    const adminMe = await app.inject({ method: 'GET', url: '/api/v1/auth/me', headers: auth(admin.token) });
    expect(adminMe.statusCode).toBe(200);

    // Developer has a valid session (re-login after the previous revoke).
    const relogin = await login('policy-dev@demo.gh', 'Demo@123', '10.4.0.1');
    expect(relogin.statusCode).toBe(200);
    developer = { token: relogin.json().token as string };

    // Revoke all.
    const revokeAll = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/developer/users/revoke-all',
      headers: auth(developer.token),
    });
    expect(revokeAll.statusCode).toBe(200);
    expect(revokeAll.json().affected).toBeGreaterThanOrEqual(2);

    // Old tokens are now rejected.
    const oldAdmin = await app.inject({ method: 'GET', url: '/api/v1/auth/me', headers: auth(admin.token) });
    expect(oldAdmin.statusCode).toBe(401);

    // The revoke-all audit entry exists.
    const audit = await db.auditLog.findFirst({ where: { action: 'developer.user.revoke-all' } });
    expect(audit).toBeDefined();
    expect(audit?.after).toContain('"count":');

    // Re-login the developer and admin for the remaining tests.
    const devLogin = await login('policy-dev@demo.gh', 'Demo@123', '10.4.0.2');
    expect(devLogin.statusCode).toBe(200);
    developer = { token: devLogin.json().token as string };
    const admLogin = await login('policy-admin@demo.gh', 'Demo@123', '10.4.0.3');
    expect(admLogin.statusCode).toBe(200);
    admin = { token: admLogin.json().token as string };
  });
});

describe('security alert inbox + license expiry sweep', () => {
  it('lists alerts, marks them read individually and in bulk, and sends a test alert', async () => {
    // Trigger a test alert through the developer endpoint.
    const test = await app.inject({ method: 'POST', url: '/api/v1/admin/developer/alerts/test', headers: auth(developer.token) });
    expect(test.statusCode).toBe(200);
    // Give the fire-and-forget inbox write a moment (poll, CI-safe).
    const deadline = Date.now() + 2000;
    let count = 0;
    while (count === 0 && Date.now() < deadline) {
      count = await db.securityAlert.count({ where: { event: 'test' } });
      if (count === 0) await new Promise((r) => setTimeout(r, 50));
    }
    expect(count).toBeGreaterThanOrEqual(1);

    // The inbox endpoint surfaces it as unread.
    const list = await app.inject({ method: 'GET', url: '/api/v1/admin/developer/alerts', headers: auth(developer.token) });
    expect(list.statusCode).toBe(200);
    const body = list.json();
    expect(body.unread).toBeGreaterThanOrEqual(1);
    const testAlert = body.alerts.find((a: { event: string }) => a.event === 'test');
    expect(testAlert).toBeDefined();
    expect(testAlert.read).toBe(false);

    // Mark it read.
    const read = await app.inject({ method: 'POST', url: `/api/v1/admin/developer/alerts/${testAlert.id}/read`, headers: auth(developer.token) });
    expect(read.statusCode).toBe(200);
    // A non-developer is denied the inbox.
    const denied = await app.inject({ method: 'GET', url: '/api/v1/admin/developer/alerts', headers: auth(admin.token) });
    expect(denied.statusCode).toBe(403);
  });

  it('alerts when the license enters the expiry window, then dedupes for 24h', async () => {
    const { runLicenseExpiryCheck } = await import('../src/lib/alert.js');
    // Activate with an expiry 5 days out and a 14-day window.
    await setSetting(db, 'license.alertDaysBefore', '14');
    await setSetting(db, 'license.expiresAt', new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString());
    await setSetting(db, 'license.key', 'GIHM-EXPIRY-AAAA');

    const first = await runLicenseExpiryCheck(db);
    expect(first.alerted).toBe(true);
    expect(first.daysLeft).toBe(5);

    // Immediately re-running is deduped (once per 24h) — no second alert.
    const second = await runLicenseExpiryCheck(db);
    expect(second.alerted).toBe(false);

    // Exactly one license.expiring inbox row for this license (content-scoped by key suffix).
    const expiringRow = await waitForAlertRow('license.expiring', 'AAAA');
    expect(expiringRow).toBeDefined();
    expect((await db.securityAlert.findMany({ where: { event: 'license.expiring', message: { contains: 'AAAA' } } })).length).toBe(1);

    // Outside the window (60 days out) — no alert.
    await setSetting(db, 'license.expiryAlertedAt', '');
    await setSetting(db, 'license.expiresAt', new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString());
    const far = await runLicenseExpiryCheck(db);
    expect(far.alerted).toBe(false);

    // Without a license key (deactivated), a stale expiresAt never alerts.
    await setSetting(db, 'license.key', '');
    await setSetting(db, 'license.expiryAlertedAt', '');
    const unactivated = await runLicenseExpiryCheck(db);
    expect(unactivated.alerted).toBe(false);
  });

  it('alerts once when the license actually lapses (license.expired)', async () => {
    const { runLicenseExpiryCheck } = await import('../src/lib/alert.js');
    await setSetting(db, 'license.key', 'GIHM-EXPIRED-BBBB');
    await setSetting(db, 'license.expiryAlertedAt', '');
    await setSetting(db, 'license.expiredAlertedAt', '');
    await setSetting(db, 'license.expiresAt', new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()); // expired yesterday

    const first = await runLicenseExpiryCheck(db);
    expect(first.alerted).toBe(true);
    expect(first.daysLeft).toBeLessThanOrEqual(0);
    const expiredRow = await waitForAlertRow('license.expired', 'BBBB');
    expect(expiredRow).toBeDefined();

    // One-shot per expiry date — a second run adds nothing (content-scoped).
    const second = await runLicenseExpiryCheck(db);
    expect(second.alerted).toBe(false);
    expect((await db.securityAlert.findMany({ where: { event: 'license.expired', message: { contains: 'BBBB' } } })).length).toBe(1);
  });

  it('exports the alert inbox as CSV and filters by event', async () => {
    // Self-sufficient: seed the row directly instead of relying on leftovers
    // from earlier tests (which race under full-suite load).
    await db.securityAlert.create({ data: { event: 'test', severity: 'info', title: 'CSV row', message: 'csv-export-row', payload: '{}' } });
    const csv = await app.inject({ method: 'GET', url: '/api/v1/admin/developer/alerts?format=csv', headers: auth(developer.token) });
    expect(csv.statusCode).toBe(200);
    expect(csv.headers['content-type']).toContain('text/csv');
    expect(csv.headers['content-disposition']).toContain('security-alerts.csv');
    expect(csv.body.startsWith('"When","Event","Severity","Title"')).toBe(true);

    // Event filter narrows the list; a formula-hostile message is neutralized.
    const filtered = await app.inject({ method: 'GET', url: '/api/v1/admin/developer/alerts?event=test', headers: auth(developer.token) });
    expect(filtered.statusCode).toBe(200);
    const body = filtered.json();
    expect(body.alerts.length).toBeGreaterThanOrEqual(1);
    expect(body.alerts.every((a: { event: string }) => a.event === 'test')).toBe(true);
    expect(body.alerts.every((a: { severity: string }) => a.severity === 'info')).toBe(true);
    expect(body.unread).toBeGreaterThanOrEqual(0);

    // Non-developers cannot export.
    const denied = await app.inject({ method: 'GET', url: '/api/v1/admin/developer/alerts?format=csv', headers: auth(admin.token) });
    expect(denied.statusCode).toBe(403);
  });

  it('GET /alerts/:id returns the alert payload with its fan-out delivery history', async () => {
    const alert = await db.securityAlert.create({
      data: {
        event: 'lockout',
        severity: 'critical',
        title: 'Detail row',
        message: 'detail-drawer-alert',
        payload: JSON.stringify({ event: 'lockout', severity: 'critical', email: 'x@demo.gh' }),
      },
    });
    try {
      await db.alertDelivery.create({ data: { channel: 'email', to: 'ops@facility.gov.gh', message: 'detail-drawer-alert', event: 'lockout', attempts: 0, nextAttemptAt: new Date(), deliveredAt: new Date() } });
      await db.alertDelivery.create({ data: { channel: 'whatsapp', to: '+233240000000', message: 'detail-drawer-alert', event: 'lockout', attempts: 1, nextAttemptAt: new Date(Date.now() + 3600 * 1000), lastError: 'gateway down' } });
      // A different event near the same time must NOT leak into this alert's history.
      await db.alertDelivery.create({ data: { channel: 'sms', to: '+233241111111', message: 'detail-other-event', event: 'license.activate', attempts: 0, nextAttemptAt: new Date() } });

      const res = await app.inject({ method: 'GET', url: `/api/v1/admin/developer/alerts/${alert.id}`, headers: auth(developer.token) });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.alert.message).toBe('detail-drawer-alert');
      expect(body.alert.payload.event).toBe('lockout');
      expect(body.deliveries.length).toBe(2);
      expect(body.deliveries.map((d: { channel: string }) => d.channel).sort()).toEqual(['email', 'whatsapp']);
      const wa = body.deliveries.find((d: { channel: string }) => d.channel === 'whatsapp');
      expect(wa.status).toBe('RETRYING');
      expect(wa.lastError).toBe('gateway down');
      expect(body.deliveries.find((d: { channel: string }) => d.channel === 'email').status).toBe('DELIVERED');

      // Unknown id → 404; non-developers → 403.
      const nf = await app.inject({ method: 'GET', url: '/api/v1/admin/developer/alerts/does-not-exist', headers: auth(developer.token) });
      expect(nf.statusCode).toBe(404);
      const denied = await app.inject({ method: 'GET', url: `/api/v1/admin/developer/alerts/${alert.id}`, headers: auth(admin.token) });
      expect(denied.statusCode).toBe(403);
    } finally {
      await db.securityAlert.delete({ where: { id: alert.id } });
      await db.alertDelivery.deleteMany({ where: { message: { in: ['detail-drawer-alert', 'detail-other-event'] } } });
    }
  });

  it('publishes a daily digest at most once per calendar day, with computed severity', async () => {
    const { runDailyDigest } = await import('../src/lib/alert.js');
    // Scope the digest to this test: drop THIS FILE's own lockout rows (their
    // payloads carry the target emails) so the 24h count is deterministic —
    // never another file's rows (they could be asserting on them).
    // The webhook test's inbox row is written fire-and-forget, so poll until
    // the deletes actually stick before counting (CI-safe).
    for (const email of ['policy-target@demo.gh', 'policy-alert@demo.gh']) {
      const deadline = Date.now() + 2000;
      while (Date.now() < deadline) {
        await db.securityAlert.deleteMany({ where: { event: 'lockout', payload: { contains: email } } });
        const left = await db.securityAlert.count({ where: { event: 'lockout', payload: { contains: email } } });
        if (left === 0) break;
        await new Promise((r) => setTimeout(r, 50));
      }
    }
    // Fresh dedup marker; an active license inside the window → warning digest.
    await clearSetting(db, 'alerts.lastDigestDate');
    await setSetting(db, 'license.key', 'GIHM-DIGEST-EEEE');
    await setSetting(db, 'license.edition', 'ENTERPRISE');
    await setSetting(db, 'license.alertDaysBefore', '14');
    await setSetting(db, 'license.expiryAlertedAt', '');
    await setSetting(db, 'license.expiresAt', new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString());

    const first = await runDailyDigest(db);
    expect(first.published).toBe(true);
    expect(first.date).toBe(new Date().toISOString().slice(0, 10));
    const digestRow = await waitForAlertRow('digest', 'GIHM-HIS DIGEST');
    expect(digestRow).toBeDefined();
    const row = await db.securityAlert.findUnique({ where: { id: digestRow!.id } });
    expect(row?.severity).toBe('warning'); // license inside the window
    expect(row?.message).toContain('license ENTERPRISE active');

    // A second run the same calendar day is deduped — still exactly one digest.
    const second = await runDailyDigest(db);
    expect(second.published).toBe(false);
    expect(await db.securityAlert.count({ where: { event: 'digest' } })).toBe(1);

    // With the feature disabled the digest never publishes.
    await setSetting(db, 'alerts.digestEnabled', 'false');
    await clearSetting(db, 'alerts.lastDigestDate');
    const disabled = await runDailyDigest(db);
    expect(disabled.published).toBe(false);
    await setSetting(db, 'alerts.digestEnabled', 'true');

    // With a lapsed license the digest escalates to critical.
    await clearSetting(db, 'alerts.lastDigestDate');
    await setSetting(db, 'license.expiresAt', new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString());
    const critical = await runDailyDigest(db);
    expect(critical.published).toBe(true);
    const criticalRow = await waitForAlertRow('digest', 'license EXPIRED');
    expect(criticalRow).toBeDefined();
    expect((await db.securityAlert.findUnique({ where: { id: criticalRow!.id } }))?.severity).toBe('critical');

    await clearSetting(db, 'alerts.lastDigestDate');
  });

  it('a D-1 expiring alert never swallows the D-0 expired alert', async () => {
    const { runLicenseExpiryCheck } = await import('../src/lib/alert.js');
    await setSetting(db, 'license.key', 'GIHM-COLLISION-CCCC');
    await setSetting(db, 'license.expiryAlertedAt', '');
    await setSetting(db, 'license.expiredAlertedAt', '');
    // D-1: one day out → expiring alert fires (time marker set).
    await setSetting(db, 'license.expiresAt', new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString());
    const dayBefore = await runLicenseExpiryCheck(db);
    expect(dayBefore.alerted).toBe(true);
    expect(dayBefore.daysLeft).toBe(1);
    // Immediately lapse (D-0) — the expiring alert's time marker must NOT
    // suppress the one-shot expired alert (separate date-keyed marker).
    await setSetting(db, 'license.expiresAt', new Date(Date.now() - 1 * 3600 * 1000).toISOString());
    const dayOf = await runLicenseExpiryCheck(db);
    expect(dayOf.alerted).toBe(true);
    expect(dayOf.daysLeft).toBeLessThanOrEqual(0);
    const expiredRow = await waitForAlertRow('license.expired', 'CCCC');
    expect(expiredRow).toBeDefined();
    // Exactly one expired alert for this license's expiry (content-scoped).
    expect((await db.securityAlert.findMany({ where: { event: 'license.expired', message: { contains: 'CCCC' } } })).length).toBe(1);
  });

  it('filters the alert inbox by severity (and combined with event)', async () => {
    // Deterministic rows — independent of whatever the other tests produced.
    await db.securityAlert.create({ data: { event: 'test', severity: 'critical', title: 'Critical row', message: 'severity-filter-critical-row', payload: '{}' } });
    await db.securityAlert.create({ data: { event: 'test', severity: 'warning', title: 'Warning row', message: 'severity-filter-warning-row', payload: '{}' } });

    const crit = await app.inject({ method: 'GET', url: '/api/v1/admin/developer/alerts?severity=critical&event=test', headers: auth(developer.token) });
    expect(crit.statusCode).toBe(200);
    const critBody = crit.json();
    expect(critBody.alerts.some((a: { message: string }) => a.message === 'severity-filter-critical-row')).toBe(true);
    expect(critBody.alerts.every((a: { severity: string }) => a.severity === 'critical')).toBe(true);

    const warn = await app.inject({ method: 'GET', url: '/api/v1/admin/developer/alerts?severity=warning&event=test', headers: auth(developer.token) });
    expect(warn.json().alerts.some((a: { message: string }) => a.message === 'severity-filter-warning-row')).toBe(true);
    expect(warn.json().alerts.every((a: { severity: string }) => a.severity === 'warning')).toBe(true);

    // Combined event+severity narrows to the intersection — seed a critical
    // lockout row so the check is non-vacuous (this file's earlier lockout rows
    // were scoped-deleted by the digest test).
    await db.securityAlert.create({ data: { event: 'lockout', severity: 'critical', title: 'Lockout row', message: 'severity-filter-critical-lockout', payload: '{}' } });
    const both = await app.inject({ method: 'GET', url: '/api/v1/admin/developer/alerts?severity=critical&event=lockout', headers: auth(developer.token) });
    expect(both.statusCode).toBe(200);
    const bothBody = both.json();
    expect(bothBody.alerts.length).toBeGreaterThanOrEqual(1);
    expect(bothBody.alerts.some((a: { message: string }) => a.message === 'severity-filter-critical-lockout')).toBe(true);
    expect(bothBody.alerts.every((a: { severity: string; event: string }) => a.severity === 'critical' && a.event === 'lockout')).toBe(true);

    // The CSV export honours the severity filter too.
    const csv = await app.inject({ method: 'GET', url: '/api/v1/admin/developer/alerts?severity=warning&event=test&format=csv', headers: auth(developer.token) });
    expect(csv.statusCode).toBe(200);
    expect(csv.body).toContain('severity-filter-warning-row');
    expect(csv.body).not.toContain('severity-filter-critical-row');
  });
});

describe('alert retention — daily sweep and manual prune', () => {
  it('deletes inbox rows older than alerts.retentionDays, keeps recent, and audits the manual prune', async () => {
    const { runAlertRetentionSweep } = await import('../src/lib/alert.js');
    await setSetting(db, 'alerts.retentionDays', '30');

    const oldAlert = await db.securityAlert.create({ data: { event: 'test', severity: 'info', title: 'Old', message: 'retention-old-row', payload: '{}', createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000) } });
    const recentAlert = await db.securityAlert.create({ data: { event: 'test', severity: 'info', title: 'Recent', message: 'retention-recent-row', payload: '{}', createdAt: new Date(Date.now() - 60 * 1000) } });

    const result = await runAlertRetentionSweep(db);
    expect(result.deleted).toBeGreaterThanOrEqual(1);
    expect(await db.securityAlert.findUnique({ where: { id: oldAlert.id } })).toBeNull();
    expect(await db.securityAlert.findUnique({ where: { id: recentAlert.id } })).toBeDefined();

    // Manual prune endpoint: another stale row, POST, and the audit entry.
    const old2 = await db.securityAlert.create({ data: { event: 'test', severity: 'info', title: 'Old 2', message: 'retention-old-row-2', payload: '{}', createdAt: new Date(Date.now() - 40 * 24 * 3600 * 1000) } });
    const prune = await app.inject({ method: 'POST', url: '/api/v1/admin/developer/alerts/prune', headers: auth(developer.token) });
    expect(prune.statusCode).toBe(200);
    expect(prune.json().deleted).toBeGreaterThanOrEqual(1);
    expect(await db.securityAlert.findUnique({ where: { id: old2.id } })).toBeNull();
    const audit = await db.auditLog.findFirst({ where: { action: 'developer.alerts.prune' } });
    expect(audit).toBeDefined();
    expect(audit?.after).toContain('"deleted":');

    // Non-developers cannot prune.
    const denied = await app.inject({ method: 'POST', url: '/api/v1/admin/developer/alerts/prune', headers: auth(admin.token) });
    expect(denied.statusCode).toBe(403);

    await clearSetting(db, 'alerts.retentionDays');
  });
});

describe('alert delivery callback — gateway resolves pending rows', () => {
  const CALLBACK_KEYS = ['sms.smsonlinegh.callbackUrl', 'sms.smsonlinegh.callbackToken'];
  afterEach(async () => {
    for (const k of CALLBACK_KEYS) await clearSetting(db, k);
    await db.alertDelivery.deleteMany({ where: { message: { contains: 'callback-test' } } });
    await db.auditLog.deleteMany({ where: { action: 'developer.alerts.delivery-callback' } });
  });

  it('marks a pending WhatsApp row delivered when the gateway reports success', async () => {
    await setSetting(db, 'sms.smsonlinegh.callbackUrl', 'https://alerts.example.test/cb');
    await setSetting(db, 'sms.smsonlinegh.callbackToken', 'cb-secret');
    const row = await db.alertDelivery.create({
      data: {
        channel: 'whatsapp', to: '+233240000000', message: 'callback-test-wa-delivered', event: 'lockout',
        messageId: 'CB-WA-1', attempts: 0, nextAttemptAt: new Date(Date.now() + 3600_000),
      },
    });

    // No token → 401; bad token → 401.
    const noToken = await app.inject({ method: 'POST', url: '/api/v1/admin/developer/alerts/delivery-callback', payload: { messageId: 'CB-WA-1', status: { id: 3, label: 'DS_DELIVERED' } } });
    expect(noToken.statusCode).toBe(401);
    const badToken = await app.inject({ method: 'POST', url: '/api/v1/admin/developer/alerts/delivery-callback', headers: { 'x-callback-token': 'wrong' }, payload: { messageId: 'CB-WA-1', status: { id: 3, label: 'DS_DELIVERED' } } });
    expect(badToken.statusCode).toBe(401);

    const res = await app.inject({ method: 'POST', url: '/api/v1/admin/developer/alerts/delivery-callback', headers: { 'x-callback-token': 'cb-secret' }, payload: { messageId: 'CB-WA-1', status: { id: 3, label: 'DS_DELIVERED' } } });
    expect(res.statusCode).toBe(200);
    expect(res.json().outcome).toEqual({ resolved: true, channel: 'whatsapp', state: 'delivered' });
    const updated = await db.alertDelivery.findUnique({ where: { id: row.id } });
    expect(updated?.deliveredAt).toBeTruthy();
    // Durable gateway receipt lands on the audit trail.
    expect((await waitForAudit('developer.alerts.delivery-callback'))?.after).toContain('CB-WA-1');
  });

  it('exhausts a row on a permanent gateway rejection so the sweep never re-dispatches it', async () => {
    const row = await db.alertDelivery.create({
      data: {
        channel: 'whatsapp', to: '+233240000000', message: 'callback-test-wa-rejected', event: 'license.expired',
        messageId: 'CB-WA-2', attempts: 0, nextAttemptAt: new Date(Date.now() + 3600_000),
      },
    });
    // The alert must exist for the drawer status check below.
    const alert = await db.securityAlert.create({
      data: { event: 'license.expired', severity: 'critical', title: 'License expired', message: 'callback-test-wa-rejected alert', payload: JSON.stringify({ event: 'license.expired' }) },
    });
    const res = await app.inject({ method: 'POST', url: '/api/v1/admin/developer/alerts/delivery-callback', payload: { messageId: 'CB-WA-2', status: { id: 6, label: 'DS_REJECTED_SENDER_UNREGISTERED' } } });
    expect(res.statusCode).toBe(200);
    expect(res.json().outcome.state).toBe('exhausted');
    const updated = await db.alertDelivery.findUnique({ where: { id: row.id } });
    expect(updated?.lastError).toContain('DS_REJECTED_SENDER_UNREGISTERED');
    expect(updated?.attempts).toBeGreaterThanOrEqual(1);
    expect(updated?.deliveredAt).toBeNull();
    // The detail drawer labels the row EXHAUSTED (never RETRYING) — the sweep
    // must not re-dispatch it and the panel must say so.
    await db.securityAlert.update({ where: { id: alert.id }, data: { createdAt: new Date(Date.now() - 60_000) } });
    await db.alertDelivery.update({ where: { id: row.id }, data: { createdAt: new Date(Date.now() - 60_000) } });
    const detail = await app.inject({ method: 'GET', url: `/api/v1/admin/developer/alerts/${alert.id}`, headers: auth(developer.token) });
    expect(detail.statusCode).toBe(200);
    const delivery = detail.json().deliveries.find((x: { id: string }) => x.id === row.id);
    expect(delivery?.status).toBe('EXHAUSTED');
    await db.securityAlert.deleteMany({ where: { id: alert.id } });
  });

  it('keeps a row pending on an unknown/transient status and records the gateway note', async () => {
    const row = await db.alertDelivery.create({
      data: {
        channel: 'sms', to: '+233240000000', message: 'callback-test-sms-pending', event: 'lockout',
        messageId: 'CB-SMS-1', attempts: 0, nextAttemptAt: new Date(Date.now() + 3600_000),
      },
    });
    const res = await app.inject({ method: 'POST', url: '/api/v1/admin/developer/alerts/delivery-callback', payload: { messageId: 'CB-SMS-1', status: { id: 1, label: 'DS_ENROUTE' } } });
    expect(res.statusCode).toBe(200);
    expect(res.json().outcome.state).toBe('pending');
    const updated = await db.alertDelivery.findUnique({ where: { id: row.id } });
    expect(updated?.lastError).toContain('DS_ENROUTE');
    expect(updated?.deliveredAt).toBeNull();
    expect(updated?.attempts).toBe(0); // still retry-eligible
  });

  it('returns resolved:false (200, no error) for an unknown message id', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/admin/developer/alerts/delivery-callback', payload: { messageId: 'CB-UNKNOWN-1', status: { id: 3, label: 'DS_DELIVERED' } } });
    expect(res.statusCode).toBe(200);
    expect(res.json().outcome).toEqual({ resolved: false, state: 'none' });
  });

  it('accepts Hubtel-format delivery reports ({ MessageId, Status }) and resolves the row', async () => {
    const row = await db.alertDelivery.create({
      data: {
        channel: 'whatsapp', to: '+233240000000', message: 'callback-test-hubtel-report', event: 'lockout',
        messageId: 'HUBTEL-RPT-1', attempts: 0, nextAttemptAt: new Date(Date.now() + 3600_000),
      },
    });
    // Hubtel posts to its configured report URL with this shape.
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/developer/alerts/delivery-callback',
      payload: { Message: 'Success', MessageId: 'HUBTEL-RPT-1', Status: 'Delivered' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().outcome.state).toBe('delivered');
    const updated = await db.alertDelivery.findUnique({ where: { id: row.id } });
    expect(updated?.deliveredAt).toBeTruthy();

    // A Hubtel failure report exhausts the row.
    const row2 = await db.alertDelivery.create({
      data: {
        channel: 'sms', to: '+233240000000', message: 'callback-test-hubtel-fail', event: 'license.expired',
        messageId: 'HUBTEL-RPT-2', attempts: 0, nextAttemptAt: new Date(Date.now() + 3600_000),
      },
    });
    const failed = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/developer/alerts/delivery-callback',
      payload: { Message: 'Failed', MessageId: 'HUBTEL-RPT-2', Status: 'FAILED' },
    });
    expect(failed.json().outcome.state).toBe('exhausted');
    const updated2 = await db.alertDelivery.findUnique({ where: { id: row2.id } });
    expect(updated2?.deliveredAt).toBeNull();
    expect(updated2?.attempts).toBeGreaterThanOrEqual(1);
  });
});

describe('audit prune', () => {
  it('deletes audit entries older than the retention window', async () => {
    // Create a very old audit entry.
    const veryOld = await db.auditLog.create({
      data: {
        action: 'policy.test',
        actorEmail: 'old@demo.gh',
        entityType: 'test',
        createdAt: new Date(Date.now() - 400 * 24 * 3600 * 1000), // 400 days ago
      },
    });
    // Create a recent entry.
    const recent = await db.auditLog.create({
      data: {
        action: 'policy.test',
        actorEmail: 'recent@demo.gh',
        entityType: 'test',
        createdAt: new Date(Date.now() - 10 * 3600 * 1000), // 10 hours ago
      },
    });

    // Delivery-retry rows age out with the same retention window (delivered rows
    // by delivery time; exhausted rows by creation). Fresh queued rows survive.
    const oldDelivered = await db.alertDelivery.create({
      data: { channel: 'email', to: 'x@demo.gh', message: 'old-delivered', attempts: 2, deliveredAt: new Date(Date.now() - 400 * 24 * 3600 * 1000), nextAttemptAt: new Date() },
    });
    const freshQueued = await db.alertDelivery.create({
      data: { channel: 'email', to: 'x@demo.gh', message: 'fresh-queued', attempts: 0, nextAttemptAt: new Date(Date.now() + 3600 * 1000) },
    });

    // The default retention is 365 days, so the 400-day-old entry should be deleted.
    const prune = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/developer/audit/prune',
      headers: auth(developer.token),
    });
    expect(prune.statusCode).toBe(200);
    expect(prune.json().deleted).toBeGreaterThanOrEqual(1);
    expect(prune.json().deliveries).toBeGreaterThanOrEqual(1);
    expect(await db.alertDelivery.findUnique({ where: { id: oldDelivered.id } })).toBeNull();
    expect(await db.alertDelivery.findUnique({ where: { id: freshQueued.id } })).toBeDefined();

    // The old entry is gone.
    const oldCheck = await db.auditLog.findUnique({ where: { id: veryOld.id } });
    expect(oldCheck).toBeNull();
    // The recent entry survives.
    const recentCheck = await db.auditLog.findUnique({ where: { id: recent.id } });
    expect(recentCheck).toBeDefined();

    // Non-developers cannot prune.
    const denied = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/developer/audit/prune',
      headers: auth(admin.token),
    });
    expect(denied.statusCode).toBe(403);
  });
});

describe('license policy — capacity enforcement at the boundary', () => {
  it('blocks account creation over the user limit and lifts the block when raised', async () => {
    const activate = async (maxUsers: number) =>
      app.inject({
        method: 'POST',
        url: '/api/v1/admin/developer/license/activate',
        headers: auth(developer.token),
        payload: { key: 'GIHM-POLICY-0001', edition: 'ENTERPRISE', expiresAt: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().slice(0, 10), maxFacilities: 9999, maxUsers },
      });
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/users',
      headers: auth(admin.token),
      payload: { email: 'policy-staff@demo.gh', fullName: 'Policy Staff', roleCode: 'NURSE', password: 'StrongPass123!' },
    });
    expect(created.statusCode).toBe(200);
    createdUserIds.push(created.json().user.id as string);

    // maxUsers=1 with existing ACTIVE accounts → creation is refused.
    await activate(1);
    const blocked = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/users',
      headers: auth(admin.token),
      payload: { email: 'policy-over@demo.gh', fullName: 'Over Limit', roleCode: 'NURSE', password: 'StrongPass123!' },
    });
    expect(blocked.statusCode).toBe(403);
    expect(blocked.json().error.message).toContain('License user limit');

    // Raising the limit restores creation.
    await activate(9999);
    const ok = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/users',
      headers: auth(admin.token),
      payload: { email: 'policy-under@demo.gh', fullName: 'Under Limit', roleCode: 'NURSE', password: 'StrongPass123!' },
    });
    expect(ok.statusCode).toBe(200);
    createdUserIds.push(ok.json().user.id as string);

    const deact = await app.inject({ method: 'POST', url: '/api/v1/admin/developer/license/deactivate', headers: auth(developer.token) });
    expect(deact.statusCode).toBe(200);
    expect(deact.json().license.activated).toBe(false);
  });

  it('activating a license already inside the expiry window alerts immediately', async () => {
    // Activate with an expiry 3 days out (window 14) — the sweep runs inline on
    // activation, so a license.expiring inbox row appears without waiting.
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/developer/license/activate',
      headers: auth(developer.token),
      payload: { key: 'GIHM-ACTIVATE-DDDD', edition: 'ENTERPRISE', expiresAt: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().slice(0, 10), maxFacilities: 9999, maxUsers: 9999 },
    });
    expect(res.statusCode).toBe(200);
    const row = await waitForAlertRow('license.expiring', 'DDDD');
    expect(row).toBeDefined();
    const deact = await app.inject({ method: 'POST', url: '/api/v1/admin/developer/license/deactivate', headers: auth(developer.token) });
    expect(deact.statusCode).toBe(200);
  });
});