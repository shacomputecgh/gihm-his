import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, createTestApp, makeUser } from './helpers.js';
import type { FastifyInstance } from 'fastify';
import { smsProvider, smsConfigured } from '../src/lib/sms.js';
import { clearSetting, setSetting } from '../src/lib/settings.js';

let app: FastifyInstance;
let admin: { token: string };
let limited: { token: string };

beforeAll(async () => {
  // Fresh start — never leak rows into the shared test DB.
  await db.systemSetting.deleteMany();
  app = await createTestApp();
  admin = await makeUser({ email: 'settings-admin@demo.gh', roleCode: 'HOSPITAL_ADMIN', permissions: ['manage_system_settings', 'view_audit'] });
  limited = await makeUser({ email: 'settings-limited@demo.gh', roleCode: 'HOSPITAL_ADMIN', permissions: ['view_patient'] });
});

afterAll(async () => {
  await db.systemSetting.deleteMany(); // leave the shared DB pristine for other files
  await db.$disconnect();
  await app.close();
});

const auth = (t: string) => ({ authorization: `Bearer ${t}` });

describe('system settings (admin)', () => {
  it('requires the manage_system_settings permission', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/admin/settings', headers: auth(limited.token) });
    expect(res.statusCode).toBe(403);
  });

  it('lists every definition with env fallback and no secret leakage', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/admin/settings', headers: auth(admin.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.settings.length).toBeGreaterThan(15);
    const apiKey = body.settings.find((s: { key: string }) => s.key === 'sms.smsonlinegh.apiKey');
    expect(apiKey.secret).toBe(true);
    expect(apiKey.source).toBe('env'); // no rows yet → env fallback
    expect(apiKey.value).not.toContain('live');
    // All env-mapped keys are present.
    const keys = body.settings.map((s: { key: string }) => s.key);
    expect(keys).toContain('sms.provider');
    expect(keys).toContain('wa.provider');
    expect(keys).toContain('reminder.windowDays');
  });

  it('updates settings, makes them effective immediately, and audits without values', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/settings',
      headers: auth(admin.token),
      payload: {
        updates: [
          { key: 'sms.provider', value: 'hubtel' },
          { key: 'sms.hubtel.clientId', value: 'h-client' },
          { key: 'sms.hubtel.clientSecret', value: 'h-secret-value' },
        ],
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().updated).toEqual(expect.arrayContaining(['sms.provider', 'sms.hubtel.clientId', 'sms.hubtel.clientSecret']));
    // The dispatcher resolves the DB row over the (nulled) env.
    expect(smsProvider()).toBe('hubtel');
    expect(smsConfigured()).toBe(true);

    const list = await app.inject({ method: 'GET', url: '/api/v1/admin/settings', headers: auth(admin.token) });
    const secret = list.json().settings.find((s: { key: string }) => s.key === 'sms.hubtel.clientSecret');
    expect(secret.source).toBe('custom');
    expect(secret.value).toContain('•'); // masked
    expect(secret.value).not.toContain('h-secret-value'); // never the real value

    const audit = await db.auditLog.findFirst({ where: { action: 'system.settings.update' }, orderBy: { createdAt: 'desc' } });
    expect(audit).toBeTruthy();
    expect(audit?.after).toContain('sms.provider');
    expect(audit?.after).not.toContain('h-secret-value'); // secrets never reach the trail
  });

  it('clears a setting back to the env default', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/settings',
      headers: auth(admin.token),
      payload: { updates: [{ key: 'sms.hubtel.clientId', value: '' }] },
    });
    expect(res.statusCode).toBe(200);
    const s = res.json().settings.find((x: { key: string }) => x.key === 'sms.hubtel.clientId');
    expect(s.source).toBe('env');
    expect(s.configured).toBe(false);
  });

  it('supports provider "off" to disable a gateway that exists in env', async () => {
    const envProvider = process.env.SMS_PROVIDER;
    try {
      process.env.SMS_PROVIDER = 'hubtel'; // env default says hubtel
      await clearSetting(db, 'sms.provider'); // no DB row → env wins
      expect(smsProvider()).toBe('hubtel');
      await setSetting(db, 'sms.provider', 'off'); // DB override disables
      expect(smsProvider()).toBe('none');
      expect(smsConfigured()).toBe(false);
      await clearSetting(db, 'sms.provider'); // back to env default
      expect(smsProvider()).toBe('hubtel');
    } finally {
      if (envProvider === undefined) delete process.env.SMS_PROVIDER;
      else process.env.SMS_PROVIDER = envProvider;
    }
  });

  it('rejects unknown setting keys', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/admin/settings',
      headers: auth(admin.token),
      payload: { updates: [{ key: 'sms.bogus', value: 'x' }] },
    });
    expect(res.statusCode).toBe(400);
  });

  it('exposes a configuration audit filtered to settings & masterdata changes', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/admin/audit/config', headers: auth(admin.token) });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    const entries = body.entries as Array<{ action: string; label: string; summary: string; after: Record<string, unknown> }>;
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every((e) => e.action.startsWith('system.settings.') || e.action.startsWith('masterdata.'))).toBe(true);
    expect(entries.some((e) => e.action === 'system.settings.update')).toBe(true);
    expect(entries[0]!.summary.length).toBeGreaterThan(0);
    expect(entries[0]).toHaveProperty('after');
    // Secrets never reach the config audit surface either.
    expect(JSON.stringify(body)).not.toContain('h-secret-value');

    const denied = await app.inject({ method: 'GET', url: '/api/v1/admin/audit/config', headers: auth(limited.token) });
    expect(denied.statusCode).toBe(403);
  });

  it('exposes the full audit trail (newest first, capped by take) to view_audit callers', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/admin/audit', headers: auth(admin.token) });
    expect(res.statusCode).toBe(200);
    const entries = res.json().entries as Array<{ action: string; actorEmail: string; createdAt: string }>;
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.some((e) => e.action === 'system.settings.update')).toBe(true);
    const times = entries.map((e) => new Date(e.createdAt).getTime());
    expect(times).toEqual([...times].sort((a, b) => b - a));

    const capped = await app.inject({ method: 'GET', url: '/api/v1/admin/audit?take=2', headers: auth(admin.token) });
    expect(capped.json().entries.length).toBe(2);

    const denied = await app.inject({ method: 'GET', url: '/api/v1/admin/audit', headers: auth(limited.token) });
    expect(denied.statusCode).toBe(403);
  });

  it('tests the SMS gateway balance for SMSOnlineGH', async () => {
    const savedFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response(JSON.stringify({ handshake: { id: 0, label: 'HSHK_OK' }, data: { balance: 15.5 } }), { status: 200, headers: { 'content-type': 'application/json' } })) as unknown as typeof fetch;
    try {
      await app.inject({
        method: 'PUT',
        url: '/api/v1/admin/settings',
        headers: auth(admin.token),
        payload: {
          updates: [
            { key: 'sms.provider', value: 'smsonlinegh' },
            { key: 'sms.smsonlinegh.apiKey', value: 'live-key' },
          ],
        },
      });
      const res = await app.inject({ method: 'POST', url: '/api/v1/admin/settings/test-sms', headers: auth(admin.token), payload: {} });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.provider).toBe('smsonlinegh');
      expect(body.balance).toBe('15.5');
      expect(body.note).toContain('valid');
    } finally {
      globalThis.fetch = savedFetch;
    }
  });
});
