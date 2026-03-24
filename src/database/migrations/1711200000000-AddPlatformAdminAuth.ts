import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPlatformAdminAuth1711200000000 implements MigrationInterface {
  name = "AddPlatformAdminAuth1711200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE platform_admin_users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email TEXT NOT NULL,
        email_blind_index VARCHAR(64) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        salt VARCHAR(255) NOT NULL,
        role VARCHAR(64) NOT NULL DEFAULT 'platform_owner',
        status VARCHAR(32) NOT NULL DEFAULT 'active',
        permissions JSONB,
        mfa_secret TEXT,
        mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        mfa_backup_codes JSONB,
        last_login_at TIMESTAMP WITH TIME ZONE,
        last_login_ip VARCHAR(45),
        failed_login_attempts INTEGER NOT NULL DEFAULT 0,
        locked_until TIMESTAMP WITH TIME ZONE,
        last_password_change_at TIMESTAMP WITH TIME ZONE,
        session_invalid_before TIMESTAMP WITH TIME ZONE,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        CONSTRAINT platform_admin_users_role_check CHECK (
          role IN (
            'platform_owner',
            'platform_support_admin',
            'platform_security_admin',
            'platform_billing_admin'
          )
        ),
        CONSTRAINT platform_admin_users_status_check CHECK (
          status IN ('active', 'suspended', 'deleted')
        )
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_platform_admin_users_status
      ON platform_admin_users (status)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_platform_admin_users_role
      ON platform_admin_users (role)
    `);

    await queryRunner.query(`
      CREATE TABLE platform_admin_refresh_tokens (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        platform_admin_user_id UUID NOT NULL REFERENCES platform_admin_users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        device_info JSONB NOT NULL DEFAULT '{}',
        ip_address VARCHAR(45),
        user_agent TEXT,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        revoked_at TIMESTAMP WITH TIME ZONE,
        replaced_by UUID,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_platform_admin_refresh_tokens_user_id
      ON platform_admin_refresh_tokens (platform_admin_user_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_platform_admin_refresh_tokens_expires_at
      ON platform_admin_refresh_tokens (expires_at)
    `);

    await queryRunner.query(`
      CREATE TABLE platform_admin_revoked_access_tokens (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        jti VARCHAR(255) NOT NULL UNIQUE,
        platform_admin_user_id UUID NOT NULL REFERENCES platform_admin_users(id) ON DELETE CASCADE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        reason VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_platform_admin_revoked_access_tokens_user_id
      ON platform_admin_revoked_access_tokens (platform_admin_user_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_platform_admin_revoked_access_tokens_expires_at
      ON platform_admin_revoked_access_tokens (expires_at)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS platform_admin_revoked_access_tokens
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS platform_admin_refresh_tokens
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS platform_admin_users
    `);
  }
}
