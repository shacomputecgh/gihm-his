#!/usr/bin/env bash
# ============================================================================
#  GIHM-HIS Mobile — Local Release Build
#  Requires: JDK 17, Android SDK 34, Gradle (auto-managed by Expo prebuild)
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MOBILE_DIR="$REPO_ROOT/mobile"
RELEASE_DIR="$MOBILE_DIR/releases"

VERSION=$(node -e "console.log(require('$REPO_ROOT/package.json').version)")

echo "═══════════════════════════════════════════════════"
echo "  GIHM-HIS Mobile — v$VERSION (Local Build)"
echo "═══════════════════════════════════════════════════"

cd "$MOBILE_DIR"
mkdir -p "$RELEASE_DIR"

echo ""
echo "[1/5] Generating app icon…"
ICON_SCRIPT="$REPO_ROOT/scripts/generate-app-icon.mjs"
if [ -f "$ICON_SCRIPT" ]; then
    node "$ICON_SCRIPT" --platform mobile --output "$MOBILE_DIR/assets"
else
    echo "  ⚠ Icon script not found, skipping."
fi

echo ""
echo "[2/5] Installing dependencies…"
if [ ! -d "node_modules" ]; then npm install; fi

echo ""
echo "[3/5] Running expo prebuild…"
npx expo prebuild --platform android --clean

echo ""
echo "[4/5] Building APK…"
cd android && ./gradlew assembleRelease
APK_PATH=$(find app/build/outputs/apk/release -name "*.apk" | head -1)
APK_OUT="$RELEASE_DIR/GIHM-HIS-${VERSION}.apk"
cp "$APK_PATH" "$APK_OUT"
echo "  ✓ APK: $APK_OUT"

echo ""
echo "[5/5] Building AAB…"
./gradlew bundleRelease
AAB_PATH=$(find app/build/outputs/bundle/release -name "*.aab" | head -1)
AAB_OUT="$RELEASE_DIR/GIHM-HIS-${VERSION}.aab"
cp "$AAB_PATH" "$AAB_OUT"
echo "  ✓ AAB: $AAB_OUT"

cd "$REPO_ROOT"
echo ""
echo "═══════════════════════════════════════════════════"
echo "  Local build complete!"
echo "    $APK_OUT"
echo "    $AAB_OUT"
echo "═══════════════════════════════════════════════════"
