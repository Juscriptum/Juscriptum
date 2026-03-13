import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTrustVerificationWorkflow1710400000000 implements MigrationInterface {
  name = "AddTrustVerificationWorkflow1710400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "trust_verification_jobs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "subject_type" varchar(64) NOT NULL,
        "subject_id" uuid NOT NULL,
        "provider" varchar(32) NOT NULL,
        "job_kind" varchar(32) NOT NULL,
        "status" varchar(32) NOT NULL DEFAULT 'queued',
        "attempt_count" integer NOT NULL DEFAULT 0,
        "max_attempts" integer NOT NULL DEFAULT 3,
        "next_attempt_at" TIMESTAMP NOT NULL,
        "last_error" text,
        "payload" json,
        "result" json,
        "completed_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_trust_verification_jobs_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_trust_verification_jobs_tenant_id"
      ON "trust_verification_jobs" ("tenant_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_trust_verification_jobs_subject"
      ON "trust_verification_jobs" ("subject_type", "subject_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_trust_verification_jobs_status_next_attempt"
      ON "trust_verification_jobs" ("status", "next_attempt_at")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_trust_verification_jobs_provider"
      ON "trust_verification_jobs" ("provider")
    `);

    await queryRunner.query(`
      ALTER TABLE "document_signatures"
      ADD COLUMN "last_checked_at" TIMESTAMP NULL,
      ADD COLUMN "verification_attempts" integer NOT NULL DEFAULT 0,
      ADD COLUMN "next_check_at" TIMESTAMP NULL,
      ADD COLUMN "last_error" text NULL,
      ADD COLUMN "external_verification_id" varchar(255) NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_document_signatures_verification_status"
      ON "document_signatures" ("verification_status")
    `);

    await queryRunner.query(`
      ALTER TABLE "user_identities"
      ADD COLUMN "verification_attempts" integer NOT NULL DEFAULT 0,
      ADD COLUMN "next_check_at" TIMESTAMP NULL,
      ADD COLUMN "last_error" text NULL,
      ADD COLUMN "external_verification_id" varchar(255) NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_user_identities_status"
      ON "user_identities" ("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_user_identities_status"`,
    );
    await queryRunner.query(`
      ALTER TABLE "user_identities"
      DROP COLUMN "external_verification_id",
      DROP COLUMN "last_error",
      DROP COLUMN "next_check_at",
      DROP COLUMN "verification_attempts"
    `);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_document_signatures_verification_status"`,
    );
    await queryRunner.query(`
      ALTER TABLE "document_signatures"
      DROP COLUMN "external_verification_id",
      DROP COLUMN "last_error",
      DROP COLUMN "next_check_at",
      DROP COLUMN "verification_attempts",
      DROP COLUMN "last_checked_at"
    `);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_trust_verification_jobs_provider"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_trust_verification_jobs_status_next_attempt"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_trust_verification_jobs_subject"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_trust_verification_jobs_tenant_id"`,
    );
    await queryRunner.query(`DROP TABLE "trust_verification_jobs"`);
  }
}
