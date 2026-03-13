import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRegistryCaseNumber1709960000000 implements MigrationInterface {
  name = "AddRegistryCaseNumber1709960000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE cases
      ADD COLUMN IF NOT EXISTS registry_case_number VARCHAR(100);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE cases
      DROP COLUMN IF EXISTS registry_case_number;
    `);
  }
}
