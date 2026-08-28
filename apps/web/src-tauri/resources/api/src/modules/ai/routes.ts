import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { num } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import type { Guards } from '../../lib/guards.js';
import { buildDraftNote, reviewDuplicates, forecastIndicator, forecastStockDemand } from './service.js';

/**
 * AI services (docs/22 Phase 7 — spec §82–83). Deterministic assist features
 * computed live from platform records — never an external model in this build —
 * with every output carrying the mandatory "AI-generated — requires
 * professional verification" disclosure. Documentation assist and duplicate
 * review need clinical record access (they read a patient's data); forecasting
 * is aggregate-only like the reporting engine.
 */
export function registerAiRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  // ------------------------------------------------ documentation assist
  app.post(
    '/ai/encounters/:id/draft-note',
    { preHandler: guards.requirePermission('view_clinical_record', 'write_clinical_note'), schema: { summary: 'Draft a clinical note from an encounter (AI-generated — verify before saving)', tags: ['ai'] } },
    async (request) => {
      const u = request.user!;
      const { id } = request.params as { id: string };
      const result = await buildDraftNote(db, u, id);
      recordAudit(db, request, { action: 'ai.draft-note', entityType: 'encounter', entityId: id, after: { basedOn: result.basedOn } });
      return result;
    },
  );

  // ------------------------------------------------ duplicate detection
  app.post(
    '/ai/patients/:id/duplicates',
    { preHandler: guards.requirePermission('view_patient', 'view_clinical_record'), schema: { summary: 'AI-flagged duplicate review for a patient (never auto-merges)', tags: ['ai'] } },
    async (request) => {
      const u = request.user!;
      const { id } = request.params as { id: string };
      const result = await reviewDuplicates(db, u, id);
      recordAudit(db, request, { action: 'ai.duplicate-review', entityType: 'patient', entityId: id, after: { candidates: result.candidates.length } });
      return result;
    },
  );

  // ------------------------------------------------- predictive analytics
  // Stock consumption forecasting (predictive analytics — docs/22 Phase 7):
  // projects next-month demand from live ISSUE outflows and derives the
  // run-out date. Aggregate-only (no patient data) — view_reports suffices.
  app.get(
    '/ai/forecast/stock/:id',
    { preHandler: guards.requirePermission('view_reports', 'manage_inventory'), schema: { summary: 'Forecast next-month demand + run-out for a stock item (AI-generated)', tags: ['ai'] } },
    async (request) => {
      const u = request.user!;
      const { id } = request.params as { id: string };
      const result = await forecastStockDemand(db, u, id);
      recordAudit(db, request, { action: 'ai.stock-forecast', entityType: 'stockItem', entityId: id, after: { available: result.available, status: result.status } });
      return result;
    },
  );

  // ----------------------------------------------------------- forecasting
  app.get(
    '/ai/forecast/:indicator',
    { preHandler: guards.requirePermission('view_reports'), schema: { summary: 'Project a collected indicator forward (aggregate-only, AI-generated)', tags: ['ai'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { indicator: string };
      const q = request.query as Record<string, unknown>;
      // Unvalidated on purpose — forecastIndicator rejects out-of-range horizons
      // (1–24) so the validation lives in one place.
      const months = num(q.months, 'months') ?? 3;
      const result = await forecastIndicator(db, u, params.indicator, months);
      recordAudit(db, request, { action: 'ai.forecast', entityType: 'report', after: { indicator: params.indicator, months, available: result.available } });
      return result;
    },
  );
}
