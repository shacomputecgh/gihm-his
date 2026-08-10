# 17 — Cloud Deployment Architecture

## 1. Topology (spec §87)

```
Users → CDN/WAF → Load balancer → Application services (horizontal scale-out)
      → API gateway → Databases (primary + replica) → Analytics
```
Requirements: horizontal scaling, auto-scaling, failover, backups, disaster recovery, multi-zone deployment.

## 2. This repo's deployment

- **docker-compose.yml**: `web` (nginx serving the built SPA + `/api` proxy) + `api` (Fastify, SQLite volume by default). A commented `db` service documents the PostgreSQL production path.
- **apps/api/Dockerfile** + **apps/web/Dockerfile** multi-stage build.
- Dev runs `npm run dev` (API :4000, Web :5173 with Vite proxy).

## 3. Production data path

1. Switch `prisma/schema.prisma` datasource `provider` to `postgresql` (schema is portable — no SQLite-only types).
2. Point `DATABASE_URL` at PostgreSQL (primary + replica for high availability, spec §133).
3. Run `npx prisma migrate deploy`.
4. Terminate TLS at the load balancer/WAF; HSTS; encrypted volumes and backups; off-site DR.

## 4. Hosting / data residency (spec §87)

Hosting **must be configurable** to satisfy Ghanaian government/data-residency requirements. The platform does not assume a foreign cloud provider is automatically appropriate for government health data — deployment is provider-agnostic (container images), so residency choices stay with the Ministry/authority.
