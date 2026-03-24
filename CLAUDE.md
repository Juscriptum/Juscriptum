# Law Organizer Context

This is the secondary context file for Codex work.

Use it for stable project context, recent verified changes, and unresolved risks.
Do not use it as a free-form diary.

## Stable Project Context

- Product: multi-tenant legal practice platform for Ukraine
- Primary truth order:
  - `AGENTS.md`
  - `RUN.md`
  - this file
  - `docs/PROJECT_CONTEXT_CACHE.md` for session history
- Backend: NestJS + TypeORM
- Frontend: React + Vite in `src/frontend`
- Platform-owner admin work now has a separate scaffold:
  - backend module in `src/platform-admin`
  - separate frontend entry in `platform-admin.html` and `src/frontend/platform-admin`
- Local default database: SQLite
- Production-like database: PostgreSQL
- Registry SQLite caches are shared across users and are not tenant-scoped:
  - `storage/registry-index.db` for `court_stan` and `court_dates`
  - `storage/asvp-index.db` for ASVP import metadata / batch state
  - `storage/asvp-index-shards/asvp-YYYY.db` for yearly ASVP search shards
- Current worker model: `src/worker.ts` plus `RUN_SCHEDULED_JOBS` split
- Current background architecture: scheduled/polling DB-backed jobs, not BullMQ
- Operational parity rule:
  - local and VPS runtime/deployment changes must be mirrored both ways for all non-machine-specific behavior
  - when the user has provided current-session VPS access and expects a live result, completion means local change plus matching VPS update plus live verification for the affected surface
  - plaintext credentials must not be stored in repo files or docs; only the operational rule and non-secret host context may be recorded
  - machine-specific secrets, hostnames, certificates, caches, logs, and generated data may differ

## Current Operational Truth Summary

### 2026-03-22 Live VPS Sync Default

- If the user has explicitly provided live VPS access in the current session and asks for a server-visible outcome, the expected completion path is now:
  - local repo change
  - matching VPS sync/update
  - affected service rebuild/restart
  - live verification when feasible
- This rule is intentionally operational, not secret storage:
  - plaintext passwords/tokens/keys are not written into repo files or docs
  - only the workflow expectation and safe non-secret context are documented
  - machine-specific secrets remain out of versioned files

### Locally Verified In Code

- Direct backend API prefix is `/v1`
- `GET /health` and `GET /readiness` are unprefixed
- A dedicated worker entrypoint exists at `src/worker.ts`
- `dist/worker.js` is produced by the current backend build
- Request-scoped PostgreSQL session context is implemented in:
  - `src/common/interceptors/rls.interceptor.ts`
- Tenant+user PostgreSQL RLS migration exists in:
  - `src/database/migrations/1710100000000-HardenPostgresRlsPolicies.ts`
- Declarative RBAC exists via:
  - `src/auth/decorators/access-control.decorators.ts`
  - `src/auth/guards/index.ts`
- Access-token revocation exists via:
  - `src/database/entities/RevokedAccessToken.entity.ts`
  - `src/auth/strategies/jwt.strategy.ts`
- PII encryption and blind-index support exist in code
- Malware scan workflow exists and blocks non-clean files in the application layer
- Trust-provider adapters, signed callback auth, retries, and worker processing exist in code

### Current Runtime Reality

- Fast local development is SQLite-first and can run in a single API process.
- Current local dev scripts keep scheduled jobs off on the API by default:
  - `npm run start:dev` sets `RUN_SCHEDULED_JOBS=false`
  - `npm run start:all` inherits the same lighter API behavior
  - `npm run start:worker:dev` is the explicit local worker path when background jobs are needed
- PostgreSQL-dependent features are not proven by SQLite-only runs.
- Production-like web/worker separation depends on:
  - web/API with `RUN_SCHEDULED_JOBS=false`
  - worker with `RUN_SCHEDULED_JOBS=true`
- `EnterpriseModule` remains disabled in `src/app.module.ts`.
- `docker-compose.yml` contains a more ambitious stack than the repo can fully run as-is:
  - `nginx.prod.conf` is missing
  - `ssl/` is missing

### Launch Status

- Current status: not production-ready
- Better phrasing:
  - locally hardened
  - locally verified
  - pre-production
  - externally unproven

### What Is Still Not Production-Proven

- real ACSK / Diia / BankID credentials and staging proof
- real Stripe / WayForPay launch credentials and webhook proof if paid launch is in scope
- real outbound email / SMS / push provider delivery proof
- live provider callback behavior against real upstreams
- real scanner/runtime proof on the target environment
- deploy/degrade/backup/restore rehearsal evidence outside the local workspace
- final public domain / DNS / TLS / callback registration decisions
- named legal / support / ops ownership for launch
- whether the checked-in Kubernetes manifests reflect the currently deployed topology

## Recent Changes / Changelog

### 2026-03-22 - Case Participant Roles Expanded With Representative Variants

- Updated:
  - `src/frontend/utils/caseParticipants.ts`
  - `src/frontend/utils/caseParticipants.spec.ts`
  - `CLAUDE.md`
  - `docs/PROJECT_CONTEXT_CACHE.md`
- Current behavior now:
  - the case participant role picker keeps the existing single-select structure and manual `Інше` fallback
  - representative support is now expressed through explicit legal role labels in the dropdown instead of a separate checkbox or submenu
  - judicial/enforcement roles now include representative variants such as `Представник позивача`, `Представник відповідача`, `Представник стягувача`, and related roles
  - criminal/admin roles now include `Захисник` plus representative and lawful-representative options such as `Представник потерпілого`, `Представник цивільного позивача`, and `Представник цивільного відповідача`
  - registration/property roles now include dedicated representative variants
  - mediation now includes `Медіатор` and mediation representative roles
  - representative plaintiff/defendant roles remain compatible with legacy plaintiff/defendant field derivation used elsewhere in the app
- Verification run in this session:
  - `npm test -- --runInBand src/frontend/utils/caseParticipants.spec.ts` -> PASS
  - `npm run build:frontend` -> PASS

### 2026-03-22 - Read-Only Client/Event Contacts Open Phone And Mail Apps

- Added:
  - `src/frontend/components/ContactText.tsx`
  - `src/frontend/components/ContactText.css`
- Updated:
  - `src/frontend/pages/clients/ClientDetailsPage.tsx`
  - `src/frontend/pages/calendar/CalendarPage.tsx`
  - `CLAUDE.md`
  - `docs/PROJECT_CONTEXT_CACHE.md`
- Current behavior now:
  - read-only client cards now render primary and additional phone/email values as clickable `tel:` and `mailto:` links
  - the calendar event details modal now linkifies the responsible-contact field when it contains a phone number or email
  - edit forms remain unchanged; only the view-mode presentation was updated
  - case details currently do not expose separate phone/email fields in read-only mode, so no case-screen change was required for this task
- Verification run in this session:
  - `npm run build:frontend` -> PASS

### 2026-03-22 - Registry Search Now Excludes `court_dates` And Case Prefill Restores Roles

- Updated:
  - `src/clients/services/court-registry.service.ts`
  - `src/clients/services/court-registry.service.spec.ts`
  - `src/cases/controllers/cases.controller.ts`
  - `src/clients/controllers/clients.controller.ts`
  - `src/frontend/pages/cases/AddCasePage.tsx`
  - `src/frontend/pages/events/AddEventPage.tsx`
  - `src/frontend/types/case.types.ts`
  - `src/frontend/utils/caseRegistryPrefill.ts`
  - `src/frontend/utils/caseRegistryPrefill.spec.ts`
  - `CLAUDE.md`
  - `docs/PROJECT_CONTEXT_CACHE.md`
- Current behavior now:
  - the combined client/case registry search now serves only `court_registry` (`court_stan`) and `asvp`
  - `court_dates` is no longer part of the generic registry-search API and is reserved for the nearest-hearing-by-case flow
  - when a case is prefilled from a registry-selected client/result, the selected person now always lands in case participants with their registry role; ASVP prefills also keep the counterparty side instead of dropping the client role
  - the add-event registry helper now requires a selected case and resolves hearings only through the case-level nearest-hearing lookup
- Verification run in this session:
  - `npm test -- --runInBand src/clients/services/court-registry.service.spec.ts src/frontend/utils/caseRegistryPrefill.spec.ts` -> PASS
  - `npm run build` -> PASS
  - `npm run build:frontend` -> PASS

### 2026-03-22 - Frontend Nginx Re-Resolves Backend After Container Recreate

- Updated:
  - `nginx.conf`
  - `RUN.md`
  - `CLAUDE.md`
  - `docs/PROJECT_CONTEXT_CACHE.md`
- Current behavior now:
  - frontend nginx no longer pins API proxy traffic to the backend container IP that existed when nginx first started
  - Docker DNS is now re-resolved through `127.0.0.11`, so recreating the backend container no longer leaves `/api/*` routes stuck on a stale bridge-network IP
  - the shared `/api/*` proxy path now uses an internal rewrite before `proxy_pass`, so variable-based upstream resolution no longer collapses routes like `/api/clients` into bare `/v1/`
  - explicit `/api/health` and `/api/readiness` proxy routes now target the backend's real unprefixed health endpoints instead of the general `/v1/*` prefix
  - this specifically addresses the VPS failure mode where the site shell stayed up but API calls degraded to `502 Bad Gateway` after backend recreation
- Verification run in this session:
  - live VPS hotfix: `docker compose -f docker-compose.yml -f docker-compose.vps.yml restart frontend`
  - live VPS probe: `GET /api/clients?limit=20&page=1` -> `401 Unauthorized` instead of `502`
  - live VPS probe: `GET /api/organizations/onboarding` -> `401 Unauthorized` instead of `502`
  - live VPS proof after redeploy: `GET /api/health` -> `200 OK`
  - live VPS proof after frontend rebuild plus backend recreate: `GET /api/clients?limit=20&page=1` -> `401 Unauthorized` with `path: "/v1/clients"` instead of `502` or `404`

### 2026-03-22 - Local/VPS Operational Sync Rule Documented

- Updated:
  - `RUN.md`
  - `CLAUDE.md`
  - `docs/PROJECT_CONTEXT_CACHE.md`
- Operational behavior/documentation now:
  - the runbook explicitly treats local and VPS as two copies of the same operational system
  - runtime/deployment changes made locally are expected to be mirrored on the VPS
  - hotfixes or operational changes made on the VPS must be brought back into the local repo/docs
  - only machine-specific values and generated state are allowed to diverge
- Verification run in this session:
  - documentation-only change
  - no build/test command was needed
### 2026-03-22 - Registry Import Metadata In Organization Settings

- Updated:
  - `src/registry-index/services/registry-index.service.ts`
  - `src/registry-index/services/registry-index.service.spec.ts`
  - `src/auth/auth.module.ts`
  - `src/auth/controllers/organization.controller.ts`
  - `src/frontend/types/organization.types.ts`
  - `src/frontend/services/organization.service.ts`
  - `src/frontend/pages/settings/SettingsPage.tsx`
  - `src/frontend/pages/settings/SettingsPage.css`
- Current behavior now:
  - organization settings expose a new read-only registry metadata panel for admins and owners
  - `GET /v1/organizations/me/registry-imports` returns per-source import metadata for `court_stan`, `court_dates`, and `asvp`
  - the response includes dataset/resource links when known, the remote dataset update timestamp, last download/index/success timestamps, row counts, last error, and whether the index is currently available for search
  - the settings UI now shows those values in one place so operators can quickly tell whether a registry is fresh, still building, failed, or ready for search
- Verification run in this session:
  - `npm test -- --runInBand src/registry-index/services/registry-index.service.spec.ts` -> PASS
  - `npm run build` -> PASS
  - `npm run build:frontend` -> PASS

### 2026-03-22 - VPS Bootstrap And Runtime Hardening For Fresh Postgres Deploys

- Added or updated:
  - `.dockerignore`
  - `Dockerfile`
  - `docker-compose.yml`
  - `nginx.conf`
  - `src/app.module.ts`
  - `src/migrations/data-source.ts`
  - `src/database/entities/index.ts`
  - `src/billing/services/stripe.service.ts`
  - `src/common/health/operational-monitoring.service.ts`
- Current behavior now:
  - Docker builds no longer send huge local-only directories such as `asvp`, `.venv*`, `figma`, and `.codex` into the build context, which makes real VPS rebuilds feasible again
  - backend/runtime startup now imports an explicit `DATABASE_ENTITIES` list before TypeORM initialization, so the legacy `datetime` normalization applies consistently to both runtime and migration data source setup
  - migration discovery now skips `*.spec` files
  - backend startup now honors `DB_SYNC=true` as an explicit one-time PostgreSQL schema bootstrap override, and `docker-compose.yml` passes `DB_SYNC` into both web and worker containers
  - Stripe billing no longer aborts application startup when Stripe is not configured; billing degrades instead
  - readiness no longer throws when enterprise `Outbox` metadata is absent; that monitoring slice now reports `disabled`
  - frontend nginx now writes its PID under `/tmp/nginx.pid`, so the non-root frontend container can start cleanly on VPS
  - backend image now pre-creates `/app/storage` and avoids the previous expensive recursive permission pass over the whole app tree
- Live VPS verification on `2026-03-22`:
  - `https://www.juscriptum.online/` -> `200 OK`
  - backend `/health` -> `200 OK`
  - backend `/readiness` -> `503` with `status: "degraded"` because monitoring reports `outbox` as `disabled`; this is not a hard startup failure
  - frontend and backend containers both reached healthy status on the VPS
- Current operational caveat:
  - the checked-in PostgreSQL migration chain still does not fully bootstrap a brand-new empty schema from zero, so the first fresh Postgres deploy currently depends on a one-time `DB_SYNC=true` boot before returning to `DB_SYNC=false`

### 2026-03-22 - Postgres Runtime Normalizes Legacy datetime Entity Types

- Added:
  - `src/common/typeorm/legacy-datetime-column-type.ts`
  - `src/common/typeorm/legacy-datetime-column-type.spec.ts`
- Updated:
  - `src/app.module.ts`
  - `src/migrations/data-source.ts`
- Current behavior now:
  - the Nest PostgreSQL runtime rewrites legacy entity metadata with `type: "datetime"` to a postgres-supported `timestamp` type before TypeORM builds metadata
  - the migration runner applies the same normalization, so PostgreSQL migrations no longer fail before startup on the legacy SQLite-oriented entity definitions
  - SQLite-backed local development keeps using `datetime`
  - this specifically addresses the VPS startup failure where `Organization.trialEndAt` and the broader legacy `datetime` set were rejected by PostgreSQL
- Verification run in this session:
  - pending targeted test and backend build
  - staging/production deployment remains unproven

### 2026-03-22 - Platform Admin Safe Dashboard + Organizations Read Models

- Added allow-listed platform-admin read-model pieces in:
  - `src/platform-admin/controllers/platform-admin-dashboard.controller.ts`
  - `src/platform-admin/controllers/platform-admin-organizations.controller.ts`
  - `src/platform-admin/dto/platform-admin-read-model.dto.ts`
  - `src/platform-admin/services/platform-admin-read.service.ts`
  - `src/platform-admin/services/platform-admin-read.service.spec.ts`
  - `src/common/health/health.module.ts`
- Updated:
  - `src/platform-admin/platform-admin.module.ts`
  - `src/platform-admin/services/index.ts`
  - `src/platform-admin/index.ts`
  - `src/app.module.ts`
  - `src/common/health/index.ts`
  - `src/frontend/platform-admin/platformAdminApi.ts`
  - `src/frontend/platform-admin/PlatformAdminApp.tsx`
  - `src/frontend/platform-admin/PlatformAdminApp.css`
  - `src/platform-admin/blueprint/platform-admin.blueprint.ts`
  - `RUN.md`
  - `docs/PLATFORM_ADMIN_ARCHITECTURE.md`
- Current behavior now:
  - `/v1/platform-admin/dashboard/summary` returns safe platform KPIs, monitoring state, and high-signal alerts for the owner back office
  - `/v1/platform-admin/organizations`, `/v1/platform-admin/organizations/:id`, and `/v1/platform-admin/organizations/:id/users` return allow-listed metadata DTOs with masked contact details instead of raw tenant entities
  - `platform-admin.html` now hydrates real dashboard and organization registry/detail data after login instead of stopping at the auth shell
  - health monitoring is now exported through a shared `HealthModule` so the owner read-model service can reuse `OperationalMonitoringService` without creating a duplicate scheduled provider instance
  - the current local read path is still not a PostgreSQL-proven privileged strategy; production-like platform-admin metadata access remains unresolved while RLS stays tenant-scoped
- Verification run in this session:
  - `npm run lint` -> PASS
  - `npm test -- --runInBand src/platform-admin/services/platform-admin-auth.service.spec.ts src/platform-admin/services/platform-admin-read.service.spec.ts` -> PASS
  - `npm run build` -> PASS
  - `npm run build:frontend` -> PASS

### 2026-03-22 - Docker Build Context Keeps package-lock.json

- Updated:
  - `.dockerignore`
  - `RUN.md`
- Current behavior now:
  - Docker build contexts now include the checked-in `package-lock.json` instead of excluding it
  - `Dockerfile` and `Dockerfile.frontend` can keep using `npm ci` during image builds without failing on a missing lockfile caused by the repo ignore rules
  - this fixes the VPS/container build path where images were failing before application startup because `package-lock.json` was filtered out of the context
- Verification run in this session:
  - pending local Docker builder verification
  - staging/production deployment is still unproven

### 2026-03-22 - Platform Admin Bootstrap + MFA Enrollment Surface

- Added platform-admin bootstrap and MFA enrollment/auth pieces in:
  - `src/frontend/platform-admin/platformAdminApi.ts`
  - `src/frontend/platform-admin/platformAdminSession.ts`
- Updated:
  - `src/platform-admin/controllers/platform-admin-auth.controller.ts`
  - `src/platform-admin/dto/platform-admin-login.dto.ts`
  - `src/platform-admin/services/platform-admin-auth.service.ts`
  - `src/platform-admin/services/platform-admin-auth.service.spec.ts`
  - `src/platform-admin/blueprint/platform-admin.blueprint.ts`
  - `src/frontend/platform-admin/PlatformAdminApp.tsx`
  - `src/frontend/platform-admin/PlatformAdminApp.css`
  - `src/common/config/environment.validator.ts`
  - `.env.example`
  - `.env.staging.example`
  - `RUN.md`
  - `docs/PLATFORM_ADMIN_ARCHITECTURE.md`
- Current behavior now:
  - `GET /v1/platform-admin/auth/bootstrap-status` reports whether the first owner still needs bootstrap
  - `POST /v1/platform-admin/auth/bootstrap` can create only the very first `PlatformAdminUser`, gated by `PLATFORM_ADMIN_BOOTSTRAP_TOKEN`
  - `POST /v1/platform-admin/auth/mfa/setup` returns a QR code data URL, TOTP secret, and backup codes for the signed-in platform admin
  - `POST /v1/platform-admin/auth/mfa/confirm` completes enrollment, revokes old sessions, and rotates into an MFA-backed session
  - `platform-admin.html` is now a working owner bootstrap/login/MFA surface rather than a static blueprint-only page
  - platform-admin audit tables and production-safe metadata read models are still not implemented
- Verification run in this session:
  - `npm run lint:backend` -> PASS
  - `npm run lint:frontend` -> PASS
  - `npm test -- --runInBand src/platform-admin/services/platform-admin-auth.service.spec.ts` -> PASS
  - `npm run build` -> PASS
  - `npm run build:frontend` -> PASS

### 2026-03-22 - Platform Admin Dedicated Auth Model + Vite ESM Config

- Added dedicated platform-admin auth/runtime pieces in:
  - `src/database/entities/PlatformAdminUser.entity.ts`
  - `src/database/entities/PlatformAdminRefreshToken.entity.ts`
  - `src/database/entities/PlatformAdminRevokedAccessToken.entity.ts`
  - `src/database/entities/enums/platform-admin.enum.ts`
  - `src/database/migrations/1711200000000-AddPlatformAdminAuth.ts`
  - `src/platform-admin/controllers/platform-admin-auth.controller.ts`
  - `src/platform-admin/dto/platform-admin-login.dto.ts`
  - `src/platform-admin/guards/platform-admin-jwt-auth.guard.ts`
  - `src/platform-admin/interfaces/platform-admin-jwt.interface.ts`
  - `src/platform-admin/services/platform-admin-auth.service.ts`
  - `src/platform-admin/services/platform-admin-auth.service.spec.ts`
  - `src/platform-admin/services/platform-admin-jwt.service.ts`
  - `src/platform-admin/strategies/platform-admin-jwt.strategy.ts`
- Updated:
  - `src/platform-admin/controllers/platform-admin-blueprint.controller.ts`
  - `src/platform-admin/platform-admin.module.ts`
  - `src/platform-admin/blueprint/platform-admin.blueprint.ts`
  - `src/common/config/environment.validator.ts`
  - `src/common/security/pii-protection.ts`
  - `.env.example`
  - `.env.staging.example`
  - `docs/PLATFORM_ADMIN_ARCHITECTURE.md`
  - `vite.config.mts`
- Current behavior now:
  - platform-admin auth has its own user table, refresh-token table, revoked-access-token table, JWT strategy, auth controller, and targeted service tests
  - `GET /v1/platform-admin/blueprint` now uses the dedicated `PlatformAdminJwtAuthGuard` instead of tenant auth guards
  - owner back-office JWT secrets are now separated by `PLATFORM_ADMIN_JWT_SECRET`
  - `npm run build:frontend` no longer prints the old Vite deprecated CJS Node API warning because the config now lives at `vite.config.mts`
  - production-safe tenant read models, operator provisioning, MFA enrollment UX, and platform-admin audit tables are still not implemented
- Verification run in this session:
  - `npm test -- --runInBand src/platform-admin/services/platform-admin-auth.service.spec.ts` -> PASS
  - `npm run lint:backend` -> PASS
  - `npm run build` -> PASS
  - `npm run build:frontend` -> PASS

### 2026-03-22 - Platform Admin Architecture Scaffold

- Added a dedicated platform-admin blueprint and scaffold in:
  - `docs/PLATFORM_ADMIN_ARCHITECTURE.md`
  - `src/platform-admin/blueprint/platform-admin.blueprint.ts`
  - `src/platform-admin/controllers/platform-admin-blueprint.controller.ts`
  - `src/platform-admin/platform-admin.module.ts`
  - `src/frontend/platform-admin/index.tsx`
  - `src/frontend/platform-admin/PlatformAdminApp.tsx`
  - `src/frontend/platform-admin/PlatformAdminApp.css`
  - `platform-admin.html`
  - `vite.config.mts`
  - `src/app.module.ts`
  - `src/auth/auth.module.ts`
  - `RUN.md`
- Current behavior now:
  - the repo contains one canonical platform-admin blueprint shared by backend and frontend scaffold code
  - a dedicated `platform-admin.html` entry now exists and renders a separate owner back-office architecture page outside the tenant SPA navigation
  - the Nest runtime now exposes `GET /v1/platform-admin/blueprint` inside the dedicated platform-admin module
  - the scaffold explicitly locks MVP decisions around metadata-first access, separate auth, disabled tenant-content access by default, and deferred break-glass workflows
  - the current codebase at this stage still did not implement production-ready platform-admin identities, sessions, audit tables, or privileged read models
- Verification run in this session:
  - `npm run build` -> PASS
  - `npm run build:frontend` -> PASS
  - `npm run lint` -> PASS

### 2026-03-21 - ASVP Yearly SQLite Shards + Storage Cleanup

- Updated registry index storage/runtime in:
  - `src/registry-index/services/registry-index.service.ts`
  - `src/registry-index/services/registry-index.service.spec.ts`
  - `RUN.md`
- Current behavior:
  - fresh `asvp` imports now keep metadata in `storage/asvp-index.db` and write the actual indexed records into yearly shard files under `storage/asvp-index-shards/`
  - `court_stan` and `court_dates` remain in `storage/registry-index.db`
  - `asvp` import metadata, batch tracking, scheduled rebuilds, and `data.gov.ua` auto-download follow the existing `ExternalDataService -> rebuildIndexes({ source: 'asvp' })` path; only the internal on-disk layout changed
  - `ExternalDataService` now writes remote `ASVP` data into year files under `asvp/split/asvp-YYYY.csv` instead of keeping a full raw `ASVP` snapshot in the workspace; the current `data.gov.ua` ZIP payload now prefers a resumable temp archive assembled via `Range` chunks in the OS temp directory before the yearly split step because both long-lived direct streams and monolithic curl resume runs were resetting mid-transfer
  - `RegistryIndexService` now stages large ASVP shard rebuilds in `storage/asvp-index-shards.build`, closes shard DBs per processed source file instead of holding WAL-heavy writers open for the entire run, trims ASVP FTS to normalized name columns only, and progressively deletes completed `asvp/split/asvp-YYYY.csv` files when source cleanup is enabled so peak disk usage stays lower during long rebuilds
  - indexed ASVP search now aggregates across yearly shard databases instead of querying one monolithic SQLite file
  - if an older monolithic `storage/registry-index.db` still contains a successful legacy `asvp` index, read-path fallback stays available until a new shard rebuild completes
  - this isolates the heaviest registry import from the shared court cache and reduces the chance that failed or oversized `asvp` rebuilds will bloat or block the main registry SQLite file
  - explicit regression coverage now verifies that `ExternalDataService` downloads an `asvp` CSV and calls `rebuildIndexes({ source: "asvp" })`, which is the scheduled `data.gov.ua` auto-download entrypoint used by the worker
  - the registry importer and source monitor now recurse into nested `split/` folders so streamed `asvp/split/*.csv` files are discovered automatically
  - one-off helper scripts now load `.env` and `.env.local` directly, with `.env.local` taking precedence, so `npm run update:external-data` sees the same external-data settings as the main Nest runtime
  - current live verification on `2026-03-22` confirmed the direct long-lived stream path repeatedly reset against `data.gov.ua`, and a single monolithic `curl --continue-at -` run still died with repeated `Recv failure: Connection reset by peer`; the chunked `Range` temp-archive path is now the operationally preferred route for the current `ASVP` source
- Local storage cleanup completed in this session:
  - removed the stale shared-db `ASVP` tables and compacted `storage/registry-index.db`
  - pruned `../repo-history-backups/` down to only `rewrite-mirror-final-20260321.git`
  - removed `asvp/28-ex_csv_asvp.csv`
  - removed `storage/registry-index.pre-clean.backup.db`
  - removed reproducible `tmp/` and `dist/`
  - kept `node_modules/` and `.venv-pdf/` in place to avoid blocking ongoing local verification
  - current local free space after cleanup is about `56 GiB`
- Verification run in this session:
  - `npm test -- --runInBand src/external-data/services/external-data.service.spec.ts` -> PASS
  - `npm test -- --runInBand src/registry-index/services/registry-index.service.spec.ts` -> PASS
  - `npm test -- --runInBand src/registry-index/services/registry-index.source-monitor.service.spec.ts` -> PASS
  - `npm run build` -> PASS

### 2026-03-21 - Shared Registry Layer For Core Registries

- Added a canonical shared registry UI layer in:
  - `src/frontend/components/registry/RegistryLayout.tsx`
  - `src/frontend/components/registry/RegistryLayout.css`
  - `src/frontend/components/registry/index.ts`
  - `src/frontend/components/index.ts`
- Moved the core registries onto the shared filter-bar and surface/table-shell pattern in:
  - `src/frontend/pages/clients/ClientsPage.tsx`
  - `src/frontend/pages/clients/ClientsPage.css`
  - `src/frontend/pages/cases/CasesPage.tsx`
  - `src/frontend/pages/cases/CasesPage.css`
  - `src/frontend/pages/calculations/CalculationsPage.tsx`
  - `src/frontend/pages/calculations/CalculationsPage.css`
  - `src/frontend/pages/documents/DocumentsPage.tsx`
  - `src/frontend/pages/documents/DocumentsPage.css`
- Current UI behavior now:
  - clients, cases, calculations, and documents share one canonical registry card shell instead of keeping parallel page-local surface variants
  - the four registries now use the same shared filter bar primitives for search, labeled date ranges, and aligned select/reset controls
  - shared loading, empty, and pagination states now come from one registry layer for these screens instead of being redefined per page
  - page-local CSS for those registries now focuses on module-specific layout and table content rather than generic filter/search/shell rules
  - style leakage risk is lower because the reusable registry layer uses `registry-*` prefixed classes instead of generic selectors like `.filters-bar` and `.search-box`
  - the documents registry now aligns structurally with the other registries while keeping its local view toggle and explorer/list behavior intact
- Verification run in this session:
  - `npm run build:frontend` -> PASS
- Remaining verification note:
  - this refactor was code-reviewed and build-verified locally, but not visually previewed in a live browser during this session; desktop/tablet/mobile confirmation is still recommended for Clients, Cases, Calculations, and Documents around `1440px`, `1024px`, `768px`, and `390px`

### 2026-03-21 - Documents Tablet Header Actions Follow-Up

- Updated:
  - `src/frontend/pages/documents/DocumentsPage.css`
- Current UI behavior now:
  - the documents page header switches to a dedicated tablet stack at `<=960px`
  - page actions on the documents screen now use a controlled 2-column grid on tablet instead of wrapping into an awkward broken block
  - the narrower mobile breakpoint still collapses those actions to a single column
- Verification run in this session:
  - `npm run build:frontend` -> PASS
  - focused manual/browser check of `/documents` with authenticated mocks at `1024px` and `768px` -> PASS
  - no console/runtime errors were observed in the focused recheck

### 2026-03-21 - Approved Frontend UI Consistency Pass

- Updated the shared frontend shell and dense-screen ergonomics in:
  - `src/frontend/components/navigation/Navigation.tsx`
  - `src/frontend/components/FormActionBar.css`
  - `src/frontend/components/DateRangePicker.css`
  - `src/frontend/components/RecordActionsMenu.css`
  - `src/frontend/pages/archive/ArchivePage.css`
  - `src/frontend/pages/billing/BillingPage.tsx`
  - `src/frontend/pages/billing/BillingPage.css`
  - `src/frontend/pages/calendar/CalendarPage.tsx`
  - `src/frontend/pages/calendar/CalendarPage.css`
  - `src/frontend/pages/cases/CaseDetailsPage.tsx`
  - `src/frontend/pages/cases/CasesPage.css`
  - `src/frontend/pages/cases/CasesPage.tsx`
  - `src/frontend/pages/clients/AddClientPage.tsx`
  - `src/frontend/pages/clients/ClientDetailsPage.tsx`
  - `src/frontend/pages/clients/ClientsPage.css`
  - `src/frontend/pages/clients/ClientsPage.tsx`
  - `src/frontend/pages/dashboard/DashboardPage.tsx`
  - `src/frontend/pages/documents/DocumentsPage.css`
  - `src/frontend/pages/documents/MobileScanPage.css`
  - `src/frontend/pages/notes/NotesPage.tsx`
  - `src/frontend/pages/notes/NotesPage.css`
  - `src/frontend/pages/profile/ProfilePage.tsx`
  - `src/frontend/pages/profile/ProfilePage.css`
  - `src/frontend/pages/calculations/CalculationsPage.css`
- Current UI behavior now:
  - breadcrumbs are page-level instead of being duplicated in the top navigation bar
  - dashboard, client list, case list, add-client, calendar, billing, and profile now participate in the same page-shell orientation pattern
  - client and case detail headers keep primary actions visible and move secondary actions into `RecordActionsMenu`
  - notes use a stacked card-style mobile/tablet table fallback instead of a forced 720px horizontal-scroll table
  - calendar week/month views switch to a compact list-first strategy on narrow screens instead of rendering the full wide grid
  - `FormActionBar`, `DateRangePicker`, and `RecordActionsMenu` now have safer touch targets and less overflow-heavy behavior on narrow screens
  - archive CSS now uses canonical frontend tokens instead of undefined variables
  - billing and profile pages were aligned to the shared workspace/page-header shell and profile page-local CSS was reduced and re-scoped so it no longer exports broad generic form/button rules into other routes
  - clients, cases, calculations, and documents registry filter bars now use closer control heights/radii and page-scoped selectors so route CSS is less likely to leak across registries after navigation
  - the documents registry now has its own local filter-bar surface instead of implicitly inheriting another page's `.filters-bar` styling
  - mobile scan cards now stack metadata/actions more safely on very narrow screens
- Verification run in this session:
  - `npm run build:frontend` -> PASS
- Remaining verification note:
  - this pass was code-reviewed and build-verified locally, but not visually previewed in a live browser during this session; desktop/tablet/mobile confirmation is still recommended at roughly `1440px`, `1024px`, `768px`, and `390px`

### 2026-03-21 - Registry Source Monitor Diagnostics + ASVP Error Preservation

- Updated registry-index runtime diagnostics in:
  - `src/registry-index/services/registry-index.source-monitor.service.ts`
- Updated ASVP import preparation/runtime in:
  - `src/registry-index/services/registry-source-import-preparation.ts`
  - `src/registry-index/services/registry-index.service.ts`
- Current behavior:
  - when `RUN_SCHEDULED_JOBS=false`, bootstrap now checks `court_stan/`, `asvp/`, and `court_dates/`
  - if CSV snapshots are already present, the app logs an explicit warning that automatic source monitoring is disabled in this process and that the dedicated worker or a manual `npm run build:registry-index -- --source=<source> --force` run is required
  - oversized `asvp` CSV files now import directly from the original snapshot by default instead of pre-splitting into a full temporary UTF-8 duplicate tree
  - ASVP writes are committed in smaller SQLite transactions during import, reducing both rollback blast radius and peak temp-disk pressure
  - the old pre-split path still exists behind `ASVP_PRE_SPLIT_ENABLED=true` if it is explicitly needed for troubleshooting
- Updated shared SQLite rollback handling in:
  - `src/registry-index/services/registry-index.service.ts`
  - rollback cleanup now skips no-op SQLite rollbacks instead of surfacing `cannot rollback - no transaction is active` as the apparent import failure
  - ASVP import failures now preserve the real parse/import error in `import_state.last_error`
- Added coverage in:
  - `src/registry-index/services/registry-index.source-monitor.service.spec.ts`
  - `src/registry-index/services/registry-source-import-preparation.spec.ts`
  - `src/registry-index/services/registry-index.service.spec.ts`
- Verification run in this session:
  - `npm test -- --runInBand src/registry-index/services/registry-source-import-preparation.spec.ts src/registry-index/services/registry-index.source-monitor.service.spec.ts src/registry-index/services/registry-index.service.spec.ts` -> PASS
  - `npm run build` -> PASS

### 2026-03-21 - Law Organizer UI Audit Skill Added

- Added one repo-local Codex skill in:
  - `.codex/skills/law-organizer-ui-audit/SKILL.md`
- Skill purpose:
  - audit Law Organizer screens for UI/UX consistency, operational usability, and responsive behavior without drifting into a redesign
  - enforce approval before major layout, navigation, table-structure, form-structure, or cross-screen visual changes
- Frontend audit findings captured for the skill:
  - the active frontend stack is React 18 + Vite with custom CSS, shared tokens in `src/frontend/index.css`, and shared shell primitives such as `PageHeader`, `FormActionBar`, `RecordActionsMenu`, `DateRangePicker`, and the responsive navigation drawer
  - list and form screens reuse similar patterns, but many modules still rely on page-local CSS for filters, tables, panels, and modal behavior
  - filter bars, control heights, border radii, table responsiveness, and modal patterns are only partially standardized across modules such as clients, cases, calculations, documents, notes, archive, activity, and workspace/report surfaces
  - at least one screen (`src/frontend/pages/archive/ArchivePage.css`) still uses non-canonical CSS variables such as `--border-color`, `--surface-color`, `--text-primary`, and `--text-secondary`, which do not match the main token set in `src/frontend/index.css`
- No product UI was redesigned in this task; the change is limited to a reusable auditing skill plus context documentation.
- Verification run in this session:
  - `npm run build:frontend` -> PASS

### 2026-03-21 - Vite Chunking Warnings Removed

- Updated frontend build chunking in:
  - `vite.config.ts`
- Current behavior:
  - removed the previous circular manual-chunk relationship that produced the Vite warning `Circular chunk: vendor -> framework -> vendor`
  - split large frontend dependencies into dedicated chunks for:
    - framework
    - router
    - state
    - forms
    - http
    - pdf-react
    - pdf-core
    - pdf-lib
    - tinymce-core
    - tinymce-react
    - tinymce-model
    - tinymce-theme
    - tinymce-icons
    - tinymce-plugins
    - tinymce-skins
    - docx-viewer
    - file-viewer
    - icons
  - `npm run build:frontend` now completes without the previous circular-chunk warning and without the `Some chunks are larger than 500 kB after minification` warning
- Verification run in this session:
  - `npm run build:frontend` -> PASS
  - remaining build note:
    - Vite still prints the existing CJS Node API deprecation notice before the build starts

### 2026-03-21 - Event Archive Cascades + Calendar Archived Toggle

- Added real `archived` status support for events in:
  - `src/database/entities/Event.entity.ts`
  - `src/events/dto/event.dto.ts`
- Updated event queries in:
  - `src/events/services/event.service.ts`
  so archived events stay out of the normal calendar/event feeds unless `status=archived` is requested explicitly
- Updated lifecycle cascades so linked calendar events now follow client/case archive and delete actions:
  - `src/clients/services/client.service.ts`
    - archiving a client archives linked non-deleted cases and their linked non-deleted events
    - deleting a client soft-deletes linked non-deleted cases and their linked non-deleted events
  - `src/cases/services/case.service.ts`
    - archiving a case archives its linked non-deleted events
    - deleting a case soft-deletes its linked non-deleted events
- Registered the event repository for client-side cascades in:
  - `src/clients/clients.module.ts`
- Updated frontend event/archive behavior in:
  - `src/frontend/pages/archive/ArchivePage.tsx`
    - archive now shows archived events as a real category with data
  - `src/frontend/pages/calendar/CalendarPage.tsx`
  - `src/frontend/pages/calendar/CalendarPage.css`
    - added `Показати архівні події` toggle
    - when enabled, the calendar includes past events in the current view/list
  - `src/frontend/services/event.service.ts`
  - `src/frontend/types/event.types.ts`
- Added coverage in:
  - `src/clients/services/client.service.spec.ts`
  - `src/cases/services/case.service.spec.ts`
  - `src/events/services/event.service.spec.ts`

Verification run in this session:
- `npm test -- --runInBand src/clients/services/client.service.spec.ts src/cases/services/case.service.spec.ts src/events/services/event.service.spec.ts` -> PASS
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS
  - Vite still reports the existing circular/manual-chunk and large-chunk warnings

### 2026-03-21 - Case Timeline Renamed To Case Events + court_stan Stage Merge

- Updated the case event surfaces in:
  - `src/cases/services/case.service.ts`
  - `src/cases/services/case.service.spec.ts`
  - `src/cases/services/case-registry-sync.service.ts`
  - `src/frontend/pages/cases/CaseDetailsPage.tsx`
  - `src/frontend/pages/cases/CaseDetailsPage.css`
  - `src/frontend/pages/cases/CasesPage.tsx`
  - `src/frontend/pages/cases/CasesPage.css`
  - `src/frontend/pages/calendar/CalendarPage.tsx`
  - `src/frontend/types/case.types.ts`
- Current behavior:
  - the UI label `Timeline справи` is now `Події по справі`
  - auto-created `court_dates` events no longer prepend the technical phrase about being created from `court_dates`
  - case-event entries in the case timeline are clickable and now deep-link into `Календар`, opening the linked event on its date
  - the case timeline now includes the latest `court_stan` stage as `Стадія розгляду` when it adds new meaning beyond the synced `court_dates` hearing
  - `court_stan` stages that only restate the same hearing meaning as `court_dates` are suppressed, including the case where the hearing timestamp is embedded inside the stage title
- Verification run in this session:
  - `npm test -- --runInBand src/cases/services/case.service.spec.ts src/cases/services/case-registry-sync.service.spec.ts` -> PASS
  - `npm run build` -> PASS
  - `npm run build:frontend` -> PASS
    - Vite still reports the existing circular/manual-chunk and large-chunk warnings

### 2026-03-21 - Calendar Participants Cleanup + Case Selector Labels

- Updated:
  - `src/frontend/pages/calendar/CalendarPage.tsx`
  - `src/frontend/pages/events/AddEventPage.tsx`
- Current behavior:
  - the calendar event details now suppress technical participant metadata such as `syncSource`, registry IDs, case IDs, and sync timestamps; synced court events show the actual `caseInvolved` text instead
  - the event creation page now shows client-case options with both numbers when available: internal case number plus registry case number
- Verification run in this session:
  - `npm run build:frontend` -> PASS
    - Vite still reports the existing circular/manual-chunk and large-chunk warnings

### 2026-03-21 - Client Registry Search Overlay Fit And Autofill Flow

- Updated the client registry search UX in:
  - `src/frontend/pages/clients/AddClientPage.tsx`
  - `src/frontend/pages/clients/AddClientPage.css`
  - `src/frontend/components/RegistrySearchOverlay.css`
- Current behavior:
  - the client registry overlay is constrained to the viewport and keeps results scrolling inside the modal instead of pushing the whole surface off-screen
  - the client registry results table now assigns explicit width to all 7 columns, including the action column, preventing the action button from expanding the table beyond the screen width on desktop
  - clicking `Заповнити` now applies the registry data, closes the overlay immediately, scrolls back to the client form, and shows an inline confirmation alert on the add-client page
- Verification run in this session:
  - `npm run build:frontend` -> PASS
    - Vite still reports the existing circular/manual-chunk and large-chunk warnings

### 2026-03-21 - Local Resource Audit And Runtime/Git Cleanup

- Audited local resource pressure after a high-CPU/high-memory workstation report and confirmed the biggest local contributors were:
  - `.git/objects` growth from large packfiles and leftover `tmp_pack_*` garbage
  - generated/local data tracked in git (`dist/`, `storage/`, `tmp/`, registry CSV snapshots)
  - fast local API scripts still allowing scheduled background work to run in the same dev process
  - shared SQLite registry WAL growth under `storage/registry-index.db-wal`
- Updated `package.json` so local dev uses a lighter default split:
  - `npm run start:dev` now sets `RUN_SCHEDULED_JOBS=false`
  - added `npm run start:dev:with-jobs` for the old all-in-one API behavior
  - added `npm run start:worker:dev` for explicit local worker execution
- Expanded `.gitignore` to stop reintroducing generated/runtime artifacts into git tracking.
- Updated `src/registry-index/services/registry-index.service.ts` so shared-registry rebuilds now truncate/checkpoint SQLite WAL after rebuild cycles, reducing local disk churn from runaway `registry-index.db-wal` growth.
- Completed a full local history rewrite through a backup-first mirror flow:
  - backup bundle created under `../repo-history-backups/`
  - original heavy `.git` preserved in `../repo-history-backups/original-dotgit-20260321`
  - history rewritten to remove `dist/`, `storage/`, `tmp/`, `court_stan/`, `court_dates/`, `asvp/`, `uploads/`, and historical `node_modules/`
  - cleaned local `.git` replaced in the working repo without touching the working tree files
- Current local git size after rewrite:
  - `.git` about `95M`
  - previous local `.git` backup about `13G`

Verification run in this session:
- `npm run build` -> PASS
- `npm run lint` -> PASS
- `git count-objects -vH` -> PASS after cleanup
  - git garbage reduced from about `5.17 GiB` to `0 bytes`
- `node -e "const Database=require('better-sqlite3'); ... wal_checkpoint(TRUNCATE) ..."` -> PASS
  - `storage/registry-index.db-wal` reduced to `0B`
- `git-filter-repo --analyze` on the mirror repo -> PASS
- `git-filter-repo --force --invert-paths ...` on the mirror repo -> PASS
- `npm run build` after replacing the local `.git` -> PASS

### 2026-03-20 - Archive Page Category Tabs

- Reworked `src/frontend/pages/archive/ArchivePage.tsx` into a category-based archive workspace with tabs for:
  - clients
  - cases
  - events
  - pricelists
  - documents
  - calculations
  - templates
  - notes
- Added dedicated archive page styling in:
  - `src/frontend/pages/archive/ArchivePage.css`
- Current archive data is now loaded directly for categories that already have real archive support in the codebase:
  - clients
  - cases
  - documents
  - pricelists
  - templates
- Categories without a separate archive status yet:
  - events
  - calculations
  - notes
  now render as ready archive tabs with explanatory empty states and navigation links instead of being mixed into one generic archive view

Verification run in this session:
- `npm run build:frontend` -> PASS
  - Vite still reports the existing circular/manual-chunk and large-chunk warnings

### 2026-03-20 - Client Delete/Archive Cascade To Cases

- Updated `src/clients/services/client.service.ts` so:
  - soft-deleting a client also soft-deletes that client's non-deleted cases in the same transaction
  - setting a client status to `archived` also archives that client's non-deleted cases in the same transaction
- Updated `src/clients/clients.module.ts` to register the `Case` repository for the client service
- Added service coverage in:
  - `src/clients/services/client.service.spec.ts`
    - verifies client delete cascades soft-delete to cases
    - verifies client archive cascades archived status to cases

Verification run in this session:
- `npm test -- --runInBand src/clients/services/client.service.spec.ts` -> PASS
- `npm run build` -> PASS

### 2026-03-20 - Shared Registry Raw Row Payload Removal

- Removed unused `raw_row_json` storage from the shared SQLite registry cache for:
  - `asvp_records`
  - `court_dates`
- Updated `src/registry-index/services/registry-index.service.ts` so:
  - new imports no longer persist duplicated raw CSV rows in SQLite
  - startup automatically migrates legacy shared SQLite tables that still contain `raw_row_json`
  - the legacy migration preserves searchable data and rebuilds the ASVP FTS table
  - one-time compaction runs after that legacy migration to reclaim SQLite file space
- `court_stan` was already unaffected because it did not store `raw_row_json`
- Added coverage in:
  - `src/registry-index/services/registry-index.service.spec.ts`
    - verifies legacy `raw_row_json` columns are removed while `court_dates` and `asvp` records remain searchable

Verification run in this session:
- `npm test -- --runInBand src/registry-index/services/registry-index.service.spec.ts` -> PASS
- `npm run build` -> PASS

### 2026-03-20 - Shared Registry Cleanup On Unchanged Verification

- Updated `src/registry-index/services/registry-index.service.ts` so a non-force rebuild that finds an unchanged successful shared index can still delete already-verified source CSV files when source-file deletion is enabled
- This closes the startup/runtime gap where:
  - CSV files were already present before the app booted
  - the rebuild path concluded the shared index was current
  - the import was skipped before the consume/delete cleanup branch ran
- Added coverage in:
  - `src/registry-index/services/registry-index.service.spec.ts`
    - verifies unchanged `court_stan` and `court_dates` source files are deleted during a non-force verification pass once the shared index is already current

Verification run in this session:
- `npm test -- --runInBand src/registry-index/services/registry-index.service.spec.ts` -> PASS
- `npm run build` -> PASS

### 2026-03-20 - Shared Registry Consume-On-Success Generalization + Startup/Folder Auto-Import

- Replaced the ASVP-only preprocessing helper with a shared source-preparation module:
  - `src/registry-index/services/registry-source-import-preparation.ts`
- Updated `src/registry-index/services/registry-index.service.ts` so all shared registry sources now follow the same flow:
  - `court_stan`
  - `court_dates`
  - `asvp`
- New shared-source behavior:
  - oversized source CSVs are pre-split into temporary year-based UTF-8 chunks before SQLite import
  - successfully imported source CSVs are deleted by default after the shared SQLite commit
  - if a consumed source directory is empty afterward, the last successful shared index is preserved instead of being cleared
  - in-process rebuild requests are serialized per source to reduce duplicate rebuild contention inside one Nest runtime
- Added automatic shared-import triggers beyond the existing daily cron:
  - `src/registry-index/services/registry-index.source-monitor.service.ts`
    - polls `court_stan/`, `court_dates/`, and `asvp/` for new or changed CSV files and starts a rebuild automatically
  - `src/external-data/services/external-data.bootstrap.service.ts`
    - runs an external-data update check on first startup when external URLs are configured
- Adjusted startup coordination:
  - `src/registry-index/services/registry-index.bootstrap.service.ts` now skips local warmup when external-data URLs are configured so the external-data bootstrap owns the startup refresh path
- Added coverage in:
  - `src/registry-index/services/registry-index.service.spec.ts`
    - verifies `court_stan` consume-on-success import
    - verifies `court_dates` consume-on-success import
    - verifies shared-index retention when source directories become empty

Verification run in this session:
- `npm test -- --runInBand src/registry-index/services/registry-index.service.spec.ts` -> PASS (5/5)
- `npm test -- --runInBand src/external-data/services/external-data.service.spec.ts` -> PASS (2/2)
- `npm run build` -> PASS

### 2026-03-20 - ASVP Snapshot Pre-Split + Consume-On-Success Import

- Added a dedicated ASVP preprocessing module in:
  - `src/registry-index/services/registry-source-import-preparation.ts`
- Updated `src/registry-index/services/registry-index.service.ts` so ASVP rebuilds now:
  - pre-split oversized source CSVs into temporary year-based UTF-8 chunks before SQLite import
  - keep the registry index shared in `storage/registry-index.db` rather than moving data into tenant-scoped application tables
  - delete successfully imported ASVP source CSVs after the SQLite commit by default
  - keep the last successful shared ASVP index when the `asvp/` directory is empty after a consumed import
  - log rollback warnings without masking the original import error
- Added coverage in:
  - `src/registry-index/services/registry-index.service.spec.ts`
    - verifies oversized ASVP pre-split import
    - verifies source-file deletion after success
    - verifies the existing shared index remains searchable when `asvp/` becomes empty

Verification run in this session:
- `npm test -- --runInBand src/registry-index/services/registry-index.service.spec.ts` -> PASS (4/4)
- `npm run build` -> PASS

### 2026-03-20 - Day-One Scope Decision And Staging Prep Pack

- Added a practical reduced-scope staging package instead of leaving launch scope implicit:
  - `docs/DAY_ONE_SCOPE_AND_STAGING_PREP.md`
  - `.env.staging.example`
- Recorded the recommended first-launch cut as:
  - core CRM + auth + PostgreSQL/Redis/worker + file/PDF runtime + in-app notifications
  - SMTP-backed transactional email kept in scope for essential flows
  - ACSK / Diia / BankID, Stripe / WayForPay self-serve billing, SMS, push, and social auth kept out of the recommended day-one scope
- Updated current operating docs to point at that package:
  - `RUN.md`
  - `docs/LAUNCH_READINESS_MASTER_CHECKLIST.md`
  - `docs/DEPLOYMENT.md`
- Kept the distinction explicit:
  - this is a scope cut and staging-prep baseline
  - it is not staging proof and not a production-ready claim

Verification run in this session:
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS
  - Vite still reports the existing circular/manual-chunk and large-chunk warnings

### 2026-03-19 - Launch Readiness Status Refresh

- Re-verified the local launch surface:
  - `npm run lint` -> PASS
  - `npm run build` -> PASS
  - `npm run build:frontend` -> PASS
  - `npm test -- --runInBand` -> PASS (32 passed suites, 1 skipped / 176 passed tests, 3 skipped)
  - `npm run test:e2e -- --runInBand` -> PASS (22/22)
  - `npm run test:frontend:smoke` -> PASS (3/3)
- Confirmed that the main launch blockers are now external/provider/ops/runtime tasks rather than red local code verification
- Confirmed runtime gap details:
  - active host shell still lacks `clamscan` / `clamdscan`
  - default host `python3` still lacks `cv2`
  - project `.venv-pdf` does provide `numpy`, `cv2`, and `PIL`
- Confirmed product-scope clarification:
  - Google/Apple/Microsoft auth is still not part of the current main launch path
- Fixed a minor local lint regression in:
  - `src/clients/services/court-registry.service.ts`
  - `src/registry-index/services/registry-index.service.ts`
- Rewrote launch/readiness docs to match the current status:
  - `docs/LAUNCH_READINESS_MASTER_CHECKLIST.md`
  - `docs/PRODUCTION_READINESS_REPORT.md`

### 2026-03-19 - Documentation And Operating Model Reconciliation

- Rewrote `AGENTS.md` into the primary Codex operating contract
- Rewrote `RUN.md` into a mode-based runbook
- Re-scoped old audit docs as historical artifacts instead of current truth
- Rewrote `API_EXAMPLES.md` as illustrative-only guidance
- Replaced this file with a compact secondary context source
- Restored missing migration helper scripts so `npm run migration:run` no longer points at a non-existent file

Verification run in this session:
- `npm run build` -> PASS
- `npx eslint src/migrations/*.ts` -> PASS
- `ls dist/migrations` -> PASS (`data-source.js`, `generate.js`, `run.js` present)

### 2026-03-13 - Security And Runtime Hardening

Recorded in repo history and supported by code/docs:

- PostgreSQL tenant+user RLS hardening
- access-token revocation and session cutoff
- PII encryption plus blind indexes
- malware-scanning lifecycle
- trust-verification workflow and worker
- health/readiness monitoring improvements

### 2026-03-13 - Worker Split Clarified

Recorded in repo history and supported by current files:

- dedicated `src/worker.ts`
- `RUN_SCHEDULED_JOBS` split between web and worker
- DB-backed scheduled worker model retained instead of BullMQ

### 2026-03-12 To 2026-03-13 - Product Surface Expansion

Recorded in repo history and reflected in modules:

- notes workspace
- registry index and external-data updater
- mobile scan sessions
- server-side PDF post-processing
- route-backed frontend flows for major CRM modules

## Remaining Risks / Unresolved Items

- The repo still contains stale historical artifacts; future updates must keep `AGENTS.md` and `RUN.md` authoritative.
- The checked-in Kubernetes worker HPA wording still implies queue semantics that are stronger than the current DB-polling worker reality.
- The checked-in `docker-compose.yml` still includes an incomplete `nginx-proxy` path from the repo perspective.
- Production-like PostgreSQL environments require migrations; SQLite fast local mode does not prove migration-dependent behavior.
- ASVP source snapshots are now consumed and removed after a successful shared-index import, so future refreshes should provide a fresh full snapshot rather than only an incremental remainder.
- Trust verification is implementation-complete enough for local development, but external/provider readiness is still a launch blocker.
- PDF/OCR and malware scanning depend on host/runtime tooling that may be absent on a fresh machine.
- The recommended reduced day-one scope still depends on proving real SMTP delivery, real ClamAV command execution, and real OCR/PDF runtime on staging before any public launch claim.

## Usage Notes For Future Sessions

- Start with `AGENTS.md`, then `RUN.md`, then this file.
- Treat `docs/PROJECT_CONTEXT_CACHE.md` as long-form session history, not as the first thing to read.
- Treat old audit docs at the repo root as dated evidence, not current status.

### 2026-03-20 - Court Dates Prompting For Cases And Daily User Check

- Added a new case-side registry-hearing prompt flow on top of the existing `court_dates` sync path.
- Backend now supports:
  - case-level nearest-hearing suggestion lookup from `court_dates`
  - manual event creation from the suggested registry hearing
  - per-user notification feed of pending hearing suggestions for assigned judicial cases
- Suggestion matching now works by:
  - `registryCaseNumber` when present
  - participant/client FIO fallback when the registry number is absent or insufficient
- Frontend now shows:
  - a global post-login notification check after 10:00 in `Europe/Kyiv`
  - a manual "find nearest hearing in registry" action inside the case card
  - a direct "create event" CTA from the found registry hearing
- Assumption recorded in code: the "after 10 hours in Europe" daily check is interpreted as after `10:00` in `Europe/Kyiv`, which matches the product's Ukrainian operating context.
- Follow-up fix:
  - corrected the hearing-suggestion lookup so it now prefers the internal `storage/registry-index.db` path for `court_dates`-related searches instead of depending on source CSV files still being present after import
  - this now covers both:
    - batch lookup by case numbers
    - FIO-driven suggestion resolution via indexed court-registry matches plus indexed `court_dates`
  - expanded name matching so manual lookup can also resolve directly from indexed `court_dates` rows and tolerate alternate apostrophe variants in Ukrainian names

### 2026-03-21 - Registry Hearing Preview Modal Before Event Creation

- The manual "Знайти подію в реєстрі" flow now shows a modal preview instead of silently applying or immediately creating an event.
- The case card action now opens an overlay with the found hearing details and a one-click "Додати подію" confirmation.
- The add-event page now exposes the same behavior for the selected client or case:
  - search nearest hearing in registry
  - show the found result in a modal above the form
  - create the `court_sitting` event only after explicit confirmation
- This keeps registry-assisted creation fast while avoiding accidental event creation from ambiguous FIO matches.
- Follow-up UX fix:
  - deep links to `/calendar?eventId=...&date=...` no longer auto-open the calendar event modal
- the calendar now navigates to the requested date and visually highlights the target event card instead
- the manual case-card registry lookup now opens its preview even when the linked event already exists, and in that case the modal action routes the user to the calendar instead of creating a duplicate event

### 2026-03-22 - Auth 500 On Login/Register Fixed For Postgres RLS Patch

- Fixed a PostgreSQL-only auth regression where `POST /v1/auth/login` and `POST /v1/auth/register` returned `500 Internal Server Error`.
- Root cause:
  - `RlsQueryRunnerPatcher` monkey-patched `queryRunner.query(query, parameters)` but dropped TypeORM's third `useStructuredResult` argument.
  - TypeORM `SelectQueryBuilder.loadRawResults()` calls `queryRunner.query(sql, parameters, true)` and expects `results.records`.
  - once the wrapper discarded that third argument, Postgres queries returned raw rows instead of the structured `QueryResult`, so TypeORM received `undefined` for `rawResults` and crashed on `rawResults.length`.
- Fixed `src/common/interceptors/rls.interceptor.ts` to preserve the third argument when forwarding patched Postgres queries.
- Expanded `src/common/interceptors/rls.interceptor.spec.ts` to cover structured-result passthrough explicitly, so future RLS patch changes do not silently break repository reads again.
- Local verification completed:
  - `npm test -- --runInBand src/common/interceptors/rls.interceptor.spec.ts`
  - `npm run build`

### 2026-03-22 - VPS Registry Search Restored By Mounting Shared Storage

- Fixed the VPS-only failure where client/case registry search returned no real results even though the host already had populated registry indexes.
- Root cause:
  - the host contained the real shared SQLite caches under `storage/registry-index.db` and `storage/asvp-index.db`
  - the backend and worker containers were booting with their own empty `/app/storage` directory because `docker-compose.vps.yml` did not bind-mount host `./storage`
  - as a result, the containers created fresh tiny SQLite files and searched those empty caches instead of the real host indexes
- Added a repo-local `docker-compose.vps.yml` that bind-mounts `./storage:/app/storage` for both `backend` and `redis-worker`.
- Updated `RUN.md` to record that containerized VPS deployments must mount the shared `storage` directory or registry search will silently run against empty caches.
- Live VPS verification completed after mounting `storage` and restarting the containers:
  - backend container saw the populated index again (`court_registry_participants=812350`, `court_dates=487693`)
  - `GET /v1/clients/court-registry/search?query=Ковцун` returned real court and `court_dates` matches
  - `GET /v1/cases/registry-search?caseNumber=2/206-214/б&source=court_registry` returned matching case results

### 2026-03-22 - Indexed Court Dates No Longer Require Raw `court_dates/` On VPS

- Fixed the VPS-only hearing-suggestion/search crash where the backend still threw:
  - `Каталог дат судових засідань не знайдено. Очікувався \`court_dates\` у корені проєкту.`
- Root cause:
  - indexed deployments already use `storage/registry-index.db` as the primary `court_dates` source
  - after the indexed lookup returned no match, `CourtRegistryService` still hard-fell back to the raw `court_dates/` directory
  - VPS deployments that intentionally keep only the imported SQLite cache and no raw `court_dates/` snapshot therefore raised a user-facing error instead of a normal empty result
- Updated `src/clients/services/court-registry.service.ts` so:
  - `searchCourtDates(...)` returns `[]` with a warning when indexed runtime is present but the raw `court_dates/` directory is absent
  - `findCourtDatesByCaseNumbers(...)` returns an empty `Map` under the same indexed-runtime condition
  - strict `NotFoundException` behavior is preserved for non-indexed raw-file runtimes
- Expanded `src/clients/services/court-registry.service.spec.ts` with regression coverage for both indexed-miss paths with no raw `court_dates/` directory.
- Local verification completed:
  - `npm test -- --runInBand src/clients/services/court-registry.service.spec.ts`
  - `npm run build`
