import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { recordAudit } from '../../lib/audit.js';
import { SETTING_DEFS, clearSetting, getSetting, maskSecret, setSetting, settingSource } from '../../lib/settings.js';
import { checkSmsBalance } from '../../lib/sms.js';
import { sendTestMail } from '../../lib/mail.js';
import type { Guards } from '../../lib/guards.js';

/** Effective value for every definition — secrets masked, never in full. */
function settingsResponse() {
  return SETTING_DEFS.map((def) => {
    const effective = getSetting(def.key) ?? '';
    return {
      key: def.key,
      group: def.group,
      label: def.label,
      description: def.description,
      env: def.env,
      secret: def.secret,
      source: settingSource(def.key),
      configured: effective !== '',
      value: def.secret ? maskSecret(effective) : effective,
    };
  });
}

export function registerAdminSettingsRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  // ------------------------------------------------------- list settings
  app.get(
    '/admin/settings',
    { preHandler: guards.requirePermission('manage_system_settings'), schema: { summary: 'List system settings (secrets masked)', tags: ['admin'] } },
    async () => ({ settings: settingsResponse() }),
  );

  // ------------------------------------------------------ update settings
  app.put(
    '/admin/settings',
    { preHandler: guards.requirePermission('manage_system_settings'), schema: { summary: 'Update system settings (empty value clears to the env default)', tags: ['admin'] } },
    async (request) => {
      const u = request.user!;
      const body = (request.body ?? {}) as Record<string, unknown>;
      const updates = body.updates;
      if (!Array.isArray(updates)) throw httpErrors.badRequest('updates must be an array of { key, value }');
      const valid = new Set(SETTING_DEFS.map((d) => d.key));
      const changed: string[] = [];
      for (const item of updates) {
        const key = (item as Record<string, unknown>).key;
        if (typeof key !== 'string' || !valid.has(key)) throw httpErrors.badRequest(`Unknown setting key: ${String(key)}`);
        const raw = (item as Record<string, unknown>).value;
        const value = typeof raw === 'string' ? raw : raw === null ? '' : String(raw ?? '');
        if (value === '') await clearSetting(db, key);
        else await setSetting(db, key, value, u.id);
        changed.push(key);
        // A direct expiry edit (bypassing the activate endpoint) changes the
        // license the expiry sweep watches — re-arm its dedup markers so the
        // new expiry gets a fresh alert schedule (docs/25).
        if (key === 'license.expiresAt') {
          await clearSetting(db, 'license.expiryAlertedAt');
          await clearSetting(db, 'license.expiredAlertedAt');
        }
      }
      // Audit keys/groups only — secret values must never reach the trail.
      const groups = [...new Set(changed.map((k) => SETTING_DEFS.find((d) => d.key === k)!.group))];
      recordAudit(db, request, { action: 'system.settings.update', entityType: 'system', after: { keys: changed, groups, count: changed.length } });
      return { updated: changed, settings: settingsResponse() };
    },
  );

  // ------------------------------------------------ test the SMS gateway
  app.post(
    '/admin/settings/test-sms',
    { preHandler: guards.requirePermission('manage_system_settings'), schema: { summary: 'Test the configured SMS gateway (balance/credentials)', tags: ['admin'] } },
    async (request) => {
      const result = await checkSmsBalance();
      recordAudit(db, request, { action: 'system.settings.test', entityType: 'system', after: { provider: result.provider, balance: result.balance ?? null, note: result.note } });
      return result;
    },
  );

  // ------------------------------------------------ test the SMTP channel
  app.post(
    '/admin/settings/test-mail',
    { preHandler: guards.requirePermission('manage_system_settings'), schema: { summary: 'Send a probe email via the configured SMTP channel (verify credentials)', tags: ['admin'] } },
    async (request) => {
      const result = await sendTestMail();
      recordAudit(db, request, { action: 'system.settings.test', entityType: 'system', after: { channel: 'mail', dispatched: result.dispatched, to: result.to ?? null, note: result.note } });
      return result;
    },
  );

}
