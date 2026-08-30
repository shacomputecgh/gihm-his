import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { PrismaClient } from '@prisma/client';
import { prisma as defaultDb } from './db.js';
import { config } from './config.js';
import { getSetting, initSettings } from './lib/settings.js';
import { initEpiSchedule } from './lib/epiSchedule.js';
import { makeGuards } from './lib/guards.js';
import { registerAuthRoutes } from './modules/auth/routes.js';
import { registerGeographyRoutes } from './modules/geography/routes.js';
import { registerFacilityRoutes } from './modules/facilities/routes.js';
import { registerPatientRoutes } from './modules/patients/routes.js';
import { registerPatientDocumentRoutes } from './modules/patients/documents.js';
import { registerPatientPhotoRoutes } from './modules/patients/photo.js';
import { registerAppointmentRoutes } from './modules/appointments/routes.js';
import { registerDashboardRoutes } from './modules/dashboard/routes.js';
import { registerAdminRoutes } from './modules/admin/routes.js';
import { registerAdminSettingsRoutes } from './modules/admin/settings.js';
import { registerAdminMasterdataRoutes } from './modules/admin/masterdata.js';
import { registerAdminUnitsRoutes } from './modules/admin/units.js';
import { registerAdminUserRoutes } from './modules/admin/users.js';
import { registerNationalServiceRoutes } from './modules/admin/nationalService.js';
import { registerDeveloperRoutes } from './modules/admin/developer.js';
import { registerMpiRoutes } from './modules/admin/mpi.js';
import { registerClinicalRoutes } from './modules/clinical/routes.js';
import { registerDrugRoutes } from './modules/clinical/drugs.js';
import { registerLLMRoutes } from './modules/clinical/llmChat.js';
import { registerInventoryRoutes } from './modules/inventory/routes.js';
import { registerReferralRoutes } from './modules/referrals/routes.js';
import { registerBedRoutes } from './modules/beds/routes.js';
import { registerAmbulanceRoutes } from './modules/ambulance/routes.js';
import { registerBloodBankRoutes } from './modules/bloodbank/routes.js';
import { registerTheatreRoutes } from './modules/theatre/routes.js';
import { registerImmunizationRoutes } from './modules/immunization/routes.js';
import { registerDirectorateRoutes } from './modules/directorate/routes.js';
import { registerInsuranceRoutes } from './modules/insurance/routes.js';
import { registerAssetRoutes } from './modules/assets/routes.js';
import { registerSurveillanceRoutes } from './modules/surveillance/routes.js';
import { registerAdmissionRoutes } from './modules/admissions/routes.js';
import { registerMaternityRoutes } from './modules/maternity/routes.js';
import { registerPaymentRoutes } from './modules/payments/routes.js';
import { registerWebhookRoutes } from './modules/webhooks/routes.js';
import { registerTelemedicineRoutes } from './modules/telemedicine/routes.js';
import { registerImagingRoutes } from './modules/imaging/routes.js';
import { registerDataQualityRoutes } from './modules/dataQuality/routes.js';
import { registerReportRoutes } from './modules/reports/routes.js';
import { registerIntegrationRoutes } from './modules/integrations/routes.js';
import { registerAiRoutes } from './modules/ai/routes.js';
import { registerSyncRoutes } from './modules/sync/routes.js';
import { registerSseRoutes } from './modules/sync/sse.js';
import { registerBroadcastHook } from './modules/sync/broadcastHook.js';
import { registerHealthRoutes } from './modules/health.js';
import { registerMetricsRoutes } from './modules/metrics.js';
import { withEntityCapture } from './modules/edge/capture.js';

export async function buildApp(opts: { db?: PrismaClient; logger?: boolean } = {}): Promise<FastifyInstance> {
  // A facility edge with an upstream (EDGE_RELAY_URL) captures direct online
  // writes into its mutation log so the relay bubbles them up too (docs/16
  // §5) — the national platform (no EDGE_RELAY_URL) never captures.
  const db = config.edgeRelay.url ? withEntityCapture(opts.db ?? defaultDb) : (opts.db ?? defaultDb);
  // Runtime settings + editable EPI schedule (docs/24): load DB-backed values so
  // config resolves through lib/settings.ts / lib/epiSchedule.ts. A fresh table
  // loads nothing — env vars and the built-in schedule remain the defaults.
  await initSettings(db);
  await initEpiSchedule(db);
  const app = Fastify({ logger: opts.logger ?? config.nodeEnv !== 'test' });
  // Empty JSON bodies (Content-Type: application/json with no payload) are a
  // normal pattern for action endpoints (impersonate, license deactivate, …).
  // Fastify's default parser rejects them with 400 — treat them as `{}` so
  // no-body POSTs behave like the action endpoints they are.
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
    try {
      const raw = typeof body === 'string' ? body : body.toString('utf8');
      done(null, raw === '' ? {} : JSON.parse(raw));
    } catch (err) {
      done(err as Error);
    }
  });

  await app.register(sensible);
  // Dynamic CORS: the allowed origins are re-read from settings on every
  // request, so an admin edit to app.webOrigin applies without a restart.
  await app.register(cors, {
    origin: (origin: string | undefined, cb: (err: Error | null, allow: boolean | string | RegExp | (boolean | string | RegExp)[]) => void) => {
      if (!origin) return cb(null, true); // non-browser / server-to-server
      const allowed = (getSetting('app.webOrigin') ?? config.webOrigin).split(',').map((s) => s.trim());
      cb(null, allowed.includes('*') || allowed.includes(origin));
    },
    credentials: true,
  });
  // Global per-IP request ceiling (default 300/min). E2E and load-testing
  // environments raise it via RATE_LIMIT_MAX — the E2E suite plus the queue
  // page's 15s polling bursts past 300, and a 429 on /auth/me would drop the
  // session mid-test.
  await app.register(rateLimit, { max: Number(process.env.RATE_LIMIT_MAX ?? 300), timeWindow: '1 minute' });
  await app.register(jwt, { secret: getSetting('app.jwtSecret') ?? config.jwtSecret });
  await app.register(swagger, {
    openapi: {
      info: { title: 'GIHM-HIS API', description: 'Ghana Integrated Health Management & Hospital Information System — foundation API', version: '0.1.0' },
      servers: [{ url: 'http://localhost:4000' }],
    },
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  const guards = makeGuards(db);

  // Structured error envelope — never leak internals to normal users (spec §139).
  app.setErrorHandler((err, request, reply) => {
    const statusCode = (err as { statusCode?: number }).statusCode ?? 500;
    if (statusCode >= 500) {
      request.log.error(err);
    }
    const code =
      (err as { code?: string }).code ??
      ({ 400: 'BAD_REQUEST', 401: 'UNAUTHORIZED', 403: 'FORBIDDEN', 404: 'NOT_FOUND', 409: 'CONFLICT', 422: 'VALIDATION' } as Record<number, string>)[statusCode] ??
      'INTERNAL_ERROR';
    const body = {
      error: {
        code,
        message: statusCode >= 500 && config.nodeEnv === 'production' ? 'Something went wrong. Your information has been saved locally. Please try again. Reference: GH-5000.' : (err as Error).message,
      },
    };
    void reply.status(statusCode).send(body);
  });

  // All platform routes are versioned under /api/v1 (spec §54 API-first).
  const api = async (instance: FastifyInstance) => {
    registerHealthRoutes(instance, db);
    registerMetricsRoutes(instance, db);
    registerAuthRoutes(instance, db, guards);
    registerGeographyRoutes(instance, db, guards);
    registerFacilityRoutes(instance, db, guards);
    registerPatientRoutes(instance, db, guards);
    registerPatientDocumentRoutes(instance, db, guards);
    registerPatientPhotoRoutes(instance, db, guards);
    registerAppointmentRoutes(instance, db, guards);
    registerDashboardRoutes(instance, db, guards);
    registerAdminRoutes(instance, db, guards);
    registerAdminSettingsRoutes(instance, db, guards);
    registerAdminMasterdataRoutes(instance, db, guards);
    registerAdminUnitsRoutes(instance, db, guards);
    registerAdminUserRoutes(instance, db, guards);
    registerNationalServiceRoutes(instance, db, guards);
    registerDeveloperRoutes(instance, db, guards);
    registerMpiRoutes(instance, db, guards);
    registerClinicalRoutes(instance, db, guards);
    registerDrugRoutes(instance, db, guards);
    registerLLMRoutes(instance, db, guards);
    registerInventoryRoutes(instance, db, guards);
    registerReferralRoutes(instance, db, guards);
    registerBedRoutes(instance, db, guards);
    registerAmbulanceRoutes(instance, db, guards);
    registerBloodBankRoutes(instance, db, guards);
    registerTheatreRoutes(instance, db, guards);
    registerImmunizationRoutes(instance, db, guards);
    registerDirectorateRoutes(instance, db, guards);
    registerInsuranceRoutes(instance, db, guards);
    registerAssetRoutes(instance, db, guards);
    registerSurveillanceRoutes(instance, db, guards);
    registerAdmissionRoutes(instance, db, guards);
    registerMaternityRoutes(instance, db, guards);
    registerTelemedicineRoutes(instance, db, guards);
    registerImagingRoutes(instance, db, guards);
    registerDataQualityRoutes(instance, db, guards);
    registerPaymentRoutes(instance, db, guards);
    registerWebhookRoutes(instance, db, guards);
    registerReportRoutes(instance, db, guards);
    registerIntegrationRoutes(instance, db, guards, config.integrations);
    registerAiRoutes(instance, db, guards);
    registerSyncRoutes(instance, db, guards);
    registerSseRoutes(instance, db, guards);
  };
  await app.register(api, { prefix: '/api/v1' });

  // Auto-broadcast all direct writes to SSE subscribers (real-time sync)
  registerBroadcastHook(app);

  return app;
}
