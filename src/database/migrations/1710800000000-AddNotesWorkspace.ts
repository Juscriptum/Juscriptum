import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotesWorkspace1710800000000 implements MigrationInterface {
  name = "AddNotesWorkspace1710800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL DEFAULT '',
        content TEXT NOT NULL DEFAULT '',
        pinned BOOLEAN NOT NULL DEFAULT false,
        tags JSONB,
        access_scope VARCHAR(32) NOT NULL DEFAULT 'assigned',
        assigned_user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
        client_id UUID NULL REFERENCES clients(id) ON DELETE SET NULL,
        case_id UUID NULL REFERENCES cases(id) ON DELETE SET NULL,
        user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMP NULL,
        created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
        updated_by UUID NULL REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notes_tenant_id
      ON notes(tenant_id);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notes_case_id
      ON notes(case_id)
      WHERE deleted_at IS NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notes_client_id
      ON notes(client_id)
      WHERE deleted_at IS NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notes_user_id
      ON notes(user_id)
      WHERE deleted_at IS NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notes_assigned_user_id
      ON notes(assigned_user_id)
      WHERE deleted_at IS NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notes_updated_at
      ON notes(updated_at)
      WHERE deleted_at IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_notes_updated_at;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_notes_assigned_user_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_notes_user_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_notes_client_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_notes_case_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_notes_tenant_id;`);
    await queryRunner.query(`DROP TABLE IF EXISTS notes;`);
  }
}
