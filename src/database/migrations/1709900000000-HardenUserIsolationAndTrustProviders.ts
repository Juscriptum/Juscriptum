import { MigrationInterface, QueryRunner } from "typeorm";

export class HardenUserIsolationAndTrustProviders1709900000000 implements MigrationInterface {
  name = "HardenUserIsolationAndTrustProviders1709900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    await queryRunner.query(`
      ALTER TABLE cases
      ADD COLUMN IF NOT EXISTS access_scope VARCHAR(32) NOT NULL DEFAULT 'assigned';
    `);
    await queryRunner.query(`
      ALTER TABLE clients
      ADD COLUMN IF NOT EXISTS access_scope VARCHAR(32) NOT NULL DEFAULT 'assigned';
    `);
    await queryRunner.query(`
      ALTER TABLE documents
      ADD COLUMN IF NOT EXISTS access_scope VARCHAR(32) NOT NULL DEFAULT 'assigned';
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_cases_access_scope ON cases(access_scope);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_clients_access_scope ON clients(access_scope);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_documents_access_scope ON documents(access_scope);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_identities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider VARCHAR(32) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        external_subject_id VARCHAR(255) NOT NULL,
        display_name VARCHAR(255),
        certificate_serial_number VARCHAR(255),
        certificate_issuer VARCHAR(255),
        tax_id_hash VARCHAR(255),
        assurance_level VARCHAR(64),
        verified_at TIMESTAMP,
        last_checked_at TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_user_identities_tenant_id ON user_identities(tenant_id);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_user_identities_user_id ON user_identities(user_id);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_user_identities_provider ON user_identities(provider);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS document_signatures (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider VARCHAR(32) NOT NULL,
        verification_status VARCHAR(32) NOT NULL DEFAULT 'pending',
        signature_hash VARCHAR(255) NOT NULL,
        signature_algorithm VARCHAR(64),
        signed_payload_hash VARCHAR(255),
        certificate_serial_number VARCHAR(255),
        certificate_issuer VARCHAR(255),
        verified_at TIMESTAMP,
        signature_time TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_document_signatures_tenant_id ON document_signatures(tenant_id);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_document_signatures_document_id ON document_signatures(document_id);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_document_signatures_user_id ON document_signatures(user_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_document_signatures_user_id;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_document_signatures_document_id;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_document_signatures_tenant_id;`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS document_signatures;`);

    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_user_identities_provider;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_user_identities_user_id;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_user_identities_tenant_id;`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS user_identities;`);

    await queryRunner.query(`DROP INDEX IF EXISTS idx_documents_access_scope;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_clients_access_scope;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_cases_access_scope;`);

    await queryRunner.query(
      `ALTER TABLE documents DROP COLUMN IF EXISTS access_scope;`,
    );
    await queryRunner.query(
      `ALTER TABLE clients DROP COLUMN IF EXISTS access_scope;`,
    );
    await queryRunner.query(
      `ALTER TABLE cases DROP COLUMN IF EXISTS access_scope;`,
    );
  }
}
