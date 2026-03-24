# Platform Admin Architecture

This document defines the owner back-office architecture for Law Organizer.

It is intentionally separate from the tenant CRM. The goal is to let the
portal owner operate billing, support, security, and platform diagnostics
without default access to attorney-client data.

## Core Decisions

- Frontend entry:
  - separate HTML entry at `platform-admin.html`
  - separate React bundle under `src/frontend/platform-admin`
  - not linked from the tenant SPA navigation
- Backend entry:
  - Nest module under `src/platform-admin`
  - API prefix under `/v1/platform-admin/*`
- Shared source of truth:
  - `src/platform-admin/blueprint/platform-admin.blueprint.ts`
  - used by the separate frontend scaffold and by the backend blueprint endpoint

## Security Boundaries

- Platform admin is not "just another organization member".
- Do not reuse the long-term tenant user model for portal-owner access.
- Dedicated `PlatformAdminUser` and token/session tables now exist in code.
- First-owner bootstrap and MFA enrollment now exist in code.
- Metadata-only dashboard and organization read models now exist in code.
- Production enablement still requires platform-admin audit tables and a
  PostgreSQL-safe privileged read strategy for tenant metadata.
- Default access must be metadata-first:
  - organization status
  - billing state
  - user roster with masked contacts
  - operational health
  - security posture
  - platform audit
- Default access must exclude:
  - clients
  - cases
  - notes
  - document contents
  - scan previews
  - raw provider callbacks
  - secrets and tokens
- Any future break-glass flow must be Phase 2 only and require:
  - explicit reason
  - approval
  - TTL
  - full audit trail

## Why A Separate Auth Model Is Required

Current auth and RLS are tenant-scoped:

- JWT payloads expect `tenant_id`
- request context propagation sets tenant-specific PostgreSQL session values
- RLS policies operate on tenant/user role combinations

That is good for tenant isolation, but it is the wrong long-term foundation for
portal-owner access. The repo now includes a dedicated platform-admin JWT
strategy, refresh-token store, revoked-access-token store, and auth controller,
so portal-owner auth is no longer anchored to the tenant `super_admin` guard.

## MVP Screens

- `Platform Admin Login`
  - first-owner bootstrap, dedicated sign-in, MFA verification, and required
    MFA enrollment
- `Dashboard`
  - platform KPIs, alerts, worker backlog, billing anomalies
- `Organizations Registry`
  - filterable tenant list with status, plan, risk flags, and activity
- `Organization Detail`
  - tabs for `Overview`, `Users`, `Billing`, `Security`, `Ops`, `Audit`
- `Operations`
  - health/readiness, provider issues, worker diagnostics
- `Platform Audit`
  - actor, target tenant, reason, and change summary

## MVP API

- `GET /v1/platform-admin/auth/bootstrap-status`
- `POST /v1/platform-admin/auth/bootstrap`
- `POST /v1/platform-admin/auth/login`
- `POST /v1/platform-admin/auth/verify-mfa`
- `POST /v1/platform-admin/auth/mfa/setup`
- `POST /v1/platform-admin/auth/mfa/confirm`
- `GET /v1/platform-admin/auth/me`
- `GET /v1/platform-admin/dashboard/summary`
- `GET /v1/platform-admin/organizations`
- `GET /v1/platform-admin/organizations/:id`
- `GET /v1/platform-admin/organizations/:id/users`
- `PATCH /v1/platform-admin/organizations/:id/status`
- `PATCH /v1/platform-admin/organizations/:id/plan`
- `POST /v1/platform-admin/organizations/:id/security/force-logout`
- `POST /v1/platform-admin/organizations/:id/security/reset-owner-mfa`
- `GET /v1/platform-admin/ops/health`
- `GET /v1/platform-admin/audit-logs`

All mutation endpoints must enforce a `reason` field.

## Read Model Rules

- Do not serialize tenant entities directly from platform-admin routes.
- Build allow-listed DTOs and query layers that return only approved metadata.
- Treat the existing `Client`, `Case`, `Document`, `Note`, and trust-verification
  entities as confidential by default.
- The current local owner surface is limited to:
  - platform KPIs and high-signal alerts
  - organization registry rows with masked owner contact details
  - organization detail cards with billing, security, and ops aggregates
  - masked tenant-user rosters
- For PostgreSQL production-like mode, platform-admin reads should use explicit
  read models or a privileged connection strategy, not accidental bypasses of
  tenant-facing repository paths.

## Phase 2

- Billing reconciliation
- Support workspace
- Feature flags and staged rollout
- Compliance workflows
- Break-glass approval flow
- Platform-admin RBAC by job function

## Current Scaffold In Repo

- backend blueprint module:
  - `src/platform-admin/platform-admin.module.ts`
  - `src/platform-admin/controllers/platform-admin-blueprint.controller.ts`
- backend auth module pieces:
  - `src/platform-admin/controllers/platform-admin-auth.controller.ts`
  - `src/platform-admin/services/platform-admin-auth.service.ts`
  - `src/platform-admin/services/platform-admin-jwt.service.ts`
  - `src/platform-admin/strategies/platform-admin-jwt.strategy.ts`
- backend read-model pieces:
  - `src/platform-admin/controllers/platform-admin-dashboard.controller.ts`
  - `src/platform-admin/controllers/platform-admin-organizations.controller.ts`
  - `src/platform-admin/services/platform-admin-read.service.ts`
  - `src/platform-admin/dto/platform-admin-read-model.dto.ts`
- dedicated auth storage:
  - `src/database/entities/PlatformAdminUser.entity.ts`
  - `src/database/entities/PlatformAdminRefreshToken.entity.ts`
  - `src/database/entities/PlatformAdminRevokedAccessToken.entity.ts`
  - `src/database/migrations/1711200000000-AddPlatformAdminAuth.ts`
- shared blueprint:
  - `src/platform-admin/blueprint/platform-admin.blueprint.ts`
- frontend scaffold:
  - `platform-admin.html`
  - `src/frontend/platform-admin/PlatformAdminApp.tsx`
  - `src/frontend/platform-admin/PlatformAdminApp.css`
  - `src/frontend/platform-admin/platformAdminApi.ts`
  - `src/frontend/platform-admin/platformAdminSession.ts`

## Verification Status

- The separate platform-admin auth model and its targeted service tests are
  locally verified.
- The separate frontend entry now supports first-owner bootstrap, dedicated
  login, MFA verification, MFA enrollment, and metadata-only dashboard and
  organization views locally.
- Platform-admin audit tables and a production-safe PostgreSQL privileged
  metadata path are not implemented yet.
- This document is architectural truth for the next implementation phase, not a
  claim that the back office is production-ready.
