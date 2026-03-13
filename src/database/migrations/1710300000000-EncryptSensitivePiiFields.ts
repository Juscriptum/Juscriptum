import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";
import {
  encryptFieldValue,
  isEncryptedValue,
} from "../../common/security/pii-protection";

type BackfillTarget = {
  tableName: string;
  columns: string[];
};

export class EncryptSensitivePiiFields1710300000000 implements MigrationInterface {
  name = "EncryptSensitivePiiFields1710300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.ensureTextColumns(queryRunner, "organizations", [
      "tax_number",
      "taxNumber",
      "phone",
      "address",
    ]);
    await this.ensureTextColumns(queryRunner, "users", [
      "phone",
      "mfa_secret",
      "mfaSecret",
      "bar_number",
      "barNumber",
    ]);
    await this.ensureTextColumns(queryRunner, "clients", [
      "inn",
      "secondary_phone",
      "secondaryPhone",
      "address",
      "postal_code",
      "postalCode",
      "passport_number",
      "passportNumber",
      "notes",
    ]);

    await this.backfillEncryptedColumns(queryRunner, {
      tableName: "organizations",
      columns: ["tax_number", "taxNumber", "phone", "address"],
    });
    await this.backfillEncryptedColumns(queryRunner, {
      tableName: "users",
      columns: ["phone", "mfa_secret", "mfaSecret", "bar_number", "barNumber"],
    });
    await this.backfillEncryptedColumns(queryRunner, {
      tableName: "clients",
      columns: [
        "inn",
        "secondary_phone",
        "secondaryPhone",
        "address",
        "postal_code",
        "postalCode",
        "passport_number",
        "passportNumber",
        "notes",
      ],
    });
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Encrypted backfill is intentionally irreversible in migrations.
  }

  private async ensureTextColumns(
    queryRunner: QueryRunner,
    tableName: string,
    columnCandidates: string[],
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    if (!table) {
      return;
    }

    for (const candidate of columnCandidates) {
      const column = table.findColumnByName(candidate);
      if (!column) {
        continue;
      }

      if (column.type === "text") {
        continue;
      }

      await queryRunner.changeColumn(
        table,
        column,
        new TableColumn({
          ...column,
          type: "text",
          length: "",
        }),
      );
    }
  }

  private async backfillEncryptedColumns(
    queryRunner: QueryRunner,
    target: BackfillTarget,
  ): Promise<void> {
    const table = await queryRunner.getTable(target.tableName);
    if (!table) {
      return;
    }

    const existingColumns = target.columns.filter((column) =>
      table.findColumnByName(column),
    );
    if (existingColumns.length === 0) {
      return;
    }

    const rows = await queryRunner.query(
      `SELECT id, ${existingColumns.map((column) => `"${column}"`).join(", ")} FROM "${target.tableName}"`,
    );

    for (const row of rows) {
      const updatedColumns: string[] = [];
      const parameters: unknown[] = [];

      for (const column of existingColumns) {
        const value = row[column];
        if (
          typeof value !== "string" ||
          value.length === 0 ||
          isEncryptedValue(value)
        ) {
          continue;
        }

        updatedColumns.push(`"${column}" = $${updatedColumns.length + 1}`);
        parameters.push(encryptFieldValue(value));
      }

      if (updatedColumns.length === 0) {
        continue;
      }

      parameters.push(row.id);

      await queryRunner.query(
        `UPDATE "${target.tableName}" SET ${updatedColumns.join(", ")} WHERE id = $${parameters.length}`,
        parameters,
      );
    }
  }
}
