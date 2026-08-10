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

## 4. Data quality engine (spec §81, future)

Planned detections: impossible dates/ages, duplicate patients, inconsistent pregnancy data, invalid diagnoses, missing mandatory fields, duplicate reports, statistical anomalies, reporting delays — classified Error/Warning/Informational, and never allowed to block clinical care.
