import { MigrationInterface, QueryRunner } from "typeorm";

export class AddScanSessionsWorkflow1711000000000 implements MigrationInterface {
  name = "AddScanSessionsWorkflow1711000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS scan_sessions (
        id UUID PRIMARY KEY,
        tenant_id UUID NOT NULL,
        case_id UUID NULL,
        client_id UUID NULL,
        created_by_user_id UUID NOT NULL,
        token_hash VARCHAR(128) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'created',
        mobile_url TEXT NOT NULL,
        desktop_url TEXT NULL,
        expires_at TIMESTAMP NOT NULL,
        started_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        pages_count INTEGER NOT NULL DEFAULT 0,
        uploaded_pages INTEGER NOT NULL DEFAULT 0,
        processed_pages INTEGER NOT NULL DEFAULT 0,
        total_bytes BIGINT NOT NULL DEFAULT 0,
        final_document_id UUID NULL,
        document_format VARCHAR(24) NOT NULL DEFAULT 'A4',
        destination_scope VARCHAR(24) NOT NULL DEFAULT 'root',
        ocr_status VARCHAR(32) NOT NULL DEFAULT 'pending',
        last_error TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS scan_pages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        scan_session_id UUID NOT NULL,
        page_number INTEGER NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'created',
        original_file_path TEXT NULL,
        processed_file_path TEXT NULL,
        thumbnail_path TEXT NULL,
        file_size BIGINT NOT NULL DEFAULT 0,
        width INTEGER NULL,
        height INTEGER NULL,
        rotation INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_scan_sessions_tenant_case
      ON scan_sessions (tenant_id, case_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_scan_sessions_created_by
      ON scan_sessions (created_by_user_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_scan_sessions_status
      ON scan_sessions (status)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_scan_pages_session_page
      ON scan_pages (scan_session_id, page_number)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_scan_pages_status
      ON scan_pages (status)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_scan_pages_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_scan_pages_session_page`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_scan_sessions_status`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_scan_sessions_created_by`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_scan_sessions_tenant_case`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS scan_pages`);
    await queryRunner.query(`DROP TABLE IF EXISTS scan_sessions`);
  }
}
