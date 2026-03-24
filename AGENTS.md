# Law Organizer Codex Guide

This file is the primary operational truth source for Codex work in this repository.

If `AGENTS.md`, old audit files, and long historical notes disagree:
- trust this file first;
- confirm against code and scripts;
- treat older audit docs as historical unless they are explicitly labeled current.

## Product

Law Organizer is a production-intended multi-tenant legal practice platform for Ukraine. The active repository scope is broader than a basic CRM:

- cases and participants
- clients and onboarding
- documents, revisions, signatures, file storage
- notes workspace
- invoices, billing, subscriptions
- pricelists and fee calculations
- events and reminders
- mobile scan sessions and PDF post-processing
- registry/external-data search and indexing
- trust verification foundations for ACSK / Diia / BankID NBU

## Current Stack

- Backend: NestJS 10 + TypeORM
- Frontend: React 18 + Vite
- Local default DB: SQLite via `better-sqlite3`
- Production-like DB: PostgreSQL
- Cache/rate-limit backing: Redis
- Storage: local filesystem in dev, S3/MinIO in production-like modes
- Payments: Stripe, WayForPay
- Background processing: `@nestjs/schedule` + DB-backed job tables
- PDF/OCR tooling: Python pipeline plus host tools for some scan workflows

## Current Architecture Reality

- The main API runtime is `src/main.ts`.
- The frontend lives in `src/frontend`, not in a top-level `frontend/` directory.
- A dedicated worker runtime exists in `src/worker.ts` and builds to `dist/worker.js`.
- Background work is not BullMQ today. It is a scheduled/polling worker model driven by:
  - `RUN_SCHEDULED_JOBS=false` on web/API processes
  - `RUN_SCHEDULED_JOBS=true` on worker processes
- The current worker is DB-backed and cron-driven. Do not document or assume Redis queue leasing unless code is changed.
- `EnterpriseModule` is currently disabled in `src/app.module.ts`; do not treat the `src/enterprise/` tree as the primary active runtime path.
- Direct backend routes use `/v1`.
- `GET /health` and `GET /readiness` are unprefixed.
- `/api` is only a frontend/nginx proxy convention, not the direct backend prefix.

## Database And Isolation Truth

- Local development defaults to SQLite and `synchronize: true`.
- Production-like and security-hardening paths depend on PostgreSQL migrations.
- Request-scoped PostgreSQL session context is implemented for:
  - `app.current_tenant_id`
  - `app.current_user_id`
  - `app.current_user_role`
- Tenant+user PostgreSQL RLS migrations exist and are part of the current codebase.
- Do not rely on `ENABLE_RLS` as a real runtime switch. Current enforcement depends on:
  - running against PostgreSQL
  - applying the migrations
  - setting request context correctly

## Worker And Runtime Warnings

- In current local dev scripts, the API process keeps scheduled jobs off by default:
  - `npm run start:dev` sets `RUN_SCHEDULED_JOBS=false`
  - `npm run start:all` inherits that safer API behavior
  - use `npm run start:worker:dev` when you need the dedicated local worker path
- In split web/worker modes, always keep:
  - web/API: `RUN_SCHEDULED_JOBS=false`
  - worker: `RUN_SCHEDULED_JOBS=true`
- The Docker service name `redis-worker` is historical naming. The worker is not a Redis queue consumer.

## Run And Validation Expectations

- Install: `npm install`
- Fast local dev: `npm run start:all`
- Backend only: `npm run start:dev`
- Worker only: `npm run start:worker:dev`
- Frontend only: `npm run start:frontend`
- Backend build: `npm run build`
- Frontend build: `npm run build:frontend`
- Full lint: `npm run lint`
- Unit/integration tests: `npm test -- --runInBand`
- E2E: `npm run test:e2e -- --runInBand`
- Frontend smoke: `npm run test:frontend:smoke`
- Postgres migrations: `npm run migration:run`
- Registry index rebuild: `npm run build:registry-index`
- External data dry run/update: `npm run update:external-data -- --dry-run`

## Validation Rules For Codex

- After backend logic changes, run at least:
  - `npm run build`
  - relevant targeted tests when they exist
- After frontend changes, run at least:
  - `npm run build:frontend`
- After auth, tenancy, billing, migrations, storage, worker, or security changes, prefer the heavier surface:
  - `npm run lint`
  - `npm test -- --runInBand`
  - `npm run build`
  - add `npm run test:e2e -- --runInBand` when routes/contracts changed
- Do not claim a change is production-safe if it has only been validated on SQLite when the behavior depends on PostgreSQL, Redis, worker separation, malware scanning, or provider callbacks.
- Distinguish clearly between:
  - code present
  - locally verified
  - staging/production proven

## Documentation Update Rules

For every substantial task, keep code and docs aligned before stopping.

Always update:
- `CLAUDE.md` for stable context, recent changes, and open risks
- `docs/PROJECT_CONTEXT_CACHE.md` for the current session snapshot and actual verification run

Update additional docs when relevant:
- `RUN.md` when run modes, prerequisites, or startup expectations change
- security/readiness/deployment docs when security posture or launch assumptions change

Do not preserve contradictions for the sake of history. Fix them or label them historical.

## Live VPS Sync Rule

- When the user has explicitly provided current-session VPS access and expects a live server-visible result, treat local repo changes and the corresponding VPS update as one completion target.
- In that mode, do not stop at a local fix if the user asked for a server-facing outcome; finish the matching VPS sync/rebuild/restart/verification for the affected surface too.
- Mirror the same logical change in both places during the same work session:
  - local repo code/docs
  - VPS working tree or deployment assets
  - relevant container/service restart or rebuild
  - a real live verification probe when feasible
- Do not write plaintext passwords, tokens, or private keys into repository files, docs, commits, or generated artifacts.
- It is acceptable for only machine-specific values to differ between local and VPS:
  - secrets
  - hostnames/IPs
  - certificates
  - caches
  - logs
  - runtime data

## Navigation Hints

Key runtime entry points:
- `src/main.ts`
- `src/app.module.ts`
- `src/worker.ts`

Key backend areas:
- `src/auth/`
- `src/cases/`
- `src/clients/`
- `src/documents/`
- `src/file-storage/`
- `src/trust-verification/`
- `src/external-data/`
- `src/registry-index/`

Key cross-cutting files:
- `src/common/interceptors/rls.interceptor.ts`
- `src/common/security/subscription-limits.ts`
- `src/common/security/pii-protection.ts`
- `src/common/health/operational-monitoring.service.ts`

Frontend root:
- `src/frontend/App.tsx`

Primary docs after this file:
- `RUN.md`
- `CLAUDE.md`
- `docs/PROJECT_CONTEXT_CACHE.md`
- `docs/PRODUCTION_READINESS_REPORT.md`

Historical-only docs:
- `AUDIT_QUICK_REFERENCE.md`
- `NESTJS_BACKEND_AUDIT_REPORT.md`
- `API_EXAMPLES.md`

## Constraints For Future Codex Work

- Do not call the repo production-ready unless staging/runtime/provider evidence exists, not just green local tests.
- Do not assume BullMQ, MCP, or multi-agent orchestration are needed here.
- Do not treat Kubernetes manifests as automatically current truth; verify them against the active runtime model first.
- Do not document root-level `frontend/...` paths; use `src/frontend/...`.
- Do not add speculative infrastructure to match old docs.
- Prefer the smallest reliable fix set.

## Local Vs Production-Like Differences

- Local fast mode:
  - SQLite
  - `synchronize: true`
  - usually no Redis requirement
  - API process uses `RUN_SCHEDULED_JOBS=false` in the default dev scripts
  - scheduled jobs should run in a separate local worker when needed
- Production-like mode:
  - PostgreSQL
  - Redis expected
  - migrations required
  - web and worker should be separated by `RUN_SCHEDULED_JOBS`
  - S3/MinIO-style storage expected
- The repo does not currently include the files needed for the `nginx-proxy` service in `docker-compose.yml`:
  - `nginx.prod.conf`
  - `ssl/`
  Treat that service as incomplete until those assets exist.
