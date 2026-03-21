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
- Local default database: SQLite
- Production-like database: PostgreSQL
- Registry index SQLite cache in `storage/registry-index.db` is shared across users and is not tenant-scoped
- Current worker model: `src/worker.ts` plus `RUN_SCHEDULED_JOBS` split
- Current background architecture: scheduled/polling DB-backed jobs, not BullMQ

## Current Operational Truth Summary

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
