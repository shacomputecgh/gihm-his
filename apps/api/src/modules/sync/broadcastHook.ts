import type { FastifyInstance, FastifyReply } from 'fastify';
import { broadcastEntity } from './sse.js';

/**
 * Register an onResponse hook on the API instance that automatically broadcasts
 * successful write operations (POST/PUT/PATCH/DELETE) to SSE subscribers.
 *
 * The entity type and operation are derived from the URL path:
 *   /api/v1/patients        → entity: "patient"
 *   /api/v1/appointments     → entity: "appointment"
 *   /api/v1/lab/orders       → entity: "labOrder"
 *   etc.
 */
export function registerBroadcastHook(app: FastifyInstance): void {
  const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

  const ENTITY_MAP: Record<string, string> = {
    patients: 'patient',
    encounters: 'encounter',
    appointments: 'appointment',
    admissions: 'admission',
    prescriptions: 'prescription',
    'lab/orders': 'labOrder',
    lab: 'labOrder',
    immunizations: 'immunization',
    invoices: 'invoice',
    referrals: 'referral',
    beds: 'bed',
    ambulances: 'ambulance',
    'blood-bank': 'bloodBank',
    theatre: 'theatre',
    telemedicine: 'telemedicine',
    imaging: 'imaging',
    inventory: 'inventory',
    drugs: 'drug',
    surveillance: 'surveillance',
    assets: 'asset',
    payments: 'payment',
    reports: 'report',
    settings: 'setting',
    users: 'user',
    facilities: 'facility',
    regions: 'region',
    districts: 'district',
  };

  function deriveEntity(url: string): { entity: string; operation: string } | null {
    const path = url.replace(/^\/api\/v1\/?/, '');
    if (!path || path.startsWith('health') || path.startsWith('sse') || path.startsWith('metrics') || path.startsWith('auth')) return null;

    let bestKey = '';
    for (const key of Object.keys(ENTITY_MAP)) {
      if (path.startsWith(key) && key.length > bestKey.length) {
        bestKey = key;
      }
    }
    if (!bestKey) return null;

    return {
      entity: ENTITY_MAP[bestKey],
      operation: 'UPDATE',
    };
  }

  // Use async hook — no `done` callback needed
  app.addHook('onResponse', async (request, reply: FastifyReply) => {
    try {
      if (!WRITE_METHODS.has(request.method)) return;
      if (reply.statusCode >= 400) return;

      const derived = deriveEntity(request.url);
      if (!derived) return;

      const user = (request as any).user;
      const facilityId = user?.facilityId ?? null;

      const opMap: Record<string, string> = { POST: 'CREATE', PUT: 'UPDATE', PATCH: 'UPDATE', DELETE: 'DELETE' };
      const operation = opMap[request.method] ?? 'UPDATE';

      broadcastEntity(derived.entity, operation, 'unknown', facilityId);
    } catch {
      // Swallow broadcast errors — never break the request
    }
  });
}
