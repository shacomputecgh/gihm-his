import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { str } from '../../lib/validate.js';

export function registerGeographyRoutes(app: FastifyInstance, db: PrismaClient): void {
  app.get(
    '/geography/regions',
    { schema: { summary: 'All 16 regions with district + facility counts', tags: ['geography'] } },
    async () => {
      const regions = await db.region.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { districts: true, facilities: true } } },
      });
      return { regions };
    },
  );

  app.get(
    '/geography/districts',
    { schema: { summary: 'Districts, optionally filtered by region', tags: ['geography'] } },
    async (request) => {
      const q = request.query as Record<string, unknown>;
      const regionId = str(q.regionId, 'regionId');
      const districts = await db.district.findMany({
        where: regionId ? { regionId } : undefined,
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
        select: { id: true, name: true, code: true, type: true, capital: true, regionId: true },
      });
      return { districts };
    },
  );
}
