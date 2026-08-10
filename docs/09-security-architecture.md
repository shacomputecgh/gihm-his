# 09 — Security Architecture

## 1. In place today

| Control | Implementation |
|---|---|
| Authentication | JWT (HS256, secret from env), bcrypt password hashing (cost 10) |
| Rate limiting | `@fastify/rate-limit` global + 10/min on login |
| RBAC | role-permission preHandlers + data scoping (see `docs/06`) |
| Audit trail | `AuditLog` with actor, role, entity, before/after JSON, device, IP |
| Structured errors | internal details hidden in production; user-friendly reference-style messages (spec §139) |
| CORS | origin allow-list from env |
| Input validation | required/max-length/range checks on all write endpoints |
| SQL injection | Prisma parameterized queries |
| Secrets | `.env` gitignored; `JWT_SECRET` must be replaced outside demo |

## 2. Protections by design (spec §65–66)

- **Zero trust**: authorization is re-verified on every request; facility network membership grants nothing by itself.
- **Scope enforcement** prevents cross-region/facility data access even with valid tokens.
- **MPI**: duplicates are flagged, never auto-merged; identity verification workflows exist in the record.
- **Offline**: client outbox lives in IndexedDB; server accepts only authorized mutations; devices are registrable/blockable.

## 3. Required before production (gap list)

- HTTPS/TLS + HSTS (termination at load balancer/nginx).
- Encryption at rest (DB volume encryption; Postgres `pgcrypto` where needed) and encrypted backups.
- MFA for privileged accounts; device management policies; session revocation list.
- WAF, IDS, security monitoring, security incident workflows (spec §157).
- OAuth 2.0 / OIDC + scopes + mTLS for machine-to-machine (spec §159).
- Penetration testing against OWASP Top 10 (injection, XSS, CSRF, SSRF, uploads, session hijacking).

## 4. Privacy (spec §63–64)

Designed for the **Data Protection Act, 2012 (Act 843)**: consent flags with recorded timestamps, purpose-limited access, data minimization, retention policies (configurable, never auto-delete clinical records without policy), breach management, and auditability of every correction.
