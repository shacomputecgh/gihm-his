# 22 — Implementation Roadmap

Mirrors spec §164. **Phase 1 + a demo of Phases 2–3 are shipped in this repo.**

| Phase | Scope | Status |
|---|---|---|
| **1 — Foundation** | auth, RBAC, 16 regions/261 districts, facility registry, users, audit, patient registration + MPI, core DB, API-first, sync foundation | ✅ implemented |
| **2 — Clinical** | appointments, queue, OPD/triage/EMR, inpatient, pharmacy, laboratory, imaging | ⚠️ core implemented (imaging is data-model ready only) |
| **3 — Hospital operations** | billing, insurance architecture, inventory, procurement, HR, assets, theatre, maternity, emergency, ambulance | ⚠️ billing demo only; rest pending |
| **4 — Public health** | CHPS, immunization registry + reminders, surveillance, referrals, DHIMS/SORMAS/GhiLMIS/HRIMS adapters | ⚠️ seeds + disease case; adapters pending |
| **5 — National platform** | regional/district/national dashboards, GIS, analytics, reporting, data governance | ⚠️ scoped dashboard + docs; builder pending |
| **6 — Omnichannel/edge** | Windows desktop, Android, iOS, PWA hardening, facility edge, regional/district edges, advanced sync + conflict resolution, device management | PWA offline ✅; native + edge pending |
| **7 — Advanced** | AI (documentation assist, duplicate detection, forecasting — always with "AI-generated — requires professional verification" labelling, spec §82–83), predictive analytics, telemedicine, advanced interoperability | pending |

## Acceptance gates (spec §163)

A module is not complete because its interface exists — it must pass functional, security, data-integrity, offline, synchronization and acceptance testing (see `docs/19`).

## Immediate next steps

1. Wire the referral workflow + immunization reminders end-to-end (Phase 2/4 quick wins).
2. E2E tests with Playwright (registration → OPD → prescription → lab → discharge → billing).
3. Report builder + DHIMS indicator mapping (Phase 4/5).
4. Facility edge packaging + Windows client evaluation (Tauri/.NET) with the shared sync protocol.
