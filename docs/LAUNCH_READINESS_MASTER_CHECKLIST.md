# Launch Readiness Master Checklist

**Updated:** 2026-03-20  
**Audience:** AI agent, product owner, operator, non-technical launch owner  
**Purpose:** single source of truth for "Can we fully launch?" and "What is still missing?"

Use this document when:

- the task is "Can we launch?"
- the task is "What is still missing before production?"
- an agent needs to separate code readiness from external/provider/ops readiness

## Current Status Snapshot

### Current conclusion

- Project stage: `pre-production release candidate`
- Launch decision: `NOT READY FOR FULL PRODUCTION LAUNCH`

### Current interpretation

- The local code verification surface is green again.
- The repository currently looks runnable and testable locally.
- The main remaining launch blockers are now mostly:
  - external provider onboarding and credentials
  - production runtime/tooling provisioning
  - staging/operator rehearsal
  - business/legal/ops ownership

## Verified On 2026-03-19

- `npm run lint` -> PASS
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS
  - Vite still reports circular/manual chunk and large-chunk warnings
- `npm test -- --runInBand` -> PASS
  - 32 passed suites, 1 skipped suite
  - 176 passed tests, 3 skipped tests
- `npm run test:e2e -- --runInBand` -> PASS
  - 22/22
- `npm run test:frontend:smoke` -> PASS
  - 3/3
- `npm test -- --runInBand src/clients/services/court-registry.service.spec.ts src/registry-index/services/registry-index.service.spec.ts` -> PASS
  - 10/10
- `which tesseract ocrmypdf unpaper clamscan clamdscan python3` -> PARTIAL
  - `tesseract`, `ocrmypdf`, `unpaper`, and `python3` are present
  - `clamscan` and `clamdscan` are missing from the active host shell
- `python3 -c "import importlib.util; print(importlib.util.find_spec('cv2') is not None)"` -> FAIL
  - default host `python3` does not expose `cv2`
- `./.venv-pdf/bin/python -c "import numpy, cv2; from PIL import Image; print('venv_pdf_ready')"` -> PASS
  - the project PDF venv is usable, but the default system Python is still not enough by itself

## What This Means

- Local green checks do not equal production readiness.
- Code is no longer the main launch blocker.
- Full launch is still blocked by:
  - real provider contracts/onboarding
  - real provider credentials and callback approvals
  - real production-like runtime provisioning
  - staging proof for deploy/degrade/backup/restore/provider flows
  - named human ownership for operations, incidents, backups, and legal/support processes

## Agent Rules

1. Do not call the product production-ready from local green verification alone.
2. Always separate remaining work into:
   - locally verified code
   - external integrations needing contracts/credentials
   - non-programming business/legal/ops tasks
   - staging/runtime proof tasks
3. Do not block launch on Google OAuth, Apple login, Microsoft login, or generic social login unless the user explicitly adds them to launch scope.
4. Do not mark email/SMS/push as "live" merely because notification rows change status in the database.
5. Record exact public callback URLs only after ingress/domain decisions are final.

## Recommended Day-One Scope For This Repo

If the immediate goal is the fastest credible staging rollout and a controlled first launch wave, use this reduced scope:

- keep in scope:
  - core CRM modules
  - local auth/session/2FA
  - PostgreSQL + Redis + dedicated worker
  - file storage, malware scanning, and PDF/OCR runtime
  - in-app notifications
  - SMTP-backed transactional email for essential flows
- explicitly keep out of day-one scope:
  - ACSK / Diia / BankID NBU live rollout
  - Stripe / WayForPay self-serve public billing
  - SMS
  - push
  - Google / Apple / Microsoft auth

Supporting artifacts for this scope cut:

- `docs/DAY_ONE_SCOPE_AND_STAGING_PREP.md`
- `.env.staging.example`

This is a staging/launch-scope recommendation, not a claim that those excluded tracks are complete or no longer needed forever.

## A. Current Code Status

- [x] Backend build is green locally
- [x] Frontend build is green locally
- [x] Full unit/integration test surface is green locally
- [x] E2E surface is green locally
- [x] Frontend smoke surface is green locally
- [x] Minor lint regression in registry tokenization was fixed on 2026-03-19
- [ ] PostgreSQL + Redis + split worker proof is captured on staging
- [ ] Public ingress and real callback routing are exercised end-to-end
- [ ] Production host runtime for OCR/malware scan is proven outside the dev workstation

## B. External Integrations That Need More Than Code

### B1. Trust Providers

- [ ] ACSK / КЕП launch onboarding is complete
- [ ] Diia launch onboarding is complete
- [ ] BankID NBU launch onboarding is complete

Direct backend callback path in code:

- `/v1/trust-verifications/callbacks`

Required artifacts before claiming launch readiness:

- signed agreement or approved onboarding
- live credentials
- approved public callback URL
- staging or production-like proof of the real verification flow

Environment keys used when live mode is enabled:

- ACSK:
  - `ACSK_TRUST_VERIFY_SIGNATURE_URL`
  - `ACSK_TRUST_VERIFY_IDENTITY_URL`
  - `ACSK_TRUST_CALLBACK_SECRET`
- Diia:
  - `DIIA_CLIENT_ID`
  - `DIIA_CLIENT_SECRET`
  - `DIIA_IDENTITY_VERIFY_URL`
  - `DIIA_SIGN_VERIFY_URL`
  - `DIIA_CALLBACK_SECRET`
- BankID NBU:
  - `BANKID_CLIENT_ID`
  - `BANKID_CLIENT_SECRET`
  - `BANKID_NBU_IDENTITY_URL`
  - `BANKID_NBU_CALLBACK_SECRET`

### B2. Payment Providers

- [ ] Stripe live merchant/account setup is complete
- [ ] WayForPay merchant setup is complete

Direct backend webhook paths in code:

- `/v1/billing/webhooks/stripe`
- `/v1/billing/webhooks/wayforpay`
- `/v1/billing/webhooks/wayforpay/service`

Important note:

- A public deployment may expose proxied `/api/...` callback URLs at the edge, but the backend runtime itself is `/v1/...`.
- The final provider-facing URL must match the real deployed ingress/proxy path, not just the Nest controller path.

Required artifacts before claiming launch readiness:

- approved live account
- live keys/secrets
- registered public webhook URL
- real callback proof on staging or production-like environment
- at least one successful payment lifecycle rehearsal for the launch plan

Expected credential groups:

- Stripe:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRICE_BASIC`
  - `STRIPE_PRICE_PROFESSIONAL`
  - `STRIPE_PRICE_ENTERPRISE`
- WayForPay:
  - `WAYFORPAY_MERCHANT_ACCOUNT`
  - `WAYFORPAY_MERCHANT_SECRET_KEY`
  - `WAYFORPAY_API_URL`

### B3. Outbound Communication

- [ ] Email provider is chosen and real delivery proof exists
- [ ] SMS is either explicitly de-scoped or fully provider-backed and proven
- [ ] Push is either explicitly de-scoped or fully provider-backed and proven

Current code reality:

- `src/notifications/services/notification.service.ts` manages queue/state transitions.
- For `email`, `sms`, and `push`, the current delivery code marks notifications as delivered when the required recipient field is present.
- No real SMTP/SMS/push provider API call is performed in that delivery branch today.

Launch rule:

- Do not present email/SMS/push as fully live customer-facing guarantees until real providers are selected, configured, and rehearsed.

### B4. File Scan And PDF/OCR Runtime

- [ ] OCR/PDF runtime is provisioned on the real target host/image
- [ ] ClamAV runtime is provisioned on the real target host/image

Runtime expectations referenced by the code:

- `python3`
- `opencv` / `cv2`
- `PIL`
- `pdftoppm`
- `ocrmypdf`
- `unpaper`
- `tesseract`
- `clamscan` or `clamdscan`

Current evidence:

- project PDF venv is usable locally
- default host `python3` still lacks `cv2`
- active host shell still lacks `clamscan` / `clamdscan`

## C. Non-Programming / Business / Operations Checklist

### Required owner groups

- business owner
- legal/compliance owner
- ops/infrastructure owner
- incident/on-call owner
- backup/restore owner
- provider liaison / vendor contact owner

### Must Be Finished Before Full Launch

- [ ] Decide which features are really in launch scope:
  - ACSK / КЕП
  - Diia
  - BankID NBU
  - Stripe
  - WayForPay
  - email
  - SMS
  - push
- [ ] Sign provider agreements or finish formal onboarding for every launch-scope provider
- [ ] Obtain and securely store production credentials/secrets
- [ ] Approve and register final public callback URLs with providers
- [ ] Buy/configure production domain, DNS, and TLS certificates
- [ ] Prepare production PostgreSQL, Redis, object storage, and backup storage
- [ ] Prepare Sentry/error tracking and alert routing
- [ ] Assign named owners for incidents, key rotation, backups/restores, and provider communication
- [ ] Approve customer-facing legal/support materials

Minimum credential/secrets groups expected by this repository:

- JWT secrets
- encryption key
- database credentials
- Redis credentials
- S3/object storage credentials
- Stripe credentials
- WayForPay credentials
- SMTP credentials
- provider callback secrets
- Sentry DSN
- backup encryption key

Minimum customer-facing/legal artifacts:

- support mailbox
- reply-to mailbox
- privacy policy
- terms/public offer
- retention/data-processing policy if required by launch scope

## D. Staging / Operator Rehearsal

- [ ] Deploy frontend, backend, worker, PostgreSQL, and Redis in staging
- [ ] Apply migrations in staging
- [ ] Verify `GET /health` and `GET /readiness`
- [ ] Verify web/API uses `RUN_SCHEDULED_JOBS=false`
- [ ] Verify worker uses `RUN_SCHEDULED_JOBS=true`
- [ ] Rehearse Redis degradation
- [ ] Rehearse PostgreSQL degradation
- [ ] Rehearse backup and restore
- [ ] Rehearse blind-index key rotation
- [ ] Rehearse trust-provider callbacks with real/sandbox credentials
- [ ] Rehearse real Stripe and/or WayForPay webhooks
- [ ] Rehearse real email/SMS/push delivery if those channels remain in scope
- [ ] Rehearse OCR/PDF processing on the actual deployment target
- [ ] Rehearse clean/infected/failure malware scan behavior on the actual deployment target

## E. Plain-Language Action List For A Non-Technical Owner

1. Decide what you are really launching on day one.
   If login by Google is not part of the product today, do not waste time on it. The current codebase does not require Google OAuth for the main launch path.
2. Sign contracts or finish onboarding with the providers you actually want to use.
   For example: ACSK, Diia, BankID, Stripe, WayForPay, email provider.
3. Get the real keys, secrets, and approved callback addresses from those providers.
4. Prepare the real domain name, DNS records, and SSL certificates for the public site.
5. Prepare the production servers/services: database, Redis, file storage, backups, error monitoring.
6. Decide who is responsible for incidents, backups, restoring data, and provider communication.
7. Approve the legal and customer-support materials before public launch.
8. Run one full staging rehearsal:
   deploy, migrate, test callbacks, test payments, test email, test backups, test restore, test OCR/scanner.

## F. Decision Rule

The project can be called "ready for full production launch" only if all are true:

- local code verification is green
- staging/operator rehearsal is evidenced
- launch-scope providers are onboarded and credentialed
- public callback URLs are registered and proven
- runtime/tooling dependencies are provisioned on the target environment
- legal/support/ops ownership is assigned

If any of those are still open, the correct status is:

- `pre-production`
- or `limited pilot only`
- but not `full production launch`
