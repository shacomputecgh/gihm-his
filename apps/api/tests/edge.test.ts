import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { db, makeUser, makeFacility } from './helpers.js';
import { buildApp } from '../src/app.js';
import { config } from '../src/config.js';
import { relayOnce, type EdgeRelayConfig } from '../src/modules/edge/relay.js';

// ---------------------------------------------------------------------------
// Facility edge relay (docs/16 §2): the edge bubbles its local PROCESSED
// mutation log up to a national/regional platform through the SAME shared
// /sync/mutations protocol the PWA uses. These tests point the relay at a fake
// national platform and verify batching, the persisted cursor, 401 re-login,
// and the FAILED handling on both sides of the wire — plus REAL middle tiers
// proving the multi-hop chain (docs/16 §4) delivers each transaction exactly
// once: a district serving TWO facility edges (docs/16 §1), and the full
// Facility → District → Region → National path.
// ---------------------------------------------------------------------------

interface RecordedBatch {
  deviceId: string;
  platform: string;
  mutations: { transactionId: string; entityType: string; operation: string; idempotencyKey?: string; clientTimestamp: string; payload: Record<string, unknown> }[];
}

let server: ReturnType<typeof createServer>;
let baseUrl = '';
let batches: RecordedBatch[] = [];
let loginCount = 0;
let pushCount = 0;
/** The specific mutation push (1-based) that should return 401, or -1 for none. */
let failPushAt = -1;
/** transactionIds the fake platform rejects as FAILED. */
const rejectedTxns = new Set<string>();
/** When set, the fake platform itself is unreachable (network failure). */
let networkDown = false;

const tmpDir = mkdtempSync(join(tmpdir(), 'gihm-edge-relay-'));
const stateFile = join(tmpDir, 'relay-state.json');

function makeConfig(overrides: Partial<EdgeRelayConfig> = {}): EdgeRelayConfig {
  return {
    url: baseUrl,
    username: 'edge@demo.gh',
    password: 'Demo@123',
    deviceId: 'edge-test-01',
    intervalMs: 60_000,
    stateFile,
    batchSize: 100,
    ...overrides,
  };
}

// Monotonic clock: the relay's cursor is createdAt-based, so rows must be
// strictly increasing in createdAt for the cursor tests to be deterministic.
let clock = Date.now();

async function insertMutation(
  partial: {
    transactionId: string;
    entityType?: string;
    operation?: string;
    payload?: Record<string, unknown>;
    status?: string;
    facilityId?: string;
  },
  targetDb: PrismaClient = db,
) {
  const at = new Date((clock += 1));
  return targetDb.mutationLog.create({
    data: {
      transactionId: partial.transactionId,
      entityType: partial.entityType ?? 'patient',
      operation: partial.operation ?? 'CREATE',
      payload: JSON.stringify(partial.payload ?? { fullName: `Edge Relay Patient ${partial.transactionId} (synthetic)` }),
      clientTimestamp: at,
      status: partial.status ?? 'PROCESSED',
      createdAt: at,
      facilityId: partial.facilityId,
    },
  });
}

// ---------------------------------------------------------------------------
// Platform-tier helpers: a REAL platform instance (district OR region) backed
// by its OWN database — a real deployment keeps a separate DB from the tiers
// below it, and the shared test DB would make a middle tier's idempotency
// check see the downstream rows (same table) and never apply them. So each
// middle tier gets a dedicated SQLite file, schema-pushed on the spot, plus
// its sync account (must hold sync_data) and the enrolled devices the tiers
// below push as.
// ---------------------------------------------------------------------------

interface PlatformTier {
  db: PrismaClient;
  baseUrl: string;
  userEmail: string;
  cleanup: () => Promise<void>;
}

async function startPlatformTier(devices: { deviceId: string; platform: string }[]): Promise<PlatformTier> {
  const apiRoot = dirname(fileURLToPath(import.meta.url)) + '/..';
  const dbPath = join(tmpDir, `district-${Math.random().toString(36).slice(2, 10)}.db`);
  execSync('npx prisma db push --skip-generate', { cwd: apiRoot, env: { ...process.env, DATABASE_URL: `file:${dbPath}` }, stdio: 'pipe' });
  const districtDb = new PrismaClient({ datasources: { db: { url: `file:${dbPath}` } } });
  const districtApp = await buildApp({ db: districtDb, logger: false });
  await districtApp.listen({ port: 0, host: '127.0.0.1' });
  const districtAddr = districtApp.server.address() as AddressInfo;
  const role = await districtDb.role.create({ data: { code: `TST-HOP-${Math.random().toString(36).slice(2, 10)}`, name: 'District sync', scope: 'FACILITY', permissions: JSON.stringify(['sync_data']) } });
  const user = await districtDb.user.create({ data: { email: `district-hop-${Math.random().toString(36).slice(2, 8)}@demo.gh`, passwordHash: await bcrypt.hash('Demo@123', 4), fullName: 'District Sync', roleId: role.id, status: 'ACTIVE', isSynthetic: true } });
  for (const d of devices) {
    await districtDb.device.create({ data: { deviceId: d.deviceId, name: `Facility edge (${d.deviceId})`, platform: d.platform, status: 'ACTIVE' } });
  }
  return {
    db: districtDb,
    baseUrl: `http://127.0.0.1:${districtAddr.port}`,
    userEmail: user.email,
    cleanup: async () => {
      await districtDb.device.deleteMany({ where: { deviceId: { in: devices.map((d) => d.deviceId) } } });
      await districtDb.patient.deleteMany({ where: { fullName: { startsWith: 'Hop Patient ' } } });
      await districtDb.user.deleteMany({ where: { id: user.id } });
      await districtDb.role.deleteMany({ where: { id: role.id } });
      await districtDb.$disconnect();
      await districtApp.close();
      rmSync(dbPath, { force: true });
      rmSync(`${dbPath}-journal`, { force: true });
      rmSync(`${dbPath}-wal`, { force: true });
      rmSync(`${dbPath}-shm`, { force: true });
    },
  };
}

interface FacilityDb {
  db: PrismaClient;
  cleanup: () => Promise<void>;
}

async function startFacilityDb(): Promise<FacilityDb> {
  const apiRoot = dirname(fileURLToPath(import.meta.url)) + '/..';
  const dbPath = join(tmpDir, `facility-${Math.random().toString(36).slice(2, 10)}.db`);
  execSync('npx prisma db push --skip-generate', { cwd: apiRoot, env: { ...process.env, DATABASE_URL: `file:${dbPath}` }, stdio: 'pipe' });
  const facilityDb = new PrismaClient({ datasources: { db: { url: `file:${dbPath}` } } });
  return {
    db: facilityDb,
    cleanup: async () => {
      await facilityDb.$disconnect();
      rmSync(dbPath, { force: true });
      rmSync(`${dbPath}-journal`, { force: true });
      rmSync(`${dbPath}-wal`, { force: true });
      rmSync(`${dbPath}-shm`, { force: true });
    },
  };
}

beforeAll(async () => {
  // The relay scans the WHOLE local PROCESSED mutation log, and the test DB is
  // shared with other files in the same run — start from a clean slate so this
  // file only ever relays rows it created itself.
  await db.mutationLog.deleteMany();
  server = createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => {
      body += String(chunk);
    });
    req.on('end', () => {
      const url = req.url ?? '';
      const json = (code: number, data: unknown) => {
        res.writeHead(code, { 'content-type': 'application/json' });
        res.end(JSON.stringify(data));
      };
      if (url.endsWith('/api/v1/auth/login')) {
        loginCount++;
        return json(200, { token: 'national-token' });
      }
      if (url.endsWith('/api/v1/sync/mutations')) {
        pushCount++;
        if (networkDown) return json(503, { error: 'upstream unreachable' });
        if (pushCount === failPushAt) return json(401, { error: 'stale session' });
        const parsed = JSON.parse(body) as RecordedBatch;
        batches.push(parsed);
        const results = (parsed.mutations ?? []).map((m) => ({
          transactionId: m.transactionId,
          status: rejectedTxns.has(m.transactionId) ? 'FAILED' : 'PROCESSED',
          ...(rejectedTxns.has(m.transactionId) ? { error: 'rejected by upstream' } : {}),
        }));
        return json(200, { processed: results.filter((r) => r.status === 'PROCESSED').length, failed: results.filter((r) => r.status === 'FAILED').length, results });
      }
      return json(404, { error: 'not found' });
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  // Leave the shared test DB tidy for files that run after this one.
  await db.mutationLog.deleteMany();
  rmSync(tmpDir, { recursive: true, force: true });
  await db.$disconnect();
});

describe('facility edge relay', () => {
  it('relays local PROCESSED mutations to the national platform with the shared protocol', async () => {
    await insertMutation({ transactionId: 'edge-test-relay-1', payload: { fullName: 'Relay Patient One (synthetic)', phone: '0555000001' } });
    await insertMutation({ transactionId: 'edge-test-relay-2', entityType: 'encounter', payload: { patientId: 'p-1', presentingComplaint: 'Routine review' } });

    const result = await relayOnce(db, makeConfig(), { info: () => {}, warn: () => {}, error: () => {} });
    expect(result.pushed).toBe(2);
    expect(result.failed).toBe(0);

    expect(batches).toHaveLength(1);
    const batch = batches[0]!;
    expect(batch.deviceId).toBe('edge-test-01');
    expect(batch.platform).toBe('EDGE');
    expect(batch.mutations.map((m) => m.transactionId)).toEqual(['edge-test-relay-1', 'edge-test-relay-2']);
    // Client timestamps + payloads survive the relay untouched (docs/15 §3).
    const first = batch.mutations[0]!;
    expect(first.clientTimestamp).toBeTruthy();
    expect(first.payload).toMatchObject({ fullName: 'Relay Patient One (synthetic)', phone: '0555000001' });
  });

  it('never loses rows that share a millisecond with already-relayed rows', async () => {
    // MutationLog.createdAt has ms precision — a concurrent batch can land in
    // the SAME millisecond as the previous pass. A time cursor would skip it;
    // the transactionId window must not.
    const at = new Date();
    const mk = (transactionId: string) =>
      db.mutationLog.create({ data: { transactionId, entityType: 'patient', operation: 'CREATE', payload: '{}', clientTimestamp: at, status: 'PROCESSED', createdAt: at } });
    await mk('edge-test-samems-1');
    await mk('edge-test-samems-2');
    const first = await relayOnce(db, makeConfig(), { info: () => {}, warn: () => {}, error: () => {} });
    expect(first.pushed).toBe(2);

    // A third row lands at the SAME timestamp after the pass — it must relay.
    await mk('edge-test-samems-3');
    const second = await relayOnce(db, makeConfig(), { info: () => {}, warn: () => {}, error: () => {} });
    expect(second.pushed).toBe(1);
    expect(batches.at(-1)?.mutations.map((m) => m.transactionId)).toEqual(['edge-test-samems-3']);
  });

  it('advances the persisted cursor so a second pass relays nothing new', async () => {
    const before = batches.length;
    const result = await relayOnce(db, makeConfig(), { info: () => {}, warn: () => {}, error: () => {} });
    expect(result.pushed).toBe(0);
    expect(batches.length).toBe(before); // no new batch sent
  });

  it('re-logs-in and retries when the upstream session is stale (401 on push)', async () => {
    const beforeLogin = loginCount;
    const beforePush = pushCount;
    failPushAt = beforePush + 1;
    await insertMutation({ transactionId: 'edge-test-401-1' });
    const result = await relayOnce(db, makeConfig(), { info: () => {}, warn: () => {}, error: () => {} });
    failPushAt = -1;
    expect(result.pushed).toBe(1);
    expect(pushCount).toBe(beforePush + 2); // first push 401 → re-login → retry
    expect(loginCount).toBe(beforeLogin + 2); // initial login + refreshed login
    expect(batches.at(-1)?.mutations.map((m) => m.transactionId)).toEqual(['edge-test-401-1']);
  });

  it('skips local mutations that never PROCESSED', async () => {
    await insertMutation({ transactionId: 'edge-test-failed-local', status: 'FAILED' });
    const before = batches.length;
    const result = await relayOnce(db, makeConfig(), { info: () => {}, warn: () => {}, error: () => {} });
    expect(result.pushed).toBe(0);
    expect(batches.length).toBe(before);
  });

  it('advances past a mutation the upstream rejects as FAILED (does not wedge the relay)', async () => {
    const badTxn = 'edge-test-upstream-fail';
    await insertMutation({ transactionId: badTxn, entityType: 'unknownThing' });
    await insertMutation({ transactionId: 'edge-test-upstream-ok' });
    rejectedTxns.add(badTxn);

    const first = await relayOnce(db, makeConfig(), { info: () => {}, warn: () => {}, error: () => {} });
    expect(first.pushed).toBe(1);
    expect(first.failed).toBe(1);

    // Cursor advanced past the rejected row: the next pass is a clean no-op.
    const second = await relayOnce(db, makeConfig(), { info: () => {}, warn: () => {}, error: () => {} });
    expect(second.pushed).toBe(0);
    expect(second.failed).toBe(0);
    rejectedTxns.delete(badTxn);
  });

  it('keeps the cursor when the upstream is unreachable (network failure is not data loss)', async () => {
    networkDown = true;
    const txn = 'edge-test-netdown';
    await insertMutation({ transactionId: txn });
    await expect(relayOnce(db, makeConfig(), { info: () => {}, warn: () => {}, error: () => {} })).rejects.toThrow();
    networkDown = false;

    // Upstream is back: the same mutation is relayed — the remote dedupes by
    // transactionId so a partial attempt can never duplicate the record.
    const result = await relayOnce(db, makeConfig(), { info: () => {}, warn: () => {}, error: () => {} });
    expect(result.pushed).toBe(1);
    expect(batches.at(-1)?.mutations.map((m) => m.transactionId)).toContain(txn);
  });

  it('relays facility work through a district tier to the region exactly once (multi-hop, docs/16 §4)', async () => {
    // Clean slate: the facility relay scans the whole PROCESSED log, so this
    // chain test only ever relays its own rows in the shared test DB.
    await db.mutationLog.deleteMany();

    // Middle tier: a REAL district platform instance backed by its OWN database
    // (own SQLite file — see startPlatformTier) with the sync account and the
    // enrolled facility-edge device on the DISTRICT database.
    const district = await startPlatformTier([{ deviceId: 'facility-edge-hop', platform: 'EDGE' }]);
    const silent = { info: () => {}, warn: () => {}, error: () => {} };
    const facilityCfg = makeConfig({ url: district.baseUrl, username: district.userEmail, password: 'Demo@123', deviceId: 'facility-edge-hop', stateFile: join(tmpDir, 'relay-hop-facility.json') });
    const districtCfg = makeConfig({ stateFile: join(tmpDir, 'relay-hop-district.json') }); // district → region (the fake national)

    try {
      await insertMutation({ transactionId: 'edge-hop-1', payload: { fullName: 'Hop Patient One (synthetic)' } });
      await insertMutation({ transactionId: 'edge-hop-2', payload: { fullName: 'Hop Patient Two (synthetic)' } });

      // Hop 1: facility edge → district. The real handler records each inbound
      // transaction in the DISTRICT's PROCESSED log (its own DB — the rows
      // don't exist there yet) and applies the mutations.
      const hop1 = await relayOnce(db, facilityCfg, silent);
      expect(hop1.pushed).toBe(2);
      expect(hop1.failed).toBe(0);
      expect(await district.db.patient.count({ where: { fullName: { startsWith: 'Hop Patient ' } } })).toBe(2);

      // Hop 2: district → region. The district relays the PROCESSED log the
      // real handler recorded from the facility push.
      const regionBefore = batches.length;
      const hop2 = await relayOnce(district.db, districtCfg, silent);
      expect(hop2.pushed).toBe(2);
      const regionBatch = batches.at(-1)!;
      expect(regionBatch.mutations.map((m) => m.transactionId)).toEqual(['edge-hop-1', 'edge-hop-2']);
      // Payloads survive both hops untouched (docs/15 §3).
      expect(regionBatch.mutations[0]!.payload).toMatchObject({ fullName: 'Hop Patient One (synthetic)' });

      // Exactly once: BOTH tiers advanced their cursors — repeat passes send
      // nothing new, so the region never receives a duplicate batch.
      const hop1again = await relayOnce(db, facilityCfg, silent);
      expect(hop1again.pushed).toBe(0);
      const regionBefore2 = batches.length;
      const hop2again = await relayOnce(district.db, districtCfg, silent);
      expect(hop2again.pushed).toBe(0);
      expect(batches.length).toBe(regionBefore2);

      // Middle-tier idempotency: replaying the same batch (fresh cursor, e.g.
      // a lost state file) hits the district's transactionId dedupe — the
      // patient is NOT created twice on the district.
      const replay = await relayOnce(db, makeConfig({ ...facilityCfg, stateFile: join(tmpDir, 'relay-hop-replay.json') }), silent);
      expect(replay.pushed).toBe(2); // re-sent, but the district answers duplicated
      expect(await district.db.patient.count({ where: { fullName: { startsWith: 'Hop Patient ' } } })).toBe(2);
    } finally {
      await district.cleanup();
    }
  });

  it('combines work from TWO facility edges at one district and bubbles it up exactly once (docs/16 §1)', async () => {
    // Two independent facility edges (each with its OWN db — the relay scans
    // the whole PROCESSED log, so sharing a db would make one edge see the
    // other's rows) pushing into ONE district tier. The district applies both
    // facilities' work and relays the combined log up in application order.
    const district = await startPlatformTier([
      { deviceId: 'facility-edge-a', platform: 'EDGE' },
      { deviceId: 'facility-edge-b', platform: 'EDGE' },
    ]);
    const facA = await startFacilityDb();
    const facB = await startFacilityDb();
    const silent = { info: () => {}, warn: () => {}, error: () => {} };
    const edgeCfg = (deviceId: string, tag: string) =>
      makeConfig({ url: district.baseUrl, username: district.userEmail, password: 'Demo@123', deviceId, stateFile: join(tmpDir, `relay-twofac-${tag}.json`) });

    try {
      await insertMutation({ transactionId: 'edge-twofac-a1', payload: { fullName: 'Hop Patient TwoFac A1 (synthetic)' } }, facA.db);
      await insertMutation({ transactionId: 'edge-twofac-a2', payload: { fullName: 'Hop Patient TwoFac A2 (synthetic)' } }, facA.db);
      await insertMutation({ transactionId: 'edge-twofac-b1', payload: { fullName: 'Hop Patient TwoFac B1 (synthetic)' } }, facB.db);

      // Both edges push into the SAME district; the district applies every
      // mutation and records each in its own PROCESSED log.
      const hopA = await relayOnce(facA.db, edgeCfg('facility-edge-a', 'a'), silent);
      expect(hopA.pushed).toBe(2);
      expect(hopA.failed).toBe(0);
      const hopB = await relayOnce(facB.db, edgeCfg('facility-edge-b', 'b'), silent);
      expect(hopB.pushed).toBe(1);
      expect(hopB.failed).toBe(0);
      expect(await district.db.patient.count({ where: { fullName: { startsWith: 'Hop Patient TwoFac ' } } })).toBe(3);

      // The district bubbles the COMBINED log up: both facilities' transactions
      // in one batch, in the order they were applied.
      const regionBefore = batches.length;
      const up = await relayOnce(district.db, makeConfig({ stateFile: join(tmpDir, 'relay-twofac-district.json') }), silent);
      expect(up.pushed).toBe(3);
      const regionBatch = batches.at(-1)!;
      expect(regionBatch.mutations.map((m) => m.transactionId)).toEqual(['edge-twofac-a1', 'edge-twofac-a2', 'edge-twofac-b1']);
      // Payloads from both facilities survive both hops untouched.
      expect(regionBatch.mutations[0]!.payload).toMatchObject({ fullName: 'Hop Patient TwoFac A1 (synthetic)' });
      expect(regionBatch.mutations[2]!.payload).toMatchObject({ fullName: 'Hop Patient TwoFac B1 (synthetic)' });

      // Exactly once at EVERY tier: both edges and the district are drained,
      // so the region never sees a duplicate of either facility's work.
      expect((await relayOnce(facA.db, edgeCfg('facility-edge-a', 'a'), silent)).pushed).toBe(0);
      expect((await relayOnce(facB.db, edgeCfg('facility-edge-b', 'b'), silent)).pushed).toBe(0);
      const regionBefore2 = batches.length;
      expect((await relayOnce(district.db, makeConfig({ stateFile: join(tmpDir, 'relay-twofac-district.json') }), silent)).pushed).toBe(0);
      expect(batches.length).toBe(regionBefore2);
    } finally {
      await district.cleanup();
      await facA.cleanup();
      await facB.cleanup();
    }
  });

  it('relays facility work through REAL district and region tiers to the national platform (docs/16 §4 full chain)', async () => {
    // Clean slate: the facility relay scans the whole PROCESSED log, so this
    // chain test only ever relays its own rows in the shared test DB.
    await db.mutationLog.deleteMany();

    // Two real middle tiers, each an app instance with its own DB: the district
    // enrolls the facility edge; the region enrolls the district's relay. A
    // middle tier is BOTH an upstream (to the tier below) AND a relaying edge
    // (to the tier above) — the shared protocol is the same on both faces.
    const district = await startPlatformTier([{ deviceId: 'facility-edge-chain', platform: 'EDGE' }]);
    const region = await startPlatformTier([{ deviceId: 'district-relay-chain', platform: 'EDGE' }]);
    const silent = { info: () => {}, warn: () => {}, error: () => {} };
    const facilityCfg = makeConfig({ url: district.baseUrl, username: district.userEmail, password: 'Demo@123', deviceId: 'facility-edge-chain', stateFile: join(tmpDir, 'relay-chain-facility.json') });
    const districtCfg = makeConfig({ url: region.baseUrl, username: region.userEmail, password: 'Demo@123', deviceId: 'district-relay-chain', stateFile: join(tmpDir, 'relay-chain-district.json') });
    const regionCfg = makeConfig({ stateFile: join(tmpDir, 'relay-chain-region.json') }); // region → national (the fake)

    try {
      await insertMutation({ transactionId: 'edge-chain-1', payload: { fullName: 'Hop Patient Chain One (synthetic)' } });
      await insertMutation({ transactionId: 'edge-chain-2', payload: { fullName: 'Hop Patient Chain Two (synthetic)' } });

      // Hop 1: facility → district. The real handler applies each inbound
      // transaction and records it in the DISTRICT's PROCESSED log.
      const hop1 = await relayOnce(db, facilityCfg, silent);
      expect(hop1.pushed).toBe(2);
      expect(hop1.failed).toBe(0);
      expect(await district.db.patient.count({ where: { fullName: { startsWith: 'Hop Patient Chain ' } } })).toBe(2);

      // Hop 2: district → region. The district relays the PROCESSED log its
      // real handler recorded; the REGION's real handler applies + records.
      const hop2 = await relayOnce(district.db, districtCfg, silent);
      expect(hop2.pushed).toBe(2);
      expect(hop2.failed).toBe(0);
      expect(await region.db.patient.count({ where: { fullName: { startsWith: 'Hop Patient Chain ' } } })).toBe(2);

      // Hop 3: region → national. The region relays the log ITS handler
      // recorded from the district push.
      const nationalBefore = batches.length;
      const hop3 = await relayOnce(region.db, regionCfg, silent);
      expect(hop3.pushed).toBe(2);
      expect(hop3.failed).toBe(0);
      const nationalBatch = batches.at(-1)!;
      expect(nationalBatch.mutations.map((m) => m.transactionId)).toEqual(['edge-chain-1', 'edge-chain-2']);
      // Payloads survive all three hops untouched (docs/15 §3).
      expect(nationalBatch.mutations[0]!.payload).toMatchObject({ fullName: 'Hop Patient Chain One (synthetic)' });

      // Exactly once at EVERY tier: all three relays are drained, so the
      // national platform never receives a duplicate batch.
      expect((await relayOnce(db, facilityCfg, silent)).pushed).toBe(0);
      expect((await relayOnce(district.db, districtCfg, silent)).pushed).toBe(0);
      const nationalBefore2 = batches.length;
      expect((await relayOnce(region.db, regionCfg, silent)).pushed).toBe(0);
      expect(batches.length).toBe(nationalBefore2);

      // Middle-tier idempotency: replaying the facility batch (fresh cursor,
      // e.g. a lost state file) re-sends it, but the district answers
      // duplicated and its cursor already covers the rows — so nothing new
      // ever reaches the region, and no patient is created twice anywhere.
      const replay = await relayOnce(db, makeConfig({ ...facilityCfg, stateFile: join(tmpDir, 'relay-chain-replay.json') }), silent);
      expect(replay.pushed).toBe(2); // re-sent, district answers duplicated
      expect(await district.db.patient.count({ where: { fullName: { startsWith: 'Hop Patient Chain ' } } })).toBe(2);
      const nationalBefore3 = batches.length;
      expect((await relayOnce(district.db, districtCfg, silent)).pushed).toBe(0);
      expect(batches.length).toBe(nationalBefore3);
    } finally {
      await district.cleanup();
      await region.cleanup();
    }
  });

  it('24h-outage backlog: a full offline day drains in order and exactly once, surviving a crash mid-backlog (docs/19 Tests B/E/F/H)', async () => {
    // A CHPS facility offline for a full day (docs/19 Test F): 60 transactions
    // in the local PROCESSED log — 40 registrations followed by 20 encounters
    // referencing them, in application order. The relay drains it in batches;
    // a crash mid-backlog (Test H) must neither lose nor duplicate anything.
    await db.mutationLog.deleteMany();
    const district = await startPlatformTier([{ deviceId: 'edge-backlog-1', platform: 'EDGE' }]);
    const facility = await startFacilityDb();
    const silent = { info: () => {}, warn: () => {}, error: () => {} };
    const cfg = makeConfig({ url: district.baseUrl, username: district.userEmail, password: 'Demo@123', deviceId: 'edge-backlog-1', stateFile: join(tmpDir, 'backlog-relay.json'), batchSize: 25 });

    try {
      for (let i = 1; i <= 40; i++) {
        await insertMutation({
          transactionId: `bl-${String(i).padStart(3, '0')}`,
          payload: { id: `30000000-0000-4000-8000-0000000000${String(i).padStart(2, '0')}`, fullName: `Backlog Patient ${i} (synthetic)`, dateOfBirth: '1990-01-01', phone: `0555${String(100000 + i)}` },
        }, facility.db);
      }
      for (let i = 1; i <= 20; i++) {
        await insertMutation({
          transactionId: `bl-enc-${String(i).padStart(3, '0')}`,
          entityType: 'encounter',
          payload: { id: `40000000-0000-4000-8000-0000000000${String(i).padStart(2, '0')}`, patientId: `30000000-0000-4000-8000-0000000000${String(i).padStart(2, '0')}`, presentingComplaint: `Offline visit ${i}` },
        }, facility.db);
      }

      // Pass 1 of 3 clean passes (60 rows ÷ batchSize 25).
      const pass1 = await relayOnce(facility.db, cfg, silent);
      expect(pass1.pushed).toBe(25);
      expect(pass1.failed).toBe(0);

      // Crash mid-backlog (docs/19 Test H): the relay applied batch 1 upstream
      // but died before persisting its cursor — the state file on disk is still
      // the pre-batch-1 snapshot (empty window).
      rmSync(cfg.stateFile, { force: true });

      // Restart: batch 1 is re-sent, the district's transactionId dedupe
      // answers duplicated, and the same 25 patients are NOT created twice.
      const pass2 = await relayOnce(facility.db, cfg, silent);
      expect(pass2.pushed).toBe(25); // re-sent (duplicated upstream)
      expect(await district.db.patient.count({ where: { fullName: { startsWith: 'Backlog Patient ' } } })).toBe(25);

      // The rest of the backlog still drains.
      const pass3 = await relayOnce(facility.db, cfg, silent);
      expect(pass3.pushed).toBe(25);
      const pass4 = await relayOnce(facility.db, cfg, silent);
      expect(pass4.pushed).toBe(10);

      // Exactly once despite the crash: every registration applied once, every
      // encounter linked to the patient it was recorded for (no orphans).
      expect(await district.db.patient.count({ where: { fullName: { startsWith: 'Backlog Patient ' } } })).toBe(40);
      expect(await district.db.encounter.count({ where: { presentingComplaint: { startsWith: 'Offline visit ' } } })).toBe(20);
      const patientIds = (await district.db.patient.findMany({ where: { fullName: { startsWith: 'Backlog Patient ' } }, select: { id: true } })).map((p) => p.id);
      expect(await district.db.encounter.count({ where: { patientId: { in: patientIds } } })).toBe(20);

      // Application order preserved end to end: the district's PROCESSED log
      // matches the facility's insertion order (registrations, then visits).
      const order = (await district.db.mutationLog.findMany({ where: { status: 'PROCESSED' }, orderBy: { createdAt: 'asc' }, select: { transactionId: true } })).map((r) => r.transactionId);
      const expected = [
        ...Array.from({ length: 40 }, (_, i) => `bl-${String(i + 1).padStart(3, '0')}`),
        ...Array.from({ length: 20 }, (_, i) => `bl-enc-${String(i + 1).padStart(3, '0')}`),
      ];
      expect(order).toEqual(expected);

      // Drained: a final pass sends nothing new.
      expect((await relayOnce(facility.db, cfg, silent)).pushed).toBe(0);
    } finally {
      await district.cleanup();
      await facility.cleanup();
    }
  });

  it('two-device conflict at the edge tier: the loser is preserved, kept from the relay, and its resolution propagates upstream (docs/19 Test D, docs/15 §4 + docs/16 §4)', async () => {
    // Two facility devices (A and B) sync to the EDGE tier; the edge relays to
    // a real district. Both devices record a result for the SAME lab order
    // offline, based on the order version they last saw. The edge detects the
    // conflict (baseVersion is a same-tier concept — docs/15 §4): A wins,
    // B is preserved as CONFLICT and NEVER relayed. Resolving keep_client
    // adopts B's result at the edge — and must propagate it upstream so the
    // district converges instead of keeping A forever.
    await db.mutationLog.deleteMany();
    const edge = await startPlatformTier([{ deviceId: 'edge-conflict-a', platform: 'PWA' }, { deviceId: 'edge-conflict-b', platform: 'PWA' }]);
    const district = await startPlatformTier([{ deviceId: 'edge-conflict-relay', platform: 'EDGE' }]);
    const edgeApp = await buildApp({ db: edge.db, logger: false });
    const silent = { info: () => {}, warn: () => {}, error: () => {} };
    const relayCfg = makeConfig({ url: district.baseUrl, username: district.userEmail, password: 'Demo@123', deviceId: 'edge-conflict-relay', stateFile: join(tmpDir, 'conflict-relay.json') });

    try {
      // The order exists at the edge (created by its own API before this drill
      // snapshot — the version BOTH devices last saw).
      const patient = await edge.db.patient.create({ data: { id: '50000000-0000-4000-8000-000000000001', mrn: 'CONF-EDGE-001', fullName: 'Edge Conflict Patient (synthetic)', isSynthetic: true } });
      const enc = await edge.db.encounter.create({ data: { id: '50000000-0000-4000-8000-000000000002', patientId: patient.id, type: 'OPD', status: 'OPEN' } });
      const order = await edge.db.labOrder.create({ data: { id: '50000000-0000-4000-8000-000000000003', encounterId: enc.id, patientId: patient.id, test: 'Malaria RDT', discipline: 'MICROBIOLOGY', status: 'ORDERED' } });
      const baseVersion = order.updatedAt.toISOString();

      // The edge's own PROCESSED log for those writes (they were captured when
      // created) — the district must recreate the same ids.
      await insertMutation({ transactionId: 'conf-edge-pat', payload: { id: patient.id, fullName: patient.fullName, phone: '0555006666' } }, edge.db);
      await insertMutation({ transactionId: 'conf-edge-enc', entityType: 'encounter', payload: { id: enc.id, patientId: patient.id, presentingComplaint: 'Edge conflict visit' } }, edge.db);
      await insertMutation({ transactionId: 'conf-edge-ord', entityType: 'labOrder', payload: { id: order.id, encounterId: enc.id, patientId: patient.id, test: 'Malaria RDT', discipline: 'MICROBIOLOGY' } }, edge.db);

      // Hop 1: the creates reach the district with stable ids.
      expect((await relayOnce(edge.db, relayCfg, silent)).pushed).toBe(3);
      expect(await district.db.labOrder.findUnique({ where: { id: order.id } })).toMatchObject({ test: 'Malaria RDT', status: 'ORDERED' });

      // Both devices sync their offline results, based on the SAME version.
      const edgeToken = (await edgeApp.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email: edge.userEmail, password: 'Demo@123' } })).json().token as string;
      const syncAs = (deviceId: string, txn: string, result: string) =>
        edgeApp.inject({
          method: 'POST',
          url: '/api/v1/sync/mutations',
          headers: { authorization: `Bearer ${edgeToken}` },
          payload: { deviceId, mutations: [{ transactionId: txn, entityType: 'labOrder', operation: 'RESULT', baseVersion, clientTimestamp: new Date().toISOString(), payload: { orderId: order.id, result, critical: false } }] },
        });
      const resA = await syncAs('edge-conflict-a', 'conf-edge-res-a', 'NEGATIVE');
      expect(resA.json().results[0].status).toBe('PROCESSED');
      const resB = await syncAs('edge-conflict-b', 'conf-edge-res-b', 'POSITIVE');
      expect(resB.json().results[0].status).toBe('CONFLICT');

      // The edge applied A and preserved B with BOTH versions (spec §166).
      expect((await edge.db.labOrder.findUnique({ where: { id: order.id } }))?.result).toBe('NEGATIVE');
      const conflict = await edge.db.syncConflict.findUnique({ where: { transactionId: 'conf-edge-res-b' } });
      expect(conflict).toBeTruthy();
      expect(JSON.parse(conflict!.serverVersion).result).toBe('NEGATIVE');
      expect(JSON.parse(conflict!.clientVersion).result).toBe('POSITIVE');

      // Hop 2: only the WINNER relays — the CONFLICT row is not PROCESSED, so
      // the losing edit never reaches the district. No last-writer-wins silence.
      expect((await relayOnce(edge.db, relayCfg, silent)).pushed).toBe(1);
      expect((await district.db.labOrder.findUnique({ where: { id: order.id } }))?.result).toBe('NEGATIVE');
      expect(await district.db.syncConflict.count()).toBe(0);
      expect(await district.db.mutationLog.count({ where: { status: 'PROCESSED' } })).toBe(4);

      // The edge administrator reviews: B's result was the correct one.
      const adminRole = await edge.db.role.create({ data: { code: `TST-CONF-${Math.random().toString(36).slice(2, 10)}`, name: 'Edge conflict admin', scope: 'FACILITY', permissions: JSON.stringify(['manage_sync_conflicts']) } });
      const adminUser = await edge.db.user.create({ data: { email: `edge-conf-admin-${Math.random().toString(36).slice(2, 8)}@demo.gh`, passwordHash: await bcrypt.hash('Demo@123', 4), fullName: 'Edge Conflict Admin', roleId: adminRole.id, status: 'ACTIVE', isSynthetic: true } });
      const adminToken = (await edgeApp.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email: adminUser.email, password: 'Demo@123' } })).json().token as string;
      const resolve = await edgeApp.inject({
        method: 'POST',
        url: `/api/v1/admin/sync/conflicts/${conflict!.id}/resolve`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { action: 'keep_client' },
      });
      expect(resolve.statusCode).toBe(200);
      expect((await edge.db.labOrder.findUnique({ where: { id: order.id } }))?.result).toBe('POSITIVE');

      // Hop 3: the resolved outcome propagates — the corrected result reaches
      // the district and the tiers converge (docs/16 §4 exactly-once chain).
      expect((await relayOnce(edge.db, relayCfg, silent)).pushed).toBe(1);
      expect((await district.db.labOrder.findUnique({ where: { id: order.id } }))?.result).toBe('POSITIVE');
      expect(await district.db.patient.count({ where: { fullName: 'Edge Conflict Patient (synthetic)' } })).toBe(1);
      expect((await relayOnce(edge.db, relayCfg, silent)).pushed).toBe(0);
    } finally {
      await edgeApp.close();
      await edge.cleanup();
      await district.cleanup();
    }
  });

  it('national-outage drill: the facility keeps running while the national platform is unreachable, then drains exactly once (docs/19 Test J)', async () => {
    // The national platform is down. The facility edge keeps accepting work
    // (its own API + capture to the local PROCESSED log); the relay fails
    // unreachable and keeps its cursor; when the national returns, the whole
    // backlog drains with the SAME entity ids — nothing lost, nothing doubled.
    const district = await startPlatformTier([{ deviceId: 'edge-outage-1', platform: 'EDGE' }]);
    const facility = await startFacilityDb();
    const savedUrl = config.edgeRelay.url;
    config.edgeRelay.url = 'http://edge-capture.invalid'; // edge deployment — capture on
    const edgeApp = await buildApp({ db: facility.db, logger: false });
    config.edgeRelay.url = savedUrl;
    const silent = { info: () => {}, warn: () => {}, error: () => {} };
    const staffRole = await facility.db.role.create({ data: { code: `TST-OUT-${Math.random().toString(36).slice(2, 10)}`, name: 'Outage staff', scope: 'FACILITY', permissions: JSON.stringify(['create_patient', 'view_patient']) } });
    const staff = await facility.db.user.create({ data: { email: `outage-staff-${Math.random().toString(36).slice(2, 8)}@demo.gh`, passwordHash: await bcrypt.hash('Demo@123', 4), fullName: 'Outage Staff', roleId: staffRole.id, status: 'ACTIVE', isSynthetic: true } });
    const authH = { authorization: `Bearer ${(await edgeApp.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email: staff.email, password: 'Demo@123' } })).json().token as string}` };
    // The relay points at a dead port for the outage window.
    const outageCfg = makeConfig({ url: 'http://127.0.0.1:1', username: district.userEmail, password: 'Demo@123', deviceId: 'edge-outage-1', stateFile: join(tmpDir, 'outage-relay.json') });

    try {
      // During the outage the facility keeps working: three registrations.
      const ids: string[] = [];
      for (let i = 1; i <= 3; i++) {
        const res = await edgeApp.inject({ method: 'POST', url: '/api/v1/patients', headers: authH, payload: { fullName: `Outage Patient ${i} (synthetic)`, force: true } });
        expect(res.statusCode).toBe(200);
        ids.push(res.json().patient.id as string);
      }
      // Every relay attempt fails unreachable — the cursor is untouched.
      await expect(relayOnce(facility.db, outageCfg, silent)).rejects.toThrow();

      // The outage continues: two more registrations (five total).
      for (let i = 4; i <= 5; i++) {
        const res = await edgeApp.inject({ method: 'POST', url: '/api/v1/patients', headers: authH, payload: { fullName: `Outage Patient ${i} (synthetic)`, force: true } });
        expect(res.statusCode).toBe(200);
        ids.push(res.json().patient.id as string);
      }
      expect(await facility.db.mutationLog.count({ where: { status: 'PROCESSED' } })).toBe(5);

      // The national platform returns: the full backlog drains in one pass.
      const goodCfg = makeConfig({ ...outageCfg, url: district.baseUrl });
      const drain = await relayOnce(facility.db, goodCfg, silent);
      expect(drain.pushed).toBe(5);
      expect(drain.failed).toBe(0);
      // Every registration arrived with its identity — nothing lost to the outage.
      expect(await district.db.patient.count({ where: { fullName: { startsWith: 'Outage Patient ' } } })).toBe(5);
      const districtIds = (await district.db.patient.findMany({ where: { fullName: { startsWith: 'Outage Patient ' } }, select: { id: true } })).map((p) => p.id);
      expect(districtIds.sort()).toEqual(ids.sort());
      // Exactly once: a repeat pass sends nothing new.
      expect((await relayOnce(facility.db, goodCfg, silent)).pushed).toBe(0);
    } finally {
      await edgeApp.close();
      await facility.cleanup();
      await district.cleanup();
    }
  });

  it('captures direct online writes at the edge and relays them up with stable ids (docs/16 §5)', async () => {
    await db.mutationLog.deleteMany();
    const savedUrl = config.edgeRelay.url;
    // buildApp gates entity capture on EDGE_RELAY_URL — any truthy value turns
    // it on for the app built below (the relay loop itself only runs in
    // server.ts, so this never starts a real polling job in tests).
    config.edgeRelay.url = 'http://edge-capture.invalid';

    const edgeApp = await buildApp({ db, logger: false });
    const facility = await makeFacility('Capture Edge Facility (synthetic)');
    const staff = await makeUser({ email: `capture-staff-${Math.random().toString(36).slice(2, 8)}@demo.gh`, roleCode: 'HOSPITAL_ADMIN', facilityId: facility.id });
    const district = await startPlatformTier([{ deviceId: 'edge-direct-1', platform: 'EDGE' }]);
    const silent = { info: () => {}, warn: () => {}, error: () => {} };
    const edgeCfg = makeConfig({ url: district.baseUrl, username: district.userEmail, password: 'Demo@123', deviceId: 'edge-direct-1', stateFile: join(tmpDir, 'capture-edge.json') });

    try {
      // Direct online write #1: register a patient straight at the edge API.
      const patRes = await edgeApp.inject({
        method: 'POST',
        url: '/api/v1/patients',
        headers: { authorization: `Bearer ${staff.token}` },
        payload: { fullName: 'Capture Patient One (synthetic)', dateOfBirth: '2020-03-01', phone: '0555000099', force: true },
      });
      expect(patRes.statusCode).toBe(200);
      const patientId = patRes.json().patient.id as string;

      // The write lands in the shared mutation log as a `direct:` transaction,
      // stamped with the edge facility it was written at (docs/16 §1).
      const patLog = await db.mutationLog.findFirst({ where: { transactionId: { startsWith: 'direct:patient:CREATE:' }, entityId: patientId } });
      expect(patLog).toBeTruthy();
      expect(patLog?.status).toBe('PROCESSED');
      expect(patLog?.facilityId).toBe(facility.id);
      expect(JSON.parse(patLog!.payload)).toMatchObject({ id: patientId, fullName: 'Capture Patient One (synthetic)' });

      // Direct online write #2: open an encounter referencing the SAME edge id.
      const encRes = await edgeApp.inject({
        method: 'POST',
        url: `/api/v1/patients/${patientId}/encounters`,
        headers: { authorization: `Bearer ${staff.token}` },
        payload: { presentingComplaint: 'Direct online visit', type: 'OPD' },
      });
      expect(encRes.statusCode).toBe(200);
      const encounterId = encRes.json().encounter.id as string;
      const encLog = await db.mutationLog.findFirst({ where: { transactionId: { startsWith: 'direct:encounter:CREATE:' }, entityId: encounterId } });
      expect(encLog).toBeTruthy();
      expect(JSON.parse(encLog!.payload)).toMatchObject({ id: encounterId, patientId });

      // Hop: edge → district. Both captured writes relay through the shared
      // protocol, and the district applies them with the SAME entity ids — the
      // encounter's patientId resolves on the district, proving references
      // survive the hop.
      const hop = await relayOnce(db, edgeCfg, silent);
      expect(hop.pushed).toBe(2);
      expect(hop.failed).toBe(0);
      expect(await district.db.patient.findUnique({ where: { id: patientId } })).toMatchObject({ fullName: 'Capture Patient One (synthetic)' });
      expect(await district.db.encounter.findUnique({ where: { id: encounterId } })).toMatchObject({ patientId });

      // The district recorded exactly the two relayed transactions — its apply
      // path ran WITHOUT capture (no double `direct:` rows for the same writes).
      expect(await district.db.mutationLog.count()).toBe(2);
      const districtTxns = (await district.db.mutationLog.findMany({ select: { transactionId: true } })).map((r) => r.transactionId).sort();
      expect(districtTxns).toEqual([patLog!.transactionId, encLog!.transactionId].sort());

      // Hop 2: district → national. The district relays the SAME `direct:`
      // transactions it recorded while applying — the national platform sees
      // exactly the two captured writes, references intact.
      const districtCfg = makeConfig({ stateFile: join(tmpDir, 'capture-district.json') });
      const hop2 = await relayOnce(district.db, districtCfg, silent);
      expect(hop2.pushed).toBe(2);
      expect(hop2.failed).toBe(0);
      const nationalBatch = batches.at(-1)!;
      expect(nationalBatch.mutations.map((m) => m.transactionId).sort()).toEqual([patLog!.transactionId, encLog!.transactionId].sort());
      expect(nationalBatch.mutations.find((m) => m.entityType === 'encounter')!.payload).toMatchObject({ patientId });

      // Exactly once at EVERY tier: repeat passes send nothing new.
      expect((await relayOnce(db, edgeCfg, silent)).pushed).toBe(0);
      const nationalBefore = batches.length;
      expect((await relayOnce(district.db, districtCfg, silent)).pushed).toBe(0);
      expect(batches.length).toBe(nationalBefore);
    } finally {
      config.edgeRelay.url = savedUrl;
      await edgeApp.close();
      await district.cleanup();
      // Leave the shared test DB tidy: remove the patients this test wrote
      // through the edge app (encounters first — FK order).
      const patients = await db.patient.findMany({ where: { fullName: { startsWith: 'Capture Patient ' } }, select: { id: true } });
      await db.encounter.deleteMany({ where: { patientId: { in: patients.map((p) => p.id) } } });
      await db.patient.deleteMany({ where: { id: { in: patients.map((p) => p.id) } } });
    }
  });

  it('a district edge runs per-facility relays, each pushing only its own work (docs/16 §1)', async () => {
    await db.mutationLog.deleteMany();
    const district = await startPlatformTier([{ deviceId: 'edge-scope-a', platform: 'EDGE' }, { deviceId: 'edge-scope-b', platform: 'EDGE' }]);
    const silent = { info: () => {}, warn: () => {}, error: () => {} };
    // Two facilities' work sits in the district edge's log, stamped per
    // facility by the row column (payloads stay facility-free — the district
    // re-derives its own scoping when applying).
    const facA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const facB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

    try {
      await insertMutation({ transactionId: 'scope-a-1', facilityId: facA, payload: { fullName: 'Scope Facility A Patient (synthetic)' } });
      await insertMutation({ transactionId: 'scope-b-1', facilityId: facB, payload: { fullName: 'Scope Facility B Patient (synthetic)' } });

      // Relay A → district: only facility A's row goes up; B's stays in the log.
      const relayA = makeConfig({ url: district.baseUrl, username: district.userEmail, password: 'Demo@123', deviceId: 'edge-scope-a', facilityId: facA, stateFile: join(tmpDir, 'scope-a.json') });
      const hopA = await relayOnce(db, relayA, silent);
      expect(hopA.pushed).toBe(1);
      expect(await district.db.patient.count({ where: { fullName: { startsWith: 'Scope Facility A Patient ' } } })).toBe(1);
      expect(await district.db.patient.count({ where: { fullName: { startsWith: 'Scope Facility B Patient ' } } })).toBe(0);

      // Relay B → district: B's row now goes up too; A is not re-pushed.
      const relayB = makeConfig({ url: district.baseUrl, username: district.userEmail, password: 'Demo@123', deviceId: 'edge-scope-b', facilityId: facB, stateFile: join(tmpDir, 'scope-b.json') });
      const hopB = await relayOnce(db, relayB, silent);
      expect(hopB.pushed).toBe(1);
      expect(await district.db.patient.count({ where: { fullName: { startsWith: 'Scope Facility B Patient ' } } })).toBe(1);

      // Exactly once per facility: repeat passes send nothing new.
      expect((await relayOnce(db, relayA, silent)).pushed).toBe(0);
      expect((await relayOnce(db, relayB, silent)).pushed).toBe(0);
    } finally {
      await district.cleanup();
    }
  });

  it('captures lab orders AND their results at the edge, relayed with stable ids (docs/16 §5)', async () => {
    await db.mutationLog.deleteMany();
    const savedUrl = config.edgeRelay.url;
    config.edgeRelay.url = 'http://edge-capture.invalid';

    const edgeApp = await buildApp({ db, logger: false });
    const facility = await makeFacility('Capture Lab Facility (synthetic)');
    // Default permission set includes order_lab + verify_lab.
    const staff = await makeUser({ email: `capture-lab-${Math.random().toString(36).slice(2, 8)}@demo.gh`, roleCode: 'HOSPITAL_ADMIN', facilityId: facility.id });
    const district = await startPlatformTier([{ deviceId: 'edge-lab-1', platform: 'EDGE' }]);
    const silent = { info: () => {}, warn: () => {}, error: () => {} };
    const edgeCfg = makeConfig({ url: district.baseUrl, username: district.userEmail, password: 'Demo@123', deviceId: 'edge-lab-1', stateFile: join(tmpDir, 'capture-lab-edge.json') });
    const authH = { authorization: `Bearer ${staff.token}` };

    try {
      // Patient + encounter at the edge (stable ids, as in the capture test).
      const pat = await edgeApp.inject({ method: 'POST', url: '/api/v1/patients', headers: authH, payload: { fullName: 'Capture Lab Patient (synthetic)', force: true } });
      const patientId = pat.json().patient.id as string;
      const enc = await edgeApp.inject({ method: 'POST', url: `/api/v1/patients/${patientId}/encounters`, headers: authH, payload: { presentingComplaint: 'Lab visit' } });
      const encounterId = enc.json().encounter.id as string;

      // Lab order — captured as a `direct:labOrder:CREATE:` transaction.
      const ord = await edgeApp.inject({ method: 'POST', url: `/api/v1/patients/${patientId}/lab-orders`, headers: authH, payload: { encounterId, test: 'Malaria RDT', discipline: 'MICROBIOLOGY' } });
      expect(ord.statusCode).toBe(200);
      const orderId = ord.json().order.id as string;
      const createLog = await db.mutationLog.findFirst({ where: { transactionId: { startsWith: 'direct:labOrder:CREATE:' }, entityId: orderId } });
      expect(createLog).toBeTruthy();
      expect(JSON.parse(createLog!.payload)).toMatchObject({ id: orderId, patientId, encounterId, test: 'Malaria RDT' });

      // Result entry — the ONE direct UPDATE the protocol carries, captured as
      // `direct:labOrder:RESULT:` with the order referenced by stable id.
      const res = await edgeApp.inject({ method: 'POST', url: `/api/v1/patients/${patientId}/lab-orders/${orderId}/result`, headers: authH, payload: { result: 'POSITIVE', critical: false } });
      expect(res.statusCode).toBe(200);
      const resultLog = await db.mutationLog.findFirst({ where: { transactionId: { startsWith: 'direct:labOrder:RESULT:' }, entityId: orderId } });
      expect(resultLog).toBeTruthy();
      expect(JSON.parse(resultLog!.payload)).toEqual({ orderId, result: 'POSITIVE', critical: false, referenceRange: undefined });

      // Relay edge → district: the real handler applies order + result on the
      // SAME order id, and the order ends up VERIFIED with the result intact.
      const hop = await relayOnce(db, edgeCfg, silent);
      expect(hop.pushed).toBe(4);
      expect(hop.failed).toBe(0);
      const applied = await district.db.labOrder.findUnique({ where: { id: orderId } });
      expect(applied).toMatchObject({ patientId, test: 'Malaria RDT', result: 'POSITIVE', status: 'VERIFIED' });
      // No double capture on the apply path: exactly the four relayed rows.
      expect(await district.db.mutationLog.count()).toBe(4);

      // Exactly once: repeat passes send nothing new.
      expect((await relayOnce(db, edgeCfg, silent)).pushed).toBe(0);
    } finally {
      config.edgeRelay.url = savedUrl;
      await edgeApp.close();
      await district.cleanup();
      const patients = await db.patient.findMany({ where: { fullName: { startsWith: 'Capture Lab Patient ' } }, select: { id: true } });
      const ids = patients.map((p) => p.id);
      await db.labOrder.deleteMany({ where: { patientId: { in: ids } } });
      await db.encounter.deleteMany({ where: { patientId: { in: ids } } });
      await db.patient.deleteMany({ where: { id: { in: ids } } });
    }
  });

  it('does not capture direct writes when the deployment is not an edge (docs/16 §5 gate)', async () => {
    await db.mutationLog.deleteMany();
    const savedUrl = config.edgeRelay.url;
    config.edgeRelay.url = ''; // national platform / plain facility — no upstream

    const plainApp = await buildApp({ db, logger: false });
    const facility = await makeFacility('Capture Gate Facility (synthetic)');
    const staff = await makeUser({ email: `gate-staff-${Math.random().toString(36).slice(2, 8)}@demo.gh`, roleCode: 'HOSPITAL_ADMIN', facilityId: facility.id });
    try {
      const res = await plainApp.inject({
        method: 'POST',
        url: '/api/v1/patients',
        headers: { authorization: `Bearer ${staff.token}` },
        payload: { fullName: 'Capture Gate Patient (synthetic)', force: true },
      });
      expect(res.statusCode).toBe(200);
      // No edge → no capture: the write must not leave a `direct:` log row.
      expect(await db.mutationLog.count({ where: { transactionId: { startsWith: 'direct:' } } })).toBe(0);
    } finally {
      config.edgeRelay.url = savedUrl;
      await plainApp.close();
      await db.patient.deleteMany({ where: { fullName: 'Capture Gate Patient (synthetic)' } });
    }
  });
});
