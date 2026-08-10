# 14 — Reporting Architecture

## 1. Aggregation pipeline (spec §50, §148)

```
EMR transactions → indicator mapping → validation → aggregation
  → Facility → District → Region → National
```
Aggregates roll up through the administrative hierarchy; drill-down runs National → Region → District → Facility → Department → Service.

## 2. Implemented

- **Dashboard aggregates** (`GET /dashboard/stats`): patients today, encounters, queue waiting, active admissions, pending labs, active prescriptions, invoices, revenue today, critical labs, patient counts + 7-day encounter trend — scoped to the caller (facility/region/national).
- **Scoping**: facility users see facility numbers; national users see national totals (aggregate only — no identifiable patient data exposed to national dashboards without authorization, spec §59).

## 3. Planned (later phases)

- Report builder (dataset → fields → filters → grouping → calculations → visualization → export) with PDF/Excel/CSV/JSON/API output (spec §80).
- Scheduled reports (daily/weekly/monthly/quarterly/annual) to authorized recipients only (spec §149).
- DHIMS II indicator mapping with reporting-completeness and anomaly detection (spec §50) — manual re-entry of data that already exists electronically is prohibited by design.
- Analytics layer: charts, maps, trends, forecasting, real-time vs provisional vs finalized data distinction (spec §150).
