/**
 * Email dispatch for security alerts (docs/25) — a settings-driven SMTP channel
 * using nodemailer, mirroring the sms.ts pattern.
 *
 * Configuration lives in SystemSetting rows (group 'mail'), editable from the
 * admin Settings UI at runtime:
 *   mail.host   — SMTP server (required; without it dispatch degrades to a
 *                 logged, non-dispatched result, never a crash)
 *   mail.port   — 587 (STARTTLS, default) or 465 (implicit TLS)
 *   mail.secure — true when the port expects an implicit TLS connection
 *   mail.user   — auth username (may be empty on internal relays)
 *   mail.pass   — auth password (secret)
 *   mail.from   — sender address (default security@gihm.local)
 *
 * Credentials are read at call time (not module load) so admin edits apply
 * live and tests can swap the transport without reloading the module.
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { getSetting } from './settings.js';

export interface MailDispatchResult {
  dispatched: boolean;
  note: string;
  messageId?: string;
}

/** Test hook: replaces the transport factory (captures sends without a real SMTP server). */
type TransportFactory = () => Pick<Transporter, 'sendMail'>;
let testFactory: TransportFactory | null = null;

/** Resolve the SMTP transport at call time from the current settings. */
function buildTransport(): Pick<Transporter, 'sendMail'> | null {
  const host = getSetting('mail.host');
  if (!host) return null;
  const port = Number(getSetting('mail.port') ?? 587) || 587;
  const secure = (getSetting('mail.secure') ?? '').toLowerCase() === 'true';
  const user = getSetting('mail.user') ?? '';
  const pass = getSetting('mail.pass') ?? '';
  return nodemailer.createTransport({
    host,
    port,
    secure,
    // Both user AND pass are required for auth — a lone password must never
    // trigger an empty-user authentication attempt.
    auth: user && pass ? { user, pass } : undefined,
  });
}

/** Whether an SMTP host is configured (the minimum for email dispatch). */
export function mailConfigured(): boolean {
  return Boolean(getSetting('mail.host'));
}

/**
 * Send a plain-text alert email. Never throws — failures degrade to a
 * non-dispatched result so alert dispatch stays advisory.
 */
export async function sendAlertEmail(opts: { to: string; subject: string; text: string; html?: string }): Promise<MailDispatchResult> {
  if (!opts.to || !opts.to.includes('@')) {
    return { dispatched: false, note: `Unrecognised recipient address (${opts.to}) — alert not emailed.` };
  }
  if (!mailConfigured()) {
    return {
      dispatched: false,
      note: 'SMTP not connected — set MAIL_HOST (plus MAIL_USER / MAIL_PASS as required) to enable email alerts.',
    };
  }
  try {
    const transport = testFactory ? testFactory() : buildTransport();
    if (!transport) return { dispatched: false, note: 'SMTP transport unavailable.' };
    const info = await transport.sendMail({
      from: getSetting('mail.from') ?? 'security@gihm.local',
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    return {
      dispatched: true,
      messageId: info.messageId ?? undefined,
      note: `Alert emailed to ${opts.to}.`,
    };
  } catch (err) {
    return {
      dispatched: false,
      note: `Email dispatch failed: ${err instanceof Error ? err.message : 'network error'}`,
    };
  }
}

/**
 * Test button for the Settings Email group — sends a probe email to the
 * configured MAIL_FROM address (the account owner), verifying the SMTP
 * handshake, auth and relay end to end. Never throws.
 */
export async function sendTestMail(): Promise<MailDispatchResult & { to?: string }> {
  if (!mailConfigured()) {
    return { dispatched: false, note: 'SMTP not connected — set MAIL_HOST to enable email alerts.' };
  }
  const from = getSetting('mail.from');
  if (!from) {
    return { dispatched: false, note: 'Set MAIL_FROM first — the test email is sent to the From address (the account owner).' };
  }
  const result = await sendAlertEmail({
    to: from,
    subject: '[GIHM-HIS] Test email from the Settings page',
    text: 'This is a test email from GIHM-HIS. If you are reading this, SMTP is configured correctly and alert emails will be delivered.\n\n— GIHM-HIS system settings',
  });
  return { ...result, to: from };
}

/** Test hook — swap in a capturing transport (must return a promise or call sendMail synchronously). */
export function setMailTransportForTest(factory: TransportFactory | null): void {
  testFactory = factory;
}

/** Test hook — restore the settings-driven transport. */
export function resetMailTransportForTest(): void {
  testFactory = null;
}
