# Security Audit Report - Law Organizer Application

**Status Correction Date:** 2026-03-10
**Audit Type:** Code-verified security baseline reconciliation
**Scope:** Auth perimeter, tenancy isolation, trust verification, upload safety, and remaining launch blockers

---

## Executive Summary

The project is no longer in the earlier "core controls missing" state. Tenant+user RLS, declarative RBAC, server-side subscription enforcement, access-token revocation, PII encryption, Redis-backed throttling, and malware-scanning gates are now implemented in the application layer and locally verified. The security posture is still not production-ready because the remaining blockers are external: live provider credentials, staging/runtime proof, deploy/degradation/restore drills, and outbound delivery validation.

### Current Security Posture: PRE-PRODUCTION / LOCALLY VERIFIED / EXTERNALLY UNPROVEN

## Verified Findings

| Finding | Severity | Current Status | Evidence |
|--------|----------|----------------|----------|
| Tenant+user PostgreSQL RLS | CRITICAL | FIXED | `src/common/interceptors/rls.interceptor.ts`, `src/database/migrations/1710100000000-HardenPostgresRlsPolicies.ts`, PostgreSQL spec `src/database/migrations/harden-postgres-rls-policies.spec.ts` |
| Declarative RBAC | CRITICAL | FIXED | `src/auth/decorators/access-control.decorators.ts`, `src/auth/guards/index.ts`, controller coverage plus `src/auth/guards/access-control.guards.spec.ts` |
| Server-side subscription enforcement | HIGH | FIXED | `src/common/security/subscription-limits.ts`, quota enforcement in case/client services, guard + service tests |
| Access-token revocation / session cutoff | HIGH | FIXED | `src/database/entities/RevokedAccessToken.entity.ts`, `src/auth/services/auth.service.ts`, `src/auth/strategies/jwt.strategy.ts` |
| CSRF posture clarity | MEDIUM | FIXED | bearer-only auth model in `src/main.ts` with `Authorization` headers and `credentials: false` |
| Redis-backed distributed throttling | HIGH | FIXED | `src/common/security/redis-throttler.storage.ts`, `src/app.module.ts`, environment validation |
| PII encryption + log redaction | HIGH | FIXED | `src/common/security/pii-protection.ts`, encrypted fields/entities, blind-index migrations, redaction in audit/logger paths |
| Malware scanning gate | HIGH | FIXED (application layer) | `src/file-storage/services/malware-scanner.service.ts`, `src/file-storage/services/file-scan.service.ts`, blocked download path in storage/document flows |
| Live-capable trust verification | HIGH | PARTIAL | provider adapters, signed callbacks, replay protection, retries, and CRL/OCSP hooks are implemented, but live credentials and staging proof are still pending |
| Operator/staging proof | HIGH | OPEN | deploy/degradation/backup/restore/scanner/provider/outbound transport drills still need evidence outside the local workspace |

## Controls That Are In Place

- Request-scoped PostgreSQL session context with tenant/user/role propagation
- Tenant+user-aware RLS policies enforced for sensitive records
- Declarative `@Roles` and `@RequirePlan` controller metadata
- Refresh-token rotation plus access-token revocation/session invalidation
- JWT validation against current user/org state
- Helmet headers and production CORS validation
- Redis-backed throttling for hardened production mode
- Field-level PII encryption with blind indexes for exact-match lookups
- PII redaction in audit and structured logging paths
- Async trust-verification workflow with signed callback validation
- Upload malware scanning lifecycle with blocked non-clean files
- Health/readiness endpoints and structured security/ops alerts

## Controls That Are Still Partial Or Missing

- External ACSK/Diia/BankID credential validation and staging contract proof
- Live proof of CRL/OCSP/provider callback behavior against staging upstreams
- Staging execution of deploy, outage, degraded-dependency, and backup/restore drills
- Production-like rehearsal of scanner/runtime dependencies
- Staging proof for outbound SMTP/SMS/push delivery providers
- Optional enterprise follow-ups:
  - audit dead-letter handling
  - SIEM streaming
  - real-time audit fan-out

## Important Implementation Notes

- Conversation 10 is implementation-complete locally; its remaining evidence burden is operational and belongs to Conversation 11.
- Conversation 13 is locally complete, but customer-visible delivery guarantees are still operationally unproven until staging transport execution is captured.
- Security docs should no longer describe RLS, RBAC, subscription enforcement, revocation, or PII encryption as open implementation gaps.

## Verification Status (2026-03-10)

- `npm run lint` -> PASS
- `npm test -- --runInBand` -> PASS (21 passed, 1 skipped suite / 3 skipped tests)
- `RLS_TEST_DATABASE_URL='postgresql://postgres@127.0.0.1:55432/postgres' npm test -- --runInBand src/database/migrations/harden-postgres-rls-policies.spec.ts` -> PASS (3/3)
- `npm run test:e2e -- --runInBand` -> PASS (22/22)
- `npm test -- --runInBand src/trust-verification/services/trust-verification.service.spec.ts src/trust-verification/services/trust-verification-worker.service.spec.ts src/trust-verification/services/trust-provider.adapters.spec.ts src/trust-verification/services/trust-callback-auth.service.spec.ts` -> PASS (12/12)
- `npm test -- --runInBand src/invoices/services/invoice.service.spec.ts src/notifications/services/notification.service.spec.ts src/events/services/event.service.spec.ts` -> PASS (9/9)
- `npx eslint src/events/dto/event.dto.ts src/events/services/event.service.ts src/notifications/services/notification.service.ts` -> PASS
- `npm run build` -> PASS

## Priority Remediation Order

1. Complete Conversation 11 staging/operator rehearsal with provider, scanner, backup/restore, degradation, and outbound-transport evidence.
2. Replace placeholder admin/ops surfaces if they are required for launch scope:
   - `/users`
   - `/settings`
   - `/audit`
3. Align shell/navigation with the canonical product IA so route-ready modules are actually discoverable.
4. Reconcile registration/onboarding/profile data ownership before expanding the next product wave.

## Conclusion

The current risk is no longer "missing foundational controls in code." The current risk is unproven production behavior outside the local workspace, followed by a smaller but still important product/admin gap on the frontend surface.
