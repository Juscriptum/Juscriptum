---
name: law-organizer-ui-audit
description: Audit and carefully improve UI/UX consistency in Law Organizer's professional legal CRM/ERP frontend. Use when asked to review a page, table, form, filter area, modal, navigation flow, responsive behavior, or make small approved UI cleanups without redesigning the product.
---

# Law Organizer UI Audit

Use this skill when:

- auditing a screen for UI consistency or usability
- reviewing tables, forms, filters, headers, modals, or dense workflows
- finding layout, spacing, hierarchy, or responsive problems
- aligning a page with existing Law Organizer patterns
- implementing small approved UI fixes after the audit

## Product posture

- Treat Law Organizer as a dense professional legal CRM/ERP, not a marketing site.
- Optimize for clarity, consistency, scannability, predictable actions, readable density, and cross-device practicality.
- Reuse the current frontend language before proposing anything new:
  - React 18 + Vite in `src/frontend`
  - shared tokens in `src/frontend/index.css`
  - shell/navigation in `src/frontend/App.tsx` and `src/frontend/components/navigation/*`
  - common primitives such as `PageHeader`, `FormActionBar`, `RecordActionsMenu`, `DateRangePicker`, and `DatePicker`
  - page-level CSS files for module-specific layouts
- Infer the real pattern from code, not from wishful thinking. This repo has shared primitives, but many pages still use local layout variants.

## Inspect First

1. Read the target page TSX and CSS.
2. Read the shared component(s) the page depends on.
3. Compare against 2-3 similar Law Organizer screens:
   - registries: clients, cases, calculations, documents, pricelists, notes
   - forms: add/edit client, case, calculation
   - workspace/report screens: reports, activity, dashboard
4. Check whether the page uses canonical tokens or page-local one-off styles.

Start with these files when relevant:

- `src/frontend/index.css`
- `src/frontend/App.tsx`
- `src/frontend/components/navigation/*`
- `src/frontend/components/PageHeader.tsx`
- `src/frontend/components/FormActionBar.tsx`
- `src/frontend/components/RecordActionsMenu.tsx`
- `src/frontend/components/DateRangePicker.tsx`

## Audit Workflow

1. Classify the screen:
   - registry/table-heavy
   - dense form/data entry
   - workspace/explorer
   - dashboard/report
   - modal/overlay flow
2. Review navigation and page structure.
3. Review tables, filters, and list density.
4. Review forms and action placement.
5. Review visual consistency against existing Law Organizer patterns.
6. Review usability and cognitive load.
7. Review desktop, laptop, tablet, and mobile behavior.
8. Recommend the smallest reliable fix set.

## Always Evaluate

- Navigation and page structure:
  - side navigation consistency
  - top bar consistency
  - page title and action area clarity
  - breadcrumbs or contextual orientation
  - action discoverability
- Tables and list-heavy screens:
  - table readability and column hierarchy
  - row action discoverability
  - spacing in dense rows
  - status readability
  - alignment of numeric, date, and status fields
  - whether filters feel attached to the results area
  - overload risk
  - horizontal scrolling and overflow handling
  - whether actions remain usable on tablet and mobile
- Forms and data entry:
  - logical grouping of fields
  - label clarity
  - primary versus secondary action placement
  - validation, help, and error text placement
  - input height and spacing consistency
  - support for fast professional use
  - touch usability for fields, date pickers, dropdowns, and actions
- Visual consistency:
  - repeated component patterns
  - button consistency
  - input and select consistency
  - card and panel consistency
  - badge and status consistency
  - icon usage consistency
  - spacing scale consistency
  - typography hierarchy consistency
- Usability:
  - cognitive load
  - scan efficiency
  - clarity of primary vs secondary actions
  - too many competing actions
  - hidden important actions
  - ambiguity in dropdown or ellipsis actions
  - friction in filter and search workflows
- Responsiveness and device realism:
  - behavior on large desktop monitors
  - behavior on normal laptop screens
  - behavior on tablets in portrait and landscape
  - behavior on mobile devices
  - overflow risk
  - cramped controls
  - poor stacking order
  - hidden or collapsed controls without clear access
  - unusable tap targets
  - hover-only interactions that may fail on touch devices
  - side navigation behavior on narrow screens
  - header/action bar behavior on narrow screens
  - filter panel behavior on tablet/mobile
  - modal/dialog behavior on small screens
  - whether a dense screen needs responsive simplification instead of naive shrinking
- Device-type classification:
  - fully productive desktop-first
  - reasonably workable on tablet
  - only limited mobile workflow is realistic
  - needs a special simplified responsive strategy
- Minimal-fix discipline:
  - prefer small, justified fixes
  - reuse existing components and tokens
  - do not introduce new patterns unless necessary
  - do not redesign an entire page to solve a local inconsistency

## Change Safety

Small local fixes may be implemented without confirmation only when they are clearly low-risk, such as:

- aligning button or input heights within one screen
- fixing local spacing or alignment issues
- correcting a minor visual inconsistency
- improving label spacing
- fixing a clearly broken narrow-screen wrap in one local area

Stop and ask for approval before implementing anything major, structural, or visually significant. Treat the change as major if it includes any of these:

- changing page layout structure
- moving major actions
- changing navigation behavior or order
- replacing a widely used UI pattern
- changing global spacing, typography, or button rules
- substantially changing table structure or responsive table behavior
- significantly regrouping a form
- changing the responsive strategy for a page or module
- introducing new components or a new visual language
- touching many files across multiple screens
- anything likely to change user habits or workflow

Before asking for approval, present:

1. what you want to change
2. why
3. affected files and screens
4. expected UX impact
5. expected desktop, tablet, and mobile impact
6. whether it is local and reversible or broad and systemic

If unsure whether a change is major, treat it as major.

## Output Format

Use this structure for audit results:

1. Overall UI health summary
2. Desktop usability assessment
3. Tablet usability assessment
4. Mobile usability assessment
5. Concrete issues found
6. Severity:
   - high
   - medium
   - low
7. Minimal recommended fixes
8. Which fixes require user approval first
9. Which fixes are safe and local
10. If implementation is requested:
   - exact files to edit
   - exact changes to make
   - how to verify consistency afterward
   - how to verify responsive behavior afterward

Prefer concrete wording such as:

- filters are visually detached from the results table
- action hierarchy is weak in the page header
- row action placement is inconsistent with other registries
- spacing between filter controls is irregular
- badge styles are inconsistent across modules
- likely mobile overflow in the filter bar
- form sections do not support quick scanning
- touch targets are too small for tablet/mobile use
- the table cannot stay fully usable on mobile without simplified behavior

Avoid vague wording such as "make it prettier", "modernize it", or "improve aesthetics".

## Verification

- If screenshots, preview, or rendered views are unavailable, say that findings are partly inferred from code structure and must be visually checked on desktop, tablet, and mobile.
- After implementing UI changes, run at least:
  - `npm run build:frontend`
- When responsive behavior or navigation changed, also do the smallest honest follow-up:
  - inspect the edited screen and at least one comparable screen for consistency
  - visually verify desktop, tablet, and mobile layouts if a running preview is available
  - use existing smoke coverage when relevant, but do not pretend it replaces visual review
- State clearly what was code-reviewed, what was visually checked, and what remains inferred.

## Must Not Do

- do not redesign the product
- do not invent a new design system from scratch
- do not optimize for trendiness
- do not replace established patterns lightly
- do not spread a local cleanup into unrelated screens
- do not assume code review alone gives perfect visual certainty
