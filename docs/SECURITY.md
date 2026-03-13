# Security & Compliance Documentation

## 1. Current Security Control Map

| Area | Status | Current State |
|------|--------|---------------|
| Authentication | IMPLEMENTED | JWT access tokens, refresh token rotation, MFA foundation, account lockout, password reset flows |
| Access-token invalidation | IMPLEMENTED | DB-backed revoked-access-token registry plus user-level session cutoff now support immediate logout, logout-all, and password-reset invalidation |
| Tenant isolation | IMPLEMENTED | Tenant guards, service-layer scoping, request-scoped PostgreSQL session context, and tenant+user-aware PostgreSQL RLS policies are now live and PostgreSQL-verified |
| RBAC | IMPLEMENTED | Declarative `@Roles` metadata is live on the audited mutating controller surface and `RbacGuard` denial paths are test-covered |
| Subscription enforcement | IMPLEMENTED | Canonical plan limits are enforced server-side for client/case quotas and professional-tier bulk import/upload features |
| Security headers | IMPLEMENTED | Helmet is enabled in Nest; nginx adds CSP/security headers at the edge |
| CSRF protection | IMPLEMENTED (Bearer-only model) | API auth is `Authorization`-header based, no auth cookies are issued, and CORS `credentials` are disabled |
| Rate limiting | IMPLEMENTED | Nest throttling now uses Redis-backed storage for hardened production deployments, with in-memory fallback only outside that path |
| Data protection at rest | IMPLEMENTED | Sensitive fields are encrypted at rest; searchable email/phone/identifier lookups use blind indexes and exact-match semantics |
| Upload security | IMPLEMENTED | Uploads now enter a malware scan lifecycle, direct download/signed URL access is blocked until `clean`, and infected/failed scans remain blocked |
| Mobile scan access | PARTIAL | Mobile scan sessions now use a short-lived hashed token and expire after 30 minutes, but OCR/searchable-PDF processing and deeper upload-abuse coverage are not yet implemented |
| Trust-provider verification | PARTIAL | Live-capable ACSK/Diia/BankID exchange paths, signed callbacks, replay protection, retries, rechecks, and audit trail are implemented, but production credentials and staging proof are still missing |
| Monitoring | IMPLEMENTED (application layer) | `/health` and `/readiness` now surface database/Redis/worker/auth/billing health, and structured security alerts cover tenant violations, auth abuse, worker failures/backlogs, billing anomalies, and infected uploads |

## 2. Threat Model

### 2.1 Primary Threats

| Threat | Severity | Current Mitigation |
|--------|----------|-------------------|
| Cross-tenant leakage | MEDIUM | JWT tenant context, service-layer filters, and live PostgreSQL tenant+user RLS reduce the primary exposure; residual risk is regression if future tables/routes bypass the pattern |
| Broken RBAC | MEDIUM | Declarative role enforcement is live on the audited surface; residual risk is future endpoint drift if new mutating routes ship without `@Roles` |
| Subscription bypass | MEDIUM | Core client/case quotas and professional bulk operations are enforced server-side; residual risk is future commercial rule expansion beyond the current canonical limits |
| Token misuse after logout/role change | MEDIUM | Current role/plan is reloaded from DB, revoked access JWTs are denied by JTI, and user-level session cutoff invalidates older tokens immediately |
| Browser-origin CSRF | LOW | The current auth model is bearer-only with `Authorization` headers and CORS `credentials: false`, so browsers do not auto-attach auth state cross-site |
| Brute-force auth attacks | MEDIUM | Auth throttles and account lockout |
| Malicious file upload | MEDIUM | Uploads are now queued for malware scanning, blocked until clean, and infected/failed files remain non-servable; residual risk is operational misconfiguration of the scanner runtime |
| False trust-provider verification | MEDIUM | Async verification workflow, live-capable provider adapters, signed callbacks, and revocation states now exist; residual risk is incorrect upstream configuration or unproven staging contracts until real providers are exercised |
| PII disclosure at rest | LOW | Sensitive columns are encrypted at rest and logs/audit payloads are redacted; residual risk is limited to metadata exposure and misuse of decrypted application reads |

### 2.2 Attack Surfaces

1. Authentication endpoints and token lifecycle
2. Tenant-scoped CRUD endpoints for cases/clients/documents
3. Browser-origin state-changing requests
4. File upload and download paths
5. Signature/identity verification flows
6. Public tokenized mobile scan session endpoints

## 3. Implemented Controls

- ValidationPipe with strict DTO validation and production-safe error suppression
- Refresh token rotation and revocation
- Account disablement enforcement in JWT validation
- Service-layer actor scope checks for sensitive entity reads/writes
- Helmet runtime headers in Nest
- Nginx CSP/security headers at the frontend edge
- Audit logging and security-event logging
- Password reset flow with one-hour token expiry
- Current `role` and `subscriptionPlan` are resolved from the database during JWT validation
- Access tokens issued before the latest password change are rejected
- Revoked access JWTs are denied via persistent JTI registry
- User-level session cutoff invalidates all older access JWTs after logout-all or password reset
- Inactive organizations now block JWT-authenticated access
- Production throttling is Redis-backed and multi-instance safe when Redis is configured
- PII fields in organizations/users/clients are encrypted at rest, including searchable emails/phones/identifiers backed by blind indexes
- Audit logs and structured logging/Sentry payloads redact PII recursively before persistence/output
- Trust-provider verification jobs, retries, callbacks, revocations, and scheduled rechecks now have a persistent execution path and audit trail
- Provider callbacks now require provider-specific HMAC signatures with timestamp freshness and nonce replay protection, using Redis when available
- ACSK/Diia/BankID adapters now support configurable live upstream exchanges, while explicit stub mode remains available for local/dev operation
- File uploads now create persistent malware scan records, document scan state is operator-visible, and non-clean files are blocked from download/signed URL serving
- Mobile scan sessions now require a hashed one-time token, expire after 30 minutes, and reject finalized/expired sessions before page upload/finalize actions

## 4. Partial Or Missing Controls

- Real provider credentials/contract validation and staging evidence for Diia, BankID, and АЦСК
- OCR/searchable-PDF generation and abuse-focused test coverage for the new public mobile scan endpoints
- Live Sentry/on-call delivery rehearsal and staging outage drills for the new monitoring surface

## 5. Security Testing Baseline

### Verified Recently

- `npm run lint` -> PASS
- `npm test -- --runInBand src/trust-verification/services/trust-verification.service.spec.ts src/trust-verification/services/trust-verification-worker.service.spec.ts src/trust-verification/services/trust-provider.adapters.spec.ts src/trust-verification/services/trust-callback-auth.service.spec.ts` -> PASS (12/12)
- `npm run lint:backend -- --fix=false src/trust-verification/services/trust-verification.service.ts src/trust-verification/services/trust-provider.adapters.ts src/trust-verification/services/trust-callback-auth.service.ts src/trust-verification/controllers/trust-verification.controller.ts src/common/config/environment.validator.ts src/trust-verification/services/trust-verification.service.spec.ts src/trust-verification/services/trust-provider.adapters.spec.ts src/trust-verification/services/trust-callback-auth.service.spec.ts` -> PASS
- `npm test -- --runInBand src/database/migrations/harden-soft-delete-indexes-and-invitations.spec.ts` -> PASS
- `npm test -- --runInBand src/file-storage/services/malware-scanner.service.spec.ts src/file-storage/services/file-scan.service.spec.ts src/file-storage/services/file-storage.service.spec.ts` -> PASS
- `npm test -- --runInBand src/trust-verification/services/trust-verification.service.spec.ts src/trust-verification/services/trust-verification-worker.service.spec.ts` -> PASS
- `npm test -- --runInBand src/common/security/pii-protection.spec.ts src/auth/services/audit.service.spec.ts src/auth/services/auth.service.spec.ts src/clients/services/client.service.spec.ts` -> PASS
- `npm test -- --runInBand src/common/security/redis-throttler.storage.spec.ts src/auth/services/auth.service.spec.ts src/auth/strategies/jwt.strategy.spec.ts src/auth/guards/access-control.guards.spec.ts src/common/interceptors/rls.interceptor.spec.ts src/auth/services/audit.service.spec.ts` -> PASS
- `npm test -- --runInBand src/auth/guards/access-control.guards.spec.ts src/clients/services/client.service.spec.ts src/cases/services/case.service.spec.ts` -> PASS
- `npm test -- --runInBand src/common/interceptors/rls.interceptor.spec.ts` -> PASS
- `npm test -- --runInBand src/auth/services/auth.service.spec.ts` -> PASS
- `npm test -- --runInBand src/auth/services/audit.service.spec.ts` -> PASS
- `RLS_TEST_DATABASE_URL='postgresql://postgres@127.0.0.1:55432/postgres' npm test -- --runInBand src/database/migrations/harden-postgres-rls-policies.spec.ts` -> PASS
- `npm test -- --runInBand src/auth/guards/access-control.guards.spec.ts src/clients/services/client.service.spec.ts src/cases/services/case.service.spec.ts src/common/interceptors/rls.interceptor.spec.ts src/auth/services/auth.service.spec.ts src/auth/services/audit.service.spec.ts src/database/migrations/harden-postgres-rls-policies.spec.ts` -> PARTIAL
  - PostgreSQL suite skips without `RLS_TEST_DATABASE_URL`
- `npm run build` -> PASS
- `npm run lint` -> PASS
- `npm run build:frontend` -> PASS

### What Still Needs Dedicated Testing

- PostgreSQL-backed trust verification migration/integration coverage
- Production-like scanner integration coverage with a real ClamAV runtime
- Additional migration/integration coverage for blind-index backfill on production-like PostgreSQL datasets

## 6. Compliance Notes

- GDPR-style data export and deletion workflows are partially modeled; encryption-at-rest controls and operator runbooks now exist, but key rotation/backfill execution proof still needs staging rehearsal.
- Ukrainian legal workflow support now includes configurable live ACSK/Diia/BankID verification paths, but production trust still depends on external credential onboarding and staging confirmation.
- Audit logging exists, but it should not be treated as a substitute for DB-enforced isolation or cryptographic verification.

## 7. Security Priorities

1. Validate ACSK/Diia/BankID live credentials and staging exchanges, then complete production-grade scanner deployment validation.
2. Keep RBAC/plan enforcement docs and controller coverage in sync as new endpoints ship.
3. Add dedicated provider-callback abuse tests and production-like scanner integration coverage.
4. Add PostgreSQL migration/integration coverage for trust verification and blind-index backfill on larger datasets.
5. Rehearse the new readiness/alerting surface against real staging infrastructure, Redis outages, backup/restore drills, and blind-index rotation/backfill runbooks.
6. Preserve the bearer-only auth perimeter unless a future cookie-based session model includes explicit CSRF defenses.
7. Add dedicated abuse/integration coverage for tokenized mobile scan-session endpoints and live OCR runtime wiring once the OCR engine is chosen.
