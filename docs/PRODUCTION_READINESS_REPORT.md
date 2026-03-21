# Law Organizer - Production Readiness Report

**Status Correction Date:** 2026-03-19  
**Project:** Legal CRM SaaS Platform  
**Scope:** launch readiness, verified local status, and remaining full-production blockers

---

## Executive Summary

### Overall Status: NOT PRODUCTION READY

As of 2026-03-19, the codebase is locally verified and the main automated surface is green again. That is good news, but it is still not enough for a full production launch.

### Current Stage: PRE-PRODUCTION RELEASE CANDIDATE

The current reality is:

- the local code/test/build surface is green
- the main remaining launch blockers are external/provider/ops/runtime/staging items
- the project is suitable for continued pre-production work or a tightly controlled pilot, but not for full public launch yet

## Verified Local Status (2026-03-19)

- `npm run lint` -> PASS
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS
  - Vite chunk warnings remain, but the build completes
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
  - `tesseract`, `ocrmypdf`, `unpaper`, `python3` present
  - `clamscan`, `clamdscan` absent on the active host shell
- `python3 -c "import importlib.util; print(importlib.util.find_spec('cv2') is not None)"` -> FAIL
  - default host `python3` lacks `cv2`
- `./.venv-pdf/bin/python -c "import numpy, cv2; from PIL import Image; print('venv_pdf_ready')"` -> PASS

## What Is Actually Ready Now

- NestJS backend compiles cleanly
- React/Vite frontend compiles cleanly
- current unit/integration surface is green
- current case e2e surface is green
- current browser smoke surface is green
- multi-tenant JWT/auth/RBAC/subscription/PII hardening remains present
- trust-provider adapters and callback authentication exist in code
- billing webhook handling exists in code
- PDF/OCR orchestration exists in code
- malware scan workflow exists in code

## Hard Blockers For Full Launch

1. Trust-provider onboarding is still incomplete outside the codebase.
   Real ACSK / Diia / BankID contracts, live credentials, approved callback URLs, and staging proof are still required.
2. Payment-provider launch proof is still incomplete outside the codebase.
   Real Stripe and/or WayForPay launch credentials, webhook registration, and rehearsal evidence are still required if paid launch is in scope.
3. Outbound communication is not yet launch-proven.
   The notification workflow manages queue/status transitions, but the current delivery branch does not prove a real email/SMS/push provider transport.
4. Production OCR/malware runtime is not yet proven on the real target environment.
   The project venv works locally, but the active host shell still lacks default `python3` + `cv2` parity and lacks ClamAV binaries.
5. Staging/operator rehearsal is still open.
   Deploy, migrate, degrade, backup/restore, webhook/callback, and runtime drills still need evidence outside the local workspace.
6. Business/legal/ops ownership is still open.
   Domain/DNS/TLS, S3/backups, Sentry/alerts, support channels, legal texts, and named owners still need to be finalized.

## Important Technical Caveats

- Direct backend routes use `/v1`.
- `GET /health` and `GET /readiness` are unprefixed.
- `/api/...` is only a proxy convention at the frontend/edge, not the direct Nest prefix.
- The worker is DB-backed and scheduled, not BullMQ-based.
- Production-like mode depends on:
  - PostgreSQL
  - Redis
  - migrations
  - split web/worker operation with `RUN_SCHEDULED_JOBS=false` on web and `RUN_SCHEDULED_JOBS=true` on worker
- The repository still lacks the checked-in assets for the `nginx-proxy` path:
  - `nginx.prod.conf`
  - `ssl/`

## Non-Code Actions Still Required

- decide final launch scope
- sign provider contracts / finish provider onboarding
- obtain and securely store live credentials and secrets
- approve final public callback URLs
- prepare domain, DNS, TLS, and ingress routing
- prepare production PostgreSQL, Redis, S3/object storage, and backups
- prepare Sentry/error routing and incident ownership
- approve privacy/support/legal materials
- run one full staging/operator rehearsal with evidence capture

## Specific Scope Clarifications

- Google OAuth is not part of the current main launch path.
- Do not block the launch on Google/Apple/Microsoft auth unless social login or SSO is explicitly added to scope.
- Do not market SMS/push as live launch features unless a real provider path is chosen and proven.

## Ordered Next Work

1. Finish the business/provider scope decision.
2. Collect live/sandbox credentials and callback approvals for the selected providers.
3. Prepare staging with PostgreSQL, Redis, object storage, and the dedicated worker split.
4. Rehearse trust-provider callbacks, payment webhooks, and outbound transport on staging.
5. Rehearse backup/restore, OCR/PDF runtime, and malware scanning on the target-style environment.
6. Finalize domain/DNS/TLS/Sentry/support/legal ownership.

## Launch Decision Rule

The project can be called ready for full production launch only when all of the following are true:

- local verification is green
- staging/operator rehearsal is evidenced
- launch-scope providers are onboarded and credentialed
- real callback/webhook paths are registered and proven
- runtime dependencies are provisioned on the target environment
- legal/support/ops ownership is assigned

Until then, the accurate status remains:

- `pre-production`
- or `limited pilot only`
- not `full production launch`
