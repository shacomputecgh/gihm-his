import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, createTestApp, makeUser } from './helpers.js';
import type { FastifyInstance } from 'fastify';
import {
  GENESIS_HASH,
  anchorHash,
  entryLeaf,
  merkleProof,
  merkleRoot,
  stableStringify,
  verifyMerkleProof,
  type LedgerEntryFields,
} from '../src/lib/merkle.js';
import { exportLedgerBundle, proveEntry, sealAuditWindow, verifyAuditLedger } from '../src/modules/admin/auditLedger.js';

// ---------------------------------------------------------------------------
// Sealed audit ledger (docs/10 §5). The trail itself is a plain table; the
// checkpoints are what make tampering detectable — and the guarantee has to
// hold for a third party with no access to the platform, so the offline
// verifier is exercised here too.
//
// These tests deliberately RESTORE anything they tamper with. The suite shares
// one database across files, and leaving a sealed window broken would leave the
// ledger in a state the next reader would have to explain.
// ---------------------------------------------------------------------------

const here = path.dirname(fileURLToPath(import.meta.url));
const verifierScript = path.resolve(here, '../../../scripts/verify-audit-ledger.mjs');
const bundlePath = path.resolve(here, '.tmp/ledger-bundle.json');

let app: FastifyInstance;
let developer: { token: string; userId: string };
let plain: { token: string };

const auth = (t: string) => ({ authorization: `Bearer ${t}` });

function fields(over: Partial<LedgerEntryFields> = {}): LedgerEntryFields {
  return {
    id: 'e1',
    ledgerSeq: 1,
    actorId: 'u1',
    actorEmail: 'dev@demo.gh',
    role: 'DOCTOR',
    action: 'patient.create',
    entityType: 'patient',
    entityId: 'p1',
    facilityId: 'f1',
    deviceId: null,
    ip: '127.0.0.1',
    before: null,
    after: '{"mrn":"GH-000001"}',
    reason: null,
    createdAt: '2026-10-01T00:00:00.000Z',
    ...over,
  };
}

beforeAll(async () => {
  // Developer scope sits above the permission system (docs/25), so this account
  // reaches every ledger route; `plain` proves the guard actually bites.
  app = await createTestApp();
  developer = await makeUser({ email: 'ledger-developer@demo.gh', roleCode: 'DEVELOPER', scope: 'DEVELOPER', permissions: [] });
  plain = await makeUser({ email: 'ledger-plain@demo.gh', roleCode: 'HOSPITAL_ADMIN', permissions: ['view_patient'] });
});

afterAll(async () => {
  await db.$disconnect();
  await app.close();
});

describe('merkle primitives', () => {
  it('canonicalises regardless of key order', () => {
    expect(stableStringify({ b: 1, a: 2 })).toBe(stableStringify({ a: 2, b: 1 }));
    expect(stableStringify({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
    // Nested objects and arrays are canonicalised too, and undefined drops out.
    expect(stableStringify({ x: [{ q: 1, p: undefined }, 'z'] })).toBe('{"x":[{"q":1},"z"]}');
  });

  it('a single-leaf window has the leaf as its root', () => {
    const leaf = entryLeaf(fields());
    expect(merkleRoot([leaf])).toBe(leaf);
  });

  it('changes the root when any entry changes', () => {
    const l0 = entryLeaf(fields({ id: 'a' }));
    const l1 = entryLeaf(fields({ id: 'b' }));
    const l2 = entryLeaf(fields({ id: 'c' }));
    const base = merkleRoot([l0, l1, l2]);
    const altered = [l0, entryLeaf(fields({ id: 'b', after: '{"mrn":"GH-999999"}' })), l2];
    expect(merkleRoot(altered)).not.toBe(base);
    // ...and when entries are reordered, which a chain over a fixed order must catch.
    expect(merkleRoot([l1, l0, l2])).not.toBe(base);
  });

  it('verifies an inclusion proof at every position of every window size', () => {
    for (let n = 1; n <= 9; n += 1) {
      const leaves = Array.from({ length: n }, (_, i) => entryLeaf(fields({ id: `leaf-${i}`, ledgerSeq: i + 1 })));
      const root = merkleRoot(leaves);
      for (let i = 0; i < n; i += 1) {
        const proof = merkleProof(leaves, i);
        expect(verifyMerkleProof(leaves[i]!, proof, root)).toBe(true);
        // A proof must not vouch for a leaf it does not belong to.
        expect(verifyMerkleProof(entryLeaf(fields({ id: 'other' })), proof, root)).toBe(false);
      }
    }
  });

  it('rejects a malformed proof rather than trusting it', () => {
    const leaves = [entryLeaf(fields()), entryLeaf(fields({ id: 'e2', ledgerSeq: 2 }))];
    const proof = merkleProof(leaves, 0);
    expect(verifyMerkleProof(leaves[0]!, proof, merkleRoot(leaves))).toBe(true);
    expect(verifyMerkleProof(leaves[0]!, [{ position: 'sideways', hash: proof[0]!.hash }] as never, merkleRoot(leaves))).toBe(false);
  });

  it('binds a checkpoint to its predecessor', () => {
    const core = {
      seq: 1, fromSeq: 1, toSeq: 2, entryCount: 2, root: 'aa',
      firstEntryId: 'a', lastEntryId: 'b',
      fromAt: '2026-10-01T00:00:00.000Z', toAt: '2026-10-01T00:01:00.000Z',
      prevHash: GENESIS_HASH,
    };
    const first = anchorHash(core);
    expect(anchorHash({ ...core, prevHash: first })).not.toBe(first);
    expect(anchorHash({ ...core, entryCount: 3 })).not.toBe(first);
    expect(anchorHash({ ...core })).toBe(first);
  });
});

describe('sealing and verifying the live ledger', () => {
  it('seals the trail into a chained checkpoint and verifies it', async () => {
    expect((await verifyAuditLedger(db)).checkpoints).toBe(0);

    const first = await sealAuditWindow(db, { email: 'ledger-test@demo.gh' });
    expect(first.sealed).toBe(true);
    expect(first.anchor?.entryCount).toBeGreaterThan(0);
    expect(first.anchor?.seq).toBe(1);

    const report = await verifyAuditLedger(db);
    expect(report.status).toBe('verified');
    expect(report.ok).toBe(true);
    expect(report.checkpoints).toBe(1);
    expect(report.latest?.hash).toBe(first.anchor?.hash);
    expect(report.problems).toEqual([]);
    // Nothing left to seal is reported, not treated as an error.
    expect((await sealAuditWindow(db, {})).sealed).toBe(false);
  });

  it('grows the chain when new entries arrive', async () => {
    // Something the trail has never seen, so the next seal has work to do.
    await db.auditLog.create({ data: { action: 'ledger-test.synthetic', entityType: 'system' } });
    const second = await sealAuditWindow(db, { email: 'ledger-test@demo.gh' });
    expect(second.sealed).toBe(true);
    expect(second.anchor?.seq).toBe(2);

    const anchors = await db.auditAnchor.findMany({ orderBy: { seq: 'asc' } });
    expect(anchors).toHaveLength(2);
    expect(anchors[1]!.prevHash).toBe(anchors[0]!.hash);
    expect(anchors[1]!.hash).not.toBe(anchors[0]!.hash);
    expect((await verifyAuditLedger(db)).status).toBe('verified');
  });

  it('detects a sealed entry that was edited in place, and clears once restored', async () => {
    const target = await db.auditLog.findFirst({ where: { ledgerSeq: { not: null } }, orderBy: { ledgerSeq: 'asc' } });
    expect(target).toBeTruthy();
    const original = target!.after;

    await db.auditLog.update({ where: { id: target!.id }, data: { after: '{"tampered":true}' } });
    const broken = await verifyAuditLedger(db);
    expect(broken.status).toBe('broken');
    expect(broken.ok).toBe(false);
    expect(broken.problems.some((p) => p.type === 'tampered')).toBe(true);

    await db.auditLog.update({ where: { id: target!.id }, data: { after: original } });
    const restored = await verifyAuditLedger(db);
    expect(restored.status).toBe('verified');
    expect(restored.ok).toBe(true);
  });

  it('detects a checkpoint that was re-pointed at another predecessor', async () => {
    const anchor = await db.auditAnchor.findFirst({ orderBy: { seq: 'desc' } });
    expect(anchor).toBeTruthy();
    const originalPrev = anchor!.prevHash;

    await db.auditAnchor.update({ where: { id: anchor!.id }, data: { prevHash: GENESIS_HASH } });
    const report = await verifyAuditLedger(db);
    expect(report.status).toBe('broken');
    expect(report.problems.some((p) => p.type === 'chain')).toBe(true);

    await db.auditAnchor.update({ where: { id: anchor!.id }, data: { prevHash: originalPrev } });
    expect((await verifyAuditLedger(db)).status).toBe('verified');
  });

  it('reports an unsealed entry honestly instead of pretending it is covered', async () => {
    const before = await verifyAuditLedger(db);
    await db.auditLog.create({ data: { action: 'ledger-test.unsealed', entityType: 'system' } });
    const after = await verifyAuditLedger(db);
    expect(after.unsealedEntries).toBe(before.unsealedEntries + 1);
    expect(after.totalEntries).toBe(before.totalEntries + 1);
    // An unsealed entry is not a failure — it simply is not covered yet.
    expect(after.status).toBe('verified');
  });
});

describe('inclusion proofs', () => {
  it('proves a single sealed entry without revealing the rest of the trail', async () => {
    const target = await db.auditLog.findFirst({ where: { ledgerSeq: { not: null } }, orderBy: { ledgerSeq: 'asc' } });
    const proof = await proveEntry(db, target!.id);
    expect(proof).toBeTruthy();
    expect(proof!.verified).toBe(true);
    expect(proof!.leaf).toMatch(/^[0-9a-f]{64}$/);
    expect(proof!.root).toMatch(/^[0-9a-f]{64}$/);
    // The path is logarithmic in the window size — a hash path, never a copy
    // of the surrounding records.
    const windowSize = (await db.auditAnchor.findUnique({ where: { seq: proof!.anchorSeq } }))!.entryCount;
    expect(proof!.proof.length).toBeLessThanOrEqual(Math.ceil(Math.log2(Math.max(windowSize, 2))));
    expect(await proveEntry(db, 'does-not-exist')).toBeNull();
  });

  it('serves the proof over HTTP to a developer and refuses a non-developer', async () => {
    const target = await db.auditLog.findFirst({ where: { ledgerSeq: { not: null } }, orderBy: { ledgerSeq: 'asc' } });
    const res = await app.inject({ method: 'GET', url: `/api/v1/admin/developer/audit/entries/${target!.id}/proof`, headers: auth(developer.token) });
    expect(res.statusCode).toBe(200);
    expect(res.json().verified).toBe(true);
    expect(res.json().root).toMatch(/^[0-9a-f]{64}$/);

    const denied = await app.inject({ method: 'GET', url: `/api/v1/admin/developer/audit/entries/${target!.id}/proof`, headers: auth(plain.token) });
    expect(denied.statusCode).toBe(403);
  });

  it('exposes integrity, checkpoint listing and sealing over HTTP', async () => {
    const integrity = await app.inject({ method: 'GET', url: '/api/v1/admin/developer/audit/integrity', headers: auth(developer.token) });
    expect(integrity.statusCode).toBe(200);
    expect(integrity.json().status).toBe('verified');
    expect(integrity.json().checkpoints).toBeGreaterThan(0);

    const anchors = await app.inject({ method: 'GET', url: '/api/v1/admin/developer/audit/anchors', headers: auth(developer.token) });
    expect(anchors.statusCode).toBe(200);
    const listed = anchors.json().anchors as Array<{ seq: number }>;
    expect(listed.length).toBeGreaterThan(0);
    // Newest first.
    expect(listed[0]!.seq).toBeGreaterThanOrEqual(listed[listed.length - 1]!.seq);

    const sealed = await app.inject({ method: 'POST', url: '/api/v1/admin/developer/audit/seal', headers: auth(developer.token) });
    expect(sealed.statusCode).toBe(200);
    expect(sealed.json()).toHaveProperty('sealed');

    const denied = await app.inject({ method: 'GET', url: '/api/v1/admin/developer/audit/integrity', headers: auth(plain.token) });
    expect(denied.statusCode).toBe(403);
  });
});

describe('offline verification', () => {
  /** Runs the shipped verifier against a bundle file and returns its exit code. */
  function runVerifier(file: string): { code: number; stdout: string; stderr: string } {
    try {
      const stdout = execFileSync(process.execPath, [verifierScript, file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
      return { code: 0, stdout, stderr: '' };
    } catch (err) {
      const e = err as { status?: number; stdout?: string; stderr?: string };
      return { code: e.status ?? 1, stdout: e.stdout ?? '', stderr: e.stderr ?? '' };
    }
  }

  it('verifies an exported bundle with zero access to the platform', async () => {
    // Seal everything outstanding first, so the bundle covers a stable window.
    await sealAuditWindow(db, { email: 'ledger-test@demo.gh' });
    const bundle = await exportLedgerBundle(db);
    expect(bundle.format).toBe('gihm-audit-ledger/v1');
    expect(bundle.anchors.length).toBeGreaterThan(0);
    expect(bundle.entries.length).toBeGreaterThan(0);

    writeFileSync(bundlePath, JSON.stringify(bundle, null, 2));
    const ok = runVerifier(bundlePath);
    expect(ok.stderr).toBe('');
    expect(ok.code).toBe(0);
    expect(ok.stdout).toContain('Ledger verified');

    // And it is genuinely independent — the endpoint's own export verifies too.
    const exported = await app.inject({ method: 'GET', url: '/api/v1/admin/developer/audit/anchors/export', headers: auth(developer.token) });
    expect(exported.statusCode).toBe(200);
    writeFileSync(bundlePath, exported.body);
    expect(runVerifier(bundlePath).code).toBe(0);
  });

  it('fails the offline verifier when a sealed entry in the bundle is altered', async () => {
    const bundle = await exportLedgerBundle(db);
    expect(bundle.entries.length).toBeGreaterThan(0);
    const victim = bundle.entries[0]!;
    victim.after = '{"forged":true}';
    writeFileSync(bundlePath, JSON.stringify(bundle, null, 2));

    const result = runVerifier(bundlePath);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('LEDGER NOT VERIFIED');
    expect(result.stderr).toMatch(/leaf does not match|recomputed root/);
  });

  it('fails the offline verifier when a checkpoint is re-pointed', async () => {
    const bundle = await exportLedgerBundle(db);
    expect(bundle.anchors.length).toBeGreaterThan(1);
    bundle.anchors[1]!.prevHash = GENESIS_HASH;
    writeFileSync(bundlePath, JSON.stringify(bundle, null, 2));

    const result = runVerifier(bundlePath);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('does not link to its predecessor');
  });

  it('refuses a bundle it does not recognise rather than reporting success', () => {
    writeFileSync(bundlePath, JSON.stringify({ format: 'something-else' }));
    const result = runVerifier(bundlePath);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain('Unrecognised bundle format');
  });
});
