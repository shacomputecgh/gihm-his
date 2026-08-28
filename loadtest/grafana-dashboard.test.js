#!/usr/bin/env node

/**
 * Grafana dashboard JSON validation test.
 *
 * Validates the structure, required fields, and panel configuration
 * of the Grafana dashboard template.
 *
 * Usage: node loadtest/grafana-dashboard.test.js
 */

const fs = require('fs');
const path = require('path');

const DASHBOARD_PATH = path.join(__dirname, 'grafana-dashboard.json');
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    console.error(`  ❌ ${message}`);
  }
}

function assertHas(obj, key, message) {
  assert(obj !== null && obj !== undefined && key in obj, message);
}

function assertArray(obj, key, message) {
  assertHas(obj, key, message);
  assert(Array.isArray(obj[key]), `${message} (is array)`);
}

// ---- Load and parse ----

console.log('\n🔍 Grafana Dashboard Validation\n');

let dashboard;
try {
  const raw = fs.readFileSync(DASHBOARD_PATH, 'utf8');
  dashboard = JSON.parse(raw);
  assert(true, 'Dashboard JSON parses successfully');
} catch (err) {
  console.error(`  ❌ Failed to parse dashboard JSON: ${err.message}`);
  process.exit(1);
}

// ---- Top-level structure ----

console.log('\n📋 Top-level structure:');
assertHas(dashboard, 'title', 'Has title');
assert(typeof dashboard.title === 'string' && dashboard.title.length > 0, 'Title is non-empty string');
assertHas(dashboard, 'uid', 'Has uid');
assertHas(dashboard, 'panels', 'Has panels array');
assertArray(dashboard, 'panels', 'Panels is array');
assert(dashboard.panels.length > 0, `Has at least 1 panel (${dashboard.panels.length} found)`);
assertHas(dashboard, 'schemaVersion', 'Has schemaVersion');
assert(typeof dashboard.schemaVersion === 'number', 'schemaVersion is a number');
assertHas(dashboard, 'tags', 'Has tags array');
assert(Array.isArray(dashboard.tags), 'Tags is array');
assert(dashboard.tags.includes('gihm-his'), 'Has gihm-his tag');
assert(dashboard.editable === true, 'Dashboard is editable');
assert(dashboard.refresh === '10s', 'Refresh interval is 10s');

// ---- Inputs (data source) ----

console.log('\n📊 Data source:');
assertHas(dashboard, '__inputs', 'Has __inputs');
assertArray(dashboard, '__inputs', '__inputs is array');
const promInput = dashboard.__inputs.find((i) => i.pluginId === 'prometheus');
assert(!!promInput, 'Has Prometheus data source input');
assert(promInput?.name === 'DS_PROMETHEUS', 'Data source name is DS_PROMETHEUS');

// ---- Panels validation ----

console.log('\n📐 Panels:');

const panelTypes = {};
const rowPanels = dashboard.panels.filter((p) => p.type === 'row');
const dataPanels = dashboard.panels.filter((p) => p.type !== 'row');

assert(rowPanels.length >= 3, `Has at least 3 row sections (${rowPanels.length} found)`);
assert(dataPanels.length >= 5, `Has at least 5 data panels (${dataPanels.length} found)`);

for (const panel of dataPanels) {
  panelTypes[panel.type] = (panelTypes[panel.type] || 0) + 1;

  // Every panel must have a title
  assertHas(panel, 'title', `Panel "${panel.title || '(untitled)'}" has title`);

  // Every panel must have gridPos
  assertHas(panel, 'gridPos', `Panel "${panel.title}" has gridPos`);
  assert(typeof panel.gridPos.h === 'number', `Panel "${panel.title}" gridPos.h is number`);
  assert(typeof panel.gridPos.w === 'number', `Panel "${panel.title}" gridPos.w is number`);
  assert(typeof panel.gridPos.x === 'number', `Panel "${panel.title}" gridPos.x is number`);
  assert(typeof panel.gridPos.y === 'number', `Panel "${panel.title}" gridPos.y is number`);

  // Data panels must have targets
  if (panel.type !== 'row') {
    assertHas(panel, 'targets', `Panel "${panel.title}" has targets`);
    assert(Array.isArray(panel.targets), `Panel "${panel.title}" targets is array`);
    assert(panel.targets.length > 0, `Panel "${panel.title}" has at least 1 target`);
  }
}

console.log(`\n  Panel types found: ${Object.entries(panelTypes).map(([t, c]) => `${t}(${c})`).join(', ')}`);

// ---- Prometheus queries validation ----

console.log('\n🔍 Prometheus queries:');

const allTargets = dataPanels.flatMap((p) => p.targets || []);
const metricNames = new Set();
for (const target of allTargets) {
  if (target.expr) {
    // Extract metric name from expr
    const match = target.expr.match(/^(\w+)/);
    if (match) metricNames.add(match[1]);
  }
}

const requiredMetrics = [
  'gihm_api_requests_total',
  'gihm_api_errors_total',
  'gihm_api_response_duration_ms',
  'gihm_api_response_p95_ms',
  'gihm_api_error_rate',
  'gihm_cache_accesses_total',
  'gihm_cache_hits_total',
  'gihm_cache_misses_total',
  'gihm_cache_hit_rate',
];

for (const metric of requiredMetrics) {
  assert(metricNames.has(metric), `References metric: ${metric}`);
}

// ---- Time config ----

console.log('\n⏰ Time config:');
assertHas(dashboard, 'time', 'Has time config');
assert(dashboard.time.from === 'now-1h', 'Default time range is 1 hour');
assert(dashboard.time.to === 'now', 'Default time range ends at now');

// ---- Results ----

console.log(`\n${'='.repeat(50)}`);
console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.error('\n❌ Validation FAILED');
  process.exit(1);
} else {
  console.log('\n✅ All validations passed!');
  process.exit(0);
}
