import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
} from "typeorm";

/**
 * Migration: Add Ukrainian Legal Case Fields
 * Adds plaintiff, defendant, court fee, and proceeding stage fields
 */
export class AddUkrainianCaseFields1700000000000 implements MigrationInterface {
  name = "AddUkrainianCaseFields1700000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add proceeding_stage column
    await queryRunner.addColumn(
      "cases",
      new TableColumn({
        name: "proceeding_stage",
        type: "varchar",
        length: "100",
        isNullable: true,
      }),
    );

    // Add plaintiff_name column
    await queryRunner.addColumn(
      "cases",
      new TableColumn({
        name: "plaintiff_name",
        type: "varchar",
        length: "255",
        isNullable: true,
      }),
    );

    // Add defendant_name column
    await queryRunner.addColumn(
      "cases",
      new TableColumn({
        name: "defendant_name",
        type: "varchar",
        length: "255",
        isNullable: true,
      }),
    );

    // Add third_parties column
    await queryRunner.addColumn(
      "cases",
      new TableColumn({
        name: "third_parties",
        type: "text",
        isNullable: true,
      }),
    );

    // Add claim_amount column
    await queryRunner.addColumn(
      "cases",
      new TableColumn({
        name: "claim_amount",
        type: "decimal",
        precision: 12,
        scale: 2,
        isNullable: true,
      }),
    );

    // Add court_fee column
    await queryRunner.addColumn(
      "cases",
      new TableColumn({
        name: "court_fee",
        type: "decimal",
        precision: 12,
        scale: 2,
        isNullable: true,
      }),
    );

    // Add indexes for new filterable fields
    await queryRunner.createIndex(
      "cases",
      new TableIndex({
        name: "idx_cases_proceeding_stage",
        columnNames: ["proceeding_stage"],
      }),
    );

    // Update case_type enum to include Ukrainian categories
    // Note: PostgreSQL requires special handling for enum updates
    await queryRunner.query(`
            ALTER TABLE cases
            ALTER COLUMN case_type TYPE varchar(50)
        `);

    // Add comment describing the table
    await queryRunner.query(`
            COMMENT ON TABLE cases IS 'Legal cases (справи) - Ukrainian legal practice management'
        `);

    // Add column comments
    await queryRunner.query(`
            COMMENT ON COLUMN cases.proceeding_stage IS 'Стадія розгляду: first_instance, appeal, cassation, etc.'
        `);
    await queryRunner.query(`
            COMMENT ON COLUMN cases.plaintiff_name IS 'Позивач/Заявник - Plaintiff or petitioner name'
        `);
    await queryRunner.query(`
            COMMENT ON COLUMN cases.defendant_name IS 'Відповідач/Боржник - Defendant or debtor name'
        `);
    await queryRunner.query(`
            COMMENT ON COLUMN cases.third_parties IS 'Треті особи - Third parties in the case'
        `);
    await queryRunner.query(`
            COMMENT ON COLUMN cases.claim_amount IS 'Сума позову - Claim amount in UAH'
        `);
    await queryRunner.query(`
            COMMENT ON COLUMN cases.court_fee IS 'Судовий збір - Court fee in UAH'
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove indexes
    await queryRunner.dropIndex("cases", "idx_cases_proceeding_stage");

    // Remove columns
    await queryRunner.dropColumn("cases", "court_fee");
    await queryRunner.dropColumn("cases", "claim_amount");
    await queryRunner.dropColumn("cases", "third_parties");
    await queryRunner.dropColumn("cases", "defendant_name");
    await queryRunner.dropColumn("cases", "plaintiff_name");
    await queryRunner.dropColumn("cases", "proceeding_stage");

    // Revert case_type to original enum
    await queryRunner.query(`
            ALTER TABLE cases
            ALTER COLUMN case_type TYPE varchar
        `);
  }
}
