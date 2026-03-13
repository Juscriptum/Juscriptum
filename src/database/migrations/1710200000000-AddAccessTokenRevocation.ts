import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAccessTokenRevocation1710200000000 implements MigrationInterface {
  name = "AddAccessTokenRevocation1710200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS session_invalid_before TIMESTAMP WITH TIME ZONE
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS revoked_access_tokens (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        jti VARCHAR(255) NOT NULL UNIQUE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        reason VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_revoked_access_tokens_user_id
      ON revoked_access_tokens (user_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_revoked_access_tokens_tenant_id
      ON revoked_access_tokens (tenant_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_revoked_access_tokens_expires_at
      ON revoked_access_tokens (expires_at)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_revoked_access_tokens_expires_at
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_revoked_access_tokens_tenant_id
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_revoked_access_tokens_user_id
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS revoked_access_tokens
    `);
    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS session_invalid_before
    `);
  }
}
