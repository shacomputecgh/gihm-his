// -----------------------------------------------------------------------------
// Payments (spec §37 — provider abstraction, never hard-code one provider).
//
// Invoices are paid through a provider attempt: the platform initiates a
// payment (idempotent by idempotencyKey — re-initiating never double-charges),
// records the attempt with the provider's ref, and the provider's confirmation
// (webhook) marks it SUCCESS/FAILED. Only confirmed SUCCESS updates the
// invoice's paidAmount/status — a payment is never assumed. The SIMULATED
// provider exercises the whole flow in test/demo; real MOMO/card providers
// implement the same contract (docs/08 §2, payments/providers.ts).
// -----------------------------------------------------------------------------

import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { optStr, num } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import type { Guards } from '../../lib/guards.js';
import { assertPatientAccess } from '../patients/service.js';
import { getProvider, listProviders } from './providers.js';

export function registerPaymentRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  // ------------------------------------------------------------ providers
  app.get(
    '/payments/providers',
    { preHandler: guards.requirePermission('process_payment', 'view_financial', 'manage_integrations'), schema: { summary: 'List payment providers (truthful configuration)', tags: ['payments'] } },
    async () => ({ providers: listProviders() }),
  );

  // -------------------------------------------------------------- initiate
  app.post(
    '/invoices/:id/payments',
    { preHandler: guards.requirePermission('process_payment'), schema: { summary: 'Initiate a payment for an invoice through a provider (idempotent)', tags: ['payments'] } },
    async (request) => {
      const u = request.user!;
      const { id } = request.params as { id: string };
      const invoice = await db.invoice.findUnique({ where: { id } });
      if (!invoice) throw httpErrors.notFound('Invoice not found');
      await assertPatientAccess(db, u, invoice.patientId);

      const body = (request.body ?? {}) as Record<string, unknown>;
      const providerId = optStr(body.provider) ?? 'SIMULATED';
      const provider = getProvider(providerId);
      if (!provider) throw httpErrors.badRequest(`Unknown payment provider: ${providerId}`);
      if (!provider.info.configured) throw httpErrors.conflict(`Payment provider ${providerId} is not configured`);

      const remaining = Math.max(0, invoice.amount - invoice.paidAmount);
      if (remaining <= 0) throw httpErrors.conflict('Invoice is already fully paid');
      const amount = num(body.amount, 'amount') ?? remaining;
      if (amount <= 0 || amount > remaining) throw httpErrors.badRequest(`amount must be between 0 and the remaining balance (${remaining})`);

      const idempotencyKey = optStr(body.idempotencyKey) ?? `pay:${invoice.id}:${providerId}:${amount}`;
      const existing = await db.paymentAttempt.findUnique({ where: { idempotencyKey } });
      if (existing) return { attempt: existing, duplicated: true };

      const initiated = await provider.initiate(amount, invoice.id);
      const attempt = await db.paymentAttempt.create({
        data: {
          invoiceId: invoice.id,
          provider: provider.info.id,
          providerRef: initiated.providerRef,
          amount,
          status: 'PENDING',
          idempotencyKey,
          initiatedById: u.id,
          checkoutUrl: initiated.checkoutUrl,
        },
      });
      recordAudit(db, request, {
        action: 'payment.initiate',
        entityType: 'paymentAttempt',
        entityId: attempt.id,
        after: { invoiceId: invoice.id, provider: provider.info.id, amount, providerRef: attempt.providerRef, duplicated: false },
      });
      return { attempt, duplicated: false, provider: provider.info, checkoutUrl: initiated.checkoutUrl, instructions: initiated.instructions };
    },
  );

  // ------------------------------------------------------------- webhook
  // The provider's confirmation callback. Real providers verify their shared
  // secret + signature; this build authenticates the caller and lets the
  // provider implementation resolve the outcome from its ref.
  app.post(
    '/payments/webhook/:provider',
    { preHandler: guards.requirePermission('process_payment'), schema: { summary: 'Provider confirmation callback — marks an attempt SUCCESS/FAILED and updates the invoice', tags: ['payments'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { provider: string };
      const provider = getProvider(params.provider);
      if (!provider) throw httpErrors.notFound(`Unknown payment provider: ${params.provider}`);

      const body = (request.body ?? {}) as Record<string, unknown>;
      const providerRef = optStr(body.providerRef);
      if (!providerRef) throw httpErrors.badRequest('providerRef is required');

      const attempt = await db.paymentAttempt.findFirst({ where: { provider: provider.info.id, providerRef } });
      if (!attempt) throw httpErrors.notFound('No matching payment attempt');
      if (attempt.status !== 'PENDING') return { attempt, alreadyProcessed: true };

      const outcome = await provider.confirm(providerRef);
      const status = outcome.status;
      const updated = await db.paymentAttempt.update({
        where: { id: attempt.id },
        data: { status, confirmedAt: new Date(), error: outcome.error ?? null },
      });

      // Only a confirmed SUCCESS moves the invoice — never assumed, never partial.
      if (status === 'SUCCESS') {
        const invoice = await db.invoice.findUnique({ where: { id: attempt.invoiceId } });
        if (invoice) {
          const paidAmount = invoice.paidAmount + attempt.amount;
          await db.invoice.update({
            where: { id: invoice.id },
            data: {
              paidAmount,
              status: paidAmount >= invoice.amount - 0.001 ? 'PAID' : 'PARTIAL',
              paymentMethod: provider.info.kind === 'TEST' ? (invoice.paymentMethod ?? 'MOMO') : provider.info.kind,
            },
          });
        }
      }
      recordAudit(db, request, {
        action: 'payment.confirm',
        entityType: 'paymentAttempt',
        entityId: attempt.id,
        after: { invoiceId: attempt.invoiceId, providerRef, status },
      });
      return { attempt: updated };
    },
  );

  // ------------------------------------------------------------- attempts
  app.get(
    '/invoices/:id/payments',
    { preHandler: guards.requirePermission('process_payment', 'view_financial'), schema: { summary: 'Payment attempts for an invoice', tags: ['payments'] } },
    async (request) => {
      const u = request.user!;
      const { id } = request.params as { id: string };
      const invoice = await db.invoice.findUnique({ where: { id } });
      if (!invoice) throw httpErrors.notFound('Invoice not found');
      await assertPatientAccess(db, u, invoice.patientId);
      const items = await db.paymentAttempt.findMany({ where: { invoiceId: id }, orderBy: { initiatedAt: 'desc' } });
      return { items, count: items.length, remaining: Math.max(0, invoice.amount - invoice.paidAmount) };
    },
  );
}
