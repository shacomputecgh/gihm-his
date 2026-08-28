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
