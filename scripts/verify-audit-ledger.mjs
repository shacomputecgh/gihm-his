#!/usr/bin/env node
// -----------------------------------------------------------------------------
// GIHM-HIS sealed audit ledger — OFFLINE verifier.
//
//   node scripts/verify-audit-ledger.mjs gihm-audit-ledger-2026-10-03.json
//
// Verifies an exported proof bundle with no database, no network, no platform
// and no dependencies beyond Node itself. That is the point: a regulator, an
// auditor, or a facility edge can re-derive the audit trail's integrity from a
// file alone, without trusting the API that produced it.
//
// It re-checks three independent things:
//   1. every checkpoint hash matches its recorded contents
//   2. the checkpoint chain links end-to-end from the genesis hash
//   3. each window's Merkle root recomputes from its entries, and every
//      entry's inclusion proof folds back to that root
//
// Exit code 0 = ledger verified, 1 = integrity problem, 2 = the bundle itself
// is malformed. This file intentionally mirrors apps/api/src/lib/merkle.ts; if
// you change the hashing there, change it here too.
// -----------------------------------------------------------------------------

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const GENESIS_HASH = '0'.repeat(64);
const EMPTY_ROOT = createHash('sha256').update('gihm:empty-window').digest('hex');

function sha256Hex(input) {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

function isPlainObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Deterministic JSON: object keys sorted, `undefined` dropped. */
function stableStringify(value) {
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

function merkleRoot(leaves) {
  if (leaves.length === 0) return EMPTY_ROOT;
  let level = [...leaves];
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = i + 1 < level.length ? level[i + 1] : level[i];
      next.push(sha256Hex(left + right));
    }
    level = next;
  }
  return level[0];
}

function verifyMerkleProof(leaf, proof, root) {
  let acc = leaf;
  for (const step of proof) {
    if (!step || (step.position !== 'left' && step.position !== 'right') || typeof step.hash !== 'string') return false;
    acc = step.position === 'left' ? sha256Hex(step.hash + acc) : sha256Hex(acc + step.hash);
  }
  return acc === root;
}

function pick(obj, fields) {
  const out = {};
  for (const f of fields) out[f] = obj[f] === undefined ? null : obj[f];
  return out;
}

function main() {
  const target = process.argv[2];
  if (!target) {
    console.error('usage: node scripts/verify-audit-ledger.mjs <proof-bundle.json>');
    process.exit(2);
  }

  let bundle;
  try {
    bundle = JSON.parse(readFileSync(target, 'utf8'));
  } catch (err) {
    console.error(`✗ Could not read bundle: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(2);
  }

  const leafFields = bundle?.algorithm?.leafFields;
  const anchorFields = bundle?.algorithm?.anchorFields;
  if (bundle?.format !== 'gihm-audit-ledger/v1' || !Array.isArray(leafFields) || !Array.isArray(anchorFields)) {
    console.error(`✗ Unrecognised bundle format: ${bundle?.format ?? '(none)'}`);
    process.exit(2);
  }

  const problems = [];
  const anchors = Array.isArray(bundle.anchors) ? [...bundle.anchors].sort((a, b) => a.seq - b.seq) : [];

  // 1 + 2 — checkpoint hashes and the chain that links them.
  let expectedPrev = bundle.genesisHash ?? GENESIS_HASH;
  for (const anchor of anchors) {
    const core = pick(anchor, anchorFields);
    const recomputed = sha256Hex(stableStringify(core));
    if (recomputed !== anchor.hash) {
      problems.push(`checkpoint ${anchor.seq}: hash does not match its contents`);
    }
    if (anchor.prevHash !== expectedPrev) {
      problems.push(`checkpoint ${anchor.seq}: does not link to its predecessor`);
    }
    expectedPrev = anchor.hash;
  }

  // 3 — window roots recomputed from the entries, and every inclusion proof.
  const byAnchor = new Map();
  for (const entry of bundle.entries ?? []) {
    const proofRef = bundle.proofs?.[entry.id];
    if (!proofRef) {
      problems.push(`entry ${entry.id}: no inclusion proof in the bundle`);
      continue;
    }
    if (!byAnchor.has(proofRef.anchorSeq)) byAnchor.set(proofRef.anchorSeq, []);
    byAnchor.get(proofRef.anchorSeq).push({ entry, proofRef });
  }

  let provedEntries = 0;
  for (const anchor of anchors) {
    const group = byAnchor.get(anchor.seq);
    if (!group) continue; // this window was outside the export budget
    group.sort((a, b) => a.proofRef.index - b.proofRef.index);
    if (group.length !== anchor.entryCount) {
      problems.push(`checkpoint ${anchor.seq}: bundle carries ${group.length} of ${anchor.entryCount} entries — cannot recompute`);
      continue;
    }
    const indicesOk = group.every((g, i) => g.proofRef.index === i);
    if (!indicesOk) {
      problems.push(`checkpoint ${anchor.seq}: entry positions are not contiguous`);
      continue;
    }
    const leaves = group.map((g) => sha256Hex(stableStringify(pick(g.entry, leafFields))));
    const root = merkleRoot(leaves);
    if (root !== anchor.root) {
      problems.push(`checkpoint ${anchor.seq}: recomputed root ${root.slice(0, 16)}… ≠ sealed ${String(anchor.root).slice(0, 16)}…`);
    }
    for (const { entry, proofRef } of group) {
      const leaf = sha256Hex(stableStringify(pick(entry, leafFields)));
      if (leaf !== proofRef.leaf) {
        problems.push(`entry ${entry.id}: leaf does not match the entry's contents`);
        continue;
      }
      if (!verifyMerkleProof(leaf, proofRef.proof, proofRef.root)) {
        problems.push(`entry ${entry.id}: inclusion proof does not fold to the checkpoint root`);
        continue;
      }
      provedEntries += 1;
    }
  }

  const unexportedCheckpoints = anchors.filter((a) => !byAnchor.has(a.seq)).length;
  console.log(`GIHM-HIS sealed audit ledger — offline verification`);
  console.log(`  bundle        : ${target}`);
  console.log(`  generated     : ${bundle.generatedAt ?? '(unknown)'}`);
  console.log(`  chain         : ${anchors.length} checkpoint hash(es) + links verified`);
  console.log(`  roots         : ${anchors.length - unexportedCheckpoints} window(s) recomputed (${unexportedCheckpoints} outside the export budget)`);
  console.log(`  entries       : ${provedEntries} inclusion proof(s) verified`);
  console.log(`  head hash     : ${expectedPrev}`);

  if (problems.length > 0) {
    console.error(`\n✗ LEDGER NOT VERIFIED — ${problems.length} problem(s):`);
    for (const p of problems) console.error(`  • ${p}`);
    process.exit(1);
  }
  console.log('\n✓ Ledger verified — no checkpoint, chain, root or inclusion problem found.');
  process.exit(0);
}

main();
