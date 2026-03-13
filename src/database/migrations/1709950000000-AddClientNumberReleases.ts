import { MigrationInterface, QueryRunner } from "typeorm";

export class AddClientNumberReleases1709950000000 implements MigrationInterface {
  name = "AddClientNumberReleases1709950000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS client_number_releases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        client_number INTEGER NOT NULL,
        released_from_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_client_number_releases_tenant_id
      ON client_number_releases(tenant_id);
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_client_number_releases_tenant_number
      ON client_number_releases(tenant_id, client_number);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_client_number_releases_tenant_number;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_client_number_releases_tenant_id;`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS client_number_releases;`);
  }
}
