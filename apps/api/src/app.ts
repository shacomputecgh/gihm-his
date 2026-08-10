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
import { makeGuards } from './lib/guards.js';
import { registerAuthRoutes } from './modules/auth/routes.js';
import { registerGeographyRoutes } from './modules/geography/routes.js';
import { registerFacilityRoutes } from './modules/facilities/routes.js';
import { registerPatientRoutes } from './modules/patients/routes.js';
import { registerAppointmentRoutes } from './modules/appointments/routes.js';
import { registerDashboardRoutes } from './modules/dashboard/routes.js';
import { registerAdminRoutes } from './modules/admin/routes.js';
import { registerMpiRoutes } from './modules/admin/mpi.js';
import { registerClinicalRoutes } from './modules/clinical/routes.js';
import { registerInventoryRoutes } from './modules/inventory/routes.js';
import { registerReferralRoutes } from './modules/referrals/routes.js';
import { registerBedRoutes } from './modules/beds/routes.js';
import { registerAmbulanceRoutes } from './modules/ambulance/routes.js';
import { registerBloodBankRoutes } from './modules/bloodbank/routes.js';
import { registerTheatreRoutes } from './modules/theatre/routes.js';
import { registerImmunizationRoutes } from './modules/immunization/routes.js';
import { registerDirectorateRoutes } from './modules/directorate/routes.js';
import { registerSyncRoutes } from './modules/sync/routes.js';
import { registerHealthRoutes } from './modules/health.js';

export async function buildApp(opts: { db?: PrismaClient; logger?: boolean } = {}): Promise<FastifyInstance> {
  const db = opts.db ?? defaultDb;
  const app = Fastify({ logger: opts.logger ?? config.nodeEnv !== 'test' });

  await app.register(sensible);
  await app.register(cors, { origin: config.webOrigin.split(',').map((s) => s.trim()), credentials: true });
  await app.register(rateLimit, { max: 300, timeWindow: '1 minute' });
  await app.register(jwt, { secret: config.jwtSecret });
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
    registerAuthRoutes(instance, db, guards);
    registerGeographyRoutes(instance, db);
    registerFacilityRoutes(instance, db, guards);
    registerPatientRoutes(instance, db, guards);
    registerAppointmentRoutes(instance, db, guards);
    registerDashboardRoutes(instance, db, guards);
    registerAdminRoutes(instance, db, guards);
    registerMpiRoutes(instance, db, guards);
    registerClinicalRoutes(instance, db, guards);
    registerInventoryRoutes(instance, db, guards);
    registerReferralRoutes(instance, db, guards);
    registerBedRoutes(instance, db, guards);
    registerAmbulanceRoutes(instance, db, guards);
    registerBloodBankRoutes(instance, db, guards);
    registerTheatreRoutes(instance, db, guards);
    registerImmunizationRoutes(instance, db, guards);
    registerDirectorateRoutes(instance, db, guards);
    registerSyncRoutes(instance, db, guards);
  };
  await app.register(api, { prefix: '/api/v1' });

  return app;
}
