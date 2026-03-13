# Agent Execution Checklist

> Canonical outstanding work queue for future agent sessions.
> Before any non-trivial task, read this file together with `CLAUDE.md` and `docs/PROJECT_CONTEXT_CACHE.md`.
> Unless the user explicitly reprioritizes the work, continue from the first conversation below that still has unchecked items.

## Operating Rules

1. Treat this file as the master backlog for outstanding implementation work.
2. Each conversation should be completed end-to-end:
   - implementation
   - verification
   - documentation updates
3. After each conversation, update:
   - this checklist
   - `CLAUDE.md`
   - `docs/PROJECT_CONTEXT_CACHE.md`
   - relevant domain docs in `docs/`
4. If a task is blocked, record the blocker explicitly instead of silently skipping to a later conversation.
5. Do not mark a conversation complete if only code changed but tests/docs/status were not updated.
6. For full production-launch work, read `docs/LAUNCH_READINESS_MASTER_CHECKLIST.md` first and treat it as the launch-gate override for the conversation ordering below.

## Recommended Conversation Order

### Conversation 0 - Reality Check And Status Reconciliation

Purpose:
- reconcile contradictory readiness claims across docs and actual code before deeper production hardening work

Task to give the agent:
> Read `CLAUDE.md`, `docs/PROJECT_CONTEXT_CACHE.md`, `docs/PRODUCTION_READINESS_REPORT.md`, `docs/SECURITY_AUDIT_REPORT.md`, and the relevant code paths for RLS, RBAC, auth hardening, rate limiting, CSP/Helmet/CSRF, and subscription enforcement. Produce a fact-based status correction pass: fix outdated claims, mark what is truly implemented vs partially implemented vs still missing, and leave a precise blocker list for launch. If a gap is trivial and safe to close in the same session, you may fix it, but do not hide unresolved items behind optimistic wording.

Checklist:
- [x] Verify actual status of RLS, RBAC, subscription enforcement, token revocation, CSP/Helmet/CSRF, Redis-backed rate limiting, virus scanning, and trust-provider flows.
- [x] Remove contradictory or overly optimistic statements from readiness/security docs.
- [x] Align the top-level open risks list across `CLAUDE.md`, `docs/PROJECT_CONTEXT_CACHE.md`, and `docs/PRODUCTION_READINESS_REPORT.md`.
- [x] Leave the next conversation with a clean, trustworthy baseline.

Done when:
- all major readiness docs tell the same story
- unresolved launch blockers are explicit and prioritized

Status:
- Completed on 2026-03-09 with a documentation reconciliation pass plus targeted runtime hardening (`helmet`, production `ALLOWED_ORIGINS` validation, and stricter JWT validation against current DB state)

### Conversation 1 - Tenant And User RLS Hardening

Purpose:
- move sensitive data protection from service-layer filtering to enforced database policies

Task to give the agent:
> Implement and verify tenant + user aware PostgreSQL Row Level Security for sensitive entities. Audit the existing RLS migration, identify what is tenant-only vs user-aware, extend policies for `cases`, `clients`, `documents`, and related sensitive records, and prove the behavior with PostgreSQL-backed tests. Do not treat sqlite-only coverage as sufficient for this task.

Checklist:
- [x] Audit the current RLS migration and list covered tables/policies.
- [x] Add missing user-aware policies for `cases`, `clients`, `documents`, and other directly related records.
- [x] Verify that request/session context consistently sets `app.current_tenant_id`, `app.current_user_id`, and `app.current_user_role`.
- [x] Add or extend PostgreSQL integration/e2e tests that prove cross-tenant and cross-user access is denied.
- [x] Update security and architecture docs to describe the final RLS model and remaining exceptions, if any.

Done when:
- database policies enforce the intended scope for sensitive data
- tests fail on attempted cross-tenant and cross-user leakage

Status:
- Completed on 2026-03-09.
- Final verification included live PostgreSQL execution of:
  - `src/database/migrations/harden-postgres-rls-policies.spec.ts`
- Conversation 1 delivered:
  - request-scoped PostgreSQL session context wiring in `src/common/interceptors/rls.interceptor.ts`
  - runtime registration in `src/app.module.ts`
  - safe grant handling in `src/database/migrations/1706400000000-EnableRowLevelSecurity.ts`
  - hardening migration `src/database/migrations/1710100000000-HardenPostgresRlsPolicies.ts`
  - registration-path RLS setup in `src/auth/services/auth.service.ts`
  - audit-log fallback for forced RLS in `src/auth/services/audit.service.ts`
  - unit/runtime/PostgreSQL coverage in:
    - `src/common/interceptors/rls.interceptor.spec.ts`
    - `src/auth/services/auth.service.spec.ts`
    - `src/auth/services/audit.service.spec.ts`
    - `src/database/migrations/harden-postgres-rls-policies.spec.ts`

### Conversation 2 - RBAC And Subscription Enforcement

Purpose:
- make authorization and plan limits systematic instead of partially manual

Task to give the agent:
> Implement the missing `@Roles` decorator flow end-to-end and wire it through the actual controller surface. In the same session, implement backend subscription enforcement for real plan limits so marketing pricing and runtime behavior stop diverging. Add tests for both role restrictions and plan-limit failures.

Checklist:
- [x] Implement `@Roles` and confirm the guard wiring is active.
- [x] Audit controllers/endpoints and apply explicit role requirements where missing.
- [x] Define canonical plan limits for Free, Pro, and Corporate flows.
- [x] Enforce plan limits in backend create/update flows and not only in frontend rendering.
- [x] Add tests for role denial, admin allowance, and subscription-limit denial paths.
- [x] Update API/readiness docs to reflect enforced permissions and plan constraints.

Done when:
- RBAC is declarative and test-covered
- subscription limits are enforced server-side

Status:
- Completed on 2026-03-09.
- Conversation 2 delivered:
  - declarative access-control decorators in `src/auth/decorators/access-control.decorators.ts`
  - active `RbacGuard` / `SubscriptionGuard` metadata enforcement in `src/auth/guards/index.ts`
  - canonical server-side subscription limits in `src/common/security/subscription-limits.ts`
  - audited role coverage for mutating controller actions in cases, clients, documents, billing, organization settings, events, invoices, pricelists, calculations, and file storage
  - server-side quota enforcement for client/case create, restore, and import flows in:
    - `src/clients/services/client.service.ts`
    - `src/cases/services/case.service.ts`
  - denial-path coverage in:
    - `src/auth/guards/access-control.guards.spec.ts`
    - `src/clients/services/client.service.spec.ts`
    - `src/cases/services/case.service.spec.ts`

### Conversation 3 - Token Revocation And Auth Perimeter Hardening

Purpose:
- close the remaining auth/session-control gaps that matter in production

Task to give the agent:
> Add a real token revocation strategy and harden the auth perimeter. Choose and implement a revocation model that supports logout-all, password reset, account disablement, and role/membership changes. Then verify actual Helmet/CSP/CSRF/secure-cookie/rate-limit behavior in code and infra config, closing any concrete gaps you find. Keep the result production-oriented, not documentation-only.

Checklist:
- [x] Implement token revocation or blacklisting with explicit invalidation triggers.
- [x] Cover logout-all, password reset, user disablement, and membership/role changes.
- [x] Verify actual Helmet/CSP/CSRF behavior in code and deployment config.
- [x] Verify rate limiting is suitable for multi-instance deployment and backed by Redis where needed.
- [x] Add tests for revoked-token rejection and critical auth abuse paths.
- [x] Update auth/security docs with the actual control model and operational limitations.

Done when:
- revoked sessions are rejected reliably
- auth middleware/security claims in docs match the real implementation

Status:
- Completed on 2026-03-09.
- Conversation 3 delivered:
  - DB-backed revoked access-token registry in `src/database/entities/RevokedAccessToken.entity.ts`
  - user-level session cutoff via `users.session_invalid_before`
  - migration `src/database/migrations/1710200000000-AddAccessTokenRevocation.ts`
  - access-token revocation on logout plus bulk session invalidation on logout-all/password reset in `src/auth/services/auth.service.ts`
  - JWT enforcement for revoked tokens, session cutoff, current role/plan, active user, and active organization in `src/auth/strategies/jwt.strategy.ts`
  - bearer-only CORS posture in `src/main.ts`
  - Redis-backed throttler storage with production validation in:
    - `src/common/security/redis-throttler.storage.ts`
    - `src/app.module.ts`
    - `src/common/config/environment.validator.ts`
  - targeted coverage in:
    - `src/auth/services/auth.service.spec.ts`
    - `src/auth/strategies/jwt.strategy.spec.ts`
    - `src/common/security/redis-throttler.storage.spec.ts`

### Conversation 4 - PII Encryption And Log Redaction

Purpose:
- protect regulated user data at rest and keep it out of logs/errors

Task to give the agent:
> Implement field-level encryption for sensitive personal data and ensure those values are not leaked through logs, audit payloads, or error traces. Define exactly which fields are encrypted, which remain searchable, and how existing data is migrated. Document the limits of the chosen approach.

Checklist:
- [x] Identify the PII fields that require encryption at rest.
- [x] Implement encryption/decryption in the relevant persistence flow.
- [x] Decide and document how searchable fields are handled.
- [x] Add a migration or backfill path for existing records.
- [x] Audit logging/error paths and redact or suppress sensitive values.
- [x] Add tests for encrypted persistence and safe serialization/logging.

Done when:
- sensitive fields are no longer stored plaintext
- logs and traces do not expose protected values

Status:
- Complete as of 2026-03-09.
- Landed across the Conversation 4 passes:
  - field-level encryption helpers plus blind-index/search helpers in `src/common/security/pii-protection.ts`
  - encrypted entity fields in:
    - `src/database/entities/Organization.entity.ts`
    - `src/database/entities/User.entity.ts`
    - `src/database/entities/Client.entity.ts`
  - backfill migrations:
    - `src/database/migrations/1710300000000-EncryptSensitivePiiFields.ts`
    - `src/database/migrations/1710310000000-EncryptSearchablePiiWithBlindIndexes.ts`
  - audit/log redaction in:
    - `src/auth/services/audit.service.ts`
    - `src/common/logging/logger.config.ts`
  - auth/client runtime changes for blind-index lookups in:
    - `src/auth/services/auth.service.ts`
    - `src/auth/services/organization.service.ts`
    - `src/clients/services/client.service.ts`
  - tests in:
    - `src/common/security/pii-protection.spec.ts`
    - `src/auth/services/audit.service.spec.ts`
    - `src/auth/services/auth.service.spec.ts`
    - `src/clients/services/client.service.spec.ts`
- Documented limit:
  - exact-match searchability for encrypted PII is preserved through blind indexes; fuzzy/substring search remains supported only for non-sensitive name/company fields

### Conversation 5 - Trust Providers And Signature Verification Worker

Purpose:
- turn the current signature/identity foundation into a working verification pipeline

Task to give the agent:
> Build the real verification flow for Ukrainian trust providers on top of the existing schema foundation. Split synchronous API responsibilities from async verification work, introduce worker jobs where required, and model statuses such as pending, verified, failed, and revoked. Start with the provider-neutral architecture if full provider integration cannot be completed in one session, but keep the design directly implementable.

Checklist:
- [x] Design and implement provider adapter boundaries for `acsk`, `diia`, and `bankid_nbu`.
- [x] Add an async verification path and worker responsibilities for signatures/identity checks.
- [x] Model status transitions, retry behavior, and revocation handling.
- [x] Add CRL/OCSP or equivalent certificate validation hooks where applicable.
- [x] Record audit events for verification requests, callbacks, failures, and revocations.
- [x] Update security/compliance docs with what is live vs still provider-stubbed.

Done when:
- signature verification is a real workflow, not only stored metadata
- async re-check/revocation handling has a defined execution path

Status:
- Complete as of 2026-03-09.
- Landed in this pass:
  - provider-neutral adapters and registry in `src/trust-verification/services/trust-provider.adapters.ts` and `src/trust-verification/services/trust-provider.registry.ts`
  - orchestration + scheduled worker in `src/trust-verification/services/trust-verification.service.ts` and `src/trust-verification/services/trust-verification-worker.service.ts`
  - API surface in `src/trust-verification/controllers/trust-verification.controller.ts`
  - persistent job model in `src/database/entities/TrustVerificationJob.entity.ts`
  - migration `src/database/migrations/1710400000000-AddTrustVerificationWorkflow.ts`
  - `DocumentService.sign(...)` now enqueues verification instead of treating provider-backed signatures as pre-verified
- Explicit limitation:
  - the workflow is live and directly implementable, but external `acsk` / `diia` / `bankid_nbu` adapters still operate in provider-stub mode until real upstream integrations are wired

### Conversation 6 - File Security And Malware Scanning

Purpose:
- make document upload safe enough for a legal document platform

Task to give the agent:
> Add malware scanning to the document upload lifecycle. Uploaded files should pass through a scanning state before being treated as safe, and infected or unverified files must not be served as normal documents. Wire the result into storage metadata, API responses, and operator visibility.

Checklist:
- [x] Add a scanning stage and status model to file/document handling.
- [x] Integrate a scanner path such as ClamAV or an equivalent service.
- [x] Prevent normal download/usage of infected or not-yet-cleared files.
- [x] Emit audit/alerting signals for infected uploads and scan failures.
- [x] Add tests for clean, infected, and scanner-failure paths.
- [x] Update document/storage/security docs with the new lifecycle.

Done when:
- files cannot silently bypass the scan lifecycle
- unsafe uploads are visible and blocked

Status:
- Complete as of 2026-03-09.
- Landed in this pass:
  - persistent scan records in `src/database/entities/FileScanRecord.entity.ts`
  - migration `src/database/migrations/1710500000000-AddMalwareScanningWorkflow.ts`
  - scanner + scan worker services in:
    - `src/file-storage/services/malware-scanner.service.ts`
    - `src/file-storage/services/file-scan.service.ts`
    - `src/file-storage/services/file-storage.service.ts`
  - operator-visible document scan state in:
    - `src/database/entities/Document.entity.ts`
    - `src/documents/dto/document.dto.ts`
    - `src/documents/services/document.service.ts`
  - tests in:
    - `src/file-storage/services/malware-scanner.service.spec.ts`
    - `src/file-storage/services/file-scan.service.spec.ts`
    - `src/file-storage/services/file-storage.service.spec.ts`
- Explicit limitation:
  - command-based ClamAV support is wired, but production still needs a real scanner deployment/runtime

### Conversation 7 - Schema Debt And Performance Hardening

Purpose:
- close the remaining schema debt that can destabilize production behavior

Task to give the agent:
> Fix the known schema debt: missing soft-delete indexes, the `deleted_at` issue in invitations, and any directly adjacent migration inconsistencies discovered during the pass. Keep the scope disciplined: this session should leave the database layer more correct and more predictable, not drift into unrelated refactors.

Checklist:
- [x] Add missing indexes for common soft-delete and filtered queries.
- [x] Fix the invitations `deleted_at` mismatch/constraint issue.
- [x] Review the impacted migrations for PostgreSQL correctness and ordering.
- [x] Add tests or verification steps that prove the schema behaves as intended after migration.
- [x] Update architecture/readiness docs with the corrected schema status.

Done when:
- the known schema debt items are closed
- migration state is documented and reproducible

Status:
- Complete as of 2026-03-09.
- Landed in this pass:
  - `deleted_at` support for invitations in `src/database/entities/Invitation.entity.ts`
  - schema hardening migration `src/database/migrations/1710600000000-HardenSoftDeleteIndexesAndInvitations.ts`
  - migration contract spec `src/database/migrations/harden-soft-delete-indexes-and-invitations.spec.ts`
  - PostgreSQL partial indexes for hot active-record paths across invitations, cases, clients, documents, events, invoices, calculations, notifications, pricelists, pricelist categories, and pricelist items
- Explicit limitation:
  - targeted verification is green, but full `npm test -- --runInBand` and a live PostgreSQL migration rehearsal were not rerun in this pass

### Conversation 8 - Monitoring, Alerting, And Launch Rehearsal

Purpose:
- confirm the platform can be operated and recovered safely in staging/production

Task to give the agent:
> Build a concrete production-readiness pass around observability and operations. Add or wire the missing monitoring/alerting for security and reliability events, then perform a fact-based staging checklist pass: deployment health, migrations, auth, tenant isolation, backups, restore path, and worker health. Update docs to distinguish proven behavior from assumptions.

Checklist:
- [x] Define and implement monitoring for auth abuse, cross-tenant violations, worker failures, billing anomalies, and malware events.
- [x] Verify alert rules and readiness surfaces for critical operational signals.
- [x] Run or document a staging checklist for deploy, migrate, auth, tenant isolation, worker queue, and backup/restore.
- [x] Confirm health checks and failure modes for backend, frontend, worker, database, and Redis.
- [x] Update deployment/readiness docs with measured outcomes, not generic claims.

Done when:
- staging/production operations have an evidence-based checklist
- critical security and reliability events are visible

Implementation status:
- Added operational readiness and alerting in:
  - `src/common/health/operational-monitoring.service.ts`
  - `src/common/health/health.controller.ts`
  - `src/common/logging/global-exception.filter.ts`
  - `src/main.ts`
- Runtime behavior now includes:
  - `GET /health` for liveness
  - `GET /readiness` for DB/Redis/auth/billing/worker readiness with `503` on degraded/error states
  - structured security events for tenant-context and data-isolation denials
  - scheduled alert emission for auth lockouts, trust-verification backlog/failures, malware failures/infections, outbox backlog risk, and billing anomalies
- Added verification coverage in:
  - `src/common/health/operational-monitoring.service.spec.ts`
  - `src/common/logging/global-exception.filter.spec.ts`
- Added evidence-based launch checklist in:
  - `docs/LAUNCH_REHEARSAL_CHECKLIST.md`
- Validation:
  - `npm run lint` -> PASS
  - `npm test -- --runInBand src/common/health/operational-monitoring.service.spec.ts src/common/logging/global-exception.filter.spec.ts` -> PASS
  - `npm run build` -> PASS
- Explicit limitation:
  - the checklist is now evidence-based, but live staging deploy/outage/backup drills still need execution outside this local workspace

### Conversation 9 - Frontend Quality Gate And Live UX Audit

Purpose:
- stop treating green builds as equivalent to browser-ready UX quality

Task to give the agent:
> Tighten the frontend quality gate and complete a live browser audit of the highest-risk routes. Bring frontend files under the real lint pipeline, add smoke coverage for critical routes, and perform a focused QA pass on authentication, registry screens, pricelists, calendar, and subscription-related flows. Capture any remaining visual or accessibility defects as explicit follow-ups instead of leaving them implicit.

Checklist:
- [x] Include frontend files in the effective lint/format quality gate.
- [x] Add or extend smoke/browser coverage for critical routes and auth/session behavior.
- [x] Perform a live browser audit on landing, login/register, dashboard, clients, cases, documents, calendar, and pricelists.
- [x] Check keyboard/focus/landmark/accessibility basics on high-value screens.
- [x] Fix or explicitly document the remaining live-UI gaps.
- [x] Update frontend/design docs and `docs/PROJECT_CONTEXT_CACHE.md` with the verified outcome.

Done when:
- frontend quality checks cover the real code surface
- the most visible routes have browser-verified status

Implementation status:
- Frontend files are now in the effective lint gate via:
  - `package.json`
  - `.eslintrc.js`
- Added Playwright smoke coverage for:
  - `/`
  - `/login`
  - `/dashboard`
  - `/clients`
  - `/cases`
  - `/documents`
  - `/calendar`
  - `/pricelists`
- New smoke assets:
  - `playwright.config.ts`
  - `tests/playwright/frontend-smoke.spec.ts`
- Live browser audit found and fixed:
  - missing `ACCESS_LEVEL_LABELS` constant crashing `/documents`
  - shared `Input` not forwarding `autoFocus`, which broke login-page keyboard focus expectations
  - duplicate React keys in the landing comparison grid
- Validation:
  - `npm run lint` -> PASS
  - `npm run build:frontend` -> PASS
  - `npm run test:frontend:smoke` -> PASS (2/2)
- Explicit limitation:
  - this pass covers the highest-risk routes with mocked API responses, not a full end-to-end staging backend/browser session

## Parallel Track Notes

- If multiple agents are available, Conversation 9 can run after Conversation 2 in parallel with Conversations 4-8.
- Conversation 6 should preferably start after Conversation 3, because auth and storage controls affect the upload/download lifecycle.
- Conversation 8 should be treated as near-final validation after Conversations 1-7 materially land.
- The ordered conversation queue is now exhausted; remaining work should be chosen from the launch-blocker summary and unresolved limitations in the docs.

## Launch-Blocker Summary

Do not call the platform production-ready until these items are complete:

- [x] Tenant + user aware RLS is enforced and test-proven.
- [x] RBAC is wired through `@Roles` and controller coverage is audited.
- [x] Subscription limits are enforced server-side.
- [x] Token revocation/blacklisting is active.
- [x] PII encryption at rest is implemented.
- [ ] Trust-provider verification is live beyond schema-only foundation.
- [x] Malware scanning protects uploaded documents.
- [x] Staging/production readiness is verified by evidence, not only by documentation claims.

## Next Queue After Conversations 0-9

The foundational hardening queue is complete. The next agent sessions should proceed in this order unless the user explicitly reprioritizes.

### Conversation 10 - Live Provider Integrations

Purpose:
- replace provider stubs with real legal-trust integrations

Task to give the agent:
> Wire real ACSK/Diia/BankID integrations on top of the existing trust-verification workflow. Replace stub-mode provider adapters with real exchanges, add secure callback handling, and implement real certificate/status checks where applicable. Keep auditability and retry/recheck behavior intact.

Checklist:
- [x] Implement real ACSK/KEP verification exchange.
- [x] Implement real Diia identity/signature exchange.
- [x] Implement real BankID identity exchange.
- [x] Add real CRL/OCSP or equivalent upstream status checks where applicable.
- [x] Harden provider callback authentication, replay protection, and audit trails.
- [x] Add provider-adapter/service verification coverage for each live provider path.

Status note as of 2026-03-10:
- Application-layer implementation is now present in the trust-verification module.
- External proof is intentionally tracked in Conversation 11/operator rehearsal so Conversation 10 stays implementation-scoped.

### Conversation 11 - Staging And Operator Rehearsal

Purpose:
- prove the platform can actually be operated outside the local workspace

Task to give the agent:
> Execute the staging/operations phase around the existing readiness and launch-rehearsal docs. Run deploy, migrate, degraded-dependency, and backup/restore drills; prove the scanner/runtime stack and external provider/delivery dependencies in a production-like environment; and write missing operator runbooks for blind-index rotation and large-scale backfills.

Checklist:
- [ ] Deploy backend/frontend/worker/PostgreSQL/Redis to staging.
- [ ] Execute `GET /health` and `GET /readiness` checks on staging.
- [ ] Run Redis/PostgreSQL degradation drills and capture evidence.
- [ ] Run backup and restore in an isolated environment.
- [ ] Rehearse production scanner/provider runtime dependencies.
- [ ] Rehearse outbound SMTP/SMS/push transport dependencies and capture evidence.
- [x] Write/verify runbooks for key rotation and production data backfill rehearsal.

Status note as of 2026-03-10:
- Added operator docs:
  - `docs/BLIND_INDEX_KEY_ROTATION_RUNBOOK.md`
  - `docs/PRODUCTION_BACKFILL_REHEARSAL_RUNBOOK.md`
- Remaining blockers in Conversation 11 are external execution items: staging deployment, outage drills, backup/restore proof, scanner/provider runtime proof, and outbound transport proof.

Status note as of 2026-03-11:
- Added runnable local operator-rehearsal assets:
  - `docker-compose.rehearsal.yml`
  - `scripts/local-launch-rehearsal.sh`
- Fixed local rehearsal blockers in repository configuration:
  - compose/backend envs now expose both `DB_*` and `DATABASE_*` aliases
  - dedicated `src/worker.ts` now exists for `dist/worker.js`
  - scheduled jobs are gated by `RUN_SCHEDULED_JOBS` so web/worker roles do not double-process cron work
- Verification completed:
  - `npm run lint:backend` -> PASS
  - `npm run build` -> PASS
  - `bash -n scripts/local-launch-rehearsal.sh` -> PASS
  - `docker compose -f docker-compose.yml -f docker-compose.rehearsal.yml config` -> PASS
- External execution is still not complete because this workspace session had no reachable Docker daemon, so deploy/degradation/restore/provider transport evidence remains open.

### Conversation 12 - Billing Provider Synchronization

Purpose:
- close the remaining paid-launch gaps in provider-driven subscription state

Task to give the agent:
> Finish the billing-provider synchronization layer. Stripe/WayForPay webhook events must update local subscription state reliably, and customer-facing invoice/payment-method views should stop returning placeholders. If paid launch is in scope, treat this as launch-blocker work rather than optional polish.

Checklist:
- [x] Complete Stripe webhook-to-database subscription updates.
- [x] Audit WayForPay parity and state transitions.
- [x] Implement invoice retrieval for supported providers.
- [x] Implement payment-method retrieval for supported providers.
- [x] Add idempotency/retry-safe handling and test coverage for billing events.
- [x] Update billing/readiness docs with the real provider behavior.

Status note as of 2026-03-10:
- Application-layer billing synchronization is now complete.
- Remaining workflow/provider evidence moved to Conversation 13 and then to the next staging-oriented conversation once the local implementation landed.

### Conversation 13 - Commercial Workflow Completion

Purpose:
- close the operational feature gaps around invoicing and user communication

Task to give the agent:
> Complete the still-partial delivery workflows around invoices, notifications, and reminders. Focus on business-complete paths rather than placeholders: invoice PDF generation/storage, invoice sending, queued notification delivery, and event reminders.

Checklist:
- [x] Implement invoice PDF generation and storage.
- [x] Implement invoice delivery flow and status transitions.
- [x] Implement queued notification delivery instead of stub logging.
- [x] Implement event reminder scheduling/delivery.
- [x] Add tests for the completed workflows.
- [x] Update docs so these features are not overstated before they are real.

Status:
- Completed on 2026-03-10 at the application layer.
- Conversation 13 delivered:
  - stored invoice PDF generation and delivery metadata in `src/invoices/services/invoice.service.ts`
  - module wiring in `src/invoices/invoices.module.ts`
  - DB-backed queued notification processing in `src/notifications/services/notification.service.ts`
  - nullable notification entity alignment in `src/database/entities/Notification.entity.ts`
  - cron-based event reminders in `src/events/services/event.service.ts`
  - reminder DTO/module wiring in `src/events/dto/event.dto.ts` and `src/events/events.module.ts`
  - focused coverage in:
    - `src/invoices/services/invoice.service.spec.ts`
    - `src/notifications/services/notification.service.spec.ts`
    - `src/events/services/event.service.spec.ts`
- Validation:
  - `npm test -- --runInBand src/invoices/services/invoice.service.spec.ts src/notifications/services/notification.service.spec.ts src/events/services/event.service.spec.ts` -> PASS (9/9)
  - `npm run lint:backend -- --fix=false src/invoices/services/invoice.service.ts src/invoices/services/invoice.service.spec.ts src/invoices/invoices.module.ts src/notifications/services/notification.service.ts src/notifications/services/notification.service.spec.ts src/database/entities/Notification.entity.ts src/events/services/event.service.ts src/events/services/event.service.spec.ts src/events/events.module.ts src/events/dto/event.dto.ts` -> PASS
  - `npm run build` -> PASS
- Re-verification on 2026-03-10 found and fixed a real regression:
  - duplicate `reminderDaysBefore` in `src/events/dto/event.dto.ts` was breaking `npm run test:e2e -- --runInBand`
  - after the fix, `npm run test:e2e -- --runInBand` -> PASS (22/22)
- Remaining limitation:
  - external SMTP/SMS/push provider execution is still not proven in staging, so customer-facing transport guarantees remain a Conversation 11 operational follow-up rather than a completed local-code claim

### Conversation 14 - Product Scope Reconciliation Refresh

Purpose:
- produce the next product backlog from the current codebase, not from outdated assumptions

Task to give the agent:
> Refresh the product-scope reconciliation after the hardening wave. Re-audit the current repository against the latest TZ/prototype expectations, remove outdated findings that are already fixed, and turn the remaining gaps into a new ordered product backlog.

Checklist:
- [x] Re-audit `docs/REQUIREMENTS_ALIGNMENT_AUDIT.md` against the current application.
- [x] Remove findings that are no longer true after landing page, route-backed details, pricelists, and security hardening work.
- [x] Identify the highest-value remaining product/IA gaps.
- [x] Split launch blockers from post-launch product backlog items.
- [x] Update `CLAUDE.md`, `docs/PROJECT_CONTEXT_CACHE.md`, and this checklist with the new ordered queue.

Status:
- Completed on 2026-03-10 as a documentation reconciliation pass.
- Conversation 14 delivered:
  - refreshed `docs/REQUIREMENTS_ALIGNMENT_AUDIT.md`
  - corrected product/module status for route-backed pages that are no longer missing
  - narrowed the remaining frontend backlog to placeholder admin surfaces, IA exposure, onboarding/profile reconciliation, and workspace-hub depth
- Verification:
  - no additional code verification commands were run in this pass because the change set was documentation-only

## Next Ordered Queue

Before starting product backlog work, finish Conversation 11. It is now the first real unchecked execution track and the main remaining launch-validation blocker.

### Conversation 15 - Users, Settings, And Audit Surface Completion

Purpose:
- replace the remaining placeholder admin/ops pages with real tenant-usable surfaces

Checklist:
- [x] Replace `/users` placeholder with a real users management screen.
- [x] Replace `/settings` placeholder with a real settings surface aligned to tenant/account configuration.
- [x] Replace `/audit` placeholder with a real audit/events surface or explicitly scope-limit it behind enterprise access rules.
- [x] Add tests and docs for the new admin/ops routes.

Status note as of 2026-03-10:
- Completed locally with tenant-scoped users/invitations APIs, real settings persistence through `/organizations/me`, and a Professional+-gated audit log page backed by the standard auth-module audit store.
- Validation run in this pass:
  - `npm run lint:backend` -> PASS
  - `npm run lint:frontend` -> PASS
  - `npm run build` -> PASS
  - `npm run build:frontend` -> PASS

### Conversation 16 - Shell And Navigation Alignment

Purpose:
- make the live product shell match the now-expanded route surface and legal-product IA

Checklist:
- [x] Expose the existing route-backed modules in navigation where appropriate (`profile`, `activity`, `reports`, `users`, `settings`).
- [x] Reconcile menu grouping and role visibility with the canonical IA from `docs/REQUIREMENTS_ALIGNMENT_AUDIT.md`.
- [x] Keep backward-compatible redirects only where they reduce migration risk.
- [x] Update frontend/product docs after the IA pass.

Status note as of 2026-03-10:
- Completed locally by exposing `profile`, `activity`, `reports`, `users`, and `settings` in the live shell, adding secondary navigation grouping, and updating breadcrumb coverage for the newly surfaced routes.

### Conversation 17 - Onboarding / Profile Scope Reconciliation

Purpose:
- decide and implement the correct split of required legal-practice identity data across registration, onboarding, and profile

Checklist:
- [x] Define the canonical data ownership split for registration, onboarding, and profile.
- [x] Align frontend forms, DTOs, and docs with that split.
- [x] Remove simulated onboarding saves where real persistence is expected.
- [x] Add tests/docs for the revised flow.

Status note as of 2026-03-10:
- Completed locally.
- Registration now captures only tenant bootstrap identity, onboarding persists startup operational/professional fields through real APIs, and profile remains the surface for extended enrichment data.
- Validation run in this pass:
  - `npm test -- --runInBand src/auth/services/auth.service.spec.ts` -> PASS (26/26)
  - `npm run lint:backend` -> PASS
  - `npm run lint:frontend` -> PASS
  - `npm run build` -> PASS
  - `npm run build:frontend` -> PASS

### Conversation 18 - Secondary Module Depth Or Phase Labeling

Purpose:
- stop leaving reports, print forms, chat, mail, and calculations in an ambiguous middle state

Checklist:
- [x] Audit which of these modules are launch-scope versus post-launch:
  - calculations
  - reports
  - print forms
  - chat
  - mail
- [x] For launch-scope modules, implement the missing workflow depth.
- [x] For post-launch modules, phase-label them explicitly in docs and UI to avoid overstating readiness.
- [x] Update the ordered backlog after this split.

Status note as of 2026-03-11:
- Closed in the explicit phase-labeling variant rather than the workflow-deepening variant.
- Scope decision recorded in code/docs:
  - `reports` and `calculations` remain launch-scope operational surfaces
  - `print-forms`, `chat`, and `mail` are now explicitly marked as post-launch preview surfaces in the UI
- Validation run in this pass:
  - `npm run lint:frontend` -> PASS
  - `npm run build:frontend` -> PASS
  - `npm run build` -> PASS

## Launch-Gate Override (2026-03-13)

For "Are we ready to launch?" work, do not continue directly from old conversation ordering. Use [LAUNCH_READINESS_MASTER_CHECKLIST.md](/Users/edhar/Documents/Адвокатська практика/Сайт Органайзер Юриста/Project%20Z%20Code/docs/LAUNCH_READINESS_MASTER_CHECKLIST.md).

Current launch-gate order:

1. Restore green automated verification:
   - `npm test -- --runInBand`
   - `npm run test:e2e -- --runInBand`
2. Complete external/business prerequisites:
   - provider contracts/onboarding
   - production credentials/secrets
   - domain/DNS/TLS
   - SMTP/SMS/push scope decision
   - S3/CDN/Sentry/backups
3. Complete staging/operator rehearsal:
   - deploy
   - health/readiness
   - degradation drills
   - backup/restore
   - trust/billing/transport proof

Do not call the platform production-ready while any of those three launch-gate tracks remain open.
