/**
 * SMS / WhatsApp dispatch for immunization reminder recalls (spec §22).
 *
 * Provider-agnostic, selected via SMS_PROVIDER:
 *   - smsonlinegh  (Ghana — verified live)
 *       POST https://api.smsonlinegh.com/v5/message/sms/send
 *            Authorization: key <SMSONLINEGH_API_KEY>   (note: "key ", not Bearer)
 *            { text, type: 0, sender, destinations: [recipient], callback? }
 *       Success = handshake.id === 0. Per-destination status labels (DS_*) are
 *       surfaced: DS_REJECTED_* is a rejection (e.g. an unregistered sender).
 *       The sender must be registered to the account (MV_ERR_SENDER otherwise).
 *       Delivery status is push-only: set SMSONLINEGH_CALLBACK_URL to include a
 *       callback in the body and POST /immunizations/reminders/delivery-callback
 *       receives the notifications — there is no per-message polling API.
 *   - hubtel       (Ghana's native gateway)
 *       GET https://smsc.hubtel.com/v1/messages/send
 *            ?clientid&clientsecret&from&to&content
 *   - twilio       (alternative)
 *       POST https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json
 *
 * WhatsApp rides on the same gateway accounts (WHATSAPP_PROVIDER=hubtel or
 * =smsonlinegh). The SMSOnlineGH WhatsApp endpoint is env-configurable
 * (SMSONLINEGH_WHATSAPP_URL) because the vendor's public docs do not document
 * it; verify against your account — if unsupported the gateway rejects the
 * send and the reminder is audit-logged with the rejection, never dropped.
 *
 * Uses only the global fetch API (no SDK dependency). Every gateway is
 * env-gated: without credentials, dispatch degrades gracefully to a logged,
 * non-dispatched result so reminders are never silently dropped from the audit
 * trail.
 *
 * Credentials are read at call time (not module load) so tests can configure
 * and restore them without reloading the module — and so the admin Settings
 * UI (docs/24) can change them at runtime via lib/settings.ts: a SystemSetting
 * DB row overrides the env var below; a fresh test DB has no rows, so tests
 * that mutate process.env keep working exactly as before.
 */

import { getSetting } from './settings.js';

export interface SmsDispatchResult {
  dispatched: boolean;
  provider: 'smsonlinegh' | 'hubtel' | 'twilio' | 'none';
  messageId?: string;
  note?: string;
}

/**
 * Resolve the active provider: explicit SMS_PROVIDER wins; with no SMS_PROVIDER
 * set, a configured credential set infers the provider (SMSOnlineGH key, then
 * Hubtel client id/secret). Unknown explicit values degrade to 'none'.
 */
export function smsProvider(): 'smsonlinegh' | 'hubtel' | 'twilio' | 'none' {
  const p = (getSetting('sms.provider') ?? '').toLowerCase();
  if (p === 'twilio') return 'twilio';
  if (p === 'smsonlinegh') return 'smsonlinegh';
  if (p === 'hubtel') return 'hubtel';
  if (p === '') {
    if (getSetting('sms.smsonlinegh.apiKey')) return 'smsonlinegh';
    if (getSetting('sms.hubtel.clientId') && getSetting('sms.hubtel.clientSecret')) return 'hubtel';
  }
  return 'none';
}

export function smsConfigured(): boolean {
  if (smsProvider() === 'smsonlinegh') {
    return Boolean(getSetting('sms.smsonlinegh.apiKey'));
  }
  if (smsProvider() === 'hubtel') {
    return Boolean(getSetting('sms.hubtel.clientId') && getSetting('sms.hubtel.clientSecret'));
  }
  if (smsProvider() === 'twilio') {
    return Boolean(getSetting('sms.twilio.accountSid') && getSetting('sms.twilio.authToken') && getSetting('sms.twilio.phoneNumber'));
  }
  return false;
}

export function whatsappConfigured(): boolean {
  const p = (getSetting('wa.provider') ?? '').toLowerCase();
  if (p === 'smsonlinegh') return Boolean(getSetting('sms.smsonlinegh.apiKey'));
  if (p !== 'hubtel') return false;
  return Boolean(
    (getSetting('wa.hubtel.clientId') ?? getSetting('sms.hubtel.clientId')) &&
    (getSetting('wa.hubtel.clientSecret') ?? getSetting('sms.hubtel.clientSecret')),
  );
}

/**
 * Normalize a stored Ghana phone number to international format. Accepts
 * "0244000000" (local) and "+233244000000" / "233244000000" (international);
 * returns null for anything unrecognizable. Hubtel expects the international
 * form without the leading '+', so the caller strips it for that provider.
 */
export function normalizeE164(phone: string): string | null {
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) {
    const rest = digits.slice(1);
    return rest.length >= 11 && rest.length <= 15 ? `+${rest}` : null;
  }
  const local = digits.startsWith('0') ? digits.slice(1) : digits;
  return local.length === 9 ? `+233${local}` : null;
}

export async function dispatchSms(opts: { to: string; message: string }): Promise<SmsDispatchResult> {
  const to = normalizeE164(opts.to);
  if (!to) {
    return { dispatched: false, provider: 'none', note: `Unrecognised phone number format (${opts.to}) — reminder logged to audit trail only.` };
  }
  const provider = smsProvider();
  if (!smsConfigured()) {
    return {
      dispatched: false,
      provider: 'none',
      note: 'SMS gateway not connected — set SMS_PROVIDER=smsonlinegh with SMSONLINEGH_API_KEY (+ SMSONLINEGH_SENDER_ID), SMS_PROVIDER=hubtel with HUBTEL_CLIENT_ID / HUBTEL_CLIENT_SECRET, or SMS_PROVIDER=twilio with TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER to enable dispatch.',
    };
  }
  try {
    if (provider === 'smsonlinegh') return dispatchSmsOnlineGh(to, opts.message);
    if (provider === 'hubtel') return dispatchHubtel(to, opts.message);
    return dispatchTwilio(to, opts.message);
  } catch (err) {
    return {
      dispatched: false,
      provider,
      note: `SMS dispatch failed: ${err instanceof Error ? err.message : 'network error'}`,
    };
  }
}

/**
 * Lightweight connectivity check for the admin Settings "Test" button: for
 * SMSOnlineGH it queries the v5 account balance (proves the API key works);
 * other providers report configured-state only (no balance API). Never throws.
 */
export async function checkSmsBalance(): Promise<{ provider: string; balance?: string; note: string }> {
  const provider = smsProvider();
  if (!smsConfigured()) {
    return { provider, note: 'SMS gateway not connected — configure credentials in Settings.' };
  }
  if (provider === 'smsonlinegh') {
    try {
      const key = getSetting('sms.smsonlinegh.apiKey')!;
      const res = await fetch('https://api.smsonlinegh.com/v5/account/balance', {
        method: 'POST',
        headers: smsOnlineGhHeaders(key),
        body: '',
        signal: AbortSignal.timeout(10_000),
      });
      const data = (await res.json()) as { handshake?: { id?: number | string; label?: string }; data?: { balance?: number | string } | null };
      const handshakeId = data.handshake?.id === undefined ? undefined : Number(data.handshake.id);
      if (data.handshake && handshakeId !== 0) {
        return { provider, note: `Balance check rejected: ${data.handshake.label ?? `error ${data.handshake.id ?? 'unknown'}`}` };
      }
      return { provider, balance: String(data.data?.balance ?? 'unknown'), note: 'Balance fetched — credentials are valid.' };
    } catch (err) {
      return { provider, note: `Balance check failed: ${err instanceof Error ? err.message : 'network error'}` };
    }
  }
  return { provider, note: `${provider} has no balance-check endpoint — send a test reminder instead.` };
}

// ---------------------------------------------------------- SMSOnlineGH
/**
 * SMSOnlineGH (Zenoph platform, v5 — verified live). `key`-prefixed auth and a
 * `destinations` array body. The send response is
 * `{ handshake: { id, label }, data: { batch, delivery, destinations: [{ id, to, status: { id, label } }] } }`:
 * handshake.id 0 = accepted; a DS_REJECTED_* destination status means the
 * message was refused (e.g. DS_REJECTED_SENDER_UNREGISTERED). Batch id is the
 * correlation key for delivery-callback notifications.
 */
interface SmsOnlineGhDestStatus {
  id?: number | string;
  label?: string;
}
interface SmsOnlineGhResponse {
  handshake?: { id?: number | string; label?: string } | null;
  data?: {
    batch?: string | null;
    delivery?: boolean;
    destinations?: Array<{ id?: string | null; to?: string; status?: SmsOnlineGhDestStatus | null }> | null;
  } | null;
}

function smsOnlineGhHeaders(key: string): Record<string, string> {
  return { Authorization: `key ${key}`, 'Content-Type': 'application/json', Accept: 'application/json' };
}

function smsOnlineGhBody(toE164: string, message: string, whatsapp = false): Record<string, unknown> {
  const senderId = getSetting('sms.smsonlinegh.senderId');
  const callbackUrl = getSetting('sms.smsonlinegh.callbackUrl');
  const body: Record<string, unknown> = {
    text: message,
    type: 0, // plain
    destinations: [toE164.replace(/^\+/, '')], // international without '+'
  };
  // The gateway requires a sender registered to the account; without one it
  // rejects with MV_ERR_SENDER — surfaced, never silently dropped.
  if (senderId) body.sender = senderId;
  // Delivery notifications ride the same callback URL for both channels — the
  // gateway pushes { messageId, status } to it and the delivery-callback
  // endpoint records the outcome on the audit trail and the alert retry queue.
  if (callbackUrl) body.callback = { url: callbackUrl, accept: 'application/json' };
  return body;
}

async function parseSmsOnlineGhResponse(res: Response, name: string): Promise<SmsDispatchResult> {
  const data = (await res.json()) as SmsOnlineGhResponse;
  if (!data || typeof data !== 'object') {
    return { dispatched: false, provider: 'smsonlinegh', note: `${name} returned an unexpected response (not JSON)` };
  }
  const handshakeId = data.handshake?.id === undefined ? undefined : Number(data.handshake.id);
  if (data.handshake && handshakeId !== 0) {
    return { dispatched: false, provider: 'smsonlinegh', note: `${name} rejected the message: handshake ${data.handshake.label ?? `error ${data.handshake.id ?? 'unknown'}`}` };
  }
  if (!res.ok) {
    return { dispatched: false, provider: 'smsonlinegh', note: `${name} rejected the message: HTTP ${res.status}` };
  }
  const batch = data.data?.batch ?? undefined;
  const dest = data.data?.destinations?.[0];
  const destStatus = dest?.status;
  // The API accepted the send but the destination refused it (e.g. sender
  // unregistered) — that is not a dispatch.
  if (destStatus?.label?.startsWith('DS_REJECTED')) {
    return {
      dispatched: false,
      provider: 'smsonlinegh',
      messageId: batch ?? dest?.id ?? undefined,
      note: `${name} rejected the message: ${destStatus.label}`,
    };
  }
  if (handshakeId === 0 || batch || dest?.id) {
    return {
      dispatched: true,
      provider: 'smsonlinegh',
      messageId: batch ?? dest?.id ?? undefined,
      note: `Dispatched via ${name}${data.data?.delivery ? ' (delivery notifications on)' : ''}.`,
    };
  }
  return { dispatched: false, provider: 'smsonlinegh', note: `${name} returned an unexpected response (no handshake, no message id)` };
}

async function dispatchSmsOnlineGh(toE164: string, message: string): Promise<SmsDispatchResult> {
  const key = getSetting('sms.smsonlinegh.apiKey')!;
  const url = getSetting('sms.smsonlinegh.url') ?? 'https://api.smsonlinegh.com/v5/message/sms/send';
  const res = await fetch(url, {
    method: 'POST',
    headers: smsOnlineGhHeaders(key),
    body: JSON.stringify(smsOnlineGhBody(toE164, message)),
    signal: AbortSignal.timeout(10_000),
  });
  return parseSmsOnlineGhResponse(res, 'SMSOnlineGH');
}

async function dispatchWhatsAppSmsOnlineGh(toE164: string, message: string): Promise<SmsDispatchResult> {
  const key = getSetting('sms.smsonlinegh.apiKey')!;
  const url = getSetting('wa.smsonlinegh.url') ?? 'https://api.smsonlinegh.com/v5/message/whatsapp/send';
  const res = await fetch(url, {
    method: 'POST',
    headers: smsOnlineGhHeaders(key),
    body: JSON.stringify(smsOnlineGhBody(toE164, message, true)),
    signal: AbortSignal.timeout(10_000),
  });
  return parseSmsOnlineGhResponse(res, 'SMSOnlineGH WhatsApp');
}

// --------------------------------------------------------------- Hubtel
async function dispatchHubtel(toE164: string, message: string): Promise<SmsDispatchResult> {
  const clientid = getSetting('sms.hubtel.clientId')!;
  const clientsecret = getSetting('sms.hubtel.clientSecret')!;
  const from = getSetting('sms.hubtel.senderId') || 'HM'; // 'HM' = Hubtel test-mode sender (empty = unset)
  const params = new URLSearchParams({
    clientid,
    clientsecret,
    from,
    to: toE164.replace(/^\+/, ''), // international format without '+'
    content: message,
  });
  const res = await fetch(`https://smsc.hubtel.com/v1/messages/send?${params.toString()}`, { signal: AbortSignal.timeout(10_000) });
  const data = (await res.json()) as { Message?: string; MessageId?: string; Success?: boolean; Rate?: number; Balance?: number };
  if (!res.ok || data.Success === false) {
    return { dispatched: false, provider: 'hubtel', note: `Hubtel rejected the message: ${data.Message ?? `HTTP ${res.status}`}` };
  }
  if (data.MessageId || data.Message?.toLowerCase() === 'success') {
    return {
      dispatched: true,
      provider: 'hubtel',
      messageId: data.MessageId ?? undefined,
      note: `Dispatched via Hubtel${data.Rate !== undefined ? ` (rate ${data.Rate})` : ''}.`,
    };
  }
  return { dispatched: false, provider: 'hubtel', note: `Hubtel returned an unexpected response: ${data.Message ?? 'no message id'}` };
}

// ------------------------------------------------------------- WhatsApp
/**
 * WhatsApp dispatch — provider-aware (WHATSAPP_PROVIDER=hubtel default,
 * =smsonlinegh). Graceful audit-only fallback when the channel is not
 * configured. The SMSOnlineGH WhatsApp endpoint is env-configurable and
 * unverified against the vendor's docs — if the account does not support it
 * the gateway handshake rejects the send and the rejection is audit-logged.
 */
export async function dispatchWhatsApp(opts: { to: string; message: string }): Promise<SmsDispatchResult> {
  const to = normalizeE164(opts.to);
  if (!to) {
    return { dispatched: false, provider: 'none', note: `Unrecognised phone number format (${opts.to}) — reminder logged to audit trail only.` };
  }
  if (!whatsappConfigured()) {
    return {
      dispatched: false,
      provider: 'none',
      note: 'WhatsApp gateway not connected — set WHATSAPP_PROVIDER=hubtel with Hubtel WhatsApp credentials (HUBTEL_WHATSAPP_CLIENT_ID / HUBTEL_WHATSAPP_CLIENT_SECRET, or the SMS client id/secret), or WHATSAPP_PROVIDER=smsonlinegh with SMSONLINEGH_API_KEY (+ SMSONLINEGH_SENDER_ID), to enable dispatch.',
    };
  }
  // Read through the settings store (not process.env directly) so the admin
  // Settings UI can switch providers at runtime — identical to whatsappConfigured().
  const provider = (getSetting('wa.provider') ?? '').toLowerCase();
  try {
    if (provider === 'smsonlinegh') return dispatchWhatsAppSmsOnlineGh(to, opts.message);

    // Hubtel (default)
    const clientId = getSetting('wa.hubtel.clientId') ?? getSetting('sms.hubtel.clientId')!;
    const clientSecret = getSetting('wa.hubtel.clientSecret') ?? getSetting('sms.hubtel.clientSecret')!;
    const sender = getSetting('wa.hubtel.senderId') || 'HM';
    const url = getSetting('wa.hubtel.url') ?? 'https://api.wa.hubtel.com/v1/messages/send';
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipient: to.replace(/^\+/, ''), message: opts.message, sender }),
      signal: AbortSignal.timeout(10_000),
    });
    const data = (await res.json()) as { Message?: string; MessageId?: string; Success?: boolean };
    if (!res.ok || data.Success === false) {
      return { dispatched: false, provider: 'hubtel', note: `Hubtel WhatsApp rejected the message: ${data.Message ?? `HTTP ${res.status}`}` };
    }
    if (data.MessageId || data.Message?.toLowerCase() === 'success') {
      return { dispatched: true, provider: 'hubtel', messageId: data.MessageId ?? undefined, note: 'Dispatched via Hubtel WhatsApp.' };
    }
    return { dispatched: false, provider: 'hubtel', note: `Hubtel WhatsApp returned an unexpected response: ${data.Message ?? 'no message id'}` };
  } catch (err) {
    return {
      dispatched: false,
      provider: provider === 'smsonlinegh' ? 'smsonlinegh' : 'hubtel',
      note: `WhatsApp dispatch failed: ${err instanceof Error ? err.message : 'network error'}`,
    };
  }
}

// --------------------------------------------------------------- Twilio
async function dispatchTwilio(toE164: string, message: string): Promise<SmsDispatchResult> {
  const sid = getSetting('sms.twilio.accountSid')!;
  const token = getSetting('sms.twilio.authToken')!;
  const from = getSetting('sms.twilio.phoneNumber')!;
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ From: from, To: toE164, Body: message }).toString(),
    signal: AbortSignal.timeout(10_000),
  });
  const data = (await res.json()) as { sid?: string; error_message?: string; status?: string };
  if (!res.ok || data.error_message) {
    return { dispatched: false, provider: 'twilio', note: `Twilio rejected the message: ${data.error_message ?? `HTTP ${res.status}`}` };
  }
  return {
    dispatched: true,
    provider: 'twilio',
    messageId: data.sid ?? undefined,
    note: `Dispatched via Twilio (status: ${data.status ?? 'queued'}).`,
  };
}
