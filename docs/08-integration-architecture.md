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
| GhiLMIS | logistics/stock | API + stock-level snapshot sync (requisition sync follows the same queue) |
| HRIMS | workforce | API + monthly workforce register sync |
| NHIS / insurance | eligibility, claims | gateway with pending-verification states |
| Payment providers | MOMO/card | ✅ abstraction layer (§37) — `PaymentProvider` contract + registry (`payments/providers.ts`): initiate/confirm per provider, only a confirmed SUCCESS moves the invoice; the SIMULATED provider (always clearly labeled, test-only) exercises the whole flow, real MOMO/card providers plug in behind the same contract; idempotent attempts (`PaymentAttempt`, `POST /invoices/:id/payments`, `POST /payments/webhook/:provider`, 7 API tests) |

## 3. Isolation guarantees

- **Independent queues** per integration (DHIMS queue, SORMAS queue, …) — one failure never blocks others (spec §128).
- Each integration has its own auth, encryption, retry, error queue, reconciliation and audit.
- External outage → local clinical operations continue; status is shown truthfully in the system-health dashboard (spec §158) — a connection is never displayed as operational unless verified.

## 4. Implemented: DHIMS2 + SORMAS + GhiLMIS + HRIMS adapters on a shared delivery engine

Four adapters ship on a shared **integration delivery engine** (`apps/api/src/modules/integrations/`):

- **Engine** (`engine.ts`): one **independent, idempotent queue per adapter** (`IntegrationDelivery` rows keyed by idempotencyKey — one logical submission per period/org-unit or case range), retried with exponential backoff (1s→60s) by the integration sweep, `FAILED` surfaced after max attempts but never deleted (spec §166). Re-queueing the same submission returns the existing delivery (`duplicated: true`).
- **DHIMS2** (`dhims2.ts`): monthly `dataValueSet` submissions computed **live from platform records** (reuses the report builder's indicator computation — docs/14 §3), org unit = facility code (or scope label), JSON/CSV export, `POST /api/dataValueSets` with basic auth, acknowledgement id captured.
- **SORMAS** (`sormas.ts`): disease-case events from the surveillance register mapped to SORMAS case-import JSON (disease enums with `OTHER` fallback so the queue never blocks), `POST /api/cases` with basic auth.
- **GhiLMIS** (`ghilmis.ts`): monthly commodity **stock-level snapshots** computed live from the inventory register (quantity, reorder level, batch/expiry, derived OK/LOW/OUT status — docs/08 §2's logistics/stock pattern), `POST /api/stock-levels` with basic auth, acknowledgement id captured. The docs' requisition-sync half rides the same queue once the requisition workflow lands in the API.
- **HRIMS** (`hrims.ts`): monthly **workforce register snapshots** computed live from the staff directory (staff number, role, licence, unit placement, employment status, head-of-unit flag), `POST /api/staff` with basic auth, acknowledgement id captured.
- **API** (`routes.ts`): `GET /integrations/status` (truthful per-adapter state), `GET /integrations/deliveries` (+ `/:id` for the payload as sent), `POST /integrations/{dhims2,sormas,ghilmis,hrims,nhis,etracker,lhims}/queue` (dry-run preview or queue), `POST /integrations/dhims2/queue-all` (per-facility submissions for national/regional scopes), `POST /integrations/sweep`.
- **UI**: `/app/integrations` — adapter cards for all seven adapters (configured, pending/delivered/failed, last ack, last error), queue forms with dry-run, CSV/JSON downloads, delivery log with payload drawer.
- **Configuration** (env): `INTEGRATION_DHIMS2_URL/USERNAME/PASSWORD`, `INTEGRATION_SORMAS_URL/USERNAME/PASSWORD`, `INTEGRATION_GHILMIS_URL/USERNAME/PASSWORD`, `INTEGRATION_HRIMS_URL/USERNAME/PASSWORD`, `INTEGRATION_SWEEP_INTERVAL_MINUTES`, `INTEGRATION_MAX_ATTEMPTS`. Not configured ⇒ submissions queue and the status page says so — local clinical operations never depend on a national system being up (spec §127, §128).

**NHIS** (`nhis.ts`): monthly **claims submissions** computed live from the
platform's SUBMITTED insurance claims (claim number, patient name + NHIS
number, scheme, service date, itemized amounts — never manual re-entry),
`POST /api/claims` with basic auth, acknowledgement id captured, plus
`POST /integrations/nhis/queue` (dry-run preview or queue) and
`/integrations/nhis/export` (json|csv). A claim's own status is untouched
until the national decision lands through the platform's claim-decision flow;
the delivery row is the pending-verification state.

**DHIMS Tracker / eTracker** (`etracker.ts`): monthly **client-cohort
submissions** for longitudinal tracking with identity resolution — every
woman with antenatal/delivery/postnatal activity in the period becomes one
client row carrying her identifiers (platform client id, MRN, Ghana Card,
NHIS number, phone — the keys the national registry uses to resolve the
person across facilities) plus her program summary (ANC visits + latest risk,
delivery outcomes, PNC visits), `POST /api/clients` with basic auth,
acknowledgement id captured, plus `POST /integrations/etracker/queue`
(dry-run preview or queue) and `/integrations/etracker/export` (json|csv).

**Payments** (`modules/payments/`): the **provider abstraction layer** (spec
§37) — invoices are paid through an idempotent provider attempt
(`PaymentAttempt` keyed by idempotencyKey), initiated via
`POST /invoices/:id/payments` (defaults to the remaining balance, never
over-charges), confirmed via `POST /payments/webhook/:provider` where only a
confirmed **SUCCESS** updates the invoice's `paidAmount`/status
(partial/full) — a payment is never assumed. `GET /payments/providers`
reports configuration truthfully. The **SIMULATED** provider ships as the
always-available test/demo provider (explicitly labeled, never real money);
real MOMO/card providers implement the same contract behind env config.

**LHIMS** (`lhim.ts`): monthly **FHIR R4 exchange bundles** for
patient/demographics/encounters/results exchange — every patient with
activity in the period becomes a `Patient` resource carrying the MPI
identity-resolution identifiers (MRN, Ghana Card, NHIS number, passport),
their encounters map to `Encounter` resources (FHIR status/class mapping,
subject + period + reason), and verified lab results to `DiagnosticReport`
resources (final/preliminary status, conclusion + reference range + critical
flag) — all in one `Bundle` of type `transaction`, `POST /api/fhir` with
basic auth (content-type `application/fhir+json`), acknowledgement id
captured, plus `POST /integrations/lhims/queue` (dry-run preview or queue)
and `/integrations/lhims/export` (json bundle or flattened CSV).
