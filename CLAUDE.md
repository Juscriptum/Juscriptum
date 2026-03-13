# Law Organizer - Legal CRM SaaS Platform

> Enterprise multi-tenant legal practice management system

## Project Overview

Law Organizer is a comprehensive SaaS platform for legal professionals in Ukraine, providing case management, client CRM, document management, billing, and calendar functionality.

### Technology Stack

| Component | Technology |
|-----------|------------|
| Backend | NestJS 10.x (TypeScript) |
| Frontend | React 18.x + Vite |
| Database | PostgreSQL 15+ |
| ORM | TypeORM |
| Cache | Redis (Enterprise) |
| Payments | Stripe, WayForPay |
| Storage | AWS S3 / Local |
| Deployment | Docker + Kubernetes |

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Ingress / Load Balancer                   │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Frontend      │ │    Backend      │ │    Worker       │
│   (Nginx)       │ │   (NestJS)      │ │   (BullMQ)      │
│   Port: 8080    │ │   Port: 3000    │ │   Redis Queue   │
└─────────────────┘ └─────────────────┘ └─────────────────┘
          │                  │                  │
          │         ┌────────┴────────┐         │
          │         │                 │         │
          │         ▼                 ▼         │
          │  ┌─────────────┐  ┌─────────────┐   │
          │  │ PostgreSQL  │  │    Redis    │──┘
          │  │  (Shared /  │  │   (Cache)   │
          │  │  Dedicated) │  │             │
          │  └─────────────┘  └─────────────┘
          │
          ▼
   ┌─────────────┐
   │   S3/Local  │
   │   Storage   │
   └─────────────┘
```

## Multi-Tenant Architecture

### Tenant Isolation Strategy

| Aspect | Implementation |
|--------|----------------|
| Database | Shared PostgreSQL with `tenant_id` discriminator |
| Isolation Level | Application-level + enforced PostgreSQL tenant+user-aware RLS |
| Context Propagation | JWT payload + TenantGuard + DB session context (`app.current_tenant_id`, `app.current_user_id`, `app.current_user_role`) |
| Storage | Tenant-prefixed paths |

### User-Level Isolation Strategy

| Aspect | Implementation |
|--------|----------------|
| Record scope | `accessScope`: `private`, `assigned`, `tenant` |
| Default visibility | New records default to `assigned` |
| Access checks | Service-level enforcement by actor role + record ownership/assignment |
| Protected modules | `cases`, `clients`, `documents`, `notes` |
| Elevated roles | `super_admin`, `organization_owner`, `organization_admin` |
| DB enforcement | PostgreSQL RLS policies aware of both tenant and current user |

### Tenant Context Flow

```
1. User authenticates → JWT issued with tenant_id
2. Request → JwtAuthGuard validates token
3. TenantGuard extracts tenant_id from JWT
4. Request.tenantId set for controllers
5. Services apply tenant + actor scope filters for `cases`, `clients`, `documents`, `notes`
6. PostgreSQL session context is set for user-aware RLS
7. Audit logs include tenant_id
```

### Trusted Identity / Signature Foundation

| Capability | Current Foundation |
|-----------|--------------------|
| Qualified e-signature (КЕП/ЕЦП) | `document_signatures` registry with provider, hash, certificate metadata, verification status |
| Trusted identity binding | `user_identities` registry for verified external identities |
| Ukrainian providers planned | АЦСК / КНЕДП, Дія, BankID НБУ |
| Verification model | provider-specific status + certificate/subject metadata + audit trail |
| Current limitation | live-capable ACSK/Diia/BankID adapters, signed callbacks, and CRL/OCSP hooks are now implemented, but production credentials, endpoint validation, and staging proof are still pending |
```

### RBAC Matrix

| Role | Level | Permissions |
|------|-------|-------------|
| super_admin | Platform | Cross-tenant access |
| organization_owner | Tenant | Full tenant access |
| organization_admin | Tenant | User management |
| lawyer | Tenant | Cases, clients, documents |
| assistant | Tenant | Read + limited write |
| accountant | Tenant | Invoices, billing |

### Subscription Plans

| Plan | Users | Features |
|------|-------|----------|
| basic | 1 | Data export only |
| professional | 5 | MFA, API, webhooks, audit |
| enterprise | Unlimited | SSO, custom domain, dedicated DB |

## Module Structure

```
src/
├── auth/           # Authentication, guards, JWT
├── billing/        # Stripe, WayForPay, subscriptions
├── cases/          # Legal case management
├── clients/        # Client CRM
├── documents/      # Document storage, signing
├── events/         # Calendar, appointments
├── notes/          # Unified notes workspace and linked notes registry
├── invoices/       # Invoice generation
├── pricelists/     # Service pricing
├── calculations/   # Fee calculations, numbering, approval, export
├── dashboard/      # Analytics, statistics
├── notifications/  # User notifications
├── file-storage/   # S3/Local storage
├── enterprise/     # Enterprise features
│   ├── audit/      # WORM audit logging
│   ├── cache/      # Redis caching
│   ├── cdn/        # CDN integration
│   ├── database/   # Dedicated DB per tenant
│   ├── domains/    # Custom domains
│   └── performance/# Query optimization
├── common/         # Shared utilities
├── database/       # Entities, migrations
└── frontend/       # React application
```

## Key Files

### Authentication & Security

| File | Purpose |
|------|---------|
| `src/auth/guards/index.ts` | TenantGuard, RbacGuard, SubscriptionGuard |
| `src/auth/strategies/jwt.strategy.ts` | JWT validation |
| `src/auth/interfaces/jwt.interface.ts` | JWT payload types |
| `src/auth/services/auth.service.ts` | Login, register, MFA |
| `src/common/security/access-control.ts` | User-scoped access policy helpers |
| `src/common/interceptors/rls.interceptor.ts` | DB session context for tenant/user/role |

### Multi-Tenant

| File | Purpose |
|------|---------|
| `src/database/entities/Organization.entity.ts` | Tenant root |
| `src/database/entities/User.entity.ts` | User with tenant_id |
| `src/database/entities/Subscription.entity.ts` | Billing subscriptions |
| `src/database/entities/UserIdentity.entity.ts` | Verified external identity registry |
| `src/database/entities/DocumentSignature.entity.ts` | E-signature registry / verification metadata |
| `src/database/entities/Note.entity.ts` | Unified notes linked to clients, cases, and users |
| `src/database/entities/PricelistCategory.entity.ts` | Persisted hierarchical pricelist categories tree |

### Billing

| File | Purpose |
|------|---------|
| `src/billing/services/stripe.service.ts` | Stripe integration |
| `src/billing/services/wayforpay.service.ts` | Ukrainian payments |
| `src/billing/services/billing.service.ts` | Subscription management |

### Frontend

| File | Purpose |
|------|---------|
| `src/frontend/App.tsx` | Main application |
| `src/frontend/App.css` | Global shell layout, desktop/mobile content offsets, and page container spacing |
| `src/frontend/components/navigation/Navigation.tsx` | Sidebar, topbar, and mobile navigation behavior including menu open/close lifecycle |
| `src/frontend/components/navigation/Navigation.css` | Desktop/mobile navigation presentation, safe-area handling, and fixed mobile chrome |
| `src/frontend/index.css` | Canonical frontend design tokens for typography, color, spacing, radii, and control density |
| `src/frontend/pages/landing/LandingPage.tsx` | Public marketing/presentation landing page for unauthenticated visitors |
| `src/frontend/services/auth-storage.ts` | Shared browser auth persistence abstraction for remember-me session behavior |
| `src/frontend/components/AuthSessionSync.tsx` | Cross-tab auth state sync bridge that rehydrates or clears Redux auth state from browser storage events |
| `src/frontend/utils/authRedirect.ts` | Safe login redirect-target normalization and protected-route return-path builder |
| `src/frontend/components/DatePicker.tsx` | Shared native date input wrapper for keyboard/date-picker entry |
| `src/frontend/components/RegistrySearchOverlay.tsx` | Full-screen registry search workspace for client/case forms |
| `src/frontend/components/FormActionBar.tsx` | Sticky floating action bar for long forms |
| `src/clients/services/court-registry.service.ts` | Unified external-registry reader for `court_stan` / `court_base`, `asvp`, and `court_dates` CSV feeds |
| `src/cases/services/case-registry-sync.service.ts` | Auto-sync of `Судова справа` cases to `court_dates` hearings with immediate + daily 10:00 (+01:00) refresh |
| `src/registry-index/services/registry-index.service.ts` | Local SQLite/FTS registry index builder and search layer for `court_stan`, `asvp`, and `court_dates` |
| `src/scripts/build-registry-index.ts` | Manual registry-index rebuild entrypoint for local source files |
| `src/frontend/pages/events/AddEventPage.tsx` | Calendar event authoring surface with `Користувач / Клієнт` audience toggle, client-only case linking, participant metadata persistence, reminders, range events, and recurrence controls |
| `src/frontend/pages/notes/NotesPage.tsx` | ERP/CRM-aligned unified notes workspace with filters, actions, and linked note flows |
| `src/frontend/services/note.service.ts` | Frontend note CRUD/list API client |
| `src/frontend/components/notes/RelatedNotesPanel.tsx` | Reusable related-note panel for client/case detail pages |
| `src/frontend/pages/calendar/CalendarPage.tsx` | Calendar workspace that expands recurring and multi-day events for day/week/month/year views |
| `docs/FRONTEND_DESIGN_SYSTEM.md` | Canonical frontend visual language, palette policy, and migration rules |
| `docs/FRONTEND_COLOR_AUDIT.md` | Inventory of remaining legacy palette drift in page-level CSS |
| `src/frontend/components/cases/CaseFormSections.tsx` | Shared create/edit case form sections, including grouped participant capture and institution labels |
| `src/frontend/utils/caseParticipants.ts` | Structured case-participant group catalog plus legacy-field synchronization helpers |
| `src/frontend/pages/calculations/CalculationsPage.tsx` | CRM-style calculations registry with compact filters, page actions, row workflow actions, and links to route-based create/view screens |
| `src/frontend/pages/calculations/CalculationCreatePage.tsx` | Dedicated route-based calculation creation page with operation-type-specific add flow and income-pricelist service selection |
| `src/frontend/pages/calculations/CalculationDetailsPage.tsx` | Read-only calculation card with workflow actions, tabular line rendering, and total-in-words summary |
| `src/frontend/services/calculation.service.ts` | Frontend API client for calculations create/list/workflow actions |
| `src/frontend/components/Alert.tsx` | Shared alert surface that now supports both `children` and `message`-style error payload rendering |
| `src/frontend/pages/pricelists/PricelistsPage.tsx` | Pricelist registry with active/archive tabs, search, and row-level actions |
| `src/frontend/pages/pricelists/PricelistEditorPage.tsx` | Pricelist create/edit workspace for settings, categories, and service rows |
| `src/frontend/pages/pricelists/PricelistDetailsPage.tsx` | Grouped read-only pricelist view with archive/duplicate/edit actions |
| `src/frontend/services/pricelist.service.ts` | Frontend pricelist CRUD and item API client |
| `src/frontend/utils/errors.ts` | Shared frontend error-message normalization for backend array/string payloads plus generic runtime fallbacks |
| `src/frontend/pages/print-forms/PrintFormsPage.tsx` | Template registry plus A4 document-template editor with audited grouped variables, compact TinyMCE toolbar, local template persistence, preview, print, and save-to-files export |
| `src/frontend/pages/print-forms/templateRegistry.ts` | Shared frontend-local template registry helpers reused by template authoring and document generation flows |
| `src/frontend/pages/print-forms/templateBuilder.utils.ts` | Template variable grouping aligned to real create/edit forms, preview resolution, and lightweight genitive-case inflection helpers |
| `src/frontend/pages/documents/DocumentsPage.tsx` | Finder/Explorer-style files workspace with icon/list modes, root-level `Власна` plus client folders, history-aware folder navigation, filters, bulk upload queue, and document actions |
| `src/frontend/pages/documents/DocumentViewerPage.tsx` | Route-based multi-format file viewer/editor with inline preview for PDF/image/text/DOCX/ZIP plus compact editor-style PDF post-processing toolbar, scan-mode crop/corners/A4/OCR revision actions, and server processing summary |
| `src/frontend/utils/scanProcessing.ts` | Shared browser-side scan helpers for document-boundary detection, A4 framing, and processed-page canvas export |
| `src/documents/services/pdf-post-processing.service.ts` | Server-side PDF post-processing orchestrator for external `python/OpenCV + poppler + unpaper + OCRmyPDF + Tesseract` runtime integration, project-venv detection, capability checks, and OCR/searchable-PDF assembly handoff |
| `scripts/pdf_postprocess_pipeline.py` | Python entrypoint for backend PDF preprocessing with per-page contour/perspective/deskew/crop/background normalization, runtime diagnostics, and pass-through fallback when the full runtime is unavailable |
| `src/frontend/pages/documents/DocumentComposerPage.tsx` | Route-based create-from-template and text-document generation surface with optional client/case/calculation/event binding |
| `src/frontend/pages/documents/ScanSessionPage.tsx` | Desktop scan-session launcher/status page with optional root/personal/client/case destination binding, QR handoff into mobile web scanning, and localhost QR diagnostics |
| `src/frontend/pages/documents/MobileScanPage.tsx` | Public tokenized mobile web scanner for page upload, reordering, deletion, and finalize |
| `tests/playwright/frontend-smoke.spec.ts` | Browser smoke coverage for public auth, authenticated critical routes, and iPhone-width viewport overflow checks |
| `src/database/entities/ScanSession.entity.ts` | Scan session state, token, root/personal/client/case destination binding, and finalize/OCR status tracking |
| `src/database/entities/ScanPage.entity.ts` | Per-page scan upload/order/status storage for mobile scan sessions |
| `src/frontend/components/RecordActionsMenu.tsx` | Shared record-actions dropdown with viewport-level overlay rendering for registries, workspaces, and labeled page-action triggers |
| `src/frontend/utils/currency.ts` | Shared Ukrainian money formatting helpers for `грн` display and amount-in-words rendering |
| `src/frontend/store/` | Redux state management |
| `src/frontend/hooks/` | Custom hooks |
| `src/frontend/i18n/` | Ukrainian localization |

## Development Commands

```bash
# Install dependencies
npm install

# Development server
npm run start:dev

# Build for production
npm run build

# Run linting
npm run lint

# Run tests
npm test

# Database migrations
npm run migration:run

# TypeORM CLI
npm run typeorm -- <command>
```

## Environment Variables

## Recent Changes

### 2026-03-13 External Data.gov.ua Update Pipeline Foundation

#### Verification Status
- `npm test -- --runInBand src/external-data/services/external-data.service.spec.ts src/registry-index/services/registry-index.service.spec.ts` -> PASS (4/4)
- `npm run build` -> PASS
- `npm run update:external-data -- --dry-run` -> PASS

#### Backend / Operations Changes
- Added a new external-data module in:
  - `src/external-data/external-data.module.ts`
  - `src/external-data/external-data.constants.ts`
  - `src/external-data/services/external-data.service.ts`
  - `src/external-data/services/external-data.scheduler.service.ts`
  - `src/external-data/services/external-data.service.spec.ts`
  - `src/scripts/update-external-data.ts`
- Added config-driven external source support for:
  - `court_stan`
  - `court_dates`
  - `reestr`
  - `asvp`
- The new pipeline now supports:
  - remote `HEAD` metadata probing
  - conditional download by remote fingerprint
  - `--dry-run`
  - `--force`
  - ZIP extraction with host `unzip` first and JS fallback via `fflate`
  - safe target-directory replacement with rollback
  - import-state persistence in `storage/registry-index.db`
  - post-download SQLite reindex only for changed indexed sources
- Added `npm run update:external-data` with:
  - optional `--source=court_stan|court_dates|reestr|asvp`
  - optional `--dry-run`
  - optional `--force`
- Extended `RegistryIndexService` with generic import-state read/upsert helpers plus `remote_fingerprint`.
- Adjusted the legacy local registry-index cron so it skips its own `10:00` rebuild when external-data URLs are configured, avoiding duplicate scheduler contention.

#### Required Configuration
- Real `data.gov.ua` resource URLs still need to be provided via env vars such as:
  - `EXTERNAL_DATA_URLS_COURT_STAN`
  - `EXTERNAL_DATA_URLS_COURT_DATES`
  - `EXTERNAL_DATA_URLS_REESTR`
  - `EXTERNAL_DATA_URLS_ASVP`

#### Residual Risks
- JS ZIP fallback currently loads the archive into memory; large archives should prefer host `unzip`.
- The downloader is product-ready but still config-driven; production dataset URLs and any source-specific quirks still need to be supplied in environment configuration.

### 2026-03-13 Server PDF Post-Processing Pipeline Foundation

#### Verification Status
- `npm run build` -> PASS
- `npm run lint:backend` -> PASS
- `npm run build:frontend` -> PASS
- `npm run lint:frontend` -> PASS

#### Backend / Architecture Changes
- Added a server-side PDF post-processing orchestration service in:
  - `src/documents/services/pdf-post-processing.service.ts`
- Added backend endpoints:
  - `GET /documents/processing/runtime`
  - `POST /documents/:id/process-pdf`
- Extended DTO/contracts in:
  - `src/documents/dto/document.dto.ts`
- Wired the new processing flow into:
  - `src/documents/controllers/documents.controller.ts`
  - `src/documents/services/document.service.ts`
  - `src/documents/documents.module.ts`
- The new backend path now:
  - validates the source document is a PDF
  - creates and updates `document_processing_jobs`
  - downloads the original PDF through the trusted internal processing path
  - orchestrates external runtime stages for `python3 + OpenCV + unpaper + OCRmyPDF + Tesseract`
  - uploads the processed output as a new document revision
  - stores original/result artifacts and processing metadata
- Added Python integration entrypoint:
  - `scripts/pdf_postprocess_pipeline.py`
  - current role is to stabilize the command contract and runtime reporting while the real OpenCV/poppler image pipeline is being prepared on the host runtime

#### Important Limitation
- This section records the orchestration foundation only; actual host/runtime installation and venv wiring were completed in the follow-up section below.
- Queue-backed background workers and per-page artifact persistence are still not fully implemented as a separate worker pipeline; current processing still runs through the request-triggered orchestration path.

### 2026-03-13 Server-First Scan PDF Processing In UI + Real Python Page Pipeline

#### Verification Status
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS
- `npm run lint` -> PASS

#### Backend / Frontend Changes
- Reworked `scripts/pdf_postprocess_pipeline.py` from a placeholder into a real page-by-page preprocessing pipeline contract:
  - renders PDF pages via `pdftoppm`
  - performs OpenCV contour detection
  - applies perspective correction
  - applies deskew
  - crops to content
  - normalizes background
  - applies mode-specific enhancement for `document`, `black_white`, `grayscale`, `color`, and `original`
  - optionally runs `unpaper`
  - assembles processed pages back into PDF via Pillow when the runtime is available
  - emits per-page processing metadata
- Updated the document viewer/service contract so mobile-scan PDFs (`sourceKind = scan_session`) now prefer the server-side `POST /documents/:id/process-pdf` path as the primary save flow when the user has not made manual crop/corner/rotation edits.
- Browser-side viewer processing remains as a fallback for:
  - manual page geometry edits
  - non-`scan_session` PDFs
  - environments where the server runtime is not ready
- Extended frontend API/types in:
  - `src/frontend/services/document.service.ts`
  - `src/frontend/types/document.types.ts`
  - added runtime capability fetch and server-side PDF processing call support

#### Important Limitation
- The per-page Python pipeline is now implemented, but full production confidence still depends on broader regression coverage with real multi-page legal scan sets, skewed phone captures, and mixed digital/scanned PDFs.
- Queue-backed async execution, retry policy, and durable page-level artifact storage still remain follow-up work.

### 2026-03-13 Host Runtime Setup + Honest Server Runtime Statuses

#### Verification Status
- `brew install poppler tesseract tesseract-lang unpaper ocrmypdf` -> PASS
- `./.venv-pdf/bin/python -c "import numpy, cv2; from PIL import Image"` -> PASS
- `./.venv-pdf/bin/python scripts/pdf_postprocess_pipeline.py ...` on a generated 1-page test PDF -> PASS
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS
- `npm run lint` -> PASS

#### Runtime / Backend Changes
- Installed host-level PDF/OCR dependencies on this machine:
  - `poppler` (`pdftoppm`)
  - `tesseract`
  - `tesseract-lang`
  - `unpaper`
  - `ocrmypdf`
- Verified Tesseract language packs for:
  - `ukr`
  - `rus`
  - `spa`
  - `eng`
- Created a dedicated project venv at:
  - `.venv-pdf`
- Installed Python imaging/runtime packages into that venv:
  - `numpy`
  - `opencv-python-headless`
  - `pillow`
- Updated `src/documents/services/pdf-post-processing.service.ts` so backend runtime selection now:
  - prefers `PDF_POSTPROCESS_PYTHON_COMMAND` when explicitly configured
  - otherwise auto-detects `.venv-pdf/bin/python`
  - only falls back to `python3` if the project venv is absent
- Hardened runtime capability checks so they work with absolute interpreter paths inside a project directory that contains spaces/unicode characters
- Extended runtime diagnostics to report:
  - `pdftoppm`
  - `cv2`
  - `pillow`
  - aggregate `ready`

#### Frontend Changes
- Updated `src/frontend/pages/documents/DocumentViewerPage.tsx`
- Updated `src/frontend/types/document.types.ts`
- The viewer now treats the server pipeline as available only when backend runtime reports `ready = true`, instead of assuming that `python3 + pipelineScript` is enough.
- The viewer's processing summary now shows:
  - current server runtime readiness
  - detected installed dependencies
- This makes the UI status match the actual backend capability and avoids routing mobile scan PDFs into a half-ready server path.

#### Remaining Risk
- The local runtime is now installed and a synthetic 1-page PDF pipeline run passed, but this is still not equivalent to full staging proof on large, mixed-quality legal document batches.
- `ocrmypdf` and `tesseract` are available locally, but request-time orchestration can still be too heavy for very large PDFs until queue/worker execution is introduced.

### 2026-03-13 Background PDF Jobs + Page-Level Processing Artifacts

#### Verification Status
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS
- `npm run lint` -> PASS

#### Backend Changes
- Updated `src/documents/services/document.service.ts`
- Updated `src/documents/services/pdf-post-processing.service.ts`
- Updated `scripts/pdf_postprocess_pipeline.py`
- `POST /documents/:id/process-pdf` now starts an asynchronous server-side processing job instead of waiting for the whole pipeline to finish in the request.
- The backend now:
  - rejects duplicate concurrent processing for the same source PDF
  - creates the job immediately
  - processes the PDF in a background in-process runner
  - uploads the final processed/searchable PDF as a new revision
  - persists page-level artifacts for the source document job:
    - `original_page_image`
    - `processed_page_image`
    - `page_preview`
    - `ocr_text_per_page`
    - `full_ocr_text`
    - `processing_metadata`
- Internal page artifacts are uploaded into storage under a processing-job-specific folder and then marked trusted-clean through `FileScanService.markFileAsClean(...)`.
- `PdfPostProcessingService` now captures emitted page PNGs from the Python pipeline and runs per-page Tesseract OCR extraction/confidence parsing for artifact persistence.
- `scripts/pdf_postprocess_pipeline.py` can now emit rendered original/processed page images into dedicated directories for backend artifact storage.

#### Frontend Changes
- Updated `src/frontend/pages/documents/DocumentViewerPage.tsx`
- The document viewer now:
  - starts server processing and keeps the user on the current PDF
  - polls `/documents/:id/processing` while the active server job is running
  - resumes polling after a page refresh if a processing job is still active
  - navigates to the newly created processed revision as soon as backend processing completes

#### Important Limitation
- This is now a real background job flow from the user's perspective, but it is still an in-process background runner inside the Nest API instance, not a Redis/BullMQ worker yet.
- That means long-running jobs can still compete with API resources until the orchestration is moved into a dedicated worker process/queue.

### 2026-03-13 Scheduled PDF Worker + Retry/Timeout Queue Semantics

#### Verification Status
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS
- `npm run lint` -> PASS

#### Backend Changes
- Added `src/documents/services/document-pdf-processing-worker.service.ts`
- Updated `src/documents/documents.module.ts`
- Updated `src/documents/services/document.service.ts`
- PDF post-processing jobs now follow the same scheduled-worker pattern already used elsewhere in the app:
  - request creates a queued job (`status = uploaded`)
  - worker service polls due jobs every 10 seconds
  - processing happens outside the request lifecycle
- Added lightweight queue semantics inside `DocumentProcessingJob.metadata.queue`:
  - `queuedAt`
  - `nextAttemptAt`
  - `attempts`
  - `maxAttempts`
  - `timeoutMs`
  - `startedAt`
  - `finishedAt`
  - `failedAt`
  - `lastError`
- Added retry logic:
  - failed jobs are re-queued up to the configured attempt ceiling
  - timed-out jobs are put back into the queue when retry budget remains
  - jobs become terminal `failed` after retries are exhausted
- Removed the request-triggered `Promise.resolve(...runPdfProcessingJob...)` path so PDF jobs are no longer started ad hoc inside the controller/service request flow.

#### Operational Model
- The intended deployment model is now:
  - API process with `RUN_SCHEDULED_JOBS=false`
  - dedicated worker process via `src/worker.ts` with `RUN_SCHEDULED_JOBS=true`
- This gives the project a worker-style execution model without introducing BullMQ yet.

#### Remaining Risk
- This is worker-shaped infrastructure, but still polling database-backed jobs rather than using Redis/BullMQ leases.
- Cross-instance locking is still lightweight; for full horizontal safety the next step is a dedicated claim/lease model or BullMQ migration.

### 2026-03-13 ASVP Search Fix + Source Labels

#### Verification Status
- `npm test -- --runInBand src/clients/services/court-registry.service.spec.ts src/registry-index/services/registry-index.service.spec.ts` -> PASS (8/8)
- `npm run build` -> PASS
- `curl http://localhost:3000/health` -> PASS after backend restart/fix
- `TS_NODE_FILES=true node -r ts-node/register -r tsconfig-paths/register ... CourtRegistryService.searchInAsvpRegistry('Хоменко Андрій Іванович')` -> PASS (~56 ms, returned `VP_ORDERNUM=80180323`)

#### Backend / Search Changes
- Fixed the raw `asvp` fallback path in `src/clients/services/court-registry.service.ts`:
  - the native `iconv | rg` helper now terminates cleanly after `rg` finds a match instead of hanging on the pipe
  - fallback now returns the first raw match quickly when the SQLite index is still unavailable
- Added stream-based ASVP repair decoding for both live search and indexing, compatible with the requested `latin1 -> cp1251 -> utf-8` recovery flow for mojibake CSV exports.
- Standardized registry source labels:
  - `Судовий реєстр`
  - `Реєстр виконавчих проваджень`
- Added background registry-index warmup on application bootstrap in `src/registry-index/services/registry-index.bootstrap.service.ts` so missing source indexes begin rebuilding immediately after startup instead of waiting for the daily cron.
- Fixed backend startup regression in `src/documents/documents.module.ts` by importing `ConfigModule` explicitly so `PdfPostProcessingService` resolves correctly inside `DocumentsModule`.
- Updated `src/clients/controllers/clients.controller.ts` so the client-side registry search endpoint now uses the combined court + ASVP search path instead of `court_stan` only.
- Hardened combined registry search against slow `asvp` responses:
  - `searchInCaseRegistries()` now tolerates per-source failures via `Promise.allSettled`
  - `asvp` is wrapped with a short timeout in combined mode so enforcement search cannot block court-registry results for long-running raw scans
  - when native `asvp` search fails on very large files, backend skips the prohibitively slow streamed full-file fallback instead of hanging the whole request

#### Residual Risks
- Full `asvp` index construction remains a heavy local job; until the initial SQLite import finishes, fallback search returns the first raw match quickly but does not enumerate every duplicate name.
- Manual `build:registry-index` runs can still contend with another ongoing rebuild process and return `SQLITE_BUSY`; rebuilds should remain sequential.

### 2026-03-12 SQLite Registry Index For Fast Search

#### Verification Status
- `npm test -- --runInBand src/registry-index/services/registry-index.service.spec.ts src/clients/services/court-registry.service.spec.ts src/cases/services/case-registry-sync.service.spec.ts src/cases/services/case.service.spec.ts` -> PASS (17/17)
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS (existing Vite circular-chunk warning and >500 kB chunk warnings remain)
- `npm run build:registry-index -- --source=court_stan --force` -> PASS (`storage/registry-index.db`; 850,443 indexed `court_stan` participant rows)
- `npm run build:registry-index -- --source=court_dates --force` -> PASS (`court_dates` imported into `storage/registry-index.db`; 479,914 indexed rows)
- `TS_NODE_FILES=true node -r ts-node/register -r tsconfig-paths/register ... RegistryIndexService.searchCourtRegistry('Долинська Іванна Степанівна')` -> PASS (`460/670/13-ц` returned from SQLite index)

#### Backend / Search Changes
- Added a local SQLite registry index at `storage/registry-index.db`.
- Added import tables and state tracking for:
  - `court_registry_participants` + `court_registry_participants_fts`
  - `asvp_records` + `asvp_records_fts`
  - `court_dates`
  - `import_state`
  - `import_batches`
- Backend registry search now prefers SQLite index lookups first and falls back to raw CSV only when the index for that source is unavailable.
- `court_stan` preprocessing now stores one participant per row with normalized search text.
- `asvp` preprocessing stores structured debtor/creditor/org rows for FTS-backed lookup instead of scanning the 13.7 GB CSV at request time, while raw fallback now exits quickly after the first match if the index is not ready yet.
- `court_dates` now uses a regular SQL index by normalized case number instead of raw-file scans.
- Added scheduled daily index refresh at `10:00` fixed `+01:00`, but rebuilds only when source-file signatures changed.
- Added startup warmup so missing local registry indexes begin rebuilding immediately after app bootstrap.

#### Tooling
- Added manual rebuild command:
  - `npm run build:registry-index`
  - optional `--source=court_stan|asvp|court_dates`
  - optional `--force`

#### Residual Risks
- SQLite rebuilds must run sequentially. Parallel manual rebuilds can contend on the same DB file and return `SQLITE_BUSY`.
- The new rebuild logic currently watches local source files only; automatic download/update from `data.gov.ua` is still a separate follow-up track.

### 2026-03-12 Case Registry Expansion + Automatic Court-Date Events

#### Verification Status
- `npx eslint --fix src/clients/services/court-registry.service.ts src/clients/services/court-registry.service.spec.ts src/cases/services/case-registry-sync.service.ts src/cases/services/case-registry-sync.service.spec.ts src/cases/services/case.service.ts src/cases/services/case.service.spec.ts src/cases/controllers/cases.controller.ts src/cases/cases.module.ts src/frontend/pages/cases/AddCasePage.tsx src/frontend/services/case.service.ts src/frontend/types/case.types.ts` -> PASS
- `npm test -- --runInBand src/clients/services/court-registry.service.spec.ts src/cases/services/case-registry-sync.service.spec.ts src/cases/services/case.service.spec.ts` -> PASS (15/15)
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS (existing Vite circular-chunk warning and >500 kB chunk warnings remain)

#### Backend / Integration Changes
- Expanded `CourtRegistryService` so case import/search now supports three local CSV feeds:
  - `court_stan` / `court_base` for existing court-registry case search
  - `asvp` for enforcement-proceeding search with streamed Windows-1251 decoding of mojibake CSV exports
  - `court_dates` for case-number-to-hearing-date lookup
- Added `GET /cases/registry-search` to return combined court-registry + ASVP matches for case creation flows.
- Added `CaseRegistrySyncService` to:
  - auto-create or update a `court_sitting` event for `judicial_case` records when `registryCaseNumber` matches a `court_dates` row
  - soft-remove only auto-generated `court_dates` events when a case is no longer eligible
  - run a daily resync at `10:00` fixed `+01:00` (`Etc/GMT-1`) in addition to immediate sync on case create/update
- Auto-created hearing events now map:
  - `eventDate` / `eventTime` from `court_dates.date`
  - `location` from `court_dates.court_name`
  - `courtRoom` from `court_dates.court_room`
  - `responsibleContact` from `court_dates.judges`
  - sync markers into `event.participants.syncSource = "court_dates"`

#### Frontend Changes
- `AddCasePage` registry overlay now searches the new combined `/cases/registry-search` endpoint instead of court-only results.
- Added ASVP-specific prefill behavior on case creation:
  - case type -> `Виконавче провадження`
  - proceeding stage -> `Виконавче провадження`
  - institution -> `ORG_NAME`
  - registry number -> `VP_ORDERNUM`
  - auto-adds the counterparty participant from the opposite ASVP column
- Registry results table now shows the source (`Судовий реєстр` or `Реєстр виконавчих проваджень`) so the operator can distinguish court and enforcement results before selecting a row.

#### Residual Risks
- Daily court-date sync is file-backed and depends on fresh local CSV drops in `court_dates`; stale/missing files do not block case save, but they can delay or prevent automatic hearing creation until the next successful sync.
- ASVP counterparty role mapping assumes the logical inverse for `CREDITOR_NAME -> Боржник`; the user request explicitly named `Стягувач` for that branch, so this assumption should be rechecked against final business wording if the UI copy must mirror registry terminology exactly.

### 2026-03-12 Case Category Hierarchy + Court Registry Default

#### Verification Status
- `npm run lint:frontend` -> PASS
- `npm run lint:backend` -> PASS
- `npm run build:frontend` -> PASS (existing circular chunk/manualChunks warning and large chunk warnings remain)
- `npm run build` -> PASS

#### Case Category Changes
- Replaced the old flat case-type model with the new top-level business categories:
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
- Added shared frontend category normalization/label helpers in:
  - `src/frontend/utils/caseCategories.ts`
- Updated the case form to support:
  - top-level category select
  - manual `Підкатегорія справи` input
- Court-registry / CSV-derived prefill now defaults category to `Судова справа` while still allowing manual override in:
  - `src/frontend/pages/cases/AddCasePage.tsx`

#### Cross-Surface Updates
- Updated category handling across frontend view/create/edit/filter/report/document flows in:
  - `src/frontend/schemas/case.schema.ts`
  - `src/frontend/types/case.types.ts`
  - `src/frontend/components/cases/CaseFormSections.tsx`
  - `src/frontend/pages/cases/AddCasePage.tsx`
  - `src/frontend/pages/cases/CaseDetailsPage.tsx`
  - `src/frontend/pages/cases/CasesPage.tsx`
  - `src/frontend/pages/documents/DocumentComposerPage.tsx`
  - `src/frontend/pages/reports/ReportsPage.tsx`
  - `src/frontend/i18n/uk.ts`
- Updated backend DTO/entity enums in:
  - `src/cases/dto/case.dto.ts`
  - `src/database/entities/Case.entity.ts`
  - `src/database/entities/enums/case.enum.ts`

#### Open Risks / Limitations
- `Підкатегорія справи` is currently a free-text field stored in metadata, not a category-specific managed dictionary.
- Existing historical cases with legacy types are normalized on the frontend into the new categories for display/edit compatibility, but there is no migration yet rewriting stored old values in the database.

### 2026-03-12 PDF Toolbar Compaction + Viewer Processing Summary

#### Verification Status
- `npm run build:frontend` -> PASS
- `npm run lint:frontend` -> PASS

#### Frontend Changes
- Updated:
  - `src/frontend/pages/documents/DocumentViewerPage.tsx`
  - `src/frontend/pages/documents/DocumentViewerPage.css`
  - `src/frontend/services/document.service.ts`
  - `src/frontend/types/document.types.ts`
- Reworked the PDF post-processing action area into a compact toolbar closer to a text-editor command bar:
  - controls are grouped into 1-2 rows
  - buttons are icon-first instead of oversized CTA blocks
  - tooltips and labels are Ukrainian
  - processing modes, page formats, and page statuses are now localized in the UI
- Audited the visible PDF tools and kept only actions with live client-side handlers in the current viewer flow:
  - auto-enhance preset
  - page navigation
  - page rotation
  - scan-mode toggle
  - auto-frame
  - before/after compare
  - crop-to-all-pages
  - manual corner edit/reset/apply-to-all
  - processing mode and page-format selectors
  - OCR toggle
  - reset and save revision
- Extended the frontend document contract so the viewer can request `GET /documents/:id/processing` and show lightweight backend processing-summary data when revision-linked processing jobs/artifacts exist.
- Fixed a revision-upload gap where `createRevision(...)` did not forward `metadataJson`, which prevented processed revision metadata from reaching backend processing-summary persistence.

#### Important Limitation
- This pass compacted and localized the toolbar, but it did not complete the full server-side background processing module from the PDF post-processing TЗ.
- Backend worker/queue orchestration and persisted per-page image artifacts are still pending.

### 2026-03-12 Document Viewer Personal Folder Breadcrumb Fix

#### Verification Status
- `npm run lint:frontend` -> PASS

#### Frontend Changes
- Updated `src/frontend/pages/documents/DocumentViewerPage.tsx`
- Route-based document breadcrumbs now include the personal root segment `Власна` for documents that are not linked to a client or case.
- Personal/root-level documents now display as:
  - `Головна / Файли / Власна / <назва документа>`
  instead of collapsing directly to `Файли / <назва документа>`.

#### Important Limitation
- This fix only normalizes the viewer breadcrumb for personal documents; client/case-aware breadcrumb expansion inside the viewer still remains simpler than the full explorer tree on `DocumentsPage`.

### 2026-03-12 PDF Post-Processing Upgrade + Web Image-to-PDF + Mobile Picker Expansion

#### Verification Status
- `npm run lint` -> PASS
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS (existing circular chunk/manualChunks warning and large chunk warnings remain)
- `npm run lint:frontend` -> PASS
- `npm run build:frontend` -> PASS (manual 4-corner editor, compare split, and perspective normalization compiled; existing circular chunk/manualChunks warning and large chunk warnings remain)

#### Backend / Frontend Changes
- Extended upload metadata plumbing in:
  - `src/documents/dto/document.dto.ts`
  - `src/documents/services/document.service.ts`
  - `src/frontend/types/document.types.ts`
  - `src/frontend/services/document.service.ts`
- Upload/revision requests can now carry `metadataJson`, which is merged into stored document metadata for processed revisions.
- Added shared scan-processing helpers in:
  - `src/frontend/utils/scanProcessing.ts`
  - page-level PDF scan analysis for brightness, border darkness, shadow bias, fill ratio, and orientation
  - processing modes: `Color`, `Document`, `Black & White`, `Grayscale`, `Original`
  - target page formats: `Auto detect`, `Original size`, `A4 portrait`, `A4 landscape`, `A5`, `Letter`, `Legal`
  - browser-side contrast/background cleanup before PDF rebuild
  - processed-page canvas export with page-format normalization
- Extended document viewer PDF post-processing workflow in:
  - `src/frontend/pages/documents/DocumentViewerPage.tsx`
  - `src/frontend/pages/documents/DocumentViewerPage.css`
  - PDF viewer now supports:
    - explicit one-click `Покращити документ` auto-mode
    - scan-vs-digital PDF type heuristics
    - per-page crop adjustment with auto-framed initial bounds
    - `before/after` split compare view
    - apply-current-crop-to-all-pages helper
    - page thumbnail sidebar for post-page navigation
    - manual 4-corner page editing with reset/apply-to-all actions
    - browser-side perspective normalization from adjusted corners
    - OCR toggle with `ukr+rus+spa+eng`
    - processing progress feedback
    - per-page processing status and OCR confidence display
  - saving a scan-mode revision now rebuilds the PDF from processed canvases, can generate searchable OCR PDFs, and persists processing metadata on the saved revision
  - if revision save fails specifically on extended processing metadata, the UI retries save without that metadata so the processed PDF revision still gets created instead of surfacing a hard `500`
- Expanded mobile scan page inputs in:
  - `src/frontend/pages/documents/MobileScanPage.tsx`
  - `src/frontend/pages/documents/MobileScanPage.css`
  - the mobile scanner now exposes separate entry points for:
    - `Зробити фото`
    - `З медіатеки або файлів`
- Added browser-side image bundling on the files workspace in:
  - `src/frontend/pages/documents/DocumentsPage.tsx`
  - `src/frontend/pages/documents/DocumentsPage.css`
  - queued website uploads can now be merged into one PDF before upload via `Зібрати зображення в 1 PDF`

#### Important Limitations
- OCR still runs entirely in the browser and uses Tesseract language assets downloaded/cached on first use; offline or CSP-restricted deployments may need self-hosted worker/lang assets later.
- The mobile scan finalize flow still creates the first PDF as an image-based bundle; the richer cleanup/OCR path remains a post-processing revision on the site.
- Autoanalysis and crop detection are heuristic and work best on bright paper-on-background pages.
- Processing artifacts are still persisted mainly as revision metadata plus the resulting PDF; separate backend-managed storage for `processed_page_image`, `ocr_text_per_page`, queue-backed processing statuses, and background retry orchestration is still not implemented yet.

### 2026-03-12 Unicode Filename Header Fix For Document Content

#### Verification Status
- `npm run lint:backend` -> PASS
- `npm run lint:frontend` -> PASS
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS (existing circular chunk/manualChunks warning and large chunk warnings remain)
- authenticated `GET /v1/documents/:id/content?disposition=inline` for a scan PDF with Cyrillic filename -> `200 OK`

#### Backend / Frontend Changes
- Fixed `500 Internal Server Error` when opening documents whose original filename contains Cyrillic or other non-ASCII characters in:
  - `src/documents/controllers/documents.controller.ts`
- `Content-Disposition` for `/documents/:id/content` and `/documents/:id/download` now uses:
  - ASCII-safe fallback `filename="..."`
  - UTF-8 RFC 5987 `filename*=UTF-8''...`
- This prevents Node/Express from throwing `ERR_INVALID_CHAR` when the viewer requests inline PDF content for files such as `Скан-120326-1540.pdf`.
- Improved viewer error extraction in:
  - `src/frontend/pages/documents/DocumentViewerPage.tsx`
- The document viewer now surfaces backend-provided messages through shared frontend error normalization instead of defaulting to raw Axios status text where possible.

#### Important Limitation
- The fix is specific to response-header filename encoding; it does not change the existing viewer capability limits for DOCX/ZIP/XLSX editing.

### 2026-03-12 Multi-Format Document Viewer + Inline Content Access

#### Verification Status
- `npm run lint:frontend` -> PASS
- `npm run lint:backend` -> PASS
- `npm run build:frontend` -> PASS (new lazy `pdf-viewer`, `docx-viewer`, and `file-viewer` chunks emitted; existing circular chunk/manualChunks warning and large chunk warnings remain)
- `npm run build` -> PASS
- `npm test -- --runInBand` -> FAIL (1 suite: pre-existing TypeScript error in `src/calculations/services/calculation.service.ts:347`; 28 suites passed, 1 skipped, 163 tests passed)

#### Frontend Changes
- Added route-based file viewer/editor in:
  - `src/frontend/pages/documents/DocumentViewerPage.tsx`
  - `src/frontend/pages/documents/DocumentViewerPage.css`
- Added `/documents/:id` route in:
  - `src/frontend/App.tsx`
- The new viewer now supports:
  - inline PDF preview with page navigation and per-page rotation draft
  - image crop/zoom/rotation editing
  - plain-text document editing for `txt/md/csv/json/xml/html/log/rtf`-style files
  - DOCX inline rendering
  - ZIP archive browsing with preview for nested text/image/PDF entries
- Text, image, and PDF edits now save as a new document revision instead of mutating the original file, reusing:
  - `parentDocumentId`
  - incremented `version`
  - inherited access metadata
- Updated file-list actions in:
  - `src/frontend/pages/documents/DocumentsPage.tsx`
- Documents registry rows/cards now expose `Відкрити`, and downloads now use the authenticated document download endpoint instead of browser-opened signed URLs.
- Extended frontend document API/types in:
  - `src/frontend/services/document.service.ts`
  - `src/frontend/services/api.ts`
  - `src/frontend/types/document.types.ts`
- Updated Vite chunking in:
  - `vite.config.ts`
- New document-viewer-related dependencies added:
  - `react-pdf`
  - `react-easy-crop`
  - `docx-preview`
  - `fflate`

#### Backend / API Changes
- Added authenticated content-serving endpoints in:
  - `src/documents/controllers/documents.controller.ts`
- New endpoints:
  - `GET /documents/:id/content?disposition=inline|attachment`
  - `GET /documents/:id/download`
- Extended signed URL DTO/service behavior in:
  - `src/documents/dto/document.dto.ts`
  - `src/documents/services/document.service.ts`
- `generateSignedUrl(...)` now:
  - accepts `disposition = inline | attachment`
  - accepts optional `contentType`
  - correctly interprets `expiresIn` in seconds instead of mixing seconds with milliseconds
- Document uploads now treat `parentDocumentId` as a revision source and inherit:
  - case/client linkage
  - access level/scope
  - description/metadata where relevant
  - next `version`
- Expanded backend upload MIME allow-lists in:
  - `src/documents/services/document.service.ts`
  - `src/file-storage/services/file-storage.service.ts`
- Newly allowed preview-oriented file families now include:
  - text-like documents (`txt`, `md`, `csv`, `json`, `xml`, `html`, `rtf`)
  - ZIP archives
  - additional image types such as `gif`/`webp`

#### Security / Access Notes
- Inline preview still goes through tenant-authenticated backend access and remains blocked until the malware-scan gate reports the file as safe.
- The trusted internal scan-PDF recovery path now also covers inline content access, not only signed URL generation.

#### Important Limitations
- DOCX and ZIP are currently view-only inside the viewer; there is no browser-side save-back flow for those formats in this pass.
- Spreadsheet (`xls/xlsx`) preview/edit is still not implemented even though upload support remains.
- Vite production build still reports the existing circular chunk/manualChunks warning and large chunk warnings; the new viewer is lazy-loaded, but PDF worker and viewer assets still add noticeable route-level weight.
- Full Jest verification is still blocked by the unrelated calculations TypeScript failure in `src/calculations/services/calculation.service.ts:347`.

### 2026-03-12 Mobile Responsiveness Hardening + Viewport Audit

#### Verification Status
- `npm run lint:frontend` -> PASS
- `npm run build:frontend` -> PASS (existing circular chunk/manualChunks warning and large TinyMCE chunk warning remain)
- `npm run test:frontend:smoke` -> PASS (3/3)

#### Frontend / UX Changes
- Fixed the authenticated mobile shell so the mobile navigation no longer renders as a second flex column beside content on iPhone-width screens:
  - `src/frontend/App.tsx`
  - `src/frontend/App.css`
  - `src/frontend/components/navigation/Navigation.tsx`
  - `src/frontend/components/navigation/Navigation.css`
- Mobile navigation now uses a fixed safe-area-aware header with a top-triggered drawer menu, an overlay scrim for the expanded menu, automatic close-on-route-change behavior, and body scroll lock while the menu is open.
- Removed the persistent floating bottom navigation bar on mobile so it no longer covers form controls or content near the bottom of long pages.
- Tightened mobile scan-session presentation in:
  - `src/frontend/pages/documents/ScanSessionPage.css`
- The scan-session form/status layout now keeps QR, stats, and page cards in a single readable column on narrow screens.
- Fixed the files workspace mobile header actions in:
  - `src/frontend/pages/documents/DocumentsPage.css`
- `/documents` page actions now stack full-width on mobile, and the previous flex-wrap interaction that pushed header actions off-screen has been removed.
- Added browser regression coverage in:
  - `tests/playwright/frontend-smoke.spec.ts`
- The Playwright smoke suite now includes an iPhone 13 viewport audit that asserts critical authenticated routes stay within the visible viewport width, that the mobile menu trigger is visible, and that the removed bottom navigation bar does not return.

### 2026-03-12 Pricelist Error Banner Visibility Fix

#### Verification Status
- `npm run lint:frontend` -> PASS
- `npm run build:frontend` -> PASS (existing circular chunk/manualChunks warning and large TinyMCE chunk warning remain)

#### Frontend Changes
- Fixed shared alert rendering in:
  - `src/frontend/components/Alert.tsx`
- `Alert` now renders either `children` or `message`, preserves optional custom `className`, and uses a non-submitting close button.
- Normalized pricelist error extraction in:
  - `src/frontend/pages/pricelists/PricelistsPage.tsx`
  - `src/frontend/pages/pricelists/PricelistEditorPage.tsx`
  - `src/frontend/pages/pricelists/PricelistDetailsPage.tsx`
  - `src/frontend/utils/errors.ts`
- Pricelist list/details/edit screens now surface backend validation arrays and API-provided messages instead of collapsing to an empty red banner.

#### Important Limitations
- This change fixes hidden error text, not the underlying backend/API failure itself; if a pricelist flow still throws, the UI now exposes the real message for follow-up debugging.
- No manual browser regression walkthrough was run for the exact open-edit-close pricelist path in this turn; verification is currently lint/build only.

### 2026-03-12 Calendar Navigation Modal Guard + Auth Return-To Routing

#### Verification Status
- `npm run lint:frontend` -> PASS
- `npm run build:frontend` -> PASS (existing circular chunk/manualChunks warning and large TinyMCE chunk warning remain)

#### Frontend Changes
- Hardened protected-route/login/logout redirect behavior in:
  - `src/frontend/App.tsx`
  - `src/frontend/pages/auth/LoginPage.tsx`
  - `src/frontend/components/navigation/Navigation.tsx`
  - `src/frontend/services/api.ts`
  - `src/frontend/utils/authRedirect.ts`
- Protected route entry, explicit logout, and 401 refresh-failure redirects now preserve the originally requested in-app URL through `?redirect=...`.
- Post-login navigation now returns the user to the protected page they originally tried to open instead of always forcing `/dashboard`.
- Added cross-tab auth state synchronization in:
  - `src/frontend/components/AuthSessionSync.tsx`
  - `src/frontend/services/auth-storage.ts`
- Same-browser tabs can now reopen protected routes like `/calendar` without forcing a second login as long as another authenticated tab is still open.
- Non-persistent sessions now keep a local auth mirror plus active-tab tracking so route deep links can bootstrap in a new tab while the current browser session is still alive.
- Hardened calendar route entry in:
  - `src/frontend/pages/calendar/CalendarPage.tsx`
- Event-detail modal rendering is now gated by a real selected event instead of always mounting an empty modal shell, and the selected event is reset on client-side route entry to avoid stale modal carry-over.

#### Important Limitations
- Non-persistent cross-tab session cleanup relies on `pagehide` last-tab detection; abrupt browser termination can still leave a stale local auth mirror until manual logout or token expiry clears it.
- No manual browser regression walkthrough was run for the exact sidebar-to-calendar path in this turn; verification is currently lint/build only.

### 2026-03-12 Event Title Optional With Type Fallback

#### Verification Status
- `npx eslint src/frontend/pages/events/AddEventPage.tsx` -> PASS
- `npm run build:frontend` -> PASS (existing circular-chunk/manualChunks warning and large TinyMCE chunk warning remain)

#### Frontend Changes
- Refined event creation submit behavior in:
  - `src/frontend/pages/events/AddEventPage.tsx`
- `Назва події` is no longer required during event creation.
- If the field is left empty, the saved title now falls back to the selected event-type label, for example:
  - `Зустріч`
  - `Судове засідання`

#### Important Limitations
- The fallback title is applied at submit time only; the input itself remains empty unless the user explicitly types a custom value.

### 2026-03-12 Files Root-Level Client Folders + History-Aware Navigation + Flexible Scan Destinations

#### Verification Status
- `npm run lint` -> PASS
- `npm run build:frontend` -> PASS (existing circular-chunk/manualChunks warning and large TinyMCE chunk warning remain)
- `npm run build` -> PASS

#### Frontend Changes
- Refined files workspace navigation in:
  - `src/frontend/pages/documents/DocumentsPage.tsx`
- `/documents` root icon view now shows:
  - `Власна` first
  - client folders on the same root level instead of grouping them under a separate `Клієнти` folder
- Client folders and nested case folders are now rendered from the client/case registries even when no documents exist yet.
- Folder navigation now syncs through the `?folder=` query string so browser back/forward traverses folder levels inside the files workspace instead of immediately leaving the page.
- The in-page `Назад` action now moves one folder level up instead of delegating to raw browser history.
- The root empty-state copy was removed so the explorer root stays visually clean while still showing the folder structure.
- Reworked scan-session setup in:
  - `src/frontend/pages/documents/ScanSessionPage.tsx`
  - `src/frontend/pages/documents/ScanSessionPage.css`
- `Додати скан` now supports optional destination binding:
  - nothing selected -> document is saved in the root catalog
  - `Власна` selected -> document is saved in the personal folder
  - client selected without case -> document is saved in the client root
  - client + case selected -> document is saved in the case folder inside that client
- Desktop scan setup now shows the effective destination summary and warns when the generated mobile URL still points to `localhost`, which will not open from a phone.

#### Backend / API Changes
- Extended scan-session persistence and finalize flow in:
  - `src/database/entities/ScanSession.entity.ts`
  - `src/database/migrations/1711000000000-AddScanSessionsWorkflow.ts`
  - `src/documents/dto/scan-session.dto.ts`
  - `src/documents/controllers/scan-sessions.controller.ts`
  - `src/documents/services/scan-session.service.ts`
  - `src/frontend/services/document.service.ts`
  - `src/frontend/types/document.types.ts`
- Scan sessions are no longer case-bound only:
  - backend now stores `destinationScope = root | personal | client`
  - client binding is optional
  - case binding is only accepted when a client is selected
- Finalized scan PDFs now use the timestamp-based naming convention:
  - `Скан-ddmmyy-hhmm.pdf`
- Added `MOBILE_SCAN_BASE_URL` override support for QR/mobile links so local development can point phones to a LAN IP or tunnel instead of `localhost`.
- Added development-safe storage fallback in:
  - `src/file-storage/services/storage-provider.service.ts`
- When `STORAGE_PROVIDER=s3` is configured in non-production but the MinIO/S3 endpoint is unreachable (`ENOTFOUND`, `ECONNREFUSED`, `ECONNRESET`, `ETIMEDOUT`), uploads/downloads/URL generation now fall back to local storage instead of failing mobile scan flows with HTTP 500.
- Hardened multipart upload handling in:
  - `src/file-storage/services/file-storage.service.ts`
- Disk-backed Multer uploads now read the temporary file into a buffer before storage-provider upload and clean up the temp file afterward, which fixes mobile scan page uploads in local development where Multer stores files under `./uploads`.

#### Important Limitations
- OCR/searchable-text-layer generation is still not wired; finalized PDFs remain image-based.
- Smart crop, perspective correction, deskew, and image normalization are still workflow placeholders only.
- The updated scan-session migration/schema change was not executed in this turn; PostgreSQL environments still need `npm run migration:run`.

### 2026-03-12 Event Audience Toggle On Add Event Page

#### Verification Status
- `npx eslint src/frontend/pages/events/AddEventPage.tsx` -> PASS
- `npm run build:frontend` -> FAIL (`Could not resolve "./pages/documents/ScanSessionPage" from "src/frontend/App.tsx"`; transient local file-resolution issue, immediate rerun succeeded)
- `npm run build:frontend` -> PASS (existing circular-chunk/manualChunks warning and large TinyMCE chunk warning remain)

#### Frontend Changes
- Reworked the add-event audience flow in:
  - `src/frontend/pages/events/AddEventPage.tsx`
  - `src/frontend/pages/events/AddEventPage.css`
- Replaced the old single `Клієнт (необов'язково)` field with a dedicated `Подія для` toggle:
  - `Користувач`
  - `Клієнт`
- The form now behaves as follows:
  - `Користувач` shows the current authenticated user and hides client/case linkage
  - `Клієнт` shows client selection and only then enables optional case selection
- Selected audience data is now persisted into event `participants` metadata so the link is not lost when:
  - a client is selected without choosing a case
  - the event is created as a user-scoped/internal event
- `Назва події` is now optional on create:
  - if the field is empty, submit falls back to the selected event-type label such as `Зустріч` or `Судове засідання`
- The add-event options loader no longer refetches clients/cases on every client selection change; it now resolves preselected `caseId -> clientId` once during initial load.

#### Important Limitations
- Backend events still do not have dedicated `clientId` or `userId` columns beyond `caseId`; this change stores audience context in `participants.subject` / `participants.labels`, so subject-aware filtering/reporting is still metadata-based rather than queryable.
- No manual browser regression pass was run for the new toggle interaction on desktop/mobile in this turn.

### 2026-03-12 Currency Display Normalization + Document Amount-In-Words Fix

#### Verification Status
- `npm run lint` -> PASS
- `npm test -- --runInBand` -> PASS (29 passed, 1 skipped suite / 166 passed tests; trust/redis logger output is expected)
- `npm run build:all` -> PASS (Nest build + Vite production build; existing circular-chunk/manualChunks warning and large TinyMCE chunk warning remain)

#### Frontend Changes
- Added shared currency helpers in:
  - `src/frontend/utils/currency.ts`
- User-facing money display now normalizes `UAH`, `uah`, and `₴` to `грн` in:
  - calculations helpers/details
  - document composer
  - reports, dashboard, mail, billing, and pricelist screens
  - frontend i18n currency formatting
- Added unit coverage for currency formatting and amount-in-words output in:
  - `src/frontend/utils/currency.spec.ts`
- Fixed `calculation.totalAmountWords` in:
  - `src/frontend/pages/documents/DocumentComposerPage.tsx`
- Document templates now receive Ukrainian amount-in-words text such as:
  - `одна тисяча двісті грн 00 коп`

#### Backend / Template Changes
- Normalized invoice PDF currency output to `грн` display in:
  - `src/invoices/services/invoice.service.ts`
- Replaced hard-coded `UAH` examples in notification templates with `грн` in:
  - `src/notifications/templates/email-templates.ts`

#### Important Limitations
- ISO currency codes such as `UAH` are intentionally still stored internally and passed to billing providers where required; this change only normalizes user-facing display/copy.
- No manual browser regression or template print preview walkthrough was run in this turn.
- Vite production build still reports the pre-existing circular chunk/manual chunk warning and large TinyMCE chunk warning.

### 2026-03-12 Files Workspace + Document Creation + Mobile Scan Foundation

#### Verification Status
- `npm run lint` -> PASS
- `npm run build:frontend` -> PASS
- `npm run build` -> PASS

#### Frontend Changes
- Reworked `Файли` into a two-mode workspace in:
  - `src/frontend/pages/documents/DocumentsPage.tsx`
  - `src/frontend/pages/documents/DocumentsPage.css`
- `/documents` now supports:
  - icon view with Finder/Explorer-style folder navigation
  - list view with columns `назва / клієнт / справа / дата створення / дата редагування / швидкі дії`
  - filters for search, type, status, and access level
  - top-level actions for `Створити з шаблону`, `Створити текстовий документ`, `Завантажити файл`, `Додати скан`
  - bulk drag-and-drop upload queue with editable file names before save
- Added route-based document generation in:
  - `src/frontend/pages/documents/DocumentComposerPage.tsx`
  - `src/frontend/pages/documents/DocumentComposerPage.css`
- Document generation now supports:
  - create from saved template with optional client/case/calculation/event binding
  - create plain text document without variables
  - HTML export into `documents` with source metadata
- Added template-registry reuse and direct handoff from template builder in:
  - `src/frontend/pages/print-forms/templateRegistry.ts`
  - `src/frontend/pages/print-forms/PrintFormsPage.tsx`
- `Конструктор шаблонів` now exposes `Створити документ` for saved templates.

#### Backend / API Changes
- Added mobile scan-session foundation in:
  - `src/database/entities/ScanSession.entity.ts`
  - `src/database/entities/ScanPage.entity.ts`
  - `src/documents/services/scan-session.service.ts`
  - `src/documents/controllers/scan-sessions.controller.ts`
  - `src/database/migrations/1711000000000-AddScanSessionsWorkflow.ts`
- Implemented API for:
  - create case-bound scan session
  - validate/open mobile session via one-time token
  - upload/delete/reorder scan pages
  - finalize uploaded pages into a PDF attached to the case documents registry
- Added desktop/mobile scan routes in:
  - `src/frontend/pages/documents/ScanSessionPage.tsx`
  - `src/frontend/pages/documents/MobileScanPage.tsx`
  - `src/frontend/App.tsx`
- Extended document upload metadata for generated/template/text/scan sources in:
  - `src/documents/dto/document.dto.ts`
  - `src/documents/services/document.service.ts`
  - `src/frontend/types/document.types.ts`
  - `src/frontend/services/document.service.ts`

#### Important Limitations
- OCR is status-tracked foundation only in this pass:
  - scan sessions expose OCR-related status fields
  - finalized PDFs are assembled from uploaded images
  - live OCR/searchable-text-layer generation is not yet wired to an OCR engine
- Smart crop, perspective correction, deskew, and thumbnail/processed-image pipeline stages are not yet implemented beyond the persisted workflow model.
- The new scan-session migration was added but not executed in this turn; local sqlite dev still works via `synchronize`, while PostgreSQL environments still need `npm run migration:run`.

### 2026-03-12 Calculations Multi-Pricelist Selection + Tabular Details

#### Verification Status
- `npm run lint:frontend` -> PASS
- `npm run build:frontend` -> PASS
- `npm run build` -> PASS

#### Frontend Changes
- Expanded income calculation creation in:
  - `src/frontend/pages/calculations/CalculationCreatePage.tsx`
  - `src/frontend/pages/calculations/CalculationCreatePage.css`
- `Прибутковий` calculations now:
  - support selecting multiple pricelists at once via checkbox list
  - merge services from all selected pricelists into one selector
  - group service choices by `прайс-лист / категорія / підкатегорія`
  - keep only the service name in the finished calculation view
  - persist selected pricelist IDs/names into calculation metadata for later display
- Reworked the read-only calculation card in:
  - `src/frontend/pages/calculations/CalculationDetailsPage.tsx`
  - `src/frontend/pages/calculations/CalculationDetailsPage.css`
- The finished calculation now renders line items as a business-style table with:
  - `№`
  - `Назва послуги`
  - `Кількість`
  - `Од. виміру`
  - `Сума`
  - footer row `Загалом`
- Added amount-in-words formatting and calculation display helpers in:
  - `src/frontend/pages/calculations/calculationPage.utils.ts`
- Added template variables in:
  - `src/frontend/pages/print-forms/templateBuilder.utils.ts`
  - `calculation.totalAmount`
  - `calculation.totalAmountWords`

#### Backend / Data Changes
- Calculation line persistence now stores unit metadata needed for the read-only table in:
  - `src/database/entities/CalculationItem.entity.ts`
  - `src/calculations/services/calculation.service.ts`
- Added migration:
  - `src/database/migrations/1710900000000-StoreCalculationItemCodeAndUnitType.ts`
- New calculation items no longer append the internal code to `description`; the service name stays clean for end-user documents and act-style tables.

#### Important Limitation
- Existing calculations created before the new migration may still have older description text and may not have persisted `unitType` / `code`, so their table view can fall back to generic units until data is recreated or backfilled.

### 2026-03-12 Calculations Income Pricelist Flow Restored

#### Verification Status
- `npm run lint:frontend` -> PASS
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Restored pricelist-driven income calculation authoring in:
  - `src/frontend/pages/calculations/CalculationCreatePage.tsx`
  - `src/frontend/services/pricelist.service.ts`
- Income calculations now:
  - preload active pricelists for the create route
  - require selecting a pricelist before save
  - require selecting each service row from the chosen pricelist
  - auto-fill line description, code, unit type, duration/quantity, and unit price from the selected pricelist item
  - include `pricelistId` and `pricelistItemId` in the create payload
- Restored the source file for the shared profile form in:
  - `src/frontend/components/profile/UserProfileDetailsForm.tsx`
  - `src/frontend/types/profile.types.ts`
- The profile-form restoration was needed to unblock frontend build verification after the source component had gone missing; no calculations behavior was moved into the profile area.

#### Important Limitation
- Income calculation creation now intentionally depends on active pricelists. If a tenant has no active pricelists or no active items inside the selected pricelist, the income form cannot be completed until those reference records are created.

### 2026-03-12 Frontend UI Copy Cleanup

#### Verification Status
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Removed internal/product-facing explanatory copy from user-visible pages so the interface no longer exposes implementation wording about backend flows, launch scope, preview mode, tenant internals, or service states.
- Cleaned UI text in:
  - `src/frontend/pages/chat/ChatPage.tsx`
  - `src/frontend/pages/mail/MailPage.tsx`
  - `src/frontend/pages/reports/ReportsPage.tsx`
  - `src/frontend/pages/settings/SettingsPage.tsx`
  - `src/frontend/pages/audit/AuditPage.tsx`
  - `src/frontend/pages/users/UsersPage.tsx`
  - `src/frontend/pages/onboarding/OnboardingWizard.tsx`
  - `src/frontend/pages/pricelists/PricelistEditorPage.tsx`
  - `src/frontend/pages/pricelists/PricelistDetailsPage.tsx`
  - `src/frontend/pages/clients/AddClientPage.tsx`
- Removed `ModulePhaseNotice` usage from chat, mail, and reports where the notice content described internal rollout state instead of user actions.
- Replaced mixed-language/system-facing labels with normal interface labels, including:
  - settings summary cards
  - audit filters and stat captions
  - invite and registry helper text

#### Important Limitations
- This pass only cleaned visible frontend copy; it did not change routes, permissions, or data flow.
- `vite build` still emits the pre-existing circular/manual chunk warnings unrelated to this copy cleanup.

### 2026-03-12 Template Variable Audit + Compact Two-Row Rich Text Toolbar

#### Verification Status
- `npm run lint:frontend` -> PASS
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Audited `/print-forms` placeholders against the actual create/edit forms for:
  - user profile
  - client
  - case
  - event
  - calculation
- Removed placeholder entries not backed by those forms in:
  - `src/frontend/pages/print-forms/templateBuilder.utils.ts`
- Kept derived placeholders only where they are direct compositions of already captured form data:
  - full names
  - full addresses
  - case participant summaries
  - event date+time
- Added the requested explicit placeholders:
  - `user.city`
  - `user.emailLogin`
  - `user.legalForm`
  - `user.legalEntityName`
  - `user.legalEntityDisplayName`
  - `user.edrpou`
  - `user.additionalAddresses`
  - `calculation.selectedTable`
  - `user.positionGenitive`
  - `user.director.fullNameGenitive`
  - `user.director.positionGenitive`
  - `client.director.fullNameGenitive`
  - `client.director.positionGenitive`
- Added per-variable default genitive mode so these explicit placeholders insert `|genitive` tokens directly instead of depending only on the global checkbox in:
  - `src/frontend/pages/print-forms/templateBuilder.utils.ts`
  - `src/frontend/pages/print-forms/PrintFormsPage.tsx`
- Expanded the TinyMCE command set back toward a more Word-like editor while keeping the toolbar compact:
  - added `charmap`, `insertdatetime`, `pagebreak`, `visualblocks`, `visualchars`
  - added strikethrough plus indent/outdent controls
  - switched toolbar rendering to wrapped mode
  - tightened toolbar/button sizing in `src/frontend/pages/print-forms/PrintFormsPage.css`
- Localized TinyMCE toolbar/menu hints to Ukrainian with a local translation registry in:
  - `src/frontend/pages/print-forms/tinymceUk.ts`
- Made the variables rail follow the page scroll and reduced its footprint:
  - sticky desktop behavior for the variables panel
  - narrower default width and slightly smaller text density
  - collapse/expand button for the `Змінні` rail in `src/frontend/pages/print-forms/PrintFormsPage.tsx`
  - collapsed rail state styling in `src/frontend/pages/print-forms/PrintFormsPage.css`
  - editor content now uses autoresize so long templates scroll at the page level instead of inside a fixed-height editor viewport
  - expanded variable group headers now stay pinned at the top of the variable list while scrolling that group
  - variable groups are collapsed again after placeholder insertion
  - after sticky proved unreliable inside the fixed-topbar app layout, the variables rail was moved to an explicit `static/fixed/bottom` positioning flow driven by scroll/resize measurement in `src/frontend/pages/print-forms/PrintFormsPage.tsx`
- Saving a template now switches the screen into a document-style preview mode:
  - after `Зберегти шаблон`, the editor opens an A4-style preview surface based on the printable HTML
  - the preview mode hides the variable rail and offers an explicit `Редагувати` action to return to editing
- `calculation.selectedTable` now inserts as a block table placeholder instead of inline text:
  - intended for acts, invoices, and appendices with columns like `№`, `Назва послуги`, `Кількість`, `Од. виміру`, `Сума`
  - rendered as a non-editable table block both in the TinyMCE canvas and in printable preview/HTML
  - no sample service rows are embedded in the template itself; the block explicitly indicates that rows must be injected later from the selected calculation during document generation
- Rebuilt the shared user profile form as one dynamic form for:
  - `SELF_EMPLOYED`
  - `FOP`
  - `LEGAL_ENTITY`
- The profile form now supports:
  - conditional block composition by `organizationType`
  - dedicated `legalEntity` block for legal entities
  - director auto-copy from personal data
  - legal/factual address auto-copy
  - dynamic additional phones, emails, and addresses
  - FOP registration block
  - LEGAL_ENTITY company form, own company name, ЄДРПОУ, and taxation data
- Profile/frontend/backend contract alignment was updated in:
  - `src/frontend/components/profile/UserProfileDetailsForm.tsx`
  - `src/frontend/components/profile/UserProfileDetailsForm.css`
  - `src/frontend/types/profile.types.ts`
  - `src/frontend/services/profile.service.ts`
  - `src/users/dto/profile.dto.ts`
  - `src/auth/services/users.service.ts`
  - `src/auth/services/auth.service.ts`
  - `src/frontend/types/auth.types.ts`
  - `src/frontend/pages/onboarding/OnboardingWizard.tsx`

#### Important Limitations
- Genitive conversion remains heuristic and is safest for names and short position titles rather than arbitrary legal prose.
- The local TinyMCE Ukrainian translation covers the active toolbar/menu strings used in this screen and may need extension if more editor features are enabled later.
- Existing locally saved templates may still contain previously inserted legacy placeholders until users replace them manually.
- The self-hosted TinyMCE build remains a heavy isolated chunk, and Vite still reports the pre-existing circular/manual chunk warnings during `npm run build:frontend`.

### 2026-03-12 Calculations Add Flow Returned To Same Tab

#### Verification Status
- `npm run lint:frontend` -> PASS
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Updated `src/frontend/pages/calculations/CalculationsPage.tsx` so `Додати розрахунок` keeps the explicit `Прибутковий` / `Видатковий` selection but now navigates in the current tab instead of opening a separate browser tab/window.
- The route-based create/view flow remains unchanged:
  - `/calculations/add?type=income|expense`
  - `/calculations/:id`
- Result:
  - the user stays in the same browser tab during the transition from register to the dedicated create form
  - after save, the app still redirects to the read-only calculation card

#### Important Limitations
- The shared `RecordActionsMenu` still supports `newTab` for other internal flows if explicitly configured, but calculations no longer use it
- `vite build` still emits the pre-existing circular/manual chunk warnings unrelated to this navigation change

### 2026-03-12 Calculations Add Flow Session Fix For New Tab

#### Verification Status
- `npm run lint:frontend` -> PASS
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Fixed the new-tab `Додати розрахунок` flow in:
  - `src/frontend/components/RecordActionsMenu.tsx`
- Internal `newTab` route actions no longer rely on anchor-based `target="_blank"` navigation.
- Same-origin routes now open through `window.open(...)` from the direct user click handler, which preserves the opener relationship needed for non-persistent auth sessions that live in `sessionStorage`.
- Result:
  - clicking `Додати розрахунок` -> `Прибутковий` / `Видатковий` no longer drops the user onto `/login` when the current session is non-persistent
  - the dedicated calculations create route now opens in a new tab/window and stays authenticated as intended

#### Important Limitations
- This fix intentionally preserves `window.opener` for internal route actions opened through `RecordActionsMenu`; if external URLs are ever added to this menu, they should use a separate safe external-link path with `noopener` / `noreferrer`

### 2026-03-11 Calculations Route-Based Create + Read-Only Details Flow

#### Verification Status
- `npm run lint:frontend` -> PASS
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Replaced the remaining inline calculations authoring flow with dedicated route-based screens:
  - `src/frontend/pages/calculations/CalculationCreatePage.tsx`
  - `src/frontend/pages/calculations/CalculationCreatePage.css`
  - `src/frontend/pages/calculations/CalculationDetailsPage.tsx`
  - `src/frontend/pages/calculations/CalculationDetailsPage.css`
- Added new application routes in:
  - `src/frontend/App.tsx`
  - `/calculations/add`
  - `/calculations/:id`
- The `Додати розрахунок` page action in `src/frontend/pages/calculations/CalculationsPage.tsx` now:
  - offers explicit `Прибутковий` / `Видатковий` selection
  - opens the selected create route in the current tab
- The create flow now:
  - loads client/case reference data through `src/frontend/services/case.service.ts` and `src/frontend/services/client.service.ts`
  - supports manual line-item entry for income and expense calculations
  - redirects to the created calculation card immediately after a successful save
- The new calculation details screen is read-only by default and exposes workflow/status actions without returning to inline editing:
  - open linked client
  - open linked case
  - send for approval
  - approve / reject
  - mark paid / restore status
  - delete
- Extended the shared record-actions component in:
  - `src/frontend/components/RecordActionsMenu.tsx`
  - route actions can now opt into opening in a new browser tab

#### Important Limitations
- Calculations still do not have a dedicated edit route; the new details page is intentionally read-only
- The create form currently uses manual line-item entry only; it does not yet pull rows directly from pricelists
- `vite build` still emits the pre-existing circular/manual chunk warnings unrelated to this calculations flow

### 2026-03-11 Calculations ERP Registry Pass + Active Actions

#### Verification Status
- `npm run lint:frontend` -> PASS
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Reworked `/calculations` so it starts with the shared CRM/ERP register shell instead of oversized decorative KPI cards:
  - compact registry container
  - filters-first layout
  - toolbar summary instead of large top cards
- Expanded calculations filtering in:
  - `src/frontend/pages/calculations/CalculationsPage.tsx`
  - `src/frontend/pages/calculations/CalculationsPage.css`
  - added:
    - date-range picker
    - case filter
    - active-filter counter
- Added explicit active-actions entry points:
  - labeled page-level `Активні дії` button
  - row-level `Активні дії` menus for workflow/status actions
- Expanded calculations frontend workflow actions in:
  - `src/frontend/services/calculation.service.ts`
  - `src/frontend/types/calculation.types.ts`
  - supported UI actions now include:
    - send for approval
    - approve
    - reject with reason
    - mark paid / restore status
    - delete
- Extended the shared action menu trigger in:
  - `src/frontend/components/RecordActionsMenu.tsx`
  - `src/frontend/components/RecordActionsMenu.css`
  - the same dropdown can now render as a labeled page-action button, not only as a three-dots row trigger

#### Important Limitations
- Calculations still do not have a dedicated details/edit route; row actions currently focus on workflow transitions, quick filter pivots, and deletion
- Client/case/operation filters remain frontend-side against the fetched register payload, not dedicated backend query params

### 2026-03-11 Notes ERP Registry Pass + Global Actions Overlay

#### Verification Status
- `npm run lint:frontend` -> PASS
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Reworked `/notes` again into a stricter CRM/ERP note register:
  - compact filters
  - tabular note list instead of the two-pane workspace
  - a single primary `Створити нотатку` action in the page header
  - row-level active-actions menu aligned with clients/cases registries
- Replaced the inline note workspace editor with a dedicated modal note form containing only:
  - `Заголовок`
  - `Клієнт`
  - `Справа`
  - `Доступ`
  - `Теги`
  - `Текст нотатки`
- Existing notes now open in read-only mode first; the edit form appears only after pressing `Редагувати`
- Removed note-page quick navigation and cross-entity creation buttons from `/notes`; the page now focuses on pure note registry + note editing flow
- Upgraded the note body input to a lightweight rich-text editor using TinyMCE so note text supports Mac Notes-like formatting behavior
- Hardened `RecordActionsMenu` so dropdowns are no longer clipped by registry/table `overflow: hidden` wrappers:
  - menu content now renders through a portal to `document.body`
  - position is recomputed on open, resize, and scroll
  - dropdowns can flip upward when there is not enough space below the trigger
- Fixed the `/notes` runtime load failure caused by frontend requests sending `limit=150` to endpoints that cap list queries at `100`:
  - notes and case preload requests on the notes page now use `100`
  - note filter DTO validation now matches the actual service limit

#### Important Limitations
- The pre-existing Vite manual-chunk/circular-chunk warning still remains and is unrelated to this UI fix
- The notes page now contributes to the existing heavy `tinymce` frontend chunk because rich-text editing was enabled for note content

### 2026-03-11 Unified Notes Workspace + Cross-Page Note Flows

#### Verification Status
- `npm run lint` -> PASS
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS
- `npm test -- --runInBand` -> PASS (27 passed, 1 skipped suite / 158 passed tests)

#### Backend / Security Changes
- Added dedicated notes persistence/API in:
  - `src/database/entities/Note.entity.ts`
  - `src/database/migrations/1710800000000-AddNotesWorkspace.ts`
  - `src/notes/controllers/notes.controller.ts`
  - `src/notes/services/notes.service.ts`
  - `src/notes/dto/note.dto.ts`
  - `src/notes/notes.module.ts`
- Notes now support direct linking to:
  - `clientId`
  - `caseId`
  - `userId`
  - `assignedUserId`
  - `accessScope = private | assigned | tenant`
- Service-level access checks for notes now reuse the same tenant + actor-scope model as protected client/case records
- Case-linked notes automatically normalize the related `clientId` and validate client/case consistency on write

#### Frontend / Workflow Changes
- Rebuilt `/notes` into a real two-pane notes workspace with:
  - searchable unified list
  - editor surface
  - pinned notes
  - client/case/personal-profile linking
  - quick actions to create related clients, cases, and events
- Added related-note panels and quick note/event entry points to:
  - `src/frontend/pages/clients/ClientDetailsPage.tsx`
  - `src/frontend/pages/cases/CaseDetailsPage.tsx`
- Added `save -> add note` continuation paths to:
  - `src/frontend/pages/clients/AddClientPage.tsx`
  - `src/frontend/pages/cases/AddCasePage.tsx`

#### Important Limitations
- The notes migration was added but not applied to a live PostgreSQL environment in this task
- No dedicated e2e/browser automation exists yet for the new notes workspace
- `vite build` still emits the pre-existing manual-chunk/circular-chunk warning unrelated to this feature

### 2026-03-11 TinyMCE Template Builder + Placeholder Variables

#### Verification Status
- `npm run lint:frontend` -> PASS
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Reworked the template builder into a real placeholder-based template editor:
  - variables are inserted as compact placeholders such as `{{client.displayName}}`
  - optional genitive-case insertion is encoded directly in the placeholder syntax as `|genitive`
  - actual client/case/calculation/event data is no longer selected while authoring the template
- Replaced the previous lightweight editor with TinyMCE for a more MS Word-like editing surface in:
  - `src/frontend/pages/print-forms/PrintFormsPage.tsx`
- Fixed the TinyMCE runtime crash on `/print-forms` by aligning self-hosted Vite imports to the official order (core -> model/theme/icons/skin/content -> plugins), explicitly exposing `globalThis.tinymce`, and setting the self-hosted GPL license key in:
  - `src/frontend/pages/print-forms/PrintFormsPage.tsx`
- Removed the large `Контекст шаблону` selector block and converted the variables rail into a compact ERP/CRM-style insertion list
- Reworked grouped template-variable definitions into a static placeholder catalog in:
  - `src/frontend/pages/print-forms/templateBuilder.utils.ts`
- Expanded client/case placeholder coverage to better match the actual create/edit forms:
  - client date of birth, client added date, client number, status/type, extra contacts, messengers, banking details, contact person/director fields, and comment
  - case record created/added dates, case type/priority/status, court address, description, participants summary, internal notes, and payment-related fields
- Added `user.city` to the `Користувач` variable group so templates can use the city from the user's profile address in:
  - `src/frontend/pages/print-forms/templateBuilder.utils.ts`
- Changed the variable rail behavior so top-level groups are collapsed by default and expand on demand; active search shows matching groups expanded in:
  - `src/frontend/pages/print-forms/PrintFormsPage.tsx`
  - `src/frontend/pages/print-forms/PrintFormsPage.css`
- Added a dedicated lazy chunk for TinyMCE in:
  - `vite.config.ts`

#### Important Limitation
- Server-side generation from placeholders is still not implemented; templates are currently authored, stored, printed, and exported as HTML with placeholder spans intended for future substitution

### 2026-03-11 Template Builder Density Pass + Sticky Long-Form Actions

#### Verification Status
- `npm run lint:frontend` -> PASS
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Tightened the template builder for laptop-height CRM usage in:
  - `src/frontend/pages/print-forms/PrintFormsPage.tsx`
  - `src/frontend/pages/print-forms/PrintFormsPage.css`
- Removed the redundant left-side `Формат документа` panel because formatting is already handled inside TinyMCE
- Removed verbose subtitle/explainer copy from the template registry/editor header so the screen follows the terse ERP/CRM page pattern
- Restored centered page geometry by constraining the template screen to a shared max-width container
- Restored the visible right-side variables rail on desktop widths by keeping the two-column editor layout until a narrower breakpoint
- Switched TinyMCE to a denser editing header:
  - removed the visible menubar row
  - reduced the toolbar command set to the highest-value formatting actions
  - switched the toolbar to compact floating overflow behavior instead of the over-wide / tall wrapping header
  - reduced top chrome height so the A4 editing canvas is visible earlier on narrower monitors
- Kept the right-side variables rail sticky, compact, and grouped by default
- Expanded `Користувач` placeholders in:
  - `src/frontend/pages/print-forms/templateBuilder.utils.ts`
  - added alias coverage for `user.middleName` and `user.director.middleName` to match profile payload variants
- Added aggregate calculation placeholders for future document-generation selection:
  - `calculation.selectedList`
  - `calculation.selectedTotal`
  - `calculation.selectedCount`
- Extended the sticky long-form action pattern onto existing edit routes:
  - `src/frontend/pages/clients/ClientDetailsPage.tsx`
  - `src/frontend/pages/cases/CaseDetailsPage.tsx`
- Restored the missing stylesheet that was breaking the frontend build:
  - `src/frontend/pages/notes/NotesPage.css`

#### Design-System / Documentation Changes
- Updated `docs/FRONTEND_DESIGN_SYSTEM.md` to record:
  - rich-text editor headers must stay compact enough that the main work surface is visible in the first viewport
  - editor screens must not duplicate formatting controls in separate side panels when the editor already provides them
  - long create/edit flows should use the shared sticky `FormActionBar`

#### Important Limitations
- Template generation-time selection of concrete calculations is still a future step; the builder currently stores only placeholders for later substitution
- `vite build` still emits the pre-existing circular-chunk warning (`vendor -> framework -> vendor`) and the large lazy `tinymce` chunk warning, but the build completes successfully
- This pass did not include a live browser screenshot audit of the updated `/print-forms` viewport against real tenant data

### 2026-03-11 Login + Landing Copy Cleanup

#### Verification Status
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Rewrote public-facing copy in:
  - `src/frontend/pages/auth/LoginPage.tsx`
  - `src/frontend/pages/landing/LandingPage.tsx`
- Removed internal/product-technical wording from the login page marketing block:
  - eliminated copy about fast dashboard переходs and other implementation-facing phrasing
- Strengthened public landing messaging for:
  - SEO-relevant phrases around CRM for lawyers, advocates, law firms, and legal companies
  - clearer pain points, feature value, tariff positioning, and CTA copy

#### Important Limitation
- This pass updates copy only; pricing model, product capabilities, and page structure were not changed

### 2026-03-11 Template Registry + A4 Builder + Unified Record Actions

#### Verification Status
- `npm run lint:frontend` -> PASS
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Replaced the old print-forms placeholder with a two-mode template workspace:
  - registry view with search and active/archive filtering
  - editor view with an A4-oriented template canvas plus print/download and save-to-files export
- Removed the decorative template summary cards above the registry so the screen opens directly into filters + main list
- Added lightweight local template persistence for CRUD-style operations:
  - create
  - edit
  - duplicate
  - archive / restore
  - delete
- Added grouped variable insertion for user, organization, client, case, calculation, event, and system placeholder data
- Added lightweight genitive-case insertion mode for supported text variables
- Added a shared three-dots dropdown action menu and switched registry row actions in:
  - `src/frontend/pages/clients/ClientsPage.tsx`
  - `src/frontend/pages/cases/CasesPage.tsx`
  - `src/frontend/pages/documents/DocumentsPage.tsx`
  - `src/frontend/pages/pricelists/PricelistsPage.tsx`
- Updated frontend design rules in:
  - `docs/FRONTEND_DESIGN_SYSTEM.md`
  - registry/list screens must not add decorative KPI/summary strips above the main table unless the screen is analytics-first or explicitly requested

#### Important Limitation
- Template records are currently frontend-local (`localStorage`) and not yet backed by a dedicated backend/template entity or multi-user synchronization path

### Required

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=900

# App
NODE_ENV=production
APP_URL=https://app.laworganizer.ua

# Stripe (optional)
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# WayForPay (optional)
WAYFORPAY_MERCHANT_ACCOUNT=xxx
WAYFORPAY_MERCHANT_SECRET_KEY=xxx
```

### Optional

```bash
# Redis (Enterprise)
REDIS_URL=redis://localhost:6379

# Vite dev server now binds to LAN for local-phone testing
# Mobile scan links can target a LAN IP or tunnel instead of localhost
MOBILE_SCAN_BASE_URL=http://192.168.1.138:5173

# S3 Storage
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=xxx

# Sentry
SENTRY_DSN=https://xxx@sentry.io/xxx

# Encryption
ENCRYPTION_KEY=xxx

# Ukrainian trust providers / e-signature foundation
DIIA_CLIENT_ID=xxx
DIIA_CLIENT_SECRET=xxx
DIIA_REDIRECT_URI=https://app.laworganizer.ua/auth/diia/callback
DIIA_TRUST_MODE=stub
DIIA_TOKEN_URL=https://api.diia.gov.ua/oauth/token
DIIA_IDENTITY_VERIFY_URL=https://api.diia.gov.ua/v1/identities/verify
DIIA_SIGN_VERIFY_URL=https://api.diia.gov.ua/v1/signatures/verify
DIIA_CALLBACK_SECRET=xxx
BANKID_CLIENT_ID=xxx
BANKID_CLIENT_SECRET=xxx
BANKID_REDIRECT_URI=https://app.laworganizer.ua/auth/bankid/callback
BANKID_NBU_MODE=stub
BANKID_NBU_TOKEN_URL=https://bankid.example/oauth/token
BANKID_NBU_IDENTITY_URL=https://bankid.example/identities/verify
BANKID_NBU_CALLBACK_SECRET=xxx
ACSK_TRUST_MODE=stub
ACSK_TRUST_VERIFY_SIGNATURE_URL=https://acsk.example/verify-signature
ACSK_TRUST_VERIFY_IDENTITY_URL=https://acsk.example/verify-identity
ACSK_TRUST_OCSP_URL=https://acsk.example/ocsp
ACSK_TRUST_CRL_URL=https://acsk.example/crl
ACSK_TRUST_CALLBACK_SECRET=xxx
TRUST_PROVIDER_WEBHOOK_SECRET=xxx
TRUST_PROVIDER_TIMEOUT_MS=10000
TRUST_PROVIDER_CALLBACK_TOLERANCE_SECONDS=300
```

## Testing

```bash
# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Deployment

### Docker

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f backend
```

### Kubernetes

```bash
# Apply all manifests
kubectl apply -f k8s/

# Check status
kubectl get pods -n law-organizer

# View logs
kubectl logs -f deployment/backend -n law-organizer
```

## Security Checklist

- [x] JWT authentication with short expiry
- [x] Refresh token rotation
- [x] MFA support (Professional+)
- [x] Tenant isolation via guards
- [x] SQL injection protection (TypeORM)
- [x] XSS protection (validation)
- [x] CSRF posture is explicitly bearer-only (`Authorization` header, no auth cookies, CORS `credentials: false`)
- [x] Rate limiting (Redis-backed Nest throttling in production + nginx edge limits)
- [x] Helmet security headers
- [x] Audit logging
- [x] Service-level user-scoped access control for cases/clients/documents
- [x] Declarative RBAC (`@Roles`)
- [x] Server-side subscription limits for client/case quotas and professional bulk operations
- [x] Access-token revocation / session invalidation
- [x] Signature/identity schema foundation for Ukrainian trust providers
- [x] Row Level Security (tenant+user PostgreSQL policies)
- [x] PII encryption at rest (field-level encryption + blind indexes for searchable lookups)
- [x] Live-capable certificate validation hooks (OCSP/CRL) for КЕП/АЦСК
- [x] Diia.Sign / Diia OAuth integration path (configurable live exchange)
- [x] BankID НБУ integration path (configurable live exchange)

## Known Issues & TODOs

### Critical (Fix Before Production)

1. **Restore green automated verification** - `npm test -- --runInBand` currently fails at `src/calculations/services/calculation.service.ts:347`
2. **Restore green e2e verification** - `npm run test:e2e -- --runInBand` currently fails because `tests/cases.e2e-spec.ts` is out of sync with the current `Case` entity/type contracts
3. **Validate live trust-provider credentials and staging exchanges** - ACSK/Diia/BankID live-capable adapters are implemented, but real tenant credentials, endpoint contracts, and staging proof still need execution
4. **Execute live staging drills** - readiness/alerting code is now present, but deploy, outage, backup/restore, and degraded-dependency drills still need to be run outside the local workspace
5. **Rehearse production scanner/provider/OCR operations** - runtime workflows and operator runbooks now exist, but real ClamAV plus `opencv/ocrmypdf/unpaper/tesseract` provisioning and staging proof still need execution
6. **Validate external commercial transports in staging** - invoice PDF/storage, DB-backed queueing, and reminders are now implemented, but real email/SMS/push provider delivery still needs a true send path and staging proof

### High Priority

7. **Prove live CRL/OCSP / provider callbacks against staging upstreams** - signed callback verification, replay protection, and upstream status hooks are coded, but still need external confirmation
8. **Execute blind-index key rotation / production backfill rehearsals** - operator runbooks now exist, but rehearsal evidence on restored production-like data is still missing
9. **Implement real first-factor verification for self-registration if it remains in launch scope** - the flow is now split correctly into account creation vs profile enrichment, but live email verification and Google/Apple/Microsoft auth are still not implemented
10. **Close residual operational TODOs outside the launch blockers** - notification preferences persistence, frontend permission fidelity, and enterprise audit fan-out are still partial or stubbed

## Canonical Agent Work Queue

- Use `docs/AGENT_EXECUTION_CHECKLIST.md` as the canonical ordered backlog for remaining production-hardening work.
- For full launch-readiness work, read `docs/LAUNCH_READINESS_MASTER_CHECKLIST.md` first and treat it as the launch-gate override.
- Before any non-trivial task, read:
  - `docs/AGENT_EXECUTION_CHECKLIST.md`
  - `docs/LAUNCH_READINESS_MASTER_CHECKLIST.md`
  - `CLAUDE.md`
  - `docs/PROJECT_CONTEXT_CACHE.md`
- Unless the user explicitly reprioritizes the work, continue from the first conversation in `docs/AGENT_EXECUTION_CHECKLIST.md` that still has unchecked items.
- Do not mark a conversation complete until implementation, verification, and documentation updates are all done.
- After each completed conversation, update:
  - `docs/AGENT_EXECUTION_CHECKLIST.md`
  - `CLAUDE.md`
  - `docs/PROJECT_CONTEXT_CACHE.md`
  - relevant docs in `docs/`

## Recent Changes

### 2026-03-13 - Launch Status Recheck + Master Launch Checklist

#### Verification Status
- `npm run lint` -> PASS
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS
- `npm run test:frontend:smoke` -> PASS (3/3)
- `npm test -- --runInBand` -> PASS (31 passed, 1 skipped suite / 172 passed, 3 skipped tests)
- `npm run test:e2e -- --runInBand` -> PASS (22/22)

#### Outcome
- Added a dedicated launch-gate document:
  - `docs/LAUNCH_READINESS_MASTER_CHECKLIST.md`
- The launch checklist now explicitly separates:
  - code/runtime blockers
  - external integrations that need more than code
  - non-programming business/operator prerequisites
  - staging/operator rehearsal
- Current conclusion:
  - build/lint/browser smoke/full unit/full e2e are green
  - full production launch is still blocked by external/provider/operator prerequisites and unresolved staging/runtime proof

### 2026-03-13 - Unit + E2E Recovery Pass

#### Verification Status
- `npm test -- --runInBand src/calculations/services/calculation.service.spec.ts` -> PASS (4/4)
- `npm run test:e2e -- --runInBand tests/cases.e2e-spec.ts` -> PASS (22/22)
- `npm test -- --runInBand` -> PASS (31 passed, 1 skipped suite / 172 passed, 3 skipped tests)
- `npm run test:e2e -- --runInBand` -> PASS (22/22)
- `which tesseract ocrmypdf unpaper clamscan clamdscan python3` -> PARTIAL (`tesseract`, `ocrmypdf`, `unpaper`, `python3` present; `clamscan` / `clamdscan` missing)
- `python3 -c "import importlib.util; print(importlib.util.find_spec('cv2') is not None)"` -> FAIL (`cv2` missing from the default host `python3`)

#### Backend / Test Alignment Changes
- Fixed a TypeScript/unit blocker in:
  - `src/calculations/services/calculation.service.ts`
- Removed invalid `CalculationItem` mutation fields (`tenantId`, `createdBy`, `updatedBy`) from create/update save/delete paths so the service matches the entity contract again.
- Updated `tests/cases.e2e-spec.ts` to current `Case` contracts:
  - replaced stale `civil` / `criminal` values with `judicial_case` / `criminal_proceeding`
  - seeded fixtures via `caseRepository.create(...)` to avoid TypeORM overload inference issues
  - added a higher Jest timeout so the full e2e bootstrap remains stable under SQLite schema setup
- Cleared follow-on TypeScript blockers discovered while re-enabling full e2e compilation:
  - `src/auth/services/users.service.ts`
  - `src/documents/services/document.service.ts`
  - `src/documents/services/scan-session.service.ts`

#### Remaining Limitation
- Automated verification is green again, but launch readiness is still blocked by non-code execution work:
  - no staging deploy/readiness/degraded-dependency/backup-restore proof was produced in this pass
  - live ACSK/Diia/BankID, payment, and email/SMS/push staging evidence is still missing
  - scan/runtime proof remains incomplete on the active host shell because `ClamAV` binaries are absent and default `python3` does not currently expose `cv2`

### 2026-03-11 - Calculations Registry Width Compaction

#### Verification Status
- `npm run build:frontend` -> FAIL (`Could not resolve "./NotesPage.css" from "src/frontend/pages/notes/NotesPage.tsx"` on the first attempt; transient Vite resolver failure outside the calculations files)
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Compacted the `/calculations` registry layout in:
  - `src/frontend/pages/calculations/CalculationsPage.css`
- Adjustments:
  - filter bar columns now shrink more aggressively and wrap into additional rows earlier on narrower desktop widths
  - registry KPI chips are slightly narrower so the toolbar does not force extra width
  - the calculations table now uses fixed column distribution with wrapping instead of a large minimum width
  - the note column no longer forces the table wider than the viewport

#### Remaining Limitation
- Extremely long unbroken values will now wrap inside cells instead of forcing a horizontal scroll area, but this can still make individual rows visually taller

### 2026-03-11 - Calculation Number Format By Client / Case / Sequence

#### Verification Status
- `npm test -- --runInBand src/calculations/services/calculation.service.spec.ts` -> PASS (4/4)
- `npm run lint:backend` -> PASS
- `npm run build` -> PASS

#### Backend Changes
- Replaced legacy monthly `CALC-YYYY-MM-NNNN` number generation in:
  - `src/calculations/services/calculation.service.ts`
- Calculation numbers are now generated as:
  - `{clientNumber}/{caseSequence}/{sequence}-{suffix}`
  - examples:
    - `007/002/01-П`
    - `007/002/02-В`
- Numbering rules:
  - `clientNumber` is taken from `client.metadata.client_number`
  - `caseSequence` is taken from the second segment of the internal case number `clientNumber/caseSequence`
  - `sequence` is shared inside the same client/case bucket and uses minimum width 2 (`01`, `02`, ...)
  - suffix is:
    - `П` for `income`
    - `В` for `expense`
- Compatibility / fallback rules:
  - calculations linked to a client but not to a case use `{clientNumber}/000/{sequence}-{suffix}`
  - self-accounting / no-client-no-case calculations use `000/000/{sequence}-{suffix}`
- Added validation:
  - reject creation when `metadata.clientId` does not match the selected `caseId`
- Added targeted unit coverage in:
  - `src/calculations/services/calculation.service.spec.ts`
  - `src/calculations/calculations.module.ts` now includes `Case` and `Client` repositories required for numbering context resolution

#### Remaining Limitation
- Legacy calculations with old `CALC-*` numbers are preserved as-is and ignored when computing the new structured sequence buckets
- The `000/000` fallback remains intentionally enabled for compatibility with the current self/no-case frontend flow; if product rules later require strict client+case-only numbering, frontend and backend validation should be tightened together

### 2026-03-11 - Browser Tab Favicon Refresh

#### Verification Status
- `npm run build:frontend` -> FAIL (`Could not resolve "./pages/print-forms/PrintFormsPage" from "src/frontend/App.tsx"`; pre-existing frontend build issue discovered while verifying the favicon-only change)

#### Frontend Changes
- Added an explicit browser-tab favicon entry in:
  - `index.html`
- Added the user-supplied browser-tab icon asset in:
  - `public/favicon.svg`
- Scope clarification:
  - this change only affects the browser tab icon
  - the in-app shared logo asset (`src/frontend/assets/project-logo.svg`) was not changed

#### Remaining Limitation
- Frontend production build is currently blocked by a missing lazy-loaded module import in `src/frontend/App.tsx` unrelated to the favicon change

### 2026-03-11 - Calendar Event Form Expansion + Range/Repeat Support

#### Verification Status
- `npm run build` -> PASS
- `npm test -- --runInBand src/events/services/event.service.spec.ts` -> PASS (3/3)
- `npm run build:frontend` -> PASS

#### Calendar / Events Changes
- Expanded the event model and API contracts for:
  - responsible contact capture
  - flexible reminder value/unit (`minutes`, `hours`, `days`, `weeks`)
  - range events with `endDate` / `endTime`
  - recurring events with pattern, interval, and repeat-until date
- Added migration:
  - `src/database/migrations/1710700000000-ExpandCalendarEventScheduling.ts`
- Updated event authoring UI in:
  - `src/frontend/pages/events/AddEventPage.tsx`
  - `src/frontend/pages/events/AddEventPage.css`
- The add-event form now:
  - keeps the existing core fields from the prior flow
  - uses client/case dropdowns instead of raw case ID entry
  - adds `Місце події`
  - adds `Контакти відповідальної особи`
  - changes reminder entry to `Нагадати за` with unit selection
  - supports checkbox-driven range events (`від і до`)
  - supports recurring events via `Повтор`
- Updated calendar rendering/details in:
  - `src/frontend/pages/calendar/CalendarPage.tsx`
- Calendar views now expand:
  - multi-day events across each covered day
  - recurring events into visible occurrences within the requested range

#### Remaining Limitations
- Recurring events are expanded at read time for the calendar views; there is still no edit UI for single generated occurrences versus the source series
- The new migration has been added to the repo, but it was not executed in this workspace during this task
- Reminder delivery still targets the event creator; there is no separate assignee/recipient routing for responsible contacts yet

### 2026-03-11 - Clients Registry Shows Client Number

#### Verification Status
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Added a dedicated `Номер` column to the clients registry table in:
  - `src/frontend/pages/clients/ClientsPage.tsx`
- The registry now renders `metadata.client_number` with the same monospace pill treatment used for case numbers, with `Не вказано` as the fallback in:
  - `src/frontend/pages/clients/ClientsPage.css`

#### Remaining Limitation
- Client number display still depends on the existing `metadata.client_number` contract; rows without that value intentionally show the fallback label

### 2026-03-11 - Flexible Case Participants + Real Calculation Authoring

#### Verification Status
- `npm run lint:frontend` -> PASS
- `npm run lint:backend` -> PASS
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS

#### Case Form Changes
- Renamed institution fields in the shared case form:
  - `Судова інформація` -> `Дані щодо установи`
  - `Суд / Установа` -> `Назва установи (суд, орган виконавчої влади тощо)`
  - `Адреса суду` -> `Адреса установи`
  - `Суддя` -> `Особа, у веденні якої знаходиться справа`
- Replaced the old plaintiff/defendant/third-party block with a flexible `Учасники` editor in:
  - `src/frontend/components/cases/CaseFormSections.tsx`
  - `src/frontend/pages/cases/AddCasePage.css`
- Added grouped participant role catalogs with remembered last-used group and manual `Інше` role entry in:
  - `src/frontend/utils/caseParticipants.ts`
- Case create/edit flows now persist structured participants in `metadata.caseParticipants` while auto-synchronizing legacy searchable fields (`plaintiffName`, `defendantName`, `thirdParties`) for backward compatibility in:
  - `src/frontend/pages/cases/AddCasePage.tsx`
  - `src/frontend/pages/cases/CaseDetailsPage.tsx`
  - `src/frontend/schemas/case.schema.ts`
- Court/institution and finance inputs in the case form are now non-blocking:
  - optional amount fields no longer coerce blank values into validation failures
  - the case form now points users to the dedicated `Розрахунки` module for financial operations
- Backend case creation now preserves omitted monetary values as nullable instead of forcing zeroes in:
  - `src/cases/services/case.service.ts`

#### Calculations Changes
- Replaced the old analytics-style placeholder page with a real calculations authoring flow in:
  - `src/frontend/pages/calculations/CalculationsPage.tsx`
  - `src/frontend/pages/calculations/CalculationsPage.css`
  - `src/frontend/services/calculation.service.ts`
  - `src/frontend/types/calculation.types.ts`
- The new `Розрахунки` flow now supports:
  - subject selection: client or self
  - optional case binding
  - operation type: `Прибуткова` or `Видаткова`
  - default calculation date = today with manual override
  - income rows sourced from active pricelist services with quantity-based totals
  - expense rows entered manually with name, unit label, quantity, unit price, row total, and aggregate total
- Backend calculation DTO/service now accept and persist calculation metadata and compute totals for both pricelist-backed and manual rows without forced VAT in:
  - `src/calculations/dto/calculation.dto.ts`
  - `src/calculations/services/calculation.service.ts`

#### Open Risks / Limitations
- Structured participants are stored in `case.metadata` for now; there is still no first-class database column or dedicated backend search filter for individual participant roles beyond the synchronized legacy text fields.
- Expense-row unit labels are currently persisted through the existing `code` field on calculation items to avoid a schema migration in this pass.
- The new calculations page currently exposes create/list behavior only; edit/approval/export workflows remain on the existing backend surface and are not yet wired into the new UI.

#### 2026-03-11 Follow-up Refinement
- Replaced the bulky collapsible participant-role picker with a compact grouped dropdown and renamed the label:
  - `Обраний статус` -> `Статус у справі`
- Removed accidental `participants` field submission from case create/update payloads, which fixed backend whitelist errors (`property participants should not exist`).
- Removed the standalone `Дати` section from the case form and moved `Дата додавання справи` next to the auto-generated case number, reusing the shared keyboard-friendly `DatePicker`.
- Added section/card-level error highlighting for shared add/edit client and case form surfaces so invalid areas are visually marked before submit is corrected.
- Case detail route now opens in read-only mode by default and only switches into the edit form after explicit `Редагувати` action in:
  - `src/frontend/pages/cases/CaseDetailsPage.tsx`
  - `src/frontend/pages/cases/CaseDetailsPage.css`
- Verification:
  - `npm run lint:frontend` -> PASS
  - `npm run build:frontend` -> PASS

### 2026-03-11 - Calculations Registry Fix + Tabular Workflow

#### Verification Status
- `npm run lint:frontend` -> PASS
- `npm run lint:backend` -> PASS
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS

#### Backend / API Changes
- Fixed the `GET /calculations` validation regression that produced `400 Bad Request` even without filters by marking `status` optional in:
  - `src/calculations/dto/calculation.dto.ts`
- Extended the frontend calculations API client to send query params for list retrieval in:
  - `src/frontend/services/calculation.service.ts`
  - `src/frontend/types/calculation.types.ts`

#### Frontend Changes
- Reworked the `Розрахунки` screen into an ERP/CRM-style registry in:
  - `src/frontend/pages/calculations/CalculationsPage.tsx`
  - `src/frontend/pages/calculations/CalculationsPage.css`
- The page now provides:
  - a tabular operations register instead of the previous stacked history list
  - filters for free-text search, operation type, client, status, and date range
  - dedicated header actions:
    - `Додати видатковий розрахунок`
    - `Додати прибутовий розрахунок`
  - a focused create panel that opens for the selected income/expense flow while preserving the existing manual-expense and pricelist-income authoring logic
  - summary cards for filtered income total, expense total, and row count

#### Open Risks / Limitations
- Client and operation-type filters are currently applied on the frontend against fetched calculation metadata rather than pushed into backend query filtering.
- The register currently loads up to 100 calculations per request for this UI path; server-side pagination and row actions are still future work.

### 2026-03-11 - Native Date Input + Editable Client Creation Date

#### Verification Status
- `npm run lint` -> PASS
- `npm test -- --runInBand src/clients/services/client.service.spec.ts` -> PASS (37/37)
- `npm test -- --runInBand src/frontend/utils/__tests__/clientDataTransform.test.ts` -> FAIL (`No tests found`; default Jest config only matches `*.spec.ts`)
- `npx jest --runInBand --testRegex '.*\\.(spec|test)\\.ts$' src/frontend/utils/__tests__/clientDataTransform.test.ts` -> PASS (project-wide suite run; includes `clientDataTransform.test.ts`)
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Replaced the custom portal-based calendar popover with a shared native browser date input in:
  - `src/frontend/components/DatePicker.tsx`
  - `src/frontend/components/DatePicker.css`
- Date fields now support keyboard entry directly through the shared control instead of relying on the old custom calendar frame
- Removed embedded descriptive helper copy from shared client/case form surfaces in:
  - `src/frontend/components/clients/ClientFormSections.tsx`
  - `src/frontend/components/cases/CaseFormSections.tsx`
- Client creation now defaults `Дата додавання клієнта` to today but allows manual override before save in:
  - `src/frontend/pages/clients/AddClientPage.tsx`

#### Backend / Data Flow Changes
- Extended client creation DTO/service flow to accept an explicit creation timestamp in:
  - `src/clients/dto/client.dto.ts`
  - `src/clients/services/client.service.ts`
- Updated frontend DTO mapping so form `registration_date` persists into backend `createdAt` in:
  - `src/frontend/types/client.types.ts`
  - `src/frontend/utils/clientDataTransform.ts`
- Added regression coverage for explicit client creation dates in:
  - `src/clients/services/client.service.spec.ts`
  - `src/frontend/utils/__tests__/clientDataTransform.test.ts`

#### Open Risks / Limitations
- The default Jest config still does not discover frontend `*.test.ts` files through `npm test`
- Client edit mode still keeps the existing registration date read-only; only the create flow is manually editable in this pass

### 2026-03-11 - Client Form Consolidation + Typed Dynamic Contact Editing

#### Verification Status
- `npm run lint` -> PASS
- `npm run build:frontend` -> PASS
- `npm test -- src/frontend/schemas/client.schema.spec.ts --runInBand` -> PASS (2/2)
- `npx jest --runInBand --testRegex '.*\\.(spec|test)\\.ts$' src/frontend/utils/__tests__/clientDataTransform.test.ts` -> PASS (project-wide suite run; includes `clientDataTransform.test.ts`)

#### Frontend Client Form Changes
- Added a shared form shell for create/edit flows in:
  - `src/frontend/components/clients/ClientForm.tsx`
- Reworked shared conditional sections in:
  - `src/frontend/components/clients/ClientFormSections.tsx`
- Refined address semantics per client type in:
  - `src/frontend/components/clients/AddressSection.tsx`
- Updated shared client form model and reverse mapping in:
  - `src/frontend/schemas/client.schema.ts`
  - `src/frontend/utils/clientFormData.ts`
  - `src/frontend/utils/clientDataTransform.ts`
- Updated route surfaces to consume the shared form shell:
  - `src/frontend/pages/clients/AddClientPage.tsx`
  - `src/frontend/pages/clients/ClientDetailsPage.tsx`

#### Behavior Changes
- Add/edit client now use a single shared `ClientForm` wrapper with common top fields and type-specific sections instead of duplicating form composition per route.
- Client number is explicitly treated as system-managed and read-only in the MVP create/edit flow.
- Client creation date is shown as a non-editable form field in both create/edit flows.
- Individual clients now use a single passport input (`серія та номер`) instead of split series/number fields.
- Optional patronymic handling now matches the provided business analysis for individuals, FOPs, and legal-entity contact persons.
- Additional phones/emails are now real dynamic inputs instead of non-functional placeholder links.
- Messenger capture is now backed by actual text inputs (`WhatsApp`, `Viber`, `Skype`, `Telegram`) instead of dead CTA chips.
- Legal-entity contact data now has the same dynamic contact editing surface as individual/FOP contact sections.
- Address section labels now reflect client-type semantics:
  - individual/FOP: registration address
  - legal entity: legal address
- Comment field now enforces a max length and shows a live character counter.

#### Important Limitations
- Hidden values on client-type switch are preserved through the shared React Hook Form state, but there is still no explicit confirmation modal before changing type.
- The requested `additional_addresses[]` model is still not implemented; the current UI remains limited to primary registration/legal plus actual address.
- Backend DTO/storage still uses the existing normalized metadata shape, so the new UI aligns labels and capture behavior without introducing a full client domain schema migration in this pass.

### 2026-03-11 - Local Dev Startup Gating For Slow Backend Bootstrap

#### Verification Status
- `npm run build` -> PASS
- `npm test -- --runInBand src/billing/services/stripe.service.spec.ts src/common/logging/global-exception.filter.spec.ts` -> PASS (4/4)
- `npm run start:prod` -> PASS
- `GET http://localhost:3000/health` -> `200 {"status":"ok",...}`
- `npm run start:frontend:wait-backend` -> PASS (confirmed immediate handoff to Vite once backend health was available)

#### Dev Runtime Changes
- Added a dedicated local startup gate script:
  - `scripts/start-frontend-when-backend-ready.sh`
- Updated local npm scripts in:
  - `package.json`
- `npm run start:all` now launches:
  - backend watch mode immediately
  - frontend only after `http://localhost:3000/health` returns `200`
- Purpose:
  - prevent early Vite proxy requests from hitting an unopened backend port during slow Nest/bootstrap + SQLite/schema init
  - remove the noisy transient `ECONNREFUSED` proxy error for `/v1/logs` during local combined startup
- Fixed the actual backend bootstrap blockers behind the delayed health endpoint:
  - removed the `BillingService` <-> `StripeService`/`WayForPayService` DI cycle by resolving the billing sync port lazily in `src/billing/services/stripe.service.ts` and dropping the unused reverse dependency from `src/billing/services/wayforpay.service.ts`
  - switched global exception-filter bootstrap from `app.get(LoggingService)` to `await app.resolve(LoggingService)` in `src/main.ts` because `LoggingService` is transient-scoped

#### Remaining Limitation
- Local startup still does full SQLite schema inspection/sync on boot, so backend readiness is no longer blocked but is still somewhat heavier than a minimal Nest app

### 2026-03-11 - Two-Step Registration + Universal Profile Form

#### Verification Status
- `npm run lint:backend` -> PASS
- `npm run lint:frontend` -> PASS
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS
- `npm test -- --runInBand src/auth/services/auth.service.spec.ts -t "register"` -> PASS

#### Auth / Profile Flow Changes
- Simplified first-step self-registration to account bootstrap only in:
  - `src/auth/dto/register.dto.ts`
  - `src/frontend/types/auth.types.ts`
  - `src/frontend/pages/auth/RegisterPage.tsx`
- Registration now captures only:
  - `email`
  - `password`
- Self-register backend bootstrap in `src/auth/services/auth.service.ts` now:
  - creates a generated starter organization instead of requiring legal/practice metadata at account-creation time
  - creates an owner user with placeholder display-name values that are expected to be replaced later in onboarding/profile
- Expanded the canonical profile schema in:
  - `src/users/dto/profile.dto.ts`
  - `src/auth/services/users.service.ts`
- Added a reusable dynamic profile form in:
  - `src/frontend/components/profile/UserProfileDetailsForm.tsx`
  - `src/frontend/components/profile/UserProfileDetailsForm.css`
- The universal profile form now supports:
  - conditional sections by `organizationType` (`SELF_EMPLOYED`, `FOP`, `LEGAL_ENTITY`)
  - dynamic arrays for secondary phones/emails
  - director autofill from user data
  - legal/factual address copy behavior
  - Ukrainian-format validation for phone, tax ID, MFO, and IBAN
  - inline validation and field formatting
- Replaced the profile-editing surface in:
  - `src/frontend/pages/profile/ProfilePage.tsx`
- Replaced the onboarding profile step in:
  - `src/frontend/pages/onboarding/OnboardingWizard.tsx`
- Canonical ownership is now:
  - registration = account bootstrap only
  - onboarding/profile = legal identity, contacts, addresses, banking, and professional status

#### Remaining Limitation
- This pass does not yet implement live email verification delivery/confirmation.
- This pass does not yet implement Google, Apple, or Microsoft sign-in.
- The onboarding flow still retains its older step container structure; only the profile step payload/UX was normalized in this pass.

### 2026-03-11 - Registration Runtime Stabilization

#### Verification Status
- `npm run lint:backend` -> PASS
- `npm run lint:frontend` -> PASS
- `npm run build` -> PASS
- `npm test -- --runInBand src/auth/services/auth.service.spec.ts -t "register"` -> PASS

#### Runtime / Frontend Changes
- Removed a backend runtime circular-import crash between billing orchestrator/provider services by introducing:
  - `src/billing/services/billing.types.ts`
  - token-based provider sync injection in:
    - `src/billing/services/stripe.service.ts`
    - `src/billing/services/wayforpay.service.ts`
    - `src/billing/billing.module.ts`
- Improved registration failure messaging in:
  - `src/frontend/pages/auth/RegisterPage.tsx`
- Fixed the concrete self-registration `500` caused by refresh-token persistence:
  - generated refresh JWT length exceeds 255 characters
  - `src/database/entities/RefreshToken.entity.ts` now stores `token` as `text`
  - added migration `src/database/migrations/1710600000000-ExpandRefreshTokenTokenColumn.ts`
- Registration UI now surfaces real backend validation messages or a clear service-unavailable fallback instead of collapsing everything into a generic registration failure.

#### Remaining Limitation
- This pass fixed the known billing bootstrap crash and the concrete refresh-token storage `500`, but did not capture a full browser-level end-to-end registration proof in this workspace session.
- Staging/production databases still need the refresh-token column migration applied.

### 2026-03-11 - Conversation 11 Rehearsal Packaging

#### Verification Status
- `npm run lint:backend` -> PASS
- `npm run build` -> PASS
- `bash -n scripts/local-launch-rehearsal.sh` -> PASS
- `docker compose -f docker-compose.yml -f docker-compose.rehearsal.yml config` -> PASS
- `./scripts/local-launch-rehearsal.sh` -> BLOCKED (`Cannot connect to the Docker daemon at unix:///Users/edhar/.docker/run/docker.sock`)

#### Runtime / Deployment Changes
- Added dedicated worker bootstrap:
  - `src/worker.ts`
- Added explicit cron-role gating so scheduled jobs can run on worker-only deployments:
  - `src/common/runtime/scheduled-tasks.ts`
  - `src/common/health/operational-monitoring.service.ts`
  - `src/file-storage/services/file-scan.service.ts`
  - `src/trust-verification/services/trust-verification-worker.service.ts`
  - `src/notifications/services/notification.service.ts`
  - `src/events/services/event.service.ts`
  - `src/enterprise/processors/outbox.processor.ts`
- Fixed production config mismatch between runtime validation and compose deployment:
  - `src/common/config/environment.validator.ts` now accepts `DB_*` and `DATABASE_*` aliases for PostgreSQL configuration
  - `docker-compose.yml` now injects matching database aliases, scheduler-role flags, and scanner settings into backend/worker containers
- Added runnable local operator rehearsal assets:
  - `docker-compose.rehearsal.yml`
  - `scripts/local-launch-rehearsal.sh`
- The rehearsal path now supports:
  - local backend/frontend port exposure
  - Redis degradation check wiring
  - backup dump generation
  - isolated restore PostgreSQL + restore backend boot path

#### Remaining Limitation
- Conversation 11 is still not execution-complete.
- This pass made the operator rehearsal runnable from the repository, but actual deploy/degradation/restore evidence could not be captured in this workspace because Docker daemon access was unavailable.
- SMTP/SMS/push outbound transport proof remains operationally open because notification delivery is still workflow-state complete locally rather than live-provider verified.

### 2026-03-11 - Secondary Module Phase Labeling

#### Verification Status
- `npm run lint:frontend` -> PASS
- `npm run build:frontend` -> PASS
- `npm run build` -> PASS

#### Phase Decisions
- `reports` -> launch-scope operational surface
- `calculations` -> launch-scope operational surface
- `print-forms` -> post-launch preview
- `chat` -> post-launch preview
- `mail` -> post-launch preview

#### UI Changes
- Added a reusable module phase notice in:
  - `src/frontend/components/ModulePhaseNotice.tsx`
  - `src/frontend/components/ModulePhaseNotice.css`
- Applied explicit phase labels in:
  - `src/frontend/pages/reports/ReportsPage.tsx`
  - `src/frontend/pages/calculations/CalculationsPage.tsx`
  - `src/frontend/pages/print-forms/PrintFormsPage.tsx`
  - `src/frontend/pages/chat/ChatPage.tsx`
  - `src/frontend/pages/mail/MailPage.tsx`
- Product behavior after this pass:
  - `reports` and `calculations` are presented as production-facing operational analytics surfaces
  - `print-forms`, `chat`, and `mail` are explicitly presented as preview/post-launch hubs so the UI no longer overstates readiness

#### Queue Impact
- Conversation 18 is now closed in the `explicit phase-labeling` variant.
- The product backlog after Conversation 11 no longer includes unresolved ambiguity around these secondary modules.

#### Important Limitations
- This pass did not add messaging transport, thread persistence, template generation, or mail workspace execution depth.
- If those modules return to launch scope later, they will need dedicated backend and UX implementation passes rather than label-only changes.

### 2026-03-10 - Registration / Onboarding / Profile Ownership Reconciliation

#### Verification Status
- `npm test -- --runInBand src/auth/services/auth.service.spec.ts` -> PASS (26/26)
- `npm run lint:backend` -> PASS
- `npm run lint:frontend` -> PASS
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS

#### Canonical Ownership Split
- Registration now owns only tenant bootstrap data:
  - `organizationName`
  - `legalForm`
  - `firstName`
  - `lastName`
  - `email`
  - `password`
- Onboarding now owns required startup operational setup:
  - organization реквізити and contact fields
  - owner startup professional fields (`patronymic`, `phone`, `position`, `barNumber`)
  - optional team invitations
- Profile remains the home for extended personal/professional enrichment:
  - identity details
  - tax/passport/citizenship
  - specialties/languages/education
  - biography/avatar

#### Implementation Changes
- Expanded self-registration DTO and frontend form in:
  - `src/auth/dto/register.dto.ts`
  - `src/frontend/types/auth.types.ts`
  - `src/frontend/pages/auth/RegisterPage.tsx`
- Self-registration now creates:
  - named organization instead of generic `Особистий кабінет`
  - owner with non-empty `firstName` / `lastName`
  - onboarding progress records that explicitly track what was captured at registration and what remains for onboarding
- Reconciled self-registration persistence in:
  - `src/auth/services/auth.service.ts`
- Replaced simulated onboarding saves with real persistence in:
  - `src/frontend/pages/onboarding/OnboardingWizard.tsx`
- Onboarding now writes to live APIs:
  - `/organizations/me`
  - `/users/profile`
  - `/users/invitations`
- Added persisted auth-session synchronization so updated organization/user data survives reloads:
  - `src/frontend/services/auth-storage.ts`
  - `src/frontend/store/auth.slice.ts`
- Added regression coverage for the new self-registration split in:
  - `src/auth/services/auth.service.spec.ts`

#### Queue Impact
- Conversation 17 is now implemented locally.
- After Conversation 11, the remaining planned product-scope item is:
  - Conversation 18: secondary module depth or explicit phase labeling

#### Important Limitations
- This pass did not redesign the onboarding step enum/model; it reconciled ownership and persistence within the existing `organization_details` / `user_profile` structure.
- Team invitation acceptance and external delivery proof are still outside this pass.

### 2026-03-10 - Admin Surface Completion + IA Navigation Alignment

#### Verification Status
- `npm run lint:backend` -> PASS
- `npm run lint:frontend` -> PASS
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS

#### Frontend / Backend Changes
- Replaced the remaining inline placeholder routes in `src/frontend/App.tsx` with real lazy-loaded pages:
  - `/users`
  - `/settings`
  - `/audit`
- Added tenant-scoped users/team management APIs in:
  - `src/auth/controllers/users.controller.ts`
  - `src/auth/services/users.service.ts`
  - `src/users/dto/user-management.dto.ts`
- Users surface now supports:
  - current-user profile retrieval/update/password change
  - tenant member listing
  - role/status updates for non-owner members
  - invitation listing, creation, and revocation
  - subscription-aware invite-capacity enforcement
- Added a non-enterprise-module audit log endpoint in:
  - `src/auth/controllers/audit-logs.controller.ts`
  - `src/auth/services/audit.service.ts`
- Audit surface is now explicitly scope-limited by runtime policy:
  - owner/admin only
  - Professional+ only through `@RequirePlan(professional)`
- Added real frontend pages in:
  - `src/frontend/pages/users/UsersPage.tsx`
  - `src/frontend/pages/settings/SettingsPage.tsx`
  - `src/frontend/pages/audit/AuditPage.tsx`
- Settings now edits real organization data via `/organizations/me`, including:
  - org identity fields
  - MFA requirement
  - audit retention
  - notification channel preferences in `settings`
- Fixed broken frontend profile API handling in:
  - `src/frontend/services/profile.service.ts`
- Aligned shell/navigation exposure in:
  - `src/frontend/components/navigation/Navigation.tsx`
  - `src/frontend/components/navigation/Breadcrumbs.tsx`
  - `src/frontend/components/navigation/Navigation.css`
- Navigation now exposes the previously hidden or unsurfaced route-backed modules:
  - `profile`
  - `activity`
  - `reports`
  - `users`
  - `settings`

#### Queue Impact
- Conversation 15 is now implemented locally.
- Conversation 16 is now implemented locally.
- The remaining ordered queue after Conversation 11 is now:
  - Conversation 17: onboarding/profile scope reconciliation
  - Conversation 18: secondary module depth or explicit phase labeling

#### Important Limitations
- No invitation acceptance flow or SMTP dispatch execution was added in this pass; invitation records are created and managed locally, while transport proof still belongs to Conversation 11 staging rehearsal.
- `/audit` now works through the standard audit log store rather than the disabled `EnterpriseModule` WORM audit surface.

### 2026-03-10 - Verification Of Conversations 10-14 + Event DTO Regression Fix

#### Verification Status
- `npm run test:e2e -- --runInBand` -> PASS (22/22)
- `npm test -- --runInBand src/invoices/services/invoice.service.spec.ts src/notifications/services/notification.service.spec.ts src/events/services/event.service.spec.ts` -> PASS (9/9)
- `npx eslint src/events/dto/event.dto.ts src/events/services/event.service.ts src/notifications/services/notification.service.ts` -> PASS
- `npm run build` -> PASS

#### Verification Outcome
- Re-checked the completion claims for Conversations 10-14 against the current codebase and backlog.
- Found and fixed a real regression in:
  - `src/events/dto/event.dto.ts`
- Regression details:
  - duplicate `reminderDaysBefore` in `CreateEventDto` broke the e2e suite even though Conversation 13 had been marked complete
- Also removed misleading implementation comments in:
  - `src/events/services/event.service.ts`
  - `src/notifications/services/notification.service.ts`
- Final assessment after the verification pass:
  - Conversations 10, 12, 13, and 14 are locally verified
  - Conversation 11 remains the first real unchecked execution track because it depends on external staging/runtime proof
  - the next implementation backlog remains:
    - Conversation 15: users/settings/audit surfaces
    - Conversation 16: shell/navigation alignment
    - Conversation 17: onboarding/profile scope reconciliation
    - Conversation 18: secondary module depth or explicit phase labeling

#### Important Limitation
- This pass re-verified local code and docs, but did not satisfy the external staging/runtime evidence required by Conversation 11.

### 2026-03-10 - Product Scope Reconciliation Refresh

#### Verification Status
- No additional code verification commands were run in this pass.
- Scope was documentation-only: product audit refresh, status correction, and backlog reorder.

#### Product Audit Changes
- Refreshed `docs/REQUIREMENTS_ALIGNMENT_AUDIT.md` against the current frontend/router state.
- Corrected outdated findings:
  - landing page is implemented
  - client details and case details are route-backed, not missing
  - calendar, activity, pricelists, reports, print forms, chat, mail, and calculations all have real routes/pages
- Reframed the remaining gaps around what is actually still missing:
  - `/users`, `/audit`, and `/settings` remain placeholders
  - some route-backed modules are still only workspace hubs rather than product-complete workflows
  - navigation/IA exposure still lags behind the now-expanded route surface
- Reordered the next backlog around:
  - admin/ops placeholder replacement
  - shell/navigation alignment
  - onboarding/profile scope reconciliation
  - secondary module completion / explicit phase labeling

#### Important Limitation
- Conversation 14 is documentation-complete, but not an implementation pass.
- No frontend behavior changed here; the result is a corrected backlog and status model for the next sessions.

### 2026-03-10 - Commercial Workflow Completion For Invoices, Notifications, And Reminders

#### Verification Status
- `npm test -- --runInBand src/invoices/services/invoice.service.spec.ts src/notifications/services/notification.service.spec.ts src/events/services/event.service.spec.ts` -> PASS (9/9)
- `npm run lint:backend -- --fix=false src/invoices/services/invoice.service.ts src/invoices/services/invoice.service.spec.ts src/invoices/invoices.module.ts src/notifications/services/notification.service.ts src/notifications/services/notification.service.spec.ts src/database/entities/Notification.entity.ts src/events/services/event.service.ts src/events/services/event.service.spec.ts src/events/events.module.ts src/events/dto/event.dto.ts` -> PASS
- `npm run build` -> PASS

#### Commercial Workflow Changes
- Completed invoice PDF generation/storage and delivery wiring in:
  - `src/invoices/services/invoice.service.ts`
  - `src/invoices/invoices.module.ts`
- Invoice behavior now:
  - computes/stores invoice financial totals and line-item metadata on create
  - generates a stored PDF artifact through `StorageProviderService`
  - queues client email delivery before moving invoice status to `sent`
  - records delivery/pdf metadata on the invoice row
- Replaced notification stub queueing with DB-backed queued delivery in:
  - `src/notifications/services/notification.service.ts`
  - `src/database/entities/Notification.entity.ts`
- Notification behavior now:
  - persists `queued -> delivered/failed` transitions
  - runs cron-based delivery processing for `email`, `sms`, `push`, and `in_app`
  - records delivery/failure metadata instead of debug-only logging
- Completed cron-based event reminder delivery in:
  - `src/events/services/event.service.ts`
  - `src/events/events.module.ts`
  - `src/events/dto/event.dto.ts`
- Event reminder behavior now:
  - resets reminder state on schedule changes
  - finds due reminder windows every minute
  - creates notification records for the event owner and marks reminders sent
- Added focused workflow coverage in:
  - `src/invoices/services/invoice.service.spec.ts`
  - `src/notifications/services/notification.service.spec.ts`
  - `src/events/services/event.service.spec.ts`

#### Important Limitation
- Conversation 13 is application-complete.
- External commercial transports are still not staging-proven:
  - SMTP/email provider execution
  - real SMS gateway execution
  - push transport execution
  - customer-visible delivery evidence outside local DB state

### 2026-03-10 - Billing Provider Synchronization + Customer Billing Retrieval

#### Verification Status
- `npm test -- --runInBand src/billing/services/billing.service.spec.ts src/billing/services/stripe.service.spec.ts` -> PASS (16/16)
- `npm run lint:backend -- --fix=false src/billing/services/billing.service.ts src/billing/services/stripe.service.ts src/billing/services/wayforpay.service.ts src/billing/controllers/billing-webhooks.controller.ts src/main.ts src/billing/services/billing.service.spec.ts src/billing/services/stripe.service.spec.ts` -> PASS
- `npm run build` -> PASS

#### Billing Changes
- Completed provider-backed billing synchronization in:
  - `src/billing/services/billing.service.ts`
  - `src/billing/services/stripe.service.ts`
  - `src/billing/services/wayforpay.service.ts`
  - `src/billing/controllers/billing-webhooks.controller.ts`
  - `src/main.ts`
- Stripe webhook handling now:
  - consumes raw request body for signature validation
  - synchronizes subscription state into local `subscriptions`
  - updates organization subscription snapshot fields
  - ignores duplicate webhook events via `latestWebhookEventId`
- WayForPay webhook handling now:
  - enforces duplicate-event suppression on repeated order/status callbacks
  - records normalized payment history in subscription metadata
  - exposes invoice/payment-method views from real provider-backed local state instead of placeholders
- Customer-facing billing retrieval now works for:
  - Stripe invoices
  - Stripe payment methods
  - WayForPay invoice history view
  - WayForPay payment-method summary view
- Added focused billing verification coverage in:
  - `src/billing/services/billing.service.spec.ts`
  - `src/billing/services/stripe.service.spec.ts`

#### Important Limitation
- Conversation 12 is application-complete for provider synchronization and retrieval.
- Remaining commercial follow-up is now transport/provider proof in staging rather than missing local billing code:
  - SMTP/email execution evidence
  - SMS/push execution evidence
  - operator-facing delivery validation outside local DB state

### 2026-03-10 - Operator Runbooks For Key Rotation And Backfill Rehearsal

#### Verification Status
- No additional code verification commands were run in this pass.
- Scope was documentation-only: operator runbooks and staging checklist refinement.

#### Documentation Changes
- Added blind-index/encryption-key rotation runbook in:
  - `docs/BLIND_INDEX_KEY_ROTATION_RUNBOOK.md`
- Added production-scale backfill rehearsal runbook in:
  - `docs/PRODUCTION_BACKFILL_REHEARSAL_RUNBOOK.md`
- Linked the new runbooks from:
  - `docs/LAUNCH_REHEARSAL_CHECKLIST.md`
  - `docs/DEPLOYMENT.md`
  - `docs/AGENT_EXECUTION_CHECKLIST.md`

#### Important Limitation
- Conversation 11 is still not execution-complete.
- The remaining items still require external staging or production-like infrastructure:
  - deploy/boot proof
  - readiness probe proof on staging
  - Redis/PostgreSQL degradation drills
  - backup/restore evidence
  - scanner/provider runtime rehearsal

### 2026-03-10 - Live Trust Provider Integration Path + Signed Callback Hardening

#### Verification Status
- `npm test -- --runInBand src/trust-verification/services/trust-verification.service.spec.ts src/trust-verification/services/trust-verification-worker.service.spec.ts src/trust-verification/services/trust-provider.adapters.spec.ts src/trust-verification/services/trust-callback-auth.service.spec.ts` -> PASS (12/12)
- `npm run lint:backend -- --fix=false src/trust-verification/services/trust-verification.service.ts src/trust-verification/services/trust-provider.adapters.ts src/trust-verification/services/trust-callback-auth.service.ts src/trust-verification/controllers/trust-verification.controller.ts src/common/config/environment.validator.ts src/trust-verification/services/trust-verification.service.spec.ts src/trust-verification/services/trust-provider.adapters.spec.ts src/trust-verification/services/trust-callback-auth.service.spec.ts` -> PASS
- `npm run build` -> PASS

#### Trust Integration Changes
- Replaced stub-only trust adapters with configurable live exchange paths in:
  - `src/trust-verification/services/trust-provider.adapters.ts`
- Added live-capable provider behavior:
  - ACSK signature/identity verification can now call upstream verification URLs and optional OCSP/CRL status endpoints
  - Diia identity/signature verification can now perform token exchange plus upstream verification calls
  - BankID NBU identity verification can now perform token exchange plus upstream verification/status calls
  - stub mode remains available explicitly through provider config for local/dev environments
- Hardened provider callbacks in:
  - `src/trust-verification/services/trust-callback-auth.service.ts`
  - `src/trust-verification/controllers/trust-verification.controller.ts`
  - `src/trust-verification/services/trust-verification.service.ts`
- Callback security now includes:
  - provider-specific callback secrets
  - HMAC signature verification
  - timestamp freshness checks
  - nonce replay protection with Redis-backed storage when available and in-memory fallback otherwise
  - audit metadata capture for callback nonce/provider event intake
- Added startup validation for live-mode provider configuration in:
  - `src/common/config/environment.validator.ts`
- Added focused verification coverage in:
  - `src/trust-verification/services/trust-provider.adapters.spec.ts`
  - `src/trust-verification/services/trust-callback-auth.service.spec.ts`
  - `src/trust-verification/services/trust-verification.service.spec.ts`

#### Important Limitation
- Conversation 10 is implementation-complete inside the application layer.
- External proof is still pending:
  - real provider credentials and exact upstream contracts are not stored in this workspace
  - no staging evidence was produced for ACSK/Diia/BankID
  - production launch still requires Conversation 11 staging/operator rehearsal
### 2026-03-10 - Full Project Reassessment + End-To-End Verification Refresh

#### Verification Status
- `npm run lint` -> PASS
- `npm test -- --runInBand` -> PASS (21 passed, 1 skipped suite / 3 skipped tests)
- `RLS_TEST_DATABASE_URL='postgresql://postgres@127.0.0.1:55432/postgres' npm test -- --runInBand src/database/migrations/harden-postgres-rls-policies.spec.ts` -> PASS (3/3)
- `npm run test:e2e -- --runInBand` -> PASS (22/22)
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS
- `npm run test:frontend:smoke` -> PASS (2/2)

#### Assessment / Stabilization Changes
- Re-ran the full local verification surface after the hardening conversations and confirmed the core CRM/security baseline is green locally.
- Fixed a controller request-typing regression in:
  - `src/auth/controllers/auth.controller.ts`
  - `src/auth/controllers/organization.controller.ts`
  - `src/billing/controllers/billing.controller.ts`
  - `src/billing/controllers/billing-webhooks.controller.ts`
  - `src/auth/interfaces/jwt.interface.ts`
- Fixed nullable entity typing drift in:
  - `src/database/entities/DocumentSignature.entity.ts`
- Updated the cases e2e contract in:
  - `tests/cases.e2e-spec.ts`
  - case creation tests now reflect the current backend behavior:
    - internal `caseNumber` is generated from `metadata.client_number`
    - court/external numbers live in `registryCaseNumber`

#### Current Stage
- The project is now best described as a pre-production release candidate for the core CRM/security platform.
- It is not yet production-ready because live provider integrations, real staging/ops drills, and some commercial workflow integrations remain open.

### 2026-03-10 - Frontend Quality Gate + Live UX Audit

#### Verification Status
- `npm run lint` -> PASS
- `npm run build:frontend` -> PASS
- `npm run test:frontend:smoke` -> PASS (2/2)

#### Frontend Quality Changes
- Added frontend files to the real lint surface in:
  - `package.json`
  - `.eslintrc.js`
- Added critical-route browser smoke in:
  - `playwright.config.ts`
  - `tests/playwright/frontend-smoke.spec.ts`
- Browser-audited routes now include:
  - `/`
  - `/login`
  - `/dashboard`
  - `/clients`
  - `/cases`
  - `/documents`
  - `/calendar`
  - `/pricelists`
- Live audit fixes landed in:
  - `src/frontend/pages/documents/DocumentsPage.tsx`
    - restored `ACCESS_LEVEL_LABELS`, fixing a runtime crash on `/documents`
  - `src/frontend/components/Input.tsx`
    - forwarded `autoFocus` so login focus behavior works in real browser navigation
  - `src/frontend/pages/auth/LoginPage.tsx`
    - aligned auth inputs with the shared input contract
  - `src/frontend/pages/landing/LandingPage.tsx`
    - removed duplicate React keys in the comparison grid

#### Important Limitation
- Conversation 9 is now complete.
- Browser smoke uses mocked API responses, so it proves route-shell/browser behavior but does not replace a live staging run against the full backend.

### 2026-03-10 - Monitoring, Alerting, And Launch Rehearsal

#### Verification Status
- `npm run lint` -> PASS
- `npm test -- --runInBand src/common/health/operational-monitoring.service.spec.ts src/common/logging/global-exception.filter.spec.ts` -> PASS (3/3)
- `npm run build` -> PASS

#### Operational Monitoring Changes
- Added application-level readiness and alerting in:
  - `src/common/health/operational-monitoring.service.ts`
  - `src/common/health/health.controller.ts`
  - `src/common/logging/global-exception.filter.ts`
  - `src/main.ts`
- Runtime behavior now includes:
  - `GET /health` as liveness
  - `GET /readiness` as a degraded/unhealthy readiness probe with database, Redis, auth, billing, trust-verification, malware-scan, and outbox signals
  - `503` readiness responses when the stack is degraded or unhealthy
  - structured security events for tenant-context and data-isolation denials
  - scheduled alert emission for auth lockouts, trust-verification failures/backlog, malware failures/backlog, infected uploads, outbox backlog risk, and billing anomalies
- Added targeted coverage in:
  - `src/common/health/operational-monitoring.service.spec.ts`
  - `src/common/logging/global-exception.filter.spec.ts`
- Added evidence-based operator runbook in:
  - `docs/LAUNCH_REHEARSAL_CHECKLIST.md`

#### Important Limitation
- Conversation 8 is now complete at the application/docs layer.
- Live staging deploy/outage/backup drills and real on-call/Sentry delivery still need execution outside this local workspace.

### 2026-03-09 - Schema Debt + Soft-Delete Index Hardening

#### Verification Status
- `npm run lint` -> PASS
- `npm run build` -> PASS
- `npm test -- --runInBand src/database/migrations/harden-soft-delete-indexes-and-invitations.spec.ts` -> PASS (2/2)

#### Schema Hardening Changes
- Fixed the invitations soft-delete schema mismatch in:
  - `src/database/entities/Invitation.entity.ts`
  - `src/database/migrations/1710600000000-HardenSoftDeleteIndexesAndInvitations.ts`
- Added PostgreSQL partial indexes for common active-record query paths across:
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
  - `invitations`
- Added migration contract coverage in:
  - `src/database/migrations/harden-soft-delete-indexes-and-invitations.spec.ts`

#### Important Limitation
- Conversation 7 is now complete.
- This pass hardens PostgreSQL migration state and hot-path indexes, but it does not replace a full production-like migration rehearsal or full backend test sweep.

### 2026-03-09 - File Security + Malware Scanning Workflow

#### Verification Status
- `npm run lint` -> PASS
- `npm run build` -> PASS
- `npm test -- --runInBand src/file-storage/services/malware-scanner.service.spec.ts src/file-storage/services/file-scan.service.spec.ts src/file-storage/services/file-storage.service.spec.ts` -> PASS (7/7)

#### Upload-Security Changes
- Added persistent malware scan tracking in:
  - `src/database/entities/FileScanRecord.entity.ts`
  - `src/database/migrations/1710500000000-AddMalwareScanningWorkflow.ts`
- Extended documents with operator-visible scan state in:
  - `src/database/entities/Document.entity.ts`
  - `src/documents/dto/document.dto.ts`
- Added scanner + scan lifecycle services in:
  - `src/file-storage/services/malware-scanner.service.ts`
  - `src/file-storage/services/file-scan.service.ts`
  - `src/file-storage/services/file-storage.service.ts`
- Added lifecycle behavior:
  - uploads now create pending file scan records
  - signed URLs and direct file downloads are blocked unless the file scan status is `clean`
  - infected files and scan failures emit audit events and remain blocked
  - document records now expose malware scan state for operator visibility
  - scheduled scan processing now reuses the existing scheduler infrastructure
- Scanner path:
  - default local/test mode uses a deterministic stub engine with EICAR detection
  - command-based ClamAV integration is supported through `MALWARE_SCANNER_MODE=clamav_command`

#### Important Limitation
- Conversation 6 is now complete at the workflow level.
- Production still requires real scanner deployment and operational tuning; command-based ClamAV wiring exists, but the environment must actually provide the scanner binary/service.

### 2026-03-09 - Trust Provider Verification Workflow + Async Worker

#### Verification Status
- `npm run lint` -> PASS
- `npm run build` -> PASS
- `npm test -- --runInBand src/trust-verification/services/trust-verification.service.spec.ts src/trust-verification/services/trust-verification-worker.service.spec.ts` -> PASS (5/5)

#### Verification Workflow Changes
- Added provider-neutral trust verification orchestration in:
  - `src/trust-verification/services/trust-verification.service.ts`
  - `src/trust-verification/services/trust-verification-worker.service.ts`
  - `src/trust-verification/services/trust-provider.adapters.ts`
  - `src/trust-verification/services/trust-provider.registry.ts`
  - `src/trust-verification/controllers/trust-verification.controller.ts`
  - `src/trust-verification/trust-verification.module.ts`
- Added persistent verification job model in:
  - `src/database/entities/TrustVerificationJob.entity.ts`
  - `src/database/migrations/1710400000000-AddTrustVerificationWorkflow.ts`
- Extended trust evidence entities with async verification state:
  - `src/database/entities/UserIdentity.entity.ts`
  - `src/database/entities/DocumentSignature.entity.ts`
- New workflow behavior:
  - identity verification requests now create/update `user_identities` records and enqueue persistent verification jobs
  - document signing now stores signatures as `pending` and enqueues verification instead of treating provider-backed signatures as implicitly verified
  - scheduled worker processing handles verify, callback, retry, and recheck jobs
  - callback path is now explicit via `POST /trust-verifications/callbacks`
  - audit events are recorded for verification requests, retries, completions, callbacks, and revocations

#### Important Limitation
- Conversation 5 is now complete at the provider-neutral architecture level.
- `acsk`, `diia`, and `bankid_nbu` adapters are wired and test-covered, but still run in provider-stub mode.
- Live certificate validation, CRL/OCSP execution, Diia.Sign exchange, and BankID NBU production OAuth/provider callbacks remain separate launch blockers.

### 2026-03-09 - PII Encryption + Log Redaction Completion

#### Verification Status
- `npm run lint` -> PASS
- `npm run build` -> PASS
- `npm test -- --runInBand src/common/security/pii-protection.spec.ts src/auth/services/auth.service.spec.ts src/clients/services/client.service.spec.ts src/auth/services/audit.service.spec.ts` -> PASS (70/70)

#### Data-Protection Changes
- Added shared field-level encryption and recursive redaction helpers in:
  - `src/common/security/pii-protection.ts`
- Encrypted selected non-searchable PII columns in:
  - `src/database/entities/Organization.entity.ts`
  - `src/database/entities/User.entity.ts`
  - `src/database/entities/Client.entity.ts`
- Current encrypted-at-rest coverage includes:
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
- Added backfill migration:
  - `src/database/migrations/1710300000000-EncryptSensitivePiiFields.ts`
  - `src/database/migrations/1710310000000-EncryptSearchablePiiWithBlindIndexes.ts`
- Added blind-index search support and searchable-field normalization in:
  - `src/common/security/pii-protection.ts`
- Searchable-field runtime changes:
  - login / forgot-password / registration uniqueness checks now resolve users through blind indexes
  - client email / phone / `edrpou` / `inn` lookups now use exact-match blind-index predicates instead of plaintext `ILIKE`
  - `organization.email`, `user.email`, and searchable client identifiers are encrypted at rest while retaining exact-match searchability
- Added PII redaction before persistence/output in:
  - `src/auth/services/audit.service.ts`
  - `src/common/logging/logger.config.ts`
- Tightened production env validation for encryption in:
  - `src/common/config/environment.validator.ts`

#### Search Contract
- Conversation 4 is now complete.
- Searchable PII is no longer stored plaintext; exact-match lookups are preserved through blind indexes.
- Partial/fuzzy search remains available for non-sensitive name/company fields, but it is no longer a supported contract for encrypted PII fields such as email, phone, `edrpou`, or `inn`.

### 2026-03-09 - Registry Workspace Minimalism Pass

#### Verification Status
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Removed non-functional promotional/summary surfaces from the main CRM workspaces to align the product with a denser ERP/CRM registry layout:
  - `src/frontend/pages/dashboard/DashboardPage.tsx`
  - `src/frontend/pages/clients/ClientsPage.tsx`
  - `src/frontend/pages/cases/CasesPage.tsx`
  - `src/frontend/pages/documents/DocumentsPage.tsx`
- Deleted the corresponding decorative CSS blocks and flattened the registry shells in:
  - `src/frontend/pages/dashboard/DashboardPage.css`
  - `src/frontend/pages/clients/ClientsPage.css`
  - `src/frontend/pages/cases/CasesPage.css`
  - `src/frontend/pages/documents/DocumentsPage.css`
- UX result:
  - dashboard no longer renders the large hero summary strip
  - clients/cases/documents now open directly into the working registry area instead of stacked KPI cards and slogan headers
  - registry containers use a plainer white-table presentation with lighter hover/fill treatment

#### Remaining Risk
- This pass was verified with production frontend build only; no manual browser QA was run yet across desktop/mobile registry screens after the layout simplification.

### 2026-03-09 - Access-Token Revocation + Auth Perimeter Hardening

#### Verification Status
- `npm run lint` -> PASS
- `npm run build` -> PASS
- `npm test -- --runInBand src/common/security/redis-throttler.storage.spec.ts src/auth/services/auth.service.spec.ts src/auth/strategies/jwt.strategy.spec.ts src/auth/guards/access-control.guards.spec.ts src/common/interceptors/rls.interceptor.spec.ts src/auth/services/audit.service.spec.ts` -> PASS (50/50)
- `RLS_TEST_DATABASE_URL='postgresql://postgres@127.0.0.1:55432/postgres' npm test -- --runInBand src/database/migrations/harden-postgres-rls-policies.spec.ts` -> PASS (3/3)

#### Security / Auth Changes
- Added DB-backed access-token revocation in:
  - `src/database/entities/RevokedAccessToken.entity.ts`
  - `src/database/migrations/1710200000000-AddAccessTokenRevocation.ts`
- Added user-level session cutoff in:
  - `src/database/entities/User.entity.ts`
  - `sessionInvalidBefore` now supports immediate bulk invalidation of older access tokens
- Updated auth flows in:
  - `src/auth/services/auth.service.ts`
  - logout revokes the presented access token JTI plus the supplied refresh token
  - logout-all and password reset invalidate all active sessions and revoke outstanding refresh tokens
- Hardened JWT enforcement in:
  - `src/auth/strategies/jwt.strategy.ts`
  - revoked access JWTs are rejected
  - tokens issued before `sessionInvalidBefore` or `lastPasswordChangeAt` are rejected
  - inactive organizations now block JWT-authenticated access
- Tightened API/browser perimeter in:
  - `src/main.ts`
  - the platform now explicitly runs a bearer-only auth model with `Authorization` headers and `CORS credentials: false`
- Added Redis-backed throttling for hardened production deployments in:
  - `src/common/security/redis-throttler.storage.ts`
  - `src/app.module.ts`
  - `src/common/config/environment.validator.ts`
  - production startup now requires Redis-backed throttling to remain enabled/configured
- Added coverage in:
  - `src/auth/services/auth.service.spec.ts`
  - `src/auth/strategies/jwt.strategy.spec.ts`
  - `src/common/security/redis-throttler.storage.spec.ts`

#### Important Limitation
- Conversation 3 is complete.
- The next canonical security/backlog step is:
  - PII encryption and log redaction
  - trust-provider verification
  - malware scanning

### 2026-03-09 - Declarative RBAC + Server-Side Subscription Enforcement

#### Verification Status
- `npm run lint` -> PASS
- `npm run build` -> PASS
- `npm test -- --runInBand src/auth/guards/access-control.guards.spec.ts src/clients/services/client.service.spec.ts src/cases/services/case.service.spec.ts` -> PASS (48/48)
- `npm test -- --runInBand src/auth/guards/access-control.guards.spec.ts src/clients/services/client.service.spec.ts src/cases/services/case.service.spec.ts src/common/interceptors/rls.interceptor.spec.ts src/auth/services/auth.service.spec.ts src/auth/services/audit.service.spec.ts src/database/migrations/harden-postgres-rls-policies.spec.ts` -> PARTIAL
  - PostgreSQL suite skips without `RLS_TEST_DATABASE_URL`
- `RLS_TEST_DATABASE_URL='postgresql://postgres@127.0.0.1:55432/postgres' npm test -- --runInBand src/database/migrations/harden-postgres-rls-policies.spec.ts` -> PASS (3/3)

#### Security / Access-Control Changes
- Added declarative access-control decorators in:
  - `src/auth/decorators/access-control.decorators.ts`
- Activated metadata-driven RBAC and plan checks in:
  - `src/auth/guards/index.ts`
- Added canonical plan limits in:
  - `src/common/security/subscription-limits.ts`
- Applied `@Roles` and `@RequirePlan` to the audited mutating controller surface in:
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
- Added server-side quota enforcement in:
  - `src/clients/services/client.service.ts`
  - `src/cases/services/case.service.ts`
  - `basic` now enforces up to 1 client and 3 cases at backend create/restore/import boundaries
  - professional-tier bulk import/upload operations are now gated through `SubscriptionGuard`
- Added denial-path coverage in:
  - `src/auth/guards/access-control.guards.spec.ts`
  - `src/clients/services/client.service.spec.ts`
  - `src/cases/services/case.service.spec.ts`

#### Important Limitation
- Conversations 1 and 2 are complete.
- The next canonical security/backlog step is:
  - access-token revocation
  - CSRF
  - Redis-backed distributed throttling

### 2026-03-09 - Security Status Reconciliation + Runtime Hardening

#### Verification Status
- `npm run lint` -> PASS
- `npm test -- --runInBand` -> PARTIAL
  - 89/91 tests passed
  - existing unrelated failure remains in `src/clients/services/client.service.spec.ts` (`ClientService.getStatistics`)
- `npm run build` -> PASS

#### Security / Runtime Changes
- Corrected contradictory readiness/security claims across:
  - `docs/PRODUCTION_READINESS_REPORT.md`
  - `docs/SECURITY_AUDIT_REPORT.md`
  - `docs/SECURITY.md`
  - `docs/PROJECT_CONTEXT_CACHE.md`
- Enabled real backend runtime security headers with:
  - `helmet` in `src/main.ts`
- Tightened production startup validation in:
  - `src/common/config/environment.validator.ts`
  - production now requires `ALLOWED_ORIGINS`
- Hardened JWT validation in:
  - `src/auth/strategies/jwt.strategy.ts`
  - current `role`, `subscriptionPlan`, and `email` are reloaded from the database on each request
  - access tokens issued before the last password change are rejected
- Added coverage for the tightened JWT validation in:
  - `src/auth/strategies/jwt.strategy.spec.ts`

#### Important Limitation
- This pass established a trustworthy status baseline, but did not complete the major open controls:
  - tenant+user PostgreSQL RLS
  - declarative RBAC (`@Roles`)
  - server-side subscription quotas
  - access-token blacklist/logout-all invalidation
  - CSRF protection
  - Redis-backed distributed rate limiting
  - PII encryption
  - trust-provider verification
  - malware scanning

### 2026-03-09 - PostgreSQL RLS Runtime + Policy Hardening

#### Verification Status
- `npm run lint` -> PASS
- `npm test -- --runInBand src/common/interceptors/rls.interceptor.spec.ts` -> PASS (2/2)
- `npm test -- --runInBand src/auth/services/auth.service.spec.ts` -> PASS (26/26)
- `npm test -- --runInBand src/auth/services/audit.service.spec.ts` -> PASS (2/2)
- `RLS_TEST_DATABASE_URL='postgresql://postgres@127.0.0.1:55432/postgres' npm test -- --runInBand src/database/migrations/harden-postgres-rls-policies.spec.ts` -> PASS (3/3)
- `npm run build` -> PASS

#### Security / Database Changes
- Replaced the previous non-functional RLS interceptor approach with request-scoped PostgreSQL session context wiring in:
  - `src/common/interceptors/rls.interceptor.ts`
  - `src/app.module.ts`
- Runtime now propagates:
  - `app.current_tenant_id`
  - `app.current_user_id`
  - `app.current_user_role`
- Added PostgreSQL hardening migration:
  - `src/database/migrations/1710100000000-HardenPostgresRlsPolicies.ts`
- Fixed a PostgreSQL bootstrap defect in:
  - `src/database/migrations/1706400000000-EnableRowLevelSecurity.ts`
  - hard-coded grants now execute only if the `law_organizer` role exists
- Migration upgrades:
  - removes the `current_tenant_id() IS NULL` read loophole from prior policies
  - adds helper functions for tenant/user/role extraction and elevated-role checks
  - forces RLS on covered tables
  - adds tenant+user-aware policies for `clients`, `cases`, `documents`
  - adds direct-record RLS for `user_identities` and `document_signatures`
  - fills missing tenant-only policy coverage for `pricelists`, `calculations`, and `onboarding_progress`
- Added targeted coverage:
  - `src/common/interceptors/rls.interceptor.spec.ts`
  - `src/database/migrations/harden-postgres-rls-policies.spec.ts`
- Hardened unauthenticated registration write-paths in:
  - `src/auth/services/auth.service.ts`
  - registration transactions now set tenant/user/role session context before inserts into `users` and `onboarding_progress`
- Added unit coverage for registration under forced RLS assumptions in:
  - `src/auth/services/auth.service.spec.ts`
- Hardened audit-log persistence for public/system flows in:
  - `src/auth/services/audit.service.ts`
  - when ALS/request context is unavailable, audit writes now use an explicit tenant-scoped PostgreSQL query-runner path so forced RLS does not silently drop audit events
- Added unit coverage for that fallback in:
  - `src/auth/services/audit.service.spec.ts`

#### Important Limitation
- Conversation 1 is complete.
- The next canonical security/backlog step is:
  - declarative RBAC (`@Roles`)
  - server-side subscription enforcement

### 2026-03-09 - Agent Execution Checklist + Ordered Conversation Queue

#### Verification Status
- Docs-only change; no lint/test/build commands were run

#### Documentation / Process Changes
- Added canonical agent backlog and ordered session plan in:
  - `docs/AGENT_EXECUTION_CHECKLIST.md`
- Structured the remaining work into dedicated conversations for:
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
- Declared the checklist to be the default execution queue for future non-trivial agent sessions unless the user reprioritizes

#### Important Limitation
- This queue remains trustworthy only if each future session updates checklist status, verification results, and unresolved blockers in the docs immediately after the work lands

### 2026-03-09 - Public Landing Entry Flow + Remember-Me Session Routing

#### Verification Status
- `npm run build:frontend` -> PASS

#### Frontend / Auth Flow Changes
- Added a new public marketing landing page and made it the unauthenticated root route:
  - `src/frontend/pages/landing/LandingPage.tsx`
  - `src/frontend/pages/landing/LandingPage.css`
- Updated routing in `src/frontend/App.tsx` so:
  - first-time visitors land on `/`
  - authenticated users are redirected from `/`, `/login`, and `/register` to `/dashboard`
- Implemented real remember-me persistence with a shared storage abstraction:
  - `src/frontend/services/auth-storage.ts`
  - remembered sessions persist in `localStorage`
  - non-remembered sessions persist only in `sessionStorage`
- Updated auth/session consumers to use the centralized storage layer:
  - `src/frontend/services/auth.service.ts`
  - `src/frontend/services/api.ts`
  - `src/frontend/services/logger.service.ts`
  - `src/frontend/store/auth.slice.ts`
  - `src/frontend/hooks/useAuth.ts`
- Updated auth pages so authenticated users do not remain on login/register screens:
  - `src/frontend/pages/auth/LoginPage.tsx`
  - `src/frontend/pages/auth/RegisterPage.tsx`

#### Important Limitation
- Registration still auto-signs the user into a non-persistent session by default; cross-visit dashboard auto-entry currently depends on using the remember-me login path
- No manual browser QA was run yet for the new landing page on real desktop/mobile devices

### 2026-03-09 - Landing Copy Rewrite + Pricing Positioning

#### Verification Status
- `npm run build:frontend` -> PASS

#### Frontend / Product Messaging Changes
- Rewrote the landing page copy in:
  - `src/frontend/pages/landing/LandingPage.tsx`
  - `src/frontend/pages/landing/LandingPage.css`
- Updated the messaging to better match the actual product model:
  - legal CRM for clients, cases, documents, deadlines, and calendar
  - value proposition for solo lawyers, private practice, and legal firms
  - stronger registration-oriented call-to-action copy
- Added a dedicated pricing section with explicit commercial positioning:
  - Free: 1 client, 3 cases
  - Pro: `299 грн/місяць`, positioned as unlimited day-to-day use
  - Corporate: `499 грн` first account + `199 грн` each next account, with pooled accounts and admin access-control panel messaging

#### Important Limitation
- Pricing copy is currently frontend-presentational only; no billing logic or backend plan enforcement was changed in this task
- No legal/commercial review of the marketing wording was performed yet

### 2026-03-09 - Full Landing Redesign After Desktop Review

#### Verification Status
- `npm run build:frontend` -> PASS

#### Frontend / UX Changes
- Rebuilt the landing page structure in:
  - `src/frontend/pages/landing/LandingPage.tsx`
  - `src/frontend/pages/landing/LandingPage.css`
- Replaced the previous flat repeated-card layout with a more explicit landing composition:
  - hero with stronger product headline
  - right-side product-preview mockup instead of a redundant text card
  - metric strip
  - problem/pain section
  - refined feature grid
  - pricing cards
  - pricing comparison table
  - FAQ block
  - final conversion CTA section
- Removed the weak `Як це працює` onboarding-style copy that described routing mechanics instead of product value
- Reframed the text toward product marketing for legal operations, private practice, and legal teams
- Preserved the requested pricing model and corporate access-control positioning in a more structured visual format

#### Important Limitation
- The redesign was verified by build only; no browser QA or stakeholder copy review was performed yet
- The pricing/comparison sections remain presentational and do not change backend subscription enforcement

### 2026-03-09 - Landing Art Direction Polish Pass

#### Verification Status
- `npm run build:frontend` -> PASS

#### Frontend / Visual Changes
- Applied a second visual polish pass to:
  - `src/frontend/pages/landing/LandingPage.tsx`
  - `src/frontend/pages/landing/LandingPage.css`
- Improved premium SaaS presentation through:
  - landing-specific typography (`Manrope` + `Cormorant Garamond`)
  - editorial-style hero headline treatment
  - scenario pills under hero CTAs
  - stronger preview ribbon emphasizing the Pro plan
  - softer hover elevation on metrics/cards
  - more explicit pricing intro copy
  - richer final CTA block supporting corporate upsell
- Goal of this pass:
  - reduce the “admin panel” feel
  - make the page feel more premium and product-marketing oriented
  - strengthen hierarchy without changing app routing or product logic

#### Important Limitation
- Changes are still landing-only and do not re-theme the rest of the authenticated product
- No browser screenshot validation was rerun in this pass because the user already had the project running in their own terminal

### 2026-03-09 - Auth + Dashboard First-Run Visual Continuity

#### Verification Status
- `npm run build:frontend` -> PASS

#### Frontend / UX Changes
- Upgraded auth entry pages so they visually match the new landing direction:
  - `src/frontend/pages/auth/LoginPage.tsx`
  - `src/frontend/pages/auth/LoginPage.css`
  - `src/frontend/pages/auth/RegisterPage.tsx`
  - `src/frontend/pages/auth/RegisterPage.css`
- Login and registration now use:
  - split premium two-column layouts
  - editorial left-side showcase panels
  - warmer premium light/dark palette closer to the landing
  - clearer subtitles and entry messaging
- Added a new welcome surface to the dashboard:
  - `src/frontend/pages/dashboard/DashboardPage.tsx`
  - `src/frontend/pages/dashboard/DashboardPage.css`
- Dashboard now opens with:
  - short practice summary
  - user/organization-aware greeting
  - compact top-level metrics strip for current stats, recent cases, and upcoming events

#### Important Limitation
- This pass improves the auth transition and dashboard opening state, but does not yet restyle the broader authenticated modules for full visual parity with the landing
- No browser QA was rerun after the auth/dashboard polish; validation is build-only

### 2026-03-09 - Registry Workspace Continuity Pass

#### Verification Status
- `npm run build:frontend` -> PASS

#### Frontend / UX Changes
- Upgraded the main registry-style workspaces to better match the new landing -> auth -> dashboard flow:
  - `src/frontend/pages/clients/ClientsPage.tsx`
  - `src/frontend/pages/clients/ClientsPage.css`
  - `src/frontend/pages/cases/CasesPage.tsx`
  - `src/frontend/pages/cases/CasesPage.css`
  - `src/frontend/pages/documents/DocumentsPage.tsx`
  - `src/frontend/pages/documents/DocumentsPage.css`
- Added visual summary/introduction layers above each registry:
  - top summary cards with current totals
  - explicit registry headings/kickers
  - contextual meta badges
- Strengthened page subtitles in the relevant `PageHeader` usage so the purpose of each registry is clearer at first glance
- Goal of this pass:
  - reduce the jump from the polished dashboard into flatter table pages
  - make list pages feel like operational workspaces rather than raw data tables

#### Important Limitation
- This pass focuses on clients/cases/documents only; other authenticated modules may still need the same treatment
- Validation was build-only; no screenshot/browser QA was rerun

### 2026-03-09 - CRM Workspace Reframe For MacBook-First Density

#### Verification Status
- `npm run lint` -> PASS
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Reframed the shared product shell around a denser CRM-style desktop workflow in:
  - `src/frontend/index.css`
  - `src/frontend/App.css`
  - `src/frontend/components/PageHeader.css`
  - `src/frontend/components/navigation/Navigation.css`
- Updated typography and density direction:
  - switched the primary UI stack to a sans-serif `Manrope`-led system
  - removed the serif-forward page-title treatment for core workspaces
  - reduced sidebar width, top-bar height, control padding, radii, and shared spacing scale
- Reworked the main operational pages so first-screen content is closer to the top and more registry-driven:
  - `src/frontend/pages/dashboard/DashboardPage.css`
  - `src/frontend/pages/clients/ClientsPage.tsx`
  - `src/frontend/pages/clients/ClientsPage.css`
  - `src/frontend/pages/cases/CasesPage.tsx`
  - `src/frontend/pages/cases/CasesPage.css`
  - `src/frontend/pages/documents/DocumentsPage.tsx`
  - `src/frontend/pages/documents/DocumentsPage.css`
- Follow-up correction in the same session:
  - removed the newly added KPI summary cards above clients/cases/documents registries after user review
  - tightened registry filter bars, table spacing, action buttons, and shell styling again toward a drier ERP-style layout
  - replaced the externally loaded `Manrope` direction with a system sans stack to avoid decorative styling drift
- changed the core palette from warm beige/gold to a colder CRM-style scheme with dark navy navigation, white/blue-gray work surfaces, and restrained blue accents
  - hard-fixed the entire frontend font direction to `Golos Text` and removed the idea of a second display font
  - tightened typography/control standards so titles, helper labels, date text, and form controls must use shared tokens instead of page-local values
- New page behavior and layout direction:
  - title -> filters -> table flow on the key registry pages
  - tighter filter toolbars grouped into the same working surface as the table
  - denser table rows and action chips closer to old Figma registry patterns
  - dashboard widgets compressed into a more operational command-center layout instead of large presentation cards
- Design intent after this pass:
  - less landing-page whitespace
  - more visible data on a single laptop viewport
  - stronger alignment with legal CRM / client-database / document-registry products

#### Important Limitations
- No manual browser QA was run in this session on the actual MacBook viewport that motivated the redesign
- The imported Google font introduces an external font dependency; if this is not acceptable for production, the next pass should self-host the chosen typeface
- Several lower-priority pages still use older local CSS and may need a follow-up density pass to fully match the new shell
- This pass focuses on shell and registry pages, not yet on every detail/create form workflow
- AvadaCRM official positioning was used as a current product-style reference for ERP/CRM interface direction:
  - [AvadaCRM](https://avadacrm.com/)
  - [CRM HELPER portfolio](https://avadacrm.com/ru/portfolio/crm-helper/) describes the target direction as clear color accents and minimized graphics
### 2026-03-08 - Pricelists Module Rebuild

#### Verification Status
- `npm run build:frontend` -> PASS
- `npm run build` -> PASS
- `npm test -- --runInBand src/pricelists/services/pricelist.service.spec.ts` -> PASS (2/2)

#### Frontend Changes
- Replaced the old analytics-only `Прайс-лист` screen with a real route-backed module:
  - `src/frontend/pages/pricelists/PricelistsPage.tsx`
  - `src/frontend/pages/pricelists/PricelistEditorPage.tsx`
  - `src/frontend/pages/pricelists/PricelistDetailsPage.tsx`
  - `src/frontend/pages/pricelists/PricelistsPage.css`
- Added a dedicated pricelist frontend API client and shared types:
  - `src/frontend/services/pricelist.service.ts`
  - `src/frontend/types/pricelist.types.ts`
- Added new routes and navigation support for:
  - `/pricelists`
  - `/pricelists/add`
  - `/pricelists/:id`
  - `/pricelists/:id/edit`
- Added active/archive tabbing, search, duplicate, archive/restore, and delete actions in the registry
- Added a single-screen create/edit workspace for:
  - global pricelist settings
  - grouped categories
  - nested subcategories
  - service rows
  - inline preview before save
- Added drag-and-drop tree sorting in the editor:
  - category cards are draggable
  - drop zones support reorder before/after a sibling
  - drop zones support moving a category inside another category
  - sibling order is persisted through category `displayOrder`
- Reworked pricelist view/editor presentation to be denser and closer to ERP/CRM registries:
  - reduced vertical padding in category blocks and service rows
  - compacted summary cards and section shells
  - tightened nested tree spacing and drop zones
  - shifted grouped price rendering closer to list/table density instead of large cards
- Added a read-only grouped details page with summary cards and direct edit/archive actions
- Editor/category UX now works as a tree:
  - after creating a category the user can add either a subcategory or a service
  - nested paths are persisted through item `category` + `metadata.categoryPath`
  - details/preview screens rebuild the nested structure from stored paths

#### Backend / API Changes
- Expanded pricelist DTO/controller/service support in:
  - `src/pricelists/dto/pricelist.dto.ts`
  - `src/pricelists/services/pricelist.service.ts`
  - `src/pricelists/controllers/pricelist.controller.ts`
- Added persisted pricelist category tree support:
  - `src/database/entities/PricelistCategory.entity.ts`
  - `src/database/migrations/1710000000000-AddPricelistCategories.ts`
  - `POST /pricelists/:id/categories`
  - `PUT /pricelists/categories/:categoryId`
  - `DELETE /pricelists/categories/:categoryId`
- Added automated backend tests for tree-critical behavior:
  - `src/pricelists/services/pricelist.service.spec.ts`
  - recursive category delete
  - pricelist duplication with nested category parent remapping
- Pricelist/item create and update flows now explicitly support richer fields needed by the frontend editor:
  - `metadata`
  - item `currency`
  - item `displayOrder`
  - item `isActive`
  - extra item update fields
- Pricelist duplication now preserves:
  - commercial settings
  - persisted category tree
  - item metadata
- Frontend editor now syncs real category nodes to the backend instead of relying only on item metadata reconstruction

#### Important Limitations
- Current editor now supports persisted nested category trees with drag-and-drop sorting for categories
- Item rows still store category path metadata for compatibility with existing item-based pricing lookups
- No automated frontend interaction tests were added yet for drag-and-drop behavior
- No manual browser QA was run yet on the compacted pricelist registry density
- Archive tab reflects `status = archived`; hard-deleted pricelists remain hidden from both active and archive lists
- No manual browser QA was run for the new pricelist flows on desktop/mobile in this session

### 2026-03-08 - Global Frontend Visual Density Reduction + Premium Shell Pass

#### Verification Status
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Shifted the app shell toward a lighter, more content-first presentation in:
  - `src/frontend/App.tsx`
  - `src/frontend/App.css`
  - `src/frontend/index.css`
  - `src/frontend/components/navigation/Navigation.css`
- Reduced global visual weight by:
  - narrowing desktop sidebar and collapsed rail width
  - lowering top-bar height and horizontal padding
  - centering workspace content inside a shared max-width container
  - introducing calmer shared surface styling and softer global background treatment
- Reworked shared page headers in:
  - `src/frontend/components/PageHeader.css`
- Shared page headers are now more editorial and less banner-like:
  - removed the boxed hero treatment
  - tightened subtitle hierarchy
  - aligned actions as utilities instead of focal decorative blocks
- Tightened shared workspace cards, panels, and list surfaces in:
  - `src/frontend/pages/workspace/WorkspacePage.css`
- Reworked the two most visible reference screens to match the new direction:
  - `src/frontend/pages/calendar/CalendarPage.tsx`
  - `src/frontend/pages/calendar/CalendarPage.css`
  - `src/frontend/pages/dashboard/DashboardPage.tsx`
  - `src/frontend/pages/dashboard/DashboardPage.css`
- Calendar-specific changes:
  - converted the oversized intro area into a compact control toolbar
  - moved emphasis from decorative heading chrome to the actual calendar workspace
  - replaced the previous blue-heavy accents with the shared gold/ink legal palette
- Dashboard-specific changes:
  - replaced the custom heavy page header with the shared `PageHeader`
  - aligned stat cards and widgets with the calmer premium surface system

#### Remaining Risks
- No manual browser QA was run in this session, so visual balance should still be checked on legacy pages beyond dashboard/calendar
- Several older route-level CSS files still use pre-baseline colors and spacing, so a second normalization pass is still needed for full visual consistency across the whole product

### 2026-03-08 - Top Bar CTA Removal For Linear Client/Case Flows

#### Verification Status
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Removed the global top-navigation quick actions:
  - `Додати клієнта`
  - `Додати справу`
- Updated shell files:
  - `src/frontend/components/navigation/Navigation.tsx`
  - `src/frontend/components/navigation/Navigation.css`
- The current product direction is to prefer contextual next steps from the active entity/workspace instead of global header-level create shortcuts

#### Remaining Risks
- The guided follow-up flows themselves are not implemented in this change yet:
  - after client creation, suggest related case creation
  - after case creation, suggest files, template-based documents, calendar entries, or notes

### 2026-03-08 - Client/Case List Search Repair + Date Range Filters

#### Verification Status
- `npm test -- --runInBand src/clients/services/client.service.spec.ts src/cases/services/case.service.spec.ts` -> PARTIAL (case spec PASS, client spec FAIL in existing `ClientService.getStatistics` mock path)
- `npm run build:all` -> PASS
- `npx eslint src/frontend/pages/clients/ClientsPage.tsx src/frontend/pages/cases/CasesPage.tsx src/clients/services/client.service.ts src/cases/services/case.service.ts` -> PASS WITH WARNINGS (frontend files ignored by current eslint patterns)
- `npx eslint --no-ignore src/frontend/pages/clients/ClientsPage.tsx src/frontend/pages/cases/CasesPage.tsx src/clients/services/client.service.ts src/cases/services/case.service.ts` -> FAIL (repo-wide prettier-style violations reported for frontend files; current source still builds)

#### Frontend Changes
- Restored active text filtering behavior on:
  - `src/frontend/pages/clients/ClientsPage.tsx`
  - `src/frontend/pages/cases/CasesPage.tsx`
- Added shared `DateRangePicker` controls to list filters:
  - clients: `createdAtFrom` / `createdAtTo`
  - cases: `startDateFrom` / `startDateTo`
- Added explicit `Скинути фільтри` reset actions on both pages while preserving route-derived defaults like `status` and `clientId`
- Extended the client type filter on `Мої клієнти` with the missing `ФОП` option
- Added list-page filter layout support in:
  - `src/frontend/pages/clients/ClientsPage.css`
  - `src/frontend/pages/cases/CasesPage.css`

#### Backend Changes
- Expanded client search coverage in `src/clients/services/client.service.ts` to match more real-world lookup inputs:
  - `firstName`
  - `lastName`
  - `patronymic`
  - concatenated full name
  - `companyName`
  - `email`
  - `phone`
  - `edrpou`
  - `inn`
  - generated client number in `metadata.client_number`
- Expanded case search coverage in `src/cases/services/case.service.ts` to include:
  - internal case number
  - registry case number
  - title / description
  - court and judge
  - plaintiff / defendant / third parties
  - linked client company name
  - linked client full name

#### Remaining Risks
- No manual browser QA was run for the new list filters on desktop/mobile in this session
- The failing `src/clients/services/client.service.spec.ts` assertions are in the existing statistics test path and were not addressed as part of this UI/search task

### 2026-03-08 - Calendar Header Cleanup + Add Event Entry Point

#### Verification Status
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Removed the duplicate top-level calendar hero/header block from `src/frontend/pages/calendar/CalendarPage.tsx` so the page now keeps a single semantic heading inside the main calendar workspace
- Moved the `Оновити` action into the right-side calendar controls area above the global search field
- Added a new primary action `Додати подію` next to refresh in the calendar controls
- Updated calendar layout styling in:
  - `src/frontend/pages/calendar/CalendarPage.css`
- Added a minimal route-backed event creation screen:
  - `src/frontend/pages/events/AddEventPage.tsx`
  - `src/frontend/pages/events/AddEventPage.css`
- Added frontend create-event contract support in:
  - `src/frontend/services/event.service.ts`
  - `src/frontend/types/event.types.ts`
- Wired new route:
  - `/events/add`
  - `src/frontend/App.tsx`

#### Remaining Risks
- No manual browser QA was run for the new calendar control placement or the add-event form
- The new add-event page is intentionally minimal and does not yet include rich case lookup, edit mode, or event list management

### 2026-03-08 - Calendar Workspace Rebuild

#### Verification Status
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Replaced the old timeline-only calendar page with a React implementation that mirrors the supplied calendar example in:
  - `src/frontend/pages/calendar/CalendarPage.tsx`
  - `src/frontend/pages/calendar/CalendarPage.css`
- Added the same primary views and controls as in the sample:
  - `День`
  - `Тиждень`
  - `Місяць`
  - `Рік`
- Added sample-aligned behavior:
  - global search
  - day-only search
  - day/month/year selectors in the day tab
  - week and month navigation with `Сьогодні`
  - week/month event list filters by date range and search
  - week/month pagination with selectable page size
  - event detail modal with the same field structure as the sample
- Added a unified frontend event service and event types for `/events/calendar` integration:
  - `src/frontend/services/event.service.ts`
  - `src/frontend/types/event.types.ts`
- Calendar page now renders directly from backend `events` data instead of the previous mixed-source workspace composition so the UX stays aligned to the example code

#### Important Limitation
- This session did not add create/edit event flows from the calendar UI; the modal currently preserves the sample's `Редагувати` action as a disabled placeholder
- Some sample detail fields (`Клієнт`, `Угода`, `Додаткова інформація`) are synthesized from the available backend event/case fields because the current API does not expose the exact sample payload
- This session validated the production frontend build only; no manual browser QA was run for the new calendar interactions across desktop/mobile breakpoints

### 2026-03-08 - Client/Case Archiving + Firebase Studio Navigation Alignment

#### Verification Status
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS

#### Backend Changes
- Extended client status handling to support a real `archived` state end-to-end instead of forcing archive behavior through delete/block workarounds:
  - `src/database/entities/Client.entity.ts`
  - `src/clients/dto/client.dto.ts`
  - `src/clients/services/client.service.ts`
- No DB migration was required for this status expansion because the `clients.status` column is stored as `varchar`, not a constrained enum

#### Frontend Changes
- Added `Архівувати` row actions to both list pages:
  - `src/frontend/pages/clients/ClientsPage.tsx`
  - `src/frontend/pages/cases/CasesPage.tsx`
- Clients page now supports archived filtering and archived status badges in the same way cases already supported archived filtering
- Client details status controls now include `archived` and show archived styling:
  - `src/frontend/pages/clients/ClientDetailsPage.tsx`
  - `src/frontend/pages/clients/ClientDetailsPage.css`
  - `src/frontend/utils/clientFormData.ts`
  - `src/frontend/types/client.types.ts`
- Reordered the primary navigation to match the Firebase Studio prototype sequence supplied by the user:
  - `Головна`
  - `Мої клієнти`
  - `Мої справи`
  - `Календар`
  - `Прайс-лист`
  - `Файли`
  - `Розрахунки`
  - `Конструктор шаблонів`
  - `Нотатки`
  - `Архів`
  - `Чат`
  - `Пошта`
- Added new route-backed pages for:
  - `Нотатки` -> `src/frontend/pages/notes/NotesPage.tsx`
  - `Архів` -> `src/frontend/pages/archive/ArchivePage.tsx`
- Renamed/realigned related page labels and breadcrumbs to match the new navigation wording:
  - `Документи` -> `Файли`
  - `Друковані форми` -> `Конструктор шаблонів`
  - `src/frontend/components/navigation/Navigation.tsx`
  - `src/frontend/components/navigation/Breadcrumbs.tsx`
  - `src/frontend/pages/documents/DocumentsPage.tsx`
  - `src/frontend/pages/print-forms/PrintFormsPage.tsx`
  - `src/frontend/App.tsx`

#### Remaining Risk
- This session validated backend and frontend builds only; no manual browser QA was run for the new archive flows, the `/archive` aggregate view, or the revised sidebar/mobile navigation order
- `Нотатки` was implemented as a route-backed summary of existing client/case note fields, not a new dedicated rich-text notes subsystem

### 2026-03-08 - Cases Registry Column + Client View/Edit Split

#### Verification Status
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Updated the `Мої справи` table so the former `Справа` column now shows `Номер справи в реєстрі`
- Case rows now display `registryCaseNumber` in that column with an explicit `Не вказано` fallback when the registry number is absent:
  - `src/frontend/pages/cases/CasesPage.tsx`
- Reworked the client details route so `/clients/:id` opens in a read-only information view by default instead of dropping the user directly into edit fields:
  - `src/frontend/pages/clients/ClientDetailsPage.tsx`
  - `src/frontend/pages/clients/ClientDetailsPage.css`
- Added a dedicated `Редагувати` action that switches the page into form-edit mode, plus cancel/save controls that return the page to view mode after completion
- Added structured read-only client information cards for:
  - base client info
  - type-specific identity/company data
  - contacts
  - addresses
  - banking data

#### Remaining Risk
- This session validated the production frontend build only; the updated client view/edit flow and the new cases-table column should still be checked manually in the browser against real client and case records

### 2026-03-08 - Workspace Cleanup of Unused Directory Aliases

#### Verification Status
- `npm run build:frontend` -> PASS

#### Workspace Cleanup
- Confirmed the active frontend source tree is `src/frontend`
- Confirmed Vite entrypoint still loads `/src/frontend/index.tsx` from root `index.html`
- Confirmed frontend production build still outputs to `dist/frontend`
- Removed the legacy root-level `frontend` symlink alias to `src/frontend`
- Removed the unused empty root-level `storage/` directory

#### Remaining Risk
- Historical documentation sections below may still mention `frontend/...` as a legacy alias in older change logs
- Runtime/generated directories such as `dist/frontend`, `uploads/`, and `logs/` remain intentionally present
### 2026-03-08 - Mobile Responsiveness Hardening For Core List Pages

#### Verification Status
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Hardened the global frontend shell against horizontal overflow in:
  - `src/frontend/App.css`
  - `frontend/App.css`
  - `src/frontend/index.css`
  - `frontend/index.css`
- Added responsive stacked mobile layouts for core table-driven pages so they no longer require rightward scrolling on narrow screens:
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
- Mobile behavior for `cases`, `clients`, and `documents` now switches from wide desktop tables to stacked record cards with per-field labels using `data-label`
- Eliminated the main source of rightward scrolling on phones by removing mobile `min-width` table enforcement on the affected pages

#### Remaining Risk
- This session validated the production frontend build only; manual device QA is still needed for secondary pages that may contain older wide layouts outside the updated core list screens

### 2026-03-07 - Cases List UI Aligned With Clients Page

#### Verification Status
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Reworked the cases listing page to follow the same interaction pattern as the clients list:
  - `src/frontend/pages/cases/CasesPage.tsx`
  - `src/frontend/pages/cases/CasesPage.css`
  - `frontend/pages/cases/CasesPage.tsx`
  - `frontend/pages/cases/CasesPage.css`
- Replaced the old stacked case-card layout with a compact table layout consistent with `Мої клієнти`
- Moved case status updates into an inline per-row selector instead of a separate action button block
- Kept case actions compact and row-scoped:
  - timeline
  - open/edit
  - documents
  - delete
- Empty state now distinguishes between a general no-cases screen and a `clientId`-filtered no-cases result

#### Remaining Risk
- The page structure is now aligned to the clients list pattern, but this session only validated the frontend build; no browser-side manual QA was performed against live case data

### 2026-03-07 - Project Logo Replacement

#### Verification Status
- `npm run build:frontend` -> PASS

#### Frontend Branding Changes
- Replaced placeholder project branding with the provided SVG asset:
  - `src/frontend/assets/project-logo.svg`
- Reduced the shared logo footprint so the icon sits inline with the product name on one row, closer to the previous compact header layout:
  - `src/frontend/common/Logo.tsx`
  - `src/frontend/common/Logo.css`
- Updated sidebar branding to use the shared SVG logo instead of the `⚖️` emoji mark:
  - `src/frontend/components/navigation/Navigation.tsx`
  - `src/frontend/components/navigation/Navigation.css`
- Reworked the sidebar collapse control into a more prominent stylized vertical rail integrated into the right edge of the menu, with top-mounted double-chevron expand/collapse affordance:
  - `src/frontend/components/navigation/Navigation.tsx`
  - `src/frontend/components/navigation/Navigation.css`

#### Remaining Risk
- The supplied SVG is relatively large for a persistent UI logo asset, so a later optimization pass may be useful if frontend payload size becomes a concern.

### 2026-03-07 - Automatic Case Numbering + Registry Case Number Field

#### Verification Status
- `npm run lint` -> PASS
- `npm test -- --runInBand src/cases/services/case.service.spec.ts src/clients/services/court-registry.service.spec.ts` -> PASS (11/11)
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS

#### Backend Changes
- Added automatic internal case-number generation in:
  - `src/cases/services/case.service.ts`
  - `src/cases/controllers/cases.controller.ts`
- New internal numbering rule:
  - `clientNumber/caseSequence`
  - example: `001/001`
  - per-client sequence starts at `001`
- Case creation now ignores any manually submitted internal `caseNumber` and generates the number from the selected client's `metadata.client_number`
- Added preview endpoint for the next internal case number:
  - `GET /cases/next-number?clientId=...`
- Added nullable dedicated registry-number column in:
  - `src/database/entities/Case.entity.ts`
  - `src/database/migrations/1709960000000-AddRegistryCaseNumber.ts`
- Added regression tests for automatic numbering and registry-number persistence in:
  - `src/cases/services/case.service.spec.ts`

#### Frontend Changes
- Updated case form in:
  - `src/frontend/components/cases/CaseFormSections.tsx`
  - `src/frontend/pages/cases/AddCasePage.tsx`
  - `src/frontend/pages/cases/CaseDetailsPage.tsx`
  - `src/frontend/schemas/case.schema.ts`
  - `src/frontend/services/case.service.ts`
  - `src/frontend/types/case.types.ts`
- `Номер справи` is now read-only in create/edit flows and is shown as an automatically generated internal number
- Added new manual field:
  - `Номер справи в реєстрі`
- Court-registry prefill now maps CSV `case_number` into `registryCaseNumber` instead of overwriting the internal case number
- Add-case page now requests the next generated number when a client is selected and shows it before submission

#### Remaining Risks
- Automatic case numbering currently derives the next sequence by scanning existing client cases; there is still no database-level uniqueness constraint or locking for concurrent creates on the same client
- Existing legacy cases with old court-style `caseNumber` values are ignored for sequence calculation, so numbering starts from the highest matching internal `clientNumber/NNN` record only

### 2026-03-07 - Global Frontend UX Refresh

#### Verification Status
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Reworked the application shell in:
  - `frontend/App.tsx`
  - `frontend/App.css`
  - `frontend/components/navigation/Navigation.tsx`
  - `frontend/components/navigation/Navigation.css`
- Sidebar collapse state is now owned by the main layout and persisted in `localStorage`, so the content area and top bar resize immediately instead of leaving an empty gutter
- Replaced the older dark admin styling with a tokenized visual system in:
  - `frontend/index.css`
  - `frontend/components/PageHeader.css`
- Updated typography, buttons, inputs, backgrounds, radii, shadows, and mobile bottom navigation to a more modern product style with responsive behavior for desktop/tablet/mobile
- Refined typography direction after review:
  - readable humanist sans for interface text
  - restrained editorial serif only for large section/page titles
  - reduced glossy gradients and lowered visual noise for denser legal workflows
- Finalized visual direction as `calm premium legal`:
  - warm light background instead of cold SaaS gray-blue
  - dark navy text with restrained champagne/gold accents
  - premium-card surfaces and quieter shadows across shell, forms, and overlays
- Added reusable UX primitives:
  - `frontend/components/RegistrySearchOverlay.tsx`
  - `frontend/components/FormActionBar.tsx`
- Moved court-registry lookup out of the inline form flow into a full-screen overlay workspace on:
  - `frontend/pages/clients/AddClientPage.tsx`
  - `frontend/pages/cases/AddCasePage.tsx`
- Added sticky floating action bars so save / save-and-continue actions remain visible while scrolling on:
  - `frontend/pages/clients/AddClientPage.tsx`
  - `frontend/pages/cases/AddCasePage.tsx`
- Added reusable visual calendar date picker in:
  - `frontend/components/DatePicker.tsx`
- Added shared date-range picker for registry filters in:
  - `frontend/components/DateRangePicker.tsx`
- Replaced native browser date inputs with the shared calendar UI in:
  - registry search overlay
  - add-client form
  - add-case form
  - profile form
- Registry filter UX now uses a single range-picker (`від/до`) instead of two unrelated date popovers
- Calendar popovers now:
  - open upward when there is not enough room below
  - close peer calendars when another calendar/range-picker is opened
- Follow-up stabilization for registry calendar:
  - simplified `frontend/components/DateRangePicker.tsx` back to an inline popover anchored to the filter field
  - removed fragile peer/portal-style behavior from the range-picker after regressions caused misplaced or invisible calendar content in the registry overlay
  - kept compact styling but restored an opaque local surface and predictable open/close flow
- Registry workspace positioning follow-up:
  - moved the registry overlay workspace to top-aligned viewport positioning instead of centered modal placement
  - made the overlay itself vertically scrollable so the calendar and lower search results remain reachable on shorter laptop screens
  - restored simple local auto-placement for the registry range-picker so it can open upward when the viewport is tight below the trigger
- Court-registry period filter now opens with a preselected legal-history range:
  - `dateFrom = 2015-05-28`
  - `dateTo = current day`
- Updated supporting page styles for the refreshed form layout in:
  - `frontend/pages/clients/AddClientPage.css`
  - `frontend/pages/cases/AddCasePage.css`

#### Remaining Risk
- This pass validates production frontend build only; cross-device manual QA and interaction review for all existing pages is still required because several older pages retain their own local CSS not fully migrated to the new design tokens

### 2026-03-08 - Compact Shell Pass For Sidebar And Controls

#### Verification Status
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Reworked sidebar chrome in:
  - `src/frontend/components/navigation/Navigation.tsx`
  - `src/frontend/components/navigation/Navigation.css`
- Replaced the old decorative gold collapse capsule + vertical rail with a smaller desktop-style header control using panel open/close icons
- Reduced sidebar visual mass:
  - expanded width `17.5rem -> 15.25rem`
  - collapsed width `5.75rem -> 4.75rem`
  - denser header, tighter nav row height, smaller icon rhythm, softer active-state treatment
- Reduced top shell footprint:
  - top bar height `4.75rem -> 4.15rem`
  - tighter workspace chip, breadcrumbs, quick actions, plan badge, notification button, and user chip
- Tightened global control density in:
  - `src/frontend/index.css`
  - `src/frontend/App.css`
  - `src/frontend/App.tsx`
- Inputs and buttons now use smaller heights, tighter padding, less rounded radii, and lighter shadows to reduce the “inflated / puffy” appearance
- Page content padding was reduced so more information fits on screen and attention stays on data instead of shell chrome

#### Remaining Risk
- This pass validates the production frontend build only; key desktop pages still need manual visual QA because some route-level cards and tables may now look relatively more spacious than the tightened shell around them

### 2026-03-08 - Frontend Design System Baseline

#### Verification Status
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Added canonical design-system document:
  - `docs/FRONTEND_DESIGN_SYSTEM.md`
- Established the official visual direction as:
  - `Calm Premium Legal Compact`
- Documented mandatory frontend rules for:
  - typography usage
  - color palette
  - spacing density
  - control sizes
  - radius and shadow usage
  - migration handling for legacy page CSS
- Expanded shared design tokens in:
  - `src/frontend/index.css`
- Tokens now explicitly define:
  - semantic surface/text colors
  - type scale
  - spacing scale
  - control heights
  - radius scale
  - shared shadow tiers
- Aligned shared shell components to those tokens in:
  - `src/frontend/components/navigation/Navigation.css`
  - `src/frontend/components/PageHeader.css`
  - `src/frontend/components/FormActionBar.css`
  - `src/frontend/components/RegistrySearchOverlay.css`
- Audit result:
  - shared shell now has a clearer design source of truth
  - several legacy page-level CSS files still contain old blue/purple gradients and hardcoded sizes/colors, and should now be treated as migration debt rather than valid style references

#### Remaining Risk
- This pass formalizes the design system and aligns the shared layer, but does not yet fully migrate every older page stylesheet to the new tokens

### 2026-03-09 - Collapsed Sidebar Geometry Fix

#### Verification Status
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Fixed collapsed sidebar geometry in:
  - `src/frontend/components/navigation/Navigation.css`
- Resolved overlap between the collapse button and the logo in collapsed mode by changing the header layout to a vertical stack
- Made collapsed navigation icon spacing visually symmetric by:
  - equalizing outer sidebar horizontal insets
  - aligning the right-side divider inset with the left content edge
  - removing extra collapsed-state horizontal padding from nav rows and centering icons explicitly

#### Remaining Risk
- This pass fixes the collapsed-shell geometry, but broader page-level visual density still depends on migrating older route CSS to the shared design tokens

### 2026-03-09 - Collapsed Sidebar Polish + Hard Color Policy

#### Verification Status
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Further refined collapsed desktop sidebar in:
  - `src/frontend/components/navigation/Navigation.css`
- Changes:
  - reduced collapsed header footprint
  - reduced collapsed toggle size
  - reduced collapsed nav row height
  - made collapsed active-state lighter and less visually heavy
  - moved sidebar hover/active/background colors onto explicit semantic tokens in `src/frontend/index.css`
- Updated shared auth/shell color fragments in:
  - `src/frontend/index.css`
  - removed remaining shared purple-gradient auth/shell styling in favor of the canonical navy/blue application palette
- Strengthened the official frontend style policy in:
  - `docs/FRONTEND_DESIGN_SYSTEM.md`
- Added explicit migration inventory for page-level color drift:
  - `docs/FRONTEND_COLOR_AUDIT.md`

#### Hard Style Rule
- Canonical frontend style is `Compact Legal CRM`
- Approved brand/application palette is:
  - navy / slate / white surfaces
  - restrained blue accent family
- Deprecated palette fragments must not be introduced in new work:
  - `#667eea`
  - `#764ba2`
  - `#1a1a2e`
  - `#0f3460`
  - `#4f46e5`
  - `#4338ca`

#### Remaining Risk
- Shared layers now follow the hard color policy, but multiple route-level CSS files still remain in migration debt until they are converted to semantic tokens

### 2026-03-07 - Case Client Selector Pagination Fix

#### Verification Status
- `npm run build:frontend` -> PASS

#### Frontend Fixes
- Fixed empty client selector on case create/edit pages caused by invalid frontend request parameter `limit=500`
- Root cause:
  - backend client filters cap `limit` at `100`
  - `/cases/add` and `/cases/:id` requested `500`, causing request validation failure and an empty dropdown
- Added paginated client aggregation helper in:
  - `src/frontend/services/client.service.ts`
- Updated case create/edit flows to load clients through the paginated helper in:
  - `src/frontend/pages/cases/AddCasePage.tsx`
  - `src/frontend/pages/cases/CaseDetailsPage.tsx`

#### Remaining Risk
- Large tenants still load the full visible client set into a single dropdown; usability may degrade before server-side search/autocomplete is introduced

### 2026-03-07 - Automatic Client Numbering + Released Number Reuse

#### Verification Status
- `npm test -- --runInBand src/clients/services/client.service.spec.ts` -> PASS (33/33)
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS

#### Backend Changes
- Added automatic tenant-scoped client numbering starting from `001`
- New client creation now reuses the smallest released client number before incrementing the historical maximum
- Added release pool entity and migration:
  - `src/database/entities/ClientNumberRelease.entity.ts`
  - `src/database/migrations/1709950000000-AddClientNumberReleases.ts`
- Added backend preview endpoint for the next available client number:
  - `GET /clients/next-number`
- Soft delete now supports optional client-number release for future reuse
- Restore now blocks if a deleted client's released number was already reassigned to another active client

#### Frontend Changes
- `/clients/add` now fetches and displays the next auto-generated client number before submit
- Add-client form now treats the client number as read-only during create flow
- Client delete flow now asks whether to release the client number for reuse
- Client update flow now preserves `metadata.client_number` so editing no longer drops an assigned number

#### Remaining Risk
- Restoring a deleted client after its released number was reassigned requires manual conflict resolution

### 2026-03-07 - Add Client Form Submit Fix

#### Verification Status
- `npm test -- --runInBand src/frontend/schemas/client.schema.spec.ts` -> PASS (2/2)
- `npm run build:frontend` -> PASS

#### Frontend Fixes
- Fixed silent submit failure on `/clients/add` when `Фактична адреса співпадає з адресою реєстрації` is enabled
- Normalized empty `addresses.actual` values in client zod schema so disabled actual-address fields no longer block form submission
- Added explicit validation errors for the actual-address section when the checkbox is disabled and the user must provide a different address
- Revalidated the address section immediately when toggling the same-address checkbox
- Added regression coverage in:
  - `src/frontend/schemas/client.schema.spec.ts`

#### Remaining Risk
- Root Jest still does not cover the whole frontend tree by default; this fix is verified by targeted schema test plus frontend production build
### 2026-03-07 - User-Scoped Isolation + Ukrainian Trust Provider Foundation

#### Verification Status
- `npm run lint` -> PASS
- `npm test -- --runInBand` -> PASS (67/67)
- `npm run build` -> PASS

#### Security / Backend Changes
- Added shared user-scoped access policy helpers in:
  - `src/common/security/access-control.ts`
- Extended service-level isolation from pure `tenant_id` filtering to `tenant + actor scope` in:
  - `src/cases/services/case.service.ts`
  - `src/clients/services/client.service.ts`
  - `src/documents/services/document.service.ts`
- Added record-level visibility model:
  - `accessScope = private | assigned | tenant`
  - default for new cases/clients/documents is `assigned`
- Protected aggregate endpoints from cross-user inference by scoping statistics/deadline queries to the current actor where applicable
- Extended PostgreSQL session context for future RLS hardening:
  - `app.current_tenant_id`
  - `app.current_user_id`
  - `app.current_user_role`
- Added trust-provider / signature foundation entities:
  - `src/database/entities/UserIdentity.entity.ts`
  - `src/database/entities/DocumentSignature.entity.ts`
- Added migration:
  - `src/database/migrations/1709900000000-HardenUserIsolationAndTrustProviders.ts`
- Extended document signing DTO/service to persist:
  - provider (`acsk`, `diia`, `bankid_nbu`, `manual`)
  - signature hash / algorithm
  - certificate issuer / serial
  - signed payload hash
  - verification status metadata

#### Important Limitation
- This release adds the data model and enforcement foundation, but does not yet implement:
  - live КЕП certificate validation
  - CRL/OCSP checks
  - Diia.Sign flow
  - BankID NBU OAuth/auth exchange
  - encrypted storage for PII fields

### 2026-03-07 - Frontend API Base URL Routing Fix

#### Verification Status
- `npm run build:frontend` -> PASS

#### Frontend / Runtime Changes
- Changed frontend API fallback from hardcoded `http://localhost:3000/v1` to relative `VITE_API_URL` with default `/api` in:
  - `src/frontend/services/api.ts`
- Fixed Vite dev proxy so `/api/*` now maps to backend global prefix `/v1/*` in:
  - `vite.config.ts`
- Added local frontend env default for Vite:
  - `.env` -> `VITE_API_URL=/api`

#### User-Visible Impact
- Eliminates global browser-side `Network Error` caused by frontend builds that lacked `VITE_API_URL`
- Restores `/clients/add` next-client-number preview because `GET /api/clients/next-number` now resolves to backend `GET /v1/clients/next-number`

#### Remaining Risk
- Existing already-built frontend bundles must be rebuilt/redeployed to pick up the corrected Vite environment and API base URL

### 2026-03-07 - Court Registry Service DI Fix

#### Verification Status
- `npm test -- --runInBand src/clients/services/court-registry.service.spec.ts` -> PASS (4/4)
- `npm run build` -> PASS

#### Backend Changes
- Fixed NestJS dependency injection in:
  - `src/clients/services/court-registry.service.ts`
- Replaced constructor-level raw `string[]` dependency with optional injection token:
  - `COURT_REGISTRY_DIRECTORIES`
- Default runtime behavior remains:
  - search in `court_stan`
  - fallback to `court_base`

#### User-Visible Impact
- Backend no longer fails startup when `CourtRegistryService` is created without an explicit directory provider
- Restores stability for client-related routes in environments built from current source

### 2026-03-07 - Court Registry CSV Search in Client Onboarding

#### Verification Status
- `npm run lint` -> PASS
- `npm test -- --runTestsByPath src/clients/services/court-registry.service.spec.ts --runInBand` -> PASS (4/4)
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS

#### Frontend / Backend Changes
- Replaced the add-client action label `Пошук у реєстрі боржників` with `Пошук у реєстрах`
- Added authenticated court-registry search endpoint:
  - `GET /clients/court-registry/search?query=...`
- Added TSV/CSV parser service for court registry exports:
  - `src/clients/services/court-registry.service.ts`
- Registry search reads project-root directories in order:
  - `court_stan`
  - fallback `court_base`
- Matching behavior:
  - scans all `.csv` files in the registry directory
  - parses quoted tab-separated rows
  - splits `participants` by comma
  - matches case-insensitively by normalized contiguous substring in participant FIO
  - returns structured objects with person, role, case identifiers, court, judge, and stage data
- Added add-client inline registry search panel with result table and record selection for case preparation
- Added add-case prefill flow via session storage so selected registry rows can seed:
  - case number
  - title / description
  - court name
  - judge
  - registration date
  - internal notes

#### Important Limitations
- Parser assumes one TSV record per physical line; multiline quoted fields are not supported
- Participant splitting currently treats comma as the participant separator, matching the supplied export format

### 2026-03-07 - Court Registry Name Matching + Add Case Registry Search Fixes

#### Verification Status
- `npm run lint` -> PASS
- `npm test -- --runInBand src/clients/services/court-registry.service.spec.ts` -> PASS (7/7)
- `npm run build:frontend` -> PASS

#### Backend Changes
- Hardened `src/clients/services/court-registry.service.ts`:
  - supports multiline quoted TSV/CSV records instead of assuming one record per physical line
  - searches only inside the `participants` column by case-insensitive normalized contiguous substring match
  - extracts `role` from `Роль: ПІБ` participant fragments for the matched person
  - supports optional registration-date filters:
    - `dateFrom`
    - `dateTo`
- Expanded service tests in:
  - `src/clients/services/court-registry.service.spec.ts`
  - added regression coverage for multiline quoted descriptions
  - added regression coverage for registration-date filtering
  - locked behavior so non-contiguous/non-literal inflected variants are not treated as matches

#### Frontend Changes
- Updated add-case flow in:
  - `src/frontend/pages/cases/AddCasePage.tsx`
  - `src/frontend/pages/cases/AddCasePage.css`
- Updated add-client flow in:
  - `src/frontend/pages/clients/AddClientPage.tsx`
- Added explicit button `Пошук справи в реєстрах` on the add-case page
- Registry search now supports:
  - free-text participant query
  - `від` / `до` registration-date filters
- Add-case registry search defaults to the selected client's display name and allows manual query override
- Selected registry result can prefill the case form directly:
  - matched FIO
  - role
  - case title/description
  - case number
  - court and judge metadata
  - parties block derived from `participants`:
    - `Позивач / Заявник`
    - `Відповідач / Боржник`
    - `Треті особи`
- Add-client registry search can now prefill:
  - client FIO fields
  - registration date when available
  - internal client comment with role, case title, case number, and court
- Relaxed client loading for case create/edit screens so the selector is no longer limited to `status=active` only:
  - `src/frontend/pages/cases/AddCasePage.tsx`
  - `src/frontend/pages/cases/CaseDetailsPage.tsx`
- Improved client display-name fallback for physical persons/FOPs so the selector prefers personal name parts before `companyName`

#### User-Visible Impact
- Court-registry search now behaves strictly by literal substring presence inside `participants`, matching the supplied product requirement
- Add-case flow now includes an inline registry lookup action tied to the chosen client
- When a registry row is selected for a case, participant roles are redistributed into the dedicated case-party fields instead of being left only inside notes
- Add-client flow now supports selecting a found registry case and immediately copying the matched FIO plus case context into the form
- Client selector in case create/edit screens now shows the broader tenant-visible client set instead of silently emptying when records are not `active`

#### Remaining Risks
- Participant parsing still uses comma as the separator because that matches the supplied export structure; files using a different participant delimiter will need additional parsing rules
- Client selector still requests only the first 500 tenant-visible clients; very large tenants may require server-side autocomplete instead of a static dropdown

### 2026-03-07 - Form Chrome Copy Cleanup + Compact Action Bars

#### Verification Status
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Removed decorative helper copy from long-form create flows in:
  - `src/frontend/pages/clients/AddClientPage.tsx`
  - `src/frontend/pages/cases/AddCasePage.tsx`
- Add-client and add-case page headers no longer show marketing-style subtitles that duplicated obvious UI behavior
- Registry overlay subtitles for add-client and add-case were removed so the search workspace opens without redundant explanatory text
- Updated shared sticky action bar in:
  - `src/frontend/components/FormActionBar.tsx`
  - `src/frontend/components/FormActionBar.css`
- Action bars are now visually shorter, keep controls on a single horizontal row, and allow horizontal overflow instead of stacking buttons into extra rows on narrow screens

#### Remaining Risks
- On very narrow mobile widths, the action bar now prefers horizontal scrolling to preserve a single-row layout; verify this matches the desired UX on target devices

### 2026-03-07 - Context Cache + Full Test Stabilization

#### Project Cache
- Added compact context cache file: `docs/PROJECT_CONTEXT_CACHE.md`
- Purpose: reduce token usage in future sessions by keeping current technical state and validation snapshot

#### Verification Status
- `npm run lint` -> PASS
- `npm test -- --runInBand` -> PASS (67/67)
- `npm run test:e2e -- --runInBand` -> PASS (22/22)
- `npm run build` -> PASS

#### Backend / Test Reliability Fixes
- Added `.eslintrc.js` and aligned lint behavior to current project state
- Installed `supertest` and `@types/supertest` for e2e tests
- Fixed runtime issues in:
  - `src/auth/services/audit.service.ts` (decorator context handling)
  - `src/common/logging/logging.service.ts` (logger error signature)
  - `src/cases/services/case.service.ts` (portable search SQL)
  - `src/clients/services/client.service.ts` (statistics count parsing)
  - `src/app.module.ts` (TypeORM entities glob for ts/js runtime)
- Updated unit/e2e specs to match current entities/JWT contracts

#### Frontend Stability Fixes
- Removed Vite-incompatible `require(...)` usage from frontend runtime code
- Fixed clients page crash on `/clients`
- Removed stale modal references from `ClientsPage.tsx` (`showModal`, `selectedClient`, `closeModal`, `handleSave`) after migration to route-based create/edit pages
- Added persisted auth session caching in `localStorage` for:
  - tokens
  - user
  - organization
- Added auth hydration on app startup so page reload does not immediately force `/login`
- Added shared semantic breadcrumbs and removed duplicated local breadcrumb implementation from the add-case page
- Removed unused duplicate sidebar implementation from `src/frontend/components/Sidebar.tsx` and `Sidebar.css`
- Added `<main>` landmark in the main app layout
- Added shared `PageHeader` component and removed duplicated page-header markup/styles from key pages
- Replaced clickable navigation containers with `NavLink`-based semantics in shared navigation
- Moved simple inline UI styles to CSS/CSS custom properties (`UpgradePrompt`, `Logo`, onboarding/register/documents/dashboard widgets)
- Fixed stale onboarding route from `/cases/new` to `/cases/add`
- Added route-level lazy loading in `src/frontend/App.tsx` and vendor `manualChunks` in `vite.config.ts`; main entry chunk reduced to ~93 kB, no chunk-size warning remains
- Implemented real route-based `CaseDetailsPage` for `/cases/:id` and removed edit modal from `CasesPage.tsx`
- Extracted shared case form sections for add/edit reuse
- Implemented real route-based `ClientDetailsPage` for `/clients/:id`
- Extracted shared client form sections and API-to-form mapping for add/edit reuse
- Client card now supports route-based editing, status changes, and related cases preview/actions
- Implemented route-based documents flow for global, case, and client contexts; removed dependency on `?caseId=` query routing
- Fixed document upload transport so multipart metadata (`caseId`, `clientId`, `type`, `accessLevel`) is actually sent with the file
- Implemented real `ActivityPage` for `/activity` on top of live dashboard activity/task data
- Frontend verification:
  - `npm run build:frontend` -> PASS

### 2026-02-25 - Production Readiness Fixes

#### TypeScript Fixes (35+ errors resolved)
- Fixed null/undefined type issues in NotificationService
- Fixed spread type issues in logger.config.ts
- Fixed decorator type issues in cache.decorator.ts
- Added missing fields to DTOs (ipAddress, userAgent, status)

#### Frontend Improvements
- Added Ukrainian localization (i18n)
- Implemented subscription-aware rendering
- Added tenant routing hooks
- Created UpgradePrompt components

#### CI/CD Hardening
- Security-hardened Dockerfiles (non-root, read-only)
- Production-ready Kubernetes manifests
- GitHub Actions CI/CD pipeline
- Nginx rate limiting and security headers

#### Database Schema
- Identified RLS not enabled (critical)
- Identified missing deleted_at columns
- Identified missing indexes for soft delete

### 2026-03-09 - Legacy Frontend Token Sweep

#### Verification Status
- `npm run lint` -> PASS
- `npm run build:frontend` -> PASS

#### Frontend Design System Completion
- Extended the shared `Golos Text` + token system across the remaining legacy frontend pages so typography and control heights are no longer defined page-by-page
- Standardized titles, section headers, captions, date labels, and modal headings onto shared tokens from `src/frontend/index.css`
- Standardized form controls and action buttons on the remaining legacy pages onto `--control-height-md`, `--control-height-lg`, and `--control-height-xl`
- Removed the last warm gold/purple accent remnants from:
  - auth screens
  - onboarding
  - billing
  - payment result
  - upgrade prompts
  - client/case details
  - activity
  - pricelists
  - date pickers
  - not-found/system layout states
- Updated the following files in this sweep:
  - `src/frontend/index.css`
  - `src/frontend/App.css`
  - `src/frontend/components/DatePicker.css`
  - `src/frontend/components/DateRangePicker.css`
  - `src/frontend/components/UpgradePrompt.css`
  - `src/frontend/pages/auth/LoginPage.css`
  - `src/frontend/pages/auth/RegisterPage.css`
  - `src/frontend/pages/activity/ActivityPage.css`
  - `src/frontend/pages/clients/ClientDetailsPage.css`
  - `src/frontend/pages/cases/CaseDetailsPage.css`
  - `src/frontend/pages/billing/BillingPage.css`
  - `src/frontend/pages/billing/PaymentResult.css`
  - `src/frontend/pages/pricelists/PricelistsPage.css`
  - `src/frontend/pages/onboarding/OnboardingWizard.css`
  - `src/frontend/pages/profile/ProfilePage.css`
  - `src/frontend/pages/calendar/CalendarPage.css`

#### Remaining Risk
- This session still did not include manual browser QA across all routes on a real MacBook viewport; final density and alignment should still be checked in-browser with live data

#### Follow-up Within Same Session
- Re-audited the frontend after user feedback that fonts and old styling still leaked through on real screens
- Found and fixed remaining active style drift in:
  - global `.btn-primary` / `.btn-secondary` tokens in `src/frontend/index.css`
  - auth page real rendered classes in `src/frontend/pages/auth/LoginPage.css`
  - auth page real rendered classes in `src/frontend/pages/auth/RegisterPage.css`
  - client add form utility/button remnants in `src/frontend/pages/clients/AddClientPage.css`
  - client add form markup in `src/frontend/components/clients/ClientFormSections.tsx`
  - registry overlay in `src/frontend/components/RegistrySearchOverlay.css`
  - date pickers in `src/frontend/components/DatePicker.css` and `src/frontend/components/DateRangePicker.css`
  - add-case registry table styling in `src/frontend/pages/cases/AddCasePage.css`
  - navigation/mobile nav accents in `src/frontend/components/navigation/Navigation.css`
  - current-day calendar accents in `src/frontend/pages/calendar/CalendarPage.css`
- Ran local browser-view verification with Playwright screenshots against the Vite dev server for:
  - `/login`
  - `/register`
- Observed result after fixes:
  - auth screens now render with the blue CRM accent instead of the old gold CTA
  - the live rendered classes now match the actual component structure rather than dead `.login-header`-style selectors

#### Authenticated Screen Audit Follow-up
- Added a Playwright-based authenticated desktop audit spec at `tmp/playwright-auth-audit.spec.js`
- Captured mocked authenticated screenshots and computed-style summaries for:
  - `/dashboard`
  - `/clients`
  - `/clients/add`
  - `/cases`
  - `/cases/add`
  - `/calendar`
- The first authenticated audit exposed a real rendered typography leak:
  - `body`, primary buttons, form controls, and filter labels on protected routes were still inheriting/painting as `Times New Roman`
- Fixed the protected-route drift by hardening shared font inheritance and cold CRM surfaces in:
  - `src/frontend/index.css`
  - `src/frontend/pages/workspace/WorkspacePage.css`
  - `src/frontend/pages/dashboard/DashboardPage.css`
  - `src/frontend/pages/clients/ClientsPage.css`
  - `src/frontend/pages/cases/CasesPage.css`
  - `src/frontend/pages/calendar/CalendarPage.css`
  - `src/frontend/components/FormActionBar.css`
- Also removed the remaining warm registry/workspace/calendar panel backgrounds found in the authenticated desktop screenshots
- Re-ran the authenticated Playwright audit after the patch and confirmed:
  - `body` now computes to `"Golos Text", sans-serif`
  - `.btn-primary`, `.form-input`, `.form-select`, and `.filters-date-range__label` now compute to `"Golos Text", sans-serif` on the audited routes

#### Verification Status
- `npm run lint` -> PASS
- `npm run build:frontend` -> PASS
- `npx playwright test tmp/playwright-auth-audit.spec.js --reporter=line --workers=1` -> PASS

#### Remaining Risk
- The authenticated audit used mocked API payloads to stabilize screenshots, so one more browser pass with real tenant data is still advisable for density/content QA

### 2026-03-09 - Calendar Canonical Header Alignment

#### Verification Status
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Migrated `src/frontend/pages/calendar/CalendarPage.tsx` to the shared `PageHeader` pattern so the page no longer repeats calendar context in a second local title block
- Removed the local `Календар подій` hero copy that duplicated the page context already conveyed by breadcrumbs
- Removed the page-level `Breadcrumbs` instance from the calendar page because the top workspace navigation already renders the same breadcrumb trail
- Moved `Додати подію` and `Оновити` into the canonical page header while keeping the active period label inside the calendar toolbar
- Adjusted the supporting layout styles in:
  - `src/frontend/pages/calendar/CalendarPage.css`

#### Next Rational Step
- Continue the `color drift` migration in this order:
  - onboarding
  - billing
  - profile
  - clients
  - cases
  - documents
  - dashboard
  - calendar

#### Remaining Risk
- The prior browser audit used mocked API responses to stabilize screenshots; a live authenticated pass with real tenant data is still needed
- That live pass should focus on content outliers, not just the shared shell and baseline design system surfaces

### 2026-03-12 - Quick Actions Duplication Sweep

#### Verification Status
- `npm run lint:frontend` -> PASS
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Added `Дублювати` to record-level quick action menus on:
  - `src/frontend/pages/clients/ClientsPage.tsx`
  - `src/frontend/pages/cases/CasesPage.tsx`
  - `src/frontend/pages/notes/NotesPage.tsx`
  - `src/frontend/pages/documents/DocumentsPage.tsx`
  - `src/frontend/pages/calculations/CalculationsPage.tsx`
  - `src/frontend/pages/calculations/CalculationDetailsPage.tsx`
- Client duplication now opens the existing create form with copied values and a fresh client number in:
  - `src/frontend/pages/clients/AddClientPage.tsx`
- Case duplication now opens the existing create form with copied values and a regenerated internal case number for the selected client in:
  - `src/frontend/pages/cases/AddCasePage.tsx`
- Calculation duplication now opens `/calculations/add` with the copied lines, client/case linkage, notes, and selected pricelist set in:
  - `src/frontend/pages/calculations/CalculationCreatePage.tsx`
- Note duplication now creates a new note immediately from the quick action menu and opens that copy in the note viewer/editor flow in:
  - `src/frontend/pages/notes/NotesPage.tsx`
- Document duplication now re-fetches the file through a signed URL and re-uploads it with the same metadata/access settings in:
  - `src/frontend/pages/documents/DocumentsPage.tsx`

#### Remaining Risk
- Document duplication depends on fetching the generated signed URL in the browser; if storage/CORS rules differ between environments, that specific flow should be browser-checked against a live backend

### 2026-03-12 - Calculations Quick Actions Simplification

#### Verification Status
- `npm run lint:frontend` -> PASS
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Simplified the row-level quick actions menu on the calculations registry in:
  - `src/frontend/pages/calculations/CalculationsPage.tsx`
- Removed from the registry row menu:
  - `Фільтр по клієнту`
  - `Фільтр по справі`
  - `Надіслати на затвердження`
- Added to the registry row menu:
  - `Редагувати`
  - `Архівувати`
- `Архівувати` currently uses the module's existing soft-delete behavior because the calculations domain still has no explicit archived status in the API/entity model

#### Remaining Risk
- `Редагувати` in the registry currently opens the calculation card route because the calculations module still lacks a dedicated editable calculation form/update flow for persisted line items
- A true archive lifecycle for calculations would require backend status-model expansion if the product needs archive/recovery separate from soft delete

### 2026-03-12 - Calculations Edit Flow Restored

#### Verification Status
- `npm run lint:frontend` -> PASS
- `npm run build:frontend` -> PASS
- `npm run build` -> PASS

#### Frontend Changes
- Added a dedicated calculations edit route in:
  - `src/frontend/App.tsx`
  - `/calculations/:id/edit`
- Restored `Редагувати` inside the read-only calculation card quick actions in:
  - `src/frontend/pages/calculations/CalculationDetailsPage.tsx`
- Updated the calculations registry quick actions so `Редагувати` now opens the real edit route instead of routing back to the read-only card in:
  - `src/frontend/pages/calculations/CalculationsPage.tsx`
- Reused the existing create form as a unified create/edit screen in:
  - `src/frontend/pages/calculations/CalculationCreatePage.tsx`
  - the page now loads an existing calculation in edit mode, preserves operation type, hydrates positions, and saves back to the same record

#### Backend Changes
- Expanded calculation update DTO and service logic to support real editing of:
  - case link
  - calculation date
  - due date
  - name / description / notes
  - selected pricelist id
  - metadata
  - line items with total recalculation
- Replaced the old metadata-only `update()` behavior in:
  - `src/calculations/dto/calculation.dto.ts`
  - `src/calculations/services/calculation.service.ts`
- The update path now rebuilds calculation items and recomputes `subtotal`, `vatAmount`, `discountAmount`, and `totalAmount` when item edits are submitted

#### Remaining Risk
- The calculations module still has no first-class archived status; `Архівувати` remains soft delete rather than a recoverable archived state

### 2026-03-12 - Calculations Hourly Input Switched To Hours

#### Verification Status
- `npm run lint:frontend` -> PASS
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Switched the calculation create/edit form to hour-based user input for `Погодинно` positions in:
  - `src/frontend/pages/calculations/CalculationCreatePage.tsx`
- Updated behavior:
  - new hourly rows now default to `1` hour instead of `60`
  - hourly line totals are calculated as `ціна за одиницю * години`
  - pricelist hourly defaults are converted from stored minutes into displayed hours
  - submitted hourly values are converted back to minutes before sending to the backend for storage compatibility
- Updated the read-only calculation card hourly summary in:
  - `src/frontend/pages/calculations/CalculationDetailsPage.tsx`
  - totals are now shown in hours rather than minutes

#### Remaining Risk
- Pricelist items still store `defaultDuration` in minutes and calculation items still store `duration` in minutes at the persistence layer; this patch normalizes only the calculations UX layer

### 2026-03-12 - Print Forms Calculation Table Overflow Fix

#### Verification Status
- `npm run lint:frontend` -> PASS
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Hardened the generated calculation table markup/styles used in print-form templates in:
  - `src/frontend/pages/print-forms/templateBuilder.utils.ts`
- Added explicit `colgroup` widths for the generated calculation table token preview/placeholder
- Updated both editor and printable styles so calculation-table cells now:
  - keep stable column proportions
  - wrap long text inside the cell
  - use `overflow-wrap: break-word`
  - allow automatic hyphenation
  - center narrow numeric/utility columns while keeping the service name left-aligned

#### Remaining Risk
- Final visual density still depends on the chosen document font and page margins; extremely narrow custom print layouts may still require template-specific tuning

### 2026-03-12 - Mobile Scan Session TTL Stabilization

#### Verification Status
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS
- direct `POST /v1/scan-sessions/:id/finalize` retest on the previously failing session no longer returns `403 expired`; current backend response is `400 Немає жодної сторінки для формування PDF`

#### Backend Changes
- Updated `src/documents/services/scan-session.service.ts`
- Scan sessions now behave as a 30-minute inactivity window instead of a hard 30-minute deadline from creation time
- `expiresAt` is refreshed on mobile session activity:
  - open
  - upload page
  - delete page
  - reorder pages
  - finalize
- Expired sessions with recent activity can now be resumed safely within the same inactivity window, which protects long debugging / mobile capture flows from failing at finalize after successful uploads
- Added optional `SCAN_SESSION_LIFETIME_MINUTES` environment override for non-default session TTL tuning

#### Frontend Changes
- Updated `src/frontend/pages/documents/MobileScanPage.tsx`
- Mobile scan errors now surface backend messages through the shared frontend error extractor instead of showing only generic Axios status text

#### Remaining Risk
- Local preview thumbnails can still fail on a physical phone if local storage URLs resolve to `localhost`; if that becomes blocking, add a public backend base URL for local storage links in mobile/LAN development

### 2026-03-12 - Mobile Scan Preview + Image Compression

#### Verification Status
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS
- direct `HEAD http://127.0.0.1:3000/storage/...` against an uploaded scan image -> `200 OK`

#### Backend / Dev Runtime Changes
- Updated `src/main.ts`
  - in non-production, Nest now serves local storage files at `/storage/*`
- Updated `src/file-storage/providers/local-storage.service.ts`
  - local storage URLs now default to relative `/storage/...` instead of hardcoded `http://localhost:3000/storage/...`
  - `LOCAL_STORAGE_URL` can still override this behavior for custom environments
- Updated `vite.config.ts`
  - Vite now proxies `/storage` to the backend so mobile/LAN testing can load image previews through the frontend origin
- Updated `src/file-storage/services/file-storage.service.ts`
  - large-file validation copy is now Ukrainian

#### Frontend Changes
- Added `src/frontend/utils/imageCompression.ts`
  - mobile scan uploads now auto-compress oversized camera images before upload
  - non-JPEG mobile image sources are normalized into JPEG for scan upload compatibility
- Updated `src/frontend/pages/documents/MobileScanPage.tsx`
  - uploaded pages now get immediate local object-URL previews on the phone
  - the file picker accepts `image/*`
  - the page shows a hint that scan images are auto-compressed toward the 10 MB per-page limit
- Updated `src/frontend/pages/documents/MobileScanPage.css`
  - preview cards now render image thumbnails more reliably

#### Remaining Risk
- The product spec still enforces a 10 MB per-page ceiling server-side; extremely large source photos may still need stronger downscaling than the current client-side compressor if users capture very high-resolution originals

### 2026-03-12 - Mobile Scan Session Keepalive

#### Verification Status
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS

#### Backend Changes
- Updated `src/documents/services/scan-session.service.ts`
- Increased the default scan-session inactivity lifetime from 30 minutes to 8 hours
- The existing `SCAN_SESSION_LIFETIME_MINUTES` environment override still takes precedence when explicitly configured

#### Frontend Changes
- Updated `src/frontend/pages/documents/MobileScanPage.tsx`
- While the mobile scan page is open, it now sends periodic keepalive requests and also refreshes the session when the tab becomes visible again
- This keeps long capture/review sessions alive while users work through stitched or difficult multi-page paper sets

#### Remaining Risk
- iOS/Safari can still throttle timers in background tabs; the longer 8-hour inactivity TTL is retained as a fallback so the session does not collapse during ordinary pauses

### 2026-03-12 - Trusted Clean State For Scan PDFs

#### Verification Status
- `npm test -- --runInBand src/file-storage/services/file-scan.service.spec.ts` -> PASS
- `npm run build` -> PASS
- `npm run build:frontend` -> PASS

#### Backend Changes
- Added `markFileAsClean(...)` in `src/file-storage/services/file-scan.service.ts`
  - allows backend-generated trusted files to be marked `clean` in the malware-scan registry
  - synchronizes `documents.malwareScanStatus` and audit trail
- Updated `src/documents/services/scan-session.service.ts`
  - final PDF created from a mobile scan is now marked `clean` immediately after document creation with scanner marker `internal_scan_pdf`
- Updated `src/documents/services/document.service.ts`
  - existing older `scan_session` PDFs that were already stored with `pending` malware status are auto-healed to `clean` on signed-URL generation before download is attempted

#### Tests
- Extended `src/file-storage/services/file-scan.service.spec.ts`
  - added coverage for trusted internal file promotion to `clean`

#### Remaining Risk
- This trusted-clean shortcut is intentionally limited to backend-generated `scan_session` PDFs; normal user-uploaded files still require the regular malware-scan workflow before download

### 2026-03-13 - Document Viewer Metadata State Regression Fix

#### Verification Status
- `npx eslint src/frontend/pages/documents/DocumentViewerPage.tsx` -> PASS
- `npm run build:frontend` -> PASS

#### Frontend Changes
- Updated `src/frontend/pages/documents/DocumentViewerPage.tsx`
- Restored the metadata sidebar draft state used by the document viewer:
  - `descriptionDraft`
  - `accessLevelDraft`
  - `accessScopeDraft`
  - `metadataSaving`
  - `metadataDirty`
- Restored local access label maps for the viewer sidebar so the properties form can render independently of `DocumentsPage`
- Fixed the runtime crash when opening `/documents/:id` for PDFs and other previewable files, where React hit `ReferenceError: Can't find variable: descriptionDraft` during render

#### Remaining Risk
- This fix restores the missing viewer-local state, but the document viewer still has no dedicated route-level runtime test coverage; similar regressions can reappear if sidebar state is refactored without a page-open smoke test

## Contact

- **Developer:** Edhar Simonian
- **Repository:** Private

---

> Generated: 2026-02-25
> Version: 1.0.0
