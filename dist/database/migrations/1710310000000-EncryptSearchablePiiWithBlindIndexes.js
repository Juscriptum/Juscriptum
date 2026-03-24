"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "EncryptSearchablePiiWithBlindIndexes1710310000000", {
    enumerable: true,
    get: function() {
        return EncryptSearchablePiiWithBlindIndexes1710310000000;
    }
});
const _piiprotection = require("../../common/security/pii-protection");
let EncryptSearchablePiiWithBlindIndexes1710310000000 = class EncryptSearchablePiiWithBlindIndexes1710310000000 {
    async up(queryRunner) {
        await this.addColumnIfMissing(queryRunner, "organizations", "email_blind_index", "VARCHAR(64)");
        await this.addColumnIfMissing(queryRunner, "users", "email_blind_index", "VARCHAR(64)");
        await this.addColumnIfMissing(queryRunner, "clients", "email_blind_index", "VARCHAR(64)");
        await this.addColumnIfMissing(queryRunner, "clients", "phone_blind_index", "VARCHAR(64)");
        await this.addColumnIfMissing(queryRunner, "clients", "edrpou_blind_index", "VARCHAR(64)");
        await this.addColumnIfMissing(queryRunner, "clients", "inn_blind_index", "VARCHAR(64)");
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
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_clients_inn_blind_index`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_clients_edrpou_blind_index`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_clients_phone_blind_index`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_clients_email_blind_index`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_tenant_email_blind_unique`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_organizations_email_blind_unique`);
    }
    async addColumnIfMissing(queryRunner, tableName, columnName, columnType) {
        const table = await queryRunner.getTable(tableName);
        if (table?.findColumnByName(columnName)) {
            return;
        }
        await queryRunner.query(`ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${columnType}`);
    }
    async backfillOrganizations(queryRunner) {
        const rows = await queryRunner.query(`SELECT id, email FROM organizations`);
        for (const row of rows){
            const updates = [];
            const params = [];
            if (typeof row.email === "string" && row.email.length > 0) {
                updates.push(`email_blind_index = $${updates.length + 1}`);
                params.push((0, _piiprotection.computeEmailBlindIndex)(row.email, "organization_email"));
                if (!(0, _piiprotection.isEncryptedValue)(row.email)) {
                    updates.push(`email = $${updates.length + 1}`);
                    params.push((0, _piiprotection.encryptFieldValue)(row.email));
                }
            }
            if (updates.length === 0) {
                continue;
            }
            params.push(row.id);
            await queryRunner.query(`UPDATE organizations SET ${updates.join(", ")} WHERE id = $${params.length}`, params);
        }
    }
    async backfillUsers(queryRunner) {
        const rows = await queryRunner.query(`SELECT id, email FROM users`);
        for (const row of rows){
            const updates = [];
            const params = [];
            if (typeof row.email === "string" && row.email.length > 0) {
                updates.push(`email_blind_index = $${updates.length + 1}`);
                params.push((0, _piiprotection.computeEmailBlindIndex)(row.email, "user_email"));
                if (!(0, _piiprotection.isEncryptedValue)(row.email)) {
                    updates.push(`email = $${updates.length + 1}`);
                    params.push((0, _piiprotection.encryptFieldValue)(row.email));
                }
            }
            if (updates.length === 0) {
                continue;
            }
            params.push(row.id);
            await queryRunner.query(`UPDATE users SET ${updates.join(", ")} WHERE id = $${params.length}`, params);
        }
    }
    async backfillClients(queryRunner) {
        const rows = await queryRunner.query(`SELECT id, email, phone, edrpou, inn FROM clients`);
        for (const row of rows){
            const updates = [];
            const params = [];
            if (typeof row.email === "string" && row.email.length > 0) {
                updates.push(`email_blind_index = $${updates.length + 1}`);
                params.push((0, _piiprotection.computeEmailBlindIndex)(row.email, "client_email"));
                if (!(0, _piiprotection.isEncryptedValue)(row.email)) {
                    updates.push(`email = $${updates.length + 1}`);
                    params.push((0, _piiprotection.encryptFieldValue)(row.email));
                }
            }
            if (typeof row.phone === "string" && row.phone.length > 0) {
                updates.push(`phone_blind_index = $${updates.length + 1}`);
                params.push((0, _piiprotection.computePhoneBlindIndex)(row.phone));
                if (!(0, _piiprotection.isEncryptedValue)(row.phone)) {
                    updates.push(`phone = $${updates.length + 1}`);
                    params.push((0, _piiprotection.encryptFieldValue)(row.phone));
                }
            }
            if (typeof row.edrpou === "string" && row.edrpou.length > 0) {
                updates.push(`edrpou_blind_index = $${updates.length + 1}`);
                params.push((0, _piiprotection.computeIdentifierBlindIndex)(row.edrpou, "client_edrpou"));
                if (!(0, _piiprotection.isEncryptedValue)(row.edrpou)) {
                    updates.push(`edrpou = $${updates.length + 1}`);
                    params.push((0, _piiprotection.encryptFieldValue)(row.edrpou));
                }
            }
            if (typeof row.inn === "string" && row.inn.length > 0) {
                updates.push(`inn_blind_index = $${updates.length + 1}`);
                params.push((0, _piiprotection.computeIdentifierBlindIndex)(row.inn, "client_inn"));
            }
            if (updates.length === 0) {
                continue;
            }
            params.push(row.id);
            await queryRunner.query(`UPDATE clients SET ${updates.join(", ")} WHERE id = $${params.length}`, params);
        }
    }
    constructor(){
        this.name = "EncryptSearchablePiiWithBlindIndexes1710310000000";
    }
};

//# sourceMappingURL=1710310000000-EncryptSearchablePiiWithBlindIndexes.js.map