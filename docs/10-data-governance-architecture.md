# 10 — Data Governance Architecture

## 1. Governance domains (spec §151)

Regions · districts · facilities · departments · professions · diagnoses (ICD-10) · procedures · medicines · laboratory tests · services · insurance · reporting indicators.

## 2. Master-data rules

Every governed item carries: **owner · version · effective date · approval status · change history**. Controlled terminology (ICD-10 codes, LOINC, ATC, facility codes) is **not casually editable** — changes require approval and are audited.

## 3. In this prototype

- Geography and facilities are versioned master data with `status`/`effectiveDate`.
- Diagnoses use ICD-10 codes; coded values are validated strings (terminology tables land in a later phase).
- The **audit log** (`AuditLog`) provides the change history for every write.
- The **import tool** (spec §152, see `docs/20`) validates duplicates, invalid parents and coordinates, and requires approval before publication.

## 4. Data quality engine (spec §81, implemented)

`GET /data-quality/report` runs live checks over platform records (the same data the reports read, so a finding always points at a real row), scoped exactly like the reports (facility / region / district / national) and gated by `view_reports` / `view_dashboard` / `view_patient`:

| Check | Severity | Detects |
|---|---|---|
| `dob.impossible` | ERROR | DOB missing, future, or age > 120 |
| `patient.incomplete` | WARNING | Missing name / sex / Ghana Card / NHIS |
| `patient.duplicate` | WARNING | Same name + phone registrations (MPI review candidates) |
| `encounter.future` | ERROR | Future-dated encounters (clock drift / bad client timestamp) |
| `encounter.open.stale` | INFO | Encounters open > 30 days |
| `lab.verified.no-result` | ERROR | VERIFIED orders with no result text |
| `lab.pending.stale` | WARNING | Orders pending > 14 days |
| `anc.gestational-age` | WARNING | ANC gestational age outside 4–45 weeks |
| `pregnancy.sex-mismatch` | ERROR | Delivery record on a patient registered male |
| `rx.incomplete` | WARNING | Prescription without medicine or quantity |

Every finding is classified **Error / Warning / Informational** and the engine **never blocks clinical care** — it only reports (reads never mutate). Findings are bounded (5 examples per check) and carry only the patient MRN + record id — no clinical note text. Runs are audit-logged (`dataQuality.report`).

## 5. Sealed audit ledger — tamper evidence (implemented)

The change history in §3 is only worth as much as its integrity. `AuditLog` is deliberately an append-cheap table (writes are fire-and-forget and durable before the caller sees a response), which means nothing in the database itself prevents an operator with direct access from editing or deleting a row. The **sealed audit ledger** closes that gap without putting hashing on the clinical write path.

| Piece | Where | What it does |
|---|---|---|
| `ledgerSeq` | `AuditLog` | Nullable position, assigned lazily at seal time — never on the write path |
| `AuditAnchor` | schema | Immutable checkpoint: `entryCount`, Merkle `root`, boundary entry ids, `prevHash` → `hash` |
| `lib/merkle.ts` | API | Canonical entry/anchor hashing, Merkle root, inclusion proofs (pure, no DB) |
| `modules/admin/auditLedger.ts` | API | `seal` · `verify` · `prove` · `export` |
| `Developer → Audit → Sealed audit ledger` | Web | Seal, re-verify, browse checkpoints, download the proof bundle |
| `scripts/verify-audit-ledger.mjs` | repo | **Offline** third-party verifier — zero dependencies, no network |

**How it works.** A *seal* numbers every audit entry that has none (deterministic: `createdAt`, then `id`), recomputes a Merkle root over that window, and appends an immutable checkpoint whose hash covers `{seq, fromSeq, toSeq, entryCount, root, firstEntryId, lastEntryId, fromAt, toAt, prevHash}` and **chains to the previous checkpoint**. A daily sweep (`server.ts`) keeps the chain current; `POST /admin/developer/audit/seal` does it on demand.

**What it detects.** Editing any sealed entry changes its leaf, so the recomputed root no longer matches the sealed `root`; reordering, boundary substitution, a re-pointed `prevHash`, and a rewritten checkpoint hash are each reported as distinct findings. `GET /admin/developer/audit/integrity` returns `verified` / `degraded` / `broken` with the exact checkpoint and reason.

**Third-party verification (the point).** `GET /admin/developer/audit/anchors/export` produces a self-contained `gihm-audit-ledger/v1` bundle. `node scripts/verify-audit-ledger.mjs <bundle>` re-derives every window root, re-walks the checkpoint chain from the genesis hash, and checks each inclusion proof — **with no database, no network and no trust in the API that produced it**. A regulator, an auditor or a facility edge can therefore verify the national audit trail from a file.

**Minimised disclosure.** `GET /admin/developer/audit/entries/:id/proof` returns a Merkle *inclusion proof* for a single entry: enough to prove that one record existed and was not altered, without revealing any other entry in the trail.

**Stated honestly.** A window whose rows have been removed — retention pruning under `audit.retentionDays`, or deletion — can no longer be recomputed, so it is reported `degraded`/`incomplete` rather than silently trusted. The checkpoint chain is still verified in that case, and the sealed `root` + `entryCount` remain the historical commitment for those entries. Windows that are present but altered are reported `broken`.

All four operations are gated by `developer_mode` (docs/25) and audit-logged (`developer.audit.seal`, `developer.audit.proof`, `developer.audit.export`). Coverage: 6 pure-crypto tests + 5 live-ledger tests + 3 HTTP tests + 4 offline-verifier tests in `apps/api/tests/auditLedger.test.ts`, including a tamper-and-restore round trip and an end-to-end run of the shipped verifier against a real bundle.
