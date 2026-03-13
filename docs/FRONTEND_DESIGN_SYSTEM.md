# Frontend Design System

## Canonical Direction

`Compact Legal CRM`

This is the single visual source of truth for the frontend. New UI work should follow this system instead of inventing local palettes, radii, button styles, or type scales.

## Principles

1. Information-first. UI chrome must not compete with client, case, document, and registry data.
2. Compact by default. Desktop legal workflows need density, not oversized decorative spacing.
3. Enterprise CRM tone. Cold neutral surfaces, dark navy text, restrained blue accents.
4. One readable UI font only. Use `Golos Text` everywhere without serif exceptions.
5. Shared tokens first. Colors, sizes, spacing, radii, and shadows must come from `src/frontend/index.css`.
6. Registry-first screens should open with filters and the main list/table, not decorative KPI or summary cards.
7. Registry and utility-editor headers should stay terse: avoid explanatory marketing-style subtitles unless they are operationally necessary.

## Typography

- Only allowed font: `Golos Text`
- `var(--font-sans)` and `var(--font-serif)` must both resolve to `Golos Text`
- Base body size: `var(--text-md)`
- Small/supporting text: `var(--text-xs)` / `var(--text-sm)`
- Section copy: `var(--text-lg)`
- Standard page title: `var(--text-title)`
- Section title: `var(--text-section)`
- Caption/eyebrow/date helper text: `var(--text-caption)`

Rules:

- Do not use any second accent or display font.
- Do not mix ad-hoc font stacks inside page CSS.
- Prefer `600-700` weight for labels and controls; avoid visually heavy `800+` unless it is a hero title.

## Color System

- Primary text: `--color-ink-900`
- Secondary text: `--color-ink-700`
- Muted/supporting text: `--color-ink-500`
- Dividers: `--color-line`
- Main surface: `--color-surface-strong`
- Soft elevated surface: `--color-surface-elevated`
- Muted surface: `--color-surface-muted`
- Sidebar background: `--color-sidebar-bg-start` -> `--color-sidebar-bg-end`
- Sidebar text: `--color-sidebar-text`
- Sidebar active/hover: `--color-sidebar-hover`, `--color-sidebar-active`, `--color-sidebar-active-line`
- Primary accent: `--color-accent-700`
- Accent highlight: `--color-accent-600`

Rules:

- Do not use warm gold/champagne branding tones in application surfaces.
- Accent color should guide attention, not flood the interface.
- State colors (`success`, `danger`) should be used only for status and feedback, not core branding.

Hard palette policy:

- Primary application palette is navy / slate / white with restrained blue accent.
- Allowed accent family:
  - `#2c5fb2`
  - `#3d76d1`
  - `#5a90e5`
- Allowed shell dark family:
  - `#182235`
  - `#22314a`
  - `#1b2536`
- Legacy gradients based on `#667eea`, `#764ba2`, `#1a1a2e`, `#0f3460` are deprecated and must not be introduced in new UI.
- Legacy strong indigo buttons based on `#4f46e5` / `#4338ca` are deprecated outside explicit migration debt.

## Spacing And Density

- Primary spacing scale: `--space-1` to `--space-6`
- Desktop shell should prefer `--space-2` to `--space-4`
- Large empty gutters should be removed unless they improve scanability of dense records

Rules:

- Do not default to oversized cards and oversized button paddings.
- Prefer compact vertical rhythm in sidebars, filters, action bars, and tables.
- Do not add summary strips, KPI cards, or empty overview blocks above CRM registries unless the page is explicitly analytics-first or the user asked for them.
- When a count is not operationally required for the immediate workflow, keep it out of the first viewport.
- Utility panels such as variable catalogs, action rails, and insert pickers must prefer dense row lists over large stacked cards.

## Radius And Shadow

- Small controls: `--radius-sm`
- Inputs/buttons/cards: `--radius-md` / `--radius-lg`
- Large panels/overlays: `--radius-xl`
- Pills only where semantically appropriate: `--radius-pill`
- Shadows:
  - subtle surfaces: `--shadow-soft`
  - floating bars/cards: `--shadow-medium`
  - overlays/popovers: `--shadow-heavy`

Rules:

- Avoid “inflated” UI:
  - excessive pill buttons
  - giant rounded cards
  - strong glossy shadows

## Control Standards

- Small control height: `--control-height-sm`
- Default control height: `--control-height-md`
- Form field height: `--control-height-lg`
- Large tab/control height: `--control-height-xl`

Buttons:

- Primary actions: restrained blue accent, compact height, medium radius
- Secondary/outline actions: white or muted neutral surface, subtle border
- Buttons should feel precise, not soft or bloated

Inputs:

- Neutral white background
- Thin border
- Soft focus ring using accent tint
- Compact but readable padding

Mandatory rules:

- All text inputs, selects, date pickers, date range pickers, search bars, and registry filters must use the shared control-height tokens.
- Page-specific CSS must not redefine standalone input/select heights unless there is a documented exception.
- Date text, helper labels, and section headings must use shared typography tokens instead of local pixel values.
- Rich-text editor screens must prefer a single compact toolbar with overflow/scroll behavior over multi-row oversized formatting chrome.
- If the editor already exposes document-formatting controls, do not duplicate them in a separate left/right settings panel unless the user explicitly asked for a second control surface.
- Sticky utility rails are allowed for variable catalogs, action panels, and save bars, but they must stay dense enough that the main work area remains visible in the first viewport on laptop-height screens.

## Long Forms And Editors

- Long create/edit pages should use the shared `FormActionBar` pattern for sticky completion actions instead of page-local floating button rows.
- Document/template editors should keep the main canvas first, with supporting variable/action rails secondary.
- Side rails for variables, insert helpers, and metadata should default to compact lists and collapsed groups, not tall card stacks.

## Shared Components Covered By The Current System

- `src/frontend/index.css`
- `src/frontend/App.css`
- `src/frontend/components/navigation/Navigation.css`
- `src/frontend/components/PageHeader.css`
- `src/frontend/components/FormActionBar.css`
- `src/frontend/components/RegistrySearchOverlay.css`
- `src/frontend/components/DatePicker.css`
- `src/frontend/components/DateRangePicker.css`

## Migration Rules For Legacy Pages

When touching an older page with hardcoded styles:

1. Replace hardcoded font sizes with shared typography tokens.
2. Replace hardcoded colors with semantic tokens.
3. Replace custom radii/shadows with shared radius/shadow tokens.
4. Remove decorative gradients unless the component is a deliberate primary action or hero surface.
5. Keep page-specific styling only for layout and domain-specific presentation.

## Known Legacy Drift

The audit on `2026-03-08` showed many legacy page CSS files still contain:

- old blue/purple gradients
- unrelated grayscale palettes
- oversized radii
- inconsistent font sizes
- custom shadows not aligned with the shell

These pages should be migrated incrementally to this design system, but no new work should introduce further drift.

## Color Audit References

See:

- `docs/FRONTEND_COLOR_AUDIT.md`

That file tracks known legacy CSS files still using deprecated palette fragments and should be updated whenever a page is migrated.
