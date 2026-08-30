#!/usr/bin/env bash
# ============================================================================
#  GES-School-MIS Mobile — Cloud Release Build (EAS)
#  Uses Expo Application Services for cloud builds (no local SDK needed)
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MOBILE_DIR="$REPO_ROOT/mobile"

# Read version from root package.json
VERSION=$(node -e "console.log(require('$REPO_ROOT/package.json').version)")

echo "═══════════════════════════════════════════════════"
echo "  GES-School-MIS Mobile — v$VERSION (EAS Cloud)"
echo "═══════════════════════════════════════════════════"

cd "$MOBILE_DIR"

# ── Pre-build checks ──────────────────────────────────────────
echo ""
echo "Running pre-build checks…"

# Ensure dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "  → Installing dependencies…"
    npm install
fi

# Ensure expo prebuild is fresh
echo "  → Running expo prebuild…"
npx expo prebuild --clean

# ── Step 1: Build APK (preview — for direct install) ──────────
echo ""
echo "[1/2] Building APK (preview)…"
npx eas-cli build --platform android --profile preview --non-interactive
echo "  ✓ APK build submitted to EAS"

# ── Step 2: Build AAB (production — for Play Store) ───────────
echo ""
echo "[2/2] Building AAB (production)…"
npx eas-cli build --platform android --profile production --non-interactive
echo "  ✓ AAB build submitted to EAS"

# ── Summary ────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
echo "  Cloud builds submitted!"
echo ""
echo "  Monitor builds at: https://expo.dev"
echo ""
echo "  Once complete:"
echo "    • APK  → direct install on Android phones"
echo "    • AAB  → Google Play Store upload"
echo "═══════════════════════════════════════════════════"
