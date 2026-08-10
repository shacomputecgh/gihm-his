# 16 — Edge Deployment Architecture

## 1. National + edge hybrid (spec §88)

```
National platform ⇄ Integration layer (DHIMS/LHIMS/SORMAS/GhiLMIS/HRIMS…)
        ↕
Regional/District services (optional regional edge)
        ↕
Facility edge server (multi-user hospitals)
        ↕  hospital LAN
Web · Windows workstations · tablets · phones
        ↕
Local encrypted database → outbox → secure sync
```

## 2. Facility edge server (spec §94, future phase)

Functions: encrypted local database, local API, local auth cache, sync engine, transaction queue, local reporting, device management, backup service. The hospital LAN keeps working with no internet (spec §111).

## 3. CHPS offline mode (spec §95)

CHPS needs **no physical server**: Android phone/tablet, laptop or PWA with encrypted local storage. A CHPS worker does a full day of community work offline, then auto-syncs (Test F in `docs/19`).

## 4. Regional/district edges (spec §126)

Optional; transactions should not unnecessarily traverse every layer. Aggregated reporting follows Facility → District → Region → National.

## 5. In this prototype

The **web/PWA client already implements the offline half** (outbox + idempotent sync). The Windows desktop client and edge-server packaging are Phase 6 scope.
