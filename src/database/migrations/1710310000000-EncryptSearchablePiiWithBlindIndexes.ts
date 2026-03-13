import { MigrationInterface, QueryRunner } from "typeorm";
import {
  computeEmailBlindIndex,
  computeIdentifierBlindIndex,
  computePhoneBlindIndex,
  encryptFieldValue,
  isEncryptedValue,
} from "../../common/security/pii-protection";

export class EncryptSearchablePiiWithBlindIndexes1710310000000 implements MigrationInterface {
  name = "EncryptSearchablePiiWithBlindIndexes1710310000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.addColumnIfMissing(
      queryRunner,
      "organizations",
      "email_blind_index",
      "VARCHAR(64)",
    );
    await this.addColumnIfMissing(
      queryRunner,
      "users",
      "email_blind_index",
      "VARCHAR(64)",
    );
    await this.addColumnIfMissing(
      queryRunner,
      "clients",
      "email_blind_index",
      "VARCHAR(64)",
    );
    await this.addColumnIfMissing(
      queryRunner,
      "clients",
      "phone_blind_index",
      "VARCHAR(64)",
    );
    await this.addColumnIfMissing(
      queryRunner,
      "clients",
      "edrpou_blind_index",
      "VARCHAR(64)",
    );
    await this.addColumnIfMissing(
      queryRunner,
      "clients",
      "inn_blind_index",
      "VARCHAR(64)",
    );

    await this.backfillOrganizations(queryRunner);
    await this.backfillUsers(queryRunner);
    await this.backfillClients(queryRunner);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_email_blind_unique
      ON organizations (email_blind_index)
      WHERE deleted_at IS NULL AND email_blind_index IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_tenant_email_blind_unique
      ON users (tenant_id, email_blind_index)
      WHERE deleted_at IS NULL AND email_blind_index IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_clients_email_blind_index
      ON clients (email_blind_index)
      WHERE deleted_at IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_clients_phone_blind_index
      ON clients (phone_blind_index)
      WHERE deleted_at IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_clients_edrpou_blind_index
      ON clients (edrpou_blind_index)
      WHERE deleted_at IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_clients_inn_blind_index
      ON clients (inn_blind_index)
      WHERE deleted_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_clients_inn_blind_index`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_clients_edrpou_blind_index`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_clients_phone_blind_index`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_clients_email_blind_index`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_users_tenant_email_blind_unique`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_organizations_email_blind_unique`,
    );
  }

  private async addColumnIfMissing(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
    columnType: string,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    if (table?.findColumnByName(columnName)) {
      return;
    }

    await queryRunner.query(
      `ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${columnType}`,
    );
  }

  private async backfillOrganizations(queryRunner: QueryRunner): Promise<void> {
    const rows = await queryRunner.query(`SELECT id, email FROM organizations`);

    for (const row of rows) {
      const updates: string[] = [];
      const params: unknown[] = [];

      if (typeof row.email === "string" && row.email.length > 0) {
        updates.push(`email_blind_index = $${updates.length + 1}`);
        params.push(computeEmailBlindIndex(row.email, "organization_email"));

        if (!isEncryptedValue(row.email)) {
          updates.push(`email = $${updates.length + 1}`);
          params.push(encryptFieldValue(row.email));
        }
      }

      if (updates.length === 0) {
        continue;
      }

      params.push(row.id);
      await queryRunner.query(
        `UPDATE organizations SET ${updates.join(", ")} WHERE id = $${params.length}`,
        params,
      );
    }
  }

  private async backfillUsers(queryRunner: QueryRunner): Promise<void> {
    const rows = await queryRunner.query(`SELECT id, email FROM users`);

    for (const row of rows) {
      const updates: string[] = [];
      const params: unknown[] = [];

      if (typeof row.email === "string" && row.email.length > 0) {
        updates.push(`email_blind_index = $${updates.length + 1}`);
        params.push(computeEmailBlindIndex(row.email, "user_email"));

        if (!isEncryptedValue(row.email)) {
          updates.push(`email = $${updates.length + 1}`);
          params.push(encryptFieldValue(row.email));
        }
      }

      if (updates.length === 0) {
        continue;
      }

      params.push(row.id);
      await queryRunner.query(
        `UPDATE users SET ${updates.join(", ")} WHERE id = $${params.length}`,
        params,
      );
    }
  }

  private async backfillClients(queryRunner: QueryRunner): Promise<void> {
    const rows = await queryRunner.query(
      `SELECT id, email, phone, edrpou, inn FROM clients`,
    );

    for (const row of rows) {
      const updates: string[] = [];
      const params: unknown[] = [];

      if (typeof row.email === "string" && row.email.length > 0) {
        updates.push(`email_blind_index = $${updates.length + 1}`);
        params.push(computeEmailBlindIndex(row.email, "client_email"));

        if (!isEncryptedValue(row.email)) {
          updates.push(`email = $${updates.length + 1}`);
          params.push(encryptFieldValue(row.email));
        }
      }

      if (typeof row.phone === "string" && row.phone.length > 0) {
        updates.push(`phone_blind_index = $${updates.length + 1}`);
        params.push(computePhoneBlindIndex(row.phone));

        if (!isEncryptedValue(row.phone)) {
          updates.push(`phone = $${updates.length + 1}`);
          params.push(encryptFieldValue(row.phone));
        }
      }

      if (typeof row.edrpou === "string" && row.edrpou.length > 0) {
        updates.push(`edrpou_blind_index = $${updates.length + 1}`);
        params.push(computeIdentifierBlindIndex(row.edrpou, "client_edrpou"));

        if (!isEncryptedValue(row.edrpou)) {
          updates.push(`edrpou = $${updates.length + 1}`);
          params.push(encryptFieldValue(row.edrpou));
        }
      }

      if (typeof row.inn === "string" && row.inn.length > 0) {
        updates.push(`inn_blind_index = $${updates.length + 1}`);
        params.push(computeIdentifierBlindIndex(row.inn, "client_inn"));
      }

      if (updates.length === 0) {
        continue;
      }

      params.push(row.id);
      await queryRunner.query(
        `UPDATE clients SET ${updates.join(", ")} WHERE id = $${params.length}`,
        params,
      );
    }
  }
}
