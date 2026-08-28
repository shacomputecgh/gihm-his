// Load test — clinical mixed workload (docs/19 test G, spec §161).
// Each VU is a staff session: login once, then repeatedly run the core
// facility workflow — register patient → queue check-in → encounter →
// lab order + verified result → prescription. This is the busiest corridor
// of a large hospital.
//
// Scale with k6 flags:  --vus <n> --duration <t>
//   CHPS: vus 5   | district: vus 20 | regional: vus 50 | national: vus 100
//
// Env: API_BASE (default http://localhost:4000/api/v1),
//      LOGIN_EMAIL / LOGIN_PASSWORD (default admin@demo.gh — the national
//      admin holds every permission the workflow touches), and
//      DEPARTMENT_ID (default: a seeded OPD department of the demo facility
//      registry; run `npm run db:seed` so the id exists).

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

const API = __ENV.API_BASE || 'http://localhost:4000/api/v1';
const EMAIL = __ENV.LOGIN_EMAIL || 'admin@demo.gh';
const PASSWORD = __ENV.LOGIN_PASSWORD || 'Demo@123';
// Seeded Outpatient Department of the demo facility (see loadtest/README).
const DEPARTMENT_ID = __ENV.DEPARTMENT_ID || '8cdba339-c3da-4ad5-a5f6-b93ba7342555';

const jsonHeaders = { 'Content-Type': 'application/json' };
const worklistFailures = new Counter('worklist_5xx');

export const options = {
  scenarios: {
    clinical: {
      executor: 'per-vu-iterations',
      vus: 10,
      iterations: 5,
      maxDuration: '3m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1000'],
    'http_req_duration{name:register}': ['p(95)<1000'],
    'http_req_duration{name:encounter}': ['p(95)<1000'],
    'http_req_duration{name:lab_result}': ['p(95)<1000'],
    'http_req_duration{name:prescribe}': ['p(95)<1000'],
    worklist_5xx: ['count==0'],
  },
};

// Per-VU auth: log in once, keep the token for all iterations.
export function setup() {
  const res = http.post(`${API}/auth/login`, JSON.stringify({ email: EMAIL, password: PASSWORD }), { headers: jsonHeaders });
  check(res, { 'setup login 200': (r) => r.status === 200 });
  const token = res.json().token;
  // Resolve a real department for the queue check-in. Seeded UUIDs change on
  // every db:seed, so the id is discovered at runtime from the structure tree
  // (any department satisfies the queue's existence check).
  let departmentId = DEPARTMENT_ID;
  const units = http.get(`${API}/admin/masterdata/units`, { headers: { Authorization: `Bearer ${token}` } });
  if (units.status === 200) {
    const tree = units.json().facilities;
    if (Array.isArray(tree)) {
      const dept = tree
        .flatMap((f) => f.departments ?? [])
        .map((d) => d.department)
        .find((d) => d && d.id);
      if (dept) departmentId = dept.id;
    }
  }
  return { token, departmentId };
}

function bearer(token) {
  return { Authorization: `Bearer ${token}` };
}

function rand(base) {
  return base + Math.floor(Math.random() * 1000000);
}

// Uniqueness by construction: VU id + iteration number + random suffix make
// name+DOB collisions impossible, so the MPI gate never false-flags a load
// patient against another load patient (name alone scores 50 < threshold 80).
function uniqueName(prefix) {
  return `${prefix} ${__VU}-${__ITER}-${rand(0)}`;
}

export default function (data) {
  const headers = Object.assign({ 'Content-Type': 'application/json' }, bearer(data.token));

  // 1. Register a patient (MPI check included). 409 = flagged duplicate —
  // counted as a functional pass (the MPI gate fired as designed), not an error.
  const fullName = uniqueName('Load Patient');
  const reg = http.post(
    `${API}/patients`,
    JSON.stringify({
      fullName,
      dateOfBirth: `${1960 + Math.floor(Math.random() * 45)}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`,
      sex: Math.random() > 0.5 ? 'MALE' : 'FEMALE',
      phone: `050${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
      consentAccepted: true,
    }),
    { headers, tags: { name: 'register' } },
  );
  check(reg, { 'register 200/409 (MPI gate)': (r) => r.status === 200 || r.status === 409 });
  if (reg.status === 200) {
    const patientId = reg.json().patient && reg.json().patient.id;
    check(patientId, { 'register returns patient id': (id) => typeof id === 'string' && id.length > 0 });

    // 2. Queue check-in (auto ticket).
    const q = http.post(
      `${API}/queue`,
      JSON.stringify({ patientId, departmentId: data.departmentId }),
      { headers, tags: { name: 'queue' } },
    );
    check(q, { 'queue check-in 200 + ticket': (r) => r.status === 200 && !!r.json().entry.ticket });

    // 3. Open the OPD encounter.
    const enc = http.post(
      `${API}/patients/${patientId}/encounters`,
      JSON.stringify({
        type: 'OPD',
        presentingComplaint: 'Routine load-test consultation',
        temperature: 36.8,
        pulse: 78,
        respiratoryRate: 16,
        systolicBp: 120,
        diastolicBp: 80,
        spo2: 98,
        weightKg: 65,
        heightCm: 170,
        painScore: 2,
        triageCategory: 'NON_URGENT',
      }),
      { headers, tags: { name: 'encounter' } },
    );
    check(enc, { 'encounter 200': (r) => r.status === 200 });
    if (enc.status === 200) {
      const encounterId = enc.json().encounter && enc.json().encounter.id;

      // 4. Order a lab test.
      const lab = http.post(
        `${API}/patients/${patientId}/lab-orders`,
        JSON.stringify({ encounterId, test: 'Full Blood Count', discipline: 'HEMATOLOGY', sampleType: 'BLOOD' }),
        { headers, tags: { name: 'lab_order' } },
      );
      check(lab, { 'lab order 200': (r) => r.status === 200 });
      if (lab.status === 200) {
        const orderId = lab.json().order && lab.json().order.id;

        // 5. Enter + verify the result (worklist completion path).
        const result = http.post(
          `${API}/patients/${patientId}/lab-orders/${orderId}/result`,
          JSON.stringify({ result: 'Hb 12.4 g/dL — within range', critical: false }),
          { headers, tags: { name: 'lab_result' } },
        );
        check(result, { 'lab result verified 200': (r) => r.status === 200 });
      }

      // 6. Prescribe.
      const rx = http.post(
        `${API}/patients/${patientId}/prescriptions`,
        JSON.stringify({ encounterId, medicine: 'Paracetamol 500mg', dosage: '1 tab TDS', frequency: '3 times daily', duration: '5 days', quantity: 15, route: 'ORAL' }),
        { headers, tags: { name: 'prescribe' } },
      );
      check(rx, { 'prescription 200': (r) => r.status === 200 });
    }

    // 7. Read the lab worklist (staff checking pending orders).
    const wl = http.get(`${API}/lab/orders`, { headers: bearer(data.token) });
    if (wl.status >= 500) worklistFailures.add(1);
  }

  // Realistic pacing between patients.
  sleep(0.5 + Math.random() * 1.5);
}
