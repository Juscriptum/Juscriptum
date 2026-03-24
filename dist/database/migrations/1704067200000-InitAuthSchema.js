"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "InitAuthSchema1704067200000", {
    enumerable: true,
    get: function() {
        return InitAuthSchema1704067200000;
    }
});
let InitAuthSchema1704067200000 = class InitAuthSchema1704067200000 {
    async up(queryRunner) {
        // Enable required extensions
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "btree_gin"`);
        // Create enums
        await queryRunner.query(`
            CREATE TYPE subscription_plan AS ENUM ('basic', 'professional', 'enterprise')
        `);
        await queryRunner.query(`
            CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'unpaid')
        `);
        await queryRunner.query(`
            CREATE TYPE subscription_provider AS ENUM ('stripe', 'wayforpay')
        `);
        await queryRunner.query(`
            CREATE TYPE user_role AS ENUM ('super_admin', 'organization_owner', 'organization_admin', 'lawyer', 'assistant', 'accountant')
        `);
        await queryRunner.query(`
            CREATE TYPE user_status AS ENUM ('pending', 'active', 'suspended', 'deleted')
        `);
        await queryRunner.query(`
            CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked')
        `);
        await queryRunner.query(`
            CREATE TYPE organization_status AS ENUM ('provisioning', 'active', 'suspended', 'deleted')
        `);
        await queryRunner.query(`
            CREATE TYPE legal_form AS ENUM ('sole_proprietor', 'llc', 'joint_stock', 'partnership', 'other')
        `);
        await queryRunner.query(`
            CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'permission_change')
        `);
        await queryRunner.query(`
            CREATE TYPE onboarding_step AS ENUM ('organization_details', 'user_profile', 'subscription_setup', 'team_invitation', 'first_case_created')
        `);
        // Create organizations table
        await queryRunner.query(`
            CREATE TABLE organizations (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                legal_form legal_form NOT NULL DEFAULT 'sole_proprietor',
                edrpou VARCHAR(10),
                tax_number VARCHAR(12),
                address TEXT,
                city VARCHAR(100),
                region VARCHAR(100),
                country VARCHAR(2) DEFAULT 'UA',
                phone VARCHAR(20),
                email VARCHAR(255) NOT NULL,
                website VARCHAR(255),
                subscription_plan subscription_plan NOT NULL DEFAULT 'basic',
                subscription_status subscription_status NOT NULL DEFAULT 'trialing',
                trial_end_at TIMESTAMP WITH TIME ZONE,
                current_period_end_at TIMESTAMP WITH TIME ZONE,
                max_users INTEGER NOT NULL DEFAULT 1,
                custom_domain VARCHAR(255),
                mfa_required BOOLEAN NOT NULL DEFAULT FALSE,
                sso_enabled BOOLEAN NOT NULL DEFAULT FALSE,
                audit_retention_days INTEGER NOT NULL DEFAULT 90,
                status organization_status NOT NULL DEFAULT 'provisioning',
                settings JSONB NOT NULL DEFAULT '{}',
                metadata JSONB NOT NULL DEFAULT '{}',
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                deleted_at TIMESTAMP WITH TIME ZONE,
                CONSTRAINT organizations_email_unique UNIQUE (email, deleted_at),
                CONSTRAINT organizations_edrpou_unique UNIQUE (edrpou, deleted_at)
            )
        `);
        // Create organizations indexes
        await queryRunner.query(`
            CREATE INDEX idx_organizations_email ON organizations (email) WHERE deleted_at IS NULL
        `);
        await queryRunner.query(`
            CREATE INDEX idx_organizations_edrpou ON organizations (edrpou) WHERE deleted_at IS NULL
        `);
        await queryRunner.query(`
            CREATE INDEX idx_organizations_status ON organizations (status)
        `);
        await queryRunner.query(`
            CREATE INDEX idx_organizations_subscription_status ON organizations (subscription_status)
        `);
        await queryRunner.query(`
            CREATE INDEX idx_organizations_settings ON organizations USING GIN (settings)
        `);
        await queryRunner.query(`
            CREATE INDEX idx_organizations_metadata ON organizations USING GIN (metadata)
        `);
        // Create users table
        await queryRunner.query(`
            CREATE TABLE users (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                patronymic VARCHAR(100),
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                password_hash VARCHAR(255) NOT NULL,
                salt VARCHAR(255) NOT NULL,
                mfa_secret VARCHAR(255),
                mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
                mfa_backup_codes JSONB,
                role user_role NOT NULL,
                status user_status NOT NULL DEFAULT 'pending',
                position VARCHAR(100),
                avatar_url TEXT,
                bar_number VARCHAR(20),
                specialties JSONB,
                languages JSONB,
                email_verified BOOLEAN NOT NULL DEFAULT FALSE,
                email_verified_at TIMESTAMP WITH TIME ZONE,
                email_verification_token VARCHAR(255),
                password_reset_token VARCHAR(255),
                password_reset_expires_at TIMESTAMP WITH TIME ZONE,
                last_password_change_at TIMESTAMP WITH TIME ZONE,
                last_login_at TIMESTAMP WITH TIME ZONE,
                last_login_ip VARCHAR(45),
                failed_login_attempts INTEGER NOT NULL DEFAULT 0,
                locked_until TIMESTAMP WITH TIME ZONE,
                preferences JSONB NOT NULL DEFAULT '{}',
                metadata JSONB NOT NULL DEFAULT '{}',
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                deleted_at TIMESTAMP WITH TIME ZONE,
                created_by UUID,
                updated_by UUID,
                CONSTRAINT users_tenant_email_unique UNIQUE (tenant_id, email, deleted_at),
                CONSTRAINT users_role_check CHECK (
                    role IN ('super_admin', 'organization_owner', 'organization_admin', 'lawyer', 'assistant', 'accountant')
                )
            )
        `);
        // Create users indexes
        await queryRunner.query(`
            CREATE INDEX idx_users_tenant_id ON users (tenant_id) WHERE deleted_at IS NULL
        `);
        await queryRunner.query(`
            CREATE INDEX idx_users_email ON users (email) WHERE deleted_at IS NULL
        `);
        await queryRunner.query(`
            CREATE INDEX idx_users_role ON users (role)
        `);
        await queryRunner.query(`
            CREATE INDEX idx_users_status ON users (status)
        `);
        await queryRunner.query(`
            CREATE INDEX idx_users_tenant_role ON users (tenant_id, role) WHERE deleted_at IS NULL
        `);
        await queryRunner.query(`
            CREATE INDEX idx_users_preferences ON users USING GIN (preferences)
        `);
        await queryRunner.query(`
            CREATE INDEX idx_users_metadata ON users USING GIN (metadata)
        `);
        // Create refresh_tokens table
        await queryRunner.query(`
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
            )
        `);
        await queryRunner.query(`
            CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id)
        `);
        await queryRunner.query(`
            CREATE INDEX idx_refresh_tokens_tenant_id ON refresh_tokens (tenant_id)
        `);
        await queryRunner.query(`
            CREATE INDEX idx_refresh_tokens_token ON refresh_tokens (token)
        `);
        await queryRunner.query(`
            CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens (expires_at)
        `);
        // Create password_resets table
        await queryRunner.query(`
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
            )
        `);
        await queryRunner.query(`
            CREATE INDEX idx_password_resets_user_id ON password_resets (user_id)
        `);
        await queryRunner.query(`
            CREATE INDEX idx_password_resets_tenant_id ON password_resets (tenant_id)
        `);
        await queryRunner.query(`
            CREATE INDEX idx_password_resets_token ON password_resets (token)
        `);
        await queryRunner.query(`
            CREATE INDEX idx_password_resets_expires_at ON password_resets (expires_at) WHERE used_at IS NULL
        `);
        // Create subscriptions table
        await queryRunner.query(`
            CREATE TABLE subscriptions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
                provider subscription_provider NOT NULL,
                external_id VARCHAR(255),
                subscription_external_id VARCHAR(255),
                plan subscription_plan NOT NULL,
                status subscription_status NOT NULL,
                trial_start_at TIMESTAMP WITH TIME ZONE,
                trial_end_at TIMESTAMP WITH TIME ZONE,
                current_period_start_at TIMESTAMP WITH TIME ZONE,
                current_period_end_at TIMESTAMP WITH TIME ZONE,
                cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
                canceled_at TIMESTAMP WITH TIME ZONE,
                amount_cents INTEGER,
                currency VARCHAR(3) NOT NULL DEFAULT 'UAH',
                latest_webhook_event_id VARCHAR(255),
                last_synced_at TIMESTAMP WITH TIME ZONE,
                metadata JSONB NOT NULL DEFAULT '{}',
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                CONSTRAINT subscriptions_tenant_provider_unique UNIQUE (tenant_id, provider)
            )
        `);
        await queryRunner.query(`
            CREATE INDEX idx_subscriptions_tenant_id ON subscriptions (tenant_id)
        `);
        await queryRunner.query(`
            CREATE INDEX idx_subscriptions_external_id ON subscriptions (external_id)
        `);
        await queryRunner.query(`
            CREATE INDEX idx_subscriptions_status ON subscriptions (status)
        `);
        await queryRunner.query(`
            CREATE INDEX idx_subscriptions_plan ON subscriptions (plan)
        `);
        // Create invitations table
        await queryRunner.query(`
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
                metadata JSONB NOT NULL DEFAULT '{}',
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                CONSTRAINT invitations_expires CHECK (expires_at > created_at)
            )
        `);
        await queryRunner.query(`
            CREATE INDEX idx_invitations_tenant_id ON invitations (tenant_id)
        `);
        await queryRunner.query(`
            CREATE INDEX idx_invitations_email ON invitations (email)
        `);
        await queryRunner.query(`
            CREATE INDEX idx_invitations_token ON invitations (token)
        `);
        await queryRunner.query(`
            CREATE INDEX idx_invitations_status ON invitations (status)
        `);
        await queryRunner.query(`
            CREATE INDEX idx_invitations_expires_at ON invitations (expires_at) WHERE status = 'pending'
        `);
        // Create onboarding_progress table
        await queryRunner.query(`
            CREATE TABLE onboarding_progress (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id),
                step onboarding_step NOT NULL,
                completed BOOLEAN NOT NULL DEFAULT FALSE,
                completed_at TIMESTAMP WITH TIME ZONE,
                percentage INTEGER NOT NULL DEFAULT 0,
                data JSONB NOT NULL DEFAULT '{}',
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                CONSTRAINT onboarding_progress_tenant_step_unique UNIQUE (tenant_id, user_id, step)
            )
        `);
        await queryRunner.query(`
            CREATE INDEX idx_onboarding_progress_tenant_id ON onboarding_progress (tenant_id)
        `);
        await queryRunner.query(`
            CREATE INDEX idx_onboarding_progress_user_id ON onboarding_progress (user_id)
        `);
        await queryRunner.query(`
            CREATE INDEX idx_onboarding_progress_step ON onboarding_progress (step)
        `);
        await queryRunner.query(`
            CREATE INDEX idx_onboarding_progress_completed ON onboarding_progress (completed)
        `);
        // Create audit_logs table
        await queryRunner.query(`
            CREATE TABLE audit_logs (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
                user_id UUID,
                action audit_action NOT NULL,
                entity_type VARCHAR(100) NOT NULL,
                entity_id UUID,
                old_values JSONB,
                new_values JSONB,
                changed_fields JSONB,
                ip_address VARCHAR(45),
                user_agent TEXT,
                request_id VARCHAR(100),
                metadata JSONB NOT NULL DEFAULT '{}',
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
            )
        `);
        await queryRunner.query(`
            CREATE INDEX idx_audit_logs_tenant_id ON audit_logs (tenant_id)
        `);
        await queryRunner.query(`
            CREATE INDEX idx_audit_logs_user_id ON audit_logs (user_id)
        `);
        await queryRunner.query(`
            CREATE INDEX idx_audit_logs_action ON audit_logs (action)
        `);
        await queryRunner.query(`
            CREATE INDEX idx_audit_logs_entity_type ON audit_logs (entity_type)
        `);
        await queryRunner.query(`
            CREATE INDEX idx_audit_logs_entity_id ON audit_logs (entity_id)
        `);
        await queryRunner.query(`
            CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at)
        `);
        await queryRunner.query(`
            CREATE INDEX idx_audit_logs_metadata ON audit_logs USING GIN (metadata)
        `);
        await queryRunner.query(`
            CREATE INDEX idx_audit_logs_tenant_created ON audit_logs (tenant_id, created_at DESC)
        `);
        // Create trigger function
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql
        `);
        // Apply triggers
        await queryRunner.query(`
            CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
        `);
        await queryRunner.query(`
            CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
        `);
        await queryRunner.query(`
            CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
        `);
        await queryRunner.query(`
            CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON invitations
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
        `);
        await queryRunner.query(`
            CREATE TRIGGER update_onboarding_progress_updated_at BEFORE UPDATE ON onboarding_progress
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
        `);
        // Insert default platform organization
        await queryRunner.query(`
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
            ) ON CONFLICT DO NOTHING
        `);
    }
    async down(queryRunner) {
        // Drop triggers
        await queryRunner.query(`DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS update_users_updated_at ON users`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS update_invitations_updated_at ON invitations`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS update_onboarding_progress_updated_at ON onboarding_progress`);
        // Drop trigger function
        await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column`);
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS idx_audit_logs_tenant_created`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_audit_logs_metadata`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_audit_logs_created_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_audit_logs_entity_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_audit_logs_entity_type`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_audit_logs_action`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_audit_logs_user_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_audit_logs_tenant_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_onboarding_progress_completed`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_onboarding_progress_step`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_onboarding_progress_user_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_onboarding_progress_tenant_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_invitations_expires_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_invitations_status`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_invitations_token`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_invitations_email`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_invitations_tenant_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_subscriptions_plan`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_subscriptions_status`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_subscriptions_external_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_subscriptions_tenant_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_password_resets_expires_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_password_resets_token`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_password_resets_tenant_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_password_resets_user_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_refresh_tokens_expires_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_refresh_tokens_token`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_refresh_tokens_tenant_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_refresh_tokens_user_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_metadata`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_preferences`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_tenant_role`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_status`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_role`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_email`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_tenant_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_organizations_metadata`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_organizations_settings`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_organizations_subscription_status`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_organizations_status`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_organizations_edrpou`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_organizations_email`);
        // Drop tables (in reverse order due to foreign keys)
        await queryRunner.query(`DROP TABLE IF EXISTS audit_logs CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS onboarding_progress CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS invitations CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS subscriptions CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS password_resets CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS refresh_tokens CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS users CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS organizations CASCADE`);
        // Drop enums
        await queryRunner.query(`DROP TYPE IF EXISTS onboarding_step`);
        await queryRunner.query(`DROP TYPE IF EXISTS audit_action`);
        await queryRunner.query(`DROP TYPE IF EXISTS legal_form`);
        await queryRunner.query(`DROP TYPE IF EXISTS organization_status`);
        await queryRunner.query(`DROP TYPE IF EXISTS invitation_status`);
        await queryRunner.query(`DROP TYPE IF EXISTS user_status`);
        await queryRunner.query(`DROP TYPE IF EXISTS user_role`);
        await queryRunner.query(`DROP TYPE IF EXISTS subscription_provider`);
        await queryRunner.query(`DROP TYPE IF EXISTS subscription_status`);
        await queryRunner.query(`DROP TYPE IF EXISTS subscription_plan`);
        // Drop extensions
        await queryRunner.query(`DROP EXTENSION IF EXISTS "btree_gin"`);
        await queryRunner.query(`DROP EXTENSION IF EXISTS "pgcrypto"`);
        await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
    }
    constructor(){
        this.name = "InitAuthSchema1704067200000";
    }
};

//# sourceMappingURL=1704067200000-InitAuthSchema.js.map