# Launch Readiness Master Checklist

**Updated:** 2026-03-13  
**Audience:** AI agent, product owner, operator, non-technical launch owner  
**Purpose:** single source of truth for full production launch readiness

Use this document when the task is "Can we launch?" or "What is still missing before production?".  
Do not declare the project production-ready until every launch-scope blocker below is either:

- completed and evidenced
- explicitly de-scoped by the user
- blocked with a named owner and next action

## Current Status Snapshot

### Current conclusion

- Project stage: `pre-production release candidate`
- Launch decision: `NOT READY FOR FULL PRODUCTION LAUNCH`

### Verified on 2026-03-13

- `npm run lint` -> PASS
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS
- `npm run test:frontend:smoke` -> PASS (3/3)
- `npm test -- --runInBand` -> FAIL
  - blocker: `src/calculations/services/calculation.service.ts:347`
- `npm run test:e2e -- --runInBand` -> FAIL
  - blocker: `tests/cases.e2e-spec.ts`
  - failure mode: tests are out of sync with the current `Case` entity/type contracts

### What this means

- The application is no longer missing its main security foundation.
- The launch is still blocked by:
  - red automated verification
  - unexecuted staging/operator rehearsal
  - external provider onboarding/credentials
  - several runtime/infrastructure tasks that are not "coding"

## Agent Rules

1. For launch-readiness work, this file overrides backlog ordering in other docs.
2. Always separate blockers into:
   - code/runtime blockers
   - external integrations needing both code and credentials
   - non-programming / business / operator prerequisites
3. When an item depends on a human owner, do not mark it done just because code exists.
4. For every external blocker, record:
   - owner type
   - required artifact
   - current status
   - next action
5. After any launch-readiness change, update:
   - `CLAUDE.md`
   - `docs/PROJECT_CONTEXT_CACHE.md`
   - `docs/PRODUCTION_READINESS_REPORT.md`
   - `docs/AGENT_EXECUTION_CHECKLIST.md`
   - this file

## Launch Blockers

### A. Code / CI Blockers

- [ ] Restore green full unit test suite
  - Current blocker:
    - `src/calculations/services/calculation.service.ts:347`
  - Done when:
    - `npm test -- --runInBand` passes without known failing suites
- [ ] Restore green e2e suite
  - Current blocker:
    - `tests/cases.e2e-spec.ts`
  - Done when:
    - `npm run test:e2e -- --runInBand` passes
- [ ] Re-run the core verification surface after fixes
  - Required commands:
    - `npm run lint`
    - `npm run build`
    - `npm run build:frontend`
    - `npm test -- --runInBand`
    - `npm run test:e2e -- --runInBand`
    - `npm run test:frontend:smoke`

### B. External Integrations That Need More Than Code

- [ ] Trust providers are live and staging-proven
  - Providers:
    - ACSK / КЕП
    - Diia
    - BankID NBU
  - Required artifacts:
    - real contracts/onboarding approval
    - live credentials
    - callback URLs approved
    - staging or production-like proof for signature/identity flow
- [ ] Payment providers are live and staging-proven
  - Providers:
    - Stripe
    - WayForPay
  - Required artifacts:
    - live merchant/account approval
    - live keys/secrets
    - webhook endpoints configured
    - real staging payment/refund/callback proof
- [ ] Outbound transport is real, not only state-transition logic
  - Channels:
    - email
    - SMS
    - push
  - Important current limitation:
    - the notification workflow currently tracks queue/delivered/failed state, but does not yet prove a real provider send path in this repository
  - Required outcome:
    - either implement/live-wire the provider adapters and prove delivery
    - or explicitly de-scope SMS/push from launch
- [ ] Scan/PDF processing runtime is provisioned
  - Runtime dependencies currently referenced by the code:
    - `python3`
    - `opencv` / `cv2`
    - `ocrmypdf`
    - `unpaper`
    - `tesseract`
  - Required outcome:
    - provision these on the correct runtime image/host
    - prove a real scan -> processed searchable PDF path
- [ ] Malware scanner runtime is provisioned
  - Current mode in code supports a real ClamAV command path
  - Required outcome:
    - deploy and connect a real ClamAV runtime
    - prove clean/infected/failure behavior outside stub mode

### C. Non-Programming / Business / Operations Prerequisites

- [ ] Sign or complete onboarding with trust providers
  - Owner type:
    - business owner / legal / compliance
  - Examples:
    - ACSK agreement
    - Diia integration onboarding
    - BankID NBU onboarding
- [ ] Obtain and store production credentials/secrets
  - Needed groups:
    - JWT secrets
    - encryption key
    - database credentials
    - Redis credentials
    - S3 credentials
    - Stripe keys
    - WayForPay merchant credentials
    - SMTP credentials
    - provider callback secrets
    - Sentry DSN
- [ ] Prepare production domain and DNS
  - Minimum expected domains:
    - main app domain
    - API domain
    - optional CDN domain
  - Required artifacts:
    - DNS records
    - TLS certificates
    - correct callback URLs registered with providers
- [ ] Prepare production storage and backups
  - Required artifacts:
    - S3 bucket(s)
    - backup bucket
    - backup encryption key
    - retention policy owner
- [ ] Prepare monitoring/incident ownership
  - Required artifacts:
    - Sentry project / alert routing
    - named incident owner
    - named backup/restore owner
    - named key-rotation owner
- [ ] Prepare support and legal customer-facing materials
  - Required artifacts:
    - support mailbox
    - reply-to mailbox
    - privacy policy
    - terms of service / public offer
    - data processing / retention policy if launch scope requires it

### D. Staging / Operator Rehearsal

- [ ] Deploy backend, frontend, worker, PostgreSQL, and Redis to staging
- [ ] Verify `GET /health` and `GET /readiness`
- [ ] Rehearse Redis/PostgreSQL degradation
- [ ] Rehearse backup and restore
- [ ] Rehearse blind-index key rotation
- [ ] Rehearse large-scale backfill on restored production-like data
- [ ] Rehearse trust-provider callbacks with live/sandbox credentials
- [ ] Rehearse real billing webhooks/callbacks
- [ ] Rehearse real email/SMS/push delivery if those channels are in launch scope

## Current Non-Code Action List For A Non-Technical Owner

These are the main "not programming" tasks still needed for launch:

1. Decide which external providers are truly in launch scope:
   - ACSK
   - Diia
   - BankID
   - Stripe
   - WayForPay
   - email
   - SMS
   - push
2. Sign agreements or complete onboarding with the providers you are actually launching.
3. Obtain production credentials, secrets, and callback approvals from each chosen provider.
4. Buy/configure the production domain, DNS, TLS certificates, and public callback URLs.
5. Prepare the production hosting stack:
   - PostgreSQL
   - Redis
   - S3/object storage
   - backup storage
   - monitoring account
6. Assign real human owners for:
   - incidents
   - backups/restores
   - key rotation
   - legal/provider communication
7. Approve the legal/customer documents before public launch.

## Scope Clarifications

- Google OAuth is **not currently required by this codebase** for the main launch path.
- Do not block the launch on Google/Apple/Microsoft auth unless the user explicitly adds social login or external SSO to launch scope.
- SMS and push should not be presented as live launch features unless:
  - a real provider is chosen
  - credentials are obtained
  - delivery is actually proven

## Launch Decision Rule

The project can be called "ready for full production launch" only if all are true:

- code verification surface is green
- staging/operator rehearsal is evidenced
- external provider onboarding/credentials are completed for launch-scope features
- runtime dependencies are provisioned
- legal/support/ops ownership is assigned

If any of those are still open, the correct status is:

- `pre-production`
- or `limited pilot only`
- but not `full production launch`
