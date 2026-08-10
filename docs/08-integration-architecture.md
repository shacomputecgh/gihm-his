# 08 — Integration Architecture

## 1. Principle (spec §49, §168)

GIHM-HIS **coexists** with existing national systems. Where an existing system remains authoritative for a function, we integrate with it rather than build an unofficial replacement. The platform must keep operating when external systems are unavailable (spec §127).

## 2. Target adapters (future phases)

| System | Purpose | Pattern |
|---|---|---|
| DHIMS II | facility/district/region reporting | indicator mapping + scheduled export, aggregation pipeline |
| DHIMS Tracker / eTracker | longitudinal tracking | identity resolution |
| LHIMS | patient/demographics/encounters/results exchange | FHIR/HL7 mapping + MPI |
| SORMAS | surveillance events, cases, outbreaks | event-driven webhook + poll |
| GhiLMIS | logistics/stock | API + requisition sync |
| HRIMS | workforce | API |
| NHIS / insurance | eligibility, claims | gateway with pending-verification states |
| Payment providers | MOMO/card | abstraction layer (§37) — never hard-code one provider |

## 3. Isolation guarantees

- **Independent queues** per integration (DHIMS queue, SORMAS queue, …) — one failure never blocks others (spec §128).
- Each integration has its own auth, encryption, retry, error queue, reconciliation and audit.
- External outage → local clinical operations continue; status is shown truthfully in the system-health dashboard (spec §158) — a connection is never displayed as operational unless verified.

## 4. In this prototype

No live adapters are connected (synthetic data only). The **sync engine** (`/sync/mutations` + `MutationLog`) is the same queued, idempotent, audited pattern the future DHIMS/SORMAS adapters will use, which is the intended architectural hand-off.
