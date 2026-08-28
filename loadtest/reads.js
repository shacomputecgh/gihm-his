// Load test — read-heavy corridor (docs/19 test G, spec §161).
// Dashboards, patient search, queue board, and worklists — the screens staff
// and regional/national oversight keep open all day. Validates the read path
// under concurrency (scope filters, live aggregates, count queries).
//
// Env: API_BASE, LOGIN_EMAIL / LOGIN_PASSWORD (default admin@demo.gh — the
// national admin exercises the widest scoped reads).

import http from 'k6/http';
import { check, sleep } from 'k6';

const API = __ENV.API_BASE || 'http://localhost:4000/api/v1';
const EMAIL = __ENV.LOGIN_EMAIL || 'admin@demo.gh';
const PASSWORD = __ENV.LOGIN_PASSWORD || 'Demo@123';

const jsonHeaders = { 'Content-Type': 'application/json' };

export const options = {
  scenarios: {
    reads: {
      executor: 'per-vu-iterations',
      vus: 20,
      iterations: 5,
      maxDuration: '3m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1000'],
    'http_req_duration{name:dashboard}': ['p(95)<1200'],
    'http_req_duration{name:search}': ['p(95)<1000'],
    'http_req_duration{name:queue_board}': ['p(95)<1000'],
    'http_req_duration{name:worklist}': ['p(95)<1000'],
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

export default function (data) {
  const auth = bearer(data.token);

  // National dashboard aggregates — the most query-heavy read on the platform.
  const dash = http.get(`${API}/dashboard/stats`, { headers: auth, tags: { name: 'dashboard' } });
  check(dash, { 'dashboard 200': (r) => r.status === 200 && typeof r.json().stats?.patientsToday === 'number' });

  // Patient search — MPI lookup, the screen front desks hammer.
  const search = http.get(`${API}/patients?q=Load&page=1&pageSize=20`, { headers: auth, tags: { name: 'search' } });
  check(search, { 'patient search 200': (r) => r.status === 200 && Array.isArray(r.json('items')) });

  // Queue board.
  const q = http.get(`${API}/queue`, { headers: auth, tags: { name: 'queue_board' } });
  check(q, { 'queue board 200': (r) => r.status === 200 && Array.isArray(r.json('entries')) });

  // Clinical worklists.
  const labs = http.get(`${API}/lab/orders`, { headers: auth, tags: { name: 'worklist' } });
  check(labs, { 'lab worklist 200': (r) => r.status === 200 || r.status === 403 });

  const pharmacy = http.get(`${API}/pharmacy/prescriptions`, { headers: auth, tags: { name: 'worklist' } });
  check(pharmacy, { 'pharmacy worklist 200': (r) => r.status === 200 || r.status === 403 });

  // Inventory snapshot (pharmacy reorder screen).
  const stock = http.get(`${API}/inventory/stock?page=1&pageSize=25`, { headers: auth, tags: { name: 'worklist' } });
  check(stock, { 'stock list 200': (r) => r.status === 200 });

  sleep(0.3 + Math.random());
}
