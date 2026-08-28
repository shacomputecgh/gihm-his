#!/usr/bin/env node

/**
 * Lightweight load test for GIHM-HIS API.
 *
 * Uses Node.js built-in http module — no external dependencies needed.
 * Measures response times, throughput, error rates, and P95/P99 latency.
 *
 * Usage:
 *   node loadtest/load-test.js                    # default: 50 requests, 10 concurrent
 *   node loadtest/load-test.js --rps 20 --dur 30  # 20 req/s for 30 seconds
 *   node loadtest/load-test.js --url http://localhost:4000/api/v1
 *
 * The API must be running on localhost:4000 (or --url).
 */

const http = require('http');
const https = require('https');

// ---- Configuration ----

const args = process.argv.slice(2);
function getArg(name, fallback) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
}

const BASE_URL = getArg('url', 'http://localhost:4000/api/v1');
const TOTAL_REQUESTS = parseInt(getArg('n', '50'), 10);
const CONCURRENCY = parseInt(getArg('c', '10'), 10);
const DURATION_SEC = parseInt(getArg('dur', '0'), 10); // 0 = use --n
const RPS = parseInt(getArg('rps', '0'), 10); // 0 = as fast as possible
const TIMEOUT_MS = parseInt(getArg('timeout', '10000'), 10);

// Endpoints to test (public or with token)
const ENDPOINTS = [
  { path: '/geography/regions', method: 'GET', label: 'Regions' },
  { path: '/geography/districts?regionId=r1', method: 'GET', label: 'Districts' },
  { path: '/facilities?pageSize=5', method: 'GET', label: 'Facilities (page)' },
  { path: '/facilities?page=2&pageSize=5', method: 'GET', label: 'Facilities (page 2)' },
  { path: '/health', method: 'GET', label: 'Health check' },
];

// ---- HTTP client ----

function makeRequest(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method,
      timeout: TIMEOUT_MS,
      headers: { 'Content-Type': 'application/json' },
    };

    const start = process.hrtime.bigint();
    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
        resolve({
          status: res.statusCode,
          durationMs,
          size: Buffer.byteLength(data),
          error: res.statusCode >= 400,
        });
      });
    });

    req.on('error', (err) => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      resolve({ status: 0, durationMs, size: 0, error: true, errorMessage: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      resolve({ status: 0, durationMs, size: 0, error: true, errorMessage: 'timeout' });
    });

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ---- Load test runner ----

async function runLoadTest() {
  console.log(`\n🚀 GIHM-HIS Load Test`);
  console.log(`   Target:     ${BASE_URL}`);
  console.log(`   Requests:   ${DURATION_SEC > 0 ? `${RPS} req/s for ${DURATION_SEC}s` : `${TOTAL_REQUESTS} total`}`);
  console.log(`   Concurrency: ${CONCURRENCY}`);
  console.log(`   Endpoints:  ${ENDPOINTS.length}`);
  console.log('');

  const results = [];
  const startTime = Date.now();
  let requestCount = 0;
  let running = true;

  // Determine total requests
  const maxRequests = DURATION_SEC > 0 ? RPS * DURATION_SEC : TOTAL_REQUESTS;

  async function fireOne() {
    if (!running) return;
    const ep = ENDPOINTS[requestCount % ENDPOINTS.length]!;
    const url = `${BASE_URL}${ep.path}`;
    const result = await makeRequest(url, ep.method);
    results.push({ ...result, endpoint: ep.label });
    requestCount++;
    if (requestCount >= maxRequests) running = false;
  }

  // Rate-limited or as-fast-as-possible
  if (RPS > 0 && DURATION_SEC > 0) {
    // Rate-limited: fire RPS requests per second
    const intervalMs = 1000 / RPS;
    while (running) {
      const batch = [];
      for (let i = 0; i < CONCURRENCY && running; i++) {
        batch.push(fireOne());
      }
      await Promise.all(batch);
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  } else {
    // As fast as possible with concurrency limit
    const queue = Array.from({ length: maxRequests }, (_, i) => i);
    const workers = Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length > 0 && running) {
        await fireOne();
      }
    });
    await Promise.all(workers);
  }

  const elapsed = (Date.now() - startTime) / 1000;

  // ---- Analysis ----

  const durations = results.map((r) => r.durationMs).sort((a, b) => a - b);
  const errors = results.filter((r) => r.error);
  const totalSize = results.reduce((a, b) => a + b.size, 0);

  const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  const p50 = durations[Math.floor(durations.length * 0.5)] ?? 0;
  const p95 = durations[Math.floor(durations.length * 0.95)] ?? 0;
  const p99 = durations[Math.floor(durations.length * 0.99)] ?? 0;
  const min = durations[0] ?? 0;
  const max = durations[durations.length - 1] ?? 0;

  // Status code breakdown
  const statusCounts = {};
  for (const r of results) {
    const key = String(r.status);
    statusCounts[key] = (statusCounts[key] ?? 0) + 1;
  }

  // Per-endpoint stats
  const epStats = {};
  for (const r of results) {
    if (!epStats[r.endpoint]) epStats[r.endpoint] = { count: 0, errors: 0, totalMs: 0, sizes: [] };
    epStats[r.endpoint].count++;
    if (r.error) epStats[r.endpoint].errors++;
    epStats[r.endpoint].totalMs += r.durationMs;
    epStats[r.endpoint].sizes.push(r.size);
  }

  // ---- Output ----

  console.log(`\n📊 Results (${elapsed.toFixed(1)}s)\n`);
  console.log(`   Total requests:  ${results.length}`);
  console.log(`   Throughput:      ${(results.length / elapsed).toFixed(1)} req/s`);
  console.log(`   Total data:      ${(totalSize / 1024).toFixed(1)} KB`);
  console.log(`   Errors:          ${errors.length} (${((errors.length / results.length) * 100).toFixed(1)}%)`);
  console.log('');
  console.log(`   Latency (ms):`);
  console.log(`     Min:    ${min.toFixed(0)}`);
  console.log(`     Avg:    ${avg.toFixed(0)}`);
  console.log(`     P50:    ${p50.toFixed(0)}`);
  console.log(`     P95:    ${p95.toFixed(0)}`);
  console.log(`     P99:    ${p99.toFixed(0)}`);
  console.log(`     Max:    ${max.toFixed(0)}`);
  console.log('');
  console.log(`   Status codes:`);
  for (const [code, count] of Object.entries(statusCounts).sort()) {
    console.log(`     ${code}: ${count}`);
  }
  console.log('');
  console.log(`   Per endpoint:`);
  for (const [name, s] of Object.entries(epStats)) {
    const avgMs = (s.totalMs / s.count).toFixed(0);
    const errPct = ((s.errors / s.count) * 100).toFixed(0);
    console.log(`     ${name}: ${s.count} reqs, avg ${avgMs}ms, ${errPct}% errors`);
  }

  if (errors.length > 0) {
    console.log(`\n   Sample errors:`);
    for (const e of errors.slice(0, 5)) {
      console.log(`     ${e.endpoint}: ${e.status || e.errorMessage} (${e.durationMs.toFixed(0)}ms)`);
    }
  }

  console.log('');

  // Exit with error code if error rate > 50%
  if (errors.length > results.length * 0.5) {
    console.error('❌ Error rate exceeds 50% — API may be down or misconfigured.');
    process.exit(1);
  } else {
    console.log('✅ Load test completed.');
  }
}

runLoadTest().catch((err) => {
  console.error('Load test failed:', err);
  process.exit(1);
});
