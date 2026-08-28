#!/usr/bin/env bash
# =============================================================================
# GIHM-HIS facility edge backup (docs/16 §5, deploy/edge/README.md)
#
# WAL-safe: checkpoints SQLite's write-ahead log inside the container before
# copying the database file, so the copy is a consistent snapshot even mid-write.
# Usage:  ./backup.sh [keep=N]
#   keep   number of backups to retain (default 14)
#
# Optional at-rest encryption: install age (https://age-encryption.org) and set
# AGE_RECIPIENT in the environment to encrypt every backup.
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info() { echo -e "${GREEN}[backup]${NC} $*"; }
warn() { echo -e "${YELLOW}[backup]${NC} $*"; }

KEEP="${KEEP:-14}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_PATH="/app/data/edge.db"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

command -v docker >/dev/null 2>&1 || { echo "[backup] Docker is required." >&2; exit 1; }
mkdir -p "$BACKUP_DIR"

# --- 1. checkpoint the WAL ------------------------------------------------
# node:sqlite is built into Node 22+ (flag-gated on some builds). If it is
# unavailable the copy proceeds anyway — the WAL may hold recent writes, which
# a checkpointed backup would include; document the trade-off in the README.
# Note: '$DB_PATH' is expanded host-side into the container command — the
# container does not know DB_PATH.
if docker compose exec -T api node --experimental-sqlite -e "
  const { DatabaseSync } = require('node:sqlite');
  const d = new DatabaseSync('$DB_PATH');
  d.exec('PRAGMA wal_checkpoint(TRUNCATE)');
  d.close();
" 2>/dev/null; then
  info "WAL checkpointed."
else
  warn "WAL checkpoint skipped (node:sqlite unavailable) — copying the file as-is."
fi

# --- 2. copy the database file out ----------------------------------------
DEST="$BACKUP_DIR/edge-$STAMP.db"
if ! docker compose exec -T api sh -c "cp '$DB_PATH' /backups/edge-$STAMP.db"; then
  echo "[backup] copy failed." >&2
  exit 1
fi

# --- 3. optional at-rest encryption ---------------------------------------
if [ -n "${AGE_RECIPIENT:-}" ]; then
  if command -v age >/dev/null 2>&1; then
    age -r "$AGE_RECIPIENT" -o "$DEST.age" "$DEST" && rm -f "$DEST"
    DEST="$DEST.age"
    info "Encrypted with age."
  else
    warn "AGE_RECIPIENT is set but age is not installed — backup left unencrypted."
  fi
fi

# --- 4. rotation ------------------------------------------------------------
PRUNED=0
while [ "$(ls -1t "$BACKUP_DIR"/edge-*.db* 2>/dev/null | wc -l)" -gt "$KEEP" ]; do
  OLDEST="$(ls -1t "$BACKUP_DIR"/edge-*.db* 2>/dev/null | tail -n 1)"
  rm -f "$OLDEST"
  PRUNED=$((PRUNED + 1))
done

SIZE="$(du -h "$DEST" | awk '{print $1}')"
info "Backup written: $DEST ($SIZE), retaining last $KEEP." 
[ "$PRUNED" -gt 0 ] && info "Pruned $PRUNED old backup(s)."
