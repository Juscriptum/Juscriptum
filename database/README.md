# Database Schema Documentation

## Overview
Production PostgreSQL schema for LAW ORGANIZER multi-tenant SaaS platform.

## Architecture
- **Multi-tenancy**: Shared database with `tenant_id` isolation
- **Security**: RLS-ready, audit logging, soft deletes
- **Performance**: GIN indexes for JSONB, full-text search
- **Compliance**: Immutable audit logs, data export per tenant

## Tables

### Organizations
Root tenant entity for legal practices.
- `id`: UUID primary key
- `tenant_id`: N/A (this is the tenant)
- Subscription: trial_end_at, current_period_end_at, max_users
- Status: provisioning → active → suspended

### Users
Multi-tenant user accounts with RBAC.
- `tenant_id`: References organizations.id
- Role: super_admin, organization_owner, organization_admin, lawyer, assistant, accountant
- Auth: password_hash, salt, mfa_secret
- Audit: last_login_at, last_login_ip

### RefreshTokens
JWT refresh token storage with device tracking.
- `user_id`: References users.id
- `tenant_id`: References organizations.id
- Token rotation: revoked_at, replaced_by

### PasswordResets
Secure password reset flow.
- `token`: One-time use token
- `expires_at`: 1 hour expiration

### Subscriptions
External payment provider sync.
- `provider`: stripe, wayforpay
- `external_id`: Customer/subscription ID from provider
- Plan & status tracking

### Invitations
Team invitation system.
- `tenant_id`: References organizations.id
- `token`: Secure invitation token
- Status: pending → accepted/expired/revoked

### OnboardingProgress
Track new tenant onboarding completion.
- `step`: organization_details, user_profile, subscription_setup, team_invitation, first_case_created
- `percentage`: Completion progress

### AuditLogs
Immutable audit trail (never deleted).
- `tenant_id`: References organizations.id
- `action`: create, update, delete, login, logout, permission_change
- Change tracking: old_values, new_values, changed_fields

## Indexes

### Performance Indexes
- `idx_users_tenant_id`: Primary tenant isolation
- `idx_organizations_name`: Full-text search (Ukrainian)
- `idx_users_name`: Full-text search (Ukrainian)
- `idx_users_tenant_role`: Combined filter

### JSONB Indexes (GIN)
- `organizations.settings`
- `users.preferences`
- `users.specialties`
- `audit_logs.metadata`

### Soft Delete Indexes
- All tables: `WHERE deleted_at IS NULL` indexes

## RLS Policies (Optional)

When RLS is enabled:
- `users_tenant_isolation`: Users can only see their tenant
- `users_tenant_insert`: Restrict inserts to current tenant
- `users_tenant_update`: Restrict updates to current tenant

To enable RLS:
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- Set current tenant per request:
SET app.current_tenant_id = 'uuid-here';
```

## Views

### v_active_users
Active user count by tenant and role.

### v_subscription_status
Subscription status with organization details.

### v_onboarding_progress
Onboarding completion percentage per user.

## Migration Strategy

Use TypeORM migrations:
```bash
npm run migration:generate -- -n InitAuthSchema
npm run migration:run
```

## Backup Strategy

1. **Daily Full Backup**: pg_dump with `--no-owner --no-acl`
2. **Hourly WAL Archiving**: Point-in-time recovery
3. **Tenant Export**: `pg_dump -t users -t organizations -t clients ... WHERE tenant_id = X`

## Compliance Notes

- **Audit Retention**: 90 days (configurable)
- **Soft Delete**: 30 days before purge
- **Data Export**: Per tenant via filtered dump
- **Field Encryption**: Use pgcrypto for sensitive fields (passport, INN)
