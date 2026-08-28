#!/bin/sh
# GIHM-HIS API container entrypoint.
#
# The API does not bootstrap its own database (see deploy/edge/windows/
# backend.ps1 — that path also runs `prisma db push` explicitly). For SQLite
# (file:) deployments — the facility edge (deploy/edge) and the foundation
# compose quick-start — a fresh volume must have its schema applied before the
# first query, and an upgraded image must self-migrate. `prisma db push` is
# idempotent and fails safely (no --accept-data-loss), so boot is the right
# place for both. Postgres deployments follow the documented production path
# (docs/17: `prisma migrate deploy` run by the operator) and are left untouched.
set -e
case "$DATABASE_URL" in
  file:*) npx prisma db push --skip-generate ;;
esac
exec npx tsx src/server.ts
