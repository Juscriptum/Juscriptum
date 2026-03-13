# Requirements Alignment Audit

> Snapshot date: 2026-03-10
> Scope: project documentation, prompt alignment, current frontend structure, Firebase Studio prototype

## Sources Reviewed

### Primary local sources

- `NEW/ТЕХНИЧЕСКОЕ ЗАДАНИЕ.docx`
- `NEW/ТЕХНИЧЕСКОЕ ЗАДАНИЕ.txt`
- `NEW/PROMT.txt`
- `NEW/PROMT.docx`
- `NEW/максимально подробный Unified Agent SaaS Prompt.docx`

### Project sources

- `docs/PROJECT_CONTEXT_CACHE.md`
- `docs/PRODUCTION_READINESS_REPORT.md`
- `src/frontend/App.tsx`
- `src/frontend/components/navigation/Navigation.tsx`
- `src/frontend/pages/onboarding/OnboardingWizard.tsx`
- `src/frontend/pages/auth/RegisterPage.tsx`
- `src/frontend/pages/clients/AddClientPage.tsx`
- `src/frontend/pages/cases/AddCasePage.tsx`
- `src/frontend/pages/cases/CasesPage.tsx`
- `src/frontend/pages/documents/DocumentsPage.tsx`

### External prototypes

- Firebase Studio hosted prototype: `https://studio--law-organizer-new-634098-60b97.us-central1.hosted.app`
- Figma link provided by user: `https://www.figma.com/design/SQJEr9M0AiRgYvqixltwgd/LAW-Organizer--Copy-?node-id=0-1&t=NrVERy0tl4MZTUU8-1`
- Local exported Figma assets: `figma/`

## Access Notes

- Firebase Studio prototype was accessible and inspected via hosted HTML/chunk output.
- Figma was not directly accessible from this environment because the request returned CloudFront `403 Request blocked`.
- Local Figma export inside `figma/` was accessible and reviewed through JPG screens.
- Because of that, Figma conclusions below are based on local exported screens rather than the live Figma URL.

## 2026-03-10 Addendum

- The specific shell/admin gaps called out below were partially resolved after this audit snapshot:
  - `/users`, `/settings`, and `/audit` are no longer inline placeholder routes in `src/frontend/App.tsx`
  - `profile`, `activity`, `reports`, `users`, and `settings` are now exposed in the live navigation shell
- Registration/onboarding/profile ownership was also narrowed after this audit snapshot:
  - registration now captures only tenant bootstrap identity
  - onboarding now owns startup org/professional setup and persists it through live APIs
  - profile remains the surface for extended personal/professional enrichment
- Secondary module scope is now explicitly labeled:
  - `reports` and `calculations` are treated as launch-scope operational surfaces
  - `print-forms`, `chat`, and `mail` are treated as post-launch preview surfaces
- Remaining product drift is now narrower:
  - deeper workflow fidelity for these surfaces is still below final TZ/Figma intent
  - `/audit` is intentionally plan-gated to Professional+ and backed by the standard audit log store, not the disabled enterprise WORM audit module
  - the remaining product drift is now about actual workflow depth, not hidden scope ambiguity

## Local Figma Screens Reviewed

- `figma/Мої клієнти.jpg`
- `figma/Сторінка клієнта.jpg`
- `figma/Справа основна.jpg`
- `figma/Мій профіль .jpg`
- `figma/Прайс листи актуальні.jpg`
- `figma/Додати справу існуючий клієнт.jpg`
- `figma/Додати клієнта фізична особа.jpg`
- `figma/Документи по справі-список.jpg`
- `figma/Документи по справі-плитка.jpg`

## Canonical Source Of Truth

Use the following precedence to avoid further drift:

1. `ТЕХНИЧЕСКОЕ ЗАДАНИЕ` for business functionality and screen behavior.
2. `максимально подробный Unified Agent SaaS Prompt` for SaaS architecture, multi-tenancy, security, billing, enterprise constraints.
3. Firebase Studio prototype for interaction flow, page hierarchy, and MVP screen intent.
4. Figma for visual structure and layout details where accessible.
5. Existing repo implementation only where it does not conflict with the four sources above.

## Product Definition Confirmed

Law Organizer is not just a generic CRM. The confirmed target product is:

- Ukrainian-language legal CRM/CLM SaaS.
- Multi-tenant by default with tenant-scoped data access.
- Role-based and subscription-gated.
- Focused on lawyers, advocates, legal firms, and FOP legal practitioners.
- Built around clients, cases, documents, events, pricelists, calculations, team, billing, audit, and onboarding.
- Expected to support legal-practice-specific workflows, not only generic admin CRUD.

## What Already Aligns Well

### Architecture

- NestJS + React + TypeORM stack matches TZ and detailed prompt.
- Multi-tenant posture exists in docs and backend structure.
- Billing model with Stripe and WayForPay matches prompt and project overview.
- Enterprise modules exist for audit, cache, CDN, custom domains, tenant DB routing, and performance.

### Current product direction

- Ukrainian UI text is already present in frontend.
- Onboarding exists as a first-class flow.
- Clients, cases, documents, billing, dashboard, and profile have implementation started.
- Project docs already track RLS, RBAC gaps, token revocation, and PII encryption as open items.

### Firebase prototype overlap

Hosted prototype confirms these high-level product signals:

- Public landing exists before auth.
- Positioning is "all-in-one" legal workflow platform.
- Core highlighted capabilities are client management, case management, document handling, and AI-assisted workflow.

### Local Figma overlap

Local exported screens confirm:

- Fixed left sidebar with the full legal-product IA from TZ.
- Top bar quick actions are always visible: `Додати клієнта`, `Додати справу`.
- Client detail is a multi-column page, not a generic CRUD form.
- Case detail is a tabless page with timeline-centered layout.
- Documents module supports both list and tile views.
- Pricelists are first-class in primary navigation, not a secondary admin function.

## Major Misalignments

### 1. Product IA is much closer now, but still not fully exposed in the live shell

Current frontend now has real routes/pages for:

- landing
- dashboard
- profile
- clients
- client details
- cases
- case details
- documents
- calendar
- pricelists
- calculations
- activity
- reports
- print forms
- chat
- mail

However, the live shell still diverges from the canonical product IA in two important ways:

- `profile`, `users`, and `settings` are not surfaced as first-class navigation destinations in the sidebar/menu structure
- `activity` and `reports` exist as routes but remain hidden in the sidebar config via `visible: false`

Implication:

- Route coverage is no longer the main problem; discoverability and IA consistency are.
- Product docs should stop describing most of these modules as missing, but they should still call out shell/navigation drift.

### 2. Users, audit, and settings are still true placeholders

`src/frontend/App.tsx` still mounts local placeholder components for:

- `/users`
- `/audit`
- `/settings`

Implication:

- These are still real product gaps, not just documentation drift.
- They should remain in the near-term backlog because they affect tenant administration and operational completeness.

### 3. Registration and onboarding are still under-specified versus TZ

Current `RegisterPage` is email/password only.
Current `OnboardingWizard` captures only:

- organization details
- user profile
- subscription selection
- team invitation
- first case

But TZ requires much deeper data capture for:

- organization type
- legal activity status
- personal details
- multiple phones/emails
- addresses
- tax model
- bank details
- head/director details

Implication:

- The project currently splits required profile data across future profile/onboarding stages without documenting the split.
- That ambiguity slows development and causes DTO/schema drift.

### 4. Client and case detail experience is improved but still only partially aligned to TZ

TZ expects:

- dedicated client card with tabs
- dedicated case card with "без табов"
- activity timeline
- case/client file panels
- weekly calendar views
- comment blocks

Current implementation now provides:

- real route-based `ClientDetailsPage`
- real route-based `CaseDetailsPage`
- edit/save flows inside those detail screens
- related cases/timeline-oriented supporting blocks

But they still do not fully match the exact TZ/Figma composition for tabs, right rail behavior, and activity-first information hierarchy.

Implication:

- These modules should be treated as `partial`, not `missing`.
- Product docs should now distinguish "route-backed working detail screen" from "TZ-complete final interaction model".

### 5. Current frontend page composition still diverges from local Figma in several modules

Local Figma shows these concrete layout rules:

- `Мої клієнти` is a table page with a dedicated filter card above the table.
- `Сторінка клієнта` uses:
  - left main column for client identity and activity/calendar switch
  - right rail for client cases, comment, and files
  - inline `Додати` dropdown with `Подію`, `Нотатку`, `Документ`, `Розрахунок`
- `Справа` uses:
  - center-left activity stream
  - right rail for case summary, client summary, comment, files
  - no separate tabs
- `Документи по справі` supports:
  - breadcrumb path
  - folder drill-down
  - list/tile toggle
  - mass selection
  - search
  - `Створити`
- `Мій профіль` in Figma is primarily a grouped read/view screen with a single edit action
- `Додавання справи` for existing client is intentionally minimal, not a long enterprise form

Implication:

- Several current repo pages are functionally richer in raw form fields but structurally different from the designed workflow.
- Future implementation should preserve screen hierarchy and interaction density from the local Figma even when backend fields are broader.

### 6. Several secondary modules now exist only as operational hubs, not product-complete modules

The repo now includes real routes for:

- reports
- print forms
- chat
- mail
- calculations

But these pages are currently lightweight workspace/summary surfaces built from existing data, not full product-complete implementations of:

- reporting builders
- print-form/template management
- messaging backend
- mail delivery workspace
- calculation authoring/export workflows

Implication:

- These modules are no longer `missing`.
- They should be classified as `partial hub implementations`, with explicit follow-up scope.

### 7. Feature set from TZ is still broader than current documented scope

TZ includes modules or capabilities not represented as active development targets:

- pricelists as a first-class UI flow
- activity feed as standalone module
- print forms
- reports
- chat
- mail
- users module in product IA
- registry integrations
- rich text notes
- document notes and move/rename folder workflows

Implication:

- Need a canonical backlog separating MVP, phase 2, and later enterprise features.

### 8. Prompt-level SaaS requirements are better reflected now, but product docs still lag module-level acceptance criteria

Detailed prompt requires explicit treatment of:

- backend-only feature gating
- per-module RBAC matrix
- state machines
- RLS-ready DB layer
- immutable audit logs
- enterprise tenant DB routing
- QA scenarios for cross-tenant leakage and subscription bypass

Current project docs mention these areas, but they are not tied to module-level delivery checklists.

Implication:

- Delivery can appear "feature complete" while remaining non-compliant with the SaaS prompt.

## Canonical Information Architecture For Development

Use this as the product navigation baseline unless the user explicitly changes scope:

### Public area

- Landing
- Login
- Registration
- Password recovery

### Authenticated core

- Dashboard
- My Profile
- Clients
- Cases
- Documents
- Calendar / Events
- Pricelists
- Calculations
- Activity
- Billing / Subscription
- Team / Users
- Settings

### Authenticated secondary modules

- Reports
- Print Forms
- Chat
- Mail
- Audit

### Enterprise-only extensions

- Advanced audit
- Custom domains
- Dedicated tenant DB
- SLA / performance dashboards

## Canonical Route Map

Use these route names to stop accidental drift:

| Area | Canonical Route |
|------|-----------------|
| Landing | `/` |
| Login | `/login` |
| Register | `/register` |
| Dashboard | `/dashboard` |
| Profile | `/profile` |
| Clients list | `/clients` |
| Add client | `/clients/add` |
| Client details | `/clients/:id` |
| Client edit | `/clients/:id/edit` |
| Cases list | `/cases` |
| Add case | `/cases/add` |
| Case details | `/cases/:id` |
| Case edit | `/cases/:id/edit` |
| Documents list | `/documents` |
| Calendar | `/calendar` |
| Pricelists | `/pricelists` |
| Calculations | `/calculations` |
| Activity | `/activity` |
| Team / users | `/team` |
| Billing | `/billing` |
| Settings | `/settings` |
| Reports | `/reports` |
| Print forms | `/print-forms` |
| Chat | `/chat` |
| Mail | `/mail` |
| Audit | `/audit` |

## Canonical Module Status Matrix

| Module | Source expectation | Current repo state | Status |
|--------|--------------------|--------------------|--------|
| Landing | Required by Firebase prototype | Implemented route/page | Partial |
| Auth | Required | Present | Partial |
| Organization setup | Required | Basic onboarding only | Partial |
| Profile | Required, detailed | Real page exists, but shell placement and view/edit contract still diverge from TZ | Partial |
| Clients list/add | Required | Implemented foundation | Partial |
| Client details | Required | Route-backed details/edit screen exists, but not TZ-complete | Partial |
| Cases list/add | Required | Implemented foundation | Partial |
| Case details | Required | Route-backed details/edit screen exists, but not TZ-complete | Partial |
| Documents | Required | Implemented list/upload basis | Partial |
| Calendar/events | Required | Real route/page exists | Partial |
| Activity/notes | Required | Real route/page exists, but still not full TZ pattern everywhere | Partial |
| Pricelists | Required | Real list/details/editor routes exist | Partial |
| Calculations | Required | Real route/page exists as analytics hub, not full calculation workflow | Partial |
| Billing | Required | Present | Partial |
| Team/users | Required | `/users` is still placeholder; `/team` only redirects | Missing |
| Settings | Required | Placeholder route | Missing |
| Reports | Required by TZ menu | Real route/page exists as reporting hub | Partial |
| Print forms | Required by TZ menu | Real route/page exists as workspace hub | Partial |
| Chat | Required by TZ menu | Real route/page exists as collaboration hub | Partial |
| Mail | Required by TZ menu | Real route/page exists as outbound hub | Partial |
| Audit | Prompt + enterprise docs | Placeholder route | Missing |

## Screen Contracts To Use Going Forward

These rules should be treated as implementation defaults:

### Global shell

- Fixed left sidebar is canonical.
- Top header must include global quick actions `Додати клієнта` and `Додати справу`.
- Footer/legal block in sidebar is part of the designed shell and should be preserved in app layout planning.

### List screens

- Search input always visible.
- Filter group visible above list.
- Pagination required.
- Row/card click opens detail view.
- Bulk actions required where TZ mentions file operations.
- Filter block should be visually separated above the main list/table when following local Figma.

### Detail screens

- Breadcrumbs required.
- Primary entity summary stays visible above the fold.
- Action buttons grouped in header.
- Tabs only where TZ explicitly expects tabs.
- Case detail must stay tabless if following TZ literally.
- Client detail should use a split layout: main activity area plus right summary rail.
- Case detail should use a split layout: timeline/activity area plus right summary rail.

### Form screens

- Save and secondary action buttons remain visible without scrolling to the very top.
- Dynamic fields documented per client type and organization type.
- Multiple phone/email/address blocks treated as reusable form sections.
- Ukrainian labels are canonical.
- Where Figma provides a deliberately short operational form, avoid inflating the first screen with every possible field; use progressive disclosure if needed.

### Document UX

- Categories, rename, move, note, delete, download are part of MVP document management.
- Folder operations are explicitly in TZ and should not be omitted from docs.
- Both list and tile modes are canonical, because both are present in local Figma.

### Activity UX

- Timeline is a product-level pattern shared by client and case details.
- Notes, events, documents, calculations should appear as activity types where appropriate.
- `Додати` dropdown on activity streams is part of the expected UX pattern.

## Development Rules That Should Be Applied In Docs And Tickets

### Functional rules

- Do not mark a module "done" if only list/create screens exist but detail/timeline/file/calendar behavior from TZ is missing.
- Do not introduce new route names if an equivalent canonical route already exists in this document.
- Do not treat placeholder pages as implemented modules in release notes or readiness docs.

### Architecture rules

- Every new business entity must explicitly document `tenant_id`, audit behavior, soft delete behavior, RBAC, and subscription gating.
- Every module task should include backend and frontend acceptance criteria together.
- Backend feature gating is mandatory source of truth; frontend feature hiding is supplemental only.

### UX rules

- Ignore color differences when comparing to prototype, but preserve layout intent, module order, forms, tables, cards, tabs, and CTA placement.
- Firebase Studio prototype should be used as an MVP interaction reference until Figma becomes accessible again.

## Priority Backlog To Reduce Drift Fast

### Priority 0

- Replace placeholder admin/ops routes with real pages:
  - `/users`
  - `/audit`
  - `/settings`
- Expose the already-built product routes in the live IA/navigation:
  - `/profile`
  - `/activity`
  - `/reports`
  - `/users`
  - `/settings`
- Add this refreshed audit as a referenced source in future planning docs.

### Priority 1

- Normalize sidebar and top-level product shell to the canonical legal-product IA.
- Product-complete the user/admin surfaces:
  - users
  - settings
  - audit
- Tighten client and case detail screens toward the TZ/Figma layouts instead of treating the current route-backed screens as final.

### Priority 2

- Document and implement profile/onboarding split:
  - what must be collected at registration
  - what must be collected in onboarding
  - what remains editable in profile
- Deepen calculations from analytics summary into calculation authoring/export workflows.
- Turn reports / print forms / chat / mail from workspace hubs into product-complete modules or explicitly phase-label them as post-launch.

### Priority 3

- Add registry integrations, richer notes, and document move/rename/comment workflows to the explicit roadmap with phase labeling.
- Expand module-level QA checklists for tenant isolation, subscription bypass, and RBAC.

## Recommended Ticketing Structure

To accelerate coding, every new feature ticket should include:

1. Product source reference:
   - `TZ`, `Unified Prompt`, `Firebase prototype`, optionally `Figma`
2. Screen scope:
   - list, create, details, edit, modal, empty state
3. Data scope:
   - entities, DTOs, relations, tenant rules
4. Security scope:
   - RBAC, subscription gate, audit log, soft delete
5. Acceptance criteria:
   - UX behavior, API contract, test coverage, route names

## Summary

Current repository direction is broadly consistent with the SaaS architecture prompt, but not yet with the full functional scope and IA defined in the original TZ and prototype flow.

The biggest practical blockers are now:

- missing real users/settings/audit surfaces
- incomplete navigation exposure for already-built modules
- under-specified onboarding/profile data ownership
- several secondary modules that exist only as workspace hubs rather than full product workflows
- placeholder routes presented as real modules
- shallow onboarding/profile capture versus required legal data model
- absent public landing flow
- missing detail screens for the two central entities: clients and cases

This file should be treated as the current reconciliation baseline before further frontend or documentation expansion.
