import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDocumentProcessingWorkflow1711100000000 implements MigrationInterface {
  name = "AddDocumentProcessingWorkflow1711100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS document_processing_jobs (
        id UUID PRIMARY KEY,
        tenant_id UUID NOT NULL,
        document_id UUID NOT NULL,
        source_document_id UUID NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'uploaded',
        ocr_enabled BOOLEAN NOT NULL DEFAULT true,
        ocr_language VARCHAR(64) NULL,
        processing_mode VARCHAR(32) NULL,
        target_page_format VARCHAR(32) NULL,
        page_count INTEGER NOT NULL DEFAULT 0,
        processed_page_count INTEGER NOT NULL DEFAULT 0,
        metadata JSON NULL,
        last_error TEXT NULL,
        completed_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS document_processing_artifacts (
        id UUID PRIMARY KEY,
        tenant_id UUID NOT NULL,
        document_id UUID NOT NULL,
        processing_job_id UUID NOT NULL,
        artifact_kind VARCHAR(48) NOT NULL,
        page_number INTEGER NULL,
        storage_path TEXT NULL,
        mime_type VARCHAR(128) NULL,
        text_content TEXT NULL,
        ocr_confidence FLOAT NULL,
        page_status VARCHAR(32) NULL,
        metadata JSON NULL,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_document_processing_jobs_tenant_id
      ON document_processing_jobs (tenant_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_document_processing_jobs_document_id
      ON document_processing_jobs (document_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_document_processing_jobs_status
      ON document_processing_jobs (status)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_document_processing_artifacts_tenant_id
      ON document_processing_artifacts (tenant_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_document_processing_artifacts_job_kind
      ON document_processing_artifacts (processing_job_id, artifact_kind)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_document_processing_artifacts_document_page
      ON document_processing_artifacts (document_id, page_number)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_document_processing_artifacts_document_page`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_document_processing_artifacts_job_kind`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_document_processing_artifacts_tenant_id`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_document_processing_jobs_status`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_document_processing_jobs_document_id`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_document_processing_jobs_tenant_id`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS document_processing_artifacts`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS document_processing_jobs`);
  }
}
