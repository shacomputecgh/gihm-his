import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { getSetting } from '../lib/settings.js';

export function registerHealthRoutes(app: FastifyInstance, db: PrismaClient): void {
  app.get('/health', { schema: { summary: 'Service health', tags: ['system'] } }, async () => {
    let database = 'operational';
    try {
      await db.$queryRaw`SELECT 1`;
    } catch {
      database = 'unavailable';
    }
    return {
      status: database === 'operational' ? 'ok' : 'degraded',
      service: 'gihm-his-api',
      time: new Date().toISOString(),
      timezone: getSetting('app.timezone') ?? 'Africa/Accra',
      database,
      version: '0.1.0',
    };
  });
}
