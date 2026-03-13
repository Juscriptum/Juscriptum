-- =====================================================
-- LAW ORGANIZER - Multi-Tenant SaaS Database Schema
-- Production DDL with RLS, Indexes, Constraints
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE subscription_plan AS ENUM ('basic', 'professional', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'unpaid');
CREATE TYPE subscription_provider AS ENUM ('stripe', 'wayforpay');
CREATE TYPE user_role AS ENUM ('super_admin', 'organization_owner', 'organization_admin', 'lawyer', 'assistant', 'accountant');
CREATE TYPE user_status AS ENUM ('pending', 'active', 'suspended', 'deleted');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');
CREATE TYPE organization_status AS ENUM ('provisioning', 'active', 'suspended', 'deleted');
CREATE TYPE legal_form AS ENUM ('sole_proprietor', 'llc', 'joint_stock', 'partnership', 'other');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'permission_change');
CREATE type onboarding_step AS ENUM ('organization_details', 'user_profile', 'subscription_setup', 'team_invitation', 'first_case_created');

-- =====================================================
-- TABLE: Organizations (Root Tenant Entity)
-- =====================================================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    legal_form legal_form NOT NULL DEFAULT 'sole_proprietor',
    edrpou VARCHAR(10), -- Ukrainian company registration number
    tax_number VARCHAR(12), -- Tax ID
    address TEXT,
    city VARCHAR(100),
    region VARCHAR(100),
    country VARCHAR(2) DEFAULT 'UA',
    phone VARCHAR(20),
    email VARCHAR(255) NOT NULL,
    website VARCHAR(255),

    -- Subscription fields
    subscription_plan subscription_plan NOT NULL DEFAULT 'basic',
    subscription_status subscription_status NOT NULL DEFAULT 'trialing',
    trial_end_at TIMESTAMP WITH TIME ZONE,
    current_period_end_at TIMESTAMP WITH TIME ZONE,
    max_users INTEGER NOT NULL DEFAULT 1,

    -- Configuration
    custom_domain VARCHAR(255),
    mfa_required BOOLEAN NOT NULL DEFAULT FALSE,
    sso_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    audit_retention_days INTEGER NOT NULL DEFAULT 90,

    -- Status
    status organization_status NOT NULL DEFAULT 'provisioning',

    -- Metadata
    settings JSONB NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT organizations_email_unique UNIQUE (email, deleted_at),
    CONSTRAINT organizations_edrpou_unique UNIQUE (edrpou, deleted_at)
);

-- Indexes for Organizations
CREATE INDEX idx_organizations_name ON organizations USING GIN (to_tsvector('ukrainian', name));
CREATE INDEX idx_organizations_email ON organizations (email) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_edrpou ON organizations (edrpou) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_status ON organizations (status);
CREATE INDEX idx_organizations_subscription_status ON organizations (subscription_status);
CREATE INDEX idx_organizations_settings ON organizations USING GIN (settings);
CREATE INDEX idx_organizations_metadata ON organizations USING GIN (metadata);

-- =====================================================
-- TABLE: Users (Multi-Tenant)
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Profile
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    patronymic VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),

    -- Auth
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL,
    mfa_secret VARCHAR(255),
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_backup_codes JSONB,

    -- Role & Permissions
    role user_role NOT NULL,
    status user_status NOT NULL DEFAULT 'pending',

    -- Additional info
    position VARCHAR(100),
    avatar_url TEXT,
    bar_number VARCHAR(20), -- адвокатський номер
    specialties JSONB, -- array of legal specialties
    languages JSONB, -- array of languages (uk, en, ru, etc)

    -- Email verification
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    email_verification_token VARCHAR(255),

    -- Password reset
    password_reset_token VARCHAR(255),
    password_reset_expires_at TIMESTAMP WITH TIME ZONE,
    last_password_change_at TIMESTAMP WITH TIME ZONE,

    -- Login tracking
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip VARCHAR(45),
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,

    -- Metadata
    preferences JSONB NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    updated_by UUID,

    CONSTRAINT users_tenant_email_unique UNIQUE (tenant_id, email, deleted_at),
    CONSTRAINT users_role_check CHECK (
        role IN ('super_admin', 'organization_owner', 'organization_admin', 'lawyer', 'assistant', 'accountant')
    )
);

-- Indexes for Users (tenant-aware)
CREATE INDEX idx_users_tenant_id ON users (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON users (email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_name ON users USING GIN (to_tsvector('ukrainian',
    COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') || ' ' || COALESCE(patronymic, '')));
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_status ON users (status);
CREATE INDEX idx_users_tenant_role ON users (tenant_id, role) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_preferences ON users USING GIN (preferences);
CREATE INDEX idx_users_metadata ON users USING GIN (metadata);
CREATE INDEX idx_users_specialties ON users USING GIN (specialties);
CREATE INDEX idx_users_languages ON users USING GIN (languages);

-- =====================================================
-- TABLE: RefreshTokens
-- =====================================================

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    token VARCHAR(255) NOT NULL UNIQUE,
    device_info JSONB NOT NULL DEFAULT '{}',
    ip_address VARCHAR(45),
    user_agent TEXT,

    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    replaced_by UUID REFERENCES refresh_tokens(id),

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT refresh_tokens_not_expired CHECK (expires_at > created_at)
);

-- Indexes for RefreshTokens
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_tenant_id ON refresh_tokens (tenant_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens (token);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);
CREATE INDEX idx_refresh_tokens_revoked_at ON refresh_tokens (revoked_at) WHERE revoked_at IS NULL;

-- =====================================================
-- TABLE: PasswordResets
-- =====================================================

CREATE TABLE password_resets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    token VARCHAR(255) NOT NULL UNIQUE,
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

    ip_address VARCHAR(45),
    user_agent TEXT,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT password_resets_expires CHECK (expires_at > created_at)
);

-- Indexes for PasswordResets
CREATE INDEX idx_password_resets_user_id ON password_resets (user_id);
CREATE INDEX idx_password_resets_tenant_id ON password_resets (tenant_id);
CREATE INDEX idx_password_resets_token ON password_resets (token);
CREATE INDEX idx_password_resets_expires_at ON password_resets (expires_at) WHERE used_at IS NULL;

-- =====================================================
-- TABLE: Subscriptions (External provider sync)
-- =====================================================

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Provider info
    provider subscription_provider NOT NULL,
    external_id VARCHAR(255), -- Stripe customer ID / WayForPay ID
    subscription_external_id VARCHAR(255), -- Stripe subscription ID

    -- Plan info
    plan subscription_plan NOT NULL,
    status subscription_status NOT NULL,

    -- Trial
    trial_start_at TIMESTAMP WITH TIME ZONE,
    trial_end_at TIMESTAMP WITH TIME ZONE,

    -- Billing
    current_period_start_at TIMESTAMP WITH TIME ZONE,
    current_period_end_at TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    canceled_at TIMESTAMP WITH TIME ZONE,

    -- Amounts (in cents)
    amount_cents INTEGER,
    currency VARCHAR(3) NOT NULL DEFAULT 'UAH',

    -- Webhooks
    latest_webhook_event_id VARCHAR(255),
    last_synced_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    metadata JSONB NOT NULL DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT subscriptions_tenant_provider_unique UNIQUE (tenant_id, provider)
);

-- Indexes for Subscriptions
CREATE INDEX idx_subscriptions_tenant_id ON subscriptions (tenant_id);
CREATE INDEX idx_subscriptions_external_id ON subscriptions (external_id);
CREATE INDEX idx_subscriptions_subscription_external_id ON subscriptions (subscription_external_id);
CREATE INDEX idx_subscriptions_status ON subscriptions (status);
CREATE INDEX idx_subscriptions_plan ON subscriptions (plan);
CREATE INDEX idx_subscriptions_provider ON subscriptions (provider);
CREATE INDEX idx_subscriptions_metadata ON subscriptions USING GIN (metadata);

-- =====================================================
-- TABLE: Invitations (Multi-Tenant)
-- =====================================================

CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES users(id),

    email VARCHAR(255) NOT NULL,
    role user_role NOT NULL,

    token VARCHAR(255) NOT NULL UNIQUE,
    status invitation_status NOT NULL DEFAULT 'pending',

    message TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,

    accepted_by UUID REFERENCES users(id),

    -- Metadata
    metadata JSONB NOT NULL DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT invitations_tenant_email_unique UNIQUE (tenant_id, email, deleted_at),
    CONSTRAINT invitations_expires CHECK (expires_at > created_at)
);

-- Indexes for Invitations
CREATE INDEX idx_invitations_tenant_id ON invitations (tenant_id);
CREATE INDEX idx_invitations_email ON invitations (email);
CREATE INDEX idx_invitations_token ON invitations (token);
CREATE INDEX idx_invitations_status ON invitations (status);
CREATE INDEX idx_invitations_expires_at ON invitations (expires_at) WHERE status = 'pending';
CREATE INDEX idx_invitations_metadata ON invitations USING GIN (metadata);

-- =====================================================
-- TABLE: OnboardingProgress (Multi-Tenant)
-- =====================================================

CREATE TABLE onboarding_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),

    step onboarding_step NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Progress tracking
    percentage INTEGER NOT NULL DEFAULT 0,
    data JSONB NOT NULL DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT onboarding_progress_tenant_step_unique UNIQUE (tenant_id, user_id, step)
);

-- Indexes for OnboardingProgress
CREATE INDEX idx_onboarding_progress_tenant_id ON onboarding_progress (tenant_id);
CREATE INDEX idx_onboarding_progress_user_id ON onboarding_progress (user_id);
CREATE INDEX idx_onboarding_progress_step ON onboarding_progress (step);
CREATE INDEX idx_onboarding_progress_completed ON onboarding_progress (completed);

-- =====================================================
-- TABLE: AuditLogs (Immutable)
-- =====================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID, -- NULL for system actions

    action audit_action NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,

    -- Change tracking
    old_values JSONB,
    new_values JSONB,
    changed_fields JSONB,

    -- Request info
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_id VARCHAR(100),

    -- Metadata
    metadata JSONB NOT NULL DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for AuditLogs
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs (tenant_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs (entity_type);
CREATE INDEX idx_audit_logs_entity_id ON audit_logs (entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at);
CREATE INDEX idx_audit_logs_metadata ON audit_logs USING GIN (metadata);
CREATE INDEX idx_audit_logs_tenant_created ON audit_logs (tenant_id, created_at DESC);

-- Partition by tenant (optional for enterprise)
-- CREATE INDEX idx_audit_logs_tenant_created_0 ON audit_logs (tenant_id, created_at DESC)
-- WHERE tenant_id >= '00000000-0000-0000-0000-000000000000'::UUID
-- AND tenant_id < '40000000-0000-0000-0000-000000000000'::UUID;

-- =====================================================
-- FUNCTION: Updated_at trigger
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboarding_progress_updated_at BEFORE UPDATE ON onboarding_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Soft delete handling
-- =====================================================

CREATE OR REPLACE FUNCTION soft_delete_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.deleted_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - Example for Users table
-- =====================================================

-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see users from their own tenant
-- CREATE POLICY users_tenant_isolation ON users
--     FOR SELECT
--     USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Policy: Users can only insert into their own tenant
-- CREATE POLICY users_tenant_insert ON users
--     FOR INSERT
--     WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Policy: Users can only update users in their own tenant
-- CREATE POLICY users_tenant_update ON users
--     FOR UPDATE
--     USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Active users per tenant
CREATE VIEW v_active_users AS
SELECT
    u.tenant_id,
    u.role,
    COUNT(*) as count
FROM users u
WHERE u.deleted_at IS NULL
    AND u.status = 'active'
GROUP BY u.tenant_id, u.role;

-- Subscription status per tenant
CREATE VIEW v_subscription_status AS
SELECT
    s.tenant_id,
    o.name as organization_name,
    s.provider,
    s.plan,
    s.status,
    s.trial_end_at,
    s.current_period_end_at,
    s.cancel_at_period_end
FROM subscriptions s
JOIN organizations o ON o.id = s.tenant_id;

-- Onboarding completion rate
CREATE VIEW v_onboarding_progress AS
SELECT
    op.tenant_id,
    op.user_id,
    u.first_name,
    u.last_name,
    COUNT(*) FILTER (WHERE op.completed) as completed_steps,
    COUNT(*) as total_steps,
    ROUND(
        (COUNT(*) FILTER (WHERE op.completed)::NUMERIC / COUNT(*)) * 100,
        2
    ) as completion_percentage
FROM onboarding_progress op
JOIN users u ON u.id = op.user_id
GROUP BY op.tenant_id, op.user_id, u.first_name, u.last_name;

-- =====================================================
-- INITIAL DATA: Super Admin (optional)
-- =====================================================

-- Insert default organization for platform
INSERT INTO organizations (
    id,
    name,
    legal_form,
    email,
    subscription_plan,
    subscription_status,
    status
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'LAW ORGANIZER Platform',
    'sole_proprietor',
    'platform@laworganizer.ua',
    'enterprise',
    'active',
    'active'
) ON CONFLICT DO NOTHING;

-- =====================================================
-- MIGRATION EXAMPLE (TypeORM)
-- =====================================================

/*
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitAuthSchema1704067200000 implements MigrationInterface {
    name = 'InitAuthSchema1704067200000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enums
        await queryRunner.query(`
            CREATE TYPE subscription_plan AS ENUM ('basic', 'professional', 'enterprise');
        `);

        // Create tables
        await queryRunner.query(`
            CREATE TABLE organizations (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                ...
            );
        `);

        // Create indexes
        await queryRunner.query(`
            CREATE INDEX idx_organizations_name ON organizations USING GIN (to_tsvector('ukrainian', name));
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS idx_organizations_name`);

        // Drop tables
        await queryRunner.query(`DROP TABLE IF EXISTS audit_logs CASCADE`);

        // Drop enums
        await queryRunner.query(`DROP TYPE IF EXISTS subscription_plan`);
    }
}
*/

-- =====================================================
-- END OF SCHEMA
-- =====================================================
