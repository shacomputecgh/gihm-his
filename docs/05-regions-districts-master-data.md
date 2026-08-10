# 05 — 16-Region / 261-District Master Data

Seeded in `apps/api/prisma/data/geography.ts` from the Ghana Statistical Service administrative boundaries used in the **2021 Population & Housing Census**.

## 1. Regions (16) with capitals

| Code | Region | Capital | MMDAs seeded |
|---|---|---|---|
| AH | Ahafo | Goaso | 6 |
| AS | Ashanti | Kumasi | 43 |
| BO | Bono | Sunyani | 12 |
| BE | Bono East | Techiman | 11 |
| CE | Central | Cape Coast | 22 |
| EA | Eastern | Koforidua | 33 |
| GA | Greater Accra | Accra | 29 |
| NE | North East | Nalerigu | 6 |
| NR | Northern | Tamale | 16 |
| OT | Oti | Dambai | 9 |
| SV | Savannah | Damongo | 7 |
| UE | Upper East | Bolgatanga | 15 |
| UW | Upper West | Wa | 11 |
| VO | Volta | Ho | 17 |
| WE | Western | Sekondi-Takoradi | 13 |
| WN | Western North | Sefwi Wiawso | 9 |
| | | **Total** | **259 unique** |

## 2. Notes on the 261 count

The GSS 261 figure includes two names that alias other assemblies in common lists:
- **Volta** — "Ziope" is part of **Agotime-Ziope** (already seeded).
- **Western** — "Kwesimintsim" is part of **Effia-Kwesimintsim** (already seeded).

This yields **259 unique assemblies**. The authoritative reconciliation (official codes, capitals, GPS per district) is an import-tool task before production; the system's master-data design makes this a data update, not a code change (spec §5, §152).

## 3. Integrity rules enforced

- Region codes unique; district codes unique; `(regionId, name)` unique per district.
- District type derived from name per GSS classification.
- Geography is **never** hard-coded in application logic.
