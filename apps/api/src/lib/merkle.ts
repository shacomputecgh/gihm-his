// -----------------------------------------------------------------------------
// Merkle tree + audit-ledger hashing (docs/10 §5).
//
// The sealed audit ledger needs two things from a hash layer, and both must be
// reproducible byte-for-byte by an OFFLINE verifier that has never seen this
// codebase: a canonical serialisation of an audit entry, and a Merkle root with
// inclusion proofs over an ordered window of those entries. Everything here is
// therefore pure (no Date.now, no randomness, no DB) and deliberately mirrors
// `scripts/verify-audit-ledger.mjs` — the zero-dependency verifier a regulator
// or a facility edge can run with no platform, no network and no npm install.
//
// Odd node counts duplicate the final node (the Bitcoin construction) rather
// than promoting it, which keeps proof verification a single unambiguous fold.
// -----------------------------------------------------------------------------

import { createHash } from 'node:crypto';

/** Previous-anchor hash for the very first checkpoint in the chain. */
export const GENESIS_HASH = '0'.repeat(64);

/** Root of an empty window — a checkpoint always has at least one entry. */
export const EMPTY_ROOT = createHash('sha256').update('gihm:empty-window').digest('hex');

/** The exact fields that make up an audit entry's leaf, in canonical order. */
export interface LedgerEntryFields {
  id: string;
  ledgerSeq: number;
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
  createdAt: string;
}

/** The exact fields that make up a checkpoint's hash, in canonical order. */
export interface AnchorCore {
  seq: number;
  fromSeq: number;
  toSeq: number;
  entryCount: number;
  root: string;
  firstEntryId: string;
  lastEntryId: string;
  fromAt: string;
  toAt: string;
  prevHash: string;
}

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Deterministic JSON: object keys sorted, `undefined` dropped. Two parties that
 * disagree about key insertion order still agree on the hash — which is exactly
 * what an offline verifier needs.
 */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v === undefined ? null : v)).join(',')}]`;
  }
  if (isPlainObject(value)) {
    const keys = Object.keys(value).filter((k) => value[k] !== undefined).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
  }
  return 'null';
}

/** Canonical leaf for one audit entry. */
export function entryLeaf(fields: LedgerEntryFields): string {
  return sha256Hex(stableStringify(fields));
}

/** Canonical hash for one checkpoint. */
export function anchorHash(core: AnchorCore): string {
  return sha256Hex(stableStringify(core));
}

/** Merkle root over an ordered list of leaves (odd node duplicated). */
export function merkleRoot(leaves: readonly string[]): string {
  if (leaves.length === 0) return EMPTY_ROOT;
  let level: string[] = [...leaves];
  while (level.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i]!;
      const right = i + 1 < level.length ? level[i + 1]! : left;
      next.push(sha256Hex(left + right));
    }
    level = next;
  }
  return level[0]!;
}

export interface MerkleStep {
  position: 'left' | 'right';
  hash: string;
}

/**
 * Inclusion proof for the leaf at `index`: the sibling hashes needed to walk
 * from that leaf up to the root, each tagged with which side it sits on.
 */
export function merkleProof(leaves: readonly string[], index: number): MerkleStep[] {
  if (index < 0 || index >= leaves.length) {
    throw new RangeError(`merkleProof: index ${index} out of range (0..${leaves.length - 1})`);
  }
  const proof: MerkleStep[] = [];
  let level: string[] = [...leaves];
  let idx = index;
  while (level.length > 1) {
    const isRight = idx % 2 === 1;
    const sibling = isRight ? idx - 1 : idx + 1;
    if (sibling < level.length) {
      proof.push({ position: isRight ? 'left' : 'right', hash: level[sibling]! });
    } else {
      // Odd node out — its own hash was duplicated to pair with itself.
      proof.push({ position: 'right', hash: level[idx]! });
    }
    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i]!;
      const right = i + 1 < level.length ? level[i + 1]! : left;
      next.push(sha256Hex(left + right));
    }
    level = next;
    idx = Math.floor(idx / 2);
  }
  return proof;
}

/**
 * Verify an inclusion proof. Folds the leaf with each sibling in order and
 * checks the result equals the root — no access to the other leaves required,
 * so a single record can be proven without disclosing the rest of the trail.
 */
export function verifyMerkleProof(leaf: string, proof: readonly MerkleStep[], root: string): boolean {
  let acc = leaf;
  for (const step of proof) {
    if (!step || (step.position !== 'left' && step.position !== 'right') || typeof step.hash !== 'string') return false;
    acc = step.position === 'left' ? sha256Hex(step.hash + acc) : sha256Hex(acc + step.hash);
  }
  return acc === root;
}
