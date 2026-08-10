# 20 — Migration Strategy

## 1. Data import requirements (spec §152–153)

- **Formats**: CSV, Excel, JSON, XML, database imports, approved APIs.
- **Mapping interface**: legacy → GIHM fields (e.g. `Legacy Patient Name → Patient.full_name`).
- **Validation before publication**: duplicate codes, duplicate names, invalid parent, missing region/district, invalid coordinates; approval step required (spec §5, §152).

## 2. In this build

- The seed already implements validated bulk inserts for regions/districts/facilities (the import tool's logic will reuse these validators).
- Legacy **paper records**: scanning/OCR/categorization/verification/archive is a later phase — the platform does **not** require immediate conversion of every historical paper file (spec §154).
- **Demo data policy** (spec §155): development uses synthetic data only; every seeded record is fictional and marked DEMO. Real patient data is never used for demos.

## 3. GSS master-data reconciliation (first migration task)

1. Obtain the authoritative GSS 2021 boundary dataset (official district codes, capitals, GPS).
2. Import via the tool → diff against the seeded 259 entries → approve.
3. Future boundary changes (new districts, renames) are data imports, not code changes.

## 4. System transition (spec §168)

Ghana will run multiple systems during transition: `Existing systems → Integration layer → GIHM-HIS → Unified clinical+operational+reporting layer → National analytics`. Where a national system stays authoritative, we integrate rather than replace.
