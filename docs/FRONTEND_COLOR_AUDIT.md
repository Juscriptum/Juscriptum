# Frontend Color Audit

## Purpose

Track frontend CSS files that still use deprecated legacy palette fragments instead of the canonical `Compact Legal CRM` token set from `src/frontend/index.css`.

## Canonical Palette

- Shell dark:
  - `#182235`
  - `#22314a`
  - `#1b2536`
- Accent blue:
  - `#2c5fb2`
  - `#3d76d1`
  - `#5a90e5`
- Neutral surfaces/text:
  - use semantic tokens from `src/frontend/index.css`

## Deprecated Palette Families

- Purple / indigo gradient family:
  - `#667eea`
  - `#764ba2`
  - `#5a67d8`
- Legacy auth dark gradient family:
  - `#1a1a2e`
  - `#16213e`
  - `#0f3460`
- Legacy indigo action family:
  - `#4f46e5`
  - `#4338ca`
- Unscoped direct utility colors should also be migrated to semantic tokens over time.

## Known Drift Files

High drift:

- `src/frontend/pages/onboarding/OnboardingWizard.css`
- `src/frontend/pages/billing/BillingPage.css`
- `src/frontend/pages/billing/PaymentResult.css`
- `src/frontend/pages/profile/ProfilePage.css`
- `src/frontend/components/UpgradePrompt.css`

Legacy auth palette still present:

- `src/frontend/pages/auth/LoginPage.css`
- `src/frontend/pages/auth/RegisterPage.css`

Legacy indigo/button palette still present in page CSS:

- `src/frontend/pages/clients/ClientsPage.css`
- `src/frontend/pages/cases/CasesPage.css`
- `src/frontend/pages/documents/DocumentsPage.css`
- `src/frontend/pages/cases/CaseDetailsPage.css`

Mixed legacy grayscale / hardcoded color drift:

- `src/frontend/pages/dashboard/DashboardPage.css`
- `src/frontend/pages/calendar/CalendarPage.css`
- `src/frontend/pages/pricelists/PricelistsPage.css`
- `src/frontend/pages/activity/ActivityPage.css`

## Audit Notes

- Shared shell and shared controls now use the canonical token layer.
- The remaining drift is mostly page-level CSS written before the design-system baseline existed.
- New work must migrate touched pages toward tokens instead of copying local legacy colors forward.
