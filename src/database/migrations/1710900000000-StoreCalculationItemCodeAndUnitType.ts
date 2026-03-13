import { MigrationInterface, QueryRunner } from "typeorm";

export class StoreCalculationItemCodeAndUnitType1710900000000 implements MigrationInterface {
  name = "StoreCalculationItemCodeAndUnitType1710900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "calculation_items"
      ADD COLUMN "code" varchar(100)
    `);

    await queryRunner.query(`
      ALTER TABLE "calculation_items"
      ADD COLUMN "unit_type" varchar(20)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "calculation_items"
      DROP COLUMN "unit_type"
    `);

    await queryRunner.query(`
      ALTER TABLE "calculation_items"
      DROP COLUMN "code"
    `);
  }
}
