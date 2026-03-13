# Law Organizer - Legal CRM SaaS Platform

> Enterprise multi-tenant legal practice management system

## Project Overview

Law Organizer is a comprehensive SaaS platform for legal professionals in Ukraine, providing case management, client CRM, document management, billing, and calendar functionality.

## Documentation Update Policy

Documentation updates are mandatory completion criteria for every substantial task.
A task is not considered complete until both implementation changes and documentation updates are applied.

### When Documentation Must Be Updated

- after any non-trivial backend or frontend code change
- after any schema, migration, auth, security, access-control, billing, storage, or deployment change
- after bug fixes that change behavior, validation, routing, permissions, or data flow
- after verification runs that materially change project status (`lint`, `test`, `test:e2e`, `build`)

### Required Documentation Targets

- `CLAUDE.md` — update architecture, security model, recent changes, key files, and open risks when relevant
- `docs/PROJECT_CONTEXT_CACHE.md` — update current snapshot, validation status, technical state, and next-session guardrails
- relevant files in `docs/` — update security, deployment, architecture, compliance, or audit reports when the task affects those areas

### Documentation Rules

- always record verification status for the commands that were actually run
- always record unresolved risks, limitations, and follow-up gaps
- if the task changes security posture, tenancy, encryption, signature flows, or compliance assumptions, reflect that explicitly in the docs
- if the task is small but changes behavior, add at least a concise note to `docs/PROJECT_CONTEXT_CACHE.md`
- do not leave code and docs out of sync at the end of the task

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
| Isolation Level | Application-level + RLS (production), moving to `tenant + user scope` |
| Context Propagation | JWT payload + TenantGuard + DB session context (`app.current_tenant_id`, `app.current_user_id`, `app.current_user_role`) |
| Storage | Tenant-prefixed paths |

### User-Level Isolation Strategy

| Aspect | Implementation |
|--------|----------------|
| Record scope | `accessScope`: `private`, `assigned`, `tenant` |
| Default visibility | New records default to `assigned` |
| Access checks | Service-level enforcement by actor role + record ownership/assignment |
| Protected modules | `cases`, `clients`, `documents` |
| Elevated roles | `super_admin`, `organization_owner`, `organization_admin` |
| Goal state | Postgres RLS policies aware of both tenant and current user |

### Tenant Context Flow

```
1. User authenticates → JWT issued with tenant_id
2. Request → JwtAuthGuard validates token
3. TenantGuard extracts tenant_id from JWT
4. Request.tenantId set for controllers
5. Services apply tenant + actor scope filters for `cases`, `clients`, `documents`
6. PostgreSQL session context prepared for future user-aware RLS
7. Audit logs include tenant_id
```

### Trusted Identity / Signature Foundation

| Capability | Current Foundation |
|-----------|--------------------|
| Qualified e-signature (КЕП/ЕЦП) | `document_signatures` registry with provider, hash, certificate metadata, verification status |
| Trusted identity binding | `user_identities` registry for verified external identities |
| Ukrainian providers planned | АЦСК / КНЕДП, Дія, BankID НБУ |
| Verification model | provider-specific status + certificate/subject metadata + audit trail |
| Current limitation | no live certificate validation, CRL/OCSP, Diia.Sign flow, or BankID OAuth exchange yet |

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
├── invoices/       # Invoice generation
├── pricelists/     # Service pricing
├── calculations/   # Fee calculations
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

### Billing

| File | Purpose |
|------|---------|
| `src/billing/services/stripe.service.ts` | Stripe integration |
| `src/billing/services/wayforpay.service.ts` | Ukrainian payments |
| `src/billing/services/billing.service.ts` | Subscription management |

### Frontend

| File | Purpose |
|------|---------|
| `frontend/App.tsx` | Main application |
| `frontend/store/` | Redux state management |
| `frontend/hooks/` | Custom hooks |
| `frontend/i18n/` | Ukrainian localization |

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
BANKID_CLIENT_ID=xxx
BANKID_CLIENT_SECRET=xxx
BANKID_REDIRECT_URI=https://app.laworganizer.ua/auth/bankid/callback
TRUST_PROVIDER_WEBHOOK_SECRET=xxx
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
- [x] CSRF protection
- [x] Rate limiting
- [x] Helmet security headers
- [x] Audit logging
- [x] Service-level user-scoped access control for cases/clients/documents
- [x] Signature/identity schema foundation for Ukrainian trust providers
- [ ] Row Level Security (TODO: enable in production)
- [ ] PII encryption at rest (TODO: enable)
- [ ] Live certificate validation (OCSP/CRL) for КЕП/АЦСК
- [ ] Diia.Sign / Diia OAuth production integration
- [ ] BankID НБУ production integration

## Known Issues & TODOs

### Critical (Fix Before Production)

1. **Enable tenant+user aware Row Level Security** - current production target still not enforced at DB level
2. **Implement field-level PII encryption** - phone, tax IDs, passport fields still stored in plaintext
3. **Implement live trust-provider verification** - KEP/АЦСК, Diia, BankID currently schema-ready only
4. **Create @Roles decorator** - RBAC currently non-functional

### High Priority

5. **Implement subscription enforcement middleware** - Limits not enforced
6. **Add missing indexes** - Soft delete queries need indexes
7. **Add deleted_at to invitations table** - Constraint references non-existent column
8. **Implement token blacklisting** - Immediate token revocation

### Medium Priority

9. **Implement file virus scanning** - Malware protection
10. **Add security monitoring** - Anomaly detection
11. **Add signature verification worker** - async provider callbacks / re-checks / revocation events

## Recent Changes

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

## Contact

- **Developer:** Edhar Simonian
- **Repository:** Private

---

> Generated: 2026-02-25
> Version: 1.0.0
