# 01 — Product Requirements Document (PRD)

**GIHM-HIS — Ghana Integrated Health Management & Hospital Information System**
*Foundation prototype · v0.1 · August 2026*

## 1. Vision

A secure, scalable, interoperable, Ghana-focused **national healthcare digital infrastructure platform** — not a hospital ERP. One shared data model, identity model, permission model, audit model, interoperability layer, synchronization engine and national administrative hierarchy, supporting **Web + PWA + Windows + Android + iOS + local server + cloud**, operating **online + offline + hybrid** (spec §89, §99, §172).

## 2. Scope of this build (Phase 1 + demo surface)

| Area | Included in this prototype |
|---|---|
| Foundation | Auth + RBAC, 16 regions / 261 districts master data, facility registry, patient registration + MPI, core DB, API-first, audit |
| Clinical demo | Appointments, queue, encounters/triage, notes, lab orders + results, prescriptions + dispensing, admissions, immunizations, referrals, invoices |
| Public portal | Home, facility directory search, facility profiles, login |
| Admin UI | Dashboard, queue board, patients, registration (offline-capable), patient record, appointments, devices/audit/sync admin |
| Offline-first | IndexedDB outbox + idempotent `/sync/mutations` replay, connection/sync status UI |
| Patient portal | Minimal: own record, appointments, labs, bills |

## 3. Out of scope for this prototype (planned phases)

Windows desktop, Android/iOS apps, PACS/DICOM, telemedicine video, DHIMS/LHIMS/SORMAS/GhiLMIS adapters, GIS mapping, reporting engine, AI services, procurement/inventory, HR modules, facility edge server packaging.

## 4. Non-functional requirements (this build)

- **Performance**: sub-second common API responses; paged lists; async audit writes.
- **Security**: JWT auth, bcrypt password hashing, RBAC + scope enforcement, rate limiting, structured errors (no internals leaked), audit trail.
- **Portability**: SQLite for dev; PostgreSQL target (schema portable, no SQLite-only types).
- **Synthetic data only**: every seeded record is fictional and clearly marked DEMO (spec §155).

## 5. Success criteria (this build)

1. A user can register a patient with MPI duplicate detection and no silent merges.
2. A clinician can open an encounter, order a lab, write a prescription, add notes.
3. A facility admin sees live dashboard aggregates and a working queue board.
4. A public user can search the national facility directory across all 16 regions.
5. Offline writes queue locally and replay idempotently on reconnect (no duplicates).
