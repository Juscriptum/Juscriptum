# Day-One Scope And Staging Prep

**Updated:** 2026-03-20  
**Audience:** product owner, operator, and engineer preparing the first staging rollout  
**Purpose:** turn the current "pre-production" status into an executable staging plan with a reduced, explicit launch scope

This document is intentionally narrower than a full production roadmap.

Use it when:

- the task is "decide what is really in the first launch wave"
- the task is "prepare staging now"
- the team needs a practical scope cut that removes avoidable provider blockers

## Recommended Day-One Scope

This is the recommended scope if the goal is the fastest credible staging rollout and a controlled first launch wave.

### In Scope

- core CRM flows:
  - organizations, users, auth, sessions, 2FA
  - clients, cases, participants
  - documents, revisions, file storage
  - notes workspace
  - events and reminders
  - pricelists and calculations
  - invoices as internal business records
  - registry/external-data search that is already locally verified
  - mobile scan sessions and PDF post-processing
- bearer-token API with current `/v1` backend routes
- PostgreSQL + Redis + dedicated worker topology
- in-app notifications
- SMTP-backed transactional email for essential flows such as password reset and launch-critical operator/customer communication
- S3/MinIO-style object storage
- malware scanning and OCR/PDF tooling on the target-style runtime

### Explicitly Out Of Day-One Scope

- ACSK / КЕП live launch integration
- Diia live launch integration
- BankID NBU live launch integration
- Stripe self-serve public billing
- WayForPay self-serve public billing
- SMS delivery
- push delivery
- Google / Apple / Microsoft auth

### Why This Is The Recommended Cut

- It keeps the first staging pass focused on the core legal-practice workflow that is already green locally.
- It removes the largest current launch blockers that depend on contracts, callback approvals, or live provider onboarding.
- It avoids marketing channels as "live" when the repo still lacks real outbound SMS/push transport proof.
- It still preserves a production-like architecture: PostgreSQL, Redis, worker split, object storage, malware scanning, and PDF runtime.

### Rules For Expanding Scope Later

Add any of the excluded providers only after all of the following are true:

- the provider is formally in launch scope
- credentials and secrets exist
- public callback/webhook URLs are approved
- the full flow is rehearsed on staging
- the result is recorded in launch-readiness docs

## Staging Goal For This Scope

The staging milestone for this document is:

- prove the core CRM stack on PostgreSQL + Redis + worker split
- prove file upload, malware scanning, and PDF processing on target-style runtime
- prove health/readiness, degradation behavior, and backup/restore
- avoid claiming live trust/payment/SMS/push readiness before those tracks are separately proven

## Staging Architecture Checklist

- frontend
- backend API
- dedicated worker
- PostgreSQL
- Redis
- S3/MinIO-compatible object storage
- real ClamAV command runtime
- Python/OpenCV/Pillow PDF runtime
- Sentry or equivalent alert sink

Do not use the checked-in `nginx-proxy` service as the authoritative ingress path from this repo until the missing `nginx.prod.conf` and `ssl/` assets exist.

## Environment Baseline

Use [`.env.staging.example`](/Users/edhar/Documents/Адвокатська практика/Сайт Органайзер Юриста/Project Z Code/.env.staging.example) as the starting point.

Important staging rules:

- `NODE_ENV=production`
- `DB_TYPE=postgres`
- `REDIS_ENABLED=true`
- `STORAGE_PROVIDER=s3`
- `ENCRYPT_PII=true`
- `MALWARE_SCANNER_MODE=clamav_command`
- web/API must run with `RUN_SCHEDULED_JOBS=false`
- worker must run with `RUN_SCHEDULED_JOBS=true`
- `ACSK_TRUST_MODE=stub`
- `DIIA_TRUST_MODE=stub`
- `BANKID_NBU_MODE=stub`
- leave Stripe / WayForPay secrets unset unless online payments are explicitly re-added to scope

## Recommended Startup Sequence

1. Prepare secrets and object-storage bucket/container for staging.
2. Boot PostgreSQL, Redis, and object storage.
3. Apply migrations before exposing application traffic.
4. Start backend with `RUN_SCHEDULED_JOBS=false`.
5. Start worker with `RUN_SCHEDULED_JOBS=true`.
6. Start frontend.
7. Verify `GET /health` and `GET /readiness`.
8. Run one end-to-end smoke across login -> client/case -> document/file upload -> worker processing -> restore checks.

## Evidence To Capture

- healthy `/health`
- healthy `/readiness`
- degraded `/readiness` during a controlled Redis or Postgres interruption
- migration log or release record
- successful login and authenticated core CRM flow
- successful file upload with malware-scan outcome
- successful PDF/OCR processing on the staging runtime
- backup artifact and isolated restore proof
- worker proof that scheduled jobs are not double-running on the web process

## Stop Conditions

Do not promote this scope from staging to public launch if any of the following remain unproven:

- PostgreSQL migrations on a production-like environment
- Redis-backed throttling in a production-like environment
- worker split with no double-processing
- malware scanning on the target-style runtime
- OCR/PDF tooling on the target-style runtime
- SMTP-backed email delivery for essential flows
- backup/restore recovery path

## What This Decision Does Not Claim

This decision does not mean:

- the repo is production-ready
- payments are live
- trust providers are live
- SMS/push are live
- staging proof already exists

It only means the team now has a smaller, executable first-launch target that fits the current code and documented risks.
