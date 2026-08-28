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

## 3. Implemented (report builder + DHIMS-II mapping)

- **Report builder** (`/reports`): a DHIMS-II indicator catalog (`/reports/indicators`) covering Outpatient (1A–1C), Inpatient (4A–4E), Maternity & RH (2A–2I), Immunization (3A–3E), Laboratory (6A–6C), Blood bank (8A–8B), Public health (12A–12B), Referrals & transport (10A–10C) and Finance (7A–7B) — values computed **live from platform records**, never re-entered manually (spec §50). Indicators whose data source is not yet collected on the platform are returned with `collected: false` (e.g. ANC registrations) rather than fabricated.
- **`GET /reports/summary`**: indicator values for a date range (≤366 days, scoped to the caller), with `groupBy=facility|district|region` roll-ups (capped at 60 groups) for drill-down.
- **`GET /reports/completeness`**: per-facility reporting completeness — which facilities in scope recorded any clinical activity in the period (OPD, admissions, labs, disease cases, immunizations) plus an overall completeness %.
- **CSV export** (`/reports/export?report=indicators|completeness`, single table or indicator × group matrix) with formula-injection neutralisation.

## 4. Implemented (anomaly detection, spec §50)

- **`GET /reports/anomalies`**: weekly z-score anomaly detection on the live-computed indicator series (same code as the report builder — `modules/reports/compute.ts`). Each week in the window is bucketed and compared against the series mean; a week deviating ≥2σ is flagged `medium`, ≥3σ `high`. Detection is honest: indicators with fewer than 6 non-null weeks, or zero variance, are reported as analyzed-but-unflagged rather than fabricated. Windows are capped at 16 weekly buckets (≈112 days); shorter periods just score fewer indicators.
- **Aggregate-only**: like every report, anomaly results carry no patient-identifiable rows and respect the caller's scope exactly (facility/region/national). Runs are audited (`report.anomalies`).
- **UI**: the Reports page shows an “Anomaly detection” card (only for periods ≥3 weeks) with a summary (analyzed/anomalies/high), the flagged weeks per indicator (value vs expected, σ, severity), and the method note.

## 5. Implemented (scheduled reports, spec §149)

- **Scheduled-report subscriptions** (`/reports/schedules`): an authorised recipient list (comma-separated emails), a cadence (daily / weekly / monthly / quarterly / annual), run time, and — for weekly / monthly+ cadences — the day of week or day of month. The scope is **snapshotted at creation**, so a schedule keeps working even if the creator's role later changes (aggregate-only, exactly like the live report builder).
- **The report sweep** (server, 60 s): runs every active subscription whose `nextRunAt` is due, computes the period's report **live from platform records** (summary / completeness / anomaly detection), and emails it to the recipients via the settings-driven SMTP channel (`lib/mail.ts`). Without SMTP configured a run is recorded as `skipped` in the delivery log — never a crash. Runs advance `nextRunAt` using pure cadence math (unit-tested); a manual “Run now” endpoint (`/reports/schedules/:id/run`) triggers a run out of band.
- **Delivery log** (`/reports/schedules/deliveries`): who got what, when, and the outcome (sent / skipped / failed), plus a per-schedule CSV download of the latest period. Managing schedules requires the `manage_scheduled_reports` permission; viewing requires `view_reports` / `view_dashboard`.
- **Delivery retries** (docs/22 Phase 5): a failed/skipped delivery is never dropped silently — a dedicated retry sweep (server, 30 min) rebuilds the report for the stored period and re-fans out to the recipients with exponential backoff (30 min, 1 h, 2 h, … capped at 24 h) until success or `reports.retryMaxAttempts` (default 4, setting-editable like `alerts.retryMaxAttempts`). A successful retry flips the delivery to `sent` and refreshes the schedule's last status without disturbing the cadence; repeated failure increments `attempts` and the backoff, and the row ages out of the retry set at max attempts. A manual `POST /reports/schedules/deliveries/:id/retry` retries a single delivery out of band (audit-logged `report.delivery.retry`); the UI's delivery log offers a per-row Retry action and shows the attempt count.
- **UI**: the Reports page’s “Scheduled reports” card lists subscriptions (next/last run, status), creates/pauses/resumes/deletes, runs now, and shows the recent delivery log with retry actions.

## 6. Implemented (GIS / national map)

- **`GET /geography/map`**: every in-scope facility that carries GPS coordinates, plus a 30-day activity aggregate (encounters + admissions + lab tests + disease cases) for marker sizing. Aggregate-only and scope-filtered exactly like the reports — a facility user sees their own facility; national sees all 43 demo facilities across the 16 regions. Runs are audited (`geography.map`).
- **UI**: the “Facility map” page (`/app/gis`) renders the points on a Leaflet map (OpenStreetMap tiles — zero API key), coloured by ownership (GHS / government / private / teaching / mission) and sized by activity, with region / facility-type / sector / active-only filters, a legend, and popups that link to the public facility profile.
- **Choropleth overlay**: a thematic area layer (Markers ⇄ Choropleth toggle) that shades regions or districts by a chosen indicator — 30-day activity, bed capacity, or facilities in scope. The platform carries no GeoJSON boundary data, so the honest substitute shades each area’s bubble at its facility **centroid** (mean GPS), aggregated live from the same scope-filtered, cap-disclosed map payload the markers render (the overlay always matches what the map is showing — filters apply to both). Values are split into **quantile buckets** (5) with a colour ramp + range legend and per-bucket counts; bubbles pop up the area aggregate (facilities, activities, beds). The pure aggregation/bucketing lives in `lib/geoOverlay.ts` (unit-tested); the choropleth is aggregate-only, never patient-identifiable.

## 6a. Implemented (directorate dashboards, spec §57–§59)

- **`GET /directorate`**: the health-directorate overview — scope-aware roll-ups of service-delivery indicators (facilities, patients, encounters, admissions, pending labs, active prescriptions, immunizations, disease cases, referrals, revenue) plus a 30-day encounter count per node. Runs are audited and require `view_reports` or `view_dashboard`.
- **Scope-aware levels**: national users see all regions as nodes; regional users see their region's districts; district and facility users see their facilities directly. Each level is a single query with no extra parameters — the caller's role scope decides the view (spec §57).
- **Drill-down**: `?regionId=` drops a national user to that region's districts; `?districtId=` drops to that district's facilities. A regional user may drill into any district **of their own region** — a district outside the region is refused `403` rather than silently scoped (spec §57). Facility nodes are leaves (no drill-down affordance in the UI).
- **Aggregates only (spec §59)**: the national/regional layers never expose patient-identifiable data — node shape is strictly `id / name / code / type / metrics / recentEncounters`, and metrics are counts and sums. The same boundary is enforced by the UI's `/app/directorate` page (totals strip, drillable node cards, breadcrumb, scope footer).
- **Scope context**: the response also carries `regionName` / `districtName` / `facilityName` for the caller's own scope (regional → their region, district → their district + region, facility → their hospital; national → null), so the page can name the scope it is showing — district directors see "Kumasi Metropolitan overview" with a Ghana → Ashanti → Kumasi Metropolitan breadcrumb instead of a bare "Facility overview". `AuthUser` carries the same names (`regionName` / `districtName` / `facilityName`) for the Dashboard data-scope card and the Reports/GIS scope lines (`lib/format.ts` → `scopeLabel`).
- **Coverage**: 9 API tests (`apps/api/tests/directorate.test.ts` — roll-ups per scope, drill-down, 403 guards, aggregates-only shape, scope-name fields) + browser checks at all four scopes (`e2e/directorate-*-check.spec.ts`: facility, district, regional, national drill-down) + a district-session dashboard scope-card check (`e2e/dashboard-district-check.spec.ts`).

## 7. Planned (later phases)

- PDF/Excel/JSON/API output beyond CSV, and delivery to channels beyond email.
- The analytics layer: forecasting, real-time vs provisional vs finalized data distinction (spec §150).
