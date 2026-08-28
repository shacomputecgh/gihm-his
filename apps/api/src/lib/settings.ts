import type { PrismaClient } from '@prisma/client';

/**
 * Runtime system configuration (docs/24-system-settings-administration.md).
 *
 * Environment variables are the boot defaults; once a `SystemSetting` row
 * exists for a key, its value wins — so API keys and gateway settings can be
 * changed from the admin UI without touching .env or restarting. A row with an
 * empty value counts as unset (falls back to env) when reading, and the admin
 * API deletes rows on clear so the env default resumes.
 *
 * Resolution: DB row with a non-empty value → that value. A row with an empty
 * value → explicitly unset (no env fallback) — used to force-disable a setting
 * that exists in env. No row → the mapped env var (boot default). Tests stay
 * hermetic: a fresh test DB has no rows, so env-var mutation at test time keeps
 * working exactly as before.
 */

export interface SettingDef {
  key: string;
  env: string; // fallback env var (boot default)
  secret: boolean;
  group: 'sms' | 'whatsapp' | 'reminder' | 'app' | 'security' | 'license' | 'mail';
  label: string;
  description: string;
  /** Applies only after a restart (port, jwt secret, ...). */
  restart?: boolean;
  /** Render as a textarea in the admin UI. */
  multiline?: boolean;
}

export const SETTING_DEFS: SettingDef[] = [
  // ---------------------------------------------------------------- SMS
  { key: 'sms.provider', env: 'SMS_PROVIDER', secret: false, group: 'sms', label: 'SMS provider', description: 'smsonlinegh | hubtel | twilio. Empty = inferred from credentials, or off.' },
  { key: 'sms.smsonlinegh.url', env: 'SMSONLINEGH_URL', secret: false, group: 'sms', label: 'SMSOnlineGH endpoint', description: 'Override for the v5 send endpoint (default https://api.smsonlinegh.com/v5/message/sms/send).' },
  { key: 'sms.smsonlinegh.apiKey', env: 'SMSONLINEGH_API_KEY', secret: true, group: 'sms', label: 'SMSOnlineGH API key', description: 'Used with "key <token>" authorization.' },
  { key: 'sms.smsonlinegh.senderId', env: 'SMSONLINEGH_SENDER_ID', secret: false, group: 'sms', label: 'SMSOnlineGH sender ID', description: 'Required for live sends — must be registered to your SMSOnlineGH account.' },
  { key: 'sms.smsonlinegh.callbackUrl', env: 'SMSONLINEGH_CALLBACK_URL', secret: false, group: 'sms', label: 'Delivery callback URL', description: 'Webhook that receives delivery notifications (POST /api/v1/immunizations/reminders/delivery-callback).' },
  { key: 'sms.smsonlinegh.callbackToken', env: 'SMSONLINEGH_CALLBACK_TOKEN', secret: true, group: 'sms', label: 'Delivery callback token', description: 'Shared secret the webhook requires (x-callback-token / ?token=) — mandatory when a callback URL is set.' },
  { key: 'sms.hubtel.clientId', env: 'HUBTEL_CLIENT_ID', secret: true, group: 'sms', label: 'Hubtel client ID', description: 'Hubtel API client id (smsc.hubtel.com).' },
  { key: 'sms.hubtel.clientSecret', env: 'HUBTEL_CLIENT_SECRET', secret: true, group: 'sms', label: 'Hubtel client secret', description: 'Hubtel API client secret.' },
  { key: 'sms.hubtel.senderId', env: 'HUBTEL_SENDER_ID', secret: false, group: 'sms', label: 'Hubtel sender ID', description: 'Registered sender name (HM = Hubtel test mode).' },
  { key: 'sms.twilio.accountSid', env: 'TWILIO_ACCOUNT_SID', secret: true, group: 'sms', label: 'Twilio account SID', description: 'Twilio Account SID.' },
  { key: 'sms.twilio.authToken', env: 'TWILIO_AUTH_TOKEN', secret: true, group: 'sms', label: 'Twilio auth token', description: 'Twilio Auth Token.' },
  { key: 'sms.twilio.phoneNumber', env: 'TWILIO_PHONE_NUMBER', secret: true, group: 'sms', label: 'Twilio phone number', description: 'Twilio sending number (E.164).' },

  // ------------------------------------------------------------ WhatsApp
  { key: 'wa.provider', env: 'WHATSAPP_PROVIDER', secret: false, group: 'whatsapp', label: 'WhatsApp provider', description: 'hubtel | smsonlinegh. Empty = WhatsApp channel disabled.' },
  { key: 'wa.hubtel.url', env: 'HUBTEL_WHATSAPP_URL', secret: false, group: 'whatsapp', label: 'Hubtel WhatsApp endpoint', description: 'Verify with Hubtel for your account (default https://api.wa.hubtel.com/v1/messages/send).' },
  { key: 'wa.hubtel.clientId', env: 'HUBTEL_WHATSAPP_CLIENT_ID', secret: true, group: 'whatsapp', label: 'Hubtel WhatsApp client ID', description: 'Falls back to the SMS client id when empty.' },
  { key: 'wa.hubtel.clientSecret', env: 'HUBTEL_WHATSAPP_CLIENT_SECRET', secret: true, group: 'whatsapp', label: 'Hubtel WhatsApp client secret', description: 'Falls back to the SMS client secret when empty.' },
  { key: 'wa.hubtel.senderId', env: 'HUBTEL_WHATSAPP_SENDER_ID', secret: false, group: 'whatsapp', label: 'Hubtel WhatsApp sender', description: 'WhatsApp sender number/ID (default HM).' },
  { key: 'wa.smsonlinegh.url', env: 'SMSONLINEGH_WHATSAPP_URL', secret: false, group: 'whatsapp', label: 'SMSOnlineGH WhatsApp endpoint', description: 'Unverified against vendor docs — confirm your account supports WhatsApp.' },

  // ------------------------------------------------------------ Reminders
  { key: 'reminder.enabled', env: 'REMINDER_JOB_ENABLED', secret: false, group: 'reminder', label: 'Auto-reminder sweep enabled', description: 'Run scheduled recall dispatches (true/false).' },
  { key: 'reminder.autoChannel', env: 'REMINDER_AUTO_CHANNEL', secret: false, group: 'reminder', label: 'Auto-sweep channel', description: 'SMS | WHATSAPP | BOTH — which channels the scheduled recall sweep dispatches over (default SMS).' },
  { key: 'reminder.intervalMinutes', env: 'REMINDER_JOB_INTERVAL_MINUTES', secret: false, group: 'reminder', label: 'Sweep interval (minutes)', description: 'How often the scheduled sweep runs (default 1440 = daily).' },
  { key: 'reminder.windowDays', env: 'REMINDER_JOB_WINDOW_DAYS', secret: false, group: 'reminder', label: 'Recall window (days)', description: 'Recall children due/overdue within this window (default 7).' },
  { key: 'reminder.lookbackDays', env: 'REMINDER_JOB_LOOKBACK_DAYS', secret: false, group: 'reminder', label: 'Re-remind look-back (days)', description: 'Never re-remind a dose within this window (default 7).' },
  { key: 'reminder.msgDue', env: 'REMINDER_MSG_DUE', secret: false, multiline: true, group: 'reminder', label: 'Due reminder template', description: 'Placeholders: {patientName} {description} {dose} {dueDate}' },
  { key: 'reminder.msgOverdue', env: 'REMINDER_MSG_OVERDUE', secret: false, multiline: true, group: 'reminder', label: 'Overdue reminder template', description: 'Placeholders: {patientName} {description} {dose}' },

  // ----------------------------------------------------------- Application
  { key: 'app.webOrigin', env: 'WEB_ORIGIN', secret: false, group: 'app', label: 'Web origin (CORS)', description: 'Comma-separated origins allowed by the API — applied live.' },
  { key: 'app.timezone', env: 'TIMEZONE', secret: false, group: 'app', label: 'Timezone', description: 'Display timezone (default Africa/Accra) — applied live.' },
  { key: 'app.port', env: 'PORT', secret: false, restart: true, group: 'app', label: 'API port', description: 'HTTP port the API listens on — applies on the next restart.' },
  { key: 'app.jwtSecret', env: 'JWT_SECRET', secret: true, restart: true, group: 'app', label: 'JWT signing secret', description: 'Rotating it signs everyone out — applies on the next restart.' },

  // ------------------------------------------- Security (developer, docs/25)
  { key: 'security.passwordMinLength', env: 'PASSWORD_MIN_LENGTH', secret: false, group: 'security', label: 'Minimum password length', description: 'Enforced on password set/reset (developer + admin user management).' },
  { key: 'security.lockoutThreshold', env: 'LOGIN_LOCKOUT_THRESHOLD', secret: false, group: 'security', label: 'Login lockout threshold', description: 'Failed logins before an account is locked for 15 minutes — enforced at login.' },
  { key: 'security.sessionTtlHours', env: 'SESSION_TTL_HOURS', secret: false, group: 'security', label: 'Session TTL (hours)', description: 'How long issued tokens remain valid — enforced at login (new tokens).' },
  { key: 'security.alertPhone', env: 'SECURITY_ALERT_PHONE', secret: false, group: 'security', label: 'Security alert phone', description: 'Ghana mobile number for SMS alerts on lockouts / license events — no gateway credentials = no alert.' },
  { key: 'security.alertWhatsApp', env: 'SECURITY_ALERT_WHATSAPP', secret: false, group: 'security', label: 'Security alert WhatsApp', description: 'Ghana mobile number for WhatsApp alerts on lockouts / license events — requires the WhatsApp provider configured under Settings → SMS.' },
  { key: 'security.alertEmail', env: 'SECURITY_ALERT_EMAIL', secret: false, group: 'security', label: 'Security alert email', description: 'Recipient address for email alerts on lockouts / license events / the daily digest — no SMTP credentials = no email.' },
  { key: 'security.escalationEmail', env: 'SECURITY_ESCALATION_EMAIL', secret: false, group: 'security', label: 'Escalation (on-call) email', description: 'Second recipient emailed ONLY on critical alerts (lockouts, lapsed license) and critical digests — for on-call coverage. Empty = disabled.' },

  // --------------------------------------------- License (developer, docs/25)
  { key: 'license.edition', env: 'LICENSE_EDITION', secret: false, group: 'license', label: 'License edition', description: 'ENTERPRISE | PRO | COMMUNITY.' },
  { key: 'license.key', env: 'LICENSE_KEY', secret: true, group: 'license', label: 'License key', description: 'Activates the installation — masked in API responses.' },
  { key: 'license.expiresAt', env: 'LICENSE_EXPIRY', secret: false, group: 'license', label: 'License expiry', description: 'ISO date the license expires.' },
  { key: 'license.maxFacilities', env: 'LICENSE_MAX_FACILITIES', secret: false, group: 'license', label: 'Max facilities', description: 'Capacity limit enforced on facility creation.' },
  { key: 'license.maxUsers', env: 'LICENSE_MAX_USERS', secret: false, group: 'license', label: 'Max users', description: 'Capacity limit enforced on account creation.' },
  { key: 'license.activatedAt', env: 'LICENSE_ACTIVATED_AT', secret: false, group: 'license', label: 'Activated at', description: 'ISO timestamp of activation (set automatically).' },
  { key: 'license.alertDaysBefore', env: 'LICENSE_ALERT_DAYS_BEFORE', secret: false, group: 'license', label: 'Expiry alert window (days)', description: 'Alert the developer when the license is within this many days of expiring (default 14).' },
  { key: 'license.expiryAlertedAt', env: 'LICENSE_EXPIRY_ALERTED_AT', secret: false, group: 'license', label: 'Expiry alert last sent', description: 'Internal dedup marker (time) — set automatically when the recurring expiry sweep alerts (resets on activate/deactivate).' },
  { key: 'license.expiredAlertedAt', env: 'LICENSE_EXPIRED_ALERTED_AT', secret: false, group: 'license', label: 'Expired alert last sent', description: 'Internal dedup marker (expiry date) — one-shot per expiry; set when the license lapses (resets on activate/deactivate).' },

  // --------------------------------------------- Audit
  { key: 'audit.retentionDays', env: 'AUDIT_RETENTION_DAYS', secret: false, group: 'app', label: 'Audit retention (days)', description: 'Entries older than this are pruned via /admin/developer/audit/prune (default 365).' },
  // --------------------------------------------- Security alerts
  { key: 'security.alertWebhook', env: 'SECURITY_ALERT_WEBHOOK', secret: false, group: 'security', label: 'Security alert webhook URL', description: 'POST URL for lockout / license alerts — receives JSON { event, email, attempts, timestamp }. Empty = webhook disabled.' },
  { key: 'alerts.digestEnabled', env: 'ALERTS_DIGEST_ENABLED', secret: false, group: 'security', label: 'Daily digest enabled', description: 'Publish a daily security summary into the alert inbox (true/false, default true).' },
  { key: 'alerts.lastDigestDate', env: 'ALERTS_LAST_DIGEST_DATE', secret: false, group: 'security', label: 'Daily digest last sent', description: 'Internal dedup marker (YYYY-MM-DD) — the daily digest runs at most once per calendar day.' },
  { key: 'alerts.retentionDays', env: 'ALERTS_RETENTION_DAYS', secret: false, group: 'security', label: 'Alert retention (days)', description: 'Inbox rows older than this are pruned by the daily sweep / manual prune (default 365).' },
  { key: 'alerts.emailMinSeverity', env: 'ALERTS_EMAIL_MIN_SEVERITY', secret: false, group: 'security', label: 'Email minimum severity', description: 'Only alerts at or above this severity are emailed (info | warning | critical, default info = all).' },
  { key: 'alerts.retryMaxAttempts', env: 'ALERTS_RETRY_MAX_ATTEMPTS', secret: false, group: 'security', label: 'Delivery retry attempts', description: 'Failed email/SMS alert dispatches are queued and retried with backoff up to this many attempts (default 4).' },

  // ---------------------------------------------------------------- Email
  { key: 'mail.host', env: 'MAIL_HOST', secret: false, group: 'mail', label: 'SMTP host', description: 'e.g. smtp.gmail.com, smtp.mailgun.org — required for email alerts.' },
  { key: 'mail.port', env: 'MAIL_PORT', secret: false, group: 'mail', label: 'SMTP port', description: '587 (STARTTLS) or 465 (implicit TLS) — default 587.' },
  { key: 'mail.secure', env: 'MAIL_SECURE', secret: false, group: 'mail', label: 'Use TLS (port 465)', description: 'true when the port expects an implicit TLS connection (true/false, default false).' },
  { key: 'mail.user', env: 'MAIL_USER', secret: false, group: 'mail', label: 'SMTP username', description: 'Account used to authenticate (may be empty on internal relays).' },
  { key: 'mail.pass', env: 'MAIL_PASS', secret: true, group: 'mail', label: 'SMTP password', description: 'Account password / app password.' },
  { key: 'mail.from', env: 'MAIL_FROM', secret: false, group: 'mail', label: 'From address', description: 'Sender shown on alert emails (default security@gihm.local).' },
];

const defByKey = new Map(SETTING_DEFS.map((d) => [d.key, d]));

export function settingDef(key: string): SettingDef | undefined {
  return defByKey.get(key);
}

/** DB value per key (undefined = no row → env fallback). */
let cache = new Map<string, string>();
let loaded = false;

/** Load (or reload) the DB-backed values into the cache. Called at app boot. */
export async function initSettings(db: PrismaClient): Promise<void> {
  const rows = await db.systemSetting.findMany();
  cache = new Map(rows.map((r) => [r.key, r.value]));
  loaded = true;
}

/**
 * Resolve a setting: DB value (row exists, non-empty) wins; otherwise the
 * mapped env var (boot default). '' from either source means unset.
 */
export function getSetting(key: string): string | undefined {
  const def = defByKey.get(key);
  if (!def) return undefined;
  if (loaded && cache.has(key)) {
    // A present row is authoritative: its value wins, and an empty value
    // explicitly disables the setting (no env fallback). To revert to the env
    // default, the row must be deleted (clearSetting / admin clear).
    return cache.get(key)!; // '' = explicitly unset
  }
  const env = process.env[def.env];
  return env === undefined || env === '' ? undefined : env;
}

/** Persist an edited value (upsert) and refresh the cache. '' = explicitly unset. */
export async function setSetting(db: PrismaClient, key: string, value: string, actorId?: string): Promise<void> {
  const def = defByKey.get(key);
  if (!def) throw new Error(`Unknown setting key: ${key}`);
  await db.systemSetting.upsert({
    where: { key },
    create: { key, value, secret: def.secret, updatedById: actorId },
    update: { value, updatedById: actorId },
  });
  cache.set(key, value);
  loaded = true;
}

/** Delete a row so the env default resumes (clear in the admin API maps here). */
export async function clearSetting(db: PrismaClient, key: string): Promise<void> {
  await db.systemSetting.deleteMany({ where: { key } }).catch(() => undefined);
  cache.delete(key);
}

/** Mask a secret for API responses: never leak the full value. */
export function maskSecret(v: string): string {
  if (!v) return '';
  return v.length <= 8 ? '••••••••' : `••••••••${v.slice(-4)}`;
}

/** Current value for a key ('' when unset) — for admin display. */
export function effectiveSetting(key: string): string {
  return getSetting(key) ?? '';
}

/** Where the effective value comes from — 'custom' (DB row) or 'env' default. */
export function settingSource(key: string): 'custom' | 'env' {
  if (loaded && cache.has(key)) {
    const v = cache.get(key)!;
    if (v !== '') return 'custom';
  }
  return 'env';
}

/** Reminder-job config resolved at call time so admin edits apply live. */
export function getReminderJobConfig() {
  const num = (key: string, dflt: number): number => {
    const v = Number(getSetting(key) ?? dflt);
    return Number.isFinite(v) ? Math.max(1, v) : dflt;
  };
  return {
    enabled: (getSetting('reminder.enabled') ?? 'true').toLowerCase() !== 'false',
    intervalMs: num('reminder.intervalMinutes', 24 * 60) * 60 * 1000,
    windowDays: num('reminder.windowDays', 7),
    lookbackDays: num('reminder.lookbackDays', 7),
  };
}
