// -----------------------------------------------------------------------------
// Sealed audit ledger (docs/10 §5).
//
// AuditLog is append-friendly but ordinary: anyone with database access can edit
// or delete a row and no application code would notice. This module adds the
// tamper-evidence layer a national platform needs, without touching the audit
// write path (which stays fire-and-forget and cheap):
//
//   seal    — assigns a contiguous ledgerSeq to entries that have none, then
//             appends an immutable checkpoint holding the Merkle root of that
//             window and a hash chained to the previous checkpoint.
//   verify  — recomputes every window root from the retained rows and re-walks
//             the checkpoint chain. Any edit to a sealed entry changes its leaf,
//             so the recomputed root no longer matches the sealed one.
//   prove   — an inclusion proof for a single entry, verifiable against the
//             checkpoint root: a record can be proven without disclosing the
//             rest of the trail.
//   export  — a self-contained proof bundle a third party can verify OFFLINE
//             with `scripts/verify-audit-ledger.mjs` (zero dependencies, no
//             network, no platform).
//
// Honest limits, surfaced rather than hidden: a window whose rows have been
// removed (retention pruning under audit.retentionDays, or deliberate deletion)
// can no longer be recomputed, so it is reported `incomplete` — the checkpoint
// chain itself is still checked, and a window that is present but altered is
// reported `tampered`.
// -----------------------------------------------------------------------------

import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { recordAudit } from '../../lib/audit.js';
import {
  GENESIS_HASH,
  anchorHash,
  entryLeaf,
  merkleProof,
  merkleRoot,
  verifyMerkleProof,
  type AnchorCore,
  type LedgerEntryFields,
  type MerkleStep,
} from '../../lib/merkle.js';
import type { Guards } from '../../lib/guards.js';

/** Rows returned by the audit select, ready to be canonicalised. */
interface LedgerRow {
  id: string;
  ledgerSeq: number | null;
  actorId: string | null;
  actorEmail: string | null;
  role: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  facilityId: string | null;
  deviceId: string | null;
  ip: string | null;
  before: string | null;
  after: string | null;
  reason: string | null;
  createdAt: Date;
}

const LEDGER_SELECT = {
  id: true,
  ledgerSeq: true,
  actorId: true,
  actorEmail: true,
  role: true,
  action: true,
  entityType: true,
  entityId: true,
  facilityId: true,
  deviceId: true,
  ip: true,
  before: true,
  after: true,
  reason: true,
  createdAt: true,
} as const;

/** Number of entries a single export bundle carries (most recent sealed first). */
const EXPORT_ENTRY_LIMIT = 2000;
/** Rows assigned a ledgerSeq per transaction while sealing. */
const SEAL_CHUNK = 500;

export function rowToFields(row: LedgerRow): LedgerEntryFields {
  return {
    id: row.id,
    ledgerSeq: row.ledgerSeq ?? 0,
    actorId: row.actorId,
    actorEmail: row.actorEmail,
    role: row.role,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    facilityId: row.facilityId,
    deviceId: row.deviceId,
    ip: row.ip,
    before: row.before,
    after: row.after,
    reason: row.reason,
    createdAt: row.createdAt.toISOString(),
  };
}

interface AnchorRow {
  seq: number;
  fromSeq: number;
  toSeq: number;
  entryCount: number;
  root: string;
  firstEntryId: string;
  lastEntryId: string;
  fromAt: Date;
  toAt: Date;
  prevHash: string;
  hash: string;
  sealedAt: Date;
  sealedByEmail: string | null;
}

function anchorCoreOf(a: AnchorRow): AnchorCore {
  return {
    seq: a.seq,
    fromSeq: a.fromSeq,
    toSeq: a.toSeq,
    entryCount: a.entryCount,
    root: a.root,
    firstEntryId: a.firstEntryId,
    lastEntryId: a.lastEntryId,
    fromAt: a.fromAt.toISOString(),
    toAt: a.toAt.toISOString(),
    prevHash: a.prevHash,
  };
}

export interface SealResult {
  sealed: boolean;
  reason?: string;
  anchor?: { seq: number; fromSeq: number; toSeq: number; entryCount: number; root: string; hash: string };
}

/**
 * Seal every audit entry that does not yet carry a ledgerSeq into a new
 * checkpoint. Numbering is contiguous and deterministic (createdAt, then id),
 * starting after the previous checkpoint's range.
 */
export async function sealAuditWindow(
  db: PrismaClient,
  actor: { id?: string; email?: string } = {},
): Promise<SealResult> {
  const previous = (await db.auditAnchor.findFirst({ orderBy: { seq: 'desc' } })) as AnchorRow | null;
  const startSeq = (previous?.toSeq ?? 0) + 1;

  const pending = await db.auditLog.findMany({
    where: { ledgerSeq: null },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: { id: true },
  });
  if (pending.length === 0) return { sealed: false, reason: 'no-new-entries' };

  // Assign contiguous positions. Chunked so a large backlog never builds one
  // enormous transaction.
  for (let i = 0; i < pending.length; i += SEAL_CHUNK) {
    const chunk = pending.slice(i, i + SEAL_CHUNK);
    await db.$transaction(
      chunk.map((row, j) => db.auditLog.update({ where: { id: row.id }, data: { ledgerSeq: startSeq + i + j } })),
    );
  }

  const toSeq = startSeq + pending.length - 1;
  const rows = (await db.auditLog.findMany({
    where: { ledgerSeq: { gte: startSeq, lte: toSeq } },
    orderBy: { ledgerSeq: 'asc' },
    select: LEDGER_SELECT,
  })) as LedgerRow[];

  if (rows.length === 0) return { sealed: false, reason: 'no-new-entries' };
  const firstRow = rows[0]!;
  const lastRow = rows[rows.length - 1]!;
  const leaves = rows.map((r) => entryLeaf(rowToFields(r)));
  const root = merkleRoot(leaves);
  const core: AnchorCore = {
    seq: (previous?.seq ?? 0) + 1,
    fromSeq: startSeq,
    toSeq,
    entryCount: rows.length,
    root,
    firstEntryId: firstRow.id,
    lastEntryId: lastRow.id,
    fromAt: firstRow.createdAt.toISOString(),
    toAt: lastRow.createdAt.toISOString(),
    prevHash: previous?.hash ?? GENESIS_HASH,
  };
  const hash = anchorHash(core);

  await db.auditAnchor.create({
    data: {
      seq: core.seq,
      fromSeq: core.fromSeq,
      toSeq: core.toSeq,
      entryCount: core.entryCount,
      root: core.root,
      firstEntryId: core.firstEntryId,
      lastEntryId: core.lastEntryId,
      fromAt: firstRow.createdAt,
      toAt: lastRow.createdAt,
      prevHash: core.prevHash,
      hash,
      sealedById: actor.id,
      sealedByEmail: actor.email,
    },
  });

  return {
    sealed: true,
    anchor: { seq: core.seq, fromSeq: core.fromSeq, toSeq: core.toSeq, entryCount: core.entryCount, root: core.root, hash },
  };
}

export type LedgerStatus = 'verified' | 'degraded' | 'broken';

export interface LedgerProblem {
  seq: number;
  type: 'chain' | 'anchor-hash' | 'tampered' | 'incomplete' | 'non-contiguous';
  detail: string;
}

export interface LedgerReport {
  status: LedgerStatus;
  ok: boolean;
  checkpoints: number;
  sealedEntries: number;
  unsealedEntries: number;
  totalEntries: number;
  headHash: string;
  latest: { seq: number; toAt: string; entryCount: number; root: string; hash: string; sealedAt: string } | null;
  problems: LedgerProblem[];
}

/**
 * Recompute every checkpoint from the live table and re-walk the chain. Returns
 * a report rather than throwing: a broken ledger is a finding, not an error.
 */
export async function verifyAuditLedger(db: PrismaClient): Promise<LedgerReport> {
  const anchors = (await db.auditAnchor.findMany({ orderBy: { seq: 'asc' } })) as AnchorRow[];
  const problems: LedgerProblem[] = [];
  let expectedPrev = GENESIS_HASH;
  let sealedEntries = 0;

  for (const a of anchors) {
    const core = anchorCoreOf(a);
    if (anchorHash(core) !== a.hash) {
      problems.push({ seq: a.seq, type: 'anchor-hash', detail: 'Checkpoint hash does not match its recorded contents' });
    }
    if (a.prevHash !== expectedPrev) {
      problems.push({ seq: a.seq, type: 'chain', detail: 'Checkpoint does not link to its predecessor' });
    }
    expectedPrev = a.hash;

    const rows = (await db.auditLog.findMany({
      where: { ledgerSeq: { gte: a.fromSeq, lte: a.toSeq } },
      orderBy: { ledgerSeq: 'asc' },
      select: LEDGER_SELECT,
    })) as LedgerRow[];

    if (rows.length !== a.entryCount) {
      // Rows were removed from the window — retention pruning or deletion. The
      // root cannot be recomputed, so say so instead of claiming a pass.
      problems.push({
        seq: a.seq,
        type: 'incomplete',
        detail: `Window seq ${a.fromSeq}–${a.toSeq} expects ${a.entryCount} entries, found ${rows.length}`,
      });
      sealedEntries += rows.length;
      continue;
    }

    const nonContiguous = rows.some((r, i) => r.ledgerSeq !== a.fromSeq + i);
    if (nonContiguous) {
      problems.push({
        seq: a.seq,
        type: 'non-contiguous',
        detail: `Window seq ${a.fromSeq}–${a.toSeq} has a gap in its entry positions`,
      });
    }
    if (rows[0]!.id !== a.firstEntryId || rows[rows.length - 1]!.id !== a.lastEntryId) {
      problems.push({ seq: a.seq, type: 'tampered', detail: 'Window boundary entries no longer match the checkpoint' });
    }
    const root = merkleRoot(rows.map((r) => entryLeaf(rowToFields(r))));
    if (root !== a.root) {
      problems.push({ seq: a.seq, type: 'tampered', detail: `Recomputed root ${root.slice(0, 16)}… ≠ sealed ${a.root.slice(0, 16)}…` });
    }
    sealedEntries += rows.length;
  }

  const [totalEntries, unsealedEntries] = await Promise.all([
    db.auditLog.count(),
    db.auditLog.count({ where: { ledgerSeq: null } }),
  ]);
  const hardProblems = problems.filter((p) => p.type !== 'incomplete');
  const status: LedgerStatus = hardProblems.length > 0 ? 'broken' : problems.length > 0 ? 'degraded' : 'verified';
  const head = anchors[anchors.length - 1];

  return {
    status,
    ok: hardProblems.length === 0,
    checkpoints: anchors.length,
    sealedEntries,
    unsealedEntries,
    totalEntries,
    headHash: head?.hash ?? GENESIS_HASH,
    latest: head
      ? { seq: head.seq, toAt: head.toAt.toISOString(), entryCount: head.entryCount, root: head.root, hash: head.hash, sealedAt: head.sealedAt.toISOString() }
      : null,
    problems,
  };
}

export interface AnchorSummary {
  seq: number;
  fromSeq: number;
  toSeq: number;
  entryCount: number;
  root: string;
  // The window is located by its boundary entry ids, so an export that omitted
  // them could not be verified offline — the hash covers them.
  firstEntryId: string;
  lastEntryId: string;
  hash: string;
  prevHash: string;
  fromAt: string;
  toAt: string;
  sealedAt: string;
  sealedByEmail: string | null;
}

function anchorSummary(a: AnchorRow): AnchorSummary {
  return {
    seq: a.seq,
    fromSeq: a.fromSeq,
    toSeq: a.toSeq,
    entryCount: a.entryCount,
    root: a.root,
    firstEntryId: a.firstEntryId,
    lastEntryId: a.lastEntryId,
    hash: a.hash,
    prevHash: a.prevHash,
    fromAt: a.fromAt.toISOString(),
    toAt: a.toAt.toISOString(),
    sealedAt: a.sealedAt.toISOString(),
    sealedByEmail: a.sealedByEmail,
  };
}

export async function listAnchors(db: PrismaClient, take = 50): Promise<AnchorSummary[]> {
  const rows = (await db.auditAnchor.findMany({ orderBy: { seq: 'desc' }, take })) as AnchorRow[];
  return rows.map(anchorSummary);
}

export interface InclusionProof {
  entryId: string;
  ledgerSeq: number;
  anchorSeq: number;
  index: number;
  leaf: string;
  proof: MerkleStep[];
  root: string;
  verified: boolean;
}

/**
 * Inclusion proof that one audit entry is inside a sealed checkpoint — enough
 * to prove the record existed, and was not altered, without revealing any other
 * entry in the trail.
 */
export async function proveEntry(db: PrismaClient, entryId: string): Promise<InclusionProof | null> {
  const entry = (await db.auditLog.findUnique({ where: { id: entryId }, select: LEDGER_SELECT })) as LedgerRow | null;
  if (!entry?.ledgerSeq) return null;
  const anchor = (await db.auditAnchor.findFirst({
    where: { fromSeq: { lte: entry.ledgerSeq }, toSeq: { gte: entry.ledgerSeq } },
  })) as AnchorRow | null;
  if (!anchor) return null;

  const rows = (await db.auditLog.findMany({
    where: { ledgerSeq: { gte: anchor.fromSeq, lte: anchor.toSeq } },
    orderBy: { ledgerSeq: 'asc' },
    select: LEDGER_SELECT,
  })) as LedgerRow[];
  const leaves = rows.map((r) => entryLeaf(rowToFields(r)));
  const index = entry.ledgerSeq - anchor.fromSeq;
  if (index < 0 || index >= leaves.length) return null;
  const leaf = leaves[index]!;
  const proof = merkleProof(leaves, index);
  return {
    entryId,
    ledgerSeq: entry.ledgerSeq,
    anchorSeq: anchor.seq,
    index,
    leaf,
    proof,
    root: anchor.root,
    verified: verifyMerkleProof(leaf, proof, anchor.root),
  };
}

export interface LedgerBundle {
  format: 'gihm-audit-ledger/v1';
  generatedAt: string;
  algorithm: {
    leaf: string;
    anchor: string;
    merkle: string;
    leafFields: string[];
    anchorFields: string[];
  };
  genesisHash: string;
  anchors: AnchorSummary[];
  entries: LedgerEntryFields[];
  proofs: Record<string, { anchorSeq: number; index: number; leaf: string; proof: MerkleStep[]; root: string }>;
}

/**
 * A portable, self-contained proof bundle. The offline verifier re-derives the
 * window roots from the included entries, re-walks the checkpoint chain, and
 * checks every inclusion proof — no database, no network, no trust in the API
 * that produced it.
 */
export async function exportLedgerBundle(db: PrismaClient): Promise<LedgerBundle> {
  const anchors = (await db.auditAnchor.findMany({ orderBy: { seq: 'asc' } })) as AnchorRow[];
  const entries: LedgerEntryFields[] = [];
  const proofs: LedgerBundle['proofs'] = {};

  // Walk checkpoints newest-first so the entry budget is spent on recent,
  // most-likely-to-be-audited windows; each anchor's proof derives from its own
  // window's leaves, so partial export stays internally consistent.
  const newestFirst = [...anchors].reverse();
  for (const a of newestFirst) {
    if (entries.length >= EXPORT_ENTRY_LIMIT) break;
    const rows = (await db.auditLog.findMany({
      where: { ledgerSeq: { gte: a.fromSeq, lte: a.toSeq } },
      orderBy: { ledgerSeq: 'asc' },
      select: LEDGER_SELECT,
    })) as LedgerRow[];
    // A window that cannot be recomputed would make the bundle unverifiable —
    // leave it out rather than ship a proof that cannot pass.
    if (rows.length !== a.entryCount) continue;
    const fields = rows.map(rowToFields);
    const leaves = fields.map(entryLeaf);
    rows.forEach((row, index) => {
      proofs[row.id] = {
        anchorSeq: a.seq,
        index,
        leaf: leaves[index]!,
        proof: merkleProof(leaves, index),
        root: a.root,
      };
    });
    entries.push(...fields);
  }

  return {
    format: 'gihm-audit-ledger/v1',
    generatedAt: new Date().toISOString(),
    algorithm: {
      leaf: 'sha256(stableStringify(entryFields))',
      anchor: 'sha256(stableStringify(anchorCore))',
      merkle: 'sha256(left + right); an odd node is paired with itself',
      leafFields: [
        'id', 'ledgerSeq', 'actorId', 'actorEmail', 'role', 'action', 'entityType', 'entityId',
        'facilityId', 'deviceId', 'ip', 'before', 'after', 'reason', 'createdAt',
      ],
      anchorFields: ['seq', 'fromSeq', 'toSeq', 'entryCount', 'root', 'firstEntryId', 'lastEntryId', 'fromAt', 'toAt', 'prevHash'],
    },
    genesisHash: GENESIS_HASH,
    anchors: anchors.map(anchorSummary),
    entries,
    proofs,
  };
}

export function registerAuditLedgerRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  const dev = guards.requirePermission('developer_mode');

  // Seal the trail's newest entries into a chained checkpoint.
  app.post(
    '/admin/developer/audit/seal',
    { preHandler: dev, schema: { summary: 'Seal unsequenced audit entries into a hash-chained Merkle checkpoint', tags: ['developer'] } },
    async (request) => {
      const result = await sealAuditWindow(db, { id: request.user?.id, email: request.user?.email });
      recordAudit(db, request, {
        action: 'developer.audit.seal',
        entityType: 'system',
        after: result.sealed ? { seq: result.anchor?.seq, entryCount: result.anchor?.entryCount, root: result.anchor?.root } : { reason: result.reason },
      });
      return result;
    },
  );

  // Recompute every checkpoint and re-walk the chain.
  app.get(
    '/admin/developer/audit/integrity',
    { preHandler: dev, schema: { summary: 'Verify the sealed audit ledger — recompute window roots and the checkpoint chain', tags: ['developer'] } },
    async () => verifyAuditLedger(db),
  );

  app.get(
    '/admin/developer/audit/anchors',
    { preHandler: dev, schema: { summary: 'List audit ledger checkpoints (newest first)', tags: ['developer'] } },
    async (request) => {
      const take = Math.min(200, Math.max(1, Number((request.query as Record<string, unknown>).take) || 50));
      return { anchors: await listAnchors(db, take) };
    },
  );

  // Inclusion proof for a single entry — proves one record without disclosing
  // the rest of the trail.
  app.get(
    '/admin/developer/audit/entries/:id/proof',
    { preHandler: dev, schema: { summary: 'Merkle inclusion proof for a single audit entry', tags: ['developer'] } },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const proof = await proveEntry(db, id);
      if (!proof) {
        reply.code(404);
        return { error: 'Entry is not part of a sealed checkpoint' };
      }
      recordAudit(db, request, { action: 'developer.audit.proof', entityType: 'auditLog', entityId: id, after: { anchorSeq: proof.anchorSeq, verified: proof.verified } });
      return proof;
    },
  );

  // Portable bundle for offline, third-party verification.
  app.get(
    '/admin/developer/audit/anchors/export',
    { preHandler: dev, schema: { summary: 'Export the audit ledger proof bundle (verifiable offline)', tags: ['developer'] } },
    async (request, reply) => {
      const bundle = await exportLedgerBundle(db);
      recordAudit(db, request, {
        action: 'developer.audit.export',
        entityType: 'system',
        after: { checkpoints: bundle.anchors.length, entries: bundle.entries.length },
      });
      reply.header('content-type', 'application/json');
      reply.header('content-disposition', `attachment; filename="gihm-audit-ledger-${new Date().toISOString().slice(0, 10)}.json"`);
      return reply.send(JSON.stringify(bundle, null, 2));
    },
  );
}
