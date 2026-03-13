# Project Context Cache

> Fast session bootstrap for minimal token usage.

## Snapshot Date

- Updated: 2026-03-13
- Scope: full-project reassessment, backend security status reconciliation, auth/session hardening, PostgreSQL RLS runtime/policy hardening, PII encryption/blind-index hardening, trust verification workflow/worker hardening, live-capable provider integrations, signed callback/replay protection hardening, malware scanning lifecycle hardening, operational monitoring/readiness hardening, staging/operator runbooks for blind-index rotation and production backfill rehearsal, frontend auth/session persistence, lint/build pipeline, e2e stability, product/docs alignment, user-scoped data isolation, Ukrainian trust-provider foundation, workspace cleanup, calendar workspace rebuild, client/case list filtering, global frontend shell compaction, MacBook-first CRM registry redesign, registry minimalism pass, calendar add-event entry point, route-backed pricelists module, two-step registration split, dynamic universal profile form, browser-tab favicon refresh, template registry/A4 builder, template builder density pass, template variable audit, sticky/collapsible variables rail, Ukrainian TinyMCE localization, legal-entity user placeholders, compact two-row rich-text toolbar, sticky long-form actions, unified three-dots row actions, unified notes workspace, reverse note flows from client/case surfaces, notes ERP registry pass, global actions overlay fix, route-based calculations create/read flow, restored income-calculation pricelist binding, restored shared profile-form source for frontend build verification, multi-pricelist income calculations, act-style calculation tables, total-in-words formatting, persisted calculation item unit metadata, currency-display normalization to `грн`, document `calculation.totalAmountWords` correction, files workspace explorer/list redesign, route-based document generation, mobile scan-session/PDF foundation, and authenticated mobile responsiveness hardening with a top-triggered drawer plus viewport regression coverage

## Current Health

- `npm test -- --runInBand src/external-data/services/external-data.service.spec.ts src/registry-index/services/registry-index.service.spec.ts` -> PASS (4/4)
- `npm run build` -> PASS (external data.gov.ua update pipeline + scheduler + CLI compiled)
- `npm run update:external-data -- --dry-run` -> PASS (all sources currently skip because no external resource URLs are configured yet)
- `npm run lint` -> PASS (2026-03-13 launch status recheck)
- `npm run build` -> PASS (2026-03-13 launch status recheck)
- `npm run build:frontend` -> PASS (2026-03-13 launch status recheck; chunk-size warnings remain)
- `npm run test:frontend:smoke` -> PASS (3/3, 2026-03-13 launch status recheck)
- `npm test -- --runInBand` -> PASS (2026-03-13; 31 passed, 1 skipped suite / 172 passed, 3 skipped tests after calculation/document/auth typing fixes)
- `npm run test:e2e -- --runInBand` -> PASS (2026-03-13; 22/22 after aligning `tests/cases.e2e-spec.ts` with current `Case` contracts and stabilizing the suite timeout)
- `which tesseract ocrmypdf unpaper clamscan clamdscan python3` -> PARTIAL (2026-03-13; `tesseract`, `ocrmypdf`, `unpaper`, `python3` present, `clamscan`/`clamdscan` missing in the current host shell)
- `python3 -c "import importlib.util; print(importlib.util.find_spec('cv2') is not None)"` -> FAIL (2026-03-13; default host `python3` does not currently expose `cv2`)
- `npm run build` -> PASS (real Python per-page PDF preprocessing pipeline contract + server-first scan-PDF orchestration path)
- `npm run build:frontend` -> PASS (mobile-scan PDFs now prefer server-side post-processing when no manual page edits are present; existing circular chunk/manualChunks warning and large chunk warnings remain)
- `npm run lint` -> PASS (server-first scan-PDF processing wiring + frontend API/runtime contract)
- `brew install poppler tesseract tesseract-lang unpaper ocrmypdf` -> PASS (2026-03-13 local PDF/OCR runtime provisioning)
- `./.venv-pdf/bin/python -c "import numpy, cv2; from PIL import Image"` -> PASS (2026-03-13 project PDF runtime venv)
- `./.venv-pdf/bin/python scripts/pdf_postprocess_pipeline.py ...` on a generated 1-page test PDF -> PASS (2026-03-13 synthetic end-to-end local pipeline smoke test)
- `npm run build` -> PASS (2026-03-13 async server PDF jobs + page-level artifact persistence)
- `npm run build:frontend` -> PASS (2026-03-13 viewer polling for async server PDF processing jobs)
- `npm run lint` -> PASS (2026-03-13 async server PDF jobs + artifact persistence wiring)
- `npm run build` -> PASS (2026-03-13 scheduled PDF worker + retry/timeout queue semantics)
- `npm run build:frontend` -> PASS (2026-03-13 scheduled PDF worker follow-up; frontend still compiles cleanly)
- `npm run lint` -> PASS (2026-03-13 scheduled PDF worker + retry/timeout queue semantics)
- `npm run build` -> PASS (server PDF post-processing orchestration service + `/documents/:id/process-pdf`)
- `npm run lint:backend` -> PASS (server PDF post-processing orchestration service + runtime capability checks)
- `npm run build:frontend` -> PASS (document viewer still compiles after server pipeline foundation; existing circular chunk/manualChunks warning and large chunk warnings remain)
- `npm run lint:frontend` -> PASS
- `npm test -- --runInBand src/clients/services/court-registry.service.spec.ts src/registry-index/services/registry-index.service.spec.ts` -> PASS (8/8)
- `npm run build` -> PASS (ASVP raw-fallback pipe fix + registry-index bootstrap warmup compiled)
- `curl http://localhost:3000/health` -> PASS after `DocumentsModule` startup fix and backend restart
- `TS_NODE_FILES=true node -r ts-node/register -r tsconfig-paths/register ... CourtRegistryService.searchInAsvpRegistry('Хоменко Андрій Іванович')` -> PASS (~56 ms, returns `VP_ORDERNUM=80180323` from `asvp`)
- `npm test -- --runInBand src/registry-index/services/registry-index.service.spec.ts src/clients/services/court-registry.service.spec.ts src/cases/services/case-registry-sync.service.spec.ts src/cases/services/case.service.spec.ts` -> PASS (17/17)
- `npm run build` -> PASS (SQLite registry index module compiled)
- `npm run build:frontend` -> PASS (registry date filters now default open-ended on client/case search overlays; existing circular chunk/manualChunks warning and >500 kB chunk warnings remain)
- `npm run build:registry-index -- --source=court_stan --force` -> PASS (`storage/registry-index.db`, 850,443 indexed `court_stan` participant rows)
- `npm run build:registry-index -- --source=court_dates --force` -> PASS (`storage/registry-index.db`, 479,914 indexed `court_dates` rows)
- `TS_NODE_FILES=true node -r ts-node/register -r tsconfig-paths/register ... RegistryIndexService.searchCourtRegistry('Долинська Іванна Степанівна')` -> PASS (`460/670/13-ц` returned from SQLite index)
- `npx eslint --fix src/clients/services/court-registry.service.ts src/clients/services/court-registry.service.spec.ts src/cases/services/case-registry-sync.service.ts src/cases/services/case-registry-sync.service.spec.ts src/cases/services/case.service.ts src/cases/services/case.service.spec.ts src/cases/controllers/cases.controller.ts src/cases/cases.module.ts src/frontend/pages/cases/AddCasePage.tsx src/frontend/services/case.service.ts src/frontend/types/case.types.ts` -> PASS
- `npm test -- --runInBand src/clients/services/court-registry.service.spec.ts src/cases/services/case-registry-sync.service.spec.ts src/cases/services/case.service.spec.ts` -> PASS (15/15)
- `npm run build` -> PASS (case registry expansion + automatic court-date event sync compiled)
- `npm run build:frontend` -> PASS (combined court/ASVP registry search compiled; existing circular chunk/manualChunks warning and >500 kB chunk warnings remain)
- `npm run build:frontend` -> PASS (document viewer PDF toolbar compacted to icon-based editor rows; processing-summary client contract compiled; existing circular chunk/manualChunks warning and large chunk warnings remain)
- `npm run lint:frontend` -> PASS (document viewer toolbar audit/localization, `metadataJson` revision forwarding)
- `npm run lint` -> PASS (mobile scan picker expansion, website image-to-PDF bundling, PDF post-processing metadata plumbing, viewer post-processing UI)
- `npm run build` -> PASS (document revision metadataJson backend plumbing compiled)
- `npm run build:frontend` -> PASS (PDF post-processing UI compiled; existing circular chunk/manualChunks warning and large chunk warnings remain)
- `npm run lint:frontend` -> PASS (document viewer personal-folder breadcrumb now includes `Власна` for root-level documents)
- `npm run lint:frontend` -> PASS (document viewer scan crop + A4 alignment + OCR save flow)
- `npm run build:frontend` -> PASS (document viewer scan crop + OCR path compiled; existing circular chunk/manualChunks warning and large chunk warnings remain)
- `npm run lint:backend` -> PASS (Unicode-safe `Content-Disposition` for document content/download)
- `npm run lint:frontend` -> PASS (document viewer backend-error normalization)
- `npm run build` -> PASS (Unicode-safe `Content-Disposition` for document content/download)
- `npm run build:frontend` -> PASS (document viewer backend-error normalization; existing circular chunk/manualChunks warning and large chunk warnings remain)
- authenticated `GET /v1/documents/:id/content?disposition=inline` for a Cyrillic-named scan PDF -> `200 OK`
- `npm run lint:frontend` -> PASS (multi-format document viewer + route-based file open flow)
- `npm run lint:backend` -> PASS (inline document content/download endpoints + revision-aware uploads)
- `npm run build:frontend` -> PASS (multi-format document viewer; new lazy `pdf-viewer`, `docx-viewer`, and `file-viewer` chunks emitted; existing circular chunk/manualChunks warning and large chunk warnings remain)
- `npm run build` -> PASS (inline document content/download endpoints + revision-aware uploads)
- `npm test -- --runInBand` -> FAIL (pre-existing TypeScript error in `src/calculations/services/calculation.service.ts:347`; 28 suites passed, 1 skipped, 163 tests passed)
- `npm run lint:frontend` -> PASS (mobile drawer navigation + removed bottom mobile bar)
- `npm run build:frontend` -> PASS (mobile drawer navigation + removed bottom mobile bar; existing circular chunk/manualChunks warning and large TinyMCE chunk warning remain)
- `npm run test:frontend:smoke` -> PASS (3/3; includes updated public auth copy assertions and the iPhone-width viewport audit)
- `npm run lint:frontend` -> PASS (shared alert message rendering + pricelist error normalization)
- `npm run build:frontend` -> PASS (shared alert message rendering + pricelist error normalization; existing circular chunk/manualChunks warning and large TinyMCE chunk warning remain)
- `npm run lint:frontend` -> PASS (calendar route modal guard + auth return-to redirect/session restore)
- `npm run build:frontend` -> PASS (calendar route modal guard + same-browser tab session restore; existing circular chunk/manualChunks warning and large TinyMCE chunk warning remain)
- `npx eslint src/frontend/pages/events/AddEventPage.tsx` -> PASS
- `npm run build:frontend` -> FAIL (`Could not resolve "./pages/documents/ScanSessionPage" from "src/frontend/App.tsx"`; transient local file-resolution issue, immediate rerun succeeded)
- `npm run build:frontend` -> PASS (event `Користувач / Клієнт` audience toggle + client-only case selector; existing circular chunk/manualChunks warning and large TinyMCE chunk warning remain)
- `npm run lint` -> PASS (files root-level client folders + flexible scan destinations + localhost QR diagnostics)
- `npm run build:frontend` -> PASS (files root-level client folders + query-driven folder history + scan destination flow; existing circular chunk/manualChunks warning and large TinyMCE chunk warning remain)
- `npm run build:frontend` -> PASS (documents filters compacted into one row and `Іконки / Список` toggle made explicit)
- `npm run build:frontend` -> PASS (document composer calculation preview now strips technical slug suffixes from service names)
- `npm run build:frontend` -> PASS (printable calculation tables now stay within the A4/page preview width instead of expanding past the page)
- `npm run build:frontend` -> PASS (template-generated calculation tables now show `Тип обліку` with human-readable values from calculation items)
- `npm run build:frontend` -> PASS (documents page header actions now wrap under the title instead of being clipped off-screen)
- `npm run build:frontend` -> PASS (Vite dev server now binds to `0.0.0.0` for LAN/mobile scanner testing)
- `npm run build` -> PASS (scan destination persistence + timestamp scan naming + mobile base URL override)
- `npm run build` -> PASS (dev-safe file storage fallback from unreachable MinIO/S3 to local storage for mobile scan/upload flows)
- `npm run build` -> PASS (disk-backed Multer uploads now hydrate `buffer` from temp files, fixing mobile scan page uploads in local development)
- `npm run lint` -> PASS (currency display normalization + document amount-in-words fix)
- `npm test -- --runInBand` -> PASS (29 passed, 1 skipped suite / 166 passed tests; trust/redis logger output is expected)
- `npm run build:all` -> PASS (Nest build + Vite production build; pre-existing circular chunk/manualChunks warning and large TinyMCE chunk warning remain)
- `npm run lint` -> PASS (files workspace + scan-session/document-generation foundation)
- `npm run build:frontend` -> PASS (files workspace + scan-session/document-generation foundation)
- `npm run build` -> PASS (scan-session entities/controller/service + PDF assembly foundation)
- `npm run lint` -> PASS
- `npm test -- --runInBand` -> PASS (27 passed, 1 skipped suite / 158 passed tests; logger output from trust/redis specs is expected)
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS
- `npm run lint:frontend` -> PASS (calculation details table compaction + legacy description cleanup)
- `npm run build:frontend` -> PASS (calculation details table compaction + legacy description cleanup)
- `npm run lint:frontend` -> PASS (calculations multi-pricelist selection + tabular details)
- `npm run build:frontend` -> PASS (calculations multi-pricelist selection + tabular details)
- `npm run build` -> PASS (calculations item unit/code persistence migration)
- `npm run lint:frontend` -> PASS (income calculations pricelist binding restore)
- `npm run lint:frontend` -> PASS (profile + print-forms sticky rail/localization pass)
- `npm run build` -> PASS (profile + print-forms sticky rail/localization pass)
- `npm run build:frontend` -> PASS (profile + print-forms sticky rail/localization pass)
- `npm run build:frontend` -> PASS (income calculations pricelist binding restore)
- `npm run build:frontend` -> PASS (frontend UI copy cleanup)
- `npm run build:frontend` -> FAIL (`Could not resolve "./NotesPage.css" from "src/frontend/pages/notes/NotesPage.tsx"` on the first calculations-width verification attempt; transient Vite resolver failure)
- `npm run build:frontend` -> PASS (calculations registry width compaction)
- `npm run lint:frontend` -> PASS (calculations ERP registry pass + active actions)
- `npm run build:frontend` -> PASS (calculations ERP registry pass + active actions)
- `npm run lint:frontend` -> PASS (calculations route-based create + read-only details flow)
- `npm run build:frontend` -> PASS (calculations route-based create + read-only details flow)
- `npm run lint:frontend` -> PASS (calculations add-flow session fix for new tab)
- `npm run build:frontend` -> PASS (calculations add-flow session fix for new tab)
- `npm run lint:frontend` -> PASS (calculations add-flow returned to same tab)
- `npm run build:frontend` -> PASS (calculations add-flow returned to same tab)
- `npm test -- --runInBand src/clients/services/client.service.spec.ts` -> PASS (37/37)
- `npm test -- --runInBand src/frontend/utils/__tests__/clientDataTransform.test.ts` -> FAIL (`No tests found`; default Jest config only matches `*.spec.ts`)
- `npx jest --runInBand --testRegex '.*\\.(spec|test)\\.ts$' src/frontend/utils/__tests__/clientDataTransform.test.ts` -> PASS (28 passed, 1 skipped suite / 184 tests overall; includes `clientDataTransform.test.ts`)
- `npm test -- src/frontend/schemas/client.schema.spec.ts --runInBand` -> PASS (2/2)
- `npm test -- --runInBand` -> PASS (27 passed, 1 skipped suite / 158 passed tests; PostgreSQL-specific RLS suite still requires `RLS_TEST_DATABASE_URL`)
- `RLS_TEST_DATABASE_URL='postgresql://postgres@127.0.0.1:55432/postgres' npm test -- --runInBand src/database/migrations/harden-postgres-rls-policies.spec.ts` -> PASS (3/3)
- `npm run test:e2e -- --runInBand` -> PASS (22/22)
- `npm test -- --runInBand src/invoices/services/invoice.service.spec.ts src/notifications/services/notification.service.spec.ts src/events/services/event.service.spec.ts` -> PASS (9/9)
- `npm test -- --runInBand src/calculations/services/calculation.service.spec.ts` -> PASS (4/4)
- `npx eslint src/events/dto/event.dto.ts src/events/services/event.service.ts src/notifications/services/notification.service.ts` -> PASS
- `npm run build` -> PASS
- `npm run lint:backend` -> PASS (calculation numbering format pass)
- `npm run build:frontend` -> PASS
- `npm run build:frontend` -> FAIL (`Could not resolve "./pages/print-forms/PrintFormsPage" from "src/frontend/App.tsx"` while verifying the browser-tab favicon change)
- `npm run test:frontend:smoke` -> PASS (2/2)
- `npm test -- --runInBand src/billing/services/stripe.service.spec.ts src/common/logging/global-exception.filter.spec.ts` -> PASS (4/4)
- `npm run start:prod` -> PASS
- `GET http://localhost:3000/health` -> `200 {"status":"ok",...}`
- `npm run start:frontend:wait-backend` -> PASS (confirmed frontend waits on `http://localhost:3000/health` and then launches Vite once ready)
- `npm test -- --runInBand src/trust-verification/services/trust-verification.service.spec.ts src/trust-verification/services/trust-verification-worker.service.spec.ts src/trust-verification/services/trust-provider.adapters.spec.ts src/trust-verification/services/trust-callback-auth.service.spec.ts` -> PASS (12/12)
- `npm run lint:backend -- --fix=false src/trust-verification/services/trust-verification.service.ts src/trust-verification/services/trust-provider.adapters.ts src/trust-verification/services/trust-callback-auth.service.ts src/trust-verification/controllers/trust-verification.controller.ts src/common/config/environment.validator.ts src/trust-verification/services/trust-verification.service.spec.ts src/trust-verification/services/trust-provider.adapters.spec.ts src/trust-verification/services/trust-callback-auth.service.spec.ts` -> PASS
- Frontend files are now included in the real lint pipeline through `npm run lint`
- `npm run lint:frontend` -> PASS
- `npm run lint:backend` -> PASS
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS
- `npm run lint:frontend` -> PASS (template registry + shared row-actions dropdown)
- `npm run build:frontend` -> PASS (template registry + shared row-actions dropdown)
- `npm run lint:frontend` -> PASS (notes ERP registry pass + global actions overlay fix)
- `npm run build:frontend` -> PASS (notes ERP registry pass + global actions overlay fix)
- `npm run lint:frontend` -> PASS (notes limit validation fix)
- `npm run build:frontend` -> PASS (notes limit validation fix)
- `npm run lint:frontend` -> PASS (notes table register + modal editor rewrite)
- `npm run build:frontend` -> PASS (notes table register + modal editor rewrite)
- `npm test -- --runInBand src/events/services/event.service.spec.ts` -> PASS (3/3)
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS
- `npm run build:frontend` -> PASS (login + landing copy cleanup)

## Key Technical State

- Stack: NestJS + TypeORM + React/Vite
- Launch status on 2026-03-13: not production-ready because external launch prerequisites and runtime/staging proof are still open even though automated verification is green again
- Project stage: pre-production release candidate for the core CRM/security foundation; Conversations 10, 12, 13, and 14 are locally verified, but the project is still not production-ready because Conversation 11 external staging proof and live ops drills are still open
- Default local DB path: `law_organizer.db` (sqlite for local/test mode)
- Multi-tenant access path: JWT (`tenant_id`) -> `TenantGuard` -> tenant-scoped queries
- Sensitive entity access path is now: JWT (`tenant_id`, `user_id`, `role`) -> tenant check -> actor-scoped service filters -> request-scoped PostgreSQL session context (`app.current_tenant_id`, `app.current_user_id`, `app.current_user_role`) -> PostgreSQL tenant/user-aware RLS policies validated on a live local PostgreSQL instance
- JWT validation now reloads current `role` and `subscriptionPlan` from the database and rejects access tokens issued before the last password change
- Verified security baseline:
  - request-scoped PostgreSQL RLS session context is wired in runtime, and live PostgreSQL verification passed for cross-tenant and cross-user isolation on protected records
  - declarative `@Roles` and `@RequirePlan` metadata are now live in the audited controller surface, and `RbacGuard` / `SubscriptionGuard` denial paths are unit-tested
  - server-side subscription enforcement is now active for client/case quotas plus professional-tier bulk import/upload operations
  - access-token revocation is now active through a DB-backed revoked-token registry plus user-level session cutoff timestamps
  - JWT validation now rejects revoked tokens, tokens issued before session invalidation/password change, inactive users, and inactive organizations while reloading current role/plan from the database
  - field-level encryption is now active for PII columns in `organizations`, `users`, and `clients`, including searchable emails/phones/identifiers backed by blind indexes
  - audit logs and structured log/Sentry payloads now redact PII keys recursively before persistence/output
  - runtime observability now includes `GET /health` and `GET /readiness`, plus scheduled structured operational alerts for auth abuse, tenant/data-isolation denials, worker backlog/failures, billing anomalies, and infected uploads
  - trust-provider verification now supports configurable live ACSK/Diia/BankID exchanges plus signed callback authentication with timestamp and nonce replay protection
  - frontend quality gating now includes `src/frontend/**/*.{ts,tsx}` in the main lint flow plus Playwright browser smoke on the highest-risk routes
  - authenticated mobile layout now uses a fixed safe-area-aware top header with a drawer menu instead of a persistent bottom bar, and Playwright coverage checks critical routes for iPhone-width horizontal overflow plus absence of the removed bottom navigation
  - Helmet is enabled in the Nest runtime
  - the API perimeter is explicitly bearer-only (`Authorization` header, no cookie auth, CORS `credentials: false`), so classical browser CSRF is not part of the current auth model
  - throttling is Redis-backed for production deployments and falls back to in-memory storage only when Redis is disabled/unavailable outside the hardened production path
- E2E expects valid UUID IDs and JWT payload keys: `user_id`, `tenant_id`, `role`, `subscription_plan`
- The next implementation queue after Conversation 11 is currently execution-oriented rather than UI-ambiguity cleanup:
  - staging/operator rehearsal and external runtime proof remain the main unresolved track
- For full launch-readiness work, use:
  - `docs/LAUNCH_READINESS_MASTER_CHECKLIST.md`
  - this is now the dedicated source of truth for code blockers, external prerequisites, and non-programming launch tasks
- Case authoring now uses a hybrid participant model:
  - canonical UI data lives in `metadata.caseParticipants`
  - legacy searchable text fields (`plaintiffName`, `defendantName`, `thirdParties`) are still auto-derived for backward compatibility
- The dedicated calculations module is no longer analytics-only:
  - frontend now supports direct authoring of income and expense calculations
  - income calculations again load active pricelists and require service rows selected from the chosen pricelist before save
  - income calculations now support selecting multiple pricelists at once and grouping services by `прайс / категорія / підкатегорія`
  - calculation metadata stores selected subject/client context and operation type
  - calculation metadata can persist selected pricelist IDs/names for multi-pricelist income flows
  - backend calculation totals no longer assume VAT for this UI path
  - calculation items now persist `unitType` and `code` so a saved calculation can still render an act-style line table after reload
  - the calculations screen is now a tabular CRM register with search, date-range, client, case, status, and operation filters
  - the read-only calculation page now renders positions as a business table with `Загалом` and `Разом прописом`
  - calculations now expose both a page-level `Активні дії` menu and row-level workflow actions for approval/status/delete flows
  - creation now runs through dedicated routes:
    - `/calculations/add?type=income|expense` for authoring
    - `/calculations/:id` for read-only viewing after save
  - the `Додати розрахунок` menu now opens the selected create flow in the current tab after explicit income/expense selection
  - backend calculation numbers now use `{clientNumber}/{caseSequence|000}/{sequence}-{П|В}` with `000/000` fallback kept for current self/no-case compatibility
  - the `GET /calculations` empty-filter `400` regression is fixed by optional filter validation on `status`
- Calendar event authoring/rendering now supports richer scheduling:
  - the add-event form now starts with a `Подія для` toggle (`Користувач` or `Клієнт`)
  - `Клієнт` events expose client selection and an optional case selector; `Користувач` events hide client/case linkage and keep the event internal to the current user context
  - selected audience data is persisted in `participants.subject` / `participants.labels`, so choosing a client without a case no longer loses the relation entirely
  - the form still includes `Місце події`, `Контакти відповідальної особи`, flexible `Нагадати за`, range-event, and recurrence controls
  - backend event persistence now includes dedicated range and recurrence fields backed by migration `1710700000000-ExpandCalendarEventScheduling`
  - calendar read paths expand recurring and multi-day events into visible day/week/month/year entries
  - calendar route entry no longer keeps an always-mounted empty event-details modal shell; the modal now renders only for a real selected event and resets on client-side route entry
- Frontend auth/navigation recovery is now explicit:
  - protected-route entry, explicit logout, and 401 refresh-failure redirects preserve the originally requested URL via `?redirect=...`
  - post-login navigation now returns to the preserved target instead of always forcing `/dashboard`
  - same-browser tabs share the active auth session through a local auth mirror plus active-tab tracking, and Redux auth state syncs across tabs through storage events
  - residual risk: non-persistent session cleanup depends on `pagehide` last-tab cleanup, so abrupt browser termination can leave a stale local auth mirror until logout or token expiry
- Notes now use a dedicated persisted registry instead of being inferred from client/case free-text fields:
  - backend note records live in `notes` with optional links to `clientId`, `caseId`, and `userId`
  - note read/write access uses the same tenant + actor-scope pattern as other protected modules
  - `/notes` is now a compact CRM/ERP note register with a tabular list and a dedicated modal note editor instead of the previous inline workspace layout
  - client and case detail pages expose related-note panels plus direct note/event entry points
  - client and case creation flows support `save -> add note` continuation
- The notes page no longer exposes quick cross-navigation and cross-entity creation controls inside the note editor:
  - the page now focuses on note registry operations only
  - note body editing uses TinyMCE for lightweight rich-text formatting
  - existing notes open in read-only mode first and switch to the edit form only after an explicit `Редагувати` action
- Shared frontend row-action menus now render through a portal-level overlay instead of inline absolute positioning:
  - this prevents dropdown clipping inside registry/table wrappers that use `overflow: hidden`
  - `RecordActionsMenu` now recomputes placement on open, resize, and scroll across pages
  - internal `newTab` route actions now open same-origin routes through `window.open(...)` from the click handler so protected pages can keep opener-linked non-persistent auth sessions when opened in a new tab/window
- The notes workspace had a follow-up runtime bug after the ERP pass:
  - frontend preloading requested `limit=150` for notes/cases, but the validated API contract caps these lists at `100`
  - `/notes` now requests `100`, and note DTO validation is aligned to the same maximum
- Print/template workflow now provides a real authoring path:
  - `/print-forms` now has a searchable template registry plus a dedicated A4 editor mode instead of the former post-launch placeholder
  - template variables are now authored as compact placeholders and are intended for later substitution during document generation
  - the editor now uses a more Word-like TinyMCE surface instead of a minimal `contentEditable` implementation
  - templates can still be printed, downloaded as HTML/DOC, or uploaded into the existing `documents` module
  - clients/cases/documents/pricelists row actions are now normalized through a shared three-dots dropdown component
  - the editor was further compacted on 2026-03-11:
    - the redundant left-side document-format panel was removed
    - TinyMCE now uses a denser toolbar without the separate menubar row
    - the page header no longer shows long explanatory subtitles
    - the page now stays centered within a max-width workspace container
    - the variables rail remains visible on desktop widths while the editing canvas becomes visible earlier on laptop-height screens
  - aggregate placeholders now exist for generation-time calculation selection:
    - `calculation.selectedList`
    - `calculation.selectedTotal`
    - `calculation.selectedCount`
  - the `Користувач` variable group now better matches profile payload variants, including address city and `middleName` aliases for user/director payloads
  - the variables rail is now sticky on desktop, can be collapsed, and uses a narrower/smaller presentation to keep the A4 canvas visible while scrolling long templates
  - TinyMCE toolbar/menu hints for the template editor now use a local Ukrainian translation registry
  - user placeholders now include legal-entity-specific values such as legal form, own company name, display name, ЄДРПОУ, and additional addresses
- Files/document workflow moved beyond a flat registry:
  - `/documents` now has icon and list modes, Finder/Explorer-style folder navigation, and filters for search/type/status/access
  - the root folder model is `Власна` first plus client folders on the same level, with nested case folders inside each client
  - folder state is mirrored into the `?folder=` query so browser back/forward traverses folder levels inside the files workspace
  - document creation is now route-based through `/documents/create?mode=template|text`
  - `/print-forms` can hand off a saved template directly into document generation
  - mobile scanning now has a desktop QR/session page and a public tokenized `/mobile-scan` page
  - scan sessions persist server-side and can now finalize into the root catalog, `Власна`, a client root, or a specific client case folder
  - finalized scan PDFs use the timestamp naming convention `Скан-ddmmyy-hhmm.pdf`
  - desktop scan setup warns when the QR/mobile URL still targets `localhost`, because that address is unreachable from a phone
  - backend scan-session finalize remains image-PDF-first, but `/documents/:id` now provides a scan mode with manual crop, auto-framed document bounds, A4 alignment, and browser-side OCR into a searchable revision
  - the PDF viewer toolbar was compacted into an editor-style command bar with grouped icon controls and Ukrainian tooltips instead of large stacked CTA buttons
  - viewer revision uploads now correctly forward `metadataJson`, which is required for backend processing-summary/job recording on processed PDF revisions
  - the frontend can now request `/documents/:id/processing` and show lightweight server processing summary data for revision-linked PDF processing jobs/artifacts
  - backend now also exposes `/documents/:id/process-pdf` for server-side post-processing of uploaded PDF scans and `/documents/processing/runtime` for capability diagnostics
  - the new server path is designed around `python/OpenCV + poppler + unpaper + OCRmyPDF + Tesseract` and uploads the processed result as a new revision while persisting job/artifact metadata
  - host runtime is now installed locally via Homebrew: `pdftoppm`, `tesseract`, `tesseract-lang`, `unpaper`, and `ocrmypdf`
  - project-level Python runtime is now isolated in `.venv-pdf` with `numpy`, `opencv-python-headless`, and `pillow`
  - `scripts/pdf_postprocess_pipeline.py` now contains real per-page contour/perspective/deskew/crop/background-normalization/mode-processing logic instead of a pure placeholder
  - mobile `scan_session` PDFs now use the server post-processing endpoint as the primary save path in the viewer unless the user has already made manual crop/corner/rotation edits that require the browser-side fallback path
  - backend runtime capability reporting is now stricter and includes `pdftoppm`, `cv2`, `pillow`, and aggregate `ready`
  - the viewer now enables server-first processing only when runtime reports `ready = true`; otherwise it stays on the browser fallback path and surfaces that state in the UI
  - `POST /documents/:id/process-pdf` now starts an async in-process background job instead of holding the request open until the full pipeline completes
  - the backend now persists page-level processing artifacts on the source-document job:
    - `original_page_image`
    - `processed_page_image`
    - `page_preview`
    - `ocr_text_per_page`
    - `full_ocr_text`
    - `processing_metadata`
  - the viewer now polls `/documents/:id/processing` for active server jobs and auto-opens the new processed revision when the job completes
  - important limitation: this is background processing from the product perspective, but it is still an in-process runner inside the API instance, not a Redis/BullMQ worker yet
  - PDF jobs now follow the existing scheduled-worker pattern:
    - request queues job with `status = uploaded`
    - `DocumentPdfProcessingWorkerService` picks due jobs every 10 seconds
    - retry/timeout semantics are stored in `DocumentProcessingJob.metadata.queue`
  - intended ops model is now API with `RUN_SCHEDULED_JOBS=false` plus dedicated `src/worker.ts` process with `RUN_SCHEDULED_JOBS=true`
  - remaining limitation: this is still DB-polling worker orchestration, not Redis/BullMQ leasing, so cross-instance locking remains lightweight
- User profile editing now uses a single dynamic form shared across create/edit-style flows:
  - `SELF_EMPLOYED`, `FOP`, and `LEGAL_ENTITY` switch one form instead of separate pages
  - legal entity data, director contacts, bank details, registration data, and address blocks are shown/validated only when relevant
  - director and factual-address auto-copy stay synchronized while their checkboxes are active
  - additional phones, emails, and addresses are dynamically add/remove capable
  - frontend and backend profile contracts were reduced to the currently supported legal/business fields so saves and template variables stay aligned
- Sticky long-form completion actions are now the preferred pattern on create/edit routes:
  - shared `FormActionBar` is already active on add-client/add-case flows and is now also applied to client/case detail edit screens
- `src/frontend/pages/notes/NotesPage.css` was restored during the same frontend sweep because its absence was breaking `npm run build:frontend`
- User-facing money display now uses `грн` consistently across frontend/document templates and invoice/email outputs:
  - internal/persisted ISO codes such as `UAH` remain unchanged where billing providers and DB defaults require them
  - `calculation.totalAmountWords` now resolves to Ukrainian amount-in-words text instead of repeating numeric currency formatting
- Shared frontend error alerts now correctly render both `children` and `message` payloads:
  - this fixes blank red banners on pricelist list/details/edit screens and any other surfaces that passed alert text through `message={...}`
  - pricelist flows now also normalize backend array/string validation payloads before display through `src/frontend/utils/errors.ts`

## Recent Applied Changes

### 2026-03-13 Launch Status Recheck + Master Launch Checklist

- Rechecked launch readiness against live commands instead of relying only on older readiness snapshots.
- Verified in this pass:
  - `npm run lint` -> PASS
  - `npm run build` -> PASS
  - `npm run build:frontend` -> PASS
  - `npm run test:frontend:smoke` -> PASS (3/3)
  - `npm test -- --runInBand` -> PASS (31 passed, 1 skipped suite / 172 passed, 3 skipped tests)
  - `npm run test:e2e -- --runInBand` -> PASS (22/22)
- Added launch-gate source of truth:
  - `docs/LAUNCH_READINESS_MASTER_CHECKLIST.md`
- Launch interpretation:
  - build/lint/browser smoke/full unit/full e2e are healthy again
  - full production launch is still blocked by external/provider/operator prerequisites plus incomplete scanner/runtime proof on the current host

### 2026-03-13 Unit + E2E Recovery Pass

- Fixed `src/calculations/services/calculation.service.ts` so `CalculationItem` mutations no longer pass non-existent entity fields during update/create flows.
- Updated `tests/cases.e2e-spec.ts` to the current `Case` model:
  - replaced stale `civil` / `criminal` enums with `judicial_case` / `criminal_proceeding`
  - created seeded records through `caseRepository.create(...)` to avoid TypeORM overload/type ambiguity
  - increased Jest timeout to stabilize the full e2e run under schema/bootstrap overhead
- Fixed follow-on TypeScript blockers that prevented e2e bootstrap:
  - `src/auth/services/users.service.ts`
  - `src/documents/services/document.service.ts`
  - `src/documents/services/scan-session.service.ts`
- Verified in this pass:
  - `npm test -- --runInBand src/calculations/services/calculation.service.spec.ts` -> PASS (4/4)
  - `npm run test:e2e -- --runInBand tests/cases.e2e-spec.ts` -> PASS (22/22)
  - `npm test -- --runInBand` -> PASS (31 passed, 1 skipped suite / 172 passed, 3 skipped tests)
  - `npm run test:e2e -- --runInBand` -> PASS (22/22)
  - runtime dependency probe on the active host shell remains incomplete:
    - `tesseract`, `ocrmypdf`, `unpaper` are present
    - `clamscan` / `clamdscan` are absent
    - default `python3` currently lacks `cv2`
- Open risks:
  - staging deploy/outage/backup/restore drills are still unexecuted from this workspace session
  - live ACSK/Diia/BankID, payment, and outbound email/SMS/push proof remain external launch blockers
  - OCR/PDF runtime proof is not yet consistent across the current host shell because command/runtime availability is still split (`ClamAV` absent, host `python3` missing `cv2`)

### 2026-03-13 External Data.gov.ua Update Pipeline Foundation

- Added new external update infrastructure in:
  - `src/external-data/external-data.module.ts`
  - `src/external-data/external-data.constants.ts`
  - `src/external-data/services/external-data.service.ts`
  - `src/external-data/services/external-data.scheduler.service.ts`
  - `src/external-data/services/external-data.service.spec.ts`
  - `src/scripts/update-external-data.ts`
- Added `npm run update:external-data` with:
  - `--source=court_stan|court_dates|reestr|asvp`
  - `--dry-run`
  - `--force`
- Pipeline behavior:
  - probes remote resource metadata with `HEAD`
  - stores a `remote_fingerprint` in `import_state`
  - downloads only when metadata changed or `--force` is used
  - extracts ZIP archives, stages content, and safely swaps target directories with rollback semantics
  - updates `storage/registry-index.db` import-state metadata for both indexed and non-indexed sources
  - triggers SQLite index rebuild only for changed indexed sources (`court_stan`, `court_dates`, `asvp`)
- Added daily external update scheduler at `10:00` fixed `+01:00`.
- Adjusted the old local registry-index cron so it skips its own `10:00` run when external-data URLs are configured, preventing duplicate rebuild contention.
- Current limitation:
  - no real `data.gov.ua` URLs are configured yet, so `update:external-data -- --dry-run` currently reports all sources as skipped
  - JS ZIP fallback loads the archive into memory; host `unzip` is preferred for larger archives
- Verification:
  - `npm test -- --runInBand src/external-data/services/external-data.service.spec.ts src/registry-index/services/registry-index.service.spec.ts` -> PASS (4/4)
  - `npm run build` -> PASS
  - `npm run update:external-data -- --dry-run` -> PASS

### 2026-03-13 ASVP Fallback Search Fix + Bootstrap Warmup

- Updated `src/clients/services/court-registry.service.ts` so raw `asvp` search no longer hangs after an early `rg` match:
  - the native `iconv | rg` helper now tolerates pipe shutdown and explicitly terminates `iconv` when `rg` closes
  - raw fallback now returns the first matching row quickly instead of stalling on the full file when the SQLite index is still unavailable
- Added stream-based ASVP repair decoding for both live search and indexing:
  - `asvp` reads now follow the intended mojibake recovery flow compatible with `latin1 -> cp1251 -> utf-8`
- Added `src/registry-index/services/registry-index.bootstrap.service.ts` and registered it in `src/registry-index/registry-index.module.ts`:
  - missing registry indexes now start rebuilding automatically on application bootstrap
  - daily `10:00` fixed `+01:00` rebuild remains in place for subsequent refreshes
- Fixed a backend startup regression in `src/documents/documents.module.ts`:
  - explicit `ConfigModule` import restores `PdfPostProcessingService` resolution for `DocumentService`
  - `npm run start:all` can now bring backend back to healthy state (`/health -> ok`)
- Updated `src/clients/controllers/clients.controller.ts`:
  - `GET /clients/court-registry/search` now delegates to combined court + ASVP search so add-client registry lookups can find enforcement records too
- Standardized enforcement source labels from short `АСВП` to `Реєстр виконавчих проваджень` so mixed search results identify the registry more clearly in the UI and API payloads
- Hardened combined registry search in `src/clients/services/court-registry.service.ts`:
  - `Promise.allSettled` prevents one source failure from breaking the whole response
  - `asvp` now has a short combined-search timeout so slow enforcement scans do not stall court-registry results in the UI
  - oversized `asvp` files skip the catastrophic streamed fallback if native search does not finish successfully
- Verification:
  - `npm test -- --runInBand src/clients/services/court-registry.service.spec.ts src/registry-index/services/registry-index.service.spec.ts` -> PASS (8/8)
  - `npm run build` -> PASS
  - `TS_NODE_FILES=true node -r ts-node/register -r tsconfig-paths/register ... CourtRegistryService.searchInAsvpRegistry('Хоменко Андрій Іванович')` -> PASS (~56 ms)
- Open risks:
  - full `asvp` SQLite indexing is still a long-running local job; until that import finishes, fallback search returns only the first raw hit for a duplicate name
  - `build:registry-index` remains single-writer; concurrent rebuild processes can still produce `SQLITE_BUSY`

### 2026-03-12 SQLite Registry Index + Indexed Search Fallback

- Added local registry index infrastructure in:
  - `src/registry-index/services/registry-index.service.ts`
  - `src/registry-index/services/registry-index.scheduler.service.ts`
  - `src/registry-index/registry-index.module.ts`
  - `src/registry-index/services/registry-index.service.spec.ts`
  - `src/scripts/build-registry-index.ts`
  - `src/types/better-sqlite3.d.ts`
- Hooked indexed search into existing registry flows in:
  - `src/clients/services/court-registry.service.ts`
  - `src/clients/clients.module.ts`
  - `src/frontend/pages/cases/AddCasePage.tsx`
  - `src/frontend/pages/clients/AddClientPage.tsx`
  - `package.json`
- Behavior changes:
  - backend now prefers `storage/registry-index.db` for `court_stan`, `asvp`, and `court_dates`
  - `court_stan` is stored as one participant per row plus FTS on normalized participant names
  - `asvp` is stored as structured debtor/creditor/org rows plus FTS, so search no longer depends on scanning the full 13.7 GB CSV per request
  - when the `asvp` index is not ready yet, raw fallback now returns the first hit quickly instead of hanging on the `iconv | rg` pipe
  - `court_dates` now resolves by normalized case number through a regular SQLite index
  - if a source index is not available, backend falls back to raw CSV for continuity
  - client/case registry overlays no longer default `dateFrom` to `2015-05-28`, which was hiding older court records like 2013 cases
  - scheduled index refresh now runs daily at `10:00` fixed `+01:00` and skips rebuild when local source-file signatures did not change
  - missing source indexes now also begin rebuilding automatically on application bootstrap
- Tooling:
  - added `npm run build:registry-index`
  - supports `--source=court_stan|asvp|court_dates`
  - supports `--force`
- Verification:
  - `npm test -- --runInBand src/registry-index/services/registry-index.service.spec.ts src/clients/services/court-registry.service.spec.ts src/cases/services/case-registry-sync.service.spec.ts src/cases/services/case.service.spec.ts` -> PASS (17/17)
  - `npm run build` -> PASS
  - `npm run build:frontend` -> PASS
  - `npm run build:registry-index -- --source=court_stan --force` -> PASS (850,443 rows)
  - `npm run build:registry-index -- --source=court_dates --force` -> PASS (479,914 rows)
- Open risks:
  - manual rebuilds must run sequentially; parallel rebuild processes can contend on the SQLite file and return `SQLITE_BUSY`
  - automatic download/update from `data.gov.ua` is not implemented yet in this pass; the new layer currently accelerates search and local rebuilds against already-downloaded source files

### 2026-03-12 Combined Court + ASVP Case Search And Court-Date Event Sync

- Expanded registry ingestion in:
  - `src/clients/services/court-registry.service.ts`
  - `src/clients/services/court-registry.service.spec.ts`
- Added combined case-side registry endpoint in:
  - `src/cases/controllers/cases.controller.ts`
  - `src/frontend/services/case.service.ts`
  - `src/frontend/types/case.types.ts`
- Added automatic `court_dates` event synchronization in:
  - `src/cases/services/case-registry-sync.service.ts`
  - `src/cases/services/case-registry-sync.service.spec.ts`
  - `src/cases/services/case.service.ts`
  - `src/cases/services/case.service.spec.ts`
  - `src/cases/cases.module.ts`
- Add-case registry overlay now searches both court and enforcement registries and supports ASVP-specific prefill in:
  - `src/frontend/pages/cases/AddCasePage.tsx`
- Business behavior:
  - `Add case` search now returns both `Судовий реєстр` and `АСВП` results in one overlay
  - ASVP rows decode cp1251/mojibake safely via stream instead of loading the full file into memory
  - selecting an ASVP row pre-fills `Виконавче провадження`, `Виконавче провадження`, `ORG_NAME`, `VP_ORDERNUM`, and the opposite-side participant
  - creating/updating a `Судова справа` with `registryCaseNumber` now attempts immediate hearing sync from `court_dates`
  - a daily fixed `+01:00` sync runs at `10:00` and upserts `court_sitting` events for matched registry numbers
- Verification:
  - `npx eslint --fix src/clients/services/court-registry.service.ts src/clients/services/court-registry.service.spec.ts src/cases/services/case-registry-sync.service.ts src/cases/services/case-registry-sync.service.spec.ts src/cases/services/case.service.ts src/cases/services/case.service.spec.ts src/cases/controllers/cases.controller.ts src/cases/cases.module.ts src/frontend/pages/cases/AddCasePage.tsx src/frontend/services/case.service.ts src/frontend/types/case.types.ts` -> PASS
  - `npm test -- --runInBand src/clients/services/court-registry.service.spec.ts src/cases/services/case-registry-sync.service.spec.ts src/cases/services/case.service.spec.ts` -> PASS (15/15)
  - `npm run build` -> PASS
  - `npm run build:frontend` -> PASS
- Residual risks:
  - auto-created hearing events depend on fresh CSV drops in `court_dates`; if the file is stale or absent, case save still succeeds but hearing sync is deferred/missed
  - the inverse-role wording for `CREDITOR_NAME` was implemented with the logical counterparty role `Боржник`; re-check product wording if the UI must mirror the user note that said `Стягувач`

### 2026-03-12 Case Category Hierarchy + Court Registry Default

- Replaced the old flat case-type set with the new business-facing category hierarchy:
  - `Судова справа`
  - `Кримінальне провадження`
  - `Виконавче провадження`
  - `Договірна робота`
  - `Консультаційна справа`
  - `Корпоративна справа`
  - `Реєстраційна справа`
  - `Адміністративне оскарження`
  - `Медіація / переговори`
  - `Комплаєнс / аудит`
- Added shared frontend label/normalization helpers in:
  - `src/frontend/utils/caseCategories.ts`
- Case authoring now supports:
  - top-level category select
  - manual `Підкатегорія справи`
- Court-registry / CSV prefill now defaults category to `Судова справа` in:
  - `src/frontend/pages/cases/AddCasePage.tsx`
- Updated category display/filtering in:
  - `src/frontend/components/cases/CaseFormSections.tsx`
  - `src/frontend/pages/cases/CaseDetailsPage.tsx`
  - `src/frontend/pages/cases/CasesPage.tsx`
  - `src/frontend/pages/documents/DocumentComposerPage.tsx`
  - `src/frontend/pages/reports/ReportsPage.tsx`
  - `src/frontend/i18n/uk.ts`
- Updated backend case DTO/entity enum surface in:
  - `src/cases/dto/case.dto.ts`
  - `src/database/entities/Case.entity.ts`
  - `src/database/entities/enums/case.enum.ts`
- Verification:
  - `npm run lint:frontend` -> PASS
  - `npm run lint:backend` -> PASS
  - `npm run build:frontend` -> PASS
  - `npm run build` -> PASS
- Guardrails / remaining gaps:
  - `Підкатегорія справи` is still free text in metadata, not a managed per-category option set
  - legacy stored case types are normalized on the frontend for compatibility, but there is no DB migration rewriting old values yet

### 2026-03-12 Document Viewer Personal Folder Breadcrumb Fix

- Updated `src/frontend/pages/documents/DocumentViewerPage.tsx`
- Route-based viewer breadcrumbs now include the personal root folder `Власна` for documents without `clientId` and `caseId`.
- Root-level personal documents now display as:
  - `Головна / Файли / Власна / <назва документа>`
- Verification:
  - `npm run lint:frontend` -> PASS
- Guardrails / remaining gaps:
  - the viewer still does not yet reconstruct the full client/case explorer breadcrumb tree; this fix is scoped to the missing personal-folder segment

### 2026-03-12 PDF Post-Processing Upgrade + Web Image-to-PDF + Mobile Picker Expansion

- Extended document upload metadata handling in:
  - `src/documents/dto/document.dto.ts`
  - `src/documents/services/document.service.ts`
  - `src/frontend/types/document.types.ts`
  - `src/frontend/services/document.service.ts`
- Upload/revision requests can now pass `metadataJson`, which is merged into stored document metadata for processed revisions.
- Reworked shared scan-processing helpers in:
  - `src/frontend/utils/scanProcessing.ts`
  - page-level analysis now records suggested crop, brightness, border darkness, shadow bias, fill ratio, and orientation
  - browser-side processing now supports `Color`, `Document`, `Black & White`, `Grayscale`, and `Original`
  - page normalization now supports `Auto detect`, `Original size`, `A4 portrait`, `A4 landscape`, `A5`, `Letter`, and `Legal`
- Extended document viewer post-processing in:
  - `src/frontend/pages/documents/DocumentViewerPage.tsx`
  - `src/frontend/pages/documents/DocumentViewerPage.css`
  - the site now supports:
    - one-click `Покращити документ`
    - scan/digital PDF heuristics
    - per-page crop adjustment with auto-framed bounds
    - before/after split compare view
    - apply-current-crop-to-all-pages helper
    - page-thumbnail sidebar for page-level navigation
    - manual 4-corner page editing with reset/apply-to-all actions
    - browser-side perspective normalization from adjusted corners
    - OCR toggle with `ukr+rus+spa+eng`
    - per-page processing status and OCR confidence display
    - persisted processing metadata on the saved revision
    - save fallback without extended metadata when the backend rejects the richer revision payload
- Expanded mobile scan file sources in:
  - `src/frontend/pages/documents/MobileScanPage.tsx`
  - `src/frontend/pages/documents/MobileScanPage.css`
  - mobile scan now exposes separate actions for camera capture and adding photos/files from media library or file picker
- Added website-side image bundling before upload in:
  - `src/frontend/pages/documents/DocumentsPage.tsx`
  - `src/frontend/pages/documents/DocumentsPage.css`
  - queued image uploads can now be merged into a single PDF via `Зібрати зображення в 1 PDF`
- Verification:
  - `npm run lint` -> PASS
  - `npm run build` -> PASS
  - `npm run build:frontend` -> PASS
  - `npm run lint:frontend` -> PASS
  - `npm run build:frontend` -> PASS (manual corners + perspective compare pass)
- Guardrails / remaining gaps:
  - OCR still depends on browser-side Tesseract worker/language assets, so first-run OCR needs network/cache availability unless assets are self-hosted later
  - mobile scan finalize itself is still image-PDF-first; the richer cleanup/OCR path remains a post-processing viewer revision
  - processing artifacts are still persisted mainly as revision metadata plus the resulting PDF; separate backend-managed storage for `processed_page_image`, `ocr_text_per_page`, queue-backed processing statuses, and background retry orchestration is still not implemented yet

### 2026-03-12 Mobile Responsiveness Hardening + Viewport Audit

- Fixed authenticated mobile shell layout in:
  - `src/frontend/App.tsx`
  - `src/frontend/App.css`
  - `src/frontend/components/navigation/Navigation.tsx`
  - `src/frontend/components/navigation/Navigation.css`
- Root cause: `MobileNavigation` was still participating in the desktop flex row, so on iPhone-width screens it rendered as a second column to the right of `.main-content`, pushing protected pages sideways.
- Mobile shell now:
  - uses a fixed safe-area-aware top bar with a top-triggered drawer menu
  - applies top/bottom content offsets so pages stay readable under the fixed chrome
  - adds a scrim and body scroll lock when the mobile menu is expanded
  - closes the mobile menu automatically on route change
- The persistent floating bottom navigation bar was removed so it no longer obscures content and form controls on long mobile pages.
- Tightened document mobile layouts in:
  - `src/frontend/pages/documents/ScanSessionPage.css`
  - `src/frontend/pages/documents/DocumentsPage.css`
- `/documents/scan-session` now stacks setup/status content more cleanly on narrow screens.
- `/documents` page actions now stack full-width on mobile, and the previous flex-wrap interaction that pushed those buttons off-screen has been removed.
- Added browser regression coverage in:
  - `tests/playwright/frontend-smoke.spec.ts`
- The smoke suite now includes an iPhone 13 viewport audit that asserts key authenticated routes stay within the viewport width, that the mobile menu trigger is present, and that the removed bottom navigation bar does not return.
- Verification:
  - `npm run lint:frontend` -> PASS
  - `npm run build:frontend` -> PASS
  - `npm run test:frontend:smoke` -> PASS (3/3)
- Guardrails / remaining gaps:
  - no manual physical-device regression sweep was run across every route in this turn; verification was browser-automated plus targeted screenshots for `/documents` and `/documents/scan-session`
  - the drawer interaction was browser-validated in automation, but not yet checked on a real iPhone tap/scroll session outside the browser emulation used in this turn

### 2026-03-12 Pricelist Error Banner Visibility Fix

- Fixed shared alert rendering in:
  - `src/frontend/components/Alert.tsx`
- `Alert` now renders `children` or `message`, preserves optional `className`, and uses `type="button"` on the close control.
- Added shared frontend error normalization in:
  - `src/frontend/utils/errors.ts`
- Updated pricelist error handling in:
  - `src/frontend/pages/pricelists/PricelistsPage.tsx`
  - `src/frontend/pages/pricelists/PricelistEditorPage.tsx`
  - `src/frontend/pages/pricelists/PricelistDetailsPage.tsx`
- Pricelist screens now show backend-provided validation arrays/string messages instead of displaying an empty red alert container.
- Verification:
  - `npm run lint:frontend` -> PASS
  - `npm run build:frontend` -> PASS
- Guardrails / remaining gaps:
  - this turn fixed hidden error messaging, not the underlying API failure if one still exists in a specific pricelist data path
  - no manual browser QA was run for the exact open-edit-close pricelist sequence in this turn

### 2026-03-12 Calendar Modal Guard + Auth Return-To Redirects

- Hardened auth/session restore and route return behavior in:
  - `src/frontend/App.tsx`
  - `src/frontend/pages/auth/LoginPage.tsx`
  - `src/frontend/components/navigation/Navigation.tsx`
  - `src/frontend/services/api.ts`
  - `src/frontend/services/auth-storage.ts`
  - `src/frontend/components/AuthSessionSync.tsx`
  - `src/frontend/utils/authRedirect.ts`
- Protected deep links, logout, and token-refresh failure now preserve the originally requested page through `?redirect=...`, and post-login navigation returns there instead of defaulting to `/dashboard`.
- Same-browser tabs now reuse the active auth session while another authenticated tab is open; storage events synchronize login/logout state across tabs.
- Hardened calendar route entry in:
  - `src/frontend/pages/calendar/CalendarPage.tsx`
- The calendar event-details modal now mounts only when a real event is selected, and route entry resets stale selected-event state to prevent empty modal overlays from appearing on sidebar navigation.
- Verification:
  - `npm run lint:frontend` -> PASS
  - `npm run build:frontend` -> PASS
- Guardrails / remaining gaps:
  - no manual browser regression walkthrough was run for the sidebar-to-calendar path or direct `/calendar` login return flow in this turn
  - non-persistent session reuse depends on last-tab `pagehide` cleanup, so an abrupt browser crash can still leave a stale auth mirror in local storage until explicit logout or token expiry

### 2026-03-12 Event Title Optional With Type Fallback

- Refined event creation submit behavior in:
  - `src/frontend/pages/events/AddEventPage.tsx`
- `Назва події` is now optional on the add-event page.
- Empty title input now falls back to the selected event-type label on save instead of blocking submit.
- Verification:
  - `npx eslint src/frontend/pages/events/AddEventPage.tsx` -> PASS
  - `npm run build:frontend` -> PASS
- Guardrails / remaining gaps:
  - the fallback is applied only when saving; the field does not auto-fill itself while the user is editing
  - no manual browser regression pass was run in this turn

### 2026-03-12 Add Event Audience Toggle + Client-Only Case Selection

- Reworked the add-event relationship flow in:
  - `src/frontend/pages/events/AddEventPage.tsx`
  - `src/frontend/pages/events/AddEventPage.css`
- Replaced the previous single `Клієнт (необов'язково)` selector with a dedicated audience switch:
  - `Користувач`
  - `Клієнт`
- `Користувач` mode now:
  - shows the current authenticated user in a read-only summary
  - hides client and case binding fields
- `Клієнт` mode now:
  - requires explicit client selection before save
  - exposes optional case selection only for the selected client
  - shows `У клієнта ще немає справ`, when appropriate, instead of a dead empty selector
- `Назва події` is now optional:
  - empty input falls back to the selected event-type label on submit
- Event audience is now persisted in `participants` metadata:
  - `participants.subject`
  - `participants.labels`
- This closes the previous data-loss gap where selecting a client without selecting a case did not survive submit.
- Verification:
  - `npx eslint src/frontend/pages/events/AddEventPage.tsx` -> PASS
  - `npm run build:frontend` -> FAIL (`Could not resolve "./pages/documents/ScanSessionPage" from "src/frontend/App.tsx"`; transient local file-resolution issue, immediate rerun succeeded)
  - `npm run build:frontend` -> PASS
- Guardrails / remaining gaps:
  - there is still no dedicated backend `clientId` / `userId` on events apart from `caseId`, so audience-aware filtering/reporting remains metadata-based
  - one verification build failed transiently on unresolved `ScanSessionPage`, but the immediate rerun completed successfully without code changes in the event form
  - no manual browser regression pass was run for the new audience toggle in this turn

### 2026-03-12 Currency Display Normalization + Document Amount-In-Words Fix

- Added shared user-facing money helpers in:
  - `src/frontend/utils/currency.ts`
- Added unit coverage in:
  - `src/frontend/utils/currency.spec.ts`
- Replaced `UAH`/`uah`/`₴` with `грн` for displayed values in:
  - `src/frontend/pages/calculations/calculationPage.utils.ts`
  - `src/frontend/pages/calculations/CalculationDetailsPage.tsx`
  - `src/frontend/pages/documents/DocumentComposerPage.tsx`
  - `src/frontend/pages/reports/ReportsPage.tsx`
  - `src/frontend/pages/mail/MailPage.tsx`
  - `src/frontend/pages/dashboard/DashboardPage.tsx`
  - `src/frontend/pages/billing/BillingPage.tsx`
  - `src/frontend/pages/pricelists/PricelistEditorPage.tsx`
  - `src/frontend/pages/pricelists/PricelistsPage.tsx`
  - `src/frontend/pages/pricelists/PricelistDetailsPage.tsx`
  - `src/frontend/i18n/index.tsx`
  - `src/frontend/i18n/uk.ts`
- Fixed document token resolution for:
  - `calculation.totalAmountWords`
  - now outputs Ukrainian words like `одна тисяча двісті грн 00 коп`
- Normalized backend-generated invoice/email copy in:
  - `src/invoices/services/invoice.service.ts`
  - `src/notifications/templates/email-templates.ts`
- Verification:
  - `npm run lint` -> PASS
  - `npm test -- --runInBand` -> PASS (29 passed, 1 skipped suite / 166 passed tests)
  - `npm run build:all` -> PASS
- Guardrails / remaining gaps:
  - ISO `UAH` is intentionally preserved for DB defaults, DTOs, and payment-provider integrations; only user-facing display was changed
  - no manual browser/template print-preview regression pass was run in this turn
  - Vite build still emits the existing circular chunk/manual chunk warning and large TinyMCE chunk warning

### 2026-03-12 Files Workspace Explorer/List + Document Creation + Mobile Scan Foundation

- Reworked `Файли` in:
  - `src/frontend/pages/documents/DocumentsPage.tsx`
  - `src/frontend/pages/documents/DocumentsPage.css`
- `/documents` now supports:
  - icon view with `Власна` plus client folders at the root level and nested case folders inside each client
  - list view with `назва / клієнт / справа / дата створення / дата редагування / швидкі дії`
  - filters for search, document type, status, and access level
  - bulk drag-and-drop upload queue with editable filenames
  - query-driven folder history so browser back/forward navigates folder depth
- Added route-based document generation in:
  - `src/frontend/pages/documents/DocumentComposerPage.tsx`
  - `src/frontend/pages/documents/DocumentComposerPage.css`
- Generated documents can now be created:
  - from a saved template with optional client/case/calculation/event binding
  - as a plain text document without variables
- Added template-registry reuse and builder handoff in:
  - `src/frontend/pages/print-forms/templateRegistry.ts`
  - `src/frontend/pages/print-forms/PrintFormsPage.tsx`
- Added server-side scan-session foundation in:
  - `src/database/entities/ScanSession.entity.ts`
  - `src/database/entities/ScanPage.entity.ts`
  - `src/documents/services/scan-session.service.ts`
  - `src/documents/controllers/scan-sessions.controller.ts`
  - `src/database/migrations/1711000000000-AddScanSessionsWorkflow.ts`
- Added desktop/mobile scan routes in:
  - `src/frontend/pages/documents/ScanSessionPage.tsx`
  - `src/frontend/pages/documents/MobileScanPage.tsx`
  - `src/frontend/App.tsx`
- Scan placement now supports:
  - root catalog when nothing is selected
  - `Власна` when personal destination is selected
  - client root when a client is selected without a case
  - case folder when both client and case are selected
- Finalized scans now use timestamped filenames:
  - `Скан-ddmmyy-hhmm.pdf`
- QR/mobile links can now be overridden for device testing with:
  - `MOBILE_SCAN_BASE_URL`
- Verification:
  - `npm run lint` -> PASS
  - `npm run build:frontend` -> PASS
  - `npm run build` -> PASS
- Guardrails / remaining gaps:
  - OCR/searchable PDF is not yet live; the workflow currently assembles PDF pages from uploaded images and records OCR as `not_configured`
  - smart crop/perspective correction/deskew are modeled as future pipeline stages, not completed image processing in this pass
  - the PostgreSQL migration for scan sessions was added/extended but not executed in this turn
  - no manual browser or mobile device regression pass was run in this turn

### 2026-03-12 Calculations Multi-Pricelist Selection + Tabular Details

- Expanded income calculations in:
  - `src/frontend/pages/calculations/CalculationCreatePage.tsx`
  - `src/frontend/pages/calculations/CalculationCreatePage.css`
- `Прибутковий` calculation creation now:
  - supports selecting multiple pricelists by checkbox
  - merges active services from all selected pricelists into one selector
  - groups services by `прайс-лист / категорія / підкатегорія`
  - keeps only the service name in the finished calculation display
  - stores selected pricelist IDs/names in metadata for later read-only display
- Reworked the read-only calculation page in:
  - `src/frontend/pages/calculations/CalculationDetailsPage.tsx`
  - `src/frontend/pages/calculations/CalculationDetailsPage.css`
- Finished calculations now render as a business-style table with:
  - `№`
  - `Назва послуги`
  - `Кількість`
  - `Од. виміру`
  - `Сума`
  - footer row `Загалом`
- Added calculation helpers in:
  - `src/frontend/pages/calculations/calculationPage.utils.ts`
  - quantity/unit display formatting
  - UAH total formatting in words
- Added print/template variables in:
  - `src/frontend/pages/print-forms/templateBuilder.utils.ts`
  - `calculation.totalAmount`
  - `calculation.totalAmountWords`
- Persisted calculation item metadata needed for the table in:
  - `src/database/entities/CalculationItem.entity.ts`
  - `src/calculations/services/calculation.service.ts`
  - `src/database/migrations/1710900000000-StoreCalculationItemCodeAndUnitType.ts`
- Verification:
  - `npm run lint:frontend` -> PASS
  - `npm run build:frontend` -> PASS
  - `npm run build` -> PASS
- Guardrails / remaining gaps:
  - older calculations created before the new migration may not have stored `unitType` / `code` yet
  - no database migration run was executed in this turn, so the new columns are only prepared in code until `npm run migration:run`
  - `npm run build:frontend` still emits the pre-existing Vite circular/manual chunk warning and large-chunk warning
  - no manual browser regression run was performed in this turn

### 2026-03-12 Calculation Details Table Compaction + Legacy Description Cleanup

- Tightened the read-only calculation table layout in:
  - `src/frontend/pages/calculations/CalculationDetailsPage.css`
- The details table now uses fixed column widths, aggressive wrapping for long service names, and denser cell spacing so the calculation view fits typical desktop widths without forcing horizontal scrolling.
- Added legacy display cleanup in:
  - `src/frontend/pages/calculations/calculationPage.utils.ts`
  - `src/frontend/pages/calculations/CalculationDetailsPage.tsx`
- Old descriptions that still end with an internal slug in parentheses are now cleaned for display in the finished calculation table.
- Verification:
  - `npm run lint:frontend` -> PASS
  - `npm run build:frontend` -> PASS
- Guardrails / remaining gaps:
  - this cleanup only affects display; legacy records in the database still keep their old raw description value until backfilled or recreated
  - no manual browser regression run was performed in this turn

### 2026-03-12 Calculations Income Pricelist Flow Restored

- Restored pricelist-backed income calculation entry in:
  - `src/frontend/pages/calculations/CalculationCreatePage.tsx`
  - `src/frontend/services/pricelist.service.ts`
- Income calculation create flow now:
  - loads all active pricelists for the selected tenant
  - requires a pricelist choice for `Прибутковий` calculations
  - requires each line to be linked to a pricelist service row
  - auto-populates line description, code, unit type, duration/quantity, and unit price from the chosen service
  - sends `pricelistId` and per-line `pricelistItemId` back to the API on create
- Restored the missing shared profile source component in:
  - `src/frontend/components/profile/UserProfileDetailsForm.tsx`
  - `src/frontend/types/profile.types.ts`
- Verification:
  - `npm run lint:frontend` -> PASS
  - `npm run build:frontend` -> PASS
- Guardrails / remaining gaps:
  - income calculation creation now depends on having at least one active pricelist plus active service items
  - `npm run build:frontend` still emits the pre-existing Vite circular/manual chunk warning and large-chunk warning
  - the restored profile form is intentionally limited to backend-supported fields so profile saves stay compatible with Nest validation
  - no browser-level manual regression pass was run in this turn

### 2026-03-12 Frontend UI Copy Cleanup

- Removed technical and service-facing explanatory copy from visible frontend pages so the product surfaces read like end-user UI instead of internal rollout or architecture notes.
- Deleted rollout/preview notices from:
  - `src/frontend/pages/chat/ChatPage.tsx`
  - `src/frontend/pages/mail/MailPage.tsx`
  - `src/frontend/pages/reports/ReportsPage.tsx`
- Reworded user-facing labels/subtitles/helper text in:
  - `src/frontend/pages/settings/SettingsPage.tsx`
  - `src/frontend/pages/audit/AuditPage.tsx`
  - `src/frontend/pages/users/UsersPage.tsx`
  - `src/frontend/pages/onboarding/OnboardingWizard.tsx`
  - `src/frontend/pages/pricelists/PricelistEditorPage.tsx`
  - `src/frontend/pages/pricelists/PricelistDetailsPage.tsx`
  - `src/frontend/pages/clients/AddClientPage.tsx`
- Verification:
  - `npm run build:frontend` -> PASS
- Guardrails / remaining gaps:
  - this was a copy-only frontend pass; no behavior, access-control, or API changes were made
  - Vite still reports the pre-existing circular/manual chunk warnings during frontend builds

### 2026-03-12 Template Variable Audit + Compact Two-Row Rich Text Toolbar

- Audited `/print-forms` placeholder groups against the actual create/edit surfaces for:
  - user profile
  - client
  - case
  - event
  - calculation
- Removed placeholder entries that were not backed by those forms from:
  - `src/frontend/pages/print-forms/templateBuilder.utils.ts`
- Kept derived placeholders only where they are direct compositions of form data already captured in the same entity workflow:
  - full names
  - full addresses
  - case participant summaries
  - event date+time
- Added the explicitly requested placeholders:
  - `user.city`
  - `user.positionGenitive`
  - `user.director.fullNameGenitive`
  - `user.director.positionGenitive`
  - `client.director.fullNameGenitive`
  - `client.director.positionGenitive`
- Added per-variable default genitive mode support so these explicit genitive placeholders insert `|genitive` tokens directly instead of depending on the sidebar checkbox:
  - `src/frontend/pages/print-forms/templateBuilder.utils.ts`
  - `src/frontend/pages/print-forms/PrintFormsPage.tsx`
- Expanded TinyMCE back toward a more Word-like authoring surface while keeping the toolbar visually compact:
  - added `charmap`, `insertdatetime`, `pagebreak`, `visualblocks`, `visualchars`
  - added strikethrough plus indent/outdent controls
  - switched the toolbar to wrapped mode and compressed the toolbar chrome in `src/frontend/pages/print-forms/PrintFormsPage.css`
  - target behavior is a compact toolbar that fits within two visual rows on normal desktop widths
- Verification:
  - `npm run lint:frontend` -> PASS
  - `npm run build:frontend` -> PASS
- Guardrails / remaining gaps:
  - explicit genitive transformation remains heuristic and is safest for names and short position titles, not arbitrary legal prose
  - old locally saved template HTML may still contain previously inserted legacy placeholders until the user edits/replaces them manually
  - Vite still emits the pre-existing circular/manual chunk warnings, and the self-hosted TinyMCE chunk remains heavy

### 2026-03-12 Dynamic User Profile + Sticky Variables Rail + TinyMCE Ukrainian UI

- Extended the `/print-forms` placeholder audit to cover legal-entity user data in:
  - `src/frontend/pages/print-forms/templateBuilder.utils.ts`
- Added user placeholders for:
  - login email
  - legal form
  - own legal-entity name
  - combined legal-entity display name
  - ЄДРПОУ
  - additional addresses
  - block table placeholder for calculation rows (`calculation.selectedTable`)
- Made the `Змінні` rail track scroll on desktop and reduced its visual footprint:
  - sticky panel behavior
  - narrower width
  - smaller text density
  - collapse/expand button
  - TinyMCE now autoresizes with document growth so long-template scrolling happens at the page level instead of only inside the editor viewport
  - expanded variable group headers stay pinned at the top of the scrollable variables list
  - variable groups auto-collapse again after placeholder insertion
  - rail positioning was hardened beyond plain CSS sticky: the editor now measures scroll/resize state and switches the rail between `static`, `fixed`, and bottom-anchored modes so it stays reachable inside the fixed-topbar workspace layout
- Added local Ukrainian TinyMCE toolbar/menu translations in:
  - `src/frontend/pages/print-forms/tinymceUk.ts`
- Saving a template now transitions to a document-style preview:
  - A4-like preview based on printable HTML
  - hidden variables rail in preview mode
  - explicit `Редагувати` action to return to the editor
- `calculation.selectedTable` now inserts as a non-editable table block suitable for acts and similar printable documents
- Rebuilt the shared profile form to match the agreed 3-type specification:
  - `SELF_EMPLOYED`
  - `FOP`
  - `LEGAL_ENTITY`
- The new profile flow now supports:
  - conditional block composition by organization type
  - dedicated legal-entity block
  - director auto-copy with read-only synced fields
  - legal/factual address auto-copy with synced fields
  - dynamic additional phones, emails, and addresses
  - FOP registration data block
- Synced frontend/backend profile contracts and response mapping in:
  - `src/frontend/components/profile/UserProfileDetailsForm.tsx`
  - `src/frontend/components/profile/UserProfileDetailsForm.css`
  - `src/frontend/types/profile.types.ts`
  - `src/frontend/services/profile.service.ts`
  - `src/users/dto/profile.dto.ts`
  - `src/auth/services/users.service.ts`
  - `src/auth/services/auth.service.ts`
  - `src/frontend/types/auth.types.ts`
  - `src/frontend/pages/onboarding/OnboardingWizard.tsx`
- Verification:
  - `npm run lint:frontend` -> PASS
  - `npm run build` -> PASS
  - `npm run build:frontend` -> PASS
- Guardrails / remaining gaps:
  - TinyMCE Ukrainian localization is local/manual and currently covers the active editor surface rather than the entire upstream language pack
  - Vite still reports the existing circular/manual chunk warning and large TinyMCE chunk warning during frontend builds
  - no separate browser-driven regression pass was run for the new profile permutations in this turn

### 2026-03-12 Calculations Add Flow Returned To Same Tab

- Updated `src/frontend/pages/calculations/CalculationsPage.tsx` so `Додати розрахунок` still offers explicit income/expense selection but now navigates in the current tab instead of opening a separate browser tab/window
- The dedicated route-based create/view flow remains:
  - `/calculations/add?type=income|expense`
  - `/calculations/:id`
- Result:
  - users stay in the same tab when moving from the calculations register to the create form
  - successful save still redirects to the read-only calculation details route
- Verification:
  - `npm run lint:frontend` -> PASS
  - `npm run build:frontend` -> PASS
- Guardrails / remaining gaps:
  - `RecordActionsMenu` still has generic `newTab` support, but the calculations entry point no longer uses it
  - Vite still emits the pre-existing circular/manual chunk warnings during frontend builds

### 2026-03-12 Calculations Add Flow Session Fix For New Tab

- Fixed the new-tab calculations create entry in:
  - `src/frontend/components/RecordActionsMenu.tsx`
- Root cause:
  - browser handling of anchor-based `target="_blank"` internal navigation was still isolating the opened page from the current tab's non-persistent auth context
  - the dedicated `/calculations/add` route therefore opened as unauthenticated and redirected to `/login`
- Change:
  - internal route actions opened in a new tab now use `window.open(...)` directly from the user click instead of relying on anchor `target="_blank"` behavior
- Result:
  - `Додати розрахунок` -> `Прибутковий` / `Видатковий` opens the dedicated create screen without forcing a fresh login in non-persistent sessions
- Verification:
  - `npm run lint:frontend` -> PASS
  - `npm run build:frontend` -> PASS
- Guardrails / remaining gaps:
  - if `RecordActionsMenu` ever starts opening external URLs, those links should use a separate external-safe path with `noopener` / `noreferrer`
  - Vite still emits the pre-existing circular/manual chunk warnings during frontend builds

### 2026-03-11 Calculations Route-Based Create + Read-Only Details Flow

- Replaced inline calculations authoring with dedicated route-backed pages in:
  - `src/frontend/pages/calculations/CalculationCreatePage.tsx`
  - `src/frontend/pages/calculations/CalculationCreatePage.css`
  - `src/frontend/pages/calculations/CalculationDetailsPage.tsx`
  - `src/frontend/pages/calculations/CalculationDetailsPage.css`
- Added new routes in `src/frontend/App.tsx`:
  - `/calculations/add`
  - `/calculations/:id`
- Updated `src/frontend/pages/calculations/CalculationsPage.tsx` so `Додати розрахунок` now:
  - offers explicit income/expense selection
  - opens the selected create route in the current tab
- Extended `src/frontend/components/RecordActionsMenu.tsx` so route actions can opt into new-tab navigation
- Added `caseService.getAllCases()` in `src/frontend/services/case.service.ts` so the create form can safely load the full case selector instead of depending on a single-page result
- The create flow now redirects to the new read-only details page after save, and the details page exposes workflow/status actions without inline editing
- Verification:
  - `npm run lint:frontend` -> PASS
  - `npm run build:frontend` -> PASS
- Guardrails / remaining gaps:
  - there is still no dedicated edit route for calculations
  - the create form currently supports manual line items only and does not yet compose from pricelist rows
  - Vite still emits the pre-existing circular/manual chunk warnings during frontend builds

### 2026-03-11 Template Builder Density Pass + Sticky Long-Form Actions

- Tightened the `/print-forms` editor surface in:
  - `src/frontend/pages/print-forms/PrintFormsPage.tsx`
  - `src/frontend/pages/print-forms/PrintFormsPage.css`
- Removed the duplicated left `Формат документа` controls and kept formatting inside TinyMCE itself
- Reduced editor chrome height by:
  - removing the visible TinyMCE menubar row
  - switching to compact floating overflow toolbar behavior
  - reducing the toolbar command set so it no longer grows wider while trying to get shorter
  - removing verbose subtitle / explainer copy and trimming utility spacing
- Restored centered page geometry and the desktop two-column editor + variables layout instead of letting the editor stretch and push the right rail away
- Extended placeholder coverage in:
  - `src/frontend/pages/print-forms/templateBuilder.utils.ts`
  - added `user.middleName` and `user.director.middleName` aliases
  - added aggregate calculation placeholders for later document-generation selection
- Applied the shared sticky `FormActionBar` to:
  - `src/frontend/pages/clients/ClientDetailsPage.tsx`
  - `src/frontend/pages/cases/CaseDetailsPage.tsx`
- Restored the missing frontend stylesheet in:
  - `src/frontend/pages/notes/NotesPage.css`
- Verification:
  - `npm run lint:frontend` -> PASS
  - `npm run build:frontend` -> PASS
- Guardrails / remaining gaps:
  - final document generation from selected client/case/calculation records is still not implemented
  - Vite still emits the pre-existing circular-chunk warning and large lazy `tinymce` chunk warning during production builds
  - no live tenant-data browser pass was run after this editor-density change

### 2026-03-11 Calculations Registry Width Compaction

- Compacted the `/calculations` register layout in:
  - `src/frontend/pages/calculations/CalculationsPage.css`
- Adjustments:
  - filter toolbar now shrinks and wraps earlier on narrower desktop widths
  - summary chips use a smaller minimum width
  - the calculations table now uses fixed column widths plus wrapping instead of a large table minimum width
  - the note column no longer forces the register wider than the viewport
- Verification:
  - `npm run build:frontend` -> FAIL (`Could not resolve "./NotesPage.css" from "src/frontend/pages/notes/NotesPage.tsx"` on the first attempt; transient and outside the edited file)
  - `npm run build:frontend` -> PASS
- Guardrails / remaining gaps:
  - very long unbroken values now wrap instead of widening the table, which can increase row height
  - mobile still intentionally switches the table into stacked row cards below the existing responsive breakpoint

### 2026-03-11 Calculation Number Format By Client / Case / Sequence

- Replaced the legacy monthly `CALC-YYYY-MM-NNNN` generator in:
  - `src/calculations/services/calculation.service.ts`
- Calculation numbers now use:
  - `{clientNumber}/{caseSequence}/{sequence}-{suffix}`
  - examples:
    - `007/002/01-П`
    - `007/002/02-В`
- Rules:
  - `clientNumber` comes from `client.metadata.client_number`
  - `caseSequence` comes from the second segment of the internal case number `clientNumber/caseSequence`
  - `sequence` is shared within the same bucket and uses minimum width 2
  - suffix is `П` for income and `В` for expense
- Compatibility fallback:
  - client without case -> `{clientNumber}/000/{sequence}-{suffix}`
  - self / no client / no case -> `000/000/{sequence}-{suffix}`
- Added validation to reject create requests where `metadata.clientId` does not match the selected `caseId`.
- Added targeted unit coverage in:
  - `src/calculations/services/calculation.service.spec.ts`
- Updated DI wiring in:
  - `src/calculations/calculations.module.ts`
- Verification:
  - `npm test -- --runInBand src/calculations/services/calculation.service.spec.ts` -> PASS (4/4)
  - `npm run lint:backend` -> PASS
  - `npm run build` -> PASS
- Guardrails / remaining gaps:
  - legacy `CALC-*` numbers remain unchanged and are ignored when computing new-format sequence buckets
  - the compatibility fallback remains because the current frontend still allows self/no-case calculations
  - if product policy later forbids no-case numbering, both frontend authoring and backend validation must be tightened together

### 2026-03-11 Calculations ERP Registry Pass + Active Actions

- Reworked `/calculations` to match the shared ERP/CRM register pattern in:
  - `src/frontend/pages/calculations/CalculationsPage.tsx`
  - `src/frontend/pages/calculations/CalculationsPage.css`
- Removed the oversized top KPI cards and replaced them with:
  - compact register toolbar
  - active-filter counter
  - inline summary stats
- Expanded filtering with:
  - date-range picker
  - case filter
  - existing search/client/status/operation filters retained in the same toolbar
- Added explicit action entry points:
  - labeled page-level `Активні дії` button
  - row-level `Активні дії` menus per calculation
- Expanded the frontend calculations API/workflow surface in:
  - `src/frontend/services/calculation.service.ts`
  - `src/frontend/types/calculation.types.ts`
  - inline actions now support:
    - send for approval
    - approve
    - reject with reason
    - mark paid / restore status
    - delete
- Extended the shared record-actions trigger so it can render as a labeled page-action button in:
  - `src/frontend/components/RecordActionsMenu.tsx`
  - `src/frontend/components/RecordActionsMenu.css`
- Verification:
  - `npm run lint:frontend` -> PASS
  - `npm run build:frontend` -> PASS
- Guardrails / remaining gaps:
  - calculations still do not have a dedicated details/edit route
  - client/case/operation filters remain frontend-side against the fetched register payload
  - export actions from the existing backend surface are still not exposed in this pass

### 2026-03-11 Notes ERP Registry Pass + Global Actions Overlay

- Realigned `/notes` with the shared ERP/CRM register layout in:
  - `src/frontend/pages/notes/NotesPage.tsx`
  - `src/frontend/pages/notes/NotesPage.css`
- Added explicit page-level `Дії` button plus filters for:
  - category
  - client
  - case
  - access scope
  - full-text search
- Hardened shared row-action dropdown rendering in:
  - `src/frontend/components/RecordActionsMenu.tsx`
  - `src/frontend/components/RecordActionsMenu.css`
- Verification:
  - `npm run lint:frontend` -> PASS
  - `npm run build:frontend` -> PASS
- Guardrails / remaining gaps:
  - the existing Vite manual-chunk/circular-chunk warning remains

### 2026-03-11 Notes Limit Validation Fix

- Fixed the `/notes` load-time validation error `limit must not be greater than 100` in:
  - `src/frontend/pages/notes/NotesPage.tsx`
  - `src/notes/dto/note.dto.ts`
- Verification:
  - `npm run lint:frontend` -> PASS
  - `npm run build:frontend` -> PASS
- Guardrails / remaining gaps:
  - the existing Vite manual-chunk/circular-chunk warning remains

### 2026-03-11 Notes Table Register + Modal Editor Rewrite

- Reworked `/notes` from the inline two-pane workspace into a CRM/ERP table register in:
  - `src/frontend/pages/notes/NotesPage.tsx`
  - `src/frontend/pages/notes/NotesPage.css`
- Compact filters now focus only on:
  - search
  - client
  - case
  - access scope
- The note editor is now a modal window with just:
  - title
  - client
  - case
  - access scope
  - tags
  - rich-text note body
- Existing notes now open in modal read-view first; editing is a separate explicit action inside that modal
- The notes table now also exposes a row-level active-actions menu, matching the clients/cases registry interaction pattern
- Note snippets/search normalization now strip HTML tags in:
  - `src/frontend/utils/noteFormat.ts`
- Verification:
  - `npm run lint:frontend` -> PASS
  - `npm run build:frontend` -> PASS
- Guardrails / remaining gaps:
  - the existing Vite manual-chunk/circular-chunk warning remains
  - the notes page now pulls in TinyMCE for note-body formatting, so the shared heavy editor chunk remains part of the frontend build

### 2026-03-11 Unified Notes Workspace + Reverse Note Flows

- Added dedicated notes persistence/API in:
  - `src/database/entities/Note.entity.ts`
  - `src/database/migrations/1710800000000-AddNotesWorkspace.ts`
  - `src/notes/controllers/notes.controller.ts`
  - `src/notes/services/notes.service.ts`
  - `src/notes/dto/note.dto.ts`
  - `src/notes/notes.module.ts`
- Rebuilt `/notes` into a two-pane notes workspace in:
  - `src/frontend/pages/notes/NotesPage.tsx`
  - `src/frontend/pages/notes/NotesPage.css`
  - `src/frontend/services/note.service.ts`
  - `src/frontend/types/note.types.ts`
  - `src/frontend/utils/noteFormat.ts`
- Added reusable related-note panels and reverse entry points in:
  - `src/frontend/components/notes/RelatedNotesPanel.tsx`
  - `src/frontend/pages/clients/ClientDetailsPage.tsx`
  - `src/frontend/pages/cases/CaseDetailsPage.tsx`
  - `src/frontend/pages/clients/AddClientPage.tsx`
  - `src/frontend/pages/cases/AddCasePage.tsx`
- Verification:
  - `npm run lint` -> PASS
  - `npm run build` -> PASS
  - `npm run build:frontend` -> PASS
  - `npm test -- --runInBand` -> PASS (27 passed, 1 skipped suite / 158 passed tests)
- Guardrails / remaining gaps:
  - migration was added but not applied to a live database in this task
  - no dedicated e2e/browser automation exists yet for the notes workspace
  - the existing Vite manual-chunk/circular-chunk warning remains
  - the current UI exposes personal-profile linking for the signed-in user; arbitrary other-user note linking remains backend-capable but not yet surfaced in the UI

### 2026-03-11 TinyMCE Template Builder + Placeholder Variables

- Reworked `/print-forms` into a true placeholder-based template editor:
  - variables are inserted as compact placeholders like `{{client.displayName}}`
  - optional genitive-case insertion is encoded directly in placeholder syntax as `|genitive`
  - real entity data is no longer selected during template authoring and is expected to be substituted later during document generation
- Replaced the previous lightweight editor with TinyMCE in:
  - `src/frontend/pages/print-forms/PrintFormsPage.tsx`
- Fixed the TinyMCE runtime `ReferenceError: Can't find variable: tinymce` by switching the self-hosted Vite bundle to the official import order, exposing `globalThis.tinymce`, and setting the GPL self-hosted license key in:
  - `src/frontend/pages/print-forms/PrintFormsPage.tsx`
- Reworked variable definitions/helpers into a static grouped placeholder catalog in:
  - `src/frontend/pages/print-forms/templateBuilder.utils.ts`
- Expanded placeholder coverage so the template builder better reflects actual client/case form fields:
  - added client birth date, client added date, status/type, client number, extra contacts/messengers, addresses, banking, contact person/director data, and comment
  - added case created/added dates, type/priority/status, court address, description, participants summary, internal notes, and payment fields
- Added `user.city` to the `Користувач` placeholder group so templates can insert the city from the user's profile address
- Removed the oversized `Контекст шаблону` block and converted the right rail into a compact ERP/CRM-style variable list
- Variable groups in the right rail now start collapsed and expand on demand; search temporarily expands matching groups for faster insertion
- Added a dedicated lazy chunk for TinyMCE in:
  - `vite.config.ts`
- Verification:
  - `npm run lint:frontend` -> PASS
  - `npm run build:frontend` -> PASS
- Guardrails / remaining gaps:
  - server-side generation from placeholders is still not implemented
  - the lazy `tinymce` chunk is intentionally isolated to the template-builder route, but remains heavy compared with the rest of the app
  - Vite still prints the pre-existing manual-chunk notice (`vendor -> framework -> vendor`) during build

### 2026-03-11 Login + Landing Copy Cleanup

- Reworked user-facing copy in:
  - `src/frontend/pages/auth/LoginPage.tsx`
  - `src/frontend/pages/landing/LandingPage.tsx`
- Removed implementation-facing wording from the login screen marketing block and kept the message focused on user value.
- Strengthened landing positioning for lawyer/advocate/legal-company CRM search intent with clearer benefit-led copy across hero, pain points, features, pricing, FAQ, and CTAs.
- Verification:
  - `npm run build:frontend` -> PASS
- Guardrails / remaining gaps:
  - this pass updates copy only; metadata tags and structured SEO markup were not changed
  - no screenshot-based browser review was captured in this task

### 2026-03-11 Template Registry + Unified Row Actions

- Replaced the old print-forms placeholder with:
  - a template registry with search and active/archive filtering
  - a dedicated A4 editor mode for document-template authoring
- Removed the decorative template count/summary strip so the page starts directly with filters and the registry
- Added frontend-local template CRUD behavior in:
  - `src/frontend/pages/print-forms/PrintFormsPage.tsx`
- Added grouped variable resolution / preview helpers in:
  - `src/frontend/pages/print-forms/templateBuilder.utils.ts`
- Added a shared three-dots row-actions component in:
  - `src/frontend/components/RecordActionsMenu.tsx`
  - `src/frontend/components/RecordActionsMenu.css`
- Switched registry-style action clusters to the shared dropdown in:
  - `src/frontend/pages/clients/ClientsPage.tsx`
  - `src/frontend/pages/cases/CasesPage.tsx`
  - `src/frontend/pages/documents/DocumentsPage.tsx`
  - `src/frontend/pages/pricelists/PricelistsPage.tsx`
- Updated the canonical frontend rules in:
  - `docs/FRONTEND_DESIGN_SYSTEM.md`
  - CRM registry/list pages must not introduce decorative summary/KPI cards above the main table unless the page is analytics-first or the user explicitly asks for them
- Verification:
  - `npm run lint:frontend` -> PASS
  - `npm run build:frontend` -> PASS
- Guardrails / remaining gaps:
  - template records are currently persisted in browser `localStorage`, not in a backend template table
  - no dedicated backend archive/delete audit trail exists yet for template records
  - genitive-case transformation is heuristic and safest for name-like variables rather than arbitrary legal prose

### 2026-03-11 Browser Tab Favicon Refresh

- Added an explicit favicon link in:
  - `index.html`
- Added the user-provided browser-tab asset in:
  - `public/favicon.svg`
- Scope:
  - only the browser tab icon changed
  - the shared in-app logo asset at `src/frontend/assets/project-logo.svg` remains unchanged
- Verification:
  - `npm run build:frontend` -> FAIL (`Could not resolve "./pages/print-forms/PrintFormsPage" from "src/frontend/App.tsx"`)
- Guardrails / remaining gaps:
  - frontend production build is currently blocked by the missing `PrintFormsPage` import path, which is unrelated to the favicon change itself

### 2026-03-11 Calendar Event Form Expansion + Range/Repeat Support

- Expanded event persistence/contracts for:
  - `endDate`
  - `endTime`
  - `isAllDay`
  - `responsibleContact`
  - `reminderValue`
  - `reminderUnit`
  - `isRecurring`
  - `recurrencePattern`
  - `recurrenceInterval`
  - `recurrenceEndDate`
- Added migration:
  - `src/database/migrations/1710700000000-ExpandCalendarEventScheduling.ts`
- Reworked the add-event screen in:
  - `src/frontend/pages/events/AddEventPage.tsx`
  - `src/frontend/pages/events/AddEventPage.css`
- Updated backend and calendar rendering in:
  - `src/events/dto/event.dto.ts`
  - `src/events/services/event.service.ts`
  - `src/frontend/types/event.types.ts`
  - `src/frontend/pages/calendar/CalendarPage.tsx`
- Functional outcomes:
  - raw case ID entry is replaced by client/case dropdowns
  - the form now exposes requested location, responsible-contact, reminder, range-event, and repeat controls
  - calendar views now show expanded recurring and multi-day occurrences plus enriched event details
- Verification:
  - `npm test -- --runInBand src/events/services/event.service.spec.ts` -> PASS (3/3)
  - `npm run build` -> PASS
  - `npm run build:frontend` -> PASS
- Guardrails / remaining gaps:
  - the migration was added but not executed against a live database in this task
  - recurring occurrences are generated on read, so series exceptions and single-occurrence editing are still not implemented
  - reminder routing still targets the event creator, not the new responsible-contact field

### 2026-03-11 Clients Registry Number Column

- Added a dedicated `Номер` column to the clients table in:
  - `src/frontend/pages/clients/ClientsPage.tsx`
- Client rows now render `metadata.client_number` with the same pill-style treatment used by case numbers, with `Не вказано` as the fallback in:
  - `src/frontend/pages/clients/ClientsPage.css`
- Verification:
  - `npm run build:frontend` -> PASS
- Guardrails / remaining gaps:
  - client records without `metadata.client_number` remain visible and intentionally render the fallback label

### 2026-03-11 Calculations Registry Fix + Tabular Workflow

- Fixed the backend validation bug that caused `GET /calculations` to return `400` on an empty query because `status` was not optional in:
  - `src/calculations/dto/calculation.dto.ts`
- Expanded the frontend calculations API client to support query params in:
  - `src/frontend/services/calculation.service.ts`
  - `src/frontend/types/calculation.types.ts`
- Reworked the calculations page into a CRM/ERP-like table with filters and dedicated income/expense creation buttons in:
  - `src/frontend/pages/calculations/CalculationsPage.tsx`
  - `src/frontend/pages/calculations/CalculationsPage.css`
- Functional outcomes:
  - free-text, operation-type, client, status, and date filters are available on the register
  - register rows now show operation type, client, case, date, amount, status, and note
  - creation now starts from explicit actions:
    - `Додати видатковий розрахунок`
    - `Додати прибутовий розрахунок`
  - the create form opens as a dedicated panel instead of always occupying the page
- Verification:
  - `npm run lint:frontend` -> PASS
  - `npm run lint:backend` -> PASS
  - `npm run build` -> PASS
  - `npm run build:frontend` -> PASS
- Guardrails / remaining gaps:
  - client and operation-type filtering is still frontend-side against fetched metadata, not backend-side query filtering
  - the register currently fetches up to 100 rows for this surface
  - edit/details and export actions are still not exposed inline, although approval/status/delete row actions are now available in a later 2026-03-11 pass

### 2026-03-11 Flexible Case Participants + Real Calculation Authoring

- Replaced the old fixed plaintiff/defendant/third-party case block with grouped participant capture and manual custom-role entry in:
  - `src/frontend/components/cases/CaseFormSections.tsx`
  - `src/frontend/utils/caseParticipants.ts`
  - `src/frontend/pages/cases/AddCasePage.css`
- Institution labels in the case form now reflect generic court/authority usage, and previously highlighted institution/finance fields are non-blocking.
- Case create/edit flows now round-trip structured participants through `metadata.caseParticipants` while keeping legacy participant text fields synchronized in:
  - `src/frontend/pages/cases/AddCasePage.tsx`
  - `src/frontend/pages/cases/CaseDetailsPage.tsx`
  - `src/frontend/schemas/case.schema.ts`
- Backend case creation now preserves omitted `estimatedAmount` / `courtFee` as nullable in:
  - `src/cases/services/case.service.ts`
- Replaced the old calculations analytics placeholder with a create/list operations workspace in:
  - `src/frontend/pages/calculations/CalculationsPage.tsx`
  - `src/frontend/pages/calculations/CalculationsPage.css`
  - `src/frontend/services/calculation.service.ts`
  - `src/frontend/types/calculation.types.ts`
- Backend calculations now accept metadata and correctly total both pricelist-backed income lines and manual expense lines in:
  - `src/calculations/dto/calculation.dto.ts`
  - `src/calculations/services/calculation.service.ts`
- Verification:
  - `npm run lint:frontend` -> PASS
  - `npm run lint:backend` -> PASS
  - `npm run build` -> PASS
  - `npm run build:frontend` -> PASS
- Guardrails / remaining gaps:
  - participant structure is still metadata-backed rather than first-class relational storage
  - expense-row unit labels currently reuse the existing calculation-item `code` field
  - the new calculations UI does not yet wire edit/approval/export actions from the existing backend surface

### 2026-03-11 Case Form Follow-up: Compact Role Picker + Section Error Highlighting

- Case participant status selection is now a compact grouped dropdown instead of the previous collapsible multi-group UI.
- The participant label now reads `Статус у справі`.
- Case create/update submit paths now strip `participants` from the request body and persist it only through `metadata.caseParticipants`, which removes the backend whitelist error.
- The standalone `Дати` block was removed from case authoring; `Дата додавання справи` now lives beside the auto-generated case number and still supports native keyboard date entry.
- Shared client/case add-edit surfaces now visually mark invalid sections/cards with error highlighting.
- Case details now default to read-only presentation and only open the edit form after explicit user action (`Редагувати`).
- Verification:
  - `npm run lint:frontend` -> PASS
  - `npm run build:frontend` -> PASS

### 2026-03-11 Native Date Input + Client Creation Date Override

- Replaced the shared custom date-picker popover with a native date input wrapper in:
  - `src/frontend/components/DatePicker.tsx`
  - `src/frontend/components/DatePicker.css`
- Effect:
  - date fields now support direct keyboard entry
  - the broken custom calendar frame/popover path is removed from shared client/case forms
- Removed descriptive helper copy from shared form sections in:
  - `src/frontend/components/clients/ClientFormSections.tsx`
  - `src/frontend/components/cases/CaseFormSections.tsx`
- Client create flow now defaults the add date to today but allows manual editing before submit in:
  - `src/frontend/pages/clients/AddClientPage.tsx`
- Backend client creation now accepts explicit `createdAt` from the form path in:
  - `src/clients/dto/client.dto.ts`
  - `src/clients/services/client.service.ts`
- Frontend DTO mapping now persists `registration_date` into backend `createdAt` in:
  - `src/frontend/types/client.types.ts`
  - `src/frontend/utils/clientDataTransform.ts`
- Verification:
  - `npm run lint` -> PASS
  - `npm test -- --runInBand src/clients/services/client.service.spec.ts` -> PASS (37/37)
  - `npm test -- --runInBand src/frontend/utils/__tests__/clientDataTransform.test.ts` -> FAIL (`No tests found`)
  - `npx jest --runInBand --testRegex '.*\\.(spec|test)\\.ts$' src/frontend/utils/__tests__/clientDataTransform.test.ts` -> PASS (project-wide suite run; includes the target test)
  - `npm run build` -> PASS
  - `npm run build:frontend` -> PASS
- Guardrails / remaining gaps:
  - default Jest discovery still misses frontend `*.test.ts` files
  - existing client edit flow still keeps the creation date locked/read-only
  - native browser date UI now depends on browser-level date input support/styling rather than the removed custom calendar chrome

### 2026-03-11 Client Form Consolidation + Dynamic Contacts

- Added a shared create/edit shell in:
  - `src/frontend/components/clients/ClientForm.tsx`
- Reworked the conditional client-type sections in:
  - `src/frontend/components/clients/ClientFormSections.tsx`
- Updated address labels/semantics in:
  - `src/frontend/components/clients/AddressSection.tsx`
- Updated client form schema and bidirectional mapping in:
  - `src/frontend/schemas/client.schema.ts`
  - `src/frontend/utils/clientFormData.ts`
  - `src/frontend/utils/clientDataTransform.ts`
- Create/edit routes now consume the same shared form structure in:
  - `src/frontend/pages/clients/AddClientPage.tsx`
  - `src/frontend/pages/clients/ClientDetailsPage.tsx`
- Functional outcomes:
  - client number remains system-managed/read-only for MVP
  - creation date is displayed as read-only
  - individual passport capture is now one field instead of split series/number inputs
  - patronymic is optional where the business analysis allowed it
  - additional phones/emails are dynamic field arrays, not placeholder links
  - messenger values are now editable text inputs
  - legal entity contact person now has a full contact block instead of a partial static subset
  - address labels now distinguish registration vs legal address by client type
  - comment field now has a 5000-char cap with a live counter
- Verification:
  - `npm run lint` -> PASS
  - `npm run build:frontend` -> PASS
  - `npm test -- src/frontend/schemas/client.schema.spec.ts --runInBand` -> PASS (2/2)
  - `npx jest --runInBand --testRegex '.*\\.(spec|test)\\.ts$' src/frontend/utils/__tests__/clientDataTransform.test.ts` -> PASS (includes transform regression coverage)
- Guardrails / remaining gaps:
  - client-type switching still soft-preserves hidden values; there is no confirmation modal yet
  - additional address arrays are still not implemented
  - backend persistence still relies on the legacy normalized metadata contract, so the UI/business model is only partially normalized in storage

### 2026-03-11 Local Dev Startup Gating

- Added a backend health gate script for local combined startup:
  - `scripts/start-frontend-when-backend-ready.sh`
- Updated package scripts in:
  - `package.json`
- `npm run start:all` now waits for `http://localhost:3000/health` before launching Vite, which prevents the frontend from immediately emitting proxy traffic to an unopened backend port.
- This specifically addresses the transient local Vite proxy refusal observed on `/v1/logs` when Nest bootstrap is still busy with startup work.
- Fixed the backend bootstrap blockers that were keeping `/health` down:
  - broke the billing DI cycle in:
    - `src/billing/services/stripe.service.ts`
    - `src/billing/services/wayforpay.service.ts`
    - `src/billing/services/stripe.service.spec.ts`
  - changed transient logger bootstrap usage in:
    - `src/main.ts`
- Verification:
  - `npm run build` -> PASS
  - `npm test -- --runInBand src/billing/services/stripe.service.spec.ts src/common/logging/global-exception.filter.spec.ts` -> PASS (4/4)
  - `npm run start:prod` -> PASS
  - `GET http://localhost:3000/health` -> `200`
  - `npm run start:frontend:wait-backend` -> PASS
- Remaining limitation:
  - local startup still pays the current SQLite schema inspection/sync cost, so boot is fixed but not especially fast

### 2026-03-11 Two-Step Registration + Universal Profile Form

- Reversed the earlier overreach in registration capture and made self-registration first-step only in:
  - `src/auth/dto/register.dto.ts`
  - `src/frontend/types/auth.types.ts`
  - `src/frontend/pages/auth/RegisterPage.tsx`
- Registration now only collects:
  - `email`
  - `password`
- Self-register bootstrap in `src/auth/services/auth.service.ts` now creates:
  - a generated starter organization name
  - an owner user with placeholder human-name values until onboarding/profile is completed
- Expanded the canonical user profile contract in:
  - `src/users/dto/profile.dto.ts`
  - `src/auth/services/users.service.ts`
- The profile model now supports:
  - `organizationType`
  - personal identity fields
  - primary and secondary phones/emails
  - director metadata
  - legal status
  - bank details
  - legal and factual addresses
  - registration/basis fields for `FOP` and `LEGAL_ENTITY`
- Added the reusable dynamic profile UI in:
  - `src/frontend/components/profile/UserProfileDetailsForm.tsx`
  - `src/frontend/components/profile/UserProfileDetailsForm.css`
- The universal form now provides:
  - conditional rendering by organization type
  - dynamic contact arrays
  - director auto-copy from user fields
  - factual-address copy from legal address
  - Ukrainian-format validation/masking for `+380` phone numbers, 10-digit tax ID, 6-digit MFO, and `UA` IBAN
- Replaced the profile step/edit surfaces in:
  - `src/frontend/pages/onboarding/OnboardingWizard.tsx`
  - `src/frontend/pages/profile/ProfilePage.tsx`
- Canonical split after this pass:
  - registration = account bootstrap only
  - onboarding/profile = identity, contact, organizational, banking, and address enrichment
- Validation:
  - `npm run lint:backend` -> PASS
  - `npm run lint:frontend` -> PASS
  - `npm run build` -> PASS
  - `npm run build:frontend` -> PASS
  - `npm test -- --runInBand src/auth/services/auth.service.spec.ts -t "register"` -> PASS
- Remaining limitation:
  - live email verification delivery/confirmation is still not implemented
  - Google / Apple / Microsoft auth is still not implemented
  - onboarding still uses the existing container step model; only the profile payload/UX was normalized in this pass

### 2026-03-11 Registration Runtime Stabilization

- Fixed a backend runtime blocker that could break registration and other auth flows by preventing the API from bootstrapping cleanly:
  - removed the BillingService <-> StripeService/WayForPayService circular runtime import
  - introduced shared billing port/types in:
    - `src/billing/services/billing.types.ts`
  - switched provider services to token-based sync-port injection in:
    - `src/billing/services/stripe.service.ts`
    - `src/billing/services/wayforpay.service.ts`
    - `src/billing/billing.module.ts`
- Improved registration error visibility in:
  - `src/frontend/pages/auth/RegisterPage.tsx`
- Fixed the concrete self-registration `500` root cause:
  - `refresh_tokens.token` was limited to `varchar(255)` while generated refresh JWTs are materially longer
  - expanded token storage to `text` in:
    - `src/database/entities/RefreshToken.entity.ts`
    - `src/database/migrations/1710600000000-ExpandRefreshTokenTokenColumn.ts`
- Registration page now surfaces:
  - backend validation messages
  - array-based validation errors
  - explicit service-unavailable messaging for network/backend outages
- Validation:
  - `npm run lint:backend` -> PASS
  - `npm run build` -> PASS
  - `npm run lint:frontend` -> PASS
  - `npm test -- --runInBand src/auth/services/auth.service.spec.ts -t "register"` -> PASS
- Remaining limitation:
  - a live browser-level registration proof was not captured in this pass
  - production/staging environments still need the new refresh-token column migration applied before this fix is fully effective outside local auto-sync mode

### 2026-03-11 Conversation 11 Rehearsal Packaging

- Added local production-like rehearsal assets:
  - `docker-compose.rehearsal.yml`
  - `scripts/local-launch-rehearsal.sh`
- Added dedicated worker bootstrap in:
  - `src/worker.ts`
- Added scheduler role gating in:
  - `src/common/runtime/scheduled-tasks.ts`
  - `src/common/health/operational-monitoring.service.ts`
  - `src/file-storage/services/file-scan.service.ts`
  - `src/trust-verification/services/trust-verification-worker.service.ts`
  - `src/notifications/services/notification.service.ts`
  - `src/events/services/event.service.ts`
  - `src/enterprise/processors/outbox.processor.ts`
- Fixed production/runtime config mismatch:
  - `src/common/config/environment.validator.ts` now accepts both `DB_*` and `DATABASE_*` aliases for PostgreSQL connection validation
  - `docker-compose.yml` now provides matching env aliases plus explicit `RUN_SCHEDULED_JOBS` role assignment
- Validation:
  - `npm run lint:backend` -> PASS
  - `npm run build` -> PASS
  - `bash -n scripts/local-launch-rehearsal.sh` -> PASS
  - `docker compose -f docker-compose.yml -f docker-compose.rehearsal.yml config` -> PASS
- Remaining limitation:
  - actual local boot/degradation/restore proof was attempted but blocked because the Docker daemon was unavailable (`Cannot connect to /Users/edhar/.docker/run/docker.sock`)
  - SMTP/SMS/push transport proof and live trust-provider/scanner runtime proof remain external staging tasks, not locally completed items

### 2026-03-11 Secondary Module Phase Labeling

- Closed Conversation 18 in the explicit phase-labeling variant.
- Added reusable phase/status framing in:
  - `src/frontend/components/ModulePhaseNotice.tsx`
  - `src/frontend/components/ModulePhaseNotice.css`
- Classified current module scope as:
  - launch-scope operational surfaces:
    - `reports`
    - `calculations`
  - post-launch preview surfaces:
    - `print-forms`
    - `chat`
    - `mail`
- Applied explicit UI labels in:
  - `src/frontend/pages/reports/ReportsPage.tsx`
  - `src/frontend/pages/calculations/CalculationsPage.tsx`
  - `src/frontend/pages/print-forms/PrintFormsPage.tsx`
  - `src/frontend/pages/chat/ChatPage.tsx`
  - `src/frontend/pages/mail/MailPage.tsx`
- Outcome:
  - launch-facing surfaces no longer imply that messaging, template generation, or full mail workspace workflows are already production-complete
  - the remaining product ambiguity is reduced; the unresolved work is now real implementation depth, not scope signaling
- Validation:
  - `npm run lint:frontend` -> PASS
  - `npm run build:frontend` -> PASS
  - `npm run build` -> PASS
- Remaining limitation:
  - `print-forms`, `chat`, and `mail` are still lightweight hubs and were intentionally not deepened in this pass
  - a future product decision could still promote one or more of them back into launch scope, but that would require dedicated implementation work

### 2026-03-10 Registration / Onboarding / Profile Ownership Reconciliation

- Defined and implemented the canonical split:
  - registration = tenant bootstrap identity only
  - onboarding = required startup operational/professional setup
  - profile = extended personal/professional enrichment
- Expanded self-registration contract in:
  - `src/auth/dto/register.dto.ts`
  - `src/frontend/types/auth.types.ts`
  - `src/frontend/pages/auth/RegisterPage.tsx`
- Self-registration no longer creates an anonymous owner inside a generic `Особистий кабінет`; it now persists:
  - `organizationName`
  - `legalForm`
  - `firstName`
  - `lastName`
  - `email`
- Reconciled backend persistence in:
  - `src/auth/services/auth.service.ts`
- Self-registration now seeds onboarding progress with explicit `capturedAtRegistration` and `requiredInOnboarding` data for:
  - `organization_details`
  - `user_profile`
- Replaced simulated onboarding saves with live persistence in:
  - `src/frontend/pages/onboarding/OnboardingWizard.tsx`
- Onboarding now updates:
  - organization data through `/organizations/me`
  - owner startup professional data through `/users/profile`
  - team invites through `/users/invitations`
- Added persisted auth-session synchronization after profile/org edits in:
  - `src/frontend/services/auth-storage.ts`
  - `src/frontend/store/auth.slice.ts`
- Added focused regression coverage in:
  - `src/auth/services/auth.service.spec.ts`
- Validation:
  - `npm test -- --runInBand src/auth/services/auth.service.spec.ts` -> PASS (26/26)
  - `npm run lint:backend` -> PASS
  - `npm run lint:frontend` -> PASS
  - `npm run build` -> PASS
  - `npm run build:frontend` -> PASS
- Remaining limitation:
  - onboarding still uses the existing step enum/model rather than a newly normalized workflow schema
  - this pass did not add invitation-acceptance UX or external transport proof

### 2026-03-10 Admin Surface Completion + IA Navigation Alignment

- Replaced the remaining inline placeholder frontend routes with real route-backed pages:
  - `/users`
  - `/settings`
  - `/audit`
- Added tenant-scoped users management and invitation APIs in:
  - `src/auth/controllers/users.controller.ts`
  - `src/auth/services/users.service.ts`
  - `src/users/dto/user-management.dto.ts`
- New users/team behavior now includes:
  - current-user profile read/update/password change
  - tenant member listing
  - role/status updates for non-owner members
  - invitation listing/creation/revocation
  - plan-capacity checks before creating invitations
- Added a standard auth-module audit listing endpoint in:
  - `src/auth/controllers/audit-logs.controller.ts`
  - `src/auth/services/audit.service.ts`
- Audit access is now explicitly scoped to:
  - owner/admin roles
  - Professional+ plans
- Added real frontend admin/ops pages in:
  - `src/frontend/pages/users/UsersPage.tsx`
  - `src/frontend/pages/settings/SettingsPage.tsx`
  - `src/frontend/pages/audit/AuditPage.tsx`
- Settings now persist real organization data and operational policy fields through `/organizations/me`.
- Fixed `src/frontend/services/profile.service.ts` so profile reads/writes use the actual API client contract instead of expecting Axios response wrappers.
- Updated the live shell/navigation exposure in:
  - `src/frontend/components/navigation/Navigation.tsx`
  - `src/frontend/components/navigation/Breadcrumbs.tsx`
  - `src/frontend/components/navigation/Navigation.css`
- Newly exposed IA destinations:
  - `profile`
  - `activity`
  - `reports`
  - `users`
  - `settings`
- Validation:
  - `npm run lint:backend` -> PASS
  - `npm run lint:frontend` -> PASS
  - `npm run build` -> PASS
  - `npm run build:frontend` -> PASS
- Remaining limitation:
  - invitation acceptance/email delivery and staging transport proof were not completed in this pass and remain part of Conversation 11 / later onboarding-commercial work
  - audit export / WORM chain verification still belongs to the enterprise audit module, which remains disabled in `src/app.module.ts`

### 2026-03-10 Conversation 10-14 Verification Pass + Event DTO Regression Fix

- Re-verified the post-hardening state after Conversations 10-14 against the current codebase and docs.
- Fixed a real regression in:
  - `src/events/dto/event.dto.ts`
- Regression detail:
  - duplicate `reminderDaysBefore` in `CreateEventDto` caused `npm run test:e2e -- --runInBand` to fail even though earlier docs marked Conversation 13 complete
- Also cleaned up misleading implementation comments in:
  - `src/events/services/event.service.ts`
  - `src/notifications/services/notification.service.ts`
- Validation:
  - `npm run test:e2e -- --runInBand` -> PASS (22/22)
  - `npm test -- --runInBand src/invoices/services/invoice.service.spec.ts src/notifications/services/notification.service.spec.ts src/events/services/event.service.spec.ts` -> PASS (9/9)
  - `npx eslint src/events/dto/event.dto.ts src/events/services/event.service.ts src/notifications/services/notification.service.ts` -> PASS
  - `npm run build` -> PASS
- Assessment result:
  - Conversation 10 is implementation-complete locally; external provider proof remains part of Conversation 11
  - Conversation 11 remains the first real unchecked execution track
  - Conversations 12, 13, and 14 are locally verified
  - the next backlog should not skip to product/UI work before Conversation 11 staging proof is executed

### 2026-03-10 Billing Provider Synchronization + Customer Billing Retrieval

- Completed billing-provider synchronization in:
  - `src/billing/services/billing.service.ts`
  - `src/billing/services/stripe.service.ts`
  - `src/billing/services/wayforpay.service.ts`
  - `src/billing/controllers/billing-webhooks.controller.ts`
  - `src/main.ts`
- New billing behavior:
  - Stripe webhooks now use raw request body for signature validation and synchronize subscription state into local storage
  - Stripe duplicate webhook events are suppressed through `latestWebhookEventId`
  - organization subscription snapshot fields are refreshed from synchronized billing state
  - Stripe invoice retrieval and payment-method retrieval now return normalized provider data
  - WayForPay now keeps normalized payment history metadata and exposes invoice/payment-method views instead of placeholder empty responses
- Added billing verification coverage:
  - `src/billing/services/billing.service.spec.ts`
  - `src/billing/services/stripe.service.spec.ts`
- Validation:
  - `npm test -- --runInBand src/billing/services/billing.service.spec.ts src/billing/services/stripe.service.spec.ts` -> PASS (16/16)
  - `npm run lint:backend -- --fix=false src/billing/services/billing.service.ts src/billing/services/stripe.service.ts src/billing/services/wayforpay.service.ts src/billing/controllers/billing-webhooks.controller.ts src/main.ts src/billing/services/billing.service.spec.ts src/billing/services/stripe.service.spec.ts` -> PASS
  - `npm run build` -> PASS
- Remaining limitation:
  - external commercial transport/provider proof still belongs to the next staging-oriented pass even though the local workflow implementation is now complete

### 2026-03-10 Operator Runbooks For Key Rotation And Backfill Rehearsal

- Added operator runbooks:
  - `docs/BLIND_INDEX_KEY_ROTATION_RUNBOOK.md`
  - `docs/PRODUCTION_BACKFILL_REHEARSAL_RUNBOOK.md`
- Linked the runbooks into:
  - `docs/LAUNCH_REHEARSAL_CHECKLIST.md`
  - `docs/DEPLOYMENT.md`
  - `docs/AGENT_EXECUTION_CHECKLIST.md`
- Outcome:
  - the documentation gap for blind-index rotation and production-scale backfill rehearsal is now closed
  - Conversation 11 still remains externally blocked on staging deploy/outage/backup/scanner/provider execution evidence
- Verification:
  - no new code verification commands were run in this pass because the change set was documentation-only

### 2026-03-10 Live Trust Provider Integration Path + Signed Callback Hardening

- Replaced stub-only trust adapters with configurable live exchange paths in:
  - `src/trust-verification/services/trust-provider.adapters.ts`
- Added live-capable behavior:
  - ACSK verification/status flows can call upstream signature/identity endpoints plus optional OCSP/CRL checks
  - Diia verification can perform token exchange plus identity/signature verification
  - BankID NBU verification can perform token exchange plus identity/status verification
  - providers still support explicit `stub` mode for local/dev use
- Added callback authentication and replay protection in:
  - `src/trust-verification/services/trust-callback-auth.service.ts`
  - `src/trust-verification/services/trust-verification.service.ts`
  - `src/trust-verification/controllers/trust-verification.controller.ts`
- Callback hardening now includes:
  - provider-specific callback secrets
  - HMAC signature verification
  - timestamp skew enforcement
  - nonce replay protection backed by Redis when available, otherwise in-memory fallback
- Added live-mode environment validation in:
  - `src/common/config/environment.validator.ts`
- Added focused trust verification coverage:
  - `src/trust-verification/services/trust-provider.adapters.spec.ts`
  - `src/trust-verification/services/trust-callback-auth.service.spec.ts`
  - `src/trust-verification/services/trust-verification.service.spec.ts`
- Validation:
  - `npm test -- --runInBand src/trust-verification/services/trust-verification.service.spec.ts src/trust-verification/services/trust-verification-worker.service.spec.ts src/trust-verification/services/trust-provider.adapters.spec.ts src/trust-verification/services/trust-callback-auth.service.spec.ts` -> PASS (12/12)
  - `npm run lint:backend -- --fix=false src/trust-verification/services/trust-verification.service.ts src/trust-verification/services/trust-provider.adapters.ts src/trust-verification/services/trust-callback-auth.service.ts src/trust-verification/controllers/trust-verification.controller.ts src/common/config/environment.validator.ts src/trust-verification/services/trust-verification.service.spec.ts src/trust-verification/services/trust-provider.adapters.spec.ts src/trust-verification/services/trust-callback-auth.service.spec.ts` -> PASS
  - `npm run build` -> PASS
- Remaining limitation:
  - real provider credentials, contract confirmation, and staging evidence are still external dependencies and remain open launch blockers

### 2026-03-10 Full Project Reassessment + Verification Refresh

- Re-ran the full local verification contour after Conversations 0-9:
  - `npm run lint` -> PASS
  - `npm test -- --runInBand` -> PASS (21 passed, 1 skipped suite / 3 skipped tests)
  - `RLS_TEST_DATABASE_URL='postgresql://postgres@127.0.0.1:55432/postgres' npm test -- --runInBand src/database/migrations/harden-postgres-rls-policies.spec.ts` -> PASS (3/3)
  - `npm run test:e2e -- --runInBand` -> PASS (22/22)
  - `npm run build` -> PASS
  - `npm run build:frontend` -> PASS
  - `npm run test:frontend:smoke` -> PASS (2/2)
- Fresh regressions found during the reassessment and fixed in the same pass:
  - controller request typing drift in:
    - `src/auth/controllers/auth.controller.ts`
    - `src/auth/controllers/organization.controller.ts`
    - `src/billing/controllers/billing.controller.ts`
    - `src/billing/controllers/billing-webhooks.controller.ts`
    - `src/auth/interfaces/jwt.interface.ts`
  - nullable entity typing drift in:
    - `src/database/entities/DocumentSignature.entity.ts`
  - outdated e2e assumptions about auto-generated internal case numbers in:
    - `tests/cases.e2e-spec.ts`
- The cases e2e contract now reflects the real backend behavior:
  - client records used for case creation need `metadata.client_number`
  - internal `caseNumber` is generated server-side
  - court/external numbers belong in `registryCaseNumber`
- Assessment result:
  - the codebase now looks locally stable across the main backend/frontend verification surface
  - the next phase is no longer foundational hardening; it is live integration + staging rehearsal + commercial workflow completion
- Remaining risk:
  - local green status still does not replace live staging execution against real PostgreSQL/Redis/worker/scanner/provider infrastructure

### 2026-03-09 PostgreSQL RLS Runtime + Policy Hardening

- Replaced the previous non-functional RLS interceptor approach with a request-scoped context pipeline in:
  - `src/common/interceptors/rls.interceptor.ts`
  - `src/app.module.ts`
- New runtime behavior:
  - authenticated requests store `tenant_id`, `user_id`, and `role` in `AsyncLocalStorage`
  - patched PostgreSQL TypeORM query runners now apply:
    - `app.current_tenant_id`
    - `app.current_user_id`
    - `app.current_user_role`
  - anonymous/no-context runners are explicitly cleared to avoid stale pooled session state
- Added PostgreSQL RLS hardening migration:
  - `src/database/migrations/1710100000000-HardenPostgresRlsPolicies.ts`
- Migration scope:
  - removes the prior `current_tenant_id() IS NULL` read loophole
  - adds helper functions for current tenant/user/role and elevated-role checks
  - forces RLS on covered tables
  - upgrades `clients`, `cases`, `documents` to tenant+user-aware policies
  - adds RLS coverage for directly related `user_identities` and `document_signatures`
  - backfills missing tenant-only policies for `pricelists`, `calculations`, and `onboarding_progress`
- Added verification coverage:
  - `src/common/interceptors/rls.interceptor.spec.ts`
  - `src/database/migrations/harden-postgres-rls-policies.spec.ts`
- Also fixed a PostgreSQL bootstrap defect in:
  - `src/database/migrations/1706400000000-EnableRowLevelSecurity.ts`
  - the old hard-coded `GRANT ... TO law_organizer` now executes only if that role exists
- Hardened unauthenticated registration flows in:
  - `src/auth/services/auth.service.ts`
- Registration transactions now explicitly set PostgreSQL session context immediately after organization creation so inserts into `users` and `onboarding_progress` remain valid under forced RLS.
- Added unit coverage for that path in:
  - `src/auth/services/auth.service.spec.ts`
- Hardened audit logging fallback in:
  - `src/auth/services/audit.service.ts`
- Audit logs now use an explicit tenant-scoped PostgreSQL query-runner path when runtime ALS context is unavailable, preventing silent audit-write loss on public/system flows under forced RLS.
- Added unit coverage in:
  - `src/auth/services/audit.service.spec.ts`
- Validation:
  - `npm run lint` -> PASS
  - `npm test -- --runInBand src/common/interceptors/rls.interceptor.spec.ts` -> PASS
  - `npm test -- --runInBand src/auth/services/auth.service.spec.ts` -> PASS
  - `npm test -- --runInBand src/auth/services/audit.service.spec.ts` -> PASS
  - `RLS_TEST_DATABASE_URL='postgresql://postgres@127.0.0.1:55432/postgres' npm test -- --runInBand src/database/migrations/harden-postgres-rls-policies.spec.ts` -> PASS
  - `npm run build` -> PASS
- Remaining risk:
  - At that point, Conversations 1 and 2 were complete; later passes also completed Conversations 3 and 4

### 2026-03-09 Declarative RBAC + Server-Side Subscription Enforcement

- Added declarative access-control metadata in:
  - `src/auth/decorators/access-control.decorators.ts`
- Activated metadata-driven authorization in:
  - `src/auth/guards/index.ts`
- Added canonical plan limits in:
  - `src/common/security/subscription-limits.ts`
- Applied audited controller-level role and plan requirements across:
  - `src/cases/controllers/cases.controller.ts`
  - `src/clients/controllers/clients.controller.ts`
  - `src/documents/controllers/documents.controller.ts`
  - `src/billing/controllers/billing.controller.ts`
  - `src/auth/controllers/organization.controller.ts`
  - `src/events/controllers/events.controller.ts`
  - `src/invoices/controllers/invoices.controller.ts`
  - `src/pricelists/controllers/pricelist.controller.ts`
  - `src/calculations/controllers/calculation.controller.ts`
  - `src/file-storage/controllers/file-storage.controller.ts`
- Added backend quota enforcement in:
  - `src/clients/services/client.service.ts`
  - `src/cases/services/case.service.ts`
  - quota checks now reject over-limit create, restore, and bulk-import flows based on the tenant subscription plan
- Added coverage in:
  - `src/auth/guards/access-control.guards.spec.ts`
  - `src/clients/services/client.service.spec.ts`
  - `src/cases/services/case.service.spec.ts`
- Validation:
  - `npm run lint` -> PASS
  - `npm run build` -> PASS
  - `npm test -- --runInBand src/auth/guards/access-control.guards.spec.ts src/clients/services/client.service.spec.ts src/cases/services/case.service.spec.ts` -> PASS
  - `npm test -- --runInBand src/auth/guards/access-control.guards.spec.ts src/clients/services/client.service.spec.ts src/cases/services/case.service.spec.ts src/common/interceptors/rls.interceptor.spec.ts src/auth/services/auth.service.spec.ts src/auth/services/audit.service.spec.ts src/database/migrations/harden-postgres-rls-policies.spec.ts` -> PARTIAL
    - PostgreSQL suite skips without `RLS_TEST_DATABASE_URL`
  - `RLS_TEST_DATABASE_URL='postgresql://postgres@127.0.0.1:55432/postgres' npm test -- --runInBand src/database/migrations/harden-postgres-rls-policies.spec.ts` -> PASS
- Remaining risk:
  - full `npm test -- --runInBand` was not rerun after this pass
  - live external trust-provider integrations and launch-rehearsal/monitoring evidence remain open

### 2026-03-09 Access-Token Revocation + Auth Perimeter Hardening

- Added DB-backed access-token revocation in:
  - `src/database/entities/RevokedAccessToken.entity.ts`
  - `src/database/migrations/1710200000000-AddAccessTokenRevocation.ts`
- Extended user auth state in:
  - `src/database/entities/User.entity.ts`
  - new `sessionInvalidBefore` timestamp supports immediate bulk session invalidation
- Updated auth flows in:
  - `src/auth/services/auth.service.ts`
  - logout now revokes the current access token JTI and optional refresh token
  - logout-all and password reset now invalidate all active sessions immediately and revoke outstanding refresh tokens
- Hardened JWT enforcement in:
  - `src/auth/strategies/jwt.strategy.ts`
  - revoked access tokens are rejected
  - tokens issued before `sessionInvalidBefore` or `lastPasswordChangeAt` are rejected
  - organization suspension/deletion now blocks access even if the user record is still active
- Tightened browser/API perimeter in:
  - `src/main.ts`
  - CORS credentials are now disabled because the platform uses bearer tokens, not cookie auth
- Added Redis-backed throttling for production deployments in:
  - `src/common/security/redis-throttler.storage.ts`
  - `src/app.module.ts`
  - `src/common/config/environment.validator.ts`
  - production startup now requires Redis-backed throttling to stay enabled/configured
- Added coverage in:
  - `src/auth/services/auth.service.spec.ts`
  - `src/auth/strategies/jwt.strategy.spec.ts`
  - `src/common/security/redis-throttler.storage.spec.ts`
- Validation:
  - `npm run lint` -> PASS
  - `npm run build` -> PASS
  - `npm test -- --runInBand src/common/security/redis-throttler.storage.spec.ts src/auth/services/auth.service.spec.ts src/auth/strategies/jwt.strategy.spec.ts src/auth/guards/access-control.guards.spec.ts src/common/interceptors/rls.interceptor.spec.ts src/auth/services/audit.service.spec.ts` -> PASS
  - `RLS_TEST_DATABASE_URL='postgresql://postgres@127.0.0.1:55432/postgres' npm test -- --runInBand src/database/migrations/harden-postgres-rls-policies.spec.ts` -> PASS
- Remaining risk:
  - full `npm test -- --runInBand` was not rerun after this pass
  - At that point, Conversation 3 was complete and searchable-PII handling remained the next blocker; that gap is now closed in the later Conversation 4 completion pass

### 2026-03-09 Schema Debt + Soft-Delete Index Hardening

- Added invitation soft-delete support in:
  - `src/database/entities/Invitation.entity.ts`
  - `src/database/migrations/1710600000000-HardenSoftDeleteIndexesAndInvitations.ts`
- Added PostgreSQL partial indexes for hot active-record paths across:
  - `invitations`
  - `cases`
  - `clients`
  - `documents`
  - `events`
  - `invoices`
  - `calculations`
  - `notifications`
  - `pricelists`
  - `pricelist_categories`
  - `pricelist_items`
- Added migration contract coverage in:
  - `src/database/migrations/harden-soft-delete-indexes-and-invitations.spec.ts`
- Validation:
  - `npm run lint` -> PASS
  - `npm run build` -> PASS
  - `npm test -- --runInBand src/database/migrations/harden-soft-delete-indexes-and-invitations.spec.ts` -> PASS
- Explicit limitation:
  - full backend test sweep and live PostgreSQL migration rehearsal were not rerun in this pass
- Completion status:
- Conversation 9 is now complete; the ordered conversation queue is exhausted, and remaining blockers are live trust-provider integrations plus staging/ops drills.

### 2026-03-09 File Security + Malware Scanning Completion

- Added persistent malware scan records in:
  - `src/database/entities/FileScanRecord.entity.ts`
  - `src/database/migrations/1710500000000-AddMalwareScanningWorkflow.ts`
- Added scanner and scan orchestration services in:
  - `src/file-storage/services/malware-scanner.service.ts`
  - `src/file-storage/services/file-scan.service.ts`
  - `src/file-storage/services/file-storage.service.ts`
- Extended document visibility with operator-facing malware scan state in:
  - `src/database/entities/Document.entity.ts`
  - `src/documents/dto/document.dto.ts`
  - `src/documents/services/document.service.ts`
- Runtime behavior:
  - uploads now create pending scan records
  - signed URLs and direct file downloads are blocked until scan status is `clean`
  - infected or failed scans remain blocked and emit audit events
  - command-based ClamAV integration path exists; local/test mode uses deterministic stub scanning with EICAR detection
- Validation:
  - `npm run lint` -> PASS
  - `npm run build` -> PASS
  - `npm test -- --runInBand src/file-storage/services/malware-scanner.service.spec.ts src/file-storage/services/file-scan.service.spec.ts src/file-storage/services/file-storage.service.spec.ts` -> PASS
- Explicit limitation:
  - production still needs a real scanner deployment/runbook even though the backend lifecycle and blocking logic are now live
- Completion status:
  - Conversation 6 is now complete; that blocker was closed in the later Conversation 7 pass

### 2026-03-09 Trust Verification Workflow + Worker Completion

- Added provider-neutral verification orchestration and worker in:
  - `src/trust-verification/services/trust-verification.service.ts`
  - `src/trust-verification/services/trust-verification-worker.service.ts`
  - `src/trust-verification/services/trust-provider.adapters.ts`
  - `src/trust-verification/services/trust-provider.registry.ts`
- Added API surface in:
  - `src/trust-verification/controllers/trust-verification.controller.ts`
  - `src/trust-verification/trust-verification.module.ts`
- Added persistent verification jobs in:
  - `src/database/entities/TrustVerificationJob.entity.ts`
  - `src/database/migrations/1710400000000-AddTrustVerificationWorkflow.ts`
- Extended `user_identities` and `document_signatures` with verification attempts, next-check scheduling, last-error, and external verification references
- Runtime behavior:
  - identity verification requests now enqueue persistent jobs
  - document signatures now start as `pending` and move through verify / retry / revoked / recheck states
  - provider callbacks are accepted asynchronously and converted into persistent jobs before state mutation
  - audit events are emitted for request, callback, retry, completion, and revocation milestones
- Validation:
  - `npm run lint` -> PASS
  - `npm run build` -> PASS
  - `npm test -- --runInBand src/trust-verification/services/trust-verification.service.spec.ts src/trust-verification/services/trust-verification-worker.service.spec.ts` -> PASS
- Explicit limitation:
  - adapters for `acsk`, `diia`, and `bankid_nbu` are wired and directly implementable, but still operate in provider-stub mode until live upstream integrations are added
- Completion status:
  - Conversation 5 is now complete; that blocker was closed in the later Conversation 6 pass

### 2026-03-09 PII Encryption + Log Redaction Completion

- Added shared PII protection helpers in:
  - `src/common/security/pii-protection.ts`
- Current encrypted-at-rest coverage:
  - `organizations.taxNumber`
  - `organizations.address`
  - `organizations.phone`
  - `organizations.email`
  - `users.phone`
  - `users.mfaSecret`
  - `users.barNumber`
  - `users.email`
  - `clients.email`
  - `clients.phone`
  - `clients.edrpou`
  - `clients.inn`
  - `clients.secondaryPhone`
  - `clients.address`
  - `clients.postalCode`
  - `clients.passportNumber`
  - `clients.notes`
- Added migration/backfill path:
  - `src/database/migrations/1710300000000-EncryptSensitivePiiFields.ts`
  - `src/database/migrations/1710310000000-EncryptSearchablePiiWithBlindIndexes.ts`
- Added recursive PII redaction in:
  - `src/auth/services/audit.service.ts`
  - `src/common/logging/logger.config.ts`
- Added blind-index backed searchable-PII support in:
  - `src/auth/services/auth.service.ts`
  - `src/auth/services/organization.service.ts`
  - `src/clients/services/client.service.ts`
- Added coverage in:
  - `src/common/security/pii-protection.spec.ts`
  - `src/auth/services/audit.service.spec.ts`
  - `src/auth/services/auth.service.spec.ts`
  - `src/clients/services/client.service.spec.ts`
- Validation:
  - `npm run lint` -> PASS
  - `npm run build` -> PASS
  - `npm test -- --runInBand src/common/security/pii-protection.spec.ts src/auth/services/auth.service.spec.ts src/clients/services/client.service.spec.ts src/auth/services/audit.service.spec.ts` -> PASS
- Searchability decision:
  - searchable PII now uses exact-match blind indexes; plaintext storage is removed for those fields
  - fuzzy/substring search remains supported only for non-sensitive name/company fields
- Completion status:
  - Conversation 4 is now complete; that blocker was closed in the later Conversation 5 pass

### 2026-03-09 Security Status Reconciliation + Runtime Hardening

- Corrected contradictory readiness/security claims across:
  - `docs/PRODUCTION_READINESS_REPORT.md`
  - `docs/SECURITY_AUDIT_REPORT.md`
  - `docs/SECURITY.md`
  - `CLAUDE.md`
- Enabled backend runtime security headers with:
  - `helmet` in `src/main.ts`
- Tightened production startup validation in:
  - `src/common/config/environment.validator.ts`
  - `ALLOWED_ORIGINS` is now required in production
- Hardened JWT validation in:
  - `src/auth/strategies/jwt.strategy.ts`
  - current `role`, `subscriptionPlan`, and `email` are loaded from DB
  - access tokens issued before the last password change are rejected
- Added tests in:
  - `src/auth/strategies/jwt.strategy.spec.ts`
- Validation:
  - `npm run lint` -> PASS
  - `npm test -- --runInBand` -> PARTIAL
    - 89/91 tests passed
    - existing unrelated failure remains in `src/clients/services/client.service.spec.ts`
  - `npm run build` -> PASS
- Remaining risk:
  - this pass corrected status and tightened a few auth/runtime gaps, but did not implement RLS, declarative RBAC, subscription quotas, CSRF, distributed rate limiting, PII encryption, trust-provider verification, or malware scanning

### 2026-03-09 Agent Execution Checklist + Ordered Conversation Queue

- Added canonical remaining-work checklist and session order in:
  - `docs/AGENT_EXECUTION_CHECKLIST.md`
- The checklist now defines the default conversation order for future non-trivial agent work:
  - status reconciliation
  - RLS hardening
  - RBAC + subscription enforcement
  - token revocation + auth hardening
  - PII encryption
  - trust-provider verification
  - file malware scanning
  - schema/performance hardening
  - monitoring + launch rehearsal
  - frontend QA
- Updated `CLAUDE.md` and this cache so future sessions treat the checklist as the canonical ordered backlog unless the user reprioritizes.
- Validation:
  - docs-only change; no lint/test/build commands were run
- Remaining risk:
  - the checklist only stays reliable if each future session updates status, blockers, and verification results immediately after landing work

### 2026-03-09 Pricelist Currency Label Update

- Updated pricelist UI currency display from `UAH` to `грн` in:
  - `src/frontend/pages/pricelists/PricelistsPage.tsx`
  - `src/frontend/pages/pricelists/PricelistDetailsPage.tsx`
  - `src/frontend/pages/pricelists/PricelistEditorPage.tsx`
- Scope:
  - display-only label change in the frontend
  - backend/API/internal currency code remains `UAH` for data compatibility
- Validation:
  - `npm run build:frontend` -> PASS

### 2026-03-09 Registry Workspace Minimalism Pass

- Removed non-functional hero/stat/registry promo sections from the main frontend workspaces:
  - `src/frontend/pages/dashboard/DashboardPage.tsx`
  - `src/frontend/pages/clients/ClientsPage.tsx`
  - `src/frontend/pages/cases/CasesPage.tsx`
  - `src/frontend/pages/documents/DocumentsPage.tsx`
- Deleted the matching decorative CSS and flattened the shells to a simpler white registry/table presentation in:
  - `src/frontend/pages/dashboard/DashboardPage.css`
  - `src/frontend/pages/clients/ClientsPage.css`
  - `src/frontend/pages/cases/CasesPage.css`
  - `src/frontend/pages/documents/DocumentsPage.css`
- UX effect:
  - the user lands directly in filters + table/work widgets instead of stacked KPI cards
  - documents no longer show the extra context promo banner above the registry
  - hover/fill treatment is lighter and closer to classic ERP/CRM density
- Validation:
  - `npm run build:frontend` -> PASS
- Remaining risk:
  - no manual browser QA has been rerun yet after this simplification pass, so spacing should still be spot-checked on desktop and mobile.

### 2026-03-09 Pricelist Density Compaction

- Reworked pricelist UI density in:
  - `src/frontend/pages/pricelists/PricelistsPage.css`
- Goal:
  - move both constructor and view mode closer to ERP/CRM registry density
  - reduce oversized vertical whitespace in category groups, rows, and summary blocks
- Changes:
  - compacted category card padding and nesting offsets
  - reduced item row height and internal gaps
  - reduced summary-card height and type scale
  - tightened preview/view group headers and service rows
  - reduced drag-and-drop drop-zone height so tree editing no longer inflates the page
- Validation:
  - `npm run build:frontend` -> PASS
- Remaining risk:
  - no manual browser QA was run yet with real long nested pricelists

### 2026-03-09 Public Landing + Remember-Me Session Split

- Added a new public landing page and changed `/` to the unauthenticated product entry point:
  - `src/frontend/pages/landing/LandingPage.tsx`
  - `src/frontend/pages/landing/LandingPage.css`
- Updated routing in `src/frontend/App.tsx` so:
  - unauthenticated visitors land on the marketing/presentation page first
  - authenticated visitors hitting `/`, `/login`, or `/register` are redirected straight to `/dashboard`
- Implemented real remember-me behavior with centralized frontend auth storage:
  - `src/frontend/services/auth-storage.ts`
  - remembered sessions persist in `localStorage`
  - non-remembered sessions persist only in `sessionStorage`
- Updated all frontend auth/session readers to use the shared storage abstraction:
  - `src/frontend/services/auth.service.ts`
  - `src/frontend/services/api.ts`
  - `src/frontend/services/logger.service.ts`
  - `src/frontend/store/auth.slice.ts`
  - `src/frontend/hooks/useAuth.ts`
- Validation:
  - `npm run build:frontend` -> PASS
- Remaining risk:
  - no manual browser QA was run for the landing page on mobile or narrow laptop widths
  - registration still creates a non-persistent auto-login session; persistent next-visit dashboard redirect depends on the explicit remember-me login path

### 2026-03-09 Landing Copy + Pricing Block Refresh

- Reworked landing messaging to describe the actual product more clearly:
  - legal CRM for clients, cases, documents, deadlines, and calendar
  - product fit for solo lawyers and legal companies
  - more explicit registration-focused CTA language
- Added a dedicated pricing section in:
  - `src/frontend/pages/landing/LandingPage.tsx`
  - `src/frontend/pages/landing/LandingPage.css`
- Tariff copy now presents:
  - Free -> up to 1 client and 3 cases
  - Pro -> `299 грн/місяць`
  - Corporate -> `499 грн` first account + `199 грн` each additional account, pooled accounts, admin panel, and access separation
- Validation:
  - `npm run build:frontend` -> PASS
- Remaining risk:
  - pricing is marketing-only in the landing layer; no backend subscription enforcement or checkout behavior changed
  - wording has not yet been reviewed against final commercial/legal approval

### 2026-03-09 Full Landing Redesign

- Rebuilt the landing page after desktop visual review in:
  - `src/frontend/pages/landing/LandingPage.tsx`
  - `src/frontend/pages/landing/LandingPage.css`
- Replaced the previous monotone repeated-card layout with a fuller conversion-oriented structure:
  - stronger hero copy
  - product-preview mock panel
  - metrics strip
  - problem framing section
  - expanded feature section
  - pricing cards
  - pricing comparison table
  - FAQ
  - final CTA
- Removed the prior `Як це працює` section because it described route mechanics rather than user value and weakened the page
- Validation:
  - `npm run build:frontend` -> PASS
- Remaining risk:
  - no manual browser QA was run for desktop/mobile after the redesign
  - final commercial tone and copy still need product-owner approval

### 2026-03-09 Landing Art Direction Polish

- Added a second landing polish pass in:
  - `src/frontend/pages/landing/LandingPage.tsx`
  - `src/frontend/pages/landing/LandingPage.css`
- Refinements include:
  - landing-specific typography stack
  - more editorial hero styling
  - hero scenario pills
  - pricing intro paragraph
  - highlighted preview ribbon for the Pro plan
  - softer hover/elevation behavior for key cards
  - stronger supporting copy in the final CTA
- Validation:
  - `npm run build:frontend` -> PASS
- Remaining risk:
  - polish is still limited to the public landing and does not visually rework the authenticated app shell
  - no screenshot-based QA was rerun in this pass

### 2026-03-09 Auth + Dashboard Continuity Pass

- Reworked auth entry surfaces to better match the landing:
  - `src/frontend/pages/auth/LoginPage.tsx`
  - `src/frontend/pages/auth/LoginPage.css`
  - `src/frontend/pages/auth/RegisterPage.tsx`
  - `src/frontend/pages/auth/RegisterPage.css`
- Login/register now include split layouts with premium editorial showcase panels instead of plain centered cards
- Added a new top hero surface to the dashboard in:
  - `src/frontend/pages/dashboard/DashboardPage.tsx`
  - `src/frontend/pages/dashboard/DashboardPage.css`
- The dashboard opening state now includes:
  - greeting copy
  - organization-aware summary
  - compact top metrics before the main widgets
- Validation:
  - `npm run build:frontend` -> PASS
- Remaining risk:
  - broader authenticated pages still need a later visual consistency pass
  - no manual browser QA was run after this auth/dashboard polish

### 2026-03-09 Registry Workspace Continuity Pass

- Reworked the main registry workspaces in:
  - `src/frontend/pages/clients/ClientsPage.tsx`
  - `src/frontend/pages/clients/ClientsPage.css`
  - `src/frontend/pages/cases/CasesPage.tsx`
  - `src/frontend/pages/cases/CasesPage.css`
  - `src/frontend/pages/documents/DocumentsPage.tsx`
  - `src/frontend/pages/documents/DocumentsPage.css`
- Added summary strips and registry-head sections above the main tables so these pages read more like workspaces and less like flat tables
- Updated page-header subtitles to better explain the role of each screen
- Validation:
  - `npm run build:frontend` -> PASS
- Remaining risk:
  - other authenticated modules still need similar continuity treatment
  - no manual browser QA was run after the registry redesign

### 2026-03-09 MacBook-First CRM Registry Redesign

- Reworked the shared frontend shell to reduce scroll pressure on laptop-height viewports:
  - smaller sidebar and top bar
  - smaller shared spacing scale and control heights
  - sans-serif-first typography with more compact headings
  - wider content area and denser registry surfaces
  - colder CRM/ERP palette instead of warm beige/gold surfaces
- Updated shared styling files:
  - `src/frontend/index.css`
  - `src/frontend/App.css`
  - `src/frontend/components/PageHeader.css`
  - `src/frontend/components/navigation/Navigation.css`
- Reframed the main operational pages around CRM-like registries instead of presentation-style blocks:
  - `src/frontend/pages/dashboard/DashboardPage.css`
  - `src/frontend/pages/clients/ClientsPage.tsx`
  - `src/frontend/pages/clients/ClientsPage.css`
  - `src/frontend/pages/cases/CasesPage.tsx`
  - `src/frontend/pages/cases/CasesPage.css`
  - `src/frontend/pages/documents/DocumentsPage.tsx`
  - `src/frontend/pages/documents/DocumentsPage.css`
- Page-level UX changes:
  - KPI strips moved above registries to expose key counts immediately
  - filter controls grouped into compact toolbars
  - table/list rows tightened to show more records per screen
  - dashboard widgets compressed into a more operational command-center layout
- Same-day corrective follow-up after user review:
  - KPI strips were removed from clients/cases/documents because they still created too much vertical noise
  - palette was moved toward dark navy + white + blue-gray + restrained blue accent, closer to AvadaCRM-style CRM products
  - font system was hard-fixed to `Golos Text` only
  - shared typography/control tokens were expanded so date labels, section titles, and form fields align to one scale
- Validation:
  - `npm run lint` -> PASS
  - `npm run build:frontend` -> PASS
- Remaining risk:
  - no manual browser QA was run on the user’s actual MacBook after the redesign
  - lower-priority pages still contain legacy CSS and may feel visually looser than the new registry pages
  - the current font choice is loaded from Google Fonts; self-hosting may be required later for production/privacy constraints

### 2026-03-08 Pricelists Module Rebuild

- Replaced the old `Прайс-лист` analytics placeholder page with a real frontend pricelists module:
  - registry/list view with active and archive tabs
  - route-backed add/edit/details flows
  - grouped category/service editing with inline preview
  - list-level actions for view, edit, duplicate, archive/restore, delete
- New frontend files:
  - `src/frontend/pages/pricelists/PricelistsPage.tsx`
  - `src/frontend/pages/pricelists/PricelistEditorPage.tsx`
  - `src/frontend/pages/pricelists/PricelistDetailsPage.tsx`
  - `src/frontend/pages/pricelists/PricelistsPage.css`
  - `src/frontend/services/pricelist.service.ts`
  - `src/frontend/types/pricelist.types.ts`
- Updated route/breadcrumb wiring:
  - `src/frontend/App.tsx`
  - `src/frontend/components/navigation/Breadcrumbs.tsx`
- Expanded backend pricelist DTO/controller/service support so the UI can persist richer item settings and metadata:
  - `src/pricelists/dto/pricelist.dto.ts`
  - `src/pricelists/services/pricelist.service.ts`
  - `src/pricelists/controllers/pricelist.controller.ts`
- Validation:
  - `npm run build:frontend` -> PASS
  - `npm run build` -> PASS
- Remaining risk:
  - no manual browser QA was run for the new pricelist flows
  - drag-and-drop ordering is still not implemented
  - archive UX depends on soft status changes; hard-deleted pricelists do not appear in the archive tab

### 2026-03-09 Pricelist Tree Structure Upgrade

- Upgraded the pricelist editor from a flat category list to a tree structure:
  - each category now exposes `Створити підкатегорію`
  - each category now exposes `Створити послугу`
  - subcategories can be nested recursively
- Updated files:
  - `src/frontend/pages/pricelists/PricelistEditorPage.tsx`
  - `src/frontend/pages/pricelists/PricelistDetailsPage.tsx`
  - `src/frontend/pages/pricelists/PricelistsPage.css`
- Persistence model:
  - added real backend category entity `src/database/entities/PricelistCategory.entity.ts`
  - added migration `src/database/migrations/1710000000000-AddPricelistCategories.ts`
  - frontend now syncs category CRUD through dedicated pricelist category endpoints
  - nested category paths are still serialized into item `category` and `metadata.categoryPath` for compatibility
  - details and preview now prefer the persisted backend tree and fall back to item paths only when needed
- Validation:
  - `npm run build:frontend` -> PASS
  - `npm run build` -> PASS
- Remaining risk:
  - no automated frontend interaction tests were added yet for drag-and-drop

### 2026-03-09 Pricelist Tree Drag-and-Drop + Category Tree Tests

- Added drag-and-drop sorting for pricelist category trees in:
  - `src/frontend/pages/pricelists/PricelistEditorPage.tsx`
  - `src/frontend/pages/pricelists/PricelistsPage.css`
- Supported interactions:
  - move category before another category
  - move category after another category
  - move category inside another category as a child
- Category order is now persisted via sibling-level `displayOrder` values during save
- Refactored duplication logic into the service for direct business-logic testing:
  - `src/pricelists/services/pricelist.service.ts`
  - `src/pricelists/controllers/pricelist.controller.ts`
- Added automated tests:
  - `src/pricelists/services/pricelist.service.spec.ts`
  - recursive soft delete of descendants
  - duplication of nested category trees with parent-id remapping
- Validation:
  - `npm test -- --runInBand src/pricelists/services/pricelist.service.spec.ts` -> PASS (2/2)
  - `npm run build:frontend` -> PASS
  - `npm run build` -> PASS
- Remaining risk:
  - drag-and-drop currently covers category tree nodes, but not separate drag sorting for service rows inside a category
  - no browser QA was run for drag-and-drop on touch devices

### 2026-03-08 Global Frontend Visual Density Reduction

- Reworked shared shell density and premium styling in:
  - `src/frontend/App.tsx`
  - `src/frontend/App.css`
  - `src/frontend/index.css`
  - `src/frontend/components/navigation/Navigation.css`
  - `src/frontend/components/PageHeader.css`
  - `src/frontend/pages/workspace/WorkspacePage.css`
- Product-level UI direction is now more explicitly:
  - content-first
  - lower vertical chrome
  - lighter premium legal surfaces instead of large boxed hero blocks
- Shared changes now reduce visual noise across the product by:
  - narrowing sidebar and collapsed rail widths
  - reducing top bar height
  - centering all page content within a shared max-width
  - simplifying shared page headers
  - softening card/panel/list surfaces
- Reworked highest-visibility screens to align with the new system:
  - `src/frontend/pages/calendar/CalendarPage.tsx`
  - `src/frontend/pages/calendar/CalendarPage.css`
  - `src/frontend/pages/dashboard/DashboardPage.tsx`
  - `src/frontend/pages/dashboard/DashboardPage.css`
- Calendar top section no longer behaves like a redundant hero banner; the main controls and actual calendar content are now visible earlier in the viewport
- Validation:
  - `npm run build:frontend` -> PASS
- Remaining risk:
  - no manual browser QA was run after the shell/header/surface changes
  - multiple older page-specific CSS files still need a second consistency pass to fully match the lighter premium direction

### 2026-03-08 Top Bar Quick Action Removal

- Removed the shell header create buttons:
  - `Додати клієнта`
  - `Додати справу`
- Updated files:
  - `src/frontend/components/navigation/Navigation.tsx`
  - `src/frontend/components/navigation/Navigation.css`
- UX direction for next iteration:
  - creation should start from the relevant page context
  - clients should lead into related case creation
  - cases should lead into file/document/calendar/note follow-up actions
- Validation:
  - `npm run build:frontend` -> PASS
- Remaining risk:
  - the contextual post-create recommendation flows are still not implemented

### 2026-03-08 Calendar Header Cleanup + Add Event Entry Point

- Removed the duplicate top-level calendar hero/header so the page keeps only the main in-workspace heading block
- Moved `Оновити` into the calendar controls area above the global search field
- Added a new primary `Додати подію` action next to refresh inside the same controls cluster
- Added a minimal route-backed create-event page and wired `/events/add`
- Updated files:
  - `src/frontend/pages/calendar/CalendarPage.tsx`
  - `src/frontend/pages/calendar/CalendarPage.css`
  - `src/frontend/pages/events/AddEventPage.tsx`
  - `src/frontend/pages/events/AddEventPage.css`
  - `src/frontend/services/event.service.ts`
  - `src/frontend/types/event.types.ts`
  - `src/frontend/App.tsx`
- Validation:
  - `npm run build:frontend` -> PASS
- Remaining risk:
  - no manual browser QA was run for the updated calendar layout or add-event flow
  - create-event page is intentionally minimal and does not yet include rich case lookup or edit mode

### 2026-03-08 Clients/Cases Filter Repair

- `Мої клієнти` and `Мої справи` now have active date-range filters using the shared registry-style range picker:
  - clients -> `createdAtFrom` / `createdAtTo`
  - cases -> `startDateFrom` / `startDateTo`
- Both pages now include explicit reset actions that preserve route defaults such as `status` and `clientId`
- Text search coverage was widened to align with real operator expectations instead of a narrow subset of fields:
  - clients now match full personal name, company, phone, email, EDRPOU, INN, and generated client number
  - cases now match internal number, registry number, parties, court/judge fields, and linked client names
- Updated files:
  - `src/frontend/pages/clients/ClientsPage.tsx`
  - `src/frontend/pages/clients/ClientsPage.css`
  - `src/frontend/pages/cases/CasesPage.tsx`
  - `src/frontend/pages/cases/CasesPage.css`
  - `src/clients/services/client.service.ts`
  - `src/cases/services/case.service.ts`
- Remaining risk:
  - no manual browser QA was run for the new list filters
  - the targeted client-service spec still fails in an existing statistics mock path unrelated to filtering

## Earlier Changes

### 2026-03-08 Calendar Workspace Rebuild

- Replaced the old calendar timeline with a React version of the supplied sample calendar in:
  - `src/frontend/pages/calendar/CalendarPage.tsx`
  - `src/frontend/pages/calendar/CalendarPage.css`
- Added frontend event API integration:
  - `src/frontend/services/event.service.ts`
  - `src/frontend/types/event.types.ts`
- Calendar now matches the sample structure with:
  - `day`
  - `week`
  - `month`
  - `year`
- Added sample-aligned behaviors:
  - global search
  - separate day-tab search
  - date selectors in the day tab
  - week/month filtered event lists
  - week/month pagination and page-size controls
  - event detail modal
- Current data source is `/events/calendar` only, to keep the page behavior aligned with the reference implementation
- Validation:
  - `npm run build:frontend` -> PASS
- Remaining risk:
  - no manual browser QA was run for calendar behavior on desktop/mobile
  - calendar UI currently does not create or edit events
  - several modal fields are mapped from the closest available backend event fields rather than exact sample-specific properties

### 2026-03-08 Client/Case Archiving + Firebase Navigation Alignment

- Added real archived-status support for clients across backend/entity/DTO/frontend types:
  - `src/database/entities/Client.entity.ts`
  - `src/clients/dto/client.dto.ts`
  - `src/clients/services/client.service.ts`
  - `src/frontend/types/client.types.ts`
  - `src/frontend/utils/clientFormData.ts`
- Added `Архівувати` actions into the `Дії` column for:
  - `src/frontend/pages/clients/ClientsPage.tsx`
  - `src/frontend/pages/cases/CasesPage.tsx`
- Clients and cases list pages now accept `status` from query params, which is used by the new archive view links
- Added new route-backed workspace pages:
  - `src/frontend/pages/notes/NotesPage.tsx`
  - `src/frontend/pages/archive/ArchivePage.tsx`
- Reordered sidebar/mobile navigation to the Firebase Studio-inspired sequence requested by the user and renamed linked surfaces to match:
  - `Файли` for `/documents`
  - `Конструктор шаблонів` for `/print-forms`
  - `Нотатки` for `/notes`
  - `Архів` for `/archive`
- Updated route wiring and breadcrumbs in:
  - `src/frontend/App.tsx`
  - `src/frontend/components/navigation/Navigation.tsx`
  - `src/frontend/components/navigation/Breadcrumbs.tsx`
  - `src/frontend/pages/documents/DocumentsPage.tsx`
  - `src/frontend/pages/print-forms/PrintFormsPage.tsx`
- Validation:
  - `npm run build` -> PASS
  - `npm run build:frontend` -> PASS
- Remaining risk:
- no manual browser QA was run after the navigation realignment and archive additions

### 2026-03-08 Compact Shell Pass

- Reworked sidebar shell in:
  - `src/frontend/components/navigation/Navigation.tsx`
  - `src/frontend/components/navigation/Navigation.css`
- Removed the old decorative sidebar collapse rail and replaced it with a compact header-level desktop-style collapse button
- Tightened shell density:
  - sidebar width `17.5rem -> 15.25rem`
  - collapsed sidebar width `5.75rem -> 4.75rem`
  - top bar height `4.75rem -> 4.15rem`
  - denser nav rows, badges, quick actions, notification chip, and user menu chip
- Tightened global controls in:
  - `src/frontend/index.css`
  - `src/frontend/App.css`
  - `src/frontend/App.tsx`
- Buttons and inputs now use smaller heights, reduced padding, lower radii, and lighter shadows to reduce visual puffiness and return focus to content
- Validation:
  - `npm run build:frontend` -> PASS
- Remaining risk:
  - manual browser QA is still needed on major pages because some older local page styles may now feel visually looser relative to the tighter shell

### 2026-03-08 Frontend Design System Baseline

- Added canonical frontend style guide:
  - `docs/FRONTEND_DESIGN_SYSTEM.md`
- Official direction is now:
  - `Calm Premium Legal Compact`
- `src/frontend/index.css` now acts as the shared token source for:
  - typography scale
  - semantic colors
  - spacing scale
  - control heights
  - radii
  - shadow tiers
- Aligned shared components to those tokens:
  - `src/frontend/components/navigation/Navigation.css`
  - `src/frontend/components/PageHeader.css`
  - `src/frontend/components/FormActionBar.css`
  - `src/frontend/components/RegistrySearchOverlay.css`
- Audit finding:
  - multiple legacy page CSS files still contain hardcoded blue/purple gradients, unrelated palettes, and ad-hoc font sizes
  - these files are now explicit migration debt, not valid style references for new work
- Validation:
  - `npm run build:frontend` -> PASS

### 2026-03-09 Collapsed Sidebar Geometry Fix

- Fixed the collapsed sidebar header so the collapse button no longer overlaps or visually blocks the logo
- In collapsed mode:
  - sidebar header now stacks logo and collapse control vertically
  - collapsed nav items center icons without asymmetric horizontal padding
  - outer sidebar padding and right-side visual divider were aligned to the same inset as the left edge
- Updated:
  - `src/frontend/components/navigation/Navigation.css`
- Validation:
  - `npm run build:frontend` -> PASS

### 2026-03-09 Collapsed Sidebar Polish + Color Audit Hardening

- Further refined collapsed desktop sidebar in:
  - `src/frontend/components/navigation/Navigation.css`
- Changes:
  - reduced collapsed header and toggle footprint
  - reduced collapsed nav row height
  - made active state lighter so collapsed icons feel less massive
  - moved sidebar interaction colors onto semantic tokens in `src/frontend/index.css`
- Added hard palette policy and deprecated color families to:
  - `docs/FRONTEND_DESIGN_SYSTEM.md`
- Added legacy drift inventory:
  - `docs/FRONTEND_COLOR_AUDIT.md`
- Audit result:
  - shared shell now follows the `Compact Legal CRM` palette consistently
  - remaining drift is concentrated in page-level CSS such as onboarding, billing, profile, auth, clients, cases, documents, dashboard, and calendar
- Validation:
  - `npm run build:frontend` -> PASS
  - no manual browser QA was run for the archive actions, archive hub page, or revised menu ordering
  - `Нотатки` currently surfaces existing client/case note fields rather than a standalone note-editor module

### 2026-03-08 Cases Registry Column + Client View/Edit Split

- Updated `src/frontend/pages/cases/CasesPage.tsx` so the second column on `Мої справи` now shows `Номер справи в реєстрі` instead of the more verbose case-title cell
- The cases list now renders `registryCaseNumber` in that column and falls back to `Не вказано` when the registry number is missing
- Reworked `src/frontend/pages/clients/ClientDetailsPage.tsx` and `src/frontend/pages/clients/ClientDetailsPage.css` so client cards open in read-only mode first
- Added a dedicated `Редагувати` button that switches the client page into editable form mode and returns to the display view after save/cancel
- Added structured read-only client info sections for summary, type-specific fields, contacts, addresses, and banking details
- Validation:
  - `npm run build:frontend` -> PASS
- Remaining risk:
  - no manual browser QA was run in this session, so the new read-only client layout and the registry-number column should still be checked with realistic seeded data
### 2026-03-08 Workspace Cleanup

- Confirmed the only active frontend source tree is `src/frontend`
- Confirmed:
  - `index.html` loads `/src/frontend/index.tsx`
  - `tsconfig.frontend.json` includes `src/frontend/**/*`
  - `vite.config.ts` builds to `dist/frontend`
  - `Dockerfile.frontend` copies `/app/dist/frontend`
- Removed:
  - legacy root-level `frontend` symlink alias to `src/frontend`
  - unused empty root-level `storage/` directory
- Retained intentionally:
  - `dist/frontend` as generated build output
  - `uploads/` as runtime file storage
  - `logs/` as logger output
  - `court_stan/` as local court-registry dataset
  - `database/` and `figma/` as project assets/docs inputs
- Validation:
  - `npm run build:frontend` -> PASS
- Remaining risk:
  - older notes in this file and in `CLAUDE.md` may still mention `frontend/...` as a historical alias path
### 2026-03-08 Responsive Layout Hardening

- Hardened shell overflow behavior in:
  - `src/frontend/App.css`
  - `frontend/App.css`
  - `src/frontend/index.css`
  - `frontend/index.css`
- Core list pages no longer force horizontal scrolling on mobile:
  - `Мої справи`
  - `Мої клієнти`
  - `Документи`
- Updated files:
  - `src/frontend/pages/cases/CasesPage.tsx`
  - `src/frontend/pages/cases/CasesPage.css`
  - `frontend/pages/cases/CasesPage.tsx`
  - `frontend/pages/cases/CasesPage.css`
  - `src/frontend/pages/clients/ClientsPage.tsx`
  - `src/frontend/pages/clients/ClientsPage.css`
  - `frontend/pages/clients/ClientsPage.tsx`
  - `frontend/pages/clients/ClientsPage.css`
  - `src/frontend/pages/documents/DocumentsPage.tsx`
  - `src/frontend/pages/documents/DocumentsPage.css`
  - `frontend/pages/documents/DocumentsPage.tsx`
  - `frontend/pages/documents/DocumentsPage.css`
- Mobile tables now render as stacked cards with field labels instead of enforcing wide `min-width` tables
- Validation:
  - `npm run build:frontend` -> PASS
- Remaining risk:
  - the current pass focused on core list pages and shell overflow; additional legacy pages may still need targeted responsive cleanup after manual mobile QA

### Cases List UI Alignment

- Reworked the `Мої справи` page to match the `Мої клієнти` table-driven interaction pattern:
  - `src/frontend/pages/cases/CasesPage.tsx`
  - `src/frontend/pages/cases/CasesPage.css`
  - `frontend/pages/cases/CasesPage.tsx`
  - `frontend/pages/cases/CasesPage.css`
- Removed the oversized stacked case-card rendering that produced inconsistent layout and action grouping
- Cases now render in a compact table with:
  - case number
  - case title/type
  - client link
  - court name
  - inline status selector
  - priority badge
  - next hearing/deadline summary
  - compact action icons for timeline, details, documents, and delete
- Empty state now differentiates between:
  - no cases in general
  - no cases for a selected `clientId`
- Validation:
  - `npm run build:frontend` -> PASS
- Remaining risk:
  - this session did not include manual browser QA, so visual fit should still be confirmed against real case data

### Project Logo Replacement

- Replaced placeholder logo rendering with the user-provided SVG asset:
  - `src/frontend/assets/project-logo.svg`
- Shared logo rendering now comes from the SVG asset instead of generated `LO / LAW ORGANIZER` placeholder markup, with a compact one-line icon+name layout:
  - `src/frontend/common/Logo.tsx`
  - `src/frontend/common/Logo.css`
- Sidebar header now uses the shared logo component instead of the `⚖️` emoji mark:
  - `src/frontend/components/navigation/Navigation.tsx`
  - `src/frontend/components/navigation/Navigation.css`
- Sidebar collapse/expand control now lives in a dedicated highlighted vertical rail integrated into the right edge of the menu instead of inside the header row:
  - `src/frontend/components/navigation/Navigation.tsx`
  - `src/frontend/components/navigation/Navigation.css`
- Validation:
  - `npm run build:frontend` -> PASS
- Remaining risk:
  - the provided SVG is large for a frequently rendered brand asset and may merit optimization later if bundle weight becomes a priority

### Global Frontend UX Refresh

- Reworked global frontend shell and responsive behavior in:
  - `frontend/App.tsx`
  - `frontend/App.css`
  - `frontend/index.css`
  - `frontend/components/navigation/Navigation.tsx`
  - `frontend/components/navigation/Navigation.css`
- Sidebar collapse now propagates through layout state instead of remaining local to the menu component
- Result:
  - page content and top navigation resize together
  - collapsed sidebar no longer leaves a dead empty strip
  - sidebar preference persists through `localStorage`
- Introduced reusable frontend UX primitives:
  - `frontend/components/RegistrySearchOverlay.tsx`
  - `frontend/components/FormActionBar.tsx`
  - `frontend/components/DatePicker.tsx`
  - `frontend/components/DateRangePicker.tsx`
- Typography direction was tightened after review:
  - interface text uses a more readable modern sans stack
  - serif is limited to high-level headings only
  - gradients/shadows were toned down for a more current editorial-product feel
- Visual direction is now explicitly `calm premium legal`:
  - light warm-neutral base
  - navy typography
  - restrained gold/champagne accents instead of bright SaaS blue
- Add-client and add-case flows now use:
  - full-screen registry-search overlay instead of inline panels
  - sticky floating action bar for save / continue actions
  - shared visual calendar picker instead of native browser date input
- Registry search now uses a single range-picker block for `від/до` instead of two separate calendars
- Calendar behavior guardrails:
  - open upward automatically if there is not enough space below
  - opening one calendar should close peer calendars/range-pickers
- Compactness pass:
  - date picker and range picker were reduced in width, vertical rhythm, and typography scale to fit dense legal workflows with less visual sprawl
- Follow-up layout + typography audit:
  - calendar popovers now render through a portal over `document.body`, so they sit above the shell instead of inside local stacking contexts
  - top navigation was compressed into a lower single-row layout
  - serif usage was reduced in internal controls/section headers to improve cross-device readability and keep typography more uniform
- Layering hardening:
  - calendar popovers now use a dedicated top-level z-layer above registry overlay, top navigation, sidebar, and sticky action bars
  - local backdrop blur was removed from the calendar surfaces themselves to avoid a soft / foggy appearance
- Registry search usability pass:
  - removed duplicated date-range summary block inside the range-picker popover
  - compacted registry result tables with fixed column layout, tighter typography, and aggressive text wrapping so more columns fit on screen
- Registry calendar stabilization pass:
  - reset `frontend/components/DateRangePicker.tsx` to a simpler inline popover anchored directly to the period field inside the registry overlay
  - removed the range-picker peer/portal coordination after regressions caused invisible or displaced calendar content
  - preserved compact styling while restoring an opaque local panel and predictable open/close behavior
- Registry workspace positioning pass:
  - registry overlay now starts from the top of the viewport instead of being vertically centered
  - overlay container itself is scrollable on desktop-height constrained screens so the calendar and result area stay reachable on laptops
  - inline range-picker regained simple up/down auto-placement based on viewport space without reintroducing portal rendering
- Court-registry date filters now default to:
  - from `2015-05-28`
  - to current day
- Follow-up bug fix:
  - registry overlay panel no longer clips the calendar popover; outer panel overflow was relaxed while results list keeps its own internal scroll
- Updated page-level styling in:
  - `frontend/pages/clients/AddClientPage.css`
  - `frontend/pages/cases/AddCasePage.css`
  - `frontend/components/PageHeader.css`
- Verification:
  - `npm run build:frontend` -> PASS
- Remaining risk:
  - this session did not include full manual QA across all existing pages, so older route-specific CSS may still need harmonization against the new shell and token palette

### Case Client Selector Pagination Fix

- Fixed empty client dropdown on case create/edit pages:
  - `src/frontend/pages/cases/AddCasePage.tsx`
  - `src/frontend/pages/cases/CaseDetailsPage.tsx`
- Root cause:
  - frontend requested `/clients?limit=500`
  - backend `ClientFiltersDto.limit` allows a maximum of `100`
  - failed request was only logged, leaving the selector empty
- Added paginated client aggregation helper in:
  - `src/frontend/services/client.service.ts`
- New behavior:
  - case forms now fetch all visible clients page-by-page with `limit=100`
  - create and edit flows use the same retrieval path, preventing contract drift
- Validation:
  - `npm run build:frontend` -> PASS
- Remaining risk:
  - client selection still uses a full dropdown rather than searchable async lookup, which may become unwieldy for very large tenants

### Frontend API Routing Fix

- Fixed frontend API base URL fallback in:
  - `src/frontend/services/api.ts`
- New behavior:
  - use `VITE_API_URL` when provided
  - otherwise default to relative `/api` instead of absolute `http://localhost:3000/v1`
- Fixed local Vite proxy in:
  - `vite.config.ts`
- Proxy behavior now matches backend global prefix:
  - `/api/*` -> `http://localhost:3000/v1/*`
- Added local default:
  - `.env` -> `VITE_API_URL=/api`
- User-facing result:
  - frontend no longer hardcodes browser requests to localhost when env injection is missing
  - add-client page can again preview the generated client number through the proxied API endpoint
- Validation:
  - `npm run build:frontend` -> PASS
- Remaining risk:
  - stale deployed frontend artifacts will continue to fail until rebuilt

### Court Registry Service DI Fix

- Fixed NestJS runtime DI failure in:
  - `src/clients/services/court-registry.service.ts`
- Cause:
  - constructor default parameter `string[]` was treated as an injectable dependency token `Array`
- New behavior:
  - optional token `COURT_REGISTRY_DIRECTORIES` can override directories
  - without provider, service defaults to project-root `court_stan` then `court_base`
- Validation:
  - `npm test -- --runInBand src/clients/services/court-registry.service.spec.ts` -> PASS (4/4)
  - `npm run build` -> PASS
- Remaining risk:
  - deployed backend must be restarted/rebuilt to pick up the DI fix

### User-Scoped Data Isolation + Trust Foundation

- Added shared access policy helper:
  - `src/common/security/access-control.ts`
- Added record-level visibility for key legal entities:
  - `Case.accessScope`
  - `Client.accessScope`
  - `Document.accessScope`
- Supported scopes:
  - `private`
  - `assigned`
  - `tenant`
- Default scope for newly created cases/clients/documents:
  - `assigned`
- Service-level enforcement now applies in:
  - `src/cases/services/case.service.ts`
  - `src/clients/services/client.service.ts`
  - `src/documents/services/document.service.ts`
- Statistics and deadline/document aggregate reads are now actor-scoped for non-elevated roles, reducing cross-user metadata leakage inside the same tenant
- Elevated tenant roles currently bypass per-user scope:
  - `super_admin`
  - `organization_owner`
  - `organization_admin`

### Ukrainian Trust Provider / E-Signature Foundation

- Added verified external identity registry:
  - `src/database/entities/UserIdentity.entity.ts`
- Added document signature registry:
  - `src/database/entities/DocumentSignature.entity.ts`
- Added migration:
  - `src/database/migrations/1709900000000-HardenUserIsolationAndTrustProviders.ts`
- Supported provider identifiers in schema:
  - `acsk`
  - `diia`
  - `bankid_nbu`
  - `manual`
- Stored signature/identity metadata now includes:
  - provider
  - verification status
  - certificate serial / issuer
  - signed payload hash
  - assurance metadata
- Document signing flow currently stores provider metadata and audit evidence, but does not yet perform live provider verification

### RLS Preparation

- PostgreSQL session context expanded in:
  - `src/common/interceptors/rls.interceptor.ts`
- Session variables prepared for production RLS hardening:
  - `app.current_tenant_id`
  - `app.current_user_id`
  - `app.current_user_role`
- Current state:
  - service-layer isolation enforced
  - DB-level tenant+user RLS still pending

### Product And Documentation Alignment

- Added requirements reconciliation baseline:
  - `docs/REQUIREMENTS_ALIGNMENT_AUDIT.md`
- Source comparison covered:
  - original TZ
  - initial prompt
  - detailed SaaS orchestration prompt
  - current repo frontend/docs
  - Firebase Studio hosted prototype
- Key conclusions:
  - canonical source priority is now `TZ -> detailed SaaS prompt -> Firebase prototype -> Figma -> repo`
  - current frontend IA does not yet match original product menu from TZ
  - public landing page exists in Firebase prototype but not in repo frontend
  - several routes in `src/frontend/App.tsx` are still placeholders and should not be treated as completed modules
  - previous canonical route drift (`/cases/new` vs `/cases/add`) is now resolved
  - local exported Figma assets in `figma/` are available and should be used as the primary visual/layout reference
  - local Figma confirms fixed left sidebar, top quick actions, client right rail, tabless case detail, and dual-mode documents view

### Frontend IA Alignment

- Updated app shell to better match local Figma and TZ:
  - sidebar now reflects canonical legal-product IA rather than the smaller SaaS/admin subset
  - top navigation now exposes global quick actions:
    - `Додати клієнта`
    - `Додати справу`
  - added canonical frontend routes for placeholder modules:
    - `/pricelists`
    - `/activity`
    - `/reports`
    - `/print-forms`
    - `/chat`
    - `/mail`
    - `/users`
- Kept `/team` as backward-compatible redirect to `/users`
- Replaced placeholder documents route mount with the real page component from:
  - `src/frontend/pages/documents/DocumentsPage.tsx`
- Validation:
  - `npm run build:frontend` -> PASS

### Clients Flow Stabilization

- Fixed client flow shell issues:
  - added `/clients/:id` route placeholder so post-create navigation no longer falls into global 404
  - changed `ClientsPage` primary create action from dead modal flow to real navigation: `/clients/add`
- Added automatic client numbering flow:
  - tenant-scoped numbering starts from `001`
  - the smallest released client number is reused before incrementing
  - next-number preview endpoint added:
    - `GET /clients/next-number`
  - release pool persisted in:
    - `src/database/entities/ClientNumberRelease.entity.ts`
    - `src/database/migrations/1709950000000-AddClientNumberReleases.ts`
- Delete flow now asks whether to release the client number:
  - `releaseClientNumber=true` returns the numeric slot to the reusable pool
  - `releaseClientNumber=false` keeps numbering monotonic past the deleted record
- Restore flow now rejects duplicate-number conflicts if a released number was already reassigned
- Hardened client form validation and transform:
  - optional additional phones/emails no longer fail when left blank
  - optional banking fields no longer fail when rendered but empty
  - legal entity transform no longer reads nonexistent top-level `metadata.phone/email`
  - FOP transform/schema now use `taxation_form` instead of the previous mismatched `taxation_authority`
  - empty nested values are compacted before POST to backend
  - `metadata.client_number` is now preserved on client edit/update
- `AddClientPage` was aligned closer to local Figma labels and field groups for:
  - individual
  - FOP
  - legal entity
- `/clients/add` now preloads and shows the next generated client number as a read-only field
- Fixed `/clients/add` silent submit failure:
  - empty disabled `addresses.actual` values are now normalized away when `is_same_address=true`
  - actual-address field errors are now visible when a separate factual address is required
  - same-address checkbox now triggers immediate revalidation to clear/apply address errors correctly
- Added targeted regression test:
  - `src/frontend/schemas/client.schema.spec.ts`
- Validation:
  - `npm test -- --runInBand src/frontend/schemas/client.schema.spec.ts` -> PASS (2/2)
  - `npm test -- --runInBand src/clients/services/client.service.spec.ts` -> PASS (33/33)
  - `npm run build` -> PASS
  - `npm run build:frontend` -> PASS

### Test and CI Stability

- Added `.eslintrc.js` and aligned lint behavior to current codebase.
- Installed `supertest` + `@types/supertest` for e2e.
- Fixed unit test type mismatches and mocks:
  - `src/clients/services/client.service.spec.ts`
  - `src/auth/services/auth.service.spec.ts`
  - `src/billing/services/billing.service.spec.ts`

### Runtime and Service Fixes

- Fixed logger error signature mismatch in:
  - `src/common/logging/logging.service.ts`
- Fixed `unknown` error handling in:
  - `src/auth/controllers/auth.controller.ts`
- Fixed relation metadata issue in:
  - `src/database/entities/Subscription.entity.ts`
- Fixed statistics parsing bug (`count` extraction) in:
  - `src/clients/services/client.service.ts`
- Fixed TypeORM entity discovery for ts-jest + runtime:
  - `src/app.module.ts`

### E2E Functional Fixes

- Updated e2e imports, entity payloads, UUIDs, and JWT payload shape in:
  - `tests/cases.e2e-spec.ts`
- Fixed audit decorator runtime crash (incorrect `ExecutionContext` assumption):
  - `src/auth/services/audit.service.ts`
- Replaced DB-specific `ILIKE` with portable search condition:
  - `src/cases/services/case.service.ts`

### Frontend Auth and Clients Fixes

- Removed browser-incompatible `require(...)` usage in:
  - `src/frontend/App.tsx`
  - `src/frontend/services/api.ts`
- Removed stale modal-only references from `src/frontend/pages/clients/ClientsPage.tsx`:
  - `showModal`
  - `selectedClient`
  - `closeModal`
  - `handleSave`
- Current clients flow is route-based, not modal-based:
  - `/clients/add`
  - `/clients/:id`
- Added persisted auth session storage (`access_token`, `refresh_token`, `auth_user`, `auth_organization`) in:
  - `src/frontend/services/auth.service.ts`
- Added synchronous auth state hydration from `localStorage` in:
  - `src/frontend/store/auth.slice.ts`
- Added fallback auth hydration on hook mount in:
  - `src/frontend/hooks/useAuth.ts`
- Result:
  - clients page no longer crashes with `ReferenceError: Can't find variable: require`
  - user session survives page reloads without immediate redirect to `/login`

### Frontend Cleanliness Audit: Navigation and Breadcrumbs

- Added a shared breadcrumb component with semantic markup in:
  - `src/frontend/components/navigation/Breadcrumbs.tsx`
- Replaced decorative top-bar breadcrumb text with route-aware breadcrumbs in:
  - `src/frontend/components/navigation/Navigation.tsx`
- Removed duplicated local breadcrumb markup/styles from:
  - `src/frontend/pages/cases/AddCasePage.tsx`
  - `src/frontend/pages/cases/AddCasePage.css`
- Removed unused duplicate sidebar implementation:
  - `src/frontend/components/Sidebar.tsx`
  - `src/frontend/components/Sidebar.css`
- Added a semantic main landmark to the application shell in:
  - `src/frontend/App.tsx`
- Added shared page header component and removed duplicated header markup/styles across:
  - `src/frontend/components/PageHeader.tsx`
  - `src/frontend/components/PageHeader.css`
  - `src/frontend/pages/clients/ClientsPage.tsx`
  - `src/frontend/pages/clients/AddClientPage.tsx`
  - `src/frontend/pages/cases/CasesPage.tsx`
  - `src/frontend/pages/cases/AddCasePage.tsx`
  - `src/frontend/pages/documents/DocumentsPage.tsx`
- Converted remaining simple inline UI styles to CSS classes or CSS custom properties in:
  - `src/frontend/components/UpgradePrompt.tsx`
  - `src/frontend/components/UpgradePrompt.css`
  - `src/frontend/common/Logo.tsx`
  - `src/frontend/common/Logo.css`
  - `src/frontend/pages/onboarding/OnboardingWizard.tsx`
  - `src/frontend/pages/auth/RegisterPage.tsx`
  - `src/frontend/pages/documents/DocumentsPage.tsx`
  - `src/frontend/pages/dashboard/DashboardPage.tsx`
  - `src/frontend/pages/dashboard/components/RecentCasesWidget.tsx`
  - `src/frontend/pages/dashboard/components/TasksWidget.tsx`
  - `src/frontend/pages/dashboard/components/StatCard.tsx`
- Improved navigation semantics:
  - sidebar/mobile navigation now use `NavLink` instead of clickable `li`/button-only route switching
  - user menu now exposes `aria-haspopup`, `aria-expanded`, and `role=\"menu\"/\"menuitem\"`
- Fixed stale onboarding route:
  - `/cases/new` -> `/cases/add`
- Added route-level lazy loading and suspense fallback in:
  - `src/frontend/App.tsx`
  - split heavy screens into separate chunks (`LoginPage`, `RegisterPage`, `DashboardPage`, `BillingPage`, `ProfilePage`, `ClientsPage`, `AddClientPage`, `CasesPage`, `AddCasePage`, `DocumentsPage`, onboarding, billing result pages)
- Added vendor chunk partitioning in:
  - `vite.config.ts`
  - chunks split into `framework`, `router`, `state`, `forms`, `http`, `vendor`
- Simplified cases create flow:
  - `src/frontend/pages/cases/CasesPage.tsx` now routes new-case actions to `/cases/add`
  - edit modal has been removed from the list page after introducing a real route-based case detail/edit screen
- Added real case detail/edit page in:
  - `src/frontend/pages/cases/CaseDetailsPage.tsx`
  - `src/frontend/pages/cases/CaseDetailsPage.css`
- Extracted reusable case form sections into:
  - `src/frontend/components/cases/CaseFormSections.tsx`
  - `src/frontend/components/cases/index.ts`
- `src/frontend/App.tsx` now mounts the real `CaseDetailsPage` for `/cases/:id` instead of a placeholder
- Added real client detail/edit page in:
  - `src/frontend/pages/clients/ClientDetailsPage.tsx`
  - `src/frontend/pages/clients/ClientDetailsPage.css`
- Extracted reusable client form sections and reverse API->form mapping into:
  - `src/frontend/components/clients/ClientFormSections.tsx`
  - `src/frontend/utils/clientFormData.ts`
- `src/frontend/pages/clients/AddClientPage.tsx` now reuses the shared client form sections for create flow
- `src/frontend/App.tsx` now mounts the real `ClientDetailsPage` for `/clients/:id` instead of a placeholder
- Client detail page now supports:
  - route-based editing
  - status changes (`active`, `inactive`, `blocked`)
  - linked cases preview with navigation into `/cases/:id` and `/cases/add?client_id=...`
- Documents flow is now route-based by entity context instead of query-param-only filtering:
  - `/documents` -> global document library
  - `/cases/:caseId/documents` -> case-scoped documents
  - `/clients/:clientId/documents` -> client-scoped documents
- `src/frontend/pages/documents/DocumentsPage.tsx` now resolves case/client context, renders contextual breadcrumbs/header, and uploads into the correct entity scope
- Fixed frontend multipart upload bug in documents flow:
  - `src/frontend/services/api.ts` now accepts `FormData` in `upload()`
  - `src/frontend/services/document.service.ts` now sends document metadata with the file instead of dropping `caseId`/`clientId`
- Added real activity page in:
  - `src/frontend/pages/activity/ActivityPage.tsx`
  - `src/frontend/pages/activity/ActivityPage.css`
- `src/frontend/App.tsx` now mounts the real `/activity` page instead of a placeholder
- Validation:
  - `npm run build:frontend` -> PASS
  - main entry chunk reduced from ~`1.02 MB` to ~`93 kB`
  - framework chunk isolated at ~`334 kB`
  - no Vite chunk-size warning after `manualChunks`

## Important Guardrails For Next Sessions

- Keep this file short and append only high-signal changes.
- Before any non-trivial task, consult `docs/AGENT_EXECUTION_CHECKLIST.md` and continue from the first open conversation unless the user explicitly changes priority.
- After any non-trivial fix, update:
  - `docs/AGENT_EXECUTION_CHECKLIST.md`
  - validation status (`lint`, `test`, `test:e2e`, `build`)
  - touched critical files
  - architecture-impacting decisions
- For new e2e tests, always use valid UUID-format IDs.
- For SQL text search in shared code paths, avoid postgres-only operators when sqlite is used in tests.
- For Vite/frontend runtime code, do not use CommonJS `require(...)`; use static ES imports.
- Frontend auth persistence depends on both tokens and cached `user`/`organization` in `localStorage`.
- Breadcrumbs should be rendered through the shared navigation component, not reimplemented ad hoc per page.
- Do not keep parallel navigation implementations in `src/frontend/components` and `src/frontend/components/navigation`.
- Shared page headers should go through `PageHeader`, not repeated `.page-header` blocks in page-local JSX/CSS.
- Remaining `style={{ ... }}` usage in frontend should be limited to CSS custom properties for dynamic dimensions/colors when classes are insufficient.
- Prefer `React.lazy` + route-level splitting for heavyweight pages to keep the main Vite entry chunk under control.
- For entities like cases, prefer route-based detail/edit screens over modal editors once a real details page exists.
- When planning frontend work, consult `docs/REQUIREMENTS_ALIGNMENT_AUDIT.md` first to avoid route/menu drift.
- For app-shell work, keep sidebar width, top bar position, and page content spacing driven by shared layout state/CSS variables rather than isolated component-local widths.
- Registry lookup UX for long forms should stay overlay-based; avoid reintroducing inline expanding search panels that push the whole form down.
- Do not mark modules as complete if only list/create screens exist but TZ-required detail views are still missing.
- Treat Firebase Studio as the current accessible interaction prototype when Figma is blocked.

## Priority Open Items (Not Resolved Here)

- Wire live ACSK/Diia/BankID provider integrations, including real CRL/OCSP and callback security.
- Execute live staging deploy, outage, and backup/restore drills plus scanner/provider runtime rehearsal.
- Execute blind-index key rotation and production migration/backfill rehearsals using the new operator runbooks.
- Validate external commercial transport providers against staging:
  - SMTP/email delivery proof
  - SMS gateway proof
  - push transport proof

# 2026-03-10 Update - Commercial Workflow Completion

## Current Snapshot
- Invoice send flow now generates/stores a PDF artifact and queues email delivery before moving the invoice to `sent`
- Notifications no longer stop at stub queue logging; delivery is now persisted as `queued`, `delivered`, or `failed`
- Event reminders are now cron-driven and create notification records when reminder windows are reached

## Technical State
- `src/invoices/services/invoice.service.ts` now computes invoice totals/metadata on create, stores generated PDFs through `StorageProviderService`, and records delivery metadata during send
- `src/notifications/services/notification.service.ts` now owns a DB-backed queue processor with cron-driven delivery transitions for `email`, `sms`, `push`, and `in_app`
- `src/events/services/event.service.ts` now resets reminder state on schedule changes and delivers due reminders through `NotificationService`
- Added workflow coverage in:
  - `src/invoices/services/invoice.service.spec.ts`
  - `src/notifications/services/notification.service.spec.ts`
  - `src/events/services/event.service.spec.ts`

## Validation Status
- `npm test -- --runInBand src/invoices/services/invoice.service.spec.ts src/notifications/services/notification.service.spec.ts src/events/services/event.service.spec.ts` -> PASS (9/9)
- `npm run lint:backend -- --fix=false src/invoices/services/invoice.service.ts src/invoices/services/invoice.service.spec.ts src/invoices/invoices.module.ts src/notifications/services/notification.service.ts src/notifications/services/notification.service.spec.ts src/database/entities/Notification.entity.ts src/events/services/event.service.ts src/events/services/event.service.spec.ts src/events/events.module.ts src/events/dto/event.dto.ts` -> PASS
- `npm run build` -> PASS

## Remaining Limitation
- Workflow state is now real inside the application, but external transport execution is still not proven for SMTP/SMS/push providers in staging

# 2026-03-10 Update - Product Scope Reconciliation Refresh

## Current Snapshot
- The earlier scope audit was partly outdated: the repo now has real routes for landing, client details, case details, calendar, activity, pricelists, calculations, reports, print forms, chat, and mail
- The main frontend gaps are narrower than before and concentrate around placeholder admin/ops pages plus IA/navigation exposure
- `/users`, `/audit`, and `/settings` remain the clearest true frontend placeholders

## Technical State
- `src/frontend/App.tsx` confirms real route coverage for most core and secondary modules, but still mounts local placeholder components for:
  - `/users`
  - `/audit`
  - `/settings`
- `src/frontend/components/navigation/Navigation.tsx` is much closer to the TZ IA than before, but still does not fully expose the current route surface:
  - `activity` and `reports` remain hidden
  - `profile`, `users`, and `settings` are not first-class menu destinations
- Several modules now exist as working route-based hubs rather than empty placeholders:
  - calculations
  - reports
  - print forms
  - chat
  - mail
- The onboarding/profile split is still under-specified relative to TZ-required data capture

## Validation Status
- No additional code verification commands were run in this pass.
- Scope was documentation-only and based on direct source review of:
  - `docs/REQUIREMENTS_ALIGNMENT_AUDIT.md`
  - `src/frontend/App.tsx`
  - `src/frontend/components/navigation/Navigation.tsx`
  - current route-backed page components

## Next-Session Guardrails
- Do not describe route-backed modules as missing when they already exist as real pages; classify them as `partial` if the remaining gap is workflow depth rather than route absence
- Treat `/users`, `/audit`, and `/settings` as the primary placeholder frontend surfaces
- Treat shell/navigation alignment as a product gap distinct from route implementation
- For reports / print forms / chat / mail / calculations, decide explicitly whether each is launch-scope completion work or post-launch phase labeling before implementing ad hoc depth

# 2026-03-07 Update - Form Copy Cleanup

## Current Snapshot
- Add-client and add-case create screens no longer show decorative explanatory subtitles above the form
- Registry search overlays for those flows also open without helper paragraphs that repeated expected behavior
- Shared sticky form action bars were compacted vertically and now keep their controls in a single horizontal row

## Technical State
- `src/frontend/components/RegistrySearchOverlay.tsx` now accepts an optional `subtitle`, allowing flows to omit non-essential explanatory copy
- `src/frontend/components/FormActionBar.tsx` only renders metadata when present, so pages can keep a short title without carrying extra helper text
- `src/frontend/components/FormActionBar.css` now uses tighter padding/radius/shadow and disables button wrapping in favor of horizontal overflow

## Validation Status
- `npm run build:frontend` -> PASS

## Risks / Guardrails
- Single-row action bars now rely on horizontal scrolling on narrow screens instead of wrapping; keep this behavior consistent unless the product direction changes

# 2026-03-07 Update - Court Registry Search

## Current Snapshot
- Add-client flow now exposes `Пошук у реєстрах` instead of the old debtor-registry action label
- New backend registry-search path is `GET /clients/court-registry/search?query=...`
- Registry search also accepts optional `dateFrom` and `dateTo` filters in `YYYY-MM-DD`
- Court registry data source resolution order is:
  - `<project>/court_stan`
  - `<project>/court_base` fallback
- Selected registry rows can prefill a newly created case immediately after client creation
- Add-case flow now also exposes `Пошук справи в реєстрах` directly on `/cases/add`
- Add-case registry search defaults to the selected client's display name and can prefill the case form inline
- Add-case registry prefill now maps `participants` into dedicated case-party fields:
  - `plaintiffName`
  - `defendantName`
  - `thirdParties`
- Add-client registry search can now prefill client FIO and a comment block with role/case/court context from the selected search result
- Case create/edit client selectors no longer restrict options to `status=active`

## Technical State
- Added `CourtRegistryService` to stream and parse quoted TSV exports from registry CSV files
- Parser now buffers multiline quoted records, normalizes whitespace/case, splits `participants` by comma, extracts `role: person`, and returns structured search results
- Participant matching now follows the product rule strictly:
  - search only in `participants`
  - match by contiguous normalized substring
  - no declension/morphology heuristics
- Registration-date filtering is applied against `registration_date`
- Add-case page consumes temporary session storage prefill to seed court/case metadata
- Add-case page also supports direct inline registry prefill without creating a client in the same flow first
- Case-side registry prefill now classifies participants by role keywords:
  - plaintiff/applicant bucket
  - defendant/debtor bucket
  - remaining participants into third parties

## Validation Status
- `npm run lint` -> PASS
- `npm run build:frontend` -> PASS
- `npm test -- --runInBand src/clients/services/court-registry.service.spec.ts` -> PASS (7/7)

## Risks / Guardrails
- Participant parsing still assumes comma-separated parties inside the `participants` field
- If a future import source uses `court_base` only, keep the fallback directory resolution intact
- Case client dropdown still caps at 500 records; if tenant volume grows further, replace it with backend search/autocomplete rather than increasing the static payload indefinitely

# 2026-03-07 Update - Automatic Case Numbering

## Current Snapshot
- Internal case number now auto-generates as `номер клиента/номер дела`
- Example generated format: `001/001`
- Sequence is per client and starts from `001`
- Case create/edit forms now expose a separate field `Номер справи в реєстрі`
- Registry CSV prefill now stores external court number in `registryCaseNumber` instead of replacing the internal CRM case number
- Add-case flow previews the next generated internal number after client selection through `GET /cases/next-number?clientId=...`

## Technical State
- `src/cases/services/case.service.ts` now derives the next case sequence from the selected client's `metadata.client_number`
- Case creation no longer trusts a user-supplied internal `caseNumber`; backend generates it transactionally during create
- `src/database/entities/Case.entity.ts` now includes nullable `registryCaseNumber`
- Migration added:
  - `src/database/migrations/1709960000000-AddRegistryCaseNumber.ts`
- Case form/types/schema/API client were synchronized for:
  - read-only internal `caseNumber`
  - editable `registryCaseNumber`
- Added unit coverage in `src/cases/services/case.service.spec.ts` for:
  - first generated case number
  - per-client incrementing
  - ignoring legacy court numbers during internal sequence calculation
  - persisting registry case number separately

## Validation Status
- `npm run lint` -> PASS
- `npm test -- --runInBand src/cases/services/case.service.spec.ts src/clients/services/court-registry.service.spec.ts` -> PASS (11/11)
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS

## Risks / Guardrails
- There is still no DB-level uniqueness constraint or explicit locking for concurrent case creation on the same client; if concurrent create traffic becomes real, harden with a uniqueness guarantee or serialized reservation flow
- Legacy records whose `caseNumber` is still a court-format identifier are intentionally excluded from the new internal per-client sequence

# 2026-03-09 Update - Full Legacy UI Token Sweep

## Current Snapshot
- Remaining legacy frontend pages now use the same compact design scale as the newer CRM registry pages
- The frontend font policy remains hard-fixed to `Golos Text` only; no serif/display exceptions remain in active page-level CSS
- Shared typography tokens now cover the previously inconsistent areas too:
  - auth titles
  - onboarding headings
  - billing titles/prices
  - client/case detail metadata
  - activity cards
  - pricelist section headings
  - calendar modal titles
  - global system states like 404 and payment result
- Shared control-height tokens now cover the remaining outlier controls/buttons on:
  - auth pages
  - onboarding inputs/actions
  - billing CTAs
  - payment result actions
  - upgrade prompts
  - pricelist row actions/tabs
- Blue CRM accents now replace the last warm/gold and purple gradients in date pickers, onboarding, billing, prompts, and legacy detail pages

## Technical State
- Updated legacy page CSS to consume `src/frontend/index.css` tokens instead of page-local font sizes and oversized CTA patterns
- Replaced the remaining page-local serif usage with `var(--font-sans)` semantics
- Normalized selected/hover states in `DatePicker.css` and `DateRangePicker.css` onto the shared blue accent direction
- Tightened global system screens in `src/frontend/App.css` and old shared auth styles in `src/frontend/index.css` so fallback states no longer drift from the main design system

## Validation Status
- `npm run lint` -> PASS
- `npm run build:frontend` -> PASS

## Risks / Guardrails
- No manual browser QA was run on every route after this sweep; verify real desktop density, especially onboarding, billing, and detail pages with live tenant data
- The repo still contains historical notes about older legacy CSS drift in prior log sections; treat this update as the current state of the active frontend

## Same-Day Follow-up
- User reported that fonts and old styling still looked wrong in the live UI, so the frontend was re-audited against the actually rendered pages instead of relying on CSS grep alone
- Additional fixes were applied to the active rendered auth/button stack and the remaining gold utility remnants in:
  - `src/frontend/index.css`
  - `src/frontend/pages/auth/LoginPage.css`
  - `src/frontend/pages/auth/RegisterPage.css`
  - `src/frontend/pages/clients/AddClientPage.css`
  - `src/frontend/components/clients/ClientFormSections.tsx`
  - `src/frontend/components/RegistrySearchOverlay.css`
  - `src/frontend/components/DatePicker.css`
  - `src/frontend/components/DateRangePicker.css`
  - `src/frontend/pages/cases/AddCasePage.css`
  - `src/frontend/components/navigation/Navigation.css`
  - `src/frontend/pages/calendar/CalendarPage.css`
- Local desktop screenshots were captured from the Vite dev server for `/login` and `/register` after the fixes; those screenshots confirmed the old gold CTA was gone and the auth layout now uses the blue CRM direction
- `onboarding` was not visually audited as a separate screen in the browser because the app redirected that route to the login flow in the current unauthenticated state

## Same-Day Authenticated Audit Continuation
- Added `tmp/playwright-auth-audit.spec.js` to capture protected CRM routes in a mocked authenticated state through Playwright
- Audited the following desktop routes:
  - `/dashboard`
  - `/clients`
  - `/clients/add`
  - `/cases`
  - `/cases/add`
  - `/calendar`
- The first run exposed that protected-route controls still rendered with fallback typography:
  - `body` was computing as `Times New Roman`
  - `.btn-primary`, `.form-input`, `.form-select`, and `.filters-date-range__label` on audited screens were also computing as `Times New Roman`
- Hardened the shared app shell and control typography in:
  - `src/frontend/index.css`
  - `src/frontend/pages/workspace/WorkspacePage.css`
  - `src/frontend/pages/dashboard/DashboardPage.css`
  - `src/frontend/pages/clients/ClientsPage.css`
  - `src/frontend/pages/cases/CasesPage.css`
  - `src/frontend/pages/calendar/CalendarPage.css`
  - `src/frontend/components/FormActionBar.css`
- Cold CRM surface cleanup was also applied to remove the remaining warm beige gradients from:
  - dashboard widgets
  - workspace cards/panels
  - client/case registry table headers and icon actions
  - calendar shell
  - sticky form action bar
- Re-ran the authenticated Playwright audit and the resulting computed styles now report `Golos Text` for the audited route body, primary buttons, form controls, and date-filter labels

## Validation Status
- `npm run lint` -> PASS
- `npm run build:frontend` -> PASS
- `npx playwright test tmp/playwright-auth-audit.spec.js --reporter=line --workers=1` -> PASS

## Risks / Guardrails
- The authenticated screenshots use mocked API responses rather than real tenant data; perform one final live-data browser pass before treating the UI audit as closed

## Same-Day Calendar Follow-up
- Calendar now uses the shared `PageHeader`, and the duplicate page-level `Breadcrumbs` instance was removed because the top workspace navigation already renders `Головна / Календар`
- Calendar primary actions (`Додати подію`, `Оновити`) now live in the canonical page header; the active period label stays in the workspace toolbar
- Updated files:
  - `src/frontend/pages/calendar/CalendarPage.tsx`
  - `src/frontend/pages/calendar/CalendarPage.css`

## Validation Status
- `npm run lint` -> PASS
- `npm run build:frontend` -> PASS
- `npx playwright test tmp/playwright-auth-audit.spec.js --reporter=line --workers=1` -> PASS

## Risks / Guardrails
- The last authenticated browser audit still used mocked API responses; run the next pass through a live authenticated session with real tenant data to catch content-specific drift/outliers
- Continue `color drift` migration in this order: onboarding -> billing -> profile -> clients -> cases -> documents -> dashboard -> calendar
### 2026-03-10 Monitoring + Alerting + Launch Rehearsal

- Added operational monitoring/readiness service in:
  - `src/common/health/operational-monitoring.service.ts`
  - `src/common/health/health.controller.ts`
- Runtime behavior:
  - `GET /health` remains a liveness probe
  - `GET /readiness` now checks:
    - database ping/latency
    - Redis ping/latency or explicit disabled state
    - auth abuse via locked-account count
    - trust-verification backlog/failure counts
    - malware-scan backlog/failure/infected-upload counts
    - outbox backlog/dead-letter risk
    - billing anomalies (`past_due` / `unpaid`)
  - readiness now returns `503` when the stack is degraded or unhealthy
- Added security classification for access-isolation denials in:
  - `src/common/logging/global-exception.filter.ts`
  - forbidden `tenant context` and `data isolation` failures now emit structured security events
- Added verification coverage:
  - `src/common/health/operational-monitoring.service.spec.ts`
  - `src/common/logging/global-exception.filter.spec.ts`
- Added evidence-based operator checklist:
  - `docs/LAUNCH_REHEARSAL_CHECKLIST.md`
- Validation:
  - `npm run lint` -> PASS
  - `npm test -- --runInBand src/common/health/operational-monitoring.service.spec.ts src/common/logging/global-exception.filter.spec.ts` -> PASS
  - `npm run build` -> PASS
- Remaining limitation:
  - staging deploy/outage/backup drills are now documented precisely, but not executed from this workspace session
### 2026-03-10 Frontend Quality Gate + Live UX Audit

- Added effective frontend lint coverage in:
  - `package.json`
  - `.eslintrc.js`
- Added browser smoke coverage in:
  - `playwright.config.ts`
  - `tests/playwright/frontend-smoke.spec.ts`
- Browser-audited routes:
  - `/`
  - `/login`
  - `/dashboard`
  - `/clients`
  - `/cases`
  - `/documents`
  - `/calendar`
  - `/pricelists`
- Live defects found and fixed:
  - restored missing access-level labels in `src/frontend/pages/documents/DocumentsPage.tsx`, which was crashing `/documents`
  - added `autoFocus` support to `src/frontend/components/Input.tsx` so login keyboard focus now works as intended
  - removed duplicate React keys in `src/frontend/pages/landing/LandingPage.tsx`
- Validation:
  - `npm run lint` -> PASS
  - `npm run build:frontend` -> PASS
  - `npm run test:frontend:smoke` -> PASS (2/2)
- Remaining limitation:
- smoke coverage uses mocked API responses and is not a substitute for full staging browser validation against a live backend

### 2026-03-12 Quick Actions Duplication

## Current Snapshot
- Record-level quick action menus now expose `Дублювати` on clients, cases, notes, documents, and calculations
- `pricelists` and `print forms` already had duplication; this sweep aligned the remaining core CRM/ERP registries

## Technical State
- `clients` duplication routes to `/clients/add?duplicateFrom=:id` and pre-fills the add form from the source client while requesting a fresh client number
- `cases` duplication routes to `/cases/add?duplicateFrom=:id` and pre-fills the add form from the source case while letting the normal next-case-number logic regenerate the internal number
- `calculations` duplication routes to `/calculations/add?type=...&duplicateFrom=:id` and restores copied lines, notes, linked client/case, and selected pricelists
- `notes` duplication is immediate via `noteService.createNote(...)`
- `documents` duplication is immediate via signed-URL fetch + `uploadDocument(...)`, preserving type, description, access level, and parent linkage

## Validation Status
- `npm run lint:frontend` -> PASS
- `npm run build:frontend` -> PASS

## Risks / Guardrails
- Browser QA is still advisable for `documents` duplication on a live backend because it depends on browser fetch access to the generated signed URL
- Page-level quick action menus without a current record context were left unchanged; duplication was added where a concrete entity is being acted on

### 2026-03-12 Calculations Menu Cleanup

## Current Snapshot
- The calculations registry quick actions menu was reduced to the requested operational set and no longer exposes inline client/case filter jumps or `send for approval` from the row menu

## Technical State
- Updated `src/frontend/pages/calculations/CalculationsPage.tsx` row actions to include:
  - `Відкрити`
  - `Редагувати`
  - `Дублювати`
  - `Архівувати`
  - existing approval/payment status actions where still applicable
  - `Видалити`
- `Архівувати` uses the existing `deleteCalculation(...)` soft-delete path because calculations still do not have an `archived` status in frontend/backend types

## Validation Status
- `npm run lint:frontend` -> PASS
- `npm run build:frontend` -> PASS

## Risks / Guardrails
- The calculations module still lacks a dedicated editable update flow for line items; `Редагувати` currently routes to the calculation card rather than a full edit form
- If the product needs recoverable archive semantics for calculations, add a first-class `archived` status instead of relying on soft delete

### 2026-03-12 Calculations Edit Route

## Current Snapshot
- `Редагувати` is now available from both the calculations registry and the calculation details quick actions
- Calculations use a dedicated edit route: `/calculations/:id/edit`

## Technical State
- `src/frontend/pages/calculations/CalculationCreatePage.tsx` now works in two modes:
  - create
  - edit existing calculation
- `src/frontend/App.tsx` now registers `/calculations/:id/edit`
- `src/calculations/dto/calculation.dto.ts` and `src/calculations/services/calculation.service.ts` were extended so updates can persist edited line items and recomputed totals instead of only status/notes metadata

## Validation Status
- `npm run lint:frontend` -> PASS
- `npm run build:frontend` -> PASS
- `npm run build` -> PASS

## Risks / Guardrails
- Archive for calculations is still implemented as soft delete, not as a separate recoverable archived status

### 2026-03-12 Calculations Hourly Label Copy Fix

## Current Snapshot
- In the calculation create/edit form, the hourly quantity field is now labeled `Годин` instead of `Хвилин`

## Technical State
- Updated user-facing copy in:
  - `src/frontend/pages/calculations/CalculationCreatePage.tsx`
- Internal duration storage/calculation logic is unchanged in this patch; only the displayed field label was corrected

## Validation Status
- `npm run lint:frontend` -> PASS
- `npm run build:frontend` -> PASS

## Risks / Guardrails
- The current hourly calculation model still stores duration in minutes under the hood, so if product semantics must become true hour-based input, that requires a separate logic/data update

### 2026-03-12 Calculations Hourly UX Logic Fix

## Current Snapshot
- Hourly calculation positions now behave as true hour-based input in the create/edit form
- A value of `1` in the hourly field now means `1 година`, not `1 хвилина` and not `60`

## Technical State
- Updated `src/frontend/pages/calculations/CalculationCreatePage.tsx` so:
  - default hourly input value is `1`
  - draft line total for hourly rows is computed as `unitPrice * hours`
  - pricelist `defaultDuration` values are converted from stored minutes to displayed hours
  - submitted hourly values are converted back into minutes for compatibility with the current backend model
- Updated `src/frontend/pages/calculations/CalculationDetailsPage.tsx` hourly summary to display aggregate hours instead of minutes

## Validation Status
- `npm run lint:frontend` -> PASS
- `npm run build:frontend` -> PASS

## Risks / Guardrails
- Persistence is still minute-based in `pricelists` / `calculations`; a later cleanup may still be needed if the domain model should become hour-native end to end

### 2026-03-12 Print Forms Table Wrapping

## Current Snapshot
- Calculation tables embedded into print-form templates now constrain column widths and wrap long values inside cells instead of letting text run into neighboring columns

## Technical State
- Updated `src/frontend/pages/print-forms/templateBuilder.utils.ts`
- Added `colgroup` to the generated calculation table token markup
- Tightened both TinyMCE content styles and printable document styles for:
  - stable column widths
  - controlled wrapping
  - left alignment for service names
  - centered narrow numeric/service-mode columns

## Validation Status
- `npm run lint:frontend` -> PASS
- `npm run build:frontend` -> PASS

## Risks / Guardrails
- Very long unbroken strings can still force aggressive wrapping; if a specific legal template needs stricter typography, tune the template document settings or add template-specific CSS later

### 2026-03-12 Calculation Table Unit Type Short Labels

## Current Snapshot
- In generated documents, the calculation table now uses short unit-type labels instead of full words

## Technical State
- Updated `src/frontend/pages/documents/DocumentComposerPage.tsx`
- `Тип обліку` now renders as:
  - `год.`
  - `шт.`
  - `фікс.`

## Validation Status
- `npm run lint:frontend` -> PASS
- `npm run build:frontend` -> PASS

## Risks / Guardrails
- This change currently targets generated document tables; if the same abbreviation style is needed in other calculation-related exports/previews, reuse the same short-label helper there too

### 2026-03-12 Mobile Scan Session Inactivity TTL

## Current Snapshot
- Mobile scan sessions no longer expire strictly 30 minutes after creation while the user is still actively uploading/reordering/finalizing pages
- The mobile scan page now shows backend error text like `Сесія сканування вже прострочена` instead of only generic Axios status messages

## Technical State
- Updated `src/documents/services/scan-session.service.ts`
- `expiresAt` now behaves as an inactivity deadline and is refreshed on:
  - mobile scanner open
  - page upload
  - page delete
  - page reorder
  - finalize start
- Added a safe resume path for recently active sessions whose old absolute `expiresAt` timestamp is already in the past
- Added optional environment override:
  - `SCAN_SESSION_LIFETIME_MINUTES`
- Updated `src/frontend/pages/documents/MobileScanPage.tsx` to use `src/frontend/utils/errors.ts` for backend-first error messages

## Validation Status
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS
- direct backend retest of the previously failing finalize call now returns `400 Немає жодної сторінки для формування PDF` instead of `403 Сесія сканування вже прострочена`

## Risks / Guardrails
- This patch stabilizes active sessions, but it intentionally does not revive truly stale sessions with no recent activity
- Physical-phone preview thumbnails may still fail in LAN dev if local storage asset URLs point to `localhost` instead of a phone-reachable backend host

### 2026-03-12 Multi-Format Document Viewer + Inline Content Access

## Current Snapshot
- `/documents/:id` now opens a dedicated viewer/editor route instead of forcing every document interaction through download-only actions
- The files module can now preview `pdf`, `image`, `text`, `docx`, and `zip` documents inline
- Minimal safe editing is now available for:
  - text-like files via revision save
  - images via crop/zoom/rotation with revision save
  - PDFs via page-rotation draft with revision save

## Technical State
- Added frontend viewer screen in:
  - `src/frontend/pages/documents/DocumentViewerPage.tsx`
  - `src/frontend/pages/documents/DocumentViewerPage.css`
- Added lazy route:
  - `/documents/:id`
  - `src/frontend/App.tsx`
- Updated `src/frontend/pages/documents/DocumentsPage.tsx` so cards/rows expose `Відкрити` and use authenticated download instead of `window.open(...)` on a signed URL
- Added authenticated content-serving endpoints in:
  - `src/documents/controllers/documents.controller.ts`
  - `GET /documents/:id/content`
  - `GET /documents/:id/download`
- `src/documents/services/document.service.ts` now:
  - fixes signed URL expiration math to use seconds correctly
  - accepts `inline` disposition for signed URLs
  - promotes trusted internal scan PDFs to `clean` for inline content access just like signed URL access
  - treats `parentDocumentId` uploads as revision saves that inherit linkage/access metadata and increment `version`
- Expanded document/file-storage MIME allow-lists for:
  - `text/plain`
  - `text/markdown`
  - `text/csv`
  - `text/html`
  - `application/json`
  - `application/xml`
  - `application/rtf`
  - `application/zip`
  - `application/x-zip-compressed`
  - `image/webp`
  - `image/gif`
- Added viewer-focused lazy chunks in `vite.config.ts`:
  - `pdf-viewer`
  - `docx-viewer`
  - `file-viewer`
- Added dependencies:
  - `react-pdf`
  - `react-easy-crop`
  - `docx-preview`
  - `fflate`

## Validation Status
- `npm run lint:frontend` -> PASS
- `npm run lint:backend` -> PASS
- `npm run build:frontend` -> PASS (new viewer chunks emitted; existing circular/manualChunks and large-chunk warnings remain)
- `npm run build` -> PASS
- `npm test -- --runInBand` -> FAIL because of an unrelated existing TypeScript error in `src/calculations/services/calculation.service.ts:347`

## Risks / Guardrails
- DOCX and ZIP are view-only in this iteration; no save-back workflow exists for those formats yet.
- `xls/xlsx` upload remains supported, but spreadsheet preview/editor support is still missing.
- PDF viewer assets are route-lazy, but `pdf.worker.min` still adds a noticeable route-level payload; keep spreadsheet/office-style viewers out of the default shell.
- Next session: if the product needs richer office-file editing, prefer server-side conversion or versioned exports instead of adding a heavy in-browser office suite.
- Next session: investigate the existing calculations compile/test error before using a green full-Jest run as a release signal.

### 2026-03-12 Unicode Filename Header Fix For Document Content

## Current Snapshot
- PDF preview/download no longer crashes with `500` when a document filename contains Cyrillic characters such as `Скан-120326-1540.pdf`

## Technical State
- Updated `src/documents/controllers/documents.controller.ts`
- Added a Unicode-safe `Content-Disposition` builder for:
  - `GET /documents/:id/content`
  - `GET /documents/:id/download`
- Header format now includes:
  - ASCII fallback `filename="..."`
  - RFC 5987 UTF-8 `filename*=UTF-8''...`
- Updated `src/frontend/pages/documents/DocumentViewerPage.tsx` to use shared backend-first error extraction via `src/frontend/utils/errors.ts`

## Validation Status
- `npm run lint:backend` -> PASS
- `npm run lint:frontend` -> PASS
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS
- authenticated `GET /v1/documents/:id/content?disposition=inline` for the previously failing scan PDF -> `200 OK`

## Risks / Guardrails
- This fix removes the Unicode-header crash path, but any future binary response with user-supplied filenames should keep using the same encoded-header pattern instead of interpolating raw filenames into headers.

### 2026-03-12 Mobile Scan Preview Delivery + Auto Compression

## Current Snapshot
- Mobile scan pages now show immediate local previews after photo upload
- LAN/dev mobile preview URLs no longer depend on `localhost`
- Oversized mobile photos are compressed client-side before upload so ordinary phone camera captures do not immediately fail against the 10 MB page limit

## Technical State
- Added `src/frontend/utils/imageCompression.ts`
- Updated `src/frontend/pages/documents/MobileScanPage.tsx`:
  - accept `image/*`
  - compress scan images before upload
  - attach local object-URL previews per uploaded page
- Updated `src/frontend/pages/documents/MobileScanPage.css` for more stable preview rendering
- Updated `src/main.ts` to serve local storage files from `/storage/*` in non-production
- Updated `src/file-storage/providers/local-storage.service.ts`:
  - default public URL base changed from hardcoded `http://localhost:3000/storage` to relative `/storage`
- Updated `vite.config.ts`:
  - added `/storage` proxy to backend for Vite/LAN development
- Updated `src/file-storage/services/file-storage.service.ts`:
  - large-file validation message localized to Ukrainian

## Validation Status
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS
- direct backend `HEAD /storage/...` for an uploaded scan image -> `200 OK`

## Risks / Guardrails
- The backend still enforces the product-level 10 MB per-page limit; extremely large originals may still need stronger downscaling or a future dedicated scan preprocessing step
- Relative `/storage` preview URLs are ideal for local/Vite setups and same-origin deployments; if frontend and backend are split across different public domains in production, `LOCAL_STORAGE_URL` should be set explicitly

### 2026-03-12 Mobile Scan Keepalive + Longer Session TTL

## Current Snapshot
- Mobile scan sessions now stay alive while the scan page remains open
- The fallback inactivity lifetime is now much longer, which prevents long manual scanning/review sessions from expiring mid-process

## Technical State
- Updated `src/documents/services/scan-session.service.ts`
  - default `DEFAULT_SESSION_LIFETIME_MS` increased from 30 minutes to 8 hours
  - explicit `SCAN_SESSION_LIFETIME_MINUTES` env configuration still overrides the default
- Updated `src/frontend/pages/documents/MobileScanPage.tsx`
  - added a 60-second keepalive loop via `openMobileScanSession(...)`
  - added a `visibilitychange` refresh so returning to the tab also extends the session
  - added user-facing copy that the session is kept active while the page is open

## Validation Status
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS

## Risks / Guardrails
- Background mobile browsers can still throttle timers; the longer backend inactivity TTL is intentionally kept as a safety net rather than relying on heartbeat alone

### 2026-03-12 Scan PDF Download 403 Fix

## Current Snapshot
- Final PDFs generated from mobile scan sessions no longer remain blocked behind `malwareScanStatus = pending`
- Older already-generated scan PDFs are also repaired on first download attempt, so users do not have to recreate the scan just to get rid of `403`

## Technical State
- Added `markFileAsClean(...)` to `src/file-storage/services/file-scan.service.ts`
- Updated `src/documents/services/scan-session.service.ts`
  - newly assembled scan PDFs are marked trusted-clean with `scannerEngine = internal_scan_pdf`
- Updated `src/documents/services/document.service.ts`
  - signed-URL generation now auto-promotes legacy `scan_session` PDFs from `pending` to `clean` before download
- Extended `src/file-storage/services/file-scan.service.spec.ts` with trusted-clean coverage

## Validation Status
- `npm test -- --runInBand src/file-storage/services/file-scan.service.spec.ts` -> PASS
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS

## Risks / Guardrails
- The clean bypass is intentionally scoped to backend-generated `scan_session` PDFs only; direct user uploads still remain blocked until the malware-scan pipeline marks them safe

### 2026-03-13 Document Viewer PDF Open Crash Fix

## Current Snapshot
- Opening `/documents/:id` no longer crashes the viewer route on render when the metadata sidebar mounts for a PDF or other previewable file

## Technical State
- Updated `src/frontend/pages/documents/DocumentViewerPage.tsx`
- Restored missing metadata sidebar state and derived dirty tracking:
  - `descriptionDraft`
  - `accessLevelDraft`
  - `accessScopeDraft`
  - `metadataSaving`
  - `metadataDirty`
- Added viewer-local access label maps so the sidebar properties form no longer depends on symbols that exist only in `DocumentsPage`
- The crash root cause was a render-time `ReferenceError` from referencing `descriptionDraft` without a matching `useState(...)` declaration

## Validation Status
- `npx eslint src/frontend/pages/documents/DocumentViewerPage.tsx` -> PASS
- `npm run build:frontend` -> PASS

## Risks / Guardrails
- The document viewer route still lacks automated browser/runtime coverage for "open existing PDF and render sidebar"; if this page changes again, add a focused smoke test instead of relying only on build success
