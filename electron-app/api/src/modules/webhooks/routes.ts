// -----------------------------------------------------------------------------
// Platform event webhooks (docs/22 Phase 7 — advanced interoperability):
// external systems subscribe to platform events and receive HMAC-signed POSTs
// with durable retry. Subscriptions are manage_integrations territory (like
// the national adapters); the delivery log is the reconciliation record.
// -----------------------------------------------------------------------------

import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { str, optStr } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import type { Guards } from '../../lib/guards.js';
import { publishEvent, deliverDueWebhooks, webhookTargetAllowed } from './engine.js';
import { randomBytes } from 'node:crypto';

/** Events subscriptions can choose (the events the platform actually emits). */
export const WEBHOOK_EVENTS = ['patient.created', 'labOrder.verified', 'immunization.administered', 'delivery.recorded'] as const;

function parseEvents(raw: string | undefined): string[] {
  if (!raw) return [];
  const parts = raw.split(',').map((e) => e.trim()).filter(Boolean);
  for (const e of parts) {
    if (e !== '*' && !(WEBHOOK_EVENTS as readonly string[]).includes(e)) {
      throw httpErrors.badRequest(`Unknown event: ${e} — supported: ${WEBHOOK_EVENTS.join(', ')}, or * for all`);
    }
  }
  return parts;
}

export function registerWebhookRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  // -------------------------------------------------------------- list/create
  app.get(
    '/webhooks',
    { preHandler: guards.requirePermission('manage_integrations'), schema: { summary: 'List webhook subscriptions', tags: ['webhooks'] } },
    async () => {
      const subscriptions = await db.webhookSubscription.findMany({
        orderBy: { createdAt: 'asc' },
        include: { _count: { select: { deliveries: true } } },
      });
      return { subscriptions, events: WEBHOOK_EVENTS };
    },
  );

  app.post(
    '/webhooks',
    { preHandler: guards.requirePermission('manage_integrations'), schema: { summary: 'Create a webhook subscription', tags: ['webhooks'] } },
    async (request) => {
      const u = request.user!;
      const body = (request.body ?? {}) as Record<string, unknown>;
      const url = str(body.url, 'url', { required: true, max: 500 });
      if (!webhookTargetAllowed(url)) throw httpErrors.badRequest('Webhook URL must be http(s) and not a loopback/private target (SSRF guard)');
      const events = parseEvents(optStr(body.events));
      if (events.length === 0) throw httpErrors.badRequest('Select at least one event (or * for all)');
      const secret = optStr(body.secret) ?? randomBytes(24).toString('hex');
      const subscription = await db.webhookSubscription.create({
        data: {
          name: str(body.name, 'name', { required: true, max: 120 }),
          url,
          events: JSON.stringify(events),
          secret,
          active: body.active === undefined ? true : Boolean(body.active),
          createdById: u.id,
        },
      });
      recordAudit(db, request, { action: 'webhook.create', entityType: 'webhookSubscription', entityId: subscription.id, after: { name: subscription.name, url, events } });
      return { subscription };
    },
  );

  // -------------------------------------------------------------- update/delete
  app.patch(
    '/webhooks/:id',
    { preHandler: guards.requirePermission('manage_integrations'), schema: { summary: 'Update a webhook subscription (events, active, url)', tags: ['webhooks'] } },
    async (request) => {
      const u = request.user!;
      const { id } = request.params as { id: string };
      const existing = await db.webhookSubscription.findUnique({ where: { id } });
      if (!existing) throw httpErrors.notFound('Webhook subscription not found');
      const body = (request.body ?? {}) as Record<string, unknown>;
      const data: Record<string, unknown> = {};
      if (body.name !== undefined) data.name = str(body.name, 'name', { required: true, max: 120 });
      if (body.url !== undefined) {
        const url = str(body.url, 'url', { required: true, max: 500 });
        if (!webhookTargetAllowed(url)) throw httpErrors.badRequest('Webhook URL must be http(s) and not a loopback/private target (SSRF guard)');
        data.url = url;
      }
      if (body.events !== undefined) {
        const events = parseEvents(optStr(body.events));
        if (events.length === 0) throw httpErrors.badRequest('Select at least one event (or * for all)');
        data.events = JSON.stringify(events);
      }
      if (body.active !== undefined) data.active = Boolean(body.active);
      const subscription = await db.webhookSubscription.update({ where: { id: existing.id }, data });
      recordAudit(db, request, { action: 'webhook.update', entityType: 'webhookSubscription', entityId: subscription.id, after: { ...data } });
      return { subscription };
    },
  );

  app.delete(
    '/webhooks/:id',
    { preHandler: guards.requirePermission('manage_integrations'), schema: { summary: 'Delete a webhook subscription (and its delivery history)', tags: ['webhooks'] } },
    async (request) => {
      const u = request.user!;
      const { id } = request.params as { id: string };
      const existing = await db.webhookSubscription.findUnique({ where: { id } });
      if (!existing) throw httpErrors.notFound('Webhook subscription not found');
      await db.webhookDelivery.deleteMany({ where: { subscriptionId: id } });
      await db.webhookSubscription.delete({ where: { id } });
      recordAudit(db, request, { action: 'webhook.delete', entityType: 'webhookSubscription', entityId: id, after: { name: existing.name } });
      return { ok: true };
    },
  );

  // ------------------------------------------------------------------- test
  app.post(
    '/webhooks/:id/test',
    { preHandler: guards.requirePermission('manage_integrations'), schema: { summary: 'Publish a test event to one subscription', tags: ['webhooks'] } },
    async (request) => {
      const u = request.user!;
      const { id } = request.params as { id: string };
      const existing = await db.webhookSubscription.findUnique({ where: { id } });
      if (!existing) throw httpErrors.notFound('Webhook subscription not found');
      const result = await publishEvent(db, 'patient.created', { test: true, message: `Test event for ${existing.name}` });
      recordAudit(db, request, { action: 'webhook.test', entityType: 'webhookSubscription', entityId: id, after: { deliveries: result.deliveries } });
      return { ...result, note: 'A test patient.created delivery is queued — run the sweep to deliver it.' };
    },
  );

  // --------------------------------------------------------- delivery log
  app.get(
    '/webhooks/deliveries',
    { preHandler: guards.requirePermission('manage_integrations'), schema: { summary: 'Webhook delivery log (reconciliation record)', tags: ['webhooks'] } },
    async (request) => {
      const q = request.query as Record<string, unknown>;
      const status = optStr(q.status);
      const where: Record<string, unknown> = {};
      if (status) where.status = status;
      const rows = await db.webhookDelivery.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { subscription: { select: { name: true, url: true } } },
      });
      return { rows, count: rows.length };
    },
  );

  // ------------------------------------------------------------------ sweep
  app.post(
    '/webhooks/sweep',
    { preHandler: guards.requirePermission('manage_integrations'), schema: { summary: 'Run the webhook delivery sweep now (retry due deliveries)', tags: ['webhooks'] } },
    async (request) => {
      const result = await deliverDueWebhooks(db);
      recordAudit(db, request, { action: 'webhook.sweep', entityType: 'webhook', after: result });
      return { ...result, now: new Date().toISOString() };
    },
  );
}
