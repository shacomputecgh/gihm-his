# GIHM-HIS — Run Instructions

## Quick Start

```bash
# Install dependencies (already done in this workspace)
npm install

# Start both API + Web dev server
node .freebuff/start-all.js
```

## Servers

| Service | Port | URL | PID file |
|---------|------|-----|----------|
| **API backend** (Fastify + SQLite) | 4000 | http://localhost:4000 | `.freebuff/api-server-pid.txt` |
| **Vite dev server** (React SPA) | auto | http://localhost:5176 | `.freebuff/preview-*-pid.txt` |

## Demo Accounts (Password: Demo@123)

| Role | Email | Scope |
|------|-------|-------|
| Staff (Korle-Bu) | hospital@demo.gh | FACILITY |
| Doctor (Korle-Bu) | doctor@demo.gh | FACILITY |
| Regional Director | regional@demo.gh | REGIONAL |
| National Admin | admin@demo.gh | NATIONAL |
| Private Hospital Admin | private-admin@demo.gh | FACILITY |
| Patient | patient@demo.gh | PATIENT |

## Build Targets

### Web (PWA)
```bash
cd apps/web && npx vite build
# Output: apps/web/dist/ (60 precached entries)
```

### Desktop — Tauri v2 (Windows)
```bash
# Prerequisites: Rust 1.98+ (installed via rustup)
export PATH="$HOME/.cargo/bin:$PATH"

# NSIS installer (.exe)
cd desktop && npx tauri build --bundles nsis
# Output: desktop/src-tauri/target/release/bundle/nsis/GIHM-HIS Desktop_0.1.0_x64-setup.exe

# MSI installer
cd desktop && npx tauri build --bundles msi
# Output: desktop/src-tauri/target/release/bundle/msi/GIHM-HIS Desktop_0.1.0_x64_en-US.msi
```

### Mobile — Capacitor v8
```bash
cd apps/web
npx cap sync           # Sync web assets to Android + iOS
npx cap open android   # Open in Android Studio
npx cap open ios       # Open in Xcode (macOS only)
```

## CORS Origins

The API allows these origins for mobile/desktop:
- `http://localhost:5173` (web dev)
- `https://localhost` (Capacitor)
- `capacitor://localhost` (Capacitor iOS)

## Project Structure

```
apps/
  web/          # React SPA (Vite + Tailwind v4 + PWA)
  api/          # Fastify REST API (Prisma + SQLite)
desktop/
  src-tauri/    # Tauri v2 desktop shell
```

## Features

### Hospital Modules (33+ pages)
- **Clinical**: Dashboard, Queue, Patients, Register, Appointments, Pharmacy, Lab, Admissions, Immunizations, Blood Bank, Theatre, Radiology, Telemedicine, Referrals, Beds
- **Operations**: Stock & Inventory, Insurance & Claims, Billing, Fixed Assets, Ambulances
- **Analytics**: Surveillance, Directorate, Reports, Facility Map (Leaflet GIS)
- **Tools**: Dr. August AI, AI Services, Clinical Guidelines, Drug Database, Disease Reference
- **System**: Integrations, Admin & Sync, Developer Mode, Performance Monitor, Cache Strategy

### Technical
- **Code-splitting**: React.lazy + Suspense (542 kB core → 30 lazy chunks)
- **Dark mode**: Toggle in header, respects system preference, persists to localStorage
- **Offline-first**: Service worker (Workbox), IndexedDB sync, conflict resolution
- **PWA**: Installable, precached (60 entries), background sync
- **Desktop**: Tauri v2 with native tray, auto-update, offline device identity
- **Mobile**: Capacitor v8 with 13 plugins (camera, geolocation, notifications, etc.)

## Tests

```bash
cd apps/web && npx vitest run       # 68 files, 739 tests
cd apps/web && npx tsc --noEmit     # TypeScript check
```
