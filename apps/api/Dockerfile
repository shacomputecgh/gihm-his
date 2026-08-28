# GIHM-HIS API (foundation container)
# NOTE: runs via tsx. A production phase should add a compiled build step.
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
RUN npm ci --workspace apps/api --include-workspace-root

COPY apps/api ./apps/api
WORKDIR /app/apps/api
RUN npx prisma generate

ENV NODE_ENV=production
EXPOSE 4000
# Entrypoint applies the Prisma schema on boot for SQLite deployments
# (facility edge + foundation quick-start) before starting the API.
CMD ["sh", "docker-entrypoint.sh"]
