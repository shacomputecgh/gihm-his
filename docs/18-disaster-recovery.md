# 18 — Disaster Recovery Architecture

## 1. Failure model (spec §134)

No single point of failure: Cloud ⇄ Facility Edge ⇄ Local devices. Each layer continues appropriate operations when another is unavailable. Power loss must not corrupt the facility database (spec §131) — transactional DB, journaling, atomic writes.

## 2. Backups (spec §132)

- **Local**: automatic encrypted backups at facility edge; restore testing.
- **Off-site**: approved off-site / cloud backups when connected.
- **Database**: volume snapshots + logical dumps (Postgres path).
- **Client**: the outbox guarantees un-synced work survives app updates (update flow: check pending sync → sync → backup local DB → update → validate → restart, spec §110).

## 3. High availability (spec §133)

Large facilities: primary + DB replica + standby; failover without unacceptable clinical downtime.

## 4. Restore priorities

1. Identity (users/devices/auth) → 2. Patients/MPI → 3. Clinical (encounters, labs, prescriptions) → 4. Operational (appointments, queue, inventory) → 5. Analytics/aggregates.

## 5. In this prototype

- SQLite transactional journal (WAL) protects against corruption on power loss.
- Outbox + idempotent sync protects client-side data.
- Full DR tooling (encrypted backups, replicas, restore drills) is Phase 6+; the architecture is documented here so it is never bolted on later.
