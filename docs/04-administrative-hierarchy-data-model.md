# 04 — Ghana Administrative Hierarchy Data Model

## 1. Hierarchy (spec §3)

```
REPUBLIC OF GHANA
├── National (MoH · GHS · National Health Administration)
├── 16 Regions → Regional Health Directorates
│    └── 261 Districts → District/Municipal/Metropolitan Assemblies
│         └── Sub-districts → Communities → Health Facilities
└── National Health Data & Analytics layer
```

## 2. Data model

Stored as **configurable master data** — never hard-coded in application logic (spec §5).

| Table | Fields | Source |
|---|---|---|
| `Region` | code (unique), name, capital, gpsLat/Lng, status, effectiveDate | GSS 2021 boundaries |
| `District` | code (unique), name, type (METROPOLITAN/MUNICIPAL/DISTRICT), capital, regionId | GSS 2021 boundaries |
| `SubDistrict` | name, districtId | import tool (future) |
| `Community` | name, districtId, subDistrictId | import tool (future) |

## 3. Seed

- 16 regions seeded with capitals + approximate coordinates (`apps/api/prisma/data/geography.ts`).
- 259 unique MMDAs seeded (261 per GSS, minus two alias entries that duplicate other assemblies — documented in the seed file). District codes are generated (`AH-01` …); **before production, import the authoritative GSS dataset** with official codes, capitals and GPS via the import tool (spec §152).
- District `type` is derived from the name (Metropolitan / Municipal / District) matching GSS classification conventions.

## 4. Change management

- Geography is versioned master data (`status`, `effectiveDate`). Boundary renames/additions are data imports, **never code changes**.
- An import tool with validation (duplicate codes, invalid parent, missing region, invalid coordinates) and an approval step is specified in `docs/20-migration-strategy.md`.
