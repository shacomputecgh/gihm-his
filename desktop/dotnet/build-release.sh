#!/usr/bin/env bash
# ============================================================================
#  GES-School-MIS Desktop — Release Build (bash)
#  Delegates to the cross-platform Node.js build script.
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG="${1:-Release}"
VERSION="${2:-}"

VERSION_FLAG=""
[ -n "$VERSION" ] && VERSION_FLAG="--version $VERSION"

node "$SCRIPT_DIR/build-release.mjs" --config "$CONFIG" $VERSION_FLAG
