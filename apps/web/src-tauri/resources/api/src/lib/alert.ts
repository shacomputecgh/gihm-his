/**
 * Security alert dispatch — fire-and-forget notifications on lockout / license
 * events. Routes to an in-app inbox row (SecurityAlert), an SMS phone
 * (security.alertPhone via dispatchSms) and a webhook URL
 * (security.alertWebhook via POST). Each channel is independently optional —
 * none is required for the system to function, and the inbox row is always
 * written so the developer has a durable history.
 *
 * SSRF guard: the webhook URL is admin-editable, so a compromised admin could
 * point the server at internal services (cloud metadata, admin panels, …).
 * The target must parse as http(s), and loopback/private ranges are refused
 * unless NODE_ENV is test/development (the integration test uses 127.0.0.1) or
 * SECURITY_ALERT_ALLOW_PRIVATE=1 is set explicitly.
 */

import type { PrismaClient } from '@prisma/client';
import { getSetting, setSetting } from './settings.js';
import { dispatchSms, dispatchWhatsApp } from './sms.js';
import { sendAlertEmail } from './mail.js';
import { licenseStatus } from './license.js';

/** Payload posted to the alert webhook (if configured). */
export interface SecurityAlertPayload {
  event: 'lockout' | 'license.activate' | 'license.deactivate' | 'license.expiring' | 'license.expired' | 'digest' | 'test';
  severity?: 'info' | 'warning' | 'critical';
  /** Diagnostic test alerts bypass the email severity gate — they exist to probe the channel. */
  bypassGate?: boolean;
  email?: string;
  attempts?: number;
  threshold?: number;
  lockedUntil?: string;
  edition?: string;
  expiresAt?: string;
  /** Digest event only — the summarised period and counts. */
  periodStart?: string;
  periodEnd?: string;
  lockoutCount?: number;
  auditCount?: number;
  daysLeft?: number | null;
  message: string;
  /** Stamped by the helper at dispatch time (callers may omit it). */
  timestamp?: string;
}

export type AlertSeverity = 'info' | 'warning' | 'critical';

/** Per-channel delivery counts for the developer panel (docs/25). */
export interface DeliveryChannelStats {
  channel: string;
  total: number;
  delivered: number;
  /** Queued and still retryable (below the max attempts). */
  pending: number;
  /** Gave up — at max attempts and never delivered. */
  exhausted: number;
}

const ALERT_TITLES: Record<SecurityAlertPayload['event'], string> = {
  lockout: 'Account locked',
  'license.activate': 'License activated',
  'license.deactivate': 'License deactivated',
  'license.expiring': 'License expiring',
  'license.expired': 'License expired',
  digest: 'Daily security digest',
  test: 'Test alert',
};

/** Default severity per event — callers may override (the digest computes its own). */
const SEVERITY_BY_EVENT: Record<SecurityAlertPayload['event'], AlertSeverity> = {
  lockout: 'critical',
  'license.activate': 'info',
  'license.deactivate': 'warning',
  'license.expiring': 'warning',
  'license.expired': 'critical',
  digest: 'info',
  test: 'info',
};

/** Cap concurrent webhook POSTs so a lockout flood cannot fan out unbounded. */
const MAX_CONCURRENT_WEBHOOKS = 10;
let inFlightWebhooks = 0;

/** Ordering for the email severity gate (alerts.emailMinSeverity). */
const SEVERITY_RANK: Record<AlertSeverity, number> = { info: 0, warning: 1, critical: 2 };

/** Resolve the configured email minimum severity (default info = email everything). */
function emailMinSeverity(): AlertSeverity {
  const v = (getSetting('alerts.emailMinSeverity') ?? 'info').toLowerCase();
  if (v === 'critical') return 'critical';
  if (v === 'warning') return 'warning';
  return 'info';
}

/**
 * Permanent failures are never queued for retry — only transient dispatch
 * errors are (a config change can fix the former; the latter self-heals).
 */
function retryableNote(note: string): boolean {
  return !note.includes('not connected') && !note.includes('Unrecognised');
}

/**
 * Persist a failed outbound alert delivery for the retry sweep (docs/25).
 * First retry is ~30 min out; the sweep backs off exponentially from there.
 * Deduped: one undelivered row per (channel, to, message) — a lockout flood
 * queues a bounded set instead of one row per failed attempt. An exhausted
 * row (at max attempts, never delivered) does NOT block a fresh publish:
 * the alert would otherwise be silently lost, so a new retryable row is
 * created instead.
 */
export async function enqueueAlertDelivery(
  db: PrismaClient,
  channel: 'email' | 'sms' | 'whatsapp' | 'webhook',
  to: string,
  message: string,
  subject?: string,
  event?: string,
  messageId?: string,
): Promise<void> {
  const maxAttempts = Math.max(1, Number(getSetting('alerts.retryMaxAttempts') ?? 4) || 4);
  // Dedup key is (channel, to, message) — NOT event: messages are event-unique,
  // and the event column is only a drawer-lookup hint, so the stored event is
  // whatever enqueued first for that message.
  const existing = await db.alertDelivery.findFirst({ where: { channel, to, message, deliveredAt: null, attempts: { lt: maxAttempts } } });
  if (existing) {
    // A gateway message id is a strict improvement — keep it so the delivery
    // webhook can resolve this row to delivered/failed without re-dispatching.
    if (messageId && !existing.messageId) {
      await db.alertDelivery.update({ where: { id: existing.id }, data: { messageId } }).catch(() => undefined);
    }
    return;
  }
  await db.alertDelivery.create({
    data: { channel, to, message, subject, event, messageId, attempts: 0, nextAttemptAt: new Date(Date.now() + 30 * 60 * 1000) },
  });
}

/** POST JSON to the alert webhook — ok = 2xx response. Shared by the live
 * dispatch and the retry sweep so both behave identically. */
async function postWebhookJson(url: string, body: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'GIHM-HIS-Security/1.0' },
      body,
      signal: AbortSignal.timeout(5_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** http(s) only, and refuse loopback/private targets outside dev/test. */
export function webhookTargetAllowed(rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
  if (process.env.SECURITY_ALERT_ALLOW_PRIVATE === '1') return true;
  const host = parsed.hostname;
  const privateHost =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host === '[::1]' ||
    host.startsWith('10.') ||
    host.startsWith('192.168.') ||
    host.startsWith('169.254.') ||
    (host.startsWith('172.') && /^172\.(1[6-9]|2\d|3[01])\./.test(host));
  if (privateHost) {
    return process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';
  }
  return true;
}

/**
 * Fire-and-forget: always writes an inbox row; sends an SMS (if alertPhone is
 * set AND SMS gateway credentials exist), an email (if security.alertEmail is
 * set AND SMTP credentials exist) and POSTs to the alert webhook (if
 * alertWebhook is set). Failures are silently caught — this is an advisory
 * notification, never a blocking concern. db is optional so tests that only
 * exercise the channels can omit it.
 */
export function dispatchSecurityAlert(payload: SecurityAlertPayload, db?: PrismaClient): void {
  const alertPhone = getSetting('security.alertPhone');
  const alertWhatsApp = getSetting('security.alertWhatsApp');
  const alertEmail = getSetting('security.alertEmail');
  const webhookUrl = getSetting('security.alertWebhook');
  // On-call escalation (docs/25): a second recipient that receives ONLY
  // critical alerts — lockouts, lapsed licenses. Silence during routine noise.
  const escalationEmail = getSetting('security.escalationEmail');

  // Inbox channel — always persisted so the developer has a durable history.
  if (db) {
    void db.securityAlert
      .create({
        data: {
          event: payload.event,
          severity: payload.severity ?? SEVERITY_BY_EVENT[payload.event] ?? 'info',
          title: ALERT_TITLES[payload.event] ?? payload.event,
          message: payload.message,
          payload: JSON.stringify(payload),
        },
      })
      .catch((e: unknown) => console.error('[alert] failed to persist inbox row', e));
  }

  // SMS channel
  if (alertPhone) {
    const to = alertPhone;
    void (async () => {
      const result = await dispatchSms({ to, message: payload.message });
      // Transient failure → queue for the retry sweep so it is never lost. The
      // gateway message id (if any) rides along so the delivery webhook can
      // later resolve this row to delivered/failed.
      if (!result.dispatched && db && retryableNote(result.note ?? '')) {
        await enqueueAlertDelivery(db, 'sms', to, payload.message, undefined, payload.event, result.messageId).catch(() => undefined);
      }
    })().catch(() => undefined);
  }

  // WhatsApp channel — same semantics as SMS: transient failures queue for the
  // retry sweep, permanent ones (unconfigured, unrecognised number) never do.
  if (alertWhatsApp) {
    const to = alertWhatsApp;
    void (async () => {
      const result = await dispatchWhatsApp({ to, message: payload.message });
      if (!result.dispatched && db && retryableNote(result.note ?? '')) {
        await enqueueAlertDelivery(db, 'whatsapp', to, payload.message, undefined, payload.event, result.messageId).catch(() => undefined);
      }
    })().catch(() => undefined);
  }

  // Email channel — subject carries the event title + severity so the recipient
  // can triage without opening the message. Digest events are excluded: the
  // daily digest sends its own structured summary email (see runDailyDigest),
  // so a digest day emails exactly once instead of twice. The severity gate
  // (alerts.emailMinSeverity) silences lower-priority emails entirely.
  if ((alertEmail || escalationEmail) && payload.event !== 'digest') {
    const severity = payload.severity ?? SEVERITY_BY_EVENT[payload.event] ?? 'info';
    // Test alerts bypass the gate — they are an explicit channel probe (a
    // raised gate must not make "Send test alert" silently email nothing).
    const gated = !payload.bypassGate && SEVERITY_RANK[severity] < SEVERITY_RANK[emailMinSeverity()];
    // Deduped — an admin may point alertEmail and escalationEmail at the same
    // address; a critical alert must still go out exactly once per address.
    const recipients = [...new Set([
      ...(alertEmail && !gated ? [alertEmail] : []),
      // Escalation is critical-only and independent of the gate: a raised gate
      // silences info/warning noise but must never silence the on-call path.
      ...(escalationEmail && severity === 'critical' ? [escalationEmail] : []),
    ])];
    if (recipients.length > 0) {
      const tag = severity === 'critical' ? '[CRITICAL]' : severity === 'warning' ? '[WARNING]' : '[INFO]';
      const title = ALERT_TITLES[payload.event] ?? payload.event;
      const subject = `[GIHM-HIS SECURITY] ${tag} ${title}`;
      const text = `${payload.message}\n\nEvent: ${payload.event}\nSeverity: ${severity}\nSent: ${new Date().toISOString()}\n— GIHM-HIS security alerting`;
      for (const to of recipients) {
        void (async () => {
          const result = await sendAlertEmail({ to, subject, text });
          // Transient failure → queue for the retry sweep so it is never lost.
          if (!result.dispatched && db && retryableNote(result.note)) {
            await enqueueAlertDelivery(db, 'email', to, payload.message, subject, payload.event).catch(() => undefined);
          }
        })().catch(() => undefined);
      }
    }
  }

  // Webhook channel — POST JSON with a 5-second timeout. A failure (network
  // error, timeout, or a non-2xx response) is queued for the retry sweep, so a
  // transient receiver outage never silently drops the alert.
  if (webhookUrl && webhookTargetAllowed(webhookUrl) && inFlightWebhooks < MAX_CONCURRENT_WEBHOOKS) {
    inFlightWebhooks += 1;
    void (async () => {
      // timestamp is stamped here (not by the caller) so every delivery has it
      const body = JSON.stringify({ ...payload, timestamp: new Date().toISOString() });
      const ok = await postWebhookJson(webhookUrl, body);
      if (!ok && db) {
        // The queue row stores the payload WITHOUT the per-attempt timestamp so
        // dedup matches identical alerts; the retry sweep re-stamps it.
        await enqueueAlertDelivery(db, 'webhook', webhookUrl, JSON.stringify(payload), undefined, payload.event).catch(() => undefined);
      }
      inFlightWebhooks -= 1;
    })();
  }
}

/**
 * License-expiry sweep (docs/25). Only an ACTIVATED license is watched (a
 * stale expiresAt row left behind by a deactivation must never re-alert).
 *
 * - Within license.alertDaysBefore days of expiring → 'license.expiring' alert
 *   at most once per 24h (deduped via license.expiryAlertedAt — a timestamp).
 * - On the day it lapses (daysLeft <= 0) → one-shot 'license.expired' alert,
 *   keyed to the expiry DATE via license.expiredAlertedAt, so the expiring
 *   alert at D-1 can never swallow the expired alert at D-0, and it never
 *   repeats for the same expiry date.
 *
 * Both markers are reset on activate and deactivate (developer.ts), so a
 * renewed or reactivated license gets a fresh alert schedule.
 *
 * Returns the outcome for tests.
 */
export async function runLicenseExpiryCheck(db: PrismaClient): Promise<{ alerted: boolean; daysLeft: number | null }> {
  // Gate on activation: without a key there is no license to watch. (deactivate
  // clears key/activatedAt but leaves expiresAt — this check prevents spurious
  // alerts about a license that no longer exists.)
  if (!getSetting('license.key')) return { alerted: false, daysLeft: null };

  const expiresRaw = getSetting('license.expiresAt');
  if (!expiresRaw) return { alerted: false, daysLeft: null };
  const expiresAt = new Date(expiresRaw);
  if (Number.isNaN(expiresAt.getTime())) return { alerted: false, daysLeft: null };

  const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (24 * 3600 * 1000));
  const expiryDate = expiresAt.toISOString().slice(0, 10);
  const keySuffix = (getSetting('license.key') ?? '').slice(-4);

  if (daysLeft <= 0) {
    // One-shot per expiry date — a separate marker so the D-1 'expiring' alert
    // (time-deduped) cannot suppress the D-0 'expired' alert.
    if (getSetting('license.expiredAlertedAt') === expiryDate) return { alerted: false, daysLeft };
    dispatchSecurityAlert(
      {
        event: 'license.expired',
        expiresAt: expiresAt.toISOString(),
        message: `[GIHM-HIS SECURITY] License expired on ${expiryDate} (key ••••${keySuffix}) — capacity enforcement is now inactive. Activate a renewed license immediately.`,
      },
      db,
    );
    await setSetting(db, 'license.expiredAlertedAt', expiryDate);
    return { alerted: true, daysLeft };
  }

  // Time-based dedup for the recurring 'expiring' alert (max once per 24h).
  const lastAlertedRaw = getSetting('license.expiryAlertedAt');
  if (lastAlertedRaw) {
    const lastAlerted = new Date(lastAlertedRaw);
    if (!Number.isNaN(lastAlerted.getTime()) && Date.now() - lastAlerted.getTime() < 24 * 3600 * 1000) {
      return { alerted: false, daysLeft };
    }
  }

  const windowDays = Math.max(1, Number(getSetting('license.alertDaysBefore') ?? 14) || 14);
  if (daysLeft > windowDays) return { alerted: false, daysLeft };

  dispatchSecurityAlert(
    {
      event: 'license.expiring',
      expiresAt: expiresAt.toISOString(),
      message: `[GIHM-HIS SECURITY] License expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'} (${expiryDate}, key ••••${keySuffix}). Renew before it lapses to keep enforcement active.`,
    },
    db,
  );
  await setSetting(db, 'license.expiryAlertedAt', new Date().toISOString());
  return { alerted: true, daysLeft };
}

/** Developer "Send test alert" — verifies every configured channel end to end. */
export function sendTestAlert(db: PrismaClient): void {
  dispatchSecurityAlert(
    {
      event: 'test',
      bypassGate: true, // the gate must not silence the diagnostic probe
      message: '[GIHM-HIS SECURITY] Test alert — your inbox, SMS, email and webhook channels are working.',
    },
    db,
  );
}

/**
 * Developer "Test escalation" — verifies the on-call (critical-only) email path
 * end to end. A CRITICAL test alert reaches both the primary recipient and the
 * escalation address (severity critical, gate bypassed so the probe is never
 * muted).
 */
export function sendTestEscalation(db: PrismaClient): void {
  dispatchSecurityAlert(
    {
      event: 'test',
      severity: 'critical',
      bypassGate: true,
      message: '[GIHM-HIS SECURITY] Test escalation alert — verifying the critical-only on-call email path. This alert is CRITICAL by design.',
    },
    db,
  );
}

/**
 * Daily security digest (docs/25) — a single inbox summary of the last 24h:
 * lockout incidents, audit actions, current license posture and unread alerts.
 * Runs at most once per calendar day (deduped via alerts.lastDigestDate). The
 * severity is computed from the content: any lockout or a lapsed license is
 * critical, a license inside the expiry window is warning, otherwise info.
 *
 * Returns the outcome for tests.
 */
export async function runDailyDigest(db: PrismaClient): Promise<{ published: boolean; date: string; lockouts: number; audit: number }> {
  if ((getSetting('alerts.digestEnabled') ?? 'true').toLowerCase() === 'false') {
    return { published: false, date: '', lockouts: 0, audit: 0 };
  }
  const today = new Date().toISOString().slice(0, 10);
  if (getSetting('alerts.lastDigestDate') === today) {
    return { published: false, date: today, lockouts: 0, audit: 0 };
  }

  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const [lockouts, audit, unread, license, deliveries, trend] = await Promise.all([
    db.securityAlert.count({ where: { event: 'lockout', createdAt: { gte: since } } }),
    db.auditLog.count({ where: { createdAt: { gte: since } } }),
    db.securityAlert.count({ where: { readAt: null } }),
    licenseStatus(db),
    deliveryStats(db),
    deliveryTrend(db, 14),
  ]);

  const licenseLine = license.activated
    ? license.expired
      ? `license EXPIRED ${license.daysLeft ?? 0}d ago`
      : `license ${license.edition} active, ${license.daysLeft ?? '?'}d left`
    : 'no active license (trial/unlicensed)';
  const severity: AlertSeverity = lockouts > 0 || (license.activated && license.expired)
    ? 'critical'
    : license.activated && (license.daysLeft ?? 999) <= Math.max(1, Number(getSetting('license.alertDaysBefore') ?? 14) || 14)
      ? 'warning'
      : 'info';

  dispatchSecurityAlert(
    {
      event: 'digest',
      severity,
      periodStart: since.toISOString(),
      periodEnd: new Date().toISOString(),
      lockoutCount: lockouts,
      auditCount: audit,
      daysLeft: license.daysLeft,
      message: `[GIHM-HIS DIGEST] Last 24h: ${lockouts} lockout incident${lockouts === 1 ? '' : 's'}, ${audit} audit action${audit === 1 ? '' : 's'}, ${unread} unread alert${unread === 1 ? '' : 's'} — ${licenseLine}.`,
    },
    db,
  );

  // Dedicated digest email — separate from per-event alert emails (which skip
  // digest events above). Fire-and-forget: a failure never fails the sweep, and
  // a transient failure is queued for the retry sweep so the digest is never
  // silently lost. The severity gate (alerts.emailMinSeverity) applies too, and
  // a CRITICAL digest (lockouts / lapsed license) also goes to the on-call
  // escalation recipient (critical-only, gate-independent).
  const alertEmail = getSetting('security.alertEmail');
  const escalationEmail = getSetting('security.escalationEmail');
  // Deduped — alertEmail and escalationEmail may point at the same address.
  const digestRecipients = [...new Set([
    ...(alertEmail && SEVERITY_RANK[severity] >= SEVERITY_RANK[emailMinSeverity()] ? [alertEmail] : []),
    ...(escalationEmail && severity === 'critical' ? [escalationEmail] : []),
  ])];
  if (digestRecipients.length > 0) {
    const subject = `[GIHM-HIS SECURITY] [${severity.toUpperCase()}] Daily security digest — ${lockouts} lockout${lockouts === 1 ? '' : 's'}, ${audit} audit action${audit === 1 ? '' : 's'}`;
    // Per-channel delivery health (delivered / retrying / exhausted) so the
    // recipient can spot a channel silently degrading before alerts pile up.
    const deliveryLine = deliveries.map((c) => `${c.channel}: ${c.delivered} delivered, ${c.pending} retrying, ${c.exhausted} exhausted`).join(' · ');
    // 14-day channel-health trend (last-14-days delivered sparkline) — a
    // silently dying gateway shows up as a flat line before it exhausts.
    const trendLines = trend.map((s) => `${s.channel}: ${sparkline(s.points.map((p) => p.delivered))} (${s.points.map((p) => p.delivered).reduce((a, b) => a + b, 0)} delivered)`).join('\n');
    const text = [
      `[GIHM-HIS DIGEST] ${today} — last 24 hours:`,
      '',
      `Lockout incidents: ${lockouts}`,
      `Audit actions: ${audit}`,
      `Unread alerts: ${unread}`,
      `License: ${licenseLine}`,
      `Delivery: ${deliveryLine}`,
      '',
      'Channel health (14-day delivered trend):',
      trendLines,
      '',
      `Period: ${since.toISOString()} \u2192 ${new Date().toISOString()}`,
      '\u2014 GIHM-HIS security digest',
    ].join('\n');
    // Rich HTML twin — renders the same summary as a readable table. Values are
    // HTML-escaped (license.edition is a free-text, developer-editable setting).
    const esc = (s: unknown): string => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
    const row = (label: string, value: string | number) =>
      `<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#475569">${esc(label)}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:bold;color:#0f172a;text-align:right">${esc(value)}</td></tr>`;
    const html = [
      '<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto">',
      `<h2 style="color:#0f172a;margin-bottom:4px">GIHM-HIS daily security digest</h2>`,
      `<p style="color:#64748b;margin-top:0">${today} — last 24 hours</p>`,
      '<table style="border-collapse:collapse;width:100%;border:1px solid #e2e8f0;border-radius:8px">',
      row('Lockout incidents', lockouts),
      row('Audit actions', audit),
      row('Unread alerts', unread),
      row('License', licenseLine),
      row('Delivery', deliveryLine),
      '</table>',
      `<h3 style="color:#0f172a;margin:18px 0 6px;font-size:13px">Channel health — 14-day delivered trend</h3>`,
      '<table style="border-collapse:collapse;width:100%;border:1px solid #e2e8f0;border-radius:8px">',
      ...trend.map((s) => {
        const counts = s.points.map((p) => p.delivered);
        const total = counts.reduce((a, b) => a + b, 0);
        return `<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#475569;text-transform:capitalize">${esc(s.channel)}</td>`
          + `<td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-family:monospace;color:#0f172a;letter-spacing:1px">${sparkline(counts)}</td>`
          + `<td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:bold;color:#0f172a;text-align:right">${total}</td></tr>`;
      }),
      '</table>',
      `<p style="color:#94a3b8;font-size:12px">Period: ${since.toISOString()} \u2192 ${new Date().toISOString()}</p>`,
      '<p style="color:#94a3b8;font-size:12px">\u2014 GIHM-HIS security digest</p>',
      '</div>',
    ].join('');
    for (const to of digestRecipients) {
      void (async () => {
        const result = await sendAlertEmail({ to, subject, text, html });
        if (!result.dispatched && retryableNote(result.note)) {
          await enqueueAlertDelivery(db, 'email', to, text, subject, 'digest').catch(() => undefined);
        }
      })().catch(() => undefined);
    }
  }

  await setSetting(db, 'alerts.lastDigestDate', today);
  return { published: true, date: today, lockouts, audit };
}

/**
 * Age out alertDelivery retry rows past a cutoff — delivered rows by their
 * delivery time, exhausted rows (at max attempts, never delivered) by their
 * creation time — so the queue table stays bounded, not a permanent tombstone
 * pile. Shared by runAlertRetentionSweep (alerts.retentionDays) and the audit
 * prune route (audit.retentionDays).
 */
export async function pruneAlertDeliveries(db: PrismaClient, cutoff: Date): Promise<number> {
  const maxAttempts = Math.max(1, Number(getSetting('alerts.retryMaxAttempts') ?? 4) || 4);
  const result = await db.alertDelivery.deleteMany({
    where: {
      OR: [{ deliveredAt: { lt: cutoff } }, { attempts: { gte: maxAttempts }, createdAt: { lt: cutoff } }],
    },
  });
  return result.count;
}

/**
 * Alert retention sweep — deletes inbox rows older than alerts.retentionDays
 * (default 365, minimum 1). Runs with the daily security sweep and is also
 * callable manually via POST /admin/developer/alerts/prune. Digest rows and
 * lockout rows age out exactly like everything else; the read / unread counts
 * self-correct because unread is computed from the surviving rows.
 */
export async function runAlertRetentionSweep(db: PrismaClient): Promise<{ deleted: number; deliveries: number; cutoff: string }> {
  // Floor 1 (deliberately more aggressive than the audit prune's 7): alert rows
  // are advisory and cheap to lose, so a tiny retention window is never unsafe.
  const days = Math.max(1, Number(getSetting('alerts.retentionDays') ?? 365) || 365);
  const cutoff = new Date(Date.now() - days * 24 * 3600 * 1000);
  const result = await db.securityAlert.deleteMany({ where: { createdAt: { lt: cutoff } } });
  const deliveries = await pruneAlertDeliveries(db, cutoff);
  return { deleted: result.count, deliveries, cutoff: cutoff.toISOString() };
}

/**
 * Alert delivery retry sweep (docs/25) — retries queued email/SMS dispatches
 * with exponential backoff (30 min, 1h, 2h, 4h, … capped at 24h) until success
 * or alerts.retryMaxAttempts (default 4). Runs at boot and every 30 minutes so
 * a transient gateway outage never silently loses an alert. Returns the outcome
 * for tests.
 */
export async function runAlertRetrySweep(db: PrismaClient): Promise<{ retried: number; delivered: number; failed: number }> {
  const maxAttempts = Math.max(1, Number(getSetting('alerts.retryMaxAttempts') ?? 4) || 4);
  const due = await db.alertDelivery.findMany({
    where: { deliveredAt: null, attempts: { lt: maxAttempts }, nextAttemptAt: { lte: new Date() } },
    orderBy: { nextAttemptAt: 'asc' },
    take: 100,
  });
  let delivered = 0;
  let failed = 0;
  for (const row of due) {
    const dispatch =
      row.channel === 'email'
        ? await sendAlertEmail({ to: row.to, subject: row.subject ?? '', text: row.message }).then((r) => ({ dispatched: r.dispatched, messageId: undefined as string | undefined, note: r.note }))
        : row.channel === 'webhook'
          ? { dispatched: await retryWebhookDelivery(row.to, row.message), messageId: undefined as string | undefined, note: '' }
          : row.channel === 'whatsapp'
            ? await dispatchWhatsApp({ to: row.to, message: row.message })
            : await dispatchSms({ to: row.to, message: row.message });
    if (dispatch.dispatched) {
      await db.alertDelivery.update({ where: { id: row.id }, data: { deliveredAt: new Date(), lastError: null, messageId: dispatch.messageId ?? row.messageId } });
      delivered += 1;
      continue;
    }
    const attempts = row.attempts + 1;
    // Exponential backoff from the row's next due time (30 min base, 24h cap).
    const backoffMin = Math.min(24 * 60, 30 * 2 ** attempts);
    await db.alertDelivery.update({
      where: { id: row.id },
      data: { attempts, nextAttemptAt: new Date(Date.now() + backoffMin * 60 * 1000), lastError: dispatch.note || row.lastError, messageId: dispatch.messageId ?? row.messageId },
    });
    if (attempts >= maxAttempts) failed += 1;
  }
  return { retried: due.length, delivered, failed };
}

/** Re-POST a queued webhook payload (stored without the per-attempt timestamp).
 * The SSRF guard re-applies at retry time, so a webhook URL edited to a private
 * target after enqueueing is refused here too. */
async function retryWebhookDelivery(url: string, message: string): Promise<boolean> {
  if (!webhookTargetAllowed(url)) return false;
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(message) as Record<string, unknown>;
  } catch {
    // Corrupt row (near-impossible — written by this module): treat as a
    // permanent failure so the sweep stops retrying it immediately.
    return true;
  }
  return postWebhookJson(url, JSON.stringify({ ...payload, timestamp: new Date().toISOString() }));
}

/**
 * Per-channel delivery counts for the developer panel (docs/25): every
 * AlertDelivery row bucketed by channel into delivered / pending (still
 * retryable) / exhausted (gave up at max attempts).
 */
export async function deliveryStats(db: PrismaClient): Promise<DeliveryChannelStats[]> {
  const maxAttempts = Math.max(1, Number(getSetting('alerts.retryMaxAttempts') ?? 4) || 4);
  const rows = await db.alertDelivery.findMany({ select: { channel: true, deliveredAt: true, attempts: true } });
  const byChannel = new Map<string, DeliveryChannelStats>();
  for (const r of rows) {
    const s = byChannel.get(r.channel) ?? { channel: r.channel, total: 0, delivered: 0, pending: 0, exhausted: 0 };
    s.total += 1;
    if (r.deliveredAt) s.delivered += 1;
    else if (r.attempts >= maxAttempts) s.exhausted += 1;
    else s.pending += 1;
    byChannel.set(r.channel, s);
  }
  // Stable ordering for the panel — zero rows still render each channel.
  return ['email', 'sms', 'whatsapp', 'webhook'].map((channel) => byChannel.get(channel) ?? { channel, total: 0, delivered: 0, pending: 0, exhausted: 0 });
}

/** One day of delivery-health counts for the Overview trend chart. */
export interface DeliveryTrendPoint {
  date: string; // YYYY-MM-DD (the day the dispatch was attempted)
  delivered: number;
  pending: number;
  exhausted: number;
}

/** One channel's 14-day series — the Overview chart filter picks one (or All). */
export interface DeliveryChannelTrend {
  channel: string;
  points: DeliveryTrendPoint[];
}

/**
 * Per-channel delivery health for the last `days` days (default 14) — the
 * Overview trend chart. Rows are bucketed by channel AND by the day they were
 * CREATED (the day the dispatch was attempted — a row is one attempted
 * dispatch, so this never double counts). Zero days are filled so each
 * channel's series is continuous.
 */
export async function deliveryTrend(db: PrismaClient, days = 14): Promise<DeliveryChannelTrend[]> {
  const maxAttempts = Math.max(1, Number(getSetting('alerts.retryMaxAttempts') ?? 4) || 4);
  const cutoff = new Date(Date.now() - days * 24 * 3600 * 1000);
  const rows = await db.alertDelivery.findMany({
    where: { createdAt: { gte: cutoff } },
    select: { channel: true, createdAt: true, deliveredAt: true, attempts: true },
    // Bounded: the retention sweep prunes these, and 20k covers a busy month.
    take: 20_000,
  });
  // Zero-filled window first so every series has the same 14 points.
  const windowDates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    windowDates.push(new Date(Date.now() - i * 24 * 3600 * 1000).toISOString().slice(0, 10));
  }
  const empty = (): DeliveryTrendPoint[] => windowDates.map((date) => ({ date, delivered: 0, pending: 0, exhausted: 0 }));
  const byChannel = new Map<string, DeliveryTrendPoint[]>();
  for (const r of rows) {
    const series = byChannel.get(r.channel) ?? empty();
    const idx = windowDates.indexOf(r.createdAt.toISOString().slice(0, 10));
    if (idx >= 0) {
      const p = series[idx]!;
      if (r.deliveredAt) p.delivered += 1;
      else if (r.attempts >= maxAttempts) p.exhausted += 1;
      else p.pending += 1;
    }
    byChannel.set(r.channel, series);
  }
  // Stable ordering — zero rows still render each channel.
  return ['email', 'sms', 'whatsapp', 'webhook'].map((channel) => ({ channel, points: byChannel.get(channel) ?? empty() }));
}

/**
 * Resolve a pending AlertDelivery retry-queue row from a gateway delivery
 * callback (SMSOnlineGH pushes { messageId, status } for both SMS and WhatsApp
 * sends; Hubtel reports { MessageId, Status }). Matching is by messageId, with
 * a (channel, to) fallback for providers that only echo the destination.
 *
 * - Delivered-looking status → row marked delivered, retries stop.
 * - Permanent rejection/expiry → row recorded as exhausted (lastError set,
 *   attempts raised to max) so the sweep never re-dispatches a lost message.
 * - Anything else (transient/unknown) → lastError recorded, row stays pending
 *   for the retry sweep.
 *
 * Returns the outcome for tests.
 */
export async function resolveAlertDeliveryCallback(
  db: PrismaClient,
  opts: { messageId?: string | null; to?: string | null; channel?: string | null; statusLabel?: string | null },
): Promise<{ resolved: boolean; channel?: string; state: 'delivered' | 'exhausted' | 'pending' | 'none' }> {
  const label = (opts.statusLabel ?? '').toUpperCase();
  if (!opts.messageId && !opts.to) return { resolved: false, state: 'none' };
  const row = opts.messageId
    ? await db.alertDelivery.findFirst({
        where: { messageId: opts.messageId, deliveredAt: null },
        orderBy: { createdAt: 'desc' },
      })
    : opts.to
      ? await db.alertDelivery.findFirst({
          // The `to` fallback only ever targets SMS/WhatsApp rows (never email or
          // webhook rows — their `to` values are addresses/URLs, not phones).
          where: { channel: opts.channel && ['sms', 'whatsapp'].includes(opts.channel) ? opts.channel : { in: ['sms', 'whatsapp'] }, to: opts.to, deliveredAt: null, messageId: null },
          orderBy: { createdAt: 'desc' },
        })
      : null;
  if (!row) return { resolved: false, state: 'none' };

  // Delivered: explicit DELIVERED, or SUCCESS (Hubtel echoes 'Success').
  const delivered = /DELIVERED|SUCCESS/.test(label);
  if (delivered) {
    await db.alertDelivery.update({ where: { id: row.id }, data: { deliveredAt: new Date(), lastError: null } });
    return { resolved: true, channel: row.channel, state: 'delivered' };
  }
  // Permanent: rejected / expired / undelivered — the message is lost, so stop
  // retrying it (exhaust it) instead of re-dispatching a dead message.
  const permanent = /REJECT|EXPIRED|UNDELIVER|FAILED|FAILURE|INVALID/.test(label);
  const maxAttempts = Math.max(1, Number(getSetting('alerts.retryMaxAttempts') ?? 4) || 4);
  if (permanent) {
    await db.alertDelivery.update({ where: { id: row.id }, data: { lastError: opts.statusLabel ?? 'Gateway reported delivery failure', attempts: maxAttempts } });
    return { resolved: true, channel: row.channel, state: 'exhausted' };
  }
  // Transient/unknown — note it, stay pending for the retry sweep.
  await db.alertDelivery.update({ where: { id: row.id }, data: { lastError: opts.statusLabel ?? null } }).catch(() => undefined);
  return { resolved: true, channel: row.channel, state: 'pending' };
}

/**
 * ASCII sparkline of a channel's delivered counts over the trend window
 * (▁▂▃▄▅▆▇█ — 8 levels, flat line for zero activity).
 */
function sparkline(counts: number[]): string {
  const max = Math.max(1, ...counts);
  const bars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
  return counts.map((c) => (c === 0 ? '·' : bars[Math.min(bars.length - 1, Math.floor((c / max) * (bars.length - 1)))])).join('');
}

/**
 * Developer "Test WhatsApp alert" — probes the WhatsApp alert channel end to
 * end (single-channel, unlike sendTestAlert which fans out everywhere).
 * Graceful when no alert number is configured. Returns the outcome for the
 * route's response.
 */
export async function sendTestWhatsApp(db: PrismaClient): Promise<{ ok: boolean; sent: boolean; message: string; note?: string }> {
  const phone = getSetting('security.alertWhatsApp');
  if (!phone) {
    return { ok: true, sent: false, message: 'No WhatsApp alert number configured — set it on the Security tab first.' };
  }
  const result = await dispatchWhatsApp({
    to: phone,
    message: '[GIHM-HIS SECURITY] Test WhatsApp alert — your WhatsApp alert channel is working.',
  });
  if (result.dispatched) {
    return {
      ok: true,
      sent: true,
      message: `WhatsApp test alert sent to ${phone} (${result.provider}${result.messageId ? `, id ${result.messageId}` : ''}).`,
    };
  }
  return { ok: true, sent: false, message: `WhatsApp test alert could not be sent: ${result.note ?? 'unknown error'}` };
}