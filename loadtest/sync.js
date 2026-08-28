// Load test — sync + idempotency under concurrency (docs/19 test G, spec
// §161). Offline-first facilities burst their outbox after connectivity
// returns: many devices pushing mutation batches at once, with retried
// transactions hitting the idempotency path (duplicated: true, never
// re-applied). This is the national platform's peak write corridor.
//
// Env: API_BASE, LOGIN_EMAIL / LOGIN_PASSWORD (must hold sync_data —
// default admin@demo.gh, the national admin).

import http from 'k6/http';
import { check, sleep } from 'k6';

const API = __ENV.API_BASE || 'http://localhost:4000/api/v1';
const EMAIL = __ENV.LOGIN_EMAIL || 'admin@demo.gh';
const PASSWORD = __ENV.LOGIN_PASSWORD || 'Demo@123';

const jsonHeaders = { 'Content-Type': 'application/json' };

export const options = {
  scenarios: {
    sync: {
      // 5 VUs = one facility's offline devices bursting on reconnection — the
      // realistic unit. Scale tiers via flags (CHPS 2 · district 5 · regional
      // 15 · national 30). SQLite serialises writes, so national-tier runs
      // should target the Postgres deployment (see loadtest/README).
      executor: 'per-vu-iterations',
      vus: 5,
      iterations: 3,
      maxDuration: '3m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    'http_req_duration{name:sync_batch}': ['p(95)<1500'],
    'http_req_duration{name:sync_replay}': ['p(95)<1500'],
  },
};

export function setup() {
  const res = http.post(`${API}/auth/login`, JSON.stringify({ email: EMAIL, password: PASSWORD }), { headers: jsonHeaders });
  check(res, { 'setup login 200': (r) => r.status === 200 });
  return { token: res.json().token };
}

function bearer(token) {
  return { Authorization: `Bearer ${token}` };
}

function txn(prefix) {
  // k6 doesn't ship a UUID helper — monotonic counter + VU id is unique
  // enough for transaction ids (server dedupes on exact match).
  return `${prefix}-${__VU}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export default function (data) {
  const headers = Object.assign({ 'Content-Type': 'application/json' }, bearer(data.token));

  // One outbox batch: a couple of patient registrations captured offline.
  const t1 = txn('lt-sync');
  const t2 = txn('lt-sync');
  const payload = {
    mutations: [
      {
        transactionId: t1,
        entityType: 'patient',
        operation: 'CREATE',
        idempotencyKey: `loadtest-${t1}`,
        clientTimestamp: new Date().toISOString(),
        payload: {
          fullName: `Sync Patient ${Math.floor(Math.random() * 1000000)}`,
          dateOfBirth: '1992-04-10',
          sex: 'FEMALE',
          phone: `051${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
          consentAccepted: true,
        },
      },
      {
        transactionId: t2,
        entityType: 'patient',
        operation: 'CREATE',
        idempotencyKey: `loadtest-${t2}`,
        clientTimestamp: new Date().toISOString(),
        payload: {
          fullName: `Sync Patient ${Math.floor(Math.random() * 1000000)}`,
          dateOfBirth: '1988-11-02',
          sex: 'MALE',
          consentAccepted: true,
        },
      },
    ],
  };

  const push = http.post(`${API}/sync/mutations`, JSON.stringify(payload), { headers, tags: { name: 'sync_batch' } });
  check(push, {
    'sync batch 200 + processed': (r) => r.status === 200 && r.json('processed') === 2,
    'sync batch zero failed': (r) => r.json('failed') === 0,
  });

  // Replay the same batch — the idempotency guarantee: duplicated, not
  // re-applied. This is the exact property offline retries depend on.
  const replay = http.post(`${API}/sync/mutations`, JSON.stringify(payload), { headers, tags: { name: 'sync_replay' } });
  check(replay, {
    'sync replay 200 + all duplicated': (r) => {
      if (r.status !== 200) return false;
      const results = r.json().results;
      return results.length === 2 && results.every((m) => m.status === 'PROCESSED' && m.duplicated === true);
    },
  });

  sleep(0.5 + Math.random());
}
